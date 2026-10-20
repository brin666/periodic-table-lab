import { test, expect } from "@playwright/test";

test("a map loads only its own reviewed data and reuses it on return", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const packs: string[] = [];
  page.on("request", (request) => {
    const match = /knowledge-packs\.generated\/(\w+)\.json/.exec(request.url());
    if (match) packs.push(match[1]);
  });
  await page.goto("/");
  await expect(page.locator(".element-key")).toHaveCount(118);
  expect(packs).toEqual([]);
  await page.locator("#key-h").click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  expect(packs).toEqual(["h"]);
  await page.locator(".km-core-key").click();
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  expect(packs).toEqual(["h"]);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await page.locator("#key-na").click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  expect(packs).toEqual(["h", "na"]);
});

test("a failed element data chunk keeps recovery and other maps available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/knowledge-packs\.generated\/h\.json/, (route) =>
    route.abort(),
  );
  await page.goto("/#/element/h");
  await expect(page.getByRole("alert")).toHaveText("知识导图暂时未能加载。");
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await page.locator("#key-na").click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  await expect(page.locator(".km-core-key .element-symbol")).toHaveText("Na");
});

test("home defers both knowledge indexes and a pending map can be cancelled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let blocked = false;
  await page.route(
    /\/src\/components\/KnowledgePage\.tsx(?:\?.*)?$/,
    async (route) => {
      blocked = true;
      await gate;
      await route.continue();
    },
  );
  await page.goto("/");
  await expect(page.locator(".element-key")).toHaveCount(118);
  expect(
    requested.filter((url) =>
      /\/(KnowledgePage\.tsx|element-knowledge\.generated\.json|compound-discovery\.ts|inorganic-compounds\.ts)/.test(
        url,
      ),
    ),
  ).toEqual([]);
  await page.locator("#key-h").click();
  await expect.poll(() => blocked).toBe(true);
  await expect(page.locator("#key-h")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".table-page")).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await page.keyboard.press("Escape");
  await expect(page.locator("#key-h")).not.toHaveAttribute("aria-busy", "true");
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".table-page")).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await page.locator("#key-h").click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  await expect(page.locator(".km-core-key")).toBeVisible();
  await expect(page).toHaveURL(/#\/element\/h$/);
});

test("a failed direct knowledge import offers recovery and a working back control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/src\/components\/KnowledgePage\.tsx(?:\?.*)?$/, (route) =>
    route.abort(),
  );
  await page.goto("/#/element/h");
  await expect(page.getByRole("alert")).toHaveText("知识导图暂时未能加载。");
  await expect(
    page.getByRole("button", { name: "重新加载知识导图", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.locator(".table-page")).toBeVisible();
});

test("the core remains usable while a direct knowledge page is loading", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /\/src\/components\/KnowledgePage\.tsx(?:\?.*)?$/,
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  await page.goto("/#/element/h");
  await expect(
    page.getByRole("status").filter({ hasText: "正在加载知识导图" }),
  ).toBeVisible();
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".explore-page")).toBeVisible();
  await expect(page.locator(".km-camera")).toHaveCount(0);
});

test("delayed compound data uses the latest multi-element selection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    /\/src\/data\/compound-discovery\.ts(?:\?.*)?$/,
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  await page.goto("/");
  for (const [slot, id] of ["h", "o", "na"].entries()) {
    const trigger = page.locator(`[data-compound-slot="${slot}"]`);
    if (slot > 0) await expect(trigger).toHaveAccessibleName("选择下一种元素");
    await trigger.click();
    await page.locator(`#key-${id}`).click();
  }
  await expect(page.locator(".compound-workbench__results")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  await expect(page.locator(".compound-workbench__results")).toContainText(
    "正在查找化合物",
  );
  release();
  await expect(
    page.locator('[data-compound-result="sodium-hydroxide"]'),
  ).toBeVisible();
  await expect(page.locator('[data-compound-result="water"]')).toHaveCount(0);
});

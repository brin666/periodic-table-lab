import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
    localStorage.setItem("elements-reduced-motion", "true");
  });
});

test("a first visit defaults to Chinese even in an English-language browser", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US", reducedMotion: "reduce" });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4178/");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("button", { name: "中文", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("main h1")).toHaveText("元素周期表");
    expect(await page.evaluate(() => localStorage.getItem("element-atlas-language"))).toBe("zh");
    await expect(page).not.toHaveURL(/lang=en/);
  } finally {
    await context.close();
  }
});

test("switching language preserves the route and learning level, and survives reload", async ({
  page,
}) => {
  await page.goto("/#/element/h");
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveURL(/lang=en#\/element\/h$/);
  await expect(
    page.getByRole("button", { name: "Lower secondary", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".km-core-key")).toContainText("Hydrogen");
  await expect(page).toHaveTitle("Hydrogen H · Element Atlas");
  await page.reload();
  await expect(page.locator(".km-core-key")).toContainText("Hydrogen");
  await page.goto("/#/element/h");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".km-core-key")).toContainText("氢");
  await expect(page.locator(".km-card-open").first()).toBeVisible();
});

test("English mind-map details and original source records remain readable", async ({
  page,
}) => {
  await page.goto("/?lang=en#/element/h");
  await page.locator(".km-card-open").first().click();
  const dialog = page.locator(".km-card-dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await dialog.locator(".km-source-trigger").click();
  expect(await dialog.innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await page
    .getByRole("button", { name: "Close knowledge card", exact: true })
    .click();
  await page.getByRole("button", { name: /Sources & notes/ }).click();
  const sources = page.locator(".reading-dialog");
  await expect(sources).toBeVisible();
  expect(await sources.innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await expect(sources).toContainText("Textbook (Chinese)");
});

test("a language change during a map download still completes the selected navigation", async ({
  page,
}) => {
  await page.route("**/knowledge-packs.generated/h.json*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto("/");
  await page.locator("#key-h").click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/lang=en#\/element\/h$/);
  await expect(page.locator(".km-core-key")).toContainText("Hydrogen");
});

test("English mobile layouts contain their header and retain chemical formula and conditions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["", "/element/h/atom", "/element/h/substance/water"]) {
    await page.goto(`/?lang=en#${route}`);
    await expect(page.locator("main h1")).toBeAttached();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const header = page.locator(".site-header");
    expect((await header.innerText()).replace("中文", "")).not.toMatch(
      /[\u3400-\u9fff]/,
    );
    const boxes = await header
      .locator(".wordmark,.learning-switch,.header-right")
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }),
      );
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(391);
    }
  }
  await expect(page.locator("h1")).toHaveText("Water");
  const electrolysis = page.locator('[data-reaction-id="water-electrolysis"]');
  await expect(
    electrolysis.locator('.equation-condition[data-position="above"]'),
  ).toHaveText("Electrolysis");
  expect(
    (await electrolysis.locator(".reaction-formula").innerText()).replace(
      /\s/g,
      " ",
    ),
  ).toContain("H2O");
});

test("English feedback collects a short conversation and submits only to a mocked service", async ({
  page,
}) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route("**/api/feedback", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const payload = route.request().postDataJSON();
    payloads.push(payload);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: payload.id,
        number: 91,
        url: "https://github.com/brin666/periodic-table-feedback/issues/91",
      }),
    });
  });
  await page.goto("/?lang=en");
  await page.getByRole("button", { name: "Feedback", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue without a screenshot", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "Tell us about it" });
  await expect(chat).toBeVisible();
  const replies = [
    "I suggest adding a quiz to the element cards for revision.",
    "I would like short chemistry questions and explanations after each mind map.",
    "This would help me revise for a school chemistry test.",
    "The main inconvenience is switching between my notes and the page.",
    "No further details.",
  ];
  let count = 0;
  for (const reply of replies) {
    if (await page.locator(".feedback-chat-summary").isVisible()) break;
    const composer = page.getByRole("textbox", {
      name: "Reply to the feedback assistant",
      exact: true,
    });
    await composer.fill(reply);
    await composer.press("Enter");
    count++;
    await expect(chat.locator(".feedback-message--user")).toHaveCount(count);
  }
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  expect(count).toBeGreaterThanOrEqual(3);
  expect(count).toBeLessThanOrEqual(5);
  expect(await chat.innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await chat.getByRole("checkbox", { name: /public in GitHub Issues/ }).check();
  await chat
    .getByRole("button", { name: "Confirm and submit", exact: true })
    .click();
  await expect(
    chat.getByRole("link", { name: "View feedback on GitHub", exact: true }),
  ).toBeVisible();
  expect(payloads).toHaveLength(1);
  expect(payloads[0].type).toBe("suggestion");
  expect(payloads[0].consent).toBe(true);
});

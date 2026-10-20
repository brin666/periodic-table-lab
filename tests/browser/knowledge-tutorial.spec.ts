import { expect, test, type Page } from "@playwright/test";
import { knowledgeElementIds } from "../../src/data/knowledge-availability";
const disabledKey = "element-atlas:knowledge-tour-disabled:v1";
const dismissedKey = "element-atlas:knowledge-entry-dismissed:v2:h";
async function hint(page: Page, id = "h") {
  await page.goto("/#/element/" + id);
  const preview = page.locator('.km-tutorial[data-step="preview"]');
  await expect(preview).toBeVisible();
  await expect(preview.locator("img")).toHaveJSProperty("complete", true);
  return preview;
}
test("entry highlights the real key and previews its destination without a modal, cursor or camera tour", async ({
  page,
}) => {
  const preview = await hint(page);
  await expect(page.locator(".km-core-key")).toHaveAttribute(
    "data-tutorial-target",
    "true",
  );
  await expect(preview.locator("img")).toHaveAttribute(
    "src",
    /previews\/elements\/h\.jpg$/,
  );
  expect(await preview.innerText()).toBe("");
  await expect(
    page.locator(".km-tutorial-cursor,.km-tutorial button"),
  ).toHaveCount(0);
  const pose = await page
    .locator(".km-camera")
    .evaluate((n) => getComputedStyle(n).transform);
  await page.mouse.move(1200, 750);
  await page.waitForTimeout(150);
  expect(
    await page
      .locator(".km-camera")
      .evaluate((n) => getComputedStyle(n).transform),
  ).toBe(pose);
  await expect(page.locator(".km-tutorial")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/element\/h$/);
  expect(
    await page.evaluate((k) => sessionStorage.getItem(k), dismissedKey),
  ).toBe("1");
  await expect(page.locator(".km-core-key")).not.toHaveAttribute(
    "data-tutorial-target",
    "true",
  );
  await page.reload();
  await expect(
    page.locator('.knowledge-map[data-arriving="false"][data-revealed="2"]'),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator(".km-tutorial")).toHaveCount(0);
});
test("clicking the actual H during the hint enters its existing page in the same tab", async ({
  page,
}) => {
  await hint(page);
  const count = page.context().pages().length;
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await expect(page.locator(".explore-page")).toBeVisible();
  expect(page.context().pages()).toHaveLength(count);
});
test("legacy opt-out is respected, manual replay works and Escape dismisses without leaving the map", async ({
  page,
}) => {
  await page.addInitScript((k) => localStorage.setItem(k, "true"), disabledKey);
  await page.goto("/#/element/h");
  await expect(
    page.locator('.knowledge-map[data-arriving="false"][data-revealed="2"]'),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await expect(page.locator(".km-tutorial")).toHaveCount(0);
  await page.getByRole("button", { name: "新手教学", exact: true }).click();
  await expect(page.locator('.km-tutorial[data-step="preview"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".km-tutorial")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/element\/h$/);
  await page.locator(".km-core-key").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
});
test("real card interaction interrupts the hint and Escape still closes the card first", async ({
  page,
}) => {
  await hint(page);
  await page.locator("#km-card-h-water .km-card-open").click();
  await expect(page.locator(".km-tutorial")).toHaveCount(0);
  await expect(page.locator("dialog.km-card-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.km-card-dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/element\/h$/);
});
test("other elements preview their own existing exploration content", async ({
  page,
}) => {
  const preview = await hint(page, "na");
  await expect(preview.locator("img")).toHaveAttribute(
    "src",
    /previews\/elements\/na\.jpg$/,
  );
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/na\/atom$/);
});

test("all 25 key elements show their own entry hint in the same browsing session", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.addInitScript(() => {
    sessionStorage.setItem("element-atlas:knowledge-tour-dismissed:v1", "1");
  });
  await page.goto("/#/element/h");
  for (const id of knowledgeElementIds) {
    await test.step(id, async () => {
      if (id !== "h") await page.locator(`#key-${id}`).click();
      const preview = page.locator('.km-tutorial[data-step="preview"]');
      await expect(preview).toBeVisible();
      await expect(page.locator(".knowledge-map")).toHaveAttribute(
        "data-arriving",
        "false",
      );
      await expect(page.locator(".km-core-key")).toHaveAttribute(
        "data-tutorial-target",
        "true",
      );
      await expect(preview.locator("img")).toHaveAttribute(
        "src",
        new RegExp(`/previews/elements/${id}\\.jpg$`),
      );
      await expect
        .poll(() =>
          preview
            .locator("img")
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      await page.locator(".km-core-key").click();
      await expect(page).toHaveURL(new RegExp(`#/element/${id}/atom$`));
      expect(
        await page.evaluate(
          (id) =>
            sessionStorage.getItem(
              `element-atlas:knowledge-entry-dismissed:v2:${id}`,
            ),
          id,
        ),
      ).toBe("1");
      await page
        .getByRole("button", { name: "元素之间，回到周期表", exact: true })
        .click();
      await expect(page.locator(`#key-${id}`)).toBeVisible();
    });
  }
  expect(page.context().pages()).toHaveLength(1);
});

for (const storageAvailable of [true, false]) {
  test(`visiting one map does not consume another map's hint and revisits stay quiet (storage ${storageAvailable})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (!storageAvailable)
      await page.addInitScript(() => {
        Object.defineProperty(window, "sessionStorage", {
          get() {
            throw new DOMException("Blocked", "SecurityError");
          },
        });
      });
    await hint(page);
    await page.locator(".km-core-key").click();
    await expect(page).toHaveURL(/#\/element\/h\/atom$/);
    await page
      .getByRole("button", { name: "返回思维导图", exact: true })
      .click();
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-tutorial",
      "none",
    );
    await page.getByRole("button", { name: "返回周期表", exact: true }).click();
    await page.locator("#key-na").click();
    await expect(
      page.locator('.km-tutorial[data-step="preview"]'),
    ).toBeVisible();
    await expect(page.locator(".km-tutorial img")).toHaveAttribute(
      "src",
      /\/na\.jpg$/,
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-tutorial",
      "none",
    );
    await page.getByRole("button", { name: "返回周期表", exact: true }).click();
    await page.locator("#key-h").click();
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-tutorial",
      "none",
    );
    await page.getByRole("button", { name: "新手教学", exact: true }).click();
    await expect(
      page.locator('.km-tutorial[data-step="preview"]'),
    ).toBeVisible();
    await expect(page.locator(".km-tutorial img")).toHaveAttribute(
      "src",
      /\/h\.jpg$/,
    );
  });
}

for (const width of [390, 320])
  test(
    "reduced motion hint fits " + width + "px and leaves the key tappable",
    async ({ browser, baseURL }) => {
      const context = await browser.newContext({
        baseURL,
        viewport: { width, height: 844 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        const preview = await hint(page);
        const box = (await preview.boundingBox())!,
          key = (await page.locator(".km-core-key").boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(844);
        expect(
          box.y >= key.y + key.height ||
            box.y + box.height <= key.y ||
            box.x >= key.x + key.width ||
            box.x + box.width <= key.x,
        ).toBe(true);
        expect(
          await preview.evaluate((n) => getComputedStyle(n).transform),
        ).toBe("none");
        await page.locator(".km-core-key").tap();
        await expect(page).toHaveURL(/#\/element\/h\/atom$/);
      } finally {
        await context.close();
      }
    },
  );

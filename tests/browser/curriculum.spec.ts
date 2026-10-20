import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getFocusElementIds } from "../../src/data/curriculum";

test("default senior includes all knowledge; switching filters the current material in place", async ({
  page,
}) => {
  await page.goto("/#/element/h/atom");
  await expect(
    page.getByRole("button", { name: "高中版", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "电子构型", exact: true }),
  ).toBeVisible();
  await page.locator("#substance-water").click();
  await expect(page.locator(".reaction")).toHaveCount(4);
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await expect(page).toHaveURL(/\/substance\/water$/);
  await expect(page.locator(".reaction")).toHaveCount(3);
  await expect(
    page.getByText("酸性条件下的氧化还原反应", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "高中版", exact: true }).click();
  await expect(page.locator(".reaction")).toHaveCount(4);
  await page.getByRole("button", { name: "返回氢的探索", exact: true }).click();
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "电子构型", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".atom-svg")).toBeVisible();
  await expect(
    page.locator(".foundation-sources .source-details"),
  ).toBeVisible();
  await page.locator("#substance-hydrogen-peroxide").click();
  await expect(page.locator(".reaction")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "初中版", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "高中版", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("junior mode keeps basic materials under senior stories and prevents advanced detail routes", async ({
  page,
}) => {
  await page.goto("/#/element/n/atom");
  await page.locator("#substance-ammonia").click();
  await expect(page.locator(".substance-info h1")).toHaveText("氨");
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/n\/atom$/);
  await expect(page.locator("#substance-nitrogen")).toBeVisible();
  await expect(page.locator("#substance-ammonia")).toHaveCount(0);
  await page.evaluate(() => {
    history.pushState(null, "", "#/element/n/substance/ammonia");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/#\/element\/n\/atom$/);
  await expect(page.locator(".substance-info")).toHaveCount(0);
  await page.getByRole("button", { name: "高中版", exact: true }).click();
  await expect(page.locator("#substance-ammonia")).toBeVisible();
  await page.locator("#substance-ammonia").click();
  await expect(page.locator(".reaction")).toHaveCount(1);
  await expect(
    page.locator(".substance-badges .level-label, .reaction .level-label"),
  ).toHaveCount(0);
  await expect(
    page.locator(
      '.reaction[data-reaction-id="haber-synthesis"] .equation-sign',
    ),
  ).toHaveText("⇌");
});

test("version-aware focus toggle preserves all 118 positions and return state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await expect(page.locator(".has-story")).toHaveCount(
    getFocusElementIds("junior").size,
  );
  await page.getByRole("button", { name: /^重点探索/ }).click();
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(
    getFocusElementIds("junior").size,
  );
  await page.locator("#key-fe").click();
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/fe\/atom$/);
  await expect(page.locator("#substance-iron-ii-iii-oxide")).toBeVisible();
  await expect(page.locator(".configuration-note")).toHaveCount(0);
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/fe$/);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.getByRole("button", { name: /^重点探索/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "初中版", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "高中版", exact: true }).click();
  await expect(page.locator(".has-story")).toHaveCount(25);
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(25);
  await page.getByRole("button", { name: /^重点探索/ }).click();
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(118);
});

test("rapid mode changes, shell state and return stay stable during scene transitions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/#/element/o/atom");
  await page
    .getByRole("button", { name: "第1层 2个电子", exact: true })
    .click();
  await page.locator("#substance-water").click();
  for (let i = 0; i < 10; i++)
    await page
      .getByRole("button", {
        name: i % 2 === 0 ? "初中版" : "高中版",
        exact: true,
      })
      .click({ force: true });
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator(".reaction")).toHaveCount(4);
  await page.getByRole("button", { name: "返回氧的探索", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "第1层 2个电子", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("junior version switch is keyboard/touch accessible and fits 320px phones", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 320, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/");
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "初中版", exact: true }).tap();
    for (const name of ["初中版", "高中版"]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeGreaterThanOrEqual(width <= 640 ? 44 : 32);
    }
    const header = await page
      .locator(".site-header")
      .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    expect(header.scroll).toBeLessThanOrEqual(header.width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/#/element/h",
    "/#/element/h/atom",
    "/#/element/h/substance/water",
  ]) {
    await page.goto(route);
    await page.getByRole("button", { name: "初中版", exact: true }).tap();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "高中版", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "高中版", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await context.close();
});

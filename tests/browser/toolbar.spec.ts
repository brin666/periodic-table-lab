import { test, expect } from "@playwright/test";

test("the simplified table has one reversible focus button and clean version labels", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".board-footer")).toHaveCount(0);
  await expect(page.locator(".search-box")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "搜索元素" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^全部元素/ })).toHaveCount(0);
  await expect(page.locator(".table-tabs button")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "同位素", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".learning-switch button")).toHaveText([
    "初中版",
    "高中版",
  ]);
  const focus = page.getByRole("button", { name: /^重点探索/ });
  await expect(focus).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(118);
  const original = await page.locator("[data-element]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-element"),
      x: node.getBoundingClientRect().x,
      y: node.getBoundingClientRect().y,
    })),
  );
  await focus.click();
  await expect(focus).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(25);
  await expect(page.locator("[data-element]")).toHaveCount(118);
  const focused = await page.locator("[data-element]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-element"),
      x: node.getBoundingClientRect().x,
      y: node.getBoundingClientRect().y,
    })),
  );
  expect(focused).toEqual(original);
  await page.keyboard.press("Space");
  await expect(focus).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(118);
  await page.getByRole("button", { name: "初中版", exact: true }).click();
  await focus.click();
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(17);
  await focus.click();
  await expect(page.locator(".element-key:not(.dimmed)")).toHaveCount(118);
  for (const width of [320, 390, 992, 1440]) {
    await page.setViewportSize({ width, height: 871 });
    await expect(focus).toBeVisible();
    const box = await focus.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(width <= 640 ? 44 : 36);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }
});

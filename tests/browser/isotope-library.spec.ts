import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { isotopesByElement, isotopeById } from "../../src/data/isotopes";

const evidence = "qa/isotope-dismiss-20261018";

async function home(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await page.getByRole("button", { name: "同位素", exact: true }).click();
}

async function openHalo(page: Page, elementId: string) {
  const key = page.locator(`#key-${elementId}`);
  await key.scrollIntoViewIfNeeded();
  await key.focus();
  await page.keyboard.press("Space");
  const halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await expect(
    halo.getByRole("button", { name: "关闭同位素菜单" }),
  ).toHaveCount(0);
  return halo;
}

async function tapOutsideHalo(page: Page, halo: Locator) {
  const point = await halo.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    for (let y = 8; y < window.innerHeight - 8; y += 16) {
      for (let x = 8; x < window.innerWidth - 8; x += 16) {
        if (
          x >= bounds.left &&
          x <= bounds.right &&
          y >= bounds.top &&
          y <= bounds.bottom
        )
          continue;
        const target = document.elementFromPoint(x, y);
        if (
          target &&
          !node.contains(target) &&
          !target.closest(
            "button, a, input, select, textarea, [role='button'], dialog",
          )
        )
          return { x, y };
      }
    }
    return null;
  });
  expect(point).not.toBeNull();
  await page.touchscreen.tap(point!.x, point!.y);
}

async function fitsViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize()!;
  const bounds = (await locator.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  expect(
    await locator.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
}

async function noOverlappingVisibleIsotopes(halo: Locator) {
  const overlap = await halo.evaluate((node) => {
    const viewport = node.querySelector<HTMLElement>(".isotope-viewport")!;
    const clip = viewport.getBoundingClientRect();
    const boxes = [...viewport.querySelectorAll<HTMLElement>("[data-isotope]")]
      .map((isotope) => {
        const rect = isotope.getBoundingClientRect();
        return {
          name: isotope.getAttribute("aria-label") || isotope.textContent,
          rect: {
            left: Math.max(rect.left, clip.left),
            right: Math.min(rect.right, clip.right),
            top: Math.max(rect.top, clip.top),
            bottom: Math.min(rect.bottom, clip.bottom),
          },
        };
      })
      .filter(({ rect }) => rect.right > rect.left && rect.bottom > rect.top);
    return boxes.flatMap((a, i) =>
      boxes
        .slice(i + 1)
        .filter(
          (b) =>
            Math.min(a.rect.right, b.rect.right) -
              Math.max(a.rect.left, b.rect.left) >
              1 &&
            Math.min(a.rect.bottom, b.rect.bottom) -
              Math.max(a.rect.top, b.rect.top) >
              1,
        )
        .map((b) => [a.name, b.name]),
    );
  });
  expect(overlap).toEqual([]);
}

test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
});

test("all isotope buttons remain available beside one complete, sorted, reversible library dialog", async ({
  page,
}) => {
  await home(page);
  const halo = await openHalo(page, "cs");
  const records = isotopesByElement.cs;
  await expect(halo.locator("[data-isotope]")).toHaveCount(records.length);
  await expect(halo.locator(".isotope-halo__caption")).toContainText(
    "铯的同位素",
  );
  await expect(halo.locator(".isotope-halo__caption .sr-only")).toContainText(
    `共 ${records.length} 种`,
  );
  await expect(
    halo.locator(".isotope-halo__caption .sr-only"),
  ).not.toContainText("预览");
  await noOverlappingVisibleIsotopes(halo);
  const trigger = halo.getByRole("button", {
    name: `全部 ${records.length} 种核素`,
    exact: true,
  });
  await trigger.click();
  const dialog = page.locator("dialog.isotope-library");
  await expect(dialog).toHaveAttribute("data-isotope-view", "list");
  await expect(page.locator("dialog:modal")).toHaveCount(1);
  await expect(dialog.locator("[data-isotope-row]")).toHaveCount(
    records.length,
  );
  expect(
    await dialog.locator(".isotope-library__mass").allTextContents(),
  ).toEqual(records.map((record) => String(record.massNumber)));
  await fitsViewport(page, dialog);
  await page.screenshot({ path: `${evidence}/desktop-cs-list.png` });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("dialog.isotope-library")
    .analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);

  const last = records.at(-1)!;
  const lastRow = dialog.locator(`[data-isotope-row="${last.id}"]`);
  await lastRow.scrollIntoViewIfNeeded();
  const savedScroll = await dialog
    .locator(".isotope-library__rows")
    .evaluate((node) => node.scrollTop);
  expect(savedScroll).toBeGreaterThan(0);
  await lastRow.click();
  await expect(dialog).toHaveAttribute("data-isotope-view", "detail");
  await expect(dialog.locator("#isotope-title")).toContainText(last.name);
  await expect(page.locator("dialog:modal")).toHaveCount(1);
  await dialog.getByRole("button", { name: "返回核素列表" }).click();
  await expect(lastRow).toBeFocused();
  expect(
    await dialog
      .locator(".isotope-library__rows")
      .evaluate((node) => node.scrollTop),
  ).toBe(savedScroll);

  const filter = dialog.getByRole("searchbox", { name: "筛选质量数" });
  await filter.fill("133");
  await expect(dialog.locator("[data-isotope-row]")).toHaveCount(1);
  await dialog.locator('[data-isotope-row="cs-133"]').click();
  await expect(dialog.locator(".isotope-stability")).toHaveText("稳定核素");
  await expect(dialog.locator(".isotope-library__evaluation")).toContainText(
    isotopeById["cs-133"].halfLifeRaw!,
  );
  await dialog.getByRole("button", { name: "返回核素列表" }).click();
  await expect(filter).toHaveValue("133");
  await expect(dialog.locator('[data-isotope-row="cs-133"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("unknown half-life and EU records retain their source limits instead of claiming stability", async ({
  page,
}) => {
  await home(page);
  const unknown = Object.values(isotopeById).find(
    (record) =>
      record.stability === "unknown" && record.halfLifeKind === "limit-only",
  )!;
  let halo = await openHalo(page, unknown.elementId);
  await halo.locator(".isotope-halo__all").click();
  let dialog = page.locator("dialog.isotope-library");
  await dialog.getByRole("searchbox").fill(String(unknown.massNumber));
  await dialog.locator(`[data-isotope-row="${unknown.id}"]`).click();
  await expect(dialog.locator(".isotope-stability")).toHaveText("稳定性未分类");
  await expect(
    dialog.locator(".isotope-library__evaluation-note"),
  ).toContainText("评价未列半衰期值，仅有界限或近似信息");
  await expect(dialog.locator(".isotope-library__evaluation")).toContainText(
    unknown.halfLifeRaw!,
  );
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  halo = await openHalo(page, "fm");
  await halo.locator(".isotope-halo__all").click();
  dialog = page.locator("dialog.isotope-library");
  await dialog.getByRole("searchbox").fill("260");
  await expect(dialog.locator('[data-isotope-row="fm-260"]')).toContainText(
    "存在性待确认",
  );
  await dialog.locator('[data-isotope-row="fm-260"]').click();
  await expect(dialog.locator(".isotope-library__uncertain")).toHaveText(
    "存在性待确认 · EU",
  );
  await expect(dialog.locator("details")).toHaveCount(1);
  await dialog.locator("details summary").click();
  await expect(dialog.locator("details")).toContainText(
    `数据文件第 ${isotopeById["fm-260"].sourceLineNumber} 行`,
  );
  await expect(dialog.locator("details a")).toHaveCount(1);
  await fitsViewport(page, dialog);
  await page.screenshot({ path: `${evidence}/desktop-fm-260-detail.png` });
});

test("320px touch users can open Og and dense libraries, return, and inspect teaching nuclides", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await home(page);
  for (const elementId of ["og", "cs", "h"]) {
    const key = page.locator(`#key-${elementId}`);
    await key.scrollIntoViewIfNeeded();
    await key.tap();
    const halo = page.locator("[data-isotope-halo]");
    await expect(halo).toBeVisible();
    await fitsViewport(page, halo);
    await expect(page.locator('[data-isotope-muted="true"]')).not.toHaveCount(
      0,
    );
    await noOverlappingVisibleIsotopes(halo);
    await expect(halo.locator("[data-isotope]")).toHaveCount(
      isotopesByElement[elementId].length,
    );
    if (elementId === "cs")
      await page.screenshot({ path: `${evidence}/mobile-320-cs-halo.png` });
    await halo.locator(".isotope-halo__all").tap();
    const dialog = page.locator("dialog.isotope-library");
    await expect(dialog.locator("[data-isotope-row]")).toHaveCount(
      isotopesByElement[elementId].length,
    );
    await fitsViewport(page, dialog);
    expect(await dialog.evaluate((node) => node.getAnimations().length)).toBe(
      0,
    );
    if (elementId === "og")
      await page.screenshot({ path: `${evidence}/mobile-320-og-list.png` });
    const row = dialog.locator("[data-isotope-row]").first();
    await row.tap();
    await expect(dialog.locator(".isotope-facts strong")).toHaveCount(3);
    await fitsViewport(page, dialog);
    await dialog.getByRole("button", { name: "返回核素列表" }).tap();
    // Cross the hover-dismiss timer boundary: a modal must keep its halo alive.
    await page.waitForTimeout(350);
    await expect(row).toBeFocused();
    await dialog.getByRole("button", { name: "关闭同位素知识" }).tap();
    await expect(halo.locator(".isotope-halo__all")).toBeFocused();
    if (elementId === "h") {
      await halo.locator('[data-isotope="h-2"]').tap();
      await expect(dialog.locator("#isotope-title")).toContainText("氘");
      await dialog.getByRole("button", { name: "关闭同位素知识" }).tap();
      await expect(halo.locator('[data-isotope="h-2"]')).toBeFocused();
    }
    await tapOutsideHalo(page, halo);
    await expect(halo).toHaveCount(0);
    await expect(page.locator('[data-isotope-muted="true"]')).toHaveCount(0);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await context.close();
});

test("direct teaching isotope detail and halo Escape keep their keyboard focus paths", async ({
  page,
}) => {
  await home(page);
  const halo = await openHalo(page, "h");
  const h3 = halo.locator('[data-isotope="h-3"]');
  await h3.click();
  const dialog = page.locator("dialog.isotope-library");
  await expect(dialog.locator("#isotope-title")).toContainText("氚");
  await expect(dialog.locator(".isotope-stability")).toHaveText("放射性核素");
  expect(
    await dialog.locator(".isotope-facts strong").allTextContents(),
  ).toEqual(["1", "2", "3"]);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("dialog.isotope-library")
    .analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(h3).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(halo).toHaveCount(0);
  await expect(page.locator("#key-h")).toBeFocused();
});

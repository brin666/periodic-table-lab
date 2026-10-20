import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { elements, elementById } from "../../src/data/catalog";
import {
  isotopeSources,
  isotopeById,
  isotopesByElement,
} from "../../src/data/isotopes";
import { findCompounds } from "../../src/data/compound-discovery";
import { extensionCompoundSources } from "../../src/data/compound-extensions";

async function openUsableHome(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await expect(page.locator("[data-element]")).toHaveCount(118);
}

async function chooseElement(
  page: Page,
  slot: number,
  elementId: string,
  input: "click" | "tap" = "click",
) {
  const trigger = page.locator(`[data-compound-slot="${slot}"]`);
  if (slot > 0) {
    if ((await trigger.getAttribute("aria-label")) === "选择下一种元素") {
      await expect(trigger).toHaveAccessibleName("选择下一种元素");
    } else {
      await expect(trigger).toHaveAttribute("data-filled", "true");
    }
  }
  if (input === "tap") await trigger.tap();
  else await trigger.click();
  const key = page.locator(`#key-${elementId}`);
  await key.scrollIntoViewIfNeeded();
  if (input === "tap") await key.tap();
  else await key.click();
}

async function chooseElementByKeyboard(
  page: Page,
  slot: number,
  elementId: string,
) {
  const trigger = page.locator(`[data-compound-slot="${slot}"]`);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const key = page.locator(`#key-${elementId}`);
  await key.scrollIntoViewIfNeeded();
  await key.focus();
  await page.keyboard.press("Enter");
}

function resultWithFormula(page: Page, formula: string) {
  return page
    .locator("[data-compound-result]")
    .filter({ has: page.locator(`[aria-label="${formula}"]`) });
}

async function assertNoPageOverflow(page: Page, width: number) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(width);
  expect(overflow.body).toBeLessThanOrEqual(width);
}

test("the first entrance keeps discovery controls unavailable until the scene is interrupted or finished", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "true",
  );

  const workbenchState = await page
    .locator(".home-workbench")
    .evaluate((node) => ({
      inert: node.hasAttribute("inert"),
      opacity: Number(getComputedStyle(node).opacity),
      pointerEvents: getComputedStyle(node).pointerEvents,
    }));
  expect(workbenchState).toEqual({
    inert: true,
    opacity: 0,
    pointerEvents: "none",
  });
  await expect(page.locator(".board-toolbar")).toHaveJSProperty("inert", true);
  await page
    .locator(".isotope-toggle")
    .evaluate((node: HTMLElement) => node.focus());
  await expect(page.locator(".isotope-toggle")).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".home-workbench")).toHaveJSProperty(
    "inert",
    false,
  );
  await expect(page.locator(".board-toolbar")).toHaveJSProperty("inert", false);
  await page.locator(".compound-workbench__drop-prompt").focus();
  await expect(page.locator(".compound-workbench__drop-prompt")).toBeFocused();
});

test("ordinary H activation still opens the knowledge map", async ({
  page,
}) => {
  await openUsableHome(page);
  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await expect(page.locator(".knowledge-map")).toBeVisible();
});

test("keyboard isotope exploration opens sourced facts and returns focus to the element", async ({
  page,
}) => {
  await openUsableHome(page);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
  await page.locator("#key-h").focus();
  await page.keyboard.press("Space");

  const halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await expect(halo).toContainText("环形排列仅用于选项展示");
  await expect(page).toHaveURL(/\/$/);

  const record = isotopeById["h-3"];
  const element = elementById[record.elementId];
  await halo.locator('[data-isotope="h-3"]').click();
  const dialog = page.locator("dialog.isotope-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#isotope-title")).toContainText(record.name);
  await expect(dialog.locator(".isotope-stability")).toHaveText("放射性核素");
  const values = await dialog
    .locator(".isotope-facts strong")
    .allTextContents();
  expect(values).toEqual([
    String(element.number),
    String(record.massNumber - element.number),
    String(record.massNumber),
  ]);

  const details = dialog.locator("details.isotope-source");
  await details.locator("summary").click();
  const expectedSources = isotopeSources.filter((source) =>
    record.sourceIds.includes(source.id),
  );
  const links = details.locator("a");
  await expect(links).toHaveCount(expectedSources.length);
  expect(
    await links.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    ),
  ).toEqual(expectedSources.map((source) => source.url));

  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("dialog.isotope-dialog")
    .analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(halo.locator('[data-isotope="h-3"]')).toBeFocused();
});

test("the full isotope index covers the last element and offers its complete list", async ({
  page,
}) => {
  await openUsableHome(page);
  const element = elementById.og;
  expect(
    elements.every((candidate) => isotopesByElement[candidate.id]?.length > 0),
  ).toBe(true);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
  const key = page.locator(`#key-${element!.id}`);
  await key.scrollIntoViewIfNeeded();
  await key.hover();

  const halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await expect(halo).toContainText(`共 ${isotopesByElement.og.length} 种`);
  await halo.locator(".isotope-halo__all").click();
  await expect(
    page.locator('[data-isotope-view="list"] [data-isotope-row]'),
  ).toHaveCount(isotopesByElement.og.length);
  await expect(page.locator('[data-isotope-row="og-293"]')).toHaveCount(0);
});

test("the empty compound workbench is one clear invitation and expands after the first element", async ({
  page,
}) => {
  await openUsableHome(page);
  const zone = page.locator('[data-compound-zone][aria-label="化合物探索"]');
  const promptName = "把元素拖到这里，探索化合物";
  const prompt = zone.locator('[data-compound-slot="0"]');

  await expect(prompt).toBeVisible();
  await expect(prompt).toHaveAccessibleName(promptName);
  await expect(zone.locator("[data-compound-slot]")).toHaveCount(1);
  await expect(zone.locator("button:visible")).toHaveCount(1);
  await expect(zone.locator("h1, h2, h3")).toHaveCount(0);
  await expect(prompt).toHaveText(promptName);

  await prompt.click();
  await page.locator("#key-h").click();
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("H");
  await expect(zone.locator('[data-compound-slot="1"]')).toHaveAccessibleName(
    "选择下一种元素",
  );
  await expect(zone.locator('[data-compound-slot="1"]')).toHaveText("");
  await expect(
    zone.getByRole("button", { name: "清空已选元素", exact: true }),
  ).toHaveCount(0);
  await expect(zone.locator("[data-compound-slot]")).toHaveCount(2);

  await zone.locator('[data-compound-slot="0"]').focus();
  await zone.getByRole("button", { name: "移除氢", exact: true }).click();
  await expect(zone.locator("[data-compound-slot]")).toHaveCount(1);
  await expect(zone.locator("button:visible")).toHaveCount(1);
  await expect(zone.locator('[data-compound-slot="0"]')).toHaveAccessibleName(
    promptName,
  );
  await expect(zone.locator('[data-compound-slot="0"]')).toHaveText(promptName);
});

test("binary results match the selected pair and returning from a material preserves the workbench", async ({
  page,
}) => {
  await openUsableHome(page);
  await chooseElement(page, 0, "h");
  await chooseElement(page, 1, "o");

  const zone = page.locator(
    '[data-compound-zone][data-learning-mode="senior"]',
  );
  await expect(zone.locator('[data-compound-result="water"]')).toBeVisible();
  await expect(zone.locator("[data-compound-result]")).toHaveCount(2);
  await expect(
    zone.locator('[data-compound-result="hydrogen-peroxide"]'),
  ).toBeVisible();
  const water = zone.locator('[data-compound-result="water"]');
  await expect(water).toHaveText("H2O");
  await expect(water).toHaveAttribute("title", "水");
  await expect(water).toHaveAttribute("aria-label", /水.*H2O/);
  await expect(
    zone.locator('[data-compound-result="sulfuric-acid"]'),
  ).toHaveCount(0);
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("H");
  await expect(
    zone.locator('[data-compound-slot="1"] .element-symbol'),
  ).toHaveText("O");

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("[data-compound-zone]")
    .analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);

  const table = page.locator("#table-scroll");
  await table.evaluate((node) => {
    const element = node as HTMLElement;
    if (element.scrollLeft === 0) element.scrollLeft = 80;
  });
  const scrollBefore = await table.evaluate(
    (node) => (node as HTMLElement).scrollLeft,
  );
  await zone.locator('[data-compound-result="water"]').click();
  await expect(page).toHaveURL(/#\/element\/h\/substance\/water$/);
  await expect(page.locator(".substance-info h1")).toHaveText("水");
  await page.getByRole("button", { name: "返回元素组合", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("[data-compound-zone]")).toBeVisible();
  await expect(
    page.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("H");
  await expect(
    page.locator('[data-compound-slot="1"] .element-symbol'),
  ).toHaveText("O");
  await expect(page.locator('[data-compound-result="water"]')).toBeVisible();
  expect(
    await table.evaluate((node) => (node as HTMLElement).scrollLeft),
  ).toBeCloseTo(scrollBefore, 0);
});

test("curriculum filtering and duplicate picks preserve the existing unique selection", async ({
  page,
}) => {
  await openUsableHome(page);
  await chooseElement(page, 0, "h");
  const zone = page.locator("[data-compound-zone]");
  await chooseElement(page, 1, "h");
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("H");
  await expect(zone.locator('[data-compound-slot="1"]')).toHaveAccessibleName(
    "选择下一种元素",
  );
  await expect(zone.locator('[data-compound-slot="1"]')).toHaveText("");
  await expect(
    zone.locator('.compound-workbench__selection [data-filled="true"]'),
  ).toHaveCount(1);
  await expect(zone.locator("[data-compound-result]")).toHaveCount(
    findCompounds(["h"], "senior").length,
  );
  await chooseElement(page, 1, "n");
  await expect(zone).toHaveAttribute("data-learning-mode", "senior");
  await expect(zone.locator('[data-compound-result="ammonia"]')).toBeVisible();

  await page.getByRole("button", { name: "初中版" }).click();
  await expect(zone).toHaveAttribute("data-learning-mode", "junior");
  await expect(zone.locator('[data-compound-result="ammonia"]')).toHaveCount(0);
  await expect(zone.locator(".compound-workbench__empty")).toHaveText(
    "暂未收录这组组成",
  );
  await expect(zone.locator(".sr-only[role='status']")).toHaveText(
    "找到0种已收录的无机化合物",
  );
  await page.getByRole("button", { name: "高中版" }).click();
  await expect(zone.locator('[data-compound-result="ammonia"]')).toBeVisible();

  await chooseElement(page, 1, "h");
  await expect(
    zone.locator('[data-compound-slot="1"] .element-symbol'),
  ).toHaveText("N");
  await expect(zone.locator('[data-compound-result="ammonia"]')).toBeVisible();
});

test("three and four unique elements discover exact compositions and reference details", async ({
  page,
}) => {
  await openUsableHome(page);
  await chooseElement(page, 0, "h");
  await chooseElement(page, 1, "na");
  await chooseElement(page, 2, "o");

  const zone = page.locator("[data-compound-zone]");
  await expect(resultWithFormula(page, "NaOH")).toBeVisible();
  await expect(
    zone.locator('[data-compound-slot="2"] .element-symbol'),
  ).toHaveText("O");

  await chooseElement(page, 2, "c");
  await expect(resultWithFormula(page, "NaOH")).toHaveCount(0);
  await chooseElement(page, 3, "o");

  const bicarbonate = findCompounds(["na", "h", "c", "o"], "senior").find(
    ({ formula }) => formula === "NaHCO3",
  );
  expect(bicarbonate?.reference).toBeDefined();
  const reference = bicarbonate!.reference!;
  const result = zone.locator(`[data-compound-result="${bicarbonate!.id}"]`);
  await expect(result).toBeVisible();
  await expect(result).toHaveText("NaHCO3");
  await expect(result).toHaveAttribute("title", reference.name);
  await expect(result).toHaveAttribute(
    "aria-label",
    new RegExp(reference.name),
  );
  expect(await result.innerText()).not.toContain(reference.name);

  await zone.locator('[data-compound-slot="2"]').focus();
  await zone
    .locator('[data-compound-slot="2"]')
    .locator("..")
    .getByRole("button", { name: "移除碳", exact: true })
    .click();
  await expect(result).toHaveCount(0);
  await expect(resultWithFormula(page, "NaOH")).toBeVisible();
  await chooseElement(page, 3, "c");
  await expect(result).toBeVisible();
  await zone.locator('[data-compound-slot="2"]').focus();
  await zone
    .locator('[data-compound-slot="2"]')
    .locator("..")
    .getByRole("button", { name: "移除氧", exact: true })
    .click();
  await expect(result).toHaveCount(0);
  await chooseElement(page, 3, "o");
  await expect(result).toBeVisible();

  await result.click();
  const dialog = page.locator("dialog.compound-reference");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).toHaveText(reference.name);
  await expect(dialog.locator(".compound-reference__kind")).toHaveText(
    "教材外参考",
  );
  const explanation = dialog.getByRole("heading", {
    name: "名称解释",
    exact: true,
  });
  await expect(explanation.locator("xpath=..").locator("p")).toHaveText(
    reference.nameExplanation,
  );

  const cas = dialog.locator("dt").filter({ hasText: "CAS" });
  if (reference.cas) {
    await expect(cas).toBeVisible();
    await expect(cas.locator("xpath=following-sibling::dd[1]")).toHaveText(
      reference.cas,
    );
  } else {
    await expect(cas).toHaveCount(0);
  }

  const sources = dialog.locator("details.compound-reference__sources");
  await expect(sources.locator("summary")).toHaveText("资料来源");
  await expect(sources).not.toHaveAttribute("open", "");
  await sources.locator("summary").click();
  const expectedSources = extensionCompoundSources.filter((source) =>
    reference.sourceIds.includes(source.id),
  );
  const sourceLinks = sources.locator("a");
  await expect(sourceLinks).toHaveCount(expectedSources.length);
  expect(
    await sourceLinks.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLAnchorElement).href),
    ),
  ).toEqual(expectedSources.map(({ url }) => url));
  const dialogAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include("dialog.compound-reference")
    .analyze();
  expect(dialogAxe.violations.map(({ id }) => id)).toEqual([]);

  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(result).toBeFocused();
});

test("slot selection supports keyboard input and fits the 993px layout", async ({
  page,
}) => {
  await openUsableHome(page);
  await page.setViewportSize({ width: 993, height: 871 });
  await chooseElementByKeyboard(page, 0, "h");
  await chooseElementByKeyboard(page, 1, "na");
  await chooseElementByKeyboard(page, 2, "o");
  await expect(resultWithFormula(page, "NaOH")).toBeVisible();
  await assertNoPageOverflow(page, 993);
});

test("mouse dragging assigns elements to explicit slots", async ({ page }) => {
  await openUsableHome(page);
  const dragTo = async (elementId: string, slot: number) => {
    const source = page.locator(`#key-${elementId}`);
    const target = page.locator(`[data-compound-slot="${slot}"]`);
    await source.scrollIntoViewIfNeeded();
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    const x0 = sourceBox!.x + sourceBox!.width / 2;
    const y0 = sourceBox!.y + sourceBox!.height / 2;
    const x1 = targetBox!.x + targetBox!.width / 2;
    const y1 = targetBox!.y + targetBox!.height / 2;
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    await page.mouse.move(x1, y1, { steps: 8 });
    await expect(page.locator(".element-drag-ghost")).toBeVisible();
    await page.mouse.up();
    await expect(target.locator(".element-symbol")).toHaveText(
      elementById[elementId].symbol,
    );
  };

  await dragTo("h", 0);
  await dragTo("o", 1);
  await expect(page.locator('[data-compound-result="water"]')).toBeVisible();
  await expect(page.locator(".element-drag-ghost")).toHaveCount(0);
  await page.locator('[data-compound-slot="2"]').click();
  await page.locator("#key-na").click();
  await dragTo("c", 3);
  await expect(resultWithFormula(page, "NaHCO3")).toBeVisible();
});

test("touch users can inspect isotopes and choose compound elements at narrow widths", async ({
  browser,
}) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("[data-element]")).toHaveCount(118);

    await page.getByRole("button", { name: "同位素", exact: true }).tap();
    await page.locator("#key-h").tap();
    const halo = page.locator("[data-isotope-halo]");
    await expect(halo).toBeVisible();
    const haloBox = await halo.boundingBox();
    expect(haloBox).not.toBeNull();
    expect(haloBox!.x).toBeGreaterThanOrEqual(0);
    expect(haloBox!.y).toBeGreaterThanOrEqual(0);
    expect(haloBox!.x + haloBox!.width).toBeLessThanOrEqual(width);
    expect(haloBox!.y + haloBox!.height).toBeLessThanOrEqual(844);

    await halo.locator('[data-isotope="h-2"]').tap();
    const dialog = page.locator("dialog.isotope-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#isotope-title")).toContainText("氘");
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(width);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(844);
    await page.getByRole("button", { name: "关闭同位素知识" }).tap();

    await page.getByRole("button", { name: "同位素", exact: true }).tap();
    await chooseElement(page, 0, "h", "tap");
    await chooseElement(page, 1, "na", "tap");
    await chooseElement(page, 2, "o", "tap");
    await expect(
      page.locator('[data-compound-slot="0"] .element-symbol'),
    ).toHaveText("H");
    await expect(
      page.locator('[data-compound-slot="1"] .element-symbol'),
    ).toHaveText("Na");
    await expect(
      page.locator('[data-compound-slot="2"] .element-symbol'),
    ).toHaveText("O");
    await chooseElement(page, 3, "c", "tap");
    await expect(resultWithFormula(page, "NaHCO3")).toBeVisible();
    await expect(page.locator(".element-drag-ghost")).toHaveCount(0);
    const bicarbonate = resultWithFormula(page, "NaHCO3");
    await bicarbonate.tap();
    const compoundDialog = page.locator("dialog.compound-reference");
    await expect(compoundDialog).toBeVisible();
    const compoundDialogBox = await compoundDialog.boundingBox();
    expect(compoundDialogBox).not.toBeNull();
    expect(compoundDialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(compoundDialogBox!.x + compoundDialogBox!.width).toBeLessThanOrEqual(
      width,
    );
    expect(
      compoundDialogBox!.y + compoundDialogBox!.height,
    ).toBeLessThanOrEqual(844);
    await page.getByRole("button", { name: "关闭化合物资料" }).tap();
    await expect(compoundDialog).toBeHidden();
    await assertNoPageOverflow(page, width);
    await context.close();
  }
});

test("finishing a drag never swallows the next deliberate element click", async ({
  page,
}) => {
  await openUsableHome(page);
  const dragHydrogen = async () => {
    const source = (await page.locator("#key-h").boundingBox())!;
    const target = (await page
      .locator('[data-compound-slot="0"]')
      .boundingBox())!;
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();
  };
  await dragHydrogen();
  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await dragHydrogen();
  await page.locator("#key-o").click();
  await expect(page).toHaveURL(/#\/element\/o$/);
});

test("a long hydrated formula stays inside its compact card at desktop and phone widths", async ({
  page,
}) => {
  await openUsableHome(page);
  for (const width of [993, 320]) {
    await page.setViewportSize({ width, height: 871 });
    const selected = page.locator(
      '.compound-workbench__selection [data-filled="true"]',
    );
    while ((await selected.count()) > 0) {
      await selected.last().focus();
      await page.keyboard.press("Delete");
    }
    const ids = ["n", "h", "fe", "s", "o"];
    for (let index = 0; index < ids.length; index++)
      await chooseElement(page, index, ids[index]);
    const result = page.locator('[data-compound-result="mohrs-salt"]');
    await expect(result).toHaveText("(NH4)2Fe(SO4)2·6H2O");
    await result.scrollIntoViewIfNeeded();
    const geometry = await result.evaluate((node) => {
      const box = node.getBoundingClientRect(),
        formula = node
          .querySelector(".compound-workbench__formula")!
          .getBoundingClientRect();
      return {
        left: formula.left - box.left,
        right: box.right - formula.right,
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeGreaterThanOrEqual(0);
    expect(await result.locator("sub").allTextContents()).not.toContain("6");
    await assertNoPageOverflow(page, width);
  }
});

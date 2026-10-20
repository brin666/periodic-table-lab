import { expect, test, type Locator, type Page } from "@playwright/test";
import { findCompounds } from "../../src/data/compound-discovery";

const zoneSelector = '[data-compound-zone][aria-label="化合物探索"]';

async function openHome(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await page.getByRole("button", { name: "高中版", exact: true }).click();
}

async function chooseElement(page: Page, slot: number, id: string) {
  const trigger = page.locator(`[data-compound-slot="${slot}"]`);
  if (slot > 0) await expect(trigger).toHaveAccessibleName("选择下一种元素");
  await trigger.click();
  await page.locator(`#key-${id}`).click();
}

async function center(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function beginDrag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await center(source);
  const to = await center(target);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
}

async function drag(page: Page, source: Locator, target: Locator) {
  await beginDrag(page, source, target);
  await expect(page.locator(".element-drag-ghost")).toBeVisible();
  await page.mouse.up();
}

async function removeAllWithDelete(page: Page) {
  const selected = page.locator(
    '.compound-workbench__selection [data-filled="true"]',
  );
  while ((await selected.count()) > 0) {
    await selected.last().focus();
    await page.keyboard.press("Delete");
  }
}

test("a mouse-dropped sodium key opens the broad exact-composition result set", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await drag(
    page,
    page.locator("#key-na"),
    zone.locator('[data-compound-slot="0"]'),
  );

  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("Na");
  await expect(
    zone.locator('[data-compound-result="sodium-chloride"]'),
  ).toBeVisible();
  await expect(
    zone.locator('[data-compound-result="sodium-hydroxide"]'),
  ).toBeVisible();
  const resultCount = await zone.locator("[data-compound-result]").count();
  const expectedSodium = findCompounds(["na"], "senior");
  expect(expectedSodium.length).toBeGreaterThan(79);
  expect(resultCount).toBe(expectedSodium.length);
  for (const formula of ["Na2O", "Na2O2"]) {
    const expected = expectedSodium.find(
      (result) => result.formula === formula,
    );
    expect(expected).toBeDefined();
    await expect(
      zone.locator(`[data-compound-result="${expected!.id}"]`),
    ).toBeVisible();
  }

  const geometry = await zone.evaluate((node) => {
    const row = node
        .querySelector(".compound-workbench__selection-row")!
        .getBoundingClientRect(),
      key = node
        .querySelector('[data-compound-slot="0"]')!
        .getBoundingClientRect();
    return {
      rowCenter: row.top + row.height / 2,
      keyCenter: key.top + key.height / 2,
    };
  });
  expect(Math.abs(geometry.rowCenter - geometry.keyCenter)).toBeLessThan(5);

  const append = zone.locator('[data-compound-slot="1"]');
  await expect(append).toHaveAccessibleName("选择下一种元素");
  await expect(append).toHaveText("");
  await expect(append.locator('[data-compound-plus="preview"]')).toHaveCSS(
    "opacity",
    "0",
  );
  await expect(
    zone.getByRole("button", { name: "清空已选元素", exact: true }),
  ).toHaveCount(0);
});

test("the append plus previews an eligible drag and vanishes when Escape cancels it", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await drag(
    page,
    page.locator("#key-na"),
    zone.locator('[data-compound-slot="0"]'),
  );
  const append = zone.locator('[data-compound-slot="1"]');
  const plus = append.locator('[data-compound-plus="preview"]');
  await expect(plus).toHaveCSS("opacity", "0");

  await beginDrag(
    page,
    page.locator("#key-o"),
    zone.locator(".compound-workbench__results"),
  );
  await expect(page.locator(".element-drag-ghost")).toBeVisible();
  await expect(append).toHaveAttribute("data-preview", "true");
  await expect(plus).toHaveCSS("opacity", "1");

  await page.keyboard.press("Escape");
  await expect(page.locator(".element-drag-ghost")).toHaveCount(0);
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("Na");
  await page.mouse.up();
  await expect(append).toHaveAttribute("data-preview", "false");
  await expect(plus).toHaveCSS("opacity", "0");
  await expect(zone.locator('[data-compound-slot="1"]')).toHaveAccessibleName(
    "选择下一种元素",
  );
  await expect(
    zone.locator('[data-compound-result="sodium-hydroxide"]'),
  ).toBeVisible();
});

test("Na and O exclude NaOH, while the exact HNaO selection discovers it", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await chooseElement(page, 0, "na");
  await chooseElement(page, 1, "o");
  await expect(
    zone.locator('[data-compound-slot="1"] .element-symbol'),
  ).toHaveText("O");
  await expect(
    zone.locator('[data-compound-result="sodium-hydroxide"]'),
  ).toHaveCount(0);

  await removeAllWithDelete(page);
  await chooseElement(page, 0, "h");
  await chooseElement(page, 1, "na");
  await chooseElement(page, 2, "o");
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("H");
  await expect(
    zone.locator('[data-compound-slot="1"] .element-symbol'),
  ).toHaveText("Na");
  await expect(
    zone.locator('[data-compound-slot="2"] .element-symbol'),
  ).toHaveText("O");
  await expect(
    zone.locator('[data-compound-result="sodium-hydroxide"]'),
  ).toBeVisible();
});

test("selected sodium can be dragged out, canceled safely, and followed by a real click", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await drag(
    page,
    page.locator("#key-na"),
    zone.locator('[data-compound-slot="0"]'),
  );
  const selectedNa = zone.locator('[data-compound-slot="0"]');
  const outside = page.locator("#key-o");

  await beginDrag(page, selectedNa, outside);
  await page.keyboard.press("Escape");
  await expect(page.locator(".element-drag-ghost")).toHaveCount(0);
  await page.mouse.up();
  await expect(selectedNa.locator(".element-symbol")).toHaveText("Na");
  await expect(page).toHaveURL(/\/$/);

  await drag(page, selectedNa, outside);
  await expect(zone).toHaveAttribute("data-empty", "true");
  await expect(zone.locator('[data-compound-slot="0"]')).toContainText(
    "把元素拖到这里，探索化合物",
  );
  await expect(page).toHaveURL(/\/$/);

  await outside.click();
  await expect(page).toHaveURL(/#\/element\/o$/);
});

test("pointercancel and blur cancel a selected-key drag without deleting it", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await drag(
    page,
    page.locator("#key-na"),
    zone.locator('[data-compound-slot="0"]'),
  );
  const selectedNa = zone.locator('[data-compound-slot="0"]');
  const outside = page.locator("#key-o");

  await page.evaluate(() => {
    document.addEventListener(
      "pointerdown",
      (event) => {
        (window as Window & { __testPointerId?: number }).__testPointerId = (
          event as PointerEvent
        ).pointerId;
      },
      { capture: true, once: true },
    );
  });
  await beginDrag(page, selectedNa, outside);
  const pointerId = await page.evaluate(
    () => (window as Window & { __testPointerId?: number }).__testPointerId,
  );
  if (pointerId === undefined) throw new Error("pointerdown was not observed");
  await page.evaluate((id) => {
    window.dispatchEvent(
      new PointerEvent("pointercancel", {
        pointerId: id,
        pointerType: "mouse",
      }),
    );
  }, pointerId);
  await page.mouse.up();
  await expect(selectedNa.locator(".element-symbol")).toHaveText("Na");
  await expect(page.locator(".element-drag-ghost")).toHaveCount(0);

  await beginDrag(page, selectedNa, outside);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await expect(selectedNa.locator(".element-symbol")).toHaveText("Na");
  await expect(page.locator(".element-drag-ghost")).toHaveCount(0);
});

test("new result cards reveal once and remain revealed after scrolling back", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    (
      Element.prototype as unknown as {
        animate: (...args: unknown[]) => Animation;
      }
    ).animate = function (this: Element, ...args: unknown[]) {
      const id = (this as HTMLElement).dataset.discoveryCell;
      if (id) {
        const target = window as Window & {
          __compoundRevealAnimations?: Record<string, number>;
        };
        target.__compoundRevealAnimations ??= {};
        target.__compoundRevealAnimations[id] =
          (target.__compoundRevealAnimations[id] ?? 0) + 1;
      }
      return Reflect.apply(original, this, args) as Animation;
    };
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await page.getByRole("button", { name: "高中版", exact: true }).click();

  const zone = page.locator(zoneSelector);
  await drag(
    page,
    page.locator("#key-na"),
    zone.locator('[data-compound-slot="0"]'),
  );
  await expect(zone.locator("[data-compound-result]")).not.toHaveCount(0);
  const unseen = zone
    .locator('[data-discovery-cell][data-revealed="false"]')
    .last();
  await expect(unseen).toHaveCount(1);
  const id = (await unseen.getAttribute("data-discovery-cell"))!;
  const cell = zone.locator(`[data-discovery-cell="${id}"]`);
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toHaveAttribute("data-revealed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        (cellId) =>
          (
            window as Window & {
              __compoundRevealAnimations?: Record<string, number>;
            }
          ).__compoundRevealAnimations?.[cellId] ?? 0,
        id,
      ),
    )
    .toBe(1);

  const list = zone.locator(".compound-workbench__result-list");
  await list.evaluate((node) => ((node as HTMLElement).scrollTop = 0));
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toHaveAttribute("data-revealed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        (cellId) =>
          (
            window as Window & {
              __compoundRevealAnimations?: Record<string, number>;
            }
          ).__compoundRevealAnimations?.[cellId] ?? 0,
        id,
      ),
    )
    .toBe(1);
});

test("reduced motion reveals results immediately and deleting the last key restores prompt focus", async ({
  page,
}) => {
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await chooseElement(page, 0, "na");
  await expect(zone).toHaveAttribute("data-reduced", "true");
  await expect(
    zone.locator('[data-discovery-cell][data-revealed="false"]'),
  ).toHaveCount(0);

  await zone.locator('[data-compound-slot="0"]').focus();
  await page.keyboard.press("Delete");
  const prompt = zone.locator('[data-compound-slot="0"]');
  await expect(prompt).toBeFocused();
  await expect(prompt).toContainText("把元素拖到这里，探索化合物");
});

test("failed compound data can be retried without losing the current selection", async ({
  page,
}) => {
  let requests = 0;
  await page.route(
    /\/src\/data\/compound-discovery\.ts(?:\?.*)?$/,
    async (route) => {
      requests++;
      if (requests === 1) await route.abort();
      else await route.continue();
    },
  );
  await openHome(page);
  const zone = page.locator(zoneSelector);
  await chooseElement(page, 0, "na");
  await expect(zone.getByRole("alert")).toContainText("化合物资料暂时无法加载");
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("Na");

  await zone.getByRole("button", { name: "重试", exact: true }).click();
  await expect(
    zone.locator('[data-compound-result="sodium-chloride"]'),
  ).toBeVisible();
  await expect(
    zone.locator('[data-compound-slot="0"] .element-symbol'),
  ).toHaveText("Na");
  expect(requests).toBeGreaterThanOrEqual(2);
});

test("phone widths keep selection tap targets usable without page overflow", async ({
  browser,
}) => {
  for (const width of [390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".table-page")).toHaveAttribute(
      "data-enter",
      "false",
    );
    const zone = page.locator(zoneSelector);
    await zone.locator('[data-compound-slot="0"]').tap();
    await page.locator("#key-na").tap();
    const append = zone.locator('[data-compound-slot="1"]');
    await expect(append).toHaveAccessibleName("选择下一种元素");
    await append.tap();
    await page.locator("#key-o").tap();
    await expect(
      zone.locator('[data-compound-slot="1"] .element-symbol'),
    ).toHaveText("O");
    await zone.locator('[data-compound-slot="1"]').tap();
    await zone.getByRole("button", { name: "移除氧", exact: true }).tap();
    await expect(zone.locator('[data-compound-slot="1"]')).toHaveAccessibleName(
      "选择下一种元素",
    );

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(overflow.document).toBeLessThanOrEqual(width);
    expect(overflow.body).toBeLessThanOrEqual(width);
    await context.close();
  }
});

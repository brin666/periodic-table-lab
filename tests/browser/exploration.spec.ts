import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { substances } from "../../src/data/catalog";
import { equations } from "../../src/data/catalog";
import { equationNotationById } from "../../src/data/equation-notation";

async function settled(page: Page) {
  await page.evaluate(async () => {
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.effect instanceof KeyframeEffect &&
            a.effect.getTiming().iterations !== Infinity,
        )
        .map((a) => a.finished.catch(() => {})),
    );
  });
}

test("every material detail renders on desktop and phone without page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const displayedReactions = new Set<string>();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const substance of substances) {
      const element = Object.keys(substance.composition)[0];
      await page.evaluate(
        ({ element, id }) => {
          history.replaceState(
            null,
            "",
            `#/element/${element}/substance/${id}`,
          );
          dispatchEvent(new PopStateEvent("popstate"));
        },
        { element, id: substance.id },
      );
      await expect(page.locator(".substance-info h1")).toHaveText(
        substance.name,
      );
      await expect(page.locator(".reaction")).toHaveCount(
        substance.equationIds.length,
      );
      await expect(page.locator(".site-footer, .portrait-caption")).toHaveCount(
        0,
      );
      await expect(
        page.locator(
          ".substance-info .eyebrow, .substance-info .english-subtitle",
        ),
      ).toHaveCount(0);
      await expect(page.locator(".substance-badges > span")).toHaveCount(2);
      await expect(
        page.locator(".reaction .level-label, .reaction-conditions"),
      ).toHaveCount(0);
      await expect(page.locator(".reactions-heading h2")).toHaveText(
        "看看它参与的变化",
      );
      await expect(page.locator(".equation-key")).toHaveCount(1);
      await expect(page.locator(".equation-key")).toContainText("(g) 气体");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${substance.id} at ${width}`,
      ).toBeLessThanOrEqual(width);
      for (const row of await page.locator(".reaction").all()) {
        const rowBox = (await row.boundingBox())!;
        expect(rowBox.x).toBeGreaterThanOrEqual(0);
        expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(width);
        const id = (await row.getAttribute("data-reaction-id"))!;
        displayedReactions.add(id);
        const reaction = equations.find((item) => item.id === id)!;
        const notation = equationNotationById[id];
        const sign = row.locator(".equation-sign");
        await expect(sign).toHaveText(reaction.reversible ? "⇌" : "=");
        const signBox = (await sign.boundingBox())!;
        const above = row.locator('.equation-condition[data-position="above"]');
        const below = row.locator('.equation-condition[data-position="below"]');
        await expect(above).toHaveText(notation.above ?? "");
        await expect(below).toHaveText(notation.below ?? "");
        for (const [label, position] of [
          [above, "above"],
          [below, "below"],
        ] as const) {
          if (!(await label.textContent())) continue;
          const box = (await label.boundingBox())!;
          if (position === "above")
            expect(box.y + box.height).toBeLessThanOrEqual(signBox.y + 2);
          else
            expect(box.y).toBeGreaterThanOrEqual(
              signBox.y + signBox.height - 2,
            );
          expect(
            Math.abs(box.x + box.width / 2 - signBox.x - signBox.width / 2),
          ).toBeLessThan(1);
        }
        const sides = await row.locator(".reaction-side").evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
        );
        expect(sides[0].right).toBeLessThan(signBox.x);
        expect(sides[1].left).toBeGreaterThan(signBox.x + signBox.width);
      }
    }
  }
  expect(errors).toEqual([]);
  expect([...displayedReactions].sort()).toEqual(
    equations.map((e) => e.id).sort(),
  );
});

test("a valid deep-linked material without a parent card returns focus to its element heading", async ({
  page,
}) => {
  await page.goto("/#/element/k/substance/potassium-permanganate");
  await expect(page.locator(".substance-info h1")).toHaveText("高锰酸钾");
  await expect(page.locator("#substance-potassium-permanganate")).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "返回钾的探索", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/k\/atom$/);
  await expect(page.locator(".story-copy h1")).toBeFocused();
});

test("manual reduced motion persists and skip link moves keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "跳到主要内容" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main h1")).toBeFocused();
  await page.getByRole("button", { name: "减少动态", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
});
test("full sample, shared transitions, shell selection and preserved return state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/");
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await page.evaluate(() => {
    const original = document.startViewTransition.bind(document);
    (window as unknown as Window & { transitions: number }).transitions = 0;
    document.startViewTransition = (...args: Parameters<typeof original>) => {
      (window as unknown as Window & { transitions: number }).transitions++;
      return original(...args);
    };
  });
  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await settled(page);

  const context = page.context();
  const pageCount = context.pages().length;
  const gasBranch = page.locator("#km-branch-h-gas");
  await expect(gasBranch).toHaveAttribute("aria-expanded", "true");
  await gasBranch.click();
  await expect(gasBranch).toHaveAttribute("aria-expanded", "false");
  const beforeAtomTransition = await page.evaluate(
    () => (window as unknown as Window & { transitions: number }).transitions,
  );
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await expect(page.locator(".explore-page")).toBeVisible();
  expect(context.pages()).toHaveLength(pageCount);
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { transitions: number }).transitions,
    ),
  ).toBeGreaterThan(beforeAtomTransition);

  await settled(page);
  await expect(
    page.getByRole("button", { name: "第1层 1个电子", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator("#substance-water").click();
  await expect(page).toHaveURL(/\/substance\/water$/);
  await settled(page);
  await expect(page.locator(".reaction")).toHaveCount(4);
  await expect(page.locator(".composition-item")).toHaveCount(2);
  await page.getByRole("button", { name: "返回氢的探索", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await settled(page);
  await expect(page.locator("#substance-water")).toBeFocused();
  await page.locator("#substance-hydrogen-peroxide").click();
  await expect(page).toHaveURL(/hydrogen-peroxide$/);
  await expect(page.locator(".reaction")).toHaveCount(2);
  await expect(page.locator(".portrait-note")).toContainText("混合物");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await settled(page);
  const beforeMapTransition = await page.evaluate(
    () => (window as unknown as Window & { transitions: number }).transitions,
  );
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await expect(page.locator("#km-branch-h-gas")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator(".km-core-key")).toBeFocused();
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { transitions: number }).transitions,
    ),
  ).toBeGreaterThan(beforeMapTransition);
  const beforeTableTransition = await page.evaluate(
    () => (window as unknown as Window & { transitions: number }).transitions,
  );
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  await settled(page);
  await expect(page.locator("#key-h")).toBeFocused();
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { transitions: number }).transitions,
    ),
  ).toBeGreaterThan(beforeTableTransition);
  expect(context.pages()).toHaveLength(pageCount);
  expect(await page.locator(".knowledge-map").count()).toBe(0);
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { transitions: number }).transitions,
    ),
  ).toBeGreaterThanOrEqual(4);
  expect(errors).toEqual([]);
});
test("all 118 detail routes render electron counts without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const ids = await page
    .locator("[data-element]")
    .evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.element!),
    );
  for (const [index, id] of ids.entries()) {
    await page.evaluate((id) => {
      history.pushState(null, "", `#/element/${id}/atom`);
      dispatchEvent(new PopStateEvent("popstate"));
    }, id);
    await expect(page.locator(".large .element-symbol")).toHaveText(
      id[0].toUpperCase() + id.slice(1),
    );
    const text = await page.locator(".atom-svg").getAttribute("aria-label");
    expect(text).toContain(`${index + 1}个电子`);
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("category preserves topology and keyboard choice with return state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "其他非金属", exact: true }).click();
  await expect(page.locator("[data-element]")).toHaveCount(118);
  expect(await page.locator(".element-key:not(.dimmed)").count()).toBeLessThan(
    118,
  );
  await page.locator("#key-o").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/element\/o$/);
  await settled(page);
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/o\/atom$/);
  await settled(page);
  await page
    .getByRole("button", { name: "第1层 2个电子", exact: true })
    .click();
  await page.locator("#substance-water").click();
  await settled(page);
  await page.goBack();
  await settled(page);
  await expect(
    page.getByRole("button", { name: "第1层 2个电子", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/o$/);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await settled(page);
  await expect(
    page.getByRole("button", { name: "其他非金属", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#key-o")).toBeFocused();
  await page.getByRole("button", { name: "全部类别", exact: true }).click();
  await page.locator("#key-h").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#key-he")).toBeFocused();
});
test("rapid switches and repeated back requests leave exactly one interactive page", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await page.locator("#key-h").click();
  await settled(page);
  const context = page.context();
  const pageCount = context.pages().length;
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  expect(context.pages()).toHaveLength(pageCount);
  await settled(page);
  for (let i = 0; i < 8; i++)
    await page
      .getByRole("button", { name: "下一个元素", exact: true })
      .click({ force: true });
  await settled(page);
  await expect(page.locator("main")).toHaveCount(1);
  await page.locator(".back-button").evaluate((button) => {
    for (let i = 0; i < 8; i++) (button as HTMLButtonElement).click();
  });
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await settled(page);
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  await expect(page.locator(".table-page")).toBeVisible();
  expect(context.pages()).toHaveLength(pageCount);
  await page.locator("#key-h").click();
  await settled(page);
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  expect(context.pages()).toHaveLength(pageCount);
  await page.locator("#substance-water").click();
  await settled(page);
  await page.locator(".back-button").evaluate((button) => {
    for (let i = 0; i < 8; i++) (button as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await settled(page);
  await expect(page.locator("main")).toHaveCount(1);
  await page.goForward();
  await settled(page);
  await expect(page.locator(".substance-info h1")).toHaveText("水");
  expect(context.pages()).toHaveLength(pageCount);
  expect(errors).toEqual([]);
});
test("small touch viewport, horizontal table scroll, return offset, resize and reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4178/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await page
    .locator("#table-scroll")
    .evaluate((el) => (el.scrollLeft = el.scrollWidth));
  const scroll = await page
    .locator("#table-scroll")
    .evaluate((el) => el.scrollLeft);
  await page.locator("#key-ne").tap();
  await expect(page).toHaveURL(/element\/ne$/);
  await expect(page.locator(".honest-empty")).toBeVisible();
  await page.getByRole("button", { name: "返回周期表", exact: true }).tap();
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  expect(
    await page.locator("#table-scroll").evaluate((el) => el.scrollLeft),
  ).toBe(scroll);
  await page.locator("#table-scroll").evaluate((el) => (el.scrollLeft = 0));
  await page.locator("#key-h").tap();
  await expect(page.locator(".knowledge-map")).toBeVisible();
  const pageCount = context.pages().length;
  await page.locator(".km-core-key").tap();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await expect(page.locator(".explore-page")).toBeVisible();
  expect(context.pages()).toHaveLength(pageCount);
  await page.locator("#substance-water").tap();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  expect(await page.locator(".reaction").count()).toBe(4);
  expect(context.pages()).toHaveLength(pageCount);
  await context.close();
});
test("navigation without View Transitions still works", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.locator("#key-h").click();
  await expect(page.locator(".knowledge-map")).toBeVisible();
  const context = page.context();
  const pageCount = context.pages().length;
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await expect(page.locator(".explore-page")).toBeVisible();
  expect(context.pages()).toHaveLength(pageCount);
  await page.locator("#substance-water").click();
  await expect(page.locator(".substance-info h1")).toHaveText("水");
  await page.getByRole("button", { name: "返回氢的探索", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  expect(context.pages()).toHaveLength(pageCount);

  await page.goto("/#/element/h/atom");
  await expect(page.locator(".explore-page")).toBeVisible();
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page).toHaveURL(/\/(?:#\/)?$/);
  expect(context.pages()).toHaveLength(pageCount);
});
test("WCAG AA automated checks on table, exploration, substance and evidence dialog", async ({
  page,
}) => {
  const report = [];
  for (const route of [
    "/",
    "/#/element/h",
    "/#/element/h/atom",
    "/#/element/h/substance/water",
  ]) {
    await page.goto(route);
    await settled(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    report.push({ route, violations: results.violations });
  }
  await page.getByRole("button", { name: "资料与说明", exact: false }).click();
  const dialog = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  report.push({ route: "dialog", violations: dialog.violations });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/#/element/o",
    "/#/element/o/atom",
    "/#/element/h/substance/hydrogen-peroxide",
  ]) {
    await page.goto(route);
    await settled(page);
    const mobile = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    report.push({ route: `mobile:${route}`, violations: mobile.violations });
  }
  await fs.mkdir("qa", { recursive: true });
  await fs.writeFile("qa/accessibility.json", JSON.stringify(report, null, 2));
  expect(
    report.flatMap((r) =>
      r.violations.map((v) => ({
        route: r.route,
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ),
  ).toEqual([]);
});

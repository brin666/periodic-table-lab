import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hydrogenKnowledge } from "../../src/data/hydrogen-knowledge";
import { knowledgeStickerByCardId } from "../../src/data/knowledge-stickers";
import { getKnowledgePack } from "../../src/data/element-knowledge";

const knowledgeMapUrl = "/#/element/h";
const axeTags = ["wcag2a", "wcag2aa", "wcag21aa"];
const hydrogenPack = getKnowledgePack("h")!;
const seniorCardCount = hydrogenPack.cards.length;
const juniorCardCount = hydrogenPack.cards.filter(
  (card) => card.level === "junior",
).length;
const verifiedCardCount = hydrogenPack.cards.filter(
  (card) => card.status === "verified",
).length;
const atomBranchCardCount = hydrogenPack.branches.find(
  (branch) => branch.id === "h-atom",
)!.cardIds.length;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
});

async function openDemo(page: Page, reducedMotion = true) {
  await page.emulateMedia({
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  await page.goto(knowledgeMapUrl);
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
}

async function expectNoAxeViolations(page: Page, selector: string) {
  const results = await new AxeBuilder({ page })
    .withTags(axeTags)
    .include(selector)
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

async function expectDemoChromeRemoved(page: Page) {
  for (const selector of [
    ".km-demo-badge",
    ".km-heading",
    ".km-legend",
    ".km-core-label",
  ])
    await expect(page.locator(selector)).toHaveCount(0);
  const heading = page.locator(".knowledge-map h1.sr-only");
  await expect(heading).toHaveCount(1);
  await expect(heading).toHaveAttribute("tabindex", "-1");
}

async function expectCenteredBranchText(page: Page) {
  const branches = await page.locator(".km-branch").evaluateAll((buttons) =>
    buttons.map((button) => {
      const label = button.querySelector("strong")!;
      const range = document.createRange();
      range.selectNodeContents(label);
      const buttonBox = button.getBoundingClientRect();
      const labelBox = range.getBoundingClientRect();
      return {
        centerOffset: Math.abs(
          labelBox.left +
            labelBox.width / 2 -
            (buttonBox.left + buttonBox.width / 2),
        ),
        hasSingleLabel: button.querySelectorAll("strong").length === 1,
        hasCount: !!button.querySelector("small"),
        hasArrow: !!button.querySelector("svg"),
      };
    }),
  );
  expect(branches.length).toBeGreaterThan(0);
  for (const branch of branches) {
    expect(branch.hasSingleLabel).toBe(true);
    expect(branch.hasCount).toBe(false);
    expect(branch.hasArrow).toBe(false);
    expect(branch.centerOffset).toBeLessThan(1.5);
  }
}

test("the homepage H key opens the default knowledge map and switching levels preserves its return focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toBeVisible();
  await expect(page.locator(".knowledge-map")).toHaveCount(0);

  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-mode",
    "senior",
  );
  await expect(page.locator('.km-branch[data-active="true"]')).toHaveCount(4);
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    seniorCardCount,
  );
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-content",
    "reviewed",
  );
  await expect(
    page.locator('.km-card[data-active="true"][data-status="verified"]'),
  ).toHaveCount(verifiedCardCount);
  await expect(
    page.locator('.km-card[data-active="true"][data-status="pending"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.km-card[data-active="true"] .km-card-kicker'),
  ).toHaveCount(0);
  await expect(
    page.locator('.km-card[data-active="true"] .km-card-expand'),
  ).toHaveCount(0);
  await expect(
    page.locator('.km-card[data-active="true"] .km-card-footer'),
  ).toHaveCount(0);
  await expect(
    page.locator('.km-card[data-active="true"] .km-source'),
  ).toHaveCount(0);
  const cardHeights = await page
    .locator('.km-card[data-active="true"]')
    .evaluateAll((cards) =>
      cards.map((card) => (card as HTMLElement).clientHeight),
    );
  expect(Math.max(...cardHeights)).toBeLessThanOrEqual(200);
  await expect(page.locator(".knowledge-map")).not.toContainText(
    /交互样例|示意内容|页码待采集/,
  );
  await expectDemoChromeRemoved(page);
  await expectCenteredBranchText(page);

  const seniorGasCard = await page
    .locator("#km-card-h-molecule")
    .evaluate((node) => (node as HTMLElement).style.transform);

  const juniorButton = page.getByRole("button", {
    name: "初中版",
    exact: true,
  });
  const seniorButton = page.getByRole("button", {
    name: "高中版",
    exact: true,
  });
  for (const mode of [
    "junior",
    "senior",
    "junior",
    "senior",
    "junior",
  ] as const) {
    await (mode === "junior" ? juniorButton : seniorButton).click({
      force: true,
    });
  }
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-mode",
    "junior",
  );
  await expect(page.locator('.km-branch[data-active="true"]')).toHaveCount(4);
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    juniorCardCount,
  );
  await expect(
    page.locator('.km-card[data-active="true"][data-level="extension"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.km-card[data-active="true"][data-status="pending"]'),
  ).toHaveCount(0);
  await expect(page.locator("#km-card-h-comparison")).toHaveAttribute(
    "data-level",
    "junior",
  );
  await expect(juniorButton).toHaveAttribute("aria-pressed", "true");

  const comparisonOpener = page.locator("#km-card-h-comparison .km-card-open");
  await comparisonOpener.click();
  const comparisonDialog = page.locator("dialog.km-card-dialog");
  await expect(comparisonDialog).toBeVisible();
  await expect(comparisonDialog.locator(".km-dialog-top > span")).toHaveText(
    hydrogenPack.cards.find((card) => card.id === "h-comparison")!.curriculum!
      .volume,
  );
  await expect(comparisonDialog.locator(".km-source")).toHaveCount(1);
  await expect(comparisonDialog.locator(".km-source-trigger")).toHaveText(
    "教材依据",
  );
  await page.getByRole("button", { name: "收起知识卡" }).click();
  await expect(comparisonDialog).toHaveCount(0);

  const juniorGasCard = await page
    .locator("#km-card-h-molecule")
    .evaluate((node) => (node as HTMLElement).style.transform);
  expect(juniorGasCard).not.toBe(seniorGasCard);

  await seniorButton.click({ force: true });
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    seniorCardCount,
  );
  await expect(seniorButton).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.locator(".table-page")).toBeVisible();
  await expect(page.locator(".knowledge-map")).toHaveCount(0);
  await expect(page.locator("#key-h")).toBeFocused();
});

test("the default H link reloads to the map, the legacy query remains compatible, and atom routes stay distinct", async ({
  page,
}) => {
  await page.goto(knowledgeMapUrl);
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await page.reload();
  await expect(page.locator(".knowledge-map")).toBeVisible();

  await page.goto("/?demo=knowledge#/element/h");
  await expect(page.locator(".knowledge-map")).toBeVisible();

  await page.goto("/#/element/h/atom");
  await expect(page.locator(".explore-page")).toBeVisible();
  await expect(page.locator(".knowledge-map")).toHaveCount(0);
  await expect(page.locator(".large .element-symbol")).toHaveText("H");

  await page.goto("/#/element/o");
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await expect(page.locator(".explore-page")).toHaveCount(0);
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/o\/atom$/);
  await expect(page.locator(".explore-page")).toBeVisible();
  await expect(page.locator(".knowledge-map")).toHaveCount(0);
  await expect(page.locator(".large .element-symbol")).toHaveText("O");
});

test("all H cards load distinct stickers and keep their image in the source dialog", async ({
  page,
}) => {
  await openDemo(page);

  const cardIds = hydrogenPack.cards.map((card) => card.id);
  expect(cardIds).toHaveLength(22);
  expect(
    cardIds.every((id) =>
      Object.prototype.hasOwnProperty.call(knowledgeStickerByCardId, id),
    ),
  ).toBe(true);

  const images = page.locator('.km-card[data-active="true"] .km-sticker img');
  await expect(images).toHaveCount(cardIds.length);
  const decoded = await images.evaluateAll((nodes) =>
    Promise.all(
      nodes.map(async (node) => {
        try {
          const image = node as HTMLImageElement;
          await image.decode();
          return image.naturalWidth > 0 && image.naturalHeight > 0;
        } catch {
          return false;
        }
      }),
    ),
  );
  expect(decoded).toHaveLength(cardIds.length);
  expect(decoded.every(Boolean)).toBe(true);

  const artwork = await images.evaluateAll((nodes) =>
    nodes.map((node) => ({
      cardId: node.closest<HTMLElement>(".km-card")!.id.replace("km-card-", ""),
      src: (node as HTMLImageElement).getAttribute("src"),
    })),
  );
  expect(artwork.sort((a, b) => a.cardId.localeCompare(b.cardId))).toEqual(
    hydrogenPack.cards
      .map((card) => ({
        cardId: card.id,
        src: knowledgeStickerByCardId[card.id],
      }))
      .sort((a, b) => a.cardId.localeCompare(b.cardId)),
  );
  expect(new Set(artwork.map((item) => item.src)).size).toBe(cardIds.length);
  for (const { cardId, src } of artwork)
    expect(src).toMatch(
      new RegExp(`/stickers/knowledge-20261017/${cardId}\\.webp$`),
    );

  const previewSticker = page.locator("#km-card-h-water .km-sticker img");
  await page.locator("#km-card-h-water .km-card-open").click();
  const dialog = page.locator("dialog.km-card-dialog");
  const dialogSticker = dialog.locator(".km-sticker img");
  await expect(dialogSticker).toHaveCount(1);
  await expect(dialogSticker).toHaveAttribute(
    "src",
    knowledgeStickerByCardId["h-water"],
  );
  await expect(dialogSticker).toHaveAttribute(
    "src",
    (await previewSticker.getAttribute("src"))!,
  );
  await expect(dialogSticker).toHaveAttribute("alt", "");
  const sourceTrigger = dialog.locator(".km-source-trigger");
  await expect(sourceTrigger).toHaveText("教材依据");
  await sourceTrigger.click();
  await expect(dialog.locator(".km-source-panel")).toBeVisible();
});

test("the central H key navigates in the same page and restores map state for pointer, keyboard, and touch", async ({
  page,
  browser,
  baseURL,
}) => {
  await openDemo(page);
  await expect(page.locator(".km-original-link")).toHaveCount(0);

  const juniorButton = page.getByRole("button", {
    name: "初中版",
    exact: true,
  });
  await juniorButton.click({ force: true });
  const gasBranch = page.locator("#km-branch-h-gas");
  await expect(gasBranch).toHaveAttribute("aria-expanded", "true");
  await gasBranch.click();
  await expect(gasBranch).toHaveAttribute("aria-expanded", "false");

  const activateAndCheckSingleTarget = async (
    sourcePage: Page,
    action: () => Promise<void>,
  ) => {
    const context = sourcePage.context();
    const pageCountBefore = context.pages().length;
    const routeBefore = sourcePage.url();
    const stateBefore = {
      mode: await sourcePage
        .locator(".knowledge-map")
        .getAttribute("data-mode"),
      collapsed: await sourcePage
        .locator("#km-branch-h-gas")
        .getAttribute("aria-expanded"),
      activeCards: await sourcePage
        .locator('.km-card[data-active="true"]')
        .count(),
    };
    const openedPages: Page[] = [];
    const recordPage = (target: Page) => openedPages.push(target);
    context.on("page", recordPage);
    await action();
    try {
      await expect(sourcePage).toHaveURL(/\/#\/element\/h\/atom$/);
      await expect(sourcePage.locator(".explore-page")).toBeVisible();
      await expect(sourcePage.locator(".knowledge-map")).toHaveCount(0);
      expect(context.pages()).toHaveLength(pageCountBefore);
      await sourcePage
        .getByRole("button", { name: "返回思维导图", exact: true })
        .click();

      await expect(sourcePage).toHaveURL(routeBefore);
      await expect(sourcePage.locator(".knowledge-map")).toHaveAttribute(
        "data-mode",
        stateBefore.mode!,
      );
      await expect(sourcePage.locator("#km-branch-h-gas")).toHaveAttribute(
        "aria-expanded",
        stateBefore.collapsed!,
      );
      await expect(
        sourcePage.locator('.km-card[data-active="true"]'),
      ).toHaveCount(stateBefore.activeCards);
      await expect(sourcePage.locator(".km-core-key")).toBeFocused();
      expect(openedPages).toHaveLength(0);
    } finally {
      context.off("page", recordPage);
    }
    await expect.poll(() => context.pages().length).toBe(pageCountBefore);
  };

  const key = page.getByRole("button", {
    name: "进入氢的原子与物质探索页",
  });
  await expect(key).toHaveAttribute("type", "button");
  await expect(key).toHaveClass(/km-core-key/);
  await expect(key).toBeVisible();

  await activateAndCheckSingleTarget(page, () => key.click());
  await key.focus();
  await activateAndCheckSingleTarget(page, () => page.keyboard.press("Enter"));
  await key.focus();
  await activateAndCheckSingleTarget(page, () => page.keyboard.press("Space"));

  const touchContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await touchContext.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  try {
    const touchPage = await touchContext.newPage();
    await openDemo(touchPage);
    await expect(touchPage.locator(".km-original-link")).toHaveCount(0);
    await activateAndCheckSingleTarget(touchPage, () =>
      touchPage
        .getByRole("button", {
          name: "进入氢的原子与物质探索页",
        })
        .tap(),
    );
  } finally {
    await touchContext.close();
  }
});

test("homepage H enters the map by keyboard and touch, then returns focus to H", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.locator("#key-h").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/element\/h$/);
    await expect(page.locator(".knowledge-map")).toBeVisible();
    await page.getByRole("button", { name: "返回周期表", exact: true }).click();
    await expect(page.locator("#key-h")).toBeFocused();

    await page.locator("#key-h").tap();
    await expect(page).toHaveURL(/#\/element\/h$/);
    await expect(page.locator(".knowledge-map")).toBeVisible();
    await page.getByRole("button", { name: "返回周期表", exact: true }).tap();
    await expect(page.locator("#key-h")).toBeFocused();
  } finally {
    await context.close();
  }
});

test("senior cards leave the accessibility tree immediately, animate before hiding, and survive a fast level reversal", async ({
  page,
}) => {
  await openDemo(page, false);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-reduced",
    "false",
  );

  const card = page.locator("#km-card-h-configuration");
  await expect
    .poll(() =>
      card.evaluate((node) => {
        const style = getComputedStyle(node);
        const transitions = node.getAnimations().filter((animation) => {
          const property = (
            animation as Animation & { transitionProperty?: string }
          ).transitionProperty;
          return property === "transform" || property === "opacity";
        });
        return {
          opacity: Number(style.opacity),
          visibility: style.visibility,
          transitions: transitions.length,
        };
      }),
    )
    .toEqual({ opacity: 1, visibility: "visible", transitions: 0 });
  const before = await card.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      display: style.display,
      opacity: Number(style.opacity),
      transform: style.transform,
    };
  });
  expect(before.display).not.toBe("none");
  expect(before.opacity).toBe(1);

  const selectMode = async (mode: "junior" | "senior") => {
    const label = mode === "junior" ? "初中版" : "高中版";
    await page.evaluate((buttonLabel) => {
      document
        .querySelector<HTMLButtonElement>(
          `.learning-switch button[aria-label="${buttonLabel}"]`,
        )!
        .click();
    }, label);
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-mode",
      mode,
    );
  };

  await card.evaluate((node) => {
    type MotionSample = {
      properties: string[];
      opacity: number;
      transform: string;
      progress: number[];
    };
    const view = window as Window & { __kmCardMotionSample?: MotionSample };
    view.__kmCardMotionSample = undefined;
    const capture = (event: Event) => {
      const transitionEvent = event as TransitionEvent;
      if (
        transitionEvent.target !== node ||
        !["transform", "opacity"].includes(transitionEvent.propertyName)
      )
        return;
      const animations = node.getAnimations().filter((animation) => {
        const property = (
          animation as Animation & { transitionProperty?: string }
        ).transitionProperty;
        return property === "transform" || property === "opacity";
      });
      if (animations.length < 2) return;
      document.removeEventListener("transitionrun", capture, true);
      const properties = animations.map(
        (animation) =>
          (animation as Animation & { transitionProperty?: string })
            .transitionProperty!,
      );
      const durations = animations.map((animation) =>
        Number(animation.effect?.getTiming().duration),
      );
      animations.forEach((animation, index) => {
        animation.pause();
        animation.currentTime = durations[index] / 2;
      });
      requestAnimationFrame(() => {
        const style = getComputedStyle(node);
        view.__kmCardMotionSample = {
          properties,
          opacity: Number(style.opacity),
          transform: style.transform,
          progress: animations.map(
            (animation, index) =>
              Number(animation.currentTime) / durations[index],
          ),
        };
        animations.forEach((animation) => animation.play());
      });
    };
    document.addEventListener("transitionrun", capture, true);
  });

  await selectMode("junior");
  const immediate = await card.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      display: style.display,
      ariaHidden: node.getAttribute("aria-hidden"),
      inert: (node as HTMLElement).inert,
      active: node.getAttribute("data-active"),
    };
  });
  expect(immediate.display).not.toBe("none");
  expect(immediate.ariaHidden).toBe("true");
  expect(immediate.inert).toBe(true);
  expect(immediate.active).toBe("false");

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          !!(window as Window & { __kmCardMotionSample?: unknown })
            .__kmCardMotionSample,
      ),
    )
    .toBe(true);
  const midpoint = await page.evaluate(
    () =>
      (
        window as Window & {
          __kmCardMotionSample?: {
            properties: string[];
            opacity: number;
            transform: string;
            progress: number[];
          };
        }
      ).__kmCardMotionSample!,
  );
  expect(midpoint.properties).toEqual(
    expect.arrayContaining(["transform", "opacity"]),
  );
  expect(midpoint.opacity).toBeGreaterThan(0);
  expect(midpoint.opacity).toBeLessThan(before.opacity);
  expect(midpoint.transform).not.toBe(before.transform);
  expect(midpoint.progress).toHaveLength(2);
  expect(
    midpoint.progress.every((progress) => progress > 0 && progress < 1),
  ).toBe(true);

  await expect
    .poll(() =>
      card.evaluate((node) => ({
        display: getComputedStyle(node).display,
        visibility: getComputedStyle(node).visibility,
        opacity: Number(getComputedStyle(node).opacity),
        inert: (node as HTMLElement).inert,
      })),
    )
    .toEqual({
      display: "block",
      visibility: "hidden",
      opacity: 0,
      inert: true,
    });

  // Let each React update commit while all prior card transitions are still
  // reversing naturally in the browser.
  await selectMode("senior");
  await selectMode("junior");
  await selectMode("senior");
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    seniorCardCount,
  );
  await expect(card).toHaveAttribute("aria-hidden", "false");
  await expect(card).not.toHaveAttribute("inert", "");
  await card.locator(".km-card-open").click();
  await expect(page.getByRole("dialog")).toContainText("1s¹");
});

test("a first-level branch button collapses and restores only its cards", async ({
  page,
}) => {
  await openDemo(page);
  const branch = page.locator("#km-branch-h-atom");
  const cards = page.locator("#km-group-h-atom .km-card[data-active='true']");
  await expect(branch).toHaveAttribute("aria-expanded", "true");
  await expect(cards).toHaveCount(4);

  await branch.click();
  await expect(branch).toHaveAttribute("aria-expanded", "false");
  await expect(cards).toHaveCount(0);
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    seniorCardCount - atomBranchCardCount,
  );

  await branch.click();
  await expect(branch).toHaveAttribute("aria-expanded", "true");
  await expect(cards).toHaveCount(4);
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    seniorCardCount,
  );
});

test("source Escape and dialog Escape, close, and backdrop preserve route and card focus", async ({
  page,
}) => {
  await openDemo(page);
  const routeBefore = page.url();
  const opener = page.getByRole("button", {
    name: "展开知识卡：水的组成",
  });
  const waterCard = page.locator("#km-card-h-water");
  await expect(
    waterCard.getByRole("heading", { name: "水的组成" }),
  ).toBeVisible();
  await expect(waterCard.locator(".km-card-open p")).toContainText(
    "水的化学式为H₂O",
  );
  const dialog = page.locator("dialog.km-card-dialog");
  const openWaterCard = async () => {
    await opener.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("水的组成");
    await expect(dialog).toContainText("水的化学式为H₂O");
    await expect(dialog.locator(".km-dialog-top > span")).toHaveText(
      hydrogenPack.cards.find((card) => card.id === "h-water")!.curriculum!
        .volume,
    );
    await expect(dialog.locator(".km-source")).toHaveCount(1);
    await expect(dialog.locator(".km-dialog-top")).not.toContainText(
      "交互样例",
    );
    expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(page).toHaveURL(routeBefore);
  };
  const expectReturnedToCard = async () => {
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page).toHaveURL(routeBefore);
  };

  await openWaterCard();
  const dialogSource = dialog.locator(".km-source-trigger");
  await dialogSource.click();
  await expect(dialog.locator(".km-source[open]")).toHaveCount(1);
  await expect(dialog.locator(".km-source[open] a").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".km-source[open]")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expectReturnedToCard();

  await openWaterCard();
  await page.getByRole("button", { name: "收起知识卡" }).click();
  await expectReturnedToCard();

  await openWaterCard();
  const rect = (await dialog.boundingBox())!;
  await page.mouse.click(rect.x - 12, rect.y + rect.height / 2);
  await expectReturnedToCard();
});

test("verified textbook links stay visible in the card dialog on narrow touch screens", async ({
  browser,
  baseURL,
}) => {
  const textbook = hydrogenKnowledge.sources.find(
    (source) => source.id === "pep-jh2024-up-p93",
  );
  const pageRecord = textbook?.pages.find((record) => record.linkVerified);
  expect(textbook?.kind).toBe("textbook");
  expect(pageRecord).toBeDefined();
  const pageUrl = pageRecord!.pageUrl;

  const context = await browser.newContext({
    baseURL,
    viewport: { width: 320, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  await context.route(
    (url) => url.href === pageUrl,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Intercepted source URL</title>",
      }),
  );
  const page = await context.newPage();
  try {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await openDemo(page);
      await page.getByRole("button", { name: "展开知识卡：水的组成" }).tap();
      const dialog = page.locator("dialog.km-card-dialog");
      await expect(dialog).toBeVisible();
      const trigger = dialog.locator(".km-source-trigger");
      await expect(trigger).toHaveText("教材依据");
      await trigger.tap();
      const panel = dialog.locator(".km-source-panel");
      await expect(panel).toBeVisible();

      const geometry = await page.evaluate(() => {
        const dialog = document.querySelector("dialog.km-card-dialog")!;
        const panel = dialog.querySelector<HTMLElement>(".km-source-panel")!;
        const dialogRect = dialog.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        return {
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          dialogLeft: dialogRect.left,
          dialogRight: dialogRect.right,
          dialogScrollWidth: dialog.scrollWidth,
          dialogClientWidth: dialog.clientWidth,
          panelLeft: panelRect.left,
          panelRight: panelRect.right,
          panelScrollWidth: panel.scrollWidth,
          panelClientWidth: panel.clientWidth,
        };
      });
      expect(geometry.viewport).toBe(width);
      expect(geometry.document).toBeLessThanOrEqual(width);
      expect(geometry.dialogScrollWidth).toBeLessThanOrEqual(
        geometry.dialogClientWidth,
      );
      expect(geometry.panelScrollWidth).toBeLessThanOrEqual(
        geometry.panelClientWidth,
      );
      expect(geometry.panelLeft).toBeGreaterThanOrEqual(geometry.dialogLeft);
      expect(geometry.panelRight).toBeLessThanOrEqual(geometry.dialogRight);

      const link = dialog.getByRole("link", { name: /p\.93/ });
      await expect(link).toHaveAttribute("href", pageUrl);
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      if (width === 390) {
        const popupPromise = context.waitForEvent("page");
        await link.tap();
        const popup = await popupPromise;
        try {
          await expect(popup).toHaveURL(pageUrl);
          await expect(popup).toHaveTitle("Intercepted source URL");
        } finally {
          await popup.close();
        }
      }
      await page.getByRole("button", { name: "收起知识卡" }).tap();
      await expect(dialog).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
});

test("hover zoom keeps the pointed card under the pointer, and leaving the stage restores the map", async ({
  page,
}) => {
  await openDemo(page, false);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-arriving",
    "false",
  );
  await page.waitForFunction(async () => {
    const camera = document.querySelector<HTMLElement>(".km-camera");
    if (!camera || camera.getAnimations().length > 0) return false;
    const transform = getComputedStyle(camera).transform;
    await new Promise(requestAnimationFrame);
    return (
      camera.getAnimations().length === 0 &&
      getComputedStyle(camera).transform === transform
    );
  });
  const card = page.locator("#km-card-h-water .km-card-open");
  await expect(card).toBeVisible();
  const startCamera = await page
    .locator(".km-camera")
    .evaluate((node) => getComputedStyle(node).transform);
  const before = (await card.boundingBox())!;
  const pointer = {
    x: before.x + before.width / 2,
    y: before.y + before.height / 2,
  };
  await page.mouse.move(pointer.x, pointer.y);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "h-water",
  );

  await expect
    .poll(() =>
      page
        .locator(".km-camera")
        .evaluate((node) => getComputedStyle(node).transform),
    )
    .not.toBe(startCamera);
  await expect
    .poll(async () => {
      const rect = await card.boundingBox();
      return (
        !!rect &&
        pointer.x >= rect.x &&
        pointer.x <= rect.x + rect.width &&
        pointer.y >= rect.y &&
        pointer.y <= rect.y + rect.height
      );
    })
    .toBe(true);
  const zoomedScale = await page
    .locator(".km-camera")
    .evaluate(
      (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a,
    );

  await page.mouse.click(pointer.x, pointer.y);
  await expect(page.getByRole("dialog")).toContainText("水的组成");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card).toBeFocused();
  await page.mouse.move(0, 0);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "none",
  );
  await expect(page.locator(".km-stage")).toHaveAttribute(
    "data-camera-state",
    "overview",
  );
  const restoredCamera = await page.locator(".km-camera").evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42, scale: matrix.a };
  });
  expect(restoredCamera.x).toBeCloseTo(0, 2);
  expect(restoredCamera.y).toBeCloseTo(0, 2);
  expect(restoredCamera.scale).toBeLessThan(zoomedScale);
});

test("320px, 390px, 768px, and 1024px touch layouts group cards vertically without horizontal overflow", async ({
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
  await context.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  const page = await context.newPage();
  try {
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(knowledgeMapUrl);
      await expect(page.locator(".knowledge-map")).toHaveAttribute(
        "data-reduced",
        "true",
      );
      await expectDemoChromeRemoved(page);
      await expectCenteredBranchText(page);
      const metrics = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(metrics.document).toBeLessThanOrEqual(metrics.viewport);
      expect(metrics.viewport).toBe(width);

      const groups = await page
        .locator('.km-branch-group[data-active="true"]')
        .evaluateAll((nodes) =>
          nodes.map((group) => {
            const branch = group.querySelector<HTMLElement>(".km-branch")!;
            const branchRect = branch.getBoundingClientRect();
            const cards = [
              ...group.querySelectorAll<HTMLElement>(
                '.km-card[data-active="true"]',
              ),
            ].map((card) => {
              const rect = card.getBoundingClientRect();
              return {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                width: rect.width,
              };
            });
            return {
              branchBottom: branchRect.bottom,
              cards,
            };
          }),
        );
      expect(groups).toHaveLength(4);
      expect(await page.locator('.km-card[data-active="true"]').count()).toBe(
        seniorCardCount,
      );
      for (const group of groups) {
        expect(group.cards.length).toBeGreaterThan(0);
        for (const card of group.cards) {
          expect(card.left).toBeGreaterThanOrEqual(0);
          expect(card.right).toBeLessThanOrEqual(width);
          expect(card.top).toBeGreaterThanOrEqual(group.branchBottom);
        }
      }

      const opener = page
        .locator(".km-card[data-active='true'] .km-card-open")
        .first();
      await opener.tap();
      const dialog = page.locator("dialog.km-card-dialog");
      await expect(dialog).toBeVisible();
      const dialogBox = (await dialog.boundingBox())!;
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(width);
      expect(await dialog.evaluate((node) => node.getAnimations().length)).toBe(
        0,
      );
      await page.getByRole("button", { name: "收起知识卡" }).tap();
      await expect(dialog).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
});

test("compact touch cards interpolate from their natural height to zero without reduced motion", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 768, height: 1000 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  const page = await context.newPage();
  try {
    await openDemo(page, false);
    expect(
      await page.evaluate(
        () => matchMedia("(max-width: 1100px) and (pointer: coarse)").matches,
      ),
    ).toBe(true);
    const card = page.locator("#km-card-h-configuration");
    await expect
      .poll(() =>
        card.evaluate((node) => {
          const style = getComputedStyle(node);
          const heightTransitions = node
            .getAnimations()
            .filter(
              (animation) =>
                (animation as Animation & { transitionProperty?: string })
                  .transitionProperty === "height",
            );
          return {
            height: Number.parseFloat(style.height),
            opacity: Number(style.opacity),
            visibility: style.visibility,
            transitions: heightTransitions.length,
          };
        }),
      )
      .toMatchObject({
        opacity: 1,
        visibility: "visible",
        transitions: 0,
      });
    const beforeHeight = await card.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).height),
    );
    expect(beforeHeight).toBeGreaterThan(0);

    await card.evaluate((node) => {
      type Sample = {
        beforeHeight: number;
        height: number;
        duration: number;
        progress: number;
      };
      const view = window as Window & { __kmHeightSample?: Sample };
      view.__kmHeightSample = undefined;
      const beforeHeight = Number.parseFloat(getComputedStyle(node).height);
      const capture = (event: Event) => {
        const transitionEvent = event as TransitionEvent;
        if (
          transitionEvent.target !== node ||
          transitionEvent.propertyName !== "height"
        )
          return;

        const transition = node
          .getAnimations()
          .find(
            (animation) =>
              (animation as Animation & { transitionProperty?: string })
                .transitionProperty === "height",
          );
        if (!transition) return;
        document.removeEventListener("transitionrun", capture, true);
        const duration = Number(transition.effect?.getTiming().duration);
        transition.pause();
        transition.currentTime = duration / 2;
        requestAnimationFrame(() => {
          view.__kmHeightSample = {
            beforeHeight,
            height: Number.parseFloat(getComputedStyle(node).height),
            duration,
            progress: Number(transition.currentTime) / duration,
          };
          transition.play();
        });
      };
      document.addEventListener("transitionrun", capture, true);
    });

    await page.evaluate(() => {
      document
        .querySelector<HTMLButtonElement>(
          '.learning-switch button[aria-label="初中版"]',
        )!
        .click();
    });
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-mode",
      "junior",
    );
    const immediate = await card.evaluate((node) => ({
      display: getComputedStyle(node).display,
      ariaHidden: node.getAttribute("aria-hidden"),
      inert: (node as HTMLElement).inert,
    }));
    expect(immediate.display).not.toBe("none");
    expect(immediate.ariaHidden).toBe("true");
    expect(immediate.inert).toBe(true);

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            !!(window as Window & { __kmHeightSample?: unknown })
              .__kmHeightSample,
        ),
      )
      .toBe(true);
    const midpoint = await page.evaluate(
      () =>
        (
          window as Window & {
            __kmHeightSample?: {
              beforeHeight: number;
              height: number;
              duration: number;
              progress: number;
            };
          }
        ).__kmHeightSample!,
    );
    expect(midpoint.duration).toBeGreaterThan(0);
    expect(midpoint.height).toBeGreaterThan(0);
    expect(midpoint.height).toBeLessThan(midpoint.beforeHeight);
    expect(midpoint.height).toBeLessThan(beforeHeight);
    expect(midpoint.progress).toBeCloseTo(0.5, 1);

    await expect
      .poll(() =>
        card.evaluate((node) => ({
          height: Number.parseFloat(getComputedStyle(node).height),
          display: getComputedStyle(node).display,
          visibility: getComputedStyle(node).visibility,
          opacity: Number(getComputedStyle(node).opacity),
        })),
      )
      .toEqual({
        height: 0,
        display: "block",
        visibility: "hidden",
        opacity: 0,
      });
  } finally {
    await context.close();
  }
});

test("the knowledge map and its open card dialog pass focused WCAG axe checks", async ({
  page,
}) => {
  await openDemo(page);
  await expectNoAxeViolations(page, ".knowledge-map");
  await page.getByRole("button", { name: "展开知识卡：水的组成" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAxeViolations(page, ".km-card-dialog");
});

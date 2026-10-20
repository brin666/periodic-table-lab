import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const axeTags = ["wcag2a", "wcag2aa", "wcag21aa"];
const readingItems = "[data-read-id]";

async function openHydrogen(page: Page) {
  await page.goto("/#/element/h/atom");
  await expect(page.locator(".explore-page")).toBeVisible();
  await expect(page.locator(".explore-page")).toHaveAttribute(
    "data-scene-motion",
    "false",
    { timeout: 4000 },
  );
}

async function hasIntermediateOpacity(locator: Locator) {
  return locator.evaluateAll((nodes) =>
    nodes.some((node) => {
      const opacity = Number(getComputedStyle(node).opacity);
      return opacity > 0 && opacity < 1;
    }),
  );
}

async function allOpaque(locator: Locator) {
  return locator.evaluateAll((nodes) =>
    nodes.every((node) => Number(getComputedStyle(node).opacity) === 1),
  );
}

async function expectRevealTransition(item: Locator) {
  const pieces = item.locator(".stream-piece");
  await expect.poll(() => pieces.count()).toBeGreaterThan(0);
  await expect
    .poll(() => hasIntermediateOpacity(pieces), {
      intervals: [25, 50, 100],
      timeout: 2500,
    })
    .toBe(true);
  await expect.poll(() => allOpaque(pieces), { timeout: 5000 }).toBe(true);
}

test("the compact explorer removes redundant chrome while substance cards still hover, open, and return", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openHydrogen(page);

  await expect(page.locator(".explore-heading")).toHaveCount(0);
  await expect(page.locator(".story-copy .level-label")).toHaveCount(0);
  await expect(page.locator(".atom-section .section-label")).toHaveCount(0);
  await expect(page.locator(".round-arrow")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);
  const related = page.locator(".related-section");
  await expect(
    related.getByRole("heading", { name: "相关物质", exact: true }),
  ).toBeVisible();
  await expect(related.locator(".section-label, .related-intro")).toHaveCount(
    0,
  );

  const card = page.locator("#substance-water");
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect
    .poll(() =>
      card.evaluate((node) => {
        const transform = getComputedStyle(node).transform;
        return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
      }),
    )
    .toBeLessThan(-0.5);
  await card.click();
  await expect(page).toHaveURL(/#\/element\/h\/substance\/water$/);
  await expect(page.locator(".substance-info h1")).toHaveText("水");
  await page.getByRole("button", { name: "返回氢的探索" }).click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  await expect(card).toBeFocused();
  await expect(card.locator("..")).toHaveClass(/is-visible/);
});

test("facts and reading notes reveal once, remain revealed after scrolling and material navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openHydrogen(page);

  const facts = page.locator(".element-facts");
  const notes = page.locator(".explore-notes article");
  const items = page.locator(readingItems);
  await expect(facts).toHaveAttribute("data-read-state", "pending");
  await expect(notes).not.toHaveCount(0);
  await expect(notes.first()).toHaveAttribute("data-read-state", "pending");
  await expect(items).not.toHaveCount(0);
  const initial = await items.evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: (node as HTMLElement).dataset.readId,
      state: (node as HTMLElement).dataset.readState,
      instant: (node as HTMLElement).dataset.readInstant,
    })),
  );
  const ids = initial.map((item) => item.id);
  expect(ids.every(Boolean)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
  expect(initial.every((item) => item.state === "pending")).toBe(true);
  expect(initial.every((item) => item.instant === "false")).toBe(true);
  const streamText = await items.evaluateAll((nodes) =>
    nodes.flatMap((node) =>
      Array.from(
        node.querySelectorAll<HTMLElement>(".stream-text"),
        (stream) => ({
          accessible: stream.querySelector(".sr-only")?.textContent ?? null,
          visual: Array.from(stream.querySelectorAll(".stream-piece"))
            .map((piece) => piece.textContent ?? "")
            .join(""),
        }),
      ),
    ),
  );
  expect(streamText.length).toBeGreaterThan(0);
  expect(
    streamText.every(
      (stream) =>
        stream.accessible !== null && stream.accessible === stream.visual,
    ),
  ).toBe(true);
  await expect(facts.locator(".reading-item strong .stream-piece")).toHaveCount(
    0,
  );
  await expect(
    page.locator(".configuration-note code .stream-piece"),
  ).toHaveCount(0);
  await expect(facts).not.toBeInViewport();

  await facts.scrollIntoViewIfNeeded();
  await expect(facts).toHaveAttribute("data-read-state", "visible");
  await expectRevealTransition(facts);

  const firstNote = notes.first();
  await firstNote.scrollIntoViewIfNeeded();
  await expect(firstNote).toHaveAttribute("data-read-state", "visible");
  await expectRevealTransition(firstNote);

  for (const note of await notes.all()) {
    await note.scrollIntoViewIfNeeded();
    await expect(note).toHaveAttribute("data-read-state", "visible");
    await expect
      .poll(() => allOpaque(note.locator(".stream-piece")))
      .toBe(true);
  }
  await expect.poll(() => allOpaque(facts.locator(".stream-piece"))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(facts).toHaveAttribute("data-read-state", "visible");
  await expect.poll(() => allOpaque(facts.locator(".stream-piece"))).toBe(true);
  expect(
    await items.evaluateAll((nodes) =>
      nodes.reduce(
        (count, node) =>
          count +
          Array.from(
            node.querySelectorAll<HTMLElement>(".stream-piece"),
          ).reduce((sum, piece) => sum + piece.getAnimations().length, 0),
        0,
      ),
    ),
  ).toBe(0);

  const card = page.locator("#substance-water");
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page).toHaveURL(/#\/element\/h\/substance\/water$/);
  await page.getByRole("button", { name: "返回氢的探索" }).click();
  await expect(page).toHaveURL(/#\/element\/h\/atom$/);
  const restored = await page.locator(readingItems).evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: (node as HTMLElement).dataset.readId,
      state: (node as HTMLElement).dataset.readState,
      instant: (node as HTMLElement).dataset.readInstant,
    })),
  );
  expect(restored.map((item) => item.id)).toEqual(ids);
  expect(restored.every((item) => item.state === "visible")).toBe(true);
  expect(restored.every((item) => item.instant === "true")).toBe(true);
  await expect
    .poll(() => allOpaque(page.locator(`${readingItems} .stream-piece`)))
    .toBe(true);
  expect(
    await page
      .locator(`${readingItems} .stream-piece`)
      .evaluateAll((pieces) =>
        pieces.reduce(
          (count, piece) => count + piece.getAnimations().length,
          0,
        ),
      ),
  ).toBe(0);
});

test("chemical formulas and percentages remain whole scientific reading pieces", async ({
  page,
}) => {
  const cases = [
    { route: "/#/element/he/atom", tokens: ["He₂"] },
    { route: "/#/element/o/atom", tokens: ["O₂", "21%"] },
  ];

  for (const { route, tokens } of cases) {
    await page.goto(route);
    await expect(page.locator(".explore-page")).toHaveAttribute(
      "data-scene-motion",
      "false",
      { timeout: 4000 },
    );

    const matchingStreams = await page
      .locator(".explore-notes article .stream-text")
      .evaluateAll(
        (nodes, requiredTokens) =>
          nodes.flatMap((node) => {
            const accessible =
              node.querySelector(".sr-only")?.textContent ?? "";
            if (!requiredTokens.every((token) => accessible.includes(token))) {
              return [];
            }
            return [
              {
                accessible,
                pieces: Array.from(
                  node.querySelectorAll<HTMLElement>(".stream-piece"),
                  (piece) => piece.textContent ?? "",
                ),
                atomicPieces: Array.from(
                  node.querySelectorAll<HTMLElement>(
                    ".stream-piece.stream-atomic",
                  ),
                  (piece) => piece.textContent ?? "",
                ),
              },
            ];
          }),
        tokens,
      );

    expect(matchingStreams).toHaveLength(1);
    for (const token of tokens) {
      expect(matchingStreams[0].accessible).toContain(token);
      expect(
        matchingStreams[0].pieces.filter((piece) => piece === token),
      ).toHaveLength(1);
      expect(
        matchingStreams[0].atomicPieces.filter((piece) => piece === token),
      ).toHaveLength(1);
    }
  }
});

test("a real touch swipe reveals below-the-fold element facts", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 700 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    await page.goto("/#/element/h/atom");
    await expect(page.locator(".explore-page")).toBeVisible();
    const facts = page.locator(".element-facts");
    await expect(facts).toHaveAttribute("data-read-state", "pending");
    await expect(facts).not.toBeInViewport();

    const session = await context.newCDPSession(page);
    const swipeUp = async () => {
      const before = await page.evaluate(() => window.scrollY);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 195, y: 650 }],
      });
      for (let step = 1; step <= 6; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 195, y: 650 - step * 80 }],
        });
        await page.waitForTimeout(16);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
        .toBeGreaterThan(before);
    };

    for (let attempt = 0; attempt < 6; attempt++) {
      if ((await facts.getAttribute("data-read-state")) === "visible") break;
      await swipeUp();
    }
    await expect(facts).toHaveAttribute("data-read-state", "visible");
    await expect(facts.locator(".stream-piece")).not.toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("manual reduced motion completes every reading reveal immediately and the page passes axe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openHydrogen(page);
  await expect(page.locator(".element-facts")).toHaveAttribute(
    "data-read-state",
    "pending",
  );

  await page.getByRole("button", { name: "减少动态", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  const items = page.locator(readingItems);
  await expect(items).not.toHaveCount(0);
  await expect
    .poll(() =>
      items.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            (node as HTMLElement).dataset.readState === "visible" &&
            (node as HTMLElement).dataset.readInstant === "true",
        ),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => allOpaque(page.locator(`${readingItems} .stream-piece`)))
    .toBe(true);

  const results = await new AxeBuilder({ page })
    .withTags(axeTags)
    .include(".explore-page")
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

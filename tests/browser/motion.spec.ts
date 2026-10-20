import { test, expect, type Locator, type Page } from "@playwright/test";

async function settleMotion(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}

async function translateY(locator: Locator) {
  return locator.evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
  });
}

async function expectOpaque(locators: Locator) {
  await expect
    .poll(() =>
      locators.evaluateAll((nodes) =>
        nodes.every((node) => Number(getComputedStyle(node).opacity) === 1),
      ),
    )
    .toBe(true);
}

async function expectNoRunningMotion(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === "running" || animation.pending,
            ).length,
      ),
    )
    .toBe(0);
}

test("settled material cards lift, depress and rebound after their entrance", async ({
  page,
}) => {
  await page.goto("/#/element/o");
  const card = page.locator("#substance-water");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("..")).toHaveClass(/is-visible/);
  await settleMotion(page);
  await page.mouse.move(0, 0);
  await expect.poll(() => translateY(card)).toBeCloseTo(0, 1);

  // A fill-mode animation on the button used to mask both interaction states.
  await card.hover();
  await settleMotion(page);
  expect(await translateY(card)).toBeLessThan(-0.5);
  await page.mouse.down();
  await expect.poll(() => translateY(card)).toBeGreaterThan(0.5);

  // Release outside the button to inspect its rebound without opening a route.
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect.poll(() => translateY(card)).toBeCloseTo(0, 1);
  await card.hover();
  await expect.poll(() => translateY(card)).toBeLessThan(-0.5);
  await expect(page).toHaveURL(/#\/element\/o$/);
});

test("a phone sees and can tap the first material without scrolling the new page", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const tableUrl = page.url();
    const hydrogenBox = (await page.locator("#key-h").boundingBox())!;
    await page.touchscreen.tap(
      hydrogenBox.x + hydrogenBox.width / 2,
      hydrogenBox.y + hydrogenBox.height / 2,
    );
    await expect(page).toHaveURL(tableUrl);
    await page.locator("#key-h").tap();
    await expect(page).toHaveURL(/#\/element\/h$/);
    await settleMotion(page);
    await expect(page.locator(".knowledge-map")).toBeVisible();
    await page.locator(".km-core-key").tap();
    await expect(page).toHaveURL(/#\/element\/h\/atom$/);
    expect(context.pages()).toHaveLength(1);
    await settleMotion(page);
    const firstCard = page.locator(".substance-card").first();
    await expect(firstCard).toBeInViewport();
    await expectOpaque(firstCard.locator(".."));
    expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await firstCard.tap();
    await expect(page).toHaveURL(/#\/element\/h\/substance\/water$/);
    await expect(page.locator(".substance-info h1")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a phone restores the material rail offset and focused card after returning", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    await page.goto("/#/element/h/atom");
    await settleMotion(page);
    const rail = page.locator(".related-cards");
    const peroxide = page.locator("#substance-hydrogen-peroxide");
    await rail.evaluate((node) => {
      const card = node.querySelector<HTMLElement>(
        "#substance-hydrogen-peroxide",
      )!;
      node.scrollTo({
        left:
          node.scrollLeft +
          card.getBoundingClientRect().left -
          node.getBoundingClientRect().left,
        behavior: "instant",
      });
    });
    await peroxide.scrollIntoViewIfNeeded();
    await expect(peroxide).toBeInViewport({ ratio: 0.99 });
    await expectOpaque(peroxide.locator(".."));
    await settleMotion(page);
    const savedOffset = await rail.evaluate((node) => node.scrollLeft);
    expect(savedOffset).toBeGreaterThan(100);
    await peroxide.tap();
    await expect(page).toHaveURL(/\/substance\/hydrogen-peroxide$/);
    await settleMotion(page);

    const expectRestoredRail = async () => {
      await expect(page).toHaveURL(/#\/element\/h\/atom$/);
      await settleMotion(page);
      await expect(peroxide).toBeFocused();
      await expect(peroxide).toBeInViewport({ ratio: 0.99 });
      await expect
        .poll(async () =>
          Math.abs(
            (await rail.evaluate((node) => node.scrollLeft)) - savedOffset,
          ),
        )
        .toBeLessThan(1);
    };
    await page.locator(".back-button").tap();
    await expectRestoredRail();
    await page.goForward();
    await expect(page).toHaveURL(/\/substance\/hydrogen-peroxide$/);
    await settleMotion(page);
    await page.goBack();
    await expectRestoredRail();
  } finally {
    await context.close();
  }
});

test("a material below the fold reveals on intersection and stays revealed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto("/#/element/o");
  const arrival = page.locator(".substance-arrival").last();
  await expect(page.locator(".substance-arrival")).toHaveCount(3);
  await settleMotion(page);
  await expect(arrival).not.toBeInViewport();
  await expect(arrival).toHaveClass(/is-pending/);
  await arrival.scrollIntoViewIfNeeded();
  await expect(arrival).toHaveClass(/is-visible/);
  await expectOpaque(arrival);
  await settleMotion(page);
  expect(Math.abs(await translateY(arrival))).toBeLessThan(0.1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(arrival).toHaveClass(/is-visible/);
  await arrival.scrollIntoViewIfNeeded();
  await expectOpaque(arrival);
});

for (const preference of ["system", "saved"] as const) {
  test(`initial ${preference} reduced motion leaves every scene at its final state`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 500 });
    if (preference === "system") {
      await page.emulateMedia({ reducedMotion: "reduce" });
    } else {
      await page.addInitScript(() =>
        localStorage.setItem("elements-reduced-motion", "true"),
      );
    }
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    await expect(page.locator(".table-page")).not.toHaveAttribute(
      "data-enter",
      "true",
    );
    await expect(page.locator(".key-arrival")).toHaveCount(118);
    await expectOpaque(page.locator(".key-arrival"));
    await page.locator("#key-o").click();
    await expect(page.locator(".atom-core")).toBeVisible();
    await expect(page.locator(".substance-arrival")).toHaveCount(3);
    await expectOpaque(page.locator(".substance-arrival"));
    await expect(page.locator(".substance-arrival.is-pending")).toHaveCount(0);
    await expectNoRunningMotion(page);
  });
}

for (const preference of ["manual", "system"] as const) {
  test(`${preference} reduced motion skips an H introduction that is already running`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .some(
          (animation) =>
            animation.id.startsWith("hydrogen-") &&
            animation.playState === "running",
        ),
    );
    const interrupted = await page.evaluate((preference) => {
      const animations = document
        .getAnimations()
        .filter(
          (animation) =>
            animation.id.startsWith("hydrogen-") &&
            animation.playState === "running",
        );
      // Hold a precise point in the real WAAPI scene while changing preference.
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 1650;
      }
      if (preference === "manual") {
        document.querySelector<HTMLButtonElement>(".motion-toggle")!.click();
      }
      return animations.length;
    }, preference);
    expect(interrupted).toBeGreaterThan(0);
    if (preference === "system") {
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    await expect(page.locator("html")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    await expect(page.locator(".table-page")).not.toHaveAttribute(
      "data-enter",
      "true",
    );
    await expectOpaque(page.locator(".key-arrival"));
    await expectNoRunningMotion(page);
    await page.locator("#key-o").click();
    await expect(page).toHaveURL(/#\/element\/o$/);
    await expect(page.locator("main h1")).toBeFocused();
    await expectOpaque(page.locator(".substance-arrival"));
  });
}

test("the H entrance does not replay after its first interruption", async ({
  page,
}) => {
  await page.goto("/");
  await page.mouse.click(4, 4);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await page.locator("#key-h").click();
  await expect(page.locator(".knowledge-map")).toBeVisible();
  await settleMotion(page);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.locator(".table-page")).toBeVisible();
  await expect(page.locator(".table-page")).not.toHaveAttribute(
    "data-enter",
    "true",
  );
  await expectOpaque(page.locator(".key-arrival"));
  await expect(page.locator("#key-h")).toBeFocused();
});

test("a new route interrupts an uncommitted view transition without stale focus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/");
  await settleMotion(page);
  // Both are genuine handlers in the same task: the first transition has not
  // committed its DOM when the home action supersedes it.
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#key-o")!.click();
    document.querySelector<HTMLButtonElement>(".wordmark")!.click();
  });
  await expect(page).toHaveURL(/#\/$/);
  await settleMotion(page);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator(".table-page")).toBeVisible();
  await expect(page.locator("#key-o")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/#\/element\/o$/);
  await settleMotion(page);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator(".atom-core")).toBeVisible();
  await expect(page.locator("main h1")).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/#\/$/);
  await settleMotion(page);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("#key-o")).toBeFocused();
  expect(errors).toEqual([]);
});

for (const { id, symbol, shells } of [
  { id: "o", symbol: "O", shells: [2, 6] },
  { id: "fe", symbol: "Fe", shells: [2, 8, 14, 2] },
]) {
  test(`${symbol} shares its atom core and updates the selected shell visually`, async ({
    page,
  }) => {
    await page.goto(`/#/element/${id}`);
    const core = page.locator(".atom-canvas .atom-core");
    await expect(core).toBeVisible();
    await settleMotion(page);
    await expect(core).toHaveCSS("view-transition-name", "element-key");
    await expect(page.locator(".hero-key .key-face")).toHaveCSS(
      "view-transition-name",
      "none",
    );
    expect(await core.evaluate((node) => node instanceof HTMLElement)).toBe(
      true,
    );
    const canvasBox = await page.locator(".atom-canvas").boundingBox();
    const coreBox = await core.boundingBox();
    expect(
      Math.abs(
        coreBox!.x + coreBox!.width / 2 - (canvasBox!.x + canvasBox!.width / 2),
      ),
    ).toBeLessThan(3);
    expect(
      Math.abs(
        coreBox!.y +
          coreBox!.height / 2 -
          (canvasBox!.y + canvasBox!.height / 2),
      ),
    ).toBeLessThan(3);
    await expect(page.locator(".electron-dot")).toHaveCount(
      shells.reduce((sum, count) => sum + count, 0),
    );
    const controls = page.locator(".shell-controls button");
    await expect(controls.last()).toHaveAttribute("aria-pressed", "true");

    for (const index of [0, shells.length - 1]) {
      await controls.nth(index).click();
      await expect(controls.nth(index)).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.locator(".shell-controls [aria-pressed=true]"),
      ).toHaveCount(1);
      await expect(page.locator(".shell-group.is-selected")).toHaveCount(1);
      await expect(
        page.locator(".shell-group.is-selected .electron-dot"),
      ).toHaveCount(shells[index]);
      await expect(page.locator(".shell-readout strong")).toHaveText(
        new RegExp(`^\\s*${shells[index]}\\s`),
      );
      await settleMotion(page);
      const selectedRadius = await page
        .locator(".shell-group.is-selected .electron-dot")
        .first()
        .evaluate((node) =>
          parseFloat(getComputedStyle(node).getPropertyValue("r")),
        );
      const otherRadius = await page
        .locator(".shell-group:not(.is-selected) .electron-dot")
        .first()
        .evaluate((node) =>
          parseFloat(getComputedStyle(node).getPropertyValue("r")),
        );
      expect(selectedRadius).toBeGreaterThan(otherRadius);
    }
  });
}

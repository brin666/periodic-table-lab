import { test, expect, type Page } from "@playwright/test";

const mapUrl = "/#/element/h";
const stageSelector = ".knowledge-map .km-stage";
const cameraSelector = ".knowledge-map .km-camera";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
});

async function openMap(
  page: Page,
  reducedMotion: "reduce" | "no-preference" = "no-preference",
) {
  await page.emulateMedia({ reducedMotion });
  await page.goto(mapUrl);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  await expect(page.locator(stageSelector)).toHaveAttribute(
    "data-camera-state",
    "overview",
  );
}

async function readPose(page: Page) {
  return page.locator(cameraSelector).evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42, scale: matrix.a };
  });
}

async function readWorldPointUnderPointer(page: Page, x: number, y: number) {
  return page.locator(stageSelector).evaluate(
    (stage, point) => {
      const rect = stage.getBoundingClientRect();
      const camera = stage.querySelector<HTMLElement>(".km-camera")!;
      const inverse = new DOMMatrixReadOnly(
        getComputedStyle(camera).transform,
      ).inverse();
      const local = inverse.transformPoint(
        new DOMPoint(
          point.x - rect.left - rect.width / 2,
          point.y - rect.top - rect.height / 2,
        ),
      );
      return { x: local.x, y: local.y };
    },
    { x, y },
  );
}

async function stagePoint(page: Page, dx: number, dy: number) {
  return page.locator(stageSelector).evaluate(
    (stage, offset) => {
      const rect = stage.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + offset.x,
        y: rect.top + rect.height / 2 + offset.y,
      };
    },
    { x: dx, y: dy },
  );
}

async function sampleCameraFrames(page: Page, x: number, y: number) {
  return page.locator(cameraSelector).evaluate(
    async (camera, point) => {
      const stage = camera.closest<HTMLElement>(".km-stage")!;
      const rect = stage.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const samples: { scale: number; x: number; y: number }[] = [];
      for (let frame = 0; frame < 14; frame += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const matrix = new DOMMatrixReadOnly(
          getComputedStyle(camera).transform,
        );
        const local = matrix
          .inverse()
          .transformPoint(new DOMPoint(point.x - center.x, point.y - center.y));
        samples.push({ scale: matrix.a, x: local.x, y: local.y });
      }
      return samples;
    },
    { x, y },
  );
}

test("the camera follows the pointer as its zoom anchor from whitespace and during movement", async ({
  page,
}) => {
  await openMap(page);
  const overview = await readPose(page);
  const first = await stagePoint(page, 72, 46);

  await page.mouse.move(first.x, first.y);
  await expect(page.locator(stageSelector)).toHaveAttribute(
    "data-camera-state",
    "following",
  );
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "none",
  );
  const firstFrames = await sampleCameraFrames(page, first.x, first.y);
  const firstScales = firstFrames.map((sample) => sample.scale);
  expect(firstScales.at(-1)).toBeGreaterThan(firstScales[0]);
  expect(
    firstScales.some(
      (scale, index) =>
        index > 0 &&
        index < firstScales.length - 1 &&
        scale > firstScales[0] &&
        scale < firstScales.at(-1)!,
    ),
  ).toBe(true);
  expect(
    firstFrames.every(
      (sample) =>
        Number.isFinite(sample.scale) &&
        Number.isFinite(sample.x) &&
        Number.isFinite(sample.y) &&
        Math.abs(sample.x - 72 / overview.scale) < 1 &&
        Math.abs(sample.y - 46 / overview.scale) < 1,
    ),
  ).toBe(true);

  const firstWorldPoint = await readWorldPointUnderPointer(
    page,
    first.x,
    first.y,
  );
  expect(firstWorldPoint.x).toBeCloseTo(72 / overview.scale, 0);
  expect(firstWorldPoint.y).toBeCloseTo(46 / overview.scale, 0);

  const second = await stagePoint(page, 116, 78);
  await page.mouse.move(second.x, second.y, { steps: 8 });
  await expect(page.locator(stageSelector)).toHaveAttribute(
    "data-camera-state",
    "following",
  );
  await page.waitForTimeout(650);

  const secondWorldPoint = await readWorldPointUnderPointer(
    page,
    second.x,
    second.y,
  );
  expect(secondWorldPoint.x).toBeCloseTo(116 / overview.scale, 0);
  expect(secondWorldPoint.y).toBeCloseTo(78 / overview.scale, 0);
});

test("moving from open space onto a card updates the target, and reversing or leaving never leaves a stale pose", async ({
  page,
}) => {
  await openMap(page);
  const overview = await readPose(page);
  const stage = page.locator(stageSelector);
  const bounds = (await stage.boundingBox())!;
  const blank = { x: bounds.x + 18, y: bounds.y + 18 };
  await page.mouse.move(blank.x, blank.y);
  await expect(stage).toHaveAttribute("data-camera-state", "following");
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "none",
  );

  const waterCard = page.locator("#km-card-h-water .km-card-open");
  await waterCard.hover();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "h-water",
  );
  await expect(stage).toHaveAttribute("data-camera-state", "following");

  const reverse = await stagePoint(page, -78, 34);
  await page.mouse.move(reverse.x, reverse.y, { steps: 10 });
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "none",
  );
  const poseDuringReverse = await readPose(page);
  expect(
    [poseDuringReverse.x, poseDuringReverse.y, poseDuringReverse.scale].every(
      Number.isFinite,
    ),
  ).toBe(true);

  await page.mouse.move(0, 0);
  await expect(stage).toHaveAttribute("data-camera-state", "overview");
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "none",
  );
  const restored = await readPose(page);
  expect(restored.x).toBeCloseTo(0, 1);
  expect(restored.y).toBeCloseTo(0, 1);
  expect(restored.scale).toBeCloseTo(overview.scale, 2);
});

test("the view returns to the full map after the pointer rests, and dialog interaction freezes it", async ({
  page,
}) => {
  await openMap(page);
  const stage = page.locator(stageSelector);
  const overview = await readPose(page);
  const waterCard = page.locator("#km-card-h-water .km-card-open");
  await waterCard.hover();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-focused",
    "h-water",
  );
  await expect(stage).toHaveAttribute("data-camera-state", "following");
  await expect
    .poll(async () => (await readPose(page)).scale)
    .toBeGreaterThan(overview.scale + 0.05);

  await expect(stage).toHaveAttribute("data-camera-state", "returning", {
    timeout: 4000,
  });
  await expect(stage).toHaveAttribute("data-camera-state", "overview", {
    timeout: 3000,
  });
  const restored = await readPose(page);
  expect(restored.x).toBeCloseTo(0, 1);
  expect(restored.y).toBeCloseTo(0, 1);
  expect(restored.scale).toBeCloseTo(overview.scale, 3);

  await waterCard.hover();
  await waterCard.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(stage).toHaveAttribute("data-camera-state", "frozen");
  const frozen = await readPose(page);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  expect(await readPose(page)).toEqual(frozen);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(waterCard).toBeFocused();
  expect([...Object.values(await readPose(page))].every(Number.isFinite)).toBe(
    true,
  );
});

test("reduced motion and touch input keep the camera static", async ({
  page,
  browser,
  baseURL,
}) => {
  await openMap(page, "reduce");
  const reducedStart = await readPose(page);
  const reducedPoints = [
    await stagePoint(page, 86, 60),
    await stagePoint(page, -94, -58),
  ];
  for (const point of reducedPoints)
    await page.mouse.move(point.x, point.y, { steps: 6 });
  await page.waitForTimeout(180);
  expect(await readPose(page)).toEqual(reducedStart);
  await expect(page.locator(stageSelector)).toHaveAttribute(
    "data-camera-state",
    "overview",
  );

  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
  const mobilePage = await context.newPage();
  try {
    await mobilePage.goto(mapUrl);
    const stage = mobilePage.locator(stageSelector);
    await expect(mobilePage.locator(".knowledge-map")).toHaveAttribute(
      "data-revealed",
      "2",
    );
    await expect(stage).toHaveAttribute("data-camera-state", "overview");
    const mobileStart = await readPose(mobilePage);
    const bounds = (await stage.boundingBox())!;
    await mobilePage.touchscreen.tap(bounds.x + 12, bounds.y + 12);
    await expect(stage).toHaveAttribute("data-camera-state", "overview");
    expect(await readPose(mobilePage)).toEqual(mobileStart);
  } finally {
    await context.close();
  }
});

test("dialog source links stay still, and Escape closes the source before returning focus", async ({
  page,
}) => {
  await openMap(page);
  const opener = page.locator("#km-card-h-water .km-card-open");
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const stage = page.locator(stageSelector);
  await expect(stage).toHaveAttribute("data-camera-state", "frozen");

  const source = dialog.locator(".km-source");
  const summary = source.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(source).toHaveAttribute("open", "");
  await expect(stage).toHaveAttribute("data-camera-state", "frozen");
  const frozen = await readPose(page);
  await expect(dialog.locator(".km-source[open] a").first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(await readPose(page)).toEqual(frozen);

  await page.keyboard.press("Escape");
  await expect(source).not.toHaveAttribute("open", "");
  await expect(dialog).toBeVisible();
  await expect(summary).toBeFocused();
  expect(await readPose(page)).toEqual(frozen);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

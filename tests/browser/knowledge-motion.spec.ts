import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { connectionEase } from "../../src/knowledge-connection-motion";
import { getKnowledgePack } from "../../src/data/element-knowledge";
import {
  crossLine,
  exposedLinePoint,
  installEntranceProbe,
  readEntranceProbe,
  readWaveProbe,
  startWaveProbe,
} from "./helpers/knowledge-motion-probe";

const url = "/#/element/h";
const activeLines = '.km-connection[data-active="true"]';
const seniorLineCount =
  getKnowledgePack("h")!.cards.length + getKnowledgePack("h")!.branches.length;
// Trace screenshot streaming perturbs sub-second motion; raw frame JSON and dedicated video are saved instead.
test.use({ trace: "off" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
});

test("the center and first level precede twenty brief, ordered card arrivals coordinated with their lines", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await installEntranceProbe(page);
  await page.goto(url);
  const frames = await readEntranceProbe(page);
  const framesPath = testInfo.outputPath("entrance-frames.json");
  await writeFile(framesPath, JSON.stringify(frames, null, 2));
  await testInfo.attach("entrance-frames.json", {
    path: framesPath,
    contentType: "application/json",
  });
  const last = frames.at(-1)!;
  expect(last.cards).toHaveLength(getKnowledgePack("h")!.cards.length);
  const arrivals = last.cards.map((card) => {
    const first = frames.find((frame) =>
      frame.cards.find((node) => node.id === card.id && node.opacity > 0.05),
    )!;
    const settled = frames.find((frame) =>
      frame.cards.find(
        (node) =>
          node.id === card.id &&
          node.arrival === "settled" &&
          node.opacity === 1,
      ),
    )!;
    const scheduled = frames
      .flatMap((frame) => frame.cards)
      .find((node) => node.id === card.id && node.delay !== null)!;
    return {
      id: card.id,
      first,
      settled,
      delay: scheduled.delay!,
      duration: scheduled.duration!,
    };
  });
  const firstCardTime = Math.min(...arrivals.map((card) => card.first.time));
  expect(
    frames.some(
      (frame) =>
        frame.time < firstCardTime &&
        frame.coreVisible &&
        frame.branchesVisible === 4,
    ),
  ).toBe(true);
  expect(new Set(arrivals.map((card) => card.delay)).size).toBe(
    getKnowledgePack("h")!.cards.length,
  );
  expect(arrivals.every((card) => card.duration === 240)).toBe(true);
  expect(
    new Set(arrivals.map((card) => card.first.time)).size,
  ).toBeGreaterThanOrEqual(10);
  const ordered = [...arrivals].sort((a, b) => a.delay - b.delay);
  expect(
    ordered.every(
      (card, i) => i === 0 || card.first.time >= ordered[i - 1].first.time,
    ),
  ).toBe(true);
  expect(
    Math.max(...arrivals.map((card) => card.settled.time)),
  ).toBeLessThanOrEqual(1330);
  expect(
    arrivals.every(
      (card) =>
        card.first.lines.find((line) => line.id === card.id)!.progress > 0.75,
    ),
  ).toBe(true);
  expect(
    last.cards.every(
      (card) => card.opacity === 1 && card.arrival === "settled" && !card.inert,
    ),
  ).toBe(true);
  expect(
    last.lines.every((line) => line.progress === 1 && line.offset === 0),
  ).toBe(true);
  // The last leaf is sampled after the initial page rasterization, avoiding an unobserved finish inside a long first-paint frame.
  const lineId = last.lines.filter((line) => line.tier === "leaf").at(-1)!.id;
  const lineFrames = frames
    .map((frame) => ({
      time: frame.time,
      ...frame.lines.find((line) => line.id === lineId)!,
    }))
    .filter((frame) => frame.progress > 0 && frame.progress < 1);
  // Missing a first/last partial frame does not shorten the actual animation.
  // Recover each observed time fraction from the real progress, then fit the
  // elapsed duration rather than treating our sampling window as its duration.
  const timed = lineFrames
    .filter((frame) => frame.progress > 0.02 && frame.progress < 0.98)
    .map((frame) => {
      let low = 0,
        high = 1;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        if (connectionEase(mid) < frame.progress) low = mid;
        else high = mid;
      }
      return { phase: (low + high) / 2, time: frame.time };
    });
  expect(timed.length).toBeGreaterThanOrEqual(4);
  const meanPhase =
    timed.reduce((sum, frame) => sum + frame.phase, 0) / timed.length;
  const meanTime =
    timed.reduce((sum, frame) => sum + frame.time, 0) / timed.length;
  const fittedDuration =
    timed.reduce(
      (sum, frame) => sum + (frame.phase - meanPhase) * (frame.time - meanTime),
      0,
    ) / timed.reduce((sum, frame) => sum + (frame.phase - meanPhase) ** 2, 0);
  expect(fittedDuration).toBeGreaterThanOrEqual(230);
  expect(fittedDuration).toBeLessThanOrEqual(290);
  const slopes = lineFrames.slice(1).map((frame, i) => ({
    progress: (frame.progress + lineFrames[i].progress) / 2,
    speed:
      (frame.progress - lineFrames[i].progress) /
      (frame.time - lineFrames[i].time),
  }));
  const fastest = Math.max(...slopes.map((frame) => frame.speed));
  expect(
    slopes
      .filter((frame) => frame.progress < 0.15 || frame.progress > 0.85)
      .every((frame) => frame.speed < fastest * 0.7),
  ).toBe(true);
  expect(
    lineFrames.every(
      (frame) => Math.abs(frame.offset - (1 - frame.progress)) < 0.001,
    ),
  ).toBe(true);
  // A gentle overshoot is visible on actual card transforms, then resolves to scale 1.
  expect(
    frames.some((frame) =>
      frame.cards.some((card) => card.scale > 1.001 && card.scale < 1.02),
    ),
  ).toBe(true);
  expect(last.cards.every((card) => Math.abs(card.scale - 1) < 0.001)).toBe(
    true,
  );
});

test("collapsing during arrival waits for remaining cards without leaving stale camera state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  const atomBranch = page.locator("#km-branch-h-atom");
  await expect(atomBranch).toHaveAttribute("aria-hidden", "false");
  await atomBranch.click();
  await expect(atomBranch).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-arriving",
    "true",
  );
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-arriving",
    "false",
  );
  expect(
    await page
      .locator('.km-card[data-active="true"]')
      .evaluateAll((cards) =>
        cards.every(
          (card) =>
            (card as HTMLElement).dataset.arrival === "settled" &&
            Number(getComputedStyle(card).opacity) === 1,
        ),
      ),
  ).toBe(true);
  await atomBranch.click();
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-arriving",
    "false",
  );
  const bounds = (await page.locator(".km-stage").boundingBox())!;
  await page.mouse.move(bounds.x + 15, bounds.y + 15);
  await expect(page.locator(".km-stage")).toHaveAttribute(
    "data-camera-state",
    "following",
  );
});

async function openMap(
  page: Page,
  reducedMotion: "reduce" | "no-preference" = "no-preference",
) {
  await page.emulateMedia({ reducedMotion });
  await page.goto(url);
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-revealed",
    "2",
  );
  await expect(page.locator(activeLines)).toHaveCount(seniorLineCount);
  await expect
    .poll(() =>
      page
        .locator(activeLines)
        .evaluateAll((paths) =>
          paths.every(
            (path) =>
              Number((path as SVGPathElement).dataset.revealProgress) === 1,
          ),
        ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator('.km-card[data-active="true"]')
        .evaluateAll((cards) =>
          cards.every((card) => Number(getComputedStyle(card).opacity) === 1),
        ),
    )
    .toBe(true);
}

test("a real mouse crossing plucks the actual curve with fixed ends, quiet color, and a short decay", async ({
  page,
}) => {
  await openMap(page);
  const { frames } = await crossLine(page, await exposedLinePoint(page));
  const waving = frames.filter((frame) => frame.wave);
  expect(waving.length).toBeGreaterThan(5);
  const peak = Math.max(
    ...waving.map((frame) => Math.max(frame.maxPositive, -frame.maxNegative)),
  );
  expect(peak).toBeGreaterThanOrEqual(3);
  expect(peak).toBeLessThanOrEqual(5.1);
  expect(
    waving.some((frame) => frame.maxPositive > 0.7 && frame.maxNegative < -0.7),
  ).toBe(true);
  expect(Math.max(...frames.map((frame) => frame.endpointDrift))).toBeLessThan(
    0.05,
  );
  expect(new Set(frames.map((frame) => frame.stroke)).size).toBe(1);
  expect(new Set(frames.map((frame) => frame.opacity)).size).toBe(1);
  // 380 ms plus one rendering frame, allowing normal CI scheduling variance.
  expect(waving.at(-1)!.time).toBeGreaterThanOrEqual(330);
  expect(waving.at(-1)!.time).toBeLessThanOrEqual(410);
  expect(
    frames
      .filter((frame) => frame.time > 450)
      .every(
        (frame) =>
          !frame.wave && Math.max(frame.maxPositive, -frame.maxNegative) < 0.05,
      ),
  ).toBe(true);
});

test("a still mouse produces no fresh wave while the camera returns through the scene", async ({
  page,
}) => {
  await openMap(page);
  const { point } = await crossLine(page, await exposedLinePoint(page));
  await startWaveProbe(page, point.id, 3400, false);
  const frames = await readWaveProbe(page);
  expect(frames.some((frame) => frame.cameraState === "returning")).toBe(true);
  expect(frames.some((frame) => frame.cameraState === "overview")).toBe(true);
  expect(frames.every((frame) => !frame.anyWave)).toBe(true);
  expect(
    Math.max(
      ...frames.map((frame) => Math.max(frame.maxPositive, -frame.maxNegative)),
    ),
  ).toBeLessThan(0.05);
});

test("rapid level reversals settle all cards and connections without leaving stale motion", async ({
  page,
}) => {
  await openMap(page);
  for (const mode of [
    "junior",
    "senior",
    "junior",
    "senior",
    "junior",
    "senior",
  ]) {
    await page
      .getByRole("button", {
        name: mode === "junior" ? "初中版" : "高中版",
        exact: true,
      })
      .evaluate((button) => (button as HTMLButtonElement).click());
    await page.waitForTimeout(55);
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-mode",
      mode,
    );
  }
  await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
    getKnowledgePack("h")!.cards.length,
  );
  await expect(page.locator(activeLines)).toHaveCount(seniorLineCount);
  await expect
    .poll(() =>
      page
        .locator(activeLines)
        .evaluateAll((paths) =>
          paths.every(
            (path) =>
              Number((path as SVGPathElement).dataset.revealProgress) === 1 &&
              Number.isFinite((path as SVGPathElement).getTotalLength()),
          ),
        ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator('.km-card[data-active="true"]')
        .evaluateAll((cards) =>
          cards.every(
            (card) =>
              getComputedStyle(card).visibility === "visible" &&
              Number(getComputedStyle(card).opacity) === 1 &&
              !(card as HTMLElement).inert,
          ),
        ),
    )
    .toBe(true);
  await page.locator("#km-card-h-water .km-card-open").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("水的组成");
  await page.keyboard.press("Escape");
  await expect(page.locator("#km-card-h-water .km-card-open")).toBeFocused();
});

test("reduced motion shows the complete graph and real mouse input leaves its curves still", async ({
  page,
}) => {
  await openMap(page, "reduce");
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-reduced",
    "true",
  );
  const point = await exposedLinePoint(page);
  await page.mouse.move(
    point.x - point.normalX * 18,
    point.y - point.normalY * 18,
  );
  await startWaveProbe(page, point.id);
  await page.mouse.move(
    point.x + point.normalX * 18,
    point.y + point.normalY * 18,
  );
  const frames = await readWaveProbe(page);
  expect(
    frames.every((frame) => !frame.anyWave && frame.cameraState === "overview"),
  ).toBe(true);
  expect(
    Math.max(
      ...frames.map((frame) => Math.max(frame.maxPositive, -frame.maxNegative)),
    ),
  ).toBeLessThan(0.05);
  await page.locator("#km-card-h-water .km-card-open").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const source = dialog.locator(".km-source");
  await expect(source).toHaveCount(1);
  await source.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(source).toHaveAttribute("open", "");
  await expect(dialog.locator(".km-source[open] a").first()).toBeVisible();
  await expect(page.locator(".km-stage")).toHaveAttribute(
    "data-camera-state",
    "frozen",
  );
});

test("a map first opened with reduced motion resumes a partially retracting card without a flash", async ({
  page,
}) => {
  await openMap(page, "reduce");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".knowledge-map")).toHaveAttribute(
    "data-reduced",
    "false",
  );
  const configuration = page.locator("#km-card-h-configuration");
  await page
    .getByRole("button", { name: "初中版", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.waitForTimeout(35);
  const reversal = await page.evaluate(async () => {
    const node = document.querySelector<HTMLElement>(
      "#km-card-h-configuration",
    )!;
    const before = Number(getComputedStyle(node).opacity);
    document
      .querySelector<HTMLButtonElement>(
        '.learning-switch button[aria-label="高中版"]',
      )!
      .click();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const effect = node
      .getAnimations()
      .find((animation) => animation.id === "knowledge-arrival")?.effect as
      KeyframeEffect | undefined;
    const firstFrame = effect?.getKeyframes()[0];
    return {
      before,
      after: Number(getComputedStyle(node).opacity),
      startingOpacity: Number(firstFrame?.opacity),
    };
  });
  expect(reversal.before).toBeGreaterThan(0.05);
  expect(reversal.before).toBeLessThan(0.95);
  expect(reversal.startingOpacity).toBeGreaterThan(0.05);
  expect(reversal.after).toBeGreaterThan(0.05);
  await expect(configuration).toHaveAttribute("data-arrival", "settled");
  expect(
    await configuration.evaluate((node) =>
      Number(getComputedStyle(node).opacity),
    ),
  ).toBe(1);
  await expect(configuration).toHaveAttribute("aria-hidden", "false");
});

test("touch keeps the compact reading flow and card dialog usable without plucking a line", async ({
  browser,
  baseURL,
}) => {
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
  const page = await context.newPage();
  try {
    await page.goto(url);
    await expect(page.locator(".knowledge-map")).toHaveAttribute(
      "data-revealed",
      "2",
    );
    const opener = page
      .locator('.km-card[data-active="true"] .km-card-open')
      .first();
    await opener.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "收起知识卡", exact: true }).tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator('.km-connection[data-wave="true"]')).toHaveCount(
      0,
    );
    const camera = page.locator(".km-camera");
    const pose = await camera.evaluate(
      (node) => getComputedStyle(node).transform,
    );
    await page.waitForTimeout(180);
    expect(
      await camera.evaluate((node) => getComputedStyle(node).transform),
    ).toBe(pose);
    await expect(page.locator(".km-stage")).not.toHaveAttribute(
      "data-camera-state",
      /following|returning/,
    );
    await opener.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

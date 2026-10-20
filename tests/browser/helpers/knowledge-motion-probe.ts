import type { Page } from "@playwright/test";

export type EntranceFrame = {
  time: number;
  coreVisible: boolean;
  branchesVisible: number;
  cards: { id: string; arrival: string | undefined; opacity: number; scale: number; inert: boolean; delay: number | null; duration: number | null }[];
  lines: { id: string; tier: string | undefined; progress: number; offset: number }[];
};

export async function installEntranceProbe(page: Page) {
  // tsx preserves function names with this helper when serializing nested probe callbacks.
  await page.addInitScript("window.__name = value => value");
  await page.addInitScript(() => {
    const view = window as Window & { __kmEntranceFrames?: EntranceFrame[]; __kmEntranceDone?: boolean };
    const diagnostics = window as Window & { __kmLongTasks?: { startTime: number; duration: number; name: string }[] };
    diagnostics.__kmLongTasks = [];
    const longTasks = new PerformanceObserver(list => {
      diagnostics.__kmLongTasks!.push(...list.getEntries().map(entry => ({ startTime: entry.startTime, duration: entry.duration, name: entry.name })));
    });
    longTasks.observe({ entryTypes: ["longtask"] });
    const observer = new MutationObserver(() => {
      const map = document.querySelector(".knowledge-map[data-revealed]");
      if (!map) return;
      observer.disconnect();
      const start = performance.now();
      view.__kmEntranceFrames = [];
      view.__kmEntranceDone = false;
      const sample = () => {
        const time = performance.now() - start;
        const core = map.querySelector<HTMLElement>(".km-core");
        view.__kmEntranceFrames!.push({
          time,
          coreVisible: !!core && Number(getComputedStyle(core).opacity) > 0.9,
          branchesVisible: [...map.querySelectorAll<HTMLElement>(".km-branch")].filter(node => Number(getComputedStyle(node).opacity) > 0.9).length,
          cards: [...map.querySelectorAll<HTMLElement>('.km-card[data-active="true"]')].map(node => {
            const style = getComputedStyle(node);
            const transform = new DOMMatrixReadOnly(style.transform);
            const timing = node.getAnimations().find(animation => animation.id === "knowledge-arrival")?.effect?.getTiming();
            return { id: node.id.replace("km-card-", ""), arrival: node.dataset.arrival, opacity: Number(style.opacity), scale: Math.hypot(transform.a, transform.b), inert: node.inert, delay: timing ? (timing.delay ?? 0) : null, duration: timing ? Number(timing.duration ?? 0) : null };
          }),
          lines: [...map.querySelectorAll<SVGPathElement>('.km-connection[data-active="true"]')].map(node => ({ id: node.dataset.connectionId!, tier: node.dataset.tier, progress: Number(node.dataset.revealProgress ?? 0), offset: Number.parseFloat(getComputedStyle(node).strokeDashoffset) })),
        });
        // Read after all RAF writers for this frame, rather than before the line runtime's RAF.
        if (time < 1650) requestAnimationFrame(() => setTimeout(sample, 0));
        else view.__kmEntranceDone = true;
      };
      requestAnimationFrame(() => setTimeout(sample, 0));
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

export async function readEntranceProbe(page: Page): Promise<EntranceFrame[]> {
  await page.waitForFunction(() => (window as Window & { __kmEntranceDone?: boolean }).__kmEntranceDone);
  return page.evaluate(() => (window as Window & { __kmEntranceFrames?: EntranceFrame[] }).__kmEntranceFrames!);
}

export async function readLongTasks(page: Page) {
  return page.evaluate(() => (window as Window & { __kmLongTasks?: { startTime: number; duration: number; name: string }[] }).__kmLongTasks ?? []);
}

export type LinePoint = {
  id: string;
  x: number;
  y: number;
  normalX: number;
  normalY: number;
};

export type WaveFrame = {
  time: number;
  wave: boolean;
  anyWave: boolean;
  maxPositive: number;
  maxNegative: number;
  endpointDrift: number;
  stroke: string;
  opacity: number;
  cameraState: string | undefined;
};

/** Find a genuinely exposed leaf segment; no synthetic pointer events are used. */
export async function exposedLinePoint(page: Page): Promise<LinePoint> {
  return page.evaluate(() => {
    const paths = [...document.querySelectorAll<SVGPathElement>(
      '.km-connection[data-tier="leaf"][data-active="true"]',
    )];
    for (const path of paths) {
      const length = path.getTotalLength();
      const matrix = path.getScreenCTM();
      if (!matrix) continue;
      for (const fraction of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        const p = path.getPointAtLength(length * fraction);
        const before = path.getPointAtLength(length * (fraction - 0.015));
        const after = path.getPointAtLength(length * (fraction + 0.015));
        const screen = new DOMPoint(p.x, p.y).matrixTransform(matrix);
        const a = new DOMPoint(before.x, before.y).matrixTransform(matrix);
        const b = new DOMPoint(after.x, after.y).matrixTransform(matrix);
        const size = Math.hypot(b.x - a.x, b.y - a.y);
        const normal = { x: -(b.y - a.y) / size, y: (b.x - a.x) / size };
        if (screen.x < 50 || screen.x > innerWidth - 50 || screen.y < 90 || screen.y > innerHeight - 50) continue;
        const exposed = [-18, 0, 18].every((offset) => {
          const hit = document.elementFromPoint(screen.x + normal.x * offset, screen.y + normal.y * offset);
          return hit?.closest(".km-stage") && !hit.closest("button, a, summary, .km-card, .km-branch, .km-core");
        });
        if (exposed) return {
          id: path.dataset.connectionId!, x: screen.x, y: screen.y,
          normalX: normal.x, normalY: normal.y,
        };
      }
    }
    throw new Error("No unobstructed leaf segment is visible in the viewport");
  });
}

/** Samples the actual rendered curve in its map coordinates, then reports screen px. */
export async function startWaveProbe(page: Page, id: string, duration = 650, onNextMovement = true) {
  await page.evaluate(({ id, duration, onNextMovement }) => {
    type Frame = WaveFrame;
    const view = window as Window & { __kmWaveFrames?: Frame[]; __kmWaveDone?: boolean };
    const path = [...document.querySelectorAll<SVGPathElement>(".km-connection")].find(node => node.dataset.connectionId === id)!;
    const baseline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    baseline.setAttribute("d", path.getAttribute("d")!);
    const baseLength = baseline.getTotalLength();
    const points = Array.from({ length: 97 }, (_, i) => {
      const fraction = i / 96;
      const p = baseline.getPointAtLength(baseLength * fraction);
      const a = baseline.getPointAtLength(baseLength * Math.max(0, fraction - 0.002));
      const b = baseline.getPointAtLength(baseLength * Math.min(1, fraction + 0.002));
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: p.x, y: p.y, normalX: -(b.y - a.y) / length, normalY: (b.x - a.x) / length };
    });
    view.__kmWaveFrames = [];
    view.__kmWaveDone = false;
    const run = () => {
      const start = performance.now();
      const sample = () => {
        const time = performance.now() - start;
        const length = path.getTotalLength();
        const matrix = path.getScreenCTM()!;
        const scale = Math.hypot(matrix.a, matrix.b);
        let maxPositive = 0, maxNegative = 0, endpointDrift = 0;
        points.forEach((point, i) => {
          const actual = path.getPointAtLength(length * i / 96);
          const dx = actual.x - point.x, dy = actual.y - point.y;
          const signed = (dx * point.normalX + dy * point.normalY) * scale;
          maxPositive = Math.max(maxPositive, signed);
          maxNegative = Math.min(maxNegative, signed);
          if (i === 0 || i === 96) endpointDrift = Math.max(endpointDrift, Math.hypot(dx, dy) * scale);
        });
        const style = getComputedStyle(path);
        view.__kmWaveFrames!.push({
          time, wave: path.dataset.wave === "true",
          anyWave: !!document.querySelector('.km-connection[data-wave="true"]'),
          maxPositive, maxNegative, endpointDrift,
          stroke: style.stroke, opacity: Number(style.opacity),
          cameraState: document.querySelector<HTMLElement>(".km-stage")?.dataset.cameraState,
        });
        if (time < duration) requestAnimationFrame(sample);
        else view.__kmWaveDone = true;
      };
      requestAnimationFrame(sample);
    };
    if (onNextMovement) document.querySelector(".km-stage")!.addEventListener("pointermove", run, { once: true });
    else run();
  }, { id, duration, onNextMovement });
}

export async function readWaveProbe(page: Page): Promise<WaveFrame[]> {
  await page.waitForFunction(() => (window as Window & { __kmWaveDone?: boolean }).__kmWaveDone);
  return page.evaluate(() => (window as Window & { __kmWaveFrames?: WaveFrame[] }).__kmWaveFrames!);
}

export async function crossLine(page: Page, point: LinePoint) {
  await page.mouse.move(point.x - point.normalX * 18, point.y - point.normalY * 18);
  // Recalculate after camera following has settled so the crossing is in screen coordinates.
  await page.waitForTimeout(650);
  const current = await exposedLinePoint(page);
  await page.mouse.move(current.x - current.normalX * 18, current.y - current.normalY * 18);
  await startWaveProbe(page, current.id);
  await page.mouse.move(current.x + current.normalX * 18, current.y + current.normalY * 18);
  return { point: current, frames: await readWaveProbe(page) };
}

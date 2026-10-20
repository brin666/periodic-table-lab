import { useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";

export const HYDROGEN_ENTRANCE_DURATION = 7200;
const CONTACT = 1480;
const CHROME_START = 6250;
const CHROME_SELECTOR = [
  ".site-header",
  ".table-page .board-toolbar",
  ".table-page .mobile-scroll-hint",
  ".table-page .category-legend",
  ".table-page .axis-caption",
  ".table-page .group-number",
  ".table-page .period-number",
  ".table-page .series-label",
  ".table-page .series-placeholder",
  ".table-page .home-workbench",
].join(",");

/** Owns the lifetime, including interruption. The first pointer only skips. */
export function useHydrogenEntrance(enabled: boolean) {
  const [playing, setPlaying] = useState(enabled);
  useEffect(() => {
    if (!enabled) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const finish = () => setPlaying(false);
    const timer = window.setTimeout(finish, HYDROGEN_ENTRANCE_DURATION);
    const input = (event: Event) => {
      // Assistive focus can already be on a key before the scene is revealed.
      // Consume this activation just as we consume the first pointer click.
      if (
        event instanceof KeyboardEvent &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (event.type === "pointerdown") {
        const clearGuard = () => {
          window.removeEventListener("click", swallow, true);
          window.removeEventListener("pointercancel", clearGuard, true);
          window.removeEventListener("pointerdown", clearGuard, true);
          window.clearTimeout(expiry);
        };
        const swallow = (click: Event) => {
          clearGuard();
          click.preventDefault();
          click.stopImmediatePropagation();
        };
        const expiry = window.setTimeout(clearGuard, 700);
        window.addEventListener("click", swallow, {
          once: true,
          capture: true,
        });
        window.addEventListener("pointercancel", clearGuard, {
          once: true,
          capture: true,
        });
        window.addEventListener("pointerdown", clearGuard, {
          once: true,
          capture: true,
        });
      }
      flushSync(finish);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    for (const event of events)
      window.addEventListener(event, input, {
        capture: true,
        passive: event !== "keydown",
      });
    const visibility = () => {
      if (document.hidden) finish();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", finish);
    return () => {
      clearTimeout(timer);
      for (const event of events)
        window.removeEventListener(event, input, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", finish);
    };
  }, [enabled, playing]);
  return enabled && playing && typeof Element.prototype.animate === "function";
}

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const frame = (time: number, values: Keyframe): Keyframe => ({
  ...values,
  offset: time / HYDROGEN_ENTRANCE_DURATION,
});
/** Preserve each property curve exactly, without sending dozens of identical
 * opacity/rest-pose samples to the browser's keyframe normalizer. */
function compactFrames(frames: Keyframe[]): Keyframe[] {
  return frames.flatMap((current, index) => {
    const result: Keyframe = { offset: current.offset };
    for (const property of ["opacity", "transform"] as const) {
      const value = current[property];
      if (value === undefined) continue;
      if (
        index === 0 || index === frames.length - 1 ||
        value !== frames[index - 1][property] ||
        value !== frames[index + 1][property]
      ) result[property] = value;
    }
    return Object.keys(result).length > 1 ? [result] : [];
  });
}
type Key = {
  id: string;
  x: number;
  y: number;
  arrival: HTMLElement;
  shadow: HTMLElement;
  light: HTMLElement;
};

/** A travelling damped wave, sampled once into native animations.
 * Radius and time determine height AND its surface normal. Adjacent keys can
 * therefore occupy a crest and a trough in the same frame; no independent hops.
 * This is a UI metaphor, not a model of hydrogen producing other elements.
 */
function waveHeight(radius: number, time: number, maxRadius: number) {
  const age = time - CONTACT - (radius / maxRadius) * 2800;
  if (age <= 0 || age >= 2200) return 0;
  const amplitude = 34 * (1 - (0.4 * radius) / maxRadius);
  return (
    amplitude *
    Math.sin((age / 1100) * Math.PI * 2) *
    Math.exp(-age / 960) *
    (1 - smooth((age - 1500) / 700))
  );
}

function hydrogenPress(time: number) {
  if (time < 1350 || time > 1780) return 0;
  if (time < CONTACT) return -8 * smooth((time - 1350) / (CONTACT - 1350));
  if (time < 1610) return mix(-8, 3, smooth((time - CONTACT) / 130));
  return 3 * (1 - smooth((time - 1610) / 170));
}

export function HydrogenEntrance() {
  useLayoutEffect(() => {
    const grid = document.querySelector<HTMLElement>(
      ".table-page .element-grid",
    );
    if (!grid) return;
    const box = grid.getBoundingClientRect();
    const keys: Key[] = [
      ...grid.querySelectorAll<HTMLElement>(".element-key"),
    ].map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        id: button.dataset.element!,
        x: rect.x + rect.width / 2 - box.x,
        y: rect.y + rect.height / 2 - box.y,
        arrival: button.querySelector<HTMLElement>(".key-arrival")!,
        shadow: button.querySelector<HTMLElement>(".entrance-key-shadow")!,
        light: button.querySelector<HTMLElement>(".entrance-key-light")!,
      };
    });
    const hydrogen = keys.find((key) => key.id === "h");
    if (!hydrogen) return;
    const maxRadius = Math.max(
      ...keys.map((key) => Math.hypot(key.x - hydrogen.x, key.y - hydrogen.y)),
    );
    const width = window.innerWidth,
      height = window.innerHeight;
    const overviewScale = Math.min(
      1,
      (width - 36) / box.width,
      (height - 100) / box.height,
    );
    const overview = {
      scale: overviewScale,
      x: (width - box.width * overviewScale) / 2 - box.x,
      y: (height - box.height * overviewScale) / 2 - box.y,
    };
    const needsOverview = overviewScale < 0.95;
    const initialScale = width < 640 ? 2.5 : 2.8;
    const initial = {
      scale: initialScale,
      x: width / 2 - box.x - hydrogen.x * initialScale,
      y: height * 0.46 - box.y - hydrogen.y * initialScale,
    };
    const final = { scale: 1, x: 0, y: 0 };
    const times = [
      ...new Set([
        ...Array.from({ length: 226 }, (_, i) => i * 32),
        250,
        950,
        1350,
        CONTACT,
        1610,
        1780,
        5200,
        5500,
        6250,
        6600,
        7050,
        7200,
      ]),
    ]
      .filter((t) => t <= HYDROGEN_ENTRANCE_DURATION)
      .sort((a, b) => a - b);
    const animations: Animation[] = [];
    const startTime = document.timeline.currentTime;
    performance.mark("hydrogen-entrance-start");
    let minimumWaveLead = Infinity;
    const run = (node: globalThis.Element, frames: Keyframe[], id: string) => {
      const animation = node.animate(frames, {
        duration: HYDROGEN_ENTRANCE_DURATION,
        fill: "both",
        easing: "linear",
      });
      animation.id = `hydrogen-${id}`;
      animation.startTime = startTime;
      animations.push(animation);
    };
    const cameraTransform = (view: typeof initial) =>
      `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`;
    const sceneEase = getComputedStyle(document.documentElement)
      .getPropertyValue("--scene-ease")
      .trim();
    const target = needsOverview ? overview : final;
    // Open the field early enough to SEE the travelling crests. The phone
    // briefly frames the full table, then comes home to its usable key size.
    const cameraFrames = [
      frame(0, { transform: cameraTransform(initial) }),
      frame(1530, { transform: cameraTransform(initial), easing: sceneEase }),
      frame(5200, { transform: cameraTransform(target) }),
      frame(5500, {
        transform: cameraTransform(target),
        easing: "cubic-bezier(0.77, 0, 0.175, 1)",
      }),
      frame(6600, { transform: cameraTransform(final) }),
      frame(HYDROGEN_ENTRANCE_DURATION, { transform: cameraTransform(final) }),
    ];
    run(grid, cameraFrames, "camera");
    const prepareKey = (key: Key) => {
      const dx = key.x - hydrogen.x,
        dy = key.y - hydrogen.y;
      const radius = Math.hypot(dx, dy);
      const arrival = CONTACT + (radius / maxRadius) * 2800;
      const keyFrames: Keyframe[] = [],
        shadowFrames: Keyframe[] = [],
        lightFrames: Keyframe[] = [];
      const isHydrogen = key.id === "h";
      const activeStart = isHydrogen ? 250 : arrival;
      const activeEnd = isHydrogen ? 1780 : arrival + 2200;
      // Native interpolation holds the rest pose. Only sample each key's
      // moving interval and the final shadow fade, avoiding 118 full traces.
      const keyTimes = [
        ...new Set([
          0,
          activeStart,
          activeEnd,
          6400,
          7050,
          HYDROGEN_ENTRANCE_DURATION,
          ...times.filter(
            (t) =>
              (t >= activeStart && t <= activeEnd) || (t >= 6400 && t <= 7050),
          ),
        ]),
      ].sort((a, b) => a - b);
      for (const time of keyTimes) {
        const opacity = isHydrogen
          ? smooth((time - 250) / 700)
          : smooth((time - arrival) / 150);
        const z = isHydrogen
          ? hydrogenPress(time)
          : waveHeight(radius, time, maxRadius);
        const slope = isHydrogen
          ? 0
          : (waveHeight(radius + 3, time, maxRadius) -
              waveHeight(Math.max(0, radius - 3), time, maxRadius)) /
            6;
        const angle = clamp((Math.atan(slope) * 180) / Math.PI, -9, 9);
        const rx = (-angle * dy) / Math.max(1, radius),
          ry = (angle * dx) / Math.max(1, radius);
        // A consistent near-top orthographic projection. Z changes apparent
        // height; the normal controls tilt and edge reflection together.
        keyFrames.push(
          frame(time, {
            opacity,
            transform: `translate3d(0, ${(-z * 0.52).toFixed(3)}px, ${z.toFixed(3)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`,
          }),
        );
        const finish = 1 - smooth((time - 6400) / 650);
        shadowFrames.push(
          frame(time, {
            opacity: opacity * (0.65 - Math.max(0, z) * 0.01) * finish,
            transform: `translate3d(${z * 0.12}px, ${z * 0.27}px, 0) scale(${1 + Math.max(0, z) * 0.015})`,
          }),
        );
        lightFrames.push(
          frame(time, {
            opacity:
              opacity *
              clamp(0.018 + z * 0.0025 - slope * 0.1, 0, 0.13) *
              finish,
          }),
        );
      }
      run(key.arrival, compactFrames(keyFrames), `key-${key.id}`);
      run(key.shadow, compactFrames(shadowFrames), `shadow-${key.id}`);
      run(key.light, compactFrames(lightFrames), `light-${key.id}`);
      if (!isHydrogen)
        minimumWaveLead = Math.min(minimumWaveLead,
          arrival - (performance.now() - Number(startTime)));
    };
    // H and the camera must exist before the first paint. Prepare the rest in
    // short tasks, in wave order, instead of blocking that paint on 354 effects.
    // Every effect seeks the SAME timeline even when installed a little later.
    prepareKey(hydrogen);
    const pendingKeys = keys
      .filter((key) => key !== hydrogen)
      .sort((a, b) =>
        Math.hypot(a.x - hydrogen.x, a.y - hydrogen.y) -
        Math.hypot(b.x - hydrogen.x, b.y - hydrogen.y),
      );
    let nextKey = 0;
    let preparationTimer: number;
    let cancelled = false;
    const prepareBatch = () => {
      if (cancelled) return;
      const deadline = performance.now() + 12;
      do {
        prepareKey(pendingKeys[nextKey++]);
      } while (nextKey < pendingKeys.length && performance.now() < deadline);
      if (nextKey < pendingKeys.length)
        preparationTimer = window.setTimeout(prepareBatch, 0);
      else {
        grid.dataset.entrancePrepared = "true";
        performance.mark("hydrogen-entrance-prepared", {
          detail: { minimumWaveLead },
        });
      }
    };
    preparationTimer = window.setTimeout(prepareBatch, 0);
    const chrome = [...document.querySelectorAll<HTMLElement>(CHROME_SELECTOR)];
    const previousInert = chrome.map((node) => node.inert);
    chrome.forEach((node, index) => {
      node.inert = true;
      run(
        node,
        [
          frame(0, { opacity: 0 }),
          frame(CHROME_START, { opacity: 0 }),
          frame(7050, { opacity: 1 }),
          frame(HYDROGEN_ENTRANCE_DURATION, { opacity: 1 }),
        ],
        `chrome-${index}`,
      );
    });
    return () => {
      cancelled = true;
      window.clearTimeout(preparationTimer);
      delete grid.dataset.entrancePrepared;
      for (const animation of animations) animation.cancel();
      chrome.forEach((node, index) => { node.inert = previousInert[index]; });
    };
  }, []);
  return <span className="hydrogen-entrance" aria-hidden="true" hidden />;
}

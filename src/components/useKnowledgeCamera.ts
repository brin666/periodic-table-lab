import {
  useLayoutEffect,
  useRef,
  type PointerEvent,
  type RefObject,
} from "react";
import type { MapPoint } from "../knowledge-layout";

type Pose = { x: number; y: number; scale: number };
type CameraMode =
  "overview" | "following" | "returning" | "keyboard" | "frozen";
const damp = (value: number, target: number, dt: number, tau: number) =>
  value + (target - value) * (1 - Math.exp(-dt / tau));
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** One rendered pose and one frame clock; no CSS interpolation or React updates per frame. */
export function useKnowledgeCamera({
  stage,
  fit,
  mobile,
  reduced,
  blocked,
  bounds,
  onOverview,
}: {
  stage: RefObject<HTMLDivElement | null>;
  fit: number;
  mobile: boolean;
  reduced: boolean;
  blocked: boolean;
  bounds: { width: number; height: number };
  onOverview: () => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const pose = useRef<Pose>({ x: 0, y: 0, scale: fit });
  const mode = useRef<CameraMode>("overview");
  const anchor = useRef<MapPoint>({ x: 0, y: 0 });
  const pointer = useRef<MapPoint>({ x: 0, y: 0 });
  const residual = useRef<MapPoint>({ x: 0, y: 0 });
  const keyboardGoal = useRef<Pose>({ x: 0, y: 0, scale: fit });
  const lastInput = useRef<MapPoint | null>(null);
  const frame = useRef<number | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stamp = useRef(0);
  const latest = useRef({ fit, mobile, reduced, blocked, bounds, onOverview });
  latest.current = { fit, mobile, reduced, blocked, bounds, onOverview };

  const write = () => {
    if (node.current) {
      const p = pose.current;
      node.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`;
      node.current.dataset.cameraState = mode.current;
    }
    if (stage.current) stage.current.dataset.cameraState = mode.current;
  };
  const clearIdle = () => {
    if (idle.current !== null) clearTimeout(idle.current);
    idle.current = null;
  };
  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    stamp.current = 0;
  };
  const tick = (time: number) => {
    frame.current = null;
    const config = latest.current;
    const dt = stamp.current
      ? Math.min(48, Math.max(1, time - stamp.current))
      : 16.67;
    stamp.current = time;
    const previous = pose.current;
    let next: Pose;
    if (mode.current === "keyboard") {
      const goal = keyboardGoal.current;
      next = {
        x: damp(previous.x, goal.x, dt, 135),
        y: damp(previous.y, goal.y, dt, 135),
        scale: damp(previous.scale, goal.scale, dt, 170),
      };
      if (
        Math.hypot(next.x - goal.x, next.y - goal.y) < 0.04 &&
        Math.abs(next.scale - goal.scale) < 0.00004
      )
        next = goal;
    } else if (mode.current === "following" || mode.current === "returning") {
      const returning = mode.current === "returning";
      const targetScale = returning ? config.fit : Math.max(config.fit, 1.02);
      const scale = damp(
        previous.scale,
        targetScale,
        dt,
        returning ? 220 : 170,
      );
      if (!returning)
        anchor.current = {
          x: damp(anchor.current.x, pointer.current.x, dt, 80),
          y: damp(anchor.current.y, pointer.current.y, dt, 80),
        };
      residual.current = {
        x: damp(residual.current.x, 0, dt, returning ? 220 : 180),
        y: damp(residual.current.y, 0, dt, returning ? 220 : 180),
      };
      const factor = 1 - scale / config.fit;
      next = {
        x: anchor.current.x * factor + residual.current.x,
        y: anchor.current.y * factor + residual.current.y,
        scale,
      };
      if (
        returning &&
        Math.hypot(next.x, next.y) < 0.06 &&
        Math.abs(scale - config.fit) < 0.00004
      ) {
        next = { x: 0, y: 0, scale: config.fit };
        residual.current = { x: 0, y: 0 };
        mode.current = "overview";
      }
    } else {
      write();
      stop();
      return;
    }
    pose.current = next;
    write();
    const settled =
      mode.current === "keyboard"
        ? next === keyboardGoal.current
        : mode.current === "following" &&
          Math.abs(next.scale - Math.max(config.fit, 1.02)) < 0.00004 &&
          distance(anchor.current, pointer.current) < 0.02 &&
          Math.hypot(residual.current.x, residual.current.y) < 0.02;
    if (!settled && mode.current !== "overview")
      frame.current = requestAnimationFrame(tick);
    else stamp.current = 0;
  };
  const start = () => {
    if (frame.current === null) {
      stamp.current = 0;
      frame.current = requestAnimationFrame(tick);
    }
  };
  const freeze = () => {
    clearIdle();
    stop();
    mode.current = "frozen";
    write();
  };
  const overview = (immediate = false) => {
    clearIdle();
    lastInput.current = null;
    latest.current.onOverview();
    if (immediate || latest.current.mobile || latest.current.reduced) {
      stop();
      pose.current = { x: 0, y: 0, scale: latest.current.fit };
      anchor.current = { x: 0, y: 0 };
      residual.current = { x: 0, y: 0 };
      mode.current = "overview";
      write();
      return;
    }
    // Rebase from the visible pose, including when fit changed during a layout transition.
    const factor = 1 - pose.current.scale / latest.current.fit;
    residual.current = {
      x: pose.current.x - anchor.current.x * factor,
      y: pose.current.y - anchor.current.y * factor,
    };
    mode.current = "returning";
    write();
    start();
  };
  const resumeIdle = () => {
    clearIdle();
    if (
      !latest.current.mobile &&
      !latest.current.reduced &&
      !latest.current.blocked &&
      mode.current !== "keyboard" &&
      !stage.current?.querySelector(".km-source[open]")
    )
      idle.current = setTimeout(() => overview(), 2000);
  };
  useLayoutEffect(() => {
    overview(mobile || reduced);
  }, [fit, mobile, reduced]);
  useLayoutEffect(() => {
    if (
      blocked &&
      (mode.current === "following" || mode.current === "returning")
    )
      freeze();
    else if (!blocked && mode.current === "frozen") resumeIdle();
  }, [blocked]);
  useLayoutEffect(() => {
    const surface = stage.current;
    const toggleSource = (event: Event) => {
      if (!(event.target instanceof HTMLDetailsElement)) return;
      if (surface?.querySelector(".km-source[open]")) freeze();
      else resumeIdle();
    };
    surface?.addEventListener("toggle", toggleSource, true);
    surface?.addEventListener("pointerup", resumeIdle);
    surface?.addEventListener("pointercancel", resumeIdle);
    return () => {
      surface?.removeEventListener("toggle", toggleSource, true);
      surface?.removeEventListener("pointerup", resumeIdle);
      surface?.removeEventListener("pointercancel", resumeIdle);
      clearIdle();
      stop();
    };
  }, []);

  return {
    node,
    overview,
    freeze,
    resumeIdle,
    move: (event: PointerEvent<HTMLDivElement>) => {
      const config = latest.current;
      if (
        event.pointerType !== "mouse" ||
        config.mobile ||
        config.reduced ||
        config.blocked ||
        event.buttons !== 0 ||
        stage.current?.querySelector(".km-source[open]")
      )
        return false;
      const rect = event.currentTarget.getBoundingClientRect();
      const raw = {
        x: event.clientX - rect.x - rect.width / 2,
        y: event.clientY - rect.y - rect.height / 2,
      };
      if (lastInput.current && distance(raw, lastInput.current) < 3)
        return false;
      lastInput.current = raw;
      // Clamp the navigation point to the map's useful overview extent, rather than
      // allowing the empty margins around a fitted map to send the camera off-map.
      const zoom = Math.max(config.fit, 1.02);
      const gain = Math.max(0.001, zoom / config.fit - 1);
      const maxX =
        Math.max(0, (config.bounds.width * zoom - rect.width) / 2 + 24) / gain;
      const maxY =
        Math.max(0, (config.bounds.height * zoom - rect.height) / 2 + 24) /
        gain;
      const target = {
        x: clamp(raw.x, -maxX, maxX),
        y: clamp(raw.y, -maxY, maxY),
      };
      if (mode.current === "overview") {
        anchor.current = target;
        residual.current = { x: 0, y: 0 };
      } else if (mode.current === "keyboard" || mode.current === "frozen") {
        const factor = 1 - pose.current.scale / config.fit;
        residual.current = {
          x: pose.current.x - anchor.current.x * factor,
          y: pose.current.y - anchor.current.y * factor,
        };
      }
      pointer.current = target;
      mode.current = "following";
      clearIdle();
      idle.current = setTimeout(() => overview(), 2000);
      write();
      start();
      return true;
    },
    focus: (point: MapPoint) => {
      if (
        latest.current.mobile ||
        latest.current.blocked ||
        stage.current?.querySelector(".km-source[open]")
      )
        return;
      clearIdle();
      stop();
      const scale = Math.max(latest.current.fit, 1.02);
      keyboardGoal.current = {
        x: -point.x * scale,
        y: -point.y * scale,
        scale,
      };
      mode.current = "keyboard";
      if (latest.current.reduced) {
        pose.current = keyboardGoal.current;
        write();
      } else {
        write();
        start();
      }
    },
  };
}

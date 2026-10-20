import { useLayoutEffect, useRef, type RefObject } from "react";
import type { MapPoint } from "../knowledge-layout";
import {
  CONNECTION_LAYOUT_MS,
  CONNECTION_REVEAL_MS,
  CONNECTION_WAVE_MS,
  connectionCubicPath,
  connectionEase,
  connectionGeometry,
  connectionPath,
  deformConnection,
  interpolateConnection,
  sampleConnection,
  sweepConnection,
  type ConnectionWave,
} from "../knowledge-connection-motion";
import "../knowledge-connections.css";

export type KnowledgeConnectionSpec = {
  id: string;
  from: MapPoint;
  to: MapPoint;
  active: boolean;
  kind: "trunk" | "leaf";
  delay: number;
};

type Props = {
  connections: KnowledgeConnectionSpec[];
  stage: RefObject<HTMLDivElement | null>;
  reduced: boolean;
  compact: boolean;
  suspended: boolean;
};

type ConnectionMotion = {
  spec: KnowledgeConnectionSpec;
  path: SVGPathElement;
  points: MapPoint[];
  geometry: ReturnType<typeof connectionGeometry>;
  geometryDirty: boolean;
  lastD: string;
  hadWaves: boolean;
  layoutFrom: MapPoint[];
  layoutTo: MapPoint[];
  layoutStarted: number;
  layoutProgress: number;
  reveal: number;
  revealFrom: number;
  revealTo: number;
  revealStarted: number;
  waves: ConnectionWave[];
  lastWave: number;
};

const samePoint = (a: MapPoint, b: MapPoint) => a.x === b.x && a.y === b.y;
const progress = (now: number, start: number, duration: number) =>
  Math.max(0, Math.min(1, (now - start) / duration));

function createRuntime(svg: SVGSVGElement, stage: HTMLDivElement) {
  const motions = new Map<string, ConnectionMotion>();
  let config: Props;
  let frame: number | null = null;
  let wake: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let pressed = false;
  let previous: (MapPoint & { time: number }) | null = null;

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    if (wake !== null) clearTimeout(wake);
    frame = null;
    wake = null;
  };
  const scale = () => {
    const matrix = svg.getScreenCTM();
    return matrix ? Math.hypot(matrix.a, matrix.b) : 1;
  };
  const advance = (motion: ConnectionMotion, now: number) => {
    const layoutProgress = progress(
      now,
      motion.layoutStarted,
      CONNECTION_LAYOUT_MS,
    );
    if (layoutProgress !== motion.layoutProgress) {
      motion.points = interpolateConnection(
        motion.layoutFrom,
        motion.layoutTo,
        connectionEase(layoutProgress),
      );
      motion.geometry = connectionGeometry(motion.points);
      motion.geometryDirty = true;
      motion.layoutProgress = layoutProgress;
    }
    if (motion.reveal !== motion.revealTo)
      motion.reveal =
        motion.revealFrom +
        (motion.revealTo - motion.revealFrom) *
          connectionEase(
            progress(now, motion.revealStarted, CONNECTION_REVEAL_MS),
          );
    if (motion.waves.length)
      motion.waves = motion.waves.filter(
        (wave) => now - wave.started < CONNECTION_WAVE_MS,
      );
  };
  const draw = (now: number) => {
    if (disposed) return;
    frame = null;
    wake = null;
    let moving = false,
      nextWake = Infinity;
    const zoom = scale();
    for (const motion of motions.values()) {
      advance(motion, now);
      // Reveal changes only the dash offset. Reuse every resting curve while
      // another connection moves, including its precomputed arc lengths.
      const hasWaves = motion.waves.length > 0;
      if (motion.geometryDirty || hasWaves || motion.hadWaves) {
        const d = hasWaves
          ? connectionPath(
              deformConnection(motion.geometry, motion.waves, now, zoom),
            )
          : connectionCubicPath(motion.points);
        if (d !== motion.lastD) {
          motion.path.setAttribute("d", d);
          motion.lastD = d;
        }
        motion.geometryDirty = false;
      }
      // The first frame after a wave ends restores the exact resting curve.
      motion.hadWaves = hasWaves;
      motion.path.style.strokeDashoffset = String(1 - motion.reveal);
      motion.path.style.opacity = motion.reveal <= 0 ? "0" : "";
      motion.path.dataset.revealProgress = motion.reveal.toFixed(4);
      motion.path.dataset.wave = String(motion.waves.length > 0);
      motion.path.dataset.waveProgress = motion.waves.length
        ? Math.max(
            ...motion.waves.map((wave) =>
              progress(now, wave.started, CONNECTION_WAVE_MS),
            ),
          ).toFixed(4)
        : "0";
      const layoutMoving =
        now < motion.layoutStarted + CONNECTION_LAYOUT_MS && motion.reveal > 0;
      const revealPending =
        motion.revealFrom !== motion.revealTo && now < motion.revealStarted;
      const revealMoving =
        motion.revealFrom !== motion.revealTo &&
        now >= motion.revealStarted &&
        now < motion.revealStarted + CONNECTION_REVEAL_MS;
      moving ||= layoutMoving || revealMoving || motion.waves.length > 0;
      if (revealPending) nextWake = Math.min(nextWake, motion.revealStarted);
    }
    if (moving) frame = requestAnimationFrame(draw);
    else if (Number.isFinite(nextWake))
      wake = setTimeout(
        () => {
          wake = null;
          frame = requestAnimationFrame(draw);
        },
        Math.max(0, nextWake - now),
      );
    svg.dataset.animating = String(moving);
  };
  const refresh = (now = performance.now()) => {
    stop();
    draw(now);
  };
  const blocked = () =>
    config.reduced ||
    config.compact ||
    config.suspended ||
    pressed ||
    !!stage.querySelector(".km-source[open], dialog[open], [role='dialog']");
  const move = (event: PointerEvent) => {
    const current = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
    const before = previous;
    previous = current;
    if (event.pointerType !== "mouse" || event.buttons !== 0 || blocked()) {
      previous = null;
      return;
    }
    if (
      (event.target as Element | null)?.closest(
        ".km-card, .km-branch, .km-core, .km-source",
      )
    )
      return;
    if (
      !before ||
      current.time - before.time > 160 ||
      Math.hypot(current.x - before.x, current.y - before.y) < 0.5
    )
      return;
    // Both ends of the actual pointer sweep use this event's transform. Camera-only
    // motion never becomes a swept segment, and no pointer hit testing runs in RAF.
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    let touched = false;
    for (const motion of motions.values()) {
      if (
        !motion.spec.active ||
        motion.reveal < 0.98 ||
        current.time - motion.lastWave < 100
      )
        continue;
      const screen = motion.points.map((point) => ({
        x: matrix.a * point.x + matrix.c * point.y + matrix.e,
        y: matrix.b * point.x + matrix.d * point.y + matrix.f,
      }));
      const hit = sweepConnection(screen, before, current);
      if (!hit || hit.position < 0.025 || hit.position > 0.975) continue;
      motion.waves = [
        ...motion.waves.slice(-1),
        { ...hit, started: current.time },
      ];
      motion.lastWave = current.time;
      touched = true;
    }
    if (touched) refresh(current.time);
  };
  const down = () => {
    pressed = true;
    previous = null;
  };
  const up = () => {
    pressed = false;
    previous = null;
  };
  const leave = () => {
    previous = null;
  };
  stage.addEventListener("pointermove", move, true);
  stage.addEventListener("pointerdown", down, true);
  stage.addEventListener("pointerleave", leave);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", up, true);

  return {
    update(next: Props) {
      config = next;
      const now = performance.now(),
        instant = next.reduced || next.compact;
      const ids = new Set(next.connections.map((spec) => spec.id));
      for (const id of motions.keys()) if (!ids.has(id)) motions.delete(id);
      const paths = new Map(
        Array.from(
          svg.querySelectorAll<SVGPathElement>(".km-connection"),
          (path) => [path.dataset.connectionId!, path],
        ),
      );
      for (const spec of next.connections) {
        const path = paths.get(spec.id);
        if (!path) continue;
        let motion = motions.get(spec.id);
        if (!motion) {
          const points = sampleConnection(spec.from, spec.to);
          motion = {
            spec,
            path,
            points,
            geometry: connectionGeometry(points),
            geometryDirty: true,
            lastD: "",
            hadWaves: false,
            layoutFrom: points,
            layoutTo: points,
            layoutStarted: now - CONNECTION_LAYOUT_MS,
            layoutProgress: 1,
            reveal: 0,
            revealFrom: 0,
            revealTo: spec.active ? 1 : 0,
            revealStarted: now + Math.max(0, spec.delay),
            waves: [],
            lastWave: -Infinity,
          };
          motions.set(spec.id, motion);
        } else {
          advance(motion, now);
          if (
            !samePoint(motion.spec.from, spec.from) ||
            !samePoint(motion.spec.to, spec.to)
          ) {
            motion.layoutFrom = motion.points;
            motion.layoutTo = sampleConnection(spec.from, spec.to);
            motion.layoutStarted = now;
            motion.layoutProgress = -1;
          }
          if (motion.spec.active !== spec.active) {
            motion.revealFrom = motion.reveal;
            motion.revealTo = spec.active ? 1 : 0;
            motion.revealStarted =
              now + (spec.active ? Math.max(0, spec.delay) : 0);
            motion.waves = [];
          }
          motion.spec = spec;
          if (motion.path !== path) {
            motion.geometryDirty = true;
            motion.lastD = "";
          }
          motion.path = path;
        }
        if (instant || (!spec.active && motion.reveal <= 0)) {
          if (motion.points !== motion.layoutTo) {
            motion.points = motion.layoutTo;
            motion.geometry = connectionGeometry(motion.points);
            motion.geometryDirty = true;
          }
          motion.layoutFrom = motion.layoutTo;
          motion.layoutStarted = now - CONNECTION_LAYOUT_MS;
          motion.layoutProgress = 1;
          if (instant) {
            motion.reveal =
              motion.revealFrom =
              motion.revealTo =
                spec.active ? 1 : 0;
            motion.waves = [];
          }
        }
      }
      if (instant || next.suspended) previous = null;
      refresh(now);
    },
    dispose() {
      disposed = true;
      stop();
      motions.clear();
      stage.removeEventListener("pointermove", move, true);
      stage.removeEventListener("pointerdown", down, true);
      stage.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
    },
  };
}

export function KnowledgeConnections(props: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const runtime = useRef<ReturnType<typeof createRuntime> | null>(null);
  const latest = useRef(props);
  latest.current = props;
  // The ancestor DOM is attached during mutation, before layout effects, even
  // when React has not assigned that ancestor's ref yet. Initialize here so the
  // line clock starts in the same commit as the parent's node WAAPI animations.
  useLayoutEffect(() => {
    const surface =
      props.stage.current ?? svg.current?.closest<HTMLDivElement>(".km-stage");
    if (!svg.current || !surface) return;
    const active = createRuntime(svg.current, surface);
    runtime.current = active;
    active.update(latest.current);
    return () => {
      active.dispose();
      runtime.current = null;
    };
  }, [props.stage]);
  useLayoutEffect(() => {
    runtime.current?.update(props);
  }, [props.connections, props.reduced, props.compact, props.suspended]);

  return (
    <svg
      ref={svg}
      className="km-connections km-connections-motion"
      aria-hidden="true"
      data-compact={props.compact}
    >
      <g>
        {props.connections.map((spec) => (
          <path
            key={spec.id}
            className="km-connection"
            data-connection-id={spec.id}
            data-tier={spec.kind}
            data-active={spec.active}
            pathLength={1}
          />
        ))}
      </g>
    </svg>
  );
}

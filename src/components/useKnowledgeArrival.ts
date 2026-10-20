import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { KnowledgePack } from "../data/knowledge-map";
import {
  mapTransform,
  type KnowledgeLayout,
  type MapPoint,
} from "../knowledge-layout";
import { KNOWLEDGE_POP_MS, knowledgeRevealPlan } from "../knowledge-reveal";

const ease = "cubic-bezier(0.23, 1, 0.32, 1)";
type NodeSpec = {
  id: string;
  domId: string;
  point: MapPoint;
  parent: MapPoint;
  active: boolean;
  delay: number;
};
type Flight = { animation: Animation; timer: number | null };

export function useKnowledgeArrival({
  stage,
  branches,
  layout,
  enabled,
  reduced,
  compact,
}: {
  stage: RefObject<HTMLDivElement | null>;
  branches: KnowledgePack["branches"];
  layout: KnowledgeLayout;
  enabled: boolean;
  reduced: boolean;
  compact: boolean;
}) {
  const previous = useRef(new Map<string, NodeSpec>());
  const visible = useRef(new Set<string>());
  const flights = useRef(new Map<string, Flight>());
  const appeared = useRef(new Set<string>());
  const [running, setRunning] = useState(false);
  const plan = useMemo(
    () => knowledgeRevealPlan(branches, layout, visible.current, enabled),
    [branches, layout, enabled],
  );
  const nodes = useMemo(
    () =>
      branches.flatMap((branch): NodeSpec[] => [
        {
          id: branch.id,
          domId: `km-branch-${branch.id}`,
          point: layout.branches[branch.id],
          parent: { x: 0, y: 0 },
          active: enabled && layout.activeBranches.has(branch.id),
          delay: plan.nodeDelays[branch.id] ?? 0,
        },
        ...branch.cardIds.map((id) => ({
          id,
          domId: `km-card-${id}`,
          point: layout.cards[id],
          parent: layout.branches[branch.id],
          active: enabled && layout.activeCards.has(id),
          delay: plan.nodeDelays[id] ?? 0,
        })),
      ]),
    [branches, layout, enabled, plan],
  );

  useLayoutEffect(() => {
    const surface = stage.current;
    if (!surface) return;
    const started = performance.now();
    const snapshots = new Map<string, { transform: string; opacity: string }>();
    // Read interrupted poses together, before any animation writes. Reading all
    // 24 nodes between individual writes forces repeated full-map style flushes.
    for (const spec of nodes) {
      const old = previous.current.get(spec.id);
      if (
        !flights.current.has(spec.id) &&
        !(spec.active && !old?.active && appeared.current.has(spec.id))
      )
        continue;
      const node = document.getElementById(spec.domId);
      if (!node) continue;
      const style = getComputedStyle(node);
      snapshots.set(spec.id, {
        transform: style.transform,
        opacity: style.opacity,
      });
    }
    let remaining = 0;
    for (const spec of nodes) {
      const node = document.getElementById(spec.domId);
      if (!node) continue;
      const old = previous.current.get(spec.id);
      const flight = flights.current.get(spec.id);
      const visual = snapshots.get(spec.id);
      const changed =
        !old ||
        old.active !== spec.active ||
        old.point.x !== spec.point.x ||
        old.point.y !== spec.point.y;
      if (!changed && !reduced && !compact) continue;
      flight?.animation.cancel();
      if (flight?.timer != null) clearTimeout(flight.timer);
      flights.current.delete(spec.id);
      node.dataset.arrival = spec.active ? "settled" : "inactive";
      node.inert = !spec.active;
      node.setAttribute("aria-hidden", String(!spec.active));
      if (spec.active) appeared.current.add(spec.id);
      if (!spec.active)
        node
          .querySelectorAll<HTMLDetailsElement>("details[open]")
          .forEach((source) => {
            source.open = false;
          });
      if (reduced || !enabled || (!spec.active && !old?.active)) continue;
      const entering = spec.active && !old?.active;
      const resuming =
        !!flight || (entering && !!visual && Number(visual.opacity) > 0.01);
      const delay = entering ? spec.delay : 0;
      const duration = entering ? KNOWLEDGE_POP_MS : 280;
      if (!compact && !entering && !flight) {
        // Established nodes already have interruptible CSS layout/retract
        // transitions. Only override them when an arrival is being interrupted.
        remaining = Math.max(remaining, duration);
        continue;
      }
      let frames: Keyframe[];
      if (compact) {
        // Natural-height CSS transitions retain their job on the reading layout.
        if (!entering) continue;
        frames = [{ opacity: 0 }, { opacity: 1 }];
      } else if (entering && !resuming) {
        const dx = spec.point.x - spec.parent.x,
          dy = spec.point.y - spec.parent.y;
        const length = Math.hypot(dx, dy) || 1;
        const start = {
          x: spec.point.x - (dx / length) * 12,
          y: spec.point.y - (dy / length) * 12,
        };
        frames = [
          {
            transform: `${mapTransform(start)} scale(.955)`,
            opacity: 0,
            offset: 0,
            easing: ease,
          },
          {
            transform: `${mapTransform(spec.point)} scale(1.008)`,
            opacity: 1,
            offset: 0.72,
            easing: ease,
          },
          {
            transform: `${mapTransform(spec.point)} scale(1)`,
            opacity: 1,
            offset: 1,
          },
        ];
      } else {
        frames = [
          {
            transform:
              visual && resuming
                ? visual.transform
                : mapTransform(
                    old?.active ? old.point : (old?.parent ?? spec.parent),
                  ),
            opacity: visual && resuming ? visual.opacity : old?.active ? 1 : 0,
          },
          {
            transform: mapTransform(spec.active ? spec.point : spec.parent),
            opacity: spec.active ? 1 : 0,
          },
        ];
      }
      const animation = node.animate(frames, {
        duration,
        delay,
        easing: ease,
        fill: "both",
      });
      animation.id = `knowledge-${spec.active ? (entering ? "arrival" : "layout") : "retract"}`;
      // WAAPI otherwise picks a frame timestamp older than this commit. Share
      // the live performance clock used by the connection runtime instead.
      animation.startTime = started;
      const current: Flight = { animation, timer: null };
      flights.current.set(spec.id, current);
      node.dataset.arrival =
        entering && delay > 0
          ? "pending"
          : spec.active
            ? "entering"
            : "exiting";
      if (entering && delay > 0) {
        node.inert = true;
        node.setAttribute("aria-hidden", "true");
        current.timer = window.setTimeout(
          () => {
            current.timer = null;
            if (flights.current.get(spec.id) !== current) return;
            node.dataset.arrival = "entering";
            node.inert = false;
            node.setAttribute("aria-hidden", "false");
          },
          Math.max(0, started + delay - performance.now()),
        );
      }
      animation.finished.then(
        () => {
          if (flights.current.get(spec.id) !== current) return;
          if (current.timer != null) clearTimeout(current.timer);
          current.timer = null;
          node.inert = !spec.active;
          node.setAttribute("aria-hidden", String(!spec.active));
          node.dataset.arrival = spec.active ? "settled" : "inactive";
          animation.cancel();
          flights.current.delete(spec.id);
        },
        () => {},
      );
      remaining = Math.max(remaining, duration + delay);
    }
    // A branch can change while other branches still have delayed arrivals.
    // Keep the overview stable until those retained flights finish as well.
    for (const { animation } of flights.current.values()) {
      const end = Number(animation.effect?.getComputedTiming().endTime ?? 0);
      const played =
        typeof animation.currentTime === "number" ? animation.currentTime : 0;
      remaining = Math.max(remaining, end - played);
    }
    previous.current = new Map(nodes.map((spec) => [spec.id, spec]));
    visible.current = plan.visible;
    setRunning(!reduced && remaining > 0);
    const timeout = window.setTimeout(() => setRunning(false), remaining);
    return () => clearTimeout(timeout);
  }, [nodes, reduced, compact, enabled, plan, stage]);

  useLayoutEffect(
    () => () => {
      for (const { animation, timer } of flights.current.values()) {
        animation.cancel();
        if (timer != null) clearTimeout(timer);
      }
      flights.current.clear();
    },
    [],
  );
  return { lineDelays: plan.lineDelays, running };
}

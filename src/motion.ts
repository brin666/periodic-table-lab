import { useEffect, useRef, useState } from "react";

/** Entrance effects are disposable: the first real interaction settles them. */
export function useSceneEntrance(
  enabled: boolean,
  ready: boolean,
  duration: number,
) {
  const [settled, setSettled] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setSettled(true);
      return;
    }
    if (settled) return;
    const settle = () => setSettled(true);
    const timer = ready ? window.setTimeout(settle, duration) : undefined;
    window.addEventListener("pointerdown", settle, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", settle, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", settle);
      window.removeEventListener("keydown", settle);
    };
  }, [enabled, ready, duration, settled]);

  return enabled && !settled;
}

/** Remember arrivals for this app session; focus always makes a card visible. */
export function useCardArrival(
  id: string,
  seen: Set<string>,
  reduced: boolean,
  ready: boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  const canObserve = typeof IntersectionObserver !== "undefined";
  const [visible, setVisible] = useState(
    () => reduced || !canObserve || seen.has(id),
  );
  const [arriving, setArriving] = useState(false);
  const reveal = () => {
    if (!visible && !reduced && canObserve && !seen.has(id)) setArriving(true);
    seen.add(id);
    setVisible(true);
  };
  const settle = () => setArriving(false);
  const revealImmediately = () => {
    reveal();
    settle();
  };

  useEffect(() => {
    if (reduced) settle();
    if (visible) {
      seen.add(id);
      return;
    }
    if (reduced || !canObserve) {
      reveal();
      return;
    }
    if (!ready || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 24px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, seen, reduced, ready, visible, canObserve]);

  return {
    ref,
    visible: visible || reduced || !canObserve,
    arriving: arriving && !reduced,
    revealImmediately,
    settle,
  };
}

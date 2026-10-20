import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ArrowUpRight } from "lucide-react";
import type { TeachingIsotope } from "../data/isotopes";
import { useI18n } from "../i18n";
import { isotopeDisplayName, isotopeShortName } from "../i18n/exploration-en";

// Separate concentric rows by a full key height, including its shadow.
function orbitLayout(nuclides: TeachingIsotope[], viewportSize: number) {
  const positions: Array<{ nuclide: TeachingIsotope; x: number; y: number }> = [];
  let offset = 0;
  let ring = 0;
  while (offset < nuclides.length) {
    ring += 1;
    const count = Math.min(ring * 6, nuclides.length - offset);
    const radius = ring * 88;
    for (let slot = 0; slot < count; slot += 1) {
      const angle = -Math.PI / 2 + (slot * Math.PI * 2) / count;
      positions.push({
        nuclide: nuclides[offset + slot],
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
    offset += count;
  }
  return { positions, worldSize: Math.max(viewportSize, ring * 176 + 80) };
}

export function IsotopeViewport({
  nuclides,
  size,
  symbol,
  name,
  reduced,
  paused,
  onExplore,
  onElementPointerDown,
  onOpenNuclide,
}: {
  nuclides: TeachingIsotope[];
  size: number;
  symbol: string;
  name: string;
  reduced: boolean;
  paused: boolean;
  onExplore: (detail: number) => void;
  onElementPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onOpenNuclide: (nuclide: TeachingIsotope, trigger: HTMLButtonElement) => void;
}) {
  const { language, t } = useI18n();
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pointer = useRef<{ x: number; y: number; overKey: boolean } | null>(null);
  const lastFrame = useRef(0);
  const { positions, worldSize } = orbitLayout(nuclides, size);

  const stop = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    lastFrame.current = 0;
    pointer.current = null;
  };

  useLayoutEffect(() => {
    const node = viewport.current;
    if (node) node.scrollTo((worldSize - size) / 2, (worldSize - size) / 2);
  }, [size, worldSize]);

  useEffect(() => {
    if (paused || reduced) stop();
    const onVisibilityChange = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [paused, reduced]);

  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || reduced || paused || event.buttons) return;
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      overKey: (event.target as Element).closest("button") !== null,
    };
    if (frame.current) return;
    let camera: { x: number; y: number } | null = null;
    const tick = (now: number) => {
      const node = viewport.current;
      const input = pointer.current;
      if (!node || !input) return stop();
      const box = node.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (input.x - box.left) / box.width));
      const y = Math.max(0, Math.min(1, (input.y - box.top) / box.height));
      // Let a card settle under the pointer so it remains easy to click.
      if (input.overKey && x > .15 && x < .85 && y > .15 && y < .85) return stop();
      const maxX = node.scrollWidth - node.clientWidth;
      const maxY = node.scrollHeight - node.clientHeight;
      // The outer 10% reaches the complete bounds; no nuclide stays beyond reach.
      const targetX = maxX * Math.max(0, Math.min(1, (x - .1) / .8));
      const targetY = maxY * Math.max(0, Math.min(1, (y - .1) / .8));
      const dt = lastFrame.current ? Math.min(40, now - lastFrame.current) : 16;
      lastFrame.current = now;
      const alpha = 1 - Math.exp(-dt / 95);
      camera ??= { x: node.scrollLeft, y: node.scrollTop };
      const deltaX = targetX - camera.x;
      const deltaY = targetY - camera.y;
      if (Math.abs(deltaX) < .35 && Math.abs(deltaY) < .35) {
        node.scrollTo(targetX, targetY);
        return stop();
      }
      camera.x += deltaX * alpha;
      camera.y += deltaY * alpha;
      node.scrollTo(camera.x, camera.y);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-72, 0], ArrowRight: [72, 0], ArrowUp: [0, -72], ArrowDown: [0, 72],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    stop();
    event.currentTarget.scrollBy(direction[0], direction[1]);
  };

  return (
    <div
      ref={viewport}
      className="isotope-halo__orbit isotope-viewport"
      role="region"
      aria-label={t(
        `${name}同位素视窗，共${nuclides.length}种；移向边缘探索，也可滚动或使用方向键`,
        `${name} isotope viewport with ${nuclides.length} nuclides; move toward the edges, scroll, or use the arrow keys to explore`,
      )}
      tabIndex={0}
      onPointerMove={followPointer}
      onPointerLeave={stop}
      onPointerDownCapture={stop}
      onWheelCapture={stop}
      onFocusCapture={stop}
      onKeyDown={moveWithKeyboard}
    >
      <div className="isotope-viewport__world" style={{ width: worldSize, height: worldSize }}>
        <button
          className="isotope-halo__core"
          onClick={(event) => onExplore(event.detail)}
          onPointerDown={onElementPointerDown}
          onDragStart={(event) => event.preventDefault()}
          aria-label={t(`探索${name}元素`, `Explore ${name}`)}
        >
          <span>{symbol}</span><small>{name}</small><ArrowUpRight size={11} />
        </button>
        {positions.map(({ nuclide, x, y }, index) => (
          <button
            key={nuclide.id}
            className="isotope-mini"
            data-isotope={nuclide.id}
            style={{
              "--isotope-x": `${x}px`, "--isotope-y": `${y}px`,
              "--isotope-start-x": `${x}px`, "--isotope-start-y": `${y}px`,
              "--isotope-delay": `${Math.min(index, 8) * 14}ms`,
            } as CSSProperties}
            aria-label={t(
              `${nuclide.name}，质量数${nuclide.massNumber}，查看同位素知识`,
              `${isotopeDisplayName(nuclide, language, name)}, mass number ${nuclide.massNumber}; view isotope information`,
            )}
            onClick={(event) => onOpenNuclide(nuclide, event.currentTarget)}
          >
            <span className="isotope-symbol"><sup>{nuclide.massNumber}</sup>{symbol}</span>
            <small>{isotopeShortName(nuclide, language)}</small>
          </button>
        ))}
        {!nuclides.length && (
          <p className="isotope-halo__empty">
            {t("暂未收录该元素的核素资料", "No nuclide records are listed for this element")}
          </p>
        )}
      </div>
    </div>
  );
}

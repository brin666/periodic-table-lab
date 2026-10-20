import { useI18n, elementName } from "./i18n";
import {
  localizeStory,
  localizeSubstance,
  localizeEquation,
  localizeSource,
} from "./i18n/content-en";
import {
  useEffect,
  useCallback,
  useRef,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal, flushSync } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers3,
  MoveHorizontal,
  Orbit,
  Sparkles,
  X,
} from "lucide-react";
import {
  categories,
  elements,
  elementById,
  levels,
  sourceById,
  sources,
  substanceById,
} from "./data/catalog";
import {
  getElementContent,
  getFocusElementIds,
  getSubstanceEquations,
  isContentVisible,
  type LearningMode,
} from "./data/curriculum";
import type {
  Category,
  Element,
  Equation,
  EquationTerm,
  Substance,
} from "./data/types";
import { SubstanceArt } from "./components/SubstanceArt";
import { useCardArrival, useSceneEntrance } from "./motion";
import {
  LazyKnowledgePage,
  isKnowledgePageReady,
  loadKnowledgePage,
  scheduleKnowledgePreload,
  cancelKnowledgePreload,
} from "./components/LazyKnowledgePage";
import { hasKnowledgeMap } from "./data/knowledge-availability";
import {
  CompoundWorkbench,
  type ElementSelection,
} from "./components/CompoundWorkbench";
import type { IsotopeAnchor } from "./components/IsotopeExplorer";
import { useElementDrag } from "./components/useElementDrag";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { nuclideDatasetInfo } from "./data/nuclide-metadata";
import { assignSelectedElement } from "./data/element-selection";
import { ScrollReveal, StreamText } from "./components/ScrollReveal";
import { equationNotationById } from "./data/equation-notation";
import {
  HydrogenEntrance,
  useHydrogenEntrance,
} from "./components/HydrogenEntrance";
const IsotopeExplorer = lazy(() =>
  import("./components/IsotopeExplorer").then((module) => ({
    default: module.IsotopeExplorer,
  })),
);
type Route = {
  elementId?: string;
  substanceId?: string;
  view?: "atom";
};
type LocationSnapshot = {
  x: number;
  y: number;
  tableX: number;
  materialsX: number;
};
const emptySnapshot = { x: 0, y: 0, tableX: 0, materialsX: 0 };
const emptyCollapsed = new Set<string>();
const routeKey = (r: Route) => {
  if (!r.elementId) return "/";
  const elementPath = `/element/${r.elementId}`;
  if (r.substanceId) return `${elementPath}/substance/${r.substanceId}`;
  return r.view === "atom" ? `${elementPath}/atom` : elementPath;
};
function readRoute(): Route {
  const [, section, elementId, sub, substanceId] = location.hash
    .slice(1)
    .split("/");
  if (section !== "element" || !elementById[elementId]) return {};
  if (sub === "atom") return { elementId, view: "atom" };
  if (
    sub === "substance" &&
    substanceById[substanceId] &&
    substanceById[substanceId].composition[elementId]
  )
    return { elementId, substanceId };
  return { elementId };
}
// Switching presentation language must not cancel an element download in flight.
// Other URL changes still invalidate the pending navigation.
function navigationLocation() {
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  return url.href;
}
const styleFor = (element: Element): CSSProperties =>
  ({
    "--key-color": categories[element.category].color,
    "--key-ink": categories[element.category].ink,
  }) as CSSProperties;
export function Formula({ value }: { value: string }) {
  return (
    <span className="formula" aria-label={value}>
      {value
        .split(/(\d+)/)
        .map((part, i) =>
          /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : part,
        )}
    </span>
  );
}
function SourceLinks({ ids }: { ids: string[] }) {
  const { language, t } = useI18n();
  return (
    <details className="source-details">
      <summary>
        {t("知识来源")}
        <ArrowUpRight size={13} />
      </summary>
      <div>
        {[...new Set(ids)].map((id) => {
          const source = sourceById[id]
            ? localizeSource(sourceById[id], language)
            : undefined;
          return source ? (
            <a key={id} href={source.url} target="_blank" rel="noreferrer">
              {source.kind === "textbook" ? t("教材") : t("参考资料")} ·{" "}
              {source.title}
              {source.pages && ` · ${source.pages}`}
              <ExternalLink size={12} />
            </a>
          ) : null;
        })}
      </div>
    </details>
  );
}
function ElementFace({
  element,
  large = false,
  shared = false,
  marked = false,
}: {
  element: Element;
  large?: boolean;
  shared?: boolean;
  marked?: boolean;
}) {
  const { language, t } = useI18n();
  return (
    <span
      className={`key-face ${large ? "large" : ""}`}
      data-category={element.category}
      style={{
        ...styleFor(element),
        viewTransitionName: shared ? "element-key" : "none",
      }}
    >
      <span className="atomic-number">
        {element.number.toString().padStart(2, "0")}
      </span>
      <span className="element-symbol">{element.symbol}</span>
      <span className="element-name">{elementName(element, language)}</span>
      {large && language === "zh" && (
        <span className="element-english">{element.englishName}</span>
      )}
      {marked && <span className="story-dot" aria-hidden="true" />}
    </span>
  );
}
function PeriodicTable({
  onOpen,
  selectedId,
  pendingElementId,
  category,
  setCategory,
  onlyCommon,
  setOnlyCommon,
  reduced,
  homeEntered,
  learningMode,
  selection,
  onSelectionChange,
  isotopeEnabled,
  onIsotopeChange,
  onCompoundOpen,
}: {
  onOpen: (id: string) => void;
  selectedId: string;
  pendingElementId: string | null;
  category: Category | null;
  setCategory: (c: Category | null) => void;
  onlyCommon: boolean;
  setOnlyCommon: (v: boolean) => void;
  reduced: boolean;
  homeEntered: RefObject<boolean>;
  learningMode: LearningMode;
  selection: ElementSelection;
  onSelectionChange: (selection: ElementSelection) => void;
  isotopeEnabled: boolean;
  onIsotopeChange: (value: boolean) => void;
  onCompoundOpen: (substanceId: string, elementId: string) => void;
}) {
  const { language, t } = useI18n();
  const focusElements = getFocusElementIds(learningMode);
  const [focusId, setFocusId] = useState(selectedId);
  const [firstEntrance] = useState(() => !homeEntered.current);
  const entering = useHydrogenEntrance(firstEntrance && !reduced);
  const [compact, setCompact] = useState(
    () => matchMedia("(max-width: 700px)").matches,
  );
  const [pickingSlot, setPickingSlot] = useState<number | null>(null);
  const [selectionNotice, setSelectionNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isotopeAnchor, setIsotopeAnchor] = useState<IsotopeAnchor | null>(
    null,
  );
  const isotopeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearIsotopeTimer = useCallback(() => {
    if (isotopeTimer.current !== null) clearTimeout(isotopeTimer.current);
    isotopeTimer.current = null;
  }, []);
  const setIsotopePanelOpen = useCallback(
    (open: boolean) => {
      if (open) clearIsotopeTimer();
    },
    [clearIsotopeTimer],
  );
  const closeIsotopes = () => {
    clearIsotopeTimer();
    setIsotopeAnchor(null);
  };
  const updateSelection = (next: ElementSelection) => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    setSelectionNotice(next === selection ? t("这个元素已经加入了") : "");
    if (next === selection)
      noticeTimer.current = setTimeout(() => setSelectionNotice(""), 1800);
    onSelectionChange(next);
    setPickingSlot(null);
  };
  const drag = useElementDrag({
    selection,
    onSelectionChange: updateSelection,
    disabled: entering,
    onStart: closeIsotopes,
  });
  const showIsotopes = (
    trigger: HTMLButtonElement,
    elementId: string,
    immediate = false,
  ) => {
    if (!isotopeEnabled || entering || pickingSlot !== null || drag.ghost)
      return;
    clearIsotopeTimer();
    if (immediate) setIsotopeAnchor({ trigger, elementId });
    else
      isotopeTimer.current = setTimeout(
        () => setIsotopeAnchor({ trigger, elementId }),
        150,
      );
  };
  useEffect(() => {
    const media = matchMedia("(max-width: 700px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => {
      media.removeEventListener("change", change);
      clearIsotopeTimer();
      if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!isotopeEnabled) closeIsotopes();
  }, [isotopeEnabled]);
  useEffect(() => {
    homeEntered.current = true;
  }, [homeEntered]);
  const matched = elements.filter(
    (e) =>
      (!category || e.category === category) &&
      (!onlyCommon || focusElements.has(e.id)),
  );
  const visible = new Set(matched.map((e) => e.id));
  const rovingId = visible.has(focusId) ? focusId : matched[0]?.id;
  const keyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    element: Element,
  ) => {
    if (event.key === " " && isotopeEnabled && pickingSlot === null) {
      event.preventDefault();
      showIsotopes(event.currentTarget, element.id, true);
      requestAnimationFrame(() =>
        document.querySelector<HTMLButtonElement>("[data-isotope]")?.focus(),
      );
      return;
    }
    if (event.key === "Escape") {
      closeIsotopes();
      setPickingSlot(null);
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const target = event.key === "Home" ? matched[0] : matched.at(-1);
      if (target) {
        setFocusId(target.id);
        document.getElementById(`key-${target.id}`)?.focus();
      }
      return;
    }
    const d = directions[event.key];
    if (!d) return;
    event.preventDefault();
    const candidates = matched.filter((e) =>
      d[0]
        ? e.row === element.row && (e.column - element.column) * d[0] > 0
        : (e.row - element.row) * d[1] > 0,
    );
    candidates.sort((a, b) =>
      d[0]
        ? Math.abs(a.column - element.column) -
          Math.abs(b.column - element.column)
        : Math.abs(a.row - element.row) * 20 +
          Math.abs(a.column - element.column) -
          (Math.abs(b.row - element.row) * 20 +
            Math.abs(b.column - element.column)),
    );
    if (candidates[0]) {
      setFocusId(candidates[0].id);
      document.getElementById(`key-${candidates[0].id}`)?.focus();
    }
  };
  const workbench = (
    <div
      className={`home-workbench${compact ? " is-compact" : ""}`}
      inert={entering}
    >
      <CompoundWorkbench
        selection={selection}
        onSelectionChange={updateSelection}
        pickingSlot={pickingSlot}
        onPickSlot={(slot) => {
          closeIsotopes();
          setPickingSlot(slot);
        }}
        dragOver={drag.dragOver}
        activeDropSlot={drag.activeDropSlot}
        draggingElementId={drag.ghost?.elementId ?? null}
        onElementPointerDown={drag.startSelected}
        consumeElementClick={drag.consumeClick}
        reduced={reduced}
        learningMode={learningMode}
        onOpen={onCompoundOpen}
      />
    </div>
  );
  return (
    <main
      className="table-page"
      id="main-content"
      data-enter={entering}
      data-picking={pickingSlot !== null}
    >
      {entering && <HydrogenEntrance />}
      <h1 className="sr-only" tabIndex={-1}>
        {t("元素周期表")}
      </h1>
      <section className="periodic-board" aria-label={t("元素周期表")}>
        <div className="board-toolbar">
          <div className="table-tabs">
            <button
              aria-pressed={onlyCommon}
              className={onlyCommon ? "active" : ""}
              onClick={() => setOnlyCommon(!onlyCommon)}
            >
              {t("重点探索")}
              <span>{focusElements.size}</span>
            </button>
            <button
              aria-label={t("同位素")}
              title={t(
                "NUBASE2020 基态核素索引：悬停或轻点元素预览，按空格展开，可查看完整列表",
              )}
              aria-pressed={isotopeEnabled}
              className={`isotope-toggle${isotopeEnabled ? " active" : ""}`}
              onClick={() => {
                setPickingSlot(null);
                onIsotopeChange(!isotopeEnabled);
              }}
            >
              <Orbit size={16} />
              {t("同位素")}
            </button>
          </div>
          {(isotopeEnabled || pickingSlot !== null || selectionNotice) && (
            <span className="isotope-toolbar-note" role="status">
              {selectionNotice ||
                (pickingSlot !== null
                  ? t(
                      `请选择第${pickingSlot + 1}种元素 · Esc 取消`,
                      `Choose element ${pickingSlot + 1} · Esc to cancel`,
                    )
                  : t(
                      `${nuclideDatasetInfo.elementCount} 元素 · ${nuclideDatasetInfo.includedRecordCount} 基态核素 · ${nuclideDatasetInfo.version}`,
                      `${nuclideDatasetInfo.elementCount} elements · ${nuclideDatasetInfo.includedRecordCount} ground-state nuclides · ${nuclideDatasetInfo.version}`,
                    ))}
            </span>
          )}
        </div>
        {compact && workbench}
        <div className="mobile-scroll-hint">
          <MoveHorizontal size={15} />
          {t("左右滑动，查看完整周期表")}{" "}
          <span>{t("周期与族的位置保持不变")}</span>
        </div>
        <div className="table-scroll" id="table-scroll" tabIndex={-1}>
          <div
            className="element-grid"
            role="group"
            aria-label={t("118个元素，方向键在元素间移动，回车进入探索")}
          >
            {!compact && workbench}
            <span
              className="axis-caption"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              {t("族 →")}
            </span>
            {Array.from({ length: 18 }, (_, i) => (
              <span
                className="group-number"
                key={i}
                style={{ gridColumn: i + 2, gridRow: 1 }}
              >
                {i + 1}
              </span>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <span
                className="period-number"
                key={i}
                style={{ gridColumn: 1, gridRow: i + 2 }}
              >
                {i + 1}
              </span>
            ))}
            {elements.map((e) => (
              <button
                id={`key-${e.id}`}
                data-element={e.id}
                data-category={e.category}
                key={e.id}
                className={`element-key ${visible.has(e.id) ? "" : "dimmed"} ${focusElements.has(e.id) ? "has-story" : ""}`}
                tabIndex={e.id === rovingId ? 0 : -1}
                aria-busy={e.id === pendingElementId || undefined}
                onFocus={() => setFocusId(e.id)}
                aria-label={t(
                  `${e.number}号 ${e.name} ${e.symbol}，${categories[e.category].name}${focusElements.has(e.id) ? "，重点探索" : ""}`,
                  `${e.number} ${e.englishName} ${e.symbol}, ${t(categories[e.category].name)}${focusElements.has(e.id) ? ", featured" : ""}`,
                )}
                onPointerDown={(event) => drag.start(event, e.id)}
                onDragStart={(event) => event.preventDefault()}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") {
                    showIsotopes(event.currentTarget, e.id);
                    if (
                      !isotopeEnabled &&
                      pickingSlot === null &&
                      hasKnowledgeMap(e.id)
                    )
                      scheduleKnowledgePreload(e.id);
                  }
                }}
                onPointerLeave={() => {
                  clearIsotopeTimer();
                  cancelKnowledgePreload();
                }}
                onClick={(event) => {
                  if (drag.consumeClick(event.detail, e.id)) return;
                  if (pickingSlot !== null) {
                    updateSelection(
                      assignSelectedElement(selection, e.id, pickingSlot),
                    );
                    setPickingSlot(null);
                    closeIsotopes();
                    return;
                  }
                  if (
                    isotopeEnabled &&
                    (event.nativeEvent as PointerEvent).pointerType === "touch"
                  ) {
                    showIsotopes(event.currentTarget, e.id, true);
                    return;
                  }
                  closeIsotopes();
                  onOpen(e.id);
                }}
                onKeyDown={(ev) => keyboard(ev, e)}
                style={{
                  gridColumn: e.column + 1,
                  gridRow: e.row + 1,
                  ...styleFor(e),
                }}
              >
                {entering && (
                  <span className="entrance-key-shadow" aria-hidden="true" />
                )}
                <span
                  className="key-arrival"
                  style={
                    {
                      "--key-order": e.row - 1,
                    } as CSSProperties
                  }
                >
                  <ElementFace
                    element={e}
                    shared={selectedId === e.id}
                    marked={focusElements.has(e.id)}
                  />
                  {entering && (
                    <span className="entrance-key-light" aria-hidden="true" />
                  )}
                </span>
              </button>
            ))}
            <span
              className="series-placeholder"
              style={{ gridColumn: 4, gridRow: 7 }}
            >
              <span>57–71</span>
              <strong>{t("镧系")}</strong>
              <span>↓</span>
            </span>
            <span
              className="series-placeholder"
              style={{ gridColumn: 4, gridRow: 8 }}
            >
              <span>89–103</span>
              <strong>{t("锕系")}</strong>
              <span>↓</span>
            </span>
            <span
              className="series-label"
              style={{ gridColumn: "2 / 4", gridRow: 10 }}
            >
              {t("镧系元素")}
              <span>{t("6 周期")}</span>
            </span>
            <span
              className="series-label"
              style={{ gridColumn: "2 / 4", gridRow: 11 }}
            >
              {t("锕系元素")}
              <span>{t("7 周期")}</span>
            </span>
          </div>
        </div>
      </section>
      <div className="category-legend" aria-label={t("按类别突出元素")}>
        <button
          className={!category ? "selected" : ""}
          onClick={() => setCategory(null)}
          aria-pressed={!category}
        >
          {t("全部类别")}
        </button>
        {Object.entries(categories).map(([id, c]) => (
          <button
            key={id}
            data-category={id}
            onClick={() =>
              setCategory(category === id ? null : (id as Category))
            }
            aria-pressed={category === id}
            className={category === id ? "selected" : ""}
          >
            <i style={{ background: c.color }} />
            {t(c.name)}
          </button>
        ))}
      </div>
      <div className="table-bottom">
        <p>{t("一个元素，一类原子。先认识组成，再理解变化。")}</p>
        <span>{t("18 族布局 · 镧系与锕系单列")}</span>
      </div>
      {isotopeEnabled && isotopeAnchor && !entering && (
        <Suspense fallback={null}>
          <IsotopeExplorer
            key={isotopeAnchor.elementId}
            anchor={isotopeAnchor}
            reduced={reduced}
            onClose={closeIsotopes}
            onKeep={clearIsotopeTimer}
            onPanelOpenChange={setIsotopePanelOpen}
            onElementPointerDown={drag.start}
            onExplore={(id, detail) => {
              if (!drag.consumeClick(detail, id)) {
                closeIsotopes();
                onOpen(id);
              }
            }}
          />
        </Suspense>
      )}
      {drag.ghost &&
        createPortal(
          <div
            className="element-drag-ghost"
            aria-hidden="true"
            style={{
              width: drag.ghost.width,
              height: drag.ghost.height,
              transform: `translate(${drag.ghost.x}px, ${drag.ghost.y}px) rotate(-4deg) scale(1.07)`,
            }}
          >
            <ElementFace element={elementById[drag.ghost.elementId]} />
          </div>,
          document.body,
        )}
    </main>
  );
}
function AtomDiagram({
  element,
  shell,
  onShell,
}: {
  element: Element;
  shell: number;
  onShell: (s: number) => void;
}) {
  const { language, t } = useI18n();
  const count = element.shells.length;
  const selected = Math.min(shell, count - 1);
  const radii = element.shells.map((_, i) =>
    count === 1 ? 134 : 64 + i * (111 / Math.max(1, count - 1)),
  );
  return (
    <div className="atom-display" style={styleFor(element)}>
      <div className="atom-canvas">
        <svg
          className="atom-svg"
          viewBox="0 0 420 420"
          role="img"
          aria-label={t(
            `${element.name}中性原子，${element.number}个电子；分层数量${element.shells.join("、")}，不是电子真实轨迹`,
            `Neutral ${element.englishName} atom, ${element.number} electrons; shell counts ${element.shells.join(", ")}. Rings do not show actual electron paths.`,
          )}
        >
          {radii.map((radius, i) => (
            <g
              key={i}
              className={`shell-group ${selected === i ? "is-selected" : ""}`}
              style={{ "--shell-order": i } as CSSProperties}
              onClick={() => onShell(i)}
            >
              <circle className="shell-hit" cx="210" cy="210" r={radius} />
              <circle className="shell-ring" cx="210" cy="210" r={radius} />
              {Array.from({ length: element.shells[i] }, (_, j) => {
                const angle =
                  (2 * Math.PI * j) / element.shells[i] -
                  Math.PI / 2 +
                  (i % 2) * 0.18;
                return (
                  <circle
                    className="electron-dot"
                    key={j}
                    cx={210 + Math.cos(angle) * radius}
                    cy={210 + Math.sin(angle) * radius}
                    r={selected === i ? 5.5 : 3.8}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        <div
          className="atom-core"
          aria-hidden="true"
          style={{ viewTransitionName: "element-key" }}
        >
          <span className="nucleus-symbol">{element.symbol}</span>
          <span className="nucleus-charge">+{element.number}</span>
        </div>
        <span className="atom-tag">
          <span />
          {t("中性原子")}
        </span>
      </div>
      <div className="shell-controls" role="group" aria-label={t("选择电子层")}>
        {element.shells.map((n, i) => (
          <button
            key={i}
            aria-label={t(
              `第${i + 1}层 ${n}个电子`,
              `Shell ${i + 1}: ${n} ${n === 1 ? "electron" : "electrons"}`,
            )}
            aria-pressed={selected === i}
            onClick={() => onShell(i)}
          >
            {"KLMNOPQ"[i]}
            <span>{n}</span>
          </button>
        ))}
      </div>
      <div className="shell-readout" aria-live="polite">
        <span>{t(`第 ${selected + 1} 电子层`, `Shell ${selected + 1}`)}</span>
        <strong>
          {element.shells[selected]}{" "}
          <small>
            {t(
              "个电子",
              element.shells[selected] === 1 ? "electron" : "electrons",
            )}
          </small>
        </strong>
        <span>{selected === count - 1 ? t("最外层") : t("内层")}</span>
      </div>
      <p className="model-note">
        {t("教学示意 · 颜色与比例不代表真实原子")}
        <br />
        {t("圆环仅表示电子层，")}
        <strong>{t("不是电子真实运行轨迹")}</strong>
        {t("。", ".")}
      </p>
    </div>
  );
}
function SubstanceCard({
  substance,
  shared,
  onOpen,
  index,
  arrivalId,
  arrivedCards,
  reduced,
  sceneReady,
}: {
  substance: Substance;
  shared: boolean;
  onOpen: () => void;
  index: number;
  arrivalId: string;
  arrivedCards: Set<string>;
  reduced: boolean;
  sceneReady: boolean;
}) {
  const { language, t } = useI18n();
  substance = localizeSubstance(substance, language);
  const arrival = useCardArrival(arrivalId, arrivedCards, reduced, sceneReady);
  return (
    <div
      ref={arrival.ref}
      className={`substance-arrival ${arrival.visible ? "is-visible" : "is-pending"} ${arrival.arriving ? "is-arriving" : ""}`}
      onFocusCapture={arrival.revealImmediately}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) arrival.settle();
      }}
      style={
        { "--arrival": `${180 + Math.min(index, 3) * 65}ms` } as CSSProperties
      }
    >
      <button
        className="substance-card"
        id={`substance-${substance.id}`}
        onClick={onOpen}
        style={
          {
            "--card-tint": substance.color,
          } as CSSProperties
        }
      >
        <div
          className="substance-thumbnail"
          style={{ viewTransitionName: shared ? "substance-picture" : "none" }}
        >
          <SubstanceArt
            kind={substance.artwork}
            color={substance.color}
            label={substance.name}
          />
        </div>
        <div className="substance-card-title">
          <div>
            <span className="mini-label">
              {substance.kind === "elemental" ? t("单质") : t("化合物")}
            </span>
            <h3>
              {substance.name} <Formula value={substance.formula} />
            </h3>
          </div>
        </div>
        <p>{substance.appearance}</p>
      </button>
    </div>
  );
}
function ElementPage({
  element,
  onBack,
  backToKnowledge = false,
  onChange,
  onSubstance,
  selectedSubstance,
  shell,
  onShell,
  reduced,
  sceneReady,
  arrivedCards,
  learningMode,
}: {
  element: Element;
  onBack: () => void;
  backToKnowledge?: boolean;
  onChange: (id: string) => void;
  onSubstance: (id: string) => void;
  selectedSubstance: string;
  shell: number;
  onShell: (n: number) => void;
  reduced: boolean;
  sceneReady: boolean;
  arrivedCards: Set<string>;
  learningMode: LearningMode;
}) {
  const { language, t } = useI18n();
  const content = getElementContent(element.id, learningMode);
  const story = localizeStory(content.story, language);
  const related = content.related;
  const foundationOnly = learningMode === "junior";
  const entering = useSceneEntrance(!reduced, sceneReady, 820);
  return (
    <main
      className="explore-page"
      data-category={element.category}
      id="main-content"
      style={styleFor(element)}
      data-scene-ready={sceneReady}
      data-scene-motion={entering}
    >
      <div className="page-navigation">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          {backToKnowledge ? t("返回思维导图") : t("返回周期表")}
        </button>
        <div className="element-switcher">
          <button
            aria-label={t("上一个元素")}
            disabled={element.number === 1}
            onClick={() => onChange(elements[element.number - 2].id)}
          >
            <ChevronLeft size={19} />
          </button>
          <span>
            {element.number.toString().padStart(2, "0")} <span>/ 118</span>
          </span>
          <button
            aria-label={t("下一个元素")}
            disabled={element.number === 118}
            onClick={() => onChange(elements[element.number].id)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
      <div className="exploration-layout">
        <section className="element-story">
          <div className="hero-key">
            <ElementFace element={element} large />
          </div>
          <div className="story-copy">
            <h1 tabIndex={-1}>
              {story?.headline ??
                t(
                  `${element.name}，\n从原子开始认识。`,
                  `${element.englishName}:\nstart with the atom.`,
                )}
            </h1>
            <p className="story-summary">
              {story?.summary ??
                t(
                  `${element.name}的原子序数为 ${element.number}。一个中性原子含 ${element.number} 个质子和 ${element.number} 个电子；右侧示意图可以查看各层电子数。`,
                  `${element.englishName} has atomic number ${element.number}. A neutral atom has ${element.number} protons and ${element.number} electrons. Explore how those electrons are distributed among its shells.`,
                )}
            </p>
          </div>
        </section>
        <section className="atom-section" aria-label={t("原子电子层探索")}>
          <AtomDiagram element={element} shell={shell} onShell={onShell} />
        </section>
        <section className="related-section">
          <h2 className="related-title">{t("相关物质")}</h2>
          <div className="related-cards">
            {related.map((s, i) => (
              <SubstanceCard
                key={s.id}
                substance={s}
                index={i}
                arrivalId={`${element.id}:${s.id}`}
                arrivedCards={arrivedCards}
                reduced={reduced}
                sceneReady={sceneReady}
                shared={selectedSubstance === s.id}
                onOpen={() => onSubstance(s.id)}
              />
            ))}
          </div>
          {related.length === 0 && (
            <div className="honest-empty">
              <Layers3 size={28} strokeWidth={1} />
              <h3>{t("先认识它本身")}</h3>
              <p>
                {foundationOnly
                  ? t(
                      "初中版先展示原子基础信息。当前没有适合本学段的相关物质条目，可切换高中版继续查看已收录内容。",
                    )
                  : t(
                      "本页已提供原子基础信息。相关物质与反应尚未整理核实，不用未经核对的内容填补。",
                    )}
              </p>
            </div>
          )}
        </section>
      </div>
      <ScrollReveal
        as="section"
        className="element-facts"
        label={t("元素数据")}
        id={`reading:${element.id}:facts`}
        seen={arrivedCards}
        reduced={reduced}
        ready={sceneReady}
      >
        <div
          className="reading-item"
          style={{ "--read-order": 0 } as CSSProperties}
        >
          <span>
            <StreamText text={t("原子序数")} />
          </span>
          <strong>
            {element.number}
            <small>{t("质子数")}</small>
          </strong>
        </div>
        <div
          className="reading-item"
          style={{ "--read-order": 1 } as CSSProperties}
        >
          <span>
            <StreamText text={t("电子层分布")} />
          </span>
          <strong>{element.shells.join(" · ")}</strong>
        </div>
        <div
          className="reading-item"
          style={{ "--read-order": 2 } as CSSProperties}
        >
          <span>
            <StreamText text={t("最外层电子")} />
          </span>
          <strong>
            {element.shells.at(-1)}
            <small>{t("个")}</small>
          </strong>
        </div>
        <div
          className="reading-item"
          style={{ "--read-order": 3 } as CSSProperties}
        >
          <span>
            <StreamText text={t("标准原子量")} />
          </span>
          <strong className="mass-value">{element.atomicMass}</strong>
          {element.atomicMass === "—" && <small>{t("无标准原子量")}</small>}
        </div>
      </ScrollReveal>
      <div className="explore-notes">
        {story?.facts.map((f) => (
          <ScrollReveal
            key={f.title}
            id={`reading:${element.id}:note:${f.title}`}
            seen={arrivedCards}
            reduced={reduced}
            ready={sceneReady}
          >
            <h2>
              <StreamText text={f.title} delay={50} />
            </h2>
            <p>
              <StreamText text={f.text} delay={100} />
            </p>
          </ScrollReveal>
        ))}
        <ScrollReveal
          key={foundationOnly ? "foundation-sources" : "configuration"}
          id={`reading:${element.id}:${foundationOnly ? "sources" : "configuration"}`}
          seen={arrivedCards}
          reduced={reduced}
          ready={sceneReady}
          className={
            foundationOnly ? "foundation-sources" : "configuration-note"
          }
        >
          {!foundationOnly && (
            <>
              <h2>
                <StreamText text={t("电子构型")} delay={50} />
              </h2>
              <code>{element.electronConfiguration}</code>
              <p>
                <StreamText
                  text={
                    element.electronNote
                      ? t(element.electronNote)
                      : t(
                          "电子层数据按基态中性原子的电子构型统计。外层电子数不直接等于元素的全部化合价。",
                        )
                  }
                  delay={100}
                />
              </p>
            </>
          )}
          <SourceLinks
            ids={[...element.sourceIds, ...(story?.sourceIds ?? [])]}
          />
        </ScrollReveal>
      </div>
    </main>
  );
}
function Reaction({ reaction }: { reaction: Equation }) {
  const { language, t } = useI18n();
  reaction = localizeEquation(reaction, language);
  const rawNotation = equationNotationById[reaction.id];
  const notation = {
    above: rawNotation.above ? t(rawNotation.above) : undefined,
    below: rawNotation.below ? t(rawNotation.below) : undefined,
    context: rawNotation.context ? t(rawNotation.context) : undefined,
  };
  const term = (t: EquationTerm, i: number) => (
    <span className="reaction-term" key={`${t.substanceId}-${i}`}>
      {i > 0 && <span className="plus">+</span>}
      {t.coefficient !== 1 && <span>{t.coefficient}</span>}
      <Formula value={substanceById[t.substanceId].formula} />
      <small>({t.state})</small>
      {t.marker && <span>{t.marker === "gas" ? "↑" : "↓"}</span>}
    </span>
  );
  return (
    <article className="reaction" data-reaction-id={reaction.id}>
      <div className="reaction-title">
        <h3>{reaction.title}</h3>
      </div>
      <div
        className="reaction-formula-scroll"
        role="region"
        tabIndex={0}
        aria-label={t(
          `${reaction.title}的化学方程式，可横向滚动`,
          `${reaction.title}, chemical equation; scroll horizontally if needed`,
        )}
      >
        <div className="reaction-formula">
          <span className="reaction-side">{reaction.reactants.map(term)}</span>
          <span className="equation-relation">
            <span
              className="equation-condition"
              data-position="above"
              aria-label={notation.above === "△" ? t("加热") : undefined}
            >
              {notation.above}
            </span>
            <span
              className="equation-sign"
              data-reversible={reaction.reversible === true}
              aria-label={reaction.reversible ? t("可逆反应") : t("生成")}
            >
              {reaction.reversible ? "⇌" : "="}
            </span>
            <span className="equation-condition" data-position="below">
              {notation.below}
            </span>
          </span>
          <span className="reaction-side">{reaction.products.map(term)}</span>
        </div>
      </div>
      {notation.context && (
        <p className="reaction-context">{notation.context}</p>
      )}
      <p>{reaction.note}</p>
      <SourceLinks ids={reaction.sourceIds} />
    </article>
  );
}
function SubstancePage({
  element,
  substance,
  onBack,
  onHome,
  learningMode,
  fromWorkbench = false,
}: {
  element: Element;
  substance: Substance;
  onBack: () => void;
  onHome: () => void;
  learningMode: LearningMode;
  fromWorkbench?: boolean;
}) {
  const { language, t } = useI18n();
  substance = localizeSubstance(substance, language);
  const visibleEquations = getSubstanceEquations(substance.id, learningMode);
  const isMolecule = substance.structure === "molecular";
  const structureLabels = {
    molecular: t("分子构成"),
    monatomic: t("单原子形式"),
    ionic: t("离子构成"),
    metallic: t("金属晶体"),
    network: t("延展结构"),
  };
  return (
    <main className="substance-page" id="main-content">
      <div className="page-navigation">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />{" "}
          {fromWorkbench
            ? t("返回元素组合")
            : t(`返回${element.name}的探索`, `Back to ${element.englishName}`)}
        </button>
        <div className="breadcrumb">
          <button onClick={onHome}>{t("周期表")}</button>
          <span>/</span>
          <button onClick={onBack}>
            {fromWorkbench ? t("元素组合") : elementName(element, language)}
          </button>
          <span>/</span>
          <span>{substance.name}</span>
        </div>
      </div>
      <div className="substance-layout">
        <section className="substance-portrait">
          <div
            className="substance-art-large"
            style={
              {
                "--card-tint": substance.color,
                viewTransitionName: "substance-picture",
              } as CSSProperties
            }
          >
            <SubstanceArt
              kind={substance.artwork}
              color={substance.color}
              label={substance.name}
            />
          </div>
          <p className="portrait-note">{substance.note}</p>
        </section>
        <section className="substance-info">
          <div className="substance-title-row">
            <div>
              <h1 tabIndex={-1}>{substance.name}</h1>
            </div>
            <span className="hero-formula">
              <Formula value={substance.formula} />
            </span>
          </div>
          <div className="substance-badges">
            <span>
              {substance.kind === "elemental" ? t("单质") : t("化合物")}
            </span>
            <span>{structureLabels[substance.structure]}</span>
          </div>
          <p className="substance-description">{substance.summary}</p>
          <div className="composition">
            <span className="mini-label">
              {isMolecule
                ? t("一个分子的原子组成")
                : substance.structure === "monatomic"
                  ? t("单原子气体的组成元素")
                  : t("化学式中的原子数比")}
            </span>
            <div className="composition-items">
              {Object.entries(substance.composition).map(([id, n], i) => (
                <div className="composition-item" key={id}>
                  {i > 0 && <span className="composition-divider">:</span>}
                  <span
                    className="composition-atom"
                    data-category={elementById[id].category}
                    style={styleFor(elementById[id])}
                  >
                    {elementById[id].symbol}
                  </span>
                  <span>
                    <strong>{n}</strong> {isMolecule ? t("个") : ""}
                    <small>
                      {elementName(elementById[id], language)}{" "}
                      {isMolecule
                        ? t("原子", n === 1 ? "atom" : "atoms")
                        : t("元素")}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            {!isMolecule && (
              <p>
                {substance.structure === "monatomic"
                  ? t("通常以单个原子存在，不是双原子分子。")
                  : t("这里的化学式表示组成比例，不表示一个独立分子。")}
              </p>
            )}
          </div>
          <SourceLinks ids={substance.sourceIds} />
        </section>
      </div>
      <section className="reactions-section">
        <div className="reactions-heading">
          <h2>{t("看看它参与的变化")}</h2>
          <div className="equation-key" aria-label={t("方程式符号说明")}>
            <p>{t("(s) 固体 · (l) 液体 · (g) 气体 · (aq) 水溶液")}</p>
            <p>
              {t("↑ 气体放出 · ↓ 沉淀析出")}
              <span>{t("物态为本站补充")}</span>
            </p>
          </div>
        </div>
        <div className="reactions-list">
          {visibleEquations.map((equation) => (
            <Reaction key={equation.id} reaction={equation} />
          ))}
          {visibleEquations.length === 0 && (
            <p className="reaction-empty">
              {learningMode === "junior" && substance.equationIds.length > 0
                ? t(
                    "当前物质的已收录反应属于高中或拓展内容。切换高中版可查看。",
                  )
                : t(
                    "当前尚无核实后收录的相关方程式。没有合适内容时，我们选择留白。",
                  )}
            </p>
          )}
        </div>
      </section>
      <button className="bottom-back" onClick={onBack}>
        <ArrowLeft size={16} />
        {t(
          `继续探索${element.name}元素`,
          `Keep exploring ${element.englishName}`,
        )}
      </button>
    </main>
  );
}
function ReadingNotes({ onClose }: { onClose: () => void }) {
  const { language, t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="reading-title"
      className="reading-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-header">
        <span className="eyebrow">HOW TO READ THIS ATLAS</span>
        <button aria-label={t("关闭资料与说明")} onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      <h2 id="reading-title">{t("探索，也认真求证。")}</h2>
      <p>
        {t(
          "圆环是电子层的教学示意，并非真实轨迹。物质插画表示宏观形态，不把所有物质画成分子。边界元素的类别可能因资料而异；超重元素按周期表位置分类，不代表其物理化学性质均已实测。",
        )}
      </p>
      <div className="textbook-status">
        <strong>{t("已核读部分教材正文 · 逐条标明范围")}</strong>
        <p>
          {t(
            "九上已核读带 2024 审核标识的公开镜像：p.40、45–46、91–94、118–120。高中必修一已核读带 2019 审核标识的高校 PDF：p.12、37、45–46、92、104、122，具体印次尚待比对。九下尚未核正文。其他内容单列参考资料，未宣称全站教材对齐。",
          )}
        </p>
      </div>
      <h3>{t("操作小提示")}</h3>
      <p>
        {t(
          "默认高中版展示全部已收录知识，包括初中基础与拓展；初中版只展示基础层级。教学分级不等同于指定教材已完成逐条对齐。",
        )}
      </p>
      <p>
        {t(
          "方向键在周期表内移动，Enter 打开元素；Esc 返回上一级。手机可横向滑动周期表。可随时开启“减少动态”。",
        )}
      </p>
      <h3>{t("来源档案")}</h3>
      <div className="source-records">
        {sources.map((source) => {
          const s = localizeSource(source, language);
          return (
            <article key={s.id}>
              <span
                className={`source-kind ${s.verification === "pending" ? "pending" : ""}`}
              >
                {s.kind === "textbook" ? t("教材") : t("参考资料")} ·{" "}
                {s.verification === "pending"
                  ? t("待核正文")
                  : s.verification === "data-read"
                    ? t("已读取数据")
                    : t("已阅读正文")}
              </span>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
                <ExternalLink size={14} />
              </a>
              <p>
                {s.publisher}
                {s.edition ? ` · ${s.edition}` : ""}
                {s.volume ? ` · ${s.volume}` : ""}
                {s.pages ? ` · ${s.pages}` : ""}
              </p>
              <p>{s.note}</p>
            </article>
          );
        })}
      </div>
    </dialog>
  );
}
export default function App() {
  const { language, t, setLanguage } = useI18n();
  const [route, setRoute] = useState<Route>(readRoute);
  const [pendingElementId, setPendingElementId] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState<LearningMode>("senior");
  const [selectedId, setSelectedId] = useState(route.elementId ?? "h");
  const [selectedSubstance, setSelectedSubstance] = useState(
    route.substanceId ?? "water",
  );
  const [category, setCategory] = useState<Category | null>(null);
  const [onlyCommon, setOnlyCommon] = useState(false);
  const [homeSelection, setHomeSelection] = useState<ElementSelection>([]);
  const [isotopeEnabled, setIsotopeEnabled] = useState(false);
  const [knowledgeCollapsed, setKnowledgeCollapsed] = useState<
    Record<string, Set<string>>
  >({});
  const [shells, setShells] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState(false);
  const [sceneReady, setSceneReady] = useState(true);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [manualReduced, setManualReduced] = useState(
    () => localStorage.getItem("elements-reduced-motion") === "true",
  );
  const reduced = systemReduced || manualReduced;
  const reducedMotion = useRef(reduced);
  reducedMotion.current = reduced;
  const currentRoute = useRef(route);
  const locations = useRef<Record<string, LocationSnapshot>>({});
  const transition = useRef<ViewTransition | null>(null);
  const navigation = useRef(0);
  const backPending = useRef(false);
  const homeEntered = useRef(Boolean(route.elementId));
  const arrivedCards = useRef(new Set<string>());
  const sceneFrame = useRef<number | null>(null);
  useEffect(() => {
    if (!history.state?.periodic)
      history.replaceState(
        { periodic: true, index: 0, from: null },
        "",
        location.href,
      );
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
    if (reduced) {
      transition.current?.skipTransition();
      if (sceneFrame.current !== null) cancelAnimationFrame(sceneFrame.current);
      sceneFrame.current = null;
      setSceneReady(true);
    }
  }, [reduced]);
  useEffect(
    () => () => {
      navigation.current += 1;
      transition.current?.skipTransition();
      if (sceneFrame.current !== null) cancelAnimationFrame(sceneFrame.current);
    },
    [],
  );
  const changeRoute = async (next: Route, historyMode?: "push" | "replace") => {
    const index = ++navigation.current;
    setPendingElementId(null);
    const sourceHref = navigationLocation();
    transition.current?.skipTransition();
    if (sceneFrame.current !== null) cancelAnimationFrame(sceneFrame.current);
    sceneFrame.current = null;
    setSceneReady(true);
    // A click on the current destination also cancels a download in progress.
    if (
      routeKey(next) === routeKey(currentRoute.current) &&
      routeKey(next) === routeKey(readRoute())
    )
      return;
    if (
      next.elementId &&
      hasKnowledgeMap(next.elementId) &&
      next.view !== "atom" &&
      !next.substanceId &&
      !isKnowledgePageReady(next.elementId)
    ) {
      // Keep the previous page and URL until both renderer and content are ready.
      // A failed download commits the accessible retry shell instead.
      setPendingElementId(next.elementId);
      try {
        await loadKnowledgePage(next.elementId);
      } catch {
        // LazyKnowledgePage owns the loading error and retry interaction.
      } finally {
        if (index === navigation.current) setPendingElementId(null);
      }
    }
    if (index !== navigation.current || navigationLocation() !== sourceHref)
      return;
    const previous = currentRoute.current;
    locations.current[routeKey(previous)] = {
      x: window.scrollX,
      y: window.scrollY,
      tableX: document.getElementById("table-scroll")?.scrollLeft ?? 0,
      materialsX:
        document.querySelector<HTMLElement>(".related-cards")?.scrollLeft ?? 0,
    };
    const animate =
      !reducedMotion.current &&
      typeof document.startViewTransition === "function";
    flushSync(() => {
      if (next.elementId) setSelectedId(next.elementId);
      if (next.substanceId) setSelectedSubstance(next.substanceId);
    });
    const update = () => {
      if (index !== navigation.current || navigationLocation() !== sourceHref)
        return;
      if (historyMode) {
        const state =
          historyMode === "replace"
            ? {
                periodic: true,
                index: history.state?.index ?? 0,
                from: history.state?.from ?? null,
              }
            : {
                periodic: true,
                index: (history.state?.index ?? 0) + 1,
                from: routeKey(previous),
              };
        if (historyMode === "replace")
          history.replaceState(state, "", `#${routeKey(next)}`);
        else history.pushState(state, "", `#${routeKey(next)}`);
      }
      currentRoute.current = next;
      flushSync(() => {
        setSceneReady(!animate);
        setRoute(next);
      });
      const snapshot = locations.current[routeKey(next)] ?? emptySnapshot;
      window.scrollTo(snapshot.x, snapshot.y);
      const table = document.getElementById("table-scroll");
      if (table) table.scrollLeft = snapshot.tableX;
      const materials = document.querySelector<HTMLElement>(".related-cards");
      if (materials) materials.scrollLeft = snapshot.materialsX;
      const target = !next.elementId
        ? ((previous.substanceId
            ? document.querySelector<HTMLElement>(
                `[data-compound-result="${previous.substanceId}"]`,
              )
            : null) ??
          document.getElementById(`key-${previous.elementId ?? selectedId}`))
        : !next.substanceId && previous.substanceId
          ? document.getElementById(`substance-${previous.substanceId}`)
          : hasKnowledgeMap(previous.elementId ?? "") &&
              previous.view === "atom" &&
              next.elementId === previous.elementId &&
              next.view !== "atom" &&
              !next.substanceId
            ? document.querySelector<HTMLElement>(".km-core-key")
            : document.querySelector<HTMLElement>("main h1");
      (target ?? document.querySelector<HTMLElement>("main h1"))?.focus({
        preventScroll: true,
      });
    };
    if (animate) {
      const activeTransition = document.startViewTransition(update);
      transition.current = activeTransition;
      const revealScene = () => {
        if (index !== navigation.current) return;
        sceneFrame.current = requestAnimationFrame(() => {
          sceneFrame.current = requestAnimationFrame(() => {
            sceneFrame.current = null;
            if (index === navigation.current) setSceneReady(true);
          });
        });
      };
      // The reveal clock starts after the shared snapshots are ready. A skipped
      // transition still commits its route and must leave the scene usable.
      activeTransition.ready.then(revealScene, revealScene);
      activeTransition.finished.then(
        () => {
          if (transition.current === activeTransition)
            transition.current = null;
        },
        () => {
          if (transition.current === activeTransition)
            transition.current = null;
        },
      );
    } else update();
  };
  const navigate = (next: Route, replace = false) => {
    void changeRoute(next, replace ? "replace" : "push");
  };
  const goBack = () => {
    if (backPending.current) return;
    // Browser Back may already have changed the URL while its map is loading.
    const current = readRoute();
    if (!current.elementId) return;
    const parent: Route =
      current.substanceId && history.state?.from === "/"
        ? {}
        : current.substanceId
          ? {
              elementId: current.elementId,
              ...(hasKnowledgeMap(current.elementId)
                ? { view: "atom" as const }
                : {}),
            }
          : hasKnowledgeMap(current.elementId) &&
              current.view === "atom" &&
              history.state?.from === `/element/${current.elementId}`
            ? { elementId: current.elementId }
            : {};
    if (
      history.state?.periodic &&
      history.state.index > 0 &&
      history.state.from === routeKey(parent)
    ) {
      backPending.current = true;
      navigation.current += 1;
      setPendingElementId(null);
      history.back();
    } else navigate(parent, true);
  };
  useEffect(() => {
    const pop = () => {
      void changeRoute(readRoute());
      backPending.current = false;
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || notes) return;
      if (readRoute().elementId) goBack();
      else navigate({});
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("keydown", key);
    };
  });
  const element = route.elementId ? elementById[route.elementId] : null;
  const substance = route.substanceId ? substanceById[route.substanceId] : null;
  const substanceVisible =
    substance && isContentVisible(learningMode, substance.level);
  useEffect(() => {
    // The render guard below prevents flashes of advanced content, including
    // when the browser goes forward or a hash link is opened in junior mode.
    if (substance && !isContentVisible(learningMode, substance.level)) goBack();
  }, [learningMode, route.elementId, route.substanceId]);
  useEffect(() => {
    document.title = route.substanceId
      ? `${localizeSubstance(substanceById[route.substanceId], language).name} · ${t("元素之间")}`
      : element
        ? `${elementName(element, language)} ${element.symbol} · ${t("元素之间")}`
        : t("元素之间 · 互动元素周期表");
  }, [route, element, language]);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>("main h1")?.focus();
        }}
      >
        {t("跳到主要内容")}
      </a>
      <span className="sr-only" role="status" aria-atomic="true">
        {pendingElementId
          ? t(
              `正在加载${elementById[pendingElementId].name}元素知识导图…`,
              `Loading the ${elementById[pendingElementId].englishName} mind map…`,
            )
          : learningMode === "senior"
            ? t("当前为高中版，展示全部已收录知识")
            : t("当前为初中版，展示基础知识")}
      </span>
      <header className="site-header">
        <button
          className="wordmark"
          onClick={() => navigate({})}
          aria-label={t("元素之间，回到周期表")}
        >
          <span className="brand-mark">
            <span>e</span>
            <i />
          </span>
          <span>
            {t("元素之间")}
            <small>THE ELEMENT ATLAS</small>
          </span>
        </button>
        <div
          className="learning-switch"
          role="group"
          aria-label={t("教学版本")}
        >
          <span
            className="learning-switch-indicator"
            aria-hidden="true"
            data-mode={learningMode}
          />
          {(["junior", "senior"] as const).map((mode) => (
            <button
              key={mode}
              aria-label={mode === "junior" ? t("初中版") : t("高中版")}
              aria-pressed={learningMode === mode}
              onClick={() => setLearningMode(mode)}
              title={
                mode === "junior"
                  ? t("初中版：基础知识")
                  : t("高中版：包括初中、高中和拓展的全部已收录知识")
              }
            >
              {mode === "junior" ? t("初中版") : t("高中版")}
            </button>
          ))}
        </div>
        <div className="header-right">
          <div
            className="language-switch"
            role="group"
            aria-label={t("界面语言", "Interface language")}
          >
            <button
              type="button"
              lang="zh-CN"
              aria-pressed={language === "zh"}
              onClick={() => setLanguage("zh")}
            >
              中文
            </button>
            <button
              type="button"
              lang="en"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
          </div>
          <span className="header-caption">{t("一场关于万物的微小探索")}</span>
          <button
            className="motion-toggle"
            aria-label={t("减少动态")}
            aria-pressed={reduced}
            onClick={() => {
              const next = !manualReduced;
              setManualReduced(next);
              localStorage.setItem("elements-reduced-motion", String(next));
            }}
            title={
              systemReduced ? t("已遵循系统减少动态设置") : t("切换减少动态")
            }
          >
            {reduced ? <Check size={15} /> : <Sparkles size={15} />}
            <span>{t("减少动态")}</span>
          </button>
          <button className="reading-button" onClick={() => setNotes(true)}>
            {t("资料与说明")}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </header>
      {!element ? (
        <PeriodicTable
          onOpen={(id) => navigate({ elementId: id })}
          selectedId={selectedId}
          pendingElementId={pendingElementId}
          category={category}
          setCategory={setCategory}
          onlyCommon={onlyCommon}
          setOnlyCommon={setOnlyCommon}
          reduced={reduced}
          homeEntered={homeEntered}
          learningMode={learningMode}
          selection={homeSelection}
          onSelectionChange={setHomeSelection}
          isotopeEnabled={isotopeEnabled}
          onIsotopeChange={setIsotopeEnabled}
          onCompoundOpen={(substanceId, elementId) =>
            navigate({ elementId, substanceId })
          }
        />
      ) : hasKnowledgeMap(element.id) &&
        route.view !== "atom" &&
        !route.substanceId ? (
        <LazyKnowledgePage
          key={element.id}
          element={element}
          learningMode={learningMode}
          reduced={reduced}
          sceneReady={sceneReady}
          collapsed={knowledgeCollapsed[element.id] ?? emptyCollapsed}
          onCollapsedChange={(next) =>
            setKnowledgeCollapsed((old) => ({ ...old, [element.id]: next }))
          }
          onBack={goBack}
          onOriginal={() => navigate({ elementId: element.id, view: "atom" })}
        />
      ) : substanceVisible ? (
        <SubstancePage
          element={element}
          substance={substance}
          onBack={goBack}
          onHome={() => navigate({})}
          learningMode={learningMode}
          fromWorkbench={history.state?.from === "/"}
        />
      ) : (
        <ElementPage
          key={element.id}
          element={element}
          onBack={goBack}
          backToKnowledge={
            hasKnowledgeMap(element.id) &&
            route.view === "atom" &&
            history.state?.from === `/element/${element.id}`
          }
          onChange={(id) => navigate({ elementId: id, view: "atom" }, true)}
          onSubstance={(id) =>
            navigate({ elementId: element.id, substanceId: id })
          }
          selectedSubstance={selectedSubstance}
          shell={shells[element.id] ?? element.shells.length - 1}
          onShell={(n) => setShells((old) => ({ ...old, [element.id]: n }))}
          reduced={reduced}
          sceneReady={sceneReady}
          arrivedCards={arrivedCards.current}
          learningMode={learningMode}
        />
      )}
      {!route.elementId && (
        <footer className="site-footer">
          <span>
            {t("元素之间")}
            <span className="footer-separator">/</span>{" "}
            {t("从微观，认识世界。")}
          </span>
          <button onClick={() => setNotes(true)}>
            {t("以可靠资料为起点，教材对齐状态见说明")}
            <ArrowUpRight size={13} />
          </button>
        </footer>
      )}
      {notes && <ReadingNotes onClose={() => setNotes(false)} />}
      {(!import.meta.env.PROD ||
        Boolean(import.meta.env.VITE_FEEDBACK_API_URL?.trim())) && (
        <FeedbackWidget learningMode={learningMode} reduced={reduced} />
      )}
    </>
  );
}

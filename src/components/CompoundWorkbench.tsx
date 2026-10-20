import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { categories, elementById, substanceById } from "../data/catalog";
import type { DiscoveredCompound } from "../data/compound-discovery";
import {
  getLoadedCompoundDiscovery,
  loadCompoundDiscovery,
} from "../data/compound-discovery-loader";
import type { Element } from "../data/types";
import { elementName, useI18n } from "../i18n";
import { compoundDisplayName } from "../i18n/exploration-en";
import { CompoundFormula } from "./CompoundFormula";
import { CompoundReferenceDetail } from "./CompoundReferenceDetail";
import "../compound-workbench.css";

export type ElementSelection = string[];

export interface CompoundWorkbenchProps {
  selection: ElementSelection;
  onSelectionChange: (selection: ElementSelection) => void;
  pickingSlot: number | null;
  onPickSlot: (slot: number | null) => void;
  dragOver: boolean;
  activeDropSlot: number | null;
  draggingElementId: string | null;
  onElementPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    elementId: string,
    index: number,
  ) => void;
  consumeElementClick: (detail: number, elementId: string) => boolean;
  reduced: boolean;
  learningMode: "junior" | "senior";
  onOpen: (substanceId: string, elementId: string) => void;
}

function ElementKeyCopy({ element }: { element: Element }) {
  const { language } = useI18n();
  const style = {
    "--key-color": categories[element.category].color,
    "--key-ink": categories[element.category].ink,
  } as CSSProperties;
  return (
    <span
      className="key-face compound-workbench__key-face"
      data-category={element.category}
      style={style}
      aria-hidden="true"
    >
      <span className="atomic-number">
        {element.number.toString().padStart(2, "0")}
      </span>
      <span className="element-symbol">{element.symbol}</span>
      <span className="element-name">{elementName(element, language)}</span>
    </span>
  );
}

/** The material belongs to the plus itself; there is no rectangular backing. */
function SculptedPlus() {
  const paint = `compound-plus-${useId().replace(/:/g, "")}`;
  const outline =
    "M26 7Q26 4 29 4H39Q42 4 42 7V23Q42 25 44 25H60Q63 25 63 28V38Q63 41 60 41H44Q42 41 42 43V59Q42 62 39 62H29Q26 62 26 59V43Q26 41 24 41H8Q5 41 5 38V28Q5 25 8 25H24Q26 25 26 23Z";
  return (
    <svg
      className="compound-workbench__plus-art"
      viewBox="0 0 68 72"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={paint} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#d3ddcc" />
          <stop offset="0.5" stopColor="#b4c2b0" />
          <stop offset="1" stopColor="#8c9e8e" />
        </linearGradient>
      </defs>
      <path
        d={outline}
        transform="translate(0 5)"
        fill="#4a5d50"
        stroke="#3a4b40"
        strokeWidth="1.3"
      />
      <path
        d={outline}
        fill={`url(#${paint})`}
        stroke="#e3ead5"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ElementSlot({
  index,
  elementId,
  picking,
  activeDrop,
  dragging,
  onPickSlot,
  onRemove,
  onPointerDown,
  consumeClick,
}: {
  index: number;
  elementId: string;
  picking: boolean;
  activeDrop: boolean;
  dragging: boolean;
  onPickSlot: (slot: number | null) => void;
  onRemove: () => void;
  onPointerDown: CompoundWorkbenchProps["onElementPointerDown"];
  consumeClick: CompoundWorkbenchProps["consumeElementClick"];
}) {
  const { language, t } = useI18n();
  const element = elementById[elementId];
  if (!element) return null;
  return (
    <span
      className="compound-workbench__slot-wrap"
      data-active-drop={activeDrop}
      data-dragging={dragging}
    >
      <button
        type="button"
        className="compound-workbench__slot"
        data-compound-slot={index}
        data-filled="true"
        aria-label={t(`替换${element.name}`, `Replace ${elementName(element, language)}`)}
        aria-pressed={picking}
        title={t(`${element.name} · 拖出移除`, `${elementName(element, language)} · drag out to remove`)}
        onPointerDown={(event) => onPointerDown(event, elementId, index)}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            onRemove();
          }
        }}
        onClick={(event) => {
          if (!consumeClick(event.detail, elementId))
            onPickSlot(picking ? null : index);
        }}
      >
        <ElementKeyCopy element={element} />
      </button>
      <button
        className="compound-workbench__remove"
        type="button"
        aria-label={t(`移除${element.name}`, `Remove ${elementName(element, language)}`)}
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  );
}

/** Reveal only newly encountered cards in this scrollport, without replay on scroll-back. */
function DiscoveryResults({
  results,
  selectionKey,
  reduced,
  onOpen,
}: {
  results: DiscoveredCompound[];
  selectionKey: string;
  reduced: boolean;
  onOpen: (
    event: MouseEvent<HTMLButtonElement>,
    result: DiscoveredCompound,
  ) => void;
}) {
  const { language, t } = useI18n();
  const list = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  const previous = useRef(new Map<string, { x: number; y: number }>());
  const lastSelection = useRef(selectionKey);
  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    if (lastSelection.current !== selectionKey) root.scrollTop = 0;
    lastSelection.current = selectionKey;
    const cells = [
      ...root.querySelectorAll<HTMLElement>("[data-discovery-cell]"),
    ];
    const animations: Animation[] = [];
    const ease =
      getComputedStyle(root).getPropertyValue("--scene-ease").trim() ||
      "cubic-bezier(0.23, 1, 0.32, 1)";
    const positions = new Map<string, { x: number; y: number }>();
    for (const cell of cells) {
      const id = cell.dataset.discoveryCell!;
      const position = { x: cell.offsetLeft, y: cell.offsetTop };
      positions.set(id, position);
      const before = previous.current.get(id);
      if (seen.current.has(id)) {
        cell.dataset.revealed = "true";
        if (
          !reduced &&
          before &&
          (before.x !== position.x || before.y !== position.y)
        ) {
          animations.push(
            cell.animate(
              [
                {
                  transform: `translate(${before.x - position.x}px, ${before.y - position.y}px)`,
                },
                { transform: "translate(0, 0)" },
              ],
              { duration: 220, easing: ease },
            ),
          );
        }
      }
    }
    previous.current = positions;
    const reveal = (cell: HTMLElement, delay = 0, immediate = false) => {
      const id = cell.dataset.discoveryCell!;
      if (seen.current.has(id)) return;
      seen.current.add(id);
      cell.dataset.revealed = "true";
      if (!reduced && !immediate)
        animations.push(
          cell.animate(
            [
              { opacity: 0, transform: "translate(-12px, 9px) scale(0.94)" },
              { opacity: 1, transform: "translate(0, 0) scale(1)" },
            ],
            { duration: 240, delay, easing: ease, fill: "backwards" },
          ),
        );
    };
    const revealFocused = (event: FocusEvent) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-discovery-cell]",
      );
      if (cell) {
        for (const animation of cell.getAnimations()) animation.cancel();
        reveal(cell, 0, true);
      }
    };
    root.addEventListener("focusin", revealFocused);
    let observer: IntersectionObserver | undefined;
    if (reduced || !("IntersectionObserver" in window))
      cells.forEach((cell) => reveal(cell, 0, true));
    else {
      observer = new IntersectionObserver(
        (entries) => {
          let order = 0;
          for (const entry of entries)
            if (entry.isIntersecting) {
              reveal(entry.target as HTMLElement, Math.min(order++ * 30, 360));
              observer?.unobserve(entry.target);
            }
        },
        { root, threshold: 0.12 },
      );
      for (const cell of cells)
        if (!seen.current.has(cell.dataset.discoveryCell!))
          observer.observe(cell);
    }
    return () => {
      observer?.disconnect();
      root.removeEventListener("focusin", revealFocused);
      animations.forEach((animation) => animation.cancel());
    };
  }, [results, selectionKey, reduced]);

  return (
    <div
      ref={list}
      className="compound-workbench__result-list"
      role="region"
      aria-label={t(
        `已收录的化合物化学式，共${results.length}种`,
        `${results.length} catalogued compound formulas`,
      )}
      tabIndex={0}
    >
      {results.map((result) => {
        const canOpen =
          result.detailAvailable &&
          Boolean(result.catalogId || result.reference);
        const localizedName = result.reference
          ? compoundDisplayName(result.reference, language)
          : result.catalogId
            ? substanceById[result.catalogId]?.englishName ?? `${result.formula} compound`
            : language === "en"
              ? `${result.formula} compound`
              : result.name;
        return (
          <div
            key={result.id}
            className="compound-workbench__result-cell"
            data-discovery-cell={result.id}
            data-revealed={reduced || seen.current.has(result.id)}
          >
            <button
              type="button"
              className="compound-workbench__result-card"
              data-compound-result={result.id}
              title={language === "en" ? localizedName : result.name}
              aria-label={t(
                `${result.name}，${result.formula}${canOpen ? "；点击查看名称解释" : "；暂无介绍"}`,
                `${localizedName}, ${result.formula}${canOpen ? "; click to read the naming note" : "; no description available"}`,
              )}
              aria-disabled={!canOpen}
              onClick={(event) => {
                if (canOpen) onOpen(event, result);
              }}
            >
              <CompoundFormula value={result.formula} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function CompoundWorkbench({
  selection,
  onSelectionChange,
  pickingSlot,
  onPickSlot,
  dragOver,
  activeDropSlot,
  draggingElementId,
  onElementPointerDown,
  consumeElementClick,
  reduced,
  learningMode,
  onOpen,
}: CompoundWorkbenchProps) {
  const { t } = useI18n();
  const prompt = useRef<HTMLButtonElement>(null);
  const modalTrigger = useRef<HTMLButtonElement | null>(null);
  const hadSelection = useRef(selection.length > 0);
  const [activeReference, setActiveReference] =
    useState<DiscoveredCompound | null>(null);
  const [discoveryData, setDiscoveryData] = useState(
    getLoadedCompoundDiscovery,
  );
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const selectedKey = selection.join(":");
  const results = useMemo(
    () => discoveryData?.findCompounds(selection, learningMode) ?? [],
    [discoveryData, selectedKey, learningMode],
  );
  const empty = selection.length === 0;
  const sourceIds = activeReference?.reference?.sourceIds ?? [];
  const referenceSources = useMemo(() => {
    const wanted = new Set(sourceIds);
    return (
      discoveryData?.discoveryReferenceSources.filter((source) =>
        wanted.has(source.id),
      ) ?? []
    );
  }, [discoveryData, sourceIds.join(":")]);
  const previewAddition =
    dragOver &&
    Boolean(draggingElementId && !selection.includes(draggingElementId)) &&
    (activeDropSlot === null || activeDropSlot === selection.length);

  useEffect(() => {
    if (empty || discoveryData) return;
    let current = true;
    setLoadError(false);
    void loadCompoundDiscovery().then(
      (data) => {
        if (current) setDiscoveryData(data);
      },
      () => {
        if (current) setLoadError(true);
      },
    );
    return () => {
      current = false;
    };
  }, [empty, discoveryData, loadAttempt]);
  useEffect(() => {
    if (empty && hadSelection.current)
      requestAnimationFrame(() =>
        prompt.current?.focus({ preventScroll: true }),
      );
    hadSelection.current = !empty;
  }, [empty]);

  const removeAt = (index: number) => {
    const next = selection.filter((_, itemIndex) => itemIndex !== index);
    onSelectionChange(next);
    onPickSlot(null);
    if (next.length)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(
            `[data-compound-slot="${Math.min(index, next.length - 1)}"]`,
          )
          ?.focus({ preventScroll: true }),
      );
  };
  const openResult = (
    event: MouseEvent<HTMLButtonElement>,
    result: DiscoveredCompound,
  ) => {
    if (result.catalogId) {
      if (selection[0]) onOpen(result.catalogId, selection[0]);
    } else if (result.reference) {
      modalTrigger.current = event.currentTarget;
      setActiveReference(result);
    }
  };
  const closeReference = () => {
    setActiveReference(null);
    requestAnimationFrame(() =>
      modalTrigger.current?.focus({ preventScroll: true }),
    );
  };

  return (
    <section
      className="compound-workbench"
      data-compound-zone
      data-drag-over={dragOver}
      data-learning-mode={learningMode}
      data-reduced={reduced}
      data-empty={empty}
      aria-label={t("化合物探索", "Compound exploration")}
      onClick={(event) => {
        if (
          empty ||
          (event.target as HTMLElement).closest(
            "button, dialog, .compound-workbench__result-list",
          )
        )
          return;
        if (!consumeElementClick(event.detail, draggingElementId ?? ""))
          onPickSlot(selection.length);
      }}
    >
      {empty ? (
        <button
          ref={prompt}
          type="button"
          className="compound-workbench__drop-prompt"
          data-compound-slot={0}
          aria-pressed={pickingSlot === 0}
          onClick={() => onPickSlot(pickingSlot === 0 ? null : 0)}
        >
          {t("把元素拖到这里，探索化合物", "Drag an element here to explore compounds")}
        </button>
      ) : (
        <div
          className="compound-workbench__main"
          data-selection-count={selection.length}
          data-multiple={selection.length > 1}
          data-preview-addition={previewAddition}
        >
          <div className="compound-workbench__selection-row">
            <div
              className="compound-workbench__selection"
              role="group"
              aria-label={t("已选择的元素，拖出可移除，点击可替换", "Selected elements. Drag one out to remove it, or click to replace it.")}
            >
              {selection.map((elementId, index) => (
                <span
                  className="compound-workbench__selection-part"
                  key={elementId}
                >
                  {index > 0 && (
                    <span
                      className="compound-workbench__plus"
                      data-compound-plus="joined"
                    >
                      <SculptedPlus />
                    </span>
                  )}
                  <ElementSlot
                    index={index}
                    elementId={elementId}
                    picking={pickingSlot === index}
                    activeDrop={dragOver && activeDropSlot === index}
                    dragging={draggingElementId === elementId}
                    onPickSlot={onPickSlot}
                    onRemove={() => removeAt(index)}
                    onPointerDown={onElementPointerDown}
                    consumeClick={consumeElementClick}
                  />
                </span>
              ))}
              <button
                type="button"
                className="compound-workbench__append"
                data-compound-slot={selection.length}
                data-preview={
                  previewAddition || pickingSlot === selection.length
                }
                aria-label={t("选择下一种元素", "Choose another element")}
                aria-pressed={pickingSlot === selection.length}
                onClick={() =>
                  onPickSlot(
                    pickingSlot === selection.length ? null : selection.length,
                  )
                }
              >
                <span
                  className="compound-workbench__plus"
                  data-compound-plus="preview"
                >
                  <SculptedPlus />
                </span>
              </button>
            </div>
          </div>
          <div
            className="compound-workbench__results"
            aria-busy={!discoveryData && !loadError}
          >
            <p className="sr-only" role="status">
              {discoveryData
                ? t(`找到${results.length}种已收录的无机化合物`, `Found ${results.length} catalogued inorganic compounds`)
                : t("正在查找化合物", "Searching compounds")}
            </p>
            {!discoveryData ? (
              loadError ? (
                <div className="compound-workbench__empty" role="alert">
                  <p>{t("化合物资料暂时无法加载", "Compound data could not be loaded")}</p>
                  <button
                    type="button"
                    className="compound-workbench__retry"
                    onClick={() => {
                      setLoadError(false);
                      setLoadAttempt((attempt) => attempt + 1);
                    }}
                  >
                    {t("重试", "Retry")}
                  </button>
                  {loadAttempt > 0 && (
                    <button
                      type="button"
                      className="compound-workbench__retry"
                      onClick={() => location.reload()}
                    >
                      {t("重新载入页面", "Reload page")}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="compound-workbench__loading"
                  role="status"
                  aria-label={t("正在查找化合物", "Searching compounds")}
                >
                  <span />
                  <span />
                  <span />
                </div>
              )
            ) : results.length ? (
              <DiscoveryResults
                results={results}
                selectionKey={`${selectedKey}:${learningMode}`}
                reduced={reduced}
                onOpen={openResult}
              />
            ) : (
              <p className="compound-workbench__empty" role="status">
                {t("暂未收录这组组成", "This composition is not in the current index")}
              </p>
            )}
          </div>
        </div>
      )}
      {activeReference?.reference && (
        <CompoundReferenceDetail
          reference={activeReference.reference}
          sources={referenceSources}
          reduced={reduced}
          onClose={closeReference}
        />
      )}
    </section>
  );
}

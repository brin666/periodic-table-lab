import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { elementById } from "../data/catalog";
import { elementName, useI18n } from "../i18n";
import {
  isotopeDisplayName,
  isotopeSourceCopy,
  isotopeSummary,
} from "../i18n/exploration-en";
import {
  isotopesByElement,
  isotopeSources,
  teachingIsotopes,
  nuclideDatasetInfo,
  type TeachingIsotope,
} from "../data/isotopes";
import "../isotope-library.css";
import { IsotopeViewport } from "./IsotopeViewport";

export type IsotopeAnchor = { elementId: string; trigger: HTMLButtonElement };
type IsotopePanel =
  | { mode: "list" }
  | { mode: "detail"; nuclide: TeachingIsotope; fromList: boolean }
  | null;

function stabilityLabel(nuclide: TeachingIsotope, language: "zh" | "en") {
  if (language === "en") {
    if (nuclide.stability === "stable") return "Stable (stbl)";
    if (nuclide.stability === "radioactive") return "Radioactive";
    return "Unclassified";
  }
  if (nuclide.stability === "stable") return "稳定核素";
  if (nuclide.stability === "radioactive") return "放射性核素";
  return "稳定性未分类";
}

function orderedNuclides(nuclides: TeachingIsotope[]) {
  const teachingIds = new Set(teachingIsotopes.map((nuclide) => nuclide.id));
  return [...nuclides]
    .sort((a, b) => {
      const priority = (nuclide: TeachingIsotope) =>
        teachingIds.has(nuclide.id)
          ? 0
          : nuclide.stability === "stable"
            ? 1
            : 2;
      return priority(a) - priority(b) || a.massNumber - b.massNumber;
    });
}

export function IsotopeExplorer({
  anchor,
  onClose,
  onKeep,
  onPanelOpenChange,
  onExplore,
  onElementPointerDown,
  reduced,
}: {
  anchor: IsotopeAnchor;
  onClose: () => void;
  onKeep: () => void;
  onPanelOpenChange: (open: boolean) => void;
  onExplore: (id: string, detail: number) => void;
  onElementPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    id: string,
  ) => void;
  reduced: boolean;
}) {
  const element = elementById[anchor.elementId];
  const { language, t } = useI18n();
  const localizedElementName = elementName(element, language);
  const localizedIsotopeName = (nuclide: TeachingIsotope) =>
    isotopeDisplayName(nuclide, language, localizedElementName);
  const nuclides = isotopesByElement[element.id] ?? [];
  const ordered = orderedNuclides(nuclides);
  const [panel, setPanel] = useState<IsotopePanel>(null);
  const [massFilter, setMassFilter] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const listScroll = useRef(0);
  const listFocus = useRef<string | null>(null);
  const [keyboardOpened] = useState(() =>
    anchor.trigger.matches(":focus-visible"),
  );
  const rect = anchor.trigger.getBoundingClientRect();
  const size = Math.min(328, window.innerWidth - 16, window.innerHeight - 122);
  const height = size + 82;
  const centerX = Math.max(
    size / 2 + 8,
    Math.min(window.innerWidth - size / 2 - 8, rect.x + rect.width / 2),
  );
  const centerY = Math.max(
    height / 2 + 8,
    Math.min(window.innerHeight - height / 2 - 8, rect.y + rect.height / 2),
  );
  const matchingNuclides = nuclides.filter((nuclide) =>
    String(nuclide.massNumber).includes(massFilter),
  );
  const selected = panel?.mode === "detail" ? panel.nuclide : null;
  const panelOpen = panel !== null;

  // The menu has no painted backing. Let only its surrounding table cells
  // recede, and restore their exact previous state when this menu goes away.
  useLayoutEffect(() => {
    const bounds = menu.current?.getBoundingClientRect();
    if (!bounds) return;
    const changed: Array<{
      node: HTMLElement;
      marker: string | null;
      value: string;
      priority: string;
    }> = [];
    const context = document.querySelectorAll<HTMLElement>(
      ".table-page .element-key, .table-page .home-workbench, .table-page .series-placeholder, .table-page .series-label, .table-page .group-number, .table-page .period-number",
    );
    for (const node of context) {
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const gap = Math.max(
        bounds.left - box.right,
        box.left - bounds.right,
        bounds.top - box.bottom,
        box.top - bounds.bottom,
        0,
      );
      if (gap > 38 && node !== anchor.trigger) continue;
      const opacity = node === anchor.trigger ? 0 : gap === 0 ? 0.16 : 0.52;
      changed.push({
        node,
        marker: node.getAttribute("data-isotope-muted"),
        value: node.style.getPropertyValue("--isotope-muted-opacity"),
        priority: node.style.getPropertyPriority("--isotope-muted-opacity"),
      });
      // A previous menu may still be fading this cell back in. Read the
      // transition's target rather than freezing its intermediate opacity.
      const opacityTransition = node
        .getAnimations()
        .find(
          (animation) =>
            "transitionProperty" in animation &&
            animation.transitionProperty === "opacity",
        );
      const targetOpacity =
        opacityTransition?.effect instanceof KeyframeEffect
          ? opacityTransition.effect.getKeyframes().at(-1)?.opacity
          : undefined;
      const restingOpacity = Number(
        targetOpacity ?? getComputedStyle(node).opacity,
      );
      node.style.setProperty(
        "--isotope-muted-opacity",
        String(Math.min(restingOpacity, opacity)),
      );
      node.setAttribute("data-isotope-muted", "true");
    }
    return () => {
      for (const { node, marker, value, priority } of changed) {
        if (marker === null) node.removeAttribute("data-isotope-muted");
        else node.setAttribute("data-isotope-muted", marker);
        if (value)
          node.style.setProperty("--isotope-muted-opacity", value, priority);
        else node.style.removeProperty("--isotope-muted-opacity");
      }
    };
  }, [anchor]);

  useLayoutEffect(() => {
    onPanelOpenChange(panelOpen);
    return () => onPanelOpenChange(false);
  }, [panelOpen, onPanelOpenChange]);

  useEffect(() => {
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !dialog.current?.open) {
        onClose();
        anchor.trigger.focus({ preventScroll: true });
      }
    };
    const away = (event: globalThis.PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !dialog.current?.open
      )
        onClose();
    };
    const reposition = (event: Event) => {
      if (
        !dialog.current?.open &&
        !(event.target instanceof Node && menu.current?.contains(event.target))
      ) onClose();
    };
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", away);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [anchor, onClose]);

  useLayoutEffect(() => {
    if (!panel || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    dialog.current.scrollTop = 0;
    if (panel.mode === "detail")
      detailTitle.current?.focus({ preventScroll: true });
    else if (list.current) {
      list.current.scrollTop = listScroll.current;
      if (listFocus.current)
        list.current
          .querySelector<HTMLButtonElement>(
            `[data-isotope-row="${listFocus.current}"]`,
          )
          ?.focus({ preventScroll: true });
    }
  }, [panel]);

  const closeDialog = () => {
    dialog.current?.close();
    setPanel(null);
    requestAnimationFrame(() => {
      const target = restore.current?.isConnected
        ? restore.current
        : anchor.trigger;
      target.focus({ preventScroll: true });
    });
  };
  const openList = (trigger: HTMLButtonElement) => {
    onKeep();
    restore.current = trigger;
    setPanel({ mode: "list" });
  };
  const openDetail = (nuclide: TeachingIsotope, trigger: HTMLButtonElement) => {
    onKeep();
    restore.current = trigger;
    setPanel({ mode: "detail", nuclide, fromList: false });
  };

  return createPortal(
    <>
      <div
        ref={menu}
        className="isotope-halo isotope-halo--library"
        data-isotope-halo
        data-reduced={reduced}
        data-no-motion={reduced || keyboardOpened}
        data-category={element.category}
        role="group"
        aria-label={t(
          `${element.name}同位素，已收录${nuclides.length}种基态核素`,
          `${localizedElementName} isotopes, ${nuclides.length} ground-state nuclides catalogued`,
        )}
        style={
          {
            left: centerX,
            top: centerY,
            width: size,
            height,
            "--isotope-orbit-size": `${size}px`,
          } as CSSProperties
        }
        onPointerEnter={onKeep}
        onFocus={onKeep}
      >
        <div className="isotope-halo__caption">
          {t(`${element.name}的同位素`, `Isotopes of ${localizedElementName}`)}
          <span className="sr-only">
            {" "}
            {t(
              `· 共 ${nuclides.length} 种，视窗内向外延伸`,
              `· ${nuclides.length} total; the viewport extends outward`,
            )}
          </span>
        </div>
        <IsotopeViewport
          nuclides={ordered}
          size={size}
          symbol={element.symbol}
          name={localizedElementName}
          reduced={reduced}
          paused={panelOpen}
          onExplore={(detail) => onExplore(element.id, detail)}
          onElementPointerDown={(event) => onElementPointerDown(event, element.id)}
          onOpenNuclide={openDetail}
        />
        {nuclides.length > 6 && (
          <span className="isotope-viewport__hint">
            {t("移向边缘探索 · 可滚动", "Move toward the edges to explore · scrollable")}
          </span>
        )}
        {nuclides.length > 0 && (
          <button
            className="isotope-halo__all"
            onClick={(event) => openList(event.currentTarget)}
          >
            {t(`全部 ${nuclides.length} 种核素`, `All ${nuclides.length} nuclides`)} <ArrowRight size={13} />
          </button>
        )}
        <p className="isotope-halo__note">
          {t("基态核素 · 环形排列仅用于选项展示", "Ground-state nuclides · the circular layout is only for browsing")} · {nuclideDatasetInfo.version}
        </p>
      </div>
      {panel && (
        <dialog
          ref={dialog}
          className="isotope-dialog isotope-library"
          data-reduced={reduced}
          data-isotope-view={panel.mode}
          aria-labelledby="isotope-title"
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <button
            className="isotope-dialog__close"
            aria-label={t("关闭同位素知识", "Close isotope information")}
            onClick={closeDialog}
          >
            <X size={20} />
          </button>
          {panel.mode === "list" ? (
            <>
              <p className="isotope-dialog__eyebrow">
                {t("基态核素", "Ground-state nuclides")} · {nuclideDatasetInfo.version}
              </p>
              <h2 id="isotope-title">
                {t(`${element.name}的核素`, `Nuclides of ${localizedElementName}`)}{" "}
                <small>
                  {element.symbol} · Z = {element.number}
                </small>
              </h2>
              <p className="isotope-library__intro">
                {t(
                  `按质量数排列，共 ${nuclides.length} 种。稳定性按该版评价分类。`,
                  `${nuclides.length} records, ordered by mass number. Stability follows this edition's evaluation.`,
                )}
              </p>
              <label className="isotope-library__filter">
                <span>{t("筛选质量数", "Filter by mass number")}</span>
                <input
                  type="search"
                  inputMode="numeric"
                  placeholder={t("输入质量数", "Enter a mass number")}
                  value={massFilter}
                  onChange={(event) => {
                    setMassFilter(event.target.value.replace(/\D/g, ""));
                    listScroll.current = 0;
                    listFocus.current = null;
                    if (list.current) list.current.scrollTop = 0;
                  }}
                />
              </label>
              <p className="isotope-library__count" role="status">
                {t(
                  `显示 ${matchingNuclides.length} / ${nuclides.length} 种`,
                  `Showing ${matchingNuclides.length} of ${nuclides.length}`,
                )}
              </p>
              <div className="isotope-library__columns" aria-hidden="true">
                <span>{t("质量数 A", "Mass number A")}</span>
                <span>{t("核素", "Nuclide")}</span>
                <span>{t("评价分类", "Evaluation")}</span>
              </div>
              <div
                className="isotope-library__rows"
                ref={list}
                onScroll={(event) => {
                  listScroll.current = event.currentTarget.scrollTop;
                }}
              >
                {matchingNuclides.map((nuclide) => (
                  <button
                    className="isotope-library__row"
                    key={nuclide.id}
                    data-isotope-row={nuclide.id}
                    aria-label={t(
                      `${nuclide.name}，${stabilityLabel(nuclide, language)}${nuclide.recordStatus === "existence-uncertain" ? "，存在性待确认" : ""}，查看详情`,
                      `${localizedIsotopeName(nuclide)}, ${stabilityLabel(nuclide, language)}${nuclide.recordStatus === "existence-uncertain" ? ", existence uncertain" : ""}; view details`,
                    )}
                    onClick={() => {
                      listFocus.current = nuclide.id;
                      setPanel({ mode: "detail", nuclide, fromList: true });
                    }}
                  >
                    <span className="isotope-library__mass">
                      {nuclide.massNumber}
                    </span>
                    <span className="isotope-library__nuclide">
                      <span>
                        <sup>{nuclide.massNumber}</sup>
                        {element.symbol}
                      </span>
                      {nuclide.recordStatus === "existence-uncertain" && (
                        <small>{t("存在性待确认", "Existence uncertain")}</small>
                      )}
                    </span>
                    <span
                      className="isotope-library__classification"
                      data-stability={nuclide.stability}
                    >
                      {stabilityLabel(nuclide, language)}
                    </span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                ))}
                {!matchingNuclides.length && (
                  <p className="isotope-library__empty">
                    {t("没有匹配的质量数", "No mass numbers match this filter")}
                  </p>
                )}
              </div>
              <p className="isotope-library__scope">
                {t(
                  "本版基态评价索引，含估算条目及存在性待确认的记录；不含核同质异能态，不代表实时已发现核素全集。",
                  "This edition's ground-state index includes estimated entries and a record marked existence-uncertain. It excludes nuclear isomeric states and is not a live census of discovered nuclides.",
                )}
              </p>
            </>
          ) : (
            selected && (
              <>
                {panel.fromList && (
                  <button
                    className="isotope-library__back"
                    onClick={() => setPanel({ mode: "list" })}
                  >
                    <ArrowLeft size={14} />
                    {t("返回核素列表", "Back to nuclide list")}
                  </button>
                )}
                <div
                  className="isotope-dialog__symbol"
                  data-category={element.category}
                >
                  <sup>{selected.massNumber}</sup>
                  <span>{element.symbol}</span>
                  <sub>{element.number}</sub>
                </div>
                <p className="isotope-dialog__eyebrow">
                  {t("同一种元素，不同的中子数", "Same element, different neutron counts")}
                </p>
                <h2 id="isotope-title" ref={detailTitle} tabIndex={-1}>
                  {localizedIsotopeName(selected)}{" "}
                  <small>
                    {localizedElementName}-{selected.massNumber}
                  </small>
                </h2>
                <div className="isotope-facts">
                  <div>
                    <span>{t("质子数 Z", "Protons Z")}</span>
                    <strong>{element.number}</strong>
                  </div>
                  <div>
                    <span>{t("中子数 N", "Neutrons N")}</span>
                    <strong>{selected.massNumber - element.number}</strong>
                  </div>
                  <div>
                    <span>{t("质量数 A", "Mass number A")}</span>
                    <strong>{selected.massNumber}</strong>
                  </div>
                </div>
                <span
                  className="isotope-stability"
                  data-stability={selected.stability}
                >
                  {stabilityLabel(selected, language)}
                </span>
                {selected.recordStatus === "existence-uncertain" && (
                  <span className="isotope-library__uncertain">
                    {t("存在性待确认 · EU", "Existence uncertain · EU")}
                  </span>
                )}
                <p className="isotope-summary">
                  {isotopeSummary(selected, element, language)}
                </p>
                <dl className="isotope-library__evaluation">
                  <div>
                    <dt>{t("半衰期原记录", "Half-life in source record")}</dt>
                    <dd>{selected.halfLifeRaw || t("评价未列半衰期值", "No half-life value listed")}</dd>
                  </div>
                  {selected.decayModesRaw && (
                    <div>
                      <dt>{t("衰变 / 丰度原记录", "Decay / abundance in source record")}</dt>
                      <dd>{selected.decayModesRaw}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("系统估算标记", "Systematics flags")}</dt>
                    <dd>
                      {selected.halfLifeFromSystematics
                        ? t("半衰期含 #", "Half-life: # marked")
                        : t("半衰期未标 #", "Half-life: no #")}
                      {language === "zh" ? "；" : "; "}
                      {selected.massExcessFromSystematics
                        ? t("质量过剩含 #", "Mass excess: # marked")
                        : t("质量过剩未标 #", "Mass excess: no #")}
                      <small>{t("未标 # 不等于直接实测。", "No # does not prove direct measurement.")}</small>
                    </dd>
                  </div>
                </dl>
                {selected.stability === "unknown" && (
                  <p className="isotope-library__evaluation-note">
                    {selected.halfLifeKind === "limit-only"
                      ? t("评价未列半衰期值，仅有界限或近似信息，不能据此判为稳定。", "No principal half-life value is listed; only a limit or approximate information is given. This does not justify classifying the nuclide as stable.")
                      : t("评价未列半衰期值，不能据此判为稳定。", "No half-life value is listed. This does not justify classifying the nuclide as stable.")}
                  </p>
                )}
                {selected.halfLifeKind === "particle-unstable" && (
                  <p className="isotope-library__evaluation-note">
                    {t("原记录以粒子不稳定标签表示。", "The source record marks this nuclide as particle-unstable.")}
                  </p>
                )}
                <p className="isotope-definition">
                  {t("同位素的质子数相同、中子数不同。质量数是质子数与中子数之和，不是元素的相对原子质量。", "Isotopes have the same proton number but different neutron numbers. Mass number is the sum of protons and neutrons; it is not an element's relative atomic mass.")}
                </p>
              </>
            )
          )}
          <details
            className="isotope-source"
            key={panel.mode === "detail" ? selected?.id : "list-sources"}
          >
            <summary>
              {t("资料来源", "Sources")} <ArrowUpRight size={12} />
            </summary>
            <p>
              {t("参考资料补充", "Reference notes")} · {nuclideDatasetInfo.version}{" "}
              {t("基态评价记录，不代表实时全部已知核素。", "ground-state evaluated records; not a live census of all known nuclides.")}
            </p>
            <p>{t(
              nuclideDatasetInfo.scopeNote,
              "The source contains 3,557 original ground-state records (Z = 1–118, i = 0). Two RN records reported as nonexistent are excluded from the student index, leaving 3,555 records. Estimated entries and one EU (existence-uncertain) record remain; free neutrons and all non-ground-state records are excluded. This is a NUBASE2020 edition index, not a live census of known nuclides.",
            )}</p>
            {selected?.sourceLineNumber && (
              <p>
                {t(`数据文件第 ${selected.sourceLineNumber} 行。# 为系统估算标记。`, `Source-file row ${selected.sourceLineNumber}. # marks a systematics-based estimate.`)}
              </p>
            )}
            {isotopeSources
              .filter((source) =>
                selected
                  ? selected.sourceIds.includes(source.id)
                  : source.id === "nubase2020",
              )
              .map((source) => {
                const localizedSource = isotopeSourceCopy(source, language);
                return (
                  <Fragment key={source.id}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {localizedSource.publisher} · {localizedSource.title} <ArrowUpRight size={12} />
                    </a>
                    {language === "en" && <p>{localizedSource.note}</p>}
                  </Fragment>
                );
              })}
          </details>
        </dialog>
      )}
    </>,
    document.body,
  );
}

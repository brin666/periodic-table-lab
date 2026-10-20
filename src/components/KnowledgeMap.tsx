import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { ArrowLeft, ArrowUpRight, CircleHelp, X } from "lucide-react";
import type { Element } from "../data/types";
import { elementName, useI18n } from "../i18n";
import "../i18n/knowledge-language.css";
import {
  visibleKnowledge,
  type KnowledgeCard,
  type KnowledgePack,
} from "../data/knowledge-map";
import { knowledgeStickerByCardId } from "../data/knowledge-stickers";
import {
  knowledgeLayout,
  mapTransform,
  type MapPoint,
} from "../knowledge-layout";
import { useKnowledgeCamera } from "./useKnowledgeCamera";
import { useKnowledgeArrival } from "./useKnowledgeArrival";
import { KnowledgeTutorial, useKnowledgeTutorial } from "./KnowledgeEntryHint";
import {
  KnowledgeConnections,
  type KnowledgeConnectionSpec,
} from "./KnowledgeConnections";

const ease = "cubic-bezier(0.23, 1, 0.32, 1)";
const compactMapQuery =
  "(max-width: 700px), (max-width: 1100px) and (pointer: coarse)";
function Highlighted({ text, phrases }: { text: string; phrases: string[] }) {
  const terms = [...new Set(phrases.filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g",
  );
  return (
    <>
      {text.split(pattern).map((part, index) =>
        terms.includes(part) ? (
          <mark className="km-highlight" key={index}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
function KnowledgeIllustration({
  cardId,
  large = false,
}: {
  cardId: string;
  large?: boolean;
}) {
  const src = knowledgeStickerByCardId[cardId];
  if (!src) return null;
  return (
    <span
      className={`km-sticker ${large ? "km-sticker-large" : ""}`}
      aria-hidden="true"
    >
      <img src={src} alt="" draggable={false} loading="lazy" decoding="async" />
    </span>
  );
}
function SourceMenu({
  card,
  pack,
}: {
  card: KnowledgeCard;
  pack: KnowledgePack;
}) {
  const { t } = useI18n();
  const id = useId(),
    ref = useRef<HTMLDetailsElement>(null);
  const sources = card.sourceIds
    .map((sourceId) => pack.sources.find((source) => source.id === sourceId))
    .filter((source) => !!source);
  const hasTextbookPages = sources.some(
    (source) =>
      source.kind === "textbook" &&
      source.verification === "body-read" &&
      source.pages.length > 0,
  );
  return (
    <details
      className="km-source"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape" && ref.current?.open) {
          event.preventDefault();
          event.stopPropagation();
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
      onToggle={(event) => {
        if (event.currentTarget.open)
          document
            .querySelectorAll<HTMLDetailsElement>(
              ".knowledge-map .km-source[open]",
            )
            .forEach((other) => {
              if (other !== event.currentTarget) other.open = false;
            });
      }}
    >
      <summary className="km-source-trigger" aria-controls={id}>
        {card.level !== "extension" && hasTextbookPages
          ? t("教材依据", "Textbook source")
          : t("资料来源", "Sources")}
        <ArrowUpRight size={11} />
      </summary>
      <div className="km-source-panel" id={id}>
        {card.level !== "extension" &&
          card.curriculum?.textbookMatch === "pending" && (
            <p>
              {t(
                "知识事实已据参考正文核对，对应教材页码待核。",
                "The facts have been checked against reference text; the textbook page match is still pending.",
              )}
            </p>
          )}
        {sources.map((source) => (
          <div key={source.id}>
            <h4>{source.title}</h4>
            <p>
              {[source.publisher, source.edition, source.volume]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {source.note && <p>{source.note}</p>}
            {source.pages.map((page) => (
              <a
                key={page.printedPage}
                href={page.pageUrl}
                target="_blank"
                rel="noreferrer"
              >
                {source.volume} · p.{page.printedPage}
                {!page.linkVerified &&
                  ` · ${t("跳页位置待复核", "page link needs review")}`}
                <ArrowUpRight size={12} />
              </a>
            ))}
            {source.kind === "reference" &&
              source.verification === "body-read" &&
              source.url && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {t("阅读原文", "Read source text")} <ArrowUpRight size={12} />
                </a>
              )}
          </div>
        ))}
      </div>
    </details>
  );
}
function KnowledgeDetail({
  card,
  pack,
  reduced,
  origin,
  onClose,
}: {
  card: KnowledgeCard;
  pack: KnowledgePack;
  reduced: boolean;
  origin: HTMLElement | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null),
    animation = useRef<Animation | null>(null),
    closing = useRef(false),
    titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    if (!reduced) {
      const from = origin?.getBoundingClientRect(),
        to = dialog.getBoundingClientRect();
      const transform = from
        ? `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) scale(${Math.max(0.45, from.width / to.width)}, ${Math.max(0.45, from.height / to.height)})`
        : "scale(.96)";
      animation.current = dialog.animate(
        [
          { transform, opacity: 0.3 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 280, easing: ease },
      );
    }
    return () => {
      animation.current?.cancel();
      dialog.close();
    };
  }, []);
  useEffect(() => {
    if (reduced) animation.current?.finish();
  }, [reduced]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (reduced) {
      onClose();
      return;
    }
    const current = getComputedStyle(ref.current!),
      currentTransform = current.transform,
      currentOpacity = current.opacity;
    animation.current?.cancel();
    const from = ref.current!.getBoundingClientRect(),
      to = origin?.getBoundingClientRect();
    const transform = to
      ? `translate(${to.x + to.width / 2 - from.x - from.width / 2}px, ${to.y + to.height / 2 - from.y - from.height / 2}px) scale(${Math.max(0.4, to.width / from.width)}, ${Math.max(0.4, to.height / from.height)})`
      : "scale(.96)";
    animation.current = ref.current!.animate(
      [
        { transform: currentTransform, opacity: currentOpacity },
        { transform, opacity: 0 },
      ],
      { duration: 220, easing: ease },
    );
    animation.current.finished.then(onClose, () => {});
  };
  return (
    <dialog
      ref={ref}
      className="km-card-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <div className="km-dialog-top">
        <span>
          {card.curriculum?.volume ??
            (card.level === "extension"
              ? t("拓展知识", "Extension")
              : card.level === "senior"
                ? t("高中知识", "High school")
                : t("基础知识", "Core concepts"))}{" "}
          {card.status === "mock" ? `· ${t("交互样例", "Demo")}` : ""}
        </span>
        <button aria-label={t("收起知识卡", "Close knowledge card")} onClick={close}>
          <X size={21} />
        </button>
      </div>
      <KnowledgeIllustration cardId={card.id} large />
      <h2 id={titleId}>{card.title}</h2>
      <p className="km-dialog-summary">
        <Highlighted text={card.summary} phrases={card.highlights} />
      </p>
      <div className="km-dialog-content">
        {card.paragraphs.map((text, index) => (
          <p key={index}>
            <Highlighted text={text} phrases={card.highlights} />
          </p>
        ))}
      </div>
      <div className="km-dialog-footer">
        <SourceMenu card={card} pack={pack} />
        {card.status !== "verified" && (
          <span>
            {t("示意内容 · 教材映射待核对", "Illustrative content · textbook mapping pending")}
          </span>
        )}
      </div>
    </dialog>
  );
}

export function KnowledgeMap({
  element,
  pack,
  learningMode,
  reduced,
  sceneReady,
  collapsed,
  onCollapsedChange,
  onBack,
  onOriginal,
}: {
  element: Element;
  pack: KnowledgePack;
  learningMode: "junior" | "senior";
  reduced: boolean;
  sceneReady: boolean;
  collapsed: Set<string>;
  onCollapsedChange: (next: Set<string>) => void;
  onBack: () => void;
  onOriginal: () => void;
}) {
  const { language, t } = useI18n();
  const localizedName = elementName(element, language);
  const cardById = useMemo(
    () => Object.fromEntries(pack.cards.map((card) => [card.id, card])),
    [pack],
  );
  const stage = useRef<HTMLDivElement>(null);
  const coreKey = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ width: 1400, height: 800 });
  const [mobile, setMobile] = useState(
    () => matchMedia(compactMapQuery).matches,
  );
  const [phase, setPhase] = useState(reduced ? 2 : 0),
    [focused, setFocused] = useState<string | null>(null),
    [opened, setOpened] = useState<string | null>(null);
  const restoringFocus = useRef(false);
  const cardElements = useRef<Record<string, HTMLElement | null>>({});
  const layout = useMemo(
    () => knowledgeLayout(pack, learningMode, collapsed),
    [pack, learningMode, collapsed],
  );
  const fit = Math.min(
    1,
    (size.width - 48) / layout.bounds.width,
    (size.height - 38) / layout.bounds.height,
  );
  const arrival = useKnowledgeArrival({
    stage,
    branches: pack.branches,
    layout,
    enabled: phase >= 2,
    reduced,
    compact: mobile,
  });
  const tutorial = useKnowledgeTutorial(
    element.id,
    sceneReady && phase >= 2 && !arrival.running,
  );
  const tutorialVisible = tutorial.step !== null && !opened;
  const connections = useMemo(
    () =>
      pack.branches.flatMap((branch): KnowledgeConnectionSpec[] => [
        {
          id: branch.id,
          from: { x: 0, y: 0 },
          to: layout.branches[branch.id],
          active: phase >= 2 && layout.activeBranches.has(branch.id),
          kind: "trunk",
          delay: arrival.lineDelays[branch.id] ?? 0,
        },
        ...branch.cardIds.map((id): KnowledgeConnectionSpec => ({
          id,
          from: layout.branches[branch.id],
          to: layout.cards[id],
          active: phase >= 2 && layout.activeCards.has(id),
          kind: "leaf",
          delay: arrival.lineDelays[id] ?? 0,
        })),
      ]),
    [pack, layout, phase, arrival.lineDelays],
  );
  const camera = useKnowledgeCamera({
    stage,
    fit,
    mobile,
    reduced,
    blocked:
      !!opened ||
      phase < 2 ||
      !sceneReady ||
      arrival.running ||
      tutorial.active,
    bounds: layout.bounds,
    onOverview: () => setFocused(null),
  });
  const resetView = () => camera.overview();
  useLayoutEffect(() => {
    const node = stage.current!,
      measure = () =>
        setSize({ width: node.clientWidth, height: node.clientHeight || 740 });
    measure();
    const compact = matchMedia(compactMapQuery),
      updateCompact = () => setMobile(compact.matches);
    updateCompact();
    compact.addEventListener("change", updateCompact);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      compact.removeEventListener("change", updateCompact);
    };
  }, []);
  useEffect(() => {
    if (!sceneReady) return;
    if (reduced) {
      setPhase(2);
      return;
    }
    const frame = requestAnimationFrame(() => setPhase(2));
    return () => cancelAnimationFrame(frame);
  }, [sceneReady, reduced]);
  useEffect(() => {
    resetView();
    if (opened && !visibleKnowledge(cardById[opened].level, learningMode)) {
      const branch = pack.branches.find((item) =>
        item.cardIds.includes(opened),
      );
      setOpened(null);
      requestAnimationFrame(() => {
        const target =
          branch && layout.activeBranches.has(branch.id)
            ? document.getElementById(`km-branch-${branch.id}`)
            : stage.current?.querySelector<HTMLElement>(".km-core-key");
        target?.focus({ preventScroll: true });
      });
    }
  }, [learningMode, fit]);
  const focusPoint = (id: string, point: MapPoint) => {
    if (
      mobile ||
      opened ||
      (!layout.activeCards.has(id) && !layout.activeBranches.has(id))
    )
      return;
    // Tab to another knowledge node is an explicit navigation intent.
    // Close its former source panel before moving the keyboard reading view.
    stage.current
      ?.querySelectorAll<HTMLDetailsElement>(".km-source[open]")
      .forEach((source) => {
        source.open = false;
      });
    setFocused(id);
    camera.focus(point);
  };
  const closeCard = () => {
    const id = opened;
    restoringFocus.current = true;
    setOpened(null);
    requestAnimationFrame(() => {
      cardElements.current[id!]
        ?.querySelector<HTMLButtonElement>(".km-card-open")
        ?.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        restoringFocus.current = false;
      });
    });
  };
  const toggleBranch = (id: string) => {
    resetView();
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onCollapsedChange(next);
  };
  const pan = (event: PointerEvent<HTMLDivElement>) => {
    if (camera.move(event)) {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-camera-focus]",
      );
      setFocused(target?.dataset.cameraFocus ?? null);
    }
  };
  return (
    <main
      id="main-content"
      className="knowledge-map"
      data-element={element.id}
      data-mode={learningMode}
      data-revealed={phase}
      data-reduced={reduced}
      data-content="reviewed"
      data-focused={focused ?? "none"}
      data-arriving={arrival.running}
      data-category={element.category}
      data-tutorial={tutorialVisible ? tutorial.step : "none"}
    >
      <h1 className="sr-only" tabIndex={-1}>
        {t(`${element.name}元素知识导图`, `${localizedName} knowledge map`)}
      </h1>
      <div className="km-navigation">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          {t("返回周期表", "Back to periodic table")}
        </button>
        <button
          className="km-tutorial-replay"
          onClick={() => {
            camera.overview(true);
            tutorial.replay();
          }}
        >
          <CircleHelp size={15} />
          {t("新手教学", "Quick tour")}
        </button>
      </div>
      <div
        className="km-stage"
        ref={stage}
        onPointerMove={pan}
        onPointerDownCapture={(event) => {
          if (
            event.pointerType === "mouse" &&
            (event.target as HTMLElement).closest("button,summary,a")
          )
            camera.freeze();
        }}
        onPointerLeave={(event) => {
          if (
            event.pointerType === "mouse" &&
            !opened &&
            !stage.current?.querySelector(".km-source[open]")
          )
            resetView();
        }}
      >
        <div className="km-camera" ref={camera.node}>
          <KnowledgeConnections
            connections={connections}
            stage={stage}
            reduced={reduced}
            compact={mobile}
            suspended={!!opened || arrival.running || !sceneReady}
          />
          <div
            className="km-core"
            data-tutorial-target={
              tutorialVisible &&
              (tutorial.step === "light" || tutorial.step === "preview")
            }
          >
            <button
              ref={coreKey}
              type="button"
              className="km-core-key key-face"
              data-tutorial-target={
                tutorialVisible &&
                (tutorial.step === "light" || tutorial.step === "preview")
              }
              data-category={element.category}
              style={{ viewTransitionName: "element-key" }}
            aria-label={t(
              `进入${localizedName}的原子与物质探索页`,
              `Explore the atom and substances of ${localizedName}`,
            )}
              onClick={() => {
                tutorial.dismiss();
                camera.freeze();
                onOriginal();
              }}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) resetView();
              }}
            >
              <i className="km-core-light" aria-hidden="true" />
              <span className="atomic-number">
                {String(element.number).padStart(2, "0")}
              </span>
              <span className="element-symbol">{element.symbol}</span>
              <span className="element-name">{localizedName}</span>
            </button>
          </div>
          {pack.branches.map((branch) => {
            const branchActive = layout.activeBranches.has(branch.id);
            return (
              <section
                className="km-branch-group"
                key={branch.id}
                data-active={branchActive}
        aria-label={branch.title}
              >
                <button
                  id={`km-branch-${branch.id}`}
                  className="km-branch"
                  data-active={phase >= 1 && branchActive}
                  style={{
                    transform: mapTransform(
                      phase >= 1 && branchActive
                        ? layout.branches[branch.id]
                        : { x: 0, y: 0 },
                    ),
                  }}
                  aria-expanded={!collapsed.has(branch.id)}
                  aria-controls={`km-group-${branch.id}`}
                  aria-hidden={!branchActive}
                  inert={!branchActive}
                  onClick={() => toggleBranch(branch.id)}
                  data-camera-focus={branch.id}
                  onFocus={(event) => {
                    if (
                      !restoringFocus.current &&
                      event.currentTarget.matches(":focus-visible")
                    )
                      focusPoint(branch.id, layout.branches[branch.id]);
                  }}
                >
                  <strong>{branch.title}</strong>
                </button>
                <div id={`km-group-${branch.id}`} className="km-branch-cards">
                  {branch.cardIds.map((id, index) => {
                    const card = cardById[id],
                      active = phase >= 2 && layout.activeCards.has(id);
                    return (
                      <article
                        key={id}
                        ref={(node) => {
                          cardElements.current[id] = node;
                        }}
                        id={`km-card-${id}`}
                        className="km-card"
                        data-active={active}
                        data-level={card.level}
                        data-status={card.status}
                        data-focused={focused === id}
                        aria-hidden={!active}
                        inert={!active}
                        style={
                          {
                            transform: mapTransform(
                              active
                                ? layout.cards[id]
                                : layout.branches[branch.id],
                            ),
                            "--km-order": index,
                          } as CSSProperties
                        }
                        data-camera-focus={id}
                      >
                        <button
                          className="km-card-open"
                          onClick={() => {
                            camera.freeze();
                            setOpened(id);
                          }}
                          onFocus={(event) => {
                            if (
                              !restoringFocus.current &&
                              event.currentTarget.matches(":focus-visible")
                            )
                              focusPoint(id, layout.cards[id]);
                          }}
                          aria-label={t(
                            `展开知识卡：${card.title}`,
                            `Open knowledge card: ${card.title}`,
                          )}
                        >
                          <span className="km-card-shine" />
                          <KnowledgeIllustration cardId={card.id} />
                          <h2>{card.title}</h2>
                          <p>
                            <Highlighted
                              text={card.summary}
                              phrases={card.highlights}
                            />
                          </p>
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {tutorialVisible && (
        <KnowledgeTutorial
          step={tutorial.step!}
          name={localizedName}
          elementId={element.id}
          anchor={coreKey}
          reduced={reduced}
          mobile={mobile}
        />
      )}
      {opened && (
        <KnowledgeDetail
          key={opened}
          card={cardById[opened]}
          pack={pack}
          reduced={reduced}
          origin={cardElements.current[opened]}
          onClose={closeCard}
        />
      )}
    </main>
  );
}

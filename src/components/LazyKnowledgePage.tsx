import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { KnowledgePageProps } from "./KnowledgePage";
import type { KnowledgePack } from "../data/knowledge-map";
import { elementName, useI18n, type Language } from "../i18n";
import {
  getLoadedKnowledgePack,
  loadKnowledgePack,
} from "../data/knowledge-pack-loader";

type KnowledgeModule = typeof import("./KnowledgePage");
let loaded: KnowledgeModule | null = null;
let pending: Promise<KnowledgeModule> | null = null;
let failed = false;
const failedPacks = new Set<string>();
type LoadedPage = { module: KnowledgeModule; pack: KnowledgePack };
type PageContent = LoadedPage & { language: Language };

export const isKnowledgePageReady = (elementId: string) =>
  loaded !== null && getLoadedKnowledgePack(elementId) !== undefined;

function loadRenderer(): Promise<KnowledgeModule> {
  if (loaded) return Promise.resolve(loaded);
  if (pending) return pending;
  failed = false;
  pending = import("./KnowledgePage").then(
    (module) => {
      loaded = module;
      pending = null;
      return module;
    },
    (error: unknown) => {
      pending = null;
      failed = true;
      throw error;
    },
  );
  return pending;
}

export function loadKnowledgePage(elementId: string): Promise<LoadedPage> {
  failedPacks.delete(elementId);
  return Promise.all([loadRenderer(), loadKnowledgePack(elementId)]).then(
    ([module, pack]) => ({ module, pack }),
    (error: unknown) => {
      failedPacks.add(elementId);
      throw error;
    },
  );
}

let preloadTimer: ReturnType<typeof setTimeout> | undefined;
export function cancelKnowledgePreload() {
  clearTimeout(preloadTimer);
}
export function scheduleKnowledgePreload(elementId: string) {
  cancelKnowledgePreload();
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (
    connection?.saveData ||
    /^(slow-)?2g$/.test(connection?.effectiveType ?? "") ||
    isKnowledgePageReady(elementId)
  )
    return;
  // A brief pointer pass should not download every map along its path.
  preloadTimer = setTimeout(() => {
    void loadKnowledgePage(elementId).catch(() => {});
  }, 140);
}

export function LazyKnowledgePage(props: KnowledgePageProps) {
  const { language, t } = useI18n();
  const localizedName = elementName(props.element, language);
  const [content, setContent] = useState<PageContent | null>(() => {
    const pack = getLoadedKnowledgePack(props.element.id);
    return loaded && pack && language === "zh"
      ? { module: loaded, pack, language }
      : null;
  });
  const [error, setError] = useState(
    () => failed || failedPacks.has(props.element.id),
  );
  const fallback = useRef<HTMLElement>(null);
  const restoreFocus = useRef<string | null>(null);
  useEffect(() => {
    if (content?.language === language || error) return;
    let active = true;
    loadKnowledgePage(props.element.id).then(
      async (next) => {
        if (!active) return;
        const focused = document.activeElement;
        if (fallback.current?.contains(focused))
          restoreFocus.current = focused?.matches(".km-core-key")
            ? ".km-core-key"
            : focused?.matches(".back-button")
              ? ".km-navigation .back-button"
              : "main h1";
        if (language === "en") {
          try {
            const locale = await import("../i18n/knowledge-en");
            if (!active) return;
            setContent({
              module: next.module,
              pack: locale.localizeKnowledgePack(next.pack, locale.knowledgeEnglish),
              language,
            });
          } catch {
            if (active) setError(true);
          }
        } else {
          setContent({ ...next, language });
        }
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [content, error, language, props.element.id]);
  useLayoutEffect(() => {
    if (content && restoreFocus.current) {
      document
        .querySelector<HTMLElement>(restoreFocus.current)
        ?.focus({ preventScroll: true });
      restoreFocus.current = null;
    }
  }, [content]);
  if (content?.language === language)
    return <content.module.KnowledgePage {...props} pack={content.pack} />;
  const { element, onBack, onOriginal } = props;
  return (
    <main
      id="main-content"
      className="knowledge-map"
      data-knowledge-loading={!error}
      ref={fallback}
    >
      <h1 className="sr-only" tabIndex={-1}>
        {t(`${element.name}元素知识导图`, `${localizedName} knowledge map`)}
      </h1>
      <div className="km-navigation">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> {t("返回周期表", "Back to periodic table")}
        </button>
      </div>
      <div
        className="km-stage"
        style={{ display: "grid", placeItems: "center" }}
      >
        <div style={{ display: "grid", justifyItems: "center", gap: 24 }}>
          <button
            type="button"
            className="km-core-key key-face"
            data-category={element.category}
            style={{
              position: "relative",
              inset: "auto",
              transform: "none",
              viewTransitionName: "element-key",
            }}
            aria-label={t(
              `进入${localizedName}的原子与物质探索页`,
              `Explore the atom and substances of ${localizedName}`,
            )}
            onClick={onOriginal}
          >
            <span className="atomic-number">
              {String(element.number).padStart(2, "0")}
            </span>
            <span className="element-symbol">{element.symbol}</span>
            <span className="element-name">{localizedName}</span>
          </button>
          <p role={error ? "alert" : "status"}>
            {error
              ? t("知识导图暂时未能加载。", "The knowledge map could not be loaded.")
              : t("正在加载知识导图…", "Loading knowledge map…")}
          </p>
          {error && (
            <button
              type="button"
              className="back-button"
              style={{
                color: "inherit",
                minHeight: 44,
                padding: "10px 16px",
                border: "1px solid var(--km-panel-edge)",
                borderRadius: 8,
              }}
              // Browsers can cache a rejected import for this document. Reload
              // retries the chunk and preserves the element's direct URL.
              onClick={() => location.reload()}
            >
              {t("重新加载知识导图", "Reload knowledge map")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

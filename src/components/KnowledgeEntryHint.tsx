import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { useI18n } from "../i18n";

const disabledKey = "element-atlas:knowledge-tour-disabled:v1";
// Each map has its own destination. The old global dismissal must not hide
// another element's first entry; retain only the explicit global opt-out.
const dismissedKey = (elementId: string) =>
  `element-atlas:knowledge-entry-dismissed:v2:${elementId}`;
const dismissedInMemory = new Set<string>();
type HintStep = "waiting" | "light" | "preview" | "exit" | null;
function shouldPlay(elementId: string) {
  if (dismissedInMemory.has(elementId)) return false;
  try {
    return (
      localStorage.getItem(disabledKey) !== "true" &&
      sessionStorage.getItem(dismissedKey(elementId)) !== "1"
    );
  } catch {
    return true;
  }
}
export function useKnowledgeTutorial(elementId: string, ready: boolean) {
  const [step, setStep] = useState<HintStep>(() =>
    shouldPlay(elementId) ? "waiting" : null,
  );
  const dismiss = useCallback(() => {
    dismissedInMemory.add(elementId);
    try {
      sessionStorage.setItem(dismissedKey(elementId), "1");
    } catch {
      /* Keep this visit in memory. */
    }
    setStep(null);
  }, [elementId]);
  useEffect(() => {
    if (step !== "waiting" || !ready) return;
    const timer = window.setTimeout(() => setStep("light"), 100);
    return () => clearTimeout(timer);
  }, [step, ready]);
  useEffect(() => {
    const next =
      step === "light" ? "preview" : step === "preview" ? "exit" : null;
    const duration =
      step === "light"
        ? 200
        : step === "preview"
          ? 1400
          : step === "exit"
            ? 200
            : 0;
    if (!duration) return;
    const timer = window.setTimeout(
      () => (next ? setStep(next) : dismiss()),
      duration,
    );
    return () => clearTimeout(timer);
  }, [step, dismiss]);
  const active = step !== null;
  useEffect(() => {
    if (!active) return;
    const stop = () => dismiss();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        event.stopPropagation();
      }
      dismiss();
    };
    document.addEventListener("pointerdown", stop, true);
    document.addEventListener("wheel", stop, { capture: true, passive: true });
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("wheel", stop, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [active, dismiss]);
  return { step, active, dismiss, replay: () => setStep("waiting") };
}

/** A destination hint, never a replacement click target or modal. */
export function KnowledgeTutorial({
  step,
  elementId,
  name,
  anchor,
  reduced,
  mobile,
}: {
  step: Exclude<HintStep, null>;
  elementId: string;
  name: string;
  anchor: RefObject<HTMLButtonElement | null>;
  reduced: boolean;
  mobile: boolean;
}) {
  const { language, t } = useI18n();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const key = anchor.current;
      if (!key) return;
      const rect = key.getBoundingClientRect();
      const width = Math.min(232, window.innerWidth - 32),
        height = (width * 126) / 232;
      const left = mobile
        ? rect.left + rect.width / 2 - width / 2
        : rect.right + 16;
      const top = mobile
        ? rect.bottom + height + 16 <= innerHeight
          ? rect.bottom + 14
          : rect.top - height - 14
        : rect.top + rect.height / 2 - height - 20;
      setPosition({
        left: Math.max(16, Math.min(innerWidth - width - 16, left)),
        top: Math.max(12, Math.min(innerHeight - height - 12, top)),
        width,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, step, mobile]);
  return (
    <div
      className="km-tutorial"
      data-step={step}
      data-reduced={reduced}
      style={position ?? { visibility: "hidden" }}
      aria-hidden="true"
    >
      <img
        src={`${import.meta.env.BASE_URL}previews/elements/${language === "en" ? "en/" : ""}${elementId}.jpg`}
        width={464}
        height={252}
        alt={t(
          `${name}的原子与物质探索页面预览`,
          `${name}'s atom and substance exploration page preview`,
        )}
      />
    </div>
  );
}

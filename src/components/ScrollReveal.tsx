import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** One reading entrance per item and app session. Text is never fetched or typed. */
export function ScrollReveal({
  as: Tag = "article",
  id,
  seen,
  reduced,
  ready,
  className,
  label,
  children,
}: {
  as?: "article" | "section";
  id: string;
  seen: Set<string>;
  reduced: boolean;
  ready: boolean;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const fallback = typeof IntersectionObserver === "undefined";
  const [visible, setVisible] = useState(
    () => reduced || fallback || seen.has(id),
  );
  const [instant, setInstant] = useState(
    () => reduced || fallback || seen.has(id),
  );
  const revealImmediately = () => {
    seen.add(id);
    setInstant(true);
    setVisible(true);
  };

  useEffect(() => {
    if (visible) seen.add(id);
    if (reduced || fallback) {
      seen.add(id);
      setInstant(true);
      setVisible(true);
      return;
    }
    if (visible || !ready || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        seen.add(id);
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, seen, reduced, ready, visible, fallback]);

  return (
    <Tag
      ref={ref}
      className={`reading-reveal ${className ?? ""}`}
      aria-label={label}
      data-read-id={id}
      data-read-state={visible || reduced || fallback ? "visible" : "pending"}
      data-read-instant={instant || reduced || fallback}
      onFocusCapture={revealImmediately}
      onPointerDownCapture={revealImmediately}
    >
      {children}
    </Tag>
  );
}

const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh-CN", { granularity: "word" })
    : null;

// Keep scientific runs together before natural-language segmentation: O₂, He₂,
// 21%, 1s¹ and uncertainty/unit expressions must never reveal a partial symbol.
const scientificRun =
  /[\[(]*[A-Za-z0-9][A-Za-z0-9₀-₉⁰-⁹¹²³⁺⁻()[\]+−-]*(?:[.·][A-Za-z0-9₀-₉⁰-⁹¹²³⁺⁻()[\]+−-]+)*(?:\s*±\s*\d+(?:\.\d+)?)?(?:\s*(?:%|‰|℃|°C|g\/mol|mol\/L|mL|kg|mol|kPa|Pa|g|L|K))?/gu;

function readingPieces(text: string) {
  const pieces: { text: string; atomic: boolean }[] = [];
  const appendWords = (value: string) => {
    const words = segmenter
      ? Array.from(segmenter.segment(value), (part) => part.segment)
      : (value.match(/\s+|[\u3400-\u9fff]{1,2}|[^\s\u3400-\u9fff]+/gu) ?? [
          value,
        ]);
    pieces.push(...words.map((word) => ({ text: word, atomic: false })));
  };
  let cursor = 0;
  for (const match of text.matchAll(scientificRun)) {
    if (match.index > cursor) appendWords(text.slice(cursor, match.index));
    pieces.push({ text: match[0], atomic: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) appendWords(text.slice(cursor));
  return pieces;
}

/** Full accessible text is present from mount; visible phrases fade in in order. */
export function StreamText({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const pieces = useMemo(() => readingPieces(text), [text]);
  return (
    <span className="stream-text">
      <span className="sr-only">{text}</span>
      <span className="stream-visual" aria-hidden="true">
        {pieces.map((piece, index) => (
          <span
            className={`stream-piece${piece.atomic ? " stream-atomic" : ""}`}
            key={index}
            style={
              {
                "--piece-delay": `${delay + Math.min(index * 24, 420)}ms`,
              } as CSSProperties
            }
          >
            {piece.text}
          </span>
        ))}
      </span>
    </span>
  );
}

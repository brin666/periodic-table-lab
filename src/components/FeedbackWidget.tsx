import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useI18n, type Language } from "../i18n";
import { feedbackEnglish } from "../i18n/feedback-en";
import {
  useFeedbackCaptureTransition,
  type FeedbackCaptureFlight,
} from "./useFeedbackCaptureTransition";
import {
  captureViewport,
  cropSnapshot,
  type CropBounds,
  type ViewportSnapshot,
} from "./feedback-capture";
import {
  appendFeedbackAnswer,
  FEEDBACK_ANSWER_LIMIT,
  getConversationPlan,
  localizeFeedbackAnswers,
  type FeedbackAnswer,
} from "./feedback-conversation";

type FeedbackType = "bug" | "content" | "suggestion";
type Stage = "chat" | "capture" | "sending" | "error" | "success";

interface FeedbackPayload {
  id: string;
  type: FeedbackType;
  description: string;
  page: {
    url: string;
    title: string;
    learningMode: string;
    viewport: { width: number; height: number };
    userAgent: string;
    version: "feedback-v1";
  };
  screenshot?: string;
  consent: true;
  website: string;
}

interface FeedbackReceipt {
  url: string;
  number: string;
  message?: string;
}

interface FeedbackFailure {
  message: string;
  retryAfter?: string;
  unconfigured?: boolean;
  outcomeUnknown?: boolean;
}

function getSafeIssueUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      !/^\/[^/]+\/[^/]+\/issues\/\d+\/?$/.test(url.pathname)
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function getIssueUrl(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const response = body as Record<string, unknown>;
  const issue =
    response.issue && typeof response.issue === "object"
      ? (response.issue as Record<string, unknown>)
      : null;
  return (
    [response.issueUrl, response.url, response.html_url, issue?.html_url]
      .map(getSafeIssueUrl)
      .find(Boolean) ?? null
  );
}

function getPageContext(learningMode: string): FeedbackPayload["page"] {
  const routeUrl = new URL(window.location.href);
  routeUrl.search = "";
  return {
    url: routeUrl.toString(),
    title: document.title,
    learningMode,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    userAgent: navigator.userAgent,
    version: "feedback-v1",
  };
}

function captureErrorMessage(
  error: unknown,
  language: Language,
  fallbackZh: string,
  fallbackEn: string,
) {
  const message = error instanceof Error ? error.message : fallbackZh;
  if (language === "zh") return message;
  const known: Record<string, string> = {
    "无法创建截图画布。": feedbackEnglish.ui.errors.screenshotCanvasFailed,
    "截图体积过大，请缩小选区后重试。": feedbackEnglish.ui.errors.screenshotTooLarge,
    "页面中的图片无法完整读取，请稍后重试或改用文字反馈。": feedbackEnglish.ui.errors.imageReadFailed,
    "无法读取页面截图。": feedbackEnglish.ui.errors.screenshotUnreadable,
    "无法创建页面截图。": feedbackEnglish.ui.errors.screenshotCanvasFailed,
    "无法裁剪截图，请继续使用文字反馈。": feedbackEnglish.ui.errors.cropFailed,
    "无法处理截图，请继续使用文字反馈。": feedbackEnglish.ui.errors.imageProcessingFailed,
  };
  return known[message] ?? fallbackEn;
}

function formatRetryAfter(value: string, language: Language) {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    const rounded = Math.ceil(seconds);
    return language === "en"
      ? `${rounded} ${rounded === 1 ? "second" : "seconds"}`
      : `${rounded} 秒`;
  }
  return language === "en" ? "a short while" : value;
}

function getErrorDetails(
  body: unknown,
  status: number,
  configured: boolean,
  language: Language,
): FeedbackFailure {
  const english = language === "en";
  const englishErrors = feedbackEnglish.ui.errors;
  if (body && typeof body === "object") {
    const response = body as Record<string, unknown>;
    const serverMessage =
      typeof response.message === "string"
        ? response.message
        : typeof response.error === "string"
          ? response.error
          : "";
    const errorCode = typeof response.error === "string" ? response.error : "";
    const retryAfter =
      typeof response.retryAfter === "number" ||
      typeof response.retryAfter === "string"
        ? String(response.retryAfter)
        : undefined;
    if (
      [
        "feedback_unavailable",
        "storage_unavailable",
        "github_unavailable",
      ].includes(errorCode)
    ) {
      const unconfigured = /尚未配置|not configured/i.test(serverMessage);
      const englishMessage = unconfigured
        ? englishErrors.unconfigured
        : errorCode === "storage_unavailable"
          ? englishErrors.storageUnavailable
          : errorCode === "github_unavailable"
            ? englishErrors.githubUnavailable
            : englishErrors.feedbackUnavailable;
      return {
        message:
          english
            ? englishMessage
            : serverMessage && /[\u3400-\u9fff]/.test(serverMessage)
              ? serverMessage
              : "反馈暂未提交，请稍后重试。",
        retryAfter,
        unconfigured,
      };
    }
    if (errorCode === "feedback_processing") {
      return {
        message:
          english
            ? englishErrors.processing
            : "服务器仍在核对这条反馈是否已创建。请稍后使用同一份草稿重试，避免重复提交。",
        retryAfter,
        outcomeUnknown: true,
      };
    }
    if (!english && serverMessage && /[\u3400-\u9fff]/.test(serverMessage)) {
      return {
        message: serverMessage,
        retryAfter,
        outcomeUnknown:
          status === 0 || status >= 500 || (status >= 200 && status < 300),
      };
    }
    if (retryAfter || errorCode === "rate_limited") {
      return {
        message: english ? englishErrors.rateLimited : "提交较为频繁，请稍后再试。",
        retryAfter,
      };
    }
  }

  if (!configured && (status === 404 || (status === 200 && !body))) {
    return {
      message: english
        ? englishErrors.unconfigured
        : "匿名反馈服务尚未配置，内容没有提交。你可以保留草稿，之后重试。",
      unconfigured: true,
    };
  }
  if (status === 0)
    return {
      message:
        english
          ? englishErrors.connectionUnknown
          : "服务连接中断，提交状态尚未确认。请稍后用同一份草稿重试，避免重复提交。",
      outcomeUnknown: true,
    };
  if (status === 429)
    return {
      message: english ? englishErrors.rateLimited : "提交得有些频繁，请稍后重试。",
    };
  if (status >= 500 || (status >= 200 && status < 300)) {
    return {
      message:
        english
          ? englishErrors.statusUnknown
          : "服务暂时无法确认这条反馈的处理结果。请稍后用同一份草稿重试，避免重复提交。",
      outcomeUnknown: true,
    };
  }
  return {
    message: english
      ? englishErrors.http(status)
      : `反馈服务暂时无法处理这次提交（HTTP ${status}），草稿已保留。`,
  };
}

function postFeedback(
  payload: FeedbackPayload,
  language: Language,
  onProgress: (percent: number | null) => void,
  onUploadComplete: () => void,
  signal: AbortSignal,
): Promise<FeedbackReceipt> {
  const configuredEndpoint = import.meta.env.VITE_FEEDBACK_API_URL?.trim();
  const endpoint = configuredEndpoint || "/api/feedback";
  const configured = Boolean(configuredEndpoint);

  if (configuredEndpoint && /^https?:\/\//i.test(configuredEndpoint)) {
    try {
      const parsed = new URL(configuredEndpoint);
      const localDevelopmentHost = ["localhost", "127.0.0.1", "::1"].includes(
        parsed.hostname,
      );
      if (parsed.protocol !== "https:" && !localDevelopmentHost) {
        return Promise.reject({
          message:
            language === "en"
              ? feedbackEnglish.ui.errors.insecureEndpoint
              : "反馈接口必须使用 HTTPS；内容没有提交。",
        } satisfies FeedbackFailure);
      }
    } catch {
      return Promise.reject({
        message:
          language === "en"
            ? feedbackEnglish.ui.errors.invalidEndpoint
            : "反馈接口地址无效；内容没有提交。",
      } satisfies FeedbackFailure);
    }
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.timeout = 75_000;
    const fail = (failure: FeedbackFailure) => {
      reject(failure);
    };

    request.open("POST", endpoint);
    request.setRequestHeader("Content-Type", "application/json");
    request.upload.addEventListener("progress", (event) => {
      onProgress(
        event.lengthComputable && event.total > 0
          ? Math.min(100, Math.round((event.loaded / event.total) * 100))
          : null,
      );
    });
    request.upload.addEventListener(
      "load",
      () => {
        onProgress(100);
        onUploadComplete();
      },
      { once: true },
    );
    request.addEventListener("error", () =>
      fail(getErrorDetails(null, 0, configured, language)),
    );
    request.addEventListener("timeout", () =>
      reject({
        message:
          language === "en"
            ? feedbackEnglish.ui.errors.timeout
            : "服务响应超时，提交状态尚未确认。请稍后用同一份草稿重试，避免重复提交。",
        outcomeUnknown: true,
      } satisfies FeedbackFailure),
    );
    request.addEventListener("abort", () =>
      reject(new DOMException("请求已取消", "AbortError")),
    );
    request.addEventListener("load", () => {
      let body: unknown = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        body = null;
      }

      if (request.status < 200 || request.status >= 300) {
        fail(getErrorDetails(body, request.status, configured, language));
        return;
      }

      const url = getIssueUrl(body);
      if (!url) {
        fail(getErrorDetails(body, request.status, configured, language));
        return;
      }

      const number =
        new URL(url).pathname.match(/\/issues\/(\d+)\/?$/)?.[1] ?? "";
      const message =
        body &&
        typeof body === "object" &&
        typeof (body as Record<string, unknown>).message === "string"
          ? ((body as Record<string, unknown>).message as string)
          : undefined;
      resolve({ url, number, message });
    });

    const abort = () => request.abort();
    if (signal.aborted) {
      reject(new DOMException("请求已取消", "AbortError"));
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    request.addEventListener(
      "loadend",
      () => signal.removeEventListener("abort", abort),
      { once: true },
    );

    try {
      request.send(JSON.stringify(payload));
    } catch {
      fail(getErrorDetails(null, 0, configured, language));
    }
  });
}

function readPointerPoint(
  event: ReactPointerEvent<SVGSVGElement>,
  width: number,
  height: number,
) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(width, ((event.clientX - bounds.left) / bounds.width) * width),
    ),
    y: Math.max(
      0,
      Math.min(height, ((event.clientY - bounds.top) / bounds.height) * height),
    ),
  };
}

function SelectionPreview({
  snapshot,
  crop,
  onCropChange,
}: {
  snapshot: ViewportSnapshot;
  crop: CropBounds | null;
  onCropChange: (value: CropBounds | null) => void;
}) {
  const { t } = useI18n();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<CropBounds | null>(null);
  const activeCrop = dragging ?? crop;

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    const point = readPointerPoint(event, snapshot.width, snapshot.height);
    start.current = point;
    setDragging({ x: point.x, y: point.y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!start.current) return;
    const point = readPointerPoint(event, snapshot.width, snapshot.height);
    const origin = start.current;
    const left = Math.min(origin.x, point.x);
    const top = Math.min(origin.y, point.y);
    setDragging({
      x: left,
      y: top,
      width: Math.abs(point.x - origin.x),
      height: Math.abs(point.y - origin.y),
    });
  };

  const finishPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!start.current) return;
    const point = readPointerPoint(event, snapshot.width, snapshot.height);
    const origin = start.current;
    const next = {
      x: Math.min(origin.x, point.x),
      y: Math.min(origin.y, point.y),
      width: Math.abs(point.x - origin.x),
      height: Math.abs(point.y - origin.y),
    };
    start.current = null;
    setDragging(null);
    if (next.width >= 24 && next.height >= 24) onCropChange(next);
  };

  const path = activeCrop
    ? `M0 0H${snapshot.width}V${snapshot.height}H0Z M${activeCrop.x} ${activeCrop.y}H${activeCrop.x + activeCrop.width}V${activeCrop.y + activeCrop.height}H${activeCrop.x}Z`
    : `M0 0H${snapshot.width}V${snapshot.height}H0Z`;

  return (
    <div className="feedback-capture-frame">
      <img
        src={snapshot.dataUrl}
        alt={t(
          "当前页面截图，拖动选择要反馈的区域",
          feedbackEnglish.ui.captureImageAlt,
        )}
        draggable={false}
      />
      <svg
        className="feedback-capture-overlay"
        viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
        preserveAspectRatio="none"
        aria-label={t("截图区域选择", feedbackEnglish.ui.captureSelector)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={() => {
          start.current = null;
          setDragging(null);
        }}
      >
        <path
          d={path}
          fill="#101716"
          fillOpacity={activeCrop ? ".45" : ".2"}
          fillRule="evenodd"
        />
        {activeCrop && (
          <rect
            x={activeCrop.x}
            y={activeCrop.y}
            width={activeCrop.width}
            height={activeCrop.height}
            fill="none"
            stroke="#d4e3c7"
            strokeWidth={Math.max(
              2,
              Math.min(snapshot.width, snapshot.height) * 0.004,
            )}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

export interface FeedbackWidgetProps {
  learningMode: string;
  reduced: boolean;
}

export function FeedbackWidget({ learningMode, reduced }: FeedbackWidgetProps) {
  const { language, t } = useI18n();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const attachmentRef = useRef<HTMLImageElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const activeHostRef = useRef<HTMLElement | null>(null);
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);
  const payloadRef = useRef<FeedbackPayload | null>(null);
  const pageContextRef = useRef<FeedbackPayload["page"] | null>(null);
  const capturePageRef = useRef<FeedbackPayload["page"] | null>(null);
  const screenshotPageRef = useRef<FeedbackPayload["page"] | null>(null);
  const conversationPageRef = useRef<FeedbackPayload["page"] | null>(null);
  const captureAttemptRef = useRef(0);

  const [launcherHost, setLauncherHost] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("chat");
  const [answers, setAnswers] = useState<FeedbackAnswer[]>([]);
  const [reply, setReply] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [screenshot, setScreenshot] = useState<ViewportSnapshot | null>(null);
  const [capture, setCapture] = useState<ViewportSnapshot | null>(null);
  const [crop, setCrop] = useState<CropBounds | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureMessage, setCaptureMessage] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [failure, setFailure] = useState<FeedbackFailure | null>(null);
  const [receipt, setReceipt] = useState<FeedbackReceipt | null>(null);
  const [captureFlight, setCaptureFlight] =
    useState<FeedbackCaptureFlight | null>(null);
  const finishCaptureFlight = useCallback(() => setCaptureFlight(null), []);
  useFeedbackCaptureTransition({
    flight: captureFlight,
    active: isOpen && stage === "chat",
    reduced,
    dialog: dialogRef,
    attachment: attachmentRef,
    onDone: finishCaptureFlight,
  });
  const plan = useMemo(
    () => getConversationPlan(answers, language),
    [answers, language],
  );
  const localizedAnswers = useMemo(
    () => localizeFeedbackAnswers(answers, language),
    [answers, language],
  );
  const feedbackType = plan.type;
  const description = plan.description;
  const validDescription =
    plan.complete &&
    description.trim().length >= 10 &&
    description.trim().length <= 3000;

  const resetPayload = useCallback(() => {
    payloadRef.current = null;
    pageContextRef.current =
      screenshotPageRef.current ?? conversationPageRef.current;
  }, []);

  const updateScreenshot = useCallback(
    (next: ViewportSnapshot | null) => {
      if (!next) screenshotPageRef.current = null;
      setScreenshot(next);
      setFailure(null);
      setConsent(false);
      resetPayload();
    },
    [resetPayload],
  );

  useEffect(() => {
    const updateActiveHost = () => {
      const openDialogs = [
        ...document.querySelectorAll<HTMLDialogElement>("dialog[open]"),
      ].filter((dialog) => !dialog.matches(".feedback-dialog"));
      const nextHost = openDialogs.at(-1) ?? null;
      if (activeHostRef.current !== nextHost) {
        activeHostRef.current = nextHost;
        setLauncherHost(nextHost);
      }
    };

    const observer = new MutationObserver(updateActiveHost);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    document.addEventListener("focusin", updateActiveHost, true);
    updateActiveHost();
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", updateActiveHost, true);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        setIsOpen(false);
        return;
      }
      requestAnimationFrame(() =>
        headingRef.current?.focus({ preventScroll: true }),
      );
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen)
      requestAnimationFrame(() =>
        (stage === "chat"
          ? (composerRef.current ?? headingRef.current)
          : headingRef.current
        )?.focus({ preventScroll: true }),
      );
  }, [stage, isOpen]);

  useEffect(() => {
    if (!isOpen || stage === "capture") return;
    const frame = requestAnimationFrame(() => {
      const log = chatLogRef.current;
      if (log) log.scrollTop = captureFlight ? 0 : log.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [answers, screenshot, stage, isOpen, captureFlight]);

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current !== null)
      window.clearTimeout(countdownTimerRef.current);
    if (countdownIntervalRef.current !== null)
      window.clearInterval(countdownIntervalRef.current);
    countdownTimerRef.current = null;
    countdownIntervalRef.current = null;
    setCountdown(null);
  }, []);

  useEffect(
    () => () => {
      if (countdownTimerRef.current !== null)
        window.clearTimeout(countdownTimerRef.current);
      if (countdownIntervalRef.current !== null)
        window.clearInterval(countdownIntervalRef.current);
      abortControllerRef.current?.abort();
    },
    [],
  );

  const startNewFeedback = () => {
    if (stage !== "success") return;
    setStage("chat");
    setAnswers([]);
    setReply("");
    setChatStarted(false);
    conversationPageRef.current = null;
    updateScreenshot(null);
    setCapture(null);
    setCrop(null);
    setFailure(null);
    setReceipt(null);
    setConsent(false);
    setUploadProgress(null);
    setUploadComplete(false);
    resetPayload();
    void beginCapture();
  };

  const openWidget = () => {
    if (countdown !== null) clearCountdown();
    focusReturnRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : launcherRef.current;
    if (stage === "capture" || (stage === "chat" && !chatStarted)) {
      void beginCapture();
    } else {
      setIsOpen(true);
    }
  };

  const closeWidget = useCallback(() => {
    setCaptureFlight(null);
    clearCountdown();
    if (stage !== "sending") {
      captureAttemptRef.current += 1;
      setCaptureBusy(false);
    }
    if (stage === "capture") {
      setStage("chat");
      setCapture(null);
      setCrop(null);
    }
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setIsOpen(false);
    const returnTarget = focusReturnRef.current;
    queueMicrotask(() => {
      if (returnTarget?.isConnected)
        returnTarget.focus({ preventScroll: true });
      else launcherRef.current?.focus({ preventScroll: true });
    });
  }, [clearCountdown, stage]);

  useEffect(() => {
    if (!isOpen && countdown === null) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (countdown !== null) {
        clearCountdown();
        captureAttemptRef.current += 1;
        setCaptureBusy(false);
        setStage("chat");
        const returnTarget = focusReturnRef.current ?? launcherRef.current;
        queueMicrotask(() => {
          if (returnTarget?.isConnected)
            returnTarget.focus({ preventScroll: true });
        });
      } else {
        closeWidget();
      }
    };
    document.addEventListener("keydown", onEscape, true);
    return () => document.removeEventListener("keydown", onEscape, true);
  }, [isOpen, countdown, clearCountdown, closeWidget]);

  const captureNow = async (knownAttempt?: number) => {
    setCaptureFlight(null);
    const attempt = knownAttempt ?? ++captureAttemptRef.current;
    clearCountdown();
    setConsent(false);
    resetPayload();
    setCapture(null);
    setCrop(null);
    setStage("capture");
    setIsOpen(true);
    setCaptureBusy(true);
    setCaptureMessage("");
    const capturedPage = getPageContext(learningMode);
    try {
      const snapshot = await captureViewport();
      if (attempt !== captureAttemptRef.current) return;
      if (
        capturedPage.viewport.width !== window.innerWidth ||
        capturedPage.viewport.height !== window.innerHeight
      ) {
        void captureNow();
        return;
      }
      capturePageRef.current = capturedPage;
      setCapture(snapshot);
    } catch (error) {
      if (attempt !== captureAttemptRef.current) return;
      const reason = captureErrorMessage(
        error,
        language,
        "页面截图失败。",
        feedbackEnglish.ui.errors.captureUnavailable,
      );
      setCaptureMessage(
        `${reason}${screenshot ? t("上一张截图已保留，请检查或重新框选，并重新确认公开提交。", feedbackEnglish.ui.errors.captureKeptScreenshot) : t("仍可继续用文字描述。", feedbackEnglish.ui.errors.captureTextAvailable)}`,
      );
      conversationPageRef.current ??= capturedPage;
      setChatStarted(true);
      setStage("chat");
    } finally {
      if (attempt === captureAttemptRef.current) setCaptureBusy(false);
    }
  };

  const beginCapture = async () => {
    await captureNow();
  };

  const beginCountdownCapture = () => {
    clearCountdown();
    const attempt = ++captureAttemptRef.current;
    setCountdown(3);
    if (dialogRef.current?.open) dialogRef.current.close();
    setIsOpen(false);
    const returnTarget = focusReturnRef.current ?? launcherRef.current;
    queueMicrotask(() => {
      if (returnTarget?.isConnected)
        returnTarget.focus({ preventScroll: true });
    });
    let remaining = 3;
    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) setCountdown(remaining);
    }, 1000);
    countdownTimerRef.current = window.setTimeout(() => {
      void captureNow(attempt);
    }, 3000);
  };

  const proceedWithCrop = async (useFullImage: boolean) => {
    if (!capture) return;
    const frame = dialogRef.current
      ?.querySelector(".feedback-capture-overlay")
      ?.getBoundingClientRect();
    const region =
      useFullImage || !crop
        ? { x: 0, y: 0, width: capture.width, height: capture.height }
        : crop;
    const from = frame
      ? {
          x: frame.left + (region.x / capture.width) * frame.width,
          y: frame.top + (region.y / capture.height) * frame.height,
          width: (region.width / capture.width) * frame.width,
          height: (region.height / capture.height) * frame.height,
        }
      : null;
    const attempt = ++captureAttemptRef.current;
    setCaptureBusy(true);
    setCaptureMessage("");
    try {
      const selected =
        useFullImage || !crop ? capture : await cropSnapshot(capture, crop);
      if (attempt !== captureAttemptRef.current) return;
      updateScreenshot(selected);
      if (from && !reduced) setCaptureFlight({ snapshot: selected, from });
      screenshotPageRef.current = capturePageRef.current;
      pageContextRef.current = screenshotPageRef.current;
      conversationPageRef.current ??= capturePageRef.current;
      setCapture(null);
      setCrop(null);
      setChatStarted(true);
      setStage("chat");
    } catch (error) {
      if (attempt !== captureAttemptRef.current) return;
      setCaptureMessage(captureErrorMessage(
        error,
        language,
        "无法使用这张截图。",
        feedbackEnglish.ui.errors.screenshotUseFailed,
      ));
    } finally {
      if (attempt === captureAttemptRef.current) setCaptureBusy(false);
    }
  };

  const skipCapture = () => {
    clearCountdown();
    captureAttemptRef.current += 1;
    setCaptureBusy(false);
    setCapture(null);
    setCrop(null);
    updateScreenshot(null);
    conversationPageRef.current ??= getPageContext(learningMode);
    pageContextRef.current = conversationPageRef.current;
    setChatStarted(true);
    setStage("chat");
  };

  useEffect(() => {
    if (!isOpen || stage !== "capture" || !capture) return;
    const resize = () => {
      void beginCapture();
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isOpen, stage, capture]);

  const sendAnswer = (text = reply) => {
    if (stage !== "chat" || !text.trim() || plan.complete) return;
    const next = appendFeedbackAnswer(answers, text, language);
    if (!screenshot && answers.length === 0 && next[0]) {
      next[0] = {
        ...next[0],
        question:
          language === "en"
            ? next[0].question.replace("in this screenshot", "on this page")
            : next[0].question.replace("这张截图里，", "在这个页面，"),
      };
    }
    conversationPageRef.current ??= getPageContext(learningMode);
    setAnswers(next);
    setReply("");
    setConsent(false);
    setFailure(null);
    resetPayload();
    requestAnimationFrame(() => {
      if (getConversationPlan(next, language).complete)
        consentRef.current?.focus({ preventScroll: true });
      else composerRef.current?.focus({ preventScroll: true });
    });
  };

  const editLastAnswer = () => {
    if (
      !answers.length ||
      stage === "sending" ||
      stage === "success" ||
      failure?.outcomeUnknown
    )
      return;
    const last = answers[answers.length - 1];
    setAnswers(answers.slice(0, -1));
    setReply(last.answer);
    setConsent(false);
    setFailure(null);
    resetPayload();
    setStage("chat");
    requestAnimationFrame(() =>
      composerRef.current?.focus({ preventScroll: true }),
    );
  };

  const buildPayload = () => {
    if (payloadRef.current) return payloadRef.current;
    const pageContext = pageContextRef.current ?? getPageContext(learningMode);
    pageContextRef.current = pageContext;
    const payload: FeedbackPayload = {
      id: crypto.randomUUID(),
      type: feedbackType,
      description: description.trim(),
      page: pageContext,
      ...(screenshot ? { screenshot: screenshot.dataUrl } : {}),
      consent: true,
      website: websiteRef.current?.value ?? "",
    };
    payloadRef.current = payload;
    return payload;
  };

  const submit = async () => {
    if (!validDescription || !consent || stage === "sending") return;
    const currentAttempt = ++attemptRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setFailure(null);
    setUploadProgress(null);
    setUploadComplete(false);
    setStage("sending");

    try {
      const nextReceipt = await postFeedback(
        buildPayload(),
        language,
        (percent) => {
          if (currentAttempt === attemptRef.current) setUploadProgress(percent);
        },
        () => {
          if (currentAttempt === attemptRef.current) setUploadComplete(true);
        },
        controller.signal,
      );
      if (currentAttempt !== attemptRef.current) return;
      abortControllerRef.current = null;
      setReceipt(nextReceipt);
      setUploadProgress(100);
      setUploadComplete(true);
      setStage("success");
    } catch (error) {
      if (
        currentAttempt !== attemptRef.current ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      abortControllerRef.current = null;
      const details =
        error && typeof error === "object" && "message" in error
          ? (error as FeedbackFailure)
          : {
              message:
                language === "en"
                  ? feedbackEnglish.ui.errors.generic
                  : "提交失败，草稿已保留。请检查网络后重试。",
            };
      setFailure(details);
      setStage("error");
    }
  };

  const launcher = (
    <div
      className={`feedback-launcher${launcherHost ? " feedback-launcher--in-dialog" : ""}`}
      data-feedback-ui
    >
      <button
        ref={launcherRef}
        type="button"
        className="feedback-launcher__button"
        aria-label={t("反馈", feedbackEnglish.ui.launcher)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openWidget}
      >
        <MessageCircle size={17} strokeWidth={1.9} aria-hidden="true" />
        <span>{t("反馈", feedbackEnglish.ui.launcher)}</span>
      </button>
    </div>
  );

  const dialog = (
    <dialog
      ref={dialogRef}
      className={`feedback-dialog${stage === "capture" ? " feedback-dialog--capture" : " feedback-dialog--chat"}`}
      data-feedback-ui
      data-reduced={reduced ? "true" : "false"}
      data-capture-transition={!!captureFlight}
      data-chat-initial={stage === "chat" && answers.length === 0}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        closeWidget();
      }}
      onClick={(event) => {
        if (stage !== "capture" && event.target === event.currentTarget)
          closeWidget();
      }}
    >
      {stage === "capture" ? (
        <section className="feedback-fullscreen" aria-busy={captureBusy}>
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className="sr-only">
            {t("框选当前页面", feedbackEnglish.ui.captureTitle)}
          </h2>
          {capture && (
            <SelectionPreview
              snapshot={capture}
              crop={crop}
              onCropChange={setCrop}
            />
          )}
          <div
            className="feedback-fullscreen__hint"
            role="status"
            aria-live="polite"
          >
            {captureBusy ? (
              <>
                <LoaderCircle
                  size={16}
                  className="feedback-spin"
                  aria-hidden="true"
                />
                {t("准备框选…", feedbackEnglish.ui.capturePreparing)}
              </>
            ) : crop ? (
              t("选好后点击完成截图", feedbackEnglish.ui.captureReady)
            ) : (
              t("拖动框选问题位置 · Esc 退出", feedbackEnglish.ui.captureDragHint)
            )}
          </div>
          {captureMessage && (
            <p className="feedback-fullscreen__message" role="alert">
              {captureMessage}
            </p>
          )}
          <div
            className="feedback-fullscreen__toolbar"
            role="toolbar"
            aria-label={t("截图操作", feedbackEnglish.ui.captureToolbar)}
          >
            <button
              type="button"
              onClick={closeWidget}
              className="feedback-button feedback-button--quiet"
              aria-label={t("取消框选", feedbackEnglish.ui.cancelSelection)}
            >
              <X size={16} aria-hidden="true" />
              {t("取消", feedbackEnglish.ui.cancel)}
            </button>
            {crop ? (
              <button
                type="button"
                onClick={() => setCrop(null)}
                className="feedback-button feedback-button--quiet"
                disabled={captureBusy}
              >
                {t("重选", feedbackEnglish.ui.reselect)}
              </button>
            ) : (
              <button
                type="button"
                onClick={skipCapture}
                className="feedback-button feedback-button--quiet"
              >
                {t("仅写建议", feedbackEnglish.ui.textOnly)}
              </button>
            )}
            <button
              type="button"
              onClick={beginCountdownCapture}
              className="feedback-icon-button"
              aria-label={t("延时三秒重拍", feedbackEnglish.ui.countdownAria)}
              title={t("三秒后重拍，便于截取悬浮状态", feedbackEnglish.ui.countdownTitle)}
            >
              <Camera size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="feedback-button feedback-button--primary"
              disabled={!capture || captureBusy}
              onClick={() => void proceedWithCrop(!crop)}
            >
              {crop
                ? t("完成截图", feedbackEnglish.ui.finishScreenshot)
                : t("截取整页", feedbackEnglish.ui.fullScreenshot)}
              <Check size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : (
        <section
          className="feedback-dialog__panel feedback-chat"
          aria-busy={stage === "sending"}
        >
          <header className="feedback-dialog__header">
            <div>
              <h2
                id={titleId}
                ref={headingRef}
                tabIndex={-1}
                className="sr-only"
              >
                {t("聊聊这个问题", feedbackEnglish.ui.chatTitle)}
              </h2>
            </div>
            <div className="feedback-chat__header-actions">
              {stage === "chat" && !screenshot && (
                <button
                  type="button"
                  className="feedback-icon-button"
                  aria-label={t("重新框选", feedbackEnglish.ui.recapture)}
                  title={t("重新框选", feedbackEnglish.ui.recapture)}
                  onClick={() => void beginCapture()}
                >
                  <Camera size={18} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="feedback-icon-button feedback-dialog__close"
                aria-label={t("关闭反馈窗口", feedbackEnglish.ui.close)}
                onClick={closeWidget}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            ref={chatLogRef}
            className="feedback-dialog__body feedback-chat-log"
            role="log"
            aria-label={t("反馈对话", feedbackEnglish.ui.conversation)}
            aria-live="polite"
            aria-relevant="additions"
          >
            {screenshot && (
              <div className="feedback-message feedback-message--user feedback-message--image">
                <img
                  ref={attachmentRef}
                  src={screenshot.dataUrl}
                  width={screenshot.width}
                  height={screenshot.height}
                  style={{
                    width: Math.min(
                      144,
                      (132 * screenshot.width) / screenshot.height,
                    ),
                    height: Math.min(
                      132,
                      (144 * screenshot.height) / screenshot.width,
                    ),
                  }}
                  alt={t("反馈截图", feedbackEnglish.ui.screenshotAlt)}
                />
                <div className="feedback-attachment-info">
                  <span>{t("已选区域", feedbackEnglish.ui.selectedRegion)}</span>
                  {stage === "chat" && (
                    <button type="button" onClick={() => void beginCapture()}>
                      {t("重新框选", feedbackEnglish.ui.recapture)}
                    </button>
                  )}
                </div>
              </div>
            )}
            {answers.map((turn, index) => (
              <div className="feedback-chat-turn" key={index}>
                <div className="feedback-message feedback-message--assistant">
                  <span className="feedback-message__author">
                    {t("反馈助手", feedbackEnglish.ui.assistant)}
                  </span>
                  <p>
                    {localizedAnswers[index]?.question ?? turn.question}
                  </p>
                </div>
                <div className="feedback-message feedback-message--user">
                  <span className="feedback-message__author">
                    {t("你", feedbackEnglish.ui.user)}
                  </span>
                      <p>{turn.answer}</p>
                </div>
              </div>
            ))}
            {stage === "chat" && plan.prompt && (
              <div
                className="feedback-message feedback-message--assistant"
                key={plan.prompt.id}
              >
                <span className="feedback-message__author">
                  {t("反馈助手", feedbackEnglish.ui.assistant)}
                </span>
                <p>
                  {!screenshot && answers.length === 0
                    ? language === "en"
                      ? plan.prompt.text.replace("in this screenshot", "on this page")
                      : plan.prompt.text.replace("这张截图里，", "在这个页面，")
                    : plan.prompt.text}
                </p>
                {plan.prompt.suggestions && (
                  <div className="feedback-chat-suggestions">
                    {plan.prompt.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => sendAnswer(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {captureMessage && stage === "chat" && (
              <p className="feedback-inline-message" role="status">
                {captureMessage}
              </p>
            )}
            {plan.complete && (
              <div className="feedback-message feedback-message--assistant feedback-chat-summary">
                <span className="feedback-message__author">
                  {t("反馈助手", feedbackEnglish.ui.assistant)}
                </span>
                <p>
                  {t(
                    "情况已整理好。检查下面的记录，确认后就可以上传。",
                    feedbackEnglish.ui.summaryReady,
                  )}
                </p>
                <details className="feedback-chat-summary__record">
                  <summary>
                    {t("反馈记录", feedbackEnglish.ui.summaryRecord)} · {" "}
                    {language === "en"
                      ? feedbackEnglish.ui.answerCount(answers.length)
                      : `${answers.length} 次回答`}
                  </summary>
                  {localizedAnswers.map((turn, index) => (
                    <div key={index}>
                      <strong>{turn.question}</strong>
                      <p>{turn.answer}</p>
                    </div>
                  ))}
                </details>
                <p className="feedback-chat-summary__public">
                  {t(
                    "截图、对话和页面信息会公开显示在 GitHub Issues，请勿包含个人隐私。",
                    feedbackEnglish.ui.publicDisclosure,
                  )}
                </p>
                <p className="feedback-request-note">
                  {t(
                    "请认真描述与本站有关的问题或建议，避免重复提交和无关内容。我们将在一周内核实并回复，确认的问题将安排修复，改进建议将评估后逐步更新。",
                    feedbackEnglish.ui.requestNote,
                  )}
                </p>
                <details className="feedback-public-details">
                  <summary>
                    {t("查看将提交的页面信息", feedbackEnglish.ui.pageDetails)}
                  </summary>
                  <dl>
                    <div>
                      <dt>{t("页面地址", feedbackEnglish.ui.pageUrl)}</dt>
                      <dd>
                        {
                          (
                            pageContextRef.current ??
                            getPageContext(learningMode)
                          ).url
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>{t("学习模式", feedbackEnglish.ui.learningMode)}</dt>
                      <dd>
                        {(pageContextRef.current?.learningMode ??
                          learningMode) === "junior"
                          ? t("初中版", feedbackEnglish.ui.juniorVersion)
                          : t("高中版", feedbackEnglish.ui.seniorVersion)}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("视口大小", feedbackEnglish.ui.viewport)}</dt>
                      <dd>
                        {pageContextRef.current?.viewport.width ??
                          window.innerWidth}{" "}
                        ×{" "}
                        {pageContextRef.current?.viewport.height ??
                          window.innerHeight}
                      </dd>
                    </div>
                  </dl>
                </details>
                <label className="feedback-consent">
                  <input
                    ref={consentRef}
                    type="checkbox"
                    checked={consent}
                    disabled={stage !== "chat"}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    {t(
                      "我已了解截图、对话和页面信息会公开显示在 GitHub Issues。",
                      feedbackEnglish.ui.consent,
                    )}
                  </span>
                </label>
              </div>
            )}
            {stage !== "chat" && (
              <div className="feedback-message feedback-message--assistant feedback-message--result">
                {stage === "sending" && (
                  <div
                    className="feedback-sending"
                    role="status"
                    aria-live="polite"
                  >
                    {uploadComplete ? (
                      <LoaderCircle
                        className="feedback-spin"
                        size={28}
                        aria-hidden="true"
                      />
                    ) : (
                      <Send size={25} aria-hidden="true" />
                    )}
                    <h3>
                      {uploadComplete
                        ? t("正在创建反馈", feedbackEnglish.ui.creatingFeedback)
                        : t("正在上传反馈", feedbackEnglish.ui.uploadingFeedback)}
                    </h3>
                    <p>
                      {uploadComplete
                        ? t(
                            "上传完成，正在等待服务器创建公开条目。",
                            feedbackEnglish.ui.uploadWaiting,
                          )
                        : t("只显示实际上传进度。", feedbackEnglish.ui.uploadProgressOnly)}
                    </p>
                    <p className="feedback-sending__close-note">
                      {t(
                        "关闭窗口后仍会继续处理，重新打开可查看结果。",
                        feedbackEnglish.ui.uploadKeepsRunning,
                      )}
                    </p>
                    {uploadProgress !== null ? (
                      <div
                        className="feedback-progress"
                        role="progressbar"
                        aria-label={t(
                          "反馈上传进度",
                          feedbackEnglish.ui.uploadProgress,
                        )}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploadProgress}
                      >
                        <span style={{ width: `${uploadProgress}%` }} />
                      </div>
                    ) : (
                      <div
                        className="feedback-progress feedback-progress--indeterminate"
                        aria-hidden="true"
                      >
                        <span />
                      </div>
                    )}
                    <span className="feedback-progress-label">
                      {uploadComplete
                        ? t("正在创建反馈", feedbackEnglish.ui.creatingFeedback)
                        : uploadProgress === null
                          ? t("正在上传", feedbackEnglish.ui.uploading)
                          : `${uploadProgress}%`}
                    </span>
                  </div>
                )}

                {stage === "error" && failure && (
                  <div
                    className="feedback-result feedback-result--error"
                    role="alert"
                  >
                    <span className="feedback-result__icon">
                      <AlertCircle size={22} aria-hidden="true" />
                    </span>
                    <h3>
                      {failure.unconfigured
                        ? t(
                            "反馈服务尚未就绪",
                            feedbackEnglish.ui.errorUnconfigured,
                          )
                        : failure.outcomeUnknown
                          ? t(
                              "提交状态待核对",
                              feedbackEnglish.ui.errorOutcomeUnknown,
                            )
                          : t(
                              "暂时没有提交成功",
                              feedbackEnglish.ui.errorNotSubmitted,
                            )}
                    </h3>
                    <p>{failure.message}</p>
                    {failure.retryAfter && (
                      <p className="feedback-result__retry-after">
                        {t(
                          `建议等待 ${formatRetryAfter(failure.retryAfter, language)} 后重试。`,
                          feedbackEnglish.ui.retryAfter(
                            formatRetryAfter(failure.retryAfter, language),
                          ),
                        )}
                      </p>
                    )}
                    <p className="feedback-result__kept">
                      {t(
                        "你填写的描述与截图仍保存在本次草稿中。",
                        feedbackEnglish.ui.draftKept,
                      )}
                    </p>
                  </div>
                )}

                {stage === "success" && receipt && (
                  <div
                    className="feedback-result feedback-result--success"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="feedback-result__icon">
                      <Check size={22} aria-hidden="true" />
                    </span>
                    <h3>{t("反馈已创建", feedbackEnglish.ui.successTitle)}</h3>
                    <p>
                      {receipt.number
                        ? t(
                            `公开反馈 #${receipt.number} 已创建。`,
                            feedbackEnglish.ui.successWithNumber(receipt.number),
                          )
                        : t(
                            "公开反馈已创建。",
                            feedbackEnglish.ui.successWithoutNumber,
                          )}{" "}
                      {t(
                        "你可以在 GitHub 上查看处理进度。",
                        feedbackEnglish.ui.successFollowUp,
                      )}
                    </p>
                    <a
                      className="feedback-button feedback-button--primary feedback-result__link"
                      href={receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("查看 GitHub 反馈", feedbackEnglish.ui.viewOnGitHub)}
                      <ChevronRight size={16} aria-hidden="true" />
                    </a>
                    <span className="feedback-result__id">
                      {t("反馈编号：", feedbackEnglish.ui.feedbackId)}
                      {payloadRef.current?.id ?? ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <label className="feedback-honeypot" aria-hidden="true">
            Website
            <input
              ref={websiteRef}
              name="website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
            />
          </label>
          <footer className="feedback-dialog__footer feedback-chat__footer">
            {stage === "chat" && !plan.complete && (
              <div className="feedback-composer">
                <div className="feedback-composer__input">
                  <textarea
                    ref={composerRef}
                    aria-label={t(
                      "回复反馈助手",
                      feedbackEnglish.ui.replyLabel,
                    )}
                    value={reply}
                    maxLength={FEEDBACK_ANSWER_LIMIT}
                    rows={2}
                    placeholder={t(
                      "说说你遇到的情况…",
                      feedbackEnglish.ui.replyPlaceholder,
                    )}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing &&
                        event.keyCode !== 229
                      ) {
                        event.preventDefault();
                        sendAnswer();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="feedback-composer__send"
                    aria-label={t("发送回复", feedbackEnglish.ui.sendReply)}
                    disabled={!reply.trim()}
                    onClick={() => sendAnswer()}
                  >
                    <Send size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="feedback-composer__meta">
                  {answers.length > 0 ? (
                    <button type="button" onClick={editLastAnswer}>
                      {t("修改上一条", feedbackEnglish.ui.editLastAnswer)}
                    </button>
                  ) : (
                    <span>
                      {t(
                        "确认前，截图和对话仅保存在本次草稿中",
                        feedbackEnglish.ui.draftOnly,
                      )}
                    </span>
                  )}
                  <span>
                    {reply.length}/{FEEDBACK_ANSWER_LIMIT}
                  </span>
                </div>
              </div>
            )}
            {stage === "chat" && plan.complete && (
              <>
                <button
                  type="button"
                  className="feedback-button feedback-button--quiet"
                  onClick={editLastAnswer}
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  {t("修改上一条", feedbackEnglish.ui.editLastAnswer)}
                </button>
                <button
                  type="button"
                  className="feedback-button feedback-button--primary"
                  disabled={!consent || !validDescription}
                  onClick={() => void submit()}
                >
                  {t("确认并上传", feedbackEnglish.ui.confirmUpload)}
                  <Send size={15} aria-hidden="true" />
                </button>
              </>
            )}
            {stage === "sending" && (
              <button
                type="button"
                className="feedback-button feedback-button--quiet"
                onClick={closeWidget}
              >
                {t("关闭进度窗口", feedbackEnglish.ui.closeProgress)}
              </button>
            )}
            {stage === "error" && (
              <>
                {!failure?.outcomeUnknown && (
                  <button
                    type="button"
                    className="feedback-button feedback-button--quiet"
                    onClick={editLastAnswer}
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    {t("修改上一条", feedbackEnglish.ui.editLastAnswer)}
                  </button>
                )}
                <button
                  type="button"
                  className="feedback-button feedback-button--primary"
                  onClick={() => void submit()}
                  disabled={!consent || !validDescription}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  {failure?.outcomeUnknown
                    ? t("使用原编号重试", feedbackEnglish.ui.retrySameId)
                    : t("重试提交", feedbackEnglish.ui.retry)}
                </button>
              </>
            )}
            {stage === "success" && (
              <>
                <button
                  type="button"
                  className="feedback-button feedback-button--quiet"
                  onClick={startNewFeedback}
                >
                  {t("新建反馈", feedbackEnglish.ui.newFeedback)}
                </button>
                <button
                  type="button"
                  className="feedback-button feedback-button--primary"
                  onClick={closeWidget}
                >
                  {t("完成", feedbackEnglish.ui.done)}
                </button>
              </>
            )}
          </footer>
        </section>
      )}
    </dialog>
  );

  return (
    <>
      {launcherHost?.isConnected ? (
        createPortal(launcher, launcherHost)
      ) : (
        <div className="feedback-launcher-dock" data-feedback-ui>
          {launcher}
        </div>
      )}
      {countdown !== null &&
        createPortal(
          <div
            className="feedback-countdown"
            data-feedback-ui
            role="status"
            aria-live="polite"
          >
            <Camera size={16} aria-hidden="true" />
            <span>
              {language === "en" ? (
                <>
                  {countdown === 1
                    ? feedbackEnglish.ui.countdownOne
                    : feedbackEnglish.ui.countdown(countdown)}
                </>
              ) : (
                <>
                  <strong>{countdown}</strong> 秒后重新截取当前页面
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                clearCountdown();
                captureAttemptRef.current += 1;
                setCaptureBusy(false);
                if (capture) setIsOpen(true);
                else void beginCapture();
              }}
            >
              {t("取消", feedbackEnglish.ui.cancel)}
            </button>
          </div>,
          launcherHost?.isConnected ? launcherHost : document.body,
        )}
      {createPortal(dialog, document.body)}
    </>
  );
}

export default FeedbackWidget;

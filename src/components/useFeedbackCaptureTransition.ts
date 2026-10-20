import { useLayoutEffect, type RefObject } from "react";
import type { ViewportSnapshot } from "./feedback-capture";
export interface FeedbackCaptureFlight {
  snapshot: ViewportSnapshot;
  from: { x: number; y: number; width: number; height: number };
}
/** Keep the selected pixels continuous while the real attachment mounts. */
export function useFeedbackCaptureTransition({
  flight,
  active,
  reduced,
  dialog,
  attachment,
  onDone,
}: {
  flight: FeedbackCaptureFlight | null;
  active: boolean;
  reduced: boolean;
  dialog: RefObject<HTMLDialogElement | null>;
  attachment: RefObject<HTMLImageElement | null>;
  onDone: () => void;
}) {
  useLayoutEffect(() => {
    if (!flight || !active) return;
    const panel = dialog.current,
      target = attachment.current;
    if (reduced || !panel || !target || !HTMLElement.prototype.showPopover) {
      onDone();
      return;
    }
    const to = target.getBoundingClientRect(),
      from = flight.from;
    if (!to.width || !to.height) {
      onDone();
      return;
    }
    const ghost = document.createElement("div");
    ghost.className = "feedback-capture-flight";
    ghost.setAttribute("popover", "manual");
    ghost.setAttribute("data-feedback-ui", "");
    ghost.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.src = flight.snapshot.dataUrl;
    ghost.append(image);
    ghost.style.width = `${to.width}px`;
    ghost.style.height = `${to.height}px`;
    document.body.append(ghost);
    ghost.showPopover();
    const ease = "cubic-bezier(0.23, 1, 0.32, 1)";
    const movement = ghost.animate(
      [
        {
          transform: `translate(${from.x}px, ${from.y}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          borderRadius: "2px",
        },
        {
          transform: `translate(${to.x}px, ${to.y}px) scale(1)`,
          borderRadius: "10px",
        },
      ],
      { duration: 550, easing: ease, fill: "both" },
    );
    const panelEntrance = panel.animate(
      [
        { opacity: 0, transform: "translateY(8px) scale(.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 250, delay: 80, easing: ease, fill: "both" },
    );
    let stopped = false;
    const finish = () => {
      if (stopped) return;
      stopped = true;
      ghost.remove();
      movement.cancel();
      panelEntrance.cancel();
      onDone();
    };
    movement.finished.then(finish, () => {});
    window.addEventListener("resize", finish);
    panel.addEventListener("pointerdown", finish, true);
    panel.addEventListener("keydown", finish, true);
    return () => {
      stopped = true;
      movement.cancel();
      panelEntrance.cancel();
      ghost.remove();
      window.removeEventListener("resize", finish);
      panel.removeEventListener("pointerdown", finish, true);
      panel.removeEventListener("keydown", finish, true);
    };
  }, [flight, active, reduced, dialog, attachment, onDone]);
}

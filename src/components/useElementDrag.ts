import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { ElementSelection } from "./CompoundWorkbench";
import { assignSelectedElement } from "../data/element-selection";

type Ghost = {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type Pending = Ghost & {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  pointerId: number;
  sourceIndex: number | null;
  dragging: boolean;
};

/** Mouse drag is optional; slot selection remains the keyboard and touch path. */
export function useElementDrag({
  selection,
  onSelectionChange,
  onStart,
  disabled,
}: {
  selection: ElementSelection;
  onSelectionChange: (selection: ElementSelection) => void;
  onStart: () => void;
  disabled: boolean;
}) {
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [drop, setDrop] = useState<{ over: boolean; slot: number | null }>({
    over: false,
    slot: null,
  });
  const pending = useRef<Pending | null>(null);
  const canceledPointerId = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const suppressionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ selection, onSelectionChange, onStart, disabled });
  latest.current = { selection, onSelectionChange, onStart, disabled };

  const clearSuppression = () => {
    suppressClick.current = false;
    if (suppressionTimer.current !== null) {
      clearTimeout(suppressionTimer.current);
      suppressionTimer.current = null;
    }
  };

  useEffect(() => {
    const hit = (x: number, y: number) => {
      const node = document.elementFromPoint(x, y);
      const over = Boolean(node?.closest("[data-compound-zone]"));
      const value = node?.closest<HTMLElement>("[data-compound-slot]")?.dataset
        .compoundSlot;
      const slot =
        value !== undefined && /^\d+$/.test(value) ? Number(value) : null;
      return { over, slot };
    };

    const suppressCompatibilityClick = () => {
      clearSuppression();
      suppressClick.current = true;
      // Pointer-generated click follows pointerup in the same event turn. Let
      // that click be consumed, then keep the next deliberate click available.
      suppressionTimer.current = setTimeout(clearSuppression, 0);
    };
    const clearVisualState = () => {
      pending.current = null;
      setGhost(null);
      setDrop({ over: false, slot: null });
      document.body.classList.remove("is-dragging-element");
    };
    const cancelPending = (rememberPointer: boolean) => {
      const current = pending.current;
      if (rememberPointer && current)
        canceledPointerId.current = current.pointerId;
      clearVisualState();
    };
    const removeSelected = (current: Pending) => {
      const { selection: selected, onSelectionChange: change } = latest.current;
      const index = current.sourceIndex;
      if (index === null || selected[index] !== current.elementId) return;
      const next = [...selected];
      next.splice(index, 1);
      change(next);
    };
    const placeSelected = (current: Pending, slot: number | null) => {
      const { selection: selected, onSelectionChange: change } = latest.current;
      const sourceIndex = current.sourceIndex;
      if (
        sourceIndex === null ||
        selected[sourceIndex] !== current.elementId ||
        slot === null
      )
        return;

      const targetIndex = Math.min(Math.max(0, slot), selected.length);
      if (targetIndex === sourceIndex) return;
      const next = [...selected];
      if (targetIndex === next.length) {
        next.splice(sourceIndex, 1);
        next.push(current.elementId);
      } else {
        [next[sourceIndex], next[targetIndex]] = [
          next[targetIndex],
          next[sourceIndex],
        ];
      }
      change(next);
    };

    const move = (event: globalThis.PointerEvent) => {
      const current = pending.current;
      if (!current || event.pointerId !== current.pointerId) return;
      if (latest.current.disabled) {
        cancelPending(true);
        return;
      }
      if (
        !current.dragging &&
        Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY,
        ) < 7
      )
        return;
      if (!current.dragging) {
        current.dragging = true;
        latest.current.onStart();
        document.body.classList.add("is-dragging-element");
      }
      event.preventDefault();
      setGhost({
        elementId: current.elementId,
        x: event.clientX - current.offsetX,
        y: event.clientY - current.offsetY,
        width: current.width,
        height: current.height,
      });
      setDrop(hit(event.clientX, event.clientY));
    };
    const up = (event: globalThis.PointerEvent) => {
      const current = pending.current;
      if (!current || event.pointerId !== current.pointerId) {
        if (event.pointerId === canceledPointerId.current) {
          canceledPointerId.current = null;
          suppressCompatibilityClick();
        }
        return;
      }

      if (current.dragging) {
        const target = hit(event.clientX, event.clientY);
        if (current.sourceIndex === null) {
          if (target.over) {
            const next = assignSelectedElement(
              latest.current.selection,
              current.elementId,
              target.slot ?? latest.current.selection.length,
            );
            latest.current.onSelectionChange(next);
          }
        } else if (target.over) {
          // A drop inside the workbench keeps the element there. Dropping on a
          // filled slot swaps; dropping on the append slot moves it to the end.
          placeSelected(current, target.slot);
        } else {
          removeSelected(current);
        }
        suppressCompatibilityClick();
      }
      clearVisualState();
    };
    const cancel = (event: globalThis.PointerEvent) => {
      if (pending.current?.pointerId === event.pointerId) cancelPending(false);
      if (canceledPointerId.current === event.pointerId)
        canceledPointerId.current = null;
    };
    const blur = () => cancelPending(true);
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !pending.current) return;
      event.preventDefault();
      event.stopPropagation();
      cancelPending(true);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", keydown, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", keydown, true);
      document.body.classList.remove("is-dragging-element");
      clearSuppression();
    };
  }, []);

  const begin = (
    event: PointerEvent<HTMLButtonElement>,
    elementId: string,
    sourceIndex: number | null,
  ) => {
    if (disabled || event.button !== 0 || event.pointerType !== "mouse") return;
    canceledPointerId.current = null;
    const rect = event.currentTarget.getBoundingClientRect();
    pending.current = {
      elementId,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.x,
      offsetY: event.clientY - rect.y,
      pointerId: event.pointerId,
      sourceIndex,
      dragging: false,
    };
  };

  return {
    ghost,
    dragOver: drop.over,
    activeDropSlot: drop.slot,
    consumeClick: (detail: number, _elementId: string) => {
      if (detail === 0 || !suppressClick.current) return false;
      clearSuppression();
      return true;
    },
    start: (event: PointerEvent<HTMLButtonElement>, elementId: string) =>
      begin(event, elementId, null),
    startSelected: (
      event: PointerEvent<HTMLButtonElement>,
      elementId: string,
      index: number,
    ) => begin(event, elementId, index),
  };
}

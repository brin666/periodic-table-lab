import { elementById } from "./catalog";

/** A selection represents element kinds, not atom counts or a reaction mixture. */
export function assignSelectedElement(
  selection: string[],
  elementId: string,
  slot = selection.length,
): string[] {
  if (
    !elementById[elementId] ||
    !Number.isInteger(slot) ||
    slot < 0 ||
    selection.includes(elementId)
  )
    return selection;
  const next = [...selection];
  if (slot < next.length) next[slot] = elementId;
  else next.push(elementId);
  return next;
}

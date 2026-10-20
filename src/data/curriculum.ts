import { equationById, stories, storyById, substanceById } from "./catalog";
import type { Level } from "./types";

export type LearningMode = "junior" | "senior";

// High school includes the foundations and all extension material already collected.
export function isContentVisible(mode: LearningMode, level: Level) {
  return mode === "senior" || level === "junior";
}

export function getElementContent(elementId: string, mode: LearningMode) {
  const originalStory = storyById[elementId];
  return {
    story:
      originalStory && isContentVisible(mode, originalStory.level)
        ? originalStory
        : undefined,
    // A senior story can still link to junior materials (e.g. iron and nitrogen).
    related: (originalStory?.substanceIds ?? [])
      .map((id) => substanceById[id])
      .filter((substance) => isContentVisible(mode, substance.level)),
  };
}

export function getFocusElementIds(mode: LearningMode) {
  return new Set(
    stories
      .filter((entry) => {
        const content = getElementContent(entry.elementId, mode);
        return content.story || content.related.length > 0;
      })
      .map((entry) => entry.elementId),
  );
}

export function getSubstanceEquations(substanceId: string, mode: LearningMode) {
  return substanceById[substanceId].equationIds
    .map((id) => equationById[id])
    .filter((equation) => isContentVisible(mode, equation.level));
}

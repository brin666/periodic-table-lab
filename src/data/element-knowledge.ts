import snapshot from "./element-knowledge.generated.json" with { type: "json" };
import type { KnowledgePack } from "./knowledge-map";

/** Shared cards have one record; each map receives only its own branches and sources. */
export const elementKnowledge = snapshot as KnowledgePack;
const packs = new Map<string, KnowledgePack>(
  elementKnowledge.maps.map((map) => {
    const branchIds = new Set(map.branchIds);
    const branches = elementKnowledge.branches
      .filter((branch) => branchIds.has(branch.id))
      .sort((a, b) => a.order - b.order);
    const cardIds = new Set(branches.flatMap((branch) => branch.cardIds));
    const cards = elementKnowledge.cards.filter((card) => cardIds.has(card.id));
    const sourceIds = new Set(cards.flatMap((card) => card.sourceIds));
    return [
      map.elementId,
      {
        schemaVersion: "1.0",
        maps: [map],
        branches,
        cards,
        sources: elementKnowledge.sources.filter((source) =>
          sourceIds.has(source.id),
        ),
        gaps: elementKnowledge.gaps.filter(
          (gap) => gap.elementId === map.elementId,
        ),
      },
    ];
  }),
);
export { hasKnowledgeMap } from "./knowledge-availability";
export const getKnowledgePack = (id: string) => packs.get(id);

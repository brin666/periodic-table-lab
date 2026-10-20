import { visibleKnowledge, type KnowledgePack } from "./data/knowledge-map";
export interface MapPoint {
  x: number;
  y: number;
}
export interface KnowledgeLayout {
  branches: Record<string, MapPoint>;
  cards: Record<string, MapPoint>;
  activeBranches: Set<string>;
  activeCards: Set<string>;
  bounds: { width: number; height: number };
}
export function knowledgeLayout(
  pack: KnowledgePack,
  mode: "junior" | "senior",
  collapsed: Set<string>,
): KnowledgeLayout {
  const shown = pack.branches.filter((branch) =>
    visibleKnowledge(branch.level, mode),
  );
  const useDirectionalGrid = shown.length === 4;
  const branches: Record<string, MapPoint> = {},
    cards: Record<string, MapPoint> = {};
  const activeCards = new Set<string>();
  const activeBranches = new Set(shown.map((branch) => branch.id));
  // The center element and its labels remain visible in every layout. Active
  // branch and card extents grow these base bounds; hidden nodes do not.
  let maxX = 400,
    maxY = 220;
  const includeBounds = (
    point: MapPoint,
    halfWidth: number,
    halfHeight: number,
    margin: number,
  ) => {
    maxX = Math.max(maxX, Math.abs(point.x) + halfWidth + margin);
    maxY = Math.max(maxY, Math.abs(point.y) + halfHeight + margin);
  };

  for (const branch of pack.branches) {
    const index = shown.findIndex((item) => item.id === branch.id);
    const angle =
      index < 0 ? 0 : ((-90 + (index * 360) / shown.length) * Math.PI) / 180;
    const anchor =
      index < 0
        ? { x: 0, y: 0 }
        : useDirectionalGrid
          ? [
              { x: 0, y: -155 },
              { x: 265, y: 0 },
              { x: 0, y: 155 },
              { x: -265, y: 0 },
            ][index]
          : { x: Math.cos(angle) * 265, y: Math.sin(angle) * 155 };
    branches[branch.id] = anchor;
    if (index >= 0) includeBounds(anchor, 85, 27, 24);

    const visibleCards = branch.cardIds.filter((id) => {
      const card = pack.cards.find((item) => item.id === id);
      return (
        index >= 0 &&
        !collapsed.has(branch.id) &&
        card &&
        visibleKnowledge(card.level, mode)
      );
    });
    for (const id of branch.cardIds) {
      const cardIndex = visibleCards.indexOf(id);
      if (cardIndex < 0) {
        cards[id] = anchor;
        continue;
      }
      let point: MapPoint;
      if (useDirectionalGrid) {
        if (index === 0 || index === 2) {
          const row = Math.floor(cardIndex / 3);
          const cardsInRow = Math.min(3, visibleCards.length - row * 3);
          const column = cardIndex % 3;
          const offset =
            (column - (cardsInRow - 1) / 2) * 294;
          point = {
            x: offset,
            y: (index === 0 ? -1 : 1) * (330 + row * 215),
          };
        } else {
          const column = Math.floor(cardIndex / 4);
          const cardsInColumn = Math.min(
            4,
            visibleCards.length - column * 4,
          );
          const row = cardIndex % 4;
          const offset = (row - (cardsInColumn - 1) / 2) * 215;
          point = {
            x: (index === 1 ? 1 : -1) * (665 + column * 294),
            y: offset,
          };
        }
      } else {
        const spacing = 185 + Math.abs(Math.sin(angle)) * 105;
        const offset = (cardIndex - (visibleCards.length - 1) / 2) * spacing;
        point = {
          x: Math.cos(angle) * 665 - Math.sin(angle) * offset,
          y: Math.sin(angle) * 330 + Math.cos(angle) * offset,
        };
      }
      cards[id] = point;
      activeCards.add(id);
      includeBounds(point, 130, 100, 32);
    }
  }
  return {
    branches,
    cards,
    activeBranches,
    activeCards,
    bounds: { width: maxX * 2, height: maxY * 2 },
  };
}
export const mapTransform = (p: MapPoint) =>
  `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
export const mapConnection = (a: MapPoint, b: MapPoint) =>
  `M ${a.x} ${a.y} C ${a.x + (b.x - a.x) * 0.48} ${a.y} ${b.x - (b.x - a.x) * 0.3} ${b.y} ${b.x} ${b.y}`;

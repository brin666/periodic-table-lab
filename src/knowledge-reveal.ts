import type { KnowledgePack } from "./data/knowledge-map";
import type { KnowledgeLayout } from "./knowledge-layout";

export const KNOWLEDGE_DRAW_MS = 260;
export const KNOWLEDGE_POP_MS = 240;
export const KNOWLEDGE_HANDOFF_MS = 180;

/** Interleave branches so a larger branch cannot hold up the other directions. */
export function knowledgeRevealPlan(
  branches: KnowledgePack["branches"],
  layout: KnowledgeLayout,
  previous: ReadonlySet<string>,
  enabled: boolean,
) {
  const visible = new Set<string>();
  const lineDelays: Record<string, number> = {};
  const nodeDelays: Record<string, number> = {};
  if (!enabled) return { visible, lineDelays, nodeDelays, duration: 0 };
  for (const branch of branches) {
    if (layout.activeBranches.has(branch.id)) visible.add(branch.id);
    for (const id of branch.cardIds)
      if (layout.activeCards.has(id)) visible.add(id);
  }
  const newBranches = branches.filter(
    (branch) => visible.has(branch.id) && !previous.has(branch.id),
  );
  newBranches.forEach((branch, index) => {
    lineDelays[branch.id] = index * 40;
    nodeDelays[branch.id] = index * 40 + KNOWLEDGE_HANDOFF_MS;
  });
  const rows = branches.map((branch) =>
    branch.cardIds.filter((id) => visible.has(id) && !previous.has(id)),
  );
  // Keep dense maps just as quick to enter: increase the overlap, not the wait.
  const count = rows.reduce((sum, ids) => sum + ids.length, 0);
  const interval = Math.min(30, 570 / Math.max(1, count - 1));
  let order = 0;
  for (let row = 0; row < Math.max(0, ...rows.map((ids) => ids.length)); row++)
    rows.forEach((ids, branchIndex) => {
      const id = ids[row];
      if (!id) return;
      const branch = branches[branchIndex];
      const parentIsEntering = newBranches.includes(branch);
      const lineStart = parentIsEntering
        ? Math.max((lineDelays[branch.id] ?? 0) + 160, 200 + order * interval)
        : order * interval;
      lineDelays[id] = lineStart;
      nodeDelays[id] = lineStart + KNOWLEDGE_HANDOFF_MS;
      order++;
    });
  const duration = Math.max(
    0,
    ...Object.values(nodeDelays).map((delay) => delay + KNOWLEDGE_POP_MS),
  );
  return { visible, lineDelays, nodeDelays, duration };
}

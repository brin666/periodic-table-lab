import test from "node:test";
import assert from "node:assert/strict";
import { hydrogenKnowledge as pack } from "../src/data/hydrogen-knowledge";
import { knowledgeLayout } from "../src/knowledge-layout";
import { knowledgeRevealPlan } from "../src/knowledge-reveal";

test("the twenty-card entrance interleaves branches, hands off from lines, and completes within 1.2 seconds", () => {
  const layout = knowledgeLayout(pack, "senior", new Set());
  const plan = knowledgeRevealPlan(pack.branches, layout, new Set(), true);
  assert.equal(plan.visible.size, 24);
  assert.ok(plan.duration <= 1200);
  const cardDelays = [...layout.activeCards].map((id) => plan.lineDelays[id]);
  assert.equal(new Set(cardDelays).size, 20);
  for (const id of layout.activeCards)
    assert.equal(plan.nodeDelays[id] - plan.lineDelays[id], 180);
  const firstCards = pack.branches.map((branch) =>
    branch.cardIds.find((id) => layout.activeCards.has(id))!,
  );
  assert.ok(
    Math.max(...firstCards.map((id) => plan.lineDelays[id])) -
      Math.min(...firstCards.map((id) => plan.lineDelays[id])) <=
      90,
  );
});

test("switching to senior knowledge schedules only added cards and disabled scenes stay empty", () => {
  const junior = knowledgeLayout(pack, "junior", new Set());
  const baseline = knowledgeRevealPlan(pack.branches, junior, new Set(), true);
  const senior = knowledgeLayout(pack, "senior", new Set());
  const expanded = knowledgeRevealPlan(
    pack.branches,
    senior,
    baseline.visible,
    true,
  );
  assert.equal(Object.keys(expanded.nodeDelays).length, 5);
  for (const id of junior.activeCards)
    assert.equal(expanded.nodeDelays[id], undefined);
  assert.ok(expanded.duration <= 550);
  assert.equal(
    knowledgeRevealPlan(pack.branches, senior, baseline.visible, false).visible
      .size,
    0,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  elementKnowledge,
  getKnowledgePack,
  hasKnowledgeMap,
} from "../src/data/element-knowledge";
import { hydrogenKnowledge } from "../src/data/hydrogen-knowledge";
import { getFocusElementIds } from "../src/data/curriculum";
import { elements, substances, equations } from "../src/data/catalog";
import { visibleKnowledge } from "../src/data/knowledge-map";
import { knowledgeLayout } from "../src/knowledge-layout";
import { knowledgeRevealPlan } from "../src/knowledge-reveal";

test("every focus element has its own connected, reviewed knowledge map", () => {
  assert.deepEqual(
    new Set(elementKnowledge.maps.map((map) => map.elementId)),
    getFocusElementIds("senior"),
  );
  for (const collection of [
    elementKnowledge.maps.map((map) => map.elementId),
    ...["branches", "cards", "sources"].map((field) =>
      (elementKnowledge[field as "cards"] as { id: string }[]).map(
        (item) => item.id,
      ),
    ),
  ])
    assert.equal(new Set(collection).size, collection.length);
  const elementIds = new Set(elements.map((item) => item.id));
  const substanceIds = new Set(substances.map((item) => item.id));
  const equationIds = new Set(equations.map((item) => item.id));
  for (const map of elementKnowledge.maps) {
    const pack = getKnowledgePack(map.elementId)!;
    assert.ok(hasKnowledgeMap(map.elementId));
    assert.ok(elementIds.has(map.elementId));
    assert.deepEqual(
      new Set(pack.branches.map((branch) => branch.id)),
      new Set(map.branchIds),
    );
    const referenced = pack.branches.flatMap((branch) => branch.cardIds);
    assert.equal(
      referenced.length,
      new Set(referenced).size,
      `${map.elementId}: one position per card`,
    );
    assert.deepEqual(
      new Set(referenced),
      new Set(pack.cards.map((card) => card.id)),
    );
    for (const card of pack.cards) {
      assert.equal(card.status, "verified", card.id);
      assert.ok(card.title && card.summary && card.paragraphs.length, card.id);
      assert.ok(card.sourceIds.length && card.curriculum?.volume, card.id);
      if (
        card.curriculum?.stage === "required" ||
        card.curriculum?.stage === "selective"
      )
        assert.equal(card.level, "senior", card.id);
      for (const id of card.substanceIds)
        assert.ok(substanceIds.has(id), `${card.id}: ${id}`);
      for (const id of card.equationIds)
        assert.ok(equationIds.has(id), `${card.id}: ${id}`);
      for (const id of card.sourceIds)
        assert.equal(
          pack.sources.find((source) => source.id === id)?.verification,
          "body-read",
          `${card.id}: ${id}`,
        );
      if (card.curriculum?.textbookMatch === "page-verified")
        assert.ok(
          card.sourceIds.some((id) =>
            pack.sources.some(
              (source) =>
                source.id === id &&
                source.kind === "textbook" &&
                source.pages.length > 0,
            ),
          ),
          `${card.id}: textbook page provenance`,
        );
    }
  }
  assert.equal(getKnowledgePack("og"), undefined);
});

test("the original hydrogen evidence and assets are preserved while reviewed wording remains editable", () => {
  const pack = getKnowledgePack("h")!;
  for (const card of hydrogenKnowledge.cards) {
    const { curriculum: _curriculum, ...actual } = pack.cards.find(
      (item) => item.id === card.id,
    )!;
    const evidence = (item: typeof card) =>
      Object.fromEntries(
        Object.entries(item).filter(
          ([key]) =>
            !["title", "summary", "paragraphs", "highlights"].includes(key),
        ),
      );
    assert.deepEqual(evidence(actual), evidence(card));
  }
  assert.ok(pack.cards.length > hydrogenKnowledge.cards.length);
});

test("all 25 maps fit their bounds without overlapping cards in either curriculum mode", () => {
  for (const map of elementKnowledge.maps)
    for (const mode of ["junior", "senior"] as const) {
      const pack = getKnowledgePack(map.elementId)!;
      const layout = knowledgeLayout(pack, mode, new Set());
      assert.ok(
        knowledgeRevealPlan(pack.branches, layout, new Set(), true).duration <=
          1200,
        `${map.elementId} ${mode}: quick entrance`,
      );
      const active = [...layout.activeCards].map((id) => ({
        id,
        ...layout.cards[id],
      }));
      for (const card of pack.cards)
        assert.equal(
          layout.activeCards.has(card.id),
          visibleKnowledge(card.level, mode),
          `${map.elementId} ${mode} ${card.id}`,
        );
      for (const point of active) {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(Math.abs(point.x) + 130 <= layout.bounds.width / 2);
        assert.ok(Math.abs(point.y) + 100 <= layout.bounds.height / 2);
      }
      for (let i = 0; i < active.length; i++)
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i],
            b = active[j];
          assert.ok(
            Math.abs(a.x - b.x) >= 260 || Math.abs(a.y - b.y) >= 200,
            `${map.elementId} ${mode}: ${a.id} overlaps ${b.id}`,
          );
        }
    }
});

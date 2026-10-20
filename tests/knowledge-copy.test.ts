import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { elementKnowledge } from "../src/data/element-knowledge";
import type { KnowledgePack, KnowledgeCard } from "../src/data/knowledge-map";
import copyEdits from "../src/data/knowledge-copy-edits.json" with { type: "json" };

const before = JSON.parse(
  readFileSync(
    new URL("./fixtures/knowledge-copy-before.json", import.meta.url),
    "utf8",
  ),
) as KnowledgePack;
const copyFields = new Set(["title", "summary", "paragraphs", "highlights"]);
const evidenceFields = (card: KnowledgeCard) =>
  Object.fromEntries(
    Object.entries(card).filter(([key]) => !copyFields.has(key)),
  );

test("the wording pass preserves every card's identity, curriculum, references, illustrations, and map structure", () => {
  for (const field of [
    "schemaVersion",
    "maps",
    "branches",
    "sources",
    "gaps",
  ] as const)
    assert.deepEqual(elementKnowledge[field], before[field], field);
  assert.equal(elementKnowledge.cards.length, before.cards.length);
  for (const original of before.cards) {
    const current = elementKnowledge.cards.find(
      (card) => card.id === original.id,
    )!;
    assert.ok(current, original.id);
    assert.deepEqual(
      evidenceFields(current),
      evidenceFields(original),
      original.id,
    );
    assert.ok(
      current.title.trim() &&
        current.summary.trim() &&
        current.paragraphs.length > 0,
      original.id,
    );
  }
});

test("edited cards contain only reviewed wording fields and their highlights match the actual copy", () => {
  const edits = copyEdits.cardEdits as Record<
    string,
    Partial<
      Pick<KnowledgeCard, "title" | "summary" | "paragraphs" | "highlights">
    >
  >;
  for (const [id, edit] of Object.entries(edits)) {
    const current = elementKnowledge.cards.find((card) => card.id === id)!;
    assert.ok(current, id);
    for (const [key, value] of Object.entries(edit)) {
      assert.ok(copyFields.has(key), `${id}: ${key}`);
      assert.deepEqual(
        current[key as keyof KnowledgeCard],
        value,
        `${id}: applied ${key}`,
      );
    }
    const text = [current.title, current.summary, ...current.paragraphs].join(
      "\n",
    );
    for (const phrase of current.highlights)
      assert.ok(text.includes(phrase), `${id}: stale highlight ${phrase}`);
  }
});

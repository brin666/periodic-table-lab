import test from "node:test";
import assert from "node:assert/strict";
import { elementKnowledge } from "../src/data/element-knowledge";
import {
  hasKnowledgeMap,
  knowledgeElementIds,
} from "../src/data/knowledge-availability";

test("lightweight route metadata matches every reviewed knowledge map", () => {
  assert.deepEqual(
    new Set(knowledgeElementIds),
    new Set(elementKnowledge.maps.map((map) => map.elementId)),
  );
  assert.equal(knowledgeElementIds.length, 25);
  for (const map of elementKnowledge.maps)
    assert.equal(hasKnowledgeMap(map.elementId), true);
  assert.equal(hasKnowledgeMap("og"), false);
  assert.equal(hasKnowledgeMap(""), false);
});

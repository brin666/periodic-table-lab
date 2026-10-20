import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getKnowledgePack } from "../src/data/element-knowledge";
import { knowledgeElementIds } from "../src/data/knowledge-availability";

test("all runtime element chunks exactly match the reviewed knowledge packs", async () => {
  for (const id of knowledgeElementIds) {
    const data = await readFile(
      new URL(
        `../src/data/knowledge-packs.generated/${id}.json`,
        import.meta.url,
      ),
      "utf8",
    );
    assert.deepEqual(JSON.parse(data), getKnowledgePack(id), id);
  }
});

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  knowledgeEnglish,
  localizeKnowledgePack,
} from "../src/i18n/knowledge-en";
import type { KnowledgePack } from "../src/data/knowledge-map";

const packDirectory = resolve("src/data/knowledge-packs.generated");
const packs = readdirSync(packDirectory)
  .filter((name) => name.endsWith(".json"))
  .map((name) => ({
    name,
    pack: JSON.parse(
      readFileSync(resolve(packDirectory, name), "utf8"),
    ) as KnowledgePack,
  }));
const containsCjk = (text: string) => /[\u3400-\u9fff]/.test(text);

test("all generated knowledge maps have complete English display content", () => {
  const cardIds = new Set<string>();
  const branchIds = new Set<string>();
  let placements = 0;

  assert.equal(packs.length, 25, "expected all 25 generated element packs");

  for (const { name, pack } of packs) {
    const english = localizeKnowledgePack(pack, knowledgeEnglish);
    assert.deepEqual(
      english.branches.map((branch) => branch.id),
      pack.branches.map((branch) => branch.id),
      `${name}: branch IDs must remain stable`,
    );
    assert.deepEqual(
      english.cards.map((card) => card.id),
      pack.cards.map((card) => card.id),
      `${name}: card IDs must remain stable`,
    );
    assert.deepEqual(
      english.sources.map((source) => source.id),
      pack.sources.map((source) => source.id),
      `${name}: source IDs must remain stable`,
    );
    assert.deepEqual(
      english.sources.map((source) => source.url),
      pack.sources.map((source) => source.url),
      `${name}: source URLs must remain unchanged`,
    );

    for (const branch of english.branches) {
      branchIds.add(branch.id);
      assert.ok(branch.title.trim());
      assert.equal(containsCjk(branch.title), false, `${name}: ${branch.id}`);
    }
    for (const card of english.cards) {
      cardIds.add(card.id);
      placements += 1;
      const original = pack.cards.find((item) => item.id === card.id)!;
      const displayText = [
        card.title,
        card.summary,
        ...card.paragraphs,
        ...card.highlights,
        card.curriculum?.volume ?? "",
        card.curriculum?.chapter ?? "",
      ];
      assert.equal(card.paragraphs.length, original.paragraphs.length);
      assert.equal(card.highlights.length, original.highlights.length, `${name}: ${card.id} changed highlight segment count`);
      assert.equal(card.curriculum?.stage, original.curriculum?.stage);
      assert.equal(card.curriculum?.textbookMatch, original.curriculum?.textbookMatch);
      assert.ok(card.title.trim(), `${name}: ${card.id} needs a title`);
      assert.ok(card.summary.trim(), `${name}: ${card.id} needs a summary`);
      for (const text of displayText) {
        assert.equal(
          containsCjk(text),
          false,
          `${name}: ${card.id} still has Chinese display text: ${text}`,
        );
      }
    }
    for (const source of english.sources) {
      for (const text of [source.title, source.publisher, source.edition ?? "", source.volume ?? "", source.note]) {
        assert.equal(
          containsCjk(text),
          false,
          `${name}: ${source.id} still has Chinese source display text: ${text}`,
        );
      }
      const original = pack.sources.find((item) => item.id === source.id)!;
      if (source.kind === "textbook") {
        assert.match(
          source.title,
          /^Chinese-language original · /,
          `${name}: textbook sources must be labeled as Chinese-language originals`,
        );
      }
      assert.deepEqual(source.pages, original.pages, `${name}: source page links must remain unchanged`);
    }
    for (const gap of english.gaps) {
      assert.equal(
        containsCjk(gap.reason),
        false,
        `${name}: ${gap.elementId} gap still has Chinese display text`,
      );
    }
  }

  assert.equal(branchIds.size, 92, "expected 92 unique branch IDs");
  assert.equal(cardIds.size, 228, "expected 228 unique knowledge-card IDs");
  assert.equal(placements, 265, "expected 265 card placements across the maps");
});

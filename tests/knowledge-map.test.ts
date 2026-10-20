import test from "node:test";
import assert from "node:assert/strict";
import {
  hydrogenKnowledgeMock,
  visibleKnowledge,
} from "../src/data/knowledge-map";
import { hydrogenKnowledge } from "../src/data/hydrogen-knowledge";
import {
  elements,
  equations,
  substances,
} from "../src/data/catalog";
import { knowledgeLayout } from "../src/knowledge-layout";

const pack = hydrogenKnowledgeMock;

test("the hydrogen preview is a connected, explicitly mock learning pack", () => {
  assert.equal(pack.schemaVersion, "1.0");
  assert.deepEqual(pack.maps, [
    {
      elementId: "h",
      branchIds: ["h-atom", "h-gas", "h-materials", "h-reactions"],
    },
  ]);

  const branchIds = new Set(pack.branches.map((branch) => branch.id));
  const cardIds = new Set(pack.cards.map((card) => card.id));
  const sourceIds = new Set(pack.sources.map((source) => source.id));
  assert.equal(branchIds.size, pack.branches.length);
  assert.equal(cardIds.size, pack.cards.length);
  assert.equal(sourceIds.size, pack.sources.length);
  assert.deepEqual(
    pack.maps[0].branchIds,
    pack.branches.map((branch) => branch.id),
  );
  assert.deepEqual(
    pack.branches.map((branch) => branch.order),
    [0, 1, 2, 3],
  );

  const referencedCards: string[] = [];
  for (const branch of pack.branches) {
    assert.equal(branch.elementId, "h");
    assert.ok(branch.cardIds.length > 0, `${branch.id} has cards`);
    for (const id of branch.cardIds) {
      assert.ok(cardIds.has(id), `${branch.id} refers to existing card ${id}`);
      referencedCards.push(id);
    }
  }
  assert.equal(new Set(referencedCards).size, referencedCards.length);
  assert.deepEqual(new Set(referencedCards), cardIds);

  for (const card of pack.cards) {
    assert.equal(card.status, "mock", `${card.id} remains labeled as mock`);
    assert.deepEqual(card.elementIds, ["h"]);
    assert.ok(card.title.trim().length > 0, `${card.id} has a title`);
    assert.ok(
      card.summary.trim().length > 0,
      `${card.id} has a visible summary`,
    );
    assert.equal(card.sourceIds.length, 1, `${card.id} has one source entry`);
    assert.ok(sourceIds.has(card.sourceIds[0]), `${card.id} source exists`);
  }

  for (const source of pack.sources) {
    assert.equal(
      source.verification,
      "pending",
      `${source.id} is not verified`,
    );
    assert.equal(source.url, null, `${source.id} does not invent a source URL`);
    assert.equal(source.edition, null);
    assert.equal(source.volume, null);
    assert.deepEqual(
      source.pages,
      [],
      `${source.id} has no fabricated page links`,
    );
  }
  assert.ok(pack.gaps.length > 0, "content collection gaps stay explicit");
});

test("junior and senior layouts expose the intended branches and card counts", () => {
  const junior = knowledgeLayout(pack, "junior", new Set());
  const senior = knowledgeLayout(pack, "senior", new Set());

  assert.equal(
    pack.branches.filter((branch) => branch.level === "junior").length,
    3,
  );
  assert.equal(pack.cards.filter((card) => card.level === "junior").length, 6);
  assert.equal(pack.cards.filter((card) => card.level === "senior").length, 3);
  assert.equal(
    pack.cards.filter((card) => card.level === "extension").length,
    1,
  );
  assert.equal(junior.activeBranches.size, 3);
  assert.equal(junior.activeCards.size, 6);
  assert.equal(senior.activeBranches.size, 4);
  assert.equal(senior.activeCards.size, 10);

  for (const card of pack.cards) {
    assert.equal(
      junior.activeCards.has(card.id),
      visibleKnowledge(card.level, "junior"),
      `${card.id} follows junior visibility`,
    );
    assert.equal(
      senior.activeCards.has(card.id),
      visibleKnowledge(card.level, "senior"),
      `${card.id} follows senior visibility`,
    );
  }

  // Shared nodes move into the space available at each level instead of
  // keeping senior-only positions reserved in the junior map.
  assert.notDeepEqual(junior.branches["h-gas"], senior.branches["h-gas"]);
  assert.notDeepEqual(junior.cards["h-molecule"], senior.cards["h-molecule"]);
});

test("layout coordinates are finite, fit their bounds, and keep active cards apart", () => {
  const cardWidth = 260;
  const cardHeight = 170;

  for (const mode of ["junior", "senior"] as const) {
    const layout = knowledgeLayout(pack, mode, new Set());
    assert.ok(layout.bounds.width > 0 && layout.bounds.height > 0);

    for (const point of [
      ...Object.values(layout.branches),
      ...Object.values(layout.cards),
    ]) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }

    const active = [...layout.activeCards].map((id) => ({
      id,
      ...layout.cards[id],
    }));
    for (const card of active) {
      assert.ok(Math.abs(card.x) + cardWidth / 2 <= layout.bounds.width / 2);
      assert.ok(Math.abs(card.y) + cardHeight / 2 <= layout.bounds.height / 2);
    }
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const overlapX = Math.abs(a.x - b.x) < cardWidth;
        const overlapY = Math.abs(a.y - b.y) < cardHeight;
        assert.ok(
          !(overlapX && overlapY),
          `${mode} cards ${a.id} and ${b.id} overlap at 260×170`,
        );
      }
    }
  }
});

test("collapsing one branch hides only its cards and leaves other branch positions stable", () => {
  const expanded = knowledgeLayout(pack, "senior", new Set());
  const collapsed = knowledgeLayout(pack, "senior", new Set(["h-atom"]));
  const hiddenCount = pack.branches.find((branch) => branch.id === "h-atom")!
    .cardIds.length;

  assert.equal(
    collapsed.activeCards.size,
    expanded.activeCards.size - hiddenCount,
  );
  for (const id of pack.branches.find((branch) => branch.id === "h-atom")!
    .cardIds)
    assert.equal(collapsed.activeCards.has(id), false);
  for (const id of pack.branches.find((branch) => branch.id === "h-gas")!
    .cardIds) {
    assert.equal(collapsed.activeCards.has(id), true);
    assert.deepEqual(collapsed.cards[id], expanded.cards[id]);
  }
});

test("the reviewed hydrogen pack has verified, connected content and sources", () => {
  const pack = hydrogenKnowledge;
  const branchIds = new Set(pack.branches.map((branch) => branch.id));
  const cardIds = new Set(pack.cards.map((card) => card.id));
  const sourceById = new Map(pack.sources.map((source) => [source.id, source]));
  const elementIds = new Set(elements.map((element) => element.id));
  const substanceById = new Map(
    substances.map((substance) => [substance.id, substance]),
  );
  const equationById = new Map(equations.map((equation) => [equation.id, equation]));

  assert.equal(pack.maps.length, 1);
  assert.equal(pack.maps[0].elementId, "h");
  assert.equal(pack.cards.length, 20);
  assert.equal(pack.sources.length, 26);
  assert.equal(pack.sources.filter((source) => source.kind === "textbook").length, 14);
  assert.equal(pack.sources.filter((source) => source.kind === "reference").length, 12);
  assert.ok(pack.branches.every((branch) => branch.level === "junior"));
  assert.ok(pack.cards.every((card) => card.status === "verified"));
  assert.ok(pack.cards.every((card) => card.title.trim() && card.summary.trim()));

  const linkedCardIds: string[] = [];
  for (const branch of pack.branches) {
    assert.ok(branchIds.has(branch.id));
    assert.equal(branch.elementId, "h");
    for (const cardId of branch.cardIds) {
      assert.ok(cardIds.has(cardId), `${branch.id} links to ${cardId}`);
      linkedCardIds.push(cardId);
    }
  }
  assert.equal(new Set(linkedCardIds).size, pack.cards.length);

  for (const card of pack.cards) {
    assert.ok(card.elementIds.includes("h"), `${card.id} is about hydrogen`);
    assert.ok(card.elementIds.every((id) => elementIds.has(id)), `${card.id} element links resolve`);
    assert.ok(card.sourceIds.length > 0, `${card.id} has sources`);
    assert.ok(card.sourceIds.every((id) => sourceById.has(id)), `${card.id} source links resolve`);
    assert.ok(card.substanceIds.every((id) => substanceById.has(id)), `${card.id} substance links resolve`);
    assert.ok(card.equationIds.every((id) => equationById.has(id)), `${card.id} equation links resolve`);

    const linkedSubstances = new Set(card.substanceIds);
    for (const equationId of card.equationIds) {
      const equation = equationById.get(equationId)!;
      const terms = [...equation.reactants, ...equation.products];
      if (card.subjectType === "reaction")
        for (const term of terms)
          assert.ok(
            linkedSubstances.has(term.substanceId),
            `${card.id} links all participants in ${equationId}`,
          );

      const atomTotals = (side: typeof equation.reactants) =>
        side.reduce<Record<string, number>>((total, term) => {
          const substance = substanceById.get(term.substanceId)!;
          for (const [elementId, count] of Object.entries(substance.composition))
            total[elementId] = (total[elementId] ?? 0) + count * term.coefficient;
          return total;
        }, {});
      assert.deepEqual(
        atomTotals(equation.reactants),
        atomTotals(equation.products),
        `${equationId} is atom-balanced`,
      );
    }
  }

  assert.ok(pack.sources.every((source) => source.verification === "body-read"));
  assert.ok(
    pack.sources
      .filter((source) => source.kind === "textbook")
      .every((source) => source.pages.length > 0),
  );
  const verifiedPages = pack.sources.flatMap((source) =>
    source.pages
      .filter((page) => page.linkVerified)
      .map((page) => ({ source, page })),
  );
  assert.ok(verifiedPages.length >= 14);
  assert.equal(
    new Set(verifiedPages.map(({ page }) => page.pageUrl)).size,
    verifiedPages.length,
  );
  for (const { source, page } of verifiedPages) {
    assert.equal(source.kind, "textbook");
    assert.equal(source.verification, "body-read");
    assert.ok(source.publisher.trim().length > 0);
    assert.ok(source.edition?.trim().length, `${source.id} has edition boundaries`);
    assert.ok(page.printedPage > 0 && page.readerPage > 0);
    assert.equal(new URL(page.pageUrl).protocol, "https:");
  }
  const linkedSources = new Set(pack.cards.flatMap((card) => card.sourceIds));
  assert.ok(pack.sources.every((source) => linkedSources.has(source.id)));
});

test("the real pack exposes 15 junior cards and a collision-free 20-card senior layout", () => {
  const pack = hydrogenKnowledge;
  const junior = knowledgeLayout(pack, "junior", new Set());
  const senior = knowledgeLayout(pack, "senior", new Set());
  const expectedByBranch = [2, 3, 5, 5];

  assert.deepEqual(
    pack.branches.map((branch) =>
      branch.cardIds.filter((id) => pack.cards.find((card) => card.id === id)?.level === "junior").length,
    ),
    expectedByBranch,
  );
  assert.deepEqual(
    pack.branches.map((branch) => branch.cardIds.length),
    [4, 4, 5, 7],
  );
  assert.equal(junior.activeBranches.size, 4);
  assert.equal(junior.activeCards.size, 15);
  assert.equal(senior.activeBranches.size, 4);
  assert.equal(senior.activeCards.size, 20);
  assert.ok(
    [...junior.activeCards].every(
      (id) => pack.cards.find((card) => card.id === id)?.level === "junior",
    ),
  );

  const cardWidth = 260;
  const cardHeight = 200;
  for (const [mode, layout] of [
    ["junior", junior],
    ["senior", senior],
  ] as const) {
    assert.ok(layout.bounds.width > 0 && layout.bounds.height > 0);
    for (const point of [...Object.values(layout.branches), ...Object.values(layout.cards)])
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));

    const active = [...layout.activeCards].map((id) => ({ id, ...layout.cards[id] }));
    for (const card of active) {
      assert.ok(Math.abs(card.x) + cardWidth / 2 <= layout.bounds.width / 2);
      assert.ok(Math.abs(card.y) + cardHeight / 2 <= layout.bounds.height / 2);
    }
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const overlapX = Math.abs(a.x - b.x) < cardWidth;
        const overlapY = Math.abs(a.y - b.y) < cardHeight;
        assert.ok(
          !(overlapX && overlapY),
          `${mode} cards ${a.id} and ${b.id} overlap at 260×200`,
        );
      }
    }
  }
});

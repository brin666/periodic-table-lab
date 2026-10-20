import test from "node:test";
import assert from "node:assert/strict";
import {
  elements,
  sources,
  substances,
  substanceById,
} from "../src/data/catalog";
import {
  extendedCompounds,
  extensionCompoundSources,
} from "../src/data/compound-extensions";
import {
  compoundGameExpansion,
  compoundGameExpansionSources,
} from "../src/data/compound-game-expansion";
import { inorganicCompounds } from "../src/data/inorganic-compounds";
import {
  findCompounds,
  discoveryReferenceCompounds,
} from "../src/data/compound-discovery";
import { isInorganicDiscoveryEntry } from "../src/data/compound-scope";

const symbolToId = new Map(elements.map(({ symbol, id }) => [symbol, id]));
const elementIds = new Set(elements.map(({ id }) => id));

function parseFormula(formula: string): Map<string, number> {
  const total = new Map<string, number>();
  const add = (
    into: Map<string, number>,
    from: Map<string, number>,
    factor: number,
  ) => {
    for (const [id, count] of from)
      into.set(id, (into.get(id) ?? 0) + count * factor);
  };
  const readInteger = (text: string, state: { index: number }) => {
    const start = state.index;
    while (/\d/.test(text[state.index] ?? "")) state.index += 1;
    return start === state.index ? 1 : Number(text.slice(start, state.index));
  };

  const segments = formula.split(/[·⋅.]/u);
  assert.ok(
    segments.length > 0 && segments.every(Boolean),
    `${formula} has no empty hydrate segment`,
  );

  for (const segment of segments) {
    const state = { index: 0 };
    const coefficient = readInteger(segment, state);
    assert.ok(coefficient > 0, `${formula} has a positive hydrate coefficient`);

    const parseGroup = (closing?: ")" | "]"): Map<string, number> => {
      const group = new Map<string, number>();
      while (state.index < segment.length) {
        const char = segment[state.index];
        if (char === ")" || char === "]") {
          assert.equal(
            char,
            closing,
            `${formula} closes its formula groups in order`,
          );
          state.index += 1;
          return group;
        }
        if (char === "(" || char === "[") {
          state.index += 1;
          const nested = parseGroup(char === "(" ? ")" : "]");
          const multiplier = readInteger(segment, state);
          assert.ok(
            multiplier > 0,
            `${formula} has a positive group multiplier`,
          );
          add(group, nested, multiplier);
          continue;
        }

        assert.match(
          char ?? "",
          /[A-Z]/u,
          `${formula} has a valid element symbol at ${state.index}`,
        );
        const symbolStart = state.index;
        state.index += 1;
        while (/[a-z]/u.test(segment[state.index] ?? "")) state.index += 1;
        const symbol = segment.slice(symbolStart, state.index);
        const elementId = symbolToId.get(symbol);
        assert.ok(elementId, `${formula} contains known element ${symbol}`);
        const count = readInteger(segment, state);
        assert.ok(count > 0, `${formula} has a positive count for ${symbol}`);
        group.set(elementId, (group.get(elementId) ?? 0) + count);
      }
      assert.equal(closing, undefined, `${formula} closes every formula group`);
      return group;
    };

    add(total, parseGroup(), coefficient);
    assert.equal(state.index, segment.length, `${formula} is fully parsed`);
  }
  return total;
}

function compositionOf(formula: string): Record<string, number> {
  return Object.fromEntries(
    [...parseFormula(formula)].sort(([a], [b]) => a.localeCompare(b)),
  );
}

function normalizedComposition(composition: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(composition)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function selectedIds(results: ReturnType<typeof findCompounds>) {
  return results.map(({ id }) => id);
}

function assertExactSelection(
  results: ReturnType<typeof findCompounds>,
  selection: string[],
) {
  const expected = [...new Set(selection)].sort();
  for (const result of results) {
    const actual = Object.keys(result.composition)
      .filter((elementId) => result.composition[elementId] > 0)
      .sort();
    assert.deepEqual(
      actual,
      expected,
      `${result.id} contains exactly the selected elements`,
    );
  }
}

function assertContainsSelectedElement(
  results: ReturnType<typeof findCompounds>,
  elementId: string,
) {
  assert.ok(results.length > 0);
  for (const result of results)
    assert.ok(
      result.composition[elementId] > 0,
      `${result.id} contains selected element ${elementId}`,
    );
}

test("the formula parser counts nested parentheses, square brackets, and hydrate segments", () => {
  assert.deepEqual(compositionOf("K4[Fe(CN)6]·3H2O"), {
    c: 6,
    fe: 1,
    h: 6,
    k: 4,
    n: 6,
    o: 3,
  });
});

test("extension references have closed IDs and real, non-pending source records", () => {
  const references = [...extendedCompounds, ...compoundGameExpansion];
  const referenceIds = references.map(({ id }) => id);
  const referenceSources = [
    ...extensionCompoundSources,
    ...compoundGameExpansionSources,
  ];
  const sourceIds = referenceSources.map(({ id }) => id);
  const catalogIds = new Set(substances.map(({ id }) => id));
  const catalogSourceIds = new Set(sources.map(({ id }) => id));
  const extensionSourceById = new Map(
    referenceSources.map((source) => [source.id, source]),
  );
  const existingPubChemIds = new Set(
    [...extendedCompounds, ...inorganicCompounds]
      .flatMap(({ sourceIds: ids }) => ids)
      .filter((id) => id.startsWith("pubchem-compound-")),
  );

  assert.ok(extendedCompounds.length > 0);
  assert.equal(compoundGameExpansion.length, 35);
  assert.equal(new Set(referenceIds).size, referenceIds.length);
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  for (const id of referenceIds)
    assert.ok(
      !catalogIds.has(id),
      `${id} does not collide with a catalog substance`,
    );
  for (const record of compoundGameExpansion)
    for (const id of record.sourceIds)
      assert.ok(
        !existingPubChemIds.has(id),
        `${record.id} is a newly verified PubChem identity`,
      );
  for (const id of sourceIds)
    assert.ok(
      !catalogSourceIds.has(id),
      `${id} does not collide with a catalog source`,
    );

  for (const reference of references) {
    assert.ok(reference.id.trim());
    assert.ok(reference.name.trim());
    assert.ok(reference.formula.trim());
    assert.ok(reference.nameExplanation.trim());
    assert.ok(reference.summary.trim());
    assert.deepEqual(
      normalizedComposition(compositionOf(reference.formula)),
      normalizedComposition(reference.composition),
      `${reference.id} formula agrees with its elemental composition`,
    );
    assert.ok(Object.keys(reference.composition).length >= 2);
    for (const [elementId, count] of Object.entries(reference.composition)) {
      assert.ok(
        elementIds.has(elementId),
        `${reference.id} element ${elementId} resolves`,
      );
      assert.ok(
        Number.isInteger(count) && count > 0,
        `${reference.id} has a positive integer count`,
      );
    }
    assert.ok(reference.aliases.every((alias) => alias.trim()));
    assert.ok(reference.sourceIds.length > 0);
    assert.equal(new Set(reference.sourceIds).size, reference.sourceIds.length);
    for (const id of reference.sourceIds)
      assert.ok(
        extensionSourceById.has(id),
        `${reference.id} source ${id} resolves`,
      );

    const discovered = findCompounds(
      Object.keys(reference.composition),
      "senior",
    ).find(({ id }) => id === reference.id);
    if (!isInorganicDiscoveryEntry(reference)) {
      assert.equal(
        discovered,
        undefined,
        `${reference.id} is outside the inorganic homepage scope`,
      );
      continue;
    }
    assert.ok(discovered, `${reference.id} is discoverable in senior mode`);
    assert.equal(discovered.level, "extension");
    assert.equal(discovered.detailAvailable, true);
    assert.equal(discovered.catalogId, undefined);
    assert.equal(discovered.reference?.id, reference.id);
  }

  for (const source of extensionCompoundSources) {
    assert.ok(source.title.trim());
    assert.ok(source.publisher.trim());
    assert.ok(source.note.trim());
    assert.ok(source.accessed.trim());
    assert.equal(new URL(source.url).protocol, "https:");
    assert.notEqual(source.verification, "pending", `${source.id} was checked`);
  }
  for (const source of compoundGameExpansionSources) {
    assert.ok(source.title.trim());
    assert.ok(source.publisher.trim());
    assert.ok(source.note.includes("PUG REST JSON"));
    assert.equal(source.accessed, "2026-10-18");
    assert.equal(new URL(source.url).protocol, "https:");
    assert.equal(source.verification, "data-read");
  }
});

test("single-element discovery is inclusive while larger selections match the complete element set", () => {
  assert.deepEqual(compositionOf("Na2O"), { na: 2, o: 1 });
  assert.deepEqual(compositionOf("Na2O2"), { na: 2, o: 2 });
  const sodium = findCompounds(["na"], "senior");
  assert.ok(sodium.some(({ formula }) => formula === "NaCl"));
  assert.ok(sodium.some(({ formula }) => formula === "NaOH"));
  assertContainsSelectedElement(sodium, "na");
  assert.deepEqual(
    selectedIds(findCompounds(["na", "na"], "senior")),
    selectedIds(sodium),
  );

  const sodiumOxygen = findCompounds(["na", "o"], "senior");
  assertExactSelection(sodiumOxygen, ["na", "o"]);
  assert.ok(!sodiumOxygen.some(({ formula }) => formula === "NaOH"));
  assert.ok(sodiumOxygen.some(({ formula }) => formula === "Na2O"));
  assert.ok(sodiumOxygen.some(({ formula }) => formula === "Na2O2"));

  const hNaO = findCompounds(["h", "na", "o"], "senior");
  const reordered = findCompounds(["o", "h", "na", "h"], "senior");
  assert.deepEqual(selectedIds(reordered), selectedIds(hNaO));
  assert.ok(hNaO.some(({ formula }) => formula === "NaOH"));
  assertExactSelection(hNaO, ["h", "na", "o"]);

  const sodiumBicarbonateGroup = findCompounds(["na", "h", "c", "o"], "senior");
  assert.ok(sodiumBicarbonateGroup.some(({ formula }) => formula === "NaHCO3"));
  assert.ok(sodiumBicarbonateGroup.length > 1);
  assertExactSelection(sodiumBicarbonateGroup, ["na", "h", "c", "o"]);
  const carbonHydrogenOxygen = findCompounds(["c", "h", "o"], "senior");
  assert.ok(carbonHydrogenOxygen.some(({ id }) => id === "carbonic-acid"));
  assert.ok(
    !carbonHydrogenOxygen.some(({ id }) =>
      ["ethanol", "glucose", "fructose", "acetic-acid"].includes(id),
    ),
  );
  assert.equal(
    new Set(carbonHydrogenOxygen.map(({ id }) => id)).size,
    carbonHydrogenOxygen.length,
    "C/H/O discovery returns distinct compounds",
  );
  assertExactSelection(carbonHydrogenOxygen, ["c", "h", "o"]);

  assert.deepEqual(findCompounds(["h", "o", "na"], "senior"), hNaO);
  assertContainsSelectedElement(findCompounds(["h", "h"], "senior"), "h");
  assert.deepEqual(findCompounds([], "senior"), []);
  assert.deepEqual(findCompounds(["na", "not-an-element"], "senior"), []);
  assertExactSelection(findCompounds(["h", "na"], "senior"), ["h", "na"]);
  assert.equal(elements.length, 118);
});

test("single-carbon discovery preserves the inorganic scope and excludes organic substances", () => {
  const carbonCompounds = findCompounds(["c"], "senior");
  assertContainsSelectedElement(carbonCompounds, "c");
  assert.ok(carbonCompounds.some(({ id }) => id === "carbon-dioxide"));
  assert.ok(
    !carbonCompounds.some(({ id }) =>
      [
        "ethanol",
        "glucose",
        "fructose",
        "acetic-acid",
        "sodium-acetate",
      ].includes(id),
    ),
  );
});

test("junior discovery keeps the catalog curriculum filter and hides every extension record", () => {
  const junior = findCompounds(["h", "o"], "junior");
  assert.deepEqual(junior.map(({ id }) => id).sort(), [
    "hydrogen-peroxide",
    "water",
  ]);
  assert.ok(
    junior.every(
      ({ catalogId, reference, level }) =>
        Boolean(catalogId) && !reference && level !== "extension",
    ),
  );

  for (const extension of extendedCompounds) {
    const compositionIds = Object.keys(extension.composition);
    const results = findCompounds(compositionIds, "junior");
    assert.ok(!results.some(({ id }) => id === extension.id));
  }
});

test("every discovered formula agrees with the composition and extension reference", () => {
  for (const mode of ["junior", "senior"] as const) {
    for (const selection of [
      ["h", "o"],
      ["h", "na", "o"],
      ["na", "h", "c", "o"],
      ["c", "h", "o"],
    ]) {
      for (const result of findCompounds(selection, mode)) {
        assert.deepEqual(
          normalizedComposition(compositionOf(result.formula)),
          normalizedComposition(result.composition),
          `${result.id} discovery formula agrees with composition`,
        );
        assertExactSelection([result], selection);
        if (result.catalogId) {
          assert.ok(substanceById[result.catalogId]);
          assert.equal(result.reference, undefined);
        } else {
          assert.ok(
            result.reference,
            `${result.id} extension points to its reference record`,
          );
          assert.equal(result.reference.id, result.id);
          assert.deepEqual(
            result.reference.sourceIds,
            discoveryReferenceCompounds.find(({ id }) => id === result.id)
              ?.sourceIds,
          );
          assert.ok(result.detailAvailable);
        }
      }
    }
  }
});

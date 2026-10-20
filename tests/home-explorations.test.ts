import test from "node:test";
import assert from "node:assert/strict";
import {
  elements,
  elementById,
  sourceById,
  substanceById,
} from "../src/data/catalog";
import {
  isotopeById,
  isotopeSources,
  isotopesByElement,
  teachingIsotopes,
  allIsotopes,
} from "../src/data/isotopes";
import { findBinaryCompounds } from "../src/data/compound-discovery";

test("teaching isotopes resolve element and source records with consistent Z, A, and N", () => {
  const isotopeIds = teachingIsotopes.map((isotope) => isotope.id);
  const sourceByIsotopeId = new Map(
    isotopeSources.map((source) => [source.id, source]),
  );
  const groupedIds: string[] = [];

  assert.ok(teachingIsotopes.length > 0);
  assert.equal(new Set(isotopeIds).size, isotopeIds.length);
  assert.equal(
    new Set(isotopeSources.map((source) => source.id)).size,
    isotopeSources.length,
  );

  for (const isotope of teachingIsotopes) {
    const element = elementById[isotope.elementId];
    assert.ok(element, `${isotope.id} refers to a known element`);
    assert.ok(Number.isInteger(isotope.massNumber) && isotope.massNumber > 0);
    assert.ok(isotope.massNumber >= element.number);
    assert.ok(isotope.name.trim().length > 0);
    assert.ok(isotope.summary.trim().length > 0);
    assert.ok(["stable", "radioactive"].includes(isotope.stability));
    assert.ok(isotope.sourceIds.includes("nubase2020"));
    assert.equal(new Set(isotope.sourceIds).size, isotope.sourceIds.length);
    assert.ok(isotope.sourceIds.length > 0);
    for (const sourceId of isotope.sourceIds)
      assert.ok(
        sourceByIsotopeId.has(sourceId),
        `${isotope.id} source ${sourceId} resolves`,
      );
    assert.equal(isotopeById[isotope.id], isotope);

    const neutrons = isotope.massNumber - element.number;
    assert.ok(neutrons >= 0);
    assert.equal(element.number + neutrons, isotope.massNumber);
  }

  for (const [elementId, isotopes] of Object.entries(isotopesByElement)) {
    assert.ok(elementById[elementId], `${elementId} group resolves`);
    assert.deepEqual(
      isotopes.map((isotope) => isotope.massNumber),
      [...isotopes].map((isotope) => isotope.massNumber).sort((a, b) => a - b),
      `${elementId} isotopes are ordered by mass number`,
    );
    for (const isotope of isotopes) {
      assert.equal(isotope.elementId, elementId);
      groupedIds.push(isotope.id);
    }
  }
  assert.deepEqual(
    [...groupedIds].sort(),
    allIsotopes.map((isotope) => isotope.id).sort(),
  );

  for (const source of isotopeSources) {
    assert.ok(source.title.trim().length > 0);
    assert.ok(source.publisher.trim().length > 0);
    assert.ok(source.note.trim().length > 0);
    assert.equal(new URL(source.url).protocol, "https:");
  }
  assert.ok(isotopeSources.some((source) => source.id === "nubase2020"));

  const hydrogenNuclides = isotopesByElement.h;
  assert.deepEqual(
    hydrogenNuclides
      .filter(({ massNumber }) => massNumber <= 3)
      .map(({ id, stability }) => [id, stability]),
    [
      ["h-1", "stable"],
      ["h-2", "stable"],
      ["h-3", "radioactive"],
    ],
  );
});

test("binary discovery only returns real catalog compounds with exactly the selected two elements", () => {
  const pair = ["h", "o"] as const;
  const junior = findBinaryCompounds([...pair], "junior");
  const senior = findBinaryCompounds([...pair], "senior");

  assert.deepEqual(junior.map((substance) => substance.id).sort(), [
    "hydrogen-peroxide",
    "water",
  ]);
  assert.deepEqual(senior.map((substance) => substance.id).sort(), [
    "hydrogen-peroxide",
    "water",
  ]);
  for (const substance of [...junior, ...senior]) {
    const catalogRecord = substanceById[substance.id];
    assert.ok(catalogRecord, `${substance.id} comes from the catalog`);
    assert.equal(substance.kind, "compound");
    assert.deepEqual(
      Object.keys(substance.composition)
        .filter((elementId) => substance.composition[elementId] > 0)
        .sort(),
      [...pair].sort(),
      `${substance.id} contains exactly H and O`,
    );
    assert.equal(substance.detailAvailable, true);
    assert.ok(substance.sourceIds.length > 0);
    for (const sourceId of substance.sourceIds)
      assert.ok(
        sourceById[sourceId],
        `${substance.id} source ${sourceId} resolves`,
      );
  }
  assert.ok(!junior.some((substance) => substance.id === "sulfuric-acid"));

  const seniorOnly = findBinaryCompounds(["h", "n"], "senior");
  assert.deepEqual(
    findBinaryCompounds(["h", "n"], "junior").map((substance) => substance.id),
    [],
  );
  assert.deepEqual(
    seniorOnly.map((substance) => substance.id),
    ["ammonia"],
  );
  assert.equal(seniorOnly[0].level, "senior");
  assert.equal(seniorOnly[0].detailAvailable, true);

  assert.deepEqual(findBinaryCompounds(["h", "h"], "senior"), []);
  assert.deepEqual(findBinaryCompounds([null, "o"], "senior"), []);
  assert.equal(elements.length, 118);
});

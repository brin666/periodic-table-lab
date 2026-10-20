import assert from "node:assert/strict";
import test from "node:test";
import { equations, stories, substances } from "../src/data/content";
import { sources } from "../src/data/catalog";
import {
  localizeEquation,
  localizeSource,
  localizeStory,
  localizeSubstance,
} from "../src/i18n/content-en";

const han = /[\u3400-\u9fff]/u;
test("English substance descriptions cover every detail record and preserve chemical identity", () => {
  assert.equal(substances.length, 64);
  for (const record of substances) {
    const before = JSON.stringify(record);
    const english = localizeSubstance(record, "en");
    assert.equal(english.name, record.englishName, record.id);
    for (const key of ["name", "appearance", "summary", "note"] as const)
      assert.ok(!han.test(english[key]), `${record.id}.${key}`);
    for (const key of [
      "id",
      "formula",
      "composition",
      "equationIds",
      "sourceIds",
    ] as const)
      assert.deepEqual(english[key], record[key]);
    assert.equal(localizeSubstance(record, "zh"), record);
    assert.equal(JSON.stringify(record), before);
  }
});
test("English stories cover the 25 featured elements without replacing their sources", () => {
  assert.equal(stories.length, 25);
  for (const record of stories) {
    const english = localizeStory(record, "en")!;
    assert.ok(
      !han.test(
        [
          english.headline,
          english.summary,
          ...english.facts.flatMap((f) => [f.title, f.text]),
        ].join(" "),
      ),
      record.elementId,
    );
    assert.deepEqual(english.sourceIds, record.sourceIds);
    assert.deepEqual(english.substanceIds, record.substanceIds);
    assert.equal(localizeStory(record, "zh"), record);
  }
});
test("English reaction copy preserves all coefficients, states, conditions and source identities", () => {
  assert.equal(equations.length, 25);
  for (const record of equations) {
    const english = localizeEquation(record, "en");
    assert.ok(
      !han.test(english.title + english.condition + english.note),
      record.id,
    );
    for (const key of [
      "id",
      "reactants",
      "products",
      "reversible",
      "catalystId",
      "sourceIds",
    ] as const)
      assert.deepEqual(english[key], record[key]);
    assert.equal(localizeEquation(record, "zh"), record);
  }
});
test("English source records retain original URLs and verification status", () => {
  for (const record of sources) {
    const english = localizeSource(record, "en");
    assert.ok(
      !han.test(
        [
          english.title,
          english.publisher,
          english.note,
          english.volume,
          english.edition,
          english.pages,
        ].join(" "),
      ),
      record.id,
    );
    assert.equal(english.url, record.url);
    assert.equal(english.verification, record.verification);
    if (record.kind === "textbook")
      assert.ok(/Chinese/.test(english.title), record.id);
    assert.equal(localizeSource(record, "zh"), record);
  }
});

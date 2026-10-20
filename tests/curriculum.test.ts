import { test } from "node:test";
import assert from "node:assert/strict";
import {
  equations,
  stories,
  substances,
  substanceById,
} from "../src/data/catalog";
import {
  getElementContent,
  getFocusElementIds,
  getSubstanceEquations,
  isContentVisible,
} from "../src/data/curriculum";

test("high school retains every collected story, material and reaction", () => {
  for (const story of stories) {
    const content = getElementContent(story.elementId, "senior");
    assert.equal(content.story, story);
    assert.deepEqual(
      content.related.map((s) => s.id),
      story.substanceIds,
    );
  }
  for (const substance of substances) {
    assert.ok(isContentVisible("senior", substance.level));
    assert.deepEqual(
      getSubstanceEquations(substance.id, "senior").map((e) => e.id),
      substance.equationIds,
    );
  }
  assert.equal(getFocusElementIds("senior").size, stories.length);
});

test("junior content does not inherit the level of its parent story or material", () => {
  const nitrogen = getElementContent("n", "junior");
  assert.equal(nitrogen.story, undefined);
  assert.deepEqual(
    nitrogen.related.map((s) => s.id),
    ["nitrogen"],
  );
  const iron = getElementContent("fe", "junior");
  assert.deepEqual(
    iron.related.map((s) => s.id),
    ["iron", "iron-ii-iii-oxide"],
  );
  assert.ok(getFocusElementIds("junior").has("fe"));
  assert.ok(!getFocusElementIds("junior").has("li"));
  for (const id of ["water", "hydrogen-peroxide"]) {
    assert.ok(substanceById[id].equationIds.includes("peroxide-redox"));
    assert.ok(
      !getSubstanceEquations(id, "junior").some(
        (e) => e.id === "peroxide-redox",
      ),
    );
  }
});

test("junior reaction/material grades are coherent while advanced reactions stay advanced", () => {
  for (const story of stories) {
    const content = getElementContent(story.elementId, "junior");
    assert.ok(!content.story || content.story.level === "junior");
    assert.ok(content.related.every((s) => s.level === "junior"));
  }
  for (const equation of equations.filter((e) => e.level === "junior")) {
    for (const term of [...equation.reactants, ...equation.products])
      assert.equal(
        substanceById[term.substanceId].level,
        "junior",
        `${equation.id}: ${term.substanceId}`,
      );
  }
  for (const id of [
    "haber-synthesis",
    "sodium-water",
    "sodium-chloride-electrolysis",
    "peroxide-redox",
    "potassium-chlorate-decomposition",
  ])
    assert.ok(
      !isContentVisible("junior", equations.find((e) => e.id === id)!.level),
    );
});

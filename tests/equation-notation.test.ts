import test from "node:test";
import assert from "node:assert/strict";
import { equations, substanceById } from "../src/data/catalog";
import { equationNotationById } from "../src/data/equation-notation";

test("every displayed equation has a reviewed notation entry and no stale IDs", () => {
  assert.deepEqual(
    Object.keys(equationNotationById).sort(),
    equations.map((e) => e.id).sort(),
  );
  for (const entry of Object.values(equationNotationById)) {
    for (const text of [entry.above, entry.below]) {
      if (text)
        assert.ok(
          text.length <= 8,
          "long context belongs in the note, not over the sign",
        );
    }
  }
});

test("textbook conditions, heat, catalysts and reversible synthesis stay distinct", () => {
  assert.equal(equationNotationById["water-electrolysis"].above, "通电");
  assert.equal(equationNotationById["hydrogen-combustion"].above, "点燃");
  assert.equal(equationNotationById["sodium-chlorine"].above, "△");
  assert.equal(
    equationNotationById["calcium-carbonate-decomposition"].above,
    "高温",
  );
  assert.deepEqual(
    equations.filter((e) => e.reversible).map((e) => e.id),
    ["haber-synthesis"],
  );
  for (const equation of equations.filter((e) => e.catalystId)) {
    const catalyst = substanceById[equation.catalystId!];
    assert.ok(catalyst);
    assert.ok(
      ![...equation.reactants, ...equation.products].some(
        (t) => t.substanceId === catalyst.id,
      ),
    );
    const notation = equationNotationById[equation.id];
    const visible = `${notation.above ?? ""}${notation.below ?? ""}`;
    assert.ok(visible.includes(catalyst.id === "iron" ? "铁" : "MnO₂"));
  }
  assert.match(
    equationNotationById["haber-synthesis"].context!,
    /400–500.*150–250/,
  );
  assert.match(
    equationNotationById["carbon-dioxide-sodium-hydroxide"].context!,
    /NaOH足量/,
  );
  assert.match(
    equationNotationById["peroxide-redox"].context!,
    /H₂SO₄.*反应物/,
  );
});

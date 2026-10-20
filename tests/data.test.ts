import test from "node:test";
import assert from "node:assert/strict";
import {
  elements,
  substances,
  equations,
  stories,
  sources,
  elementById,
  substanceById,
  sourceById,
  equationById,
} from "../src/data/catalog";

function unique(values: string[] | number[], description: string) {
  assert.equal(
    new Set<string | number>(values).size,
    values.length,
    `${description} must be unique`,
  );
}
function parseFormula(formula: string): Record<string, number> {
  const tokens = formula.match(/[A-Z][a-z]?|\d+|[()]/g) ?? [];
  assert.equal(tokens.join(""), formula, "Unsupported formula syntax");
  const stack: Record<string, number>[] = [{}];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "(") {
      stack.push({});
      continue;
    }
    if (token === ")") {
      assert.ok(stack.length > 1);
      const group = stack.pop()!;
      const multiplier = /^\d+$/.test(tokens[i + 1] ?? "")
        ? Number(tokens[++i])
        : 1;
      for (const [key, count] of Object.entries(group))
        stack.at(-1)![key] = (stack.at(-1)![key] ?? 0) + count * multiplier;
    } else {
      assert.match(token, /^[A-Z][a-z]?$/);
      const id = token.toLowerCase();
      assert.ok(elementById[id], `Unknown element ${token}`);
      const count = /^\d+$/.test(tokens[i + 1] ?? "") ? Number(tokens[++i]) : 1;
      stack.at(-1)![id] = (stack.at(-1)![id] ?? 0) + count;
    }
  }
  assert.equal(stack.length, 1);
  return stack[0];
}
test("all 118 elements have unique atomic numbers, symbols, names, IDs and grid positions", () => {
  assert.equal(elements.length, 118);
  assert.deepEqual(
    elements.map((e) => e.number),
    Array.from({ length: 118 }, (_, i) => i + 1),
  );
  for (const field of ["id", "symbol", "name"] as const)
    unique(
      elements.map((e) => e[field]),
      field,
    );
  unique(
    elements.map((e) => `${e.column},${e.row}`),
    "grid positions",
  );
  for (const e of elements) {
    assert.equal(e.id, e.symbol.toLowerCase());
    assert.ok(e.column >= 1 && e.column <= 18);
    assert.ok(e.period >= 1 && e.period <= 7);
    assert.ok([1, 2, 3, 4, 5, 6, 7, 9, 10].includes(e.row));
  }
  assert.equal(elementById.he.column, 18);
  assert.equal(elementById.la.row, 9);
  assert.equal(elementById.lu.column, 17);
  assert.equal(elementById.ac.row, 10);
  assert.equal(elementById.og.column, 18);
});
test("shell populations match independently expanded ground-state configurations and neutral atom totals", () => {
  const superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const computed = new Map<string, number[]>();
  for (const e of elements) {
    const plain = e.electronConfiguration.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) =>
      String(superscript.indexOf(c)),
    );
    const core = plain.match(/^\[([A-Z][a-z]?)\]/);
    const parsed = core ? [...computed.get(core[1])!] : [];
    for (const match of plain
      .replace(/^\[[^\]]+\]/, "")
      .matchAll(/([1-7])([spdf])(\d+)/g)) {
      const n = Number(match[1]);
      const count = Number(match[3]);
      assert.ok(count <= ({ s: 2, p: 6, d: 10, f: 14 }[match[2]] ?? 0));
      parsed[n - 1] = (parsed[n - 1] ?? 0) + count;
    }
    assert.deepEqual(parsed, e.shells, `${e.symbol} configuration ↔ shells`);
    assert.equal(
      e.shells.reduce((a, b) => a + b, 0),
      e.number,
      `${e.symbol} electrons`,
    );
    e.shells.forEach((n, i) => assert.ok(n > 0 && n <= 2 * (i + 1) ** 2));
    computed.set(e.symbol, parsed);
  }
});
test("exception fixtures cover Cr, Cu, Pd, Gd, Pt, Au, U and Lr rather than mechanical filling", () => {
  const fixtures: Record<string, number[]> = {
    cr: [2, 8, 13, 1],
    cu: [2, 8, 18, 1],
    pd: [2, 8, 18, 18],
    gd: [2, 8, 18, 25, 9, 2],
    pt: [2, 8, 18, 32, 17, 1],
    au: [2, 8, 18, 32, 18, 1],
    u: [2, 8, 18, 32, 21, 9, 2],
    lr: [2, 8, 18, 32, 32, 8, 3],
  };
  for (const [id, shells] of Object.entries(fixtures))
    assert.deepEqual(elementById[id].shells, shells, id);
});
test("substance formulas and composition match, entities have unique stable IDs and valid citations", () => {
  for (const collection of [substances, equations, sources])
    unique(
      collection.map((e) => e.id),
      "entity IDs",
    );
  unique(
    stories.map((s) => s.elementId),
    "stories",
  );
  for (const substance of substances) {
    assert.deepEqual(
      parseFormula(substance.formula),
      substance.composition,
      substance.id,
    );
    assert.match(substance.id, /^[a-z][a-z0-9-]*$/);
  }
  for (const entity of [...elements, ...substances, ...equations, ...stories]) {
    assert.ok(entity.sourceIds.length, "Every entity must be cited");
    for (const id of entity.sourceIds)
      assert.ok(sourceById[id], `Missing source ${id}`);
  }
  for (const source of sources) {
    assert.ok(new URL(source.url).protocol === "https:");
    if (source.kind === "textbook" && source.verification !== "pending")
      assert.ok(source.pages && source.edition);
  }
});
test("every related substance actually contains its parent element, with no broken cross-page references", () => {
  assert.ok(
    stories.length >= 20 && stories.length <= 30,
    `Expected 20–30 detailed elements, got ${stories.length}`,
  );
  for (const story of stories) {
    assert.ok(elementById[story.elementId]);
    assert.ok(story.facts.length >= 2);
    for (const id of story.substanceIds) {
      assert.ok(substanceById[id], id);
      assert.ok(
        substanceById[id].composition[story.elementId],
        `${story.elementId} is absent from ${id}`,
      );
    }
  }
  for (const s of substances)
    for (const id of s.equationIds) {
      const e = equationById[id];
      assert.ok(e, `Missing equation ${id}`);
      assert.ok(
        [...e.reactants, ...e.products].some((t) => t.substanceId === s.id) ||
          e.catalystId === s.id,
        `${s.id} does not participate in ${id}`,
      );
    }
});
test("all displayed chemical equations conserve each element with positive integer coefficients", () => {
  for (const equation of equations) {
    const sum = (side: typeof equation.reactants) => {
      const counts: Record<string, number> = {};
      for (const term of side) {
        assert.ok(Number.isInteger(term.coefficient) && term.coefficient > 0);
        const substance = substanceById[term.substanceId];
        assert.ok(substance, term.substanceId);
        for (const [id, count] of Object.entries(substance.composition))
          counts[id] = (counts[id] ?? 0) + count * term.coefficient;
      }
      return counts;
    };
    assert.deepEqual(
      sum(equation.reactants),
      sum(equation.products),
      equation.id,
    );
    if (equation.catalystId) {
      assert.ok(substanceById[equation.catalystId]);
      assert.ok(equation.condition);
    }
    for (const term of equation.products) {
      if (term.marker === "gas") {
        assert.equal(term.state, "g");
        assert.ok(
          !equation.reactants.some((t) => t.state === "g"),
          `${equation.id}: gas marker with gaseous reactant`,
        );
      }
      if (term.marker === "precipitate") {
        assert.equal(term.state, "s");
        assert.ok(equation.reactants.some((t) => t.state === "aq"));
      }
    }
    assert.ok(equation.reactants.every((t) => !t.marker));
  }
});

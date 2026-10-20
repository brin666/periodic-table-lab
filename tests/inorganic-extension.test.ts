import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { elements, substances } from "../src/data/catalog";
import { extendedCompounds } from "../src/data/compound-extensions";
import {
  inorganicCompounds,
  inorganicCompoundSources,
} from "../src/data/inorganic-compounds";

const research = new URL(
  "./fixtures/pubchem-inorganic/",
  import.meta.url,
);
const ledger = JSON.parse(
  readFileSync(new URL("ledger.json", research), "utf8"),
);
const entries = new Map<string, any>(
  ledger.entries.map((entry: any) => [entry.id, entry]),
);
const sourceById = new Map(
  inorganicCompoundSources.map((source) => [source.id, source]),
);
const knownElements = new Set(elements.map((element) => element.id));
const canonical = (counts: Record<string, number>) =>
  JSON.stringify(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));

/** Independent count expansion, used to compare display formulas with source formulas. */
function atoms(formula: string): Record<string, number> {
  const sum: Record<string, number> = {};
  for (const raw of formula.split("·")) {
    const coefficient = raw.match(/^\d+/)?.[0] ?? "1";
    let part = raw.replace(/^\d+/, "");
    // Expand the innermost group until no bracket group remains.
    while (/[\[\]()]/u.test(part)) {
      const next = part.replace(
        /\(([^()[\]]+)\)(\d*)|\[([^()[\]]+)\](\d*)/gu,
        (
          _whole,
          round: string | undefined,
          roundCount: string | undefined,
          square: string | undefined,
          squareCount: string | undefined,
        ) => (round ?? square!).repeat(Number(roundCount ?? squareCount) || 1),
      );
      assert.notEqual(next, part, `Balanced formula groups: ${formula}`);
      part = next;
    }
    let matched = "";
    for (const token of part.matchAll(/([A-Z][a-z]?)(\d*)/gu)) {
      matched += token[0];
      const key = token[1].toLowerCase();
      assert.ok(knownElements.has(key), `Known element ${key} in ${formula}`);
      const number = Number(coefficient) * Number(token[2] || "1");
      assert.ok(Number.isInteger(number) && number > 0);
      sum[key] = (sum[key] ?? 0) + number;
    }
    assert.equal(matched, part, `Fully parsed ${formula}`);
  }
  return sum;
}

test("new inorganic entries preserve actual PubChem identity evidence and exact atom totals", () => {
  assert.ok(
    inorganicCompounds.length >= 400,
    "A substantial verified expansion is present",
  );
  assert.equal(inorganicCompounds.length, ledger.summary.published);
  assert.equal(inorganicCompoundSources.length, inorganicCompounds.length);
  assert.equal(
    new Set(inorganicCompoundSources.map((source) => source.id)).size,
    inorganicCompoundSources.length,
  );
  for (const compound of inorganicCompounds) {
    const entry = entries.get(compound.id);
    assert.ok(
      entry?.includedInCatalog,
      `Published ledger row for ${compound.name}`,
    );
    assert.equal(entry.status, "verified");
    const body = readFileSync(new URL(entry.raw, research));
    assert.equal(createHash("sha256").update(body).digest("hex"), entry.sha256);
    const records = JSON.parse(body.toString("utf8")).PropertyTable.Properties;
    const record = records.find(
      (value: any) => value.CID === entry.property.CID,
    );
    assert.ok(record, `CID is present in read body for ${compound.name}`);
    assert.equal(
      canonical(atoms(compound.formula)),
      canonical(compound.composition),
    );
    assert.equal(
      canonical(atoms(record.MolecularFormula)),
      canonical(compound.composition),
    );
    assert.equal(compound.molarMass, record.MolecularWeight);
    assert.ok(
      !compound.cas,
      "Identity lookup does not establish an inspected CAS record",
    );
    assert.equal(compound.sourceIds.length, 1);
    const source = sourceById.get(compound.sourceIds[0]);
    assert.ok(source, `Resolvable reference for ${compound.name}`);
    assert.equal(source.verification, "data-read");
    assert.equal(source.accessed, "2026-10-16");
    assert.equal(
      source.url,
      `https://pubchem.ncbi.nlm.nih.gov/compound/${record.CID}`,
    );
    assert.ok(source.note.includes(entry.url));
    assert.ok(compound.nameExplanation.trim().length > 12);
    assert.ok(compound.summary.trim().length > 12);
  }
});

test("the added catalog has no duplicated old or new inorganic identity", () => {
  const baseline = [
    ...substances.filter((item) => item.kind === "compound"),
    ...extendedCompounds,
  ];
  const ids = new Set(baseline.map((item) => item.id));
  const names = new Set(baseline.map((item) => item.name));
  const formulas = new Set(baseline.map((item) => canonical(item.composition)));
  const referenceIds = new Set(baseline.flatMap((item) => item.sourceIds));
  for (const compound of inorganicCompounds) {
    assert.ok(!ids.has(compound.id), `Unique ID: ${compound.id}`);
    assert.ok(!names.has(compound.name), `Unique name: ${compound.name}`);
    assert.ok(
      !formulas.has(canonical(compound.composition)),
      `Reviewed unique identity: ${compound.name}`,
    );
    assert.ok(
      !referenceIds.has(compound.sourceIds[0]),
      `Unique PubChem CID: ${compound.name}`,
    );
    ids.add(compound.id);
    names.add(compound.name);
    formulas.add(canonical(compound.composition));
    referenceIds.add(compound.sourceIds[0]);
  }
});

test("hydrates count all water and carbon-bearing entries remain inorganic", () => {
  let hydrateCount = 0;
  for (const compound of inorganicCompounds) {
    const hydrate = compound.formula.match(/^(.*)·(\d*)H2O$/u);
    if (hydrate) {
      hydrateCount += 1;
      const base = atoms(hydrate[1]);
      const water = Number(hydrate[2] || "1");
      const chinese =
        compound.name.match(/([一二三四五六七八九十]+)水合/u)?.[1];
      if (chinese) {
        const values: Record<string, number> = {
          一: 1,
          二: 2,
          三: 3,
          四: 4,
          五: 5,
          六: 6,
          七: 7,
          八: 8,
          九: 9,
        };
        const parts = chinese.split("十");
        const waterInName =
          parts.length === 1
            ? values[chinese]
            : (values[parts[0]] ?? 1) * 10 + (values[parts[1]] ?? 0);
        assert.equal(
          waterInName,
          water,
          `Hydrate name and formula agree: ${compound.name}`,
        );
      }
      base.h = (base.h ?? 0) + 2 * water;
      base.o = (base.o ?? 0) + water;
      assert.equal(
        canonical(base),
        canonical(compound.composition),
        `Water pairing for ${compound.name}`,
      );
      assert.ok(
        /水合|水中的|份水|结晶水|氢和/u.test(compound.nameExplanation),
        `Hydrate naming explanation: ${compound.name}`,
      );
    }
    const entry = entries.get(compound.id);
    if (compound.composition.c) {
      assert.match(
        entry.query,
        /carbonate|carbide|cyan|thiocyan|phosgene|carbonyl sulfide|carbon disulfide/iu,
        `${compound.name} has an explicitly reviewed inorganic carbon identity`,
      );
    }
    assert.doesNotMatch(
      compound.name,
      /乙酸|草酸|酒石酸|柠檬酸|丙酸|苯|甲酸|葡萄糖|果糖|蔗糖|乙醇|甲醇|EDTA|乙二胺/iu,
    );
  }
  assert.ok(
    hydrateCount >= 35,
    "Common hydrates are represented with full water counts",
  );
});

test("Chinese naming explanations keep acids, acid salts, thiocyanate and oxidation numerals distinct", () => {
  const sourceGroups = [
    "NO3",
    "NO2",
    "SO4",
    "SO3",
    "S2O3",
    "S2O4",
    "S2O5",
    "S2O8",
    "PO4",
    "P2O7",
    "SCN",
  ];
  for (const compound of inorganicCompounds) {
    for (const group of sourceGroups) {
      if (compound.nameExplanation.includes(`部分 ${group}`))
        assert.ok(
          compound.formula.includes(group),
          `${compound.name} must actually contain the group explained as ${group}`,
        );
    }
    if (compound.name.endsWith("酸"))
      assert.doesNotMatch(
        compound.nameExplanation,
        /对应硝酸根部分 NO3|对应硫酸根部分 SO4/u,
        `A free acid is not renamed by a substring of an acid salt: ${compound.name}`,
      );
    if (compound.name.includes("硫氰"))
      assert.match(
        compound.nameExplanation,
        /SCN|硫、碳、氮/u,
        `Thiocyanate includes sulfur: ${compound.name}`,
      );
    if (/\([IVX]+\)/u.test(compound.name))
      assert.match(
        compound.nameExplanation,
        /[一二三四五六七八]价/u,
        `Readable oxidation state: ${compound.name}`,
      );
  }
});

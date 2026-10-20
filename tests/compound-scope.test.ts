import test from "node:test";
import assert from "node:assert/strict";
import { extendedCompounds } from "../src/data/compound-extensions";
import { compoundGameExpansion } from "../src/data/compound-game-expansion";
import { isInorganicDiscoveryEntry } from "../src/data/compound-scope";

test("the inorganic homepage excludes organic acids, organic salts, sugars, alcohols and organic ligands", () => {
  for (const id of [
    "ethanol",
    "methanol",
    "glucose",
    "fructose",
    "acetic-acid",
    "ammonium-oxalate",
    "sodium-acetate",
    "sodium-oxalate",
    "urea",
    "disodium-edta-dihydrate",
    "potassium-hydrogen-phthalate",
  ]) {
    const record = extendedCompounds.find((compound) => compound.id === id);
    assert.ok(
      record,
      `${id} is still preserved in the historical source dataset`,
    );
    assert.equal(isInorganicDiscoveryEntry(record), false, id);
  }
});

test("carbon-containing inorganic identities stay searchable, with unknown carbon entries withheld", () => {
  for (const id of [
    "carbonic-acid",
    "sodium-bicarbonate",
    "ammonium-carbonate",
    "potassium-ferrocyanide",
    "potassium-ferricyanide",
    "ammonium-thiocyanate",
  ]) {
    const record = extendedCompounds.find((compound) => compound.id === id)!;
    assert.ok(record);
    assert.equal(isInorganicDiscoveryEntry(record), true, id);
  }
  assert.equal(
    isInorganicDiscoveryEntry({
      id: "unreviewed-carbon",
      composition: { c: 1, h: 4 },
    }),
    false,
  );
  assert.equal(
    isInorganicDiscoveryEntry({
      id: "inorganic-oxide",
      composition: { fe: 2, o: 3 },
    }),
    true,
  );
});

test("the 2026-10-18 game-data expansion contains no organic entries", () => {
  assert.equal(compoundGameExpansion.length, 35);
  for (const record of compoundGameExpansion)
    assert.equal(isInorganicDiscoveryEntry(record), true, record.id);
});

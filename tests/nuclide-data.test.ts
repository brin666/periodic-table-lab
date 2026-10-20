import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { elements } from "../src/data/elements";
import {
  allIsotopes,
  isotopeById,
  isotopeSources,
  isotopesByElement,
  nuclideDatasetInfo,
  teachingIsotopes,
} from "../src/data/isotopes";
import { nubase2020GroundStateRows } from "../src/data/nuclides";

const snapshot = readFileSync(
  new URL("./fixtures/nubase2020/nubase_4.mas20.txt", import.meta.url),
);
const sourceLines = snapshot.toString("utf8").split(/\r?\n/);

test("the NUBASE2020 snapshot is pinned to its verified bytes and declared version", () => {
  assert.equal(snapshot.byteLength, 761906);
  assert.equal(
    createHash("sha256").update(snapshot).digest("hex"),
    "1585a5eea86c5e17e90307c7e6e786d060049c4039e392a261ff6db977df9859",
  );
  assert.equal(nuclideDatasetInfo.sourceBytes, snapshot.byteLength);
  assert.equal(nuclideDatasetInfo.version, "NUBASE2020");
  assert.equal(nuclideDatasetInfo.literatureCutoff, "2020-10-30");
  assert.equal(nuclideDatasetInfo.retrievedDate, "2026-10-16");
  assert.equal(nuclideDatasetInfo.sourceRecordCount, 5843);
  const lightweightMetadata = readFileSync(
    new URL("../src/data/nuclide-metadata.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(lightweightMetadata, /^\s*(?:import|export.*\bfrom\b)/m);
  assert.ok(lightweightMetadata.length < 5000);
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        new URL("./fixtures/nubase2020/ledger.json", import.meta.url),
        "utf8",
      ),
    ),
    nuclideDatasetInfo,
  );
});

test("the index covers every source ground state in scope and excludes RN from student choices", () => {
  const officialGroundStates = sourceLines.filter(
    (line) => /^\d{3} \d{3}0/.test(line) && Number(line.slice(4, 7)) >= 1,
  );
  assert.equal(officialGroundStates.length, 3557);
  assert.equal(nubase2020GroundStateRows.length, officialGroundStates.length);
  assert.equal(allIsotopes.length, 3555);
  assert.equal(nuclideDatasetInfo.includedRecordCount, allIsotopes.length);
  const rawIdentifiers = new Set(
    nubase2020GroundStateRows.map(([a, z]) => `${z}:${a}`),
  );
  assert.equal(rawIdentifiers.size, 3557);
  for (const line of officialGroundStates) {
    assert.ok(
      rawIdentifiers.has(
        `${Number(line.slice(4, 7))}:${Number(line.slice(0, 3))}`,
      ),
    );
  }
  assert.equal(isotopeById["lv-289"], undefined);
  assert.equal(isotopeById["og-293"], undefined);
  assert.deepEqual(
    nubase2020GroundStateRows
      .filter((row) => row[10] === "RN")
      .map((row) => [row[0], row[1]]),
    [
      [289, 116],
      [293, 118],
    ],
  );
  assert.equal(
    allIsotopes.filter(
      (isotope) => isotope.recordStatus === "existence-uncertain",
    ).length,
    1,
  );
  assert.equal(isotopeById["fm-260"].recordStatus, "existence-uncertain");
  assert.match(isotopeById["fm-260"].summary, /存在性待确认/);
});

test("all 118 elements have unique ground-state isotope IDs and valid A, Z, N", () => {
  assert.equal(Object.keys(isotopesByElement).length, 118);
  assert.equal(
    new Set(allIsotopes.map((isotope) => isotope.id)).size,
    allIsotopes.length,
  );
  assert.equal(
    Object.values(isotopesByElement).flat().length,
    allIsotopes.length,
  );
  for (const element of elements) {
    const group = isotopesByElement[element.id];
    assert.ok(group.length > 0, `${element.symbol} has source records`);
    assert.deepEqual(
      group.map((isotope) => isotope.massNumber),
      group.map((isotope) => isotope.massNumber).sort((a, b) => a - b),
    );
    for (const isotope of group) {
      assert.equal(isotope.elementId, element.id);
      assert.equal(isotope.atomicNumber, element.number);
      assert.equal(isotope.massNumber, element.number + isotope.neutronNumber!);
      assert.ok(
        Number.isInteger(isotope.neutronNumber) && isotope.neutronNumber! >= 0,
      );
      assert.equal(isotope.id, `${element.id}-${isotope.massNumber}`);
      assert.equal(isotope.sourceStateIndex, 0);
      assert.equal(isotopeById[isotope.id], isotope);
    }
  }
  assert.deepEqual(
    isotopesByElement.h.map((isotope) => isotope.massNumber),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    isotopesByElement.og.map((isotope) => isotope.massNumber),
    [294, 295],
  );
});

test("source fields and line references preserve bounds, flags, units and decay notation", () => {
  for (const isotope of allIsotopes) {
    const line = sourceLines[isotope.sourceLineNumber! - 1];
    assert.equal(Number(line.slice(0, 3)), isotope.massNumber);
    assert.equal(Number(line.slice(4, 7)), isotope.atomicNumber);
    assert.equal(line[7], "0");
    assert.equal(line.slice(18, 31).trim(), isotope.massExcessRaw);
    assert.equal(line.slice(31, 42).trim(), isotope.massExcessUncertaintyRaw);
    assert.equal(line.slice(69, 88).trim(), isotope.halfLifeRaw);
    assert.equal(line.slice(69, 78).trim(), isotope.halfLifeValueRaw);
    assert.equal(line.slice(78, 80).trim(), isotope.halfLifeUnit);
    assert.equal(line.slice(81, 88).trim(), isotope.halfLifeUncertaintyRaw);
    assert.equal(line.slice(119, 209).trim(), isotope.decayModesRaw);
    assert.equal(line.slice(114, 118).trim(), isotope.discoveryYearRaw);
    assert.equal(line.slice(65, 67).trim(), isotope.recordFlagRaw);
    assert.equal(line.slice(67, 69).trim(), isotope.stateOrderingFlagsRaw);
  }
  assert.equal(isotopeById["b-18"].halfLifeUncertaintyRaw, "<26 ns");
  assert.equal(isotopeById["b-18"].halfLifeKind, "limit-only");
  assert.equal(isotopeById["os-188"].halfLifeUncertaintyRaw, ">3.3Ey");
  assert.equal(isotopeById["os-188"].stability, "stable");
  assert.match(isotopeById["h-1"].decayModesRaw!, /^IS=/);
});

test("stability counts keep missing values separate and agree with the declared ledger", () => {
  const count = (stability: string) =>
    allIsotopes.filter((isotope) => isotope.stability === stability).length;
  assert.equal(count("stable"), 253);
  assert.equal(count("radioactive"), 3218);
  assert.equal(count("unknown"), 84);
  assert.equal(count("stable"), nuclideDatasetInfo.stableCount);
  assert.equal(count("radioactive"), nuclideDatasetInfo.radioactiveCount);
  assert.equal(count("unknown"), nuclideDatasetInfo.unknownStabilityCount);
  assert.equal(
    allIsotopes.filter((isotope) => isotope.halfLifeKind === "limit-only")
      .length,
    38,
  );
  assert.equal(
    allIsotopes.filter((isotope) => isotope.halfLifeKind === "not-reported")
      .length,
    46,
  );
  assert.equal(
    allIsotopes.filter(
      (isotope) => isotope.halfLifeKind === "particle-unstable",
    ).length,
    3,
  );
  assert.equal(isotopeById["li-12"].stability, "unknown");
  assert.equal(isotopeById["li-12"].discoveryYearRaw, "2008");
  assert.equal(isotopeById["na-17"].stability, "unknown");
  assert.equal(isotopeById["na-17"].decayModesRaw, "p=100");
});

test("property estimates are not discovery labels and familiar nuclear facts remain accurate", () => {
  assert.equal(isotopeById["h-7"].massExcessFromSystematics, true);
  assert.equal(isotopeById["h-7"].halfLifeFromSystematics, false);
  assert.equal(isotopeById["h-7"].discoveryYearRaw, "2003");
  assert.equal(isotopeById["si-44"].halfLifeFromSystematics, true);
  assert.equal(isotopeById["si-44"].discoveryYearRaw, "2007");
  assert.equal(
    allIsotopes.filter((isotope) => isotope.halfLifeFromSystematics).length,
    367,
  );
  assert.equal(
    allIsotopes.filter((isotope) => isotope.massExcessFromSystematics).length,
    1006,
  );
  assert.equal(isotopeById["h-3"].halfLifeValueRaw, "12.32");
  assert.equal(isotopeById["h-3"].halfLifeUnit, "y");
  assert.equal(isotopeById["c-14"].halfLifeValueRaw, "5.70");
  assert.equal(isotopeById["c-14"].halfLifeUnit, "ky");
  assert.equal(isotopeById["ca-48"].stability, "radioactive");
  assert.equal(isotopeById["ca-40"].stability, "stable");
  assert.equal(isotopeById["li-3"].halfLifeValueRaw, "p-unst");
});

test("the 35 introductory entries keep their identity, teaching names, copy and resolved sources", () => {
  assert.equal(teachingIsotopes.length, 35);
  const sourceIds = new Set(isotopeSources.map((source) => source.id));
  assert.equal(sourceIds.size, isotopeSources.length);
  for (const isotope of allIsotopes) {
    assert.ok(isotope.name.trim());
    assert.ok(isotope.summary.trim());
    assert.ok(isotope.sourceIds.includes("nubase2020"));
    for (const sourceId of isotope.sourceIds)
      assert.ok(sourceIds.has(sourceId));
  }
  for (const isotope of teachingIsotopes) {
    assert.equal(isotopeById[isotope.id], isotope);
    assert.ok(isotope.sourceIds.length >= 2);
  }
  assert.equal(isotopeById["h-2"].name, "氢-2（氘）");
  assert.match(isotopeById["h-2"].summary, /也叫氘/);
});

test("half-life limits and approximate records are not described as exact finite values", () => {
  for (const id of ["b-20", "bk-248"]) {
    assert.match(isotopeById[id].halfLifeValueRaw!, /^[<>~]/);
    assert.match(isotopeById[id].summary, /界限或近似/);
    assert.doesNotMatch(isotopeById[id].summary, /列有有限半衰期/);
  }
  assert.match(isotopeById["br-68"].halfLifeRaw!, /~40/);
  assert.match(isotopeById["br-68"].summary, /近似信息/);
});

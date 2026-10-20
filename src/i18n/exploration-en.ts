import type { Language } from "../i18n";
import { elementById } from "../data/catalog";
import type { Element } from "../data/types";
import type { TeachingIsotope, IsotopeSource } from "../data/isotopes";
import type { ExtendedCompound } from "../data/compound-extensions";
import { elementName } from "../i18n";

type IsotopeSourceCopy = Pick<IsotopeSource, "title" | "publisher" | "note">;

const isotopeSourceEnglish: Record<string, IsotopeSourceCopy> = {
  nubase2020: {
    title: "NUBASE2020 evaluated nuclear-physics data",
    publisher: "Atomic Mass Data Center; hosted by IAEA Nuclear Data Services",
    note: "Downloaded on 2026-10-16 and transcribed column by column: 3,557 ground-state records with Z = 1–118 and i = 0. The student index excludes two RN records (reported as nonexistent in the evaluation) and displays 3,555 records covering all 118 elements; estimated entries and one EU (existence uncertain) entry are retained. “stable” corresponds to stbl, meaning no decay was observed in this evaluation. When the main half-life value is blank, this index conservatively classifies the record as unknown. A # applies only to the property it marks as a systematics-based estimate; it does not mean the nuclide is undiscovered, and the absence of # does not by itself prove direct measurement. This is the NUBASE2020 edition, not a live census of all known nuclides. The original numerical table and SHA-256 record are included in tests/fixtures/nubase2020/. The historical import script remains in the local research archive and is not included in this repository.",
  },
  "nubase2020-paper": {
    title: "The NUBASE2020 evaluation of nuclear physics properties",
    publisher: "F. G. Kondev et al.; Chinese Physics C 45, 030001 (2021)",
    note: "The introduction, §2, and §§2.2–2.3 were read on 2026-10-16 to check estimated properties for unobserved nuclides, the RN/EU existence flags, and half-life limits. The evaluation considers experimental literature available through 2020-10-30. This page follows that edition's scope and does not present a live 2026 census.",
  },
  "openstax-atomic-structure": {
    title: "Chemistry 2e §2.3: Atomic Structure and Symbolism",
    publisher: "OpenStax / Rice University",
    note: "The text, Table 2.4, and magnesium-nuclide example were read on 2026-10-15. They support Z as proton number, A as the sum of proton and neutron numbers, N = A − Z, and the listed hydrogen, helium, boron, carbon, nitrogen, oxygen, and magnesium examples. This is an external textbook reference, not a claim of alignment with a local school textbook.",
  },
  "ciaaw-isotopic-compositions-2024": {
    title: "Isotopic Compositions of the Elements 2024",
    publisher: "IUPAC Commission on Isotopic Abundances and Atomic Weights",
    note: "The 2024 table was read on 2026-10-15 to cross-check mass numbers for selected naturally occurring nuclides. Natural occurrence alone does not establish stability; stability here follows NUBASE2020. Abundances are not displayed.",
  },
  "rsc-isotopes-h": {
    title: "Hydrogen: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15: hydrogen-1, hydrogen-2, and hydrogen-3; beta decay is listed for hydrogen-3. Facts are summarized without using images or video or reproducing the source wording.",
  },
  "rsc-isotopes-he": {
    title: "Helium: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for helium-3 and helium-4. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-b": {
    title: "Boron: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for boron-10 and boron-11. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-c": {
    title: "Carbon: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for carbon-12, carbon-13, and carbon-14; beta decay is listed for carbon-14.",
  },
  "rsc-isotopes-n": {
    title: "Nitrogen: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for nitrogen-14 and nitrogen-15. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-o": {
    title: "Oxygen: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for oxygen-16, oxygen-17, and oxygen-18. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-mg": {
    title: "Magnesium: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for magnesium-24, magnesium-25, and magnesium-26, and was cross-checked against the OpenStax magnesium example.",
  },
  "rsc-isotopes-si": {
    title: "Silicon: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for silicon-28, silicon-29, and silicon-30. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-cl": {
    title: "Chlorine: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for chlorine-35 and chlorine-37. Stability was checked separately against NUBASE2020.",
  },
  "rsc-isotopes-ca": {
    title: "Calcium: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The calcium-40, -42, -43, -44, -46, and -48 rows were read on 2026-10-15. Some RSC entries give lower limits for decay; a limit is not treated here as an observed decay. Under NUBASE2020, calcium-40 and calcium-46 are classified as stable, while calcium-48 is classified as radioactive.",
  },
  "rsc-isotopes-fe": {
    title: "Iron: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The iron-54, -56, -57, and -58 rows were read on 2026-10-15. The lower bound for iron-54 decay is not treated as an observed decay; all four are classified as stable by the NUBASE2020 stbl label.",
  },
  "rsc-isotopes-cu": {
    title: "Copper: Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    note: "The isotope table was read on 2026-10-15 for copper-63 and copper-65. Stability was checked separately against NUBASE2020.",
  },
};

export function isotopeSourceCopy(source: IsotopeSource, language: Language) {
  return language === "en" ? isotopeSourceEnglish[source.id] ?? source : source;
}

const isotopeAliases: Record<string, string> = {
  "h-1": "protium",
  "h-2": "deuterium",
  "h-3": "tritium",
};

export function isotopeDisplayName(
  isotope: TeachingIsotope,
  language: Language,
  localizedElementName?: string,
) {
  if (language === "zh") return isotope.name;
  const name = localizedElementName ?? elementById[isotope.elementId]?.englishName ?? isotope.elementId;
  const base = `${name}-${isotope.massNumber}`;
  const alias = isotopeAliases[isotope.id];
  return alias ? `${base} (${alias})` : base;
}

export function isotopeShortName(isotope: TeachingIsotope, language: Language) {
  if (language === "zh")
    return isotope.name.replace(/^氢-\d+（(.+)）$/u, "$1");
  return isotopeAliases[isotope.id] ?? isotopeDisplayName(isotope, language);
}

function isotopeClassification(isotope: TeachingIsotope) {
  if (isotope.halfLifeKind === "stable")
    return "NUBASE2020 labels this record stbl, meaning decay was not observed in the evaluated data. This follows that edition's classification and is not an absolute proof of stability.";
  if (isotope.halfLifeKind === "particle-unstable")
    return "The evaluated record is marked particle-unstable (p-unst); no numerical half-life is supplied in that field.";
  if (isotope.stability === "unknown")
    return isotope.halfLifeKind === "limit-only"
      ? "The evaluation lists no principal half-life value; it gives only a limit, range, or approximate information. This record is therefore left unclassified, not assumed stable."
      : "The evaluation lists no principal half-life value. This record is therefore left unclassified, not assumed stable.";
  if (isotope.halfLifeFromSystematics)
    return "The evaluation gives a finite half-life estimated from systematics; the # flag marks that property as estimated.";
  if (/^[<>~≈]/u.test(isotope.halfLifeValueRaw ?? ""))
    return "The evaluation records radioactive decay with a limit or approximate half-life; the symbol is not an exact half-life value.";
  return "The evaluation lists a finite half-life and classifies the nuclide as radioactive.";
}

export function isotopeSummary(
  isotope: TeachingIsotope,
  element: Element,
  language: Language,
) {
  if (language === "zh") return isotope.summary;
  const name = isotopeDisplayName(isotope, language, element.englishName);
  const protons = isotope.atomicNumber ?? element.number;
  const neutrons = isotope.neutronNumber ?? isotope.massNumber - protons;
  const uncertain = isotope.recordStatus === "existence-uncertain"
    ? " The evaluation marks its existence status EU (uncertain); that flag is retained rather than treated as confirmation."
    : "";
  return `${name} has ${protons} proton${protons === 1 ? "" : "s"} and ${neutrons} neutron${neutrons === 1 ? "" : "s"} (A = Z + N = ${isotope.massNumber}). ${isotopeClassification(isotope)}${uncertain}`;
}

export interface CompoundSourceForLocalization {
  id: string;
  title?: string;
  url?: string;
  publisher?: string;
  accessed?: string;
  note?: string;
  verification?: string;
}

export function compoundSourceCopy(
  source: CompoundSourceForLocalization,
  language: Language,
) {
  if (language !== "en") return source;
  if (source.id.startsWith("pubchem-compound-")) {
    // Keep the project-specific evidence trail when translating the note: the
    // date, endpoint, checked fields, formula comparison, archived response,
    // and digest are all useful caveats and should not disappear in English.
    const original = source.note ?? "";
    const date = original.match(/(\d{4}-\d{2}-\d{2})\s+实际读取/u)?.[1] ?? source.accessed;
    const endpoint = original.match(/PubChem PUG REST JSON（([^）]+)）/u)?.[1]
      ?? original.match(/API：([^。；]+)/u)?.[1];
    const fields = original.match(/字段含([^；]+)；/u)?.[1]
      ?? original.match(/PubChem PUG REST JSON 的([^；]+)；/u)?.[1];
    const englishFields = fields?.replace(/、/gu, ", ").replace(/\s*与\s*/gu, ", ");
    const molecularFormula = original.match(/数据库总分子式\s+([A-Za-z0-9]+)\s+已与展示式逐元素核对/u)?.[1];
    const archive = original.match(/原始响应：([^，。]+)，SHA-256\s+([a-f0-9]{64})/iu);
    const formulaCheck = original.includes("数据库分子式与展示式逐元素总数核对一致");
    return {
      ...source,
      note: [
        `Project notes record a PubChem PUG REST JSON read${date ? ` on ${date}` : ""}${endpoint ? ` at ${endpoint}` : ""}${englishFields ? `; fields included ${englishFields}` : ""}${molecularFormula ? `; the returned molecular formula was ${molecularFormula}, compared element by element with the displayed formula` : formulaCheck ? "; the database molecular formula and displayed formula were compared element by element and found to agree" : ""}.`,
        archive ? `Archived response: ${archive[1]}; SHA-256 ${archive[2]}.` : "",
        original.includes("不是百科正文或教材对齐证据")
          ? "The Chinese name, aliases, and explanation are editorial; they are not encyclopedia text or evidence of textbook alignment."
          : "The name explanation and summary are editorial text prepared for this site.",
      ].filter(Boolean).join(" "),
    };
  }
  return {
    ...source,
    note: source.verification === "body-read"
      ? "Project notes record that the linked source text was read. The explanation on this site is an editorial summary."
      : "Project notes record a data-level check against the linked source. The explanation on this site is an editorial summary.",
  };
}

export type CompoundLocalizationRecord = Pick<
  ExtendedCompound,
  "name" | "formula" | "aliases" | "nameExplanation" | "summary" | "composition"
> & { id?: string };

function compositionDescription(composition: Record<string, number>) {
  const parts = Object.entries(composition)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => {
      const element = elementById[id];
      const name = element ? elementName(element, "en") : id;
      const symbol = element?.symbol ?? id;
      return `${name} (${symbol}) × ${count}`;
    });
  return parts.length ? parts.join(", ") : "element counts are not available";
}

function englishAliases(aliases: string[]) {
  const seen = new Set<string>();
  return aliases.filter((alias) => {
    if (!/[A-Za-z]/u.test(alias) || /[\u3400-\u9fff]/u.test(alias)) return false;
    const key = alias.toLocaleLowerCase("en");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function compoundDisplayName(
  compound: CompoundLocalizationRecord,
  language: Language,
) {
  if (language === "zh") return compound.name;
  return compoundEnglishNames[compound.id ?? ""] ?? englishAliases(compound.aliases)[0] ?? `${compound.formula} compound`;
}

// Prefer unambiguous English names where a short alias could hide oxidation
// state, hydration state, or a distinction important to the formula lesson.
const compoundEnglishNames: Record<string, string> = {
  "inorganic-hydrogen-fluoride": "Hydrogen fluoride",
  "inorganic-hydroxylamine-sulfate": "Hydroxylammonium sulfate",
  "inorganic-hydrogen-sulfide": "Hydrogen sulfide",
  "inorganic-tin-ii-fluoride": "Tin(II) fluoride",
  "inorganic-vanadium-v-oxide": "Vanadium(V) oxide",
  "inorganic-diborane": "Diborane",
  "iron-ii-hydroxide": "Iron(II) hydroxide",
  "iron-iii-hydroxide": "Iron(III) hydroxide",
  "copper-ii-hydroxide": "Copper(II) hydroxide",
  "iron-ii-sulfate": "Iron(II) sulfate",
  "iron-iii-sulfate": "Iron(III) sulfate",
  "potassium-hydroxide": "Potassium hydroxide",
  "ammonium-chloride": "Ammonium chloride",
  "ammonium-sulfate": "Ammonium sulfate",
  "ammonium-thiocyanate": "Ammonium thiocyanate",
  "ammonium-oxalate": "Ammonium oxalate",
  "potassium-carbonate": "Potassium carbonate",
  "magnesium-carbonate": "Magnesium carbonate",
  "sodium-sulfate": "Sodium sulfate",
  "sodium-hydrogen-sulfate": "Sodium hydrogen sulfate",
  "magnesium-sulfate": "Magnesium sulfate",
  "aluminium-sulfate": "Aluminum sulfate",
  "potassium-nitrate": "Potassium nitrate",
  "sodium-nitrate": "Sodium nitrate",
  "iron-iii-nitrate": "Iron(III) nitrate",
  "trisodium-phosphate": "Trisodium phosphate",
  "calcium-phosphate": "Tricalcium phosphate",
  "potassium-chromate": "Potassium chromate",
  "potassium-dichromate": "Potassium dichromate",
  "sodium-dichromate": "Sodium dichromate",
  "sodium-chlorate": "Sodium chlorate",
  "potassium-iodate": "Potassium iodate",
  "sodium-hydrogen-sulfite": "Sodium hydrogen sulfite",
  "sodium-metabisulfite": "Sodium metabisulfite",
  "copper-sulfate-pentahydrate": "Copper(II) sulfate pentahydrate",
  "iron-sulfate-heptahydrate": "Iron(II) sulfate heptahydrate",
  "magnesium-sulfate-heptahydrate": "Magnesium sulfate heptahydrate",
  "sodium-carbonate-decahydrate": "Sodium carbonate decahydrate",
  "sodium-sulfate-decahydrate": "Sodium sulfate decahydrate",
  "sodium-thiosulfate-pentahydrate": "Sodium thiosulfate pentahydrate",
  "calcium-sulfate-dihydrate": "Calcium sulfate dihydrate",
  "borax-decahydrate": "Sodium tetraborate decahydrate (borax)",
  "potassium-thiocyanate": "Potassium thiocyanate",
  "sodium-dihydrogen-phosphate": "Sodium dihydrogen phosphate",
  "ammonium-dihydrogen-phosphate": "Ammonium dihydrogen phosphate",
  "diammonium-hydrogen-phosphate": "Diammonium hydrogen phosphate",
  "disodium-hydrogen-phosphate": "Disodium hydrogen phosphate",
  "potassium-dihydrogen-phosphate": "Potassium dihydrogen phosphate",
  "dipotassium-hydrogen-phosphate": "Dipotassium hydrogen phosphate",
  "potassium-ferrocyanide": "Potassium hexacyanoferrate(II)",
  "potassium-ferricyanide": "Potassium hexacyanoferrate(III)",
};

const compoundNamingNotes: Record<string, string> = {
  "sodium-bicarbonate": "“Bicarbonate” is the common retained name for hydrogen carbonate; the H in HCO₃ distinguishes it from carbonate salts without that hydrogen.",
  "potassium-bicarbonate": "“Bicarbonate” is the common retained name for hydrogen carbonate; the H in HCO₃ distinguishes it from carbonate salts without that hydrogen.",
  "potassium-hydroxide": "The formula pairs potassium with one hydroxide unit, OH; the group contributes one oxygen and one hydrogen.",
  "ammonium-chloride": "Ammonium is the polyatomic ion NH₄⁺, not a metal element; count its nitrogen and four hydrogen atoms alongside chlorine.",
  "ammonium-sulfate": "Two ammonium units contribute N₂H₈, paired with one sulfate group (SO₄). Parentheses multiply the entire NH₄ group.",
  "ammonium-thiocyanate": "The thiocyanate group is SCN; the other nitrogen atom comes from NH₄⁺, giving two nitrogen atoms total.",
  "ammonium-oxalate": "Oxalate is C₂O₄. Two ammonium groups contribute two nitrogen and eight hydrogen atoms.",
  "potassium-carbonate": "Two potassium atoms pair with one carbonate group (CO₃); it contains no retained hydrogen and differs from potassium hydrogen carbonate.",
  "magnesium-carbonate": "This entry is anhydrous magnesium carbonate. Hydrated and basic magnesium carbonates have different compositions and are not merged into this formula.",
  "sodium-sulfate": "This is the anhydrous sodium sulfate ratio; sodium sulfate decahydrate is a separate identity that includes ten waters of crystallization.",
  "sodium-hydrogen-sulfate": "“Hydrogen sulfate” retains one hydrogen in the sulfate group, distinguishing NaHSO₄ from sodium sulfate, Na₂SO₄.",
  "magnesium-sulfate": "This entry is anhydrous magnesium sulfate. The seven waters in magnesium sulfate heptahydrate are recorded separately.",
  "aluminium-sulfate": "Two aluminium atoms pair with three sulfate groups; the formula therefore contains three sulfur and twelve oxygen atoms.",
  "potassium-nitrate": "One potassium atom pairs with one nitrate group (NO₃) in the displayed ratio.",
  "sodium-nitrate": "Nitrate is NO₃; sodium nitrate is distinct from sodium nitrite, NaNO₂.",
  "iron-iii-nitrate": "This is anhydrous iron(III) nitrate. The subscript outside parentheses multiplies the whole nitrate group, giving three nitrogen and nine oxygen atoms.",
  "trisodium-phosphate": "Three sodium atoms pair with one phosphate group (PO₄). This formula is anhydrous and includes no waters of crystallization.",
  "disodium-hydrogen-phosphate": "“Hydrogen phosphate” retains one hydrogen in HPO₄; two sodium atoms are counted in Na₂HPO₄.",
  "potassium-dihydrogen-phosphate": "One potassium atom pairs with one dihydrogen phosphate group (H₂PO₄), which retains two hydrogen atoms.",
  "dipotassium-hydrogen-phosphate": "Two potassium atoms pair with one hydrogen phosphate group (HPO₄), which retains one hydrogen atom.",
  "calcium-phosphate": "This entry uses the tricalcium phosphate ratio: three calcium atoms pair with two phosphate groups (PO₄)₂.",
  "potassium-chromate": "Chromate is CrO₄; two potassium atoms balance one chromate group, distinguishing it from potassium dichromate.",
  "potassium-dichromate": "Dichromate is Cr₂O₇ and contains two chromium atoms per group; it is distinct from chromate, CrO₄.",
  "sodium-dichromate": "This entry is anhydrous sodium dichromate. The dichromate group contains two chromium atoms; any hydrate must include its waters separately.",
  "sodium-chlorate": "Chlorate is ClO₃, with three oxygen atoms; it differs from hypochlorite, ClO.",
  "potassium-iodate": "Iodate is IO₃ and contains oxygen; potassium iodide, KI, does not.",
  "sodium-hydrogen-sulfite": "Hydrogen sulfite retains one hydrogen in HSO₃; the name “bisulfite” is also used for this ion.",
  "sodium-metabisulfite": "Metabisulfite contains the S₂O₅ group and is distinct from sodium sulfite (SO₃) and sodium hydrogen sulfite (HSO₃).",
  "ammonium-dihydrogen-phosphate": "“Dihydrogen phosphate” identifies the H₂PO₄ unit paired with ammonium; each subscript in the formula contributes to the total atom count.",
  "diammonium-hydrogen-phosphate": "“Hydrogen phosphate” identifies the HPO₄ unit, while “diammonium” indicates two ammonium units in the formula.",
  "iron-ii-hydroxide": "The Roman numeral II identifies iron in the +2 oxidation state and distinguishes this compound from iron(III) hydroxide. The formula records two hydroxide units per iron atom.",
  "iron-iii-hydroxide": "The Roman numeral III identifies iron in the +3 oxidation state and distinguishes this compound from iron(II) hydroxide. The formula records three hydroxide units per iron atom.",
  "copper-ii-hydroxide": "Copper(II) identifies copper in the +2 oxidation state; two hydroxide units balance the one copper atom in the formula.",
  "iron-ii-sulfate": "The retained name “ferrous” denotes iron(II); “sulfate” identifies the sulfate compound, and the formula records its elemental ratio.",
  "iron-iii-sulfate": "The retained name “ferric” denotes iron(III); “sulfate” identifies the sulfate compound, and the formula records its elemental ratio.",
  "sodium-dihydrogen-phosphate": "“Dihydrogen phosphate” names the H₂PO₄ unit. This one-sodium salt differs from disodium hydrogen phosphate (Na₂HPO₄).",
  "inorganic-hydrogen-fluoride": "This entry is molecular hydrogen fluoride (HF). “Hydrofluoric acid” refers to its aqueous solution, which also contains water.",
  "inorganic-hydroxylamine-sulfate": "The dot joins hydroxylamine and sulfuric-acid salt units in a 2:1 stoichiometric formula; it is not water of crystallization.",
  "nitric-acid": "This entry represents molecular nitric acid, HNO₃. A nitric acid solution also contains water and is a mixture, a separate level of description.",
  "phosphoric-acid": "This entry is orthophosphoric acid, H₃PO₄; all three hydrogen atoms count. Phosphates and hydrogen phosphate salts are separate entries.",
  "carbonic-acid": "Carbonic acid (H₂CO₃) is distinct from carbonate salts. Its aqueous equilibria are not captured by the molecular formula alone.",
  "boric-acid": "This entry is orthoboric acid. H₃BO₃ and B(OH)₃ express the same elemental composition; the parentheses in B(OH)₃ multiply both O and H.",
  "hypochlorous-acid": "Hypochlorous acid is HClO; it is compositionally distinct from hydrochloric acid (HCl) and chloric acid (HClO₃).",
  "aluminium-hydroxide": "In Al(OH)₃, the subscript 3 outside the parentheses multiplies both O and H, giving three of each per aluminium atom.",
  "ammonium-nitrate": "Ammonium nitrate contains NH₄⁺ and NO₃⁻ units, so the formula has two nitrogen atoms in total; ammonium is a polyatomic ion, not an element.",
  "ammonium-bicarbonate": "The formula counts four hydrogens in NH₄⁺ plus one in HCO₃⁻, for five hydrogen atoms total.",
  "ammonium-carbonate": "Two ammonium units pair with carbonate. This is distinct from ammonium bicarbonate, which contains hydrogen carbonate.",
  "sodium-peroxide": "Sodium peroxide is Na₂O₂. The peroxide formula must not be reduced to NaO; the two oxygen atoms are part of the compound identity.",
  "calcium-peroxide": "Calcium peroxide is CaO₂ and is distinct from calcium oxide, CaO.",
  "potassium-manganate": "Potassium manganate is K₂MnO₄; potassium permanganate is KMnO₄, a different compound with a different oxygen count.",
  "sodium-hypochlorite": "Sodium hypochlorite is NaClO, distinct from sodium chlorate (NaClO₃). Commercial bleach solution also contains water; this formula names the compound identity.",
  "sodium-sulfite": "Sulfite is SO₃²⁻, with three oxygen atoms; sulfate is SO₄²⁻, with four. This entry gives anhydrous sodium sulfite.",
  "sodium-thiosulfate": "This entry is anhydrous sodium thiosulfate, Na₂S₂O₃. It is distinct from the commonly encountered pentahydrate, Na₂S₂O₃·5H₂O.",
  "potassium-alum": "Potassium alum is the dodecahydrate. The twelve waters of crystallization contribute 24 hydrogen atoms and 12 oxygen atoms to the displayed formula.",
  "mohrs-salt": "Mohr’s salt contains two ammonium units, one iron(II), two sulfate units, and six waters of crystallization, all included in the displayed atom counts.",
  "potassium-ferrocyanide": "The brackets group the complex ion [Fe(CN)₆]⁴⁻: six CN groups contribute six carbon and six nitrogen atoms. Ferrocyanide contains iron(II), balanced here by four potassium ions.",
  "potassium-ferricyanide": "The brackets group the complex ion [Fe(CN)₆]³⁻: six CN groups contribute six carbon and six nitrogen atoms. Ferricyanide contains iron(III), balanced here by three potassium ions.",
  "borax-decahydrate": "This decahydrate includes ten waters of crystallization in its displayed formula; those waters contribute to the hydrogen and oxygen totals.",
  "sodium-thiosulfate-pentahydrate": "The five waters of crystallization are included in Na₂S₂O₃·5H₂O and contribute 10 hydrogen and 5 oxygen atoms.",
  "copper-sulfate-pentahydrate": "The five waters of crystallization are included in CuSO₄·5H₂O and contribute 10 hydrogen and 5 oxygen atoms.",
  "iron-sulfate-heptahydrate": "The seven waters of crystallization are included in FeSO₄·7H₂O and contribute 14 hydrogen and 7 oxygen atoms.",
  "magnesium-sulfate-heptahydrate": "The seven waters of crystallization are included in MgSO₄·7H₂O and contribute 14 hydrogen and 7 oxygen atoms.",
  "sodium-carbonate-decahydrate": "The ten waters of crystallization are included in Na₂CO₃·10H₂O and contribute 20 hydrogen and 10 oxygen atoms.",
  "sodium-sulfate-decahydrate": "The ten waters of crystallization are included in Na₂SO₄·10H₂O and contribute 20 hydrogen and 10 oxygen atoms; this differs from anhydrous sodium sulfate.",
  "calcium-sulfate-dihydrate": "The two waters of crystallization are included in CaSO₄·2H₂O and contribute 4 hydrogen and 2 oxygen atoms. Natural gypsum material may contain other components.",
  "potassium-thiocyanate": "The thiocyanate group SCN contains sulfur, carbon, and nitrogen; together with potassium, the formula contains four elements.",
  "game-calcium-hydroxyapatite": "The formula groups phosphate units and hydroxide units; each parenthesized group is multiplied by its following subscript when counting atoms.",
  "game-fluorapatite": "The formula groups phosphate units and counts six fluorine atoms; it is the fluorapatite identity, distinct from hydroxyapatite, which contains hydroxide instead.",
  "game-calcium-dihydrogen-phosphate-monohydrate": "“Dihydrogen phosphate” identifies H₂PO₄ units, and “monohydrate” adds one H₂O unit to the formula.",
  "game-sodium-ammonium-hydrogen-phosphate-tetrahydrate": "The formula includes sodium, ammonium, hydrogen phosphate, and four waters of crystallization; each water contributes two H and one O.",
  "game-sodium-pyrophosphate-decahydrate": "Pyrophosphate is P₂O₇, not orthophosphate PO₄. The decahydrate includes ten waters of crystallization in the formula.",
  "game-sodium-metaborate-tetrahydrate": "Metaborate units and four waters of crystallization are both included in the displayed atom counts.",
  "game-sodium-perborate-monohydrate": "This monohydrate includes one water of crystallization in its formula; it is not the anhydrous identity.",
  "game-potassium-aluminum-sulfate": "This reference entry is potassium aluminum sulfate without waters of crystallization; compare potassium alum, the dodecahydrate.",
  "game-potassium-magnesium-sulfate": "The formula records a double sulfate containing potassium and magnesium; each sulfate group contributes one sulfur and four oxygen atoms.",
  "game-potassium-cobaltinitrite-monohydrate": "The nitrite groups are grouped in parentheses and multiplied by the subscript; the monohydrate adds one H₂O unit.",
  "game-potassium-tetrachloroaurate": "The bracketed [AuCl₄] unit groups one gold and four chlorine atoms; potassium is the counterion in the formula.",
  "inorganic-vanadyl-sulfate": "VOSO₄ contains the vanadyl unit VO and one sulfate group; vanadium is in the +4 oxidation state.",
  "inorganic-manganese-tetroxide": "Mn₃O₄ is a mixed-valence oxide containing manganese(II) and manganese(III), with a manganese-to-oxygen atom ratio of 3:4.",
  "inorganic-cobalt-tetroxide": "Co₃O₄ is a mixed-valence oxide containing both cobalt(II) and cobalt(III).",
  "inorganic-sodium-ferricyanide": "The bracketed complex contains six cyanide ligands around iron(III); the formula also includes three sodium atoms.",
  "inorganic-hexaamminecobalt-iii-chloride": "Cobalt is in the +3 oxidation state. Six NH₃ molecules are ammine ligands, distinct from ammonium ions; three chloride ions are also present.",
  "inorganic-tetraamminecopper-ii-sulfate-monohydrate": "Copper is in the +2 oxidation state; four NH₃ molecules are ammine ligands, and the formula includes one water of crystallization.",
  "game-magnesium-aluminate": "MgAl₂O₄ contains one magnesium, two aluminum, and four oxygen atoms; the formula names both metal elements in the oxide.",
  "game-calcium-aluminate": "CaAl₂O₄ contains one calcium, two aluminum, and four oxygen atoms.",
  "game-tricalcium-aluminate": "“Tricalcium” indicates three calcium atoms; the formula also contains two aluminum and six oxygen atoms.",
  "game-dicalcium-silicate": "“Dicalcium” indicates two calcium atoms; the SiO₄ group contributes one silicon and four oxygen atoms.",
  "game-tricalcium-silicate": "“Tricalcium” indicates three calcium atoms; the formula also contains one silicon and five oxygen atoms.",
  "game-strontium-titanate": "SrTiO₃ contains one strontium, one titanium, and three oxygen atoms.",
  "game-calcium-titanate": "CaTiO₃ contains one calcium, one titanium, and three oxygen atoms.",
  "game-sodium-niobate": "NaNbO₃ has the atom ratio sodium:niobium:oxygen = 1:1:3.",
  "game-lithium-niobate": "LiNbO₃ contains one lithium, one niobium, and three oxygen atoms.",
  "game-lithium-tantalate": "LiTaO₃ contains one lithium, one tantalum, and three oxygen atoms; tantalum and niobium are different elements.",
  "game-lithium-cobalt-oxide": "LiCoO₂ contains one lithium, one cobalt, and two oxygen atoms.",
  "game-lithium-iron-phosphate": "LiFePO₄ contains one lithium, one iron, one phosphorus, and four oxygen atoms in the phosphate group.",
  "game-lithium-manganese-oxide": "LiMn₂O₄ contains one lithium, two manganese, and four oxygen atoms; its metal composition differs from LiCoO₂.",
  "game-nickel-ferrite": "NiFe₂O₄ contains one nickel, two iron, and four oxygen atoms.",
  "game-sodium-stannate-trihydrate": "The sodium stannate formula unit is accompanied by three waters of crystallization, contributing six hydrogen and three oxygen atoms.",
  "game-cobalt-aluminate": "CoAl₂O₄ contains one cobalt, two aluminum, and four oxygen atoms.",
  "game-barium-zirconate": "BaZrO₃ has the atom ratio barium:zirconium:oxygen = 1:1:3.",
  "game-calcium-zirconate": "CaZrO₃ contains one calcium, one zirconium, and three oxygen atoms.",
  "game-lead-titanate": "PbTiO₃ contains one lead, one titanium, and three oxygen atoms.",
  "game-nickel-titanate": "NiTiO₃ contains one nickel, one titanium, and three oxygen atoms; it is distinct from other oxides containing nickel or titanium.",
  "game-sodium-cobaltinitrite": "The bracketed complex contains one cobalt, six nitrogen, and twelve oxygen atoms; three sodium atoms lie outside the brackets.",
  "game-ammonium-phosphomolybdate": "Three ammonium groups contribute three nitrogen and twelve hydrogen atoms; the phosphomolybdate group also contains phosphorus, molybdenum, and oxygen.",
  "game-sodium-phosphomolybdate": "The formula gives three sodium, one phosphorus, twelve molybdenum, and forty oxygen atoms.",
  "game-sodium-oxide": "Na₂O contains two sodium atoms and one oxygen atom; sodium peroxide (Na₂O₂) has a different oxygen count.",
  "inorganic-hydrogen-sulfide": "This entry is molecular hydrogen sulfide. “Hydrosulfuric acid” refers to its aqueous solution.",
  "inorganic-calcium-carbide": "Calcium carbide is traditionally classified as an inorganic carbide; keep CaC₂ as written rather than reducing its formula ratio.",
  "inorganic-sodium-hexafluoroaluminate": "AlF₆ is a hexafluoroaluminate complex ion. This inorganic fluoride complex contains no organic ligands.",
  "inorganic-copper-ii-carbonate": "This entry is anhydrous copper(II) carbonate. Basic copper carbonate, which also contains hydroxide, is a separate identity.",
  "inorganic-mercury-i-chloride": "Mercury(I) is counted as the Hg₂ unit in Hg₂Cl₂; do not reduce this formula to HgCl.",
  "inorganic-uranyl-nitrate": "UO₂ is the uranyl group, paired here with two nitrate groups.",
  "inorganic-hydroxylamine-hydrochloride": "The dot joins hydroxylamine and hydrogen chloride in an addition-compound formula; it does not indicate water of crystallization. The total composition is NH₄ClO.",
  "inorganic-diborane": "Diborane is a traditional name for this boron hydride; its B₂H₆ formula contains no carbon.",
  "inorganic-carbon-disulfide": "Carbon disulfide is a carbon-containing compound traditionally classified in inorganic chemistry.",
  "inorganic-phosgene": "This entry is the carbonyl chloride molecule, also traditionally known as phosgene.",
  "inorganic-cyanogen": "This entry is the dicyanogen molecule (C₂N₂), not a single cyanide ion.",
  "inorganic-ammonium-heptamolybdate-tetrahydrate": "This tetrahydrate contains seven molybdenum and twenty-four oxygen atoms in the heptamolybdate unit, plus four waters of crystallization.",
  "inorganic-sodium-ferrocyanide": "The brackets group six cyanide ligands around iron(II); the CN ligands contribute both carbon and nitrogen and are retained in this inorganic reference scope.",
};

const ionGroupNames: Record<string, string> = {
  "硝酸": "nitrate (NO₃)",
  "硫酸": "sulfate (SO₄)",
  "磷酸": "phosphate (PO₄)",
  "碳酸": "carbonate (CO₃)",
  "钼酸": "molybdate (MoO₄)",
  "四氟硼酸": "tetrafluoroborate (BF₄)",
  "六氟磷酸": "hexafluorophosphate (PF₆)",
  "铬酸": "chromate (CrO₄)",
  "钨酸": "tungstate (WO₄)",
  "氟硅酸": "hexafluorosilicate (SiF₆)",
  "焦磷酸": "pyrophosphate (P₂O₇)",
  "亚硝酸": "nitrite (NO₂)",
  "过二硫酸": "persulfate (S₂O₈)",
  "三聚磷酸": "tripolyphosphate (P₃O₁₀)",
  "连二亚硫酸": "dithionite (S₂O₄)",
  "硫代硫酸": "thiosulfate (S₂O₃)",
  "亚硫酸": "sulfite (SO₃)",
  "焦亚硫酸": "metabisulfite (S₂O₅)",
  "氯酸": "chlorate (ClO₃)",
  "高锰酸": "permanganate (MnO₄)",
};

/** Translate recurring, source-authored explanation templates without dropping their counts or caveats. */
function translateInorganicExplanation(text: string, formula: string): string | undefined {
  const exact: Record<string, string> = {
    "“铵”表示 NH4 离子部分；氮和氢都按化学式的下标计数。": "Ammonium denotes the NH₄ ion; count its nitrogen and hydrogen atoms from the subscripts.",
    "式中的 OH 表示氢氧根部分；括号外的下标同时乘到氧和氢。": "OH denotes the hydroxide group; a subscript outside parentheses multiplies both oxygen and hydrogen.",
    "名称中的“氢”指酸根中保留的氢，和不带氢的正盐分别记录。": "“Hydrogen” in the name marks hydrogen retained in the anion; these acid salts are recorded separately from salts without that hydrogen.",
    "名称中的“氰”对应 CN 部分，碳和氮都属于元素组成，传统上归入无机化学。": "The CN group contributes both carbon and nitrogen; this compound is traditionally classified in inorganic chemistry.",
    "分子式记录这一化学身份，不表示水溶液中只存在这一种粒子。": "The molecular formula identifies the substance; it does not mean this is the only species present in aqueous solution.",
    "氰化氢是传统归入无机化学的含碳化合物。": "Hydrogen cyanide is a carbon-containing compound traditionally classified in inorganic chemistry.",
    "方括号内有四个氯配体，钯为二价。": "The bracketed complex contains four chloride ligands, and palladium is in the +2 oxidation state.",
    "同一元素写在不同位置时须合并计数": "When an element appears in multiple positions, add its counts together.",
    "本条指硫化氢分子；氢硫酸专指它的水溶液。": "This entry is molecular hydrogen sulfide; hydrosulfuric acid refers to its aqueous solution.",
    "硫氰酸根写作 SCN，三个字母分别代表硫、碳、氮。": "Thiocyanate is written SCN; the letters stand for sulfur, carbon, and nitrogen.",
    "这是传统归入无机化学的碳化物；CaC2 的计量式不约分。": "This carbide is traditionally classified in inorganic chemistry; the CaC₂ formula unit is not reduced.",
    "式中的 AlF6 部分是六氟合铝配合离子；无机含氟配合物不含有机配体。": "AlF₆ is a fluoroaluminate complex ion; this inorganic fluoride complex contains no organic ligand.",
    "这是含二价铅和四价铅的混合价氧化物，不能把 Pb3O4 约分。": "This is a mixed-valence oxide containing lead(II) and lead(IV); Pb₃O₄ must not be reduced.",
  };
  if (exact[text]) return exact[text];

  const group = text.match(/^名称中的“([^”]+)”对应(.+?)；括号外下标作用于整个部分。?$/u);
  if (group) {
    const ion = ionGroupNames[group[1]];
    if (ion) return `The name identifies the ${ion} group; a subscript outside parentheses multiplies the entire group.`;
  }

  const hydrate = text.match(/^“水合”表示每个前部计量式对应 (\d+) 份水；这些水合计贡献 (\d+) 个氢和 (\d+) 个氧。?$/u);
  if (hydrate) return `“Hydrate” means ${hydrate[1]} water molecule${hydrate[1] === "1" ? "" : "s"} per formula unit; these contribute ${hydrate[2]} hydrogen and ${hydrate[3]} oxygen atoms.`;

  const simpleFormula = text.match(/^(.+?)由化学式 ([A-Za-z0-9()]+) 所示元素组成；同一元素写在不同位置时须合并计数。$/u);
  if (simpleFormula) return `The formula ${simpleFormula[2]} gives this substance's composition; add counts when the same element appears in more than one position.`;

  const formulaRatio = text.match(/^.+?的式子为 ([A-Za-z0-9()]+)；下标表示每个计量式中相应元素的数量，不表示混合比例。$/u);
  if (formulaRatio) return `The formula ${formulaRatio[1]} gives atom counts in one formula unit; its subscripts do not describe mixture proportions.`;

  const specificFormula = text.match(/^本条名称对应 ([A-Za-z0-9()]+) 这一明确化学身份，化学式的下标保留其完整计量关系。?$/u);
  if (specificFormula) return `This entry identifies the substance with formula ${specificFormula[1]}; its subscripts preserve the full stoichiometric ratio.`;

  const oxidationFormula = text.match(/^本条采用 ([A-Za-z0-9()]+) 的计量式，与其他价态的同元素化合物分别辨认。?$/u);
  if (oxidationFormula) return `This entry uses the ${oxidationFormula[1]} ratio and is distinguished from compounds of the same element in other oxidation states.`;

  const complex = text.match(/^方括号内有([一二两三四五六七八])个(氰|氯|氟|碘)配体，([^；。]+)(?:；([^。]+))?。?$/u);
  if (complex) {
    const counts: Record<string, string> = { "一": "one", "二": "two", "两": "two", "三": "three", "四": "four", "五": "five", "六": "six", "七": "seven", "八": "eight" };
    const ligands: Record<string, string> = { "氰": "cyanide", "氯": "chloride", "氟": "fluoride", "碘": "iodide" };
    const metals: Record<string, string> = { "金": "gold", "银": "silver", "铂": "platinum", "铁": "iron", "汞": "mercury", "钛": "titanium", "锆": "zirconium", "钴": "cobalt" };
    const valences: Record<string, string> = { "一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6" };
    const oxidationState = complex[3].match(/(.+)为([一二三四五六])价/u);
    const metal = oxidationState ? metals[oxidationState[1]] : undefined;
    if (metal) {
      const extra = complex[4]?.includes("两个铵根")
        ? " Two ammonium groups outside the brackets are counted separately."
        : "";
      return `The bracketed complex contains ${counts[complex[1]]} ${ligands[complex[2]]} ligands; ${metal} is in the +${valences[oxidationState![2]]} oxidation state.${extra}`;
    }
  }

  if (/在本条采用 [A-Za-z0-9()]+ 的化学式；这是酸的组成，与相应酸根或盐的计量式分别记录。$/u.test(text))
    return `This entry gives the acid composition as ${formula}; the corresponding anion and salts are recorded separately.`;
  const oxidation = text.match(/^名称中的 (I|II|III|IV|V|VI) 读作([一二三四五六])，表示该金属为[一二三四五六]价。?$/u);
  if (oxidation) {
    const state: Record<string, string> = { "一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6" };
    return `The Roman numeral identifies the metal's +${state[oxidation[2]]} oxidation state.`;
  }
  if (/^方括号内含有配位部分；式中其余元素计数不变。$/u.test(text))
    return "Square brackets group a coordination complex; the other atoms in the formula are counted as written.";
  return undefined;
}

function translateInorganicExplanationText(text: string, formula: string) {
  const whole = translateInorganicExplanation(text, formula);
  if (whole) return whole;
  const translated = text
    .split(/(?<=。)/u)
    .filter(Boolean)
    .map((sentence) => translateInorganicExplanation(sentence, formula));
  if (!translated.length || translated.some((sentence) => !sentence)) return undefined;
  return translated.join(" ");
}

export function localizeCompoundReference<T extends CompoundLocalizationRecord>(
  compound: T,
  language: Language,
): T {
  if (language !== "en") return compound;
  const name = compoundDisplayName(compound, language);
  const parts = compositionDescription(compound.composition);
  const id = compound.id ?? "";
  const aliases = englishAliases(compound.aliases).filter(
    (alias) =>
      alias.toLocaleLowerCase("en") !== name.toLocaleLowerCase("en") &&
      !(
        (id === "inorganic-hydrogen-fluoride" && alias.toLocaleLowerCase("en") === "hydrofluoric acid") ||
        (id === "inorganic-hydrogen-sulfide" && alias.toLocaleLowerCase("en") === "hydrosulfuric acid") ||
        (id === "inorganic-tin-ii-fluoride" && alias.toLocaleLowerCase("en") === "stop")
      ),
  );
  const translatedExplanation = compoundNamingNotes[id]
    ?? translateInorganicExplanationText(compound.nameExplanation, compound.formula);
  return {
    ...compound,
    name,
    aliases,
    nameExplanation:
      translatedExplanation ??
      `“${name}” is an English alias retained for this reference entry. The displayed formula ${compound.formula} identifies the atom ratio: ${parts}. A count of one is written without a subscript.`,
    summary: `This formula-indexed reference entry is identified by ${compound.formula}. Its elemental composition is ${parts}. Where a trailing H₂O term appears after a dot, it denotes water of crystallization; a dot between non-water components denotes the stoichiometric combination shown. This entry describes composition and identity, not a preparation route or reaction conditions.`,
  };
}

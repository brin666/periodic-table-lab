import { isContentVisible } from "./curriculum";
import { elementById, sourceById, substanceById, substances } from "./catalog";
import type { Substance } from "./types";
import {
  extendedCompounds,
  extensionCompoundSources,
  type ExtendedCompound,
} from "./compound-extensions";
import {
  compoundGameExpansion,
  compoundGameExpansionSources,
} from "./compound-game-expansion";
import {
  inorganicCompounds,
  inorganicCompoundSources,
} from "./inorganic-compounds";
import { isInorganicDiscoveryEntry } from "./compound-scope";

export { assignSelectedElement } from "./element-selection";

type CompoundIdentity = {
  id: string;
  name: string;
  composition: Record<string, number>;
  sourceIds?: string[];
  aliases?: string[];
  cas?: string;
};

function chemicalIdentityKeys(compound: CompoundIdentity): string[] {
  const keys = [`id:${compound.id}`];
  for (const sourceId of compound.sourceIds ?? []) {
    if (/^pubchem-compound-\d+$/u.test(sourceId))
      keys.push(`pubchem:${sourceId}`);
  }
  if (compound.cas) keys.push(`cas:${compound.cas.replace(/[^\d-]/gu, "")}`);
  return keys;
}

function uniqueByChemicalIdentity<T extends CompoundIdentity>(
  compounds: T[],
): T[] {
  const identities = new Set<string>();
  return compounds.filter((compound) => {
    const keys = chemicalIdentityKeys(compound);
    if (keys.some((key) => identities.has(key))) return false;
    for (const key of keys) identities.add(key);
    return true;
  });
}

export const discoveryReferenceCompounds = uniqueByChemicalIdentity([
  ...extendedCompounds.filter(isInorganicDiscoveryEntry),
  ...inorganicCompounds,
  ...compoundGameExpansion.filter(isInorganicDiscoveryEntry),
]);
export const discoveryReferenceSources = [
  ...new Map(
    [
      ...extensionCompoundSources,
      ...inorganicCompoundSources,
      ...compoundGameExpansionSources,
    ].map((source) => [source.id, source]),
  ).values(),
];
const catalogDiscoveryCompounds = substances.filter(
  (substance) =>
    substance.kind === "compound" && isInorganicDiscoveryEntry(substance),
);
export function discoveryCompoundCount(mode: CompoundDiscoveryMode) {
  const visibleCatalog = catalogDiscoveryCompounds.filter((compound) =>
    isContentVisible(mode, compound.level),
  );
  return uniqueByChemicalIdentity(
    mode === "senior"
      ? [...visibleCatalog, ...discoveryReferenceCompounds]
      : visibleCatalog,
  ).length;
}

export type CompoundDiscoveryMode = "junior" | "senior";
export type CompoundDiscoveryPair = [string | null, string | null];
type BinaryDiscoveredCompound = Substance & { detailAvailable: boolean };
export interface DiscoveredCompound {
  id: string;
  name: string;
  formula: string;
  composition: Record<string, number>;
  level: "junior" | "senior" | "extension";
  detailAvailable: boolean;
  catalogId?: string;
  reference?: ExtendedCompound;
}

/** One element finds every in-scope compound containing it; larger selections match exactly. */
export function findCompounds(
  selection: string[],
  mode: CompoundDiscoveryMode,
): DiscoveredCompound[] {
  const selected = new Set(selection);
  if (selected.size === 0 || [...selected].some((id) => !elementById[id]))
    return [];
  const matches = (composition: Record<string, number>) => {
    const ids = Object.keys(composition).filter((id) => composition[id] > 0);
    if (selected.size === 1) return ids.some((id) => selected.has(id));
    return ids.length === selected.size && ids.every((id) => selected.has(id));
  };
  const existing: DiscoveredCompound[] = catalogDiscoveryCompounds
    .filter(
      (substance) =>
        substance.kind === "compound" &&
        isContentVisible(mode, substance.level) &&
        matches(substance.composition),
    )
    .map((substance) => ({
      id: substance.id,
      name: substance.name,
      formula: substance.formula,
      composition: substance.composition,
      level: substance.level,
      detailAvailable: Boolean(
        substance.summary.trim() &&
        substance.sourceIds.some(
          (id) => sourceById[id] && sourceById[id].verification !== "pending",
        ),
      ),
      catalogId: substance.id,
    }));
  if (mode !== "senior") return uniqueByChemicalIdentity(existing);
  const references: DiscoveredCompound[] = discoveryReferenceCompounds
    .filter((compound) => matches(compound.composition))
    .map((reference) => ({
      id: reference.id,
      name: reference.name,
      formula: reference.formula,
      composition: reference.composition,
      level: "extension",
      detailAvailable: true,
      reference,
    }));
  return uniqueByChemicalIdentity([...existing, ...references]);
}

/**
 * Return only catalog compounds whose complete elemental composition contains
 * exactly the two selected elements. This describes catalog relationships; it
 * does not claim that the elements react under any particular conditions.
 */
export function findBinaryCompounds(
  pair: CompoundDiscoveryPair,
  mode: CompoundDiscoveryMode,
): BinaryDiscoveredCompound[] {
  const [first, second] = pair;
  if (!first || !second || first === second) return [];

  const selected = new Set([first, second]);
  return substances
    .filter((substance) => {
      if (substance.kind !== "compound") return false;
      if (!isInorganicDiscoveryEntry(substance)) return false;
      if (!isContentVisible(mode, substance.level)) return false;
      const composedElements = Object.entries(substance.composition)
        .filter(([, count]) => count > 0)
        .map(([elementId]) => elementId);
      return (
        composedElements.length === 2 &&
        composedElements.every((elementId) => selected.has(elementId))
      );
    })
    .map((substance) => {
      const catalogEntry = substanceById[substance.id];
      const hasVerifiedSource = substance.sourceIds.some((sourceId) => {
        const source = sourceById[sourceId];
        return Boolean(source && source.verification !== "pending");
      });
      const detailAvailable = Boolean(
        catalogEntry &&
        catalogEntry.summary.trim() &&
        catalogEntry.sourceIds.length > 0 &&
        hasVerifiedSource,
      );
      return { ...substance, detailAvailable };
    });
}

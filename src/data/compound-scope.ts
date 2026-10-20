/**
 * The homepage is an inorganic-compound explorer. Carbon is not an organic
 * classifier: these independently curated carbonates, cyanide complexes and
 * thiocyanates remain in scope. Unclassified carbon entries are withheld.
 * Newly imported inorganic records have their own reviewed dataset boundary.
 */
const inorganicCarbonIds = new Set([
  "carbon-dioxide",
  "lithium-carbonate",
  "sodium-carbonate",
  "calcium-carbonate",
  "carbonic-acid",
  "ammonium-bicarbonate",
  "ammonium-carbonate",
  "ammonium-thiocyanate",
  "sodium-bicarbonate",
  "potassium-bicarbonate",
  "potassium-carbonate",
  "magnesium-carbonate",
  "sodium-carbonate-decahydrate",
  "potassium-ferrocyanide",
  "potassium-ferricyanide",
  "potassium-thiocyanate",
]);

export function isInorganicDiscoveryEntry(compound: {
  id: string;
  composition: Record<string, number>;
}): boolean {
  return !compound.composition.c || inorganicCarbonIds.has(compound.id);
}

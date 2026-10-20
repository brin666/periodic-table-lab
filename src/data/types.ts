export type Level = "junior" | "senior" | "extension";
export type Category =
  | "alkali"
  | "alkaline"
  | "transition"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble"
  | "lanthanide"
  | "actinide";
export interface Source {
  id: string;
  title: string;
  url: string;
  kind: "textbook" | "reference";
  publisher: string;
  accessed: string;
  note: string;
  edition?: string;
  volume?: string;
  pages?: string;
  verification: "body-read" | "data-read" | "pending";
}
export interface Element {
  id: string;
  number: number;
  symbol: string;
  name: string;
  englishName: string;
  category: Category;
  period: number;
  group: number | null;
  column: number;
  row: number;
  atomicMass: string;
  electronConfiguration: string;
  shells: number[];
  electronNote?: string;
  sourceIds: string[];
}
export interface ElementStory {
  elementId: string;
  headline: string;
  summary: string;
  facts: { title: string; text: string }[];
  substanceIds: string[];
  level: Level;
  sourceIds: string[];
}
export type Artwork =
  | "water"
  | "peroxide"
  | "gas"
  | "salt"
  | "metal"
  | "mineral"
  | "carbon"
  | "sand"
  | "liquid"
  | "crystal"
  | "fertilizer"
  | "sulfur";
export interface Substance {
  id: string;
  name: string;
  englishName: string;
  formula: string;
  kind: "elemental" | "compound";
  structure: "molecular" | "monatomic" | "ionic" | "metallic" | "network";
  composition: Record<string, number>;
  appearance: string;
  summary: string;
  note: string;
  level: Level;
  artwork: Artwork;
  color: string;
  equationIds: string[];
  sourceIds: string[];
}
export interface EquationTerm {
  substanceId: string;
  coefficient: number;
  state: "s" | "l" | "g" | "aq";
  marker?: "gas" | "precipitate";
}
export interface Equation {
  id: string;
  title: string;
  reactants: EquationTerm[];
  products: EquationTerm[];
  condition: string;
  catalystId?: string;
  reversible?: boolean;
  note: string;
  level: Level;
  sourceIds: string[];
}

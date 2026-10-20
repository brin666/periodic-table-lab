import { elements } from "./elements";
import { elementSources } from "./element-sources";
import { substances, equations, stories, contentSources } from "./content";
import { textbookSources } from "./textbook-sources";
import type { Category, Level } from "./types";
export { elements, substances, equations, stories };
export const sources = [
  ...elementSources,
  ...contentSources,
  ...textbookSources,
];
export const elementById = Object.fromEntries(elements.map((x) => [x.id, x]));
export const substanceById = Object.fromEntries(
  substances.map((x) => [x.id, x]),
);
export const equationById = Object.fromEntries(equations.map((x) => [x.id, x]));
export const storyById = Object.fromEntries(
  stories.map((x) => [x.elementId, x]),
);
export const sourceById = Object.fromEntries(sources.map((x) => [x.id, x]));
export const levels: Record<Level, string> = {
  junior: "初中",
  senior: "高中",
  extension: "拓展",
};
export const categories: Record<
  Category,
  { name: string; color: string; ink: string }
> = {
  nonmetal: { name: "其他非金属", color: "#dbe6c9", ink: "#374c2d" },
  alkali: { name: "碱金属", color: "#ebc6ba", ink: "#704338" },
  alkaline: { name: "碱土金属", color: "#eddbaf", ink: "#655029" },
  transition: { name: "过渡金属", color: "#e8dfc5", ink: "#625332" },
  "post-transition": { name: "后过渡金属", color: "#cbdddd", ink: "#385757" },
  metalloid: { name: "类金属", color: "#c4dcca", ink: "#365745" },
  halogen: { name: "卤素", color: "#cfdfb4", ink: "#41552b" },
  noble: { name: "稀有气体", color: "#d9d3e8", ink: "#55466e" },
  lanthanide: { name: "镧系", color: "#d2dcea", ink: "#3c516e" },
  actinide: { name: "锕系", color: "#dfd3df", ink: "#604860" },
};

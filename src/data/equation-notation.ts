/**
 * Short annotations for the 25 reviewed reactions. Keep physical context out
 * of the relation sign; full conditions remain in the underlying source data.
 * See research/reaction-notation-20261016/REPORT.md for evidence and limits.
 */
interface EquationNotation {
  above?: string;
  below?: string;
  context?: string;
}

export const equationNotationById: Record<string, EquationNotation> = {
  "hydrogen-combustion": { above: "点燃" },
  "water-electrolysis": { above: "通电" },
  "peroxide-decomposition": { above: "MnO₂" },
  "peroxide-redox": {
    context: "反应介质为稀硫酸；H₂SO₄同时参与反应，已列入反应物。",
  },
  "haber-synthesis": {
    above: "高温、高压",
    below: "铁催化剂",
    context: "参考工业条件约400–500 °C、150–250 atm，是速率与产率的折中。",
  },
  "calcium-carbonate-decomposition": { above: "高温" },
  "calcium-oxide-hydration": {},
  "carbon-dioxide-sodium-hydroxide": { context: "水溶液中，NaOH足量。" },
  "sodium-chloride-electrolysis": {
    above: "通电",
    context: "饱和食盐水；完整总式适用于合适电极、产物分隔的体系。",
  },
  "sodium-water": {},
  "sodium-chlorine": { above: "△" },
  "magnesium-oxygen": { above: "点燃" },
  "magnesium-steam": { above: "△", context: "反应物为高温水蒸气。" },
  "magnesium-carbon-dioxide": { above: "点燃" },
  "iron-oxygen": { above: "点燃" },
  "magnesium-hydrochloric-acid": {},
  "zinc-hydrochloric-acid": {},
  "zinc-copper-sulfate": {},
  "copper-silver-nitrate": {},
  "silver-chloride-precipitation": {},
  "barium-sulfate-precipitation": {},
  "magnesium-hydroxide-neutralization": {},
  "chlorine-sodium-bromide": { context: "稀水溶液中，生成的溴仍溶于水。" },
  "potassium-chlorate-decomposition": {
    above: "△",
    context: "充分加热、完全热分解的净反应；本条未加入催化剂。",
  },
  "aluminium-oxygen": { context: "常温空气中，表示铝表面氧化的总组成关系。" },
};

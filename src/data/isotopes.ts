/**
 * NUBASE2020 ground-state index, imported from the preserved source on 2026-10-16.
 * teachingIsotopes retains the selected introductory examples; allIsotopes covers
 * the version's Z=1–118, i=0 records except RN (reported non-existent) entries.
 * Estimated properties and the EU existence flag are retained, not promoted to
 * evidence of discovery. This is not a real-time census of discovered nuclides.
 * massNumber is A (protons + neutrons), not an element's standard atomic weight.
 * "stable" follows NUBASE2020's stbl label, including nuclides with no observed decay.
 * Proton and neutron counts belong in the UI: Z = element.number; N = A - Z.
 */
import { elements } from "./elements";
import { nubase2020GroundStateRows } from "./nuclides";
export { nuclideDatasetInfo } from "./nuclide-metadata";

export type HalfLifeKind =
  "stable" | "value" | "particle-unstable" | "limit-only" | "not-reported";

export interface TeachingIsotope {
  id: string;
  elementId: string;
  massNumber: number;
  name: string;
  stability: "stable" | "radioactive" | "unknown";
  summary: string;
  sourceIds: string[];
  atomicNumber?: number;
  neutronNumber?: number;
  /** Whole original columns 70–88, trimmed. Includes unit and uncertainty/limit. */
  halfLifeRaw?: string;
  halfLifeValueRaw?: string;
  halfLifeUnit?: string;
  halfLifeUncertaintyRaw?: string;
  halfLifeKind?: HalfLifeKind;
  /** Only the half-life property's # flag; false does not prove direct measurement. */
  halfLifeFromSystematics?: boolean;
  massExcessRaw?: string;
  massExcessUncertaintyRaw?: string;
  massExcessFromSystematics?: boolean;
  /** Includes IS (isotopic abundance) on stable records; kept as source notation. */
  decayModesRaw?: string;
  discoveryYearRaw?: string;
  recordFlagRaw?: string;
  recordStatus?: "evaluated" | "existence-uncertain" | "reported-nonexistent";
  stateOrderingFlagsRaw?: string;
  sourceStateIndex?: 0;
  sourceLineNumber?: number;
}

export interface IsotopeSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  note: string;
}

export const isotopeSources: IsotopeSource[] = [
  {
    id: "nubase2020",
    title: "NUBASE2020 核物理性质评价数据",
    publisher: "Atomic Mass Data Center；IAEA Nuclear Data Services 托管",
    url: "https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt",
    note: "2026-10-16 下载并逐列导入 Z=1–118、i=0 的3557条基态记录。学生索引排除2条 RN（评价中报告不存在），展示3555条，覆盖118元素；含估计条目及1条 EU（存在性待确认）。stable 对应 stbl，表示该评价未观测到衰变；主半衰期值为空时保守标为未知。# 仅限定其所在性质由系统趋势估计，不能当作核素未发现的标记；无 # 也不能单独证明直接实测。版本为 NUBASE2020，不表示实时已发现核素全集。原始数值表与 SHA-256 记录随源码保存在 tests/fixtures/nubase2020/；历史导入脚本保留在本机研究档案中，不随本仓库发布。",
  },
  {
    id: "nubase2020-paper",
    title: "The NUBASE2020 evaluation of nuclear physics properties",
    publisher: "F. G. Kondev 等；Chinese Physics C 45, 030001 (2021)",
    url: "https://www-nds.iaea.org/amdc/ame2020/NUBASE2020.pdf",
    note: "2026-10-16 阅读引言、§2及§2.2–2.3，核对评价含未观测核素的估计性质、RN/EU存在性标记及半衰期界限。该评价考虑截至2020-10-30可获得的实验文献；本页采用版本范围，不称为2026年实时全集。",
  },
  {
    id: "openstax-atomic-structure",
    title: "Chemistry 2e §2.3：Atomic Structure and Symbolism",
    publisher: "OpenStax / Rice University",
    url: "https://openstax.org/books/chemistry-2e/pages/2-3-atomic-structure-and-symbolism",
    note: "2026-10-15 阅读正文、Table 2.4及镁核素示例。支持 Z 为质子数、A 为质子数与中子数之和、N=A−Z，以及氢/氦/硼/碳/氮/氧和镁的核素组成；用于区分质量数与平均原子质量。属于教材外参考资料。",
  },
  {
    id: "ciaaw-isotopic-compositions-2024",
    title: "Isotopic Compositions of the Elements 2024",
    publisher: "IUPAC Commission on Isotopic Abundances and Atomic Weights",
    url: "https://www.ciaaw.org/isotopic-abundances.htm",
    note: "2026-10-15 阅读2024版表格，交叉核对所选天然核素的质量数。天然存在不能单独证明核素稳定，稳定性以 NUBASE2020 为准；本页不展示丰度。",
  },
  {
    id: "rsc-isotopes-h",
    title: "Hydrogen：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/1/hydrogen",
    note: "2026-10-15 阅读同位素表：氢-1、氢-2、氢-3；氢-3列有β衰变。仅整理事实，未使用图片、视频或照搬原文。",
  },
  {
    id: "rsc-isotopes-he",
    title: "Helium：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/2/helium",
    note: "2026-10-15 阅读同位素表：氦-3、氦-4；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-b",
    title: "Boron：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/5/boron",
    note: "2026-10-15 阅读同位素表：硼-10、硼-11；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-c",
    title: "Carbon：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/6/carbon",
    note: "2026-10-15 阅读同位素表：碳-12、碳-13、碳-14；碳-14列有β衰变。",
  },
  {
    id: "rsc-isotopes-n",
    title: "Nitrogen：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/7/nitrogen",
    note: "2026-10-15 阅读同位素表：氮-14、氮-15；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-o",
    title: "Oxygen：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/8/oxygen",
    note: "2026-10-15 阅读同位素表：氧-16、氧-17、氧-18；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-mg",
    title: "Magnesium：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/12/magnesium",
    note: "2026-10-15 阅读同位素表：镁-24、镁-25、镁-26；与 OpenStax 镁核素示例交叉核对。",
  },
  {
    id: "rsc-isotopes-si",
    title: "Silicon：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/14/silicon",
    note: "2026-10-15 阅读同位素表：硅-28、硅-29、硅-30；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-cl",
    title: "Chlorine：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/17/chlorine",
    note: "2026-10-15 阅读同位素表：氯-35、氯-37；稳定性另由 NUBASE2020 核对。",
  },
  {
    id: "rsc-isotopes-ca",
    title: "Calcium：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/20/calcium",
    note: "2026-10-15 阅读钙-40、42、43、44、46、48表行。RSC列出部分衰变下限，不能直接当作已观测到衰变；本页按 NUBASE2020 把钙-40和钙-46列为稳定、钙-48列为放射性。",
  },
  {
    id: "rsc-isotopes-fe",
    title: "Iron：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/26/iron",
    note: "2026-10-15 阅读铁-54、56、57、58表行。铁-54的衰变下限不视为已观测到衰变；四种均按 NUBASE2020 的 stbl 列为稳定。",
  },
  {
    id: "rsc-isotopes-cu",
    title: "Copper：Oxidation states and isotopes",
    publisher: "Royal Society of Chemistry",
    url: "https://periodic-table.rsc.org/element/29/copper",
    note: "2026-10-15 阅读同位素表：铜-63、铜-65；稳定性另由 NUBASE2020 核对。",
  },
];

export const teachingIsotopes: TeachingIsotope[] = [
  {
    id: "h-1",
    elementId: "h",
    massNumber: 1,
    name: "氢-1（氕）",
    stability: "stable",
    summary: "也叫氕，是稳定的氢核素。原子核只有1个质子，没有中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-h"],
  },
  {
    id: "h-2",
    elementId: "h",
    massNumber: 2,
    name: "氢-2（氘）",
    stability: "stable",
    summary: "也叫氘，是稳定的氢核素。原子核含1个质子和1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-h"],
  },
  {
    id: "h-3",
    elementId: "h",
    massNumber: 3,
    name: "氢-3（氚）",
    stability: "radioactive",
    summary: "也叫氚，是有放射性的氢核素。原子核含1个质子和2个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-h"],
  },
  {
    id: "he-3",
    elementId: "he",
    massNumber: 3,
    name: "氦-3",
    stability: "stable",
    summary: "稳定的氦核素，核内有2个质子和1个中子。与氦-4相比，它少1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-he"],
  },
  {
    id: "he-4",
    elementId: "he",
    massNumber: 4,
    name: "氦-4",
    stability: "stable",
    summary:
      "稳定的氦核素，核内有2个质子和2个中子。这里的4是核内质子与中子的总数。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-he"],
  },
  {
    id: "b-10",
    elementId: "b",
    massNumber: 10,
    name: "硼-10",
    stability: "stable",
    summary: "稳定的硼核素，核内有5个质子和5个中子。它与硼-11的质子数相同。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-b"],
  },
  {
    id: "b-11",
    elementId: "b",
    massNumber: 11,
    name: "硼-11",
    stability: "stable",
    summary: "稳定的硼核素，核内有5个质子和6个中子。它比硼-10多1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-b"],
  },
  {
    id: "c-12",
    elementId: "c",
    massNumber: 12,
    name: "碳-12",
    stability: "stable",
    summary:
      "稳定的碳核素，核内有6个质子和6个中子。它与碳-13、碳-14都属于碳元素。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-c"],
  },
  {
    id: "c-13",
    elementId: "c",
    massNumber: 13,
    name: "碳-13",
    stability: "stable",
    summary: "稳定的碳核素，核内有6个质子和7个中子。它比碳-12多1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-c"],
  },
  {
    id: "c-14",
    elementId: "c",
    massNumber: 14,
    name: "碳-14",
    stability: "radioactive",
    summary:
      "有放射性的碳核素，核内有6个质子和8个中子。它与碳-12的质子数相同，中子数多2个。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-c"],
  },
  {
    id: "n-14",
    elementId: "n",
    massNumber: 14,
    name: "氮-14",
    stability: "stable",
    summary: "稳定的氮核素，核内有7个质子和7个中子。质子数7决定它是氮元素。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-n"],
  },
  {
    id: "n-15",
    elementId: "n",
    massNumber: 15,
    name: "氮-15",
    stability: "stable",
    summary: "稳定的氮核素，核内有7个质子和8个中子。它比氮-14多1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-n"],
  },
  {
    id: "o-16",
    elementId: "o",
    massNumber: 16,
    name: "氧-16",
    stability: "stable",
    summary: "稳定的氧核素，核内有8个质子和8个中子。这里的16是质量数。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-o"],
  },
  {
    id: "o-17",
    elementId: "o",
    massNumber: 17,
    name: "氧-17",
    stability: "stable",
    summary: "稳定的氧核素，核内有8个质子和9个中子。它与氧-16相比多1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-o"],
  },
  {
    id: "o-18",
    elementId: "o",
    massNumber: 18,
    name: "氧-18",
    stability: "stable",
    summary:
      "稳定的氧核素，核内有8个质子和10个中子。氧-16、氧-17、氧-18的质子数都相同。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-o"],
  },
  {
    id: "mg-24",
    elementId: "mg",
    massNumber: 24,
    name: "镁-24",
    stability: "stable",
    summary:
      "稳定的镁核素，核内有12个质子和12个中子。它是比较镁的三种常见核素的起点。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-mg"],
  },
  {
    id: "mg-25",
    elementId: "mg",
    massNumber: 25,
    name: "镁-25",
    stability: "stable",
    summary: "稳定的镁核素，核内有12个质子和13个中子。它比镁-24多1个中子。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-mg"],
  },
  {
    id: "mg-26",
    elementId: "mg",
    massNumber: 26,
    name: "镁-26",
    stability: "stable",
    summary:
      "稳定的镁核素，核内有12个质子和14个中子。镁-24、镁-25、镁-26具有相同的质子数。",
    sourceIds: ["nubase2020", "openstax-atomic-structure", "rsc-isotopes-mg"],
  },
  {
    id: "si-28",
    elementId: "si",
    massNumber: 28,
    name: "硅-28",
    stability: "stable",
    summary:
      "稳定的硅核素，核内有14个质子和14个中子。质量数28等于这两类粒子的数量之和。",
    sourceIds: ["nubase2020", "rsc-isotopes-si"],
  },
  {
    id: "si-29",
    elementId: "si",
    massNumber: 29,
    name: "硅-29",
    stability: "stable",
    summary: "稳定的硅核素，核内有14个质子和15个中子。它比硅-28多1个中子。",
    sourceIds: ["nubase2020", "rsc-isotopes-si"],
  },
  {
    id: "si-30",
    elementId: "si",
    massNumber: 30,
    name: "硅-30",
    stability: "stable",
    summary:
      "稳定的硅核素，核内有14个质子和16个中子。硅-28、硅-29、硅-30只在中子数上不同。",
    sourceIds: ["nubase2020", "rsc-isotopes-si"],
  },
  {
    id: "cl-35",
    elementId: "cl",
    massNumber: 35,
    name: "氯-35",
    stability: "stable",
    summary:
      "稳定的氯核素，核内有17个质子和18个中子。这里的35是单种核素的质量数。",
    sourceIds: ["nubase2020", "rsc-isotopes-cl"],
  },
  {
    id: "cl-37",
    elementId: "cl",
    massNumber: 37,
    name: "氯-37",
    stability: "stable",
    summary: "稳定的氯核素，核内有17个质子和20个中子。它与氯-35的中子数相差2。",
    sourceIds: ["nubase2020", "rsc-isotopes-cl"],
  },
  {
    id: "ca-40",
    elementId: "ca",
    massNumber: 40,
    name: "钙-40",
    stability: "stable",
    summary:
      "核数据评价列为稳定核素，核内有20个质子和20个中子。这里的稳定表示该评价中未观测到衰变。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "ca-42",
    elementId: "ca",
    massNumber: 42,
    name: "钙-42",
    stability: "stable",
    summary: "稳定的钙核素，核内有20个质子和22个中子。它比钙-40多2个中子。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "ca-43",
    elementId: "ca",
    massNumber: 43,
    name: "钙-43",
    stability: "stable",
    summary:
      "稳定的钙核素，核内有20个质子和23个中子。它仍由相同的20个质子确定为钙元素。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "ca-44",
    elementId: "ca",
    massNumber: 44,
    name: "钙-44",
    stability: "stable",
    summary: "稳定的钙核素，核内有20个质子和24个中子。它与钙-40的中子数相差4。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "ca-46",
    elementId: "ca",
    massNumber: 46,
    name: "钙-46",
    stability: "stable",
    summary:
      "核数据评价列为稳定核素，核内有20个质子和26个中子。这里的稳定表示该评价中未观测到衰变。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "ca-48",
    elementId: "ca",
    massNumber: 48,
    name: "钙-48",
    stability: "radioactive",
    summary:
      "有放射性的钙核素，核内有20个质子和28个中子。它的衰变非常缓慢，仍应与已收录的稳定钙核素区分。",
    sourceIds: ["nubase2020", "rsc-isotopes-ca"],
  },
  {
    id: "fe-54",
    elementId: "fe",
    massNumber: 54,
    name: "铁-54",
    stability: "stable",
    summary:
      "核数据评价列为稳定核素，核内有26个质子和28个中子。这里的稳定表示该评价中未观测到衰变。",
    sourceIds: ["nubase2020", "rsc-isotopes-fe"],
  },
  {
    id: "fe-56",
    elementId: "fe",
    massNumber: 56,
    name: "铁-56",
    stability: "stable",
    summary: "稳定的铁核素，核内有26个质子和30个中子。它比铁-54多2个中子。",
    sourceIds: ["nubase2020", "rsc-isotopes-fe"],
  },
  {
    id: "fe-57",
    elementId: "fe",
    massNumber: 57,
    name: "铁-57",
    stability: "stable",
    summary:
      "稳定的铁核素，核内有26个质子和31个中子。铁的已收录核素具有相同的26个质子。",
    sourceIds: ["nubase2020", "rsc-isotopes-fe"],
  },
  {
    id: "fe-58",
    elementId: "fe",
    massNumber: 58,
    name: "铁-58",
    stability: "stable",
    summary: "稳定的铁核素，核内有26个质子和32个中子。它与铁-56的中子数相差2。",
    sourceIds: ["nubase2020", "rsc-isotopes-fe"],
  },
  {
    id: "cu-63",
    elementId: "cu",
    massNumber: 63,
    name: "铜-63",
    stability: "stable",
    summary:
      "稳定的铜核素，核内有29个质子和34个中子。它与铜-65属于同一种元素。",
    sourceIds: ["nubase2020", "rsc-isotopes-cu"],
  },
  {
    id: "cu-65",
    elementId: "cu",
    massNumber: 65,
    name: "铜-65",
    stability: "stable",
    summary: "稳定的铜核素，核内有29个质子和36个中子。它比铜-63多2个中子。",
    sourceIds: ["nubase2020", "rsc-isotopes-cu"],
  },
];

const teachingIsotopeById = new Map(
  teachingIsotopes.map((isotope) => [isotope.id, isotope]),
);
const elementByNumber = new Map(
  elements.map((element) => [element.number, element]),
);

/**
 * Complete public index within this snapshot's declared scope. RN records remain
 * in nubase2020GroundStateRows for reproducibility but are not student choices.
 * An empty main half-life field is classified conservatively as unknown, even
 * if the uncertainty field contains a limit or another field lists decay modes.
 */
export const allIsotopes: TeachingIsotope[] = nubase2020GroundStateRows
  .filter((row) => row[10] !== "RN")
  .map((row) => {
    const [
      massNumber,
      atomicNumber,
      sourceLineNumber,
      massExcessRaw,
      massExcessUncertaintyRaw,
      halfLifeValueRaw,
      halfLifeUnit,
      halfLifeUncertaintyRaw,
      decayModesRaw,
      discoveryYearRaw,
      recordFlagRaw,
      stateOrderingFlagsRaw,
      halfLifeRaw,
    ] = row;
    const element = elementByNumber.get(atomicNumber)!;
    const id = `${element.id}-${massNumber}`;
    const neutronNumber = massNumber - atomicNumber;
    const halfLifeKind: HalfLifeKind =
      halfLifeValueRaw === "stbl"
        ? "stable"
        : halfLifeValueRaw === "p-unst"
          ? "particle-unstable"
          : halfLifeValueRaw
            ? "value"
            : halfLifeUncertaintyRaw
              ? "limit-only"
              : "not-reported";
    const stability: TeachingIsotope["stability"] =
      halfLifeKind === "stable"
        ? "stable"
        : halfLifeKind === "limit-only" || halfLifeKind === "not-reported"
          ? "unknown"
          : "radioactive";
    const recordStatus: TeachingIsotope["recordStatus"] =
      recordFlagRaw === "EU" ? "existence-uncertain" : "evaluated";
    const halfLifeFromSystematics = halfLifeValueRaw.includes("#");
    const statusSummary =
      halfLifeKind === "stable"
        ? "该评价列为稳定，即未观测到衰变。"
        : halfLifeKind === "particle-unstable"
          ? "该评价标记为粒子不稳定，未列出数值半衰期。"
          : halfLifeKind === "limit-only"
            ? "该评价未列主半衰期值，仅有界限、范围或近似信息；不据此推断为稳定。"
            : halfLifeKind === "not-reported"
              ? "该评价未列半衰期值；不据此推断为稳定。"
              : /^[<>~≈]/.test(halfLifeValueRaw)
                ? "该评价列有半衰期界限或近似信息，并有放射性衰变记载；该记号不应当作精确半衰期值。"
                : halfLifeFromSystematics
                  ? "该评价列有系统趋势估计的有限半衰期，归为放射性。"
                  : "该评价列有有限半衰期，归为放射性。";
    const record: TeachingIsotope = {
      id,
      elementId: element.id,
      name: `${element.name}-${massNumber}`,
      massNumber,
      stability,
      summary: `${element.name}-${massNumber}核内有${atomicNumber}个质子和${neutronNumber}个中子。${recordStatus === "existence-uncertain" ? "注意：该评价标记 EU，存在性待确认。" : ""}${statusSummary}`,
      sourceIds: ["nubase2020"],
      atomicNumber,
      neutronNumber,
      halfLifeRaw,
      halfLifeValueRaw,
      halfLifeUnit,
      halfLifeUncertaintyRaw,
      halfLifeKind,
      halfLifeFromSystematics,
      massExcessRaw,
      massExcessUncertaintyRaw,
      massExcessFromSystematics:
        `${massExcessRaw}${massExcessUncertaintyRaw}`.includes("#"),
      decayModesRaw,
      discoveryYearRaw,
      recordFlagRaw,
      recordStatus,
      stateOrderingFlagsRaw,
      sourceStateIndex: 0,
      sourceLineNumber,
    };
    const teaching = teachingIsotopeById.get(id);
    // Keep introductory copy, expanded citations, names (氕/氘/氚) and object
    // identity while enriching those records with the same source fields.
    return teaching
      ? Object.assign(teaching, record, {
          name: teaching.name,
          summary: teaching.summary,
          sourceIds: teaching.sourceIds,
        })
      : record;
  });

export const isotopesByElement: Record<string, TeachingIsotope[]> =
  allIsotopes.reduce(
    (byElement, isotope) => {
      (byElement[isotope.elementId] ??= []).push(isotope);
      return byElement;
    },
    {} as Record<string, TeachingIsotope[]>,
  );

for (const isotopes of Object.values(isotopesByElement)) {
  isotopes.sort((a, b) => a.massNumber - b.massNumber);
}

export const isotopeById: Record<string, TeachingIsotope> = Object.fromEntries(
  allIsotopes.map((isotope) => [isotope.id, isotope]),
);

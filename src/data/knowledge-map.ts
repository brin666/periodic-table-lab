/** Shared content contract. Mock records are never textbook evidence. */
export type KnowledgeLevel = "junior" | "senior" | "extension";
export type KnowledgeSubject =
  | "element"
  | "atom"
  | "elemental-substance"
  | "compound"
  | "mixture"
  | "principle"
  | "reaction";
export interface KnowledgeSource {
  id: string;
  kind: "textbook" | "reference";
  title: string;
  publisher: string;
  edition: string | null;
  volume: string | null;
  url: string | null;
  verification: "body-read" | "pending";
  pages: {
    printedPage: number;
    readerPage: number;
    pageUrl: string;
    linkVerified: boolean;
  }[];
  note: string;
}
export interface KnowledgeCard {
  id: string;
  elementIds: string[];
  level: KnowledgeLevel;
  subjectType: KnowledgeSubject;
  title: string;
  summary: string;
  paragraphs: string[];
  highlights: string[];
  sourceIds: string[];
  substanceIds: string[];
  equationIds: string[];
  illustration: "atom" | "gas" | "water" | "peroxide" | "equation" | null;
  status: "mock" | "pending" | "verified";
  curriculum?: {
    stage: "junior" | "required" | "selective" | "extension";
    volume: string;
    chapter: string;
    textbookMatch: "page-verified" | "pending";
  };
}
export interface KnowledgeBranch {
  id: string;
  elementId: string;
  title: string;
  order: number;
  level: "junior" | "senior";
  cardIds: string[];
}
export interface KnowledgePack {
  schemaVersion: "1.0";
  maps: { elementId: string; branchIds: string[] }[];
  branches: KnowledgeBranch[];
  cards: KnowledgeCard[];
  sources: KnowledgeSource[];
  gaps: { elementId: string; cardId: string | null; reason: string }[];
}

const card = (
  id: string,
  title: string,
  summary: string,
  branchKind: KnowledgeSubject,
  level: KnowledgeLevel,
  paragraphs: string[],
  highlights: string[],
  illustration: KnowledgeCard["illustration"] = null,
  substanceIds: string[] = [],
  equationIds: string[] = [],
): KnowledgeCard => ({
  id,
  title,
  summary,
  subjectType: branchKind,
  level,
  paragraphs,
  highlights,
  illustration,
  elementIds: ["h"],
  sourceIds: [level === "extension" ? "mock-reference" : "mock-textbook"],
  substanceIds,
  equationIds,
  status: "mock",
});

// Titles now use teaching-aid terminology; this does not verify the mock body,
// grade labels, or textbook page mappings. Evidence: research/TEACHING_AID_TITLES.md.
export const hydrogenKnowledgeMock: KnowledgePack = {
  schemaVersion: "1.0",
  maps: [
    {
      elementId: "h",
      branchIds: ["h-atom", "h-gas", "h-materials", "h-reactions"],
    },
  ],
  branches: [
    {
      id: "h-atom",
      elementId: "h",
      title: "原子结构",
      order: 0,
      level: "junior",
      cardIds: ["h-identity", "h-neutral", "h-configuration"],
    },
    {
      id: "h-gas",
      elementId: "h",
      title: "化学用语与物质分类",
      order: 1,
      level: "junior",
      cardIds: ["h-molecule", "h-distinction"],
    },
    {
      id: "h-materials",
      elementId: "h",
      title: "含氢化合物",
      order: 2,
      level: "junior",
      cardIds: ["h-water", "h-peroxide", "h-comparison"],
    },
    {
      id: "h-reactions",
      elementId: "h",
      title: "化学反应",
      order: 3,
      level: "senior",
      cardIds: ["h-conservation", "h-oxidation"],
    },
  ],
  cards: [
    card(
      "h-identity",
      "原子序数与质子数",
      "原子序数为 1，氢原子的核内有 1 个质子。",
      "atom",
      "junior",
      [
        "元素由原子核内的质子数区分。氢的原子序数是 1。",
        "同一元素的不同同位素仍有相同的质子数。这里展示的是知识卡的阅读结构，教材页码待逐条核对。",
      ],
      ["1 个质子"],
      "atom",
    ),
    card(
      "h-neutral",
      "中性原子的核外电子数",
      "中性氢原子有 1 个质子，也有 1 个电子。",
      "atom",
      "junior",
      [
        "中性原子的电子总数等于核内质子数，因此中性氢原子有 1 个电子。",
        "分层圆环是教学示意，不是电子真实运行轨迹。",
      ],
      ["1 个电子"],
      "atom",
    ),
    card(
      "h-configuration",
      "核外电子排布",
      "基态氢原子的电子构型可表示为 1s¹。",
      "atom",
      "senior",
      [
        "这是从原子基础知识继续展开的一张进阶卡片。符号 1s¹ 表示基态氢原子的电子占据情况。",
        "正式内容将核对适用册次；本样例不宣称它出自指定的必修第一册。",
      ],
      ["1s¹"],
    ),
    card(
      "h-molecule",
      "元素符号与化学式",
      "H 是元素符号；H₂ 表示氢气分子。",
      "elemental-substance",
      "junior",
      [
        "氢气是一种单质，通常以 H₂ 分子的形式存在。一个 H₂ 分子含有两个氢原子。",
        "化学符号的含义与具体语境有关；这里先区分元素、原子与氢气。",
      ],
      ["两个氢原子"],
      "gas",
      ["hydrogen"],
    ),
    card(
      "h-distinction",
      "元素与单质的区别",
      "水含氢元素，但水和氢气是不同的物质。",
      "principle",
      "junior",
      [
        "物质含有某种元素，不代表其中混有这种元素的单质。",
        "水属于化合物；氢气属于单质。两者的组成与性质不同。",
      ],
      ["不同的物质"],
    ),
    card(
      "h-water",
      "水的组成",
      "水由氢、氧两种元素组成，化学式为 H₂O。",
      "compound",
      "junior",
      [
        "一个水分子含有两个氢原子和一个氧原子，化学式为 H₂O。",
        "图中的水杯表达宏观形态；日常饮用水与理想的纯净水要区分。",
      ],
      ["两个氢原子和一个氧原子"],
      "water",
      ["water"],
    ),
    card(
      "h-peroxide",
      "水与过氧化氢的组成",
      "过氧化氢的化学式是 H₂O₂，与水的组成不同。",
      "compound",
      "junior",
      [
        "一个过氧化氢分子含两个氢原子和两个氧原子。元素种类相同，组成不同，物质的性质也可以不同。",
        "瓶装双氧水通常是过氧化氢水溶液，是混合物；它与纯过氧化氢需要区分。",
      ],
      ["组成不同"],
      "peroxide",
      ["hydrogen-peroxide"],
    ),
    card(
      "h-comparison",
      "物质的组成与结构",
      "比较物质时，同时留意元素种类、组成与结构。",
      "principle",
      "extension",
      [
        "这是拓展来源入口的交互样例。多个资料会归入同一个“资料来源”按钮。",
        "这里只演示卡片与来源面板的形式，真实的资料条目由另一条内容工作线补充。",
      ],
      ["元素种类、组成与结构"],
    ),
    card(
      "h-conservation",
      "化学反应中的原子守恒",
      "化学反应前后，各元素的原子总数保持不变。",
      "reaction",
      "senior",
      [
        "观察一个配平的化学方程式，可以比较左右两侧同一种元素的原子总数。",
        "本样例只展示知识解释，不演示粒子重组。真实方程式、条件与教材页码将分别核验。",
      ],
      ["原子总数保持不变"],
      "equation",
    ),
    card(
      "h-oxidation",
      "氧化还原反应",
      "高中版可以沿已有的反应知识展开更深入的分析。",
      "reaction",
      "senior",
      [
        "这张卡用于体验学段切换后新分支的生长、收回与重新布局。",
        "正式内容将按反应对象分别整理化合价变化及氧化还原分析，关联到同一条已核对的反应记录。",
      ],
      ["更深入的分析"],
    ),
  ],
  sources: [
    {
      id: "mock-textbook",
      kind: "textbook",
      title: "人教版教材依据 · 待内容采集",
      publisher: "待核对",
      edition: null,
      volume: null,
      url: null,
      verification: "pending",
      pages: [],
      note: "此处演示教材入口。尚未为这张 mock 卡绑定版本、册次和印刷页码，因此不提供估计页码或虚假跳转。",
    },
    {
      id: "mock-reference",
      kind: "reference",
      title: "拓展参考资料 · 待内容采集",
      publisher: "待核对",
      edition: null,
      volume: null,
      url: null,
      verification: "pending",
      pages: [],
      note: "一个按钮可容纳多条来源。示例不代表已完成资料核验。",
    },
  ],
  gaps: [
    {
      elementId: "h",
      cardId: null,
      reason: "本包仅用于交互预览；所有教材映射与拓展来源等待独立内容采集。",
    },
  ],
};

export const visibleKnowledge = (
  level: KnowledgeLevel,
  mode: "junior" | "senior",
) => mode === "senior" || level === "junior";

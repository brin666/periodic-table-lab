import { feedbackEnglish } from "../i18n/feedback-en";

export type FeedbackKind = "bug" | "content" | "suggestion";
export type FeedbackLanguage = "zh" | "en";

export interface FeedbackAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface FeedbackPrompt {
  id: string;
  text: string;
  suggestions?: string[];
}

export interface ConversationPlan {
  type: FeedbackKind;
  prompt: FeedbackPrompt | null;
  complete: boolean;
  description: string;
  answered: number;
}

export const FEEDBACK_ANSWER_LIMIT = 500;

const MAX_QUESTIONS = 5;
const INITIAL_PROMPT: FeedbackPrompt = {
  id: "describe",
  text: "这张截图里，你遇到了什么问题，或希望怎样改进？",
};

const INTENT_PROMPT: FeedbackPrompt = {
  id: "intent",
  text: "我先确认一下反馈方向：你主要是遇到了操作问题、发现内容需要核对，还是想提出改进建议？",
  suggestions: ["操作出了问题", "内容需要核对", "我有改进建议"],
};

const UNKNOWN_PROMPTS: FeedbackPrompt[] = [
  {
    id: "example",
    text: "能举一个最具体的例子吗？可以是页面上的一句话、一次操作，或你希望增加的功能。",
  },
  {
    id: "action",
    text: "你希望维护者看完后优先做什么？例如修复、核对，或补充功能；暂时不确定也可以说。",
    suggestions: ["修复操作", "核对内容", "补充功能", "暂时不确定"],
  },
  {
    id: "impact",
    text: "这件事会怎样影响你继续学习或使用页面？如果暂时不确定，可以直接说明。",
  },
];

const MINIMUM_ANSWER_PROMPTS: FeedbackPrompt[] = [
  {
    id: "supplement",
    text: "除刚才提到的信息外，还有没有一条能帮助维护者理解的补充？没有也可以回答“没有”。",
  },
  {
    id: "focus",
    text: "还有没有一项最希望维护者重点核实的内容？如果刚才已经说全，可以回答“已说全”。",
  },
];

interface FollowUp {
  id: string;
  text: string | ((answers: FeedbackAnswer[]) => string);
  isCovered: (answers: FeedbackAnswer[]) => boolean;
}

const BUG_FOLLOW_UPS: FollowUp[] = [
  {
    id: "steps",
    text: (answers) => {
      const hasAction = containsEither(answers, ACTION_PATTERN, ACTION_PATTERN_EN);
      const hasTarget = containsEither(answers, TARGET_PATTERN, TARGET_PATTERN_EN);
      if (hasAction && !hasTarget)
        return "你当时具体点了页面上的哪一项？操作前后还做了什么？";
      if (!hasAction && hasTarget)
        return "你是怎样操作到这里的？请尽量写下触发问题的步骤。";
      return "你是怎样触发这个情况的？请尽量写下操作顺序和所在位置。";
    },
    isCovered: (answers) =>
      containsEither(answers, ACTION_PATTERN, ACTION_PATTERN_EN) &&
      containsEither(answers, TARGET_PATTERN, TARGET_PATTERN_EN),
  },
  {
    id: "expected_context",
    text: (answers) => {
      const hasExpected = containsEither(answers, EXPECTED_PATTERN, EXPECTED_PATTERN_EN);
      const hasContext = containsEither(answers, CONTEXT_PATTERN, CONTEXT_PATTERN_EN);
      if (hasExpected && !hasContext)
        return "这种情况每次都会发生还是偶尔出现？你用的是手机、电脑还是其他设备？";
      if (hasContext && !hasExpected) return "你原本希望操作后发生什么？";
      return "你原本希望操作后发生什么？这种情况每次都会发生还是偶尔出现？";
    },
    isCovered: (answers) =>
      containsEither(answers, EXPECTED_PATTERN, EXPECTED_PATTERN_EN) &&
      containsEither(answers, CONTEXT_PATTERN, CONTEXT_PATTERN_EN),
  },
  {
    id: "impact",
    text: "这个情况会卡住你的哪一步，或影响你完成什么？",
    isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
  },
];

const CONTENT_FOLLOW_UPS: FollowUp[] = [
  {
    id: "location",
    text: "具体是哪一处内容？如果方便，请抄下页面上的原文或说明它所在的位置。",
    isCovered: (answers) => containsEither(answers, CONTENT_LOCATION_PATTERN, CONTENT_LOCATION_PATTERN_EN),
  },
  {
    id: "correction_reference",
    text: (answers) => {
      const hasCorrection = contains(answers, CORRECTION_PATTERN);
      const hasReference = contains(answers, REFERENCE_PATTERN);
      if (hasCorrection && !hasReference)
        return "你依据哪本教材、哪一页或哪个可靠来源判断？不确定也可以说。";
      if (hasReference && !hasCorrection)
        return "你认为这里应改成什么内容？可以写出正确说法或数值。";
      return "你认为这里应改成什么？如果知道依据，也可以一起写下教材、页码或来源。";
    },
    isCovered: (answers) =>
      containsEither(answers, CORRECTION_PATTERN, CORRECTION_PATTERN_EN) &&
      containsEither(answers, REFERENCE_PATTERN, REFERENCE_PATTERN_EN),
  },
  {
    id: "impact",
    text: "这处内容会怎样影响你的理解或使用？",
    isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
  },
];

const SUGGESTION_FOLLOW_UPS: FollowUp[] = [
  {
    id: "desired_change",
    text: "你希望页面增加或改变什么？可以描述你期待看到的结果。",
    isCovered: (answers) => containsEither(answers, DESIRED_CHANGE_PATTERN, DESIRED_CHANGE_PATTERN_EN),
  },
  {
    id: "use_case",
    text: "你会在什么学习或使用场景中用到它？",
    isCovered: (answers) => containsEither(answers, USE_CASE_PATTERN, USE_CASE_PATTERN_EN),
  },
  {
    id: "priority",
    text: "这项改进最能解决哪件不方便的事？",
    isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
  },
];

const ENGLISH_FOLLOW_UPS: Record<FeedbackKind, FollowUp[]> = {
  bug: [
    {
      id: "steps",
      text: (answers) => {
        const hasAction = containsEither(answers, ACTION_PATTERN, ACTION_PATTERN_EN);
        const hasTarget = containsEither(answers, TARGET_PATTERN, TARGET_PATTERN_EN);
        if (hasAction && !hasTarget) return feedbackEnglish.conversation.bug.steps.action;
        if (!hasAction && hasTarget) return feedbackEnglish.conversation.bug.steps.target;
        return feedbackEnglish.conversation.bug.steps.general;
      },
      isCovered: (answers) =>
        containsEither(answers, ACTION_PATTERN, ACTION_PATTERN_EN) &&
        containsEither(answers, TARGET_PATTERN, TARGET_PATTERN_EN),
    },
    {
      id: "expected_context",
      text: (answers) => {
        const hasExpected = containsEither(answers, EXPECTED_PATTERN, EXPECTED_PATTERN_EN);
        const hasContext = containsEither(answers, CONTEXT_PATTERN, CONTEXT_PATTERN_EN);
        if (hasExpected && !hasContext) return feedbackEnglish.conversation.bug.expectedContext.context;
        if (hasContext && !hasExpected) return feedbackEnglish.conversation.bug.expectedContext.expected;
        return feedbackEnglish.conversation.bug.expectedContext.both;
      },
      isCovered: (answers) =>
        containsEither(answers, EXPECTED_PATTERN, EXPECTED_PATTERN_EN) &&
        containsEither(answers, CONTEXT_PATTERN, CONTEXT_PATTERN_EN),
    },
    {
      id: "impact",
      text: feedbackEnglish.conversation.bug.impact,
      isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
    },
  ],
  content: [
    {
      id: "location",
      text: feedbackEnglish.conversation.content.location,
      isCovered: (answers) => containsEither(answers, CONTENT_LOCATION_PATTERN, CONTENT_LOCATION_PATTERN_EN),
    },
    {
      id: "correction_reference",
      text: (answers) => {
        const hasCorrection = containsEither(answers, CORRECTION_PATTERN, CORRECTION_PATTERN_EN);
        const hasReference = containsEither(answers, REFERENCE_PATTERN, REFERENCE_PATTERN_EN);
        if (hasCorrection && !hasReference) return feedbackEnglish.conversation.content.correctionReference.correction;
        if (hasReference && !hasCorrection) return feedbackEnglish.conversation.content.correctionReference.reference;
        return feedbackEnglish.conversation.content.correctionReference.both;
      },
      isCovered: (answers) =>
        containsEither(answers, CORRECTION_PATTERN, CORRECTION_PATTERN_EN) &&
        containsEither(answers, REFERENCE_PATTERN, REFERENCE_PATTERN_EN),
    },
    {
      id: "impact",
      text: feedbackEnglish.conversation.content.impact,
      isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
    },
  ],
  suggestion: [
    {
      id: "desired_change",
      text: feedbackEnglish.conversation.suggestion.desiredChange,
      isCovered: (answers) => containsEither(answers, DESIRED_CHANGE_PATTERN, DESIRED_CHANGE_PATTERN_EN),
    },
    {
      id: "use_case",
      text: feedbackEnglish.conversation.suggestion.useCase,
      isCovered: (answers) => containsEither(answers, USE_CASE_PATTERN, USE_CASE_PATTERN_EN),
    },
    {
      id: "priority",
      text: feedbackEnglish.conversation.suggestion.priority,
      isCovered: (answers) => containsEither(answers, IMPACT_PATTERN, IMPACT_PATTERN_EN),
    },
  ],
};

const ACTION_PATTERN =
  /点击|点了|点开|按下|按了|选择|切换|打开|输入|搜索|滑动|拖动|提交|点击后|点按|点击了|尝试/;
const TARGET_PATTERN =
  /按钮|元素|搜索|列表|卡片|表格|页面|菜单|筛选|结果|弹窗|图标|链接|屏幕|区域|导航|输入框|物质|方程|标题|选项|标签|某个|这里|顶部|底部|左侧|右侧|第一行|第二行|这个/;
const EXPECTED_PATTERN =
  /原本|本来|预期|期望|应该|应当|理应|我以为|正常情况下|希望.*(打开|显示|跳转|响应|出现)|点击后.*(打开|显示|跳转|响应|出现)/;
const CONTEXT_PATTERN =
  /每次|总是|一直|偶尔|有时|有时候|随机|一次|复现|手机|电脑|平板|浏览器|chrome|safari|firefox|edge|android|iphone|ipad|ios|windows|macos/;
const IMPACT_PATTERN =
  /影响|卡住|无法继续|不能继续|没法继续|耽误|阻碍|看不懂|学不下去|不方便|很难用|难以使用|重要|优先|高频|经常/;
const CONTENT_LOCATION_PATTERN =
  /第[一二三四五六七八九十\d]+(页|行|章|节)|元素|表格|页面|卡片|图表|公式|方程|化合物|标题|句子|段落|标签|数据|数值|左侧|右侧|上方|下方|顶部|底部|某处|这里|这一项|这句话/;
const CORRECTION_PATTERN =
  /应为|应该是|应当是|改成|改为|正确(的内容|写法|说法|数值)?(是|为)?|应写作|应表示|写成.{0,12}(而不是|但)|不应是|不该是|实际是|应该写|应该改/;
const REFERENCE_PATTERN =
  /教材|课本|教科书|页码|第[一二三四五六七八九十\d]+版|来源|出处|参考|官方|pubchem|iupac|cas|链接|引用|依据|资料/;
const DESIRED_CHANGE_PATTERN =
  /希望|增加|添加|新增|支持|改进|优化|改成|能否|可否|建议.{0,12}(增加|添加|支持|提供|优化|改进|加入)|想要|最好能/;
const USE_CASE_PATTERN =
  /课堂|学习|复习|考试|作业|实验|演示|查找|检索|用来|为了|当我|我在|使用时|场景|学生|老师|教学|晚上|夜间/;

const ACTION_PATTERN_EN =
  /\b(?:click(?:ed|ing)?|tap(?:ped|ping)?|press(?:ed|ing)?|select(?:ed|ing)?|switch(?:ed|ing)?|open(?:ed|ing)?|type(?:d|ing)?|search(?:ed|ing)?|scroll(?:ed|ing)?|drag(?:ged|ging)?|submit(?:ted|ting)?|try|tried)\b/;
const TARGET_PATTERN_EN =
  /\b(?:button|element|search|list|card|table|page|menu|filter|result|dialog|icon|link|screen|area|region|navigation|input|compound|equation|formula|title|option|label|top|bottom|left|right|first row|second row|here|this)\b/;
const EXPECTED_PATTERN_EN =
  /\b(?:expected|expect|supposed to|should have|should|would like|hope|wanted|want to|normally)\b/;
const CONTEXT_PATTERN_EN =
  /\b(?:every time|always|sometimes|occasionally|once|reproduce|reproduces|phone|mobile|computer|desktop|tablet|browser|chrome|safari|firefox|edge|android|iphone|ipad|ios|windows|macos|mac)\b/;
const IMPACT_PATTERN_EN =
  /\b(?:affect|affects|blocked|blocks|prevent|prevents|unable to continue|cannot continue|can't continue|could not continue|hard to use|difficult to use|inconvenient|priority|frequently|often)\b/;
const CONTENT_LOCATION_PATTERN_EN =
  /\b(?:page|chapter|row|element|table|card|chart|formula|equation|compound|title|sentence|paragraph|label|data|value|left|right|above|below|top|bottom|here|this section)\b/;
const CORRECTION_PATTERN_EN =
  /\b(?:wrong|incorrect|inaccurate|error|should read|should say|should be|change to|replace with|missing|incomplete|omitted|not correct|isn't correct)\b/;
const REFERENCE_PATTERN_EN =
  /\b(?:textbook|text book|book|page|source|reference|citation|official|pubchem|iupac|cas|link|evidence|material)\b/;
const DESIRED_CHANGE_PATTERN_EN =
  /\b(?:would like|wish|add|include|support|improve|optimize|change|suggest|suggestion|could you|it would help|it'd help|better if|enable)\b/;
const USE_CASE_PATTERN_EN =
  /\b(?:class|classroom|learn|learning|review|revision|exam|test|assignment|homework|experiment|demo|scenario|student|teacher|teach|at night|night|for studying|during study|when i (?:find|search|review)|i use (?:it|this|the page) to)\b/;
const UNCERTAIN_PATTERN_EN =
  /^(?:not sure|i don't know|i do not know|no idea|i can't remember|i cannot remember|i'd rather not say|skip|none|nothing|no further details|no other details|already covered)[.!?…]*$/;

const UNCERTAIN_PATTERN =
  /^(暂时不确定|不确定|不知道|不清楚|没记住|记不清|不方便说|跳过|无|没有|暂时没有|先不补充)[。！!？?…]*$/;

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function normalizedEnglish(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function contains(answers: FeedbackAnswer[], pattern: RegExp) {
  return answers.some((item) => pattern.test(normalized(item.answer)));
}

function containsEnglish(answers: FeedbackAnswer[], pattern: RegExp) {
  return answers.some((item) => pattern.test(normalizedEnglish(item.answer)));
}

function containsEither(
  answers: FeedbackAnswer[],
  chinesePattern: RegExp,
  englishPattern: RegExp,
) {
  return contains(answers, chinesePattern) || containsEnglish(answers, englishPattern);
}

function explicitIntent(answer: string): FeedbackKind | null {
  const text = normalized(answer);
  const englishText = normalizedEnglish(answer);
  if (
    /^(操作出了问题|操作问题|修复操作|修复交互|页面操作异常|功能异常|页面异常)/.test(
      text,
    )
  )
    return "bug";
  if (
    /^(内容需要核对|核对内容|内容纠错|内容有误|教材内容错误|发现内容错误)/.test(
      text,
    )
  )
    return "content";
  if (/^(我有改进建议|改进建议|提出建议|功能建议|想提建议|补充功能)/.test(text))
    return "suggestion";

  if (/^(?:an interaction issue|interaction issue|bug report|report a bug|fix an interaction)\b/.test(englishText))
    return "bug";
  if (/^(?:content needs checking|check the content|content correction|there is a content error)\b/.test(englishText))
    return "content";
  if (/^(?:a suggestion for improvement|improvement suggestion|i have a suggestion|feature suggestion)\b/.test(englishText))
    return "suggestion";
  return null;
}

function classify(answers: FeedbackAnswer[]): FeedbackKind | null {
  for (const item of answers) {
    const kind = explicitIntent(item.answer);
    if (kind) return kind;
  }

  const text = normalized(answers.map((item) => item.answer).join("\n"));
  const englishText = normalizedEnglish(answers.map((item) => item.answer).join("\n"));

  // Prioritize concrete interaction failures before words that may simply
  // name content, such as “教材链接打不开”.
  if (
    /点击.{0,10}(没反应|没有反应|无响应|不动)|点了.{0,10}(没反应|没有反应|无响应)|按钮.{0,10}(没反应|没有反应)|点不动|无法点击|操作失败|操作出了问题|操作问题|操作异常|出现错误|发生错误|报错|错误提示|崩溃|闪退|白屏|打不开|无法打开|没有打开|没打开|加载失败|卡死|卡住|显示异常|错位|遮挡|重叠|溢出|功能失效|页面异常|不好用|无法继续|不能继续/.test(
      text,
    )
  )
    return "bug";
  if (
    /\b(?:does nothing|nothing happens|no response|doesn't respond|does not respond|not responding|won't open|will not open|didn't open|did not open|cannot open|can't open|failed to open|failed to load|crashed|blank screen|blank results?|results? (?:are )?blank|(?:leave|leaves|left) (?:the )?(?:results|page) blank|shows? a blank screen|frozen|stuck|overlap|overlaps|overflow|misaligned|out of place|doesn't work|does not work|not working|unable to continue|cannot continue)\b/.test(
      englishText,
    )
  )
    return "bug";

  // A science term alone does not imply a correction; pair it with a clear
  // claim that something is wrong, missing, or should be changed.
  if (
    /教材|课本|教科书|内容|化学式|化学方程式|离子方程式|方程式|公式|相对原子质量|原子序数|化合价|电子层|数据|数值|概念/.test(
      text,
    ) &&
    /写错|错别字|错误|不对|有误|不准确|应为|应当为|应该是|核对|不完整|遗漏|缺少|少了|多了|修正|改正|更正|改成|改为/.test(
      text,
    )
  )
    return "content";
  if (
    /\b(?:text|content|formula|equation|chemical formula|atomic mass|atomic number|valence|electron shell|data|value|concept)\b/.test(englishText) &&
    /\b(?:wrong|incorrect|inaccurate|should be|should read|should say|needs checking|incomplete|omitted|missing|correction|change to|replace with)\b/.test(englishText)
  )
    return "content";

  if (
    /写错|错别字|应为|应当为|有误|不准确|数据错误|概念错误|内容不对|核对内容|公式错误/.test(
      text,
    )
  )
    return "content";
  if (/\b(?:wrong|incorrect|inaccurate|content error|formula error|needs correction|check the content)\b/.test(englishText))
    return "content";

  if (
    /建议|希望|增加|添加|新增|支持|优化|改进|能否|可否|想要|最好能/.test(text)
  )
    return "suggestion";
  if (/\b(?:suggestion|suggest|would like|wish|add|include|support|improve|optimize|could you|it would help|better if|feature request)\b/.test(englishText))
    return "suggestion";

  return null;
}

function isUncertain(answer: string) {
  return (
    UNCERTAIN_PATTERN.test(normalized(answer)) ||
    UNCERTAIN_PATTERN_EN.test(normalizedEnglish(answer))
  );
}

function settledByAnswer(answers: FeedbackAnswer[], id: string) {
  return answers.some((item) => item.id === id && isUncertain(item.answer));
}

function questionsDescription(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
) {
  if (!answers.length) return "";
  const questions = answers
    .map(
      (item, index) =>
        `${index + 1}. ${item.question}\n${
          language === "en"
            ? `${feedbackEnglish.conversation.description.answerLabel} `
            : "用户回答："
        }${item.answer}`,
    )
    .join("\n\n");
  return `${language === "en" ? feedbackEnglish.conversation.description.heading : "反馈记录"}\n\n${questions}`;
}

function followUpPrompt(
  followUp: FollowUp,
  answers: FeedbackAnswer[],
): FeedbackPrompt {
  return {
    id: followUp.id,
    text:
      typeof followUp.text === "function"
        ? followUp.text(answers)
        : followUp.text,
  };
}

function nextBranchPrompt(
  kind: FeedbackKind,
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
): FeedbackPrompt | null {
  const followUps = language === "en"
    ? ENGLISH_FOLLOW_UPS[kind]
    : kind === "bug"
      ? BUG_FOLLOW_UPS
      : kind === "content"
        ? CONTENT_FOLLOW_UPS
        : SUGGESTION_FOLLOW_UPS;
  const asked = new Set(answers.map((item) => item.id));

  for (const followUp of followUps) {
    if (asked.has(followUp.id)) continue;
    if (followUp.isCovered(answers) || settledByAnswer(answers, followUp.id))
      continue;
    return followUpPrompt(followUp, answers);
  }
  return null;
}

function nextUnclearPrompt(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
): FeedbackPrompt | null {
  const asked = new Set(answers.map((item) => item.id));
  if (!asked.has(INTENT_PROMPT.id)) {
    return language === "en"
      ? {
          id: "intent",
          text: feedbackEnglish.conversation.intent.text,
          suggestions: [...feedbackEnglish.conversation.intent.suggestions],
        }
      : INTENT_PROMPT;
  }
  if (language === "zh")
    return UNKNOWN_PROMPTS.find((prompt) => !asked.has(prompt.id)) ?? null;
  const englishPrompts: FeedbackPrompt[] = [
    { id: "example", text: feedbackEnglish.conversation.unknown.example },
    {
      id: "action",
      text: feedbackEnglish.conversation.unknown.action,
      suggestions: [
        "Fix an interaction",
        "Verify the content",
        "Add a feature",
        "Not sure yet",
      ],
    },
    { id: "impact", text: feedbackEnglish.conversation.unknown.impact },
  ];
  return englishPrompts.find((prompt) => !asked.has(prompt.id)) ?? null;
}

function nextMinimumAnswerPrompt(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
): FeedbackPrompt | null {
  const asked = new Set(answers.map((item) => item.id));
  if (language === "zh")
    return MINIMUM_ANSWER_PROMPTS.find((prompt) => !asked.has(prompt.id)) ?? null;
  const prompts: FeedbackPrompt[] = [
    { id: "supplement", text: feedbackEnglish.conversation.minimum.supplement },
    { id: "focus", text: feedbackEnglish.conversation.minimum.focus },
  ];
  return prompts.find((prompt) => !asked.has(prompt.id)) ?? null;
}

function nextPrompt(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
): FeedbackPrompt | null {
  const answered = answers.length;
  const hasAnswer = answered > 0;
  const originallyUnclear = hasAnswer && classify([answers[0]]) === null;
  const questionLimit = originallyUnclear ? MAX_QUESTIONS : 3;
  if (!hasAnswer) {
    return {
      id: INITIAL_PROMPT.id,
      text:
        language === "en"
          ? feedbackEnglish.conversation.initial
          : INITIAL_PROMPT.text,
    };
  }
  if (answered >= questionLimit) return null;
  const knownType = classify(answers);
  if (!knownType) return nextUnclearPrompt(answers, language);
  const prompt = nextBranchPrompt(knownType, answers, language);
  if (!prompt && answered < 3) return nextMinimumAnswerPrompt(answers, language);
  return prompt;
}

function isPageDescriptionQuestion(question: string) {
  return (
    question.startsWith("在这个页面，") ||
    question.startsWith(feedbackEnglish.conversation.initialOnPage)
  );
}

function pageDescriptionQuestion(language: FeedbackLanguage) {
  return language === "en"
    ? feedbackEnglish.conversation.initialOnPage
    : "在这个页面，你遇到了什么问题，或希望怎样改进？";
}

export function localizeFeedbackAnswers(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage,
): FeedbackAnswer[] {
  const localized: FeedbackAnswer[] = [];
  for (const answer of answers) {
    const questionAlreadyInChinese = /[\u3400-\u9fff]/.test(answer.question);
    if (language === "zh" && questionAlreadyInChinese) {
      localized.push(answer);
      continue;
    }
    const prompt = nextPrompt(localized, language);
    const question = prompt?.id === answer.id ? prompt.text : answer.question;
    localized.push({
      ...answer,
      question:
        answer.id === "describe" && isPageDescriptionQuestion(answer.question)
          ? pageDescriptionQuestion(language)
          : question,
    });
  }
  return localized;
}

export function getConversationPlan(
  answers: FeedbackAnswer[],
  language: FeedbackLanguage = "zh",
): ConversationPlan {
  const answered = answers.length;
  const type = classify(answers) ?? "suggestion";
  const prompt = nextPrompt(answers, language);
  const localizedAnswers = localizeFeedbackAnswers(answers, language);

  return {
    type,
    prompt,
    complete: prompt === null,
    description: questionsDescription(localizedAnswers, language),
    answered,
  };
}

export function appendFeedbackAnswer(
  answers: FeedbackAnswer[],
  answer: string,
  language: FeedbackLanguage = "zh",
): FeedbackAnswer[] {
  const currentPrompt = getConversationPlan(answers, language).prompt;
  if (!currentPrompt) return answers;

  const trimmed = answer.trim();
  if (!trimmed) return answers;

  const cappedAnswer = Array.from(trimmed)
    .slice(0, FEEDBACK_ANSWER_LIMIT)
    .join("");

  return [
    ...answers,
    {
      id: currentPrompt.id,
      question: currentPrompt.text,
      answer: cappedAnswer,
    },
  ];
}

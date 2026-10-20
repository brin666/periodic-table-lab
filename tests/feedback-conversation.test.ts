import test from "node:test";
import assert from "node:assert/strict";
import {
  FEEDBACK_ANSWER_LIMIT,
  appendFeedbackAnswer,
  getConversationPlan,
  localizeFeedbackAnswers,
} from "../src/components/feedback-conversation";
import type { FeedbackAnswer } from "../src/components/feedback-conversation";

test("starts with the screenshot description prompt and handles a clear bug conversationally", () => {
  let answers: FeedbackAnswer[] = [];
  let plan = getConversationPlan(answers);

  assert.equal(plan.prompt?.id, "describe");
  assert.equal(
    plan.prompt?.text,
    "这张截图里，你遇到了什么问题，或希望怎样改进？",
  );

  answers = appendFeedbackAnswer(answers, "  点击没有反应  ");
  plan = getConversationPlan(answers);
  assert.equal(plan.type, "bug");
  assert.equal(plan.prompt?.id, "steps");
  assert.match(plan.prompt?.text ?? "", /哪一项|操作顺序|所在位置/);

  answers = appendFeedbackAnswer(answers, "搜索按钮");
  plan = getConversationPlan(answers);
  assert.equal(plan.prompt?.id, "expected_context");
  assert.match(plan.prompt?.text ?? "", /原本希望|每次|偶尔/);

  answers = appendFeedbackAnswer(
    answers,
    "我原本希望打开搜索结果，手机上每次都会发生",
  );
  plan = getConversationPlan(answers);
  assert.equal(plan.complete, true);
  assert.equal(plan.prompt, null);
  assert.equal(plan.answered, 3);
});

test("content corrections ask where the claim is and what supports the correction", () => {
  let answers: FeedbackAnswer[] = [];
  answers = appendFeedbackAnswer(answers, "教材里的化学式写错了");
  let plan = getConversationPlan(answers);
  assert.equal(plan.type, "content");
  assert.equal(plan.prompt?.id, "location");

  answers = appendFeedbackAnswer(answers, "第三页的水分子方程式");
  plan = getConversationPlan(answers);
  assert.equal(plan.prompt?.id, "correction_reference");
  assert.match(plan.prompt?.text ?? "", /应改成什么|教材|来源/);

  answers = appendFeedbackAnswer(
    answers,
    "我认为应写成 H₂O，依据是课本第 12 页",
  );
  plan = getConversationPlan(answers);
  assert.equal(plan.type, "content");
  assert.equal(plan.complete, true);
});

test("suggestions ask for the desired change and the use case without repeating supplied details", () => {
  let answers: FeedbackAnswer[] = [];
  answers = appendFeedbackAnswer(answers, "建议增加模式切换");
  let plan = getConversationPlan(answers);
  assert.equal(plan.type, "suggestion");
  assert.equal(plan.prompt?.id, "use_case");

  answers = appendFeedbackAnswer(answers, "方便我晚上复习");
  plan = getConversationPlan(answers);
  assert.equal(plan.prompt?.id, "priority");

  answers = appendFeedbackAnswer(answers, "希望先减少查找时间");
  plan = getConversationPlan(answers);
  assert.equal(plan.complete, true);
  assert.equal(plan.answered, 3);
});

test("ambiguous feedback asks for intent, adapts after clarification, and does not repeat question ids", () => {
  let answers: FeedbackAnswer[] = [];
  answers = appendFeedbackAnswer(answers, "有个地方让我有点困惑");
  let plan = getConversationPlan(answers);
  assert.equal(plan.prompt?.id, "intent");
  assert.deepEqual(plan.prompt?.suggestions, [
    "操作出了问题",
    "内容需要核对",
    "我有改进建议",
  ]);

  answers = appendFeedbackAnswer(answers, "操作出了问题");
  plan = getConversationPlan(answers);
  assert.equal(plan.type, "bug");
  assert.notEqual(plan.prompt?.id, "intent");
  assert.equal(plan.prompt?.id, "steps");
});

test("uncertain answers progress through distinct prompts and stop at five questions", () => {
  let answers: FeedbackAnswer[] = [];
  const seenIds = new Set<string>();
  const enteredAnswers = [
    "不知道具体想反馈什么",
    "暂时不确定",
    "暂时不确定",
    "暂时不确定",
    "暂时不确定",
  ];

  for (const answer of enteredAnswers) {
    const plan = getConversationPlan(answers);
    assert.ok(plan.prompt, "a prompt is available before the fifth answer");
    assert.ok(
      !seenIds.has(plan.prompt.id),
      `question ${plan.prompt.id} is unique`,
    );
    seenIds.add(plan.prompt.id);
    answers = appendFeedbackAnswer(answers, answer);
  }

  const finished = getConversationPlan(answers);
  assert.equal(finished.complete, true);
  assert.equal(finished.prompt, null);
  assert.equal(finished.answered, 5);
  assert.equal(seenIds.size, 5);
});

test("detailed answers still get three turns, then appear verbatim under the neutral summary title", () => {
  const original =
    "点击元素卡片后，详情没有打开；我原本希望看到元素详情，这在手机 Chrome 上每次都发生。";
  let answers = appendFeedbackAnswer([], original);
  let plan = getConversationPlan(answers);

  assert.equal(plan.type, "bug");
  assert.equal(plan.prompt?.id, "impact");
  answers = appendFeedbackAnswer(answers, "这让我无法继续查找元素信息");
  plan = getConversationPlan(answers);
  assert.equal(plan.prompt?.id, "supplement");
  answers = appendFeedbackAnswer(answers, "没有其他补充");
  plan = getConversationPlan(answers);
  assert.equal(plan.complete, true);
  assert.equal(plan.answered, 3);
  assert.ok(plan.description.startsWith("反馈记录\n\n"));
  assert.equal(plan.description.includes(`用户回答：${original}`), true);
});

test("append trims and caps Unicode answers without splitting surrogate pairs", () => {
  const longAnswer = ` ${"学".repeat(FEEDBACK_ANSWER_LIMIT - 1)}🧪${"后".repeat(4)} `;
  const answers = appendFeedbackAnswer([], longAnswer);

  assert.equal(Array.from(answers[0].answer).length, FEEDBACK_ANSWER_LIMIT);
  assert.equal(answers[0].answer.endsWith("🧪"), true);
  assert.equal(answers[0].answer.includes("\uFFFD"), false);
});

test("the five-answer summary stays below the receiver limit and includes every capped answer", () => {
  let answers: FeedbackAnswer[] = [];
  const fullAnswer = "甲".repeat(FEEDBACK_ANSWER_LIMIT);

  for (let index = 0; index < 5; index += 1)
    answers = appendFeedbackAnswer(answers, fullAnswer);

  const plan = getConversationPlan(answers);
  assert.equal(plan.complete, true);
  assert.ok(plan.description.length <= 3000);
  assert.equal(answers.length, 5);
  for (const answer of answers)
    assert.equal(plan.description.includes(`用户回答：${answer.answer}`), true);
});

test("empty answers are rejected and planning stays deterministic and local", () => {
  const answers = appendFeedbackAnswer([], "  \n  ");
  assert.deepEqual(answers, []);

  const first = appendFeedbackAnswer([], "建议增加筛选");
  assert.deepEqual(getConversationPlan(first), getConversationPlan(first));
});

test("English bug feedback adapts to the missing expected behavior and finishes in three answers", () => {
  let answers: FeedbackAnswer[] = [];
  let plan = getConversationPlan(answers, "en");

  assert.equal(plan.prompt?.id, "describe");
  assert.equal(
    plan.prompt?.text,
    "What happened in this screenshot, or what would you like to improve?",
  );

  answers = appendFeedbackAnswer(
    answers,
    "Clicking the search button sometimes leaves the results blank on mobile Chrome.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.type, "bug");
  assert.equal(plan.prompt?.id, "expected_context");
  assert.match(plan.prompt?.text ?? "", /What did you expect/);

  answers = appendFeedbackAnswer(
    answers,
    "I expected the matching element results to appear.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.prompt?.id, "impact");

  answers = appendFeedbackAnswer(
    answers,
    "It blocks me from finding an element, so I cannot continue.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.complete, true);
  assert.equal(plan.answered, 3);
  assert.ok(plan.description.startsWith("Feedback record\n\n"));
  assert.ok(plan.description.includes(`Your answer: ${answers[0].answer}`));
});

test("English content feedback asks for a source when the correction has no reference", () => {
  let answers: FeedbackAnswer[] = [];
  answers = appendFeedbackAnswer(
    answers,
    "The water equation in the content looks wrong.",
    "en",
  );
  let plan = getConversationPlan(answers, "en");

  assert.equal(plan.type, "content");
  assert.equal(plan.prompt?.id, "correction_reference");
  assert.match(plan.prompt?.text ?? "", /textbook|source/i);

  answers = appendFeedbackAnswer(
    answers,
    "It should read H2O; I checked the chemistry textbook, page 12.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.prompt?.id, "impact");

  answers = appendFeedbackAnswer(
    answers,
    "The incorrect formula makes it hard to follow the reaction.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.type, "content");
  assert.equal(plan.complete, true);
  assert.ok(plan.description.includes(`Your answer: ${answers[1].answer}`));
});

test("English suggestions adapt to the use case and priority without exceeding three answers", () => {
  let answers: FeedbackAnswer[] = [];
  answers = appendFeedbackAnswer(
    answers,
    "I would like the filter to let me search by element family.",
    "en",
  );
  let plan = getConversationPlan(answers, "en");
  assert.equal(plan.type, "suggestion");
  assert.equal(plan.prompt?.id, "use_case");

  answers = appendFeedbackAnswer(
    answers,
    "I use it when reviewing for chemistry exams.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.prompt?.id, "priority");

  answers = appendFeedbackAnswer(
    answers,
    "It would save time when comparing several element groups.",
    "en",
  );
  plan = getConversationPlan(answers, "en");
  assert.equal(plan.complete, true);
  assert.equal(plan.answered, 3);
  assert.match(plan.description, /Feedback record[\s\S]*Your answer:/);
});

test("English unclear feedback uses distinct prompts and stops after five answers", () => {
  let answers: FeedbackAnswer[] = [];
  const seenIds = new Set<string>();
  const enteredAnswers = [
    "Something on the page feels confusing.",
    "Not sure",
    "No idea",
    "I don't know",
    "I'd rather not say",
  ];

  for (const answer of enteredAnswers) {
    const plan = getConversationPlan(answers, "en");
    assert.ok(plan.prompt, "a question is available before the fifth answer");
    assert.ok(!seenIds.has(plan.prompt.id), `question ${plan.prompt.id} is unique`);
    seenIds.add(plan.prompt.id);
    answers = appendFeedbackAnswer(answers, answer, "en");
  }

  const finished = getConversationPlan(answers, "en");
  assert.equal(finished.complete, true);
  assert.equal(finished.prompt, null);
  assert.equal(finished.answered, 5);
  assert.equal(seenIds.size, 5);
  assert.ok(finished.description.length < 3000);
});

test("English answers can be shown as a Chinese conversation after a language change", () => {
  let answers = appendFeedbackAnswer([], "Clicking search does nothing.", "en");
  answers = appendFeedbackAnswer(answers, "It happens on mobile Chrome.", "en");

  const chineseAnswers = localizeFeedbackAnswers(answers, "zh");
  assert.match(chineseAnswers[0].question, /截图里/);
  assert.match(chineseAnswers[1].question, /原本希望/);
  assert.equal(chineseAnswers[0].answer, answers[0].answer);
});

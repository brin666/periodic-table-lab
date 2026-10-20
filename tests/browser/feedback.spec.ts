import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type FeedbackPayload = {
  id: string;
  type: "bug" | "content" | "suggestion";
  description: string;
  page: {
    url: string;
    title: string;
    learningMode: "junior" | "senior";
    viewport: { width: number; height: number };
    userAgent: string;
    version: string;
  };
  screenshot?: string;
  consent: boolean;
  website: string;
};

type MockResponse = { status: number; body: unknown };
type MockResponder = (
  payload: FeedbackPayload,
  attempt: number,
) => MockResponse | Promise<MockResponse>;

const endpoint = "**/api/feedback";
const validIssueUrl = (number: number) =>
  `https://github.com/brin666/periodic-table-lab/issues/${number}`;

function receipt(payload: FeedbackPayload, number = 41) {
  return {
    id: payload.id,
    number,
    url: validIssueUrl(number),
  };
}

async function interceptFeedback(
  page: Page,
  respond: MockResponder = (payload) => ({
    status: 201,
    body: receipt(payload),
  }),
) {
  const payloads: FeedbackPayload[] = [];
  await page.route(endpoint, async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const payload = route.request().postDataJSON() as FeedbackPayload;
    payloads.push(payload);
    const response = await respond(payload, payloads.length);
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  });
  return payloads;
}

async function openApp(page: Page, route = "/") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  await expect(
    page.getByRole("button", { name: "反馈", exact: true }),
  ).toBeVisible();
}

async function openCapture(page: Page) {
  await page.getByRole("button", { name: "反馈", exact: true }).click();
  const dialog = page.locator(".feedback-dialog--capture");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "框选当前页面", exact: true }),
  ).toBeVisible();
  await expect(dialog).toHaveAttribute("open", "");
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await expect(page.locator('svg[aria-label="截图区域选择"]')).toBeVisible();
  return dialog;
}

async function openTextOnlyChat(page: Page) {
  await openCapture(page);
  await page.getByRole("button", { name: "仅写建议", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  const log = page.getByRole("log");
  await expect(log).toBeVisible();
  await expect(log.locator(".feedback-message").first()).toHaveClass(
    /feedback-message--assistant/,
  );
  await expect(
    page
      .getByRole("dialog", { name: "聊聊这个问题" })
      .locator("fieldset, form, input[type=radio]"),
  ).toHaveCount(0);
  await expect(feedbackComposer(page)).toBeVisible();
  return log;
}

type FeedbackConversation = { questions: string[]; replies: string[] };

function feedbackComposer(page: Page) {
  return page.getByRole("textbox", { name: "回复反馈助手", exact: true });
}

async function sendFeedbackReply(page: Page, reply: string) {
  const composer = feedbackComposer(page);
  await expect(composer).toBeVisible();
  await expect(composer).toHaveAttribute("maxlength", "500");
  await composer.fill(reply);
  await composer.press("Enter");
  await expect(
    page
      .getByRole("log")
      .locator(".feedback-message--user:not(.feedback-message--image)")
      .last(),
  ).toContainText(reply);
}

function realisticReply(question: string, index: number) {
  if (/预期|希望|应该|本来/.test(question)) {
    return "我预期点击后能打开该元素的详情页，并保留当前周期表位置。";
  }
  if (/频率|每次|偶尔|复现/.test(question)) {
    return "刷新后重新点一次仍能复现，这几次尝试都是一样的结果。";
  }
  if (/设备|浏览器|手机|电脑|系统/.test(question)) {
    return "我在 Windows 笔记本的 Chrome 浏览器里操作，窗口宽度约 1440 像素。";
  }
  if (/步骤|怎么|如何|操作|点击|过程/.test(question)) {
    return "我先打开周期表，再点击水元素卡片，然后等待了几秒钟。";
  }
  return [
    "我先打开周期表，再点击水元素卡片，然后等待了几秒钟。",
    "我预期点击后能打开水元素详情页，并保留当前页面位置。",
    "刷新后重新操作仍能复现，这几次尝试都是一样的结果。",
    "我在 Windows 笔记本的 Chrome 浏览器里操作。",
  ][index % 4];
}

async function finishConversation(
  page: Page,
  options: {
    firstReply: string;
    answered?: FeedbackConversation;
  },
): Promise<FeedbackConversation> {
  const log = page.getByRole("log");
  const conversation: FeedbackConversation = {
    questions: [...(options.answered?.questions ?? [])],
    replies: [...(options.answered?.replies ?? [])],
  };
  const assistantQuestions = log.locator(
    ".feedback-message--assistant:not(:has(.feedback-chat-summary))",
  );
  let questionIndex = conversation.replies.length;
  for (; questionIndex < 5; questionIndex += 1) {
    if (
      await page
        .locator(".feedback-chat-summary")
        .isVisible()
        .catch(() => false)
    ) {
      break;
    }
    await expect(assistantQuestions.last()).toBeVisible();
    const question = (
      await assistantQuestions.last().locator("p").innerText()
    ).trim();
    const reply =
      questionIndex === 0
        ? options.firstReply
        : realisticReply(question, questionIndex - 1);
    conversation.questions.push(question);
    conversation.replies.push(reply);
    const before = await assistantQuestions.count();
    await sendFeedbackReply(page, reply);
    if (
      !(await page
        .locator(".feedback-chat-summary")
        .isVisible()
        .catch(() => false))
    ) {
      await expect
        .poll(() => assistantQuestions.count())
        .toBeGreaterThan(before);
      await expect(feedbackComposer(page)).toHaveValue("");
    }
  }
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  expect(conversation.questions.length).toBeGreaterThanOrEqual(3);
  expect(conversation.questions.length).toBeLessThanOrEqual(5);
  return conversation;
}

async function prepareReview(
  page: Page,
  options: {
    type?: "问题反馈" | "内容纠错" | "改进建议";
    description: string;
  },
) {
  await openTextOnlyChat(page);
  const conversation = await finishConversation(page, {
    firstReply: options.description,
  });
  expect(conversation.replies[0]).toBe(options.description);
  return conversation;
}

async function consentAndSubmit(page: Page) {
  const consent = page.getByRole("checkbox", { name: /GitHub/i });
  await expect(consent).not.toBeChecked();
  await expect(page.locator(".feedback-chat-summary__public")).toBeVisible();
  await consent.check();
  await page.getByRole("button", { name: "确认并上传", exact: true }).click();
}

async function expectReceipt(page: Page, number: number) {
  const link = page.getByRole("link", {
    name: "查看 GitHub 反馈",
    exact: true,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", validIssueUrl(number));
}

async function inspectRaster(page: Page, dataUrl: string) {
  return page.evaluate(async (source) => {
    const match = /^data:image\/(png|jpeg);base64,/.exec(source);
    if (!match) return { mime: "", width: 0, height: 0 };
    const image = new Image();
    image.src = source;
    await image.decode();
    return {
      mime: `image/${match[1]}`,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }, dataUrl);
}

async function countRasterPixelDifferences(
  page: Page,
  before: string,
  after: string,
) {
  return page.evaluate(
    async ([beforeSource, afterSource]) => {
      const decode = async (source: string) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true })!;
        context.drawImage(image, 0, 0);
        return {
          width: canvas.width,
          height: canvas.height,
          pixels: context.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      };
      const [first, second] = await Promise.all([
        decode(beforeSource),
        decode(afterSource),
      ]);
      if (first.width !== second.width || first.height !== second.height)
        return -1;
      let different = 0;
      for (let index = 0; index < first.pixels.length; index += 4) {
        if (
          Math.abs(first.pixels[index] - second.pixels[index]) +
            Math.abs(first.pixels[index + 1] - second.pixels[index + 1]) +
            Math.abs(first.pixels[index + 2] - second.pixels[index + 2]) >
          24
        ) {
          different += 1;
        }
      }
      return different;
    },
    [before, after],
  );
}

async function cropSimilarity(
  page: Page,
  source: string,
  cropped: string,
  region: { x: number; y: number; width: number; height: number },
) {
  return page.evaluate(
    async ({ sourceUrl, croppedUrl, selection }) => {
      const decode = async (url: string) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
      };
      const [original, result] = await Promise.all([
        decode(sourceUrl),
        decode(croppedUrl),
      ]);
      const x = Math.floor(selection.x);
      const y = Math.floor(selection.y);
      const width = Math.ceil(selection.width);
      const height = Math.ceil(selection.height);
      if (result.naturalWidth !== width || result.naturalHeight !== height)
        return 0;

      const expectedCanvas = document.createElement("canvas");
      expectedCanvas.width = width;
      expectedCanvas.height = height;
      const expectedContext = expectedCanvas.getContext("2d", {
        willReadFrequently: true,
      })!;
      expectedContext.drawImage(
        original,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height,
      );

      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = width;
      resultCanvas.height = height;
      const resultContext = resultCanvas.getContext("2d", {
        willReadFrequently: true,
      })!;
      resultContext.drawImage(result, 0, 0);
      const expectedPixels = expectedContext.getImageData(
        0,
        0,
        width,
        height,
      ).data;
      const resultPixels = resultContext.getImageData(0, 0, width, height).data;
      let similar = 0;
      for (let index = 0; index < expectedPixels.length; index += 4) {
        const difference =
          Math.abs(expectedPixels[index] - resultPixels[index]) +
          Math.abs(expectedPixels[index + 1] - resultPixels[index + 1]) +
          Math.abs(expectedPixels[index + 2] - resultPixels[index + 2]);
        if (difference <= 42) similar += 1;
      }
      return similar / (width * height);
    },
    { sourceUrl: source, croppedUrl: cropped, selection: region },
  );
}

function expectValidPayload(
  payload: FeedbackPayload,
  expected: {
    type: FeedbackPayload["type"];
    description?: string;
    conversation?: FeedbackConversation;
  },
) {
  expect(payload.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  expect(payload.type).toBe(expected.type);
  if (expected.description)
    expect(payload.description).toBe(expected.description);
  if (expected.conversation) {
    for (const text of [
      ...expected.conversation.questions,
      ...expected.conversation.replies,
    ]) {
      expect(payload.description).toContain(text);
    }
  }
  expect(payload.page.url).toMatch(/^https?:\/\//);
  expect(payload.page.title.length).toBeGreaterThan(0);
  expect(payload.page.learningMode).toBe("senior");
  expect(payload.page.viewport.width).toBeGreaterThan(0);
  expect(payload.page.viewport.height).toBeGreaterThan(0);
  expect(payload.page.userAgent.length).toBeGreaterThan(0);
  expect(payload.page.version.length).toBeGreaterThan(0);
  expect(payload.consent).toBe(true);
  expect(payload.website).toBe("");
}

for (const routeCase of [
  { name: "knowledge map", route: "/#/element/h" },
  { name: "atom view", route: "/#/element/h/atom" },
  { name: "substance view", route: "/#/element/h/substance/water" },
]) {
  test(`feedback can be submitted from the ${routeCase.name} with page context`, async ({
    page,
  }) => {
    const payloads = await interceptFeedback(page);
    await openApp(page, routeCase.route);
    const expectedUrl = await page.evaluate(() => location.href);
    const expectedTitle = await page.title();
    const description = "点击水卡片后页面没有反应。";

    const conversation = await prepareReview(page, {
      type: "问题反馈",
      description,
    });
    expect(payloads).toHaveLength(0);
    const submit = page.getByRole("button", {
      name: "确认并上传",
      exact: true,
    });
    await expect(submit).toBeDisabled();
    const consent = page.getByRole("checkbox", { name: /GitHub/i });
    await expect(consent).not.toBeChecked();
    await consent.check();
    expect(payloads).toHaveLength(0);
    await submit.click();
    await expect.poll(() => payloads.length).toBe(1);

    const [payload] = payloads;
    expectValidPayload(payload, { type: "bug", conversation });
    expect(new URL(payload.page.url).origin).toBe(new URL(expectedUrl).origin);
    expect(payload.page.title).toBe(expectedTitle);
    expect(payload.page.url).toContain("127.0.0.1:4178");
    expect(payload).not.toHaveProperty("screenshot");
    await expectReceipt(page, 41);
  });
}

test("a suggestion can be submitted without attaching a screenshot", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  const description = "希望增加按元素族查看学习资料的入口。";

  const conversation = await prepareReview(page, {
    type: "改进建议",
    description,
  });
  expect(payloads).toHaveLength(0);
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);

  expectValidPayload(payloads[0], { type: "suggestion", conversation });
  expect(payloads[0]).not.toHaveProperty("screenshot");
  await expectReceipt(page, 41);
});

test("a plain-language bug is clarified in chat before explicit upload confirmation", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  await openTextOnlyChat(page);
  const conversation = await finishConversation(page, {
    firstReply: "点击水卡片后页面没有反应。",
  });

  expect(conversation.replies[0]).toBe("点击水卡片后页面没有反应。");
  expect(payloads).toHaveLength(0);
  const summary = page.locator(".feedback-chat-summary");
  await expect(summary).toBeVisible();
  for (const text of [...conversation.questions, ...conversation.replies]) {
    await expect(summary).toContainText(text);
  }
  const upload = page.getByRole("button", {
    name: "确认并上传",
    exact: true,
  });
  await expect(upload).toBeDisabled();
  const consent = page.getByRole("checkbox", { name: /GitHub/i });
  await expect(consent).not.toBeChecked();
  await consent.check();
  expect(payloads).toHaveLength(0);
  await upload.click();
  await expect.poll(() => payloads.length).toBe(1);
  expectValidPayload(payloads[0], { type: "bug", conversation });
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  expect(payloads[0]).not.toHaveProperty("screenshot");
  await expectReceipt(page, 41);
});

test("chat quick replies are sent as user messages and Shift+Enter keeps a line break", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  const log = await openTextOnlyChat(page);
  const assistantQuestions = log.locator(
    ".feedback-message--assistant:not(:has(.feedback-chat-summary))",
  );
  const questionCount = await assistantQuestions.count();
  await sendFeedbackReply(
    page,
    "我打开了这个页面，不过不太确定该把情况归为哪种反馈。",
  );
  await expect
    .poll(() => assistantQuestions.count())
    .toBeGreaterThan(questionCount);
  const suggestion = log.getByRole("button").first();
  await expect(suggestion).toBeVisible();
  const suggestedReply = (await suggestion.innerText()).trim();
  expect(suggestedReply).toBe("操作出了问题");
  await suggestion.click();
  await expect(
    log.locator(".feedback-message--user:not(.feedback-message--image)").last(),
  ).toContainText(suggestedReply);
  await expect
    .poll(() => assistantQuestions.count())
    .toBeGreaterThan(questionCount);

  const composer = feedbackComposer(page);
  const sendButton = page.getByRole("button", {
    name: "发送回复",
    exact: true,
  });
  await composer.fill("我在周期表中点击水元素。 ");
  await composer.press("Shift+Enter");
  await composer.type("详情页没有打开。");
  await expect(composer).toHaveValue(
    "我在周期表中点击水元素。 \n详情页没有打开。",
  );
  await expect(sendButton).toBeVisible();
  await sendButton.click();
  await expect(
    log.locator(".feedback-message--user:not(.feedback-message--image)").last(),
  ).toContainText("详情页没有打开。");
  expect(payloads).toHaveLength(0);
});

test("the first feedback click opens a full-viewport crop and attaches the selected raster directly", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const payloads = await interceptFeedback(page);
  await openApp(page);
  expect(requests.some((url) => /html-to-image/i.test(url))).toBe(false);

  const captureDialog = await openCapture(page);
  const dialogBounds = await captureDialog.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  expect(dialogBounds).not.toBeNull();
  expect(dialogBounds!.x).toBeLessThanOrEqual(16);
  expect(dialogBounds!.y).toBeLessThanOrEqual(16);
  expect(dialogBounds!.x + dialogBounds!.width).toBeGreaterThanOrEqual(
    viewport.width - 16,
  );
  expect(dialogBounds!.y + dialogBounds!.height).toBeGreaterThanOrEqual(
    viewport.height - 16,
  );

  const sourceImage = page.locator(".feedback-capture-frame img");
  await expect(sourceImage).toBeVisible();
  const source = await sourceImage.getAttribute("src");
  expect(source).toMatch(/^data:image\/(png|jpeg);base64,/);
  const sourceRaster = await inspectRaster(page, source!);
  expect(sourceRaster.width).toBe(viewport.width);
  expect(sourceRaster.height).toBe(viewport.height);

  const cropOverlay = page.locator('svg[aria-label="截图区域选择"]');
  const cropBounds = await cropOverlay.boundingBox();
  expect(cropBounds).not.toBeNull();
  expect(cropBounds!.x).toBeLessThanOrEqual(16);
  expect(cropBounds!.y).toBeLessThanOrEqual(16);
  expect(cropBounds!.width).toBeGreaterThanOrEqual(viewport.width - 32);
  expect(cropBounds!.height).toBeGreaterThanOrEqual(viewport.height - 32);
  const cropStart = {
    x: cropBounds!.x + cropBounds!.width * 0.16,
    y: cropBounds!.y + cropBounds!.height * 0.18,
  };
  const cropEnd = {
    x: cropBounds!.x + cropBounds!.width * 0.78,
    y: cropBounds!.y + cropBounds!.height * 0.64,
  };
  await page.mouse.move(cropStart.x, cropStart.y);
  await page.mouse.down();
  await page.mouse.move(cropEnd.x, cropEnd.y, { steps: 5 });
  await page.mouse.up();
  const selectedRect = await cropOverlay
    .locator("rect")
    .evaluate((element) => ({
      x: Number(element.getAttribute("x")),
      y: Number(element.getAttribute("y")),
      width: Number(element.getAttribute("width")),
      height: Number(element.getAttribute("height")),
    }));
  await page.getByRole("button", { name: "完成截图", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题", exact: true }),
  ).toBeVisible();
  const log = page.getByRole("log");
  await expect(log).toBeVisible();
  const firstMessage = log.locator(".feedback-message").first();
  await expect(firstMessage).toHaveClass(/feedback-message--image/);
  await expect(log.locator(".feedback-message").nth(1)).toHaveClass(
    /feedback-message--assistant/,
  );
  await expect(
    page
      .getByRole("dialog", { name: "聊聊这个问题" })
      .locator("fieldset, form, input[type=radio]"),
  ).toHaveCount(0);

  const attachedImage = page.getByRole("img", {
    name: "反馈截图",
  });
  await expect(attachedImage).toBeVisible();
  const attachedSource = await attachedImage.getAttribute("src");
  expect(attachedSource).toMatch(/^data:image\/(png|jpeg);base64,/);
  const raster = await inspectRaster(page, attachedSource!);
  expect(raster.width).toBeGreaterThan(24);
  expect(raster.height).toBeGreaterThan(24);
  expect(raster.width).toBeLessThan(viewport.width);
  expect(raster.height).toBeLessThan(viewport.height);
  const expectedCropWidth = selectedRect.width / sourceRaster.width;
  const expectedCropHeight = selectedRect.height / sourceRaster.height;
  expect(
    Math.abs(raster.width / sourceRaster.width - expectedCropWidth),
  ).toBeLessThan(0.04);
  expect(
    Math.abs(raster.height / sourceRaster.height - expectedCropHeight),
  ).toBeLessThan(0.04);
  expect(
    await cropSimilarity(page, source!, attachedSource!, {
      ...selectedRect,
    }),
  ).toBeGreaterThan(0.97);

  await expect(attachedImage).toHaveAttribute("src", attachedSource!);
  const conversation = await finishConversation(page, {
    firstReply: "点击水卡片后页面没有反应，截图标出了我点击的位置。",
  });
  expect(payloads).toHaveLength(0);
  await expect(firstMessage).toHaveClass(/feedback-message--image/);
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);

  expect(payloads[0].screenshot).toBe(attachedSource);
  expectValidPayload(payloads[0], {
    type: "bug",
    conversation,
  });
  expect(raster.mime).toMatch(/^image\/(png|jpeg)$/);
  await expectReceipt(page, 41);
});

test("a transient failure preserves the draft and retry reuses its UUID", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page, (payload, attempt) =>
    attempt === 1
      ? { status: 503, body: { error: "temporarily_unavailable" } }
      : { status: 201, body: receipt(payload, 42) },
  );
  await openApp(page);
  const description = "点击详情页返回按钮后没有反应。";

  const conversation = await prepareReview(page, {
    type: "问题反馈",
    description,
  });
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);
  expectValidPayload(payloads[0], { type: "bug", conversation });
  await expect(
    page.getByRole("button", { name: "使用原编号重试", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "修改上一条", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "查看 GitHub 反馈", exact: true }),
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: "使用原编号重试", exact: true })
    .click();
  await expect.poll(() => payloads.length).toBe(2);
  expect(payloads[1]).toEqual(payloads[0]);
  expect(payloads[1].id).toBe(payloads[0].id);
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  await expectReceipt(page, 42);
});

test("editing a definitively rejected draft rotates its UUID and submits the changed text", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page, (payload, attempt) =>
    attempt === 1
      ? {
          status: 400,
          body: {
            error: "invalid_request",
            message: "请补充问题描述后再提交。",
          },
        }
      : { status: 201, body: receipt(payload, 44) },
  );
  await openApp(page);
  const originalDescription = "点击水卡片后页面没有反应。";
  const editedDescription = "点击返回按钮后页面没有反应，且滚动位置未恢复。";

  const conversation = await prepareReview(page, {
    type: "问题反馈",
    description: originalDescription,
  });
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);
  expectValidPayload(payloads[0], { type: "bug", conversation });
  await expect(
    page.getByRole("button", { name: "修改上一条", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "修改上一条", exact: true }).click();
  const composer = feedbackComposer(page);
  const previousReply = conversation.replies.at(-1)!;
  await expect(composer).toHaveValue(previousReply);
  await composer.fill(editedDescription);
  await composer.press("Enter");
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  await page.getByRole("checkbox", { name: /GitHub/i }).check();
  await page.getByRole("button", { name: "确认并上传", exact: true }).click();
  await expect.poll(() => payloads.length).toBe(2);
  expectValidPayload(payloads[1], {
    type: "bug",
    conversation: {
      questions: conversation.questions,
      replies: [...conversation.replies.slice(0, -1), editedDescription],
    },
  });

  expect(payloads[1].id).not.toBe(payloads[0].id);
  expect(payloads[1].description).toContain(editedDescription);
  expect(payloads[1].description).not.toContain(previousReply);
  await expectReceipt(page, 44);
});

test("a malformed success response never produces a success receipt", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page, (payload) => ({
    status: 200,
    body: {
      id: payload.id,
      number: 43,
      url: "https://example.invalid/issues/43",
    },
  }));
  await openApp(page);
  const description = "请修正这条页面提示里的错别字。";

  const conversation = await prepareReview(page, {
    type: "内容纠错",
    description,
  });
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);
  expectValidPayload(payloads[0], { type: "content", conversation });

  await expect(
    page.getByRole("button", { name: "使用原编号重试", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "查看 GitHub 反馈", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "修改上一条", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  await expect(page.getByText(/已提交|反馈成功/)).toHaveCount(0);
});

test("Escape cancels feedback from the keyboard and restores launcher focus", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page, "/#/element/h/substance/water");
  const routeBefore = await page.evaluate(() => location.href);
  const launcher = page.getByRole("button", { name: "反馈", exact: true });
  await launcher.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".feedback-dialog--capture")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.locator(".feedback-dialog")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(launcher).toBeFocused();
  expect(await page.evaluate(() => location.href)).toBe(routeBefore);
  expect(payloads).toHaveLength(0);
});

test("feedback opens above the reading dialog and Escape restores its launcher", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  await page.getByRole("button", { name: /资料与说明/ }).click();

  const notes = page.getByRole("dialog", { name: "探索，也认真求证。" });
  await expect(notes).toBeVisible();
  const launcher = notes.getByRole("button", { name: "反馈", exact: true });
  await expect(launcher).toBeVisible();
  await launcher.focus();
  await page.keyboard.press("Enter");

  const feedback = page.locator(".feedback-dialog--capture");
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveAttribute("open", "");
  await expect(page.locator("dialog[open]")).toHaveCount(2);
  await page.keyboard.press("Escape");

  await expect(feedback).toHaveCount(0);
  await expect(notes).toBeVisible();
  await expect(launcher).toBeFocused();
  expect(payloads).toHaveLength(0);
});

test("the capture and chat composer fit a 320px touch viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    const payloads = await interceptFeedback(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:4178/");
    const launcher = page.getByRole("button", { name: "反馈", exact: true });
    await expect(launcher).toBeVisible();
    await launcher.tap();

    const feedback = page.locator(".feedback-dialog--capture");
    await expect(feedback).toBeVisible();
    const cropOverlay = page.locator('svg[aria-label="截图区域选择"]');
    const overlayBounds = await cropOverlay.boundingBox();
    expect(overlayBounds).not.toBeNull();
    expect(overlayBounds!.x).toBeLessThanOrEqual(8);
    expect(overlayBounds!.y).toBeLessThanOrEqual(8);
    expect(overlayBounds!.width).toBeGreaterThanOrEqual(304);
    expect(overlayBounds!.height).toBeGreaterThanOrEqual(724);
    const fullViewportImage = await inspectRaster(
      page,
      (await page.locator(".feedback-capture-frame img").getAttribute("src"))!,
    );
    expect(fullViewportImage.width / fullViewportImage.height).toBeCloseTo(
      320 / 740,
      2,
    );
    await page.getByRole("button", { name: "仅写建议", exact: true }).tap();
    await expect(
      page.getByRole("dialog", { name: "聊聊这个问题" }),
    ).toBeVisible();
    await expect(feedbackComposer(page)).toBeVisible();
    const bounds = await feedbackComposer(page).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    expect(payloads).toHaveLength(0);
  } finally {
    await context.close();
  }
});

test("closing the progress window keeps one submission running and preserves its receipt", async ({
  page,
}) => {
  let complete: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const payloads = await interceptFeedback(page, async (payload) => {
    await pending;
    return { status: 201, body: receipt(payload, 71) };
  });
  await openApp(page);
  const conversation = await prepareReview(page, {
    type: "改进建议",
    description: "建议为化合物发现增加更清楚的键盘操作提示。",
  });
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);
  expectValidPayload(payloads[0], { type: "suggestion", conversation });
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  await page.getByRole("button", { name: "关闭进度窗口", exact: true }).click();
  await expect(page.locator(".feedback-dialog")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.getByRole("button", { name: "反馈", exact: true }).click();
  await expect(page.locator(".feedback-dialog--capture")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "关闭进度窗口", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭进度窗口", exact: true }).click();
  complete!();
  await page.getByRole("button", { name: "反馈", exact: true }).click();
  await expectReceipt(page, 71);
  expect(payloads).toHaveLength(1);
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.getByRole("button", { name: "反馈", exact: true }).click();
  await expectReceipt(page, 71);
  expect(payloads).toHaveLength(1);
  await page.getByRole("button", { name: "新建反馈", exact: true }).click();
  await expect(page.locator(".feedback-dialog--capture")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "框选当前页面" }),
  ).toBeVisible();
  expect(payloads).toHaveLength(1);
});

test("the captured image represents the scrolled viewport rather than the page top", async ({
  page,
}) => {
  await interceptFeedback(page);
  await page.setViewportSize({ width: 1100, height: 700 });
  await openApp(page, "/#/element/h/substance/water");
  await page.evaluate(async () => {
    scrollTo(0, 400);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  const actual = `data:image/png;base64,${(await page.screenshot()).toString("base64")}`;
  await openCapture(page);
  const captured = await page
    .locator(".feedback-capture-frame img")
    .getAttribute("src");
  expect(captured).toBeTruthy();
  const raster = await inspectRaster(page, captured!);
  expect(raster.width).toBe(1100);
  expect(raster.height).toBe(700);
  const different = await countRasterPixelDifferences(page, actual, captured!);
  expect(different).toBeGreaterThanOrEqual(0);
  // Allows system-font raster differences while rejecting the wrong page section.
  expect(different / (1100 * 700)).toBeLessThan(0.18);
});

test("a failed screenshot retake keeps the old image but clears public consent", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  await openCapture(page);
  await page.getByRole("button", { name: "截取整页", exact: true }).click();
  const log = page.getByRole("log");
  const screenshot = page.getByRole("img", { name: "反馈截图" });
  const originalSource = await screenshot.getAttribute("src");
  expect(originalSource).toMatch(/^data:image\/(png|jpeg);base64,/);
  const conversation = await finishConversation(page, {
    firstReply: "点击水卡片后页面没有反应，截图标出了我点击的位置。",
  });

  const consent = page.getByRole("checkbox", { name: /GitHub/i });
  await consent.check();
  const upload = page.getByRole("button", {
    name: "确认并上传",
    exact: true,
  });
  await expect(upload).toBeEnabled();
  expect(payloads).toHaveLength(0);

  await page.evaluate(() => {
    const prototype = HTMLCanvasElement.prototype;
    const original = Object.getOwnPropertyDescriptor(prototype, "getContext");
    Object.defineProperty(window, "__feedbackOriginalGetContext", {
      configurable: true,
      value: original,
    });
    Object.defineProperty(prototype, "getContext", {
      configurable: true,
      value: () => null,
    });
  });
  await page.getByRole("button", { name: "重新框选", exact: true }).click();
  const captureFailure = page.locator(".feedback-inline-message");
  await expect(captureFailure).toContainText(
    /无法创建页面截图.*上一张截图已保留.*重新确认公开提交/,
  );
  await page.evaluate(() => {
    const original = Object.getOwnPropertyDescriptor(
      window,
      "__feedbackOriginalGetContext",
    )?.value as PropertyDescriptor | undefined;
    if (original) {
      Object.defineProperty(
        HTMLCanvasElement.prototype,
        "getContext",
        original,
      );
    }
  });

  await expect(log.locator(".feedback-message").first()).toHaveClass(
    /feedback-message--image/,
  );
  await expect(screenshot).toHaveAttribute("src", originalSource!);
  await expect(consent).not.toBeChecked();
  await expect(upload).toBeDisabled();
  expect(payloads).toHaveLength(0);

  await consent.check();
  await upload.click();
  await expect.poll(() => payloads.length).toBe(1);
  expect(payloads[0].screenshot).toBe(originalSource);
  expectValidPayload(payloads[0], { type: "bug", conversation });
  await expectReceipt(page, 41);
});

test("a saved screenshot and chat draft survive closing, navigating, and reopening", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page, "/#/element/h/substance/water");
  await openCapture(page);
  await page.getByRole("button", { name: "截取整页", exact: true }).click();
  await expect(page.getByRole("img", { name: "反馈截图" })).toBeVisible();
  const log = page.getByRole("log");
  const assistantQuestions = log.locator(
    ".feedback-message--assistant:not(:has(.feedback-chat-summary))",
  );
  await expect(assistantQuestions.first()).toBeVisible();
  const firstQuestion = (
    await assistantQuestions.first().locator("p").innerText()
  ).trim();
  const firstReply = "点击水卡片后页面没有反应，截图标出了我点击的位置。";
  const firstQuestionCount = await assistantQuestions.count();
  await sendFeedbackReply(page, firstReply);
  await expect
    .poll(() => assistantQuestions.count())
    .toBeGreaterThan(firstQuestionCount);
  await expect(feedbackComposer(page)).toHaveValue("");
  const secondQuestion = (
    await assistantQuestions.last().locator("p").innerText()
  ).trim();
  const secondReply = realisticReply(secondQuestion, 0);
  const secondQuestionCount = await assistantQuestions.count();
  await sendFeedbackReply(page, secondReply);
  await expect
    .poll(() => assistantQuestions.count())
    .toBeGreaterThan(secondQuestionCount);
  await expect(feedbackComposer(page)).toHaveValue("");
  await page.getByRole("button", { name: "关闭反馈窗口", exact: true }).click();
  await page
    .getByRole("button", { name: "元素之间，回到周期表", exact: true })
    .click();
  await expect(page.locator(".table-page")).toBeVisible();
  await page.getByRole("button", { name: "反馈", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(
    page.getByRole("log").locator(".feedback-message").first(),
  ).toHaveClass(/feedback-message--image/);
  await expect(
    page
      .getByRole("log")
      .locator(".feedback-chat-turn .feedback-message--user")
      .nth(0),
  ).toContainText(firstReply);
  await expect(
    page
      .getByRole("log")
      .locator(".feedback-chat-turn .feedback-message--user")
      .nth(1),
  ).toContainText(secondReply);
  const conversation = await finishConversation(page, {
    firstReply,
    answered: {
      questions: [firstQuestion, secondQuestion],
      replies: [firstReply, secondReply],
    },
  });
  expect(payloads).toHaveLength(0);
  await consentAndSubmit(page);
  await expect.poll(() => payloads.length).toBe(1);
  expect(payloads[0].page.url).toContain("#/element/h/substance/water");
  expect(payloads[0].screenshot).toMatch(/^data:image\/(png|jpeg);base64,/);
  expectValidPayload(payloads[0], { type: "bug", conversation });
});

test("an unconfigured receiver clearly says nothing was submitted and retains an editable draft", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page, () => ({
    status: 503,
    body: {
      error: "feedback_unavailable",
      message: "匿名反馈服务尚未配置，请稍后重试。",
    },
  }));
  await openApp(page);
  const conversation = await prepareReview(page, {
    description: "我有改进建议：希望为这个页面增加一种更清晰的显示方式。",
  });
  await consentAndSubmit(page);
  await expect(
    page.getByRole("heading", { name: "反馈服务尚未就绪", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "修改上一条", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "查看 GitHub 反馈", exact: true }),
  ).toHaveCount(0);
  expectValidPayload(payloads[0], { type: "suggestion", conversation });
  await expect(
    page.getByRole("dialog", { name: "聊聊这个问题" }),
  ).toBeVisible();
  await expect(page.locator(".feedback-chat-summary")).toBeVisible();
  expect(payloads).toHaveLength(1);
});

test("the feedback conversation has accessible controls and readable contrast", async ({
  page,
}) => {
  await interceptFeedback(page);
  await openApp(page);
  await openTextOnlyChat(page);
  const result = await new AxeBuilder({ page })
    .include(".feedback-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("the selected screenshot flies into a compact titleless composer with neutral focus", async ({
  page,
}) => {
  const payloads = await interceptFeedback(page);
  await openApp(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openCapture(page);
  const frame = (await page
    .locator('svg[aria-label="截图区域选择"]')
    .boundingBox())!;
  await page.mouse.move(frame.x + 170, frame.y + 210);
  await page.mouse.down();
  await page.mouse.move(frame.x + 490, frame.y + 450, { steps: 8 });
  await page.mouse.up();
  await page.getByRole("button", { name: "完成截图", exact: true }).click();
  await expect(page.locator(".feedback-capture-flight")).toBeVisible();
  const dialog = page.getByRole("dialog", {
    name: "聊聊这个问题",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(430);
  expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(480);
  await expect(page.locator(".feedback-capture-flight")).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "反馈截图", exact: true }),
  ).toBeVisible();
  const title = dialog.locator("h2");
  expect(
    await title.evaluate((n) => n.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(1);
  const composer = feedbackComposer(page);
  await composer.click();
  expect(await composer.evaluate((n) => getComputedStyle(n).outlineStyle)).toBe(
    "none",
  );
  expect(await composer.evaluate((n) => getComputedStyle(n).boxShadow)).toBe(
    "none",
  );
  await composer.fill("保留这条还没发送的描述");
  await page.getByRole("button", { name: "重新框选", exact: true }).click();
  await expect(page.locator(".feedback-capture-flight")).toHaveCount(0);
  await page.getByRole("button", { name: "截取整页", exact: true }).click();
  await expect(composer).toHaveValue("保留这条还没发送的描述");
  expect(payloads).toHaveLength(0);
});

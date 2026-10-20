import { test, expect } from "@playwright/test";
import {
  getKnowledgePack,
  elementKnowledge,
} from "../../src/data/element-knowledge";
import { elementById } from "../../src/data/catalog";
import { knowledgeStickerByCardId } from "../../src/data/knowledge-stickers";

// Ordinary navigation is independent of the first-visit tour covered in its own spec.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
  });
});

test("the 25 story dots stay attached to moving key faces on hover, press, and keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await page.waitForTimeout(300);
  await expect(page.locator(".key-face > .story-dot")).toHaveCount(25);
  const face = page.locator("#key-na .key-face");
  const sample = () =>
    face.evaluate((node) => {
      const face = node.getBoundingClientRect(),
        dot = node.querySelector(".story-dot")!.getBoundingClientRect();
      return { x: dot.x - face.x, y: dot.y - face.y, faceY: face.y };
    });
  const initial = await sample();
  await page.locator("#key-na").hover();
  await page.waitForTimeout(260);
  const hover = await sample();
  expect(hover.faceY).toBeLessThan(initial.faceY - 1);
  for (const axis of ["x", "y"] as const)
    expect(Math.abs(hover[axis] - initial[axis])).toBeLessThan(0.2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  const press = await sample();
  expect(press.faceY).toBeGreaterThan(hover.faceY + 1);
  for (const axis of ["x", "y"] as const)
    expect(Math.abs(press[axis] - initial[axis])).toBeLessThan(0.2);
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await page.keyboard.press("Tab");
  await page.locator("#key-na").focus();
  await page.waitForTimeout(250);
  const focus = await sample();
  for (const axis of ["x", "y"] as const)
    expect(Math.abs(focus[axis] - initial[axis])).toBeLessThan(0.2);
});

test("all 25 map routes show their own content and reveal only junior cards in junior mode", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const { elementId } of elementKnowledge.maps) {
    const pack = getKnowledgePack(elementId)!,
      element = elementById[elementId];
    await page.goto(`/#/element/${elementId}`);
    await page.getByRole("button", { name: "高中版", exact: true }).click();
    await expect(page.locator(".knowledge-map h1")).toHaveText(
      `${element.name}元素知识导图`,
    );
    await expect(page.locator(".km-core-key .element-symbol")).toHaveText(
      element.symbol,
    );
    await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
      pack.cards.length,
    );
    expect(await page.locator("img:not([src]),img[src='']").count()).toBe(0);
    const boxes = await page
      .locator('.km-card[data-active="true"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { id: node.id, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        }),
      );
    // Large text may need taller cards; validate the usable geometry directly.
    const stage = (await page.locator(".km-stage").boundingBox())!;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      expect(box.left, `${elementId}/${box.id} fits left edge`).toBeGreaterThanOrEqual(stage.x - 1);
      expect(box.right, `${elementId}/${box.id} fits right edge`).toBeLessThanOrEqual(stage.x + stage.width + 1);
      expect(box.top, `${elementId}/${box.id} fits top edge`).toBeGreaterThanOrEqual(stage.y - 1);
      expect(box.bottom, `${elementId}/${box.id} fits bottom edge`).toBeLessThanOrEqual(stage.y + stage.height + 1);
      for (const other of boxes.slice(i + 1)) {
        const overlapX = Math.min(box.right, other.right) - Math.max(box.left, other.left);
        const overlapY = Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
        expect(overlapX > 1 && overlapY > 1, `${elementId}: ${box.id} and ${other.id} do not overlap`).toBe(false);
      }
    }
    const artwork = await page
      .locator('.km-card[data-active="true"]')
      .evaluateAll((cards) =>
        cards.map((card) => {
          const image = card.querySelector<HTMLImageElement>(".km-sticker img");
          return {
            cardId: card.id.replace(/^km-card-/, ""),
            src: image?.getAttribute("src") ?? null,
          };
        }),
      );
    expect(artwork).toHaveLength(pack.cards.length);
    expect(artwork.sort((a, b) => a.cardId.localeCompare(b.cardId))).toEqual(
      pack.cards
        .map((card) => ({
          cardId: card.id,
          src: knowledgeStickerByCardId[card.id],
        }))
        .sort((a, b) => a.cardId.localeCompare(b.cardId)),
    );
    for (const { cardId, src } of artwork) {
      expect(src, `${elementId} / ${cardId} sticker URL`).toMatch(
        new RegExp(`/stickers/knowledge-20261017/${cardId}\\.webp$`),
      );
    }
    const decoded = await page
      .locator('.km-card[data-active="true"] .km-sticker img')
      .evaluateAll((images) =>
        Promise.all(
          images.map(async (node) => {
            try {
              const image = node as HTMLImageElement;
              await image.decode();
              return image.naturalWidth > 0 && image.naturalHeight > 0;
            } catch {
              return false;
            }
          }),
        ),
      );
    expect(decoded).toHaveLength(pack.cards.length);
    expect(decoded.every(Boolean)).toBe(true);
    await page.getByRole("button", { name: "初中版", exact: true }).click();
    await expect(page.locator('.km-card[data-active="true"]')).toHaveCount(
      pack.cards.filter((card) => card.level === "junior").length,
    );
    await expect(
      page.locator(
        '.km-card[data-active="true"][data-level="senior"],.km-card[data-active="true"][data-level="extension"]',
      ),
    ).toHaveCount(0);
  }
});

test("new element keys navigate to atom views in this page and preserve their own collapsed branches", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#key-na").click();
  await expect(page).toHaveURL(/#\/element\/na$/);
  const branch = page.locator(".km-branch[data-active='true']").first();
  const id = await branch.getAttribute("id");
  await branch.click();
  await expect(branch).toHaveAttribute("aria-expanded", "false");
  const count = page.context().pages().length;
  await page.locator(".km-core-key").click();
  await expect(page).toHaveURL(/#\/element\/na\/atom$/);
  await expect(page.locator(".large .element-symbol")).toHaveText("Na");
  expect(page.context().pages().length).toBe(count);
  await page.getByRole("button", { name: "返回思维导图", exact: true }).click();
  await expect(page.locator(`#${id}`)).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator(".km-core-key")).toBeFocused();
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await page.locator("#key-o").click();
  await expect(page.locator('.km-branch[aria-expanded="false"]')).toHaveCount(
    0,
  );
});

test("a high school card exposes its volume and a single working source control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/element/c");
  const card = getKnowledgePack("c")!.cards.find(
    (card) => card.curriculum?.stage === "selective",
  )!;
  const expectedSticker = knowledgeStickerByCardId[card.id];
  const previewSticker = page.locator(`#km-card-${card.id} .km-sticker img`);
  await expect(previewSticker).toHaveAttribute("src", expectedSticker);
  await page.locator(`#km-card-${card.id} .km-card-open`).click();
  const dialog = page.locator(".km-card-dialog");
  const detailSticker = dialog.locator(".km-sticker img");
  await expect(dialog.locator("img")).toHaveCount(1);
  await expect(detailSticker).toHaveAttribute("src", expectedSticker);
  await expect(detailSticker).toHaveAttribute(
    "src",
    (await previewSticker.getAttribute("src"))!,
  );
  await expect(dialog.locator(".km-dialog-top > span")).toHaveText(
    card.curriculum!.volume,
  );
  await expect(dialog.locator(".km-source-trigger")).toHaveCount(1);
  await dialog.locator(".km-source-trigger").click();
  await expect(dialog.locator(".km-source-panel a").first()).toHaveAttribute(
    "href",
    /^https:\/\//,
  );
});

test("a hidden high school branch returns dialog focus to the center when switching to junior", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/element/c");
  await page.locator("#km-card-c-esterification .km-card-open").click();
  await expect(page.locator(".km-card-dialog")).toBeVisible();
  // An open modal makes the header inert; change mode as an external state update.
  await page
    .getByRole("button", { name: "初中版", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.locator(".km-card-dialog")).toHaveCount(0);
  await expect(page.locator(".km-core-key")).toBeFocused();
});

test("the expanded carbon map remains readable and clickable on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/element/c");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  const card = page.locator("#km-card-c-ester-hydrolysis .km-card-open");
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page.locator(".km-card-dialog h2")).toHaveText("乙酸乙酯的水解");
  await page.getByRole("button", { name: "收起知识卡", exact: true }).click();
  await expect(card).toBeFocused();
});

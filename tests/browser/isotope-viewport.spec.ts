import { expect, test, type Locator, type Page } from "@playwright/test";
import { isotopeById, isotopesByElement } from "../../src/data/isotopes";

async function openIsotopeMode(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
}

async function findBlankEdgePoint(viewport: Locator, edge: "right" | "bottom") {
  const point = await viewport.evaluate((node, direction) => {
    const bounds = node.getBoundingClientRect();
    const interactive =
      "[data-isotope], .isotope-halo__core, .isotope-halo__all";
    const inset = 6;
    if (direction === "right") {
      const x = bounds.right - inset;
      for (let y = bounds.top + inset; y < bounds.bottom - inset; y += 5) {
        const target = document.elementFromPoint(x, y);
        if (target && node.contains(target) && !target.closest(interactive))
          return { x, y };
      }
    } else {
      const y = bounds.bottom - inset;
      for (let x = bounds.left + inset; x < bounds.right - inset; x += 5) {
        const target = document.elementFromPoint(x, y);
        if (target && node.contains(target) && !target.closest(interactive))
          return { x, y };
      }
    }
    return null;
  }, edge);
  expect(
    point,
    `a blank ${edge} edge should be available for panning`,
  ).not.toBeNull();
  return point!;
}

async function findBlankViewportPoint(viewport: Locator) {
  const point = await viewport.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const interactive = "[data-isotope], .isotope-halo__core";
    for (let y = bounds.top + 100; y < bounds.bottom - 100; y += 8) {
      for (let x = bounds.left + 48; x < bounds.right - 48; x += 8) {
        const target = document.elementFromPoint(x, y);
        if (target && node.contains(target) && !target.closest(interactive))
          return { x, y };
      }
    }
    return null;
  });
  expect(
    point,
    "a blank point should be available for touch scrolling",
  ).not.toBeNull();
  return point!;
}

test("Fe isotope window keeps every nuclide reachable while edge-panning and scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openIsotopeMode(page);
  await page.locator("#key-fe").hover();

  const halo = page.locator("[data-isotope-halo]");
  const viewport = halo.locator(".isotope-viewport");
  await expect(halo).toBeVisible();
  await expect(
    halo.getByRole("button", { name: "关闭同位素菜单" }),
  ).toHaveCount(0);
  await expect(viewport).toBeVisible();
  const records = isotopesByElement.fe;
  expect(records).toHaveLength(32);
  await expect(halo.locator("[data-isotope]")).toHaveCount(records.length);

  const initial = await viewport.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
    const cards = [...node.querySelectorAll<HTMLElement>("[data-isotope]")].map(
      (card) => {
        const rect = card.getBoundingClientRect();
        return {
          id: card.dataset.isotope!,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          distance: Math.hypot(
            rect.left + rect.width / 2 - center.x,
            rect.top + rect.height / 2 - center.y,
          ),
        };
      },
    );
    const offscreen = cards
      .filter(
        (card) =>
          card.right <= bounds.left ||
          card.left >= bounds.right ||
          card.bottom <= bounds.top ||
          card.top >= bounds.bottom,
      )
      .sort((a, b) => b.distance - a.distance);
    return {
      scrollLeft: node.scrollLeft,
      scrollTop: node.scrollTop,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
      offscreenCount: offscreen.length,
      farId: offscreen[0]?.id ?? null,
    };
  });
  expect(
    initial.scrollWidth > initial.clientWidth ||
      initial.scrollHeight > initial.clientHeight,
  ).toBe(true);
  expect(initial.offscreenCount).toBeGreaterThan(0);
  expect(initial.farId).not.toBeNull();

  const edge = initial.scrollWidth > initial.clientWidth ? "right" : "bottom";
  const point = await findBlankEdgePoint(viewport, edge);
  await page.mouse.move(point.x, point.y);
  const beforePan = await viewport.evaluate((node) => ({
    left: node.scrollLeft,
    top: node.scrollTop,
  }));
  await expect
    .poll(async () => {
      const offset = await viewport.evaluate((node) => ({
        left: node.scrollLeft,
        top: node.scrollTop,
      }));
      return edge === "right" ? offset.left : offset.top;
    })
    .toBeGreaterThan(edge === "right" ? beforePan.left : beforePan.top);

  await page.mouse.move(5, 5);
  await expect(halo).toBeVisible();
  const stoppedAt = await viewport.evaluate((node) => ({
    left: node.scrollLeft,
    top: node.scrollTop,
  }));
  await page.waitForTimeout(180);
  expect(
    await viewport.evaluate((node) => ({
      left: node.scrollLeft,
      top: node.scrollTop,
    })),
  ).toEqual(stoppedAt);

  const farId = initial.farId!;
  await viewport.evaluate((node, id) => {
    const card = node.querySelector<HTMLElement>(`[data-isotope="${id}"]`)!;
    const clip = node.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    node.scrollLeft +=
      rect.left + rect.width / 2 - (clip.left + node.clientWidth / 2);
    node.scrollTop +=
      rect.top + rect.height / 2 - (clip.top + node.clientHeight / 2);
  }, farId);
  const farCard = halo.locator(`[data-isotope="${farId}"]`);
  expect(
    await farCard.evaluate((card) => {
      const rect = card.getBoundingClientRect();
      const clip = card.closest(".isotope-viewport")!.getBoundingClientRect();
      return (
        rect.left >= clip.left &&
        rect.right <= clip.right &&
        rect.top >= clip.top &&
        rect.bottom <= clip.bottom
      );
    }),
  ).toBe(true);
  await farCard.click();
  const dialog = page.locator("dialog.isotope-library");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#isotope-title")).toContainText(
    isotopeById[farId].name,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(farCard).toBeFocused();

  await viewport.evaluate((node) => {
    node.scrollLeft = 0;
    node.scrollTop = 0;
  });
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.wheel(0, 520);
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
  await expect(halo).toBeVisible();

  await page.mouse.click(5, 5);
  await expect(halo).toHaveCount(0);
});

test("reduced motion keeps native keyboard and touch scrolling without edge autopan", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openIsotopeMode(page);
  const key = page.locator("#key-fe");
  await key.focus();
  await page.keyboard.press("Space");

  const halo = page.locator("[data-isotope-halo]");
  const viewport = halo.locator(".isotope-viewport");
  await expect(viewport).toBeVisible();
  await expect(halo.locator("[data-isotope]")).toHaveCount(
    isotopesByElement.fe.length,
  );

  const before = await viewport.evaluate((node) => ({
    left: node.scrollLeft,
    top: node.scrollTop,
    maxLeft: node.scrollWidth - node.clientWidth,
    maxTop: node.scrollHeight - node.clientHeight,
  }));
  const edge = before.maxLeft > 0 ? "right" : "bottom";
  const point = await findBlankEdgePoint(viewport, edge);
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(300);
  expect(
    await viewport.evaluate((node) => ({
      left: node.scrollLeft,
      top: node.scrollTop,
    })),
  ).toEqual({ left: before.left, top: before.top });

  await viewport.focus();
  const horizontal = before.maxLeft > 0;
  const keyName = horizontal
    ? before.maxLeft - before.left >= before.left
      ? "ArrowRight"
      : "ArrowLeft"
    : before.maxTop - before.top >= before.top
      ? "ArrowDown"
      : "ArrowUp";
  const keyboardStart = horizontal ? before.left : before.top;
  await page.keyboard.press(keyName);
  await expect
    .poll(() =>
      viewport.evaluate(
        (node, axis) => (axis === "x" ? node.scrollLeft : node.scrollTop),
        horizontal ? "x" : "y",
      ),
    )
    .not.toBe(keyboardStart);

  const touchStart = await viewport.evaluate((node) => {
    node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2;
    node.scrollTop = (node.scrollHeight - node.clientHeight) / 2;
    return { left: node.scrollLeft, top: node.scrollTop };
  });
  const touchPoint = await findBlankViewportPoint(viewport);
  const touch = await page.context().newCDPSession(page);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: Math.round(touchPoint.x), y: Math.round(touchPoint.y + 55) },
    ],
  });
  for (const step of [35, 10, -15, -40, -65]) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          id: 1,
          x: Math.round(touchPoint.x),
          y: Math.round(touchPoint.y + step),
        },
      ],
    });
  }
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      viewport.evaluate((node) => ({
        left: node.scrollLeft,
        top: node.scrollTop,
      })),
    )
    .not.toEqual(touchStart);
  await touch.detach();
  await expect(halo).toBeVisible();
  await context.close();
});

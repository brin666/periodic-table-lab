import { test, expect, type Page } from "@playwright/test";

const surroundingContent = [
  ".site-header",
  ".board-toolbar",
  ".mobile-scroll-hint",
  ".category-legend",
  ".axis-caption",
  ".group-number",
  ".period-number",
  ".series-placeholder",
  ".series-label",
].join(", ");

async function extendEntranceTimer(page: Page) {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: any[]
    ) =>
      nativeSetTimeout(
        handler,
        timeout === 7200 ? 60000 : timeout,
        ...args,
      )) as typeof window.setTimeout;
  });
}

async function seekHydrogenAnimations(page: Page, currentTime: number) {
  await expect(page.locator(".element-grid")).toHaveAttribute("data-entrance-prepared", "true");
  return page.evaluate((time) => {
    const animations = document
      .getAnimations()
      .filter((animation) => animation.id.startsWith("hydrogen-"));
    for (const animation of animations) animation.pause();
    for (const animation of animations) animation.currentTime = time;
    return animations.length;
  }, currentTime);
}

async function revealedKeyCount(page: Page) {
  return page
    .locator(".key-arrival")
    .evaluateAll(
      (nodes) =>
        nodes.filter((node) => Number(getComputedStyle(node).opacity) > 0.5)
          .length,
    );
}

async function surroundingContentIs(
  page: Page,
  expected: "hidden" | "visible",
) {
  return page.locator(surroundingContent).evaluateAll(
    (nodes, expectation) =>
      nodes.length > 0 &&
      nodes.every((node) => {
        const style = getComputedStyle(node);
        if (expectation === "visible" && style.display === "none") return true;
        const hidden =
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) <= 0.05;
        return expectation === "hidden"
          ? hidden
          : !hidden && Number(style.opacity) > 0.5;
      }),
    expected,
  );
}

async function keyHeight(page: Page, selector: string) {
  return page.locator(selector).evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m43;
  });
}

test("the H entrance finishes cleanly and returns to the real 118-key table", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "true",
  );
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
  await expect(page.locator(".hydrogen-entrance")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".element-key")).toHaveCount(118);
  await expect(page.locator("[data-element='h']")).toHaveCount(1);
  await expect(page.locator("#key-h")).toHaveCount(1);

  await expect(page.locator(".hydrogen-entrance")).toHaveCount(0, {
    timeout: 9000,
  });
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  await expect(page.locator(".element-key")).toHaveCount(118);
  expect(await revealedKeyCount(page)).toBe(118);
  expect(await surroundingContentIs(page, "visible")).toBe(true);
  await expect(page.locator(".home-workbench")).toHaveJSProperty("inert", false);
  await expect(page.locator(".board-toolbar")).toHaveJSProperty("inert", false);
  await page.locator(".compound-workbench__drop-prompt").focus();
  await expect(page.locator(".compound-workbench__drop-prompt")).toBeFocused();

  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(0);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  expect(await revealedKeyCount(page)).toBe(118);
  expect(errors).toEqual([]);
});

test("the hydrogen WAAPI timeline presses H and sends simultaneous crests and troughs through real keys", async ({
  page,
}) => {
  await extendEntranceTimer(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
  await expect(page.locator(".element-key")).toHaveCount(118);
  await expect(page.locator(".entrance-key-shadow")).toHaveCount(118);
  await expect(page.locator(".entrance-key-light")).toHaveCount(118);
  await page.waitForFunction(() => {
    const animations = document
      .getAnimations()
      .filter((animation) => animation.id.startsWith("hydrogen-"));
    return (
      document.querySelector<HTMLElement>(".element-grid")?.dataset.entrancePrepared === "true" &&
      animations.length > 0 &&
      animations.every((animation) => animation.startTime !== null)
    );
  });

  const timeline = await page.evaluate(() => {
    const allAnimations = document.getAnimations();
    const animations = allAnimations.filter((animation) =>
      animation.id.startsWith("hydrogen-"),
    );
    const durations = animations.map(
      (animation) => animation.effect?.getTiming().duration,
    );
    const startTimes = animations.map((animation) => animation.startTime);
    const ids = animations.map((animation) => animation.id);
    for (const animation of animations) animation.pause();
    for (const animation of animations) animation.currentTime = 0;
    return {
      ids,
      durations,
      startTimes,
      allIds: allAnimations.map((a) => a.id),
    };
  });
  expect(timeline.ids.length).toBeGreaterThan(350);
  expect(timeline.ids.every((id) => id.startsWith("hydrogen-"))).toBe(true);
  expect(new Set(timeline.ids).size).toBe(timeline.ids.length);
  expect(timeline.allIds).toHaveLength(timeline.ids.length);
  expect(timeline.durations.every((duration) => duration === 7200)).toBe(true);
  expect(
    Math.max(...(timeline.startTimes as number[])) -
      Math.min(...(timeline.startTimes as number[])),
  ).toBeLessThan(1);
  expect(await revealedKeyCount(page)).toBe(0);
  expect(await surroundingContentIs(page, "hidden")).toBe(true);

  await seekHydrogenAnimations(page, 1100);
  expect(await keyHeight(page, "#key-h .key-arrival")).toBeCloseTo(0, 1);
  await expect(page.locator("#key-h .key-arrival")).toHaveCSS("opacity", "1");
  expect(await revealedKeyCount(page)).toBe(1);

  await seekHydrogenAnimations(page, 1480);
  expect(await keyHeight(page, "#key-h .key-arrival")).toBeCloseTo(-8, 0);
  await seekHydrogenAnimations(page, 1610);
  expect(await keyHeight(page, "#key-h .key-arrival")).toBeCloseTo(3, 0);

  await seekHydrogenAnimations(page, 3100);
  const waveHeights = await page
    .locator(".element-key:not(#key-h) .key-arrival")
    .evaluateAll((nodes) =>
      nodes.map(
        (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43,
      ),
    );
  expect(Math.max(...waveHeights)).toBeGreaterThan(1);
  expect(Math.min(...waveHeights)).toBeLessThan(-1);

  await seekHydrogenAnimations(page, 6000);
  expect(await revealedKeyCount(page)).toBe(118);
  expect(await surroundingContentIs(page, "hidden")).toBe(true);

  await seekHydrogenAnimations(page, 6250);
  expect(await surroundingContentIs(page, "hidden")).toBe(true);
  await seekHydrogenAnimations(page, 6500);
  const settledHeights = await page
    .locator(".key-arrival")
    .evaluateAll((nodes) =>
      nodes.map(
        (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m43,
      ),
    );
  expect(Math.max(...settledHeights.map(Math.abs))).toBeLessThan(0.1);
  const headerOpacity = await page
    .locator(".site-header")
    .evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(headerOpacity).toBeGreaterThan(0);
  expect(headerOpacity).toBeLessThan(1);
  expect(await surroundingContentIs(page, "visible")).toBe(false);
  await seekHydrogenAnimations(page, 7100);
  expect(await revealedKeyCount(page)).toBe(118);
  expect(await surroundingContentIs(page, "visible")).toBe(true);
});

for (const input of ["pointer", "keyboard", "wheel", "touchmove"] as const) {
  test(`${input} immediately finishes the H entrance without opening a hidden key`, async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
    const tableUrl = page.url();
    if (input === "pointer") {
      const box = (await page.locator("#key-h").boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(page).toHaveURL(tableUrl);
    } else if (input === "keyboard") await page.keyboard.press("Tab");
    else if (input === "wheel") await page.mouse.wheel(0, 20);
    else
      await page.evaluate(() => window.dispatchEvent(new Event("touchmove")));

    await expect(page.locator(".hydrogen-entrance")).toHaveCount(0, {
      timeout: 800,
    });
    await expect(page.locator(".table-page")).toHaveAttribute(
      "data-enter",
      "false",
    );
    expect(await revealedKeyCount(page)).toBe(118);
    await page.locator("#key-h").click();
    await expect(page).toHaveURL(/#\/element\/h$/);
  });
}

for (const key of ["Enter", "Space"] as const) {
  test(`the first focused H ${key} press only ends the entrance`, async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
    const tableUrl = page.url();
    const hydrogen = page.locator("#key-h");
    await hydrogen.focus();
    await expect(hydrogen).toBeFocused();

    await page.keyboard.press(key);
    await expect(page).toHaveURL(tableUrl);
    await expect(page.locator(".hydrogen-entrance")).toHaveCount(0, {
      timeout: 800,
    });
    await expect(page.locator(".table-page")).toHaveAttribute(
      "data-enter",
      "false",
    );

    await page.keyboard.press(key);
    await expect(page).toHaveURL(/#\/element\/h$/);
  });
}

test("pointercancel releases the skip guard for the next real key click", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
  const tableUrl = page.url();
  await page.evaluate(() => {
    const key = document.querySelector<HTMLButtonElement>("#key-h")!;
    const event = {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
    };
    key.dispatchEvent(new PointerEvent("pointerdown", event));
    key.dispatchEvent(new PointerEvent("pointercancel", event));
  });
  await expect(page).toHaveURL(tableUrl);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );

  const box = (await page.locator("#key-h").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/#\/element\/h$/);
});

test("a mouse drag without a click leaves the next key click usable", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
  const tableUrl = page.url();
  const clickCount = await page.evaluate(() => {
    let clicks = 0;
    const recordClick = () => clicks++;
    window.addEventListener("click", recordClick, true);
    const key = document.querySelector<HTMLButtonElement>("#key-h")!;
    const box = key.getBoundingClientRect();
    const down = {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 2,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
    };
    key.dispatchEvent(new PointerEvent("pointerdown", down));
    key.dispatchEvent(new MouseEvent("mousedown", down));
    const up = { ...down, buttons: 0, clientX: 0, clientY: 0 };
    document.body.dispatchEvent(new PointerEvent("pointerup", up));
    document.body.dispatchEvent(new MouseEvent("mouseup", up));
    window.removeEventListener("click", recordClick, true);
    return clicks;
  });
  expect(clickCount).toBe(0);
  await expect(page).toHaveURL(tableUrl);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );

  const box = (await page.locator("#key-h").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/#\/element\/h$/);
});

test("resizing during the H entrance completes it and leaves the table usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(0, {
    timeout: 1000,
  });
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.locator("#key-h").click();
  await expect(page).toHaveURL(/#\/element\/h$/);
  expect(errors).toEqual([]);
});

test("direct element links return to an immediately usable table", async ({
  page,
}) => {
  await page.goto("/#/element/h");
  await page.getByRole("button", { name: "返回周期表", exact: true }).click();
  await expect(page.locator(".element-key")).toHaveCount(118);
  await expect(page.locator(".hydrogen-entrance")).toHaveCount(0);
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
});

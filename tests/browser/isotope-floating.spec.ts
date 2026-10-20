import { expect, test, type Page } from "@playwright/test";

async function openIsotopeMode(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-element]")).toHaveCount(118);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
}

type ElementInlineStyle = {
  mutedOpacity: string;
  opacity: string;
  mutedMarker: string | null;
};

async function inlineOpacitySnapshot(
  page: Page,
): Promise<Record<string, ElementInlineStyle>> {
  return page.locator("[data-element]").evaluateAll((nodes) =>
    Object.fromEntries(
      nodes.map((node) => {
        const element = node as HTMLElement;
        return [
          element.id,
          {
            mutedOpacity: element.style.getPropertyValue(
              "--isotope-muted-opacity",
            ),
            opacity: element.style.opacity,
            mutedMarker: element.getAttribute("data-isotope-muted"),
          },
        ];
      }),
    ),
  );
}

async function expectUnmutedAndRestored(
  page: Page,
  before: Record<string, ElementInlineStyle>,
) {
  await expect(page.locator('[data-isotope-muted="true"]')).toHaveCount(0);
  expect(await inlineOpacitySnapshot(page)).toEqual(before);
}

async function expectKeyOpacityNear(page: Page, id: string, target: number) {
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(`#key-${id}`)
          .evaluate((node) => getComputedStyle(node).opacity),
      ),
    )
    .toBeCloseTo(target, 1);
}

test("hover halo survives pointer exit; outside click closes and restores dimming", async ({
  page,
}) => {
  await openIsotopeMode(page);
  const before = await inlineOpacitySnapshot(page);
  const opacityBefore = await page
    .locator("[data-element]")
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [node.id, getComputedStyle(node).opacity]),
      ),
    );
  const source = page.locator("#key-fe");
  const farKey = page.locator("#key-h");
  const farKeyOpacity = await farKey.evaluate(
    (node) => getComputedStyle(node).opacity,
  );

  await source.hover();
  const halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await expect(
    halo.getByRole("button", { name: "关闭同位素菜单" }),
  ).toHaveCount(0);
  const caption = halo.locator(".isotope-halo__caption");
  expect(
    await caption.evaluate((node) =>
      [...node.childNodes]
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent)
        .join("")
        .trim(),
    ),
  ).toBe("铁的同位素");
  await expect(caption.locator(".sr-only")).toContainText("共 32 种");
  await expect(caption.locator(".sr-only")).not.toContainText("预览");
  await expect(halo.locator(".isotope-halo__note")).toContainText("基态核素");

  const surface = await halo.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      filter: style.filter,
    };
  });
  expect(surface).toEqual({
    backgroundImage: "none",
    backgroundColor: "rgba(0, 0, 0, 0)",
    boxShadow: "none",
    filter: "none",
  });

  const viewport = halo.locator(".isotope-viewport");
  await expect(viewport).toBeVisible();
  const orbit = await halo.evaluate((node) => {
    const viewport = node.querySelector<HTMLElement>(".isotope-viewport")!;
    const bounds = viewport.getBoundingClientRect();
    const minis = [...node.querySelectorAll<HTMLElement>("[data-isotope]")];
    const clipped = minis.filter((mini) => {
      const rect = mini.getBoundingClientRect();
      return (
        rect.right <= bounds.left ||
        rect.left >= bounds.right ||
        rect.bottom <= bounds.top ||
        rect.top >= bounds.bottom
      );
    });
    return {
      isotopeCount: minis.length,
      clippedCount: clipped.length,
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      scrollHeight: viewport.scrollHeight,
      clientHeight: viewport.clientHeight,
      isotopeShadow: getComputedStyle(minis[0]!).boxShadow,
    };
  });
  expect(orbit.isotopeCount).toBe(32);
  expect(orbit.clippedCount).toBeGreaterThan(0);
  expect(
    orbit.scrollWidth > orbit.clientWidth ||
      orbit.scrollHeight > orbit.clientHeight,
  ).toBe(true);
  expect(orbit.isotopeShadow).not.toBe("none");

  const nearestKeyId = await source.evaluate((sourceNode) => {
    const sourceBox = sourceNode.getBoundingClientRect();
    const sourceCenter = {
      x: sourceBox.x + sourceBox.width / 2,
      y: sourceBox.y + sourceBox.height / 2,
    };
    return [...document.querySelectorAll<HTMLElement>("[data-element]")]
      .filter((node) => node !== sourceNode)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          id: node.id,
          distance: Math.hypot(
            rect.x + rect.width / 2 - sourceCenter.x,
            rect.y + rect.height / 2 - sourceCenter.y,
          ),
        };
      })
      .sort((a, b) => a.distance - b.distance)[0]!.id;
  });
  const markedKeys = page.locator('[data-isotope-muted="true"]');
  await expect(markedKeys).not.toHaveCount(0);
  await expect(page.locator(`#${nearestKeyId}`)).toHaveAttribute(
    "data-isotope-muted",
    "true",
  );
  const nearestOpacity = await page
    .locator(`#${nearestKeyId}`)
    .evaluate((node) => getComputedStyle(node).opacity);
  expect(Number(nearestOpacity)).toBeLessThan(
    Number(opacityBefore[nearestKeyId]),
  );
  await expect(farKey).not.toHaveAttribute("data-isotope-muted", "true");
  expect(await farKey.evaluate((node) => getComputedStyle(node).opacity)).toBe(
    farKeyOpacity,
  );
  const sourceState = await source.evaluate((node) => {
    const style = getComputedStyle(node);
    const face = node.querySelector(".key-face");
    const faceStyle = face ? getComputedStyle(face) : style;
    return {
      display: style.display,
      visibility: style.visibility,
      opacity: Math.min(Number(style.opacity), Number(faceStyle.opacity)),
    };
  });
  expect(
    sourceState.display === "none" ||
      sourceState.visibility === "hidden" ||
      sourceState.opacity <= 0.05,
  ).toBe(true);

  const gap = await halo.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const buttonRects = [...node.querySelectorAll("button")].map((button) =>
      button.getBoundingClientRect(),
    );
    for (let y = rect.top + 4; y < rect.bottom - 4; y += 6) {
      for (let x = rect.left + 4; x < rect.right - 4; x += 6) {
        if (
          buttonRects.some(
            (box) =>
              x >= box.left &&
              x <= box.right &&
              y >= box.top &&
              y <= box.bottom,
          )
        )
          continue;
        const target = document.elementFromPoint(x, y);
        if (target && node.contains(target) && !target.closest("button"))
          return { x, y };
      }
    }
    return null;
  });
  expect(gap).not.toBeNull();
  await page.mouse.move(gap!.x, gap!.y);
  await page.mouse.click(gap!.x, gap!.y);
  await page.waitForTimeout(350);
  await expect(halo).toBeVisible();

  await page.mouse.move(5, 5);
  await page.waitForTimeout(350);
  await expect(halo).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(halo).toHaveCount(0);
  await expectUnmutedAndRestored(page, before);
});

test("keyboard detail, Escape, toggle, and scroll dismiss the menu and clean up dimming", async ({
  page,
}) => {
  await openIsotopeMode(page);
  const before = await inlineOpacitySnapshot(page);
  const source = page.locator("#key-fe");
  const toggle = page.getByRole("button", { name: "同位素", exact: true });

  await source.focus();
  await page.keyboard.press("Space");
  let halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  const fe56 = halo.locator('[data-isotope="fe-56"]');
  await fe56.click();
  const dialog = page.locator("dialog.isotope-library");
  await expect(dialog).toBeVisible();
  await expect(halo).toBeVisible();
  await expect(dialog.locator("#isotope-title")).toContainText("铁-56");
  await dialog.locator("details summary").click();
  await expect(dialog.locator("details")).toHaveAttribute("open", "");
  await expect(halo).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(halo.locator('[data-isotope="fe-56"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(halo).toHaveCount(0);
  await expect(source).toBeFocused();
  await expectUnmutedAndRestored(page, before);

  await source.hover();
  halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(halo).toHaveCount(0);
  await expectUnmutedAndRestored(page, before);

  await toggle.click();
  await source.hover();
  halo = page.locator("[data-isotope-halo]");
  await expect(halo).toBeVisible();
  await page.mouse.move(5, 5);
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await expect(halo).toHaveCount(0);
  await expectUnmutedAndRestored(page, before);
});

test("rapid Fe-Co keyboard switches keep the old key dimmed and restore both keys", async ({
  page,
}) => {
  await openIsotopeMode(page);
  const before = await inlineOpacitySnapshot(page);
  const feBefore = Number(
    await page
      .locator("#key-fe")
      .evaluate((node) => getComputedStyle(node).opacity),
  );
  const coBefore = Number(
    await page
      .locator("#key-co")
      .evaluate((node) => getComputedStyle(node).opacity),
  );
  const fe = page.locator("#key-fe");
  const co = page.locator("#key-co");
  const halo = page.locator("[data-isotope-halo]");

  await fe.focus();
  await page.keyboard.press("Space");
  await expect(halo).toBeVisible();
  await expect(halo).toHaveAttribute("aria-label", /^铁同位素/);

  await co.focus();
  await page.keyboard.press("Space");
  await expect(halo).toHaveAttribute("aria-label", /^钴同位素/);
  await expect(co).toHaveAttribute("data-isotope-muted", "true");
  await expect(fe).toHaveAttribute("data-isotope-muted", "true");
  await expectKeyOpacityNear(page, "co", 0);
  await expectKeyOpacityNear(page, "fe", 0.16);
  expect(
    Number(await fe.evaluate((node) => getComputedStyle(node).opacity)),
  ).toBeGreaterThan(0);

  await fe.focus();
  await page.keyboard.press("Space");
  await expect(halo).toHaveAttribute("aria-label", /^铁同位素/);
  await expectKeyOpacityNear(page, "fe", 0);
  await expectKeyOpacityNear(page, "co", 0.16);

  await co.focus();
  await page.keyboard.press("Space");
  await expect(halo).toHaveAttribute("aria-label", /^钴同位素/);
  await expectKeyOpacityNear(page, "co", 0);
  await expectKeyOpacityNear(page, "fe", 0.16);

  await page.keyboard.press("Escape");
  await expect(halo).toHaveCount(0);
  await expect(co).toBeFocused();
  await expectUnmutedAndRestored(page, before);
  await expectKeyOpacityNear(page, "fe", feBefore);
  await expectKeyOpacityNear(page, "co", coBefore);
});

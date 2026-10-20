import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";

test("all 118 table keys have uniform size and aligned, uncut text at every breakpoint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [width, height] of [
    [320, 844],
    [390, 844],
    [768, 1000],
    [1280, 900],
    [1440, 900],
    [1680, 1000],
    [1920, 1080],
    [2048, 1118],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const keys = await page.locator("[data-element]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect(),
          face = node.querySelector(".key-face")!.getBoundingClientRect();
        return {
          id: node.getAttribute("data-element"),
          width: box.width,
          height: box.height,
          fields: ["atomic-number", "element-symbol", "element-name"].map(
            (field) => {
              const text = node.querySelector(`.${field}`)!,
                rect = text.getBoundingClientRect(),
                css = getComputedStyle(text);
              const range = document.createRange();
              range.selectNodeContents(text);
              const glyph = range.getBoundingClientRect();
              return {
                field,
                font: css.fontSize,
                weight: css.fontWeight,
                x: rect.x - face.x,
                y: rect.y - face.y,
                inside:
                  glyph.top >= face.top &&
                  glyph.bottom <= face.bottom &&
                  glyph.left >= face.left &&
                  glyph.right <= face.right,
              };
            },
          ),
        };
      }),
    );
    expect(keys).toHaveLength(118);
    // Fractional column rounding can differ by a subpixel, not a different size.
    expect(
      Math.max(...keys.map((k) => k.width)) -
        Math.min(...keys.map((k) => k.width)),
    ).toBeLessThan(0.1);
    expect(new Set(keys.map((k) => k.height)).size).toBe(1);
    // These are one DOM snapshot, not asynchronous UI assertions. Plain
    // assertions keep the full ten-viewport, 118-key matrix inexpensive.
    for (const key of keys) {
      assert.ok(key.width >= 44, `${width}px ${key.id} minimum width`);
      assert.ok(key.height >= 44, `${width}px ${key.id} minimum height`);
      assert.ok(
        Math.abs(key.height / key.width - 1.25) < 0.005,
        `${width}×${height} ${key.id} portrait ratio`,
      );
      for (const [i, field] of key.fields.entries()) {
        const label = `${width}px ${key.id} ${field.field}`;
        assert.equal(field.inside, true, `${label} clipped`);
        assert.equal(field.font, keys[0].fields[i].font, `${label} font`);
        assert.equal(field.weight, keys[0].fields[i].weight, `${label} weight`);
        assert.ok(
          Math.abs(field.x - keys[0].fields[i].x) < 0.1,
          `${label} x alignment`,
        );
        assert.ok(
          Math.abs(field.y - keys[0].fields[i].y) < 0.1,
          `${label} y alignment`,
        );
      }
    }
  }
  await page.locator("#key-la").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/element\/la$/);
  await expect(page.locator(".atom-core .nucleus-symbol")).toHaveText("La");
});

test("fullscreen layouts use the available height while keeping the complete portrait table in view", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [
    [1920, 1080],
    [2048, 1118],
    [2560, 1440],
    [3840, 2160],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("[data-element]")).toHaveCount(118);
    const layout = await page.evaluate(() => {
      const grid = document
        .querySelector(".element-grid")!
        .getBoundingClientRect();
      const legend = document
        .querySelector(".category-legend")!
        .getBoundingClientRect();
      return {
        grid: { width: grid.width, height: grid.height },
        legendBottom: legend.bottom,
        keys: [...document.querySelectorAll("[data-element]")].map((n) => {
          const b = n.getBoundingClientRect();
          return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
        }),
      };
    });
    for (const box of layout.keys) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(height);
    }
    expect(layout.legendBottom).toBeLessThanOrEqual(height);
    if (width === 1920)
      expect(layout.grid.width * layout.grid.height).toBeGreaterThan(1_250_000);
    if (width === 2560) {
      expect(layout.grid.width).toBeGreaterThan(1900);
      expect(layout.grid.height).toBeGreaterThan(1200);
    }
    await expect(page.locator(".series-placeholder")).toHaveCount(2);
  }
});

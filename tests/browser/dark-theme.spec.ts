import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "table", path: "/" },
  { name: "hydrogen-map", path: "/#/element/h" },
  { name: "hydrogen-atom", path: "/#/element/h/atom" },
  { name: "oxygen-map", path: "/#/element/o" },
  { name: "oxygen-atom", path: "/#/element/o/atom" },
  { name: "water", path: "/#/element/h/substance/water" },
  {
    name: "hydrogen-peroxide",
    path: "/#/element/h/substance/hydrogen-peroxide",
  },
] as const;

const axeTags = ["wcag2a", "wcag2aa", "wcag21aa"];

async function expectNoAxeViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

test("graphite theme stays readable and accessible across routes and viewports", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const contrastFailures: string[] = [];

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    for (const route of pages) {
      await page.goto(route.path);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator(".site-header")).toBeVisible();

      const readability = await page.evaluate(() => {
        const parse = (value: string) => {
          const hex = value.trim().match(/^#([\da-f]{6})$/i);
          if (hex) {
            const number = Number.parseInt(hex[1], 16);
            return [number >> 16, (number >> 8) & 255, number & 255];
          }
          const rgb = value.match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
          return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
        };
        const luminance = (color: number[]) => {
          const channels = color.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          return (
            0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
          );
        };
        const contrast = (foreground: string, background: string) => {
          const fg = parse(foreground),
            bg = parse(background);
          if (!fg || !bg) return 0;
          const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };

        const root = getComputedStyle(document.documentElement);
        const surface = root.getPropertyValue("--surface-0").trim();
        const globalPairs = [
          "--text-main",
          "--text-soft",
          "--text-dim",
          "--focus-ring",
        ].map((token) => ({
          token,
          ratio: contrast(root.getPropertyValue(token).trim(), surface),
        }));
        const keyPairs = [
          ...document.querySelectorAll<HTMLElement>(
            ".element-key[data-category]",
          ),
        ].flatMap((key) => {
          const face = key.querySelector<HTMLElement>(".key-face");
          if (!face) return [];
          const background = getComputedStyle(key)
            .getPropertyValue("--mineral-color")
            .trim();
          return [".element-symbol", ".atomic-number", ".element-name"].map(
            (selector) => {
              const label = key.querySelector<HTMLElement>(selector);
              return {
                element: key.dataset.element,
                field: selector,
                foreground: label ? getComputedStyle(label).color : "missing",
                background,
                ratio: label
                  ? contrast(getComputedStyle(label).color, background)
                  : 0,
              };
            },
          );
        });
        return {
          colorScheme: root.colorScheme,
          surface,
          globalPairs,
          keyCount: document.querySelectorAll(".element-key").length,
          keyPairs,
        };
      });

      expect(readability.colorScheme).toBe("dark");
      expect(readability.surface).toBeTruthy();
      for (const pair of readability.globalPairs) {
        if (pair.ratio < 4.5) {
          contrastFailures.push(
            `${route.name} ${pair.token} on graphite: ${pair.ratio.toFixed(3)}`,
          );
        }
      }
      if (route.name === "table") {
        expect(readability.keyCount).toBe(118);
        expect(readability.keyPairs).toHaveLength(118 * 3);
        for (const pair of readability.keyPairs) {
          if (pair.ratio < 4.5) {
            contrastFailures.push(
              `${pair.element} ${pair.field}: ${pair.foreground} on ${pair.background}, ${pair.ratio.toFixed(3)}`,
            );
          }
        }
      }

      if (viewport.name === "desktop" && route.name === "table") {
        await page.keyboard.press("Tab");
        const skipLink = page.getByRole("link", { name: "跳到主要内容" });
        await expect(skipLink).toBeFocused();
        const focus = await skipLink.evaluate((node) => {
          const style = getComputedStyle(node);
          const expected = document.createElement("span");
          expected.style.color = getComputedStyle(document.documentElement)
            .getPropertyValue("--focus-ring")
            .trim();
          document.body.append(expected);
          const expectedColor = getComputedStyle(expected).color;
          expected.remove();
          return {
            width: style.outlineWidth,
            style: style.outlineStyle,
            color: style.outlineColor,
            expectedColor,
          };
        });
        expect(focus.width).toBe("3px");
        expect(focus.style).toBe("solid");
        expect(focus.color).toBe(focus.expectedColor);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${route.name} at ${viewport.name}`).toBeLessThanOrEqual(
        0,
      );
      await expectNoAxeViolations(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `graphite-${viewport.name}-${route.name}.png`,
        ),
        fullPage: true,
      });
    }

    await page.goto("/");
    await page
      .getByRole("button", { name: "资料与说明", exact: false })
      .click();
    await expect(page.locator(".reading-dialog")).toBeVisible();
    await expectNoAxeViolations(page);
    await page.screenshot({
      path: testInfo.outputPath(`graphite-${viewport.name}-sources.png`),
      fullPage: true,
    });
  }
  expect(contrastFailures).toEqual([]);
});

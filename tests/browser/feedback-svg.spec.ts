import { expect, test } from "@playwright/test";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`feedback preserves the map's SVG strokes and transparent interiors (${reducedMotion})`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      localStorage.setItem("element-atlas:knowledge-tour-disabled:v1", "true");
    });
    await page.route("**/api/feedback", (route) => route.abort());
    await page.goto("/#/element/h");
    await expect(
      page.locator('.knowledge-map[data-arriving="false"][data-revealed="2"]'),
    ).toBeVisible();
    await page.getByRole("button", { name: "反馈", exact: true }).hover();
    await page.waitForTimeout(700);
    const points = await page
      .locator('.km-connections path[data-active="true"]')
      .evaluateAll((paths) =>
        paths.flatMap((element) => {
          const path = element as SVGPathElement;
          const matrix = path.getScreenCTM()!;
          const length = path.getTotalLength();
          return [0.15, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85].flatMap((fraction) => {
            const point = path
              .getPointAtLength(length * fraction)
              .matrixTransform(matrix);
            const hit = document.elementFromPoint(point.x, point.y);
            return point.x > 6 &&
              point.y > 6 &&
              point.x < innerWidth - 6 &&
              point.y < innerHeight - 6 &&
              hit &&
              !hit.closest(".km-card, .km-branch, .km-core")
              ? [{ x: point.x, y: point.y }]
              : [];
          });
        }),
      );
    expect(points.length).toBeGreaterThan(20);
    const actual = await page.screenshot();
    await testInfo.attach("map-before-capture", {
      body: actual,
      contentType: "image/png",
    });
    const baseline = `data:image/png;base64,${actual.toString("base64")}`;
    await page.getByRole("button", { name: "反馈", exact: true }).click();
    const image = page.locator(".feedback-capture-frame img");
    await expect(image).toBeVisible();
    const snapshot = (await image.getAttribute("src"))!;
    await testInfo.attach("captured-map", {
      body: Buffer.from(snapshot.split(",")[1], "base64"),
      contentType: snapshot.startsWith("data:image/png")
        ? "image/png"
        : "image/jpeg",
    });
    const difference = await page.evaluate(
      async ({ baseline, snapshot, points }) => {
        const decode = async (src: string) => {
          const image = new Image();
          image.src = src;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = innerWidth;
          canvas.height = innerHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const [before, after] = await Promise.all([
          decode(baseline),
          decode(snapshot),
        ]);
        let count = 0,
          changed = 0,
          darkened = 0;
        for (const point of points) {
          for (let dx = -5; dx <= 5; dx++)
            for (let dy = -5; dy <= 5; dy++) {
              const offset =
                (Math.round(point.y + dy) * innerWidth +
                  Math.round(point.x + dx)) *
                4;
              const error =
                Math.abs(before[offset] - after[offset]) +
                Math.abs(before[offset + 1] - after[offset + 1]) +
                Math.abs(before[offset + 2] - after[offset + 2]);
              if (error > 36) changed++;
              if (
                before[offset] > 15 &&
                before[offset + 1] > 15 &&
                before[offset + 2] > 15 &&
                after[offset] < 10 &&
                after[offset + 1] < 10 &&
                after[offset + 2] < 10
              )
                darkened++;
              count++;
            }
        }
        return {
          samples: count,
          changed: changed / count,
          darkened: darkened / count,
        };
      },
      { baseline, snapshot, points },
    );
    await testInfo.attach("line-pixel-comparison", {
      body: JSON.stringify(difference),
      contentType: "application/json",
    });
    // Compare actual rendered line neighborhoods, including both the stroke and
    // transparent interior. This rejects black fills and disappearing strokes.
    expect(difference.changed).toBeLessThan(0.08);
    expect(difference.darkened).toBeLessThan(0.005);
    await expect(
      page.locator("[data-feedback-capture-svg], [data-feedback-capture-node]"),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "截取整页", exact: true }).click();
    await expect(
      page.getByRole("img", { name: "反馈截图", exact: true }),
    ).toHaveAttribute("src", snapshot);
    await page.getByRole("button", { name: "关闭反馈窗口", exact: true }).click();
    await expect(page.locator(".feedback-dialog")).not.toBeVisible();
    await expect(page.locator(".km-core-key")).toBeVisible();
  });
}

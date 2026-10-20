import { expect, test, type Page } from "@playwright/test";
import {
  discoveryCompoundCount,
  findCompounds,
} from "../../src/data/compound-discovery";
import { nuclideDatasetInfo } from "../../src/data/nuclide-metadata";

async function openHome(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".table-page")).toHaveAttribute(
    "data-enter",
    "false",
  );
}
async function choose(page: Page, slot: number, id: string) {
  const trigger = page.locator(`[data-compound-slot="${slot}"]`);
  if (slot > 0) await expect(trigger).toHaveAccessibleName("选择下一种元素");
  await trigger.click();
  await page.locator(`#key-${id}`).click();
}

test("a lifted key has one moving surface and no stationary base silhouette", async ({
  page,
}) => {
  await openHome(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const key = page.locator("#key-be");
  const before = await key.evaluate((node) => ({
    y: node.querySelector(".key-face")!.getBoundingClientRect().y,
    base: getComputedStyle(node, "::before").content,
  }));
  expect(["none", "normal"]).toContain(before.base);
  await key.hover();
  await expect
    .poll(() =>
      key.evaluate(
        (node) => node.querySelector(".key-face")!.getBoundingClientRect().y,
      ),
    )
    .toBeLessThan(before.y - 2);
  const surface = await key.evaluate((node) => ({
    base: getComputedStyle(node, "::before").content,
    shadow: getComputedStyle(node.querySelector(".key-face")!).boxShadow,
    surfaceCount: node.querySelectorAll(".key-face").length,
  }));
  expect(["none", "normal"]).toContain(surface.base);
  expect(surface.surfaceCount).toBe(1);
  expect(surface.shadow).not.toBe("none");
});

test("isotope data loads on demand while the homepage reports a versioned full range", async ({
  page,
}) => {
  const datasets: string[] = [];
  page.on("request", (request) => {
    if (/\/src\/data\/(?:nuclides|isotopes)\.ts/.test(request.url()))
      datasets.push(request.url());
  });
  await openHome(page);
  expect(datasets).toHaveLength(0);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
  await expect(page.locator(".isotope-toolbar-note")).toContainText(
    `${nuclideDatasetInfo.elementCount} 元素`,
  );
  await expect(page.locator(".isotope-toolbar-note")).toContainText(
    `${nuclideDatasetInfo.includedRecordCount} 基态核素`,
  );
  await page.locator("#key-cs").hover();
  await expect(page.locator("[data-isotope-halo]")).toBeVisible();
  expect(datasets.some((url) => url.includes("/nuclides.ts"))).toBe(true);
});

test("expanded inorganic results retain compact formula cards and sourced explanations", async ({
  page,
}) => {
  await openHome(page);
  expect(discoveryCompoundCount("senior")).toBeGreaterThan(600);
  await choose(page, 0, "k");
  await choose(page, 1, "cl");
  await choose(page, 2, "o");
  const result = page.locator(
    '[data-compound-result="inorganic-potassium-perchlorate"]',
  );
  await expect(result).toHaveText("KClO4");
  await expect(result.locator("img,svg")).toHaveCount(0);
  await result.click();
  const dialog = page.locator("dialog.compound-reference");
  await expect(dialog.locator("h2")).toHaveText("高氯酸钾");
  await expect(dialog.locator("details")).toHaveCount(1);
  await dialog.locator("details summary").click();
  await expect(dialog.locator("details a")).toHaveAttribute(
    "href",
    /pubchem.ncbi.nlm.nih.gov\/compound\/\d+/,
  );
  await page.keyboard.press("Escape");
  await expect(result).toBeFocused();
});

test("organic results are absent while carbonic acid and complex inorganic carbon records remain", async ({
  page,
}) => {
  await openHome(page);
  await choose(page, 0, "c");
  await choose(page, 1, "h");
  await choose(page, 2, "o");
  const ids = await page
    .locator("[data-compound-result]")
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.compoundResult),
    );
  expect(ids).toContain("carbonic-acid");
  for (const organic of [
    "ethanol",
    "glucose",
    "fructose",
    "acetic-acid",
    "methanol",
    "oxalic-acid",
  ])
    expect(ids).not.toContain(organic);
  expect(
    findCompounds(["k", "fe", "c", "n"], "senior").some(
      (compound) => compound.id === "potassium-ferrocyanide",
    ),
  ).toBe(true);
  expect(
    findCompounds(["ca", "c"], "senior").some(
      (compound) => compound.formula === "CaC2",
    ),
  ).toBe(true);
});

test("the full isotope range sits below both toolbar buttons on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openHome(page);
  await page.getByRole("button", { name: "同位素", exact: true }).click();
  const boxes = await page.locator(".board-toolbar").evaluate((node) => ({
    status: node
      .querySelector(".isotope-toolbar-note")!
      .getBoundingClientRect()
      .toJSON(),
    buttons: [...node.querySelectorAll("button")].map((button) =>
      button.getBoundingClientRect().toJSON(),
    ),
  }));
  expect(boxes.status.top).toBeGreaterThanOrEqual(
    Math.max(...boxes.buttons.map((box) => box.bottom)) + 4,
  );
  expect(boxes.status.left).toBeGreaterThanOrEqual(0);
  expect(boxes.status.right).toBeLessThanOrEqual(320);
});

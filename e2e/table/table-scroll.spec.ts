import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3003").replace(/\/+$/, "");
const url = `${base}/movers/texas/austin/`;

async function expectNoSidewaysData(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const overflow = await page.locator("#zips .dt-adaptive").evaluateAll(nodes => nodes.flatMap(root => Array.from(root.querySelectorAll<HTMLElement>(".dt-records, .dt-record-grid, .dt-record, .dt-record-fields, dd")).filter(node => {
    const bounds = node.getBoundingClientRect();
    return bounds.width > 1 && bounds.height > 1 && node.scrollWidth > node.clientWidth + 1;
  }).map(node => ({ element: node.className || node.tagName, excess: node.scrollWidth - node.clientWidth }))));
  expect(overflow).toEqual([]);
}

test("wide reference data fits phones, tablets and desktops without clipping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect((await page.goto(url))?.status()).toBe(200);
    const list = page.locator("#zips [data-record-list]");
    await expect(list).toBeVisible();
    const count = Number(await list.getAttribute("data-record-count"));
    expect(count).toBeGreaterThan(4);
    await expect(list.locator("[data-record-key]")).toHaveCount(count);
    const values = await list.locator("[data-col-index]").allTextContents();
    expect(values.every(value => value.trim().length > 0)).toBe(true);
    await expectNoSidewaysData(page);
    const first = list.locator("[data-record-key]").first();
    await first.locator(":scope > details > summary").click();
    const expanded = await first.evaluate(node => ({ record: node.getBoundingClientRect().width, row: node.parentElement!.getBoundingClientRect().width }));
    expect(Math.abs(expanded.record - expanded.row)).toBeLessThanOrEqual(1);
    await expectNoSidewaysData(page);
    await first.locator(":scope > details > summary").click();
    await list.locator(":scope > details > summary").click();
    const last = list.locator("[data-record-key]").last();
    await last.locator(":scope > details > summary").click();
    await expect(last.locator("[data-col-index]").last()).toBeVisible();
    expect(await list.locator("[data-col-index]").allTextContents()).toEqual(values);
    await expectNoSidewaysData(page);
    const results = await new AxeBuilder({ page }).include("#zips").analyze();
    expect(results.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([]);
  }
});

test("sorting includes the collapsed records before choosing the first four previews", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(url))?.status()).toBe(200);
  const list = page.locator("#zips [data-record-list]");
  const zips = (await list.locator('[data-col-index="0"]').allTextContents()).map(value => value.trim());
  expect(zips.length).toBeGreaterThan(4);
  const sort = page.locator("#zips [data-adaptive-sort]");
  await sort.locator(":scope > summary").click();
  const descending = await sort.locator("button[data-sort-choice]").evaluateAll(options => options.find(option => option.querySelector("span")?.textContent === "ZIP code" && option.getAttribute("data-sort-choice")?.endsWith(":descending"))?.getAttribute("data-sort-choice"));
  expect(descending).toBeTruthy();
  await sort.locator(`[data-sort-choice="${descending}"]`).click();
  await expect(sort.locator(":scope > summary")).toBeFocused();
  await expect.poll(() => sort.evaluate(node => (node as HTMLDetailsElement).open)).toBe(false);
  const expected = [...zips].sort((a, b) => Number(b) - Number(a));
  await expect.poll(() => list.locator(':scope > [role="list"] [data-col-index="0"]').allTextContents()).toEqual(expected.slice(0, 4));
  expect((await list.locator('[data-col-index="0"]').allTextContents()).map(value => value.trim())).toEqual(expected);
  await expectNoSidewaysData(page);
});

test("a long selected sort label wraps and returns keyboard focus to a visible chooser", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect((await page.goto(url))?.status()).toBe(200);
    const sort = page.locator("#zips [data-adaptive-sort]");
    await sort.locator(":scope > summary").click();
    const choice = await sort.locator("button[data-sort-choice]").evaluateAll(buttons => buttons.map(button => ({ key: button.getAttribute("data-sort-choice")!, label: button.querySelector("span")?.textContent ?? "" })).filter(button => button.key.endsWith(":descending")).sort((a, b) => b.label.length - a.label.length)[0]);
    expect(choice).toBeTruthy();
    await sort.locator(`[data-sort-choice="${choice!.key}"]`).click();
    const summary = sort.locator(":scope > summary");
    await expect(summary).toBeFocused();
    await expect(summary).toBeInViewport({ ratio: 1 });
    await expect(sort.locator(".dt-sort-current")).toHaveText(`${choice!.label} · Descending`);
    expect(await summary.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    const hiddenHeaderButtons = page.locator("#zips thead .dt-sort");
    for (const button of await hiddenHeaderButtons.all()) {
      if (!(await button.isVisible())) expect(await button.evaluate(node => getComputedStyle(node).display)).toBe("none");
    }
  }
});

test("all authored fields remain reachable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    expect((await page.goto(url))?.status()).toBe(200);
    const list = page.locator("#zips [data-record-list]");
    const count = Number(await list.getAttribute("data-record-count"));
    await expect(list.locator("[data-record-key]")).toHaveCount(count);
    const before = await list.locator("[data-col-index]").allTextContents();
    await list.locator(":scope > details > summary").click();
    const last = list.locator("[data-record-key]").last();
    await last.locator(":scope > details > summary").click();
    await expect(last.locator("[data-col-index]").last()).toBeVisible();
    expect(await list.locator("[data-col-index]").allTextContents()).toEqual(before);
    await expectNoSidewaysData(page);
    await expect(page.locator("#zips .dt-scroll[tabindex='0']")).toHaveCount(0);
  } finally { await context.close(); }
});

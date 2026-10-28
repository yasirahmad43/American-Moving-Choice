import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3003").replace(/\/+$/, "");
const url = `${base}/movers/alabama/alabaster/`;

async function expectAccessibleScrollRegions(page: Page) {
  const results = await new AxeBuilder({ page }).include("#zips").analyze();
  expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

test("wide plain-text ZIP table is reachable by Tab and scrolls with arrow keys", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(url))?.status()).toBe(200);
  const region = page.locator("#zips .dt-scroll");
  await expect(region).toBeVisible();
  // This is the production regression: one or two data rows, with no incidental link/button.
  await expect(region.locator("a, button, input, select, textarea")).toHaveCount(0);
  expect(await region.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(1);
  await expect(region).toHaveAttribute("tabindex", "0");
  await expect(region).toHaveRole("region");
  await expect(region).toHaveAccessibleName(/scrollable table/);
  for (let i = 0; i < 100 && !(await region.evaluate((el) => document.activeElement === el)); i++) await page.keyboard.press("Tab");
  await expect(region).toBeFocused();
  await expect(region).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(region).toBeFocused();
  await expectAccessibleScrollRegions(page);
  // Resizing must remove the extra tab stop when card mode eliminates the scroll container.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(region).toHaveAttribute("tabindex", "-1");
  await expect(region.locator("span.sr-only").first()).toHaveAttribute("aria-hidden", "true");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(region).toHaveAttribute("tabindex", "0");
});

test("plain-text ZIP rows remain readable mobile cards without a redundant scroll tab stop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(url))?.status()).toBe(200);
  const region = page.locator("#zips .dt-scroll");
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute("tabindex", "-1");
  expect(await region.evaluate((el) => getComputedStyle(el).overflowX)).toBe("visible");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const lastCell = region.locator("tbody tr").first().locator("td").last();
  await lastCell.scrollIntoViewIfNeeded();
  await expect(lastCell).toBeVisible();
  expect((await lastCell.innerText()).trim()).not.toBe("");
  await expectAccessibleScrollRegions(page);
});

test("wide ZIP table retains named keyboard access when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    expect((await page.goto(url))?.status()).toBe(200);
    const region = page.locator("#zips .dt-scroll");
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(region).toHaveAccessibleName(/scrollable table/);
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  } finally { await context.close(); }
});

import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";

test("mobile catalog puts guide search before quote entry and retains five bounded topic cards", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${WEB}/explore/`);
  const search = page.getByRole("search", { name: "Search all guides and public pages" });
  const query = search.getByLabel("Search moving guides");
  await expect(query).toBeInViewport({ ratio: 1 });
  const queryBox = await query.boundingBox();
  const quoteBox = await page.locator(".vsh__survey input").first().boundingBox();
  expect(queryBox!.y).toBeLessThan(quoteBox!.y);
  const topics = page.getByRole("list", { name: "Moving guide topics" });
  await expect(topics.getByRole("link")).toHaveCount(5);
  expect((await topics.boundingBox())!.height).toBeLessThan(450);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const accessibility = await new AxeBuilder({ page }).include("#guide-search").analyze();
  expect(accessibility.violations.filter((issue) => issue.impact === "serious" || issue.impact === "critical")).toEqual([]);
});

test("desktop mega-menu exposes every category, closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${WEB}/explore/?type=page`);
  const primary = page.getByRole("navigation", { name: "Primary", exact: true });
  const disclosure = primary.locator("details").filter({ has: page.locator("summary", { hasText: "All moving guides" }) });
  const summary = disclosure.locator(":scope > summary");
  await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
  for (const type of ["state", "city", "route", "service", "cost", "question", "planning"]) {
    await expect(disclosure.locator(`a[href="/explore/?type=${type}"]`)).toBeVisible();
  }
  const accessibility = await new AxeBuilder({ page }).include("header").analyze();
  expect(accessibility.violations.filter((issue) => issue.impact === "serious" || issue.impact === "critical")).toEqual([]);
  await disclosure.getByLabel("What are you planning?").focus();
  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await expect(primary.locator('a[href^="/companies/"]')).toHaveCount(0);
  await expect(page.getByRole("banner").locator('a[href="/advertising-disclosure/"]')).toHaveCount(0);
});

test("footer search opens the complete catalog and preserves useful filters", async ({ page }) => {
  await page.goto(`${WEB}/explore/?type=page`);
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator('a[href="/advertising-disclosure/"]')).toHaveCount(0);
  await footer.getByText("Search every moving guide by place or topic", { exact: true }).click();
  const search = footer.getByRole("search", { name: "Footer moving guide search" });
  await search.getByLabel("What are you planning?").fill("packing");
  await search.getByLabel("Where?").selectOption("TX");
  await search.getByRole("button", { name: "Find a guide" }).click();
  await expect(page).toHaveURL(/\/explore\/\?q=packing&state=TX/);
  await expect(page.getByLabel("Search moving guides")).toHaveValue("packing");
  await expect(page.getByLabel("State", { exact: true })).toHaveValue("TX");
  for (const href of ["/moving-cost-calculator/", "/verify-a-mover/", "/mover-terms/", "/for-movers/moving-leads/", "/for-movers/reviews-and-reputation/", "/moving-cost-calculator/method/"]) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

test("mobile menu and catalog search work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${WEB}/explore/?type=page`);
    const header = page.getByRole("banner");
    await header.locator("summary").filter({ hasText: "Menu" }).first().click();
    const mobile = page.getByRole("navigation", { name: "Primary mobile" });
    await mobile.getByText("Costs & tools", { exact: true }).click();
    await expect(mobile.getByRole("link", { name: "How the calculator works", exact: true })).toBeVisible();
    await header.locator("summary").filter({ hasText: "Menu" }).first().click();
    // A normal GET form and real result links work without hydration or a search API.
    const form = page.getByRole("search", { name: "Search all guides and public pages" });
    await form.getByLabel("Search moving guides").fill("calculator");
    await form.getByLabel("Guide category").selectOption("page");
    await form.getByRole("button", { name: "Find guides" }).click();
    await expect(page.locator("#browse-guides").getByRole("link", { name: "Moving cost calculator", exact: true })).toBeVisible();
    await expect(page.locator("#browse-guides").getByRole("link", { name: "How the calculator works", exact: true })).toBeVisible();
    await expect(page.locator('a[href^="/companies/"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
});

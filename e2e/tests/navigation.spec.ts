import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";

test("route discovery stays bounded and its origin search works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const writes: string[] = [];
  page.on("request", request => { if (!["GET", "HEAD"].includes(request.method())) writes.push(request.method()); });
  try {
    expect((await page.goto(`${WEB}/routes/`))?.status()).toBe(200);
    const cards = page.locator('#browse-guides ul[aria-label="Published moving guides"] > li');
    const count = await cards.count();
    const browseLabel = await page.locator('a[href="#browse-guides"]').first().innerText();
    const declaredTotal = Number(browseLabel.match(/[0-9][0-9,]*/)?.[0].replaceAll(",", "") ?? "0");
    expect(count).toBe(Math.min(declaredTotal, 60));
    await expect(page.locator('#browse-guides ul[aria-label="Published moving guides"]')).toHaveCount(count ? 1 : 0);
    const destinations = await cards.locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")));
    expect(new Set(destinations).size).toBe(count);
    await expect(cards.locator("img")).toHaveCount(count);
    expect((await page.locator('meta[property="og:image"]').first().getAttribute("content"))?.startsWith("http")).toBe(true);
    const search = page.getByRole("search", { name: "Find a moving route" });
    await search.getByText("Filter by origin state", { exact: true }).click();
    const choices = await search.getByLabel("Origin state", { exact: true }).locator('option[value]:not([value=""])').evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value));
    const origin = choices.includes("TX") ? "TX" : choices[0] ?? "";
    await search.getByLabel("Origin state", { exact: true }).selectOption(origin);
    await search.getByLabel("Which route are you planning?").fill("Texas");
    await search.getByRole("button", { name: "Find my route", exact: true }).click();
    await expect(page).toHaveURL(/\/explore\//);
    const target = new URL(page.url());
    expect(target.searchParams.get("type")).toBe("route");
    expect(target.searchParams.get("q")).toBe("Texas");
    expect(target.searchParams.get("state")).toBe(origin);
    const catalogSearch = page.getByRole("search", { name: "Search all guides and public pages" });
    await expect(catalogSearch.getByLabel("Guide category", { exact: true })).toHaveValue("route");
    await expect(catalogSearch.getByLabel("State", { exact: true })).toHaveValue(origin);
    expect(writes).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
});

test("every available catalog category gives each result a varied image and complete destination", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const populated = [];
  for (const type of ["state", "city", "route", "service", "cost", "question", "planning", "page"]) {
    await page.goto(`${WEB}/explore/?type=${type}`);
    const results = page.getByRole("list", { name: "Guide search results" });
    // A clean seed may not have generated SEO pages yet; the static catalog always exists.
    if (!await results.count()) {
      await expect(page.getByRole("heading", { name: "Let’s try a different direction." })).toBeVisible();
      continue;
    }
    populated.push(type);
    const cards = results.locator(":scope > li");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await expect(cards.getByRole("link")).toHaveCount(count);
    await expect(cards.locator("img")).toHaveCount(count);
    const identities = await cards.locator("[data-catalog-image]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-catalog-image")));
    expect(new Set(identities).size).toBe(count);
    expect(await cards.getByRole("link").evaluateAll((nodes) => nodes.every((node) => node.getAttribute("aria-label")?.trim() && node.getAttribute("href")?.startsWith("/") && node.textContent?.includes(node.getAttribute("aria-label")!)))).toBe(true);
    const first = cards.first().getByRole("link");
    await first.scrollIntoViewIfNeeded();
    await expect.poll(() => first.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await first.focus();
    await expect(first).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  expect(populated).toContain("page");
});

test("mobile image results use two complete cards per row without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${WEB}/explore/?type=page`);
  const results = page.getByRole("list", { name: "Guide search results" });
  const first = results.locator(":scope > li").first();
  await first.scrollIntoViewIfNeeded();
  const photo = first.locator("img");
  await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const imageBox = await photo.boundingBox();
  const cardBox = await first.boundingBox();
  const secondBox = await results.locator(":scope > li").nth(1).boundingBox();
  expect(Math.abs(cardBox!.y - secondBox!.y)).toBeLessThanOrEqual(1);
  expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(secondBox!.x);
  expect(imageBox!.width).toBeGreaterThanOrEqual(120);
  expect(Math.abs(imageBox!.width - cardBox!.width)).toBeLessThanOrEqual(2);
  expect(imageBox!.height).toBeLessThanOrEqual(96);
  expect(cardBox!.height).toBeLessThan(230);
  expect(await results.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const accessibility = await new AxeBuilder({ page }).include("#browse-guides").analyze();
  expect(accessibility.violations.filter((issue) => issue.impact === "serious" || issue.impact === "critical")).toEqual([]);
});

test("mobile catalog puts guide search first and fits all five topic cards in compact rows", async ({ page }) => {
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
  const boxes = await topics.locator(":scope > li").evaluateAll(nodes => nodes.map(node => { const bounds = node.getBoundingClientRect(); return { x: bounds.x, y: bounds.y, width: bounds.width }; }));
  expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(boxes[2]!.y - boxes[3]!.y)).toBeLessThanOrEqual(1);
  expect(boxes[4]!.width).toBeGreaterThan(boxes[0]!.width * 1.8);
  expect(await topics.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
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
  for (const href of ["/moving-cost-calculator/", "/verify-a-mover/", "/moving-cost-calculator/method/"]) {
    await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(footer.locator('a[href^="/for-movers"],a[href^="/mover-terms"]')).toHaveCount(0);
});

test("mobile menu and catalog search work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${WEB}/explore/?type=page`);
    const header = page.getByRole("banner");
    await header.locator("summary").filter({ hasText: "Menu" }).first().click();
    const mobile = page.getByRole("navigation", { name: "Primary mobile" });
    await expect(mobile.locator('a[href^="/for-movers"],a[href^="/mover-terms"]')).toHaveCount(0);
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
    const calculator = page.getByRole("list", { name: "Guide search results" }).getByRole("link", { name: "Moving cost calculator", exact: true });
    await calculator.scrollIntoViewIfNeeded();
    await expect(calculator.locator("img")).toBeVisible();
    await expect.poll(() => calculator.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('a[href^="/companies/"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
});

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, WEB_URL } from "../tests/env";
import { expectNoSeriousAxeViolations, inDays } from "../tests/helpers";

const fixtureNames = /Demo Lone Star|Demo Bluebonnet|Demo Pecan Grove|Demo Mesquite|Demo Trinity River/;
async function anonymous(page: Page) {
  await expect(page.locator("#main")).not.toContainText(fixtureNames);
  await expect(page.locator('a[href^="/companies/"],a[href^="/directory/"]')).toHaveCount(0);
}
async function capture(page: Page, name: string) {
  if (!process.env.AMC_PROOF_DIR) return;
  await mkdir(process.env.AMC_PROOF_DIR, { recursive: true });
  await page.screenshot({ path: resolve(process.env.AMC_PROOF_DIR, name + ".png"), fullPage: true });
}

test("deployed app health and retired directory redirects", async ({ request }) => {
  const response = await request.get(APP_URL + "/api/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ status: "ok" });
  for (const path of ["/directory/", "/companies/demo-lone-star-relocation-co/"]) {
    const retired = await request.get(WEB_URL + path, { maxRedirects: 0 });
    expect(retired.status()).toBe(308);
    expect(new URL(retired.headers().location!, WEB_URL).pathname).toBe("/get-quotes/");
  }
});

for (const width of [1440, 390]) test("deployed home and quote form at " + width + "px", async ({ page }) => {
  await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(WEB_URL + "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/A better move\.\s*On your terms\./);
  await anonymous(page);
  await expectNoSeriousAxeViolations(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await capture(page, "production-home-" + width);
  await page.goto(WEB_URL + "/get-quotes/");
  await anonymous(page);
  await expectNoSeriousAxeViolations(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await capture(page, "production-quote-" + width);
});

test("published SEO URLs render without company lists", async ({ page, request }) => {
  test.setTimeout(180_000);
  const sitemap = await request.get(WEB_URL + "/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const index = await sitemap.text();
  expect(index).not.toMatch(/companies\.xml|directory/);
  const maps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]!);
  const cityMaps = maps.filter((url) => /\/cities-\d+\.xml$/.test(url));
  expect(cityMaps.length, "city sitemaps are available after bootstrap").toBeGreaterThan(0);
  const seoMaps = maps.filter((url) => new URL(url).pathname !== "/sitemaps/core.xml");
  const families: Record<string, string> = {
    states: "state", cities: "city", routes: "route", services: "service",
    costs: "cost", questions: "question", planning: "planning",
  };
  const urls = new Set<string>();
  const samples = new Map<string, string>();
  for (const url of seoMaps) {
    const segment = await request.get(url);
    expect(segment.ok()).toBe(true);
    const entries = [...(await segment.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]!);
    for (const entry of entries) urls.add(entry);
    const segmentName = /\/sitemaps\/([a-z]+)(?:-\d+)?\.xml$/.exec(new URL(url).pathname)?.[1];
    const family = segmentName ? families[segmentName] : undefined;
    if (family) {
      expect(entries.length, `${family} sitemap contains published URLs`).toBeGreaterThan(0);
      if (!samples.has(family)) samples.set(family, entries[0]!);
    }
  }
  expect(urls.size, "published SEO URLs across all families").toBeGreaterThanOrEqual(2_000);
  expect([...samples.keys()].sort(), "published samples cover all seven SEO families").toEqual(Object.values(families).sort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [family, url] of samples) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      const response = await page.goto(url);
      expect(response?.status(), `${family} URL returns HTTP 200 at ${width}px`).toBe(200);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).not.toHaveText("We can't find that page");
      const canonical = page.locator('head link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute("href", /\S/);
      const canonicalHref = await canonical.getAttribute("href");
      expect(new URL(canonicalHref!, page.url()).href, `${family} canonical matches the rendered URL at ${width}px`).toBe(new URL(page.url()).href);
      if (width === 1440) {
        await expect(page.locator('aside[aria-labelledby="quote-heading"]')).toBeInViewport({ ratio: 0.5 });
      }
      await anonymous(page);
      await expectNoSeriousAxeViolations(page, `${family} at ${width}px`);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        `${family} has no horizontal overflow at ${width}px`,
      ).toBeLessThanOrEqual(1);
      await capture(page, `production-seo-${family}-${width}`);
    }
  }
});

test("a demo consumer submits one anonymous request and withdraws it", async ({ page }) => {
  // This scenario writes one fictional request, then withdraws it through its private link.
  // Require the designated demo deployment and its visible demo disclosure before proceeding.
  test.skip(WEB_URL !== "https://amc-web-three.vercel.app" || APP_URL !== "https://amc-app-sable.vercel.app", "designated deployed demo only");
  await page.goto(WEB_URL + "/get-quotes/");
  await expect(page.getByText(/Requests and transactions use fictional demo data/)).toBeVisible();
  await page.getByLabel("Moving my home").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("ZIP code you're moving from").fill("75201");
  await page.getByLabel("ZIP code you're moving to").fill("77002");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Move date").fill(inDays(30));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("2 bedrooms").check();
  await page.getByRole("button", { name: "Check which movers serve my move" }).click();
  await expect(page.getByRole("heading", { name: /movers in our network serve your move/ })).toBeVisible();
  await anonymous(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#channel-email").check();
  await page.getByLabel("First name").fill("Demo");
  await page.getByLabel("Last name").fill("Releaseproof");
  await page.locator("#email").fill(`amc-release-${Date.now()}@example.com`);
  await page.getByLabel("Phone number").fill("20255501" + String(Date.now() % 100).padStart(2, "0"));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('label[for="limit-1"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator('label[for="consent"]')).toContainText("1 participating moving company");
  await anonymous(page);
  await page.locator("#consent").check();
  await page.locator("#terms").check();
  // Respect the real survey minimum-completion interval.
  await page.waitForTimeout(8_500);
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible({ timeout: 20_000 });
  const manageHref = await page.getByRole("link", { name: "Manage your request" }).getAttribute("href");
  if (!manageHref) throw new Error("The sent request has no private manage link for withdrawal cleanup.");
  try {
    await anonymous(page);
    await capture(page, "production-request-confirmation");
    await page.getByRole("link", { name: "Manage your request" }).click();
    await anonymous(page);
  } finally {
    // Withdraw even if the confirmation, privacy checks, or evidence capture failed.
    await page.goto(new URL(manageHref, WEB_URL).toString());
    const withdraw = page.getByRole("button", { name: "Withdraw my request" });
    if (await withdraw.isVisible()) {
      await withdraw.click();
      await page.getByRole("button", { name: "Yes, withdraw it" }).click();
    }
    await expect(page.getByText(/Your request is withdrawn|Request withdrawn|You withdrew this request/).first()).toBeVisible();
    await anonymous(page);
    await capture(page, "production-request-withdrawn");
  }
});

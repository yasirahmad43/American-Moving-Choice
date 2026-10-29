import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, WEB_URL } from "../tests/env";
import { expectNoSeriousAxeViolations, inDays } from "../tests/helpers";

const fixtureNames = /Demo (?:Lone Star|Bluebonnet Hill|Pecan Grove|Mesquite Trail|Trinity River|Sunshine Parkway|Palmetto Grove|Coral Key|Manatee Bay|First Light|Golden Poppy|Orange Blossom|Pacific Tide|Sierra Vista|Harbor Lantern|Prairie Wind|Dual Authority)/;
const siteIndexable = process.env.E2E_SITE_INDEXABLE === "true";
const pendingWithdrawals = new WeakMap<Page, string>();
function sameOriginUrl(value: string): URL {
  const url = new URL(value, WEB_URL);
  expect(url.origin, "smoke navigation stays on the configured public site").toBe(new URL(WEB_URL).origin);
  expect(url.username || url.password, "smoke URLs contain no credentials").toBe("");
  return url;
}
async function anonymous(page: Page) {
  await expect(page.locator("#main")).not.toContainText(fixtureNames);
  expect(await page.content(), "company identities are absent from rendered HTML and serialized props").not.toMatch(fixtureNames);
  const profiles = await page.locator("a[href]").evaluateAll((links) => links.flatMap((link) => {
    try {
      const url = new URL(link.getAttribute("href")!, document.baseURI);
      return /^\/(?:companies|directory)(?:\/|$)/.test(url.pathname) ? [url.pathname] : [];
    } catch { return []; }
  }));
  expect(profiles, "no relative or absolute company-profile/directory links").toEqual([]);
}
const withdrawnText = /Your request is withdrawn|Request withdrawn|You withdrew this request/;
async function withdrawFictionalRequest(page: Page, manageUrl: string) {
  await page.goto(manageUrl);
  const withdraw = page.getByRole("button", { name: "Withdraw my request" });
  const withdrawn = page.getByText(withdrawnText).first();
  await expect(withdraw.or(withdrawn)).toBeVisible();
  if (await withdraw.isVisible()) {
    await withdraw.click();
    await page.getByRole("button", { name: "Yes, withdraw it" }).click();
  }
  await expect(withdrawn).toBeVisible();
}
test.afterEach(async ({ page }, testInfo) => {
  const manageUrl = pendingWithdrawals.get(page);
  if (!manageUrl) return;
  // Teardown has its own time allowance, so a timed-out assertion cannot consume cleanup's budget.
  testInfo.setTimeout(30_000);
  await withdrawFictionalRequest(page, manageUrl);
  pendingWithdrawals.delete(page);
});
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
  const maps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => sameOriginUrl(m[1]!).href);
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
    const entries = [...(await segment.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => sameOriginUrl(m[1]!).href);
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
      const canonical = page.locator('link[rel="canonical"]');
      const robots = page.locator('meta[name="robots"]');
      // Architecture §2.4: the deliberate noindex demo carries no canonical. The expected
      // policy is supplied by the runner, never inferred from a possibly regressed response.
      if (siteIndexable) {
        await expect(canonical).toHaveCount(1);
        await expect(canonical).toHaveAttribute("href", /\S/);
        const canonicalHref = await canonical.getAttribute("href");
        expect(new URL(canonicalHref!, page.url()).href).toBe(new URL(page.url()).href);
        await expect(robots).not.toHaveAttribute("content", /noindex/i);
      } else {
        await expect(robots).toHaveAttribute("content", /noindex/i);
        await expect(canonical).toHaveCount(0);
      }
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", new URL(page.url()).href);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
      if (width === 1440) {
        const survey = page.locator(".vsh__survey");
        await expect(survey).toBeInViewport({ ratio: 0.5 });
        const copyBox = await page.locator(".vsh__copy").boundingBox();
        const surveyBox = await survey.boundingBox();
        expect(surveyBox!.x).toBeGreaterThan(copyBox!.x + copyBox!.width);
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
  await expect(page).toHaveURL(WEB_URL + "/get-quotes/");
  await expect(page.getByText(/Requests and transactions use fictional demo data/)).toBeVisible();
  await page.getByLabel("Moving my home").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("ZIP code you're moving from").fill("75201");
  await page.getByLabel("ZIP code you're moving to").fill("77002");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Move date").fill(inDays(30));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("2 bedrooms").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
  await anonymous(page);
  await expect(page.locator('input[id^="channel-"]')).toHaveCount(0);
  await page.getByLabel("First name").fill("Demo");
  await page.getByLabel("Last name").fill("Releaseproof");
  await page.locator("#email").fill(`amc-release-${Date.now()}@example.com`);
  await page.getByLabel("Phone number").fill("20255501" + String(Date.now() % 100).padStart(2, "0"));
  await page.locator('label[for="limit-1"]').click();
  await page.getByRole("button", { name: "Review my request", exact: true }).click();
  await expect(page.locator("#submit-notice")).toContainText("1 moving company");
  await anonymous(page);
  await expect(page.locator("#consent,#terms")).toHaveCount(0);
  // Respect the real survey minimum-completion interval.
  await page.waitForTimeout(8_500);
  await expect(page).toHaveURL(WEB_URL + "/get-quotes/");
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible({ timeout: 20_000 });
  const manageHref = await page.getByRole("link", { name: "Manage your request" }).getAttribute("href");
  if (!manageHref) throw new Error("The sent request has no private manage link for withdrawal cleanup.");
  const manage = sameOriginUrl(manageHref);
  expect(manage.pathname, "cleanup targets only the newly returned private request link").toMatch(/^\/my-request\/[A-Za-z0-9_-]{43}\/?$/);
  expect(manage.search || manage.hash, "private manage link has no query or fragment").toBe("");
  pendingWithdrawals.set(page, manage.href);
  try {
    await anonymous(page);
    await capture(page, "production-request-confirmation");
    await page.getByRole("link", { name: "Manage your request" }).click();
    await anonymous(page);
  } finally {
    // Withdraw even if the confirmation, privacy checks, or evidence capture failed.
    await withdrawFictionalRequest(page, manage.href);
    pendingWithdrawals.delete(page);
    await anonymous(page);
    await capture(page, "production-request-withdrawn");
  }
});

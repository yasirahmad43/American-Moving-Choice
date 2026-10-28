/**
 * Slice S1 scenarios: the trust and cost content pages, the home page's ZIP hand-off into the
 * quote survey, report a concern, and axe and small-screen reflow checks on the public shell.
 */
import { expect, test } from "@playwright/test";
import { WEB_URL, withDatabase } from "./env";
import { expectNoSeriousAxeViolations } from "./helpers";

const CONTENT_PAGES = [
  "/advertising-disclosure/",
  "/how-we-verify-movers/",
  "/movers-vs-brokers/",
  "/review-methodology/",
  "/which-companies-receive-my-request/",
  "/editorial-policy/",
  "/moving-costs/",
  "/moving-costs/how-movers-charge/",
  "/moving-cost-calculator/method/",
];

test.describe("content pages", () => {
  for (const path of CONTENT_PAGES) {
    test(`${path} renders as a draft with breadcrumbs, one h1 and its canonical URL`, async ({ page }) => {
      const response = await page.goto(`${WEB_URL}${path}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('section[aria-label="Page status"]')).toHaveCount(1);
      expect(await page.locator("mark.review-note").count()).toBeGreaterThan(0);
      await expect(page.locator("h1")).toHaveCount(1);
      // No unfilled template variables or leftover statement markers.
      const text = await page.locator("main").evaluate((el) => {
        const copy = el.cloneNode(true) as HTMLElement;
        copy.querySelectorAll("code").forEach((n) => n.remove());
        return copy.textContent ?? "";
      });
      expect(text).not.toMatch(/\{\{/);
      expect(await page.content()).not.toMatch(/<!--\s*ST-/);
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.some((j) => j.includes("BreadcrumbList"))).toBe(true);
      expect(jsonLd.some((j) => /FAQPage|HowTo/.test(j))).toBe(false);
      expect(await page.locator("link[rel=canonical]").getAttribute("href")).toMatch(new RegExp(`${path.replace(/\//g, "\\/")}$`));
    });
  }

  test("pages that aren't published are 404", async ({ page }) => {
    for (const path of ["/no-such-page/", "/trust/how-amc-makes-money/"]) {
      expect((await page.goto(`${WEB_URL}${path}`))?.status(), path).toBe(404);
    }
  });
});

test.describe("home page hand-off", () => {
  test("the hero ZIP form cleans the ZIPs and opens the survey at Where with them carried over", async ({ page }) => {
    await page.goto(`${WEB_URL}/`);
    // On the home page the header's Get quotes link is secondary; the hero form is the main action.
    await expect(page.locator('header a[href="/get-quotes/"]').first()).toHaveClass(/bg-surface/);
    await page.getByRole("button", { name: "See which movers cover your move" }).click();
    await expect(page.getByText("Enter the 5-digit ZIP code you're moving from.")).toBeVisible();

    await page.getByLabel("Moving from (ZIP code)").fill(" 02108-1234");
    await page.getByLabel("Moving to (ZIP code)").fill("10001");
    await expect(page.getByLabel("Moving from (ZIP code)")).toHaveValue("02108");
    await page.getByRole("button", { name: "See which movers cover your move" }).click();

    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
    // The home page's prefill shape ({ entry, originZip, destZip }) is read once and cleared.
    await expect(page.getByText("Check the answers we carried over")).toBeVisible();
    await expect(page.getByLabel("ZIP code you're moving from")).toHaveValue("02108");
    await expect(page.getByLabel("ZIP code you're moving to")).toHaveValue("10001");
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.prefill"))).toBeNull();

    await page.goto(`${WEB_URL}/about/`);
    await expect(page.locator('header a[href="/get-quotes/"]').first()).toHaveClass(/bg-cta/);
  });
});

test.describe("report a concern", () => {
  test.beforeEach(async () => {
    await withDatabase((db) => db.query("delete from rate_limits where key like 'concern:%'"));
  });

  test("an empty report names the problem; a complete one gets a case reference and an audit entry", async ({ page }) => {
    await page.goto(`${WEB_URL}/report-a-concern/`);
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Choose what your concern is about.")).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.getAttribute("name"))).toBe("caseType");

    await page.getByLabel(/A company acting as a broker/).check();
    await page.locator("#company").fill("USDOT 9000001");
    await page.locator("#description").fill("They said another company would carry my move and asked for a large deposit.");
    await page.locator("#email").fill("reporter@example.com");
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("We received your report.")).toBeVisible();
    const reference = (await page.locator("strong.tabular").innerText()).trim();
    expect(reference).toMatch(/^CASE-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(page.url()).not.toContain("?");

    const stored = await withDatabase(async (db) => {
      const row = await db.query("select case_type, source, status from cases where reference_code = $1", [reference]);
      const audit = await db.query<{ n: number }>(
        "select count(*)::int as n from audit_log a join cases c on c.id::text = a.entity_id::text where c.reference_code = $1 and a.action = 'case.report'",
        [reference],
      );
      return { row: row.rows[0], audits: audit.rows[0]?.n };
    });
    if (stored) expect(stored).toEqual({ row: { case_type: "broker_activity", source: "public_form", status: "open" }, audits: 1 });
  });
});

test.describe("public shell accessibility", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`no serious axe violations in ${colorScheme} mode`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme });
      const page = await context.newPage();
      for (const path of ["/", "/how-we-verify-movers/", "/for-movers/pricing/", "/report-a-concern/", "/advertising-disclosure/"]) {
        await page.goto(`${WEB_URL}${path}`);
        await expectNoSeriousAxeViolations(page, `${colorScheme} ${path}`);
      }
      await context.close();
    });
  }

  test("no horizontal scrolling at 320px wide", async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
    for (const path of ["/", "/for-movers/pricing/", "/report-a-concern/", "/moving-costs/"]) {
      await page.goto(`${WEB_URL}${path}`);
      const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(scrollWidth, path).toBeLessThanOrEqual(innerWidth);
    }
    await page.close();
  });
});

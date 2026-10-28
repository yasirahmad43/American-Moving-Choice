/**
 * Slice S4 scenarios: the mover directory, a company profile, a token-gated review, the location
 * gates and verify-a-mover, with axe checks on the directory and a profile.
 */
import { createHash, randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { WEB_URL, hasDatabase, withDatabase } from "./env";

const LONE_STAR = "demo-lone-star-relocation-co";
const REVIEW_ID = "e2000000-0000-4000-8000-000000000002";
const LONE_STAR_ID = "c0000000-0000-4000-8000-000000000001";

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("mover directory", () => {
  test("lists the demo companies alphabetically with demo chips and badges, never the broker", async ({ page }) => {
    const response = await page.goto(`${WEB_URL}/directory/`);
    expect(response?.status()).toBe(200);
    const list = page.locator("main ul.grid").first();
    const names = await list.locator("> li h3").allTextContents();
    expect(names).toHaveLength(12);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en-US", { sensitivity: "base" })));
    await expect(list.locator("> li").first().getByText("Demo company: fictional")).toBeVisible();
    await expect(list.locator("> li").first().getByText(/Preferred Mover/).first()).toBeVisible();
    await expect(page.getByText("Every mover listed here pays American Moving Choice")).toBeVisible();
    await expect(page.getByText("Demo Dual Authority Moving Group")).toHaveCount(0);

    const explainer = list.locator("> li").first().locator("details");
    await explainer.locator("summary").click();
    await expect(explainer).toContainText("passed our screening on");
    await expect(explainer).toContainText("isn't a government endorsement");

    await page.goto(`${WEB_URL}/directory/page/2/`);
    const rest = await page.locator("main ul.grid").first().locator("> li h3").allTextContents();
    expect(rest).toHaveLength(3);
    expect(rest).not.toContain("Demo Dual Authority Moving Group");
    expect((await page.goto(`${WEB_URL}/directory/page/9/`))?.status()).toBe(404);
  });

  test("directory has no serious axe violations", async ({ page }) => {
    await page.goto(`${WEB_URL}/directory/`);
    await expectNoSeriousAxeViolations(page);
  });
});

test.describe("company profile", () => {
  test.beforeAll(async () => {
    await withDatabase(async (db) => {
      await db.query("delete from review_responses where review_id = $1", [REVIEW_ID]);
      await db.query(
        "insert into review_responses (review_id, company_id, body, status) values ($1, $2, 'Demo response: thank you, we have added extra padding to our checklist.', 'published')",
        [REVIEW_ID, LONE_STAR_ID],
      );
    });
  });

  test("shows dated credential rows, the badge explainer, separate ratings with labels and responses", async ({ page }) => {
    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demo Lone Star Relocation Co.");
    await expect(page.getByText("Demo company: fictional").first()).toBeVisible();
    const credentials = page.locator("section", { has: page.getByRole("heading", { name: "Credentials and checks" }) });
    await expect(credentials.getByText("USDOT number")).toBeVisible();
    await expect(credentials.getByText("No broker authority on record")).toBeVisible();
    await expect(credentials.getByText(/Last checked [A-Z][a-z]{2} \d{1,2}, \d{4}/).first()).toBeVisible();
    await expect(credentials.getByRole("link", { name: /FMCSA company snapshot/ }).first()).toHaveAttribute("href", /safer\.fmcsa\.dot\.gov/);
    await expect(page.getByText("What this badge means")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quote and sales experience", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Moving experience", level: 3 })).toBeVisible();
    await expect(page.getByText("Verified completed move").first()).toBeVisible();
    await expect(page.getByText("Verified platform inquiry").first()).toBeVisible();
    if (hasDatabase) await expect(page.getByText("Response from Demo Lone Star Relocation Co.")).toBeVisible();

    const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).flatMap((t) => [JSON.parse(t)].flat());
    const company = jsonLd.find((d) => d["@type"] === "MovingCompany");
    expect(company.identifier[0]).toMatchObject({ propertyID: "USDOT", value: "9000001" });
    expect(company.aggregateRating).toMatchObject({ ratingValue: "4.0", ratingCount: 1 });
    expect(JSON.stringify(company)).not.toMatch(/telephone/);

    await page.getByRole("link", { name: "Request a quote from Demo Lone Star Relocation Co." }).click();
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
    const origin = await page.evaluate(() => sessionStorage.getItem("amc.survey.profile"));
    expect(JSON.parse(origin ?? "{}")).toMatchObject({ slug: LONE_STAR, companyId: LONE_STAR_ID });
  });

  test("profile has no serious axe violations", async ({ page }) => {
    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/`);
    await expectNoSeriousAxeViolations(page);
  });

  test("a company without reviews says so, and unknown or rejected companies are 404", async ({ page }) => {
    await page.goto(`${WEB_URL}/companies/demo-coral-key-moving-co/`);
    await expect(page.getByRole("heading", { name: "No customer reviews yet" })).toBeVisible();
    await expect(page.getByText("New to our network").first()).toBeVisible();
    expect((await page.goto(`${WEB_URL}/companies/demo-dual-authority-moving-group/`))?.status()).toBe(404);
    expect((await page.goto(`${WEB_URL}/companies/${LONE_STAR}/reviews/`))?.status()).toBe(404);
  });
});

test.describe("review invitation", () => {
  test.skip(!hasDatabase, "needs DATABASE_URL to create an invitation");

  test("a valid token submits once; reuse fails; the review is pending", async ({ page }) => {
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    await withDatabase(async (db) => {
      await db.query("delete from rate_limits where key like 'review:%'");
      // Earlier runs' invitations (the seed's use fixed IDs starting e1).
      await db.query("delete from reviews where reviewer_display_name = 'E2E R.'");
      await db.query("delete from review_invitations i where i.id::text not like 'e1000000-%' and not exists (select 1 from reviews r where r.invitation_id = i.id)");
      const purchase = await db.query<{ id: string; company_id: string }>(
        `select id, company_id from purchases p where company_id = $1
         and not exists (select 1 from review_invitations i where i.purchase_id = p.id and i.review_type = 'quote_experience') limit 1`,
        [LONE_STAR_ID],
      );
      const row = purchase.rows[0]!;
      await db.query(
        `insert into review_invitations (purchase_id, company_id, review_type, token_hash, sent_at, expires_at)
         values ($1, $2, 'quote_experience', $3, now(), now() + interval '30 days')`,
        [row.id, row.company_id, hash],
      );
    });
    const response = await page.goto(`${WEB_URL}/companies/${LONE_STAR}/review/?token=${token}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Review Demo Lone Star Relocation Co.");
    await page.getByLabel("4 stars").check();
    await page.getByLabel("Your review", { exact: true }).fill("E2E review: the estimator was on time and the written estimate was clear.");
    await page.getByLabel("Name to show with your review").fill("E2E R.");
    await page.getByLabel(/This review describes my own experience/).check();
    await page.getByRole("button", { name: "Send my review" }).click();
    await expect(page.getByText("Thank you. We received your review.")).toBeVisible();
    const stored = await withDatabase((db) =>
      db.query("select r.status, r.evidence_level from reviews r join review_invitations i on i.id = r.invitation_id where i.token_hash = $1", [hash]),
    );
    expect(stored?.rows[0]).toEqual({ status: "pending", evidence_level: "platform_inquiry" });

    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/review/?token=${token}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This review link has already been used");
    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/`);
    await expect(page.getByText("E2E review: the estimator")).toHaveCount(0);
  });
});

test.describe("location pages and verify-a-mover", () => {
  test("movers index explains coverage and reports a ZIP's state inline; gated pages are 404", async ({ page }) => {
    await page.goto(`${WEB_URL}/movers/`);
    await expect(page.getByText("No state pages are published yet.")).toBeVisible();
    await page.getByLabel("Your ZIP code").fill("78704");
    await page.getByRole("button", { name: "Check coverage" }).click();
    await expect(page.getByText(/Austin, TX: \d+ movers in our network cover moves starting in Texas/)).toBeVisible();
    expect(page.url()).toBe(`${WEB_URL}/movers/`);
    expect((await page.goto(`${WEB_URL}/movers/texas/`))?.status()).toBe(404);
    expect((await page.goto(`${WEB_URL}/movers/texas/dallas/`))?.status()).toBe(404);
  });

  test("verify-a-mover finds fixture USDOT 9000001 and reports the broker fixture as a broker", async ({ page }) => {
    await withDatabase((db) => db.query("delete from rate_limits where key like 'verify:%'"));
    await page.goto(`${WEB_URL}/verify-a-mover/`);
    await page.getByRole("textbox", { name: "USDOT or MC number" }).fill("9000001");
    await page.getByRole("button", { name: "Look up" }).click();
    const result = page.getByRole("region", { name: "Result for USDOT 9000001" });
    await expect(result).toContainText("Demo Lone Star Relocation Co.");
    await expect(result).toContainText("Moving carrier");
    await expect(result).toContainText("Data retrieved");
    await expect(result).toContainText("isn't an endorsement");
    expect(page.url()).toBe(`${WEB_URL}/verify-a-mover/`);

    await page.getByRole("textbox", { name: "USDOT or MC number" }).fill("9000090");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByRole("region", { name: "Result for USDOT 9000090" })).toContainText("Broker: this record shows broker authority");
  });
});

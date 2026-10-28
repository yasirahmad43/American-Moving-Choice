/**
 * Central quote entry redirects, no public company showcases, token-gated feedback, location
 * gates and verify-a-mover, with axe checks at desktop and mobile sizes.
 */
import { createHash, randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { WEB_URL, hasDatabase, withDatabase } from "./env";

const LONE_STAR = "demo-lone-star-relocation-co";
const LONE_STAR_ID = "c0000000-0000-4000-8000-000000000001";

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("central quote entry", () => {
  test("legacy directory and company URLs redirect without publishing identities or metadata", async ({ page, request }) => {
    for (const path of [
      "/directory/",
      "/directory/?sort=quote_rating",
      "/directory/page/2/",
      `/companies/${LONE_STAR}/`,
      `/companies/${LONE_STAR}/reviews/`,
    ]) {
      const response = await request.get(`${WEB_URL}${path}`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe("/get-quotes/");
      expect(await response.text()).not.toContain("Demo Lone Star Relocation Co.");
    }

    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/`);
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
    await expect(page.getByText("Demo Lone Star Relocation Co.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /quote from/i })).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.profile"))).toBeNull();
  });

  test("sitemaps contain no retired company profiles or directory routes", async ({ request }) => {
    const index = await request.get(`${WEB_URL}/sitemap.xml`);
    expect(index.status()).toBe(200);
    expect(await index.text()).not.toContain("companies.xml");
    const core = await request.get(`${WEB_URL}/sitemaps/core.xml`);
    expect(core.status()).toBe(200);
    expect(await core.text()).not.toMatch(/\/(?:companies|directory)\//);
    expect((await request.get(`${WEB_URL}/sitemaps/companies.xml`)).status()).toBe(404);
  });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`quote entry has no serious axe violations at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${WEB_URL}/directory/`);
      await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
      await expectNoSeriousAxeViolations(page);
    });
  }
});

test.describe("review invitation", () => {
  test.skip(!hasDatabase, "needs DATABASE_URL to create an invitation");

  test("a valid token submits once; reuse fails; the review is pending", async ({ page }) => {
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    await withDatabase(async (db) => {
      await db.query("begin");
      try {
        // CRM uses forced RLS even for the app owner, so fixtures select the same company
        // context as the application. This also works when the local runner is a superuser.
        await db.query("select set_config('app.company_id', $1, true)", [LONE_STAR_ID]);
        await db.query("delete from rate_limits where key like 'review:%'");
        // Earlier runs' invitations (the seed's use fixed IDs starting e1).
        await db.query("delete from reviews where reviewer_display_name = 'E2E R.'");
        await db.query("delete from review_invitations i where i.id::text not like 'e1000000-%' and not exists (select 1 from reviews r where r.invitation_id = i.id)");
        const purchase = await db.query<{ id: string; company_id: string }>(
          `select p.id, p.company_id from purchases p
           join lead_groups g on g.id = p.group_id
           join crm_records r on r.purchase_id = p.id and r.company_id = p.company_id
           where p.company_id = $1 and p.refunded_at is null and g.status <> 'withdrawn'
             and (r.stage = any($2::text[]) or exists (
               select 1 from crm_activities a where a.record_id = r.id and a.company_id = r.company_id
                 and a.type = 'stage_change' and a.body ~* $3
             ))
             and not exists (select 1 from review_invitations i where i.purchase_id = p.id and i.review_type = 'quote_experience')
           order by p.created_at desc, p.id limit 1`,
          [
            LONE_STAR_ID,
            ["contacted", "qualified", "quote_sent", "follow_up", "booked", "completed"],
            "^Stage changed from (Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed) to (New|Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed|Lost)\\.$|^Stage changed from (New|Lost) to (Contacted|Qualified|Quote[ _]sent|Follow[-_]up|Booked|Completed)\\.$",
          ],
        );
        const row = purchase.rows[0];
        if (!row) throw new Error("The local seed needs an unrefunded, active Lone Star purchase with recorded CRM contact and no quote-feedback invitation.");
        await db.query(
          `insert into review_invitations (purchase_id, company_id, review_type, token_hash, send_after, sent_at, expires_at)
           values ($1, $2, 'quote_experience', $3, now(), now(), now() + interval '30 days')`,
          [row.id, row.company_id, hash],
        );
        await db.query("commit");
      } catch (error) {
        await db.query("rollback");
        throw error;
      }
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
    const stored = await withDatabase(async (db) => {
      // withDatabase opens a dedicated connection for this callback and closes it afterward.
      await db.query("select set_config('app.company_id', $1, false)", [LONE_STAR_ID]);
      return db.query("select r.status, r.evidence_level from reviews r join review_invitations i on i.id = r.invitation_id where i.token_hash = $1", [hash]);
    });
    expect(stored?.rows[0]).toEqual({ status: "pending", evidence_level: "platform_inquiry" });

    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/review/?token=${token}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This review link has already been used");
    await page.goto(`${WEB_URL}/companies/${LONE_STAR}/`);
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
    await expect(page.getByText("E2E review: the estimator")).toHaveCount(0);
  });
});

test.describe("location pages and verify-a-mover", () => {
  test("movers index explains coverage and reports a ZIP's state inline; gated pages are 404", async ({ page }) => {
    await page.goto(`${WEB_URL}/movers/`);
    // With only the demo seed no state page is published; after `pnpm seo:generate state` and
    // `seo:publish` the hub lists them instead and /movers/texas/ is live.
    const generated = (await page.getByRole("link", { name: /Texas/ }).count()) > 0;
    if (!generated) await expect(page.getByText("No state pages are published yet.")).toBeVisible();
    await page.getByLabel("Your ZIP code").fill("78704");
    await page.getByRole("button", { name: "Check coverage" }).click();
    await expect(page.getByText(/Austin, TX: \d+ movers in our network cover moves starting in Texas/)).toBeVisible();
    expect(page.url()).toBe(`${WEB_URL}/movers/`);
    if (generated) {
      expect((await page.goto(`${WEB_URL}/movers/texas/`))?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
    } else {
      expect((await page.goto(`${WEB_URL}/movers/texas/`))?.status()).toBe(404);
      expect((await page.goto(`${WEB_URL}/movers/texas/dallas/`))?.status()).toBe(404);
    }
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

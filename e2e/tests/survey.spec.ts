/**
 * Slice S2 scenarios: the quote survey from the ZIP codes to the confirmation page, the
 * no-coverage ending, a repeat request and withdrawal from the manage page, a request started from
 * a company profile, the tag policy, and the cost calculator's hand-off into the survey.
 */
import { expect, test, type Page } from "@playwright/test";
import { WEB_URL, hasDatabase, withDatabase } from "./env";
import { expectNoAxeViolations, inDays, uniquePhone } from "./helpers";

const LONE_STAR_ID = "c0000000-0000-4000-8000-000000000001";
const PIPELINE_SECOND_ID = "c0000000-0000-4000-8000-000000000002";
const MESQUITE_TRAIL_ID = "c0000000-0000-4000-8000-000000000004";
const TEXAS_MOVERS = ["Demo Lone Star Relocation Co.", "Demo Bluebonnet Hill Movers", "Demo Pecan Grove Moving Co.", "Demo Mesquite Trail Movers", "Demo Trinity River Moving Co."];
/** The server refuses a submission sooner than 8 seconds after the coverage check (lead quality §4). */
const MIN_COMPLETION_MS = 8_500;

test.beforeEach(async ({ page }) => {
  // A fresh documentation-range client address per scenario, so repeated runs don't trip the
  // per-address velocity signal or rate limits.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${Math.floor(1 + Math.random() * 250)}` });
});

/** Need (unless the survey opens at Where), ZIP codes, date and size, ending at What we found. */
async function throughSize(page: Page, from: string, to: string, startAtNeed = true) {
  await page.goto(`${WEB_URL}/get-quotes/`);
  if (startAtNeed) {
    await expect(page.getByText("Step 1 of 8")).toBeVisible();
    await expect(page.locator('input[name="need"]:checked')).toHaveCount(0);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Choose what you need help with.")).toBeVisible();
    await page.getByLabel("Moving my home").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Where are you moving?" })).toBeFocused();
  } else {
    await expect(page.getByRole("heading", { name: "Where are you moving?" })).toBeVisible();
  }
  await page.getByLabel("ZIP code you're moving from").fill(from);
  await page.getByLabel("ZIP code you're moving to").fill(to);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Move date").fill(inDays(30));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator('input[name="moveSize"]:checked')).toHaveCount(0);
  await page.getByLabel("2 bedrooms").check();
  await page.getByRole("button", { name: "Check which movers serve my move" }).click();
}

async function details(page: Page, email: string, phone: string, firstName = "Avery") {
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await expect(page.getByText("Why we ask for your contact details")).toBeVisible();
  await expect(page.locator('input[type="checkbox"][id^="channel-"]:checked')).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Choose at least one way movers may contact you.")).toBeVisible();
  await page.getByLabel("Phone calls").check();
  await page.locator("#channel-email").check();
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Lindqvist");
  await page.locator("#email").fill(email);
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("quote survey", () => {
  test("Dallas to Houston names the Texas demo movers, caps the count, asks again after removals and stores the request", async ({ page }) => {
    test.setTimeout(90_000);
    const email = `avery.${Date.now()}@example.com`;
    await throughSize(page, "75201", "77002");
    await expect(page.getByRole("heading", { name: "5 movers in our network serve your move" })).toBeVisible();
    for (const name of TEXAS_MOVERS) await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByText(/USDOT 900000\d/).first()).toBeVisible();
    await expect(page.getByText(/Federal record checked/).first()).toBeVisible();
    // No contact fields before the visitor knows who serves the move.
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expectNoAxeViolations(page, "what we found");
    await page.getByRole("button", { name: "Continue" }).click();

    await details(page, email, uniquePhone());

    await expect(page.getByRole("radiogroup", { name: /How many moving companies/ }).or(page.getByRole("group", { name: /How many moving companies/ }))).toBeVisible();
    await expect(page.getByText("This is the most movers who can receive your details.")).toBeVisible();
    await expect(page.locator('input[name="limit"]')).toHaveCount(5);
    await expect(page.locator('input[name="limit"]:checked')).toHaveCount(0);
    await expect(page.locator('input[name="limit"]:disabled')).toHaveCount(0);
    await expectNoAxeViolations(page, "count");
    await page.locator('label[for="limit-3"]').click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Review and send" })).toBeVisible();
    await expect(page.locator("#main").getByText("American Moving Choice is an online service")).toBeVisible();
    const consent = page.locator("#consent");
    const consentLabel = page.locator('label[for="consent"]');
    await expect(consent).not.toBeChecked();
    await expect(page.locator("#terms")).not.toBeChecked();
    await expect(consentLabel).toContainText("Up to 3 of these movers may receive your details");
    await expect(consentLabel).not.toContainText("Terms of Use");
    await expect(consentLabel).not.toContainText("text message");
    await expectNoAxeViolations(page, "review");

    // Remove three movers: two remain, fewer than the 3 chosen, so the count question returns.
    const removeButtons = page.getByRole("button", { name: /^Remove / });
    const removed: string[] = [];
    for (let i = 0; i < 3; i++) {
      removed.push((await removeButtons.first().textContent())!.replace(/^Remove\s*/, "").trim());
      await removeButtons.first().click();
    }
    await expect(page.getByText("2 movers are left on the list, so choose again.")).toBeVisible();
    await expect(page.locator('input[name="limit"]:disabled')).toHaveCount(3);
    await expect(page.getByText("Only 2 movers in our network serve your move.").first()).toBeVisible();
    await expect(consent).toBeDisabled();

    // Without the consent box nothing is sent, and the profiles are offered instead.
    await page.locator('label[for="limit-2"]').click();
    await page.locator("#terms").check();
    await page.getByRole("button", { name: "Send my request" }).click();
    await expect(page.getByText("To send your request, tick the box")).toBeVisible();
    await expect(page.getByText("Prefer to contact a mover yourself?")).toBeVisible();
    await expect(consent).toBeFocused();

    await expect(consentLabel).toContainText("Up to 2 of these movers");
    for (const name of removed) await expect(consentLabel).not.toContainText(name);
    await consent.check();
    await page.waitForTimeout(MIN_COMPLETION_MS);
    await page.getByRole("button", { name: "Send my request" }).click();

    await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/confirmation/`);
    const reference = (await page.locator("strong.tabular").first().textContent())!.trim();
    expect(reference).toMatch(/^AMC-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    await expect(page.getByText("Up to 2 movers from this list can buy your request")).toBeVisible();
    await expect(page.getByText("Choose 1 and only one mover can ever receive your details from us")).toBeVisible();
    await expect(page.getByRole("link", { name: "report a concern", exact: true })).toBeVisible();
    await expectNoAxeViolations(page, "confirmation");

    await withDatabase(async (db) => {
      const lead = (await db.query("select id, group_id, status, selected_limit, channel_scope, move_type from leads where reference_code = $1", [reference])).rows[0];
      expect(lead).toMatchObject({ status: "qualified", selected_limit: 2, channel_scope: ["call", "email"], move_type: "intrastate" });
      const consentRow = (
        await db.query(
          "select cardinality(named_company_ids) as named, cardinality(removed_company_ids) as removed, rendered_text from consent_records where lead_id = $1",
          [lead.id],
        )
      ).rows[0];
      expect(consentRow).toMatchObject({ named: 2, removed: 3 });
      expect(consentRow.rendered_text).not.toMatch(/text message|STOP/);
      const eligibility = await db.query("select named_in_consent, count(*)::int as n from lead_eligibility where group_id = $1 group by 1 order by 1", [lead.group_id]);
      expect(eligibility.rows).toEqual([
        { named_in_consent: false, n: 3 },
        { named_in_consent: true, n: 2 },
      ]);
      const messages = await db.query("select distinct template from messages where related_id in ($1, $2)", [lead.id, lead.group_id]);
      expect(messages.rows.map((m) => m.template)).toContain("request_received");
    });

    // The confirmation page is cookie-backed: a reload shows the same request, the URL carries nothing.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible();
    await expect(page.getByText(reference).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("an Anchorage, Alaska move ends at What we found without asking for contact details", async ({ page }) => {
    await throughSize(page, "99501", "99503");
    await expect(page.getByRole("heading", { name: "No mover in our network serves this move yet" })).toBeVisible();
    await expect(page.getByText("We haven't asked for or shared any contact details")).toBeVisible();
    await expect(page.locator('input[type="email"], input[type="tel"], input[name="firstName"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
    await expectNoAxeViolations(page, "no coverage");
  });

  test("a repeat request joins the first; withdrawing it on the manage page blocks purchases and tells buyers", async ({ page }) => {
    test.skip(!hasDatabase, "needs a local test DATABASE_URL to buy the request and check the outbox");
    test.setTimeout(120_000);
    const email = `repeat.${Date.now()}@example.com`;
    const phone = uniquePhone();
    async function send(limit: string) {
      await throughSize(page, "75201", "77002");
      await page.getByRole("button", { name: "Continue" }).click();
      await details(page, email, phone);
      await page.locator(`label[for="limit-${limit}"]`).click();
      await page.getByRole("button", { name: "Continue" }).click();
      await page.locator("#consent").check();
      await page.locator("#terms").check();
      await page.waitForTimeout(MIN_COMPLETION_MS);
      await page.getByRole("button", { name: "Send my request" }).click();
      await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible({ timeout: 15_000 });
    }
    await send("3");
    const manageHref = await page.getByRole("link", { name: "Manage your request" }).getAttribute("href");
    expect(manageHref).toMatch(/\/my-request\/[A-Za-z0-9_-]{43}\/$/);
    await page.evaluate(() => sessionStorage.clear());
    await send("2");
    await expect(page.getByText("We already had a request from you for this route")).toBeVisible();
    await expect(page.getByText("Up to 2 movers from this list can buy your request")).toBeVisible();

    const groupId = await withDatabase(async (db) => {
      const leads = (await db.query("select group_id from leads where email = $1 order by created_at", [email])).rows;
      expect(leads).toHaveLength(2);
      expect(leads[0].group_id).toBe(leads[1].group_id);
      expect((await db.query("select sharing_limit from lead_groups where id = $1", [leads[0].group_id])).rows[0].sharing_limit).toBe(2);
      // A named mover buys it.
      const named = await db.query("select 1 from lead_eligibility where group_id = $1 and named_in_consent and company_id = $2", [leads[0].group_id, LONE_STAR_ID]);
      expect(named.rowCount).toBe(1);
      const attempt = (await db.query("select (reserve_purchase($1, $2, $3)).id", [LONE_STAR_ID, leads[0].group_id, `e2e-${Date.now()}`])).rows[0];
      await db.query("select complete_purchase($1, $2)", [attempt.id, `demo_e2e_${Date.now()}`]);
      return leads[0].group_id as string;
    });

    await page.goto(`${WEB_URL}${new URL(manageHref!, WEB_URL).pathname}`);
    await expect(page.getByRole("heading", { name: /^Request AMC-/ })).toBeVisible();
    await expect(page.getByText("Open", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Movers that bought your request" })).toBeVisible();
    await expect(page.getByText("Demo Lone Star Relocation Co.", { exact: true }).first()).toBeVisible();
    await expectNoAxeViolations(page, "manage");
    await page.getByRole("button", { name: "Withdraw my request" }).click();
    await expect(page.getByRole("dialog", { name: "Withdraw your request?" })).toBeVisible();
    await page.getByRole("button", { name: "Yes, withdraw it" }).click();
    await expect(page.getByText("Withdrawn", { exact: true })).toBeVisible({ timeout: 15_000 });

    await withDatabase(async (db) => {
      await expect(db.query("select reserve_purchase($1, $2, 'e2e-after-withdrawal')", [PIPELINE_SECOND_ID, groupId])).rejects.toThrow(/lead_unavailable/);
      const notices = await db.query("select to_address from messages where template = 'lead_withdrawn' and related_id = $1", [groupId]);
      expect(notices.rowCount).toBeGreaterThan(0);
      const audit = await db.query("select action from audit_log where entity_id = $1::text and action = 'lead.withdraw'", [groupId]);
      expect(audit.rowCount).toBe(1);
    });
  });

  test("a request started from a company profile lists that company first and offers only that company", async ({ page }) => {
    await page.goto(`${WEB_URL}/`);
    await page.evaluate((companyId) => sessionStorage.setItem("amc.survey.profile", JSON.stringify({ companyId })), MESQUITE_TRAIL_ID);
    await page.goto(`${WEB_URL}/get-quotes/`);
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.profile"))).toBeNull();
    await throughSize(page, "75201", "77002", false);
    await expect(page.locator("ul li").filter({ hasText: "USDOT" }).first()).toContainText("Demo Mesquite Trail Movers");
    await page.getByRole("button", { name: "Continue" }).click();
    await details(page, `profile.${Date.now()}@example.com`, uniquePhone());
    await page.getByLabel("Only Demo Mesquite Trail Movers").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("You chose only Demo Mesquite Trail Movers.")).toBeVisible();
    await expect(page.locator('label[for="consent"]')).toContainText(
      "Only 1 of these movers may receive your details and contact you: Demo Mesquite Trail Movers (USDOT 9000004).",
    );
  });

  test("tag policy: no third-party requests and nothing personal in any URL", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await throughSize(page, "75201", "77002");
    await expect(page.getByRole("heading", { name: /movers in our network serve your move/ })).toBeVisible();
    expect(requests.filter((u) => !u.startsWith(WEB_URL) && !u.startsWith("data:"))).toEqual([]);
    expect(requests.filter((u) => /75201|77002/.test(u))).toEqual([]);
  });

  test("the calculator's prefill (destinationZip, size, services) opens at Where for confirmation", async ({ page }) => {
    await page.goto(`${WEB_URL}/`);
    await page.evaluate(() =>
      sessionStorage.setItem(
        "amc.survey.prefill",
        JSON.stringify({ v: 1, source: "cost-calculator", originZip: "75201", destinationZip: "77002", moveSize: "3br", services: ["packing", "full_service"], confirm: true, modelVersion: "cost-model-v1" }),
      ),
    );
    await page.goto(`${WEB_URL}/get-quotes/`);
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
    await expect(page.getByText("Check the answers we carried over")).toBeVisible();
    await expect(page.getByLabel("ZIP code you're moving from")).toHaveValue("75201");
    await expect(page.getByLabel("ZIP code you're moving to")).toHaveValue("77002");
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.prefill"))).toBeNull();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Move date").fill(inDays(20));
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("3 bedrooms")).toBeChecked();
    await expect(page.getByLabel("Packing")).toBeChecked();
  });
});

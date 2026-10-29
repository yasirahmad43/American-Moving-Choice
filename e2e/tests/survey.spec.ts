/**
 * Slice S2 scenarios: the quote survey from the ZIP codes to the confirmation page, the
 * uncovered-route intake, a repeat request and withdrawal from the manage page, a request started from
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

/** Need (unless the survey opens at Where), ZIP codes, date and size, ending at contact details. */
async function throughSize(page: Page, from: string, to: string, startAtNeed = true) {
  await page.goto(`${WEB_URL}/get-quotes/`);
  if (startAtNeed) {
    await expect(page.getByText("Step 1 of 6")).toBeVisible();
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
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
}

async function details(page: Page, email: string, phone: string, firstName = "Avery") {
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await expect(page.locator('input[id^="channel-"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Review my request", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toBeFocused();
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Lindqvist");
  await page.locator("#email").fill(email);
  await page.getByLabel("Phone number").fill(phone);
}

test.describe("quote survey", () => {
  test("Dallas to Houston submits with a compact notice and stores accurate button evidence", async ({ page }) => {
    test.setTimeout(90_000);
    const email = `avery.${Date.now()}@example.com`;
    await throughSize(page, "75201", "77002");
    await expect(page.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
    for (const name of TEXAS_MOVERS) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    await expect(page.getByText(/USDOT 900000\d/)).toHaveCount(0);
    expect(await page.content()).not.toContain("demo-lone-star-relocation-co");
    await details(page, email, uniquePhone());

    await expect(page.getByRole("radiogroup", { name: /How many moving companies/ }).or(page.getByRole("group", { name: /How many moving companies/ }))).toBeVisible();
    await expect(page.locator('input[name="limit"]')).toHaveCount(5);
    await expect(page.locator('input[name="limit"]:checked')).toHaveCount(0);
    await expect(page.locator('input[name="limit"]:disabled')).toHaveCount(0);
    await expectNoAxeViolations(page, "count");
    await page.locator('label[for="limit-3"]').click();
    await page.getByRole("button", { name: "Review my request", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Review and send" })).toBeVisible();
    const roleStatement = page.locator("#main").getByText("American Moving Choice connects people planning a move with independent moving companies.");
    await expect(roleStatement).toBeVisible();
    await expect(roleStatement).toContainText("We don't transport belongings, give moving estimates, or book your move.");
    await expect(roleStatement).toContainText("Companies introduce themselves when they contact you.");
    const notice = page.locator("#submit-notice");
    await expect(page.locator("#consent,#terms")).toHaveCount(0);
    await expect(notice).toContainText("up to 3 moving companies");
    await expect(notice).toContainText("call or email me about my move");
    await expect(notice.getByRole("link", { name: "Terms of Use", exact: true })).toBeVisible();
    await expect(notice.getByRole("link", { name: "Privacy Policy", exact: true })).toBeVisible();
    await expect(notice).not.toContainText(/text messages|automated|prerecorded/i);
    await expectNoAxeViolations(page, "review");

    await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    for (const name of TEXAS_MOVERS) await expect(notice).not.toContainText(name);
    await page.waitForTimeout(MIN_COMPLETION_MS);
    await page.getByRole("button", { name: "Send my request" }).click();

    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/confirmation/`);
    const reference = (await page.locator("strong.tabular").first().textContent())!.trim();
    expect(reference).toMatch(/^AMC-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    await expect(page.getByText("Up to 3 participating moving companies may receive your details", { exact: false })).toBeVisible();
    await expect(page.getByText("Choose 1 and only one mover can receive your details from us")).toBeVisible();
    await expect(page.getByRole("link", { name: "report a concern", exact: true })).toBeVisible();
    await expectNoAxeViolations(page, "confirmation");

    await withDatabase(async (db) => {
      const lead = (await db.query("select id, group_id, status, selected_limit, channel_scope, move_type from leads where reference_code = $1", [reference])).rows[0];
      expect(lead).toMatchObject({ status: "qualified", selected_limit: 3, channel_scope: ["call", "email"], move_type: "intrastate" });
      const consentRow = (
        await db.query(
          "select cardinality(named_company_ids) as named, cardinality(removed_company_ids) as removed, recipient_disclosure_mode, rendered_text, checkbox_state, authorization_method, contact_automation from consent_records where lead_id = $1",
          [lead.id],
        )
      ).rows[0];
      expect(consentRow).toMatchObject({ named: 5, removed: 0, recipient_disclosure_mode: "request_intake", checkbox_state: false, authorization_method: "submit_button", contact_automation: "manual_only" });
      expect(consentRow.rendered_text).not.toMatch(/Demo|USDOT/);
      expect(consentRow.rendered_text).not.toMatch(/text message|STOP/);
      const eligibility = await db.query("select named_in_consent, count(*)::int as n from lead_eligibility where group_id = $1 group by 1 order by 1", [lead.group_id]);
      expect(eligibility.rows).toEqual([
        { named_in_consent: true, n: 5 },
      ]);
      const messages = await db.query("select distinct template from messages where related_id in ($1, $2)", [lead.id, lead.group_id]);
      expect(messages.rows.map((m) => m.template)).toContain("request_received");
    });

    // The confirmation page is cookie-backed: a reload shows the same request, the URL carries nothing.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    await expect(page.getByText(reference).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("an Anchorage, Alaska move can continue to contact details without an availability rejection", async ({ page }) => {
    await throughSize(page, "99501", "99503");
    await expect(page.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
    await expect(page.getByLabel("First name", { exact: true })).toBeVisible();
    await expect(page.locator('input[id^="channel-"]')).toHaveCount(0);
    await expect(page.getByText(/No mover in our network serves|matching|matched/i)).toHaveCount(0);
    await expect(page.locator('input[name="limit"]:disabled')).toHaveCount(0);
    await expectNoAxeViolations(page, "uncovered request details");
  });

  test("a repeat request joins the first; withdrawing it on the manage page blocks purchases and tells buyers", async ({ page }) => {
    test.skip(!hasDatabase, "needs a local test DATABASE_URL to buy the request and check the outbox");
    test.setTimeout(120_000);
    const email = `repeat.${Date.now()}@example.com`;
    const phone = uniquePhone();
    async function send(limit: string) {
      await throughSize(page, "75201", "77002");
      await details(page, email, phone);
      await page.locator(`label[for="limit-${limit}"]`).click();
      await page.getByRole("button", { name: "Review my request", exact: true }).click();
      await page.waitForTimeout(MIN_COMPLETION_MS);
      await page.getByRole("button", { name: "Send my request" }).click();
      await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible({ timeout: 15_000 });
    }
    await send("3");
    const manageHref = await page.getByRole("link", { name: "Manage your request" }).getAttribute("href");
    expect(manageHref).toMatch(/\/my-request\/[A-Za-z0-9_-]{43}\/$/);
    await page.evaluate(() => sessionStorage.clear());
    await send("2");
    await expect(page.getByText("We already had a request from you for this route")).toBeVisible();
    await expect(page.getByText("Up to 2 participating moving companies may receive your details")).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "What happens next" })).toBeVisible();
    await expect(page.getByText("Demo Lone Star Relocation Co.", { exact: true })).toHaveCount(0);
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

  test("old profile session data cannot select or reveal a company", async ({ page }) => {
    await page.goto(`${WEB_URL}/`);
    await page.evaluate((companyId) => sessionStorage.setItem("amc.survey.profile", JSON.stringify({ companyId })), MESQUITE_TRAIL_ID);
    await page.goto(`${WEB_URL}/get-quotes/`);
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.profile"))).toBeNull();
    await throughSize(page, "75201", "77002", false);
    for (const name of TEXAS_MOVERS) await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    await details(page, `profile.${Date.now()}@example.com`, uniquePhone());
    await expect(page.getByLabel(/^Only Demo /)).toHaveCount(0);
    await page.locator('label[for="limit-1"]').click();
    await page.getByRole("button", { name: "Review my request", exact: true }).click();
    await expect(page.locator("#submit-notice")).toContainText("1 moving company");
    expect(await page.content()).not.toMatch(/Demo Mesquite|9000004/);
  });

  test("tag policy: no third-party requests and nothing personal in any URL", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await throughSize(page, "75201", "77002");
    await expect(page.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
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
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
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

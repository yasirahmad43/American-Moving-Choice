import { expect, test, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { hasDatabase, withDatabase } from "../tests/env";

const base = (process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const local = ["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname);
const future = new Date(); future.setDate(future.getDate() + 30);
const moveDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
const availabilityCopy = /\b(?:matching|matched|unmatched)\b|no mover.{0,60}serves|\d+ movers? in our network/i;

/** Only the non-contact move lookup may POST in the public proof. */
async function protectPublicSubmission(context: BrowserContext) {
  const denied: string[] = [];
  await context.route("**/*", route => {
    const request = route.request();
    if (["GET", "HEAD"].includes(request.method())) return route.continue();
    const body = request.postData() ?? "";
    const moveOnly = request.method() === "POST" && new URL(request.url()).pathname === "/get-quotes/" &&
      Boolean(request.headers()["next-action"]) && ["originZip", "destZip", "moveSize"].every(key => body.includes(key)) &&
      !/firstName|lastName|email|phone|consentChecked|termsAccepted|renderedTextSha256|authorizationMethod|contactAutomation/i.test(body);
    if (moveOnly) return route.continue();
    denied.push(`${request.method()} ${new URL(request.url()).pathname}`);
    return route.abort();
  });
  return denied;
}

async function reachReview(page: Page, info: TestInfo, phone: string, email: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const starter = page.locator("#hero-survey .vsh-start");
  await expect(starter).toHaveAttribute("data-ready", "true");
  await starter.getByLabel("Moving from · ZIP code").fill("12207");
  await starter.getByLabel("Moving to · ZIP code").fill("12121");
  await starter.locator('button[type="submit"]').click();
  await starter.getByLabel("What are you moving?").selectOption("2br");
  await starter.getByLabel("Estimated move date").fill(moveDate);
  await starter.locator('button[type="submit"]').click();
  await page.waitForURL(base + "/get-quotes/", { waitUntil: "domcontentloaded" });
  const full = page.locator(".quote-survey-full");
  await expect(full).toContainText("Step 3 of 5");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Your details", exact: true })).toBeVisible({ timeout: 20_000 });
  const lookupCompletedAt = Date.now();
  await expect(full).toContainText("Step 4 of 5");
  await expect(full).toContainText("Albany, NY");
  await expect(full).toContainText("Melrose, NY");
  await expect(full).not.toContainText(availabilityCopy);
  await full.screenshot({ path: info.outputPath("move-details.png") });
  await expect(full.locator('input[id^="channel-"],#consent,#terms')).toHaveCount(0);
  await expect(full).not.toContainText("How may we contact you about your move?");
  await full.getByLabel("First name", { exact: true }).fill("Intake");
  await full.getByLabel("Last name", { exact: true }).fill("Verification");
  await full.locator("#email").fill(email);
  await full.getByLabel("Phone number", { exact: true }).fill(phone);
  const counts = full.locator('input[name="limit"]');
  await expect(counts).toHaveCount(5);
  await expect(full.locator('input[name="limit"]:checked')).toHaveCount(0);
  for (const choice of await counts.all()) await expect(choice).toBeEnabled();
  await full.locator('label[for="limit-5"]').click();
  await full.getByRole("button", { name: "Review my request", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Review and send", exact: true })).toBeVisible();
  await expect(full).toContainText("Step 5 of 5");
  await expect(full).not.toContainText(availabilityCopy);
  await expect(full.locator('input[type="checkbox"],input[id^="channel-"]')).toHaveCount(0);
  const notice = full.locator("#submit-notice");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("By sending, I authorize American Moving Choice and up to 5 moving companies");
  await expect(notice).toContainText("call or email me about my move");
  await expect(notice).not.toContainText(/text messages|automated|prerecorded|Message and data rates|Consent isn't required/i);
  await expect(notice.getByRole("link", { name: "Terms of Use", exact: true })).toHaveAttribute("href", "/terms/");
  await expect(notice.getByRole("link", { name: "Privacy Policy", exact: true })).toHaveAttribute("href", "/privacy/");
  const send = full.getByRole("button", { name: "Send my request", exact: true });
  await expect(send).toBeEnabled();
  await expect(send).toHaveAttribute("aria-describedby", /submit-notice/);
  await notice.scrollIntoViewIfNeeded();
  const noticeBox = await notice.boundingBox(), sendBox = await send.boundingBox();
  expect(noticeBox).not.toBeNull(); expect(sendBox).not.toBeNull();
  const gap = Math.max(sendBox!.y - (noticeBox!.y + noticeBox!.height), noticeBox!.y - (sendBox!.y + sendBox!.height), 0);
  expect(gap, "submit notice remains beside its action").toBeLessThanOrEqual(120);
  const noticeText = ((await notice.textContent()) ?? "").trim();
  await notice.screenshot({ path: info.outputPath("submit-notice.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  return { full, noticeText, lookupCompletedAt };
}

for (const width of [319, 1440]) {
  test(`uncovered route reaches review without availability messages at ${width}px`, async ({ page, context }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const denied = await protectPublicSubmission(context);
    await reachReview(page, info, "2025550199", `intake-preview-${Date.now()}@example.com`);
    // No Send click: this case is also safe against production.
    expect(denied).toEqual([]);
  });
}

test("uncovered request is stored and can be withdrawn on the isolated local site", async ({ page }, info) => {
  test.skip(!local || !hasDatabase, "Saving a synthetic request requires an isolated local test database.");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.231" });
  const phone = await withDatabase(async db => {
    await db.query("set search_path to amc, public");
    const existing = new Set((await db.query<{ phone_e164: string }>("select phone_e164 from leads where phone_e164 like '+120255501%'" )).rows.map(row => row.phone_e164));
    const value = Array.from({ length: 100 }, (_, index) => `+120255501${String(index).padStart(2, "0")}`).find(candidate => !existing.has(candidate));
    if (!value) throw new Error("The reserved fictional test phone pool is exhausted.");
    return value.slice(2);
  });
  expect(phone).toBeTruthy();
  const email = `uncovered-intake-${Date.now()}@example.com`;
  const { full, noticeText, lookupCompletedAt } = await reachReview(page, info, phone!, email);
  const clientCompletionMs = Date.now() - lookupCompletedAt;
  await full.getByRole("button", { name: "Send my request", exact: true }).click();
  await expect(page).toHaveURL(base + "/get-quotes/confirmation/");
  await page.reload({ waitUntil: "domcontentloaded" });
  const receipt = page.getByRole("heading", { name: "Request received", exact: true }).locator("xpath=../..");
  await expect(receipt).toBeVisible({ timeout: 20_000 });
  await expect(receipt).not.toContainText(availabilityCopy);
  const saved = await withDatabase(async db => {
    await db.query("set search_path to amc, public");
    return (await db.query<{ id: string; group_id: string; status: string; channel_scope: string[]; request_intake_pending: boolean; eligible: number; mover_notices: number; recipient_count: number; checkbox_state: boolean; authorization_method: string; contact_automation: string; terms_accepted: boolean; privacy_acknowledged: boolean; rendered_text: string; consent_text_version_id: string; form_version: string; recipient_disclosure_mode: string; completion_result: string; completion_reason: string }>(
      `select l.id,l.group_id,l.status,l.channel_scope,g.request_intake_pending,
              c.checkbox_state,c.authorization_method,c.contact_automation,c.terms_accepted,c.privacy_acknowledged,c.rendered_text,
              c.consent_text_version_id,c.form_version,c.recipient_disclosure_mode,
              (select v.result from lead_validation_results v where v.lead_id=l.id and v.check_type='min_completion_time') completion_result,
              (select v.reason from lead_validation_results v where v.lead_id=l.id and v.check_type='min_completion_time') completion_reason,
              (select count(*)::int from lead_eligibility e where e.group_id=l.group_id and e.named_in_consent) eligible,
              (select count(*)::int from messages m where m.related_id=l.group_id and m.template='lead_available') mover_notices,
              cardinality(c.named_company_ids) recipient_count
         from leads l join lead_groups g on g.id=l.group_id join consent_records c on c.lead_id=l.id where l.email=$1 order by l.created_at desc limit 1`, [email],
    )).rows[0];
  });
  expect(saved).toMatchObject({ status: "unmatched", channel_scope: ["call", "email"], request_intake_pending: true, eligible: 0, mover_notices: 0, recipient_count: 0, checkbox_state: false, authorization_method: "submit_button", contact_automation: "manual_only", terms_accepted: true, privacy_acknowledged: true, consent_text_version_id: "contact-request-submit-v1", form_version: "survey-v3-compact-submit", recipient_disclosure_mode: "request_intake" });
  expect(saved!.rendered_text).toBe(noticeText);
  const serverSeconds = Number(/^Sent (\d+) seconds/.exec(saved!.completion_reason)?.[1]);
  if (serverSeconds < 8) {
    expect(saved).toMatchObject({ completion_result: "flag", completion_reason: expect.stringContaining("Accepted compact request") });
  }
  await info.attach("submission-timing", { body: JSON.stringify({ clientCompletionMs, artificialWait: false, serverResult: saved!.completion_result, serverReason: saved!.completion_reason }), contentType: "application/json" });
  await receipt.screenshot({ path: info.outputPath("request-received.png") });
  await receipt.getByRole("link", { name: "Manage your request", exact: true }).click();
  await expect(page.getByText("Request received", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Withdraw my request", exact: true }).click();
  await page.getByRole("button", { name: "Yes, withdraw it", exact: true }).click();
  await withDatabase(async db => {
    await db.query("set search_path to amc, public");
    await expect.poll(async () => (await db.query("select status from lead_groups where id=$1", [saved!.group_id])).rows[0]?.status).toBe("withdrawn");
  });
  await expect(page.getByText("Withdrawn", { exact: true })).toBeVisible();
  await expect(page.getByText(/You withdrew this request on/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What happens next", exact: true })).toHaveCount(0);
});

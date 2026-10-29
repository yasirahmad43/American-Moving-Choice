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
      !/firstName|lastName|email|phone|consentChecked|termsAccepted|renderedTextSha256/i.test(body);
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
  await expect(full).toContainText("Step 3 of 7");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Your move details", exact: true })).toBeVisible({ timeout: 20_000 });
  const checkedAt = Date.now();
  await expect(full).toContainText("Albany, NY to Melrose, NY");
  await expect(full).not.toContainText(availabilityCopy);
  await full.screenshot({ path: info.outputPath("move-details.png") });
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
  await full.locator("#channel-email").check();
  await full.getByLabel("First name", { exact: true }).fill("Intake");
  await full.getByLabel("Last name", { exact: true }).fill("Verification");
  await full.locator("#email").fill(email);
  await full.getByLabel("Phone number", { exact: true }).fill(phone);
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 6 of 7");
  const counts = full.locator('input[name="limit"]');
  await expect(counts).toHaveCount(5);
  await expect(full.locator('input[name="limit"]:checked')).toHaveCount(0);
  for (const choice of await counts.all()) await expect(choice).toBeEnabled();
  await full.locator('label[for="limit-5"]').click();
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Review and send", exact: true })).toBeVisible();
  await expect(full).toContainText("Step 7 of 7");
  await expect(full).not.toContainText(availabilityCopy);
  await expect(full.locator("#consent")).toBeEnabled();
  await expect(full.locator("#consent")).not.toBeChecked();
  await expect(full.locator("#terms")).not.toBeChecked();
  await expect(full.locator('label[for="consent"]')).toContainText("American Moving Choice and up to 5 participating moving companies");
  await full.locator('label[for="consent"]').screenshot({ path: info.outputPath("contact-permission.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  return { full, checkedAt };
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
  const { full, checkedAt } = await reachReview(page, info, phone!, email);
  await full.locator("#consent").check();
  await full.locator("#terms").check();
  // Respect the existing eight-second anti-bot minimum without changing signed tickets.
  const remaining = 9_000 - (Date.now() - checkedAt);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await full.getByRole("button", { name: "Send my request", exact: true }).click();
  await expect(full.getByRole("heading", { name: "Request received", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(base + "/get-quotes/confirmation/");
  await expect(full).not.toContainText(availabilityCopy);
  const saved = await withDatabase(async db => {
    await db.query("set search_path to amc, public");
    return (await db.query<{ id: string; group_id: string; status: string; request_intake_pending: boolean; eligible: number; mover_notices: number; recipient_count: number }>(
      `select l.id,l.group_id,l.status,g.request_intake_pending,
              (select count(*)::int from lead_eligibility e where e.group_id=l.group_id and e.named_in_consent) eligible,
              (select count(*)::int from messages m where m.related_id=l.group_id and m.template='lead_available') mover_notices,
              (select cardinality(c.named_company_ids) from consent_records c where c.lead_id=l.id) recipient_count
         from leads l join lead_groups g on g.id=l.group_id where l.email=$1 order by l.created_at desc limit 1`, [email],
    )).rows[0];
  });
  expect(saved).toMatchObject({ status: "unmatched", request_intake_pending: true, eligible: 0, mover_notices: 0, recipient_count: 0 });
  await full.screenshot({ path: info.outputPath("request-received.png") });
  await full.getByRole("link", { name: "Manage your request", exact: true }).click();
  await expect(page.getByText("Request received", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Withdraw my request", exact: true }).click();
  await page.getByRole("button", { name: "Yes, withdraw it", exact: true }).click();
  await expect(page.getByText("Your request is withdrawn", { exact: true })).toBeVisible();
  await withDatabase(async db => {
    await db.query("set search_path to amc, public");
    expect((await db.query("select status from lead_groups where id=$1", [saved!.group_id])).rows[0]?.status).toBe("withdrawn");
  });
});

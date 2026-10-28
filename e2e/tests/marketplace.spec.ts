/**
 * Slice S6 scenarios: the marketplace preview, the demo card on the billing page, and a request a
 * consumer sends through the survey that the seeded mover buys, then works in the CRM (contact
 * details, a note, a stage, the pipeline), with the consumer's purchase notice and the exclusive
 * request refused to every other company.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";
import { APP_URL, WEB_URL, withDatabase } from "./env";
import { expectNoSeriousAxeViolations, inDays, signInMover, uniqueLetters, uniquePhone } from "./helpers";

const LONE_STAR_ID = "c0000000-0000-4000-8000-000000000001";
const LONE_STAR = "Demo Lone Star Relocation Co.";

/** Saves the demo card, first removing any card an earlier run saved, so the authorization step runs every time. */
async function saveDemoCard(page: Page) {
  await page.goto(`${APP_URL}/portal/billing`);
  const remove = page.getByRole("button", { name: "Remove", exact: true });
  while ((await remove.count()) > 0) {
    await remove.first().click();
    await page.waitForLoadState("networkidle");
  }
  await expect(page.getByRole("button", { name: "Save demo card" })).toBeVisible();
  await page.getByRole("button", { name: "Save demo card" }).click();
  await expect(page.getByText(/Tick the authorization box/)).toBeVisible();
  await page.getByLabel(/I authorize American Moving Choice/).check();
  await page.getByRole("button", { name: "Save demo card" }).click();
  await expect(page.getByText("Demo card: no money moves")).toBeVisible();
}

/**
 * Sends an exclusive request for Dallas to Houston from Demo Lone Star's profile, through the
 * survey in its own browser context, and returns the request's reference code.
 */
async function sendExclusiveRequest(browser: Browser, person: { firstName: string; lastName: string; email: string; phone: string }): Promise<string> {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${Math.floor(1 + Math.random() * 250)}` } });
  const page = await context.newPage();
  await page.goto(`${WEB_URL}/get-quotes/?entry=household`);
  await expect(page.getByRole("heading", { name: "Where are you moving?" })).toBeVisible();
  await page.getByLabel("ZIP code you're moving from").fill("75201");
  await page.getByLabel("ZIP code you're moving to").fill("77002");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Move date").fill(inDays(30));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("2 bedrooms").check();
  await page.getByRole("button", { name: "Check which movers serve my move" }).click();
  await expect(page.getByText(LONE_STAR, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Phone calls").check();
  await page.locator("#channel-email").check();
  await page.getByLabel("First name").fill(person.firstName);
  await page.getByLabel("Last name").fill(person.lastName);
  await page.locator("#email").fill(person.email);
  await page.getByLabel("Phone number").fill(person.phone);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('label[for="limit-1"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("#consent").check();
  await page.locator("#terms").check();
  await page.waitForTimeout(8_500); // the minimum completion time since the coverage check
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible({ timeout: 15_000 });
  const reference = (await page.locator("strong.tabular").first().textContent())!.trim();
  await context.close();
  return reference;
}

test.describe("marketplace", () => {
  test.beforeEach(async () => {
    await withDatabase((db) => db.query("delete from rate_limits where key like 'login:%' or key like 'purchase:%' or key like 'survey:%'"));
  });

  test("a preview card shows the first name and route but never the surname, email or phone", async ({ page }) => {
    await signInMover(page);
    await page.goto(`${APP_URL}/portal/marketplace`);
    const card = page.getByRole("article").filter({ hasText: "Priya" });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Exclusive");
    await expect(card).toContainText("Phone, email and last name unlock after purchase.");
    await expect(card.getByRole("button", { name: /Buy exclusive request/ })).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(/priya\.example|Priya Example|\+?1?305\D?555\D?0142/i);
    await expectNoSeriousAxeViolations(page, "marketplace");
  });

  test("the demo card needs the authorization box ticked", async ({ page }) => {
    await signInMover(page);
    await saveDemoCard(page);
    await expectNoSeriousAxeViolations(page, "billing");
  });

  test("a mover buys an exclusive request a consumer just sent and works it in the CRM", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const person = { firstName: `Rowan ${uniqueLetters(1).toUpperCase()}${uniqueLetters(5)}`, lastName: "Exampleford", email: `rowan.${Date.now()}@example.com`, phone: uniquePhone("305") };
    const reference = await sendExclusiveRequest(browser, person);
    expect(reference).toMatch(/^AMC-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

    await signInMover(page);
    await saveDemoCard(page);
    await page.goto(`${APP_URL}/portal/marketplace`);
    const card = page.getByRole("article").filter({ hasText: `${person.firstName}:` });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Dallas, TX");
    await expect(card).toContainText("Houston, TX");
    await expect(card).not.toContainText(person.lastName);

    await card.getByRole("button", { name: /Buy exclusive request/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Buy this exclusive request for");
    await dialog.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(dialog.getByText(/Purchased\./)).toBeVisible({ timeout: 20_000 });
    await dialog.getByRole("link", { name: "Open contact details" }).click();
    await expect(page).toHaveURL(/\/portal\/leads\/[0-9a-f-]{36}$/);

    const contact = page.locator("main");
    await expect(page.getByRole("heading", { level: 2, name: "Contact details" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${person.firstName} ${person.lastName}`);
    await expect(contact).toContainText(person.email);
    await expect(contact).toContainText(`(${person.phone.slice(0, 3)}) ${person.phone.slice(3, 6)}-${person.phone.slice(6)}`);
    await expect(page.getByText(reference).first()).toBeVisible();
    await expectNoSeriousAxeViolations(page, "lead");

    await page.getByLabel("New note").fill("Called, left a voicemail (e2e).");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Note added.")).toBeVisible();
    await expect(page.getByRole("list", { name: "Notes and activity, newest first" })).toContainText("Called, left a voicemail (e2e).");
    await page.getByLabel("Stage", { exact: true }).selectOption("contacted");
    await page.getByRole("button", { name: "Save stage" }).click();
    await expect(page.getByText("Stage saved.")).toBeVisible();

    await page.goto(`${APP_URL}/portal/pipeline`);
    const contacted = page.locator("section").filter({ has: page.getByRole("heading", { name: /^Contacted \(\d+\)/ }) });
    await expect(contacted).toContainText(person.firstName);
    await page.goto(`${APP_URL}/portal/leads`);
    await expect(page.getByText(`${person.firstName} ${person.lastName}`).first()).toBeVisible();
    await page.goto(`${APP_URL}/portal/reviews`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto(`${APP_URL}/portal/billing`);
    await expect(page.getByRole("table", { name: "Receipts" })).toBeVisible();

    await withDatabase(async (db) => {
      const group = (await db.query<{ id: string; status: string }>("select g.id, g.status from lead_groups g join leads l on l.group_id = g.id where l.reference_code = $1", [reference])).rows[0]!;
      expect(group.status).toBe("sold_out");
      const notice = await db.query("select status, body_text, subject from messages where template = 'purchase_notice' and to_address = $1", [person.email]);
      expect(notice.rowCount).toBe(1);
      expect(JSON.stringify(notice.rows)).not.toContain(LONE_STAR);
      // An exclusive request sold once is refused to any other company.
      const other = (await db.query<{ id: string }>("select id from companies where status = 'approved' and id <> $1 limit 1", [LONE_STAR_ID])).rows[0]!;
      await expect(db.query("select * from reserve_purchase($1, $2, 'e2e-second-company')", [other.id, group.id])).rejects.toThrow();
    });
  });
});

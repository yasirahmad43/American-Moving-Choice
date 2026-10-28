/**
 * Slice S5 scenarios: company signup and the seven-step application (FMCSA fixtures 9000050, an
 * active carrier, and 9000090, a broker), the approved company's dashboard, coverage rules and
 * the coverage test tool, team invitations, and the profile and settings pages.
 */
import { randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, decryptMessageBody, hasDatabase, hasEncryptionKey, withDatabase } from "./env";
import { expectNoSeriousAxeViolations, signInMover } from "./helpers";

const LONE_STAR_ID = "c0000000-0000-4000-8000-000000000001";
const NEXT_YEAR = `${new Date().getFullYear() + 1}-06-30`;

test.beforeEach(async () => {
  await withDatabase((db) => db.query("delete from rate_limits where key like 'signup:%' or key like 'login:%' or key like 'invite:%' or key like 'coverage:%' or key like 'team:%'"));
});

async function signUp(page: Page, usdot: string, legalName: string, email: string) {
  await page.goto(`${APP_URL}/signup`);
  await page.getByLabel("Your full name").fill("Dana Demo");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(`e2e-${randomBytes(9).toString("base64url")}`);
  await page.getByLabel("Legal company name").fill(legalName);
  await page.getByLabel("USDOT number").fill(usdot);
  await page.getByLabel("MC number").fill(`MC-${usdot}`);
  await page.getByLabel("Company phone").fill("(737) 555-0150");
  await page.getByRole("button", { name: "Create account and continue" }).click();
  await expect(page).toHaveURL(`${APP_URL}/portal`);
}

async function completeApplication(page: Page, legalName: string, usdot: string) {
  await page.getByRole("link", { name: /Start the application/ }).click();
  await expect(page.getByRole("heading", { name: "Company details", level: 2 })).toBeVisible();
  await expectNoSeriousAxeViolations(page, "application/company");
  // The legal name carries over from signup.
  await expect(page.getByLabel("Legal company name")).toHaveValue(legalName);
  await page.getByLabel("Street address").fill("PO Box 12");
  await page.getByLabel("City").fill("Austin");
  await page.getByLabel("State", { exact: true }).selectOption("TX");
  await page.getByLabel("ZIP code").fill("78701");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("We can't accept a PO box or mailbox.").first()).toBeVisible();
  await expect(page.getByLabel("Street address")).toBeFocused();
  await page.getByLabel("Street address").fill("100 Demo Fixture Road");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Federal numbers", level: 2 })).toBeVisible();
  await expect(page.getByText("Why we ask for an MC number")).toBeVisible();
  await expect(page.getByLabel("USDOT number")).toHaveValue(usdot);
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Services you offer", level: 2 })).toBeVisible();
  await page.getByRole("group", { name: "Move types" }).getByLabel("Local (same state, short distance)").check();
  await page.getByRole("group", { name: "Move types" }).getByLabel("Long-distance within one state").check();
  await page.getByRole("group", { name: "Move sizes" }).getByLabel("2 bedrooms").check();
  await page.getByRole("group", { name: "Services" }).getByLabel(/Full-service/).check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Where you work", level: 2 })).toBeVisible();
  await page.getByRole("group", { name: "States you work in" }).getByLabel("Texas").check();
  await page.getByLabel("Moves that start and end in these states").check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { name: "State credentials", level: 2 })).toBeVisible();

  // Leaving and coming back keeps the progress.
  await page.goto(`${APP_URL}/portal`);
  await expect(page.getByText("4 of 7 steps saved")).toBeVisible();
  await page.getByRole("link", { name: "Continue the application" }).click();

  await expect(page.getByRole("heading", { name: "State credentials", level: 2 })).toBeVisible();
  await page.getByLabel("Issuing state").first().selectOption("TX");
  await page.getByLabel("Credential number").first().fill("006000050C");
  await page.getByLabel("Expiry date").first().fill(NEXT_YEAR);
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Insurance certificate", level: 2 })).toBeVisible();
  await page.getByLabel("Insurance company").fill("Demo Mutual");
  await page.getByLabel("Policy number").fill("DM-50");
  await page.getByLabel("Policy expiry date").fill(NEXT_YEAR);
  await page.getByLabel("Cargo").check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Authorized representative", level: 2 })).toBeVisible();
  await page.getByLabel("Full name").fill("Dana Demo");
  await page.getByLabel("Job title").fill("Owner");
  await page.getByLabel("Email").fill("dana@demo.invalid");
  await page.getByLabel("Mobile number").fill("(737) 555-0150");
  await page.getByLabel(/authorized to act for the company/).check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page.getByRole("heading", { name: "Review and submit", level: 2 })).toBeVisible();
  await expect(page.getByText("Mover terms (summary)")).toBeVisible();
  await expectNoSeriousAxeViolations(page, "application/review");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Accept the mover terms to submit the application.")).toBeVisible();
  await page.getByLabel(/I accept the mover terms/).check();
  await page.getByRole("button", { name: "Submit application" }).click();
}

test.describe("company application", () => {
  test("signup and the application for USDOT 9000050 end in review with the checks recorded", async ({ page }) => {
    test.setTimeout(90_000);
    const legalName = "Demo Fixture Carrier 9000050";
    await signUp(page, "9000050", legalName, `dana-${randomBytes(3).toString("hex")}@demo.invalid`);
    await expectNoSeriousAxeViolations(page, "dashboard/applied");
    await completeApplication(page, legalName, "9000050");
    await expect(page).toHaveURL(/\/portal\?submitted=in_review/);
    await expect(page.getByRole("status").getByText("Application submitted")).toBeVisible();
    await expect(page.getByRole("banner").getByText("In review")).toBeVisible();
    await expect(page.getByText("A reviewer is looking at your application")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Status history" })).toBeVisible();

    await page.getByRole("link", { name: "Verification", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "USDOT registration" })).toBeVisible();
    await expect(page.getByText("Your USDOT registration is active.")).toBeVisible();
    await expect(page.getByText("FMCSA records (demo data in this preview)").first()).toBeVisible();
    await expectNoSeriousAxeViolations(page, "verification");

    const company = await withDatabase(async (db) => {
      const result = await db.query(
        "select c.status, (select count(*)::int from verification_checks v where v.company_id = c.id) as checks from companies c where c.usdot_number = '9000050' order by c.created_at desc limit 1",
      );
      return result.rows[0];
    });
    if (company) expect(company).toEqual({ status: "in_review", checks: 6 });

    await page.goto(`${APP_URL}/portal/application`);
    await expect(page.getByText("Your application has been submitted")).toBeVisible();
  });

  test("the broker fixture USDOT 9000090 is rejected with the reason", async ({ page }) => {
    test.setTimeout(90_000);
    const legalName = "Demo Broker Only 9000090";
    await signUp(page, "9000090", legalName, `broker-${randomBytes(3).toString("hex")}@demo.invalid`);
    await completeApplication(page, legalName, "9000090");
    await expect(page).toHaveURL(/\/portal\?submitted=rejected/);
    await expect(page.getByText("Your application wasn't accepted")).toBeVisible();
    await expect(page.getByText(/The FMCSA record shows broker authority/).first()).toBeVisible();
  });

  // Slice S7 (admin approval) is still in progress: approving the in-review applicant above and
  // its first sign-in as an approved company belong here once the admin queue exists.
  test.fixme("an admin approves the in-review applicant and the company sees the approved dashboard", async () => {});
});

test.describe("approved company", () => {
  test("dashboard, coverage rules that bump the coverage version, and the coverage test tool", async ({ page }) => {
    await withDatabase((db) => db.query("delete from coverage_rules where label = 'No Houston pickups'"));
    await signInMover(page);
    await expect(page.getByRole("heading", { name: "This month" })).toBeVisible();
    await expect(page.getByText("Requests available to you")).toBeVisible();
    await expectNoSeriousAxeViolations(page, "dashboard/approved");

    await page.goto(`${APP_URL}/portal/coverage`);
    await expect(page.getByText("Changes apply to future requests only")).toBeVisible();
    await expectNoSeriousAxeViolations(page, "coverage");
    const coverageVersion = () =>
      withDatabase(async (db) => (await db.query<{ v: number }>("select coverage_version as v from companies where id = $1", [LONE_STAR_ID])).rows[0]!.v);
    const before = await coverageVersion();

    // Austin to Houston matches the seeded Texas statewide rule.
    await page.getByLabel("Pickup ZIP code").fill("78704");
    await page.getByLabel("Destination ZIP code").fill("77007");
    await page.getByRole("button", { name: "Test this move" }).click();
    await expect(page.getByText("This move would reach you")).toBeVisible();
    await expect(page.getByText('Matched by "Texas statewide: local and intrastate".')).toBeVisible();

    // An exclusion for Harris County pickups.
    await page.getByRole("button", { name: "Add a rule" }).click();
    await expect(page.getByRole("heading", { name: "New rule" })).toBeFocused();
    await page.getByLabel("Removes coverage (exclude)").check();
    await page.getByLabel("Name").fill("No Houston pickups");
    const pickup = page.getByRole("group", { name: "Pickup area" });
    await pickup.getByLabel("Add counties from").selectOption("TX");
    await pickup.getByLabel("Filter counties").fill("Harris");
    await pickup.getByLabel("Harris", { exact: true }).check();
    await expect(pickup.getByRole("button", { name: /Harris, TX/ })).toBeVisible();
    await page.getByRole("button", { name: "Add rule" }).click();
    await expect(page.getByText("Rule added. It applies to future requests only.")).toBeVisible();
    await expect(page.getByText("No Houston pickups", { exact: true }).first()).toBeVisible();
    const after = await coverageVersion();
    if (before !== undefined && after !== undefined) {
      expect(after).toBeGreaterThan(before);
      await expect(page.getByText(`Coverage version ${after}.`)).toBeVisible();
    }

    await page.getByLabel("Pickup ZIP code").fill("77007");
    await page.getByLabel("Destination ZIP code").fill("78704");
    await page.getByRole("button", { name: "Test this move" }).click();
    await expect(page.getByText("This move wouldn't reach you")).toBeVisible();
    await expect(page.getByText(/"No Houston pickups"/).last()).toBeVisible();

    // Server-side validation: a ZIP code that doesn't exist.
    await page.getByRole("button", { name: "Add a rule" }).click();
    await page.getByRole("group", { name: "Pickup area" }).getByLabel("ZIP codes").fill("00000");
    await page.getByRole("button", { name: "Add rule" }).click();
    await expect(page.getByText(/isn't one we know/)).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    // Pause, then delete the exclusion.
    await page.getByRole("button", { name: "Pause No Houston pickups" }).click();
    await expect(page.getByText("Rule paused.")).toBeVisible();
    await page.getByRole("button", { name: "Delete No Houston pickups" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete rule" }).click();
    await expect(page.getByText("Rule deleted.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete No Houston pickups" })).toHaveCount(0);
  });

  test("an invitation from the team page lets a new user join with the invited role", async ({ page, browser }) => {
    test.skip(!hasDatabase || !hasEncryptionKey, "needs a local test DATABASE_URL and the app's APP_ENCRYPTION_KEY to read the invitation from the demo mailbox");
    await signInMover(page);
    await page.goto(`${APP_URL}/portal/team`);
    await expectNoSeriousAxeViolations(page, "team");
    const email = `agent-${randomBytes(3).toString("hex")}@demo.invalid`;
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Role").first().selectOption("agent");
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByText(`Invitation sent to ${email}`)).toBeVisible();
    await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();

    const message = await withDatabase(async (db) => {
      const result = await db.query<{ id: string; body_secret_enc: string }>(
        "select id, body_secret_enc from messages where to_address = $1 and template = 'invitation' order by created_at desc limit 1",
        [email],
      );
      return result.rows[0];
    });
    const body = decryptMessageBody(message!.id, message!.body_secret_enc);
    const link = new RegExp(`${APP_URL.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/invite/[A-Za-z0-9_-]{43}`).exec(body)?.[0];
    expect(link).toBeTruthy();

    const other = await browser.newContext();
    const invitee = await other.newPage();
    await invitee.goto(link!);
    await expect(invitee.getByText(/as agent/)).toBeVisible();
    const password = `e2e-${randomBytes(9).toString("base64url")}`;
    await invitee.getByLabel("Your full name").fill("Andy Agent");
    await invitee.getByLabel("Choose a password").fill(password);
    await invitee.getByLabel("Type the password again").fill(password);
    await invitee.getByRole("button", { name: "Create account and join" }).click();
    await expect(invitee).toHaveURL(`${APP_URL}/portal`);
    await expect(invitee.getByText("Agent", { exact: true }).first()).toBeVisible();
    // Agents can't open the team page.
    await invitee.goto(`${APP_URL}/portal/team`);
    await expect(invitee).toHaveURL(/access-denied/);
    await other.close();

    await page.reload();
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("a profile edit goes back under review", async ({ page }) => {
    test.skip(!hasDatabase, "needs a local test DATABASE_URL to put the seeded profile back live afterwards");
    await signInMover(page);
    await page.goto(`${APP_URL}/portal/profile`);
    await expectNoSeriousAxeViolations(page, "profile");
    await page.getByLabel("Description").fill(`Demo description for the preview ${Date.now()}. We move Austin households.`);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText(/marked under review/)).toBeVisible();
    await expect(page.getByText("Under review").first()).toBeVisible();
    // Admin review (slice S7) isn't here yet; restore the public profile for the other scenarios.
    await withDatabase((db) => db.query("update company_profiles set public_status = 'live' where company_id = $1", [LONE_STAR_ID]));
  });

  test("settings refuses a password change with the wrong current password and offers two-step verification", async ({ page }) => {
    await signInMover(page);
    await page.goto(`${APP_URL}/portal/settings`);
    await expectNoSeriousAxeViolations(page, "settings");
    await page.getByLabel("Current password").fill("wrong password 123");
    await page.getByLabel("New password", { exact: true }).fill("a brand new password 1");
    await page.getByLabel("New password again").fill("a brand new password 1");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Your current password is incorrect.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Set up two-step verification" })).toBeVisible();
  });
});

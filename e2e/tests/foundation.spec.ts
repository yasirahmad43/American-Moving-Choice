/**
 * Foundation scenarios: the public shell, preview safety, company signup into the portal, and the
 * seeded admin's two-step verification enrollment and sign-in.
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import * as OTPAuth from "otpauth";
import {
  ADMIN_TOTP_SECRET,
  APP_URL,
  WEB_URL,
  decryptMessageBody,
  hasDatabase,
  hasEncryptionKey,
  seedLogin,
  withDatabase,
} from "./env";

const TOTP_PERIOD_MS = 30_000;

/** Waits until a new 30-second TOTP period starts: each code is accepted only once. */
async function nextTotpPeriod(page: Page): Promise<void> {
  await page.waitForTimeout(TOTP_PERIOD_MS - (Date.now() % TOTP_PERIOD_MS) + 500);
}

function totpFor(secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30, algorithm: "SHA1" });
}

async function signUp(page: Page, unique: string, email: string, password: string) {
  await page.goto(`${APP_URL}/signup`);
  await page.getByLabel("Your full name").fill("Erin Owner");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Legal company name").fill(`E2E Moving ${unique} LLC`);
  await page.getByLabel("USDOT number").fill("9000042");
  await page.getByLabel("MC number").fill("MC-9000042");
  await page.getByLabel("Company phone").fill("(512) 555-0142");
  await page.getByRole("button", { name: "Create account and continue" }).click();
  await expect(page).toHaveURL(`${APP_URL}/portal`);
}

test.describe("public site shell", () => {
  test("home page renders with the preview banner, footer statement and noindex", async ({ page }) => {
    const response = await page.goto(`${WEB_URL}/`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Preview notice" })).toContainText("Companies shown are fictional demo data.");
    const nav = page.getByRole("navigation", { name: "Primary" }).first();
    await expect(page.getByRole("link", { name: "Get quotes" }).first()).toBeVisible();
    await expect(nav).toBeAttached();
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText("We are not a moving company or a moving broker.");
    await expect(footer.getByRole("link", { name: "GeoNames" })).toBeVisible();
  });

  test("robots.txt disallows everything in the preview", async ({ request }) => {
    const response = await request.get(`${WEB_URL}/robots.txt`);
    expect(await response.text()).toMatch(/Disallow: \/\s*$/m);
  });

  test("unknown pages show the site's 404 page", async ({ page }) => {
    const response = await page.goto(`${WEB_URL}/no-such-page/`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We can't find that page");
  });
});

test.describe("company app", () => {
  // Every scenario signs up or signs in from the same address; clear the auth rate-limit
  // counters so repeated runs stay under the per-connection limits.
  test.beforeEach(async () => {
    await withDatabase((db) => db.query("delete from rate_limits where key like 'signup:%' or key like 'login:%' or key like 'reset:%' or key like 'invite:%' or key like 'mfa:%'"));
  });

  test("every response is noindex and the health check reports the database", async ({ request }) => {
    const login = await request.get(`${APP_URL}/login`);
    expect(login.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    const health = await request.get(`${APP_URL}/api/health`);
    expect(health.status()).toBe(200);
    // Anonymous callers learn only the status and the migration count.
    const body = (await health.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["migrations", "status"]);
    expect(body.status).toBe("ok");
    expect(body.migrations).toBeGreaterThanOrEqual(2);
    if (process.env.CRON_SECRET) {
      const detailed = await request.get(`${APP_URL}/api/health`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
      const full = (await detailed.json()) as { database: { reachable: boolean }; integrations: Record<string, string> };
      expect(full.database.reachable).toBe(true);
      expect(full.integrations).toBeTruthy();
      expect(JSON.stringify(full)).not.toMatch(/postgres|password|secret/i);
    }
  });

  test("portal and admin paths send signed-out visitors to sign in", async ({ page }) => {
    await page.goto(`${APP_URL}/portal/marketplace`);
    await expect(page).toHaveURL(`${APP_URL}/login?next=%2Fportal%2Fmarketplace`);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await page.goto(`${APP_URL}/admin`);
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test("sign-up shows field errors without losing what was typed", async ({ page }) => {
    await page.goto(`${APP_URL}/signup`);
    await page.getByLabel("Your full name").fill("Error Tester");
    await page.getByLabel("USDOT number").fill("12-ab");
    await page.getByRole("button", { name: "Create account and continue" }).click();
    await expect(page.getByText("Check the highlighted fields.")).toBeVisible();
    await expect(page.getByLabel("USDOT number")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Your full name")).toHaveValue("Error Tester");
    await expect(page.getByLabel("Work email")).toBeFocused();
  });

  test("a new company signs up and lands in the portal", async ({ page }) => {
    const unique = `${Date.now()}`;
    const legalName = `E2E Moving ${unique} LLC`;
    await signUp(page, unique, `e2e-owner-${unique}@example.com`, "e2e-owner-password-1");
    await expect(page.getByRole("banner")).toContainText(legalName);
    await expect(page.getByRole("banner")).toContainText("Application started");
    await expect(page.getByText("Your application is in progress")).toBeVisible();

    const company = await withDatabase(async (db) => {
      const result = await db.query("select status, usdot_number, mc_number from companies where legal_name = $1", [legalName]);
      return result.rows[0] as { status: string; usdot_number: string; mc_number: string } | undefined;
    });
    if (company) expect(company).toEqual({ status: "applied", usdot_number: "9000042", mc_number: "MC-9000042" });

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(`${APP_URL}/login?signed_out=1`);
  });

  test("a password reset link works once and signs in with the new password", async ({ page }) => {
    test.skip(!hasDatabase || !hasEncryptionKey, "needs a local test DATABASE_URL and the app's APP_ENCRYPTION_KEY to read the demo mailbox");
    const unique = `${Date.now()}`;
    const email = `e2e-reset-${unique}@example.com`;
    await signUp(page, unique, email, "e2e-first-password-1");
    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto(`${APP_URL}/forgot-password`);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("If an account uses that email")).toBeVisible();

    const message = await withDatabase(async (db) => {
      const result = await db.query<{ id: string; status: string; body_text: string; body_secret_enc: string | null }>(
        "select id, status, body_text, body_secret_enc from messages where template = 'password_reset' and to_address = $1 order by created_at desc limit 1",
        [email],
      );
      return result.rows[0];
    });
    // The stored, mailbox-visible body never holds the token; the deliverable body is encrypted.
    expect(message?.status).toBe("demo");
    expect(message?.body_text).not.toMatch(/reset-password\//);
    const body = message?.body_secret_enc ? decryptMessageBody(message.id, message.body_secret_enc) : "";
    const link = /https?:\/\/\S+\/reset-password\/[A-Za-z0-9_-]{43}/.exec(body)?.[0];
    expect(link).toBeTruthy();
    const path = new URL(link!).pathname;

    await page.goto(`${APP_URL}${path}`);
    await page.getByLabel("New password", { exact: true }).fill("e2e-second-password-2");
    await page.getByLabel("Type the new password again").fill("e2e-second-password-2");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page).toHaveURL(`${APP_URL}/login?reset=1`);
    await expect(page.getByText("Your password was changed.")).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("e2e-second-password-2");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`${APP_URL}/portal`);

    await page.goto(`${APP_URL}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This link has expired");
  });

  test("an invitation link creates an account on the inviting company's team", async ({ page }) => {
    test.skip(!hasDatabase, "needs a local test DATABASE_URL to create the invitation");
    const MOVER = seedLogin("mover");
    const token = randomBytes(32).toString("base64url");
    const email = `e2e-agent-${Date.now()}@example.com`;
    await withDatabase((db) =>
      db.query(
        `insert into invitations (company_id, email, role, token_hash, invited_by, expires_at)
         select m.company_id, $1, 'agent', $2, m.user_id, now() + interval '7 days'
         from company_memberships m join users u on u.id = m.user_id where u.email = $3`,
        [email, createHash("sha256").update(token).digest("hex"), MOVER.email],
      ),
    );

    await page.goto(`${APP_URL}/invite/${token}`);
    await expect(page.getByText("Demo Lone Star Relocation Co.").first()).toBeVisible();
    await page.getByLabel("Your full name").fill("Avery Agent");
    await page.getByLabel("Choose a password").fill("e2e-agent-password-1");
    await page.getByLabel("Type the password again").fill("e2e-agent-password-1");
    await page.getByRole("button", { name: "Create account and join" }).click();
    await expect(page).toHaveURL(`${APP_URL}/portal`);
    await expect(page.getByRole("banner")).toContainText("Demo Lone Star Relocation Co.");
    await expect(page.getByRole("banner")).toContainText("Agent");
    // Agents don't see owner and manager sections.
    await expect(page.getByRole("link", { name: "Team" })).toHaveCount(0);

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.goto(`${APP_URL}/invite/${token}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Invitation unavailable");
  });

  test("the seeded mover owner signs in to the portal", async ({ page }) => {
    const MOVER = seedLogin("mover");
    await page.goto(`${APP_URL}/login`);
    await page.getByLabel("Email").fill(MOVER.email);
    await page.getByLabel("Password").fill(MOVER.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`${APP_URL}/portal`);
    await expect(page.getByRole("banner")).toContainText("Demo Lone Star Relocation Co.");
    await page.goto(`${APP_URL}/admin`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We can't find that page");
  });

  test("the seeded admin passes two-step verification before the admin area opens, and a code works once", async ({ page }) => {
    test.setTimeout(150_000);
    const ADMIN = seedLogin("admin");
    let secret = ADMIN_TOTP_SECRET;
    if (!secret) {
      // A local seed without SEED_ADMIN_TOTP_SECRET: the admin enrolls at first sign-in. Start from
      // that state when the test database may be changed.
      await withDatabase((db) => db.query("update users set mfa_enabled_at = null, mfa_secret_enc = null, mfa_last_step = null where email = $1", [ADMIN.email]));
    }

    await page.goto(`${APP_URL}/login`);
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    if (!secret) {
      await expect(page).toHaveURL(`${APP_URL}/mfa/setup`);
      await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
      // Admin pages stay closed until the second step is done.
      await page.goto(`${APP_URL}/admin`);
      await expect(page).toHaveURL(/\/mfa\/setup/);
      secret = (await page.locator("code").first().innerText()).replace(/\s+/g, "");
      await page.getByLabel("6-digit code").fill(totpFor(secret).generate());
      await page.getByRole("button", { name: "Turn on two-step verification" }).click();
      await expect(page).toHaveURL(`${APP_URL}/admin`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Admin dashboard");
      await page.getByRole("button", { name: "Sign out" }).click();
      await page.getByLabel("Email").fill(ADMIN.email);
      await page.getByLabel("Password").fill(ADMIN.password);
      await page.getByRole("button", { name: "Sign in" }).click();
    }

    await expect(page).toHaveURL(`${APP_URL}/mfa`);
    await page.goto(`${APP_URL}/admin`);
    await expect(page).toHaveURL(/\/mfa/);
    // A fresh period, so the code can't be one an earlier sign-in already used.
    await nextTotpPeriod(page);
    const code = totpFor(secret).generate();
    await page.getByLabel("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(`${APP_URL}/admin`);

    // The same code in a second session is refused (RFC 6238 §5.2).
    const other = await page.context().browser()!.newContext();
    const second = await other.newPage();
    await second.goto(`${APP_URL}/login`);
    await second.getByLabel("Email").fill(ADMIN.email);
    await second.getByLabel("Password").fill(ADMIN.password);
    await second.getByRole("button", { name: "Sign in" }).click();
    await expect(second).toHaveURL(`${APP_URL}/mfa`);
    await second.getByLabel("6-digit code").fill(code);
    await second.getByRole("button", { name: "Verify" }).click();
    await expect(second.getByText("That code didn't match.")).toBeVisible();
    await expect(second).toHaveURL(`${APP_URL}/mfa`);
    await other.close();
  });
});

/**
 * Cross-cutting safeguards: contact hashes, same-origin checks, sanitized database errors,
 * setting consistency and approval blockers.
 */
import { inspect } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEV_HMAC_SECRET as SEED_DEV_HMAC_SECRET, contactHashWith } from "@amc/db/seed/build";
import { contactHash, contactHashOfNormalized } from "../src/contact/contact-hash";
import { DbError, closePool, getPool, isUniqueViolation, one, tx } from "../src/db/pool";
import { DEV_HMAC_SECRET, hmacSecret } from "../src/env/env";
import { assertSameOrigin, isSameOrigin } from "../src/http/same-origin";
import { SettingValidationError, setSetting } from "../src/settings/settings";
import { evaluateEligibility } from "../src/verification/eligibility";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("contact hashes", () => {
  it("are keyed HMACs of the normalized value, identical to the seed builder's", () => {
    expect(DEV_HMAC_SECRET).toBe(SEED_DEV_HMAC_SECRET);
    expect(hmacSecret()).toBe(DEV_HMAC_SECRET);
    const phone = contactHash("phone", "(512) 555-0199");
    expect(phone).toMatch(/^[0-9a-f]{64}$/);
    expect(phone).toBe(contactHashWith(SEED_DEV_HMAC_SECRET, "phone", "+15125550199"));
    expect(contactHash("email", " Dana.Private@Example.com ")).toBe(contactHashWith(SEED_DEV_HMAC_SECRET, "email", "dana.private@example.com"));
    // Domain-separated and keyed: not the plain sha256, and email and phone never collide.
    expect(phone).not.toBe(contactHashOfNormalized("email", "+15125550199"));
    expect(contactHashOfNormalized("phone", "+15125550199", "another-secret-of-at-least-32-chars")).not.toBe(phone);
    expect(contactHash("phone", "12")).toBeNull();
  });
});

describe("same-origin check for POST route handlers", () => {
  const allowed = ["http://localhost:3001", "http://localhost:3000/"];
  const req = (method: string, origin?: string) => new Request("http://localhost:3001/api/x", { method, headers: origin ? { Origin: origin } : {} });

  it("allows safe methods and listed origins", () => {
    expect(isSameOrigin(req("GET"), allowed)).toBe(true);
    expect(isSameOrigin(req("POST", "http://localhost:3001"), allowed)).toBe(true);
    expect(isSameOrigin(req("POST", "http://localhost:3000"), allowed)).toBe(true);
  });

  it("refuses missing, null and foreign origins with a 403", async () => {
    for (const origin of [undefined, "null", "https://evil.example", "http://localhost:3001.evil.example", "javascript:alert(1)"]) {
      expect(isSameOrigin(req("POST", origin), allowed), String(origin)).toBe(false);
    }
    const denied = assertSameOrigin(req("DELETE", "https://evil.example"), allowed);
    expect(denied?.status).toBe(403);
    expect(assertSameOrigin(req("POST", "http://localhost:3001"), allowed)).toBeNull();
  });
});

describe("database errors", () => {
  it("never carry row values, so logging them can't leak contact data", async () => {
    const group = await one<{ id: string }>("insert into lead_groups (sharing_limit, policy_version) values (3, 'share-stepdown-v1-proposal') returning id");
    let caught: unknown;
    try {
      await tx(async (client) => {
        await client.query(
          `insert into leads (group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip, move_size)
           values ($1, 3, 'Dana', 'Private', 'dana.private@example.com', '+15125550199', '78704', '77006', 'mansion')`,
          [group!.id],
        );
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(DbError);
    const error = caught as DbError;
    expect(error.code).toBe("23514");
    expect(error.constraint).toMatch(/move_size/);
    for (const text of [inspect(error, { depth: 5 }), JSON.stringify(error), String(error), error.stack ?? ""]) {
      expect(text).not.toMatch(/dana|Private|5550199|example\.com/i);
    }
    await getPool().query("insert into users (email) values ('dup@example.com')");
    const duplicate = await getPool().query("insert into users (email) values ('dup@example.com')").catch((e: unknown) => e);
    expect(duplicate).toBeInstanceOf(DbError);
    expect(isUniqueViolation(duplicate, "users_email_key")).toBe(true);
    expect(inspect(duplicate)).not.toContain("dup@example.com");
  });
});

describe("settings consistency", () => {
  it("keeps the sharing limit within the active policy's factors", async () => {
    await expect(setSetting("max_sharing_limit", 6, { userId: "system" })).rejects.toBeInstanceOf(SettingValidationError);
    await getPool().query("insert into sharing_policies (version, factors_bp) values ('short-policy', '{10000,8000,6500}')");
    await expect(setSetting("active_policy_version", "short-policy", { userId: "system" })).rejects.toThrow(/3 factors/);
    await setSetting("max_sharing_limit", 3, { userId: "system" });
    await setSetting("active_policy_version", "short-policy", { userId: "system" });
    await expect(setSetting("max_sharing_limit", 4, { userId: "system" })).rejects.toThrow(/at most 3/);
    await setSetting("active_policy_version", "share-stepdown-v1-proposal", { userId: "system" });
    await setSetting("max_sharing_limit", 5, { userId: "system" });
    await expect(setSetting("active_consent_version", "terms-ack-v0-draft", { userId: "system" })).rejects.toThrow(/not contact-consent/);
  });
});

describe("approval blockers", () => {
  const base = {
    company: { status: "in_review" as const, usdotNumber: "9000001", mcNumber: "MC-9000001", hasBrokerAuthority: false, billingStatus: "good" as const, credentialsValidUntil: "2027-01-01" },
    checks: {
      usdot_active: "pass", identity_match: "pass", authority_type: "pass", authority_status: "pass", insurance_filings: "pass",
      recent_record_changes: "pass", callback_verification: "pass", state_credentials: "pass", insurance_certificate: "pass",
    } as const,
    requireMcNumber: true,
    today: new Date("2026-10-28T12:00:00Z"),
  };

  it("are clear when everything passes", () => {
    expect(evaluateEligibility(base)).toMatchObject({ approvable: true, blockers: [] });
  });

  it("include an expired credential and a USDOT number already approved for another company", () => {
    const expired = evaluateEligibility({ ...base, company: { ...base.company, credentialsValidUntil: "2026-01-01", billingStatus: "past_due" } });
    expect(expired.approvable).toBe(false);
    expect(expired.canPurchase).toBe(false);
    expect(expired.blockers.join(" ")).toMatch(/expired/);
    const duplicate = evaluateEligibility({ ...base, usdotAlreadyApproved: true });
    expect(duplicate.approvable).toBe(false);
    expect(duplicate.blockers.join(" ")).toMatch(/USDOT/);
  });
});

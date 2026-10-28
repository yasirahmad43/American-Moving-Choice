import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createUser, resetDatabase } from "../../test/helpers";
import { signupCompany } from "../auth/signup";
import { closePool, getPool } from "../db/pool";
import { getApplication, platformToday, saveApplicationStep, submitApplication, BROKER_REJECTION_REASON, areaRules } from "./application";
import { parseStep, nextIncompleteStep, type SchemaContext } from "./application-schema";
import { getDashboard, getVerificationOverview } from "./overview";
import { PermissionError, canInviteRole, invitableRoles, canManageMembers } from "./permissions";
import { getProfile, normalizeLogoUrl, updateProfile } from "./profile";
import { MOVER_TERMS_SHA256, MOVER_TERMS_VERSION } from "./terms";

const pool = () => getPool();
const ctx: SchemaContext = {
  requireMc: true,
  zipState: (zip) => (zip.startsWith("787") ? "TX" : zip.startsWith("900") ? "CA" : null),
  today: "2026-10-28",
};
const future = () => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

describe("application step rules", () => {
  it("requires a physical address whose ZIP is in the chosen state", () => {
    const base = { legalName: "Demo Co", addressLine1: "100 Demo Road", city: "Austin", state: "TX", zip: "78701", phone: "(512) 555-0100" };
    expect(parseStep("company", base, ctx).ok).toBe(true);
    const poBox = parseStep("company", { ...base, addressLine1: "P.O. Box 12" }, ctx);
    expect(poBox.ok).toBe(false);
    if (!poBox.ok) expect(poBox.fieldErrors.addressLine1).toMatch(/PO box/);
    const wrongState = parseStep("company", { ...base, state: "CA" }, ctx);
    if (wrongState.ok) throw new Error("expected an error");
    expect(wrongState.fieldErrors.zip).toBe("That ZIP code is in TX, not CA.");
    const unknown = parseStep("company", { ...base, zip: "11111" }, ctx);
    if (unknown.ok) throw new Error("expected an error");
    expect(unknown.fieldErrors.zip).toMatch(/recognize/);
  });

  it("requires the MC number only while require_mc_number is on, and normalizes numbers", () => {
    const missing = parseStep("identifiers", { usdot: "USDOT 9000050", mc: "" }, ctx);
    if (missing.ok) throw new Error("expected an error");
    expect(missing.fieldErrors.mc).toMatch(/requires one/);
    const optional = parseStep("identifiers", { usdot: "9000050", mc: "" }, { ...ctx, requireMc: false });
    expect(optional).toEqual({ ok: true, data: { usdot: "9000050", mc: null } });
    expect(parseStep("identifiers", { usdot: "9000050", mc: "mc 9000050" }, ctx)).toEqual({ ok: true, data: { usdot: "9000050", mc: "MC-9000050" } });
  });

  it("needs state credentials or the explicit 'none apply' answer, and rejects expired ones", () => {
    const none = parseStep("credentials", { noneRequired: "on", rows: [] }, ctx);
    expect(none).toEqual({ ok: true, data: { noneRequired: true, rows: [] } });
    const empty = parseStep("credentials", { rows: [{}, {}] }, ctx);
    if (empty.ok) throw new Error("expected an error");
    expect(empty.fieldErrors.rows).toMatch(/tick the box/);
    const expired = parseStep("credentials", { rows: [{ state: "TX", number: "006123456C", expiresOn: "2020-01-01" }] }, ctx);
    if (expired.ok) throw new Error("expected an error");
    expect(expired.fieldErrors["rows.0.expiresOn"]).toMatch(/expired/);
  });

  it("checks insurance dates, the attestation and the terms version", () => {
    expect(parseStep("insurance", { insurer: "Demo Mutual", policyNumber: "P-1", expiresOn: "2026-10-27", coverages: ["cargo"] }, ctx).ok).toBe(false);
    expect(parseStep("insurance", { insurer: "Demo Mutual", policyNumber: "P-1", expiresOn: "2026-10-28", coverages: ["cargo"] }, ctx).ok).toBe(true);
    const rep = { name: "Dana Demo", title: "Owner", email: "Dana@Example.com", phone: "5125550100" };
    expect(parseStep("representative", rep, ctx).ok).toBe(false);
    expect(parseStep("representative", { ...rep, attest: "on" }, ctx)).toMatchObject({ ok: true, data: { email: "dana@example.com", phone: "+15125550100" } });
    expect(parseStep("review", { termsVersion: "old", acceptTerms: "on" }, ctx).ok).toBe(false);
    expect(parseStep("review", { termsVersion: MOVER_TERMS_VERSION, acceptTerms: "on" }, ctx).ok).toBe(true);
  });

  it("turns initial service areas into coverage rules and finds the next step", () => {
    expect(areaRules({ states: ["TX"], reach: "within" })).toMatchObject([{ kind: "include", origin: { states: ["TX"] }, destination: { states: ["TX"] } }]);
    expect(areaRules({ states: ["TX"], reach: "from" })[0]!.destination.states).toEqual([]);
    expect(areaRules({ states: ["TX", "OK"], reach: "both" })).toHaveLength(2);
    expect(nextIncompleteStep(["company", "identifiers"])).toBe("services");
    expect(nextIncompleteStep(["company", "identifiers", "services", "areas", "credentials", "insurance", "representative"])).toBe("review");
    expect(platformToday(new Date("2026-10-28T03:00:00Z"))).toBe("2026-10-27");
  });

  it("follows the permission matrix", () => {
    expect(invitableRoles("owner")).toEqual(["owner", "manager", "agent", "billing"]);
    expect(invitableRoles("manager")).toEqual(["agent"]);
    expect(canInviteRole("agent", "agent")).toBe(false);
    expect(canManageMembers("manager")).toBe(false);
    expect(normalizeLogoUrl("http://example.com/logo.png")).toBeNull();
    expect(normalizeLogoUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
  });
});

// ------------------------------------------------------------------ database

async function apply(usdot: string, legalName: string, email: string) {
  const { userId, companyId } = await signupCompany(
    { fullName: "Dana Demo", email, password: "correct horse battery", legalName, usdot, mc: `MC-${usdot}`, phone: "(737) 555-0150" },
    { bcryptCost: 4 },
  );
  return { userId, companyId, actor: { userId, companyId } };
}

async function completeSteps(actor: { userId: string; companyId: string }, legalName: string, usdot: string) {
  const steps: [Parameters<typeof saveApplicationStep>[1], unknown][] = [
    ["company", { legalName, addressLine1: "100 Demo Fixture Road", city: "Austin", state: "TX", zip: "78701", phone: "(737) 555-0150", website: "demo-fixture.example" }],
    ["identifiers", { usdot, mc: `MC-${usdot}` }],
    ["services", { moveTypes: ["local", "intrastate"], moveSizes: ["1br", "2br"], services: ["full_service", "packing"] }],
    ["areas", { states: ["TX"], reach: "within" }],
    ["credentials", { rows: [{ state: "TX", number: "006000050C", issuer: "TxDMV", expiresOn: future() }] }],
    ["insurance", { insurer: "Demo Mutual", policyNumber: "DM-50", expiresOn: future(), coverages: ["cargo", "general_liability"] }],
    ["representative", { name: "Dana Demo", title: "Owner", email: "dana@demo.invalid", phone: "(737) 555-0150", attest: "on" }],
  ];
  for (const [step, input] of steps) {
    const result = await saveApplicationStep(actor, step, input);
    expect(result, step).toEqual({ ok: true });
  }
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("company application (database)", () => {
  it("saves progress, then submit runs the checks and ends in_review for fixture USDOT 9000050", async () => {
    const legalName = "Demo Fixture Carrier 9000050";
    const { actor, companyId } = await apply("9000050", legalName, "dana@demo-9000050.invalid");

    const before = await submitApplication(actor, { termsVersion: MOVER_TERMS_VERSION, acceptTerms: "on" });
    expect(before).toEqual({ ok: false, reason: "incomplete", missing: ["company", "identifiers", "services", "areas", "credentials", "insurance", "representative"] });

    await saveApplicationStep(actor, "company", { legalName, addressLine1: "100 Demo Fixture Road", city: "Austin", state: "TX", zip: "78701", phone: "7375550150" });
    const partial = await getApplication(actor);
    expect(partial.completedSteps).toEqual(["company"]);
    expect(partial.editable).toBe(true);
    const profile = await pool().query("select slug, public_status from company_profiles where company_id = $1", [companyId]);
    expect(profile.rows[0]).toEqual({ slug: "demo-fixture-carrier-9000050", public_status: "hidden" });

    const versionBefore = (await pool().query("select coverage_version from companies where id = $1", [companyId])).rows[0].coverage_version;
    await completeSteps(actor, legalName, "9000050");
    const rules = await pool().query("select label from coverage_rules where company_id = $1", [companyId]);
    expect(rules.rows).toEqual([{ label: "Within TX (from your application)" }]);
    // Saving the areas step again replaces the application's rules instead of adding more.
    await saveApplicationStep(actor, "areas", { states: ["TX", "OK"], reach: "from" });
    expect((await pool().query("select count(*)::int as n from coverage_rules where company_id = $1", [companyId])).rows[0].n).toBe(1);
    const versionAfter = (await pool().query("select coverage_version from companies where id = $1", [companyId])).rows[0].coverage_version;
    expect(versionAfter).toBeGreaterThan(versionBefore);

    const result = await submitApplication(actor, { termsVersion: MOVER_TERMS_VERSION, acceptTerms: "on" }, { ip: "203.0.113.5", userAgent: "vitest" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe("in_review");
    expect(result.checks.map((c) => c.checkType).sort()).toEqual(
      ["authority_status", "authority_type", "identity_match", "insurance_filings", "recent_record_changes", "usdot_active"],
    );

    const company = (await pool().query("select status, has_broker_authority, credentials_valid_until is not null as has_expiry from companies where id = $1", [companyId])).rows[0];
    expect(company).toEqual({ status: "in_review", has_broker_authority: false, has_expiry: true });
    const history = await pool().query("select from_status, to_status from company_status_history where company_id = $1 order by id", [companyId]);
    expect(history.rows).toEqual([
      { from_status: null, to_status: "applied" },
      { from_status: "applied", to_status: "verifying" },
      { from_status: "verifying", to_status: "in_review" },
    ]);
    const checks = await pool().query("select count(*)::int as n from verification_checks where company_id = $1", [companyId]);
    expect(checks.rows[0].n).toBe(6);
    const terms = await pool().query("select terms_version, terms_sha256, representative_email, authority_attested from mover_terms_acceptances where company_id = $1", [companyId]);
    expect(terms.rows).toEqual([{ terms_version: MOVER_TERMS_VERSION, terms_sha256: MOVER_TERMS_SHA256, representative_email: "dana@demo.invalid", authority_attested: true }]);
    const creds = await pool().query("select credential_type, status from credentials where company_id = $1 and credential_type in ('state_license', 'insurance_coi') order by credential_type", [companyId]);
    expect(creds.rows).toEqual([{ credential_type: "insurance_coi", status: "pending" }, { credential_type: "state_license", status: "pending" }]);
    const mail = await pool().query("select to_address, template from messages where related_id = $1", [companyId]);
    expect(mail.rows).toEqual([{ to_address: "dana@demo-9000050.invalid", template: "application_received" }]);
    const actions = await pool().query("select action from audit_log where company_id = $1 and action in ('company.application_submitted', 'company.status_changed') order by id", [companyId]);
    expect(actions.rows.map((r) => r.action)).toEqual(["company.status_changed", "company.application_submitted", "company.status_changed"]);

    // Submitted applications are read-only.
    expect(await saveApplicationStep(actor, "insurance", { insurer: "Other Mutual", policyNumber: "OM-1", expiresOn: future(), coverages: ["cargo"] })).toMatchObject({ ok: false, reason: "locked" });
    expect(await submitApplication(actor, { termsVersion: MOVER_TERMS_VERSION, acceptTerms: "on" })).toMatchObject({ ok: false, reason: "locked" });

    const overview = await getVerificationOverview(actor);
    expect(overview.checks.find((c) => c.checkType === "usdot_active")).toMatchObject({ result: "pass", source: "FMCSA records (demo data in this preview)" });
    expect(overview.checks.find((c) => c.checkType === "callback_verification")).toMatchObject({ result: "not_run" });
    expect(JSON.stringify(overview)).not.toContain("payload");

    const dashboard = await getDashboard(actor);
    expect(dashboard.company.status).toBe("in_review");
    expect(dashboard.history).toHaveLength(3);
    expect(dashboard.stats).toBeNull();
  });

  it("rejects the broker fixture (USDOT 9000090) with the reason", async () => {
    const legalName = "Demo Broker Only 9000090";
    const { actor, companyId } = await apply("9000090", legalName, "owner@demo-9000090.invalid");
    await completeSteps(actor, legalName, "9000090");
    const result = await submitApplication(actor, { termsVersion: MOVER_TERMS_VERSION, acceptTerms: "on" });
    expect(result).toMatchObject({ ok: true, status: "rejected" });
    const company = (await pool().query("select status, status_reason, has_broker_authority from companies where id = $1", [companyId])).rows[0];
    expect(company).toEqual({ status: "rejected", status_reason: "broker_authority", has_broker_authority: true });
    const last = (await pool().query("select to_status, reason from company_status_history where company_id = $1 order by id desc limit 1", [companyId])).rows[0];
    expect(last).toEqual({ to_status: "rejected", reason: BROKER_REJECTION_REASON });
    const mail = await pool().query("select template, body_text from messages where related_id = $1", [companyId]);
    expect(mail.rows[0].template).toBe("application_rejected");
    expect(mail.rows[0].body_text).toContain("broker authority");
    // A rejected company may fix and resubmit; the application is editable again.
    expect((await getApplication(actor)).editable).toBe(true);
  });

  it("refuses agents and non-members", async () => {
    const { companyId } = await apply("9000051", "Demo Fixture Carrier 9000051", "owner@demo-9000051.invalid");
    const agent = await createUser({ email: "agent@demo-9000051.invalid" });
    await pool().query("insert into company_memberships (company_id, user_id, role) values ($1, $2, 'agent')", [companyId, agent]);
    await expect(saveApplicationStep({ userId: agent, companyId }, "services", { moveTypes: ["local"], moveSizes: ["1br"], services: ["packing"] })).rejects.toBeInstanceOf(PermissionError);
    const stranger = await createUser({ email: "stranger@demo.invalid" });
    await expect(getApplication({ userId: stranger, companyId })).rejects.toBeInstanceOf(PermissionError);
    await expect(getDashboard({ userId: stranger, companyId })).rejects.toBeInstanceOf(PermissionError);
    // Agents can see the dashboard.
    expect((await getDashboard({ userId: agent, companyId })).role).toBe("agent");
  });

  it("puts a live profile under review when its description changes", async () => {
    const { actor, companyId } = await apply("9000052", "Demo Fixture Carrier 9000052", "owner@demo-9000052.invalid");
    await saveApplicationStep(actor, "company", { legalName: "Demo Fixture Carrier 9000052", addressLine1: "100 Demo Fixture Road", city: "Austin", state: "TX", zip: "78701", phone: "7375550152" });
    await pool().query("update company_profiles set public_status = 'live' where company_id = $1", [companyId]);
    const unchanged = await updateProfile(actor, { displayName: "Demo Fixture Carrier 9000052", description: null, logoUrl: "", website: "" });
    expect(unchanged).toEqual({ ok: true, publicStatus: "live", sentForReview: false, changed: false });
    const invalid = await updateProfile(actor, { displayName: "D", logoUrl: "javascript:alert(1)" });
    expect(invalid).toMatchObject({ ok: false, fieldErrors: { displayName: expect.any(String), logoUrl: expect.any(String) } });
    const changed = await updateProfile(actor, { displayName: "Demo Fixture Carrier 9000052", description: "We move Austin households.", website: "example.com" });
    expect(changed).toEqual({ ok: true, publicStatus: "under_review", sentForReview: true, changed: true });
    const profile = await getProfile(actor);
    expect(profile).toMatchObject({ description: "We move Austin households.", website: "https://example.com", publicStatus: "under_review" });
    expect(profile?.publicUrl).toMatch(/\/companies\/demo-fixture-carrier-9000052\/$/);
  });
});

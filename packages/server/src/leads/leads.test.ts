/**
 * Database tests for lead intake: coverage, submission, duplicates and withdrawal. They run on the
 * server test database (see packages/server/test/database.ts), recreated for this file.
 */
import { renderConsentText, consentTextSha256, type Channel } from "@amc/core/src/survey";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sha256Hex } from "../auth/tokens";
import { closePool, getPool } from "../db/pool";
import { hmacSecret } from "../env/env";
import { resetDatabase } from "../../test/helpers";
import { checkCoverage, matchMovers } from "./coverage";
import { getConfirmationByToken, getRequestByToken, withdrawRequest } from "./manage";
import { checkSurveyTicket, issueSurveyTicket, riskScore, sourceCategory, MIN_COMPLETION_SECONDS } from "./quality";
import { activeConsent, submitRequest, type SubmitMeta } from "./submit";
import { surveyCoverage } from "./survey-coverage";

const pool = () => getPool();

interface CompanyFixture {
  n: number;
  name: string;
  status?: "approved" | "in_review";
  broker?: boolean;
  billing?: "good" | "past_due";
  moveTypes?: string[];
  sizes?: string[];
  services?: string[];
  member?: string;
}

const id = (n: number) => `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function addCompany(c: CompanyFixture): Promise<string> {
  const companyId = id(c.n);
  const db = pool();
  await db.query(
    `insert into companies (id, legal_name, status, usdot_number, mc_number, has_broker_authority, billing_status, is_demo, approved_at)
     values ($1, $2, $3, $4, $5, $6, $7, true, now())`,
    [companyId, `${c.name} LLC`, c.status ?? "approved", String(9_000_000 + c.n), `MC-${9_000_000 + c.n}`, c.broker ?? false, c.billing ?? "good"],
  );
  await db.query("insert into company_profiles (company_id, slug, display_name, public_status) values ($1, $2, $3, 'live')", [
    companyId,
    c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    c.name,
  ]);
  await db.query("insert into company_capabilities (company_id, move_types, move_sizes, services) values ($1, $2, $3, $4)", [
    companyId,
    c.moveTypes ?? ["local", "intrastate"],
    c.sizes ?? ["studio", "1br", "2br", "3br", "4br_plus"],
    c.services ?? ["full_service", "packing", "storage"],
  ]);
  const rule = await db.query<{ id: string }>(
    "insert into coverage_rules (company_id, kind, move_types, label) values ($1, 'include', '{local,intrastate}', 'Texas statewide') returning id",
    [companyId],
  );
  await db.query(
    "insert into coverage_rule_locations (rule_id, side, level, value) values ($1, 'origin', 'state', 'TX'), ($1, 'destination', 'state', 'TX')",
    [rule.rows[0]!.id],
  );
  await db.query("insert into verification_checks (company_id, check_type, source, result) values ($1, 'usdot_active', 'fixture', 'pass')", [companyId]);
  await db.query("insert into company_prices (company_id, exclusive_cents, shared_cents, set_by) values ($1, 9000, 4000, 'test')", [companyId]);
  if (c.member) {
    const user = await db.query<{ id: string }>("insert into users (email, full_name) values ($1, 'Member') returning id", [c.member]);
    await db.query("insert into company_memberships (company_id, user_id, role, can_purchase) values ($1, $2, 'owner', true)", [companyId, user.rows[0]!.id]);
  }
  return companyId;
}

const meta = (ip = "203.0.113.7"): SubmitMeta => ({ ip, userAgent: "vitest", pageUrl: "http://localhost:3000/get-quotes/" });

function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface DraftOptions {
  limit?: number;
  removed?: string[];
  channels?: Channel[];
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  shown?: string[];
  website?: string;
  ticketAgeMs?: number;
}

/** Runs the coverage check and builds a submission the way the survey island does. */
async function draft(options: DraftOptions = {}) {
  const coverage = await checkCoverage({ originZip: "75201", destZip: "77002", moveSize: "2br", services: [] });
  if (!coverage.ok) throw new Error("coverage failed");
  const shown = options.shown ?? coverage.movers.map((m) => m.companyId);
  const removed = options.removed ?? [];
  const named = coverage.movers.filter((m) => shown.includes(m.companyId) && !removed.includes(m.companyId));
  const ordered = shown.map((sid) => named.find((m) => m.companyId === sid)).filter((m) => m !== undefined);
  const limit = options.limit ?? 2;
  const channels = options.channels ?? ["call", "sms", "email"];
  const consent = await activeConsent();
  const text = renderConsentText(consent.body, { movers: ordered, limit: Math.min(limit, Math.max(1, ordered.length)), channels });
  return {
    coverage,
    input: {
      need: "household" as const,
      originZip: "75201",
      destZip: "77002",
      moveDate: futureDate(30),
      flexible: false,
      latestDate: null,
      moveSize: "2br",
      services: [],
      channels,
      firstName: options.firstName ?? "Jordan",
      lastName: options.lastName ?? "Rivera",
      email: options.email ?? "jordan.rivera@example.com",
      phone: options.phone ?? "(214) 555-0199",
      limit,
      onlyProfileCompany: false,
      shownCompanyIds: shown,
      removedCompanyIds: removed,
      profileCompanyId: null,
      consentChecked: true,
      termsAccepted: true,
      consentVersionId: consent.versionId,
      renderedTextSha256: consentTextSha256(text),
      website: options.website ?? "",
      ticket: issueSurveyTicket(hmacSecret(), Date.now() - (options.ticketAgeMs ?? 120_000)),
      attribution: { referrerOrigin: "https://www.google.com", utmSource: null, utmMedium: null, utmCampaign: null },
    },
    text,
  };
}

let alpha: string, bravo: string, charlie: string;

beforeAll(async () => {
  await resetDatabase();
  alpha = await addCompany({ n: 1, name: "Demo Alpha Movers", member: "owner-alpha@example.com" });
  bravo = await addCompany({ n: 2, name: "Demo Bravo Movers", member: "owner-bravo@example.com" });
  charlie = await addCompany({ n: 3, name: "Demo Charlie Movers", sizes: ["studio", "1br", "2br"] });
  await addCompany({ n: 4, name: "Demo Delta Broker", broker: true });
  await addCompany({ n: 5, name: "Demo Echo Pending", status: "in_review" });
  await addCompany({ n: 6, name: "Demo Foxtrot Past Due", billing: "past_due" });
  await addCompany({ n: 7, name: "Demo Golf Small Homes", sizes: ["studio"] });
});

beforeEach(async () => {
  await pool().query("delete from rate_limits");
});

afterAll(async () => {
  await closePool();
});

describe("checkCoverage", () => {
  it("returns only companies that can buy and serve the move, with display fields", async () => {
    const result = await checkCoverage({ originZip: "75201", destZip: "77002", moveSize: "2br", services: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.move).toMatchObject({ origin: { city: "Dallas", state: "TX" }, destination: { city: "Houston", state: "TX" }, moveType: "intrastate" });
    expect(result.movers.map((m) => m.companyId).sort()).toEqual([alpha, bravo, charlie].sort());
    const first = result.movers.find((m) => m.companyId === alpha)!;
    expect(first).toEqual({
      companyId: alpha,
      displayName: "Demo Alpha Movers",
      usdotNumber: "9000001",
      checkedAt: expect.any(String),
      profileSlug: "demo-alpha-movers",
      isDemo: true,
    });
    expect(Object.keys(first)).not.toContain("coverageVersion");
  });

  it("respects capabilities and services", async () => {
    const big = await checkCoverage({ originZip: "75201", destZip: "77002", moveSize: "3br", services: [] });
    expect(big.ok && big.movers.map((m) => m.companyId).sort()).toEqual([alpha, bravo].sort());
    const storage = await checkCoverage({ originZip: "75201", destZip: "77002", moveSize: "2br", services: ["specialty_items"] });
    expect(storage.ok && storage.movers).toEqual([]);
  });

  it("finds no coverage for an Anchorage, Alaska move and refuses unknown ZIP codes", async () => {
    const alaska = await checkCoverage({ originZip: "99501", destZip: "99503", moveSize: "2br", services: [] });
    expect(alaska).toMatchObject({ ok: true, movers: [], move: { origin: { state: "AK" } } });
    expect(await checkCoverage({ originZip: "00000", destZip: "77002", moveSize: "2br", services: [] })).toEqual({ ok: false, reason: "unknown_origin" });
    expect(await checkCoverage({ originZip: "75201", destZip: "00000", moveSize: "2br", services: [] })).toEqual({ ok: false, reason: "unknown_destination" });
  });

  it("lists the profile-origin company first, and reports it when it doesn't serve the move", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await matchMovers({ originZip: "75201", destZip: "77002", moveSize: "2br", services: [], profileCompanyId: charlie });
      expect(result.ok && result.movers[0]!.companyId).toBe(charlie);
      expect(result.ok && result.profileCompany).toEqual({ companyId: charlie, displayName: "Demo Charlie Movers", eligible: true });
    }
    const notServing = await checkCoverage({ originZip: "75201", destZip: "77002", moveSize: "2br", services: [], profileCompanyId: id(7) });
    expect(notServing.ok && notServing.profileCompany).toEqual({ companyId: id(7), displayName: "Demo Golf Small Homes", eligible: false });
  });

  it("surveyCoverage validates, issues a ticket and returns the active consent and maximum", async () => {
    const result = await surveyCoverage(
      { originZip: "75201", destZip: "77002-1234", moveSize: "2br", services: [], need: "household", profileCompanyId: null },
      { ip: "203.0.113.50" },
    );
    expect(result).toMatchObject({ ok: true, maxLimit: 5, consent: { versionId: "consent-v0-draft" } });
    expect(await surveyCoverage({ originZip: "1", destZip: "77002", moveSize: "huge", services: [], need: null, profileCompanyId: null }, { ip: null })).toMatchObject({
      ok: false,
      kind: "invalid",
      errors: { originZip: expect.any(String), moveSize: expect.any(String) },
    });
  });
});

describe("submitRequest", () => {
  it("stores the request, consent evidence and eligibility, and enqueues the emails after commit", async () => {
    const { input, coverage } = await draft({ limit: 2, removed: [charlie] });
    const result = await submitRequest(input, meta());
    expect(result.ok).toBe(true);
    if (!result.ok || !coverage.ok) return;
    const named = coverage.movers.filter((m) => m.companyId !== charlie).map((m) => m.companyId);
    expect(result.confirmation).toMatchObject({ limit: 2, joinedReferenceCode: null, route: { originCity: "Dallas", destCity: "Houston" } });
    expect(result.confirmation.movers.map((m) => m.companyId)).toEqual(named);
    expect(result.confirmation.referenceCode).toMatch(/^AMC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);

    const lead = (await pool().query("select * from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0];
    expect(lead).toMatchObject({
      status: "qualified",
      is_primary: true,
      selected_limit: 2,
      move_size: "2br",
      move_type: "intrastate",
      origin_city: "Dallas",
      dest_state: "TX",
      channel_scope: ["call", "sms", "email"],
      email: "jordan.rivera@example.com",
      phone_e164: "+12145550199",
      source_category: "organic_search",
      manage_token_hash: sha256Hex(result.manageToken),
    });
    expect(lead.email_hash).toMatch(/^[0-9a-f]{64}$/);
    const group = (await pool().query("select *, extract(epoch from expires_at - created_at) / 3600 as hours from lead_groups where id = $1", [lead.group_id])).rows[0];
    expect(group).toMatchObject({ sharing_limit: 2, policy_version: "share-stepdown-v1-proposal", status: "available" });
    expect(Math.round(Number(group.hours))).toBe(72);

    const consent = (await pool().query("select * from consent_records where lead_id = $1", [lead.id])).rows[0];
    expect(consent).toMatchObject({
      consent_text_version_id: "consent-v0-draft",
      named_company_ids: named,
      removed_company_ids: [charlie],
      selected_limit: 2,
      channel_scope: ["call", "sms", "email"],
      checkbox_state: true,
      terms_version: "terms-ack-v0-draft",
      terms_accepted: true,
      ip: "203.0.113.7",
      page_url: "http://localhost:3000/get-quotes/",
      form_version: "survey-v1",
      tag_manifest_version: "tags-v1-none",
    });
    expect(consent.rendered_text).toContain("Demo Alpha Movers (USDOT 9000001)");
    expect(consent.rendered_text).not.toContain("Demo Charlie Movers");
    expect(consent.rendered_text).not.toMatch(/Terms of Use|Privacy Policy/);
    expect(consent.rendered_text.indexOf(coverage.movers.find((m) => m.companyId === named[0])!.displayName)).toBeLessThan(
      consent.rendered_text.indexOf(coverage.movers.find((m) => m.companyId === named[1])!.displayName),
    );

    const eligibility = (await pool().query("select company_id, named_in_consent, coverage_version from lead_eligibility where group_id = $1", [lead.group_id])).rows;
    expect(Object.fromEntries(eligibility.map((r) => [r.company_id, r.named_in_consent]))).toEqual({ [alpha]: true, [bravo]: true, [charlie]: false });

    const checks = (await pool().query("select check_type, result from lead_validation_results where lead_id = $1", [lead.id])).rows;
    expect(checks).toContainEqual({ check_type: "duplicate_check", result: "pass" });
    expect(checks).toContainEqual({ check_type: "risk_score", result: "pass" });

    const messages = (await pool().query("select template, to_address, body_text, body_secret_enc from messages where related_id in ($1, $2) order by template, to_address", [lead.id, lead.group_id])).rows;
    expect(messages.map((m) => [m.template, m.to_address])).toEqual([
      ["lead_available", "owner-alpha@example.com"],
      ["lead_available", "owner-bravo@example.com"],
      ["request_received", "jordan.rivera@example.com"],
    ]);
    const confirmation = messages.find((m) => m.template === "request_received")!;
    expect(confirmation.body_text).not.toContain(result.manageToken);
    expect(confirmation.body_secret_enc).toBeTruthy();
    for (const notice of messages.filter((m) => m.template === "lead_available")) {
      expect(notice.body_text).not.toMatch(/jordan|rivera|555|75201|77002/i);
    }

    const audit = await pool().query("select actor_type, action from audit_log where entity_id = $1", [lead.id]);
    expect(audit.rows).toEqual([{ actor_type: "consumer", action: "lead.submit" }]);

    // The confirmation page view reads the same record back.
    expect(await getConfirmationByToken(result.manageToken)).toMatchObject({ referenceCode: result.confirmation.referenceCode, limit: 2, movers: result.confirmation.movers });
  });

  it("refuses a number above the movers named and a submission without both boxes ticked", async () => {
    const { input } = await draft({ limit: 3, removed: [charlie], email: "count@example.com", phone: "2145550101" });
    expect(await submitRequest(input, meta())).toMatchObject({ ok: false, kind: "invalid", errors: { limit: expect.any(String) } });
    const unticked = await draft({ email: "unticked@example.com", phone: "2145550102" });
    expect(await submitRequest({ ...unticked.input, consentChecked: false, termsAccepted: false }, meta())).toMatchObject({
      ok: false,
      kind: "invalid",
      errors: { consent: expect.any(String), terms: expect.any(String) },
    });
    const n = await pool().query("select count(*)::int as n from leads where email in ('count@example.com', 'unticked@example.com')");
    expect(n.rows[0].n).toBe(0);
  });

  it("asks again when the consent text the consumer saw no longer matches", async () => {
    const { input } = await draft({ email: "changed@example.com", phone: "2145550103" });
    const tampered = await submitRequest({ ...input, renderedTextSha256: "0".repeat(64) }, meta());
    expect(tampered).toMatchObject({ ok: false, kind: "movers_changed", consent: { versionId: "consent-v0-draft" } });
    const ineligible = await submitRequest({ ...input, shownCompanyIds: [...input.shownCompanyIds, id(4)] }, meta());
    expect(ineligible).toMatchObject({ ok: false, kind: "movers_changed" });
  });

  it("rejects a filled honeypot, a too-fast submission and a forged ticket, storing nothing", async () => {
    const honeypot = await draft({ website: "http://spam.example", email: "bot1@example.com", phone: "2145550104" });
    expect(await submitRequest(honeypot.input, meta())).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    const fast = await draft({ ticketAgeMs: 1000, email: "bot2@example.com", phone: "2145550105" });
    expect(await submitRequest(fast.input, meta())).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    expect(await submitRequest({ ...fast.input, ticket: `${Date.now() - 60_000}.${"a".repeat(32)}` }, meta())).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    const n = await pool().query("select count(*)::int as n from leads where email like 'bot%'");
    expect(n.rows[0].n).toBe(0);
  });

  it("rate limits submissions per IP address", async () => {
    const { input } = await draft({ email: "limited@example.com", phone: "2145550106", limit: 1 });
    for (let i = 0; i < 10; i++) await submitRequest({ ...input, website: "x" }, meta("198.51.100.99"));
    expect(await submitRequest(input, meta("198.51.100.99"))).toEqual({ ok: false, kind: "rejected", reason: "rate_limited" });
  });

  it("holds a risky request for review and notifies no mover", async () => {
    const { input } = await draft({ firstName: "Test", lastName: "Test", email: "test@example.com", phone: "2145550107", limit: 1 });
    const result = await submitRequest(input, meta("198.51.100.20"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lead = (await pool().query("select id, group_id, status, risk_score from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0];
    expect(lead.status).toBe("needs_review");
    expect(lead.risk_score).toBeGreaterThanOrEqual(50);
    const notices = await pool().query("select count(*)::int as n from messages where related_id = $1 and template = 'lead_available'", [lead.group_id]);
    expect(notices.rows[0].n).toBe(0);
  });

  it("joins a repeat request within the duplicate window to the original group and keeps the lowest limit", async () => {
    const first = await draft({ limit: 3, email: "repeat@example.com", phone: "2145550120" });
    const one = await submitRequest(first.input, meta("198.51.100.30"));
    expect(one.ok).toBe(true);
    // Same phone number, different email address, same route; one mover removed and a lower number.
    const second = await draft({ limit: 2, removed: [charlie], email: "repeat.other@example.com", phone: "214-555-0120" });
    const two = await submitRequest(second.input, meta("198.51.100.31"));
    expect(two.ok).toBe(true);
    if (!one.ok || !two.ok) return;
    expect(two.confirmation.joinedReferenceCode).toBe(one.confirmation.referenceCode);
    expect(two.confirmation.limit).toBe(2);
    const rows = (await pool().query("select group_id, is_primary, selected_limit from leads where email in ('repeat@example.com', 'repeat.other@example.com') order by created_at")).rows;
    expect(rows).toHaveLength(2);
    expect(rows[0].group_id).toBe(rows[1].group_id);
    expect(rows.map((r) => r.is_primary)).toEqual([true, false]);
    const group = (await pool().query("select sharing_limit from lead_groups where id = $1", [rows[0].group_id])).rows[0];
    expect(group.sharing_limit).toBe(2);
    const eligibility = (await pool().query("select company_id, named_in_consent from lead_eligibility where group_id = $1", [rows[0].group_id])).rows;
    expect(Object.fromEntries(eligibility.map((r) => [r.company_id, r.named_in_consent]))).toEqual({ [alpha]: true, [bravo]: true, [charlie]: false });
    // A repeat with a higher number can't widen the limit; its consent list replaces the group's.
    const third = await draft({ limit: 3, email: "repeat@example.com", phone: "2145550120" });
    const three = await submitRequest(third.input, meta("198.51.100.32"));
    expect(three.ok && three.confirmation.limit).toBe(2);
    const relisted = (await pool().query("select named_in_consent from lead_eligibility where group_id = $1 and company_id = $2", [rows[0].group_id, charlie])).rows[0];
    expect(relisted.named_in_consent).toBe(true);
    const notices = await pool().query("select count(*)::int as n from messages where related_id = $1 and template = 'lead_available'", [rows[0].group_id]);
    expect(notices.rows[0].n).toBe(2); // only the first request was announced
  });
});

describe("manage and withdraw", () => {
  it("shows the request, blocks purchases after withdrawal and emails the buyers", async () => {
    const { input } = await draft({ limit: 2, email: "withdraw@example.com", phone: "2145550130" });
    const submitted = await submitRequest(input, meta("198.51.100.40"));
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    const token = submitted.manageToken;
    const groupId = (await pool().query("select group_id from leads where reference_code = $1", [submitted.confirmation.referenceCode])).rows[0].group_id;

    // Alpha buys it.
    const attempt = (await pool().query("select (reserve_purchase($1, $2, 'test-withdraw')).*", [alpha, groupId])).rows[0];
    await pool().query("select complete_purchase($1, 'demo_test')", [attempt.id]);

    const before = await getRequestByToken(token, { ip: "198.51.100.41" });
    expect(before.ok && before.value).toMatchObject({
      status: "open",
      limit: 2,
      canWithdraw: true,
      buyers: [{ displayName: "Demo Alpha Movers", usdotNumber: "9000001", profileSlug: "demo-alpha-movers" }],
    });
    expect(before.ok && before.value.named).toHaveLength(3);

    expect(await withdrawRequest(token, { ip: "198.51.100.41" })).toEqual({ ok: true, alreadyWithdrawn: false, buyersNotified: 1 });
    expect(await withdrawRequest(token, { ip: "198.51.100.41" })).toEqual({ ok: true, alreadyWithdrawn: true, buyersNotified: 0 });

    await expect(pool().query("select reserve_purchase($1, $2, 'after-withdraw')", [bravo, groupId])).rejects.toThrow(/lead_unavailable/);
    const after = await getRequestByToken(token, { ip: "198.51.100.41" });
    expect(after.ok && after.value).toMatchObject({ status: "withdrawn", canWithdraw: false });

    const lead = (await pool().query("select id, withdrawn_at, email_hash from leads where group_id = $1", [groupId])).rows[0];
    expect(lead.withdrawn_at).not.toBeNull();
    const prefs = (await pool().query("select do_not_contact, source, email_hash from consumer_contact_preferences where lead_id = $1", [lead.id])).rows;
    expect(prefs).toEqual([{ do_not_contact: true, source: "manage_page", email_hash: lead.email_hash }]);
    const mail = (await pool().query("select template, to_address from messages where related_id in ($1, $2) and template like '%withdrawn' order by template", [groupId, lead.id])).rows;
    expect(mail).toEqual([
      { template: "lead_withdrawn", to_address: "owner-alpha@example.com" },
      { template: "request_withdrawn", to_address: "withdraw@example.com" },
    ]);
    const audit = (await pool().query("select actor_type, action, company_id from audit_log where entity = 'lead_group' and entity_id = $1 order by id", [groupId])).rows;
    expect(audit).toEqual([
      { actor_type: "consumer", action: "lead.withdraw", company_id: null },
      { actor_type: "system", action: "lead.withdraw_notice", company_id: alpha },
    ]);
  });

  it("returns not found for unknown or malformed tokens and rate limits lookups", async () => {
    expect(await getRequestByToken("not-a-token", { ip: "198.51.100.60" })).toEqual({ ok: false, reason: "not_found" });
    expect(await getRequestByToken("A".repeat(43), { ip: "198.51.100.60" })).toEqual({ ok: false, reason: "not_found" });
    expect(await withdrawRequest("A".repeat(43), { ip: "198.51.100.60" })).toEqual({ ok: false, reason: "not_found" });
    for (let i = 0; i < 28; i++) await getRequestByToken("A".repeat(43), { ip: "198.51.100.60" });
    expect(await getRequestByToken("A".repeat(43), { ip: "198.51.100.60" })).toEqual({ ok: false, reason: "rate_limited" });
  });
});

describe("quality helpers", () => {
  it("signs survey tickets and enforces the minimum completion time", () => {
    const secret = "s".repeat(40);
    const now = Date.now();
    const ticket = issueSurveyTicket(secret, now);
    expect(checkSurveyTicket(secret, ticket, now + 1000)).toEqual({ ok: false, reason: "too_fast" });
    expect(checkSurveyTicket(secret, ticket, now + MIN_COMPLETION_SECONDS * 1000 + 1)).toMatchObject({ ok: true });
    expect(checkSurveyTicket("t".repeat(40), ticket, now + 60_000)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSurveyTicket(secret, ticket, now + 7 * 3600_000)).toEqual({ ok: false, reason: "expired" });
  });

  it("scores risk with reasons", () => {
    const clean = riskScore({ firstName: "Ana", lastName: "Ruiz", email: "ana@example.com", elapsedSeconds: 120, recentFromIp: 0, originZip: "75201", destZip: "77002" });
    expect(clean).toEqual({ score: 0, reasons: [] });
    const risky = riskScore({ firstName: "test", lastName: "user", email: "test@example.com", elapsedSeconds: 10, recentFromIp: 6, originZip: "75201", destZip: "75201" });
    expect(risky.score).toBe(100);
    expect(risky.reasons.length).toBeGreaterThan(3);
  });

  it("derives the source category from UTM parameters and the referrer", () => {
    const own = ["http://localhost:3000"];
    expect(sourceCategory({ utmMedium: "cpc", utmSource: "google" }, own)).toBe("paid_search");
    expect(sourceCategory({ utmMedium: "paid_social", utmSource: "facebook" }, own)).toBe("paid_social");
    expect(sourceCategory({ referrerOrigin: "https://www.bing.com" }, own)).toBe("organic_search");
    expect(sourceCategory({ referrerOrigin: "https://blog.example.org" }, own)).toBe("referral");
    expect(sourceCategory({ referrerOrigin: "http://localhost:3000" }, own)).toBe("direct");
    expect(sourceCategory({}, own)).toBe("direct");
  });
});

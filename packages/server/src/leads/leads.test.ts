/**
 * Database tests for lead intake: coverage, submission, duplicates and withdrawal. They run on the
 * server test database (see packages/server/test/database.ts), recreated for this file.
 */
import { renderConsentText, consentTextSha256, isSubmitButtonConsent, type Channel } from "@amc/core/src/survey";
import type { Service } from "@amc/core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { newToken, sha256Hex } from "../auth/tokens";
import { listLeads } from "../admin/leads";
import { closePool, getPool } from "../db/pool";
import { env, hmacSecret } from "../env/env";
import { resetDatabase } from "../../test/helpers";
import { checkCoverage, matchMovers } from "./coverage";
import { getConfirmationByToken, getRequestByToken, withdrawRequest } from "./manage";
import { checkSurveyTicket, issueSurveyTicket, riskScore, sourceCategory, MIN_COMPLETION_SECONDS } from "./quality";
import { activeConsent, submitRequest, SUBMIT_RATE_LIMIT, TICKET_SUBMIT_RATE_LIMIT, type SubmitMeta } from "./submit";
import { surveyCoverage, COVERAGE_RATE_LIMIT } from "./survey-coverage";

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

const meta = (ip: string | null = "203.0.113.7"): SubmitMeta => ({ ip, userAgent: "vitest", pageUrl: "http://localhost:3000/get-quotes/" });

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
  originZip?: string;
  destZip?: string;
  services?: Service[];
}

/** Runs the coverage check and builds a submission the way the survey island does. */
async function draft(options: DraftOptions = {}) {
  const coverage = await checkCoverage({ originZip: options.originZip ?? "75201", destZip: options.destZip ?? "77002", moveSize: "2br", services: options.services ?? [] });
  if (!coverage.ok) throw new Error("coverage failed");
  const shown = options.shown ?? coverage.movers.map((m) => m.companyId);
  const removed = options.removed ?? [];
  const named = coverage.movers.filter((m) => shown.includes(m.companyId) && !removed.includes(m.companyId));
  const ordered = shown.map((sid) => named.find((m) => m.companyId === sid)).filter((m) => m !== undefined);
  const limit = options.limit ?? 2;
  const consent = await activeConsent();
  const submitButton = isSubmitButtonConsent(consent.body);
  const channels = options.channels ?? (submitButton ? ["call", "email"] : ["call", "sms", "email"]) as Channel[];
  const text = renderConsentText(consent.body, { movers: ordered, limit, channels });
  return {
    coverage,
    input: {
      need: "household" as const,
      originZip: options.originZip ?? "75201",
      destZip: options.destZip ?? "77002",
      moveDate: futureDate(30),
      flexible: false,
      latestDate: null,
      moveSize: "2br",
      services: options.services ?? [],
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
      authorizationMethod: submitButton ? "submit_button" : "checkbox",
      consentChecked: !submitButton,
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
  it("excludes fixture recipients and profile fallback names in production while retaining real companies", async () => {
    const originalMode = process.env.NODE_ENV;
    await pool().query("update companies set is_demo = false where id = $1", [alpha]);
    Object.assign(process.env, { NODE_ENV: "production" });
    try {
      const result = await matchMovers({ originZip: "75201", destZip: "77002", moveSize: "2br", services: [], profileCompanyId: bravo });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.movers.map(mover => mover.companyId)).toEqual([alpha]);
      expect(result.movers[0]!.isDemo).toBe(false);
      expect(result.profileCompany).toBeNull();
    } finally {
      Object.assign(process.env, { NODE_ENV: originalMode });
      await pool().query("update companies set is_demo = true where id = $1", [alpha]);
    }
  });

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
    expect(result).toMatchObject({ ok: true, maxLimit: 5, consent: { versionId: "contact-request-submit-v1" } });
    expect(await surveyCoverage({ originZip: "1", destZip: "77002", moveSize: "huge", services: [], need: null, profileCompanyId: null }, { ip: null })).toMatchObject({
      ok: false,
      kind: "invalid",
      errors: { originZip: expect.any(String), moveSize: expect.any(String) },
    });
  });
});

describe("submitRequest", () => {
  it("accepts a valid production request when every otherwise eligible company is a demo fixture", async () => {
    const originalMode = process.env.NODE_ENV;
    Object.assign(process.env, { NODE_ENV: "production" });
    try {
      const { input, coverage } = await draft({ limit: 5, email: "production-intake@example.com", phone: "2145550172" });
      expect(coverage.ok && coverage.movers).toEqual([]);
      const result = await submitRequest(input, meta("198.51.100.217"));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const lead = (await pool().query("select id, group_id, status from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0];
      expect(lead.status).toBe("unmatched");
      expect((await pool().query("select request_intake_pending from lead_groups where id = $1", [lead.group_id])).rows[0].request_intake_pending).toBe(true);
      expect((await pool().query("select count(*)::int n from lead_eligibility where group_id = $1", [lead.group_id])).rows[0].n).toBe(0);
      expect((await pool().query("select named_company_ids from consent_records where lead_id = $1", [lead.id])).rows[0].named_company_ids).toEqual([]);
      expect((await pool().query("select template from messages where related_id = $1 or related_id = $2", [lead.id, lead.group_id])).rows).toEqual([{ template: "request_received" }]);
      expect(result.confirmation.movers).toEqual([]);
    } finally {
      Object.assign(process.env, { NODE_ENV: originalMode });
    }
  });

  it("stores the request, consent evidence and eligibility, and enqueues the emails after commit", async () => {
    const { input, coverage } = await draft({ limit: 2, removed: [charlie] });
    const result = await submitRequest(input, meta());
    expect(result.ok).toBe(true);
    if (!result.ok || !coverage.ok) return;
    const named = coverage.movers.filter((m) => m.companyId !== charlie).map((m) => m.companyId);
    expect(result.confirmation).toMatchObject({ limit: 2, joinedReferenceCode: null, route: { originCity: "Dallas", destCity: "Houston" } });
    expect(result.confirmation.movers).toEqual([]);
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
      channel_scope: ["call", "email"],
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
      consent_text_version_id: "contact-request-submit-v1",
      named_company_ids: expect.arrayContaining(named),
      removed_company_ids: [charlie],
      selected_limit: 2,
      channel_scope: ["call", "email"],
      checkbox_state: false,
      authorization_method: "submit_button",
      contact_automation: "manual_only",
      terms_version: "terms-ack-v0-draft",
      terms_accepted: true,
      ip: "203.0.113.7",
      page_url: "http://localhost:3000/get-quotes/",
      form_version: "survey-v3-compact-submit",
      tag_manifest_version: "tags-v1-none",
    });
    expect(consent.named_company_ids).toHaveLength(named.length);
    expect(consent.rendered_text).toContain("up to 2 moving companies");
    expect(consent.recipient_disclosure_mode).toBe("request_intake");
    expect(consent.rendered_text).not.toMatch(/Demo|USDOT/);
    expect(consent.rendered_text).not.toContain("Demo Charlie Movers");
    expect(consent.rendered_text).toContain("I accept the Terms of Use and acknowledge the Privacy Policy.");
    expect(consent.rendered_text).not.toMatch(/text messages|automated|prerecorded|STOP/i);


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

  it("refuses an excessive count, an invalid affirmative action and missing terms acceptance", async () => {
    const { input } = await draft({ limit: 6, removed: [charlie], email: "count@example.com", phone: "2145550101" });
    expect(await submitRequest(input, meta())).toMatchObject({ ok: false, kind: "invalid", errors: { limit: expect.any(String) } });
    const unticked = await draft({ email: "unticked@example.com", phone: "2145550102" });
    expect(await submitRequest({ ...unticked.input, consentChecked: true, termsAccepted: false }, meta())).toMatchObject({
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
    expect(tampered).toMatchObject({ ok: false, kind: "movers_changed", consent: { versionId: "contact-request-submit-v1" } });
    const ineligible = await submitRequest({ ...input, shownCompanyIds: [...input.shownCompanyIds, id(4)] }, meta());
    expect(ineligible.ok).toBe(true);
    if (ineligible.ok) {
      const saved = (await pool().query("select c.named_company_ids from consent_records c join leads l on l.id = c.lead_id where l.reference_code = $1", [ineligible.confirmation.referenceCode])).rows[0];
      expect(saved.named_company_ids).not.toContain(id(4));
    }
  });

  it("does not accept forged checkbox evidence, an absent submit action or SMS scope in compact mode", async () => {
    const { input } = await draft({ email: "compact-scope@example.com", phone: "2145550170" });
    expect(await submitRequest({ ...input, consentChecked: true }, meta("198.51.100.210"))).toMatchObject({ ok: false, kind: "invalid", errors: { consent: expect.any(String) } });
    expect(await submitRequest({ ...input, authorizationMethod: "checkbox", consentChecked: true }, meta("198.51.100.211"))).toMatchObject({ ok: false, kind: "movers_changed" });
    expect(await submitRequest({ ...input, channels: ["call", "sms", "email"] }, meta("198.51.100.212"))).toMatchObject({ ok: false, kind: "invalid", errors: { channels: expect.any(String) } });
    expect((await pool().query("select count(*)::int n from leads where email=$1", [input.email])).rows[0].n).toBe(0);
  });

  it("stores an unmatched valid request with full consent and no eligible recipients or mover notices", async () => {
    const { input, text } = await draft({ originZip: "99501", destZip: "99503", shown: [], limit: 5, email: "unmatched@example.com", phone: "2145550161" });
    const result = await submitRequest(input, meta("198.51.100.201"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lead = (await pool().query("select id, group_id, status from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0];
    expect(lead.status).toBe("unmatched");
    expect((await pool().query("select request_intake_pending from lead_groups where id = $1", [lead.group_id])).rows[0].request_intake_pending).toBe(true);
    const consent = (await pool().query("select * from consent_records where lead_id = $1", [lead.id])).rows[0];
    expect(consent).toMatchObject({ recipient_disclosure_mode: "request_intake", named_company_ids: [], removed_company_ids: [], selected_limit: 5, checkbox_state: false, authorization_method: "submit_button", contact_automation: "manual_only", channel_scope: ["call", "email"], terms_accepted: true, rendered_text: text, rendered_text_sha256: consentTextSha256(text) });
    expect((await pool().query("select count(*)::int n from lead_eligibility where group_id = $1", [lead.group_id])).rows[0].n).toBe(0);
    expect((await pool().query("select template from messages where related_id = $1 or related_id = $2 order by created_at", [lead.id, lead.group_id])).rows).toEqual([{ template: "request_received" }]);
    expect(await getConfirmationByToken(result.manageToken)).toMatchObject({ referenceCode: result.confirmation.referenceCode, movers: [], limit: 5 });
    const request = await getRequestByToken(result.manageToken, { ip: null });
    expect(request.ok).toBe(true);
    if (request.ok) expect(request.value).toMatchObject({ status: "received", canWithdraw: true, buyerCount: 0 });
    const queue = await listLeads({ status: "unmatched" });
    expect(queue.rows.some(row => row.id === lead.id)).toBe(true);
    for (const key of ["email", "phone_e164", "first_name", "last_name"]) expect(queue.rows.find(row => row.id === lead.id)).not.toHaveProperty(key);
    await expect(pool().query("select reserve_purchase($1, $2, 'unmatched-intake')", [alpha, lead.group_id])).rejects.toThrow(/not_eligible_for_lead|lead_unavailable/);
    const guardLead = (await pool().query("insert into leads(group_id,selected_limit,first_name,last_name,email,phone_e164,origin_zip,dest_zip) values($1,1,'Legacy','Guard','legacy-guard@example.com','+12145550165','99501','99503') returning id", [lead.group_id])).rows[0].id;
    await expect(pool().query(`insert into consent_records
      select (jsonb_populate_record(null::consent_records, to_jsonb(c) || jsonb_build_object('id',gen_random_uuid(),'lead_id',$1::uuid,'recipient_disclosure_mode','contact_introduction','authorization_method','checkbox','checkbox_state',true,'contact_automation','legacy_text','consent_text_version_id','contact-introduction-v1-draft'))).*
      from consent_records c where lead_id=$2`, [guardLead,lead.id])).rejects.toThrow(/consent_records_recipient_snapshot_check/);
    // The synthetic constraint fixture is not part of this consumer's independent request.
    await pool().query("delete from leads where id=$1", [guardLead]);
    await pool().query("update lead_groups set expires_at=now()-interval '1 day',status='expired' where id=$1", [lead.group_id]);
    const later = await getRequestByToken(result.manageToken, { ip: null });
    if (later.ok) expect(later.value).toMatchObject({ status: "received", canWithdraw: true });
    expect(await withdrawRequest(result.manageToken, { ip: null })).toMatchObject({ ok: true });
    const withdrawn = await getRequestByToken(result.manageToken, { ip: null });
    if (withdrawn.ok) expect(withdrawn.value).toMatchObject({ status: "withdrawn", canWithdraw: false });
  });

  it("accepts changed capacity at send time and uses only the fresh eligible snapshot", async () => {
    const { input } = await draft({ limit: 5, email: "capacity@example.com", phone: "2145550162" });
    const result = await submitRequest({ ...input, services: ["specialty_items"] }, meta("198.51.100.202"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((await pool().query("select status from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0].status).toBe("unmatched");
  });

  it("accepts a contact ceiling above currently available recipients without inventing recipients", async () => {
    const { input } = await draft({ limit: 5, email: "ceiling@example.com", phone: "2145550163" });
    const result = await submitRequest(input, meta("198.51.100.203"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = (await pool().query("select c.selected_limit, c.named_company_ids from consent_records c join leads l on l.id=c.lead_id where l.reference_code=$1", [result.confirmation.referenceCode])).rows[0];
    expect(row.selected_limit).toBe(5);
    expect(row.named_company_ids.sort()).toEqual([alpha, bravo, charlie].sort());
  });

  it("keeps an earlier reservation available when an unverified repeat has no eligible recipient", async () => {
    const first = await draft({ limit: 2, email: "pending-repeat@example.com", phone: "2145550164" });
    const one = await submitRequest(first.input, meta("198.51.100.204"));
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    const group = (await pool().query("select group_id from leads where reference_code=$1", [one.confirmation.referenceCode])).rows[0].group_id;
    const attempt = (await pool().query("select (reserve_purchase($1,$2,'before-unmatched')).id", [alpha, group])).rows[0].id;
    const second = await draft({ limit: 1, services: ["specialty_items"], email: "pending-repeat@example.com", phone: "2145550164" });
    const two = await submitRequest(second.input, meta("198.51.100.205"));
    expect(two.ok).toBe(true);
    if (!two.ok) return;
    expect(two.confirmation.joinedReferenceCode).toBeNull();
    const newGroup = (await pool().query("select group_id from leads where reference_code=$1", [two.confirmation.referenceCode])).rows[0].group_id;
    expect(newGroup).not.toBe(group);
    expect((await pool().query("select sharing_limit, request_intake_pending from lead_groups where id=$1", [group])).rows[0]).toMatchObject({ sharing_limit: 2, request_intake_pending: false });
    expect((await pool().query("select request_intake_pending from lead_groups where id=$1", [newGroup])).rows[0].request_intake_pending).toBe(true);
    expect((await pool().query("select (complete_purchase($1,'synthetic-paid-before-unmatched')).id is not null as completed", [attempt])).rows[0].completed).toBe(true);
    expect((await pool().query("select count(*)::int n from purchases where group_id=$1", [group])).rows[0].n).toBe(1);
    await expect(pool().query("select reserve_purchase($1,$2,'unmatched-repeat')", [bravo, newGroup])).rejects.toThrow(/lead_unavailable|not_eligible_for_lead/);
  });

  it("retains legacy snapshot and empty-coverage protections when the legacy consent version is active", async () => {
    await pool().query("update platform_settings set value='\"contact-introduction-v1-draft\"'::jsonb where key='active_consent_version'");
    try {
      const { input } = await draft({ limit: 2, email: "legacy@example.com", phone: "2145550166" });
      expect(await submitRequest({ ...input, shownCompanyIds: [...input.shownCompanyIds, id(4)] }, meta("198.51.100.206"))).toMatchObject({ ok: false, kind: "movers_changed" });
      expect(await submitRequest({ ...input, originZip: "99501", destZip: "99503", shownCompanyIds: [] }, meta("198.51.100.207"))).toMatchObject({ ok: false, kind: "no_coverage" });
      const fast = await draft({ ticketAgeMs: 1000, email: "legacy-fast@example.com", phone: "2145550172" });
      const fastNow = new Date(Number(fast.input.ticket.split(".")[0]) + 1000);
      expect(await submitRequest(fast.input, { ...meta("198.51.100.217"), now: fastNow })).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    } finally {
      await pool().query("update platform_settings set value='\"contact-request-submit-v1\"'::jsonb where key='active_consent_version'");
    }
  });

  it("accepts a fast valid compact submission and records elapsed time as a quality flag", async () => {
    const fast = await draft({ ticketAgeMs: 1000, email: "fast-human@example.com", phone: "2145550171" });
    const submittedAt = new Date(Number(fast.input.ticket.split(".")[0]) + 1000);
    const result = await submitRequest(fast.input, { ...meta("198.51.100.216"), now: submittedAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lead = (await pool().query("select id,status,risk_score from leads where reference_code=$1", [result.confirmation.referenceCode])).rows[0];
    expect(lead).toMatchObject({ status: "qualified", risk_score: 15 });
    expect((await pool().query("select result,reason from lead_validation_results where lead_id=$1 and check_type='min_completion_time'", [lead.id])).rows[0]).toMatchObject({ result: "flag", reason: expect.stringContaining("Sent 1 seconds") });
  });

  it("rejects a filled honeypot and forged, future or expired compact tickets, storing nothing", async () => {
    const honeypot = await draft({ website: "http://spam.example", email: "bot1@example.com", phone: "2145550104" });
    expect(await submitRequest(honeypot.input, meta())).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    const invalid = await draft({ email: "bot2@example.com", phone: "2145550105" });
    const checkedAt = Date.now();
    expect(await submitRequest({ ...invalid.input, ticket: `${checkedAt - 60_000}.${"a".repeat(32)}` }, meta())).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    expect(await submitRequest({ ...invalid.input, ticket: issueSurveyTicket(hmacSecret(), checkedAt + 60_000) }, { ...meta(), now: new Date(checkedAt) })).toEqual({ ok: false, kind: "rejected", reason: "automated" });
    expect(await submitRequest({ ...invalid.input, ticket: issueSurveyTicket(hmacSecret(), checkedAt - 7 * 3600_000) }, { ...meta(), now: new Date(checkedAt) })).toEqual({ ok: false, kind: "expired" });
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
    const named = (await pool().query("select company_id from lead_eligibility where group_id = $1 and named_in_consent limit 1", [lead.group_id])).rows[0];
    if (named) {
      await expect(pool().query("select reserve_purchase($1, $2, 'held-for-review')", [named.company_id, lead.group_id])).rejects.toThrow(/lead_unavailable/);
    }
  });

  it.each([
    { label: "email only", n: 0, sameEmail: true, samePhone: false },
    { label: "phone only", n: 1, sameEmail: false, samePhone: true },
    { label: "both contact details", n: 2, sameEmail: true, samePhone: true },
  ])("does not grant an unverified submission access to another request using $label", async ({ n, sameEmail, samePhone }) => {
    const originalEmail = `request-owner-${n}@example.com`;
    const originalPhone = `214555012${n}`;
    const first = await draft({ limit: 3, email: originalEmail, phone: originalPhone });
    const one = await submitRequest(first.input, meta(`198.51.100.${30 + n * 2}`));
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    // Contact and route knowledge are not management authorization, even when both contacts match.
    const second = await draft({ limit: 1, removed: [charlie], email: sameEmail ? originalEmail : `unverified-repeat-${n}@example.com`, phone: samePhone ? originalPhone : `214555014${n}` });
    const two = await submitRequest(second.input, meta(`198.51.100.${31 + n * 2}`));
    expect(two.ok).toBe(true);
    if (!two.ok) return;
    expect(two.confirmation).toMatchObject({ joinedReferenceCode: null, limit: 1 });
    expect(JSON.stringify(two.confirmation)).not.toContain(one.confirmation.referenceCode);
    const original = (await pool().query("select id, group_id, is_primary from leads where reference_code=$1", [one.confirmation.referenceCode])).rows[0];
    const repeated = (await pool().query("select id, group_id, is_primary from leads where reference_code=$1", [two.confirmation.referenceCode])).rows[0];
    expect(original.group_id).not.toBe(repeated.group_id);
    expect(original.is_primary).toBe(true);
    expect(repeated.is_primary).toBe(true);
    expect((await pool().query("select sharing_limit, request_intake_pending, status from lead_groups where id=$1", [original.group_id])).rows[0]).toMatchObject({ sharing_limit: 3, request_intake_pending: false, status: "available" });
    const eligibility = (await pool().query("select company_id, named_in_consent from lead_eligibility where group_id=$1", [original.group_id])).rows;
    expect(Object.fromEntries(eligibility.map(r => [r.company_id, r.named_in_consent]))).toEqual({ [alpha]: true, [bravo]: true, [charlie]: true });
    const check = (await pool().query("select result, reason from lead_validation_results where lead_id=$1 and check_type='duplicate_check'", [repeated.id])).rows[0];
    expect(check.result).toBe("flag");
    expect(check.reason).toContain(one.confirmation.referenceCode); // Admin-only evidence is retained.
    expect(check.reason).toContain("Saved separately");
    const confirmation = await getConfirmationByToken(two.manageToken);
    expect(confirmation?.joinedReferenceCode).toBeNull();
    expect(JSON.stringify(confirmation)).not.toContain(one.confirmation.referenceCode);
    const messages = (await pool().query("select body_text from messages where related_id=$1", [repeated.id])).rows;
    expect(JSON.stringify(messages)).not.toContain(one.confirmation.referenceCode);
    const managed = await getRequestByToken(two.manageToken, { ip: `198.51.100.${80 + n}` });
    expect(managed.ok && managed.value).toMatchObject({ joined: false, limit: 1, buyerCount: 0 });
    expect(await withdrawRequest(two.manageToken, { ip: `198.51.100.${80 + n}` })).toMatchObject({ ok: true, alreadyWithdrawn: false, buyersNotified: 0 });
    const stillOpen = await getRequestByToken(one.manageToken, { ip: `198.51.100.${90 + n}` });
    expect(stillOpen.ok && stillOpen.value).toMatchObject({ status: "open", withdrawnAt: null, canWithdraw: true, limit: 3 });
    expect((await pool().query("select withdrawn_at from leads where id=$1", [original.id])).rows[0].withdrawn_at).toBeNull();
    expect((await pool().query("select count(*)::int n from consumer_contact_preferences where lead_id=$1", [original.id])).rows[0].n).toBe(0);
  });
});

describe("manage and withdraw", () => {
  it.each(["primary", "secondary"] as const)("refuses a legacy combined group's %s token without changing its records", async tokenKind => {
    const { input } = await draft({ email: `legacy-combined-${tokenKind}@example.com`, phone: tokenKind === "primary" ? "2145550173" : "2145550174" });
    const submitted = await submitRequest(input, meta("198.51.100.73"));
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    const primary = (await pool().query("select id, group_id from leads where reference_code=$1", [submitted.confirmation.referenceCode])).rows[0];
    const secondaryToken = newToken();
    // Recreate stored legacy state. Current public intake can no longer join this group.
    await pool().query(
      `insert into leads (group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip,
                          is_primary, status, move_date, move_date_flexible, move_size, channel_scope,
                          origin_city, origin_state, dest_city, dest_state, email_hash, phone_hash, manage_token_hash)
       select group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip,
              false, status, move_date, move_date_flexible, move_size, channel_scope,
              origin_city, origin_state, dest_city, dest_state, email_hash, phone_hash, $2
       from leads where id=$1`,
      [primary.id, sha256Hex(secondaryToken)],
    );
    const token = tokenKind === "primary" ? submitted.manageToken : secondaryToken;
    const snapshot = async () => ({
      group: (await pool().query("select id, status, sharing_limit, request_intake_pending from lead_groups where id=$1", [primary.group_id])).rows,
      leads: (await pool().query("select id, is_primary, withdrawn_at from leads where group_id=$1 order by id", [primary.group_id])).rows,
      preferences: (await pool().query("select id from consumer_contact_preferences where lead_id in (select id from leads where group_id=$1) order by id", [primary.group_id])).rows,
      audit: (await pool().query("select id from audit_log where entity='lead_group' and entity_id=$1 order by id", [primary.group_id])).rows,
      messages: (await pool().query("select id from messages where related_id=$1 or related_id in (select id from leads where group_id=$1) order by id", [primary.group_id])).rows,
    });
    const before = await snapshot();
    expect(before.leads).toHaveLength(2);
    expect(await getRequestByToken(token, { ip: "198.51.100.74" })).toEqual({ ok: false, reason: "not_found" });
    expect(await getConfirmationByToken(token)).toBeNull();
    expect(await withdrawRequest(token, { ip: "198.51.100.74" })).toEqual({ ok: false, reason: "not_found" });
    expect(await snapshot()).toEqual(before);
  });

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
      buyers: [],
      buyerCount: 1,
    });
    expect(before.ok && before.value.named).toHaveLength(0);
    expect(JSON.stringify(before)).not.toMatch(/Demo Alpha Movers|9000001|demo-alpha-movers/);

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
    expect(checkSurveyTicket(secret, ticket, now + 1000, 0)).toEqual({ ok: true, elapsedSeconds: 1 });
    expect(checkSurveyTicket(secret, ticket, now + MIN_COMPLETION_SECONDS * 1000 + 1)).toMatchObject({ ok: true });
    expect(checkSurveyTicket("t".repeat(40), ticket, now + 60_000)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSurveyTicket(secret, ticket, now + 7 * 3600_000)).toEqual({ ok: false, reason: "expired" });
    expect(checkSurveyTicket("t".repeat(40), ticket, now + 1000, 0)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSurveyTicket(secret, ticket, now - 1000, 0)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSurveyTicket(secret, ticket, now + 7 * 3600_000, 0)).toEqual({ ok: false, reason: "expired" });
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
    expect(sourceCategory({ clickIds: { msclkid: "1234567890abcdef1234567890abcdef" } }, own)).toBe("paid_search");
    expect(sourceCategory({ utmMedium: "cpc", utmSource: "facebook" }, own)).toBe("paid_social");
    expect(sourceCategory({ clickIds: { fbclid: "FacebookClick_A12345" } }, own)).toBe("other");
  });
});

describe("campaign attribution persistence", () => {
  it("stores distinct first and last touches in the existing table without exposing click identifiers to consumers", async () => {
    const { input } = await draft({ email: "campaign-first-last@example.com", phone: "2145550187" });
    const result = await submitRequest({ ...input, attribution: {
      first: { landingPath: "/planning/?email=private@example.com&originZip=75201", referrerOrigin: "https://www.google.com/search?q=private", utmSource: "google", utmMedium: "cpc", utmCampaign: "summer-first", utmTerm: "moving quotes", utmContent: "hero-A", clickIds: { gclid: "GoogleAdClick_A12345" }, device: "mobile" },
      last: { landingPath: "/services/local/", referrerOrigin: "https://www.bing.com/search?q=private", utmSource: "bing", utmMedium: "cpc", utmCampaign: "summer-last", utmTerm: "local movers", utmContent: "text-B", clickIds: { msclkid: "1234567890abcdef1234567890abcdef" }, device: "desktop" },
    } }, meta("198.51.100.171"));
    expect(result.ok).toBe(true); if (!result.ok) return;
    const lead = (await pool().query("select id, source_category from leads where reference_code = $1", [result.confirmation.referenceCode])).rows[0];
    const touches = (await pool().query("select touch, landing_url, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, click_ids, device, source_category, evidence_level from attribution_touches where lead_id = $1 order by case touch when 'first' then 0 else 1 end", [lead.id])).rows;
    expect(lead.source_category).toBe("paid_search");
    expect(touches).toEqual([
      { touch: "first", landing_url: `${env().WEB_URL}/planning/`, referrer: "https://www.google.com", utm_source: "google", utm_medium: "cpc", utm_campaign: "summer-first", utm_term: "moving quotes", utm_content: "hero-A", click_ids: { gclid: "GoogleAdClick_A12345" }, device: "mobile", source_category: "paid_search", evidence_level: "observed" },
      { touch: "last", landing_url: `${env().WEB_URL}/services/local/`, referrer: "https://www.bing.com", utm_source: "bing", utm_medium: "cpc", utm_campaign: "summer-last", utm_term: "local movers", utm_content: "text-B", click_ids: { msclkid: "1234567890abcdef1234567890abcdef" }, device: "desktop", source_category: "paid_search", evidence_level: "observed" },
    ]);
    expect(JSON.stringify(touches)).not.toMatch(/private@|originZip|75201|search\?/u);
    const consumerView = await getRequestByToken(result.manageToken, { ip: "198.51.100.172" });
    expect(JSON.stringify([result, consumerView])).not.toMatch(/GoogleAdClick|1234567890abcdef1234567890abcdef|summer-first|summer-last/u);
  });
  it("does not reject a valid request because optional marketing metadata is malformed", async () => {
    const { input } = await draft({ email: "campaign-invalid@example.com", phone: "2145550186" });
    const result = await submitRequest({ ...input, attribution: { first: { utmSource: { wrong: true }, clickIds: "invalid" } } }, meta("198.51.100.173"));
    expect(result.ok).toBe(true); if (!result.ok) return;
    const touches = (await pool().query("select a.touch, a.evidence_level, a.click_ids from attribution_touches a join leads l on l.id = a.lead_id where l.reference_code = $1", [result.confirmation.referenceCode])).rows;
    expect(touches).toHaveLength(2);
    expect(touches.every(touch => touch.evidence_level === "unknown" && touch.click_ids === null)).toBe(true);
  });
});

describe("public-form abuse controls", () => {
  it("counts malformed quote attempts even when a trusted client IP is unavailable", async () => {
    for (let i = 0; i < SUBMIT_RATE_LIMIT.limit; i++) {
      expect((await submitRequest(null, meta(null))).ok).toBe(false);
    }
    const { input } = await draft({ email: "missing-ip-limited@example.com", phone: "2145550187" });
    expect(await submitRequest(input, meta(null))).toEqual({ ok: false, kind: "rejected", reason: "rate_limited" });
    expect((await pool().query("select count(*)::int as n from leads where email='missing-ip-limited@example.com'")).rows[0].n).toBe(0);
  });
  it("counts malformed ticket-preparation attempts instead of skipping the unknown-IP bucket", async () => {
    for (let i = 0; i < COVERAGE_RATE_LIMIT.limit; i++) expect(await surveyCoverage(null, { ip: null })).toMatchObject({ ok: false, kind: "invalid" });
    expect(await surveyCoverage(null, { ip: null })).toEqual({ ok: false, kind: "rate_limited" });
  });
  it("does not let changing IPv6 privacy suffixes reset quote submission limits", async () => {
    const { input } = await draft({ email: "ipv6-limited@example.com", phone: "2145550188" });
    for (let i = 1; i <= SUBMIT_RATE_LIMIT.limit; i++) await submitRequest({ ...input, website: "spam" }, meta(`2001:db8:abcd:1::${i}`));
    expect(await submitRequest(input, meta("2001:db8:abcd:1::ffff"))).toEqual({ ok: false, kind: "rejected", reason: "rate_limited" });
    expect((await submitRequest(input, meta("2001:db8:abcd:2::1"))).ok).toBe(true);
  });
  it("limits reuse of a harvested signed ticket across different networks", async () => {
    const { input } = await draft({ email: "ticket-replay-limited@example.com", phone: "2145550189" });
    for (let i = 0; i < TICKET_SUBMIT_RATE_LIMIT.limit; i++) expect((await submitRequest(input, meta(`192.0.2.${i + 10}`))).ok).toBe(true);
    const before = (await pool().query("select count(*)::int as n from leads where email='ticket-replay-limited@example.com'")).rows[0].n;
    expect(await submitRequest(input, meta("192.0.2.100"))).toEqual({ ok: false, kind: "rejected", reason: "rate_limited" });
    expect((await pool().query("select count(*)::int as n from leads where email='ticket-replay-limited@example.com'")).rows[0].n).toBe(before);
  });
});

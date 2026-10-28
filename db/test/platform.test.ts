import { createHash } from "node:crypto";
import { US_STATES } from "@amc/core";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { databaseUrl, resetDatabase } from "./helpers";

const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
afterAll(() => pool.end());
beforeEach(() => resetDatabase(pool));

const POLICY = "share-stepdown-v1-proposal";
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

async function insertRow(table: string, values: Record<string, unknown>, returning = "id"): Promise<Record<string, unknown>> {
  const keys = Object.keys(values);
  const { rows } = await pool.query(
    `insert into ${table} (${keys.join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")}) returning ${returning}`,
    Object.values(values),
  );
  return rows[0] as Record<string, unknown>;
}

/** An approved, purchase-ready company with a price row. */
let usdotSeq = 9000001;
async function company(over: Record<string, unknown> = {}): Promise<string> {
  const usdot = String(usdotSeq++);
  const row = await insertRow("companies", {
    legal_name: "Demo Test Movers", status: "approved", usdot_number: usdot, mc_number: `MC-${usdot}`, ...over,
  });
  const id = row.id as string;
  await pool.query("insert into company_prices(company_id, exclusive_cents, shared_cents, set_by) values ($1, 9000, 4000, 'test')", [id]);
  return id;
}

async function leadGroup(limit: number): Promise<{ groupId: string; leadId: string }> {
  const g = await insertRow("lead_groups", { sharing_limit: limit, policy_version: POLICY });
  const l = await insertRow("leads", {
    group_id: g.id, selected_limit: limit, first_name: "Dana", last_name: "Private", email: "dana@demo.invalid",
    phone_e164: "+15125550101", origin_zip: "78704", dest_zip: "77006",
  });
  return { groupId: g.id as string, leadId: l.id as string };
}

/** Matcher snapshot: the company is eligible and was named to the consumer. */
async function offer(groupId: string, companyId: string): Promise<void> {
  await pool.query(
    `insert into lead_eligibility(group_id, company_id, matched_rule_id, named_in_consent, coverage_version)
     select $1, id, 'rule-1', true, coverage_version from companies where id = $2`, [groupId, companyId]);
}

async function buy(companyId: string, groupId: string): Promise<string> {
  await offer(groupId, companyId);
  const attempt = await pool.query("select (reserve_purchase($1, $2, $3)).id", [companyId, groupId, `k-${companyId}`]);
  const attemptId = attempt.rows[0].id as string;
  const purchase = await pool.query("select (complete_purchase($1, $2)).id", [attemptId, `pi_${attemptId}`]);
  return purchase.rows[0].id as string;
}

async function coverageVersion(companyId: string): Promise<number> {
  const { rows } = await pool.query("select coverage_version from companies where id = $1", [companyId]);
  return rows[0].coverage_version as number;
}

/** Runs one statement and asserts that it moved the company's coverage_version on. */
async function expectBump(companyId: string, sql: string, params: unknown[]): Promise<pg.QueryResult> {
  const before = await coverageVersion(companyId);
  const result = await pool.query(sql, params);
  expect(await coverageVersion(companyId), sql).toBeGreaterThan(before);
  return result;
}

function consentRecordValues(leadId: string, named: string[], over: Record<string, unknown> = {}): Record<string, unknown> {
  const text = "Up to 1 of these participating movers may receive your details and contact you:\nDemo Test Movers (USDOT 9000001)\n\nI agree that up to 1 of the movers listed above may contact me.";
  return {
    lead_id: leadId, consent_text_version_id: "consent-v0-draft", rendered_text: text, rendered_text_sha256: sha256(text),
    named_company_ids: named, removed_company_ids: [], selected_limit: 1, channel_scope: ["call", "sms", "email"],
    checkbox_state: true, terms_version: "terms-draft-1", terms_accepted: true, privacy_version: "privacy-draft-1",
    privacy_acknowledged: true, ip: "203.0.113.7", user_agent: "vitest", page_url: "https://preview.example/get-quotes",
    form_version: "survey-v1", form_state_sha256: sha256("{}"), ab_variant: "none", phone_hash: sha256("+15125550101"),
    email_hash: sha256("dana@demo.invalid"), tag_manifest_version: "tags-v1", ...over,
  };
}

describe("coverage_version trigger", () => {
  it("moves on with every insert, update and delete of capabilities, rules and rule locations", async () => {
    const c = await company();
    await expectBump(c, "insert into company_capabilities(company_id, move_types, move_sizes, services) values ($1, '{local}', '{2br}', '{packing}')", [c]);
    await expectBump(c, "update company_capabilities set move_types = '{local,intrastate}' where company_id = $1", [c]);
    const { rows } = await expectBump(c, "insert into coverage_rules(company_id, kind, move_types) values ($1, 'include', '{local}') returning id", [c]);
    const rule = rows[0].id as string;
    await expectBump(c, "insert into coverage_rule_locations(rule_id, side, level, value) values ($1, 'origin', 'state', 'TX')", [rule]);
    await expectBump(c, "update coverage_rule_locations set value = 'FL' where rule_id = $1", [rule]);
    await expectBump(c, "update coverage_rules set paused = true where id = $1", [rule]);
    await expectBump(c, "delete from coverage_rule_locations where rule_id = $1", [rule]);
    await expectBump(c, "insert into coverage_rule_locations(rule_id, side, level, value) values ($1, 'destination', 'county', '12086')", [rule]);
    await expectBump(c, "delete from coverage_rules where id = $1", [rule]); // its locations cascade
    expect((await pool.query("select count(*)::int n from coverage_rule_locations")).rows[0].n).toBe(0);
    await expectBump(c, "delete from company_capabilities where company_id = $1", [c]);
  });

  it("bumps both companies when a rule or a location moves, and ignores non-coverage edits", async () => {
    const a = await company();
    const b = await company();
    const ra = (await insertRow("coverage_rules", { company_id: a, kind: "include" })).id as string;
    const rb = (await insertRow("coverage_rules", { company_id: b, kind: "include" })).id as string;
    await pool.query("insert into coverage_rule_locations(rule_id, side, level, value) values ($1, 'origin', 'zip', '78704')", [ra]);
    const va = await coverageVersion(a);
    const vb = await coverageVersion(b);
    await pool.query("update coverage_rule_locations set rule_id = $2 where rule_id = $1", [ra, rb]);
    expect([await coverageVersion(a), await coverageVersion(b)]).toEqual([va + 1, vb + 1]);
    await pool.query("update coverage_rules set company_id = $2 where id = $1", [ra, b]);
    expect([await coverageVersion(a), await coverageVersion(b)]).toEqual([va + 2, vb + 2]);
    await pool.query("insert into company_profiles(company_id, slug, display_name) values ($1, 'demo-a', 'Demo A')", [a]);
    await pool.query("update companies set phone = '+15125550100' where id = $1", [a]);
    await pool.query("insert into company_prices(company_id, exclusive_cents, shared_cents, set_by) values ($1, 1, 1, 'test')", [a]);
    expect(await coverageVersion(a)).toBe(va + 2);
  });

  it("makes eligibility snapshots taken before a coverage edit stale at purchase", async () => {
    const c = await company();
    const { groupId } = await leadGroup(2);
    await offer(groupId, c);
    await pool.query("insert into coverage_rules(company_id, kind) values ($1, 'include')", [c]);
    await expect(pool.query("select reserve_purchase($1, $2, 'k1')", [c, groupId])).rejects.toThrow(/eligibility_stale/);
  });
});

describe("append-only tables", () => {
  const tables: [string, string][] = [
    ["verification_checks", "created_at"],
    ["consent_records", "submitted_at"],
    ["audit_log", "created_at"],
    ["moderation_actions", "created_at"],
    ["ledger_entries", "created_at"],
  ];

  async function oneRowEach(): Promise<void> {
    const c = await company();
    const { leadId } = await leadGroup(1);
    await insertRow("verification_checks", { company_id: c, check_type: "usdot_active", source: "fixture", result: "pass" });
    await insertRow("consent_records", consentRecordValues(leadId, [c]));
    await insertRow("audit_log", { actor_type: "system", action: "test.run", entity: "company", entity_id: c });
    await insertRow("moderation_actions", { target_type: "review", target_id: c, action: "publish", reason: "test" });
    await insertRow("ledger_entries", { company_id: c, kind: "adjustment", amount_cents: 500, note: "goodwill", dedupe_key: "adj:test" });
  }

  it.each(tables)("%s accepts inserts and rejects update and delete", async (table, column) => {
    await oneRowEach();
    const count = async () => (await pool.query(`select count(*)::int n from ${table}`)).rows[0].n as number;
    expect(await count()).toBe(1);
    await expect(pool.query(`update ${table} set ${column} = ${column}`)).rejects.toThrow(`append_only: update is not allowed on ${table}`);
    await expect(pool.query(`delete from ${table}`)).rejects.toThrow(`append_only: delete is not allowed on ${table}`);
    await expect(pool.query(`truncate ${table} cascade`)).rejects.toThrow(`append_only: truncate is not allowed on ${table}`);
    expect(await count()).toBe(1);
  });

  it("still lets the 001 purchase and refund functions write the ledger", async () => {
    const c = await company();
    const { groupId } = await leadGroup(1);
    const purchase = await buy(c, groupId);
    await pool.query("select refund_purchase($1, 'credit', 9000, 'test')", [purchase]);
    const { rows } = await pool.query("select kind from ledger_entries order by id");
    expect(rows.map((r) => r.kind)).toEqual(["purchase_charge", "quality_refund_credit"]);
  });
});

describe("CRM row-level security", () => {
  it("keeps crm_records and crm_activities private to the company in app.company_id, even for the table owner", async () => {
    const a = await company();
    const b = await company();
    const { groupId } = await leadGroup(2);
    const pa = await buy(a, groupId);
    const pb = await buy(b, groupId);
    // As in Supabase, a non-superuser role owns the CRM tables and FORCE ROW LEVEL SECURITY applies to it.
    await pool.query(`do $$ begin if not exists (select from pg_roles where rolname = 'amc_app') then create role amc_app; end if; end $$;
      grant usage on schema public to amc_app;
      alter table crm_records owner to amc_app;
      alter table crm_activities owner to amc_app;
      grant select on purchases to amc_app;
      grant usage on all sequences in schema public to amc_app;`);

    const client = await pool.connect();
    const asCompany = (id: string) => client.query("select set_config('app.company_id', $1, true)", [id]);
    const refused = async (sql: string, params: unknown[]) => {
      await client.query("savepoint attempt");
      await expect(client.query(sql, params), sql).rejects.toThrow(/row-level security/);
      await client.query("rollback to savepoint attempt");
    };
    try {
      await client.query("begin");
      await client.query("set local role amc_app");

      await asCompany(a);
      const ra = (await client.query("insert into crm_records(purchase_id, company_id, stage) values ($1, $2, 'contacted') returning id", [pa, a])).rows[0].id;
      await client.query("insert into crm_activities(record_id, company_id, type, body) values ($1, $2, 'call', 'A called the customer')", [ra, a]);
      // A cannot file a record under B, or attach its own company to B's purchase.
      await refused("insert into crm_records(purchase_id, company_id) values ($1, $2)", [pb, b]);
      await refused("insert into crm_records(purchase_id, company_id) values ($1, $2)", [pb, a]);

      await asCompany(b);
      const rb = (await client.query("insert into crm_records(purchase_id, company_id) values ($1, $2) returning id", [pb, b])).rows[0].id;
      await client.query("insert into crm_activities(record_id, company_id, type, body) values ($1, $2, 'note', 'B private')", [rb, b]);
      expect((await client.query("select id from crm_records")).rows).toEqual([{ id: rb }]);
      expect((await client.query("select body from crm_activities")).rows).toEqual([{ body: "B private" }]);
      // B cannot log activity on A's record, change A's record, or move its own record to A.
      await refused("insert into crm_activities(record_id, company_id, type) values ($1, $2, 'call')", [ra, b]);
      await refused("insert into crm_activities(record_id, company_id, type) values ($1, $2, 'call')", [ra, a]);
      expect((await client.query("update crm_records set stage = 'lost' where id = $1", [ra])).rowCount).toBe(0);
      expect((await client.query("delete from crm_activities where record_id = $1", [ra])).rowCount).toBe(0);
      await refused("update crm_records set company_id = $2 where id = $1", [rb, a]);

      await asCompany(a);
      expect((await client.query("select id, stage from crm_records")).rows).toEqual([{ id: ra, stage: "contacted" }]);
      expect((await client.query("select body from crm_activities")).rows).toEqual([{ body: "A called the customer" }]);

      // Without a company context nothing is visible or writable.
      await client.query("select set_config('app.company_id', '', true)");
      expect((await client.query("select * from crm_records")).rows).toHaveLength(0);
      expect((await client.query("select * from crm_activities")).rows).toHaveLength(0);
      await refused("insert into crm_records(purchase_id, company_id) values ($1, $2)", [pa, a]);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});

describe("company_can_purchase", () => {
  const canPurchase = async (id: string) =>
    (await pool.query("select company_can_purchase(c) as ok from companies c where id = $1", [id])).rows[0].ok as boolean;

  it("requires billing in good standing", async () => {
    const c = await company();
    const { groupId } = await leadGroup(1);
    await offer(groupId, c);
    expect(await canPurchase(c)).toBe(true);
    for (const status of ["past_due", "suspended"]) {
      await pool.query("update companies set billing_status = $2 where id = $1", [c, status]);
      expect(await canPurchase(c)).toBe(false);
      await expect(pool.query("select reserve_purchase($1, $2, $3)", [c, groupId, `k-${status}`])).rejects.toThrow(/company_not_eligible/);
    }
    await pool.query("update companies set billing_status = 'good' where id = $1", [c]);
    expect(await canPurchase(c)).toBe(true);
    await expect(pool.query("select reserve_purchase($1, $2, 'k-good')", [c, groupId])).resolves.toBeTruthy();
  });

  it("keeps the 001 conditions and rejects unknown billing statuses", async () => {
    expect(await canPurchase(await company({ has_broker_authority: true }))).toBe(false);
    expect(await canPurchase(await company({ status: "in_review" }))).toBe(false);
    expect(await canPurchase(await company({ credentials_valid_until: "2020-01-01" }))).toBe(false);
    expect(await canPurchase(await company({ mc_number: null }))).toBe(false);
    await expect(company({ billing_status: "overdue" })).rejects.toThrow(/companies_billing_status_check/);
  });
});

describe("seeded reference data", () => {
  it("platform settings from build plan §4.1", async () => {
    const { rows } = await pool.query("select key, value from platform_settings");
    expect(Object.fromEntries(rows.map((r) => [r.key, r.value]))).toEqual({
      require_mc_number: true,
      max_sharing_limit: 5,
      sale_window_hours: 72,
      local_max_miles: 50,
      quote_invite_delay_days: 7,
      post_move_invite_days: 21,
      rank_min_reviews: 5,
      duplicate_window_days: 30,
      new_to_network_days: 90,
      claim_window_hours: 72,
      show_zip_in_preview: false,
      active_policy_version: POLICY,
      active_consent_version: "contact-introduction-v1-draft",
    });
  });

  it("the active sharing policy", async () => {
    const { rows } = await pool.query("select factors_bp from sharing_policies where version = $1", [POLICY]);
    expect(rows).toEqual([{ factors_bp: [10000, 8000, 6500, 5500, 5000] }]);
  });

  it("the 50 states and DC", async () => {
    const { rows } = await pool.query("select code, name, slug, fips from states");
    expect(rows.map((r) => r.code).sort()).toEqual([...US_STATES].sort());
    expect(new Set(rows.map((r) => r.fips)).size).toBe(51);
    for (const r of rows) {
      expect(r.slug).toBe(r.name.toLowerCase().replaceAll(" ", "-"));
      expect(r.fips).toMatch(/^\d{2}$/);
    }
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));
    expect(byCode.DC).toEqual({ code: "DC", name: "District of Columbia", slug: "district-of-columbia", fips: "11" });
    expect([byCode.CA.fips, byCode.FL.fips, byCode.TX.fips, byCode.NY.fips, byCode.WY.fips]).toEqual(["06", "12", "48", "36", "56"]);
  });

  it("the draft consent text with the sha256 of its body, and the Terms acknowledgment as its own text", async () => {
    const { rows } = await pool.query("select * from consent_text_versions order by id");
    expect(rows).toHaveLength(3);
    const v = rows.find((r) => r.id === "consent-v0-draft");
    const terms = rows.find((r) => r.id === "terms-ack-v0-draft");
    const current = rows.find((r) => r.id === "contact-introduction-v1-draft");
    expect(current).toMatchObject({ kind: "contact_consent", status: "draft" });
    expect(current.body).toContain("{RECIPIENT_SCOPE}");
    expect(v).toMatchObject({ id: "consent-v0-draft", kind: "contact_consent", status: "draft", approved_by: null, effective_from: null });
    expect(v.body).toMatch(/^I agree that up to \{N\} of the movers listed above may contact me about my move/);
    expect(v.body).toContain("Consent isn't required to buy any goods or services.");
    expect(v.body).toMatch(/contacting the mover or American Moving Choice\.$/);
    // The contact-consent box must not carry Terms or privacy text (implications §3.2).
    expect(v.body).not.toMatch(/Terms|Privacy|arbitration/i);
    expect(v.sha256).toBe(sha256(v.body));
    expect(terms).toMatchObject({ id: "terms-ack-v0-draft", kind: "terms_privacy_ack", status: "draft" });
    expect(terms.body).toBe("I agree to the [Terms of Use] and acknowledge the [Privacy Policy].");
    expect(terms.sha256).toBe(sha256(terms.body));
    await expect(pool.query("insert into consent_text_versions(id, body, sha256) values ('consent-v0-bad', 'x', $1)", [sha256("y")]))
      .rejects.toThrow(/check constraint/);
  });
});

describe("leads", () => {
  const minimal = (groupId: string): Record<string, unknown> => ({
    group_id: groupId, selected_limit: 3, first_name: "Jordan", last_name: "Sample", email: "jordan.sample@demo.invalid",
    phone_e164: "+15125550141", origin_zip: "78704", dest_zip: "77006",
  });

  it("accept every new column", async () => {
    const c = await company();
    const g = (await insertRow("lead_groups", { sharing_limit: 3, policy_version: POLICY })).id as string;
    const values = {
      ...minimal(g),
      reference_code: "AMC-TEST-0001", status: "qualified", move_date: "2026-11-21", move_date_flexible: true, move_size: "2br",
      services: ["packing", "storage"], origin_city: "Austin", origin_state: "TX", origin_county_fips: "48453",
      dest_city: "Houston", dest_state: "TX", dest_county_fips: "48201", distance_miles: 146.5, move_type: "intrastate",
      channel_scope: ["call", "sms", "email"], email_hash: sha256("jordan.sample@demo.invalid"), phone_hash: sha256("+15125550141"),
      risk_score: 12, source_category: "organic_search", manage_token_hash: sha256("manage-token"),
      withdrawn_at: "2026-10-28T12:00:00+00:00", profile_company_id: c,
    };
    const id = (await insertRow("leads", values)).id;
    const { rows } = await pool.query(
      "select to_jsonb(l) - 'withdrawn_at' as lead, withdrawn_at = $2::timestamptz as withdrawn_ok from leads l where id = $1",
      [id, values.withdrawn_at]);
    const { withdrawn_at: _withdrawn, ...rest } = values;
    expect(rows[0].lead).toMatchObject(rest);
    expect(rows[0].withdrawn_ok).toBe(true);
  });

  it("default the new columns so inserts without them keep working", async () => {
    const g = (await insertRow("lead_groups", { sharing_limit: 3, policy_version: POLICY })).id as string;
    const columns = "reference_code, status, services, channel_scope, source_category, move_date_flexible";
    const first = await insertRow("leads", minimal(g), columns);
    const second = await insertRow("leads", minimal(g), columns);
    expect(first).toMatchObject({ status: "submitted", services: [], channel_scope: [], source_category: "other", move_date_flexible: false });
    for (const row of [first, second]) expect(row.reference_code).toMatch(/^AMC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(first.reference_code).not.toBe(second.reference_code);
  });

  it("reject values outside the documented sets and duplicate codes or tokens", async () => {
    const g = (await insertRow("lead_groups", { sharing_limit: 3, policy_version: POLICY })).id as string;
    const invalid: [string, unknown][] = [
      ["status", "sold"], ["move_size", "mansion"], ["move_type", "international"], ["services", ["junk_removal"]],
      ["channel_scope", ["fax"]], ["origin_state", "ZZ"], ["dest_county_fips", "4820"], ["email_hash", "jordan.sample@demo.invalid"],
      ["phone_hash", "+15125550141"], ["risk_score", 101], ["distance_miles", -1], ["source_category", "tv"],
    ];
    for (const [column, value] of invalid) {
      await expect(insertRow("leads", { ...minimal(g), [column]: value }), column).rejects.toThrow(/violates (check|foreign key) constraint/);
    }
    await insertRow("leads", { ...minimal(g), reference_code: "AMC-TEST-0002", manage_token_hash: sha256("t") });
    await expect(insertRow("leads", { ...minimal(g), reference_code: "AMC-TEST-0002" })).rejects.toThrow(/leads_reference_code_key/);
    await expect(insertRow("leads", { ...minimal(g), manage_token_hash: sha256("t") })).rejects.toThrow(/leads_manage_token_hash_key/);
  });
});

describe("other integrity rules", () => {
  it("issues badges only from passing checks recorded for the same company", async () => {
    const a = await company();
    const b = await company();
    const check = async (companyId: string, result: string) =>
      (await insertRow("verification_checks", { company_id: companyId, check_type: "authority_type", source: "fixture", result })).id as string;
    const passA = await check(a, "pass");
    const failA = await check(a, "fail");
    const passB = await check(b, "pass");
    await expect(insertRow("badges", { company_id: a, evidence_check_ids: [] })).rejects.toThrow(/check constraint/);
    await expect(insertRow("badges", { company_id: a, evidence_check_ids: [passA, failA] })).rejects.toThrow(/badge_evidence_invalid/);
    await expect(insertRow("badges", { company_id: a, evidence_check_ids: [passA, passB] })).rejects.toThrow(/badge_evidence_invalid/);
    const badge = (await insertRow("badges", { company_id: a, evidence_check_ids: [passA] })).id;
    await expect(insertRow("badges", { company_id: a, evidence_check_ids: [passA] })).rejects.toThrow(/badges_one_active_per_type/);
    await pool.query("update badges set revoked_at = now(), reason = 'credential lapsed' where id = $1", [badge]);
    await expect(insertRow("badges", { company_id: a, evidence_check_ids: [passA] })).resolves.toBeTruthy();
  });

  it("freezes consent text once approved", async () => {
    const body = "I agree that up to {N} movers may contact me.";
    await insertRow("consent_text_versions", { id: "consent-v1", body, sha256: sha256(body) });
    await pool.query("update consent_text_versions set body = $2, sha256 = $3 where id = $1", ["consent-v1", `${body} `, sha256(`${body} `)]);
    await expect(pool.query("update consent_text_versions set status = 'approved' where id = 'consent-v1'")).rejects.toThrow(/check constraint/);
    await pool.query("update consent_text_versions set status = 'approved', approved_by = 'counsel memo 1', effective_from = now() where id = 'consent-v1'");
    await expect(pool.query("update consent_text_versions set body = 'x', sha256 = $1 where id = 'consent-v1'", [sha256("x")])).rejects.toThrow(/consent_text_frozen/);
    await expect(pool.query("update consent_text_versions set status = 'draft' where id = 'consent-v1'")).rejects.toThrow(/consent_text_frozen/);
    await expect(pool.query("update consent_text_versions set approved_by = 'someone else' where id = 'consent-v1'")).rejects.toThrow(/consent_text_frozen/);
    await expect(pool.query("update consent_text_versions set effective_from = now() - interval '1 year' where id = 'consent-v1'")).rejects.toThrow(/consent_text_frozen/);
    await expect(pool.query("delete from consent_text_versions where id = 'consent-v1'")).rejects.toThrow(/consent_text_frozen/);
    await pool.query("update consent_text_versions set status = 'retired' where id = 'consent-v1'");
    await expect(pool.query("update consent_text_versions set status = 'approved' where id = 'consent-v1'")).rejects.toThrow(/consent_text_frozen/);
    // An uncited draft can still be edited or deleted.
    await insertRow("consent_text_versions", { id: "consent-v2", body, sha256: sha256(body) });
    await pool.query("delete from consent_text_versions where id = 'consent-v2'");
  });

  it("freezes any consent text, draft or not, once a consent record cites it", async () => {
    const c = await company();
    const { leadId } = await leadGroup(1);
    await insertRow("consent_records", consentRecordValues(leadId, [c]));
    const changed = "Totally different text";
    await expect(pool.query("update consent_text_versions set body = $1, sha256 = $2 where id = 'consent-v0-draft'", [changed, sha256(changed)]))
      .rejects.toThrow(/consent_text_frozen/);
    await expect(pool.query("delete from consent_text_versions where id = 'consent-v0-draft'")).rejects.toThrow(/consent_text_frozen/);
    // Approving the cited draft (status and sign-off only) is still possible.
    await pool.query("update consent_text_versions set status = 'approved', approved_by = 'counsel memo 2', effective_from = now() where id = 'consent-v0-draft'");
  });

  it("requires complete, affirmative consent evidence", async () => {
    const c = await company();
    const { leadId } = await leadGroup(1);
    for (const column of ["terms_version", "privacy_version", "page_url", "form_version", "ab_variant", "tag_manifest_version"]) {
      await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { [column]: " " })), column).rejects.toThrow(/check constraint/);
    }
    for (const column of ["checkbox_state", "terms_accepted", "privacy_acknowledged"]) {
      await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { [column]: false })), column).rejects.toThrow(/check constraint/);
    }
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c]))).resolves.toBeTruthy();
  });

  it("allows only one approved company per USDOT number", async () => {
    await company({ usdot_number: "9000077", mc_number: "MC-9000077" });
    await expect(company({ usdot_number: "9000077", mc_number: "MC-9000077" })).rejects.toThrow(/companies_one_approved_per_usdot/);
    await expect(insertRow("companies", { legal_name: "Demo Applicant", status: "applied", usdot_number: "9000077" })).resolves.toBeTruthy();
  });

  it("requires consent records to hash the rendered text and keep removed movers off the named list", async () => {
    const c = await company();
    const removed = await company();
    const { leadId } = await leadGroup(1);
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { rendered_text_sha256: sha256("other text") })))
      .rejects.toThrow(/check constraint/);
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c, removed], { removed_company_ids: [removed] })))
      .rejects.toThrow(/check constraint/);
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { channel_scope: [] }))).rejects.toThrow(/check constraint/);
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { email_hash: "dana@demo.invalid" }))).rejects.toThrow(/check constraint/);
    await expect(insertRow("consent_records", consentRecordValues(leadId, [c], { removed_company_ids: [removed] }))).resolves.toBeTruthy();
  });

  it("publishes move-experience reviews only with completed-move evidence", async () => {
    const c = await company();
    const { groupId } = await leadGroup(1);
    const purchase = await buy(c, groupId);
    const invitation = (await insertRow("review_invitations", {
      purchase_id: purchase, company_id: c, review_type: "move_experience", token_hash: sha256("token"), expires_at: "2030-01-01",
    })).id;
    const review = (await insertRow("reviews", {
      company_id: c, purchase_id: purchase, invitation_id: invitation, review_type: "move_experience", rating: 4,
      reviewer_display_name: "Dana P.", evidence_level: "platform_inquiry",
    })).id;
    await expect(pool.query("update reviews set status = 'published', published_at = now() where id = $1", [review])).rejects.toThrow(/check constraint/);
    await expect(pool.query("update reviews set status = 'rejected' where id = $1", [review])).rejects.toThrow(/check constraint/);
    await expect(pool.query("update reviews set evidence_level = 'completed_move', status = 'published' where id = $1", [review])).rejects.toThrow(/check constraint/);
    await pool.query("update reviews set evidence_level = 'completed_move', status = 'published', published_at = now() where id = $1", [review]);
    await expect(insertRow("review_invitations", {
      purchase_id: purchase, company_id: c, review_type: "move_experience", token_hash: sha256("token-2"), expires_at: "2030-01-01",
    })).rejects.toThrow(/review_invitations_purchase_id_review_type_key/);
  });

  it("stores emails lowercased and only sha256 hex in session and token columns", async () => {
    await expect(insertRow("users", { email: "Admin@Demo.invalid" })).rejects.toThrow(/check constraint/);
    const user = (await insertRow("users", { email: "admin@demo.invalid" })).id;
    await expect(insertRow("users", { email: "admin@demo.invalid" })).rejects.toThrow(/users_email_key/);
    await expect(insertRow("sessions", { id: "raw-cookie-token", user_id: user, expires_at: "2030-01-01" }, "id")).rejects.toThrow(/check constraint/);
    await expect(insertRow("sessions", { id: sha256("cookie"), user_id: user, expires_at: "2030-01-01" }, "id")).resolves.toBeTruthy();
    await expect(insertRow("auth_tokens", { user_id: user, purpose: "password_reset", token_hash: "raw", expires_at: "2030-01-01" })).rejects.toThrow(/check constraint/);
    await expect(insertRow("admin_users", { user_id: user, admin_role: "owner" }, "user_id")).rejects.toThrow(/check constraint/);
    await expect(insertRow("admin_users", { user_id: user, admin_role: "super_admin" }, "user_id")).resolves.toBeTruthy();
  });

  it("keeps updated_at current on update", async () => {
    const c = await company();
    const { rows } = await pool.query("update companies set updated_at = '2020-01-01', phone = '+15125550100' where id = $1 returning updated_at = now() as fresh", [c]);
    expect(rows[0].fresh).toBe(true);
  });

  it("pins the search_path of the contact-disclosure function and grants AMC functions to the owner only", async () => {
    const { rows } = await pool.query(`select p.proname, p.prosecdef, p.proconfig,
        exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_execute
      from pg_proc p where p.pronamespace = 'public'::regnamespace
        and p.proname in ('lead_contact_for_company', 'reserve_purchase', 'complete_purchase', 'company_can_purchase')`);
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const r of rows) expect(r.public_execute, r.proname).toBe(false);
    const disclosure = rows.find((r) => r.proname === "lead_contact_for_company");
    expect(disclosure.prosecdef).toBe(true);
    expect((disclosure.proconfig as string[]).some((c) => c.startsWith("search_path="))).toBe(true);
  });

  it("checks rate card shapes and state lists", async () => {
    const c = await company();
    const local = { crew_hourly_cents: { "2": 12900 }, travel_fee_cents: 12500, hours_by_size: { studio: 3 }, crew_by_size: { studio: 2 } };
    // The build plan §7.3 shape: service prices are not part of long_distance.
    const longDistance = { cwt_cents_by_band: { "0_250": 6800 }, weight_lbs_by_size: { studio: 2000 } };
    await expect(insertRow("rate_cards", { company_id: c, states: ["TX"], local, long_distance: longDistance })).resolves.toBeTruthy();
    await expect(insertRow("rate_cards", { company_id: c, states: ["TX"], long_distance: longDistance })).resolves.toBeTruthy();
    await expect(insertRow("rate_cards", { company_id: c, states: ["TX"], long_distance: { cwt_cents_by_band: { "0_250": 6800 } } })).rejects.toThrow(/check constraint/);
    await expect(insertRow("rate_cards", { company_id: c, states: ["TX"], local: { travel_fee_cents: 1 } })).rejects.toThrow(/check constraint/);
    await expect(insertRow("rate_cards", { company_id: c, states: ["Texas"], local })).rejects.toThrow(/check constraint/);
    await expect(insertRow("rate_cards", { company_id: c, states: [], local })).rejects.toThrow(/check constraint/);
    await expect(insertRow("rate_cards", { company_id: c, states: ["TX"] })).rejects.toThrow(/check constraint/);
  });
});

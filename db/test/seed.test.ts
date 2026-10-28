import { createDecipheriv, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEV_HMAC_SECRET, KNOWN_PASSWORDS, buildSeedSql, contactHashWith, type SeedOutput } from "../seed/build";
import { applyMigrations, databaseUrl } from "./helpers";

const pool = new pg.Pool({ connectionString: databaseUrl, max: 4 });
const options = {
  adminEmail: "Admin@Demo.invalid",
  // Fresh random passwords each run: passwords written in the repository are refused.
  adminPassword: `admin-${randomBytes(12).toString("base64url")}`,
  moverEmail: "owner@demo.invalid",
  moverPassword: `mover-${randomBytes(12).toString("base64url")}`,
  bcryptCost: 4,
};
let seed: SeedOutput;

type Row = Record<string, unknown>;
const many = async (sql: string, params: unknown[] = []): Promise<Row[]> => (await pool.query(sql, params)).rows as Row[];
const one = async (sql: string, params: unknown[] = []): Promise<Row> => {
  const rows = await many(sql, params);
  if (!rows[0]) throw new Error(`no row: ${sql}`);
  return rows[0];
};

beforeAll(async () => {
  seed = await buildSeedSql(options);
  // Load it the way Supabase will: a non-superuser role owns the schema and every object, so forced
  // row-level security applies to it, and it runs the migrations and then the seed.
  await pool.query(`drop schema public cascade; create schema public;
    do $$ begin if not exists (select from pg_roles where rolname = 'amc_app') then create role amc_app; end if; end $$;
    alter schema public owner to amc_app;
    create extension if not exists pgcrypto;`);
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role amc_app");
    await applyMigrations(client);
    await client.query(seed.body);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});
afterAll(() => pool.end());

describe("demo seed", () => {
  it("creates the admin and the demo mover owner with bcrypt hashes and no plaintext passwords", async () => {
    const users = await many(`
      select u.email, u.password_hash, u.mfa_enabled_at, u.mfa_secret_enc, a.admin_role, m.role as member_role, m.can_purchase,
             c.legal_name
      from users u left join admin_users a on a.user_id = u.id
      left join company_memberships m on m.user_id = u.id left join companies c on c.id = m.company_id
      order by u.email`);
    expect(users).toHaveLength(2);
    const [admin, owner] = users as [Row, Row];
    expect(admin).toMatchObject({ email: "admin@demo.invalid", admin_role: "super_admin", mfa_enabled_at: null, mfa_secret_enc: null, member_role: null });
    expect(owner).toMatchObject({ email: "owner@demo.invalid", admin_role: null, member_role: "owner", can_purchase: true, legal_name: "Demo Lone Star Relocation Co." });
    expect(await bcrypt.compare(options.adminPassword, admin.password_hash as string)).toBe(true);
    expect(await bcrypt.compare(options.moverPassword, owner.password_hash as string)).toBe(true);
    expect(seed.sql).not.toContain(options.adminPassword);
    expect(seed.sql).not.toContain(options.moverPassword);
  });

  it("has at least 12 approved fictional demo companies with fixture numbers, live profiles, badges and passing checks", async () => {
    const rows = await many(`
      select c.legal_name, c.usdot_number, c.mc_number, c.is_demo, c.billing_status, company_can_purchase(c) as can_buy,
             c.address_state, p.public_status, p.description, p.network_joined_at is not null as joined,
             (select count(distinct v.check_type)::int from verification_checks v
              where v.company_id = c.id and v.result = 'pass' and v.source = 'fixture') as passing_check_types,
             (select cardinality(b.evidence_check_ids) from badges b where b.company_id = c.id and b.revoked_at is null) as badge_evidence,
             (select count(*)::int from company_prices cp where cp.company_id = c.id) as prices
      from companies c left join company_profiles p on p.company_id = c.id
      where c.status = 'approved'`);
    expect(rows.length).toBeGreaterThanOrEqual(12);
    expect(new Set(rows.map((r) => r.address_state))).toEqual(new Set(["TX", "FL", "CA"]));
    for (const r of rows) {
      expect(r.legal_name).toContain("Demo");
      expect(Number(r.usdot_number)).toBeGreaterThanOrEqual(9000001);
      expect(Number(r.usdot_number)).toBeLessThanOrEqual(9000099);
      expect(r).toMatchObject({
        mc_number: `MC-${r.usdot_number as string}`, is_demo: true, billing_status: "good", can_buy: true, public_status: "live",
        joined: true, passing_check_types: 9, badge_evidence: 9, prices: 1,
      });
      expect(r.description).toContain("is a fictional demo company");
    }
  });

  it("includes an application in review with fixture checks and a rejected broker that cannot buy", async () => {
    const review = await one(`select c.id, company_can_purchase(c) as can_buy,
      (select count(*)::int from verification_checks v where v.company_id = c.id) as checks,
      (select count(*)::int from verification_checks v where v.company_id = c.id and v.result = 'needs_review') as to_review
      from companies c where status = 'in_review'`);
    expect(review).toMatchObject({ can_buy: false, checks: 7, to_review: 2 });
    const broker = await one(`select c.legal_name, c.status_reason, company_can_purchase(c) as can_buy,
      (select array_agg(a.authority_type order by a.authority_type) from authority_records a where a.company_id = c.id) as authorities,
      (select v.result from verification_checks v where v.company_id = c.id and v.check_type = 'authority_type') as authority_check
      from companies c where status = 'rejected' and has_broker_authority`);
    expect(broker).toMatchObject({ can_buy: false, authorities: ["broker", "common"], authority_check: "fail" });
    expect(broker.legal_name).toContain("Demo");
    expect(broker.status_reason).toMatch(/broker authority/i);
    expect((await one("select count(*)::int as n from lead_eligibility e join companies c on c.id = e.company_id where c.status <> 'approved'")).n).toBe(0);
  });

  it("covers TX, FL and CA with at least five active rate cards each, and has two nationwide interstate movers", async () => {
    for (const state of ["TX", "FL", "CA"]) {
      // The calculator counts only cards dated within the last 12 months (build plan §7.3).
      const { n } = await one(`select count(distinct company_id)::int as n from rate_cards
        where status = 'active' and $1 = any(states) and created_at >= now() - interval '12 months'`, [state]);
      expect(n, state).toBeGreaterThanOrEqual(5);
    }
    // Rate cards follow the §7.3 shapes: crews of 2 to 5, and no service prices in long_distance.
    for (const card of await many("select local, long_distance from rate_cards")) {
      expect(Object.keys((card.local as { crew_hourly_cents: object }).crew_hourly_cents).sort()).toEqual(["2", "3", "4", "5"]);
      expect(Object.keys(card.long_distance as object).sort()).toEqual(["cwt_cents_by_band", "weight_lbs_by_size"]);
    }
    const nationwide = await one(`select count(distinct r.company_id)::int as n from coverage_rules r
      where r.kind = 'include' and not r.paused and r.move_types = '{interstate}'
        and not exists (select 1 from coverage_rule_locations l where l.rule_id = r.id)`);
    expect(nationwide.n).toBe(2);
    const counties = await many("select distinct value from coverage_rule_locations where level = 'county' and value in ('06037', '06059')");
    expect(counties).toHaveLength(2);
    const routes = await many(`select o.value as origin, d.value as destination, r.move_types from coverage_rules r
      join coverage_rule_locations o on o.rule_id = r.id and o.side = 'origin' and o.level = 'state'
      join coverage_rule_locations d on d.rule_id = r.id and d.side = 'destination' and d.level = 'state'`);
    const has = (origin: string, destination: string, type: string) =>
      routes.some((r) => r.origin === origin && r.destination === destination && (r.move_types as string[]).includes(type));
    expect([has("TX", "TX", "intrastate"), has("TX", "TX", "local"), has("FL", "FL", "intrastate"), has("TX", "FL", "interstate"), has("FL", "TX", "interstate")])
      .toEqual([true, true, true, true, true]);
  });

  it("has open requests with a 72-hour window: one bought through the purchase functions, one exclusive still available", async () => {
    const open = await many(`select g.id, g.sharing_limit, (select count(*)::int from purchases p where p.group_id = g.id) as bought
      from lead_groups g where g.status = 'available' and g.expires_at between now() + interval '71 hours' and now() + interval '73 hours'`);
    expect(open.length).toBeGreaterThanOrEqual(3);
    expect(open.length).toBeLessThanOrEqual(4);
    expect(open.some((g) => g.sharing_limit === 1 && g.bought === 0)).toBe(true);

    const bought = await one(`select p.id, p.group_id, p.company_id, d.purchase_id is not null as disclosed,
        (select count(*)::int from crm_records r where r.purchase_id = p.id) as crm_records,
        (select count(*)::int from crm_notes n where n.purchase_id = p.id) as crm_notes
      from purchase_attempts a join purchases p on p.attempt_id = a.id left join disclosures d on d.purchase_id = p.id
      where a.payment_ref = 'demo_seed' and a.status = 'succeeded'`);
    expect(bought).toMatchObject({ disclosed: true, crm_records: 1, crm_notes: 1 });
    expect(open.map((g) => g.id)).toContain(bought.group_id);
    const contact = await many("select email from lead_contact_for_company($1, $2)", [bought.group_id, bought.company_id]);
    expect(contact).toEqual([{ email: "jordan.sample@demo.invalid" }]);
    const ledger = await one("select count(*)::int as n from ledger_entries where purchase_id = $1 and kind = 'purchase_charge'", [bought.id]);
    expect(ledger.n).toBe(1);
  });

  it("fills every new lead column and keeps consent records and eligibility snapshots consistent", async () => {
    const leads = await many("select to_jsonb(l) as lead from leads l");
    for (const { lead } of leads as { lead: Record<string, unknown> }[]) {
      for (const [column, value] of Object.entries(lead)) {
        if (column !== "withdrawn_at" && column !== "profile_company_id") expect(value, column).not.toBeNull();
      }
      expect(lead.email).toMatch(/@demo\.invalid$/);
      expect(lead.phone_e164).toMatch(/^\+1\d{3}55501\d{2}$/);
    }
    const records = await many(`select c.named_company_ids, c.removed_company_ids, c.selected_limit, l.group_id,
        (select array_agg(e.company_id order by e.company_id) from lead_eligibility e where e.group_id = l.group_id and e.named_in_consent) as named,
        (select coalesce(array_agg(e.company_id order by e.company_id), '{}') from lead_eligibility e where e.group_id = l.group_id and not e.named_in_consent) as not_named
      from consent_records c join leads l on l.id = c.lead_id`);
    expect(records).toHaveLength(leads.length);
    for (const r of records) {
      expect([...(r.named_company_ids as string[])].sort()).toEqual(r.named);
      expect([...(r.removed_company_ids as string[])].sort()).toEqual(r.not_named);
      expect(r.selected_limit as number).toBeLessThanOrEqual((r.named as string[]).length);
    }
    expect((await one("select count(*)::int as n from lead_eligibility where not named_in_consent")).n).toBe(1);
  });

  it("lets every named mover reserve the open requests, so the coverage snapshots are fresh", async () => {
    const pairs = await many(`select e.group_id, e.company_id from lead_eligibility e join lead_groups g on g.id = e.group_id
      where g.status = 'available' and e.named_in_consent
        and not exists (select 1 from purchases p where p.group_id = e.group_id and p.company_id = e.company_id)`);
    expect(pairs.length).toBeGreaterThan(10);
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const { group_id, company_id } of pairs) {
        await client.query("savepoint attempt");
        const { rows } = await client.query("select (reserve_purchase($1, $2, 'seed-test')).status", [company_id, group_id]);
        expect(rows[0].status).toBe("reserved");
        await client.query("rollback to savepoint attempt");
      }
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("has two published reviews and one pending on one company, an open case and demo messages", async () => {
    const reviews = await many("select company_id, review_type, evidence_level, status from reviews order by created_at");
    expect(new Set(reviews.map((r) => r.company_id)).size).toBe(1);
    expect(reviews.map((r) => [r.review_type, r.evidence_level, r.status])).toEqual([
      ["quote_experience", "platform_inquiry", "published"],
      ["move_experience", "completed_move", "published"],
      ["quote_experience", "platform_inquiry", "pending"],
    ]);
    expect((await one("select count(*)::int as n from cases where status = 'open'")).n).toBe(1);
    const messages = await many("select status, provider from messages");
    expect(messages.length).toBeGreaterThanOrEqual(3);
    expect(messages.every((m) => m.status === "demo")).toBe(true);
    const notice = await one("select body_text from messages where template = 'purchase_notice'");
    expect(notice.body_text).toContain("http://localhost:3000/companies/demo-lone-star-relocation-co/");
  });

  it("keys email and phone hashes with the HMAC secret, never plain sha256", async () => {
    const lead = await one("select email, phone_e164, email_hash, phone_hash from leads order by created_at limit 1");
    expect(lead.email_hash).toBe(contactHashWith(DEV_HMAC_SECRET, "email", lead.email as string));
    expect(lead.phone_hash).toBe(contactHashWith(DEV_HMAC_SECRET, "phone", lead.phone_e164 as string));
    const consent = await one("select c.email_hash, c.phone_hash, c.rendered_text, c.terms_version from consent_records c join leads l on l.id = c.lead_id where l.email = $1", [lead.email]);
    expect([consent.email_hash, consent.phone_hash]).toEqual([lead.email_hash, lead.phone_hash]);
    expect(consent.rendered_text).not.toMatch(/Terms of Use|Privacy Policy/);
    expect(consent.terms_version).toBe("terms-ack-v0-draft");
    expect(seed.meta).toMatchObject({ adminTotpEnrolled: false, hmacSecretIsDevDefault: true });
  });
});

describe("seed builder options", () => {
  it("refuses passwords written down in the repository", async () => {
    for (const known of KNOWN_PASSWORDS) {
      await expect(buildSeedSql({ ...options, adminPassword: known })).rejects.toThrow(/written down in this repository/);
      await expect(buildSeedSql({ ...options, moverPassword: known })).rejects.toThrow(/written down in this repository/);
    }
  });

  it("enrolls the admin's TOTP secret, encrypted with the app key, when one is given", async () => {
    const key = randomBytes(32);
    const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
    await expect(buildSeedSql({ ...options, adminTotpSecret: secret })).rejects.toThrow(/APP_ENCRYPTION_KEY/);
    await expect(buildSeedSql({ ...options, adminTotpSecret: "TOOSHORT", encryptionKey: key.toString("hex") })).rejects.toThrow(/base32/);
    const out = await buildSeedSql({ ...options, adminTotpSecret: secret, encryptionKey: key.toString("hex"), hmacSecret: "h".repeat(40) });
    expect(out.meta).toMatchObject({ adminTotpEnrolled: true, hmacSecretIsDevDefault: false });
    expect(out.sql).not.toContain(secret);
    const sealed = /'(v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)'/.exec(out.sql)?.[1];
    expect(sealed).toBeTruthy();
    const [, iv, tag, data] = sealed!.split(".") as [string, string, string, string];
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"), { authTagLength: 16 });
    decipher.setAAD(Buffer.from("users.mfa_secret_enc:a0000000-0000-4000-8000-000000000001", "utf8"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    expect(Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8")).toBe(secret);
  });
});

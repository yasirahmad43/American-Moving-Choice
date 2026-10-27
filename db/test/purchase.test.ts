import { readFileSync } from "node:fs";
import { beforeEach, afterAll, describe, expect, it } from "vitest";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgres://amc:amc@localhost:5432/amc_test";
const pool = new pg.Pool({ connectionString: url, max: 20 });
const migration = readFileSync(new URL("../migrations/001_marketplace_core.sql", import.meta.url), "utf8");

afterAll(() => pool.end());

beforeEach(async () => {
  await pool.query("drop schema public cascade; create schema public;");
  await pool.query(migration);
  await pool.query(`insert into sharing_policies(version, factors_bp) values ('v1', '{10000,8000,6500,5500,5000}')`);
});

async function company(name: string, prices: { excl: number; shared: number }, over: Record<string, unknown> = {}) {
  const cols = { legal_name: name, status: "approved", usdot_number: "1234567", mc_number: "123456", ...over };
  const keys = Object.keys(cols);
  const { rows } = await pool.query(
    `insert into companies(${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")}) returning id`,
    Object.values(cols),
  );
  const id = rows[0].id as string;
  await pool.query(`insert into company_prices(company_id, exclusive_cents, shared_cents, set_by) values ($1,$2,$3,'admin')`, [id, prices.excl, prices.shared]);
  return id;
}

async function lead(limit: number) {
  const { rows } = await pool.query(`insert into lead_groups(sharing_limit, policy_version) values ($1,'v1') returning id`, [limit]);
  const g = rows[0].id as string;
  await pool.query(
    `insert into leads(group_id, selected_limit, first_name, last_name, email, phone_e164, origin_zip, dest_zip)
     values ($1,$2,'Dana','Private','dana@example.com','+14045550134','02108','33101')`, [g, limit]);
  return g;
}

/** Reserve then complete (simulating a successful payment), as the API would. */
async function buy(companyId: string, groupId: string, key = `k-${companyId}-${groupId}`) {
  const r = await pool.query("select * from reserve_purchase($1,$2,$3)", [companyId, groupId, key]);
  const attempt = r.rows[0];
  const p = await pool.query("select * from complete_purchase($1,$2)", [attempt.id, `pi_${attempt.id}`]);
  return { attempt, purchase: p.rows[0] };
}

const errCode = (e: unknown) => (e as Error).message;

async function balance(companyId: string) {
  const { rows } = await pool.query("select balance_cents from company_credit_balance where company_id=$1", [companyId]);
  return rows[0].balance_cents as number;
}

describe("exclusive leads", () => {
  it("two companies race for one exclusive lead: exactly one succeeds and is charged", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 8500, shared: 3500 });
    const g = await lead(1);
    const results = await Promise.allSettled([buy(a, g), buy(b, g)]);
    const ok = results.filter((r) => r.status === "fulfilled");
    expect(ok).toHaveLength(1);
    const { rows } = await pool.query("select company_id, charged_cents from purchases where group_id=$1", [g]);
    expect(rows).toHaveLength(1);
    const charges = await pool.query("select count(*)::int n from ledger_entries where kind='purchase_charge'");
    expect(charges.rows[0].n).toBe(1);
    // Loser cannot buy afterwards either.
    const loser = rows[0].company_id === a ? b : a;
    await expect(buy(loser, g, "retry")).rejects.toThrow(/sold_out|lead_unavailable/);
  });
});

describe("shared leads", () => {
  it("many concurrent buyers never exceed the cap, even when racing for the final slot", async () => {
    const companies = await Promise.all(Array.from({ length: 8 }, (_, i) => company(`C${i}`, { excl: 9000, shared: 4000 })));
    const g = await lead(3);
    // Keep retrying 'purchase_in_progress' like the client would.
    const attempt = async (c: string) => {
      for (let i = 0; i < 50; i++) {
        try { return await buy(c, g); } catch (e) {
          if (!/purchase_in_progress/.test(errCode(e))) throw e;
          await new Promise((r) => setTimeout(r, 5));
        }
      }
      throw new Error("gave up");
    };
    const results = await Promise.allSettled(companies.map(attempt));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    expect(ok).toBe(3);
    const { rows } = await pool.query("select count(distinct company_id)::int n, max(position) mx from purchases where group_id=$1", [g]);
    expect(rows[0]).toEqual({ n: 3, mx: 3 });
    for (const r of results) if (r.status === "rejected") expect(errCode(r.reason)).toMatch(/sold_out|lead_unavailable/);
  });

  it("credits follow the approved formula with different company prices and rounding", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 8000, shared: 3500 });
    const c = await company("C", { excl: 9900, shared: 3333 });
    const g = await lead(4);
    const pa = await buy(a, g); const pb = await buy(b, g); const pc = await buy(c, g);
    expect([pa.purchase.charged_cents, pb.purchase.charged_cents]).toEqual([4000, 2800]);
    // C's charge would be 3333*0.65 = 2166.45 -> 2166, but C has no credit so card pays it all.
    expect(pc.purchase.charged_cents).toBe(2166);
    // A: credits 4000-3200 (on B) + 3200-2600 (on C) = 1400 -> net 2600 = 4000*0.65
    expect(await balance(a)).toBe(1400);
    // B: 2800 - round(3500*0.65=2275) = 525
    expect(await balance(b)).toBe(525);
    expect(await balance(c)).toBe(0);
  });

  it("account credit is applied to the next purchase and held against concurrent use", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 9000, shared: 4000 });
    const g1 = await lead(2); await buy(a, g1); await buy(b, g1); // A gets 800 credit
    expect(await balance(a)).toBe(800);
    const g2 = await lead(2); const g3 = await lead(2);
    const r1 = (await pool.query("select * from reserve_purchase($1,$2,'x1')", [a, g2])).rows[0];
    const r2 = (await pool.query("select * from reserve_purchase($1,$2,'x2')", [a, g3])).rows[0];
    expect([r1.credit_applied_cents, r1.card_amount_cents]).toEqual([800, 3200]);
    expect(r2.credit_applied_cents).toBe(0); // already held by r1
    await pool.query("select complete_purchase($1,'pi_1')", [r1.id]);
    expect(await balance(a)).toBe(0);
  });
});

describe("payments and idempotency", () => {
  it("failed payment releases the slot and reveals nothing", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const g = await lead(1);
    const r = (await pool.query("select * from reserve_purchase($1,$2,'k')", [a, g])).rows[0];
    await pool.query("select fail_purchase($1)", [r.id]);
    const contact = await pool.query("select * from lead_contact_for_company($1,$2)", [g, a]);
    expect(contact.rows).toHaveLength(0);
    const b = await company("B", { excl: 9000, shared: 4000 });
    await expect(buy(b, g)).resolves.toBeTruthy(); // slot released
  });

  it("repeated clicks and repeated payment notifications create no duplicate effects", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 9000, shared: 4000 });
    const g = await lead(3);
    await buy(a, g);
    const r1 = (await pool.query("select * from reserve_purchase($1,$2,'same-key')", [b, g])).rows[0];
    const r2 = (await pool.query("select * from reserve_purchase($1,$2,'same-key')", [b, g])).rows[0];
    expect(r2.id).toBe(r1.id);
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push((await pool.query("select record_payment_event('evt_123') ok")).rows[0].ok);
      await pool.query("select complete_purchase($1,'pi_x')", [r1.id]);
    }
    expect(seen).toEqual([true, false, false]);
    const { rows } = await pool.query("select kind, count(*)::int n from ledger_entries group by kind order by kind");
    expect(rows).toEqual([{ kind: "purchase_charge", n: 2 }, { kind: "sharing_credit", n: 1 }]);
  });

  it("success arriving after the reservation expired is honoured only if the slot is still free", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 9000, shared: 4000 });
    const g = await lead(1);
    const r = (await pool.query("select * from reserve_purchase($1,$2,'k',interval '1 millisecond')", [a, g])).rows[0];
    await new Promise((res) => setTimeout(res, 10));
    await buy(b, g); // B takes the slot after A's hold expired
    const late = await pool.query("select (complete_purchase($1,'pi_late')).id", [r.id]);
    expect(late.rows[0].id).toBeNull(); // caller must refund A's payment
    expect((await pool.query("select count(*)::int n from purchases")).rows[0].n).toBe(1);
  });
});

describe("refunds, duplicates, history", () => {
  it("refunded disclosed lead does not regain sale capacity", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 9000, shared: 4000 });
    const g = await lead(1);
    const { purchase } = await buy(a, g);
    await pool.query("select refund_purchase($1,'credit',9000,'disconnected phone')", [purchase.id]);
    await expect(buy(b, g)).rejects.toThrow(/sold_out|lead_unavailable/);
    expect(await balance(a)).toBe(9000);
  });

  it("a refunded buyer stops accruing sharing credits and cannot be refunded more than it paid net", async () => {
    const [a, b, c] = await Promise.all(["A", "B", "C"].map((n) => company(n, { excl: 9000, shared: 4000 })));
    const g = await lead(3);
    const pa = await buy(a!, g);
    await buy(b!, g); // A receives 800 credit -> net paid 3200
    await expect(pool.query("select refund_purchase($1,'credit',4000,'bad number')", [pa.purchase.id])).rejects.toThrow(/refund_exceeds_net_paid/);
    await pool.query("select refund_purchase($1,'credit',3200,'bad number')", [pa.purchase.id]);
    expect(await balance(a!)).toBe(4000); // 800 sharing + 3200 refund = full charge back, no more
    await buy(c!, g); // A must not receive another sharing credit
    expect(await balance(a!)).toBe(4000);
    expect(await balance(b!)).toBe(3200 - 2600); // B still gets its credit
  });

  it("duplicate consumer submission cannot widen the sharing limit", async () => {
    const cs = await Promise.all([1, 2, 3].map((i) => company(`C${i}`, { excl: 9000, shared: 4000 })));
    const g = await lead(3);
    await buy(cs[0]!, g);
    await pool.query("select attach_duplicate($1, 5)", [g]); // resubmits choosing 5
    await pool.query("select attach_duplicate($1, 2)", [g]); // or choosing 2
    await buy(cs[1]!, g);
    await expect(buy(cs[2]!, g)).rejects.toThrow(/sold_out|lead_unavailable/);
  });

  it("historical purchases keep their pricing after admin price changes", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const g = await lead(1);
    const { purchase } = await buy(a, g);
    await pool.query(`insert into company_prices(company_id, exclusive_cents, shared_cents, set_by) values ($1,12000,6000,'admin')`, [a]);
    const { rows } = await pool.query("select charged_cents, list_price_cents from purchases where id=$1", [purchase.id]);
    expect(rows[0]).toEqual({ charged_cents: 9000, list_price_cents: 9000 });
  });
});

describe("eligibility and isolation", () => {
  it("brokers, unapproved and expired-credential companies cannot purchase", async () => {
    const g = await lead(3);
    const broker = await company("Broker", { excl: 9000, shared: 4000 }, { has_broker_authority: true });
    const pending = await company("Pending", { excl: 9000, shared: 4000 }, { status: "in_review" });
    const expired = await company("Expired", { excl: 9000, shared: 4000 }, { credentials_valid_until: "2020-01-01" });
    const noMc = await company("NoMC", { excl: 9000, shared: 4000 }, { mc_number: null });
    for (const c of [broker, pending, expired, noMc]) await expect(buy(c, g)).rejects.toThrow(/company_not_eligible/);
    for (const c of [broker, pending]) expect((await pool.query("select * from lead_contact_for_company($1,$2)", [g, c])).rows).toHaveLength(0);
  });

  it("the MC-number requirement is a platform setting (default on)", async () => {
    const g = await lead(3);
    const noMc = await company("NoMC", { excl: 9000, shared: 4000 }, { mc_number: null });
    await expect(buy(noMc, g)).rejects.toThrow(/company_not_eligible/);
    await pool.query("update platform_settings set value = 'false' where key = 'require_mc_number'");
    await expect(buy(noMc, g, "after-setting-change")).resolves.toBeTruthy();
  });

  it("contact details only after purchase; one company cannot read another's CRM notes", async () => {
    const a = await company("A", { excl: 9000, shared: 4000 });
    const b = await company("B", { excl: 9000, shared: 4000 });
    const g = await lead(2);
    expect((await pool.query("select * from lead_contact_for_company($1,$2)", [g, b])).rows).toHaveLength(0);
    const pa = await buy(a, g); const pb = await buy(b, g);
    expect((await pool.query("select email from lead_contact_for_company($1,$2)", [g, b])).rows[0].email).toBe("dana@example.com");

    await pool.query(`do $$ begin if not exists (select from pg_roles where rolname = 'amc_app') then create role amc_app; end if; end $$;
      grant usage on schema public to amc_app;
      grant select, insert on crm_notes, purchases to amc_app;
      grant usage on all sequences in schema public to amc_app;`);
    const client = await pool.connect();
    const asCompany = (id: string) => client.query(`select set_config('app.company_id', $1, true)`, [id]);
    try {
      // A company cannot write a note against another company's purchase.
      await client.query("begin; set local role amc_app;");
      await asCompany(a);
      await expect(client.query("insert into crm_notes(purchase_id, company_id, body) values ($1,$2,'spoof')", [pb.purchase.id, b]))
        .rejects.toThrow(/row-level security/);
      await client.query("rollback");

      // A writes a private note on the shared lead; B (who also bought it) cannot see it.
      await client.query("begin; set local role amc_app;");
      await asCompany(a);
      await client.query("insert into crm_notes(purchase_id, company_id, body) values ($1,$2,'A private note')", [pa.purchase.id, a]);
      await asCompany(b);
      expect((await client.query("select * from crm_notes")).rows).toHaveLength(0);
      await asCompany(a);
      expect((await client.query("select body from crm_notes")).rows).toEqual([{ body: "A private note" }]);
      await client.query("rollback");
    } finally { client.release(); }
  });
});

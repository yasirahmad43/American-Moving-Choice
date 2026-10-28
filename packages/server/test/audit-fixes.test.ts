/**
 * Fixes from docs/audit/marketplace-rules-audit.md §8: ZIP/radius/nationwide filters (F2),
 * real-time availability (F1), idempotency scoped to the request (F7), the sale window re-check at
 * completion (F14), company-scoped RLS on purchases, ledger entries and payment methods (F10), the
 * sweeper consulting Stripe (F5), the daily reconciliation report (F11), the selective-invitation
 * audit (F3) and admin coverage and re-matching (F4).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { adminDeleteCoverageRule, adminSaveCoverageRule, adminSetRulesPaused, rematchLeadGroup } from "../src/admin/coverage";
import { AdminError } from "../src/admin/common";
import { getBillingOverview } from "../src/billing/billing";
import { getRecord } from "../src/crm/records";
import { closePool, getPool, raisedMessage, withCompany } from "../src/db/pool";
import { zipsWithinMiles } from "../src/geo/geo";
import {
  INVITATION_AUDIT_FLAGS,
  invitationAuditFlags,
  jobByName,
  listInvitationAudits,
  listReconciliationReports,
  reconcilePayments,
  releaseExpiredAttempts,
  reviewInvitationAudit,
  runJob,
} from "../src/jobs/jobs";
import { applyScope, availabilityFor, listAvailable, parseMarketplaceFilters } from "../src/marketplace/listing";
import { purchase } from "../src/marketplace/purchase";
import type { StripeClientLike } from "../src/payments/stripe";
import { createUser, resetDatabase } from "./helpers";
import { actorOf, addDemoCard, makeCompany, makeRequest, type TestCompany } from "./marketplace-fixtures";

const pool = () => getPool();
let n = 0;
const idem = () => `fix-key-${Date.now()}-${++n}`;
const admin = { userId: "", ip: "203.0.113.9" };

beforeAll(async () => {
  await resetDatabase();
  admin.userId = await createUser({ email: "fix-admin@example.com", admin: "super_admin", fullName: "Fix Admin" });
});

afterAll(async () => {
  await closePool();
});

// ================================================================== F2 filters

describe("marketplace filters: ZIP, radius and nationwide", () => {
  let mover: TestCompany;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Filter Movers" });
  });

  it("drops the location filters the chosen scope does not use", () => {
    expect(applyScope({ scope: "nationwide", originState: "TX", originZip: "78704", radiusMiles: "25" })).toEqual({ scope: "nationwide" });
    expect(applyScope({ scope: "state", originState: "TX", destZip: "77006", radiusMiles: "50" })).toEqual({ scope: "state", originState: "TX" });
    expect(applyScope({ scope: "zip", originState: "TX", originZip: "78704", radiusMiles: "50" })).toEqual({ scope: "zip", originZip: "78704", radiusMiles: "50" });
    expect(applyScope({ radiusMiles: "25" })).toEqual({}); // a radius without a ZIP means nothing
    expect(parseMarketplaceFilters({ scope: "zip", originZip: "787", destZip: "77006", radiusMiles: "99", originState: "tx" })).toEqual({ scope: "zip", destZip: "77006" });
    expect(parseMarketplaceFilters({ originState: "tx", destState: "ca" })).toEqual({ originState: "TX", destState: "CA" });
  });

  it("zipsWithinMiles returns the ZIP itself plus its neighbours, and null for an unknown ZIP", () => {
    const near = zipsWithinMiles("78704", 25)!;
    expect(near).toContain("78704");
    expect(near).toContain("78701"); // downtown Austin
    expect(near).not.toContain("77006"); // Houston
    expect(zipsWithinMiles("00000", 25)).toBeNull();
  });

  it("filters by exact ZIP, by radius and directionally, and nationwide lists everything", async () => {
    const austinToHouston = await makeRequest({ limit: 1, named: [mover] }); // 78704 → 77006 (fixture)
    const ids = async (filters: Parameters<typeof listAvailable>[1]) => (await listAvailable(actorOf(mover), filters)).map((l) => l.groupId);

    expect(await ids({ originZip: "78704" })).toContain(austinToHouston.groupId);
    expect(await ids({ originZip: "78701" })).not.toContain(austinToHouston.groupId); // exact
    expect(await ids({ originZip: "78701", radiusMiles: "25" })).toContain(austinToHouston.groupId); // downtown Austin, 25 mi
    expect(await ids({ destZip: "77006", radiusMiles: "25" })).toContain(austinToHouston.groupId);
    expect(await ids({ originZip: "77006", radiusMiles: "25" })).not.toContain(austinToHouston.groupId); // wrong direction
    expect(await ids({ originZip: "78704", destZip: "78701", radiusMiles: "25" })).not.toContain(austinToHouston.groupId); // destination outside radius
    expect(await ids({ originZip: "00000", radiusMiles: "100" })).toEqual([]); // unknown ZIP matches nothing
    expect(await ids({ scope: "nationwide", originZip: "00000", originState: "FL" })).toContain(austinToHouston.groupId);
    expect(await ids({ originState: "TX", destState: "TX" })).toContain(austinToHouston.groupId);
    expect(await ids({ originState: "TX", destState: "FL" })).not.toContain(austinToHouston.groupId);
  });
});

// ================================================================== F1 availability

describe("availability endpoint data", () => {
  let a: TestCompany;
  let b: TestCompany;
  let stranger: TestCompany;

  beforeAll(async () => {
    a = await makeCompany({ name: "Avail Alpha" });
    b = await makeCompany({ name: "Avail Beta" });
    stranger = await makeCompany({ name: "Avail Stranger" });
    await addDemoCard(a);
  });

  it("reports status, buyer count and in-progress only for requests the company is named in", async () => {
    const shared = await makeRequest({ limit: 2, named: [a, b] });
    const exclusive = await makeRequest({ limit: 1, named: [a, b] });
    const bogus = randomUUID();

    expect(await availabilityFor(actorOf(a), [shared.groupId, bogus, "not-a-uuid"])).toEqual([
      { groupId: shared.groupId, status: "available", buyerCount: 0, sharingLimit: 2, inProgress: false },
      { groupId: bogus, status: "unavailable", buyerCount: 0, sharingLimit: 0, inProgress: false },
      { groupId: "not-a-uuid", status: "unavailable", buyerCount: 0, sharingLimit: 0, inProgress: false },
    ]);
    // Not named: nothing is revealed, not even that the request exists.
    expect((await availabilityFor(actorOf(stranger), [shared.groupId]))[0]).toMatchObject({ status: "unavailable", sharingLimit: 0 });

    // A reservation by B shows as in progress to A, not to B itself.
    await pool().query("select reserve_purchase($1, $2, $3)", [b.companyId, exclusive.groupId, "avail-hold-1"]);
    expect((await availabilityFor(actorOf(a), [exclusive.groupId]))[0]).toMatchObject({ status: "available", inProgress: true });
    expect((await availabilityFor(actorOf(b), [exclusive.groupId]))[0]).toMatchObject({ status: "available", inProgress: false });
    await pool().query("select fail_purchase(id) from purchase_attempts where idempotency_key = 'avail-hold-1'");

    // After A buys the shared request: purchased for A, one of two buyers for B.
    const bought = await purchase({ ...actorOf(a), groupId: shared.groupId, idempotencyKey: idem() });
    expect(bought.ok).toBe(true);
    expect((await availabilityFor(actorOf(a), [shared.groupId]))[0]).toMatchObject({ status: "purchased", buyerCount: 1 });
    expect((await availabilityFor(actorOf(b), [shared.groupId]))[0]).toMatchObject({ status: "available", buyerCount: 1, sharingLimit: 2 });

    // Sold out and expired.
    await pool().query("update lead_groups set sharing_limit = 1, status = 'sold_out' where id = $1", [shared.groupId]);
    expect((await availabilityFor(actorOf(b), [shared.groupId]))[0]).toMatchObject({ status: "sold_out" });
    await pool().query("update lead_groups set expires_at = now() - interval '1 second' where id = $1", [exclusive.groupId]);
    expect((await availabilityFor(actorOf(b), [exclusive.groupId]))[0]).toMatchObject({ status: "expired" });
    // Withdrawn.
    const withdrawn = await makeRequest({ limit: 1, named: [a] });
    await pool().query("select withdraw_lead_group($1)", [withdrawn.groupId]);
    expect((await availabilityFor(actorOf(a), [withdrawn.groupId]))[0]).toMatchObject({ status: "withdrawn" });
  });

  it("never carries contact details", async () => {
    const request = await makeRequest({ limit: 1, named: [a] });
    const text = JSON.stringify(await availabilityFor(actorOf(a), [request.groupId]));
    expect(text).not.toContain(request.lastName);
    expect(text).not.toContain(request.email);
    expect(text).not.toContain(request.phone);
  });
});

// ================================================================== F7, F14, F9

describe("purchase hardening", () => {
  let mover: TestCompany;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Harden Movers" });
    await addDemoCard(mover);
  });

  it("scopes the idempotency key to (company, key, request): reusing it for another request fails without a reservation", async () => {
    const first = await makeRequest({ limit: 1, named: [mover] });
    const second = await makeRequest({ limit: 1, named: [mover] });
    const key = idem();
    const bought = await purchase({ ...actorOf(mover), groupId: first.groupId, idempotencyKey: key });
    expect(bought.ok).toBe(true);

    const reused = await purchase({ ...actorOf(mover), groupId: second.groupId, idempotencyKey: key });
    expect(reused).toMatchObject({ ok: false, code: "unknown" });
    expect((await pool().query("select count(*)::int as n from purchase_attempts where group_id = $1", [second.groupId])).rows[0].n).toBe(0);
    await expect(pool().query("select reserve_purchase($1, $2, $3)", [mover.companyId, second.groupId, key])).rejects.toSatisfy((e) => raisedMessage(e) === "idempotency_key_reused");
    // The original key still replays its own purchase.
    expect(await purchase({ ...actorOf(mover), groupId: first.groupId, idempotencyKey: key })).toMatchObject({ ok: true, replayed: true });
  });

  it("concurrent submits of one key for one request buy once; the same key raced against another request never reserves it", async () => {
    const target = await makeRequest({ limit: 1, named: [mover] });
    const decoy = await makeRequest({ limit: 1, named: [mover] });
    const key = idem();
    const results = await Promise.allSettled([
      purchase({ ...actorOf(mover), groupId: target.groupId, idempotencyKey: key }, { busyRetryDelayMs: 20 }),
      purchase({ ...actorOf(mover), groupId: target.groupId, idempotencyKey: key }, { busyRetryDelayMs: 20 }),
      purchase({ ...actorOf(mover), groupId: decoy.groupId, idempotencyKey: key }, { busyRetryDelayMs: 20 }),
    ]);
    const outcomes = results.map((r) => (r.status === "fulfilled" ? r.value : { ok: false as const, code: "threw" }));
    const wins = outcomes.filter((o) => o.ok);
    expect(wins.length).toBeGreaterThanOrEqual(1);
    expect(new Set(wins.map((o) => (o.ok ? o.purchaseId : "")))).toHaveProperty("size", 1); // one purchase, replayed at most
    // The key binds to whichever request reserved first; the other request gets no attempt at all.
    const attempts = await pool().query<{ group_id: string }>("select distinct group_id from purchase_attempts where idempotency_key = $1", [key]);
    expect(attempts.rows).toHaveLength(1);
    const bought = await pool().query<{ group_id: string }>("select group_id from purchases where group_id in ($1, $2)", [target.groupId, decoy.groupId]);
    expect(bought.rows).toEqual([{ group_id: attempts.rows[0]!.group_id }]);
    // Whoever lost the key race reports a clean failure, never a success for the wrong request, and
    // the honoured purchase is never refunded by the concurrent settlement (180: re-check after the lock).
    for (const o of outcomes) if (!o.ok) expect(["unknown", "purchase_in_progress", "already_purchased"]).toContain(o.code);
    for (const o of outcomes) if (o.ok) expect(o.purchaseId).toBe(wins[0]!.ok ? wins[0]!.purchaseId : "");
    expect((await pool().query("select count(*)::int as n from payment_refunds r join purchase_attempts a on a.id = r.attempt_id where a.idempotency_key = $1", [key])).rows[0].n).toBe(0);
  });

  it("complete_purchase refuses a reservation whose sale window closed during payment", async () => {
    const request = await makeRequest({ limit: 1, named: [mover] });
    const attempt = (await pool().query<{ id: string }>("select id from reserve_purchase($1, $2, $3)", [mover.companyId, request.groupId, idem()])).rows[0]!;
    await pool().query("update lead_groups set expires_at = now() - interval '1 second' where id = $1", [request.groupId]);
    const completed = await pool().query<{ id: string | null }>("select id from complete_purchase($1, $2)", [attempt.id, `demo_${attempt.id}`]);
    expect(completed.rows[0]?.id ?? null).toBeNull();
    expect((await pool().query("select status from purchase_attempts where id = $1", [attempt.id])).rows[0].status).toBe("failed");
    expect((await pool().query("select count(*)::int as n from purchases where group_id = $1", [request.groupId])).rows[0].n).toBe(0);
  });

  it("sharing_policies rejects an increasing or out-of-range factor schedule in SQL", async () => {
    await expect(pool().query("insert into sharing_policies (version, factors_bp) values ('bad-up', '{10000,8000,9000}')")).rejects.toThrow(/sharing_policies_factors_non_increasing/);
    await expect(pool().query("insert into sharing_policies (version, factors_bp) values ('bad-start', '{9000,8000}')")).rejects.toThrow(/factors/);
    await expect(pool().query("insert into sharing_policies (version, factors_bp) values ('bad-neg', '{10000,-1}')")).rejects.toThrow(/sharing_policies_factors_non_increasing/);
    await pool().query("insert into sharing_policies (version, factors_bp) values ('ok-flat', '{10000,10000,5000,5000}')");
  });
});

// ================================================================== F10 RLS

describe("company-scoped row-level security on purchases, ledger entries and payment methods", () => {
  let a: TestCompany;
  let b: TestCompany;
  let sharedGroup: string;
  let purchaseA: string;

  beforeAll(async () => {
    a = await makeCompany({ name: "RLS Alpha" });
    b = await makeCompany({ name: "RLS Beta" });
    await addDemoCard(a);
    await addDemoCard(b);
    const shared = await makeRequest({ limit: 2, named: [a, b] });
    sharedGroup = shared.groupId;
    const pa = await purchase({ ...actorOf(a), groupId: shared.groupId, idempotencyKey: idem() });
    const pb = await purchase({ ...actorOf(b), groupId: shared.groupId, idempotencyKey: idem() });
    expect(pa.ok && pb.ok).toBe(true);
    purchaseA = pa.ok ? pa.purchaseId : "";
  });

  it("hides and protects the other company's rows inside a company transaction; service paths without a context see everything", async () => {
    const count = (db: { query: (t: string, v?: unknown[]) => Promise<{ rows: { n: number }[] }> }, table: string, company: string) =>
      db.query(`select count(*)::int as n from ${table} where company_id = $1`, [company]).then((r) => r.rows[0]!.n);
    for (const table of ["purchases", "ledger_entries", "payment_methods"]) {
      expect(await count(pool(), table, a.companyId)).toBeGreaterThan(0);
      await withCompany(b.companyId, async (client) => {
        expect(await count(client, table, a.companyId)).toBe(0);
        expect(await count(client, table, b.companyId)).toBeGreaterThan(0);
      });
    }
    // B cannot write A's rows from its own context.
    await expect(
      withCompany(b.companyId, (client) =>
        client.query("insert into payment_methods (company_id, provider, provider_pm_id, authorization_text_version) values ($1, 'demo', $2, 'v')", [a.companyId, `spoof-${randomUUID()}`]),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(withCompany(b.companyId, (client) => client.query("update purchases set refunded_at = now() where id = $1 returning id", [purchaseA]))).resolves.toMatchObject({ rowCount: 0 });
    expect((await pool().query("select refunded_at from purchases where id = $1", [purchaseA])).rows[0].refunded_at).toBeNull();
  });

  it("the CRM still counts every buyer of a shared request, and the billing page reads inside the company scope", async () => {
    const record = await getRecord(actorOf(a), purchaseA);
    expect(record.purchase).toMatchObject({ buyerCount: 2, sharingLimit: 2 });
    const billing = await getBillingOverview(actorOf(a));
    expect(billing.receipts.some((r) => r.purchaseId === purchaseA)).toBe(true);
    expect(billing.ledger.every((entry) => entry.purchaseId === null || entry.purchaseId === purchaseA || entry.kind === "adjustment")).toBe(true);
    expect(billing.ledger.some((entry) => entry.kind === "sharing_credit")).toBe(true); // A's credit from B's purchase
    expect(sharedGroup).toBeTruthy();
  });
});

// ================================================================== F5 sweeper

describe("release_expired_attempts consults the payment provider", () => {
  let mover: TestCompany;

  async function expiredProcessingAttempt(ref: string): Promise<string> {
    const request = await makeRequest({ limit: 1, named: [mover] });
    const attempt = (await pool().query<{ id: string }>("select id from reserve_purchase($1, $2, $3)", [mover.companyId, request.groupId, idem()])).rows[0]!;
    await pool().query(
      "insert into payment_charges (attempt_id, company_id, provider, amount_cents, status, provider_ref) values ($1, $2, 'stripe', 9000, 'processing', $3)",
      [attempt.id, mover.companyId, ref],
    );
    await pool().query("update purchase_attempts set expires_at = now() - interval '1 minute' where id = $1", [attempt.id]);
    return attempt.id;
  }

  const status = async (id: string) => (await pool().query("select status from purchase_attempts where id = $1", [id])).rows[0].status;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Sweeper Movers" });
  });

  it("keeps a reservation Stripe still reports as processing and releases the others", async () => {
    const processing = await expiredProcessingAttempt(`pi_proc_${n}`);
    const settled = await expiredProcessingAttempt(`pi_done_${n}`);
    const client = {
      paymentIntents: {
        retrieve: vi.fn(async (id: string) => ({ id, status: id.startsWith("pi_proc") ? "processing" : "succeeded", amount: 0, currency: "usd" })),
      },
    } as unknown as StripeClientLike;
    const result = await releaseExpiredAttempts(pool(), client);
    expect(result.details).toMatchObject({ provider_consulted: 2, still_processing: 1 });
    expect(await status(processing)).toBe("reserved");
    expect(await status(settled)).toBe("expired");
    // A provider error keeps the reservation too; without Stripe (demo mode) nothing is consulted.
    const flaky = await expiredProcessingAttempt(`pi_flaky_${n}`);
    const failing = { paymentIntents: { retrieve: vi.fn(async () => { throw new Error("network"); }) } } as unknown as StripeClientLike;
    await releaseExpiredAttempts(pool(), failing);
    expect(await status(flaky)).toBe("reserved");
    const demo = await releaseExpiredAttempts(pool(), null);
    expect(demo.details).toMatchObject({ provider_consulted: 0 });
    expect(await status(flaky)).toBe("expired");
    expect(await status(processing)).toBe("expired");
  });
});

// ================================================================== F11 reconciliation report

describe("reconcile-payments job", () => {
  it("writes a report row linked to its job run, counting the issues the admin pages show", async () => {
    const before = (await listReconciliationReports()).length;
    const outcome = await runJob(jobByName("reconcile_payments")!, { trigger: "test" });
    expect(outcome.status).toBe("succeeded");
    const reports = await listReconciliationReports();
    expect(reports.length).toBe(before + 1);
    expect(reports[0]).toMatchObject({ job_run_id: outcome.status === "succeeded" ? outcome.runId : null });
    expect(reports[0]!.summary).toMatchObject({ ledger_issues: expect.any(Number), charge_issues: expect.any(Number), orphan_attempts: expect.any(Number), unsettled_refunds: expect.any(Number) });
    // The sweeper test above left stripe charges without a purchase: those are the charge issues counted.
    expect(reports[0]!.issues_count).toBe(
      (reports[0]!.summary.ledger_issues as number) + (reports[0]!.summary.charge_issues as number) + (reports[0]!.summary.orphan_attempts as number) + (reports[0]!.summary.unsettled_refunds as number),
    );
    const direct = await reconcilePayments();
    expect(direct.items).toBe(reports[0]!.issues_count);
  });
});

// ================================================================== F3 selective-invitation audit

describe("review-invitation audit", () => {
  it("applies the documented heuristic", () => {
    const base = { eligible: 6, requested: 3, requestedAvgValueCents: null, otherAvgValueCents: null, repeatRequested: 0, repeatBase: 0 };
    expect(invitationAuditFlags({ ...base, eligible: 4 })).toEqual([]); // too few to score
    expect(invitationAuditFlags(base)).toEqual([]); // half covered, no value data
    expect(invitationAuditFlags({ ...base, requested: 2 })).toEqual(["low_coverage"]);
    expect(invitationAuditFlags({ ...base, requestedAvgValueCents: 300_000, otherAvgValueCents: 200_000 })).toEqual(["high_value_skew"]);
    expect(invitationAuditFlags({ ...base, requestedAvgValueCents: 250_000, otherAvgValueCents: 200_000 })).toEqual([]);
    expect(invitationAuditFlags({ ...base, requested: 2, requestedAvgValueCents: 300_000, otherAvgValueCents: 100_000 })).toEqual(["low_coverage"]); // under 3 requested: averages not compared
    expect(invitationAuditFlags({ ...base, repeatRequested: 2, repeatBase: 2 })).toEqual(["repeat_buyer_skew"]); // 67% vs 33%
    expect(invitationAuditFlags({ ...base, repeatRequested: 1, repeatBase: 2 })).toEqual([]); // 33% vs 33%
    expect(Object.keys(INVITATION_AUDIT_FLAGS)).toEqual(["low_coverage", "high_value_skew", "repeat_buyer_skew"]);
  });

  it("flags a company that asks only about its biggest jobs, opens one case, and records every scored company", async () => {
    const picky = await makeCompany({ name: "Picky Invites Movers" });
    const fair = await makeCompany({ name: "Fair Invites Movers" });
    await addDemoCard(picky);
    await addDemoCard(fair);
    const buy = async (company: TestCompany, valueCents: number, requested: boolean) => {
      const request = await makeRequest({ limit: 1, named: [company] });
      const result = await purchase({ ...actorOf(company), groupId: request.groupId, idempotencyKey: idem() });
      if (!result.ok) throw new Error(result.code);
      await withCompany(company.companyId, (client) => client.query("update crm_records set stage = 'completed', estimated_value_cents = $2 where purchase_id = $1", [result.purchaseId, valueCents]));
      if (requested) {
        await pool().query(
          `insert into review_invitations (purchase_id, company_id, review_type, requested_by, token_hash, send_after, expires_at)
           values ($1, $2, 'move_experience', 'company', encode(sha256(random()::text::bytea), 'hex'), now(), now() + interval '30 days')`,
          [result.purchaseId, company.companyId],
        );
      }
    };
    // Picky: six completed moves, asks about the three worth $8,000 and not the three worth $1,500.
    for (const value of [800_000, 850_000, 900_000]) await buy(picky, value, true);
    for (const value of [150_000, 160_000, 140_000]) await buy(picky, value, false);
    // Fair: six completed moves, asks about five of them, values alike.
    for (let i = 0; i < 6; i++) await buy(fair, 300_000 + i, i < 5);

    const outcome = await runJob(jobByName("review_invitation_audit")!, { trigger: "test" });
    expect(outcome.status).toBe("succeeded");
    const audits = await listInvitationAudits();
    const pickyRow = audits.find((r) => r.company_id === picky.companyId)!;
    const fairRow = audits.find((r) => r.company_id === fair.companyId)!;
    expect(pickyRow).toMatchObject({ eligible_count: 6, requested_count: 3, coverage_pct: 50, flags: ["high_value_skew"] });
    expect(pickyRow.requested_avg_value_cents).toBe(850_000);
    expect(pickyRow.other_avg_value_cents).toBe(150_000);
    expect(pickyRow.case_id).toBeTruthy();
    expect(fairRow).toMatchObject({ eligible_count: 6, requested_count: 5, coverage_pct: 83, flags: [], case_id: null });
    expect(audits.indexOf(pickyRow)).toBeLessThan(audits.indexOf(fairRow)); // flagged first

    const openCase = await pool().query<{ case_type: string; status: string; description: string }>("select case_type, status, description from cases where id = $1", [pickyRow.case_id]);
    expect(openCase.rows[0]).toMatchObject({ case_type: "review", status: "open" });
    expect(openCase.rows[0]!.description).toContain(INVITATION_AUDIT_FLAGS.high_value_skew);
    expect((await pool().query("select count(*)::int as n from audit_log where action = 'case.open' and entity_id = $1", [pickyRow.case_id])).rows[0].n).toBe(1);

    // A second run scores again but reuses the open case.
    await reviewInvitationAudit();
    expect((await pool().query("select count(*)::int as n from cases where company_id = $1", [picky.companyId])).rows[0].n).toBe(1);
    expect((await pool().query("select count(*)::int as n from review_invitation_audits where company_id = $1", [picky.companyId])).rows[0].n).toBe(2);
  });
});

// ================================================================== F4 admin coverage and distribution

describe("admin coverage editing and re-matching", () => {
  let mover: TestCompany;
  let other: TestCompany;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Admin Coverage Movers" });
    other = await makeCompany({ name: "Admin Coverage Other" });
  });

  it("edits a company's rules through the coverage service, audited as an admin, bumping coverage_version", async () => {
    const version = async () => (await pool().query<{ coverage_version: number }>("select coverage_version from companies where id = $1", [mover.companyId])).rows[0]!.coverage_version;
    const v0 = await version();
    const saved = await adminSaveCoverageRule(admin, mover.companyId, null, {
      kind: "exclude",
      label: "No Florida pickups",
      origin: { states: ["FL"], counties: [], zips: [] },
      destination: { states: [], counties: [], zips: [] },
      moveTypes: [],
      moveSizes: [],
      services: [],
      paused: false,
    });
    expect(saved).toMatchObject({ ok: true });
    expect(saved.ok && saved.coverageVersion).toBeGreaterThan(v0); // the 002 triggers move the version on
    expect(await version()).toBe(saved.ok ? saved.coverageVersion : -1);
    const ruleId = saved.ok ? saved.ruleId : "";
    const auditRow = await pool().query<{ actor_type: string; actor_id: string; ip: string }>("select actor_type, actor_id, ip from audit_log where action = 'coverage.rule_created' and entity_id = $1", [ruleId]);
    expect(auditRow.rows[0]).toEqual({ actor_type: "admin", actor_id: admin.userId, ip: admin.ip });

    const invalid = await adminSaveCoverageRule(admin, mover.companyId, null, { kind: "include", label: null, origin: { states: ["ZZ"], counties: [], zips: [] }, destination: { states: [], counties: [], zips: [] }, moveTypes: [], moveSizes: [], services: [], paused: false });
    expect(invalid).toMatchObject({ ok: false });
    expect(await adminSetRulesPaused(admin, mover.companyId, null, true)).toBe(2); // nationwide include + the exclusion
    expect(await adminSetRulesPaused(admin, mover.companyId, ruleId, false)).toBe(1);
    expect(await adminDeleteCoverageRule(admin, mover.companyId, ruleId)).toBe(true);
    expect(await adminDeleteCoverageRule(admin, mover.companyId, ruleId)).toBe(false);
    await adminSetRulesPaused(admin, mover.companyId, null, false);
    await expect(adminSaveCoverageRule(admin, "nope", null, {})).rejects.toBeInstanceOf(AdminError);
  });

  it("re-runs matching only for companies named in the consent and never adds a company", async () => {
    const request = await makeRequest({ limit: 2, named: [mover], notNamed: [other] });
    // Both companies change coverage after matching: their snapshots are now stale.
    for (const c of [mover, other]) await adminSetRulesPaused(admin, c.companyId, null, true);
    for (const c of [mover, other]) await adminSetRulesPaused(admin, c.companyId, null, false);
    const stale = await pool().query<{ company_id: string; stale: boolean; named_in_consent: boolean }>(
      "select e.company_id, e.coverage_version <> c.coverage_version as stale, e.named_in_consent from lead_eligibility e join companies c on c.id = e.company_id where e.group_id = $1 order by e.named_in_consent desc",
      [request.groupId],
    );
    expect(stale.rows.map((r) => r.stale)).toEqual([true, true]);

    const outcome = await rematchLeadGroup(admin, request.groupId);
    expect(outcome).toEqual({ groupId: request.groupId, refreshed: [{ companyId: mover.companyId, ruleId: expect.any(String) }], notMatching: [], removed: 1 });
    const after = await pool().query<{ company_id: string; stale: boolean; named_in_consent: boolean }>(
      "select e.company_id, e.coverage_version <> c.coverage_version as stale, e.named_in_consent from lead_eligibility e join companies c on c.id = e.company_id where e.group_id = $1 order by e.named_in_consent desc",
      [request.groupId],
    );
    expect(after.rows).toEqual([
      { company_id: mover.companyId, stale: false, named_in_consent: true },
      { company_id: other.companyId, stale: true, named_in_consent: false }, // removed by the consumer: untouched
    ]);
    expect((await pool().query("select count(*)::int as n from lead_eligibility where group_id = $1", [request.groupId])).rows[0].n).toBe(2);
    expect((await pool().query("select count(*)::int as n from audit_log where action = 'lead.rematch' and entity_id = $1", [request.groupId])).rows[0].n).toBe(1);

    // A named company whose coverage no longer matches keeps its stale snapshot (purchase stays blocked).
    await adminSetRulesPaused(admin, mover.companyId, null, true);
    const blocked = await rematchLeadGroup(admin, request.groupId);
    expect(blocked.refreshed).toEqual([]);
    expect(blocked.notMatching).toEqual([{ companyId: mover.companyId, reason: expect.any(String) }]);
    await adminSetRulesPaused(admin, mover.companyId, null, false);

    await expect(rematchLeadGroup(admin, randomUUID())).rejects.toBeInstanceOf(AdminError);
    await pool().query("update lead_groups set status = 'expired' where id = $1", [request.groupId]);
    await expect(rematchLeadGroup(admin, request.groupId)).rejects.toMatchObject({ code: "bad_status" });
  });
});

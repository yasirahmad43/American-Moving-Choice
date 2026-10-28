import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool, withCompany } from "../src/db/pool";
import { getListing, listAvailable } from "../src/marketplace/listing";
import { purchaseErrorMessage } from "../src/marketplace/messages";
import { nextPrice, splitCharge } from "../src/marketplace/pricing";
import { purchase, purchaseNoticeText } from "../src/marketplace/purchase";
import { PermissionError } from "../src/marketplace/permissions";
import { saveDemoCard, PaymentMethodError } from "../src/payments/methods";
import { demoPaymentsProvider } from "../src/payments/demo";
import type { PaymentsProvider } from "../src/payments/types";
import { resetDatabase } from "./helpers";
import { actorOf, addDemoCard, makeCompany, makeMember, makeRequest, type TestCompany } from "./marketplace-fixtures";

const pool = () => getPool();
let key = 0;
const idem = () => `test-key-${Date.now()}-${++key}`;

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("pricing helpers", () => {
  it("prices exclusive and shared requests like reserve_purchase", () => {
    expect(nextPrice({ sharingLimit: 1, buyerCount: 0, exclusiveCents: 9500, sharedCents: 4200, factorsBp: [10000, 8000] })).toMatchObject({ leadType: "exclusive", chargeCents: 9500 });
    expect(nextPrice({ sharingLimit: 1, buyerCount: 1, exclusiveCents: 9500, sharedCents: 4200, factorsBp: [10000] })).toBeNull();
    expect(nextPrice({ sharingLimit: 3, buyerCount: 2, exclusiveCents: 9500, sharedCents: 4500, factorsBp: [10000, 8000, 6500] })).toMatchObject({ leadType: "shared", chargeCents: 2925, position: 3, factorBp: 6500 });
    expect(splitCharge(2925, 1000)).toEqual({ creditCents: 1000, cardCents: 1925 });
    expect(splitCharge(2925, 5000)).toEqual({ creditCents: 2925, cardCents: 0 });
  });

  it("keeps purchase updates anonymous until the company introduces itself", () => {
    const notice = purchaseNoticeText({ firstName: "Jordan", moverName: "Demo Movers", usdot: "9000001", referenceCode: "AMC-AAAA-BBBB", profileUrl: "http://localhost:3000/companies/demo-movers/" });
    expect(notice.subject).toBe("An update on your moving request");
    expect(notice.body).not.toMatch(/Demo Movers|9000001|demo-movers/);
    expect(notice.body).toContain("Movers pay American Moving Choice");
    expect(notice.body).toContain("identify itself when it contacts you");
  });
});

describe("marketplace listing", () => {
  let a: TestCompany;
  let b: TestCompany;
  let outsider: TestCompany;

  beforeAll(async () => {
    a = await makeCompany({ name: "Listing Alpha Movers", exclusive: 9500, shared: 4200 });
    b = await makeCompany({ name: "Listing Beta Movers" });
    outsider = await makeCompany({ name: "Listing Outsider Movers" });
  });

  it("lists only requests naming the company, as allow-listed previews with this company's price", async () => {
    const request = await makeRequest({ limit: 1, named: [a], notNamed: [outsider] });
    const listings = await listAvailable(actorOf(a));
    const mine = listings.find((l) => l.groupId === request.groupId);
    expect(mine).toBeDefined();
    expect(mine!.price).toMatchObject({ leadType: "exclusive", chargeCents: 9500 });
    expect(mine!.preview).toMatchObject({ firstName: "Jordan", leadType: "exclusive", buyerCount: 0, maxBuyers: 1, price: 9500 });
    expect(mine!.preview.origin).toEqual({ city: "Austin", state: "TX", zip: null }); // show_zip_in_preview defaults to false
    const serialized = JSON.stringify(listings);
    expect(serialized).not.toContain(request.lastName);
    expect(serialized).not.toContain(request.email);
    expect(serialized).not.toContain(request.phone);

    expect((await listAvailable(actorOf(outsider))).some((l) => l.groupId === request.groupId)).toBe(false);
    expect((await listAvailable(actorOf(b))).some((l) => l.groupId === request.groupId)).toBe(false);
    expect(await getListing(actorOf(outsider), request.groupId)).toEqual({ state: "unavailable" });
  });

  it("filters by lead type and state, and hides expired or withdrawn requests", async () => {
    const shared = await makeRequest({ limit: 3, named: [b] });
    const expired = await makeRequest({ limit: 2, named: [b] });
    const withdrawn = await makeRequest({ limit: 2, named: [b] });
    await pool().query("update lead_groups set expires_at = now() - interval '1 minute' where id = $1", [expired.groupId]);
    await pool().query("select withdraw_lead_group($1)", [withdrawn.groupId]);
    const ids = (await listAvailable(actorOf(b))).map((l) => l.groupId);
    expect(ids).toContain(shared.groupId);
    expect(ids).not.toContain(expired.groupId);
    expect(ids).not.toContain(withdrawn.groupId);
    expect((await listAvailable(actorOf(b), { leadType: "exclusive" })).map((l) => l.groupId)).not.toContain(shared.groupId);
    expect((await listAvailable(actorOf(b), { originState: "FL" })).length).toBe(0);
  });

  it("refuses roles without marketplace access", async () => {
    const billing = await makeMember(a, "billing");
    await expect(listAvailable(actorOf(a, billing))).rejects.toBeInstanceOf(PermissionError);
    await expect(listAvailable({ userId: b.ownerId, companyId: a.companyId })).rejects.toBeInstanceOf(PermissionError);
  });
});

describe("purchase", () => {
  let mover: TestCompany;
  let rival: TestCompany;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Purchase Demo Movers", exclusive: 9500, shared: 4200 });
    rival = await makeCompany({ name: "Purchase Rival Movers", exclusive: 8800, shared: 3900 });
  });

  it("asks for a payment method first and shares nothing", async () => {
    const request = await makeRequest({ limit: 1, named: [mover, rival] });
    const result = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: idem() });
    expect(result).toEqual({ ok: false, code: "no_payment_method", message: purchaseErrorMessage("no_payment_method") });
    const attempts = await pool().query("select status from purchase_attempts where group_id = $1", [request.groupId]);
    expect(attempts.rows).toEqual([{ status: "failed" }]);
    const contact = await pool().query("select * from lead_contact_for_company($1, $2)", [request.groupId, mover.companyId]);
    expect(contact.rowCount).toBe(0);
  });

  it("saves the demo card only with the authorization ticked, storing the rendered text", async () => {
    await expect(saveDemoCard({ ...actorOf(mover), authorized: false })).rejects.toBeInstanceOf(PaymentMethodError);
    await addDemoCard(mover);
    const card = await pool().query(
      "select provider, brand, last4, is_default, authorization_text_version, authorization_rendered_text, authorized_ip from payment_methods where company_id = $1",
      [mover.companyId],
    );
    expect(card.rows[0]).toMatchObject({ provider: "demo", last4: "4242", is_default: true, authorization_text_version: "card-auth-v0-draft", authorized_ip: "203.0.113.5" });
    expect(card.rows[0].authorization_rendered_text).toContain(`Authorized by ${mover.name} Owner for ${mover.name} on`);
    await expect(addDemoCard(mover)).rejects.toThrow(/already saved/);
    const billing = await makeMember(mover, "manager", true);
    await expect(saveDemoCard({ ...actorOf(mover, billing), authorized: true })).rejects.toBeInstanceOf(PermissionError);
    await addDemoCard(rival);
  });

  it("buys an exclusive request: charge, disclosure, CRM record, consumer notice; a second company finds it sold out", async () => {
    const request = await makeRequest({ limit: 1, named: [mover, rival] });
    const key1 = idem();
    const result = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: key1, ip: "203.0.113.7" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const purchaseRow = await pool().query("select p.charged_cents, a.payment_ref, a.id as attempt_id from purchases p join purchase_attempts a on a.id = p.attempt_id where p.id = $1", [result.purchaseId]);
    expect(purchaseRow.rows[0].charged_cents).toBe(9500);
    expect(purchaseRow.rows[0].payment_ref).toBe(`demo_${purchaseRow.rows[0].attempt_id}`);
    const charge = await pool().query("select provider, status, amount_cents from payment_charges where attempt_id = $1", [purchaseRow.rows[0].attempt_id]);
    expect(charge.rows[0]).toEqual({ provider: "demo", status: "succeeded", amount_cents: 9500 });

    const crm = await withCompany(mover.companyId, (c) => c.query("select stage, assignee_user_id from crm_records where purchase_id = $1", [result.purchaseId]));
    expect(crm.rows[0]).toEqual({ stage: "new", assignee_user_id: mover.ownerId });

    const notice = await pool().query("select to_address, template, subject, body_text, status from messages where related_id = $1", [result.purchaseId]);
    expect(notice.rows).toHaveLength(1);
    expect(notice.rows[0]).toMatchObject({ to_address: request.email, template: "purchase_notice", status: "demo" });
    expect(notice.rows[0].body_text).not.toContain(mover.name);
    expect(notice.rows[0].body_text).not.toContain(mover.usdot);
    expect(notice.rows[0].body_text).toContain("Movers pay American Moving Choice");
    expect(notice.rows[0].body_text).not.toContain("/companies/");
    expect(notice.rows[0].body_text).toContain("identify itself when it contacts you");
    const access = await pool().query("select action, user_id from contact_access_log where purchase_id = $1", [result.purchaseId]);
    expect(access.rows).toEqual([{ action: "notify", user_id: mover.ownerId }]);

    // Double click / retry with the same key: same purchase, nothing new.
    const replay = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: key1 });
    expect(replay).toEqual({ ok: true, purchaseId: result.purchaseId, replayed: true });
    expect((await pool().query("select 1 from messages where related_id = $1", [result.purchaseId])).rowCount).toBe(1);

    const again = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: idem() });
    expect(again).toMatchObject({ ok: false, code: "already_purchased", purchaseId: result.purchaseId });
    const second = await purchase({ ...actorOf(rival), groupId: request.groupId, idempotencyKey: idem() });
    expect(second).toMatchObject({ ok: false, code: "lead_unavailable" });
    expect((await pool().query("select status from lead_groups where id = $1", [request.groupId])).rows[0].status).toBe("sold_out");
  });

  it("gives the first buyer of a shared request the sharing credit when a second company buys", async () => {
    const request = await makeRequest({ limit: 3, named: [mover, rival] });
    const first = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: idem() });
    const second = await purchase({ ...actorOf(rival), groupId: request.groupId, idempotencyKey: idem() });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const charged = await pool().query("select company_id, charged_cents, position from purchases where group_id = $1 order by position", [request.groupId]);
    expect(charged.rows.map((r) => r.charged_cents)).toEqual([4200, 3120]); // 3900 × 80%
    const credit = await pool().query("select company_id, amount_cents from ledger_entries where kind = 'sharing_credit' and source_purchase_id = $1", [second.purchaseId]);
    expect(credit.rows).toEqual([{ company_id: mover.companyId, amount_cents: 840 }]); // 4200 - 3360
  });

  it("spends account credit first and skips the card when credit covers the charge", async () => {
    const credited = await makeCompany({ name: "Purchase Credited Movers", exclusive: 5000, shared: 2500 });
    await pool().query(
      "insert into ledger_entries (company_id, kind, amount_cents, note, dedupe_key) values ($1, 'adjustment', 6000, 'test credit', $2)",
      [credited.companyId, `test-adjust-${credited.companyId}`],
    );
    const request = await makeRequest({ limit: 1, named: [credited] });
    const result = await purchase({ ...actorOf(credited), groupId: request.groupId, idempotencyKey: idem() });
    expect(result.ok).toBe(true);
    const attempt = await pool().query("select credit_applied_cents, card_amount_cents, payment_ref, id from purchase_attempts where group_id = $1", [request.groupId]);
    expect(attempt.rows[0]).toMatchObject({ credit_applied_cents: 5000, card_amount_cents: 0, payment_ref: `credit_${attempt.rows[0].id}` });
    expect((await pool().query("select 1 from payment_charges where attempt_id = $1", [attempt.rows[0].id])).rowCount).toBe(0);
  });

  it("re-runs the matcher after a coverage change and retries once", async () => {
    const request = await makeRequest({ limit: 2, named: [mover] });
    // A new rule bumps coverage_version: the snapshot is stale but the move still matches.
    await pool().query("insert into coverage_rules (company_id, kind, label, move_types) values ($1, 'include', 'Interstate', '{interstate}')", [mover.companyId]);
    const result = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: idem() });
    expect(result.ok).toBe(true);
    const snapshot = await pool().query(
      "select e.coverage_version = c.coverage_version as fresh, e.named_in_consent from lead_eligibility e join companies c on c.id = e.company_id where e.group_id = $1",
      [request.groupId],
    );
    expect(snapshot.rows[0]).toEqual({ fresh: true, named_in_consent: true });

    // Now exclude Texas: the stale snapshot no longer matches, the purchase is refused and the
    // request leaves the list.
    const blocked = await makeRequest({ limit: 2, named: [mover] });
    const rule = await pool().query<{ id: string }>("insert into coverage_rules (company_id, kind, label) values ($1, 'exclude', 'No Texas') returning id", [mover.companyId]);
    await pool().query("insert into coverage_rule_locations (rule_id, side, level, value) values ($1, 'origin', 'state', 'TX')", [rule.rows[0]!.id]);
    expect((await listAvailable(actorOf(mover))).some((l) => l.groupId === blocked.groupId)).toBe(false);
    const refused = await purchase({ ...actorOf(mover), groupId: blocked.groupId, idempotencyKey: idem() });
    expect(refused).toMatchObject({ ok: false, code: "eligibility_stale" });
    await pool().query("delete from coverage_rules where id = $1", [rule.rows[0]!.id]);
  });

  it("releases the reservation when the card is declined", async () => {
    const request = await makeRequest({ limit: 1, named: [rival] });
    const declining: PaymentsProvider = {
      name: "demo",
      charge: async () => ({ status: "failed", code: "card_declined", message: "The card was declined. No charge was made and nothing was shared.", providerRef: null }),
      refund: demoPaymentsProvider.refund,
    };
    const result = await purchase({ ...actorOf(rival), groupId: request.groupId, idempotencyKey: idem() }, { provider: declining });
    expect(result).toMatchObject({ ok: false, code: "payment_failed" });
    expect((await pool().query("select status from purchase_attempts where group_id = $1", [request.groupId])).rows[0].status).toBe("failed");
    expect((await pool().query("select c.status, c.failure_code from payment_charges c join purchase_attempts a on a.id = c.attempt_id where a.group_id = $1", [request.groupId])).rows[0]).toEqual({ status: "failed", failure_code: "card_declined" });
    // The request is still available to buy.
    expect((await listAvailable(actorOf(rival))).some((l) => l.groupId === request.groupId)).toBe(true);
  });

  it("refunds the payment and discloses nothing when the consumer withdraws during payment", async () => {
    const request = await makeRequest({ limit: 1, named: [rival] });
    const withdrawing: PaymentsProvider = {
      name: "demo",
      charge: async (input) => {
        await getPool().query("select withdraw_lead_group($1)", [input.groupId]);
        return { status: "succeeded", providerRef: `demo_${input.attemptId}` };
      },
      refund: demoPaymentsProvider.refund,
    };
    const result = await purchase({ ...actorOf(rival), groupId: request.groupId, idempotencyKey: idem() }, { provider: withdrawing });
    expect(result).toMatchObject({ ok: false, code: "refunded" });
    const refund = await pool().query("select r.status, r.amount_cents, r.reason, r.provider_refund_id from payment_refunds r join purchase_attempts a on a.id = r.attempt_id where a.group_id = $1", [request.groupId]);
    expect(refund.rows[0]).toMatchObject({ status: "succeeded", amount_cents: 8800, reason: "slot_unavailable" });
    expect((await pool().query("select 1 from purchases where group_id = $1", [request.groupId])).rowCount).toBe(0);
    expect((await pool().query("select * from lead_contact_for_company($1, $2)", [request.groupId, rival.companyId])).rowCount).toBe(0);
  });

  it("lets agents buy only with the purchase toggle", async () => {
    const request = await makeRequest({ limit: 2, named: [mover] });
    const agent = await makeMember(mover, "agent", false);
    const refused = await purchase({ ...actorOf(mover, agent), groupId: request.groupId, idempotencyKey: idem() });
    expect(refused).toMatchObject({ ok: false, code: "not_allowed" });
    const buyer = await makeMember(mover, "agent", true);
    const bought = await purchase({ ...actorOf(mover, buyer), groupId: request.groupId, idempotencyKey: idem() });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    // The agent's purchase is assigned to the agent, so it appears in their CRM.
    const crm = await withCompany(mover.companyId, (c) => c.query("select assignee_user_id from crm_records where purchase_id = $1", [bought.purchaseId]));
    expect(crm.rows[0].assignee_user_id).toBe(buyer);
  });

  it("refuses movers the consumer didn't name", async () => {
    const outsider = await makeCompany({ name: "Purchase Unnamed Movers" });
    await addDemoCard(outsider);
    const request = await makeRequest({ limit: 2, named: [mover], notNamed: [outsider] });
    const result = await purchase({ ...actorOf(outsider), groupId: request.groupId, idempotencyKey: idem() });
    expect(result).toMatchObject({ ok: false, code: "not_eligible_for_lead" });
  });
});

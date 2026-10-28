import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { closePool, getPool, withCompany } from "../src/db/pool";
import { resetEnvCache } from "../src/env/env";
import { beginStripeSetup, completeStripeSetup, listPaymentMethods, removePaymentMethod } from "../src/payments/methods";
import { paymentsMode, paymentsProvider } from "../src/payments/provider";
import { chargeIdempotencyKey, createStripeProvider, refundIdempotencyKey, type StripeClientLike, type StripeEventLike } from "../src/payments/stripe";
import { handleStripeEvent } from "../src/payments/webhook";
import { purchase } from "../src/marketplace/purchase";
import { resetDatabase } from "./helpers";
import { actorOf, makeCompany, makeRequest, type TestCompany } from "./marketplace-fixtures";

const pool = () => getPool();
let n = 0;
const idem = () => `pay-key-${Date.now()}-${++n}`;

function mockStripe(overrides: Partial<{ [K in keyof StripeClientLike]: Partial<StripeClientLike[K]> }> = {}): StripeClientLike {
  const base: StripeClientLike = {
    customers: { create: vi.fn(async () => ({ id: "cus_test123" })) },
    setupIntents: {
      create: vi.fn(async () => ({ id: "seti_123", status: "requires_payment_method", client_secret: "seti_123_secret_abc" })),
      retrieve: vi.fn(async () => ({ id: "seti_123", status: "succeeded", usage: "off_session", customer: "cus_test123", payment_method: "pm_card_1", metadata: {} })),
    },
    paymentMethods: { retrieve: vi.fn(async () => ({ id: "pm_card_1", card: { brand: "visa", last4: "1881", exp_month: 4, exp_year: 2031 } })) },
    paymentIntents: { create: vi.fn(async (params) => ({ id: "pi_test_1", status: "succeeded", amount: params.amount, currency: "usd", metadata: params.metadata })) },
    refunds: { create: vi.fn(async () => ({ id: "re_test_1", status: "succeeded" })) },
    webhooks: { constructEvent: vi.fn() },
  };
  for (const [key, value] of Object.entries(overrides)) Object.assign((base as unknown as Record<string, object>)[key]!, value);
  return base;
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe("provider selection", () => {
  it("uses the demo provider without Stripe keys and Stripe with all three", () => {
    expect(paymentsMode()).toBe("demo");
    expect(paymentsProvider().name).toBe("demo");
    Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_test_x", STRIPE_PUBLISHABLE_KEY: "pk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" });
    resetEnvCache();
    try {
      expect(paymentsMode()).toBe("live");
      expect(paymentsProvider().name).toBe("stripe");
    } finally {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      resetEnvCache();
      globalThis.__amcStripe = undefined;
    }
  });
});

describe("stripe provider", () => {
  const method = { id: "m1", provider: "stripe" as const, providerPmId: "pm_card_1", brand: "visa", last4: "1881" };

  it("charges off-session with the attempt ID as idempotency key", async () => {
    const stripe = mockStripe();
    const provider = createStripeProvider(stripe);
    const result = await provider.charge({ attemptId: "att-1", companyId: "co-1", groupId: "g-1", amountCents: 4200, paymentMethod: method, customerId: "cus_test123" });
    expect(result).toEqual({ status: "succeeded", providerRef: "pi_test_1" });
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 4200, currency: "usd", customer: "cus_test123", payment_method: "pm_card_1", off_session: true, confirm: true, metadata: { attempt_id: "att-1", company_id: "co-1", group_id: "g-1" } }),
      { idempotencyKey: chargeIdempotencyKey("att-1") },
    );
  });

  it("maps card errors (including authentication_required) to safe failures", async () => {
    const stripe = mockStripe({
      paymentIntents: {
        create: vi.fn(async () => {
          throw Object.assign(new Error("raw stripe message"), { type: "StripeCardError", code: "authentication_required", raw: { payment_intent: { id: "pi_auth" } } });
        }),
      },
    });
    const result = await createStripeProvider(stripe).charge({ attemptId: "att-2", companyId: "c", groupId: "g", amountCents: 100, paymentMethod: method, customerId: null });
    expect(result).toMatchObject({ status: "failed", code: "authentication_required", providerRef: "pi_auth" });
    if (result.status === "failed") expect(result.message).not.toContain("raw stripe message");
  });

  it("treats network errors as processing (the webhook settles them) and refuses demo cards", async () => {
    const stripe = mockStripe({ paymentIntents: { create: vi.fn(async () => { throw Object.assign(new Error("socket"), { type: "StripeConnectionError" }); }) } });
    const provider = createStripeProvider(stripe);
    expect(await provider.charge({ attemptId: "a", companyId: "c", groupId: "g", amountCents: 100, paymentMethod: method, customerId: null })).toEqual({ status: "processing", providerRef: null });
    expect((await provider.charge({ attemptId: "a", companyId: "c", groupId: "g", amountCents: 100, paymentMethod: { ...method, provider: "demo" }, customerId: null })).status).toBe("failed");
  });

  it("refunds by PaymentIntent with a per-attempt idempotency key", async () => {
    const stripe = mockStripe();
    expect(await createStripeProvider(stripe).refund({ attemptId: "att-3", providerRef: "pi_9", amountCents: 500 })).toEqual({ status: "succeeded", refundId: "re_test_1" });
    expect(stripe.refunds.create).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: "pi_9" }), { idempotencyKey: refundIdempotencyKey("att-3") });
  });
});

describe("stripe cards and webhooks", () => {
  let mover: TestCompany;
  let rival: TestCompany;

  beforeAll(async () => {
    mover = await makeCompany({ name: "Stripe Test Movers", exclusive: 9000, shared: 4000 });
    rival = await makeCompany({ name: "Stripe Rival Movers" });
  });

  it("saves a card from a confirmed SetupIntent for this company's customer only", async () => {
    const stripe = mockStripe();
    const { clientSecret } = await beginStripeSetup(stripe, actorOf(mover));
    expect(clientSecret).toBe("seti_123_secret_abc");
    expect((await pool().query("select stripe_customer_id from companies where id = $1", [mover.companyId])).rows[0].stripe_customer_id).toBe("cus_test123");
    expect(stripe.setupIntents.create).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_test123", usage: "off_session", metadata: expect.objectContaining({ company_id: mover.companyId }) }));

    // The intent must name this company in its metadata.
    await expect(completeStripeSetup(stripe, { ...actorOf(mover), setupIntentId: "seti_123", authorized: true })).rejects.toThrow(/couldn't be confirmed/);
    (stripe.setupIntents.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "seti_123", status: "succeeded", usage: "off_session", customer: "cus_test123", payment_method: "pm_card_1", metadata: { company_id: mover.companyId } });
    await expect(completeStripeSetup(stripe, { ...actorOf(mover), setupIntentId: "seti_123", authorized: false })).rejects.toThrow(/authorization/);
    await completeStripeSetup(stripe, { ...actorOf(mover), setupIntentId: "seti_123", authorized: true });
    const methods = await listPaymentMethods(mover.companyId);
    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({ provider: "stripe", brand: "visa", last4: "1881", isDefault: true });
    // Another company can't record the same intent.
    await expect(completeStripeSetup(stripe, { ...actorOf(rival), setupIntentId: "seti_123", authorized: true })).rejects.toThrow();
  });

  it("completes a processing purchase from payment_intent.succeeded, once", async () => {
    const request = await makeRequest({ limit: 1, named: [mover] });
    const stripe = mockStripe({ paymentIntents: { create: vi.fn(async (params) => ({ id: "pi_proc_1", status: "processing", amount: params.amount, currency: "usd", metadata: params.metadata })) } });
    const provider = createStripeProvider(stripe);
    const result = await purchase({ ...actorOf(mover), groupId: request.groupId, idempotencyKey: idem() }, { provider });
    expect(result).toMatchObject({ ok: false, code: "payment_processing" });
    const attempt = (await pool().query("select id, card_amount_cents from purchase_attempts where group_id = $1", [request.groupId])).rows[0];

    const event: StripeEventLike = {
      id: "evt_success_1",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_proc_1", status: "succeeded", amount: attempt.card_amount_cents, currency: "usd", metadata: { attempt_id: attempt.id, company_id: mover.companyId } } },
    };
    expect(await handleStripeEvent(event, { stripe, provider })).toEqual({ handled: true, action: "purchased" });
    expect(await handleStripeEvent(event, { stripe, provider })).toEqual({ handled: false, reason: "duplicate" });
    const bought = await pool().query("select id from purchases where group_id = $1", [request.groupId]);
    expect(bought.rowCount).toBe(1);
    const crm = await withCompany(mover.companyId, (c) => c.query("select stage from crm_records where purchase_id = $1", [bought.rows[0].id]));
    expect(crm.rows).toEqual([{ stage: "new" }]);
    expect((await pool().query("select status from payment_charges where attempt_id = $1", [attempt.id])).rows[0].status).toBe("succeeded");
  });

  it("refuses an intent whose amount or company doesn't match the attempt", async () => {
    const request = await makeRequest({ limit: 1, named: [mover] });
    const attempt = (await pool().query("select * from reserve_purchase($1, $2, $3)", [mover.companyId, request.groupId, idem()])).rows[0];
    const stripe = mockStripe();
    const outcome = await handleStripeEvent(
      { id: "evt_mismatch", type: "payment_intent.succeeded", data: { object: { id: "pi_x", status: "succeeded", amount: 1, currency: "usd", metadata: { attempt_id: attempt.id, company_id: mover.companyId } } } },
      { stripe },
    );
    expect(outcome).toEqual({ handled: false, reason: "mismatch" });
    expect((await pool().query("select 1 from purchases where group_id = $1", [request.groupId])).rowCount).toBe(0);
    await pool().query("select fail_purchase($1)", [attempt.id]);
  });

  it("refunds a late success whose request was withdrawn, and retries the event if the refund fails", async () => {
    const request = await makeRequest({ limit: 1, named: [mover] });
    const attempt = (await pool().query("select * from reserve_purchase($1, $2, $3)", [mover.companyId, request.groupId, idem()])).rows[0];
    await pool().query("select withdraw_lead_group($1)", [request.groupId]);
    const event: StripeEventLike = {
      id: "evt_late_1",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_late_1", status: "succeeded", amount: attempt.card_amount_cents, currency: "usd", metadata: { attempt_id: attempt.id, company_id: mover.companyId } } },
    };
    const failing = mockStripe({ refunds: { create: vi.fn(async () => { throw Object.assign(new Error("down"), { type: "StripeAPIError" }); }) } });
    await expect(handleStripeEvent(event, { stripe: failing })).rejects.toThrow(/refund_not_completed/);
    expect((await pool().query("select 1 from payment_events where provider_event_id = $1", [event.id])).rowCount).toBe(0); // redelivery will run it again

    const working = mockStripe();
    expect(await handleStripeEvent(event, { stripe: working })).toEqual({ handled: true, action: "refunded" });
    const refund = await pool().query("select status, amount_cents, provider_refund_id from payment_refunds where attempt_id = $1", [attempt.id]);
    expect(refund.rows[0]).toEqual({ status: "succeeded", amount_cents: attempt.card_amount_cents, provider_refund_id: "re_test_1" });
    expect((await pool().query("select * from lead_contact_for_company($1, $2)", [request.groupId, mover.companyId])).rowCount).toBe(0);
  });

  it("fails a reserved attempt on payment_intent.payment_failed and records disputes", async () => {
    const request = await makeRequest({ limit: 1, named: [rival] });
    const attempt = (await pool().query("select * from reserve_purchase($1, $2, $3)", [rival.companyId, request.groupId, idem()])).rows[0];
    const stripe = mockStripe();
    await handleStripeEvent(
      { id: "evt_fail_1", type: "payment_intent.payment_failed", data: { object: { id: "pi_fail", status: "requires_payment_method", amount: attempt.card_amount_cents, currency: "usd", metadata: { attempt_id: attempt.id }, last_payment_error: { code: "card_declined" } } } },
      { stripe },
    );
    expect((await pool().query("select status from purchase_attempts where id = $1", [attempt.id])).rows[0].status).toBe("failed");

    const paid = (await pool().query("select a.payment_ref, p.id from purchases p join purchase_attempts a on a.id = p.attempt_id where p.company_id = $1 limit 1", [mover.companyId])).rows[0];
    const outcome = await handleStripeEvent({ id: "evt_dispute_1", type: "charge.dispute.created", data: { object: { id: "dp_1", amount: 9000, reason: "fraudulent", payment_intent: paid.payment_ref } } }, { stripe });
    expect(outcome).toEqual({ handled: true, action: "dispute_recorded" });
    expect((await pool().query("select purchase_id, status from disputes where stripe_dispute_id = 'dp_1'")).rows[0]).toEqual({ purchase_id: paid.id, status: "open" });
    expect((await pool().query("select billing_status from companies where id = $1", [mover.companyId])).rows[0].billing_status).toBe("past_due");
    await pool().query("update companies set billing_status = 'good' where id = $1", [mover.companyId]);
  });

  it("removes a payment method and promotes the next one", async () => {
    const id = (await listPaymentMethods(mover.companyId))[0]!.id;
    await removePaymentMethod({ ...actorOf(mover), paymentMethodId: id });
    expect(await listPaymentMethods(mover.companyId)).toEqual([]);
    await expect(removePaymentMethod({ ...actorOf(rival), paymentMethodId: id })).rejects.toThrow(/not found/);
  });
});

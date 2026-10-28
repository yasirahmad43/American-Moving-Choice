/**
 * Stripe webhook handling (lead lifecycle §7 items 3, 6 and 7). The route verifies the signature;
 * this module dedupes the event with record_payment_event and acts on it:
 *
 *   payment_intent.succeeded       complete_purchase (refund when it returns null), then finalize
 *   payment_intent.payment_failed  fail_purchase for an attempt still reserved
 *   charge.dispute.created         record the dispute and pause purchasing (billing past_due)
 *
 * When processing throws, the event's dedupe row is removed so Stripe's redelivery runs it again;
 * every step is idempotent, so a partial first run is safe to repeat.
 */
import { audit } from "../audit/audit";
import { getPool, isUuid } from "../db/pool";
import { settleSucceededCharge, type AttemptRow } from "../marketplace/purchase";
import { createStripeProvider, idOf, type StripeClientLike, type StripeEventLike, type StripePaymentIntentLike } from "./stripe";
import type { PaymentsProvider } from "./types";

export type WebhookOutcome =
  | { handled: true; action: string }
  | { handled: false; reason: "duplicate" | "ignored" | "unknown_attempt" | "mismatch" };

interface DisputeLike {
  id: string;
  amount: number;
  reason?: string | null;
  payment_intent?: string | { id: string } | null;
}

async function attemptForIntent(intent: StripePaymentIntentLike): Promise<AttemptRow | null> {
  const attemptId = intent.metadata?.attempt_id;
  if (!isUuid(attemptId)) return null;
  const found = await getPool().query<AttemptRow>("select * from purchase_attempts where id = $1", [attemptId]);
  return found.rows[0] ?? null;
}

async function onSucceeded(intent: StripePaymentIntentLike, provider: PaymentsProvider): Promise<WebhookOutcome> {
  const attempt = await attemptForIntent(intent);
  if (!attempt) return { handled: false, reason: "unknown_attempt" };
  const charge = await getPool().query<{ provider_ref: string | null }>("select provider_ref from payment_charges where attempt_id = $1", [attempt.id]);
  const knownRef = charge.rows[0]?.provider_ref;
  // The intent must be the one charged for this attempt, for its company, for the card amount.
  if (
    intent.metadata?.company_id !== attempt.company_id ||
    intent.currency !== "usd" ||
    intent.amount !== attempt.card_amount_cents ||
    (knownRef && knownRef !== intent.id)
  ) {
    await audit({
      actorType: "system",
      actorId: "stripe_webhook",
      companyId: attempt.company_id,
      action: "payment.webhook_mismatch",
      entity: "purchase_attempt",
      entityId: attempt.id,
      after: { payment_intent: intent.id, amount: intent.amount },
    });
    return { handled: false, reason: "mismatch" };
  }
  if (!charge.rowCount) {
    await getPool().query(
      `insert into payment_charges (attempt_id, company_id, provider, amount_cents, status, provider_ref)
       values ($1, $2, 'stripe', $3, 'processing', $4) on conflict (attempt_id) do nothing`,
      [attempt.id, attempt.company_id, attempt.card_amount_cents, intent.id],
    );
  }
  const settled = await settleSucceededCharge(attempt, intent.id, provider);
  if (settled.state === "refunded") {
    // A failed refund must not be acknowledged: throw so the event is retried.
    const refund = await getPool().query<{ status: string }>("select status from payment_refunds where attempt_id = $1", [attempt.id]);
    if (refund.rows[0]?.status !== "succeeded") throw new Error("refund_not_completed");
  }
  return { handled: true, action: settled.state };
}

async function onFailed(intent: StripePaymentIntentLike): Promise<WebhookOutcome> {
  const attempt = await attemptForIntent(intent);
  if (!attempt) return { handled: false, reason: "unknown_attempt" };
  const code = intent.last_payment_error?.code;
  await getPool().query(
    `update payment_charges set status = 'failed', failure_code = $2, provider_ref = coalesce(provider_ref, $3)
     where attempt_id = $1 and status <> 'succeeded'`,
    [attempt.id, code && /^[a-z][a-z0-9_]*$/.test(code) ? code : "payment_failed", intent.id],
  );
  await getPool().query("select fail_purchase($1)", [attempt.id]);
  return { handled: true, action: "failed" };
}

async function onDispute(dispute: DisputeLike): Promise<WebhookOutcome> {
  const intentId = idOf(dispute.payment_intent);
  if (!intentId) return { handled: false, reason: "unknown_attempt" };
  const found = await getPool().query<{ company_id: string; purchase_id: string | null }>(
    `select a.company_id, p.id as purchase_id from purchase_attempts a
     left join purchases p on p.attempt_id = a.id where a.payment_ref = $1`,
    [intentId],
  );
  const row = found.rows[0];
  if (!row) return { handled: false, reason: "unknown_attempt" };
  await getPool().query(
    `insert into disputes (stripe_dispute_id, purchase_id, company_id, amount_cents, reason, status)
     values ($1, $2, $3, $4, $5, 'open') on conflict (stripe_dispute_id) do nothing`,
    [dispute.id, row.purchase_id, row.company_id, dispute.amount, dispute.reason ?? null],
  );
  // Shared pricing §6: pause new purchases for the company while the dispute is open.
  const paused = await getPool().query("update companies set billing_status = 'past_due' where id = $1 and billing_status = 'good'", [row.company_id]);
  await audit({
    actorType: "system",
    actorId: "stripe_webhook",
    companyId: row.company_id,
    action: "payment.dispute_opened",
    entity: "dispute",
    entityId: dispute.id,
    after: { purchase_id: row.purchase_id, amount_cents: dispute.amount, purchasing_paused: Boolean(paused.rowCount) },
  });
  return { handled: true, action: "dispute_recorded" };
}

/** Processes one verified Stripe event. */
export async function handleStripeEvent(event: StripeEventLike, deps: { stripe: StripeClientLike; provider?: PaymentsProvider }): Promise<WebhookOutcome> {
  if (typeof event.id !== "string" || !event.id) return { handled: false, reason: "ignored" };
  const pool = getPool();
  const fresh = await pool.query<{ fresh: boolean }>("select record_payment_event($1) as fresh", [event.id]);
  if (!fresh.rows[0]?.fresh) return { handled: false, reason: "duplicate" };
  const provider = deps.provider ?? createStripeProvider(deps.stripe);
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        return await onSucceeded(event.data.object as StripePaymentIntentLike, provider);
      case "payment_intent.payment_failed":
        return await onFailed(event.data.object as StripePaymentIntentLike);
      case "charge.dispute.created":
        return await onDispute(event.data.object as DisputeLike);
      default:
        return { handled: false, reason: "ignored" };
    }
  } catch (error) {
    await pool.query("delete from payment_events where provider_event_id = $1", [event.id]);
    throw error;
  }
}

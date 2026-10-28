/**
 * Purchase orchestration around the 001 functions (lead lifecycle §7; build plan §7.4):
 *
 *   reserve_purchase → (card remainder > 0) provider charge with the attempt ID as idempotency key
 *   → complete_purchase → on null, refund the charge and record it
 *   → CRM record (stage new), contact-access log, consumer notice, audit.
 *
 * Money and disclosure happen only inside the database functions: this module never computes a
 * charge or writes a ledger entry. A stale eligibility snapshot (eligibility_stale) re-runs the
 * matcher for that request and retries once. finalizePurchase is idempotent, so the synchronous
 * path and the Stripe webhook can both call it.
 */
import { audit } from "../audit/audit";
import { getPool, isTransientPgError, isUuid, raisedMessage, withCompany, type Queryable } from "../db/pool";
import { env } from "../env/env";
import { enqueueEmail } from "../outbox/outbox";
import { defaultPaymentMethod } from "../payments/methods";
import { paymentsProvider } from "../payments/provider";
import { demoPaymentsProvider } from "../payments/demo";
import type { PaymentsProvider, ProviderName } from "../payments/types";
import { refreshEligibility } from "./eligibility";
import { isPurchaseErrorCode, purchaseErrorMessage, type PurchaseErrorCode } from "./messages";
import { can, resolveActor } from "./permissions";

export interface AttemptRow {
  id: string;
  group_id: string;
  company_id: string;
  idempotency_key: string;
  status: "reserved" | "succeeded" | "failed" | "expired";
  lead_type: "exclusive" | "shared";
  position: number;
  list_price_cents: number;
  charge_cents: number;
  credit_applied_cents: number;
  card_amount_cents: number;
  payment_ref: string | null;
  expires_at: Date;
}

export type PurchaseOutcome =
  | { ok: true; purchaseId: string; replayed: boolean }
  | { ok: false; code: PurchaseErrorCode; message: string; purchaseId?: string };

const fail = (code: PurchaseErrorCode, message?: string, purchaseId?: string): PurchaseOutcome => ({
  ok: false,
  code,
  message: message ?? purchaseErrorMessage(code),
  ...(purchaseId ? { purchaseId } : {}),
});

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,100}$/;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PurchaseDeps {
  provider?: PaymentsProvider;
  /** Waits between purchase_in_progress retries (tests shorten it). */
  busyRetryDelayMs?: number;
}

async function reserve(db: Queryable, companyId: string, groupId: string, key: string): Promise<AttemptRow> {
  const result = await db.query<AttemptRow>("select * from reserve_purchase($1, $2, $3)", [companyId, groupId, key]);
  return result.rows[0]!;
}

/**
 * Buys a request group for the user's company. The caller passes the signed-in user and the
 * company from their session; the membership, role and purchase toggle are re-read here.
 */
export async function purchase(
  input: { userId: string; companyId: string; groupId: string; idempotencyKey: string; ip?: string | null },
  deps: PurchaseDeps = {},
): Promise<PurchaseOutcome> {
  if (!isUuid(input.groupId)) return fail("lead_not_found");
  if (!IDEMPOTENCY_KEY.test(input.idempotencyKey)) return fail("unknown");
  const pool = getPool();
  const actor = await resolveActor(pool, input);
  if (!can(actor, "marketplace.purchase")) return fail("not_allowed");
  const provider = deps.provider ?? paymentsProvider();

  // 1. Reserve (idempotent per company and key).
  let attempt: AttemptRow | null = null;
  let staleRetried = false;
  let busyTries = 0;
  while (!attempt) {
    try {
      attempt = await reserve(pool, actor.companyId, input.groupId, input.idempotencyKey);
    } catch (error) {
      const code = raisedMessage(error);
      if (code === "eligibility_stale" && !staleRetried) {
        staleRetried = true;
        const refreshed = await refreshEligibility(actor.companyId, input.groupId);
        if (!refreshed.refreshed) return fail("eligibility_stale");
        continue;
      }
      // A concurrent reservation or settlement holds the row locks: wait briefly and try again. A
      // deadlock or serialization failure between two callers is the same situation to the buyer
      // (nothing was reserved or charged), so it retries the same way and never surfaces as a crash.
      if ((code === "purchase_in_progress" || isTransientPgError(error)) && busyTries < 3) {
        busyTries++;
        await sleep(deps.busyRetryDelayMs ?? 700);
        continue;
      }
      if (isTransientPgError(error)) return fail("purchase_in_progress");
      if (code === "already_purchased" || code === "lead_unavailable" || code === "sold_out") {
        const existing = await pool.query<{ id: string }>("select id from purchases where group_id = $1 and company_id = $2", [input.groupId, actor.companyId]);
        // reserve_purchase checks availability before "already purchased": a request this company
        // bought that is now sold out reports lead_unavailable, so look for its own purchase first.
        if (existing.rows[0]) return fail("already_purchased", undefined, existing.rows[0].id);
        return fail(code);
      }
      // The key was first used for another request (180): a client bug, never a success for the
      // wrong lead. Nothing was reserved or charged.
      if (code === "idempotency_key_reused") return fail("unknown");
      if (code && isPurchaseErrorCode(code)) return fail(code);
      console.error(`[purchase] reserve failed: ${error instanceof Error ? error.name : "error"} ${(error as { code?: string }).code ?? ""}`);
      throw error;
    }
  }
  // Idempotency is scoped to (company, key, request): belt and braces behind the database check.
  if (attempt.group_id !== input.groupId) return fail("unknown");

  // A replayed key returns the earlier attempt.
  if (attempt.status === "succeeded") {
    const done = await pool.query<{ id: string }>("select id from purchases where attempt_id = $1", [attempt.id]);
    const purchaseId = done.rows[0]?.id;
    if (!purchaseId) return fail("unknown");
    await finalizePurchase(purchaseId);
    return { ok: true, purchaseId, replayed: true };
  }
  if (attempt.status !== "reserved") return fail("attempt_closed");

  await audit(
    {
      actorType: "user",
      actorId: actor.userId,
      companyId: actor.companyId,
      action: "purchase.reserve",
      entity: "purchase_attempt",
      entityId: attempt.id,
      after: { group_id: attempt.group_id, lead_type: attempt.lead_type, position: attempt.position, charge_cents: attempt.charge_cents, credit_applied_cents: attempt.credit_applied_cents, card_amount_cents: attempt.card_amount_cents },
      ip: actor.ip ?? null,
    },
    pool,
  );

  // 2. Charge the card remainder, if any.
  let providerRef: string;
  let chargedBy: ProviderName | null = null;
  if (attempt.card_amount_cents > 0) {
    const method = await defaultPaymentMethod(pool, actor.companyId, provider.name);
    if (!method) {
      await pool.query("select fail_purchase($1)", [attempt.id]);
      return fail("no_payment_method");
    }
    const customer = await pool.query<{ stripe_customer_id: string | null }>("select stripe_customer_id from companies where id = $1", [actor.companyId]);
    await pool.query(
      `insert into payment_charges (attempt_id, company_id, provider, payment_method_id, amount_cents, status)
       values ($1, $2, $3, $4, $5, 'processing') on conflict (attempt_id) do nothing`,
      [attempt.id, actor.companyId, provider.name, method.id, attempt.card_amount_cents],
    );
    const charge = await provider.charge({
      attemptId: attempt.id,
      companyId: actor.companyId,
      groupId: attempt.group_id,
      amountCents: attempt.card_amount_cents,
      paymentMethod: method,
      customerId: customer.rows[0]?.stripe_customer_id ?? null,
    });
    if (charge.status === "failed") {
      await pool.query(
        "update payment_charges set status = 'failed', failure_code = $2, provider_ref = coalesce($3, provider_ref) where attempt_id = $1",
        [attempt.id, charge.code, charge.providerRef],
      );
      await pool.query("select fail_purchase($1)", [attempt.id]);
      return fail("payment_failed", charge.message);
    }
    if (charge.status === "processing") {
      if (charge.providerRef) await pool.query("update payment_charges set provider_ref = $2 where attempt_id = $1", [attempt.id, charge.providerRef]);
      return fail("payment_processing");
    }
    providerRef = charge.providerRef;
    chargedBy = provider.name;
  } else {
    providerRef = `credit_${attempt.id}`; // fully funded by account credit: no provider charge
  }

  // 3. Complete (or refund when the slot can no longer be honoured).
  const settled = await settleSucceededCharge(attempt, providerRef, chargedBy ? providerFor(chargedBy, provider) : null);
  if (settled.state === "purchased") return { ok: true, purchaseId: settled.purchaseId, replayed: false };
  return fail(settled.state === "refunded" ? "refunded" : "lead_unavailable");
}

function providerFor(name: ProviderName, current: PaymentsProvider): PaymentsProvider {
  if (current.name === name) return current;
  if (name === "demo") return demoPaymentsProvider;
  return paymentsProvider();
}

export type SettleResult = { state: "purchased"; purchaseId: string } | { state: "refunded" } | { state: "unavailable" };

/**
 * After the provider confirmed the charge (or for a credit-only attempt): complete_purchase, then
 * finalize, or refund when complete_purchase returns null. Idempotent; an attempt whose charge was
 * already refunded is never completed afterwards.
 */
export async function settleSucceededCharge(attempt: Pick<AttemptRow, "id" | "company_id" | "card_amount_cents">, providerRef: string, provider: PaymentsProvider | null): Promise<SettleResult> {
  const pool = getPool();
  const refunded = await pool.query("select 1 from payment_refunds where attempt_id = $1 and status = 'succeeded'", [attempt.id]);
  if (refunded.rowCount) return { state: "refunded" };

  const completed = await pool.query<{ id: string | null }>("select id from complete_purchase($1, $2)", [attempt.id, providerRef]);
  const purchaseId = completed.rows[0]?.id ?? null;
  if (attempt.card_amount_cents > 0) {
    await pool.query("update payment_charges set status = 'succeeded', provider_ref = $2 where attempt_id = $1", [attempt.id, providerRef]);
  }
  if (purchaseId) {
    await finalizePurchase(purchaseId);
    return { state: "purchased", purchaseId };
  }
  if (attempt.card_amount_cents > 0 && provider) {
    await refundUnhonoured(attempt, providerRef, provider);
    return { state: "refunded" };
  }
  return { state: "unavailable" };
}

/**
 * Refunds a successful charge whose purchase could not be honoured (lead lifecycle §7 item 5). No
 * purchase exists, so there is no ledger entry: the refund is recorded in payment_refunds and the
 * audit log. Returns true when the refund succeeded (or had already).
 */
export async function refundUnhonoured(attempt: Pick<AttemptRow, "id" | "company_id" | "card_amount_cents">, providerRef: string, provider: PaymentsProvider): Promise<boolean> {
  const pool = getPool();
  await pool.query(
    `insert into payment_refunds (attempt_id, company_id, provider, provider_ref, amount_cents, reason)
     values ($1, $2, $3, $4, $5, 'slot_unavailable') on conflict (attempt_id, reason) do nothing`,
    [attempt.id, attempt.company_id, provider.name, providerRef, attempt.card_amount_cents],
  );
  const existing = await pool.query<{ status: string }>("select status from payment_refunds where attempt_id = $1 and reason = 'slot_unavailable'", [attempt.id]);
  if (existing.rows[0]?.status === "succeeded") return true;
  const result = await provider.refund({ attemptId: attempt.id, providerRef, amountCents: attempt.card_amount_cents });
  if (result.status === "succeeded") {
    await pool.query(
      "update payment_refunds set status = 'succeeded', provider_refund_id = $2, error_code = null where attempt_id = $1 and reason = 'slot_unavailable'",
      [attempt.id, result.refundId],
    );
  } else {
    await pool.query("update payment_refunds set status = 'failed', error_code = $2 where attempt_id = $1 and reason = 'slot_unavailable'", [attempt.id, result.code]);
  }
  await audit(
    {
      actorType: "system",
      actorId: "purchase",
      companyId: attempt.company_id,
      action: result.status === "succeeded" ? "purchase.auto_refund" : "purchase.auto_refund_failed",
      entity: "purchase_attempt",
      entityId: attempt.id,
      after: { amount_cents: attempt.card_amount_cents, provider: provider.name, reason: "slot_unavailable" },
    },
    pool,
  );
  return result.status === "succeeded";
}

const LEAD_TYPE_LABEL = { exclusive: "exclusive", shared: "shared" } as const;

/** The consumer notice (build plan §7.2 "Notices"): one email per purchase naming the mover. */
export function purchaseNoticeText(input: {
  firstName: string;
  moverName: string;
  usdot: string | null;
  referenceCode: string;
  profileUrl: string | null;
}): { subject: string; body: string } {
  const usdot = input.usdot ? ` (USDOT ${input.usdot})` : "";
  const lines = [
    `Hi ${input.firstName},`,
    "",
    `${input.moverName}${usdot} received your moving request ${input.referenceCode} through American Moving Choice and may contact you about your move.`,
    "",
    `${input.moverName} paid American Moving Choice to receive your request. Movers pay us for the requests they choose to buy; you pay us nothing.`,
  ];
  if (input.profileUrl) lines.push("", `Mover profile: ${input.profileUrl}`);
  lines.push(
    "",
    "Changed your mind? Use the manage-request link in your confirmation email to stop new movers from receiving your request.",
  );
  return { subject: `${input.moverName} received your moving request`, body: lines.join("\n") };
}

/**
 * Everything after the purchase row exists: the CRM record (stage new, assigned to the buyer), its
 * first activity, the consumer notice, the contact-access log entry for that notice and the audit
 * entry. Runs inside withCompany (forced RLS) and does nothing when the CRM record already exists.
 */
export async function finalizePurchase(purchaseId: string): Promise<void> {
  const pool = getPool();
  const base = await pool.query<{ company_id: string; group_id: string; attempt_id: string; lead_type: "exclusive" | "shared"; position: number; charged_cents: number }>(
    "select company_id, group_id, attempt_id, lead_type, position, charged_cents from purchases where id = $1",
    [purchaseId],
  );
  const p = base.rows[0];
  if (!p) throw new Error("finalizePurchase: purchase not found");

  await withCompany(p.company_id, async (client) => {
    await client.query("select 1 from purchases where id = $1 for update", [purchaseId]); // one finalizer at a time
    const existing = await client.query("select 1 from crm_records where purchase_id = $1", [purchaseId]);
    if (existing.rowCount) return;

    // The buyer, from the reservation's audit entry (absent for purchases settled by a webhook
    // after the buyer left; the record is then unassigned).
    const buyer = await client.query<{ actor_id: string }>(
      `select a.actor_id from audit_log a
       join company_memberships m on m.user_id::text = a.actor_id and m.company_id = $2 and m.status = 'active'
       where a.entity = 'purchase_attempt' and a.entity_id = $1 and a.action = 'purchase.reserve'
       order by a.created_at limit 1`,
      [p.attempt_id, p.company_id],
    );
    const buyerId = buyer.rows[0]?.actor_id ?? null;

    const group = await client.query<{ sharing_limit: number }>("select sharing_limit from lead_groups where id = $1", [p.group_id]);
    const record = await client.query<{ id: string }>(
      `insert into crm_records (purchase_id, company_id, stage, assignee_user_id) values ($1, $2, 'new', $3) returning id`,
      [purchaseId, p.company_id, buyerId],
    );
    const recordId = record.rows[0]!.id;
    const limit = group.rows[0]?.sharing_limit ?? 1;
    await client.query(
      `insert into crm_activities (record_id, company_id, type, body, actor_user_id) values ($1, $2, 'purchased', $3, $4)`,
      [
        recordId,
        p.company_id,
        p.lead_type === "exclusive"
          ? "Bought this exclusive request."
          : `Bought this shared request as buyer ${p.position} of up to ${limit}.`,
        buyerId,
      ],
    );

    // Consumer notice. The address comes from lead_contact_for_company, which answers only for a
    // completed, disclosed purchase by this company.
    const contact = await client.query<{ first_name: string; email: string }>(
      "select first_name, email from lead_contact_for_company($1, $2)",
      [p.group_id, p.company_id],
    );
    const mover = await client.query<{ name: string; usdot_number: string | null; slug: string | null; reference_code: string | null }>(
      `select coalesce(cp.display_name, c.legal_name) as name, c.usdot_number, cp.slug,
              (select reference_code from leads where group_id = $2 and is_primary order by created_at limit 1) as reference_code
       from companies c left join company_profiles cp on cp.company_id = c.id where c.id = $1`,
      [p.company_id, p.group_id],
    );
    const to = contact.rows[0];
    const m = mover.rows[0];
    if (to && m) {
      const notice = purchaseNoticeText({
        firstName: to.first_name,
        moverName: m.name,
        usdot: m.usdot_number,
        referenceCode: m.reference_code ?? "",
        profileUrl: m.slug ? `${env().WEB_URL}/companies/${m.slug}/` : null,
      });
      await enqueueEmail(
        { to: to.email, template: "purchase_notice", subject: notice.subject, bodyText: notice.body, relatedType: "purchase", relatedId: purchaseId },
        client,
      );
      await client.query(
        "insert into contact_access_log (purchase_id, company_id, user_id, action) values ($1, $2, $3, 'notify')",
        [purchaseId, p.company_id, buyerId],
      );
    }

    await audit(
      {
        actorType: buyerId ? "user" : "system",
        actorId: buyerId ?? "purchase",
        companyId: p.company_id,
        action: "purchase.complete",
        entity: "purchase",
        entityId: purchaseId,
        after: { lead_type: LEAD_TYPE_LABEL[p.lead_type], position: p.position, charged_cents: p.charged_cents },
      },
      client,
    );
  });
}

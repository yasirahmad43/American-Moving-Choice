/**
 * Company billing (shared pricing §2, §6, §7, §9): credit balance, ledger history, purchases as
 * receipts, automatic refunds of unhonoured payments, and lead-quality claims. Nothing here moves
 * money: credits and refunds are decided by admins through refund_purchase (slice S7), and the
 * ledger is written only by the 001 functions.
 */
import { audit } from "../audit/audit";
import { getPool, isUniqueViolation, isUuid, tx, type Queryable } from "../db/pool";
import { getClaimWindowHours } from "../settings/settings";
import { assertCan, resolveActor } from "../marketplace/permissions";

export class BillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingError";
  }
}

/**
 * Quality-claim reasons. The qualifying list follows shared pricing §6 (invalid lead: disconnected
 * number, consumer never requested, fake data); the non-qualifying ones are the defaults in
 * implications §9.1 and the "how AMC makes money" draft (owner decision pending, shared pricing §9
 * item 5): AMC's revenue must not depend on whether or whom the consumer hires.
 */
export const CLAIM_REASONS = [
  { code: "disconnected_phone", label: "The phone number is disconnected or not in service", qualifies: true },
  { code: "never_requested", label: "The person says they never asked for moving quotes", qualifies: true },
  { code: "invalid_contact", label: "Both the phone number and the email are invalid (wrong number and bounced email)", qualifies: true },
  { code: "fake_data", label: "The name or details are clearly fake or test data", qualifies: true },
  { code: "no_answer_yet", label: "The customer hasn't answered yet", qualifies: false },
  { code: "hired_another_mover", label: "The customer chose another mover", qualifies: false },
  { code: "not_moving_or_price", label: "The customer decided not to move or found the price too high", qualifies: false },
] as const;

export type ClaimReasonCode = (typeof CLAIM_REASONS)[number]["code"];

export function claimReason(code: string) {
  return CLAIM_REASONS.find((r) => r.code === code) ?? null;
}

export const LEDGER_KIND_LABELS: Record<string, string> = {
  purchase_charge: "Request purchase",
  credit_spend: "Account credit used",
  sharing_credit: "Shared-request credit",
  quality_refund_credit: "Quality refund (credit)",
  cash_refund: "Refund to card",
  adjustment: "Adjustment",
};

/** Whether a ledger kind changes the credit balance (company_credit_balance in 001). */
export const affectsBalance = (kind: string) => ["credit_spend", "sharing_credit", "quality_refund_credit", "adjustment"].includes(kind);

export interface LedgerRow {
  id: string;
  kind: string;
  amountCents: number;
  purchaseId: string | null;
  note: string | null;
  createdAt: Date;
  route: string | null;
}

export interface ReceiptRow {
  purchaseId: string;
  purchasedAt: Date;
  leadType: "exclusive" | "shared";
  position: number;
  listPriceCents: number;
  chargedCents: number;
  creditAppliedCents: number;
  cardAmountCents: number;
  paymentRef: string | null;
  route: string;
  referenceCode: string | null;
  refundedAt: Date | null;
}

export interface ClaimRow {
  id: string;
  purchaseId: string;
  reason: string;
  status: string;
  decision: string | null;
  refundAmountCents: number | null;
  createdAt: Date;
  route: string;
}

export interface RefundRow {
  attemptId: string;
  amountCents: number;
  status: string;
  createdAt: Date;
}

export interface BillingOverview {
  balanceCents: number;
  heldCents: number;
  ledger: LedgerRow[];
  receipts: ReceiptRow[];
  claims: ClaimRow[];
  refunds: RefundRow[];
  claimWindowHours: number;
}

/** Payment-method references are shown masked: provider IDs stay out of the page. */
export function maskRef(ref: string | null): string | null {
  if (!ref) return null;
  if (ref.startsWith("credit_")) return "Account credit";
  if (ref.startsWith("demo_")) return `Demo ${ref.slice(-6)}`;
  return `…${ref.slice(-6)}`;
}

const ROUTE_SQL = `coalesce(l.origin_city, '') || ', ' || coalesce(l.origin_state, '') || ' to ' || coalesce(l.dest_city, '') || ', ' || coalesce(l.dest_state, '')`;

export async function getBillingOverview(input: { userId: string; companyId: string }, db: Queryable = getPool()): Promise<BillingOverview> {
  const actor = await resolveActor(db, input);
  assertCan(actor, "billing.view");
  const company = actor.companyId;
  const balance = await db.query<{ balance: number; held: number }>(
    `select coalesce((select balance_cents from company_credit_balance where company_id = $1), 0)::int as balance,
            coalesce((select sum(credit_applied_cents) from purchase_attempts where company_id = $1 and status = 'reserved'), 0)::int as held`,
    [company],
  );
  const ledger = await db.query<{ id: string; kind: string; amount_cents: number; purchase_id: string | null; note: string | null; created_at: Date; route: string | null }>(
    `select le.id::text, le.kind, le.amount_cents, le.purchase_id, le.note, le.created_at,
            case when p.id is null then null else ${ROUTE_SQL} end as route
     from ledger_entries le
     left join purchases p on p.id = le.purchase_id
     left join lateral (select origin_city, origin_state, dest_city, dest_state from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     where le.company_id = $1 order by le.created_at desc, le.id desc limit 200`,
    [company],
  );
  const receipts = await db.query<{
    id: string;
    created_at: Date;
    lead_type: "exclusive" | "shared";
    position: number;
    list_price_cents: number;
    charged_cents: number;
    credit_applied_cents: number;
    card_amount_cents: number;
    payment_ref: string | null;
    route: string;
    reference_code: string | null;
    refunded_at: Date | null;
  }>(
    `select p.id, p.created_at, p.lead_type, p.position, p.list_price_cents, p.charged_cents, a.credit_applied_cents, a.card_amount_cents,
            a.payment_ref, ${ROUTE_SQL} as route, l.reference_code, p.refunded_at
     from purchases p join purchase_attempts a on a.id = p.attempt_id
     join lateral (select origin_city, origin_state, dest_city, dest_state, reference_code from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     where p.company_id = $1 order by p.created_at desc limit 200`,
    [company],
  );
  const claims = await db.query<{ id: string; purchase_id: string; reason: string; status: string; decision: string | null; refund_amount_cents: number | null; created_at: Date; route: string }>(
    `select q.id, q.purchase_id, q.reason, q.status, q.decision, q.refund_amount_cents, q.created_at, ${ROUTE_SQL} as route
     from lead_quality_claims q join purchases p on p.id = q.purchase_id
     join lateral (select origin_city, origin_state, dest_city, dest_state from leads where group_id = p.group_id and is_primary order by created_at limit 1) l on true
     where q.company_id = $1 order by q.created_at desc limit 100`,
    [company],
  );
  const refunds = await db.query<{ attempt_id: string; amount_cents: number; status: string; created_at: Date }>(
    "select attempt_id, amount_cents, status, created_at from payment_refunds where company_id = $1 order by created_at desc limit 50",
    [company],
  );
  return {
    balanceCents: balance.rows[0]?.balance ?? 0,
    heldCents: balance.rows[0]?.held ?? 0,
    ledger: ledger.rows.map((r) => ({ id: r.id, kind: r.kind, amountCents: r.amount_cents, purchaseId: r.purchase_id, note: r.note, createdAt: r.created_at, route: r.route })),
    receipts: receipts.rows.map((r) => ({
      purchaseId: r.id,
      purchasedAt: r.created_at,
      leadType: r.lead_type,
      position: r.position,
      listPriceCents: r.list_price_cents,
      chargedCents: r.charged_cents,
      creditAppliedCents: r.credit_applied_cents,
      cardAmountCents: r.card_amount_cents,
      paymentRef: maskRef(r.payment_ref),
      route: r.route,
      referenceCode: r.reference_code,
      refundedAt: r.refunded_at,
    })),
    claims: claims.rows.map((r) => ({ id: r.id, purchaseId: r.purchase_id, reason: r.reason, status: r.status, decision: r.decision, refundAmountCents: r.refund_amount_cents, createdAt: r.created_at, route: r.route })),
    refunds: refunds.rows.map((r) => ({ attemptId: r.attempt_id, amountCents: r.amount_cents, status: r.status, createdAt: r.created_at })),
    claimWindowHours: await getClaimWindowHours(db),
  };
}

/**
 * Files a lead-quality claim on a purchase. Rejected up front: reasons that never qualify, a
 * missing description of the evidence, a refunded purchase, a closed claim window, and a second
 * claim on the same purchase. Admins decide claims (slice S7).
 */
export async function submitClaim(
  input: { userId: string; companyId: string; ip?: string | null },
  claim: { purchaseId: string; reason: string; evidence: string },
): Promise<string> {
  const reason = claimReason(claim.reason);
  if (!reason) throw new BillingError("Choose a reason for the claim.");
  if (!reason.qualifies) {
    throw new BillingError(`"${reason.label}" doesn't qualify for a quality refund: a request is paid for when you buy it, whatever the customer decides.`);
  }
  const evidence = claim.evidence.trim();
  if (evidence.length < 10) throw new BillingError("Describe your evidence, for example when you called and what happened, or the bounce message.");
  if (evidence.length > 2000) throw new BillingError("Keep the evidence under 2,000 characters.");
  if (!isUuid(claim.purchaseId)) throw new BillingError("That purchase was not found.");
  return tx(async (client) => {
    const actor = await resolveActor(client, input);
    assertCan(actor, "claims.submit", "Only owners, managers and billing members can file quality claims.");
    const purchase = await client.query<{ created_at: Date; refunded_at: Date | null; within: boolean }>(
      `select created_at, refunded_at, now() <= created_at + make_interval(hours => $3) as within
       from purchases where id = $1 and company_id = $2 for update`,
      [claim.purchaseId, actor.companyId, await getClaimWindowHours(client)],
    );
    const row = purchase.rows[0];
    if (!row) throw new BillingError("That purchase was not found.");
    if (row.refunded_at) throw new BillingError("This purchase has already been refunded.");
    if (!row.within) throw new BillingError("The claim window for this purchase has closed.");
    const earlier = await client.query("select 1 from lead_quality_claims where purchase_id = $1 and status <> 'withdrawn'", [claim.purchaseId]);
    if (earlier.rowCount) throw new BillingError("A claim has already been filed for this purchase.");
    try {
      const inserted = await client.query<{ id: string }>(
        `insert into lead_quality_claims (purchase_id, company_id, submitted_by, reason, evidence)
         values ($1, $2, $3, $4, $5) returning id`,
        [claim.purchaseId, actor.companyId, actor.userId, reason.code, evidence],
      );
      const id = inserted.rows[0]!.id;
      await audit(
        { actorType: "user", actorId: actor.userId, companyId: actor.companyId, action: "quality_claim.submit", entity: "lead_quality_claim", entityId: id, after: { purchase_id: claim.purchaseId, reason: reason.code }, ip: actor.ip ?? null },
        client,
      );
      return id;
    } catch (error) {
      if (isUniqueViolation(error, "lead_quality_claims_one_open")) throw new BillingError("A claim has already been filed for this purchase.");
      throw error;
    }
  });
}

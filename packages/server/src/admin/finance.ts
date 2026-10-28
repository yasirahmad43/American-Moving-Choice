/**
 * Finance administration (shared pricing §2, §6; S7 must: ledger with filters, credit adjustments,
 * refunds through refund_purchase, the quality-claim queue, disputes and reconciliation).
 *
 * Money moves only through the database: refund_purchase for refunds (it caps at the net paid and
 * never reopens a slot) and append-only ledger_entries with unique dedupe keys for adjustments.
 */
import { audit } from "../audit/audit";
import { getPool, raisedMessage, tx, type Queryable } from "../db/pool";
import { enqueueEmail } from "../outbox/outbox";
import { AdminError, cleanText, companyContactEmails, formatCents, requireText, type AdminActor } from "./common";
import { refundUnhonoured } from "../marketplace/purchase";
import { paymentsProviderFor, refundProviderFor, type RefundProvider } from "./refund-provider";

export const LEDGER_KINDS = ["purchase_charge", "credit_spend", "sharing_credit", "quality_refund_credit", "cash_refund", "adjustment"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const LEDGER_KIND_LABELS: Record<LedgerKind, string> = {
  purchase_charge: "Purchase charge",
  credit_spend: "Credit spent",
  sharing_credit: "Sharing credit",
  quality_refund_credit: "Quality refund (credit)",
  cash_refund: "Cash refund",
  adjustment: "Adjustment",
};

/** Largest single adjustment ($10,000), a guard against typos. */
export const MAX_ADJUSTMENT_CENTS = 1_000_000;

// ================================================================== ledger

export interface LedgerRow {
  id: string;
  company_id: string;
  legal_name: string;
  kind: LedgerKind;
  amount_cents: number;
  purchase_id: string | null;
  source_purchase_id: string | null;
  note: string | null;
  dedupe_key: string;
  created_at: Date;
}

export async function listLedger(
  filters: { companyId?: string | null; kind?: string | null; from?: string | null; to?: string | null; limit?: number; offset?: number } = {},
  db: Queryable = getPool(),
): Promise<{ rows: LedgerRow[]; total: number; sum: number }> {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replaceAll("?", `$${values.length}`));
  };
  if (filters.companyId && /^[0-9a-f-]{36}$/i.test(filters.companyId)) add("l.company_id = ?::uuid", filters.companyId);
  if (filters.kind && (LEDGER_KINDS as readonly string[]).includes(filters.kind)) add("l.kind = ?::ledger_kind", filters.kind);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) add("l.created_at >= ?::date", filters.from);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) add("l.created_at < ?::date + 1", filters.to);
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const totals = await db.query<{ n: number; sum: number }>(`select count(*)::int as n, coalesce(sum(l.amount_cents), 0)::int as sum from ledger_entries l ${clause}`, values);
  values.push(filters.limit ?? 100, filters.offset ?? 0);
  const rows = await db.query<LedgerRow>(
    `select l.id::text, l.company_id, c.legal_name, l.kind, l.amount_cents, l.purchase_id, l.source_purchase_id, l.note, l.dedupe_key, l.created_at
     from ledger_entries l join companies c on c.id = l.company_id ${clause}
     order by l.created_at desc, l.id desc limit $${values.length - 1} offset $${values.length}`,
    values,
  );
  return { rows: rows.rows, total: totals.rows[0]?.n ?? 0, sum: totals.rows[0]?.sum ?? 0 };
}

// ================================================================== adjustments

/**
 * A credit adjustment (+/-) with a note. idempotencyKey (one per rendered form) makes a double
 * submit a no-op. A negative adjustment can't take the available balance below zero.
 */
export async function adjustCredit(
  actor: AdminActor,
  input: { companyId: string; amountCents: number; note: string; idempotencyKey: string },
): Promise<{ created: boolean; balanceCents: number }> {
  const note = requireText(input.note, "a note explaining the adjustment", 500);
  if (!Number.isInteger(input.amountCents) || input.amountCents === 0) throw new AdminError("Enter an amount other than zero.", "invalid_amount");
  if (Math.abs(input.amountCents) > MAX_ADJUSTMENT_CENTS) throw new AdminError(`One adjustment can't be more than ${formatCents(MAX_ADJUSTMENT_CENTS)}.`, "invalid_amount");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(input.idempotencyKey)) throw new AdminError("The form expired. Reload the page and try again.", "invalid_key");
  return tx(async (client) => {
    // Same lock reserve_purchase takes, so a credit hold and an adjustment can't interleave.
    const company = await client.query<{ id: string }>("select id from companies where id = $1 for update", [input.companyId]);
    if (!company.rowCount) throw new AdminError("Company not found.", "not_found");
    const balance = await client.query<{ balance: number; held: number }>(
      `select coalesce((select balance_cents from company_credit_balance where company_id = $1), 0)::int as balance,
              coalesce((select sum(credit_applied_cents) from purchase_attempts where company_id = $1 and status = 'reserved'), 0)::int as held`,
      [input.companyId],
    );
    const { balance: current, held } = balance.rows[0]!;
    if (input.amountCents < 0 && current - held + input.amountCents < 0) {
      throw new AdminError(`The company has only ${formatCents(Math.max(0, current - held))} of available credit to remove.`, "insufficient_credit");
    }
    const inserted = await client.query<{ id: string }>(
      `insert into ledger_entries (company_id, kind, amount_cents, note, dedupe_key) values ($1, 'adjustment', $2, $3, $4)
       on conflict (dedupe_key) do nothing returning id::text`,
      [input.companyId, input.amountCents, note, `adjust:${input.idempotencyKey}`],
    );
    const entryId = inserted.rows[0]?.id;
    if (entryId) {
      await audit(
        {
          actorType: "admin",
          actorId: actor.userId,
          companyId: input.companyId,
          action: "billing.credit_adjustment",
          entity: "ledger_entry",
          entityId: entryId,
          before: { balance_cents: current },
          after: { amount_cents: input.amountCents, balance_cents: current + input.amountCents, note },
          ip: actor.ip ?? null,
        },
        client,
      );
    }
    return { created: Boolean(entryId), balanceCents: entryId ? current + input.amountCents : current };
  });
}

// ================================================================== refunds

interface PurchaseMoney {
  id: string;
  attempt_id: string;
  company_id: string;
  group_id: string;
  charged_cents: number;
  refunded_at: Date | null;
  card_amount_cents: number;
  credit_applied_cents: number;
  payment_ref: string | null;
  sharing_credits: number;
  reference_code: string | null;
}

async function purchaseMoney(db: Queryable, purchaseId: string, lock = false): Promise<PurchaseMoney> {
  if (lock) await db.query("select 1 from purchases where id = $1 for update", [purchaseId]);
  const found = await db.query<PurchaseMoney>(
    `select p.id, p.attempt_id, p.company_id, p.group_id, p.charged_cents, p.refunded_at, a.card_amount_cents, a.credit_applied_cents, a.payment_ref,
            coalesce((select sum(amount_cents) from ledger_entries where purchase_id = p.id and kind = 'sharing_credit'), 0)::int as sharing_credits,
            (select reference_code from leads where group_id = p.group_id and is_primary order by created_at limit 1) as reference_code
     from purchases p join purchase_attempts a on a.id = p.attempt_id where p.id = $1`,
    [purchaseId],
  );
  const row = found.rows[0];
  if (!row) throw new AdminError("Purchase not found.", "not_found");
  return row;
}

/** The most that can be refunded: the net paid (charge minus sharing credits received); cash is also capped at the card amount. */
export function refundCap(p: Pick<PurchaseMoney, "charged_cents" | "sharing_credits" | "card_amount_cents">, mode: "credit" | "cash"): number {
  const net = Math.max(0, p.charged_cents - p.sharing_credits);
  return mode === "credit" ? net : Math.min(net, p.card_amount_cents);
}

export async function getRefundQuote(purchaseId: string, db: Queryable = getPool()) {
  const p = await purchaseMoney(db, purchaseId);
  return { ...p, creditCap: refundCap(p, "credit"), cashCap: refundCap(p, "cash") };
}

async function notifyRefund(db: Queryable, p: PurchaseMoney, mode: "credit" | "cash", amountCents: number): Promise<void> {
  const lines = [
    `We refunded ${formatCents(amountCents)} for request ${p.reference_code ?? p.id}`,
    mode === "credit" ? "as account credit. It is applied automatically to your next purchases." : "to the original payment method. Card refunds can take 5 to 10 business days to appear.",
    "",
    "American Moving Choice",
  ];
  for (const to of await companyContactEmails(db, p.company_id)) {
    await enqueueEmail({ to, template: "refund_issued", subject: "Refund issued on American Moving Choice", bodyText: lines.join("\n"), relatedType: "purchase", relatedId: p.id }, db);
  }
}

/**
 * Refunds a purchase through refund_purchase: as account credit, or as cash to the original
 * payment method (the payments provider when configured, a demo refund otherwise). The amount
 * defaults to the cap. A refund never reopens the slot.
 */
export async function refundPurchase(
  actor: AdminActor,
  input: { purchaseId: string; mode: "credit" | "cash"; amountCents?: number | null; note: string },
  options: { provider?: RefundProvider } = {},
): Promise<{ amountCents: number; ref: string | null }> {
  const note = requireText(input.note, "a note explaining the refund", 500);
  if (input.mode !== "credit" && input.mode !== "cash") throw new AdminError("Choose credit or cash.");
  const quote = await purchaseMoney(getPool(), input.purchaseId);
  if (quote.refunded_at) throw new AdminError("This purchase was already refunded.", "already_refunded");
  const cap = refundCap(quote, input.mode);
  const amount = input.amountCents ?? cap;
  if (!Number.isInteger(amount) || amount <= 0) throw new AdminError("There is nothing to refund for this purchase that way.", "invalid_amount");
  if (amount > cap) throw new AdminError(`The most you can refund ${input.mode === "cash" ? "in cash " : ""}is ${formatCents(cap)} (the net paid).`, "exceeds_cap");

  let ref: string | null = null;
  if (input.mode === "cash") {
    const provider = options.provider ?? refundProviderFor(quote.payment_ref);
    const result = await provider.refund({ attemptId: quote.attempt_id, paymentRef: quote.payment_ref, amountCents: amount });
    if (!result.ok) throw new AdminError(result.error, "provider_failed");
    ref = result.ref;
  }

  try {
    await tx(async (client) => {
      const p = await purchaseMoney(client, input.purchaseId, true);
      if (p.refunded_at) throw new AdminError("This purchase was already refunded.", "already_refunded");
      await client.query("select refund_purchase($1, $2, $3, $4)", [p.id, input.mode, amount, ref ? `${note} (refund ${ref})` : note]);
      await notifyRefund(client, p, input.mode, amount);
      await audit(
        {
          actorType: "admin",
          actorId: actor.userId,
          companyId: p.company_id,
          action: input.mode === "credit" ? "billing.refund_credit" : "billing.refund_cash",
          entity: "purchase",
          entityId: p.id,
          before: { charged_cents: p.charged_cents, sharing_credits: p.sharing_credits },
          after: { mode: input.mode, amount_cents: amount, provider_ref: ref, note },
          ip: actor.ip ?? null,
        },
        client,
      );
    });
  } catch (error) {
    if (raisedMessage(error) === "refund_exceeds_net_paid" || (error instanceof Error && error.message === "refund_exceeds_net_paid")) {
      throw new AdminError("The refund is more than the net paid for this purchase.", "exceeds_cap");
    }
    throw error;
  }
  return { amountCents: amount, ref };
}

// ================================================================== quality claims

export interface ClaimRow {
  id: string;
  purchase_id: string;
  company_id: string;
  legal_name: string;
  reference_code: string | null;
  reason: string;
  evidence: string | null;
  status: string;
  decision: string | null;
  refund_mode: string | null;
  refund_amount_cents: number | null;
  charged_cents: number;
  sharing_credits: number;
  purchased_at: Date;
  created_at: Date;
  decided_at: Date | null;
}

export async function listClaims(status: string | null = "open", db: Queryable = getPool()): Promise<ClaimRow[]> {
  const found = await db.query<ClaimRow>(
    `select q.id, q.purchase_id, q.company_id, c.legal_name,
            (select reference_code from leads where group_id = p.group_id and is_primary order by created_at limit 1) as reference_code,
            q.reason, q.evidence, q.status, q.decision, q.refund_mode, q.refund_amount_cents, p.charged_cents,
            coalesce((select sum(amount_cents) from ledger_entries where purchase_id = p.id and kind = 'sharing_credit'), 0)::int as sharing_credits,
            p.created_at as purchased_at, q.created_at, q.decided_at
     from lead_quality_claims q join purchases p on p.id = q.purchase_id join companies c on c.id = q.company_id
     where ($1::text is null or q.status = $1) order by q.created_at desc limit 200`,
    [status],
  );
  return found.rows;
}

/** Approves a lead-quality claim: refunds the net paid as account credit (shared pricing §6). */
export async function approveClaim(actor: AdminActor, claimId: string, decisionInput: string): Promise<number> {
  const decision = requireText(decisionInput, "a decision note", 1000);
  return tx(async (client) => {
    const claim = (await client.query<{ id: string; purchase_id: string; company_id: string; status: string }>(
      "select id, purchase_id, company_id, status from lead_quality_claims where id = $1 for update",
      [claimId],
    )).rows[0];
    if (!claim) throw new AdminError("Claim not found.", "not_found");
    if (claim.status !== "open") throw new AdminError("This claim was already decided.", "bad_status");
    const p = await purchaseMoney(client, claim.purchase_id, true);
    if (p.refunded_at) throw new AdminError("The purchase was already refunded. Reject the claim with a note instead.", "already_refunded");
    const amount = refundCap(p, "credit");
    if (amount > 0) await client.query("select refund_purchase($1, 'credit', $2, $3)", [p.id, amount, `Quality claim approved: ${decision}`]);
    await client.query(
      `update lead_quality_claims set status = 'approved', decided_by = $2, decided_at = now(), decision = $3, refund_mode = 'credit', refund_amount_cents = $4
       where id = $1`,
      [claimId, actor.userId, decision, amount],
    );
    await notifyRefund(client, p, "credit", amount);
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId: claim.company_id,
        action: "billing.claim_approve",
        entity: "lead_quality_claim",
        entityId: claimId,
        before: { status: "open" },
        after: { status: "approved", refund_mode: "credit", refund_amount_cents: amount, decision },
        ip: actor.ip ?? null,
      },
      client,
    );
    return amount;
  });
}

export async function rejectClaim(actor: AdminActor, claimId: string, decisionInput: string): Promise<void> {
  const decision = requireText(decisionInput, "the reason for rejecting the claim", 1000);
  await tx(async (client) => {
    const claim = (await client.query<{ id: string; company_id: string; status: string; purchase_id: string }>(
      "select id, company_id, status, purchase_id from lead_quality_claims where id = $1 for update",
      [claimId],
    )).rows[0];
    if (!claim) throw new AdminError("Claim not found.", "not_found");
    if (claim.status !== "open") throw new AdminError("This claim was already decided.", "bad_status");
    await client.query("update lead_quality_claims set status = 'rejected', decided_by = $2, decided_at = now(), decision = $3 where id = $1", [claimId, actor.userId, decision]);
    for (const to of await companyContactEmails(client, claim.company_id)) {
      await enqueueEmail(
        {
          to,
          template: "claim_rejected",
          subject: "Your lead-quality claim was not approved",
          bodyText: `We reviewed your lead-quality claim and could not approve it.\n\nReason: ${decision}\n\nReply to this email if you have more evidence.\n\nAmerican Moving Choice`,
          relatedType: "purchase",
          relatedId: claim.purchase_id,
        },
        client,
      );
    }
    await audit(
      { actorType: "admin", actorId: actor.userId, companyId: claim.company_id, action: "billing.claim_reject", entity: "lead_quality_claim", entityId: claimId, before: { status: "open" }, after: { status: "rejected", decision }, ip: actor.ip ?? null },
      client,
    );
  });
}

// ================================================================== disputes

export const DISPUTE_STATUSES = ["open", "evidence_submitted", "won", "lost", "closed"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export async function listDisputes(db: Queryable = getPool()) {
  const found = await db.query<{
    id: string;
    stripe_dispute_id: string | null;
    purchase_id: string | null;
    company_id: string;
    legal_name: string;
    billing_status: string;
    amount_cents: number | null;
    reason: string | null;
    status: DisputeStatus;
    evidence_submitted_at: Date | null;
    outcome: string | null;
    created_at: Date;
  }>(
    `select d.id, d.stripe_dispute_id, d.purchase_id, d.company_id, c.legal_name, c.billing_status, d.amount_cents, d.reason, d.status,
            d.evidence_submitted_at, d.outcome, d.created_at
     from disputes d join companies c on c.id = d.company_id order by d.created_at desc limit 200`,
  );
  return found.rows;
}

/**
 * Records a chargeback or dispute by hand (shared pricing §6). Optionally pauses the company's new
 * purchases (billing_status suspended, which company_can_purchase checks).
 */
export async function createDispute(
  actor: AdminActor,
  input: { companyId: string; purchaseId?: string | null; amountCents?: number | null; reason: string; providerDisputeId?: string | null; pausePurchases: boolean },
): Promise<string> {
  const reason = requireText(input.reason, "the dispute reason", 500);
  const providerId = cleanText(input.providerDisputeId, 120);
  if (input.amountCents !== null && input.amountCents !== undefined && (!Number.isInteger(input.amountCents) || input.amountCents < 0)) {
    throw new AdminError("Enter the disputed amount in dollars.", "invalid_amount");
  }
  return tx(async (client) => {
    const company = (await client.query<{ billing_status: string }>("select billing_status from companies where id = $1 for update", [input.companyId])).rows[0];
    if (!company) throw new AdminError("Company not found.", "not_found");
    if (input.purchaseId) {
      const p = await client.query("select 1 from purchases where id = $1 and company_id = $2", [input.purchaseId, input.companyId]);
      if (!p.rowCount) throw new AdminError("That purchase doesn't belong to this company.", "invalid_purchase");
    }
    const row = await client.query<{ id: string }>(
      "insert into disputes (stripe_dispute_id, purchase_id, company_id, amount_cents, reason) values ($1, $2, $3, $4, $5) returning id",
      [providerId, input.purchaseId || null, input.companyId, input.amountCents ?? null, reason],
    );
    const id = row.rows[0]!.id;
    if (input.pausePurchases && company.billing_status !== "suspended") {
      await client.query("update companies set billing_status = 'suspended' where id = $1", [input.companyId]);
    }
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId: input.companyId,
        action: "billing.dispute_create",
        entity: "dispute",
        entityId: id,
        before: { billing_status: company.billing_status },
        after: { amount_cents: input.amountCents ?? null, reason, purchase_id: input.purchaseId || null, billing_status: input.pausePurchases ? "suspended" : company.billing_status },
        ip: actor.ip ?? null,
      },
      client,
    );
    return id;
  });
}

export async function updateDispute(actor: AdminActor, disputeId: string, input: { status: string; outcome?: string | null; restorePurchases: boolean }): Promise<void> {
  if (!(DISPUTE_STATUSES as readonly string[]).includes(input.status)) throw new AdminError("Choose a status.");
  const outcome = cleanText(input.outcome, 1000);
  if (["won", "lost", "closed"].includes(input.status) && !outcome) throw new AdminError("Enter the outcome.", "missing_text");
  await tx(async (client) => {
    const d = (await client.query<{ id: string; company_id: string; status: string; outcome: string | null }>("select id, company_id, status, outcome from disputes where id = $1 for update", [disputeId])).rows[0];
    if (!d) throw new AdminError("Dispute not found.", "not_found");
    await client.query(
      `update disputes set status = $2, outcome = coalesce($3, outcome),
         evidence_submitted_at = case when $2 = 'evidence_submitted' then coalesce(evidence_submitted_at, now()) else evidence_submitted_at end
       where id = $1`,
      [disputeId, input.status, outcome],
    );
    // Purchases resume when asked, or automatically once the company's last open dispute is won or closed.
    const othersOpen = await client.query("select 1 from disputes where company_id = $1 and id <> $2 and status in ('open', 'evidence_submitted') limit 1", [d.company_id, disputeId]);
    const autoRestore = (input.status === "won" || input.status === "closed") && !othersOpen.rowCount;
    if (input.restorePurchases || autoRestore) await client.query("update companies set billing_status = 'good' where id = $1 and billing_status = 'suspended'", [d.company_id]);
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        companyId: d.company_id,
        action: "billing.dispute_update",
        entity: "dispute",
        entityId: disputeId,
        before: { status: d.status, outcome: d.outcome },
        after: { status: input.status, outcome, restored_purchases: input.restorePurchases || autoRestore },
        ip: actor.ip ?? null,
      },
      client,
    );
  });
}

// ================================================================== reconciliation

export interface ReconciliationRow {
  purchase_id: string;
  company_id: string;
  legal_name: string;
  reference_code: string | null;
  created_at: Date;
  charged_cents: number;
  credit_applied_cents: number;
  card_amount_cents: number;
  payment_ref: string | null;
  charge_ledger_cents: number;
  spend_ledger_cents: number;
  refund_ledger_cents: number;
  refunded_at: Date | null;
  disclosed: boolean;
  issues: string[];
}

/**
 * Purchases next to their payment references and ledger entries, with mismatches flagged: a card
 * amount without a payment reference, a charge or credit spend that disagrees with the ledger, a
 * refund without its ledger entry, and a purchase without its disclosure.
 */
export async function reconciliation(filters: { from?: string | null; to?: string | null; onlyIssues?: boolean } = {}, db: Queryable = getPool()): Promise<ReconciliationRow[]> {
  const values: unknown[] = [];
  const where: string[] = [];
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    values.push(filters.from);
    where.push(`p.created_at >= $${values.length}::date`);
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    values.push(filters.to);
    where.push(`p.created_at < $${values.length}::date + 1`);
  }
  const found = await db.query<Omit<ReconciliationRow, "issues">>(
    `select p.id as purchase_id, p.company_id, c.legal_name,
            (select reference_code from leads where group_id = p.group_id and is_primary order by created_at limit 1) as reference_code,
            p.created_at, p.charged_cents, a.credit_applied_cents, a.card_amount_cents, a.payment_ref,
            coalesce(sum(l.amount_cents) filter (where l.kind = 'purchase_charge'), 0)::int as charge_ledger_cents,
            coalesce(sum(l.amount_cents) filter (where l.kind = 'credit_spend'), 0)::int as spend_ledger_cents,
            coalesce(sum(l.amount_cents) filter (where l.kind in ('quality_refund_credit', 'cash_refund')), 0)::int as refund_ledger_cents,
            p.refunded_at, exists (select 1 from disclosures d where d.purchase_id = p.id) as disclosed
     from purchases p
     join purchase_attempts a on a.id = p.attempt_id
     join companies c on c.id = p.company_id
     left join ledger_entries l on l.purchase_id = p.id
     ${where.length ? `where ${where.join(" and ")}` : ""}
     group by p.id, c.legal_name, a.credit_applied_cents, a.card_amount_cents, a.payment_ref
     order by p.created_at desc limit 500`,
    values,
  );
  const rows = found.rows.map((r) => {
    const issues: string[] = [];
    if (r.card_amount_cents > 0 && !r.payment_ref) issues.push("Card amount without a payment reference");
    if (r.charge_ledger_cents !== r.charged_cents) issues.push("Charge differs from the ledger");
    if (r.spend_ledger_cents !== -r.credit_applied_cents) issues.push("Credit spend differs from the ledger");
    if (r.refunded_at && r.refund_ledger_cents <= 0) issues.push("Refunded without a refund entry");
    if (!r.refunded_at && r.refund_ledger_cents > 0) issues.push("Refund entry on an unrefunded purchase");
    if (!r.disclosed) issues.push("No disclosure record");
    return { ...r, issues };
  });
  return filters.onlyIssues ? rows.filter((r) => r.issues.length > 0) : rows;
}

/** Succeeded payment attempts that produced no purchase (late success that was not honoured): each needs a refund. */
export async function orphanAttempts(db: Queryable = getPool()) {
  const found = await db.query<{ id: string; company_id: string; legal_name: string; card_amount_cents: number; payment_ref: string | null; created_at: Date; status: string }>(
    `select a.id, a.company_id, c.legal_name, a.card_amount_cents, a.payment_ref, a.created_at, a.status
     from purchase_attempts a join companies c on c.id = a.company_id
     where a.payment_ref is not null and not exists (select 1 from purchases p where p.attempt_id = a.id)
     order by a.created_at desc limit 100`,
  );
  return found.rows;
}

// ================================================================== provider charges and refunds (slice S6 tables)

export interface ProviderRefundRow {
  id: string;
  attempt_id: string;
  company_id: string;
  legal_name: string;
  provider: string;
  provider_ref: string;
  provider_refund_id: string | null;
  amount_cents: number;
  reason: string;
  status: "pending" | "succeeded" | "failed";
  error_code: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Provider refunds of charges whose purchase couldn't be honoured (payment_refunds, written by the
 * purchase flow). Pending and failed rows need an admin to retry them.
 */
export async function listProviderRefunds(statuses: readonly string[] = ["pending", "failed"], db: Queryable = getPool()): Promise<ProviderRefundRow[]> {
  const found = await db.query<ProviderRefundRow>(
    `select r.id, r.attempt_id, r.company_id, c.legal_name, r.provider, r.provider_ref, r.provider_refund_id, r.amount_cents, r.reason, r.status,
            r.error_code, r.created_at, r.updated_at
     from payment_refunds r join companies c on c.id = r.company_id
     where r.status = any($1::text[]) order by r.created_at desc limit 200`,
    [statuses],
  );
  return found.rows;
}

/** Retries a pending or failed provider refund through the purchase flow's own refund path. */
export async function retryProviderRefund(actor: AdminActor, refundId: string, options: { provider?: import("../payments/types").PaymentsProvider } = {}): Promise<boolean> {
  const row = (await getPool().query<ProviderRefundRow>("select * from payment_refunds where id = $1", [refundId])).rows[0];
  if (!row) throw new AdminError("Refund not found.", "not_found");
  if (row.status === "succeeded") throw new AdminError("This refund already succeeded.", "bad_status");
  const provider = options.provider ?? paymentsProviderFor(row.provider_ref);
  const ok = await refundUnhonoured({ id: row.attempt_id, company_id: row.company_id, card_amount_cents: row.amount_cents }, row.provider_ref, provider);
  await audit({
    actorType: "admin",
    actorId: actor.userId,
    companyId: row.company_id,
    action: "billing.provider_refund_retry",
    entity: "payment_refund",
    entityId: refundId,
    before: { status: row.status, error_code: row.error_code },
    after: { succeeded: ok },
    ip: actor.ip ?? null,
  });
  return ok;
}

export interface ChargeReconciliationRow {
  attempt_id: string;
  company_id: string;
  legal_name: string;
  attempt_status: string;
  card_amount_cents: number;
  attempt_payment_ref: string | null;
  charge_status: string | null;
  charge_amount_cents: number | null;
  charge_provider_ref: string | null;
  purchase_id: string | null;
  refund_status: string | null;
  created_at: Date;
  issues: string[];
}

/**
 * Provider charges (payment_charges) next to their purchase attempts: card amounts without a charge
 * row, references or amounts that disagree, succeeded charges with neither a purchase nor a
 * succeeded refund, and charges stuck processing for over an hour.
 */
export async function chargeReconciliation(filters: { onlyIssues?: boolean } = {}, db: Queryable = getPool()): Promise<ChargeReconciliationRow[]> {
  const found = await db.query<Omit<ChargeReconciliationRow, "issues">>(
    `select a.id as attempt_id, a.company_id, c.legal_name, a.status as attempt_status, a.card_amount_cents, a.payment_ref as attempt_payment_ref,
            ch.status as charge_status, ch.amount_cents as charge_amount_cents, ch.provider_ref as charge_provider_ref,
            p.id as purchase_id, r.status as refund_status, a.created_at
     from purchase_attempts a
     join companies c on c.id = a.company_id
     left join payment_charges ch on ch.attempt_id = a.id
     left join purchases p on p.attempt_id = a.id
     left join payment_refunds r on r.attempt_id = a.id
     where a.card_amount_cents > 0 or ch.attempt_id is not null
     order by a.created_at desc limit 500`,
  );
  const hour = 60 * 60 * 1000;
  const rows = found.rows.map((r) => {
    const issues: string[] = [];
    // Purchases recorded before payment_charges existed (seed history) carry only payment_ref.
    if (!r.charge_status && r.purchase_id && !r.attempt_payment_ref) issues.push("Card amount without a charge or payment reference");
    if (!r.charge_status && !r.purchase_id && r.attempt_status === "succeeded") issues.push("Succeeded attempt without a charge");
    if (r.charge_status && r.charge_amount_cents !== r.card_amount_cents) issues.push("Charge amount differs from the card amount");
    if (r.charge_status === "succeeded" && r.purchase_id && r.charge_provider_ref !== r.attempt_payment_ref) issues.push("Provider reference differs from the attempt");
    if (r.charge_status === "succeeded" && !r.purchase_id && r.refund_status !== "succeeded") issues.push("Charged without a purchase or a completed refund");
    if (r.charge_status === "processing" && Date.now() - new Date(r.created_at).getTime() > hour) issues.push("Charge still processing after an hour");
    if (r.purchase_id && r.charge_status && r.charge_status !== "succeeded") issues.push("Purchase whose charge did not succeed");
    return { ...r, issues };
  });
  return filters.onlyIssues ? rows.filter((r) => r.issues.length > 0) : rows;
}

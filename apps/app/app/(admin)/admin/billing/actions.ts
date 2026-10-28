"use server";

/** Finance decisions: credit adjustments, refunds, quality claims and disputes. */
import { AdminError, adjustCredit, approveClaim, createDispute, parseDollarsToCents, refundPurchase, rejectClaim, retryProviderRefund, updateDispute } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const PATHS = ["/admin/billing", "/admin/purchases", "/admin"];

export async function adjustCreditAction(previous: FormState, formData: FormData): Promise<FormState> {
  const companyId = field(formData, "companyId", 64);
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    const cents = parseDollarsToCents(field(formData, "amount", 20), { allowNegative: true });
    if (cents === null || cents === 0) throw new AdminError("Enter the amount in dollars: positive to add credit, negative (such as -25) to remove it.");
    const result = await adjustCredit(actor, { companyId: idField(formData, "companyId"), amountCents: cents, note: field(formData, "note", 500), idempotencyKey: field(formData, "key", 80) });
    if (!result.created) return "This adjustment was already recorded.";
    return `Adjustment recorded. New credit balance: $${(result.balanceCents / 100).toFixed(2)}.`;
  }, [...PATHS, `/admin/companies/${companyId}`]);
}

export async function refundAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    const mode = field(formData, "mode", 10);
    if (mode !== "credit" && mode !== "cash") throw new AdminError("Choose credit or cash.");
    const raw = field(formData, "amount", 20);
    const amountCents = raw ? parseDollarsToCents(raw) : null;
    if (raw && amountCents === null) throw new AdminError("Enter the amount in dollars, or leave it empty to refund the most allowed.");
    const result = await refundPurchase(actor, { purchaseId: idField(formData, "purchaseId"), mode, amountCents, note: field(formData, "note", 500) });
    return `Refunded $${(result.amountCents / 100).toFixed(2)} as ${mode === "credit" ? "account credit" : `cash${result.ref ? ` (${result.ref})` : ""}`}.`;
  }, [...PATHS, "/admin/companies", "/admin/leads"]);
}

export async function claimDecisionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    const decision = field(formData, "decision", 10);
    const claimId = idField(formData, "claimId");
    const note = field(formData, "note", 1000);
    if (decision === "approve") {
      const amount = await approveClaim(actor, claimId, note);
      return `Claim approved: $${(amount / 100).toFixed(2)} refunded as account credit.`;
    }
    if (decision === "reject") {
      await rejectClaim(actor, claimId, note);
      return "Claim rejected. The company was emailed the reason.";
    }
    throw new AdminError("Choose approve or reject.");
  }, PATHS);
}

export async function createDisputeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    const purchaseId = field(formData, "purchaseId", 64);
    const raw = field(formData, "amount", 20);
    const amountCents = raw ? parseDollarsToCents(raw) : null;
    if (raw && amountCents === null) throw new AdminError("Enter the disputed amount in dollars.");
    if (purchaseId && !/^[0-9a-f-]{36}$/i.test(purchaseId)) throw new AdminError("The purchase ID isn't valid.");
    await createDispute(actor, {
      companyId: idField(formData, "companyId"),
      purchaseId: purchaseId || null,
      amountCents,
      reason: field(formData, "reason", 500),
      providerDisputeId: field(formData, "providerDisputeId", 120),
      pausePurchases: formData.get("pausePurchases") === "on",
    });
    return "Dispute recorded.";
  }, PATHS);
}

export async function updateDisputeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    await updateDispute(actor, idField(formData, "disputeId"), {
      status: field(formData, "status", 30),
      outcome: field(formData, "outcome", 1000),
      restorePurchases: formData.get("restorePurchases") === "on",
    });
    return "Dispute updated.";
  }, PATHS);
}

export async function retryProviderRefundAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.finance, async ({ actor }) => {
    const ok = await retryProviderRefund(actor, idField(formData, "refundId"));
    if (!ok) throw new AdminError("The payments provider refused the refund again. Check the error code and try later.");
    return "Refund succeeded.";
  }, PATHS);
}

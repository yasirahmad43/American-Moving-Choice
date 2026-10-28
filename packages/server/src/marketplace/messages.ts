/**
 * Plain-language messages for the purchase errors raised by the 001 database functions
 * (reserve_purchase and friends raise SQLSTATE P0001 with these codes). Never shows raw database
 * text to a buyer.
 */

export type PurchaseErrorCode =
  | "company_not_eligible"
  | "lead_not_found"
  | "not_eligible_for_lead"
  | "eligibility_stale"
  | "lead_unavailable"
  | "already_purchased"
  | "purchase_in_progress"
  | "sold_out"
  | "no_price_configured"
  | "policy_limit"
  | "not_allowed"
  | "no_payment_method"
  | "payment_failed"
  | "payment_processing"
  | "refunded"
  | "attempt_closed"
  | "unknown";

const MESSAGES: Record<PurchaseErrorCode, string> = {
  company_not_eligible:
    "Your company can't buy requests right now. Check your verification status and billing standing, or contact support.",
  lead_not_found: "This request isn't available to your company.",
  not_eligible_for_lead: "This request isn't available to your company: only the movers the customer saw and agreed to can buy it.",
  eligibility_stale: "Your coverage changed since this request arrived, and it no longer includes this move.",
  lead_unavailable: "This request is no longer available. No charge was made.",
  already_purchased: "Your company already bought this request. Its contact details are in Purchased requests.",
  purchase_in_progress: "Another mover is completing a purchase of this request right now. Try again in a few seconds. No charge was made.",
  sold_out: "This request has reached the number of movers the customer chose. No charge was made.",
  no_price_configured: "Your company doesn't have request prices set yet. Contact support to set them.",
  policy_limit: "This request can't be sold to more movers. No charge was made.",
  not_allowed: "You don't have permission to buy requests. Ask your company owner to turn on purchasing for you.",
  no_payment_method: "Add a payment method in Billing before buying. No charge was made.",
  payment_failed: "The payment didn't go through. No charge was made and nothing was shared.",
  payment_processing:
    "We're confirming your payment. If it succeeds, the request appears in Purchased requests within a few minutes; if not, nothing is charged or shared.",
  refunded:
    "This request was taken by another mover while your payment was processing. Your payment is being refunded in full and nothing was shared.",
  attempt_closed: "That purchase attempt has ended. Open the request again to try once more.",
  unknown: "Something went wrong and the purchase didn't complete. No contact details were shared. Try again.",
};

const KNOWN = new Set(Object.keys(MESSAGES));

export function isPurchaseErrorCode(code: string): code is PurchaseErrorCode {
  return KNOWN.has(code);
}

export function purchaseErrorMessage(code: PurchaseErrorCode): string {
  return MESSAGES[code];
}

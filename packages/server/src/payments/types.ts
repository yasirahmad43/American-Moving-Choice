/**
 * Payments provider interface (build plan §5, §7.4, §9). The provider only moves cash: it saves
 * cards, charges the card remainder of a reserved purchase attempt and refunds charges that could
 * not be honoured. Credits, purchases, disclosure and the ledger stay in the 001 database functions.
 */

export type ProviderName = "demo" | "stripe";

/** A saved payment method row, as the provider needs it to charge. */
export interface StoredPaymentMethod {
  id: string;
  provider: ProviderName;
  providerPmId: string;
  brand: string | null;
  last4: string | null;
}

export interface ChargeInput {
  /** purchase_attempts.id: also the provider idempotency key, so a retried charge never doubles. */
  attemptId: string;
  companyId: string;
  groupId: string;
  amountCents: number;
  paymentMethod: StoredPaymentMethod;
  /** Provider customer (Stripe), when the company has one. */
  customerId: string | null;
}

export type ChargeResult =
  | { status: "succeeded"; providerRef: string }
  /** The provider accepted the charge but has not settled it; the webhook finishes the purchase. */
  | { status: "processing"; providerRef: string | null }
  | {
      status: "failed";
      /** Lowercase code for records, e.g. card_declined, authentication_required. */
      code: string;
      /** Safe to show the buyer: never includes provider internals. */
      message: string;
      providerRef: string | null;
    };

export interface RefundInput {
  attemptId: string;
  providerRef: string;
  amountCents: number;
}

export type RefundResult = { status: "succeeded"; refundId: string } | { status: "failed"; code: string };

export interface PaymentsProvider {
  readonly name: ProviderName;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
}

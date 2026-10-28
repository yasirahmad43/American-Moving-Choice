/**
 * Stripe provider (build plan §9; compliance facts §7). Active only when the Stripe keys are set
 * (integrationModes().payments === "live"). Cards are saved with SetupIntents for off-session use;
 * each purchase charges the card remainder with an off-session, confirmed PaymentIntent whose
 * idempotency key is the purchase attempt ID; refunds use the PaymentIntent.
 *
 * The client is typed by the small StripeClientLike surface this module uses, so tests can pass a
 * mock instead of the SDK.
 */
import type { ChargeInput, ChargeResult, PaymentsProvider, RefundInput, RefundResult } from "./types";

type Metadata = Record<string, string>;
type Expandable = string | { id: string } | null | undefined;

export interface StripePaymentIntentLike {
  id: string;
  status: string;
  amount: number;
  currency: string;
  customer?: Expandable;
  metadata?: Metadata | null;
  last_payment_error?: { code?: string | null } | null;
}

export interface StripeSetupIntentLike {
  id: string;
  status: string;
  client_secret?: string | null;
  customer?: Expandable;
  payment_method?: Expandable;
  usage?: string | null;
  metadata?: Metadata | null;
}

export interface StripePaymentMethodLike {
  id: string;
  card?: { brand?: string | null; last4?: string | null; exp_month?: number | null; exp_year?: number | null } | null;
}

export interface StripeEventLike {
  id: string;
  type: string;
  data: { object: unknown };
}

export interface StripeClientLike {
  customers: {
    create(params: { name?: string; metadata?: Metadata }, options?: { idempotencyKey?: string }): Promise<{ id: string }>;
  };
  setupIntents: {
    create(
      params: { customer: string; usage: "off_session"; payment_method_types: string[]; metadata: Metadata },
      options?: { idempotencyKey?: string },
    ): Promise<StripeSetupIntentLike>;
    retrieve(id: string): Promise<StripeSetupIntentLike>;
  };
  paymentMethods: {
    retrieve(id: string): Promise<StripePaymentMethodLike>;
  };
  paymentIntents: {
    create(
      params: {
        amount: number;
        currency: "usd";
        customer?: string;
        payment_method: string;
        off_session: true;
        confirm: true;
        description: string;
        metadata: Metadata;
      },
      options: { idempotencyKey: string },
    ): Promise<StripePaymentIntentLike>;
  };
  refunds: {
    create(
      params: { payment_intent: string; reason: "requested_by_customer"; metadata: Metadata },
      options: { idempotencyKey: string },
    ): Promise<{ id: string; status?: string | null }>;
  };
  webhooks: {
    constructEvent(payload: string, header: string, secret: string): StripeEventLike;
  };
}

export const idOf = (value: Expandable): string | null => (value == null ? null : typeof value === "string" ? value : value.id);

/** Stripe idempotency keys for the calls this module makes (one charge and one refund per attempt). */
export const chargeIdempotencyKey = (attemptId: string) => `amc_purchase_attempt_${attemptId}`;
export const refundIdempotencyKey = (attemptId: string) => `amc_refund_attempt_${attemptId}`;

interface StripeErrorShape {
  type?: string;
  code?: string;
  payment_intent?: { id?: string } | null;
  raw?: { payment_intent?: { id?: string } | null } | null;
}

const asStripeError = (error: unknown): StripeErrorShape | null =>
  error && typeof error === "object" && typeof (error as StripeErrorShape).type === "string" ? (error as StripeErrorShape) : null;

const safeCode = (code: string | null | undefined, fallback: string) => (code && /^[a-z][a-z0-9_]*$/.test(code) ? code : fallback);

function declineMessage(code: string): string {
  if (code === "authentication_required") {
    return "Your card issuer asks you to confirm this card before it can be charged. Add the card again in Billing, then try again. No charge was made and nothing was shared.";
  }
  if (code === "expired_card") return "This card has expired. Add another card in Billing. No charge was made and nothing was shared.";
  return "The card was declined. No charge was made and nothing was shared. Try another card in Billing.";
}

export function createStripeProvider(stripe: StripeClientLike): PaymentsProvider {
  return {
    name: "stripe",
    async charge(input: ChargeInput): Promise<ChargeResult> {
      if (input.paymentMethod.provider !== "stripe") {
        return { status: "failed", code: "payment_method_unavailable", message: "Add a card in Billing before buying.", providerRef: null };
      }
      try {
        const intent = await stripe.paymentIntents.create(
          {
            amount: input.amountCents,
            currency: "usd",
            ...(input.customerId ? { customer: input.customerId } : {}),
            payment_method: input.paymentMethod.providerPmId,
            off_session: true,
            confirm: true,
            description: "American Moving Choice move request purchase",
            metadata: { attempt_id: input.attemptId, company_id: input.companyId, group_id: input.groupId },
          },
          { idempotencyKey: chargeIdempotencyKey(input.attemptId) },
        );
        if (intent.status === "succeeded") return { status: "succeeded", providerRef: intent.id };
        if (intent.status === "processing") return { status: "processing", providerRef: intent.id };
        const code = safeCode(intent.last_payment_error?.code ?? (intent.status === "requires_action" ? "authentication_required" : null), "payment_failed");
        return { status: "failed", code, message: declineMessage(code), providerRef: intent.id };
      } catch (error) {
        const e = asStripeError(error);
        if (e?.type === "StripeCardError") {
          const code = safeCode(e.code, "card_declined");
          const ref = e.payment_intent?.id ?? e.raw?.payment_intent?.id ?? null;
          return { status: "failed", code, message: declineMessage(code), providerRef: ref };
        }
        if (e?.type === "StripeInvalidRequestError") {
          return { status: "failed", code: "invalid_request", message: "The payment couldn't be started. No charge was made and nothing was shared.", providerRef: null };
        }
        // Network or Stripe-side error: the charge may or may not exist. The attempt stays reserved;
        // the webhook (or the reservation expiry) settles it, and the idempotency key makes a
        // retry return the same PaymentIntent.
        return { status: "processing", providerRef: null };
      }
    },
    async refund(input: RefundInput): Promise<RefundResult> {
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: input.providerRef, reason: "requested_by_customer", metadata: { attempt_id: input.attemptId } },
          { idempotencyKey: refundIdempotencyKey(input.attemptId) },
        );
        if (refund.status === "failed" || refund.status === "canceled") return { status: "failed", code: `refund_${refund.status}` };
        return { status: "succeeded", refundId: refund.id };
      } catch (error) {
        return { status: "failed", code: safeCode(asStripeError(error)?.code, "refund_error") };
      }
    },
  };
}

/**
 * Cash refunds to the original payment method (shared pricing §2 kind 3, §6). With Stripe keys
 * and a Stripe PaymentIntent reference the refund goes through Stripe; otherwise (demo payments,
 * build plan §9) it succeeds at once with a demo_refund_ reference.
 *
 * Slice S6 owns the payments provider; once @amc/server/payments exposes a refund call, this
 * adapter should delegate to it.
 */
import Stripe from "stripe";
import { env } from "../env/env";

export interface RefundRequest {
  /** purchase_attempts.payment_ref of the original charge. */
  paymentRef: string | null;
  amountCents: number;
  /** Stable per purchase, so a retried refund never pays twice. */
  idempotencyKey: string;
}

export type RefundResult = { ok: true; provider: string; ref: string } | { ok: false; provider: string; error: string };

export interface RefundProvider {
  readonly name: string;
  refund(request: RefundRequest): Promise<RefundResult>;
}

export const demoRefundProvider: RefundProvider = {
  name: "demo",
  async refund(request) {
    return { ok: true, provider: "demo", ref: `demo_refund_${request.idempotencyKey.replace(/[^A-Za-z0-9_-]/g, "_")}` };
  },
};

export function stripeRefundProvider(secretKey: string): RefundProvider {
  const stripe = new Stripe(secretKey);
  return {
    name: "stripe",
    async refund(request) {
      if (!request.paymentRef?.startsWith("pi_")) return { ok: false, provider: "stripe", error: "The purchase has no Stripe payment to refund." };
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: request.paymentRef, amount: request.amountCents, reason: "requested_by_customer" },
          { idempotencyKey: request.idempotencyKey },
        );
        return { ok: true, provider: "stripe", ref: refund.id };
      } catch (error) {
        // Stripe's message describes the request (not the cardholder); keep only its type.
        const type = error instanceof Stripe.errors.StripeError ? error.type : "network_error";
        return { ok: false, provider: "stripe", error: `Stripe refused the refund (${type}).` };
      }
    },
  };
}

/** Stripe for Stripe references when keys are set; demo otherwise. */
export function refundProviderFor(paymentRef: string | null): RefundProvider {
  const key = env().STRIPE_SECRET_KEY;
  if (key && paymentRef?.startsWith("pi_")) return stripeRefundProvider(key);
  return demoRefundProvider;
}

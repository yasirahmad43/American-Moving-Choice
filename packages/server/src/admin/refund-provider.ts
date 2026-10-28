/**
 * Cash refunds to the original payment method (shared pricing §2 kind 3, §6), through slice S6's
 * payments provider: Stripe when configured and the purchase was charged through Stripe; the demo
 * provider otherwise (build plan §9), which succeeds at once with a demo_refund_ reference.
 */
import { demoPaymentsProvider } from "../payments/demo";
import { paymentsProvider } from "../payments/provider";
import type { PaymentsProvider } from "../payments/types";

export interface RefundRequest {
  /** The purchase attempt whose charge is refunded (the provider's idempotency key derives from it). */
  attemptId: string;
  /** purchase_attempts.payment_ref of the original charge. */
  paymentRef: string | null;
  amountCents: number;
}

export type RefundResult = { ok: true; provider: string; ref: string } | { ok: false; provider: string; error: string };

export interface RefundProvider {
  readonly name: string;
  refund(request: RefundRequest): Promise<RefundResult>;
}

/** Adapts an S6 PaymentsProvider to the admin refund call. */
export function fromPaymentsProvider(provider: PaymentsProvider): RefundProvider {
  return {
    name: provider.name,
    async refund(request) {
      if (!request.paymentRef) return { ok: false, provider: provider.name, error: "The purchase has no card payment to refund." };
      const result = await provider.refund({ attemptId: request.attemptId, providerRef: request.paymentRef, amountCents: request.amountCents });
      return result.status === "succeeded"
        ? { ok: true, provider: provider.name, ref: result.refundId }
        : { ok: false, provider: provider.name, error: `The payments provider refused the refund (${result.code}).` };
    },
  };
}

/** The provider that charged this reference: demo references always go to the demo provider. */
export function paymentsProviderFor(paymentRef: string | null): PaymentsProvider {
  if (!paymentRef || paymentRef.startsWith("demo_")) return demoPaymentsProvider;
  return paymentsProvider();
}

export function refundProviderFor(paymentRef: string | null): RefundProvider {
  return fromPaymentsProvider(paymentsProviderFor(paymentRef));
}

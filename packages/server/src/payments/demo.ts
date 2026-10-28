/**
 * Demo payments (build plan §9): no money moves. A saved "demo card" is charged instantly with the
 * reference demo_<attempt_id>; a refund succeeds without doing anything and is recorded by the
 * caller like a real one.
 */
import type { PaymentsProvider } from "./types";

export const demoPaymentsProvider: PaymentsProvider = {
  name: "demo",
  async charge(input) {
    if (input.paymentMethod.provider !== "demo") {
      return { status: "failed", code: "payment_method_unavailable", message: "This payment method can't be used in the preview.", providerRef: null };
    }
    return { status: "succeeded", providerRef: `demo_${input.attemptId}` };
  },
  async refund(input) {
    return { status: "succeeded", refundId: `demo_refund_${input.attemptId}` };
  },
};

/** The demo card shown in Billing: clearly fictional, never a real card number. */
export const DEMO_CARD = { brand: "Demo card", last4: "4242", expMonth: 12 } as const;

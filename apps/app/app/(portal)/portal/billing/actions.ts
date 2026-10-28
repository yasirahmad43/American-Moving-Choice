"use server";

/**
 * Billing server actions: save the demo card or a Stripe card (with the consent draft §9
 * authorization ticked), and remove a payment method. Owner and billing roles only; the payments
 * service re-checks the role from the database.
 */
import {
  PaymentMethodError,
  authorizationShownAt,
  beginStripeSetup,
  completeStripeSetup,
  removePaymentMethod,
  saveDemoCard,
  stripeClient,
} from "@amc/server/payments";
import { revalidatePath } from "next/cache";
import { actionActor, formText, knownErrorMessage, runAction } from "@/components/portal/marketplace/action-support";
import { errorState, type FormState } from "@/lib/form";

const MANAGERS_OF_BILLING = ["owner", "billing"] as const;

export async function saveDemoCardAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(MANAGERS_OF_BILLING);
  if (stripeClient()) return errorState(previous, "Stripe is configured: add a real card instead of the demo card.");
  const shownAt = authorizationShownAt(formText(formData, "shownAt"));
  if (!shownAt) return errorState(previous, "This form is out of date. Reload the page and try again.");
  return runAction(previous, "billing.demo_card", async () => {
    await saveDemoCard({ ...actor, authorized: formData.get("authorized") === "on", shownAt });
    revalidatePath("/portal/billing");
    revalidatePath("/portal/marketplace");
    return "Demo card saved. Purchases in the preview are charged to it instantly, and no money moves.";
  });
}

export async function removePaymentMethodAction(previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await actionActor(MANAGERS_OF_BILLING);
  return runAction(previous, "billing.remove_card", async () => {
    await removePaymentMethod({ ...actor, paymentMethodId: formText(formData, "paymentMethodId") });
    revalidatePath("/portal/billing");
    return "Payment method removed. Purchases already made stand.";
  });
}

export type StripeSetupResult = { ok: true; clientSecret: string } | { ok: false; message: string };

/** Starts a Stripe SetupIntent for the card form. */
export async function beginStripeSetupAction(): Promise<StripeSetupResult> {
  const actor = await actionActor(MANAGERS_OF_BILLING);
  const stripe = stripeClient();
  if (!stripe) return { ok: false, message: "Card payments aren't configured in this environment." };
  try {
    const { clientSecret } = await beginStripeSetup(stripe, actor);
    return { ok: true, clientSecret };
  } catch (error) {
    return { ok: false, message: knownErrorMessage(error) ?? "The card form couldn't be started. Try again." };
  }
}

/** Records the card after Stripe.js confirmed the SetupIntent. */
export async function completeStripeSetupAction(input: { setupIntentId: string; authorized: boolean; shownAt: string }): Promise<{ ok: boolean; message: string }> {
  const actor = await actionActor(MANAGERS_OF_BILLING);
  const stripe = stripeClient();
  if (!stripe) return { ok: false, message: "Card payments aren't configured in this environment." };
  const shownAt = authorizationShownAt(input.shownAt);
  if (!shownAt) return { ok: false, message: "This form is out of date. Reload the page and try again." };
  try {
    await completeStripeSetup(stripe, { ...actor, setupIntentId: String(input.setupIntentId), authorized: input.authorized === true, shownAt });
    revalidatePath("/portal/billing");
    return { ok: true, message: "Card saved." };
  } catch (error) {
    return { ok: false, message: error instanceof PaymentMethodError ? error.message : (knownErrorMessage(error) ?? "The card couldn't be saved. Try again.") };
  }
}

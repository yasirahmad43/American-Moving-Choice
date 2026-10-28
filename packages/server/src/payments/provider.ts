/**
 * Picks the payments provider for this environment: Stripe when its keys are set (build plan §9,
 * integrationModes), otherwise the demo provider.
 */
import Stripe from "stripe";
import { env } from "../env/env";
import { integrationModes } from "../env/schema";
import { demoPaymentsProvider } from "./demo";
import { createStripeProvider, type StripeClientLike } from "./stripe";
import type { PaymentsProvider } from "./types";

export function paymentsMode(): "live" | "demo" {
  return integrationModes(env()).payments;
}

declare global {
  var __amcStripe: StripeClientLike | undefined;
}

/** The Stripe client, or null when Stripe is not configured. */
export function stripeClient(): StripeClientLike | null {
  if (paymentsMode() !== "live") return null;
  if (!globalThis.__amcStripe) {
    const key = env().STRIPE_SECRET_KEY!;
    globalThis.__amcStripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 }) as unknown as StripeClientLike;
  }
  return globalThis.__amcStripe;
}

export function paymentsProvider(): PaymentsProvider {
  const stripe = stripeClient();
  return stripe ? createStripeProvider(stripe) : demoPaymentsProvider;
}

/** Publishable key for Stripe.js on the billing page, or null in demo mode. */
export function stripePublishableKey(): string | null {
  return paymentsMode() === "live" ? (env().STRIPE_PUBLISHABLE_KEY ?? null) : null;
}

export function stripeWebhookSecret(): string | null {
  return paymentsMode() === "live" ? (env().STRIPE_WEBHOOK_SECRET ?? null) : null;
}

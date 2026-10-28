/**
 * Stripe webhook (build plan §9; lead lifecycle §7 items 3, 6, 7). Returns 404 unless Stripe is
 * configured. Verifies the Stripe-Signature header against STRIPE_WEBHOOK_SECRET on the raw body,
 * then hands the event to handleStripeEvent, which dedupes it with record_payment_event. No Origin
 * check: the signature authenticates the sender. Responses never echo event contents or errors.
 */
import { handleStripeEvent, stripeClient, stripeWebhookSecret, type StripeEventLike } from "@amc/server/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Stripe's events are small; refuse anything far larger before verifying. */
const MAX_BODY_BYTES = 512 * 1024;

export async function POST(request: Request): Promise<Response> {
  const stripe = stripeClient();
  const secret = stripeWebhookSecret();
  if (!stripe || !secret) return new Response("Not found", { status: 404 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "missing_signature" }, { status: 400 });
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  const payload = await request.text();
  if (payload.length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  let event: StripeEventLike;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event, { stripe });
    return Response.json({ received: true, handled: outcome.handled });
  } catch (error) {
    // 500 makes Stripe retry; handleStripeEvent removed the dedupe row so the retry runs again.
    console.error(`[stripe-webhook] processing failed for ${event.type}${error instanceof Error ? `: ${error.name}` : ""}`);
    return Response.json({ error: "processing_failed" }, { status: 500 });
  }
}

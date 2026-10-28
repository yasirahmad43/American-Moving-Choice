"use client";

/**
 * Saving a card with Stripe (live mode only): Stripe.js collects the card in its own frame (card
 * data never touches AMC servers), a SetupIntent authorizes off-session use, and the server
 * re-reads the confirmed intent from Stripe before storing the card with the authorization text.
 */
import { Alert, Button, Checkbox } from "@amc/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { beginStripeSetupAction, completeStripeSetupAction } from "@/app/(portal)/portal/billing/actions";

interface StripeCardElement {
  mount(element: HTMLElement): void;
  destroy(): void;
}
interface StripeJs {
  elements(): { create(type: "card", options?: Record<string, unknown>): StripeCardElement };
  confirmCardSetup(clientSecret: string, data: { payment_method: { card: StripeCardElement } }): Promise<{ setupIntent?: { id: string; status: string }; error?: { message?: string } }>;
}

declare global {
  interface Window {
    Stripe?: (key: string) => StripeJs;
  }
}

const STRIPE_JS = "https://js.stripe.com/v3/";

function loadStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${STRIPE_JS}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: STRIPE_JS, async: true });
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("stripe_js")));
    if (!existing) document.head.appendChild(script);
  });
}

export function StripeCardForm({ publishableKey, authorizationText, shownAt }: { publishableKey: string; authorizationText: string; shownAt: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeJs | null>(null);
  const cardRef = useRef<StripeCardElement | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStripeJs()
      .then(() => {
        if (cancelled || !window.Stripe || !mountRef.current) return;
        stripeRef.current = window.Stripe(publishableKey);
        cardRef.current = stripeRef.current.elements().create("card", { hidePostalCode: false });
        cardRef.current.mount(mountRef.current);
      })
      .catch(() => setMessage({ tone: "error", text: "The card form couldn't load. Check your connection and reload the page." }));
    return () => {
      cancelled = true;
      cardRef.current?.destroy();
    };
  }, [publishableKey]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!authorized) {
      setMessage({ tone: "error", text: "Tick the authorization box to save this card." });
      return;
    }
    if (!stripeRef.current || !cardRef.current) return;
    setBusy(true);
    try {
      const begun = await beginStripeSetupAction();
      if (!begun.ok) {
        setMessage({ tone: "error", text: begun.message });
        return;
      }
      const confirmed = await stripeRef.current.confirmCardSetup(begun.clientSecret, { payment_method: { card: cardRef.current } });
      if (confirmed.error || !confirmed.setupIntent) {
        setMessage({ tone: "error", text: confirmed.error?.message ?? "The card couldn't be confirmed. Nothing was saved." });
        return;
      }
      const saved = await completeStripeSetupAction({ setupIntentId: confirmed.setupIntent.id, authorized, shownAt });
      setMessage({ tone: saved.ok ? "success" : "error", text: saved.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div aria-live="polite">{message ? <Alert tone={message.tone} role="none">{message.text}</Alert> : null}</div>
      <div>
        <p className="mb-1.5 text-[0.9375rem] font-semibold">Card</p>
        <div ref={mountRef} className="rounded-control border-[1.5px] border-border-strong bg-surface px-3.5 py-3.5" />
      </div>
      <Checkbox id="stripe-authorized" name="authorized" label={authorizationText} checked={authorized} onChange={(e) => setAuthorized(e.currentTarget.checked)} />
      <div>
        <Button type="submit" loading={busy}>
          Save card
        </Button>
      </div>
    </form>
  );
}

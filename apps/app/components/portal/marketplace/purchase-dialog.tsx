"use client";

/**
 * Buy button and confirmation dialog (consent draft §10; VD §9.6): amount, credit applied, card,
 * the shared-request credit line, then "Processing…", then an inline result. Each opening of the
 * dialog gets a fresh idempotency key, so a double click or a retry of the same confirmation never
 * buys twice.
 */
import { Alert, Button, Dialog, LinkButton, formatMoney } from "@amc/ui";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { purchaseAction } from "@/app/(portal)/portal/marketplace/actions";
import { initialPurchaseState } from "./purchase-state";

export interface PurchaseDialogProps {
  groupId: string;
  leadType: "exclusive" | "shared";
  route: string;
  chargeCents: number;
  creditCents: number;
  cardCents: number;
  sharingLimit: number;
  paymentMethod: { brand: string | null; last4: string | null } | null;
  /** Why buying is not possible for this member or company, if it isn't. */
  blockedReason?: string | null;
  purchaseInProgress?: boolean;
}

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Processing…" : label}
    </Button>
  );
}

export function PurchaseDialog(props: PurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [state, action] = useActionState(purchaseAction, initialPurchaseState);
  const resultRef = useRef<HTMLDivElement>(null);
  const price = formatMoney(props.chargeCents);
  const needsCard = props.cardCents > 0 && !props.paymentMethod;
  const purchased = state.status === "success" || state.code === "already_purchased";

  useEffect(() => {
    if ((state.attempt ?? 0) === 0) return;
    resultRef.current?.focus();
    // A failed attempt is closed in the database: the next try needs a new key.
    if (state.status === "error") setKey(crypto.randomUUID());
  }, [state.attempt, state.status]);

  const openDialog = () => {
    setKey(crypto.randomUUID());
    setOpen(true);
  };

  if (purchased && state.purchaseId && !open) {
    return (
      <div className="grid gap-2">
        <Alert tone="success">Purchased. Contact details are now in your CRM.</Alert>
        <LinkButton href={`/portal/leads/${state.purchaseId}`} variant="secondary">
          Open contact details
        </LinkButton>
      </div>
    );
  }

  const card = props.paymentMethod ? `${props.paymentMethod.brand ?? "Card"} •••• ${props.paymentMethod.last4 ?? "----"}` : "your card";
  const creditLine =
    props.creditCents > 0
      ? props.cardCents > 0
        ? `${formatMoney(props.creditCents)} account credit will be applied; ${formatMoney(props.cardCents)} will be charged to ${card}.`
        : `${formatMoney(props.creditCents)} account credit will be applied; nothing will be charged to your card.`
      : `${formatMoney(props.cardCents)} will be charged to ${card}.`;

  return (
    <>
      {props.blockedReason ? (
        <p className="type-small text-text-2">{props.blockedReason}</p>
      ) : (
        <Button type="button" onClick={openDialog}>
          Buy {props.leadType} request · <span className="tabular">{price}</span>
        </Button>
      )}
      {props.purchaseInProgress && !props.blockedReason ? (
        <p className="type-small text-text-2">Another mover is completing a purchase of this request. If Buy says so, try again in a few seconds.</p>
      ) : null}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <>
            Buy this {props.leadType} request for <span className="tabular">{price}</span>?
          </>
        }
        description={props.route}
      >
        <div ref={resultRef} tabIndex={-1} aria-live="polite" className="grid gap-3 focus:outline-none">
          {state.status === "error" && state.message ? <Alert tone="error" role="none">{state.message}</Alert> : null}
          {purchased && state.purchaseId ? (
            <Alert tone="success" role="none" action={<Link className="link" href={`/portal/leads/${state.purchaseId}`}>Open contact details</Link>}>
              {state.status === "success" ? state.message : "Your company already bought this request."}
            </Alert>
          ) : null}
        </div>
        {purchased ? (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : needsCard ? (
          <div className="grid gap-3">
            <p>Add a payment method before buying. {formatMoney(props.cardCents)} would be charged after any account credit.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <LinkButton href="/portal/billing">Go to Billing</LinkButton>
            </div>
          </div>
        ) : (
          <form action={action} className="grid gap-4">
            <input type="hidden" name="groupId" value={props.groupId} />
            <input type="hidden" name="idempotencyKey" value={key} />
            <div className="grid gap-2">
              <p>{creditLine}</p>
              {props.leadType === "shared" ? (
                <p>
                  Up to {props.sharingLimit} movers can buy this request. If others buy it after you, you&apos;ll automatically receive account
                  credit under the shared-request policy.
                </p>
              ) : null}
              <p>Contact details appear immediately after payment succeeds.</p>
              <p className="type-small text-text-3">Draft wording for counsel review (consent draft §10). Preview build: the demo card moves no money.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <ConfirmButton label="Buy" />
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

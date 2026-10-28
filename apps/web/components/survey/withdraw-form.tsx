"use client";

/**
 * Withdraw control for /my-request/[token]/: a button that opens a confirmation dialog, which
 * submits the withdrawal (VD §9.1: destructive actions get a confirm step).
 */
import { Alert, Button, Dialog } from "@amc/ui";
import { useActionState, useState } from "react";

export interface WithdrawState {
  status: "idle" | "withdrawn" | "error";
  message?: string;
}

export function WithdrawForm({ action, buyers }: { action: (state: WithdrawState, formData: FormData) => Promise<WithdrawState>; buyers: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  if (state.status === "withdrawn") {
    return (
      <Alert tone="success" title="Your request is withdrawn">
        No mover can buy it now.
        {buyers > 0 ? " We've told the movers that bought it to stop contacting you." : " No mover had bought it."}
      </Alert>
    );
  }

  return (
    <div className="grid gap-3">
      {state.status === "error" ? <Alert tone="error" title="We couldn't withdraw your request">{state.message}</Alert> : null}
      <div>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Withdraw my request
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Withdraw your request?"
        description={
          buyers > 0
            ? "No other mover will be able to buy it, and we'll tell the movers that already bought it to stop contacting you. Withdrawing can't take back details a mover already received."
            : "No mover will be able to buy it. You can't undo this; to hear from movers later, send a new request."
        }
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Keep my request
            </Button>
            <form action={formAction}>
              <input type="hidden" name="confirm" value="yes" />
              <Button type="submit" variant="danger" loading={pending} loadingLabel="Withdrawing…">
                Yes, withdraw it
              </Button>
            </form>
          </>
        }
      />
    </div>
  );
}

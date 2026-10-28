"use client";

import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { mfaSetupAction, mfaVerifyAction } from "../actions";

/** The 6-digit code form, for enrollment (with the sealed setup token) or for a new session. */
export function MfaCodeForm({ mode, next, setupToken }: { mode: "setup" | "verify"; next: string; setupToken?: string }) {
  const [state, action] = useActionState(mode === "setup" ? mfaSetupAction : mfaVerifyAction, initialFormState as FormState<"code">);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      {setupToken ? <input type="hidden" name="setupToken" value={setupToken} /> : null}
      <Field floating id="code" label="6-digit code" help="From your authenticator app. Codes change every 30 seconds." error={state.fieldErrors?.code}>
        <Input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          className="max-w-48 tabular tracking-[0.2em]"
          required
        />
      </Field>
      <SubmitButton fullWidth>{mode === "setup" ? "Turn on two-step verification" : "Verify"}</SubmitButton>
    </form>
  );
}

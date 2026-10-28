"use client";

import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { resetPasswordAction } from "../../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialFormState as FormState<"password" | "confirm">);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <Field id="password" label="New password" help="At least 12 characters. A short sentence works well." error={state.fieldErrors?.password}>
        <Input type="password" name="password" autoComplete="new-password" required />
      </Field>
      <Field id="confirm" label="Type the new password again" error={state.fieldErrors?.confirm}>
        <Input type="password" name="confirm" autoComplete="new-password" required />
      </Field>
      <SubmitButton fullWidth>Save new password</SubmitButton>
    </form>
  );
}

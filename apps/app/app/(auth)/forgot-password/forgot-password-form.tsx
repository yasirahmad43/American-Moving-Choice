"use client";

import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialFormState as FormState<"email">);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      {state.status !== "success" ? (
        <>
          <Field id="email" label="Email" error={state.fieldErrors?.email}>
            <Input type="email" name="email" autoComplete="email" inputMode="email" defaultValue={state.values?.email} required />
          </Field>
          <SubmitButton fullWidth>Send reset link</SubmitButton>
        </>
      ) : null}
    </form>
  );
}

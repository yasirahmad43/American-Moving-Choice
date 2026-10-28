"use client";

import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { acceptInvitationAction } from "../../actions";

type InviteField = "fullName" | "password" | "confirm";

/** New account (name and password) or, when signedIn, a single accept button. */
export function AcceptInvitationForm({ token, signedIn }: { token: string; signedIn: boolean }) {
  const [state, action] = useActionState(acceptInvitationAction, initialFormState as FormState<InviteField>);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      {signedIn ? null : (
        <>
          <Field floating id="fullName" label="Your full name" error={state.fieldErrors?.fullName}>
            <Input name="fullName" autoComplete="name" defaultValue={state.values?.fullName} required />
          </Field>
          <Field floating id="password" label="Choose a password" help="At least 12 characters. A short sentence works well." error={state.fieldErrors?.password}>
            <Input type="password" name="password" autoComplete="new-password" required />
          </Field>
          <Field floating id="confirm" label="Type the password again" error={state.fieldErrors?.confirm}>
            <Input type="password" name="confirm" autoComplete="new-password" required />
          </Field>
        </>
      )}
      <SubmitButton fullWidth>{signedIn ? "Accept invitation" : "Create account and join"}</SubmitButton>
    </form>
  );
}

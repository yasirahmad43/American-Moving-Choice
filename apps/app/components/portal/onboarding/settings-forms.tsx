"use client";

import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { changePasswordAction, disableMfaAction, signOutOthersAction, updateNameAction } from "@/app/(portal)/portal/settings/actions";
import { asFormState, idleState } from "./form-state";

export function NameForm({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(updateNameAction, idleState);
  const value = state.status === "error" && typeof state.values?.fullName === "string" ? state.values.fullName : fullName;
  return (
    <form action={action} noValidate className="grid gap-4">
      <FormMessage state={asFormState(state)} />
      <Field id="fullName" label="Full name" help="Shown to your teammates." error={state.fieldErrors?.fullName} required>
        <Input name="fullName" autoComplete="name" defaultValue={value} />
      </Field>
      <div>
        <SubmitButton variant="secondary">Save name</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(changePasswordAction, idleState);
  return (
    <form action={action} noValidate className="grid gap-4" key={state.status === "success" ? state.attempt : "form"}>
      <FormMessage state={asFormState(state)} />
      {/* Lets password managers save the new password against the right account. */}
      <input type="text" name="username" autoComplete="username" defaultValue={email} hidden readOnly />
      <Field id="current" label="Current password" help="We ask again to make sure it's you." error={state.fieldErrors?.current} required>
        <Input type="password" name="current" autoComplete="current-password" />
      </Field>
      <Field id="password" label="New password" help="At least 12 characters. A short sentence works well." error={state.fieldErrors?.password} required>
        <Input type="password" name="password" autoComplete="new-password" />
      </Field>
      <Field id="confirm" label="New password again" error={state.fieldErrors?.confirm} required>
        <Input type="password" name="confirm" autoComplete="new-password" />
      </Field>
      <p className="type-small text-text-2">Changing your password signs you out everywhere except this browser.</p>
      <div>
        <SubmitButton variant="secondary">Change password</SubmitButton>
      </div>
    </form>
  );
}

export function SignOutOthersForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState(signOutOthersAction, idleState);
  return (
    <form action={action} className="grid gap-3">
      <FormMessage state={asFormState(state)} />
      <div>
        <SubmitButton variant="secondary" disabled={disabled}>
          Sign out of all other sessions
        </SubmitButton>
      </div>
    </form>
  );
}

export function DisableMfaForm() {
  const [state, action] = useActionState(disableMfaAction, idleState);
  return (
    <form action={action} noValidate className="grid gap-4">
      <FormMessage state={asFormState(state)} />
      <Field id="mfaPassword" label="Your password" error={state.fieldErrors?.mfaPassword} required>
        <Input type="password" name="mfaPassword" autoComplete="current-password" />
      </Field>
      <Field id="code" label="Code from your authenticator app" help="The 6 digits your app shows now." error={state.fieldErrors?.code} required>
        <Input name="code" inputMode="numeric" autoComplete="one-time-code" className="tabular" />
      </Field>
      <div>
        <SubmitButton variant="danger">Turn off two-step verification</SubmitButton>
      </div>
    </form>
  );
}

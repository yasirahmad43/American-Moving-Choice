"use client";

import { Field, Input } from "@amc/ui";
import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, initialFormState as FormState<"email" | "password">);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        <Input type="email" name="email" autoComplete="username" inputMode="email" defaultValue={state.values?.email} required />
      </Field>
      <div>
        <Field id="password" label="Password" error={state.fieldErrors?.password}>
          <Input type="password" name="password" autoComplete="current-password" required />
        </Field>
        {/* Not the field's help text: it would become the input's description. 44px touch target. */}
        <Link href="/forgot-password" className="link mt-1 inline-flex min-h-11 items-center type-small">
          Forgot your password?
        </Link>
      </div>
      <SubmitButton fullWidth>Sign in</SubmitButton>
    </form>
  );
}

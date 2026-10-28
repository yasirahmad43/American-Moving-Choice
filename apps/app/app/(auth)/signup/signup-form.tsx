"use client";

import type { SignupField } from "@amc/server/auth";
import { Field, Input } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";
import { signupAction } from "../actions";

export function SignupForm({ requireMc }: { requireMc: boolean }) {
  const [state, action] = useActionState(signupAction, initialFormState as FormState<SignupField>);
  const error = (field: SignupField) => state.fieldErrors?.[field];
  const value = (field: SignupField) => state.values?.[field];
  return (
    <form action={action} noValidate className="grid gap-6">
      <FormMessage state={state} />
      <fieldset className="grid gap-5">
        <legend className="mb-1 type-h4 text-text">About you</legend>
        <Field id="fullName" label="Your full name" error={error("fullName")}>
          <Input name="fullName" autoComplete="name" defaultValue={value("fullName")} required />
        </Field>
        <Field id="email" label="Work email" help="You'll sign in with this email." error={error("email")}>
          <Input type="email" name="email" autoComplete="email" inputMode="email" defaultValue={value("email")} required />
        </Field>
        <Field id="password" label="Password" help="At least 12 characters. A short sentence works well." error={error("password")}>
          <Input type="password" name="password" autoComplete="new-password" required />
        </Field>
      </fieldset>
      <fieldset className="grid gap-5">
        <legend className="mb-1 type-h4 text-text">Your company</legend>
        <Field id="legalName" label="Legal company name" help="As registered with FMCSA." error={error("legalName")}>
          <Input name="legalName" autoComplete="organization" defaultValue={value("legalName")} required />
        </Field>
        <Field id="usdot" label="USDOT number" help="Digits only. We check it against the FMCSA record." error={error("usdot")}>
          <Input name="usdot" inputMode="numeric" autoComplete="off" defaultValue={value("usdot")} required />
        </Field>
        <Field
          id="mc"
          label="MC number"
          optional={!requireMc}
          help={requireMc ? "Our network requires an MC number, for example MC-123456." : "If you have one, for example MC-123456."}
          error={error("mc")}
        >
          <Input name="mc" autoComplete="off" defaultValue={value("mc")} required={requireMc} />
        </Field>
        <Field id="phone" label="Company phone" help="A US number. Reviewers also call the number on your FMCSA record." error={error("phone")}>
          <Input type="tel" name="phone" autoComplete="tel" inputMode="tel" defaultValue={value("phone")} required />
        </Field>
      </fieldset>
      <SubmitButton fullWidth>Create account and continue</SubmitButton>
    </form>
  );
}

"use client";

import { Field, Input, Textarea } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { updateProfileAction } from "@/app/(portal)/portal/profile/actions";
import { asFormState, idleState } from "./form-state";

export interface ProfileFormValues {
  displayName: string;
  description: string;
  logoUrl: string;
  website: string;
}

export function ProfileForm({ initial, maxDescription }: { initial: ProfileFormValues; maxDescription: number }) {
  const [state, action] = useActionState(updateProfileAction, idleState);
  const source = state.status === "error" && state.values ? state.values : initial;
  const value = (name: keyof ProfileFormValues) => {
    const v = (source as Record<string, unknown>)[name];
    return typeof v === "string" ? v : "";
  };
  const err = (name: keyof ProfileFormValues) => state.fieldErrors?.[name];
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={asFormState(state)} />
      <Field id="displayName" label="Display name" help="The name customers see in the directory and on your profile." error={err("displayName")} required>
        <Input name="displayName" defaultValue={value("displayName")} autoComplete="organization" />
      </Field>
      <Field
        id="description"
        label="Description"
        optional
        help={`In your own words: what you do and where. Up to ${maxDescription.toLocaleString("en-US")} characters. Don't add ratings, awards or claims we can't verify.`}
        error={err("description")}
      >
        <Textarea name="description" rows={7} defaultValue={value("description")} />
      </Field>
      <Field id="logoUrl" label="Logo URL" optional help="An https:// link to a square image of your logo." error={err("logoUrl")}>
        <Input name="logoUrl" inputMode="url" defaultValue={value("logoUrl")} />
      </Field>
      <Field id="website" label="Website" optional help="For example www.example.com." error={err("website")}>
        <Input name="website" inputMode="url" autoComplete="url" defaultValue={value("website")} />
      </Field>
      <div>
        <SubmitButton>Save profile</SubmitButton>
      </div>
    </form>
  );
}

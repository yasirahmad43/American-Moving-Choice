"use client";

/**
 * A small form bound to a server action with useActionState: shows the result message above the
 * fields (announced politely, focus moved to it) and optionally clears the fields after success.
 */
import type { ButtonVariant } from "@amc/ui";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function ActionForm({
  action,
  hidden,
  submitLabel,
  submitVariant = "secondary",
  resetOnSuccess = false,
  className,
  children,
}: {
  action: FormAction;
  hidden?: Record<string, string>;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  resetOnSuccess?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.status === "success") ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} noValidate className={className ?? "grid gap-4"}>
      <FormMessage state={state} />
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <div>
        <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

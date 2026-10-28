"use client";

import { Alert, Button, type ButtonProps } from "@amc/ui";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";

/** Submit button that shows "Processing…" while its form's action runs. */
export function SubmitButton({ children, ...rest }: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...rest}>
      {children}
    </Button>
  );
}

/**
 * The form's message (VD §9.2): announced politely. On each failed submit focus moves to the first
 * invalid field, or to the message when no field is marked; after a successful submit it moves to
 * the message, because the form's controls may be gone and focus would otherwise drop to <body>.
 */
export function FormMessage({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  const attempt = state.attempt ?? 0;
  useEffect(() => {
    if (attempt === 0) return;
    if (state.status === "success") {
      ref.current?.focus();
      return;
    }
    if (state.status !== "error") return;
    const form = ref.current?.closest("form");
    const firstInvalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (firstInvalid ?? ref.current)?.focus();
  }, [attempt, state.status]);

  const fieldCount = Object.values(state.fieldErrors ?? {}).filter(Boolean).length;
  return (
    <div ref={ref} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
      {state.status === "error" && state.message ? (
        <Alert tone="error" role="none">
          {state.message}
          {fieldCount > 1 ? ` ${fieldCount} fields need attention.` : ""}
        </Alert>
      ) : null}
      {state.status === "success" && state.message ? (
        <Alert tone="success" role="none">
          {state.message}
        </Alert>
      ) : null}
    </div>
  );
}

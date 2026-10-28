"use client";

/**
 * One admin decision form: a server action through useActionState, its message (FormMessage moves
 * focus to it), and a submit button. Destructive and irreversible decisions pass `confirm`: the
 * first submit opens a confirmation dialog (native <dialog>) and only "Confirm" sends the form.
 */
import { Button, Dialog, cx, type ButtonVariant } from "@amc/ui";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form";

export interface ConfirmCopy {
  title: string;
  description: ReactNode;
  confirmLabel: string;
}

export interface ActionFormProps {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  confirm?: ConfirmCopy;
  /** Clear the inputs after a successful submit (default true). */
  resetOnSuccess?: boolean;
  /** Lay the fields and button out in one row on wide screens. */
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ActionForm({ action, submitLabel, submitVariant = "primary", confirm, resetOnSuccess = true, inline, className, children }: ActionFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.status === "success" && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (!confirm) return;
        if (confirmed.current) {
          confirmed.current = false;
          return;
        }
        event.preventDefault();
        setOpen(true);
      }}
      className={cx(inline ? "flex flex-wrap items-end gap-3" : "grid gap-3", className)}
    >
      <FormMessage state={state} />
      {children}
      <div>
        <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
      </div>
      {confirm ? (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={confirm.title}
          description={confirm.description}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={submitVariant === "danger" ? "danger" : "primary"}
                onClick={() => {
                  confirmed.current = true;
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                {confirm.confirmLabel}
              </Button>
            </>
          }
        />
      ) : null}
    </form>
  );
}

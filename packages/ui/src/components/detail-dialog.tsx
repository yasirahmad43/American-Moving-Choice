"use client";

/**
 * A trigger button plus an accessible native <dialog> (focus moves in, Escape closes, focus
 * returns to the trigger, the page behind is inert). For "What this means" explainers and
 * anything that deserves a focused read without leaving the page.
 */
import { useCallback, useState, type ReactNode } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";
import { Dialog } from "./dialog";

export interface DetailDialogProps {
  /** Visible trigger text. */
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function DetailDialog({ trigger, triggerVariant = "secondary", triggerSize = "sm", triggerClassName, title, description, footer, children }: DetailDialogProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClasses({ variant: triggerVariant, size: triggerSize, className: triggerClassName })} aria-haspopup="dialog">
        {trigger}
      </button>
      <Dialog open={open} onClose={close} title={title} description={description} footer={footer} closeOnBackdrop className="dialog-enter max-w-xl">
        {children}
      </Dialog>
    </>
  );
}

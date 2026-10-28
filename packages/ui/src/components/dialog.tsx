"use client";

/**
 * Modal dialog on the native <dialog> element: focus moves inside on open, Escape closes, focus
 * returns to the opener on close, and the rest of the page is inert while it is open.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "../cx";
import { CloseIcon } from "../icons";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, right-aligned at the bottom. */
  footer?: ReactNode;
  closeLabel?: string;
  /** Close when the backdrop is clicked (off by default for confirmations). */
  closeOnBackdrop?: boolean;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, closeLabel = "Close", closeOnBackdrop = false, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === ref.current) ref.current?.close();
      }}
      className={cx(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-card border border-border bg-surface p-0 text-text shadow-e3 backdrop:bg-backdrop",
        className,
      )}
    >
      <div className="grid gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="type-h3">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="-mr-2 -mt-1 inline-grid size-11 shrink-0 place-items-center rounded-control text-text-2 hover:bg-surface-2"
          >
            <CloseIcon size={20} />
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>
        {description ? (
          <p id={descriptionId} className="text-text-2">
            {description}
          </p>
        ) : null}
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}

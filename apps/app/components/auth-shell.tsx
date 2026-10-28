import { SkipLink, Wordmark } from "@amc/ui";
import type { ReactNode } from "react";
import { PreviewStrip } from "./preview-strip";

/** Narrow, focused layout for sign-in, sign-up, reset, invitation and two-step pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <SkipLink />
      <PreviewStrip />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-content items-center gap-3 gutter">
          <Wordmark href="/login" />
          <span className="type-small text-text-3">Company portal</span>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 py-10 focus:outline-none sm:py-14">
        <div className="mx-auto w-full max-w-[34rem] gutter">{children}</div>
      </main>
    </div>
  );
}

/** The card holding one auth form, with its page H1. */
export function AuthCard({ title, description, children, footer }: { title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-e1 sm:p-8">
      <h1 className="type-display-l text-text">{title}</h1>
      {description ? <div className="mt-2 text-text-2">{description}</div> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-border pt-5 type-small text-text-2">{footer}</div> : null}
    </div>
  );
}

import { IconSprite, LineIcon, MenuIcon, SkipLink, Wordmark } from "@amc/ui";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/session";
import { PreviewStrip } from "./preview-strip";
import { SidebarNav, type SidebarSection } from "./sidebar-nav";
import "./app-shell.css";

export interface AppShellProps {
  /** "Company portal" or "Admin". */
  areaLabel: string;
  rootHref: string;
  sections: SidebarSection[];
  /** Who and what the user is acting for (company name and status, or admin role). */
  context: ReactNode;
  userLabel: string;
  /** Extra items for the top bar (the billing slice adds the credit balance and payment status). */
  topBarExtra?: ReactNode;
  children: ReactNode;
}

/** Initials for the account chip. */
function initials(label: string): string {
  const name = label.replace(/\s*\(.*\)\s*$/, "").trim();
  const parts = name.includes("@") ? [name[0] ?? "?"] : name.split(/\s+/).slice(0, 2).map((p) => p[0] ?? "");
  return parts.join("").toUpperCase() || "?";
}

/**
 * Portal and admin layout (VD §9.10): a top bar with the account context and sign-out, a left
 * sidebar from 1024px, and a disclosure menu with the same links below that. Pass 2: a 56px
 * glass top bar, a sidebar with the 3D section icons, and the line-icon sprite for tables.
 */
export function AppShell({ areaLabel, rootHref, sections, context, userLabel, topBarExtra, children }: AppShellProps) {
  return (
    <div className="workspace-shell flex min-h-dvh flex-col bg-surface-2">
      <IconSprite />
      <SkipLink />
      <header className="workspace-topbar sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex min-h-[4.5rem] max-w-portal flex-wrap items-center gap-x-5 gap-y-2 py-2 gutter">
          <Wordmark href={rootHref} />
          <span className="hidden rounded-pill bg-info-bg px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-info-text sm:inline">{areaLabel}</span>
          <div className="workspace-context flex min-w-0 flex-wrap items-center gap-2 type-small text-text-2 sm:border-l sm:border-border sm:pl-5">{context}</div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {topBarExtra}
            <span className="hidden items-center gap-2 type-small text-text-2 md:inline-flex" title={userLabel}>
              <span aria-hidden="true" className="inline-grid size-8 place-items-center rounded-pill bg-[linear-gradient(135deg,var(--info-bg),var(--surface-3))] text-[0.75rem] font-bold text-brand-navy ring-1 ring-border">
                {initials(userLabel)}
              </span>
              <span className="max-w-[14rem] truncate">{userLabel}</span>
            </span>
            <form action={logout}>
              <button type="submit" className="inline-flex min-h-11 items-center rounded-control border border-border-strong bg-surface px-3 text-[0.875rem] font-semibold text-text transition-colors hover:bg-surface-2">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <details className="group border-t border-border lg:hidden">
          <summary className="mx-auto flex min-h-12 max-w-portal cursor-pointer list-none items-center gap-2 font-semibold text-text gutter [&::-webkit-details-marker]:hidden">
            <MenuIcon size={20} />
            <span>{areaLabel} navigation</span>
            <LineIcon name="chevron-down" size={16} className="ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <div className="menu-panel mx-auto max-h-[calc(100dvh-10rem)] max-w-portal overflow-y-auto overscroll-contain pb-4 gutter">
            <SidebarNav sections={sections} label={`${areaLabel} sections`} rootHref={rootHref} />
          </div>
        </details>
      </header>
      <div className="mx-auto flex w-full max-w-portal flex-1 gap-7 gutter xl:gap-10">
        <aside className="hidden w-[14.25rem] shrink-0 py-7 lg:block">
          <div data-band="" className="workspace-sidebar sticky top-[6.25rem] rounded-[1.25rem] border border-white/10 bg-brand-navy p-3 text-on-band shadow-[0_18px_36px_-24px_rgba(6,49,103,.65)]">
            <div className="mb-5 grid gap-2 border-b border-white/15 px-3 pb-5 pt-3">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-on-band-2">American Moving Choice</span>
              <p className="font-display text-[1.375rem] font-bold leading-tight">{areaLabel === "Admin" ? "Operations workspace" : "Your moving business"}</p>
            </div>
            <SidebarNav sections={sections} label={`${areaLabel} sections`} rootHref={rootHref} tone="dark" />
            <p className="mt-6 flex items-start gap-2 border-t border-white/15 px-3 pb-2 pt-4 text-xs leading-relaxed text-on-band-2"><LineIcon name="lock" size={15} className="mt-0.5 shrink-0" />Your account controls which records and actions are available.</p>
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="workspace-main min-w-0 flex-1 py-6 focus:outline-none sm:py-8">
          {children}
        </main>
      </div>
      <PreviewStrip />
    </div>
  );
}

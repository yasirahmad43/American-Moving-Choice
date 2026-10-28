import { MenuIcon, SkipLink, Wordmark } from "@amc/ui";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/session";
import { PreviewStrip } from "./preview-strip";
import { SidebarNav, type SidebarSection } from "./sidebar-nav";

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
 * sidebar from 1024px, and a disclosure menu with the same links below that.
 */
export function AppShell({ areaLabel, rootHref, sections, context, userLabel, topBarExtra, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <SkipLink />
      <header className="relative z-10 border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-portal flex-wrap items-center gap-x-4 gap-y-2 py-2 gutter">
          <Wordmark href={rootHref} />
          <span className="hidden rounded-pill bg-info-bg px-2.5 py-1 text-[0.8125rem] font-bold text-info-text sm:inline">{areaLabel}</span>
          <div className="flex min-w-0 flex-wrap items-center gap-2 type-small text-text-2 sm:border-l sm:border-border sm:pl-4">{context}</div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {topBarExtra}
            <span className="hidden items-center gap-2 type-small text-text-2 md:inline-flex" title={userLabel}>
              <span aria-hidden="true" className="inline-grid size-8 place-items-center rounded-pill bg-surface-3 text-[0.75rem] font-bold text-brand-navy">
                {initials(userLabel)}
              </span>
              <span className="max-w-[14rem] truncate">{userLabel}</span>
            </span>
            <form action={logout}>
              <button type="submit" className="inline-flex min-h-11 items-center rounded-control border-[1.5px] border-border-strong px-3 font-semibold text-text hover:bg-surface-2">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <details className="group border-t border-border lg:hidden">
          <summary className="mx-auto flex min-h-11 max-w-portal list-none items-center gap-2 font-semibold text-text gutter [&::-webkit-details-marker]:hidden">
            <MenuIcon size={20} />
            Menu
          </summary>
          <div className="menu-panel mx-auto max-w-portal pb-4 gutter">
            <SidebarNav sections={sections} label={`${areaLabel} sections`} rootHref={rootHref} />
          </div>
        </details>
      </header>
      <div className="mx-auto flex w-full max-w-portal flex-1 gap-8 gutter">
        <aside className="hidden w-60 shrink-0 py-6 lg:block">
          <div className="sticky top-6 rounded-card border border-border bg-surface p-3 shadow-e1">
            <SidebarNav sections={sections} label={`${areaLabel} sections`} rootHref={rootHref} />
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 py-6 focus:outline-none sm:py-8">
          {children}
        </main>
      </div>
      <PreviewStrip />
    </div>
  );
}

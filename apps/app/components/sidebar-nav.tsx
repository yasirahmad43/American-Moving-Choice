"use client";

import { LineIcon, cx, type LineIconName } from "@amc/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarSection {
  title: string;
  items: { href: string; label: string }[];
}

/** The 3D icon for a section link, by route (pass 2). */
const NAV_ICONS: Record<string, LineIconName> = {
  "/portal": "chart",
  "/portal/marketplace": "grid",
  "/portal/leads": "lock",
  "/portal/pipeline": "route",
  "/portal/profile": "clipboard",
  "/portal/coverage": "map-pin",
  "/portal/rates": "money",
  "/portal/reviews": "star",
  "/portal/verification": "check",
  "/portal/application": "ledger",
  "/portal/billing": "money",
  "/portal/team": "users",
  "/portal/settings": "settings",
  "/admin": "chart",
  "/admin/verification": "check",
  "/admin/companies": "box",
  "/admin/leads": "mail",
  "/admin/purchases": "ledger",
  "/admin/billing": "money",
  "/admin/pricing": "money",
  "/admin/reviews": "star",
  "/admin/cases": "clipboard",
  "/admin/content": "ledger",
  "/admin/content/research": "search",
  "/admin/content/media": "grid",
  "/admin/content/publication": "dispatch",
  "/admin/content/preferred-movers": "check",
  "/admin/mailbox": "mail",
  "/admin/jobs": "clock",
  "/admin/settings": "settings",
  "/admin/audit-log": "search",
  "/admin/users": "lock",
};

/** Section links with the current page marked (aria-current) by more than color. */
export function SidebarNav({ sections, label, rootHref, tone = "light" }: { sections: SidebarSection[]; label: string; rootHref: string; tone?: "light" | "dark" }) {
  const pathname = usePathname() ?? "";
  const currentHref = sections.flatMap((section) => section.items).map((item) => item.href).filter((href) => href === rootHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)).sort((a, b) => b.length - a.length)[0];
  const dark = tone === "dark";
  return (
    <nav aria-label={label} className="grid gap-5">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className={cx("px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em]", dark ? "text-on-band-2" : "text-text-3")}>{section.title}</h2>
          <ul className="mt-1.5 grid gap-0.5">
            {section.items.map((item) => {
              const current = currentHref === item.href;
              const icon = NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "relative flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.875rem] font-semibold no-underline transition-colors duration-[var(--d1)]",
                      dark ? current ? "bg-white text-brand-navy shadow-sm" : "text-on-band-2 hover:bg-white/10 hover:text-white" : current ? "bg-primary text-on-primary" : "text-text-2 hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {icon ? (
                      <LineIcon name={icon} size={18} className="shrink-0" />
                    ) : (
                      <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill", current ? "bg-[#ff5a5f]" : "bg-border-strong")} />
                    )}
                    {item.label}
                    {current ? <span aria-hidden="true" className={cx("ml-auto size-1.5 shrink-0 rounded-full", dark ? "bg-cta" : "bg-on-primary")} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

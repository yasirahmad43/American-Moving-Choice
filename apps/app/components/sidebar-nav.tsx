"use client";

import { Icon3D, cx, type Icon3DName } from "@amc/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarSection {
  title: string;
  items: { href: string; label: string }[];
}

/** The 3D icon for a section link, by route (pass 2). */
const NAV_ICONS: Record<string, Icon3DName> = {
  "/portal": "chart",
  "/portal/marketplace": "megaphone",
  "/portal/leads": "key",
  "/portal/pipeline": "route",
  "/portal/profile": "credentials",
  "/portal/coverage": "target",
  "/portal/rates": "price",
  "/portal/reviews": "star",
  "/portal/verification": "verified",
  "/portal/application": "ledger",
  "/portal/billing": "wallet",
  "/portal/team": "chat",
  "/portal/settings": "settings",
  "/admin": "chart",
  "/admin/verification": "verified",
  "/admin/companies": "box",
  "/admin/leads": "mail",
  "/admin/purchases": "credits",
  "/admin/billing": "wallet",
  "/admin/pricing": "dollar",
  "/admin/reviews": "star",
  "/admin/cases": "folder",
  "/admin/content": "ledger",
  "/admin/content/research": "bulb",
  "/admin/content/media": "pin",
  "/admin/content/publication": "rocket",
  "/admin/content/preferred-movers": "thumb-up",
  "/admin/mailbox": "mail",
  "/admin/jobs": "clock",
  "/admin/settings": "settings",
  "/admin/audit-log": "search",
  "/admin/users": "key",
};

/** Section links with the current page marked (aria-current) by more than color. */
export function SidebarNav({ sections, label, rootHref }: { sections: SidebarSection[]; label: string; rootHref: string }) {
  const pathname = usePathname() ?? "";
  const isCurrent = (href: string) => (href === rootHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label={label} className="grid gap-5">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="px-3 type-overline text-text-3">{section.title}</h2>
          <ul className="mt-1.5 grid gap-0.5">
            {section.items.map((item) => {
              const current = isCurrent(item.href);
              const icon = NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "icon3d-hover flex min-h-11 items-center gap-2.5 rounded-control px-2.5 font-semibold no-underline transition-[background-color,color,transform] duration-[var(--d1)]",
                      current ? "bg-primary text-on-primary depth-1" : "text-text-2 hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {icon ? (
                      <Icon3D name={icon} size={24} className="shrink-0 !filter-none" />
                    ) : (
                      <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill", current ? "bg-[#ff5a5f]" : "bg-border-strong")} />
                    )}
                    {item.label}
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

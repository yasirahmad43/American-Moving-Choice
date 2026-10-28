"use client";

import { cx } from "@amc/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarSection {
  title: string;
  items: { href: string; label: string }[];
}

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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center rounded-control border-l-[3px] px-3 font-semibold no-underline",
                      current ? "border-primary bg-info-bg text-info-text" : "border-transparent text-text-2 hover:bg-surface-2 hover:text-text",
                    )}
                  >
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

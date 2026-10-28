"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/lib/site";

/** Desktop primary links with aria-current on the section the visitor is in. */
export function NavLinks({ items }: { items: NavLink[] }) {
  const pathname = usePathname() ?? "/";
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className="nav-link inline-flex min-h-11 items-center rounded-control px-3 font-semibold text-text no-underline transition-colors duration-[var(--d1)] hover:text-brand-navy"
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

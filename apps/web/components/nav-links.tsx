"use client";

import Link from "next/link";
import { ChevronDownIcon } from "@amc/ui";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import type { NavLink } from "@/lib/site";

/** Native disclosures retain all navigation without JS; enhancement adds dismissal and focus. */
export function NavDisclosure({ label, children, className = "", summaryClassName = "", mobile = false }: { label: ReactNode; children: ReactNode; className?: string; summaryClassName?: string; mobile?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    // Preserve a native disclosure opened before hydration. Close only after real navigation.
    if (previousPath.current !== pathname && ref.current) ref.current.open = false;
    previousPath.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    details.dataset.navEnhanced = "true";
    const close = (event: PointerEvent) => { if (details.open && !details.contains(event.target as Node)) details.open = false; };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.open || !details.contains(document.activeElement)) return;
      details.open = false;
      details.querySelector<HTMLElement>(":scope > summary")?.focus();
      event.preventDefault();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);
  return <details ref={ref} name="public-header-navigation" data-header-disclosure="" className={`group/nav ${className}`}
    onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) event.currentTarget.open = false; }}
    onClick={(event) => { if ((event.target as Element).closest("a, [data-close-navigation]")) event.currentTarget.open = false; }}>
    <summary className={`navigation-trigger inline-flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-control px-3 font-semibold text-text-2 transition-colors hover:bg-surface-2 hover:text-text group-open/nav:bg-surface-2 group-open/nav:text-text [&::-webkit-details-marker]:hidden ${summaryClassName}`}>
      {label}<ChevronDownIcon size={mobile ? 18 : 15} className="shrink-0 transition-transform duration-200 motion-reduce:transition-none group-open/nav:rotate-180" />
    </summary>
    {children}
  </details>;
}

export function NavLinks({ items }: { items: NavLink[] }) {
  const pathname = usePathname() ?? "/";
  return <ul className="grid gap-0.5">{items.map((item) => {
    const exact = pathname === item.href;
    return <li key={item.href}><Link href={item.href} aria-current={exact ? "page" : undefined} className="group/link flex min-h-11 items-center justify-between gap-3 rounded-control px-3 py-2 font-medium text-text-2 no-underline transition-colors hover:bg-surface-2 hover:text-text aria-[current=page]:bg-surface-2 aria-[current=page]:text-text"><span>{item.label}</span><span aria-hidden="true" className="text-brand-red opacity-0 transition-transform group-hover/link:translate-x-0.5 group-hover/link:opacity-100">↗</span></Link></li>;
  })}</ul>;
}

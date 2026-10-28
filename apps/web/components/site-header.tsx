import { ChevronDownIcon, MenuIcon, Wordmark } from "@amc/ui";
import Link from "next/link";
import { GET_QUOTES, MONEY_LINK, PRIMARY_NAV } from "@/lib/site";
import { HeaderCta } from "./header-cta";
import { NavLinks } from "./nav-links";

/**
 * Static (not sticky) header (VD §9.10): wordmark, primary navigation with the growing underline,
 * the "How AMC makes money" link and the Get quotes button. Below 1024px the navigation folds
 * into a native disclosure menu that works without JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-[4.5rem] max-w-content items-center gap-x-6 gutter">
        <Wordmark href="/" />
        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <NavLinks items={PRIMARY_NAV} />
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
          <Link href={MONEY_LINK.href} className="hidden min-h-11 items-center px-2 type-small text-link underline underline-offset-[0.2em] sm:inline-flex">
            {MONEY_LINK.label}
          </Link>
          <HeaderCta />
          <details className="group lg:hidden">
            <summary className="inline-flex min-h-11 list-none items-center gap-1.5 rounded-control border-[1.5px] border-border-strong px-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
              <MenuIcon size={20} />
              Menu
              <ChevronDownIcon size={16} className="transition-transform duration-[var(--d2)] group-open:rotate-180" />
            </summary>
            <nav aria-label="Primary (menu)" className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-e2">
              <ul className="menu-panel mx-auto grid max-w-content gap-1 py-3 gutter">
                {[GET_QUOTES, ...PRIMARY_NAV, MONEY_LINK].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="flex min-h-12 w-full items-center rounded-control px-3 text-[1.0625rem] font-semibold text-text no-underline hover:bg-surface-2">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

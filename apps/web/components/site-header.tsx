import { ChevronDownIcon, MenuIcon, Wordmark } from "@amc/ui";
import Link from "next/link";
import { GET_QUOTES, MONEY_LINK, PRIMARY_NAV } from "@/lib/site";
import { HeaderCta } from "./header-cta";

const navLink = "inline-flex min-h-11 items-center rounded-control px-3 font-semibold text-text no-underline hover:bg-surface-2";

/**
 * Static (not sticky) 64px header (VD §9.10): wordmark, primary navigation, the "How AMC makes
 * money" link and the Get quotes button. Below 1024px the navigation folds into a native
 * disclosure menu that works without JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-content flex-wrap items-center gap-x-4 gap-y-2 py-2 gutter">
        <Wordmark href="/" />
        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href={MONEY_LINK.href} className="hidden min-h-11 items-center px-2 type-small text-link underline underline-offset-[0.2em] sm:inline-flex">
            {MONEY_LINK.label}
          </Link>
          <HeaderCta />
          <details className="group lg:hidden">
            <summary className="inline-flex min-h-11 list-none items-center gap-1.5 rounded-control border-[1.5px] border-border-strong px-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
              <MenuIcon size={20} />
              Menu
              <ChevronDownIcon size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label="Primary" className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-e2">
              <ul className="mx-auto grid max-w-content gap-1 py-3 gutter">
                {[GET_QUOTES, ...PRIMARY_NAV, MONEY_LINK].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${navLink} w-full`}>
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

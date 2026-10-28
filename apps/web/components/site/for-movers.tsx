/**
 * Shared pieces for the B2B pages under /for-movers/ (site architecture §1.1): the Apply call to
 * action (navy: CTA red is only for consumer quote requests, VD §5.3) and the section navigation.
 */
import { env } from "@amc/server/env";
import { RouteMapArt, buttonClasses } from "@amc/ui";
import Link from "next/link";

export const FOR_MOVERS_PAGES = [
  { href: "/for-movers/", label: "Overview" },
  { href: "/for-movers/eligibility/", label: "Who can join" },
  { href: "/for-movers/moving-leads/", label: "Moving leads" },
  { href: "/for-movers/pricing/", label: "Pricing and buying rules" },
  { href: "/for-movers/reviews-and-reputation/", label: "Reviews and reputation" },
];

export function ApplyCta({ note }: { note?: string }) {
  const { APP_URL } = env();
  return (
    <div data-band="" className="not-prose relative isolate grid gap-4 overflow-hidden rounded-card mesh-navy p-6 text-on-band sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-80 w-[36rem] opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden="true">
        <RouteMapArt />
      </div>
      <div className="grid gap-2">
        <p className="type-display-l text-on-band">Ready to apply?</p>
        <p className="max-w-[56ch] text-on-band-2">
          {note ?? "Applying is free. We check your federal record before you can buy any lead, and you see the buying rules on our pricing page first."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={`${APP_URL}/signup`} className={buttonClasses({ variant: "primary", className: "!bg-white !text-brand-navy hover:!bg-on-band-2" })}>
          Apply to join
        </a>
        <Link href="/contact/" className="inline-flex min-h-11 items-center text-on-band underline underline-offset-[0.25em]">
          Questions? Contact us
        </Link>
      </div>
    </div>
  );
}

export function ForMoversNav({ current }: { current: string }) {
  return (
    <nav aria-label="For movers" className="not-prose">
      <ul className="flex flex-wrap gap-2">
        {FOR_MOVERS_PAGES.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              aria-current={page.href === current ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-border-strong px-4 font-semibold text-text no-underline transition-colors duration-[var(--d1)] hover:bg-surface-2 aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
            >
              {page.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

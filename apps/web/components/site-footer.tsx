import { env } from "@amc/server/env";
import { RouteMapArt, RouteMark, Wordmark } from "@amc/ui";
import Link from "next/link";
import { GEONAMES_CREDIT, HELP_LINKS, LEGAL_LINKS, PREVIEW_BANNER_TEXT, TRUST_LINKS, type NavLink } from "@/lib/site";
import { storedText } from "@/lib/stored-texts";

function LinkList({ title, links, extra }: { title: string; links: NavLink[]; extra?: React.ReactNode }) {
  return (
    <div>
      <h2 className="type-overline text-on-band-2">{title}</h2>
      <ul className="mt-4 grid gap-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex min-h-11 items-center text-on-band underline-offset-[0.25em] transition-colors duration-[var(--d1)] hover:text-white hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
        {extra}
      </ul>
    </div>
  );
}

/**
 * Navy footer band (VD §9.10): the full role-and-money statement (ST-1a), trust and policy pages,
 * help and legal links, the company sign-in, the GeoNames credit the ZIP data licence requires,
 * and, while the site is not indexable, one discreet preview notice (the only place it appears).
 */
export function SiteFooter() {
  const { APP_URL, SITE_INDEXABLE } = env();
  return (
    <footer data-band="" className="relative isolate overflow-hidden mesh-navy text-on-band">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[34rem] w-[52rem] opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden="true">
        <RouteMapArt />
      </div>
      <div className="mx-auto grid max-w-content gap-12 pb-12 pt-16 gutter lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
        <div className="grid content-start gap-5">
          <Wordmark tone="reversed" size="lg" />
          <p className="max-w-[52ch] text-on-band-2">{storedText("ST-1a")}</p>
          <p className="flex items-center gap-3 type-small text-on-band-2">
            <RouteMark size={14} />
            Routes are directional. Evidence is dated.
          </p>
        </div>
        <LinkList title="How we work" links={TRUST_LINKS} />
        <LinkList title="Help" links={HELP_LINKS} />
        <LinkList
          title="Moving companies"
          links={[
            { href: "/for-movers/", label: "For movers" },
            { href: "/for-movers/pricing/", label: "Pricing and buying rules" },
            { href: "/for-movers/eligibility/", label: "Who can join" },
          ]}
          extra={
            <li>
              <a href={`${APP_URL}/login`} className="mt-2 inline-flex min-h-11 items-center rounded-control bg-white/10 px-4 font-semibold text-on-band no-underline ring-1 ring-white/20 transition-colors duration-[var(--d1)] hover:bg-white/15">
                Company sign-in
              </a>
            </li>
          }
        />
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto grid max-w-content gap-3 py-5 gutter type-small text-on-band-2 md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-6">
          <ul className="flex flex-wrap gap-x-5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-on-band underline-offset-[0.2em] hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            ZIP code data from{" "}
            <a href={GEONAMES_CREDIT.sourceUrl} className="text-on-band underline underline-offset-[0.2em]">
              GeoNames
            </a>
            , licensed under{" "}
            <a href={GEONAMES_CREDIT.licenseUrl} className="text-on-band underline underline-offset-[0.2em]">
              CC BY 4.0
            </a>
            .
          </p>
        </div>
        {SITE_INDEXABLE ? null : (
          <section aria-label="Preview notice" className="border-t border-white/10">
            <p className="mx-auto max-w-content py-3 gutter type-legal text-on-band-2/80">{PREVIEW_BANNER_TEXT}</p>
          </section>
        )}
      </div>
    </footer>
  );
}

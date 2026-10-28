import { env } from "@amc/server/env";
import { Wordmark } from "@amc/ui";
import Link from "next/link";
import { GEONAMES_CREDIT, HELP_LINKS, LEGAL_LINKS, TRUST_LINKS, type NavLink } from "@/lib/site";
import { storedText } from "@/lib/stored-texts";

function LinkList({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="type-overline text-on-band-2">{title}</h2>
      <ul className="mt-3 grid gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex min-h-11 items-center text-on-band underline-offset-[0.2em] hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Navy footer band (VD §9.10): the full role-and-money statement (ST-1a), trust and policy pages,
 * help and legal links, the company sign-in and the GeoNames credit the ZIP data licence requires.
 */
export function SiteFooter() {
  const appUrl = env().APP_URL;
  return (
    <footer data-band="" className="bg-band text-on-band">
      <div className="mx-auto grid max-w-content gap-10 py-12 gutter lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="grid content-start gap-4">
          <Wordmark tone="reversed" />
          <p className="max-w-[60ch] text-on-band-2">{storedText("ST-1a")}</p>
        </div>
        <LinkList title="How we work" links={TRUST_LINKS} />
        <LinkList title="Help" links={HELP_LINKS} />
        <div>
          <LinkList title="Moving companies" links={[{ href: "/for-movers/", label: "For movers" }]} />
          <ul className="mt-1 grid gap-1">
            <li>
              <a href={`${appUrl}/login`} className="inline-flex min-h-11 items-center text-on-band underline-offset-[0.2em] hover:underline">
                Company sign-in
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 gutter type-small text-on-band-2">
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
      </div>
    </footer>
  );
}

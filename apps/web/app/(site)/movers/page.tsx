import { Breadcrumbs, Container } from "@amc/ui";
import { GEO_THRESHOLDS } from "@amc/server/geo-pages";
import { publishedStateUrls } from "@amc/server/seo";
import { getSettings } from "@amc/server/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { JsonLd, breadcrumbJsonLd, canonical } from "@/components/directory/seo";
import { ZipCheck } from "./zip-check";

export const metadata: Metadata = {
  title: "Movers by state",
  description: "How movers in the American Moving Choice network set the areas they serve, and a ZIP check that shows coverage for your state.",
  ...canonical("/movers/"),
};

/** Geo index (site architecture §1.2): lists published state pages only (seo_pages, status published). */
export default async function MoversIndexPage() {
  await connection();
  const [hubs, settings] = await Promise.all([publishedStateUrls(), getSettings()]);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Movers", path: "/movers/" }])} />
      <div className="mesh-light border-b border-border">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,26rem)] lg:items-end lg:gap-12">
          <div className="grid gap-4">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Movers" }]} />
            <p className="flex items-center gap-3 type-overline text-text-2">
              <span aria-hidden="true" className="h-px w-8 bg-brand-red" />
              Coverage, state by state
            </p>
            <h1 className="type-display-xl max-w-[18ch] text-text">Movers by state</h1>
            <p className="type-lede max-w-[60ch] text-text-2">
              Every mover in the American Moving Choice network sets the areas it serves. A request reaches only movers whose coverage includes it, and
              never more than the number you choose.
            </p>
          </div>
          <section aria-labelledby="zip-heading" className="bezel">
            <div className="bezel-inner grid gap-4 p-5 sm:p-6">
              <h2 id="zip-heading" className="type-h3 text-text">
                Check coverage where you&apos;re moving from
              </h2>
              <ZipCheck />
            </div>
          </section>
        </Container>
      </div>
    <Container size="reading" className="grid gap-10 section-pad">

      <section aria-labelledby="states-heading" className="grid gap-3">
        <h2 id="states-heading" className="type-h3 text-text">
          State pages
        </h2>
        {hubs.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {hubs.map((state) => (
              <li key={state.stateCode}>
                <Link href={state.url} className="link">
                  {state.h1}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text">
            No state pages are published yet. We publish a state page only when it passes every publishing check, including at least{" "}
            <span className="tabular">{GEO_THRESHOLDS.state_hub.movers}</span> movers in our network with coverage there and checked facts about
            the state's own rules for movers. Until then, the ZIP check above and the quote survey show coverage for your move.
          </p>
        )}
      </section>

      <section aria-labelledby="plan-heading" className="grid gap-3">
        <h2 id="plan-heading" className="type-h3 text-text">
          Routes, services, costs and planning
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { href: "/routes/", label: "Moving routes: state-to-state and city-to-city" },
            { href: "/services/", label: "Moving services: local, long-distance, interstate, packing, storage, specialty" },
            { href: "/moving-costs/", label: "Moving costs and the cost calculator" },
            { href: "/questions/", label: "Moving questions answered from the rules" },
            { href: "/planning/", label: "Planning checklists" },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="link inline-flex min-h-11 items-center">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="grid gap-3 text-text">
        <h2 id="how-heading" className="type-h3 text-text">
          How coverage works
        </h2>
        <ul className="grid list-disc gap-2 pl-6">
          <li>
            <strong>Movers set their own coverage.</strong> Each sets where moves may start and end (whole states, counties or ZIP codes),
            which kinds of move it takes (local, in-state long-distance or between states), home sizes and services. The capabilities
            approved for it cap what its coverage can include.
          </li>
          <li>
            <strong>Coverage follows your route.</strong> A company's home city alone doesn't decide whether it can receive your request.
            Its approved coverage must include where your move starts and ends.
          </li>
          <li>
            <strong>Your answers decide who can receive your request.</strong> The quote survey checks your move against every mover's
            coverage before it asks for contact details, shows the number of eligible movers, and asks how many may contact you, up to{" "}
            <span className="tabular">{settings.max_sharing_limit}</span>.
          </li>
          <li>
            <strong>Only screened movers count.</strong> Eligible companies are approved moving carriers with no broker authority.
            Each company introduces itself when it contacts you; this site doesn't present a public list to browse.
          </li>
        </ul>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/which-companies-receive-my-request/" className="link inline-flex min-h-11 items-center">
            Which companies receive my request
          </Link>
          <Link href="/how-we-verify-movers/" className="link inline-flex min-h-11 items-center">
            How we verify movers
          </Link>
          <Link href="/review-methodology/" className="link inline-flex min-h-11 items-center">
            How reviews work
          </Link>
          <Link href="/get-quotes/" className="link inline-flex min-h-11 items-center">
            Start your quote request
          </Link>
        </p>
      </section>
    </Container>
    </>
  );
}

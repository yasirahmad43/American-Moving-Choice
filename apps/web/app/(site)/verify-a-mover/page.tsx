import { Breadcrumbs, Container } from "@amc/ui";
import { FMCSA_LI_URL, PROTECT_YOUR_MOVE_URL, STATE_CREDENTIAL_SOURCES } from "@amc/server/profiles";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbJsonLd, canonical } from "@/components/directory/seo";
import { LookupForm } from "./lookup-form";

export const metadata: Metadata = {
  title: "Check a mover before you hire it",
  description: "Look up a moving company's federal record by USDOT or MC number, and learn what USDOT numbers, MC numbers and state licenses tell you.",
  ...canonical("/verify-a-mover/"),
};

const SAFER_URL = "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx";

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="link" target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Verify a mover (site architecture §1.2): the landing page indexes; lookup results are never URLs. */
export default function VerifyAMoverPage() {
  return (
    <Container size="reading" className="grid gap-10 section-pad">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Verify a mover", path: "/verify-a-mover/" }])} />
      <div className="grid gap-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Verify a mover" }]} />
        <h1 className="type-display-l text-text">Check a mover before you hire it</h1>
        <p className="type-lede text-text-2">
          Look up any moving company, in our network or not, by its USDOT or MC number. You'll see what its federal record shows: whether it
          holds carrier or broker authority, its USDOT status and its insurance filings, with the time we retrieved them.
        </p>
      </div>

      <section aria-labelledby="lookup-heading" className="grid gap-4 rounded-card border border-border bg-surface-2 p-5 sm:p-6">
        <h2 id="lookup-heading" className="type-h3 text-text">
          Look up a mover
        </h2>
        <p className="type-small text-text-2">
          Search by number rather than by name, because different companies can have similar names. In this preview, lookups use recorded demo
          data for fictional USDOT numbers 9000001 to 9000099.
        </p>
        <LookupForm />
      </section>

      <section aria-labelledby="usdot-heading" className="grid gap-3 text-text">
        <h2 id="usdot-heading" className="type-h3">
          What is a USDOT number?
        </h2>
        <p>
          A USDOT number identifies a company's record with the Federal Motor Carrier Safety Administration (FMCSA). Movers that carry
          household goods between states need one, and the record shows whether it's active and whether the company is marked out of
          service. [Verify: USDOT registration requirements (compliance facts §1, search excerpts).]
        </p>
        <p>
          Check it on the <External href={SAFER_URL}>FMCSA company snapshot (SAFER)</External>.
        </p>
      </section>

      <section aria-labelledby="mc-heading" className="grid gap-3 text-text">
        <h2 id="mc-heading" className="type-h3">
          What is an MC number?
        </h2>
        <p>
          An MC number is the docket number tied to a company's federal operating authority. The authority itself says whether the company is
          a carrier, which performs moves, or a broker, which arranges moves that other companies carry out. A docket number alone doesn't
          tell you which, so check the authority type on <External href={FMCSA_LI_URL}>FMCSA Licensing and Insurance</External>.
        </p>
        <p>
          FMCSA has said it is considering no longer assigning MC numbers, and it would first publish a proposed rule for public comment. For
          now, MC numbers are still issued. [Verify: FMCSA FAQ "Will FMCSA stop issuing MC Numbers?" (compliance facts §1, search excerpts).]
        </p>
      </section>

      <section aria-labelledby="state-heading" className="grid gap-3 text-text">
        <h2 id="state-heading" className="type-h3">
          State licenses for in-state moves
        </h2>
        <p>
          Some states issue their own credentials to movers that work within the state, and some local movers hold only state credentials.
          For example:
        </p>
        <ul className="grid list-disc gap-1 pl-6">
          {Object.entries(STATE_CREDENTIAL_SOURCES).map(([code, source]) => (
            <li key={code}>
              <External href={source.url}>{source.label}</External>
            </li>
          ))}
        </ul>
        <p className="type-small text-text-2">[Verify: state agencies and links (How we verify movers, compliance facts §1); link each agency's public lookup.]</p>
      </section>

      <section aria-labelledby="limits-heading" className="grid gap-3 text-text">
        <h2 id="limits-heading" className="type-h3">
          What a lookup can't tell you
        </h2>
        <ul className="grid list-disc gap-2 pl-6">
          <li>A record can change after we retrieve it. The time of each lookup is shown with its result.</li>
          <li>It doesn't rate work quality, prices or crews, and it isn't an endorsement by American Moving Choice or the government.</li>
          <li>
            Complaint history isn't part of this lookup. See <External href={PROTECT_YOUR_MOVE_URL}>FMCSA Protect Your Move</External>.
          </li>
        </ul>
        <p>
          <Link href="/how-we-verify-movers/" className="link">
            How we verify movers
          </Link>{" "}
          explains the checks a company must pass to join our network, and{" "}
          <Link href="/movers-vs-brokers/" className="link">
            Movers vs brokers
          </Link>{" "}
          explains how to read each record.
        </p>
      </section>
    </Container>
  );
}

import { Container, ExpandableCard, SectionHeader } from "@amc/ui";
import { FMCSA_LI_URL, PROTECT_YOUR_MOVE_URL, STATE_CREDENTIAL_SOURCES } from "@amc/server/profiles";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbJsonLd, canonical } from "@/components/directory/seo";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { StorySections } from "@/components/site/story-sections";
import { Note } from "@/components/site/review-notes";
import { pageMediaPlan } from "@/lib/page-media";
import { LookupForm } from "./lookup-form";

const PAGE = "/verify-a-mover/";

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
  const plan = pageMediaPlan(PAGE, { topic: "trust verification safety" });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Verify a mover", path: "/verify-a-mover/" }])} />
      <VideoSurveyHero url={PAGE} title="Check a mover before you hire it" eyebrow="Any mover, in our network or not"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Verify a mover" }]}
        mobileActionHref="#lookup-heading" mobileActionLabel="Check a USDOT number"
        description="Look up any moving company by its USDOT or MC number. You'll see what its federal record shows: whether it holds carrier or broker authority, its USDOT status and its insurance filings, with the time we retrieved them.">
        <a href="#lookup-heading" className="vsh__tool-action">Check a USDOT number <span aria-hidden="true">↓</span></a>
      </VideoSurveyHero>
      <Container>
        <StorySections images={plan.images} chapters={[
          { key: "verify-lookup", heading: "Look up a mover", content: <section aria-labelledby="lookup-heading" className="min-w-0 scroll-mt-24">
              <div className="bezel"><div className="bezel-inner grid gap-4 p-5 sm:p-7">
                <h2 id="lookup-heading" tabIndex={-1} className="type-h3 scroll-mt-24 text-text">Look up a mover</h2>
                <p className="type-small text-text-2">Search by number rather than by name, because different companies can have similar names. In this preview, lookups use recorded demo data for fictional USDOT numbers 9000001 to 9000099.</p>
                <LookupForm />
              </div></div>
            </section> },
          { key: "verify-usdot", heading: "How to read a federal record", content: <div className="grid gap-6"><SectionHeader title="How to read a federal record" lede="Three numbers tell you most of what you need. Here is what each one means and where to check it." /><ExpandableCard title="What is a USDOT number?" titleAs="h2" name="verify-faq" defaultOpen>
              <p>
                A USDOT number identifies a company&apos;s record with the Federal Motor Carrier Safety Administration (FMCSA). Movers that carry household
                goods between states need one, and the record shows whether it&apos;s active and whether the company is marked out of service.{" "}
                <Note kind="verify">USDOT registration requirements (compliance facts §1, search excerpts).</Note>
              </p>
              <p className="mt-3">
                Check it on the <External href={SAFER_URL}>FMCSA company snapshot (SAFER)</External>.
              </p>
            </ExpandableCard></div> },
          { key: "verify-mc", heading: "Understand operating authority", content: <ExpandableCard title="What is an MC number?" titleAs="h2" name="verify-faq">
              <p>
                An MC number is the docket number tied to a company&apos;s federal operating authority. The authority itself says whether the company is a
                carrier, which performs moves, or a broker, which arranges moves that other companies carry out. A docket number alone doesn&apos;t tell you
                which, so check the authority type on <External href={FMCSA_LI_URL}>FMCSA Licensing and Insurance</External>.
              </p>
              <p className="mt-3">
                FMCSA has said it is considering no longer assigning MC numbers, and it would first publish a proposed rule for public comment. For now, MC
                numbers are still issued. <Note kind="verify">FMCSA FAQ &ldquo;Will FMCSA stop issuing MC Numbers?&rdquo; (compliance facts §1, search excerpts).</Note>
              </p>
            </ExpandableCard> },
          { key: "verify-state", heading: "Check state credentials", content: <ExpandableCard title="State licenses for in-state moves" titleAs="h2" name="verify-faq">
              <p>Some states issue their own credentials to movers that work within the state, and some local movers hold only state credentials. For example:</p>
              <ul className="mt-3 grid list-disc gap-1 pl-6">
                {Object.entries(STATE_CREDENTIAL_SOURCES).map(([code, source]) => (
                  <li key={code}>
                    <External href={source.url}>{source.label}</External>
                  </li>
                ))}
              </ul>
              <p className="mt-3 type-small">
                <Note kind="verify">state agencies and links (How we verify movers, compliance facts §1); link each agency&apos;s public lookup.</Note>
              </p>
            </ExpandableCard> },
          { key: "verify-limits", heading: "Know the limits of a lookup", content: <ExpandableCard title="What a lookup can't tell you" titleAs="h2" name="verify-faq">
              <ul className="grid list-disc gap-2 pl-6">
                <li>A record can change after we retrieve it. The time of each lookup is shown with its result.</li>
                <li>It doesn&apos;t rate work quality, prices or crews, and it isn&apos;t an endorsement by American Moving Choice or the government.</li>
                <li>
                  Complaint history isn&apos;t part of this lookup. See <External href={PROTECT_YOUR_MOVE_URL}>FMCSA Protect Your Move</External>.
                </li>
              </ul>
              <p className="mt-3">
                <Link href="/how-we-verify-movers/" className="link">
                  How we verify movers
                </Link>{" "}
                explains the checks a company must pass to join our network, and{" "}
                <Link href="/movers-vs-brokers/" className="link">
                  Movers vs brokers
                </Link>{" "}
                explains how to read each record.
              </p>
            </ExpandableCard> },
        ]} />
      </Container>
    </>
  );
}

import { Container, Reveal, TrustStrip } from "@amc/ui";
import type { Metadata } from "next";
import { Calculator } from "@/components/calculator/calculator";
import { calculatorPageContent, renderTokens } from "@/components/calculator/content";
import { MOVING_COSTS } from "@/components/calculator/copy";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { socialMetadata } from "@/components/site/social-metadata";
import { StorySections, StoryNextSteps } from "@/components/site/story-sections";
import { pageMediaPlan } from "@/lib/page-media";
import { PUBLIC_REQUEST_ASSURANCE, publicMarketingHtml } from "@/lib/public-copy";
import { storedText } from "@/lib/stored-texts";

const PAGE = "/moving-cost-calculator/";

export function generateMetadata(): Metadata {
  const page = calculatorPageContent();
  // The front-matter title has no site suffix (site architecture §8.2 template, 55 characters).
  // Results render client-side after a POST and never get their own URL, so they can't be indexed.
  return { title: { absolute: page.title }, description: page.metaDescription, alternates: { canonical: PAGE }, ...socialMetadata(PAGE, page.title, page.metaDescription, { family: "cost", topic: "cost calculator pricing" }) };
}

/** Styles for the drafted copy rendered from Markdown (headings, lists, links; review notes stay hidden for the public). */
const proseClasses =
  "grid gap-4 text-text [&_h2]:mt-6 [&_h2]:type-h3 [&_h2]:text-text [&_p]:max-w-[68ch] [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1 [&_ul]:pl-6 " +
  "[&_a]:link [&_.review-note]:mt-1 [&_.review-note]:rounded-control [&_.review-note]:border-l-4 " +
  "[&_.review-note]:border-l-warning [&_.review-note]:bg-warning-bg [&_.review-note]:px-3 [&_.review-note]:py-2 [&_.review-note]:type-small";

/**
 * /moving-cost-calculator/ (build plan §7.3; site architecture §1.2). The H1 and intro render on
 * the server from the drafted copy; the calculator is a client island whose results stay off the
 * URL. The method page (/moving-cost-calculator/method/) is rendered from content by the site shell.
 */
export default function MovingCostCalculatorPage() {
  const page = calculatorPageContent();
  const plan = pageMediaPlan(PAGE, { topic: "cost calculator pricing" });
  const tokenCopy = {
    "form.services.storage.help": renderTokens("Storage for {{cost.method.storage_assumption}}."),
    "form.services.specialty_items.help": renderTokens("Covers {{cost.method.specialty_items}}."),
    "state.no_data.body": renderTokens(
      "A range needs rate cards from at least {{cost.method.min_movers}} different movers for a move like this in this area, and we have fewer. A range resting on too few movers could mislead you, so we don't show one.",
    ),
    "state.stale.body": renderTokens(
      "Rate cards stop counting once they're more than {{cost.method.max_data_age_months}} months old, and too few recent ones cover this move. There's no range until enough movers send newer ones.",
    ),
  };
  return (
    <>
      <VideoSurveyHero url={PAGE} title={page.h1} eyebrow="Planning range, not a quote"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Moving cost calculator" }]}
        mobileActionHref="#planning-calculator" mobileActionLabel="Use cost calculator"
        description="A range built from movers' own rate cards, shown only when enough different movers have shared recent rates for a move like yours.">
        <a href="#planning-calculator" className="vsh__tool-action">Use cost calculator <span aria-hidden="true">↓</span></a>
      </VideoSurveyHero>

      <Container className="grid gap-12 section-pad">
        <Reveal>
          <TrustStrip
            items={[
              { title: "Built from rate cards", body: "Movers in our network share the rates they actually charge. We never invent a price." },
              { title: "Only with enough data", body: `A range needs rate cards from several different movers. Fewer, and we say so.` },
              { title: "Never a quote", body: "Only a mover can price your move, in a written estimate. This is for planning." },
              { title: "Nothing stored", body: "Your answers stay in your browser session; the result never gets its own URL." },
            ]}
          />
        </Reveal>

        <StorySections images={plan.images} chapters={[
          { key: "calculator-intro", heading: "A clearer starting point", content: <div className={proseClasses} dangerouslySetInnerHTML={{ __html: publicMarketingHtml(page.introHtml) }} /> },
          { key: "calculator-tool", heading: "Plan for your move", content: <section id="planning-calculator" tabIndex={-1} aria-label="Planning range tool" className="min-w-0 scroll-mt-24">
              <noscript><p className="mb-4 text-text">The calculator needs JavaScript. You can turn it on in your browser, or read <a href={MOVING_COSTS} className="link">Moving costs</a> to see what affects the price of a move.</p></noscript>
              <div className="bezel"><div className="bezel-inner p-5 sm:p-6"><Calculator tokenCopy={tokenCopy} st7={storedText("ST-7")} st6={storedText("ST-6")} st1b={[{ kind: "text", text: PUBLIC_REQUEST_ASSURANCE }]} /></div></div>
            </section> },
          { key: "calculator-context", heading: "Know what your range means", content: <div className="grid gap-8"><div className={proseClasses} dangerouslySetInnerHTML={{ __html: publicMarketingHtml(page.outroHtml) }} />
            <nav aria-label="Related calculator guides" className="grid gap-4">
            <div className="rounded-card border border-border bg-surface-2 p-5">
              <p className="type-overline text-text-2">Read next</p>
              <ul className="mt-3 grid gap-1">
                {[
                  { href: "/moving-costs/", label: "How much do movers cost?" },
                  { href: "/moving-costs/how-movers-charge/", label: "How movers charge" },
                  { href: "/moving-cost-calculator/method/", label: "How this range is calculated" },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="link inline-flex min-h-11 items-center font-semibold">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-card mesh-navy p-5 text-on-band" data-band="">
              <p className="type-h4">Ready for real prices?</p>
              <p className="mt-1 text-on-band-2">Movers in our network quote your move directly. You choose how many can contact you.</p>
              <a href="/get-quotes/" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-white px-4 font-semibold text-brand-navy no-underline hover:bg-on-band-2">
                Request quotes
              </a>
            </div>
            </nav>
          </div> },
        ]} />
        <StoryNextSteps images={plan.images} usedCount={3} />
      </Container>
    </>
  );
}

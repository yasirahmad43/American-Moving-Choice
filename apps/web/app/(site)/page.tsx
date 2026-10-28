import { env } from "@amc/server/env";
import { Container, LinkButton, Section } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroZipForm } from "@/components/site/hero-zip-form";
import { JsonLd, organizationId } from "@/components/site/json-ld";
import { MoneyLine } from "@/components/site/money-line";
import { Note } from "@/components/site/review-notes";
import { storedText, storedTextParts } from "@/lib/stored-texts";

const TITLE = "Request Quotes from Movers, Not Brokers | American Moving Choice";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  // ST-1c: only the home, About and "How AMC makes money" pages carry it (site architecture §8.2).
  description: storedText("ST-1c"),
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: storedText("ST-1c"), url: "/", type: "website", siteName: "American Moving Choice" },
};

/** How it works: four stops that group the survey's steps (implications §2.1). */
const STEPS = [
  {
    title: "Tell us about your move",
    body: "Where you're moving from and to, when, and the size of your home. Nothing is filled in for you.",
    steps: "Where · When · Size and services",
  },
  {
    title: "See which movers cover it",
    body: "We check which movers in our network serve your route and show you what we found before we ask for any contact details. If none do, we say so and ask for nothing more.",
    steps: "What we found",
  },
  {
    title: "Choose how many can contact you",
    body: "You decide the most movers who can receive your details, from 1 up to the number available for your move.",
    steps: "Your details · How many movers",
  },
  {
    title: "Review every name, then send",
    body: "You see each mover by name and USDOT number, and you can remove any of them. Only the movers you send to can buy your request, and they contact you directly.",
    steps: "Review and send",
  },
];

const TRUST_LINKS = [
  { href: "/how-we-verify-movers/", title: "How we verify movers", body: "Every check we run, how often we recheck it, and what we don't check." },
  { href: "/movers-vs-brokers/", title: "Movers vs brokers", body: "The difference, how to read a company's FMCSA record, and why we work only with movers." },
  { href: "/which-companies-receive-my-request/", title: "Which companies receive my request", body: "Who can see your details, how many, and how to withdraw." },
  { href: "/advertising-disclosure/", title: "How AMC makes money", body: "Who pays us, how requests are priced to movers, and what payment never changes." },
  { href: "/review-methodology/", title: "How reviews work", body: "Who can leave a review, what each label means, and how we moderate." },
  { href: "/editorial-policy/", title: "Editorial policy", body: "Who writes and reviews our pages, how we cite sources, and how we use AI." },
];

const COST_LINKS = [
  { href: "/moving-costs/", title: "How much do movers cost?", body: "What drives the price of a move, and where our planning ranges come from." },
  { href: "/moving-cost-calculator/", title: "Moving cost calculator", body: "A planning range for your move, built from movers' rate cards. Not a quote." },
  { href: "/moving-costs/how-movers-charge/", title: "How movers charge", body: "Hourly and weight-based pricing, estimate types and the extra charges to ask about." },
];

const FAQ = [
  {
    q: "Does it cost anything to use American Moving Choice?",
    a: (
      <>
        No. You pay us nothing. Movers in our network pay us for the requests they buy. The price of your move is between you and the mover you
        hire, and some movers charge for some kinds of estimate, so ask each one.
      </>
    ),
  },
  {
    q: "Who receives my contact details?",
    a: (
      <>
        Only movers named on your Review and send screen, and never more than the number you choose. We never resell your request.{" "}
        <Link href="/which-companies-receive-my-request/" className="link">
          Which companies receive my request
        </Link>{" "}
        explains each step.
      </>
    ),
  },
  {
    q: "Do you give quotes or estimates?",
    a: (
      <>
        No. Movers contact you directly and give their own quotes. Our cost pages show planning ranges from movers&apos; rate cards, which aren&apos;t
        prices. Only a mover can price your move, in a written estimate.
      </>
    ),
  },
  {
    q: "What if no mover in your network covers my move?",
    a: <>We tell you on the What we found screen and don&apos;t ask for your contact details.</>,
  },
  {
    q: "Can I change my mind after I send a request?",
    a: (
      <>
        Yes. Your confirmation page has a link to withdraw your request. Withdrawing stops any more movers from buying it, and we tell the movers who
        already bought it. <Note kind="build">withdrawal link on the confirmation page and in the confirmation email; buyers notified (consent draft §6)</Note>
      </>
    ),
  },
];

function LinkCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group grid h-full content-start gap-1.5 rounded-card border border-border bg-surface p-5 text-text no-underline shadow-e1 transition-shadow duration-[var(--d1)] hover:shadow-e2"
      >
        <span className="type-h4 text-link underline-offset-[0.2em] group-hover:underline">{title}</span>
        <span className="text-text-2">{body}</span>
      </Link>
    </li>
  );
}

export default function HomePage() {
  const { WEB_URL } = env();
  const moversOnly = storedTextParts("ST-2");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${WEB_URL}/#website`,
          name: "American Moving Choice",
          url: `${WEB_URL}/`,
          publisher: { "@id": organizationId(WEB_URL) },
          inLanguage: "en-US",
        }}
      />

      {/* Hero: H1 → lede → survey entry → money line (VD §12, §13.1; implications §8.2). */}
      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:items-center lg:gap-12">
        <div className="grid max-w-[60ch] gap-4">
          <p className="type-overline text-text-2">Movers only · No brokers</p>
          <h1 className="type-display-xl text-text">Request quotes from moving companies, not brokers</h1>
          <p className="type-lede text-text-2">
            Tell us where you&apos;re moving. We show you which movers in our network cover your route, you choose how many can contact you, and you
            see every mover&apos;s name before you send anything.
          </p>
        </div>
        <div className="rounded-shell border border-border bg-surface-2 p-1.5 shadow-e2">
          <div className="rounded-shell-inner bg-surface p-5 sm:p-7">
            <HeroZipForm moneyLine={<MoneyLine />} />
          </div>
        </div>
      </Container>

      <Section tone="alt" aria-labelledby="how-it-works">
        <div className="grid gap-8">
          <div className="grid max-w-[60ch] gap-2">
            <h2 id="how-it-works" className="type-display-l text-text">
              How it works
            </h2>
            <p className="type-lede text-text-2">Four stops, in the order our quote survey asks them.</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="grid content-start gap-2 rounded-card border border-border bg-surface p-5">
                <span className="inline-grid size-9 place-items-center rounded-pill bg-primary font-bold tabular text-on-primary" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="type-h4 text-text">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-text-2">{step.body}</p>
                <p className="type-small text-text-3">Survey steps: {step.steps}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section aria-labelledby="what-is-different">
        <div className="grid gap-8">
          <h2 id="what-is-different" className="type-display-l max-w-[60ch] text-text">
            What&apos;s different here
          </h2>
          <ul className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <li className="grid content-start gap-1.5">
              <h3 className="type-h4 text-text">Movers only, no brokers</h3>
              <p className="text-text-2">
                {moversOnly.map((part, index) =>
                  part.kind === "text" ? (
                    <span key={index}>{part.text.replace(/^Movers only, no brokers\.\s*/, "")}</span>
                  ) : (
                    <Link key={index} href="/how-we-verify-movers/" className="link">
                      {part.label}
                    </Link>
                  ),
                )}
              </p>
            </li>
            <li className="grid content-start gap-1.5">
              <h3 className="type-h4 text-text">You choose how many</h3>
              <p className="text-text-2">
                You set the most movers who can receive your details. Choose 1 and only one mover can ever receive them from us. Nothing is
                preselected.
              </p>
            </li>
            <li className="grid content-start gap-1.5">
              <h3 className="type-h4 text-text">Every mover named before you send</h3>
              <p className="text-text-2">
                Your Review and send screen lists each mover by name and USDOT number. Remove any of them; only the movers left can buy your request.
              </p>
            </li>
            <li className="grid content-start gap-1.5">
              <h3 className="type-h4 text-text">Movers pay us, not you</h3>
              <p className="text-text-2">
                Movers in our network pay us for the requests they buy, and payment never changes their screening, ratings or order.{" "}
                <Link href="/advertising-disclosure/" className="link">
                  How AMC makes money
                </Link>
              </p>
            </li>
            <li className="grid content-start gap-1.5">
              <h3 className="type-h4 text-text">Reviews tied to real requests</h3>
              <p className="text-text-2">
                Only people whose request a mover bought through us can review that mover, and each review says what was checked.{" "}
                <Link href="/review-methodology/" className="link">
                  How reviews work
                </Link>
              </p>
            </li>
          </ul>
        </div>
      </Section>

      <Section tone="alt" aria-labelledby="how-we-work">
        <div className="grid gap-6">
          <div className="grid max-w-[60ch] gap-2">
            <h2 id="how-we-work" className="type-display-l text-text">
              How we work
            </h2>
            <p className="type-lede text-text-2">The rules we follow, written down so you can check them.</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_LINKS.map((link) => (
              <LinkCard key={link.href} {...link} />
            ))}
          </ul>
        </div>
      </Section>

      <Section aria-labelledby="moving-costs">
        <div className="grid gap-6">
          <div className="grid max-w-[60ch] gap-2">
            <h2 id="moving-costs" className="type-display-l text-text">
              Plan your moving costs
            </h2>
            <p className="type-lede text-text-2">
              Movers set their own prices. These pages explain how they charge and show planning ranges where enough movers have shared their rates.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COST_LINKS.map((link) => (
              <LinkCard key={link.href} {...link} />
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="band" aria-labelledby="for-movers">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="grid max-w-[60ch] gap-2">
            <h2 id="for-movers" className="type-display-l">
              Are you a moving company?
            </h2>
            <p className="type-lede text-on-band-2">
              Our network is for household-goods carriers only. See who can join, how requests reach you and how pricing works before you apply.
            </p>
          </div>
          <div>
            <Link
              href="/for-movers/"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-white px-5 font-semibold text-brand-navy no-underline hover:bg-on-band-2"
            >
              Information for movers
            </Link>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="questions">
        <div className="grid max-w-[72ch] gap-6">
          <h2 id="questions" className="type-display-l text-text">
            Questions
          </h2>
          <div className="grid gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-control border border-border bg-surface px-4">
                <summary className="flex min-h-12 items-center justify-between gap-3 py-3 font-semibold text-text [&::-webkit-details-marker]:hidden">
                  <h3 className="type-h4">{item.q}</h3>
                  <span aria-hidden="true" className="text-text-3 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-4 text-text-2">{item.a}</div>
              </details>
            ))}
          </div>
          <div>
            <LinkButton href="/get-quotes/" variant="secondary">
              Start a quote request
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}

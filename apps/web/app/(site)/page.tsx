import { env } from "@amc/server/env";
import {
  Bento,
  BentoCell,
  CalendarIcon,
  CheckCircleIcon,
  ExpandableCard,
  FlipCard,
  IdCardIcon,
  InfoIcon,
  LedgerStrip,
  LinkButton,
  MediaHero,
  Reveal,
  RouteMark,
  Section,
  SectionHeader,
  StickyCta,
  Timeline,
  TrustStrip,
} from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { HeroZipForm } from "@/components/site/hero-zip-form";
import { JsonLd, organizationId } from "@/components/site/json-ld";
import { MoneyLine } from "@/components/site/money-line";
import { Note } from "@/components/site/review-notes";
import { PLATFORM_SETTING_DEFAULTS } from "@/lib/content/tokens";
import { claimMedia, claimMediaById } from "@/lib/media";
import { storedText, storedTextParts } from "@/lib/stored-texts";

const PAGE = "/";
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
    meta: "Survey steps: Where · When · Size and services",
  },
  {
    title: "See which movers cover it",
    body: "We check which movers in our network serve your route and show you what we found before we ask for any contact details. If none do, we say so and ask for nothing more.",
    meta: "Survey step: What we found",
  },
  {
    title: "Choose how many can contact you",
    body: "You decide the most movers who can receive your details, from 1 up to the number available for your move.",
    meta: "Survey steps: Your details · How many movers",
  },
  {
    title: "Review every name, then send",
    body: "You see each mover by name and USDOT number, and you can remove any of them. Only the movers you send to can buy your request, and they contact you directly.",
    meta: "Survey step: Review and send",
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

const COST_CARDS = [
  {
    href: "/moving-costs/",
    title: "How much do movers cost?",
    front: "What drives the price of a move, and where our planning ranges come from.",
    back: "Distance, home size, date and access drive most of the price. Our ranges come from movers' own rate cards, never from estimates we invent.",
    link: "Read the cost guide",
  },
  {
    href: "/moving-cost-calculator/",
    title: "Moving cost calculator",
    front: "A planning range for your move, built from movers' rate cards. Not a quote.",
    back: "A range appears only when enough different movers have shared recent rates for a move like yours. Otherwise we say so instead of guessing.",
    link: "Open the calculator",
  },
  {
    href: "/moving-costs/how-movers-charge/",
    title: "How movers charge",
    front: "Hourly and weight-based pricing, estimate types and the extra charges to ask about.",
    back: "Local moves usually bill by the hour; long-distance moves by weight and distance. Binding, non-binding and not-to-exceed estimates mean different things.",
    link: "See how movers charge",
  },
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

/** A sample of the evidence ledger every listed mover carries. Zeros so it can't match a real carrier (VD §2). */
const SAMPLE_LEDGER = [
  { label: "USDOT number", value: "0000000 · Active", source: "FMCSA company snapshot", when: "Checked weekly", status: "pass" as const },
  { label: "Operating authority", value: "Household-goods carrier", source: "FMCSA Licensing and Insurance", when: "Checked weekly", status: "pass" as const },
  { label: "Broker authority", value: "None on record", source: "FMCSA Licensing and Insurance", when: "Checked weekly", status: "pass" as const },
  { label: "Insurance filings", value: "On file", source: "FMCSA Licensing and Insurance", when: "Checked weekly", status: "pass" as const },
  { label: "Phone on the official record", value: "Confirmed by call", source: "Our verification team", when: "At approval", status: "info" as const },
];

export default function HomePage() {
  const { WEB_URL } = env();
  const moversOnly = storedTextParts("ST-2");
  // Media claims (lib/media.ts): the home hero loop, the how-it-works loop, a quotes still and a costs still.
  const hero = claimMediaById(PAGE, "home-hero-crew-loading-golden-hour");
  const howItWorksArt = claimMediaById(PAGE, "how-it-works-laptop-boxes");
  const ledgerArt = claimMedia(PAGE, ["home", "comparison"]);
  const costsArt = claimMedia(PAGE, ["costs", "theme:pricing", "landscape"]);
  const maxMovers = PLATFORM_SETTING_DEFAULTS.max_sharing_limit;

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

      {/* Hero: Editorial Split over full-bleed media; the survey entry is the one job on screen (VD §13.1). */}
      <MediaHero
        media={<MediaFrame asset={hero} priority />}
        overline="Movers only · No brokers"
        title="Request quotes from moving companies, not brokers"
        lede="Tell us where you're moving. We show you which movers in our network cover your route, you choose how many can contact you, and you see every mover's name before you send anything."
        panel={<HeroZipForm moneyLine={<MoneyLine />} />}
        panelId="hero-form"
        actions={
          <Link href="/how-we-verify-movers/" className="inline-flex min-h-11 items-center gap-2 text-on-band underline underline-offset-[0.25em] decoration-on-band-2/60 hover:decoration-on-band">
            <IdCardIcon size={18} />
            How every mover is checked
          </Link>
        }
      />

      {/* Trust statements: four facts, no counters (VD §13.1). */}
      <Section className="!pt-10 !pb-10 sm:!pt-14 sm:!pb-14" aria-label="What we stand on">
        <Reveal>
          <TrustStrip
            items={[
              { icon: <IdCardIcon size={22} />, title: "Movers only", body: "Every company holds active household-goods carrier authority and no broker authority on its federal record." },
              { icon: <CheckCircleIcon size={22} />, title: "Checked credentials", body: "USDOT, MC, authority and insurance filings matched to FMCSA records, rechecked every week, dated on each profile." },
              { icon: <InfoIcon size={22} />, title: "Your number, your call", body: `You choose how many movers can contact you, from 1 to ${maxMovers}. Nothing is preselected.` },
              { icon: <CalendarIcon size={22} />, title: "Free to request", body: "Movers pay us to receive requests. Payment never changes their screening, ratings or order." },
            ]}
          />
        </Reveal>
      </Section>

      {/* How it works: the route line draws itself across four stops (the one storytelling moment). */}
      <Section tone="alt" aria-labelledby="how-it-works">
        <div className="grid gap-12">
          <Reveal>
            <SectionHeader
              id="how-it-works"
              overline="How it works"
              title="Four stops, in the order our survey asks them"
              lede="Nothing goes to any mover until the last stop. Going back a step keeps your answers."
              action={
                <LinkButton href="/get-quotes/" variant="secondary">
                  Start a quote request
                </LinkButton>
              }
            />
          </Reveal>
          <Reveal delay={80}>
            <Timeline steps={STEPS} />
          </Reveal>
          <Reveal delay={120} className="zoom-media relative aspect-[21/9] overflow-hidden rounded-card ring-1 ring-border lg:aspect-[3/1]">
            <MediaFrame asset={howItWorksArt} sizes="(min-width: 1280px) 75rem, 100vw" />
            <p className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-pill bg-surface/90 px-3 py-1.5 type-small font-semibold text-text">
              <RouteMark size={12} /> Start with where you&apos;re moving. Nothing is sent until the last stop.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* What's different: a dense bento, 8+4 then 4+4+4, no empty cells. */}
      <Section aria-labelledby="what-is-different">
        <div className="grid gap-10">
          <Reveal>
            <SectionHeader id="what-is-different" overline="What's different here" title="The rules that make this a marketplace you can check" />
          </Reveal>
          <Reveal delay={60}>
            <Bento as="ul">
              <BentoCell as="li" span={8} tone="alt" className="grid content-between gap-8">
                <div className="grid gap-3">
                  <h3 className="type-h3 text-text">Movers only, no brokers</h3>
                  <p className="max-w-[60ch] text-text-2">
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
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 type-small text-text-3">
                  <span className="inline-flex items-center gap-2">
                    <RouteMark size={14} /> Routes are directional
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <IdCardIcon size={16} /> Checks are dated
                  </span>
                </div>
              </BentoCell>
              <BentoCell as="li" span={4} tone="navy" className="grid content-between gap-6">
                <p className="font-display text-[4.5rem] leading-none font-black tabular text-on-band [font-stretch:75%]">
                  1<span className="text-[#ff5a5f]">–</span>
                  {maxMovers}
                </p>
                <div className="grid gap-1.5">
                  <h3 className="type-h3 text-on-band">You choose how many</h3>
                  <p className="text-on-band-2">You set the most movers who can receive your details. Choose 1 and only one mover can ever receive them from us.</p>
                </div>
              </BentoCell>
              <BentoCell as="li" span={4} className="grid content-start gap-2">
                <h3 className="type-h4 text-text">Every mover named before you send</h3>
                <p className="text-text-2">Your Review and send screen lists each mover by name and USDOT number. Remove any of them; only the movers left can buy your request.</p>
              </BentoCell>
              <BentoCell as="li" span={4} className="grid content-start gap-2">
                <h3 className="type-h4 text-text">Movers pay us, not you</h3>
                <p className="text-text-2">
                  Movers in our network pay us for the requests they buy, and payment never changes their screening, ratings or order.{" "}
                  <Link href="/advertising-disclosure/" className="link">
                    How AMC makes money
                  </Link>
                </p>
              </BentoCell>
              <BentoCell as="li" span={4} className="grid content-start gap-2">
                <h3 className="type-h4 text-text">Reviews tied to real requests</h3>
                <p className="text-text-2">
                  Only people whose request a mover bought through us can review that mover, and each review says what was checked.{" "}
                  <Link href="/review-methodology/" className="link">
                    How reviews work
                  </Link>
                </p>
              </BentoCell>
            </Bento>
          </Reveal>
        </div>
      </Section>

      {/* Evidence on the surface: a sample ledger next to the explanation (VD §3, §13.1). */}
      <Section tone="alt" aria-labelledby="evidence">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <Reveal className="grid gap-5">
            <SectionHeader id="evidence" overline="Evidence on the surface" title="What a check looks like on every profile" lede="Each listed mover carries a dated ledger: what we checked, where the record comes from and when we last looked. If we can't show the evidence, we don't make the claim." />
            <div className="zoom-media relative aspect-[3/2] max-w-[26rem] overflow-hidden rounded-card ring-1 ring-border">
              <MediaFrame asset={ledgerArt} sizes="(min-width: 1024px) 26rem, 100vw" />
            </div>
            <div>
              <LinkButton href="/how-we-verify-movers/" variant="primary">
                How we verify movers
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <LedgerStrip title="Evidence ledger" sampleLabel="Sample" route={{ from: "Origin", to: "Destination" }} rows={SAMPLE_LEDGER} />
          </Reveal>
        </div>
      </Section>

      {/* Costs: three flip cards with the guide behind each. */}
      <Section aria-labelledby="moving-costs">
        <div className="grid gap-10">
          <Reveal>
            <SectionHeader
              id="moving-costs"
              overline="Plan your moving costs"
              title="Movers set their own prices. We show where the ranges come from."
              lede="These pages explain how movers charge and show planning ranges only where enough movers have shared their rates."
            />
          </Reveal>
          <ul className="grid gap-5 md:grid-cols-3">
            {COST_CARDS.map((card, index) => (
              <Reveal as="li" key={card.href} delay={index * 70} className="min-w-0">
                <FlipCard
                  toggleLabel={`More about ${card.title.toLowerCase()}`}
                  minHeight="19rem"
                  front={
                    <div className="grid gap-4">
                      {index === 0 ? (
                        <div className="zoom-media relative aspect-[3/2] overflow-hidden rounded-control ring-1 ring-border">
                          <MediaFrame asset={costsArt} sizes="(min-width: 768px) 30vw, 100vw" />
                        </div>
                      ) : null}
                      <h3 className="type-h3 text-text">{card.title}</h3>
                      <p className="text-text-2">{card.front}</p>
                    </div>
                  }
                  back={
                    <div className="grid gap-4">
                      <h3 className="type-h4 text-text">{card.title}</h3>
                      <p className="text-text-2">{card.back}</p>
                      <Link href={card.href} className="link font-semibold">
                        {card.link}
                      </Link>
                    </div>
                  }
                />
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* How we work: the written rules, expandable in place. */}
      <Section tone="alt" aria-labelledby="how-we-work">
        <div className="grid gap-10">
          <Reveal>
            <SectionHeader id="how-we-work" overline="How we work" title="The rules we follow, written down so you can check them" />
          </Reveal>
          <ul className="grid gap-4 md:grid-cols-2">
            {TRUST_LINKS.map((link, index) => (
              <Reveal as="li" key={link.href} delay={(index % 2) * 60} className="min-w-0">
                <ExpandableCard title={link.title} name="how-we-work">
                  <p>{link.body}</p>
                  <p className="mt-3">
                    <Link href={link.href} className="link font-semibold">
                      Read {link.title}
                    </Link>
                  </p>
                </ExpandableCard>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* For moving companies: the navy band with a white button (red never sits on navy). */}
      <Section tone="band" aria-labelledby="for-movers" className="mesh-navy">
        <Reveal className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <SectionHeader
            tone="band"
            id="for-movers"
            overline="For moving companies"
            title="Buy only the requests you want, from people who chose to hear from you"
            lede="Our network is for household-goods carriers only. See who can join, how requests reach you and how pricing works before you apply."
          />
          <div className="flex flex-wrap gap-3">
            <Link href="/for-movers/" className="inline-flex min-h-12 items-center justify-center rounded-control bg-white px-6 font-semibold text-brand-navy no-underline transition-colors duration-[var(--d1)] hover:bg-on-band-2">
              Information for movers
            </Link>
            <Link href="/for-movers/pricing/" className="inline-flex min-h-12 items-center justify-center rounded-control px-4 font-semibold text-on-band no-underline ring-1 ring-white/30 hover:bg-white/10">
              Pricing and buying rules
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* Questions */}
      <Section aria-labelledby="questions">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <SectionHeader id="questions" overline="Questions" title="Straight answers before you start" lede="Everything here is also in the survey itself, step by step." action={null} />
            <div className="mt-6">
              <LinkButton href="/get-quotes/" variant="secondary">
                Start a quote request
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={80} className="grid gap-3">
            {FAQ.map((item) => (
              <ExpandableCard key={item.q} title={item.q} name="home-faq">
                <p>{item.a}</p>
              </ExpandableCard>
            ))}
          </Reveal>
        </div>
      </Section>

      <StickyCta href="/get-quotes/" label="Get quotes" watch="hero-form" note="Movers only · No brokers" />
    </>
  );
}

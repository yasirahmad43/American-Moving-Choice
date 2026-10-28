import { env } from "@amc/server/env";
import { Bento, BentoCell, ExpandableCard, Icon3D, IdCardIcon, LedgerStrip, LineIcon, LinkButton, MediaHero, Reveal, RouteMark, Section, SectionHeader, StickyCta, TiltCard, TrustStrip } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { Words } from "@/components/motion/motion-provider";
import { HeroZipForm } from "@/components/site/hero-zip-form";
import { HowItWorks } from "@/components/site/how-it-works";
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
    icon: "origin" as const,
    title: "Tell us about your move",
    body: "Where you're moving from and to, when, and the size of your home. Nothing is filled in for you.",
    meta: "Survey steps: Where · When · Size and services",
  },
  {
    icon: "route" as const,
    title: "See which movers cover it",
    body: "We check which movers in our network serve your route and show you what we found before we ask for any contact details. If none do, we say so and ask for nothing more.",
    meta: "Survey step: What we found",
  },
  {
    icon: "chat" as const,
    title: "Choose how many can contact you",
    body: "You decide the most movers who can receive your details, from 1 up to the number available for your move.",
    meta: "Survey steps: Your details · How many movers",
  },
  {
    icon: "verified" as const,
    title: "Review every name, then send",
    body: "You see each mover by name and USDOT number, and you can remove any of them. Only the movers you send to can buy your request, and they contact you directly.",
    meta: "Survey step: Review and send",
  },
];

const TRUST_LINKS = [
  { href: "/how-we-verify-movers/", title: "How we verify movers", body: "Every check we run, how often we recheck it, and what we don't check.", icon: "verified" as const },
  { href: "/movers-vs-brokers/", title: "Movers vs brokers", body: "The difference, how to read a company's FMCSA record, and why we work only with movers.", icon: "credentials" as const },
  { href: "/which-companies-receive-my-request/", title: "Which companies receive my request", body: "Who can see your details, how many, and how to withdraw.", icon: "locked" as const },
  { href: "/advertising-disclosure/", title: "How AMC makes money", body: "Who pays us, how requests are priced to movers, and what payment never changes.", icon: "price" as const },
  { href: "/review-methodology/", title: "How reviews work", body: "Who can leave a review, what each label means, and how we moderate.", icon: "star" as const },
  { href: "/editorial-policy/", title: "Editorial policy", body: "Who writes and reviews our pages, how we cite sources, and how we use AI.", icon: "ledger" as const },
];

const COST_CARDS = [
  {
    href: "/moving-cost-calculator/",
    icon: "calculator" as const,
    title: "Moving cost calculator",
    body: "A planning range for your move, built from movers' rate cards. A range appears only when enough different movers have shared recent rates for a move like yours; otherwise we say so instead of guessing.",
    link: "Open the calculator",
  },
  {
    href: "/moving-costs/",
    icon: "price" as const,
    title: "How much do movers cost?",
    body: "Distance, home size, date and access drive most of the price. Our ranges come from movers' own rate cards, never from estimates we invent.",
    link: "Read the cost guide",
  },
  {
    href: "/moving-costs/how-movers-charge/",
    icon: "ledger" as const,
    title: "How movers charge",
    body: "Local moves usually bill by the hour; long-distance moves by weight and distance. Binding, non-binding and not-to-exceed estimates mean different things.",
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
        title={"Request quotes from\nmoving companies,\nnot brokers"}
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

      {/* Trust statements: four facts with 3D icons that wake in sequence, no counters (VD §13.1). */}
      <Section className="!pt-12 !pb-12 sm:!pt-16 sm:!pb-16" aria-label="What we stand on">
        <Reveal>
          <TrustStrip
            items={[
              { icon3d: "verified", title: "Movers only", body: "Every company holds active household-goods carrier authority and no broker authority on its federal record." },
              { icon3d: "credentials", title: "Checked credentials", body: "USDOT, MC, authority and insurance filings matched to FMCSA records, rechecked every week, dated on each profile." },
              { icon3d: "chat", title: "Your number, your call", body: `You choose how many movers can contact you, from 1 to ${maxMovers}. Nothing is preselected.` },
              { icon3d: "price", title: "Free to request", body: "Movers pay us to receive requests. Payment never changes their screening, ratings or order." },
            ]}
          />
        </Reveal>
      </Section>

      {/* How it works: pinned, scrubbed route sequence (desktop), vertical route on phones. */}
      <HowItWorks id="how-it-works" overline="How it works" title="Four stops, in the order our survey asks them" lede="Nothing goes to any mover until the last stop. Going back a step keeps your answers." stops={STEPS} />

      {/* A wide still with a parallax layer bridges the sequence and the rules. */}
      <section aria-hidden="true" className="relative isolate overflow-hidden bg-surface-2">
        <div className="relative mx-auto aspect-[21/9] max-w-content overflow-hidden rounded-t-card lg:aspect-[3/1]">
          <div className="absolute inset-[-14%_0]" data-parallax="0.14">
            <MediaFrame asset={howItWorksArt} sizes="(min-width: 1280px) 75rem, 100vw" />
          </div>
          <p className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-pill glass px-3.5 py-2 type-small font-semibold text-text">
            <RouteMark size={12} /> Start with where you&apos;re moving. Nothing is sent until the last stop.
          </p>
        </div>
      </section>

      {/* What's different: a dense bento, 8+4 then 4+4+4, no empty cells, every cell a tilt card. */}
      <Section aria-labelledby="what-is-different">
        <div className="grid gap-12">
          <div data-motion="rise">
            <SectionHeader id="what-is-different" overline="What's different here" title="The rules that make this a marketplace you can check" />
          </div>
          <Bento as="ul" className="[&>li]:contents" data-motion="stagger">
            <li className="md:col-span-8">
              <TiltCard max={5} depth={20} padding="lg" tone="surface" className="h-full" bodyClassName="grid h-full content-between gap-8">
                <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-8">
                  <Icon3D name="credentials" size={88} float className="tilt-layer-2" />
                  <div className="grid gap-3 tilt-layer">
                    <h3 className="type-display-l text-text">Movers only, no brokers</h3>
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
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 type-small text-text-3 tilt-layer">
                  <span className="inline-flex items-center gap-2">
                    <RouteMark size={14} /> Routes are directional
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <LineIcon name="calendar" size={16} /> Checks are dated
                  </span>
                </div>
              </TiltCard>
            </li>
            <li className="md:col-span-4">
              <TiltCard max={7} depth={28} padding="lg" tone="navy" className="h-full" bodyClassName="grid h-full content-between gap-8">
                <p className="font-display text-[5.5rem] leading-none font-black tabular text-on-band tilt-layer-2 [font-stretch:75%]">
                  1<span className="text-[#ff5a5f]">–</span>
                  {maxMovers}
                </p>
                <div className="grid gap-1.5 tilt-layer">
                  <h3 className="type-h3 text-on-band">You choose how many</h3>
                  <p className="text-on-band-2">You set the most movers who can receive your details. Choose 1 and only one mover can ever receive them from us.</p>
                </div>
              </TiltCard>
            </li>
            {[
              { icon: "verified" as const, title: "Every mover named before you send", body: "Your Review and send screen lists each mover by name and USDOT number. Remove any of them; only the movers left can buy your request.", link: null },
              { icon: "price" as const, title: "Movers pay us, not you", body: "Movers in our network pay us for the requests they buy, and payment never changes their screening, ratings or order.", link: { href: "/advertising-disclosure/", label: "How AMC makes money" } },
              { icon: "star" as const, title: "Reviews tied to real requests", body: "Only people whose request a mover bought through us can review that mover, and each review says what was checked.", link: { href: "/review-methodology/", label: "How reviews work" } },
            ].map((cell) => (
              <li key={cell.title} className="md:col-span-4">
                <TiltCard max={8} depth={18} className="h-full" bodyClassName="grid h-full content-start gap-4">
                  <Icon3D name={cell.icon} size={52} className="tilt-layer-2" />
                  <h3 className="type-h4 text-text tilt-layer">{cell.title}</h3>
                  <p className="text-text-2 tilt-layer">
                    {cell.body}
                    {cell.link ? (
                      <>
                        {" "}
                        <Link href={cell.link.href} className="link">
                          {cell.link.label}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </TiltCard>
              </li>
            ))}
          </Bento>
        </div>
      </Section>

      {/* Evidence on the surface: a sample ledger with its stamp next to the explanation (VD §3, §13.1). */}
      <Section tone="alt" aria-labelledby="evidence" className="mesh-drift mesh-drift-light">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div className="grid gap-6" data-motion="rise">
            <SectionHeader id="evidence" overline="Evidence on the surface" title="What a check looks like on every profile" />
            <p className="type-lede max-w-[56ch] text-text-2" data-motion="words">
              <Words text="Each listed mover carries a dated ledger: what we checked, where the record comes from and when we last looked. If we can't show the evidence, we don't make the claim." />
            </p>
            <figure className="zoom-media relative aspect-[3/2] max-w-[26rem] overflow-hidden rounded-card ring-1 ring-border depth-2">
              <div className="absolute inset-[-10%_0]" data-parallax="0.08">
                <MediaFrame asset={ledgerArt} sizes="(min-width: 1024px) 26rem, 100vw" />
              </div>
            </figure>
            <div>
              <LinkButton href="/how-we-verify-movers/" variant="primary" data-magnetic="">
                How we verify movers
              </LinkButton>
            </div>
          </div>
          <div className="relative" data-motion="scale">
            <span className="stamp absolute -top-4 right-6 z-[1]" data-stamp="">
              <LineIcon name="check" size={16} /> Checked weekly
            </span>
            <LedgerStrip title="Evidence ledger" sampleLabel="Sample" route={{ from: "Origin", to: "Destination" }} rows={SAMPLE_LEDGER} className="depth-2" />
          </div>
        </div>
      </Section>

      {/* Costs: one photo-led card and two stacked, each a tilt card with its own 3D icon. */}
      <Section aria-labelledby="moving-costs">
        <div className="grid gap-12">
          <div data-motion="rise">
            <SectionHeader
              id="moving-costs"
              overline="Plan your moving costs"
              title="Movers set their own prices. We show where the ranges come from."
              lede="These pages explain how movers charge and show planning ranges only where enough movers have shared their rates."
            />
          </div>
          <ul className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" data-motion="stagger">
            <li className="min-w-0">
              <TiltCard as="div" max={5} depth={22} padding="none" className="h-full" bodyClassName="grid h-full overflow-hidden">
                <Link href={COST_CARDS[0]!.href} className="group grid h-full content-between gap-6 no-underline">
                  <div className="zoom-media relative aspect-[16/9] overflow-hidden">
                    <MediaFrame asset={costsArt} sizes="(min-width: 1024px) 44rem, 100vw" />
                    <Icon3D name="calculator" size={96} float className="absolute bottom-4 right-5 tilt-layer-2" />
                  </div>
                  <div className="grid gap-3 p-6 pt-0 sm:p-8 sm:pt-0 tilt-layer">
                    <h3 className="type-display-l text-text">{COST_CARDS[0]!.title}</h3>
                    <p className="max-w-[56ch] text-text-2">{COST_CARDS[0]!.body}</p>
                    <span className="inline-flex items-center gap-2 font-semibold text-link group-hover:underline">
                      {COST_CARDS[0]!.link}
                      <span className="inline-grid size-8 place-items-center rounded-pill bg-info-bg text-info-text transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-1">
                        <LineIcon name="arrow-right" size={16} />
                      </span>
                    </span>
                  </div>
                </Link>
              </TiltCard>
            </li>
            <li className="grid min-w-0 gap-5">
              {COST_CARDS.slice(1).map((card) => (
                <TiltCard key={card.href} max={8} depth={18} className="h-full" bodyClassName="grid h-full content-start gap-4">
                  <Link href={card.href} className="group grid gap-4 no-underline">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="type-h3 text-text tilt-layer">{card.title}</h3>
                      <Icon3D name={card.icon} size={56} className="tilt-layer-2 shrink-0" />
                    </div>
                    <p className="text-text-2 tilt-layer">{card.body}</p>
                    <span className="inline-flex items-center gap-2 font-semibold text-link group-hover:underline tilt-layer">
                      {card.link}
                      <LineIcon name="arrow-right" size={16} className="transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-1" />
                    </span>
                  </Link>
                </TiltCard>
              ))}
            </li>
          </ul>
        </div>
      </Section>

      {/* How we work: a sticky editorial header beside the written rules, each with its icon. */}
      <Section tone="alt" aria-labelledby="how-we-work">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-8 lg:self-start" data-motion="rise">
            <SectionHeader id="how-we-work" overline="How we work" title="The rules we follow, written down so you can check them" lede="Six short pages. Each one says what we do, what we don't, and what to do if we get it wrong." />
          </div>
          <ul className="grid gap-3" data-motion="stagger">
            {TRUST_LINKS.map((link) => (
              <li key={link.href} className="min-w-0">
                <ExpandableCard title={link.title} name="how-we-work" leading={<Icon3D name={link.icon} size={40} />}>
                  <p>{link.body}</p>
                  <p className="mt-3">
                    <Link href={link.href} className="link font-semibold">
                      Read {link.title}
                    </Link>
                  </p>
                </ExpandableCard>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* For moving companies: the navy band with a white button (red never sits on navy). */}
      <Section tone="band" aria-labelledby="for-movers" className="mesh-navy mesh-drift grain">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end" data-motion="rise">
          <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <Icon3D name="megaphone" size={96} float className="hidden sm:block" />
            <SectionHeader
              tone="band"
              id="for-movers"
              overline="For moving companies"
              title="Buy only the requests you want, from people who chose to hear from you"
              lede="Our network is for household-goods carriers only. See who can join, how requests reach you and how pricing works before you apply."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/for-movers/" data-magnetic="" className="btn-depth inline-flex min-h-12 items-center justify-center rounded-control bg-white px-6 font-semibold text-brand-navy no-underline transition-colors duration-[var(--d1)] hover:bg-on-band-2">
              Information for movers
            </Link>
            <Link href="/for-movers/pricing/" data-magnetic="" className="inline-flex min-h-12 items-center justify-center rounded-control px-4 font-semibold text-on-band no-underline ring-1 ring-white/30 hover:bg-white/10">
              Pricing and buying rules
            </Link>
          </div>
        </div>
      </Section>

      {/* Questions */}
      <Section aria-labelledby="questions">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div data-motion="rise">
            <SectionHeader id="questions" overline="Questions" title="Straight answers before you start" lede="Everything here is also in the survey itself, step by step." action={null} />
            <div className="mt-6">
              <LinkButton href="/get-quotes/" variant="secondary" data-magnetic="">
                Start a quote request
              </LinkButton>
            </div>
          </div>
          <div className="grid gap-3" data-motion="stagger">
            {FAQ.map((item) => (
              <ExpandableCard key={item.q} title={item.q} name="home-faq">
                <p>{item.a}</p>
              </ExpandableCard>
            ))}
          </div>
        </div>
      </Section>

      <StickyCta href="/get-quotes/" label="Get quotes" watch="hero-form" note="Movers only · No brokers" />
    </>
  );
}

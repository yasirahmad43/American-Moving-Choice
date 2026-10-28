import { env } from "@amc/server/env";
import { Bento, BentoCell, Breadcrumbs, Container, ExpandableCard, MediaHero, Reveal, Section, SectionHeader, Timeline, TrustStrip } from "@amc/ui";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { ApplyCta, ForMoversNav } from "@/components/site/for-movers";
import { JsonLd, breadcrumbListLd, webPageLd } from "@/components/site/json-ld";
import { pageMetadata } from "@/components/site/page-meta";
import { Note, Token } from "@/components/site/review-notes";
import { claimMedia } from "@/lib/media";
import { storedTextParts } from "@/lib/stored-texts";

const URL = "/for-movers/";
const TITLE = "Moving Leads for Carriers: Exclusive & Shared | American Moving Choice";
const DESCRIPTION =
  "A movers-only network: household-goods carriers with no broker authority buy move requests from consumers who chose how many movers may contact them.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

const REQUEST_STEPS = [
  { title: "A consumer enters their move", body: "We match it against each mover's coverage and capabilities, using published rules. Nothing is pre-sold." },
  {
    title: "They choose how many movers may contact them",
    body: (
      <>
        The consumer sees the number of eligible movers and chooses the most who may contact them (1 to <Token k="setting.max_movers" />).
        Company names aren't displayed in the survey.
      </>
    ),
  },
  {
    title: "You see a preview and decide",
    body: (
      <>
        Only eligible movers recorded for the request can buy it, within the consumer&apos;s chosen limit. You see a preview without contact details, and you have{" "}
        <Token k="setting.sale_window_hours" /> hours to decide.
      </>
    ),
  },
  { title: "You buy, introduce yourself, and follow up", body: "Contact details appear after purchase and the lead lands in your private pipeline. Clearly identify your company when you contact the consumer, using only their selected channels." },
];

const VERIFY_STEPS = [
  { title: "Apply", body: "Your USDOT and MC numbers, business details and the areas and move types you serve." },
  { title: "Federal record check", body: "Active registration, household-goods carrier authority, no broker authority and the required insurance filings." },
  { title: "Phone confirmation", body: "We call the number on your official record to confirm the application, and check any state credentials." },
  { title: "Review and approval", body: "Our team reviews the results. Once approved, you can buy leads. We recheck federal records every week." },
];

const FAQ = [
  {
    q: "Can brokers or lead resellers join?",
    a: "No. Companies with broker authority, including dual carrier and broker registrations, can't join. Approval is based on our screening, not paid promotion.",
  },
  {
    q: "Do other movers see my prices?",
    a: "No. Your prices are set per company and stay private.",
  },
  {
    q: "Is there a subscription or a minimum?",
    a: "No. Your card is charged when you buy a lead. There are no subscriptions or minimum spends.",
  },
  {
    q: "What happens when a shared lead sells to more movers?",
    a: "Your price steps down as more movers buy it, and you get the difference back as account credit automatically.",
  },
];

export default function ForMoversPage() {
  const { WEB_URL, APP_URL } = env();
  const moversOnly = storedTextParts("ST-2");
  const art = claimMedia(URL, ["for-movers", "theme:fleet", "landscape"]);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "For movers", href: URL },
  ];
  return (
    <>
      <JsonLd data={breadcrumbListLd(WEB_URL, crumbs)} />
      <JsonLd data={webPageLd(WEB_URL, { url: URL, name: "Moving leads for household-goods carriers", description: DESCRIPTION })} />

      <MediaHero
        media={<MediaFrame asset={art} priority />}
        overline="For moving companies"
        title="Moving leads. Matched to your coverage."
        lede="Consumers tell us about their move and choose how many movers may contact them. We match requests to your approved coverage. Review the move, buy the requests you want, and introduce your company when you follow up."
        actions={
          <>
            <a href={`${APP_URL}/signup`} className="inline-flex min-h-12 items-center justify-center rounded-control bg-white px-6 font-semibold text-brand-navy no-underline transition-colors duration-[var(--d1)] hover:bg-on-band-2">
              Apply to join
            </a>
            <Link href="/for-movers/pricing/" className="inline-flex min-h-12 items-center justify-center rounded-control px-4 font-semibold text-on-band no-underline ring-1 ring-white/30 hover:bg-white/10">
              Pricing and buying rules
            </Link>
          </>
        }
        panel={
          <div className="grid gap-4">
            <p className="type-overline text-text-2">What you get</p>
            <ul className="grid gap-3 text-text">
              {[
                "Eligibility to purchase matching requests once your application is approved.",
                "A screened, movers-only network with no paid rankings or public company showcases.",
                "Move requests from consumers in the areas and move types you choose, shown to you before you buy.",
                "A simple pipeline for the leads you buy, private to your company.",
              ].map((item, index) => (
                <li key={index} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-pill bg-brand-red" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="type-small text-text-2">
              Applying is free. We check your federal record before you can buy any lead.{" "}
              <Link href="/for-movers/eligibility/" className="link">
                Who can join
              </Link>
            </p>
          </div>
        }
        panelId="for-movers-panel"
        minHeight="min(40rem, 80dvh)"
      />

      <Container className="grid gap-6 pt-6">
        <Breadcrumbs items={crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { label: crumb.label } : crumb))} />
        <ForMoversNav current={URL} />
      </Container>

      <Section aria-label="A network for movers only" className="!pt-10">
        <Reveal className="grid gap-8">
          <blockquote className="max-w-[60rem] border-l-4 border-brand-red pl-5 type-lede text-text">
            {moversOnly.map((part, index) =>
              part.kind === "text" ? (
                <span key={index}>{part.text}</span>
              ) : (
                <Link key={index} href="/how-we-verify-movers/" className="link">
                  {part.label}
                </Link>
              ),
            )}
          </blockquote>
          <TrustStrip
            items={[
              { title: "Movers only", body: "Brokers and lead resellers can't join. Every member holds carrier authority and no broker authority." },
              { title: "Consumer-controlled", body: "Consumers choose the maximum number of movers and how they may be contacted. Every purchase respects those limits." },
              { title: "Private prices", body: "Your prices are set per company. No mover sees another's prices." },
              { title: "Pay for requests", body: "Review a move preview before buying. Your spending doesn't buy a public promotion or change your screening result." },
            ]}
          />
        </Reveal>
      </Section>

      <Section tone="alt" aria-labelledby="requests">
        <div className="grid gap-12">
          <Reveal>
            <SectionHeader id="requests" overline="How requests reach you" title="From a consumer's move to your pipeline in four steps" />
          </Reveal>
          <Reveal delay={80}>
            <Timeline steps={REQUEST_STEPS} />
          </Reveal>
          <p className="text-text-2">
            <Link href="/for-movers/moving-leads/" className="link">
              Moving leads
            </Link>{" "}
            lists the checks every request passes and what a preview shows.
          </p>
        </div>
      </Section>

      <Section aria-labelledby="pricing">
        <div className="grid gap-10">
          <Reveal>
            <SectionHeader
              id="pricing"
              overline="How pricing works, in brief"
              title="Pay per lead. Exclusive or shared. No subscriptions."
              action={
                <Link href="/for-movers/pricing/" className="link inline-flex min-h-11 items-center font-semibold">
                  Full rules and a worked example
                </Link>
              }
            />
          </Reveal>
          <Reveal delay={60}>
            <Bento as="ul">
              <BentoCell as="li" span={8} tone="alt" className="grid content-between gap-6">
                <div className="grid gap-2">
                  <h3 className="type-h3 text-text">Your prices, set per company and kept private</h3>
                  <p className="max-w-[60ch] text-text-2">No mover sees another&apos;s prices. Your card is charged when you buy. There are no subscriptions or minimum spends.</p>
                </div>
                <p className="type-small text-text-3">
                  <Note kind="owner">pricing policy, factor schedule and maximum are proposals pending owner approval (shared pricing §9)</Note>
                </p>
              </BentoCell>
              <BentoCell as="li" span={4} tone="navy" className="grid content-between gap-6">
                <p className="font-display text-[4rem] leading-none font-black text-on-band [font-stretch:75%]">1</p>
                <div className="grid gap-1.5">
                  <h3 className="type-h3 text-on-band">Exclusive leads</h3>
                  <p className="text-on-band-2">A consumer who chooses 1 creates an exclusive lead: only one mover can buy it, at its exclusive price.</p>
                </div>
              </BentoCell>
              <BentoCell as="li" span={6} className="grid content-start gap-2">
                <h3 className="type-h4 text-text">Shared leads step down</h3>
                <p className="text-text-2">A consumer who chooses 2 or more creates a shared lead. Your price steps down as more movers buy it, and you get the difference back as account credit automatically.</p>
              </BentoCell>
              <BentoCell as="li" span={6} className="grid content-start gap-2">
                <h3 className="type-h4 text-text">A preview before every purchase</h3>
                <p className="text-text-2">
                  First name, route, date, size and services, without contact details, for <Token k="setting.sale_window_hours" /> hours. Buy it or leave it.
                </p>
              </BentoCell>
            </Bento>
          </Reveal>
        </div>
      </Section>

      <Section tone="band" aria-labelledby="verification" className="mesh-navy">
        <div className="grid gap-12">
          <Reveal>
            <SectionHeader tone="band" id="verification" overline="How we verify you" title="Four checks before your first lead, then every week" />
          </Reveal>
          <Reveal delay={80}>
            <Timeline tone="band" steps={VERIFY_STEPS} />
          </Reveal>
          <p className="text-on-band-2">
            <Link href="/for-movers/eligibility/" className="text-on-band underline underline-offset-[0.25em]">
              Who can join
            </Link>{" "}
            lists every requirement.
          </p>
        </div>
      </Section>

      <Section aria-labelledby="mover-questions">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <SectionHeader id="mover-questions" overline="Questions" title="What movers ask before they apply" />
          </Reveal>
          <Reveal delay={80} className="grid gap-3">
            {FAQ.map((item) => (
              <ExpandableCard key={item.q} title={item.q} name="mover-faq">
                <p>{item.a}</p>
              </ExpandableCard>
            ))}
          </Reveal>
        </div>
      </Section>

      <Section tone="alt" aria-label="Apply" className="!pt-0">
        <ApplyCta />
      </Section>
    </>
  );
}

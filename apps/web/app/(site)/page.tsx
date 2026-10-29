import "@/components/site/home.css";
import { env } from "@amc/server/env";
import { Icon3D, LineIcon, LinkButton, Section, StickyCta, TiltCard } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { JsonLd, organizationId } from "@/components/site/json-ld";
import { pageMediaPlan } from "@/lib/page-media";
import { navigationOverview } from "@/lib/public-discovery";
import { GuideDiscovery } from "@/components/navigation/guide-discovery";
import { PLATFORM_SETTING_DEFAULTS } from "@/lib/content/tokens";
import { claimMediaById } from "@/lib/media";
import { publishedStateUrls } from "@amc/server/seo";
import { StateGuideMap } from "@/components/site/state-guide-map";
import { socialMetadata } from "@/components/site/social-metadata";

const TITLE = "Moving Quotes, on Your Terms | American Moving Choice";
const DESCRIPTION = "Tell us your route, choose how many moving companies may contact you, and compare their quotes directly. Free to request.";
export const metadata: Metadata = {
  title: { absolute: TITLE }, description: DESCRIPTION, alternates: { canonical: "/" },
  ...socialMetadata("/", TITLE, DESCRIPTION),
};
const STEPS = [
  { icon: "origin" as const, title: "Tell us where life is taking you", body: "Start with your ZIP codes, moving date, and the size of your move.", meta: "Your move" },
  { icon: "route" as const, title: "We check your route", body: "We check our network for companies that serve your move. If we don't have coverage, we'll tell you.", meta: "Your route" },
  { icon: "chat" as const, title: "Set your contact preferences", body: "Choose how many moving companies may contact you and how you'd like to hear from them.", meta: "Your choice" },
  { icon: "verified" as const, title: "Compare quotes. Make your move.", body: "Companies introduce themselves when they reach out. Compare their estimates and decide who feels right.", meta: "Your decision" },
];
const FAQ = [
  { q: "Is it free to request moving quotes?", a: "Yes. Requesting quotes through American Moving Choice is free. Your moving price and any estimate charges are agreed directly with the company you choose." },
  { q: "How many moving companies will contact me?", a: "You choose the maximum before sending your request. We share it only with eligible participating companies, up to that limit. Each company identifies itself when it contacts you." },
  { q: "Are you a moving company?", a: "We're a platform connecting people with independent moving carriers. We don't transport belongings, book your move, or give estimates on a mover's behalf. The companies provide their own quotes directly." },
  { q: "What if you don't cover my route?", a: "We'll tell you before asking for your contact details. You can still use our moving guides and planning resources." },
  { q: "Can I withdraw my request?", a: "Yes. Use the secure link on your confirmation page or in your confirmation email. Withdrawing stops additional movers from receiving your contact details, and we tell companies that already received them to stop contacting you. It cannot take back details already shared." },
];
const SERVICES = [
  { title: "Across town.", label: "Local moving", body: "A new neighborhood. A little more room. Plan a local move with the details in hand.", href: "/services/local/", asset: "home-family-carrying-labeled-boxes-toward" },
  { title: "Across the country.", label: "Long-distance moving", body: "A bigger change of scenery. Understand routes, estimates, and what comes next.", href: "/services/long-distance/", asset: "home-truck-suburban-autumn-street" },
];
const RESOURCES = [
  { href: "/moving-cost-calculator/", title: "Get a feel for moving costs", body: "Planning ranges, when enough mover rate data is available.", icon: "calculator" as const },
  { href: "/moving-costs/how-movers-charge/", title: "Make sense of your estimate", body: "Understand the details behind a moving quote.", icon: "ledger" as const },
  { href: "/planning/", title: "Get your next steps in order", body: "Useful checklists for the weeks before moving day.", icon: "calendar" as const },
];

export default async function HomePage() {
  const { WEB_URL } = env();
  const maxMovers = PLATFORM_SETTING_DEFAULTS.max_sharing_limit;
  const photos = pageMediaPlan("/", { topic: "moving planning packing home" }).images;
  const processPhotos = pageMediaPlan("/home/moving-process/", { topic: "planning packing moving" }).images;
  // The aggregate enters the request boundary before any guide query is started at build time.
  const overview = await navigationOverview();
  const stateGuides = overview ? await publishedStateUrls() : [];
  const planning = claimMediaById("/", "home-kitchen-table-with-a-laptop");
  const care = claimMediaById("/", "home-inside-of-a-moving-truck");
  return <>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", "@id": WEB_URL + "/#website", name: "American Moving Choice", url: WEB_URL + "/", publisher: { "@id": organizationId(WEB_URL) }, inLanguage: "en-US" }} />
    <VideoSurveyHero url="/" title={<>A better move.<br /><span className="vsh__title-accent">On your terms.</span></>}
      eyebrow="A new place. A fresh start."
      description="Big plans deserve the right moving company. Request quotes from movers who serve your route, on your terms.">
      <p>New keys. New beginnings. Wherever you're headed, make the move yours.</p>
      <p className="inline-flex items-center gap-2"><LineIcon name="lock" size={16} />Your details are shared only after you give permission.</p>
    </VideoSurveyHero>
    <section className="home-reassurance" aria-label="Moving, with more control"><div className="mx-auto grid max-w-content gutter sm:grid-cols-3">
      <div><Icon3D name="verified" size={44} /><p><strong>Moving carriers. No brokers.</strong><span>Learn how our network is screened.</span></p></div>
      <div><Icon3D name="chat" size={44} /><p><strong>You set the contact limit.</strong><span>Choose from 1 to {maxMovers} companies.</span></p></div>
      <div><Icon3D name="price" size={44} /><p><strong>Quotes come straight to you.</strong><span>Compare in your own time.</span></p></div>
    </div></section>
    <Section className="home-guide-library" aria-labelledby="home-guides-title">
      <div className="home-section-heading" data-motion="rise"><div><p className="home-eyebrow"><span aria-hidden="true" />Find your next chapter</p><h2 id="home-guides-title">{overview ? overview.total.toLocaleString("en-US") : "Practical"} moving guides.<br />One place to start.</h2></div><p>Explore your city or state, understand a route, or find a useful moving checklist. Every link opens a published guide.</p></div>
      <StateGuideMap guides={stateGuides} overview={overview} />
      <GuideDiscovery overview={overview} id="home-guide-library" searchLabel="Homepage moving guide search" showIntro={false} />
      <Link className="home-text-link" href="/explore/">Browse the complete guide library<LineIcon name="arrow-right" size={18} /></Link>
    </Section>
    <HowItWorks id="how-it-works" overline="A clear path from here to there" title="Your move. Four simple steps." lede="A little information from you. More confidence about what comes next." stops={STEPS} images={processPhotos} />
    <Section className="home-services" aria-labelledby="moving-your-way">
      <div className="home-section-heading" data-motion="rise"><div><p className="home-eyebrow"><span aria-hidden="true" />Room for what’s next</p><h2 id="moving-your-way">A few miles.<br />Or a whole new horizon.</h2></div><p>Every move has its own story.<br />Start with a plan that fits yours.</p></div>
      <div className="home-service-grid" data-motion="stagger">{SERVICES.map((s) => <article className="home-service-card" key={s.href}><div className="home-service-photo"><MediaFrame asset={claimMediaById("/", s.asset)} sizes="(min-width: 1024px) 45vw, 100vw" /><span>{s.label}</span></div><div className="home-service-body"><div><h3>{s.title}</h3><p>{s.body}</p></div><Link href={s.href} className="home-arrow-link" aria-label={"Explore " + s.label.toLowerCase()}><LineIcon name="arrow-right" size={22} /></Link></div></article>)}</div>
    </Section>
    <section className="home-control-section" aria-labelledby="your-move-your-rules"><div className="mx-auto max-w-content gutter">
      <div className="home-control-heading" data-motion="rise"><p className="home-eyebrow"><span aria-hidden="true" />A little less moving stress</p><h2 id="your-move-your-rules">The choice stays<br /><em>with you.</em></h2><p>One request. Clear preferences.<br />Space to make a considered decision.</p></div>
      <div className="home-benefit-grid" data-motion="stagger">{[
        { number: "01", icon: "chat" as const, title: "Choose your contact limit", body: "Set the maximum number of companies you want to hear from, up to " + maxMovers + ". Nothing is selected for you." },
        { number: "02", icon: "credentials" as const, title: "Moving companies, screened", body: "We check carrier authority and insurance filings against FMCSA records. Learn what we check and what those checks mean." },
        { number: "03", icon: "key" as const, title: "The final decision is yours", body: "Companies introduce themselves and provide their own estimates. Compare the details and choose who you want to hire." },
      ].map((b, index) => <TiltCard key={b.number} max={5} depth={20} className="home-benefit-card" bodyClassName="home-benefit-body"><div className="home-benefit-photo" data-page-photo={photos[index]!.id}><MediaFrame asset={photos[index]!} sizes="(min-width: 1024px) 30vw, 100vw" /></div><span className="home-card-index">{b.number}</span><Icon3D name={b.icon} size={72} className="tilt-layer-2" /><h3 className="tilt-layer">{b.title}</h3><p className="tilt-layer">{b.body}</p></TiltCard>)}</div>
      <Link href="/how-we-verify-movers/" className="home-text-link">How our network is screened<LineIcon name="arrow-right" size={18} /></Link>
    </div></section>
    <Section aria-labelledby="plan-ahead" className="home-planning"><div className="home-planning-grid">
      <div className="home-planning-art" data-motion="scale"><MediaFrame asset={planning} sizes="(min-width: 1024px) 48vw, 100vw" /><div className="home-planning-stamp"><Icon3D name="calculator" size={60} /><span>A clearer plan.<br /><strong>A calmer move.</strong></span></div></div>
      <div className="home-planning-copy" data-motion="rise"><p className="home-eyebrow"><span aria-hidden="true" />Before the first box</p><h2 id="plan-ahead">Know a little more.<br />Worry a little less.</h2><p>From understanding an estimate to planning your packing, a little preparation goes a long way.</p><div className="home-resource-list">{RESOURCES.map((r) => <Link href={r.href} key={r.href}><Icon3D name={r.icon} size={42} /><span><strong>{r.title}</strong><small>{r.body}</small></span><LineIcon name="arrow-right" size={18} /></Link>)}</div></div>
    </div></Section>
    <Section tone="alt" aria-labelledby="home-faq" className="home-faq-section"><div className="home-faq-grid">
      <div data-motion="rise"><p className="home-eyebrow"><span aria-hidden="true" />A few things to know</p><h2 id="home-faq">Good questions.<br />Clear answers.</h2><p className="home-faq-intro">Moving comes with enough unknowns.<br />Here’s how requesting quotes works.</p><Link href="/questions/" className="home-text-link">More moving questions<LineIcon name="arrow-right" size={18} /></Link></div>
      <div className="home-faq-list">{FAQ.map((f, i) => <details key={f.q}><summary><span className="home-faq-number">0{i + 1}</span><span>{f.q}</span><span className="home-faq-plus" aria-hidden="true" /></summary><p>{f.a}</p></details>)}</div>
    </div></Section>
    <section className="home-final" aria-labelledby="ready-to-move"><div className="home-final-photo" aria-hidden="true"><MediaFrame asset={care} alt="" sizes="100vw" /></div><div className="home-final-shade" aria-hidden="true" /><div className="mx-auto max-w-content gutter" data-motion="rise"><p className="home-eyebrow">Good things are ahead</p><h2 id="ready-to-move">Let’s get you<br />to your next chapter.</h2><p>Start with your route. Take it one step at a time.</p><LinkButton href="/get-quotes/" variant="cta" data-magnetic="">Start my moving request</LinkButton><span className="home-final-note">Free to request · Your contact preferences · No brokers</span></div></section>
    <StickyCta href="/get-quotes/" watch="hero-survey" label="Get moving quotes" />
  </>;
}

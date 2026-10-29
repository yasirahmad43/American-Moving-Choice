import { ArrowRightIcon, Container, Icon3D, LinkButton, Reveal } from "@amc/ui";
import { GEO_THRESHOLDS } from "@amc/server/geo-pages";
import { publishedStateUrls } from "@amc/server/seo";
import { getSettings } from "@amc/server/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { JsonLd, breadcrumbJsonLd, canonical } from "@/components/directory/seo";
import { MediaFrame } from "@/components/media/media-frame";
import { VideoSurveyHero } from "@/components/site/video-survey-hero";
import { socialMetadata } from "@/components/site/social-metadata";
import { pageMediaPlan } from "@/lib/page-media";
import styles from "@/components/seo/seo-reader.module.css";
import hubStyles from "@/components/seo/hub-compact.module.css";
import { ZipCheck } from "./zip-check";

export const metadata: Metadata = {
  title: "Movers by state",
  description: "How movers in the American Moving Choice network set the areas they serve, and a ZIP check that shows coverage for your state.",
  ...canonical("/movers/"),
  ...socialMetadata("/movers/", "Moving Guides by State | American Moving Choice", "Explore state and city moving guides, sourced local facts and the details to check for your own move.", { family: "state" }),
};

/** All published state guides remain visible, with the same live coverage check. */
export default async function MoversIndexPage() {
  await connection();
  const [hubs, settings] = await Promise.all([publishedStateUrls(), getSettings()]);
  const { images } = pageMediaPlan("/movers/", { family: "state", topic: "local moving guides" });
  const nextSteps = [
    { href: "/routes/", label: "Moving routes: state-to-state and city-to-city" },
    { href: "/services/", label: "Moving services: local, long-distance, interstate, packing, storage, specialty" },
    { href: "/moving-costs/", label: "Moving costs and the cost calculator" },
    { href: "/questions/", label: "Moving questions answered from the rules" },
    { href: "/planning/", label: "Planning checklists" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Movers", path: "/movers/" }])} />
      <VideoSurveyHero url="/movers/" title="Movers by state" eyebrow="Coverage, state by state" description="A new address starts with a clearer plan. Explore state guides, check your route and choose how many movers may contact you." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Movers" }]}>
        <a href="#states-heading" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4">Explore {hubs.length} published state guides <span aria-hidden="true">↓</span></a>
      </VideoSurveyHero>

      <Container>
        <Reveal as="section" aria-label="Moving coverage at a glance" className={hubStyles.hubLead}>
          <div className={hubStyles.hubLeadCopy}><p className={styles.kicker}>Where your next chapter begins</p><h2 className="type-display-l text-text">The place changes.<br />The choice stays yours.</h2><p className={styles.introText}>Every mover in the American Moving Choice network sets the areas it serves. A request reaches only movers whose coverage includes it, and never more than the number you choose.</p><div className={hubStyles.hubCount}><strong>{hubs.length}</strong><span>published state guides<br />with place facts and checked sources.</span></div></div>
          <div className={`${styles.photoComposition} ${hubStyles.leadPhoto}`}><figure className={styles.photoMain} data-editorial-image={images[0]!.id}><MediaFrame asset={images[0]!} sizes="(min-width: 760px) 38vw, 100vw" /><figcaption className={styles.photoLabel}>A move on your terms</figcaption><span className={styles.photoSymbol}><Icon3D name="origin" size={58} float /></span></figure><div className={styles.photoStrip}>{images.slice(1, 4).map((image) => <figure key={image.id} className={styles.photoSmall} data-editorial-image={image.id}><MediaFrame asset={image} alt="" sizes="(min-width: 760px) 10vw, 24vw" /></figure>)}</div></div>
        </Reveal>
      </Container>

      <Container className={hubStyles.hubBody}>
        <Reveal as="section" aria-labelledby="zip-heading" className={styles.quoteBand}>
          <figure className={styles.quotePhoto}><MediaFrame asset={images[1]!} alt="" sizes="(min-width: 760px) 35vw, 100vw" /></figure>
          <div className="grid content-center gap-4 bg-surface p-6 text-text sm:p-8"><p className={styles.kicker}>Start close to home</p><h2 id="zip-heading" className="type-display-l text-text">Check coverage where you&apos;re moving from</h2><ZipCheck /></div>
        </Reveal>

        <section aria-labelledby="states-heading" className={`${hubStyles.browseGroups} scroll-mt-24`}>
          <header className={hubStyles.hubGroupHead}><div className="grid gap-2"><p className={styles.kicker}>Find your place</p><h2 id="states-heading" className="type-display-l text-text">State pages</h2></div><p className="type-small text-text-2">{hubs.length} published guides</p></header>
          {hubs.length ? <ul className={hubStyles.hubGrid}>{hubs.map((state, index) => {
            const image = pageMediaPlan(state.url, { family: "state", stateCode: state.stateCode ?? undefined }).images[0]!;
            return <Reveal as="li" key={state.stateCode} delay={Math.min(index % 3, 2) * 45} className={hubStyles.hubCard}><Link href={state.url}><figure className={hubStyles.hubCardPhoto}><MediaFrame asset={image} alt="" sizes="(min-width: 1024px) 30vw, (min-width: 520px) 45vw, 100vw" /></figure><div className={hubStyles.hubCardCopy}><span className={hubStyles.hubCardMeta}>Your state guide <ArrowRightIcon size={17} /></span><h3>{state.h1}</h3><span className="type-small text-text-2">Coverage, city guides and local context →</span></div></Link></Reveal>;
          })}</ul> : <p className="text-text">No state pages are published yet. We publish a state page only when it passes every publishing check, including at least <span className="tabular">{GEO_THRESHOLDS.state_hub.movers}</span> movers in our network with coverage there and checked facts about the state&apos;s own rules for movers. Until then, the ZIP check above and the quote survey show coverage for your move.</p>}
        </section>

        <Reveal as="section" aria-labelledby="plan-heading" className={hubStyles.hubGroup}><div className="grid gap-2"><p className={styles.kicker}>Every part of your move</p><h2 id="plan-heading" className="type-display-l text-text">Routes, services, costs and planning</h2></div><ul className={hubStyles.hubGrid}>{nextSteps.map((link, index) => <li key={link.href} className={hubStyles.hubCard}><Link href={link.href}><figure className={hubStyles.hubCardPhoto}><MediaFrame asset={images[index % images.length]!} alt="" sizes="(min-width: 1024px) 30vw, 100vw" /></figure><div className={hubStyles.hubCardCopy}><span className={hubStyles.hubCardMeta}>Keep exploring <ArrowRightIcon size={17} /></span><h3>{link.label}</h3></div></Link></li>)}</ul></Reveal>

        <Reveal as="section" aria-labelledby="how-heading" className={styles.section}>
          <header className={styles.sectionHead}><figure className={styles.sectionPhoto}><MediaFrame asset={images[3]!} alt="" sizes="128px" /></figure><div className={styles.sectionTitle}><span className={styles.sectionNo}>Clarity before contact</span><h2 id="how-heading">How coverage works</h2></div></header>
          <div className={`prose max-w-none ${styles.sectionBody}`}><ul className={styles.visualList}>
            {[
              <><strong>Movers set their own coverage.</strong> Each sets where moves may start and end (whole states, counties or ZIP codes), which kinds of move it takes (local, in-state long-distance or between states), home sizes and services. The capabilities approved for it cap what its coverage can include.</>,
              <><strong>Coverage follows your route.</strong> A company&apos;s home city alone doesn&apos;t decide whether it can receive your request. Its approved coverage must include where your move starts and ends.</>,
              <><strong>Your answers decide who can receive your request.</strong> The quote survey checks your move against every mover&apos;s coverage before it asks for contact details, shows the number of eligible movers, and asks how many may contact you, up to <span className="tabular">{settings.max_sharing_limit}</span>.</>,
              <><strong>Only screened movers count.</strong> Eligible companies are approved moving carriers with no broker authority. Each company introduces itself when it contacts you; this site doesn&apos;t present a public list to browse.</>,
            ].map((item, index) => <li key={index}><span className={styles.listPhoto} aria-hidden="true"><MediaFrame asset={images[index]!} alt="" sizes="72px" /></span><span className={styles.listBody}>{item}</span></li>)}
          </ul><p className="flex flex-wrap gap-x-4 gap-y-1"><Link href="/which-companies-receive-my-request/" className="link inline-flex min-h-11 items-center">Which companies receive my request</Link><Link href="/how-we-verify-movers/" className="link inline-flex min-h-11 items-center">How we verify movers</Link><Link href="/review-methodology/" className="link inline-flex min-h-11 items-center">How reviews work</Link><Link href="/get-quotes/" className="link inline-flex min-h-11 items-center">Start your quote request</Link></p></div>
        </Reveal>

        <Reveal as="section" aria-labelledby="movers-next-step" className={styles.quoteBand}><figure className={styles.quotePhoto} data-editorial-image={images[4]!.id}><MediaFrame asset={images[4]!} sizes="(min-width: 760px) 35vw, 100vw" /></figure><div className={styles.quoteCopy}><p className="type-overline">Ready when you are</p><h2 id="movers-next-step">A new place.<br />A plan that feels like yours.</h2><p>Start with your route. Add the details. Choose your contact limit. Companies introduce themselves when they contact you.</p><div><LinkButton href="/get-quotes/" variant="cta">Plan my move</LinkButton></div></div></Reveal>
        <p className="type-legal text-text-3">Photography and video are commissioned editorial illustrations. State imagery provides general context and does not identify a particular city, customer or moving company.</p>
      </Container>
    </>
  );
}

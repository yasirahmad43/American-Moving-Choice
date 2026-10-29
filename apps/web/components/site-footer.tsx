import { env } from "@amc/server/env";
import { ArrowRightIcon, RouteMapArt, Wordmark } from "@amc/ui";
import Link from "next/link";
import { GEONAMES_CREDIT, GUIDE_FAMILIES, PREVIEW_BANNER_TEXT, PUBLIC_NAV_GROUPS } from "@/lib/site";
import { navigationOverview } from "@/lib/public-discovery";
import { PUBLIC_ROLE_STATEMENT } from "@/lib/public-copy";
import { GuideDiscovery } from "./navigation/guide-discovery";
import { CategoryIcon } from "./navigation/category-icon";

export async function SiteFooter() {
  const { APP_URL, SITE_INDEXABLE } = env();
  const overview = await navigationOverview();
  return <footer data-band="" className="relative isolate overflow-hidden bg-brand-navy text-on-band">
    <div className="pointer-events-none absolute -right-36 -top-24 -z-10 h-[34rem] w-[52rem] opacity-25 [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden="true"><RouteMapArt gradientId="site-footer-route-glow" /></div>
    <div className="mx-auto max-w-content gutter">
      <div className="grid gap-8 border-b border-white/20 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center lg:gap-16">
        <div><p className="type-overline text-on-band-2">Wherever life takes you next.</p><p className="mt-3 max-w-[16ch] font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">Make your next move a better one.</p></div>
        <div className="grid gap-4"><p className="text-lg text-on-band-2">A move is more than miles and boxes. Start with a clear plan, useful local guidance and the freedom to choose.</p><Link href="/get-quotes/" className="inline-flex min-h-12 w-fit items-center gap-5 rounded-control bg-white px-6 font-bold text-brand-navy no-underline transition-colors hover:bg-white/90">Start your moving request <ArrowRightIcon size={20} /></Link><p className="type-small text-on-band-2">You choose how many movers may contact you.</p></div>
      </div>
      <section aria-labelledby="footer-guides-heading" className="grid gap-5 border-b border-white/20 py-9">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="type-overline text-on-band-2">The moving library</p><h2 id="footer-guides-heading" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{overview ? `${overview.total.toLocaleString("en-US")} guides. Every step of the way.` : "Guidance for every step of the way."}</h2></div><Link href="/explore/" className="inline-flex min-h-12 items-center gap-3 font-bold text-white underline underline-offset-4">All guides & pages <ArrowRightIcon size={18} /></Link></div>
        <ul className="flex flex-wrap gap-2" aria-label="Browse every guide category">{GUIDE_FAMILIES.filter((family) => family.id !== "zip" || (overview?.families.zip ?? 0) > 0).map((family) => <li key={family.id}><Link href={`/explore/?type=${family.id}`} className="inline-flex min-h-11 items-center gap-3 rounded-pill border border-white/25 px-4 text-on-band no-underline transition-colors hover:bg-white/10"><CategoryIcon family={family.id} width={18} height={18} /><span className="font-semibold">{family.short}</span>{overview ? <span className="text-sm tabular text-on-band-2">{(overview.families[family.id] ?? 0).toLocaleString("en-US")}</span> : null}</Link></li>)}</ul>
        <details className="group/footer rounded-card border border-white/20 bg-white/5 px-5 py-2 sm:px-6"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-bold text-white [&::-webkit-details-marker]:hidden"><span>Search every moving guide by place or topic</span><span aria-hidden="true" className="text-2xl font-normal transition-transform group-open/footer:rotate-45">+</span></summary><div className="border-t border-white/20 pb-4 pt-6"><GuideDiscovery overview={overview} id="footer" searchLabel="Footer moving guide search" dark /></div></details>
      </section>
      <nav aria-label="Footer: every public section" className="flex flex-wrap gap-x-7 gap-y-8 py-10">{PUBLIC_NAV_GROUPS.map((group) => <div key={group.id} className="min-w-0 basis-full grow sm:basis-[calc((100%_-_1.75rem)/2)] lg:basis-[calc((100%_-_3.5rem)/3)] xl:basis-[calc((100%_-_7rem)/5)]"><h2 className="type-overline text-white">{group.label}</h2><ul className="mt-3 grid gap-0.5">{group.links.map((link) => <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 items-center py-1 text-on-band-2 underline-offset-4 transition-colors hover:text-white hover:underline">{link.label}</Link></li>)}</ul></div>)}</nav>
      <div className="flex flex-wrap items-center justify-between gap-6 border-y border-white/20 py-7"><Wordmark href="/" tone="reversed" size="lg" className="max-w-60" /><a href={`${APP_URL}/login`} className="inline-flex min-h-12 items-center gap-3 rounded-control border border-white/30 px-5 font-semibold text-white no-underline hover:bg-white/10">Moving company sign-in <ArrowRightIcon size={17} /></a></div>
      <p className="max-w-[75ch] pb-3 pt-6 type-small leading-relaxed text-on-band-2">{PUBLIC_ROLE_STATEMENT}</p>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 pb-7 type-small text-on-band-2"><Link href="/" className="inline-flex min-h-11 items-center text-on-band underline-offset-4 hover:underline">American Moving Choice home</Link><p>ZIP code data from <a href={GEONAMES_CREDIT.sourceUrl} className="text-on-band underline underline-offset-4">GeoNames</a>, licensed under <a href={GEONAMES_CREDIT.licenseUrl} className="text-on-band underline underline-offset-4">CC BY 4.0</a>.</p></div>
    </div>
    {SITE_INDEXABLE ? null : <section aria-label="Preview notice" className="border-t border-white/10 bg-black/10"><p className="mx-auto max-w-content py-3 gutter type-legal text-on-band-2">{PREVIEW_BANNER_TEXT}</p></section>}
  </footer>;
}

import { ArrowRightIcon, MenuIcon, Wordmark } from "@amc/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { GET_QUOTES, PUBLIC_NAV_GROUPS, type PublicNavGroup } from "@/lib/site";
import { mediaById } from "@/lib/media";
import { navigationOverview } from "@/lib/public-discovery";
import { MediaFrame } from "./media/media-frame";
import { HeaderCta } from "./header-cta";
import { NavDisclosure, NavLinks } from "./nav-links";
import { GuideDiscovery } from "./navigation/guide-discovery";
import "./navigation/navigation.css";

function NavGroup({ group }: { group: PublicNavGroup }) {
  return <section className="min-w-0"><h2 className="px-3 type-overline text-text-3">{group.label}</h2><NavLinks items={group.links} /></section>;
}

function NavFeature({ kind }: { kind: "plan" | "trust" }) {
  // Shared chrome uses approved manifest references, separate from editorial image slots.
  const asset = mediaById(kind === "plan" ? "home-family-carrying-labeled-boxes-toward" : "planning-checklist-table-tape-notebook");
  return <Link href={kind === "plan" ? "/get-quotes/" : "/how-we-verify-movers/"} className="group/feature relative isolate flex min-h-60 flex-col justify-end overflow-hidden rounded-card bg-brand-navy p-6 text-white no-underline">
    {asset ? <div className="absolute inset-0 -z-20"><MediaFrame asset={asset} sizes="360px" alt="" className="transition-transform duration-500 motion-reduce:transition-none group-hover/feature:scale-105" /></div> : null}
    <span className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-brand-navy/5" />
    <span className="type-overline text-white/85">{kind === "plan" ? "A fresh start" : "Move with a little more clarity"}</span>
    <span className="mt-2 font-display text-3xl font-extrabold leading-tight">{kind === "plan" ? "Your move. Your choice." : "Know who's behind your next move."}</span>
    <span className="mt-5 flex items-center gap-2 font-semibold">{kind === "plan" ? "Start your request" : "See our screening process"}<ArrowRightIcon size={18} /></span>
  </Link>;
}

function MegaPanel({ children }: { children: ReactNode }) {
  return <div className="navigation-panel absolute inset-x-0 top-full border-y border-border bg-surface shadow-e3"><div className="mx-auto max-h-[calc(100dvh-9rem)] max-w-content overflow-y-auto p-7 gutter">{children}</div></div>;
}

export async function SiteHeader() {
  const overview = await navigationOverview();
  const group = (id: string) => PUBLIC_NAV_GROUPS.find((entry) => entry.id === id)!;
  return <header className="site-header relative z-40 border-b border-border/70 bg-surface">
    <div className="border-b border-border/70 bg-surface-2"><div className="mx-auto flex min-h-9 max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1 gutter type-small text-text-2"><span className="hidden sm:inline">A new home starts with a good move.</span><Link href="/explore/" className="ml-auto inline-flex min-h-8 items-center underline decoration-border-strong underline-offset-4">Moving guidance, wherever you're going<ArrowRightIcon size={13} className="ml-2" /></Link></div></div>
    <div className="mx-auto flex min-h-24 max-w-content items-center justify-between gap-3 py-2 gutter xl:gap-6">
      <div className="site-header-brand min-w-0"><Wordmark href="/" className="max-w-[min(52vw,15rem)]" /></div>
      <nav aria-label="Primary" className="ml-auto hidden xl:block"><ul className="flex items-center gap-1">
        <li><NavDisclosure label="Plan a move"><MegaPanel><div className="grid gap-8 lg:grid-cols-[1fr_1fr_1.15fr]"><NavGroup group={group("move")} /><NavGroup group={group("cost")} /><NavFeature kind="plan" /></div></MegaPanel></NavDisclosure></li>
        <li><NavDisclosure label={<span>All moving guides <span className="ml-1 rounded-pill bg-surface-3 px-2 py-0.5 text-xs tabular">{overview?.total.toLocaleString("en-US") ?? "Explore"}</span></span>}><MegaPanel><GuideDiscovery overview={overview} id="header" searchLabel="Header moving guide search" /></MegaPanel></NavDisclosure></li>
        <li><NavDisclosure label="About & help"><MegaPanel><div className="grid gap-7 lg:grid-cols-[1.1fr_1fr_1fr]"><NavGroup group={group("trust")} /><div className="grid content-start gap-6"><NavGroup group={group("help")} /><NavGroup group={group("legal")} /></div><NavFeature kind="trust" /></div></MegaPanel></NavDisclosure></li>
      </ul></nav>
      <div className="flex shrink-0 items-center gap-2"><span className="hidden sm:block"><HeaderCta /></span><div className="xl:hidden"><NavDisclosure mobile label={<><MenuIcon size={20} /><span>Menu</span></>} summaryClassName="border border-border-strong px-3">
        <div className="navigation-panel absolute inset-x-0 top-full max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain border-y border-border bg-surface shadow-e3"><nav aria-label="Primary mobile" className="mx-auto grid max-w-content gap-5 py-5 gutter">
          <Link href={GET_QUOTES.href} className="inline-flex min-h-12 items-center justify-between rounded-control bg-brand-red px-5 font-bold text-white no-underline">Get moving quotes <ArrowRightIcon size={19} /></Link>
          <details className="group/mobile rounded-card border border-border bg-surface-2 p-4"><summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-display text-xl font-bold text-text">All moving guides <span className="type-small tabular">{overview?.total.toLocaleString("en-US") ?? "Browse"}</span></summary><div className="border-t border-border pt-5"><GuideDiscovery overview={overview} id="mobile" searchLabel="Mobile menu moving guide search" /></div></details>
          <div className="grid gap-3 sm:grid-cols-2">{PUBLIC_NAV_GROUPS.map((entry) => <details key={entry.id} className="rounded-card border border-border p-2"><summary data-content-inset="compact" className="min-h-12 cursor-pointer px-3 py-3 font-bold text-text">{entry.label}</summary><NavLinks items={entry.links} /></details>)}</div>
          <Link href="/explore/" className="inline-flex min-h-12 items-center justify-between border-t border-border pt-3 font-bold text-link">Browse all guides & pages <ArrowRightIcon size={18} /></Link>
          <NavFeature kind="plan" />
        </nav></div>
      </NavDisclosure></div></div>
    </div>
  </header>;
}

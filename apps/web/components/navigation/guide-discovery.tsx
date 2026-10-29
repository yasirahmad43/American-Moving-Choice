import Link from "next/link";
import { ArrowRightIcon } from "@amc/ui";
import { STATES } from "@amc/server/geo";
import type { DiscoveryOverview } from "@amc/server/seo";
import { GUIDE_FAMILIES } from "@/lib/site";
import { CategoryIcon } from "./category-icon";

export interface GuideDiscoveryProps {
  overview: DiscoveryOverview | null;
  id: string;
  /** Distinguish simultaneous search landmarks in the header, page and footer. */
  searchLabel: string;
  dark?: boolean;
  /** A containing section can supply its own title without repeating the live-count heading. */
  showIntro?: boolean;
}

export function GuideDiscovery({ overview, id, searchLabel, dark = false, showIntro = true }: GuideDiscoveryProps) {
  const text = dark ? "text-on-band" : "text-text";
  const muted = dark ? "text-on-band-2" : "text-text-2";
  const control = "min-h-12 w-full min-w-0 rounded-control border border-border-strong bg-white px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red";
  return (
    <div className={`grid min-w-0 gap-6 ${text}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {showIntro ? <div>
          <p className={`type-overline ${muted}`}>A little knowledge. A better move.</p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{overview ? `${overview.total.toLocaleString("en-US")} moving guides. One place to start.` : "Your next chapter starts here."}</p>
        </div> : null}
        <Link href="/explore/" className={`inline-flex min-h-11 items-center gap-2 font-bold underline underline-offset-4 ${text}`}>Browse every page <ArrowRightIcon size={17} /></Link>
      </div>
      <form action="/explore/" method="get" role="search" aria-label={searchLabel} className="grid gap-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="grid min-w-0 gap-2"><label htmlFor={`${id}-guide-query`} className="type-small font-semibold">What are you planning?</label><input id={`${id}-guide-query`} name="q" type="search" maxLength={80} placeholder="City, route, packing, moving costs…" className={control} /></div>
        <div className="grid min-w-0 gap-2"><label htmlFor={`${id}-guide-state`} className="type-small font-semibold">Where?</label><select id={`${id}-guide-state`} name="state" className={control}><option value="">All states</option>{STATES.filter((state) => !overview || overview.states.some((entry) => entry.code === state.code)).map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></div>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-control bg-brand-red px-6 font-bold text-white transition-colors hover:brightness-90">Find a guide <ArrowRightIcon size={18} /></button>
      </form>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Every moving guide category">
        {GUIDE_FAMILIES.filter((family) => family.id !== "zip" || (overview?.families.zip ?? 0) > 0).map((family) => <li key={family.id}><Link href={`/explore/?type=${family.id}`} className={`group flex min-h-14 items-center justify-between gap-3 rounded-control border px-3 py-2 no-underline transition-colors ${dark ? "border-white/20 hover:bg-white/10" : "border-border hover:bg-surface-2"}`}><span className="flex items-center gap-3 font-semibold"><CategoryIcon family={family.id} className={`shrink-0 ${dark ? "text-white" : "text-brand-red"}`} />{family.label}</span><span className={`flex items-center gap-2 type-small tabular ${muted}`}>{overview ? (overview.families[family.id] ?? 0).toLocaleString("en-US") : ""}<ArrowRightIcon size={15} className="transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" /></span></Link></li>)}
      </ul>
    </div>
  );
}

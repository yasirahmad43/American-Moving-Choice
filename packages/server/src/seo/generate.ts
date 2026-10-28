/**
 * `pnpm seo:generate <family> --limit N`: builds a structured brief for each candidate from data
 * (geo tables, the facts registry, network coverage, rate cards, research keywords), writes the
 * page's content, runs the automated gates and upserts seo_pages. Nothing is invented: every
 * figure on a page is read from a table or computed from one, and a page whose brief lacks
 * enough distinct facts is stored as draft, indexable = false, with blocked_reason set.
 *
 * Status after generation: `ready` when every automated gate passes, else `draft`. Human review
 * (G9) is recorded separately (reviewed_by, last_reviewed_at) and is not required to publish in
 * this preview; the report says how many pages carry a reviewer.
 */
import type { MoveType } from "@amc/core";
import type { Queryable } from "../db/pool";
import { distanceMiles, lookupZip } from "../geo/geo";
import { STATES, type StateInfo } from "../geo/states";
import { CATALOG, type CatalogEntry } from "./catalog";
import { FMCSA_LINKS } from "./facts";
import {
  cityCoverage,
  costBlockFor,
  countyLabel,
  loadNetwork,
  moverItems,
  rateCardMoversByState,
  routeCoverage,
  stateCoverage,
  zipCoverage,
  type CoverageCount,
  type NetworkMover,
} from "./network";
import { loadResearch, researchForCity, researchForCityRoute, researchForState, researchForStateRoute, researchForUrl, stateDemand, type ResearchKeyword } from "./research";
import { RESERVED_CITY_SLUGS, normalizeKeyword, type SeoFamily } from "./slugs";
import { clampDescription, joinAnd, mainText, miles as milesText, n, pick, plural, seedOf, sha256, shingles, uniqueShares } from "./text";
import type { ContentBlock, ContentSection, CostBlock, DataPoint, FaqItem, MediaAsset, RelatedGroup, SeoContent, SourceRef } from "./types";

// ------------------------------------------------------------------ shared data

interface StateRec extends StateInfo {
  lat: number;
  lng: number;
  zipCount: number;
  countyCount: number;
  cityCount: number;
}

interface CityRec {
  id: number;
  stateCode: string;
  slug: string;
  name: string;
  countyName: string | null;
  countyFips: string | null;
  lat: number;
  lng: number;
  population: number | null;
  zips: string[];
  rank: number | null;
}

interface RouteRec {
  id: number;
  kind: "city" | "state";
  slug: string;
  originState: string;
  destinationState: string;
  originCityId: number | null;
  destinationCityId: number | null;
  distanceMiles: number;
  moveType: MoveType;
  distanceBand: string | null;
  reason: string;
}

interface Fact {
  scope: string;
  topic: string;
  claim: string;
  sourceLabel: string;
  sourceUrl: string;
  accessedOn: string;
  status: string;
}

interface Context {
  db: Queryable;
  today: string;
  states: StateRec[];
  stateByCode: Map<string, StateRec>;
  cities: CityRec[]; // with population, by population desc
  cityById: Map<number, CityRec>;
  citiesByState: Map<string, CityRec[]>;
  facts: Fact[];
  network: NetworkMover[];
  research: Awaited<ReturnType<typeof loadResearch>>;
  cardMovers: Map<string, number>;
  media: MediaAsset[];
  usedMedia: Set<string>;
  log: (line: string) => void;
}

const stateUrl = (s: StateInfo) => `/movers/${s.slug}/`;
const cityUrl = (s: StateInfo, c: CityRec) => `/movers/${s.slug}/${c.slug}/`;
const zipUrl = (s: StateInfo, c: CityRec, zip: string) => `/movers/${s.slug}/${c.slug}/${zip}/`;
const routeUrl = (slug: string) => `/routes/${slug}/`;
const costStateUrl = (s: StateInfo) => `/moving-costs/${s.slug}/`;

const CREDITS = {
  geonames: "ZIP code data from GeoNames, CC BY 4.0.",
  cities: "City data from kelvins/US-Cities-Database (MIT); population from plotly/datasets us-cities-top-1k (MIT).",
};

async function loadContext(db: Queryable, options: GenerateOptions): Promise<Context> {
  const stateRows = await db.query<{ code: string; lat: number; lng: number; zip_count: number; county_count: number; city_count: number }>("select code, lat, lng, zip_count, county_count, city_count from seo_states");
  const states: StateRec[] = STATES.map((s) => {
    const row = stateRows.rows.find((r) => r.code === s.code);
    if (!row) throw new Error(`seo_states has no row for ${s.code}; run pnpm seo:import-geo first`);
    return { ...s, lat: row.lat, lng: row.lng, zipCount: row.zip_count, countyCount: row.county_count, cityCount: row.city_count };
  });
  const cityRows = await db.query<{ id: number; state_code: string; slug: string; name: string; county_name: string | null; county_fips: string | null; lat: number; lng: number; population: number | null; zips: string[]; population_rank_in_state: number | null }>(
    "select id, state_code, slug, name, county_name, county_fips, lat, lng, population, zips, population_rank_in_state from seo_cities where population is not null order by population desc, slug",
  );
  const cities: CityRec[] = cityRows.rows.map((r) => ({ id: r.id, stateCode: r.state_code, slug: r.slug, name: r.name, countyName: r.county_name, countyFips: r.county_fips, lat: r.lat, lng: r.lng, population: r.population, zips: r.zips, rank: r.population_rank_in_state }));
  const citiesByState = new Map<string, CityRec[]>();
  for (const c of cities) citiesByState.set(c.stateCode, [...(citiesByState.get(c.stateCode) ?? []), c]);
  const facts = (await db.query<Fact>("select scope, topic, claim, source_label as \"sourceLabel\", source_url as \"sourceUrl\", accessed_on::text as \"accessedOn\", status from seo_facts where status in ('verified', 'to_verify')")).rows;
  const usedMedia = new Set((await db.query<{ media_id: string }>("select media_id from seo_media_usage")).rows.map((r) => r.media_id));
  return {
    db,
    today: new Date().toISOString().slice(0, 10),
    states,
    stateByCode: new Map(states.map((s) => [s.code, s])),
    cities,
    cityById: new Map(cities.map((c) => [c.id, c])),
    citiesByState,
    facts,
    network: await loadNetwork(db),
    research: await loadResearch(db),
    cardMovers: await rateCardMoversByState(db),
    media: options.media ?? [],
    usedMedia,
    log: options.log ?? (() => undefined),
  };
}

const factsFor = (ctx: Context, scope: string, topics?: string[]): Fact[] =>
  ctx.facts.filter((f) => f.scope === scope && (!topics || topics.includes(f.topic))).sort((a, b) => (topics ? topics.indexOf(a.topic) - topics.indexOf(b.topic) : a.topic.localeCompare(b.topic)));

const factsBlock = (facts: Fact[]): ContentBlock => ({
  type: "facts",
  items: facts.map((f) => ({ claim: f.status === "to_verify" ? `${f.claim} [Verify: primary page not yet confirmed.]` : f.claim, source: { label: f.sourceLabel, url: f.sourceUrl, accessedOn: f.accessedOn } })),
});

const sourcesOf = (facts: Fact[]): SourceRef[] => facts.map((f) => ({ label: f.sourceLabel, url: f.sourceUrl, accessedOn: f.accessedOn }));

const paidLine = true;

function nearestStates(ctx: Context, state: StateRec, count: number): { state: StateRec; miles: number }[] {
  return ctx.states
    .filter((s) => s.code !== state.code)
    .map((s) => ({ state: s, miles: distanceMiles(state, s) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count);
}

function nearestCities(ctx: Context, city: CityRec, count: number, sameState = true): { city: CityRec; miles: number }[] {
  return ctx.cities
    .filter((c) => c.id !== city.id && (sameState ? c.stateCode === city.stateCode : c.stateCode !== city.stateCode))
    .map((c) => ({ city: c, miles: distanceMiles(city, c) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count);
}

const bandOf = (miles: number) => (miles <= 250 ? "up to 250 miles" : miles <= 500 ? "250 to 500 miles" : miles <= 1000 ? "500 to 1,000 miles" : miles <= 1500 ? "1,000 to 1,500 miles" : "more than 1,500 miles");
const classify = (sameState: boolean, miles: number): MoveType => (!sameState ? "interstate" : miles <= 50 ? "local" : "intrastate");
const typeWords: Record<MoveType, string> = { local: "a local move", intrastate: "an in-state long-distance move", interstate: "an interstate move" };

function keywordFor(research: ResearchKeyword[], fallback: string, fallbackIntent: "commercial" | "informational"): { keyword: string; intent: "commercial" | "informational" | "transactional" | "navigational"; supporting: string[]; hypothesis: boolean; basis: string } {
  const measured = research.filter((r) => !r.hypothesis && r.volume !== null).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const primary = measured[0];
  const allowed = new Set(["commercial", "informational", "transactional", "navigational"]);
  if (primary) {
    const intent = (allowed.has(primary.intent ?? "") ? primary.intent : fallbackIntent) as "commercial" | "informational" | "transactional" | "navigational";
    return {
      keyword: primary.keyword,
      intent,
      supporting: [...new Set(research.filter((r) => r.keyword !== primary.keyword).map((r) => r.keyword))].slice(0, 8),
      hypothesis: false,
      basis: `${primary.source} (${primary.researchedOn ?? "undated"}), ${n(primary.volume ?? 0)}/mo`,
    };
  }
  return { keyword: fallback, intent: fallbackIntent, supporting: [...new Set(research.map((r) => r.keyword))].slice(0, 8), hypothesis: true, basis: "hypothesis: no measured volume for this keyword" };
}

function pickMedia(ctx: Context, tags: string[]): string[] {
  const asset = ctx.media.find((m) => !ctx.usedMedia.has(m.id) && m.tags.some((t) => tags.includes(t)));
  if (!asset) return [];
  ctx.usedMedia.add(asset.id);
  return [asset.id];
}

// ------------------------------------------------------------------ page drafts

export interface Draft {
  url: string;
  slug: string;
  family: SeoFamily;
  stateCode: string | null;
  cityId: number | null;
  zip: string | null;
  routeId: number | null;
  primaryKeyword: string;
  intent: string;
  supportingKeywords: string[];
  parentUrl: string | null;
  title: string;
  metaDescription: string;
  h1: string;
  content: SeoContent;
  sources: SourceRef[];
  mediaIds: string[];
  evidenceCount: number;
  /** Family-specific blocks found before the generic gates run. */
  blocked: string[];
  keywordBasis: string;
  minEvidence: number;
}

const coverageSentence = (count: CoverageCount, what: string, place: string) => {
  const e = count.explicit.length;
  const m = count.matched.length;
  if (!m) return `no mover in our network currently covers ${what} starting in ${place}`;
  if (e === m) return `${plural(m, "mover")} in our network ${m === 1 ? "lists" : "list"} ${place} for ${what}`;
  return `${plural(m, "mover")} in our network can receive ${what} starting in ${place}, ${e} of ${e === 1 ? "which names" : "which name"} ${place} in ${e === 1 ? "its" : "their"} coverage`;
};

const moversBlock = (count: CoverageCount, note: (m: NetworkMover) => string, heading: string): ContentBlock => ({ type: "movers", heading, items: moverItems(count.explicit.length ? count.explicit : count.matched, note), paidLine });

const quoteFor = (originZip: string | undefined, destZip: string | undefined, place: string, seed: number) => ({
  entry: "household" as const,
  originZip,
  destZip,
  heading: pick(seed, 11, ["See which movers cover your move", "Check coverage for this move", "Which movers can receive your request?"]),
  text: `Start the quote survey with ${place} filled in. We show the movers that cover your move, by name and USDOT number, before asking for any contact details, and you choose how many may contact you.`,
  cta: pick(seed, 12, ["Start a quote request", "See available movers", "Check my move"]),
});

// ---------------------------------------------------------------- state

function stateDraft(ctx: Context, state: StateRec): Draft {
  const seed = seedOf(state.slug);
  const cities = ctx.citiesByState.get(state.code) ?? [];
  const largest = cities[0];
  const second = cities[1];
  const nearest = nearestStates(ctx, state, 5);
  const farBig = ["CA", "TX", "FL", "NY"].filter((c) => c !== state.code && !nearest.some((x) => x.state.code === c)).slice(0, 3).map((c) => ({ state: ctx.stateByCode.get(c)!, miles: distanceMiles(state, ctx.stateByCode.get(c)!) }));
  const otherZip = nearest[0]?.state ? (ctx.citiesByState.get(nearest[0].state.code)?.[0]?.zips[0] ?? "") : "";
  const coverage = stateCoverage(ctx.network, largest?.zips[0] ?? "", second?.zips[0] ?? largest?.zips[0] ?? "", otherZip);
  const regulator = factsFor(ctx, `state:${state.code}`, ["regulator"]);
  const national = factsFor(ctx, "national", pick(seed, 1, [["interstate_scope", "written_estimate", "rule_110"], ["interstate_scope", "physical_survey", "valuation"], ["interstate_scope", "bill_of_lading", "booklets"]]));
  const kw = keywordFor(researchForState(ctx.research, state.code), `moving companies ${state.name.toLowerCase()}`, "commercial");

  const dataPoints: DataPoint[] = [
    { label: "ZIP codes", value: n(state.zipCount), basis: "GeoNames postal codes (CC BY 4.0), built 2026-10-28" },
    { label: "Counties", value: n(state.countyCount), basis: "GeoNames county codes, built 2026-10-28" },
    { label: "Network movers listing the state (local)", value: n(coverage.local.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
    { label: "Network movers for moves between states", value: n(coverage.interstate.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (largest?.population) dataPoints.push({ label: `Largest city by population`, value: `${largest.name} (${n(largest.population)})`, basis: "plotly us-cities-top-1k (MIT)" });

  const answerVariants = [
    `${state.name} has ${n(state.zipCount)} ZIP codes across ${n(state.countyCount)} counties${largest ? `, and its largest city by population is ${largest.name}` : ""}. As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}.`,
    `As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}; for moves between states, ${coverageSentence(coverage.interstate, "those moves", state.name)}. ${state.name} spans ${n(state.countyCount)} counties and ${n(state.zipCount)} ZIP codes${largest ? `; ${largest.name} is its largest city` : ""}.`,
    `${largest ? `From ${largest.name} to the smallest towns, ${state.name}` : state.name} covers ${n(state.countyCount)} counties and ${n(state.zipCount)} ZIP codes. On ${ctx.today}, ${coverageSentence(coverage.local, "local moves", state.name)}, while ${coverageSentence(coverage.interstate, "interstate moves", state.name)}.`,
  ];

  const sections: ContentSection[] = [];
  if (cities.length) {
    const top = cities.slice(0, 12);
    sections.push({
      id: "cities",
      heading: pick(seed, 2, [`Cities in ${state.name} with their own pages`, `Where ${state.name} moves start: the largest cities`, `${state.name} cities by population`]),
      blocks: [
        { type: "paragraph", text: `${plural(cities.length, "city", "cities")} in ${state.name} ${cities.length === 1 ? "has" : "have"} a published population figure in our dataset. ${top.length < cities.length ? `The ${top.length} largest are listed here; ` : ""}each city page shows the ZIP codes it covers, nearby cities with distances and the movers that name its county.` },
        { type: "table", caption: "Population (latest published figure), ZIP codes and county", columns: ["City", "Population", "ZIP codes", "County"], rows: top.map((c) => [`[${c.name}](${cityUrl(state, c)})`, c.population ? n(c.population) : "n/a", n(c.zips.length), c.countyName ? `${c.countyName} County` : "n/a"]) },
      ],
    });
  }
  sections.push({
    id: "movers",
    heading: pick(seed, 3, [`Movers in our network that cover ${state.name}`, `Who can receive a request starting in ${state.name}`, `${state.name} coverage in the network`]),
    blocks: coverage.local.matched.length || coverage.interstate.matched.length
      ? [
          { type: "paragraph", text: `Movers set their own coverage: where a move may start, where it may end and which kinds of move they take. For a 2-bedroom move starting in ${largest?.name ?? state.name}: ${coverageSentence(coverage.local, "local moves", state.name)}; ${coverageSentence(coverage.intrastate, "in-state long-distance moves", state.name)}; ${coverageSentence(coverage.interstate, "moves between states", state.name)}. Each count is recomputed when coverage changes.` },
          moversBlock(coverage.interstate.matched.length >= coverage.local.matched.length ? coverage.interstate : coverage.local, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : "Covers moves starting in " + state.name), "Listed movers"),
        ]
      : [
          { type: "paragraph", text: `As of ${ctx.today}, no mover in our network lists ${state.name} as a place its moves can start. We publish this page for the facts it holds and say so plainly rather than list movers based elsewhere. A request from ${state.name} tells you before any contact details are asked for whether any mover covers it.` },
          { type: "note", text: "Only approved household-goods carriers with no broker authority on their FMCSA record can join the network; container, storage and truck-rental firms never appear in a count." },
        ],
  });
  const routeRows = [...nearest, ...farBig].map(({ state: s, miles }) => [`[Moving from ${state.name} to ${s.name}](${routeUrl(`${state.slug}-to-${s.slug}`)})`, milesText(miles), bandOf(miles), `[${s.name} to ${state.name}](${routeUrl(`${s.slug}-to-${state.slug}`)})`]);
  sections.push({
    id: "routes",
    heading: pick(seed, 4, [`Routes out of and into ${state.name}`, `Moving between ${state.name} and other states`, `${state.name} state-to-state routes`]),
    blocks: [
      { type: "paragraph", text: `Distances below are straight-line miles between state centroids (the mean of each state's ZIP centroids), which is what the cost model uses to pick a distance band; driving distance is longer. ${nearest[0] ? `${nearest[0].state.name} is the nearest state centroid at ${milesText(nearest[0].miles)}` : ""}${farBig[0] ? `, and ${farBig[farBig.length - 1]!.state.name} the farthest listed at ${milesText(farBig[farBig.length - 1]!.miles)}` : ""}.` },
      { type: "table", caption: "Distance band as the cost model classifies it", columns: ["Route", "Centroid distance", "Band", "Reverse route"], rows: routeRows },
    ],
  });
  return finishStateDraft(ctx, state, seed, kw, dataPoints, answerVariants, sections, coverage, regulator, national, largest, second, cities);
}

function finishStateDraft(ctx: Context, state: StateRec, seed: number, kw: ReturnType<typeof keywordFor>, dataPoints: DataPoint[], answerVariants: string[], sections: ContentSection[], coverage: ReturnType<typeof stateCoverage>, regulator: Fact[], national: Fact[], largest: CityRec | undefined, second: CityRec | undefined, cities: CityRec[]): Draft {
  const costs: CostBlock[] = [];
  const pending: Promise<void>[] = [];
  void pending;
  const draft: Draft = {
    url: stateUrl(state),
    slug: state.slug,
    family: "state",
    stateCode: state.code,
    cityId: null,
    zip: null,
    routeId: null,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: "/movers/",
    title: `Moving Companies in ${state.name} | Screened ${state.name} Movers & Costs`,
    metaDescription: clampDescription(`${state.name} movers screened on their FMCSA record: ${n(coverage.interstate.matched.length)} network movers for moves between states and ${n(coverage.local.explicit.length)} listing the state for local moves as of ${ctx.today}, ${n(state.zipCount)} ZIP codes, cost factors and the state's regulator.`),
    h1: `Moving companies in ${state.name}`,
    content: {
      version: 1,
      intro: { answer: pick(seed, 0, answerVariants), dataPoints },
      sections,
      faq: [],
      related: [],
      quote: quoteFor(largest?.zips[0], undefined, `the ZIP code of ${largest?.name ?? state.name}`, seed),
      schemaType: "CollectionPage",
      credits: [CREDITS.geonames, CREDITS.cities],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf([...regulator, ...national]),
    mediaIds: pickMedia(ctx, ["state", state.slug, "generic"]),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  // Cost and regulator sections, FAQ and related are attached by the async finisher below.
  (draft as Draft & { _finish?: () => Promise<void> })._finish = async () => {
    const localBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: 10, moveType: "local", scope: `a local move within ${state.name} (within 50 miles)` });
    const intraMiles = largest && second ? distanceMiles(largest, second) : 120;
    const intraBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: Math.max(51, intraMiles), moveType: "intrastate", scope: `an in-state long-distance move in ${state.name}${largest && second ? `, for example ${largest.name} to ${second.name} at ${milesText(intraMiles)}` : ""}` });
    costs.push(localBlock, intraBlock);
    const hasRange = costs.some((c) => c.rows.length);
    draft.content.sections.push({
      id: "costs",
      heading: pick(seed, 5, [`What moves starting in ${state.name} cost: the data we have`, `Cost factors for ${state.name} moves`, `${state.name} moving cost ranges from rate cards`]),
      blocks: [
        { type: "paragraph", text: hasRange ? `Ranges below are the 25th to 75th percentile of what movers with active rate cards covering ${state.name} would charge for a typical job of each size, built by cost-model-v1 from at least five movers' cards. They are planning figures, never a quote: movers set their own prices and American Moving Choice gives no estimates. [How the range is calculated](/moving-cost-calculator/method/).` : `We publish a cost range only when at least five different movers' active rate cards cover a move type in ${state.name}. ${ctx.cardMovers.get(state.code) ? `${plural(ctx.cardMovers.get(state.code)!, "mover")} with a card ${ctx.cardMovers.get(state.code) === 1 ? "covers" : "cover"} ${state.name} today` : `No mover has filed a rate card covering ${state.name} yet`}, so the blocks below say what is missing instead of showing a figure.` },
        { type: "cost", block: localBlock },
        { type: "cost", block: intraBlock },
      ],
    });
    draft.content.sections.push({
      id: "rules",
      heading: pick(seed, 6, [`Who regulates movers in ${state.name}`, `${state.name} moving rules: what we have verified`, `Licensing and rules for ${state.name} moves`]),
      blocks: regulator.length
        ? [factsBlock(regulator), { type: "paragraph", text: `Moves that cross a state line fall under FMCSA's rules instead. ${pick(seed, 7, ["Three of them matter before you sign anything:", "The ones that decide your paperwork:", "Start with these:"])}` }, factsBlock(national)]
        : [
            { type: "paragraph", text: `We have not yet verified which ${state.name} agency licenses movers for moves within the state, so this page makes no claim about it; the section will carry an official source when one has been checked. FMCSA's rules apply to any move that crosses a state line:` },
            factsBlock(national),
            { type: "paragraph", text: `Check an interstate mover's record on [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url}) or with [Verify a mover](/verify-a-mover/).` },
          ],
    });
    const distLargest = largest && second ? distanceMiles(largest, second) : null;
    const faq: FaqItem[] = [
      { question: `How many ZIP codes and counties does ${state.name} have?`, answer: `${n(state.zipCount)} ZIP codes and ${n(state.countyCount)} counties in the GeoNames postal dataset we use for matching (built 2026-10-28). Movers can name any of them in their coverage rules.` },
      { question: `Which movers in the network cover moves starting in ${state.name}?`, answer: coverage.interstate.matched.length || coverage.local.matched.length ? `As of ${ctx.today}: ${coverageSentence(coverage.local, "local moves", state.name)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}. The list above names them; the survey checks your exact ZIP codes.` : `None as of ${ctx.today}. The survey will tell you so before asking for contact details, and we never list movers based elsewhere as if they covered ${state.name}.` },
    ];
    if (largest && second && distLargest !== null) faq.push({ question: `Is a move from ${largest.name} to ${second.name} a local move?`, answer: `No${distLargest <= 50 ? "t necessarily: " : ": "}the two centroids are ${milesText(distLargest)} apart, so on this site it counts as ${typeWords[classify(true, distLargest)]}${distLargest > 50 ? ", priced by weight and distance rather than by the hour" : ""}.` });
    faq.push({ question: `Who licenses movers for moves within ${state.name}?`, answer: regulator[0] ? `${regulator[0].claim} (Source: ${regulator[0].sourceLabel}, read ${regulator[0].accessedOn}.)` : `We have not verified a ${state.name} regulator yet and won't guess. Interstate moves starting or ending in ${state.name} fall under FMCSA's rules; check the mover's USDOT record before hiring.` });
    faq.push({ question: `Is there a cost range for ${state.name}?`, answer: hasRange ? `Yes, for the move types shown above, from at least five movers' active rate cards (as of ${costs.find((c) => c.rows.length)!.asOf}). Other move types and sizes appear once enough cards cover them.` : `Not yet. A range needs at least five different movers' active rate cards covering ${state.name}; the calculator and this page will show one when they exist.` });
    draft.content.faq = faq;
    const related: RelatedGroup[] = [];
    if (cities.length) related.push({ heading: `${state.name} city pages`, links: cities.slice(0, 10).map((c) => ({ href: cityUrl(state, c), label: `Movers in ${c.name}, ${state.code}`, relation: "child" })) });
    related.push({ heading: "Routes", links: [...nearestStates(ctx, state, 4).map(({ state: s }) => ({ href: routeUrl(`${state.slug}-to-${s.slug}`), label: `${state.name} to ${s.name}`, relation: "route" })), ...nearestStates(ctx, state, 4).map(({ state: s }) => ({ href: routeUrl(`${s.slug}-to-${state.slug}`), label: `${s.name} to ${state.name}`, relation: "route" }))] });
    related.push({ heading: "Costs and services", links: [{ href: costStateUrl(state), label: `Moving costs in ${state.name}`, relation: "cost" }, { href: "/moving-costs/", label: "How much do movers cost?", relation: "cost" }, { href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/services/interstate/", label: "Interstate movers", relation: "service" }] });
    related.push({ heading: "Questions people ask", links: [{ href: "/questions/who-regulates-moving-companies/", label: "Who regulates moving companies?", relation: "question" }, { href: "/questions/what-is-a-binding-estimate/", label: "What is a binding estimate?", relation: "question" }, { href: "/planning/moving-out-of-state-checklist/", label: "Moving out of state checklist", relation: "planning" }, { href: "/verify-a-mover/", label: "Verify a mover", relation: "tool" }] });
    draft.content.related = related;
    draft.evidenceCount = dataPoints.length + regulator.length + national.length + costs.filter((c) => c.rows.length).length + (cities.length ? 1 : 0) + 1;
  };
  return draft;
}

// ---------------------------------------------------------------- city

function cityDraft(ctx: Context, city: CityRec): Draft {
  const state = ctx.stateByCode.get(city.stateCode)!;
  const seed = seedOf(`${state.slug}/${city.slug}`);
  const nearby = nearestCities(ctx, city, 5);
  const metros = (ctx.citiesByState.get(state.code) ?? []).filter((c) => c.id !== city.id).slice(0, 3);
  const outOfState = nearestCities(ctx, city, 3, false);
  const nearestOther = outOfState[0];
  const coverage = cityCoverage(ctx.network, city.zips[0] ?? "", city.countyFips ?? "", nearestOther?.city.zips[0] ?? "");
  const regulator = factsFor(ctx, `state:${state.code}`, ["regulator"]);
  const national = factsFor(ctx, "national", pick(seed, 1, [["accessorials"], ["red_flags"], ["written_estimate"], ["physical_survey"]]));
  const kw = keywordFor(researchForCity(ctx.research, state.slug, state.code, city.slug), `moving companies ${city.name.toLowerCase()} ${state.code.toLowerCase()}`, "commercial");
  const county = city.countyName ? `${city.countyName} County` : countyLabel(city.countyFips)?.replace(/, [A-Z]{2}$/, "") ?? "its county";
  const largestInState = ctx.citiesByState.get(state.code)?.[0];
  const toLargest = largestInState && largestInState.id !== city.id ? distanceMiles(city, largestInState) : null;

  const dataPoints: DataPoint[] = [
    { label: "ZIP codes", value: n(city.zips.length), basis: "GeoNames postal codes (CC BY 4.0), built 2026-10-28" },
    { label: "County", value: county, basis: "GeoNames county of the city's ZIP codes" },
    { label: "Network movers naming the county for local moves", value: n(coverage.local.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
    { label: "Network movers for moves between states", value: n(coverage.interstate.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (city.population) dataPoints.push({ label: "Population", value: n(city.population), basis: "plotly us-cities-top-1k (MIT), latest published figure" });

  const answer = pick(seed, 0, [
    `${city.name} sits in ${county}, ${state.name}, with ${plural(city.zips.length, "ZIP code")}${city.population ? ` and a population of ${n(city.population)}` : ""}${city.rank ? ` (${ordinal(city.rank)} largest city in the state by that figure)` : ""}. As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}, and ${coverageSentence(coverage.interstate, "moves between states", state.name)}.`,
    `As of ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}; for moves between states starting in ${state.name}, ${coverageSentence(coverage.interstate, "those moves", state.name)}. ${city.name} covers ${plural(city.zips.length, "ZIP code")} in ${county}${city.population ? ` and has a population of ${n(city.population)}` : ""}.`,
    `${city.name}, ${state.code}${city.population ? ` (population ${n(city.population)})` : ""} spans ${plural(city.zips.length, "ZIP code")} in ${county}${toLargest !== null ? `, ${milesText(toLargest)} from ${largestInState!.name}` : ""}. On ${ctx.today}, ${coverageSentence(coverage.local, "local moves", county)}, while ${coverageSentence(coverage.interstate, "interstate moves", state.name)}.`,
  ]);

  const zipList = city.zips.slice(0, 15).join(", ") + (city.zips.length > 15 ? ` and ${n(city.zips.length - 15)} more` : "");
  const distanceRows: string[][] = [
    ...nearby.map(({ city: c, miles }) => [`[${c.name}, ${c.stateCode}](${cityUrl(state, c)})`, milesText(miles), typeWords[classify(true, miles)].replace(/^an? /, "")]),
    ...metros.filter((m) => !nearby.some((x) => x.city.id === m.id)).map((m) => [`[${m.name}, ${m.stateCode}](${cityUrl(state, m)})`, milesText(distanceMiles(city, m)), typeWords[classify(true, distanceMiles(city, m))].replace(/^an? /, "")]),
    ...outOfState.map(({ city: c, miles }) => [`[${c.name}, ${c.stateCode}](${cityUrl(ctx.stateByCode.get(c.stateCode)!, c)})`, milesText(miles), `interstate move (${bandOf(miles)})`]),
  ];
  const sections: ContentSection[] = [
    {
      id: "glance",
      heading: pick(seed, 2, [`${city.name} at a glance`, `Facts that shape a move from ${city.name}`, `${city.name}, ${state.code}: the data behind this page`]),
      blocks: [
        { type: "table", columns: ["Fact", "Value", "Source"], rows: [["State", `[${state.name}](${stateUrl(state)})`, "States table"], ["County", county, "GeoNames"], ["ZIP codes", `${n(city.zips.length)}: ${zipList}`, "GeoNames"], ...(city.population ? [["Population", n(city.population), "plotly us-cities-top-1k"]] : []), ...(toLargest !== null ? [[`Distance to ${largestInState!.name}`, milesText(toLargest), "Haversine between centroids"]] : [])] },
      ],
    },
    {
      id: "distances",
      heading: pick(seed, 3, [`Local, in-state and interstate moves from ${city.name}`, `How far is ${city.name} from nearby cities?`, `Where ${city.name} moves go, and how they are classified`]),
      blocks: [
        { type: "paragraph", text: `A move within 50 straight-line miles in ${state.name} counts as local (hourly pricing); farther in-state moves are in-state long distance, and any move across the state line is interstate, priced by weight and distance band. ${nearby[0] ? `${nearby[0].city.name} is the nearest city with its own page at ${milesText(nearby[0].miles)}` : ""}${nearestOther ? `; the nearest out-of-state city in our set is ${nearestOther.city.name}, ${nearestOther.city.stateCode}, at ${milesText(nearestOther.miles)}` : ""}.` },
        { type: "table", caption: "Straight-line miles between city centroids", columns: ["Destination", "Distance", "Classified as"], rows: distanceRows },
      ],
    },
    {
      id: "movers",
      heading: pick(seed, 4, [`Movers that name ${county} for local moves`, `Network movers covering ${city.name}`, `Who can receive a ${city.name} request`]),
      blocks: coverage.local.matched.length || coverage.interstate.matched.length
        ? [
            { type: "paragraph", text: `Local coverage counts only movers whose rules name ${county} or one of ${city.name}'s ZIP codes for local moves, never statewide or nationwide catch-all rules. ${coverageSentence(coverage.local, "local moves", county)}; ${coverageSentence(coverage.interstate, "moves between states", state.name)}.` },
            moversBlock(coverage.local.explicit.length ? coverage.local : coverage.interstate, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : `Covers ${county}`), coverage.local.explicit.length ? `Movers naming ${county}` : `Movers covering moves between states from ${state.name}`),
          ]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network names ${county} for local moves and none covers moves between states starting in ${state.name}. We don't list movers based elsewhere as if they served ${city.name}; a request from one of its ZIP codes tells you before any contact details whether that has changed.` }],
    },
  ];
  const draft: Draft = {
    url: cityUrl(state, city),
    slug: city.slug,
    family: "city",
    stateCode: state.code,
    cityId: city.id,
    zip: null,
    routeId: null,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: stateUrl(state),
    title: `Movers in ${city.name}, ${state.code} | Compare Screened Moving Companies`,
    metaDescription: clampDescription(`${city.name}, ${state.code} movers screened on their FMCSA record: ${n(coverage.local.explicit.length)} network movers name ${county} for local moves and ${n(coverage.interstate.matched.length)} cover interstate moves as of ${ctx.today}; ${plural(city.zips.length, "ZIP code")}, distances to nearby cities and cost factors.`),
    h1: `Movers in ${city.name}, ${state.code}: compare screened moving companies`,
    content: { version: 1, intro: { answer, dataPoints }, sections, faq: [], related: [], quote: quoteFor(city.zips[0], undefined, `${city.name}'s ZIP code ${city.zips[0] ?? ""}`, seed), schemaType: "CollectionPage", credits: [CREDITS.geonames, CREDITS.cities], dataAsOf: ctx.today },
    sources: sourcesOf([...regulator, ...national]),
    mediaIds: pickMedia(ctx, ["city", `${state.slug}/${city.slug}`, city.slug]),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  (draft as Draft & { _finish?: () => Promise<void> })._finish = async () => {
    const localBlock = await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: 10, moveType: "local", scope: `a local move within ${state.name} (within 50 miles; the model counts rate cards by origin state, so this range is state-level, not ${city.name}-specific)` });
    const interBlock = nearestOther ? await costBlockFor(ctx.db, { originState: state.code, areaName: state.name, miles: nearestOther.miles, moveType: "interstate", scope: `an interstate move from ${state.name} of about ${milesText(nearestOther.miles)}, for example ${city.name} to ${nearestOther.city.name}, ${nearestOther.city.stateCode}` }) : null;
    const blocks: ContentBlock[] = [{ type: "paragraph", text: localBlock.rows.length || interBlock?.rows.length ? `Ranges are the 25th to 75th percentile from at least five movers' active rate cards covering ${state.name}, built by cost-model-v1 for a typical job of each size. Planning figures only, never a quote; movers set their own prices. [Method](/moving-cost-calculator/method/).` : `No cost range exists for ${city.name} yet: a range needs at least five different movers' active rate cards covering ${state.name} for the move type, and ${ctx.cardMovers.get(state.code) ? `only ${plural(ctx.cardMovers.get(state.code)!, "mover")} ${ctx.cardMovers.get(state.code) === 1 ? "has" : "have"} one` : "none has filed one"}. The blocks below say so rather than show a figure.` }, { type: "cost", block: localBlock }];
    if (interBlock) blocks.push({ type: "cost", block: interBlock });
    draft.content.sections.push({ id: "costs", heading: pick(seed, 5, [`What a move from ${city.name} costs: the data we have`, `${city.name} moving cost ranges`, `Cost factors for ${city.name} moves`]), blocks });
    draft.content.sections.push({
      id: "rules",
      heading: pick(seed, 6, [`Rules that apply to ${city.name} moves`, `Licensing and your rights on a ${city.name} move`, `Who regulates movers serving ${city.name}`]),
      blocks: [regulator.length ? factsBlock(regulator) : { type: "paragraph", text: `We have not yet verified which ${state.name} agency licenses movers for in-state moves, so this page makes no claim about it. For any move from ${city.name} that crosses the state line, FMCSA's rules apply:` }, factsBlock(national)],
    });
    const farthest = [...nearby, ...metros.map((m) => ({ city: m, miles: distanceMiles(city, m) }))].sort((a, b) => b.miles - a.miles)[0];
    draft.content.faq = [
      ...(nearby[0] ? [{ question: `Is moving from ${city.name} to ${nearby[0].city.name} a local move?`, answer: `${nearby[0].miles <= 50 ? "Yes" : "No"}: the centroids are ${milesText(nearby[0].miles)} apart, so it counts as ${typeWords[classify(true, nearby[0].miles)]} on this site${nearby[0].miles <= 50 ? ", priced by the hour by most movers" : ", priced by weight and distance"}.` }] : []),
      { question: `How many ZIP codes does ${city.name} have?`, answer: `${plural(city.zips.length, "ZIP code")} in the GeoNames dataset: ${zipList}. A mover can name any of them, or all of ${county}, in its coverage.` },
      { question: `Which movers cover local moves in ${county}?`, answer: coverage.local.explicit.length ? `As of ${ctx.today}, ${joinAnd(coverage.local.explicit.slice(0, 5).map((m) => m.name))}${coverage.local.explicit.length > 5 ? ` and ${coverage.local.explicit.length - 5} more` : ""} name ${county} or a ${city.name} ZIP code for local moves.` : `None names ${county} for local moves as of ${ctx.today}. ${coverage.interstate.matched.length ? `${plural(coverage.interstate.matched.length, "mover")} cover moves between states starting in ${state.name}.` : "The survey will say so before asking for contact details."}` },
      ...(farthest ? [{ question: `What is the farthest listed city from ${city.name} in ${state.name}?`, answer: `${farthest.city.name}, at ${milesText(farthest.miles)} in a straight line, which the cost model would treat as ${typeWords[classify(true, farthest.miles)]}${farthest.miles > 50 ? ` in the ${bandOf(farthest.miles)} band` : ""}.` }] : []),
    ];
    draft.content.related = [
      { heading: "Nearby city pages", links: nearby.map(({ city: c }) => ({ href: cityUrl(state, c), label: `Movers in ${c.name}, ${c.stateCode}`, relation: "nearby" })) },
      { heading: `${state.name}`, links: [{ href: stateUrl(state), label: `Moving companies in ${state.name}`, relation: "parent" }, { href: costStateUrl(state), label: `Moving costs in ${state.name}`, relation: "cost" }] },
      { heading: `Routes from ${city.name}`, links: outOfState.map(({ city: c }) => ({ href: routeUrl(`${city.slug}-${city.stateCode.toLowerCase()}-to-${c.slug}-${c.stateCode.toLowerCase()}`), label: `Moving from ${city.name} to ${c.name}, ${c.stateCode}`, relation: "route" })).concat(metros.slice(0, 2).map((m) => ({ href: routeUrl(`${city.slug}-${city.stateCode.toLowerCase()}-to-${m.slug}-${m.stateCode.toLowerCase()}`), label: `Moving from ${city.name} to ${m.name}, ${m.stateCode}`, relation: "route" }))) },
      { heading: "Services and questions", links: [{ href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/services/packing/", label: "Packing services", relation: "service" }, { href: "/questions/how-much-do-local-movers-cost/", label: "How much do local movers cost?", relation: "question" }, { href: "/questions/how-many-movers-do-i-need/", label: "How many movers do I need?", relation: "question" }, { href: "/planning/moving-day-checklist/", label: "Moving day checklist", relation: "planning" }] },
    ];
    draft.evidenceCount = dataPoints.length + regulator.length + national.length + (localBlock.rows.length ? 1 : 0) + (interBlock?.rows.length ? 1 : 0) + distanceRows.length;
  };
  return draft;
}

const ordinal = (k: number) => `${k}${k % 100 >= 11 && k % 100 <= 13 ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][k % 10]}`;

// ---------------------------------------------------------------- zip

function zipDraft(ctx: Context, zip: string, city: CityRec): Draft {
  const state = ctx.stateByCode.get(city.stateCode)!;
  const seed = seedOf(zip);
  const loc = lookupZip(zip)!;
  const coverage = zipCoverage(ctx.network, zip);
  const toCenter = distanceMiles(loc, city);
  const siblings = city.zips.filter((z) => z !== zip).map((z) => ({ zip: z, miles: distanceMiles(loc, lookupZip(z)!) })).sort((a, b) => a.miles - b.miles);
  const county = countyLabel(loc.countyFips) ?? "its county";
  const cityCounty = city.countyFips;
  const distinctCounty = cityCounty !== null && loc.countyFips !== cityCounty;
  const national = factsFor(ctx, "national", ["accessorials"]);
  const dataPoints: DataPoint[] = [
    { label: "Place name", value: `${loc.city}, ${loc.state}`, basis: "GeoNames" },
    { label: "County", value: county, basis: "GeoNames" },
    { label: `Distance to the ${city.name} centroid`, value: milesText(toCenter), basis: "Haversine between centroids" },
    { label: "Network movers naming this ZIP or county (local)", value: n(coverage.explicit.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  const draft: Draft = {
    url: zipUrl(state, city, zip),
    slug: zip,
    family: "zip",
    stateCode: state.code,
    cityId: city.id,
    zip,
    routeId: null,
    primaryKeyword: `movers ${zip}`,
    intent: "commercial",
    supportingKeywords: [`moving companies ${zip}`, `movers ${loc.city.toLowerCase()} ${zip}`],
    parentUrl: cityUrl(state, city),
    title: `Movers in ${zip} (${loc.city}, ${state.code}) | Screened Local Moving Companies`,
    metaDescription: clampDescription(`ZIP ${zip} in ${county}: ${n(coverage.explicit.length)} network movers name this ZIP code or county for local moves as of ${ctx.today}, ${milesText(toCenter)} from the ${city.name} centroid, with the rules and cost factors that apply.`),
    h1: `Movers in ZIP code ${zip}, ${loc.city}, ${state.code}`,
    content: {
      version: 1,
      intro: {
        answer: pick(seed, 0, [
          `ZIP code ${zip} belongs to ${loc.city} in ${county}, ${milesText(toCenter)} from the ${city.name} centroid. As of ${ctx.today}, ${coverageSentence(coverage, "local moves", `ZIP ${zip} or ${county}`)}.`,
          `As of ${ctx.today}, ${coverageSentence(coverage, "local moves", `ZIP ${zip} or ${county}`)}. The ZIP sits in ${loc.city}, ${county}, ${milesText(toCenter)} from ${city.name}'s centroid.`,
        ]),
        dataPoints,
      },
      sections: [
        { id: "glance", heading: `ZIP ${zip} at a glance`, blocks: [{ type: "table", columns: ["Fact", "Value"], rows: [["Place", `${loc.city}, ${state.name}`], ["County", county + (distinctCounty ? ` (the ${city.name} page's main county is ${city.countyName} County)` : "")], ["Centroid", `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`], [`Other ${city.name} ZIP codes`, n(siblings.length)], ["Nearest ZIP codes", siblings.slice(0, 5).map((s) => `${s.zip} (${milesText(s.miles)})`).join(", ") || "none in this city"]] }] },
        { id: "movers", heading: `Movers naming ZIP ${zip} or ${county}`, blocks: [{ type: "paragraph", text: `A local request from ${zip} reaches only movers whose rules name this ZIP code or ${county} for local moves. ${coverageSentence(coverage, "local moves", `ZIP ${zip}`)}.` }, moversBlock(coverage, (m) => (m.explicit.some((e) => e.zips.has(zip)) ? `Names ZIP ${zip}` : `Names ${county}`), "Movers")] },
        { id: "rules", heading: "Charges that depend on the address", blocks: [{ type: "paragraph", text: `Stairs, elevators, long carries and parking at a ${zip} address change a local move's hours and an interstate move's tariff charges. Describe them at the survey.` }, factsBlock(national)] },
      ],
      faq: [
        { question: `Is ZIP ${zip} part of ${city.name}?`, answer: `GeoNames lists it under ${loc.city}, ${county}, ${milesText(toCenter)} from the ${city.name} centroid${distinctCounty ? `, in a different county from the city's main county` : ""}.` },
        { question: `How many movers cover ZIP ${zip}?`, answer: `${plural(coverage.explicit.length, "mover")} name${coverage.explicit.length === 1 ? "s" : ""} it or ${county} for local moves as of ${ctx.today}; ${plural(coverage.matched.length, "mover")} could receive a local request from it.` },
      ],
      related: [
        { heading: "Parent pages", links: [{ href: cityUrl(state, city), label: `Movers in ${city.name}, ${state.code}`, relation: "parent" }, { href: stateUrl(state), label: `Moving companies in ${state.name}`, relation: "parent" }] },
        { heading: "Services", links: [{ href: "/services/local/", label: "Local movers", relation: "service" }, { href: "/questions/do-movers-charge-for-stairs-and-long-carries/", label: "Do movers charge extra for stairs?", relation: "question" }] },
      ],
      quote: quoteFor(zip, undefined, `ZIP ${zip}`, seed),
      schemaType: "CollectionPage",
      credits: [CREDITS.geonames],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf(national),
    mediaIds: [],
    evidenceCount: dataPoints.length + national.length + Math.min(siblings.length, 5),
    blocked: [],
    keywordBasis: "hypothesis: ZIP-level keywords are not measured",
    minEvidence: 5,
  };
  if (coverage.explicit.length < 3) draft.blocked.push(`blocked: insufficient evidence (zip gate: ${coverage.explicit.length} movers name the ZIP or county, 3 needed)`);
  if (!distinctCounty && coverage.explicit.length < 3) draft.blocked.push("blocked: no distinct facts beyond the city page");
  return draft;
}

// ---------------------------------------------------------------- route

function routeDraft(ctx: Context, route: RouteRec): Draft {
  const o = ctx.stateByCode.get(route.originState)!;
  const d = ctx.stateByCode.get(route.destinationState)!;
  const oc = route.originCityId ? ctx.cityById.get(route.originCityId) : undefined;
  const dc = route.destinationCityId ? ctx.cityById.get(route.destinationCityId) : undefined;
  const isCity = route.kind === "city";
  const originName = isCity ? `${oc!.name}, ${o.code}` : o.name;
  const destName = isCity ? `${dc!.name}, ${d.code}` : d.name;
  const originShort = isCity ? oc!.name : o.name;
  const destShort = isCity ? dc!.name : d.name;
  const seed = seedOf(route.slug);
  const originZip = isCity ? oc!.zips[0] : ctx.citiesByState.get(o.code)?.[0]?.zips[0];
  const destZip = isCity ? dc!.zips[0] : ctx.citiesByState.get(d.code)?.[0]?.zips[0];
  const coverage = originZip && destZip ? routeCoverage(ctx.network, originZip, destZip, route.moveType) : { matched: [], explicit: [] };
  const originReg = factsFor(ctx, `state:${o.code}`, ["regulator"]);
  const destReg = o.code === d.code ? [] : factsFor(ctx, `state:${d.code}`, ["regulator"]);
  const national = route.moveType === "interstate" ? factsFor(ctx, "national", pick(seed, 1, [["written_estimate", "physical_survey", "rule_110", "bill_of_lading"], ["physical_survey", "binding_estimate", "valuation", "weighing"], ["written_estimate", "rule_110", "valuation", "arbitration"]])) : factsFor(ctx, "national", ["interstate_scope"]);
  const reverseSlug = isCity ? `${dc!.slug}-${d.code.toLowerCase()}-to-${oc!.slug}-${o.code.toLowerCase()}` : `${d.slug}-to-${o.slug}`;
  const research = isCity ? researchForCityRoute(ctx.research, oc!.slug, dc!.slug) : researchForStateRoute(ctx.research, o.code, d.code, route.slug);
  const kw = keywordFor(research, `moving from ${originShort.toLowerCase()} to ${destShort.toLowerCase()}`, "informational");
  const band = route.distanceBand ? bandOf(route.distanceMiles) : null;
  const dataPoints: DataPoint[] = [
    { label: "Straight-line distance", value: milesText(route.distanceMiles), basis: `Haversine between ${isCity ? "city" : "state"} centroids (GeoNames)` },
    { label: "Classified as", value: `${typeWords[route.moveType].replace(/^an? /, "")}${band ? ` (${band})` : ""}`, basis: "@amc/core classifyMove, 50-mile local radius" },
    { label: "Network movers covering this direction", value: n(coverage.matched.length), basis: `American Moving Choice coverage rules, ${ctx.today}` },
  ];
  if (isCity) {
    if (oc!.population && dc!.population) dataPoints.push({ label: "Populations", value: `${originShort} ${n(oc!.population)}; ${destShort} ${n(dc!.population)}`, basis: "plotly us-cities-top-1k (MIT)" });
  } else {
    dataPoints.push({ label: "ZIP codes at each end", value: `${o.name} ${n(o.zipCount)}; ${d.name} ${n(d.zipCount)}`, basis: "GeoNames" });
  }
  const answer = pick(seed, 0, [
    `Moving from ${originName} to ${destName} is ${typeWords[route.moveType]} of about ${milesText(route.distanceMiles)} in a straight line${band ? `, which the cost model prices in the ${band} band` : ""}. As of ${ctx.today}, ${coverageSentence(coverage, "this direction", originShort)}${route.moveType === "interstate" ? ", and FMCSA's interstate rules apply from the written estimate to delivery" : ""}.`,
    `${originName} to ${destName} measures about ${milesText(route.distanceMiles)} between centroids, so it is ${typeWords[route.moveType]}${band ? ` in the ${band} band` : ""}. On ${ctx.today}, ${coverageSentence(coverage, "moves in this direction", originShort)}. The reverse direction has [its own page](${routeUrl(reverseSlug)}).`,
    `About ${milesText(route.distanceMiles)} separate ${originName} and ${destName} in a straight line, making this ${typeWords[route.moveType]}${band ? ` (${band})` : ""}. As of ${ctx.today}, ${coverageSentence(coverage, "this route", originShort)}.`,
  ]);
  const factRows: string[][] = isCity
    ? [["Origin", `[${originName}](${cityUrl(o, oc!)})`], ["Destination", `[${destName}](${cityUrl(d, dc!)})`], ["Origin county", oc!.countyName ? `${oc!.countyName} County` : "n/a"], ["Destination county", dc!.countyName ? `${dc!.countyName} County` : "n/a"], ["ZIP codes", `${originShort} ${n(oc!.zips.length)}; ${destShort} ${n(dc!.zips.length)}`], ["Distance", `${milesText(route.distanceMiles)} straight line`], ["Classification", `${typeWords[route.moveType].replace(/^an? /, "")}${band ? `, ${band}` : ""}`]]
    : [["Origin", `[${o.name}](${stateUrl(o)})`], ["Destination", `[${d.name}](${stateUrl(d)})`], ["Counties", `${o.name} ${n(o.countyCount)}; ${d.name} ${n(d.countyCount)}`], ["ZIP codes", `${o.name} ${n(o.zipCount)}; ${d.name} ${n(d.zipCount)}`], ["Largest cities", `${ctx.citiesByState.get(o.code)?.[0]?.name ?? "n/a"}; ${ctx.citiesByState.get(d.code)?.[0]?.name ?? "n/a"}`], ["Centroid distance", milesText(route.distanceMiles)], ["Classification", `interstate, ${band}`]];
  const sections: ContentSection[] = [
    { id: "facts", heading: pick(seed, 2, [`${originShort} to ${destShort}: the route in numbers`, `Route facts: ${originName} to ${destName}`, `What defines the ${originShort} to ${destShort} move`]), blocks: [{ type: "table", columns: ["Fact", "Value"], rows: factRows }, { type: "paragraph", text: `Straight-line miles understate driving distance; a route near a band edge may be priced in the next band by the mover. The reverse route, [${destShort} to ${originShort}](${routeUrl(reverseSlug)}), has its own coverage count and page.` }] },
    {
      id: "movers",
      heading: pick(seed, 3, [`Movers covering ${originShort} to ${destShort}`, `Who can receive a ${originShort} to ${destShort} request`, `Directional coverage: ${originShort} → ${destShort}`]),
      blocks: coverage.matched.length
        ? [{ type: "paragraph", text: `Movers choose directional coverage: a rule may name ${o.name} origins and ${d.name} destinations, or cover moves between states from anywhere. ${coverageSentence(coverage, "this direction", originShort)}.` }, moversBlock(coverage, (m) => (m.basedIn ? `Based in ${m.basedIn.city}, ${m.basedIn.state}` : `Covers ${o.name} to ${d.name}`), "Listed movers")]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network covers a 2-bedroom ${typeWords[route.moveType].replace(/^an? /, "")} from ${originName} to ${destName}. We publish the route's facts and say so, rather than list movers that don't take this direction; the survey checks your exact ZIP codes and sizes.` }],
    },
  ];
  const draft: Draft = {
    url: routeUrl(route.slug),
    slug: route.slug,
    family: "route",
    stateCode: o.code,
    cityId: oc?.id ?? null,
    zip: null,
    routeId: route.id,
    primaryKeyword: kw.keyword,
    intent: kw.intent,
    supportingKeywords: kw.supporting,
    parentUrl: "/routes/",
    title: `Moving from ${originShort} to ${destShort}: Costs, Movers & Planning Guide`,
    metaDescription: clampDescription(`${originName} to ${destName}: about ${milesText(route.distanceMiles)}, ${typeWords[route.moveType].replace(/^an? /, "")}${band ? ` in the ${band} band` : ""}; ${n(coverage.matched.length)} network movers cover this direction as of ${ctx.today}, with cost ranges where rate cards exist and the rules that apply.`),
    h1: `Moving from ${originName} to ${destName}`,
    content: { version: 1, intro: { answer, dataPoints }, sections, faq: [], related: [], quote: quoteFor(originZip, destZip, `${originShort} and ${destShort} ZIP codes`, seed), schemaType: "Article", credits: [CREDITS.geonames, CREDITS.cities], dataAsOf: ctx.today },
    sources: sourcesOf([...originReg, ...destReg, ...national]),
    mediaIds: pickMedia(ctx, ["route", route.slug, o.slug, d.slug]),
    evidenceCount: 0,
    blocked: [],
    keywordBasis: kw.basis,
    minEvidence: 6,
  };
  (draft as Draft & { _finish?: () => Promise<void> })._finish = async () => {
    const block = await costBlockFor(ctx.db, { originState: o.code, areaName: o.name, miles: route.distanceMiles, moveType: route.moveType, scope: `${typeWords[route.moveType]} from ${o.name} of about ${milesText(route.distanceMiles)} (${originShort} to ${destShort})` });
    draft.content.sections.push({ id: "costs", heading: pick(seed, 4, [`What ${originShort} to ${destShort} costs: rate-card ranges`, `Cost ranges for ${originShort} to ${destShort}`, `${originShort} to ${destShort} moving cost, from the data we have`]), blocks: [{ type: "paragraph", text: block.rows.length ? `The cost model prices this route's band with the active rate cards of movers covering ${o.name} (the origin state): the median shipment weight they state for each home size times each mover's rate for the band, shown as the 25th to 75th percentile. Planning figures, never a quote; movers set their own prices. [Method](/moving-cost-calculator/method/).` : `No range exists for this route yet. A range needs at least five different movers' active rate cards covering ${typeWords[route.moveType].replace(/^an? /, "")}s from ${o.name}; ${ctx.cardMovers.get(o.code) ? `${plural(ctx.cardMovers.get(o.code)!, "mover")} ${ctx.cardMovers.get(o.code) === 1 ? "has" : "have"} filed one` : "none has filed one"}.` }, { type: "cost", block }] });
    const ruleBlocks: ContentBlock[] = [];
    if (route.moveType === "interstate") ruleBlocks.push({ type: "paragraph", text: `Leaving ${o.name} for ${d.name} is an interstate move, so FMCSA's household-goods rules apply from the estimate to delivery${originReg.length || destReg.length ? ", and the states' own licensing applies to movers based there" : ""}:` }, factsBlock(national));
    else ruleBlocks.push({ type: "paragraph", text: `Both ends are in ${o.name}, so the state's rules apply rather than FMCSA's Part 375 (unless the route crosses another state).` }, factsBlock(national));
    if (originReg.length) ruleBlocks.push({ type: "paragraph", text: `Departure side (${o.name}):` }, factsBlock(originReg));
    if (destReg.length) ruleBlocks.push({ type: "paragraph", text: `Arrival side (${d.name}):` }, factsBlock(destReg));
    if (!originReg.length && !destReg.length) ruleBlocks.push({ type: "note", text: `We have not yet verified the state regulators for ${o.name}${o.code !== d.code ? ` or ${d.name}` : ""}, so this page makes no claim about state licensing. Check any mover's USDOT record on [${FMCSA_LINKS.protectYourMove.label}](${FMCSA_LINKS.protectYourMove.url}).` });
    draft.content.sections.push({ id: "rules", heading: pick(seed, 5, [`Rules on a ${originShort} to ${destShort} move`, `Departure and arrival: what applies`, `Your rights moving from ${o.name} to ${d.name}`]), blocks: ruleBlocks });
    draft.content.faq = [
      { question: `How far is ${originShort} from ${destShort}?`, answer: `About ${milesText(route.distanceMiles)} in a straight line between centroids. Driving distance is longer; the straight-line figure is what the cost model uses to pick the ${band ?? "local"} band.` },
      { question: `Is ${originShort} to ${destShort} an interstate move?`, answer: route.moveType === "interstate" ? `Yes: ${o.name} to ${d.name} crosses a state line, so FMCSA's rules apply and the mover must hold interstate household-goods authority.` : `No: both ends are in ${o.name}. At ${milesText(route.distanceMiles)} it is ${typeWords[route.moveType]} under ${o.name} rules.` },
      { question: `How many movers cover ${originShort} to ${destShort}?`, answer: `${plural(coverage.matched.length, "mover")} in our network as of ${ctx.today}${coverage.explicit.length ? `, ${coverage.explicit.length} of which name ${o.name} explicitly in their coverage` : ""}. The survey checks your exact ZIP codes, size and services.` },
      { question: `What does a ${originShort} to ${destShort} move cost?`, answer: block.rows.length ? `From rate cards covering ${o.name}, as of ${block.asOf}: ${block.rows.map((r) => `${r.homeSize} ${r.low} to ${r.high}`).join("; ")}. Planning ranges, not quotes.` : `No range yet: fewer than five movers' active rate cards cover ${typeWords[route.moveType].replace(/^an? /, "")}s from ${o.name}. Get written estimates after a survey.` },
    ];
    const otherFromOrigin = isCity ? nearestCities(ctx, oc!, 3, false).map(({ city: c }) => ({ href: routeUrl(`${oc!.slug}-${o.code.toLowerCase()}-to-${c.slug}-${c.stateCode.toLowerCase()}`), label: `${originShort} to ${c.name}, ${c.stateCode}`, relation: "route" })) : nearestStates(ctx, o, 3).map(({ state: s }) => ({ href: routeUrl(`${o.slug}-to-${s.slug}`), label: `${o.name} to ${s.name}`, relation: "route" }));
    draft.content.related = [
      { heading: "Reverse and related routes", links: [{ href: routeUrl(reverseSlug), label: `Moving from ${destName} to ${originName}`, relation: "reverse_route" }, ...otherFromOrigin] },
      { heading: "Origin and destination", links: isCity ? [{ href: cityUrl(o, oc!), label: `Movers in ${originName}`, relation: "origin" }, { href: cityUrl(d, dc!), label: `Movers in ${destName}`, relation: "destination" }, { href: stateUrl(o), label: `Moving companies in ${o.name}`, relation: "origin_state" }, { href: stateUrl(d), label: `Moving companies in ${d.name}`, relation: "destination_state" }] : [{ href: stateUrl(o), label: `Moving companies in ${o.name}`, relation: "origin_state" }, { href: stateUrl(d), label: `Moving companies in ${d.name}`, relation: "destination_state" }, { href: costStateUrl(o), label: `Moving costs in ${o.name}`, relation: "cost" }] },
      { heading: "Services and questions", links: [{ href: route.moveType === "interstate" ? "/services/interstate/" : "/services/long-distance/", label: route.moveType === "interstate" ? "Interstate movers" : "Long-distance movers", relation: "service" }, { href: "/moving-costs/long-distance/", label: "Long-distance moving costs", relation: "cost" }, { href: "/questions/what-is-a-moving-delivery-spread/", label: "What is a delivery spread?", relation: "question" }, { href: "/questions/what-is-the-110-percent-rule/", label: "What is the 110% rule?", relation: "question" }, { href: "/planning/moving-out-of-state-checklist/", label: "Moving out of state checklist", relation: "planning" }] },
    ];
    draft.evidenceCount = dataPoints.length + factRows.length + national.length + originReg.length + destReg.length + (block.rows.length ? 1 : 0);
  };
  return draft;
}

// ---------------------------------------------------------------- service / question / planning (catalog)

function catalogDraft(ctx: Context, entry: CatalogEntry): Draft {
  const url = `/${entry.family === "service" ? "services" : entry.family === "question" ? "questions" : "planning"}/${entry.slug}/`;
  const seed = seedOf(url);
  const facts = factsFor(ctx, "national", entry.factTopics);
  const research = researchForUrl(ctx.research, url).concat(ctx.research.filter((r) => normalizeKeyword(r.keyword) === normalizeKeyword(entry.primaryKeyword)).map((r) => ({ keyword: r.keyword, intent: r.intent, volume: r.volume, difficulty: r.difficulty, source: r.source, researchedOn: r.researched_on, hypothesis: r.volume === null })));
  const measured = research.find((r) => !r.hypothesis);
  const dataPoints: DataPoint[] = [];
  const sections: ContentSection[] = entry.sections.map((s, i) => ({ id: `s${i + 1}`, heading: s.heading, blocks: [...s.blocks] }));
  if (entry.network) {
    const movers = ctx.network.filter((m) => (entry.network!.moveType ? m.profile.capabilities.moveTypes.includes(entry.network!.moveType) : true) && (entry.network!.service ? m.profile.capabilities.services.includes(entry.network!.service) : true));
    const byState = new Map<string, number>();
    for (const m of movers) for (const e of m.explicit) for (const s of e.states) byState.set(s, (byState.get(s) ?? 0) + 1);
    for (const m of movers) for (const e of m.explicit) for (const c of e.counties) {
      const st = ctx.states.find((s) => c.startsWith(s.fips));
      if (st) byState.set(st.code, (byState.get(st.code) ?? 0) + 1);
    }
    const what = entry.network.service ? `offer ${entry.network.service.replace("_", " ")}` : `take ${typeWords[entry.network.moveType!].replace(/^an? /, "")}s`;
    dataPoints.push({ label: `Network movers that ${what}`, value: n(movers.length), basis: `American Moving Choice capabilities, ${ctx.today}` });
    const stateRows = [...byState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, count]) => [`[${ctx.stateByCode.get(code)!.name}](${stateUrl(ctx.stateByCode.get(code)!)})`, n(count)]);
    sections.push({
      id: "network",
      heading: pick(seed, 2, ["Where the network covers this today", "Coverage in our network, by state", "Network coverage as of today"]),
      blocks: movers.length
        ? [{ type: "paragraph", text: `As of ${ctx.today}, ${plural(movers.length, "mover")} in our network ${what} (${joinAnd(movers.slice(0, 4).map((m) => `[${m.name}](/companies/${m.slug}/)`))}${movers.length > 4 ? ` and ${movers.length - 4} more` : ""}). The table counts the coverage rules that name each state on the origin side; a request from your ZIP code gets the exact answer.` }, ...(stateRows.length ? [{ type: "table" as const, columns: ["State", "Rules naming it"], rows: stateRows }] : [])]
        : [{ type: "paragraph", text: `As of ${ctx.today}, no mover in our network ${what}. We say so rather than imply coverage; the survey tells you before any contact details whether that has changed.` }],
    });
  }
  if (facts.length) sections.push({ id: "facts", heading: pick(seed, 3, ["The rules behind this answer", "What the regulations say", "Sources: the rules, read on the dates shown"]), blocks: [factsBlock(facts)] });
  const draft: Draft = {
    url,
    slug: entry.slug,
    family: entry.family,
    stateCode: null,
    cityId: null,
    zip: null,
    routeId: null,
    primaryKeyword: entry.primaryKeyword,
    intent: entry.intent,
    supportingKeywords: [...new Set([...entry.supportingKeywords, ...research.filter((r) => r.keyword !== entry.primaryKeyword).map((r) => r.keyword)])].slice(0, 8),
    parentUrl: `/${url.split("/")[1]}/`,
    title: entry.title,
    metaDescription: clampDescription(entry.metaDescription),
    h1: entry.h1,
    content: {
      version: 1,
      intro: { answer: entry.answer, dataPoints },
      sections,
      faq: entry.faq,
      related: [],
      quote: { entry: "household", heading: pick(seed, 11, ["See which movers cover your move", "Check coverage for your move"]), text: "The quote survey shows the movers that cover your route, by name and USDOT number, before asking for any contact details. You choose how many may contact you.", cta: pick(seed, 12, ["Start a quote request", "See available movers"]) },
      schemaType: "Article",
      credits: [],
      dataAsOf: ctx.today,
    },
    sources: sourcesOf(facts),
    mediaIds: pickMedia(ctx, [entry.family, entry.slug]),
    evidenceCount: facts.length + dataPoints.length + entry.sections.reduce((sum, s) => sum + s.blocks.filter((b) => b.type === "table" || b.type === "list").length, 0),
    blocked: [],
    keywordBasis: measured ? `${measured.source} (${measured.researchedOn ?? "undated"}), ${n(measured.volume ?? 0)}/mo` : "hypothesis: no measured volume for this keyword",
    minEvidence: 3,
  };
  const links = entry.related.map((ref) => {
    const [kind, slug] = ref.split(":") as [string, string];
    if (kind === "movers") return { href: "/movers/", label: "Movers by state", relation: "hub" };
    if (kind === "cost") return { href: `/moving-costs/${slug}/`, label: slug === "local" ? "Local moving costs" : "Long-distance moving costs", relation: "cost" };
    const target = CATALOG.find((e) => e.family === kind && e.slug === slug);
    if (!target) return null;
    return { href: `/${kind === "service" ? "services" : kind === "question" ? "questions" : "planning"}/${slug}/`, label: target.h1, relation: kind };
  }).filter((l): l is { href: string; label: string; relation: string } => l !== null);
  draft.content.related = [{ heading: "Related", links }];
  return draft;
}

// ---------------------------------------------------------------- cost

async function costDrafts(ctx: Context, limit: number): Promise<Draft[]> {
  const drafts: Draft[] = [];
  const withData = ctx.states.filter((s) => (ctx.cardMovers.get(s.code) ?? 0) >= 5);
  const without = ctx.states.filter((s) => (ctx.cardMovers.get(s.code) ?? 0) < 5);
  // National spokes
  for (const kind of ["local", "long-distance"] as const) {
    const moveType: MoveType = kind === "local" ? "local" : "interstate";
    const rows: [string, string, string, string][] = [];
    const blocks: ContentBlock[] = [];
    let asOf: string | null = null;
    for (const s of withData) {
      const block = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: kind === "local" ? 10 : 750, moveType, scope: `${typeWords[moveType]} starting in ${s.name}${kind === "local" ? " (within 50 miles)" : " of about 750 miles"}`, sizes: ["2br"] });
      const row = block.rows[0];
      if (row) {
        rows.push([`[${s.name}](${costStateUrl(s)})`, `${row.low} to ${row.high}`, n(row.movers), block.asOf]);
        if (!asOf || block.asOf < asOf) asOf = block.asOf;
      }
    }
    const url = `/moving-costs/${kind}/`;
    const seed = seedOf(url);
    const facts = factsFor(ctx, "national", kind === "local" ? ["interstate_scope", "accessorials", "labor_wages"] : ["written_estimate", "rule_110", "weighing", "volume_pricing"]);
    const kw = keywordFor(researchForUrl(ctx.research, url), kind === "local" ? "local moving costs" : "long distance moving costs", "informational");
    const answer = kind === "local"
      ? `Local movers price by the hour per crew plus a travel fee, so a local move's cost follows home size (crew and hours), access and extras. ${rows.length ? `As of ${asOf}, our rate cards support a 2-bedroom local range in ${plural(rows.length, "state")}: ${rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ")}.` : `As of ${ctx.today}, no state has the five movers' rate cards a local range needs, so this page explains the method and shows no figure.`} Planning ranges only, never a quote.`
      : `Long-distance moves are priced by shipment weight and distance band rather than by the hour. ${rows.length ? `As of ${asOf}, our rate cards support a 2-bedroom range for a 750-mile interstate move from ${plural(rows.length, "state")}: ${rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ")}.` : `As of ${ctx.today}, no state has the five movers' rate cards a long-distance range needs, so this page explains the method and shows no figure.`} Planning ranges only, never a quote.`;
    blocks.push({ type: "paragraph", text: `cost-model-v1 builds a typical job from the medians of what an area's movers state for a home size, prices each mover on that job with its own rates, and shows the 25th to 75th percentile rounded outward${kind === "local" ? " to $50" : " to $100"}. It needs at least five different movers' active cards for the origin state, and cards older than 12 months don't count. [Method](/moving-cost-calculator/method/).` });
    if (rows.length) blocks.push({ type: "table", caption: `2-bedroom ${kind === "local" ? "local move (within 50 miles)" : "interstate move of about 750 miles (500 to 1,000 band)"}, by origin state`, columns: ["Origin state", "Range", "Movers", "Cards as of"], rows });
    blocks.push({ type: "paragraph", text: `States without a range (${n(without.length)}): ${without.length ? `fewer than five movers' active rate cards cover ${kind === "local" ? "local" : "interstate"} moves there. ${without.slice(0, 8).map((s) => s.name).join(", ")}${without.length > 8 ? ` and ${without.length - 8} more` : ""}.` : "none."} A range appears for a state once enough cards exist; we never estimate one.` });
    drafts.push({
      url,
      slug: kind,
      family: "cost",
      stateCode: null,
      cityId: null,
      zip: null,
      routeId: null,
      primaryKeyword: kw.keyword,
      intent: kw.intent,
      supportingKeywords: kw.supporting,
      parentUrl: "/moving-costs/",
      title: kind === "local" ? "Local Moving Costs: Hourly Pricing and Rate-Card Ranges by State" : "Long-Distance Moving Costs: Weight-Based Pricing and Ranges by State",
      metaDescription: clampDescription(kind === "local" ? `How local movers price by the hour and the 2-bedroom local ranges our network's rate cards support as of ${asOf ?? ctx.today}: ${rows.length ? rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ") : "no state has enough cards yet"}. Planning ranges, not quotes.` : `How long-distance moves are priced by weight and band, and the 2-bedroom 750-mile ranges our rate cards support as of ${asOf ?? ctx.today}: ${rows.length ? rows.map((r) => `${r[0].replace(/\[([^\]]+)\]\([^)]+\)/, "$1")} ${r[1]}`).join("; ") : "no state has enough cards yet"}. Not quotes.`),
      h1: kind === "local" ? "Local moving costs" : "Long-distance moving costs",
      content: {
        version: 1,
        intro: { answer, dataPoints: [{ label: "States with a range", value: n(rows.length), basis: `Active rate cards, ${ctx.today}` }, { label: "States without one", value: n(without.length), basis: `Active rate cards, ${ctx.today}` }, { label: "Model", value: "cost-model-v1 (25th to 75th percentile, ≥5 movers)", basis: "/moving-cost-calculator/method/" }] },
        sections: [{ id: "ranges", heading: pick(seed, 2, ["Ranges by origin state", "Where the data supports a range"]), blocks }, { id: "factors", heading: kind === "local" ? "What moves a local price" : "What moves a long-distance price", blocks: [kind === "local" ? { type: "list", items: ["Home size sets the typical crew and hours.", "Access: stairs, elevators, long carries and parking add time.", "Extras: packing, storage and specialty items, priced separately by the movers that offer them.", "Travel fee: a flat charge for the drive."] } : { type: "list", items: ["Shipment weight: the median weight movers state for your home size, then the certified weighing on a non-binding estimate.", "Distance band: five bands from up to 250 miles to more than 1,500.", "Extras from the tariff: packing, storage-in-transit, shuttles, stairs.", "Valuation: full value protection is priced in the tariff; released value is free."] }, factsBlock(facts)] }],
        faq: [{ question: "Why is there no range for my state?", answer: "A range needs at least five different movers' active rate cards covering the move type in the origin state, each less than 12 months old. Fewer than that, and a range could mislead, so we show none." }, { question: "Is a range a quote?", answer: "No. Movers set their own prices and American Moving Choice gives no estimates. A written estimate after a survey is the only figure that binds a mover." }, { question: kind === "local" ? "Does the range include packing?" : "Does the range include storage?", answer: "No. Ranges here are for the move alone; the calculator adds a service only for movers that price it." }],
        related: [{ heading: "Cost pages", links: [...withData.map((s) => ({ href: costStateUrl(s), label: `Moving costs in ${s.name}`, relation: "cost" })), { href: "/moving-costs/", label: "How much do movers cost?", relation: "hub" }, { href: "/moving-cost-calculator/", label: "Moving cost calculator", relation: "tool" }, { href: kind === "local" ? "/moving-costs/long-distance/" : "/moving-costs/local/", label: kind === "local" ? "Long-distance moving costs" : "Local moving costs", relation: "sibling" }] }, { heading: "Services and questions", links: [{ href: kind === "local" ? "/services/local/" : "/services/long-distance/", label: kind === "local" ? "Local movers" : "Long-distance movers", relation: "service" }, { href: "/questions/how-do-moving-companies-charge/", label: "How do moving companies charge?", relation: "question" }, { href: kind === "local" ? "/questions/how-much-do-local-movers-cost/" : "/questions/can-a-mover-charge-more-than-the-estimate/", label: kind === "local" ? "How much do local movers cost?" : "Can movers charge more than the estimate?", relation: "question" }] }],
        quote: { entry: "household", heading: "See which movers cover your move", text: "The survey shows the movers that cover your route before asking for contact details; the calculator shows a range for your exact ZIP codes.", cta: "Start a quote request" },
        schemaType: "Article",
        credits: [],
        dataAsOf: ctx.today,
      },
      sources: sourcesOf(facts),
      mediaIds: [],
      evidenceCount: rows.length + facts.length + 3,
      blocked: [],
      keywordBasis: kw.basis,
      minEvidence: 3,
    });
  }
  // State cost pages, only where ≥5 movers' cards exist
  for (const s of withData.slice(0, Math.max(0, limit - 2))) {
    const cities = ctx.citiesByState.get(s.code) ?? [];
    const largest = cities[0];
    const second = cities[1];
    const intraMiles = largest && second ? distanceMiles(largest, second) : 150;
    const nearest = nearestStates(ctx, s, 1)[0];
    const sizes = ["studio", "1br", "2br", "3br", "4br_plus"] as const;
    const local = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: 10, moveType: "local", scope: `a local move within ${s.name} (within 50 miles)`, sizes: [...sizes] });
    const intra = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: Math.max(51, intraMiles), moveType: "intrastate", scope: `an in-state long-distance move in ${s.name} of about ${milesText(Math.max(51, intraMiles))}${largest && second ? ` (${largest.name} to ${second.name})` : ""}`, sizes: [...sizes] });
    const inter = await costBlockFor(ctx.db, { originState: s.code, areaName: s.name, miles: nearest ? Math.max(100, nearest.miles) : 500, moveType: "interstate", scope: `an interstate move from ${s.name} of about ${milesText(nearest ? Math.max(100, nearest.miles) : 500)}${nearest ? ` (to ${nearest.state.name})` : ""}`, sizes: [...sizes] });
    const blocksWithRows = [local, intra, inter].filter((b) => b.rows.length);
    const url = costStateUrl(s);
    const seed = seedOf(url);
    const facts = factsFor(ctx, `state:${s.code}`, ["regulator"]).concat(factsFor(ctx, "national", ["accessorials", "rule_110"]));
    const kw = keywordFor(ctx.research.filter((r) => r.target_url === url).map((r) => ({ keyword: r.keyword, intent: r.intent, volume: r.volume, difficulty: r.difficulty, source: r.source, researchedOn: r.researched_on, hypothesis: r.volume === null })), `moving costs ${s.name.toLowerCase()}`, "informational");
    const two = local.rows.find((r) => r.homeSize === "2 bedrooms");
    const cardCount = ctx.cardMovers.get(s.code) ?? 0;
    const answer = `${blocksWithRows.length ? `As of ${blocksWithRows[0]!.asOf}, ${plural(cardCount, "mover")} in our network have active rate cards covering ${s.name}, enough for ranges on ${joinAnd(blocksWithRows.map((b) => b.moveType === "local" ? "local moves" : b.moveType === "intrastate" ? "in-state long-distance moves" : "interstate moves"))}.` : `${plural(cardCount, "mover")} have cards covering ${s.name}, but no move type yet reaches five movers for a range.`} ${two ? `A 2-bedroom local move within ${s.name} ranges from ${two.low} to ${two.high} across ${two.movers} movers' cards.` : ""} Ranges are planning figures from rate cards, never quotes; movers set their own prices.`;
    drafts.push({
      url,
      slug: s.slug,
      family: "cost",
      stateCode: s.code,
      cityId: null,
      zip: null,
      routeId: null,
      primaryKeyword: kw.keyword,
      intent: kw.intent,
      supportingKeywords: kw.supporting,
      parentUrl: "/moving-costs/",
      title: `Moving Costs in ${s.name}: Rate-Card Ranges by Home Size and Move Type`,
      metaDescription: clampDescription(`${s.name} moving cost ranges from ${plural(cardCount, "mover")}' active rate cards as of ${blocksWithRows[0]?.asOf ?? ctx.today}: ${two ? `2-bedroom local ${two.low} to ${two.high}; ` : ""}local, in-state long-distance and interstate by home size. Planning ranges, not quotes.`),
      h1: `Moving costs in ${s.name}`,
      content: {
        version: 1,
        intro: { answer, dataPoints: [{ label: "Movers with active rate cards covering the state", value: n(cardCount), basis: `rate_cards, ${ctx.today}` }, { label: "Move types with a range", value: n(blocksWithRows.length), basis: "cost-model-v1" }, ...(two ? [{ label: "2-bedroom local range", value: `${two.low} to ${two.high}`, basis: `${two.movers} movers' cards, as of ${local.asOf}` }] : [])] },
        sections: [
          { id: "ranges", heading: pick(seed, 2, [`${s.name} ranges by move type and home size`, `What the ${s.name} rate cards support`]), blocks: [{ type: "paragraph", text: `Each block below is the 25th to 75th percentile of what the movers with cards covering ${s.name} would charge for a typical job of that size, from cost-model-v1. A size with fewer than five movers pricing it shows no row. [Method](/moving-cost-calculator/method/).` }, { type: "cost", block: local }, { type: "cost", block: intra }, { type: "cost", block: inter }] },
          { id: "rules", heading: `Rules that shape ${s.name} moving bills`, blocks: [factsBlock(facts)] },
        ],
        faq: [{ question: `Why do ${s.name} ranges differ by move type?`, answer: "Local moves are priced by the hour per crew plus a travel fee; in-state long-distance and interstate moves by shipment weight and distance band. The model prices each the way the rate cards do." }, { question: `Can I get a ${s.name} range for my exact ZIP codes?`, answer: "Yes: the moving cost calculator takes both ZIP codes, your home size and services and shows the range before any contact field. It uses the same model version as this page." }, { question: "Are these quotes?", answer: "No. Movers set their own prices and American Moving Choice gives no estimates. A written estimate after a survey is the figure that binds a mover." }],
        related: [{ heading: `${s.name}`, links: [{ href: stateUrl(s), label: `Moving companies in ${s.name}`, relation: "state" }, ...cities.slice(0, 4).map((c) => ({ href: cityUrl(s, c), label: `Movers in ${c.name}, ${s.code}`, relation: "city" }))] }, { heading: "Costs", links: [{ href: "/moving-costs/local/", label: "Local moving costs", relation: "sibling" }, { href: "/moving-costs/long-distance/", label: "Long-distance moving costs", relation: "sibling" }, { href: "/moving-cost-calculator/", label: "Moving cost calculator", relation: "tool" }, { href: "/questions/how-do-moving-companies-charge/", label: "How do moving companies charge?", relation: "question" }] }],
        quote: { entry: "household", originZip: largest?.zips[0], heading: "See which movers cover your move", text: `Start the survey with ${largest?.name ?? s.name}'s ZIP code filled in; we show the movers that cover your move before asking for contact details.`, cta: "Start a quote request" },
        schemaType: "Article",
        credits: [],
        dataAsOf: ctx.today,
      },
      sources: sourcesOf(facts),
      mediaIds: [],
      evidenceCount: blocksWithRows.reduce((sum, b) => sum + b.rows.length, 0) + facts.length + 2,
      blocked: blocksWithRows.length ? [] : ["blocked: insufficient evidence (no move type has five movers' cards)"],
      keywordBasis: kw.basis,
      minEvidence: 4,
    });
  }
  return drafts;
}

// ------------------------------------------------------------------ candidates

async function candidates(ctx: Context, family: SeoFamily, limit: number, only?: string[]): Promise<Draft[]> {
  const take = <T>(list: T[]) => list.slice(0, limit);
  switch (family) {
    case "state": {
      const demand = stateDemand(ctx.research);
      const ordered = [...ctx.states].sort((a, b) => (demand.get(b.code) ?? 0) - (demand.get(a.code) ?? 0) || a.name.localeCompare(b.name));
      return take(ordered.filter((s) => !only || only.includes(s.slug))).map((s) => stateDraft(ctx, s));
    }
    case "city": {
      const list = ctx.cities.filter((c) => !RESERVED_CITY_SLUGS.has(c.slug) && (!only || only.includes(`${ctx.stateByCode.get(c.stateCode)!.slug}/${c.slug}`)));
      return take(list).map((c) => cityDraft(ctx, c));
    }
    case "zip": {
      // Only ZIPs of cities whose page is published, where at least 3 movers name the ZIP or county.
      const published = await ctx.db.query<{ city_id: number }>("select city_id from seo_pages where family = 'city' and status = 'published' and city_id is not null");
      const ids = new Set(published.rows.map((r) => r.city_id));
      const out: Draft[] = [];
      for (const city of ctx.cities) {
        if (!ids.has(city.id)) continue;
        for (const zip of city.zips) {
          if (!lookupZip(zip)) continue;
          if (only && !only.includes(zip)) continue;
          const draft = zipDraft(ctx, zip, city);
          out.push(draft);
          if (out.length >= limit) return out;
        }
      }
      return out;
    }
    case "route": {
      const rows = (await ctx.db.query<{ id: number; kind: "city" | "state"; slug: string; origin_state: string; destination_state: string; origin_city_id: number | null; destination_city_id: number | null; distance_miles: number; move_type: MoveType; distance_band: string | null; reason: string }>("select * from seo_routes")).rows.map((r) => ({ id: r.id, kind: r.kind, slug: r.slug, originState: r.origin_state, destinationState: r.destination_state, originCityId: r.origin_city_id, destinationCityId: r.destination_city_id, distanceMiles: r.distance_miles, moveType: r.move_type, distanceBand: r.distance_band, reason: r.reason } satisfies RouteRec));
      const demand = stateDemand(ctx.research);
      const score = (r: RouteRec): number => {
        const research = r.kind === "state" ? researchForStateRoute(ctx.research, r.originState, r.destinationState, r.slug) : researchForCityRoute(ctx.research, ctx.cityById.get(r.originCityId!)?.slug ?? "", ctx.cityById.get(r.destinationCityId!)?.slug ?? "");
        const measured = research.reduce((sum, k) => sum + (k.volume ?? 0), 0);
        const pop = r.kind === "city" ? (ctx.cityById.get(r.originCityId!)?.population ?? 0) + (ctx.cityById.get(r.destinationCityId!)?.population ?? 0) : (demand.get(r.originState) ?? 0) + (demand.get(r.destinationState) ?? 0);
        return measured * 1000 + (r.kind === "state" ? pop * 10 : pop / 1000);
      };
      const ordered = rows.filter((r) => !only || only.includes(r.slug)).sort((a, b) => score(b) - score(a));
      return take(ordered).map((r) => routeDraft(ctx, r));
    }
    case "service":
    case "question":
    case "planning":
      return take(CATALOG.filter((e) => e.family === family && (!only || only.includes(e.slug)))).map((e) => catalogDraft(ctx, e));
    case "cost":
      return costDrafts(ctx, limit);
    case "mover-profile":
      return []; // Profiles are owned by the directory slice (/companies/{slug}/); nothing is generated here.
  }
}

// ------------------------------------------------------------------ gates and storage

export interface GenerateOptions {
  limit?: number;
  only?: string[];
  media?: MediaAsset[];
  log?: (line: string) => void;
}

export interface GenerateSummary {
  family: SeoFamily;
  planned: number;
  written: number;
  ready: number;
  draft: number;
  blocked: Record<string, number>;
}

export async function generateFamily(db: Queryable, family: SeoFamily, options: GenerateOptions = {}): Promise<GenerateSummary> {
  const ctx = await loadContext(db, options);
  const limit = options.limit ?? 50;
  const drafts = await candidates(ctx, family, limit, options.only);
  for (const draft of drafts) {
    const finish = (draft as Draft & { _finish?: () => Promise<void> })._finish;
    if (finish) await finish();
  }
  // Uniqueness against the batch and the family's existing pages that aren't in the batch.
  const batchUrls = new Set(drafts.map((d) => d.url));
  const existing = await db.query<{ url: string; content: SeoContent; content_hash: string; primary_keyword_normalized: string; intent: string }>("select url, content, content_hash, primary_keyword_normalized, intent from seo_pages");
  const corpus = existing.rows.filter((r) => !batchUrls.has(r.url) && r.url.startsWith(drafts[0]?.url.split("/").slice(0, 2).join("/") ?? "/") ).map((r) => shingles(mainText(r.content)));
  const batchShingles = new Map(drafts.map((d) => [d.url, shingles(mainText(d.content))]));
  const shares = uniqueShares(batchShingles, corpus);
  const hashOwner = new Map(existing.rows.filter((r) => !batchUrls.has(r.url)).map((r) => [r.content_hash, r.url]));
  const keywordOwner = new Map(existing.rows.filter((r) => !batchUrls.has(r.url)).map((r) => [`${r.primary_keyword_normalized}|${r.intent}`, r.url]));
  const summary: GenerateSummary = { family, planned: drafts.length, written: 0, ready: 0, draft: 0, blocked: {} };

  for (const draft of drafts) {
    const text = mainText(draft.content);
    const hash = sha256(text);
    const share = shares.get(draft.url) ?? 0;
    const blocked = [...draft.blocked];
    const gates: Record<string, { passed: boolean; detail: string }> = {};
    gates.evidence = { passed: draft.evidenceCount >= draft.minEvidence, detail: `${draft.evidenceCount} data-backed facts; ${draft.minEvidence} needed` };
    if (!gates.evidence.passed) blocked.push(`blocked: insufficient evidence (${draft.evidenceCount} facts, ${draft.minEvidence} needed)`);
    gates.unique = { passed: share >= 0.4, detail: `${Math.round(share * 100)}% of 5-word shingles unique within the family; 40% needed` };
    if (!gates.unique.passed) blocked.push(`blocked: below 40% unique content (${Math.round(share * 100)}%)`);
    const hashDup = hashOwner.get(hash);
    gates.duplicate_content = { passed: !hashDup, detail: hashDup ? `same content hash as ${hashDup}` : "content hash is unique" };
    if (hashDup) blocked.push(`blocked: duplicate content (same as ${hashDup})`);
    const kwKey = `${normalizeKeyword(draft.primaryKeyword)}|${draft.intent}`;
    const kwDup = keywordOwner.get(kwKey);
    gates.duplicate_intent = { passed: !kwDup, detail: kwDup ? `keyword and intent already target ${kwDup}` : "keyword and intent are unique" };
    if (kwDup) blocked.push(`blocked: duplicate intent (keyword "${draft.primaryKeyword}" already targets ${kwDup})`);
    gates.keyword = { passed: true, detail: draft.keywordBasis };
    gates.words = { passed: text.split(/\s+/).length >= 300, detail: `${text.split(/\s+/).length} words of main content` };
    if (hashDup || kwDup) {
      summary.blocked[blocked[blocked.length - 1]!.split(" (")[0]!] = (summary.blocked[blocked[blocked.length - 1]!.split(" (")[0]!] ?? 0) + 1;
      ctx.log(`skip ${draft.url}: ${blocked.join("; ")}`);
      continue;
    }
    hashOwner.set(hash, draft.url);
    keywordOwner.set(kwKey, draft.url);
    const status = blocked.length ? "draft" : "ready";
    const reason = blocked[0] ?? null;
    await db.query(
      `insert into seo_pages (url, slug, family, state_code, city_id, zip, route_id, primary_keyword, primary_keyword_normalized, intent, supporting_keywords, parent_url,
         title, meta_description, h1, status, indexable, content, content_hash, unique_share, evidence_count, sources, media_ids, blocked_reason, gate_results, canonical_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, false, $17::jsonb, $18, $19, $20, $21::jsonb, $22::jsonb, $23, $24::jsonb, $1)
       on conflict (url) do update set slug = excluded.slug, state_code = excluded.state_code, city_id = excluded.city_id, zip = excluded.zip, route_id = excluded.route_id,
         primary_keyword = excluded.primary_keyword, primary_keyword_normalized = excluded.primary_keyword_normalized, intent = excluded.intent,
         supporting_keywords = excluded.supporting_keywords, parent_url = excluded.parent_url, title = excluded.title, meta_description = excluded.meta_description,
         h1 = excluded.h1, content = excluded.content, content_hash = excluded.content_hash, unique_share = excluded.unique_share, evidence_count = excluded.evidence_count,
         sources = excluded.sources, media_ids = excluded.media_ids, blocked_reason = excluded.blocked_reason, gate_results = excluded.gate_results,
         -- A published page that regenerates clean stays published; a blocked one drops to draft and out of the index.
         status = case when excluded.blocked_reason is null and seo_pages.status = 'published' then 'published' else excluded.status end,
         indexable = case when excluded.blocked_reason is null and seo_pages.status = 'published' then seo_pages.indexable else false end`,
      [draft.url, draft.slug, draft.family, draft.stateCode, draft.cityId, draft.zip, draft.routeId, draft.primaryKeyword, normalizeKeyword(draft.primaryKeyword), draft.intent, JSON.stringify(draft.supportingKeywords), draft.parentUrl, draft.title, draft.metaDescription, draft.h1, status, JSON.stringify(draft.content), hash, share, draft.evidenceCount, JSON.stringify(draft.sources), JSON.stringify(draft.mediaIds), reason, JSON.stringify(gates)],
    );
    for (const id of draft.mediaIds) {
      await db.query("insert into seo_media_usage (media_id, page_id) select $1, id from seo_pages where url = $2 on conflict (media_id) do nothing", [id, draft.url]);
    }
    summary.written++;
    if (status === "ready") summary.ready++;
    else {
      summary.draft++;
      const key = reason!.split(" (")[0]!;
      summary.blocked[key] = (summary.blocked[key] ?? 0) + 1;
    }
  }
  ctx.log(`${family}: planned ${summary.planned}, written ${summary.written}, ready ${summary.ready}, draft ${summary.draft}${Object.keys(summary.blocked).length ? `, blocked: ${JSON.stringify(summary.blocked)}` : ""}`);
  return summary;
}

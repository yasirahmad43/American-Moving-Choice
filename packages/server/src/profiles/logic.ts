/**
 * Pure rules behind the directory and company profiles (mover verification §4–§6; review
 * methodology; site architecture §1.2 directory and profile rows). No database access here, so
 * tests import this file directly.
 */
import type { MoveSize, MoveType, Service } from "@amc/core";

export type ReviewType = "quote_experience" | "move_experience";
export type EvidenceLevel = "platform_inquiry" | "verified_customer" | "completed_move";

export const REVIEW_TYPES: readonly ReviewType[] = ["quote_experience", "move_experience"];

/** Plain names for the two rated experiences (review methodology, "Two experiences, rated separately"). */
export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  quote_experience: "Quote and sales experience",
  move_experience: "Moving experience",
};

/** The three evidence labels and what each proves (review methodology, "How are reviews checked?"). */
export const EVIDENCE_LABELS: Record<EvidenceLevel, { label: string; definition: string }> = {
  platform_inquiry: {
    label: "Verified platform inquiry",
    definition: "Our records show the reviewer sent the request and this mover bought it through American Moving Choice.",
  },
  verified_customer: {
    label: "Verified customer",
    definition: "As above, plus a checked document from this mover showing the reviewer did business with it.",
  },
  completed_move: {
    label: "Verified completed move",
    definition: "As above, plus checked evidence that the move was completed.",
  },
};

/**
 * Which labels can rate which experience: only a Verified completed move rates the moving
 * experience; every label can rate the quote and sales experience (review methodology,
 * "How are ratings calculated?"; owner confirmation pending for completed moves rating quotes).
 */
export function labelCanRate(level: EvidenceLevel, type: ReviewType): boolean {
  return type === "quote_experience" ? true : level === "completed_move";
}

/**
 * Eligible reviews before a profile gets its own /reviews/ page. tokens.json
 * `setting.reviews_subpage_min` (no platform setting yet; site architecture §1.2).
 */
export const REVIEWS_SUBPAGE_MIN = 10;

/** Reviews shown on the profile itself once the /reviews/ page exists. */
export const PROFILE_REVIEW_PREVIEW = 5;

/** Movers per directory page. */
export const DIRECTORY_PAGE_SIZE = 12;

export interface RatedReview {
  reviewType: ReviewType;
  rating: number;
  evidenceLevel: EvidenceLevel;
  publishedAt: Date;
}

export interface RatingSummary {
  reviewType: ReviewType;
  /** Plain mean of the eligible reviews' stars, or null with no eligible review (never 0.0). */
  mean: number | null;
  count: number;
  /** Count of eligible reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  distribution: [number, number, number, number, number];
  latestAt: Date | null;
  /** Eligible reviews published in the 12 months before `now`. */
  last12Months: number;
}

/** Published reviews only; the caller filters status. Stars count only where the label can rate. */
export function summarizeRatings(reviews: readonly RatedReview[], type: ReviewType, now: Date = new Date()): RatingSummary {
  const eligible = reviews.filter((r) => r.reviewType === type && labelCanRate(r.evidenceLevel, type) && r.rating >= 1 && r.rating <= 5);
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  let latest: Date | null = null;
  const yearAgo = new Date(now);
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  let last12Months = 0;
  for (const r of eligible) {
    distribution[r.rating - 1]! += 1;
    sum += r.rating;
    if (!latest || r.publishedAt > latest) latest = r.publishedAt;
    if (r.publishedAt > yearAgo && r.publishedAt <= now) last12Months += 1;
  }
  return {
    reviewType: type,
    mean: eligible.length ? sum / eligible.length : null,
    count: eligible.length,
    distribution,
    latestAt: latest,
    last12Months,
  };
}

/** "4.5": one decimal, as shown beside the count. */
export function formatMean(mean: number): string {
  return (Math.round(mean * 10) / 10).toFixed(1);
}

export type DirectorySort = "name" | "quote_rating" | "move_rating";

export const DIRECTORY_SORTS: readonly DirectorySort[] = ["name", "quote_rating", "move_rating"];

export function parseDirectorySort(value: unknown): DirectorySort {
  return typeof value === "string" && (DIRECTORY_SORTS as readonly string[]).includes(value) ? (value as DirectorySort) : "name";
}

export interface SortableListing {
  displayName: string;
  ratings: Record<ReviewType, Pick<RatingSummary, "mean" | "count">>;
}

const collator = new Intl.Collator("en-US", { sensitivity: "base", numeric: true });

/**
 * The published sort rule (site architecture §1.2 directory row, §2.4 rule 3): alphabetical by
 * display name by default. A rating sort puts movers with at least `rankMinReviews` eligible
 * reviews of that experience first, by mean (ties by name); everyone else follows alphabetically,
 * so a mover gets no priority below the minimum sample. No money input exists to sort by, and
 * review count is never a sort key.
 */
export function sortListings<T extends SortableListing>(listings: readonly T[], sort: DirectorySort, rankMinReviews: number): T[] {
  const byName = (a: T, b: T) => collator.compare(a.displayName, b.displayName);
  if (sort === "name") return [...listings].sort(byName);
  const type: ReviewType = sort === "quote_rating" ? "quote_experience" : "move_experience";
  const qualifies = (l: T) => l.ratings[type].count >= rankMinReviews && l.ratings[type].mean !== null;
  const ranked = listings.filter(qualifies).sort((a, b) => b.ratings[type].mean! - a.ratings[type].mean! || byName(a, b));
  const rest = listings.filter((l) => !qualifies(l)).sort(byName);
  return [...ranked, ...rest];
}

/** 1-based page clamp; null when the page is past the end (the route returns 404). */
export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): { items: T[]; totalPages: number } | null {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return null;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), totalPages };
}

/** "New to our network" for the first `days` days after approval (mover verification §5). */
export function isNewToNetwork(joinedAt: Date | null, days: number, now: Date = new Date()): boolean {
  if (!joinedAt) return false;
  return now.getTime() - joinedAt.getTime() < days * 86_400_000;
}

// ---------------------------------------------------------------- coverage in plain words

export interface CoverageLocationSet {
  states: string[];
  counties: string[];
  zips: string[];
}

export interface CoverageRuleInput {
  kind: "include" | "exclude";
  paused: boolean;
  moveTypes: MoveType[];
  origin: CoverageLocationSet;
  destination: CoverageLocationSet;
}

export interface CoverageNames {
  state: (code: string) => string;
  county: (fips: string) => string;
}

const MOVE_TYPE_WORDS: Record<MoveType, string> = {
  local: "local",
  intrastate: "in-state long-distance",
  interstate: "interstate",
};

const isEmpty = (s: CoverageLocationSet) => !s.states.length && !s.counties.length && !s.zips.length;

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function describeSet(set: CoverageLocationSet, names: CoverageNames): string {
  const parts: string[] = [];
  if (set.states.length) parts.push(joinWords(set.states.map(names.state)));
  if (set.counties.length) parts.push(joinWords(set.counties.map(names.county)));
  if (set.zips.length) parts.push(set.zips.length === 1 ? `ZIP code ${set.zips[0]}` : `${set.zips.length} ZIP codes`);
  return joinWords(parts);
}

/**
 * One plain sentence per active rule, from the coverage rules themselves (never the company's
 * own rule label), e.g. "Local and in-state long-distance moves within Texas" or
 * "Interstate moves from Texas to Florida". Paused rules are left out.
 */
export function describeCoverage(rules: readonly CoverageRuleInput[], capabilities: MoveType[], names: CoverageNames): { serves: string[]; excludes: string[] } {
  const serves: string[] = [];
  const excludes: string[] = [];
  for (const rule of rules) {
    if (rule.paused) continue;
    const types = (rule.moveTypes.length ? rule.moveTypes : capabilities).filter((t) => capabilities.includes(t));
    if (!types.length && rule.kind === "include") continue;
    const what = types.length ? `${joinWords(types.map((t) => MOVE_TYPE_WORDS[t]))} moves` : "moves";
    const from = isEmpty(rule.origin) ? null : describeSet(rule.origin, names);
    const to = isEmpty(rule.destination) ? null : describeSet(rule.destination, names);
    let where: string;
    if (!from && !to) where = "anywhere in the United States";
    else if (from && to && from === to) where = `within ${from}`;
    else if (from && to) where = `from ${from} to ${to}`;
    else if (from) where = `starting in ${from}`;
    else where = `ending in ${to}`;
    const sentence = `${what.charAt(0).toUpperCase()}${what.slice(1)} ${where}`;
    (rule.kind === "include" ? serves : excludes).push(sentence);
  }
  return { serves: [...new Set(serves)], excludes: [...new Set(excludes)] };
}

/** States named on the origin or destination side of active include rules, for areaServed. */
export function statesServed(rules: readonly CoverageRuleInput[]): string[] {
  const states = new Set<string>();
  for (const rule of rules) {
    if (rule.paused || rule.kind !== "include") continue;
    for (const s of [...rule.origin.states, ...rule.destination.states]) states.add(s);
  }
  return [...states].sort();
}

export const SERVICE_LABELS: Record<Service, string> = {
  full_service: "Full-service moving",
  packing: "Packing",
  storage: "Storage",
  auto_transport: "Vehicle transport",
  labor_only: "Loading and unloading help",
  specialty_items: "Specialty items",
};

export const MOVE_SIZE_LABELS: Record<MoveSize, string> = {
  studio: "Studio",
  "1br": "1 bedroom",
  "2br": "2 bedrooms",
  "3br": "3 bedrooms",
  "4br_plus": "4 or more bedrooms",
  office: "Offices",
  partial: "A few items",
};

export const MOVE_TYPE_LABELS: Record<MoveType, string> = {
  local: "Local moves",
  intrastate: "Long-distance moves within a state",
  interstate: "Moves between states",
};

/** Authority wording for the credential row: "Common carrier · household goods". */
export function authorityLabel(type: "common" | "contract" | "broker", scope: "household_goods" | "property"): string {
  const kind = type === "common" ? "Common carrier" : type === "contract" ? "Contract carrier" : "Broker";
  return `${kind} · ${scope === "household_goods" ? "household goods" : "general property"}`;
}

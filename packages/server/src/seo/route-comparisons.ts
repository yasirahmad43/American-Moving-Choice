/** Attributed place comparisons, never moving-price, access or delivery predictions. */
import { readFileSync } from "node:fs";
import type { ContentSection, DataPoint, SourceRef } from "./types";

export interface CensusEstimate { estimate: number | null; moe: number | null }
export interface RouteCensusPlace { [variable: string]: CensusEstimate }
export interface RoutePlaceContext { name: string; stateCode: string; placeGeoid: string | null }
type Kind = "money" | "rooms" | "year" | "share";
interface Metric { label: string; a: number; b: number; kind: Kind; aMoe?: number; bMoe?: number }
const VINTAGE = "2019–2023 ACS 5-year estimates";
const ACCESSED = "2026-10-29";
const TABLES: Record<string, string> = {
  B25064: "Median gross rent", B25077: "Median owner-occupied home value", B19013: "Median household income",
  B25018: "Median rooms", B25035: "Median year built", B25003: "Housing tenure", B25024: "Units in structure",
};
let places: Record<string, RouteCensusPlace> | undefined;
export function routeCensusPlace(geoid: string | null): RouteCensusPlace | null {
  places ??= (JSON.parse(readFileSync(new URL("../../data/seo-route-census/places-2023.json", import.meta.url), "utf8")) as { places: Record<string, RouteCensusPlace> }).places;
  return geoid ? places[geoid] ?? null : null;
}

/** Missing/suppressed/top-coded observations lack an ordinary MOE: do not compare them as exact values. */
export function comparableEstimate(place: RouteCensusPlace, variable: string): CensusEstimate | null {
  const value = place[variable];
  return value && value.estimate !== null && value.moe !== null && Number.isFinite(value.estimate) && Number.isFinite(value.moe) && value.estimate >= 0 && value.moe >= 0 ? value : null;
}
export function estimateShare(place: RouteCensusPlace, numerators: string[], denominator: string): number | null {
  const total = comparableEstimate(place, denominator)?.estimate;
  const parts = numerators.map((key) => comparableEstimate(place, key)?.estimate);
  if (!total || parts.some((value) => value === null || value === undefined)) return null;
  const numerator = parts.reduce<number>((sum, value) => sum + value!, 0);
  return numerator <= total ? numerator / total * 100 : null;
}
const number = (value: number, decimals = 0) => value.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
const format = (value: number, kind: Kind) => kind === "money" ? `$${number(value)}` : kind === "share" ? `${number(value, 1)}%` : number(value, kind === "rooms" ? 1 : 0);
export function comparisonDifference(a: number, b: number, kind: Kind): string {
  const delta = b - a;
  if (!delta) return "Same point estimate";
  if (kind === "year") return `${number(Math.abs(delta))} years ${delta > 0 ? "more recent" : "earlier"}`;
  if (kind === "share") return `${number(Math.abs(delta), 1)} percentage points ${delta > 0 ? "higher" : "lower"}`;
  return `${format(Math.abs(delta), kind)}${kind === "rooms" ? " rooms" : ""} ${delta > 0 ? "higher" : "lower"}${a > 0 ? ` (${number(Math.abs(delta / a * 100), 1)}%)` : ""}`;
}
const withMoe = (value: number, moe: number | undefined, kind: Kind) => `${format(value, kind)}${moe === undefined ? "" : ` ± ${format(moe, kind)}`}`;
const compactDifference = (metric: Metric) => {
  const delta = metric.b - metric.a, sign = delta < 0 ? "−" : delta > 0 ? "+" : "";
  if (metric.kind === "share") return `${sign}${number(Math.abs(delta), 1)} pp`;
  if (metric.kind === "year") return `${sign}${number(Math.abs(delta))} years`;
  return `${sign}${format(Math.abs(delta), metric.kind)}${metric.kind === "rooms" ? " rooms" : metric.a > 0 ? ` (${sign}${number(Math.abs(delta / metric.a * 100), 1)}%)` : ""}`;
};

export function routeComparisonSections(origin: RoutePlaceContext, destination: RoutePlaceContext): { sections: ContentSection[]; dataPoints: DataPoint[]; sources: SourceRef[]; evidence: number } {
  const a = routeCensusPlace(origin.placeGeoid), b = routeCensusPlace(destination.placeGeoid);
  if (!a || !b) return { sections: [], dataPoints: [], sources: [], evidence: 0 };
  const originLabel = `${origin.name}, ${origin.stateCode}`, destinationLabel = `${destination.name}, ${destination.stateCode}`;
  const scalar = (label: string, key: string, kind: Kind): Metric | null => {
    const av = comparableEstimate(a, key), bv = comparableEstimate(b, key);
    return av && bv ? { label, a: av.estimate!, b: bv.estimate!, aMoe: av.moe!, bMoe: bv.moe!, kind } : null;
  };
  const share = (label: string, keys: string[], denominator: string): Metric | null => {
    const av = estimateShare(a, keys, denominator), bv = estimateShare(b, keys, denominator);
    return av !== null && bv !== null ? { label, a: av, b: bv, kind: "share" } : null;
  };
  const budget = [scalar("Median monthly gross rent", "B25064_001", "money"), scalar("Median owner-occupied home value", "B25077_001", "money"), scalar("Median annual household income", "B19013_001", "money")].filter((metric): metric is Metric => Boolean(metric));
  const homes = [
    scalar("Median rooms per housing unit", "B25018_001", "rooms"), scalar("Median year structure built", "B25035_001", "year"),
    share("Owner-occupied (occupied homes)", ["B25003_002"], "B25003_001"),
    share("Detached single-unit", ["B25024_002"], "B25024_001"),
    share("Attached single-unit", ["B25024_003"], "B25024_001"),
    share("2–4-unit buildings", ["B25024_004", "B25024_005"], "B25024_001"),
    share("5–9-unit buildings", ["B25024_006"], "B25024_001"),
    share("10+-unit buildings", ["B25024_007", "B25024_008", "B25024_009"], "B25024_001"),
    share("Mobile homes", ["B25024_010"], "B25024_001"),
  ].filter((metric): metric is Metric => Boolean(metric));
  const rows = (metrics: Metric[]) => metrics.map((metric) => [metric.label, withMoe(metric.a, metric.aMoe, metric.kind), withMoe(metric.b, metric.bMoe, metric.kind), compactDifference(metric)]);
  const sections: ContentSection[] = [];
  if (budget.length) sections.push({
    id: "relocation-budget-context", heading: `${origin.name} to ${destination.name}: housing and income context`,
    blocks: [
      { type: "paragraph", text: `${originLabel} and ${destinationLabel}, compared in 2023 dollars. These ${VINTAGE} describe different households and homes, not current asking prices, your salary, or moving-company charges.` },
      { type: "table", caption: `${VINTAGE}; estimate ± published 90% margin of error; destination minus origin`, columns: ["Measure", originLabel, destinationLabel, "Difference in point estimates"], rows: rows(budget) },
      { type: "note", text: `Differences are arithmetic point-estimate comparisons, not statistical-significance tests. Gross rent includes applicable utilities/fuel. Rent, owner-occupied home value and household income have different statistical universes; they do not establish your affordability. Compare current listings separately.` },
    ],
  });
  if (homes.length) sections.push({
    id: "housing-and-access-context", heading: `The homes at each end: ${origin.name} and ${destination.name}`,
    blocks: [
      { type: "paragraph", text: `${originLabel} → ${destinationLabel}: housing-unit structure and tenure from the ${VINTAGE}. Shares are derived from count estimates; their uncertainty intervals have not been calculated. “Occupied homes” and “all homes” use different denominators.` },
      { type: "table", caption: `${VINTAGE}; medians ± published 90% MOE. Housing types are shares of all homes; tenure uses occupied homes. Differences are destination minus origin; pp = percentage points.`, columns: ["Housing measure", originLabel, destinationLabel, "Point-estimate difference"], rows: rows(homes) },
      { type: "paragraph", text: `For your ${origin.name} pickup and ${destination.name} delivery, confirm both addresses' floor, elevator, loading space and carrying distance. City-wide housing mix cannot predict your building's access or justify extra charges. Give the mover your actual inventory and access details.` },
    ],
  });
  return {
    sections,
    dataPoints: budget.filter((metric) => metric.label === "Median monthly gross rent").map((metric) => ({ label: "Historical rent comparison", value: `${origin.name} ${format(metric.a, metric.kind)}; ${destination.name} ${format(metric.b, metric.kind)}`, basis: `${VINTAGE}, B25064; place medians, not current listings or moving prices` })),
    sources: Object.entries(TABLES).map(([table, label]) => ({ label: `U.S. Census Bureau, ${VINTAGE}: ${label} (${table})`, url: `https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-${table.toLowerCase()}.dat`, accessedOn: ACCESSED })),
    evidence: budget.length + homes.length,
  };
}

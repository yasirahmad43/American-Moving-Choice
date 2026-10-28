/**
 * Text for a cost result, shared by every surface that shows one (the calculator widget, its
 * results view and, if adopted, the survey's What we found step), so the same answers read the
 * same everywhere. Strings follow content/pages/costs/moving-cost-calculator.md and ST-7's notes.
 * Token values (storage period, specialty items) come in from the caller, never typed here.
 */
import type { MoveType } from "../geo";
import type { MoveSize } from "../matching";
import { joinWithAnd } from "./answers";
import type { CostRange, CostResult, CostRoute, CostService, DistanceBand, HomeSize } from "./types";

/** form.size.* */
export const MOVE_SIZE_LABELS: Record<MoveSize, string> = {
  studio: "Studio",
  "1br": "1 bedroom",
  "2br": "2 bedrooms",
  "3br": "3 bedrooms",
  "4br_plus": "4+ bedrooms",
  office: "Office",
  partial: "A few items",
};

/** The home size inside ST-7's scope ("a 2-bedroom home, interstate, 500 to 1,000 miles"). */
const SCOPE_SIZE: Record<HomeSize, string> = {
  studio: "a studio",
  "1br": "a 1-bedroom home",
  "2br": "a 2-bedroom home",
  "3br": "a 3-bedroom home",
  "4br_plus": "a home with 4 or more bedrooms",
};

/** route.type.* */
export const MOVE_TYPE_LABELS: Record<MoveType, string> = {
  local: "Local",
  intrastate: "In-state long distance",
  interstate: "Interstate",
};

/** Distance bands as the method page's {{cost.method.distance_bands}} words them. */
export const DISTANCE_BAND_LABELS: Record<DistanceBand, string> = {
  "0_250": "0 to 250 miles",
  "250_500": "250 to 500 miles",
  "500_1000": "500 to 1,000 miles",
  "1000_1500": "1,000 to 1,500 miles",
  "1500_plus": "more than 1,500 miles",
};

/** form.services.* */
export const SERVICE_LABELS: Record<CostService, string> = {
  packing: "Packing",
  storage: "Storage",
  specialty_items: "Specialty items",
};

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Whole dollars from cents: 123400 → "$1,234". */
export function formatDollars(cents: number): string {
  return `$${wholeNumber.format(Math.round(cents / 100))}`;
}

const longDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

/** Absolute date, US Eastern: "October 28, 2026". */
export function formatLongDate(iso: string): string {
  return longDate.format(new Date(iso));
}

/** route.distance, route.distance.one, route.distance.short or route.distance.same. */
export function routeDistanceText(route: Pick<CostRoute, "miles" | "origin" | "destination">): string {
  if (route.origin.zip === route.destination.zip) return `Within ZIP code ${route.origin.zip}`;
  const miles = Math.round(route.miles);
  if (miles < 1) return "Less than 1 mile between ZIP code centers";
  if (miles === 1) return "1 mile in a straight line between ZIP code centers";
  return `${wholeNumber.format(miles)} miles in a straight line between ZIP code centers`;
}

/** route.summary */
export function routeSummaryText(route: Pick<CostRoute, "origin" | "destination">): string {
  return `${route.origin.city}, ${route.origin.state} to ${route.destination.city}, ${route.destination.state}`;
}

/** route.type.*.help, with {{setting.local_radius_miles}} from the platform setting. */
export function moveTypeHelp(moveType: MoveType, localRadiusMiles: number): string {
  switch (moveType) {
    case "local":
      return `Same state, no more than ${wholeNumber.format(localRadiusMiles)} miles apart`;
    case "intrastate":
      return `Same state, more than ${wholeNumber.format(localRadiusMiles)} miles apart`;
    case "interstate":
      return "Different states, whatever the distance";
  }
}

/** ST-7's {{cost.result.scope}}: home size, move type and (long distance) band. */
export function scopeText(result: Pick<CostRange, "homeSize" | "moveType" | "band">): string {
  const parts = [SCOPE_SIZE[result.homeSize], MOVE_TYPE_LABELS[result.moveType].toLowerCase()];
  if (result.band) parts.push(DISTANCE_BAND_LABELS[result.band]);
  return parts.join(", ");
}

/** ST-7's {{cost.result.basis}}: source and sample. */
export function basisText(result: Pick<CostRange, "moverCount" | "area">): string {
  return `rate cards from ${result.moverCount} movers serving ${result.area.name}`;
}

/** ST-7's {{cost.result.range}}. */
export function rangeText(result: Pick<CostRange, "lowCents" | "highCents">): string {
  return `${formatDollars(result.lowCents)} to ${formatDollars(result.highCents)}`;
}

/** The filled-in parts of ST-7 for one range. */
export interface RangeLabel {
  range: string;
  scope: string;
  basis: string;
  asOf: string;
  modelVersion: string;
}

export function rangeLabel(result: CostRange): RangeLabel {
  return {
    range: rangeText(result),
    scope: scopeText(result),
    basis: basisText(result),
    asOf: formatLongDate(result.asOf),
    modelVersion: result.modelVersion,
  };
}

/** Token values the result lists render (content/tokens.json). */
export interface CostTextTokens {
  storageAssumption: string;
  specialtyItems: string;
}

/** Picked services in lowercase as results.includes.services names them. */
function includedServiceNames(services: readonly CostService[], tokens: CostTextTokens): string[] {
  return services.map((service) =>
    service === "packing" ? "packing" : service === "storage" ? `storage for ${tokens.storageAssumption}` : `specialty items (${tokens.specialtyItems})`,
  );
}

/** The results view's lists ("What this range assumes", "includes", "leaves out"). */
export interface ResultLists {
  assumes: string[];
  includes: string[];
  excludes: string[];
}

export function resultLists(result: CostRange, route: CostRoute, tokens: CostTextTokens): ResultLists {
  const assumes = [
    `Route: ${route.origin.city}, ${route.origin.state} ${route.origin.zip} to ${route.destination.city}, ${route.destination.state} ${route.destination.zip}`,
    `Distance: ${routeDistanceText(route)} · ${MOVE_TYPE_LABELS[result.moveType]}`,
  ];
  if (result.band) assumes.push(`Distance band: ${DISTANCE_BAND_LABELS[result.band]}`);
  assumes.push(`Home size: ${MOVE_SIZE_LABELS[result.homeSize]}`);
  assumes.push(
    result.services.length > 0
      ? `Services: ${joinWithAnd(result.services.map((s) => SERVICE_LABELS[s].toLowerCase()))}`
      : "Services: none",
  );
  assumes.push("Time of year: not adjusted; this version uses each mover's standard rates");

  const includes =
    result.moveType === "local"
      ? ["the crew's time", "a truck or travel fee, where the mover charges one"]
      : ["the shipment's weight and distance"];
  if (result.services.length > 0) includes.push(`the services you picked: ${joinWithAnd(includedServiceNames(result.services, tokens))}`);

  const excludes = [
    "charges for valuation coverage",
    "charges a mover sets after surveying your home, such as for stairs, long carries or a shuttle",
    "tips",
  ];
  if (result.services.includes("storage")) excludes.push(`storage beyond ${tokens.storageAssumption}`);
  if (result.services.includes("specialty_items")) excludes.push(`specialty items other than ${tokens.specialtyItems}`);
  excludes.push("parking permits", "any service you didn't pick");
  return { assumes, includes, excludes };
}

/**
 * A compact summary for a widget elsewhere on the site (for example a cost hub): the same label
 * parts as the results view, never one figure.
 */
export function widgetSummary(result: CostResult): { kind: CostResult["kind"]; label: RangeLabel | null } {
  return { kind: result.kind, label: result.kind === "range" ? rangeLabel(result) : null };
}

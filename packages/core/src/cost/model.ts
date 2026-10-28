/**
 * cost-model-v1 (build plan §7.3). Pure: no I/O, no clock, no billing, purchase or plan data.
 * Account status is applied by the caller, which passes only approved companies' active cards.
 *
 * 1. Typical job: medians of what the area's movers state for the move type and home size,
 *    whatever services are picked, so adding a service never changes the typical job.
 * 2. Each contributing mover is priced on that job with its own rates.
 * 3. The range is the 25th to 75th percentile of those results (linear interpolation), rounded
 *    outward to $50 (local) or $100 (long distance). At least 5 distinct movers, or no range.
 */
import type { MoveType } from "../geo";
import type { MoveSize } from "../matching";
import {
  COST_MODEL_V1,
  COST_MODEL_VERSION,
  COST_SERVICES,
  DISTANCE_BANDS,
  DISTANCE_BAND_MAX_MILES,
  isHomeSize,
  type CostModelConfig,
  type CostRateCard,
  type CostResult,
  type CostRoute,
  type CostService,
  type CrewSize,
  type DistanceBand,
  type HomeSize,
  type NoDataCause,
  type TypicalJob,
} from "./types";

/** The band for a long-distance move: 0–250 includes 250 miles, 250–500 includes 500, and so on. */
export function distanceBandFor(miles: number): DistanceBand {
  if (!Number.isFinite(miles) || miles < 0) throw new RangeError(`miles must be a non-negative number, got ${miles}`);
  for (const band of DISTANCE_BANDS) if (miles <= DISTANCE_BAND_MAX_MILES[band]) return band;
  return "1500_plus";
}

/** Local moves use the hourly formula; in-state long distance and every interstate move use weight. */
export const pricingFor = (moveType: MoveType): "local" | "long_distance" => (moveType === "local" ? "local" : "long_distance");

/** Percentile by linear interpolation between the two nearest values (rank p/100 × (n − 1)). */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) throw new RangeError("percentile of an empty list");
  if (p < 0 || p > 100) throw new RangeError(`p must be 0 to 100, got ${p}`);
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lo = sorted[lower]!;
  const hi = sorted[upper]!;
  return lo + (hi - lo) * (rank - lower);
}

export const median = (values: readonly number[]): number => percentile(values, 50);

/** Rounds the low end down and the high end up to whole units, so rounding never narrows the range. */
export function roundOutward(low: number, high: number, unit: number): { low: number; high: number } {
  const roundedLow = Math.floor(low / unit) * unit;
  let roundedHigh = Math.ceil(high / unit) * unit;
  // A range is never one figure (site architecture §6.3 rule 1).
  if (roundedHigh <= roundedLow) roundedHigh = roundedLow + unit;
  return { low: Math.max(0, roundedLow), high: roundedHigh };
}

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Services in form order, deduplicated. */
export function canonicalServices(services: readonly string[]): CostService[] {
  return COST_SERVICES.filter((service) => services.includes(service));
}

/** The card's price for one picked service on this home size, or null when it doesn't price it. */
export function servicePrice(card: CostRateCard, service: CostService, size: HomeSize, config: CostModelConfig = COST_MODEL_V1): number | null {
  const rates = card.services;
  if (!rates) return null;
  switch (service) {
    case "packing": {
      const price = rates.packing_cents_by_size?.[size];
      return isAmount(price) ? price : null;
    }
    case "storage": {
      const price = rates.storage_cents_per_month_by_size?.[size];
      return isAmount(price) ? price * config.storageMonths : null;
    }
    case "specialty_items":
      return isAmount(rates.specialty_item_cents) ? rates.specialty_item_cents : null;
  }
}

/** Whether a card states the job for this move type and size (what the typical job is built from). */
function statesJob(card: CostRateCard, pricing: "local" | "long_distance", size: HomeSize): boolean {
  if (pricing === "local") {
    const local = card.local;
    return !!local && isAmount(local.hours_by_size[size]) && local.hours_by_size[size]! > 0 && isAmount(local.crew_by_size[size]) && local.crew_by_size[size]! > 0;
  }
  const ld = card.longDistance;
  return !!ld && isAmount(ld.weight_lbs_by_size[size]) && ld.weight_lbs_by_size[size]! > 0;
}

/** The typical job from the cards that state one; null when none does. */
export function typicalJob(cards: readonly CostRateCard[], moveType: MoveType, size: HomeSize): TypicalJob | null {
  const pricing = pricingFor(moveType);
  const stating = cards.filter((card) => statesJob(card, pricing, size));
  if (stating.length === 0) return null;
  if (pricing === "local") {
    return {
      moveType: "local",
      // The crew-size median rounds to a whole crew (half up), which each mover's card must price.
      crew: Math.round(median(stating.map((card) => card.local!.crew_by_size[size]!))),
      hours: median(stating.map((card) => card.local!.hours_by_size[size]!)),
    };
  }
  return { moveType: "long_distance", weightLbs: median(stating.map((card) => card.longDistance!.weight_lbs_by_size[size]!)) };
}

/** One mover's result for the typical job in cents, or null when its card can't price all of it. */
export function priceCard(
  card: CostRateCard,
  job: TypicalJob,
  route: { moveType: MoveType; band: DistanceBand | null },
  size: HomeSize,
  services: readonly CostService[],
  config: CostModelConfig = COST_MODEL_V1,
): number | null {
  let base: number;
  if (job.moveType === "local") {
    if (!statesJob(card, "local", size)) return null;
    const local = card.local!;
    const hourly = local.crew_hourly_cents[String(job.crew) as CrewSize];
    if (!isAmount(hourly) || !isAmount(local.travel_fee_cents)) return null;
    base = Math.round(job.hours * hourly) + local.travel_fee_cents;
  } else {
    if (!route.band || !statesJob(card, "long_distance", size)) return null;
    const cwt = card.longDistance!.cwt_cents_by_band[route.band];
    if (!isAmount(cwt)) return null;
    base = Math.round((job.weightLbs * cwt) / 100);
  }
  let total = base;
  for (const service of services) {
    const price = servicePrice(card, service, size, config);
    if (price === null) return null;
    total += price;
  }
  return total;
}

/** Cards dated within the maximum data age (calendar months before `now`). */
export function recentCards(cards: readonly CostRateCard[], now: Date, config: CostModelConfig = COST_MODEL_V1): CostRateCard[] {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - config.maxDataAgeMonths);
  return cards.filter((card) => new Date(card.createdAt).getTime() >= cutoff.getTime());
}

/** One card per company (the newest), so no mover counts twice. */
function distinctMovers(cards: readonly CostRateCard[]): CostRateCard[] {
  const byCompany = new Map<string, CostRateCard>();
  for (const card of cards) {
    const seen = byCompany.get(card.companyId);
    if (!seen || seen.createdAt < card.createdAt) byCompany.set(card.companyId, card);
  }
  return [...byCompany.values()].sort((a, b) => (a.companyId < b.companyId ? -1 : a.companyId > b.companyId ? 1 : 0));
}

interface Priced {
  job: TypicalJob | null;
  results: { card: CostRateCard; cents: number }[];
}

function priceAll(
  cards: readonly CostRateCard[],
  moveType: MoveType,
  band: DistanceBand | null,
  size: HomeSize,
  services: readonly CostService[],
  config: CostModelConfig,
): Priced {
  const job = typicalJob(cards, moveType, size);
  if (!job) return { job, results: [] };
  const results: Priced["results"] = [];
  for (const card of cards) {
    const cents = priceCard(card, job, { moveType, band }, size, services, config);
    if (cents !== null) results.push({ card, cents });
  }
  return { job, results };
}

export interface CostInput {
  route: Pick<CostRoute, "miles" | "moveType">;
  moveSize: MoveSize;
  services: readonly string[];
  /** Active cards of approved, non-suspended companies covering the origin state, any age. */
  cards: readonly CostRateCard[];
  /** The area the thresholds are counted in (origin state in v1). */
  area: { state: string; name: string };
  now: Date;
  config?: CostModelConfig;
}

/** The range for a move, or the reason there is none. */
export function computeCost(input: CostInput): CostResult {
  const config = input.config ?? COST_MODEL_V1;
  const moveType = input.route.moveType;
  const band = moveType === "local" ? null : distanceBandFor(input.route.miles);
  const services = canonicalServices(input.services);
  const base = { modelVersion: COST_MODEL_VERSION, moveType, band, services, area: input.area } as const;
  const size = input.moveSize;
  if (!isHomeSize(size)) return { ...base, kind: "size_unpriced", moveSize: size };

  const all = distinctMovers(input.cards);
  const recent = recentCards(all, input.now, config);
  const priced = priceAll(recent, moveType, band, size, services, config);

  if (priced.job && priced.results.length >= config.minMovers) {
    const values = priced.results.map((r) => r.cents);
    const unit = moveType === "local" ? config.roundingLocalCents : config.roundingLongDistanceCents;
    const { low, high } = roundOutward(percentile(values, config.percentileLow), percentile(values, config.percentileHigh), unit);
    const asOf = priced.results.map((r) => r.card.createdAt).reduce((oldest, at) => (new Date(at) < new Date(oldest) ? at : oldest));
    return {
      ...base,
      kind: "range",
      homeSize: size,
      lowCents: low,
      highCents: high,
      moverCount: priced.results.length,
      asOf: new Date(asOf).toISOString(),
      typicalJob: priced.job,
    };
  }

  // Name the cause (method page, "When does the calculator show no range?").
  let cause: NoDataCause = "too_few_movers";
  if (services.length > 0 && priceAll(recent, moveType, band, size, [], config).results.length >= config.minMovers) {
    cause = "services";
  } else if (recent.length < all.length && priceAll(all, moveType, band, size, services, config).results.length >= config.minMovers) {
    cause = "stale";
  }
  return { ...base, kind: "no_data", homeSize: size, cause, moverCount: priced.results.length };
}

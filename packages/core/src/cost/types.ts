/**
 * Types and fixed values of the cost model (build plan §7.3; content/pages/costs/calculator-method.md).
 * Keys match the rate-card JSON stored in rate_cards.local, .long_distance and .services.
 */
import type { MoveType } from "../geo";
import type { MoveSize } from "../matching";

/** The one model version that feeds the widget, the results view and the survey prefill. */
export const COST_MODEL_VERSION = "cost-model-v1";

/** The five home sizes rate cards price. Office moves and moves of a few items get no range in v1. */
export const HOME_SIZES = ["studio", "1br", "2br", "3br", "4br_plus"] as const;
export type HomeSize = (typeof HOME_SIZES)[number];

/** Services a range can include, in form order. */
export const COST_SERVICES = ["packing", "storage", "specialty_items"] as const;
export type CostService = (typeof COST_SERVICES)[number];

/** Crew sizes a rate card prices by the hour. */
export const CREW_SIZES = ["2", "3", "4", "5"] as const;
export type CrewSize = (typeof CREW_SIZES)[number];

/** Distance bands for long-distance moves (haversine miles between ZIP centroids). */
export const DISTANCE_BANDS = ["0_250", "250_500", "500_1000", "1000_1500", "1500_plus"] as const;
export type DistanceBand = (typeof DISTANCE_BANDS)[number];

/** Upper bound (inclusive) of each band in miles; the last band has none. */
export const DISTANCE_BAND_MAX_MILES: Record<DistanceBand, number> = {
  "0_250": 250,
  "250_500": 500,
  "500_1000": 1000,
  "1000_1500": 1500,
  "1500_plus": Number.POSITIVE_INFINITY,
};

export function isHomeSize(value: string): value is HomeSize {
  return (HOME_SIZES as readonly string[]).includes(value);
}

export function isCostService(value: string): value is CostService {
  return (COST_SERVICES as readonly string[]).includes(value);
}

export type BySize = Partial<Record<HomeSize, number>>;

/** rate_cards.local */
export interface LocalRates {
  crew_hourly_cents: Partial<Record<CrewSize, number>>;
  travel_fee_cents: number;
  hours_by_size: BySize;
  crew_by_size: BySize;
}

/** rate_cards.long_distance */
export interface LongDistanceRates {
  cwt_cents_by_band: Partial<Record<DistanceBand, number>>;
  weight_lbs_by_size: BySize;
}

/** rate_cards.services (added by migration 120). Null parts mean the mover doesn't price that service. */
export interface ServiceRates {
  packing_cents_by_size: BySize | null;
  storage_cents_per_month_by_size: BySize | null;
  specialty_item_cents: number | null;
}

/** One active rate card of an approved company whose card covers the origin state. */
export interface CostRateCard {
  companyId: string;
  /** When the card was submitted (ISO timestamp). */
  createdAt: string;
  local: LocalRates | null;
  longDistance: LongDistanceRates | null;
  services: ServiceRates | null;
}

/** The v1 method values (build plan §7.3). Proposals until the data owner confirms them. */
export interface CostModelConfig {
  minMovers: number;
  percentileLow: number;
  percentileHigh: number;
  roundingLocalCents: number;
  roundingLongDistanceCents: number;
  maxDataAgeMonths: number;
  storageMonths: number;
}

export const COST_MODEL_V1: Readonly<CostModelConfig> = Object.freeze({
  minMovers: 5,
  percentileLow: 25,
  percentileHigh: 75,
  roundingLocalCents: 5_000,
  roundingLongDistanceCents: 10_000,
  maxDataAgeMonths: 12,
  storageMonths: 1,
});

/** One end of a resolved route. */
export interface RouteEnd {
  zip: string;
  city: string;
  state: string;
}

/** A route as the server resolves it (ZIP centroids, haversine miles, classifyMove). */
export interface CostRoute {
  origin: RouteEnd;
  destination: RouteEnd;
  /** Miles with one decimal. */
  miles: number;
  moveType: MoveType;
}

/** What the reader asks for, in canonical form (services deduplicated and in form order). */
export interface CostQuery {
  originZip: string;
  destinationZip: string;
  moveSize: MoveSize;
  services: CostService[];
}

/** The typical job the range describes, from the medians of contributing movers' cards. */
export type TypicalJob =
  | { moveType: "local"; crew: number; hours: number }
  | { moveType: "long_distance"; weightLbs: number };

export type NoDataCause =
  /** Too few movers' cards cover the area, move type and home size. */
  | "too_few_movers"
  /** Enough without the picked services, too few that price every one of them. */
  | "services"
  /** Enough with older cards, too few within the maximum data age. */
  | "stale";

interface ResultBase {
  modelVersion: typeof COST_MODEL_VERSION;
  moveType: MoveType;
  band: DistanceBand | null;
  services: CostService[];
  /** The area thresholds are counted in: the origin state in v1. */
  area: { state: string; name: string };
}

export interface CostRange extends ResultBase {
  kind: "range";
  homeSize: HomeSize;
  lowCents: number;
  highCents: number;
  moverCount: number;
  /** Oldest contributing card (ISO timestamp): every card in the range is at least that recent. */
  asOf: string;
  typicalJob: TypicalJob;
}

export interface CostNoData extends ResultBase {
  kind: "no_data";
  homeSize: HomeSize;
  cause: NoDataCause;
  moverCount: number;
}

export interface CostSizeUnpriced extends ResultBase {
  kind: "size_unpriced";
  moveSize: MoveSize;
}

export type CostResult = CostRange | CostNoData | CostSizeUnpriced;

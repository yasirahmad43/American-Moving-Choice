/** Test fixtures for the cost model (not exported from the package). */
import type { CostRateCard, CostRoute } from "./types";

export const NOW = new Date("2026-10-28T12:00:00Z");

export const daysAgo = (days: number): string => new Date(NOW.getTime() - days * 86_400_000).toISOString();

/** A card shaped like the seed's: factor scales every price; sizes and crews as build plan §7.3. */
export function card(n: number, factor = 1, overrides: Partial<CostRateCard> = {}): CostRateCard {
  const f = (cents: number) => Math.round((cents * factor) / 100) * 100;
  return {
    companyId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    createdAt: daysAgo(30 + n),
    local: {
      crew_hourly_cents: { "2": f(12900), "3": f(16900), "4": f(20900), "5": f(24900) },
      travel_fee_cents: f(12500),
      hours_by_size: { studio: 3, "1br": 4, "2br": 5.5, "3br": 7.5, "4br_plus": 9.5 },
      crew_by_size: { studio: 2, "1br": 2, "2br": 3, "3br": 3, "4br_plus": 4 },
    },
    longDistance: {
      cwt_cents_by_band: { "0_250": f(6800), "250_500": f(8200), "500_1000": f(9800), "1000_1500": f(11200), "1500_plus": f(12800) },
      weight_lbs_by_size: { studio: 2000, "1br": 3000, "2br": 4500, "3br": 6500, "4br_plus": 9000 },
    },
    services: {
      packing_cents_by_size: { studio: f(30000), "1br": f(45000), "2br": f(65000), "3br": f(90000), "4br_plus": f(120000) },
      storage_cents_per_month_by_size: { studio: f(15000), "1br": f(20000), "2br": f(27500), "3br": f(35000), "4br_plus": f(45000) },
      specialty_item_cents: f(35000),
    },
    ...overrides,
  };
}

export const TEXAS = { state: "TX", name: "Texas" };

export const DALLAS_HOUSTON: CostRoute = {
  origin: { zip: "75201", city: "Dallas", state: "TX" },
  destination: { zip: "77002", city: "Houston", state: "TX" },
  miles: 224.7,
  moveType: "intrastate",
};

export const DALLAS_LOCAL: CostRoute = {
  origin: { zip: "75201", city: "Dallas", state: "TX" },
  destination: { zip: "75207", city: "Dallas", state: "TX" },
  miles: 2.3,
  moveType: "local",
};

export const FIVE_TX = [card(1, 1), card(2, 0.94), card(3, 0.98), card(4, 1.04), card(5, 1.08)];

import { describe, expect, it } from "vitest";
import { cleanZipEntry, isUnsupportedZip, joinWithAnd, parseCalculatorAnswers, stillNeeded } from "./answers";
import { DALLAS_HOUSTON, DALLAS_LOCAL, FIVE_TX, NOW, TEXAS, card, daysAgo } from "./fixtures.test-helpers";
import {
  canonicalServices,
  computeCost,
  distanceBandFor,
  median,
  percentile,
  priceCard,
  recentCards,
  roundOutward,
  typicalJob,
} from "./model";
import { basisText, formatDollars, rangeLabel, resultLists, routeDistanceText, scopeText } from "./present";
import { COST_MODEL_V1, COST_MODEL_VERSION, type CostRange } from "./types";

const TOKENS = { storageAssumption: "one month", specialtyItems: "one large item such as a piano" };

describe("distance bands", () => {
  it("puts each boundary in the lower band", () => {
    expect(distanceBandFor(0)).toBe("0_250");
    expect(distanceBandFor(250)).toBe("0_250");
    expect(distanceBandFor(250.1)).toBe("250_500");
    expect(distanceBandFor(500)).toBe("250_500");
    expect(distanceBandFor(999.9)).toBe("500_1000");
    expect(distanceBandFor(1500)).toBe("1000_1500");
    expect(distanceBandFor(1500.1)).toBe("1500_plus");
    expect(distanceBandFor(2800)).toBe("1500_plus");
  });
  it("rejects negative or missing distances", () => {
    expect(() => distanceBandFor(-1)).toThrow(RangeError);
    expect(() => distanceBandFor(Number.NaN)).toThrow(RangeError);
  });
});

describe("percentiles and rounding", () => {
  it("interpolates linearly between the two nearest results", () => {
    expect(percentile([10, 20, 30, 40, 50], 25)).toBe(20);
    expect(percentile([10, 20, 30, 40], 25)).toBe(17.5);
    expect(percentile([40, 10, 30, 20], 75)).toBe(32.5);
    expect(percentile([7], 25)).toBe(7);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(() => percentile([], 50)).toThrow(RangeError);
  });
  it("rounds outward, never narrowing the span", () => {
    expect(roundOutward(123_456, 165_001, 5_000)).toEqual({ low: 120_000, high: 170_000 });
    expect(roundOutward(120_000, 170_000, 5_000)).toEqual({ low: 120_000, high: 170_000 });
    expect(roundOutward(301_234, 349_999, 10_000)).toEqual({ low: 300_000, high: 350_000 });
  });
  it("never collapses to one figure", () => {
    expect(roundOutward(100_000, 100_000, 5_000)).toEqual({ low: 100_000, high: 105_000 });
  });
});

describe("typical job and per-mover pricing", () => {
  it("uses the medians of stated crews, hours and weights", () => {
    const cards = [
      card(1, 1),
      card(2, 1, { local: { ...card(2).local!, hours_by_size: { "2br": 5 }, crew_by_size: { "2br": 2 } } }),
      card(3, 1, { local: { ...card(3).local!, hours_by_size: { "2br": 7 }, crew_by_size: { "2br": 4 } } }),
    ];
    expect(typicalJob(cards, "local", "2br")).toEqual({ moveType: "local", crew: 3, hours: 5.5 });
    expect(typicalJob(cards, "interstate", "2br")).toEqual({ moveType: "long_distance", weightLbs: 4500 });
  });
  it("rounds a half crew up", () => {
    const cards = [
      card(1, 1, { local: { ...card(1).local!, crew_by_size: { "2br": 2 } } }),
      card(2, 1, { local: { ...card(2).local!, crew_by_size: { "2br": 3 } } }),
    ];
    expect(typicalJob(cards, "local", "2br")).toMatchObject({ crew: 3 });
  });
  it("prices a local move as hours × the crew's hourly rate + travel fee + services", () => {
    const job = { moveType: "local", crew: 3, hours: 5.5 } as const;
    expect(priceCard(card(1), job, { moveType: "local", band: null }, "2br", [])).toBe(5.5 * 16900 + 12500);
    expect(priceCard(card(1), job, { moveType: "local", band: null }, "2br", ["packing", "storage"])).toBe(5.5 * 16900 + 12500 + 65000 + 27500);
  });
  it("prices a long-distance move as weight ÷ 100 × the band's rate + services", () => {
    const job = { moveType: "long_distance", weightLbs: 4500 } as const;
    expect(priceCard(card(1), job, { moveType: "intrastate", band: "0_250" }, "2br", [])).toBe(45 * 6800);
    expect(priceCard(card(1), job, { moveType: "interstate", band: "500_1000" }, "2br", ["specialty_items"])).toBe(45 * 9800 + 35000);
  });
  it("leaves out a mover that doesn't price the crew, band, size or a picked service", () => {
    const local = { moveType: "local", crew: 5, hours: 9.5 } as const;
    const noFive = card(1, 1, { local: { ...card(1).local!, crew_hourly_cents: { "2": 1, "3": 1, "4": 1 } } });
    expect(priceCard(noFive, local, { moveType: "local", band: null }, "4br_plus", [])).toBeNull();
    const noBand = card(1, 1, { longDistance: { ...card(1).longDistance!, cwt_cents_by_band: { "0_250": 6800 } } });
    expect(priceCard(noBand, { moveType: "long_distance", weightLbs: 4500 }, { moveType: "interstate", band: "500_1000" }, "2br", [])).toBeNull();
    const noPacking = card(1, 1, { services: { packing_cents_by_size: null, storage_cents_per_month_by_size: null, specialty_item_cents: null } });
    expect(priceCard(noPacking, { moveType: "local", crew: 3, hours: 5.5 }, { moveType: "local", band: null }, "2br", ["packing"])).toBeNull();
    expect(priceCard({ ...card(1), services: null }, { moveType: "local", crew: 3, hours: 5.5 }, { moveType: "local", band: null }, "2br", ["storage"])).toBeNull();
    expect(priceCard({ ...card(1), local: null }, { moveType: "local", crew: 3, hours: 5.5 }, { moveType: "local", band: null }, "2br", [])).toBeNull();
  });
  it("prices storage for the assumed number of months", () => {
    const job = { moveType: "local", crew: 3, hours: 5.5 } as const;
    const twoMonths = { ...COST_MODEL_V1, storageMonths: 2 };
    expect(priceCard(card(1), job, { moveType: "local", band: null }, "2br", ["storage"], twoMonths)).toBe(5.5 * 16900 + 12500 + 2 * 27500);
  });
});

describe("computeCost", () => {
  it("gives the 25th to 75th percentile range, rounded outward to $100, for a long-distance move", () => {
    const result = computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: FIVE_TX, area: TEXAS, now: NOW });
    expect(result.kind).toBe("range");
    const range = result as CostRange;
    // Per-mover results: 45 × cwt for factors 0.94, 0.98, 1, 1.04, 1.08 → 6400, 6700, 6800, 7100, 7300.
    // 25th percentile = 6700 × 45 = $3,015 → $3,000; 75th = 7100 × 45 = $3,195 → $3,200.
    expect([range.lowCents, range.highCents]).toEqual([300_000, 320_000]);
    expect(range).toMatchObject({ moveType: "intrastate", band: "0_250", homeSize: "2br", moverCount: 5, modelVersion: COST_MODEL_VERSION });
    expect(range.typicalJob).toEqual({ moveType: "long_distance", weightLbs: 4500 });
  });

  it("rounds a local range outward to $50", () => {
    const result = computeCost({ route: DALLAS_LOCAL, moveSize: "1br", services: [], cards: FIVE_TX, area: TEXAS, now: NOW }) as CostRange;
    // Typical job: 2 movers × 4 hours. Results: 4 × hourly + travel per factor.
    const results = FIVE_TX.map((c) => 4 * c.local!.crew_hourly_cents["2"]! + c.local!.travel_fee_cents).sort((a, b) => a - b);
    expect(result.lowCents).toBe(Math.floor(results[1]! / 5000) * 5000);
    expect(result.highCents).toBe(Math.ceil(results[3]! / 5000) * 5000);
    expect(result.lowCents % 5000).toBe(0);
    expect(result.band).toBeNull();
  });

  it("dates the range by its oldest contributing card", () => {
    const cards = FIVE_TX.map((c, i) => ({ ...c, createdAt: daysAgo(10 + i * 40) }));
    const result = computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards, area: TEXAS, now: NOW }) as CostRange;
    expect(result.asOf).toBe(daysAgo(170));
  });

  it("needs at least five distinct movers", () => {
    const four = computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: FIVE_TX.slice(0, 4), area: TEXAS, now: NOW });
    expect(four).toMatchObject({ kind: "no_data", cause: "too_few_movers", moverCount: 4 });
    // Two cards from one company count once.
    const duplicate = [...FIVE_TX.slice(0, 4), { ...FIVE_TX[0]!, createdAt: daysAgo(5) }];
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: duplicate, area: TEXAS, now: NOW })).toMatchObject({ kind: "no_data" });
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: [], area: TEXAS, now: NOW })).toMatchObject({
      kind: "no_data",
      cause: "too_few_movers",
      moverCount: 0,
    });
  });

  it("names picked services as the cause when they are what drops movers below the threshold", () => {
    const cards = [...FIVE_TX.slice(0, 4), card(5, 1.08, { services: { packing_cents_by_size: { "2br": 60000 }, storage_cents_per_month_by_size: null, specialty_item_cents: null } })];
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: ["packing"], cards, area: TEXAS, now: NOW }).kind).toBe("range");
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: ["packing", "storage"], cards, area: TEXAS, now: NOW })).toMatchObject({
      kind: "no_data",
      cause: "services",
      moverCount: 4,
    });
  });

  it("drops cards older than 12 months, and says so when older cards would have given a range", () => {
    const cards = [...FIVE_TX.slice(0, 4), { ...FIVE_TX[4]!, createdAt: "2025-10-27T12:00:00.000Z" }];
    expect(recentCards(cards, NOW)).toHaveLength(4);
    expect(recentCards([{ ...FIVE_TX[4]!, createdAt: "2025-10-28T12:00:00.000Z" }], NOW)).toHaveLength(1);
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards, area: TEXAS, now: NOW })).toMatchObject({ kind: "no_data", cause: "stale" });
  });

  it("gives office moves and moves of a few items no range", () => {
    for (const size of ["office", "partial"] as const) {
      expect(computeCost({ route: DALLAS_HOUSTON, moveSize: size, services: [], cards: FIVE_TX, area: TEXAS, now: NOW })).toMatchObject({ kind: "size_unpriced", moveSize: size });
    }
  });

  it("keeps the typical job when a service is added", () => {
    const without = computeCost({ route: DALLAS_LOCAL, moveSize: "3br", services: [], cards: FIVE_TX, area: TEXAS, now: NOW }) as CostRange;
    const withPacking = computeCost({ route: DALLAS_LOCAL, moveSize: "3br", services: ["packing"], cards: FIVE_TX, area: TEXAS, now: NOW }) as CostRange;
    expect(withPacking.typicalJob).toEqual(without.typicalJob);
    expect(withPacking.lowCents).toBeGreaterThan(without.lowCents);
  });

  it("ignores everything but rates: the inputs carry no spend, purchase or plan data", () => {
    const result = computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: FIVE_TX, area: TEXAS, now: NOW });
    const withExtras = FIVE_TX.map((c) => ({ ...c, monthlySpendCents: 9_999_999, purchases: 500 }) as typeof c);
    expect(computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: [], cards: withExtras, area: TEXAS, now: NOW })).toEqual(result);
  });

  it("is independent of card order", () => {
    const a = computeCost({ route: DALLAS_HOUSTON, moveSize: "3br", services: ["storage"], cards: FIVE_TX, area: TEXAS, now: NOW });
    const b = computeCost({ route: DALLAS_HOUSTON, moveSize: "3br", services: ["storage"], cards: [...FIVE_TX].reverse(), area: TEXAS, now: NOW });
    expect(a).toEqual(b);
  });
});

describe("presentation", () => {
  const result = computeCost({ route: DALLAS_HOUSTON, moveSize: "2br", services: ["storage", "packing"], cards: FIVE_TX, area: TEXAS, now: NOW }) as CostRange;

  it("fills ST-7's parts", () => {
    expect(scopeText(result)).toBe("a 2-bedroom home, in-state long distance, 0 to 250 miles");
    expect(scopeText({ homeSize: "4br_plus", moveType: "interstate", band: "500_1000" })).toBe("a home with 4 or more bedrooms, interstate, 500 to 1,000 miles");
    expect(scopeText({ homeSize: "studio", moveType: "local", band: null })).toBe("a studio, local");
    expect(basisText(result)).toBe("rate cards from 5 movers serving Texas");
    const label = rangeLabel(result);
    expect(label.range).toMatch(/^\$\d{1,3}(,\d{3})* to \$\d{1,3}(,\d{3})*$/);
    expect(label.modelVersion).toBe("cost-model-v1");
    expect(label.asOf).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    expect(formatDollars(123_400)).toBe("$1,234");
  });

  it("lists what the range assumes, includes and leaves out", () => {
    const lists = resultLists(result, DALLAS_HOUSTON, TOKENS);
    expect(lists.assumes).toEqual([
      "Route: Dallas, TX 75201 to Houston, TX 77002",
      "Distance: 225 miles in a straight line between ZIP code centers · In-state long distance",
      "Distance band: 0 to 250 miles",
      "Home size: 2 bedrooms",
      "Services: packing and storage",
      "Time of year: not adjusted; this version uses each mover's standard rates",
    ]);
    expect(lists.includes).toEqual(["the shipment's weight and distance", "the services you picked: packing and storage for one month"]);
    expect(lists.excludes).toContain("storage beyond one month");
    expect(lists.excludes).not.toContain("specialty items other than one large item such as a piano");
    expect(lists.excludes.at(-1)).toBe("any service you didn't pick");
  });

  it("words the distance as the copy does", () => {
    const end = (zip: string) => ({ zip, city: "X", state: "TX" });
    expect(routeDistanceText({ miles: 0, origin: end("75201"), destination: end("75201") })).toBe("Within ZIP code 75201");
    expect(routeDistanceText({ miles: 0.4, origin: end("75201"), destination: end("75202") })).toBe("Less than 1 mile between ZIP code centers");
    expect(routeDistanceText({ miles: 1.2, origin: end("75201"), destination: end("75202") })).toBe("1 mile in a straight line between ZIP code centers");
    expect(routeDistanceText({ miles: 1234.5, origin: end("75201"), destination: end("10001") })).toBe("1,235 miles in a straight line between ZIP code centers");
  });
});

describe("answers", () => {
  it("cleans ZIP entries and keeps leading zeros", () => {
    expect(cleanZipEntry("02108")).toEqual({ kind: "zip", zip: "02108" });
    expect(cleanZipEntry("02a108")).toEqual({ kind: "zip", zip: "02108" });
    expect(cleanZipEntry("ZIP 02108")).toEqual({ kind: "zip", zip: "02108" });
    expect(cleanZipEntry("02108-1234")).toEqual({ kind: "zip", zip: "02108" });
    expect(cleanZipEntry("0210O")).toEqual({ kind: "short", digits: "0210" });
    expect(cleanZipEntry("  ")).toEqual({ kind: "empty" });
  });
  it("recognises non-US postal codes before cleanup", () => {
    expect(cleanZipEntry("M5V 2T6")).toEqual({ kind: "non_us" });
    expect(cleanZipEntry("SW1A 1AA")).toEqual({ kind: "non_us" });
    expect(cleanZipEntry("EC1A1BB")).toEqual({ kind: "non_us" });
  });
  it("flags territories and military addresses as unsupported", () => {
    expect(["00901", "00802", "09012", "34002", "96201", "96910"].map(isUnsupportedZip)).toEqual([true, true, true, true, true, true]);
    expect(["01001", "10001", "75201", "96813", "99501"].map(isUnsupportedZip)).toEqual([false, false, false, false, false]);
  });
  it("validates answers with the copy's error IDs and nothing preselected", () => {
    expect(parseCalculatorAnswers({ origin: "", destination: "", size: null, services: [] })).toEqual({
      ok: false,
      errors: { origin: "error.origin.required", destination: "error.destination.required", size: "error.size.required" },
    });
    expect(parseCalculatorAnswers({ origin: "7520", destination: "M5V 2T6", size: "2br", services: [] })).toEqual({
      ok: false,
      errors: { origin: "error.zip.short", destination: "error.zip.non_us" },
    });
    expect(parseCalculatorAnswers({ origin: "75201", destination: "00901", size: "huge", services: [] })).toEqual({
      ok: false,
      errors: { destination: "error.zip.unsupported", size: "error.size.required" },
    });
    expect(parseCalculatorAnswers({ origin: " 75201 ", destination: "77002", size: "2br", services: ["storage", "packing", "storage", "bogus"] })).toEqual({
      ok: true,
      query: { originZip: "75201", destinationZip: "77002", moveSize: "2br", services: ["packing", "storage"] },
    });
  });
  it("lists what is still needed in form order", () => {
    expect(stillNeeded({ origin: "", destination: "772", size: null, services: [] })).toEqual(["origin", "destination", "size"]);
    expect(stillNeeded({ origin: "75201", destination: "77002", size: "office", services: [] })).toEqual([]);
    expect(joinWithAnd(["a"])).toBe("a");
    expect(joinWithAnd(["a", "b"])).toBe("a and b");
    expect(joinWithAnd(["a", "b", "c"])).toBe("a, b and c");
    expect(canonicalServices(["specialty_items", "packing"])).toEqual(["packing", "specialty_items"]);
  });
});

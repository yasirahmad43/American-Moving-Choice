/**
 * Slice S4: directory and profile queries, rating rules, the sort rule and verify-a-mover, against
 * the demo seed (15 approved companies, one in review, one rejected for broker authority).
 */
import { buildSeedSql } from "@amc/db/seed/build";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import {
  describeCoverage,
  labelCanRate,
  pageSlice,
  sortListings,
  summarizeRatings,
  type RatedReview,
  type SortableListing,
} from "../src/profiles/logic";
import { getProfile, getProfileReviews, listDirectory } from "../src/profiles/queries";
import { classifyAuthorities, lookupMover, normalizeLookupNumber } from "../src/profiles/verify";
import { resetDatabase } from "./helpers";

const pool = () => getPool();
const company = (n: number) => `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const LONE_STAR = "demo-lone-star-relocation-co";

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
});

afterAll(async () => {
  await closePool();
});

describe("rating rules", () => {
  const at = (iso: string) => new Date(iso);
  const now = at("2026-10-28T12:00:00Z");
  const reviews: RatedReview[] = [
    { reviewType: "quote_experience", rating: 5, evidenceLevel: "platform_inquiry", publishedAt: at("2026-10-01T00:00:00Z") },
    { reviewType: "quote_experience", rating: 2, evidenceLevel: "verified_customer", publishedAt: at("2025-06-01T00:00:00Z") },
    { reviewType: "move_experience", rating: 4, evidenceLevel: "completed_move", publishedAt: at("2026-09-01T00:00:00Z") },
    // A move review whose label can't rate the move never counts toward the moving rating.
    { reviewType: "move_experience", rating: 1, evidenceLevel: "platform_inquiry", publishedAt: at("2026-09-02T00:00:00Z") },
  ];

  it("keeps the two experiences apart and counts only labels that can rate them", () => {
    const quote = summarizeRatings(reviews, "quote_experience", now);
    expect(quote).toMatchObject({ mean: 3.5, count: 2, distribution: [0, 1, 0, 0, 1], last12Months: 1 });
    expect(quote.latestAt?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    const move = summarizeRatings(reviews, "move_experience", now);
    expect(move).toMatchObject({ mean: 4, count: 1, distribution: [0, 0, 0, 1, 0], last12Months: 1 });
    expect(labelCanRate("platform_inquiry", "move_experience")).toBe(false);
    expect(labelCanRate("completed_move", "move_experience")).toBe(true);
  });

  it("has no rating and no 0.0 without an eligible review", () => {
    const empty = summarizeRatings([], "move_experience", now);
    expect(empty.mean).toBeNull();
    expect(empty.count).toBe(0);
    expect(empty.latestAt).toBeNull();
  });
});

describe("the published sort rule", () => {
  const listing = (displayName: string, quote: [number | null, number], move: [number | null, number] = [null, 0]): SortableListing => ({
    displayName,
    ratings: { quote_experience: { mean: quote[0], count: quote[1] }, move_experience: { mean: move[0], count: move[1] } },
  });
  const items = [
    listing("Delta", [4.2, 6]),
    listing("alpha", [5, 4]), // a perfect mean on four reviews gets no priority under a minimum of five
    listing("Charlie", [4.8, 5]),
    listing("Bravo", [null, 0]),
  ];

  it("defaults to alphabetical by display name", () => {
    expect(sortListings(items, "name", 5).map((l) => l.displayName)).toEqual(["alpha", "Bravo", "Charlie", "Delta"]);
  });

  it("gives no rating-sort priority below the minimum sample", () => {
    expect(sortListings(items, "quote_rating", 5).map((l) => l.displayName)).toEqual(["Charlie", "Delta", "alpha", "Bravo"]);
    expect(sortListings(items, "move_rating", 5).map((l) => l.displayName)).toEqual(["alpha", "Bravo", "Charlie", "Delta"]);
  });

  it("paginates and refuses pages past the end", () => {
    expect(pageSlice([1, 2, 3], 2, 2)).toEqual({ items: [3], totalPages: 2 });
    expect(pageSlice([1, 2, 3], 3, 2)).toBeNull();
    expect(pageSlice([], 1, 2)).toEqual({ items: [], totalPages: 1 });
  });
});

describe("coverage in plain words", () => {
  const names = { state: (c: string) => ({ TX: "Texas", FL: "Florida" })[c] ?? c, county: (f: string) => `County ${f}` };
  const set = (states: string[] = [], counties: string[] = [], zips: string[] = []) => ({ states, counties, zips });

  it("describes rules from their data, keeps exclusions apart and skips paused rules", () => {
    const result = describeCoverage(
      [
        { kind: "include", paused: false, moveTypes: ["local", "intrastate"], origin: set(["TX"]), destination: set(["TX"]) },
        { kind: "include", paused: false, moveTypes: ["interstate"], origin: set(["TX"]), destination: set(["FL"]) },
        { kind: "include", paused: false, moveTypes: ["interstate"], origin: set(), destination: set() },
        { kind: "include", paused: true, moveTypes: ["local"], origin: set([], ["12345"]), destination: set() },
        { kind: "exclude", paused: false, moveTypes: [], origin: set(), destination: set([], ["12087"]) },
      ],
      ["local", "intrastate", "interstate"],
      names,
    );
    expect(result.serves).toEqual([
      "Local and in-state long-distance moves within Texas",
      "Interstate moves from Texas to Florida",
      "Interstate moves anywhere in the United States",
    ]);
    expect(result.excludes).toEqual(["Local, in-state long-distance and interstate moves ending in County 12087"]);
  });
});

describe("listDirectory", () => {
  it("lists the approved demo companies alphabetically, 12 to a page, and never the broker or the applicant", async () => {
    const first = await listDirectory({ page: 1 });
    const second = await listDirectory({ page: 2 });
    expect(first?.total).toBe(15);
    expect(first?.totalPages).toBe(2);
    expect(first?.listings).toHaveLength(12);
    expect(second?.listings).toHaveLength(3);
    const names = [...first!.listings, ...second!.listings].map((l) => l.displayName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en-US", { sensitivity: "base" })));
    expect(names).not.toContain("Demo Dual Authority Moving Group");
    expect(names).not.toContain("Demo Prairie Wind Movers");
    expect(await listDirectory({ page: 3 })).toBeNull();
    for (const listing of [...first!.listings, ...second!.listings]) {
      expect(listing.isDemo).toBe(true);
      expect(listing.badge?.verifiedDate).toBeInstanceOf(Date);
      expect(listing.noBrokerClaim).toBe(true);
      expect(listing.usdot).toMatch(/^90000(0[1-9]|1[0-5])$/);
      expect(listing.mcNumber).toBe(`MC-${listing.usdot}`);
    }
  });

  it("marks companies approved within the configured period as new", async () => {
    const page = await listDirectory({ page: 1 });
    const pecan = page!.listings.find((l) => l.slug === "demo-pecan-grove-moving-co")!;
    const bluebonnet = page!.listings.find((l) => l.slug === "demo-bluebonnet-hill-movers")!;
    expect(pecan.isNew).toBe(true);
    expect(bluebonnet.isNew).toBe(false);
  });

  it("drops a suspended company and one whose account is suspended for non-payment", async () => {
    await pool().query("update companies set status = 'suspended', suspended_at = now() where id = $1", [company(2)]);
    await pool().query("update companies set billing_status = 'suspended' where id = $1", [company(3)]);
    try {
      const page = await listDirectory({ page: 1 });
      expect(page?.total).toBe(13);
      const slugs = page!.listings.map((l) => l.slug);
      expect(slugs).not.toContain("demo-bluebonnet-hill-movers");
      expect(slugs).not.toContain("demo-pecan-grove-moving-co");
      expect(await getProfile("demo-bluebonnet-hill-movers")).toMatchObject({ kind: "suspended", displayName: "Demo Bluebonnet Hill Movers" });
      expect(await getProfile("demo-pecan-grove-moving-co")).toMatchObject({ kind: "suspended" });
    } finally {
      await pool().query("update companies set status = 'approved', suspended_at = null where id = $1", [company(2)]);
      await pool().query("update companies set billing_status = 'good' where id = $1", [company(3)]);
    }
  });

  it("hides the badge and the no-broker claim when the latest authority check failed", async () => {
    await pool().query(
      `insert into verification_checks (company_id, check_type, source, result, decision_note) values ($1, 'authority_type', 'fixture', 'fail', 'test')`,
      [company(4)],
    );
    const page = await listDirectory({ page: 1 });
    const mesquite = page!.listings.find((l) => l.slug === "demo-mesquite-trail-movers")!;
    expect(mesquite.badge).toBeNull();
    expect(mesquite.noBrokerClaim).toBe(false);
    await pool().query(
      `insert into verification_checks (company_id, check_type, source, result, decision_note) values ($1, 'authority_type', 'fixture', 'pass', 'test')`,
      [company(4)],
    );
  });
});

describe("getProfile", () => {
  it("returns dated credential rows with sources, the badge, coverage and separate ratings", async () => {
    const result = await getProfile(LONE_STAR);
    expect(result?.kind).toBe("live");
    if (result?.kind !== "live") throw new Error("unreachable");
    const p = result.profile;
    expect(p.displayName).toBe("Demo Lone Star Relocation Co.");
    expect(p.basedIn).toEqual({ city: "Austin", state: "TX", stateName: "Texas" });
    expect(p.credentials.map((c) => c.key)).toEqual(["usdot", "mc", "authority-MC-9000001-common", "no-broker", "insurance", "state-TX"]);
    for (const row of p.credentials) {
      expect(row.checkedAt).toBeInstanceOf(Date);
      expect(row.sourceUrl).toMatch(/^https:\/\//);
      expect(row.sourceLabel.length).toBeGreaterThan(3);
    }
    expect(p.credentials[0]).toMatchObject({ value: "9000001", sourceUrl: expect.stringContaining("safer.fmcsa.dot.gov") });
    expect(p.credentials.find((c) => c.key === "no-broker")?.value).toBe("No broker authority on record");
    expect(p.badge?.verifiedDate).toBeInstanceOf(Date);
    expect(p.checkSource).toBe("fixture");
    expect(p.coverage.serves).toContain("Local and in-state long-distance moves within Texas");
    expect(p.coverage.serves).toContain("Interstate moves from Texas to Florida");
    expect(p.ratings.quote_experience).toMatchObject({ mean: 5, count: 1 });
    expect(p.ratings.move_experience).toMatchObject({ mean: 4, count: 1 });
    // The pending review is never shown and never counted.
    expect(p.reviews).toHaveLength(2);
    expect(p.reviews.map((r) => r.title)).not.toContain("Quote took a few days");
    expect(p.reviews[0]!.publishedAt.getTime()).toBeGreaterThanOrEqual(p.reviews[1]!.publishedAt.getTime());
    expect(p.hasReviewsPage).toBe(false);
    expect(await getProfileReviews(LONE_STAR)).toBeNull();
  });

  it("shows the company's latest published response under a review", async () => {
    const review = "e2000000-0000-4000-8000-000000000002";
    await pool().query(
      `insert into review_responses (review_id, company_id, body, status) values ($1, $2, 'Thank you. We have updated our padding checklist.', 'published'),
                                                                                ($1, $2, 'Removed reply', 'removed')`,
      [review, company(1)],
    );
    const result = await getProfile(LONE_STAR);
    if (result?.kind !== "live") throw new Error("unreachable");
    const reviewed = result.profile.reviews.find((r) => r.id === review);
    expect(reviewed?.response?.body).toBe("Thank you. We have updated our padding checklist.");
    expect(reviewed?.evidenceLevel).toBe("completed_move");
  });

  it("shows no reviews and no ratings for a company without eligible reviews", async () => {
    const result = await getProfile("demo-coral-key-moving-co");
    if (result?.kind !== "live") throw new Error("unreachable");
    expect(result.profile.reviews).toEqual([]);
    expect(result.profile.ratings.quote_experience.mean).toBeNull();
    expect(result.profile.ratings.move_experience.mean).toBeNull();
    expect(result.profile.isNew).toBe(true);
  });

  it("returns null for the rejected broker, the applicant in review, unknown and malformed slugs", async () => {
    expect(await getProfile("demo-prairie-wind-movers")).toBeNull();
    expect(await getProfile("demo-dual-authority-moving-group")).toBeNull();
    expect(await getProfile("no-such-company")).toBeNull();
    expect(await getProfile("../etc")).toBeNull();
  });
});

describe("verify-a-mover", () => {
  it("normalizes numbers by kind", () => {
    expect(normalizeLookupNumber("usdot", "USDOT 9000001")).toBe("9000001");
    expect(normalizeLookupNumber("mc", "mc 09000001")).toBe("9000001");
    expect(normalizeLookupNumber("usdot", "MC-9000001")).toBeNull();
    expect(normalizeLookupNumber("usdot", "12ab")).toBeNull();
    expect(normalizeLookupNumber("usdot", "0")).toBeNull();
  });

  it("finds fixture USDOT 9000001 as a carrier in the network", async () => {
    const result = await lookupMover("usdot", "9000001");
    expect(result.status).toBe("found");
    if (result.status !== "found") throw new Error("unreachable");
    expect(result.demo).toBe(true);
    expect(result.record.legalName).toBe("Demo Lone Star Relocation Co.");
    expect(result.record.classification).toBe("carrier");
    expect(result.record.householdGoods).toBe(true);
    expect(result.inNetwork).toEqual({ slug: LONE_STAR, displayName: "Demo Lone Star Relocation Co." });
    expect(result.links.snapshot).toContain("query_string=9000001");
    expect(result.retrievedAt).toBeInstanceOf(Date);
  });

  it("reports the broker fixtures as brokers", async () => {
    const broker = await lookupMover("usdot", "9000090");
    if (broker.status !== "found") throw new Error("expected a record");
    expect(broker.record.classification).toBe("broker");
    expect(broker.inNetwork).toBeNull();
    const dual = await lookupMover("mc", "MC-9100091");
    if (dual.status !== "found") throw new Error("expected a record");
    expect(dual.record.usdot).toBe("9000091");
    expect(dual.record.classification).toBe("carrier_and_broker");
    const rejected = await lookupMover("usdot", "9000017");
    if (rejected.status !== "found") throw new Error("expected a record");
    expect(rejected.record.classification).toBe("carrier_and_broker");
    expect(rejected.inNetwork).toBeNull();
  });

  it("says when demo data can't answer and when input is invalid", async () => {
    expect((await lookupMover("usdot", "1234567")).status).toBe("unavailable");
    expect((await lookupMover("mc", "1234567")).status).toBe("not_found");
    expect((await lookupMover("usdot", "abc")).status).toBe("invalid");
  });

  it("classifies authority mixes", () => {
    expect(classifyAuthorities([{ docket: "MC-1", type: "common", scope: "household_goods", status: "revoked" }])).toBe("none_active");
    expect(classifyAuthorities([{ docket: "MC-1", type: "broker", scope: "property", status: "pending" }])).toBe("broker");
  });
});

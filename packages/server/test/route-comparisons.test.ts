import { describe, expect, it } from "vitest";
import { comparableEstimate, comparisonDifference, estimateShare, routeCensusPlace, routeComparisonSections } from "../src/seo/route-comparisons";

describe("sourced route relocation comparisons", () => {
  it("holds missing, suppressed and nonordinary uncertainty observations", () => {
    expect(comparableEstimate({ a: { estimate: 2_000_001, moe: null } }, "a")).toBeNull();
    expect(comparableEstimate({ a: { estimate: -666_666_666, moe: 4 } }, "a")).toBeNull();
    expect(comparableEstimate({ a: { estimate: 25, moe: -1 } }, "a")).toBeNull();
    expect(comparableEstimate({ a: { estimate: Number.NaN, moe: 1 } }, "a")).toBeNull();
    expect(comparableEstimate({ a: { estimate: 0, moe: 0 } }, "a")).toEqual({ estimate: 0, moe: 0 });
  });

  it("does not invent shares for absent, zero or inconsistent denominators", () => {
    const facts = { total: { estimate: 100, moe: 5 }, a: { estimate: 30, moe: 2 }, b: { estimate: 20, moe: 2 } };
    expect(estimateShare(facts, ["a", "b"], "total")).toBe(50);
    expect(estimateShare(facts, ["missing"], "total")).toBeNull();
    expect(estimateShare({ ...facts, total: { estimate: 0, moe: 0 } }, ["a"], "total")).toBeNull();
    expect(estimateShare({ ...facts, total: { estimate: 10, moe: 1 } }, ["a"], "total")).toBeNull();
  });

  it("uses the origin as the percentage denominator and keeps years/shares in their actual units", () => {
    expect(comparisonDifference(100, 125, "money")).toBe("$25 higher (25.0%)");
    expect(comparisonDifference(125, 100, "money")).toBe("$25 lower (20.0%)");
    expect(comparisonDifference(1980, 2000, "year")).toBe("20 years more recent");
    expect(comparisonDifference(2000, 1980, "year")).toBe("20 years earlier");
    expect(comparisonDifference(30, 35, "share")).toBe("5.0 percentage points higher");
    expect(comparisonDifference(5, 5, "rooms")).toBe("Same point estimate");
  });

  it("renders actual Census observations, uncertainty and historical limits without moving-price predictions", () => {
    const a = { name: "Austin", stateCode: "TX", placeGeoid: "4805000" };
    const b = { name: "Seattle", stateCode: "WA", placeGeoid: "5363000" };
    expect(routeCensusPlace(a.placeGeoid)).not.toBeNull();
    expect(routeCensusPlace(b.placeGeoid)).not.toBeNull();
    const comparison = routeComparisonSections(a, b);
    expect(comparison.evidence).toBeGreaterThanOrEqual(9);
    expect(comparison.sections).toHaveLength(2);
    const text = JSON.stringify(comparison);
    expect(text).toContain("2019–2023 ACS 5-year estimates");
    expect(text).toContain("90% margin of error");
    expect(text).toContain("uncertainty intervals have not been calculated");
    expect(text).toContain("not current asking prices");
    expect(text).not.toMatch(/NaN|Infinity|driving days|movers pay|\/companies\//);
    expect(comparison.sources.every((source) => source.url.startsWith("https://www2.census.gov/") && source.accessedOn === "2026-10-29")).toBe(true);
    for (const section of comparison.sections) for (const block of section.blocks) if (block.type === "table") expect(block.rows.every((row) => row.length === block.columns.length)).toBe(true);
  });

  it("does not create location facts or default figures for an unmatched Census place", () => {
    expect(routeComparisonSections({ name: "Unmatched", stateCode: "TX", placeGeoid: null }, { name: "Seattle", stateCode: "WA", placeGeoid: "5363000" })).toEqual({ sections: [], dataPoints: [], sources: [], evidence: 0 });
  });
});

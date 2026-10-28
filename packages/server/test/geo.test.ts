import { describe, expect, it } from "vitest";
import {
  countiesByState,
  countyByFips,
  distanceMiles,
  lookupZip,
  resolveMove,
  stateBySlug,
  statesList,
  zipDistanceMiles,
} from "../src/geo/geo";

describe("ZIP lookup", () => {
  it("resolves a ZIP to city, state, 5-digit county FIPS and centroid, keeping leading zeros", () => {
    expect(lookupZip("02108")).toEqual({
      zip: "02108",
      city: "Boston",
      state: "MA",
      countyFips: "25025",
      countyName: "Suffolk",
      lat: 42.3576,
      lng: -71.0684,
    });
    expect(lookupZip("00501")).toMatchObject({ zip: "00501", city: "Holtsville", state: "NY", countyFips: "36103" });
    expect(lookupZip("78704")).toMatchObject({ city: "Austin", state: "TX", countyFips: "48453", countyName: "Travis" });
    expect(lookupZip("20001")).toMatchObject({ city: "Washington", state: "DC", countyFips: "11001" });
  });

  it("accepts pasted forms and rejects malformed or unknown codes", () => {
    expect(lookupZip(" 02108 ")?.zip).toBe("02108");
    expect(lookupZip("02108-1234")?.zip).toBe("02108");
    expect(lookupZip("2108")).toBeNull();
    expect(lookupZip("021081")).toBeNull();
    expect(lookupZip("abcde")).toBeNull();
    expect(lookupZip("00000")).toBeNull();
  });

  it("covers the 50 states and DC only (no territories or military codes)", () => {
    expect(lookupZip("00601")).toBeNull(); // Puerto Rico
    expect(lookupZip("96910")).toBeNull(); // Guam
    expect(lookupZip("09001")).toBeNull(); // APO AE
    expect(lookupZip("99553")).toMatchObject({ state: "AK", city: "Akutan" });
    expect(lookupZip("96813")).toMatchObject({ state: "HI" });
  });
});

describe("distance", () => {
  it("computes haversine miles between centroids", () => {
    expect(distanceMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
    const austinHouston = zipDistanceMiles("78704", "77006");
    expect(austinHouston).toBeGreaterThan(140);
    expect(austinHouston).toBeLessThan(152);
    const nyLa = zipDistanceMiles("10001", "90012");
    expect(nyLa).toBeGreaterThan(2400);
    expect(nyLa).toBeLessThan(2500);
    expect(zipDistanceMiles("10001", "00000")).toBeNull();
  });

  it("is symmetric", () => {
    expect(zipDistanceMiles("33130", "75204")).toBe(zipDistanceMiles("75204", "33130"));
  });

  it("classifies moves with the local radius", () => {
    expect(resolveMove("78704", "78745", 50)?.moveType).toBe("local");
    expect(resolveMove("78704", "77006", 50)?.moveType).toBe("intrastate");
    expect(resolveMove("78704", "77006", 200)?.moveType).toBe("local");
    expect(resolveMove("33130", "75204", 50)).toMatchObject({ moveType: "interstate", origin: { state: "FL" }, destination: { state: "TX" } });
    expect(resolveMove("33130", "99999", 50)).toBeNull();
  });
});

describe("states and counties", () => {
  it("lists the 50 states and DC with slugs and FIPS codes", () => {
    const states = statesList();
    expect(states).toHaveLength(51);
    expect(states.map((s) => s.code)).toContain("DC");
    expect(stateBySlug("new-york")).toMatchObject({ code: "NY", fips: "36" });
    expect(stateBySlug("district-of-columbia")?.code).toBe("DC");
  });

  it("lists counties by state, alphabetically", () => {
    const texas = countiesByState("tx");
    expect(texas.length).toBeGreaterThanOrEqual(250);
    expect(texas).toContainEqual({ fips: "48453", name: "Travis", state: "TX" });
    const names = texas.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(countiesByState("DC")).toEqual([{ fips: "11001", name: "District of Columbia", state: "DC" }]);
    expect(countiesByState("ZZ")).toEqual([]);
    expect(countyByFips("12087")).toEqual({ fips: "12087", name: "Monroe", state: "FL" });
  });
});

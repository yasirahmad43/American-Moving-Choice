import { describe, expect, it } from "vitest";
import { buildCityAttachments, type GeoCityCandidate } from "../src/seo/geo-zip-attachment";

const eastPeoria: GeoCityCandidate = { id: 99, state_code: "IL", slug: "east-peoria", name: "East Peoria", zips: ["61611", "61635"], place_geoid: "1722164" };
const peoria: GeoCityCandidate = { id: 1, state_code: "IL", slug: "peoria", name: "Peoria", zips: ["61635", "61641"], place_geoid: "1759000" };
const postalPlaces = { "61611": ["East Peoria", "IL"], "61635": ["East Peoria", "IL"], "61641": ["Peoria", "IL"] } as const;

describe("deterministic ZIP attachment", () => {
  it("assigns shared ZIP61635 to the GeoNames East Peoria place in either query order", () => {
    for (const cities of [[peoria, eastPeoria], [eastPeoria, peoria]]) {
      const { cityByZip } = buildCityAttachments(cities, postalPlaces);
      expect(cityByZip.get("61635")).toBe(eastPeoria.id);
      expect(cityByZip.get("61611")).toBe(eastPeoria.id);
      expect(cityByZip.get("61641")).toBe(peoria.id);
    }
  });

  it("does not let physical IDs decide ownership", () => {
    const cities = [{ ...eastPeoria, id: 1 }, { ...peoria, id: 99 }];
    expect(buildCityAttachments(cities.reverse(), postalPlaces).cityByZip.get("61635")).toBe(1);
  });

  it("prefers an exact postal place over an earlier semantic fallback", () => {
    const earlierFallback = { ...peoria, slug: "aaa-fallback", id: 7 };
    for (const cities of [[earlierFallback, eastPeoria], [eastPeoria, earlierFallback]]) {
      expect(buildCityAttachments(cities, postalPlaces).cityByZip.get("61635")).toBe(eastPeoria.id);
    }
  });

  it("uses the semantic city key when neither postal place name matches", () => {
    const otherPostalName = { "61635": ["Unincorporated place", "IL"] } as const;
    for (const cities of [[peoria, eastPeoria], [eastPeoria, peoria]]) {
      expect(buildCityAttachments(cities, otherPostalName).cityByZip.get("61635")).toBe(eastPeoria.id);
    }
  });

  it("rejects a same-name candidate in another state", () => {
    const wrongState = { ...eastPeoria, id: 7, state_code: "AL" };
    expect(buildCityAttachments([wrongState, peoria], postalPlaces).cityByZip.get("61635")).toBe(peoria.id);
    expect(buildCityAttachments([wrongState], postalPlaces).cityByZip.has("61635")).toBe(false);
  });

  it("also resolves duplicate Census-place fallback candidates in semantic order", () => {
    const alias = { ...eastPeoria, id: 8, slug: "zz-east-peoria-alias", zips: [] };
    for (const cities of [[alias, eastPeoria], [eastPeoria, alias]]) {
      expect(buildCityAttachments(cities, {}).cityByPlace.get("1722164")).toBe(eastPeoria.id);
    }
  });
});

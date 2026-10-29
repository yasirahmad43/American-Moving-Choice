import { describe, expect, it } from "vitest";
import { countyDisplayName, normalizeLegacyCityCountyLabels } from "../src/county-label";
import { CENSUS_CITY_LABEL_FIXTURES } from "./county-label-fixtures";

describe("verified Census city-equivalent display labels", () => {
  it.each(CENSUS_CITY_LABEL_FIXTURES)("uses the official NAME for FIPS %s", (fips, raw, officialName) => {
    expect(countyDisplayName(raw, fips)).toBe(officialName);
    const sentence = `${raw} County has dated records as of 2026-10-28.`;
    expect(normalizeLegacyCityCountyLabels(sentence)).toBe(`${officialName} has dated records as of 2026-10-28.`);
    expect(normalizeLegacyCityCountyLabels(normalizeLegacyCityCountyLabels(sentence))).toBe(normalizeLegacyCityCountyLabels(sentence));
  });

  it("does not append city twice to the verified Carson City name", () => {
    expect(countyDisplayName("Carson City (city)", "32510")).toBe("Carson City");
    expect(normalizeLegacyCityCountyLabels("Carson City (city) County, NV")).toBe("Carson City, NV");
  });

  it("retains normal and unknown county behavior without broadening other equivalent types", () => {
    for (const [name, fips] of [["Travis", "48453"], ["Charles City", "51036"], ["Richmond", "51159"], ["Suffolk", "36103"], ["Unverified (city)", "99999"]]) expect(countyDisplayName(name!, fips)).toBe(`${name} County`);
    expect(countyDisplayName("Travis", null)).toBe("Travis County");
    const ordinary = "Charles City County, Richmond County, Suffolk County, Unknown (city) County and a parish stay unchanged.";
    expect(normalizeLegacyCityCountyLabels(ordinary)).toBe(ordinary);
  });

  it("retains values and URL destinations while correcting known labels and link text", () => {
    const text = "[Colonial Heights (city County](/movers/virginia/colonial-heights/) has 18,210 residents and a $250 example dated 2026-10-28. https://example.test/Carson%20City%20(city)%20County?fips=32510";
    expect(normalizeLegacyCityCountyLabels(text)).toBe("[Colonial Heights city](/movers/virginia/colonial-heights/) has 18,210 residents and a $250 example dated 2026-10-28. https://example.test/Carson%20City%20(city)%20County?fips=32510");
  });
});

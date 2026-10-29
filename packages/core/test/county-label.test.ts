import { describe, expect, it } from "vitest";
import { countyDisplayName, normalizeLegacyCityCountyLabels, normalizeLegacyCountyEquivalentLabels } from "../src/county-label";
import { CENSUS_CITY_LABEL_FIXTURES, CENSUS_ADDITIONAL_LABEL_FIXTURES } from "./county-label-fixtures";

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

describe("verified current parish, Alaska and DC names", () => {
  it.each(CENSUS_ADDITIONAL_LABEL_FIXTURES)("uses exact current Census FIPS %s without changing identity", (fips, raw, officialName, state, requiresContext) => {
    expect(countyDisplayName(raw, fips)).toBe(officialName);
    const legacy = `${raw} County`;
    expect(normalizeLegacyCountyEquivalentLabels(legacy)).toBe(requiresContext ? legacy : officialName);
    expect(normalizeLegacyCountyEquivalentLabels(legacy, { stateCode: state })).toBe(officialName);
    expect(normalizeLegacyCountyEquivalentLabels(officialName, { stateCode: state })).toBe(officialName);
  });

  it("keeps legitimate Orleans/Franklin counties without reliable Louisiana context", () => {
    const names = "Orleans County, New York; Orleans County, Vermont; Franklin County, Tennessee; Allen County, Indiana.";
    expect(normalizeLegacyCountyEquivalentLabels(names)).toBe(names);
    expect(normalizeLegacyCountyEquivalentLabels(names, { stateCode: "NY" })).toBe(names);
    expect(normalizeLegacyCountyEquivalentLabels("Orleans County, Louisiana; Franklin County, LA")).toBe("Orleans Parish, Louisiana; Franklin Parish, LA");
    expect(normalizeLegacyCountyEquivalentLabels("orleans county, louisiana; franklin county, la")).toBe("Orleans Parish, louisiana; Franklin Parish, la");
    expect(normalizeLegacyCountyEquivalentLabels("Orleans County and Franklin County", { stateCode: "LA", legacyLabel: "Orleans County" })).toBe("Orleans Parish and Franklin County");
  });

  it("never reassigns the excluded retired source FIPS or unknown county type", () => {
    expect(countyDisplayName("Skagway-Hoonah-Angoon", "02232")).toBe("Skagway-Hoonah-Angoon County");
    expect(normalizeLegacyCountyEquivalentLabels("Skagway-Hoonah-Angoon County")).toBe("Skagway-Hoonah-Angoon County");
    expect(countyDisplayName("Unknown", "99999")).toBe("Unknown County");
  });

  it("preserves Louisiana link destinations, source amounts and dates", () => {
    const text = "[Orleans County](/movers/louisiana/new-orleans/) has a $1,100 example dated 2026-10-28; https://example.test/Orleans%20County?fips=22071";
    expect(normalizeLegacyCountyEquivalentLabels(text, { stateCode: "LA" })).toBe("[Orleans Parish](/movers/louisiana/new-orleans/) has a $1,100 example dated 2026-10-28; https://example.test/Orleans%20County?fips=22071");
  });
});

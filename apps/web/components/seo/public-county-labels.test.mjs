import { publicSeoPage } from "./public-content.ts";
import { CENSUS_CITY_LABEL_FIXTURES } from "../../../../packages/core/test/county-label-fixtures.ts";

function page(raw, fips) {
  const label = `${raw} County`;
  return { id: "saved-page-id", url: "/movers/virginia/colonial-heights/", slug: "colonial-heights", family: "city", countyFips: fips,
    title: `Moving in ${label}`, h1: "Movers in Colonial Heights, VA", metaDescription: `${label}: 18,210 residents, 8,126 housing units, as of 2026-10-28.`,
    canonicalUrl: "/movers/virginia/colonial-heights/", parentUrl: "/movers/virginia/", contentHash: "saved-content-hash", mediaIds: ["licensed-photo-id"],
    publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"), indexable: true,
    sources: [{ label: `${label} Census source`, url: "https://www.census.gov/", accessedOn: "2026-10-28" }],
    content: { intro: { answer: `${label} has 18,210 residents.`, dataPoints: [{ label: "County", value: label, basis: "GeoNames county label" }] },
      sections: [{ id: "geography", heading: "Geographic facts", blocks: [
        { type: "paragraph", text: `${label}: keep the $1,100 estimate and $400 later-billing example dated 2026-10-28.` },
        { type: "table", caption: "Dated geography", columns: ["County", "Population", "Price", "Reference"], rows: [[label, "18,210", "$250", "[Read the source](https://www.census.gov/)"]] },
      ] }], faq: [{ question: `What does ${label} mean here?`, answer: "A geographic label; route details are checked separately." }], related: [{ heading: "Continue", links: [{ label: "Virginia", href: "/movers/virginia/", relation: "parent" }] }], quote: {}, credits: ["GeoNames CC BY 4.0"], dataAsOf: "2026-10-28" },
  };
}

describe("known independent-city labels in saved public pages", () => {
  it.each(CENSUS_CITY_LABEL_FIXTURES)("repairs all reader contexts for verified FIPS %s", (fips, raw, display) => {
    const stored = page(raw, fips);
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(projected.title).toBe(`Moving in ${display}`);
    expect(projected.metaDescription).toBe(`${display}: 18,210 residents, 8,126 housing units, as of 2026-10-28.`);
    expect(projected.content.intro.answer).toBe(`${display} has 18,210 residents.`);
    expect(projected.content.intro.dataPoints[0].value).toBe(display);
    expect(projected.content.sections[0].blocks[0].text).toBe(`${display}: keep the $1,100 estimate and $400 later-billing example dated 2026-10-28.`);
    expect(projected.content.sections[0].blocks[1].rows).toEqual([[display, "18,210", "$250", "[Read the source](https://www.census.gov/)"]]);
    expect(projected.content.faq[0].question).toBe(`What does ${display} mean here?`);
    expect(projected.sources[0]).toEqual({ ...stored.sources[0], label: `${display} Census source` });
    for (const key of ["id", "url", "slug", "canonicalUrl", "parentUrl", "contentHash", "mediaIds", "countyFips", "publishedAt", "updatedAt", "indexable"]) expect(projected[key]).toEqual(stored[key]);
    expect(projected.content.sections[0].id).toBe("geography");
    expect(projected.content.sections[0].blocks[1].columns).toEqual(stored.content.sections[0].blocks[1].columns);
    expect(projected.content.related).toEqual(stored.content.related);
    expect(projected.content.credits).toEqual(stored.content.credits);
    expect(projected.content.dataAsOf).toBe(stored.content.dataAsOf);
    expect(JSON.stringify(stored)).toBe(before);
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("preserves identifiers and destinations even when they contain a known legacy display literal", () => {
    const stored = page("Colonial Heights (city", "51570");
    stored.id = "identifier-Colonial Heights (city County";
    stored.content.sections[0].id = "section-Colonial Heights (city County";
    stored.contentHash = "hash-Colonial Heights (city County";
    stored.mediaIds = ["asset-Colonial Heights (city County"];
    stored.sources[0].url = "https://example.test/?source=Colonial Heights (city County";
    const projected = publicSeoPage(stored);
    expect(projected.id).toBe(stored.id);
    expect(projected.content.sections[0].id).toBe(stored.content.sections[0].id);
    expect(projected.contentHash).toBe(stored.contentHash);
    expect(projected.mediaIds).toEqual(stored.mediaIds);
    expect(projected.sources[0].url).toBe(stored.sources[0].url);
  });

  it("redacts the original private-company identity before repairing its embedded county phrase", () => {
    const stored = page("Colonial Heights (city", "51570");
    const privateName = "Acme Colonial Heights (city County Moving";
    stored.content.sections[0].blocks.push({ type: "paragraph", text: `Contact ${privateName} about the request.` }, { type: "movers", items: [{ name: privateName }] });
    const projected = publicSeoPage(stored);
    const payload = JSON.stringify(projected);
    expect(payload).not.toContain(privateName);
    expect(payload).not.toContain("Acme Colonial Heights city Moving");
    expect(projected.content.sections[0].blocks.at(-1).text).toBe("Contact a participating moving company about the request.");
    expect(projected.content.intro.dataPoints[0].value).toBe("Colonial Heights city");
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("does not reinterpret ordinary counties, Charles City County or an unknown marker", () => {
    const stored = page("Travis", "48453");
    stored.content.intro.answer = "Charles City County, Richmond County, Suffolk County and Unknown (city) County stay unchanged. A parish is outside this correction.";
    expect(publicSeoPage(stored).content.intro.answer).toBe(stored.content.intro.answer);
  });
});

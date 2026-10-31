import { publicSeoPage } from "./public-content.ts";

function page({ family = "city", stateCode = "LA", county = "Orleans County", url = "/movers/louisiana/new-orleans/", sections = [] } = {}) {
  return { id: "saved-id", url, slug: "new-orleans", family, stateCode, h1: "Moving guide", title: "Moving guide", metaDescription: `${county}: dated local coverage.`,
    canonicalUrl: url, contentHash: "unchanged", publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"), indexable: true,
    sources: [{ label: "Census", url: "https://www.census.gov/", accessedOn: "2026-10-28" }],
    content: { intro: { answer: `Plan a move from ${county}; a $250 example is dated 2026-10-28.`, dataPoints: [{ label: "County", value: county, basis: "GeoNames" }, { label: "Time zone", value: "New York", basis: `${county} mapped time zone` }] }, sections, faq: [], related: [], quote: {}, credits: ["GeoNames CC BY 4.0"], dataAsOf: "2026-10-28" },
  };
}
const table = (columns, rows) => ({ type: "table", columns, rows });

function preserved(before, after) {
  for (const key of ["id", "url", "slug", "stateCode", "canonicalUrl", "contentHash", "publishedAt", "updatedAt", "indexable"]) expect(after[key]).toEqual(before[key]);
  expect(after.sources).toEqual(before.sources);
  expect(after.content.credits).toEqual(before.content.credits);
  expect(after.content.dataAsOf).toBe(before.content.dataAsOf);
  expect(publicSeoPage(after)).toEqual(after);
}

describe("Louisiana county labels require actual field or row context", () => {
  it("repairs the own county intro/meta/data and verified sections without altering unrelated prose", () => {
    const stored = page({ sections: [
      { id: "housing", heading: "Housing", blocks: [table(["Fact", "Value"], [["Orleans County population", "376,035"], ["Orleans County housing units", "194,758"]])] },
      { id: "zips", heading: "ZIP codes in Orleans County", blocks: [{ type: "paragraph", text: "No local rule names Orleans County as of 2026-10-28." }] },
      { id: "other", heading: "A separate example", blocks: [{ type: "paragraph", text: "Orleans County in Vermont and Franklin County in Tennessee retain their names." }] },
    ] });
    stored.content.faq = [{ question: "How many movers cover local moves in Orleans County?", answer: "None names Orleans County as of 2026-10-28." }];
    const frozen = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(projected.metaDescription).toBe("Orleans Parish: dated local coverage.");
    expect(projected.content.intro.answer).toBe("Plan a move from Orleans Parish; a $250 example is dated 2026-10-28.");
    expect(projected.content.intro.dataPoints[0].value).toBe("Orleans Parish");
    expect(projected.content.intro.dataPoints[1].basis).toBe("Orleans Parish mapped time zone");
    expect(projected.content.sections[0].blocks[0].rows).toEqual([["Orleans Parish population", "376,035"], ["Orleans Parish housing units", "194,758"]]);
    expect(projected.content.sections[1].blocks[0].text).toContain("Orleans Parish as of 2026-10-28");
    expect(projected.content.sections[2]).toEqual(stored.content.sections[2]);
    expect(projected.content.faq).toEqual([]);
    expect(JSON.stringify(stored)).toBe(frozen);
    preserved(stored, projected);
  });

  it.each(["NY", "VT", "TN"])("preserves ordinary Orleans and Franklin counties on a %s page", stateCode => {
    const stored = page({ stateCode, county: stateCode === "TN" ? "Franklin County" : "Orleans County", url: `/movers/${stateCode.toLowerCase()}/example/` });
    const projected = publicSeoPage(stored);
    expect(projected.metaDescription).toBe(stored.metaDescription);
    expect(projected.content.intro).toEqual(stored.content.intro);
    preserved(stored, projected);
  });

  it("uses each mixed-state row's State or City link instead of the page's Louisiana state", () => {
    const stored = page({ sections: [{ id: "mixed", heading: "Other locations", blocks: [
      table(["City", "County", "Price"], [["[New Orleans](/movers/louisiana/new-orleans/)", "Orleans County", "$250"], ["[Medina](/movers/new-york/medina/)", "Orleans County", "$300"], ["[Winchester](/movers/tennessee/winchester/)", "Franklin County", "$400"], ["No reliable link", "Franklin County", "$500"], ["Franklin, LA", "Franklin County", "$600"], ["Winchester, TN", "Franklin County", "$700"], ["Southaven, MS", "DeSoto County", "$800"]]),
      table(["Place", "State", "County"], [["Franklin", "LA", "Franklin County"], ["Winchester", "TN", "Franklin County"], ["Example", "NY", "Orleans County"]]),
    ] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].rows.map(row => row[1])).toEqual(["Orleans Parish", "Orleans County", "Franklin County", "Franklin County", "Franklin Parish", "Franklin County", "DeSoto County"]);
    expect(projected.content.sections[0].blocks[1].rows.map(row => row[2])).toEqual(["Franklin Parish", "Franklin County", "Orleans County"]);
    expect(projected.content.sections[0].blocks[0].rows.map(row => row[0])).toEqual(stored.content.sections[0].blocks[0].rows.map(row => row[0]));
    expect(projected.content.sections[0].blocks[0].rows.map(row => row[2])).toEqual(["$250", "$300", "$400", "$500", "$600", "$700", "$800"]);
    preserved(stored, projected);
  });

  it("uses the matching Page-row column for route end counties in either direction", () => {
    const stored = page({ family: "route", sections: [{ id: "facts", heading: "Both ends", blocks: [table(["Fact", "New Orleans", "Medina"], [["Page", "[New Orleans](/movers/louisiana/new-orleans/)", "[Medina](/movers/new-york/medina/)"], ["County", "Orleans County", "Orleans County"], ["Population", "376,035", "6,000"]])] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].rows[1]).toEqual(["County", "Orleans Parish", "Orleans County"]);
    expect(projected.content.intro).toEqual(stored.content.intro);
    expect(projected.metaDescription).toBe(stored.metaDescription);
    const reverse = page({ family: "route", stateCode: "NY", sections: [{ id: "facts", heading: "Both ends", blocks: [table(["Fact", "Medina", "New Orleans"], [["Page", "[Medina](/movers/new-york/medina/)", "[New Orleans](/movers/louisiana/new-orleans/)"], ["County", "Orleans County", "Orleans County"]])] }] });
    expect(publicSeoPage(reverse).content.sections[0].blocks[0].rows[1]).toEqual(["County", "Orleans County", "Orleans Parish"]);
    preserved(stored, projected);
  });

  it.each([
    ["/routes/gautier-ms-to-new-orleans-la/", "MS", "[Gautier](/movers/mississippi/gautier/)", "[New Orleans](/movers/louisiana/new-orleans/)", "Jackson County", "Orleans County", "Jackson County", "Orleans Parish"],
    ["/routes/bogalusa-la-to-memphis-tn/", "LA", "[Bogalusa](/movers/louisiana/bogalusa/)", "[Memphis](/movers/tennessee/memphis/)", "Washington County", "Shelby County", "Washington Parish", "Shelby County"],
  ])("preserves the actual mixed-state county distinction captured at %s", (url, stateCode, origin, destination, originCounty, destinationCounty, expectedOrigin, expectedDestination) => {
    const stored = page({ family: "route", stateCode, url, sections: [{ id: "facts", heading: "Both ends", blocks: [table(["Fact", "Origin", "Destination"], [["Page", origin, destination], ["County", originCounty, destinationCounty], ["Example", "$1,100", "2026-10-28"]])] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].rows).toEqual([["Page", origin, destination], ["County", expectedOrigin, expectedDestination], ["Example", "$1,100", "2026-10-28"]]);
    preserved(stored, projected);
  });

  it("uses the source's same-state nearby-ZIP section when rows have no city link", () => {
    const stored = page({ sections: [{ id: "nearby-zips", heading: "Neighboring ZIP codes", blocks: [table(["ZIP code", "County", "Population"], [["70112", "Orleans County", "1,000"], ["71295", "Franklin County", "2,000"]])] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].rows).toEqual([["70112", "Orleans Parish", "1,000"], ["71295", "Franklin Parish", "2,000"]]);
    preserved(stored, projected);
  });

  it("repairs LA state county/city tables and ZIP-local rows without touching identifiers", () => {
    const stored = page({ family: "state", sections: [{ id: "counties", heading: "Counties", blocks: [table(["County", "Population"], [["Orleans County", "376,035"], ["Franklin County", "19,000"]]), { type: "paragraph", text: "Movers name counties in their coverage rules; Orleans County and Franklin County are listed." }] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].rows).toEqual([["Orleans Parish", "376,035"], ["Franklin Parish", "19,000"]]);
    const zip = page({ family: "zip", sections: [{ id: "glance", heading: "ZIP at a glance", blocks: [table(["Fact", "Value"], [["County", "Orleans County (the page's main county is Jefferson Parish County)"], ["FIPS", "22071"]])] }] });
    expect(publicSeoPage(zip).content.sections[0].blocks[0].rows).toEqual([["County", "Orleans Parish (the page's main county is Jefferson Parish)"], ["FIPS", "22071"]]);
    preserved(stored, projected);
  });

  it("keeps private-company redaction ahead of the state-aware display pass", () => {
    const stored = page({ sections: [{ id: "movers", heading: "Coverage", blocks: [{ type: "paragraph", text: "Contact Acme Orleans County Moving about the route." }, { type: "movers", items: [{ name: "Acme Orleans County Moving" }] }] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].text).toBe("Contact a participating moving company about the route.");
    expect(JSON.stringify(projected)).not.toContain("Acme Orleans Parish Moving");
    preserved(stored, projected);
  });

  it("does not infer a primary county from a Louisiana page lacking its own County data point", () => {
    const stored = page();
    stored.content.intro.dataPoints = [];
    expect(publicSeoPage(stored).content.intro.answer).toBe(stored.content.intro.answer);
  });
});

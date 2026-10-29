// Regression coverage for already-published records created before the count-only quote flow.
// Run with the web content tests: vitest run --root apps/web --globals lib/content components/seo.
import { publicSeoPage } from "./public-content.ts";

const COMPANY = "O'Brien & Sons Moving";
const SLUG = "obrien-and-sons-moving";

function legacyPage() {
  return {
    id: "seo-page-1", url: "/movers/texas/austin/", slug: "austin", family: "city",
    stateCode: "TX", cityId: 1, zip: null, routeId: null,
    primaryKeyword: "Austin moving", supportingKeywords: [], intent: "commercial",
    parentUrl: "/movers/texas/", title: `${COMPANY} in Austin`, h1: `Austin: ${COMPANY}`,
    metaDescription: `Local coverage from ${COMPANY.toUpperCase()}.`, status: "published", indexable: true,
    content: {
      version: 1,
      intro: { answer: `Ask ${COMPANY} about your move.`, dataPoints: [{ label: "ZIP codes", value: "47", basis: "GeoNames" }] },
      sections: [
        { id: "coverage", heading: "Movers serving Austin", blocks: [
          { type: "paragraph", text: `Read [company profile](/companies/${SLUG}/?from=city) or https://example.test/companies/${SLUG}/reviews/.` },
          { type: "movers", paidLine: true, items: [{ slug: SLUG, name: COMPANY, basedIn: "Austin, Texas", coverageNote: "Travis County" }] },
        ] },
        { id: "planning", heading: "Plan the move", blocks: [{ type: "table", columns: ["Topic", "Value"], rows: [["Company", COMPANY.toLowerCase()], ["ZIP codes", "47"]] }] },
      ],
      faq: [{ question: "Which movers cover Austin?", answer: `${COMPANY} is available; the list above names them.` }],
      related: [{ heading: "Next steps", links: [{ href: `/companies/${SLUG}/`, label: COMPANY, relation: "coverage" }] }],
      quote: { entry: "household", originZip: "78704", heading: "See available movers", text: "See each mover by name and USDOT number before you send.", cta: "Request a quote from a company" },
      schemaType: "CollectionPage", credits: ["GeoNames, CC BY 4.0"], dataAsOf: "2026-10-28",
    },
    contentHash: "legacy-content-hash", uniqueShare: 0.7, evidenceCount: 3,
    sources: [{ label: `${COMPANY} details`, url: `/companies/${SLUG}/`, accessedOn: "2026-10-28" }],
    mediaIds: [], blockedReason: null, gateResults: {}, reviewedBy: null,
    lastReviewedAt: null, publishedAt: new Date("2026-10-27T12:00:00Z"), updatedAt: new Date("2026-10-28T12:00:00Z"),
    canonicalUrl: "/movers/texas/austin/",
  };
}

describe("public SEO projection", () => {
  it("removes legacy company identities from the body, metadata fields, linked props and sources", () => {
    const projected = publicSeoPage(legacyPage());
    const payload = JSON.stringify(projected);
    expect(payload.toLowerCase()).not.toContain(COMPANY.toLowerCase());
    expect(payload).not.toContain(SLUG);
    expect(payload).not.toMatch(/\/(?:companies|directory)\//);
    expect(projected.content.sections.flatMap((section) => section.blocks).some((block) => block.type === "movers")).toBe(false);
    expect(projected.content.faq[0].answer).toContain("Companies introduce themselves");
    expect(projected.content.quote.text).toContain("maximum number");
    expect(projected.content.quote.text).not.toMatch(/by name|USDOT/);
  });

  it("preserves page-specific facts, route prefill, licensing and dates without mutating the stored record", () => {
    const stored = legacyPage();
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(JSON.stringify(stored)).toBe(before);
    expect(projected.content.intro.dataPoints).toEqual(stored.content.intro.dataPoints);
    expect(projected.content.quote.originZip).toBe("78704");
    expect(projected.content.credits).toEqual(["GeoNames, CC BY 4.0"]);
    expect(projected.updatedAt).toBeInstanceOf(Date);
    expect(projected.updatedAt.toISOString()).toBe("2026-10-28T12:00:00.000Z");
    expect(projected.publishedAt.toISOString()).toBe("2026-10-27T12:00:00.000Z");
  });

  it("replaces retired directory links even when a page has no mover blocks", () => {
    const stored = legacyPage();
    stored.content.sections = [{ id: "coverage", heading: "Check coverage", blocks: [{ type: "paragraph", text: "[Browse companies](https://example.test/directory/?sort=name) or /directory/page/2/." }] }];
    const projected = publicSeoPage(stored);
    expect(projected.content.sections[0].blocks[0].text).toBe("[Request moving quotes](/get-quotes/) or /get-quotes/");
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("replaces obsolete funding copy while preserving historical records and moving price facts", () => {
    const stored = legacyPage();
    stored.metaDescription = "Plan your move. Movers pay us for requests.";
    stored.content.intro.answer = "Movers pay us for requests.";
    stored.content.sections = [{ id: "payment", heading: "What never changes with payment", blocks: [
      { type: "paragraph", text: "What a mover pays never changes its screening result, its ratings, how its reviews are shown, or where it appears on this site. [How AMC makes money](/advertising-disclosure/) has the full statement; [How we verify movers](/how-we-verify-movers/) lists the checks every mover passes." },
      { type: "table", columns: ["Service", "Rate"], rows: [["Hourly moving crew", "$180 per hour"], ["Deposit", "Ask your mover what you pay before booking"]] },
    ] }];
    stored.content.related = [{ heading: "Helpful pages", links: [{ href: "/advertising-disclosure/", label: "How AMC makes money", relation: "planning" }, { href: "/how-we-verify-movers/", label: "How we verify movers", relation: "planning" }] }];
    stored.sources = [{ label: "How AMC makes money", url: "/advertising-disclosure/", accessedOn: "2026-10-28" }, { label: "Census", url: "https://www.census.gov/", accessedOn: "2026-10-28" }];
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(JSON.stringify(stored)).toBe(before);
    expect(JSON.stringify(projected)).not.toMatch(/pay us|makes money|advertising-disclosure|what a mover pays/i);
    expect(projected.content.sections[0].id).toBe("payment");
    expect(projected.content.sections[0].heading).toBe("Your moving company. Your choice.");
    expect(projected.content.sections[0].blocks[0].text).toContain("screening checks");
    expect(projected.content.sections[0].blocks[1]).toEqual(stored.content.sections[0].blocks[1]);
    expect(projected.sources).toEqual([stored.sources[1]]);
    expect(projected.content.related[0].links.map((link) => link.href)).toEqual(["/how-we-verify-movers/"]);
  });

  it("does not present a state's population-eligible city count as published guide availability", () => {
    const stored = legacyPage();
    stored.family = "state";
    stored.metaDescription = "Texas: 218 city pages, cost factors and sourced facts.";
    stored.content.intro.answer = "Texas has 254 counties, and 218 cities of 10,000 people or more have their own pages.";
    stored.content.sections = [{ id: "cities", heading: "Cities in Texas with their own pages", blocks: [
      { type: "paragraph", text: "218 cities in Texas have 10,000 residents or more and their own page; the 20 largest are listed here. Houston has 178 ZIP codes." },
      { type: "table", columns: ["City", "Population"], rows: [["Houston", "2,300,419"], ["Austin", "967,862"]] },
    ] }];
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(JSON.stringify(stored)).toBe(before);
    expect(projected.content.intro.answer).toBe("Texas has 254 counties, and 218 cities have 10,000 residents or more.");
    expect(projected.content.sections[0].heading).toBe("Cities in Texas by population");
    expect(projected.content.sections[0].blocks[0].text).toBe("218 cities in Texas have 10,000 residents or more; the 20 largest are listed here. Houston has 178 ZIP codes.");
    expect(projected.content.sections[0].blocks[1]).toEqual(stored.content.sections[0].blocks[1]);
    expect(projected.metaDescription).toBe("Texas: 218 city records, cost factors and sourced facts.");
    expect(projected.content.intro.dataPoints).toEqual(stored.content.intro.dataPoints);
    const city = { ...stored, family: "city" };
    expect(publicSeoPage(city).content.intro.answer).toBe(stored.content.intro.answer);
  });

  it("uses a grammatical coverage heading for any city name without changing its data", () => {
    const stored = legacyPage();
    stored.content.sections.push({ id: "request", heading: "Coverage for a Austin request", blocks: [{ type: "table", columns: ["Coverage", "Count"], rows: [["Interstate", "2"]] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections.at(-1).heading).toBe("Moving coverage in Austin");
    expect(projected.content.sections.at(-1).blocks).toEqual(stored.content.sections.at(-1).blocks);
    expect(stored.content.sections.at(-1).heading).toBe("Coverage for a Austin request");
  });
});

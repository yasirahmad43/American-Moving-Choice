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
  it("suppresses saved seed rates across structured blocks, metadata and summaries while preserving sourced money facts", () => {
    const stored=legacyPage();
    stored.title="Movers in Austin, TX: compare screened moving companies";
    stored.h1=stored.title;
    stored.metaDescription="Austin movers screened on their FMCSA record: 5 movers' active rate cards support a local range from $9,999 to $10,999.";
    stored.content.intro.answer="Austin is in Travis County. A local move ranges from $9,999 to $10,999 across 5 movers' rate cards.";
    stored.content.intro.dataPoints.push({label:"Active rate cards",value:"5",basis:"rate_cards"},{label:"Historical rent",value:"$900 to $1,100",basis:"2019–2023 ACS Census estimates"});
    stored.content.sections=[
      {id:"costs",heading:"Moving price ranges",blocks:[
        {type:"cost",block:{scope:"a Texas local move",moveType:"local",band:null,rows:[{homeSize:"2 bedrooms",low:"$9,999",high:"$10,999",movers:5,typical:"3 movers, 5.5 hours"}],asOf:"2026-03-27",modelVersion:"cost-model-v1"}},
        {type:"paragraph",text:"The typical 2-bedroom job is 3 movers, 5.5 hours from five movers' cards."},
      ]},
      {id:"housing",heading:"Historical Census housing costs",blocks:[{type:"table",caption:"2019–2023 ACS estimates",columns:["Measure","Range"],rows:[["Median gross rent","$900 to $1,100"]]}]},
      {id:"law",heading:"Interstate arbitration",blocks:[{type:"facts",items:[{claim:"The arbitration rule distinguishes claims of $10,000 or less from larger claims.",source:{label:"49 CFR 375.211",url:"https://www.ecfr.gov/current/title-49/section-375.211",accessedOn:"2026-10-29"}}]}]},
    ];
    const before=JSON.stringify(stored);
    const projected=publicSeoPage(stored);
    const payload=JSON.stringify(projected);
    expect(JSON.stringify(stored)).toBe(before);
    expect(payload).not.toMatch(/9,999|10,999|5\.5 hours|cost-model-v1|rate_cards|active rate cards/iu);
    expect(projected.h1).toBe("Movers in Austin, TX");
    expect(projected.metaDescription).not.toMatch(/screened|5 movers/iu);
    expect(projected.content.sections.flatMap(section=>section.blocks).some(block=>block.type==="cost")).toBe(false);
    expect(payload).toContain("$900 to $1,100");
    expect(payload).toContain("$10,000 or less");
    expect(projected.content.intro.dataPoints.find(point=>point.label==="Historical rent").value).toBe("$900 to $1,100");
    expect(publicSeoPage(projected)).toEqual(projected);
  });

  it("removes legacy company identities from the body, metadata fields, linked props and sources", () => {
    const projected = publicSeoPage(legacyPage());
    const payload = JSON.stringify(projected);
    expect(payload.toLowerCase()).not.toContain(COMPANY.toLowerCase());
    expect(payload).not.toContain(SLUG);
    expect(payload).not.toMatch(/\/(?:companies|directory)\//);
    expect(projected.content.sections.flatMap((section) => section.blocks).some((block) => block.type === "movers")).toBe(false);
    expect(projected.content.faq).toEqual([]);
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

  it("replaces obsolete funding copy and withholds prices that have no approved rate provenance", () => {
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
    expect(projected.content.sections[0].blocks[0].text).toContain("maximum number of companies");
    expect(projected.content.sections[0].blocks[0].text).not.toContain("screening checks");
    expect(projected.content.sections[0].blocks[1].rows).toEqual([["Deposit", "Ask your mover what you pay before booking"]]);
    expect(JSON.stringify(projected)).not.toContain("$180");
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

  it("omits company-count-only sections without changing the stored record", () => {
    const stored = legacyPage();
    stored.content.sections.push({ id: "request", heading: "Coverage for a Austin request", blocks: [{ type: "table", columns: ["Coverage", "Count"], rows: [["Interstate", "2"]] }] });
    const projected = publicSeoPage(stored);
    expect(projected.content.sections.find(section=>section.id==="request")).toBeUndefined();
    expect(stored.content.sections.at(-1).heading).toBe("Coverage for a Austin request");
  });

  it("projects saved request-sales and retired business links into consumer-only guidance", () => {
    const stored = legacyPage();
    stored.content.sections = [{ id: "choices", heading: "How matching works", blocks: [
      { type: "paragraph", text: "Only eligible movers recorded for your request may purchase it, within the contact limit and channels you choose. Companies identify themselves during contact." },
      { type: "list", ordered: true, items: ["Only eligible companies recorded for your request may purchase it. They introduce themselves when they contact you directly."] },
      { type: "paragraph", text: "A company with broker authority on its record cannot buy requests here." },
      { type: "paragraph", text: "[How AMC makes money](/advertising-disclosure/) explains our paid relationship with movers." },
      { type: "table", columns: ["Service", "Price"], rows: [["Packing boxes", "You may buy boxes for $80"], ["Insurance", "You may purchase separate insurance"]] },
    ] }];
    stored.content.faq = [{ question: "Who can receive my details?", answer: "Only eligible movers recorded for your request that complete a purchase, never more than the maximum you choose and only through your permitted contact channels. Company names are introduced during contact." }];
    stored.content.related = [{ heading: "Next", links: [
      { href: "/for-movers/pricing/", label: "Lead pricing", relation: "planning" },
      { href: "/mover-terms/", label: "Mover terms", relation: "planning" },
      { href: "/planning/", label: "Plan your move", relation: "planning" },
    ] }];
    stored.sources = [{ label: "How requests are bought", url: "/for-movers/moving-leads/", accessedOn: "2026-10-28" }];
    const before = JSON.stringify(stored);
    const projected = publicSeoPage(stored);
    expect(JSON.stringify(stored)).toBe(before);
    expect(JSON.stringify(projected)).not.toMatch(/may purchase it|complete a purchase|buy requests|paid relationship|lead pricing|for-movers|mover-terms/i);
    expect(projected.content.sections[0].blocks[0].text).toContain("Companies identify themselves during contact");
    expect(projected.content.sections[0].blocks.find(block=>block.type==="table")).toEqual(stored.content.sections[0].blocks[4]);
    expect(projected.content.related[0].links.map(link => link.href)).toEqual(["/planning/"]);
    expect(projected.sources).toEqual([]);
    expect(projected.content.quote.text).toContain("Companies introduce themselves");
  });
});

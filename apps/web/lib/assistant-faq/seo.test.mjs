import { CATALOG } from "../../../../packages/server/src/seo/catalog.ts";
import { publicSeoPage } from "../../components/seo/public-content.ts";
import { seoAssistantFaq } from "./seo.ts";
import { assertAssistantFaq, assistantFaqLd, faqWordCount } from "./types.ts";

const quote = { entry: "household", heading: "Request moving quotes", text: "Tell us about your move and choose the maximum number of participating companies that may contact you. Companies introduce themselves when they reach out.", cta: "Get moving quotes" };
function page(overrides = {}) {
  return {
    id: "faq-test", url: "/movers/texas/austin/", slug: "austin", family: "city", stateCode: "TX", zip: null,
    cityId: 1, routeId: null, primaryKeyword: "Austin movers", supportingKeywords: [], intent: "commercial", parentUrl: "/movers/texas/",
    title: "Movers in Austin, TX", h1: "Movers in Austin, TX: compare screened moving companies", metaDescription: "Austin moving guidance.",
    status: "published", indexable: true, canonicalUrl: "/movers/texas/austin/", contentHash: "fixture", uniqueShare: 0.8, evidenceCount: 5,
    sources: [], mediaIds: [], blockedReason: null, gateResults: {}, reviewedBy: null, lastReviewedAt: null, publishedAt: null, updatedAt: new Date("2026-10-30"),
    content: { version: 1, intro: { answer: "Austin is in Travis County, Texas. Its guide records postal, housing and geographic information for planning a household move.", dataPoints: [
      { label: "County", value: "Travis County", basis: "GeoNames postal and county codes, built 2026-10-28" },
      { label: "ZIP codes", value: "47", basis: "GeoNames postal codes (CC BY 4.0), built 2026-10-28" },
      { label: "Population", value: "961,855", basis: "2024 ACS 5-year Census data" },
    ] }, sections: [
      { id: "glance", heading: "Austin at a glance", blocks: [{ type: "paragraph", text: "Austin is in Travis County, Texas. The guide includes 47 postal ZIP codes and a population figure of 961,855 from the cited Census dataset." }] },
      { id: "nearby", heading: "Nearby places around Austin", blocks: [{ type: "paragraph", text: "Round Rock is one of the nearby places listed in this guide. Compare the named locations and their postal information before entering your actual route." }] },
      { id: "rules", heading: "What to check about address access", blocks: [{ type: "paragraph", text: "Check stairs, elevators, parking and the distance between the door and the truck. Ask the moving company to include the services you agree upon in its written estimate." }] },
      { id: "costs", heading: "Austin moving cost information", blocks: [{ type: "cost", block: { scope: "a local move within Texas, not an Austin-only sample", moveType: "local", band: null, rows: [{ homeSize: "2-bedroom home", low: "$480", high: "$700", movers: 5, typical: "crew and truck" }], asOf: "2026-10-30", modelVersion: "cost-model-v1" } }] },
    ], faq: [], related: [], quote, schemaType: "CollectionPage", credits: [], dataAsOf: "2026-10-30" },
    ...overrides,
  };
}

describe("source-bound assistant FAQs for SEO pages", () => {
  it("creates five Austin-specific questions without inventing business credentials", () => {
    const fixture=page();
    fixture.content.sections.unshift({id:"routes",heading:"Destinations from Austin",blocks:[{type:"paragraph",text:"The five largest destinations are listed first. Fewer than five state rate cards are available for some routes."}]});
    const source = publicSeoPage(fixture);
    const before = JSON.stringify(source);
    const items = seoAssistantFaq(source);
    assertAssistantFaq(items);
    expect(items).toHaveLength(5);
    expect(items.every(item => item.question.includes("Austin"))).toBe(true);
    expect(items.every(item => item.answer.includes("American Moving Choice"))).toBe(true);
    expect(JSON.stringify(items)).not.toMatch(/licensed|certified|years of experience|guarantee/iu);
    expect(JSON.stringify(source)).toBe(before);
    const cost = items.find(item => /cost to hire/iu.test(item.question));
    expect(cost.answer).toContain("$480 to $700");
    expect(cost.answer).toContain("Texas, not an Austin-only sample");
    expect(cost.answer).toContain("planning range, not a moving quote");
    expect(cost.answer).not.toContain("largest destinations");
    expect(items[0].answer).not.toMatch(/ZIP codes|Population:/iu);
    expect(items[2].answer).toContain("Travis County");
    expect(items[2].answer).toContain("47");
  });

  it("keeps route direction and centroid qualification while excluding modelled road/day promises", () => {
    const source = page();
    source.family = "route"; source.h1 = "Moving from Albany, NY to Boston, MA"; source.slug = "albany-ny-to-boston-ma";
    source.content.intro.dataPoints = [
      { label: "Straight-line distance", value: "139.8 mi", basis: "Haversine between city centroids" },
      { label: "Driving days", value: "2 days", basis: "Estimated road miles at 500 miles per day" },
    ];
    source.content.sections.unshift({ id: "geography", heading: "Albany to Boston distance", blocks: [{ type: "paragraph", text: "Albany, NY to Boston, MA measures 139.8 miles between city centroids. That is a straight-line geographic measure. It is not an address-to-address route." }] });
    const items = seoAssistantFaq(publicSeoPage(source));
    expect(items.every(item => item.question.includes("Albany, NY") && item.question.includes("Boston, MA"))).toBe(true);
    const distance = items.find(item => /How far/iu.test(item.question));
    expect(distance.answer).toContain("139.8");
    expect(distance.answer).toContain("centroids");
    expect(JSON.stringify(items)).not.toMatch(/2 days|500 miles/iu);
  });

  it("uses the real ZIP and locations and does not turn coverage counts into a recommendation", () => {
    const source = page({ family: "zip", zip: "78704", slug: "78704", h1: "Movers in ZIP code 78704, Austin, TX" });
    source.content.intro.dataPoints.push({ label: "Eligible movers", value: "99", basis: "Coverage rules" });
    source.content.sections.push({ id: "movers", heading: "Network movers", blocks: [{ type: "paragraph", text: "99 eligible movers in our network can receive this request." }] });
    const items = seoAssistantFaq(publicSeoPage(source));
    expect(items.every(item => item.question.includes("78704"))).toBe(true);
    expect(JSON.stringify(items)).not.toMatch(/99|eligible|network|matching/iu);
  });

  it("does not fabricate a price when a state guide has no published range", () => {
    const source = page({ family: "state", slug: "alaska", h1: "Moving companies in Alaska" });
    source.content.sections = source.content.sections.filter(section => section.id !== "costs");
    const items = seoAssistantFaq(publicSeoPage(source));
    const cost = items.find(item => /cost to hire/iu.test(item.question));
    expect(cost.answer).toContain("No moving-price range is published in this guide");
    expect(cost.answer).not.toContain("$");
    expect(items.every(item => item.question.includes("Alaska"))).toBe(true);
  });

  it("separates cost pages from service slugs and retains numeric USD bands and working-time scope", () => {
    const source = page({ family: "cost", slug: "texas", h1: "Moving costs in Texas" });
    const local=source.content.sections.find(section=>section.id === "costs").blocks[0].block;
    local.rows[0].low="1000";local.rows[0].high="1100";
    const inland={...local,moveType:"intrastate",scope:"an in-state long-distance move in Texas of about 186 miles (Houston to San Antonio) (up to 250 miles)",rows:[{...local.rows[0],low:"3000",high:"3200"}]};
    const across={...local,moveType:"interstate",scope:"an interstate move from Texas of about 298 miles (to Oklahoma) (250 to 500 miles)",rows:[{...local.rows[0],low:"3600",high:"3900"}]};
    source.content.sections.push({id:"ranges",heading:"Texas ranges",blocks:[{type:"cost",block:inland},{type:"cost",block:across}]});
    source.content.sections.push({id:"summary",heading:"Texas planning jobs",blocks:[{type:"paragraph",text:"The typical job is the median crew and hours stated for the home size. A two-bedroom local planning example uses a crew of three movers for five and a half hours; it is an example rather than a delivery or completion promise."}]});
    const items=seoAssistantFaq(publicSeoPage(source));
    expect(items).toHaveLength(4);
    expect(items[0].answer).toContain("$1,000 to $1,100");
    expect(items[1].question).toContain("Houston to San Antonio");
    expect(items[2].answer).toContain("250 to 500 miles");
    expect(items[2].answer).toContain("$3,600 to $3,900");
    expect(items[2].answer).not.toMatch(/driving days/iu);
    expect(items[3].question).toMatch(/planning example/iu);
  });

  it("keeps the verified BLS subgroup separate from AMC wages and rejects archived channel choices", () => {
    for (const slug of ["how-much-do-movers-make-per-hour","how-does-american-moving-choice-work","which-companies-receive-my-moving-request"]) {
      const entry=CATALOG.find(item=>item.slug===slug);
      const source=page({family:entry.family,slug,h1:entry.h1,primaryKeyword:entry.primaryKeyword});
      source.content={...source.content,intro:{answer:entry.answer,dataPoints:[]},sections:entry.sections.map((section,index)=>({...section,id:`s${index}`})),faq:entry.faq};
      const items=seoAssistantFaq(publicSeoPage(source));
      expect(JSON.stringify(items)).not.toMatch(/choose[^.]*channels|channels they may use|bought|purchase/iu);
      if(slug==="how-much-do-movers-make-per-hour") {
        expect(items[0].answer).toContain("SOC 53-7062");
        expect(items[0].answer).toContain("May 2025");
        expect(items[0].answer).toContain("$40,240");
        expect(items[0].answer).toContain("not a moving-service quote");
      }
    }
  });

  it("keeps source answers coherent and preserves the scope of weighing and arbitration rules", () => {
    const rendered = new Map();
    for (const slug of ["can-i-watch-my-shipment-being-weighed", "moving-arbitration-file-preparation-checklist", "how-does-american-moving-choice-work", "how-do-i-pack-a-flat-screen-tv-for-a-move", "what-is-a-moving-delivery-spread"]) {
      const entry = CATALOG.find(item => item.slug === slug);
      const source = page({ family: entry.family, slug, h1: entry.h1, primaryKeyword: entry.primaryKeyword, sources: entry.sources ?? [] });
      source.content = { ...source.content, intro: { answer: entry.answer, dataPoints: [] }, sections: entry.sections.map((section, index) => ({ ...section, id: `s${index}` })), faq: entry.faq };
      rendered.set(slug, seoAssistantFaq(publicSeoPage(source)));
    }
    const weighing = rendered.get("can-i-watch-my-shipment-being-weighed");
    expect(weighing[1].answer).toMatch(/interstate/iu);
    expect(weighing[2].answer).toMatch(/weight ticket/iu);
    expect(weighing[2].answer).not.toMatch(/\. No\.|binding estimate doesn't depend/iu);
    expect(rendered.get("moving-arbitration-file-preparation-checklist")[3].answer).toMatch(/interstate/iu);
    const recipient = rendered.get("how-does-american-moving-choice-work")[3].answer;
    expect(recipient.match(/introduces? (?:itself|themselves)/giu)).toHaveLength(1);
    expect(rendered.get("how-do-i-pack-a-flat-screen-tv-for-a-move")[2].answer).not.toMatch(/\. Only when/iu);
    expect(new Set(rendered.get("what-is-a-moving-delivery-spread").map(item => item.answer)).size).toBe(4);
  });

  it("covers every authored service, question and checklist with source-bound plain answers", () => {
    const failures = [];
    for (const entry of CATALOG) {
      const source = page({ family: entry.family, slug: entry.slug, h1: entry.h1, primaryKeyword: entry.primaryKeyword, sources: entry.sources ?? [] });
      source.content = { ...source.content, intro: { answer: entry.answer, dataPoints: [] }, sections: entry.sections.map((section, i) => ({ ...section, id: `s${i + 1}` })), faq: entry.faq };
      let items;
      try { items = seoAssistantFaq(publicSeoPage(source)); } catch (error) { failures.push(`${entry.slug}: ${error.message}`); continue; }
      expect(items.length, entry.slug).toBeGreaterThanOrEqual(4);
      expect(items.length, entry.slug).toBeLessThanOrEqual(5);
      for (const item of items) {
        expect(faqWordCount(item.answer), entry.slug).toBeGreaterThanOrEqual(40);
        expect(faqWordCount(item.answer), entry.slug).toBeLessThanOrEqual(80);
        expect(item.answer, entry.slug).toContain("American Moving Choice");
      }
      const ld = assistantFaqLd("https://example.test", source.url, items);
      expect(ld.mainEntity.map(item => [item.name, item.acceptedAnswer.text])).toEqual(items.map(item => [item.question, item.answer]));
    }
    expect(failures).toEqual([]);
  });
});

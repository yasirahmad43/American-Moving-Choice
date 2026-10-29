import { describe, expect, it } from "vitest";
import { CATALOG, PLANNING, type CatalogEntry } from "../src/seo/catalog";
import { NATIONAL_FACTS } from "../src/seo/facts";
import { PLANNING_EXPANSION, PLANNING_EXPANSION_BRIEFS } from "../src/seo/planning-expansion-catalog";
import { PLANNING_EXPANSION_SOURCES } from "../src/seo/planning-expansion-sources";
import { mainText, shingles, uniqueShares } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";

function content(entry: CatalogEntry, addRegistryFacts = false): SeoContent {
  const facts = NATIONAL_FACTS.filter(fact => entry.factTopics.includes(fact.topic));
  return {
    version: 1,
    intro: { answer: entry.answer, dataPoints: [] },
    sections: entry.sections.map((section, index) => ({ ...section, id: `s${index}` })).concat(addRegistryFacts && facts.length ? [{ id: "facts", heading: "The rules behind this answer", blocks: [{ type: "facts", items: facts.map(fact => ({ claim: fact.claim, source: { label: fact.sourceLabel, url: fact.sourceUrl, accessedOn: fact.accessedOn } })) }] }] : []),
    faq: entry.faq,
    related: [],
    quote: { entry: "household", heading: "Request moving quotes", text: "Check coverage for your move", cta: "Start a quote request" },
    schemaType: "Article",
    credits: [],
    dataAsOf: "2026-10-29",
  };
}

describe("first substantive planning expansion", () => {
  it("adds twenty distinct tasks without recycling original slugs or primary keywords", () => {
    expect(PLANNING_EXPANSION).toHaveLength(20);
    const expansionSlugs = new Set(PLANNING_EXPANSION.map(entry => entry.slug));
    expect(expansionSlugs.size).toBe(20);
    // PLANNING may include the appended expansion after coordinator integration.
    const originals = PLANNING.filter(entry => !expansionSlugs.has(entry.slug));
    const originalSlugs = new Set(originals.map(entry => entry.slug));
    const originalKeywords = new Set(originals.map(entry => entry.primaryKeyword.toLowerCase()));
    for (const entry of PLANNING_EXPANSION) {
      expect(entry.family).toBe("planning");
      expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(originalSlugs.has(entry.slug)).toBe(false);
      expect(originalKeywords.has(entry.primaryKeyword.toLowerCase())).toBe(false);
    }
  });

  it("has substantial authored content before the generator appends registry facts", () => {
    for (const entry of PLANNING_EXPANSION) {
      const authored = content(entry);
      authored.sections = authored.sections.map(section => ({ ...section, blocks: section.blocks.filter(block => block.type !== "facts") }));
      const words = mainText(authored).split(/\s+/).filter(Boolean).length;
      expect(words, `${entry.slug}: authored words`).toBeGreaterThanOrEqual(350);
    }
    for (const brief of PLANNING_EXPANSION_BRIEFS) {
      expect(brief.steps.length).toBeGreaterThanOrEqual(12);
      expect(brief.steps.length).toBeLessThanOrEqual(20);
      expect(new Set(brief.steps).size).toBe(brief.steps.length);
      expect(brief.prerequisites).toHaveLength(3);
      expect(brief.steps.every(step => step.split(/\s+/).length >= 10)).toBe(true);
      expect(brief.completion.split(/\s+/).length).toBeGreaterThanOrEqual(40);
    }
  });

  it("keeps the existing forty-percent shingle standard even with shared regulatory facts", () => {
    const corpus = new Map<string, Set<string>>();
    for (const entry of [...PLANNING, ...PLANNING_EXPANSION]) corpus.set(entry.slug, shingles(mainText(content(entry, true))));
    const shares = uniqueShares(corpus);
    for (const entry of PLANNING_EXPANSION) expect(shares.get(entry.slug), entry.slug).toBeGreaterThanOrEqual(0.4);
  });

  it("binds every visible new claim to a dated primary reference and valid existing fact topics", () => {
    const topics = new Set(NATIONAL_FACTS.map(fact => fact.topic));
    for (const brief of PLANNING_EXPANSION_BRIEFS) {
      expect(topics.size).toBeGreaterThan(0);
      expect(brief.factTopics.length).toBeGreaterThan(0);
      expect(brief.factTopics.every(topic => topics.has(topic))).toBe(true);
      const source = PLANNING_EXPANSION_SOURCES[brief.source];
      expect(source.accessedOn).toBe("2026-10-29");
      expect(new URL(source.url).hostname).toMatch(/^(?:www\.)?(?:ecfr\.gov|fmcsa\.dot\.gov)$/);
      const entry = PLANNING_EXPANSION.find(entry => entry.slug === brief.slug)!;
      const sourceBlocks = entry.sections.flatMap(section => section.blocks).filter(block => block.type === "facts");
      expect(sourceBlocks).toHaveLength(1);
      expect(sourceBlocks[0]?.items[0]).toEqual({ claim: brief.sourcedClaim, source });
    }
  });

  it("resolves related task links within the original catalog or this expansion", () => {
    const targets = new Set([...CATALOG, ...PLANNING_EXPANSION].map(entry => `${entry.family}:${entry.slug}`));
    for (const entry of PLANNING_EXPANSION) for (const reference of entry.related) expect(targets.has(reference), `${entry.slug} -> ${reference}`).toBe(true);
  });

  it("preserves the consequential distinctions between payment, claims and complaints", () => {
    const text = (slug: string) => mainText(content(PLANNING_EXPANSION.find(entry => entry.slug === slug)!));
    expect(text("nonbinding-estimate-delivery-payment-checklist")).toContain("impracticable-operations");
    expect(text("nonbinding-estimate-delivery-payment-checklist")).toContain("only part of the shipment");
    expect(text("bill-of-lading-document-review-checklist")).toContain("entirely blank document");
    expect(text("shipment-weighing-record-checklist")).toContain("before unloading actually begins");
    expect(text("moving-damage-claim-evidence-checklist")).toContain("specified or determinable monetary amount");
    expect(text("delivery-missing-box-reconciliation-checklist")).toContain("notations that stand alone");
    expect(text("federal-moving-complaint-fact-record-checklist")).toContain("separate timely claim");
    const all = PLANNING_EXPANSION.map(entry => mainText(content(entry))).join("\n");
    expect(all).not.toMatch(/movers pay us|we get paid|guaranteed recovery|\/companies\/|\/directory\//i);
  });
});

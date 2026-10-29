import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../src/seo/catalog";
import { NATIONAL_FACTS } from "../src/seo/facts";
import { QUESTION_EXPANSION_CATALOG, QUESTION_EXPANSION_SOURCES } from "../src/seo/question-expansion-catalog";
import { mainText, shingles, uniqueShares } from "../src/seo/text";
import { normalizeKeyword } from "../src/seo/slugs";
import type { CatalogEntry } from "../src/seo/catalog";
import type { SeoContent } from "../src/seo/types";

function editorialContent(entry: CatalogEntry, withFacts = false): SeoContent {
  const facts = NATIONAL_FACTS.filter(fact => entry.factTopics.includes(fact.topic));
  return {
    version: 1,
    intro: { answer: entry.answer, dataPoints: [] },
    sections: [
      ...entry.sections.map((section, index) => ({ id: `s${index + 1}`, ...section })),
      ...(withFacts ? [{ id: "facts", heading: "The rules behind this answer", blocks: [{ type: "facts" as const, items: facts.map(fact => ({ claim: fact.claim, source: { label: fact.sourceLabel, url: fact.sourceUrl, accessedOn: fact.accessedOn } })) }] }] : []),
    ],
    faq: entry.faq,
    related: [], quote: { entry: "household", heading: "Request moving quotes", text: "", cta: "Start" },
    schemaType: "Article", credits: [], dataAsOf: "2026-10-29",
  };
}

describe("sourced, distinct first moving-question batch", () => {
  it("adds twenty distinct intents without replacing the authored question catalog", () => {
    expect(QUESTION_EXPANSION_CATALOG).toHaveLength(20);
    expect(new Set(QUESTION_EXPANSION_CATALOG.map(entry => entry.slug)).size).toBe(20);
    const oldSlugs = new Set(QUESTIONS.map(entry => entry.slug));
    const oldKeywords = new Set(QUESTIONS.map(entry => normalizeKeyword(entry.primaryKeyword)));
    for (const entry of QUESTION_EXPANSION_CATALOG) {
      expect(oldSlugs.has(entry.slug), entry.slug).toBe(false);
      expect(oldKeywords.has(normalizeKeyword(entry.primaryKeyword)), entry.slug).toBe(false);
      expect(entry.family).toBe("question");
      expect(entry.intent).toBe("informational");
    }
  });

  it.each(QUESTION_EXPANSION_CATALOG)("$slug has a substantial task answer before shared rules are added", entry => {
    const words = mainText(editorialContent(entry)).split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(350);
    expect(entry.answer.split(/\s+/).length).toBeGreaterThanOrEqual(40);
    expect(entry.answer.split(/\s+/).length).toBeLessThanOrEqual(90);
    expect(entry.sections.length).toBeGreaterThanOrEqual(3);
    expect(entry.sections.length).toBeLessThanOrEqual(5);
    expect(entry.sections.some(section => section.heading.startsWith("Example:"))).toBe(true);
    expect(entry.sections.some(section => section.blocks.some(block => block.type === "list"))).toBe(true);
    expect(entry.faq.length).toBeGreaterThanOrEqual(2);
    expect(entry.faq.length).toBeLessThanOrEqual(3);
  });

  it("passes the unchanged forty-percent lexical gate against the entire authored question family including shared facts", () => {
    const combined = [...QUESTIONS, ...QUESTION_EXPANSION_CATALOG];
    const shares = uniqueShares(new Map(combined.map(entry => [entry.slug, shingles(mainText(editorialContent(entry, true)))])));
    for (const entry of QUESTION_EXPANSION_CATALOG) expect(shares.get(entry.slug), entry.slug).toBeGreaterThanOrEqual(0.4);
    // This is source-level corpus assessment. Saved draft records still participate in the
    // real database gate; this test does not claim a production generation/publication result.
  });

  it("retains registered legal scope and dates, and declares every extra primary source it links", () => {
    const topics = new Set(NATIONAL_FACTS.map(fact => fact.topic));
    expect(Object.keys(QUESTION_EXPANSION_SOURCES).sort()).toEqual(QUESTION_EXPANSION_CATALOG.map(entry => entry.slug).sort());
    for (const entry of QUESTION_EXPANSION_CATALOG) {
      expect(entry.factTopics.length, entry.slug).toBeGreaterThan(0);
      for (const topic of entry.factTopics) expect(topics.has(topic), `${entry.slug}: ${topic}`).toBe(true);
      const extra = QUESTION_EXPANSION_SOURCES[entry.slug]!;
      const declaredUrls = new Set(extra.map(source => source.url));
      const body = JSON.stringify(entry.sections);
      for (const match of body.matchAll(/\]\((https:\/\/[^)]+)\)/g)) expect(declaredUrls.has(match[1]!), `${entry.slug}: ${match[1]}`).toBe(true);
      for (const source of extra) {
        expect(source.accessedOn).toBe("2026-10-29");
        expect(source.label.trim().length).toBeGreaterThan(10);
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("does not invent market demand, price promises, brands of movers, or business contact details", () => {
    const body = JSON.stringify(QUESTION_EXPANSION_CATALOG);
    expect(body).not.toMatch(/guaranteed delivery|guaranteed safe|\$\d|\/companies\/|Lone Star|Peachtree|sb_secret_|TODO|PLACEHOLDER/i);
    expect(body).not.toMatch(/monthly searches|search volume|most popular route|our certified experts/i);
  });

  it("keeps model, material and legal limits explicit in the delicate decisions", () => {
    const bySlug = new Map(QUESTION_EXPANSION_CATALOG.map(entry => [entry.slug, mainText(editorialContent(entry))]));
    expect(bySlug.get("how-do-i-prepare-a-refrigerator-for-moving")).toContain("do not apply one generic waiting time");
    expect(bySlug.get("how-do-i-protect-a-mattress-during-a-move")).toContain("does not mean a used mattress can safely be compressed again");
    expect(bySlug.get("can-i-move-houseplants-to-another-state")).toContain("This page grants no species-specific entry approval");
    expect(bySlug.get("how-do-i-pack-hand-tools-and-power-tools-for-moving")).toContain("Do not puncture, modify or attempt to repair a damaged battery");
  });
});

import { describe, expect, it } from "vitest";
import { CATALOG } from "../../../../packages/server/src/seo/catalog.ts";
import { EDITORIAL_ASSISTANT_QUESTIONS } from "./seo-questions.ts";
import { publicSeoPage } from "../../components/seo/public-content.ts";

describe("human search questions for every authored editorial guide", () => {
  it("provides four distinct natural questions for every current catalog slug", () => {
    expect(Object.keys(EDITORIAL_ASSISTANT_QUESTIONS).sort()).toEqual(CATALOG.map(entry => entry.slug).sort());
    const all = [];
    for (const entry of CATALOG) {
      const specs = EDITORIAL_ASSISTANT_QUESTIONS[entry.slug];
      expect(specs, entry.slug).toHaveLength(4);
      for (const spec of specs) {
        expect(spec.question.endsWith("?"), entry.slug).toBe(true);
        expect(spec.question.length, entry.slug).toBeLessThanOrEqual(165);
        expect(spec.question, entry.slug).not.toMatch(/How can I use the|How can I follow|the question [“"]|when planning the question|what does this (?:page|guide) cover/iu);
        all.push(spec.question);
      }
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("binds every question to an actual source introduction, heading, FAQ or text topic", () => {
    for (const entry of CATALOG) {
      const projected=publicSeoPage({...entry,url:`/${entry.family}/${entry.slug}/`,title:entry.title??entry.h1,metaDescription:entry.metaDescription??entry.h1,sources:entry.sources??[],content:{intro:{answer:entry.answer,dataPoints:[]},sections:entry.sections.map((section,index)=>({...section,id:`s${index}`})),faq:entry.faq,related:[],quote:{text:""},credits:[],dataAsOf:"2026-10-30"}});
      const source = JSON.stringify([projected.content.intro.answer, projected.content.sections, projected.content.faq]).toLowerCase();
      for (const spec of EDITORIAL_ASSISTANT_QUESTIONS[entry.slug]) {
        expect(spec.evidence.length, `${entry.slug}: ${spec.question}`).toBeGreaterThan(0);
        expect(spec.evidence.some(term => term === "intro" || source.includes(term.toLowerCase())), `${entry.slug}: ${spec.question}`).toBe(true);
      }
    }
  });

  it("uses explicit interstate scope and avoids introducing universal own-business credentials", () => {
    for (const slug of ["what-is-a-binding-estimate", "what-is-the-110-percent-rule", "what-is-full-value-protection", "what-is-a-bill-of-lading"]) {
      expect(EDITORIAL_ASSISTANT_QUESTIONS[slug][0].question).toContain("interstate");
    }
    const insurance = EDITORIAL_ASSISTANT_QUESTIONS["does-a-mover-need-insurance"];
    expect(insurance.every(item => !item.evidence.includes("intro"))).toBe(true);
    expect(JSON.stringify(EDITORIAL_ASSISTANT_QUESTIONS)).not.toMatch(/American Moving Choice(?:'s)? (?:license|certification|years of experience)/u);
  });
});

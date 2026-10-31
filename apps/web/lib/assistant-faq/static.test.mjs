import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_STATIC_LINKS } from "../site.ts";
import { STATIC_ASSISTANT_FAQ_PAGES, staticAssistantFaq } from "./static.ts";
import { assertAssistantFaq, assistantFaqLd, faqWordCount } from "./types.ts";

const source = path => readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");
const hubs = new Set(["/movers/", "/routes/", "/services/", "/questions/", "/planning/", "/explore/"]);

describe("page-specific assistant questions for public core pages", () => {
  it("covers every canonical non-hub public page without using a generic fallback", () => {
    expect(Object.keys(STATIC_ASSISTANT_FAQ_PAGES).sort()).toEqual(PUBLIC_STATIC_LINKS.map(link => link.href).filter(url => !hubs.has(url)).sort());
    for (const url of ["/my-request/private-token/", "/get-quotes/confirmation/", "/admin/", "/directory/", "/advertising-disclosure/", "/not-a-page/"])
      expect(staticAssistantFaq(url)).toBeNull();
  });

  it("supplies five distinct questions and branded 40–80-word plain-text answers per core page", () => {
    const allQuestions = [];
    for (const [url, items] of Object.entries(STATIC_ASSISTANT_FAQ_PAGES)) {
      expect(items, url).toHaveLength(5);
      expect(() => assertAssistantFaq(items), url).not.toThrow();
      for (const item of items) {
        expect(faqWordCount(item.answer), item.question).toBeGreaterThanOrEqual(40);
        expect(faqWordCount(item.answer), item.question).toBeLessThanOrEqual(80);
        expect(item.answer).toContain("American Moving Choice");
        expect(item.answer).not.toMatch(/\{\{|\[owner:|\[counsel:|not yet available|\$\d|\bbest mover\b|\bselling leads\b/iu);
        expect(item.answer).not.toMatch(/American Moving Choice (?:is (?:a |an )?(?:licensed|certified)|has \d+ years)/u);
        allQuestions.push(item.question);
      }
    }
    expect(new Set(allQuestions).size).toBe(allQuestions.length);
  });

  it("copies the same answer strings into FAQPage rather than creating schema-only claims", () => {
    for (const [url, items] of Object.entries(STATIC_ASSISTANT_FAQ_PAGES)) {
      const json = assistantFaqLd("https://www.example.invalid", url, items);
      expect(json.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text }))).toEqual(items);
    }
  });

  it("directs verification questions to official records without promising fictional or completed live checks", () => {
    const page = source("apps/web/app/(site)/verify-a-mover/page.tsx");
    expect(page).toContain("FMCSA_LI_URL");
    const text = staticAssistantFaq("/verify-a-mover/").map(item => item.answer).join(" ");
    expect(text).toContain("official FMCSA sources");
    expect(text).toContain("Complaint history is not part of its lookup");
    expect(text).not.toMatch(/fictional USDOT|recorded-data preview|current preview/iu);
    const process = staticAssistantFaq("/how-we-verify-movers/").map(item => item.answer).join(" ");
    expect(process).toContain("A schedule is not proof that a live official record has been retrieved");
  });

  it("keeps request answers tied to the existing form rather than promising new intake fields", () => {
    const fields = source("apps/web/components/survey/survey.tsx");
    expect(fields.includes("contact details and company limit")).toBe(true);
    const text = staticAssistantFaq("/get-quotes/").map(item => item.answer).join(" ");
    expect(text).toContain("five steps");
    expect(text).toContain("does not collect a detailed inventory, document upload or free-text moving worksheet");
    expect(text).toContain("does not reserve transportation");
    expect(text).not.toMatch(/(?:we|American Moving Choice) (?:will|can) (?:book|transport|guarantee)/iu);
  });

  it("keeps policy gaps explicit and does not invent owner contact details or response times", () => {
    expect(source("apps/web/app/(site)/privacy/page.tsx")).toContain("Retention periods");
    expect(source("apps/web/app/(site)/terms/page.tsx")).toContain("not finalized in this preview");
    const privacy = staticAssistantFaq("/privacy/").map(item => item.answer).join(" ");
    const terms = staticAssistantFaq("/terms/").map(item => item.answer).join(" ");
    expect(privacy).toContain("Retention periods");
    expect(privacy).toContain("have not been finalized");
    expect(terms).toContain("awaiting final legal review");
    expect(staticAssistantFaq("/contact/").map(item => item.answer).join(" ")).not.toMatch(/\b24\/7\b|\bwithin \d+ hours\b|support@|\(\d{3}\)/u);
  });
});

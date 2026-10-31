import { hubAssistantFaq, moversIndexAssistantFaq, catalogAssistantFaq } from "./hubs.ts";
import { assertAssistantFaq, faqWordCount } from "./types.ts";

const hub = (family, entries, changes = {}) => ({ family, url: `/${family}/`, title: ({ route: "Moving routes", question: "Moving questions", planning: "Moving planning", service: "Moving services" })[family], description: "A collection of published moving information.", page: 1, perPage: 60, total: 122, entries, ...changes });
const entries = (...names) => names.map((h1, i) => ({ url: `/guides/${i}/`, h1 }));
const expectContract = items => {
  expect(() => assertAssistantFaq(items)).not.toThrow();
  for (const item of items) {
    expect(faqWordCount(item.answer)).toBeGreaterThanOrEqual(40);
    expect(faqWordCount(item.answer)).toBeLessThanOrEqual(80);
    expect(item.answer).toContain("American Moving Choice");
    expect(item.answer).not.toMatch(/\$\d|\b(?:licensed|certified) (?:mover|moving company)|years of experience/i);
  }
};

describe("assistant questions for published moving collections", () => {
  it("anchors route answers to the actual displayed origin/destination without inventing prices or driving time", () => {
    const faq = hubAssistantFaq(hub("route", entries("Moving from Albany, NY to Melrose, NY", "Moving from Boston, MA to Chicago, IL"), { total: 2221 }));
    expectContract(faq);
    expect(faq).toHaveLength(5);
    expect(faq[0].question).toContain("from Albany, NY to Melrose, NY");
    expect(faq[0].answer).toContain("2,221");
    expect(faq[0].answer).toContain("2 of");
    expect(faq[2].answer).toContain("does not set a price");
    expect(faq[3].answer).toContain("not a promise of driving time");
  });

  it("uses each paginated route page's own entries and current facts", () => {
    const first = hubAssistantFaq(hub("route", entries("Moving from Alabama to Georgia")));
    const later = hubAssistantFaq(hub("route", entries("Moving from Oregon to Nevada"), { page: 3, total: 145 }));
    expectContract(later);
    expect(JSON.stringify(later)).toContain("Oregon");
    expect(JSON.stringify(later)).not.toContain("Alabama");
    expect(later[0].answer).toContain("Page 3 lists 1 of 145");
    expect(later[0].question).not.toBe(first[0].question);
  });

  it("does not turn an empty collection into a fictitious published guide", () => {
    for (const family of ["route", "question", "planning", "service"]) {
      const faq = hubAssistantFaq(hub(family, [], { total: 0 }));
      expectContract(faq);
      expect(faq[0].answer).toContain("currently displays no published guide cards");
      expect(JSON.stringify(faq)).not.toContain("publishes “");
    }
  });

  it.each([
    ["question", ["How do moving companies charge?", "What is a binding estimate?"]],
    ["planning", ["Bill of lading document review checklist", "Moving day checklist"]],
    ["service", ["Local moving", "Packing services"]],
  ])("keeps the %s hub specific to listed topics", (family, titles) => {
    const faq = hubAssistantFaq(hub(family, entries(...titles), { total: 6, perPage: undefined }));
    expectContract(faq);
    expect(faq).toHaveLength(4);
    expect(JSON.stringify(faq)).toContain(titles[0].replace(/[.!?]+$/u, ""));
    expect(faq.at(-1).answer).not.toContain("previous, next and direct page controls");
  });

  it("does not fabricate state coverage or public mover identities from guide cards", () => {
    const faq = moversIndexAssistantFaq({ states: [{ url: "/movers/alabama/", h1: "Moving companies in Alabama", stateCode: "AL" }, { url: "/movers/alaska/", h1: "Moving companies in Alaska", stateCode: "AK" }] });
    expectContract(faq);
    expect(faq[0].question).toContain("Alabama");
    expect(faq[1].question).toContain("Alaska");
    expect(faq[0].answer).toContain("2 published state guides");
    expect(faq[2].answer).toContain("does not present a public company list");
  });

  it("uses live catalog filters, result counts and exact visible titles", () => {
    const faq = catalogAssistantFaq({ filters: { query: "packing", type: "city", stateName: "California", page: 2 }, total: 91, perPage: 60, entries: [{ url: "/movers/california/fresno/", title: "Moving in Fresno, California", family: "city" }] });
    expectContract(faq);
    expect(faq[0].question).toContain("city guides for California about “packing”");
    expect(faq[0].answer).toContain("1 of 91 results on page 2");
    expect(faq[2].answer).toContain("Moving in Fresno, California");
    expect(faq[3].answer).toContain("2 results pages");
  });

  it("treats an empty catalog as an information-search outcome, not rejected request coverage", () => {
    const faq = catalogAssistantFaq({ filters: { query: "small move", type: "all", page: 1 }, total: 0, perPage: 60, entries: [] });
    expectContract(faq);
    expect(faq[0].answer).toContain("No guide card currently matches");
    expect(faq[2].answer).toContain("does not decide whether you may submit a moving request");
    expect(JSON.stringify(faq)).not.toContain("No mover");
  });

  it("does not turn literal filter text into HTML or a schema-only alternate answer", () => {
    const faq = catalogAssistantFaq({ filters: { query: "Austin to Dallas", type: "route", stateName: "Texas", page: 1 }, total: 3, perPage: 60, entries: [{ url: "/routes/austin-to-dallas/", title: "Moving from Austin, TX to Dallas, TX" }] });
    expectContract(faq);
    expect(faq.every(item => typeof item.question === "string" && typeof item.answer === "string")).toBe(true);
    for (const query of ["<script>bad</script>", "**packing**", "[test](https://example.invalid)", "sk-ant-not-a-real-search-key", "who pays us", "moving lead pricing", "a ".repeat(40).trim()]) {
      const safe = catalogAssistantFaq({ filters: { query, type: "all", page: 1 }, total: 0, perPage: 60, entries: [] });
      expectContract(safe);
      expect(JSON.stringify(safe)).not.toContain(query);
      expect(safe[0].question).toContain("matching the current search");
    }
  });
});

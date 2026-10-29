import { vi } from "vitest";
vi.mock("next/link", () => ({ default: () => null }));
const { seoHeroCopy } = await import("./hero-copy.ts");
const page = (family, answer, metaDescription = "") => ({ family, metaDescription, content: { intro: { answer } } });

describe("reader-facing guide introductions", () => {
  it("uses the complete geographic opening rather than an unfinished search snippet", () => {
    const stored = { ...page("city", "Austin spans 74 ZIP codes in Travis County. As of October 28, coverage is checked separately."), metaDescription: "Austin spans 74 ZIP…" };
    expect(seoHeroCopy(stored)).toBe("Austin spans 74 ZIP codes in Travis County.");
    expect(seoHeroCopy(stored)).not.toContain("…");
    expect(stored.content.intro.answer).toContain("coverage is checked separately");
  });
  it("keeps place abbreviations, decimal figures and route model qualifications intact", () => {
    expect(seoHeroCopy(page("city", "St. Louis spans 61.7 square miles. Read the source."))).toBe("St. Louis spans 61.7 square miles.");
    expect(seoHeroCopy(page("city", "Mt. Pleasant has a local planning guide. Read more."))).toBe("Mt. Pleasant has a local planning guide.");
    expect(seoHeroCopy(page("state", "Washington, D.C. is a district. More guidance follows."))).toBe("Washington, D.C. is a district.");
    expect(seoHeroCopy(page("route", "About 45.5 miles separate the cities, roughly 60 road miles under a planning assumption. Check your route."))).toBe("About 45.5 miles separate the cities, roughly 60 road miles under a planning assumption.");
  });
  it("uses a complete authored scope summary while retaining the entire qualified answer unchanged", () => {
    const answer = "The delivery-payment rule depends on the estimate. Extra charges may apply for agreed additional services. Read [the calculation method](/moving-cost-calculator/method/) and the $250 example dated 2026-10-28.";
    const summary = "Understand how binding and non-binding estimates affect your final bill, which added charges can apply, and what movers may collect at delivery.";
    for (const family of ["question", "planning", "service", "cost"]) {
      const stored = page(family, answer, summary);
      expect(seoHeroCopy(stored)).toBe(summary);
      expect(stored.content.intro.answer).toBe(answer);
    }
  });
  it("uses a finished metadata sentence before a clipped tail and never shows the unfinished clause", () => {
    const summary = "A binding estimate covers the goods and services it lists.";
    const stored = page("question", "The complete detailed answer remains below.", `${summary} What to check before you…`);
    expect(seoHeroCopy(stored)).toBe(summary);
    expect(seoHeroCopy(stored)).not.toContain("What to check");
  });
  it("keeps a short reply and its qualifying sentence together rather than publishing a bare Yes or No", () => {
    const answer = "Sometimes. Delivery payment can include agreed additional services and capped impracticable-operations charges. Keep the full estimate and dated source.";
    expect(seoHeroCopy(page("question", answer))).toBe("Sometimes. Delivery payment can include agreed additional services and capped impracticable-operations charges.");
    const legal = "The reference has a $250 example, dated 2026-10-28, with additional charges subject to the stated conditions. The complete source remains below.";
    expect(seoHeroCopy(page("question", legal))).toContain("$250 example, dated 2026-10-28, with additional charges subject to the stated conditions.");
  });
});

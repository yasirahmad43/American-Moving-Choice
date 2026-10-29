import { vi } from "vitest";
vi.mock("next/link", () => ({ default: () => null }));
const { seoHeroCopy } = await import("./hero-copy.ts");
const page = (family, answer) => ({ family, content: { intro: { answer } } });

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
  it("keeps the full advice answer, including exceptions, numbers, dates and link labels", () => {
    const answer = "The delivery-payment rule depends on the estimate. Extra charges may apply for agreed additional services. Read [the calculation method](/moving-cost-calculator/method/) and the $250 example dated 2026-10-28.";
    for (const family of ["question", "planning", "service", "cost"]) expect(seoHeroCopy(page(family, answer))).toBe(answer.replace("[the calculation method](/moving-cost-calculator/method/)", "the calculation method"));
  });
});

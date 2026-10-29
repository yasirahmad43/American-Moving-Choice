import { vi } from "vitest";

const fixtures = vi.hoisted(() => ({ counts: vi.fn(), entries: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@amc/server/env", () => ({ env: () => ({ WEB_URL: "https://moving.example.test" }) }));
vi.mock("@amc/server/seo", async () => ({ ...(await import("../../../packages/server/src/seo/sitemaps.ts")), indexableCounts: fixtures.counts, sitemapEntries: fixtures.entries }));
vi.mock("./content/pages", () => ({ servedContentPages: () => [{ meta: { url: "/about/" } }, { meta: { url: "/advertising-disclosure/" } }] }));
vi.mock("./site", () => ({ PUBLIC_STATIC_LINKS: [{ href: "/" }, { href: "/questions/" }, { href: "/planning/" }, { href: "/about/" }] }));

import { sitemapIndexXml, sitemapSegmentXml } from "./sitemaps.ts";

const lastmod = new Date("2026-10-29T00:00:00.000Z");
const locs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
beforeEach(() => {
  vi.clearAllMocks();
  fixtures.counts.mockResolvedValue(new Map([["question", { count: 100001, lastmod }], ["planning", { count: 500, lastmod }], ["route", { count: 2221, lastmod }]]));
  fixtures.entries.mockResolvedValue([]);
});

describe("bounded sitemap delivery", () => {
  it("indexes every numbered questions/planning segment without legacy alias nesting", async () => {
    const files = locs(await sitemapIndexXml());
    expect(files.filter(url => /questions-/.test(url))).toHaveLength(101);
    expect(files).toContain("https://moving.example.test/sitemaps/questions-101.xml");
    expect(files).toContain("https://moving.example.test/sitemaps/planning-1.xml");
    expect(files).not.toContain("https://moving.example.test/sitemaps/questions.xml");
    expect(files).not.toContain("https://moving.example.test/sitemaps/planning.xml");
    expect(fixtures.entries).not.toHaveBeenCalled();
  });

  it("asks SQL for only the requested thousand URLs, including the final partial chunk", async () => {
    fixtures.entries.mockResolvedValue([{ url: "/questions/final-answer/", lastmod }]);
    const xml = await sitemapSegmentXml("questions-101");
    expect(fixtures.entries).toHaveBeenCalledTimes(1);
    expect(fixtures.entries).toHaveBeenCalledWith("question", { limit: 1000, offset: 100000 });
    expect(locs(xml)).toEqual(["https://moving.example.test/questions/final-answer/"]);
    expect(xml).toContain(`<lastmod>${lastmod.toISOString()}</lastmod>`);
  });

  it("preserves legacy questions/planning endpoints as complete sitemap indexes", async () => {
    const questions = await sitemapSegmentXml("questions");
    const planning = await sitemapSegmentXml("planning");
    expect(questions).toContain("<sitemapindex");
    expect(locs(questions)).toHaveLength(101);
    expect(locs(questions).at(-1)).toBe("https://moving.example.test/sitemaps/questions-101.xml");
    expect(locs(planning)).toEqual(["https://moving.example.test/sitemaps/planning-1.xml"]);
    expect(fixtures.entries).not.toHaveBeenCalled();
  });

  it("lists every real hub results page in core without page-one duplicate aliases", async () => {
    const urls = locs(await sitemapSegmentXml("core"));
    expect(urls.filter(url => /\/questions\/page\//.test(url))).toHaveLength(1666);
    expect(urls.filter(url => /\/planning\/page\//.test(url))).toHaveLength(8);
    expect(urls.filter(url => /\/routes\/page\//.test(url))).toHaveLength(37);
    expect(urls).toContain("https://moving.example.test/questions/page/1667/");
    expect(urls).not.toContain("https://moving.example.test/questions/page/1668/");
    expect(urls.some(url => /\/page\/1\/$/.test(url))).toBe(false);
    expect(urls.some(url => /advertising-disclosure/.test(url))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("rejects malformed or absent chunks and preserves small unchunked families", async () => {
    for (const name of ["questions-0", "questions-01", "questions-1.0", "questions-1000000", "unknown-1", "states-1", "cities"]) expect(await sitemapSegmentXml(name)).toBeNull();
    expect(fixtures.entries).not.toHaveBeenCalled();
    expect(await sitemapSegmentXml("questions-102")).toBeNull();
    expect(fixtures.entries).toHaveBeenLastCalledWith("question", { limit: 1000, offset: 101000 });
    fixtures.entries.mockResolvedValue([{ url: "/movers/texas/", lastmod }]);
    expect(locs(await sitemapSegmentXml("states"))).toEqual(["https://moving.example.test/movers/texas/"]);
    expect(fixtures.entries).toHaveBeenLastCalledWith("state");
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { normalizeDiscovery, publicDiscoveryOverview, publicDiscoveryPages } from "../src/seo/discovery";
import { insertCorpusFixtures } from "./seo-fixtures";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  const db = getPool();
  await insertCorpusFixtures(db, [
    { url: "/movers/texas/", family: "state", answer: "Texas overview", published: true },
    { url: "/movers/texas/austin/", family: "city", answer: "Austin overview", published: true },
    { url: "/movers/texas/dallas/", family: "city", answer: "Dallas overview", published: true },
    { url: "/movers/texas/draft-city/", family: "city", answer: "Unpublished information" },
    { url: "/routes/texas-to-colorado/", family: "route", answer: "Route overview", published: true },
    { url: "/routes/texas-to-nevada-held/", family: "route", answer: "Not indexable", published: true },
    { url: "/services/packing/", family: "service", answer: "Packing overview", published: true },
    { url: "/moving-costs/local/", family: "cost", answer: "Cost overview", published: true },
    { url: "/questions/estimates/", family: "question", answer: "Estimate overview", published: true },
    { url: "/planning/moving-checklist/", family: "planning", answer: "Checklist overview", published: true },
    // Defense against legacy/corrupt URL records: even published records cannot add these.
    { url: "/companies/private-mover/", family: "city", answer: "Private identity", published: true },
    { url: "/my-request/private-token/", family: "city", answer: "Private request", published: true },
  ]);
  await db.query("update seo_pages set h1=case when url like '%austin%' then 'Moving in Austin, Texas' when url like '%dallas%' then 'Moving in Dallas, Texas' else url end, state_code=case when family in ('state','city','route') then 'TX' else null end");
  await db.query("update seo_pages set indexable=false where url='/routes/texas-to-nevada-held/'");
});
afterAll(closePool);

describe("public guide discovery", () => {
  it("counts published indexable families and route origins without drafts or private routes", async () => {
    const overview = await publicDiscoveryOverview();
    expect(overview.total).toBe(8);
    expect(overview.families).toEqual({ state: 1, city: 2, route: 1, service: 1, cost: 1, question: 1, planning: 1 });
    expect(overview.states).toEqual([{ code: "TX", total: 4, cities: 2, routes: 1 }]);
  });
  it("returns only bounded public metadata and a stable, complete pagination count", async () => {
    const first = await publicDiscoveryPages({ limit: 3 });
    const next = await publicDiscoveryPages({ offset: 3, limit: 3 });
    expect(first.total).toBe(8);
    expect(first.pages).toHaveLength(3);
    expect(next.pages).toHaveLength(3);
    expect(new Set([...first.pages, ...next.pages].map((page) => page.url)).size).toBe(6);
    expect(Object.keys(first.pages[0]!).sort()).toEqual(["family", "stateCode", "title", "url"]);
    expect(JSON.stringify(first)).not.toMatch(/private-mover|private-token|draft-city|nevada-held|content_hash|gate_results/);
    expect(await publicDiscoveryPages({ offset: 100 })).toEqual({ pages: [], total: 8 });
  });
  it("combines state, family and case-insensitive literal search without wildcard expansion", async () => {
    const result = await publicDiscoveryPages({ query: "aUsTiN", family: "city", state: "TX" });
    expect(result.pages.map((page) => page.url)).toEqual(["/movers/texas/austin/"]);
    expect((await publicDiscoveryPages({ query: "%" })).total).toBe(0);
    expect((await publicDiscoveryPages({ query: "_" })).total).toBe(0);
    expect((await publicDiscoveryPages({ family: "city", state: "CA" })).total).toBe(0);
    expect((await publicDiscoveryPages({ query: "'; drop table seo_pages; --" })).total).toBe(0);
  });
  it("bounds external inputs before executing the search", () => {
    expect(normalizeDiscovery({ family: "mover-profile", state: "TX';--", limit: 900, offset: -8, query: `  Austin    ${"x".repeat(90)}` })).toMatchObject({ family: null, state: null, limit: 60, offset: 0 });
    expect(normalizeDiscovery({ query: " a    b " }).query).toBe("a b");
    expect(normalizeDiscovery({ query: "x".repeat(100) }).query).toHaveLength(80);
  });
});

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { bootstrapSeo, SEO_BOOTSTRAP_VERSION } from "../src/seo/bootstrap";
import { generateFamily, uniqueShares } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { shingleHashes } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";
import { resetDatabase } from "./helpers";
import { insertCorpusFixtures } from "./seo-fixtures";
import { ensureShingleCorpus } from "../src/seo/shingle-corpus";

beforeAll(async () => { await resetDatabase(); await importGeo(getPool(), { metroCount: 2, intrastatePerState: 2, topPerStateForCities: 0 }); });
afterAll(closePool);

describe("expanded SEO quality and deployment boundaries", () => {
  it("counts shared shingles against every family page, not only the requested batch", async () => {
    const db = getPool();
    await insertCorpusFixtures(db, [{ url: "/routes/a/", answer: "one two three four five six seven" }, { url: "/routes/b/", answer: "one two three four five delta" }]);
    await ensureShingleCorpus(db);
    expect((await uniqueShares(db, "route", ["/routes/a/"])).get("/routes/a/")).toBeCloseTo(2 / 3);
    expect((await uniqueShares(db, "route", ["/routes/b/"])).get("/routes/b/")).toBe(0.5);
    await db.query("delete from seo_pages where family='route'");
    expect(shingleHashes("a b c d e a b c d e").length).toBe(5);
  });

  it("generates count-only coverage, retains clean published pages and hides interrupted changes", async () => {
    const db = getPool();
    const first = await generateFamily(db, "state", { only: ["texas"], limit: 1 });
    expect(first.ready).toBe(1);
    await publishPages(db, { family: "state" });
    const page = (await db.query("select content::text from seo_pages where url='/movers/texas/'")).rows[0]!;
    expect(page.content).not.toContain('"type": "movers"');
    expect(page.content).not.toContain("/companies/");
    expect(page.content).not.toMatch(/Lone Star|Peachtree|by name and USDOT|Apartments, elevators and limited parking are the norm/);
    await generateFamily(db, "state", { only: ["texas"], limit: 1 });
    expect((await db.query("select status,indexable from seo_pages where url='/movers/texas/'")).rows[0]).toEqual({ status: "published", indexable: true });
    await expect(generateFamily(db, "state", { only: ["texas"], limit: 1, onProgress: async () => { throw new Error("interrupted deployment"); } })).rejects.toThrow("interrupted deployment");
    expect((await db.query("select status,indexable from seo_pages where url='/movers/texas/'")).rows[0]).toEqual({ status: "draft", indexable: false });
    expect((await publishPages(db, { status: "draft", family: "state" })).published).toBe(0);
    // An admin status edit cannot accidentally publish content whose advisory flag used to be ignored.
    await db.query("update seo_pages set status='ready',blocked_reason=null,gate_results=jsonb_build_object('words',jsonb_build_object('passed',false)) where url='/movers/texas/'");
    expect((await publishPages(db, { family: "state" })).published).toBe(0);
  });

  it("refuses a live deployment lease and releases its own lease after a failed phase", async () => {
    const db = getPool();
    await db.query("delete from seo_pages");
    await db.query("insert into seo_bootstrap_runs (version,owner_token,lease_until) values ($1,$2,now()+interval '10 minutes')", [SEO_BOOTSTRAP_VERSION, randomUUID()]);
    await expect(bootstrapSeo(db, { log: () => undefined })).rejects.toThrow("another deployment");
    // Resume checkpoints, then provoke a missing geo table row in the next phase.
    await db.query("update seo_bootstrap_runs set owner_token=null,lease_until=null,completed_steps=array['geo','research']");
    await db.query("delete from seo_states where code='TX'");
    await expect(bootstrapSeo(db, { log: () => undefined })).rejects.toThrow("seo_states has no row for TX");
    expect((await db.query("select owner_token,lease_until,completed_steps from seo_bootstrap_runs")).rows[0]).toEqual({ owner_token: null, lease_until: null, completed_steps: ["geo", "research"] });
    await db.query("update seo_bootstrap_runs set completed_at=now()");
    expect(await bootstrapSeo(db, { log: () => undefined })).toMatchObject({ skipped: true, published: 0 });
  });

  it("holds noncontiguous route guides and never invents road figures in Alaska/Hawaii geography tables", async () => {
    const db = getPool();
    // Restore the geo row deliberately removed by the earlier lease-failure test.
    await importGeo(db, { metroCount: 2, intrastatePerState: 2, topPerStateForCities: 0 });
    expect((await db.query("select count(*)::int n from seo_routes where (origin_state in ('AK','HI') or destination_state in ('AK','HI')) and drive_miles_estimate is not null")).rows[0]!.n).toBe(0);
    await generateFamily(db, "route", { only: ["hawaii-to-california", "washington-to-alaska", "texas-to-colorado"], limit: 3 });
    for (const url of ["/routes/hawaii-to-california/", "/routes/washington-to-alaska/"]) {
      const row = (await db.query("select status,blocked_reason,content from seo_pages where url=$1", [url])).rows[0]!;
      expect(row.status).toBe("draft");
      expect(row.blocked_reason).toContain("unsupported transport mode");
      const points = (row.content as SeoContent).intro.dataPoints.filter((point) => /driving/i.test(point.label));
      expect(points).toHaveLength(2);
      expect(points.every((point) => point.value === "Not modeled; ask mover")).toBe(true);
    }
    const ordinary = (await db.query("select blocked_reason,content from seo_pages where url='/routes/texas-to-colorado/'")).rows[0]!;
    expect(ordinary.blocked_reason ?? "").not.toContain("unsupported transport mode");
    expect((ordinary.content as SeoContent).intro.dataPoints.find((point) => point.label === "Estimated driving distance")!.value).toMatch(/[0-9]+.*miles/);
    await generateFamily(db, "state", { only: ["hawaii", "alaska"], limit: 2 });
    const city = (await db.query("select slug from seo_cities where state_code='HI' and population>=10000 and cardinality(zips)>0 order by population desc limit 1")).rows[0]!;
    await generateFamily(db, "city", { only: [`hawaii/${city.slug}`], limit: 1 });
    const pages = await db.query<{ content: SeoContent }>("select content from seo_pages where family in ('state','city') and state_code in ('AK','HI')");
    let checked = 0;
    for (const page of pages.rows) for (const section of page.content.sections) for (const block of section.blocks) {
      if (block.type !== "table") continue;
      const indices = block.columns.map((name,index) => /road|driving days/i.test(name) ? index : -1).filter(index => index >= 0);
      for (const row of block.rows) for (const index of indices) { expect(row[index]).toMatch(/not modeled/i); checked++; }
    }
    expect(checked).toBeGreaterThan(20);
    // The method note may describe the contiguous-US model's 500-mile/day assumption;
    // individual trips must never claim calculated road distance or transport days here.
    expect(JSON.stringify(pages.rows)).not.toMatch(/\b(?:about|estimated|roughly) [0-9,]+(?:\.\d+)? road miles\b|\b\d+ driving days?\b|same day/);
  });
});

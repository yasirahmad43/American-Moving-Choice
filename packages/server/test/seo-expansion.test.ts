import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { bootstrapSeo, SEO_BOOTSTRAP_VERSION } from "../src/seo/bootstrap";
import { generateFamily, uniqueShares } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { shingleHashes } from "../src/seo/text";
import { resetDatabase } from "./helpers";

beforeAll(async () => { await resetDatabase(); await importGeo(getPool(), { metroCount: 2, intrastatePerState: 2, topPerStateForCities: 0 }); });
afterAll(closePool);

describe("expanded SEO quality and deployment boundaries", () => {
  it("counts shared shingles against every family page, not only the requested batch", async () => {
    const db = getPool();
    await db.query("insert into seo_shingles (family,page_url,h) values ('route','/routes/a/',1),('route','/routes/a/',2),('route','/routes/a/',3),('route','/routes/b/',2),('route','/routes/b/',4)");
    expect((await uniqueShares(db, "route", ["/routes/a/"])).get("/routes/a/")).toBeCloseTo(2 / 3);
    expect((await uniqueShares(db, "route", ["/routes/b/"])).get("/routes/b/")).toBe(0.5);
    await db.query("delete from seo_shingles where family='route'");
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
});

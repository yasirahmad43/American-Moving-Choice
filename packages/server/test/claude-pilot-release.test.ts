import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { CATALOG } from "../src/seo/catalog";
import { CLAUDE_PILOT_COHORT, bootstrapClaudePilot } from "../src/seo/claude-pilot-release";
import { generateFamily } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  await importGeo(getPool(), { metroCount: 1, intrastatePerState: 1, topPerStateForCities: 0 });
  for (const family of ["question", "planning"] as const) {
    const only = CATALOG.filter(entry => entry.family === family && !entry.publicationCohort).map(entry => entry.slug);
    await generateFamily(getPool(), family, { only, limit: 100 });
    await publishPages(getPool(), { family });
  }
}, 120_000);
afterAll(closePool);

describe("actual source-reviewed Claude pilot", () => {
  it("publishes all 24 reviewed articles against the full prior editorial corpus, preserving every old row", async () => {
    const db = getPool();
    const before = (await db.query("select url,to_jsonb(p) page from seo_pages p order by url")).rows;
    expect(before.some(row => row.page.status === "published")).toBe(true);
    expect(CLAUDE_PILOT_COHORT.entries).toHaveLength(24);
    const client = await db.connect();
    try {
      const result = await bootstrapClaudePilot(client);
      expect(result).toMatchObject({ skipped: false, reviewed: 24, published: 24, held: 0 });
      const after = new Map((await db.query("select url,to_jsonb(p) page from seo_pages p")).rows.map(row => [row.url, row.page]));
      for (const row of before) expect(after.get(row.url)).toEqual(row.page);
      const fingerprint = (await db.query("select md5(string_agg(to_jsonb(p)::text,'' order by url)) value from seo_pages p")).rows[0]!.value;
      expect(await bootstrapClaudePilot(client)).toMatchObject({ skipped: true, published: 24, held: 0 });
      expect((await db.query("select md5(string_agg(to_jsonb(p)::text,'' order by url)) value from seo_pages p")).rows[0]!.value).toBe(fingerprint);
    } finally { client.release(); }
  }, 120_000);
});

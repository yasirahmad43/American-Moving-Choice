import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { bootstrapEditorialBatch } from "../src/seo/editorial-bootstrap";
import { QUESTIONS, PLANNING } from "../src/seo/catalog";
import { generateFamily } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { QUESTION_EXPANSION_CATALOG } from "../src/seo/question-expansion-catalog";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  await importGeo(getPool(), { metroCount: 1, intrastatePerState: 1, topPerStateForCities: 0 });
  for (const [family, entries] of [["question", QUESTIONS], ["planning", PLANNING]] as const) {
    await generateFamily(getPool(), family, { only: entries.map(entry => entry.slug), limit: entries.length });
    await publishPages(getPool(), { family });
  }
});
afterAll(closePool);

const snapshot = async () => (await getPool().query("select url,content_hash,status,indexable from seo_pages order by url")).rows;

describe("atomic sourced editorial release", () => {
  it("rolls back a real mid-write interruption and permits a safe retry", async () => {
    const before = await snapshot();
    const client = await getPool().connect(); let wrote = false;
    const interrupted = new Proxy(client, { get(target, property) {
      if (property !== "query") return Reflect.get(target, property);
      return async (sql: string, values?: unknown[]) => {
        const result = await target.query(sql, values);
        if (!wrote && sql.includes("insert into seo_pages (")) { wrote = true; throw new Error("intentional mid-write interruption"); }
        return result;
      };
    } });
    try { await expect(bootstrapEditorialBatch(interrupted, { log: () => undefined })).rejects.toThrow("intentional mid-write interruption"); }
    finally { client.release(); }
    expect(wrote).toBe(true);
    expect(await snapshot()).toEqual(before);
  });
  it("publishes only the forty authored additions and retains prior live text and status", async () => {
    const before = await snapshot();
    const client = await getPool().connect();
    try {
      const result = await bootstrapEditorialBatch(client, { log: () => undefined });
      expect(result).toMatchObject({ skipped: false, authored: 40, published: 40, held: 0 });
      const after = new Map((await snapshot()).map(page => [page.url, page]));
      for (const page of before) expect(after.get(page.url)).toEqual(page);
      expect(after.size - before.length).toBe(40);
      const invalid = await client.query("select url from seo_pages where status='published' and (blocked_reason is not null or unique_share<0.4 or exists(select 1 from jsonb_each(gate_results) gate where gate.value->>'passed'='false'))");
      expect(invalid.rows).toEqual([]);
    } finally { client.release(); }
  });
  it("does not regenerate a completed release or write page timestamps again", async () => {
    const before = await getPool().query("select url,updated_at,content_hash from seo_pages order by url");
    const client = await getPool().connect();
    try { expect(await bootstrapEditorialBatch(client, { log: () => undefined })).toMatchObject({ skipped: true, published: 40 }); }
    finally { client.release(); }
    expect((await getPool().query("select url,updated_at,content_hash from seo_pages order by url")).rows).toEqual(before.rows);
  });
  it("counts a removed or absent authored entry as held rather than dropping it from the report", async () => {
    const url = `/questions/${QUESTION_EXPANSION_CATALOG[0]!.slug}/`;
    await getPool().query("delete from seo_pages where url=$1", [url]);
    const client = await getPool().connect();
    try {
      const result = await bootstrapEditorialBatch(client, { log: () => undefined });
      expect(result).toMatchObject({ skipped: true, authored: 40, published: 39, held: 1 });
      expect(result.published + result.held).toBe(result.authored);
    } finally { client.release(); }
  });
});

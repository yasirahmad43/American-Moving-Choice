import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { closePool, getPool, type Queryable } from "../src/db/pool";
import { bootstrapSeo, SEO_BOOTSTRAP_VERSION } from "../src/seo/bootstrap";
import { CorpusChangedError, ensureShingleCorpus, scoreShingleCorpus } from "../src/seo/shingle-corpus";
import { mainText, sha256 } from "../src/seo/text";
import { resetDatabase } from "./helpers";
import { corpusContent, insertCorpusFixtures } from "./seo-fixtures";

beforeAll(resetDatabase);
beforeEach(async () => { await getPool().query("delete from seo_pages"); await getPool().query("delete from seo_bootstrap_runs"); });
afterAll(closePool);

async function pair(): Promise<void> {
  await insertCorpusFixtures(getPool(), [{ url: "/routes/a/", answer: "one two three four five six seven" }, { url: "/routes/b/", answer: "one two three four five delta" }]);
  await ensureShingleCorpus(getPool());
}

describe("compact persistent SEO corpus", () => {
  it("repairs missing records with an unchanged page hash and stale records after edits", async () => {
    const db = getPool(); await pair();
    const hash = (await db.query("select content_hash from seo_pages where url='/routes/a/'")).rows[0]!.content_hash;
    await db.query("delete from seo_page_shingles where page_url='/routes/a/'");
    expect(await ensureShingleCorpus(db)).toBe(1);
    expect((await db.query("select content_hash from seo_page_shingles where page_url='/routes/a/'")).rows[0]!.content_hash).toBe(hash);
    const content = corpusContent("one two three four five six different");
    await db.query("update seo_pages set content=$1,content_hash=$2 where url='/routes/a/'", [JSON.stringify(content), sha256(mainText(content))]);
    await expect(scoreShingleCorpus(db, "route", ["/routes/a/"])).rejects.toBeInstanceOf(CorpusChangedError);
    expect(await ensureShingleCorpus(db)).toBe(1);
    expect((await scoreShingleCorpus(db, "route", ["/routes/a/"])).shares.get("/routes/a/")).toBeCloseTo(2 / 3);
  });

  it("detects a lower-revision commit arriving after a later revision during the second pass", async () => {
    const db = getPool(); await pair();
    const delayed = await db.connect(); let committed = false;
    try {
      await delayed.query("begin");
      await delayed.query("update seo_page_shingles set hashes=array_replace(hashes,hashes[1],1234567) where page_url='/routes/a/'");
      await db.query("update seo_page_shingles set hashes=array_replace(hashes,hashes[1],7654321) where page_url='/routes/b/'");
      const raced = { query: async (text: string, values?: unknown[]) => {
        const result = await db.query(text, values);
        if (!committed && text.includes("page_url=any")) { await delayed.query("commit"); committed = true; }
        return result;
      } } as Queryable;
      await expect(scoreShingleCorpus(raced, "route", ["/routes/a/", "/routes/b/"])).rejects.toBeInstanceOf(CorpusChangedError);
      expect(committed).toBe(true);
    } finally { if (!committed) await delayed.query("rollback"); delayed.release(); }
  });

  it("detects source content changing mid-score even when the packed-table fingerprint is unchanged", async () => {
    const db = getPool(); await pair(); let changed = false;
    const content = corpusContent("this source changed during the second scoring pass");
    const raced = { query: async (text: string, values?: unknown[]) => {
      const result = await db.query(text, values);
      if (!changed && text.includes("page_url=any")) {
        changed = true;
        await db.query("update seo_pages set content=$1,content_hash=$2 where url='/routes/a/'", [JSON.stringify(content), sha256(mainText(content))]);
      }
      return result;
    } } as Queryable;
    await expect(scoreShingleCorpus(raced, "route", ["/routes/a/"])).rejects.toBeInstanceOf(CorpusChangedError);
    expect(changed).toBe(true);
  });

  it("repairs 51 checkpointed state pages and 2818 unfinished city drafts before resuming", async () => {
    const db = getPool();
    const pages = [
      ...Array.from({ length: 51 }, (_, i) => ({ url: `/movers/checkpoint-${i}/`, family: "state", answer: `Saved state fact record number ${i} before cache migration`, published: true })),
      ...Array.from({ length: 2818 }, (_, i) => ({ url: `/movers/test/checkpoint-${i}/`, family: "city", answer: `Unfinished city fact record number ${i} before cache migration` })),
    ];
    await insertCorpusFixtures(db, pages);
    await db.query("insert into seo_bootstrap_runs(version,completed_steps) values($1,array['geo','research','family:state'])", [SEO_BOOTSTRAP_VERSION]);
    // The deliberately absent geo context stops at the next family, after cache repair.
    await expect(bootstrapSeo(db, { log: () => undefined })).rejects.toThrow("seo_states has no row");
    expect((await db.query("select count(*)::int n from seo_page_shingles")).rows[0]!.n).toBe(2869);
    expect((await db.query("select count(*)::int n from seo_pages where family='state' and status='published'")).rows[0]!.n).toBe(51);
    expect((await db.query("select count(*)::int n from seo_pages where family='city' and status='draft'")).rows[0]!.n).toBe(2818);
    expect((await db.query("select completed_steps,owner_token from seo_bootstrap_runs")).rows[0]).toEqual({ completed_steps: ["geo", "research", "family:state"], owner_token: null });
  });
});

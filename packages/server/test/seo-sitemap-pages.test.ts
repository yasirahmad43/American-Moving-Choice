import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { sitemapEntries } from "../src/seo/queries";
import { publishPages } from "../src/seo/publish";
import { insertCorpusFixtures } from "./seo-fixtures";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  await insertCorpusFixtures(getPool(), [
    { url: "/questions/first/", family: "question", answer: "First source fixture", published: true },
    { url: "/questions/second/", family: "question", answer: "Second source fixture", published: true },
    { url: "/questions/third/", family: "question", answer: "Third source fixture", published: true },
    { url: "/questions/held/", family: "question", answer: "Unpublished source fixture" },
    { url: "/planning/check/", family: "planning", answer: "Different family fixture", published: true },
  ]);
});
afterAll(closePool);

describe("bounded sitemap reads and scoped editorial publication", () => {
  it("returns a stable SQL page without drafts, noindex or another family", async () => {
    const db = getPool();
    const first = await sitemapEntries("question", { limit: 2, offset: 0 }, db);
    const second = await sitemapEntries("question", { limit: 2, offset: 2 }, db);
    expect(first.map(page => page.url)).toEqual(["/questions/first/", "/questions/second/"]);
    expect(second.map(page => page.url)).toEqual(["/questions/third/"]);
    expect(await sitemapEntries("question", { limit: 2, offset: 100_000 }, db)).toEqual([]);
    expect(await sitemapEntries("question", db)).toHaveLength(3);
  });
  it("rejects unsafe or unexpectedly large bounds before querying", async () => {
    const db = getPool();
    for (const options of [{ limit: 1001 }, { limit: 0 }, { limit: 2.5 }, { offset: -1 }, { offset: Number.MAX_VALUE }]) {
      await expect(sitemapEntries("question", options, db)).rejects.toThrow("Invalid sitemap page bounds");
    }
  });
  it("publishes only explicitly selected ready entries and leaves other ready drafts alone", async () => {
    const db = getPool();
    await insertCorpusFixtures(db, [
      { url: "/questions/cohort/", family: "question", answer: "An explicit reviewed cohort fixture" },
      { url: "/questions/unrelated/", family: "question", answer: "An unrelated ready record fixture" },
    ]);
    await db.query("update seo_pages set status='ready',blocked_reason=null where url in ('/questions/cohort/','/questions/unrelated/')");
    const result = await publishPages(db, { family: "question", urls: ["/questions/cohort/"], limit: 10 });
    expect(result.published).toBe(1);
    expect((await db.query("select url,status from seo_pages where url in ('/questions/cohort/','/questions/unrelated/') order by url")).rows).toEqual([
      { url: "/questions/cohort/", status: "published" }, { url: "/questions/unrelated/", status: "ready" },
    ]);
  });
  it("treats an empty cohort as no publication rather than all ready records", async () => {
    expect((await publishPages(getPool(), { family: "question", urls: [] })).published).toBe(0);
    expect((await getPool().query("select status from seo_pages where url='/questions/unrelated/'")).rows[0].status).toBe("ready");
  });
});

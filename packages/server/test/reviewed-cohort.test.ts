import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { CATALOG, QUESTIONS, PLANNING } from "../src/seo/catalog";
import { pilotEntryUrl } from "../src/seo/claude-pilot-adapter";
import { QUESTION_EXPANSION_CATALOG } from "../src/seo/question-expansion-catalog";
import { PLANNING_EXPANSION } from "../src/seo/planning-expansion-catalog";
import * as corpus from "../src/seo/shingle-corpus";
import { generateFamily } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { publishReviewedCohort, reviewedCohort } from "../src/seo/reviewed-cohort";
import { resetDatabase } from "./helpers";

const entries = QUESTION_EXPANSION_CATALOG.slice(0, 5).map(entry => CATALOG.find(candidate => candidate.family === "question" && candidate.slug === entry.slug)!);
const make = (index: number) => reviewedCohort({ entries: [entries[index]!], sourceManifestSha256: "a".repeat(64), reviewedBy: "Integration test source review", reviewedAt: "2026-10-30T12:00:00.000Z" });
const snapshot = async () => (await getPool().query("select to_jsonb(p) as page from seo_pages p order by url")).rows.map(row => row.page);

beforeAll(async () => {
  await resetDatabase();
  await importGeo(getPool(), { metroCount: 1, intrastatePerState: 1, topPerStateForCities: 0 });
  for (const [family, source] of [["question", QUESTIONS[0]!], ["planning", PLANNING[0]!]] as const) {
    await generateFamily(getPool(), family, { only: [source.slug], limit: 1 });
    await publishPages(getPool(), { family });
  }
});
afterAll(closePool);

describe("atomic reviewed pilot publication", () => {
  it("validates source bounds and refuses a model-shaped replacement before any write", async () => {
    expect(() => reviewedCohort({ entries: [], sourceManifestSha256: "a".repeat(64), reviewedBy: "Review", reviewedAt: "2026-10-30" })).toThrow("bounded");
    const cohort = make(0);
    const client = await getPool().connect();
    try {
      const changed = reviewedCohort({ ...cohort, entries: [{ ...entries[0]!, title: "An unreviewed replacement title" }] });
      await expect(publishReviewedCohort(client, changed)).rejects.toThrow("exact reviewed source");
      await expect(publishReviewedCohort(client, { ...cohort, version: "made-up-version" })).rejects.toThrow("immutable version");
    } finally { client.release(); }
  });

  it("rolls back an actual mid-write interruption and safely retries the same cohort", async () => {
    const before = await snapshot(), cohort = make(0);
    const client = await getPool().connect(); let wrote = false;
    const interrupted = new Proxy(client, { get(target, property) {
      if (property !== "query") return Reflect.get(target, property);
      return async (sql: string, values?: unknown[]) => {
        const result = await target.query(sql, values);
        if (!wrote && sql.includes("insert into seo_pages (")) { wrote = true; throw new Error("intentional reviewed-cohort interruption"); }
        return result;
      };
    } });
    try { await expect(publishReviewedCohort(interrupted, cohort)).rejects.toThrow("intentional reviewed-cohort interruption"); }
    finally { client.release(); }
    expect(wrote).toBe(true);
    expect(await snapshot()).toEqual(before);
    const retry = await getPool().connect();
    try { expect(await publishReviewedCohort(retry, cohort)).toMatchObject({ skipped: false, reviewed: 1, published: 1, held: 0 }); }
    finally { retry.release(); }
    const after = new Map((await snapshot()).map(page => [page.url, page]));
    for (const page of before) expect(after.get(page.url)).toEqual(page);
    expect(after.get(pilotEntryUrl(entries[0]!))!.reviewed_by).toBe("Integration test source review");
  });

  it("publishes only its exact cohort and leaves an unrelated ready article untouched", async () => {
    await generateFamily(getPool(), "question", { only: [entries[2]!.slug], limit: 1, preserveExisting: true });
    const before = await snapshot();
    const planning = CATALOG.find(entry => entry.family === "planning" && entry.slug === PLANNING_EXPANSION[0]!.slug)!;
    const cohort = reviewedCohort({ ...make(1), entries: [entries[1]!, planning] });
    const client = await getPool().connect();
    try { expect(await publishReviewedCohort(client, cohort)).toMatchObject({ published: 2, held: 0 }); }
    finally { client.release(); }
    const after = new Map((await snapshot()).map(page => [page.url, page]));
    for (const page of before) expect(after.get(page.url)).toEqual(page);
    expect(after.get(pilotEntryUrl(entries[2]!))!.status).toBe("ready");
  });

  it("rejects an occupied URL and an active release lease instead of overwriting either", async () => {
    const client = await getPool().connect();
    try {
      await expect(publishReviewedCohort(client, make(2))).rejects.toThrow("unowned page");
      const cohort = make(3);
      await client.query("insert into seo_bootstrap_runs(version,owner_token,lease_until) values($1,$2,now()+interval '10 minutes')", [cohort.version, randomUUID()]);
      await expect(publishReviewedCohort(client, cohort)).rejects.toThrow("another run");
    } finally { client.release(); }
  });

  it("aborts the entire new cohort if its corpus result would invalidate a prior live article", async () => {
    const before = await snapshot(), actualScore = corpus.scoreShingleCorpus;
    const score = vi.spyOn(corpus, "scoreShingleCorpus").mockImplementation(async (...args) => {
      const result = await actualScore(...args);
      result.shares.set(`/questions/${QUESTIONS[0]!.slug}/`, 0.39);
      return result;
    });
    const client = await getPool().connect();
    try { await expect(publishReviewedCohort(client, make(4))).rejects.toThrow("prior live article fail uniqueness"); }
    finally { score.mockRestore(); client.release(); }
    expect(await snapshot()).toEqual(before);
  });

  it("keeps completed release page data and timestamps unchanged on repeat", async () => {
    const before = (await getPool().query("select url,updated_at,content_hash,reviewed_by,last_reviewed_at from seo_pages order by url")).rows;
    const client = await getPool().connect();
    try { expect(await publishReviewedCohort(client, make(0))).toMatchObject({ skipped: true, published: 1 }); }
    finally { client.release(); }
    expect((await getPool().query("select url,updated_at,content_hash,reviewed_by,last_reviewed_at from seo_pages order by url")).rows).toEqual(before);
  });
});

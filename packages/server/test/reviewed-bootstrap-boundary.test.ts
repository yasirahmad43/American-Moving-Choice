import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { bootstrapSeo, SEO_BOOTSTRAP_MIN_PAGES, SEO_BOOTSTRAP_VERSION } from "../src/seo/bootstrap";
import { CATALOG, type CatalogEntry } from "../src/seo/catalog";
import { importGeo } from "../src/seo/geo-import";
import { resetDatabase } from "./helpers";

beforeAll(async () => {
  await resetDatabase();
  await importGeo(getPool(), { metroCount: 1, intrastatePerState: 1, topPerStateForCities: 0 });
});
afterAll(closePool);

const editorialUrl = (entry: CatalogEntry): string => `/${entry.family === "question" ? "questions" : "planning"}/${entry.slug}/`;

describe("initial bootstrap and reviewed publication boundary", () => {
  it("generates ordinary editorial pages while leaving reserved cohort URLs unoccupied", async () => {
    const db = getPool();
    const originalCatalog = CATALOG.slice();
    const ordinary = originalCatalog.filter(entry => (entry.family === "question" || entry.family === "planning") && !entry.publicationCohort);
    const reserved = (["question", "planning"] as const).map(family => {
      const original = ordinary.find(entry => entry.family === family);
      expect(original).toBeDefined();
      return {
        ...structuredClone(original!),
        slug: `reserved-${family}-bootstrap-boundary`,
        publicationCohort: "reviewed-bootstrap-boundary-fixture-v1",
      } satisfies CatalogEntry;
    });
    const completed = ["geo", "research", "family:state", "family:city", "family:route", "family:service", "family:cost", "family:zip", "links", "media"];
    try {
      CATALOG.push(...reserved);
      await db.query("insert into seo_bootstrap_runs (version, completed_steps) values ($1, $2::text[])", [SEO_BOOTSTRAP_VERSION, completed]);
      // Only the question/planning phases run in this intentionally small fresh-install fixture.
      // Preserve the production minimum and every ordinary quality gate.
      expect(SEO_BOOTSTRAP_MIN_PAGES).toBe(2_000);
      await expect(bootstrapSeo(db, { log: () => undefined })).rejects.toThrow(`${SEO_BOOTSTRAP_MIN_PAGES} required`);

      const pages = (await db.query<{ url: string; family: string }>("select url, family from seo_pages order by url")).rows;
      expect(pages.some(page => page.family === "question")).toBe(true);
      expect(pages.some(page => page.family === "planning")).toBe(true);
      expect(pages.map(page => page.url)).toEqual(ordinary.map(editorialUrl).sort());
      const reservedUrls = CATALOG.filter(entry => entry.publicationCohort && (entry.family === "question" || entry.family === "planning")).map(editorialUrl);
      expect(reservedUrls.length).toBeGreaterThanOrEqual(2);
      expect((await db.query("select url from seo_pages where url = any($1::text[])", [reservedUrls])).rows).toEqual([]);

      const checkpoint = (await db.query<{ completed_steps: string[]; completed_at: Date | null; owner_token: string | null; lease_until: Date | null }>("select completed_steps, completed_at, owner_token, lease_until from seo_bootstrap_runs where version = $1", [SEO_BOOTSTRAP_VERSION])).rows[0]!;
      expect(new Set(checkpoint.completed_steps)).toEqual(new Set([...completed, "family:question", "family:planning"]));
      expect(checkpoint).toMatchObject({ completed_at: null, owner_token: null, lease_until: null });
    } finally {
      CATALOG.splice(0, CATALOG.length, ...originalCatalog);
    }
  }, 60_000);
});

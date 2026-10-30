/** Production-only caller: populate an empty SEO catalogue, resuming incomplete deployments.
 * Reads only bundled, attributed datasets. Never downloads data or writes the deployment's disk.
 */
import { randomUUID } from "node:crypto";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Queryable } from "../db/pool";
import { syncMediaManifest } from "../admin/content-media";
import { claimableMedia } from "../media/manifest";
import { importGeo } from "./geo-import";
import { generateFamily } from "./generate";
import { pipelineCounts, publishPages, rebuildLinks } from "./publish";
import { importResearch } from "./research";
import type { SeoFamily } from "./slugs";
import { ensureShingleCorpus } from "./shingle-corpus";
import { CATALOG } from "./catalog";

export const SEO_BOOTSTRAP_VERSION = "census-contact-introduction-v1";
export const SEO_BOOTSTRAP_MIN_PAGES = 2_000;
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

export interface SeoBootstrapResult { skipped: boolean; published: number; completedSteps: string[] }

export async function bootstrapSeo(db: Queryable, options: { log?: (line: string) => void; maxRunMs?: number } = {}): Promise<SeoBootstrapResult> {
  const log = options.log ?? console.log;
  const version = SEO_BOOTSTRAP_VERSION;
  const count = async () => (await db.query<{ n: number }>("select count(*)::int n from seo_pages where status = 'published' and indexable and blocked_reason is null")).rows[0]!.n;
  const previous = (await db.query<{ completed_at: Date | null; completed_steps: string[] }>("select completed_at, completed_steps from seo_bootstrap_runs where version = $1", [version])).rows[0];
  // Existing editorial catalogues are never regenerated merely because another build ran.
  if (previous?.completed_at || (!previous && (await db.query("select 1 from seo_pages limit 1")).rowCount)) {
    await ensureShingleCorpus(db, { log });
    const published = await count();
    log(`seo-bootstrap: catalogue already initialized (${published} published/indexable); no generation`);
    return { skipped: true, published, completedSteps: previous?.completed_steps ?? [] };
  }
  const owner = randomUUID();
  const lease = await db.query<{ completed_steps: string[] }>(
    `insert into seo_bootstrap_runs (version, owner_token, lease_until) values ($1, $2, now() + interval '10 minutes')
     on conflict (version) do update set owner_token = excluded.owner_token, lease_until = excluded.lease_until, updated_at = now()
       where seo_bootstrap_runs.completed_at is null and (seo_bootstrap_runs.owner_token is null or seo_bootstrap_runs.lease_until < now())
     returning completed_steps`, [version, owner],
  );
  if (!lease.rowCount) throw new Error("seo-bootstrap: another deployment owns the active lease; retry after it completes or its 10-minute lease expires");
  const completed = new Set(lease.rows[0]!.completed_steps);
  const started = Date.now();
  const heartbeat = async () => {
    if (Date.now() - started > (options.maxRunMs ?? 25 * 60_000)) throw new Error("seo-bootstrap: build time budget reached; completed phases are saved for the next production build");
    const updated = await db.query("update seo_bootstrap_runs set lease_until = now() + interval '10 minutes', updated_at = now() where version = $1 and owner_token = $2", [version, owner]);
    if (!updated.rowCount) throw new Error("seo-bootstrap: deployment lease was lost; refusing to continue");
  };
  const phase = async (name: string, run: () => Promise<unknown>) => {
    if (completed.has(name)) { log(`seo-bootstrap: ${name} already complete`); return; }
    await heartbeat();
    log(`seo-bootstrap: starting ${name}`);
    await run();
    await heartbeat();
    completed.add(name);
    await db.query("update seo_bootstrap_runs set completed_steps = $3::text[], updated_at = now() where version = $1 and owner_token = $2", [version, owner, [...completed]]);
  };
  try {
    // Migration 230 discards only the derived index. Rebuild saved/checkpointed families too;
    // a resume after 2,818 city drafts must include the earlier 51 published state pages.
    await ensureShingleCorpus(db, { log, onProgress: heartbeat });
    await phase("geo", () => importGeo(db, { log }));
    await phase("research", async () => {
      const dir = join(root, "docs", "research");
      for (const file of readdirSync(dir).filter((name) => name.endsWith(".csv")).sort()) await importResearch(db, join(dir, file), log);
    });
    // Whole city family fits in 3,165 candidates with the bundled data. Every generated page
    // still passes evidence, 300-word, duplicate-intent and >=40% family uniqueness gates.
    const families: [SeoFamily, number][] = [["state", 51], ["city", 10_000], ["route", 1_000], ["service", 100], ["cost", 100], ["question", 1_000], ["planning", 1_000], ["zip", 500]];
    for (const [family, limit] of families) await phase(`family:${family}`, async () => {
      const media = await claimableMedia(db);
      // Reviewed cohorts have their own collision checks and atomic publication. Leave their
      // URLs unoccupied on a fresh install so this initial pass cannot publish them first.
      const only = family === "question" || family === "planning"
        ? CATALOG.filter(entry => entry.family === family && !entry.publicationCohort).map(entry => entry.slug)
        : undefined;
      await generateFamily(db, family, { only, limit, chunkSize: 100, media, log, onProgress: heartbeat });
      await publishPages(db, { status: "ready", family, log });
    });
    await phase("links", () => rebuildLinks(db, log));
    await phase("media", () => syncMediaManifest(db));
    const published = await count();
    if (published < SEO_BOOTSTRAP_MIN_PAGES) throw new Error(`seo-bootstrap: ${published} published/indexable pages; ${SEO_BOOTSTRAP_MIN_PAGES} required. Quality gates remain unchanged; inspect seo:report before retrying.`);
    const invalid = await db.query(`select url from seo_pages where status = 'published' and
      (blocked_reason is not null or unique_share < 0.4 or exists (select 1 from jsonb_each(gate_results) g where g.value->>'passed' = 'false')) limit 1`);
    if (invalid.rowCount) throw new Error("seo-bootstrap: a published page failed its quality gates");
    await db.query("update seo_bootstrap_runs set completed_at = now(), published_count = $3, updated_at = now(), owner_token = null, lease_until = null where version = $1 and owner_token = $2", [version, owner, published]);
    log(`seo-bootstrap: complete, ${published} published/indexable pages; ${JSON.stringify(await pipelineCounts(db))}`);
    return { skipped: false, published, completedSteps: [...completed] };
  } finally {
    await db.query("update seo_bootstrap_runs set owner_token = null, lease_until = null, updated_at = now() where version = $1 and owner_token = $2", [version, owner]);
  }
}

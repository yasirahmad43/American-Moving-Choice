/** Publish one small, source-authored editorial batch atomically; never manufacture target counts. */
import { randomUUID } from "node:crypto";
import type pg from "pg";
import { CATALOG } from "./catalog";
import { QUESTION_EXPANSION_CATALOG as QUESTION_EXPANSION } from "./question-expansion-catalog";
import { PLANNING_EXPANSION } from "./planning-expansion-catalog";
import { generateFamily } from "./generate";
import { publishPages } from "./publish";
import { claimableMedia } from "../media/manifest";

export const EDITORIAL_BATCH_VERSION = "source-authored-moving-answers-checklists-2026-10-v1";
export interface EditorialBatchResult { skipped: boolean; authored: number; published: number; held: number; families: { family: string; published: number; held: number }[] }

const batch = [...QUESTION_EXPANSION, ...PLANNING_EXPANSION];
const urlOf = (family: string, slug: string) => `/${family === "service" ? "services" : family === "question" ? "questions" : "planning"}/${slug}/`;
const urls = batch.map(entry => urlOf(entry.family, entry.slug));

/** A pinned Client/PoolClient is required: all content and publication changes share one transaction. */
export async function bootstrapEditorialBatch(client: pg.Client, options: { log?: (line: string) => void; maxRunMs?: number } = {}): Promise<EditorialBatchResult> {
  const log = options.log ?? console.log;
  const counts = async (skipped: boolean): Promise<EditorialBatchResult> => {
    const rows = (await client.query<{ family: string; published: number; held: number }>(
      `select case when cohort.url like '/questions/%' then 'question' else 'planning' end family,
         count(*) filter(where p.status='published' and p.indexable)::int published,
         count(*) filter(where p.id is null or p.status<>'published' or not p.indexable)::int held
       from unnest($1::text[]) cohort(url) left join seo_pages p on p.url=cohort.url group by 1 order by 1`, [urls],
    )).rows;
    return { skipped, authored: batch.length, published: rows.reduce((sum, row) => sum + row.published, 0), held: rows.reduce((sum, row) => sum + row.held, 0), families: rows };
  };
  const invalidPublished = async () => {
    const invalid = await client.query("select 1 from seo_pages where url=any($1::text[]) and status='published' and (not indexable or blocked_reason is not null or unique_share is null or unique_share<0.4 or gate_results->'words'->>'passed' is distinct from 'true' or gate_results->'evidence'->>'passed' is distinct from 'true' or gate_results->'unique'->>'passed' is distinct from 'true' or exists(select 1 from jsonb_each(gate_results) gate where gate.value->>'passed'='false')) limit 1", [urls]);
    if (invalid.rowCount) throw new Error("editorial-batch: published entry failed its quality checks");
  };
  if (!batch.length || batch.length > 100 || new Set(urls).size !== urls.length || urls.some(url => CATALOG.filter(entry => urlOf(entry.family, entry.slug) === url).length !== 1)) throw new Error("editorial-batch: invalid source-authored cohort; maximum100 entries per atomic release");
  const prior = await client.query("select 1 from seo_bootstrap_runs where version=$1 and completed_at is not null", [EDITORIAL_BATCH_VERSION]);
  if (prior.rowCount) { await invalidPublished(); const result = await counts(true); log(`editorial-batch: already processed (${result.published} published/${result.held} held of ${result.authored} authored; owner targets are separate)`); return result; }
  const owner = randomUUID();
  const lease = await client.query(`insert into seo_bootstrap_runs(version,owner_token,lease_until) values($1,$2,now()+interval '10 minutes')
    on conflict(version) do update set owner_token=excluded.owner_token,lease_until=excluded.lease_until,updated_at=now()
    where seo_bootstrap_runs.completed_at is null and (seo_bootstrap_runs.owner_token is null or seo_bootstrap_runs.lease_until<now()) returning version`, [EDITORIAL_BATCH_VERSION, owner]);
  if (!lease.rowCount) throw new Error("editorial-batch: another deployment owns the active batch");
  const started = Date.now();
  const heartbeat = async () => {
    if (Date.now() - started > (options.maxRunMs ?? 5 * 60_000)) throw new Error("editorial-batch: bounded release budget reached; transaction will roll back");
    const renewed = await client.query("update seo_bootstrap_runs set lease_until=now()+interval '10 minutes',updated_at=now() where version=$1 and owner_token=$2", [EDITORIAL_BATCH_VERSION, owner]);
    if (!renewed.rowCount) throw new Error("editorial-batch: lease lost");
  };
  let inTransaction = false;
  try {
    await client.query("begin"); inTransaction = true;
    // Protect already-live articles from collateral losses when whole-family uniqueness changes.
    const protectedPages = (await client.query<{ url: string; fingerprint: string }>(`select url,md5((to_jsonb(p)-array['unique_share','gate_results','blocked_reason','updated_at'])::text) fingerprint
      from seo_pages p where family in ('question','planning') and status='published' for update`)).rows;
    const media = await claimableMedia(client);
    for (const family of ["question", "planning"] as const) {
      await heartbeat();
      await generateFamily(client, family, { only: batch.filter(entry => entry.family === family).map(entry => entry.slug), limit: 100, chunkSize: 20, preserveExisting: true, refreshQuality: true, media, onProgress: heartbeat, log });
      await publishPages(client, { family, urls: urls.filter(url => url.startsWith(family === "question" ? "/questions/" : "/planning/")), limit: 100, log });
    }
    const current = new Map((await client.query<{ url: string; fingerprint: string; valid: boolean }>(`select url,md5((to_jsonb(p)-array['unique_share','gate_results','blocked_reason','updated_at'])::text) fingerprint,
      (status='published' and blocked_reason is null and unique_share>=0.4 and not exists(select 1 from jsonb_each(gate_results) gate where gate.value->>'passed'='false')) valid
      from seo_pages p where url=any($1::text[])`, [protectedPages.map(page => page.url)])).rows.map(page => [page.url, page]));
    if (protectedPages.some(page => current.get(page.url)?.fingerprint !== page.fingerprint || !current.get(page.url)?.valid)) throw new Error("editorial-batch: existing published article would change or lose eligibility; expansion rolled back");
    await invalidPublished();
    const result = await counts(false);
    const saved = await client.query("update seo_bootstrap_runs set completed_at=now(),completed_steps=array['source-cohort','quality','publication'],published_count=$3,owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [EDITORIAL_BATCH_VERSION, owner, result.published]);
    if (!saved.rowCount) throw new Error("editorial-batch: lease lost before commit");
    await client.query("commit"); inTransaction = false;
    log(`editorial-batch: processed ${result.authored} authored entries (${result.published} published; ${result.held} held). Publication targets100001/500 are goals, not these counts.`);
    return result;
  } catch (error) {
    if (inTransaction) await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.query("update seo_bootstrap_runs set owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [EDITORIAL_BATCH_VERSION, owner]);
  }
}

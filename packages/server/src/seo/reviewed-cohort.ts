/** Publish only a source-reviewed editorial cohort, atomically preserving every prior live article. */
import { randomUUID } from "node:crypto";
import type pg from "pg";
import { CATALOG, type CatalogEntry } from "./catalog";
import { pilotEntryUrl, pilotSha256 } from "./claude-pilot-adapter";
import { generateFamily } from "./generate";
import { publishPages } from "./publish";
import { claimableMedia } from "../media/manifest";

export interface ReviewedCohort {
  version: string; entries: CatalogEntry[]; sourceManifestSha256: string; reviewedBy: string; reviewedAt: string;
}
export interface ReviewedCohortResult {
  skipped: boolean; version: string; reviewed: number; published: number; held: number;
  pages: { url: string; status: string | null; blockedReason: string | null }[];
}
export function reviewedCohort(input: Omit<ReviewedCohort, "version">): ReviewedCohort {
  if (!input.entries.length || input.entries.length > 100 || !/^[a-f0-9]{64}$/.test(input.sourceManifestSha256) || !input.reviewedBy.trim() || Number.isNaN(Date.parse(input.reviewedAt))) throw new Error("reviewed-cohort: invalid bounded source review");
  const urls = input.entries.map(pilotEntryUrl);
  if (new Set(urls).size !== urls.length || input.entries.some(entry => !["question", "planning"].includes(entry.family))) throw new Error("reviewed-cohort: only distinct question/planning URLs are allowed");
  const version = `claude-reviewed-cohort-v1-${pilotSha256({ entries: input.entries, sourceManifestSha256: input.sourceManifestSha256 }).slice(0, 24)}`;
  return { ...input, version };
}

/** Call only with a pinned, otherwise idle Client/PoolClient. Model artifacts cannot authorize this. */
export async function publishReviewedCohort(client: pg.Client, cohort: ReviewedCohort, options: { log?: (line: string) => void; maxRunMs?: number } = {}): Promise<ReviewedCohortResult> {
  const log = options.log ?? (() => undefined);
  const checked = reviewedCohort(cohort);
  if (checked.version !== cohort.version) throw new Error("reviewed-cohort: content does not match its immutable version");
  const urls = cohort.entries.map(pilotEntryUrl);
  for (const entry of cohort.entries) {
    const actual = CATALOG.filter(candidate => pilotEntryUrl(candidate) === pilotEntryUrl(entry));
    if (actual.length !== 1 || pilotSha256(actual[0]) !== pilotSha256(entry)) throw new Error("reviewed-cohort: article is not the exact reviewed source catalog entry");
  }
  const counts = async (skipped: boolean): Promise<ReviewedCohortResult> => {
    const rows = (await client.query<{ url: string; status: string | null; indexable: boolean | null; blocked_reason: string | null }>(`select cohort.url,p.status,p.indexable,p.blocked_reason from unnest($1::text[]) cohort(url) left join seo_pages p on p.url=cohort.url order by cohort.url`, [urls])).rows;
    const published = rows.filter(row => row.status === "published" && row.indexable && row.blocked_reason === null).length;
    return { skipped, version: cohort.version, reviewed: urls.length, published, held: urls.length - published, pages: rows.map(row => ({ url: row.url, status: row.status, blockedReason: row.blocked_reason })) };
  };
  const assertValidPublished = async () => {
    const invalid = await client.query(`select 1 from seo_pages where url=any($1::text[]) and status='published' and (not indexable or blocked_reason is not null or unique_share is null or unique_share<0.4 or gate_results->'words'->>'passed' is distinct from 'true' or gate_results->'evidence'->>'passed' is distinct from 'true' or gate_results->'unique'->>'passed' is distinct from 'true' or exists(select 1 from jsonb_each(gate_results) gate where gate.value->>'passed'='false')) limit 1`, [urls]);
    if (invalid.rowCount) throw new Error("reviewed-cohort: a published cohort article failed its quality gates");
  };
  if ((await client.query("select 1 from seo_bootstrap_runs where version=$1 and completed_at is not null", [cohort.version])).rowCount) {
    await assertValidPublished();
    return counts(true);
  }
  const owner = randomUUID();
  const lease = await client.query(`insert into seo_bootstrap_runs(version,owner_token,lease_until) values($1,$2,now()+interval '10 minutes') on conflict(version) do update set owner_token=excluded.owner_token,lease_until=excluded.lease_until,updated_at=now() where seo_bootstrap_runs.completed_at is null and (seo_bootstrap_runs.owner_token is null or seo_bootstrap_runs.lease_until<now()) returning version`, [cohort.version, owner]);
  if (!lease.rowCount) throw new Error("reviewed-cohort: another run owns the active source release");
  const started = Date.now();
  const heartbeat = async () => {
    if (Date.now() - started > (options.maxRunMs ?? 5 * 60_000)) throw new Error("reviewed-cohort: bounded release time reached; rolling back");
    if (!(await client.query("update seo_bootstrap_runs set lease_until=now()+interval '10 minutes',updated_at=now() where version=$1 and owner_token=$2", [cohort.version, owner])).rowCount) throw new Error("reviewed-cohort: lease lost");
  };
  let inTransaction = false;
  try {
    await client.query("begin isolation level serializable"); inTransaction = true;
    const collisions = await client.query("select url from seo_pages where url=any($1::text[]) limit 1", [urls]);
    if (collisions.rowCount) throw new Error("reviewed-cohort: an unowned page already occupies a cohort URL");
    const protectedPages = (await client.query<{ url: string; fingerprint: string }>(`select url,md5(to_jsonb(p)::text) fingerprint from seo_pages p where family in ('question','planning') and status='published' for update`)).rows;
    const media = await claimableMedia(client);
    for (const family of ["question", "planning"] as const) {
      const entries = cohort.entries.filter(entry => entry.family === family);
      if (!entries.length) continue;
      await heartbeat();
      await generateFamily(client, family, { only: entries.map(entry => entry.slug), limit: entries.length, chunkSize: 20, preserveExisting: true, refreshQuality: true, qualityApplyUrls: entries.map(pilotEntryUrl), media, onProgress: heartbeat, log });
      await client.query("update seo_pages set reviewed_by=$2,last_reviewed_at=$3 where url=any($1::text[])", [entries.map(pilotEntryUrl), cohort.reviewedBy, cohort.reviewedAt]);
      await publishPages(client, { family, urls: entries.map(pilotEntryUrl), limit: entries.length, log });
    }
    const current = new Map((await client.query<{ url: string; fingerprint: string; valid: boolean }>(`select url,md5(to_jsonb(p)::text) fingerprint,(status='published' and blocked_reason is null and unique_share>=0.4 and not exists(select 1 from jsonb_each(gate_results) gate where gate.value->>'passed'='false')) valid from seo_pages p where url=any($1::text[])`, [protectedPages.map(page => page.url)])).rows.map(page => [page.url, page]));
    if (protectedPages.some(page => current.get(page.url)?.fingerprint !== page.fingerprint || !current.get(page.url)?.valid)) throw new Error("reviewed-cohort: an existing live article would change or lose eligibility; rolling back");
    await assertValidPublished();
    const result = await counts(false);
    if (!(await client.query("update seo_bootstrap_runs set completed_at=now(),completed_steps=array['reviewed-source-cohort','quality','publication'],published_count=$3,owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [cohort.version, owner, result.published])).rowCount) throw new Error("reviewed-cohort: lease lost before commit");
    await client.query("commit"); inTransaction = false;
    log(`reviewed-cohort: ${result.published} published, ${result.held} held of ${result.reviewed} reviewed articles`);
    return result;
  } catch (error) {
    if (inTransaction) await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.query("update seo_bootstrap_runs set owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [cohort.version, owner]).catch(() => log("reviewed-cohort: lease cleanup deferred to expiry"));
  }
}

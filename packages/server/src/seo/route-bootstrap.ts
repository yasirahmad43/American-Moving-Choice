/** Add an attributed route cohort to an existing catalogue without rewriting saved guides. */
import { randomUUID } from "node:crypto";
import type { Queryable } from "../db/pool";
import { syncMediaManifest } from "../admin/content-media";
import { claimableMedia } from "../media/manifest";
import { generateFamily } from "./generate";
import { publishPages, rebuildLinks } from "./publish";
import { importRouteCohort, loadRouteCohort } from "./route-cohort";
import { ensureShingleCorpus } from "./shingle-corpus";

export const ROUTE_BOOTSTRAP_VERSION = "census-distinct-city-routes-v1";
export const ROUTE_BOOTSTRAP_MIN_PUBLISHED = 2_000;
export interface RouteBootstrapResult { skipped: boolean; publishedRoutes: number; plannedRoutes: number; completedSteps: string[] }

export async function validatePublishedRoutes(db: Queryable): Promise<number> {
  const published = (await db.query<{ n: number }>("select count(*)::int n from seo_pages where family='route' and status='published' and indexable and blocked_reason is null")).rows[0]!.n;
  if (published < ROUTE_BOOTSTRAP_MIN_PUBLISHED) throw new Error(`route-bootstrap: ${published} published routes; ${ROUTE_BOOTSTRAP_MIN_PUBLISHED} required. Quality gates are unchanged; inspect held drafts.`);
  const invalid = await db.query(`select 1 from seo_pages p left join seo_routes r on r.id=p.route_id
    where p.family='route' and p.status='published' and p.indexable and (
      r.id is null or p.blocked_reason is not null or p.unique_share is null or p.unique_share<0.4 or p.evidence_count<6
      or p.gate_results->'unique'->>'passed' is distinct from 'true'
      or p.gate_results->'words'->>'passed' is distinct from 'true'
      or p.gate_results->'evidence'->>'passed' is distinct from 'true'
      or p.gate_results->'transport'->>'passed' is distinct from 'true'
      or exists(select 1 from jsonb_each(p.gate_results) g where g.value->>'passed'='false')
      or r.origin_state in ('AK','HI') or r.destination_state in ('AK','HI')) limit 1`);
  if (invalid.rowCount) throw new Error("route-bootstrap: published route failed evidence, uniqueness, transport or publication gates");
  return published;
}

export async function bootstrapRoutes(db: Queryable, options: { log?: (line: string) => void; maxRunMs?: number; onProgress?: () => Promise<void> } = {}): Promise<RouteBootstrapResult> {
  const log = options.log ?? console.log;
  const previous = (await db.query<{ completed_at: Date | null; completed_steps: string[] }>("select completed_at,completed_steps from seo_bootstrap_runs where version=$1", [ROUTE_BOOTSTRAP_VERSION])).rows[0];
  if (previous?.completed_at) {
    const publishedRoutes = await validatePublishedRoutes(db);
    log(`route-bootstrap: already complete (${publishedRoutes} published routes); no source/content writes`);
    return { skipped: true, publishedRoutes, plannedRoutes: 0, completedSteps: previous.completed_steps };
  }
  const owner = randomUUID(), started = Date.now();
  const lease = await db.query<{ completed_steps: string[] }>(`insert into seo_bootstrap_runs(version,owner_token,lease_until) values($1,$2,now()+interval '10 minutes')
    on conflict(version) do update set owner_token=excluded.owner_token,lease_until=excluded.lease_until,updated_at=now()
    where seo_bootstrap_runs.completed_at is null and (seo_bootstrap_runs.owner_token is null or seo_bootstrap_runs.lease_until<now()) returning completed_steps`, [ROUTE_BOOTSTRAP_VERSION, owner]);
  if (!lease.rowCount) throw new Error("route-bootstrap: another deployment owns the route expansion lease");
  const completed = new Set(lease.rows[0]!.completed_steps);
  const heartbeat = async () => {
    if (Date.now() - started > (options.maxRunMs ?? 25 * 60_000)) throw new Error("route-bootstrap: build budget reached; saved content and phase checkpoints will resume next deployment");
    const renewed = await db.query("update seo_bootstrap_runs set lease_until=now()+interval '10 minutes',updated_at=now() where version=$1 and owner_token=$2", [ROUTE_BOOTSTRAP_VERSION, owner]);
    if (!renewed.rowCount) throw new Error("route-bootstrap: lease lost; refusing further work");
    await options.onProgress?.();
  };
  const phase = async (name: string, run: () => Promise<unknown>) => {
    if (completed.has(name)) { log(`route-bootstrap: ${name} already complete`); return; }
    await heartbeat(); log(`route-bootstrap: starting ${name}`); await run(); await heartbeat();
    completed.add(name);
    const saved = await db.query("update seo_bootstrap_runs set completed_steps=$3::text[],updated_at=now() where version=$1 and owner_token=$2", [ROUTE_BOOTSTRAP_VERSION, owner, [...completed]]);
    if (!saved.rowCount) throw new Error("route-bootstrap: lease lost while saving checkpoint");
  };
  try {
    const cohort = await loadRouteCohort(db);
    if (cohort.length < ROUTE_BOOTSTRAP_MIN_PUBLISHED) throw new Error("route-bootstrap: insufficient complete Census-backed route candidates; no speculative fallback");
    log(`route-bootstrap: ${cohort.length} geographically selected city routes; no popularity claim`);
    await ensureShingleCorpus(db, { family: "route", log, onProgress: heartbeat });
    await phase("candidates", () => importRouteCohort(db, cohort, heartbeat));
    await phase("content-and-quality", async () => {
      await generateFamily(db, "route", { only: cohort.map((pair) => pair.slug), limit: cohort.length, chunkSize: 100, preserveExisting: true, refreshQuality: true, routeEvidenceBrief: true, media: await claimableMedia(db), log, onProgress: heartbeat });
    });
    await phase("publication", () => publishPages(db, { family: "route", status: "ready", log }));
    await phase("links", () => rebuildLinks(db, log));
    await phase("media", () => syncMediaManifest(db));
    const publishedRoutes = await validatePublishedRoutes(db);
    const saved = await db.query("update seo_bootstrap_runs set completed_at=now(),published_count=$3,owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [ROUTE_BOOTSTRAP_VERSION, owner, publishedRoutes]);
    if (!saved.rowCount) throw new Error("route-bootstrap: lease lost before completion");
    log(`route-bootstrap: complete (${publishedRoutes} published routes; evidence/300-word/40%-uniqueness/transport gates held)`);
    return { skipped: false, publishedRoutes, plannedRoutes: cohort.length, completedSteps: [...completed] };
  } finally {
    await db.query("update seo_bootstrap_runs set owner_token=null,lease_until=null,updated_at=now() where version=$1 and owner_token=$2", [ROUTE_BOOTSTRAP_VERSION, owner]);
  }
}

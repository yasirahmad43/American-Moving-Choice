/**
 * Content management for the programmatic SEO store (docs/seo/programmatic-pipeline.md): the
 * inventory of seo_pages with their gate results, the editorial workflow
 * (draft → review → ready → published, and back to draft), indexability, reviewer records,
 * edits that re-run the automated gates, regeneration from the brief, redirects, bulk actions,
 * the research table (seo_research) and its CSV import, pipeline steps as background jobs, the
 * publication dashboard and the preferred-mover criteria page.
 *
 * Every state change is role-checked (content-roles.ts) and writes an audit_log row in the same
 * transaction. The generator and publisher are called as they are (generateFamily, publishPages,
 * unpublishPages, rebuildLinks, importResearch, importGeo); nothing here invents content.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { jobByName, runJob, type JobDefinition, type JobRunOutcome } from "../jobs/jobs";
import { generateFamily } from "../seo/generate";
import { importGeo } from "../seo/geo-import";
import { HUB_URLS, STATIC_LINK_PREFIXES, isSeoUrl, pipelineCounts, publishPages, rebuildLinks, unpublishPages, type PipelineCounts } from "../seo/publish";
import { importResearch } from "../seo/research";
import { SEO_SITEMAP_CHUNK as SITEMAP_CHUNK, SEO_SITEMAP_SEGMENTS as SITEMAP_SEGMENTS } from "../seo/sitemaps";
import { SEO_FAMILIES, SEO_STATUSES, isSeoFamily, type SeoFamily, type SeoStatus } from "../seo/slugs";
import { mainText, sha256, shingles, uniqueShares } from "../seo/text";
import type { FaqItem, SeoContent, SourceRef } from "../seo/types";
import type { CheckType } from "../verification/types";
import { AdminError, cleanText, requireText } from "./common";
import { claimableMedia, resolveUnderRepo, syncMediaManifest } from "./content-media";
import { assertContentRole, type ContentActor } from "./content-roles";

export { CONTENT_ROLES, canManageContent, type ContentActor } from "./content-roles";

export type GateResults = Record<string, { passed: boolean; detail: string }>;

const isHypothesis = (gates: GateResults | null | undefined): boolean => (gates?.keyword?.detail ?? "").startsWith("hypothesis");

/** Gates that block publication (generate.ts); the others are review triggers. */
export const BLOCKING_GATES = ["evidence", "unique", "duplicate_content", "duplicate_intent"] as const;

export const GATE_LABELS: Record<string, string> = {
  evidence: "Evidence (data-backed facts)",
  unique: "Unique content (5-word shingles)",
  duplicate_content: "Duplicate content hash",
  duplicate_intent: "Duplicate keyword and intent",
  keyword: "Keyword basis",
  words: "Main content length",
};

// ================================================================== inventory

export interface ContentFilters {
  family?: string | null;
  status?: string | null;
  indexable?: "yes" | "no" | "" | null;
  intent?: string | null;
  state?: string | null;
  parent?: string | null;
  blocked?: "yes" | "no" | "" | null;
  hypothesis?: "yes" | "no" | "" | null;
  reviewed?: "yes" | "no" | "" | null;
  media?: "yes" | "no" | "" | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

export interface ContentRow {
  id: string;
  url: string;
  family: SeoFamily;
  status: SeoStatus;
  indexable: boolean;
  primary_keyword: string;
  intent: string;
  state_code: string | null;
  parent_url: string | null;
  title: string;
  reviewed_by: string | null;
  last_reviewed_at: Date | null;
  published_at: Date | null;
  updated_at: Date;
  media_count: number;
  evidence_count: number;
  unique_share: number | null;
  blocked_reason: string | null;
  gate_results: GateResults;
  hypothesis: boolean;
  gates_passed: number;
  gates_total: number;
  gates_failed: string[];
}

interface Where {
  clause: string;
  values: unknown[];
}

function contentWhere(filters: ContentFilters): Where {
  const parts: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    parts.push(sql.replace(/\?/g, `$${values.length}`));
  };
  if (filters.family && isSeoFamily(filters.family)) add("family = ?", filters.family);
  if (filters.status && (SEO_STATUSES as readonly string[]).includes(filters.status)) add("status = ?", filters.status);
  if (filters.indexable === "yes") parts.push("indexable");
  if (filters.indexable === "no") parts.push("not indexable");
  if (filters.intent) add("intent = ?", filters.intent);
  if (filters.state) add("state_code = ?", filters.state.toUpperCase());
  if (filters.parent) add("parent_url = ?", filters.parent);
  if (filters.blocked === "yes") parts.push("blocked_reason is not null");
  if (filters.blocked === "no") parts.push("blocked_reason is null");
  if (filters.hypothesis === "yes") parts.push("coalesce(gate_results->'keyword'->>'detail', '') like 'hypothesis%'");
  if (filters.hypothesis === "no") parts.push("coalesce(gate_results->'keyword'->>'detail', '') not like 'hypothesis%'");
  if (filters.reviewed === "yes") parts.push("last_reviewed_at is not null");
  if (filters.reviewed === "no") parts.push("last_reviewed_at is null");
  if (filters.media === "yes") parts.push("jsonb_array_length(media_ids) > 0");
  if (filters.media === "no") parts.push("jsonb_array_length(media_ids) = 0");
  if (filters.q) add("(url ilike ? or title ilike ? or primary_keyword ilike ?)", `%${filters.q.replace(/[%_]/g, "")}%`);
  return { clause: parts.length ? `where ${parts.join(" and ")}` : "", values };
}

const ROW_COLUMNS = `id::text, url, family, status, indexable, primary_keyword, intent, state_code, parent_url, title, reviewed_by, last_reviewed_at, published_at, updated_at,
  jsonb_array_length(media_ids) as media_count, evidence_count, unique_share, blocked_reason, gate_results`;

const GATE_ORDER = ["evidence", "unique", "duplicate_content", "duplicate_intent", "keyword", "words"];
const gateRank = (key: string) => (GATE_ORDER.includes(key) ? GATE_ORDER.indexOf(key) : GATE_ORDER.length);

function decorate(r: Omit<ContentRow, "hypothesis" | "gates_passed" | "gates_total" | "gates_failed">): ContentRow {
  // jsonb stores keys by length, so order the gates as the generator lists them.
  const gates = Object.entries(r.gate_results ?? {}).sort(([a], [b]) => gateRank(a) - gateRank(b) || a.localeCompare(b));
  return {
    ...r,
    hypothesis: isHypothesis(r.gate_results),
    gates_passed: gates.filter(([, g]) => g.passed).length,
    gates_total: gates.length,
    gates_failed: gates.filter(([, g]) => !g.passed).map(([k]) => k),
  };
}

export async function listContentPages(filters: ContentFilters = {}, db: Queryable = getPool()): Promise<{ rows: ContentRow[]; total: number }> {
  const { clause, values } = contentWhere(filters);
  const total = await db.query<{ n: number }>(`select count(*)::int as n from seo_pages ${clause}`, values);
  const rows = await db.query<Omit<ContentRow, "hypothesis" | "gates_passed" | "gates_total" | "gates_failed">>(
    `select ${ROW_COLUMNS} from seo_pages ${clause} order by family, url limit $${values.length + 1} offset $${values.length + 2}`,
    [...values, filters.limit ?? 50, filters.offset ?? 0],
  );
  return { rows: rows.rows.map(decorate), total: total.rows[0]?.n ?? 0 };
}

/** The filter options the inventory page offers (states and parents present in the store). */
export async function contentFilterOptions(db: Queryable = getPool()): Promise<{ states: string[]; intents: string[]; families: readonly string[]; statuses: readonly string[] }> {
  const states = await db.query<{ state_code: string }>("select distinct state_code from seo_pages where state_code is not null order by 1");
  const intents = await db.query<{ intent: string }>("select distinct intent from seo_pages order by 1");
  return { states: states.rows.map((r) => r.state_code), intents: intents.rows.map((r) => r.intent), families: SEO_FAMILIES, statuses: SEO_STATUSES };
}

export interface ContentPageDetail {
  page: {
    id: string;
    url: string;
    slug: string;
    family: SeoFamily;
    state_code: string | null;
    city_id: number | null;
    zip: string | null;
    route_id: number | null;
    primary_keyword: string;
    intent: string;
    supporting_keywords: string[];
    parent_url: string | null;
    title: string;
    meta_description: string;
    h1: string;
    status: SeoStatus;
    indexable: boolean;
    content: SeoContent;
    content_hash: string;
    unique_share: number | null;
    evidence_count: number;
    sources: SourceRef[];
    media_ids: string[];
    blocked_reason: string | null;
    gate_results: GateResults;
    reviewed_by: string | null;
    last_reviewed_at: Date | null;
    published_at: Date | null;
    created_at: Date;
    updated_at: Date;
    canonical_url: string;
  };
  hypothesis: boolean;
  linksIn: number;
  linksOut: number;
  inbound: { from_url: string; relation: string; anchor: string }[];
  outbound: { to_url: string; relation: string; anchor: string }[];
  redirects: { source_url: string; reason: string; created_at: Date }[];
  research: { id: number; kind: string; keyword: string; volume: number | null; difficulty: number | null; source: string; priority: string | null }[];
  children: number;
  parentPublished: boolean | null;
  history: { id: string; action: string; actor_id: string | null; before: unknown; after: unknown; created_at: Date }[];
}

export async function getContentPage(id: string, db: Queryable = getPool()): Promise<ContentPageDetail | null> {
  const found = await db.query<ContentPageDetail["page"]>(
    `select id::text, url, slug, family, state_code, city_id, zip, route_id, primary_keyword, intent, supporting_keywords, parent_url, title, meta_description, h1, status, indexable,
            content, content_hash, unique_share, evidence_count, sources, media_ids, blocked_reason, gate_results, reviewed_by, last_reviewed_at, published_at, created_at, updated_at, canonical_url
     from seo_pages where id = $1`,
    [id],
  );
  const page = found.rows[0];
  if (!page) return null;
  const [inbound, outbound, redirects, research, children, parent, history] = await Promise.all([
    db.query<{ from_url: string; relation: string; anchor: string }>("select p.url as from_url, l.relation, l.anchor from seo_links l join seo_pages p on p.id = l.from_page_id where l.to_url = $1 order by p.url limit 200", [page.url]),
    db.query<{ to_url: string; relation: string; anchor: string }>("select to_url, relation, anchor from seo_links where from_page_id = $1 order by position limit 200", [id]),
    db.query<{ source_url: string; reason: string; created_at: Date }>("select source_url, reason, created_at from seo_redirects where target_url = $1 order by created_at desc", [page.url]),
    db.query<ContentPageDetail["research"][number]>("select id, kind, keyword, volume, difficulty, source, priority from seo_research where target_url = $1 order by volume desc nulls last, keyword limit 50", [page.url]),
    db.query<{ n: number }>("select count(*)::int as n from seo_pages where parent_url = $1", [page.url]),
    page.parent_url ? db.query<{ status: string }>("select status from seo_pages where url = $1", [page.parent_url]) : Promise.resolve(null),
    db.query<ContentPageDetail["history"][number]>("select id::text, action, actor_id, before, after, created_at from audit_log where entity = 'seo_page' and entity_id = $1 order by created_at desc limit 50", [id]),
  ]);
  const parentPublished = page.parent_url ? (parent?.rows[0] ? parent.rows[0].status === "published" : HUB_URLS.has(page.parent_url) ? true : false) : null;
  return {
    page,
    hypothesis: isHypothesis(page.gate_results),
    linksIn: inbound.rows.length,
    linksOut: outbound.rows.length,
    inbound: inbound.rows,
    outbound: outbound.rows,
    redirects: redirects.rows,
    research: research.rows,
    children: children.rows[0]?.n ?? 0,
    parentPublished,
    history: history.rows,
  };
}

// ================================================================== workflow

interface LockedPage {
  id: string;
  url: string;
  family: SeoFamily;
  status: SeoStatus;
  indexable: boolean;
  blocked_reason: string | null;
  title: string;
  meta_description: string;
  content: SeoContent;
  content_hash: string;
  gate_results: GateResults;
  evidence_count: number;
  reviewed_by: string | null;
}

async function lockPage(client: Queryable, id: string): Promise<LockedPage> {
  const found = await client.query<LockedPage>(
    "select id::text, url, family, status, indexable, blocked_reason, title, meta_description, content, content_hash, gate_results, evidence_count, reviewed_by from seo_pages where id = $1 for update",
    [id],
  );
  const page = found.rows[0];
  if (!page) throw new AdminError("Page not found.", "not_found");
  return page;
}

/** The transitions the workflow allows (anything may go back to draft; forward one step at a time). */
export const STATUS_TRANSITIONS: Record<SeoStatus, readonly SeoStatus[]> = {
  draft: ["review"],
  review: ["ready", "draft"],
  ready: ["published", "review", "draft"],
  published: ["draft"],
};

export const STATUS_LABELS: Record<SeoStatus, string> = { draft: "Draft", review: "In review", ready: "Ready", published: "Published" };

/** Why a page may not move to a status, or null. Ready and published need every blocking gate to pass. */
export function transitionProblem(page: { status: SeoStatus; blocked_reason: string | null; gate_results: GateResults }, to: SeoStatus): string | null {
  if (!STATUS_TRANSITIONS[page.status].includes(to)) return `A ${STATUS_LABELS[page.status].toLowerCase()} page can't move to ${STATUS_LABELS[to].toLowerCase()}.`;
  if ((to === "ready" || to === "published") && page.blocked_reason) return `The page is ${page.blocked_reason}. Fix the content or regenerate it first.`;
  if (to === "ready" || to === "published") {
    const failing = BLOCKING_GATES.filter((g) => page.gate_results[g] && !page.gate_results[g]!.passed);
    if (failing.length) return `Blocking gates fail: ${failing.map((g) => GATE_LABELS[g] ?? g).join(", ")}.`;
  }
  return null;
}

/**
 * Moves a page along the workflow. Publishing sets indexable, canonical and published_at as
 * seo:publish does and rebuilds the link graph; unpublishing (back to draft) goes through
 * unpublishPages so the page leaves the sitemaps and its links are dropped the same run.
 */
export async function setPageStatus(actor: ContentActor, id: string, to: string, note?: string | null): Promise<{ url: string; from: SeoStatus; to: SeoStatus }> {
  assertContentRole(actor);
  if (!(SEO_STATUSES as readonly string[]).includes(to)) throw new AdminError("Choose a status.");
  const target = to as SeoStatus;
  const reason = cleanText(note, 500);
  const result = await tx(async (client) => {
    const page = await lockPage(client, id);
    const problem = transitionProblem(page, target);
    if (problem) throw new AdminError(problem, "bad_transition");
    if (page.status === "published" && target === "draft") {
      await unpublishPages(client, [page.url]);
    } else if (target === "published") {
      await client.query("update seo_pages set status = 'published', published_at = coalesce(published_at, now()), indexable = (blocked_reason is null), canonical_url = url where id = $1", [id]);
      await rebuildLinks(client);
    } else {
      await client.query("update seo_pages set status = $2, indexable = false where id = $1", [id, target]);
    }
    await audit(
      { actorType: "admin", actorId: actor.userId, action: `content.page.${target === "published" ? "publish" : page.status === "published" ? "unpublish" : "status"}`, entity: "seo_page", entityId: id, before: { status: page.status, indexable: page.indexable }, after: { status: target, note: reason, url: page.url }, ip: actor.ip ?? null },
      client,
    );
    return { url: page.url, from: page.status, to: target };
  });
  return result;
}

/** Turns indexing on or off for a published page, with the reason recorded in the audit log. */
export async function setPageIndexable(actor: ContentActor, id: string, indexable: boolean, reason: string | null | undefined): Promise<void> {
  assertContentRole(actor);
  const text = requireText(reason, "why the page should change", 500);
  await tx(async (client) => {
    const page = await lockPage(client, id);
    if (page.status !== "published") throw new AdminError("Only a published page can be indexable; publish it first.", "bad_status");
    if (indexable && page.blocked_reason) throw new AdminError(`The page is ${page.blocked_reason}; it can't be indexed until that is fixed.`, "blocked");
    if (page.indexable === indexable) throw new AdminError(`The page is already ${indexable ? "indexable" : "noindex"}.`, "bad_status");
    await client.query("update seo_pages set indexable = $2, canonical_url = url where id = $1", [id, indexable]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.page.indexable", entity: "seo_page", entityId: id, before: { indexable: page.indexable }, after: { indexable, reason: text, url: page.url }, ip: actor.ip ?? null }, client);
  });
}

/** Records the human review (gate G9): who reviewed and when. */
export async function markPageReviewed(actor: ContentActor, id: string, reviewer: string | null | undefined): Promise<void> {
  assertContentRole(actor);
  const name = requireText(reviewer, "the reviewer's name", 120);
  await tx(async (client) => {
    const page = await lockPage(client, id);
    await client.query("update seo_pages set reviewed_by = $2, last_reviewed_at = now() where id = $1", [id, name]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.page.review", entity: "seo_page", entityId: id, before: { reviewed_by: page.reviewed_by }, after: { reviewed_by: name, url: page.url }, ip: actor.ip ?? null }, client);
  });
}

export interface PageEdit {
  title: string;
  metaDescription: string;
  intro: string;
  /** Question and answer pairs; an empty list removes the FAQ. */
  faq: FaqItem[];
}

/** FAQ text from a textarea: a question line ending in "?" followed by its answer lines, blank line between items. */
export function parseFaqText(text: string): FaqItem[] {
  const items: FaqItem[] = [];
  for (const block of text.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [question, ...rest] = lines;
    if (!question || rest.length === 0) throw new AdminError(`Each FAQ item needs a question line and an answer: "${(question ?? "").slice(0, 60)}".`, "bad_faq");
    items.push({ question: question.replace(/^Q:\s*/i, ""), answer: rest.join(" ").replace(/^A:\s*/i, "") });
  }
  return items;
}

export const faqToText = (faq: FaqItem[]): string => faq.map((f) => `${f.question}\n${f.answer}`).join("\n\n");

/**
 * Re-runs the gates the content can change after an edit: the content hash (duplicate_content),
 * the uniqueness share against the family, and the word count. Evidence, keyword and
 * duplicate_intent stay as the generator measured them. Returns the new gate set, blocked reason,
 * hash and share.
 */
async function regate(client: Queryable, page: LockedPage, content: SeoContent): Promise<{ gates: GateResults; blocked: string | null; hash: string; share: number }> {
  const text = mainText(content);
  const hash = sha256(text);
  const others = await client.query<{ url: string; content: SeoContent; content_hash: string }>("select url, content, content_hash from seo_pages where family = $1 and id <> $2", [page.family, page.id]);
  const corpus = others.rows.map((r) => shingles(mainText(r.content)));
  const share = uniqueShares(new Map([[page.url, shingles(text)]]), corpus).get(page.url) ?? 0;
  const hashDup = others.rows.find((r) => r.content_hash === hash)?.url ?? null;
  const gates: GateResults = { ...page.gate_results };
  gates.unique = { passed: share >= 0.4, detail: `${Math.round(share * 100)}% of 5-word shingles unique within the family; 40% needed` };
  gates.duplicate_content = { passed: !hashDup, detail: hashDup ? `same content hash as ${hashDup}` : "content hash is unique" };
  const words = text.split(/\s+/).filter(Boolean).length;
  gates.words = { passed: words >= 300, detail: `${words} words of main content` };
  const blocked: string[] = [];
  if (gates.evidence && !gates.evidence.passed) blocked.push(`blocked: insufficient evidence (${gates.evidence.detail})`);
  if (!gates.unique.passed) blocked.push(`blocked: below 40% unique content (${Math.round(share * 100)}%)`);
  if (hashDup) blocked.push(`blocked: duplicate content (same as ${hashDup})`);
  if (gates.duplicate_intent && !gates.duplicate_intent.passed) blocked.push(`blocked: duplicate intent (${gates.duplicate_intent.detail})`);
  return { gates, blocked: blocked[0] ?? null, hash, share };
}

/**
 * Edits the title, description, first-screen answer and FAQ. The gates run again on the new
 * text and the content hash is stored; a page that now fails a blocking gate drops to draft and
 * out of the index (the generator's rule), while a clean edit keeps the page's status.
 */
export async function editPageContent(actor: ContentActor, id: string, edit: PageEdit): Promise<{ blocked: string | null; gates: GateResults }> {
  assertContentRole(actor);
  const title = requireText(edit.title, "a title", 120);
  if (title.length < 10) throw new AdminError("The title needs at least 10 characters.", "bad_title");
  const metaDescription = requireText(edit.metaDescription, "a meta description", 320);
  if (metaDescription.length < 40) throw new AdminError("The meta description needs at least 40 characters.", "bad_description");
  const intro = requireText(edit.intro, "the first-screen answer", 2000);
  const faq = edit.faq.map((f) => ({ question: requireText(f.question, "a question", 300), answer: requireText(f.answer, "an answer", 2000) }));
  return tx(async (client) => {
    const page = await lockPage(client, id);
    const content: SeoContent = { ...page.content, intro: { ...page.content.intro, answer: intro }, faq };
    const { gates, blocked, hash, share } = await regate(client, page, content);
    // Two pages may never share a hash (unique index): a duplicate edit is refused, as the generator skips one.
    if (!gates.duplicate_content!.passed) throw new AdminError(`Nothing was saved: the edited text is identical to another page (${gates.duplicate_content!.detail}).`, "duplicate");
    const dropsOut = !!blocked && (page.status === "published" || page.status === "ready");
    await client.query(
      `update seo_pages set title = $2, meta_description = $3, content = $4::jsonb, content_hash = $5, unique_share = $6, gate_results = $7::jsonb, blocked_reason = $8,
         status = case when $9 then 'draft' else status end, indexable = case when $9 then false else indexable end
       where id = $1`,
      [id, title, metaDescription, JSON.stringify(content), hash, share, JSON.stringify(gates), blocked, dropsOut],
    );
    if (dropsOut) await rebuildLinks(client);
    await audit(
      {
        actorType: "admin",
        actorId: actor.userId,
        action: "content.page.edit",
        entity: "seo_page",
        entityId: id,
        before: { title: page.title, meta_description: page.meta_description, content_hash: page.content_hash, status: page.status, blocked_reason: page.blocked_reason },
        after: { title, meta_description: metaDescription, content_hash: hash, faq_items: faq.length, blocked_reason: blocked, status: dropsOut ? "draft" : page.status, url: page.url },
        ip: actor.ip ?? null,
      },
      client,
    );
    return { blocked, gates };
  });
}

/** The --only key generateFamily expects for a page, from its URL. */
export function regenerateKey(family: SeoFamily, url: string): string | null {
  const parts = url.split("/").filter(Boolean);
  switch (family) {
    case "state":
      return parts[1] ?? null;
    case "city":
      return parts[1] && parts[2] ? `${parts[1]}/${parts[2]}` : null;
    case "zip":
      return parts[3] ?? null;
    case "route":
    case "service":
    case "question":
    case "planning":
      return parts[1] ?? null;
    default:
      return null;
  }
}

/**
 * Regenerates one page from its brief with the current data (generateFamily --only), keeping its
 * media claims as the generator does. Cost pages regenerate as a family from the dashboard.
 */
export async function regeneratePage(actor: ContentActor, id: string): Promise<{ url: string; status: SeoStatus; blocked_reason: string | null }> {
  assertContentRole(actor);
  const db = getPool();
  const page = (await db.query<{ url: string; family: SeoFamily; status: SeoStatus; content_hash: string }>("select url, family, status, content_hash from seo_pages where id = $1", [id])).rows[0];
  if (!page) throw new AdminError("Page not found.", "not_found");
  const only = regenerateKey(page.family, page.url);
  if (!only) throw new AdminError(`${page.family} pages regenerate as a family from the publication dashboard.`, "unsupported");
  const lines: string[] = [];
  const summary = await generateFamily(db, page.family, { only: [only], limit: 1, media: await claimableMedia(db), log: (l) => lines.push(l) });
  const after = (await db.query<{ status: SeoStatus; blocked_reason: string | null; content_hash: string }>("select status, blocked_reason, content_hash from seo_pages where id = $1", [id])).rows[0];
  if (!after) throw new AdminError("The page no longer exists.", "not_found");
  if (!summary.written) throw new AdminError(`The generator wrote nothing: ${lines.join("; ") || "the page's brief produced no candidate"}.`, "not_written");
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.page.regenerate", entity: "seo_page", entityId: id, before: { status: page.status, content_hash: page.content_hash }, after: { status: after.status, blocked_reason: after.blocked_reason, content_hash: after.content_hash, url: page.url }, ip: actor.ip ?? null });
  return { url: page.url, status: after.status, blocked_reason: after.blocked_reason };
}

// ================================================================== redirects

/** Adds a 301 for a retired URL. One hop: the target must be a page or hub that exists and not itself a redirect source. */
export async function addRedirect(actor: ContentActor, input: { sourceUrl: string; targetUrl: string; reason: string }): Promise<void> {
  assertContentRole(actor);
  const sourceUrl = requireText(input.sourceUrl, "the old URL", 300);
  const targetUrl = requireText(input.targetUrl, "the new URL", 300);
  const reason = requireText(input.reason, "the reason", 300);
  if (!/^\/[a-z0-9/-]*\/$/.test(sourceUrl) || !/^\/[a-z0-9/-]*\/$/.test(targetUrl)) throw new AdminError("URLs are lowercase paths with a leading and trailing slash, such as /movers/texas/.", "bad_url");
  if (sourceUrl === targetUrl) throw new AdminError("The old and new URLs are the same.", "bad_url");
  await tx(async (client) => {
    const live = (await client.query("select 1 from seo_pages where url = $1 and status = 'published'", [sourceUrl])).rowCount;
    if (live) throw new AdminError("The old URL is a published page; unpublish it first.", "live_source");
    if ((await client.query("select 1 from seo_redirects where source_url = $1", [targetUrl])).rowCount) throw new AdminError("The new URL is itself redirected; point at its final target (one hop).", "chain");
    const targetKnown = HUB_URLS.has(targetUrl) || STATIC_LINK_PREFIXES.some((p) => targetUrl.startsWith(p) && !isSeoUrl(targetUrl)) || (await client.query("select 1 from seo_pages where url = $1 and status = 'published'", [targetUrl])).rowCount;
    if (!targetKnown) throw new AdminError("The new URL must be a published page or a hub.", "bad_target");
    await client.query("insert into seo_redirects (source_url, target_url, reason) values ($1, $2, $3) on conflict (source_url) do update set target_url = excluded.target_url, reason = excluded.reason", [sourceUrl, targetUrl, reason]);
    await client.query("update seo_redirects set target_url = $2 where target_url = $1", [sourceUrl, targetUrl]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.redirect.add", entity: "seo_redirect", entityId: sourceUrl, after: { target_url: targetUrl, reason }, ip: actor.ip ?? null }, client);
  });
}

export async function listRedirects(db: Queryable = getPool()): Promise<{ source_url: string; target_url: string; reason: string; created_at: Date }[]> {
  return (await db.query<{ source_url: string; target_url: string; reason: string; created_at: Date }>("select source_url, target_url, reason, created_at from seo_redirects order by created_at desc limit 500")).rows;
}

// ================================================================== bulk actions

/** Publishes every ready page (optionally of one family), through the pipeline's publisher. */
export async function bulkPublishReady(actor: ContentActor, input: { family?: string | null; limit?: number | null } = {}): Promise<{ published: number; indexable: number; links: number }> {
  assertContentRole(actor);
  const family = input.family && isSeoFamily(input.family) ? input.family : undefined;
  const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100_000) : undefined;
  const lines: string[] = [];
  const summary = await tx(async (client) => {
    const result = await publishPages(client, { status: "ready", family, limit, log: (l) => lines.push(l) });
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.bulk.publish", entity: "seo_page", entityId: family ?? "all", after: { ...result, family: family ?? null, limit: limit ?? null }, ip: actor.ip ?? null }, client);
    return result;
  });
  return summary;
}

/** Marks every page matching the filters as reviewed by the named person. */
export async function bulkMarkReviewed(actor: ContentActor, filters: ContentFilters, reviewer: string | null | undefined): Promise<number> {
  assertContentRole(actor);
  const name = requireText(reviewer, "the reviewer's name", 120);
  const { clause, values } = contentWhere(filters);
  return tx(async (client) => {
    const result = await client.query<{ id: string }>(`update seo_pages set reviewed_by = $${values.length + 1}, last_reviewed_at = now() ${clause} returning id::text`, [...values, name]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.bulk.review", entity: "seo_page", entityId: "filtered", after: { reviewed_by: name, pages: result.rowCount ?? 0, filters: { ...filters, limit: undefined, offset: undefined } }, ip: actor.ip ?? null }, client);
    return result.rowCount ?? 0;
  });
}

// ================================================================== research

export interface ResearchFilters {
  kind?: string | null;
  family?: string | null;
  source?: string | null;
  market?: string | null;
  measured?: "yes" | "no" | "" | null;
  assigned?: "yes" | "no" | "unassigned-questions" | "" | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

export interface ResearchRow {
  id: number;
  kind: string;
  keyword: string;
  intent: string | null;
  geography: string | null;
  family: string | null;
  target_url: string | null;
  volume: number | null;
  difficulty: number | null;
  cpc_cents: number | null;
  market: string;
  source: string;
  source_file: string;
  researched_on: Date | null;
  priority: string | null;
  notes: string | null;
  imported_at: Date;
  hypothesis: boolean;
  /** The page row the target URL points at, when one exists. */
  page_id: string | null;
  page_status: string | null;
}

export async function listResearch(filters: ResearchFilters = {}, db: Queryable = getPool()): Promise<{ rows: ResearchRow[]; total: number; sources: string[]; markets: string[] }> {
  const parts: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    parts.push(sql.replace(/\?/g, `$${values.length}`));
  };
  if (filters.kind === "keyword" || filters.kind === "question") add("r.kind = ?", filters.kind);
  if (filters.family && isSeoFamily(filters.family)) add("r.family = ?", filters.family);
  if (filters.source) add("r.source = ?", filters.source);
  if (filters.market) add("r.market = ?", filters.market);
  if (filters.measured === "yes") parts.push("r.volume is not null");
  if (filters.measured === "no") parts.push("r.volume is null");
  if (filters.assigned === "yes") parts.push("p.id is not null");
  if (filters.assigned === "no") parts.push("p.id is null");
  if (filters.assigned === "unassigned-questions") parts.push("r.kind = 'question' and p.id is null");
  if (filters.q) add("(r.keyword ilike ? or coalesce(r.target_url, '') ilike ? or coalesce(r.geography, '') ilike ?)", `%${filters.q.replace(/[%_]/g, "")}%`);
  const clause = parts.length ? `where ${parts.join(" and ")}` : "";
  const from = `from seo_research r left join seo_pages p on p.url = r.target_url ${clause}`;
  const total = await db.query<{ n: number }>(`select count(*)::int as n ${from}`, values);
  const rows = await db.query<Omit<ResearchRow, "hypothesis">>(
    `select r.id, r.kind, r.keyword, r.intent, r.geography, r.family, r.target_url, r.volume, r.difficulty, r.cpc_cents, r.market, r.source, r.source_file, r.researched_on, r.priority, r.notes, r.imported_at,
            p.id::text as page_id, p.status as page_status
     ${from} order by r.volume desc nulls last, r.keyword limit $${values.length + 1} offset $${values.length + 2}`,
    [...values, filters.limit ?? 50, filters.offset ?? 0],
  );
  const sources = await db.query<{ source: string }>("select distinct source from seo_research order by 1");
  const markets = await db.query<{ market: string }>("select distinct market from seo_research order by 1");
  return {
    rows: rows.rows.map((r) => ({ ...r, hypothesis: r.volume === null || (r.priority ?? "").includes("hypothesis") })),
    total: total.rows[0]?.n ?? 0,
    sources: sources.rows.map((r) => r.source),
    markets: markets.rows.map((r) => r.market),
  };
}

export interface ResearchSummary {
  total: number;
  keywords: number;
  questions: number;
  measured: number;
  hypothesis: number;
  assigned: number;
  unassignedQuestions: number;
  files: { source_file: string; rows: number; last_import: Date }[];
}

export async function researchSummary(db: Queryable = getPool()): Promise<ResearchSummary> {
  const totals = await db.query<{ total: number; keywords: number; questions: number; measured: number; assigned: number; unassigned_questions: number }>(
    `select count(*)::int as total, count(*) filter (where r.kind = 'keyword')::int as keywords, count(*) filter (where r.kind = 'question')::int as questions,
            count(*) filter (where r.volume is not null)::int as measured, count(*) filter (where p.id is not null)::int as assigned,
            count(*) filter (where r.kind = 'question' and p.id is null)::int as unassigned_questions
     from seo_research r left join seo_pages p on p.url = r.target_url`,
  );
  const files = await db.query<{ source_file: string; rows: number; last_import: Date }>("select source_file, count(*)::int as rows, max(imported_at) as last_import from seo_research group by source_file order by source_file");
  const t = totals.rows[0]!;
  return { total: t.total, keywords: t.keywords, questions: t.questions, measured: t.measured, hypothesis: t.total - t.measured, assigned: t.assigned, unassignedQuestions: t.unassigned_questions, files: files.rows };
}

/** The research CSVs committed in the repository (importable without an upload). */
export const KNOWN_RESEARCH_FILES = ["docs/research/keyword-inventory.csv", "docs/research/question-library.csv", "docs/research/competitor-gaps.csv", "docs/research/mover-leads-b2b.csv", "docs/seo/keyword-to-page-map.csv"] as const;

/** Imports an uploaded CSV (kept under its own name, which becomes source_file) through the pipeline's importer. */
export async function importResearchCsv(actor: ContentActor, input: { fileName: string; text: string }): Promise<{ read: number; imported: number; skipped: number; file: string }> {
  assertContentRole(actor);
  const name = basename(input.fileName).replace(/[^A-Za-z0-9._-]/g, "-");
  if (!name.toLowerCase().endsWith(".csv")) throw new AdminError("Upload a .csv file.", "bad_type");
  if (!input.text.trim()) throw new AdminError("The file is empty.", "bad_file");
  if (input.text.length > 20_000_000) throw new AdminError("The file is larger than 20 MB.", "too_large");
  const dir = join(tmpdir(), "amc-research", randomUUID());
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, input.text);
  const lines: string[] = [];
  const result = await importResearch(getPool(), path, (l) => lines.push(l));
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.research.import", entity: "seo_research", entityId: name, after: { ...result, log: lines.slice(0, 20) }, ip: actor.ip ?? null });
  return { ...result, file: name };
}

/** Imports one of the committed research CSVs. */
export async function importKnownResearchFile(actor: ContentActor, file: string): Promise<{ read: number; imported: number; skipped: number; file: string }> {
  assertContentRole(actor);
  if (!(KNOWN_RESEARCH_FILES as readonly string[]).includes(file)) throw new AdminError("Choose one of the committed research files.", "bad_file");
  const path = resolveUnderRepo(file);
  if (!existsSync(path)) throw new AdminError(`${file} is not on this server.`, "not_found");
  const lines: string[] = [];
  const result = await importResearch(getPool(), path, (l) => lines.push(l));
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.research.import", entity: "seo_research", entityId: basename(file), after: { ...result, log: lines.slice(0, 20) }, ip: actor.ip ?? null });
  return { ...result, file };
}

/** Points a research row (a question, usually) at a page URL, or clears the assignment. */
export async function assignResearch(actor: ContentActor, id: number, targetUrl: string | null, family?: string | null): Promise<void> {
  assertContentRole(actor);
  const url = cleanText(targetUrl, 300);
  if (url && !/^\/[a-z0-9/-]*\/$/.test(url)) throw new AdminError("Enter a page URL such as /questions/how-much-do-movers-cost/.", "bad_url");
  const fam = family && isSeoFamily(family) ? family : null;
  await tx(async (client) => {
    const row = (await client.query<{ id: number; target_url: string | null; family: string | null; keyword: string }>("select id, target_url, family, keyword from seo_research where id = $1 for update", [id])).rows[0];
    if (!row) throw new AdminError("Research row not found.", "not_found");
    await client.query("update seo_research set target_url = $2, family = coalesce($3, family) where id = $1", [id, url, fam]);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.research.assign", entity: "seo_research", entityId: String(id), before: { target_url: row.target_url, family: row.family }, after: { target_url: url, family: fam ?? row.family, keyword: row.keyword }, ip: actor.ip ?? null }, client);
  });
}

// ================================================================== pipeline steps as jobs

export const PIPELINE_STEPS = ["import_geo", "import_research", "generate", "publish", "media_sync"] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const PIPELINE_STEP_LABELS: Record<PipelineStep, string> = {
  import_geo: "Import geo entities and facts",
  import_research: "Import research CSVs",
  generate: "Generate a family",
  publish: "Publish ready pages",
  media_sync: "Sync media claims to the manifest",
};

export interface PipelineStepInput {
  step: PipelineStep;
  family?: string | null;
  limit?: number | null;
  /** Research files to import (from KNOWN_RESEARCH_FILES). */
  files?: string[] | null;
  /** Publish: the status to publish from. */
  status?: "ready" | "review" | "draft" | null;
}

export const pipelineJobName = (step: PipelineStep): string => `seo_${step}`;

/** The job definition for a step, built per request so the step's parameters travel with it. */
export function pipelineJob(input: PipelineStepInput, actorId: string): JobDefinition {
  const name = pipelineJobName(input.step);
  if (jobByName(name)) throw new AdminError(`A registered job already uses the name ${name}.`, "conflict");
  const family = input.family && isSeoFamily(input.family) ? input.family : null;
  const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 100_000) : undefined;
  const log: string[] = [];
  const push = (line: string) => {
    if (log.length < 200) log.push(line);
  };
  const details = (extra: Record<string, unknown>) => ({ ...extra, actor_id: actorId, log });
  const run = async () => {
    const db = getPool();
    switch (input.step) {
      case "import_geo": {
        const result = await importGeo(db, { log: push });
        return { items: Object.values(result).reduce<number>((sum, v) => sum + (typeof v === "number" ? v : 0), 0), details: details({ ...result }) };
      }
      case "import_research": {
        const files = (input.files ?? []).filter((f) => (KNOWN_RESEARCH_FILES as readonly string[]).includes(f));
        if (!files.length) throw new AdminError("Choose at least one research file.", "bad_file");
        const results: Record<string, unknown> = {};
        let items = 0;
        for (const file of files) {
          const r = await importResearch(db, resolveUnderRepo(file), push);
          results[file] = r;
          items += r.imported;
        }
        return { items, details: details({ files: results }) };
      }
      case "generate": {
        if (!family) throw new AdminError("Choose a family to generate.", "bad_family");
        const summary = await generateFamily(db, family, { limit, media: await claimableMedia(db), log: push });
        return { items: summary.written, details: details({ ...summary }) };
      }
      case "publish": {
        const summary = await publishPages(db, { status: input.status ?? "ready", family: family ?? undefined, limit, log: push });
        return { items: summary.published, details: details({ ...summary, family, status: input.status ?? "ready" }) };
      }
      case "media_sync": {
        const result = await syncMediaManifest(db);
        return { items: result.claimed, details: details({ ...result }) };
      }
    }
  };
  return { name, slug: name.replace(/_/g, "-"), label: PIPELINE_STEP_LABELS[input.step], description: `Pipeline step started from the admin.`, cronHourUtc: 0, run };
}

/**
 * Runs one pipeline step through the jobs runner (job_runs row, advisory lock, abandoned-run
 * sweep), recording who started it. The caller runs this after the response (never inline in a
 * request): see the app's publication actions.
 */
export async function runPipelineStep(actor: ContentActor, input: PipelineStepInput): Promise<JobRunOutcome> {
  assertContentRole(actor);
  if (!(PIPELINE_STEPS as readonly string[]).includes(input.step)) throw new AdminError("Unknown pipeline step.", "bad_step");
  const job = pipelineJob(input, actor.userId);
  const outcome = await runJob(job, { trigger: `admin:${actor.userId}` });
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.pipeline.run", entity: "job", entityId: job.name, after: { step: input.step, family: input.family ?? null, limit: input.limit ?? null, files: input.files ?? null, status: outcome.status, ...(outcome.status === "succeeded" ? { items: outcome.items } : outcome.status === "failed" ? { error: outcome.error } : { reason: outcome.reason }) }, ip: actor.ip ?? null });
  return outcome;
}

/** Records that a step was queued (the audit row the admin sees at once; the run writes its own when it finishes). */
export async function queuePipelineStep(actor: ContentActor, input: PipelineStepInput, db: Queryable = getPool()): Promise<{ jobName: string; running: boolean }> {
  assertContentRole(actor);
  if (!(PIPELINE_STEPS as readonly string[]).includes(input.step)) throw new AdminError("Unknown pipeline step.", "bad_step");
  if (input.step === "generate" && !(input.family && isSeoFamily(input.family))) throw new AdminError("Choose a family to generate.", "bad_family");
  if (input.step === "import_research" && !(input.files ?? []).length) throw new AdminError("Choose at least one research file.", "bad_file");
  const jobName = pipelineJobName(input.step);
  const running = await db.query("select 1 from job_runs where job_name = $1 and status = 'running' and started_at > now() - interval '15 minutes' limit 1", [jobName]);
  if (running.rowCount) throw new AdminError(`${PIPELINE_STEP_LABELS[input.step]} is already running.`, "already_running");
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.pipeline.queue", entity: "job", entityId: jobName, after: { step: input.step, family: input.family ?? null, limit: input.limit ?? null, files: input.files ?? null, status: input.status ?? null }, ip: actor.ip ?? null }, db);
  return { jobName, running: false };
}

export interface PipelineRun {
  id: string;
  job_name: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  items_processed: number | null;
  error: string | null;
  details: Record<string, unknown> | null;
}

/** The latest runs of the pipeline jobs. */
export async function listPipelineRuns(limit = 30, db: Queryable = getPool()): Promise<PipelineRun[]> {
  const names = PIPELINE_STEPS.map(pipelineJobName);
  const found = await db.query<PipelineRun>("select id::text, job_name, status, started_at, finished_at, items_processed, error, details from job_runs where job_name = any($1::text[]) order by started_at desc, id desc limit $2", [names, limit]);
  return found.rows;
}

// ================================================================== publication dashboard

export interface SitemapSegmentStatus {
  name: string;
  family: SeoFamily;
  files: number;
  urls: number;
  lastmod: Date | null;
}

export interface CrawlSummary {
  base: string | null;
  generatedAt: string | null;
  checks: { check: string; result: string }[];
  byPrefix: { prefix: string; pages: number }[];
  brokenLinks: string[];
  path: string;
}

export interface PublicationDashboard {
  counts: PipelineCounts[];
  totals: { pages: number; published: number; indexable: number; ready: number; review: number; draft: number; blocked: number; reviewed: number; hypothesis: number };
  blockedReasons: { reason: string; pages: number; families: Record<string, number> }[];
  sitemap: { segments: SitemapSegmentStatus[]; files: number; urls: number; lastBuild: Date | null };
  crawl: CrawlSummary | null;
  runs: PipelineRun[];
  running: string[];
}

/** Reads docs/seo/crawl-report.md (tools/seo-crawl.ts output) when it is on this server. */
export function readCrawlReport(path: string = resolveUnderRepo("docs/seo/crawl-report.md")): CrawlSummary | null {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf8");
  const base = /^# Crawl report: (\S+)/m.exec(text)?.[1] ?? null;
  const generatedAt = /^Generated (\S+) by/m.exec(text)?.[1] ?? null;
  const checks: CrawlSummary["checks"] = [];
  const summary = /## Summary\n([\s\S]*?)\n###/.exec(text)?.[1] ?? "";
  for (const line of summary.split("\n")) {
    const m = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/.exec(line.trim());
    if (m && m[1] !== "Check" && !/^-+$/.test(m[1]!)) checks.push({ check: m[1]!, result: m[2]! });
  }
  const byPrefix: CrawlSummary["byPrefix"] = [];
  const prefixes = /### Indexable pages by first path segment\n([\s\S]*?)\n## /.exec(text)?.[1] ?? "";
  for (const line of prefixes.split("\n")) {
    const m = /^- (\S+): (\d+)$/.exec(line.trim());
    if (m) byPrefix.push({ prefix: m[1]!, pages: Number(m[2]) });
  }
  const broken = /## Broken links\n([\s\S]*?)\n## /.exec(text)?.[1] ?? "";
  const brokenLinks = broken
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") && l !== "- none")
    .map((l) => l.slice(2));
  return { base, generatedAt, checks, byPrefix, brokenLinks, path };
}

export async function publicationDashboard(db: Queryable = getPool()): Promise<PublicationDashboard> {
  const counts = await pipelineCounts(db);
  const totals = (await db.query<{ pages: number; published: number; indexable: number; ready: number; review: number; draft: number; blocked: number; reviewed: number; hypothesis: number }>(
    `select count(*)::int as pages, count(*) filter (where status = 'published')::int as published, count(*) filter (where indexable)::int as indexable,
            count(*) filter (where status = 'ready')::int as ready, count(*) filter (where status = 'review')::int as review, count(*) filter (where status = 'draft')::int as draft,
            count(*) filter (where blocked_reason is not null)::int as blocked, count(*) filter (where last_reviewed_at is not null)::int as reviewed,
            count(*) filter (where coalesce(gate_results->'keyword'->>'detail', '') like 'hypothesis%')::int as hypothesis
     from seo_pages`,
  )).rows[0]!;
  const reasons = new Map<string, { pages: number; families: Record<string, number> }>();
  for (const c of counts) {
    for (const [reason, n] of Object.entries(c.blockedReasons)) {
      const entry = reasons.get(reason) ?? { pages: 0, families: {} };
      entry.pages += n;
      entry.families[c.family] = (entry.families[c.family] ?? 0) + n;
      reasons.set(reason, entry);
    }
  }
  const indexable = await db.query<{ family: SeoFamily; n: number; lastmod: Date }>("select family, count(*)::int as n, max(updated_at) as lastmod from seo_pages where status = 'published' and indexable group by family");
  const byFamily = new Map(indexable.rows.map((r) => [r.family, r]));
  const segments: SitemapSegmentStatus[] = SITEMAP_SEGMENTS.map((seg) => {
    const entry = byFamily.get(seg.family);
    const urls = entry?.n ?? 0;
    return { name: seg.name, family: seg.family, files: urls === 0 ? 0 : seg.chunked ? Math.ceil(urls / SITEMAP_CHUNK) : 1, urls, lastmod: entry?.lastmod ?? null };
  });
  const lastBuild = indexable.rows.reduce<Date | null>((max, r) => (!max || r.lastmod > max ? r.lastmod : max), null);
  const runs = await listPipelineRuns(30, db);
  return {
    counts,
    totals,
    blockedReasons: [...reasons.entries()].map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.pages - a.pages),
    // core.xml always exists; public company sitemaps were retired with central quote requests.
    sitemap: { segments, files: 1 + segments.reduce((sum, s) => sum + s.files, 0), urls: segments.reduce((sum, s) => sum + s.urls, 0), lastBuild },
    crawl: readCrawlReport(),
    runs,
    running: runs.filter((r) => r.status === "running").map((r) => r.job_name),
  };
}

// ================================================================== preferred-mover criteria

export interface PreferredCriterion {
  id: string;
  label: string;
  rule: string;
  /** Where the rule is written. */
  source: string;
}

/** The published screening standards (mover verification §3 and §4), in the order the badge text lists them. */
export const PREFERRED_CRITERIA: readonly PreferredCriterion[] = [
  { id: "approved", label: "Passed admin review", rule: "Company status is approved (verification complete, callback made, not suspended).", source: "mover-verification-and-reviews.md §3 workflow, §4" },
  { id: "usdot", label: "Active USDOT registration", rule: "A USDOT number is on file and the latest USDOT check passed (status active, not out of service).", source: "§3 automated checks: USDOT record exists and is active" },
  { id: "carrier", label: "Household-goods carrier authority, no broker authority", rule: "The latest authority-type check passed, the authority is granted and active, and no broker authority is on the record.", source: "§3 authority type and status; §4 public definition" },
  { id: "insurance", label: "Required insurance on file", rule: "The latest insurance-filings check passed and a verified insurance certificate has not expired.", source: "§3 insurance filings and insurance certificate" },
  { id: "terms", label: "Agreed to the movers-only terms", rule: "A terms acceptance by an authorized representative is recorded.", source: "§4 public definition; onboarding (migration 140)" },
  { id: "mc", label: "MC number (while required)", rule: "An MC/docket number is on file when the require_mc_number setting is on.", source: "company_can_purchase (migration 001); compliance facts §1" },
];

export interface PreferredEvidence {
  company_id: string;
  legal_name: string;
  slug: string | null;
  status: string;
  usdot_number: string | null;
  mc_number: string | null;
  has_broker_authority: boolean;
  credentials_valid_until: Date | null;
  can_purchase: boolean;
  checks: Partial<Record<CheckType, { result: string; retrieved_at: Date; source: string }>>;
  insurance: { status: string; expires_on: Date | null; verified_at: Date | null } | null;
  terms: { terms_version: string; accepted_at: Date } | null;
  criteria: Record<string, boolean>;
  meets: boolean;
  /** Criteria not met, in words, for the table. */
  missing: string[];
}

/** Which approved or suspended companies meet every published criterion, with the evidence rows behind each verdict. No ranking. */
export async function preferredMoverEvidence(db: Queryable = getPool()): Promise<{ companies: PreferredEvidence[]; requireMc: boolean }> {
  const requireMc = (await db.query<{ v: boolean }>("select setting_bool('require_mc_number', true) as v")).rows[0]?.v ?? true;
  const rows = await db.query<{
    company_id: string;
    legal_name: string;
    slug: string | null;
    status: string;
    usdot_number: string | null;
    mc_number: string | null;
    has_broker_authority: boolean;
    credentials_valid_until: Date | null;
    can_purchase: boolean;
    checks: { check_type: CheckType; result: string; retrieved_at: Date; source: string }[] | null;
    insurance: { status: string; expires_on: Date | null; verified_at: Date | null } | null;
    terms: { terms_version: string; accepted_at: Date } | null;
  }>(
    `select c.id as company_id, c.legal_name, pr.slug, c.status::text, c.usdot_number, c.mc_number, c.has_broker_authority, c.credentials_valid_until, company_can_purchase(c) as can_purchase,
            (select jsonb_agg(jsonb_build_object('check_type', x.check_type, 'result', x.result, 'retrieved_at', x.retrieved_at, 'source', x.source)) from (
               select distinct on (check_type) check_type, result, retrieved_at, source from verification_checks v where v.company_id = c.id order by check_type, created_at desc, retrieved_at desc) x) as checks,
            (select jsonb_build_object('status', cr.status, 'expires_on', cr.expires_on, 'verified_at', cr.verified_at) from credentials cr
               where cr.company_id = c.id and cr.credential_type = 'insurance_coi' order by (cr.status = 'verified') desc, cr.expires_on desc nulls last, cr.updated_at desc limit 1) as insurance,
            (select jsonb_build_object('terms_version', t.terms_version, 'accepted_at', t.accepted_at) from mover_terms_acceptances t where t.company_id = c.id order by t.accepted_at desc limit 1) as terms
     from companies c left join company_profiles pr on pr.company_id = c.id
     where c.status in ('approved', 'suspended') order by c.legal_name`,
  );
  const today = new Date().toISOString().slice(0, 10);
  const companies = rows.rows.map((r) => {
    const checks: PreferredEvidence["checks"] = {};
    for (const ch of r.checks ?? []) checks[ch.check_type] = { result: ch.result, retrieved_at: ch.retrieved_at, source: ch.source };
    const pass = (t: CheckType) => checks[t]?.result === "pass";
    const insuranceExpiry = r.insurance?.expires_on ? new Date(r.insurance.expires_on).toISOString().slice(0, 10) : null;
    const criteria: Record<string, boolean> = {
      approved: r.status === "approved",
      usdot: !!r.usdot_number && pass("usdot_active"),
      carrier: !r.has_broker_authority && pass("authority_type") && pass("authority_status"),
      insurance: pass("insurance_filings") && r.insurance?.status === "verified" && (!insuranceExpiry || insuranceExpiry >= today),
      terms: !!r.terms,
      mc: !requireMc || !!r.mc_number,
    };
    const missing = PREFERRED_CRITERIA.filter((c) => !criteria[c.id]).map((c) => c.label);
    return { ...r, checks, criteria, meets: missing.length === 0, missing };
  });
  return { companies, requireMc };
}

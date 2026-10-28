/**
 * Admin content management (packages/server/src/admin/content.ts, content-media.ts): role checks,
 * workflow transitions and gates, edits that re-run the gates, the media one-page rule, uploads,
 * bulk publish and review, redirects, research import, pipeline jobs and the dashboards.
 */
import { buildSeedSql } from "@amc/db/seed/build";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AdminError } from "../src/admin/common";
import {
  addRedirect,
  assignResearch,
  bulkMarkReviewed,
  bulkPublishReady,
  editPageContent,
  getContentPage,
  importResearchCsv,
  listContentPages,
  listResearch,
  markPageReviewed,
  parseFaqText,
  preferredMoverEvidence,
  publicationDashboard,
  queuePipelineStep,
  readCrawlReport,
  regenerateKey,
  researchSummary,
  runPipelineStep,
  setPageIndexable,
  setPageStatus,
  transitionProblem,
} from "../src/admin/content";
import { claimableMedia, configureMediaRoot, getMediaAsset, largestTierWidth, listMedia, orientationTag, readManifest, reassignMedia, rejectMedia, restoreMedia, syncMediaManifest, uploadMedia } from "../src/admin/content-media";
import { resolvePageMedia } from "../src/media/manifest";
import { canManageContent, type ContentActor } from "../src/admin/content-roles";
import { closePool, getPool } from "../src/db/pool";
import { mainText, sha256 } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";
import { createUser, resetDatabase } from "./helpers";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

const pool = () => getPool();

let editor: ContentActor;
let ops: ContentActor;
let finance: ContentActor;

const auditCount = async (action: string, entityId?: string) =>
  (await pool().query<{ n: number }>("select count(*)::int as n from audit_log where action = $1 and ($2::text is null or entity_id = $2)", [action, entityId ?? null])).rows[0]!.n;

async function expectAdminError(promise: Promise<unknown>, code?: string): Promise<AdminError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AdminError);
    if (code) expect((error as AdminError).code).toBe(code);
    return error as AdminError;
  }
  throw new Error("expected an AdminError");
}

const WORDS = "movers in this place handle local and long-distance moves with written estimates, binding quotes, inventory lists, valuation coverage and delivery windows that the federal rules describe for interstate household goods".split(" ");

/** Distinct filler so every fixture page clears the uniqueness gate against the others. */
function filler(seed: string, sentences = 40): string {
  const out: string[] = [];
  for (let i = 0; i < sentences; i++) {
    const start = (seed.length * 7 + i * 13) % WORDS.length;
    out.push(`${seed} ${i}: ${WORDS.slice(start, start + 9).join(" ")} ${WORDS[(start + i) % WORDS.length]}.`);
  }
  return out.join(" ");
}

function content(seed: string, related: { href: string; label: string; relation: string }[] = []): SeoContent {
  return {
    version: 1,
    intro: { answer: `${seed} first-screen answer. ${filler(`${seed}-intro`, 6)}`, dataPoints: [{ label: "ZIP codes", value: "12", basis: "GeoNames ZIP data" }] },
    sections: [
      { id: "coverage", heading: `Coverage for ${seed}`, blocks: [{ type: "paragraph", text: filler(`${seed}-coverage`) }] },
      { id: "rules", heading: `Rules for ${seed}`, blocks: [{ type: "list", items: [filler(`${seed}-a`, 3), filler(`${seed}-b`, 3)] }] },
    ],
    faq: [{ question: `How many movers cover ${seed}?`, answer: filler(`${seed}-faq`, 3) }],
    related: [{ heading: "Related", links: related }],
    quote: { entry: "household", heading: "See which movers cover your move", text: "Start the survey.", cta: "Start" },
    schemaType: "WebPage",
    credits: [],
    dataAsOf: "2026-10-28",
  };
}

interface PageInput {
  url: string;
  family: string;
  keyword: string;
  status?: string;
  blocked?: string | null;
  gates?: Record<string, { passed: boolean; detail: string }>;
  related?: { href: string; label: string; relation: string }[];
  parent?: string | null;
  state?: string | null;
  mediaIds?: string[];
}

async function insertPage(input: PageInput): Promise<string> {
  const seed = input.url.replace(/\//g, " ").trim();
  const body = content(seed, input.related);
  const hash = sha256(mainText(body));
  const gates = input.gates ?? {
    evidence: { passed: true, detail: "6 data-backed facts; 6 needed" },
    unique: { passed: true, detail: "80% of 5-word shingles unique within the family; 40% needed" },
    duplicate_content: { passed: true, detail: "content hash is unique" },
    duplicate_intent: { passed: true, detail: "keyword and intent are unique" },
    keyword: { passed: true, detail: "hypothesis: no measured volume for this keyword" },
    words: { passed: true, detail: "400 words of main content" },
  };
  const row = await pool().query<{ id: string }>(
    `insert into seo_pages (url, slug, family, state_code, primary_keyword, primary_keyword_normalized, intent, parent_url, title, meta_description, h1, status, indexable, content, content_hash,
       unique_share, evidence_count, sources, media_ids, blocked_reason, gate_results, canonical_url, published_at)
     values ($1, $2, $3, $4, $5, $5, 'commercial', $6, $7, $8, $9, $10, $11, $12::jsonb, $13, 0.8, 6, '[]'::jsonb, $14::jsonb, $15, $16::jsonb, $1, case when $10 = 'published' then now() else null end)
     returning id::text`,
    [
      input.url,
      input.url.split("/").filter(Boolean).pop(),
      input.family,
      input.state ?? null,
      input.keyword,
      input.parent ?? null,
      `Movers for ${seed} — test page title`,
      `A test meta description for ${seed} that is long enough to satisfy the store's length check.`,
      `Movers for ${seed}`,
      input.status ?? "draft",
      input.status === "published" && !input.blocked,
      JSON.stringify(body),
      hash,
      JSON.stringify(input.mediaIds ?? []),
      input.blocked ?? null,
      JSON.stringify(gates),
    ],
  );
  return row.rows[0]!.id;
}

const pageRow = async (id: string) =>
  (await pool().query<{ status: string; indexable: boolean; canonical_url: string; published_at: Date | null; content_hash: string; blocked_reason: string | null; media_ids: string[]; reviewed_by: string | null; last_reviewed_at: Date | null; gate_results: Record<string, { passed: boolean; detail: string }> }>(
    "select status, indexable, canonical_url, published_at, content_hash, blocked_reason, media_ids, reviewed_by, last_reviewed_at, gate_results from seo_pages where id = $1",
    [id],
  )).rows[0]!;

let webRoot: string;

async function makePng(width: number, height: number, color: { r: number; g: number; b: number }): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({ create: { width, height, channels: 3, background: color } }).png().toBuffer();
}

beforeAll(async () => {
  await resetDatabase();
  const seed = await buildSeedSql({
    adminEmail: "admin@demo.invalid",
    adminPassword: "test-admin-password",
    moverEmail: "owner@demo-lone-star.invalid",
    moverPassword: "test-mover-password",
    bcryptCost: 4,
  });
  await pool().query(seed.sql);
  editor = { userId: await createUser({ email: "editor@test.invalid", admin: "content_editor" }), adminRole: "content_editor", ip: "203.0.113.9" };
  ops = { userId: await createUser({ email: "ops@test.invalid", admin: "ops" }), adminRole: "ops", ip: null };
  finance = { userId: await createUser({ email: "finance@test.invalid", admin: "finance" }), adminRole: "finance", ip: null };

  // A throwaway apps/web with a three-asset manifest, so the real manifest is never touched.
  webRoot = join(mkdtempSync(join(tmpdir(), "amc-content-")), "web");
  mkdirSync(join(webRoot, "content", "media"), { recursive: true });
  mkdirSync(join(webRoot, "public", "media", "images"), { recursive: true });
  const sharp = (await import("sharp")).default;
  for (const id of ["state-texas-hero", "state-texas-card", "home-hero-still"]) {
    await sharp({ create: { width: 1344, height: 752, channels: 3, background: { r: 10, g: 20 + id.length, b: 30 } } }).webp().toFile(join(webRoot, "public", "media", "images", `${id}-1600.webp`));
    await sharp({ create: { width: 800, height: 448, channels: 3, background: { r: 10, g: 20 + id.length, b: 30 } } }).webp().toFile(join(webRoot, "public", "media", "images", `${id}-800.webp`));
  }
  const asset = (id: string, tags: string[], usedOn: string[]) => ({
    id,
    kind: "image",
    src: `/media/images/${id}-1600.webp`,
    srcset: [
      { src: `/media/images/${id}-1600.webp`, width: 1344 },
      { src: `/media/images/${id}-800.webp`, width: 800 },
    ],
    width: 1344,
    height: 752,
    alt: `${id} alt`,
    credit: { creator: "American Moving Choice (AI-generated via Higgsfield)", source_url: "https://example.invalid/x", license: "Generated for AMC; not stock", attribution_required: false },
    tags,
    usedOn,
    generator: { provider: "higgsfield", model: "gpt_image_2_5", prompt: `${id} prompt` },
  });
  writeFileSync(
    join(webRoot, "content", "media", "manifest.json"),
    JSON.stringify({ version: 1, assets: [asset("state-texas-hero", ["state", "state:TX", "hero", "landscape"], []), asset("state-texas-card", ["state", "state:TX", "card", "landscape"], []), asset("home-hero-still", ["home", "hero", "landscape"], ["/"])] }, null, 2),
  );
  configureMediaRoot(webRoot);
});

afterAll(async () => {
  configureMediaRoot(null);
  await closePool();
});

describe("roles", () => {
  it("allows super_admin, ops and content_editor and refuses the other admin roles", async () => {
    expect(canManageContent("super_admin")).toBe(true);
    expect(canManageContent("ops")).toBe(true);
    expect(canManageContent("content_editor")).toBe(true);
    expect(canManageContent("finance")).toBe(false);
    expect(canManageContent("moderator")).toBe(false);
    expect(canManageContent(null)).toBe(false);
    const id = await insertPage({ url: "/movers/alaska/", family: "state", keyword: "movers in alaska", state: "AK" });
    await expectAdminError(setPageStatus(finance, id, "review"), "forbidden");
    await expectAdminError(markPageReviewed(finance, id, "Someone"), "forbidden");
    await expectAdminError(bulkPublishReady(finance), "forbidden");
    await expectAdminError(reassignMedia(finance, "state-texas-hero", null), "forbidden");
    await expectAdminError(queuePipelineStep(finance, { step: "media_sync" }), "forbidden");
    expect((await pageRow(id)).status).toBe("draft");
    expect(await auditCount("content.page.status", id)).toBe(0);
  });
});

describe("workflow transitions and gates", () => {
  it("moves draft → review → ready → published, publishing with indexable, canonical and the link graph, and audits each step", async () => {
    const parent = await insertPage({ url: "/movers/texas/", family: "state", keyword: "movers in texas", state: "TX", status: "published" });
    const id = await insertPage({ url: "/movers/texas/austin/", family: "city", keyword: "movers in austin", state: "TX", parent: "/movers/texas/", related: [{ href: "/movers/texas/", label: "Texas movers", relation: "parent" }, { href: "/movers/texas/houston/", label: "Houston", relation: "sibling" }] });
    expect(transitionProblem({ status: "draft", blocked_reason: null, gate_results: {} }, "published")).toMatch(/can't move/);
    await expectAdminError(setPageStatus(editor, id, "published"), "bad_transition");

    expect((await setPageStatus(editor, id, "review")).to).toBe("review");
    expect((await pageRow(id)).status).toBe("review");
    expect((await setPageStatus(ops, id, "ready", "Checked the facts")).to).toBe("ready");
    const published = await setPageStatus(editor, id, "published");
    expect(published).toEqual({ url: "/movers/texas/austin/", from: "ready", to: "published" });
    const row = await pageRow(id);
    expect(row.status).toBe("published");
    expect(row.indexable).toBe(true);
    expect(row.canonical_url).toBe("/movers/texas/austin/");
    expect(row.published_at).not.toBeNull();
    // The link graph keeps only published targets: the breadcrumb and the parent link, not the unpublished sibling.
    const links = await pool().query<{ to_url: string; relation: string }>("select to_url, relation from seo_links where from_page_id = $1 order by relation", [id]);
    expect(links.rows.map((l) => `${l.relation}:${l.to_url}`)).toEqual(["breadcrumb:/movers/texas/", "parent:/movers/texas/"]);
    expect(await auditCount("content.page.status", id)).toBe(2);
    expect(await auditCount("content.page.publish", id)).toBe(1);
    const detail = await getContentPage(parent);
    expect(detail?.linksIn).toBe(2);
    expect(detail?.children).toBe(1);
  });

  it("refuses ready and published while a blocking gate fails, and unpublishing drops links and the index", async () => {
    const blocked = await insertPage({
      url: "/movers/texas/dallas/",
      family: "city",
      keyword: "movers in dallas",
      state: "TX",
      status: "review",
      blocked: "blocked: insufficient evidence (3 facts, 6 needed)",
      gates: { evidence: { passed: false, detail: "3 data-backed facts; 6 needed" }, unique: { passed: true, detail: "ok" }, keyword: { passed: true, detail: "hypothesis: none" }, words: { passed: false, detail: "120 words of main content" } },
    });
    const error = await expectAdminError(setPageStatus(editor, blocked, "ready"), "bad_transition");
    expect(error.message).toMatch(/insufficient evidence/);
    expect((await setPageStatus(editor, blocked, "draft")).to).toBe("draft");

    const austin = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/austin/'")).rows[0]!.id;
    const result = await setPageStatus(editor, austin, "draft", "Pulling for a rewrite");
    expect(result.from).toBe("published");
    const row = await pageRow(austin);
    expect(row.status).toBe("draft");
    expect(row.indexable).toBe(false);
    expect((await pool().query("select 1 from seo_links where from_page_id = $1", [austin])).rowCount).toBe(0);
    expect(await auditCount("content.page.unpublish", austin)).toBe(1);
  });

  it("toggles indexable only on published pages, with a reason in the audit log", async () => {
    const texas = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/'")).rows[0]!.id;
    await expectAdminError(setPageIndexable(editor, texas, false, ""), "missing_text");
    await setPageIndexable(editor, texas, false, "Thin until the regulator fact is verified");
    expect((await pageRow(texas)).indexable).toBe(false);
    await expectAdminError(setPageIndexable(editor, texas, false, "again"), "bad_status");
    await setPageIndexable(editor, texas, true, "Fact verified");
    expect((await pageRow(texas)).indexable).toBe(true);
    const entries = await pool().query<{ after: { reason: string } }>("select after from audit_log where action = 'content.page.indexable' and entity_id = $1 order by id", [texas]);
    expect(entries.rows.map((r) => r.after.reason)).toEqual(["Thin until the regulator fact is verified", "Fact verified"]);
    const draft = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/dallas/'")).rows[0]!.id;
    await expectAdminError(setPageIndexable(editor, draft, true, "Not published"), "bad_status");
  });

  it("records the reviewer and lists it in the inventory with the hypothesis flag and gate summary", async () => {
    const texas = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/'")).rows[0]!.id;
    await markPageReviewed(editor, texas, "Dana Reviewer");
    const row = await pageRow(texas);
    expect(row.reviewed_by).toBe("Dana Reviewer");
    expect(row.last_reviewed_at).not.toBeNull();
    const list = await listContentPages({ family: "state", reviewed: "yes" });
    expect(list.total).toBe(1);
    expect(list.rows[0]).toMatchObject({ url: "/movers/texas/", hypothesis: true, gates_passed: 6, gates_total: 6, gates_failed: [], media_count: 0 });
    const blocked = await listContentPages({ blocked: "yes", q: "dallas" });
    expect(blocked.rows.map((r) => r.gates_failed)).toEqual([["evidence", "words"]]);
    expect((await listContentPages({ state: "tx", status: "published" })).total).toBe(1);
    expect(await auditCount("content.page.review", texas)).toBe(1);
  });
});

describe("edits re-run the gates", () => {
  it("stores the new hash and gate results, and keeps a clean edit's status", async () => {
    const texas = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/'")).rows[0]!.id;
    const before = await pageRow(texas);
    const result = await editPageContent(editor, texas, {
      title: "Texas movers: licensed carriers by city",
      metaDescription: "Every Texas mover in the network by city, with coverage counts, the state regulator and the federal rules for interstate moves.",
      intro: "Texas has 254 counties and the network covers the largest metros first. " + filler("texas-edit", 4),
      faq: parseFaqText("How many movers cover Texas?\nFive movers list Texas for local moves.\n\nQ: Is a deposit normal?\nA: Small deposits are common; large ones are a warning sign."),
    });
    expect(result.blocked).toBeNull();
    const after = await pageRow(texas);
    expect(after.content_hash).not.toBe(before.content_hash);
    expect(after.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(after.status).toBe("published");
    expect(after.gate_results.duplicate_content?.passed).toBe(true);
    expect(after.gate_results.words?.detail).toMatch(/words of main content/);
    const detail = await getContentPage(texas);
    expect(detail?.page.content.faq).toEqual([
      { question: "How many movers cover Texas?", answer: "Five movers list Texas for local moves." },
      { question: "Is a deposit normal?", answer: "Small deposits are common; large ones are a warning sign." },
    ]);
    expect(await auditCount("content.page.edit", texas)).toBe(1);
    await expectAdminError(editPageContent(editor, texas, { title: "Short", metaDescription: "x".repeat(50), intro: "y", faq: [] }), "bad_title");
    expect(() => parseFaqText("Only a question?")).toThrow(AdminError);
  });

  it("refuses an edit that makes a page a duplicate, and drops a published page to draft when it falls below 40% unique", async () => {
    const a = await insertPage({ url: "/questions/what-is-a-binding-estimate/", family: "question", keyword: "binding estimate", status: "published" });
    const b = await insertPage({ url: "/questions/what-is-a-non-binding-estimate/", family: "question", keyword: "non binding estimate", status: "published" });
    const source = await getContentPage(a);
    const copy = source!.page.content;
    const before = await pageRow(b);
    // Make b's main text identical to a's: same intro, sections and FAQ. The store's unique hash index forbids it.
    await pool().query("update seo_pages set content = jsonb_set(content, '{sections}', $2::jsonb) where id = $1", [b, JSON.stringify(copy.sections)]);
    const dup = await expectAdminError(editPageContent(editor, b, { title: source!.page.title, metaDescription: source!.page.meta_description, intro: copy.intro.answer, faq: copy.faq }), "duplicate");
    expect(dup.message).toMatch(/same content hash as \/questions\/what-is-a-binding-estimate\//);
    expect((await pageRow(b)).content_hash).toBe(before.content_hash);
    // Nearly the same text (own FAQ) is stored, but the uniqueness gate fails and the page leaves the index.
    const result = await editPageContent(editor, b, { title: source!.page.title, metaDescription: source!.page.meta_description, intro: copy.intro.answer, faq: [{ question: "Is this different?", answer: "Only the FAQ differs from the other page." }] });
    expect(result.blocked).toMatch(/below 40% unique content/);
    const row = await pageRow(b);
    expect(row.status).toBe("draft");
    expect(row.indexable).toBe(false);
    expect(row.blocked_reason).toMatch(/below 40% unique content/);
    expect(row.gate_results.unique?.passed).toBe(false);
    expect(row.gate_results.duplicate_content?.passed).toBe(true);
    expect(row.content_hash).not.toBe(before.content_hash);
  });
});

describe("media: one asset, one page", () => {
  it("assigns, moves and unclaims assets, keeping seo_media_usage, media_ids and the manifest in step", async () => {
    const texas = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/'")).rows[0]!.id;
    const austin = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/austin/'")).rows[0]!.id;
    expect(await reassignMedia(editor, "state-texas-hero", "/movers/texas/")).toEqual({ from: null, to: "/movers/texas/" });
    expect((await pageRow(texas)).media_ids).toEqual(["state-texas-hero"]);
    expect((await readManifest()).assets.find((a) => a.id === "state-texas-hero")?.usedOn).toEqual(["/movers/texas/"]);
    // Moving it to Austin takes it away from Texas; the primary key never holds two pages.
    expect(await reassignMedia(editor, "state-texas-hero", "/movers/texas/austin/")).toEqual({ from: "/movers/texas/", to: "/movers/texas/austin/" });
    expect((await pageRow(texas)).media_ids).toEqual([]);
    expect((await pageRow(austin)).media_ids).toEqual(["state-texas-hero"]);
    const usage = await pool().query<{ page_id: string }>("select page_id::text from seo_media_usage where media_id = 'state-texas-hero'");
    expect(usage.rows).toEqual([{ page_id: austin }]);
    expect((await readManifest()).assets.find((a) => a.id === "state-texas-hero")?.usedOn).toEqual(["/movers/texas/austin/"]);
    // A direct second claim is refused by the database too.
    await expect(pool().query("insert into seo_media_usage (media_id, page_id) values ('state-texas-hero', $1)", [texas])).rejects.toThrow(/duplicate key/);
    // Static-page assets and unknown pages are refused.
    await expectAdminError(reassignMedia(editor, "home-hero-still", "/movers/texas/"), "static_use");
    await expectAdminError(reassignMedia(editor, "state-texas-card", "/movers/nowhere/"), "not_found");
    await expectAdminError(reassignMedia(editor, "state-texas-card", "/about/"), "bad_url");
    expect(await reassignMedia(editor, "state-texas-hero", null)).toEqual({ from: "/movers/texas/austin/", to: null });
    expect((await pageRow(austin)).media_ids).toEqual([]);
    expect((await readManifest()).assets.find((a) => a.id === "state-texas-hero")?.usedOn).toEqual([]);
    expect(await auditCount("content.media.assign", "state-texas-hero")).toBe(2);
    expect(await auditCount("content.media.unclaim", "state-texas-hero")).toBe(1);
    const library = await listMedia({ tag: "state:TX" });
    expect(library.total).toBe(2);
    expect(library.counts).toEqual({ unclaimed: 2, claimed: 0, static: 1, rejected: 0 });
    expect((await listMedia({ state: "static" })).rows.map((r) => r.id)).toEqual(["home-hero-still"]);
  });

  it("rejects an asset (hidden from claims, taken off its page) and restores it", async () => {
    await reassignMedia(editor, "state-texas-card", "/movers/texas/");
    await expectAdminError(rejectMedia(editor, "state-texas-card", ""), "missing_text");
    await rejectMedia(editor, "state-texas-card", "Text visible on the truck");
    const texas = (await pool().query<{ id: string }>("select id::text from seo_pages where url = '/movers/texas/'")).rows[0]!.id;
    expect((await pageRow(texas)).media_ids).toEqual([]);
    expect((await claimableMedia()).map((a) => a.id)).toEqual(["state-texas-hero", "home-hero-still"]);
    expect((await getMediaAsset("state-texas-card"))?.state).toBe("rejected");
    await expectAdminError(reassignMedia(editor, "state-texas-card", "/movers/texas/"), "rejected");
    await restoreMedia(editor, "state-texas-card");
    expect(await claimableMedia()).toHaveLength(3);
    expect((await getMediaAsset("state-texas-card"))?.state).toBe("unclaimed");
    expect(await auditCount("content.media.reject", "state-texas-card")).toBe(1);
    expect(await auditCount("content.media.restore", "state-texas-card")).toBe(1);
  });

  it("uploads an image into the library's tiers with required credit fields and refuses an identical file", async () => {
    const png = await makePng(1920, 1080, { r: 200, g: 120, b: 40 });
    const credit = { creator: "Jamie Photographer", sourceUrl: "https://example.invalid/photo", license: "CC BY 4.0", attributionRequired: true };
    await expectAdminError(uploadMedia(editor, { fileName: "crew.png", mimeType: "image/png", bytes: png, alt: "A crew loading a truck", tags: ["route"], credit: { ...credit, creator: "" } }), "missing_text");
    await expectAdminError(uploadMedia(editor, { fileName: "crew.png", mimeType: "image/gif", bytes: png, alt: "A crew loading a truck", tags: ["route"], credit }), "bad_type");
    vi.stubEnv("SUPABASE_URL", "https://media-project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
    vi.stubEnv("SUPABASE_MEDIA_BUCKET", "amc-media");
    const objects = new Map<string, Buffer>();
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(url)).pathname;
      if (init?.method === "GET") return Response.json({ id: "amc-media", public: true });
      if (init?.method === "POST") objects.set(path, Buffer.from(init.body as Uint8Array));
      return Response.json({ Key: path });
    });
    vi.stubGlobal("fetch", fetcher);
    const originalManifest = readFileSync(join(webRoot, "content", "media", "manifest.json"), "utf8");
    const asset = await uploadMedia(editor, { fileName: "Crew Loading.png", mimeType: "image/png", bytes: png, alt: "A crew loading a truck", tags: ["route", "theme:route"], credit, prompt: null });
    expect(asset.id).toMatch(/^upload-crew-loading-[0-9a-f]{16}$/);
    expect(asset.width).toBe(1344);
    expect(asset.height).toBe(756);
    expect(asset.tags).toEqual(["route", "theme:route", "landscape"]);
    expect(asset.state).toBe("unclaimed");
    expect(asset.credit).toEqual({ creator: "Jamie Photographer", source_url: "https://example.invalid/photo", license: "CC BY 4.0", attribution_required: true });
    const stored = (await readManifest()).assets.find((a) => a.id === asset.id)!;
    expect(stored.srcset?.map((s) => s.width)).toEqual([1344, 800]);
    expect(stored.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    expect(stored.upload?.sha256).toMatch(/^[0-9a-f]{64}$/);
    const sharp = (await import("sharp")).default;
    const small = objects.get(new URL(stored.srcset![1]!.src).pathname.replace("/object/public/", "/object/"))!;
    expect((await sharp(small).metadata()).width).toBe(800);
    expect(stored.src).toMatch(/^https:\/\/media-project.supabase.co\/storage\/v1\/object\/public\/amc-media\/uploads\//);
    expect(objects.size).toBe(2);
    expect(readFileSync(join(webRoot, "content", "media", "manifest.json"), "utf8")).toBe(originalManifest);
    const durable = (await pool().query<{ origin: string; n: number }>("select origin, jsonb_array_length(storage_objects) as n from media_assets where id = $1", [asset.id])).rows[0]!;
    expect(durable).toEqual({ origin: "upload", n: 2 });
    const dup = await expectAdminError(uploadMedia(editor, { fileName: "again.png", mimeType: "image/png", bytes: png, alt: "Same file again", tags: ["route"], credit }), "duplicate");
    expect(dup.message).toMatch(/upload-crew-loading/);
    // The library's own files count as known hashes too.
    const existing = readFileSync(join(webRoot, "public", "media", "images", "state-texas-hero-1600.webp"));
    await expectAdminError(uploadMedia(editor, { fileName: "hero.webp", mimeType: "image/webp", bytes: existing, alt: "Library file", tags: ["state"], credit }), "duplicate");
    expect(largestTierWidth(4000, 3000)).toBe(1168);
    expect(largestTierWidth(1024, 1024)).toBe(1024);
    expect(orientationTag(1000, 1000)).toBe("square");
    expect(orientationTag(900, 1200)).toBe("portrait");
    expect(await auditCount("content.media.upload", asset.id)).toBe(1);
    await reassignMedia(editor, asset.id, "/movers/texas/");
    expect((await resolvePageMedia("/movers/texas/", [asset.id]))[0]?.src).toBe(stored.src);
    expect(await resolvePageMedia("/movers/florida/", [asset.id])).toEqual([]);
    await rejectMedia(editor, asset.id, "Test editorial rejection");
    expect(await resolvePageMedia("/movers/texas/", [asset.id])).toEqual([]);
    await restoreMedia(editor, asset.id);
    expect(await resolvePageMedia("/movers/texas/", [asset.id])).toEqual([]);
    expect((await pool().query<{ origin: string }>("select origin from media_assets where id = $1", [asset.id])).rows[0]?.origin).toBe("upload");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not create a manifest entry on missing config, invalid bytes or a partial storage failure", async () => {
    const png = await makePng(1200, 700, { r: 21, g: 133, b: 240 });
    const input = { fileName: "failure.png", mimeType: "image/png", bytes: png, alt: "Crew beside a moving truck", tags: ["route"], credit: { creator: "AMC", license: "Owned", attributionRequired: false } };
    const before = (await pool().query<{ n: number }>("select count(*)::int as n from media_assets where origin = 'upload'")).rows[0]!.n;
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_MEDIA_BUCKET", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expectAdminError(uploadMedia(editor, input), "storage_not_configured");
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("SUPABASE_URL", "https://media-project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
    vi.stubEnv("SUPABASE_MEDIA_BUCKET", "amc-media");
    await expectAdminError(uploadMedia(editor, { ...input, mimeType: "image/jpeg" }), "bad_file");
    expect(fetcher).not.toHaveBeenCalled();
    let writes = 0;
    fetcher.mockImplementation(async (_url: string, init: RequestInit) => {
      if (init.method === "GET") return Response.json({ public: true });
      if (init.method === "POST" && ++writes === 2) return new Response("provider failure", { status: 503 });
      return Response.json({});
    });
    await expectAdminError(uploadMedia(editor, input), "storage_upload_failed");
    const cleanup = fetcher.mock.calls.find((call) => (call[1] as RequestInit).method === "DELETE");
    // Only the first write succeeded. Never remove a key the provider explicitly rejected.
    expect(JSON.parse((cleanup?.[1] as RequestInit).body as string).prefixes).toHaveLength(1);
    expect((await pool().query<{ n: number }>("select count(*)::int as n from media_assets where origin = 'upload'")).rows[0]!.n).toBe(before);
    expect(await auditCount("content.media.upload")).toBe(1);
  });
});

describe("bulk actions, redirects and research", () => {
  it("publishes every ready page of a family through publishPages and marks a filtered set reviewed", async () => {
    const r1 = await insertPage({ url: "/routes/texas-to-florida/", family: "route", keyword: "texas to florida movers", status: "ready" });
    const r2 = await insertPage({ url: "/routes/florida-to-texas/", family: "route", keyword: "florida to texas movers", status: "ready" });
    const r3 = await insertPage({ url: "/routes/texas-to-georgia/", family: "route", keyword: "texas to georgia movers", status: "draft" });
    const stateReady = await insertPage({ url: "/movers/florida/", family: "state", keyword: "movers in florida", state: "FL", status: "ready" });
    const result = await bulkPublishReady(editor, { family: "route" });
    expect(result.published).toBe(2);
    expect(result.indexable).toBe(2);
    expect((await pageRow(r1)).status).toBe("published");
    expect((await pageRow(r2)).indexable).toBe(true);
    expect((await pageRow(r3)).status).toBe("draft");
    expect((await pageRow(stateReady)).status).toBe("ready");
    expect(await auditCount("content.bulk.publish", "route")).toBe(1);
    expect((await bulkPublishReady(editor, { family: "route" })).published).toBe(0);

    const n = await bulkMarkReviewed(editor, { family: "route", status: "published" }, "Pat Reviewer");
    expect(n).toBe(2);
    expect((await pageRow(r3)).reviewed_by).toBeNull();
    expect((await pageRow(r1)).reviewed_by).toBe("Pat Reviewer");
    await expectAdminError(bulkMarkReviewed(editor, { family: "route" }, ""), "missing_text");
  });

  it("adds one-hop redirects to published pages or hubs", async () => {
    await addRedirect(editor, { sourceUrl: "/moving-routes/texas-to-florida/", targetUrl: "/routes/texas-to-florida/", reason: "Route prefix renamed" });
    await expectAdminError(addRedirect(editor, { sourceUrl: "/old/", targetUrl: "/moving-routes/texas-to-florida/", reason: "chain" }), "chain");
    await expectAdminError(addRedirect(editor, { sourceUrl: "/old/", targetUrl: "/routes/texas-to-georgia/", reason: "draft target" }), "bad_target");
    await expectAdminError(addRedirect(editor, { sourceUrl: "/routes/texas-to-florida/", targetUrl: "/routes/", reason: "live source" }), "live_source");
    await addRedirect(editor, { sourceUrl: "/old-routes/", targetUrl: "/routes/", reason: "Hub" });
    // The generator also creates canonical-prefix redirects for other published fixtures.
    const rows = await pool().query<{ source_url: string; target_url: string }>("select source_url, target_url from seo_redirects where source_url = any($1::text[]) order by source_url", [["/moving-routes/texas-to-florida/", "/old-routes/"]]);
    expect(rows.rows).toEqual([
      { source_url: "/moving-routes/texas-to-florida/", target_url: "/routes/texas-to-florida/" },
      { source_url: "/old-routes/", target_url: "/routes/" },
    ]);
    const detail = await getContentPage((await pool().query<{ id: string }>("select id::text from seo_pages where url = '/routes/texas-to-florida/'")).rows[0]!.id);
    expect(detail?.redirects.map((r) => r.source_url)).toEqual(["/moving-routes/texas-to-florida/"]);
    expect(await auditCount("content.redirect.add")).toBe(2);
  });

  it("imports a research CSV through the pipeline importer, lists unassigned questions and assigns one", async () => {
    const csv = [
      "keyword,intent,geo_type,geo_id,page_family,mapped_url,volume,kd,cpc,source,research_date,status,notes",
      "movers in texas,commercial,state,TX,state,/movers/texas/,2400,38,4.1,semrush,2026-10-20,measured,",
      "movers in alaska,commercial,state,AK,state,,,,,hypothesis,2026-10-20,hypothesis,",
    ].join("\n");
    const result = await importResearchCsv(editor, { fileName: "keyword-inventory.csv", text: csv });
    expect(result).toMatchObject({ read: 2, imported: 2, skipped: 0, file: "keyword-inventory.csv" });
    const questions = ["question_paraphrased,intent,assigned_page_family,mapped_url,source,status", "How much do movers cost in Texas?,informational,question,/questions/how-much-do-movers-cost-texas/,reddit,hypothesis", "What is a binding estimate?,informational,question,/questions/what-is-a-binding-estimate/,people also ask,hypothesis"].join("\n");
    await importResearchCsv(editor, { fileName: "question-library.csv", text: questions });
    await expectAdminError(importResearchCsv(editor, { fileName: "notes.txt", text: "a,b" }), "bad_type");
    const summary = await researchSummary();
    expect(summary).toMatchObject({ total: 4, keywords: 2, questions: 2, measured: 1, hypothesis: 3, unassignedQuestions: 1 });
    const unassigned = await listResearch({ assigned: "unassigned-questions" });
    expect(unassigned.rows.map((r) => r.keyword)).toEqual(["How much do movers cost in Texas?"]);
    expect(unassigned.rows[0]).toMatchObject({ hypothesis: true, page_id: null });
    const measured = await listResearch({ measured: "yes" });
    expect(measured.rows.map((r) => r.keyword)).toEqual(["movers in texas"]);
    expect(measured.rows[0]?.page_status).toBe("published");
    await assignResearch(editor, unassigned.rows[0]!.id, "/questions/what-is-a-non-binding-estimate/", "question");
    expect((await listResearch({ assigned: "unassigned-questions" })).total).toBe(0);
    await expectAdminError(assignResearch(editor, unassigned.rows[0]!.id, "not a url"), "bad_url");
    expect(await auditCount("content.research.import")).toBe(2);
    expect(await auditCount("content.research.assign")).toBe(1);
  });
});

describe("pipeline jobs and dashboards", () => {
  it("runs a step through the jobs runner with a job_runs row, and refuses to queue a step that is running", async () => {
    await expectAdminError(queuePipelineStep(editor, { step: "generate" }), "bad_family");
    await expectAdminError(queuePipelineStep(editor, { step: "import_research", files: [] }), "bad_file");
    const queued = await queuePipelineStep(editor, { step: "media_sync" });
    expect(queued).toEqual({ jobName: "seo_media_sync", running: false });
    const outcome = await runPipelineStep(editor, { step: "media_sync" });
    expect(outcome.status).toBe("succeeded");
    const run = (await pool().query<{ status: string; details: { trigger: string; actor_id: string; claimed: number } }>("select status, details from job_runs where job_name = 'seo_media_sync' order by id desc limit 1")).rows[0]!;
    expect(run.status).toBe("succeeded");
    expect(run.details.trigger).toBe(`admin:${editor.userId}`);
    expect(run.details.actor_id).toBe(editor.userId);
    expect(await auditCount("content.pipeline.queue", "seo_media_sync")).toBe(1);
    expect(await auditCount("content.pipeline.run", "seo_media_sync")).toBe(1);
    await pool().query("insert into job_runs (job_name, status) values ('seo_media_sync', 'running')");
    await expectAdminError(queuePipelineStep(editor, { step: "media_sync" }), "already_running");
    await pool().query("update job_runs set status = 'failed', finished_at = now() where job_name = 'seo_media_sync' and status = 'running'");
    // Publish as a job: nothing is ready now, so it publishes zero pages and still records the run.
    const publish = await runPipelineStep(ops, { step: "publish", family: "state", status: "ready" });
    expect(publish.status).toBe("succeeded");
    expect(publish.status === "succeeded" && publish.items).toBe(1);
    expect((await pool().query<{ status: string }>("select status from seo_pages where url = '/movers/florida/'")).rows[0]?.status).toBe("published");
    expect(regenerateKey("city", "/movers/texas/austin/")).toBe("texas/austin");
    expect(regenerateKey("zip", "/movers/texas/austin/78704/")).toBe("78704");
    expect(regenerateKey("cost", "/moving-costs/texas/")).toBeNull();
  });

  it("builds the publication dashboard from the pipeline report, sitemap counts and the crawl report", async () => {
    const dashboard = await publicationDashboard();
    const route = dashboard.counts.find((c) => c.family === "route")!;
    expect(route.published).toBe(2);
    expect(route.indexable).toBe(2);
    expect(route.reviewed).toBe(2);
    expect(dashboard.totals.pages).toBeGreaterThanOrEqual(9);
    expect(dashboard.blockedReasons.map((r) => r.reason)).toEqual(expect.arrayContaining(["blocked: insufficient evidence", "blocked: below 40% unique content"]));
    const routes = dashboard.sitemap.segments.find((s) => s.name === "routes")!;
    expect(routes).toMatchObject({ files: 1, urls: 2 });
    expect(dashboard.sitemap.files).toBe(2 + dashboard.sitemap.segments.filter((s) => s.urls > 0).length);
    expect(dashboard.sitemap.lastBuild).not.toBeNull();
    expect(dashboard.runs.map((r) => r.job_name)).toContain("seo_publish");
    const report = join(webRoot, "crawl-report.md");
    writeFileSync(
      report,
      ["# Crawl report: http://localhost:3500", "", "Generated 2026-10-28T15:43:13.385Z by `pnpm seo:crawl`.", "", "## Summary", "", "| Check | Result |", "|---|---|", "| URLs fetched | 395 |", "| Broken links (non-200 targets) | 1 |", "", "### Indexable pages by first path segment", "", "- /movers/: 252", "- /routes/: 26", "", "## Broken links", "", "- 404 http://localhost:3500/guides/ (linked from http://localhost:3500/editorial-policy/)", "", "## Redirect chains", "", "- none", ""].join("\n"),
    );
    const crawl = readCrawlReport(report)!;
    expect(crawl.base).toBe("http://localhost:3500");
    expect(crawl.generatedAt).toBe("2026-10-28T15:43:13.385Z");
    expect(crawl.checks).toEqual([
      { check: "URLs fetched", result: "395" },
      { check: "Broken links (non-200 targets)", result: "1" },
    ]);
    expect(crawl.byPrefix).toEqual([
      { prefix: "/movers/", pages: 252 },
      { prefix: "/routes/", pages: 26 },
    ]);
    expect(crawl.brokenLinks).toHaveLength(1);
    expect(readCrawlReport(join(webRoot, "missing.md"))).toBeNull();
  });

  it("lists which seeded companies meet the preferred-mover criteria, with evidence and no ranking", async () => {
    const { companies } = await preferredMoverEvidence();
    expect(companies.length).toBeGreaterThan(5);
    const lone = companies.find((c) => c.legal_name === "Demo Lone Star Relocation Co.")!;
    expect(lone.status).toBe("approved");
    expect(lone.checks.usdot_active?.result).toBe("pass");
    expect(lone.insurance?.status).toBe("verified");
    expect(lone.criteria).toMatchObject({ approved: true, usdot: true, carrier: true, insurance: true, mc: true });
    expect(lone.meets).toBe(lone.criteria.terms === true);
    for (const c of companies) expect(c.meets).toBe(c.missing.length === 0);
    // Suspending a company removes Preferred status (criterion "approved").
    await pool().query("update companies set status = 'suspended' where id = $1", [lone.company_id]);
    const after = (await preferredMoverEvidence()).companies.find((c) => c.company_id === lone.company_id)!;
    expect(after.meets).toBe(false);
    expect(after.missing).toContain("Passed admin review");
    await pool().query("update companies set status = 'approved' where id = $1", [lone.company_id]);
    // The manifest sync that the pipeline step wrote keeps every asset on one page at most.
    const synced = await syncMediaManifest();
    expect(synced.claimed).toBe(0);
    for (const asset of (await readManifest()).assets) expect(asset.usedOn.length).toBeLessThanOrEqual(1);
  });
});

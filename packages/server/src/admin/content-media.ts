/**
 * Media library management for the admin (programmatic pipeline docs; docs/media/inventory.md).
 * The manifest (apps/web/content/media/manifest.json) is the source of truth for what an asset
 * is (credit, licence, prompt, tiers); seo_media_usage and seo_pages.media_ids are the source of
 * truth for which page holds it. One asset belongs to at most one page: the seo_media_usage
 * primary key enforces it in the database and syncMediaManifest writes the claims back into
 * usedOn (the same rule `pnpm seo:media-sync` and `pnpm media:check` apply).
 *
 * Writes to the manifest and to apps/web/public/media/uploads happen on the file system of the
 * server running the admin; they are meant for the local preview, where the repository is
 * checked out next to the running app. Every change is audited.
 */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { isSeoUrl } from "../seo/publish";
import { slugify } from "../seo/slugs";
import { AdminError, cleanText, requireText } from "./common";
import { assertContentRole, type ContentActor } from "./content-roles";

// ------------------------------------------------------------------ manifest types and IO

export interface ManifestCredit {
  creator: string;
  source_url: string;
  license: string;
  attribution_required: boolean;
}

export interface ManifestAsset {
  id: string;
  kind: "image" | "video";
  src: string;
  srcset?: { src: string; width: number }[];
  sources?: { src: string; type: string; width?: number }[];
  poster?: string;
  width: number;
  height: number;
  alt: string;
  credit: ManifestCredit;
  tags: string[];
  usedOn: string[];
  placeholder?: boolean;
  blurDataURL?: string;
  generator?: { provider?: string; model?: string; prompt?: string; job_id?: string; generated_at?: string; matrix_key?: string };
  /** Set by the admin: the asset is hidden from claims and never rendered. */
  rejected?: { reason: string; by: string; at: string };
  /** Set for admin uploads: who uploaded it, when, and the SHA-256 of the original file. */
  upload?: { by: string; at: string; sha256: string; originalName: string };
}

export interface MediaManifest {
  version: number;
  notes?: string[];
  assets: ManifestAsset[];
}

let configuredWebRoot: string | null = null;

/** Points the module at another apps/web directory (tests use a temporary copy). */
export function configureMediaRoot(webRoot: string | null): void {
  configuredWebRoot = webRoot;
}

/** apps/web, found from AMC_WEB_ROOT, the configured root, or by walking up from the working directory. */
export function webRoot(): string {
  if (configuredWebRoot) return configuredWebRoot;
  if (process.env.AMC_WEB_ROOT) return process.env.AMC_WEB_ROOT;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (basename(dir) === "web" && existsSync(join(dir, "content", "media", "manifest.json"))) return dir;
    const candidate = join(dir, "apps", "web");
    if (existsSync(join(candidate, "content", "media", "manifest.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new AdminError("The media manifest (apps/web/content/media/manifest.json) is not reachable from this server. Set AMC_WEB_ROOT to the apps/web directory.", "no_manifest");
}

export const manifestPath = (): string => join(webRoot(), "content", "media", "manifest.json");
export const publicDir = (): string => join(webRoot(), "public");

export function readManifest(): MediaManifest {
  const parsed = JSON.parse(readFileSync(manifestPath(), "utf8")) as MediaManifest | ManifestAsset[];
  return Array.isArray(parsed) ? { version: 1, assets: parsed } : parsed;
}

function writeManifest(manifest: MediaManifest): void {
  const path = manifestPath();
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n");
  renameSync(tmp, path);
}

/** The assets the generator may claim: images that are not rejected (what the pipeline runs receive). */
export function claimableMedia(): ManifestAsset[] {
  return readManifest().assets.filter((a) => !a.rejected);
}

// ------------------------------------------------------------------ library listing

export type MediaClaimState = "unclaimed" | "claimed" | "static" | "rejected";

export interface MediaLibraryItem {
  id: string;
  kind: "image" | "video";
  src: string;
  /** The smallest tier, for thumbnails. */
  thumb: string;
  width: number;
  height: number;
  alt: string;
  tags: string[];
  family: string;
  credit: ManifestCredit;
  prompt: string | null;
  model: string | null;
  /** Pages the asset is used on: the claim in the database, else the manifest's usedOn. */
  usedOn: string[];
  /** The page holding the claim in seo_media_usage (null when the manifest alone lists a static page). */
  claimedBy: { pageId: string; url: string; title: string; status: string } | null;
  state: MediaClaimState;
  rejected: ManifestAsset["rejected"] | null;
  upload: ManifestAsset["upload"] | null;
}

export interface MediaFilters {
  tag?: string | null;
  family?: string | null;
  state?: MediaClaimState | "" | null;
  kind?: "image" | "video" | "" | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

/** The family an asset belongs to: its first tag (docs/media/inventory.md). */
export const assetFamily = (asset: Pick<ManifestAsset, "tags">): string => asset.tags[0] ?? "untagged";

export function thumbOf(asset: ManifestAsset): string {
  if (asset.kind === "video") return asset.poster ?? asset.src;
  const smallest = [...(asset.srcset ?? [])].sort((a, b) => a.width - b.width)[0];
  return smallest?.src ?? asset.src;
}

async function claimsByAsset(db: Queryable): Promise<Map<string, { pageId: string; url: string; title: string; status: string }>> {
  const rows = await db.query<{ media_id: string; page_id: string; url: string; title: string; status: string }>(
    "select u.media_id, u.page_id::text, p.url, p.title, p.status from seo_media_usage u join seo_pages p on p.id = u.page_id",
  );
  return new Map(rows.rows.map((r) => [r.media_id, { pageId: r.page_id, url: r.url, title: r.title, status: r.status }]));
}

function toItem(asset: ManifestAsset, claim: MediaLibraryItem["claimedBy"]): MediaLibraryItem {
  const usedOn = claim ? [claim.url] : asset.usedOn;
  const state: MediaClaimState = asset.rejected ? "rejected" : claim ? "claimed" : usedOn.length ? "static" : "unclaimed";
  return {
    id: asset.id,
    kind: asset.kind,
    src: asset.src,
    thumb: thumbOf(asset),
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
    tags: asset.tags,
    family: assetFamily(asset),
    credit: asset.credit,
    prompt: asset.generator?.prompt ?? null,
    model: asset.generator?.model ?? null,
    usedOn,
    claimedBy: claim,
    state,
    rejected: asset.rejected ?? null,
    upload: asset.upload ?? null,
  };
}

export interface MediaLibrary {
  rows: MediaLibraryItem[];
  total: number;
  counts: Record<MediaClaimState, number>;
  families: string[];
  tags: string[];
}

export async function listMedia(filters: MediaFilters = {}, db: Queryable = getPool()): Promise<MediaLibrary> {
  const manifest = readManifest();
  const claims = await claimsByAsset(db);
  const items = manifest.assets.map((a) => toItem(a, claims.get(a.id) ?? null));
  const counts: Record<MediaClaimState, number> = { unclaimed: 0, claimed: 0, static: 0, rejected: 0 };
  for (const item of items) counts[item.state]++;
  const q = (filters.q ?? "").trim().toLowerCase();
  const filtered = items.filter(
    (i) =>
      (!filters.tag || i.tags.includes(filters.tag)) &&
      (!filters.family || i.family === filters.family) &&
      (!filters.state || i.state === filters.state) &&
      (!filters.kind || i.kind === filters.kind) &&
      (!q || i.id.includes(q) || i.alt.toLowerCase().includes(q) || (i.prompt ?? "").toLowerCase().includes(q) || i.usedOn.some((u) => u.includes(q))),
  );
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 60;
  return {
    rows: filtered.slice(offset, offset + limit),
    total: filtered.length,
    counts,
    families: [...new Set(items.map((i) => i.family))].sort(),
    tags: [...new Set(items.flatMap((i) => i.tags))].sort(),
  };
}

/** One asset with its claim, or null. */
export async function getMediaAsset(id: string, db: Queryable = getPool()): Promise<MediaLibraryItem | null> {
  const asset = readManifest().assets.find((a) => a.id === id);
  if (!asset) return null;
  const claims = await claimsByAsset(db);
  return toItem(asset, claims.get(id) ?? null);
}

/** Library items for a page's claimed ids, in the page's order (thumbnails on the detail page). */
export async function mediaForPage(mediaIds: string[], db: Queryable = getPool()): Promise<MediaLibraryItem[]> {
  if (!mediaIds.length) return [];
  const byId = new Map(readManifest().assets.map((a) => [a.id, a]));
  const claims = await claimsByAsset(db);
  return mediaIds.map((id) => byId.get(id)).filter((a): a is ManifestAsset => !!a).map((a) => toItem(a, claims.get(a.id) ?? null));
}

// ------------------------------------------------------------------ sync (the media-sync rule)

const SEO_PATH = /^\/(movers|routes|services|moving-costs|questions|planning)\//;

/**
 * Writes the pages' claims (seo_pages.media_ids) into the manifest's usedOn so `pnpm media:check`
 * validates them: a claimed asset lists its one page; an unclaimed one keeps only its non-SEO
 * usedOn entries (the static pages that adopted it by hand). Same rule as `pnpm seo:media-sync`.
 */
export async function syncMediaManifest(db: Queryable = getPool()): Promise<{ claimed: number; changed: number }> {
  const manifest = readManifest();
  const claims = await db.query<{ url: string; media_ids: string[] }>("select url, media_ids from seo_pages where jsonb_array_length(media_ids) > 0");
  const byAsset = new Map<string, string>();
  for (const row of claims.rows) for (const id of row.media_ids) byAsset.set(id, row.url);
  let changed = 0;
  for (const asset of manifest.assets) {
    const owner = byAsset.get(asset.id);
    const next = owner ? [owner] : asset.usedOn.filter((u) => !SEO_PATH.test(u));
    if (JSON.stringify(next) !== JSON.stringify(asset.usedOn)) {
      asset.usedOn = next;
      changed++;
    }
  }
  writeManifest(manifest);
  return { claimed: byAsset.size, changed };
}

// ------------------------------------------------------------------ claims

async function removeClaim(client: Queryable, mediaId: string): Promise<{ pageId: string; url: string } | null> {
  const current = (await client.query<{ page_id: string; url: string }>("select u.page_id::text, p.url from seo_media_usage u join seo_pages p on p.id = u.page_id where u.media_id = $1 for update of u", [mediaId])).rows[0];
  if (!current) return null;
  await client.query("delete from seo_media_usage where media_id = $1", [mediaId]);
  await client.query("update seo_pages set media_ids = coalesce((select jsonb_agg(v) from jsonb_array_elements(media_ids) v where v <> to_jsonb($2::text)), '[]'::jsonb) where id = $1", [current.page_id, mediaId]);
  return { pageId: current.page_id, url: current.url };
}

/**
 * Moves an asset to a page (or takes it away from every page with pageUrl = null). The asset
 * leaves the page that held it, joins the new page's media_ids and seo_media_usage, and the
 * manifest's usedOn follows. Rejected assets and assets a static page adopted can't be assigned.
 */
export async function reassignMedia(actor: ContentActor, mediaId: string, pageUrl: string | null): Promise<{ from: string | null; to: string | null }> {
  assertContentRole(actor);
  const asset = readManifest().assets.find((a) => a.id === mediaId);
  if (!asset) throw new AdminError("Unknown media asset.", "not_found");
  if (pageUrl && asset.rejected) throw new AdminError("This asset is rejected. Restore it before assigning it to a page.", "rejected");
  if (pageUrl && asset.kind !== "image") throw new AdminError("Only images can be assigned to programmatic pages.", "not_image");
  const target = pageUrl ? pageUrl.trim() : null;
  if (target && !isSeoUrl(target)) throw new AdminError("Enter the URL of a programmatic page, such as /movers/texas/.", "bad_url");
  const result = await tx(async (client) => {
    const from = await removeClaim(client, mediaId);
    const staticUse = asset.usedOn.filter((u) => !SEO_PATH.test(u));
    if (target && staticUse.length) throw new AdminError(`This asset is used on ${staticUse.join(", ")}; an asset belongs to one page only.`, "static_use");
    let to: string | null = null;
    if (target) {
      const page = (await client.query<{ id: string; url: string }>("select id::text, url from seo_pages where url = $1 for update", [target])).rows[0];
      if (!page) throw new AdminError("No page exists at that URL.", "not_found");
      await client.query("insert into seo_media_usage (media_id, page_id) values ($1, $2)", [mediaId, page.id]);
      await client.query("update seo_pages set media_ids = media_ids || to_jsonb($2::text) where id = $1 and not media_ids ? $2", [page.id, mediaId]);
      to = page.url;
    }
    await audit({ actorType: "admin", actorId: actor.userId, action: target ? "content.media.assign" : "content.media.unclaim", entity: "media_asset", entityId: mediaId, before: { usedOn: from?.url ?? asset.usedOn }, after: { usedOn: to }, ip: actor.ip ?? null }, client);
    return { from: from?.url ?? null, to };
  });
  await syncMediaManifest();
  return result;
}

/** Hides an asset from claims (and takes it off the page holding it). */
export async function rejectMedia(actor: ContentActor, mediaId: string, reason: string | null | undefined): Promise<void> {
  assertContentRole(actor);
  const text = requireText(reason, "why the asset is rejected", 500);
  const manifest = readManifest();
  const asset = manifest.assets.find((a) => a.id === mediaId);
  if (!asset) throw new AdminError("Unknown media asset.", "not_found");
  if (asset.rejected) throw new AdminError("This asset is already rejected.", "bad_status");
  await tx(async (client) => {
    const from = await removeClaim(client, mediaId);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.reject", entity: "media_asset", entityId: mediaId, before: { usedOn: from?.url ?? asset.usedOn }, after: { rejected: true, reason: text }, ip: actor.ip ?? null }, client);
  });
  const fresh = readManifest();
  const target = fresh.assets.find((a) => a.id === mediaId)!;
  target.rejected = { reason: text, by: actor.userId, at: new Date().toISOString() };
  target.usedOn = target.usedOn.filter((u) => !SEO_PATH.test(u));
  writeManifest(fresh);
}

/** Makes a rejected asset claimable again. */
export async function restoreMedia(actor: ContentActor, mediaId: string): Promise<void> {
  assertContentRole(actor);
  const manifest = readManifest();
  const asset = manifest.assets.find((a) => a.id === mediaId);
  if (!asset) throw new AdminError("Unknown media asset.", "not_found");
  if (!asset.rejected) throw new AdminError("This asset is not rejected.", "bad_status");
  const before = asset.rejected;
  delete asset.rejected;
  writeManifest(manifest);
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.restore", entity: "media_asset", entityId: mediaId, before: { rejected: before }, after: { rejected: false }, ip: actor.ip ?? null });
}

// ------------------------------------------------------------------ uploads

export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** The library's tiers (docs/media/inventory.md): the native width capped per aspect ratio, and 800px. */
export function largestTierWidth(width: number, height: number): number {
  const ratio = width / height;
  const cap = Math.abs(ratio - 16 / 9) < 0.05 ? 1344 : Math.abs(ratio - 4 / 3) < 0.05 ? 1168 : Math.abs(ratio - 1) < 0.05 ? 1024 : 1344;
  return Math.min(cap, width);
}

export function orientationTag(width: number, height: number): "landscape" | "standard" | "square" | "portrait" {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.05) return "square";
  if (ratio < 1) return "portrait";
  return ratio >= 1.6 ? "landscape" : "standard";
}

export const sha256Of = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/** SHA-256 of every file the manifest references under public (so a re-upload of a library file is caught too). */
function knownHashes(manifest: MediaManifest): Set<string> {
  const out = new Set<string>();
  for (const asset of manifest.assets) {
    if (asset.upload?.sha256) out.add(asset.upload.sha256);
    const file = join(publicDir(), asset.src.replace(/^\//, ""));
    if (existsSync(file)) out.add(sha256Of(readFileSync(file)));
  }
  return out;
}

export interface UploadInput {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  alt: string;
  tags: string[];
  credit: { creator: string; sourceUrl?: string | null; license: string; attributionRequired: boolean };
  prompt?: string | null;
}

/**
 * Stores a new image under apps/web/public/media/uploads in the library's tiers (WebP at the
 * capped native width and at 800px, plus a 24px blur placeholder), appends it to the manifest
 * unclaimed, and refuses a file whose SHA-256 the library already holds.
 */
export async function uploadMedia(actor: ContentActor, input: UploadInput): Promise<MediaLibraryItem> {
  assertContentRole(actor);
  if (!UPLOAD_TYPES.has(input.mimeType)) throw new AdminError("Upload a PNG, JPEG or WebP image.", "bad_type");
  if (!input.bytes.length) throw new AdminError("The file is empty.", "bad_file");
  if (input.bytes.length > UPLOAD_MAX_BYTES) throw new AdminError("The file is larger than 20 MB.", "too_large");
  const alt = requireText(input.alt, "the alt text", 300);
  const creator = requireText(input.credit.creator, "the creator (credit)", 200);
  const license = requireText(input.credit.license, "the licence", 300);
  const sourceUrl = cleanText(input.credit.sourceUrl, 500) ?? "";
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) throw new AdminError("The source URL must start with http:// or https://.", "bad_url");
  const tags = [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter((t) => /^[a-z0-9][a-z0-9:_-]*$/.test(t)))];
  if (!tags.length) throw new AdminError("Enter at least one tag (the first one is the family, such as state or route).", "missing_tags");

  const hash = sha256Of(input.bytes);
  const manifest = readManifest();
  const duplicate = manifest.assets.find((a) => a.upload?.sha256 === hash);
  if (duplicate) throw new AdminError(`An identical file is already in the library as "${duplicate.id}".`, "duplicate");
  if (knownHashes(manifest).has(hash)) throw new AdminError("An identical file is already in the library.", "duplicate");

  const sharp = (await import("sharp")).default;
  const source = sharp(Buffer.from(input.bytes), { failOn: "error" }).rotate();
  const meta = await source.metadata();
  if (!meta.width || !meta.height) throw new AdminError("The image could not be read.", "bad_file");
  if (meta.width < 800 || meta.height < 450) throw new AdminError("Upload an image at least 800 pixels wide and 450 pixels tall.", "too_small");
  const largest = largestTierWidth(meta.width, meta.height);
  const stem = slugify(basename(input.fileName).replace(/\.[a-z0-9]+$/i, "")).slice(0, 48) || slugify(alt).slice(0, 48) || "upload";
  let id = `upload-${stem}`;
  const ids = new Set(manifest.assets.map((a) => a.id));
  while (ids.has(id)) id = `upload-${stem}-${randomBytes(2).toString("hex")}`;
  const dir = join(publicDir(), "media", "uploads");
  mkdirSync(dir, { recursive: true });
  const large = await source.clone().resize({ width: largest, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
  const small = await source.clone().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer({ resolveWithObject: true });
  const blur = await source.clone().resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();
  const largeName = `${id}-1600.webp`;
  const smallName = `${id}-800.webp`;
  writeFileSync(join(dir, largeName), large.data);
  writeFileSync(join(dir, smallName), small.data);
  const orientation = orientationTag(large.info.width, large.info.height);
  const asset: ManifestAsset = {
    id,
    kind: "image",
    src: `/media/uploads/${largeName}`,
    srcset: [
      { src: `/media/uploads/${largeName}`, width: large.info.width },
      { src: `/media/uploads/${smallName}`, width: small.info.width },
    ],
    width: large.info.width,
    height: large.info.height,
    alt,
    credit: { creator, source_url: sourceUrl, license, attribution_required: input.credit.attributionRequired },
    tags: tags.includes(orientation) ? tags : [...tags, orientation],
    usedOn: [],
    placeholder: false,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    ...(cleanText(input.prompt, 1000) ? { generator: { provider: "upload", prompt: cleanText(input.prompt, 1000)! } } : {}),
    upload: { by: actor.userId, at: new Date().toISOString(), sha256: hash, originalName: basename(input.fileName).slice(0, 120) },
  };
  const fresh = readManifest();
  fresh.assets.push(asset);
  writeManifest(fresh);
  await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.upload", entity: "media_asset", entityId: id, after: { sha256: hash, width: asset.width, height: asset.height, tags: asset.tags, creator, license }, ip: actor.ip ?? null });
  return toItem(asset, null);
}

/** Bytes on disk under public/media/uploads (for the library page's note). */
export function uploadsFootprint(): { files: number; bytes: number } {
  const dir = join(publicDir(), "media", "uploads");
  if (!existsSync(dir)) return { files: 0, bytes: 0 };
  let bytes = 0;
  const files = readdirSync(dir);
  for (const f of files) bytes += statSync(join(dir, f)).size;
  return { files: files.length, bytes };
}

export const resolveUnderRepo = (path: string): string => resolve(dirname(webRoot()), "..", path);

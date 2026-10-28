/** Administrative media decisions. Bundled media is read-only; runtime uploads and editorial
 * overrides live in media_assets, with image bytes in a configured Supabase Storage bucket. */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";
import { isSeoUrl } from "../seo/publish";
import { slugify } from "../seo/slugs";
import { AdminError, cleanText, requireText } from "./common";
import { assertContentRole, type ContentActor } from "./content-roles";

// ------------------------------------------------------------------ manifest types and IO

export { claimableMedia, configureMediaRoot, readManifest } from "../media/manifest";
export type { ManifestAsset, ManifestCredit, MediaManifest } from "../media/manifest";
import { configuredMediaRoot, readManifest, type ManifestAsset, type ManifestCredit, type MediaManifest } from "../media/manifest";
import { mediaStorageConfig, SupabaseMediaStorage, type StoredObject } from "../media/storage";

/** Repository path is used only by editorial tools; runtime uploads never write here. */
export function webRoot(): string {
  const configured = configuredMediaRoot() ?? process.env.AMC_WEB_ROOT;
  if (configured) return configured;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "apps", "web");
    if (existsSync(join(candidate, "content", "media", "manifest.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new AdminError("Repository files are unavailable in this deployment.", "no_manifest");
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
  const manifest = await readManifest(db);
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
  const asset = (await readManifest(db)).assets.find((a) => a.id === id);
  if (!asset) return null;
  const claims = await claimsByAsset(db);
  return toItem(asset, claims.get(id) ?? null);
}

/** Library items for a page's claimed ids, in the page's order (thumbnails on the detail page). */
export async function mediaForPage(mediaIds: string[], db: Queryable = getPool()): Promise<MediaLibraryItem[]> {
  if (!mediaIds.length) return [];
  const byId = new Map((await readManifest(db)).assets.map((a) => [a.id, a]));
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
  const manifest = await readManifest(db);
  const claims = await claimsByAsset(db);
  let changed = 0;
  for (const asset of manifest.assets) {
    const result = await db.query(
      "insert into media_assets (id, asset, origin) values ($1, $2::jsonb, 'bundled') on conflict (id) do update set asset = jsonb_set(media_assets.asset, '{usedOn}', excluded.asset->'usedOn'), updated_at = now() where media_assets.asset->'usedOn' is distinct from excluded.asset->'usedOn'",
      [asset.id, JSON.stringify(asset)],
    );
    changed += result.rowCount ?? 0;
  }
  return { claimed: claims.size, changed };
}

async function saveAsset(db: Queryable, asset: ManifestAsset): Promise<void> {
  await db.query("insert into media_assets (id, asset, origin) values ($1, $2::jsonb, 'bundled') on conflict (id) do update set asset = excluded.asset, updated_at = now()", [asset.id, JSON.stringify(asset)]);
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
async function lockedAsset(client: Queryable, mediaId: string): Promise<ManifestAsset> {
  await client.query("select pg_advisory_xact_lock(hashtext($1))", [`media:${mediaId}`]);
  const asset = (await readManifest(client)).assets.find((a) => a.id === mediaId);
  if (!asset) throw new AdminError("Unknown media asset.", "not_found");
  return asset;
}

export async function reassignMedia(actor: ContentActor, mediaId: string, pageUrl: string | null): Promise<{ from: string | null; to: string | null }> {
  assertContentRole(actor);
  const target = pageUrl?.trim() || null;
  if (target && !isSeoUrl(target)) throw new AdminError("Enter the URL of a programmatic page, such as /movers/texas/.", "bad_url");
  return tx(async (client) => {
    const asset = await lockedAsset(client, mediaId);
    if (target && asset.rejected) throw new AdminError("This asset is rejected. Restore it before assigning it to a page.", "rejected");
    if (target && asset.kind !== "image") throw new AdminError("Only images can be assigned to programmatic pages.", "not_image");
    const staticUse = asset.usedOn.filter((u) => !SEO_PATH.test(u));
    if (target && staticUse.length) throw new AdminError(`This asset is used on ${staticUse.join(", ")}; an asset belongs to one page only.`, "static_use");
    const from = await removeClaim(client, mediaId);
    let to: string | null = null;
    if (target) {
      const page = (await client.query<{ id: string; url: string }>("select id::text, url from seo_pages where url = $1 for update", [target])).rows[0];
      if (!page) throw new AdminError("No page exists at that URL.", "not_found");
      await client.query("insert into seo_media_usage (media_id, page_id) values ($1, $2)", [mediaId, page.id]);
      await client.query("update seo_pages set media_ids = media_ids || to_jsonb($2::text) where id = $1 and not media_ids ? $2", [page.id, mediaId]);
      to = page.url;
    }
    const before = asset.usedOn;
    asset.usedOn = to ? [to] : staticUse;
    await saveAsset(client, asset);
    await audit({ actorType: "admin", actorId: actor.userId, action: target ? "content.media.assign" : "content.media.unclaim", entity: "media_asset", entityId: mediaId, before: { usedOn: from?.url ?? before }, after: { usedOn: to }, ip: actor.ip ?? null }, client);
    return { from: from?.url ?? null, to };
  });
}

/** Hides an asset from claims and removes the page assignment in one transaction. */
export async function rejectMedia(actor: ContentActor, mediaId: string, reason: string | null | undefined): Promise<void> {
  assertContentRole(actor);
  const text = requireText(reason, "why the asset is rejected", 500);
  await tx(async (client) => {
    const asset = await lockedAsset(client, mediaId);
    if (asset.rejected) throw new AdminError("This asset is already rejected.", "bad_status");
    // Hand-built pages import bundled assets synchronously. Do not pretend a DB override hides
    // an image embedded in a deployed bundle; those replacements require an editorial deploy.
    if (asset.usedOn.some((u) => !SEO_PATH.test(u))) throw new AdminError("This image is embedded in a bundled page. Replace it in the site library before rejecting it.", "static_use");
    const before = asset.usedOn;
    const from = await removeClaim(client, mediaId);
    asset.rejected = { reason: text, by: actor.userId, at: new Date().toISOString() };
    asset.usedOn = [];
    await saveAsset(client, asset);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.reject", entity: "media_asset", entityId: mediaId, before: { usedOn: from?.url ?? before }, after: { rejected: true, reason: text }, ip: actor.ip ?? null }, client);
  });
}

export async function restoreMedia(actor: ContentActor, mediaId: string): Promise<void> {
  assertContentRole(actor);
  await tx(async (client) => {
    const asset = await lockedAsset(client, mediaId);
    if (!asset.rejected) throw new AdminError("This asset is not rejected.", "bad_status");
    const before = asset.rejected;
    delete asset.rejected;
    await saveAsset(client, asset);
    await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.restore", entity: "media_asset", entityId: mediaId, before: { rejected: before }, after: { rejected: false }, ip: actor.ip ?? null }, client);
  });
}

// ------------------------------------------------------------------ uploads

// Leave room for multipart metadata beneath Vercel's 4.5 MB request limit.
export const UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
const UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function mediaUploadAvailability(): { available: boolean; reason: string | null } {
  try {
    mediaStorageConfig();
    return { available: true, reason: null };
  } catch {
    return { available: false, reason: "Image uploads are unavailable until an administrator connects the media storage bucket. Your existing media library remains available." };
  }
}

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
    // Bundled files may be absent from the app serverless bundle; never fetch arbitrary URLs.
    if (!asset.src.startsWith("/media/")) continue;
    let root: string;
    try { root = webRoot(); } catch { continue; }
    const file = join(root, "public", asset.src.slice(1));
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
 * Writes immutable WebP objects to Storage, then commits their manifest and audit together.
 * Failed writes leave no library entry; fresh object keys are cleaned up on any later failure.
 */
export async function uploadMedia(actor: ContentActor, input: UploadInput): Promise<MediaLibraryItem> {
  assertContentRole(actor);
  if (!UPLOAD_TYPES.has(input.mimeType)) throw new AdminError("Upload a PNG, JPEG or WebP image.", "bad_type");
  if (!input.bytes.length) throw new AdminError("The file is empty.", "bad_file");
  if (input.bytes.length > UPLOAD_MAX_BYTES) throw new AdminError("The file is larger than 3 MB. Export a smaller PNG, JPEG or WebP and try again.", "too_large");
  const alt = requireText(input.alt, "the alt text", 300);
  const creator = requireText(input.credit.creator, "the creator (credit)", 200);
  const license = requireText(input.credit.license, "the licence", 300);
  const sourceUrl = cleanText(input.credit.sourceUrl, 500) ?? "";
  if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) throw new AdminError("The source URL must start with http:// or https://.", "bad_url");
  const tags = [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter((t) => /^[a-z0-9][a-z0-9:_-]*$/.test(t)))];
  if (!tags.length) throw new AdminError("Enter at least one tag (the first one is the family, such as state or route).", "missing_tags");

  const hash = sha256Of(input.bytes);
  const storage = new SupabaseMediaStorage(mediaStorageConfig());
  const manifest = await readManifest();
  const duplicate = manifest.assets.find((a) => a.upload?.sha256 === hash);
  if (duplicate) throw new AdminError(`An identical file is already in the library as "${duplicate.id}".`, "duplicate");
  if (knownHashes(manifest).has(hash)) throw new AdminError("An identical file is already in the library.", "duplicate");

  const sharp = (await import("sharp")).default;
  let source: ReturnType<typeof sharp>;
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    source = sharp(Buffer.from(input.bytes), { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
    meta = await source.metadata();
    const expected = new Map([["image/png", "png"], ["image/jpeg", "jpeg"], ["image/webp", "webp"]]);
    if (meta.format !== expected.get(input.mimeType) || (meta.pages ?? 1) > 1) throw new Error("Unsupported image");
  } catch { throw new AdminError("The file is not a readable, single-frame PNG, JPEG or WebP image.", "bad_file"); }
  if (!meta.width || !meta.height) throw new AdminError("The image could not be read.", "bad_file");
  if (meta.width * meta.height > 40_000_000) throw new AdminError("The image exceeds the 40 megapixel processing limit. Export a smaller image and try again.", "too_large");
  // EXIF rotation can swap dimensions. Evaluate size and tiers after orientation is applied.
  const rotated = [5, 6, 7, 8].includes(meta.orientation ?? 0);
  const orientedWidth = rotated ? meta.height : meta.width;
  const orientedHeight = rotated ? meta.width : meta.height;
  if (orientedWidth < 800 || orientedHeight < 450) throw new AdminError("Upload an image at least 800 pixels wide and 450 pixels tall after rotation.", "too_small");
  const largest = largestTierWidth(orientedWidth, orientedHeight);
  const stem = slugify(basename(input.fileName).replace(/\.[a-z0-9]+$/i, "")).slice(0, 48) || slugify(alt).slice(0, 48) || "upload";
  const id = `upload-${stem}-${randomBytes(8).toString("hex")}`;
  const large = await source.clone().resize({ width: largest, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
  const small = await source.clone().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer({ resolveWithObject: true });
  const blur = await source.clone().resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();
  const largeName = `uploads/${id}/${large.info.width}.webp`;
  const smallName = `uploads/${id}/800.webp`;
  const objects: { path: string; data: Buffer }[] = [{ path: largeName, data: large.data }];
  if (smallName !== largeName) objects.push({ path: smallName, data: small.data });
  const orientation = orientationTag(large.info.width, large.info.height);
  const asset: ManifestAsset = {
    id,
    kind: "image",
    src: storage.publicUrl(largeName),
    srcset: [
      { src: storage.publicUrl(largeName), width: large.info.width },
      ...(smallName !== largeName ? [{ src: storage.publicUrl(smallName), width: small.info.width }] : []),
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
  await storage.assertPublicBucket();
  const attempted: string[] = [];
  try {
    for (const object of objects) {
      attempted.push(object.path); // Include ambiguous timeouts: the object may have been written.
      try {
        await storage.upload(object.path, object.data);
      } catch (error) {
        // An explicit rejection wrote nothing. In particular, an existing key must never be
        // removed by cleanup when the provider refused an immutable upload to that key.
        if (error instanceof AdminError && error.code === "storage_upload_failed") attempted.pop();
        throw error;
      }
    }
    const storedObjects: StoredObject[] = objects.map(({ path, data }) => ({ path, bytes: data.length }));
    await tx(async (client) => {
      await client.query("insert into media_assets (id, asset, origin, storage_bucket, storage_objects, sha256, total_bytes, created_by) values ($1, $2::jsonb, 'upload', $3, $4::jsonb, $5, $6, $7)",
        [id, JSON.stringify(asset), storage.config.bucket, JSON.stringify(storedObjects), hash, storedObjects.reduce((n, o) => n + o.bytes, 0), actor.userId]);
      await audit({ actorType: "admin", actorId: actor.userId, action: "content.media.upload", entity: "media_asset", entityId: id, after: { sha256: hash, width: asset.width, height: asset.height, tags: asset.tags, creator, license, bucket: storage.config.bucket, objects: storedObjects }, ip: actor.ip ?? null }, client);
    });
  } catch (error) {
    await storage.remove(attempted);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") throw new AdminError("An identical file is already in the library. Refresh the library to find it.", "duplicate");
    throw error;
  }
  return toItem(asset, null);
}

/** Durable upload totals; bundled files are excluded. */
export async function uploadsFootprint(db: Queryable = getPool()): Promise<{ files: number; bytes: number }> {
  const row = (await db.query<{ files: string; bytes: string }>("select coalesce(sum(jsonb_array_length(storage_objects)), 0)::text as files, coalesce(sum(total_bytes), 0)::text as bytes from media_assets where origin = 'upload'")).rows[0]!;
  return { files: Number(row.files), bytes: Number(row.bytes) };
}

export const resolveUnderRepo = (path: string): string => resolve(dirname(webRoot()), "..", path);

/** Read-only bundled media plus durable database overrides. Never writes into a deployment. */
import bundledJson from "../../../../apps/web/content/media/manifest.json";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPool, type Queryable } from "../db/pool";

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

/** Test fixture override. Production uses the statically imported manifest, traced by Next. */
export function configureMediaRoot(root: string | null): void { configuredWebRoot = root; }
export function configuredMediaRoot(): string | null { return configuredWebRoot; }
export function readBundledManifest(): MediaManifest {
  const parsed = configuredWebRoot
    ? JSON.parse(readFileSync(join(configuredWebRoot, "content", "media", "manifest.json"), "utf8")) as MediaManifest
    : bundledJson as MediaManifest;
  return structuredClone(parsed);
}

export async function readManifest(db: Queryable = getPool()): Promise<MediaManifest> {
  const manifest = readBundledManifest();
  const rows = await db.query<{ asset: ManifestAsset }>("select asset from media_assets order by created_at, id");
  const byId = new Map(manifest.assets.map((a) => [a.id, a]));
  for (const row of rows.rows) byId.set(row.asset.id, row.asset);
  manifest.assets = [...byId.values()];
  // Claims are authoritative; old bundled SEO usedOn entries must not reserve released assets.
  const claims = await db.query<{ media_id: string; url: string }>("select u.media_id, p.url from seo_media_usage u join seo_pages p on p.id = u.page_id");
  const owners = new Map(claims.rows.map((r) => [r.media_id, r.url]));
  for (const asset of manifest.assets) asset.usedOn = owners.has(asset.id) ? [owners.get(asset.id)!] : asset.usedOn.filter((u) => !/^\/(movers|routes|services|moving-costs|questions|planning)\//.test(u));
  return manifest;
}

export async function claimableMedia(db: Queryable = getPool()): Promise<ManifestAsset[]> {
  return (await readManifest(db)).assets.filter((a) => !a.rejected);
}

/** Resolve only assets actually assigned to this page; editorial rejects never render. */
export async function resolvePageMedia(page: string, ids: string[], db: Queryable = getPool()): Promise<ManifestAsset[]> {
  if (!ids.length) return [];
  const wanted = new Set(ids);
  const byId = new Map(readBundledManifest().assets.filter((a) => wanted.has(a.id)).map((a) => [a.id, a]));
  const rows = await db.query<{ asset: ManifestAsset }>("select asset from media_assets where id = any($1::text[])", [ids]);
  for (const row of rows.rows) byId.set(row.asset.id, row.asset);
  const claims = await db.query<{ media_id: string; url: string }>("select u.media_id, p.url from seo_media_usage u join seo_pages p on p.id = u.page_id where u.media_id = any($1::text[])", [ids]);
  const owners = new Map(claims.rows.map((r) => [r.media_id, r.url]));
  return ids.flatMap((id) => {
    const asset = byId.get(id);
    return asset && !asset.rejected && owners.get(id) === page ? [{ ...asset, usedOn: [page] }] : [];
  });
}

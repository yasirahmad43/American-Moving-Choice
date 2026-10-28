import "server-only";

/**
 * Media manifest loader (apps/web/content/media/manifest.json, checked by `pnpm media:check`).
 * Assets are matched by tag and each asset belongs to at most one page: the programmatic SEO
 * generator claims them (seo_pages.media_ids, seo_media_usage) and `pnpm seo:media-sync` writes
 * the claims back into usedOn. An absent asset means the page renders with no image, never a
 * stock fallback.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface MediaCredit {
  creator: string;
  source_url?: string;
  license: string;
  attribution_required: boolean;
}

export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  src: string;
  srcset?: { src: string; width: number }[];
  sources?: { src: string; type: string; width?: number }[];
  poster?: string;
  width: number;
  height: number;
  alt: string;
  credit: MediaCredit;
  tags: string[];
  usedOn: string[];
  placeholder?: boolean;
  blurDataURL?: string;
}

let cache: MediaAsset[] | undefined;

function manifestPath(): string | null {
  const candidates = [path.join(process.cwd(), "content", "media", "manifest.json"), path.join(process.cwd(), "apps", "web", "content", "media", "manifest.json")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function mediaManifest(): MediaAsset[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const file = manifestPath();
  if (!file) return (cache = []);
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { assets?: MediaAsset[] } | MediaAsset[];
  cache = Array.isArray(parsed) ? parsed : (parsed.assets ?? []);
  return cache;
}

export function mediaById(id: string): MediaAsset | null {
  return mediaManifest().find((asset) => asset.id === id) ?? null;
}

/** Assets carrying every given tag, in manifest order. */
export function mediaByTags(tags: string[]): MediaAsset[] {
  return mediaManifest().filter((asset) => tags.every((tag) => asset.tags.includes(tag)));
}

/** The srcset attribute for an image asset, or undefined when it has one size. */
export function srcSetOf(asset: MediaAsset): string | undefined {
  return asset.srcset?.length ? asset.srcset.map((s) => `${s.src} ${s.width}w`).join(", ") : undefined;
}

/** The visible credit line an asset needs (only when attribution is required). */
export function creditLine(asset: MediaAsset): string | null {
  return asset.credit.attribution_required ? `${asset.credit.creator} (${asset.credit.license})` : null;
}

import "server-only";

/**
 * Media manifest loader (apps/web/content/media/manifest.json). Minimal version shared with the
 * programmatic SEO pages: assets are matched by tag and each asset is used on at most one page
 * (seo_media_usage enforces it for generated pages). Schema per asset: id, kind, src, poster,
 * alt, credit, tags, usedOn, placeholder. An absent or empty manifest means pages render with no
 * image, never a stock fallback.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  credit?: string;
  tags: string[];
  usedOn?: string[];
  /** A tiny blurred placeholder (data URI) or a solid color. */
  placeholder?: string;
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

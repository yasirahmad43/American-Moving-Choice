import "server-only";

/**
 * Media contract: every image and video on the public site comes from
 * content/media/manifest.json (docs/media/inventory.md; `pnpm media:check` validates it against
 * the files on disk). One loader serves both the hand-built pages and the programmatic SEO
 * templates for exclusive slots. Those claims guarantee one owning page per asset. Reusable
 * commissioned editorial illustrations and video backgrounds use the separate, read-only
 * pageMediaPlan contract (docs/media/editorial-reuse.md), without changing these claims:
 *
 * - An asset reserves itself for one page with `usedOn: ["/route/"]`. The hand-built pages pin
 *   their assets this way; the SEO generator claims free assets (seo_media_usage) and
 *   `pnpm seo:media-sync` writes those claims back into usedOn.
 * - `claimMedia(page, tags)` returns an asset carrying every tag: one reserved for `page` first,
 *   else an unassigned asset no other page has claimed in this process (picked by a stable hash of
 *   the page route). `claimMediaById(page, id)` does the same for a named asset.
 * - Claiming an id that belongs to another page throws in development and logs in production.
 *   Loading the manifest throws on duplicate ids or an asset listing more than one page.
 *
 * Replacing an asset means editing its manifest entry; no component changes.
 */
import { resolvePageMedia } from "@amc/server/media";
import manifestJson from "@/content/media/manifest.json";
import type { MediaAsset, MediaCredit, MediaKind } from "./media-sources";

export type { MediaAsset, MediaCredit, MediaKind, MediaSource } from "./media-sources";
export { videoSourcesFor } from "./media-sources";

interface Manifest {
  version: number;
  assets: MediaAsset[];
}

const DEV = process.env.NODE_ENV !== "production";

function fail(message: string): never {
  throw new Error(message);
}

function validate(manifest: Manifest): Manifest {
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.id)) fail(`media manifest: duplicate asset id "${asset.id}"`);
    ids.add(asset.id);
    if (!Array.isArray(asset.usedOn) || asset.usedOn.length > 1) fail(`media manifest: asset "${asset.id}" may list at most one page in usedOn`);
    if (asset.kind === "video" && !asset.poster) fail(`media manifest: video "${asset.id}" needs a poster`);
    if (!(asset.width > 0 && asset.height > 0)) fail(`media manifest: asset "${asset.id}" needs width and height`);
  }
  return manifest;
}

const manifest: Manifest = validate(manifestJson as Manifest);

/** Every asset, in manifest order. */
export function mediaManifest(): MediaAsset[] {
  return manifest.assets;
}

/** An asset by id, or null. Read-only: no claim is recorded (the SEO store records its own). */
export function mediaById(id: string): MediaAsset | null {
  return manifest.assets.find((asset) => asset.id === id) ?? null;
}

/** Assets carrying every given tag, in manifest order. */
export function mediaByTags(tags: string[]): MediaAsset[] {
  return manifest.assets.filter((asset) => tags.every((tag) => asset.tags.includes(tag)));
}

/** Which page claimed each asset id in this server process: the reuse guard. */
const claims = new Map<string, string>();

function claim(asset: MediaAsset, page: string): MediaAsset {
  const owner = claims.get(asset.id) ?? asset.usedOn[0];
  if (owner && owner !== page) {
    const message = `media manifest: asset "${asset.id}" belongs to "${owner}" and was requested by "${page}"; every asset belongs to one page`;
    if (DEV) fail(message);
    console.error(message);
  }
  claims.set(asset.id, page);
  return asset;
}

/** Small stable hash so a page's pick doesn't depend on render order. */
function seed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Claims an asset for `page` that carries every tag in `tags`. Assets reserved for the page win;
 * otherwise an unassigned asset no other page has claimed. Throws when nothing matches, so a
 * missing picture surfaces at build time rather than as an empty frame.
 */
export function claimMedia(page: string, tags: string | string[], options: { kind?: MediaKind } = {}): MediaAsset {
  const wanted = Array.isArray(tags) ? tags : [tags];
  const matches = manifest.assets.filter((asset) => (!options.kind || asset.kind === options.kind) && wanted.every((tag) => asset.tags.includes(tag)));
  const reserved = matches.find((asset) => asset.usedOn.includes(page));
  if (reserved) return claim(reserved, page);
  const already = matches.find((asset) => claims.get(asset.id) === page);
  if (already) return already;
  const free = matches.filter((asset) => asset.usedOn.length === 0 && !claims.has(asset.id));
  if (!free.length) fail(`media manifest: no free asset for page "${page}" with tags [${wanted.join(", ")}]`);
  return claim(free[seed(`${page}|${wanted.join(",")}`) % free.length]!, page);
}

/** Like claimMedia, but null when the library has nothing left for the role (optional media slots). */
export function optionalMedia(page: string, tags: string | string[], options: { kind?: MediaKind } = {}): MediaAsset | null {
  try {
    return claimMedia(page, tags, options);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("media manifest: no free asset")) return null;
    throw error;
  }
}

/** A specific asset by id, claimed for `page`. For slots that name their asset outright. */
export function claimMediaById(page: string, id: string): MediaAsset {
  const asset = mediaById(id);
  if (!asset) fail(`media manifest: no asset with id "${id}"`);
  return claim(asset, page);
}

/**
 * The assets a programmatic page holds (seo_pages.media_ids), each claimed for that page. An id
 * that is missing from the manifest or reserved for another page is skipped with a logged
 * error rather than failing the page: the store and the manifest are reconciled by media-sync.
 */
export async function mediaForSeoPage(page: string, ids: string[]): Promise<MediaAsset[]> {
  return (await resolvePageMedia(page, ids)).map(({ upload: _upload, rejected: _rejected, ...asset }) => asset);
}

/** The srcset attribute for an image asset, or undefined when it has one size. */
export function srcSetOf(asset: MediaAsset): string | undefined {
  return asset.srcset?.length ? asset.srcset.map((s) => `${s.src} ${s.width}w`).join(", ") : undefined;
}

/** The visible credit line an asset needs (only when attribution is required). */
export function creditLine(asset: MediaAsset): string | null {
  return asset.credit.attribution_required ? `${asset.credit.creator} (${asset.credit.license})` : null;
}

/** All assets whose credit requires attribution (for a credits line in the footer). */
export function attributionCredits(): { id: string; credit: MediaCredit }[] {
  return manifest.assets.filter((asset) => asset.credit.attribution_required).map((asset) => ({ id: asset.id, credit: asset.credit }));
}

/** True when any shipped asset is still placeholder art. */
export function hasPlaceholderMedia(): boolean {
  return manifest.assets.some((asset) => asset.placeholder);
}

/** next/image can't optimize SVG art; everything else goes through the optimizer. */
export function isUnoptimizable(asset: MediaAsset): boolean {
  return /\.svg(\?|$)/i.test(asset.src);
}

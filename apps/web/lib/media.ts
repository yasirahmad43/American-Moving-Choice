/**
 * Media contract (design/premium): every image and video on the public site comes from
 * content/media/manifest.json (docs/media/inventory.md). Pages claim assets by tag, and the
 * loader guarantees that no asset id is used on more than one page:
 *
 * - An asset may reserve itself for one page with `usedOn: ["/route/"]`; most ship unassigned
 *   (`usedOn: []`) and are claimed at build time.
 * - `claimMedia(page, tags)` returns an asset carrying every tag that is either reserved for
 *   `page` or unassigned and not yet claimed by another page in this process. The pick is stable
 *   for a page (seeded by the page route), so the same page keeps the same asset across renders.
 * - Loading the manifest throws if two assets share an id or an asset lists more than one page,
 *   and claiming throws in development (logs in production) if the id already belongs to another
 *   page. `pnpm media:check` validates the manifest against the files on disk.
 *
 * Replacing an asset means editing its manifest entry; no component changes.
 */
import manifestJson from "@/content/media/manifest.json";

export type MediaKind = "image" | "video";

export interface MediaCredit {
  creator: string;
  source_url: string;
  license: string;
  attribution_required: boolean;
}

export interface MediaSource {
  src: string;
  type: string;
  /** A smaller tier for small viewports; absent for the full-size encoding. */
  width?: number;
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string;
  srcset?: { src: string; width: number }[];
  sources?: MediaSource[];
  poster?: string;
  width: number;
  height: number;
  alt: string;
  autoplay?: boolean;
  duration?: number;
  blurDataURL?: string;
  credit: MediaCredit;
  generator?: { provider?: string; model?: string; prompt?: string; job_id?: string; generated_at?: string };
  tags: string[];
  usedOn: string[];
  placeholder?: boolean;
  generated?: boolean;
}

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

/** Which page claimed each asset id in this server process: the reuse guard. */
const claims = new Map<string, string>();

function claim(asset: MediaAsset, page: string): MediaAsset {
  const owner = claims.get(asset.id);
  if (owner && owner !== page) {
    const message = `media manifest: asset "${asset.id}" is used on "${owner}" and "${page}"; every asset belongs to one page`;
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

/** A specific asset by id, claimed for `page`. For the few slots that name their asset outright. */
export function mediaById(page: string, id: string): MediaAsset {
  const asset = manifest.assets.find((candidate) => candidate.id === id);
  if (!asset) fail(`media manifest: no asset with id "${id}"`);
  if (asset.usedOn.length && !asset.usedOn.includes(page)) fail(`media manifest: asset "${id}" is reserved for ${asset.usedOn[0]}, not "${page}"`);
  return claim(asset, page);
}

/** @deprecated Use claimMedia. Kept for callers that pass a single tag. */
export const mediaFor = (page: string, tag: string): MediaAsset => claimMedia(page, tag);

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

/** The video sources in playback order for a viewport: the smaller tier first on narrow screens. */
export function videoSourcesFor(asset: MediaAsset, viewportWidth: number): MediaSource[] {
  const sources = asset.sources?.length ? asset.sources : [{ src: asset.src, type: "video/mp4" }];
  const small = viewportWidth > 0 && viewportWidth < 900;
  const tier = (source: MediaSource) => (source.width && source.width < asset.width ? "small" : "full");
  return [...sources].sort((a, b) => {
    const pa = tier(a) === (small ? "small" : "full") ? 0 : 1;
    const pb = tier(b) === (small ? "small" : "full") ? 0 : 1;
    return pa - pb;
  });
}

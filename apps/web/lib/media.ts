/**
 * Media contract (design/premium): every image and video on the public site comes from
 * content/media/manifest.json. A page asks for an asset by page route and tag, and the loader
 * guarantees that no asset id is used on more than one page:
 *
 * - The manifest declares, per asset, exactly one `usedOn` route. Loading the manifest throws in
 *   development if two assets share an id or an asset lists more than one route.
 * - `mediaFor(page, tag)` returns the asset that lists `page` and carries `tag`. In development
 *   it throws if that asset id was already handed to a different page in this process.
 *
 * Replacing placeholder art with licensed photography or video means editing the manifest entry
 * (src, poster, width, height, alt, credit) and dropping `placeholder`; no component changes.
 */
import manifestJson from "@/content/media/manifest.json";

export type MediaKind = "image" | "video";

export interface MediaCredit {
  creator: string;
  source_url: string;
  license: string;
  attribution_required: boolean;
}

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string;
  sources?: { src: string; type: string }[];
  poster?: string;
  width: number;
  height: number;
  alt: string;
  autoplay?: boolean;
  credit: MediaCredit;
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

function validate(manifest: Manifest): Manifest {
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.id)) fail(`media manifest: duplicate asset id "${asset.id}"`);
    ids.add(asset.id);
    if (!Array.isArray(asset.usedOn) || asset.usedOn.length !== 1) fail(`media manifest: asset "${asset.id}" must list exactly one page in usedOn`);
    if (asset.kind === "video" && !asset.poster) fail(`media manifest: video "${asset.id}" needs a poster`);
    if (!(asset.width > 0 && asset.height > 0)) fail(`media manifest: asset "${asset.id}" needs width and height`);
  }
  return manifest;
}

function fail(message: string): never {
  throw new Error(message);
}

const manifest: Manifest = validate(manifestJson as Manifest);

/** Which page claimed each asset id in this server process (dev guard against reuse). */
const claims = new Map<string, string>();

/**
 * The asset a page uses for a role (tag). Throws when the page has no such asset so a missing
 * manifest entry surfaces at build time rather than as an empty frame.
 */
export function mediaFor(page: string, tag: string): MediaAsset {
  const asset = manifest.assets.find((candidate) => candidate.usedOn.includes(page) && candidate.tags.includes(tag));
  if (!asset) fail(`media manifest: no asset for page "${page}" with tag "${tag}"`);
  const owner = claims.get(asset.id);
  if (owner && owner !== page) {
    const message = `media manifest: asset "${asset.id}" is used on "${owner}" and "${page}"; every asset belongs to one page`;
    if (DEV) fail(message);
    console.error(message);
  }
  claims.set(asset.id, page);
  return asset;
}

/** The asset when the page has one for that role, else null (optional media slots). */
export function optionalMediaFor(page: string, tag: string): MediaAsset | null {
  try {
    return mediaFor(page, tag);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("media manifest: no asset")) return null;
    throw error;
  }
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

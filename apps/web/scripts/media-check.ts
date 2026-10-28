/**
 * `pnpm media:check` — validates apps/web/content/media/manifest.json against apps/web/public.
 *
 * Fails (exit 1) when:
 *  - an asset id is missing, malformed or duplicated;
 *  - a referenced file (src, srcset[], sources[], poster) does not exist under apps/web/public;
 *  - the declared width/height do not match the file on disk (images and posters via sharp,
 *    videos via ffprobe when it is installed);
 *  - an asset is listed on more than one page, or the same page is listed twice (usedOn reuse);
 *  - a video has no poster, or a credit is incomplete.
 *
 * Assets with an empty usedOn are allowed (the library ships unassigned; pages claim assets later)
 * and are reported as a count.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

interface Credit { creator: string; source_url: string; license: string; attribution_required: boolean }
interface Asset {
  id: string; kind: "image" | "video"; src: string; srcset?: { src: string; width: number }[];
  sources?: { src: string; type: string; width?: number }[]; poster?: string; width: number; height: number;
  alt: string; credit: Credit; tags: string[]; usedOn: string[]; placeholder?: boolean; blurDataURL?: string;
}
interface Manifest { version: number; assets: Asset[] }

const webRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(webRoot, "content/media/manifest.json");
const publicDir = path.join(webRoot, "public");
const errors: string[] = [];
const warnings: string[] = [];

function fileFor(src: string): string | null {
  if (/^https?:\/\//.test(src)) return null;
  return path.join(publicDir, src.replace(/^\//, "").split("?")[0] ?? "");
}

function mustExist(id: string, src: string | undefined, what: string): string | null {
  if (!src) return null;
  const file = fileFor(src);
  if (file === null) return null; // absolute URLs are not checked
  if (!existsSync(file) || statSync(file).size === 0) {
    errors.push(`${id}: ${what} "${src}" does not exist under apps/web/public`);
    return null;
  }
  return file;
}

async function imageSize(file: string): Promise<{ width: number; height: number } | null> {
  try {
    const meta = await sharp(file).metadata();
    if (meta.width && meta.height) return { width: meta.width, height: meta.height };
  } catch {
    /* fall through */
  }
  return null;
}

let ffprobeAvailable = true;
function videoSize(file: string): { width: number; height: number } | null {
  if (!ffprobeAvailable) return null;
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file], { encoding: "utf8" }).trim();
    const [w, h] = (out.split("\n")[0] ?? "").split(",").map(Number);
    if (w !== undefined && h !== undefined && w > 0 && h > 0) return { width: w, height: h };
  } catch {
    ffprobeAvailable = false;
    warnings.push("ffprobe is not installed; video dimensions were not verified");
  }
  return null;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  if (!Array.isArray(manifest.assets)) throw new Error("manifest.assets must be an array");

  const ids = new Set<string>();
  const pageClaims = new Map<string, string>(); // asset id -> page (first claim)
  let unassigned = 0;
  let totalBytes = 0;
  const counted = new Set<string>();
  const count = (file: string): void => {
    if (counted.has(file)) return;
    counted.add(file);
    totalBytes += statSync(file).size;
  };

  for (const asset of manifest.assets) {
    const id = asset.id;
    if (!id || !/^[a-z0-9-]+$/.test(id)) errors.push(`asset with invalid id ${JSON.stringify(id)}`);
    if (ids.has(id)) errors.push(`duplicate asset id "${id}"`);
    ids.add(id);
    if (asset.kind !== "image" && asset.kind !== "video") errors.push(`${id}: kind must be "image" or "video"`);
    if (typeof asset.alt !== "string") errors.push(`${id}: alt must be a string (empty for decorative media)`);
    if (!Array.isArray(asset.tags) || asset.tags.length === 0) errors.push(`${id}: tags must be a non-empty array`);
    const c = asset.credit;
    if (!c || typeof c.creator !== "string" || typeof c.source_url !== "string" || typeof c.license !== "string" || typeof c.attribution_required !== "boolean") errors.push(`${id}: credit is incomplete`);
    if (!(asset.width > 0 && asset.height > 0)) errors.push(`${id}: width and height must be positive integers`);

    // usedOn: at most one page, no duplicates, no reuse across assets of the same id
    if (!Array.isArray(asset.usedOn)) errors.push(`${id}: usedOn must be an array`);
    else {
      const pages = asset.usedOn;
      if (pages.length === 0) unassigned++;
      if (new Set(pages).size !== pages.length) errors.push(`${id}: usedOn lists the same page more than once`);
      if (pages.length > 1) errors.push(`${id}: used on ${pages.length} pages (${pages.join(", ")}); every asset belongs to exactly one page`);
      for (const page of pages) {
        const owner = pageClaims.get(id);
        if (owner && owner !== page) errors.push(`${id}: claimed by both "${owner}" and "${page}"`);
        pageClaims.set(id, page);
      }
    }

    // files + dimensions
    const mainFile = mustExist(id, asset.src, "src");
    if (mainFile) {
      count(mainFile);
      const size = asset.kind === "image" ? await imageSize(mainFile) : videoSize(mainFile);
      if (size && (size.width !== asset.width || size.height !== asset.height)) errors.push(`${id}: manifest says ${asset.width}x${asset.height} but ${asset.src} is ${size.width}x${size.height}`);
      if (asset.kind === "image" && !size) errors.push(`${id}: could not read image dimensions from ${asset.src}`);
    }
    for (const v of asset.srcset ?? []) {
      const f = mustExist(id, v.src, "srcset entry");
      if (f) {
        count(f);
        const size = await imageSize(f);
        if (size && size.width !== v.width) errors.push(`${id}: srcset entry ${v.src} declares width ${v.width} but is ${size.width}px wide`);
      }
    }
    if (asset.kind === "video") {
      if (!asset.poster) errors.push(`${id}: video needs a poster`);
      const posterFile = mustExist(id, asset.poster, "poster");
      if (posterFile) {
        count(posterFile);
        const size = await imageSize(posterFile);
        if (size && Math.abs(size.width / size.height - asset.width / asset.height) > 0.01) errors.push(`${id}: poster aspect ratio does not match the video`);
      }
      for (const s of asset.sources ?? []) {
        const f = mustExist(id, s.src, `source (${s.type})`);
        if (f) {
          count(f);
          const size = videoSize(f);
          const expectedWidth = s.width ?? asset.width;
          if (size && size.width !== expectedWidth) errors.push(`${id}: source ${s.src} is ${size.width}px wide, expected ${expectedWidth}`);
        }
      }
    } else if (asset.poster) warnings.push(`${id}: image assets do not need a poster`);
    if (asset.blurDataURL && !asset.blurDataURL.startsWith("data:image/")) errors.push(`${id}: blurDataURL must be a data: image URL`);
  }

  const summary = `${manifest.assets.length} assets (${manifest.assets.filter((a) => a.kind === "video").length} video), ${unassigned} unassigned, ${(totalBytes / 1048576).toFixed(1)} MB referenced under apps/web/public`;
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`error: ${e}`);
    console.error(`media:check failed with ${errors.length} error(s); ${summary}`);
    process.exit(1);
  }
  console.log(`media:check ok; ${summary}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

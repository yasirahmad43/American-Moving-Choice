/**
 * The programmatic SEO pipeline CLI (site architecture §4, §8). Connects to DATABASE_URL
 * (default: the local dev database) with pg directly, so it needs none of the app's secrets.
 *
 *   tsx scripts/seo.ts import-geo
 *   tsx scripts/seo.ts import-research <csv> [<csv>...]
 *   tsx scripts/seo.ts generate <family> [--limit N] [--only slug,slug]
 *   tsx scripts/seo.ts publish [--status ready] [--family x] [--limit N]
 *   tsx scripts/seo.ts review --reviewer "Name" [--family x]   (marks ready pages as reviewed)
 *   tsx scripts/seo.ts report
 *
 * Media: if apps/web/content/media/manifest.json exists, its assets are offered to the generator
 * (one asset per page, never reused; apps/web/lib/media.ts reads the same manifest).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { importGeo } from "../src/seo/geo-import";
import { generateFamily } from "../src/seo/generate";
import { pipelineCounts, publishPages } from "../src/seo/publish";
import { importResearch } from "../src/seo/research";
import { isSeoFamily } from "../src/seo/slugs";
import type { MediaAsset } from "../src/seo/types";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_URL = "postgres://amc_app:amc_app@localhost:5432/amc_dev";

function flags(args: string[]): { positional: string[]; options: Record<string, string> } {
  const positional: string[] = [];
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const [key, inline] = arg.slice(2).split("=", 2);
      options[key!] = inline ?? (args[i + 1] && !args[i + 1]!.startsWith("--") ? args[++i]! : "true");
    } else positional.push(arg);
  }
  return { positional, options };
}

function loadMedia(): MediaAsset[] {
  const path = join(here, "..", "..", "..", "apps", "web", "content", "media", "manifest.json");
  if (!existsSync(path)) return [];
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { assets?: MediaAsset[] } | MediaAsset[];
  // Assets the admin rejected (manifest `rejected`) are never offered to the generator.
  return (Array.isArray(parsed) ? parsed : (parsed.assets ?? [])).filter((a) => !(a as { rejected?: unknown }).rejected);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, options } = flags(rest);
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  const pool = new pg.Pool({ connectionString: url, max: 4 });
  const log = (line: string) => console.log(line);
  try {
    switch (command) {
      case "import-geo": {
        const result = await importGeo(pool, { log, metroCount: options.metros ? Number(options.metros) : undefined });
        console.log(JSON.stringify(result));
        break;
      }
      case "import-research": {
        if (!positional.length) throw new Error("usage: import-research <csv> [<csv>...]");
        // pnpm runs the script in packages/server; paths are relative to where the command was typed.
        for (const file of positional) await importResearch(pool, resolve(process.env.INIT_CWD ?? process.cwd(), file), log);
        break;
      }
      case "generate": {
        const family = positional[0] ?? "";
        if (!isSeoFamily(family)) throw new Error(`unknown family "${family}"`);
        const summary = await generateFamily(pool, family, { limit: options.limit ? Number(options.limit) : undefined, only: options.only ? options.only.split(",") : undefined, media: loadMedia(), log });
        console.log(JSON.stringify(summary));
        break;
      }
      case "publish": {
        const status = (options.status ?? "ready") as "ready" | "review" | "draft";
        const family = options.family;
        if (family && !isSeoFamily(family)) throw new Error(`unknown family "${family}"`);
        const summary = await publishPages(pool, { status, family: family && isSeoFamily(family) ? family : undefined, limit: options.limit ? Number(options.limit) : undefined, log });
        console.log(JSON.stringify(summary));
        break;
      }
      case "review": {
        if (!options.reviewer) throw new Error("usage: review --reviewer \"Name\" [--family x]");
        const result = await pool.query("update seo_pages set reviewed_by = $1, last_reviewed_at = now() where status in ('ready', 'published') and ($2::text is null or family = $2)", [options.reviewer, options.family ?? null]);
        console.log(`reviewed ${result.rowCount} pages as ${options.reviewer}`);
        break;
      }
      case "media-sync": {
        // Writes the pages' claims (seo_pages.media_ids) into the manifest's usedOn, so `pnpm media:check` validates them.
        const path = join(here, "..", "..", "..", "apps", "web", "content", "media", "manifest.json");
        const manifest = JSON.parse(readFileSync(path, "utf8")) as { assets: { id: string; usedOn: string[] }[] };
        const claims = await pool.query<{ url: string; media_ids: string[] }>("select url, media_ids from seo_pages where jsonb_array_length(media_ids) > 0");
        const byAsset = new Map<string, string>();
        for (const row of claims.rows) for (const id of row.media_ids) byAsset.set(id, row.url);
        let changed = 0;
        for (const asset of manifest.assets) {
          const owner = byAsset.get(asset.id);
          const next = owner ? [owner] : asset.usedOn.filter((u) => !/^\/(movers|routes|services|moving-costs|questions|planning)\//.test(u));
          if (JSON.stringify(next) !== JSON.stringify(asset.usedOn)) {
            asset.usedOn = next;
            changed++;
          }
        }
        writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
        console.log(`media-sync: ${byAsset.size} assets claimed by pages, ${changed} manifest entries updated`);
        break;
      }
      case "report": {
        const counts = await pipelineCounts(pool);
        console.table(counts.map(({ blockedReasons, ...row }) => ({ ...row, blockedReasons: JSON.stringify(blockedReasons) })));
        break;
      }
      default:
        throw new Error("usage: seo.ts <import-geo | import-research | generate | publish | review | report>");
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

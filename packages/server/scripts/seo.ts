/**
 * The programmatic SEO pipeline CLI (site architecture §4, §8). Connects to DATABASE_URL
 * (default: the local dev database) with pg directly, so it needs none of the app's secrets.
 *
 *   tsx scripts/seo.ts import-geo
 *   tsx scripts/seo.ts import-research <csv> [<csv>...]
 *   tsx scripts/seo.ts generate <family> [--limit N] [--only slug,slug] [--reasons metro_pair,state_pair] [--min-population N] [--chunk N]
 *   tsx scripts/seo.ts publish [--status ready] [--family x] [--limit N]
 *   tsx scripts/seo.ts review --reviewer "Name" [--family x]   (marks ready pages as reviewed)
 *   tsx scripts/seo.ts report
 *
 * Media: if apps/web/content/media/manifest.json exists, its assets are offered to the generator
 * (one asset per page, never reused; apps/web/lib/media.ts reads the same manifest).
 */
import { resolve } from "node:path";
import pg from "pg";
import { importGeo } from "../src/seo/geo-import";
import { generateFamily } from "../src/seo/generate";
import { pipelineCounts, publishPages } from "../src/seo/publish";
import { importResearch } from "../src/seo/research";
import { isSeoFamily } from "../src/seo/slugs";
import { claimableMedia } from "../src/media/manifest";
import { syncMediaManifest } from "../src/admin/content-media";

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
        const summary = await generateFamily(pool, family, {
          limit: options.limit ? Number(options.limit) : undefined,
          only: options.only ? options.only.split(",") : undefined,
          reasons: options.reasons ? options.reasons.split(",") : undefined,
          minPopulation: options["min-population"] ? Number(options["min-population"]) : undefined,
          chunkSize: options.chunk ? Number(options.chunk) : undefined,
          media: await claimableMedia(pool),
          log,
        });
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
        const result = await syncMediaManifest(pool);
        console.log(`media-sync: ${result.claimed} assets claimed, ${result.changed} database manifest records updated`);
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

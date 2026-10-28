/** Debug helper: which pages hold a given page's shingles that match a substring. Usage: tsx scripts/seo-probe-shingle.ts <url> <substring> */
import pg from "pg";
import { mainText, shingleHash, shingles } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";

async function main(): Promise<void> {
  const [url, needle] = process.argv.slice(2);
  if (!url || !needle) throw new Error("usage: seo-probe-shingle.ts <url> <substring>");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://amc_app:amc_app@localhost:5432/amc_dev", max: 2 });
  try {
    const page = await pool.query<{ family: string; content: SeoContent }>("select family, content from seo_pages where url = $1", [url]);
    const text = mainText(page.rows[0]!.content);
    const lines = text.split("\n");
    console.log(lines.filter((l) => l.toLowerCase().includes(needle.toLowerCase())).slice(0, 5));
    const list = [...shingles(text)].filter((s) => s.includes(needle.toLowerCase()));
    for (const s of list.slice(0, 6)) {
      const r = await pool.query<{ page_url: string }>("select page_url from seo_shingles where family = $1 and h = $2 limit 6", [page.rows[0]!.family, shingleHash(s)]);
      console.log(JSON.stringify(s), "->", r.rows.map((x) => x.page_url).join(", "));
    }
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

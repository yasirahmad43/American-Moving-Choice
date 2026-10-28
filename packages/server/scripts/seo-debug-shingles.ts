/**
 * Debug helper: prints, for one page URL, the share of shared shingles per section and the most
 * common shared 5-word shingles, so a template author can see which phrasing repeats across the
 * family. Usage: tsx scripts/seo-debug-shingles.ts /movers/arizona/peoria/
 */
import pg from "pg";
import { mainText, shingleHash, shingles } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) throw new Error("usage: seo-debug-shingles.ts <url>");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://amc_app:amc_app@localhost:5432/amc_dev", max: 2 });
  try {
    const page = await pool.query<{ family: string; content: SeoContent }>("select family, content from seo_pages where url = $1", [url]);
    if (!page.rows[0]) throw new Error("no such page");
    const { family, content } = page.rows[0];
    const all = [...shingles(mainText(content))];
    const counts = await pool.query<{ h: number; n: number }>("select h, count(*)::int as n from seo_shingles where family = $1 and h = any($2::int[]) group by h", [family, all.map(shingleHash)]);
    const countOf = new Map(counts.rows.map((r) => [r.h, r.n]));
    const shared = all.filter((s) => (countOf.get(shingleHash(s)) ?? 0) > 1);
    console.log(`${url}: ${all.length} shingles, ${shared.length} shared (${Math.round((100 * (all.length - shared.length)) / all.length)}% unique)`);
    const parts: { label: string; text: string }[] = [{ label: "intro", text: [content.intro.answer, ...content.intro.dataPoints.map((d) => `${d.label} ${d.value}`)].join("\n") }];
    for (const s of content.sections) parts.push({ label: s.id, text: mainText({ ...content, intro: { answer: "", dataPoints: [] }, sections: [s], faq: [] }) });
    parts.push({ label: "faq", text: content.faq.map((f) => `${f.question}\n${f.answer}`).join("\n") });
    for (const p of parts) {
      const sh = [...shingles(p.text)];
      const sharedHere = sh.filter((s) => (countOf.get(shingleHash(s)) ?? 0) > 1).length;
      console.log(`  ${p.label.padEnd(10)} ${String(sh.length).padStart(5)} shingles, ${String(sharedHere).padStart(5)} shared`);
    }
    const top = shared.map((s) => [s, countOf.get(shingleHash(s))!] as const).sort((a, b) => b[1] - a[1]).slice(0, 25);
    for (const [s, c] of top) console.log(`  ${String(c).padStart(4)}× ${s}`);
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

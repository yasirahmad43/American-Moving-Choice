/** A packed, rebuildable corpus. No per-shingle rows, SQL aggregate sort or temporary index. */
import type { Queryable } from "../db/pool";
import { createHash } from "node:crypto";
import type { SeoFamily } from "./slugs";
import { mainText, shingleHashes } from "./text";
import type { SeoContent } from "./types";

export class CorpusChangedError extends Error {
  constructor() { super("SEO corpus changed during scoring; pages remain unapproved. Retry the family after other generation finishes."); this.name = "CorpusChangedError"; }
}

interface CorpusPage { url: string; family: string; content_hash: string; hashes: number[] }
export interface CorpusSnapshot { pages: number; hashes: string; fingerprint: string }
const BATCH = 100;

/** Source-hash condition prevents an interrupted/concurrent page edit from saving stale hashes. */
export async function persistPageShingles(db: Queryable, pages: CorpusPage[]): Promise<void> {
  if (!pages.length) return;
  await db.query(`insert into seo_page_shingles(page_url,family,content_hash,hashes)
    select d.url,d.family,d.content_hash,d.hashes from jsonb_to_recordset($1::jsonb)
      as d(url text,family text,content_hash text,hashes integer[])
      join seo_pages p on p.url=d.url and p.content_hash=d.content_hash and p.family=d.family
    on conflict(page_url) do update set family=excluded.family,content_hash=excluded.content_hash,hashes=excluded.hashes
    where seo_page_shingles.content_hash is distinct from excluded.content_hash or seo_page_shingles.family is distinct from excluded.family`, [JSON.stringify(pages)]);
}

async function assertSourcesCurrent(db: Queryable, family?: SeoFamily): Promise<void> {
  const stale = await db.query(`select 1 from seo_pages p left join seo_page_shingles s on s.page_url=p.url
    where ($1::text is null or p.family=$1) and (s.page_url is null or s.content_hash<>p.content_hash or s.family<>p.family) limit 1`, [family ?? null]);
  if (stale.rowCount) throw new CorpusChangedError();
}

/** Repair migration 230 and partial builds from saved content, including checkpointed families. */
export async function ensureShingleCorpus(db: Queryable, options: { family?: SeoFamily; log?: (line: string) => void; onProgress?: () => Promise<void> } = {}): Promise<number> {
  let after = "";
  let repaired = 0;
  for (;;) {
    const pages = await db.query<{ url: string; family: string; content_hash: string; content: SeoContent }>(
      `select p.url,p.family,p.content_hash,p.content from seo_pages p left join seo_page_shingles s on s.page_url=p.url
       where p.url>$1 and ($2::text is null or p.family=$2)
       and (s.page_url is null or s.content_hash<>p.content_hash or s.family<>p.family) order by p.url limit $3`, [after, options.family ?? null, BATCH]);
    if (!pages.rows.length) break;
    await persistPageShingles(db, pages.rows.map((page) => ({ ...page, hashes: shingleHashes(mainText(page.content)) })));
    after = pages.rows[pages.rows.length - 1]!.url;
    repaired += pages.rows.length;
    await options.onProgress?.();
  }
  await assertSourcesCurrent(db, options.family);
  if (repaired) options.log?.(`seo corpus: repaired ${repaired} packed page records from saved content`);
  return repaired;
}

export async function corpusSnapshot(db: Queryable, family: SeoFamily): Promise<CorpusSnapshot> {
  // Sequence allocation is not commit order. Hash every small metadata record, rather than
  // MAX(revision), so a delayed lower-revision commit cannot slip between the two passes.
  const rows = await db.query<{ page_url: string; content_hash: string; revision: string; n: number }>(
    "select page_url,content_hash,revision::text,cardinality(hashes) n from seo_page_shingles where family=$1 order by page_url", [family]);
  const digest = createHash("sha256");
  let hashes = 0;
  for (const row of rows.rows) { digest.update(`${row.page_url}|${row.content_hash}|${row.revision}|${row.n}\n`); hashes += row.n; }
  return { pages: rows.rows.length, hashes: String(hashes), fingerprint: digest.digest("hex") };
}

export async function assertCorpusSnapshot(db: Queryable, family: SeoFamily, expected: CorpusSnapshot): Promise<void> {
  const actual = await corpusSnapshot(db, family);
  if (actual.pages !== expected.pages || actual.hashes !== expected.hashes || actual.fingerprint !== expected.fingerprint) throw new CorpusChangedError();
  await assertSourcesCurrent(db, family);
}

/** Two bounded passes. An insert/update/delete revision/count fingerprint fences both passes. */
export async function scoreShingleCorpus(db: Queryable, family: SeoFamily, urls: string[], log: (line: string) => void = () => undefined): Promise<{ shares: Map<string, number>; snapshot: CorpusSnapshot }> {
  const started = Date.now();
  await assertSourcesCurrent(db, family);
  const snapshot = await corpusSnapshot(db, family);
  const all = new Int32Array(Number(snapshot.hashes));
  let filled = 0;
  let pagesRead = 0;
  let after = "";
  for (;;) {
    const rows = await db.query<{ page_url: string; hashes: number[] }>("select page_url,hashes from seo_page_shingles where family=$1 and page_url>$2 order by page_url limit $3", [family, after, BATCH]);
    if (!rows.rows.length) break;
    for (const row of rows.rows) {
      if (filled + row.hashes.length > all.length) throw new CorpusChangedError();
      all.set(row.hashes, filled); filled += row.hashes.length; pagesRead++;
    }
    after = rows.rows[rows.rows.length - 1]!.page_url;
  }
  if (filled !== all.length || pagesRead !== snapshot.pages) throw new CorpusChangedError();
  all.sort();
  let singletonCount = 0;
  for (let i = 0; i < all.length;) { let j = i + 1; while (j < all.length && all[j] === all[i]) j++; if (j === i + 1) singletonCount++; i = j; }
  const singles = new Int32Array(singletonCount);
  let cursor = 0;
  for (let i = 0; i < all.length;) { let j = i + 1; while (j < all.length && all[j] === all[i]) j++; if (j === i + 1) singles[cursor++] = all[i]!; i = j; }
  const isSingle = (h: number) => {
    let lo = 0, hi = singles.length - 1;
    while (lo <= hi) { const mid = (lo + hi) >>> 1, value = singles[mid]!; if (value === h) return true; if (value < h) lo = mid + 1; else hi = mid - 1; }
    return false;
  };
  const shares = new Map<string, number>();
  for (let i = 0; i < urls.length; i += BATCH) {
    const rows = await db.query<{ page_url: string; hashes: number[] }>("select page_url,hashes from seo_page_shingles where family=$1 and page_url=any($2::text[])", [family, urls.slice(i, i + BATCH)]);
    for (const row of rows.rows) { let unique = 0; for (const hash of row.hashes) if (isSingle(hash)) unique++; shares.set(row.page_url, row.hashes.length ? unique / row.hashes.length : 0); }
  }
  await assertCorpusSnapshot(db, family, snapshot);
  log(`${family}: exact uniqueness over ${filled.toLocaleString("en-US")} hashes of ${pagesRead} packed pages (${Math.round((Date.now() - started) / 1000)}s)`);
  return { shares, snapshot };
}

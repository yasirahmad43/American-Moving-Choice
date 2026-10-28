import type { Queryable } from "../src/db/pool";
import { mainText, sha256 } from "../src/seo/text";
import type { SeoContent } from "../src/seo/types";

export function corpusContent(answer: string): SeoContent {
  return { version: 1, intro: { answer, dataPoints: [] }, sections: [], faq: [], related: [], quote: { entry: "household", heading: "Request quotes", text: "Choose your contact limit", cta: "Get quotes" }, schemaType: "WebPage", credits: [], dataAsOf: "2026-10-28" };
}
export async function insertCorpusFixtures(db: Queryable, pages: { url: string; family?: string; answer: string; published?: boolean }[]): Promise<void> {
  const rows = pages.map((page) => { const content = corpusContent(page.answer); return { url: page.url, family: page.family ?? "route", content, hash: sha256(mainText(content)), published: page.published ?? false }; });
  await db.query(`insert into seo_pages(url,slug,family,primary_keyword,primary_keyword_normalized,intent,title,meta_description,h1,content,content_hash,canonical_url,status,indexable)
    select d.url,split_part(d.url,'/',3),d.family,d.url,d.url,'informational','Corpus verification guide',
    'A deliberately isolated test guide for checking the persistent corpus.','Corpus guide',d.content,d.hash,d.url,
    case when d.published then 'published' else 'draft' end,d.published
    from jsonb_to_recordset($1::jsonb) as d(url text,family text,content jsonb,hash text,published boolean)`, [JSON.stringify(rows)]);
}

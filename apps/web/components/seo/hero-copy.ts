import type { SeoPageRecord } from "@amc/server/seo";
import { stripLinks } from "./inline-text";

/** Return a complete opening, never a fragment cut to fit a search-snippet character count. */
function firstCompleteSentence(text: string): string | null {
  let lead = "";
  for (const item of new Intl.Segmenter("en-US", { granularity: "sentence" }).segment(stripLinks(text).trim())) {
    lead += item.segment;
    const sentence = lead.trim();
    if (/(?:…|\.{2,})[\s"'”’]*$/.test(sentence) || !/[.!?]["'”’]?$/.test(sentence)) return null;
    // Keep place-name abbreviations and a bare Yes/No with the sentence that explains them.
    if (/\b(?:St|Mt|Ft|Ste|Dr|Mr|Ms|Jr|Sr|vs)\.$/i.test(sentence) || /^(?:yes|no|sometimes|usually|not always|not necessarily|it depends)[.!?]$/i.test(sentence)) continue;
    return sentence;
  }
  return null;
}

/** Brief authored summaries introduce the topic; the entire qualified answer stays in the body. */
export function seoHeroCopy(page: Pick<SeoPageRecord, "metaDescription" | "content">): string {
  const answer = stripLinks(page.content.intro.answer).trim();
  const candidates = [firstCompleteSentence(page.metaDescription ?? ""), firstCompleteSentence(answer)].filter((text): text is string => Boolean(text));
  // Never slice a sentence to hit this presentation budget. Unusually long complete sentences
  // remain visible for review instead of silently dropping their final qualification.
  return candidates.find(text => text.split(/\s+/).length <= 60) ?? candidates[0] ?? answer;
}

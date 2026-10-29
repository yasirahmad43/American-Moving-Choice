import type { SeoPageRecord } from "@amc/server/seo";
import { stripLinks } from "./inline-text";

/** Search snippets may end mid-clause. Reader copy uses complete, already-published guidance. */
export function seoHeroCopy(page: Pick<SeoPageRecord, "family" | "content">): string {
  const answer = stripLinks(page.content.intro.answer).trim();
  // Keep complete answers and their qualifications together on advice/service pages.
  if (!["city", "state", "route", "zip"].includes(page.family)) return answer;
  // Geo intros have a self-contained opening fact, followed by a dated network summary.
  // The complete original paragraph and its data/source context remain in the reading section.
  let lead = "";
  for (const item of new Intl.Segmenter("en-US", { granularity: "sentence" }).segment(answer)) {
    lead += item.segment;
    // Segmenters can treat place-name abbreviations (St. Louis, Mt. Pleasant) as sentences.
    if (/\b(?:St|Mt|Ft|Ste|Dr|Mr|Ms|Jr|Sr|vs)\.$/i.test(lead.trim())) continue;
    return lead.trim();
  }
  return answer;
}

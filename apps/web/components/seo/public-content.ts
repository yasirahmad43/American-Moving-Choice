import type { SeoPageRecord } from "@amc/server/seo";

const CONTACT_EXPLANATION = "Tell us about your move and choose the maximum number of participating companies that may contact you. Companies introduce themselves when they reach out.";
const RETIRED_DIRECTORY_LINK = /\[[^\]]*\]\((?:https?:\/\/[^/\s)]+)?\/(?:companies|directory)\/[^)]*\)/gi;
const RETIRED_DIRECTORY_URL = /(?:https?:\/\/[^/\s)]+)?\/(?:companies|directory)\/[^\s)"'<>]*/gi;
const LEGACY_DISCLOSURE = /by name and USDOT|movers? named on (?:your|the) Review and send screen|every mover named before|review every name|the list above names them|remove any (?:named )?mover/i;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Published content can predate the contact-introduction flow. Do not expose archived mover
 * lists or their identities through HTML, RSC props, links, FAQs, or structured data.
 */
export function publicSeoPage(page: SeoPageRecord): SeoPageRecord {
  const identities = [...new Set(page.content.sections.flatMap((section) => section.blocks)
    .flatMap((block) => block.type === "movers" ? block.items.map((mover) => mover.name) : [])
    .filter(Boolean))].sort((a, b) => b.length - a.length)
    .map((name) => new RegExp(escapeRegExp(name), "gi"));
  const redact = (text: string) => {
    let result = text.replace(RETIRED_DIRECTORY_LINK, "[Request moving quotes](/get-quotes/)")
      .replace(RETIRED_DIRECTORY_URL, "/get-quotes/");
    if (LEGACY_DISCLOSURE.test(result)) return CONTACT_EXPLANATION;
    for (const identity of identities) result = result.replace(identity, "a participating moving company");
    return result;
  };
  const strings = <T,>(value: T): T => {
    if (typeof value === "string") return redact(value) as T;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (Array.isArray(value)) return value.map(strings) as T;
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, strings(item)])) as T;
    return value;
  };
  // Copy all fields, not just the content body: sources and metadata can repeat old identities.
  const result = strings(page);
  const content = result.content;
  content.sections = content.sections.map((section) => {
    const blocks = section.blocks.filter((block) => block.type !== "movers");
    return {
      ...section,
      heading: /preferred|listed movers|movers (?:in|near|serving)/i.test(section.heading) ? "Request quotes for your move" : section.heading,
      blocks: blocks.length ? blocks : [{ type: "paragraph" as const, text: CONTACT_EXPLANATION }],
    };
  });
  content.faq = content.faq.map((item) => /which movers (?:cover|in the network)|which companies (?:cover|receive)/i.test(item.question)
    ? { ...item, answer: CONTACT_EXPLANATION }
    : item);
  content.quote = { ...content.quote, heading: "Your move. Your contact preferences.", text: CONTACT_EXPLANATION, cta: "Get moving quotes" };
  return result;
}

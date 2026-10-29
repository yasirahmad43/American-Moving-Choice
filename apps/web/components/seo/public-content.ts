import type { SeoPageRecord } from "@amc/server/seo";
import { PUBLIC_REQUEST_ASSURANCE, publicMarketingText } from "../../lib/public-copy";

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
    // Population-eligible cities are not necessarily published after the quality gates.
    // Keep the geographic counts; never present them as counts of available guides.
    if (page.family === "state") result = result
      .replace(/(\d[\d,]*) (cities|city) of ([\d,]+) people or more have their own pages\b/gi,
        (_, count: string, noun: string, minimum: string) => `${count} ${noun} ${noun.toLowerCase() === "city" ? "has" : "have"} ${minimum} residents or more`)
      .replace(/\s+and (?:their|its) own pages?\b/gi, "")
      .replace(/\s+with their own pages\b/gi, " by population")
      .replace(/(\d[\d,]*) city pages?\b/gi, "$1 city records");
    return publicMarketingText(result);
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
  if (!content.intro.answer) content.intro.answer = PUBLIC_REQUEST_ASSURANCE;
  if (!result.metaDescription) result.metaDescription = PUBLIC_REQUEST_ASSURANCE;
  content.sections = content.sections.map((section) => {
    const paymentSection = /^What never changes with payment$/i.test(section.heading);
    const originalBlocks = page.content.sections.find((original) => original.id === section.id)?.blocks.filter((block) => block.type !== "movers") ?? [];
    const blocks = section.blocks.filter((block) => block.type !== "movers").map((block, index) => {
      if (block.type !== "paragraph") return block;
      const original = originalBlocks[index];
      if (paymentSection && original?.type === "paragraph" && /^What a mover pays never changes/i.test(original.text)) return {
        ...block,
        text: "All participating movers must pass [our screening checks](/how-we-verify-movers/). You choose the maximum number of companies who may contact you and the channels they may use. Compare the quotes you receive and choose the mover that suits your move.",
      };
      return block.text ? block : { ...block, text: PUBLIC_REQUEST_ASSURANCE };
    });
    return {
      ...section,
      heading: paymentSection ? "Your moving company. Your choice." : page.family === "city" && /^Coverage for an? (.+) request$/i.test(section.heading) ? section.heading.replace(/^Coverage for an? (.+) request$/i, "Moving coverage in $1") : /preferred|listed movers|movers (?:in|near|serving)/i.test(section.heading) ? "Request quotes for your move" : section.heading,
      blocks: blocks.length ? blocks : [{ type: "paragraph" as const, text: CONTACT_EXPLANATION }],
    };
  });
  content.faq = content.faq.map((item) => /which movers (?:cover|in the network)|which companies (?:cover|receive)|^who can receive my details\?$/i.test(item.question)
    ? { ...item, answer: CONTACT_EXPLANATION }
    : { ...item, answer: item.answer || PUBLIC_REQUEST_ASSURANCE });
  content.quote = { ...content.quote, heading: "Your move. Your contact preferences.", text: CONTACT_EXPLANATION, cta: "Get moving quotes" };
  const fundingLink = (href: string) => /\/(?:advertising-disclosure|how-we-make-money)\//i.test(href);
  content.related = content.related.map((group) => ({ ...group, links: group.links.filter((link) => !fundingLink(link.href)) })).filter((group) => group.links.length);
  result.sources = result.sources.filter((source) => !fundingLink(source.url));
  return result;
}

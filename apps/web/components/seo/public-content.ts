import type { SeoPageRecord } from "@amc/server/seo";
import { normalizeLegacyCityCountyLabels } from "@amc/core";
import { PUBLIC_REQUEST_ASSURANCE, publicMarketingText } from "../../lib/public-copy";
import { repairCountyLabelContexts } from "./county-label-context";
import { suppressUnverifiedSeoPricing } from "./verified-pricing";
import { suppressUnverifiedNetworkEvidence } from "./public-network-evidence";

const CONTACT_EXPLANATION = "Tell us about your move and choose the maximum number of participating companies that may contact you. Companies introduce themselves when they reach out.";
const RETIRED_DIRECTORY_LINK = /\[[^\]]*\]\((?:https?:\/\/[^/\s)]+)?\/(?:companies|directory)\/[^)]*\)/gi;
const RETIRED_DIRECTORY_URL = /(?:https?:\/\/[^/\s)]+)?\/(?:companies|directory)\/[^\s)"'<>]*/gi;
const LEGACY_DISCLOSURE = /by name and USDOT|movers? named on (?:your|the) Review and send screen|every mover named before|review every name|the list above names them|remove any (?:named )?mover/i;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COUNTY_DISPLAY_EXCLUDED_KEYS = new Set(["id", "url", "href", "slug", "canonicalUrl", "parentUrl", "contentHash", "mediaIds"]);
const BINDING_ESTIMATE_DESCRIPTION = "Compare binding and non-binding interstate estimates, the extra charges that can apply, and what may be due at delivery.";
const LEGACY_BINDING_DESCRIPTIONS = new Set([
  "A binding estimate guarantees the total cost for the goods and services it lists; a non-binding one can change, within the 110% rule. What each means on an…",
  "A binding estimate guarantees the total cost for the goods and services it lists; a non-binding one can change, within the 110% rule. What each means on an interstate move.",
]);

// Exact published catalog wording, repaired at read time because completed SEO bootstraps
// deliberately keep existing authored records. These are not general number/keyword rewrites.
const MOVING_COPY_REPAIRS: Record<string, readonly (readonly [string, string])[]> = {
  "/services/local/": [
    ["Local moves are regulated by the state, not by FMCSA, and most local movers charge by the hour for a crew and a truck, plus a travel fee.", "Moves whose entire route stays within one state are generally state-regulated; a shipment between places in one state that passes through another state is interstate. Most local movers charge by the hour for a crew and a truck, plus a travel fee."],
    ["The classification decides which movers' coverage rules apply and which pricing method the cost model uses.", "These site labels decide which movers' coverage rules apply and which pricing method the cost model uses. They do not determine legal jurisdiction: a same-state shipment that passes through another state is interstate."],
    ["For a move within one state, the state's own rules apply, and they differ widely.", "For a move whose route stays within one state, the state's own rules generally apply, and they differ widely. A shipment between places in one state that passes through another state is interstate."],
    ["FMCSA's rules don't reach a move between two points in the same state.", "A move between two places in the same state can be interstate if the shipment passes through another state. Moves whose entire route stays within one state are generally state-regulated."],
  ],
  "/services/long-distance/": [
    ["A long-distance move is any move beyond the local radius: either across a state line (interstate) or more than 50 miles within one state.", "On American Moving Choice, a long-distance move is any move beyond the local radius: either across a state line (interstate) or more than 50 miles within one state."],
    ["but Texas rules, not FMCSA's Part 375, govern it.", "but Texas rules generally govern it when the entire route stays in Texas; a shipment that passes through another state is interstate."],
    ["On a non-binding interstate estimate, the mover must hand over your goods once you pay up to 110% of the estimate at delivery; any remaining balance is billed later, no sooner than 30 days after delivery per FMCSA guidance.", "On a non-binding interstate estimate, delivery payment can include up to 110% of the estimate, services requested after the bill of lading, and impracticable-operations charges of no more than 15% of all other charges due at delivery. FMCSA guidance says the remaining estimate-based balance is billed no sooner than 30 days after delivery."],
  ],
  "/questions/what-is-a-binding-estimate/": [
    ["at delivery the mover may collect no more than that amount, plus services you asked for afterwards.", "at delivery the mover may collect that amount, plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["but you never pay more than 110% of the estimate at delivery.", "but delivery payment can include up to 110% of the estimate plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["and that you won't pay more than 110% of the estimate at delivery.", "and explain the delivery-payment rule: up to 110% of the estimate plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
  ],
  "/questions/what-is-the-110-percent-rule/": [
    ["On a non-binding interstate estimate the mover must release your goods once you pay up to 110% of the estimate at delivery; the rest is billed later. Source: 49 CFR 375.407.", "How the 110% delivery-payment rule works for non-binding interstate estimates, including later-requested services and capped impracticable-operations charges."],
    ["plus any services you asked for after the bill of lading and any impracticable-operations charges.", "plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["FMCSA's 2004 example:", "Assuming no services added after the bill of lading and no impracticable-operations charges, the FMCSA worked example from 2004:"],
    ["Moves within one state: state rules apply.", "Moves whose route stays within one state: generally state rules apply. A same-state shipment passing through another state is interstate."],
    ["On a non-binding interstate estimate, no. Refusing delivery", "A mover must release a full shipment when you offer the amount lawfully due at delivery. Refusing delivery"],
    ["Refusing delivery after you pay 110% counts as failing to transport with reasonable dispatch, which exposes the mover to delay claims.", "Refusing delivery after you offer the amount lawfully due, including later-requested services and capped impracticable-operations charges, counts as failing to transport with reasonable dispatch, which exposes the mover to delay claims."],
  ],
  "/questions/what-if-a-mover-holds-my-belongings-hostage/": [
    ["On a non-binding interstate estimate you owe no more than 110% at delivery; refusing delivery after that is a violation. Who to call and what to document.", "Understand delivery payment under a non-binding interstate estimate, including additional-service exceptions, and document a refusal to release your shipment."],
    ["once you pay up to 110% of the estimate at delivery; a mover that refuses after that payment is violating federal rules.", "once you offer the amount lawfully due: up to 110% of the estimate, plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery. A mover that refuses after that offer is violating the federal release rule."],
    ["Binding estimate: the binding amount, plus services you asked for after the bill of lading.", "Binding estimate: the binding amount, plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["No. It is a federal rule for interstate moves. Your state's regulator sets the rules for in-state moves.", "It is a federal rule for interstate moves, including a shipment between places in one state that passes through another state. For a move whose entire route stays within one state, check that state's rules."],
  ],
  "/questions/how-do-moving-companies-charge/": [
    ["and the 110% cap at delivery on non-binding estimates.", "and the 110% delivery-payment rule for non-binding estimates, with additional amounts for later-requested services and capped impracticable operations."],
  ],
  "/questions/can-a-mover-charge-more-than-the-estimate/": [
    ["Binding: no, except services you add. Non-binding: yes, but no more than 110% at delivery; the rest is billed later. What changes the bill.", "When a moving bill can change, and how binding and non-binding delivery payments account for later-requested services and capped impracticable operations."],
    ["the mover may collect only the binding amount plus services you asked for after the bill of lading and any impracticable-operations charges.", "the delivery payment can include the binding amount plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["but you never pay more than 110% of the estimate at delivery, and the mover bills the remainder later.", "but delivery payment can include up to 110% of the estimate plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery; the remaining estimate-based balance is billed later."],
    ["On a binding interstate estimate, no: the delivery payment can include the binding amount", "Sometimes. For a binding interstate estimate, delivery payment can include the binding amount"],
  ],
  "/questions/what-is-a-moving-tariff/": [
    ["within the 110% cap at delivery.", "subject to the non-binding delivery-payment rule, including later-requested services and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
  ],
  "/questions/who-regulates-moving-companies/": [
    ["Moves between two points in the same state are regulated by that state, and the rules differ:", "Moves whose entire route stays within one state are generally state-regulated; a same-state shipment passing through another state is interstate. State rules differ:"],
  ],
  "/questions/what-is-an-intrastate-move/": [
    ["A move within one state. Beyond 50 miles it is in-state long distance on this site, priced by weight and regulated by the state, not FMCSA.", "An intrastate move stays within one state for its entire route. How this site's 50-mile local radius differs from the rules that legally govern your move."],
  ],
  "/planning/moving-out-of-state-checklist/": [
    ["At delivery, pay what you owe (no more than 110% on a non-binding estimate), note any damage on the inventory, and keep every document.", "At delivery, confirm the amount due under your estimate, including any later-requested services and capped impracticable-operations charges, note any damage on the inventory, and keep every document."],
  ],
  "/planning/delivery-day-checklist/": [
    ["(the binding amount, or no more than 110% of a non-binding estimate)", "(the binding amount, or up to 110% of a non-binding estimate, plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery)"],
    ["Binding estimate: the binding amount plus services added after the bill of lading.", "Binding estimate: the binding amount plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery."],
    ["Non-binding estimate: up to 110% of the estimate; the rest is billed later.", "Non-binding estimate: up to 110% of the estimate plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery; the remaining estimate-based balance is billed later."],
  ],
};

function repairMovingCopy(text: string, page: SeoPageRecord): string {
  let result = text;
  if (text.startsWith("FMCSA's household-goods rules (49 CFR Part 375) cover interstate moves, including")) result = result.replace("Moves between two points in the same state are regulated by that state.", "Moves whose entire route stays within one state are generally regulated by that state.");
  if (text.startsWith("On a non-binding estimate, the mover must release your goods at delivery once")) result = result.replace("(plus services you asked for after the bill of lading and any impracticable-operations charges)", "(plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery)");
  for (const [before, after] of MOVING_COPY_REPAIRS[page.url] ?? []) result = result.replaceAll(before, after);
  // Exact city-regulator sentence pattern emitted by generate.ts; preserve the state,
  // city, sourced regulator statement, link and access date that follow the colon.
  if (page.family === "city") result = result.replace(/^Moves within ([^:]+) from ([^:]+) are regulated by the state:/, "Moves from $2 whose entire route stays within $1 are generally state-regulated:");
  return result;
}

/**
 * Published content can predate the contact-introduction flow. Do not expose archived mover
 * lists or their identities through HTML, RSC props, links, FAQs, or structured data.
 */
export function publicSeoPage(page: SeoPageRecord): SeoPageRecord {
  const identities = [...new Set(page.content.sections.flatMap((section) => section.blocks)
    .flatMap((block) => block.type === "movers" ? block.items.map((mover) => mover.name) : [])
    .filter(Boolean))].sort((a, b) => b.length - a.length)
    .map((name) => new RegExp(escapeRegExp(name), "gi"));
  const redact = (text: string, countyDisplay = true) => {
    let result = repairMovingCopy(text, page).replace(RETIRED_DIRECTORY_LINK, "[Request moving quotes](/get-quotes/)")
      .replace(RETIRED_DIRECTORY_URL, "/get-quotes/");
    if (LEGACY_DISCLOSURE.test(result)) return CONTACT_EXPLANATION;
    for (const identity of identities) result = result.replace(identity, "a participating moving company");
    if (countyDisplay) result = normalizeLegacyCityCountyLabels(result);
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
  const strings = <T,>(value: T, countyDisplay = true): T => {
    if (typeof value === "string") return redact(value, countyDisplay) as T;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (Array.isArray(value)) return value.map(item => strings(item, countyDisplay)) as T;
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, strings(item, countyDisplay && !COUNTY_DISPLAY_EXCLUDED_KEYS.has(key))])) as T;
    return value;
  };
  // Copy all fields, not just the content body: sources and metadata can repeat old identities.
  const result = strings(page);
  // Correct only the known saved search descriptions, including the actual clipped live
  // value. The page's complete answer, prices, dates and other metadata remain untouched.
  if (page.url === "/questions/what-is-a-binding-estimate/" && LEGACY_BINDING_DESCRIPTIONS.has(result.metaDescription)) result.metaDescription = BINDING_ESTIMATE_DESCRIPTION;
  const content = result.content;
  if (!content.intro.answer) content.intro.answer = PUBLIC_REQUEST_ASSURANCE;
  if (!result.metaDescription) result.metaDescription = PUBLIC_REQUEST_ASSURANCE;
  content.sections = content.sections.map((section) => {
    const paymentSection = /^What never changes with payment$/i.test(section.heading);
    const cityZipSection = page.family === "city" && section.id === "zips";
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
      heading: paymentSection ? "Your moving company. Your choice." : cityZipSection && /, with movers naming each$/.test(section.heading) ? section.heading.replace(/, with movers naming each$/, "") : page.family === "city" && /^Coverage for an? (.+) request$/i.test(section.heading) ? "Plan your move" : /preferred|listed movers|movers (?:in|near|serving)/i.test(section.heading) ? "Request quotes for your move" : section.heading,
      blocks: blocks.length ? blocks : [{ type: "paragraph" as const, text: CONTACT_EXPLANATION }],
    };
  });
  content.faq = content.faq.map((item) => /which movers (?:cover|in the network)|which companies (?:cover|receive)|^who can receive my details\?$/i.test(item.question)
    ? { ...item, answer: CONTACT_EXPLANATION }
    : { ...item, answer: item.answer || PUBLIC_REQUEST_ASSURANCE });
  content.quote = { ...content.quote, heading: "Your move. Your contact preferences.", text: CONTACT_EXPLANATION, cta: "Get moving quotes" };
  const retiredBusinessLink = (href: string) => /\/(?:advertising-disclosure|how-we-make-money|for-movers|mover-terms)(?:\/|$|[?#])/i.test(href);
  content.related = content.related.map((group) => ({ ...group, links: group.links.filter((link) => !retiredBusinessLink(link.href)) })).filter((group) => group.links.length);
  result.sources = result.sources.filter((source) => !retiredBusinessLink(source.url));
  return suppressUnverifiedNetworkEvidence(suppressUnverifiedSeoPricing(repairCountyLabelContexts(result)));
}

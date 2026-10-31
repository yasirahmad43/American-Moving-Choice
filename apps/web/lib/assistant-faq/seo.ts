import type { ContentBlock, ContentSection, CostBlock, SeoPageRecord } from "@amc/server/seo";
import { assertAssistantFaq, FAQ_BUSINESS_NAME, faqWordCount, type AssistantFaqItem } from "./types";
import { EDITORIAL_ASSISTANT_QUESTIONS } from "./seo-questions";
import { SERVICE_ANSWER_OVERRIDES } from "./service-answers";

/** Reader-facing facts only. Call with publicSeoPage(), never an archived raw record. */
type Page = Pick<SeoPageRecord, "family" | "h1" | "primaryKeyword" | "slug" | "zip" | "content" | "sources">;
type Evidence = { text: string; heading: string; sectionId: string; kind: "prose" | "fact" | "table" | "cost"; anchor?: string };
const SEGMENTER = new Intl.Segmenter("en", { granularity: "sentence" });
const INTERNAL = /\b(?:eligible|eligibility|matching|matches|coverage rules?|network movers?|movers? in our network|no (?:network )?mover|movers? naming|rules naming|named counts|can receive|can buy|purchase|lead pricing|pay(?:s|ment)? to|preferred movers?)\b/iu;
const MODELLED_TRANSIT = /\b(?:estimated road|est\. road|driving days?|driving time|road miles|500 (?:miles?|mi)\s*(?:per|a|\/)\s*day|500 a day|transport time|driving-hour|road-mile|routing factor)\b/iu;
const EMPTY = /^(?:n\/a|none|not available|not yet available|your notes|record here|fill in|—|-)$/iu;
const plain = (value: string): string => value.replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
  .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1").replace(/https?:\/\/\S+/gu, "")
  .replace(/<[^>]*>/gu, "").replace(/\*\*|__|`/gu, "").replace(/\s+/gu, " ").trim();
const sentence = (value: string): string => /[.!?]$/u.test(value) ? value : `${value}.`;
const LEGACY_CHANNEL_PICKER = /choose[^.]*\bchannels\b|channels they may use/iu;
const LEGACY_BUSINESS_PITCH = /who pays us|how we make money|who pays for|county.{0,15}ZIP rules|\b(?:county|ZIP|nationwide|statewide) (?:coverage )?rules?\b|rules that name (?:the|your) (?:county|ZIP)/iu;
const FORM_FREE_TEXT = /\b(?:tell|describe|record|note|explain)[^.]{0,140}\bin (?:the|your) request\b/iu;
const OVERBROAD_QUOTE = /A written estimate after a survey is the only figure that binds a mover/iu;
const BROAD_CARGO_REQUIREMENT = /(?:must|require|need|files?)[^.]*\bcargo\b|\bcargo insurance\b[^.]*(?:\$5,000|\$10,000|filings?)|public liability and cargo insurance/iu;
const safe = (value: string): boolean => Boolean(value && !INTERNAL.test(value) && !MODELLED_TRANSIT.test(value) && !EMPTY.test(value)
  && !LEGACY_CHANNEL_PICKER.test(value) && !LEGACY_BUSINESS_PITCH.test(value) && !FORM_FREE_TEXT.test(value) && !OVERBROAD_QUOTE.test(value) && !(BROAD_CARGO_REQUIREMENT.test(value) && !/\bcontract|\bcommon carrier/iu.test(value)));
const parts = (value: string): string[] => [...SEGMENTER.segment(plain(value))].map(item => item.segment.trim()).filter(safe);
function qualifiedParts(value: string): string[] {
  const joined: string[] = [];
  for (const segment of parts(value)) {
    if (joined.length && (/^(?:yes|no)\.?$/iu.test(joined[joined.length-1]!) || /^(?:but|however|except|unless|otherwise|then|this (?:does not|is not|only|applies)|it (?:does not|is not|only)|these (?:are|figures|ranges)|they (?:are|do not|only)|that (?:is|means))/iu.test(segment))) joined[joined.length-1] += ` ${segment}`;
    else joined.push(segment);
  }
  return joined;
}
const UNSAFE_INTRO = new Set(["does-a-mover-need-insurance"]);
function sourceIntro(page: Page): string {
  if (UNSAFE_INTRO.has(page.slug)) return "";
  const text = plain(page.content.intro.answer);
  // The root reviewer checked this exact BLS subgroup/date against the primary page.
  // Do not substitute the broader occupation group's median or call it AMC's pay rate.
  if (page.slug === "how-much-do-movers-make-per-hour" && /May 2025/u.test(text) && /\$40,240/u.test(text) && /\$19\.35/u.test(text) && /53-7062/u.test(text))
    return "American Moving Choice cites the BLS May 2025 national median for hand laborers and freight, stock and material movers (SOC 53-7062): $40,240 annually, about $19.35 an hour. This describes that occupation group, not a moving-service quote or what American Moving Choice or any individual employer pays.";
  return text;
}
function dollars(value: string): string {
  const normalized = plain(value).replace(/[$,]/gu, "");
  if (!/^\d+(?:\.\d+)?$/u.test(normalized)) return plain(value);
  const decimals = Math.min(20, normalized.split(".")[1]?.length ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(normalized));
}
const homeLabel = (value: string): string => plain(value).replace(/^(\d+) bedrooms?$/iu,"$1-bedroom home").replace(/^Studio$/u,"studio home");

function blockEvidence(block: ContentBlock, section: ContentSection): Evidence[] {
  const make = (text: string, kind: Evidence["kind"], anchor?: string): Evidence => ({ text: plain(text), heading: plain(section.heading), sectionId: section.id, kind, ...(anchor ? {anchor}: {}) });
  // A legacy heading can say "network" while its repaired public paragraph contains
  // useful contact/complaint policy. Filter the actual claim, never discard safe policy
  // solely because of its old section label. Mover-list blocks are never copied below.
  if (block.type === "paragraph" || block.type === "note") return qualifiedParts(block.text).map(text => make(text, "prose"));
  if (block.type === "list") return block.items.filter(item => safe(plain(item))).map(text => make(text, "prose"));
  if (block.type === "facts") return block.items.filter(item => safe(plain(item.claim))).map(item => make(`${item.claim} Source: ${item.source.label}, read ${item.source.accessedOn}.`, "fact"));
  if (block.type === "cost") {
    const cost = block.block;
    if (!cost.rows.length && cost.noData) return parts(cost.noData).map(text => make(text, "cost"));
    return cost.rows.slice(0, 3).map(row => make(`For ${cost.scope}, the ${homeLabel(row.homeSize)} planning range is ${dollars(row.low)} to ${dollars(row.high)}, as of ${cost.asOf}. This is a planning range, not a moving quote.`, "cost"));
  }
  if (block.type === "table") {
    const indexes = block.columns.map((column, index) => ({ column: plain(column), index })).filter(({ column }) => !INTERNAL.test(column) && !MODELLED_TRANSIT.test(column));
    return block.rows.slice(0, 6).filter(row=>!( /^cargo\b/iu.test(plain(row[0]??"")) && !/contract|common carrier/iu.test(`${section.heading} ${row.join(" ")}`))).map(row => {
      if (!plain(block.columns[0]??"") && row.length >=3) {
        const label=plain(row[0]??""); const left=plain(block.columns[1]!), right=plain(block.columns[2]!);
        if (/^based on$/iu.test(label)) return make(`The ${left.toLowerCase()} is based on ${plain(row[1]!).replace(/^Rate/u,"rate")}; the ${right.toLowerCase()} is based on ${plain(row[2]!).replace(/^A /u,"a ")}.`,"table",label);
        if (/^who gives it$/iu.test(label)) return make(`${plain(row[1]!)} gives the ${left.toLowerCase()}; ${plain(row[2]!)} gives the ${right.toLowerCase()}.`,"table",label);
        if (/^binding\?$/iu.test(label) && /^no$/iu.test(plain(row[1]!))) return make(`A ${left.toLowerCase()} is not binding; a ${right.toLowerCase()} may be ${plain(row[2]!).replace(/^Binding/u,"binding")}.`,"table",label);
        return make(`${label}: ${left}, ${plain(row[1]!)}; ${right}, ${plain(row[2]!)}.`,"table",label);
      }
      const values = indexes.filter(({ index }) => safe(plain(row[index] ?? ""))).slice(0, 4).map(({ column, index }) => `${column}: ${plain(row[index]!)}`);
      return make(`${block.caption ? `${sentence(plain(block.caption))} ` : ""}${values.join("; ")}.`, "table");
    }).filter(item => safe(item.text));
  }
  return [];
}

function evidenceFor(page: Page): Evidence[] {
  const evidence = page.content.sections.flatMap(section => section.blocks.flatMap(block => blockEvidence(block, section)));
  page.content.faq.forEach((item, index) => {
    if (!/^how many (?:network )?movers|^which movers cover|^which companies cover/iu.test(plain(item.question))) {
      const whole=plain(item.answer);
      const units=safe(whole)?[whole]:qualifiedParts(whole);
      for (const text of units) evidence.push({ text, heading: plain(item.question), sectionId: `faq-${index}`, kind: "prose" });
    }
  });
  for (const point of page.content.intro.dataPoints) {
    if (!safe(plain(point.label)) || !safe(plain(point.value)) || INTERNAL.test(point.basis) || MODELLED_TRANSIT.test(point.basis)) continue;
    evidence.push({ text: `${plain(point.label)}: ${plain(point.value)}. Source: ${plain(point.basis)}.`, heading: point.label, sectionId: "page-facts", kind: "fact" });
  }
  if (page.slug === "how-much-do-movers-make-per-hour") {
    const operatingCosts = parts(page.content.intro.answer).find(text => /a mover's hourly rate to you also covers/iu.test(text));
    if (operatingCosts) evidence.unshift({ text: operatingCosts.replace(/^That is labor-cost context only:\s*/iu, ""), heading: "Why the hourly rate you pay is higher", sectionId: "operating-cost-context", kind: "prose" });
  }
  return evidence;
}

/** Preserve complete source sentences; never truncate a price, legal exception or scope clause. */
function answer(page: Page, lead: string, preferred: string[], fallback: Evidence[], strictBinding = false): string {
  for (const value of preferred) {
    const complete = plain(value);
    if (safe(complete) && complete.includes(FAQ_BUSINESS_NAME) && faqWordCount(complete) >= 40 && faqWordCount(complete) <= 80
      && (!/^For interstate/iu.test(lead) || /\binterstate\b/iu.test(complete))) return complete;
  }
  const collected: string[] = [];
  const seen = new Set<string>();
  const groups = [...preferred, ...fallback.map(item => item.text), ...(!strictBinding ? [sourceIntro(page), page.content.quote.text] : [])];
  const pool = groups.flatMap(value => {
    const text = plain(value);
    if (!safe(text)) return parts(text);
    if (faqWordCount(text) <= 80 - faqWordCount(lead)) return [text];
    // Preserve yes/no polarity with its actual subject and keep exceptions attached.
    return qualifiedParts(text);
  });
  let words = faqWordCount(lead);
  for (const candidate of pool) {
    const key = candidate.toLowerCase();
    if (seen.has(key) || candidate.includes(lead) || faqWordCount(candidate) > 80 - words) continue;
    seen.add(key); collected.push(sentence(candidate)); words += faqWordCount(candidate);
    if (words >= 40) break;
  }
  // The date is an actual displayed page fact, not a generated review or service promise.
  if (words < 40) {
    const dated = `The guide's displayed data date is ${page.content.dataAsOf}.`;
    if (words + faqWordCount(dated) <= 80) { collected.push(dated); words += faqWordCount(dated); }
  }
  if (words < 40) throw new Error(`assistant-faq: insufficient page facts for ${page.slug}`);
  return [lead, ...collected].join(" ");
}

function related(evidence: Evidence[], pattern: RegExp): Evidence[] {
  return evidence.filter(item => pattern.test(`${item.heading} ${item.sectionId}`));
}
function texts(evidence: Evidence[]) { return evidence.map(item => item.text); }
const CONTEXT_STOP_WORDS = new Set("american moving choice mover movers company companies move moves household interstate intrastate local before after should what have include can how will does which their same about when are has the for and with get confirm check use information details keep give need know request guide planning preparing explains this that into from your my any its there them".split(" "));
const tokens = (value: string): string[] => (plain(value).toLowerCase().match(/[a-z]{3,}/gu) ?? []).map(word => word.replace(/s$/u, "")).filter(word => !CONTEXT_STOP_WORDS.has(word));
function relevance(question: string, item: Evidence): number {
  const subject = new Set(tokens(question));
  const present = new Set(tokens(`${item.heading} ${item.text}`));
  return [...subject].reduce((score, term) => score + (present.has(term) ? 1 : 0), 0);
}
function location(page: Page): string {
  return plain(page.h1).replace(/: compare screened moving companies$/iu, "").replace(/^(?:Moving companies|Movers|Moving costs) in /iu, "");
}
function title(page: Page): string { return plain(page.h1).replace(/[.?!]+$/u, ""); }
function hasInterstateScope(page: Page): boolean {
  return /\binterstate\b/iu.test(`${page.h1} ${page.content.intro.answer}`)
    || page.sources.some(source => /part-375|\/375\./iu.test(source.url))
    || page.content.sections.some(section=>section.blocks.some(block=>block.type==="facts" && block.items.some(fact=>/part-375|\/375\./iu.test(fact.source.url)))
      || (/scope|prerequisite/iu.test(section.heading) && section.blocks.some(block=>(block.type==="paragraph"||block.type==="note")&&/\binterstate\b/iu.test(block.text))));
}
function scopeAnswer(page: Page, item: AssistantFaqItem): AssistantFaqItem {
  const scopedPage = hasInterstateScope(page);
  const federalRule = /\barbitration\b|full value|released value|110%|60 cents|\$10,000|certified (?:platform|scale)|warehouse scale|3,000 pounds|reweigh|(?:must|required)[^.]*written estimate|(?:must|required)[^.]*bill of lading/iu.test(item.answer);
  if (!scopedPage || !federalRule || /\binterstate\b/iu.test(item.answer)) return item;
  const qualified = `For interstate moves, ${item.answer}`;
  if (faqWordCount(qualified) > 80) throw new Error(`assistant-faq: federal scope exceeds answer budget for ${page.slug}`);
  return { ...item, answer: qualified };
}
function geoFaq(page: Page, evidence: Evidence[]): AssistantFaqItem[] {
  const place = location(page);
  const route = page.family === "route" ? /^Moving from (.+?) to (.+)$/iu.exec(title(page)) : null;
  const context = route ? `a move from ${route[1]} to ${route[2]}` : `a move in ${place}`;
  const lead = `${FAQ_BUSINESS_NAME}'s ${route ? `${route[1]} to ${route[2]}` : place} guide`;
  const costPriority = (item: Evidence) => item.kind === "cost" ? 200 : item.sectionId === "costs" ? 150 : /\b(?:costs?|prices?|ranges?|rates?)\b/iu.test(item.heading) ? 100 : 0;
  const costs = evidence.filter(item => item.kind === "cost" || (!/\brent|housing/iu.test(item.heading) && (/\b(?:costs?|prices?|ranges?|rates?)\b/iu.test(`${item.heading} ${item.sectionId}`) || /moving.cost|rate cards/iu.test(item.text))))
    .sort((a,b)=>costPriority(b)-costPriority(a));
  const costText = texts(costs);
  if (!costText.length && !/[$£€]\s*\d/u.test(plain(JSON.stringify(page.content)))) costText.push("No moving-price range is published in this guide.");
  const geography = related(evidence, /glance|geograph|cities|county|counties|nearby|neighbou?r|places|page-facts|housing|population/iu);
  const rules = evidence.filter(item => item.kind !== "table" && (item.sectionId === "rules" || item.sectionId === "planning" || /licens|regulat|written|document/iu.test(item.heading) || /written estimate|USDOT|floor|elevator|parking|inventory/iu.test(item.text)))
    .sort((a,b)=>(Number(b.sectionId === "rules")-Number(a.sectionId === "rules")));
  const exactFacts = evidence.filter(item => item.sectionId === "page-facts");
  const postalFacts=exactFacts.filter(item=>/^(?:ZIP codes?|Count(?:y|ies)):/iu.test(item.text));
  const postalEvidence=[...postalFacts,...related(evidence,/^zips$|postal|how many ZIP codes/iu)];
  const licensingRules=rules.filter(item=>/licens|regulat|agency|FMCSA|USDOT/iu.test(`${item.heading} ${item.text}`));
  const costFallback: Evidence[] = [...costs, { text: plain(page.content.quote.text), heading: "Request a written quote", sectionId: "quote", kind: "prose" }];
  // Restate the displayed request explanation in a complete, standalone paragraph.
  // Geographic statistics do not answer who can help with the request.
  const requestAnswer = () => /maximum number of participating companies/iu.test(page.content.quote.text) && /Companies introduce themselves/iu.test(page.content.quote.text)
    ? `${lead} provides a way to request moving quotes. Describe your move and choose the maximum number of participating companies you want to hear from. Each company introduces itself when it contacts you about your request, within the company limit you selected.`
    : answer(page, `${lead} includes a moving-quote request.`, [page.content.quote.text], evidence);
  if (route) return [
    { question: `Who can help me request moving quotes from ${route[1]} to ${route[2]}?`, answer: requestAnswer() },
    { question: `How much does it cost to move from ${route[1]} to ${route[2]}?`, answer: answer(page, `${lead} sets out the available cost information.`, costText, costFallback, true) },
    { question: `How far is the move from ${route[1]} to ${route[2]}, and how is that distance measured?`, answer: answer(page, `${lead} records the following distance information.`, texts([...exactFacts.filter(item=>/distance/iu.test(item.heading)), ...related(evidence, /distance|straight|centroid|geograph/iu)]), related(evidence, /distance|straight|centroid|geograph/iu),true) },
    { question: `What local facts should I know before moving from ${route[1]} to ${route[2]}?`, answer: answer(page, `${lead} records these location facts.`, texts(geography), evidence) },
    { question: `What should I get in writing for a move from ${route[1]} to ${route[2]}?`, answer: answer(page, `${lead} includes this planning guidance.`, texts([...rules].sort((a,b)=>Number(/written estimate|written.*delivery/iu.test(b.text))-Number(/written estimate|written.*delivery/iu.test(a.text)))), rules,true) },
  ];
  if (page.family === "zip") {
    const zip = page.zip ?? /^ZIP code (\d{5})/iu.exec(place)?.[1] ?? page.slug;
    const populationFacts = geography.filter(item => /population|housing units/iu.test(item.text));
    return [
      { question: `Who can help me request moving quotes for ZIP code ${zip}?`, answer: requestAnswer() },
      { question: `Which city and county does ZIP code ${zip} belong to?`, answer: answer(page, `${lead} describes the postal location.`, [...page.content.faq.filter(item => /part|city|county/iu.test(item.question)).map(item => item.answer), ...texts(geography)], evidence) },
      { question: `What can change moving costs at an address in ZIP code ${zip}?`, answer: answer(page, `${lead} discusses address-specific charges.`, texts(rules), evidence) },
      ...(populationFacts.length ? [{ question: `What population and housing facts are available for ZIP code ${zip}?`, answer: answer(page, `${lead} records these local facts.`, texts(populationFacts), geography) }] : []),
      { question: `What should I check before booking movers for ZIP code ${zip}?`, answer: answer(page, `${lead} includes this preparation guidance.`, texts(rules), evidence) },
    ];
  }
  const cities = page.family === "state";
  return [
    { question: `Who can help me request moving quotes in ${place}?`, answer: requestAnswer() },
    { question: `How much does it cost to hire movers in ${place}?`, answer: answer(page, `${lead} sets out the available moving-cost information.`, costText, costFallback, true) },
    { question: cities ? `Which cities and counties should I look at when planning a move in ${place}?` : `What should I know about ZIP codes and the county before moving in ${place}?`, answer: answer(page, `${lead} records these local details.`, texts(cities?geography:postalEvidence), cities?geography:postalEvidence,true) },
    { question: licensingRules.length ? `Who licenses moving companies for a move in ${place}?` : `What address-access details should I check before booking a move in ${place}?`, answer: answer(page, `${lead} includes this ${licensingRules.length?"licensing":"preparation"} guidance.`, texts(licensingRules.length?licensingRules:rules), licensingRules.length?licensingRules:rules,true) },
    { question: cities ? `Which ZIP-code and population facts help me plan a move in ${place}?` : `What nearby places should I consider when planning a move around ${place}?`, answer: answer(page, `${lead} provides this geographic context.`, texts(cities ? exactFacts : related(evidence, /nearby|neighbou?r|county|cities|places/iu)), geography.length ? geography : evidence) },
  ];
}

function costFaq(page: Page, evidence: Evidence[]): AssistantFaqItem[] {
  const state = /^Moving costs in (.+)$/iu.exec(title(page))?.[1];
  const blocks = page.content.sections.flatMap(section => section.blocks).filter((block): block is Extract<ContentBlock,{type:"cost"}> => block.type === "cost").map(item => item.block);
  const makeRange = (cost: CostBlock, homeSize: string): string => {
    const row = cost.rows.find(item => item.homeSize === homeSize)!;
    return `For ${cost.scope}, the ${homeLabel(row.homeSize)} planning range is ${dollars(row.low)} to ${dollars(row.high)}, as of ${cost.asOf}. These are planning figures from rate cards, not a quote for an individual move.`;
  };
  if (state && blocks.length) {
    const local = blocks.find(block => block.moveType === "local" && block.rows.length) ?? blocks.find(block => block.rows.length)!;
    const size = local.rows.find(row => /2.bed/iu.test(row.homeSize))?.homeSize ?? local.rows[0]!.homeSize;
    const displaySize = homeLabel(size);
    const intrastate = blocks.find(block => block.moveType === "intrastate" && block.rows.some(row => row.homeSize === size));
    const interstate = blocks.find(block => block.moveType === "interstate" && block.rows.some(row => row.homeSize === size));
    const lead = `${FAQ_BUSINESS_NAME}'s ${state} moving-cost guide states:`;
    const result: AssistantFaqItem[] = [{ question: `How much does a local move for a ${displaySize} within ${state} cost?`, answer: answer(page, lead, [makeRange(local,size)], [],true) }];
    if (intrastate) {
      const pair = /\(([^()]+ to [^()]+)\)/u.exec(intrastate.scope)?.[1];
      result.push({ question: pair ? `How much does moving a ${displaySize} from ${pair} cost?` : `What is the in-state long-distance moving range for a ${displaySize} in ${state}?`, answer: answer(page, lead, [makeRange(intrastate,size)],[],true) });
    }
    if (interstate) {
      const destination = /\(to ([^()]+)\)/u.exec(interstate.scope)?.[1];
      result.push({ question: `What is the published interstate moving range for a ${displaySize} from ${state}${destination?` to ${destination}`:""}?`, answer: answer(page, lead,[makeRange(interstate,size)],[],true) });
    }
    result.push({ question: `What crew and working-time planning example is listed for a local ${displaySize} move in ${state}?`, answer: answer(page, lead, texts(evidence.filter(item => item.sectionId === "summary" && item.kind === "prose")), evidence.filter(item => /typical.*job/iu.test(item.heading)),true) });
    if (result.length >=4) return result.slice(0,5);
    throw new Error(`assistant-faq: insufficient distinct cost examples for ${page.slug}`);
  }
  const local = page.slug === "local";
  const kind = local ? "local" : "long-distance";
  const table = page.content.sections.flatMap(section=>section.blocks).find((block):block is Extract<ContentBlock,{type:"table"}>=>block.type === "table" && block.columns.some(column=>/origin state/iu.test(column)));
  const example = table?.rows[0];
  if (!table || !example) throw new Error(`assistant-faq: no published national cost example for ${page.slug}`);
  const origin = plain(example[0]!);
  const tableExample = `${plain(table.caption??"")}. ${table.columns.map((column,index)=>`${plain(column)}: ${plain(example[index]??"")}`).join("; ")}. These are planning ranges, not quotes.`;
  const method = evidence.filter(item=>item.kind === "prose" && /cost-model-v1|25th to 75th/iu.test(item.text));
  const methodSource=page.content.sections.flatMap(section=>section.blocks).filter((block):block is Extract<ContentBlock,{type:"paragraph"}>=>block.type ==="paragraph").map(block=>plain(block.text)).find(text=>/cost-model-v1.*25th to 75th/iu.test(text));
  const rounding=methodSource?.match(/rounded outward to (\$[\d,]+)/iu)?.[1];
  const methodAnswer=methodSource && rounding && /at least five different movers/iu.test(methodSource) && /older than 12 months/iu.test(methodSource)
    ? `${FAQ_BUSINESS_NAME}'s cost-model-v1 builds a typical job from median figures supplied for a home size, prices it using each mover's rates, and shows the 25th to 75th percentile. It requires at least five different movers' active cards for the origin state, excludes cards older than 12 months, and rounds the ${kind} figures outward to ${rounding}.`
    : answer(page,`${FAQ_BUSINESS_NAME} explains the published calculation:`,texts(method),method,true);
  const factors = evidence.filter(item=>item.sectionId === "factors" && item.kind === "prose");
  const quoteLimits = page.content.faq.filter(item=>/range a quote|include packing|include storage/iu.test(item.question)).flatMap(item=>parts(item.answer));
  return [
    { question: local ? `What 2-bedroom local moving-cost example is published for ${origin}?` : `What 2-bedroom interstate moving-cost example is published for about 750 miles from ${origin}?`, answer: answer(page,`${FAQ_BUSINESS_NAME}'s ${kind} moving-cost guide lists this example:`,[tableExample],[],true) },
    { question: `What can change the ${local?"hourly cost of a local":"price of a long-distance"} household move?`, answer: answer(page,`${FAQ_BUSINESS_NAME}'s ${kind} moving-cost guide lists these price factors:`,texts(factors),factors,true) },
    { question: `How are American Moving Choice's ${kind} moving-cost planning ranges calculated?`, answer: methodAnswer },
    { question: `Are the ${kind} moving-cost ranges quotes, and do they include ${local?"packing":"storage"}?`, answer: answer(page,`${FAQ_BUSINESS_NAME} distinguishes ${kind} planning ranges from a quote:`,quoteLimits,[],true) },
  ];
}

/** Carefully condensed from short, repeatedly referenced source articles. */
function condensedEditorial(page: Page): readonly string[] | null {
  if(page.slug === "what-is-a-moving-delivery-spread")return [
    "American Moving Choice describes a delivery spread as the dates within which an interstate mover commits to deliver, recorded on the bill of lading rather than necessarily one exact day. Its guide says to check that window, how the mover will communicate the delivery day, and what happens if the spread is missed.",
    "For an interstate move, American Moving Choice suggests asking for the earliest and latest delivery dates and the notice you will receive before arrival. Also ask what happens if the destination home is not ready, including storage-in-transit charges, and what the mover owes if it misses the agreed spread.",
    "American Moving Choice says some movers offer a guaranteed delivery date for a charge from their tariff. The guarantee must appear on both the estimate and bill of lading. Its guide distinguishes that written arrangement from a delivery spread, which records a range of dates for an interstate shipment.",
    "For an interstate shipment, American Moving Choice explains that the mover must transport with reasonable dispatch and that a missed delivery spread can support a delay claim. Before agreeing to delivery terms, ask what the mover owes for missing the spread and how it will notify you of the delivery day.",
  ];
  if (page.slug === "how-much-do-movers-make-per-hour") return [
    sourceIntro(page),
    "American Moving Choice identifies the cited occupation as hand laborers and freight, stock and material movers, SOC 53-7062. The BLS figure is a national median for that group. It is labor-cost context, not the pay of a particular moving-company employee or the price of a household move.",
    "American Moving Choice lists truck, fuel, maintenance, insurance, equipment, office work, dispatch and time between jobs as costs behind a moving-company charge. Its guide distinguishes those crew-and-truck charges from an employee's wage. Comparing a customer price with an individual worker's hourly pay therefore compares different things.",
    "American Moving Choice does not suggest a tipping figure: its guide says tipping is customary but not required, no rule sets an amount, and it holds no data for recommending one. The cited employee-wage information is labor-cost context rather than a moving-company price or a recommended tip.",
  ];
  if (page.slug === "which-companies-receive-my-moving-request") return [
    "American Moving Choice asks you to choose the maximum number of companies you want to hear from. The request flow collects your route, date, home size, services, phone number and email before review and send. Companies introduce themselves when they call or email about your move, within that selected limit.",
    "American Moving Choice describes your company choice as a maximum contact limit. It limits how many companies may contact you rather than stating a confirmed number of calls. You add your move and contact details, review the summary and notice beside Send my request, and explicitly send the request.",
    "American Moving Choice does not display company names in the quote survey or confirmation. Each participating company introduces itself when it calls or emails about your move. You choose the maximum number of companies you want to hear from before reviewing and sending your move and contact details.",
    "American Moving Choice's confirmation includes a link to manage or withdraw your moving request. Its explanation also says companies that already received your details keep them. Withdrawing the request therefore does not recall information already disclosed. Use the confirmation link to review the management options for that particular request.",
  ];
  return null;
}
function condensedLiteral(page: Page, question: string): string | null {
  if(page.slug==="can-i-watch-my-shipment-being-weighed" && /weight tickets/iu.test(question))
    return "American Moving Choice says that, when a non-binding interstate estimate depends on weight, each weighing needs a weight ticket. Keep these tickets with the bill of lading because they are the basis of the weight-based bill. Its guide also says the mover must use a certified scale and tell you where and when each weighing happens.";
  if(page.slug==="how-does-american-moving-choice-work" && /Who can receive/iu.test(question))
    return "American Moving Choice lets you choose the maximum number of participating companies that may contact you about your move. Your request contains your route, date, home size, services and contact details. Review before sending it for calls and email; each company introduces itself when it reaches out.";
  if(page.slug==="how-does-american-moving-choice-work" && /cost anything|free/iu.test(question))
    return "American Moving Choice says requesting quotes is free for consumers. You provide your move and contact details, choose a maximum company contact limit, and review before sending the request. Participating companies identify themselves when they contact you by calls or email about your move.";
  if(page.slug==="how-do-i-pack-a-flat-screen-tv-for-a-move" && /original box/iu.test(question))
    return "American Moving Choice says a television's original box is an option only when it is suitable, complete and undamaged. Check whether the inserts match the exact model and are still usable. Its guide calls for checking the carton, foam and screen protection before reuse rather than assuming any television box will fit.";
  if(page.slug==="how-do-i-pack-a-flat-screen-tv-for-a-move" && /remounting responsibilities/iu.test(question))
    return "American Moving Choice advises confirming who will remove the television from its mount, manage accessories and remount it at the destination. Its guide says not to assume remounting is included. Keep the dismounting, hardware, cable and installation responsibilities clear when discussing the moving work with a company.";
  return null;
}

/** Curated question wording is bound to the selected visible section/FAQ, never unrelated filler. */
export function seoAssistantFaq(page: Page): AssistantFaqItem[] {
  const evidence = evidenceFor(page);
  if (["state", "city", "route", "zip"].includes(page.family)) {
    const result = geoFaq(page, evidence).map(item => scopeAnswer(page, item)); assertAssistantFaq(result); return result;
  }
  if (page.family === "cost") {
    const result=costFaq(page,evidence).map(item=>scopeAnswer(page,item)); assertAssistantFaq(result); return result;
  }
  const specifications = EDITORIAL_ASSISTANT_QUESTIONS[page.slug];
  if (!specifications) throw new Error(`assistant-faq: missing authored questions for ${page.slug}`);
  const condensed=condensedEditorial(page);
  if(condensed) {
    const result=specifications.map((spec,index)=>({question:spec.question,answer:condensed[index]!}));
    assertAssistantFaq(result);return result;
  }
  const result = specifications.map(spec => {
    const serviceAnswer=page.family==="service"?SERVICE_ANSWER_OVERRIDES[page.slug]?.[spec.question]:undefined;
    if(serviceAnswer)return {question:spec.question,answer:serviceAnswer};
    const literal=condensedLiteral(page,spec.question);
    if(literal)return {question:spec.question,answer:literal};
    const keys = spec.evidence.map(value => plain(value).toLowerCase());
    const selected = evidence.filter(item => keys.some(key => key !=="intro" && (key === item.sectionId || item.heading.toLowerCase().includes(key) || item.text.toLowerCase().includes(key) || item.anchor?.toLowerCase().includes(key))));
    if (keys.includes("intro") && sourceIntro(page)) selected.push({ text: sourceIntro(page), heading: title(page), sectionId: "intro", kind: "prose" });
    const ranked = selected.map((item, index) => ({ item, index, score: keys.reduce((score, key, keyIndex) => score + (item.text.toLowerCase().includes(key) || item.anchor?.toLowerCase().includes(key) ? 8 : 0) + (item.heading.toLowerCase() === key ? 120-keyIndex*10 : item.heading.toLowerCase().includes(key) ? 25-keyIndex*2 : 0), 0) + relevance(spec.question,item)*3 + (item.sectionId ==="intro" && keys[0]==="intro" ? 120:0) }))
      .sort((a,b) => b.score-a.score || a.index-b.index).map(row => row.item);
    if (!ranked.length) throw new Error(`assistant-faq: no bound evidence for ${page.slug}: ${spec.question}`);
    const groupIds = new Set(ranked.map(item => item.sectionId));
    const sameGroup = evidence.filter(item => groupIds.has(item.sectionId));
    const context = [...evidence, ...(sourceIntro(page) ? [{ text: sourceIntro(page), heading: title(page), sectionId: "intro", kind: "prose" as const }] : [])]
      .map((item,index) => ({ item, index, score: relevance(spec.question, item) })).filter(row => row.score > 0)
      .sort((a,b) => b.score-a.score || a.index-b.index).map(row => row.item);
    try {
      const bound = [...sameGroup,...context];
      let response = answer(page, "American Moving Choice explains:", texts(ranked), bound, true);
      const pageInterstateScope = hasInterstateScope(page);
      const federalRule = /\barbitration\b|full value|released value|bill of lading|binding estimate|written estimate|110%|60 cents|\$10,000|certified (?:platform|scale)|warehouse scale|3,000 pounds|reweigh/iu.test(response);
      if (!/\binterstate\b/iu.test(response) && (/\binterstate\b/iu.test(spec.question) || (pageInterstateScope && federalRule)))
        response = answer(page, "For interstate household-goods moves, American Moving Choice explains:", texts(ranked), bound, true);
      return scopeAnswer(page, { question: spec.question, answer: response });
    }
    catch (error) { throw new Error(`${error instanceof Error ? error.message : "assistant-faq: source binding failed"}: ${spec.question}`); }
  });
  assertAssistantFaq(result);
  return result;
}

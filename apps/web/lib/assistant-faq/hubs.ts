import { assertAssistantFaq, FAQ_BUSINESS_NAME, faqWordCount, type AssistantFaqItem } from "./types";

export interface HubFaqEntry {
  url: string;
  h1?: string;
  title?: string;
  stateCode?: string | null;
}

export interface HubFaqContext {
  family: string;
  url: string;
  title: string;
  description: string;
  page?: number;
  total: number;
  perPage?: number;
  entries: readonly HubFaqEntry[];
}

export interface CatalogFaqContext {
  filters: { query: string; type: string; stateName?: string; page: number };
  total: number;
  perPage: number;
  entries: readonly { url: string; title: string; family?: string }[];
}

const A = FAQ_BUSINESS_NAME;
const number = (value: number) => Math.max(0, Math.floor(value)).toLocaleString("en-US");
const clean = (value: string) => value.replace(/\s*\|\s*American Moving Choice\s*$/iu, "").replace(/\s+/gu, " ").trim();
const label = (entry: HubFaqEntry | undefined, fallback: string) => clean(entry?.h1 ?? entry?.title ?? fallback);
const quoted = (value: string) => `“${value.replace(/[.!?]+$/u, "")}”`;
const lower = (value: string) => value.charAt(0).toLocaleLowerCase("en-US") + value.slice(1);
const finish = (items: AssistantFaqItem[]) => { assertAssistantFaq(items); return items; };
const pageSummary = (context: HubFaqContext) => `Page ${number(context.page ?? 1)} lists ${number(context.entries.length)} of ${number(context.total)} published guides`;
const categories: Record<string, string> = { state: "state guides", city: "city guides", route: "moving routes", service: "moving services", cost: "moving cost guides", question: "moving questions", planning: "moving checklists", zip: "ZIP code guides", page: "tools, about pages and policies", all: "moving guides and public pages" };

/** Pure presentation copy: counts and examples come from the exact rendered results, never coverage. */
export function hubAssistantFaq(context: HubFaqContext): AssistantFaqItem[] {
  const first = label(context.entries[0], context.title);
  const second = label(context.entries[1], context.title);
  const route = /^Moving from (.+?) to (.+)$/iu.exec(first);
  const pair = route ? `from ${route[1]} to ${route[2]}` : `covered by ${quoted(first)}`;
  const origin = route?.[1];
  const scope = pageSummary(context);
  const browsing = context.perPage && context.total > context.perPage
    ? `The collection uses up to ${number(context.perPage)} guides per results page, with previous, next and direct page controls.`
    : "The collection shows its currently published guide cards together on this results page.";

  if (!context.entries.length) return finish([
    { question: `Where can I find published ${lower(context.title)}?`, answer: `${A}'s ${lower(context.title)} collection currently displays no published guide cards. The page says guides appear after their publishing checks pass. You can explore the other moving sections in the site navigation or return to this collection later; an empty information list does not provide a price or book a company.` },
    { question: `Who publishes the ${lower(context.title)} collection?`, answer: `${A} publishes this ${lower(context.title)} collection as part of its moving-information website. The current page lists ${number(context.entries.length)} guide cards. Use the site navigation to find another subject, or read a particular guide when one is listed; the collection itself is not a written moving estimate or a confirmed booking.` },
    { question: `Can an empty ${lower(context.title)} page tell me what my move will cost?`, answer: `${A}'s current ${lower(context.title)} results contain no guide card to open, and the page does not supply a price for your household move. Use the quote-request link for the next step when ready. Keep an information search separate from a price and service agreement that a company provides for your actual shipment.` },
    { question: `How can I keep planning when no ${lower(context.title)} guide is listed?`, answer: `${A}'s page still provides navigation to the wider moving library and a quote-request option. Choose another information topic or start with the route and move details requested by the survey. The absence of a published card in this collection does not commit you to a company or guarantee that a company will contact you.` },
  ]);

  if (context.family === "route") return finish([
    { question: route ? `Who has a moving guide ${pair}?` : `Who publishes ${quoted(first)} as a moving-route guide?`, answer: `${A} publishes ${quoted(first)} in its moving-route library. ${scope}, each opening a separate route page. The library is organized around origins and destinations; the linked guides explain their own place facts, route assumptions and limits rather than supplying a mover's written estimate.` },
    { question: origin ? `What's the best way to find more moving routes starting in ${origin}?` : "What's the best way to find a moving route by its origin and destination?", answer: `${A}'s route library lets you search either end of a move and filter by origin state. Use the origin, destination or city search field, then open the appropriate published route card. ${scope}; this is a count of guides, so it does not establish which company will handle a particular move.` },
    { question: route ? `How much does it cost to move ${pair}?` : `How much would the move in ${quoted(first)} cost?`, answer: `${A}'s route collection does not set a price for ${route ? `a move ${pair}` : `the move described in ${quoted(first)}`}. It links to individual guides with their own sourced place facts, assumptions and limits. Use the relevant guide to prepare questions, then request an estimate for your actual shipment; a planning guide is not a mover's quote.` },
    { question: route ? `Can I use the guide ${pair} as a promised driving time?` : `Can I treat ${quoted(first)} as a promised driving time?`, answer: `${A}'s route-library introduction separates modelled road distance from straight-line geography and says a guide is not a promise of driving time. Read the assumptions and limits on the particular route page. For ${route ? `a move ${pair}` : `the route described in ${quoted(first)}`}, keep those planning figures separate from timing a company agrees to provide.` },
    { question: `Where can I browse more moving routes beyond ${quoted(first)}?`, answer: `${A} lists ${number(context.total)} published route guides in this collection. ${browsing} The current results include ${quoted(first)}. Search the origin or destination when you need a different route, rather than assuming a nearby city or a similar state pair has the same planning facts.` },
  ]);

  if (context.family === "planning") return finish([
    { question: `Where can I find a moving checklist about ${quoted(first)}?`, answer: `${A}'s planning library lists ${quoted(first)} among its published moving checklists and timelines. ${scope}. Open the checklist that fits your current task, then read its own steps and sources; the hub organizes planning material rather than booking a date or giving a moving estimate.` },
    { question: `What's the best way to prepare for ${quoted(second)}?`, answer: `${A} links to ${quoted(second)} from this moving-planning collection. Use that task's checklist instead of treating every moving task as one undifferentiated list. The library covers checklists and timelines around moving documents, with practical preparation steps alongside them; the individual guide supplies the detail relevant to its particular subject.` },
    { question: "How do I use the interstate moving checklists without treating every practical tip as a legal rule?", answer: `${A}'s planning-library introduction distinguishes the paperwork order for interstate moves from the practical steps around it. Its description names the survey, written estimate, booklets, bill of lading, weighing and delivery. Read the source and scope on the individual checklist before treating any particular step as a legal requirement for your own move.` },
    { question: `Where can I find more moving-planning checklists after ${quoted(first)}?`, answer: `${A} lists ${number(context.total)} published planning guides in this collection. ${browsing} The current selection includes ${quoted(first)}. Choose another guide by the task in its title; being next in a results list does not mean it is the next required step in your move.` },
  ]);

  if (context.family === "question") return finish([
    { question: `Who publishes a sourced moving answer about ${quoted(first)}?`, answer: `${A}'s moving-question library links to ${quoted(first)}. The collection describes its answers as based on federal moving rules, FMCSA consumer guidance or the platform's own rules, with sources and access dates. Open the specific question to read its answer and scope; the title alone is not the advice.` },
    { question: `Where can I read a moving guide about ${quoted(second)}?`, answer: `${A} includes ${quoted(second)} in this moving-question collection. ${scope}. Select the guide card with that title to read the direct answer, supporting explanation and source information. This hub helps you find a published answer rather than substituting a general rule for the question you actually have.` },
    { question: "How can I tell which rules the moving-question answers rely on?", answer: `${A}'s moving-question introduction identifies 49 CFR Part 375, FMCSA consumer guidance and the platform's own rules as its source categories. It also says answers name their source and the date it was read. Check those details on the particular question page, especially when distinguishing an interstate rule from general planning guidance.` },
    { question: `Where can I find more moving questions beyond ${quoted(first)}?`, answer: `${A} lists ${number(context.total)} published question guides in this collection. ${browsing} The current selection includes ${quoted(first)}. Browse the titles for the issue you need explained, then read that page's sourced answer; the number of guide cards says nothing about a company's availability or a moving price.` },
  ]);

  if (context.family === "service") return finish([
    { question: `Who can help me understand ${lower(first)} before I request moving quotes?`, answer: `${A}'s moving-services collection links to ${quoted(first)} and explains that its service pages cover what a service includes, pricing methods and applicable rules. Open the relevant service guide before comparing offers. The collection provides information about moving services; its description does not establish a fixed price for your shipment.` },
    { question: `What's the best way to compare ${lower(first)} with ${lower(second)}?`, answer: `${A} lists both ${quoted(first)} and ${quoted(second)} in its moving-services collection. Read the separate service descriptions to compare the work covered, pricing method and rules described for each. Keep that comparison tied to your own needs rather than assuming the two service names include identical tasks or the same quoted total.` },
    { question: "Where can I find the other moving services in this collection?", answer: `${A}'s moving-services hub lists ${number(context.total)} published service guides, with ${number(context.entries.length)} cards in the current selection. Its introduction covers local, long-distance, interstate, packing, storage and specialty moving topics. Open the card for the service you need; a guide count is not a count of companies promising to perform your move.` },
    { question: `Can I get a fixed moving price from the ${lower(context.title)} collection?`, answer: `${A}'s service collection explains service scope and how movers price different work; it does not set a fixed moving price for your household. Start with a relevant service guide, then use the quote-request link when ready. The page lets you choose a maximum number of companies who may contact you about your request.` },
  ]);

  return finish([
    { question: `Where can I find ${lower(context.title)} about ${quoted(first)}?`, answer: `${A} includes ${quoted(first)} in this published guide collection. ${scope}. Open the relevant card to read that guide's particular details, sources and limitations. The results page is a way to locate information by its subject, not a written moving estimate or a reservation for a company.` },
    { question: `Who publishes the ${lower(context.title)} listed here?`, answer: `${A} publishes this ${lower(context.title)} collection and links each displayed card to its individual guide. ${scope}. Use the guide title to select the subject you need, then read the page itself before applying its facts to your own situation; a listed title is not a service commitment.` },
    { question: `Where can I read the guide ${quoted(second)}?`, answer: `${A} lists ${quoted(second)} among the guide cards in the current results. Open that card to read the specific page, rather than assuming another topic's details apply. ${scope}; the figures describe published information in this collection, not a number of companies assigned to handle your move.` },
    { question: `How can I browse the rest of the ${lower(context.title)} collection?`, answer: `${A} lists ${number(context.total)} published guides in this collection. ${browsing} Use the displayed titles to choose the next subject you need. The current selection includes ${quoted(first)}; other guide topics may involve different facts or assumptions, so read each page on its own terms.` },
  ]);
}

export function moversIndexAssistantFaq({ states }: { states: readonly { url: string; h1: string; stateCode?: string | null }[] }): AssistantFaqItem[] {
  const stateName = (entry: typeof states[number] | undefined) => clean(entry?.h1 ?? "the listed state guides").replace(/^moving companies in\s+/iu, "").replace(/:\s*.*$/u, "");
  const first = stateName(states[0]);
  const second = stateName(states[1]);
  return finish([
    { question: `Who can help me find moving information for ${first}?`, answer: `${A}'s state-guide index links to ${states.length ? `the ${first} guide` : "its currently published state guides"} alongside the other state cards. It currently lists ${number(states.length)} published state guides, with place facts and checked sources. Open a state's guide for its own local context; the state index is information to help you plan, not a company-specific moving estimate.` },
    { question: `Where can I compare moving guides for ${first} and ${second}?`, answer: `${A} places its published state guides together in this index, including ${states.length > 1 ? `${first} and ${second}` : "the state cards currently displayed"}. Open each state separately to read its place information and related local context. The page also links to route, service, cost, question and planning sections when you need a different kind of moving information.` },
    { question: "Do the moving-by-state guides tell me which company I have to hire?", answer: `${A}'s state index says companies introduce themselves when they contact you, and it does not present a public company list to browse. You can use the state guides for context, start a moving request and choose your contact limit. Reading a state page does not commit you to hiring a particular company.` },
    { question: "Where can I find moving routes and cost-planning information after choosing a state?", answer: `${A}'s state index links to moving routes, moving services, moving cost guides, moving questions and planning checklists. Use a route page for a particular origin and destination, or choose a cost or service topic for that part of your research. The index connects those subjects without replacing the details on each individual guide.` },
    { question: `How do I start a moving request after reading the ${first} guide?`, answer: `${A}'s state index offers a quote-request link and surveys that start with your route and move size. Add the details requested, choose a contact limit and review your request before sending it. Each company introduces itself when it contacts you; the state guide does not identify a company you must choose.` },
  ]);
}

/** Filter terms are quoted as search scope, never asserted as a new geographic or service fact. */
export function catalogAssistantFaq(context: CatalogFaqContext): AssistantFaqItem[] {
  const kind = categories[context.filters.type] ?? "moving guides";
  const place = context.filters.stateName ? ` for ${context.filters.stateName}` : "";
  // Search text is visitor input. Keep normal topic/location terms specific without echoing
  // markup or credential-like text into additional visible and structured-data copies.
  const query = context.filters.query
    ? faqWordCount(context.filters.query) > 8 || /<\/?[a-z][^>]*>|\]\([^)]*\)|\*\*|\b(?:sk-ant-|sb_secret_|github_pat_|who pays us|pays? us|we sell (?:leads|requests)|selling leads|lead pricing)/iu.test(context.filters.query)
      ? " matching the current search"
      : ` about ${quoted(context.filters.query)}`
    : "";
  const scope = `${kind}${place}${query}`;
  const first = clean(context.entries[0]?.title ?? `${kind}${place}`);
  const pageCount = Math.max(1, Math.ceil(context.total / context.perPage));
  const result = `The current search shows ${number(context.entries.length)} of ${number(context.total)} results on page ${number(context.filters.page)}`;
  return finish([
    { question: `Where can I find ${scope}?`, answer: `${A}'s all-guides catalog searches published guides and public pages by topic, category and state. ${result}. ${context.entries.length ? `One displayed title is ${quoted(first)}.` : "No guide card currently matches these filters."} Change the search or open a displayed card to read information for that particular subject.` },
    { question: `What's the best way to narrow the search for ${scope}?`, answer: `${A}'s catalog has a city, route or topic search field plus category and state filters. For ${scope}, use those controls to narrow the displayed cards, then open the guide you need. A search result describes published information; it does not establish a moving price, delivery date or company availability.` },
    { question: context.entries.length ? `Where can I read ${quoted(first)}?` : `What can I do when there are no catalog results for ${scope}?`, answer: context.entries.length ? `${A} lists ${quoted(first)} in the current catalog results. Select its card to read that particular page's information and any sources or limitations it provides. ${result}; other result titles may cover different subjects, so use the one that actually fits your question or moving location.` : `${A}'s catalog currently shows no matching guide cards for these search filters. Try a different city, route or topic, choose another category, or clear the state filter to broaden the information search. This empty results list is about published pages; it does not decide whether you may submit a moving request.` },
    { question: `How can I browse more ${scope} in the moving catalog?`, answer: `${A}'s catalog reports ${number(context.total)} results for the current search and filters. ${pageCount > 1 ? `It uses up to ${number(context.perPage)} results per page, with ${number(pageCount)} results pages and previous, next and numbered navigation.` : "The matching cards fit on one results page, so no further results-page navigation is needed."} Keep the search and filters in mind when changing pages; another category or state produces a different selection.` },
  ]);
}

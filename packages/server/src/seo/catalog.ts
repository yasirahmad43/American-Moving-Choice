/**
 * Editorial catalog for the service, question and planning families. Every claim about rules
 * is one of the sourced facts in facts.ts (referenced by topic, rendered with its source and
 * access date); the rest describes how American Moving Choice itself works (lead lifecycle,
 * which-companies-receive-my-request, how-we-verify-movers). No prices, offices, dates or mover
 * availability are stated here: those come from data at generation time.
 *
 * `related` names other catalog slugs and families the page links to; the generator resolves
 * them to published URLs only.
 */
import type { ContentBlock, FaqItem } from "./types";

export interface CatalogEntry {
  family: "service" | "question" | "planning";
  slug: string;
  primaryKeyword: string;
  intent: "informational" | "commercial" | "transactional";
  supportingKeywords: string[];
  title: string;
  h1: string;
  metaDescription: string;
  /** The direct answer (40-80 words) that opens the page. */
  answer: string;
  sections: { heading: string; blocks: ContentBlock[] }[];
  /** National fact topics (facts.ts) rendered as a sourced facts block. */
  factTopics: string[];
  faq: FaqItem[];
  /** Links: "service:local", "cost:state", "question:<slug>", "planning:<slug>", "movers:index". */
  related: string[];
  /** For services: the capability or service the network count is read from. */
  network?: { moveType?: "local" | "intrastate" | "interstate"; service?: "packing" | "storage" | "specialty_items" | "full_service" | "labor_only" };
}

const p = (text: string): ContentBlock => ({ type: "paragraph", text });
const ul = (items: string[]): ContentBlock => ({ type: "list", items });
const ol = (items: string[]): ContentBlock => ({ type: "list", items, ordered: true });
const note = (text: string): ContentBlock => ({ type: "note", text });

const HOW_AMC = "[How AMC makes money](/advertising-disclosure/)";
const WHO_GETS = "[Which companies receive my request](/which-companies-receive-my-request/)";
const VERIFY = "[How we verify movers](/how-we-verify-movers/)";

// ------------------------------------------------------------------ services

export const SERVICES: CatalogEntry[] = [
  {
    family: "service",
    slug: "local",
    primaryKeyword: "local movers",
    intent: "commercial",
    supportingKeywords: ["local moving companies", "movers near me", "local moving services"],
    title: "Local Movers: How Short-Distance Moves Are Priced and Regulated",
    h1: "Local movers",
    metaDescription:
      "What counts as a local move, who regulates it, how hourly pricing works, and how to reach screened local movers in our network by ZIP code.",
    answer:
      "A local move is a short-distance move that starts and ends in the same state. On this site, a move of 50 miles or less between ZIP centroids counts as local (the network's local radius setting). Local moves are regulated by the state, not by FMCSA, and most local movers charge by the hour for a crew and a truck, plus a travel fee.",
    sections: [
      {
        heading: "What makes a move local",
        blocks: [
          p(
            "Two things decide how we classify a move: whether both ZIP codes are in the same state, and the straight-line distance between them. Same state and within the local radius means local; same state and farther means an in-state long-distance move; a different state means an interstate move. The classification decides which movers' coverage rules apply and which pricing method the cost model uses.",
          ),
          p(
            "The federal rules in 49 CFR Part 375 (written estimates, the 110% rule, valuation) apply to interstate moves. For a move within one state, the state's own rules apply, and they differ widely. The [state pages](/movers/) name the regulator where we have a sourced record and say plainly when we don't.",
          ),
        ],
      },
      {
        heading: "How local movers usually price",
        blocks: [
          p(
            "Movers' rate cards in our network describe local moves with an hourly rate per crew size, a travel fee and a typical number of hours and crew for each home size. The cost model builds its typical job from the medians of what the area's movers state, prices each mover on that job with its own rates and shows the 25th to 75th percentile as a range, only when at least five different movers' cards cover the area.",
          ),
          ul([
            "Hourly rate: set per crew (2, 3, 4 or 5 movers). Larger homes usually need a bigger crew and more hours.",
            "Travel fee: a flat charge that covers the drive to and from your home.",
            "Extras: packing, storage and specialty items are priced separately by the movers that offer them.",
          ]),
          p("Ranges are planning figures from rate cards, never a quote. Movers set their own prices, and American Moving Choice does not give estimates. [Moving costs](/moving-costs/) explains the method."),
        ],
      },
      {
        heading: "Who regulates local moves",
        blocks: [
          p(
            "FMCSA's rules don't reach a move between two points in the same state. Some states license intrastate movers themselves: Texas (TxDMV), California (BHGS, the CAL-T number) and Florida (FDACS, the IM number) are three we have sourced. Where a state page shows no regulator section, it is because we have not yet verified one, not because none exists.",
          ),
        ],
      },
      {
        heading: "Reaching local movers through this site",
        blocks: [
          p(
            `Every mover in our network sets where its moves may start (states, counties or ZIP codes) and which kinds of move it takes. A local request reaches only movers whose rules name your county or ZIP code for local moves, and never more than the number you choose. ${WHO_GETS} explains each step; ${HOW_AMC} explains who pays us.`,
          ),
        ],
      },
    ],
    factTopics: ["interstate_scope", "accessorials"],
    faq: [
      { question: "Is a 60-mile move within my state a local move?", answer: "Not on this site: the local radius is 50 straight-line miles between ZIP centroids, so a 60-mile in-state move counts as in-state long distance. Movers' coverage rules and the cost model treat it that way." },
      { question: "Do local movers need a USDOT number?", answer: "It depends on the state. Some states require intrastate carriers to hold a USDOT number; FMCSA keeps the list. Every mover in our network must show active household-goods carrier authority on its FMCSA record regardless." },
      { question: "Can I get a local range before I share contact details?", answer: "Yes. The [moving cost calculator](/moving-cost-calculator/) shows a labeled range before any contact field, when at least five movers' rate cards cover the origin state for that move type and home size." },
    ],
    related: ["service:long-distance", "cost:local", "question:how-much-do-local-movers-cost", "question:how-many-movers-do-i-need", "planning:moving-day-checklist", "movers:index"],
    network: { moveType: "local" },
  },
  {
    family: "service",
    slug: "long-distance",
    primaryKeyword: "long distance movers",
    intent: "commercial",
    supportingKeywords: ["long distance moving companies", "cross country movers", "cheap long distance movers"],
    title: "Long-Distance Movers: Weight-Based Pricing, Rules and Screened Carriers",
    h1: "Long-distance movers",
    metaDescription:
      "How long-distance moves are priced by weight and distance band, which federal rules protect you on an interstate move, and how our network's carriers cover them.",
    answer:
      "A long-distance move is any move beyond the local radius: either across a state line (interstate) or more than 50 miles within one state. Long-distance movers price by shipment weight and distance rather than by the hour, and interstate moves come with federal protections: a written estimate, a survey of your goods, the 110% rule on non-binding estimates and full value protection by default.",
    sections: [
      {
        heading: "How long-distance pricing works",
        blocks: [
          p(
            "Movers' rate cards describe long-distance moves with a rate per hundredweight (cwt) for each distance band and a typical shipment weight for each home size. The cost model takes the median weight the area's movers state for your home size, multiplies it by each mover's rate for the band your route falls in, and shows the 25th to 75th percentile of the results as a range.",
          ),
          { type: "table", caption: "Distance bands the cost model uses (straight-line miles between ZIP centroids)", columns: ["Band", "Miles"], rows: [["0 to 250", "up to 250"], ["250 to 500", "251 to 500"], ["500 to 1,000", "501 to 1,000"], ["1,000 to 1,500", "1,001 to 1,500"], ["1,500 plus", "more than 1,500"]] },
          p("Straight-line miles understate driving distance, so a route near a band's edge may be priced in the next band by the mover. Every range states its band."),
        ],
      },
      {
        heading: "Federal rules on interstate moves",
        blocks: [
          p("The facts below come from 49 CFR Part 375 and FMCSA's consumer pages, read on the dates shown. They apply to interstate moves, including a move within one state whose route crosses another state."),
        ],
      },
      {
        heading: "Cross-country moves",
        blocks: [
          p(
            "A cross-country move is an interstate move in the longest band (more than 1,500 straight-line miles). The same rules apply; what changes is the delivery window, which the mover sets in the bill of lading as a date or a spread of dates, and the chance that your goods share a truck with other shipments. Ask each mover how it handles delivery spreads and what it owes you if it misses them.",
          ),
        ],
      },
      {
        heading: "Lower-cost options, honestly",
        blocks: [
          ul([
            "Reduce weight: on a weight-priced move, every box you don't ship saves money. Weigh the cost of replacing bulky, low-value items against moving them.",
            "Flexible dates: movers set their own prices and some price off-peak dates lower. We hold no seasonal price data yet, so ask each mover.",
            "Compare estimates on the same basis: binding or non-binding, same inventory, same services. A written estimate is required on every interstate move.",
          ]),
        ],
      },
    ],
    factTopics: ["interstate_scope", "written_estimate", "physical_survey", "rule_110", "valuation", "weighing"],
    faq: [
      { question: "Is a move of 300 miles within Texas a long-distance move?", answer: "Yes, an in-state long-distance (intrastate) move. It is priced by weight and band like an interstate move, but Texas rules, not FMCSA's Part 375, govern it." },
      { question: "Does a long-distance mover have to weigh my shipment?", answer: "On an interstate move with a non-binding estimate that depends on weight, yes, on a certified scale, and you may watch. A binding estimate doesn't depend on weight, so no weighing is required." },
      { question: "What is the 110% rule?", answer: "On a non-binding interstate estimate, the mover must hand over your goods once you pay up to 110% of the estimate at delivery; any remaining balance is billed later, no sooner than 30 days after delivery per FMCSA guidance." },
    ],
    related: ["service:interstate", "service:local", "cost:long-distance", "question:what-is-a-binding-estimate", "question:what-is-the-110-percent-rule", "planning:moving-out-of-state-checklist", "movers:index"],
    network: { moveType: "interstate" },
  },
  {
    family: "service",
    slug: "interstate",
    primaryKeyword: "interstate movers",
    intent: "commercial",
    supportingKeywords: ["interstate moving companies", "out of state movers", "out of state moving companies"],
    title: "Interstate Movers: FMCSA Authority, Your Rights and Screened Carriers",
    h1: "Interstate movers",
    metaDescription:
      "What an interstate mover must hold (USDOT number, household-goods carrier authority, insurance filings), the documents it owes you, and how to check one before hiring.",
    answer:
      "An interstate mover carries household goods across state lines under FMCSA operating authority. It must hold an active USDOT number, household-goods carrier authority and the required liability and cargo insurance filings, and on every interstate move it owes you a written estimate, a survey of your goods, FMCSA's rights booklet and a bill of lading at least three days before loading. Every mover in our network must show carrier authority and no broker authority on its federal record.",
    sections: [
      {
        heading: "What an interstate mover must hold",
        blocks: [
          ul([
            "An active USDOT number.",
            "Household-goods motor carrier authority (common or contract), granted separately from the USDOT number.",
            "Liability and cargo insurance filings on record with FMCSA.",
            "A process agent (BOC-3) filing.",
          ]),
          p(`We check these on the FMCSA record for every mover before it joins the network and recheck weekly. ${VERIFY} lists each check, and [Verify a mover](/verify-a-mover/) lets you look up any company's USDOT or MC number yourself.`),
        ],
      },
      {
        heading: "Carriers, not brokers",
        blocks: [
          p(
            "A household-goods broker arranges transport by a carrier and does not move your goods itself. Federal rules require brokers to say so in their ads and websites. American Moving Choice works only with carriers: a company with broker authority on its record cannot buy requests here. [Movers vs brokers](/movers-vs-brokers/) shows how to read a company's FMCSA record.",
          ),
        ],
      },
      {
        heading: "The documents an interstate mover owes you",
        blocks: [
          ol([
            "A written estimate, binding or non-binding, after a survey of your goods (on-site or by video) unless you waive the survey in writing.",
            "FMCSA's \"Ready to Move?\" brochure and \"Your Rights and Responsibilities When You Move\" booklet, with the estimate.",
            "Notice that its tariff is available, and summaries of its arbitration program and complaint procedures, before the bill of lading.",
            "The bill of lading, at least three days before the scheduled loading.",
            "Weight tickets, when charges depend on weight.",
          ]),
        ],
      },
      {
        heading: "Where interstate moves are covered by our network",
        blocks: [
          p(
            "Movers choose directional coverage: the states, counties or ZIP codes a move may start in and, if they wish, where it may end. A request from Texas to Florida reaches movers whose rules include Texas origins and Florida destinations for moves between states, and only as many as you choose. The [route pages](/routes/) show, for each pair, how many movers currently list that direction.",
          ),
        ],
      },
    ],
    factTopics: ["usdot_requirement", "insurance_filings", "broker_rules", "booklets", "bill_of_lading", "arbitration", "complaints"],
    faq: [
      { question: "How do I check whether a mover is authorized for interstate moves?", answer: "Look up its USDOT number on FMCSA's Protect Your Move site or our [Verify a mover](/verify-a-mover/) tool. Operating authority status should read authorized for household goods; NOT AUTHORIZED means the company holds no interstate for-hire authority." },
      { question: "Does an interstate mover have to use arbitration?", answer: "It must offer a neutral arbitration program for loss, damage and post-delivery charge disputes. It is binding for claims of $10,000 or less if you ask; above that only if the mover also agrees. You may still go to court." },
      { question: "Can an interstate mover ask for a large deposit?", answer: "No federal rule caps deposits, but FMCSA lists a demand for cash or a large deposit before the move as a red flag. The estimate must state which forms of payment the mover accepts at delivery." },
    ],
    related: ["service:long-distance", "cost:long-distance", "question:what-is-a-usdot-number", "question:movers-vs-brokers-what-is-the-difference", "question:what-is-full-value-protection", "planning:moving-out-of-state-checklist"],
    network: { moveType: "interstate" },
  },
  {
    family: "service",
    slug: "packing",
    primaryKeyword: "packing services",
    intent: "commercial",
    supportingKeywords: ["packing and moving services", "movers that pack for you", "packing service cost"],
    title: "Packing Services: What Movers Pack, How It Is Priced and Who Offers It",
    h1: "Packing services",
    metaDescription:
      "How full and partial packing is priced on movers' rate cards, what it changes about liability, and how to reach network movers that offer packing with your move.",
    answer:
      "Packing is an extra service some movers offer with a move: their crew packs some or all of your belongings into boxes before loading. On rate cards in our network, packing is priced per home size and added to the move's range only for movers that offer it. On an interstate move, packing is an accessorial service the mover must settle with you before preparing the bill of lading.",
    sections: [
      {
        heading: "Full, partial and fragile-only packing",
        blocks: [
          ul([
            "Full packing: the crew packs everything, usually the day before loading, and supplies boxes and materials.",
            "Partial packing: you pack most rooms and the crew packs the kitchen, art or other fragile items.",
            "Unpacking: offered by some movers as a separate service at destination.",
          ]),
          p("Ask each mover which materials are included, whether boxes are collected after the move, and how it documents what its crew packed."),
        ],
      },
      {
        heading: "How packing appears in a cost range",
        blocks: [
          p(
            "The cost model adds a mover's packing price for your home size on top of its price for the typical job. A mover that doesn't price packing drops out of the range when packing is selected, so a range with packing can rest on fewer movers than one without. When fewer than five movers price it, the calculator shows no range and says why.",
          ),
        ],
      },
      {
        heading: "Packing and liability",
        blocks: [
          p(
            "On an interstate move the mover's liability under full value protection covers goods it packed as well as goods you packed, but movers commonly limit claims for damage inside boxes they did not pack (\"PBO\", packed by owner) to visible damage. Ask how the mover handles PBO boxes before you decide what to pack yourself.",
          ),
        ],
      },
    ],
    factTopics: ["accessorials", "valuation"],
    faq: [
      { question: "Do all movers offer packing?", answer: "No. Each mover in our network lists the services it offers, and only movers that offer packing receive a request that asks for it." },
      { question: "Is packing included in an hourly local rate?", answer: "Usually not. Rate cards price packing separately per home size. Some movers will pack by the hour instead; ask which basis applies." },
      { question: "Can I ask only for packing without a move?", answer: "Our survey is for moves. A packing-only job is between you and a mover directly." },
    ],
    related: ["service:storage", "service:specialty", "cost:local", "question:how-much-does-packing-cost", "planning:how-to-pack-for-a-move"],
    network: { service: "packing" },
  },
  {
    family: "service",
    slug: "storage",
    primaryKeyword: "moving and storage",
    intent: "commercial",
    supportingKeywords: ["movers with storage", "storage in transit", "moving storage services"],
    title: "Moving and Storage: Storage-in-Transit, Monthly Pricing and Network Movers",
    h1: "Moving and storage",
    metaDescription:
      "When storage fits a move, how movers price it per month on their rate cards, what storage-in-transit means for liability on an interstate move, and which network movers offer it.",
    answer:
      "Storage with a move means the mover holds your goods between pickup and delivery, usually because the new home isn't ready. Movers in our network that offer storage price it per month by home size, and the cost model adds one month when storage is selected. On an interstate move, goods held in storage-in-transit stay under the mover's liability terms until delivery.",
    sections: [
      {
        heading: "When storage makes sense",
        blocks: [
          ul([
            "A gap between closing dates or lease ends.",
            "A long-distance move where the destination isn't ready on the delivery spread.",
            "Downsizing in stages.",
          ]),
        ],
      },
      {
        heading: "How storage is priced",
        blocks: [
          p(
            "Rate cards state a monthly storage price for each home size. The cost model counts one month (its storage assumption) when you select storage, and only movers that price storage stay in the range. Handling in and out of storage, and a second delivery, may be charged separately: ask each mover what its monthly price includes.",
          ),
        ],
      },
      {
        heading: "Storage-in-transit on interstate moves",
        blocks: [
          p(
            "Storage-in-transit (SIT) is storage the mover arranges as part of an interstate move. The mover's tariff sets the SIT charges and the period after which the shipment converts to permanent storage under different terms. Ask for both in writing before loading.",
          ),
        ],
      },
    ],
    factTopics: ["accessorials", "valuation", "bill_of_lading"],
    faq: [
      { question: "Is storage priced per month or per day?", answer: "Rate cards in our network price it per month by home size. Movers may prorate; ask." },
      { question: "Does my coverage continue in storage?", answer: "On an interstate move, the valuation level you chose applies while the goods are in storage-in-transit. Permanent storage may be under separate warehouse terms. Get the mover's answer in writing." },
    ],
    related: ["service:packing", "service:long-distance", "cost:long-distance", "question:how-much-does-storage-cost-with-a-move", "planning:moving-timeline-8-weeks"],
    network: { service: "storage" },
  },
  {
    family: "service",
    slug: "specialty",
    primaryKeyword: "specialty movers",
    intent: "commercial",
    supportingKeywords: ["piano movers", "safe movers", "antique movers", "specialty item moving"],
    title: "Specialty Item Movers: Pianos, Safes, Art and Other Items That Need Extra Care",
    h1: "Specialty item movers",
    metaDescription:
      "How movers price specialty items such as pianos and safes, what extra notice high-value items need on an interstate move, and how to reach network movers that handle them.",
    answer:
      "Specialty items are belongings that need extra crew, equipment or care: pianos, gun safes, pool tables, large art, antiques and hot tubs. Movers in our network that handle them add a flat specialty-item price on their rate card. On an interstate move, items worth more than $100 per pound need written notice to the mover so they are covered under full value protection.",
    sections: [
      {
        heading: "Common specialty items",
        blocks: [
          { type: "table", columns: ["Item", "What usually changes"], rows: [["Upright or grand piano", "Extra crew, a piano board or skid, and stair planning"], ["Gun safe or large safe", "Weight limits per crew member, stair-climbing equipment"], ["Pool table", "Disassembly, slate handling and re-leveling at destination"], ["Art, antiques, mirrors", "Custom crating and separate inventory notes"], ["Hot tub or exercise equipment", "Disconnection, drainage and extra handling"]] },
        ],
      },
      {
        heading: "Pricing and the cost range",
        blocks: [
          p("A rate card states one specialty-item price. The cost model adds it once when specialty items are selected and keeps only movers that price them. The range therefore tells you which movers handle specialty items at all, not what a particular piano will cost; get a written estimate after a survey."),
        ],
      },
      {
        heading: "High-value items on an interstate move",
        blocks: [
          p("Full value protection covers goods up to the declared value, but items worth more than $100 per pound (jewelry, some art, collectibles) need written notice to the mover, usually on a high-value inventory form, or the mover's liability for them is limited. Ask for the form with the estimate."),
        ],
      },
    ],
    factTopics: ["valuation", "accessorials"],
    faq: [
      { question: "Do I need a separate piano mover?", answer: "Not always. Some full-service movers move pianos with their own crews and equipment; others subcontract or decline. Each mover in our network lists whether it offers specialty items, and only those receive a request that asks for them." },
      { question: "Will the mover disassemble a pool table?", answer: "Many do, for a charge in their tariff; some require a specialist for slate tables. Ask before the estimate, so the service appears on it." },
    ],
    related: ["service:packing", "service:storage", "question:what-is-full-value-protection", "planning:moving-day-checklist"],
    network: { service: "specialty_items" },
  },
];

// ------------------------------------------------------------------ questions

const q = (
  slug: string,
  primaryKeyword: string,
  title: string,
  h1: string,
  metaDescription: string,
  answer: string,
  sections: CatalogEntry["sections"],
  factTopics: string[],
  faq: FaqItem[],
  related: string[],
  supportingKeywords: string[] = [],
  intent: CatalogEntry["intent"] = "informational",
): CatalogEntry => ({ family: "question", slug, primaryKeyword, intent, supportingKeywords, title, h1, metaDescription, answer, sections, factTopics, faq, related });

export const QUESTIONS: CatalogEntry[] = [
  q(
    "what-is-a-binding-estimate",
    "what is a binding estimate",
    "What Is a Binding Moving Estimate? Binding vs Non-Binding Explained",
    "What is a binding moving estimate?",
    "A binding estimate guarantees the total cost for the goods and services it lists; a non-binding one can change, within the 110% rule. What each means on an interstate move.",
    "A binding estimate is a written interstate moving estimate that guarantees the total cost of the goods and services it lists: at delivery the mover may collect no more than that amount, plus services you asked for afterwards. A non-binding estimate is the mover's reasonably accurate guess; the final bill follows its tariff, but you never pay more than 110% of the estimate at delivery.",
    [
      { heading: "Binding", blocks: [p("The mover and you are bound by the charges on the estimate. If you add goods or services before loading, the mover must reaffirm the estimate, prepare a new binding estimate you sign, or agree in writing to treat it as non-binding. If it loads without doing one of these, the original binding estimate stands. A mover may charge for preparing a binding estimate.")] },
      { heading: "Non-binding", blocks: [p("A non-binding estimate must be reasonably accurate and built from the estimated weight or volume, the services and the survey. It must say that the final charges come from the mover's tariff and may be higher, and that you won't pay more than 110% of the estimate at delivery. It is free.")] },
      { heading: "\"Binding not-to-exceed\"", blocks: [p("This is not a federal term. Movers and guides use it for a binding price that drops if the shipment weighs less than estimated. If a mover offers one, ask it to write exactly what happens if the weight comes in under the estimate.")] },
    ],
    ["written_estimate", "binding_estimate", "rule_110", "physical_survey"],
    [
      { question: "Can a mover charge for an estimate?", answer: "For a binding estimate, yes. For a non-binding estimate, no." },
      { question: "Which type is better?", answer: "Neither by rule. A binding estimate gives certainty if your inventory is complete; a non-binding one can come in lower or higher. Compare both on the same inventory and services." },
    ],
    ["question:what-is-the-110-percent-rule", "question:does-a-mover-have-to-do-a-survey", "service:long-distance", "service:interstate", "cost:long-distance"],
    ["binding vs non-binding estimate", "binding moving estimate"],
  ),
  q(
    "what-is-the-110-percent-rule",
    "110 percent rule moving",
    "What Is the 110% Rule for Moving Estimates?",
    "What is the 110% rule?",
    "On a non-binding interstate estimate the mover must release your goods once you pay up to 110% of the estimate at delivery; the rest is billed later. Source: 49 CFR 375.407.",
    "The 110% rule is a federal protection on interstate moves with a non-binding estimate: at delivery, the mover must hand over your goods once you pay up to 110% of the estimated charges, plus any services you asked for after the bill of lading and any impracticable-operations charges. Whatever remains is billed later, no sooner than 30 days after delivery according to FMCSA guidance.",
    [
      { heading: "A worked example from FMCSA", blocks: [p("FMCSA's 2004 example: a $1,000 non-binding estimate and $1,500 of actual charges means you pay $1,100 at delivery and the mover bills the remaining $400 later.")] },
      { heading: "What it does not cover", blocks: [ul(["Binding estimates: the binding amount applies instead.", "Services you asked for after the bill of lading was issued.", "Impracticable-operations charges (for example a shuttle because the truck can't reach your street), which are capped separately.", "Moves within one state: state rules apply."])] },
    ],
    ["rule_110", "written_estimate"],
    [{ question: "Can the mover hold my goods until I pay the full bill?", answer: "On a non-binding interstate estimate, no. Refusing delivery after you pay 110% counts as failing to transport with reasonable dispatch, which exposes the mover to delay claims. Report it to FMCSA." }],
    ["question:what-is-a-binding-estimate", "question:what-if-a-mover-holds-my-belongings-hostage", "service:interstate"],
    ["110% rule", "moving estimate 110 percent"],
  ),
  q(
    "does-a-mover-have-to-do-a-survey",
    "do movers have to do an in home survey",
    "Does a Mover Have to Survey My Belongings Before an Estimate?",
    "Does a mover have to survey my belongings before an estimate?",
    "On an interstate move, yes: since 2022 the mover must survey your goods on-site or by video before a written estimate, unless you waive it in a signed writing.",
    "On an interstate move, yes. Since FMCSA's 2022 rule, a mover must physically survey your goods before giving a written estimate for every interstate shipment, at any distance, unless you waive the survey in a signed writing before loading. The survey can be on-site or virtual: a video survey must let the mover clearly identify the goods. The old 50-mile exception is gone.",
    [
      { heading: "Why the survey matters", blocks: [p("An estimate built without seeing your goods is FMCSA's first red flag. A survey lets the mover estimate weight, count specialty items and plan access, which is what makes a non-binding estimate reasonably accurate and a binding estimate complete.")] },
      { heading: "Virtual surveys", blocks: [p("Live or pre-recorded video counts, and FMCSA's 2022 preamble says pre-recorded surveys should allow follow-up questions. Walk every room, open closets and show the garage and attic.")] },
    ],
    ["physical_survey", "red_flags"],
    [{ question: "What if I waive the survey?", answer: "You may, in a signed writing before loading. The estimate then rests on your inventory, so an incomplete list can raise the bill on a non-binding estimate or force a new binding one before loading." }],
    ["question:what-is-a-binding-estimate", "question:how-to-spot-a-moving-scam", "service:interstate"],
    ["virtual moving survey", "in-home moving estimate"],
  ),
  q(
    "what-is-full-value-protection",
    "what is full value protection",
    "What Is Full Value Protection on a Move?",
    "What is full value protection?",
    "Full value protection makes the mover liable for the replacement value of lost or damaged goods up to the declared value; released value is 60 cents per pound. Source: 49 U.S.C. 14706.",
    "Full value protection is the default liability level on an interstate move: the mover is liable for the replacement value of any goods lost, damaged or not delivered, up to the shipment's declared value, unless you waive it in writing. If you waive it, liability falls to the released rate of no more than 60 cents per pound per article, at no extra charge. The choice is recorded on the valuation statement with the estimate.",
    [
      { heading: "Full value vs released value, in numbers", blocks: [p("FMCSA's example: a 10-pound item worth $1,000 recovers $6.00 under released value (60 cents a pound) and up to its replacement value under full value protection. Full value protection prices come from each mover's tariff; released value costs nothing extra.")] },
      { heading: "Items of extraordinary value", blocks: [p("Items worth more than $100 per pound need written notice to the mover, or its liability for them is limited even under full value protection.")] },
      { heading: "This is liability, not insurance", blocks: [p("Valuation is the mover's liability under federal law, not an insurance policy. Separate moving insurance is sold by third parties; ask what each covers that the other doesn't.")] },
    ],
    ["valuation"],
    [{ question: "Can a mover make me take released value?", answer: "No. Full value protection is the default; released value applies only if you waive full value in writing." }],
    ["question:does-a-mover-need-insurance", "service:specialty", "service:interstate", "planning:moving-insurance-and-valuation-checklist"],
    ["full value protection vs released value", "moving valuation"],
  ),
  q(
    "what-is-a-usdot-number",
    "what is a usdot number",
    "What Is a USDOT Number and When Does a Mover Need One?",
    "What is a USDOT number?",
    "A USDOT number identifies a carrier on FMCSA's records. It is required for interstate commerce; operating authority is a separate grant. How to look one up.",
    "A USDOT number is the identifier FMCSA assigns to a motor carrier. It is required for interstate commerce that meets FMCSA's criteria, and some states require intrastate carriers to hold one too. It is not the same as operating authority: a company can have an active USDOT number and still hold no authority to move household goods for hire across state lines.",
    [
      { heading: "USDOT number vs operating authority", blocks: [{ type: "table", columns: ["Record", "What it shows"], rows: [["USDOT number", "The carrier's identity and safety record; status ACTIVE, INACTIVE or OUT-OF-SERVICE"], ["Operating authority (MC docket)", "Whether the company may carry household goods for hire between states, and whether it is a carrier or a broker"], ["Insurance filings", "Liability and cargo coverage on file for interstate authority"]] }] },
      { heading: "How to look one up", blocks: [p("Use FMCSA's Protect Your Move search or our [Verify a mover](/verify-a-mover/) tool. An operating authority status of NOT AUTHORIZED means the USDOT number is active but the company holds no interstate for-hire authority.")] },
      { heading: "MC numbers", blocks: [p("FMCSA has said it is considering no longer assigning MC numbers, a change it would publish as a proposed rule first. Newly issued USDOT and docket numbers are randomized under FMCSA's Motus system; existing numbers do not change.")] },
    ],
    ["usdot_requirement", "usdot_lookup"],
    [{ question: "Does a local mover need a USDOT number?", answer: "It depends on the state: some require intrastate carriers to hold one. Every mover in our network holds one regardless, because we verify its federal record." }],
    ["question:movers-vs-brokers-what-is-the-difference", "service:interstate", "question:how-to-check-if-a-moving-company-is-legitimate"],
    ["usdot number lookup", "dot number movers"],
  ),
  q(
    "movers-vs-brokers-what-is-the-difference",
    "moving broker vs carrier",
    "Moving Broker vs Carrier: What Is the Difference?",
    "Moving broker vs carrier: what is the difference?",
    "A carrier moves your goods under its own authority; a broker arranges a carrier and must say so in its ads. What each must disclose and why this site lists carriers only.",
    "A carrier is the company that transports your goods under its own household-goods carrier authority, with its own trucks and crews. A broker arranges transport by a carrier and does not move your goods itself. Federal rules require a broker to say in its ads and on its website that it is a broker, that it does not transport goods, and that it arranges transport by an FMCSA-authorized carrier, with its MC and USDOT numbers.",
    [
      { heading: "How to tell from the FMCSA record", blocks: [p("Look up the company's USDOT number. The operating authority section shows whether it holds carrier authority, broker authority or both. A company with both may hand your move to another carrier. [Movers vs brokers](/movers-vs-brokers/) walks through a record step by step.")] },
      { heading: "What a broker owes you", blocks: [p("Brokers that serve individual shippers must use only properly authorized carriers, disclose their cancellation, deposit and refund policies, and may give estimates only under a written agreement with the carrier that will do the move.")] },
      { heading: "Why this site lists carriers only", blocks: [p("Every company in our network must show active household-goods carrier authority and no broker authority on its federal record, and agree not to resell your request or hand your move to another company. We recheck federal records weekly.")] },
    ],
    ["broker_rules", "insurance_filings"],
    [{ question: "Is a broker illegal?", answer: "No. Licensed household-goods brokers are lawful; they must hold broker authority and a $75,000 bond or trust and follow the disclosure rules. The risk is a company that hides which role it plays." }],
    ["question:what-is-a-usdot-number", "question:how-to-spot-a-moving-scam", "service:interstate"],
    ["movers vs brokers", "what is a moving broker"],
  ),
  q(
    "how-to-spot-a-moving-scam",
    "how to spot a moving scam",
    "How to Spot a Moving Scam: FMCSA's Red Flags",
    "How to spot a moving scam",
    "FMCSA's red flags: sight-unseen estimates, no written estimate, large deposits, blank documents, no local address. What to check before you hire.",
    "FMCSA's own list of red flags is the best starting point: an estimate given by phone or online sight unseen, no written estimate or a price set only after loading, a demand for cash or a large deposit before the move, a request to sign blank documents, no copy of the rights booklet, and a website with no local address and no registration or insurance details.",
    [
      { heading: "The red flags, from FMCSA", blocks: [ul(["An estimate by phone or online, sight unseen, with no inspection of your goods.", "No written estimate, or a price given only after loading.", "A demand for cash or a large deposit before the move.", "A request to sign blank or incomplete documents.", "No copy of \"Your Rights and Responsibilities When You Move\" or \"Ready to Move?\".", "A website with no local address and no registration or insurance information.", "A claim that the mover's insurance covers all your goods.", "A phone answered with a generic \"Movers\".", "A rental truck on moving day.", "A sudden claim that you have more goods than estimated."])] },
      { heading: "Three checks before you sign", blocks: [ol(["Look up the USDOT number and confirm active household-goods carrier authority.", "Insist on a survey and a written estimate that says binding or non-binding.", "Read the valuation statement and choose your liability level in writing."])] },
      { heading: "If something goes wrong", blocks: [p("File a complaint with FMCSA's National Consumer Complaint Database or call 1-888-DOT-SAFT. State attorneys general and consumer agencies also pursue moving fraud.")] },
    ],
    ["red_flags", "deposits", "complaints", "usdot_lookup"],
    [{ question: "Is a deposit always a red flag?", answer: "No federal rule caps deposits. FMCSA flags a demand for cash or a large deposit before the move; a modest, refundable deposit by card from a verified carrier is common." }],
    ["question:what-if-a-mover-holds-my-belongings-hostage", "question:how-to-check-if-a-moving-company-is-legitimate", "question:movers-vs-brokers-what-is-the-difference"],
    ["moving scams", "rogue movers"],
  ),
  q(
    "how-to-check-if-a-moving-company-is-legitimate",
    "how to check if a moving company is legitimate",
    "How to Check If a Moving Company Is Legitimate",
    "How to check if a moving company is legitimate",
    "Five checks on FMCSA's records and the company's documents: USDOT status, carrier authority, insurance filings, complaint history and the written estimate.",
    "Check the company's FMCSA record first: an active USDOT number, household-goods carrier authority (not only broker authority), liability and cargo insurance filings, and its complaint history on Protect Your Move. Then check its documents: a survey, a written estimate that says binding or non-binding, the rights booklet, and a valuation statement.",
    [
      { heading: "On FMCSA's records", blocks: [ol(["USDOT status is ACTIVE, not INACTIVE or OUT-OF-SERVICE.", "Operating authority reads authorized for household goods.", "Liability and cargo insurance are on file.", "The complaint history on Protect Your Move is one you can live with."])] },
      { heading: "In the company's documents", blocks: [ul(["A survey before the estimate, on-site or by video.", "A written estimate that states binding or non-binding.", "The two FMCSA booklets and a tariff availability notice.", "A valuation statement with your liability choice."])] },
      { heading: "What this site checks for you", blocks: [p(`${VERIFY} explains the federal checks every network mover must pass before it can receive requests. Companies introduce themselves during contact; screening evidence is kept in our records.`)] },
    ],
    ["usdot_lookup", "insurance_filings", "written_estimate", "booklets"],
    [{ question: "Does a good review score prove a mover is legitimate?", answer: "No. Reviews say how customers felt; FMCSA's records say whether the company may lawfully move your goods. Check both." }],
    ["question:what-is-a-usdot-number", "question:how-to-spot-a-moving-scam", "service:interstate"],
    ["is this moving company legit", "verify moving company"],
  ),
  q(
    "what-if-a-mover-holds-my-belongings-hostage",
    "mover holding belongings hostage",
    "What If a Mover Holds My Belongings Hostage?",
    "What if a mover holds my belongings hostage?",
    "On a non-binding interstate estimate you owe no more than 110% at delivery; refusing delivery after that is a violation. Who to call and what to document.",
    "On an interstate move with a non-binding estimate, the mover must release your goods once you pay up to 110% of the estimate at delivery; a mover that refuses after that payment is violating federal rules. Pay the amount you owe, get a receipt, document the refusal, and report it to FMCSA by phone at 1-888-DOT-SAFT or through the National Consumer Complaint Database.",
    [
      { heading: "What you owe at delivery", blocks: [ul(["Binding estimate: the binding amount, plus services you asked for after the bill of lading.", "Non-binding estimate: up to 110% of the estimate, plus services added after the bill of lading and capped impracticable-operations charges."])] },
      { heading: "What to do", blocks: [ol(["Offer payment of what you owe in a form the estimate says the mover accepts, and keep proof.", "Write down dates, names, the truck's markings and what was said.", "Call FMCSA at 1-888-DOT-SAFT (8 a.m. to 8 p.m. Eastern) and file a complaint online.", "Contact your state attorney general or consumer protection office; many pursue hostage-goods cases."])] },
    ],
    ["rule_110", "complaints"],
    [{ question: "Does the 110% rule apply to moves within my state?", answer: "No. It is a federal rule for interstate moves. Your state's regulator sets the rules for in-state moves." }],
    ["question:what-is-the-110-percent-rule", "question:how-to-spot-a-moving-scam", "service:interstate"],
    ["moving company won't deliver", "hostage load"],
  ),
  q(
    "does-a-mover-need-insurance",
    "do movers have to have insurance",
    "Do Movers Have to Have Insurance?",
    "Do movers have to have insurance?",
    "Interstate household-goods carriers must file liability and cargo insurance with FMCSA; your own goods are covered by valuation, not insurance. What each filing means.",
    "Interstate household-goods carriers must have liability insurance and cargo insurance on file with FMCSA to hold operating authority, and brokers must file a $75,000 bond or trust. These filings protect the public and other shippers; your own belongings are covered by the mover's valuation liability (full value protection by default), which is not an insurance policy.",
    [
      { heading: "What must be on file", blocks: [{ type: "table", columns: ["Filing", "Who", "What it covers"], rows: [["Liability (BI&PD)", "Carriers", "Injury and property damage to others; a $750,000 minimum for carriers with vehicles of 10,001 lb or more"], ["Cargo", "Household-goods carriers", "$5,000 per vehicle, $10,000 per occurrence"], ["Surety bond or trust", "Brokers", "$75,000"], ["BOC-3", "Carriers and brokers", "Process agent in each state"]] }] },
      { heading: "Your belongings: valuation, not insurance", blocks: [p("The mover's liability for your goods is set by federal valuation rules: full value protection by default, or 60 cents per pound if you waive it in writing. A mover's claim that its insurance covers all your goods is one of FMCSA's red flags.")] },
    ],
    ["insurance_filings", "valuation", "red_flags"],
    [{ question: "How do I see a mover's insurance filings?", answer: "Ask the company for its USDOT or MC number when it contacts you, then check active filings in FMCSA's Licensing and Insurance system." }],
    ["question:what-is-full-value-protection", "service:interstate", "planning:moving-insurance-and-valuation-checklist"],
    ["moving company insurance requirements"],
  ),
  q(
    "how-much-do-local-movers-cost",
    "how much do local movers cost",
    "How Much Do Local Movers Cost? What Sets the Price",
    "How much do local movers cost?",
    "Local movers price by the hour per crew plus a travel fee. Where at least five network movers' rate cards cover a state, our cost pages show a dated range by home size.",
    "Local movers usually charge an hourly rate for a crew and truck plus a travel fee, so the price depends on your home size (which sets crew and hours), access at both ends and any extras such as packing. We publish a local range for a state only when at least five different movers' rate cards cover it; the [state cost pages](/moving-costs/) show the ranges that exist and say plainly where data is still missing.",
    [
      { heading: "What drives an hourly price", blocks: [ul(["Home size: more rooms mean a larger crew and more hours.", "Access: stairs, elevators, long carries and parking add time or tariff charges.", "Extras: packing, storage and specialty items are priced separately.", "Travel fee: a flat charge for the drive."])] },
      { heading: "How our ranges are built", blocks: [p("The cost model takes the median crew and hours the area's movers state for your home size, prices each mover on that job with its own hourly rate and travel fee, and shows the 25th to 75th percentile, rounded outward to $50. Ranges are planning figures from rate cards, never a quote. Movers set their own prices.")] },
    ],
    ["accessorials", "labor_wages"],
    [{ question: "Why does the calculator show no range for my state?", answer: "Fewer than five movers' rate cards cover that move type and home size in your state, or the cards are older than 12 months. A range resting on too few movers could mislead you, so we show none." }],
    ["service:local", "cost:local", "question:how-many-movers-do-i-need", "question:how-do-moving-companies-charge"],
    ["local moving cost", "cost of movers per hour"],
  ),
  q(
    "how-do-moving-companies-charge",
    "how do moving companies charge",
    "How Do Moving Companies Charge? Hourly vs Weight Pricing",
    "How do moving companies charge?",
    "Local moves: by the hour. Long-distance moves: by weight and distance band. Extras from the tariff. How estimates, weighing and the 110% rule fit together.",
    "Most movers charge local moves by the hour (crew size times hours, plus a travel fee) and long-distance moves by shipment weight and distance, with extra services priced from their tariff. On an interstate move, federal rules add a written estimate, a certified weighing when charges depend on weight, and the 110% cap at delivery on non-binding estimates.",
    [
      { heading: "Hourly pricing", blocks: [p("The mover sets a rate per crew size. Your home size sets the crew and the hours; access and extras change the hours. Federal rules don't address hourly pricing; it is used mainly on local, state-regulated moves.")] },
      { heading: "Weight-based pricing", blocks: [p("The mover sets a rate per hundredweight for each distance band and estimates your shipment weight from the survey. No federal rule requires weight-only pricing; a mover that estimates by volume must explain its conversion to weight in writing.")] },
      { heading: "Extras from the tariff", blocks: [p("Packing, stair carries, long carries, shuttles and elevator work are accessorial charges in the mover's tariff. An interstate mover must settle them with you before preparing the bill of lading.")] },
    ],
    ["volume_pricing", "weighing", "accessorials", "rule_110"],
    [{ question: "Can I see a mover's tariff?", answer: "An interstate carrier must keep its rates in a published tariff and make it available for inspection on reasonable request, and it must tell you before the bill of lading that the tariff is available." }],
    ["question:how-much-do-local-movers-cost", "question:what-is-a-binding-estimate", "cost:local", "cost:long-distance"],
    ["moving company pricing", "how movers charge"],
  ),
  q(
    "how-many-movers-do-i-need",
    "how many movers do i need",
    "How Many Movers Do I Need for My Home Size?",
    "How many movers do I need?",
    "Rate cards in our network state a typical crew per home size. What the medians say, and why larger crews can cost less per hour of your day.",
    "Movers in our network state a typical crew for each home size on their rate cards, and the cost model uses the median for the area. As a rule of thumb from those cards, studios and one-bedroom homes get two movers, two- and three-bedroom homes three, and homes with four or more bedrooms four, but each mover decides its own crew from the survey, access and your extras.",
    [
      { heading: "Why crew size changes the total", blocks: [p("A larger crew costs more per hour but finishes sooner, so the total for a big home can be similar or lower with more movers. Stairs, long carries and heavy items push movers toward a larger crew. The cost model prices each mover's hourly rate for the median crew, so the range already reflects typical crew choices.")] },
      { heading: "Labor-only help", blocks: [p("Some movers offer loading and unloading help without a truck, priced by the hour per mover. Only movers whose approved capabilities include the requested service can receive a matching request.")] },
    ],
    ["labor_wages"],
    [{ question: "Can I ask for a specific crew size?", answer: "Yes, ask each mover. The estimate should state the crew and hours it assumes." }],
    ["service:local", "question:how-much-do-local-movers-cost", "planning:moving-day-checklist"],
    ["how many movers for a 3 bedroom house"],
  ),
  q(
    "how-much-does-packing-cost",
    "how much does packing cost movers",
    "How Much Does Packing Cost When Movers Pack for You?",
    "How much does packing cost?",
    "Movers price packing per home size on their rate cards and add it to the move. Why a range with packing rests on fewer movers, and what to ask about materials.",
    "Movers in our network that offer packing price it per home size on their rate cards, and the cost model adds that price on top of the move itself for each mover that offers it. Because not every mover prices packing, a range with packing rests on fewer movers than one without, and when fewer than five price it the calculator shows no range and says why.",
    [
      { heading: "What usually changes the packing price", blocks: [ul(["Full versus partial packing.", "Materials: whether boxes, paper and tape are included.", "Fragile items that need crating.", "Unpacking at destination, usually separate."])] },
      { heading: "On an interstate move", blocks: [p("Packing is an accessorial service from the mover's tariff. The mover must settle it with you before preparing the bill of lading; otherwise it must deliver and may bill the extra only after 30 days.")] },
    ],
    ["accessorials"],
    [{ question: "Is packing cheaper if I buy the boxes?", answer: "Sometimes; ask whether the price includes materials. Movers may also limit claims for damage in boxes you packed yourself." }],
    ["service:packing", "planning:how-to-pack-for-a-move", "cost:local"],
    ["packing service cost"],
  ),
  q(
    "how-much-does-storage-cost-with-a-move",
    "how much does storage cost with movers",
    "How Much Does Storage Cost With a Move?",
    "How much does storage cost with a move?",
    "Network movers price storage per month by home size; the cost model counts one month. What storage-in-transit charges to ask about on an interstate move.",
    "Movers in our network that offer storage price it per month by home size, and the cost model adds one month when you select storage, keeping only movers that price it. Handling in and out of storage and a second delivery may be separate tariff charges, so ask each mover what the monthly price includes and when storage-in-transit converts to permanent storage.",
    [
      { heading: "What to ask", blocks: [ul(["Monthly price for your home size, and whether it is prorated.", "Handling charges in and out, and the cost of the second delivery.", "The storage-in-transit period and the terms that apply after it.", "Whether your valuation choice applies in storage."])] },
    ],
    ["accessorials", "valuation"],
    [{ question: "Is storage with a mover cheaper than a self-storage unit?", answer: "Not necessarily. A mover's storage includes handling by its crew and stays under its liability terms; self-storage means two extra loads. Compare the full cost for your gap, not the monthly price alone." }],
    ["service:storage", "cost:long-distance", "planning:moving-timeline-8-weeks"],
    ["storage in transit cost"],
  ),
  q(
    "can-a-mover-charge-more-than-the-estimate",
    "can movers charge more than the estimate",
    "Can Movers Charge More Than the Estimate?",
    "Can movers charge more than the estimate?",
    "Binding: no, except services you add. Non-binding: yes, but no more than 110% at delivery; the rest is billed later. What changes the bill.",
    "On a binding interstate estimate, no: the mover may collect only the binding amount plus services you asked for after the bill of lading and any impracticable-operations charges. On a non-binding estimate the final bill follows the tariff and can be higher, but you never pay more than 110% of the estimate at delivery, and the mover bills the remainder later.",
    [
      { heading: "What can lawfully raise the bill", blocks: [ul(["Goods or services added after the estimate (before loading, a new binding estimate or a written change is required).", "Impracticable operations, such as a shuttle truck, capped separately.", "Accessorial services settled before the bill of lading."])] },
      { heading: "What to keep", blocks: [p("Your signed, dated estimate, the inventory, the bill of lading, every weight ticket and every change you agreed to in writing. Disputes over charges billed after delivery can go to the mover's arbitration program.")] },
    ],
    ["binding_estimate", "rule_110", "accessorials", "arbitration"],
    [{ question: "What if the mover says I have more goods than estimated on moving day?", answer: "On a binding estimate the mover must reaffirm, prepare a new binding estimate you sign, or agree in writing to go non-binding before loading; if it loads without doing so, the original binding estimate stands. A sudden claim of extra goods is also an FMCSA red flag." }],
    ["question:what-is-a-binding-estimate", "question:what-is-the-110-percent-rule", "service:long-distance"],
    ["moving estimate higher than quoted"],
  ),
  q(
    "what-documents-should-a-mover-give-me",
    "moving documents checklist",
    "What Documents Should a Mover Give Me on an Interstate Move?",
    "What documents should a mover give me?",
    "Estimate, FMCSA booklets, tariff notice, arbitration and complaint summaries, bill of lading, inventory and weight tickets. What each is and when it arrives.",
    "On an interstate move the mover owes you, in order: a written estimate after the survey, FMCSA's \"Ready to Move?\" brochure and rights booklet with the estimate, notice that its tariff is available plus summaries of its arbitration program and complaint procedures before the bill of lading, the bill of lading itself at least three days before loading, an inventory at loading, and weight tickets when charges depend on weight.",
    [
      { heading: "Document by document", blocks: [{ type: "table", columns: ["Document", "When", "What to check"], rows: [["Written estimate", "After the survey", "Says binding or non-binding; signed and dated by both"], ["FMCSA booklets", "With the estimate", "Both titles, as copies or links"], ["Tariff notice, arbitration and complaint summaries", "Before the bill of lading", "Keep them with the estimate"], ["Bill of lading", "At least 3 days before loading", "Lists every service on the estimate; you may rescind within 3 days of signing"], ["Inventory", "At loading", "Condition notes you agree with"], ["Weight tickets", "Each weighing", "Empty and loaded weights, certified scale"]] }] },
    ],
    ["written_estimate", "booklets", "bill_of_lading", "weighing"],
    [{ question: "What happened to the order for service?", answer: "FMCSA's 2022 rule removed it because the bill of lading repeated it. The bill of lading is now your receipt and contract." }],
    ["question:what-is-a-binding-estimate", "planning:moving-out-of-state-checklist", "service:interstate"],
    ["bill of lading moving"],
  ),
  q(
    "what-is-a-bill-of-lading",
    "what is a bill of lading moving",
    "What Is a Bill of Lading in Moving?",
    "What is a bill of lading?",
    "The bill of lading is your receipt and contract with an interstate mover. It must reach you at least 3 days before loading, and you may rescind it within 3 days of signing.",
    "The bill of lading is your receipt and contract with an interstate mover. It must list the services on your estimate, among 17 required items, and the mover must give it to you to sign and date at least three days before the scheduled loading. You may rescind it without penalty within three days of signing. It is signed at origin and again at destination.",
    [
      { heading: "What it must contain", blocks: [p("Among its required items: the mover's name, address, USDOT and MC numbers, the estimate type, the valuation level you chose, the agreed pickup and delivery dates or spreads, the forms of payment accepted at delivery, and a statement that it takes in every service on the estimate.")] },
      { heading: "Before you sign", blocks: [ul(["Compare it line by line with the estimate.", "Check the delivery spread and what the mover owes if it misses it.", "Confirm your valuation choice matches the valuation statement."])] },
    ],
    ["bill_of_lading", "written_estimate"],
    [{ question: "Can a mover change the bill of lading on moving day?", answer: "A new estimate on moving day for added goods or services does not restart the three days. Changes before loading must be in writing and agreed by both sides." }],
    ["question:what-documents-should-a-mover-give-me", "service:interstate", "planning:moving-day-checklist"],
  ),
  q(
    "who-regulates-moving-companies",
    "who regulates moving companies",
    "Who Regulates Moving Companies? FMCSA and the States",
    "Who regulates moving companies?",
    "FMCSA regulates interstate movers under 49 CFR Part 375; states regulate in-state moves. Which state regulators we have sourced so far.",
    "FMCSA, part of the U.S. Department of Transportation, regulates interstate household-goods movers and brokers under 49 CFR Parts 371 and 375. Moves between two points in the same state are regulated by that state, and the rules differ: Texas (TxDMV), California (BHGS) and Florida (FDACS) license intrastate movers under their own statutes. Where we have no sourced regulator for a state, its page says so.",
    [
      { heading: "Federal: FMCSA", blocks: [p("FMCSA grants operating authority, keeps the USDOT and insurance records, publishes the consumer rights booklet, runs Protect Your Move and takes complaints through the National Consumer Complaint Database.")] },
      { heading: "State regulators we have sourced", blocks: [p("The [state pages](/movers/) carry a regulator section only when it rests on an official source read on a recorded date. Today that covers Texas, California, Florida and New York; other states' pages explain that we have not yet verified their regulator rather than guess.")] },
    ],
    ["interstate_scope", "complaints", "usdot_lookup"],
    [{ question: "Does FMCSA regulate my local move?", answer: "No, unless the route crosses another state. In-state moves follow state rules, which may cover licensing, estimates and tariffs." }],
    ["question:what-is-a-usdot-number", "service:local", "service:interstate", "movers:index"],
    ["moving company regulations"],
  ),
  q(
    "how-far-in-advance-should-i-book-movers",
    "how far in advance to book movers",
    "How Far in Advance Should I Book Movers?",
    "How far in advance should I book movers?",
    "What the interstate paperwork timeline requires (survey, estimate, bill of lading three days before loading) and why earlier requests give movers more room.",
    "Work backwards from the paperwork an interstate move requires: a survey, a written estimate, then a bill of lading in your hands at least three days before loading. That alone takes a week or more with most movers. We hold no booking data yet, so we can't say how early movers in a given area fill up; ask each mover how far out it is booking for your dates.",
    [
      { heading: "A timeline that fits the rules", blocks: [ol(["Request estimates from more than one mover with the same inventory.", "Hold the surveys and compare the written estimates on the same basis.", "Choose your valuation level and confirm the services.", "Receive and review the bill of lading at least three days before loading; you may rescind within three days of signing."])] },
      { heading: "What this site does", blocks: [p(`The survey checks your route and shows the number of eligible movers before you share contact details. You choose how many may contact you; each company identifies itself during contact. ${WHO_GETS} explains the steps.`)] },
    ],
    ["bill_of_lading", "written_estimate"],
    [{ question: "Is it cheaper to book early?", answer: "Movers set their own prices and we hold no seasonal or lead-time price data, so we can't say. Ask each mover whether your dates are priced differently." }],
    ["planning:moving-timeline-8-weeks", "planning:moving-out-of-state-checklist", "service:long-distance"],
    ["when to book movers"],
  ),
  q(
    "what-is-a-moving-tariff",
    "what is a moving tariff",
    "What Is a Moving Tariff?",
    "What is a moving tariff?",
    "An interstate carrier's tariff holds its rates and charges; it must be available for inspection on request. Why extras come from it and how to ask for it.",
    "A tariff is the document in which an interstate household-goods carrier publishes its rates and charges, including accessorial services such as packing, stair carries and shuttles. The carrier must make it available for inspection by shippers on reasonable request and must tell you before the bill of lading that it is available. A tariff that doesn't comply can't be enforced against you.",
    [
      { heading: "Why it matters on a non-binding estimate", blocks: [p("A non-binding estimate must say that the final charges come from the tariff and may be higher. The tariff is therefore the document that decides the extras and the final bill, within the 110% cap at delivery.")] },
      { heading: "Local moves", blocks: [p("States may require filed tariffs for in-state moves too; Texas uses filed maximum-rate tariffs and California publishes a Maximum Rate Tariff for in-state moves. Ask the mover which applies.")] },
    ],
    ["accessorials", "rule_110"],
    [{ question: "Can I ask for the tariff before I book?", answer: "Yes. The carrier must make it available on reasonable request." }],
    ["question:how-do-moving-companies-charge", "question:can-a-mover-charge-more-than-the-estimate", "service:interstate"],
  ),
  q(
    "what-happens-if-my-goods-are-damaged-in-a-move",
    "what to do if movers damage your stuff",
    "What Happens If My Goods Are Damaged in a Move?",
    "What happens if my goods are damaged in a move?",
    "Note it on the inventory, file a written claim, and know your valuation level. Interstate movers must offer arbitration for loss and damage disputes.",
    "On an interstate move the mover is liable under the valuation level you chose: replacement value under full value protection, or 60 cents per pound per article if you waived it in writing. Note damage on the inventory at delivery, file a written claim with the mover, and if you can't settle it, the mover's arbitration program is binding for claims of $10,000 or less when you ask for it.",
    [
      { heading: "Step by step", blocks: [ol(["At delivery, note every damaged or missing item on the inventory before you sign.", "Photograph the damage and keep packaging.", "File a written claim with the mover; ask for its claim form and deadline.", "If you can't agree, ask for arbitration under the program the mover summarized before the bill of lading."])] },
      { heading: "Items you packed yourself", blocks: [p("Movers commonly limit claims for damage inside boxes you packed to visible external damage. Ask how the mover treats packed-by-owner boxes before you choose what to pack.")] },
    ],
    ["valuation", "arbitration", "complaints"],
    [{ question: "Is there a deadline to file a claim?", answer: "The mover's tariff and bill of lading set the claim period. Ask for it in writing before the move." }],
    ["question:what-is-full-value-protection", "service:packing", "planning:moving-insurance-and-valuation-checklist"],
    ["moving damage claim"],
  ),
  q(
    "can-i-watch-my-shipment-being-weighed",
    "can i watch my shipment being weighed",
    "Can I Watch My Shipment Being Weighed?",
    "Can I watch my shipment being weighed?",
    "Yes: on a weight-based interstate move you may observe every weighing, must be told where and when, and may demand a reweigh before unloading. Source: 49 CFR 375.507-517.",
    "Yes. When a non-binding interstate estimate depends on weight, the mover must weigh the shipment on a certified scale, tell you where and when each weighing happens, and let you (or whoever pays) watch. Not attending counts as a waiver. For an origin-weighed shipment you may demand a reweigh after learning the billing weight and before unloading begins, and the charges then rest on the reweigh.",
    [
      { heading: "Origin weigh vs back weigh", blocks: [ul(["Origin weigh: empty truck weighed first, then loaded with your goods.", "Back weigh: loaded truck weighed first, then empty after unloading.", "Shipments of 3,000 pounds or less may be weighed on a certified platform or warehouse scale."])] },
      { heading: "Weight tickets", blocks: [p("Each weighing needs a weight ticket. Keep them with the bill of lading; they are the basis of a weight-based bill.")] },
    ],
    ["weighing"],
    [{ question: "Does a binding estimate require weighing?", answer: "No. A binding estimate doesn't depend on weight, so the weight of the shipment doesn't affect what you pay." }],
    ["question:how-do-moving-companies-charge", "question:what-is-a-binding-estimate", "service:long-distance"],
  ),
  q(
    "how-does-american-moving-choice-work",
    "how does american moving choice work",
    "How Does American Moving Choice Work?",
    "How does American Moving Choice work?",
    "A service, not a mover or broker: describe your move, check coverage, choose how many eligible movers may contact you, and send. Movers pay us for requests.",
    "American Moving Choice connects people planning a move with moving companies in our network. Describe your move, check route coverage, and choose how many eligible companies may contact you and through which channels. Companies introduce themselves when they reach out. We are not a moving company or a broker, and movers pay us for requests.",
    [
      { heading: "The four steps", blocks: [ol(["Tell us where you're moving from and to, when, and the size of your home.", "Check coverage and see the number of eligible movers before you share contact details.", "Choose how many may contact you, from one up to the number available, and which channels they may use.", "Review your move and contact permissions, then send. Companies introduce themselves when they contact you."])] },
      { heading: "What never changes with payment", blocks: [p(`What a mover pays never changes its screening result, its ratings, how its reviews are shown, or where it appears on this site. ${HOW_AMC} has the full statement; ${VERIFY} lists the checks every mover passes.`)] },
    ],
    [],
    [{ question: "Does it cost anything?", answer: "No. You pay us nothing. Movers in our network pay us for the requests they buy." }, { question: "Who can receive my details?", answer: "Only eligible movers recorded for your request that complete a purchase, never more than the maximum you choose and only through your permitted contact channels. Company names are introduced during contact." }],
    ["question:movers-vs-brokers-what-is-the-difference", "service:local", "service:long-distance", "movers:index"],
    ["american moving choice reviews"],
    "navigational" as unknown as CatalogEntry["intent"],
  ),
  q(
    "how-to-read-a-mover-fmcsa-record",
    "how to read fmcsa safer snapshot",
    "How to Read a Mover's FMCSA Record",
    "How to read a mover's FMCSA record",
    "USDOT status, operating authority status, authority type (carrier or broker), insurance filings and complaint history: what each line on SAFER and Protect Your Move means.",
    "A mover's FMCSA record has four parts worth reading: the USDOT status (ACTIVE, INACTIVE or OUT-OF-SERVICE), the operating authority status (authorized for household goods, or NOT AUTHORIZED), the authority type on each docket (common or contract carrier, or broker), and the insurance filings. Protect Your Move adds the complaint history. INACTIVE can result from a missed biennial update, and NOT AUTHORIZED means no interstate for-hire authority.",
    [
      { heading: "Line by line", blocks: [{ type: "table", columns: ["Line", "Where", "Reads well when"], rows: [["USDOT status", "SAFER company snapshot", "ACTIVE"], ["Operating authority status", "SAFER", "AUTHORIZED FOR HHG (household goods)"], ["Authority type", "Licensing and Insurance (L&I)", "Common or contract carrier of household goods; no broker authority if you want a carrier only"], ["Insurance", "L&I", "Liability and cargo filings active"], ["Complaints", "Protect Your Move", "History you can live with"]] }] },
      { heading: "Separate docket numbers", blocks: [p("Under FMCSA's Motus registration system, each newly granted authority gets its own docket number, so a company that holds carrier and broker authority can show two dockets. Read every docket linked to the USDOT number.")] },
    ],
    ["usdot_requirement", "usdot_lookup", "insurance_filings"],
    [{ question: "What does OUT-OF-SERVICE mean?", answer: "FMCSA has ordered the company to stop operating. Do not hire it until the order is lifted and the record shows ACTIVE." }],
    ["question:what-is-a-usdot-number", "question:movers-vs-brokers-what-is-the-difference", "question:how-to-check-if-a-moving-company-is-legitimate"],
    ["safer snapshot movers"],
  ),
  q(
    "what-is-an-intrastate-move",
    "what is an intrastate move",
    "What Is an Intrastate Move?",
    "What is an intrastate move?",
    "A move within one state. Beyond 50 miles it is in-state long distance on this site, priced by weight and regulated by the state, not FMCSA.",
    "An intrastate move starts and ends in the same state and its route stays inside it. On this site, an in-state move farther than the 50-mile local radius is classified as in-state long distance: movers price it by weight and band like an interstate move, but the state's rules apply rather than FMCSA's Part 375. A move within one state whose route crosses another state counts as interstate.",
    [
      { heading: "Local vs in-state long distance", blocks: [p("The local radius is 50 straight-line miles between ZIP centroids. Within it, movers' local coverage rules and hourly pricing apply; beyond it, in-state long-distance coverage and weight-based pricing apply. The route pages show the classification for each pair.")] },
      { heading: "State rules", blocks: [p("Some states license intrastate movers and set estimate or tariff rules; California, for example, allows hourly pricing only on moves under 100 miles within the state. Check the [state page](/movers/) for the regulators we have sourced.")] },
    ],
    ["interstate_scope"],
    [{ question: "Is a move from Dallas to Houston intrastate?", answer: "Yes: both are in Texas and the route stays in Texas. At more than 200 straight-line miles it is in-state long distance on this site." }],
    ["service:local", "service:long-distance", "question:who-regulates-moving-companies"],
  ),
  q(
    "do-movers-charge-for-stairs-and-long-carries",
    "do movers charge extra for stairs",
    "Do Movers Charge Extra for Stairs, Long Carries and Elevators?",
    "Do movers charge extra for stairs and long carries?",
    "Often yes: stair (flight) carries, long carries, shuttles and elevator work are accessorial charges in an interstate mover's tariff and must be settled before the bill of lading.",
    "Often, yes. Stair (\"flight\") carries, long carries between the truck and your door, shuttle service when the big truck can't reach your home, and elevator work are accessorial services priced in the mover's tariff. On an interstate move the mover must ask about and settle them before preparing the bill of lading; if it doesn't, it must deliver your goods and may bill the extras only after 30 days.",
    [
      { heading: "FMCSA's definitions", blocks: [ul(["Long carry: carrying articles excessive distances between the mover's vehicle and your residence.", "Shuttle service: a smaller vehicle used when the line-haul truck can't reach your home.", "Flight charge: carrying items up or down stairs."])] },
      { heading: "Tell the mover before the estimate", blocks: [p("Describe stairs, elevators, parking and the distance from the truck at both ends during the survey, so the charges appear on the estimate instead of as a surprise at delivery.")] },
    ],
    ["accessorials"],
    [{ question: "Can a shuttle be charged after the fact?", answer: "A shuttle the mover didn't know it would need can be an impracticable-operations charge, which is capped separately from the 110% rule. Describe access during the survey to avoid it." }],
    ["question:how-do-moving-companies-charge", "question:can-a-mover-charge-more-than-the-estimate", "service:local"],
  ),
  q(
    "what-is-a-moving-delivery-spread",
    "moving delivery window spread",
    "What Is a Delivery Spread on a Long-Distance Move?",
    "What is a delivery spread?",
    "A delivery spread is the range of dates the mover commits to on the bill of lading for a long-distance delivery. What to check and what reasonable dispatch means.",
    "A delivery spread is the range of dates an interstate mover commits to deliver within, written on the bill of lading instead of a single date, because long-distance shipments often share a truck. The mover must transport with reasonable dispatch; a missed spread can ground a delay claim. Check the spread, what the mover owes if it misses it, and how it will tell you the delivery day.",
    [
      { heading: "Questions to ask before you sign", blocks: [ul(["What is the earliest and latest delivery date?", "How much notice will I get before delivery?", "What happens if my home isn't ready: storage-in-transit charges?", "What does the mover pay if it misses the spread?"])] },
    ],
    ["bill_of_lading"],
    [{ question: "Can I get a guaranteed delivery date?", answer: "Some movers offer one for a charge from their tariff. It must appear on the estimate and the bill of lading." }],
    ["service:long-distance", "service:storage", "question:what-is-a-bill-of-lading"],
  ),
  q(
    "how-to-compare-moving-estimates",
    "how to compare moving quotes",
    "How to Compare Moving Estimates on the Same Basis",
    "How to compare moving estimates",
    "Same inventory, same services, same estimate type, same valuation. A checklist for lining up written estimates before you choose a mover.",
    "Compare estimates only when they rest on the same inventory, the same services, the same estimate type (binding or non-binding) and the same valuation level. A lower non-binding estimate can end higher than a binding one; a quote without a survey isn't an estimate you can rely on. Ask each mover for the written estimate after its survey and line them up item by item.",
    [
      { heading: "Line them up", blocks: [{ type: "table", columns: ["Check", "Why"], rows: [["Same inventory and access notes", "Weight and accessorials drive the price"], ["Binding or non-binding, stated", "Different guarantees"], ["Valuation level and its price", "Full value protection is priced in the tariff"], ["Services listed", "Packing, storage, specialty items"], ["Delivery spread", "Shared trucks and timing"], ["Forms of payment at delivery", "Must be on the estimate"]] }] },
      { heading: "What this site adds", blocks: [p("A request from our survey reaches only movers that cover your route, as many as you choose. The [cost calculator](/moving-cost-calculator/) shows a planning range from rate cards so you can judge estimates against the area's spread; it is not a quote.")] },
    ],
    ["written_estimate", "physical_survey", "valuation"],
    [{ question: "Is the lowest estimate the best?", answer: "Not by itself. FMCSA warns that an estimate that is too low can limit what the mover collects at delivery on a non-binding estimate, and a sight-unseen low number is a red flag." }],
    ["question:what-is-a-binding-estimate", "question:how-to-spot-a-moving-scam", "cost:long-distance", "planning:moving-out-of-state-checklist"],
    ["compare moving quotes"],
  ),
  q(
    "are-online-moving-quotes-accurate",
    "are online moving quotes accurate",
    "Are Online Moving Quotes Accurate?",
    "Are online moving quotes accurate?",
    "A sight-unseen online quote is FMCSA's first red flag. Why a range from rate cards is a planning figure and an estimate needs a survey.",
    "An online quote given sight unseen, with no survey of your goods, is FMCSA's first red flag, and on an interstate move the mover must survey your goods before a written estimate unless you waive the survey in writing. Online tools, including our cost calculator, give planning ranges, not quotes: ours shows the 25th to 75th percentile of what the area's movers would charge for a typical job, built from their rate cards.",
    [
      { heading: "Planning range vs estimate", blocks: [{ type: "table", columns: ["", "Planning range", "Written estimate"], rows: [["Based on", "Rate cards of at least five movers", "A survey of your goods"], ["Binding?", "No", "Binding or non-binding, as stated"], ["Who gives it", "A tool", "The mover that will do the move"]] }] },
    ],
    ["red_flags", "physical_survey"],
    [{ question: "Why does your calculator show a range and not a price?", answer: "Movers set their own prices, and American Moving Choice doesn't give estimates. A range from at least five movers' rate cards shows the spread you can expect; a single number would mislead." }],
    ["question:how-to-compare-moving-estimates", "question:does-a-mover-have-to-do-a-survey", "cost:local", "cost:long-distance"],
  ),
  q(
    "what-is-storage-in-transit",
    "what is storage in transit",
    "What Is Storage-in-Transit (SIT)?",
    "What is storage-in-transit?",
    "Storage the mover arranges as part of an interstate move, charged from its tariff, with a period after which the shipment converts to permanent storage.",
    "Storage-in-transit (SIT) is temporary storage the mover arranges as part of an interstate move, for example when your new home isn't ready on the delivery spread. Its charges come from the mover's tariff, the goods stay under the mover's liability terms, and after a set period the shipment converts to permanent storage under different terms. Ask for the SIT charges and the conversion period in writing before loading.",
    [
      { heading: "What to get in writing", blocks: [ul(["Daily or monthly SIT charges and handling in and out.", "The conversion period and the warehouse terms after it.", "Whether your valuation choice continues in SIT.", "The second delivery charge."])] },
    ],
    ["accessorials", "valuation"],
    [{ question: "Is SIT the same as the mover's storage service?", answer: "SIT is tied to an interstate move and its tariff. A mover's monthly storage service, as priced on rate cards here, may be under separate terms. Ask which applies." }],
    ["service:storage", "question:how-much-does-storage-cost-with-a-move", "service:long-distance"],
  ),
  q(
    "how-do-i-file-a-complaint-against-a-mover",
    "how to file a complaint against a moving company",
    "How Do I File a Complaint Against a Moving Company?",
    "How do I file a complaint against a moving company?",
    "Interstate movers and brokers: FMCSA's National Consumer Complaint Database or 1-888-DOT-SAFT. In-state moves: the state regulator or attorney general.",
    "For an interstate mover or broker, file with FMCSA through the National Consumer Complaint Database or by phone at 1-888-DOT-SAFT (1-888-368-7238), 8 a.m. to 8 p.m. Eastern, Monday to Friday. FMCSA uses complaints to decide which companies to investigate; a complaint doesn't replace a claim or legal action. For an in-state move, contact the state regulator where one exists, or the state attorney general.",
    [
      { heading: "What to include", blocks: [ul(["The mover's name, USDOT and MC numbers from your documents.", "Dates, the estimate type and amount, and what was charged.", "Copies of the estimate, bill of lading, inventory and weight tickets.", "What you want resolved."])] },
      { heading: "Movers in our network", blocks: [p("If a mover from this site treats you badly, [report a concern](/report-a-concern/) to us as well. We read every report and it can affect the mover's standing in the network; it does not replace your complaint to FMCSA.")] },
    ],
    ["complaints", "arbitration"],
    [{ question: "Will FMCSA get my money back?", answer: "FMCSA investigates and enforces; it doesn't adjudicate your claim. Use the mover's arbitration program or the courts for money claims." }],
    ["question:what-if-a-mover-holds-my-belongings-hostage", "question:what-happens-if-my-goods-are-damaged-in-a-move", "question:who-regulates-moving-companies"],
  ),
  q(
    "how-much-do-movers-make-per-hour",
    "how much do movers make per hour",
    "How Much Do Movers Make per Hour? BLS Wage Data as Cost Context",
    "How much do movers make per hour?",
    "BLS's May 2025 figure for hand laborers and material movers: a national median of $40,240 a year, about $19.35 an hour. Labor-cost context, not a moving price.",
    "The Bureau of Labor Statistics groups movers with hand laborers and freight, stock and material movers (SOC 53-7062). Its May 2025 Occupational Outlook Handbook entry gives a national median wage of $40,240 a year, about $19.35 an hour. That is labor-cost context only: a mover's hourly rate to you also covers the truck, fuel, insurance, equipment and the company's margin, which is why crew rates on rate cards sit well above the wage.",
    [
      { heading: "Why the hourly rate you pay is higher", blocks: [ul(["Truck, fuel and maintenance.", "Liability and cargo insurance filings and valuation claims.", "Equipment: dollies, pads, straps, boxes.", "Office, dispatch and the time between jobs."])] },
    ],
    ["labor_wages"],
    [{ question: "Should I tip movers?", answer: "Tipping is customary but not required and no rule sets an amount. We hold no data on it, so we don't suggest a figure." }],
    ["question:how-much-do-local-movers-cost", "question:how-many-movers-do-i-need", "cost:local"],
  ),
  q(
    "which-companies-receive-my-moving-request",
    "who gets my moving quote request",
    "Which Companies Receive My Moving Request on This Site?",
    "Which companies receive my moving request?",
    "Only eligible movers recorded for your request may purchase it, within the contact limit and channels you choose. Companies identify themselves during contact.",
    "Only eligible movers recorded for your request can receive your details, and never more than the maximum you choose. Before contact details are requested, the survey checks coverage and shows the number of eligible companies. Company names aren't displayed in the survey or confirmation; each company introduces itself when it contacts you.",
    [
      { heading: "How matching works", blocks: [ol(["Your origin and destination ZIP codes classify the move as local, in-state long distance or interstate.", "Each mover's include and exclude rules (states, counties, ZIP codes, move types, sizes, services) are checked against it.", "The survey shows an eligible count. You choose how many movers may contact you, from one up to the number available.", "Only eligible companies recorded for your request may purchase it. They introduce themselves when they contact you directly."])] },
      { heading: "Read the full explanation", blocks: [p(`${WHO_GETS} covers contact choices, withdrawal and what happens if no mover covers your move. ${HOW_AMC} explains who pays us.`)] },
    ],
    [],
    [{ question: "Can I withdraw after sending?", answer: "Yes. Your confirmation includes a link to manage or withdraw the request; movers that already bought it keep your details, and the page says so." }],
    ["question:how-does-american-moving-choice-work", "movers:index", "service:local"],
    [],
    "navigational" as unknown as CatalogEntry["intent"],
  ),
];

// ------------------------------------------------------------------ planning

const plan = (
  slug: string,
  primaryKeyword: string,
  title: string,
  h1: string,
  metaDescription: string,
  answer: string,
  sections: CatalogEntry["sections"],
  factTopics: string[],
  faq: FaqItem[],
  related: string[],
  supportingKeywords: string[] = [],
): CatalogEntry => ({ family: "planning", slug, primaryKeyword, intent: "informational", supportingKeywords, title, h1, metaDescription, answer, sections, factTopics, faq, related });

export const PLANNING: CatalogEntry[] = [
  plan(
    "moving-out-of-state-checklist",
    "moving out of state checklist",
    "Moving Out of State Checklist: Documents, Rules and Timing",
    "Moving out of state: a checklist built on the federal rules",
    "A step-by-step interstate moving checklist tied to what the mover owes you: survey, written estimate, booklets, bill of lading three days before loading, weighing and delivery.",
    "Moving out of state is an interstate move, so federal rules set the paperwork: a survey, a written estimate that says binding or non-binding, FMCSA's two booklets, a bill of lading at least three days before loading, certified weighing when charges depend on weight, and your valuation choice in writing. This checklist orders those steps and adds the practical ones around them.",
    [
      { heading: "Eight weeks out", blocks: [ul(["Decide what you will ship; weight drives the price on a long-distance move.", "Look up candidate movers' FMCSA records: active USDOT, household-goods carrier authority, insurance filings.", "Request estimates with the same inventory from several movers."])] },
      { heading: "Four to six weeks out", blocks: [ul(["Hold the surveys (on-site or by video).", "Compare written estimates on the same basis and choose binding or non-binding.", "Choose your valuation level on the valuation statement; list items worth more than $100 per pound.", "Confirm packing, storage and specialty items on the estimate."])] },
      { heading: "Two weeks out", blocks: [ul(["Receive the bill of lading at least three days before loading; you may rescind within three days of signing.", "Confirm the delivery spread and the forms of payment accepted at delivery.", "Describe access at both ends so stair, long-carry and shuttle charges are settled in advance."])] },
      { heading: "Loading and delivery", blocks: [ul(["Check the inventory and condition notes before signing.", "Ask where and when weighings happen; you may watch and demand a reweigh before unloading.", "At delivery, pay what you owe (no more than 110% on a non-binding estimate), note any damage on the inventory, and keep every document."])] },
    ],
    ["physical_survey", "written_estimate", "booklets", "bill_of_lading", "weighing", "valuation", "rule_110"],
    [{ question: "Do I need to register my car in the new state?", answer: "Most states set a deadline after you become a resident; the rules are the state's, and we have not sourced them for each state yet, so check the destination state's DMV." }],
    ["service:interstate", "service:long-distance", "question:what-documents-should-a-mover-give-me", "planning:moving-timeline-8-weeks", "cost:long-distance"],
    ["interstate moving checklist", "moving to another state checklist"],
  ),
  plan(
    "moving-timeline-8-weeks",
    "moving timeline",
    "8-Week Moving Timeline: What to Do and When",
    "An 8-week moving timeline",
    "A week-by-week moving timeline that fits the paperwork an interstate move requires and the practical steps for any move.",
    "Eight weeks is enough for the paperwork an interstate move requires and for the practical work of any move. The timeline below runs from choosing what to ship, through surveys and written estimates, to the bill of lading three days before loading and the delivery itself.",
    [
      { heading: "Weeks 8 to 7", blocks: [ul(["Inventory your home room by room and decide what goes.", "Check movers' FMCSA records and request estimates.", "Start a moving folder for every document."])] },
      { heading: "Weeks 6 to 5", blocks: [ul(["Hold surveys and receive written estimates.", "Choose a mover, the estimate type and your valuation level.", "Book storage if you need it; get storage-in-transit terms in writing."])] },
      { heading: "Weeks 4 to 3", blocks: [ul(["Start packing non-essentials; label boxes by room.", "Arrange utilities at both ends.", "Confirm parking and building access with both properties."])] },
      { heading: "Weeks 2 to 1", blocks: [ul(["Receive and review the bill of lading at least three days before loading.", "Confirm the delivery spread and the forms of payment.", "Pack a first-night box that travels with you."])] },
      { heading: "Moving day and after", blocks: [ul(["Check the inventory before signing.", "Keep weight tickets.", "At delivery, note damage on the inventory and file claims in writing."])] },
    ],
    ["written_estimate", "bill_of_lading"],
    [{ question: "What if I have less than eight weeks?", answer: "The legal steps compress: survey, estimate and a bill of lading three days before loading. Ask each mover how fast it can run them for your dates." }],
    ["planning:moving-out-of-state-checklist", "planning:moving-day-checklist", "planning:how-to-pack-for-a-move", "question:how-far-in-advance-should-i-book-movers"],
    ["moving checklist timeline"],
  ),
  plan(
    "moving-day-checklist",
    "moving day checklist",
    "Moving Day Checklist: What to Check Before the Truck Leaves",
    "Moving day checklist",
    "What to verify at loading: the crew and truck match the mover you hired, the inventory and condition notes, the bill of lading, access charges and weighing.",
    "On moving day, confirm the crew and truck belong to the mover you hired (a rental truck is an FMCSA red flag), read the inventory and condition notes before you sign, keep your copy of the bill of lading, and ask where and when the shipment will be weighed if charges depend on weight. Walk the empty home with the crew lead before the truck leaves.",
    [
      { heading: "Before the crew arrives", blocks: [ul(["Reserve parking or a loading zone.", "Set aside the documents and items that travel with you.", "Photograph high-value items and their condition."])] },
      { heading: "With the crew", blocks: [ul(["Check the USDOT number on the truck against your bill of lading.", "Read every inventory tag and condition note before signing.", "Confirm the delivery spread and the phone number for delivery notice.", "Ask about the weighing location and time."])] },
      { heading: "Before the truck leaves", blocks: [ul(["Walk every room, closet, attic and garage.", "Keep your copies of the inventory and bill of lading.", "Note the departure time."])] },
    ],
    ["red_flags", "weighing", "bill_of_lading"],
    [{ question: "Should I sign a blank inventory?", answer: "Never. A request to sign blank documents is an FMCSA red flag." }],
    ["planning:moving-timeline-8-weeks", "planning:delivery-day-checklist", "question:can-i-watch-my-shipment-being-weighed"],
  ),
  plan(
    "delivery-day-checklist",
    "moving delivery day checklist",
    "Delivery Day Checklist: Payment, Inventory and Damage",
    "Delivery day checklist",
    "What you owe at delivery, how to check the inventory for loss or damage, and how to start a claim, built on the 110% rule and valuation rules.",
    "At delivery, pay what the estimate type requires (the binding amount, or no more than 110% of a non-binding estimate), in a form the estimate says the mover accepts. Check every inventory item off as it comes in, note damage or missing items on the inventory before you sign, and keep the signed copy: it is the basis of any claim under the valuation level you chose.",
    [
      { heading: "Payment", blocks: [ul(["Binding estimate: the binding amount plus services added after the bill of lading.", "Non-binding estimate: up to 110% of the estimate; the rest is billed later.", "Keep the receipt and the final freight bill."])] },
      { heading: "Inventory and damage", blocks: [ul(["Check items off against the inventory as they come in.", "Open boxes marked fragile while the crew is present if you can.", "Write every exception on the inventory before signing.", "Photograph damage and keep packaging for the claim."])] },
      { heading: "After delivery", blocks: [ul(["File a written claim with the mover within its deadline.", "If charges were billed after delivery, you may dispute them through the mover's arbitration program."])] },
    ],
    ["rule_110", "valuation", "arbitration"],
    [{ question: "Can I refuse delivery if the bill is wrong?", answer: "Pay what the rules require and dispute the rest. Refusing payment of the amount due lets the mover hold the goods; paying the capped amount obliges it to deliver." }],
    ["planning:moving-day-checklist", "question:what-happens-if-my-goods-are-damaged-in-a-move", "question:what-is-the-110-percent-rule"],
  ),
  plan(
    "how-to-pack-for-a-move",
    "how to pack for a move",
    "How to Pack for a Move: Order, Labeling and What Not to Pack",
    "How to pack for a move",
    "Pack room by room from least used to most used, label by room and contents, keep documents and valuables with you, and know how movers treat boxes you packed.",
    "Pack from the rooms you use least to the ones you use most, label every box with its room and a short contents line, keep documents, medication and valuables with you, and remember that movers commonly limit claims for damage inside boxes you packed yourself to visible external damage. On an interstate move, items worth more than $100 per pound need written notice to the mover.",
    [
      { heading: "Order of work", blocks: [ol(["Storage areas, garage and seasonal items.", "Books, decor and spare rooms.", "Kitchen (last week), leaving a few days' essentials.", "Bedrooms and bathrooms, the final two days."])] },
      { heading: "What not to pack for the mover", blocks: [ul(["Documents, medication, keys, chargers and valuables: they travel with you.", "Hazardous items (fuel, propane, paint, aerosols): most movers refuse them; ask for the mover's list.", "Perishables."])] },
      { heading: "If the mover packs", blocks: [p("Full or partial packing is priced per home size on rate cards. Ask which materials are included and how the crew documents what it packed; boxes the mover packs are covered under your valuation level without the packed-by-owner limit.")] },
    ],
    ["valuation", "accessorials"],
    [{ question: "Do movers supply boxes?", answer: "Some include materials with packing; others sell them. Ask before the estimate so it appears there." }],
    ["service:packing", "question:how-much-does-packing-cost", "planning:moving-timeline-8-weeks"],
  ),
  plan(
    "moving-insurance-and-valuation-checklist",
    "moving insurance checklist",
    "Moving Insurance and Valuation Checklist",
    "Moving insurance and valuation: a checklist",
    "Choose your valuation level in writing, declare high-value items, and know the difference between the mover's liability and third-party moving insurance.",
    "Before an interstate move, choose your valuation level on the valuation statement: full value protection (the default, priced in the mover's tariff) or released value at 60 cents per pound (free, by written waiver). Declare items worth more than $100 per pound in writing. Valuation is the mover's liability under federal law; third-party moving insurance is a separate product that may cover what valuation doesn't.",
    [
      { heading: "Checklist", blocks: [ol(["Read the valuation statement that comes with the estimate.", "Decide full value protection or released value, and sign your choice.", "List items worth more than $100 per pound on the high-value inventory.", "Ask what the mover's liability excludes (packed-by-owner boxes, pre-existing damage).", "If you want more cover, ask a third-party insurer what it adds.", "Keep the bill of lading: it records the valuation choice and any charges."])] },
    ],
    ["valuation", "red_flags"],
    [{ question: "Does my homeowner's policy cover a move?", answer: "Some policies cover goods in transit in part; it is the insurer's rule, not a moving rule. Ask your insurer in writing." }],
    ["question:what-is-full-value-protection", "question:does-a-mover-need-insurance", "service:specialty"],
  ),
  plan(
    "how-to-choose-a-moving-company",
    "how to choose a moving company",
    "How to Choose a Moving Company: Records, Documents and Estimates",
    "How to choose a moving company",
    "Check the FMCSA record, insist on a survey and written estimate, compare on the same basis, read the valuation statement, and keep every document.",
    "Choose a mover on its record and its paperwork, not its price alone: an active USDOT number with household-goods carrier authority and insurance filings, a survey before a written estimate that says binding or non-binding, a valuation statement you understand, and a bill of lading you receive three days before loading. Then compare estimates on the same inventory and services.",
    [
      { heading: "Five questions to ask every mover", blocks: [ol(["What are your USDOT and MC numbers, and do you hold carrier authority only?", "Will you survey my goods before the estimate, and is the estimate binding?", "What valuation levels do you offer and what does full value protection cost?", "What accessorial charges apply to my access, and are they on the estimate?", "What is the delivery spread and what do you owe if you miss it?"])] },
      { heading: "How this site helps", blocks: [p(`Every mover in our network must pass the federal checks in ${VERIFY}. Our survey checks coverage, shows the eligible count and lets you choose how many movers may contact you. Companies introduce themselves during contact. ${HOW_AMC} explains our paid relationship with movers.`)] },
    ],
    ["usdot_requirement", "written_estimate", "valuation", "bill_of_lading"],
    [{ question: "Should I pick the mover with the most reviews?", answer: "Reviews describe experiences; they don't replace the FMCSA record. On this site, no rating sort gives priority to a mover with fewer than five eligible reviews." }],
    ["question:how-to-check-if-a-moving-company-is-legitimate", "question:how-to-compare-moving-estimates", "question:how-to-spot-a-moving-scam", "movers:index"],
    ["choosing a mover"],
  ),
  plan(
    "moving-with-pets-checklist",
    "moving with pets checklist",
    "Moving With Pets: A Practical Checklist",
    "Moving with pets: a checklist",
    "Movers don't transport animals. How to plan a pet's move day, what to keep with you, and what to arrange before an interstate move.",
    "Household-goods movers don't transport animals, so a pet's move is yours to plan: a safe room or a sitter on loading day, carriers and records that travel with you, and, for an interstate move, the destination state's animal entry rules, which we have not sourced here and which you should check with that state's agriculture or veterinary agency.",
    [
      { heading: "Checklist", blocks: [ul(["Keep pets in a closed room or with a sitter while the crew works; open doors and strangers are the risk.", "Pack a pet bag: food, water, bowls, medication, records, leash and a familiar blanket.", "Update microchip and tag details with the new address.", "Ask the destination state about entry requirements for your animal; rules differ and we haven't verified them.", "On arrival, set up one quiet room first."])] },
    ],
    [],
    [{ question: "Can the mover carry my fish tank?", answer: "The tank, drained and packed, may count as a specialty item; the fish travel with you. Ask the mover how it packs tanks." }],
    ["planning:moving-day-checklist", "planning:moving-timeline-8-weeks", "service:specialty"],
  ),
  plan(
    "moving-a-piano-checklist",
    "how to move a piano",
    "Moving a Piano: What to Arrange With the Mover",
    "Moving a piano: a checklist",
    "Tell the mover the type and location of the piano at the survey, confirm the specialty charge on the estimate, and plan stairs and access at both ends.",
    "A piano is a specialty item: tell the mover its type (upright, baby grand, grand), its location and the stairs or turns at both ends during the survey, so the specialty charge and any stair or long-carry charges appear on the written estimate. Confirm who disassembles and reassembles a grand, how it is padded and crated, and whether the mover tunes after delivery (most don't).",
    [
      { heading: "Checklist", blocks: [ol(["Measure the piano and every doorway, stair and turn on its path.", "Photograph it and note existing marks on the inventory.", "Ask whether the mover uses its own crew or a specialist, and whether the specialist's charge is on the estimate.", "Declare its value if it exceeds $100 per pound.", "Plan a few weeks before tuning at destination; movement affects pitch."])] },
    ],
    ["accessorials", "valuation"],
    [{ question: "Do all movers in the network move pianos?", answer: "No. Each mover lists whether it offers specialty items; only those receive a request that asks for them." }],
    ["service:specialty", "question:do-movers-charge-for-stairs-and-long-carries", "planning:moving-day-checklist"],
  ),
  plan(
    "moving-a-safe-or-gun-safe",
    "how to move a gun safe",
    "Moving a Safe or Gun Safe: Weight, Equipment and Charges",
    "Moving a safe or gun safe: a checklist",
    "Safes are specialty items by weight. What to tell the mover, how stair and access charges apply, and how to document contents and value.",
    "A safe is a specialty item because of its weight: tell the mover the make, weight and location at the survey so the specialty charge, crew size and any stair-climbing equipment appear on the written estimate. Empty it before moving day, keep the contents with you, and if the safe's value exceeds $100 per pound, declare it in writing under full value protection.",
    [
      { heading: "Checklist", blocks: [ul(["Find the manufacturer's weight; crews plan equipment by it.", "Describe stairs, thresholds and floor type at both ends.", "Empty the safe; firearms and valuables travel with you under your own state's rules.", "Confirm whether the mover bolts it down at destination (usually not)."])] },
    ],
    ["accessorials", "valuation"],
    [{ question: "Will movers carry a loaded safe?", answer: "Most refuse any safe with contents, and firearms are never shipped as household goods. Empty it." }],
    ["service:specialty", "planning:moving-a-piano-checklist", "question:do-movers-charge-for-stairs-and-long-carries"],
  ),
  plan(
    "moving-from-an-apartment-checklist",
    "moving out of an apartment checklist",
    "Moving From an Apartment: Elevators, Loading Zones and Charges",
    "Moving from an apartment: a checklist",
    "Elevator reservations, certificates of insurance, loading zones and the access charges that apply. What to arrange with the building and the mover.",
    "Apartment moves add building rules: an elevator reservation, often a certificate of insurance the building requires from the mover, a loading zone or permit, and the access charges (elevator, long carry, stair) that an interstate mover must settle before the bill of lading. Ask the building for its moving rules first, then give them to the mover at the survey.",
    [
      { heading: "Checklist", blocks: [ol(["Get the building's move-out rules: hours, elevator booking, insurance certificate, deposits.", "Give the mover the elevator time and the distance from the truck to the door.", "Reserve the loading zone or ask the mover whether it handles permits.", "Confirm elevator and long-carry charges on the estimate.", "Schedule the final inspection with the landlord after the truck leaves."])] },
    ],
    ["accessorials"],
    [{ question: "What is a certificate of insurance?", answer: "A document from the mover's insurer naming the building as a certificate holder. Buildings ask for it to confirm coverage; ask the mover for it a week ahead." }],
    ["planning:moving-day-checklist", "question:do-movers-charge-for-stairs-and-long-carries", "service:local"],
  ),
  plan(
    "moving-with-children-checklist",
    "moving with kids checklist",
    "Moving With Children: A Practical Checklist",
    "Moving with children: a checklist",
    "School records, a child-safe moving day, and a first-night plan. Practical steps that keep the paperwork on track.",
    "Moving with children adds two tracks to the paperwork of the move itself: school and medical records at both ends, and a plan that keeps children away from the loading and delivery work. Arrange childcare or a closed room on moving day, pack each child's essentials to travel with you, and set up their rooms first at destination.",
    [
      { heading: "Checklist", blocks: [ul(["Request school records and ask the new school what it needs to enroll.", "Transfer medical and dental records; refill prescriptions.", "Let children pack a box of their own and label it.", "On moving day, keep them with a sitter or in a closed room; crews move fast and doors stay open.", "Set up beds and one familiar room first at delivery."])] },
    ],
    [],
    [{ question: "Does the mover help set up furniture?", answer: "Reassembly of beds and basic furniture is common; ask the mover what its estimate includes." }],
    ["planning:moving-timeline-8-weeks", "planning:moving-day-checklist", "planning:how-to-pack-for-a-move"],
  ),
  plan(
    "downsizing-before-a-move",
    "downsizing before a move",
    "Downsizing Before a Move: Why Weight Decides the Price",
    "Downsizing before a move",
    "On a long-distance move the price follows weight, so every item you don't ship saves money. A method for deciding what goes.",
    "On a long-distance move the price follows shipment weight and distance, so downsizing is the one lever you fully control: every box you don't ship lowers the weight the mover charges for. Decide room by room using replacement cost against moving cost, hold the survey after you have downsized so the estimate reflects what actually ships, and donate or sell early.",
    [
      { heading: "A method", blocks: [ol(["List heavy, low-value items first: old furniture, books you won't reread, appliances the new home has.", "Compare replacement cost at destination against the weight it adds.", "Downsize before the survey, so the written estimate reflects the real shipment.", "Keep an inventory of what you sold or donated for your own records."])] },
      { heading: "Why the survey timing matters", blocks: [p("A non-binding estimate rests on the surveyed weight; a binding one on the surveyed inventory. Downsizing after the survey can leave the estimate higher than the move; downsizing before it keeps the estimate honest.")] },
    ],
    ["weighing", "written_estimate"],
    [{ question: "Will the mover weigh less if I pack lighter?", answer: "On a weight-based non-binding estimate, the certified weighing decides the charge, so yes: less shipped is less charged." }],
    ["service:long-distance", "question:how-do-moving-companies-charge", "planning:how-to-pack-for-a-move"],
  ),
  plan(
    "change-of-address-checklist",
    "change of address checklist",
    "Change of Address Checklist for a Move",
    "Change of address checklist",
    "Who to notify and in what order: postal forwarding, financial, government, utilities, subscriptions. The mover-related items you must not forget.",
    "Change your address in layers: postal forwarding first, then financial institutions, government agencies (tax, voter registration, driver's license where the state requires it), utilities at both ends, employers and subscriptions. For the move itself, give the mover your destination contact details and confirm the delivery address on the bill of lading matches.",
    [
      { heading: "Checklist", blocks: [ul(["Postal forwarding, dated to your move.", "Banks, cards, insurers and lenders.", "Tax agencies and voter registration.", "Driver's license and vehicle registration, on the destination state's timeline (not sourced here; check its DMV).", "Utilities and internet at both ends.", "Employer, schools, doctors and pharmacies.", "The mover: destination address and your phone number for delivery notice."])] },
    ],
    ["bill_of_lading"],
    [{ question: "How long does postal forwarding last?", answer: "The postal service sets the periods by mail class; check its current rules, which we have not sourced here." }],
    ["planning:moving-timeline-8-weeks", "planning:moving-out-of-state-checklist"],
  ),
  plan(
    "moving-in-winter-or-bad-weather",
    "moving in winter tips",
    "Moving in Winter or Bad Weather: What to Arrange",
    "Moving in winter or bad weather",
    "Weather doesn't change the rules, but it changes access, delivery spreads and floor protection. What to settle with the mover in advance.",
    "Weather doesn't change the federal paperwork, but it changes access and timing: cleared paths and parking, floor protection, and a delivery spread that allows for road closures. Settle with the mover in advance what happens if weather delays loading or delivery, and whether storage-in-transit charges apply if your delivery slips. We hold no seasonal price data, so ask each mover how it prices your dates.",
    [
      { heading: "Checklist", blocks: [ul(["Clear and salt walkways; the crew won't carry over ice.", "Ask for floor runners and door protection.", "Protect electronics and liquids from freezing in the truck.", "Confirm in writing what the mover does if weather delays the spread.", "Keep a bad-weather bag with you."])] },
    ],
    ["bill_of_lading", "accessorials"],
    [{ question: "Is winter cheaper for moving?", answer: "Movers set their own prices and we have no seasonal data yet, so we don't claim it. Ask each mover whether your dates are priced differently." }],
    ["planning:moving-day-checklist", "question:what-is-a-moving-delivery-spread", "service:long-distance"],
  ),
  plan(
    "what-movers-will-not-move",
    "what movers won't move",
    "What Movers Will Not Move: Hazardous, Perishable and Personal Items",
    "What movers will not move",
    "Fuel, propane, paint, aerosols, perishables, plants on long moves, pets, and your documents and valuables. Why, and what to do with them.",
    "Movers refuse hazardous items (fuel, propane, paint, aerosols, fireworks, chemicals), usually refuse perishables and often plants on long-distance moves, never carry pets, and advise you to keep documents, cash, jewelry and medication with you. Each mover publishes its own list; ask for it at the survey so nothing is left on the curb on moving day.",
    [
      { heading: "Typical non-allowables", blocks: [{ type: "table", columns: ["Category", "Examples", "What to do"], rows: [["Hazardous", "Gasoline, propane tanks, paint, aerosols, fireworks, pool chemicals", "Use up, give away or dispose of under local rules"], ["Perishable", "Frozen and refrigerated food, open containers", "Eat, donate or discard"], ["Living", "Pets, plants on long moves", "Travel with you; check destination state rules"], ["Personal", "Documents, cash, jewelry, medication, keys", "Travel with you"]] }] },
    ],
    ["valuation"],
    [{ question: "Can I pack a propane grill?", answer: "The grill yes, the tank no. Empty and disconnect the tank and dispose of or exchange it." }],
    ["planning:how-to-pack-for-a-move", "planning:moving-with-pets-checklist", "service:packing"],
  ),
  plan(
    "moving-a-home-office-or-small-business",
    "moving a home office",
    "Moving a Home Office: Equipment, Records and Downtime",
    "Moving a home office",
    "Household-goods rules cover your home office contents; office moves get no cost range. How to protect equipment and data and plan downtime.",
    "A home office moves with your household goods under the same rules, but the cost model gives no range for office moves (only for the five home sizes), so ask movers for a written estimate after a survey. Back up data before packing, move drives and documents yourself, photograph cable setups, and plan for the downtime between loading and delivery.",
    [
      { heading: "Checklist", blocks: [ul(["Back up every device; carry drives and critical documents with you.", "Photograph cabling and label cords.", "Ask the mover how it packs monitors and printers.", "Declare high-value equipment in writing.", "Arrange internet at destination before delivery day."])] },
    ],
    ["valuation", "accessorials"],
    [{ question: "Is a small business move different?", answer: "A commercial move is outside household-goods rules and outside this site's survey, which is for household moves." }],
    ["planning:how-to-pack-for-a-move", "service:packing", "question:what-is-full-value-protection"],
  ),
  plan(
    "moving-a-car-with-a-household-move",
    "shipping a car when moving",
    "Moving a Car With a Household Move",
    "Moving a car with a household move",
    "Vehicle transport is a separate service some movers offer. What to arrange and why it isn't part of the household-goods estimate.",
    "Vehicle transport is a separate service: some movers offer it, and it is priced and documented apart from your household-goods estimate. Confirm directly with a company that contacts you whether it offers this service, who carries the car, the pickup and delivery windows, the condition report at both ends and the liability terms, in writing.",
    [
      { heading: "Checklist", blocks: [ul(["Ask whether the mover carries vehicles itself or arranges a carrier.", "Get the vehicle's pickup and delivery windows separately from the household delivery spread.", "Photograph the car and sign a condition report at pickup and delivery.", "Keep the fuel low and remove personal items unless the carrier allows them.", "Confirm liability terms for the vehicle in writing."])] },
    ],
    [],
    [{ question: "Is car shipping included in the cost calculator?", answer: "No. The calculator prices household goods only. Vehicle transport is quoted separately by movers that offer it." }],
    ["service:long-distance", "planning:moving-out-of-state-checklist"],
  ),
  plan(
    "first-night-box-checklist",
    "first night box moving",
    "First-Night Box Checklist",
    "First-night box checklist",
    "What to pack in the box that travels with you so the first night at destination doesn't depend on the truck's delivery spread.",
    "On a long-distance move your goods may arrive days after you do, so pack a first-night box (or bag) that travels with you: bedding, toiletries, a change of clothes, chargers, basic tools, medication, documents and a day of food. It keeps the first night independent of the delivery spread.",
    [
      { heading: "The box", blocks: [ul(["Bedding or sleeping bags, pillows, towels.", "Toiletries, medication, glasses.", "Chargers, a power strip, a flashlight.", "Box cutter, screwdriver, tape, trash bags.", "Paper plates, a kettle or pot, snacks and water.", "Documents: the bill of lading, inventory, IDs, keys."])] },
    ],
    ["bill_of_lading"],
    [{ question: "Should the first-night box go on the truck?", answer: "No. It defeats the purpose if it arrives with the shipment. Carry it with you." }],
    ["planning:how-to-pack-for-a-move", "planning:delivery-day-checklist", "question:what-is-a-moving-delivery-spread"],
  ),
  plan(
    "moving-to-a-new-state-first-30-days",
    "moving to a new state what to do first",
    "Moving to a New State: The First 30 Days",
    "Moving to a new state: the first 30 days",
    "After delivery: claims, address changes, driver's license and registration deadlines (state rules, check the DMV), and the records to keep from the move.",
    "In the first 30 days after an interstate move, file any damage claims in writing with the mover, finish address changes, and handle the destination state's deadlines for a driver's license and vehicle registration, which the state sets and we have not sourced for each state. Keep the bill of lading, inventory and weight tickets: charges billed after delivery and claims both rest on them.",
    [
      { heading: "Week 1", blocks: [ul(["Check every box against the inventory; note damage and file a written claim.", "Confirm utilities and internet.", "Photograph the delivered condition of high-value items."])] },
      { heading: "Weeks 2 to 4", blocks: [ul(["Driver's license and vehicle registration, on the state's timeline (check its DMV).", "Voter registration, if you intend to vote there.", "Doctors, pharmacy, schools.", "Review any post-delivery bill from the mover against the tariff and the 110% rule."])] },
    ],
    ["rule_110", "arbitration", "valuation"],
    [{ question: "How long do I have to claim damage?", answer: "The mover's tariff and bill of lading set its claim period. Ask for it before the move and file early." }],
    ["planning:delivery-day-checklist", "planning:change-of-address-checklist", "question:what-happens-if-my-goods-are-damaged-in-a-move"],
  ),
  plan(
    "moving-with-a-storage-gap",
    "moving with storage in between",
    "Moving With a Storage Gap Between Homes",
    "Moving with a storage gap between homes",
    "When closing dates don't line up: mover storage vs self-storage, storage-in-transit terms, and how valuation applies in between.",
    "When your move-out and move-in dates don't line up, you can have the mover hold your goods (storage-in-transit on an interstate move, or its monthly storage service) or rent self-storage and move twice. The mover's option keeps one load and one liability chain; self-storage means two loads. Get the storage charges, the conversion period and the second-delivery charge in writing before loading.",
    [
      { heading: "Compare the two", blocks: [{ type: "table", columns: ["", "Mover's storage", "Self-storage"], rows: [["Loads", "One", "Two"], ["Liability", "Mover's valuation terms continue (confirm in writing)", "Your own insurance"], ["Access", "Usually none until delivery", "Yours"], ["Price basis", "Monthly by home size on rate cards, plus handling", "Unit rent plus a second move"]] }] },
    ],
    ["accessorials", "valuation"],
    [{ question: "Does the cost model price storage?", answer: "It adds one month of a mover's storage price when you select storage, keeping only movers that price it. Longer gaps are between you and the mover." }],
    ["service:storage", "question:what-is-storage-in-transit", "question:how-much-does-storage-cost-with-a-move"],
  ),
];

export const CATALOG: CatalogEntry[] = [...SERVICES, ...QUESTIONS, ...PLANNING];

export function catalogEntry(family: CatalogEntry["family"], slug: string): CatalogEntry | null {
  return CATALOG.find((e) => e.family === family && e.slug === slug) ?? null;
}

/**
 * The facts registry seed (site architecture §6.2): every regulatory or official claim a
 * programmatic page may make, with its primary source and the date it was read. Taken from
 * docs/research/content-claims/consumer-moving-rules.md (claims C1-C20, 2026-10-28) and
 * docs/research/compliance-and-platform-facts.md §1-§2 (2026-10-27). Nothing here is invented:
 * a state without a sourced regulator row gets no regulator claim on its page, and the page says
 * so. Rows marked verify=true carry the research note's "[Verify]" flag and render with it.
 */

export interface FactSeed {
  scope: string; // national | state:XX
  topic: string;
  claim: string;
  sourceLabel: string;
  sourceUrl: string;
  accessedOn: string;
  verify?: boolean;
}

const FMCSA = "2026-10-28";

export const NATIONAL_FACTS: FactSeed[] = [
  {
    scope: "national",
    topic: "interstate_scope",
    claim:
      "FMCSA's household-goods rules (49 CFR Part 375) cover interstate moves, including a move between two points in one state whose route passes through another state. Moves whose entire route stays within one state are generally regulated by that state.",
    sourceLabel: "FMCSA, What is an interstate move?",
    sourceUrl: "https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/are-you-moving/what-interstate-move",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "written_estimate",
    claim:
      "Before an interstate mover signs the bill of lading with you, it must give a written estimate of the total charges that says whether it is binding or non-binding. Both sides sign it and you get a dated copy.",
    sourceLabel: "49 CFR 375.401",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "physical_survey",
    claim:
      "Since 2022 an interstate mover must survey your goods before giving a written estimate, on-site or by video, unless you waive the survey in a signed writing before loading. The old 50-mile exception no longer applies.",
    sourceLabel: "49 CFR 375.103 and 375.401(a)",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-A/section-375.103",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "binding_estimate",
    claim:
      "A binding estimate guarantees the total cost for the goods and services it lists. A mover may charge for preparing a binding estimate; it may not charge for a non-binding one.",
    sourceLabel: "49 CFR 375.401(b) and 375.403",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.403",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "rule_110",
    claim:
      "On a non-binding estimate, the mover must release your goods at delivery once you pay up to 110% of the estimate (plus services requested after the bill of lading and impracticable-operations charges of no more than 15% of all other charges due at delivery). FMCSA guidance says the mover bills any remaining balance no sooner than 30 days after delivery.",
    sourceLabel: "49 CFR 375.407 (Cornell LII mirror)",
    sourceUrl: "https://www.law.cornell.edu/cfr/text/49/375.407",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "weighing",
    claim:
      "When a non-binding interstate estimate depends on weight, the mover must weigh the shipment on a certified scale, you may watch every weighing, and for an origin-weighed shipment you may demand a reweigh before unloading begins.",
    sourceLabel: "49 CFR 375.507 to 375.517",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-E/subject-group-ECFR78413e1c7c06a47/",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "valuation",
    claim:
      "Full value protection is the default liability level on an interstate move: the mover is liable for the replacement value of goods lost or damaged, up to the declared value, unless you waive it in writing. With a written waiver, liability drops to the released rate of no more than 60 cents per pound per article, at no extra charge.",
    sourceLabel: "49 U.S.C. 14706(f) (Cornell LII)",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/49/14706",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "booklets",
    claim:
      "With the written estimate, an interstate mover must give you FMCSA's \"Ready to Move?\" brochure and the \"Your Rights and Responsibilities When You Move\" booklet, as copies or links, plus notice that its tariff is available and summaries of its arbitration program and complaint procedures.",
    sourceLabel: "49 CFR 375.213",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-B/subject-group-ECFR26b58a956b3b018/section-375.213",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "bill_of_lading",
    claim:
      "The bill of lading is your receipt and contract. The mover must give it to you to sign at least 3 days before the scheduled loading, and you may rescind it without penalty within 3 days of signing.",
    sourceLabel: "49 CFR 375.505",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-E/subject-group-ECFR678dd6dec294449/section-375.505",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "arbitration",
    claim:
      "Interstate movers must offer a neutral arbitration program for loss, damage and post-delivery charge disputes. It is binding for claims of $10,000 or less if you ask for arbitration; above $10,000 only if the mover also agrees.",
    sourceLabel: "49 CFR 375.211 and 49 U.S.C. 14708",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-B/subject-group-ECFR26b58a956b3b018/section-375.211",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "red_flags",
    claim:
      "FMCSA's red flags include an estimate given by phone or online sight unseen with no inspection, no written estimate, a demand for cash or a large deposit before the move, a request to sign blank documents, and a website with no local address or registration and insurance details.",
    sourceLabel: "FMCSA Protect Your Move, Spot the Red Flags",
    sourceUrl: "https://www.fmcsa.dot.gov/protect-your-move/red-flags",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "deposits",
    claim:
      "No federal rule caps or bans deposits taken by interstate household-goods movers; FMCSA lists a demand for cash or a large deposit before the move as a red flag without naming a figure. The estimate must state the forms of payment the mover will honor at delivery.",
    sourceLabel: "FMCSA Protect Your Move, Spot the Red Flags; 49 CFR 375.401(c)",
    sourceUrl: "https://www.fmcsa.dot.gov/protect-your-move/red-flags",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "complaints",
    claim:
      "FMCSA takes complaints about household-goods movers and brokers through the National Consumer Complaint Database or by phone at 1-888-DOT-SAFT (1-888-368-7238), 8 a.m. to 8 p.m. Eastern, Monday to Friday.",
    sourceLabel: "FMCSA Complaint Center FAQs",
    sourceUrl: "https://www.fmcsa.dot.gov/consumer-protection/complaint-center-faqs",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "accessorials",
    claim:
      "Extra services such as packing, stair carries, long carries, shuttles and elevator work are priced in the mover's tariff. The mover must ask about and settle these before preparing the bill of lading; if it doesn't, it must deliver the goods and may bill the extras only after 30 days.",
    sourceLabel: "49 U.S.C. 13702 and 49 CFR 375.401(f)",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/49/13702",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "volume_pricing",
    claim:
      "No federal rule requires interstate movers to price by weight only. A mover that estimates by volume and converts to weight must explain the conversion in writing.",
    sourceLabel: "49 CFR 375.507(c) (Cornell LII)",
    sourceUrl: "https://www.law.cornell.edu/cfr/text/49/375.507",
    accessedOn: FMCSA,
  },
  {
    scope: "national",
    topic: "usdot_lookup",
    claim:
      "FMCSA's Protect Your Move site lets you look up an interstate mover or broker by name, state, USDOT or MC number and see its complaint history and safety record.",
    sourceLabel: "FMCSA Protect Your Move FAQs",
    sourceUrl: "https://www.fmcsa.dot.gov/protect-your-move/how-to/faqs",
    accessedOn: "2026-10-27",
  },
  {
    scope: "national",
    topic: "usdot_requirement",
    claim:
      "A USDOT number is required for interstate commerce that meets FMCSA's criteria; some states also require intrastate carriers to hold one. Operating authority (for example Motor Common Carrier of Household Goods or Broker of Household Goods) is a separate grant.",
    sourceLabel: "FMCSA, Do I need a USDOT number?",
    sourceUrl: "https://www7.fmcsa.dot.gov/registration/do-i-need-usdot-number-5",
    accessedOn: "2026-10-27",
  },
  {
    scope: "national",
    topic: "insurance_filings",
    claim:
      "To hold interstate authority, household-goods carriers must file both liability insurance (for example a $750,000 minimum for carriers with vehicles of 10,001 lb or more) and cargo insurance ($5,000 per vehicle, $10,000 per occurrence). Brokers file a $75,000 surety bond or trust instead.",
    sourceLabel: "FMCSA Insurance Filing Requirements",
    sourceUrl: "https://www.fmcsa.dot.gov/registration/insurance-filing-requirements",
    accessedOn: "2026-10-27",
  },
  {
    scope: "national",
    topic: "broker_rules",
    claim:
      "Household-goods brokers must say in their ads and on their websites that they are brokers that do not transport goods and that they arrange transport by an FMCSA-authorized carrier, and they may give estimates only under a written agreement with the carrier.",
    sourceLabel: "49 CFR Part 371 Subpart B",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-371/subpart-B",
    accessedOn: "2026-10-27",
  },
  {
    scope: "national",
    topic: "labor_wages",
    claim:
      "BLS's May 2025 Occupational Outlook Handbook entry for hand laborers and freight, stock and material movers (SOC 53-7062) gives a national median wage of $40,240 a year, about $19.35 an hour. Labor-cost context only; it is not a moving price.",
    sourceLabel: "BLS Occupational Outlook Handbook, Hand Laborers and Material Movers",
    sourceUrl: "https://www.bls.gov/ooh/transportation-and-material-moving/hand-laborers-and-material-movers.htm",
    accessedOn: FMCSA,
    verify: true,
  },
];

export const STATE_FACTS: FactSeed[] = [
  {
    scope: "state:TX",
    topic: "regulator",
    claim:
      "In Texas, anyone who transports household goods for compensation must register with the Texas Department of Motor Vehicles (TxDMV) and hold a TxDMV number, whatever the vehicle weight. Intrastate movers file a tariff and carry cargo coverage.",
    sourceLabel: "TxDMV, Motor carriers: TxDMV number",
    sourceUrl: "https://www.txdmv.gov/motor-carriers/txdmv-number",
    accessedOn: "2026-10-27",
  },
  {
    scope: "state:CA",
    topic: "regulator",
    claim:
      "In California, movers that work within the state hold a Household Mover permit from the Bureau of Household Goods and Services (BHGS), shown as a CAL-T number that must appear on their vehicles. Moves under 100 miles within California may be charged by the hour; longer in-state moves are charged by weight and mileage.",
    sourceLabel: "California Bureau of Household Goods and Services, consumer guide",
    sourceUrl: "https://bhgs.dca.ca.gov/consumers/hhm.html",
    accessedOn: FMCSA,
  },
  {
    scope: "state:FL",
    topic: "regulator",
    claim:
      "In Florida, intrastate movers and moving brokers must register with the Florida Department of Agriculture and Consumer Services (FDACS) under Chapter 507, Florida Statutes, and hold an IM registration number.",
    sourceLabel: "FDACS, Moving Companies",
    sourceUrl: "https://www.fdacs.gov/Business-Services/Moving-Companies",
    accessedOn: "2026-10-27",
  },
  {
    scope: "state:NY",
    topic: "regulator",
    claim:
      "In New York, movers that carry household goods within the state operate under authority from the New York State Department of Transportation (NYSDOT).",
    sourceLabel: "New York State Department of Transportation",
    sourceUrl: "https://www.dot.ny.gov/",
    accessedOn: "2026-10-27",
    verify: true,
  },
];

export const FMCSA_LINKS = {
  protectYourMove: { label: "FMCSA Protect Your Move", url: "https://www.fmcsa.dot.gov/protect-your-move" },
  rightsBooklet: {
    label: "Your Rights and Responsibilities When You Move (FMCSA handbook, October 2023)",
    url: "https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2023-10/FMCSA_R&R_Handbook_Web_v1.pdf",
  },
  readyToMove: { label: "Ready to Move? (FMCSA brochure, 2022 update)", url: "https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/ReadytoMoveBrochure_2022Update.pdf" },
  complaints: { label: "FMCSA National Consumer Complaint Database", url: "https://nccdb.fmcsa.dot.gov/" },
  valuation: { label: "FMCSA, Valuation and insurance", url: "https://www.fmcsa.dot.gov/protect-your-move/valuation-insurance" },
} as const;

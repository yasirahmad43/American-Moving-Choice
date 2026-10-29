import type { SourceRef } from "./types";

/** Primary references checked on 2026-10-29; the checklist steps are editorial worksheets. */
export const PLANNING_EXPANSION_SOURCES = {
  survey: { label: "49 CFR 375.401: surveys, estimates and accessorial services", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401", accessedOn: "2026-10-29" },
  binding: { label: "49 CFR 375.403: binding estimates and changed shipments", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.403", accessedOn: "2026-10-29" },
  payment: { label: "49 CFR 375.407: payment under a non-binding estimate", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.407", accessedOn: "2026-10-29" },
  inventory: { label: "49 CFR 375.503: inventory and delivery exceptions", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-E/subject-group-ECFR678dd6dec294449/section-375.503", accessedOn: "2026-10-29" },
  contract: { label: "49 CFR 375.505: bill-of-lading contents and signatures", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-E/subject-group-ECFR678dd6dec294449/section-375.505", accessedOn: "2026-10-29" },
  reweigh: { label: "49 CFR 375.517: reweighing an origin-weighed shipment", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-E/subject-group-ECFR78413e1c7c06a47/section-375.517", accessedOn: "2026-10-29" },
  claims: { label: "49 CFR 370.3: written cargo-claim requirements", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370/section-370.3", accessedOn: "2026-10-29" },
  arbitration: { label: "49 CFR 375.211: neutral arbitration programs", url: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-B/subject-group-ECFR26b58a956b3b018/section-375.211", accessedOn: "2026-10-29" },
  checklist: { label: "FMCSA Moving Checklist", url: "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist", accessedOn: "2026-10-29" },
  rights: { label: "FMCSA Your Rights and Responsibilities When You Move, 2022 update", url: "https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/RightsandResponsibilitiesBooklet_2022Update.pdf", accessedOn: "2026-10-29" },
  complaints: { label: "FMCSA National Consumer Complaint Database FAQs", url: "https://www.fmcsa.dot.gov/consumer-protection/national-consumer-complaint-database-faqs", accessedOn: "2026-10-29" },
} satisfies Record<string, SourceRef>;

export type PlanningExpansionSource = keyof typeof PLANNING_EXPANSION_SOURCES;

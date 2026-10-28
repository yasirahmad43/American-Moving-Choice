/**
 * Location-page publishing gates (site architecture §4.1, §4.2). Every gate must pass, none are
 * averaged, and a page that fails any gate is not published (404), never "published as noindex".
 * G1 is measured from coverage; G2–G10 need data sources that don't exist yet (demand data, the
 * facts registry, cost data, original data points, FAQs, uniqueness checks, named human review),
 * so they fail with the reason named. Pure: the counts come from queries.ts.
 */

export type GeoFamily = "state_hub" | "city";

export type GateId = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9" | "G10";

export interface GateResult {
  id: GateId;
  name: string;
  passed: boolean;
  /** What was measured, or why the gate can't be measured yet. */
  detail: string;
}

export interface GateEvaluation {
  family: GeoFamily;
  gates: GateResult[];
  /** True only when every gate passes. */
  publishable: boolean;
  /** The gates that pass, by ID. */
  passing: GateId[];
}

/**
 * Thresholds from tokens.json (`setting.geo_min_movers`, `setting.geo_min_movers_state`,
 * `setting.geo_min_facts`, `setting.geo_min_data_points`); site architecture §4.1 makes them
 * configurable per family in admin, which has no setting for them yet.
 */
export const GEO_THRESHOLDS = {
  city: { movers: 3, facts: 3, dataPoints: 1, faqs: 4 },
  state_hub: { movers: 5, facts: 3, dataPoints: 1, faqs: 3 },
} as const;

/** Data sources the gates read. Null means the source doesn't exist yet, so the gate fails. */
export interface GateInputs {
  /** G1: approved movers with explicit coverage (the count the page would show). */
  approvedMoversWithCoverage: number;
  demandEvidence?: number | null;
  verifiedFacts?: number | null;
  costBlockSourced?: boolean | null;
  originalDataPoints?: number | null;
  uniqueFaqs?: number | null;
  uniqueContentShare?: number | null;
  swapTestPassed?: boolean | null;
  humanReviewer?: { name: string; reviewedAt: Date } | null;
  technicalPassed?: boolean | null;
}

const missing = (what: string) => `Not measured: ${what} doesn't exist yet in this preview.`;

export function evaluateGates(family: GeoFamily, inputs: GateInputs): GateEvaluation {
  const t = GEO_THRESHOLDS[family];
  const gates: GateResult[] = [];
  const add = (id: GateId, name: string, passed: boolean, detail: string) => gates.push({ id, name, passed, detail });

  add("G1", "Approved movers with explicit coverage", inputs.approvedMoversWithCoverage >= t.movers,
    `${inputs.approvedMoversWithCoverage} approved movers with explicit coverage; at least ${t.movers} needed.`);

  if (family === "state_hub") {
    add("G2", "Demand evidence", true, "Not required for state hubs (site architecture §4.1).");
  } else if (inputs.demandEvidence == null) {
    add("G2", "Demand evidence", false, missing("the demand data (keyword CSV or request counts)"));
  } else {
    add("G2", "Demand evidence", inputs.demandEvidence > 0, `${inputs.demandEvidence} demand signals recorded.`);
  }

  if (inputs.verifiedFacts == null) add("G3", "Verified local facts", false, missing("the facts registry"));
  else add("G3", "Verified local facts", inputs.verifiedFacts >= t.facts, `${inputs.verifiedFacts} verified facts; at least ${t.facts} needed.`);

  if (family === "state_hub" && inputs.costBlockSourced == null) {
    // A state hub publishes without the cost block until cost data exists, and says why (§4.1 G4).
    add("G4", "Cost block", true, "No cost data yet; a state hub may publish without the block and says why.");
  } else if (inputs.costBlockSourced == null) {
    add("G4", "Cost block", false, missing("sourced, dated cost data for this area"));
  } else {
    add("G4", "Cost block", inputs.costBlockSourced, inputs.costBlockSourced ? "Sourced and dated." : "Cost data is missing or out of date.");
  }

  if (inputs.originalDataPoints == null) add("G5", "Original data point", false, missing("original data for this area"));
  else add("G5", "Original data point", inputs.originalDataPoints >= t.dataPoints, `${inputs.originalDataPoints} data points; at least ${t.dataPoints} needed.`);

  if (inputs.uniqueFaqs == null) add("G6", "Unique FAQs", false, missing("page-specific FAQs"));
  else add("G6", "Unique FAQs", inputs.uniqueFaqs >= t.faqs, `${inputs.uniqueFaqs} unique FAQs; at least ${t.faqs} needed.`);

  if (inputs.uniqueContentShare == null) add("G7", "Unique content", false, missing("the uniqueness check"));
  else add("G7", "Unique content", inputs.uniqueContentShare >= 0.4, `${Math.round(inputs.uniqueContentShare * 100)}% unique; at least 40% needed.`);

  if (inputs.swapTestPassed == null) add("G8", "Swap test", false, missing("a reviewer's swap test"));
  else add("G8", "Swap test", inputs.swapTestPassed, inputs.swapTestPassed ? "Passed." : "Failed.");

  if (!inputs.humanReviewer) add("G9", "Human review", false, missing("a named human review"));
  else add("G9", "Human review", true, `Reviewed by ${inputs.humanReviewer.name}.`);

  if (inputs.technicalPassed == null) add("G10", "Technical checks", false, missing("the technical page check"));
  else add("G10", "Technical checks", inputs.technicalPassed, inputs.technicalPassed ? "Passed." : "Failed.");

  const passing = gates.filter((g) => g.passed).map((g) => g.id);
  return { family, gates, publishable: gates.every((g) => g.passed), passing };
}

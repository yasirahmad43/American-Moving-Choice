/**
 * One model version feeds the calculator widget, its results view and the answers carried into the
 * quote survey (build plan §7.3; site architecture §6.3 rules 5 and 6). This test sends the same
 * answers through each path and fails on any difference in ranges, labels or carried values.
 */
import { describe, expect, it } from "vitest";
import { SURVEY_PREFILL_KEY, parseCalculatorAnswers, queryFromSurveyPrefill, surveyPrefillFor, type RawCalculatorAnswers, type SurveyPrefill } from "./answers";
import { DALLAS_HOUSTON, DALLAS_LOCAL, FIVE_TX, NOW, TEXAS, card } from "./fixtures.test-helpers";
import { computeCost } from "./model";
import { rangeLabel, resultLists, widgetSummary } from "./present";
import { COST_MODEL_VERSION, type CostQuery, type CostResult, type CostRoute } from "./types";

const TOKENS = { storageAssumption: "one month", specialtyItems: "one large item such as a piano" };
const noSpecialty = (n: number, factor: number) => {
  const c = card(n, factor);
  return { ...c, services: { ...c.services!, specialty_item_cents: null } };
};
// Seven movers; only four price specialty items.
const CARDS = [...FIVE_TX.slice(0, 3), noSpecialty(4, 1.04), noSpecialty(5, 1.08), card(6, 1.12), card(7, 0.9, { services: null })];

const routeFor = (query: CostQuery): CostRoute => (query.destinationZip === DALLAS_LOCAL.destination.zip ? DALLAS_LOCAL : DALLAS_HOUSTON);

const compute = (query: CostQuery): CostResult =>
  computeCost({ route: routeFor(query), moveSize: query.moveSize, services: query.services, cards: CARDS, area: TEXAS, now: NOW });

/** Widget path: raw form answers → validation → model → the results view's label and lists. */
function widgetPath(raw: RawCalculatorAnswers) {
  const parsed = parseCalculatorAnswers(raw);
  if (!parsed.ok) throw new Error("answers should be valid");
  const result = compute(parsed.query);
  return {
    query: parsed.query,
    result,
    label: result.kind === "range" ? rangeLabel(result) : null,
    lists: result.kind === "range" ? resultLists(result, routeFor(parsed.query), TOKENS) : null,
  };
}

/** Results path: answers carried through sessionStorage → rebuilt query → model → compact summary. */
function resultsPath(prefillJson: string) {
  const prefill = JSON.parse(prefillJson) as SurveyPrefill;
  const query = queryFromSurveyPrefill(prefill);
  const result = compute(query);
  return { prefill, query, result, summary: widgetSummary(result) };
}

const CASES: { name: string; raw: RawCalculatorAnswers }[] = [
  { name: "Dallas to Houston, 2 bedrooms", raw: { origin: "75201", destination: "77002", size: "2br", services: [] } },
  { name: "messy entry with services out of order", raw: { origin: "ZIP 75201", destination: "77002-1234", size: "3br", services: ["specialty_items", "packing"] } },
  { name: "local studio with storage", raw: { origin: "75201", destination: "75207", size: "studio", services: ["storage"] } },
  { name: "services that drop movers below the threshold", raw: { origin: "75201", destination: "77002", size: "2br", services: ["packing", "storage", "specialty_items"] } },
  { name: "office move", raw: { origin: "75201", destination: "77002", size: "office", services: [] } },
];

describe("widget, results view and survey prefill agree", () => {
  for (const { name, raw } of CASES) {
    it(name, () => {
      const widget = widgetPath(raw);
      // The call to action writes this to sessionStorage; the survey reads it back.
      const stored = JSON.stringify(surveyPrefillFor(widget.query));
      const results = resultsPath(stored);

      expect(results.query).toEqual(widget.query);
      expect(results.result).toEqual(widget.result);
      expect(results.summary.kind).toBe(widget.result.kind);
      expect(results.summary.label).toEqual(widget.label);
      expect(results.prefill).toMatchObject({
        v: 1,
        source: "cost-calculator",
        originZip: widget.query.originZip,
        destinationZip: widget.query.destinationZip,
        moveSize: widget.query.moveSize,
        services: widget.query.services,
        confirm: true,
        modelVersion: COST_MODEL_VERSION,
      });
      if (widget.result.kind !== "size_unpriced") expect(widget.result.modelVersion).toBe(COST_MODEL_VERSION);
      // The carried values never include a month or any figure from the range.
      expect(Object.keys(results.prefill).sort()).toEqual(["confirm", "destinationZip", "modelVersion", "moveSize", "originZip", "services", "source", "v"]);
    });
  }

  it("covers both outcomes", () => {
    const kinds = CASES.map(({ raw }) => widgetPath(raw).result.kind);
    expect(kinds).toContain("range");
    expect(kinds).toContain("no_data");
    expect(kinds).toContain("size_unpriced");
    expect(SURVEY_PREFILL_KEY).toBe("amc.survey.prefill");
  });
});

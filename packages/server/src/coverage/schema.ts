/**
 * Coverage vocabulary and validation (lead lifecycle §3; data model §4). Pure: no database, no
 * Next.js, so the rules are unit-testable and the client editor can share the labels.
 *
 * A rule matches when every specified dimension matches; inside one location set any member
 * matches (state OR county OR ZIP); an empty set is unconstrained; exclusions override
 * inclusions; paused rules are ignored; capabilities are a ceiling no rule can widen.
 */
import { US_STATES, isStateCode, parseZip5, type MoveSize, type MoveType, type Service, type StateCode } from "@amc/core";
import { z } from "zod";

export const MOVE_TYPES = ["local", "intrastate", "interstate"] as const satisfies readonly MoveType[];
export const MOVE_SIZES = ["studio", "1br", "2br", "3br", "4br_plus", "office", "partial"] as const satisfies readonly MoveSize[];
export const SERVICES = ["full_service", "packing", "storage", "auto_transport", "labor_only", "specialty_items"] as const satisfies readonly Service[];

export const MOVE_TYPE_LABELS: Record<MoveType, string> = {
  local: "Local (same state, short distance)",
  intrastate: "Long-distance within one state",
  interstate: "Interstate (between states)",
};

export const MOVE_TYPE_SHORT_LABELS: Record<MoveType, string> = {
  local: "Local",
  intrastate: "In-state long-distance",
  interstate: "Interstate",
};

export const MOVE_SIZE_LABELS: Record<MoveSize, string> = {
  studio: "Studio",
  "1br": "1 bedroom",
  "2br": "2 bedrooms",
  "3br": "3 bedrooms",
  "4br_plus": "4 or more bedrooms",
  office: "Office",
  partial: "A few items",
};

export const SERVICE_LABELS: Record<Service, string> = {
  full_service: "Full-service moving (loading, transport, unloading)",
  packing: "Packing",
  storage: "Storage",
  auto_transport: "Vehicle transport",
  labor_only: "Labor only (no truck)",
  specialty_items: "Specialty items (for example a piano)",
};

export const SERVICE_SHORT_LABELS: Record<Service, string> = {
  full_service: "Full service",
  packing: "Packing",
  storage: "Storage",
  auto_transport: "Vehicle transport",
  labor_only: "Labor only",
  specialty_items: "Specialty items",
};

/** Limits that keep one rule readable and one save cheap. */
export const COVERAGE_LIMITS = {
  rulesPerCompany: 50,
  statesPerSide: US_STATES.length,
  countiesPerSide: 300,
  zipsPerSide: 500,
  labelLength: 80,
} as const;

export interface LocationSetInput {
  states: StateCode[];
  counties: string[];
  zips: string[];
}

export interface CoverageRuleInput {
  kind: "include" | "exclude";
  label: string | null;
  origin: LocationSetInput;
  destination: LocationSetInput;
  moveTypes: MoveType[];
  moveSizes: MoveSize[];
  services: Service[];
  paused: boolean;
}

export interface Capabilities {
  moveTypes: MoveType[];
  moveSizes: MoveSize[];
  services: Service[];
}

/** Checks the geography for the location sets: county FIPS and ZIP codes must exist. */
export interface GeoValidator {
  countyState(fips: string): StateCode | null;
  zipExists(zip: string): boolean;
}

const uniq = <T>(values: readonly T[]) => [...new Set(values)];

/** Splits a pasted ZIP list ("78701, 78702\n78703") into cleaned 5-digit codes, keeping invalid tokens apart. */
export function splitZipList(text: string): { zips: string[]; invalid: string[] } {
  const zips: string[] = [];
  const invalid: string[] = [];
  for (const token of text.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean)) {
    const zip = parseZip5(token);
    if (zip) zips.push(zip);
    else invalid.push(token.slice(0, 12));
  }
  return { zips: uniq(zips), invalid };
}

const enumList = <T extends string>(values: readonly [T, ...T[]], label: string) =>
  z
    .array(z.enum(values, { error: `Choose valid ${label}.` }), { error: `Choose valid ${label}.` })
    .max(values.length * 2)
    .transform((list) => uniq(list));

function locationSetSchema(side: "origin" | "destination", geo: GeoValidator) {
  const where = side === "origin" ? "pickup" : "destination";
  return z
    .object({
      states: z.array(z.string()).max(COVERAGE_LIMITS.statesPerSide * 2).default([]),
      counties: z.array(z.string()).max(COVERAGE_LIMITS.countiesPerSide * 2).default([]),
      zips: z.array(z.string()).max(COVERAGE_LIMITS.zipsPerSide * 2).default([]),
    })
    .default({ states: [], counties: [], zips: [] })
    .transform((set, ctx): LocationSetInput => {
      const states = uniq(set.states.map((s) => s.trim().toUpperCase()));
      const badState = states.find((s) => !isStateCode(s));
      if (badState) ctx.addIssue({ code: "custom", message: `Unknown ${where} state "${badState.slice(0, 4)}".` });
      const counties = uniq(set.counties.map((c) => c.trim()));
      const badCounty = counties.find((c) => !/^\d{5}$/.test(c) || !geo.countyState(c));
      if (badCounty) ctx.addIssue({ code: "custom", message: `Unknown ${where} county code "${badCounty.slice(0, 8)}".` });
      if (counties.length > COVERAGE_LIMITS.countiesPerSide) {
        ctx.addIssue({ code: "custom", message: `Use at most ${COVERAGE_LIMITS.countiesPerSide} ${where} counties in one rule.` });
      }
      const zips = uniq(set.zips.map((z) => parseZip5(z) ?? z.trim()));
      const badZip = zips.find((z) => !/^\d{5}$/.test(z) || !geo.zipExists(z));
      if (badZip) ctx.addIssue({ code: "custom", message: `${where[0]!.toUpperCase()}${where.slice(1)} ZIP code "${badZip.slice(0, 12)}" isn't one we know.` });
      if (zips.length > COVERAGE_LIMITS.zipsPerSide) {
        ctx.addIssue({ code: "custom", message: `Use at most ${COVERAGE_LIMITS.zipsPerSide} ${where} ZIP codes in one rule.` });
      }
      return { states: states.filter(isStateCode).sort(), counties: counties.sort(), zips: zips.sort() };
    });
}

/** The rule schema; geography is checked against the bundled dataset through `geo`. */
export function coverageRuleSchema(geo: GeoValidator) {
  return z.object({
    kind: z.enum(["include", "exclude"], { error: "Choose whether the rule adds or removes coverage." }),
    label: z
      .string()
      .trim()
      .max(COVERAGE_LIMITS.labelLength, `Keep the name under ${COVERAGE_LIMITS.labelLength} characters.`)
      .nullish()
      .transform((value) => (value ? value : null)),
    origin: locationSetSchema("origin", geo),
    destination: locationSetSchema("destination", geo),
    moveTypes: enumList(MOVE_TYPES, "move types").default([]),
    moveSizes: enumList(MOVE_SIZES, "move sizes").default([]),
    services: enumList(SERVICES, "services").default([]),
    paused: z.boolean().default(false),
  });
}

export const isEmptySet = (set: LocationSetInput) => set.states.length === 0 && set.counties.length === 0 && set.zips.length === 0;

/**
 * Problems a valid-shaped rule can still have against the company's capability ceiling. A rule
 * that names a move type, size or service the company doesn't offer would never match it, so
 * the editor refuses it instead of letting it look like coverage.
 */
export function ruleCapabilityProblems(rule: Pick<CoverageRuleInput, "moveTypes" | "moveSizes" | "services">, capabilities: Capabilities): string[] {
  const problems: string[] = [];
  const outside = <T extends string>(values: T[], allowed: T[], labels: Record<T, string>) => values.filter((v) => !allowed.includes(v)).map((v) => labels[v]);
  const types = outside(rule.moveTypes, capabilities.moveTypes, MOVE_TYPE_SHORT_LABELS);
  if (types.length) problems.push(`Your services don't include ${types.join(", ")} moves. Add them under "What you offer" first.`);
  const sizes = outside(rule.moveSizes, capabilities.moveSizes, MOVE_SIZE_LABELS);
  if (sizes.length) problems.push(`Your services don't include these sizes: ${sizes.join(", ")}. Add them under "What you offer" first.`);
  const services = outside(rule.services, capabilities.services, SERVICE_SHORT_LABELS);
  if (services.length) problems.push(`Your services don't include ${services.join(", ")}. Add them under "What you offer" first.`);
  return problems;
}

const requiredEnumList = <T extends string>(values: readonly [T, ...T[]], label: string, empty: string) =>
  z
    .array(z.enum(values, { error: `Choose valid ${label}.` }), { error: empty })
    .min(1, empty)
    .max(values.length * 2)
    .transform((list) => uniq(list));

/** The capability ceiling: what the company offers at all. Each list needs at least one value. */
export const capabilitiesSchema = z.object({
  moveTypes: requiredEnumList(MOVE_TYPES, "move types", "Choose at least one move type."),
  moveSizes: requiredEnumList(MOVE_SIZES, "move sizes", "Choose at least one move size."),
  services: requiredEnumList(SERVICES, "services", "Choose at least one service."),
});

/** A short plain-language summary of a location set, for rule cards. */
export function describeLocationSet(set: LocationSetInput, countyName: (fips: string) => string | null): string {
  const parts: string[] = [];
  if (set.states.length) parts.push(set.states.length > 6 ? `${set.states.length} states` : set.states.join(", "));
  if (set.counties.length) {
    parts.push(
      set.counties.length > 3
        ? `${set.counties.length} counties`
        : set.counties.map((c) => countyName(c) ?? c).join(", "),
    );
  }
  if (set.zips.length) parts.push(set.zips.length > 4 ? `${set.zips.length} ZIP codes` : `ZIP ${set.zips.join(", ")}`);
  return parts.join("; ");
}

/** Plain-language reasons for @amc/core matchCompany results. */
export function matchReasonText(reason: string, ruleLabel: (id: string) => string | null): string {
  if (reason === "company_not_eligible") return "Your company can't receive requests yet (it isn't approved, or it can't buy right now).";
  if (reason === "move_type_not_offered") return "Your services don't include this type of move.";
  if (reason === "move_size_not_offered") return "Your services don't include this move size.";
  if (reason === "service_not_offered") return "Your services don't include every service this request asks for.";
  if (reason === "no_matching_coverage") return "None of your active coverage rules includes this move.";
  if (reason.startsWith("excluded_by:")) {
    const label = ruleLabel(reason.slice("excluded_by:".length));
    return `An exclusion rule${label ? ` ("${label}")` : ""} removes this move from your coverage.`;
  }
  return "This move doesn't match your coverage.";
}

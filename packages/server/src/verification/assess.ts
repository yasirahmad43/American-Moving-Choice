/**
 * Turns an FMCSA lookup and the application into the six automated check results (mover
 * verification §3). Pure, so every rule is unit-testable. Unknown facts never pass: they become
 * "needs_review" for a person to decide.
 */
import type {
  ApplicationFacts,
  AuthorityGrant,
  AutomatedCheckType,
  CarrierAddress,
  CheckOutcome,
  CheckResult,
  FmcsaCarrierRecord,
  FmcsaLookup,
} from "./types";
import { AUTOMATED_CHECK_TYPES } from "./types";

const COMPANY_SUFFIXES = new Set(["inc", "incorporated", "llc", "l", "c", "co", "company", "corp", "corporation", "ltd", "limited", "lp", "llp", "pllc", "the"]);

/** Lowercase, accents and punctuation removed, "&" as "and", legal suffixes dropped. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !COMPANY_SUFFIXES.has(word))
    .join(" ");
}

const STREET_WORDS: Record<string, string> = {
  street: "st", avenue: "ave", av: "ave", road: "rd", drive: "dr", lane: "ln", court: "ct", parkway: "pkwy",
  boulevard: "blvd", highway: "hwy", place: "pl", circle: "cir", suite: "ste", north: "n", south: "s", east: "e", west: "w",
};

export function normalizeStreet(street: string): string {
  return street
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => STREET_WORDS[word] ?? word)
    .join(" ");
}

function bigrams(value: string): Map<string, number> {
  const grams = new Map<string, number>();
  const s = value.replace(/\s+/g, " ");
  for (let i = 0; i < s.length - 1; i++) {
    const gram = s.slice(i, i + 2);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  return grams;
}

/** Sørensen–Dice similarity of character bigrams, 0 to 1. */
export function similarity(a: string, b: string): number {
  if (a === b) return a.length > 0 ? 1 : 0;
  if (a.length < 2 || b.length < 2) return 0;
  const left = bigrams(a);
  const right = bigrams(b);
  let overlap = 0;
  for (const [gram, count] of left) overlap += Math.min(count, right.get(gram) ?? 0);
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

export const NAME_MATCH_THRESHOLD = 0.92;
export const STREET_MATCH_THRESHOLD = 0.85;

const docketDigits = (docket: string) => docket.replace(/\D/g, "").replace(/^0+/, "");

const isCarrier = (a: AuthorityGrant) => a.type === "common" || a.type === "contract";
const isCarrierHhg = (a: AuthorityGrant) => isCarrier(a) && a.scope === "household_goods";
const isLiveBroker = (a: AuthorityGrant) => a.type === "broker" && (a.status === "active" || a.status === "pending");

const describeAddress = (a: CarrierAddress | null) =>
  a ? [a.line1, a.city, a.state, a.zip].filter(Boolean).join(", ") || null : null;

/** Snapshot of identity fields from the previous check, for change detection on live records. */
export interface PreviousIdentity {
  legalName: string | null;
  address: CarrierAddress | null;
  phone: string | null;
  retrievedAt: string;
}

export interface AssessOptions {
  requireMcNumber: boolean;
  previous?: PreviousIdentity | null;
}

/** Everything about the record that the checks used, stored with each check as evidence. */
function recordEvidence(lookup: Extract<FmcsaLookup, { status: "found" }>): Record<string, unknown> {
  const r = lookup.record;
  return {
    source: lookup.source,
    usdot: r.usdot,
    legal_name: r.legalName,
    dba_name: r.dbaName,
    usdot_status: r.usdotStatus,
    out_of_service: r.outOfService,
    physical_address: r.physicalAddress,
    phone_on_record: r.phone,
    authorities: r.authorities,
    insurance: r.insurance,
    recent_changes: r.recentChanges,
  };
}

function outcome(checkType: AutomatedCheckType, result: CheckResult, note: string, payload: Record<string, unknown>): CheckOutcome {
  return { checkType, result, note, payload: { check: checkType, ...payload } };
}

export function assessCarrier(lookup: FmcsaLookup, app: ApplicationFacts, options: AssessOptions): CheckOutcome[] {
  if (lookup.status === "unavailable") {
    const payload = { source: lookup.source, usdot: app.usdot, lookup: "unavailable", reason: lookup.reason };
    return AUTOMATED_CHECK_TYPES.map((type) => outcome(type, "needs_review", lookup.reason, payload));
  }
  if (lookup.status === "not_found") {
    const payload = { source: lookup.source, usdot: app.usdot, lookup: "not_found" };
    const note = app.usdot ? `No FMCSA record was found for USDOT ${app.usdot}.` : "The application has no USDOT number.";
    return AUTOMATED_CHECK_TYPES.map((type) =>
      type === "usdot_active" ? outcome(type, "fail", note, payload) : outcome(type, "needs_review", "No FMCSA record to compare with.", payload),
    );
  }

  const record = lookup.record;
  const evidence = recordEvidence(lookup);
  return [
    usdotActive(record, evidence),
    identityMatch(record, app, evidence),
    authorityType(record, options, evidence),
    authorityStatusCheck(record, options, evidence),
    insuranceFilings(record, evidence),
    recentChanges(record, options, evidence),
  ];
}

function usdotActive(record: FmcsaCarrierRecord, evidence: Record<string, unknown>): CheckOutcome {
  if (record.outOfService === true) return outcome("usdot_active", "fail", "The USDOT record has an out-of-service order.", evidence);
  if (record.usdotStatus === "inactive") return outcome("usdot_active", "fail", "The USDOT record is inactive.", evidence);
  if (record.usdotStatus === "active" && record.outOfService === false) {
    return outcome("usdot_active", "pass", "The USDOT record is active with no out-of-service order.", evidence);
  }
  return outcome("usdot_active", "needs_review", "The record does not say clearly whether the USDOT number is active.", evidence);
}

function identityMatch(record: FmcsaCarrierRecord, app: ApplicationFacts, evidence: Record<string, unknown>): CheckOutcome {
  const appNames = [app.legalName, app.dbaName].filter((n): n is string => Boolean(n)).map(normalizeCompanyName);
  const recordNames = [record.legalName, record.dbaName].filter((n): n is string => Boolean(n)).map(normalizeCompanyName);
  let nameScore = 0;
  for (const a of appNames) for (const r of recordNames) nameScore = Math.max(nameScore, similarity(a, r));
  const nameMatch = nameScore >= NAME_MATCH_THRESHOLD;

  const recordAddress = record.physicalAddress;
  let addressMatch: boolean | null = null;
  if (app.address?.zip && recordAddress?.zip) {
    const streetScore =
      app.address.line1 && recordAddress.line1 ? similarity(normalizeStreet(app.address.line1), normalizeStreet(recordAddress.line1)) : 0;
    addressMatch = app.address.zip === recordAddress.zip && streetScore >= STREET_MATCH_THRESHOLD;
  }

  const recordDockets = [...new Set(record.authorities.map((a) => a.docket))].filter((d) => d !== "unknown");
  const docketMatch = app.mcNumber && recordDockets.length ? recordDockets.some((d) => docketDigits(d) === docketDigits(app.mcNumber!)) : null;

  const payload = {
    ...evidence,
    application: { legal_name: app.legalName, dba_name: app.dbaName, address: app.address, mc_number: app.mcNumber },
    name_score: Math.round(nameScore * 100) / 100,
    name_match: nameMatch,
    address_match: addressMatch,
    docket_match: docketMatch,
  };

  const problems: string[] = [];
  if (!nameMatch) {
    problems.push(`The name on record ("${record.legalName ?? "unknown"}"${record.dbaName ? `, DBA "${record.dbaName}"` : ""}) differs from the application ("${app.legalName}").`);
  }
  if (addressMatch === false) problems.push(`The address on record (${describeAddress(recordAddress) ?? "unknown"}) differs from the application.`);
  if (addressMatch === null) problems.push(app.address?.zip ? "The record has no address to compare." : "The application has no business address yet.");
  if (docketMatch === false) problems.push(`The MC number on the application (${app.mcNumber}) is not on the FMCSA record.`);

  if (problems.length === 0) return outcome("identity_match", "pass", "Name and address match the FMCSA record.", payload);
  return outcome("identity_match", "needs_review", problems.join(" "), payload);
}

function authorityType(record: FmcsaCarrierRecord, options: AssessOptions, evidence: Record<string, unknown>): CheckOutcome {
  const brokers = record.authorities.filter(isLiveBroker);
  if (brokers.length) {
    const dockets = [...new Set(brokers.map((b) => b.docket))].join(", ");
    const dual = record.authorities.some(isCarrier);
    return outcome(
      "authority_type",
      "fail",
      dual
        ? `Broker authority on record alongside carrier authority (${dockets}). Dual registrations are excluded under the movers-only policy.`
        : `Broker authority on record (${dockets}) and no carrier authority. Brokers can't join.`,
      evidence,
    );
  }
  const carrierHhg = record.authorities.filter(isCarrierHhg);
  if (carrierHhg.length) {
    const pastBroker = record.authorities.some((a) => a.type === "broker");
    if (pastBroker) {
      return outcome("authority_type", "needs_review", "Household-goods carrier authority on record, and an inactive or revoked broker authority. Confirm the company no longer brokers.", evidence);
    }
    return outcome("authority_type", "pass", "Household-goods carrier authority on record and no broker authority.", evidence);
  }
  if (record.authorities.some(isCarrier)) {
    return outcome("authority_type", "fail", "The carrier authority on record covers property, not household goods.", evidence);
  }
  return options.requireMcNumber
    ? outcome("authority_type", "fail", "No carrier operating authority on record.", evidence)
    : outcome("authority_type", "needs_review", "No federal operating authority on record (possibly an intrastate-only mover). Check state credentials.", evidence);
}

function authorityStatusCheck(record: FmcsaCarrierRecord, options: AssessOptions, evidence: Record<string, unknown>): CheckOutcome {
  const carrierHhg = record.authorities.filter(isCarrierHhg);
  if (carrierHhg.some((a) => a.status === "active")) return outcome("authority_status", "pass", "The household-goods carrier authority is granted and active.", evidence);
  if (carrierHhg.some((a) => a.status === "pending")) return outcome("authority_status", "fail", "The carrier authority is pending, not yet granted.", evidence);
  if (carrierHhg.length) {
    const status = carrierHhg[0]!.status;
    return outcome("authority_status", "fail", `The carrier authority is ${status}.`, evidence);
  }
  return options.requireMcNumber
    ? outcome("authority_status", "fail", "There is no household-goods carrier authority to check.", evidence)
    : outcome("authority_status", "needs_review", "No federal operating authority on record. Check state credentials.", evidence);
}

function insuranceFilings(record: FmcsaCarrierRecord, evidence: Record<string, unknown>): CheckOutcome {
  const { bipdOnFile, cargoOnFile } = record.insurance;
  if (bipdOnFile === true && cargoOnFile === true) return outcome("insurance_filings", "pass", "BI&PD liability and cargo insurance filings are on record.", evidence);
  const missing = [bipdOnFile === false ? "BI&PD liability" : null, cargoOnFile === false ? "cargo" : null].filter(Boolean);
  if (missing.length) return outcome("insurance_filings", "fail", `No ${missing.join(" or ")} insurance filing on record.`, evidence);
  return outcome("insurance_filings", "needs_review", "The record does not show whether the required insurance filings are on file.", evidence);
}

function recentChanges(record: FmcsaCarrierRecord, options: AssessOptions, evidence: Record<string, unknown>): CheckOutcome {
  if (record.recentChanges) {
    if (record.recentChanges.length === 0) {
      return outcome("recent_record_changes", "pass", "No contact, address or officer changes on the record in the last 90 days.", evidence);
    }
    const changes = record.recentChanges.map((c) => c.replace(/_/g, " ")).join(", ");
    return outcome("recent_record_changes", "needs_review", `Changed on the record in the last 90 days: ${changes}. Confirm the change with the company before approval.`, evidence);
  }
  const previous = options.previous;
  if (!previous) {
    return outcome("recent_record_changes", "needs_review", "First snapshot of this record. QCMobile keeps no change history, so compare with the FMCSA licensing history by hand.", evidence);
  }
  const changed: string[] = [];
  if ((previous.legalName ?? null) !== (record.legalName ?? null)) changed.push("legal name");
  if (describeAddress(previous.address) !== describeAddress(record.physicalAddress)) changed.push("physical address");
  if ((previous.phone ?? null) !== (record.phone ?? null)) changed.push("phone");
  if (changed.length) {
    return outcome("recent_record_changes", "needs_review", `Changed since the check on ${previous.retrievedAt.slice(0, 10)}: ${changed.join(", ")}.`, { ...evidence, previous });
  }
  return outcome("recent_record_changes", "pass", `No change to name, address or phone since the check on ${previous.retrievedAt.slice(0, 10)}.`, { ...evidence, previous });
}

/** The worst of several results: fail, then needs_review, then pass. */
export function worstResult(results: CheckResult[]): CheckResult {
  if (results.includes("fail")) return "fail";
  if (results.includes("needs_review")) return "needs_review";
  return "pass";
}

/** Broker authority present (true), absent (false) or unknown (null, no record). */
export function brokerAuthorityOf(lookup: FmcsaLookup): boolean | null {
  return lookup.status === "found" ? lookup.record.authorities.some(isLiveBroker) : null;
}

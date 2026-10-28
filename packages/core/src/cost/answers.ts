/**
 * The calculator's answers: ZIP entry cleanup, the "Still needed" hint, validation, and the values
 * carried into the quote survey. Shared by the client island (hints), the server action
 * (authoritative validation) and the survey prefill, so all three read answers the same way.
 * String IDs follow content/pages/costs/moving-cost-calculator.md.
 */
import type { MoveSize } from "../matching";
import { canonicalServices } from "./model";
import { COST_MODEL_VERSION, type CostQuery, type CostService } from "./types";

export const MOVE_SIZES: readonly MoveSize[] = ["studio", "1br", "2br", "3br", "4br_plus", "office", "partial"];

export function isMoveSize(value: string): value is MoveSize {
  return (MOVE_SIZES as readonly string[]).includes(value);
}

// Non-US postal codes, tested on the raw entry before cleanup (error.zip.non_us).
const CANADIAN = /^\s*[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d\s*$/;
const UK = /^\s*[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\s*$/;

export type ZipEntry =
  | { kind: "empty" }
  | { kind: "non_us" }
  | { kind: "short"; digits: string }
  | { kind: "zip"; zip: string };

/**
 * Cleans a ZIP entry (VD §9.2): non-US patterns first, then strip non-digits and keep the first
 * five. "02a108" and "ZIP 02108" become 02108; leading zeros stay.
 */
export function cleanZipEntry(raw: string): ZipEntry {
  if (raw.trim() === "") return { kind: "empty" };
  if (CANADIAN.test(raw) || UK.test(raw)) return { kind: "non_us" };
  const digits = raw.replace(/\D/g, "").slice(0, 5);
  if (digits.length === 0) return { kind: "short", digits };
  if (digits.length < 5) return { kind: "short", digits };
  return { kind: "zip", zip: digits };
}

/**
 * ZIP codes the calculator can't serve yet (owner default: APO/FPO addresses and US territories).
 * Prefixes: 006–009 Puerto Rico and the Virgin Islands, 090–098 and 340 APO/FPO (AE, AA), 962–966
 * APO/FPO (AP), 969 Guam and the Pacific territories.
 */
export function isUnsupportedZip(zip: string): boolean {
  const prefix = Number(zip.slice(0, 3));
  return (
    (prefix >= 6 && prefix <= 9) ||
    (prefix >= 90 && prefix <= 98) ||
    prefix === 340 ||
    (prefix >= 962 && prefix <= 966) ||
    prefix === 969
  );
}

export interface RawCalculatorAnswers {
  origin: string;
  destination: string;
  size: string | null;
  services: readonly string[];
}

export type AnswerField = "origin" | "destination" | "size";

export type AnswerError =
  | "error.origin.required"
  | "error.destination.required"
  | "error.zip.short"
  | "error.zip.non_us"
  | "error.zip.unsupported"
  | "error.size.required";

export type ParsedAnswers = { ok: true; query: CostQuery } | { ok: false; errors: Partial<Record<AnswerField, AnswerError>> };

function zipError(entry: ZipEntry, side: "origin" | "destination"): AnswerError | null {
  switch (entry.kind) {
    case "empty":
      return side === "origin" ? "error.origin.required" : "error.destination.required";
    case "non_us":
      return "error.zip.non_us";
    case "short":
      return "error.zip.short";
    case "zip":
      return isUnsupportedZip(entry.zip) ? "error.zip.unsupported" : null;
  }
}

/** Validates raw answers into a canonical query (the widget path). Unknown ZIPs are the server's call. */
export function parseCalculatorAnswers(raw: RawCalculatorAnswers): ParsedAnswers {
  const errors: Partial<Record<AnswerField, AnswerError>> = {};
  const origin = cleanZipEntry(raw.origin ?? "");
  const destination = cleanZipEntry(raw.destination ?? "");
  const originError = zipError(origin, "origin");
  const destinationError = zipError(destination, "destination");
  if (originError) errors.origin = originError;
  if (destinationError) errors.destination = destinationError;
  const size = raw.size ?? "";
  if (!isMoveSize(size)) errors.size = "error.size.required";
  if (Object.keys(errors).length > 0 || origin.kind !== "zip" || destination.kind !== "zip" || !isMoveSize(size)) {
    return { ok: false, errors };
  }
  return { ok: true, query: { originZip: origin.zip, destinationZip: destination.zip, moveSize: size, services: canonicalServices(raw.services) } };
}

/** The "Still needed" hint's missing answers, in form order (form.progress.*). Empty when done. */
export function stillNeeded(raw: RawCalculatorAnswers): ("origin" | "destination" | "size")[] {
  const missing: ("origin" | "destination" | "size")[] = [];
  if (cleanZipEntry(raw.origin).kind !== "zip") missing.push("origin");
  if (cleanZipEntry(raw.destination).kind !== "zip") missing.push("destination");
  if (!raw.size || !isMoveSize(raw.size)) missing.push("size");
  return missing;
}

/** Joins words with commas and "and": "a", "a and b", "a, b and c". */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** sessionStorage key the quote survey reads and clears (never the URL; site architecture §8.8). */
export const SURVEY_PREFILL_KEY = "amc.survey.prefill";

/**
 * What the calculator carries into the quote survey's "Where" step: the two ZIP codes, the move
 * size and the services, marked for the reader to confirm. The month is never carried.
 */
export interface SurveyPrefill {
  v: 1;
  source: "cost-calculator";
  originZip: string;
  destinationZip: string;
  moveSize: MoveSize;
  services: CostService[];
  /** The reader must confirm carried answers in the survey. */
  confirm: true;
  modelVersion: typeof COST_MODEL_VERSION;
}

export function surveyPrefillFor(query: CostQuery): SurveyPrefill {
  return {
    v: 1,
    source: "cost-calculator",
    originZip: query.originZip,
    destinationZip: query.destinationZip,
    moveSize: query.moveSize,
    services: canonicalServices(query.services),
    confirm: true,
    modelVersion: COST_MODEL_VERSION,
  };
}

/** The query a surface (such as the survey's What we found step) rebuilds from carried answers. */
export function queryFromSurveyPrefill(prefill: SurveyPrefill): CostQuery {
  return {
    originZip: prefill.originZip,
    destinationZip: prefill.destinationZip,
    moveSize: prefill.moveSize,
    services: canonicalServices(prefill.services),
  };
}

/**
 * Rate-card validation (build plan §7.3 shapes; rate_cards.services from migration 120). Pure: the
 * portal's form parser and saveRateCard both use it, and tests import it directly.
 *
 * Form field names (the portal editor uses the same):
 *   states                       one value per covered state
 *   local_enabled, ld_enabled    "on" when the card prices that kind of move
 *   local.crew.{2..5}            hourly rate in dollars for that crew size
 *   local.travel                 truck or travel fee in dollars (0 for none)
 *   local.hours.{size}           typical crew hours; local.crew_size.{size} typical crew
 *   ld.cwt.{band}                dollars per 100 lb for each distance band
 *   ld.weight.{size}             typical shipment weight in pounds
 *   svc.packing.{size}, svc.storage.{size}, svc.specialty   service prices in dollars
 */
import {
  CREW_SIZES,
  DISTANCE_BANDS,
  HOME_SIZES,
  US_STATES,
  type BySize,
  type CrewSize,
  type DistanceBand,
  type HomeSize,
  type LocalRates,
  type LongDistanceRates,
  type ServiceRates,
  type StateCode,
} from "@amc/core";
import { z } from "zod";

/** Highest price accepted anywhere on a card: $100,000. */
export const MAX_PRICE_CENTS = 10_000_000;

const cents = z.number().int().min(0).max(MAX_PRICE_CENTS);
const positiveCents = z.number().int().min(1).max(MAX_PRICE_CENTS);
const hours = z.number().min(0.25).max(48).refine((h) => Number.isInteger(h * 4), "Use quarter hours, such as 5.5 or 5.25.");
const crew = z.number().int().min(2).max(5);
const weight = z.number().int().min(100).max(30_000);

const bySize = <S extends z.ZodType<number>>(value: S) => z.partialRecord(z.enum(HOME_SIZES), value);

export const localRatesSchema = z
  .object({
    crew_hourly_cents: z.partialRecord(z.enum(CREW_SIZES), positiveCents),
    travel_fee_cents: cents,
    hours_by_size: bySize(hours),
    crew_by_size: bySize(crew),
  })
  .superRefine((local, ctx) => {
    if (Object.keys(local.crew_hourly_cents).length === 0) {
      ctx.addIssue({ code: "custom", path: ["crew_hourly_cents"], message: "Enter an hourly rate for at least one crew size." });
    }
    let sizes = 0;
    for (const size of HOME_SIZES) {
      const h = local.hours_by_size[size];
      const c = local.crew_by_size[size];
      if ((h === undefined) !== (c === undefined)) {
        const missing = h === undefined ? "hours_by_size" : "crew_by_size";
        ctx.addIssue({ code: "custom", path: [missing, size], message: h === undefined ? "Enter the typical hours for this size, or clear its crew." : "Enter the typical crew for this size, or clear its hours." });
        continue;
      }
      if (c === undefined) continue;
      sizes++;
      if (local.crew_hourly_cents[String(c) as CrewSize] === undefined) {
        ctx.addIssue({ code: "custom", path: ["crew_by_size", size], message: `Add an hourly rate for a crew of ${c}, or pick a crew size you price.` });
      }
    }
    if (sizes === 0) ctx.addIssue({ code: "custom", path: ["hours_by_size"], message: "Enter the typical hours and crew for at least one home size." });
  });

export const longDistanceRatesSchema = z
  .object({
    cwt_cents_by_band: z.partialRecord(z.enum(DISTANCE_BANDS), positiveCents),
    weight_lbs_by_size: bySize(weight),
  })
  .superRefine((ld, ctx) => {
    if (Object.keys(ld.cwt_cents_by_band).length === 0) {
      ctx.addIssue({ code: "custom", path: ["cwt_cents_by_band"], message: "Enter a rate for at least one distance band." });
    }
    if (Object.keys(ld.weight_lbs_by_size).length === 0) {
      ctx.addIssue({ code: "custom", path: ["weight_lbs_by_size"], message: "Enter the typical weight for at least one home size." });
    }
  });

export const serviceRatesSchema = z.object({
  packing_cents_by_size: bySize(positiveCents).nullable(),
  storage_cents_per_month_by_size: bySize(positiveCents).nullable(),
  specialty_item_cents: positiveCents.nullable(),
});

export const rateCardDataSchema = z
  .object({
    states: z
      .array(z.enum(US_STATES))
      .min(1, "Choose at least one state your card covers.")
      .transform((states) => [...new Set(states)].sort() as StateCode[]),
    local: localRatesSchema.nullable(),
    long_distance: longDistanceRatesSchema.nullable(),
    services: serviceRatesSchema.nullable(),
  })
  .superRefine((card, ctx) => {
    if (!card.local && !card.long_distance) {
      ctx.addIssue({ code: "custom", path: ["local"], message: "Price local moves, long-distance moves or both." });
    }
  });

export interface RateCardData {
  states: StateCode[];
  local: LocalRates | null;
  long_distance: LongDistanceRates | null;
  services: ServiceRates | null;
}

// ------------------------------------------------------------------ the portal form

export type RateCardFormValues = Record<string, string | string[]>;
export type RateCardFormResult = { ok: true; data: RateCardData } | { ok: false; fieldErrors: Record<string, string>; values: RateCardFormValues };

/** Dollars as typed ("1,250", "$129.50") to cents; null for blank, NaN for unreadable. */
export function dollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Cents to the editor's dollar text ("129" or "129.50"). */
export function centsToDollars(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value % 100 === 0 ? String(value / 100) : (value / 100).toFixed(2);
}

function numberText(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

/** Maps a schema issue path to the form field it belongs to. */
function fieldFor(path: readonly PropertyKey[]): string {
  const [section, group, key] = path.map(String);
  if (section === "states") return "states";
  if (section === "local") {
    if (group === "crew_hourly_cents") return key ? `local.crew.${key}` : "local.crew";
    if (group === "travel_fee_cents") return "local.travel";
    if (group === "hours_by_size") return key ? `local.hours.${key}` : "local.sizes";
    if (group === "crew_by_size") return key ? `local.crew_size.${key}` : "local.sizes";
    return "local_enabled";
  }
  if (section === "long_distance") {
    if (group === "cwt_cents_by_band") return key ? `ld.cwt.${key}` : "ld.cwt";
    if (group === "weight_lbs_by_size") return key ? `ld.weight.${key}` : "ld.weight";
    return "ld_enabled";
  }
  if (section === "services") {
    if (group === "packing_cents_by_size") return key ? `svc.packing.${key}` : "svc.packing";
    if (group === "storage_cents_per_month_by_size") return key ? `svc.storage.${key}` : "svc.storage";
    return "svc.specialty";
  }
  return "form";
}

const PRICE_MESSAGE = "Enter an amount in dollars, such as 129 or 129.50.";

/** Reads the editor's fields into card data, with one plain-language message per problem field. */
export function parseRateCardForm(values: RateCardFormValues): RateCardFormResult {
  const text = (name: string): string => {
    const value = values[name];
    return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim();
  };
  const errors: Record<string, string> = {};

  const price = (name: string): number | undefined => {
    const parsed = dollarsToCents(text(name));
    if (parsed === null) return undefined;
    if (Number.isNaN(parsed)) {
      errors[name] = PRICE_MESSAGE;
      return undefined;
    }
    return parsed;
  };
  const amount = (name: string, message: string): number | undefined => {
    const parsed = numberText(text(name));
    if (parsed === null) return undefined;
    if (Number.isNaN(parsed)) {
      errors[name] = message;
      return undefined;
    }
    return parsed;
  };
  const compact = <K extends string>(entries: [K, number | undefined][]): Partial<Record<K, number>> =>
    Object.fromEntries(entries.filter(([, v]) => v !== undefined)) as Partial<Record<K, number>>;

  const statesRaw = values.states;
  const states = (Array.isArray(statesRaw) ? statesRaw : statesRaw ? [statesRaw] : []).map((s) => s.trim().toUpperCase());

  let local: LocalRates | null = null;
  if (text("local_enabled") === "on") {
    const travel = price("local.travel");
    if (travel === undefined && !errors["local.travel"]) errors["local.travel"] = "Enter your truck or travel fee, or 0 if you don't charge one.";
    local = {
      crew_hourly_cents: compact(CREW_SIZES.map((c) => [c, price(`local.crew.${c}`)] as [CrewSize, number | undefined])),
      travel_fee_cents: travel ?? 0,
      hours_by_size: compact(HOME_SIZES.map((s) => [s, amount(`local.hours.${s}`, "Enter hours as a number, such as 5.5.")] as [HomeSize, number | undefined])) as BySize,
      crew_by_size: compact(HOME_SIZES.map((s) => [s, amount(`local.crew_size.${s}`, "Enter a crew size from 2 to 5.")] as [HomeSize, number | undefined])) as BySize,
    };
  }

  let longDistance: LongDistanceRates | null = null;
  if (text("ld_enabled") === "on") {
    longDistance = {
      cwt_cents_by_band: compact(DISTANCE_BANDS.map((b) => [b, price(`ld.cwt.${b}`)] as [DistanceBand, number | undefined])),
      weight_lbs_by_size: compact(HOME_SIZES.map((s) => [s, amount(`ld.weight.${s}`, "Enter pounds as a whole number, such as 4500.")] as [HomeSize, number | undefined])) as BySize,
    };
  }

  const packing = compact(HOME_SIZES.map((s) => [s, price(`svc.packing.${s}`)] as [HomeSize, number | undefined])) as BySize;
  const storage = compact(HOME_SIZES.map((s) => [s, price(`svc.storage.${s}`)] as [HomeSize, number | undefined])) as BySize;
  const specialty = price("svc.specialty");
  const services: ServiceRates = {
    packing_cents_by_size: Object.keys(packing).length ? packing : null,
    storage_cents_per_month_by_size: Object.keys(storage).length ? storage : null,
    specialty_item_cents: specialty ?? null,
  };

  const parsed = rateCardDataSchema.safeParse({ states, local, long_distance: longDistance, services });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = fieldFor(issue.path);
      if (errors[field]) continue;
      errors[field] = friendlyMessage(field, issue);
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, fieldErrors: errors, values };
  return { ok: true, data: parsed.data as RateCardData };
}

function friendlyMessage(field: string, issue: z.core.$ZodIssue): string {
  if (issue.code === "custom") return issue.message;
  if (field === "states") return "Choose at least one state your card covers.";
  if (field.startsWith("local.hours.")) return "Enter typical hours from 0.25 to 48.";
  if (field.startsWith("local.crew_size.")) return "Enter a crew size from 2 to 5.";
  if (field.startsWith("ld.weight.")) return "Enter a weight from 100 to 30,000 pounds.";
  if (field === "local.travel") return "Enter a fee from $0 to $100,000.";
  return "Enter an amount above $0 and up to $100,000.";
}

/** The editor's field values for a stored card (or blank fields for a first card). */
export function rateCardToFormValues(card: RateCardData | null): RateCardFormValues {
  const values: RateCardFormValues = { states: card?.states ?? [] };
  if (!card) return values;
  if (card.local) {
    values.local_enabled = "on";
    for (const c of CREW_SIZES) values[`local.crew.${c}`] = centsToDollars(card.local.crew_hourly_cents[c]);
    values["local.travel"] = centsToDollars(card.local.travel_fee_cents);
    for (const s of HOME_SIZES) {
      values[`local.hours.${s}`] = card.local.hours_by_size[s]?.toString() ?? "";
      values[`local.crew_size.${s}`] = card.local.crew_by_size[s]?.toString() ?? "";
    }
  }
  if (card.long_distance) {
    values.ld_enabled = "on";
    for (const b of DISTANCE_BANDS) values[`ld.cwt.${b}`] = centsToDollars(card.long_distance.cwt_cents_by_band[b]);
    for (const s of HOME_SIZES) values[`ld.weight.${s}`] = card.long_distance.weight_lbs_by_size[s]?.toString() ?? "";
  }
  if (card.services) {
    for (const s of HOME_SIZES) {
      values[`svc.packing.${s}`] = centsToDollars(card.services.packing_cents_by_size?.[s]);
      values[`svc.storage.${s}`] = centsToDollars(card.services.storage_cents_per_month_by_size?.[s]);
    }
    values["svc.specialty"] = centsToDollars(card.services.specialty_item_cents);
  }
  return values;
}

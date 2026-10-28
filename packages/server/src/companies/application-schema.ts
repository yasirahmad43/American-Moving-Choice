/**
 * The company application wizard (mover verification §2): steps, field rules and the shape of
 * company_applications.data. Pure (geography comes in through a lookup function), so every rule
 * is unit-testable and the form and the server share one definition.
 */
import { isStateCode, normalizeEmail, normalizeUsPhone, type StateCode } from "@amc/core";
import { z } from "zod";
import { normalizeMcNumber, normalizeUsdot } from "../auth/signup";
import { capabilitiesSchema } from "../coverage/schema";
import { MOVER_TERMS_VERSION } from "./terms";

export const APPLICATION_STEPS = ["company", "identifiers", "services", "areas", "credentials", "insurance", "representative", "review"] as const;
export type ApplicationStep = (typeof APPLICATION_STEPS)[number];
/** Steps whose answers must be saved before the application can be submitted. */
export const REQUIRED_STEPS = APPLICATION_STEPS.filter((s) => s !== "review");

export const STEP_TITLES: Record<ApplicationStep, string> = {
  company: "Company details",
  identifiers: "Federal numbers",
  services: "Services you offer",
  areas: "Where you work",
  credentials: "State credentials",
  insurance: "Insurance certificate",
  representative: "Authorized representative",
  review: "Review and submit",
};

export const isApplicationStep = (value: unknown): value is ApplicationStep =>
  typeof value === "string" && (APPLICATION_STEPS as readonly string[]).includes(value);

export const AREA_REACH = ["within", "from", "both"] as const;
export type AreaReach = (typeof AREA_REACH)[number];
export const AREA_REACH_LABELS: Record<AreaReach, string> = {
  within: "Moves that start and end in these states",
  from: "Moves that start in these states, to anywhere in the US",
  both: "Moves that start or end in these states, to or from anywhere in the US",
};

export const INSURANCE_COVERAGES = ["cargo", "general_liability", "auto_liability", "workers_comp"] as const;
export type InsuranceCoverage = (typeof INSURANCE_COVERAGES)[number];
export const INSURANCE_COVERAGE_LABELS: Record<InsuranceCoverage, string> = {
  cargo: "Cargo",
  general_liability: "General liability",
  auto_liability: "Auto liability",
  workers_comp: "Workers' compensation",
};

/** State credential rows the form offers. */
export const MAX_STATE_CREDENTIALS = 5;

export interface SchemaContext {
  requireMc: boolean;
  /** The state of a ZIP code in the bundled dataset, or null when unknown. */
  zipState: (zip: string) => StateCode | null;
  /** Today's date (YYYY-MM-DD) in the platform's time zone; injectable for tests. */
  today: string;
}

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `Enter ${label}.` })
    .trim()
    .min(min, `Enter ${label}.`)
    .max(max, `Keep ${label} under ${max} characters.`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters.`)
    .nullish()
    .transform((value) => (value ? value : null));

const PO_BOX = /\b(p\.?\s*o\.?\s*box|post\s+office\s+box|pmb\b|p\.?\s*o\.?\s*drawer)/i;

const stateCode = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .toUpperCase()
    .refine((value) => isStateCode(value), message)
    .transform((value) => value as StateCode);

const phone = (label: string) =>
  z.string({ error: `Enter ${label}.` }).transform((value, ctx) => {
    const normalized = normalizeUsPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: `Enter ${label} as a 10-digit US number, for example (512) 555-0123.` });
      return z.NEVER;
    }
    return normalized;
  });

/** "example.com" → "https://example.com". Only http(s) URLs with a dotted host are kept. */
export function normalizeWebsite(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

const website = z
  .string()
  .nullish()
  .transform((value, ctx) => {
    if (!value?.trim()) return null;
    const normalized = normalizeWebsite(value);
    if (!normalized || normalized.length > 300) {
      ctx.addIssue({ code: "custom", message: "Enter a web address like www.example.com." });
      return z.NEVER;
    }
    return normalized;
  });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const checkbox = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === "on" || value === "true" || value === "yes");

export function companyStepSchema(ctx: SchemaContext) {
  return z
    .object({
      legalName: text(2, 200, "the company's legal name"),
      dbaName: optionalText(200, "the DBA name"),
      addressLine1: text(3, 200, "the street address").refine((v) => !PO_BOX.test(v), "Enter a physical address. We can't accept a PO box or mailbox."),
      addressLine2: optionalText(100, "the second address line"),
      city: text(2, 100, "the city"),
      state: stateCode("Choose the state."),
      zip: z
        .string({ error: "Enter the ZIP code." })
        .trim()
        .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code.")
        .transform((value) => value.slice(0, 5)),
      phone: phone("the company phone number"),
      website,
    })
    .superRefine((value, issue) => {
      if (PO_BOX.test(value.addressLine2 ?? "")) {
        issue.addIssue({ code: "custom", path: ["addressLine2"], message: "Enter a physical address. We can't accept a PO box or mailbox." });
      }
      const zipState = ctx.zipState(value.zip);
      if (!zipState) issue.addIssue({ code: "custom", path: ["zip"], message: "We don't recognize that ZIP code. Check it and try again." });
      else if (zipState !== value.state) issue.addIssue({ code: "custom", path: ["zip"], message: `That ZIP code is in ${zipState}, not ${value.state}.` });
    });
}

export function identifiersStepSchema(ctx: SchemaContext) {
  return z.object({
    usdot: z.string({ error: "Enter the USDOT number." }).transform((value, issue) => {
      const usdot = normalizeUsdot(value);
      if (!usdot) {
        issue.addIssue({ code: "custom", message: "Enter the USDOT number using digits only, for example 1234567." });
        return z.NEVER;
      }
      return usdot;
    }),
    mc: z
      .string()
      .nullish()
      .transform((value, issue) => {
        if (!value?.trim()) {
          if (ctx.requireMc) {
            issue.addIssue({ code: "custom", message: "Enter the MC number. Our network requires one (see the note below)." });
            return z.NEVER;
          }
          return null;
        }
        const mc = normalizeMcNumber(value);
        if (!mc) {
          issue.addIssue({ code: "custom", message: 'Enter the MC number as digits, with or without "MC-", for example MC-123456.' });
          return z.NEVER;
        }
        return mc;
      }),
  });
}

export const servicesStepSchema = () => capabilitiesSchema;

export function areasStepSchema() {
  return z.object({
    states: z
      .array(z.string(), { error: "Choose at least one state." })
      .min(1, "Choose at least one state.")
      .max(102)
      .transform((list, issue) => {
        const states = [...new Set(list.map((s) => s.trim().toUpperCase()))];
        if (states.some((s) => !isStateCode(s))) {
          issue.addIssue({ code: "custom", message: "Choose states from the list." });
          return z.NEVER;
        }
        return (states as StateCode[]).sort();
      }),
    reach: z.enum(AREA_REACH, { error: "Choose which moves you take in these states." }),
  });
}

const credentialRow = (ctx: SchemaContext) =>
  z
    .object({
      state: z.string().nullish(),
      number: z.string().nullish(),
      issuer: z.string().nullish(),
      expiresOn: z.string().nullish(),
    })
    .transform((row) => ({
      state: (row.state ?? "").trim().toUpperCase(),
      number: (row.number ?? "").trim(),
      issuer: (row.issuer ?? "").trim(),
      expiresOn: (row.expiresOn ?? "").trim(),
    }))
    .superRefine((row, issue) => {
      const empty = !row.state && !row.number && !row.issuer && !row.expiresOn;
      if (empty) return;
      if (!isStateCode(row.state)) issue.addIssue({ code: "custom", path: ["state"], message: "Choose the state that issued this credential." });
      if (row.number.length < 2 || row.number.length > 60) issue.addIssue({ code: "custom", path: ["number"], message: "Enter the credential number." });
      if (row.issuer.length > 120) issue.addIssue({ code: "custom", path: ["issuer"], message: "Keep the agency name under 120 characters." });
      if (row.expiresOn) {
        if (!isRealDate(row.expiresOn)) issue.addIssue({ code: "custom", path: ["expiresOn"], message: "Enter the expiry date as a date." });
        else if (row.expiresOn < ctx.today) issue.addIssue({ code: "custom", path: ["expiresOn"], message: "This credential has expired. Renew it before you apply." });
      }
    });

export function credentialsStepSchema(ctx: SchemaContext) {
  return z
    .object({
      noneRequired: checkbox,
      rows: z.array(credentialRow(ctx)).max(MAX_STATE_CREDENTIALS).default([]),
    })
    .transform((value) => ({
      noneRequired: value.noneRequired,
      rows: value.rows
        .filter((row) => row.state || row.number || row.issuer || row.expiresOn)
        .map((row) => ({ state: row.state as StateCode, number: row.number, issuer: row.issuer || null, expiresOn: row.expiresOn || null })),
    }))
    .superRefine((value, issue) => {
      if (!value.noneRequired && value.rows.length === 0) {
        issue.addIssue({ code: "custom", path: ["rows"], message: "Add your state credentials, or tick the box if none apply to your work." });
      }
      if (value.noneRequired && value.rows.length > 0) {
        issue.addIssue({ code: "custom", path: ["noneRequired"], message: "Untick this box, or clear the credential rows." });
      }
      const seen = new Set<string>();
      for (const row of value.rows) {
        const key = `${row.state}:${row.number.toLowerCase()}`;
        if (seen.has(key)) issue.addIssue({ code: "custom", path: ["rows"], message: "The same credential is listed twice." });
        seen.add(key);
      }
    });
}

export function insuranceStepSchema(ctx: SchemaContext) {
  return z.object({
    insurer: text(2, 120, "the insurance company"),
    policyNumber: text(2, 60, "the policy number"),
    expiresOn: z
      .string({ error: "Enter the policy expiry date." })
      .trim()
      .refine(isRealDate, "Enter the policy expiry date.")
      .refine((value) => !isRealDate(value) || value >= ctx.today, "This policy has expired. Add your current certificate."),
    coverages: z
      .array(z.enum(INSURANCE_COVERAGES, { error: "Choose coverage types from the list." }), { error: "Choose what the certificate covers." })
      .min(1, "Choose what the certificate covers.")
      .transform((list) => [...new Set(list)]),
  });
}

export function representativeStepSchema() {
  return z.object({
    name: text(2, 120, "the representative's full name"),
    title: text(2, 120, "their job title"),
    email: z
      .string({ error: "Enter their email address." })
      .trim()
      .max(254, "That email address is too long.")
      .transform(normalizeEmail)
      .pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email address like name@company.com.")),
    phone: phone("their mobile number"),
    attest: checkbox.refine((value) => value, "Confirm that this person can bind the company."),
  });
}

export function reviewStepSchema() {
  return z.object({
    termsVersion: z.literal(MOVER_TERMS_VERSION, { error: "The terms changed while you were reading. Review them again." }),
    acceptTerms: checkbox.refine((value) => value, "Accept the mover terms to submit the application."),
  });
}

export function stepSchema(step: ApplicationStep, ctx: SchemaContext) {
  switch (step) {
    case "company":
      return companyStepSchema(ctx);
    case "identifiers":
      return identifiersStepSchema(ctx);
    case "services":
      return servicesStepSchema();
    case "areas":
      return areasStepSchema();
    case "credentials":
      return credentialsStepSchema(ctx);
    case "insurance":
      return insuranceStepSchema(ctx);
    case "representative":
      return representativeStepSchema();
    case "review":
      return reviewStepSchema();
  }
}

export type CompanyStep = z.output<ReturnType<typeof companyStepSchema>>;
export type IdentifiersStep = z.output<ReturnType<typeof identifiersStepSchema>>;
export type ServicesStep = z.output<ReturnType<typeof servicesStepSchema>>;
export type AreasStep = z.output<ReturnType<typeof areasStepSchema>> & { ruleIds?: string[] };
export type CredentialsStep = z.output<ReturnType<typeof credentialsStepSchema>>;
export type InsuranceStep = z.output<ReturnType<typeof insuranceStepSchema>>;
export type RepresentativeStep = z.output<ReturnType<typeof representativeStepSchema>>;

/** company_applications.data: each saved step's answers. */
export interface ApplicationData {
  company?: CompanyStep;
  identifiers?: IdentifiersStep;
  services?: ServicesStep;
  areas?: AreasStep;
  credentials?: CredentialsStep;
  insurance?: InsuranceStep;
  representative?: RepresentativeStep;
}

export type StepErrors = Record<string, string>;

export type StepParse = { ok: true; data: unknown } | { ok: false; fieldErrors: StepErrors };

/**
 * Validates one step. Field errors are keyed by path joined with "." (for example
 * "rows.0.number"), first message per field.
 */
export function parseStep(step: ApplicationStep, input: unknown, ctx: SchemaContext): StepParse {
  const result = stepSchema(step, ctx).safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: StepErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}

/** The first required step not yet completed, else "review". */
export function nextIncompleteStep(completed: readonly string[]): ApplicationStep {
  return REQUIRED_STEPS.find((step) => !completed.includes(step)) ?? "review";
}

/**
 * Quote survey vocabulary (build plan §7.2; implications §2.1). Values match the database checks
 * in 002_platform.sql (leads.move_size, leads.services, leads.channel_scope) and @amc/core matching.
 */
import type { MoveSize, Service } from "../matching";

/** The steps in implications §2.1 order. Household-move entry points skip "need". */
export const SURVEY_STEPS = ["need", "where", "when", "size", "found", "details", "count", "review"] as const;
export type SurveyStep = (typeof SURVEY_STEPS)[number];

/** Step names as consumers see them (content/README.md §4). */
export const STEP_LABELS: Record<SurveyStep, string> = {
  need: "What you need",
  where: "Where",
  when: "When",
  size: "Size and services",
  found: "What we found",
  details: "Your details",
  count: "How many movers",
  review: "Review and send",
};

/** Step 1 answers. Vehicle-only and truck rental go to information paths (MVP scope §6). */
export const NEEDS = ["household", "loading_help", "vehicle_only", "truck_rental"] as const;
export type Need = (typeof NEEDS)[number];

/** Home sizes offered by the survey, in display order. */
export const SURVEY_MOVE_SIZES = ["studio", "1br", "2br", "3br", "4br_plus", "partial", "office"] as const satisfies readonly MoveSize[];

export const MOVE_SIZE_LABELS: Record<MoveSize, string> = {
  studio: "Studio",
  "1br": "1 bedroom",
  "2br": "2 bedrooms",
  "3br": "3 bedrooms",
  "4br_plus": "4 or more bedrooms",
  partial: "A few items",
  office: "Office",
};

/**
 * Optional services a consumer can ask for. Full service is what a mover does by default, so it is
 * not asked; vehicle shipping is not sold to movers at MVP. labor_only comes from the
 * "loading help only" answer.
 */
export const SURVEY_SERVICES = ["packing", "storage", "specialty_items", "labor_only"] as const satisfies readonly Service[];
export type SurveyService = (typeof SURVEY_SERVICES)[number];

export const SERVICE_LABELS: Record<Service, string> = {
  full_service: "Full service",
  packing: "Packing",
  storage: "Storage",
  specialty_items: "A specialty item, such as a piano",
  labor_only: "Loading and unloading only",
  auto_transport: "Vehicle shipping",
};

/** How movers may contact the consumer (implications §3.1). Stored in leads.channel_scope. */
export const CHANNELS = ["call", "sms", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  call: "Phone calls",
  sms: "Text messages",
  email: "Email",
};

export function isChannel(value: unknown): value is Channel {
  return typeof value === "string" && (CHANNELS as readonly string[]).includes(value);
}

export function isSurveyMoveSize(value: unknown): value is (typeof SURVEY_MOVE_SIZES)[number] {
  return typeof value === "string" && (SURVEY_MOVE_SIZES as readonly string[]).includes(value);
}

export function isSurveyService(value: unknown): value is SurveyService {
  return typeof value === "string" && (SURVEY_SERVICES as readonly string[]).includes(value);
}

/** sessionStorage keys other pages write before sending a visitor to /get-quotes/ (read once, then cleared). */
export const PREFILL_STORAGE_KEY = "amc.survey.prefill";
export const PROFILE_STORAGE_KEY = "amc.survey.profile";
/** The survey's own move-detail draft (never contact details; VD §9.3). */
export const DRAFT_STORAGE_KEY = "amc.survey.draft";

/**
 * amc.survey.prefill: values carried from a calculator, route or cost page. Every value is shown
 * for the visitor to confirm, never silently accepted (implications §2.2).
 */
export interface SurveyPrefill {
  /** "household" opens the survey at Where (implications §2.1). */
  entry?: "household";
  originZip?: string;
  destZip?: string;
  moveSize?: MoveSize;
  services?: Service[];
}

/** amc.survey.profile: the request started from this company's profile (listed first). */
export interface SurveyProfileOrigin {
  companyId: string;
}

/** Form and consent-evidence versions recorded with each request (consent_records). */
export const SURVEY_FORM_VERSION = "survey-v1";
/** Version of the quote pages' script inventory (site architecture §8.8): no third-party tags. */
export const TAG_MANIFEST_VERSION = "tags-v1-none";
export const AB_VARIANT_NONE = "none";

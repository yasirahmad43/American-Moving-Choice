import { cleanZip, isSurveyMoveSize, isSurveyService, parseWhen, parseWhere, type Need, type SurveyService, type SurveyStep } from "@amc/core/src/survey";

/** Only non-contact move answers may be kept between pages or reloads. */
export interface SurveyDraft {
  entry: "full" | "household";
  step: SurveyStep;
  need: Need | null;
  originZip: string;
  destZip: string;
  moveDate: string;
  flexible: boolean;
  latestDate: string;
  moveSize: string;
  services: SurveyService[];
  profileCompanyId: null;
  starterComplete: boolean;
}

export const EMPTY_DRAFT: SurveyDraft = {
  entry: "full", step: "need", need: null, originZip: "", destZip: "", moveDate: "",
  flexible: false, latestDate: "", moveSize: "", services: [], profileCompanyId: null, starterComplete: false,
};
const EARLY_STEPS: SurveyStep[] = ["need", "where", "when", "size"];
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

/** A new completed starter owns its answers; it never inherits another move's intent or flags. */
export function restoreSurveyDraft({ stored, prefill, householdEntry, today }: { stored?: unknown; prefill?: unknown; householdEntry?: boolean; today: string }): { draft: SurveyDraft; prefilled: boolean } {
  const saved = record(stored), carried = record(prefill);
  const draft: SurveyDraft = { ...EMPTY_DRAFT, services: [] };
  if (saved.entry === "household") draft.entry = "household";
  if (typeof saved.need === "string" && ["household", "loading_help", "vehicle_only", "truck_rental"].includes(saved.need)) draft.need = saved.need as Need;
  for (const key of ["originZip", "destZip", "moveDate", "latestDate"] as const) if (typeof saved[key] === "string") draft[key] = saved[key].slice(0, 10);
  draft.flexible = saved.flexible === true;
  if (isSurveyMoveSize(saved.moveSize)) draft.moveSize = saved.moveSize;
  if (Array.isArray(saved.services)) draft.services = saved.services.filter(isSurveyService);
  draft.starterComplete = saved.starterComplete === true && draft.entry === "household";
  // Later screens require a fresh coverage result and contact details, which are never stored.
  if (typeof saved.step === "string") draft.step = EARLY_STEPS.includes(saved.step as SurveyStep) ? saved.step as SurveyStep : "size";

  const hasPrefill = prefill !== null && prefill !== undefined;
  const starter = hasPrefill && (carried.source === "quote-starter" || (carried.entry === "household" && isSurveyMoveSize(carried.moveSize)));
  if (starter) Object.assign(draft, EMPTY_DRAFT, { services: [], entry: "household", need: "household", starterComplete: true });
  else if (hasPrefill || householdEntry) {
    draft.entry = "household";
    draft.need = "household";
    if (draft.step === "need") draft.step = "where";
  }
  if (hasPrefill) {
    if (typeof carried.originZip === "string") draft.originZip = cleanZip(carried.originZip);
    const destination = typeof carried.destZip === "string" ? carried.destZip : carried.destinationZip;
    if (typeof destination === "string") draft.destZip = cleanZip(destination);
    if (isSurveyMoveSize(carried.moveSize)) draft.moveSize = carried.moveSize;
    if (typeof carried.moveDate === "string") draft.moveDate = carried.moveDate.slice(0, 10);
    if (Array.isArray(carried.services)) draft.services = carried.services.filter(isSurveyService);
    draft.step = starter ? "size" : "where";
  }
  if (draft.entry === "household") {
    draft.need = "household";
    if (draft.step === "need") draft.step = "where";
  }
  if (draft.starterComplete) {
    if (!parseWhere(draft).ok) draft.step = "where";
    else if (!parseWhen(draft, today).ok) draft.step = "when";
    else if (!isSurveyMoveSize(draft.moveSize)) { draft.starterComplete = false; draft.step = "size"; }
  }
  return { draft, prefilled: hasPrefill && Boolean(draft.originZip || draft.destZip || draft.moveSize || draft.moveDate) };
}

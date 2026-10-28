import "server-only";

/**
 * Server-side view helpers for the application wizard: form option lists (labels come from
 * @amc/server so client components never import server modules) and the initial form values for
 * a step from the saved answers or the signup prefill.
 */
import {
  AREA_REACH,
  AREA_REACH_LABELS,
  INSURANCE_COVERAGES,
  INSURANCE_COVERAGE_LABELS,
  MAX_STATE_CREDENTIALS,
  type ApplicationView,
} from "@amc/server/companies";
import { MOVE_SIZES, MOVE_SIZE_LABELS, MOVE_TYPES, MOVE_TYPE_LABELS, SERVICES, SERVICE_LABELS } from "@amc/server/coverage";
import { statesList } from "@amc/server/geo";
import type { EditableStep, StepOptions } from "./application-step-form";

export function stepOptions(): StepOptions {
  return {
    states: statesList().map((s) => ({ value: s.code, label: s.name })),
    moveTypes: MOVE_TYPES.map((v) => ({ value: v, label: MOVE_TYPE_LABELS[v] })),
    moveSizes: MOVE_SIZES.map((v) => ({ value: v, label: MOVE_SIZE_LABELS[v] })),
    services: SERVICES.map((v) => ({ value: v, label: SERVICE_LABELS[v] })),
    reach: AREA_REACH.map((v) => ({ value: v, label: AREA_REACH_LABELS[v] })),
    coverages: INSURANCE_COVERAGES.map((v) => ({ value: v, label: INSURANCE_COVERAGE_LABELS[v] })),
  };
}

const s = (v: unknown) => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));
const phoneText = (e164: unknown) => {
  const digits = s(e164).replace(/^\+1/, "");
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : s(e164);
};

/** Initial values for a step's form fields (field names match the step schema). */
export function stepInitialValues(step: EditableStep, view: ApplicationView): Record<string, string | string[]> {
  const d = view.data;
  switch (step) {
    case "company": {
      const c = d.company ?? view.prefill.company;
      return {
        legalName: s(c.legalName),
        dbaName: s(c.dbaName),
        addressLine1: s(c.addressLine1),
        addressLine2: s(c.addressLine2),
        city: s(c.city),
        state: s(c.state),
        zip: s(c.zip),
        phone: d.company ? phoneText(d.company.phone) : s(view.prefill.company.phone),
        website: s(c.website),
      };
    }
    case "identifiers": {
      const i = d.identifiers ?? view.prefill.identifiers;
      return { usdot: s(i.usdot), mc: s(i.mc) };
    }
    case "services":
      return { moveTypes: d.services?.moveTypes ?? [], moveSizes: d.services?.moveSizes ?? [], services: d.services?.services ?? [] };
    case "areas":
      return { states: d.areas?.states ?? [], reach: d.areas?.reach ? [d.areas.reach] : [] };
    case "credentials": {
      const values: Record<string, string> = { noneRequired: d.credentials?.noneRequired ? "on" : "" };
      for (let i = 0; i < MAX_STATE_CREDENTIALS; i++) {
        const row = d.credentials?.rows[i];
        values[`rows.${i}.state`] = s(row?.state);
        values[`rows.${i}.number`] = s(row?.number);
        values[`rows.${i}.issuer`] = s(row?.issuer);
        values[`rows.${i}.expiresOn`] = s(row?.expiresOn);
      }
      return values;
    }
    case "insurance":
      return { insurer: s(d.insurance?.insurer), policyNumber: s(d.insurance?.policyNumber), expiresOn: s(d.insurance?.expiresOn), coverages: d.insurance?.coverages ?? [] };
    case "representative":
      return {
        name: s(d.representative?.name),
        title: s(d.representative?.title),
        email: s(d.representative?.email),
        phone: d.representative ? phoneText(d.representative.phone) : "",
        attest: d.representative?.attest ? "on" : "",
      };
  }
}

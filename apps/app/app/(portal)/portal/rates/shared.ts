/** Shared between the rate-card page, its form and its server action. */
import type { CompanyRole } from "@amc/server/auth";

/** Owners and managers edit the rate card (data-model §2; portal navigation). */
export const RATE_CARD_ROLES: readonly CompanyRole[] = ["owner", "manager"];

export interface RateCardFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string | string[]>;
  attempt?: number;
}

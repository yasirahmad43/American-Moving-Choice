/**
 * Eligibility evaluation (mover verification §1, §3). Pure: given the company's numbers and the
 * latest result of each check, says whether an admin can approve it and whether it can buy leads
 * now. The database enforces purchase eligibility again in company_can_purchase; this helper
 * explains the decision to people.
 */
import { CHECK_LABELS, CHECK_TYPES, type CheckResult, type CheckType } from "./types";

export type CompanyStatus = "applied" | "verifying" | "in_review" | "approved" | "rejected" | "suspended";
export type BillingStatus = "good" | "past_due" | "suspended";

export interface EligibilityInput {
  company: {
    status: CompanyStatus;
    usdotNumber: string | null;
    mcNumber: string | null;
    hasBrokerAuthority: boolean;
    billingStatus: BillingStatus;
    /** Earliest credential expiry (companies.credentials_valid_until); null when none tracked. */
    credentialsValidUntil: Date | string | null;
  };
  /** Another company with the same USDOT number is already approved (one approved account per carrier). */
  usdotAlreadyApproved?: boolean;
  /** Latest result per check type; a missing type has not run yet. */
  checks: Partial<Record<CheckType, CheckResult>>;
  requireMcNumber: boolean;
  today?: Date;
}

export interface EligibilityEvaluation {
  /** Every check passed and nothing blocks: an admin may approve. */
  approvable: boolean;
  /** Meets the purchase conditions right now (mirrors company_can_purchase in SQL). */
  canPurchase: boolean;
  /** Reasons that rule the company out until fixed. */
  blockers: string[];
  /** Checks that failed. */
  failed: CheckType[];
  /** Checks waiting for a reviewer, or not run yet. */
  pending: CheckType[];
}

const isoDay = (value: Date | string) => (typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10));

export function evaluateEligibility(input: EligibilityInput): EligibilityEvaluation {
  const { company, checks, requireMcNumber } = input;
  const today = isoDay(input.today ?? new Date());
  const blockers: string[] = [];
  const failed: CheckType[] = [];
  const pending: CheckType[] = [];

  if (!company.usdotNumber) blockers.push("No USDOT number.");
  if (requireMcNumber && !company.mcNumber) blockers.push("No MC number, which our network requires.");
  if (company.hasBrokerAuthority) blockers.push("Broker authority on record: movers only, no brokers or dual registrations.");
  if (input.usdotAlreadyApproved) blockers.push("Another approved company already uses this USDOT number.");

  for (const type of CHECK_TYPES) {
    const result = checks[type];
    if (result === "fail") {
      failed.push(type);
      blockers.push(`Check failed: ${CHECK_LABELS[type]}.`);
    } else if (result !== "pass") {
      pending.push(type);
    }
  }

  const credentialsValid = company.credentialsValidUntil === null || isoDay(company.credentialsValidUntil) >= today;
  if (!credentialsValid) blockers.push("A credential on file has expired (insurance certificate or state credential).");
  const canPurchase =
    company.status === "approved" &&
    company.billingStatus === "good" &&
    !company.hasBrokerAuthority &&
    company.usdotNumber !== null &&
    (company.mcNumber !== null || !requireMcNumber) &&
    credentialsValid;

  return { approvable: blockers.length === 0 && pending.length === 0, canPurchase, blockers, failed, pending };
}

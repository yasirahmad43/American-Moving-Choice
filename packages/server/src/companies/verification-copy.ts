/**
 * Plain-language explanations of each verification check for the company (mover verification
 * §3). Pure. The company sees what was checked, where, when and what the result means; it never
 * sees raw payloads or reviewer-only notes.
 */
import type { CheckResult, CheckType } from "../verification/types";

export interface CheckCopy {
  label: string;
  /** What the check looks at. */
  what: string;
  /** Meaning of each result, written to the company. */
  results: Record<CheckResult | "not_run", string>;
}

export const CHECK_COPY: Record<CheckType, CheckCopy> = {
  usdot_active: {
    label: "USDOT registration",
    what: "Your USDOT number exists on FMCSA's records, is active and isn't under an out-of-service order.",
    results: {
      pass: "Your USDOT registration is active.",
      fail: "FMCSA's record shows your USDOT registration as inactive or out of service. Fix this with FMCSA, then let us know.",
      needs_review: "We couldn't confirm the registration automatically. A reviewer checks it by hand.",
      not_run: "Runs when you submit your application.",
    },
  },
  identity_match: {
    label: "Name and address match",
    what: "The legal name, DBA and physical address in your application match the FMCSA record.",
    results: {
      pass: "Your application matches the FMCSA record.",
      fail: "Your application doesn't match the FMCSA record.",
      needs_review: "Some details differ from the FMCSA record. A reviewer compares them; you may get a call or email.",
      not_run: "Runs when you submit your application.",
    },
  },
  authority_type: {
    label: "Carrier authority, no broker authority",
    what: "You hold carrier operating authority with household-goods scope, and no broker authority on any docket.",
    results: {
      pass: "You hold carrier authority and no broker authority.",
      fail: "The record shows broker authority, or no carrier authority. Our network accepts moving carriers only.",
      needs_review: "We couldn't confirm the authority type automatically. A reviewer checks it.",
      not_run: "Runs when you submit your application.",
    },
  },
  authority_status: {
    label: "Authority status",
    what: "Your operating authority is granted and active, not pending, revoked or inactive.",
    results: {
      pass: "Your operating authority is active.",
      fail: "Your operating authority isn't active (pending, revoked or inactive).",
      needs_review: "We couldn't confirm the authority status automatically. A reviewer checks it.",
      not_run: "Runs when you submit your application.",
    },
  },
  insurance_filings: {
    label: "Insurance filings",
    what: "The insurance filings your authority requires are on file with FMCSA and active.",
    results: {
      pass: "Your required insurance filings are on file.",
      fail: "A required insurance filing is missing or inactive on the FMCSA record.",
      needs_review: "We couldn't confirm your filings automatically. A reviewer checks them.",
      not_run: "Runs when you submit your application.",
    },
  },
  recent_record_changes: {
    label: "Recent record changes",
    what: "Whether contact, address or officer details on your FMCSA record changed recently. Recent changes get a closer look, because they are a common sign of identity theft.",
    results: {
      pass: "No recent changes that need a closer look.",
      fail: "Recent changes on your record need to be explained before approval.",
      needs_review: "Your record changed recently, or we couldn't tell. A reviewer takes a closer look.",
      not_run: "Runs when you submit your application.",
    },
  },
  callback_verification: {
    label: "Callback to your official phone number",
    what: "A reviewer confirms the application by calling the phone number on your official FMCSA record, not the one in the application.",
    results: {
      pass: "We confirmed your application by phone.",
      fail: "We couldn't confirm the application by phone.",
      needs_review: "A reviewer will call the phone number on your FMCSA record.",
      not_run: "A reviewer calls the phone number on your FMCSA record during review.",
    },
  },
  state_credentials: {
    label: "State credentials",
    what: "The state credentials you listed, checked against each state's lookup.",
    results: {
      pass: "Your state credentials are verified.",
      fail: "A state credential couldn't be verified. You can't receive intrastate requests in that state until it is.",
      needs_review: "A reviewer is checking your state credentials.",
      not_run: "A reviewer checks the state credentials you listed during review.",
    },
  },
  insurance_certificate: {
    label: "Insurance certificate",
    what: "Your certificate of insurance: the named insured matches your company, and the expiry date is recorded.",
    results: {
      pass: "Your insurance certificate is verified.",
      fail: "Your insurance certificate couldn't be verified.",
      needs_review: "A reviewer is checking your insurance certificate.",
      not_run: "A reviewer checks your insurance details during review.",
    },
  },
};

export const RESULT_LABELS: Record<CheckResult | "not_run", string> = {
  pass: "Passed",
  fail: "Didn't pass",
  needs_review: "With a reviewer",
  not_run: "Not checked yet",
};

/** Where a check's evidence came from, in plain words. */
export function sourceLabel(source: string): string {
  switch (source) {
    case "fixture":
      return "FMCSA records (demo data in this preview)";
    case "fmcsa_qcmobile":
      return "FMCSA QCMobile (official carrier records)";
    case "state_lookup":
      return "State licensing lookup";
    case "document":
      return "Document you provided";
    case "manual":
      return "American Moving Choice reviewer";
    default:
      return "American Moving Choice";
  }
}

/** The recheck schedule (mover verification §3), as shown to companies. */
export const RECHECK_SCHEDULE: readonly string[] = [
  "Every week we recheck your USDOT status, operating authority and insurance filings with FMCSA.",
  "We remind you 30, 14 and 7 days before your insurance certificate or a state credential expires, and on the day it does.",
  "Once a year we run a full re-verification, and sooner if someone reports broker activity or a credential problem, or if ownership changes.",
  "If a recheck fails and we can't confirm it, new request purchases and Preferred status pause until it's resolved. Your purchased requests, CRM history and invoices stay available.",
];

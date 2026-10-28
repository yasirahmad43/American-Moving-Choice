/** Shared types for FMCSA lookups and verification checks (mover verification §3). */

/** The nine checks in mover verification §3, as constrained in verification_checks.check_type. */
export const CHECK_TYPES = [
  "usdot_active",
  "identity_match",
  "authority_type",
  "authority_status",
  "insurance_filings",
  "recent_record_changes",
  "callback_verification",
  "state_credentials",
  "insurance_certificate",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

/** Checks runAutomatedChecks derives from the FMCSA record. The others need a person or a document. */
export const AUTOMATED_CHECK_TYPES = [
  "usdot_active",
  "identity_match",
  "authority_type",
  "authority_status",
  "insurance_filings",
  "recent_record_changes",
] as const satisfies readonly CheckType[];
export type AutomatedCheckType = (typeof AUTOMATED_CHECK_TYPES)[number];

export const CHECK_LABELS: Record<CheckType, string> = {
  usdot_active: "USDOT record active",
  identity_match: "Name and address match",
  authority_type: "Carrier authority, no broker authority",
  authority_status: "Authority granted and active",
  insurance_filings: "Insurance filings on record",
  recent_record_changes: "Recent record changes",
  callback_verification: "Callback to the official phone number",
  state_credentials: "State credentials",
  insurance_certificate: "Insurance certificate",
};

export type CheckResult = "pass" | "fail" | "needs_review";

export type VerificationSource = "fixture" | "fmcsa_qcmobile";

export type AuthorityType = "common" | "contract" | "broker";
export type AuthorityScope = "household_goods" | "property";
export type AuthorityStatus = "active" | "pending" | "revoked" | "inactive";

export interface AuthorityGrant {
  /** Docket with prefix, e.g. "MC-123456". */
  docket: string;
  type: AuthorityType;
  scope: AuthorityScope;
  status: AuthorityStatus;
  effectiveFrom?: string | null;
}

export interface CarrierAddress {
  line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

/** A carrier record normalized from either adapter. Unknown facts are null, never guessed. */
export interface FmcsaCarrierRecord {
  usdot: string;
  legalName: string | null;
  dbaName: string | null;
  usdotStatus: "active" | "inactive" | "unknown";
  outOfService: boolean | null;
  physicalAddress: CarrierAddress | null;
  phone: string | null;
  authorities: AuthorityGrant[];
  insurance: {
    bipdOnFile: boolean | null;
    cargoOnFile: boolean | null;
    bondOnFile: boolean | null;
  };
  /** Fields changed on the record recently (fixture data; QCMobile has no history). Null when unknown. */
  recentChanges: string[] | null;
}

export type FmcsaLookup =
  | { status: "found"; record: FmcsaCarrierRecord; source: VerificationSource; sourceUrl: string; retrievedAt: Date; raw: unknown }
  | { status: "not_found"; source: VerificationSource; sourceUrl: string; retrievedAt: Date; raw: unknown }
  /** The adapter cannot answer for this number (fixture range) or the service failed: a person checks. */
  | { status: "unavailable"; reason: string; source: VerificationSource; sourceUrl: string | null; retrievedAt: Date; raw: unknown };

export interface FmcsaAdapter {
  readonly source: VerificationSource;
  lookupCarrier(usdot: string): Promise<FmcsaLookup>;
}

/** The application facts compared with the official record. */
export interface ApplicationFacts {
  legalName: string;
  dbaName: string | null;
  usdot: string | null;
  mcNumber: string | null;
  address: CarrierAddress | null;
  phone: string | null;
}

export interface CheckOutcome {
  checkType: AutomatedCheckType;
  result: CheckResult;
  /** Plain-language explanation stored as decision_note and shown to reviewers. */
  note: string;
  /** Evidence stored as payload_snapshot (hashed into payload_sha256). */
  payload: Record<string, unknown>;
}

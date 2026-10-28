/**
 * Keyed hashes of consumer contact details (leads.email_hash, leads.phone_hash, consent records,
 * contact preferences), for duplicate grouping and opt-outs without comparing raw values.
 *
 * HMAC-SHA256 with HMAC_SECRET, not plain sha256: there are only about 8 × 10^9 US phone numbers,
 * so an unkeyed hash of one can be reversed by trying them all. The result is still personal data:
 * never put it in logs, analytics payloads or URLs. db/seed/build.ts computes the same value
 * (contactHashWith), and a test keeps the two in step.
 */
import { normalizeEmail, normalizeUsPhone } from "@amc/core";
import { hmacSecret } from "../env/env";
import { hmacHex } from "../auth/tokens";

export type ContactKind = "email" | "phone";

/** HMAC of an already normalized value (lowercased email, E.164 phone). */
export function contactHashOfNormalized(kind: ContactKind, normalized: string, secret: string = hmacSecret()): string {
  return hmacHex(secret, `contact:${kind}\u0000${normalized}`);
}

/** Normalizes the email or US phone number, then hashes it. Null when the phone number is not valid. */
export function contactHash(kind: ContactKind, value: string, secret: string = hmacSecret()): string | null {
  const normalized = kind === "email" ? normalizeEmail(value) : normalizeUsPhone(value);
  return normalized ? contactHashOfNormalized(kind, normalized, secret) : null;
}

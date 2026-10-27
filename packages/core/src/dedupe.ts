/** Normalization used for duplicate detection. Contact values are hashed before use as keys. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** US phone to E.164 (+1XXXXXXXXXX) or null when not a plausible NANP number. */
export function normalizeUsPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  // NANP: area code and exchange cannot start with 0 or 1.
  if (/^[01]/.test(d) || /^[01]/.test(d.slice(3))) return null;
  return `+1${d}`;
}

/**
 * A duplicate joins the original's request group. The group's effective sharing limit is the
 * lowest limit the consumer selected, and distinct buyers are counted across the whole group,
 * so resubmitting can never widen distribution.
 */
export function effectiveGroupLimit(selectedLimits: number[]): number {
  if (selectedLimits.length === 0) throw new Error("group has no submissions");
  return Math.min(...selectedLimits);
}

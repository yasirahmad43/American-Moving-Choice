/**
 * The count question, "How many moving companies would you like to hear from?" (implications
 * §2.3; shared pricing §1). Options run from 1 to the admin maximum. Only named movers can buy,
 * so an option above the number of movers available could never fill: it is shown, disabled,
 * with the reason. Nothing is preselected and every option gets equal weight.
 */

export interface CountOption {
  value: number;
  enabled: boolean;
  /** Why a disabled option can't be chosen. */
  reason?: string;
}

export function countOptions(eligibleCount: number, adminMax: number): CountOption[] {
  const max = Math.max(1, Math.floor(adminMax));
  const available = Math.max(0, Math.floor(eligibleCount));
  const options: CountOption[] = [];
  for (let value = 1; value <= max; value++) {
    if (value <= available) {
      options.push({ value, enabled: true });
    } else {
      options.push({
        value,
        enabled: false,
        reason:
          available === 1
            ? "Only 1 mover in our network serves your move."
            : `Only ${available} movers in our network serve your move.`,
      });
    }
  }
  return options;
}

/** The highest number the consumer may choose: min(admin maximum, movers available). */
export function maxSelectableCount(eligibleCount: number, adminMax: number): number {
  return Math.max(0, Math.min(Math.floor(adminMax), Math.floor(eligibleCount)));
}

/** True when `value` is a whole number the count question allows. */
export function isSelectableCount(value: unknown, eligibleCount: number, adminMax: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= maxSelectableCount(eligibleCount, adminMax);
}

/** Intake asks for a contact ceiling, independent of current coverage. */
export function requestCountOptions(adminMax: number): CountOption[] {
  return countOptions(Math.max(1, Math.floor(adminMax)), adminMax);
}

export function isRequestCount(value: unknown, adminMax: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= Math.max(1, Math.floor(adminMax));
}

/** Lead type follows the answer and is fixed at submission (shared pricing §1). */
export function leadTypeFor(limit: number): "exclusive" | "shared" {
  return limit === 1 ? "exclusive" : "shared";
}

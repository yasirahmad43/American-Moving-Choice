/** Formatting shared by Money and AbsoluteDate. Absolute dates only (VD §9.4): never "3 days ago". */

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Integer cents to "$1,234.56" (or "$1,235" with whole: true). */
export function formatMoney(cents: number, options: { whole?: boolean } = {}): string {
  if (!Number.isFinite(cents)) throw new Error("formatMoney: cents must be a finite number");
  const dollars = Math.round(cents) / 100;
  return options.whole ? usdWhole.format(Math.round(dollars)) : usd.format(dollars);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_TIME_ZONE = "America/New_York";

/** A Date from a Date, ISO timestamp or YYYY-MM-DD string (date-only values are UTC midnight). */
export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value);
}

/**
 * "Oct 27, 2026", or "Oct 27, 2026, 3:04 PM EDT" with time. Date-only strings are formatted in UTC
 * so a move date never shifts by a day; timestamps use the given zone (US Eastern by default).
 */
export function formatAbsoluteDate(
  value: Date | string,
  options: { withTime?: boolean; timeZone?: string; month?: "short" | "long" } = {},
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) throw new Error("formatAbsoluteDate: invalid date");
  const dateOnly = typeof value === "string" && DATE_ONLY.test(value);
  const timeZone = dateOnly ? "UTC" : (options.timeZone ?? DEFAULT_TIME_ZONE);
  return new Intl.DateTimeFormat("en-US", {
    month: options.month ?? "short",
    day: "numeric",
    year: "numeric",
    timeZone,
    ...(options.withTime && !dateOnly ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}),
  }).format(date);
}

/** Machine-readable value for <time dateTime>. */
export function isoDateTime(value: Date | string): string {
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;
  return toDate(value).toISOString();
}

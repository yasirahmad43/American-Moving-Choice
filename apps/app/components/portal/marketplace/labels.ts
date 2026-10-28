/** Display labels for marketplace and CRM values (sentence case, plain words). */

export const MOVE_SIZE_LABELS: Record<string, string> = {
  studio: "Studio",
  "1br": "1 bedroom",
  "2br": "2 bedrooms",
  "3br": "3 bedrooms",
  "4br_plus": "4+ bedrooms",
  office: "Office",
  partial: "Partial move",
};

export const MOVE_TYPE_LABELS: Record<string, string> = {
  local: "Local",
  intrastate: "Long-distance, in state",
  interstate: "Long-distance, interstate",
};

export const SOURCE_LABELS: Record<string, string> = {
  organic_search: "Organic search",
  paid_search: "Paid search",
  paid_social: "Paid social",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
};

export const SERVICE_LABELS: Record<string, string> = {
  full_service: "Full service",
  packing: "Packing",
  storage: "Storage",
  auto_transport: "Auto transport",
  labor_only: "Labor only",
  specialty_items: "Specialty items",
};

export const CHANNEL_LABELS: Record<string, string> = { call: "Calls", sms: "Text messages", email: "Email" };

export const LEDGER_KIND_LABELS: Record<string, string> = {
  purchase_charge: "Request purchase",
  credit_spend: "Account credit used",
  sharing_credit: "Shared-request credit",
  quality_refund_credit: "Quality refund (credit)",
  cash_refund: "Refund to card",
  adjustment: "Adjustment",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = { open: "Open", approved: "Approved", rejected: "Rejected", withdrawn: "Withdrawn" };

export const STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD",
  "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export const label = (map: Record<string, string>, value: string | null | undefined) => (value ? (map[value] ?? value) : "Not given");

/** "1st", "2nd", "3rd", "4th". */
export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export function route(o: { city: string | null; state: string | null }, d: { city: string | null; state: string | null }): string {
  const place = (p: { city: string | null; state: string | null }) => [p.city, p.state].filter(Boolean).join(", ") || "Unknown";
  return `${place(o)} to ${place(d)}`;
}

/** "80%" from basis points. */
export const percent = (bp: number) => `${Number.isInteger(bp / 100) ? bp / 100 : (bp / 100).toFixed(1)}%`;

/** The shared-request credit policy in one sentence (shared pricing §3), from the request's factors. */
export function creditPolicySentence(factorsBp: number[]): string {
  const steps = factorsBp.map((bp, i) => (i === 0 ? `${percent(bp)} alone` : `${percent(bp)} with ${i + 1} buyers`)).join(", ");
  return `Each time another mover buys the same shared request, the price steps down for everyone and you get the difference back automatically as account credit: ${steps}.`;
}

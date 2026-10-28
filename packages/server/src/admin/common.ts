/**
 * Shared pieces for the admin services (build plan §5, slice S7): the acting admin, the error type
 * whose message is safe to show, and helpers every decision uses (owner emails, status history).
 *
 * Every service function here assumes the caller has already checked the admin role with
 * requireAdmin({ roles }); each writes its audit_log row in the same transaction as the change.
 */
import type { Queryable } from "../db/pool";

/** The admin making a decision. */
export interface AdminActor {
  userId: string;
  ip?: string | null;
}

/** A decision that can't be made as asked. The message is written for the admin and safe to show. */
export class AdminError extends Error {
  constructor(
    message: string,
    readonly code: string = "invalid",
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export const isAdminError = (error: unknown): error is AdminError => error instanceof AdminError;

/** Active owners' emails for a company; every active member when there is no owner. */
export async function companyContactEmails(db: Queryable, companyId: string): Promise<string[]> {
  const found = await db.query<{ email: string; role: string }>(
    `select u.email, m.role from company_memberships m join users u on u.id = m.user_id
     where m.company_id = $1 and m.status = 'active' order by m.created_at`,
    [companyId],
  );
  const owners = found.rows.filter((r) => r.role === "owner").map((r) => r.email);
  return owners.length ? owners : found.rows.map((r) => r.email);
}

export type CompanyStatus = "applied" | "verifying" | "in_review" | "approved" | "rejected" | "suspended";

/** Appends a company_status_history row. */
export async function recordStatusChange(
  db: Queryable,
  input: { companyId: string; from: CompanyStatus | null; to: CompanyStatus; reason: string | null; changedBy: string | null },
): Promise<void> {
  await db.query(
    "insert into company_status_history (company_id, from_status, to_status, reason, changed_by) values ($1, $2, $3, $4, $5)",
    [input.companyId, input.from, input.to, input.reason, input.changedBy],
  );
}

/** Trims and limits free text from a form; null when empty. */
export function cleanText(value: string | null | undefined, max = 2000): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Requires a non-empty reason or note. */
export function requireText(value: string | null | undefined, what: string, max = 2000): string {
  const text = cleanText(value, max);
  if (!text || text.length < 3) throw new AdminError(`Enter ${what}.`, "missing_text");
  return text;
}

/** Whole dollars or dollars and cents ("95", "95.5", "95.50", "$1,200") to integer cents. */
export function parseDollarsToCents(input: string, options: { allowNegative?: boolean } = {}): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  const pattern = options.allowNegative ? /^[-+]?\d{1,7}(\.\d{1,2})?$/ : /^\+?\d{1,7}(\.\d{1,2})?$/;
  if (!pattern.test(cleaned)) return null;
  const negative = cleaned.startsWith("-");
  const [whole, fraction = ""] = cleaned.replace(/^[-+]/, "").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export const formatCents = (cents: number): string =>
  `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

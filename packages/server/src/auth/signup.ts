/**
 * Company application, step 1 (build plan §11 F; mover verification §2): creates the user, the
 * company (status "applied"), its first status-history row, the owner membership and an audit
 * entry in one transaction. Verification checks run later, from the application flow.
 */
import { normalizeEmail, normalizeUsPhone } from "@amc/core";
import { z } from "zod";
import { audit } from "../audit/audit";
import { tx } from "../db/pool";
import { getSetting } from "../settings/settings";
import { hashPassword, passwordProblem } from "./password";
import { AUTH_RATE_LIMITS, checkRateLimit, rateLimitKey } from "./rate-limit";

/** "USDOT 1234567", "1234567" → "1234567". FMCSA numbers are digits; new ones are random (compliance facts §1). */
export function normalizeUsdot(input: string): string | null {
  const digits = input.replace(/^\s*(us\s*)?dot\s*(no\.?|number|#)?\s*/i, "").replace(/[\s-]/g, "");
  if (!/^\d{1,8}$/.test(digits)) return null;
  const trimmed = digits.replace(/^0+/, "");
  return trimmed || null;
}

/** "MC-123456", "mc 123456", "123456" → "MC-123456". */
export function normalizeMcNumber(input: string): string | null {
  const digits = input.trim().replace(/^mc\s*[-#]?\s*/i, "").replace(/[\s-]/g, "");
  if (!/^\d{1,8}$/.test(digits)) return null;
  const trimmed = digits.replace(/^0+/, "");
  return trimmed ? `MC-${trimmed}` : null;
}

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `Enter ${label}.` })
    .trim()
    .min(min, `Enter ${label}.`)
    .max(max, `Keep ${label} under ${max} characters.`);

/** Field rules for step 1. MC is required while the require_mc_number setting is on. */
export function signupSchema(options: { requireMc: boolean }) {
  return z.object({
    fullName: text(2, 120, "your full name"),
    email: z
      .string({ error: "Enter your work email." })
      .trim()
      .max(254, "That email address is too long.")
      .transform(normalizeEmail)
      .pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter an email address like name@company.com.")),
    password: z.string({ error: "Choose a password." }).superRefine((value, ctx) => {
      const problem = passwordProblem(value);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
    legalName: text(2, 200, "the company's legal name"),
    usdot: z
      .string({ error: "Enter the USDOT number." })
      .transform((value, ctx) => {
        const usdot = normalizeUsdot(value);
        if (!usdot) {
          ctx.addIssue({ code: "custom", message: "Enter the USDOT number using digits only, for example 1234567." });
          return z.NEVER;
        }
        return usdot;
      }),
    mc: z
      .string()
      .optional()
      .transform((value, ctx) => {
        if (!value?.trim()) {
          if (options.requireMc) {
            ctx.addIssue({ code: "custom", message: "Enter the MC number. Our network requires one." });
            return z.NEVER;
          }
          return null;
        }
        const mc = normalizeMcNumber(value);
        if (!mc) {
          ctx.addIssue({ code: "custom", message: "Enter the MC number as digits, with or without \"MC-\", for example MC-123456." });
          return z.NEVER;
        }
        return mc;
      }),
    phone: z
      .string({ error: "Enter the company phone number." })
      .transform((value, ctx) => {
        const phone = normalizeUsPhone(value);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "Enter a 10-digit US phone number, for example (512) 555-0123." });
          return z.NEVER;
        }
        return phone;
      }),
  });
}

export type SignupInput = z.input<ReturnType<typeof signupSchema>>;
export type SignupData = z.output<ReturnType<typeof signupSchema>>;
export type SignupField = keyof SignupData;

export type SignupParse = { ok: true; data: SignupData } | { ok: false; fieldErrors: Partial<Record<SignupField, string>> };

/** Validates raw form input; returns the first message per field. */
export function parseSignup(raw: Record<string, unknown>, options: { requireMc: boolean }): SignupParse {
  const result = signupSchema(options).safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<SignupField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as SignupField | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return { ok: false, fieldErrors };
}

export class SignupError extends Error {
  constructor(
    readonly code: "email_taken" | "invalid",
    readonly fieldErrors: Partial<Record<SignupField, string>> = {},
  ) {
    super(code === "email_taken" ? "An account with this email already exists." : "The application has errors.");
    this.name = "SignupError";
  }
}

/** Per-IP signup limit (build plan §6). Call before signupCompany. */
export async function checkSignupRateLimit(ip: string | null): Promise<boolean> {
  const { limit, windowSeconds } = AUTH_RATE_LIMITS.signupPerIp;
  return (await checkRateLimit(rateLimitKey("signup:ip", ip ?? "unknown"), limit, windowSeconds)).allowed;
}

/**
 * Creates the applicant's user, company, owner membership and audit entry in one transaction.
 * Throws SignupError("invalid") with field messages, or SignupError("email_taken").
 */
export async function signupCompany(
  input: SignupInput,
  meta: { ip?: string | null; bcryptCost?: number } = {},
): Promise<{ userId: string; companyId: string }> {
  const parsed = parseSignup(input, { requireMc: await getSetting("require_mc_number") });
  if (!parsed.ok) throw new SignupError("invalid", parsed.fieldErrors);
  const data = parsed.data;
  const passwordHash = await hashPassword(data.password, meta.bcryptCost);

  return tx(async (client) => {
    const user = await client.query<{ id: string }>(
      `insert into users (email, password_hash, full_name, phone) values ($1, $2, $3, $4)
       on conflict (email) do nothing returning id`,
      [data.email, passwordHash, data.fullName, data.phone],
    );
    const userId = user.rows[0]?.id;
    if (!userId) throw new SignupError("email_taken", { email: "An account with this email already exists. Sign in or reset your password." });

    const company = await client.query<{ id: string }>(
      `insert into companies (legal_name, usdot_number, mc_number, phone, status)
       values ($1, $2, $3, $4, 'applied') returning id`,
      [data.legalName, data.usdot, data.mc, data.phone],
    );
    const companyId = company.rows[0]!.id;
    // Another live company with this USDOT number: let the application through, but flag it for
    // review (only one approved company per USDOT number is allowed; see 002).
    const duplicate = await client.query(
      "select 1 from companies where usdot_number = $1 and id <> $2 and status <> 'rejected' limit 1",
      [data.usdot, companyId],
    );
    const duplicateUsdot = (duplicate.rowCount ?? 0) > 0;
    await client.query(
      `insert into company_status_history (company_id, from_status, to_status, reason, changed_by)
       values ($1, null, 'applied', $3, $2)`,
      [companyId, userId, duplicateUsdot ? "Application started; another company already uses this USDOT number" : "Application started"],
    );
    if (duplicateUsdot) await client.query("update companies set status_reason = 'duplicate_usdot' where id = $1", [companyId]);
    await client.query(
      `insert into company_memberships (company_id, user_id, role, status, can_purchase)
       values ($1, $2, 'owner', 'active', true)`,
      [companyId, userId],
    );
    await audit(
      {
        actorType: "user",
        actorId: userId,
        companyId,
        action: "company.signup",
        entity: "company",
        entityId: companyId,
        after: { status: "applied", legal_name: data.legalName, usdot_number: data.usdot, mc_number: data.mc, duplicate_usdot: duplicateUsdot },
        ip: meta.ip ?? null,
      },
      client,
    );
    return { userId, companyId };
  });
}

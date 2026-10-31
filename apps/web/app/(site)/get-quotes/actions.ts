"use server";

/**
 * Server actions for the quote survey island (build plan §2, §7.2). Next.js checks the Origin of
 * every action request; the services re-validate every value and re-run the matcher.
 */
import { publicRequestMeta } from "@amc/server/public-forms";
import { env } from "@amc/server/env";
import { submitRequest, surveyCoverage, type SubmitResult, type SurveyCoverageResult } from "@amc/server/leads";
import { cookies } from "next/headers";
import { publicSubmissionAllowed, SECURITY_CHECK_MESSAGE } from "@/lib/security/bot-check";
import { CONFIRMATION_COOKIE, CONFIRMATION_COOKIE_MAX_AGE, CONFIRMATION_PATH, confirmationCookieSecure } from "@/components/survey/cookie";

export async function checkCoverageAction(input: unknown): Promise<SurveyCoverageResult> {
  try {
    const { ip } = await publicRequestMeta();
    if (!await publicSubmissionAllowed()) return { ok: false, kind: "invalid", errors: { form: SECURITY_CHECK_MESSAGE } };
    return await surveyCoverage(input, { ip });
  } catch {
    console.error("[public-quote] could not prepare request");
    return { ok: false, kind: "invalid", errors: { form: "We couldn't prepare your request just now. Please try again in a moment." } };
  }
}

export async function submitRequestAction(input: unknown): Promise<SubmitResult> {
  try {
    const { ip, userAgent } = await publicRequestMeta();
    if (!await publicSubmissionAllowed()) return { ok: false, kind: "invalid", errors: { form: SECURITY_CHECK_MESSAGE } };
    const result = await submitRequest(input, { ip, userAgent, pageUrl: `${env().WEB_URL}/get-quotes/` });
    if (result.ok) {
      // The confirmation page reads the request from this short-lived cookie, never from the URL.
      (await cookies()).set(CONFIRMATION_COOKIE, result.manageToken, {
        httpOnly: true,
        secure: confirmationCookieSecure(env().WEB_URL),
        sameSite: "strict",
        path: CONFIRMATION_PATH,
        maxAge: CONFIRMATION_COOKIE_MAX_AGE,
      });
    }
    return result;
  } catch {
    // A driver error can include an entire failing row. Do not expose it through framework logs.
    console.error("[public-quote] could not confirm request");
    return { ok: false, kind: "invalid", errors: { form: "We couldn't confirm your request just now. Please try again in a moment." } };
  }
}

"use server";

/**
 * Server actions for the quote survey island (build plan §2, §7.2). Next.js checks the Origin of
 * every action request; the services re-validate every value and re-run the matcher.
 */
import { requestMeta } from "@amc/server/auth";
import { env } from "@amc/server/env";
import { submitRequest, surveyCoverage, type SubmitResult, type SurveyCoverageResult } from "@amc/server/leads";
import { cookies } from "next/headers";
import { CONFIRMATION_COOKIE, CONFIRMATION_COOKIE_MAX_AGE, CONFIRMATION_PATH, confirmationCookieSecure } from "@/components/survey/cookie";

export async function checkCoverageAction(input: unknown): Promise<SurveyCoverageResult> {
  const { ip } = await requestMeta();
  return surveyCoverage(input, { ip });
}

export async function submitRequestAction(input: unknown): Promise<SubmitResult> {
  const { ip, userAgent } = await requestMeta();
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
}

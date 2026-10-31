import "server-only";
import { checkBotId } from "botid/server";
import { env } from "@amc/server/env";

export const SECURITY_CHECK_MESSAGE = "We couldn't finish the security check. Please try again in a moment. If it still doesn't finish, refresh this page. Nothing was sent.";

/** Only the server decides whether a submission has a valid invisible challenge. */
export async function publicSubmissionAllowed(): Promise<boolean> {
  if (!env().BOT_PROTECTION_ENABLED) return true;
  // Never silently disable an enabled production control on an unsupported host.
  if (process.env.VERCEL !== "1") return process.env.NODE_ENV !== "production";
  try {
    const result = await checkBotId({ advancedOptions: { checkLevel: "basic" } });
    return result.isBot === false && (result.isHuman === true || result.bypassed === true);
  } catch {
    // Provider errors and challenge headers can contain identifiers; never log them.
    console.error("[public-security] verification unavailable");
    return false;
  }
}

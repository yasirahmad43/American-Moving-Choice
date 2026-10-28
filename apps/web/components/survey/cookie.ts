/** The short-lived confirmation cookie (build plan §7.2: never a URL parameter). */
export const CONFIRMATION_COOKIE = "amc_request_confirmation";
export const CONFIRMATION_PATH = "/get-quotes/confirmation/";
/** 30 minutes: long enough to reload the confirmation, short enough not to linger on a shared device. */
export const CONFIRMATION_COOKIE_MAX_AGE = 30 * 60;

/** Secure everywhere except plain-http localhost (local `next start`), where browsers drop it. */
export function confirmationCookieSecure(webUrl: string): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    const url = new URL(webUrl);
    return !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
  } catch {
    return true;
  }
}

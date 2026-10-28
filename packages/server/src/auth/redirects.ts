/**
 * Where to send a user after sign-in (the ?next= parameter). Pure, so tests import it directly.
 *
 * The value is resolved the way a browser would resolve it (dot segments, percent-encoding of
 * non-ASCII) against a placeholder origin, and only a same-origin path survives. Pattern checks on
 * the raw string are not enough: "/x/../\evil.example" passes them, and the browser's URL parser
 * turns it into "//evil.example", an off-site redirect.
 */

const BASE = "https://amc.invalid";
/** Auth pages are never a destination: they would loop or sign the user out. */
const BLOCKED_PATHS = new Set(["/login", "/logout", "/signup", "/mfa", "/mfa/setup"]);
const MAX_LENGTH = 512;

/** Same-site path to return to after login; anything else falls back. Blocks open redirects. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || next.length > MAX_LENGTH || !next.startsWith("/")) return fallback;
  // Backslashes (browsers read them as "/"), control characters, and encoded slashes, backslashes
  // or NULs that a later decoding step could turn into a second leading slash.
  if (/[\u0000-\u001f\u007f\\]/.test(next) || /%(2f|5c|00)/i.test(next)) return fallback;
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE || url.pathname.startsWith("//")) return fallback;
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (BLOCKED_PATHS.has(path)) return fallback;
  const result = url.pathname + url.search + url.hash;
  // Percent-encoding can lengthen the value; keep the header and URL within bounds.
  return result.length <= MAX_LENGTH * 3 ? result : fallback;
}

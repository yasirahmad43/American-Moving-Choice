/** Public-form network identities only; never accept an address from the submitted form. */
import { isIP } from "node:net";
import { checkRateLimit, rateLimitKey } from "../auth/rate-limit";

function ipv6Groups(ip: string): string[] {
  const [left = "", right] = ip.split("::");
  const a = left ? left.split(":") : [], b = right ? right.split(":") : [];
  return right === undefined ? a : [...a, ...Array(8 - a.length - b.length).fill("0"), ...b];
}

/** Canonical address, without chains, ports, zone identifiers or arbitrary header text. */
export function normalizePublicIp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ip = value.trim();
  if (!ip || ip.length > 64 || /[%\s,]/u.test(ip)) return null;
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return null;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const groups = ipv6Groups(canonical).map(group => parseInt(group, 16));
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff) {
    return [groups[6]! >> 8, groups[6]! & 255, groups[7]! >> 8, groups[7]! & 255].join(".");
  }
  return canonical;
}

/** Vercel supplies this protected header. Other deployments cannot assert a proxy IP by name.
 * https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
 */
export function publicClientIp(headers: Pick<Headers, "get">, onVercel: boolean): string | null {
  return onVercel ? normalizePublicIp(headers.get("x-vercel-forwarded-for")) : null;
}

/** IPv6 privacy addresses on one /64 share a counter; the recorded request keeps its exact IP. */
export function publicRateLimitIdentity(value: string | null): string {
  const ip = normalizePublicIp(value);
  if (!ip) return "unknown";
  if (isIP(ip) === 4) return ip;
  return `${ipv6Groups(ip).slice(0, 4).map(group => parseInt(group, 16).toString(16)).join(":")}::/64`;
}

export function publicFormRateLimit(scope: string, ip: string | null, limit: number, windowSeconds: number) {
  return checkRateLimit(rateLimitKey(scope, publicRateLimitIdentity(ip)), limit, windowSeconds);
}

/**
 * Keyless Google reporting: a request-scoped Vercel identity is exchanged for a short-lived
 * federated credential, then for an impersonated service-account token with only read scopes.
 * The Vercel subject token and intermediate STS token are never stored or returned to callers.
 */
import { getVercelOidcToken } from "@vercel/oidc";
import { count, dateTime, readReportingJson, record, ReportingFailure } from "./http";
import type { ReportingConfiguration } from "./types";

export const GOOGLE_REPORTING_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/tagmanager.readonly",
] as const;
const STS_URL = "https://sts.googleapis.com/v1/token";
const CLOUD_EXCHANGE_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const ACCESS_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
const JWT_TYPE = "urn:ietf:params:oauth:token-type:jwt";
export type GoogleSubjectTokenSupplier = () => Promise<string>;

/** Only a full GCP workload provider resource is accepted; no arbitrary URLs/path traversal. */
export function normalizeGoogleFederationAudience(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512) return null;
  const audience = value.trim().replace(/^https:\/\//u, "//");
  return /^\/\/iam\.googleapis\.com\/projects\/[1-9][0-9]{0,19}\/locations\/global\/workloadIdentityPools\/[a-z][a-z0-9-]{3,31}\/providers\/[a-z][a-z0-9-]{3,31}$/u.test(audience) ? audience : null;
}
function bearer(value: unknown, maximum = 4096): string {
  if (typeof value !== "string" || value.length < 16 || value.length > maximum || !/^[A-Za-z0-9._~+/-]+=*$/u.test(value)) {
    throw new ReportingFailure("access_denied");
  }
  return value;
}

export async function exchangeGoogleFederation(
  config: ReportingConfiguration,
  dependencies: { fetch: typeof globalThis.fetch; now: () => number; subjectTokenSupplier?: GoogleSubjectTokenSupplier },
): Promise<{ value: string; expiresAt: number }> {
  try {
    const audience = normalizeGoogleFederationAudience(config.GOOGLE_REPORTING_WORKLOAD_IDENTITY_AUDIENCE);
    const email = config.GOOGLE_REPORTING_CLIENT_EMAIL?.trim() ?? "";
    if (!audience || !/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.iam\.gserviceaccount\.com$/u.test(email)) throw new ReportingFailure("access_denied");

    // Resolve through the SDK inside this request/exchange. Do not cache the returned OIDC token.
    // GCP explicitly allows this Vercel team's default audience; no custom-audience SDK exchange.
    const subject = await (dependencies.subjectTokenSupplier ?? (() => getVercelOidcToken()))();
    if (typeof subject !== "string" || subject.length < 32 || subject.length > 16_384 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(subject)) throw new ReportingFailure("access_denied");

    // STS must not receive an Authorization header. Cloud scope is only for the IAM exchange.
    const intermediate = record(await readReportingJson(dependencies.fetch, STS_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grantType: "urn:ietf:params:oauth:grant-type:token-exchange", audience, scope: CLOUD_EXCHANGE_SCOPE,
        requestedTokenType: ACCESS_TOKEN_TYPE, subjectToken: subject, subjectTokenType: JWT_TYPE,
      }),
    }));
    // Google documents federated STS tokens up to 12 KiB; final reporting tokens keep their own bound.
    const stsValue = bearer(intermediate.access_token, 12_288), expiresIn = count(intermediate.expires_in);
    if (intermediate.token_type !== "Bearer" || intermediate.issued_token_type !== ACCESS_TOKEN_TYPE ||
        !Number.isInteger(expiresIn) || expiresIn < 60 || expiresIn > 3600 ||
        intermediate.scope !== undefined && intermediate.scope !== CLOUD_EXCHANGE_SCOPE) throw new ReportingFailure("access_denied");

    const result = record(await readReportingJson(dependencies.fetch,
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(email)}:generateAccessToken`, {
        method: "POST", headers: { Authorization: `Bearer ${stsValue}`, "Content-Type": "application/json" },
        body: JSON.stringify({ scope: [...GOOGLE_REPORTING_SCOPES], lifetime: "3600s" }),
      }));
    const value = bearer(result.accessToken), expires = dateTime(result.expireTime);
    const now = dependencies.now(), expiry = expires ? Date.parse(expires) : NaN;
    // Permit modest provider/server clock skew, but never cache beyond an hour or through expiry.
    if (!Number.isFinite(expiry) || expiry <= now + 60_000 || expiry > now + 3_660_000) throw new ReportingFailure("access_denied");
    return { value, expiresAt: Math.min(expiry, now + 3_600_000) - 60_000 };
  } catch (error) {
    // SDK/JSON/crypto errors can contain credentials. Only our constant error type can escape.
    if (error instanceof ReportingFailure && error.httpStatus !== 400) throw error;
    throw new ReportingFailure("access_denied");
  }
}

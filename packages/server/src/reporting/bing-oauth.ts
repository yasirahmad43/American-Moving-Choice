import { count, record, ReportingFailure } from "./http";

export const BING_TOKEN_URL = "https://www.bing.com/webmasters/oauth/token";
export const BING_READ_SCOPE = "webmaster.read" as const;

export interface BingTokenGrant {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

function opaqueToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 16_384 && /^[\x21-\x7e]+$/.test(value);
}

/** Scope omission means unchanged requested scope in OAuth; any returned broader scope is rejected. */
export function parseBingTokenGrant(value: unknown, now: number, previousRefreshToken?: string): BingTokenGrant {
  const response = record(value);
  if (response.error !== undefined ||
      (response.scope !== undefined && (typeof response.scope !== "string" || response.scope.trim().toLowerCase() !== BING_READ_SCOPE))) {
    throw new ReportingFailure("access_denied");
  }
  const access = response.access_token;
  const refresh = response.refresh_token ?? previousRefreshToken;
  const expires = count(response.expires_in);
  if (!opaqueToken(access) || !/^[A-Za-z0-9._~+/-]+=*$/.test(access) || !opaqueToken(refresh) ||
      typeof response.token_type !== "string" || response.token_type.toLowerCase() !== "bearer" ||
      !Number.isInteger(expires) || expires < 1 || expires > 86_400) {
    throw new ReportingFailure("access_denied");
  }
  return { accessToken: access, refreshToken: refresh, expiresAt: new Date(now + expires * 1000) };
}

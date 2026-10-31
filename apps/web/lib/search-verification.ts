import type { Metadata } from "next";

export interface SearchVerificationConfig {
  SITE_INDEXABLE: boolean;
  GOOGLE_SITE_VERIFICATION?: string;
  BING_SITE_VERIFICATION?: string;
  INDEXNOW_KEY?: string;
}

const ownershipToken = (value: string | undefined): string | undefined => {
  const token = value?.trim();
  return token && /^[A-Za-z0-9_-]{8,256}$/u.test(token) ? token : undefined;
};

/** Ownership proofs contain tokens only, and are absent from non-indexable previews. */
export function searchVerificationMetadata(config: SearchVerificationConfig): Metadata["verification"] {
  if (!config.SITE_INDEXABLE) return undefined;
  const google = ownershipToken(config.GOOGLE_SITE_VERIFICATION);
  const bing = ownershipToken(config.BING_SITE_VERIFICATION);
  if (!google && !bing) return undefined;
  return { ...(google ? { google } : {}), ...(bing ? { other: { "msvalidate.01": bing } } : {}) };
}

/** IndexNow keys are intentionally public ownership proofs, never account credentials. */
export function indexNowKeyResponse(config: SearchVerificationConfig): Response {
  const key = config.INDEXNOW_KEY?.trim();
  if (!config.SITE_INDEXABLE || !key || !/^[A-Za-z0-9-]{8,128}$/u.test(key)) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  }
  return new Response(key, { headers: {
    "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300",
    "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow",
  } });
}

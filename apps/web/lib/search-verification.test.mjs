import { describe, expect, it } from "vitest";
import { indexNowKeyResponse, searchVerificationMetadata } from "./search-verification.ts";

describe("public search ownership proofs", () => {
  const config = { SITE_INDEXABLE: true, GOOGLE_SITE_VERIFICATION: "google-real-token_123", BING_SITE_VERIFICATION: "A123456789ABCDEF0123456789ABCDEF", INDEXNOW_KEY: "public-indexnow-key-1234" };
  it("emits the exact Google/Bing metadata names on an indexable site", () => {
    expect(searchVerificationMetadata(config)).toEqual({ google: config.GOOGLE_SITE_VERIFICATION, other: { "msvalidate.01": config.BING_SITE_VERIFICATION } });
    expect(searchVerificationMetadata({ SITE_INDEXABLE: true })).toBeUndefined();
  });
  it("does not emit verification or IndexNow proof on a non-indexable preview", async () => {
    expect(searchVerificationMetadata({ ...config, SITE_INDEXABLE: false })).toBeUndefined();
    const response = indexNowKeyResponse({ ...config, SITE_INDEXABLE: false });
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(config.INDEXNOW_KEY);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("serves only the public key as UTF-8 text, and never substitutes an account credential", async () => {
    const response = indexNowKeyResponse(config);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe(config.INDEXNOW_KEY);
    for (const key of [undefined, "short", "invalid_key_1234", "<script>bad</script>", "a".repeat(129)]) expect(indexNowKeyResponse({ SITE_INDEXABLE: true, INDEXNOW_KEY: key }).status).toBe(404);
  });
  it("rejects full HTML tags and malformed ownership values", () => {
    expect(searchVerificationMetadata({ SITE_INDEXABLE: true, GOOGLE_SITE_VERIFICATION: '<meta name="google-site-verification" content="token">', BING_SITE_VERIFICATION: "not a token" })).toBeUndefined();
  });
});

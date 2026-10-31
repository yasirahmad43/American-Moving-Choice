import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetDatabase } from "../../test/helpers";
import { closePool, getPool } from "../db/pool";
import { normalizePublicIp, publicClientIp, publicFormRateLimit, publicRateLimitIdentity } from "./guards";

beforeAll(resetDatabase);
afterAll(closePool);

describe("anonymous form network boundary", () => {
  it("trusts only the platform-owned Vercel address header on that platform", () => {
    const headers = new Headers({ "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.99", "x-real-ip": "192.0.2.20", "cf-connecting-ip": "192.0.2.21" });
    expect(publicClientIp(headers, true)).toBe("203.0.113.8");
    expect(publicClientIp(headers, false)).toBeNull();
    headers.delete("x-vercel-forwarded-for");
    expect(publicClientIp(headers, true)).toBeNull();
    headers.set("x-vercel-forwarded-for", "not-an-ip");
    expect(publicClientIp(headers, true)).toBeNull();
  });
  it("rejects forged chains, hostnames, ports, IPv6 zones and oversized values", () => {
    for (const ip of ["203.0.113.1, 198.51.100.1", "example.com", "203.0.113.1:443", "[2001:db8::1]", "fe80::1%eth0", "198.51.100.1\nX-Forged: yes", "x".repeat(1000), null]) expect(normalizePublicIp(ip)).toBeNull();
  });
  it("canonicalizes IPv6 and IPv4-mapped addresses without changing the client identity", () => {
    expect(normalizePublicIp(" 198.51.100.1 ")).toBe("198.51.100.1");
    expect(normalizePublicIp("2001:0DB8:0001:0002:0000:0000:0000:0001")).toBe("2001:db8:1:2::1");
    expect(normalizePublicIp("::ffff:198.51.100.1")).toBe("198.51.100.1");
    expect(publicRateLimitIdentity("::ffff:c633:6401")).toBe(publicRateLimitIdentity("198.51.100.1"));
  });
  it("groups rotating IPv6 privacy addresses in one /64 without merging other networks", () => {
    expect(publicRateLimitIdentity("2001:db8:1234:5678::1")).toBe(publicRateLimitIdentity("2001:0db8:1234:5678:abcd:abcd:abcd:abcd"));
    expect(publicRateLimitIdentity("2001:db8:1234:5678::1")).not.toBe(publicRateLimitIdentity("2001:db8:1234:5679::1"));
  });
  it("counts absent and malformed addresses in the same HMAC bucket instead of bypassing limits", async () => {
    expect((await publicFormRateLimit("public_test:missing", null, 2, 3600)).allowed).toBe(true);
    expect((await publicFormRateLimit("public_test:missing", "forged-header", 2, 3600)).allowed).toBe(true);
    expect((await publicFormRateLimit("public_test:missing", null, 2, 3600)).allowed).toBe(false);
  });
  it("limits one IPv6 network across changing suffixes and retains no raw IP in the counter key", async () => {
    const a = "2001:db8:4321:1000::1", b = "2001:db8:4321:1000::2";
    expect((await publicFormRateLimit("public_test:ipv6", a, 1, 3600)).allowed).toBe(true);
    expect((await publicFormRateLimit("public_test:ipv6", b, 1, 3600)).allowed).toBe(false);
    expect((await publicFormRateLimit("public_test:ipv6", "2001:db8:4321:1001::1", 1, 3600)).allowed).toBe(true);
    const keys = (await getPool().query<{ key: string }>("select key from rate_limits where key like 'public_test:%'")).rows;
    expect(keys.length).toBeGreaterThan(0);
    for (const { key } of keys) { expect(key).toMatch(/^public_test:[a-z0-9]+:[a-f0-9]{32}$/u); expect(key).not.toContain("2001:db8"); }
  });
});

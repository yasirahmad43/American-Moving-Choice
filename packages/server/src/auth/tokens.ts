/**
 * Token primitives. Raw tokens go to the user (cookie or link); the database stores only their
 * sha256 hex, so a database leak does not reveal usable tokens (build plan §6).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** 32 random bytes, base64url (43 characters). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/** True when the value has the shape of a token from newToken(); cheap rejection of garbage. */
export function isTokenShaped(value: unknown): value is string {
  return typeof value === "string" && TOKEN_SHAPE.test(value);
}

/** Lowercase sha256 hex of a UTF-8 string. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** HMAC-SHA256 hex. Used to key identifiers (emails, IPs) without storing them. */
export function hmacHex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

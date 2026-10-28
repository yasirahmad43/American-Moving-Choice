/**
 * AES-256-GCM with APP_ENCRYPTION_KEY, for TOTP secrets at rest and sealed short-lived tokens.
 * Format: "v1.<iv>.<tag>.<ciphertext>", each part base64url. The associated data (aad) binds a
 * ciphertext to its purpose and owner, so a value copied to another user's row fails to decrypt.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class DecryptionError extends Error {
  constructor() {
    super("Could not decrypt value");
    this.name = "DecryptionError";
  }
}

export function encrypt(plaintext: string, key: Buffer, aad: string): string {
  if (key.length !== 32) throw new Error("encryption key must be 32 bytes");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decrypt(sealed: string, key: Buffer, aad: string): string {
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new DecryptionError();
  const [, ivText, tagText, dataText] = parts as [string, string, string, string];
  const iv = Buffer.from(ivText, "base64url");
  const tag = Buffer.from(tagText, "base64url");
  // Node accepts truncated GCM tags unless told the length; a 4-byte tag would be forgeable.
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new DecryptionError();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(dataText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new DecryptionError();
  }
}

/** Seals a JSON value with an issue time; open it with openSealed and a maximum age. */
export function seal(value: unknown, key: Buffer, purpose: string): string {
  return encrypt(JSON.stringify({ v: value, iat: Date.now() }), key, `sealed:${purpose}`);
}

/** Opens a value from seal(). Null when tampered with, for another purpose, or older than maxAgeMs. */
export function openSealed<T>(sealed: string, key: Buffer, purpose: string, maxAgeMs: number): T | null {
  try {
    const parsed = JSON.parse(decrypt(sealed, key, `sealed:${purpose}`)) as { v: T; iat: number };
    if (typeof parsed.iat !== "number" || Date.now() - parsed.iat > maxAgeMs || parsed.iat > Date.now() + 60_000) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

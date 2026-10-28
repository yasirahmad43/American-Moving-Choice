/**
 * Request reference codes such as AMC-7K3P-9QXD: Crockford base32 (digits and capitals without
 * I, L, O or U), so a code read over the phone can't be confused. Same alphabet and shape as the
 * database default generate_reference_code() in 002_platform.sql.
 */

export const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const REFERENCE_PATTERN = /^AMC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export type RandomBytes = (length: number) => Uint8Array;

/** Cryptographically random bytes from Web Crypto (browsers and Node 22). */
export const secureRandomBytes: RandomBytes = (length) => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

export function generateReferenceCode(random: RandomBytes = secureRandomBytes): string {
  // 256 is a multiple of 32, so byte % 32 is uniform over the alphabet.
  const chars = Array.from(random(8), (byte) => REFERENCE_ALPHABET[byte % 32]!);
  return `AMC-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function isReferenceCode(value: unknown): value is string {
  return typeof value === "string" && REFERENCE_PATTERN.test(value);
}

/** TOTP (RFC 6238) with otpauth: 6 digits, 30-second period, SHA-1, as authenticator apps expect. */
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export const TOTP_ISSUER = "American Moving Choice";

/** A new random base32 secret (160 bits). */
export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function totp(secret: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/** otpauth:// URI for authenticator apps (encoded in the QR code). */
export function totpUri(secret: string, accountLabel: string): string {
  return totp(secret, accountLabel).toString();
}

/** Normalizes user input ("123 456" → "123456"); null if it is not six digits. */
export function normalizeTotpCode(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

export const TOTP_PERIOD_SECONDS = 30;

/** The TOTP time step (counter) at a moment. */
export function totpStep(timestamp: number = Date.now()): number {
  return Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);
}

/**
 * The time step a code belongs to, accepting one period of clock drift either way, or null when
 * it matches none. Callers store the step and refuse any code whose step is not newer than the
 * last one accepted, so a code works once (RFC 6238 §5.2).
 */
export function matchTotpStep(secret: string, code: string, window = 1, timestamp: number = Date.now()): number | null {
  const token = normalizeTotpCode(code);
  if (!token) return null;
  const delta = totp(secret, "verify").validate({ token, window, timestamp });
  return delta === null ? null : totpStep(timestamp) + delta;
}

/** Checks a code against the secret (no replay protection; see matchTotpStep). */
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  return matchTotpStep(secret, code, window) !== null;
}

/** The current code for a secret (tests and demo tooling only). */
export function currentTotp(secret: string): string {
  return totp(secret, "current").generate();
}

/** PNG data URL of a QR code for the otpauth URI. */
export function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 1, width: 240 });
}

/** Password hashing with bcryptjs (cost 12, build plan §5) and the password policy. */
import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 12;
/** bcrypt ignores everything after 72 bytes, so longer passwords are refused rather than truncated. */
export const PASSWORD_MAX_BYTES = 72;

/**
 * A valid cost-12 hash of a random string nobody knows. Comparing against it when an email has no
 * account keeps response times the same, so timing does not reveal which emails are registered.
 */
const DUMMY_HASH = "$2b$12$.FVb27zh9lbOhUdoAsl9OuDTVA0qTPUYYeGKH.vTQrAlTN5B6PMtm";

/** Why a password is not acceptable, or null when it is. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) return `Use at most ${PASSWORD_MAX_BYTES} bytes (about ${PASSWORD_MAX_BYTES} characters).`;
  if (!password.trim()) return "The password can't be only spaces.";
  return null;
}

export async function hashPassword(password: string, cost: number = BCRYPT_COST): Promise<string> {
  const problem = passwordProblem(password);
  if (problem) throw new Error(`Password rejected: ${problem}`);
  return bcrypt.hash(password, cost);
}

/** Compares a password with a stored hash. A null hash (no password set) runs the dummy comparison. */
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Spends the same time as a real comparison without checking anything (unknown emails). */
export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

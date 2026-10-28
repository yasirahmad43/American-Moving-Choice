/**
 * Prints a SCRAM-SHA-256 verifier for a role password, so only the verifier (never the password)
 * goes into the SQL that db/supabase/bootstrap.sql runs on Supabase. Postgres stores a password
 * given in this form as is (RFC 5802 / RFC 7677; the format of pg_authid.rolpassword).
 *
 * Usage: AMC_APP_PASSWORD=… pnpm --filter @amc/db scram-verifier
 *    or: pnpm --filter @amc/db scram-verifier --generate   (makes a random password, prints both)
 */
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

export const SCRAM_ITERATIONS = 4096;

export function scramSha256Verifier(password: string, salt: Buffer = randomBytes(16), iterations = SCRAM_ITERATIONS): string {
  // SASLprep is skipped: callers use generated ASCII passwords, which SASLprep leaves unchanged.
  if (!/^[\x21-\x7e]+$/.test(password)) throw new Error("Use a password of printable ASCII characters without spaces");
  const salted = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const storedKey = createHash("sha256").update(clientKey).digest();
  const serverKey = createHmac("sha256", salted).update("Server Key").digest();
  return `SCRAM-SHA-256$${iterations}:${salt.toString("base64")}$${storedKey.toString("base64")}:${serverKey.toString("base64")}`;
}

function main(): void {
  const generate = process.argv.includes("--generate");
  const password = generate ? randomBytes(24).toString("base64url") : process.env.AMC_APP_PASSWORD;
  if (!password) throw new Error("Set AMC_APP_PASSWORD, or pass --generate");
  if (generate) console.log(`password (put it in DATABASE_URL, then forget it here): ${password}`);
  console.log(scramSha256Verifier(password));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

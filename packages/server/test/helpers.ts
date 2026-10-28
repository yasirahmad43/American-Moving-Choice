import { listMigrations } from "@amc/db/scripts/lib";
import bcrypt from "bcryptjs";
import { getPool } from "../src/db/pool";
import { decryptSecretBody } from "../src/outbox/outbox";

/** Recreates the public schema of the test database and applies every migration in order. */
export async function resetDatabase(): Promise<void> {
  const pool = getPool();
  await pool.query("drop schema public cascade; create schema public;");
  for (const migration of listMigrations()) await pool.query(migration.sql);
}

/** Inserts a user with a low-cost bcrypt hash (fast tests). Returns the user ID. */
export async function createUser(input: { email: string; password?: string; admin?: string; fullName?: string }): Promise<string> {
  const pool = getPool();
  const hash = input.password ? await bcrypt.hash(input.password, 4) : null;
  const result = await pool.query<{ id: string }>(
    "insert into users (email, password_hash, full_name) values ($1, $2, $3) returning id",
    [input.email, hash, input.fullName ?? "Test User"],
  );
  const id = result.rows[0]!.id;
  if (input.admin) await pool.query("insert into admin_users (user_id, admin_role) values ($1, $2)", [id, input.admin]);
  return id;
}

/** The raw token from a link like https://…/reset-password/<token> in a message body. */
export function tokenFromLink(body: string, path: string): string {
  const match = new RegExp(`${path}/([A-Za-z0-9_-]{43})`).exec(body);
  if (!match?.[1]) throw new Error(`No ${path} link in message`);
  return match[1];
}

/** The raw token from the encrypted deliverable body of an outbox message (body_text is redacted). */
export async function tokenFromMessage(messageWhere: string, params: unknown[], path: string): Promise<string> {
  const found = await getPool().query<{ id: string; body_text: string; body_secret_enc: string | null }>(
    `select id, body_text, body_secret_enc from messages where ${messageWhere} order by created_at desc limit 1`,
    params,
  );
  const row = found.rows[0];
  if (!row?.body_secret_enc) throw new Error("No message with an encrypted body");
  if (row.body_text.includes(`${path}/`)) throw new Error("body_text must not contain the link");
  return tokenFromLink(decryptSecretBody(row.id, row.body_secret_enc), path);
}

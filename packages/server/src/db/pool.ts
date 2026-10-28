/**
 * Postgres access: one small pool per server instance, query helpers, transactions and the
 * per-company transaction used by tables with forced row-level security (build plan §4, §5).
 */
import pg from "pg";
import { databaseUrl, env } from "../env/env";
import { EnvError } from "../env/schema";

/** Anything that can run a query: the pool or a client inside a transaction. */
export interface Queryable {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]): Promise<pg.QueryResult<R>>;
}

declare global {
  // Reused across hot reloads in development so each edit does not open a new pool.
  var __amcPool: pg.Pool | undefined;
}

/**
 * pg lets parameters in the connection string override the config object, so an sslmode in a
 * provider's URL would silently replace the ssl setting below. Strip the SSL parameters whenever
 * DATABASE_SSL decides.
 */
export function connectionStringFor(url: string, sslMode: "disable" | "require" | "verify"): string {
  if (sslMode === "disable") return url;
  const parsed = new URL(url);
  for (const key of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) parsed.searchParams.delete(key);
  return parsed.toString();
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function poolConfig(): pg.PoolConfig {
  const e = env();
  if (e.NODE_ENV === "production" && e.DATABASE_SSL === "disable" && !LOCAL_HOSTS.has(new URL(databaseUrl()).hostname)) {
    // Supabase accepts plaintext connections unless told otherwise; never send credentials and
    // contact data over one by accident.
    throw new EnvError(["DATABASE_SSL: must be require or verify in production for a database that is not on localhost"]);
  }
  const config: pg.PoolConfig = {
    connectionString: connectionStringFor(databaseUrl(), e.DATABASE_SSL),
    max: e.DATABASE_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    application_name: "amc",
  };
  if (e.DATABASE_SSL === "require") {
    // Encrypt without verifying the server certificate. Supabase's pooler presents a certificate
    // from Supabase's own CA, which is not in Node's trust store, so verification would fail unless
    // that CA is installed. The tradeoff: traffic is protected from passive eavesdropping, but an
    // active man-in-the-middle on the network path could impersonate the database. Use "verify"
    // (with the CA available, e.g. via NODE_EXTRA_CA_CERTS) where that risk matters.
    config.ssl = { rejectUnauthorized: false };
  } else if (e.DATABASE_SSL === "verify") {
    // Verify against DATABASE_SSL_CA (Supabase's CA certificate) when given, else Node's trust store.
    config.ssl = e.DATABASE_SSL_CA ? { ca: e.DATABASE_SSL_CA, rejectUnauthorized: true } : { rejectUnauthorized: true };
  }
  return config;
}

/** The shared pool, created on first use. */
export function getPool(): pg.Pool {
  if (!globalThis.__amcPool) {
    const pool = new pg.Pool(poolConfig());
    // An idle client can error (for example when the server restarts). Log the code only:
    // driver messages can include host names.
    pool.on("error", (error: Error & { code?: string }) => {
      console.error(`[db] idle client error${error.code ? ` (${error.code})` : ""}`);
    });
    // Direct pool.query calls (outside these helpers) get sanitized errors too.
    const rawQuery = pool.query.bind(pool) as (...args: unknown[]) => unknown;
    (pool as unknown as { query: (...args: unknown[]) => unknown }).query = (...args: unknown[]) => {
      const result = rawQuery(...args);
      return result instanceof Promise ? result.catch((error: unknown) => Promise.reject(sanitizeDbError(error))) : result;
    };
    globalThis.__amcPool = pool;
  }
  return globalThis.__amcPool;
}

/** Closes the pool (tests and scripts). The next query opens a new one. */
export async function closePool(): Promise<void> {
  const pool = globalThis.__amcPool;
  globalThis.__amcPool = undefined;
  await pool?.end();
}

/**
 * A database error without the parts that can carry personal data. Postgres puts the whole failing
 * row in `detail` (names, emails, phone numbers) and the statement in `where`/`internalQuery`, and
 * Next.js logs thrown errors with their enumerable properties, so a raw driver error from a page
 * or action would write contact data to the server logs (build plan §5). DbError keeps the SQLSTATE
 * code, constraint, table, column and message. Outside production the original error stays
 * reachable as the non-enumerable `original` for debugging.
 */
export class DbError extends Error {
  readonly code: string;
  readonly constraint?: string;
  readonly table?: string;
  readonly column?: string;
  readonly schema?: string;
  declare readonly original?: unknown;

  constructor(source: { message: string; code: string; constraint?: string; table?: string; column?: string; schema?: string }, original?: unknown) {
    super(source.message);
    this.name = "DbError";
    this.code = source.code;
    if (source.constraint) this.constraint = source.constraint;
    if (source.table) this.table = source.table;
    if (source.column) this.column = source.column;
    if (source.schema) this.schema = source.schema;
    if (original !== undefined && process.env.NODE_ENV !== "production") {
      Object.defineProperty(this, "original", { value: original, enumerable: false });
    }
  }
}

/** Converts a driver error into a DbError; anything else passes through unchanged. */
export function sanitizeDbError(error: unknown): unknown {
  if (error instanceof DbError) return error;
  // Duck-typed as well as instanceof, in case two copies of pg-protocol are loaded.
  const fromServer = error instanceof pg.DatabaseError || (error instanceof Error && "severity" in error && "routine" in error);
  if (fromServer && typeof (error as { code?: unknown }).code === "string") {
    const e = error as pg.DatabaseError;
    return new DbError({ message: e.message, code: e.code!, constraint: e.constraint, table: e.table, column: e.column, schema: e.schema }, error);
  }
  return error;
}

async function sanitized<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    throw sanitizeDbError(error);
  }
}

export async function query<R extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
  db: Queryable = getPool(),
): Promise<pg.QueryResult<R>> {
  return sanitized(db.query<R>(text, values));
}

/** The first row, or null. */
export async function one<R extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
  db: Queryable = getPool(),
): Promise<R | null> {
  const result = await sanitized(db.query<R>(text, values));
  return result.rows[0] ?? null;
}

/** Every row. */
export async function many<R extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
  db: Queryable = getPool(),
): Promise<R[]> {
  const result = await sanitized(db.query<R>(text, values));
  return result.rows;
}

/** Runs fn inside a transaction on one client: commit on success, rollback on any error. */
export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>, pool: pg.Pool = getPool()): Promise<T> {
  const client = await pool.connect();
  let broken = false;
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      broken = true; // the connection is unusable; destroy it instead of returning it to the pool
    }
    throw sanitizeDbError(error);
  } finally {
    client.release(broken);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/**
 * A transaction scoped to one company: sets app.company_id for this transaction only, which the
 * forced row-level security policies on crm_records, crm_activities and crm_notes key on. The
 * caller must already have checked that the user may act for this company.
 */
export async function withCompany<T>(
  companyId: string,
  fn: (client: pg.PoolClient) => Promise<T>,
  pool: pg.Pool = getPool(),
): Promise<T> {
  if (!isUuid(companyId)) throw new Error("withCompany: companyId must be a UUID");
  return tx(async (client) => {
    await client.query("select set_config('app.company_id', $1, true)", [companyId]);
    return fn(client);
  }, pool);
}

/** Postgres error with SQLSTATE code and, for constraint violations, the constraint name. */
export interface PgError extends Error {
  code: string;
  constraint?: string;
}

export function isPgError(error: unknown): error is PgError {
  return error instanceof Error && typeof (error as Partial<PgError>).code === "string";
}

/** True for a unique violation, optionally on one named constraint. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  return isPgError(error) && error.code === "23505" && (!constraint || error.constraint === constraint);
}

/** The message of an exception raised by a database function (SQLSTATE P0001), e.g. "sold_out". */
export function raisedMessage(error: unknown): string | null {
  return isPgError(error) && error.code === "P0001" ? error.message : null;
}

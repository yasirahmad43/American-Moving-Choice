import "server-only";

export {
  DbError,
  closePool,
  connectionStringFor,
  getPool,
  isPgError,
  isUniqueViolation,
  isUuid,
  many,
  one,
  poolConfig,
  query,
  raisedMessage,
  sanitizeDbError,
  tx,
  withCompany,
  type PgError,
  type Queryable,
} from "./pool";

import { getPool } from "./pool";

/**
 * The shared pool, created on first use (the proxy defers creation until a property is read, so
 * importing this module never opens connections or reads the environment).
 */
export const pool: import("pg").Pool = new Proxy({} as import("pg").Pool, {
  get(_target, property) {
    const real = getPool();
    const value = Reflect.get(real, property, real) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

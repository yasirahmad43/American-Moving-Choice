/**
 * Append-only audit log (build plan §5): every admin decision, settings change and security
 * event writes one row. Keep personal data out of before/after: record IDs and the fields that
 * changed, not contact details.
 */
import { getPool, type Queryable } from "../db/pool";

export type AuditActorType = "user" | "admin" | "system" | "consumer";

export interface AuditEntry {
  actorType: AuditActorType;
  /** User ID, or a job name for system actors. */
  actorId?: string | null;
  companyId?: string | null;
  /** Dotted verb, e.g. "company.approve", "settings.update", "auth.login". */
  action: string;
  /** Table or concept acted on, e.g. "company", "platform_setting". */
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

const toJson = (value: unknown): string | null => (value === undefined || value === null ? null : JSON.stringify(value));

/** Writes one audit row. Pass the transaction client so the entry commits with the change. */
export async function audit(entry: AuditEntry, db: Queryable = getPool()): Promise<void> {
  await db.query(
    `insert into audit_log (actor_type, actor_id, company_id, action, entity, entity_id, before, after, ip)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
    [
      entry.actorType,
      entry.actorId ?? null,
      entry.companyId ?? null,
      entry.action,
      entry.entity,
      entry.entityId ?? null,
      toJson(entry.before),
      toJson(entry.after),
      entry.ip ?? null,
    ],
  );
}

/**
 * Rate cards and the public calculator (build plan §7.3).
 *
 * - calculatorRange: resolves the ZIP codes, distance, move type and band, loads the active rate
 *   cards of approved companies covering the origin state and runs cost-model-v1 from @amc/core.
 *   It reads no billing, purchase, spend or plan data: account status is its only account input.
 * - saveRateCard: validates a card, supersedes the company's active card and audits the change in
 *   one transaction. The caller must already have checked the user's role for the company.
 *
 * Kept free of "server-only" so tests import it directly; index.ts adds the guard for apps.
 */
import {
  COST_MODEL_VERSION,
  cleanZipEntry,
  computeCost,
  isUnsupportedZip,
  parseCalculatorAnswers,
  type AnswerField,
  type CostQuery,
  type CostRateCard,
  type CostResult,
  type CostRoute,
  type LocalRates,
  type LongDistanceRates,
  type RawCalculatorAnswers,
  type ServiceRates,
} from "@amc/core";
import { audit } from "../audit/audit";
import { getPool, isUuid, tx, type Queryable } from "../db/pool";
import { lookupZip, resolveMove, stateByCode, type ZipLocation } from "../geo/geo";
import { getLocalMaxMiles } from "../settings/settings";
import { rateCardDataSchema, type RateCardData } from "./schema";

// ------------------------------------------------------------------ calculator

/** Error IDs from the calculator copy, plus error.zip.unknown for five digits we can't find. */
export type CalculatorFieldError = { id: string; zip?: string };

export type ZipCheck =
  | { status: "empty" | "incomplete" }
  | { status: "error"; error: CalculatorFieldError }
  | { status: "resolved"; location: { zip: string; city: string; state: string } };

export interface RouteCheck {
  origin: ZipCheck;
  destination: ZipCheck;
  /** Present once both ZIP codes resolve. */
  route: CostRoute | null;
  localRadiusMiles: number;
}

export type CalculatorOutcome =
  | { status: "invalid"; errors: Partial<Record<AnswerField, CalculatorFieldError>> }
  | { status: "ok"; query: CostQuery; route: CostRoute; result: CostResult; localRadiusMiles: number };

const toEnd = (location: ZipLocation) => ({ zip: location.zip, city: location.city, state: location.state });

/** One ZIP entry checked as the form shows it: nothing yet, an error, or its city and state. */
export function checkZip(raw: string): ZipCheck {
  const entry = cleanZipEntry(raw);
  switch (entry.kind) {
    case "empty":
      return { status: "empty" };
    case "short":
      return { status: "incomplete" };
    case "non_us":
      return { status: "error", error: { id: "error.zip.non_us" } };
    case "zip": {
      if (isUnsupportedZip(entry.zip)) return { status: "error", error: { id: "error.zip.unsupported", zip: entry.zip } };
      const location = lookupZip(entry.zip);
      if (!location) return { status: "error", error: { id: "error.zip.unknown", zip: entry.zip } };
      return { status: "resolved", location: toEnd(location) };
    }
  }
}

/** The route summary for the form: each ZIP's city once it resolves, and the route once both do. */
export async function checkRoute(origin: string, destination: string, db: Queryable = getPool()): Promise<RouteCheck> {
  const localRadiusMiles = await getLocalMaxMiles(db);
  const o = checkZip(origin);
  const d = checkZip(destination);
  let route: CostRoute | null = null;
  if (o.status === "resolved" && d.status === "resolved") {
    const move = resolveMove(o.location.zip, d.location.zip, localRadiusMiles);
    if (move) route = { origin: toEnd(move.origin), destination: toEnd(move.destination), miles: move.distanceMiles, moveType: move.moveType };
  }
  return { origin: o, destination: d, route, localRadiusMiles };
}

interface CardRow {
  company_id: string;
  created_at: Date;
  local: LocalRates | null;
  long_distance: LongDistanceRates | null;
  services: ServiceRates | null;
}

/**
 * Active cards covering a state, from approved companies that aren't suspended, whatever their
 * age (the model applies the 12-month limit and names "stale" when it decides the outcome).
 */
export async function loadAreaRateCards(state: string, db: Queryable = getPool()): Promise<CostRateCard[]> {
  const result = await db.query<CardRow>(
    `select rc.company_id, rc.created_at, rc.local, rc.long_distance, rc.services
       from rate_cards rc
       join companies c on c.id = rc.company_id
      where rc.status = 'active'
        and $1 = any(rc.states)
        and c.status = 'approved'
        and c.suspended_at is null
      order by rc.company_id`,
    [state],
  );
  return result.rows.map((row) => ({
    companyId: row.company_id,
    createdAt: row.created_at.toISOString(),
    local: row.local,
    longDistance: row.long_distance,
    services: row.services,
  }));
}

/**
 * The calculator's answer for raw form answers: a range with scope, basis (movers and area),
 * as-of date and model version, or the reason there is none; or field errors.
 */
export async function calculatorRange(
  input: RawCalculatorAnswers,
  options: { now?: Date; db?: Queryable } = {},
): Promise<CalculatorOutcome> {
  const db = options.db ?? getPool();
  const parsed = parseCalculatorAnswers(input);
  const errors: Partial<Record<AnswerField, CalculatorFieldError>> = {};
  for (const side of ["origin", "destination"] as const) {
    const check = checkZip(side === "origin" ? input.origin : input.destination);
    if (check.status === "error") errors[side] = check.error;
    else if (!parsed.ok && parsed.errors[side]) errors[side] = { id: parsed.errors[side] };
  }
  if (!parsed.ok && parsed.errors.size) errors.size = { id: parsed.errors.size };
  if (!parsed.ok || Object.keys(errors).length > 0) return { status: "invalid", errors };

  const { query } = parsed;
  const localRadiusMiles = await getLocalMaxMiles(db);
  const move = resolveMove(query.originZip, query.destinationZip, localRadiusMiles);
  if (!move) return { status: "invalid", errors: { origin: { id: "error.zip.lookup" } } };
  const route: CostRoute = { origin: toEnd(move.origin), destination: toEnd(move.destination), miles: move.distanceMiles, moveType: move.moveType };
  const area = { state: move.origin.state, name: stateByCode(move.origin.state)?.name ?? move.origin.state };
  const cards = await loadAreaRateCards(area.state, db);
  const result = computeCost({ route, moveSize: query.moveSize, services: query.services, cards, area, now: options.now ?? new Date() });
  return { status: "ok", query, route, result, localRadiusMiles };
}

// ------------------------------------------------------------------ rate cards

export interface StoredRateCard extends RateCardData {
  id: string;
  companyId: string;
  status: "active" | "superseded";
  submittedBy: string | null;
  submittedByName: string | null;
  createdAt: Date;
}

interface StoredRow {
  id: string;
  company_id: string;
  states: string[];
  local: LocalRates | null;
  long_distance: LongDistanceRates | null;
  services: ServiceRates | null;
  status: "active" | "superseded";
  submitted_by: string | null;
  submitted_by_name: string | null;
  created_at: Date;
}

const toStored = (row: StoredRow): StoredRateCard => ({
  id: row.id,
  companyId: row.company_id,
  states: row.states as RateCardData["states"],
  local: row.local,
  long_distance: row.long_distance,
  services: row.services,
  status: row.status,
  submittedBy: row.submitted_by,
  submittedByName: row.submitted_by_name,
  createdAt: row.created_at,
});

const CARD_COLUMNS = `rc.id, rc.company_id, rc.states, rc.local, rc.long_distance, rc.services, rc.status, rc.submitted_by,
  u.full_name as submitted_by_name, rc.created_at`;

/** The company's active card, or null. */
export async function getActiveRateCard(companyId: string, db: Queryable = getPool()): Promise<StoredRateCard | null> {
  if (!isUuid(companyId)) return null;
  const result = await db.query<StoredRow>(
    `select ${CARD_COLUMNS} from rate_cards rc left join users u on u.id = rc.submitted_by
      where rc.company_id = $1 and rc.status = 'active'`,
    [companyId],
  );
  return result.rows[0] ? toStored(result.rows[0]) : null;
}

/** The company's cards, newest first (active and superseded). */
export async function listRateCards(companyId: string, limit = 10, db: Queryable = getPool()): Promise<StoredRateCard[]> {
  if (!isUuid(companyId)) return [];
  const result = await db.query<StoredRow>(
    `select ${CARD_COLUMNS} from rate_cards rc left join users u on u.id = rc.submitted_by
      where rc.company_id = $1 order by rc.created_at desc, rc.id limit $2`,
    [companyId, Math.max(1, Math.min(100, limit))],
  );
  return result.rows.map(toStored);
}

export class RateCardValidationError extends Error {
  constructor(readonly issues: { path: string; message: string }[]) {
    super(`Invalid rate card: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
    this.name = "RateCardValidationError";
  }
}

export interface RateCardActor {
  userId: string;
  ip?: string | null;
}

/**
 * Saves a new active card for the company, superseding the previous one, and writes the audit log,
 * all in one transaction. Cards never affect placement: nothing here touches ordering or matching.
 */
export async function saveRateCard(companyId: string, data: unknown, actor: RateCardActor): Promise<{ id: string; supersededId: string | null }> {
  if (!isUuid(companyId)) throw new Error("saveRateCard: companyId must be a UUID");
  const parsed = rateCardDataSchema.safeParse(data);
  if (!parsed.success) {
    throw new RateCardValidationError(parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
  }
  const card = parsed.data;
  return tx(async (client) => {
    // Lock the company row so two saves for one company run one after the other.
    const company = await client.query<{ id: string }>("select id from companies where id = $1 for update", [companyId]);
    if (!company.rows[0]) throw new Error("saveRateCard: no such company");
    const previous = await client.query<{ id: string; states: string[]; local: unknown; long_distance: unknown; services: unknown }>(
      "select id, states, local, long_distance, services from rate_cards where company_id = $1 and status = 'active'",
      [companyId],
    );
    const before = previous.rows[0] ?? null;
    if (before) await client.query("update rate_cards set status = 'superseded' where id = $1", [before.id]);
    const inserted = await client.query<{ id: string }>(
      `insert into rate_cards (company_id, states, local, long_distance, services, status, submitted_by)
       values ($1, $2::text[], $3::jsonb, $4::jsonb, $5::jsonb, 'active', $6) returning id`,
      [
        companyId,
        card.states,
        card.local ? JSON.stringify(card.local) : null,
        card.long_distance ? JSON.stringify(card.long_distance) : null,
        card.services ? JSON.stringify(card.services) : null,
        actor.userId,
      ],
    );
    const id = inserted.rows[0]!.id;
    await audit(
      {
        actorType: "user",
        actorId: actor.userId,
        companyId,
        action: before ? "rate_card.supersede" : "rate_card.create",
        entity: "rate_card",
        entityId: id,
        before: before ? { id: before.id, states: before.states, local: before.local, long_distance: before.long_distance, services: before.services } : null,
        after: { id, states: card.states, local: card.local, long_distance: card.long_distance, services: card.services, model: COST_MODEL_VERSION },
        ip: actor.ip ?? null,
      },
      client,
    );
    return { id, supersededId: before?.id ?? null };
  });
}

/**
 * Platform settings (platform_settings, seeded by 002; build plan §4.1). Typed getters fall back
 * to the documented default when a row is missing or holds an invalid value. setSetting validates,
 * writes and records the change in the audit log in one transaction.
 */
import { z } from "zod";
import { audit } from "../audit/audit";
import { getPool, tx, type Queryable } from "../db/pool";

interface Definition<S extends z.ZodType> {
  schema: S;
  default: z.output<S>;
  label: string;
  description: string;
}

const define = <S extends z.ZodType>(d: Definition<S>): Definition<S> => d;

export const SETTING_DEFINITIONS = {
  require_mc_number: define({
    schema: z.boolean(),
    default: true,
    label: "Require an MC number",
    description: "Companies must give an MC number to join and to buy requests (mover verification §1, decision 1).",
  }),
  max_sharing_limit: define({
    schema: z.number().int().min(1).max(10),
    default: 5,
    label: "Maximum movers per request",
    description: "Highest answer allowed to \"How many moving companies would you like to hear from?\"",
  }),
  sale_window_hours: define({
    schema: z.number().int().min(1).max(720),
    default: 72,
    label: "Sale window (hours)",
    description: "How long movers can buy a request after it is submitted.",
  }),
  local_max_miles: define({
    schema: z.number().min(1).max(500),
    default: 50,
    label: "Local move radius (miles)",
    description: "Same-state moves up to this distance are local; longer ones are intrastate.",
  }),
  quote_invite_delay_days: define({
    schema: z.number().int().min(0).max(90),
    default: 7,
    label: "Quote review invitation delay (days)",
    description: "Days after a purchase before the quote-experience review invitation is sent.",
  }),
  post_move_invite_days: define({
    schema: z.number().int().min(0).max(365),
    default: 21,
    label: "Post-move invitation (days after move date)",
    description: "Days after the stated move date before the move-experience invitation.",
  }),
  rank_min_reviews: define({
    schema: z.number().int().min(1).max(100),
    default: 5,
    label: "Reviews needed before ranking",
    description: "Eligible reviews of one type needed before any rank, \"top\" claim or rating-sort priority.",
  }),
  duplicate_window_days: define({
    schema: z.number().int().min(1).max(365),
    default: 30,
    label: "Duplicate window (days)",
    description: "A repeat request inside this window joins the first request's group.",
  }),
  new_to_network_days: define({
    schema: z.number().int().min(1).max(365),
    default: 90,
    label: "\"New to our network\" period (days)",
    description: "How long a profile shows \"New to our network\" after approval.",
  }),
  claim_window_hours: define({
    schema: z.number().int().min(1).max(720),
    default: 72,
    label: "Lead-quality claim window (hours)",
    description: "How long after purchase a company can file a lead-quality claim.",
  }),
  show_zip_in_preview: define({
    schema: z.boolean(),
    default: false,
    label: "Show ZIP codes in marketplace previews",
    description: "Whether lead previews show origin and destination ZIP codes before purchase.",
  }),
  active_policy_version: define({
    schema: z.string().min(1),
    default: "share-stepdown-v1-proposal",
    label: "Active sharing policy",
    description: "Sharing policy version applied to new requests (must exist in sharing_policies).",
  }),
  active_consent_version: define({
    schema: z.string().min(1),
    default: "contact-introduction-v1-draft",
    label: "Active consent text",
    description: "Consent text version shown on new requests (must exist in consent_text_versions).",
  }),
} as const;

export type SettingKey = keyof typeof SETTING_DEFINITIONS;
export type SettingValue<K extends SettingKey> = z.output<(typeof SETTING_DEFINITIONS)[K]["schema"]>;
export type Settings = { [K in SettingKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(SETTING_DEFINITIONS, key);
}

function parseValue<K extends SettingKey>(key: K, raw: unknown): SettingValue<K> {
  const definition = SETTING_DEFINITIONS[key];
  const parsed = definition.schema.safeParse(raw);
  if (parsed.success) return parsed.data as SettingValue<K>;
  if (raw !== undefined) console.warn(`[settings] stored value for ${key} is invalid; using the default`);
  return definition.default as SettingValue<K>;
}

/** One setting, typed, with the default when unset or invalid. */
export async function getSetting<K extends SettingKey>(key: K, db: Queryable = getPool()): Promise<SettingValue<K>> {
  const result = await db.query<{ value: unknown }>("select value from platform_settings where key = $1", [key]);
  return parseValue(key, result.rows[0]?.value);
}

/** Every setting in one query. */
export async function getSettings(db: Queryable = getPool()): Promise<Settings> {
  const result = await db.query<{ key: string; value: unknown }>(
    "select key, value from platform_settings where key = any($1::text[])",
    [SETTING_KEYS],
  );
  const stored = new Map(result.rows.map((row) => [row.key, row.value]));
  const settings = {} as Record<SettingKey, unknown>;
  for (const key of SETTING_KEYS) settings[key] = parseValue(key, stored.get(key));
  return settings as Settings;
}

// Named getters, one per setting.
export const getRequireMcNumber = (db?: Queryable) => getSetting("require_mc_number", db);
export const getMaxSharingLimit = (db?: Queryable) => getSetting("max_sharing_limit", db);
export const getSaleWindowHours = (db?: Queryable) => getSetting("sale_window_hours", db);
export const getLocalMaxMiles = (db?: Queryable) => getSetting("local_max_miles", db);
export const getQuoteInviteDelayDays = (db?: Queryable) => getSetting("quote_invite_delay_days", db);
export const getPostMoveInviteDays = (db?: Queryable) => getSetting("post_move_invite_days", db);
export const getRankMinReviews = (db?: Queryable) => getSetting("rank_min_reviews", db);
export const getDuplicateWindowDays = (db?: Queryable) => getSetting("duplicate_window_days", db);
export const getNewToNetworkDays = (db?: Queryable) => getSetting("new_to_network_days", db);
export const getClaimWindowHours = (db?: Queryable) => getSetting("claim_window_hours", db);
export const getShowZipInPreview = (db?: Queryable) => getSetting("show_zip_in_preview", db);
export const getActivePolicyVersion = (db?: Queryable) => getSetting("active_policy_version", db);
export const getActiveConsentVersion = (db?: Queryable) => getSetting("active_consent_version", db);

export class SettingValidationError extends Error {
  constructor(
    readonly key: string,
    readonly reason: string,
  ) {
    super(`Invalid value for ${key}: ${reason}`);
    this.name = "SettingValidationError";
  }
}

export interface SettingActor {
  /** The admin user making the change; "system" for jobs. */
  userId: string | "system";
  ip?: string | null;
}

/**
 * Validates and stores a setting, writing an audit entry with the old and new values.
 * The caller must already have checked the admin role (build plan §5).
 */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
  actor: SettingActor,
): Promise<{ before: SettingValue<K> | null; after: SettingValue<K> }> {
  const definition = SETTING_DEFINITIONS[key];
  const parsed = definition.schema.safeParse(value);
  if (!parsed.success) throw new SettingValidationError(key, parsed.error.issues[0]?.message ?? "invalid value");
  const next = parsed.data as SettingValue<K>;

  return tx(async (client) => {
    // The sharing limit and the active policy must fit together: reserve_purchase refuses buyers
    // beyond the policy's factor count, so a larger limit would promise movers who can never buy.
    if (key === "active_policy_version") {
      const found = await client.query<{ factors: number }>("select cardinality(factors_bp) as factors from sharing_policies where version = $1", [next]);
      if (!found.rows[0]) throw new SettingValidationError(key, "no sharing policy with that version");
      const limit = await getSetting("max_sharing_limit", client);
      if (found.rows[0].factors < limit) {
        throw new SettingValidationError(key, `the policy has ${found.rows[0].factors} factors but the maximum movers per request is ${limit}`);
      }
    }
    if (key === "max_sharing_limit") {
      const version = await getSetting("active_policy_version", client);
      const found = await client.query<{ factors: number }>("select cardinality(factors_bp) as factors from sharing_policies where version = $1", [version]);
      const factors = found.rows[0]?.factors ?? 0;
      if ((next as number) > factors) {
        throw new SettingValidationError(key, `the active sharing policy covers at most ${factors} movers per request`);
      }
    }
    if (key === "active_consent_version") {
      const found = await client.query<{ kind: string }>("select kind from consent_text_versions where id = $1", [next]);
      if (!found.rows[0]) throw new SettingValidationError(key, "no consent text with that version");
      if (found.rows[0].kind !== "contact_consent") throw new SettingValidationError(key, "that version is not contact-consent text");
    }
    const previous = await client.query<{ value: unknown }>(
      "select value from platform_settings where key = $1 for update",
      [key],
    );
    const before = previous.rows[0] ? (previous.rows[0].value as SettingValue<K>) : null;
    await client.query(
      `insert into platform_settings (key, value, updated_at, updated_by) values ($1, $2::jsonb, now(), $3)
       on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`,
      [key, JSON.stringify(next), actor.userId],
    );
    await audit(
      {
        actorType: actor.userId === "system" ? "system" : "admin",
        actorId: actor.userId,
        action: "settings.update",
        entity: "platform_setting",
        entityId: key,
        before: before === null ? null : { value: before },
        after: { value: next },
        ip: actor.ip ?? null,
      },
      client,
    );
    return { before, after: next };
  });
}

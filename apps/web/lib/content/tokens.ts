/**
 * Token resolution for content pages (content/README.md §3; build plan §8). Pure: the caller
 * passes the raw values from content/tokens.json, so tests can use any map.
 *
 * Rules (S1 spec):
 * - setting.* render the platform defaults seeded by 002 (build plan §4.1), falling back to the
 *   tokens.json value for settings that have no platform key yet.
 * - badge.name and directory.* render their working values.
 * - org.* and page.* render a visible "pending: …" placeholder until the owner supplies them.
 * - cost data and company values (cost.hub.*, cost.result.*, cost.dataset.*, company.*) render
 *   "data pending": content pages never show figures that look like data (site architecture
 *   §6.3). Method values (cost.method.*, cost.model.*, cost.changelog.*) are proposals the
 *   method page states, so they render from tokens.json.
 * - text.ST-n renders the stored text when the caller supplies a lookup.
 * - Anything else that is null or missing renders a pending placeholder naming the token.
 */

export type TokenValue = { kind: "value"; text: string } | { kind: "pending"; text: string; key: string };

export type RawTokens = Record<string, unknown>;

/** Platform setting defaults seeded by db/migrations/002_platform.sql (build plan §4.1). */
export const PLATFORM_SETTING_DEFAULTS: Record<string, string> = {
  max_sharing_limit: "5",
  sale_window_hours: "72",
  local_max_miles: "50",
  quote_invite_delay_days: "7",
  post_move_invite_days: "21",
  rank_min_reviews: "5",
  duplicate_window_days: "30",
  new_to_network_days: "90",
  claim_window_hours: "72",
  require_mc_number: "on",
};

/** Working values the S1 spec fixes for the preview. */
export const FIXED_TOKENS: Record<string, string> = {
  "badge.name": "Preferred Mover · American Moving Choice (name pending)",
  "directory.url": "/directory/",
};

/** Human labels for owner-supplied values, shown as "pending: legal name". */
const PENDING_LABELS: Record<string, string> = {
  "org.legal_name": "legal name",
  "org.address": "business address",
  "org.owner": "owner",
  "org.support_email": "support email",
  "org.support_phone": "support phone",
  "org.editorial_email": "editorial email",
  "page.author": "author",
  "page.reviewer": "reviewer",
  "page.data_owner": "data owner",
  "setting.stop_propagation_target": "owner sets the target",
};

const DATA_PENDING = /^(cost\.(hub|result|dataset)\.|company\.)/;

export const TOKEN_PATTERN = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

export interface TokenResolverOptions {
  /** Stored text lookup for {{text.ST-n}} tokens. */
  storedText?: (key: string) => string | null;
}

export function createTokenResolver(raw: RawTokens, options: TokenResolverOptions = {}): (key: string) => TokenValue {
  const settingKeys = (raw._setting_keys ?? {}) as Record<string, string | null>;
  return (key: string): TokenValue => {
    const pending = (label: string): TokenValue => ({ kind: "pending", text: label, key });
    if (key.startsWith("_")) return pending(`pending: ${key}`);
    if (key in FIXED_TOKENS) return { kind: "value", text: FIXED_TOKENS[key]! };
    if (key in PENDING_LABELS && (raw[key] === null || raw[key] === undefined)) return pending(`pending: ${PENDING_LABELS[key]}`);
    if (DATA_PENDING.test(key)) return pending("data pending");
    if (key.startsWith("text.")) {
      const text = options.storedText?.(key.slice(5)) ?? null;
      return text ? { kind: "value", text } : pending(`pending: stored text ${key.slice(5)}`);
    }
    if (key.startsWith("setting.")) {
      const platformKey = settingKeys[key];
      if (platformKey && platformKey in PLATFORM_SETTING_DEFAULTS) return { kind: "value", text: PLATFORM_SETTING_DEFAULTS[platformKey]! };
    }
    const value = raw[key];
    if (typeof value === "string" && value.trim() !== "") return { kind: "value", text: value };
    if (typeof value === "number" || typeof value === "boolean") return { kind: "value", text: String(value) };
    if (key.startsWith("org.") || key.startsWith("page.")) return pending(`pending: ${key.split(".").slice(1).join(" ").replaceAll("_", " ")}`);
    return pending(`pending: ${key}`);
  };
}

/** Replaces every token in plain text (titles, descriptions, breadcrumbs). Pending tokens become their label. */
export function resolveTokensInText(text: string, resolve: (key: string) => TokenValue): string {
  return text.replace(TOKEN_PATTERN, (_match, key: string) => resolve(key).text);
}

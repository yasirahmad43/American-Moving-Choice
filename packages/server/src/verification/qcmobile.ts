/**
 * Live FMCSA adapter for the QCMobile API, used only when FMCSA_WEBKEY is set.
 *
 * Endpoints (compliance facts §1): base https://mobile.fmcsa.dot.gov/qc/services/, with
 * /carriers/:dotNumber, /carriers/:dotNumber/authority and /carriers/:dotNumber/docket-numbers,
 * each taking a webKey query parameter. The response field names below come from third-party
 * clients and are UNVERIFIED against FMCSA's element reference, so every field is read
 * defensively: anything missing or unrecognized becomes null ("unknown"), and the checks turn
 * unknowns into "needs_review" instead of passing them. The WebKey never appears in stored URLs,
 * snapshots or messages.
 */
import type { AuthorityGrant, AuthorityStatus, FmcsaAdapter, FmcsaCarrierRecord, FmcsaLookup } from "./types";

export const QCMOBILE_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services";
const TIMEOUT_MS = 10_000;

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads the first present key, ignoring case. */
function field(obj: Json | null | undefined, ...keys: string[]): unknown {
  if (!obj) return undefined;
  const lower = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const actual = lower.get(key.toLowerCase());
    if (actual !== undefined && obj[actual] !== null && obj[actual] !== "") return obj[actual];
  }
  return undefined;
}

const text = (value: unknown): string | null =>
  typeof value === "string" ? value.trim() || null : typeof value === "number" ? String(value) : null;

/** "Y"/"N", true/false, "Yes"/"No". Null when unrecognized. */
export function yesNo(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const t = text(value)?.toUpperCase();
  if (t === "Y" || t === "YES" || t === "T" || t === "TRUE") return true;
  if (t === "N" || t === "NO" || t === "F" || t === "FALSE") return false;
  return null;
}

/** Insurance "on file" may be an amount (thousands of dollars) or a flag. */
export function onFile(value: unknown): boolean | null {
  const flag = yesNo(value);
  if (flag !== null) return flag;
  const t = text(value);
  if (t && /^\d+(\.\d+)?$/.test(t)) return Number(t) > 0;
  return null;
}

/** Authority status codes: A active, I inactive, P pending, R revoked, N none (null). */
export function authorityStatus(value: unknown): AuthorityStatus | null {
  const t = text(value)?.toUpperCase();
  if (!t) return null;
  if (t === "A" || t === "ACTIVE") return "active";
  if (t === "I" || t === "INACTIVE") return "inactive";
  if (t === "P" || t === "PENDING") return "pending";
  if (t === "R" || t === "REVOKED") return "revoked";
  return null; // "N" (no authority) and anything unrecognized
}

function contentOf(body: unknown): unknown {
  return isObject(body) ? (field(body, "content") ?? body) : body;
}

/** Maps the three QCMobile responses to a carrier record. Exported for tests. */
export function mapQcMobile(usdot: string, carrierBody: unknown, authorityBody: unknown, docketBody: unknown): FmcsaCarrierRecord | null {
  const content = contentOf(carrierBody);
  const carrier = isObject(content) ? ((field(content, "carrier") as Json | undefined) ?? content) : null;
  if (!isObject(carrier) || (!field(carrier, "dotNumber", "legalName"))) return null;

  const statusCode = text(field(carrier, "statusCode", "status"))?.toUpperCase();
  const allowed = yesNo(field(carrier, "allowedToOperate"));
  const usdotStatus: FmcsaCarrierRecord["usdotStatus"] =
    statusCode === "A" ? "active" : statusCode === "I" ? "inactive" : allowed === true ? "active" : "unknown";
  const oosDate = text(field(carrier, "oosDate"));
  const outOfService = oosDate ? true : allowed === true ? false : null;

  const dockets: string[] = [];
  const docketContent = contentOf(docketBody);
  for (const entry of Array.isArray(docketContent) ? docketContent : []) {
    if (!isObject(entry)) continue;
    const number = text(field(entry, "docketNumber"));
    if (number) dockets.push(`${(text(field(entry, "prefix")) ?? "MC").toUpperCase()}-${number}`);
  }

  const authorities: AuthorityGrant[] = [];
  const authorityContent = contentOf(authorityBody);
  for (const entry of Array.isArray(authorityContent) ? authorityContent : []) {
    const grant = isObject(entry) ? ((field(entry, "carrierAuthority") as Json | undefined) ?? entry) : null;
    if (!isObject(grant)) continue;
    const number = text(field(grant, "docketNumber"));
    const docket = number ? `${(text(field(grant, "prefix")) ?? "MC").toUpperCase()}-${number}` : (dockets[0] ?? "unknown");
    const hhg = yesNo(field(grant, "authorizedForHouseholdGoods")) === true;
    const scope = hhg ? "household_goods" : "property";
    const common = authorityStatus(field(grant, "commonAuthorityStatus"));
    const contract = authorityStatus(field(grant, "contractAuthorityStatus"));
    const broker = authorityStatus(field(grant, "brokerAuthorityStatus"));
    if (common) authorities.push({ docket, type: "common", scope, status: common });
    if (contract) authorities.push({ docket, type: "contract", scope, status: contract });
    if (broker) authorities.push({ docket, type: "broker", scope, status: broker });
  }
  // Without the authority endpoint, fall back to the status fields on the carrier record.
  if (authorities.length === 0) {
    const docket = dockets[0] ?? "unknown";
    const common = authorityStatus(field(carrier, "commonAuthorityStatus"));
    const contract = authorityStatus(field(carrier, "contractAuthorityStatus"));
    const broker = authorityStatus(field(carrier, "brokerAuthorityStatus"));
    const hhg = yesNo(field(carrier, "authorizedForHouseholdGoods")) === true;
    const scope = hhg ? "household_goods" : "property";
    if (common) authorities.push({ docket, type: "common", scope, status: common });
    if (contract) authorities.push({ docket, type: "contract", scope, status: contract });
    if (broker) authorities.push({ docket, type: "broker", scope, status: broker });
  }

  return {
    usdot,
    legalName: text(field(carrier, "legalName")),
    dbaName: text(field(carrier, "dbaName")),
    usdotStatus,
    outOfService,
    physicalAddress: {
      line1: text(field(carrier, "phyStreet")),
      city: text(field(carrier, "phyCity")),
      state: text(field(carrier, "phyState")),
      zip: text(field(carrier, "phyZipcode", "phyZip"))?.slice(0, 5) ?? null,
    },
    phone: text(field(carrier, "telephone", "phone")),
    authorities,
    insurance: {
      bipdOnFile: onFile(field(carrier, "bipdInsuranceOnFile")),
      cargoOnFile: onFile(field(carrier, "cargoInsuranceOnFile")),
      bondOnFile: onFile(field(carrier, "bondInsuranceOnFile")),
    },
    recentChanges: null, // QCMobile returns current state only
  };
}

export function qcMobileAdapter(webKey: string, fetchImpl: typeof fetch = fetch): FmcsaAdapter {
  const get = async (path: string): Promise<{ status: number; body: unknown }> => {
    const url = `${QCMOBILE_BASE_URL}${path}?webKey=${encodeURIComponent(webKey)}`;
    const response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  };

  return {
    source: "fmcsa_qcmobile",
    async lookupCarrier(usdot: string): Promise<FmcsaLookup> {
      const retrievedAt = new Date();
      const sourceUrl = `${QCMOBILE_BASE_URL}/carriers/${encodeURIComponent(usdot)}`;
      if (!/^\d{1,8}$/.test(usdot)) {
        return { status: "unavailable", reason: "The USDOT number is not a number FMCSA can look up.", source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw: null };
      }
      try {
        const carrier = await get(`/carriers/${usdot}`);
        if (carrier.status === 404) return { status: "not_found", source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw: { carrier: carrier.body } };
        if (carrier.status !== 200) {
          return { status: "unavailable", reason: `FMCSA lookup failed (HTTP ${carrier.status}).`, source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw: { status: carrier.status } };
        }
        const [authority, dockets] = await Promise.all([
          get(`/carriers/${usdot}/authority`).catch(() => ({ status: 0, body: null })),
          get(`/carriers/${usdot}/docket-numbers`).catch(() => ({ status: 0, body: null })),
        ]);
        const raw = { carrier: carrier.body, authority: authority.body, docketNumbers: dockets.body };
        const record = mapQcMobile(usdot, carrier.body, authority.status === 200 ? authority.body : null, dockets.status === 200 ? dockets.body : null);
        if (!record) return { status: "not_found", source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw };
        return { status: "found", record, source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw };
      } catch (error) {
        const reason = error instanceof Error && error.name === "TimeoutError" ? "FMCSA lookup timed out." : "FMCSA lookup failed (network error).";
        return { status: "unavailable", reason, source: "fmcsa_qcmobile", sourceUrl, retrievedAt, raw: null };
      }
    },
  };
}

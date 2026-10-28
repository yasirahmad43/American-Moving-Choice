/**
 * Verify a mover (site architecture §1.2 "Verify a mover"): look a company up by USDOT or MC number
 * through the verification module's FMCSA adapter (the fixture adapter in the preview) and say what
 * the record shows, with its retrieval time. Results are returned to the page, never put in a URL.
 */
import { env } from "../env/env";
import { FIXTURE_USDOT_MAX, FIXTURE_USDOT_MIN, fixtureRecord } from "../verification/fixtures";
import { QCMOBILE_BASE_URL } from "../verification/qcmobile";
import { fmcsaSnapshotUrl, getFmcsaAdapter } from "../verification/run";
import type { AuthorityGrant, FmcsaAdapter, VerificationSource } from "../verification/types";
import { authorityLabel } from "./logic";
import { FMCSA_LI_URL, PROTECT_YOUR_MOVE_URL, listedProfileByUsdot } from "./queries";

export type LookupKind = "usdot" | "mc";

/** "carrier": carrier authority and no broker authority; "broker": broker authority only. */
export type AuthorityClass = "carrier" | "broker" | "carrier_and_broker" | "none_active";

export interface MoverRecordView {
  usdot: string;
  legalName: string | null;
  dbaName: string | null;
  usdotStatus: "active" | "inactive" | "unknown";
  outOfService: boolean | null;
  basedIn: string | null;
  authorities: { docket: string; label: string; status: AuthorityGrant["status"]; isBroker: boolean }[];
  classification: AuthorityClass;
  householdGoods: boolean;
  insurance: { bipdOnFile: boolean | null; cargoOnFile: boolean | null; bondOnFile: boolean | null };
}

interface Common {
  query: { kind: LookupKind; number: string };
  source: VerificationSource;
  /** True when the answer came from recorded demo data, not FMCSA. */
  demo: boolean;
  retrievedAt: Date;
  links: { snapshot: string | null; licensing: string; protectYourMove: string };
}

export type MoverLookupResult =
  | { status: "invalid"; message: string }
  | (Common & { status: "found"; record: MoverRecordView; inNetwork: { slug: string; displayName: string } | null })
  | (Common & { status: "not_found" })
  | (Common & { status: "unavailable"; reason: string });

/** Digits of a USDOT or MC number ("MC-123456", "mc 123456", "USDOT 123"), or null. */
export function normalizeLookupNumber(kind: LookupKind, input: string): string | null {
  const prefix = kind === "usdot" ? /^(USDOT|US DOT|DOT)[\s#:-]*/ : /^MC[\s#:-]*/;
  const trimmed = input.trim().toUpperCase().replace(prefix, "");
  if (!/^\d{1,8}$/.test(trimmed) || Number(trimmed) === 0) return null;
  return String(Number(trimmed));
}

const isLiveBroker = (a: AuthorityGrant) => a.type === "broker" && (a.status === "active" || a.status === "pending");

export function classifyAuthorities(authorities: readonly AuthorityGrant[]): AuthorityClass {
  const carrier = authorities.some((a) => a.type !== "broker" && a.status === "active");
  const broker = authorities.some(isLiveBroker);
  if (carrier && broker) return "carrier_and_broker";
  if (broker) return "broker";
  if (carrier) return "carrier";
  return "none_active";
}

/** The USDOT number behind an MC docket in the fixture range (recorded demo data). */
function fixtureUsdotForDocket(mc: string): string | null {
  const docket = `MC-${mc}`;
  for (let usdot = FIXTURE_USDOT_MIN; usdot <= FIXTURE_USDOT_MAX; usdot++) {
    const record = fixtureRecord(String(usdot));
    if (record?.authorities.some((a) => a.docket === docket)) return String(usdot);
  }
  return null;
}

/**
 * The USDOT number for an MC docket from QCMobile's docket-number endpoint. Field names follow
 * third-party clients and are UNVERIFIED, so anything unexpected returns null ("unavailable").
 */
async function liveUsdotForDocket(mc: string, webKey: string): Promise<string | null> {
  try {
    const url = `${QCMOBILE_BASE_URL}/carriers/docket-number/${encodeURIComponent(mc)}?webKey=${encodeURIComponent(webKey)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const body = (await response.json()) as { content?: unknown };
    const content = Array.isArray(body.content) ? body.content : body.content ? [body.content] : [];
    for (const entry of content) {
      const carrier = (entry as { carrier?: { dotNumber?: unknown } }).carrier;
      const dot = carrier?.dotNumber;
      if (typeof dot === "number" || (typeof dot === "string" && /^\d+$/.test(dot))) return String(dot);
    }
    return null;
  } catch {
    return null;
  }
}

export interface LookupOptions {
  adapter?: FmcsaAdapter;
  /** Skip the "in our network" profile lookup (tests without a database). */
  skipNetwork?: boolean;
}

export async function lookupMover(kind: LookupKind, input: string, options: LookupOptions = {}): Promise<MoverLookupResult> {
  const number = normalizeLookupNumber(kind, input);
  if (!number) {
    return {
      status: "invalid",
      message: kind === "usdot" ? "Enter a USDOT number: digits only, up to 8." : "Enter an MC number: digits only, up to 8, with or without \"MC\".",
    };
  }
  const adapter = options.adapter ?? getFmcsaAdapter();
  const demo = adapter.source === "fixture";
  const query = { kind, number };
  const base = {
    query,
    source: adapter.source,
    demo,
    links: { snapshot: null as string | null, licensing: FMCSA_LI_URL, protectYourMove: PROTECT_YOUR_MOVE_URL },
  };

  let usdot = number;
  if (kind === "mc") {
    const webKey = env().FMCSA_WEBKEY;
    const resolved = demo ? fixtureUsdotForDocket(number) : webKey ? await liveUsdotForDocket(number, webKey) : null;
    if (!resolved) {
      return demo
        ? { ...base, status: "not_found", retrievedAt: new Date() }
        : { ...base, status: "unavailable", reason: "We couldn't look up that MC number right now. Try the USDOT number, or search FMCSA's records directly.", retrievedAt: new Date() };
    }
    usdot = resolved;
  }

  const lookup = await adapter.lookupCarrier(usdot);
  const links = { ...base.links, snapshot: fmcsaSnapshotUrl(usdot) };
  if (lookup.status === "unavailable") {
    const reason = demo
      ? `This preview uses recorded demo data for USDOT ${FIXTURE_USDOT_MIN} to ${FIXTURE_USDOT_MAX} only. Check other numbers on FMCSA's own pages below.`
      : "FMCSA's service didn't answer. Try again later, or search FMCSA's records directly.";
    return { ...base, links, status: "unavailable", reason, retrievedAt: lookup.retrievedAt };
  }
  if (lookup.status === "not_found") return { ...base, links, status: "not_found", retrievedAt: lookup.retrievedAt };

  const r = lookup.record;
  const record: MoverRecordView = {
    usdot: r.usdot,
    legalName: r.legalName,
    dbaName: r.dbaName,
    usdotStatus: r.usdotStatus,
    outOfService: r.outOfService,
    basedIn: r.physicalAddress?.city && r.physicalAddress.state ? `${r.physicalAddress.city}, ${r.physicalAddress.state}` : null,
    authorities: r.authorities.map((a) => ({ docket: a.docket, label: authorityLabel(a.type, a.scope), status: a.status, isBroker: a.type === "broker" })),
    classification: classifyAuthorities(r.authorities),
    householdGoods: r.authorities.some((a) => a.type !== "broker" && a.scope === "household_goods" && a.status === "active"),
    insurance: r.insurance,
  };
  const inNetwork = options.skipNetwork ? null : await listedProfileByUsdot(r.usdot);
  return { ...base, links, status: "found", record, inNetwork, retrievedAt: lookup.retrievedAt };
}

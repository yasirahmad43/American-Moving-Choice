/**
 * Demo seed builder for the preview database (build plan §4.1, §10).
 *
 * Writes db/seed/out/demo-seed.sql for a freshly migrated database: users, fictional demo moving
 * companies with verification evidence, coverage and rate cards, consumer requests with consent
 * evidence, purchases, CRM rows, reviews, a case and outbox messages. Everything is fictional:
 * every company name contains "Demo", people use demo.invalid emails and 555-01xx phone numbers,
 * and USDOT numbers come from the FMCSA fixture range 9000001–9000099. Times are relative to now()
 * and dates to current_date, so the data looks current whenever it is loaded.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… SEED_MOVER_EMAIL=… SEED_MOVER_PASSWORD=… pnpm db:seed:build
 *
 * Optional (required for a seed that will be deployed; db:bundle:supabase checks them):
 *   SEED_ADMIN_TOTP_SECRET  base32 TOTP secret (at least 160 bits) enrolled for the admin, so nobody
 *                           can bind their own authenticator at first sign-in. Needs
 *                           APP_ENCRYPTION_KEY, the app's key, to encrypt it.
 *   HMAC_SECRET             the apps' HMAC secret; keys the seeded email and phone hashes so they
 *                           match contactHash() in @amc/server/contact.
 *   WEB_URL                 public site origin for links in demo messages.
 *
 * Passwords that appear anywhere in the repository are refused. The output holds bcrypt hashes of
 * the passwords (never the passwords). It is git-ignored; never commit it. demo-tokens.json next
 * to it holds the manage-request tokens of the open demo requests, for walkthroughs, and
 * demo-seed.meta.json records how the seed was built.
 */
import { createCipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import { REQUEST_INTAKE_BODY, REQUEST_INTAKE_VERSION, SURVEY_FORM_VERSION, renderConsentText } from "@amc/core/src/survey";
import {
  classifyMove,
  matchCompany,
  normalizeEmail,
  normalizeUsPhone,
  parseZip5,
  type CompanyMatchProfile,
  type CoverageRule,
  type LeadFacts,
  type LocationSet,
  type MoveSize,
  type MoveType,
  type ResolvedLocation,
  type Service,
  type StateCode,
} from "@amc/core";

// ================================================================== SQL literals

class Sql {
  constructor(readonly text: string) {}
}
const sql = (text: string): Sql => new Sql(text);

type Value = string | number | boolean | null | Sql;
type Row = Record<string, Value>;

function lit(value: Value): string {
  if (value === null) return "null";
  if (value instanceof Sql) return value.text;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Not a finite number: ${value}`);
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

const textArray = (items: readonly string[]): Sql =>
  sql(items.length ? `array[${items.map(lit).join(", ")}]::text[]` : "'{}'::text[]");
const uuidArray = (items: readonly string[]): Sql =>
  sql(items.length ? `array[${items.map(lit).join(", ")}]::uuid[]` : "'{}'::uuid[]");
const jsonb = (value: unknown): Sql => sql(`${lit(JSON.stringify(value))}::jsonb`);

function insert(table: string, rows: readonly Row[]): string {
  const first = rows[0];
  if (!first) return "";
  const columns = Object.keys(first);
  for (const row of rows) {
    const keys = Object.keys(row);
    if (keys.length !== columns.length || !columns.every((c) => c in row)) {
      throw new Error(`${table}: every row needs the columns ${columns.join(", ")}`);
    }
  }
  const values = rows.map((row) => `  (${columns.map((c) => lit(row[c] ?? null)).join(", ")})`);
  return `insert into ${table} (${columns.join(", ")}) values\n${values.join(",\n")};\n`;
}

function insertSelect(table: string, row: Row, from: string): string {
  const columns = Object.keys(row);
  return `insert into ${table} (${columns.join(", ")})\nselect ${columns.map((c) => lit(row[c] ?? null)).join(",\n       ")}\n${from};\n`;
}

// ================================================================== ids, times, hashes

const HOUR = 60;
const DAY = 24 * HOUR;

/** A timestamp `minutes` from now (negative is in the past), e.g. now() - interval '80 days 3 hours'. */
function at(minutes: number): Sql {
  const total = Math.round(minutes);
  if (total === 0) return sql("now()");
  const abs = Math.abs(total);
  const parts = [
    [Math.floor(abs / DAY), "days"],
    [Math.floor((abs % DAY) / HOUR), "hours"],
    [abs % HOUR, "minutes"],
  ] as const;
  const interval = parts.filter(([n]) => n > 0).map(([n, unit]) => `${n} ${unit}`).join(" ");
  return sql(`now() ${total < 0 ? "-" : "+"} interval '${interval}'`);
}

/** A date `days` from today, e.g. current_date + 24. */
function onDay(days: number): Sql {
  return sql(days === 0 ? "current_date" : `current_date ${days < 0 ? "-" : "+"} ${Math.abs(days)}`);
}

/** Readable fixed UUIDs: a two-hex-digit entity prefix and a sequence number. */
function fixedId(prefix: string, n: number): string {
  if (!/^[0-9a-f]{2}$/.test(prefix) || !Number.isInteger(n) || n < 0 || n > 999_999_999_999) {
    throw new Error(`Bad fixed id ${prefix}/${n}`);
  }
  return `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const ids = {
  user: (n: number) => fixedId("a0", n),
  membership: (n: number) => fixedId("a1", n),
  company: (n: number) => fixedId("c0", n),
  rule: (company: number, k: number) => fixedId("c1", company * 100 + k),
  credential: (company: number, k: number) => fixedId("c2", company * 100 + k),
  authority: (company: number, k: number) => fixedId("c3", company * 100 + k),
  check: (company: number, k: number) => fixedId("c4", company * 100 + k),
  badge: (company: number) => fixedId("c5", company),
  rateCard: (company: number) => fixedId("c6", company),
  group: (request: number) => fixedId("d0", request),
  lead: (request: number) => fixedId("d1", request),
  consent: (request: number) => fixedId("d2", request),
  attempt: (request: number) => fixedId("d3", request),
  purchase: (request: number) => fixedId("d4", request),
  crmRecord: (request: number) => fixedId("e0", request),
  invitation: (n: number) => fixedId("e1", n),
  review: (n: number) => fixedId("e2", n),
  evidence: (n: number) => fixedId("e3", n),
  caseFile: (n: number) => fixedId("f0", n),
  message: (n: number) => fixedId("f1", n),
};

const ADMIN = ids.user(1);
const MOVER_OWNER = ids.user(2);
const POLICY = "share-stepdown-v1-proposal";
const CONSENT_VERSION = REQUEST_INTAKE_VERSION;
/** The Terms and privacy acknowledgment text (a separate control from contact consent). */
const TERMS_ACK_VERSION = "terms-ack-v0-draft";
const CHANNELS = ["call", "sms", "email"];

const sha256 = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Same fixed development value as @amc/server's env.ts: public, so db:bundle:supabase refuses a
 * seed built with it.
 */
export const DEV_HMAC_SECRET = "amc-development-hmac-secret-not-for-production-use";

/**
 * Keyed hash of a normalized email or phone number, identical to contactHash() in
 * @amc/server/contact (a server test compares them). Unkeyed sha256 of a phone number can be
 * reversed by trying every number.
 */
export function contactHashWith(secret: string, kind: "email" | "phone", normalized: string): string {
  return createHmac("sha256", secret).update(`contact:${kind}\u0000${normalized}`, "utf8").digest("hex");
}
const newToken = (): string => randomBytes(32).toString("base64url");
const pad = (n: number, width: number): string => String(n).padStart(width, "0");

// ================================================================== geography

interface Place {
  zip: string;
  city: string;
  state: StateCode;
  county: string; // 5-digit county FIPS
  lat: number;
  lng: number;
}

const place = (zip: string, city: string, state: StateCode, county: string, lat: number, lng: number): Place =>
  ({ zip, city, state, county, lat, lng });

// Approximate ZIP centroids; the app's geo module uses the GeoNames dataset.
const P = {
  austin78704: place("78704", "Austin", "TX", "48453", 30.2425, -97.7703),
  austin78745: place("78745", "Austin", "TX", "48453", 30.207, -97.796),
  houston77002: place("77002", "Houston", "TX", "48201", 29.756, -95.365),
  houston77006: place("77006", "Houston", "TX", "48201", 29.7409, -95.3917),
  houston77007: place("77007", "Houston", "TX", "48201", 29.77, -95.41),
  houston77008: place("77008", "Houston", "TX", "48201", 29.799, -95.411),
  sanAntonio78205: place("78205", "San Antonio", "TX", "48029", 29.424, -98.489),
  sanAntonio78209: place("78209", "San Antonio", "TX", "48029", 29.489, -98.456),
  fortWorth76102: place("76102", "Fort Worth", "TX", "48439", 32.755, -97.33),
  dallas75204: place("75204", "Dallas", "TX", "48113", 32.8023, -96.7896),
  dallas75207: place("75207", "Dallas", "TX", "48113", 32.787, -96.82),
  lubbock79401: place("79401", "Lubbock", "TX", "48303", 33.586, -101.846),
  orlando32801: place("32801", "Orlando", "FL", "12095", 28.542, -81.379),
  miami33130: place("33130", "Miami", "FL", "12086", 25.767, -80.2045),
  tampa33602: place("33602", "Tampa", "FL", "12057", 27.95, -82.457),
  tampa33606: place("33606", "Tampa", "FL", "12057", 27.933, -82.471),
  fortLauderdale33301: place("33301", "Fort Lauderdale", "FL", "12011", 26.121, -80.129),
  jacksonville32202: place("32202", "Jacksonville", "FL", "12031", 30.326, -81.656),
  jacksonville32205: place("32205", "Jacksonville", "FL", "12031", 30.317, -81.723),
  losAngeles90012: place("90012", "Los Angeles", "CA", "06037", 34.061, -118.239),
  losAngeles90026: place("90026", "Los Angeles", "CA", "06037", 34.0766, -118.2646),
  irvine92618: place("92618", "Irvine", "CA", "06059", 33.6567, -117.736),
  longBeach90802: place("90802", "Long Beach", "CA", "06037", 33.766, -118.193),
  pasadena91101: place("91101", "Pasadena", "CA", "06037", 34.147, -118.139),
  santaAna92701: place("92701", "Santa Ana", "CA", "06059", 33.748, -117.859),
};

const STATE_NAMES: Partial<Record<StateCode, string>> = { TX: "Texas", FL: "Florida", CA: "California" };

function haversineMiles(a: Place, b: Place): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

function resolved(p: Place): ResolvedLocation {
  const zip = parseZip5(p.zip);
  if (!zip) throw new Error(`Bad ZIP ${p.zip}`);
  return { zip, city: p.city, state: p.state, countyFips: p.county };
}

// ================================================================== companies

interface SideSpec {
  states?: StateCode[];
  counties?: string[];
  zips?: string[];
}

interface RuleSpec {
  kind?: "include" | "exclude";
  label: string;
  origin?: SideSpec;
  destination?: SideSpec;
  moveTypes?: MoveType[];
  moveSizes?: MoveSize[];
  services?: Service[];
  paused?: boolean;
}

interface CompanySpec {
  n: number; // fixed-id index; USDOT 9000000 + n
  name: string;
  status: "approved" | "in_review" | "rejected";
  hq: Place;
  street: string;
  areaCode: string;
  /** Approval for approved companies, application for the others (days before now). */
  daysAgo: number;
  brokerAuthority?: boolean;
  capabilities?: { moveTypes: MoveType[]; moveSizes: MoveSize[]; services: Service[] };
  rules: RuleSpec[];
  prices?: { exclusive: number; shared: number };
  rateCard?: { factor: number };
  summary: string;
}

const HOME_SIZES: MoveSize[] = ["studio", "1br", "2br", "3br", "4br_plus"];
const LA_COUNTY = "06037";
const ORANGE_COUNTY_CA = "06059";

const TX_STATEWIDE: RuleSpec = {
  label: "Texas statewide: local and intrastate", origin: { states: ["TX"] }, destination: { states: ["TX"] },
  moveTypes: ["local", "intrastate"],
};
const FL_STATEWIDE: RuleSpec = {
  label: "Florida statewide: local and intrastate", origin: { states: ["FL"] }, destination: { states: ["FL"] },
  moveTypes: ["local", "intrastate"],
};
const TX_TO_FL: RuleSpec = {
  label: "Texas to Florida (interstate)", origin: { states: ["TX"] }, destination: { states: ["FL"] }, moveTypes: ["interstate"],
};
const FL_TO_TX: RuleSpec = {
  label: "Florida to Texas (interstate)", origin: { states: ["FL"] }, destination: { states: ["TX"] }, moveTypes: ["interstate"],
};
const NATIONWIDE_INTERSTATE: RuleSpec = { label: "Nationwide interstate", moveTypes: ["interstate"] };

const COMPANIES: CompanySpec[] = [
  {
    n: 1, name: "Demo Lone Star Relocation Co.", status: "approved", hq: P.austin78704, street: "1201 Demo Parkway",
    areaCode: "512", daysAgo: 240,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items"] },
    rules: [TX_STATEWIDE, TX_TO_FL, FL_TO_TX], prices: { exclusive: 9500, shared: 4200 }, rateCard: { factor: 1 },
    summary: "an Austin, Texas mover offering local and long-distance moves within Texas and between Texas and Florida",
  },
  {
    n: 2, name: "Demo Bluebonnet Hill Movers", status: "approved", hq: P.houston77007, street: "4400 Demo Bayou Street",
    areaCode: "713", daysAgo: 400,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: [...HOME_SIZES, "office"], services: ["full_service", "packing", "storage", "labor_only"] },
    rules: [TX_STATEWIDE], prices: { exclusive: 8800, shared: 3900 }, rateCard: { factor: 0.94 },
    summary: "a Houston, Texas mover offering local and intrastate moves across Texas, including office moves",
  },
  {
    n: 3, name: "Demo Pecan Grove Moving Co.", status: "approved", hq: P.sanAntonio78205, street: "310 Demo Mission Road",
    areaCode: "210", daysAgo: 60,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: ["studio", "1br", "2br", "3br"], services: ["full_service", "packing"] },
    rules: [TX_STATEWIDE, TX_TO_FL], prices: { exclusive: 8200, shared: 3600 }, rateCard: { factor: 0.98 },
    summary: "a San Antonio, Texas mover offering moves within Texas and from Texas to Florida",
  },
  {
    n: 4, name: "Demo Mesquite Trail Movers", status: "approved", hq: P.fortWorth76102, street: "975 Demo Stockyard Lane",
    areaCode: "817", daysAgo: 180,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items"] },
    rules: [TX_STATEWIDE], prices: { exclusive: 9000, shared: 4000 }, rateCard: { factor: 1.04 },
    summary: "a Fort Worth, Texas mover offering local and intrastate moves across Texas",
  },
  {
    n: 5, name: "Demo Trinity River Moving Co.", status: "approved", hq: P.dallas75207, street: "2600 Demo Commerce Street",
    areaCode: "214", daysAgo: 300,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items", "auto_transport"] },
    rules: [TX_STATEWIDE, NATIONWIDE_INTERSTATE], prices: { exclusive: 10500, shared: 4600 }, rateCard: { factor: 1.08 },
    summary: "a Dallas, Texas mover offering moves within Texas and interstate moves nationwide",
  },
  {
    n: 6, name: "Demo Sunshine Parkway Movers", status: "approved", hq: P.orlando32801, street: "500 Demo Citrus Avenue",
    areaCode: "407", daysAgo: 220,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage"] },
    rules: [FL_STATEWIDE, FL_TO_TX], prices: { exclusive: 9200, shared: 4100 }, rateCard: { factor: 1 },
    summary: "an Orlando, Florida mover offering moves within Florida and from Florida to Texas",
  },
  {
    n: 7, name: "Demo Palmetto Grove Relocation", status: "approved", hq: P.miami33130, street: "1450 Demo Bayfront Way",
    areaCode: "305", daysAgo: 120,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items"] },
    rules: [
      FL_STATEWIDE, FL_TO_TX,
      { kind: "exclude", label: "No moves to Monroe County (Florida Keys)", destination: { counties: ["12087"] } },
    ],
    prices: { exclusive: 9800, shared: 4300 }, rateCard: { factor: 1.04 },
    summary: "a Miami, Florida mover offering moves within Florida (except to the Florida Keys) and from Florida to Texas",
  },
  {
    n: 8, name: "Demo Coral Key Moving Co.", status: "approved", hq: P.tampa33602, street: "220 Demo Channel Street",
    areaCode: "813", daysAgo: 45,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: ["studio", "1br", "2br", "3br"], services: ["full_service", "packing"] },
    rules: [FL_STATEWIDE], prices: { exclusive: 7800, shared: 3400 }, rateCard: { factor: 0.94 },
    summary: "a Tampa, Florida mover offering local and intrastate moves across Florida",
  },
  {
    n: 9, name: "Demo Manatee Bay Movers", status: "approved", hq: P.fortLauderdale33301, street: "640 Demo Riverwalk Drive",
    areaCode: "954", daysAgo: 330,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: [...HOME_SIZES, "office"], services: ["full_service", "packing", "storage", "labor_only"] },
    rules: [FL_STATEWIDE], prices: { exclusive: 8500, shared: 3800 }, rateCard: { factor: 0.98 },
    summary: "a Fort Lauderdale, Florida mover offering local and intrastate moves across Florida, including office moves",
  },
  {
    n: 10, name: "Demo First Light Moving Co.", status: "approved", hq: P.jacksonville32202, street: "75 Demo Riverside Avenue",
    areaCode: "904", daysAgo: 500,
    capabilities: { moveTypes: ["local", "intrastate", "interstate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items"] },
    rules: [FL_STATEWIDE, NATIONWIDE_INTERSTATE], prices: { exclusive: 10200, shared: 4500 }, rateCard: { factor: 1.08 },
    summary: "a Jacksonville, Florida mover offering moves within Florida and interstate moves nationwide",
  },
  {
    n: 11, name: "Demo Golden Poppy Movers", status: "approved", hq: P.losAngeles90012, street: "300 Demo Sunset Way",
    areaCode: "213", daysAgo: 260,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage"] },
    rules: [
      { label: "Los Angeles and Orange counties: local", origin: { counties: [LA_COUNTY, ORANGE_COUNTY_CA] }, destination: { counties: [LA_COUNTY, ORANGE_COUNTY_CA] }, moveTypes: ["local"] },
      { label: "From Los Angeles County across California", origin: { counties: [LA_COUNTY] }, destination: { states: ["CA"] }, moveTypes: ["intrastate"] },
    ],
    prices: { exclusive: 11000, shared: 4800 }, rateCard: { factor: 1 },
    summary: "a Los Angeles, California mover offering local moves in Los Angeles and Orange counties and moves from Los Angeles County across California",
  },
  {
    n: 12, name: "Demo Orange Blossom Relocation", status: "approved", hq: P.irvine92618, street: "18 Demo Grove Court",
    areaCode: "949", daysAgo: 150,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "specialty_items"] },
    rules: [{ label: "From Orange and Los Angeles counties", origin: { counties: [ORANGE_COUNTY_CA, LA_COUNTY] }, moveTypes: ["local", "intrastate"] }],
    prices: { exclusive: 10800, shared: 4700 }, rateCard: { factor: 0.98 },
    summary: "an Irvine, California mover offering local and intrastate moves from Orange and Los Angeles counties",
  },
  {
    n: 13, name: "Demo Pacific Tide Moving Co.", status: "approved", hq: P.longBeach90802, street: "410 Demo Pier Way",
    areaCode: "562", daysAgo: 75,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: ["studio", "1br", "2br", "3br"], services: ["full_service", "packing", "labor_only"] },
    rules: [{ label: "Los Angeles County to Los Angeles and Orange counties: local", origin: { counties: [LA_COUNTY] }, destination: { counties: [LA_COUNTY, ORANGE_COUNTY_CA] }, moveTypes: ["local"] }],
    prices: { exclusive: 9900, shared: 4300 }, rateCard: { factor: 0.94 },
    summary: "a Long Beach, California mover offering local moves from Los Angeles County to Los Angeles and Orange counties",
  },
  {
    n: 14, name: "Demo Sierra Vista Movers", status: "approved", hq: P.pasadena91101, street: "77 Demo Colorado Court",
    areaCode: "626", daysAgo: 210,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: HOME_SIZES, services: ["full_service", "packing", "storage", "specialty_items"] },
    rules: [
      { label: "From Los Angeles County", origin: { counties: [LA_COUNTY] }, moveTypes: ["local", "intrastate"] },
      { label: "From Orange County (paused)", origin: { counties: [ORANGE_COUNTY_CA] }, moveTypes: ["local"], paused: true },
    ],
    prices: { exclusive: 11500, shared: 5000 }, rateCard: { factor: 1.08 },
    summary: "a Pasadena, California mover offering local and intrastate moves from Los Angeles County",
  },
  {
    n: 15, name: "Demo Harbor Lantern Moving Co.", status: "approved", hq: P.santaAna92701, street: "905 Demo Lantern Lane",
    areaCode: "714", daysAgo: 30,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: ["studio", "1br", "2br"], services: ["full_service", "packing"] },
    rules: [{ label: "Orange County to Orange and Los Angeles counties: local", origin: { counties: [ORANGE_COUNTY_CA] }, destination: { counties: [ORANGE_COUNTY_CA, LA_COUNTY] }, moveTypes: ["local"] }],
    prices: { exclusive: 9400, shared: 4100 }, rateCard: { factor: 1.04 },
    summary: "a Santa Ana, California mover offering local moves from Orange County to Orange and Los Angeles counties",
  },
  {
    n: 16, name: "Demo Prairie Wind Movers", status: "in_review", hq: P.lubbock79401, street: "1600 Demo Plains Avenue",
    areaCode: "806", daysAgo: 6,
    capabilities: { moveTypes: ["local", "intrastate"], moveSizes: HOME_SIZES, services: ["full_service", "packing"] },
    rules: [TX_STATEWIDE], prices: { exclusive: 9300, shared: 4100 },
    summary: "a Lubbock, Texas mover whose application is waiting for admin review",
  },
  {
    n: 17, name: "Demo Dual Authority Moving Group", status: "rejected", hq: P.houston77002, street: "700 Demo Exchange Street",
    areaCode: "832", daysAgo: 40, brokerAuthority: true, rules: [],
    summary: "a Houston, Texas company rejected because it also holds broker authority",
  },
];

const companyByN = new Map(COMPANIES.map((c) => [c.n, c]));
function companySpec(n: number): CompanySpec {
  const c = companyByN.get(n);
  if (!c) throw new Error(`No demo company ${n}`);
  return c;
}

const usdotOf = (c: CompanySpec): string => String(9_000_000 + c.n);
const mcOf = (c: CompanySpec): string => `MC-${usdotOf(c)}`;
const phoneOf = (c: CompanySpec): string => `+1${c.areaCode}55501${pad(c.n, 2)}`;
const slugOf = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
/** Company profile path (site architecture: profiles live under /companies/{slug}/). */
const profilePath = (name: string): string => `/companies/${slugOf(name)}/`;
const applicationDaysAgo = (c: CompanySpec): number => (c.status === "approved" ? c.daysAgo + 14 : c.daysAgo);
const REJECTED_DAYS_AGO = 35;
/** Days since the last status change (approval, entering review, or rejection). */
const lastStatusDaysAgo = (c: CompanySpec): number =>
  c.status === "approved" ? c.daysAgo : c.status === "in_review" ? c.daysAgo - 1 : REJECTED_DAYS_AGO;
/** COI expiry drives credentials_valid_until. */
const coiExpiryDays = (c: CompanySpec): number => 120 + c.n * 11;

function description(c: CompanySpec): string {
  return `${c.name} is a fictional demo company created for the American Moving Choice preview. It is not a real business: `
    + "its name, address, phone number, USDOT and MC numbers, credentials, prices and reviews are sample data, and it cannot be hired. "
    + `In the preview it appears as ${c.summary}.`;
}

function toLocationSet(side: SideSpec | undefined): LocationSet | undefined {
  if (!side) return undefined;
  const zips = side.zips?.map((z) => {
    const zip = parseZip5(z);
    if (!zip) throw new Error(`Bad ZIP ${z}`);
    return zip;
  });
  return { states: side.states, countyFips: side.counties, zips };
}

function coverageRulesFor(c: CompanySpec): CoverageRule[] {
  return c.rules.map((r, k) => ({
    id: ids.rule(c.n, k + 1),
    kind: r.kind ?? "include",
    origin: toLocationSet(r.origin),
    destination: toLocationSet(r.destination),
    moveTypes: r.moveTypes,
    moveSizes: r.moveSizes,
    services: r.services,
    paused: r.paused,
  }));
}

// ================================================================== verification fixtures

const CHECK_TYPES = [
  "usdot_active", "identity_match", "authority_type", "authority_status", "insurance_filings",
  "recent_record_changes", "callback_verification", "state_credentials", "insurance_certificate",
] as const;
type CheckType = (typeof CHECK_TYPES)[number];

const STATE_CREDENTIAL: Partial<Record<StateCode, { issuer: string; number: (n: number) => string }>> = {
  TX: { issuer: "Texas Department of Motor Vehicles (TxDMV)", number: (n) => `TXDMV-DEMO-${pad(n, 6)}` },
  FL: { issuer: "Florida Department of Agriculture and Consumer Services (FDACS)", number: (n) => `FDACS-IM-DEMO-${pad(n, 4)}` },
  CA: { issuer: "California Bureau of Household Goods and Services (BHGS)", number: (n) => `CAL-T-DEMO-${pad(n, 4)}` },
};

function stateCredential(c: CompanySpec): { issuer: string; number: string } {
  const s = STATE_CREDENTIAL[c.hq.state];
  if (!s) throw new Error(`No state credential fixture for ${c.hq.state}`);
  return { issuer: s.issuer, number: s.number(c.n) };
}

interface CheckOutcome {
  result: "pass" | "fail" | "needs_review";
  note?: string;
  reviewed?: boolean;
}

function checkPayload(c: CompanySpec, type: CheckType): Record<string, unknown> {
  const base = { fixture: true, usdot: usdotOf(c) };
  switch (type) {
    case "usdot_active":
      return { ...base, legal_name: c.name, usdot_status: "ACTIVE", out_of_service: false, entity_type: "CARRIER" };
    case "identity_match":
      return {
        ...base, application_name: c.name,
        record_name: c.status === "in_review" ? c.name.replace("Movers", "Moving & Storage") : c.name,
        record_address: `${c.street}, ${c.hq.city}, ${c.hq.state} ${c.hq.zip}`,
      };
    case "authority_type":
      return {
        ...base,
        dockets: c.brokerAuthority
          ? [{ docket: mcOf(c), authority: "common", household_goods: true }, { docket: mcOf(c), authority: "broker", household_goods: false }]
          : [{ docket: mcOf(c), authority: "common", household_goods: true }],
      };
    case "authority_status":
      return { ...base, docket: mcOf(c), authority_status: "ACTIVE", pending_application: false };
    case "insurance_filings":
      return { ...base, docket: mcOf(c), bipd_on_file: true, cargo_on_file: true };
    case "recent_record_changes":
      return { ...base, changes_last_90_days: c.status === "in_review" ? ["mailing_address"] : [] };
    case "callback_verification":
      return { ...base, phone_on_record: phoneOf(c), outcome: "confirmed_application" };
    case "state_credentials":
      return { ...base, state: c.hq.state, credential_number: stateCredential(c).number, credential_status: "ACTIVE" };
    case "insurance_certificate":
      return { ...base, named_insured: c.name, general_liability_cents: 100_000_000, cargo_cents: 10_000_000, expires_in_days: coiExpiryDays(c) };
  }
}

function sourceUrl(c: CompanySpec, type: CheckType): string | null {
  switch (type) {
    case "callback_verification":
      return null;
    case "state_credentials":
      return `fixture://states/${c.hq.state.toLowerCase()}/credentials/${stateCredential(c).number}`;
    case "insurance_certificate":
      return `fixture://documents/coi/${usdotOf(c)}`;
    default:
      return `fixture://fmcsa/carriers/${usdotOf(c)}`;
  }
}

/** Which checks each company has on record, and their outcomes. */
function checkPlan(c: CompanySpec): Partial<Record<CheckType, CheckOutcome>> {
  if (c.status === "approved") {
    const reviewed: CheckOutcome = { result: "pass", reviewed: true };
    return {
      usdot_active: { result: "pass" },
      identity_match: { result: "pass", reviewed: true, note: "Demo fixture: name and address match the application." },
      authority_type: { result: "pass" },
      authority_status: { result: "pass" },
      insurance_filings: { result: "pass" },
      recent_record_changes: { result: "pass" },
      callback_verification: { ...reviewed, note: "Demo fixture: a call to the phone number on the fixture record confirmed the application." },
      state_credentials: { ...reviewed, note: "Demo fixture: state credential shown as active on the fixture lookup." },
      insurance_certificate: { ...reviewed, note: "Demo fixture: named insured matches; expiry captured." },
    };
  }
  if (c.status === "in_review") {
    return {
      usdot_active: { result: "pass" },
      identity_match: { result: "needs_review", note: "Fixture record lists a different DBA; reviewer to confirm." },
      authority_type: { result: "pass" },
      authority_status: { result: "pass" },
      insurance_filings: { result: "pass" },
      recent_record_changes: { result: "needs_review", note: "Mailing address changed on the fixture record in the last 90 days." },
      insurance_certificate: { result: "pass" },
    };
  }
  return {
    usdot_active: { result: "pass" },
    identity_match: { result: "pass" },
    authority_type: {
      result: "fail", reviewed: true,
      note: "Broker authority on record alongside carrier authority (dual registration). Excluded under the movers-only policy.",
    },
    authority_status: { result: "pass" },
    insurance_filings: { result: "pass" },
  };
}

// ================================================================== rate cards (build plan §7.3)

// Hourly rates for crews of 2, 3, 4 and 5 movers.
// Packing and monthly storage by home size (studio to 4+ bedrooms), and one specialty item.
type Five = [number, number, number, number, number];
const RATE_BASE: Partial<Record<StateCode, { crew: [number, number, number, number]; travel: number; cwt: Five; extraHours: number; packing: Five; storage: Five; specialty: number }>> = {
  TX: { crew: [12900, 16900, 20900, 24900], travel: 12500, cwt: [6800, 8200, 9800, 11200, 12800], extraHours: 0, packing: [30000, 45000, 65000, 90000, 120000], storage: [15000, 20000, 27500, 35000, 45000], specialty: 35000 },
  FL: { crew: [13500, 17500, 21900, 26300], travel: 13500, cwt: [7000, 8500, 10100, 11500, 13200], extraHours: 0, packing: [32000, 47500, 68000, 94000, 125000], storage: [16000, 21500, 29000, 37000, 47500], specialty: 37500 },
  CA: { crew: [16900, 21900, 26900, 31900], travel: 17500, cwt: [7900, 9500, 11300, 12900, 14800], extraHours: 0.5, packing: [38000, 56000, 80000, 110000, 145000], storage: [20000, 27000, 36000, 46000, 59000], specialty: 45000 },
};

const round100 = (cents: number): number => Math.round(cents / 100) * 100;

/**
 * How old a company's current rate card is: 30 to 299 days, independent of when the company was
 * approved, so every card counts toward the calculator's 12-month window (build plan §7.3).
 */
export const rateCardAgeDays = (c: { n: number; daysAgo: number }): number =>
  Math.max(1, Math.min(c.daysAgo - 2, 30 + ((c.n * 37) % 270)));

function rateCardFor(state: StateCode, factor: number, offered: readonly Service[] = []): { local: object; long_distance: object; services: object } {
  const b = RATE_BASE[state];
  if (!b) throw new Error(`No rate card base for ${state}`);
  const f = (cents: number) => round100(cents * factor);
  const hours = (h: number) => h + b.extraHours;
  return {
    local: {
      crew_hourly_cents: { "2": f(b.crew[0]), "3": f(b.crew[1]), "4": f(b.crew[2]), "5": f(b.crew[3]) },
      travel_fee_cents: f(b.travel),
      hours_by_size: { studio: hours(3), "1br": hours(4), "2br": hours(5.5), "3br": hours(7.5), "4br_plus": hours(9.5) },
      crew_by_size: { studio: 2, "1br": 2, "2br": 3, "3br": 3, "4br_plus": 4 },
    },
    long_distance: {
      cwt_cents_by_band: {
        "0_250": f(b.cwt[0]), "250_500": f(b.cwt[1]), "500_1000": f(b.cwt[2]), "1000_1500": f(b.cwt[3]), "1500_plus": f(b.cwt[4]),
      },
      weight_lbs_by_size: { studio: 2000, "1br": 3000, "2br": 4500, "3br": 6500, "4br_plus": 9000 },
    },
    // rate_cards.services (migration 120, slice S3): priced only for the services the company offers.
    services: {
      packing_cents_by_size: offered.includes("packing")
        ? { studio: f(b.packing[0]), "1br": f(b.packing[1]), "2br": f(b.packing[2]), "3br": f(b.packing[3]), "4br_plus": f(b.packing[4]) }
        : null,
      storage_cents_per_month_by_size: offered.includes("storage")
        ? { studio: f(b.storage[0]), "1br": f(b.storage[1]), "2br": f(b.storage[2]), "3br": f(b.storage[3]), "4br_plus": f(b.storage[4]) }
        : null,
      specialty_item_cents: offered.includes("specialty_items") ? f(b.specialty) : null,
    },
  };
}

// ================================================================== consumer requests

type SourceCategory = "organic_search" | "paid_search" | "paid_social" | "referral" | "direct" | "other";

interface RequestSpec {
  i: number; // fixed-id index
  person: { first: string; last: string; phone: string };
  origin: Place;
  dest: Place;
  moveSize: MoveSize;
  services: Service[];
  moveDateDays: number; // move date relative to today
  flexible: boolean;
  limit: number;
  source: SourceCategory;
  riskScore: number;
  createdAgo: number; // minutes before now
  device: "mobile" | "desktop";
  removed?: number[]; // companies the consumer removed from the list
  profileCompany?: number; // request started from this company's profile, which is listed first
  liveBuyer?: number; // bought inside the seed through reserve_purchase and complete_purchase
  history?: { buyer: number; purchasedAfter: number; groupStatus: "sold_out" | "expired" };
}

const REQUESTS: RequestSpec[] = [
  {
    i: 1, person: { first: "Jordan", last: "Sample", phone: "+15125550141" }, origin: P.austin78704, dest: P.houston77006,
    moveSize: "2br", services: ["packing"], moveDateDays: 24, flexible: false, limit: 3, source: "organic_search",
    riskScore: 6, createdAgo: 6 * HOUR, device: "mobile", removed: [4], liveBuyer: 1,
  },
  {
    i: 2, person: { first: "Priya", last: "Example", phone: "+13055550142" }, origin: P.miami33130, dest: P.dallas75204,
    moveSize: "3br", services: ["full_service", "packing"], moveDateDays: 38, flexible: true, limit: 1, source: "paid_search",
    riskScore: 14, createdAgo: 3 * HOUR, device: "desktop",
  },
  {
    i: 3, person: { first: "Marcus", last: "Placeholder", phone: "+13235550143" }, origin: P.losAngeles90026, dest: P.irvine92618,
    moveSize: "1br", services: ["packing"], moveDateDays: 17, flexible: false, limit: 2, source: "referral",
    riskScore: 9, createdAgo: 90, device: "mobile",
  },
  {
    i: 4, person: { first: "Elena", last: "Fictional", phone: "+18135550144" }, origin: P.tampa33606, dest: P.orlando32801,
    moveSize: "studio", services: ["storage"], moveDateDays: 45, flexible: true, limit: 2, source: "direct",
    riskScore: 4, createdAgo: 40, device: "mobile", profileCompany: 7,
  },
  {
    i: 5, person: { first: "Sam", last: "Testwell", phone: "+17135550145" }, origin: P.houston77008, dest: P.sanAntonio78209,
    moveSize: "2br", services: ["full_service", "packing"], moveDateDays: -45, flexible: false, limit: 1, source: "organic_search",
    riskScore: 7, createdAgo: 80 * DAY, device: "desktop", history: { buyer: 1, purchasedAfter: 3 * HOUR, groupStatus: "sold_out" },
  },
  {
    i: 6, person: { first: "Chris", last: "Exampleton", phone: "+15125550146" }, origin: P.austin78745, dest: P.jacksonville32205,
    moveSize: "3br", services: ["full_service", "packing", "storage"], moveDateDays: 9, flexible: false, limit: 2, source: "paid_social",
    riskScore: 11, createdAgo: 13 * DAY, device: "mobile", history: { buyer: 1, purchasedAfter: 2 * HOUR, groupStatus: "expired" },
  },
];

const SIZE_LABEL: Record<MoveSize, string> = {
  studio: "Studio", "1br": "1 bedroom", "2br": "2 bedrooms", "3br": "3 bedrooms", "4br_plus": "4+ bedrooms",
  office: "Office", partial: "Partial move",
};

const emailOf = (r: RequestSpec): string => normalizeEmail(`${r.person.first}.${r.person.last}@demo.invalid`);
const referenceCode = (r: RequestSpec): string => `AMC-SEED-${pad(r.i, 4)}`;
const purchaseTime = (r: RequestSpec): number => {
  if (!r.history) throw new Error(`Request ${r.i} has no historical purchase`);
  return -r.createdAgo + r.history.purchasedAfter;
};

interface Matched {
  request: RequestSpec;
  distanceMiles: number;
  moveType: MoveType;
  eligible: { company: CompanySpec; ruleId: string }[];
  shown: { company: CompanySpec; ruleId: string }[]; // display order, before removals
  named: CompanySpec[];
  removed: CompanySpec[];
}

/** Runs the @amc/core matcher against the companies that were approved when the request arrived. */
function match(r: RequestSpec): Matched {
  const distanceMiles = Math.round(haversineMiles(r.origin, r.dest) * 10) / 10;
  const origin = resolved(r.origin);
  const destination = resolved(r.dest);
  const facts: LeadFacts = {
    origin, destination, moveType: classifyMove(origin, destination, distanceMiles, 50), moveSize: r.moveSize, services: r.services,
  };
  const eligible: Matched["eligible"] = [];
  for (const c of COMPANIES) {
    const profile: CompanyMatchProfile = {
      companyId: ids.company(c.n),
      eligibleToPurchase: c.status === "approved" && !c.brokerAuthority && c.daysAgo * DAY > r.createdAgo,
      capabilities: c.capabilities ?? { moveTypes: [], moveSizes: [], services: [] },
      rules: coverageRulesFor(c),
    };
    const result = matchCompany(profile, facts);
    if (result.eligible) eligible.push({ company: c, ruleId: result.ruleId });
  }
  // A profile-origin company comes first; the rest follow a neutral rotation (implications §3.1).
  const first = eligible.filter((e) => e.company.n === r.profileCompany);
  const rest = eligible.filter((e) => e.company.n !== r.profileCompany);
  const shift = rest.length ? r.i % rest.length : 0;
  const shown = [...first, ...rest.slice(shift), ...rest.slice(0, shift)];
  const removedSet = new Set(r.removed ?? []);
  const named = shown.filter((e) => !removedSet.has(e.company.n)).map((e) => e.company);
  const removed = shown.filter((e) => removedSet.has(e.company.n)).map((e) => e.company);

  const buyer = r.liveBuyer ?? r.history?.buyer;
  if (removed.length !== removedSet.size) throw new Error(`Request ${r.i}: a removed company was not eligible`);
  if (buyer !== undefined && !named.some((c) => c.n === buyer)) throw new Error(`Request ${r.i}: buyer ${buyer} is not named`);
  if (r.limit < 1 || r.limit > Math.min(5, named.length)) throw new Error(`Request ${r.i}: limit ${r.limit} exceeds the named movers`);
  return { request: r, distanceMiles, moveType: facts.moveType, eligible, shown, named, removed };
}

/** The rendered consent text, assembled in SQL around the stored consent body (alias v). */
function renderedConsentSql(m: Matched): string {
  return lit(renderConsentText(REQUEST_INTAKE_BODY, {
    movers: m.named.map((c) => ({ displayName: c.name, usdotNumber: usdotOf(c) })),
    limit: m.request.limit,
    channels: ["call", "sms", "email"],
  }));
}

// ================================================================== build

export interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
  moverEmail: string;
  moverPassword: string;
  /** bcrypt cost; 12 for real builds (build plan §5). Tests may lower it. */
  bcryptCost?: number;
  /** Base32 TOTP secret enrolled for the admin; needs encryptionKey. Without it the admin enrolls at first sign-in. */
  adminTotpSecret?: string;
  /** APP_ENCRYPTION_KEY (64 hex characters or base64 of 32 bytes), to encrypt adminTotpSecret. */
  encryptionKey?: string;
  /** HMAC_SECRET for email and phone hashes; the public development value when absent. */
  hmacSecret?: string;
  /** Public site origin for links in demo messages. */
  webUrl?: string;
}

/**
 * Passwords that are written down in this repository (old e2e defaults, examples). A seed built
 * with one of them would publish working credentials for the deployed preview.
 */
export const KNOWN_PASSWORDS: readonly string[] = [
  "preview-admin-pass-2026",
  "preview-mover-pass-2026",
  "admin-password-for-tests",
  "mover-password-for-tests",
];

const BASE32 = /^[A-Z2-7]+=*$/;

/** Decodes a 32-byte key given as 64 hex characters or base64/base64url (as @amc/server's decodeKey). */
function decodeKey(value: string): Buffer | null {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, "hex");
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(trimmed)) {
    const bytes = Buffer.from(trimmed.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (bytes.length === 32) return bytes;
  }
  return null;
}

/**
 * AES-256-GCM in the format of @amc/server's auth/crypto.ts ("v1.<iv>.<tag>.<ciphertext>",
 * base64url), with the associated data mfa.ts uses for users.mfa_secret_enc.
 */
export function encryptTotpSecretForSeed(userId: string, secret: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`users.mfa_secret_enc:${userId}`, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export interface SeedOutput {
  /** The full script: header, begin, body, commit. */
  sql: string;
  /** How the seed was built, for db:bundle:supabase's deploy checks. No secrets. */
  meta: SeedMeta;
  /** The statements alone, for callers that manage the transaction. */
  body: string;
  /** Manage-request tokens of the open demo requests, by reference code. */
  tokens: Record<string, { referenceCode: string; manageToken: string }>;
  counts: Record<string, number>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkOptions(o: SeedOptions): SeedOptions {
  const adminEmail = normalizeEmail(o.adminEmail);
  const moverEmail = normalizeEmail(o.moverEmail);
  for (const [name, email] of [["SEED_ADMIN_EMAIL", adminEmail], ["SEED_MOVER_EMAIL", moverEmail]] as const) {
    if (!EMAIL_PATTERN.test(email)) throw new Error(`${name} is not an email address`);
  }
  if (adminEmail === moverEmail) throw new Error("SEED_ADMIN_EMAIL and SEED_MOVER_EMAIL must differ");
  for (const [name, password] of [["SEED_ADMIN_PASSWORD", o.adminPassword], ["SEED_MOVER_PASSWORD", o.moverPassword]] as const) {
    if (password.length < 12) throw new Error(`${name} must be at least 12 characters`);
    if (Buffer.byteLength(password, "utf8") > 72) throw new Error(`${name} must be at most 72 bytes (bcrypt ignores the rest)`);
    if (KNOWN_PASSWORDS.includes(password)) throw new Error(`${name} is written down in this repository; choose a new random password`);
  }
  if (o.adminPassword === o.moverPassword) throw new Error("SEED_ADMIN_PASSWORD and SEED_MOVER_PASSWORD must differ");
  let adminTotpSecret: string | undefined;
  if (o.adminTotpSecret) {
    adminTotpSecret = o.adminTotpSecret.replace(/\s+/g, "").toUpperCase();
    if (!BASE32.test(adminTotpSecret) || adminTotpSecret.replace(/=+$/, "").length < 32) {
      throw new Error("SEED_ADMIN_TOTP_SECRET must be base32 with at least 32 characters (160 bits)");
    }
    if (!o.encryptionKey || !decodeKey(o.encryptionKey)) {
      throw new Error("SEED_ADMIN_TOTP_SECRET needs APP_ENCRYPTION_KEY (the app's key, 32 bytes as 64 hex characters or base64)");
    }
  }
  if (o.hmacSecret !== undefined && o.hmacSecret.length < 32) throw new Error("HMAC_SECRET must be at least 32 characters");
  const webUrl = (o.webUrl ?? "http://localhost:3000").replace(/\/+$/, "");
  if (!/^https?:\/\/[^/\s]+$/.test(webUrl)) throw new Error("WEB_URL must be an origin such as https://www.example.com");
  return { ...o, adminEmail, moverEmail, adminTotpSecret, webUrl };
}

export interface SeedMeta {
  /** sha256 of db/seed/build.ts when the seed was built; a stale seed is refused for deploys. */
  builderSha256: string;
  builtAt: string;
  adminTotpEnrolled: boolean;
  hmacSecretIsDevDefault: boolean;
  webUrl: string;
}

export const builderSha256 = (): string => sha256(readFileSync(fileURLToPath(import.meta.url), "utf8"));

export async function buildSeedSql(options: SeedOptions): Promise<SeedOutput> {
  const opts = checkOptions(options);
  const cost = opts.bcryptCost ?? 12;
  const hmacSecret = opts.hmacSecret ?? DEV_HMAC_SECRET;
  const hash = (kind: "email" | "phone", normalized: string): string => contactHashWith(hmacSecret, kind, normalized);
  const adminMfa = opts.adminTotpSecret
    ? { mfa_secret_enc: encryptTotpSecretForSeed(ADMIN, opts.adminTotpSecret, decodeKey(opts.encryptionKey!)!), mfa_enabled_at: at(0) }
    : { mfa_secret_enc: null, mfa_enabled_at: null };
  const [adminHash, moverHash] = await Promise.all([bcrypt.hash(opts.adminPassword, cost), bcrypt.hash(opts.moverPassword, cost)]);

  const approved = COMPANIES.filter((c) => c.status === "approved");
  const matched = REQUESTS.map(match);
  const tokens: SeedOutput["tokens"] = {};
  const parts: string[] = [];
  const section = (title: string, ...statements: string[]) => {
    parts.push(`-- ---------------------------------------------------------------- ${title}\n${statements.filter(Boolean).join("\n")}`);
  };
  const owner = companySpec(1); // the demo mover owner's company

  section("guard",
    `do $$ begin
  if exists (select 1 from companies) or exists (select 1 from users) then
    raise exception 'demo seed expects a freshly migrated database: companies or users already has rows';
  end if;
end $$;\n`);

  // ---------------------------------------------------------------- users
  section("users",
    insert("users", [
      {
        id: ADMIN, email: opts.adminEmail, password_hash: adminHash, full_name: "Demo Administrator", phone: null,
        email_verified_at: at(-600 * DAY), ...adminMfa, failed_logins: 0, locked_until: null,
        last_login_at: null, created_at: at(-600 * DAY), updated_at: at(-600 * DAY),
      },
      {
        id: MOVER_OWNER, email: opts.moverEmail, password_hash: moverHash, full_name: "Demo Mover Owner", phone: "+15125550150",
        email_verified_at: at(-applicationDaysAgo(owner) * DAY), mfa_secret_enc: null, mfa_enabled_at: null, failed_logins: 0,
        locked_until: null, last_login_at: null, created_at: at(-applicationDaysAgo(owner) * DAY), updated_at: at(-applicationDaysAgo(owner) * DAY),
      },
    ]),
    // Without SEED_ADMIN_TOTP_SECRET the admin enrolls TOTP at first sign-in (build plan §6); a
    // deployable seed enrolls it here so nobody else can claim the first sign-in.
    insert("admin_users", [{ user_id: ADMIN, admin_role: "super_admin", created_at: at(-600 * DAY), created_by: null }]),
  );

  // ---------------------------------------------------------------- companies
  const rejectedReason = "Broker authority on record alongside carrier authority (dual registration). Excluded under the movers-only policy.";
  const rejected = COMPANIES.filter((c) => c.status === "rejected");
  section("companies",
    insert("companies", COMPANIES.map((c) => ({
      id: ids.company(c.n), legal_name: c.name, dba_name: null, status: c.status, usdot_number: usdotOf(c), mc_number: mcOf(c),
      has_broker_authority: c.brokerAuthority ?? false,
      credentials_valid_until: c.status === "rejected" ? null : onDay(c.status === "approved" ? coiExpiryDays(c) : 200),
      created_at: at(-applicationDaysAgo(c) * DAY),
      address_line1: c.street, address_line2: null, address_city: c.hq.city, address_state: c.hq.state, address_zip: c.hq.zip,
      phone: phoneOf(c), website: null, billing_status: "good", stripe_customer_id: null, is_demo: true,
      approved_at: c.status === "approved" ? at(-c.daysAgo * DAY) : null, suspended_at: null,
      status_reason: c.status === "rejected" ? rejectedReason : null, updated_at: at(-lastStatusDaysAgo(c) * DAY),
    }))),
    insert("company_status_history", COMPANIES.flatMap((c) => {
      const applied = applicationDaysAgo(c) * DAY;
      const steps: [string | null, string, number, string | null, string | null][] = [
        [null, "applied", applied, null, null],
        ["applied", "verifying", applied - HOUR, null, null],
      ];
      if (c.status === "approved") {
        steps.push(["verifying", "in_review", applied - 4 * DAY, null, null]);
        steps.push(["in_review", "approved", lastStatusDaysAgo(c) * DAY, "All verification checks passed (demo fixture data).", ADMIN]);
      } else if (c.status === "in_review") {
        steps.push(["verifying", "in_review", lastStatusDaysAgo(c) * DAY, "Automated checks finished; two need a reviewer.", null]);
      } else {
        steps.push(["verifying", "in_review", applied - 2 * DAY, null, null]);
        steps.push(["in_review", "rejected", lastStatusDaysAgo(c) * DAY, rejectedReason, ADMIN]);
      }
      return steps.map(([from, to, ago, reason, by]) => ({
        company_id: ids.company(c.n), from_status: from, to_status: to, reason, changed_by: by, created_at: at(-ago),
      }));
    })),
    insert("company_profiles", COMPANIES.filter((c) => c.status !== "rejected").map((c) => ({
      company_id: ids.company(c.n), slug: slugOf(c.name), display_name: c.name, description: description(c), logo_url: null,
      website: null, public_status: c.status === "approved" ? "live" : "hidden",
      network_joined_at: c.status === "approved" ? at(-c.daysAgo * DAY) : null, updated_at: at(-c.daysAgo * DAY),
    }))),
    insert("company_memberships", [{
      id: ids.membership(1), company_id: ids.company(owner.n), user_id: MOVER_OWNER, role: "owner", status: "active",
      can_purchase: true, invited_by: null, created_at: at(-applicationDaysAgo(owner) * DAY),
    }]),
  );

  // ---------------------------------------------------------------- capabilities and coverage
  const withCoverage = COMPANIES.filter((c) => c.capabilities);
  const ruleRows: Row[] = [];
  const locationRows: Row[] = [];
  for (const c of withCoverage) {
    c.rules.forEach((r, k) => {
      const ruleId = ids.rule(c.n, k + 1);
      ruleRows.push({
        id: ruleId, company_id: ids.company(c.n), kind: r.kind ?? "include", move_types: textArray(r.moveTypes ?? []),
        move_sizes: textArray(r.moveSizes ?? []), services: textArray(r.services ?? []), paused: r.paused ?? false, label: r.label,
        created_at: at(-applicationDaysAgo(c) * DAY), updated_at: at(-applicationDaysAgo(c) * DAY),
      });
      for (const [side, spec] of [["origin", r.origin], ["destination", r.destination]] as const) {
        const levels = [["state", spec?.states ?? []], ["county", spec?.counties ?? []], ["zip", spec?.zips ?? []]] as const;
        for (const [level, values] of levels) {
          for (const value of values) locationRows.push({ rule_id: ruleId, side, level, value });
        }
      }
    });
  }
  section("capabilities and coverage (each change moves companies.coverage_version on)",
    insert("company_capabilities", withCoverage.map((c) => ({
      company_id: ids.company(c.n), move_types: textArray(c.capabilities!.moveTypes), move_sizes: textArray(c.capabilities!.moveSizes),
      services: textArray(c.capabilities!.services), updated_at: at(-applicationDaysAgo(c) * DAY),
    }))),
    insert("coverage_rules", ruleRows),
    insert("coverage_rule_locations", locationRows),
  );

  // ---------------------------------------------------------------- verification evidence
  const checkRows: Row[] = [];
  const credentialRows: Row[] = [];
  const authorityRows: Row[] = [];
  const badgeRows: Row[] = [];
  for (const c of COMPANIES) {
    const plan = checkPlan(c);
    // Automated checks ran two days before the status change (the day of it for the applicant
    // in review); reviewer decisions came a day after the automated checks.
    const retrieved = (lastStatusDaysAgo(c) + (c.status === "in_review" ? 0 : 2)) * DAY;
    const checkId = (type: CheckType) => ids.check(c.n, CHECK_TYPES.indexOf(type) + 1);
    for (const type of CHECK_TYPES) {
      const outcome = plan[type];
      if (!outcome) continue;
      const payload = checkPayload(c, type);
      const when = at(-retrieved + (outcome.reviewed ? DAY : 0));
      checkRows.push({
        id: checkId(type), company_id: ids.company(c.n), check_type: type, source: "fixture", source_url: sourceUrl(c, type),
        payload_snapshot: jsonb(payload), payload_sha256: sha256(JSON.stringify(payload)), result: outcome.result,
        reviewer_id: outcome.reviewed ? ADMIN : null, decision_note: outcome.note ?? null, retrieved_at: when, created_at: when,
      });
    }
    const verifiedAt = at(-retrieved + DAY);
    interface CredentialSpec {
      k: number;
      type: string;
      number: string;
      issuer: string;
      state?: StateCode;
      expiresDays?: number;
      status: "verified" | "pending";
      check: CheckType;
    }
    const credential = (s: CredentialSpec): Row => ({
      id: ids.credential(c.n, s.k), company_id: ids.company(c.n), credential_type: s.type, number: s.number, state: s.state ?? null,
      issuer: s.issuer, status: s.status, issued_on: onDay(-(applicationDaysAgo(c) + 400)),
      expires_on: s.expiresDays === undefined ? null : onDay(s.expiresDays),
      verified_at: s.status === "verified" ? verifiedAt : null, verified_by: s.status === "verified" ? ADMIN : null,
      source_check_id: plan[s.check] ? checkId(s.check) : null, source_url: plan[s.check] ? sourceUrl(c, s.check) : null,
      created_at: at(-applicationDaysAgo(c) * DAY), updated_at: s.status === "verified" ? verifiedAt : at(-applicationDaysAgo(c) * DAY),
    });
    const insurer = "Demo Mutual Insurance Co. (fictional)";
    credentialRows.push(credential({ k: 1, type: "usdot", number: usdotOf(c), issuer: "FMCSA", status: "verified", check: "usdot_active" }));
    credentialRows.push(credential({ k: 2, type: "docket", number: mcOf(c), issuer: "FMCSA", status: "verified", check: "authority_status" }));
    if (c.status === "approved") {
      const s = stateCredential(c);
      credentialRows.push(credential({ k: 3, type: "state_license", number: s.number, issuer: s.issuer, state: c.hq.state, expiresDays: 300 + c.n * 7, status: "verified", check: "state_credentials" }));
      credentialRows.push(credential({ k: 4, type: "insurance_coi", number: `COI-DEMO-${pad(c.n, 4)}`, issuer: insurer, expiresDays: coiExpiryDays(c), status: "verified", check: "insurance_certificate" }));
      credentialRows.push(credential({ k: 5, type: "insurance_filing", number: `BMC-91X-DEMO-${pad(c.n, 4)}`, issuer: "FMCSA", status: "verified", check: "insurance_filings" }));
      badgeRows.push({
        id: ids.badge(c.n), company_id: ids.company(c.n), badge_type: "preferred_mover", issued_at: at(-c.daysAgo * DAY),
        revoked_at: null, reason: null, evidence_check_ids: uuidArray(CHECK_TYPES.map(checkId)),
      });
    } else if (c.status === "in_review") {
      credentialRows.push(credential({ k: 4, type: "insurance_coi", number: `COI-DEMO-${pad(c.n, 4)}`, issuer: insurer, expiresDays: 200, status: "pending", check: "insurance_certificate" }));
    }
    const authority = (k: number, type: "common" | "broker", scope: "household_goods" | "property"): Row => ({
      id: ids.authority(c.n, k), company_id: ids.company(c.n), docket_number: mcOf(c), authority_type: type, scope, status: "active",
      effective_from: onDay(-(applicationDaysAgo(c) + 400)), effective_to: null, source_check_id: checkId("authority_type"),
      created_at: at(-retrieved),
    });
    authorityRows.push(authority(1, "common", "household_goods"));
    if (c.brokerAuthority) authorityRows.push(authority(2, "broker", "property"));
  }
  section("verification evidence (append-only), credentials, authority and badges",
    insert("verification_checks", checkRows),
    insert("credentials", credentialRows),
    insert("authority_records", authorityRows),
    insert("badges", badgeRows),
  );

  // ---------------------------------------------------------------- prices and rate cards
  section("prices and rate cards (demo values)",
    insert("company_prices", COMPANIES.filter((c) => c.prices).map((c) => ({
      company_id: ids.company(c.n), exclusive_cents: c.prices!.exclusive, shared_cents: c.prices!.shared,
      effective_from: at(-(c.status === "approved" ? c.daysAgo : c.daysAgo - 1) * DAY), set_by: "seed",
    }))),
    insert("rate_cards", COMPANIES.filter((c) => c.rateCard).map((c) => {
      const card = rateCardFor(c.hq.state, c.rateCard!.factor, c.capabilities?.services ?? []);
      return {
        id: ids.rateCard(c.n), company_id: ids.company(c.n), states: textArray([c.hq.state]), local: jsonb(card.local),
        long_distance: jsonb(card.long_distance), services: jsonb(card.services), status: "active", submitted_by: c.n === owner.n ? MOVER_OWNER : null,
        created_at: at(-rateCardAgeDays(c) * DAY),
      };
    })),
  );

  // ---------------------------------------------------------------- consumer requests
  const groupRows: Row[] = [];
  const leadRows: Row[] = [];
  const validationRows: Row[] = [];
  const touchRows: Row[] = [];
  const consentStatements: string[] = [];
  const eligibilityRows: Row[] = [];
  for (const m of matched) {
    const r = m.request;
    const created = at(-r.createdAgo);
    const email = emailOf(r);
    const phone = normalizeUsPhone(r.person.phone);
    if (!phone) throw new Error(`Request ${r.i}: bad phone ${r.person.phone}`);
    const manageToken = newToken();
    if (!r.history) tokens[referenceCode(r)] = { referenceCode: referenceCode(r), manageToken };

    groupRows.push({
      id: ids.group(r.i), sharing_limit: r.limit, policy_version: POLICY, status: r.history?.groupStatus ?? "available",
      expires_at: r.history ? at(-r.createdAgo + 72 * HOUR) : at(72 * HOUR), created_at: created,
    });
    leadRows.push({
      id: ids.lead(r.i), group_id: ids.group(r.i), selected_limit: r.limit, first_name: r.person.first, last_name: r.person.last,
      email, phone_e164: phone, origin_zip: r.origin.zip, dest_zip: r.dest.zip, is_primary: true, created_at: created,
      reference_code: referenceCode(r), status: "qualified", move_date: onDay(r.moveDateDays), move_date_flexible: r.flexible,
      move_size: r.moveSize, services: textArray(r.services), origin_city: r.origin.city, origin_state: r.origin.state,
      origin_county_fips: r.origin.county, dest_city: r.dest.city, dest_state: r.dest.state, dest_county_fips: r.dest.county,
      distance_miles: m.distanceMiles, move_type: m.moveType, channel_scope: textArray(CHANNELS), email_hash: hash("email", email),
      phone_hash: hash("phone", phone), risk_score: r.riskScore, source_category: r.source, manage_token_hash: sha256(manageToken),
      withdrawn_at: null, profile_company_id: r.profileCompany ? ids.company(r.profileCompany) : null,
    });
    const checks: [string, "pass" | "skipped", string][] = [
      ["honeypot", "pass", "Hidden field left empty."],
      ["min_completion_time", "pass", `Completed in ${2 + r.i} minutes.`],
      ["rate_limit", "pass", "Under the per-IP submission limit."],
      ["phone_format", "pass", "Valid NANP number (fictional 555-01xx range)."],
      ["phone_line_type", "skipped", "Demo mode: no carrier lookup provider is configured."],
      ["email_syntax", "pass", "Valid address syntax."],
      ["email_mx", "skipped", "Demo mode: demo.invalid is a reserved test domain, so no MX lookup ran."],
      ["disposable_email", "pass", "Domain is not on the disposable-address list."],
      ["duplicate_check", "pass", "No matching request in the last 30 days."],
      ["risk_score", "pass", `Risk score ${r.riskScore} of 100, below the review threshold.`],
    ];
    for (const [check, result, reason] of checks) {
      validationRows.push({ lead_id: ids.lead(r.i), check_type: check, result, reason, provider_ref: null, created_at: created });
    }
    const touch: Record<SourceCategory, { landing: string; referrer: string | null; utm: [string, string, string] | null; clickIds: object | null; evidence: string }> = {
      organic_search: { landing: "/moving-cost-calculator", referrer: "https://www.google.com/", utm: null, clickIds: null, evidence: "referrer_inferred" },
      paid_search: { landing: "/get-quotes?utm_source=google&utm_medium=cpc&utm_campaign=demo-long-distance", referrer: "https://www.google.com/", utm: ["google", "cpc", "demo-long-distance"], clickIds: { gclid: `demo-gclid-${pad(r.i, 4)}` }, evidence: "observed" },
      paid_social: { landing: "/get-quotes?utm_source=facebook&utm_medium=paid_social&utm_campaign=demo-interstate", referrer: "https://m.facebook.com/", utm: ["facebook", "paid_social", "demo-interstate"], clickIds: { fbclid: `demo-fbclid-${pad(r.i, 4)}` }, evidence: "observed" },
      referral: { landing: "/guides/moving-checklist", referrer: "https://example.org/blog/moving-tips", utm: null, clickIds: null, evidence: "referrer_inferred" },
      direct: { landing: r.profileCompany ? profilePath(companySpec(r.profileCompany).name) : "/", referrer: null, utm: null, clickIds: null, evidence: "unknown" },
      other: { landing: "/", referrer: null, utm: null, clickIds: null, evidence: "unknown" },
    };
    const t = touch[r.source];
    touchRows.push({
      lead_id: ids.lead(r.i), touch: "first", landing_url: t.landing, referrer: t.referrer, utm_source: t.utm?.[0] ?? null,
      utm_medium: t.utm?.[1] ?? null, utm_campaign: t.utm?.[2] ?? null, utm_term: null, utm_content: null,
      click_ids: t.clickIds ? jsonb(t.clickIds) : null, device: r.device, source_category: r.source, evidence_level: t.evidence,
      created_at: at(-r.createdAgo - 20),
    });
    const formState = JSON.stringify({
      origin_zip: r.origin.zip, dest_zip: r.dest.zip, move_size: r.moveSize, services: r.services, flexible: r.flexible,
      limit: r.limit, shown: m.shown.map((e) => ids.company(e.company.n)), removed: m.removed.map((c) => ids.company(c.n)),
      channels: CHANNELS,
    });
    consentStatements.push(insertSelect("consent_records", {
      id: ids.consent(r.i), lead_id: ids.lead(r.i), consent_text_version_id: sql("v.id"), recipient_disclosure_mode: "request_intake", rendered_text: sql("r.rendered_text"),
      rendered_text_sha256: sql("encode(sha256(convert_to(r.rendered_text, 'UTF8')), 'hex')"),
      named_company_ids: uuidArray(m.named.map((c) => ids.company(c.n))),
      removed_company_ids: uuidArray(m.removed.map((c) => ids.company(c.n))), selected_limit: r.limit,
      channel_scope: textArray(CHANNELS), checkbox_state: true, terms_version: TERMS_ACK_VERSION, terms_accepted: true,
      privacy_version: "privacy-draft-v0", privacy_acknowledged: true, ip: `198.51.100.${10 + r.i}`,
      user_agent: r.device === "mobile"
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      page_url: "/get-quotes/review", form_version: SURVEY_FORM_VERSION, form_state_sha256: sha256(formState), ab_variant: "none",
      phone_hash: hash("phone", phone), email_hash: hash("email", email), tag_manifest_version: "tags-v0-draft", certificate_id: null,
      submitted_at: created,
    }, `from consent_text_versions v\ncross join lateral (select ${renderedConsentSql(m)} as rendered_text) r\nwhere v.id = ${lit(CONSENT_VERSION)}`));
    // Eligibility snapshot: removed movers keep a row with named_in_consent false and can never buy.
    for (const e of m.shown) {
      eligibilityRows.push({
        group_id: ids.group(r.i), company_id: ids.company(e.company.n), matched_rule_id: e.ruleId,
        named_in_consent: m.named.includes(e.company),
        coverage_version: sql(`(select coverage_version from companies where id = ${lit(ids.company(e.company.n))})`),
        matched_at: created,
      });
    }
  }
  section("consumer requests: groups, leads, validation, attribution, consent and eligibility",
    insert("lead_groups", groupRows),
    insert("leads", leadRows),
    insert("lead_validation_results", validationRows),
    insert("attribution_touches", touchRows),
    ...consentStatements,
    insert("lead_eligibility", eligibilityRows),
  );

  // ---------------------------------------------------------------- purchases
  const live = matched.filter((m) => m.request.liveBuyer !== undefined);
  const liveStatements = live.map((m) => `do $$
declare a purchase_attempts; p purchases;
begin
  a := reserve_purchase(${lit(ids.company(m.request.liveBuyer!))}::uuid, ${lit(ids.group(m.request.i))}::uuid, ${lit(`demo-seed-request-${m.request.i}`)});
  p := complete_purchase(a.id, 'demo_seed');
  if p.id is null then raise exception 'demo seed: purchase of request ${m.request.i} was not completed'; end if;
end $$;\n`);
  if (liveStatements.length > 1) throw new Error("Only one live purchase can use the payment reference demo_seed");

  // Older purchases are inserted with their original timestamps. They record exactly what
  // complete_purchase records (a succeeded attempt, the purchase, its purchase_charge ledger entry
  // and the disclosure), but in the past, which the functions cannot do.
  const history = matched.filter((m) => m.request.history);
  const priceRow = (n: number) => sql(`(select id from company_prices where company_id = ${lit(ids.company(n))})`);
  const historicalCharge = (m: Matched) => {
    const c = companySpec(m.request.history!.buyer);
    return m.request.limit === 1 ? c.prices!.exclusive : c.prices!.shared; // first buyer: shared factor 10000
  };
  section("purchases: one live purchase through reserve_purchase and complete_purchase, then history",
    ...liveStatements,
    insert("purchase_attempts", history.map((m) => {
      const r = m.request;
      const charge = historicalCharge(m);
      return {
        id: ids.attempt(r.i), group_id: ids.group(r.i), company_id: ids.company(r.history!.buyer),
        idempotency_key: `demo-seed-request-${r.i}`, status: "succeeded", lead_type: r.limit === 1 ? "exclusive" : "shared",
        position: 1, price_row_id: priceRow(r.history!.buyer), list_price_cents: charge, charge_cents: charge,
        credit_applied_cents: 0, card_amount_cents: charge, payment_ref: `demo_seed_history_${r.i}`,
        expires_at: at(purchaseTime(r) + 2), created_at: at(purchaseTime(r)),
      };
    })),
    insert("purchases", history.map((m) => {
      const r = m.request;
      const charge = historicalCharge(m);
      return {
        id: ids.purchase(r.i), group_id: ids.group(r.i), company_id: ids.company(r.history!.buyer), attempt_id: ids.attempt(r.i),
        lead_type: r.limit === 1 ? "exclusive" : "shared", position: 1, price_row_id: priceRow(r.history!.buyer),
        list_price_cents: charge, charged_cents: charge, policy_version: POLICY, refunded_at: null, created_at: at(purchaseTime(r)),
      };
    })),
    insert("ledger_entries", history.map((m) => ({
      company_id: ids.company(m.request.history!.buyer), kind: "purchase_charge", amount_cents: historicalCharge(m),
      purchase_id: ids.purchase(m.request.i), source_purchase_id: null, note: null,
      dedupe_key: `charge:${ids.purchase(m.request.i)}`, created_at: at(purchaseTime(m.request)),
    }))),
    insert("disclosures", history.map((m) => ({ purchase_id: ids.purchase(m.request.i), disclosed_at: at(purchaseTime(m.request)) }))),
  );

  // ---------------------------------------------------------------- CRM (forced RLS: set the company first)
  const [r1, , , , h1, h2] = REQUESTS as [RequestSpec, RequestSpec, RequestSpec, RequestSpec, RequestSpec, RequestSpec];
  const livePurchase = (r: RequestSpec) =>
    sql(`(select id from purchases where group_id = ${lit(ids.group(r.i))} and company_id = ${lit(ids.company(r.liveBuyer!))})`);
  section("CRM for the demo mover's company (crm_records, crm_notes and crm_activities use forced RLS)",
    `select set_config('app.company_id', ${lit(ids.company(owner.n))}, true);\n`,
    insert("crm_records", [
      {
        id: ids.crmRecord(r1.i), purchase_id: livePurchase(r1), company_id: ids.company(owner.n), stage: "contacted",
        assignee_user_id: MOVER_OWNER, estimated_value_cents: 185000, follow_up_at: at(DAY), lost_reason: null,
        created_at: sql("now()"), updated_at: sql("now()"),
      },
      {
        id: ids.crmRecord(h1.i), purchase_id: ids.purchase(h1.i), company_id: ids.company(owner.n), stage: "completed",
        assignee_user_id: MOVER_OWNER, estimated_value_cents: 210000, follow_up_at: null, lost_reason: null,
        created_at: at(purchaseTime(h1)), updated_at: at(-44 * DAY),
      },
      {
        id: ids.crmRecord(h2.i), purchase_id: ids.purchase(h2.i), company_id: ids.company(owner.n), stage: "quote_sent",
        assignee_user_id: MOVER_OWNER, estimated_value_cents: 640000, follow_up_at: at(2 * DAY), lost_reason: null,
        created_at: at(purchaseTime(h2)), updated_at: at(-11 * DAY),
      },
    ]),
    insert("crm_notes", [
      {
        purchase_id: livePurchase(r1), company_id: ids.company(owner.n),
        body: "Demo note: called and left a voicemail; emailed a link to book a video survey.", created_at: sql("now()"),
      },
      {
        purchase_id: ids.purchase(h2.i), company_id: ids.company(owner.n),
        body: "Demo note: sent a written estimate after the video survey; the customer is comparing quotes.", created_at: at(-11 * DAY),
      },
    ]),
    insert("crm_activities", [
      { record_id: ids.crmRecord(r1.i), company_id: ids.company(owner.n), type: "stage_change", body: "Stage changed from new to contacted.", actor_user_id: MOVER_OWNER, created_at: sql("now()") },
      { record_id: ids.crmRecord(r1.i), company_id: ids.company(owner.n), type: "call", body: "Outbound call; left a voicemail.", actor_user_id: MOVER_OWNER, created_at: sql("now()") },
      { record_id: ids.crmRecord(h1.i), company_id: ids.company(owner.n), type: "stage_change", body: "Stage changed from booked to completed.", actor_user_id: MOVER_OWNER, created_at: at(-44 * DAY) },
      { record_id: ids.crmRecord(h2.i), company_id: ids.company(owner.n), type: "stage_change", body: "Stage changed from qualified to quote_sent.", actor_user_id: MOVER_OWNER, created_at: at(-11 * DAY) },
    ]),
    "select set_config('app.company_id', '', true);\n",
    insert("contact_access_log", [
      { purchase_id: livePurchase(r1), company_id: ids.company(owner.n), user_id: MOVER_OWNER, action: "view", ip: "203.0.113.20", created_at: sql("now()") },
      { purchase_id: ids.purchase(h1.i), company_id: ids.company(owner.n), user_id: MOVER_OWNER, action: "view", ip: "203.0.113.20", created_at: at(purchaseTime(h1) + 5) },
      { purchase_id: ids.purchase(h2.i), company_id: ids.company(owner.n), user_id: MOVER_OWNER, action: "view", ip: "203.0.113.20", created_at: at(purchaseTime(h2) + 10) },
    ]),
  );

  // ---------------------------------------------------------------- reviews
  const quoteSent1 = purchaseTime(h1) + 7 * DAY;
  const moveSent1 = (h1.moveDateDays + 21) * DAY;
  const quoteSent2 = purchaseTime(h2) + 7 * DAY;
  const invitation = (n: number, r: RequestSpec, type: string, sent: number, opened: number, completed: number): Row => ({
    id: ids.invitation(n), purchase_id: ids.purchase(r.i), company_id: ids.company(owner.n), review_type: type,
    requested_by: "system", requested_by_user: null, token_hash: sha256(newToken()), send_after: at(sent), sent_at: at(sent),
    opened_at: at(opened), completed_at: at(completed), expires_at: at(sent + 30 * DAY), created_at: at(type === "quote_experience" ? purchaseTime(r) : sent),
  });
  const review = (n: number, r: RequestSpec, type: string, rating: number, title: string, body: string, evidence: string,
    status: "published" | "pending", created: number, published: number | null, reviewer: string): Row => ({
    id: ids.review(n), company_id: ids.company(owner.n), purchase_id: ids.purchase(r.i), invitation_id: ids.invitation(n),
    review_type: type, rating, title, body, reviewer_display_name: reviewer, origin_state: r.origin.state, dest_state: r.dest.state,
    evidence_level: evidence, status, incentive_disclosure: null, rejection_reason: null,
    published_at: published === null ? null : at(published), created_at: at(created), updated_at: at(published ?? created),
  });
  section("reviews: two published on the demo mover's company and one pending",
    insert("review_invitations", [
      invitation(1, h1, "quote_experience", quoteSent1, quoteSent1 + DAY, quoteSent1 + 2 * DAY),
      invitation(2, h1, "move_experience", moveSent1, moveSent1 + HOUR, moveSent1 + 2 * DAY),
      invitation(3, h2, "quote_experience", quoteSent2, -3 * DAY, -2 * DAY),
    ]),
    insert("reviews", [
      review(1, h1, "quote_experience", 5, "Clear written estimate",
        "Demo review: the estimator walked through every room on a video call and sent a written estimate the same day. Questions were answered quickly. (Fictional review for the preview.)",
        "platform_inquiry", "published", quoteSent1 + 2 * DAY, quoteSent1 + 3 * DAY, "Sam T."),
      review(2, h1, "move_experience", 4, "On time, one scuffed dresser",
        "Demo review: the crew arrived on time and finished in about seven hours. One dresser was scuffed, and the claims process was explained clearly. (Fictional review for the preview.)",
        "completed_move", "published", moveSent1 + 2 * DAY, moveSent1 + 4 * DAY, "Sam T."),
      review(3, h2, "quote_experience", 3, "Quote took a few days",
        "Demo review: friendly team, but the in-home survey took four days to schedule. (Fictional review for the preview, waiting for moderation.)",
        "platform_inquiry", "pending", -2 * DAY, null, "Chris E."),
    ]),
    insert("review_evidence", [
      { id: ids.evidence(1), review_id: ids.review(2), kind: "order_for_service", file_ref: "demo://review-evidence/order-for-service-request-5.pdf", checked_by: ADMIN, checked_at: at(moveSent1 + 3 * DAY), result: "accepted", note: "Demo fixture: order for service names this company and the request route.", created_at: at(moveSent1 + 2 * DAY) },
      { id: ids.evidence(2), review_id: ids.review(2), kind: "bill_of_lading", file_ref: "demo://review-evidence/bill-of-lading-request-5.pdf", checked_by: ADMIN, checked_at: at(moveSent1 + 3 * DAY), result: "accepted", note: "Demo fixture: bill of lading shows the move was completed.", created_at: at(moveSent1 + 2 * DAY) },
    ]),
    insert("moderation_actions", [
      { target_type: "review", target_id: ids.review(1), action: "publish", reason: "Meets the review guidelines; platform inquiry verified.", moderator_id: ADMIN, created_at: at(quoteSent1 + 3 * DAY) },
      { target_type: "review", target_id: ids.review(2), action: "publish", reason: "Meets the review guidelines; completed-move evidence accepted.", moderator_id: ADMIN, created_at: at(moveSent1 + 4 * DAY) },
    ]),
  );

  // ---------------------------------------------------------------- case and outbox
  const r2 = REQUESTS[1]!;
  section("an open case and demo outbox messages",
    insert("cases", [{
      id: ids.caseFile(1), case_type: "unlisted_contact", company_id: null, lead_id: ids.lead(r1.i), review_id: null,
      reporter_name: `${r1.person.first} ${r1.person.last}`, reporter_email: emailOf(r1), reporter_phone: r1.person.phone,
      description: "Demo case: I got a call about my move from a company that was not on the list I approved. (Fictional report for the preview.)",
      status: "open", assignee: ADMIN, sla_due_at: at(46 * HOUR), outcome: null, resolved_at: null,
      created_at: at(-2 * HOUR), updated_at: at(-2 * HOUR),
    }]),
    insert("messages", [
      {
        id: ids.message(1), channel: "email", to_address: opts.moverEmail, template: "lead_available",
        subject: `New request available: ${r2.origin.city}, ${r2.origin.state} to ${r2.dest.city}, ${r2.dest.state}`,
        body_text: `A new exclusive request matches your coverage: ${r2.origin.city}, ${r2.origin.state} to ${r2.dest.city}, ${r2.dest.state}, ${SIZE_LABEL[r2.moveSize].toLowerCase()}. Open the marketplace to see the details and your price. (Demo message: nothing was sent.)`,
        related_type: "lead_group", related_id: ids.group(r2.i), status: "demo", provider: "demo", provider_ref: null, error: null,
        attempts: 1, created_at: at(-r2.createdAgo + 1), sent_at: null,
      },
      {
        id: ids.message(2), channel: "email", to_address: emailOf(r1), template: "purchase_notice",
        subject: "An update on your moving request",
        body_text: `A participating moving company received your request ${referenceCode(r1)} and may contact you about your move. Each company identifies itself when it contacts you. Participating movers pay American Moving Choice to receive requests.\nUse your manage-request link to stop new movers from receiving it. (Demo message: nothing was sent.)`,
        related_type: "purchase", related_id: livePurchase(r1), status: "demo", provider: "demo", provider_ref: null, error: null,
        attempts: 1, created_at: sql("now()"), sent_at: null,
      },
      {
        id: ids.message(3), channel: "email", to_address: emailOf(h2), template: "review_invitation",
        subject: `How was your quote from ${owner.name}?`,
        body_text: `Tell other people planning a move how ${owner.name} handled your quote. Your review link works once. (Demo message: nothing was sent.)`,
        related_type: "review_invitation", related_id: ids.invitation(3), status: "demo", provider: "demo", provider_ref: null,
        error: null, attempts: 1, created_at: at(quoteSent2), sent_at: null,
      },
      {
        id: ids.message(4), channel: "email", to_address: opts.adminEmail, template: "case_opened",
        subject: "New case: contact from an unlisted company",
        body_text: "A consumer reported contact from a company that was not on their list. Open the case queue to triage it. (Demo message: nothing was sent.)",
        related_type: "case", related_id: ids.caseFile(1), status: "demo", provider: "demo", provider_ref: null, error: null,
        attempts: 1, created_at: at(-2 * HOUR), sent_at: null,
      },
    ]),
  );

  // ---------------------------------------------------------------- audit log
  section("audit log (append-only)",
    insert("audit_log", [
      ...approved.map((c) => ({
        actor_type: "admin", actor_id: ADMIN, company_id: ids.company(c.n), action: "company.approve", entity: "company",
        entity_id: ids.company(c.n), before: jsonb({ status: "in_review" }), after: jsonb({ status: "approved" }), ip: null,
        created_at: at(-c.daysAgo * DAY),
      })),
      ...rejected.map((c) => ({
        actor_type: "admin", actor_id: ADMIN, company_id: ids.company(c.n), action: "company.reject", entity: "company",
        entity_id: ids.company(c.n), before: jsonb({ status: "in_review" }), after: jsonb({ status: "rejected", reason: rejectedReason }),
        ip: null, created_at: at(-lastStatusDaysAgo(c) * DAY),
      })),
      ...[1, 2].map((n) => ({
        actor_type: "admin", actor_id: ADMIN, company_id: ids.company(owner.n), action: "review.publish", entity: "review",
        entity_id: ids.review(n), before: jsonb({ status: "pending" }), after: jsonb({ status: "published" }), ip: null,
        created_at: at(n === 1 ? quoteSent1 + 3 * DAY : moveSent1 + 4 * DAY),
      })),
      {
        actor_type: "system", actor_id: "seed", company_id: null, action: "seed.demo_loaded", entity: "database", entity_id: null,
        before: null, after: jsonb({ demo_companies: COMPANIES.length, requests: REQUESTS.length }), ip: null, created_at: sql("now()"),
      },
    ]),
  );

  section("sanity checks",
    `do $$ begin
  if (select count(*) from companies where is_demo and status = 'approved') < 12 then raise exception 'seed check: fewer than 12 approved demo companies'; end if;
  if (select count(*) from consent_records) <> ${REQUESTS.length} then raise exception 'seed check: a consent record is missing (is contact-request-intake-v1 seeded?)'; end if;
  if not exists (select 1 from purchase_attempts where payment_ref = 'demo_seed' and status = 'succeeded') then raise exception 'seed check: live demo purchase missing'; end if;
  if not exists (select 1 from lead_groups g where g.sharing_limit = 1 and g.status = 'available' and g.expires_at > now()
                 and not exists (select 1 from purchases p where p.group_id = g.id)) then raise exception 'seed check: no open exclusive request'; end if;
end $$;\n`);

  const body = parts.join("\n");
  const header = [
    "-- American Moving Choice demo seed: fictional preview data. Generated by db/seed/build.ts. Do not edit.",
    "-- Holds bcrypt hashes of the demo passwords: never commit this file.",
    "-- Assumes a freshly migrated database and runs in one transaction.",
    "",
  ].join("\n");
  const counts: Record<string, number> = {
    users: 2,
    companies: COMPANIES.length,
    approved_companies: approved.length,
    coverage_rules: ruleRows.length,
    coverage_rule_locations: locationRows.length,
    verification_checks: checkRows.length,
    credentials: credentialRows.length,
    badges: badgeRows.length,
    rate_cards: COMPANIES.filter((c) => c.rateCard).length,
    lead_groups: groupRows.length,
    lead_eligibility: eligibilityRows.length,
    purchases: live.length + history.length,
    reviews: 3,
  };
  const meta: SeedMeta = {
    builderSha256: builderSha256(),
    builtAt: new Date().toISOString(),
    adminTotpEnrolled: Boolean(opts.adminTotpSecret),
    hmacSecretIsDevDefault: hmacSecret === DEV_HMAC_SECRET,
    webUrl: opts.webUrl!,
  };
  return { sql: `${header}begin;\nset local standard_conforming_strings = on;\n\n${body}\ncommit;\n`, meta, body, tokens, counts };
}

// ================================================================== CLI

export function seedOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): SeedOptions {
  const names = ["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD", "SEED_MOVER_EMAIL", "SEED_MOVER_PASSWORD"] as const;
  const missing = names.filter((n) => !env[n]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}. Set all four to build the demo seed.`);
  }
  const optional = (name: string): string | undefined => env[name]?.trim() || undefined;
  return {
    adminEmail: env.SEED_ADMIN_EMAIL!, adminPassword: env.SEED_ADMIN_PASSWORD!,
    moverEmail: env.SEED_MOVER_EMAIL!, moverPassword: env.SEED_MOVER_PASSWORD!,
    adminTotpSecret: optional("SEED_ADMIN_TOTP_SECRET"), encryptionKey: optional("APP_ENCRYPTION_KEY"),
    hmacSecret: optional("HMAC_SECRET"), webUrl: optional("WEB_URL"),
  };
}

const outFile = fileURLToPath(new URL("./out/demo-seed.sql", import.meta.url));
const tokensFile = fileURLToPath(new URL("./out/demo-tokens.json", import.meta.url));
export const seedMetaFile = fileURLToPath(new URL("./out/demo-seed.meta.json", import.meta.url));

async function main(): Promise<void> {
  const options = seedOptionsFromEnv();
  const out = await buildSeedSql(options);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, out.sql, { mode: 0o600 });
  writeFileSync(tokensFile, `${JSON.stringify(out.tokens, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(seedMetaFile, `${JSON.stringify(out.meta, null, 2)}\n`, { mode: 0o600 });
  console.log(`Wrote ${outFile}`);
  console.log(`Wrote ${tokensFile} (manage-request tokens for the open demo requests)`);
  console.log(
    `Logins: admin ${normalizeEmail(options.adminEmail)} (super_admin, ${out.meta.adminTotpEnrolled ? "TOTP enrolled from SEED_ADMIN_TOTP_SECRET" : "TOTP enrolls at first sign-in: local use only"}); mover owner ${normalizeEmail(options.moverEmail)}`,
  );
  if (out.meta.hmacSecretIsDevDefault) console.log("HMAC_SECRET not set: contact hashes use the public development secret (local use only)");
  console.log(Object.entries(out.counts).map(([k, v]) => `${k}=${v}`).join(" "));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

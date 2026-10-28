/**
 * FMCSA fixture adapter (build plan §9): the default when FMCSA_WEBKEY is not set. Fictional USDOT
 * numbers 9000001–9000099 return recorded records; any other number returns "unavailable", which
 * the checks record as needing manual review.
 *
 * Fixture map (every company is fictional; MC numbers are "MC-" plus the USDOT number):
 *
 * | USDOT             | Record                                                                                  |
 * |-------------------|-----------------------------------------------------------------------------------------|
 * | 9000001–9000015   | The 15 approved demo companies in db/seed/build.ts, with the seed's names, addresses and |
 * |                   | phone numbers: active USDOT, active household-goods common carrier authority, no broker |
 * |                   | authority, BI&PD and cargo insurance on file, no recent changes.                         |
 * | 9000016           | Demo Prairie Wind Movers (seed: in review). The record carries a different name ("Demo  |
 * |                   | Prairie Wind Moving & Storage") and a mailing-address change in the last 90 days.        |
 * | 9000017           | Demo Dual Authority Moving Group (seed: rejected). Dual registration: carrier and broker |
 * |                   | authority on the same docket.                                                            |
 * | 9000090           | Broker only: household-goods broker authority, surety bond, no carrier authority.       |
 * | 9000091           | Dual registration on separate dockets (Motus style): carrier docket MC-9000091 and      |
 * |                   | broker docket MC-9100091.                                                                |
 * | 9000095           | USDOT out of service.                                                                   |
 * | 9000096           | USDOT inactive (missed biennial update).                                                |
 * | 9000097           | Carrier authority revoked.                                                              |
 * | 9000098           | Cargo insurance not on file.                                                            |
 * | 9000099           | Carrier authority application pending.                                                  |
 * | every other number in range | A clean generic carrier named "Demo Fixture Carrier <USDOT>" at 100 Demo    |
 * |                   | Fixture Road, Austin, TX 78701. Apply with that legal name for a clean identity match;   |
 * |                   | any other name is flagged for the reviewer, as with a real mismatch.                     |
 */
import type { AuthorityGrant, CarrierAddress, FmcsaAdapter, FmcsaCarrierRecord, FmcsaLookup } from "./types";

export const FIXTURE_USDOT_MIN = 9_000_001;
export const FIXTURE_USDOT_MAX = 9_000_099;

interface SeedCompany {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  areaCode: string;
}

/** Mirrors COMPANIES in db/seed/build.ts (n = USDOT - 9000000). Keep the two in step. */
const SEED_COMPANIES: Record<number, SeedCompany> = {
  1: { name: "Demo Lone Star Relocation Co.", street: "1201 Demo Parkway", city: "Austin", state: "TX", zip: "78704", areaCode: "512" },
  2: { name: "Demo Bluebonnet Hill Movers", street: "4400 Demo Bayou Street", city: "Houston", state: "TX", zip: "77007", areaCode: "713" },
  3: { name: "Demo Pecan Grove Moving Co.", street: "310 Demo Mission Road", city: "San Antonio", state: "TX", zip: "78205", areaCode: "210" },
  4: { name: "Demo Mesquite Trail Movers", street: "975 Demo Stockyard Lane", city: "Fort Worth", state: "TX", zip: "76102", areaCode: "817" },
  5: { name: "Demo Trinity River Moving Co.", street: "2600 Demo Commerce Street", city: "Dallas", state: "TX", zip: "75207", areaCode: "214" },
  6: { name: "Demo Sunshine Parkway Movers", street: "500 Demo Citrus Avenue", city: "Orlando", state: "FL", zip: "32801", areaCode: "407" },
  7: { name: "Demo Palmetto Grove Relocation", street: "1450 Demo Bayfront Way", city: "Miami", state: "FL", zip: "33130", areaCode: "305" },
  8: { name: "Demo Coral Key Moving Co.", street: "220 Demo Channel Street", city: "Tampa", state: "FL", zip: "33602", areaCode: "813" },
  9: { name: "Demo Manatee Bay Movers", street: "640 Demo Riverwalk Drive", city: "Fort Lauderdale", state: "FL", zip: "33301", areaCode: "954" },
  10: { name: "Demo First Light Moving Co.", street: "75 Demo Riverside Avenue", city: "Jacksonville", state: "FL", zip: "32202", areaCode: "904" },
  11: { name: "Demo Golden Poppy Movers", street: "300 Demo Sunset Way", city: "Los Angeles", state: "CA", zip: "90012", areaCode: "213" },
  12: { name: "Demo Orange Blossom Relocation", street: "18 Demo Grove Court", city: "Irvine", state: "CA", zip: "92618", areaCode: "949" },
  13: { name: "Demo Pacific Tide Moving Co.", street: "410 Demo Pier Way", city: "Long Beach", state: "CA", zip: "90802", areaCode: "562" },
  14: { name: "Demo Sierra Vista Movers", street: "77 Demo Colorado Court", city: "Pasadena", state: "CA", zip: "91101", areaCode: "626" },
  15: { name: "Demo Harbor Lantern Moving Co.", street: "905 Demo Lantern Lane", city: "Santa Ana", state: "CA", zip: "92701", areaCode: "714" },
  16: { name: "Demo Prairie Wind Movers", street: "1600 Demo Plains Avenue", city: "Lubbock", state: "TX", zip: "79401", areaCode: "806" },
  17: { name: "Demo Dual Authority Moving Group", street: "700 Demo Exchange Street", city: "Houston", state: "TX", zip: "77002", areaCode: "832" },
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const mcOf = (usdot: number) => `MC-${usdot}`;

function cleanCarrier(usdot: number, name: string, address: CarrierAddress, phone: string): FmcsaCarrierRecord {
  return {
    usdot: String(usdot),
    legalName: name,
    dbaName: null,
    usdotStatus: "active",
    outOfService: false,
    physicalAddress: address,
    phone,
    authorities: [{ docket: mcOf(usdot), type: "common", scope: "household_goods", status: "active", effectiveFrom: "2023-03-01" }],
    insurance: { bipdOnFile: true, cargoOnFile: true, bondOnFile: false },
    recentChanges: [],
  };
}

/** The fixture record for a USDOT number in the fixture range, or null outside it. */
export function fixtureRecord(usdotText: string): FmcsaCarrierRecord | null {
  if (!/^\d+$/.test(usdotText)) return null;
  const usdot = Number(usdotText);
  if (usdot < FIXTURE_USDOT_MIN || usdot > FIXTURE_USDOT_MAX) return null;
  const n = usdot - 9_000_000;

  const seed = SEED_COMPANIES[n];
  if (seed) {
    const record = cleanCarrier(
      usdot,
      seed.name,
      { line1: seed.street, city: seed.city, state: seed.state, zip: seed.zip },
      `+1${seed.areaCode}55501${pad2(n)}`,
    );
    if (n === 16) return { ...record, legalName: "Demo Prairie Wind Moving & Storage", recentChanges: ["mailing_address"] };
    if (n === 17) {
      const broker: AuthorityGrant = { docket: mcOf(usdot), type: "broker", scope: "property", status: "active", effectiveFrom: "2024-06-01" };
      return { ...record, authorities: [...record.authorities, broker], insurance: { ...record.insurance, bondOnFile: true } };
    }
    return record;
  }

  const generic = cleanCarrier(
    usdot,
    `Demo Fixture Carrier ${usdot}`,
    { line1: "100 Demo Fixture Road", city: "Austin", state: "TX", zip: "78701" },
    `+173755501${pad2(n)}`, // 555-01xx numbers are reserved for fiction
  );
  switch (n) {
    case 90:
      return {
        ...generic,
        legalName: `Demo Broker Only ${usdot}`,
        authorities: [{ docket: mcOf(usdot), type: "broker", scope: "household_goods", status: "active", effectiveFrom: "2022-01-10" }],
        insurance: { bipdOnFile: false, cargoOnFile: false, bondOnFile: true },
      };
    case 91:
      return {
        ...generic,
        legalName: `Demo Dual Docket Movers ${usdot}`,
        authorities: [
          ...generic.authorities,
          { docket: `MC-${9_100_000 + n}`, type: "broker", scope: "household_goods", status: "active", effectiveFrom: "2026-05-20" },
        ],
        insurance: { ...generic.insurance, bondOnFile: true },
      };
    case 95:
      return { ...generic, outOfService: true };
    case 96:
      return { ...generic, usdotStatus: "inactive" };
    case 97:
      return { ...generic, authorities: generic.authorities.map((a) => ({ ...a, status: "revoked" })) };
    case 98:
      return { ...generic, insurance: { ...generic.insurance, cargoOnFile: false } };
    case 99:
      return { ...generic, authorities: generic.authorities.map((a) => ({ ...a, status: "pending" })) };
    default:
      return generic;
  }
}

export const fixtureSourceUrl = (usdot: string) => `fixture://fmcsa/carriers/${usdot}`;

/** Recorded records for the fixture range; "unavailable" (manual review) for anything else. */
export const fixtureAdapter: FmcsaAdapter = {
  source: "fixture",
  async lookupCarrier(usdot: string): Promise<FmcsaLookup> {
    const retrievedAt = new Date();
    const record = fixtureRecord(usdot);
    if (!record) {
      return {
        status: "unavailable",
        reason: `Demo data covers USDOT ${FIXTURE_USDOT_MIN}–${FIXTURE_USDOT_MAX} only. Check this number on the FMCSA record by hand.`,
        source: "fixture",
        sourceUrl: null,
        retrievedAt,
        raw: { fixture: true, usdot, covered: false },
      };
    }
    return { status: "found", record, source: "fixture", sourceUrl: fixtureSourceUrl(usdot), retrievedAt, raw: { fixture: true, record } };
  },
};

/**
 * Builds packages/server/data/seo-geo/{places,counties,zctas}.json: Census facts (ACS 5-year
 * population and housing units, Gazetteer land area, county time zones) for the programmatic
 * SEO pages, from the MIT-licensed distribution CSVs of bdurand/us_geo downloaded into a scratch
 * directory (never executed, only parsed). See data/seo-geo/ATTRIBUTION.md.
 *
 * Usage: pnpm --filter @amc/server build:seo-facts -- <source-dir>
 *   <source-dir> must hold counties.csv, places.csv, zctas.csv (data/2020_dist of bdurand/us_geo).
 *
 * Output:
 *   places.json    [[stateCode, citySlug, placeGeoid, population, housingUnits, landAreaSqMi, fipsClass, countyGeoid], ...]
 *                  one row per city of cities.json matched to a Census place (same state, same
 *                  short name, nearest coordinates within 30 miles; one place per city)
 *   counties.json  [[fips, name, stateCode, population, housingUnits, landAreaSqMi, timeZone, cbsaGeoid|null, central, lat, lng], ...]
 *   zctas.json     { zip: [population, housingUnits, landAreaSqMi, primaryPlaceGeoid|null] } for ZIPs in ../zip5.json
 *   facts-sources.json  the SHA-256 and row count of each source file, copied into ATTRIBUTION.md
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STATES } from "../src/geo/states";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const outDir = join(dataDir, "seo-geo");

type CityTuple = [state: string, slug: string, name: string, county: string, countyFips: string | null, lat: number, lng: number, population: number | null, zips: string[]];
type ZipTuple = [city: string, state: string, countyFips: string, lat: number, lng: number];
export type PlaceTuple = [state: string, slug: string, geoid: string, population: number | null, housingUnits: number | null, landAreaSqMi: number | null, fipsClass: string, countyGeoid: string];
export type CountyTuple = [fips: string, name: string, state: string, population: number | null, housingUnits: number | null, landAreaSqMi: number | null, timeZone: string | null, cbsa: string | null, central: boolean, lat: number, lng: number];
export type ZctaTuple = [population: number | null, housingUnits: number | null, landAreaSqMi: number | null, primaryPlace: string | null];

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  const header = (rows.shift() ?? []).map((h) => h.trim().replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const int = (s: string): number | null => (s === "" || !Number.isFinite(Number(s)) ? null : Math.round(Number(s)));
const num = (s: string): number | null => (s === "" || !Number.isFinite(Number(s)) ? null : Number(s));
const round3 = (n: number | null) => (n === null ? null : Math.round(n * 1000) / 1000);

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function build(sourceDir: string): void {
  const stateCodes = new Set<string>(STATES.map((s) => s.code));
  const read = (name: string) => {
    const text = readFileSync(join(sourceDir, name), "utf8");
    return { rows: parseCsv(text), sha256: createHash("sha256").update(text).digest("hex") };
  };
  const counties = read("counties.csv");
  const places = read("places.csv");
  const zctas = read("zctas.csv");
  const cities = JSON.parse(readFileSync(join(outDir, "cities.json"), "utf8")) as CityTuple[];
  const zip5 = JSON.parse(readFileSync(join(dataDir, "zip5.json"), "utf8")) as Record<string, ZipTuple>;

  // Counties (50 states and DC only)
  const countyRows: CountyTuple[] = [];
  for (const r of counties.rows) {
    if (!stateCodes.has(r.State ?? "")) continue;
    countyRows.push([r.GEOID!, r.Name!, r.State!, int(r.Population ?? ""), int(r["Housing Units"] ?? ""), round3(num(r["Land Area"] ?? "")), r["Time Zone"] || null, r.CBSA || null, r.Central === "T", Number(r.Latitude), Number(r.Longitude)]);
  }
  countyRows.sort((a, b) => a[0].localeCompare(b[0]));

  // Places matched to cities: same state, same short name, nearest centroid within 30 miles.
  const byKey = new Map<string, CityTuple[]>();
  for (const c of cities) {
    const key = `${c[0]}|${norm(c[2])}`;
    byKey.set(key, [...(byKey.get(key) ?? []), c]);
  }
  const candidates = new Map<string, { place: Record<string, string>; miles: number }[]>(); // state|slug -> matches
  for (const p of places.rows) {
    if (!stateCodes.has(p.State ?? "")) continue;
    const matches = byKey.get(`${p.State}|${norm(p["Short Name"] ?? "")}`) ?? [];
    for (const c of matches) {
      const miles = haversineMiles(c[5], c[6], Number(p.Latitude), Number(p.Longitude));
      if (miles > 30) continue;
      const key = `${c[0]}|${c[1]}`;
      candidates.set(key, [...(candidates.get(key) ?? []), { place: p, miles }]);
    }
  }
  const usedPlaces = new Set<string>();
  const placeRows: PlaceTuple[] = [];
  // Incorporated places (FIPS class C*) win over CDPs (U*) at similar distance; then nearest, then larger.
  const score = (m: { place: Record<string, string>; miles: number }) => (m.place["FIPS Class"]!.startsWith("C") ? 0 : 10) + m.miles - Math.min(5, (int(m.place.Population ?? "") ?? 0) / 100_000);
  const ordered = [...candidates.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let unmatched = 0;
  for (const [key, list] of ordered) {
    const [state, slug] = key.split("|") as [string, string];
    const best = list.filter((m) => !usedPlaces.has(m.place.GEOID!)).sort((a, b) => score(a) - score(b))[0];
    if (!best) {
      unmatched++;
      continue;
    }
    usedPlaces.add(best.place.GEOID!);
    const p = best.place;
    placeRows.push([state, slug, p.GEOID!, int(p.Population ?? ""), int(p["Housing Units"] ?? ""), round3(num(p["Land Area"] ?? "")), p["FIPS Class"]!, p["County GEOID"]!]);
  }

  // ZCTAs for the ZIPs the site knows.
  const zctaOut: Record<string, ZctaTuple> = {};
  for (const z of zctas.rows) {
    const zip = z.ZCTA5!;
    if (!zip5[zip]) continue;
    zctaOut[zip] = [int(z.Population ?? ""), int(z["Housing Units"] ?? ""), round3(num(z["Land Area"] ?? "")), z["Primary Place"] || null];
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "places.json"), JSON.stringify(placeRows) + "\n");
  writeFileSync(join(outDir, "counties.json"), JSON.stringify(countyRows) + "\n");
  writeFileSync(join(outDir, "zctas.json"), JSON.stringify(zctaOut) + "\n");
  const sources = {
    builtOn: new Date().toISOString().slice(0, 10),
    files: {
      "counties.csv": { sha256: counties.sha256, rows: counties.rows.length },
      "places.csv": { sha256: places.sha256, rows: places.rows.length },
      "zctas.csv": { sha256: zctas.sha256, rows: zctas.rows.length },
    },
    output: { places: placeRows.length, counties: countyRows.length, zctas: Object.keys(zctaOut).length, citiesWithoutPlace: cities.length - placeRows.length, placesMatchedButTaken: unmatched },
  };
  writeFileSync(join(outDir, "facts-sources.json"), JSON.stringify(sources, null, 2) + "\n");
  console.log(JSON.stringify(sources, null, 2));
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("usage: build-seo-facts.ts <source-dir>");
  process.exit(1);
}
build(sourceDir);

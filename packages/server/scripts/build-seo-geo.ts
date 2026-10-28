/**
 * Builds packages/server/data/seo-geo/{states,cities}.json for the programmatic SEO pages from
 * public datasets downloaded into a scratch directory (never executed, only parsed), plus the
 * GeoNames ZIP dataset already in packages/server/data/zip5.json.
 *
 * Usage: pnpm --filter @amc/server build:seo-geo -- <source-dir>
 *   <source-dir> must hold: us_cities.csv (kelvins/US-Cities-Database, MIT),
 *   us-cities-top-1k.csv (plotly/datasets, MIT), USCities.json (millbj92/US-Zip-Codes-JSON, MIT).
 *   states.json (dr5hn/countries-states-cities-database, ODbL) is NOT used: the state list lives
 *   in src/geo/states.ts and centroids are computed from GeoNames ZIP centroids, so no ODbL
 *   share-alike obligation attaches to the committed dataset.
 *
 * Output (see data/seo-geo/ATTRIBUTION.md):
 *   states.json  [{ code, slug, name, lat, lng, zipCount, countyCount }]
 *   cities.json  [[stateCode, slug, name, county, countyFips|null, lat, lng, population|null, zips[]], ...]
 *   County and coordinates come from the GeoNames ZIPs attached to the place (majority county,
 *   mean centroid) because the city CSV's county and coordinates are wrong for some places
 *   (its Orlando row sits in Brevard County on the coast); the CSV values are the fallback.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STATES } from "../src/geo/states";
import { slugify } from "../src/seo/slugs";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const outDir = join(dataDir, "seo-geo");

type ZipTuple = [city: string, state: string, countyFips: string, lat: number, lng: number];
type CityTuple = [state: string, slug: string, name: string, county: string, countyFips: string | null, lat: number, lng: number, population: number | null, zips: string[]];

/** Minimal RFC 4180 CSV parser (quoted fields, commas inside quotes). */
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
  const header = rows.shift() ?? [];
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function build(sourceDir: string): void {
  const stateByName = new Map(STATES.map((s) => [s.name.toLowerCase(), s.code]));
  const stateCodes = new Set<string>(STATES.map((s) => s.code));

  const zips = JSON.parse(readFileSync(join(dataDir, "zip5.json"), "utf8")) as Record<string, ZipTuple>;
  const counties = JSON.parse(readFileSync(join(dataDir, "counties.json"), "utf8")) as Record<string, [name: string, state: string]>;
  const kelvins = parseCsv(readFileSync(join(sourceDir, "us_cities.csv"), "utf8"));
  const plotly = parseCsv(readFileSync(join(sourceDir, "us-cities-top-1k.csv"), "utf8"));
  const millbj = JSON.parse(readFileSync(join(sourceDir, "USCities.json"), "utf8")) as { zip_code: number; city: string; state: string }[];

  // Population by (state, normalized city) from the top-1000 list.
  const population = new Map<string, number>();
  for (const row of plotly) {
    const code = stateByName.get((row.State ?? "").toLowerCase());
    const pop = Number(row.Population);
    if (code && Number.isFinite(pop)) population.set(`${code}|${norm(row.City ?? "")}`, pop);
  }

  // ZIPs by (state, normalized place name): GeoNames first, millbj92 as a fallback for ZIPs whose
  // GeoNames place name differs from the city name.
  const zipsByPlace = new Map<string, Set<string>>();
  const addZip = (code: string, place: string, zip: string) => {
    const key = `${code}|${norm(place)}`;
    const set = zipsByPlace.get(key) ?? new Set();
    set.add(zip);
    zipsByPlace.set(key, set);
  };
  for (const [zip, [place, code]] of Object.entries(zips)) addZip(code, place, zip);
  for (const row of millbj) {
    const zip = String(row.zip_code).padStart(5, "0");
    if (zips[zip] && stateCodes.has(row.state)) addZip(row.state, row.city, zip);
  }

  const cities: CityTuple[] = [];
  const seen = new Map<string, number>(); // state|slug -> index
  let duplicates = 0;
  let outside = 0;
  for (const row of kelvins) {
    const code = row.STATE_CODE ?? "";
    const name = row.CITY ?? "";
    const lat = Number(row.LATITUDE);
    const lng = Number(row.LONGITUDE);
    if (!stateCodes.has(code) || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      outside++;
      continue;
    }
    let slug = slugify(name);
    if (!slug) continue;
    const key = `${code}|${slug}`;
    const existing = seen.get(key);
    if (existing !== undefined) {
      const other = cities[existing]!;
      if (norm(other[2]) === norm(name)) {
        duplicates++;
        continue; // the same place listed twice: first row wins
      }
      // Two different places share a slug: site architecture §2.2 appends the county slug.
      slug = `${slug}-${slugify(row.COUNTY ?? "")}-county`;
      if (seen.has(`${code}|${slug}`)) {
        duplicates++;
        continue;
      }
    }
    const placeZips = [...(zipsByPlace.get(`${code}|${norm(name)}`) ?? [])].sort();
    let countyName = row.COUNTY ?? "";
    let countyFips: string | null = null;
    let cLat = lat;
    let cLng = lng;
    if (placeZips.length) {
      const byCounty = new Map<string, number>();
      let sumLat = 0;
      let sumLng = 0;
      for (const zip of placeZips) {
        const [, , fips, zLat, zLng] = zips[zip]!;
        byCounty.set(fips, (byCounty.get(fips) ?? 0) + 1);
        sumLat += zLat;
        sumLng += zLng;
      }
      countyFips = [...byCounty.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0];
      countyName = counties[countyFips]?.[0] ?? countyName;
      cLat = sumLat / placeZips.length;
      cLng = sumLng / placeZips.length;
    }
    cities.push([code, slug, name, countyName, countyFips, round4(cLat), round4(cLng), population.get(`${code}|${norm(name)}`) ?? null, placeZips]);
    seen.set(`${code}|${slug}`, cities.length - 1);
  }
  cities.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));

  // State centroids and counts from the GeoNames ZIP centroids.
  const acc = new Map<string, { lat: number; lng: number; n: number; counties: Set<string> }>();
  for (const [, [, code, countyFips, lat, lng]] of Object.entries(zips)) {
    const a = acc.get(code) ?? { lat: 0, lng: 0, n: 0, counties: new Set() };
    a.lat += lat;
    a.lng += lng;
    a.n++;
    a.counties.add(countyFips);
    acc.set(code, a);
  }
  const states = STATES.map((s) => {
    const a = acc.get(s.code);
    if (!a || !a.n) throw new Error(`No ZIP centroids for ${s.code}`);
    return { code: s.code, slug: s.slug, name: s.name, lat: round4(a.lat / a.n), lng: round4(a.lng / a.n), zipCount: a.n, countyCount: a.counties.size };
  });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "states.json"), JSON.stringify(states, null, 1) + "\n");
  writeFileSync(join(outDir, "cities.json"), "[\n" + cities.map((c) => JSON.stringify(c)).join(",\n") + "\n]\n");
  const withPop = cities.filter((c) => c[7] !== null).length;
  const withZips = cities.filter((c) => c[8].length).length;
  console.log(
    `seo-geo: ${states.length} states, ${cities.length} cities (${withPop} with population, ${withZips} with ZIPs), ${Object.keys(zips).length} ZIPs; ` +
      `dropped ${duplicates} duplicate and ${outside} outside-50-states rows. Built ${new Date().toISOString().slice(0, 10)}.`,
  );
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: tsx scripts/build-seo-geo.ts <source-dir>");
  process.exit(1);
}
build(sourceDir);

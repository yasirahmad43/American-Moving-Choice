/**
 * Builds packages/server/data/zip5.json and counties.json from the GeoNames US postal code file
 * shipped in the zipcodes-us npm package (node_modules/zipcodes-us/data/US.txt), and rewrites
 * packages/server/data/README.md with the source, licence and build date (build plan §7.1).
 *
 * Usage: pnpm geo:build   (or: pnpm --filter @amc/server build:zip-data)
 *
 * GeoNames columns (tab-separated): country code, postal code, place name, admin name1 (state),
 * admin code1 (state code), admin name2 (county), admin code2 (county FIPS, 3 digits),
 * admin name3, admin code3, latitude, longitude, accuracy.
 *
 * Output:
 *   zip5.json      { "02108": ["Boston", "MA", "25025", 42.3576, -71.0684], ... }
 *                  [city, stateCode, countyFips (state FIPS + county code), lat, lng]
 *   counties.json  { "25025": ["Suffolk", "MA"], ... }   county names for countiesByState()
 *
 * Only the 50 states and DC are kept: territories, military (APO/FPO) codes and rows without a
 * county code are dropped. ZIP codes stay strings, so leading zeros survive.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STATES } from "../src/geo/states";

type ZipTuple = [city: string, state: string, countyFips: string, lat: number, lng: number];

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

/** zipcodes-us exports neither its data nor package.json, so read them from the installed folder. */
function sourceFile(): { path: string; version: string; checked: string | null } {
  const pkgDir = join(here, "..", "node_modules", "zipcodes-us");
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")) as { version: string };
  // The package README carries a line like "Data Last Checked/Updated:** _25th September 2026_".
  const readme = readFileSync(join(pkgDir, "README.md"), "utf8");
  const checked = /Data Last Checked\/Updated:\*\*\s*_([^_]+)_/.exec(readme)?.[1]?.trim() ?? null;
  return { path: join(pkgDir, "data", "US.txt"), version: pkg.version, checked };
}

const round4 = (n: number): number => Math.round(n * 10_000) / 10_000;

function build(): void {
  const { path, version, checked } = sourceFile();
  const fipsByState = new Map<string, string>(STATES.map((s) => [s.code, s.fips]));
  const zips: Record<string, ZipTuple> = {};
  const counties: Record<string, [name: string, state: string]> = {};
  const dropped = { outsideStates: 0, noCounty: 0, badRow: 0, duplicate: 0 };

  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const [country, zip, place, , stateCode, countyName, countyCode, , , latText, lngText] = cols;
    if (country !== "US" || !zip || !/^\d{5}$/.test(zip) || !place || latText === undefined || lngText === undefined) {
      dropped.badRow++;
      continue;
    }
    const stateFips = stateCode ? fipsByState.get(stateCode) : undefined;
    if (!stateCode || !stateFips) {
      dropped.outsideStates++;
      continue;
    }
    if (!countyCode || !/^\d{3}$/.test(countyCode)) {
      dropped.noCounty++;
      continue;
    }
    const lat = Number(latText);
    const lng = Number(lngText);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      dropped.badRow++;
      continue;
    }
    if (zips[zip]) {
      dropped.duplicate++;
      continue;
    }
    const countyFips = `${stateFips}${countyCode}`;
    zips[zip] = [place.trim(), stateCode, countyFips, round4(lat), round4(lng)];
    if (!counties[countyFips] && countyName) counties[countyFips] = [countyName.trim(), stateCode];
  }

  // Sorted entries are written directly: going through an object would put integer-like keys
  // ("10001") before keys with a leading zero ("02108"). One entry per line keeps diffs readable.
  const sorted = <T>(obj: Record<string, T>) => Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const lines = (entries: [string, unknown][]) =>
    `{\n${entries.map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(",\n")}\n}\n`;
  const zipEntries = sorted(zips);
  const countyEntries = sorted(counties);
  writeFileSync(join(dataDir, "zip5.json"), lines(zipEntries));
  writeFileSync(join(dataDir, "counties.json"), lines(countyEntries));

  const zipCount = zipEntries.length;
  const countyCount = countyEntries.length;
  const builtOn = new Date().toISOString().slice(0, 10);
  writeFileSync(join(dataDir, "README.md"), readme({ version, checked, builtOn, zipCount, countyCount, dropped }));
  console.log(`Wrote ${zipCount} ZIP codes and ${countyCount} counties to ${dataDir}`);
  console.log(`Dropped: ${JSON.stringify(dropped)}`);
}

function readme(r: {
  version: string;
  checked: string | null;
  builtOn: string;
  zipCount: number;
  countyCount: number;
  dropped: Record<string, number>;
}): string {
  return `# Geographic data

Generated by \`packages/server/scripts/build-zip-data.ts\` (\`pnpm geo:build\`). Do not edit by hand.

| File | Contents |
|---|---|
| \`zip5.json\` | ${r.zipCount} five-digit ZIP codes: \`zip → [city, stateCode, countyFips, lat, lng]\`. \`countyFips\` is the 5-digit county FIPS code (2-digit state FIPS plus 3-digit county code). Coordinates are GeoNames ZIP centroids rounded to 4 decimal places. |
| \`counties.json\` | ${r.countyCount} counties: \`countyFips → [name, stateCode]\`, used by \`countiesByState()\`. |

## Source and licence

- **Source:** GeoNames postal code data for the United States (\`US.txt\`), as distributed in the [\`zipcodes-us\`](https://www.npmjs.com/package/zipcodes-us) npm package, version ${r.version}.${r.checked ? ` The package README says its data was last checked or updated on ${r.checked}.` : ""}
- **Licence:** GeoNames data is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/) (CC BY 4.0). Attribution: "ZIP code data from [GeoNames](https://www.geonames.org/), CC BY 4.0". The public site footer carries this credit (build plan §7.1).
- **Built on:** ${r.builtOn}.

## What was kept

The 50 states and the District of Columbia. Dropped rows: ${r.dropped.outsideStates} outside the 50 states and DC (territories and APO/FPO military codes), ${r.dropped.noCounty} without a county code, ${r.dropped.duplicate} duplicate ZIP codes (the first row wins) and ${r.dropped.badRow} malformed rows.

## Known limits

- One county per ZIP code. A ZIP code that spans counties resolves to the county GeoNames lists for it; the HUD-USPS crosswalk (data model §4, \`zip_county_map\`) is not imported yet.
- City names are GeoNames place names as published (for example "Jbphh" for Joint Base Pearl Harbor-Hickam).
- Distances use straight-line (haversine) distance between ZIP centroids, not driving distance.
`;
}

build();

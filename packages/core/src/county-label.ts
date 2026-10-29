/** Known independent-city display labels, matched by FIPS against the 2025 Census Gazetteer.
 * Source: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_counties_national.zip
 * Display only: preserve geographic identities, stored names and all ordinary county behavior.
 */
export const INDEPENDENT_CITY_COUNTY_LABELS = [
  ["24510","Baltimore (city)","Baltimore city"],
  ["29510","St. Louis (city)","St. Louis city"],
  ["32510","Carson City (city)","Carson City"],
  ["51510","City of Alexandria","Alexandria city"],
  ["51520","Bristol (city)","Bristol city"],
  ["51530","Buena Vista (city)","Buena Vista city"],
  ["51540","Charlottesville (city)","Charlottesville city"],
  ["51550","Chesapeake (city)","Chesapeake city"],
  ["51570","Colonial Heights (city","Colonial Heights city"],
  ["51580","Covington (city)","Covington city"],
  ["51590","Danville (city)","Danville city"],
  ["51595","Emporia (city)","Emporia city"],
  ["51600","Fairfax (city)","Fairfax city"],
  ["51610","Falls Church (city)","Falls Church city"],
  ["51620","Franklin (city)","Franklin city"],
  ["51630","Fredericksburg (city)","Fredericksburg city"],
  ["51640","Galax (city)","Galax city"],
  ["51650","Hampton (city)","Hampton city"],
  ["51660","City of Harrisonburg","Harrisonburg city"],
  ["51670","Hopewell (city)","Hopewell city"],
  ["51678","Lexington (city)","Lexington city"],
  ["51680","Lynchburg (city)","Lynchburg city"],
  ["51683","Manassas (city)","Manassas city"],
  ["51685","Manassas Park (city)","Manassas Park city"],
  ["51690","Martinsville (city)","Martinsville city"],
  ["51700","Newport News (city)","Newport News city"],
  ["51710","Norfolk (city)","Norfolk city"],
  ["51720","Norton (city)","Norton city"],
  ["51730","Petersburg (city)","Petersburg city"],
  ["51735","Poquoson (city)","Poquoson city"],
  ["51740","Portsmouth (city)","Portsmouth city"],
  ["51750","Radford (city)","Radford city"],
  ["51760","City of Richmond","Richmond city"],
  ["51770","Roanoke (city)","Roanoke city"],
  ["51775","Salem (city)","Salem city"],
  ["51790","Staunton (city)","Staunton city"],
  ["51800","City of Suffolk","Suffolk city"],
  ["51810","Virginia Beach (city)","Virginia Beach city"],
  ["51820","Waynesboro (city)","Waynesboro city"],
  ["51830","Williamsburg (city)","Williamsburg city"],
  ["51840","Winchester (city)","Winchester city"],
] as const;

const displayByFips: Readonly<Record<string, string>> = Object.fromEntries(INDEPENDENT_CITY_COUNTY_LABELS.map(([fips, , display]) => [fips, display]));

/** Retain the existing County suffix unless this exact FIPS has a verified city-equivalent label. */
export function countyDisplayName(name: string, fips?: string | null): string {
  return (fips ? displayByFips[fips] : undefined) ?? `${name} County`;
}

const legacyDisplays = new Map(INDEPENDENT_CITY_COUNTY_LABELS.map(([, name, display]) => [`${name} County`.toLowerCase(), display]));
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const legacyPattern = new RegExp("\\b(?:" + [...legacyDisplays.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|") + ")\\b", "gi");

/** Repair only known generated display literals, keeping URL destinations intact.
 * Call after private-company redaction so changing a geographic phrase cannot break a name match.
 */
export function normalizeLegacyCityCountyLabels(text: string): string {
  return text.split(/(\]\([^)]+\)|https?:\/\/[^\s<>]+)/g).map((part) => {
    if (part.startsWith("](") || /^https?:\/\//.test(part)) return part;
    return part.replace(legacyPattern, (label) => legacyDisplays.get(label.toLowerCase()) ?? label);
  }).join("");
}

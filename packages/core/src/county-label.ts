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

export const ADDITIONAL_COUNTY_EQUIVALENT_LABELS = [
  ["02013","Aleutians East","Aleutians East Borough","AK",false],
  ["02016","Aleutians West (CA)","Aleutians West Census Area","AK",false],
  ["02020","Anchorage Municipality","Anchorage Municipality","AK",false],
  ["02050","Bethel Census Area","Bethel Census Area","AK",false],
  ["02060","Bristol Bay","Bristol Bay Borough","AK",false],
  ["02063","Chugach Census Area","Chugach Census Area","AK",false],
  ["02066","Copper River Census Area","Copper River Census Area","AK",false],
  ["02068","Denali","Denali Borough","AK",false],
  ["02070","Dillingham (CA)","Dillingham Census Area","AK",false],
  ["02090","Fairbanks North Star","Fairbanks North Star Borough","AK",false],
  ["02100","Haines","Haines Borough","AK",false],
  ["02105","Hoonah-Angoon","Hoonah-Angoon Census Area","AK",false],
  ["02110","Juneau City and Borough","Juneau City and Borough","AK",false],
  ["02122","Kenai Peninsula","Kenai Peninsula Borough","AK",false],
  ["02130","Ketchikan Gateway","Ketchikan Gateway Borough","AK",false],
  ["02150","Kodiak Island","Kodiak Island Borough","AK",false],
  ["02158","Kusilvak","Kusilvak Census Area","AK",false],
  ["02164","Lake and Peninsula","Lake and Peninsula Borough","AK",false],
  ["02170","Matanuska-Susitna Borough","Matanuska-Susitna Borough","AK",false],
  ["02180","Nome (CA)","Nome Census Area","AK",false],
  ["02185","North Slope","North Slope Borough","AK",false],
  ["02188","Northwest Arctic","Northwest Arctic Borough","AK",false],
  ["02195","Petersburg","Petersburg Borough","AK",false],
  ["02198","Prince of Wales-Hyder","Prince of Wales-Hyder Census Area","AK",false],
  ["02220","Sitka City and Borough","Sitka City and Borough","AK",false],
  ["02230","Skagway","Skagway Municipality","AK",false],
  ["02240","Southeast Fairbanks Census Area","Southeast Fairbanks Census Area","AK",false],
  ["02275","City and Borough of Wrangell","Wrangell City and Borough","AK",false],
  ["02290","Yukon-Koyukuk (CA)","Yukon-Koyukuk Census Area","AK",false],
  ["11001","District of Columbia","District of Columbia","DC",false],
  ["22001","Acadia","Acadia Parish","LA",false],
  ["22003","Allen","Allen Parish","LA",true],
  ["22005","Ascension","Ascension Parish","LA",false],
  ["22007","Assumption","Assumption Parish","LA",false],
  ["22009","Avoyelles","Avoyelles Parish","LA",false],
  ["22011","Beauregard","Beauregard Parish","LA",false],
  ["22013","Bienville","Bienville Parish","LA",false],
  ["22015","Bossier","Bossier Parish","LA",false],
  ["22017","Caddo Parish","Caddo Parish","LA",false],
  ["22019","Calcasieu","Calcasieu Parish","LA",false],
  ["22021","Caldwell","Caldwell Parish","LA",true],
  ["22023","Cameron","Cameron Parish","LA",true],
  ["22025","Catahoula","Catahoula Parish","LA",false],
  ["22027","Claiborne","Claiborne Parish","LA",true],
  ["22029","Concordia","Concordia Parish","LA",false],
  ["22031","De Soto","De Soto Parish","LA",false],
  ["22033","East Baton Rouge Parish","East Baton Rouge Parish","LA",false],
  ["22035","East Carroll","East Carroll Parish","LA",false],
  ["22037","East Feliciana","East Feliciana Parish","LA",false],
  ["22039","Evangeline","Evangeline Parish","LA",false],
  ["22041","Franklin","Franklin Parish","LA",true],
  ["22043","Grant","Grant Parish","LA",true],
  ["22045","Iberia","Iberia Parish","LA",false],
  ["22047","Iberville","Iberville Parish","LA",false],
  ["22049","Jackson","Jackson Parish","LA",true],
  ["22051","Jefferson Parish","Jefferson Parish","LA",false],
  ["22053","Jefferson Davis","Jefferson Davis Parish","LA",true],
  ["22055","Lafayette","Lafayette Parish","LA",true],
  ["22057","Lafourche","Lafourche Parish","LA",false],
  ["22059","La Salle","LaSalle Parish","LA",true],
  ["22061","Lincoln","Lincoln Parish","LA",true],
  ["22063","Livingston","Livingston Parish","LA",true],
  ["22065","Madison","Madison Parish","LA",true],
  ["22067","Morehouse","Morehouse Parish","LA",false],
  ["22069","Natchitoches","Natchitoches Parish","LA",false],
  ["22071","Orleans","Orleans Parish","LA",true],
  ["22073","Ouachita Parish","Ouachita Parish","LA",false],
  ["22075","Plaquemines Parish","Plaquemines Parish","LA",false],
  ["22077","Pointe Coupee","Pointe Coupee Parish","LA",false],
  ["22079","Rapides","Rapides Parish","LA",false],
  ["22081","Red River","Red River Parish","LA",true],
  ["22083","Richland","Richland Parish","LA",true],
  ["22085","Sabine","Sabine Parish","LA",true],
  ["22087","St. Bernard","St. Bernard Parish","LA",false],
  ["22089","St. Charles","St. Charles Parish","LA",true],
  ["22091","St. Helena","St. Helena Parish","LA",false],
  ["22093","St. James","St. James Parish","LA",false],
  ["22095","St. John the Baptist","St. John the Baptist Parish","LA",false],
  ["22097","St. Landry","St. Landry Parish","LA",false],
  ["22099","St. Martin","St. Martin Parish","LA",false],
  ["22101","St. Mary","St. Mary Parish","LA",false],
  ["22103","St. Tammany","St. Tammany Parish","LA",false],
  ["22105","Tangipahoa","Tangipahoa Parish","LA",false],
  ["22107","Tensas","Tensas Parish","LA",false],
  ["22109","Terrebonne","Terrebonne Parish","LA",false],
  ["22111","Union","Union Parish","LA",true],
  ["22113","Vermilion","Vermilion Parish","LA",true],
  ["22115","Vernon","Vernon Parish","LA",true],
  ["22117","Washington","Washington Parish","LA",true],
  ["22119","Webster","Webster Parish","LA",true],
  ["22121","West Baton Rouge","West Baton Rouge Parish","LA",false],
  ["22123","West Carroll","West Carroll Parish","LA",false],
  ["22125","West Feliciana","West Feliciana Parish","LA",false],
  ["22127","Winn","Winn Parish","LA",false],
] as const;

const displayByFips: Readonly<Record<string, string>> = Object.fromEntries([...INDEPENDENT_CITY_COUNTY_LABELS, ...ADDITIONAL_COUNTY_EQUIVALENT_LABELS].map(([fips, , display]) => [fips, display]));

/** Retain the existing County suffix unless this exact current FIPS has a verified equivalent. */
export function countyDisplayName(name: string, fips?: string | null): string {
  return (fips ? displayByFips[fips] : undefined) ?? `${name} County`;
}

interface LegacyCountyLabel { display: string; requiresStateContext: boolean; preserve?: boolean }
const legacyDisplays = new Map<string, LegacyCountyLabel>();
for (const [, name, display] of INDEPENDENT_CITY_COUNTY_LABELS) legacyDisplays.set(`${name} County`.toLowerCase(), { display, requiresStateContext: false });
for (const [, name, display, , requiresStateContext] of ADDITIONAL_COUNTY_EQUIVALENT_LABELS) legacyDisplays.set(`${name} County`.toLowerCase(), { display, requiresStateContext });
// The retired source label contains the current Hoonah-Angoon name as a suffix. Preserve
// the whole known historical literal rather than accidentally normalizing that substring.
legacyDisplays.set("skagway-hoonah-angoon county", { display: "", requiresStateContext: false, preserve: true });
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const legacyPattern = new RegExp("\\b(?:" + [...legacyDisplays.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|") + ")\\b", "gi");

/** Repair only known generated display literals, keeping URL destinations intact.
 * Call after private-company redaction so changing a geographic phrase cannot break a name match.
 */
export interface CountyLabelContext {
  /** The state of this particular label/row, not merely a mixed-state page's origin state. */
  stateCode?: string | null;
  /** When supplied, authorize only this own-location label in narrative text. */
  legacyLabel?: string | null;
}

export function normalizeLegacyCountyEquivalentLabels(text: string, context?: CountyLabelContext): string {
  return text.split(/(\]\([^)]+\)|https?:\/\/[^\s<>]+)/g).map((part) => {
    if (part.startsWith("](") || /^https?:\/\//.test(part)) return part;
    return part.replace(legacyPattern, (label: string, offset: number, whole: string) => {
      const entry = legacyDisplays.get(label.toLowerCase());
      if (!entry) return label;
      if (entry.preserve) return label;
      if (!entry.requiresStateContext) return entry.display;
      const explicitLouisiana = /^,\s*(?:Louisiana|LA)\b/i.test(whole.slice(offset + label.length));
      const authorizedLabel = context?.stateCode === "LA" && (!context.legacyLabel || label.toLowerCase() === context.legacyLabel.toLowerCase());
      return explicitLouisiana || authorizedLabel ? entry.display : label;
    });
  }).join("");
}

/** Backwards-compatible name for the original independent-city display repair. */
export const normalizeLegacyCityCountyLabels = normalizeLegacyCountyEquivalentLabels;

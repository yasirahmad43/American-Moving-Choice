/** ZIP codes are always 5-character strings. Never store or compare them as numbers. */
export type Zip5 = string & { readonly __zip5: unique symbol };

export function parseZip5(input: string): Zip5 | null {
  const m = /^\s*(\d{5})(?:-\d{4})?\s*$/.exec(input);
  return m ? (m[1] as Zip5) : null;
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD",
  "TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;
export type StateCode = (typeof US_STATES)[number];

export function isStateCode(s: string): s is StateCode {
  return (US_STATES as readonly string[]).includes(s);
}

/** A resolved location: a ZIP may span counties, so resolution picks the primary county and records it. */
export interface ResolvedLocation {
  zip: Zip5;
  city: string;
  state: StateCode;
  /** 5-digit county FIPS as a string, e.g. "13121" (Fulton County, GA). */
  countyFips: string;
}

export type MoveType = "local" | "intrastate" | "interstate";

export function classifyMove(origin: ResolvedLocation, dest: ResolvedLocation, miles: number, localMaxMiles = 50): MoveType {
  if (origin.state !== dest.state) return "interstate";
  return miles <= localMaxMiles ? "local" : "intrastate";
}

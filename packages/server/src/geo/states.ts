import type { StateCode } from "@amc/core";

export interface StateInfo {
  code: StateCode;
  name: string;
  /** URL slug used by public pages, e.g. "new-york" (site architecture §2.2). */
  slug: string;
  /** 2-digit state FIPS code as text. */
  fips: string;
}

/** The 50 states and DC. Mirrors the `states` table seeded by db/migrations/002_platform.sql. */
export const STATES: readonly StateInfo[] = [
  { code: "AL", name: "Alabama", slug: "alabama", fips: "01" },
  { code: "AK", name: "Alaska", slug: "alaska", fips: "02" },
  { code: "AZ", name: "Arizona", slug: "arizona", fips: "04" },
  { code: "AR", name: "Arkansas", slug: "arkansas", fips: "05" },
  { code: "CA", name: "California", slug: "california", fips: "06" },
  { code: "CO", name: "Colorado", slug: "colorado", fips: "08" },
  { code: "CT", name: "Connecticut", slug: "connecticut", fips: "09" },
  { code: "DE", name: "Delaware", slug: "delaware", fips: "10" },
  { code: "DC", name: "District of Columbia", slug: "district-of-columbia", fips: "11" },
  { code: "FL", name: "Florida", slug: "florida", fips: "12" },
  { code: "GA", name: "Georgia", slug: "georgia", fips: "13" },
  { code: "HI", name: "Hawaii", slug: "hawaii", fips: "15" },
  { code: "ID", name: "Idaho", slug: "idaho", fips: "16" },
  { code: "IL", name: "Illinois", slug: "illinois", fips: "17" },
  { code: "IN", name: "Indiana", slug: "indiana", fips: "18" },
  { code: "IA", name: "Iowa", slug: "iowa", fips: "19" },
  { code: "KS", name: "Kansas", slug: "kansas", fips: "20" },
  { code: "KY", name: "Kentucky", slug: "kentucky", fips: "21" },
  { code: "LA", name: "Louisiana", slug: "louisiana", fips: "22" },
  { code: "ME", name: "Maine", slug: "maine", fips: "23" },
  { code: "MD", name: "Maryland", slug: "maryland", fips: "24" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts", fips: "25" },
  { code: "MI", name: "Michigan", slug: "michigan", fips: "26" },
  { code: "MN", name: "Minnesota", slug: "minnesota", fips: "27" },
  { code: "MS", name: "Mississippi", slug: "mississippi", fips: "28" },
  { code: "MO", name: "Missouri", slug: "missouri", fips: "29" },
  { code: "MT", name: "Montana", slug: "montana", fips: "30" },
  { code: "NE", name: "Nebraska", slug: "nebraska", fips: "31" },
  { code: "NV", name: "Nevada", slug: "nevada", fips: "32" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire", fips: "33" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey", fips: "34" },
  { code: "NM", name: "New Mexico", slug: "new-mexico", fips: "35" },
  { code: "NY", name: "New York", slug: "new-york", fips: "36" },
  { code: "NC", name: "North Carolina", slug: "north-carolina", fips: "37" },
  { code: "ND", name: "North Dakota", slug: "north-dakota", fips: "38" },
  { code: "OH", name: "Ohio", slug: "ohio", fips: "39" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma", fips: "40" },
  { code: "OR", name: "Oregon", slug: "oregon", fips: "41" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania", fips: "42" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island", fips: "44" },
  { code: "SC", name: "South Carolina", slug: "south-carolina", fips: "45" },
  { code: "SD", name: "South Dakota", slug: "south-dakota", fips: "46" },
  { code: "TN", name: "Tennessee", slug: "tennessee", fips: "47" },
  { code: "TX", name: "Texas", slug: "texas", fips: "48" },
  { code: "UT", name: "Utah", slug: "utah", fips: "49" },
  { code: "VT", name: "Vermont", slug: "vermont", fips: "50" },
  { code: "VA", name: "Virginia", slug: "virginia", fips: "51" },
  { code: "WA", name: "Washington", slug: "washington", fips: "53" },
  { code: "WV", name: "West Virginia", slug: "west-virginia", fips: "54" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin", fips: "55" },
  { code: "WY", name: "Wyoming", slug: "wyoming", fips: "56" },
];

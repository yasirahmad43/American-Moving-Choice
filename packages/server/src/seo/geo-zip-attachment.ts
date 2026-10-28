export interface GeoCityCandidate {
  id: number;
  state_code: string;
  slug: string;
  name: string;
  zips: readonly string[];
  place_geoid: string | null;
}

/** A shared postal ZIP can occur in several city records. Choose by source meaning,
 * never SELECT/heap order or database IDs, so repeated imports produce the same facts.
 */
export function buildCityAttachments(
  cities: readonly GeoCityCandidate[],
  postalPlaces: Readonly<Record<string, readonly [place: string, state: string, ...rest: unknown[]]>>,
): { cityByZip: Map<string, number>; cityByPlace: Map<string, number> } {
  const key = (city: GeoCityCandidate) => `${city.state_code}\0${city.slug}\0${city.name}`;
  const ordered = [...cities].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  const chosen = new Map<string, GeoCityCandidate>();
  const cityByPlace = new Map<string, number>();
  for (const city of ordered) {
    if (city.place_geoid && !cityByPlace.has(city.place_geoid)) cityByPlace.set(city.place_geoid, city.id);
    for (const zip of city.zips) {
      const postal = postalPlaces[zip];
      if (!postal || city.state_code !== postal[1]) continue;
      const previous = chosen.get(zip);
      const exactPlace = (candidate: GeoCityCandidate) => candidate.name.trim().toLowerCase() === postal[0].trim().toLowerCase();
      // The stable semantic ordering supplies the fallback when neither or both names match.
      if (!previous || (exactPlace(city) && !exactPlace(previous))) chosen.set(zip, city);
    }
  }
  return { cityByZip: new Map([...chosen].map(([zip, city]) => [zip, city.id])), cityByPlace };
}

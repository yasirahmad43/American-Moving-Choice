import { distanceMiles } from "../geo/geo";

/** Deterministic geographic coverage, not popularity or a road itinerary. */
export function representativePoints<T extends { key: string; lat: number; lng: number }>(points: T[], limit: number, center: { lat: number; lng: number }): T[] {
  const unique = new Map<string, T>();
  for (const point of [...points].sort((a, b) => a.key.localeCompare(b.key))) {
    if (Number.isFinite(point.lat) && Number.isFinite(point.lng) && !unique.has(point.key)) unique.set(point.key, point);
  }
  const remaining = [...unique.values()];
  if (limit < 1 || !remaining.length) return [];
  const first = [...remaining].sort((a, b) => distanceMiles(center, a) - distanceMiles(center, b) || a.key.localeCompare(b.key))[0]!;
  const selected = [first];
  remaining.splice(remaining.findIndex((point) => point.key === first.key), 1);
  while (remaining.length && selected.length < Math.floor(limit)) {
    let index = 0, spread = -1;
    for (let i = 0; i < remaining.length; i++) {
      const distance = Math.min(...selected.map((point) => distanceMiles(point, remaining[i]!)));
      if (distance > spread) { spread = distance; index = i; }
    }
    selected.push(remaining.splice(index, 1)[0]!);
  }
  return selected.sort((a, b) => a.key.localeCompare(b.key));
}

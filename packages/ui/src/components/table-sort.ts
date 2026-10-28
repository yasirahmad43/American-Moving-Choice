export type TableSortValue = string | number | null;

/** Empty cells remain last in either direction; numbers, money and ISO dates sort by value. */
export function tableSortValue(raw: string, dateTime?: string): TableSortValue {
  if (dateTime) {
    const timestamp = Date.parse(dateTime);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  const value = raw.trim();
  if (!value || value === "—" || value === "–") return null;
  const accounting = /^\([\d,.\s$£€%+-]+\)$/.test(value);
  const numeric = (accounting ? `-${value.slice(1, -1)}` : value).replace(/[$£€,%\s]/g, "");
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numeric)) return Number(numeric);
  return value.toLocaleLowerCase("en-US");
}

export function compareTableValues(a: TableSortValue, b: TableSortValue, direction: "ascending" | "descending"): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  const comparison = typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), "en", { numeric: true });
  return direction === "ascending" ? comparison : -comparison;
}

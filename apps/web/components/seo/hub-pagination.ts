/** Bounded native pagination, independent of the size of a published family. */
export function hubPageNumbers(page: number, count: number): number[] {
  const result = new Set([1, count]);
  for (let value = Math.max(1, page - 2); value <= Math.min(count, page + 2); value++) result.add(value);
  return [...result].sort((a, b) => a - b);
}

/** Reject ambiguous, signed, fractional, zero-padded and impractically large input. */
export function parseHubPageNumber(raw: unknown): number | null {
  return typeof raw === "string" && /^[1-9][0-9]{0,5}$/.test(raw) ? Number(raw) : null;
}

export const hubPagePath = (url: string, page: number): string => page <= 1 ? url : `${url}page/${page}/`;

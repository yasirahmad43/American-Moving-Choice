export type ClassValue = string | false | null | undefined | 0;

/** Joins class names, skipping falsy values. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

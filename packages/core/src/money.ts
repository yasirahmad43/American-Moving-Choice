/** All money is integer cents. Factors are integer basis points (10000 = 100%). */
export type Cents = number;
export type BasisPoints = number;

/** cents * bp / 10000, rounded half-up to the nearest cent. Inputs must be non-negative integers. */
export function applyBasisPoints(cents: Cents, bp: BasisPoints): Cents {
  assertNonNegInt(cents, "cents");
  assertNonNegInt(bp, "bp");
  return Math.floor((cents * bp + 5000) / 10000);
}

export function assertNonNegInt(n: number, name: string): void {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`${name} must be a non-negative integer, got ${n}`);
}

export function formatUsd(cents: Cents): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

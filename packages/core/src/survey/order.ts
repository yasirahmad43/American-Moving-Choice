/**
 * Neutral order for the movers named to a consumer (implications §3.1, §9.2): a request started
 * from a mover's profile lists that mover first; the rest follow a fresh cryptographically random
 * shuffle for each request. The order never uses price, spend, purchase history or ratings: the
 * function sees only IDs. The order shown is stored in the consent record.
 *
 * [Owner: the published neutral-order rule is still to be set (Which companies receive my request,
 * "The order"); random rotation is the implications §3.1 example and the build default.]
 */
import { secureRandomBytes, type RandomBytes } from "./reference";

/** Uniform random integer in [0, n) by rejection sampling on 32-bit values (no modulo bias). */
export function randomBelow(n: number, random: RandomBytes = secureRandomBytes): number {
  if (!Number.isInteger(n) || n < 1 || n > 0x100000000) throw new RangeError("n must be a whole number from 1 to 2^32");
  const limit = Math.floor(0x100000000 / n) * n;
  for (;;) {
    const b = random(4);
    const value = ((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0;
    if (value < limit) return value % n;
  }
}

/** Fisher–Yates shuffle into a new array. */
export function secureShuffle<T>(items: readonly T[], random: RandomBytes = secureRandomBytes): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1, random);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Shuffles items neutrally, with the profile-origin item (if present) first. */
export function neutralOrder<T>(items: readonly T[], idOf: (item: T) => string, firstId?: string | null, random: RandomBytes = secureRandomBytes): T[] {
  const first = firstId ? items.filter((item) => idOf(item) === firstId) : [];
  const rest = firstId ? items.filter((item) => idOf(item) !== firstId) : [...items];
  return [...first, ...secureShuffle(rest, random)];
}

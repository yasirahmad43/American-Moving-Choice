import { ReportingFailure } from "./http";
import type { ProviderSnapshot } from "./types";

export interface ReportResult<T> { data: T; reportedThrough: string | null }

let bingEpoch = 0;
export const bingReportingCacheEpoch = (): number => bingEpoch;
export function invalidateBingReportingCache(): void { bingEpoch += 1; }

/** Per-process TTL + singleflight. Failures replace expired data, never masquerade as a stale success. */
export function providerCache<T>(
  ttlMs: number,
  now: () => number,
  load: () => Promise<ReportResult<T>>,
  readEpoch: () => number = () => 0,
): () => Promise<ProviderSnapshot<T>> {
  let cached: ProviderSnapshot<T> | undefined;
  let expiresAt = 0;
  let pending: Promise<ProviderSnapshot<T>> | undefined;
  let currentEpoch = readEpoch();
  return () => {
    if (currentEpoch !== readEpoch()) {
      cached = undefined;
      expiresAt = 0;
      currentEpoch = readEpoch();
    }
    if (cached && now() < expiresAt) return Promise.resolve(structuredClone(cached));
    pending ??= (async (): Promise<ProviderSnapshot<T>> => {
      const loadedEpoch = readEpoch();
      const checkedAt = new Date(now()).toISOString();
      let resultSnapshot: ProviderSnapshot<T>;
      try {
        const result = await load();
        resultSnapshot = { status: "connected", checkedAt, reportedThrough: result.reportedThrough, data: result.data };
        expiresAt = now() + ttlMs;
      } catch (error) {
        const failure = error instanceof ReportingFailure ? error : new ReportingFailure("unavailable");
        resultSnapshot = { status: failure.status, checkedAt, reportedThrough: null, data: null };
        // Respect provider backoff without looping inside an admin request.
        expiresAt = now() + (failure.retryAfterMs ?? (failure.status === "access_denied" ? 30_000 : failure.status === "not_configured" ? 15_000 : 5_000));
      }
      if (loadedEpoch === readEpoch()) cached = resultSnapshot;
      return resultSnapshot;
    })().finally(() => { pending = undefined; });
    return pending.then((result) => structuredClone(result));
  };
}

export function notConfigured<T>(): ProviderSnapshot<T> {
  return { status: "not_configured", checkedAt: null, reportedThrough: null, data: null };
}

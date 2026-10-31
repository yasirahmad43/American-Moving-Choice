import { ReportingFailure } from "./http";
import type { ProviderSnapshot } from "./types";

export interface ReportResult<T> { data: T; reportedThrough: string | null }

/** Per-process TTL + singleflight. Failures replace expired data, never masquerade as a stale success. */
export function providerCache<T>(
  ttlMs: number,
  now: () => number,
  load: () => Promise<ReportResult<T>>,
): () => Promise<ProviderSnapshot<T>> {
  let cached: ProviderSnapshot<T> | undefined;
  let expiresAt = 0;
  let pending: Promise<ProviderSnapshot<T>> | undefined;
  return () => {
    if (cached && now() < expiresAt) return Promise.resolve(structuredClone(cached));
    pending ??= (async (): Promise<ProviderSnapshot<T>> => {
      const checkedAt = new Date(now()).toISOString();
      try {
        const result = await load();
        cached = { status: "connected", checkedAt, reportedThrough: result.reportedThrough, data: result.data };
        expiresAt = now() + ttlMs;
      } catch (error) {
        const failure = error instanceof ReportingFailure ? error : new ReportingFailure("unavailable");
        cached = { status: failure.status, checkedAt, reportedThrough: null, data: null };
        // Respect provider backoff without looping inside an admin request.
        expiresAt = now() + (failure.retryAfterMs ?? (failure.status === "access_denied" ? 30_000 : 5_000));
      }
      return cached;
    })().finally(() => { pending = undefined; });
    return pending.then((result) => structuredClone(result));
  };
}

export function notConfigured<T>(): ProviderSnapshot<T> {
  return { status: "not_configured", checkedAt: null, reportedThrough: null, data: null };
}

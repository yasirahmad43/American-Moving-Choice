export interface PollState { loading: boolean; error: boolean; checkedAt: string | null }
export interface ReportPoller { refresh(): void; visibilityChanged(): void; stop(): void }

/** One request at a time. A generation guard also rejects late responses after abort. */
export function createReportPoller<T>(options: {
  url: string; interval: number; onData(data: T): void; onState(state: PollState): void;
  onAuthFailure(): void; visible?: () => boolean; fetcher?: typeof fetch; timeout?: number;
}): ReportPoller {
  const visible = options.visible ?? (() => document.visibilityState === "visible");
  const fetcher = options.fetcher ?? fetch;
  let stopped = false, busy = false, generation = 0, failures = 0;
  let checkedAt: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  const clear = () => { clearTimeout(timer); clearTimeout(timeout); };
  const abort = () => { generation++; clear(); controller?.abort(); busy = false; };
  const poll = async () => {
    if (stopped || busy || !visible()) return;
    clear(); busy = true;
    const current = ++generation;
    controller = new AbortController();
    timeout = setTimeout(() => controller?.abort(), options.timeout ?? 12_000);
    options.onState({ loading: true, error: failures > 0, checkedAt });
    try {
      const response = await fetcher(options.url, { signal: controller.signal, credentials: "same-origin", cache: "no-store", redirect: "error" });
      if (stopped || current !== generation) return;
      if (response.status === 401 || response.status === 403) {
        stopped = true; abort(); options.onAuthFailure(); return;
      }
      if (!response.ok) throw new Error("report_unavailable");
      const data = await response.json() as T;
      if (stopped || current !== generation) return;
      failures = 0; checkedAt = new Date().toISOString();
      options.onData(data);
      options.onState({ loading: false, error: false, checkedAt });
    } catch {
      if (stopped || current !== generation) return;
      failures++;
      options.onState({ loading: false, error: true, checkedAt });
    } finally {
      if (!stopped && current === generation) {
        clearTimeout(timeout); busy = false;
        if (visible()) timer = setTimeout(() => void poll(), Math.min(120_000, options.interval * 2 ** Math.min(failures, 4)));
      }
    }
  };
  return {
    refresh() { void poll(); },
    visibilityChanged() {
      if (!visible()) { abort(); options.onState({ loading: false, error: failures > 0, checkedAt }); }
      else void poll();
    },
    stop() { stopped = true; abort(); },
  };
}

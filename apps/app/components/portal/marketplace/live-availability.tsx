"use client";

/**
 * Real-time availability (lead lifecycle §5; MVP M5): polls /api/marketplace/availability every
 * 10 s for the request groups on the page while the tab is visible, backs off on errors, and
 * refreshes the server-rendered page when a request's status, buyer count or in-progress flag
 * changes, so sold-out requests leave the list and buyer meters move. A purchase on this page
 * (PurchaseDialog dispatches AVAILABILITY_REFRESH_EVENT) revalidates at once; a request this
 * company just bought never triggers a refresh, so the dialog's "Open contact details" stays.
 * The server stays authoritative: Buy re-checks everything.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const AVAILABILITY_REFRESH_EVENT = "amc:availability-refresh";

/** Tells the poller on this page to revalidate now; `groupId` names a request this company just bought. */
export function requestAvailabilityRefresh(groupId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AVAILABILITY_REFRESH_EVENT, { detail: { groupId } }));
}

export const AVAILABILITY_POLL_MS = 10_000;
const MAX_BACKOFF_MS = 120_000;

export interface AvailabilitySnapshot {
  groupId: string;
  status: "available" | "sold_out" | "expired" | "withdrawn" | "purchased" | "unavailable";
  buyerCount: number;
  sharingLimit: number;
  inProgress: boolean;
}

/**
 * True when a later snapshot should re-render the page: a status, buyer count or in-progress change
 * on any request, except a request in `bought` (purchased from this page: its dialog shows the
 * result and must not be unmounted by a refresh).
 */
export function availabilityChanged(previous: Map<string, AvailabilitySnapshot> | null, next: AvailabilitySnapshot[], bought: ReadonlySet<string> = new Set()): boolean {
  if (!previous) return false;
  return next.some((row) => {
    const before = previous.get(row.groupId);
    if (!before) return false;
    if (bought.has(row.groupId)) return false;
    return before.status !== row.status || before.buyerCount !== row.buyerCount || before.inProgress !== row.inProgress;
  });
}

/** Next polling delay after `errors` consecutive failures: 10 s, 20 s, 40 s … up to two minutes. */
export function backoffMs(errors: number): number {
  return Math.min(MAX_BACKOFF_MS, AVAILABILITY_POLL_MS * 2 ** Math.min(errors, 6));
}

export function useAvailability(groupIds: readonly string[]) {
  const router = useRouter();
  const [state, setState] = useState<{ checkedAt: Date | null; error: boolean }>({ checkedAt: null, error: false });
  const previous = useRef<Map<string, AvailabilitySnapshot> | null>(null);
  const bought = useRef(new Set<string>());
  const errors = useRef(0);
  const key = groupIds.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(poll, ms);
    };

    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return; // resumes on visibilitychange
      try {
        const response = await fetch(`/api/marketplace/availability?ids=${encodeURIComponent(key)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { rows: AvailabilitySnapshot[] };
        if (cancelled) return;
        if (availabilityChanged(previous.current, body.rows, bought.current)) router.refresh();
        previous.current = new Map(body.rows.map((r) => [r.groupId, r]));
        errors.current = 0;
        setState({ checkedAt: new Date(), error: false });
        schedule(AVAILABILITY_POLL_MS);
      } catch {
        if (cancelled) return;
        errors.current += 1;
        setState((s) => ({ ...s, error: true }));
        schedule(backoffMs(errors.current));
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    const onRefresh = (event: Event) => {
      const groupId = (event as CustomEvent<{ groupId?: string }>).detail?.groupId;
      if (groupId) bought.current.add(groupId);
      void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(AVAILABILITY_REFRESH_EVENT, onRefresh);
    void poll();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(AVAILABILITY_REFRESH_EVENT, onRefresh);
    };
  }, [key, router]);

  return state;
}

/** The status line for the marketplace header: what the poller is doing. */
export function LiveAvailability({ groupIds }: { groupIds: readonly string[] }) {
  const { checkedAt, error } = useAvailability(groupIds);
  if (groupIds.length === 0) return <span className="type-small text-text-2">Buying always re-checks availability.</span>;
  return (
    <span className="type-small text-text-2" aria-live="polite">
      {error
        ? "Live updates paused; retrying. Buying always re-checks availability."
        : checkedAt
          ? `Live: checked ${checkedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}; updates every 10 seconds while this tab is open.`
          : "Checking availability…"}
    </span>
  );
}

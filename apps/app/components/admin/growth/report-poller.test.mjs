import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createReportPoller } from "./report-poller.ts";

let visible, fetcher, onData, onState, onAuthFailure, poller;
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function setup(extra = {}) { poller = createReportPoller({ url: "/api/admin/growth", interval: 15_000, visible: () => visible, fetcher, onData, onState, onAuthFailure, ...extra }); return poller; }
beforeEach(() => { vi.useFakeTimers(); visible = true; fetcher = vi.fn().mockResolvedValue(Response.json({ count: 7 })); onData = vi.fn(); onState = vi.fn(); onAuthFailure = vi.fn(); });
afterEach(() => { poller?.stop(); vi.useRealTimers(); });

describe("report polling lifecycle", () => {
  it("waits while hidden, resumes once and sends same-origin private reads", async () => {
    visible = false; setup().refresh(); await flush(); expect(fetcher).not.toHaveBeenCalled();
    visible = true; poller.visibilityChanged(); await flush();
    expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store", credentials: "same-origin", redirect: "error" });
    await vi.advanceTimersByTimeAsync(15_000); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("serializes timer, visibility and manual triggers", async () => {
    let resolve; fetcher.mockImplementation(() => new Promise(done => { resolve = done; }));
    setup().refresh(); poller.refresh(); poller.visibilityChanged(); await vi.advanceTimersByTimeAsync(10_000);
    expect(fetcher).toHaveBeenCalledTimes(1); resolve(Response.json({ count: 9 })); await flush(); expect(onData).toHaveBeenCalledWith({ count: 9 });
  });
  it("aborts hidden requests and ignores late responses even when the transport ignores abort", async () => {
    let resolve; fetcher.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    setup().refresh(); const signal = fetcher.mock.calls[0][1].signal;
    visible = false; poller.visibilityChanged(); expect(signal.aborted).toBe(true);
    visible = true; poller.visibilityChanged(); await flush(); expect(onData).toHaveBeenCalledTimes(1);
    resolve(Response.json({ old: true })); await flush(); expect(onData).toHaveBeenCalledTimes(1);
  });
  it("uses bounded backoff and resets it after success", async () => {
    fetcher.mockRejectedValueOnce(new Error("offline")); setup().refresh(); await flush();
    await vi.advanceTimersByTimeAsync(29_999); expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(15_000); expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("times out a request and recovers", async () => {
    fetcher.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")))));
    setup().refresh(); await vi.advanceTimersByTimeAsync(12_000); expect(onState).toHaveBeenLastCalledWith(expect.objectContaining({ error: true, loading: false }));
    await vi.advanceTimersByTimeAsync(30_000); expect(onData).toHaveBeenCalledWith({ count: 7 });
  });
  it.each([401, 403])("stops permanently on status %s", async status => {
    fetcher.mockResolvedValue(new Response(null, { status })); setup().refresh(); await flush();
    expect(onAuthFailure).toHaveBeenCalledTimes(1); expect(onData).not.toHaveBeenCalled();
    poller.refresh(); poller.visibilityChanged(); await vi.advanceTimersByTimeAsync(300_000); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("ignores a late result after unmount or touch replacement", async () => {
    let resolve; fetcher.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    setup().refresh(); poller.stop(); resolve(Response.json({ old: true })); await flush();
    expect(onData).not.toHaveBeenCalled(); expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  });
});

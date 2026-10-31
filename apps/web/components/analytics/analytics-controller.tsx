"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, browserPrivacyOptOut, readAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics/consent";
import { publicAnalyticsPath } from "@/lib/analytics/events";
import { analyticsLoaded, initializeAnalytics, revokeAnalytics, trackPageView } from "@/lib/analytics/runtime";

const OPEN_CHOICES = "amc:analytics-choices";
export function AnalyticsChoicesButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CHOICES))} className="inline-flex min-h-11 items-center underline underline-offset-4">Analytics choices</button>;
}
export function AnalyticsController({ enabled, containerId, origin }: { enabled: boolean; containerId?: string; origin: string }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<AnalyticsConsent | null>(null);
  const [visible, setVisible] = useState(false);
  const [privacyOptOut, setPrivacyOptOut] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const configured = enabled && /^GTM-[A-Z0-9]{4,16}$/u.test(containerId ?? "");

  useEffect(() => {
    const update = () => {
      const current = readAnalyticsConsent();
      setChoice(current); setPrivacyOptOut(browserPrivacyOptOut());
      if (current !== "granted") {
        try { revokeAnalytics(); } catch {
          // Blocked optional cookies must not break the public form or its choices.
          if (analyticsLoaded()) window.location.reload();
        }
        setVisible(current === null && Boolean(publicAnalyticsPath(window.location.pathname)));
        return;
      }
      setVisible(false);
      if (configured && initializeAnalytics(containerId!, origin)) trackPageView();
    };
    const open = () => {
      setVisible(true);
      window.setTimeout(() => { heading.current?.scrollIntoView({ block: "center" }); heading.current?.focus({ preventScroll: true }); }, 0);
    };
    const storage = (event: StorageEvent) => { if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) update(); };
    // A loaded tag runtime must not survive into a document containing private records.
    const privateLink = (event: MouseEvent) => {
      if (!analyticsLoaded() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && !publicAnalyticsPath(url.pathname)) {
        event.preventDefault(); event.stopImmediatePropagation(); window.location.assign(url.href);
      }
    };
    const privateBack = () => { if (analyticsLoaded() && !publicAnalyticsPath(window.location.pathname)) window.location.reload(); };
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    window.addEventListener(OPEN_CHOICES, open);
    window.addEventListener("storage", storage);
    window.addEventListener("click", privateLink, true);
    window.addEventListener("popstate", privateBack);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, update); window.removeEventListener(OPEN_CHOICES, open);
      window.removeEventListener("storage", storage); window.removeEventListener("click", privateLink, true); window.removeEventListener("popstate", privateBack);
    };
  }, [configured, containerId, origin]);
  useEffect(() => {
    if (!publicAnalyticsPath(pathname)) { if (analyticsLoaded()) window.location.reload(); return; }
    if (configured && readAnalyticsConsent() === "granted" && initializeAnalytics(containerId!, origin)) trackPageView();
  }, [pathname, configured, containerId, origin]);

  if (!visible) return null;
  const choose = (value: AnalyticsConsent) => { setChoice(setAnalyticsConsent(value)); setVisible(false); };
  return <section aria-labelledby="analytics-choice-heading" className="border-b border-border bg-surface-2 py-4" data-analytics-consent="">
    <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-8 gap-y-3 gutter">
      <div className="min-w-0 flex-1 basis-72"><h2 ref={heading} tabIndex={-1} id="analytics-choice-heading" className="text-base font-bold">Your privacy choices</h2><p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-text-2">Optional cookies help us understand which pages and campaigns are useful. We keep your move answers and contact details out of Google Analytics. You can use the site with analytics off.</p>{privacyOptOut ? <p className="mt-1 text-sm">Your browser&apos;s privacy preference keeps analytics off.</p> : null}</div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => choose("denied")} className="min-h-11 rounded-control border border-border-strong bg-surface px-4 py-2 text-sm font-semibold">Keep analytics off</button><button type="button" disabled={privacyOptOut} onClick={() => choose("granted")} className="min-h-11 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Allow analytics</button>{choice ? <button type="button" onClick={() => setVisible(false)} className="min-h-11 px-3 text-sm underline">Close</button> : null}</div>
    </div>
  </section>;
}

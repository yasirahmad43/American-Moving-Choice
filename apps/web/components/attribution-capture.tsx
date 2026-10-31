"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ANALYTICS_CONSENT_EVENT } from "@/lib/analytics/consent";
import { captureCampaignAttribution, configureAttributionOrigins } from "@/lib/attribution";

/** No markup, tags, requests or analytics events: campaign metadata stays first-party. */
export function AttributionCapture({ ownOrigins }: { ownOrigins: readonly string[] }) {
  const path = usePathname(), search = useSearchParams();
  const originsKey = ownOrigins.join("\n");
  useEffect(() => {
    configureAttributionOrigins(originsKey.split("\n"));
    const capture = () => { captureCampaignAttribution(); };
    capture();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, capture);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, capture);
  }, [path, search, originsKey]);
  return null;
}

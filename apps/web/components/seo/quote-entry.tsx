"use client";

/**
 * The quote entry on programmatic pages: writes the page's ZIP codes to sessionStorage
 * (amc.survey.prefill: { entry, originZip, destZip }) and opens /get-quotes/ with no query string,
 * so ZIP codes never go in URLs (site architecture §8.8). The survey shows the values for the
 * visitor to confirm. Without JavaScript it is a plain link to the survey.
 */
import { LinkButton } from "@amc/ui";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { captureCampaignAttribution } from "@/lib/attribution";

export const PREFILL_STORAGE_KEY = "amc.survey.prefill";

export function QuoteEntryButton({ originZip, destZip, label }: { originZip?: string; destZip?: string; label: string }) {
  const router = useRouter();
  const start = (event: MouseEvent) => {
    event.preventDefault();
    captureCampaignAttribution();
    try {
      const prefill: Record<string, string> = { entry: "household" };
      if (originZip && /^\d{5}$/.test(originZip)) prefill.originZip = originZip;
      if (destZip && /^\d{5}$/.test(destZip)) prefill.destZip = destZip;
      window.sessionStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(prefill));
    } catch {
      // Storage blocked: the survey still opens and asks for both ZIP codes.
    }
    router.push("/get-quotes/");
  };
  return (
    <LinkButton href="/get-quotes/" variant="cta" onClick={start}>
      {label}
    </LinkButton>
  );
}

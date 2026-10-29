import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { HubPage, hubMetadata, hubPageUrl } from "@/components/seo/hub-page";
import { PLANNING_HUB } from "@/components/seo/editorial-hub-specs";
import { parseHubPageNumber } from "@/components/seo/hub-pagination";

export const metadata: Metadata = hubMetadata(PLANNING_HUB);

export default async function PlanningHub({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await connection();
  const { page } = await searchParams;
  if (page !== undefined) {
    const number = parseHubPageNumber(page);
    if (number === null) notFound();
    permanentRedirect(hubPageUrl(PLANNING_HUB, number));
  }
  return <HubPage spec={PLANNING_HUB} />;
}

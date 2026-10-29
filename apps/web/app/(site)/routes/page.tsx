import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { HubPage, hubMetadata, hubPageUrl } from "@/components/seo/hub-page";
import { ROUTES_HUB } from "@/components/seo/routes-hub-spec";
import { parseHubPageNumber } from "@/components/seo/hub-pagination";

export const metadata: Metadata = hubMetadata(ROUTES_HUB);

export default async function RoutesHub({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await connection();
  const { page } = await searchParams;
  if (page !== undefined) {
    const number = parseHubPageNumber(page);
    if (number === null) notFound();
    permanentRedirect(hubPageUrl(ROUTES_HUB, number));
  }
  return <HubPage spec={ROUTES_HUB} />;
}

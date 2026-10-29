import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { HubPage, hubMetadata } from "@/components/seo/hub-page";
import { PLANNING_HUB } from "@/components/seo/editorial-hub-specs";
import { parseHubPageNumber } from "@/components/seo/hub-pagination";

type Params = Promise<{ page: string }>;
function pageNumber(raw: string): number {
  const page = parseHubPageNumber(raw);
  if (page === null) notFound();
  if (page === 1) permanentRedirect(PLANNING_HUB.url);
  return page;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return hubMetadata(PLANNING_HUB, pageNumber((await params).page));
}

export default async function PlanningHubPage({ params }: { params: Params }) {
  await connection();
  return <HubPage spec={PLANNING_HUB} page={pageNumber((await params).page)} />;
}

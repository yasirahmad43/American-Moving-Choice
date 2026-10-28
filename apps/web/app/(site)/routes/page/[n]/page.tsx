import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { HubPage, hubMetadata } from "@/components/seo/hub-page";
import { ROUTES_HUB } from "@/components/seo/routes-hub-spec";
type Params = Promise<{ n: string }>;
function pageNumber(raw: string): number {
  if (!/^[0-9]{1,4}$/.test(raw)) notFound();
  const page = Number(raw);
  if (page === 1) permanentRedirect(ROUTES_HUB.url);
  if (page < 1) notFound();
  return page;
}
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return hubMetadata(ROUTES_HUB, pageNumber((await params).n));
}
export default async function RoutesHubPage({ params }: { params: Params }) {
  await connection();
  return <HubPage spec={ROUTES_HUB} page={pageNumber((await params).n)} />;
}

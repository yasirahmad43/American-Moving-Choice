import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { HubPage, hubMetadata } from "@/components/seo/hub-page";
import { ROUTES_HUB } from "../../page";

type Params = Promise<{ n: string }>;

/** /routes/page/{n}/: page n of the routes hub (400 routes a page, URL order); page 1 is /routes/ itself. */
function pageNumber(raw: string): number {
  if (!/^[0-9]{1,4}$/.test(raw)) notFound();
  const n = Number(raw);
  if (n === 1) permanentRedirect(ROUTES_HUB.url);
  if (n < 1) notFound();
  return n;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return hubMetadata(ROUTES_HUB, pageNumber((await params).n));
}

export default async function RoutesHubPage({ params }: { params: Params }) {
  await connection();
  return <HubPage spec={ROUTES_HUB} page={pageNumber((await params).n)} />;
}

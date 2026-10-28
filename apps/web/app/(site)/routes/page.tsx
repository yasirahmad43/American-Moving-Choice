import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata } from "@/components/seo/hub-page";
import { ROUTES_HUB } from "@/components/seo/routes-hub-spec";

export const metadata: Metadata = hubMetadata(ROUTES_HUB);

export default async function RoutesHub() {
  await connection();
  return <HubPage spec={ROUTES_HUB} />;
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";
import { ROUTES_PER_HUB_PAGE } from "@/lib/sitemaps";

export const ROUTES_HUB: HubSpec = {
  url: "/routes/",
  family: "route",
  title: "Moving Routes: State-to-State and City-to-City Moves | American Moving Choice",
  h1: "Moving routes",
  description: "Directional route pages with the straight-line distance, the distance band, the movers in our network that cover that direction, and the rules that apply.",
  lede: "Each route is one direction: A to B and B to A are separate pages with their own coverage counts. Distances are straight-line miles between centroids, the figure the cost model uses to pick a band.",
  groupByState: true,
  perPage: ROUTES_PER_HUB_PAGE,
};

export const metadata: Metadata = hubMetadata(ROUTES_HUB);

export default async function RoutesHub() {
  await connection();
  return <HubPage spec={ROUTES_HUB} />;
}

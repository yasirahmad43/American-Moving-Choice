import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";

const SPEC: HubSpec = {
  url: "/routes/",
  family: "route",
  title: "Moving Routes: State-to-State and City-to-City Moves | American Moving Choice",
  h1: "Moving routes",
  description: "Directional route pages with the straight-line distance, the distance band, the movers in our network that cover that direction, and the rules that apply.",
  lede: "Each route is one direction: A to B and B to A are separate pages with their own coverage counts. Distances are straight-line miles between centroids, the figure the cost model uses to pick a band.",
  groupByState: true,
};

export const metadata: Metadata = hubMetadata(SPEC);

export default async function RoutesHub() {
  await connection();
  return <HubPage spec={SPEC} />;
}

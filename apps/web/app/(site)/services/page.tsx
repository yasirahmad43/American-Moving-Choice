import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";

const SPEC: HubSpec = {
  url: "/services/",
  family: "service",
  title: "Moving Services: Local, Long-Distance, Interstate, Packing, Storage and Specialty",
  h1: "Moving services",
  description: "What each kind of moving service covers, how movers price it, which rules apply, and how many movers in our network offer it today.",
  lede: "Six service pages, each with the pricing method movers use, the federal or state rules that apply and a dated count of network movers that offer the service.",
};

export const metadata: Metadata = hubMetadata(SPEC);

export default async function ServicesHub() {
  await connection();
  return <HubPage spec={SPEC} />;
}

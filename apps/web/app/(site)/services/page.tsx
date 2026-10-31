import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";

const SPEC: HubSpec = {
  url: "/services/",
  family: "service",
  title: "Moving Services: Local, Long-Distance, Interstate, Packing, Storage and Specialty",
  h1: "Moving services",
  description: "What local, long-distance, interstate, packing, storage and specialty moving services cover, how pricing works, and which rules to check.",
  lede: "Six moving-service guides explain the work involved, the pricing methods companies use and the relevant federal or state rules. Read the guide for the service you need before comparing written estimates.",
};

export const metadata: Metadata = hubMetadata(SPEC);

export default async function ServicesHub() {
  await connection();
  return <HubPage spec={SPEC} />;
}

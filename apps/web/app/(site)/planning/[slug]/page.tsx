import type { Metadata } from "next";
import { connection } from "next/server";
import { CatalogPage, catalogMetadata } from "@/components/seo/catalog-route";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return catalogMetadata("/planning/", (await params).slug);
}

export default async function PlanningPage({ params }: { params: Params }) {
  await connection();
  return <CatalogPage prefix="/planning/" segment={(await params).slug} hub={{ label: "Planning", href: "/planning/" }} />;
}

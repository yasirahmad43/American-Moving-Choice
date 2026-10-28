import type { Metadata } from "next";
import { connection } from "next/server";
import { CatalogPage, catalogMetadata } from "@/components/seo/catalog-route";

type Params = Promise<{ service: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return catalogMetadata("/services/", (await params).service);
}

export default async function ServicePage({ params }: { params: Params }) {
  await connection();
  return <CatalogPage prefix="/services/" segment={(await params).service} hub={{ label: "Services", href: "/services/" }} />;
}

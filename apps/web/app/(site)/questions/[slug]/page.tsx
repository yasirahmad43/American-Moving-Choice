import type { Metadata } from "next";
import { connection } from "next/server";
import { CatalogPage, catalogMetadata } from "@/components/seo/catalog-route";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return catalogMetadata("/questions/", (await params).slug);
}

export default async function QuestionPage({ params }: { params: Params }) {
  await connection();
  return <CatalogPage prefix="/questions/" segment={(await params).slug} hub={{ label: "Questions", href: "/questions/" }} />;
}

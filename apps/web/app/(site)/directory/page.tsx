import { listDirectory, parseDirectorySort } from "@amc/server/profiles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DIRECTORY_PATH, DirectoryView, directoryTitle } from "@/components/directory/directory-view";
import { canonical } from "@/components/directory/seo";

export function generateMetadata(): Metadata {
  return {
    title: directoryTitle(1),
    description: "Moving carriers in the American Moving Choice network, each with its dated FMCSA checks, badge explainer and separate quote and move ratings.",
    // Sort variants canonicalize to the base URL (site architecture §2.4 rule 3).
    ...canonical(DIRECTORY_PATH),
  };
}

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const { sort } = await searchParams;
  const data = await listDirectory({ page: 1, sort: parseDirectorySort(sort) });
  if (!data) notFound();
  return <DirectoryView data={data} />;
}

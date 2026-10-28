import { listDirectory, parseDirectorySort } from "@amc/server/profiles";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DIRECTORY_PATH, DirectoryView, directoryHref, directoryTitle } from "@/components/directory/directory-view";
import { canonical } from "@/components/directory/seo";

type Params = Promise<{ n: string }>;

/** "2" → 2; anything else (leading zeros, signs, letters) is not a page. */
function pageNumber(raw: string): number | null {
  return /^[1-9]\d{0,4}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = pageNumber((await params).n);
  if (!page) return {};
  // Paginated pages are self-canonical with unique titles (site architecture §2.4 rule 4).
  return { title: directoryTitle(page), ...canonical(directoryHref(page, "name")) };
}

export default async function DirectoryPageN({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = pageNumber((await params).n);
  if (!page) notFound();
  const sort = parseDirectorySort((await searchParams).sort);
  // /page/1/ moves permanently to the base URL (site architecture §2.4 rule 4).
  if (page === 1) permanentRedirect(sort === "name" ? DIRECTORY_PATH : directoryHref(1, sort));
  const data = await listDirectory({ page, sort });
  if (!data) notFound();
  return <DirectoryView data={data} />;
}

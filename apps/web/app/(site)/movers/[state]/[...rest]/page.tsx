import { RESERVED_CITY_SLUGS } from "@amc/server/seo";
import { stateBySlug } from "@amc/server/geo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { loadPage, normalizeSegment, pageOrNotFound, stateSlugOrRedirect, trailFor } from "@/components/seo/load";
import { seoMetadata } from "@/components/seo/seo-metadata";
import { SeoPageView } from "@/components/seo/seo-page";

type Params = Promise<{ state: string; rest: string[] }>;

/**
 * City (/movers/{state}/{city}/) and ZIP (/movers/{state}/{city}/{zip}/) pages. Anything deeper,
 * a reserved word, or an unpublished page is a 404 (site architecture §2.2, §4.2).
 */
function resolve(stateSeg: string, rest: string[]): { url: string; stateSlug: string; citySlug: string; zip: string | null } | null {
  const stateSlug = stateSlugOrRedirect(stateSeg, rest);
  if (rest.length < 1 || rest.length > 2) return null;
  const citySlug = normalizeSegment(rest[0]!, (s) => `/movers/${stateSlug}/${s}/${rest[1] ? `${rest[1]}/` : ""}`);
  if (RESERVED_CITY_SLUGS.has(citySlug) || !stateBySlug(stateSlug)) return null;
  const zip = rest[1] ?? null;
  if (zip !== null && !/^\d{5}$/.test(zip)) return null;
  return { url: `/movers/${stateSlug}/${citySlug}/${zip ? `${zip}/` : ""}`, stateSlug, citySlug, zip };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { state, rest } = await params;
  const target = resolve(state, rest);
  const page = target ? await loadPage(target.url) : null;
  return page ? seoMetadata(page) : { title: "Page not found", robots: { index: false, follow: false } };
}

export default async function LocationPage({ params }: { params: Params }) {
  await connection();
  const { state, rest } = await params;
  const target = resolve(state, rest);
  if (!target) notFound();
  const page = await pageOrNotFound(target.url);
  const stateInfo = stateBySlug(target.stateSlug)!;
  const ancestors = [{ label: stateInfo.name, href: `/movers/${target.stateSlug}/` }];
  if (target.zip) ancestors.push({ label: page.h1.replace(/^Movers in ZIP code \d{5}, /, ""), href: `/movers/${target.stateSlug}/${target.citySlug}/` });
  const crumbs = await trailFor(page, ancestors, { label: "Movers", href: "/movers/" });
  return <SeoPageView page={page} crumbs={crumbs} />;
}

import { notFound } from "next/navigation";

/**
 * City, long-distance and deeper location pages (site architecture §1.2, §4.1). Their gates need a
 * facts registry, demand and cost data and a named reviewer that don't exist yet, so every such
 * URL is unpublished: 404 (§2.5, §4.2). evaluateCityPage in @amc/server/geo-pages reports why.
 */
export default function UnpublishedLocationPage(): never {
  notFound();
}

/**
 * The structured content stored in seo_pages.content (migration 170). Templates render these
 * sections verbatim; nothing is composed at render time, so what the reviewer approved is what
 * the visitor sees. Text may carry inline links written as [label](/path/) or [label](https://…).
 */
import type { SeoFamily, SeoStatus } from "./slugs";

export interface SourceRef {
  label: string;
  url: string;
  /** ISO date the source was read. */
  accessedOn: string;
}

/** One dated, page-specific data point shown in the first-screen answer (site architecture §3.3 rule 4). */
export interface DataPoint {
  label: string;
  value: string;
  /** Where the figure comes from ("GeoNames ZIP data", "AMC network coverage, 2026-10-28"). */
  basis: string;
  sourceUrl?: string;
}

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; caption?: string; columns: string[]; rows: string[][] }
  | { type: "facts"; items: { claim: string; source: SourceRef }[] }
  | { type: "note"; text: string }
  | { type: "cost"; block: CostBlock }
  | { type: "movers"; heading?: string; items: MoverItem[]; paidLine: boolean };

export interface CostBlock {
  /** Scope words that appear wherever the range appears ("a 2-bedroom home, local move within Texas"). */
  scope: string;
  moveType: "local" | "intrastate" | "interstate";
  band: string | null;
  rows: { homeSize: string; low: string; high: string; movers: number }[];
  asOf: string;
  modelVersion: string;
  /** The honest reason when there is no range. */
  noData?: string;
}

export interface MoverItem {
  slug: string;
  name: string;
  basedIn: string | null;
  /** "Local moves in Travis County" — what the rule says, in words. */
  coverageNote: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  blocks: ContentBlock[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  href: string;
  label: string;
  relation: string;
}

export interface RelatedGroup {
  heading: string;
  links: RelatedLink[];
}

export interface QuoteEntry {
  entry: "household";
  originZip?: string;
  destZip?: string;
  heading: string;
  text: string;
  cta: string;
}

export interface SeoContent {
  version: 1;
  intro: { answer: string; dataPoints: DataPoint[] };
  sections: ContentSection[];
  faq: FaqItem[];
  related: RelatedGroup[];
  quote: QuoteEntry;
  /** Article pages name the kind of content; geo pages are WebPage/CollectionPage. */
  schemaType: "WebPage" | "CollectionPage" | "Article";
  /** Attribution lines the page must show (dataset credits). */
  credits: string[];
  /** When the facts and counts were computed (ISO date), shown as "Data as of". */
  dataAsOf: string;
}

export interface SeoPageRecord {
  id: string;
  url: string;
  slug: string;
  family: SeoFamily;
  stateCode: string | null;
  cityId: number | null;
  zip: string | null;
  routeId: number | null;
  primaryKeyword: string;
  intent: string;
  supportingKeywords: string[];
  parentUrl: string | null;
  title: string;
  metaDescription: string;
  h1: string;
  status: SeoStatus;
  indexable: boolean;
  content: SeoContent;
  contentHash: string;
  uniqueShare: number | null;
  evidenceCount: number;
  sources: SourceRef[];
  mediaIds: string[];
  blockedReason: string | null;
  gateResults: Record<string, { passed: boolean; detail: string }>;
  reviewedBy: string | null;
  lastReviewedAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
  canonicalUrl: string;
}

/** A media asset as apps/web/content/media/manifest.json lists it. */
export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  credit?: string;
  tags: string[];
  usedOn?: string[];
  placeholder?: string;
}

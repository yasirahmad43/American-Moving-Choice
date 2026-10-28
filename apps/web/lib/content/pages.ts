import "server-only";

/**
 * Content pages from content/pages/**\/*.md (build plan §8, §12), read from the monorepo root at
 * build time. Every route that uses them is statically generated, so production serves the HTML
 * built here; next.config's outputFileTracingIncludes also ships the Markdown with server bundles.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { CONTENT_RENDER_MODE } from "@/lib/review-mode";
import { storedText } from "@/lib/stored-texts";
import { parseFrontMatter } from "./front-matter";
import { renderMarkdown, type RenderStats } from "./markdown";
import { createTokenResolver, resolveTokensInText, type RawTokens, type TokenValue } from "./tokens";

export interface ContentFrontMatter {
  id: string;
  url: string;
  family: string;
  title: string;
  meta_description: string;
  h1: string;
  breadcrumb: string;
  schema: string[];
  status: string;
  author: string | null;
  reviewer: string | null;
  data_owner: string | null;
  ai_assisted: boolean;
  ai_role: string | null;
  depends_on: string[];
  last_updated: string | null;
}

export interface ContentPage {
  /** Path relative to content/pages, e.g. "trust/how-amc-makes-money.md". */
  file: string;
  meta: ContentFrontMatter;
  /** Title, description, H1 and breadcrumb labels with tokens resolved (plain text). */
  title: string;
  description: string;
  h1: string;
  breadcrumbs: { label: string; href: string }[];
  /** Named people, or null while pending. */
  author: string | null;
  reviewer: string | null;
  dataOwner: string | null;
  html: string;
  stats: RenderStats;
}

/**
 * Routes other slices own (build plan §11). The catch-all never serves these, even when a draft
 * exists for them (the moving cost calculator's interface copy is rendered by slice S3).
 */
const RESERVED_PREFIXES = ["/get-quotes/", "/my-request/", "/directory/", "/companies/", "/movers/", "/verify-a-mover/"];
/** S3 owns the calculator page itself; its method page (/moving-cost-calculator/method/) is served here. */
const RESERVED_EXACT = ["/moving-cost-calculator/"];

export function isReservedUrl(url: string): boolean {
  return RESERVED_EXACT.includes(url) || RESERVED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/** "[Label]" link placeholders in stored texts, by label (content/stored-texts.md). */
export const LINK_LABELS: Record<string, string> = {
  "How AMC makes money": "/advertising-disclosure/",
  "How we verify movers": "/how-we-verify-movers/",
  "How this list is ordered": "/directory/",
  "How this range is calculated": "/moving-cost-calculator/method/",
};

function contentDir(): string {
  // apps/web is the working directory in dev, build and start; the monorepo root holds content/.
  const candidates = [path.join(process.cwd(), "..", "..", "content"), path.join(process.cwd(), "content")];
  const found = candidates.find((candidate) => existsSync(path.join(candidate, "pages")));
  if (!found) throw new Error("content/pages not found");
  return found;
}

function listMarkdown(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) return listMarkdown(path.join(dir, entry.name), relative);
      return entry.isFile() && entry.name.endsWith(".md") ? [relative] : [];
    })
    .sort();
}

const asString = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));
const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(asString) : value ? [asString(value)] : []);

let resolverCache: ((key: string) => TokenValue) | undefined;

/** The token resolver for content pages: tokens.json plus the S1 rules in tokens.ts. */
export function contentTokenResolver(): (key: string) => TokenValue {
  if (!resolverCache) {
    const raw = JSON.parse(readFileSync(path.join(contentDir(), "tokens.json"), "utf8")) as RawTokens;
    resolverCache = createTokenResolver(raw, {
      storedText: (key) => {
        try {
          return storedText(key);
        } catch {
          return null;
        }
      },
    });
  }
  return resolverCache;
}

/** Resolves a token for TSX pages (static pages use the same values as Markdown pages). */
export function token(key: string): TokenValue {
  return contentTokenResolver()(key);
}

/** "Home › Moving costs › How movers charge" with hrefs taken from the URL's ancestors. */
function breadcrumbsFor(trail: string, url: string, resolve: (key: string) => TokenValue): { label: string; href: string }[] {
  const labels = trail
    .split("›")
    .map((label) => resolveTokensInText(label.trim(), resolve))
    .filter(Boolean);
  const segments = url.split("/").filter(Boolean);
  const prefixes = ["/", ...segments.map((_, index) => `/${segments.slice(0, index + 1).join("/")}/`)];
  if (labels.length === prefixes.length) return labels.map((label, index) => ({ label, href: prefixes[index]! }));
  // Trail and URL depth differ: link only Home and the page itself.
  return labels.map((label, index) => ({ label, href: index === 0 ? "/" : index === labels.length - 1 ? url : "" })).filter((item) => item.href);
}

/** A named person from a front-matter value, or null while it is still a token or empty. */
function person(value: unknown, resolve: (key: string) => TokenValue): string | null {
  const text = asString(value).trim();
  if (!text || text === "n/a") return null;
  if (/\{\{/.test(text)) {
    const resolved = resolveTokensInText(text, resolve);
    return /pending/i.test(resolved) ? null : resolved;
  }
  return text;
}

function loadPage(dir: string, file: string): ContentPage {
  const source = readFileSync(path.join(dir, "pages", file), "utf8");
  const parsed = parseFrontMatter(source);
  if (parsed.repaired) console.warn(`[content] content/pages/${file}: front matter is invalid YAML (unescaped quotes); rendered from a repaired copy. Fix the file.`);
  const data = parsed.data as Record<string, unknown>;
  const resolve = contentTokenResolver();
  const meta: ContentFrontMatter = {
    id: asString(data.id),
    url: asString(data.url),
    family: asString(data.family),
    title: asString(data.title),
    meta_description: asString(data.meta_description),
    h1: asString(data.h1),
    breadcrumb: asString(data.breadcrumb),
    schema: asList(data.schema),
    status: asString(data.status) || "draft",
    author: data.author == null ? null : asString(data.author),
    reviewer: data.reviewer == null ? null : asString(data.reviewer),
    data_owner: data.data_owner == null ? null : asString(data.data_owner),
    ai_assisted: data.ai_assisted === true,
    ai_role: data.ai_role == null ? null : asString(data.ai_role),
    depends_on: asList(data.depends_on),
    last_updated: data.last_updated == null ? null : asString(data.last_updated),
  };
  if (!/^\/([a-z0-9-]+\/)*$/.test(meta.url)) throw new Error(`content/pages/${file}: url must be lowercase, start and end with "/" (got "${meta.url}")`);
  const rendered = renderMarkdown(parsed.content, { resolveToken: resolve, linkLabels: LINK_LABELS, mode: CONTENT_RENDER_MODE });
  return {
    file,
    meta,
    title: resolveTokensInText(meta.title, resolve),
    description: resolveTokensInText(meta.meta_description, resolve),
    h1: resolveTokensInText(meta.h1, resolve),
    breadcrumbs: breadcrumbsFor(meta.breadcrumb || `Home › ${meta.h1}`, meta.url, resolve),
    author: person(meta.author, resolve),
    reviewer: person(meta.reviewer, resolve),
    dataOwner: person(meta.data_owner, resolve),
    html: rendered.html,
    stats: rendered.stats,
  };
}

let pagesCache: ContentPage[] | undefined;

/** Every content page, sorted by file. Throws on duplicate URLs. */
export function allContentPages(): ContentPage[] {
  if (pagesCache && process.env.NODE_ENV === "production") return pagesCache;
  const dir = contentDir();
  const pages = listMarkdown(path.join(dir, "pages")).map((file) => loadPage(dir, file));
  const seen = new Map<string, string>();
  for (const page of pages) {
    const other = seen.get(page.meta.url);
    if (other) throw new Error(`content/pages: ${page.file} and ${other} share the url ${page.meta.url}`);
    seen.set(page.meta.url, page.file);
  }
  pagesCache = pages;
  return pages;
}

/** Pages the catch-all route serves: everything except URLs other slices own. */
export function servedContentPages(): ContentPage[] {
  return allContentPages().filter((page) => !isReservedUrl(page.meta.url));
}

export function contentPageByUrl(url: string): ContentPage | null {
  return allContentPages().find((page) => page.meta.url === url) ?? null;
}

import "server-only";

/**
 * The calculator page's drafted copy (content/pages/costs/moving-cost-calculator.md): front matter,
 * the intro above the widget and the sections below it, rendered to sanitized HTML. Tokens render
 * from content/tokens.json ("pending" when null); review markers ([Counsel: …], [Build: …] and the
 * rest) render as visible review notes, as build plan §8 asks of every preview page.
 *
 * Kept local to the calculator so this slice doesn't depend on the content slice's renderer; the
 * widget's interface strings live in copy.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { publicTokenFallback } from "@/lib/content/markdown";
import { REVIEW_NOTES_IN_HTML } from "@/lib/review-mode";

function contentRoot(): string {
  const candidates = [path.join(process.cwd(), "..", "..", "content"), path.join(process.cwd(), "content")];
  const found = candidates.find((candidate) => existsSync(path.join(candidate, "tokens.json")));
  if (!found) throw new Error("content/ not found");
  return found;
}

let tokenCache: Record<string, string | null> | undefined;

/** Token values from content/tokens.json (keys starting with "_" are notes). */
export function contentTokens(): Record<string, string | null> {
  if (!tokenCache) {
    const raw = JSON.parse(readFileSync(path.join(contentRoot(), "tokens.json"), "utf8")) as Record<string, unknown>;
    tokenCache = Object.fromEntries(
      Object.entries(raw)
        .filter(([key, value]) => !key.startsWith("_") && (typeof value === "string" || value === null))
        .map(([key, value]) => [key, value as string | null]),
    );
  }
  return tokenCache;
}

/** One token's value, or null when pending or unknown. */
export function token(key: string): string | null {
  return contentTokens()[key] ?? null;
}

const PENDING = "[pending]";

/** Replaces {{token}} with its value; pending tokens render a visible placeholder (review builds) or a public-safe phrase. */
export function renderTokens(text: string, overrides: Record<string, string> = {}): string {
  return text.replace(/\{\{([a-z0-9_.-]+)\}\}/gi, (_m, key: string) => overrides[key] ?? token(key) ?? (REVIEW_NOTES_IN_HTML ? PENDING : publicTokenFallback(key)));
}

const MARKER = /\[(Counsel|Owner|Data owner|Data|Verify|Build):/;

/** Splits out review markers (balanced square brackets), replacing each with a placeholder. */
function extractMarkers(markdown: string): { text: string; markers: string[] } {
  const markers: string[] = [];
  let out = "";
  let i = 0;
  while (i < markdown.length) {
    const rest = markdown.slice(i);
    const match = MARKER.exec(rest);
    if (!match || match.index === undefined) {
      out += rest;
      break;
    }
    out += rest.slice(0, match.index);
    let depth = 0;
    let j = i + match.index;
    for (; j < markdown.length; j++) {
      if (markdown[j] === "[") depth++;
      else if (markdown[j] === "]" && --depth === 0) break;
    }
    markers.push(markdown.slice(i + match.index + 1, j));
    out += `@@REVIEWNOTE${markers.length - 1}@@`;
    i = j + 1;
  }
  return { text: out, markers };
}

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Markdown to sanitized HTML, with markers as review notes. */
export function renderMarkdown(markdown: string, overrides: Record<string, string> = {}): string {
  const { text, markers } = extractMarkers(markdown);
  const html = String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .processSync(renderTokens(text, overrides)),
  );
  return html.replace(/@@REVIEWNOTE(\d+)@@/g, (_m, n: string) => {
    if (!REVIEW_NOTES_IN_HTML) return "";
    const note = renderTokens(markers[Number(n)] ?? "", overrides);
    return `<span class="review-note" data-review-note="">Review note: ${escapeHtml(note)}</span>`;
  });
}

export interface CalculatorPageContent {
  title: string;
  metaDescription: string;
  h1: string;
  status: string;
  /** The answer and notes under the H1, as HTML. */
  introHtml: string;
  /** The sections after the widget, as HTML. */
  outroHtml: string;
}

let pageCache: CalculatorPageContent | undefined;

/** Strips YAML-style trailing comments that gray-matter keeps in quoted titles' lines. */
const clean = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export function calculatorPageContent(): CalculatorPageContent {
  if (pageCache) return pageCache;
  const file = readFileSync(path.join(contentRoot(), "pages", "costs", "moving-cost-calculator.md"), "utf8");
  const { data, content } = matter(file);
  const start = content.indexOf("<!-- calculator-widget:start -->");
  const end = content.indexOf("<!-- calculator-widget:end -->");
  if (start < 0 || end < 0) throw new Error("moving-cost-calculator.md: widget markers not found");
  // The intro: everything between the H1 and the widget.
  const intro = content.slice(0, start).replace(/^\s*#\s+.*$/m, "");
  const outro = content.slice(end + "<!-- calculator-widget:end -->".length);
  pageCache = {
    title: clean(data.title),
    metaDescription: renderTokens(clean(data.meta_description)),
    h1: clean(data.h1),
    status: clean(data.status),
    introHtml: renderMarkdown(intro),
    outroHtml: renderMarkdown(outro),
  };
  return pageCache;
}

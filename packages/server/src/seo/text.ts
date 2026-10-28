/**
 * Text helpers for the generator: deterministic phrasing variants (seeded by the page slug, so a
 * regeneration is stable), number formatting, the plain text of a content record, its SHA-256,
 * and the 5-word shingle uniqueness check (site architecture §4.1 G7).
 */
import { createHash } from "node:crypto";
import type { ContentBlock, SeoContent } from "./types";

export const sha256 = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

/** A small stable hash for variant selection. */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** One of several phrasings, chosen by the seed and a slot number so one page varies slot by slot. */
export function pick<T>(seed: number, slot: number, variants: readonly T[]): T {
  return variants[(seed + slot * 7919) % variants.length]!;
}

export const n = (value: number): string => value.toLocaleString("en-US");
export const miles = (value: number): string => `${n(Math.round(value))} miles`;
export const plural = (count: number, one: string, many = `${one}s`): string => `${n(count)} ${count === 1 ? one : many}`;

export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function blockText(block: ContentBlock): string {
  switch (block.type) {
    case "paragraph":
    case "note":
      return block.text;
    case "list":
      return block.items.join("\n");
    case "table":
      return [block.caption ?? "", block.columns.join(" "), ...block.rows.map((r) => r.join(" "))].join("\n");
    case "facts":
      return block.items.map((i) => i.claim).join("\n");
    case "cost":
      return [block.block.scope, ...block.block.rows.map((r) => `${r.homeSize} ${r.low} ${r.high}`), block.block.noData ?? ""].join("\n");
    case "movers":
      return block.items.map((i) => `${i.name} ${i.coverageNote}`).join("\n");
  }
}

/** The main-content text (intro, sections, FAQ), without link markup, credits or related modules. */
export function mainText(content: SeoContent): string {
  const parts = [content.intro.answer, ...content.intro.dataPoints.map((d) => `${d.label} ${d.value}`)];
  for (const section of content.sections) {
    parts.push(section.heading);
    for (const block of section.blocks) parts.push(blockText(block));
  }
  for (const item of content.faq) parts.push(item.question, item.answer);
  return parts.join("\n").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

const WORD = /[a-z0-9$%.,'-]+/g;

export function shingles(text: string, size = 5): Set<string> {
  const words = (text.toLowerCase().match(WORD) ?? []).map((w) => w.replace(/^[.,'-]+|[.,'-]+$/g, "")).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(" "));
  return out;
}

/**
 * Share of each page's shingles that appear on no other page in the set. Pages are keyed by URL;
 * `corpus` holds other pages' shingles (existing family pages) that count but aren't scored.
 */
export function uniqueShares(pages: Map<string, Set<string>>, corpus: Iterable<Set<string>> = []): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (set: Set<string>) => {
    for (const s of set) counts.set(s, (counts.get(s) ?? 0) + 1);
  };
  for (const set of pages.values()) bump(set);
  for (const set of corpus) bump(set);
  const out = new Map<string, number>();
  for (const [url, set] of pages) {
    if (!set.size) {
      out.set(url, 0);
      continue;
    }
    let unique = 0;
    for (const s of set) if (counts.get(s) === 1) unique++;
    out.set(url, unique / set.size);
  }
  return out;
}

/** Trims a sentence-ish description to the meta length without cutting a word. */
export function clampDescription(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[,;:]$/, "")}…`;
}

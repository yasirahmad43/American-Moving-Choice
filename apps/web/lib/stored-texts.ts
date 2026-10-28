import "server-only";

/**
 * Stored texts from content/stored-texts.md, read by key so every surface quotes the same record
 * and never paraphrases it (content/stored-texts.md, header). A text is the first blockquote after
 * its "### ST-…" heading. "[Label]" marks a link; callers map labels to URLs.
 *
 * This is the shell's minimal reader; the content slice may replace it with its renderer.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type StoredTextPart = { kind: "text"; text: string } | { kind: "link"; label: string };

let cache: Map<string, string> | undefined;

function contentFile(): string {
  // apps/web is the working directory in dev, build and start; the monorepo root holds content/.
  const candidates = [
    path.join(process.cwd(), "..", "..", "content", "stored-texts.md"),
    path.join(process.cwd(), "content", "stored-texts.md"),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("content/stored-texts.md not found");
  return found;
}

function load(): Map<string, string> {
  if (cache) return cache;
  const texts = new Map<string, string>();
  const lines = readFileSync(contentFile(), "utf8").split("\n");
  let key: string | null = null;
  let quote: string[] = [];
  const flush = () => {
    if (key && quote.length && !texts.has(key)) texts.set(key, quote.join(" ").replace(/\s+/g, " ").trim());
    quote = [];
  };
  for (const line of lines) {
    const heading = /^#{2,3}\s+(ST-\d+[a-z]?)\b/.exec(line);
    if (heading) {
      flush();
      key = heading[1]!;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flush();
      key = null;
      continue;
    }
    if (key && line.startsWith(">")) {
      quote.push(line.replace(/^>\s?/, ""));
    } else if (quote.length) {
      flush();
      key = null; // only the first blockquote under a heading is the text
    }
  }
  flush();
  cache = texts;
  return texts;
}

/** The stored text for a key such as "ST-1a", with markdown emphasis removed. */
export function storedText(key: string): string {
  const text = load().get(key);
  if (!text) throw new Error(`Stored text ${key} not found in content/stored-texts.md`);
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

/** The stored text split into plain runs and "[Label]" link placeholders. */
export function storedTextParts(key: string): StoredTextPart[] {
  const parts: StoredTextPart[] = [];
  const text = storedText(key);
  const pattern = /\[([^\]]+)\]/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) parts.push({ kind: "text", text: text.slice(last, match.index) });
    parts.push({ kind: "link", label: match[1]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

import "server-only";

/**
 * Content tokens and stored texts for the directory pages. Tokens come from content/tokens.json
 * (content/README.md §3); a null token renders a visible "pending" placeholder. Stored texts render
 * from content/stored-texts.md through the shell's reader, unchanged except for token values and
 * "[Label]" links mapped by the caller.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { storedTextParts } from "@/lib/stored-texts";

let tokenCache: Record<string, unknown> | undefined;

function loadTokens(): Record<string, unknown> {
  if (tokenCache) return tokenCache;
  const candidates = [path.join(process.cwd(), "..", "..", "content", "tokens.json"), path.join(process.cwd(), "content", "tokens.json")];
  const found = candidates.find((candidate) => existsSync(candidate));
  tokenCache = found ? (JSON.parse(readFileSync(found, "utf8")) as Record<string, unknown>) : {};
  return tokenCache;
}

/** A token's value as text, or null when it is pending. */
export function token(key: string): string | null {
  const value = loadTokens()[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

/** The badge name ({{badge.name}}), currently the working name marked as pending. */
export function badgeName(): string {
  return token("badge.name") ?? "[badge name pending]";
}

export interface LinkTarget {
  href: string;
  external?: boolean;
}

/**
 * Renders a stored text. `values` fills {{tokens}} (falling back to tokens.json, then a visible
 * pending marker); `links` maps each "[Label]" to a URL. A label without a target renders as text.
 */
export function StoredText({ id, values = {}, links = {} }: { id: string; values?: Record<string, ReactNode>; links?: Record<string, LinkTarget> }) {
  const parts = storedTextParts(id);
  const fill = (text: string, key: number): ReactNode[] => {
    const out: ReactNode[] = [];
    const pattern = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    let last = 0;
    let n = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      if (match.index > last) out.push(text.slice(last, match.index));
      const name = match[1]!;
      const value = name in values ? values[name] : token(name);
      out.push(<span key={`${key}-${n++}`}>{value ?? <span className="font-semibold">[{name} pending]</span>}</span>);
      last = match.index + match[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  };
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "text") return <span key={index}>{fill(part.text, index)}</span>;
        const target = links[part.label];
        if (!target) return <span key={index}>{part.label}</span>;
        return target.external ? (
          <a key={index} href={target.href} className="link" target="_blank" rel="noopener noreferrer">
            {part.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <Link key={index} href={target.href} className="link">
            {part.label}
          </Link>
        );
      })}
    </>
  );
}

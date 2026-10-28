/**
 * Front matter parsing for content drafts (content/README.md §2). Pure, for tests.
 */
import matter from "gray-matter";

/**
 * Re-quotes double-quoted YAML scalars that contain unescaped double quotes (a drafting slip that
 * makes the YAML invalid) as single-quoted scalars. Only used when the strict parse fails.
 */
export function repairFrontMatter(source: string): string {
  const end = source.indexOf("\n---", 4);
  if (!source.startsWith("---") || end < 0) return source;
  const head = source
    .slice(0, end)
    .split("\n")
    .map((line) => {
      const match = /^(\s*(?:- |[A-Za-z_]+:\s+(?:- )?))"(.*)"(\s*(?:#.*)?)$/.exec(line);
      if (!match || !match[2]!.includes('"')) return line;
      return `${match[1]}'${match[2]!.replaceAll('\\"', '"').replaceAll("'", "''")}'${match[3]}`;
    })
    .join("\n");
  return head + source.slice(end);
}

export interface ParsedFrontMatter {
  data: Record<string, unknown>;
  content: string;
  /** True when the strict parse failed and the repaired copy was used. */
  repaired: boolean;
}

export function parseFrontMatter(source: string): ParsedFrontMatter {
  try {
    // An options object turns off gray-matter's input cache, which keeps a half-parsed entry when
    // the YAML throws (the next call would then return empty data instead of failing).
    const parsed = matter(source, {});
    return { data: parsed.data as Record<string, unknown>, content: parsed.content, repaired: false };
  } catch (error) {
    try {
      const parsed = matter(repairFrontMatter(source), {});
      return { data: parsed.data as Record<string, unknown>, content: parsed.content, repaired: true };
    } catch {
      throw error;
    }
  }
}

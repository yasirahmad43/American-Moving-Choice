/**
 * Markdown renderer for content drafts (build plan §8; content/README.md §2, §3).
 *
 * Pure: no file access and no server-only import, so the unit tests can call it directly.
 *
 * - GitHub-flavored Markdown (tables, strikethrough, autolinks) via remark-gfm.
 * - Review markers ([Counsel: …], [Owner: …], [Owner and Counsel: …], [Data: …], [Data owner: …],
 *   [Verify: …], [Build: …]) become visible notes: <mark class="review-note review-note--counsel">.
 * - HTML comments (stored-text keys such as <!-- ST-1a -->) render nothing. Explicit anchors
 *   (<a id="badge"></a>) become the id of the heading that follows. Any other raw HTML renders as
 *   literal text; no HTML from the source reaches the page.
 * - {{tokens}} resolve through the caller's resolver; pending values render as a visible
 *   placeholder (<span class="token-pending">). Tokens inside code stay literal.
 * - Headings get ids (rehype-slug, explicit anchors win) and a "#" link. Tables sit in a
 *   focusable, labeled scroll region.
 * - The output is sanitized (rehype-sanitize, GitHub's schema plus the classes added here).
 */
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { TOKEN_PATTERN, type TokenValue } from "./tokens";

// ---------------------------------------------------------------- review markers

export type NoteKind = "counsel" | "owner" | "data" | "verify" | "build";

export const NOTE_KINDS: { kind: NoteKind; label: string; meaning: string }[] = [
  { kind: "counsel", label: "Counsel", meaning: "Legal wording or a legal question for counsel" },
  { kind: "owner", label: "Owner", meaning: "A default the owner hasn't approved yet" },
  { kind: "data", label: "Data", meaning: "A data block or method value waiting on data or the data owner" },
  { kind: "verify", label: "Verify", meaning: "A fact to confirm against its primary source" },
  { kind: "build", label: "Build", meaning: "Product behavior the build must make true and test" },
];

/** Marker prefixes, longest first so "Owner and Counsel" wins over "Owner". */
const MARKER_START = /^\[(Owner and Counsel|Owner and counsel|Owner and editorial|Owner and Editorial|Data owner|Counsel|Owner|Data|Verify|Build):\s*/;

function kindOf(label: string): NoteKind {
  const first = label.split(" ")[0]!.toLowerCase();
  return (["counsel", "owner", "data", "verify", "build"] as const).find((kind) => kind === first) ?? "owner";
}

/**
 * Index just past the "]" that closes the marker opened at `start`, or -1. Brackets inside
 * backtick code spans don't count; a blank line ends the search (markers never span paragraphs).
 */
function markerEnd(text: string, from: number): number {
  let depth = 1;
  let inCode = false;
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\n" && text[i + 1] === "\n") return -1;
    if (ch === "\\" && !inCode) {
      i += 1;
      continue;
    }
    if (ch === "`") inCode = !inCode;
    if (inCode) continue;
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Wraps markers in sentinel tags the remark plugin turns into <mark> elements. Nested markers work. */
function wrapMarkersInSegment(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "[") {
      const match = MARKER_START.exec(text.slice(i, i + 40));
      if (match) {
        const end = markerEnd(text, i + match[0].length);
        if (end > 0) {
          const label = match[1]!;
          const inner = wrapMarkersInSegment(text.slice(i + match[0].length, end - 1));
          out += `<amc-note kind="${kindOf(label)}" label="${label}">${inner}</amc-note>`;
          i = end;
          continue;
        }
      }
    }
    out += text[i];
    i += 1;
  }
  return out;
}

/** Applies marker wrapping outside fenced code blocks. */
export function wrapMarkers(source: string): string {
  const parts = source.split(/^(```[^\n]*\n[\s\S]*?^```[ \t]*$)/m);
  return parts.map((part, index) => (index % 2 === 1 ? part : wrapMarkersInSegment(part))).join("");
}

// ---------------------------------------------------------------- minimal tree types

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  title?: string | null;
  depth?: number;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown>; id?: string };
}

interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const NOTE_OPEN = /^<amc-note kind="([a-z]+)" label="([A-Za-z ]+)">$/;
const NOTE_CLOSE = /^<\/amc-note>$/;
const ANCHOR_OPEN = /^<a\s+id="([A-Za-z0-9_-]+)"\s*>$/i;
const ANCHOR_CLOSE = /^<\/a>$/i;
const COMMENT = /^<!--[\s\S]*-->$/;

function noteNode(kind: string, label: string): MdNode {
  return {
    type: "amcNote",
    // prose.css keeps .review-note out of sight until ?review=1 reveals it (lib/review-mode.ts).
    data: { hName: "mark", hProperties: { className: ["review-note", `review-note--${kind}`] } },
    children: [
      { type: "amcLabel", data: { hName: "span", hProperties: { className: ["review-note__label"] } }, children: [{ type: "text", value: `${label}:` }] },
      { type: "text", value: " " },
    ],
  };
}

export interface RenderStats {
  notes: Record<NoteKind, number>;
  pendingTokens: string[];
}

export interface RenderOptions {
  resolveToken: (key: string) => TokenValue;
  /** "[Label]" placeholders (from stored texts) that become links, by label. */
  linkLabels?: Record<string, string>;
  /** Drop the first level-1 heading (the page renders its H1 from front matter). Default true. */
  dropFirstH1?: boolean;
  /**
   * "review" (default) renders markers as hidden <mark class="review-note"> notes and pending
   * tokens as placeholders. "public" drops markers entirely and renders pending tokens as a
   * neutral public-safe phrase (production builds; see lib/review-mode.ts).
   */
  mode?: "review" | "public";
}

/** What a pending token says to the public: never "pending", never a placeholder box. */
export function publicTokenFallback(key: string): string {
  if (key.startsWith("page.")) return "the American Moving Choice team";
  if (/^(cost\.(hub|result|dataset)\.|company\.)/.test(key)) return "not yet available";
  return "to be announced";
}

/** remark plugin: notes, comments, anchors, tokens and label links. */
function remarkAmc(options: RenderOptions & { stats: RenderStats }) {
  const { resolveToken, linkLabels = {}, stats, dropFirstH1 = true, mode = "review" } = options;
  const publicMode = mode === "public";

  const splitText = (value: string): MdNode[] => {
    const nodes: MdNode[] = [];
    const pushText = (text: string) => {
      if (!text) return;
      let last = 0;
      for (const match of text.matchAll(TOKEN_PATTERN)) {
        if (match.index > last) nodes.push({ type: "text", value: text.slice(last, match.index) });
        const resolved = resolveToken(match[1]!);
        if (resolved.kind === "value") nodes.push({ type: "text", value: resolved.text });
        else {
          stats.pendingTokens.push(resolved.key);
          nodes.push(
            publicMode
              ? { type: "amcPending", data: { hName: "span", hProperties: { className: ["token-public"] } }, children: [{ type: "text", value: publicTokenFallback(resolved.key) }] }
              : { type: "amcPending", data: { hName: "span", hProperties: { className: ["token-pending"] } }, children: [{ type: "text", value: resolved.text }] },
          );
        }
        last = match.index + match[0].length;
      }
      if (last < text.length) nodes.push({ type: "text", value: text.slice(last) });
    };
    let last = 0;
    for (const match of value.matchAll(/\[([^[\]\n]{2,80})\]/g)) {
      const href = linkLabels[match[1]!];
      if (!href) continue;
      pushText(value.slice(last, match.index));
      nodes.push({ type: "link", url: href, title: null, children: [{ type: "text", value: match[1]! }] });
      last = match.index + match[0].length;
    }
    pushText(value.slice(last));
    return nodes;
  };

  const resolveUrl = (url: string) =>
    url.replace(TOKEN_PATTERN, (_m, key: string) => {
      const resolved = resolveToken(key);
      return resolved.kind === "value" ? resolved.text : "#";
    });

  /** Rebuilds a children list: wraps notes, drops comments, converts anchors and stray HTML. */
  const transformChildren = (children: MdNode[]): MdNode[] => {
    const out: MdNode[] = [];
    const stack: MdNode[] = [];
    // In public mode a note and everything inside it is dropped: the sink swallows its children.
    const target = () => (stack.length ? stack[stack.length - 1]!.children! : out);
    for (const node of children) {
      if (node.type === "html") {
        const value = (node.value ?? "").trim();
        const open = NOTE_OPEN.exec(value);
        if (open) {
          const kind = open[1] as NoteKind;
          stats.notes[kind] = (stats.notes[kind] ?? 0) + 1;
          stack.push(noteNode(kind, open[2]!));
          continue;
        }
        if (NOTE_CLOSE.test(value)) {
          const note = stack.pop();
          if (note && !publicMode) target().push(note);
          continue;
        }
        if (COMMENT.test(value) || ANCHOR_CLOSE.test(value)) continue;
        const anchor = ANCHOR_OPEN.exec(value);
        if (anchor) {
          target().push({ type: "amcAnchor", data: { hName: "span", hProperties: { id: anchor[1] } }, children: [] });
          continue;
        }
        // Any other raw HTML shows as text, never as markup.
        target().push({ type: "text", value: node.value ?? "" });
        continue;
      }
      if (node.type === "text") {
        target().push(...splitText(node.value ?? ""));
        continue;
      }
      if ((node.type === "link" || node.type === "image" || node.type === "definition") && node.url) {
        node.url = resolveUrl(node.url);
      }
      if (node.children) node.children = transformChildren(node.children);
      target().push(node);
    }
    // An unclosed note keeps what it collected (and is dropped like any note in public mode).
    while (stack.length) {
      const note = stack.pop()!;
      if (!publicMode) target().push(note);
    }
    return out;
  };

  /** Moves a lone anchor's id onto the heading after it; a lone anchor elsewhere becomes a div. */
  const placeAnchors = (children: MdNode[]): MdNode[] => {
    const out: MdNode[] = [];
    for (let i = 0; i < children.length; i += 1) {
      const node = children[i]!;
      const only = node.type === "paragraph" && node.children?.length === 1 ? node.children[0]! : null;
      if (only?.type === "amcAnchor") {
        const id = only.data!.hProperties!.id as string;
        const next = children[i + 1];
        if (next?.type === "heading") {
          next.data = { ...next.data, hProperties: { ...next.data?.hProperties, id } };
          continue;
        }
        out.push({ type: "amcAnchor", data: { hName: "div", hProperties: { id } }, children: [] });
        continue;
      }
      if (node.children && node.type !== "paragraph") node.children = placeAnchors(node.children);
      out.push(node);
    }
    return out;
  };

  return (tree: MdNode) => {
    tree.children = transformChildren(tree.children ?? []);
    tree.children = placeAnchors(tree.children);
    let droppedH1 = !dropFirstH1;
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading" && node.depth === 1) {
        if (!droppedH1) {
          droppedH1 = true;
          return false;
        }
        node.depth = 2; // one H1 per page
      }
      return true;
    });
  };
}

// ---------------------------------------------------------------- rehype: anchors and tables

function textOf(node: HNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

function rehypeAmc() {
  const visit = (node: HNode) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type !== "element") return child;
      if (child.tagName === "table") {
        return {
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrap"], role: "region", tabIndex: 0, ariaLabel: "Table (scrolls sideways on small screens)" },
          children: [child],
        };
      }
      if (/^h[2-4]$/.test(child.tagName ?? "") && typeof child.properties?.id === "string") {
        const label = textOf(child).trim();
        visit(child);
        child.children = [
          ...(child.children ?? []),
          { type: "text", value: " " },
          {
            type: "element",
            tagName: "a",
            properties: { href: `#${child.properties.id}`, className: ["heading-anchor"], ariaLabel: `Link to this section: ${label}` },
            children: [{ type: "text", value: "#" }],
          },
        ];
        return child;
      }
      visit(child);
      return child;
    });
  };
  return (tree: HNode) => visit(tree);
}

// ---------------------------------------------------------------- sanitize schema

const schema: SanitizeSchema = {
  ...defaultSchema,
  // Keep explicit ids exactly ("#badge" links must work); still prefix `name`.
  clobber: ["name"],
  clobberPrefix: "user-content-",
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    mark: [["className", "review-note", /^review-note--(counsel|owner|data|verify|build)$/]],
    span: [["className", "review-note__label", "token-pending", "token-public"]],
    div: [...(defaultSchema.attributes?.div ?? []), ["className", "table-wrap"], ["role", "region"], "ariaLabel", "tabIndex"],
    // One className rule per tag: the default's footnote class plus the heading anchor.
    a: [...(defaultSchema.attributes?.a ?? []).filter((rule) => !(Array.isArray(rule) && rule[0] === "className")), ["className", "heading-anchor", "data-footnote-backref"]],
  },
};

// ---------------------------------------------------------------- entry point

export interface RenderedMarkdown {
  html: string;
  stats: RenderStats;
}

export function renderMarkdown(source: string, options: RenderOptions): RenderedMarkdown {
  const stats: RenderStats = { notes: { counsel: 0, owner: 0, data: 0, verify: 0, build: 0 }, pendingTokens: [] };
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAmc as never, { ...options, stats })
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAmc as never)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .processSync(wrapMarkers(source));
  return { html: String(file), stats };
}

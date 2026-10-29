import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { LineIcon } from "@amc/ui";
import { MediaCreditLine, MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media";
import { chapterKind, htmlChapterParts, storyIcon, storyImageAt, storyNextItems, type StoryKind, type StoryStep } from "@/lib/content/story-plan";
import { storyCaption } from "@/lib/content/story-captions";
import { adaptiveReactTables } from "./adaptive-react-tables";
import { StoryActionLink } from "./story-action-link";
import "./story-sections.css";

interface Chapter { key: string; content: ReactNode; heading?: string; headingContent?: ReactNode; kind?: StoryKind; compactLists?: boolean }

/** Editorial scaffolding is metadata, not a paragraph in the reader's narrative. */
export function separateEditorialNotes(html: string): { body: string; notes: string[] } {
  const notes: string[] = [];
  const body = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
    const text = paragraph.replace(/<[^>]+>/g, "").trim();
    if (/^(?:Edited|Written) by\b/i.test(text) && /Reviewed by|Data owner|First drafted with AI/i.test(text)) {
      notes.push(paragraph); return "";
    }
    return paragraph;
  });
  return { body, notes };
}

/** Keep the complete sanitized document, including its heading anchors, links and source notes. */
export function htmlChapters(html: string): Chapter[] {
  return htmlChapterParts(presentEditorialHtml(html)).map((part, index) => {
    const headingMatch = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(part);
    const heading = headingMatch?.[1]?.replace(/<a\b[^>]*class="[^"]*heading-anchor[^\"]*"[\s\S]*?<\/a>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    const body = headingMatch ? part.slice(0, headingMatch.index) + part.slice(headingMatch.index + headingMatch[0].length) : part;
    const listItems = [...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(item => item[1]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return { key: String(index), heading, kind: chapterKind(part, heading),
      compactLists: listItems.length > 1 && listItems.every(item => item.length <= 160),
      headingContent: headingMatch ? <div className="prose story-chapter-title" dangerouslySetInnerHTML={{ __html: headingMatch[0] }} /> : undefined,
      content: <div className="prose story-prose" dangerouslySetInnerHTML={{ __html: body }} /> };
  });
}

/** A missing value is a status in its named field, not a fragment of a generated sentence. */
function availableField(value: string): string {
  const shown = value.replace(/not yet available|data pending|\[pending[^\]]*\]/gi, "Not available");
  return shown === value ? value : shown.trim();
}

function planningLabelFields(original: string): string {
  // Limit the rewrite to the single-paragraph result-label specimen. Other quoted guidance
  // and disclaimers remain untouched; any real values in parsed fields are retained.
  const paragraph = /^<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>$/i.exec(original);
  if (!paragraph || !/Planning range, not a quote:/i.test(paragraph[1]!) || !/not yet available|data pending|\[pending[^\]]*\]/i.test(paragraph[1]!)) return original;
  const label = paragraph[1]!.replace(/<\/?strong\b[^>]*>/gi, "");
  const fields = /Planning range, not a quote:\s*([\s\S]*?)\s+for\s+([\s\S]*?)\.\s*Based on\s+([\s\S]*?);\s*data as of\s+([\s\S]*?);\s*model\s+([\s\S]*?)\.(?=\s*(?:<a\b|$))/i.exec(label);
  if (!fields) return original;
  const labels = ["Planning range", "Move and area", "Rate-card sources and sample", "Data as of", "Calculation model"];
  const cells = labels.map((name, index) => `<div class="rounded-control bg-surface-2 p-4" data-content-inset="compact"><dt class="type-small font-semibold text-text-2">${name}</dt><dd class="mt-1 text-base font-bold text-text">${availableField(fields[index + 1]!)}</dd></div>`).join("");
  // Anchors or explanatory links outside the specimen sentence retain their original markup.
  const before = label.slice(0, fields.index), after = label.slice(fields.index + fields[0].length);
  return `<div class="planning-availability" data-content-inset="card">${before}<p class="planning-availability-kicker">Understanding the estimate</p><h3>What a complete planning range identifies</h3><p><strong>Planning range, not a quote.</strong> A useful range names the move it covers and the data behind it. These reference fields explain the label; they are not a calculated result for your move.</p><dl class="mt-4 grid gap-3 sm:grid-cols-2">${cells}</dl>${after.trim() ? `<p class="mt-4">${after}</p>` : ""}</div>`;
}

/** Present missing reference data coherently while retaining records, sources and real values. */
export function presentEditorialHtml(html: string): string {
  const available = html.replace(/<div class="table-wrap"[^>]*>\s*<table\b[^>]*>[\s\S]*?<\/table>\s*<\/div>/gi, (original) => {
    const table = original.replace(/(<td\b[^>]*>)([\s\S]*?)(<\/td>)/gi, (_cell, open: string, value: string, close: string) => `${open}${availableField(value)}${close}`);
    const unavailable = original.match(/not yet available|data pending|\[pending[^\]]*\]/gi) ?? [];
    if (unavailable.length < 3 || !/planning range|what the range covers|sample size/i.test(original) || /[$£€]\s*\d/.test(original)) return table;
    return `<div class="planning-availability" data-content-inset="card"><p class="planning-availability-kicker">Rate information</p><h3>A useful range needs enough recent data.</h3><p>No supported price range is provided in this reference table. Its columns show the information a published range needs: the move it covers, the range, its source, the sample size and the data date. A field marked “Not available” has no verified value here.</p><a class="link" href="/moving-cost-calculator/">Check a planning range for your move</a><details><summary>View every reference row and its availability</summary>${table}</details></div>`;
  });
  const usedLabels = new Set([...available.matchAll(/\baria-label\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]));
  let formulaNumber = 0;
  const formulas = available.replace(/<pre(\s[^>]*)?>/gi, (original, attributes = "") => {
    if (/\btabindex\s*=/i.test(attributes)) return original;
    let additions = ' tabindex="0"';
    if (!/\brole\s*=/i.test(attributes)) additions += ' role="region"';
    if (!/\baria-(?:label|labelledby)\s*=/i.test(attributes)) {
      let label: string;
      do { label = `Formula or worked example ${++formulaNumber}`; } while (usedLabels.has(label));
      usedLabels.add(label);
      additions += ` aria-label="${label}"`;
    }
    return `<pre${attributes}${additions}>`;
  });
  return formulas.replace(/<blockquote>[\s\S]*?<\/blockquote>/gi, planningLabelFields);
}

function nodesOf(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((node) => isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? nodesOf(node.props.children) : [node]);
}

/** TSX trust/help/legal content uses the same chapters, without converting React to HTML. */
export function reactChapters(children: ReactNode): Chapter[] {
  const chapters: { key: string; nodes: ReactNode[]; heading?: string }[] = [];
  for (const node of nodesOf(adaptiveReactTables(children))) {
    const heading = isValidElement<{ children?: ReactNode }>(node) && node.type === "h2" ? node : null;
    if (heading || !chapters.length) chapters.push({ key: String(chapters.length), nodes: [], heading: heading && typeof heading.props.children === "string" ? heading.props.children : undefined });
    chapters[chapters.length - 1]!.nodes.push(node);
  }
  return chapters.map(({ nodes, ...chapter }) => {
    const data = nodes.some(node => isValidElement<{ rows?: unknown; columns?: unknown; "data-column-count"?: number }>(node) && (node.type === "table" || node.props["data-column-count"] || Array.isArray(node.props.rows) && Array.isArray(node.props.columns)));
    const list = nodes.some(node => isValidElement(node) && (node.type === "ol" || node.type === "ul"));
    const kind = data ? "data" : /sources|related pages/i.test(chapter.heading ?? "") ? "sources" : list ? "checklist" : "narrative";
    const headingNode = nodes.find(node => isValidElement(node) && node.type === "h2");
    return { ...chapter, kind: kind as StoryKind,
      headingContent: headingNode ? <div className="prose story-chapter-title">{headingNode}</div> : undefined,
      content: <div className="prose story-prose">{nodes.filter(node => node !== headingNode)}</div> };
  });
}

export function StoryPhoto({ asset, className = "", caption }: { asset: MediaAsset; className?: string; caption?: string }) {
  const label = caption?.trim();
  return <figure className={`story-photo ${className}`} data-page-photo={asset.id}>
    <MediaFrame asset={asset} sizes="(min-width: 1100px) 38vw, (min-width: 720px) 46vw, 100vw" />
    {label ? <figcaption><span aria-hidden="true" className="story-photo-line" />{label}</figcaption> : null}
    <MediaCreditLine asset={asset} className="story-credit" />
  </figure>;
}

export function StorySections({ chapters, images, planned = false, url, topic }: { chapters: Chapter[]; images: readonly (MediaAsset | null)[]; planned?: boolean; url?: string; topic?: string }) {
  return <div className="story-chapters">{chapters.map((chapter, index) => {
    const image = storyImageAt(images, index, planned);
    const caption = storyCaption({ heading: chapter.heading, url, topic });
    return <section key={chapter.key}
    className={`story-chapter story-chapter-${index % 4} story-chapter-${chapter.kind ?? "narrative"}${!chapter.headingContent ? " story-chapter-intro" : ""}${chapter.compactLists ? " story-chapter-compact-list" : ""}`} data-content-inset="card" data-story-chapter="" data-motion="rise">
    <header className="story-chapter-header">
      <div className="story-chapter-heading"><div className="story-chapter-marker" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><i /><LineIcon name={storyIcon(chapter.heading, chapter.kind)} size={21} /></div>{chapter.headingContent ?? (caption ? <p className="story-chapter-context">{caption}</p> : null)}</div>
      {image ? <div className="story-chapter-visual"><StoryPhoto asset={image} /></div> : null}
    </header>
    <div className="story-chapter-copy">{chapter.content}</div>
  </section>;
  })}</div>;
}

/** Short pages still carry five distinct, useful editorial photographs. */
export function StoryNextSteps({ items, images = [], usedCount = 0, url }: { items?: readonly StoryStep[]; images?: readonly MediaAsset[]; usedCount?: number; url?: string }) {
  const steps = storyNextItems({ items, images, usedCount, url });
  if (!steps.length) return null;
  return <section className="story-next" aria-labelledby="story-next-title">
    <div className="story-next-heading" data-motion="rise"><p className="type-overline text-brand-red">Your next chapter</p><h2 id="story-next-title">A little planning.<br /><span>A better start.</span></h2><p>Turn what you've learned into your next step.</p></div>
    <div className="story-next-grid" data-motion="stagger">{steps.map((step) => <article className="story-next-card" key={step.image.id}><StoryPhoto asset={step.image} caption={step.title} /><div data-content-inset="card"><h3>{step.title}</h3><p>{step.text}</p>{step.href.startsWith("#")
      ? <a href={step.href}>{step.action ?? step.title} <span aria-hidden="true">↑</span></a>
      : <StoryActionLink href={step.href} label={step.action ?? step.title} />}</div></article>)}</div>
  </section>;
}

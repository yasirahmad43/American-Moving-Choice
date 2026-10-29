import { Children, Fragment, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { LineIcon } from "@amc/ui";
import { MediaCreditLine, MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media";
import { chapterKind, htmlChapterParts, storyIcon, storyImageAt, storyNextItems, type StoryKind, type StoryStep } from "@/lib/content/story-plan";
import "./story-sections.css";

interface Chapter { key: string; content: ReactNode; heading?: string; kind?: StoryKind }

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
    const heading = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(part)?.[1]?.replace(/<a\b[^>]*class="[^"]*heading-anchor[^\"]*"[\s\S]*?<\/a>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    return { key: String(index), heading, kind: chapterKind(part, heading), content: <div className="prose story-prose" dangerouslySetInnerHTML={{ __html: part }} /> };
  });
}

/** The draft example is retained in full, with an approachable explanation of its fields. */
export function presentEditorialHtml(html: string): string {
  const available = html.replace(/<div class="table-wrap"[^>]*>\s*<table>[\s\S]*?<\/table>\s*<\/div>/gi, (original) => {
    const unavailable = original.match(/not yet available|data pending|\[pending[^\]]*\]/gi) ?? [];
    if (unavailable.length < 3 || !/planning range|what the range covers|sample size/i.test(original) || /[$£€]\s*\d/.test(original)) return original;
    return `<div class="planning-availability"><p class="planning-availability-kicker">Rate information</p><h3>A useful range needs enough recent data.</h3><p>This reference table does not currently include a supported price range. A mover can give you a written estimate for the details of your move; our calculator shows a planning range only when enough qualifying rate cards are available.</p><a class="link" href="/moving-cost-calculator/">Check a planning range for your move</a><details><summary>See every reference field and its availability</summary>${original}</details></div>`;
  });
  return available.replace(/<pre(\s[^>]*)?>/gi, (original, attributes = "") => /\btabindex=/i.test(attributes) ? original : `<pre${attributes} tabindex="0" role="region" aria-label="Formula or worked example (scroll sideways if needed)">`).replace(/<blockquote>[\s\S]*?<\/blockquote>/gi, (original) => {
    if (!/Planning range, not a quote:/i.test(original) || !/not yet available/i.test(original)) return original;
    return `<div class="planning-availability"><p class="planning-availability-kicker">Understanding the estimate</p><h3>A planning range comes with its context.</h3><p>Read the move, the area, the sources and the date together. A planning range is a guide; the moving company provides your actual quote.</p><div class="planning-availability-fields"><span><b>01</b> Your move &amp; area</span><span><b>02</b> Rate-card sources</span><span><b>03</b> Data date</span><span><b>04</b> Calculation method</span></div><details><summary>Read the complete example label</summary>${original}</details></div>`;
  });
}

function nodesOf(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((node) => isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? nodesOf(node.props.children) : [node]);
}

/** TSX trust/help/legal content uses the same chapters, without converting React to HTML. */
export function reactChapters(children: ReactNode): Chapter[] {
  const chapters: { key: string; nodes: ReactNode[]; heading?: string }[] = [];
  for (const node of nodesOf(children)) {
    const heading = isValidElement<{ children?: ReactNode }>(node) && node.type === "h2" ? node : null;
    if (heading || !chapters.length) chapters.push({ key: String(chapters.length), nodes: [], heading: heading && typeof heading.props.children === "string" ? heading.props.children : undefined });
    chapters[chapters.length - 1]!.nodes.push(node);
  }
  return chapters.map(({ nodes, ...chapter }) => {
    const data = nodes.some(node => isValidElement<{ rows?: unknown; columns?: unknown }>(node) && (node.type === "table" || Array.isArray(node.props.rows) && Array.isArray(node.props.columns)));
    const list = nodes.some(node => isValidElement(node) && (node.type === "ol" || node.type === "ul"));
    const kind = data ? "data" : /sources|related pages/i.test(chapter.heading ?? "") ? "sources" : list ? "checklist" : "narrative";
    return { ...chapter, kind: kind as StoryKind, content: <div className="prose story-prose">{nodes}</div> };
  });
}

export function StoryPhoto({ asset, className = "", caption }: { asset: MediaAsset; className?: string; caption?: ReactNode }) {
  return <figure className={`story-photo ${className}`} data-page-photo={asset.id}>
    <MediaFrame asset={asset} sizes="(min-width: 1100px) 38vw, (min-width: 720px) 46vw, 100vw" />
    <figcaption><span aria-hidden="true" className="story-photo-line" />{caption ?? asset.alt}</figcaption>
    <MediaCreditLine asset={asset} className="story-credit" />
  </figure>;
}

export function StorySections({ chapters, images, planned = false }: { chapters: Chapter[]; images: readonly (MediaAsset | null)[]; planned?: boolean; url?: string; topic?: string }) {
  return <div className="story-chapters">{chapters.map((chapter, index) => <section key={chapter.key}
    className={`story-chapter story-chapter-${index % 4} story-chapter-${chapter.kind ?? "narrative"}${index === 0 && !chapter.heading ? " story-chapter-intro" : ""}`} data-story-chapter="" data-motion="rise">
    <div className="story-chapter-marker" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><i /><LineIcon name={storyIcon(chapter.heading, chapter.kind)} size={21} /></div>
    <div className="story-chapter-copy">{chapter.content}</div>
    {storyImageAt(images, index, planned) ? <div className="story-chapter-visual"><StoryPhoto asset={storyImageAt(images, index, planned)!} caption={chapter.heading} /></div> : null}
  </section>)}</div>;
}

/** Short pages still carry five distinct, useful editorial photographs. */
export function StoryNextSteps({ items, images = [], usedCount = 0 }: { items?: readonly StoryStep[]; images?: readonly MediaAsset[]; usedCount?: number }) {
  const steps = storyNextItems({ items, images, usedCount });
  if (!steps.length) return null;
  return <section className="story-next" aria-labelledby="story-next-title">
    <div className="story-next-heading" data-motion="rise"><p className="type-overline text-brand-red">Your next chapter</p><h2 id="story-next-title">A little planning.<br /><span>A better start.</span></h2><p>Turn what you've learned into your next step.</p></div>
    <div className="story-next-grid" data-motion="stagger">{steps.map((step) => <article className="story-next-card" key={step.image.id}><StoryPhoto asset={step.image} caption={step.title} /><div><h3>{step.title}</h3><p>{step.text}</p><Link href={step.href}>Explore this step <span aria-hidden="true">↗</span></Link></div></article>)}</div>
  </section>;
}

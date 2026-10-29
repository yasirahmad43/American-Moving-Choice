import { Children, Fragment, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { MediaCreditLine, MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media";
import "./story-sections.css";

interface Chapter { key: string; content: ReactNode; heading?: string }

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
  return presentEditorialHtml(html).split(/(?=<h2\b)/i).filter((part) => part.trim()).map((part, index) => ({
    key: String(index),
    heading: /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(part)?.[1]?.replace(/<a\b[^>]*class="[^"]*heading-anchor[^\"]*"[\s\S]*?<\/a>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
    content: <div className="prose story-prose" dangerouslySetInnerHTML={{ __html: part }} />,
  }));
}

/** The draft example is retained in full, with an approachable explanation of its fields. */
export function presentEditorialHtml(html: string): string {
  const available = html.replace(/<div class="table-wrap"[^>]*>\s*<table>[\s\S]*?<\/table>\s*<\/div>/gi, (original) => {
    const unavailable = original.match(/not yet available|data pending|\[pending[^\]]*\]/gi) ?? [];
    if (unavailable.length < 3 || !/planning range|what the range covers|sample size/i.test(original) || /[$£€]\s*\d/.test(original)) return original;
    return `<div class="planning-availability"><p class="planning-availability-kicker">Rate information</p><h3>A useful range needs enough recent data.</h3><p>This reference table does not currently include a supported price range. A mover can give you a written estimate for the details of your move; our calculator shows a planning range only when enough qualifying rate cards are available.</p><a class="link" href="/moving-cost-calculator/">Check a planning range for your move</a><details><summary>See every reference field and its availability</summary>${original}</details></div>`;
  });
  return available.replace(/<blockquote>[\s\S]*?<\/blockquote>/gi, (original) => {
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
  return chapters.map(({ nodes, ...chapter }) => ({ ...chapter, content: <div className="prose story-prose">{nodes}</div> }));
}

export function StoryPhoto({ asset, className = "", caption }: { asset: MediaAsset; className?: string; caption?: ReactNode }) {
  return <figure className={`story-photo ${className}`} data-page-photo={asset.id}>
    <MediaFrame asset={asset} sizes="(min-width: 1100px) 38vw, (min-width: 720px) 46vw, 100vw" />
    <figcaption><span aria-hidden="true" className="story-photo-line" />{caption ?? asset.alt}</figcaption>
    <MediaCreditLine asset={asset} className="story-credit" />
  </figure>;
}

export function StorySections({ chapters, images }: { chapters: Chapter[]; images: readonly MediaAsset[] }) {
  return <div className="story-chapters">{chapters.map((chapter, index) => <section key={chapter.key}
    className={`story-chapter story-chapter-${index % 4}${index === 0 && !chapter.heading ? " story-chapter-intro" : ""}`} data-story-chapter="" data-motion="rise">
    <div className="story-chapter-marker" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
    <div className="story-chapter-copy">{chapter.content}</div>
    {images.length ? <div className="story-chapter-visual"><StoryPhoto asset={images[index % images.length]!} caption={chapter.heading} /></div> : null}
  </section>)}</div>;
}

const NEXT_STEPS = [
  { title: "Start with your route", text: "Tell us where you're moving from and to.", href: "/get-quotes/" },
  { title: "Understand the estimate", text: "Know what changes a mover's quote.", href: "/moving-costs/how-movers-charge/" },
  { title: "Make a practical plan", text: "Use the guides before moving day.", href: "/planning/" },
  { title: "Choose your contact preferences", text: "You decide how many companies may contact you.", href: "/which-companies-receive-my-request/" },
  { title: "Explore your destination", text: "Find state and city moving guides.", href: "/movers/" },
];

/** Short pages still carry five distinct, useful editorial photographs. */
export function StoryNextSteps({ images, usedCount = 0 }: { images: readonly MediaAsset[]; usedCount?: number }) {
  const remaining = images.slice(Math.min(usedCount, images.length));
  if (!remaining.length) return null;
  return <section className="story-next" aria-labelledby="story-next-title">
    <div className="story-next-heading" data-motion="rise"><p className="type-overline text-brand-red">Your next chapter</p><h2 id="story-next-title">A little planning.<br /><span>A better start.</span></h2><p>Turn what you've learned into your next step.</p></div>
    <div className="story-next-grid" data-motion="stagger">{remaining.map((image, index) => {
      const step = NEXT_STEPS[(usedCount + index) % NEXT_STEPS.length]!;
      return <article className="story-next-card" key={image.id}><StoryPhoto asset={image} caption={step.title} /><div><h3>{step.title}</h3><p>{step.text}</p><Link href={step.href}>Explore this step <span aria-hidden="true">↗</span></Link></div></article>;
    })}</div>
  </section>;
}

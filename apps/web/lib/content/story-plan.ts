import { buildPageCardMedia } from "../page-media-plan";
import type { MediaAsset } from "../media-sources";

export type StoryKind = "narrative" | "checklist" | "steps" | "data" | "example" | "sources";
export interface StoryChapterHint { heading?: string; kind?: StoryKind }
export interface StoryStep { title: string; text: string; href: string; image: MediaAsset }

/** Review-note removal can leave empty paragraphs before the first real heading.
 * Keep their markup/anchors attached to that chapter instead of inventing a photo-only chapter. */
export function htmlChapterParts(html: string): string[] {
  const parts = html.split(/(?=<h2\b)/i).filter(part => part.trim());
  const prefix = parts[0];
  if (prefix && parts.length > 1 && !/^\s*<h2\b/i.test(prefix)) {
    const text = prefix.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").replace(/&(?:nbsp|#160|#x0*a0);/gi, "").trim();
    if (!text && !/<(?:img|video|audio|svg|table|figure)\b/i.test(prefix)) return [prefix + parts[1]!, ...parts.slice(2)];
  }
  return parts;
}

const LEGACY_NEXT_STEPS = [
  { title: "Start with your route", text: "Tell us where you're moving from and to.", href: "/get-quotes/" },
  { title: "Understand the estimate", text: "Know what changes a mover's quote.", href: "/moving-costs/how-movers-charge/" },
  { title: "Make a practical plan", text: "Use the guides before moving day.", href: "/planning/" },
  { title: "Choose your contact preferences", text: "You decide how many companies may contact you.", href: "/which-companies-receive-my-request/" },
  { title: "Explore your destination", text: "Find state and city moving guides.", href: "/movers/" },
];

/** Shared standalone pages still use the original image/offset contract. */
export function storyNextItems({ items, images = [], usedCount = 0 }: { items?: readonly StoryStep[]; images?: readonly MediaAsset[]; usedCount?: number }): readonly StoryStep[] {
  return items ?? images.slice(Math.min(usedCount, images.length)).map((image, index) => ({ image, ...LEGACY_NEXT_STEPS[(usedCount + index) % LEGACY_NEXT_STEPS.length]! }));
}

export function storyImageAt(images: readonly (MediaAsset | null)[], index: number, planned = false) {
  return planned ? images[index] : images[index % images.length];
}

/** Relocate complete existing blocks, rather than generating or abbreviating the reader's answer. */
export function guideOverview(html: string): { answer: string; actions: string; body: string } {
  const first = /^\s*(<p\b[^>]*>[\s\S]*?<\/p>)/i.exec(html);
  const answer = first?.[1] ?? "";
  let body = first ? html.slice(first[0].length) : html;
  const action = /<h2\b[^>]*\bid="start-here"[^>]*>[\s\S]*?(?=<h2\b|$)/i.exec(body);
  const actions = action?.[0] ?? "";
  if (action) body = body.slice(0, action.index) + body.slice(action.index + action[0].length);
  return { answer, actions, body };
}

export function chapterKind(html: string, heading = ""): StoryKind {
  if (/^(?:sources?|related pages|more ways to check|changes to this|current version)\b/i.test(heading)) return "sources";
  if (/<table\b/i.test(html)) return "data";
  if (/worked example|worksheet|compare.*like for like|quote comparison/i.test(heading)) return "example";
  if (/<ol\b/i.test(html)) return "steps";
  if (/<ul\b/i.test(html)) return "checklist";
  return "narrative";
}

export function storyIcon(heading = "", kind: StoryKind = "narrative") {
  if (/storage/i.test(heading)) return "storage" as const;
  if (/packing|inventory|belongings/i.test(heading)) return "box" as const;
  if (/dates?|timing|schedule/i.test(heading)) return "calendar" as const;
  if (/route|interstate|long.distance/i.test(heading)) return "route" as const;
  if (/contact|permission|privacy/i.test(heading)) return "lock" as const;
  if (/who|broker|carrier|people/i.test(heading)) return "users" as const;
  return kind === "data" ? "chart" as const : kind === "steps" ? "route" as const : kind === "checklist" ? "clipboard" as const : kind === "sources" ? "ledger" as const : kind === "example" ? "edit" as const : "box" as const;
}

const NEXT_STEPS = [
  { title: "Start with your route", text: "Check your move and choose a contact limit.", href: "/get-quotes/" },
  { title: "Understand the estimate", text: "Compare the job, billing unit and written conditions.", href: "/moving-costs/how-movers-charge/" },
  { title: "Make a practical plan", text: "Choose a checklist for your next stage.", href: "/planning/" },
  { title: "Choose your contact preferences", text: "Know the limit and channels before you send.", href: "/which-companies-receive-my-request/" },
  { title: "Explore your destination", text: "Read the sourced state and city guides.", href: "/movers/" },
  { title: "Check a contacting company", text: "Research the credentials the company gives you.", href: "/verify-a-mover/" },
];

/** One page, one variety set. Source lists and full-width data deserve space rather than filler photos. */
export function storyMediaPlan(assets: readonly MediaAsset[], url: string, chapters: readonly StoryChapterHint[], topic: string) {
  const used = new Set<string>();
  const family = /cost|calculator|estimate|charge/.test(`${url} ${topic}`.toLowerCase()) ? "cost" : undefined;
  const chapterImages = chapters.map((chapter, index) => {
    if (chapter.kind === "data" || chapter.kind === "sources") return null;
    const heading = chapter.heading ?? topic;
    // A storage chapter on a cost page needs a storage scene, rather than another price-paperwork shot.
    const subject = /storag/i.test(heading) ? { url: "/services/storage/", family: "service" }
      : /pack|unpack/i.test(heading) ? { url: "/services/packing/", family: "service" }
        : /timeline|moving.day|delivery.day/i.test(heading) ? { url: "/planning/", family: "planning" }
          : /valuation|insurance|protect|credential|federal record/i.test(heading) ? { url: "/how-we-verify-movers/", family: "question" }
            : { url, family };
    return buildPageCardMedia(assets, `${subject.url}#chapter-${index}`, { family: subject.family, topic: heading }, used);
  });
  const need = Math.max(0, 5 - chapterImages.filter(Boolean).length);
  const steps: StoryStep[] = NEXT_STEPS.filter(step => step.href !== url).slice(0, need).map(step => ({
    ...step, image: buildPageCardMedia(assets, step.href, { topic: step.title }, used),
  }));
  return { chapterImages, steps };
}

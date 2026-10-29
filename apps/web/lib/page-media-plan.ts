import type { MediaAsset } from "./media-sources";

export interface PageMediaOptions { family?: string; topic?: string; stateCode?: string }
export interface PageMediaPlan { video: MediaAsset; images: MediaAsset[] }

/** These four commissioned moving scenes are explicitly approved reusable video backdrops. */
const EDITORIAL_VIDEOS = ["home-hero-crew-loading-golden-hour", "long-distance-hero-aerial-highway-dawn", "local-hero-sofa-apartment-door", "how-it-works-laptop-boxes"] as const;
const EDITORIAL_CATEGORIES = new Set(["home", "services", "route", "state", "planning", "questions", "costs", "trust", "how-it-works", "size", "season", "for-movers", "survey"]);
const WORDS_TO_SKIP = new Set(["moving", "movers", "move", "with", "from", "your", "about", "choice", "american", "page", "guide", "guides"]);
const FAMILY_SUBJECTS: Record<string, string[]> = { city: ["service:local"], state: ["service:local"], zip: ["service:local"], route: ["route", "theme:route", "service:long-distance"], service: ["services"], cost: ["costs", "theme:pricing"], question: ["questions", "theme:faq"], planning: ["planning", "theme:checklist"] };
const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !WORDS_TO_SKIP.has(word));
const hash = (text: string) => { let h = 2166136261; for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; };

/** Pure, read-only editorial selection. Exclusive hero/upload claims are a separate role.
 * Images are commissioned non-hero illustrations from explicitly approved subject categories;
 * every page receives five different IDs. No usedOn or SEO ownership claims are recorded.
 */
export function buildPageMediaPlan(assets: readonly MediaAsset[], url: string, options: PageMediaOptions = {}): PageMediaPlan {
  const path = new URL(url, "https://american-moving-choice.invalid").pathname.toLowerCase();
  const topic = `${path} ${options.family ?? ""} ${options.topic ?? ""}`.toLowerCase();
  const terms = new Set(words(topic));
  const wanted = new Set<string>(["home", "how-it-works"]);
  const add = (...tags: string[]) => tags.forEach((tag) => wanted.add(tag));
  if (/route|interstate|long.distance/.test(topic)) add("route", "service:long-distance", "service:interstate");
  if (/city|state|\/movers\/|local/.test(topic)) add("service:local");
  if (/packing|unpacking|boxes/.test(topic)) add("service:packing", "planning");
  if (/storage/.test(topic)) add("service:storage");
  if (/specialty|piano|antique|artwork/.test(topic)) add("service:specialty");
  if (/labor/.test(topic)) add("service:labor-only");
  if (/cost|price|pricing|calculator|estimate/.test(topic)) add("costs", "theme:pricing");
  if (/question|answer/.test(topic)) add("questions", "theme:faq");
  if (/planning|checklist|prepare/.test(topic) || (!options.family && /guide|explore/.test(topic))) add("planning", "theme:checklist");
  if (/trust|verif|screen|insurance|license|safety/.test(topic)) add("trust", "theme:safety");
  if (/for-movers|business|partner/.test(topic)) add("for-movers");
  const geographic = new Set<string>(options.stateCode ? [`state:${options.stateCode.toUpperCase()}`] : []);
  // Named state illustrations can also match a URL such as /moving-costs/new-york/.
  for (const asset of assets) {
    const state = asset.tags.find((tag) => tag.startsWith("state:"));
    if (!state) continue;
    const label = asset.alt.split(":")[0]?.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    if (label && (`/${path}/`.includes(`/${label}/`) || path.includes(`${label}-to-`) || path.includes(`-to-${label}/`))) geographic.add(state);
  }
  const candidates = assets.filter((asset) => {
    const state = asset.tags.find((tag) => tag.startsWith("state:"));
    return asset.kind === "image" && !asset.placeholder && !asset.tags.includes("hero")
      && asset.generator?.provider === "higgsfield" && Boolean(asset.credit.license && asset.credit.source_url)
      && asset.tags.some((tag) => EDITORIAL_CATEGORIES.has(tag)) && (!state || geographic.has(state))
      && (/\b(?:pets?|dogs?|cats?|animals?)\b/.test(topic) || !/(?:^|[-\s])(?:pet|pets|dog|dogs|cat|cats)(?:[-\s]|$)/i.test(`${asset.id} ${asset.alt}`));
  });
  const score = (asset: MediaAsset) => {
    const stateMatch = asset.tags.some((tag) => geographic.has(tag));
    const familyScore = (FAMILY_SUBJECTS[options.family ?? ""] ?? []).filter((tag) => asset.tags.includes(tag)).length * 200;
    const tagScore = asset.tags.reduce((n, tag) => n + (wanted.has(tag) ? (tag.startsWith("service:") || tag.startsWith("theme:") ? 90 : 45) : 0), 0);
    const subject = new Set(words(`${asset.id} ${asset.alt} ${asset.tags.join(" ")}`));
    const textScore = [...terms].filter((term) => subject.has(term)).length * 12;
    return (stateMatch ? 1_000 : 0) + familyScore + tagScore + textScore;
  };
  const images = candidates.map((asset) => ({ asset, score: score(asset), tie: hash(`${path}|${asset.id}`) }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie || (a.asset.id < b.asset.id ? -1 : 1)).slice(0, 5).map(({ asset }) => asset);
  if (images.length < 5 || new Set(images.map((asset) => asset.id)).size < 5) throw new Error(`page media: five distinct licensed editorial images required for ${path}`);
  const videoId = /^\/(?:planning|questions)\//.test(path) || /^(?:planning|question)$/.test(options.family ?? "") ? EDITORIAL_VIDEOS[3]
    : /^\/explore\//.test(path) ? EDITORIAL_VIDEOS[2]
      : /route|interstate|long.distance|cost|price|estimate|calculator/.test(topic) ? EDITORIAL_VIDEOS[1]
        : /city|state|\/movers\/|local/.test(topic) ? EDITORIAL_VIDEOS[2]
          : /question|planning|checklist|trust|verif/.test(topic) ? EDITORIAL_VIDEOS[3] : EDITORIAL_VIDEOS[0];
  const video = assets.find((asset) => asset.id === videoId && asset.kind === "video" && !asset.placeholder && asset.credit.license && asset.poster);
  if (!video) throw new Error(`page media: approved video ${videoId} unavailable`);
  return { video, images };
}

const CARD_SUBJECTS: { match: RegExp; image: string }[] = [
  { match: /\b(?:pets?|dogs?|cats?)\b/, image: "planning-pet-carrier-and-a-leash" },
  { match: /delivery/, image: "svc-local-crew-unloading-a-truck-at" },
  { match: /choos|compare.*compan|select.*mover/, image: "how-it-works-homeowner-and-mover-walking-through" },
  { match: /pack(?:ing)?\b|unpack/, image: "svc-packing-hands-taping-box" },
  { match: /first.?30|first 30|new-state-first/, image: "planning-person-walking-through-an-empty" },
  { match: /out.of.state|interstate|long.distance/, image: "route-moving-van-on-a-plains" },
  { match: /timeline|weeks?|months?/, image: "planning-planner-notebook-tape-and-markers" },
  { match: /moving.day|move.day/, image: "svc-local-boxes-lined-up-in-a" },
  { match: /estimate|quote|price|cost/, image: "costs-person-reviewing-paperwork-at-a" },
];

/** Topic-matched thumbnails. The optional set belongs to one hub render, never a global claim. */
export function buildPageCardMedia(assets: readonly MediaAsset[], url: string, options: PageMediaOptions = {}, usedIds = new Set<string>()): MediaAsset {
  const topic = `${url} ${options.topic ?? ""}`.toLowerCase();
  const plan = buildPageMediaPlan(assets, url, options);
  const preferred = CARD_SUBJECTS.filter(({ match }) => match.test(topic)).map(({ image }) => assets.find((asset) => asset.id === image)).filter((asset): asset is MediaAsset => Boolean(asset && asset.kind === "image" && !asset.placeholder && !asset.tags.includes("hero") && asset.generator?.provider === "higgsfield" && asset.credit.license && asset.credit.source_url));
  const subjectTerms = new Set(words(topic));
  const fallback = assets.filter((asset) => asset.kind === "image" && !asset.placeholder && !asset.tags.includes("hero")
    && !asset.tags.some((tag) => tag.startsWith("state:")) && asset.generator?.provider === "higgsfield"
    && Boolean(asset.credit.license && asset.credit.source_url) && asset.tags.some((tag) => EDITORIAL_CATEGORIES.has(tag))
    && (/\b(?:pets?|dogs?|cats?|animals?)\b/.test(topic) || !/(?:^|[-\s])(?:pet|pets|dog|dogs|cat|cats)(?:[-\s]|$)/i.test(`${asset.id} ${asset.alt}`)))
    .map((asset) => ({ asset, score: (FAMILY_SUBJECTS[options.family ?? ""] ?? []).filter((tag) => asset.tags.includes(tag)).length * 200
      + words(`${asset.id} ${asset.alt}`).filter((word) => subjectTerms.has(word)).length * 20, tie: hash(`${url}|${asset.id}`) }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie).map(({ asset }) => asset);
  const ordered = [...preferred, ...plan.images, ...fallback];
  const image = ordered.find((asset) => !usedIds.has(asset.id)) ?? plan.images[0]!;
  usedIds.add(image.id);
  return image;
}

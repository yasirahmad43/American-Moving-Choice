/**
 * Review mode (design/premium): reviewer notes ([Counsel: …], [Owner: …], the draft banner, the
 * legend and pending-token placeholders) never reach public visitors.
 *
 * - In production builds they are stripped from the HTML at render time (REVIEW_NOTES_IN_HTML
 *   is false), so no production page carries them at all.
 * - In development they are rendered hidden and shown only while the URL carries ?review=1
 *   (ReviewModeFlag sets <html data-review="1">; prose.css reveals them).
 */
export const REVIEW_NOTES_IN_HTML = process.env.NODE_ENV !== "production";

/** How the Markdown renderer treats markers and pending tokens for the current build. */
export const CONTENT_RENDER_MODE = REVIEW_NOTES_IN_HTML ? ("review" as const) : ("public" as const);

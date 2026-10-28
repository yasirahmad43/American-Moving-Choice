"use server";

/** Content decisions: workflow status, indexing, review, edits, regeneration, redirects and bulk actions (audited). */
import { AdminError, addRedirect, bulkMarkReviewed, bulkPublishReady, editPageContent, markPageReviewed, parseFaqText, regeneratePage, setPageIndexable, setPageStatus, type ContentActor, type ContentFilters } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field, idField } from "../_lib/action";
import { ROLES } from "../_lib/roles";

const paths = (id: string) => [`/admin/content/${id}`, "/admin/content", "/admin/content/publication", "/admin/content/media"];

const actorOf = (ctx: { actor: { userId: string; ip?: string | null }; adminRole: ContentActor["adminRole"] }): ContentActor => ({ ...ctx.actor, adminRole: ctx.adminRole });

export async function statusAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    const result = await setPageStatus(actorOf(ctx), idField(formData, "pageId"), field(formData, "to", 20), field(formData, "note", 500));
    return result.to === "published" ? `${result.url} is published; the link graph was rebuilt.` : result.from === "published" ? `${result.url} is unpublished and out of the sitemaps.` : `${result.url} moved to ${result.to}.`;
  }, paths(id));
}

export async function indexableAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    const indexable = field(formData, "indexable", 5) === "true";
    await setPageIndexable(actorOf(ctx), idField(formData, "pageId"), indexable, field(formData, "reason", 500));
    return indexable ? "The page is indexable and back in the sitemaps." : "The page is noindex and out of the sitemaps.";
  }, paths(id));
}

export async function reviewAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    await markPageReviewed(actorOf(ctx), idField(formData, "pageId"), field(formData, "reviewer", 120));
    return "Review recorded.";
  }, paths(id));
}

export async function editAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    const result = await editPageContent(actorOf(ctx), idField(formData, "pageId"), {
      title: field(formData, "title", 200),
      metaDescription: field(formData, "metaDescription", 400),
      intro: field(formData, "intro", 4000),
      faq: parseFaqText(field(formData, "faq", 20000)),
    });
    const failed = Object.entries(result.gates).filter(([, g]) => !g.passed).map(([k]) => k);
    if (result.blocked) throw new AdminError(`Saved, but the page is now ${result.blocked} and dropped to draft.`);
    return failed.length ? `Saved. Gates re-ran; needs attention: ${failed.join(", ")}.` : "Saved. Every gate passes on the new text.";
  }, paths(id));
}

export async function regenerateAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    const result = await regeneratePage(actorOf(ctx), idField(formData, "pageId"));
    return result.blocked_reason ? `Regenerated as ${result.status}: ${result.blocked_reason}.` : `Regenerated from the brief; status ${result.status}.`;
  }, paths(id));
}

export async function redirectAction(previous: FormState, formData: FormData): Promise<FormState> {
  const id = field(formData, "pageId", 64);
  return adminAction(previous, ROLES.content, async (ctx) => {
    await addRedirect(actorOf(ctx), { sourceUrl: field(formData, "sourceUrl", 300), targetUrl: field(formData, "targetUrl", 300), reason: field(formData, "reason", 300) });
    return "Redirect recorded (301, one hop).";
  }, id ? paths(id) : ["/admin/content"]);
}

export async function bulkPublishAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const limit = Number.parseInt(field(formData, "limit", 10), 10);
    const result = await bulkPublishReady(actorOf(ctx), { family: field(formData, "family", 20) || null, limit: Number.isFinite(limit) && limit > 0 ? limit : null });
    return `Published ${result.published} ready page${result.published === 1 ? "" : "s"} (${result.indexable} indexable); ${result.links} links in the graph.`;
  }, ["/admin/content", "/admin/content/publication"]);
}

export async function bulkReviewAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const filters: ContentFilters = {};
    for (const key of ["family", "status", "indexable", "intent", "state", "parent", "blocked", "hypothesis", "reviewed", "media", "q"] as const) {
      const value = field(formData, key, 100);
      if (value) (filters as Record<string, string>)[key] = value;
    }
    const n = await bulkMarkReviewed(actorOf(ctx), filters, field(formData, "reviewer", 120));
    return `Marked ${n} page${n === 1 ? "" : "s"} as reviewed.`;
  }, ["/admin/content", "/admin/content/publication"]);
}

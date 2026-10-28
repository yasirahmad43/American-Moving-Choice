"use server";

/** Media library decisions: assign, unclaim, reject, restore and upload (audited; manifest and claims stay in step). */
import { AdminError, UPLOAD_MAX_BYTES, reassignMedia, rejectMedia, restoreMedia, uploadMedia, type ContentActor } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../../_lib/action";
import { ROLES } from "../../_lib/roles";

const PATHS = ["/admin/content/media", "/admin/content", "/admin/content/publication"];

const actorOf = (ctx: { actor: { userId: string; ip?: string | null }; adminRole: ContentActor["adminRole"] }): ContentActor => ({ ...ctx.actor, adminRole: ctx.adminRole });

const mediaId = (formData: FormData): string => {
  const id = field(formData, "mediaId", 200);
  if (!/^[a-z0-9-]+$/.test(id)) throw new AdminError("The form is missing its asset. Reload the page and try again.");
  return id;
};

export async function assignMediaAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const url = field(formData, "pageUrl", 300);
    const result = await reassignMedia(actorOf(ctx), mediaId(formData), url || null);
    if (!result.to) return result.from ? `Unclaimed from ${result.from}.` : "The asset was not claimed by any page.";
    return result.from ? `Moved from ${result.from} to ${result.to}.` : `Assigned to ${result.to}.`;
  }, PATHS);
}

export async function unclaimMediaAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const result = await reassignMedia(actorOf(ctx), mediaId(formData), null);
    return result.from ? `Unclaimed from ${result.from}; the page renders without it.` : "The asset was not claimed by any page.";
  }, PATHS);
}

export async function rejectMediaAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    await rejectMedia(actorOf(ctx), mediaId(formData), field(formData, "reason", 500));
    return "Rejected: hidden from claims and taken off its page.";
  }, PATHS);
}

export async function restoreMediaAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    await restoreMedia(actorOf(ctx), mediaId(formData));
    return "Restored: the asset can be claimed again.";
  }, PATHS);
}

export async function uploadMediaAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) throw new AdminError("Choose an image to upload.");
    if (file.size > UPLOAD_MAX_BYTES) throw new AdminError("The file is larger than 3 MB.");
    const asset = await uploadMedia(actorOf(ctx), {
      fileName: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
      alt: field(formData, "alt", 300),
      tags: field(formData, "tags", 500).split(/[,\s]+/),
      credit: { creator: field(formData, "creator", 200), sourceUrl: field(formData, "sourceUrl", 500), license: field(formData, "license", 300), attributionRequired: field(formData, "attributionRequired", 5) === "true" },
      prompt: field(formData, "prompt", 1000),
    });
    return `Uploaded as ${asset.id} (${asset.width}×${asset.height}, optimized WebP tiers). It is unclaimed until a page adopts it.`;
  }, PATHS);
}

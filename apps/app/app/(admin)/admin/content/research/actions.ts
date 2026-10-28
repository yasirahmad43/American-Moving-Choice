"use server";

/** Research decisions: CSV import (uploaded or committed files) and page assignment (audited). */
import { AdminError, assignResearch, importKnownResearchFile, importResearchCsv, type ContentActor } from "@amc/server/admin";
import type { FormState } from "@/lib/form";
import { adminAction, field } from "../../_lib/action";
import { ROLES } from "../../_lib/roles";

const PATHS = ["/admin/content/research", "/admin/content", "/admin/content/publication"];

const actorOf = (ctx: { actor: { userId: string; ip?: string | null }; adminRole: ContentActor["adminRole"] }): ContentActor => ({ ...ctx.actor, adminRole: ctx.adminRole });

export async function importUploadAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) throw new AdminError("Choose a CSV file to import.");
    const result = await importResearchCsv(actorOf(ctx), { fileName: file.name, text: await file.text() });
    return `${result.file}: ${result.imported} rows imported, ${result.skipped} skipped (of ${result.read}).`;
  }, PATHS);
}

export async function importKnownAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const result = await importKnownResearchFile(actorOf(ctx), field(formData, "file", 200));
    return `${result.file}: ${result.imported} rows imported, ${result.skipped} skipped (of ${result.read}).`;
  }, PATHS);
}

export async function assignAction(previous: FormState, formData: FormData): Promise<FormState> {
  return adminAction(previous, ROLES.content, async (ctx) => {
    const id = Number.parseInt(field(formData, "researchId", 20), 10);
    if (!Number.isFinite(id)) throw new AdminError("The form is missing its row. Reload the page and try again.");
    const url = field(formData, "targetUrl", 300);
    await assignResearch(actorOf(ctx), id, url || null, field(formData, "family", 20) || null);
    return url ? `Assigned to ${url}.` : "Assignment cleared.";
  }, PATHS);
}

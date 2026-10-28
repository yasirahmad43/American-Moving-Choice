/**
 * The company's public profile (mover verification §5). Owners and managers edit the display
 * name, description, logo URL and website. Company-written content is moderated: a change to the
 * name, description or logo of a live profile sets public_status to under_review until an admin
 * approves it. A hidden profile (company not approved yet) stays hidden.
 */
import { z } from "zod";
import { audit } from "../audit/audit";
import { getPool, tx } from "../db/pool";
import { env } from "../env/env";
import { loadActor } from "./actor";
import { normalizeWebsite } from "./application-schema";
import { COMPANY_MANAGERS, type Actor } from "./permissions";

export type PublicStatus = "live" | "under_review" | "hidden";

export interface ProfileView {
  slug: string;
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  publicStatus: PublicStatus;
  updatedAt: Date;
  /** Public profile URL on the site (it shows only while the profile is live). */
  publicUrl: string;
}

export const PROFILE_LIMITS = { displayName: 120, description: 2000, url: 500 } as const;

/** https only for logos: an http image on the public site would be mixed content. */
export function normalizeLogoUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const profileSchema = z.object({
  displayName: z
    .string({ error: "Enter the name customers know you by." })
    .trim()
    .min(2, "Enter the name customers know you by.")
    .max(PROFILE_LIMITS.displayName, `Keep the name under ${PROFILE_LIMITS.displayName} characters.`),
  description: z
    .string()
    .nullish()
    .transform((value) => value?.replace(/\r\n/g, "\n").trim() || null)
    .refine((value) => !value || value.length <= PROFILE_LIMITS.description, `Keep the description under ${PROFILE_LIMITS.description} characters.`),
  logoUrl: z
    .string()
    .nullish()
    .transform((value, ctx) => {
      if (!value?.trim()) return null;
      const url = normalizeLogoUrl(value);
      if (!url || url.length > PROFILE_LIMITS.url) {
        ctx.addIssue({ code: "custom", message: "Enter an https:// link to your logo image." });
        return z.NEVER;
      }
      return url;
    }),
  website: z
    .string()
    .nullish()
    .transform((value, ctx) => {
      if (!value?.trim()) return null;
      const url = normalizeWebsite(value);
      if (!url || url.length > PROFILE_LIMITS.url) {
        ctx.addIssue({ code: "custom", message: "Enter a web address like www.example.com." });
        return z.NEVER;
      }
      return url;
    }),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileField = keyof z.output<typeof profileSchema>;

const publicUrlFor = (slug: string) => `${env().WEB_URL}/companies/${slug}/`;

export async function getProfile(actor: Actor): Promise<ProfileView | null> {
  await loadActor(actor, COMPANY_MANAGERS);
  const row = (
    await getPool().query<{ slug: string; display_name: string; description: string | null; logo_url: string | null; website: string | null; public_status: PublicStatus; updated_at: Date }>(
      "select slug, display_name, description, logo_url, website, public_status, updated_at from company_profiles where company_id = $1",
      [actor.companyId],
    )
  ).rows[0];
  if (!row) return null;
  return {
    slug: row.slug,
    displayName: row.display_name,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    publicStatus: row.public_status,
    updatedAt: row.updated_at,
    publicUrl: publicUrlFor(row.slug),
  };
}

export type UpdateProfileResult =
  | { ok: true; publicStatus: PublicStatus; sentForReview: boolean; changed: boolean }
  | { ok: false; fieldErrors: Partial<Record<ProfileField, string>> }
  | { ok: false; reason: "no_profile" };

export async function updateProfile(actor: Actor, input: ProfileInput, meta: { ip?: string | null } = {}): Promise<UpdateProfileResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ProfileField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ProfileField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const next = parsed.data;
  return tx(async (client): Promise<UpdateProfileResult> => {
    const member = await loadActor(actor, COMPANY_MANAGERS, client);
    const current = (
      await client.query<{ display_name: string; description: string | null; logo_url: string | null; website: string | null; public_status: PublicStatus }>(
        "select display_name, description, logo_url, website, public_status from company_profiles where company_id = $1 for update",
        [actor.companyId],
      )
    ).rows[0];
    if (!current) return { ok: false, reason: "no_profile" };
    const moderatedChange =
      current.display_name !== next.displayName || (current.description ?? null) !== next.description || (current.logo_url ?? null) !== next.logoUrl;
    const changed = moderatedChange || (current.website ?? null) !== next.website;
    if (!changed) return { ok: true, publicStatus: current.public_status, sentForReview: false, changed: false };
    const publicStatus: PublicStatus = moderatedChange && current.public_status === "live" ? "under_review" : current.public_status;
    await client.query(
      `update company_profiles set display_name = $2, description = $3, logo_url = $4, website = $5, public_status = $6 where company_id = $1`,
      [actor.companyId, next.displayName, next.description, next.logoUrl, next.website, publicStatus],
    );
    await audit(
      {
        actorType: "user",
        actorId: member.userId,
        companyId: actor.companyId,
        action: "company.profile_updated",
        entity: "company_profile",
        entityId: actor.companyId,
        before: { display_name: current.display_name, description: current.description, logo_url: current.logo_url, website: current.website, public_status: current.public_status },
        after: { display_name: next.displayName, description: next.description, logo_url: next.logoUrl, website: next.website, public_status: publicStatus },
        ip: meta.ip ?? null,
      },
      client,
    );
    return { ok: true, publicStatus, sentForReview: publicStatus === "under_review" && current.public_status !== "under_review", changed: true };
  });
}

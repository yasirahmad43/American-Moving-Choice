/**
 * Rules for the admin mailbox (demo mode shows stored messages instead of sending them; build
 * plan §5, §6). Messages with account-takeover power (password reset and invitation links) are
 * hidden from the ops and support roles, and their links are revealed only to a super admin in
 * demo mode. Everyone else sees the redacted body_text.
 */
import type { AdminRole } from "../auth/sessions";
import { decryptSecretBody } from "./outbox";

/** Templates whose links let the holder take over or create an account. */
export const SENSITIVE_TEMPLATES: ReadonlySet<string> = new Set(["password_reset", "invitation"]);

/** Admin roles that may open the mailbox at all (matches apps/app/lib/nav/admin.ts). */
const MAILBOX_ROLES: readonly AdminRole[] = ["super_admin", "ops", "support"];

/** Whether an admin may see that a message of this template exists (subject, recipient, redacted body). */
export function canViewMessage(adminRole: AdminRole | null, template: string): boolean {
  if (!adminRole || !MAILBOX_ROLES.includes(adminRole)) return false;
  return adminRole === "super_admin" || !SENSITIVE_TEMPLATES.has(template);
}

/**
 * The body to show an admin: the deliverable text with its link for a super admin in demo mode,
 * otherwise the redacted body_text. Null when the admin may not see the message.
 */
export function mailboxBody(
  message: { id: string; template: string; body_text: string; body_secret_enc: string | null },
  viewer: { adminRole: AdminRole | null; demoMode: boolean },
): string | null {
  if (!canViewMessage(viewer.adminRole, message.template)) return null;
  if (!message.body_secret_enc || viewer.adminRole !== "super_admin" || !viewer.demoMode) return message.body_text;
  try {
    return decryptSecretBody(message.id, message.body_secret_enc);
  } catch {
    return message.body_text;
  }
}

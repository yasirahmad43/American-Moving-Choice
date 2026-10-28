/**
 * Admin roles allowed to take each kind of decision. Pages check the nav roles
 * (lib/nav/admin.ts); actions check these, which can be narrower. super_admin always passes.
 */
import type { AdminRole } from "@amc/server/auth";

export const ROLES = {
  /** Verification decisions: checks, callback, approve, reject, suspend, reinstate. */
  verification: ["super_admin", "ops", "verification"],
  /** New price rows after approval. */
  pricing: ["super_admin", "finance"],
  /** Profile description moderation. */
  profiles: ["super_admin", "ops", "verification", "moderator", "content_editor"],
  /** Credit adjustments, refunds, claims, disputes. */
  finance: ["super_admin", "finance"],
  /** Request decisions (approve, reject, withdraw, expire) and re-running the matcher for a request. */
  leads: ["super_admin", "ops", "support"],
  /** Editing a company's coverage rules and capabilities on its behalf. */
  coverage: ["super_admin", "ops"],
  /** Review moderation. */
  reviews: ["super_admin", "moderator", "ops"],
  /** Case handling. */
  cases: ["super_admin", "ops", "support", "moderator", "verification"],
  /** Re-verification or suspension triggered from a case. */
  caseEnforcement: ["super_admin", "ops", "verification"],
  /** Running jobs by hand. */
  jobs: ["super_admin", "ops"],
  /** Platform settings, consent text, admin users. */
  platform: ["super_admin"],
  /** Sharing policies. */
  policies: ["super_admin", "finance"],
  /** Programmatic content, research, media and publication (packages/server/src/admin/content.ts). */
  content: ["super_admin", "ops", "content_editor"],
} as const satisfies Record<string, readonly AdminRole[]>;

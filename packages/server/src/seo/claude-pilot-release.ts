/** Reviewed source content only. Deployments never call a generation provider. */
import type pg from "pg";
import { CLAUDE_PILOT_CATALOG, CLAUDE_PILOT_MANIFEST_SHA256, CLAUDE_PILOT_REVIEWED_AT } from "./claude-pilot-catalog";
import { reviewedCohort, publishReviewedCohort } from "./reviewed-cohort";

export const CLAUDE_PILOT_COHORT = reviewedCohort({
  entries: CLAUDE_PILOT_CATALOG,
  sourceManifestSha256: CLAUDE_PILOT_MANIFEST_SHA256,
  reviewedBy: "American Moving Choice content review (AI-assisted)",
  reviewedAt: CLAUDE_PILOT_REVIEWED_AT,
});

export const bootstrapClaudePilot = (client: pg.Client, options: { log?: (line: string) => void; maxRunMs?: number } = {}) =>
  publishReviewedCohort(client, CLAUDE_PILOT_COHORT, options);

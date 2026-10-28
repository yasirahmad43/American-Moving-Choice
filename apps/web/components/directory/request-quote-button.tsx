"use client";

import { LinkButton } from "@amc/ui";
import { useRouter } from "next/navigation";

/** sessionStorage key the quote survey reads for a profile-origin request (slice S2). */
export const PROFILE_ORIGIN_KEY = "amc.survey.profile";

export interface ProfileOrigin {
  companyId: string;
  slug: string;
  displayName: string;
  /** ISO time the visitor pressed the button. */
  savedAt: string;
}

/**
 * The CTA-red "Request a quote" button (VD §5.3, §13.6). It records the profile the request
 * started from, so the survey names this mover first, then opens the standard survey. Without
 * JavaScript it is a plain link to the survey.
 */
export function RequestQuoteButton({ companyId, slug, displayName, size = "md", label = "Request a quote" }: Omit<ProfileOrigin, "savedAt"> & { size?: "md" | "sm"; label?: string }) {
  const router = useRouter();
  const start = (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      const origin: ProfileOrigin = { companyId, slug, displayName, savedAt: new Date().toISOString() };
      window.sessionStorage.setItem(PROFILE_ORIGIN_KEY, JSON.stringify(origin));
    } catch {
      // Storage can be unavailable (private mode); the survey still works without the origin.
    }
    router.push("/get-quotes/");
  };
  return (
    <LinkButton href="/get-quotes/" variant="cta" size={size} onClick={start} aria-label={`${label} from ${displayName}`}>
      {label}
    </LinkButton>
  );
}

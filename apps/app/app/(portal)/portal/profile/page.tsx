import { requireMembership } from "@amc/server/auth";
import { PROFILE_LIMITS, getProfile, type PublicStatus } from "@amc/server/companies";
import { AbsoluteDate, Alert, Card, ExternalLinkIcon, LinkButton, PageHeader, StatusPill, type StatusTone } from "@amc/ui";
import type { Metadata } from "next";
import { portalNavItem } from "@/lib/nav/portal";
import { ProfileForm } from "@/components/portal/onboarding/profile-form";

const item = portalNavItem("/portal/profile");

export const metadata: Metadata = { title: item.label };

const STATUS: Record<PublicStatus, { label: string; tone: StatusTone; text: string }> = {
  live: { label: "Live", tone: "success", text: "Your profile is public in the mover directory." },
  under_review: { label: "Under review", tone: "info", text: "A reviewer is checking your latest changes. Company-written content is moderated before it's public." },
  hidden: { label: "Not public yet", tone: "neutral", text: "Your profile goes public when your company is approved." },
};

/** The public profile: display name, description (moderated), logo URL and website. */
export default async function ProfilePage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const profile = await getProfile({ userId: user.id, companyId: membership.companyId });

  if (!profile) {
    return (
      <div className="grid gap-6">
        <PageHeader size="portal" title="Profile" description={item.description} />
        <Alert tone="info" role="none" title="Your profile isn't set up yet">
          <p>It's created from the company details in your application. Save that step first.</p>
          <div className="mt-3">
            <LinkButton href="/portal/application?step=company" variant="secondary">
              Go to company details
            </LinkButton>
          </div>
        </Alert>
      </div>
    );
  }

  const status = STATUS[profile.publicStatus];
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title="Profile" description="How your company appears in the mover directory." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card title="Profile details" titleAs="h2">
          <ProfileForm
            initial={{ displayName: profile.displayName, description: profile.description ?? "", logoUrl: profile.logoUrl ?? "", website: profile.website ?? "" }}
            maxDescription={PROFILE_LIMITS.description}
          />
        </Card>
        <div className="grid content-start gap-6">
          <Card title="Public status" titleAs="h2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <p className="mt-3 text-text-2">{status.text}</p>
            <p className="mt-3 type-small text-text-3">
              Last updated <AbsoluteDate value={profile.updatedAt} withTime />
            </p>
            <p className="mt-3">
              <a href={profile.publicUrl} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
                Preview your public profile
                <ExternalLinkIcon size={16} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
            {profile.publicStatus !== "live" ? <p className="type-small text-text-3">The public page shows your profile only while it's live.</p> : null}
          </Card>
          <Card title="What the profile shows" titleAs="h2">
            <ul className="grid list-disc gap-2 pl-5 type-small text-text-2">
              <li>Your USDOT and MC numbers, verification status and last-checked date, with links to the official FMCSA records.</li>
              <li>Your services and coverage areas, from the Coverage page.</li>
              <li>Genuine reviews and your responses. We never show a rating without reviews.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

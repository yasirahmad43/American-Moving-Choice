import { requireMembership } from "@amc/server/auth";
import {
  APPLICATION_STEPS,
  MAX_STATE_CREDENTIALS,
  MOVER_TERMS_SECTIONS,
  MOVER_TERMS_STATUS_NOTE,
  MOVER_TERMS_VERSION,
  REQUIRED_STEPS,
  STEP_TITLES,
  getApplication,
  isApplicationStep,
  nextIncompleteStep,
  type ApplicationStep,
} from "@amc/server/companies";
import { Alert, Card, CheckCircleIcon, CompanyStatusPill, LinkButton, PageHeader, Stepper, cx } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { portalNavItem } from "@/lib/nav/portal";
import { stepInitialValues, stepOptions } from "@/components/portal/onboarding/application-data";
import { ApplicationStepForm, SubmitApplicationForm } from "@/components/portal/onboarding/application-step-form";
import { ApplicationSummary } from "@/components/portal/onboarding/application-summary";

const item = portalNavItem("/portal/application");

export const metadata: Metadata = { title: item.label };

const STEP_INTROS: Record<ApplicationStep, string> = {
  company: "Your company as registered with FMCSA. We compare these details with the official record.",
  identifiers: "Your federal numbers. We look them up in FMCSA's records when you submit.",
  services: "What your company offers. This is the ceiling for the requests you can receive.",
  areas: "Where you pick up and deliver. This creates your first coverage rules.",
  credentials: "The state licenses or registrations your intrastate work needs.",
  insurance: "Your current certificate of insurance.",
  representative: "The person who can act for the company and accept our terms.",
  review: "Check your answers, read the mover terms and submit.",
};

/** The company application wizard (mover verification §2) with saved progress. */
export default async function ApplicationPage({ searchParams }: { searchParams: Promise<{ step?: string; saved?: string }> }) {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const view = await getApplication({ userId: user.id, companyId: membership.companyId });
  const params = await searchParams;
  const requested = isApplicationStep(params.step) ? params.step : null;
  const step: ApplicationStep = requested ?? (view.editable ? nextIncompleteStep(view.completedSteps) : "review");
  const index = APPLICATION_STEPS.indexOf(step);
  const previous = index > 0 ? APPLICATION_STEPS[index - 1]! : null;
  const savedStep = isApplicationStep(params.saved) ? params.saved : null;
  const remaining = REQUIRED_STEPS.filter((s) => !view.completedSteps.includes(s));

  const header = (
    <PageHeader
      size="portal"
      title="Your application"
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          {membership.companyName} <CompanyStatusPill status={view.status} />
        </span>
      }
    />
  );

  if (!view.editable) {
    return (
      <div className="grid gap-6">
        {header}
        <Alert tone={view.status === "approved" ? "success" : "info"} title={view.status === "approved" ? "Your company is approved" : "Your application has been submitted"}>
          <p>
            {view.status === "approved"
              ? "Your application is complete. To change your company details, numbers or credentials, contact us so a reviewer can check the change."
              : "We're checking it now, so it can't be edited. Follow each check on the Verification page. If something changed, contact us."}
          </p>
          <p className="mt-2">
            <Link href="/portal/verification" className="link">
              See your verification checks
            </Link>
          </p>
        </Alert>
        <Card title="Your answers" titleAs="h2">
          <ApplicationSummary data={view.data} editable={false} />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {header}
      {view.status === "rejected" ? (
        <Alert tone="error" title="Your application wasn't accepted">
          <p>{view.latestReason ?? "A reviewer couldn't accept the application."}</p>
          <p className="mt-2">If the problem is fixed (for example the FMCSA record was corrected), update your answers and submit again.</p>
        </Alert>
      ) : null}
      {savedStep && savedStep !== step ? (
        <Alert tone="success" role="status">
          Saved {STEP_TITLES[savedStep].toLowerCase()}. You can leave and come back; your progress is kept.
        </Alert>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Application steps" className="lg:sticky lg:top-6 lg:self-start">
          <ol className="grid gap-1">
            {APPLICATION_STEPS.map((s, n) => {
              const done = view.completedSteps.includes(s);
              const current = s === step;
              return (
                <li key={s}>
                  <Link
                    href={`/portal/application?step=${s}`}
                    aria-current={current ? "step" : undefined}
                    className={cx(
                      "flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-text no-underline hover:bg-surface",
                      current && "bg-surface font-semibold shadow-[inset_3px_0_0_var(--primary)]",
                    )}
                  >
                    <span className="tabular w-5 text-text-3" aria-hidden="true">
                      {n + 1}
                    </span>
                    <span className="min-w-0 flex-1">{STEP_TITLES[s]}</span>
                    {done ? (
                      <>
                        <CheckCircleIcon size={18} className="shrink-0 text-success" aria-hidden="true" />
                        <span className="sr-only">(saved)</span>
                      </>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

        <Card padding="lg">
          <Stepper current={index + 1} total={APPLICATION_STEPS.length} label={STEP_TITLES[step]} className="mb-5" />
          <h2 className="type-h3 text-text">{STEP_TITLES[step]}</h2>
          <p className="mb-6 mt-1 text-text-2">{STEP_INTROS[step]}</p>

          {step === "review" ? (
            <div className="grid gap-6">
              {remaining.length ? (
                <Alert tone="warning" title="A few steps are still open">
                  <ul className="mt-1 grid gap-1">
                    {remaining.map((s) => (
                      <li key={s}>
                        <Link href={`/portal/application?step=${s}`} className="link">
                          {STEP_TITLES[s]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Alert>
              ) : null}
              <ApplicationSummary data={view.data} editable />
              <section aria-labelledby="terms-heading" className="rounded-control border border-border bg-surface-2 p-5">
                <h3 id="terms-heading" className="type-h4 text-text">
                  Mover terms (summary)
                </h3>
                <p className="mt-1 type-small text-text-3">
                  Version <span className="font-mono">{MOVER_TERMS_VERSION}</span>. {MOVER_TERMS_STATUS_NOTE}
                </p>
                <ol className="mt-4 grid list-decimal gap-3 pl-5">
                  {MOVER_TERMS_SECTIONS.map((section) => (
                    <li key={section.title} className="pl-1">
                      <span className="font-semibold text-text">{section.title}.</span> <span className="text-text-2">{section.body}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <p className="text-text-2">
                When you submit, we check your USDOT and MC numbers against FMCSA records right away. Companies with broker authority, including dual carrier
                and broker registrations, can&apos;t join. A reviewer then looks at the results and calls the phone number on your FMCSA record.
              </p>
              {remaining.length === 0 ? <SubmitApplicationForm termsVersion={MOVER_TERMS_VERSION} /> : null}
              {previous ? (
                <div>
                  <LinkButton href={`/portal/application?step=${previous}`} variant="secondary">
                    Back
                  </LinkButton>
                </div>
              ) : null}
            </div>
          ) : (
            <ApplicationStepForm
              key={step}
              step={step}
              initial={stepInitialValues(step, view)}
              options={stepOptions()}
              requireMc={view.requireMc}
              maxCredentials={MAX_STATE_CREDENTIALS}
              backHref={previous ? `/portal/application?step=${previous}` : null}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

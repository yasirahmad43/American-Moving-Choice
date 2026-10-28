"use client";

/**
 * The report form (VD §9.2): labels above fields, help and errors linked with aria-describedby, a
 * polite count of fields that need attention and focus on the first one, and a confirmation with
 * the case reference that takes focus. Works without JavaScript (server action form post).
 */
import { Alert, Button, Field, FieldError, Input, Textarea, errorId } from "@amc/ui";
import type { ConcernField, ConcernType } from "@amc/server/concerns";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitConcern } from "./actions";
import { HONEYPOT_FIELD, type ConcernFormState } from "./shared";

const ORDER: ConcernField[] = ["caseType", "company", "description", "name", "email", "phone"];

export function ConcernForm({
  types,
  descriptionMax,
}: {
  types: { value: ConcernType; label: string; description: string }[];
  descriptionMax: number;
}) {
  const [state, action, pending] = useActionState<ConcernFormState, FormData>(submitConcern, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const values = state.status === "invalid" || state.status === "failed" ? state.values : {};
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (state.status === "sent" || state.status === "failed") resultRef.current?.focus();
    if (state.status === "invalid") {
      const first = ORDER.find((field) => errors[field]);
      if (!first) return;
      const target =
        first === "caseType"
          ? formRef.current?.querySelector<HTMLInputElement>('input[name="caseType"]:checked, input[name="caseType"]')
          : formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      target?.focus();
    }
    // Runs once per new result from the server action.
  }, [state]);

  if (state.status === "sent") {
    return (
      <div ref={resultRef} tabIndex={-1} className="focus:outline-none">
        <Alert tone="success" title="We received your report.">
          {state.reference ? (
            <p>
              Your case reference is <strong className="tabular font-bold">{state.reference}</strong>. Keep it, and quote it if you write to us about
              this. If you left contact details, we may get in touch to ask more.
            </p>
          ) : (
            <p>If you left contact details, we may get in touch to ask more.</p>
          )}
          <p className="mt-2">
            <Link href="/complaints/" className="link">
              What happens next, and how to complain to FMCSA or your state
            </Link>
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-6" aria-describedby="concern-privacy">
      <p className="sr-only" role="status" aria-live="polite">
        {errorCount ? (errorCount === 1 ? "1 field needs attention." : `${errorCount} fields need attention.`) : ""}
      </p>
      {state.status === "failed" ? (
        <div ref={resultRef} tabIndex={-1} className="focus:outline-none">
          <Alert tone="error" title="Your report wasn't sent">
            {state.message}
          </Alert>
        </div>
      ) : null}

      <fieldset className="grid gap-2" aria-describedby={errors.caseType ? errorId("caseType") : undefined}>
        <legend className="mb-1 text-[0.9375rem] font-semibold text-text">What is your concern about?</legend>
        <div className="grid gap-2">
          {types.map((type) => (
            <label
              key={type.value}
              className="flex min-h-14 cursor-pointer items-start gap-3 rounded-control border-[1.5px] border-border-strong bg-surface px-4 py-3 has-checked:border-2 has-checked:border-primary has-checked:bg-info-bg"
            >
              <input
                type="radio"
                name="caseType"
                value={type.value}
                defaultChecked={values.caseType === type.value}
                aria-invalid={errors.caseType ? true : undefined}
                aria-describedby={`concern-type-${type.value}`}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span className="grid gap-0.5">
                <span className="font-semibold text-text">{type.label}</span>
                <span id={`concern-type-${type.value}`} className="type-small text-text-2">
                  {type.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.caseType ? <FieldError id={errorId("caseType")}>{errors.caseType}</FieldError> : null}
      </fieldset>

      <Field id="company" label="Company" optional help="Its name, or its USDOT or MC number if you have it." error={errors.company}>
        <Input name="company" defaultValue={values.company} autoComplete="organization" />
      </Field>

      <Field
        id="description"
        label="What happened?"
        required
        help={`Dates, what was said and anything you were asked to pay help us most. At least 20 characters, up to ${descriptionMax.toLocaleString("en-US")}.`}
        error={errors.description}
      >
        <Textarea name="description" rows={7} defaultValue={values.description} />
      </Field>

      <fieldset className="grid gap-4 rounded-card border border-border p-4 sm:p-5">
        <legend className="px-1 text-[0.9375rem] font-semibold text-text">How can we reach you? (optional)</legend>
        <p className="-mt-1 type-small text-text-2">Leave these blank to report without your name. We can&apos;t reply to you then.</p>
        <Field id="name" label="Your name" optional error={errors.name}>
          <Input name="name" defaultValue={values.name} autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="Email" optional error={errors.email}>
            <Input name="email" type="email" defaultValue={values.email} autoComplete="email" />
          </Field>
          <Field id="phone" label="Phone" optional error={errors.phone}>
            <Input name="phone" type="tel" defaultValue={values.phone} autoComplete="tel" />
          </Field>
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and assistive technology; bots that fill every field fill it. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field blank</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <p id="concern-privacy" className="type-small text-text-2">
        Only our team sees your contact details, and we use them only to look into your report.{" "}
        <Link href="/privacy/" className="link">
          Privacy policy
        </Link>
      </p>

      <div>
        <Button type="submit" variant="primary" loading={pending} loadingLabel="Sending…">
          Send report
        </Button>
      </div>
    </form>
  );
}

"use client";

import { Alert, Button, Checkbox, Field, FieldError, Input, RadioCardGroup, Textarea, errorId } from "@amc/ui";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { idleState } from "@/components/directory/form-state";
import { submitReviewAction, type ReviewFormState } from "./actions";

const RATING_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "star" : "stars"}` }));

/** Mirrors EVIDENCE_KIND_LABELS in @amc/server/reviews-public (a client file can't import server modules). */
const EVIDENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "estimate", label: "A written estimate from this mover" },
  { value: "deposit_receipt", label: "A deposit receipt from this mover" },
  { value: "bill_of_lading", label: "A bill of lading signed at delivery" },
  { value: "final_invoice", label: "A final invoice" },
  { value: "delivery_receipt", label: "A delivery receipt" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Send my review
    </Button>
  );
}

export function ReviewForm({ token, reviewType, companyName, slug }: { token: string; reviewType: "quote_experience" | "move_experience"; companyName: string; slug: string | null }) {
  const [state, action] = useActionState(submitReviewAction, idleState as ReviewFormState);
  const messageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isMove = reviewType === "move_experience";
  const experience = isMove ? "the move itself" : "the quote and sales experience";

  useEffect(() => {
    if (state.attempt === 0) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (state.status === "error" && firstInvalid ? firstInvalid : messageRef.current)?.focus();
  }, [state.attempt, state.status]);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} className="grid gap-4 focus:outline-none">
        <Alert tone="success" title="Thank you. We received your review.">
          It's waiting for moderation and isn't published yet. We check every review against our records under the rules in our review
          methodology{isMove ? ", and we'll contact you about the documents you described before giving it a label" : ""}. We never reject a
          review for being negative.
        </Alert>
        <p className="flex flex-wrap gap-x-4">
          <Link href="/review-methodology/" className="link inline-flex min-h-11 items-center">
            How reviews work
          </Link>
          {slug ? (
            <Link href={`/companies/${slug}/`} className="link inline-flex min-h-11 items-center">
              Back to {companyName}
            </Link>
          ) : null}
        </p>
      </div>
    );
  }

  const v = state.values ?? {};
  const str = (key: string) => (typeof v[key as keyof typeof v] === "string" ? (v[key as keyof typeof v] as string) : undefined);
  const kinds = Array.isArray(v.evidenceKinds) ? v.evidenceKinds : [];
  const errors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-6" key={state.attempt}>
      <div ref={messageRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
        {state.status === "error" && state.message ? (
          <Alert tone="error" role="none">
            {state.message}
          </Alert>
        ) : null}
      </div>
      <input type="hidden" name="token" value={token} />

      <RadioCardGroup
        id="rating"
        name="rating"
        legend={`Your rating of ${experience} with ${companyName}`}
        options={RATING_OPTIONS}
        defaultValue={str("rating") || undefined}
        error={errors.rating}
        required
        columns={3}
      />

      <Field id="title" label="A short title" optional error={errors.title}>
        <Input name="title" maxLength={100} defaultValue={str("title")} />
      </Field>

      <Field
        id="body"
        label="Your review"
        help="Describe what happened. Please leave out phone numbers, addresses and other private details, yours or anyone else's."
        error={errors.body}
        required
      >
        <Textarea name="body" rows={6} maxLength={4000} defaultValue={str("body")} />
      </Field>

      <Field
        id="displayName"
        label="Name to show with your review"
        help="We suggest your first name and last initial. Your contact details are never shown."
        error={errors.displayName}
        required
      >
        <Input name="displayName" maxLength={40} autoComplete="off" defaultValue={str("displayName")} />
      </Field>

      {isMove ? (
        <fieldset className="grid gap-3" aria-describedby={["evidence-help", errors.evidenceKinds ? errorId("evidenceKinds") : null].filter(Boolean).join(" ")}>
          <legend className="text-[0.9375rem] font-semibold text-text">Documents you have from this move</legend>
          <p id="evidence-help" className="type-small text-text-2">
            A review of the move counts toward the moving rating only with checked evidence that the move was completed. Uploading documents
            isn't available in this preview: tick what you have and describe it below, and our moderators will ask you for the documents.
            We never publish them.
          </p>
          <div className="grid gap-0">
            {EVIDENCE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                id={`evidence-${option.value}`}
                name="evidenceKinds"
                value={option.value}
                label={option.label}
                defaultChecked={kinds.includes(option.value)}
                {...(errors.evidenceKinds ? { "aria-invalid": true } : {})}
              />
            ))}
          </div>
          {errors.evidenceKinds ? <FieldError id={errorId("evidenceKinds")}>{errors.evidenceKinds}</FieldError> : null}
          <Field id="evidenceDescription" label="Describe the documents" help="For example: bill of lading signed at delivery on June 20." error={errors.evidenceDescription} required>
            <Textarea name="evidenceDescription" rows={3} maxLength={1000} defaultValue={str("evidenceDescription")} />
          </Field>
        </fieldset>
      ) : null}

      <Checkbox
        id="attest"
        name="attest"
        label={`This review describes my own experience with ${companyName}, and no one offered me anything for it.`}
        error={errors.attest}
      />

      <p className="type-small text-text-2">
        Your review is checked before it's published, under the rules in our{" "}
        <Link href="/review-methodology/" className="link">
          review methodology
        </Link>
        . This link works once.
      </p>
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}

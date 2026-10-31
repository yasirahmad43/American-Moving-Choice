"use client";

import { Alert, Button, Field, Input, LinkButton } from "@amc/ui";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { idleState } from "@/components/directory/form-state";
import { findZipGuides, type ZipCheckState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending} loadingLabel="Finding guides…">
      Find my guides
    </Button>
  );
}

/** Postal guide finder: location only, without company availability or matching counts. */
export function ZipCheck() {
  const [state, action] = useActionState(findZipGuides, idleState as ZipCheckState);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.attempt > 0 && state.status === "success") resultRef.current?.focus();
  }, [state.attempt, state.status]);
  const r = state.result;
  return (
    <div className="grid gap-4">
      <form action={action} noValidate className="flex flex-wrap items-end gap-3">
        <Field id="guide-zip" label="Your ZIP code" help="Find the state and city guides for your location." error={state.fieldErrors?.zip} className="w-full max-w-[16rem]">
          <Input name="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} pattern="[0-9]{5}" defaultValue={typeof state.values?.zip === "string" ? state.values.zip : ""} />
        </Field>
        <Submit />
      </form>
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus:outline-none empty:hidden">
        {state.status === "error" && state.message ? <Alert tone="error" role="none">{state.message}</Alert> : null}
        {state.status === "success" && r ? (
          <Alert
            tone="info"
            role="none"
            title={`${r.city}, ${r.stateCode}: explore your moving guides`}
            action={
              <LinkButton href={`/movers/${r.stateSlug}/`} variant="primary" size="sm">
                View {r.stateName} guide
              </LinkButton>
            }
          >
            <p>Read local facts and moving guidance for {r.stateName}, then prepare the details for your own move.</p>
            <p className="mt-3"><LinkButton href={`/explore/?type=city&state=${r.stateCode}`} variant="secondary" size="sm">Browse city guides</LinkButton></p>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

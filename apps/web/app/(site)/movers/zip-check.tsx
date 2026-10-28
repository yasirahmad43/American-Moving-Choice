"use client";

import { Alert, Button, Field, Input, LinkButton } from "@amc/ui";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { idleState } from "@/components/directory/form-state";
import { checkZipCoverage, type ZipCheckState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending} loadingLabel="Checking…">
      Check coverage
    </Button>
  );
}

const movers = (n: number) => `${n} ${n === 1 ? "mover" : "movers"}`;

/** ZIP box for /movers/: the answer appears inline; the ZIP stays out of the URL. */
export function ZipCheck() {
  const [state, action] = useActionState(checkZipCoverage, idleState as ZipCheckState);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.attempt > 0 && state.status === "success") resultRef.current?.focus();
  }, [state.attempt, state.status]);
  const r = state.result;
  return (
    <div className="grid gap-4">
      <form action={action} noValidate className="flex flex-wrap items-end gap-3">
        <Field id="coverage-zip" label="Your ZIP code" help="The ZIP code you're moving from." error={state.fieldErrors?.zip} className="w-full max-w-[16rem]">
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
            title={`${r.city}, ${r.stateCode}: ${r.moversStartingInState ? `${movers(r.moversStartingInState)} in our network cover moves starting in ${r.stateName}` : `no mover in our network covers moves starting in ${r.stateName} yet`}`}
            action={
              <LinkButton href="/get-quotes/" variant="cta" size="sm">
                Start a quote request
              </LinkButton>
            }
          >
            {r.moversStartingInState ? (
              <>
                {r.explicitInState === r.moversStartingInState
                  ? `Each of them lists ${r.stateName} in its coverage.`
                  : `${movers(r.explicitInState)} list ${r.stateName} by name; the others cover moves between states from anywhere.`}{" "}
                Whether one covers your move depends on where you're going, the size of the move and the services you need, so the quote
                survey checks your answers before it asks for any contact details.
              </>
            ) : (
              <>You can still try the quote survey: it tells you before asking for any contact details whether any mover covers your move.</>
            )}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { Alert, Checkbox, Field, Input, LinkButton, Select } from "@amc/ui";
import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { saveStepAction, submitApplicationAction } from "@/app/(portal)/portal/application/actions";
import { ChoiceGroup, type ChoiceOption } from "./choice-group";
import { asFormState, idleState, type ActionState } from "./form-state";

export type EditableStep = "company" | "identifiers" | "services" | "areas" | "credentials" | "insurance" | "representative";

export interface StepOptions {
  states: { value: string; label: string }[];
  moveTypes: ChoiceOption[];
  moveSizes: ChoiceOption[];
  services: ChoiceOption[];
  reach: ChoiceOption[];
  coverages: ChoiceOption[];
}

type Values = Record<string, string | string[]>;

function useValues(state: ActionState, initial: Values) {
  const source = state.status === "error" && state.values ? state.values : initial;
  const one = (name: string) => {
    const v = source[name];
    return typeof v === "string" ? v : "";
  };
  const many = (name: string) => {
    const v = source[name];
    return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
  };
  return { one, many };
}

function StateSelect({ id, name, value, options, required, error, label, help }: { id: string; name: string; value: string; options: StepOptions["states"]; required?: boolean; error?: string; label: string; help?: string }) {
  return (
    <Field id={id} label={label} help={help} error={error} required={required}>
      <Select name={name} defaultValue={value}>
        <option value="">Choose a state</option>
        {options.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function ApplicationStepForm({
  step,
  initial,
  options,
  requireMc,
  maxCredentials,
  backHref,
}: {
  step: EditableStep;
  initial: Values;
  options: StepOptions;
  requireMc: boolean;
  maxCredentials: number;
  backHref: string | null;
}) {
  const [state, action] = useActionState(saveStepAction, idleState);
  const { one, many } = useValues(state, initial);
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    // Keyed by attempt: a fresh form after each response, so every control (selects included)
    // shows the submitted values instead of React's automatic form reset.
    <form key={state.attempt ?? 0} action={action} noValidate className="grid gap-6">
      <input type="hidden" name="step" value={step} />
      <FormMessage state={asFormState(state)} />

      {step === "company" ? (
        <div className="grid gap-5">
          <Field id="legalName" label="Legal company name" help="Exactly as registered with FMCSA." error={err("legalName")} required>
            <Input name="legalName" autoComplete="organization" defaultValue={one("legalName")} />
          </Field>
          <Field id="dbaName" label="DBA (doing business as)" optional help="The name customers know you by, if different." error={err("dbaName")}>
            <Input name="dbaName" defaultValue={one("dbaName")} />
          </Field>
          <Field id="addressLine1" label="Street address" help="Your physical place of business. We can't accept a PO box or mailbox." error={err("addressLine1")} required>
            <Input name="addressLine1" autoComplete="address-line1" defaultValue={one("addressLine1")} />
          </Field>
          <Field id="addressLine2" label="Suite or unit" optional error={err("addressLine2")}>
            <Input name="addressLine2" autoComplete="address-line2" defaultValue={one("addressLine2")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-[2fr_1.4fr_1fr]">
            <Field id="city" label="City" error={err("city")} required>
              <Input name="city" autoComplete="address-level2" defaultValue={one("city")} />
            </Field>
            <StateSelect id="state" name="state" label="State" value={one("state")} options={options.states} error={err("state")} required />
            <Field id="zip" label="ZIP code" error={err("zip")} required>
              <Input name="zip" inputMode="numeric" autoComplete="postal-code" defaultValue={one("zip")} />
            </Field>
          </div>
          <Field id="phone" label="Company phone" help="A US number. Reviewers also call the number on your FMCSA record." error={err("phone")} required>
            <Input type="tel" name="phone" inputMode="tel" autoComplete="tel" defaultValue={one("phone")} />
          </Field>
          <Field id="website" label="Website" optional help="For example www.example.com." error={err("website")}>
            <Input name="website" inputMode="url" autoComplete="url" defaultValue={one("website")} />
          </Field>
        </div>
      ) : null}

      {step === "identifiers" ? (
        <div className="grid gap-5">
          <Field id="usdot" label="USDOT number" help="Digits only. We check it against FMCSA's records when you submit." error={err("usdot")} required>
            <Input name="usdot" inputMode="numeric" autoComplete="off" className="tabular" defaultValue={one("usdot")} />
          </Field>
          <Field
            id="mc"
            label="MC number"
            optional={!requireMc}
            help={requireMc ? "Required by our network, for example MC-123456." : "If you have one, for example MC-123456."}
            error={err("mc")}
            required={requireMc}
          >
            <Input name="mc" autoComplete="off" className="tabular" defaultValue={one("mc")} aria-describedby="mc-explainer" />
          </Field>
          <Alert tone="info" role="none" title={requireMc ? "Why we ask for an MC number" : "About MC numbers"}>
            <p id="mc-explainer">
              {requireMc
                ? "An MC number is our network's requirement, not a legal requirement for every moving business. Many local movers that only work inside one state legitimately have no MC number, and FMCSA plans to stop issuing new MC numbers. For now our network accepts companies with both a USDOT and an MC number; we review this rule before FMCSA's change takes effect."
                : "Our network doesn't currently require an MC number. If you hold interstate operating authority, enter your MC number so we can check it."}
            </p>
          </Alert>
        </div>
      ) : null}

      {step === "services" ? (
        <div className="grid gap-6">
          <p className="text-text-2">
            This is the most you offer. Your coverage rules can narrow it later but never widen it, and you only receive requests within it.
          </p>
          <ChoiceGroup name="moveTypes" legend="Move types" options={options.moveTypes} selected={many("moveTypes")} error={err("moveTypes")} />
          <ChoiceGroup name="moveSizes" legend="Move sizes" options={options.moveSizes} selected={many("moveSizes")} error={err("moveSizes")} columns={2} />
          <ChoiceGroup name="services" legend="Services" options={options.services} selected={many("services")} error={err("services")} />
        </div>
      ) : null}

      {step === "areas" ? (
        <div className="grid gap-6">
          <ChoiceGroup
            name="states"
            legend="States you work in"
            help="You can add counties, ZIP codes, routes and exclusions on the Coverage page later."
            options={options.states}
            selected={many("states")}
            error={err("states")}
            columns={4}
          />
          <ChoiceGroup name="reach" type="radio" legend="Which moves do you take in these states?" options={options.reach} selected={many("reach")} error={err("reach")} />
          <p className="type-small text-text-2">Saving this step replaces the coverage rules it created before. Rules you added on the Coverage page stay.</p>
        </div>
      ) : null}

      {step === "credentials" ? (
        <div className="grid gap-6">
          <p className="text-text-2">
            Intrastate moves need the state&apos;s own credential in many states (for example a Cal-T number in California, a TxDMV number in Texas, an FDACS
            registration in Florida or NYSDOT authority in New York). List the ones you hold. A reviewer checks each against the state&apos;s lookup.
          </p>
          {err("rows") ? <Alert tone="error">{err("rows")}</Alert> : null}
          {Array.from({ length: maxCredentials }, (_, i) => (
            <fieldset key={i} className="grid gap-4 rounded-control border border-border p-4 sm:grid-cols-2">
              <legend className="px-1 font-semibold text-text">Credential {i + 1}</legend>
              <StateSelect id={`rows.${i}.state`} name={`rows.${i}.state`} label="Issuing state" value={one(`rows.${i}.state`)} options={options.states} error={err(`rows.${i}.state`)} />
              <Field id={`rows.${i}.number`} label="Credential number" error={err(`rows.${i}.number`)}>
                <Input name={`rows.${i}.number`} autoComplete="off" defaultValue={one(`rows.${i}.number`)} />
              </Field>
              <Field id={`rows.${i}.issuer`} label="Issuing agency" optional error={err(`rows.${i}.issuer`)}>
                <Input name={`rows.${i}.issuer`} defaultValue={one(`rows.${i}.issuer`)} />
              </Field>
              <Field id={`rows.${i}.expiresOn`} label="Expiry date" optional error={err(`rows.${i}.expiresOn`)}>
                <Input type="date" name={`rows.${i}.expiresOn`} defaultValue={one(`rows.${i}.expiresOn`)} />
              </Field>
            </fieldset>
          ))}
          <Checkbox
            id="noneRequired"
            name="noneRequired"
            label="None apply to our work"
            description="For example, you only do interstate moves, or your states don't license movers."
            defaultChecked={one("noneRequired") === "on"}
            error={err("noneRequired")}
          />
        </div>
      ) : null}

      {step === "insurance" ? (
        <div className="grid gap-5">
          <p className="text-text-2">
            Details from your certificate of insurance. Uploading the certificate itself isn&apos;t available in this preview; a reviewer may ask you for it.
          </p>
          <Field id="insurer" label="Insurance company" error={err("insurer")} required>
            <Input name="insurer" defaultValue={one("insurer")} />
          </Field>
          <Field id="policyNumber" label="Policy number" error={err("policyNumber")} required>
            <Input name="policyNumber" autoComplete="off" defaultValue={one("policyNumber")} />
          </Field>
          <Field id="expiresOn" label="Policy expiry date" help="We remind you before it expires." error={err("expiresOn")} required>
            <Input type="date" name="expiresOn" defaultValue={one("expiresOn")} />
          </Field>
          <ChoiceGroup name="coverages" legend="What the certificate covers" options={options.coverages} selected={many("coverages")} error={err("coverages")} columns={2} />
        </div>
      ) : null}

      {step === "representative" ? (
        <div className="grid gap-5">
          <p className="text-text-2">The person who can legally bind the company, such as an owner or officer. They accept the mover terms on the last step.</p>
          <Field id="name" label="Full name" error={err("name")} required>
            <Input name="name" autoComplete="name" defaultValue={one("name")} />
          </Field>
          <Field id="title" label="Job title" error={err("title")} required>
            <Input name="title" autoComplete="organization-title" defaultValue={one("title")} />
          </Field>
          <Field id="email" label="Email" error={err("email")} required>
            <Input type="email" name="email" inputMode="email" autoComplete="email" defaultValue={one("email")} />
          </Field>
          <Field id="phone" label="Mobile number" error={err("phone")} required>
            <Input type="tel" name="phone" inputMode="tel" autoComplete="tel" defaultValue={one("phone")} />
          </Field>
          <Checkbox
            id="attest"
            name="attest"
            label="This person is authorized to act for the company and to bind it to agreements."
            description="Giving false information is grounds to reject the application or remove the company."
            defaultChecked={one("attest") === "on" || one("attest") === "true"}
            error={err("attest")}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save and continue</SubmitButton>
        {backHref ? (
          <LinkButton href={backHref} variant="secondary">
            Back
          </LinkButton>
        ) : null}
      </div>
    </form>
  );
}

export function SubmitApplicationForm({ termsVersion }: { termsVersion: string }) {
  const [state, action] = useActionState(submitApplicationAction, idleState);
  return (
    <form action={action} noValidate className="grid gap-5">
      <input type="hidden" name="termsVersion" value={termsVersion} />
      <FormMessage state={asFormState(state)} />
      <Checkbox
        id="acceptTerms"
        name="acceptTerms"
        label="On behalf of the company, I accept the mover terms summarized above."
        description="Your acceptance is recorded with the terms version, your name and the time."
        error={state.fieldErrors?.acceptTerms ?? state.fieldErrors?.termsVersion}
        defaultChecked={false}
      />
      <div>
        <SubmitButton>Submit application</SubmitButton>
      </div>
    </form>
  );
}

"use client";

/**
 * Home hero survey entry (VD §13.1; implications §2.1, §8.2): only the From and To ZIP fields and
 * the CTA. On submit the ZIPs go to sessionStorage (amc.survey.prefill) and the visitor moves to
 * /get-quotes/ with no query string: ZIP codes never go in URLs (site architecture §8.8). Nothing is
 * sent to the server or to analytics from this form.
 */
import { Button, FieldError } from "@amc/ui";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

export const PREFILL_STORAGE_KEY = "amc.survey.prefill";
const GET_QUOTES_PATH = "/get-quotes/";

/** Digits only, first five kept: " 02108-1234" → "02108" (VD §9.2: no maxlength, clean on input). */
export function cleanZip(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

type Errors = { from?: string; to?: string };

const zipError = (zip: string, which: "from" | "to") =>
  /^\d{5}$/.test(zip) ? undefined : which === "from" ? "Enter the 5-digit ZIP code you're moving from." : "Enter the 5-digit ZIP code you're moving to.";

export function HeroZipForm({ moneyLine }: { moneyLine: ReactNode }) {
  const router = useRouter();
  const id = useId();
  const [fromZip, setFromZip] = useState("");
  const [toZip, setToZip] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [announcement, setAnnouncement] = useState("");
  const [pending, setPending] = useState(false);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const ids = { from: `${id}-from`, to: `${id}-to`, money: `${id}-money` };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = { from: zipError(fromZip, "from"), to: zipError(toZip, "to") };
    setErrors(next);
    const count = Number(Boolean(next.from)) + Number(Boolean(next.to));
    if (count) {
      setAnnouncement(count === 1 ? "1 field needs attention." : `${count} fields need attention.`);
      (next.from ? fromRef : toRef).current?.focus();
      return;
    }
    setAnnouncement("");
    setPending(true);
    try {
      // The survey reads and clears this key; it shows both values for the visitor to confirm.
      sessionStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify({ entry: "household", originZip: fromZip, destZip: toZip }));
    } catch {
      // Storage blocked (private mode, policy): the survey still opens and asks for both ZIPs.
    }
    router.push(GET_QUOTES_PATH);
  }

  const describedBy = (field: "from" | "to") => [errors[field] ? `${ids[field]}-error` : null, `${ids[field]}-help`].filter(Boolean).join(" ");

  return (
    // The inputs carry no name, so even a submit without JavaScript sends no ZIP code anywhere: it
    // simply opens the survey (action), which asks for both ZIPs again.
    <form action={GET_QUOTES_PATH} method="get" noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className="grid gap-5">
      <h2 id={`${id}-title`} className="type-h3 text-text">
        Where are you moving?
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["from", "to"] as const).map((field) => {
          const value = field === "from" ? fromZip : toZip;
          return (
            <div key={field} className="grid min-w-0 gap-1.5">
              <label htmlFor={ids[field]} className="text-[0.9375rem] font-semibold text-text">
                {field === "from" ? "Moving from (ZIP code)" : "Moving to (ZIP code)"}
              </label>
              <input
                ref={field === "from" ? fromRef : toRef}
                id={ids[field]}
                type="text"
                inputMode="numeric"
                autoComplete={field === "from" ? "postal-code" : "off"}
                value={value}
                onChange={(event) => {
                  const cleaned = cleanZip(event.target.value);
                  if (field === "from") setFromZip(cleaned);
                  else setToZip(cleaned);
                  if (errors[field] && /^\d{5}$/.test(cleaned)) setErrors((current) => ({ ...current, [field]: undefined }));
                }}
                aria-invalid={errors[field] ? true : undefined}
                aria-describedby={describedBy(field)}
                className="block min-h-12 w-full rounded-control border-[1.5px] border-border-strong bg-surface px-3.5 py-2.5 text-[1.0625rem] tabular text-text focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-focus aria-invalid:border-2 aria-invalid:border-error"
              />
              <p id={`${ids[field]}-help`} className="type-small text-text-3">
                5 digits, for example 02108
              </p>
              {errors[field] ? <FieldError id={`${ids[field]}-error`}>{errors[field]}</FieldError> : null}
            </div>
          );
        })}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="grid gap-3">
        <Button type="submit" variant="cta" fullWidth loading={pending} loadingLabel="Opening the survey…" aria-describedby={ids.money}>
          Get my moving quotes
        </Button>
        <div id={ids.money} className="type-small text-text-2">
          {moneyLine}
        </div>
      </div>
    </form>
  );
}

"use client";

/**
 * The rate-card editor: local and long-distance values, service prices and the states the card
 * covers. Native inputs; each problem shows under its field with aria-invalid and
 * aria-describedby, and focus moves to the first one after a failed save (VD §9.2).
 */
import { CREW_SIZES, DISTANCE_BANDS, DISTANCE_BAND_LABELS, HOME_SIZES, MOVE_SIZE_LABELS } from "@amc/core";
import { Checkbox, Field, FieldError, Input, cx } from "@amc/ui";
import { useActionState, useState, type ReactNode } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import type { FormState } from "@/lib/form";
import { saveRateCardAction } from "./actions";
import type { RateCardFormState } from "./shared";

export interface StateOption {
  code: string;
  name: string;
}

const initialState: RateCardFormState = { status: "idle", attempt: 0 };

function Group({ id, legend, help, error, children }: { id: string; legend: ReactNode; help?: ReactNode; error?: string; children: ReactNode }) {
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset id={id} className="m-0 grid min-w-0 gap-3 border-0 p-0" aria-describedby={describedBy}>
      <legend className="mb-1 p-0 type-h4 text-text">{legend}</legend>
      {help ? (
        <p id={`${id}-help`} className="-mt-1 type-small text-text-2">
          {help}
        </p>
      ) : null}
      {error ? (
        <div tabIndex={-1} aria-invalid="true" className="focus:outline-none">
          <FieldError id={`${id}-error`}>{error}</FieldError>
        </div>
      ) : null}
      {children}
    </fieldset>
  );
}

export function RateCardForm({ defaults, states }: { defaults: Record<string, string | string[]>; states: StateOption[] }) {
  const [state, action] = useActionState(saveRateCardAction, initialState);
  const values = state.values ?? defaults;
  const text = (name: string) => {
    const value = values[name];
    return typeof value === "string" ? value : "";
  };
  const error = (name: string) => state.fieldErrors?.[name];
  const checkedStates = new Set(Array.isArray(values.states) ? values.states : []);
  const [localOn, setLocalOn] = useState(text("local_enabled") === "on");
  const [ldOn, setLdOn] = useState(text("ld_enabled") === "on");

  const money = (name: string, label: ReactNode, help?: string) => (
    <Field key={`${name}-${state.attempt ?? 0}`} id={name} label={label} help={help} error={error(name)}>
      <Input name={name} inputMode="decimal" autoComplete="off" defaultValue={text(name)} />
    </Field>
  );
  const number = (name: string, label: ReactNode, mode: "decimal" | "numeric" = "decimal") => (
    <Field key={`${name}-${state.attempt ?? 0}`} id={name} label={label} error={error(name)}>
      <Input name={name} inputMode={mode} autoComplete="off" defaultValue={text(name)} />
    </Field>
  );

  return (
    <form action={action} noValidate className="grid gap-8" key={state.attempt ?? 0}>
      <FormMessage state={state as FormState} />

      <Group
        id="states"
        legend="States your card covers"
        help="Your card counts toward ranges for moves that start in these states."
        error={error("states")}
      >
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-4">
          {states.map((s) => (
            <Checkbox key={s.code} id={`state-${s.code}`} name="states" value={s.code} label={s.name} defaultChecked={checkedStates.has(s.code)} />
          ))}
        </div>
      </Group>

      <Group
        id="local"
        legend="Local moves"
        help="Moves within one state, up to the local radius. The calculator multiplies the typical hours by your hourly rate for the typical crew, then adds your travel fee."
        error={error("local_enabled")}
      >
        <Checkbox
          id="local_enabled"
          name="local_enabled"
          value="on"
          label="We price local moves"
          checked={localOn}
          onChange={(event) => setLocalOn(event.target.checked)}
        />
        <div className={cx("grid gap-6", !localOn && "hidden")}>
          <Group id="local.crew" legend="Hourly rate by crew size" help="In dollars per hour. Leave blank any crew size you don't send." error={error("local.crew")}>
            <div className="grid gap-4 sm:grid-cols-4">{CREW_SIZES.map((c) => money(`local.crew.${c}`, `${c} movers ($ per hour)`))}</div>
          </Group>
          <div className="max-w-xs">{money("local.travel", "Truck or travel fee ($)", "Enter 0 if you don't charge one.")}</div>
          <Group
            id="local.sizes"
            legend="Typical job by home size"
            help="The crew hours and crew size you expect. Leave a size blank if you don't move homes of that size."
            error={error("local.sizes")}
          >
            <div className="grid gap-4">
              {HOME_SIZES.map((size) => (
                <div key={size} className="grid gap-4 sm:grid-cols-[10rem_1fr_1fr] sm:items-start">
                  <p className="font-semibold text-text sm:pt-9">{MOVE_SIZE_LABELS[size]}</p>
                  {number(`local.hours.${size}`, `Crew hours, ${MOVE_SIZE_LABELS[size].toLowerCase()}`)}
                  {number(`local.crew_size.${size}`, `Crew size, ${MOVE_SIZE_LABELS[size].toLowerCase()}`, "numeric")}
                </div>
              ))}
            </div>
          </Group>
        </div>
      </Group>

      <Group
        id="long-distance"
        legend="Long-distance moves"
        help="In-state moves beyond the local radius and every interstate move. The calculator multiplies the typical weight by your rate for the distance band."
      >
        <Checkbox id="ld_enabled" name="ld_enabled" value="on" label="We price long-distance moves" checked={ldOn} onChange={(event) => setLdOn(event.target.checked)} />
        <div className={cx("grid gap-6", !ldOn && "hidden")}>
          <Group id="ld.cwt" legend="Rate by distance band" help="In dollars per 100 pounds. Leave blank any band you don't serve." error={error("ld.cwt")}>
            <div className="grid gap-4 sm:grid-cols-3">{DISTANCE_BANDS.map((b) => money(`ld.cwt.${b}`, `${DISTANCE_BAND_LABELS[b]} ($ per 100 lb)`))}</div>
          </Group>
          <Group id="ld.weight" legend="Typical shipment weight by home size" help="In pounds. Leave a size blank if you don't move homes of that size." error={error("ld.weight")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {HOME_SIZES.map((size) => number(`ld.weight.${size}`, `${MOVE_SIZE_LABELS[size]} (lb)`, "numeric"))}
            </div>
          </Group>
        </div>
      </Group>

      <Group
        id="services"
        legend="Services"
        help="Leave a service blank if you don't offer it. When a reader picks services, your card counts only if it prices every one of them."
      >
        <Group id="svc.packing" legend="Packing by home size ($)" error={error("svc.packing")}>
          <div className="grid gap-4 sm:grid-cols-3">{HOME_SIZES.map((size) => money(`svc.packing.${size}`, MOVE_SIZE_LABELS[size]))}</div>
        </Group>
        <Group id="svc.storage" legend="Storage per month by home size ($)" error={error("svc.storage")}>
          <div className="grid gap-4 sm:grid-cols-3">{HOME_SIZES.map((size) => money(`svc.storage.${size}`, MOVE_SIZE_LABELS[size]))}</div>
        </Group>
        <div className="max-w-xs">{money("svc.specialty", "One specialty item, such as a piano ($)")}</div>
      </Group>

      <div className="grid gap-2">
        <p className="type-small text-text-2">Saving replaces your current card. The previous card stays in your history below.</p>
        <div>
          <SubmitButton>Save rate card</SubmitButton>
        </div>
      </div>
    </form>
  );
}

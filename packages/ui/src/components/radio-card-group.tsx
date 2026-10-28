"use client";

/**
 * Choice cards (VD §9.2): native radios inside cards at least 56px tall. The selected card has
 * three signals: a 2px navy edge, the info tint and the native check, never color alone.
 * Nothing is preselected unless the caller passes a value. Arrow keys move between options
 * because the inputs are a native radio group.
 */
import { useState, type ReactNode } from "react";
import { cx } from "../cx";
import { FieldError, errorId, helpId } from "./field";

export interface RadioCardOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Shown under a disabled option to explain why it can't be chosen. */
  disabledReason?: ReactNode;
}

export interface RadioCardGroupProps {
  id: string;
  name: string;
  legend: ReactNode;
  options: RadioCardOption[];
  /** Controlled value. */
  value?: string | null;
  /** Uncontrolled initial value. Leave unset so nothing is preselected. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  columns?: 1 | 2 | 3;
  hideLegend?: boolean;
  className?: string;
}

const columnClasses = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" } as const;

export function RadioCardGroup({
  id,
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  help,
  error,
  required,
  columns = 1,
  hideLegend,
  className,
}: RadioCardGroupProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const selected = controlled ? (value ?? undefined) : internal;
  const describedBy = [help ? helpId(id) : null, error ? errorId(id) : null].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset id={id} className={cx("m-0 grid min-w-0 gap-2.5 border-0 p-0", className)} aria-describedby={describedBy}>
      <legend className={cx("mb-2.5 p-0 text-[0.9375rem] font-semibold text-text", hideLegend && "sr-only")}>{legend}</legend>
      {help ? (
        <p id={helpId(id)} className="-mt-1 mb-1 type-small text-text-3">
          {help}
        </p>
      ) : null}
      <div className={cx("grid gap-2.5", columnClasses[columns])}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const reasonId = option.disabled && option.disabledReason ? `${optionId}-reason` : undefined;
          // Each radio carries the group's help and error too: screen readers announce a fieldset's
          // aria-describedby unevenly, and the error must be heard when focus enters the group.
          const optionDescribedBy = [describedBy, reasonId].filter(Boolean).join(" ") || undefined;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cx(
                "relative flex min-h-14 cursor-pointer items-start gap-3 rounded-control border-[1.5px] border-border-strong bg-surface py-3.5 pl-12 pr-3.5",
                "has-[:checked]:border-2 has-[:checked]:border-primary has-[:checked]:bg-info-bg has-[:checked]:py-[13px] has-[:checked]:pl-[47px] has-[:checked]:pr-[13px]",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-border has-[:disabled]:bg-surface-3",
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                required={required}
                disabled={option.disabled}
                aria-describedby={optionDescribedBy}
                aria-invalid={error ? true : undefined}
                className="absolute left-3.5 top-4 m-0 size-5 cursor-pointer accent-primary focus-visible:outline-none disabled:cursor-not-allowed"
                checked={selected === option.value}
                onChange={(event) => {
                  if (!event.target.checked) return;
                  if (!controlled) setInternal(option.value);
                  onValueChange?.(option.value);
                }}
              />
              <span className="min-w-0">
                <span className={cx("block font-semibold", option.disabled ? "text-text-3" : "text-text")}>{option.label}</span>
                {option.description ? <span className="block type-small text-text-2">{option.description}</span> : null}
                {reasonId ? (
                  <span id={reasonId} className="mt-0.5 block type-small text-text-2">
                    {option.disabledReason}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError id={errorId(id)}>{error}</FieldError> : null}
    </fieldset>
  );
}

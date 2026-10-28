import { FieldError, cx, errorId } from "@amc/ui";
import type { ReactNode } from "react";

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/**
 * A fieldset of checkboxes or radios with a visible legend, help and error (VD §9.2): native
 * inputs, the whole row clickable at 44px, error linked with aria-describedby. Works in server and
 * client components.
 */
export function ChoiceGroup({
  name,
  legend,
  help,
  error,
  options,
  selected,
  type = "checkbox",
  columns = 1,
  idPrefix,
  className,
  legendClassName,
}: {
  name: string;
  legend: ReactNode;
  help?: ReactNode;
  error?: string;
  options: readonly ChoiceOption[];
  selected: readonly string[];
  type?: "checkbox" | "radio";
  columns?: 1 | 2 | 3 | 4;
  idPrefix?: string;
  className?: string;
  legendClassName?: string;
}) {
  const base = idPrefix ?? name;
  const helpId = `${base}-help`;
  const describedBy = [help ? helpId : null, error ? errorId(base) : null].filter(Boolean).join(" ") || undefined;
  const grid = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset className={cx("grid min-w-0 gap-1.5", className)} aria-describedby={describedBy} {...(error ? { "aria-invalid": true } : {})}>
      <legend className={cx("mb-1 text-[0.9375rem] font-semibold text-text", legendClassName)}>{legend}</legend>
      {help ? (
        <p id={helpId} className="type-small text-text-3">
          {help}
        </p>
      ) : null}
      <div className={cx("grid gap-x-4", grid)}>
        {options.map((option) => {
          const id = `${base}-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className={cx("flex min-h-11 items-start gap-3 py-2", option.disabled ? "cursor-not-allowed text-text-3" : "cursor-pointer")}>
              <input
                id={id}
                type={type}
                name={name}
                value={option.value}
                defaultChecked={selected.includes(option.value)}
                disabled={option.disabled}
                {...(error ? { "aria-invalid": true } : {})}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
              />
              <span className="min-w-0">
                <span className={option.disabled ? "text-text-3" : "text-text"}>{option.label}</span>
                {option.description ? <span className="mt-0.5 block type-small text-text-2">{option.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError id={errorId(base)}>{error}</FieldError> : null}
    </fieldset>
  );
}

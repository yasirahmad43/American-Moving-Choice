/**
 * Form controls (VD §9.2): label above, help below, error below that with an icon, aria-invalid
 * and aria-describedby. Controls are 48px tall with 17px text (never under 16px, which stops iOS
 * zoom) and a 1.5px strong edge; focus adds the 3px ring.
 */
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { cx } from "../cx";
import { ChevronDownIcon, ErrorIcon } from "../icons";

/** Shared control styling. Height and horizontal padding are added per control so no two classes set them. */
export const controlClasses =
  "block w-full rounded-control border-[1.5px] border-border-strong bg-surface py-2.5 text-[1.0625rem] text-text " +
  "placeholder:text-text-3 transition-colors duration-[var(--d1)] ease-std " +
  "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-focus " +
  "aria-invalid:border-2 aria-invalid:border-error disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3";

/** Props a Field passes to its control. */
export interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

export interface FieldProps {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Appends "(optional)" to the label. */
  optional?: boolean;
  /** Keeps the label for screen readers only. */
  hideLabel?: boolean;
  /** Floating label (pass 2): the label sits inside the control until it has focus or a value. */
  floating?: boolean;
  className?: string;
  /** One control element (it receives id and ARIA props), or a render function. */
  children: ReactElement<Record<string, unknown>> | ((control: ControlProps) => ReactNode);
}

export const helpId = (id: string) => `${id}-help`;
export const errorId = (id: string) => `${id}-error`;

/** Inline error text with an icon; color is never the only signal. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 type-small font-semibold text-error">
      <ErrorIcon size={18} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Field({ id, label, help, error, required, optional, hideLabel, floating, className, children }: FieldProps) {
  const describedBy = [help ? helpId(id) : null, error ? errorId(id) : null].filter(Boolean).join(" ") || undefined;
  const control: ControlProps = {
    id,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(error ? { "aria-invalid": true as const } : {}),
    ...(required ? { required: true } : {}),
  };
  let rendered: ReactNode;
  if (typeof children === "function") {
    rendered = children(control);
  } else if (isValidElement(children)) {
    const own = children.props["aria-describedby"];
    const ownPlaceholder = children.props.placeholder;
    rendered = cloneElement(children, {
      ...control,
      "aria-describedby": [typeof own === "string" ? own : null, describedBy].filter(Boolean).join(" ") || undefined,
      // A floating label needs :placeholder-shown, so the control always carries a placeholder.
      ...(floating && children.props.placeholder === undefined ? { placeholder: " " } : {}),
      ...(floating && typeof ownPlaceholder === "string" ? { placeholder: ownPlaceholder } : {}),
    });
  }
  const labelNode = (
    <label htmlFor={id} className={cx(floating ? "" : "text-[0.9375rem] font-semibold text-text", hideLabel && "sr-only")}>
      {label}
      {optional ? <span className="font-normal text-text-3"> (optional)</span> : null}
    </label>
  );
  return (
    <div className={cx("grid min-w-0 gap-1.5", className)}>
      {floating && !hideLabel ? (
        <div className="field-float">
          {rendered}
          {labelNode}
        </div>
      ) : (
        <>
          {labelNode}
          {rendered}
        </>
      )}
      {help ? (
        <p id={helpId(id)} className="type-small text-text-3">
          {help}
        </p>
      ) : null}
      {error ? <FieldError id={errorId(id)}>{error}</FieldError> : null}
    </div>
  );
}

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return <input className={cx(controlClasses, "min-h-12 px-3.5", className)} {...(invalid ? { "aria-invalid": true } : {})} {...rest} />;
}

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, rows = 4, ...rest }: TextareaProps) {
  return <textarea rows={rows} className={cx(controlClasses, "min-h-28 px-3.5 leading-normal", className)} {...(invalid ? { "aria-invalid": true } : {})} {...rest} />;
}

export interface SelectProps extends ComponentProps<"select"> {
  invalid?: boolean;
}

/** A native select (keyboard and screen-reader behavior for free) with a drawn chevron. */
export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select className={cx(controlClasses, "min-h-12 appearance-none pl-3.5 pr-11", className)} {...(invalid ? { "aria-invalid": true } : {})} {...rest}>
        {children}
      </select>
      <ChevronDownIcon size={20} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-2" />
    </div>
  );
}

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type" | "id"> {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}

/**
 * A 20px checkbox whose whole row (44px or more) is clickable. Never pre-checked by this
 * component: consent boxes must start unchecked (VD §9.2).
 */
export function Checkbox({ id, label, description, error, className, ...rest }: CheckboxProps) {
  const describedBy = [description ? `${id}-description` : null, error ? errorId(id) : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("grid gap-1", className)}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5">
        <input
          type="checkbox"
          id={id}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
          aria-describedby={describedBy}
          {...(error ? { "aria-invalid": true } : {})}
          {...rest}
        />
        <span className="min-w-0">
          <span className="text-text">{label}</span>
          {description ? (
            <span id={`${id}-description`} className="mt-0.5 block type-small text-text-2">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? <FieldError id={errorId(id)}>{error}</FieldError> : null}
    </div>
  );
}

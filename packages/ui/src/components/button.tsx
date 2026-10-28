/**
 * Buttons (VD §9.1). CTA red is only for starting or sending a quote request (VD §5.3); use
 * primary (navy) for every other main action and danger for destructive ones (with a confirm
 * step). 48px tall, 12px radius, visible focus ring, "Processing…" while loading.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "../cx";
import { ArrowRightIcon } from "../icons";

export type ButtonVariant = "primary" | "cta" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

// Each CSS property comes from exactly one class per state: Tailwind orders same-property
// utilities by its own rules, not by their order in className.
const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-control border-[1.5px] font-semibold leading-none no-underline select-none " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--d1)] ease-std " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-3 disabled:text-text-3 disabled:active:translate-y-0 " +
  "aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-surface-3 aria-disabled:text-text-3";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-depth border-transparent bg-primary text-on-primary hover:bg-primary-hover",
  cta: "btn-depth border-transparent bg-cta text-on-cta hover:bg-cta-hover",
  secondary: "btn-soft border-border-strong bg-surface text-text hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-link underline underline-offset-[0.2em] hover:decoration-2",
  danger: "border-error bg-surface text-error hover:bg-error-bg",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 text-[1.0625rem]",
  sm: "min-h-11 text-base",
};

function padding(variant: ButtonVariant, size: ButtonSize): string {
  if (variant === "ghost") return "px-3";
  // The CTA's arrow circle sits close to the right edge.
  if (variant === "cta") return size === "md" ? "pl-5 pr-2.5" : "pl-4 pr-2";
  return size === "md" ? "px-5" : "px-4";
}

/** Class names for a button-styled element, for cases the components below do not cover. */
export function buttonClasses(options: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}): string {
  const { variant = "primary", size = "md", fullWidth, className } = options;
  return cx(base, sizes[size], padding(variant, size), variants[variant], fullWidth && "w-full", className);
}

/** The CTA's trailing arrow in a translucent circle; nudges right on hover. */
function CtaArrow() {
  return (
    <span className="inline-grid size-[30px] place-items-center rounded-pill bg-white/20 transition-transform duration-[var(--d2)] ease-out group-hover:translate-x-0.5">
      <ArrowRightIcon size={18} />
    </span>
  );
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows "Processing…" (or loadingLabel), sets aria-busy and disables the button. */
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  loadingLabel = "Processing…",
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? loadingLabel : children}
      {variant === "cta" && !loading ? <CtaArrow /> : null}
    </button>
  );
}

export interface LinkButtonProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

/** A link styled as a button (navigation, not an action). */
export function LinkButton({ variant = "primary", size = "md", fullWidth, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
      {variant === "cta" ? <CtaArrow /> : null}
    </Link>
  );
}

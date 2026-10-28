/**
 * Badges, chips and status pills (VD §9.4). Badges are rectangular (8px radius), never round or
 * seal-like; chips and pills are pill-shaped. Text always carries the meaning; color only
 * reinforces it.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { RouteMark } from "../icons";

export type BadgeVariant = "preferred" | "neutral" | "outline";

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Rectangular badge. "preferred" is the screening badge: navy with the route mark. Always render
 * the "What it means" explainer next to it (a <details>, never a hover-only tooltip).
 */
export function Badge({ variant = "neutral", icon, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex min-h-8 items-center gap-2 rounded-badge py-1 text-sm leading-tight font-bold",
        variant === "preferred" ? "pl-2 pr-3" : "px-3",
        variant === "preferred" && "bg-primary text-on-primary",
        variant === "neutral" && "bg-surface-3 text-text-2",
        variant === "outline" && "bg-surface text-text shadow-[inset_0_0_0_1.5px_var(--border-strong)]",
        className,
      )}
    >
      {variant === "preferred" && !icon ? (
        <span className="inline-grid rounded-tag bg-surface px-0.5" aria-hidden="true">
          <RouteMark size={10} />
        </span>
      ) : (
        icon
      )}
      {children}
    </span>
  );
}

export type ChipTone = "neutral" | "info" | "success" | "warning" | "error" | "exclusive" | "shared" | "demo";

export interface ChipProps {
  tone?: ChipTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

const chipTones: Record<ChipTone, string> = {
  neutral: "bg-surface-3 text-text-2",
  info: "bg-info-bg text-info-text",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  exclusive: "bg-primary text-on-primary",
  shared: "bg-surface text-text shadow-[inset_0_0_0_1.5px_var(--border-strong)]",
  demo: "bg-surface text-text-2 outline-dashed outline-[1.5px] -outline-offset-[1.5px] outline-border-strong",
};

/** Pill chip: lead type, "New to our network", "Sponsored" (neutral), "Demo company: fictional" (demo). */
export function Chip({ tone = "neutral", icon, className, children }: ChipProps) {
  return (
    <span className={cx("inline-flex min-h-7 items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[0.8125rem] leading-tight font-bold", chipTones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** The chip every demo company carries on cards and profiles (build plan §8). */
export function DemoChip({ className }: { className?: string }) {
  return (
    <Chip tone="demo" className={className}>
      Demo company: fictional
    </Chip>
  );
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

export interface StatusPillProps {
  tone: StatusTone;
  className?: string;
  children: ReactNode;
}

const pillTones: Record<StatusTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-surface-3 text-text-2", dot: "bg-text-3" },
  info: { pill: "bg-info-bg text-info-text", dot: "bg-info-text" },
  success: { pill: "bg-success-bg text-success", dot: "bg-success" },
  warning: { pill: "bg-warning-bg text-warning", dot: "bg-warning" },
  error: { pill: "bg-error-bg text-error", dot: "bg-error" },
};

/** Status label for tables and headers (admin: Approved, In review, Document expiring, Suspended). */
export function StatusPill({ tone, className, children }: StatusPillProps) {
  return (
    <span className={cx("inline-flex min-h-7 items-center gap-2 rounded-pill px-2.5 py-0.5 text-[0.8125rem] leading-tight font-semibold whitespace-nowrap", pillTones[tone].pill, className)}>
      <span className={cx("size-2 shrink-0 rounded-pill", pillTones[tone].dot)} aria-hidden="true" />
      {children}
    </span>
  );
}

export type CompanyStatusValue = "applied" | "verifying" | "in_review" | "approved" | "rejected" | "suspended";

export const COMPANY_STATUS_LABELS: Record<CompanyStatusValue, string> = {
  applied: "Application started",
  verifying: "Verifying",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const companyStatusTones: Record<CompanyStatusValue, StatusTone> = {
  applied: "neutral",
  verifying: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  suspended: "error",
};

/** A company's status as a pill with its standard label. */
export function CompanyStatusPill({ status, className }: { status: CompanyStatusValue; className?: string }) {
  return (
    <StatusPill tone={companyStatusTones[status]} className={className}>
      {COMPANY_STATUS_LABELS[status]}
    </StatusPill>
  );
}

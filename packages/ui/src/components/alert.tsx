/**
 * Inline alerts (VD §9.9): say what happened, what didn't happen and what to do. Errors use
 * role="alert"; the others role="status". Never the only confirmation of a purchase or consent.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon } from "../icons";

export type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, { box: string; icon: string; Icon: typeof InfoIcon }> = {
  info: { box: "border-l-info-text bg-info-bg", icon: "text-info-text", Icon: InfoIcon },
  success: { box: "border-l-success bg-success-bg", icon: "text-success", Icon: CheckCircleIcon },
  warning: { box: "border-l-warning bg-warning-bg", icon: "text-warning", Icon: WarningIcon },
  error: { box: "border-l-error bg-error-bg", icon: "text-error", Icon: ErrorIcon },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  /** Override the ARIA role (for example "none" for static explanatory panels). */
  role?: "alert" | "status" | "none";
  action?: ReactNode;
  className?: string;
  id?: string;
  children?: ReactNode;
}

export function Alert({ tone = "info", title, role, action, className, id, children }: AlertProps) {
  const { box, icon, Icon } = tones[tone];
  const ariaRole = role ?? (tone === "error" ? "alert" : "status");
  return (
    <div id={id} role={ariaRole === "none" ? undefined : ariaRole} className={cx("flex gap-3 rounded-control border-l-4 px-4 py-3 text-text", box, className)}>
      <Icon size={20} className={cx("mt-0.5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cx("text-text", title ? "mt-0.5" : null)}>{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

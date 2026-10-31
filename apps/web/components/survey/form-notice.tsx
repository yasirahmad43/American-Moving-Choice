import { Alert } from "@amc/ui";
import type { ReactNode } from "react";

interface SurveyNotice {
  tone: "error" | "warning" | "info";
  title: string;
  body?: ReactNode;
}

/** Form-level failures share the same focus target as explicit survey notices. */
export function SurveyFormNotice({ alert, formError }: { alert?: SurveyNotice | null; formError?: string }) {
  const notice = alert ?? (formError ? { tone: "error" as const, title: "We couldn't continue", body: formError } : null);
  if (!notice) return null;
  return (
    <div id="form-alert" tabIndex={-1} className="focus:outline-none">
      <Alert tone={notice.tone} title={notice.title}>
        {notice.body}
      </Alert>
    </div>
  );
}

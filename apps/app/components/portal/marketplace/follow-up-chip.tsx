/** Follow-up chip (VD §9.7): overdue (error), due today (warning), scheduled (neutral), in words. */
import { Chip, formatAbsoluteDate } from "@amc/ui";

export function followUpState(at: Date | null, now = new Date()): "none" | "overdue" | "today" | "scheduled" {
  if (!at) return "none";
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
  const a = day(at);
  const today = day(now);
  if (a < today) return "overdue";
  if (a === today) return "today";
  return "scheduled";
}

export function FollowUpChip({ at }: { at: Date | null }) {
  const state = followUpState(at);
  if (state === "none" || !at) return <span className="text-text-3">Not set</span>;
  const date = formatAbsoluteDate(at);
  if (state === "overdue") return <Chip tone="error">Overdue · {date}</Chip>;
  if (state === "today") return <Chip tone="warning">Due today</Chip>;
  return <Chip tone="neutral">{date}</Chip>;
}

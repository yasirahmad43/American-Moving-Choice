/** Money and dates in tabular figures (VD §6). Money is never animated; dates are always absolute. */
import { cx } from "../cx";
import { formatAbsoluteDate, formatMoney, isoDateTime } from "../format";

export interface MoneyProps {
  /** Integer cents (the database's unit). */
  cents: number;
  /** Round to whole dollars ("$1,235"). */
  whole?: boolean;
  className?: string;
}

export function Money({ cents, whole, className }: MoneyProps) {
  return <span className={cx("tabular whitespace-nowrap", className)}>{formatMoney(cents, { whole })}</span>;
}

export interface AbsoluteDateProps {
  /** Date, ISO timestamp, or YYYY-MM-DD (formatted in UTC so it never shifts a day). */
  value: Date | string;
  withTime?: boolean;
  /** IANA zone for timestamps; US Eastern by default. */
  timeZone?: string;
  month?: "short" | "long";
  className?: string;
}

/** "Oct 27, 2026" in a <time> element; never "3 days ago". */
export function AbsoluteDate({ value, withTime, timeZone, month, className }: AbsoluteDateProps) {
  return (
    <time dateTime={isoDateTime(value)} className={cx("tabular whitespace-nowrap", className)}>
      {formatAbsoluteDate(value, { withTime, timeZone, month })}
    </time>
  );
}

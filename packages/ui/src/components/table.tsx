/**
 * Data table (VD §9.8): 48px rows (40px compact), hairline dividers, no zebra striping, numbers
 * right-aligned in tabular figures, IDs in system monospace. Below 768px each row becomes a
 * stacked card with the column name before each value, so pages never scroll sideways.
 */
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  /** Label shown before the value on small screens; defaults to the header when it is text. */
  mobileLabel?: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Tabular figures, right-aligned (money, counts, dates, USDOT numbers). */
  numeric?: boolean;
  /** System monospace (IDs). */
  mono?: boolean;
  /** Sort state for aria-sort on the header. */
  sort?: "ascending" | "descending" | "none";
  className?: string;
}

export interface TableProps<Row> {
  /** Accessible name; shown as a visible caption unless hideCaption. */
  caption: ReactNode;
  hideCaption?: boolean;
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Shown instead of the table when there are no rows. */
  empty?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function Table<Row>({ caption, hideCaption, columns, rows, rowKey, empty, compact, className }: TableProps<Row>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  const cellPad = compact ? "py-2" : "py-3";
  return (
    <div className={cx("w-full min-w-0", className)}>
      <table className="w-full border-collapse text-left max-md:block">
        <caption className={cx("mb-3 text-left type-h4 text-text", hideCaption && "sr-only")}>{caption}</caption>
        <thead className="max-md:sr-only">
          <tr className="border-b border-border-strong">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={column.sort && column.sort !== "none" ? column.sort : undefined}
                className={cx(
                  "sticky top-0 bg-surface px-3 py-2.5 text-[0.8125rem] font-semibold text-text-2",
                  (column.numeric || column.align === "right") && "text-right",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block max-md:space-y-3">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border align-top max-md:block max-md:rounded-card max-md:border max-md:bg-surface max-md:p-4 max-md:shadow-e1"
            >
              {columns.map((column) => {
                const label = column.mobileLabel ?? (typeof column.header === "string" ? column.header : "");
                return (
                  <td
                    key={column.key}
                    data-label={label}
                    className={cx(
                      "px-3 text-text max-md:flex max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1.5",
                      cellPad,
                      label && "max-md:before:shrink-0 max-md:before:text-[0.8125rem] max-md:before:font-semibold max-md:before:text-text-3 max-md:before:content-[attr(data-label)]",
                      (column.numeric || column.align === "right") && "text-right",
                      column.numeric && "tabular",
                      column.mono && "font-mono text-[0.9375rem]",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

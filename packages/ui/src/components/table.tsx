/**
 * Data table (VD §9.8, pass 2): a sticky header, zebra rows, hover highlight, sortable headers for
 * static lists (client-side, by each cell's data-sort value), right-aligned tabular numerics,
 * status chips, inline mini-bars and sparklines, a row-actions column, loading skeletons, an
 * empty state, a density toggle and a card layout under 720px (depth.css .dt). Server-rendered:
 * only the small TableEnhancer runs on the client, and it never receives the cell renderers.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { TableEnhancer } from "./table-enhancer";

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
  /** Sort state for aria-sort on the header (server-sorted lists). */
  sort?: "ascending" | "descending" | "none";
  /** Client-side sorting for static lists; the value compared, when the cell text is not it. */
  sortable?: boolean;
  sortValue?: (row: Row) => string | number | null | undefined;
  /** 0..1 fill for an inline mini-bar drawn after the cell content. */
  bar?: (row: Row) => number | null | undefined;
  /** Values for an inline sparkline drawn after the cell content. */
  spark?: (row: Row) => number[] | null | undefined;
  /** The row's primary cell: bold and left-aligned in card mode. */
  primary?: boolean;
  /** Stop the column from wrapping. */
  nowrap?: boolean;
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
  /** Row actions, rendered in a trailing column that brightens on hover and focus. */
  actions?: (row: Row) => ReactNode;
  actionsHeader?: ReactNode;
  /** Renders this many skeleton rows instead of the rows. */
  loading?: number;
  /** Show the Comfortable/Compact toggle in the toolbar. Default: on for 6+ rows. */
  densityToggle?: boolean;
  /** Extra toolbar content (filters summary, counts). */
  toolbar?: ReactNode;
  /** Initial client-side sort for static lists. */
  defaultSort?: { key: string; dir: "ascending" | "descending" };
  /** Makes every column sortable client-side (static lists, or one page of a server-paged list). */
  sortable?: boolean;
  /** Stable id for the density preference and the enhancer; derived from the caption otherwise. */
  id?: string;
  /** Vertical scrolling with the sticky header past this height, e.g. "32rem". */
  maxHeight?: string;
  /** Lets each row carry an href: the primary cell becomes a link covering the row on hover. */
  className?: string;
}

function slug(value: ReactNode): string {
  return String(typeof value === "string" ? value : "table")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

/** An inline bar, 0..1, drawn after a value; aria-hidden because the text carries the number. */
export function MiniBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className={cx("mini-bar-track", className)} aria-hidden="true">
      <span className="mini-bar-fill block" style={{ "--v": v.toFixed(3) } as CSSProperties} />
    </span>
  );
}

/** A tiny inline sparkline (polyline) for a short numeric series; aria-hidden. */
export function Sparkline({ values, width = 64, height = 18, className }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`).join(" ");
  const last = values[values.length - 1]!;
  const lx = ((values.length - 1) * step).toFixed(1);
  const ly = (height - 2 - ((last - min) / span) * (height - 4)).toFixed(1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" className={cx("inline-block align-middle text-primary", className)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.2" fill="var(--display-red)" />
    </svg>
  );
}

const SortGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path d="M6 2 2.5 6h7L6 2Z" fill="currentColor" />
    <path d="M6 10 2.5 6.5h7L6 10Z" fill="currentColor" opacity="0.45" />
  </svg>
);

export function Table<Row>({
  caption,
  hideCaption,
  columns,
  rows,
  rowKey,
  empty,
  compact,
  actions,
  actionsHeader = "Actions",
  loading,
  densityToggle,
  toolbar,
  defaultSort,
  sortable: allSortable,
  id,
  maxHeight,
  className,
}: TableProps<Row>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>;
  const tableId = id ?? `dt-${slug(caption)}`;
  const density = compact ? "compact" : "comfortable";
  columns = columns.map((c, i) => ({ ...c, sortable: c.sortable ?? (allSortable && rows.length > 1), primary: c.primary ?? i === 0 }));
  const sortable = columns.filter((c) => c.sortable).map((c) => c.key);
  const showToggle = densityToggle ?? rows.length >= 6;
  const cellPad = "px-3.5";
  const skeletonRows = loading ? Array.from({ length: loading }, (_, i) => i) : [];

  return (
    <div className={cx("grid w-full min-w-0 gap-3", className)}>
      {Boolean(!hideCaption || toolbar || showToggle || sortable.length > 0) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {!hideCaption ? <p className="type-h4 text-text">{caption}</p> : null}
            {toolbar}
          </div>
          <TableEnhancer tableId={tableId} sortable={sortable} defaultSort={defaultSort} density={density} densityToggle={showToggle} />
        </div>
      )}
      <p className="sr-only" aria-live="polite" data-sort-live="" />
      <div id={tableId} data-density={density} className="dt dt-responsive">
        <div className="dt-scroll" style={maxHeight ? ({ "--dt-max-height": maxHeight } as CSSProperties) : undefined}>
          <table>
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                {columns.map((column) => {
                  const label = typeof column.header === "string" ? column.header : column.mobileLabel ?? column.key;
                  const right = column.numeric || column.align === "right";
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      data-key={column.key}
                      data-label={label}
                      aria-sort={column.sort && column.sort !== "none" ? column.sort : undefined}
                      className={cx("px-3.5 py-2.5 text-left", right && "text-right", column.className)}
                    >
                      {column.sortable ? (
                        <button type="button" className={cx("dt-sort", right && "flex-row-reverse")} aria-label={`Sort by ${label}`}>
                          {column.header}
                          <SortGlyph />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {actions ? (
                  <th scope="col" className="px-3.5 py-2.5 text-right">
                    <span className="sr-only">{actionsHeader}</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletonRows.map((i) => (
                    <tr key={`skeleton-${i}`} aria-hidden="true">
                      {columns.map((column, j) => (
                        <td key={column.key} className={cx(cellPad, "py-3")}>
                          <span className="skeleton block h-3.5" style={{ width: `${55 + ((i * 7 + j * 13) % 40)}%` }} />
                        </td>
                      ))}
                      {actions ? <td className={cellPad} /> : null}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr key={rowKey(row)}>
                      {columns.map((column) => {
                        const label = column.mobileLabel ?? (typeof column.header === "string" ? column.header : "");
                        const right = column.numeric || column.align === "right";
                        const sortValue = column.sortValue ? column.sortValue(row) : undefined;
                        const bar = column.bar ? column.bar(row) : null;
                        const spark = column.spark ? column.spark(row) : null;
                        const content = column.cell(row);
                        return (
                          <td
                            key={column.key}
                            data-col={column.key}
                            data-label={label}
                            data-sort={sortValue === null || sortValue === undefined ? undefined : String(sortValue)}
                            className={cx(
                              cellPad,
                              "py-3 text-text",
                              right && "text-right",
                              column.numeric && "tabular",
                              column.mono && "font-mono text-[0.9375rem]",
                              column.primary && "dt-primary",
                              column.nowrap && "whitespace-nowrap",
                              column.className,
                            )}
                          >
                            {bar !== null && bar !== undefined ? (
                              <span className={cx("mini-bar", right && "justify-end")}>
                                <MiniBar value={bar} />
                                <span>{content}</span>
                              </span>
                            ) : spark && spark.length > 1 ? (
                              <span className={cx("inline-flex items-center gap-2", right && "justify-end")}>
                                <Sparkline values={spark} />
                                <span>{content}</span>
                              </span>
                            ) : (
                              content
                            )}
                          </td>
                        );
                      })}
                      {actions ? (
                        <td data-label="" className={cx(cellPad, "py-2 text-right")}>
                          <span className="dt-actions inline-flex flex-wrap justify-end gap-1.5">{actions(row)}</span>
                        </td>
                      ) : null}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

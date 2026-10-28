"use client";

/**
 * Client half of the data table: client-side sorting of static lists (rows re-ordered in the DOM
 * by their data-sort values, so server-rendered cells never cross the client boundary), the
 * density toggle (remembered per table id in localStorage), and aria-sort on the active header.
 * Works on the DOM rendered by Table; without JavaScript the table is simply static.
 */
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "../cx";

export interface TableEnhancerProps {
  tableId: string;
  sortable: string[];
  defaultSort?: { key: string; dir: "ascending" | "descending" };
  density: "compact" | "comfortable";
  densityToggle: boolean;
  children?: ReactNode;
}

function readDensity(id: string): "compact" | "comfortable" | null {
  try {
    const value = localStorage.getItem(`amc.table.density.${id}`);
    return value === "compact" || value === "comfortable" ? value : null;
  } catch {
    return null;
  }
}

export function TableEnhancer({ tableId, sortable, defaultSort, density, densityToggle }: TableEnhancerProps) {
  const [current, setCurrent] = useState<"compact" | "comfortable">(density);

  useEffect(() => {
    const root = document.getElementById(tableId);
    if (!root) return;
    const stored = readDensity(tableId);
    if (stored) {
      root.dataset.density = stored;
      setCurrent(stored);
    }
  }, [tableId]);

  useEffect(() => {
    const root = document.getElementById(tableId);
    if (!root || sortable.length === 0) return;
    const table = root.querySelector("table");
    const body = table?.querySelector("tbody");
    if (!table || !body) return;
    let state: { key: string; dir: "ascending" | "descending" } | null = defaultSort ?? null;
    const original = Array.from(body.querySelectorAll<HTMLTableRowElement>(":scope > tr"));
    const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th[data-key]"));

    const apply = () => {
      for (const th of headers) {
        const key = th.dataset.key;
        if (state && key === state.key) th.setAttribute("aria-sort", state.dir);
        else th.removeAttribute("aria-sort");
      }
      if (!state) {
        for (const row of original) body.appendChild(row);
        return;
      }
      const { key, dir } = state;
      const rows = [...original];
      const value = (row: HTMLTableRowElement) => {
        const cell = row.querySelector<HTMLElement>(`[data-col="${key}"]`);
        const raw = cell?.dataset.sort ?? cell?.textContent?.trim() ?? "";
        const num = Number(raw);
        return raw !== "" && Number.isFinite(num) ? num : raw.toLowerCase();
      };
      rows.sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        let cmp: number;
        if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
        else if (typeof va === "number") cmp = -1;
        else if (typeof vb === "number") cmp = 1;
        else cmp = va.localeCompare(vb, "en", { numeric: true });
        return dir === "ascending" ? cmp : -cmp;
      });
      for (const row of rows) body.appendChild(row);
    };

    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button.dt-sort");
      if (!button || !root.contains(button)) return;
      const th = button.closest<HTMLTableCellElement>("th[data-key]");
      const key = th?.dataset.key;
      if (!key || !sortable.includes(key)) return;
      if (state && state.key === key) state = state.dir === "ascending" ? { key, dir: "descending" } : null;
      else state = { key, dir: "ascending" };
      apply();
      const live = root.querySelector<HTMLElement>("[data-sort-live]");
      if (live) live.textContent = state ? `Sorted by ${th?.dataset.label ?? key}, ${state.dir}.` : "Original order restored.";
    };
    table.addEventListener("click", onClick);
    if (defaultSort) apply();
    return () => table.removeEventListener("click", onClick);
  }, [tableId, sortable, defaultSort]);

  if (!densityToggle) return null;
  const set = (next: "compact" | "comfortable") => {
    const root = document.getElementById(tableId);
    if (root) root.dataset.density = next;
    setCurrent(next);
    try {
      localStorage.setItem(`amc.table.density.${tableId}`, next);
    } catch {
      // Storage blocked: the toggle still works for this page view.
    }
  };
  return (
    <div className="inline-flex rounded-pill border border-border bg-surface p-0.5 shadow-[var(--edge-light)]" role="group" aria-label="Row density">
      {(["comfortable", "compact"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={current === option}
          onClick={() => set(option)}
          className={cx(
            "inline-flex min-h-9 items-center rounded-pill px-3 text-[0.8125rem] font-semibold transition-colors duration-[var(--d1)]",
            current === option ? "bg-primary text-on-primary" : "text-text-2 hover:bg-surface-2 hover:text-text",
          )}
        >
          {option === "comfortable" ? "Comfortable" : "Compact"}
        </button>
      ))}
    </div>
  );
}

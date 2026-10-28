import { CredentialRow } from "@amc/ui";
import type { CredentialRowData } from "@amc/server/profiles";

/** Credential rows (implications §4.2): each with its source, official-record link and absolute check date. */
export function CredentialLedger({ rows }: { rows: CredentialRowData[] }) {
  if (!rows.length) return <p className="text-text-2">No checked credentials to show.</p>;
  return (
    <dl className="border-t border-border">
      {rows.map((row) => (
        <CredentialRow
          key={row.key}
          label={row.label}
          value={row.value}
          status={row.status}
          checkedAt={row.checkedAt}
          sourceUrl={row.sourceUrl}
          sourceLabel={row.sourceLabel}
        />
      ))}
    </dl>
  );
}

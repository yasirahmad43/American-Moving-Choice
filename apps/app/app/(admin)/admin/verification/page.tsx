import { QUEUE_FLAG_LABELS, QUEUE_STAGE_LABELS, verificationQueue } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { runDueJobs } from "@amc/server/jobs";
import { CHECK_LABELS } from "@amc/server/verification";
import { Chip, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { FilterBar, FilterSelect, Mono, When, param } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin/verification");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function VerificationQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin({ roles: item.roles });
  const sp = await searchParams;
  const stage = param(sp.stage);
  const flag = param(sp.flag);
  const rows = await verificationQueue({ stage: stage in QUEUE_STAGE_LABELS ? stage : null, flag: flag in QUEUE_FLAG_LABELS ? flag : null });
  // Rechecks and suspensions are daily cron jobs; opening the queue also runs them when overdue.
  after(async () => {
    try {
      await runDueJobs(["recheck_credentials", "suspend_on_failed_recheck"], 24 * 60, "lazy:verification");
    } catch {
      console.error("[jobs] lazy verification run failed");
    }
  });
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title={item.label} description="Applications waiting for a decision, and approved companies whose latest recheck didn't pass. Oldest first." />
      <FilterBar resetHref="/admin/verification">
        <FilterSelect id="stage" name="stage" label="Stage" value={stage} options={Object.entries(QUEUE_STAGE_LABELS).map(([value, label]) => ({ value, label }))} />
        <FilterSelect id="flag" name="flag" label="Flag" value={flag} options={Object.entries(QUEUE_FLAG_LABELS).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Table
        caption={`Waiting for review (${rows.length})`}
        compact
        rowKey={(r) => r.id}
        rows={rows}
        empty={<p className="text-text-2">Nothing is waiting for review.</p>}
        columns={[
          {
            key: "company",
            header: "Company",
            cell: (r) => (
              <Link href={`/admin/companies/${r.id}?tab=verification`} className="font-semibold text-link underline">
                {r.legal_name}
              </Link>
            ),
          },
          { key: "usdot", header: "USDOT", numeric: true, cell: (r) => <Mono>{r.usdot_number ?? "None"}</Mono> },
          { key: "mc", header: "MC", cell: (r) => <Mono>{r.mc_number ?? "None"}</Mono> },
          { key: "submitted", header: "Submitted", cell: (r) => <When value={r.submitted_at} date /> },
          { key: "stage", header: "Stage", cell: (r) => QUEUE_STAGE_LABELS[r.stage] },
          { key: "age", header: "Age (days)", numeric: true, cell: (r) => r.age_days },
          {
            key: "flags",
            header: "Flags",
            cell: (r) =>
              r.flags.length ? (
                <span className="flex flex-wrap gap-1">
                  {r.flags.map((f) => (
                    <Chip key={f} tone={f === "broker_authority" ? "error" : "warning"}>
                      {QUEUE_FLAG_LABELS[f]}
                    </Chip>
                  ))}
                </span>
              ) : (
                "None"
              ),
          },
          {
            key: "pending",
            header: "Waiting on",
            cell: (r) => (r.failed_checks.length ? `Failed: ${r.failed_checks.map((t) => CHECK_LABELS[t]).join(", ")}. ` : "") + (r.pending_checks.length ? r.pending_checks.map((t) => CHECK_LABELS[t]).join(", ") : "Ready for a decision"),
          },
        ]}
      />
    </div>
  );
}

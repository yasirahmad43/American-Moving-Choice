import { listJobRuns } from "@amc/server/admin";
import { hasAdminRole, requireAdmin } from "@amc/server/auth";
import { JOBS } from "@amc/server/jobs";
import { PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { JsonDetails, Mono, SectionTitle, Status, When, humanize } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";
import { ROLES } from "../_lib/roles";
import { runJobAction } from "./actions";

const item = adminNavItem("/admin/jobs");

export const metadata: Metadata = { title: `${item.label} · Admin` };

export default async function JobsPage() {
  const { adminRole } = await requireAdmin({ roles: item.roles });
  const runs = await listJobRuns(100);
  const canRun = hasAdminRole(adminRole, ROLES.jobs);
  const last = new Map<string, (typeof runs)[number]>();
  for (const run of runs) if (!last.has(run.job_name)) last.set(run.job_name, run);
  return (
    <div className="grid gap-8">
      <PageHeader
        size="portal"
        title={item.label}
        description="Vercel Cron calls each job once a day (Hobby-plan schedule) with the CRON_SECRET; admin pages also run the cheap sweeps when they are overdue. Every run is recorded."
      />
      <section aria-labelledby="jobs">
        <SectionTitle id="jobs">Jobs</SectionTitle>
        <Table
          caption="Jobs"
          hideCaption
          rowKey={(j) => j.slug}
          rows={[...JOBS]}
          columns={[
            { key: "job", header: "Job", cell: (j) => <span className="grid"><span className="font-semibold">{j.label}</span><span className="type-small text-text-2">{j.description}</span></span> },
            { key: "route", header: "Cron route", cell: (j) => <Mono>/api/cron/{j.slug}</Mono> },
            { key: "schedule", header: "Daily at (UTC)", numeric: true, cell: (j) => `${String(j.cronHourUtc).padStart(2, "0")}:00` },
            { key: "last", header: "Last run", cell: (j) => { const run = last.get(j.name); return run ? <span className="grid gap-1"><Status value={run.status} /><When value={run.started_at} /></span> : "Never"; } },
            {
              key: "run",
              header: "Run now",
              cell: (j) =>
                canRun ? (
                  <ActionForm action={runJobAction} submitLabel="Run now" submitVariant="secondary" confirm={{ title: `Run ${j.label.toLowerCase()} now?`, description: j.description, confirmLabel: "Run" }}>
                    <input type="hidden" name="job" value={j.slug} />
                  </ActionForm>
                ) : null,
            },
          ]}
        />
      </section>
      <section aria-labelledby="runs">
        <SectionTitle id="runs">Recent runs</SectionTitle>
        <Table
          caption="Recent runs"
          hideCaption
          compact
          rowKey={(r) => r.id}
          rows={runs}
          empty={<p className="text-text-2">No job has run yet.</p>}
          columns={[
            { key: "job", header: "Job", cell: (r) => humanize(r.job_name) },
            { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
            { key: "started", header: "Started", cell: (r) => <When value={r.started_at} /> },
            { key: "duration", header: "Seconds", numeric: true, cell: (r) => (r.finished_at ? ((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000).toFixed(1) : "Running") },
            { key: "items", header: "Items", numeric: true, cell: (r) => r.items_processed ?? "None" },
            { key: "details", header: "Details", cell: (r) => (r.error ? <span className="text-error">{r.error}</span> : <JsonDetails value={r.details} summary="Show details" />) },
          ]}
        />
      </section>
    </div>
  );
}

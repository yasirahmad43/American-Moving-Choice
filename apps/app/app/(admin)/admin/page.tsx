import { dashboardStats } from "@amc/server/admin";
import { requireAdmin } from "@amc/server/auth";
import { runDueJobs } from "@amc/server/jobs";
import { Card, Money, PageHeader, Table } from "@amc/ui";
import type { Metadata } from "next";
import { after } from "next/server";
import { SectionTitle, StatTile, Status, When, humanize } from "@/components/admin/admin-ui";
import { adminNavItem } from "@/lib/nav/admin";

const item = adminNavItem("/admin");

export const metadata: Metadata = { title: "Admin dashboard" };

/** Cheap sweeps the dashboard runs after responding when they haven't run in 30 minutes. */
const LAZY_JOBS = ["expire_lead_groups", "release_expired_attempts", "deliver_outbox"] as const;

const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "No data");

export default async function AdminDashboard() {
  await requireAdmin({ roles: item.roles });
  const stats = await dashboardStats();
  after(async () => {
    try {
      await runDueJobs(LAZY_JOBS, 30, "lazy:dashboard");
    } catch {
      console.error("[jobs] lazy dashboard run failed");
    }
  });
  const q = stats.queues;
  const leadRows = stats.leadsByStatus;
  return (
    <div className="grid gap-8">
      <PageHeader size="portal" title="Admin dashboard" description="Queues, requests and money for the last 7 and 30 days. Times are US Eastern." />

      <section aria-labelledby="queues">
        <SectionTitle id="queues">Queues</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Pending verifications" value={q.pendingVerifications} href="/admin/verification" note={q.recheckIssues ? `${q.recheckIssues} approved with recheck issues` : undefined} />
          <StatTile label="Open cases" value={q.openCases} href="/admin/cases" note={q.overdueCases ? `${q.overdueCases} past their SLA` : "None past their SLA"} />
          <StatTile label="Pending reviews" value={q.pendingReviews} href="/admin/reviews" note={`${q.openReports} open reports`} />
          <StatTile label="Queued messages" value={q.queuedMessages} href="/admin/mailbox" note={`${q.failedMessages} failed`} />
          <StatTile label="Open quality claims" value={q.openClaims} href="/admin/billing?tab=claims" />
          <StatTile label="Open disputes" value={q.openDisputes} href="/admin/billing?tab=disputes" />
        </div>
      </section>

      <section aria-labelledby="money">
        <SectionTitle id="money" description="Gross charges are what purchases cost (card plus credit). Credits issued are sharing credits, quality-refund credits and positive adjustments. Net revenue is gross charges minus credits issued minus cash refunds.">
          Purchases and revenue
        </SectionTitle>
        <Table
          caption="Purchases and revenue"
          hideCaption
          rowKey={(r) => String(r.days)}
          rows={stats.money}
          columns={[
            { key: "period", header: "Period", cell: (r) => `Last ${r.days} days` },
            { key: "purchases", header: "Purchases", numeric: true, cell: (r) => r.purchases },
            { key: "gross", header: "Gross charges", numeric: true, cell: (r) => <Money cents={r.grossChargesCents} /> },
            { key: "card", header: "Paid by card", numeric: true, cell: (r) => <Money cents={r.cardCollectedCents} /> },
            { key: "credits", header: "Credits issued", numeric: true, cell: (r) => <Money cents={r.creditsIssuedCents} /> },
            { key: "cash", header: "Cash refunds", numeric: true, cell: (r) => <Money cents={r.cashRefundsCents} /> },
            { key: "net", header: "Net revenue", numeric: true, cell: (r) => <Money cents={r.netRevenueCents} /> },
          ]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Requests by status" titleAs="h2" description="Consumer requests submitted today and in the last 7 days.">
          <Table
            caption="Requests by status"
            hideCaption
            compact
            rowKey={(r) => r.status}
            rows={leadRows}
            empty={<p className="text-text-2">No requests in the last 7 days.</p>}
            columns={[
              { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
              { key: "today", header: "Today", numeric: true, cell: (r) => r.today },
              { key: "week", header: "7 days", numeric: true, cell: (r) => r.week },
            ]}
          />
          <h3 className="mt-6 mb-2 type-h4 text-text">Request groups by sale status</h3>
          <Table
            caption="Request groups by sale status"
            hideCaption
            compact
            rowKey={(r) => r.status}
            rows={stats.groupsByStatus}
            empty={<p className="text-text-2">No request groups in the last 7 days.</p>}
            columns={[
              { key: "status", header: "Sale status", cell: (r) => <Status value={r.status} /> },
              { key: "today", header: "Today", numeric: true, cell: (r) => r.today },
              { key: "week", header: "7 days", numeric: true, cell: (r) => r.week },
            ]}
          />
        </Card>
        <Card title="Sell-through, last 30 days" titleAs="h2" description="Purchases divided by the slots consumers allowed (their sharing limits), for requests created in the last 30 days and not withdrawn.">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="type-small font-semibold text-text-2">Sell-through</dt>
              <dd className="text-[1.75rem] font-semibold tabular">{percent(stats.sellThrough.slotsSold, stats.sellThrough.slotsOffered)}</dd>
            </div>
            <div>
              <dt className="type-small font-semibold text-text-2">Requests with a buyer</dt>
              <dd className="text-[1.75rem] font-semibold tabular">{percent(stats.sellThrough.groupsWithBuyer, stats.sellThrough.groups)}</dd>
            </div>
            <div>
              <dt className="type-small font-semibold text-text-2">Slots sold</dt>
              <dd className="tabular">
                {stats.sellThrough.slotsSold} of {stats.sellThrough.slotsOffered}
              </dd>
            </div>
            <div>
              <dt className="type-small font-semibold text-text-2">Request groups</dt>
              <dd className="tabular">{stats.sellThrough.groups}</dd>
            </div>
          </dl>
          <h3 className="mt-6 mb-2 type-h4 text-text">Latest job runs</h3>
          <Table
            caption="Latest job runs"
            hideCaption
            compact
            rowKey={(r) => r.job_name}
            rows={stats.lastJobs}
            empty={<p className="text-text-2">No job has run yet.</p>}
            columns={[
              { key: "job", header: "Job", cell: (r) => humanize(r.job_name) },
              { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
              { key: "started", header: "Started", cell: (r) => <When value={r.started_at} /> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

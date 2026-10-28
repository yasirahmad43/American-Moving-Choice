import { requireMembership } from "@amc/server/auth";
import { CRM_STAGE_LABELS, CRM_STAGES, listRecords, parseCrmFilters, type CrmListItem } from "@amc/server/crm";
import { AbsoluteDate, Button, Chip, EmptyState, Field, Input, LinkButton, Money, PageHeader, Select, Table } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { FollowUpChip } from "@/components/portal/marketplace/follow-up-chip";
import { MOVE_SIZE_LABELS, label, route } from "@/components/portal/marketplace/labels";
import { portalNavItem } from "@/lib/nav/portal";

const item = portalNavItem("/portal/leads");

export const metadata: Metadata = { title: item.label };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const filters = parseCrmFilters(await searchParams);
  const records = await listRecords({ userId: user.id, companyId: membership.companyId }, filters);
  const hasFilters = Object.keys(filters).some((k) => k !== "sort");

  return (
    <div className="grid gap-6">
      <PageHeader
        title={item.label}
        description={
          membership.role === "agent"
            ? "Requests your company bought that are assigned to you, with the customer's contact details."
            : "Requests your company bought, with the customer's contact details."
        }
        size="portal"
        actions={
          <LinkButton href="/portal/pipeline" variant="secondary">
            Pipeline view
          </LinkButton>
        }
      />
      <p className="type-small text-text-2">Notes and activity are private to your company, even on shared requests.</p>

      <form method="get" action="/portal/leads" className="grid gap-4 rounded-card border border-border bg-surface p-5" aria-label="Search and filter purchased requests">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="q" label="Search" help="Customer name, city or reference code">
            <Input type="search" name="q" defaultValue={filters.q ?? ""} />
          </Field>
          <Field id="stage" label="Stage">
            <Select name="stage" defaultValue={filters.stage ?? ""}>
              <option value="">Any stage</option>
              {CRM_STAGES.map((s) => (
                <option key={s} value={s}>
                  {CRM_STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          {membership.role !== "agent" ? (
            <Field id="assignee" label="Assigned to">
              <Select name="assignee" defaultValue={filters.assignee ?? ""}>
                <option value="">Anyone</option>
                <option value="me">Me</option>
                <option value="unassigned">Nobody</option>
              </Select>
            </Field>
          ) : null}
          <Field id="followUp" label="Follow-up">
            <Select name="followUp" defaultValue={filters.followUp ?? ""}>
              <option value="">Any</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">Not set</option>
            </Select>
          </Field>
          <Field id="leadType" label="Exclusive or shared">
            <Select name="leadType" defaultValue={filters.leadType ?? ""}>
              <option value="">Both</option>
              <option value="exclusive">Exclusive</option>
              <option value="shared">Shared</option>
            </Select>
          </Field>
          <Field id="sort" label="Sort by">
            <Select name="sort" defaultValue={filters.sort ?? "newest"}>
              <option value="newest">Newest purchase first</option>
              <option value="oldest">Oldest purchase first</option>
              <option value="follow_up">Follow-up date</option>
              <option value="move_date">Move date</option>
              <option value="value">Estimated value</option>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <LinkButton href="/portal/leads" variant="ghost">
            Clear
          </LinkButton>
        </div>
      </form>

      <Table<CrmListItem> sortable
        caption={`${records.length} purchased ${records.length === 1 ? "request" : "requests"}`}
        rows={records}
        rowKey={(r) => r.recordId}
        empty={
          <EmptyState
            title={hasFilters ? "No purchased requests match" : "No purchased requests yet"}
            description={hasFilters ? "Change or clear the filters." : "Requests you buy in the marketplace appear here with the customer's contact details."}
            action={
              <LinkButton href={hasFilters ? "/portal/leads" : "/portal/marketplace"} variant="secondary">
                {hasFilters ? "Clear filters" : "Open the marketplace"}
              </LinkButton>
            }
          />
        }
        columns={[
          {
            key: "customer",
            header: "Customer",
            cell: (r) => (
              <span className="grid gap-1">
                <Link href={`/portal/leads/${r.purchaseId}`} className="link font-semibold">
                  {r.customerName}
                </Link>
                {r.withdrawn ? <Chip tone="error">Withdrew consent</Chip> : null}
              </span>
            ),
          },
          { key: "route", header: "Route", cell: (r) => route({ city: r.originCity, state: r.originState }, { city: r.destCity, state: r.destState }) },
          { key: "move", header: "Move date", cell: (r) => (r.moveDate ? <AbsoluteDate value={r.moveDate} /> : "Not given") },
          { key: "size", header: "Size", cell: (r) => label(MOVE_SIZE_LABELS, r.moveSize) },
          { key: "stage", header: "Stage", cell: (r) => CRM_STAGE_LABELS[r.stage] },
          { key: "follow", header: "Follow-up", cell: (r) => <FollowUpChip at={r.followUpAt} /> },
          { key: "value", header: "Est. value", numeric: true, cell: (r) => (r.estimatedValueCents === null ? "—" : <Money cents={r.estimatedValueCents} whole />) },
          { key: "assignee", header: "Assigned to", cell: (r) => r.assigneeName ?? "Nobody" },
          { key: "type", header: "Type", cell: (r) => <Chip tone={r.leadType === "exclusive" ? "exclusive" : "shared"}>{r.leadType === "exclusive" ? "Exclusive" : "Shared"}</Chip> },
          { key: "bought", header: "Bought", cell: (r) => <AbsoluteDate value={r.purchasedAt} /> },
        ]}
      />
    </div>
  );
}

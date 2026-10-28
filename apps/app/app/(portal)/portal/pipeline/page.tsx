import { requireMembership } from "@amc/server/auth";
import { CRM_STAGE_LABELS, CRM_STAGES, groupByStage, listRecords, type CrmListItem } from "@amc/server/crm";
import { AbsoluteDate, Chip, EmptyState, LinkButton, Money, PageHeader, Select } from "@amc/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/portal/marketplace/action-form";
import { FollowUpChip } from "@/components/portal/marketplace/follow-up-chip";
import { route } from "@/components/portal/marketplace/labels";
import { portalNavItem } from "@/lib/nav/portal";
import { updateStageAction } from "../leads/actions";

const item = portalNavItem("/portal/pipeline");

export const metadata: Metadata = { title: item.label };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

function PipelineCard({ record }: { record: CrmListItem }) {
  const labelId = `card-${record.recordId}`;
  return (
    <li className="grid gap-2 rounded-control border border-border bg-surface p-3 shadow-e1" aria-labelledby={labelId}>
      <Link id={labelId} href={`/portal/leads/${record.purchaseId}`} className="link font-semibold">
        {record.customerName}
      </Link>
      <p className="type-small text-text-2">{route({ city: record.originCity, state: record.originState }, { city: record.destCity, state: record.destState })}</p>
      <p className="type-small text-text-2">
        Move date: {record.moveDate ? <AbsoluteDate value={record.moveDate} /> : "not given"}
        {record.estimatedValueCents !== null ? (
          <>
            {" "}
            · Est. <Money cents={record.estimatedValueCents} whole />
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <FollowUpChip at={record.followUpAt} />
        <Chip tone={record.leadType === "exclusive" ? "exclusive" : "shared"}>{record.leadType === "exclusive" ? "Exclusive" : "Shared"}</Chip>
        {record.assigneeName ? (
          <span className="inline-grid size-7 place-items-center rounded-pill bg-surface-3 text-[0.75rem] font-bold text-text-2" title={`Assigned to ${record.assigneeName}`}>
            <span aria-hidden="true">{initials(record.assigneeName)}</span>
            <span className="sr-only">Assigned to {record.assigneeName}</span>
          </span>
        ) : null}
        {record.withdrawn ? <Chip tone="error">Withdrew consent</Chip> : null}
      </div>
      <ActionForm action={updateStageAction} hidden={{ purchaseId: record.purchaseId }} submitLabel="Move" className="grid gap-2">
        <label htmlFor={`move-${record.recordId}`} className="type-small font-semibold">
          Move {record.customerName} to…
        </label>
        <Select id={`move-${record.recordId}`} name="stage" defaultValue={record.stage}>
          {CRM_STAGES.map((s) => (
            <option key={s} value={s}>
              {CRM_STAGE_LABELS[s]}
            </option>
          ))}
        </Select>
      </ActionForm>
    </li>
  );
}

export default async function PipelinePage() {
  const { user, membership } = await requireMembership({ roles: item.roles });
  const records = await listRecords({ userId: user.id, companyId: membership.companyId }, { sort: "follow_up" });
  const columns = groupByStage(records);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title={item.label}
        description="Each purchased request by stage. Use “Move to…” on a card to change its stage; marking a request Lost asks for a reason on its page."
        size="portal"
        actions={
          <LinkButton href="/portal/leads" variant="secondary">
            List view
          </LinkButton>
        }
      />
      <p className="type-small text-text-2">Notes and activity are private to your company, even on shared requests.</p>
      {records.length === 0 ? (
        <EmptyState
          title="No purchased requests yet"
          description="Requests you buy in the marketplace appear here, starting in New."
          action={
            <LinkButton href="/portal/marketplace" variant="secondary">
              Open the marketplace
            </LinkButton>
          }
        />
      ) : (
        <div className="relative min-w-0 max-w-full overflow-x-auto pb-2" role="region" aria-label="Pipeline board" tabIndex={0}>
          <div className="grid gap-4 md:grid-flow-col md:auto-cols-[17rem]">
            {columns.map((column) => (
              <section key={column.stage} aria-labelledby={`stage-${column.stage}`} className="grid content-start gap-3 rounded-card bg-surface-2 p-3">
                <header className="sticky top-0">
                  <h2 id={`stage-${column.stage}`} className="type-h4">
                    {column.label} <span className="tabular text-text-2">({column.items.length})</span>
                  </h2>
                  <p className="type-small tabular text-text-2">
                    Est. value <Money cents={column.totalValueCents} whole />
                  </p>
                </header>
                {column.items.length ? (
                  <ul className="grid gap-3">
                    {column.items.map((record) => (
                      <PipelineCard key={record.recordId} record={record} />
                    ))}
                  </ul>
                ) : (
                  <p className="type-small text-text-3">Nothing here.</p>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { EmptyState, PageHeader } from "@amc/ui";

/** Placeholder content for a portal or admin route that a later slice builds. */
export function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} size="portal" />
      <EmptyState
        showMark
        title="This section is being built"
        description="It is part of the preview build plan and will appear here as soon as it is ready. Nothing on this page is live yet."
      />
    </div>
  );
}

import { requireAdmin } from "@amc/server/auth";
import { Card, LinkButton, PageHeader } from "@amc/ui";
import type { Metadata } from "next";
import { adminNavFor } from "@/lib/nav/admin";

export const metadata: Metadata = { title: "Admin dashboard" };

/** Admin dashboard placeholder. The admin slice (S7) replaces it with queues and counts. */
export default async function AdminDashboard() {
  const { adminRole } = await requireAdmin();
  const items = adminNavFor(adminRole).flatMap((section) => section.items).filter((item) => item.href !== "/admin");
  return (
    <div className="grid gap-6">
      <PageHeader size="portal" title="Admin dashboard" description="Queues and counts arrive with the admin slice. These are the sections you can open." />
      <Card title="Admin sections" titleAs="h2">
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href} className="rounded-control border border-border p-4">
              <p className="font-semibold text-text">{item.label}</p>
              <p className="mt-1 type-small text-text-2">{item.description}</p>
              <LinkButton href={item.href} variant="ghost" size="sm" className="-ml-3 mt-1">
                Open {item.label.toLowerCase()}
              </LinkButton>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

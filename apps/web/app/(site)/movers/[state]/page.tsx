import { Breadcrumbs, Container } from "@amc/ui";
import { evaluateStateHub } from "@amc/server/geo-pages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Params = Promise<{ state: string }>;

const load = cache((slug: string) => evaluateStateHub(slug));

/**
 * A state hub exists only when every gate in site architecture §4.1 passes; otherwise 404, never a
 * thin page or "published as noindex" (§4.2). In the preview no hub passes, because the facts,
 * data, FAQ, uniqueness and review gates have no data yet.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const hub = await load((await params).state);
  return hub?.evaluation.publishable ? { title: `Movers in ${hub.state.name}` } : {};
}

export default async function StateHubPage({ params }: { params: Params }) {
  const hub = await load((await params).state);
  if (!hub || !hub.evaluation.publishable) notFound();
  // Unreachable until the gate data exists; the full hub (VD §13.2) is built with that data.
  return (
    <Container className="grid gap-6 section-pad">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Movers", href: "/movers/" }, { label: hub.state.name }]} />
      <h1 className="type-display-l text-text">Movers in {hub.state.name}</h1>
    </Container>
  );
}

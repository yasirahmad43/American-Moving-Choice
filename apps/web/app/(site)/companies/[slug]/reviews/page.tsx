import { Breadcrumbs, Container } from "@amc/ui";
import { REVIEW_TYPES, getProfileReviews } from "@amc/server/profiles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StatusChips } from "@/components/directory/badge-explainer";
import { RatingBlock } from "@/components/directory/ratings";
import { RequestQuoteButton } from "@/components/directory/request-quote-button";
import { ReviewCard } from "@/components/directory/review-card";
import { JsonLd, breadcrumbJsonLd, canonical } from "@/components/directory/seo";

type Params = Promise<{ slug: string }>;

/** Exists only once the company has {{setting.reviews_subpage_min}} eligible reviews (site architecture §1.2). */
const load = cache((slug: string) => getProfileReviews(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};
  return { title: `${data.profile.displayName} reviews`, ...canonical(`/companies/${slug}/reviews/`) };
}

export default async function CompanyReviewsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { profile: p, reviews } = data;
  const path = `/companies/${p.slug}/`;
  return (
    <Container className="grid gap-8 section-pad">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Mover directory", path: "/directory/" },
          { name: p.displayName, path },
          { name: "Reviews", path: `${path}reviews/` },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: "/directory/" }, { label: p.displayName, href: path }, { label: "Reviews" }]} />
      <div className="grid gap-3">
        <h1 className="type-display-l text-text">Reviews of {p.displayName}</h1>
        <StatusChips isDemo={p.isDemo} isNew={p.isNew} joinedAt={p.joinedAt} />
        <p className="max-w-[75ch] text-text-2">
          Reviews collected by American Moving Choice from people whose requests this mover bought. Every mover in our network pays us for the
          requests it buys; payment never changes which reviews we publish or how ratings are calculated. Newest first.{" "}
          <Link href="/review-methodology/" className="link">
            How reviews work
          </Link>
        </p>
        <div>
          <RequestQuoteButton companyId={p.companyId} slug={p.slug} displayName={p.displayName} />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {REVIEW_TYPES.map((type) => (
          <RatingBlock key={type} summary={p.ratings[type]} headingId={`rating-${type}`} />
        ))}
      </div>
      <section aria-labelledby="all-reviews" className="grid gap-4">
        <h2 id="all-reviews" className="type-h3 text-text">
          All reviews, newest first
        </h2>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} companyName={p.displayName} />
        ))}
      </section>
    </Container>
  );
}

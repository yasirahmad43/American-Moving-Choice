import { Alert, Breadcrumbs, Chip, Container, EmptyState, ExternalLinkIcon } from "@amc/ui";
import {
  FMCSA_LI_URL,
  MOVE_SIZE_LABELS,
  MOVE_TYPE_LABELS,
  PROTECT_YOUR_MOVE_URL,
  REVIEW_TYPES,
  SERVICE_LABELS,
  formatMean,
  getProfile,
  type Profile,
} from "@amc/server/profiles";
import { stateByCode } from "@amc/server/geo";
import { fmcsaSnapshotUrl } from "@amc/server/verification";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeWithExplainer, StatusChips } from "@/components/directory/badge-explainer";
import { CoverageSummary } from "@/components/directory/company-card";
import { StoredText } from "@/components/directory/content";
import { CredentialLedger } from "@/components/directory/credential-ledger";
import { CompactRatings, RatingBlock } from "@/components/directory/ratings";
import { RequestQuoteButton } from "@/components/directory/request-quote-button";
import { ReviewCard } from "@/components/directory/review-card";
import { JsonLd, NOINDEX, absoluteUrl, breadcrumbJsonLd, canonical } from "@/components/directory/seo";

type Params = Promise<{ slug: string }>;

const loadProfile = cache((slug: string) => getProfile(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadProfile(slug);
  if (!result) return { title: "Company not found", robots: NOINDEX };
  if (result.kind === "suspended") {
    // 200 with a neutral notice and noindex (site architecture §2.5).
    return { title: result.displayName, robots: NOINDEX };
  }
  const p = result.profile;
  const where = p.basedIn ? ` based in ${p.basedIn.city}, ${p.basedIn.stateName}` : "";
  return {
    title: p.displayName,
    description: `${p.displayName}${where}: USDOT ${p.usdot ?? "on file"}, dated FMCSA checks, coverage and customer reviews collected by American Moving Choice.`.slice(0, 155),
    ...canonical(`/companies/${p.slug}/`),
  };
}

function movingCompanyJsonLd(p: Profile) {
  const url = absoluteUrl(`/companies/${p.slug}/`);
  const identifier = [
    ...(p.usdot ? [{ "@type": "PropertyValue", propertyID: "USDOT", value: p.usdot }] : []),
    ...(p.mcNumber ? [{ "@type": "PropertyValue", propertyID: "MC", value: p.mcNumber.replace(/^MC-/, "") }] : []),
  ];
  const move = p.ratings.move_experience;
  return {
    "@context": "https://schema.org",
    "@type": "MovingCompany",
    "@id": `${url}#company`,
    name: p.displayName,
    url,
    ...(p.basedIn ? { address: { "@type": "PostalAddress", addressLocality: p.basedIn.city, addressRegion: p.basedIn.state, addressCountry: "US" } } : {}),
    ...(p.statesServed.length ? { areaServed: p.statesServed.map((code) => ({ "@type": "State", name: stateByCode(code)?.name ?? code })) } : {}),
    identifier,
    ...(p.website ? { sameAs: [p.website] } : {}),
    // Only the move-experience rating, and only with its visible count (site architecture §8.5).
    ...(move.mean !== null && move.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", name: "Moving experience", ratingValue: formatMean(move.mean), ratingCount: move.count, bestRating: 5, worstRating: 1 } }
      : {}),
  };
}

function SuspendedNotice({ displayName, isDemo, usdot }: { displayName: string; isDemo: boolean; usdot: string | null }) {
  return (
    <Container size="reading" className="grid gap-6 section-pad">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: "/directory/" }, { label: displayName }]} />
      <h1 className="type-display-l text-text">{displayName}</h1>
      {isDemo ? (
        <div>
          <Chip tone="demo">Demo company: fictional</Chip>
        </div>
      ) : null}
      {/* [Owner: notice wording, "not currently part of…" (site architecture §2.5) or "Verification under review" (mover verification §3) — default shown] */}
      <Alert tone="info" role="none" title="Not currently part of the American Moving Choice network">
        This company can't receive new requests through American Moving Choice, and it isn't listed in our directory. Its profile stays
        online so links to it still explain its status.
      </Alert>
      <div className="grid gap-3 text-text">
        <p>If you're dealing with this company, you can:</p>
        <ul className="grid list-disc gap-2 pl-6">
          {usdot ? (
            <li>
              <a href={fmcsaSnapshotUrl(usdot)} className="link" target="_blank" rel="noopener noreferrer">
                Check its current federal record (FMCSA company snapshot)<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ) : null}
          <li>
            <Link href="/report-a-concern/" className="link">
              Report a concern
            </Link>
          </li>
          <li>
            <Link href="/which-companies-receive-my-request/" className="link">
              Withdraw your request
            </Link>{" "}
            if you sent one
          </li>
        </ul>
      </div>
    </Container>
  );
}

export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const result = await loadProfile(slug);
  if (!result) notFound();
  if (result.kind === "suspended") return <SuspendedNotice displayName={result.displayName} isDemo={result.isDemo} usdot={result.usdot} />;
  const p = result.profile;
  const path = `/companies/${p.slug}/`;
  const hasReviews = REVIEW_TYPES.some((t) => p.ratings[t].count > 0) || p.reviews.length > 0;

  return (
    <Container className="grid gap-10 section-pad">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Mover directory", path: "/directory/" },
            { name: p.displayName, path },
          ]),
          movingCompanyJsonLd(p),
        ]}
      />
      <div className="grid gap-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: "/directory/" }, { label: p.displayName }]} />

        <header className="grid gap-6 rounded-card border border-border bg-surface p-5 shadow-e1 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
          <div className="grid content-start gap-4">
            <h1 className="type-display-l text-text">{p.displayName}</h1>
            <StatusChips isDemo={p.isDemo} isNew={p.isNew} joinedAt={p.joinedAt} />
            {p.badge ? <BadgeWithExplainer verifiedDate={p.badge.verifiedDate} usdot={p.usdot} idSuffix="profile" /> : null}
            <CoverageSummary listing={p} limit={2} />
          </div>
          <div className="grid content-start gap-4">
            <CompactRatings ratings={p.ratings} />
            <div className="grid gap-2">
              <div>
                <RequestQuoteButton companyId={p.companyId} slug={p.slug} displayName={p.displayName} />
              </div>
              <p className="type-small text-text-2">Uses our standard request form. You choose how many movers can contact you.</p>
            </div>
            <ul className="grid gap-1 type-small">
              <li>
                <a href="#credentials" className="link">
                  Credentials and checks
                </a>
              </li>
              <li>
                <a href="#reviews" className="link">
                  Customer reviews
                </a>
              </li>
              <li>
                <a href="#contact" className="link">
                  Website and contact
                </a>
              </li>
            </ul>
          </div>
        </header>

        {p.isDemo || p.checkSource === "fixture" ? (
          <Alert tone="info" role="none" title="Demo company">
            This company is fictional. Its checks ran against recorded demo records, not live FMCSA data, so the official links below won't
            find it. Its reviews are sample data.
          </Alert>
        ) : null}
      </div>

      {p.noBrokerClaim ? (
        <aside aria-label="Movers only" className="max-w-[75ch] rounded-card border border-border bg-surface-2 p-5 text-text">
          <StoredText id="ST-2" links={{ "How we verify movers": { href: "/how-we-verify-movers/" } }} />
        </aside>
      ) : null}

      <section aria-labelledby="overview" className="grid max-w-[75ch] gap-3">
        <h2 id="overview" className="type-h3 text-text">
          About {p.displayName}
        </h2>
        <div className="grid gap-2 rounded-card border border-dashed border-border-strong p-5">
          <p className="type-overline text-text-2">Provided by the company</p>
          <p className="whitespace-pre-line text-text">{p.description ?? "This company hasn't added a description yet."}</p>
          <p className="type-small text-text-2">Company-written and moderated by us. We don't check claims made here; the checked facts are under Credentials and checks.</p>
        </div>
      </section>

      <section aria-labelledby="services" className="grid gap-4">
        <h2 id="services" className="type-h3 text-text">
          Services and move sizes
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="grid content-start gap-2">
            <h3 className="type-h4 text-text">Kinds of move</h3>
            <ul className="grid list-disc gap-1 pl-5 text-text">
              {p.moveTypes.map((t) => (
                <li key={t}>{MOVE_TYPE_LABELS[t]}</li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-2">
            <h3 className="type-h4 text-text">Services</h3>
            <ul className="grid list-disc gap-1 pl-5 text-text">
              {p.services.map((s) => (
                <li key={s}>{SERVICE_LABELS[s]}</li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-2">
            <h3 className="type-h4 text-text">Move sizes</h3>
            <ul className="grid list-disc gap-1 pl-5 text-text">
              {p.moveSizes.map((s) => (
                <li key={s}>{MOVE_SIZE_LABELS[s]}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="coverage" className="grid max-w-[75ch] gap-3">
        <h2 id="coverage" className="type-h3 text-text">
          Where it works
        </h2>
        {p.basedIn ? (
          <p className="text-text">
            <strong>Based in</strong> {p.basedIn.city}, {p.basedIn.stateName}. Where a company is based isn't where it serves; its coverage is
            below.
          </p>
        ) : null}
        <h3 className="type-h4 text-text">Serves</h3>
        {p.coverage.serves.length ? (
          <ul className="grid list-disc gap-1 pl-5 text-text">
            {p.coverage.serves.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-text-2">No active coverage right now.</p>
        )}
        {p.coverage.excludes.length ? (
          <>
            <h3 className="type-h4 text-text">Doesn't serve</h3>
            <ul className="grid list-disc gap-1 pl-5 text-text">
              {p.coverage.excludes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="type-small text-text-2">
          Coverage is what the company has set for requests it can receive. A request reaches only movers whose coverage includes it, up to the
          number you choose.{" "}
          <Link href="/which-companies-receive-my-request/" className="link">
            Which companies receive my request
          </Link>
        </p>
      </section>

      <section aria-labelledby="credentials" className="grid max-w-[75ch] gap-3">
        <h2 id="credentials" className="type-h3 text-text">
          Credentials and checks
        </h2>
        <p className="text-text-2">
          Each row shows what we checked, where the record comes from and the date we last checked it. We show the results, not the documents.{" "}
          <Link href="/how-we-verify-movers/" className="link">
            How we verify movers
          </Link>
        </p>
        <CredentialLedger rows={p.credentials} />
        {p.usdot ? (
          <p className="flex flex-wrap gap-x-4 gap-y-1 type-small">
            <a href={fmcsaSnapshotUrl(p.usdot)} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
              FMCSA company snapshot (SAFER) <ExternalLinkIcon size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={FMCSA_LI_URL} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
              FMCSA Licensing and Insurance <ExternalLinkIcon size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={PROTECT_YOUR_MOVE_URL} className="link inline-flex min-h-11 items-center gap-1" target="_blank" rel="noopener noreferrer">
              Protect Your Move (complaint history) <ExternalLinkIcon size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        ) : null}
        <p className="type-small text-text-2">
          Our checks don't rate work quality, prices or crews, and they aren't a government endorsement. A federal record can change between our
          weekly rechecks, so check the date shown.
        </p>
      </section>

      <section aria-labelledby="reviews" className="grid gap-5">
        <div className="grid max-w-[75ch] gap-2">
          <h2 id="reviews" className="type-h3 text-text">
            Customer reviews
          </h2>
          <p className="text-text-2">
            Only people whose request this mover bought through American Moving Choice can review it, by our invitation. Every mover in our
            network pays us for the requests it buys; payment never changes which reviews we publish or how ratings are calculated. The two
            experiences are rated separately and never blended.{" "}
            <Link href="/review-methodology/" className="link">
              How reviews work
            </Link>
          </p>
        </div>
        {hasReviews ? (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {REVIEW_TYPES.map((type) => (
                <RatingBlock key={type} summary={p.ratings[type]} headingId={`rating-${type}`} />
              ))}
            </div>
            <div className="grid gap-4">
              <h3 className="type-h4 text-text">{p.hasReviewsPage ? "Latest reviews" : "All reviews, newest first"}</h3>
              {p.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} companyName={p.displayName} headingLevel="h4" />
              ))}
              {p.hasReviewsPage ? (
                <p>
                  <Link href={`${path}reviews/`} className="link">
                    See all <span className="tabular">{p.publishedReviewCount}</span> reviews of {p.displayName}
                  </Link>
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState
            titleAs="h3"
            title="No customer reviews yet"
            description="Reviews appear here after people whose request this mover bought share feedback through our invitation. No rating is shown until then."
          />
        )}
      </section>

      <section aria-labelledby="contact" className="grid max-w-[75ch] gap-3">
        <h2 id="contact" className="type-h3 text-text">
          Website and contact
        </h2>
        {p.website ? (
          <p className="text-text">
            Website:{" "}
            <a href={p.website} className="link" target="_blank" rel="noopener noreferrer nofollow">
              {new URL(p.website).host}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        ) : (
          <p className="text-text">No website on file.</p>
        )}
        <p className="text-text-2">
          We don't show movers' phone numbers here. To hear from this mover, request a quote: you choose how many movers can contact you, and
          they contact you directly.
        </p>
      </section>
    </Container>
  );
}

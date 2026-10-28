import { Alert, Breadcrumbs, Container, EmptyState, ExternalLinkIcon, IdCardIcon, Reveal, RouteMark, SectionHeader, StatTile, StickyCta } from "@amc/ui";
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
import { PROFILE_ORIGIN_KEY, RequestQuoteButton } from "@/components/directory/request-quote-button";
import { ReviewCard } from "@/components/directory/review-card";
import { JsonLd, NOINDEX, absoluteUrl, breadcrumbJsonLd, canonical } from "@/components/directory/seo";
import { MediaFrame } from "@/components/media/media-frame";
import { claimMedia } from "@/lib/media";

type Params = Promise<{ slug: string }>;

const PAGE = "/companies/[slug]/";

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

function SuspendedNotice({ displayName, usdot }: { displayName: string; usdot: string | null }) {
  return (
    <Container size="reading" className="grid gap-6 section-pad">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: "/directory/" }, { label: displayName }]} />
      <h1 className="type-display-l text-text">{displayName}</h1>
      {/* [Owner: notice wording, "not currently part of…" (site architecture §2.5) or "Verification under review" (mover verification §3) — default shown] */}
      <Alert tone="info" role="none" title="Not currently part of the American Moving Choice network">
        This company can&apos;t receive new requests through American Moving Choice, and it isn&apos;t listed in our directory. Its profile stays online
        so links to it still explain its status.
      </Alert>
      <div className="grid gap-3 text-text">
        <p>If you&apos;re dealing with this company, you can:</p>
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

const ANCHORS = [
  { href: "#overview", label: "Overview" },
  { href: "#services", label: "Services" },
  { href: "#coverage", label: "Where it works" },
  { href: "#credentials", label: "Credentials and checks" },
  { href: "#reviews", label: "Customer reviews" },
  { href: "#contact", label: "Website and contact" },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="type-display-l text-text scroll-mt-6">
      {children}
    </h2>
  );
}

export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const result = await loadProfile(slug);
  if (!result) notFound();
  if (result.kind === "suspended") return <SuspendedNotice displayName={result.displayName} usdot={result.usdot} />;
  const p = result.profile;
  const path = `/companies/${p.slug}/`;
  const hasReviews = REVIEW_TYPES.some((t) => p.ratings[t].count > 0) || p.reviews.length > 0;
  // One cover still for every profile page: the picture is generic (no real company is shown).
  const cover = claimMedia(PAGE, ["directory", "theme:profile", "landscape"]);
  const checkedRows = p.credentials.length;

  return (
    <>
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

      {/* Cover band + header card overlapping it (VD §13.6). */}
      <div className="relative">
        <div className="relative h-44 overflow-hidden sm:h-56 lg:h-64" aria-hidden="true">
          <MediaFrame asset={cover} priority sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,49,103,0.08),rgba(6,49,103,0.28))]" />
        </div>
        <Container className="relative -mt-20 grid gap-4 sm:-mt-24">
          <header className="grid gap-6 rounded-card border border-border bg-surface p-5 shadow-e2 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
            <div className="grid content-start gap-4">
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mover directory", href: "/directory/" }, { label: p.displayName }]} />
              <h1 className="type-display-xl text-text">{p.displayName}</h1>
              <StatusChips isNew={p.isNew} joinedAt={p.joinedAt} />
              {p.badge ? <BadgeWithExplainer verifiedDate={p.badge.verifiedDate} usdot={p.usdot} idSuffix="profile" /> : null}
              <div className="flex items-start gap-2">
                <RouteMark size={12} className="mt-1 shrink-0" />
                <CoverageSummary listing={p} limit={2} />
              </div>
            </div>
            <div className="grid content-start gap-4 lg:border-l lg:border-border lg:pl-8">
              <CompactRatings ratings={p.ratings} />
              <div className="grid gap-2" id="quote">
                <div>
                  <RequestQuoteButton companyId={p.companyId} slug={p.slug} displayName={p.displayName} />
                </div>
                <p className="type-small text-text-2">Uses our standard request form. You choose how many movers can contact you.</p>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 type-small">
                {ANCHORS.slice(3).map((a) => (
                  <li key={a.href}>
                    <a href={a.href} className="link">
                      {a.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </header>
        </Container>
      </div>

      <Container className="grid gap-12 section-pad lg:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <p className="type-overline text-text-3">On this page</p>
          <ul className="mt-3 grid gap-0.5 border-l border-border">
            {ANCHORS.map((a) => (
              <li key={a.href}>
                <a href={a.href} className="-ml-px block border-l-2 border-transparent py-2 pl-4 type-small font-semibold text-text-2 no-underline hover:border-brand-navy hover:text-text">
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid min-w-0 gap-14">
          {p.noBrokerClaim ? (
            <aside aria-label="Movers only" className="flex gap-4 rounded-card border border-border bg-surface-2 p-5 text-text">
              <IdCardIcon size={22} className="mt-0.5 shrink-0 text-brand-navy" />
              <p>
                <StoredText id="ST-2" links={{ "How we verify movers": { href: "/how-we-verify-movers/" } }} />
              </p>
            </aside>
          ) : null}

          <Reveal as="section" aria-labelledby="overview" className="grid max-w-[75ch] gap-4">
            <SectionTitle id="overview">About {p.displayName}</SectionTitle>
            <div className="grid gap-2 rounded-card border border-dashed border-border-strong p-5 sm:p-6">
              <p className="type-overline text-text-2">Provided by the company</p>
              <p className="whitespace-pre-line text-text">{p.description ?? "This company hasn't added a description yet."}</p>
              <p className="type-small text-text-2">Company-written and moderated by us. We don&apos;t check claims made here; the checked facts are under Credentials and checks.</p>
            </div>
          </Reveal>

          <Reveal as="section" aria-labelledby="services" className="grid gap-5">
            <SectionTitle id="services">Services and move sizes</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Kinds of move", items: p.moveTypes.map((t) => MOVE_TYPE_LABELS[t]) },
                { title: "Services", items: p.services.map((s) => SERVICE_LABELS[s]) },
                { title: "Move sizes", items: p.moveSizes.map((s) => MOVE_SIZE_LABELS[s]) },
              ].map((group) => (
                <div key={group.title} className="grid content-start gap-3 rounded-card border border-border bg-surface p-5 shadow-e1">
                  <h3 className="type-h4 text-text">{group.title}</h3>
                  <ul className="grid gap-1.5 text-text">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-brand-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" aria-labelledby="coverage" className="grid max-w-[75ch] gap-4">
            <SectionTitle id="coverage">Where it works</SectionTitle>
            {p.basedIn ? (
              <p className="text-text">
                <strong>Based in</strong> {p.basedIn.city}, {p.basedIn.stateName}. Where a company is based isn&apos;t where it serves; its coverage is below.
              </p>
            ) : null}
            <div className="grid gap-4 rounded-card border border-border bg-surface-2 p-5">
              <h3 className="flex items-center gap-2 type-h4 text-text">
                <RouteMark size={12} /> Serves
              </h3>
              {p.coverage.serves.length ? (
                <ul className="grid gap-1.5 text-text">
                  {p.coverage.serves.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-brand-navy" />
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-2">No active coverage right now.</p>
              )}
              {p.coverage.excludes.length ? (
                <>
                  <h3 className="type-h4 text-text">Doesn&apos;t serve</h3>
                  <ul className="grid gap-1.5 text-text">
                    {p.coverage.excludes.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-text-3" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
            <p className="type-small text-text-2">
              Coverage is what the company has set for requests it can receive. A request reaches only movers whose coverage includes it, up to the number
              you choose.{" "}
              <Link href="/which-companies-receive-my-request/" className="link">
                Which companies receive my request
              </Link>
            </p>
          </Reveal>

          <Reveal as="section" aria-labelledby="credentials" className="grid gap-5">
            <SectionHeader
              id="credentials"
              title="Credentials and checks"
              lede={
                <>
                  Each row shows what we checked, where the record comes from and the date we last checked it. We show the results, not the documents.{" "}
                  <Link href="/how-we-verify-movers/" className="link">
                    How we verify movers
                  </Link>
                </>
              }
              action={<StatTile tone="plain" value={checkedRows} label={checkedRows === 1 ? "checked credential" : "checked credentials"} className="min-w-[10rem]" />}
            />
            <div className="rounded-card border border-border bg-surface px-5 shadow-e1 sm:px-6">
              <CredentialLedger rows={p.credentials} />
            </div>
            {p.usdot ? (
              <p className="flex flex-wrap gap-x-5 gap-y-1 type-small">
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
              Our checks don&apos;t rate work quality, prices or crews, and they aren&apos;t a government endorsement. A federal record can change between our
              weekly rechecks, so check the date shown.
            </p>
          </Reveal>

          <Reveal as="section" aria-labelledby="reviews" className="grid gap-6">
            <SectionHeader
              id="reviews"
              title="Customer reviews"
              lede={
                <>
                  Only people whose request this mover bought through American Moving Choice can review it, by our invitation. Payment never changes which
                  reviews we publish or how ratings are calculated. The two experiences are rated separately and never blended.{" "}
                  <Link href="/review-methodology/" className="link">
                    How reviews work
                  </Link>
                </>
              }
            />
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
                showMark
                title="No customer reviews yet"
                description="Reviews appear here after people whose request this mover bought share feedback through our invitation. No rating is shown until then."
              />
            )}
          </Reveal>

          <Reveal as="section" aria-labelledby="contact" className="grid max-w-[75ch] gap-4">
            <SectionTitle id="contact">Website and contact</SectionTitle>
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
              We don&apos;t show movers&apos; phone numbers here. To hear from this mover, request a quote: you choose how many movers can contact you, and they
              contact you directly.
            </p>
            <p>
              <a href="#quote" className="link font-semibold">
                Back to Request a quote
              </a>
            </p>
          </Reveal>
        </div>
      </Container>

      <StickyCta
        href="/get-quotes/"
        label="Request a quote"
        watch="quote"
        note={p.displayName}
        storage={{ key: PROFILE_ORIGIN_KEY, value: JSON.stringify({ companyId: p.companyId, slug: p.slug, displayName: p.displayName, savedAt: new Date().toISOString() }) }}
      />
    </>
  );
}

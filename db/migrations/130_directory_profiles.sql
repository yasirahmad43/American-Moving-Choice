-- Slice S4: directory, company profiles and public reviews (build plan §11, migrations 130-139).
-- Read paths only: indexes for the profile and directory queries. No data and no new tables.

-- Published reviews per company, newest first (profiles, the reviews page, rating summaries).
create index if not exists reviews_company_published_idx
  on reviews (company_id, published_at desc) where status = 'published';

-- The latest response to a review.
create index if not exists review_responses_review_idx on review_responses (review_id, created_at desc);

-- Latest credential and authority rows per company.
create index if not exists credentials_company_type_idx on credentials (company_id, credential_type, created_at desc);
create index if not exists authority_records_company_idx on authority_records (company_id, docket_number, authority_type, created_at desc);

-- Latest verification check of each type per company (badge date, movers-only claim).
create index if not exists verification_checks_company_type_idx on verification_checks (company_id, check_type, created_at desc);

-- Active badges per company.
create index if not exists badges_company_active_idx on badges (company_id) where revoked_at is null;

-- 100: public concern reports (slice S1, /report-a-concern/).
--
-- A report from the public site becomes a row in cases (002). This migration adds what the
-- public form needs and 002 lacks:
--   * reference_code: a short case reference the reporter sees on the confirmation message, so
--     they can quote it when they write to support. Same alphabet as request references, with a
--     CASE- prefix so the two never look alike.
--   * reported_company: the company the reporter named, as typed (a name, USDOT or MC number).
--     company_id stays null unless the text matched exactly one company's USDOT or MC number.
--   * source: where the case came from. Admin-created cases keep the default 'admin'.
-- Reporter contact fields stay private (admin only), as 002 says.

alter table cases
  add column reference_code text,
  add column reported_company text check (reported_company is null or length(reported_company) <= 200),
  add column source text not null default 'admin' check (source in ('admin', 'public_form', 'system'));

update cases set reference_code = 'CASE-' || substr(generate_reference_code(), 5) where reference_code is null;

alter table cases
  alter column reference_code set default ('CASE-' || substr(generate_reference_code(), 5)),
  alter column reference_code set not null,
  add constraint cases_reference_code_key unique (reference_code),
  add constraint cases_reference_code_format check (reference_code ~ '^CASE-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$');

create index cases_status_created_idx on cases (status, created_at desc);

-- The owner selected a count/channel request flow: companies introduce themselves on contact.
-- Historical named-company consent is immutable. Keep its text and evidence as originally saved.
alter table consent_records add column recipient_disclosure_mode text not null default 'named_before_send'
  check (recipient_disclosure_mode in ('named_before_send', 'contact_introduction'));

comment on column consent_records.named_company_ids is
  'Legacy name: internal eligible recipient snapshot. For contact_introduction records these IDs were not displayed as company names; rendered_text and recipient_disclosure_mode record the actual disclosure.';
comment on column lead_eligibility.named_in_consent is
  'Recipient authorized by the stored request scope. The legacy name does not assert that a company identity was displayed; see consent_records.recipient_disclosure_mode.';

insert into consent_text_versions (id, kind, body, sha256, status)
select 'contact-introduction-v1-draft', 'contact_consent', body,
       encode(sha256(convert_to(body, 'UTF8')), 'hex'), 'draft'
from (values ('{RECIPIENT_SCOPE} I agree that up to {N} participating moving companies matched to my move may receive my contact details and contact me about my move {CHANNELS}. Each company will identify itself when it contacts me. {AUTOMATED}Consent isn''t required to buy any goods or services.{RATES} I can opt out at any time by {STOP}contacting the mover or American Moving Choice.')) as v(body);

-- This is a demo workflow draft, not a claim of legal approval. Never rewrite earlier records.
update platform_settings set value = '"contact-introduction-v1-draft"'::jsonb
where key = 'active_consent_version' and value = '"consent-v0-draft"'::jsonb;

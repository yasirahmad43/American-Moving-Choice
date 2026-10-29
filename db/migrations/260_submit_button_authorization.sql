-- A request can be authorized by its explicit Send action instead of separate checkboxes.
-- This narrower mode permits manual calls and email only, never SMS or automated phone contact.
alter table consent_records add column authorization_method text not null default 'checkbox'
  check (authorization_method in ('checkbox', 'submit_button'));
alter table consent_records add column contact_automation text not null default 'legacy_text'
  check (contact_automation in ('legacy_text', 'manual_only'));
comment on column consent_records.authorization_method is
  'Actual affirmative action used at submission; checkbox_state remains false for a submit-button action.';
comment on column consent_records.contact_automation is
  'manual_only forbids automated/prerecorded calls and SMS. legacy_text preserves the historical rendered permission scope without reinterpreting it.';

do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname from pg_constraint
     where conrelid = 'consent_records'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) like '%checkbox_state%'
       and pg_get_constraintdef(oid) like '%terms_accepted%'
       and pg_get_constraintdef(oid) like '%privacy_acknowledged%'
  loop
    execute format('alter table consent_records drop constraint %I', constraint_row.conname);
  end loop;
end $$;

alter table consent_records add constraint consent_records_authorization_check check (
  terms_accepted and privacy_acknowledged and (
    (authorization_method = 'checkbox' and checkbox_state and contact_automation = 'legacy_text'
     and consent_text_version_id <> 'contact-request-submit-v1')
    or (authorization_method = 'submit_button' and not checkbox_state
        and consent_text_version_id = 'contact-request-submit-v1'
        and recipient_disclosure_mode = 'request_intake' and contact_automation = 'manual_only'
        and channel_scope @> array['call','email']::text[]
        and channel_scope <@ array['call','email']::text[])
  )
);

insert into consent_text_versions (id, kind, body, sha256, status)
select 'contact-request-submit-v1', 'contact_consent', body,
       encode(sha256(convert_to(body, 'UTF8')), 'hex'), 'draft'
from (values ($submit${REQUEST_SUBMIT_SCOPE}By sending, I authorize American Moving Choice and up to {N} moving companies to receive my details and call or email me about my move. I accept the Terms of Use and acknowledge the Privacy Policy.$submit$)) as v(body);

update platform_settings set value = '"contact-request-submit-v1"'::jsonb
where key = 'active_consent_version'
  and value in ('"contact-request-intake-v1"'::jsonb, '"contact-introduction-v1-draft"'::jsonb, '"consent-v0-draft"'::jsonb);

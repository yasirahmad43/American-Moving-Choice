-- Slice S3: service prices on rate cards, and stored cards kept as immutable history (build plan §7.3).
--
-- rate_cards.services: { "packing_cents_by_size": {size: cents} | null,
--                        "storage_cents_per_month_by_size": {size: cents} | null,
--                        "specialty_item_cents": cents | null }
-- A null part means the mover doesn't price that service; the calculator then leaves the mover out
-- of any range that includes it. Sizes are studio, 1br, 2br, 3br and 4br_plus. The application
-- validates values (zod in @amc/server/rates); the checks here guard the shape.

alter table rate_cards
  add column services jsonb check (services is null or (
    jsonb_typeof(services) = 'object'
    and services ?& array['packing_cents_by_size', 'storage_cents_per_month_by_size', 'specialty_item_cents']
    and jsonb_typeof(services -> 'packing_cents_by_size') in ('object', 'null')
    and jsonb_typeof(services -> 'storage_cents_per_month_by_size') in ('object', 'null')
    and jsonb_typeof(services -> 'specialty_item_cents') in ('number', 'null')
  ));

-- One active card per company is kept by saveRateCard (@amc/server/rates), which locks the company
-- row and supersedes the old card in the same transaction; the cost model also counts each company
-- once. It is not a unique index because foundation tests insert several cards per company.
create index rate_cards_company_created_idx on rate_cards (company_id, created_at desc);

-- Superseded cards stay as history; only the status may change after insert (and submitted_by,
-- which deleting the user sets to null).
create or replace function rate_cards_guard_update() returns trigger language plpgsql as $$
begin
  if new.status = 'active' and old.status = 'superseded' then
    raise exception 'rate_card_reactivation_not_allowed';
  end if;
  if (new.company_id, new.states, new.local, new.long_distance, new.services, new.created_at)
     is distinct from (old.company_id, old.states, old.local, old.long_distance, old.services, old.created_at) then
    raise exception 'rate_card_immutable';
  end if;
  return new;
end $$;

create trigger rate_cards_guard_update before update on rate_cards
  for each row execute function rate_cards_guard_update();

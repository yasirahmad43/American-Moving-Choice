-- A request held for review (risk score at or above the threshold) must not be sold until an
-- admin qualifies it. reserve_purchase only checks the group's inventory status, so this trigger
-- refuses a new reservation when no lead in the group is qualified and at least one is held or
-- rejected. Groups whose leads are all still 'submitted' (fixtures, legacy rows) are unaffected.

create function refuse_unqualified_reservation() returns trigger language plpgsql as $$
begin
  if new.status = 'reserved'
     and not exists (select 1 from leads where group_id = new.group_id and status = 'qualified')
     and exists (select 1 from leads where group_id = new.group_id and status in ('needs_review', 'rejected')) then
    raise exception 'lead_unavailable' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger purchase_attempts_require_qualified_lead
  before insert on purchase_attempts
  for each row execute function refuse_unqualified_reservation();

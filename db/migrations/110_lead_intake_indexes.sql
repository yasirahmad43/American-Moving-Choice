-- American Moving Choice: quote survey and lead intake (slice S2; build plan §7.2, §11).
--
-- Indexes for the duplicate check, which looks for a recent request on the same route from the
-- same email or phone hash (lead lifecycle §4), and for the opt-outs recorded on withdrawal.

create index leads_route_created_idx on leads (origin_zip, dest_zip, created_at desc);
create index consumer_contact_preferences_lead_idx on consumer_contact_preferences (lead_id) where lead_id is not null;

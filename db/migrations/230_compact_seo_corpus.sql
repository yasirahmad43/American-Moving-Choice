-- Replace only the rebuildable shingle cache. Saved page content, publication decisions,
-- links, media ownership and bootstrap checkpoints are retained. Do not aggregate/copy the
-- old millions of rows first: that would temporarily increase disk/WAL pressure.
create sequence seo_shingle_revision_seq;
create table seo_page_shingles (
  page_url text primary key references seo_pages(url) on delete cascade on update cascade,
  family text not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  -- Same distinct signed 32-bit FNV hashes as migration 190's cache, packed in one array.
  hashes integer[] not null,
  revision bigint not null check (revision > 0)
);
create index seo_page_shingles_family_idx on seo_page_shingles(family);
create function seo_shingle_revision() returns trigger language plpgsql
set search_path from current as $$
begin
  new.revision := nextval('seo_shingle_revision_seq');
  return new;
end $$;
create trigger seo_shingle_revision before insert or update on seo_page_shingles
for each row execute function seo_shingle_revision();

drop table seo_shingles;

-- Published catalogues page by family and URL. Do not pull the entire question family into
-- application memory to return a 60-card hub or a 1,000-URL sitemap. These are derived indexes;
-- saved page text, publication decisions, sources, links and media claims are unchanged.
create index seo_pages_published_family_url_idx on seo_pages(family, url)
  where status = 'published';
create index seo_pages_sitemap_family_url_idx on seo_pages(family, url) include(updated_at)
  where status = 'published' and indexable;

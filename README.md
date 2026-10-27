# American Moving Choice

A nationwide moving comparison and lead marketplace. Consumers request quotes, and approved, FMCSA-verified **moving carriers (no brokers)** buy those requests exclusively or shared, then follow up in a built-in CRM.

> **Status: Phase 1 (discovery) delivered; Phase 5 marketplace core prototyped in test mode.** Not production-ready: the public site, portals and payments are not built yet, financial and consent rules await owner/counsel approval, and no live money or real consumer data is involved.

Start with **[docs/00-discovery-brief.md](docs/00-discovery-brief.md)**.

## Repository layout

| Path | Contents |
|---|---|
| `docs/` | Discovery brief, business rules, architecture, data model, SEO, product, design, research |
| `packages/core` | Pure TypeScript domain logic: matching engine, shared-lead pricing/credits, preview redaction, geography and dedupe helpers |
| `db/migrations` | PostgreSQL schema and functions for the transactional marketplace core (reservations, purchases, ledger, disclosures, CRM isolation) |
| `db/test` | Integration tests against a real Postgres, including concurrency races |
| `brand/` | Source logo |

## Running the tests

Requirements: Node 22, pnpm 10, PostgreSQL 16.

```bash
pnpm install
# Postgres reachable at DATABASE_URL (default postgres://amc:amc@localhost:5432/amc_test)
# The DB tests drop and recreate the `public` schema in that database. Use a throwaway database.
pnpm typecheck
pnpm test
pnpm --filter @amc/core examples   # prints the worked credit-policy examples
```

CI (`.github/workflows/ci.yml`) runs the same steps with a Postgres 16 service container.

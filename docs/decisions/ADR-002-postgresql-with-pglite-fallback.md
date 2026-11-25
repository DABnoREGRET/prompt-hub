# ADR-002: PostgreSQL 16 in Production with PGlite Fallback for Zero-Install Local Dev & Tests

## Status
Accepted

## Date
2026-11-25

## Context
Prompt Hub models relational data (`users`, `categories`, `entries`, `tags`, `entry_tags`, `bookmarks`) with strict primary keys, foreign keys, `CHECK` constraints, and `ON DELETE CASCADE` rules. In production, Render provisions Managed PostgreSQL 16. However, contributors and CI/local reviewers may not have Docker or a local `postgres` daemon installed.

## Decision
Write all DDL migrations and parameterized queries in standard **PostgreSQL SQL**, and abstract connection pooling behind a thin `server/src/db/client.ts` interface:
- When `USE_PGLITE=false` (Render production or local Postgres): use `pg.Pool` with `DATABASE_URL`.
- When `USE_PGLITE=true` (default local dev and Vitest integration tests): use `@electric-sql/pglite`, an embedded PostgreSQL engine compiled to WebAssembly.

## Alternatives Considered

### Require Local PostgreSQL or Docker Only
- Pros: Single driver (`pg`).
- Cons: Blocks developers or reviewers on machines without `psql` or Docker from running `npm run dev` or `npm test` out of the box.
- Rejected: Violates the zero-friction clone-and-run requirement.

### Use SQLite Locally and PostgreSQL in Production
- Pros: Fast local file DB.
- Cons: SQL dialect drift (`SERIAL` vs `AUTOINCREMENT`, `ILIKE` vs `LIKE`, `TIMESTAMPTZ`, parameter placeholders `$1` vs `?`) introduces production-only bugs.
- Rejected: PGlite executes genuine PostgreSQL SQL, preventing dialect drift.

## Consequences
- Every integration test in `server/tests/` spins up an isolated, real PostgreSQL schema in memory in milliseconds.
- Anyone cloning the repo can run `npm install && npm run db:migrate && npm run db:seed && npm run dev` without installing database servers.
- Production deploys on Render still use `pg.Pool` against Render Managed PostgreSQL (`USE_PGLITE=false`).

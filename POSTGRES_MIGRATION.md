# ZOVRO PostgreSQL migration runbook

This is a staging-only database migration workflow. Do not point the live ZOVRO API at PostgreSQL until every verification step below passes.

## Preconditions

- Keep the live `zovro-api-final` service on `zovro-final-deploy` as the rollback source.
- Use a Render Postgres database in the same region as the API when possible.
- Provide `DATABASE_URL` only through Render environment settings or a secure local shell; never commit it.
- Preserve `ZOVRO_SECRET`, `ZOVRO_OPS_TOKEN`, Stripe secrets, and other production secrets outside GitHub.

## Migration

From the repository root:

```bash
cd backend
npm install
DATABASE_URL='***' npm run db:migrate:postgres
DATABASE_URL='***' npm run db:verify:postgres
```

The migration is idempotent for schema version 5 and upserts by each table's primary key.

## Acceptance checks

1. `db:verify:postgres` returns `ok: true`, schema version `5`, and no missing tables.
2. Row counts are reviewed against the SQLite source for all domain tables.
3. A staging API using PostgreSQL passes `/api/health` and `/api/ready`.
4. Registration, login, service request creation, provider acceptance, messaging, cancellation, ratings, notifications, account deletion, session revocation, and payment-state persistence pass end-to-end.
5. A backup is taken and a restore test succeeds before production cutover.
6. Rollback remains possible by switching traffic back to the verified SQLite deployment until PostgreSQL is proven stable.

## Production cutover

Do not cut over the public API until a permanent, non-expiring PostgreSQL plan is selected. The temporary free Render database is for migration testing only.

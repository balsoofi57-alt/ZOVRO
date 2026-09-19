# ZOVRO PostgreSQL migration runbook

This is a staging-only database migration workflow. Do not point the live ZOVRO API at PostgreSQL until every verification step below passes.

## Preconditions

- Keep the live `zovro-api-final` service on `zovro-final-deploy` as the rollback source.
- Keep `ZOVRO_DB_MIRROR_MODE=mirror` while collecting durability evidence.
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
DATABASE_URL='***' npm run db:verify:cutover
```

The migration is idempotent for schema version 5 and upserts by each table's primary key.

`db:verify:cutover` is the strict pre-cutover gate. It compares every domain table in SQLite and PostgreSQL using row counts and SHA-256 content fingerprints, validates schema version 5, and fails if representative data is empty on either side. A zero/zero database is not acceptable cutover evidence.

## Acceptance checks

1. `db:verify:postgres` returns `ok: true`, schema version `5`, and no missing tables.
2. `db:verify:cutover` returns `ok: true`, `nonEmpty: true`, equal local/remote counts, matching SHA-256 fingerprints for every domain table, and an empty `mismatches` list.
3. Create representative non-empty activity while still in `mirror`: customer registration/login, provider registration/availability/location, normal request, SOS/urgent request, provider acceptance, messages, notification records, rating, session/audit records, and cancellation/completion state where applicable.
4. Restart/redeploy the mirror-mode API and rerun `db:verify:cutover`; the same representative records must remain present and matched after restart.
5. A staging API using PostgreSQL passes `/api/health` and `/api/ready`.
6. Registration, login, service request creation, provider acceptance, messaging, cancellation, ratings, notifications, account deletion, session revocation, and payment-state persistence pass end-to-end.
7. Take a PostgreSQL backup. Restore it into a separate verification database and rerun schema/content checks successfully.
8. Record a rollback path and retain the verified SQLite deployment until the PostgreSQL deployment is proven stable.

## Production cutover

Do not switch `ZOVRO_DB_MIRROR_MODE` from `mirror` to `durable` unless every acceptance check above is PASS with timestamped evidence from the actual release SHA and production database.

After switching to `durable`:

1. Restart the API.
2. Confirm `/api/health`, `/api/ready`, and launch-readiness report PostgreSQL operational/durable state.
3. Re-run the full ZOVRO QA lifecycle against the deployed backend.
4. Confirm new records persist through another restart.
5. Keep the prior verified deployment available for rollback during the controlled cutover window.

Do not cut over the public API until a permanent, non-expiring PostgreSQL plan with appropriate backup/restore capability is selected.

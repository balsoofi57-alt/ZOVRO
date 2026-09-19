# ZOVRO

ZOVRO is a two-sided local-services marketplace for customers and service providers, covering roadside assistance, mobile auto service, home trades, moving, lawn/snow, pest control, and urgent requests.

## Release identity

- App name: ZOVRO
- Version: 1.0.0
- Bundle/App ID: `com.zovro.app`
- Canonical production API: `https://zovro-api-final.onrender.com`
- Public support email: `support@zovro.net`

## QA

Run the complete repository QA chain from the repository root:

```bash
npm run qa:all
```

The full suite covers product behavior, production configuration, launch readiness, payment safety, saved cards, server/mobile/native push readiness, CORS/security, store readiness, PostgreSQL cutover guarding, release packaging, end-to-end request flow, SOS/location safety, biometrics, Smart Match, request privacy, log privacy, and legal consent.

## PostgreSQL cutover safety

Production must remain in `ZOVRO_DB_MIRROR_MODE=mirror` until representative non-empty data is proven durable.

The strict pre-cutover command is:

```bash
cd backend
DATABASE_URL='***' npm run db:verify:cutover
```

This check rejects an empty database and requires schema version 5, equal SQLite/PostgreSQL row counts, and matching SHA-256 content fingerprints across every domain table. Restart persistence plus backup/restore/rollback evidence are still required before changing to `durable`.

## Release discipline

- Do not commit production secrets or signing credentials.
- Keep PR #1 Draft until external launch gates are complete.
- Do not enable paid production jobs until Stripe live onboarding, capabilities, keys, webhook and lifecycle tests pass.
- Do not claim production push readiness until OneSignal REST/APNs/FCM credentials and real-device delivery pass.
- Do not move Render production to the release head until database durability, payments, push, signing/store access, support verification and final legal/store declarations are complete.

See `RELEASE_EVIDENCE_CHECKLIST.md`, `GATE_CLOSURE_STATUS.md`, `POSTGRES_MIGRATION.md`, `RELEASE_CONFIGURATION.md`, and `STORE_SUBMISSION.md` for the current gate status and evidence requirements.

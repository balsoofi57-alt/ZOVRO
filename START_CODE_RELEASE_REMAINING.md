# Start-code release: outstanding work

Checkpoint: 2026-09-13. Scope: optional per-request customer start code.

## Production persistence blocks rollout

The connected `zovro-api-final` service currently runs the Node runtime on the free service plan, with no attached disk shown by service inspection. The repository render.yaml describes a different Docker service and does not establish persistence for this existing service. Live production remains on c95e6dc1640b9c649b889bbcce41fe57088adc57.

Production readiness currently reports SQLite plus PostgreSQL in mirror mode. This does not prove that primary SQLite records, start-code verifiers, lockouts, or sessions survive replacement of a service instance. A read-only query through the Render database connector failed with EOF/TLS connection errors; this does not establish that the application database connection is broken.

Before any restart or deployment:
- Obtain an authorized backup of the current primary SQLite database and verify recoverability. Do not assume the asynchronous PostgreSQL mirror contains every primary record.
- Provision persistent storage for this existing service, or complete the separately gated durable PostgreSQL migration. For a Node service using a disk, use a persistent mount such as `/var/data` and set `ZOVRO_DATA_DIR=/var/data/zovro`; copy and validate existing data before switching paths. A plan/storage change must be reviewed for cost before applying.
- Keep `ZOVRO_DB_MIRROR_MODE=mirror` until representative non-empty count/hash parity, restart persistence, isolated backup/restore, and rollback checks pass.
- Retain the existing signing/encryption secrets so sessions and protected data remain usable.

## Coordinated release

- Deploy the verified backend revision after the persistence gate closes. The API production branch is `zovro-final-deploy`; the separate web service follows `main`. Do not update only the web UI while the backend lacks `/api/requests/:id/start-code`.
- Confirm `/api/health` and `/api/ready` and record the exact deployed revision.
- Build signed iOS/Android releases containing the matching UI.
- On physical devices, exercise enabling/changing the code, entering it on arrival, incorrect-code lockout, expiry, provider replacement, cancellation, and completion. Confirm no code/verifier appears in provider responses, notifications, or logs.
- Verify a device with an older client cannot bypass a protected request through a direct status update.

The code confirms customer authorization to start work. It does not verify identity by itself, authorize a charge, certify completion, or guarantee physical safety.

## Backup utility ready for an authenticated operator

`node scripts/backup-sqlite.js <existing-SQLite-file> <new-private-directory>` creates an online SQLite backup, verifies integrity, and writes a SHA-256/count manifest with private filesystem permissions. It refuses an existing output directory. Keep the complete directory outside the ephemeral service before changing storage. The isolated QA fixture exercises WAL-backed data and restores a separate copy. This is not evidence of a production backup.

The running service does not yet contain this utility. Transfer or execute the reviewed utility through an authenticated service shell without redeploying first. Dashboard access currently requires sign-in. Do not expose a new public backup endpoint.

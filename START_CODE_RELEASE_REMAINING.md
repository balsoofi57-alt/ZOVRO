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

The running service does not yet contain this utility. Transfer or execute the reviewed utility through an authenticated service shell without redeploying first. Dashboard sign-in was completed on 2026-09-13, but the live Shell page explicitly blocks shell access on the Free compute plan. Do not expose a new public backup endpoint.

## Authenticated Render follow-up — 2026-09-13

- Verified the signed-in dashboard for `zovro-api-final` and independently rechecked Render deployment metadata: the live revision remains `c95e6dc1640b9c649b889bbcce41fe57088adc57`. The production branch tip is `d961050e08f1c5d6b18764a7dd0de439f4e28835`; branch state is not deployment evidence.
- Both Shell and Disk display upgrade-required dialogs. Compute explicitly says Free instances do not support SSH, one-off jobs, or persistent disks. Signing in alone therefore does not unblock the production backup.
- The smallest paid compute option shown is $7/month (0.5 CPU, 512 MB RAM). This is compute only; disk pricing and total recurring cost were not established. No paid plan was selected or purchased.
- Before changing plans, establish a supported way to preserve/export the existing primary SQLite data without assuming an instance replacement retains it. Ask Render support for a preservation/export procedure if no authenticated export is available; the user explicitly authorized this support correspondence on 2026-09-13. Include only service ID and the technical question, never secrets or customer records.
- No production backup, restart, deployment, disk creation, data-path switch, or PostgreSQL cutover was performed. The production persistence gate remains open.

## Support correspondence and verification follow-up — 2026-09-13

The authenticated Render support messenger already contained a conversation titled `SQLite Backup Request`. Its earlier automated answer said no supported pre-redeploy backup mechanism was available for Free local SQLite; the request had already been escalated to a human engineer. No human response was visible at this check. Treat the automated response as guidance, not service-specific preservation evidence.

With the user's explicit authorization, sent a follow-up in that same conversation asking whether Free-to-paid compute replacement is unavoidable, whether a supported read-only export can precede it, and the minimum disk size and separate recurring charge. The new message was visible in the conversation after sending. Requested guidance only, without authorizing support to modify the service. Do not open a duplicate request. The next action is to review the human reply and establish data preservation before an upgrade, restart, or deployment.

Separately rechecked the connected Zovro live Stripe account: `company.tax_id` remains currently due with `verification_failed_tax_id_match`, and `pending_verification` is empty. Charges and payouts are enabled, which does not close the tax-verification gate. No Stripe account fields or transactions were changed. The original matching IRS evidence or an established account correction is still needed.

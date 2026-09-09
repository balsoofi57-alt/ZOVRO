# ZOVRO Gate Closure Status

Checkpoint: 2026-09-09

## Repository / QA — PASS

- Release PR #1 remains Draft and mergeable.
- Support contact is approved in source as `support@zovro.net`; inbox delivery/monitoring still requires external verification.
- ZOVRO Full QA #176 completed successfully on source commit `f74f22478467e881873883d632bfbc039caf31ad` after the support-contact hardening.
- The current release line preserves SOS validation, request-size/invalid-JSON handling, Stripe webhook idempotency, PostgreSQL readiness, privacy, consent, biometric, Smart Match, and push protections.
- A strict PostgreSQL cutover verifier is now part of the release path. It rejects empty-state evidence and requires schema version 5, non-empty representative data, equal row counts, and matching SHA-256 content fingerprints for every domain table before any durable cutover can be considered.
- Current DB-cutover hardening head: `d179ec840e069c0d2fae431845469e8c9e29eac7`; fresh Full QA is required on this head before final sign-off.

## PostgreSQL — CONNECTION PASS / DURABILITY BLOCKED

- Render service remains intentionally in `ZOVRO_DB_MIRROR_MODE=mirror`.
- Application startup has reported `databaseUrlPresent=true`, `pgModuleAvailable=true`, and `postgresRuntimeReady=true`.
- `postgres_mirror_ready` has completed successfully; last observed state remained `localRecords=0`, `remoteRecords=0`.
- Zero/zero is no longer acceptable cutover evidence. `backend/scripts/verify-cutover-readiness.js` now fails unless representative records are present in both SQLite and PostgreSQL and every domain-table count/content fingerprint matches.
- `cd backend && DATABASE_URL='***' npm run db:verify:cutover` is the required strict pre-cutover command.
- Direct read-only SQL through the Render connector previously failed because that connector path did not negotiate required SSL/TLS correctly. Do not weaken TLS.
- Durability remains BLOCKED until representative non-empty records are mirrored, strict cutover verification passes, restart persistence is proven, and backup/restore/rollback evidence exists. Do not switch to `durable` yet.

## Stripe live — BLOCKED BY OWNER-CONTROLLED ONBOARDING

Connected live account: `Zovro` (`acct_1UD4qM2Ydn9Jl8bl`).

Verified current state:
- `charges_enabled=false`
- `payouts_enabled=false`
- `details_submitted=false`
- `card_payments=inactive`
- `transfers=inactive`
- live webhook endpoint count: `0`

Stripe still requires owner/business identity/contact fields and Stripe Terms acceptance. These fields must not be fabricated or accepted by automation. Production publishable/secret/webhook secrets are not exposed by the connected Stripe tools.

## OneSignal / push — CODE PASS / REAL DELIVERY BLOCKED

- OneSignal app ID: `7992b022-6c11-4a66-bad4-8cbd114266d0`.
- Server push, mobile registration, external-user binding, permission/subscription state, tap routing, and native push readiness checks are implemented and included in `qa:all`.
- Active Subscriptions remain `0`.
- Render still lacks `ONESIGNAL_REST_API_KEY`.
- APNs credentials/capability, FCM credentials, and real signed iOS/Android installs are required before end-to-end delivery can be marked PASS.

## Production deployment — HOLD

- Current Render production branch: `zovro-final-deploy`.
- Current deployed production commit remains `2eb66a874359abb28d632ad9d2d2f14885626c1c`.
- Do not move production to the release head or change DB mode to durable until Stripe, push credentials/real-device delivery, database durability, signing/store access, support inbox verification, and final legal/store declarations are complete.

## Remaining gates that require owner/external access

1. Complete Stripe owner identity/business profile/ToS and activate card payments + transfers.
2. Create Stripe production webhook and securely add production Stripe keys/secrets to Render.
3. Add OneSignal REST key to Render; configure APNs and FCM.
4. Install signed builds on real iPhone/Android devices and verify push + biometric behavior.
5. Produce signed Android AAB and signed iOS archive; upload to Play Console/TestFlight.
6. Activate and monitor `support@zovro.net`, then verify public support/privacy/terms URLs.
7. Complete final human legal review and store privacy/data-safety declarations.
8. Generate representative non-empty database traffic while still in mirror mode; run strict count/hash verification, restart persistence, backup/restore and rollback; only then perform controlled durable cutover.
9. After all gates are PASS, deploy the final release SHA, run integrated customer/provider/SOS/payment/push lifecycle QA, mark PR ready, and proceed to store submission.

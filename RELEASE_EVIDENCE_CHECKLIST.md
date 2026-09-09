# ZOVRO release evidence checklist

Evidence checkpoint: 2026-09-09. Release PR: [#1](https://github.com/balsoofi57-alt/ZOVRO/pull/1).
This tracker supplements [FINAL_QA_MATRIX.md](FINAL_QA_MATRIX.md), [RELEASE_CONFIGURATION.md](RELEASE_CONFIGURATION.md), [STORE_ASSET_CHECKLIST.md](STORE_ASSET_CHECKLIST.md), and [STORE_SUBMISSION.md](STORE_SUBMISSION.md).

## Evidence rules

- Use PASS, FAIL, or BLOCKED. Missing evidence means BLOCKED, not PASS.
- Each completed gate needs an owner, UTC timestamp, full source commit, deployed commit or signed build identifier, environment, expected/actual result, and durable evidence link.
- Store only redacted logs, event IDs, artifact checksums, and non-sensitive screenshots here. Keep secrets, signing keys, private customer data, and reviewer credentials in approved restricted stores.
- A repository test proves the tested behavior in that environment only. Configured credentials, HTTP 200, or an unsigned build do not prove end-to-end launch readiness.
- Role owners below are proposed responsibilities, not confirmed assignments.
- Recheck QA on the final PR head and record the actual deployed backend and submitted mobile builds separately.

## Verified repository evidence

| Check | Status | Evidence and scope |
| --- | --- | --- |
| Full QA after Smart Match expansion | PASS | ZOVRO Full QA #75 succeeded on source commit `7d3d3ee21a7f45c20ede9304f9d641e5e26e1d19`. The complete `qa:all` chain passed, including Smart Match QA. |
| Biometric-gated mobile boot hardening | PASS | ZOVRO Full QA #81 succeeded on source commit `10c0550c9a3bf223de45515dbefd09f09b8b1235`. Mobile boot now waits for `ZOVRO_SECURE_SESSION.initialize()` and the biometric check rejects raw `get()` boot restoration. |
| PR state | PASS | PR #1 remains open, Draft, mergeable, and unmerged. This is not commercial launch approval. |
| Final-head QA after future changes | BLOCKED | Re-run and record QA for the final release head after all remaining code changes are complete. |

## Current live Render checkpoint

Observed from connected Render workspace on 2026-09-09.

- Service `zovro-api-final` is live on branch `zovro-final-deploy`, not on the Draft release-prep branch.
- Deployed backend commit: `2eb66a874359abb28d632ad9d2d2f14885626c1c`.
- Render logs show `GET /api/ready` returned 200 and `GET /api/health` returned 200.
- Startup preflight reports `dbMirrorMode=mirror`, `databaseUrlPresent=true`, `pgModuleAvailable=true`, and `postgresRuntimeReady=true`.
- `postgres_mirror_ready` reported localRecords=0 and remoteRecords=0. This is empty-state consistency only and does not prove durable persistence.
- Production launch blockers currently reported by the backend preflight: `stripe_publishable`, `stripe_secret`, `stripe_webhook`, and `onesignal_rest_key`.
- `externalLaunchReady=false`; do not treat live service status as commercial launch readiness.
- OneSignal connection confirms one accessible app: `Zovro llc App` (`7992b022-6c11-4a66-bad4-8cbd114266d0`). Render still lacks the OneSignal REST API key, so production push delivery remains blocked.

## Launch gates and next actions

All gates below remain BLOCKED unless explicitly marked PASS above.

| ID | Gate | Repository work | External dependency / proposed owner | Exact next action and PASS evidence |
| --- | --- | --- | --- | --- |
| PAY-01 | Stripe account and configuration | Repository payment safety tests pass. Current launch model remains 0% platform fee during launch. | Stripe account owner; Render operator. | Complete live Stripe onboarding and verify payment/transfer capabilities. Add production publishable/secret keys securely in Render. Attach redacted capability/configuration evidence and deployed SHA. |
| PAY-02 | Signed webhook and payment lifecycle | Server-side signature and payment safety checks are in QA. | Stripe dashboard, deployed backend, eligible connected provider; payments operator. | Register `https://zovro-api-final.onrender.com/api/payments/webhook`. Record a valid signed event accepted, invalid signature rejected, replay without duplicate transaction, correct request/amount, decline, refund/cancellation, and provider transfer readiness. Do not attempt live charges before onboarding is complete. |
| PUSH-01 | OneSignal/APNs/FCM | Repository push safety checks pass; OneSignal app exists. | OneSignal, Apple/APNs, Firebase/FCM, physical iPhone and Android; mobile/push operator. | Add `ONESIGNAL_REST_API_KEY` securely to Render and complete APNs/FCM credentials. Record real-device new-request, provider-accepted and job-status delivery evidence, correct account isolation, and tap routing. |
| AND-01 | Android release signing | Prepare versionCode/versionName, `com.zovro.app`, release workflow and production API configuration. | Upload key/secret store, Play Console and Android device; Android release operator. | Produce signed AAB; record SHA-256, source SHA and version. Attach Play validation/test-track evidence and installed-build API, permission, push, resume and navigation QA. |
| IOS-01 | iOS distribution signing | Face ID boot path is code-hardened and QA-passed. Prepare `com.zovro.app`, entitlements, version and archive workflow. | Apple Developer, signing resources, App Store Connect, build environment and physical iPhone; iOS release operator. | Produce signed device archive; verify Face ID unlock on physical iPhone; record source SHA/build and artifact checksum. Attach successful TestFlight processing, installation and device QA. Simulator-only output cannot close this gate. |
| ASSET-01 | Final screenshots and graphics | Prepare capture script, safe sample data, icons, graphic assets and feature-claim review. | Final signed mobile builds and capture environment; release/design operator. | Capture home, request, Smart Match, discovery, acceptance, status, messaging, reputation and profile/support/deletion from submitted builds. Record build IDs, asset paths and console validation. No mockups, private data or unsupported feature claims. |
| SUPPORT-01 | Monitored support and public links | `support.html`, Privacy and Terms are present and store-readiness QA passes. | Owner-controlled support inbox, hosting and responsible support person; product owner. | Supply final public contact; verify a test inquiry is received and answered. Record public Privacy/Terms/Support URLs opening without login and from both signed apps. Verify account deletion end to end. |
| LEGAL-01 | Content and declarations | Repository legal pages exist, but full account/request consent audit is not yet complete and final legal review is still required. | Product/legal owner and store consoles. | Complete owner/legal review, final agreement/consent implementation and store declarations matching actual production behavior. |
| STORE-01 | Console ownership and submission readiness | Prepare listing metadata, reviewer notes and app-ID/build checklist. | Authorized Apple and Google account holders. | Verify correct app records, sufficient roles, account requirements and ability to upload. Record accepted builds, completed declarations/assets, and no unresolved submission blockers. |
| DB-01 | PostgreSQL durability | Current mirror startup/readiness path works; mirror remains intentionally active. | Render app/database access; backend operator. | Stay in mirror mode until schema, representative non-empty data, critical row counts, new mirrored writes, restart persistence, backup/restore and rollback checks pass. Only then perform controlled durable cutover and record `durableOperational=true`. |
| PRIV-01 | Pre-acceptance customer privacy | Privacy hardening is still required in `backend/server-core.js`. | Repository/backend operator. | Redact exact address/location/customer identity/messages from unassigned provider discovery, block pre-acceptance chat/private access, publish a contact-minimized provider view, and add regression tests. |
| LIVE-01 | Final integrated readiness | Full QA is currently green on the latest biometric hardening commit, but production deployment uses an older production branch commit. | Production backend, signed mobile builds and test accounts; release operator. | Record final deployed SHA/builds and timestamped readiness payloads; verify customer/provider lifecycle, payment, push, privacy, security, support and deletion end to end. |

## Execution order

1. Keep PR #1 Draft and PostgreSQL in mirror mode.
2. Finish repository privacy hardening and agreement/consent evidence, then run final-head QA.
3. In parallel, complete Stripe onboarding/keys/webhook and OneSignal REST/APNs/FCM credentials.
4. Verify database durability with representative non-empty data, restart persistence, backup/restore and rollback before any durable cutover.
5. Produce signed Android/iOS builds, complete physical-device QA, screenshots, support/legal evidence and store declarations.
6. Recheck all gates against the actual deployed backend and submitted builds before Ready for Review, merge, store submission or rollout.

## Evidence record template

- Gate ID:
- Status: BLOCKED
- Responsible owner:
- Observed at (UTC):
- Source commit:
- Backend deployment / mobile version and build:
- Environment and device/OS where applicable:
- Expected result:
- Actual result:
- Evidence link / artifact checksum:
- Remaining action:
- Verified by:

## Final sign-off

- [ ] QA passed on final PR head, with run URL and SHA.
- [ ] Every core gate above is PASS with traceable evidence.
- [ ] Backend deployment and submitted Android/iOS artifacts are identified.
- [ ] No secrets or personal data are present in evidence.
- [ ] Screenshots, support links and declarations match submitted builds.
- [ ] Release owner records approval and rollout/rollback responsibility.

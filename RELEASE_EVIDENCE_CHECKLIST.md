# ZOVRO release evidence checklist

Evidence checkpoint: 2026-09-09. Release PR: [#1](https://github.com/balsoofi57-alt/ZOVRO/pull/1).
This tracker supplements [FINAL_QA_MATRIX.md](FINAL_QA_MATRIX.md), [RELEASE_CONFIGURATION.md](RELEASE_CONFIGURATION.md), [STORE_ASSET_CHECKLIST.md](STORE_ASSET_CHECKLIST.md), and [STORE_SUBMISSION.md](STORE_SUBMISSION.md).

## Evidence rules

- Use PASS, FAIL, or BLOCKED. Missing evidence means BLOCKED, not PASS.
- Each completed gate needs an owner, UTC timestamp, full source commit, deployed commit or signed build identifier, environment, expected/actual result, and durable evidence link.
- Store only redacted logs, event IDs, artifact checksums, and non-sensitive screenshots here. Keep secrets, signing keys, private customer data, and reviewer credentials in approved restricted stores.
- A repository test proves the tested behavior in that environment only. Configured credentials, HTTP 200, or an unsigned build do not prove end-to-end launch readiness.
- Recheck QA on the final PR head and record the actual deployed backend and submitted mobile builds separately.

## Verified repository evidence

| Check | Status | Evidence and scope |
| --- | --- | --- |
| Full QA after support-contact hardening | PASS | ZOVRO Full QA #176 succeeded on source commit `f74f22478467e881873883d632bfbc039caf31ad`. Support email presence is now checked by store-readiness QA. |
| Request privacy / consent / SOS / payment / push hardening | PASS | These checks remain part of `qa:all`; production deployment still requires matching final deployed SHA evidence. |
| Strict PostgreSQL cutover guard | PASS in source | `backend/scripts/verify-cutover-readiness.js` requires schema version 5, representative non-empty records, equal SQLite/PostgreSQL row counts, and SHA-256 content-fingerprint matches for every domain table. `scripts/db-cutover-readiness-check.js` is included in `qa:all` to prevent removal of this gate. |
| PR state | PASS | PR #1 remains open, Draft, mergeable, and unmerged. This is not commercial launch approval. |
| Current release-head QA | PASS | ZOVRO Full QA #290 completed successfully on source commit `c02c84447307708a912d747d2152d39701d008fd`; the complete QA suite passed. |

## Current live Render checkpoint

- Service `zovro-api-final` remains live on branch `zovro-final-deploy`, not on the Draft release-prep branch.
- Deployed backend commit remains `2eb66a874359abb28d632ad9d2d2f14885626c1c`.
- Render remains intentionally configured with `ZOVRO_DB_MIRROR_MODE=mirror` and `ZOVRO_PLATFORM_FEE_BPS=0`.
- Application startup has confirmed database URL/runtime readiness and PostgreSQL mirror initialization.
- Recent startup evidence confirms `ONESIGNAL_APP_ID` is present while `ONESIGNAL_REST_API_KEY` is still absent.
- Last observed mirror state was `localRecords=0`, `remoteRecords=0`; this is empty-state consistency only and is explicitly insufficient for DB cutover.
- Do not change to durable mode until strict non-empty count/hash verification, restart persistence, backup/restore, and rollback evidence all pass.

## Current Stripe live checkpoint

- Account name: `Zovro`; country US; default currency USD.
- `charges_enabled=false`, `payouts_enabled=false`, `details_submitted=false`.
- `card_payments=inactive` and `transfers=inactive`.
- Stripe still requires owner/business profile, representative identity/contact information, statement descriptor, and Stripe Terms acceptance before activation can complete.
- No live webhook endpoints are currently registered.
- These identity/legal fields must not be fabricated or accepted by automation.

## Current OneSignal checkpoint

- OneSignal app: `Zovro llc App` (`7992b022-6c11-4a66-bad4-8cbd114266d0`).
- Total Subscriptions = 0 and Active Subscriptions = 0 at the 2026-09-09 verification checkpoint.
- The three final push templates exist for nearby request, provider accepted, and job status update.
- Mobile source initializes the OneSignal Capacitor SDK, logs authenticated users in by `external_id`, requests permission once, exposes subscription status, and routes notification taps carrying a request ID back into the jobs flow.
- Mobile build configuration now injects the OneSignal App ID and includes the Capacitor iOS notification-handling setting required for the OneSignal integration.
- Render still lacks `ONESIGNAL_REST_API_KEY`.
- APNs/FCM credentials plus real signed iOS/Android subscriptions are still required before PUSH-01 can pass.

## Launch gates and next actions

| ID | Gate | Status | Exact PASS evidence |
| --- | --- | --- | --- |
| PAY-01 | Stripe account/configuration | BLOCKED | Complete live owner-controlled onboarding; card payments + transfers active; production publishable/secret keys stored securely in Render. |
| PAY-02 | Signed webhook/payment lifecycle | BLOCKED | Register production webhook `/api/payments/webhook`; valid signature accepted, invalid signature rejected, replay idempotent, decline/refund/cancellation/provider-transfer flow evidenced. |
| PUSH-01 | OneSignal/APNs/FCM | BLOCKED | Add server REST credential, APNs and FCM; register real devices; prove new-request/provider-accepted/job-status delivery and tap routing. |
| AND-01 | Android release signing | BLOCKED | Signed AAB, source SHA, SHA-256 checksum, Play validation/test-track evidence, installed-device QA. |
| IOS-01 | iOS distribution signing | BLOCKED | Signed archive/IPA, source SHA/checksum, TestFlight processing, physical-device Face ID/push QA. |
| ASSET-01 | Final screenshots/graphics | BLOCKED | Capture from final signed builds with no private data or unsupported feature claims. |
| SUPPORT-01 | Monitored support/public links | PARTIAL | `support@zovro.net` is approved and present in source. PASS requires inbox activation, successful send/receive/reply test, and verified public Privacy/Terms/Support URLs. |
| LEGAL-01 | Legal/store declarations | BLOCKED | Final human legal review and Apple/Google privacy/data-safety declarations matching final production behavior. |
| STORE-01 | Console ownership/submission | BLOCKED | Correct Apple/Google app records, sufficient roles, accepted signed builds, completed declarations/assets. |
| DB-01 | PostgreSQL durability | BLOCKED | While in `mirror`, generate representative non-empty data. Run `cd backend && DATABASE_URL='***' npm run db:verify:cutover` and require `ok:true`, `nonEmpty:true`, equal counts and hashes for every domain table, empty mismatches. Restart/redeploy and rerun with the same records present. Take backup, restore to separate DB and verify again. Record rollback path. Only then switch to `durable`, restart, confirm durable readiness, and rerun integrated QA. |
| LIVE-01 | Final integrated readiness | BLOCKED | Final release SHA deployed; signed mobile builds identified; customer/provider/SOS/payment/push/privacy/consent/security/support/deletion lifecycle passes end to end. |

## Execution order

1. Keep PR #1 Draft and PostgreSQL in mirror mode.
2. Current Full QA is PASS; preserve that evidence while continuing external launch-gate setup.
3. Complete Stripe owner-controlled onboarding/keys/webhook and OneSignal REST/APNs/FCM/real-device setup.
4. Generate representative mirror-mode data and run strict `db:verify:cutover` before any durable change.
5. Prove restart persistence and backup/restore/rollback.
6. Produce signed Android/iOS builds, complete physical-device QA, screenshots, support/legal evidence and store declarations.
7. Only after every gate is PASS, deploy the final verified release SHA, switch database mode through controlled cutover, rerun integrated QA, and proceed to store submission.

## Final sign-off

- [x] QA passed on the current release head, with run and SHA recorded above.
- [ ] Every core gate above is PASS with traceable evidence.
- [ ] Backend deployment and submitted Android/iOS artifacts are identified.
- [ ] No secrets or personal data are present in evidence.
- [ ] Screenshots, support links and declarations match submitted builds.
- [ ] Release owner records approval and rollout/rollback responsibility.

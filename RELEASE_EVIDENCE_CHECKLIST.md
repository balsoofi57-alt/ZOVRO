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
| Existing PR source QA | PASS | ZOVRO Full QA #56 succeeded on source commit `9fcf5d083a1041c03c5287c621a3cd637e644098`: https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34252894888 |
| PR state before this checklist commit | PASS | PR #1 was open, Draft, and mergeable on 2026-09-09. This is not commercial launch approval. |
| Final-head QA after documentation update | BLOCKED | Record the new head SHA and its completed QA run after this checklist is committed. |

## Last recorded external checkpoint

Source: [2026-09-08 follow-up verification](https://github.com/balsoofi57-alt/ZOVRO/pull/1#issuecomment-5588554674). These observations were not rerun live when assembling this checklist.

- Render deploy `dep-dag3g1ghchos73fneik0`, backend commit `3c407235d8320cacd897d3625ee038fbafbc44e5`: PostgreSQL mirror initialized; localRecords=0 and remoteRecords=0; health and readiness returned 200.
- Mirror mode remained active; durable cutover was not performed. Empty counts do not establish write persistence or backup recovery.
- Stripe account onboarding was incomplete; payment/transfer capabilities inactive; no live webhook registered.
- API launch blockers included stripe_publishable, stripe_secret, stripe_webhook, and onesignal_rest_key.
- Signing, screenshots, support/legal, and console access require evidence beyond API readiness.
- Earlier comments about the invalid database host are superseded for connection status by this later checkpoint.

## Launch gates and next actions

All gates below remain BLOCKED pending the complete evidence listed.

| ID | Gate | Repository work | External dependency / proposed owner | Exact next action and PASS evidence |
| --- | --- | --- | --- | --- |
| PAY-01 | Stripe account and configuration | Audit required settings, server-only secrets, and configuration checks. | Stripe account owner; Render operator. | Complete account onboarding first; verify payment and required transfer capabilities. Configure production keys in approved stores. Attach redacted capability/configuration evidence and deployed SHA. |
| PAY-02 | Signed webhook and payment lifecycle | Verify server-side amount calculation, request ownership, signature rejection, replay idempotency, decline and refund handling. | Stripe dashboard, deployed backend, eligible connected provider; payments operator. | Register `https://zovro-api-final.onrender.com/api/payments/webhook`. Record a valid signed event accepted, invalid signature rejected, replay without duplicate transaction, correct request/amount, decline, refund/cancellation, and provider payout readiness. Label test/live environments explicitly; do not treat test-mode success as live proof. Do not attempt live charges before onboarding is complete. |
| PUSH-01 | OneSignal/APNs/FCM | Audit user/subscription mapping, recipient isolation, permission flows, notification triggers and tap routing. | OneSignal, Apple/APNs, Firebase/FCM, physical iPhone and Android; mobile/push operator. | Configure production credentials securely. For each OS record new-request, provider-accepted, and job-status event IDs, intended account, timestamp, device/build, receipt and correct tap destination. Verify permission-denied behavior and no delivery to the wrong account. |
| AND-01 | Android release signing | Prepare versionCode/versionName, `com.zovro.app`, release workflow and production API configuration. | Upload key/secret store, Play Console and Android device; Android release operator. | Produce signed AAB; record SHA-256, source SHA and version. Attach Play validation/test-track evidence and installed-build API, permission, push, resume and navigation QA. |
| IOS-01 | iOS distribution signing | Prepare `com.zovro.app`, entitlements, version and archive workflow. | Apple Developer, signing resources, App Store Connect, build environment and physical iPhone; iOS release operator. | Produce signed device archive; record source SHA/build and artifact checksum. Attach successful TestFlight processing, installation and device QA. Simulator-only output cannot close this gate. |
| ASSET-01 | Final screenshots and graphics | Prepare capture script, safe sample data, icons, graphic assets and feature-claim review. | Final signed mobile builds and capture environment; release/design operator. | Capture home, request, discovery, acceptance, status, messaging, reputation and profile/support/deletion from submitted builds. Record build IDs, asset paths and console validation. No mockups, private data or unsupported feature claims. |
| SUPPORT-01 | Monitored support and public links | Update `support.html`, placeholders, contact links and deletion instructions. | Owner-controlled support inbox, hosting and responsible support person; product owner. | Supply final public contact; publish it; verify a test inquiry is received and answered. Record public Privacy/Terms/Support URLs opening without login and from both signed apps. Verify account deletion end to end. |
| LEGAL-01 | Content and declarations | Compare privacy worksheet and store claims with actual submitted features and integrations; preserve SOS/911 distinction. | Product/legal owner and store consoles. | Complete required owner/legal review; record approval date/version and final Apple App Privacy, Google Data Safety and rating declarations matching production behavior. |
| STORE-01 | Console ownership and submission readiness | Prepare listing metadata, reviewer notes and app-ID/build checklist. | Authorized Apple and Google account holders. | Verify correct app records, sufficient roles, account requirements and ability to upload. Record accepted builds, completed declarations/assets, and no unresolved submission blockers. Keep submission status and store approval as separate results. |
| DB-01 | PostgreSQL durability | Prepare row/write comparison, restart, backup/restore and rollback checks. | Render app/database access; backend operator. | Stay in mirror mode until schema, representative non-empty data, critical row counts, new mirrored writes, restart persistence, backup/restore and rollback checks pass. Then perform controlled durable cutover and record expected database engine and durableOperational=true. |
| LIVE-01 | Final integrated readiness | Run full QA matrix and verify release configuration/API consistency. | Production backend, signed mobile builds and test accounts; release operator. | Record deployed SHA/builds and timestamped `/api/health`, `/api/ready`, `/api/launch-readiness` responses; verify payloads, not status alone. Complete customer/provider lifecycle, payment, push, security, support and deletion QA with linked results. |

## Execution order

1. Confirm external role owners and record final-head repository QA.
2. In parallel, complete Stripe onboarding, push configuration, signing/console access, and support/legal ownership. Repository test preparation can continue during these dependencies.
3. Verify database durability and production integrations. Build signed Android/iOS candidates with the canonical API `https://zovro-api-final.onrender.com`.
4. Complete signed-build QA, capture final screenshots, and finish declarations/listings.
5. Recheck all core gates and evidence freshness against the actual release artifacts. Keep PR Draft until the release gates pass, following the existing release checkpoint. Record Ready for Review, merge, store submission, store approval and rollout separately.

## Evidence record template

Copy this record for each test or external gate:

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

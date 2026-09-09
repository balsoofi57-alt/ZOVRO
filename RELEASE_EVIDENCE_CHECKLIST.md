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
| Biometric-gated mobile boot hardening | PASS | ZOVRO Full QA #81 succeeded on source commit `10c0550c9a3bf223de45515dbefd09f09b8b1235`. Mobile boot waits for `ZOVRO_SECURE_SESSION.initialize()` and the biometric check rejects raw `get()` boot restoration. |
| Request privacy and provider discovery hardening | PASS | Full QA #95 passed after redacting customer pre-acceptance data and public provider contact/license/payment identifiers. Full QA #108 succeeded on source commit `13728117b65018f46d3362f92f38eba2cc3efd5b` after adding fresh-location/range acceptance guards and structured-log IP pseudonymization. |
| Versioned legal consent enforcement | PASS | Full QA #133 succeeded on source commit `8f00b38dc68fb0d630d9791aa65bdb3b293a7c3e`. Registration, normal service requests and SOS requests use explicit versioned consent; server-side enforcement rejects missing current versions; successful consent is recorded with timestamp/user/request metadata. Displayed Terms and Privacy dates are aligned with enforced version `2026-09-09`. |
| PR state | PASS | PR #1 remains open, Draft, mergeable, and unmerged. This is not commercial launch approval. |
| Final-head QA after future changes | BLOCKED | Re-run and record QA for the final release head after all remaining code/documentation changes are complete. |

## Current live Render checkpoint

Observed from connected Render workspace on 2026-09-09.

- Service `zovro-api-final` is live on branch `zovro-final-deploy`, not on the Draft release-prep branch.
- Deployed backend commit: `2eb66a874359abb28d632ad9d2d2f14885626c1c`.
- External-gate configuration was explicitly merged into Render: `ZOVRO_PLATFORM_FEE_BPS=0`, `ZOVRO_DB_MIRROR_MODE=mirror`, and the verified OneSignal App ID.
- Render deploy `dep-daglstid0e5s73d2dof0` completed live at 2026-09-09T13:26:33Z after that configuration update.
- Startup confirmed `dbMirrorMode=mirror`, `databaseUrlPresent=true`, `pgModuleAvailable=true`, `postgresRuntimeReady=true`, and `oneSignalAppIdPresent=true`.
- `postgres_mirror_ready` again reported localRecords=0 and remoteRecords=0. This is empty-state consistency only and does not prove durable persistence.
- A direct read-only SQL inspection attempt through the connected Render query tool was blocked by its SSL/TLS negotiation path, while the deployed application itself continues to report the mirror initialized. Treat DB-01 as BLOCKED until persistence evidence is collected through a verified path.
- Current production blockers reported by startup remain `stripe_publishable`, `stripe_secret`, `stripe_webhook`, and `onesignal_rest_key`; `externalLaunchReady=false`.

## Current Stripe live checkpoint

Observed through the connected Stripe live account on 2026-09-09.

- Account name: `Zovro`; country US; default currency USD.
- `charges_enabled=false`, `payouts_enabled=false`, `details_submitted=false`.
- `card_payments=inactive` and `transfers=inactive`.
- Stripe currently requires business profile classification/description/support phone, business type, representative identity/date-of-birth/email/name, statement descriptor confirmation, and Stripe Terms acceptance before activation can complete.
- No live webhook endpoints are currently registered.
- These identity, legal acceptance, and owner-controlled contact fields must not be fabricated or accepted by automation. PAY-01/PAY-02 remain BLOCKED until the account owner completes them and production keys/webhook evidence are available.

## Current OneSignal checkpoint

Observed through the connected OneSignal organization on 2026-09-09.

- One accessible app exists: `Zovro llc App` (`7992b022-6c11-4a66-bad4-8cbd114266d0`).
- Active Subscriptions count is currently 0 and there are no sent notifications, so real-device delivery cannot yet be proven.
- Three push templates were created for release preparation: `ZOVRO - New Nearby Request`, `ZOVRO - Provider Accepted`, and `ZOVRO - Job Status Update`.
- Render still reports `oneSignalRestKeyPresent=false`. The connected OneSignal integration authenticates independently and does not expose a reusable REST key for Render; do not copy or invent a secret.
- APNs/FCM credentials plus at least one real iOS/Android subscription are still required before PUSH-01 can pass.

## Launch gates and next actions

All gates below remain BLOCKED unless explicitly marked PASS.

| ID | Gate | Repository work | External dependency / proposed owner | Exact next action and PASS evidence |
| --- | --- | --- | --- | --- |
| PAY-01 | Stripe account and configuration | Repository payment safety tests pass. Current launch model remains 0% platform fee during launch and Render now explicitly sets `ZOVRO_PLATFORM_FEE_BPS=0`. | Stripe account owner; Render operator. | Complete live Stripe onboarding/identity/business/contact/ToS requirements; verify card payments and transfers become active; add production publishable/secret keys securely in Render. |
| PAY-02 | Signed webhook and payment lifecycle | Server-side signature and payment safety checks are in QA. | Stripe dashboard, deployed backend, eligible connected provider; payments operator. | Register the production webhook for `/api/payments/webhook`; record a valid signed event accepted, invalid signature rejected, replay without duplicate transaction, correct request/amount, decline, refund/cancellation, and provider transfer readiness. Current live webhook count is zero. |
| PUSH-01 | OneSignal/APNs/FCM | Repository push safety checks pass; OneSignal app exists and release templates are prepared. | OneSignal, Apple/APNs, Firebase/FCM, physical iPhone and Android; mobile/push operator. | Add the server-side OneSignal REST credential securely to Render, complete APNs/FCM credentials, create real device subscriptions, and record new-request/provider-accepted/job-status delivery plus account isolation and tap routing. Current Active Subscriptions count is zero. |
| AND-01 | Android release signing | Prepare versionCode/versionName, `com.zovro.app`, release workflow and production API configuration. | Upload key/secret store, Play Console and Android device; Android release operator. | Produce signed AAB; record SHA-256, source SHA and version. Attach Play validation/test-track evidence and installed-build API, permission, push, resume and navigation QA. |
| IOS-01 | iOS distribution signing | Face ID boot path is code-hardened and QA-passed. Prepare `com.zovro.app`, entitlements, version and archive workflow. | Apple Developer, signing resources, App Store Connect, build environment and physical iPhone; iOS release operator. | Produce signed device archive; verify Face ID unlock on physical iPhone; record source SHA/build and artifact checksum. Attach successful TestFlight processing, installation and device QA. Simulator-only output cannot close this gate. |
| ASSET-01 | Final screenshots and graphics | Prepare capture script, safe sample data, icons, graphic assets and feature-claim review. | Final signed mobile builds and capture environment; release/design operator. | Capture home, request, Smart Match, discovery, acceptance, status, messaging, reputation and profile/support/deletion from submitted builds. Record build IDs, asset paths and console validation. No mockups, private data or unsupported feature claims. |
| SUPPORT-01 | Monitored support and public links | `support.html`, Privacy and Terms are present and store-readiness QA passes. | Owner-controlled support inbox, hosting and responsible support person; product owner. | Supply a final public support contact that the owner explicitly wants published; verify a test inquiry is received and answered; verify public Privacy/Terms/Support URLs and account deletion from both signed apps. |
| LEGAL-01 | Content, consent and declarations | PASS for repository consent mechanics: account/request/SOS consent is explicit, versioned, server-enforced and audited; Terms/Privacy displayed versions match the enforced version. | Product/legal owner and store consoles. | Complete final human legal review of substantive Terms/Privacy/payment/cancellation language and store declarations matching actual production behavior. Repository technical consent does not replace legal approval. |
| STORE-01 | Console ownership and submission readiness | Prepare listing metadata, reviewer notes and app-ID/build checklist. | Authorized Apple and Google account holders. | Verify correct app records, sufficient roles, account requirements and ability to upload. Record accepted builds, completed declarations/assets, and no unresolved submission blockers. |
| DB-01 | PostgreSQL durability | Current mirror startup/readiness path works; mirror remains intentionally active. | Render app/database access; backend operator. | Stay in mirror mode until representative non-empty data, critical row counts, new mirrored writes, restart persistence, backup/restore and rollback checks pass. Only then perform controlled durable cutover and record `durableOperational=true`. |
| PRIV-01 | Pre-acceptance customer/provider privacy and acceptance safety | PASS in repository. Request discovery redacts customer identity/address/location/messages/retry IDs; public provider discovery removes phone/email/raw license/Stripe identifiers; chat is limited to customer and accepted provider; acceptance requires active/available/service-compatible providers and fresh provider location within 15 miles for SOS/urgent or 25 miles for location-based normal jobs; structured logs pseudonymize raw client IP. | Production deployment still runs an older branch commit. | Preserve these guards in the final deployed SHA and re-run integrated customer/provider privacy tests in production before launch. |
| LIVE-01 | Final integrated readiness | Repository Full QA #133 is green on commit `8f00b38dc68fb0d630d9791aa65bdb3b293a7c3e`; current Render external-gate deploy is live but production code still uses the older production branch commit. | Production backend, signed mobile builds and test accounts; release operator. | Deploy the final verified release SHA only after external gates pass; then record timestamped readiness payloads and complete customer/provider lifecycle, payment, push, privacy, consent, security, support and deletion end to end. |

## Execution order

1. Keep PR #1 Draft and PostgreSQL in mirror mode.
2. Preserve repository QA/security/privacy/consent guards and re-run QA after any final evidence/documentation change.
3. Complete Stripe owner-controlled onboarding, production keys and webhook; complete OneSignal REST/APNs/FCM credentials and register real devices.
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

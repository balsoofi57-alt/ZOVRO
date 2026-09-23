# ZOVRO release evidence checklist

Verified checkpoint: 2026-09-23. Repository evidence reconciled with current Render and Stripe read-only observations. Owner: ZOVRO release maintainer (automated checks performed by Codex).
Release tracking: [PR #1](https://github.com/balsoofi57-alt/ZOVRO/pull/1) was closed without merging on 2026-09-23. It is historical evidence, not an active release candidate. `main` and `zovro-final-deploy` remain separate; no store launch is claimed.

## Evidence rules

- Missing evidence is BLOCKED, not PASS. Repository QA, configured credentials, HTTP 200 responses, or unsigned builds alone do not prove commercial launch readiness.
- Record exact source/deployed SHAs, timestamps, build IDs, environment, expected/actual results, and links. Never commit secrets or customer data.
- PostgreSQL production mode is now durable. Startup restore/table-count verification and write-safety guards must remain green; do not perform destructive database tests on production.
- Do not merge diverged branches blindly. Reconcile reviewed changes and preserve production hardening.

## Verified source and build evidence

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Full QA | PASS | `ZOVRO Full QA` run `35781496291` completed successfully on 2026-09-22 for production runtime source `7ce40e787d4ca01ccb724ade93fa72a2ddd7a3c4`. |
| Store listing metadata | PASS in source | `store/listing.en-US.json` contains the en-US Apple/Google listing copy, public URLs, screenshot story, and reviewer notes. `npm run store:check` validates identifiers, HTTPS URLs, support identity, character limits, safety language, and Play feature-graphic dimensions. Final signed-build screenshots are still required. |
| Android compilation | PASS, unsigned | `Build ZOVRO Android` run `35781496420` and `ZOVRO Android Release Verification` run `35781496474` completed successfully on 2026-09-22 for `7ce40e787d4ca01ccb724ade93fa72a2ddd7a3c4`. Debug APK and unsigned release AAB artifacts were produced; signing, Play acceptance, and physical-device behavior remain external gates. |
| iOS verification | PASS, simulator only | `ZOVRO iOS Release Verification` run `35781496413` completed successfully on 2026-09-22 for `7ce40e787d4ca01ccb724ade93fa72a2ddd7a3c4`. The simulator artifact is unsigned; App Store signing, TestFlight, and physical-device behavior remain external gates. |
| Production profile encryption readiness | PASS in production | Current runtime startup preflight on production source `7ce40e787d4ca01ccb724ade93fa72a2ddd7a3c4` reports `profileEncryptionConfigured=true`. |

## Live production observations

Source: Render service/deploy tools and read-only endpoint/log checks refreshed on 2026-09-22.

- Primary service: `zovro-api-final`; branch `zovro-final-deploy`.
- Live URL: https://zovro-api-final.onrender.com
- Latest observed live API deploy: `9f3de94e00f1c3a8f8faae9c3e83e35b074abb86` (2026-09-23 00:59 UTC, gated password recovery remains disabled by default). The older `7ce40e787d4ca01ccb724ade93fa72a2ddd7a3c4` has the recorded Full QA and unsigned mobile build evidence; those runs do not automatically validate later runtime changes.
- Latest observed startup preflight reports `dbMirrorMode=durable`, `postgresRuntimeReady=true`, `durableOperational=true`, `blockers=[]`, and `externalLaunchReady=true`.
- PostgreSQL is running in durable mode. The latest verified startup restore recovered 13 records and reported `verified=true`; isolated backup/restore and rollback evidence remains a separate operational gate.
- Public [Privacy](https://zovro-web.onrender.com/privacy.html), [Terms](https://zovro-web.onrender.com/terms.html), and [Support](https://zovro-web.onrender.com/support.html) pages returned HTTP 200 during the latest verification. Inbox monitoring and legal approval are separate gates.

## Live Stripe observations

Source: connected Zovro Stripe account, US live mode, refreshed 2026-09-22.

- `charges_enabled=true`, `payouts_enabled=true`, and `details_submitted=true`.
- `card_payments=active` and `transfers=active`.
- The live webhook endpoint is enabled at https://zovro-api-final.onrender.com/api/payments/webhook using API version `2026-08-26.dahlia`, with events `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `transfer.reversed`.
- Render has the webhook signing secret configured.
- No real signed Stripe POST delivery was observed in the reviewed Render logs; only unauthenticated GET/HEAD probes returned the expected 401. The payment lifecycle gate therefore remains open.
- Stripe account requirements currently report `currently_due=[]`, `eventually_due=[]`, `past_due=[]`, `pending_verification=[]`, with no current deadline or disabled reason.
- Live account evidence confirms `charges_enabled=true`, `payouts_enabled=true`, and a successful $1.00 PaymentIntent plus successful linked refund. No new payment or refund was created for this documentation refresh.

## 2026-09-23 reconciliation (read-only)

- Render's current web deploy is live at `b9b55d5bbc1ee258fa80fb3a7e790e45214f1fc2` (2026-09-23 03:09 UTC). [PR #30](https://github.com/balsoofi57-alt/ZOVRO/pull/30) merged the iPhone CTA/sign-in spacing fix; live GPS permission and SOS behavior still require iPhone acceptance evidence.
- The latest API deploy is live at `9f3de94e00f1c3a8f8faae9c3e83e35b074abb86`; no full QA or signed mobile build is claimed for that exact SHA here.
- The connected Zovro live Stripe account still lists an enabled endpoint for the four configured payment events at `/api/payments/webhook`. Render's path-filtered log query from 2026-09-22 onward returned no webhook requests. This log search alone cannot prove that Stripe has never attempted delivery; retain PAY-01 as partial until an event ID, delivery result, and application signature verification are recorded.
- Render error-level log query returned no entries in the queried window. This is a scoped observation, not an integrated acceptance pass.
- [PR #29](https://github.com/balsoofi57-alt/ZOVRO/pull/29) is an open draft documenting four Apple signing secret names; it does not produce a signed IPA or TestFlight acceptance.
- Direct HTTP health probing from the current worker timed out. Render reports the API and web deploys as live; no fresh HTTP health response is claimed from that probe.

## OneSignal observations

- Production OneSignal App ID and REST API key are configured.
- The connected ZOVRO OneSignal app exists and has nine prepared push templates.
- Real APNs and FCM delivery on signed physical devices has not been verified. Configuration presence is not delivery evidence.

## Remaining launch gates

| ID | Gate | Status | Exact next evidence |
| --- | --- | --- | --- |
| TAX-01 | Company verification | PASS | Stripe currently reports no due, past-due, or pending-verification account requirements; charges and payouts are enabled. |
| PAY-01 | Payment/webhook lifecycle | PARTIAL | Live payment and linked refund are verified; webhook endpoint/configuration and signature/idempotency code are present. Remaining evidence: successful signed live webhook POST receipt/delivery. |
| PUSH-01 | Real mobile delivery | BLOCKED | Configure APNs/FCM, register signed iOS/Android devices, and record request/acceptance/status delivery plus notification-tap routing. |
| AND-01 | Android distribution | BLOCKED | Produce a release-signed AAB, record its source SHA and SHA-256, obtain Play test-track acceptance, and pass physical-device tests. |
| IOS-01 | iOS distribution | BLOCKED | Produce a signed archive/IPA, complete TestFlight processing, and pass physical-device GPS, Face ID, payment, and push tests. |
| DB-01 | Durable storage | PARTIAL/PASS FOR CURRENT STARTUP | Production has been moved to durable mode and startup restore reported 13 restored records with per-table count verification. Remaining external evidence: isolated backup/restore and rollback drill without destructive production changes. |
| SUPPORT-01 | Support operations | BLOCKED | Record monitored `support@zovro.work` send, receive, and reply evidence. |
| STORE-01 | Store submission | PARTIAL | en-US listing metadata and public URLs are prepared. Remaining: signed-build screenshots/graphics, authorized Apple/Google records, completed privacy/data-safety forms, content rating, and legal review. |
| LIVE-01 | Integrated launch | BLOCKED | Identify final deployed backend SHA and signed mobile builds, then pass customer/provider/request/SOS/payment/push/privacy/consent/support/deletion lifecycle tests. |

## Next execution order

1. Complete the remaining Stripe signed live webhook delivery proof; account verification, live payment, refund, and payout readiness are already verified.
2. Sign Android/iOS builds and complete physical-device push, GPS, SOS, biometric, and payment tests.
3. Capture truthful screenshots from those signed builds and upload the prepared store listing metadata.
4. Preserve durable mode; complete isolated backup/restore and rollback evidence without destructive production changes.
5. Reconcile final reviewed source with production, rerun QA and integrated acceptance on the final SHA, and open a current reviewable release PR. PR #1 is closed without merging.

Production secrets and signing identities cannot be reconstructed from source. Missing external account or device evidence remains explicit.


## 2026-09-17 source reconciliation update

- Canonical release source remains `zovro-final-deploy`; `main` and production are diverged, so blind merge is prohibited.
- Current customer/service UX, secure payment client, tip flow, Change Order, security code, and Request Again were selectively reconciled into production source.
- Enhanced production mobile bundle was preserved: secure session, biometric, consent, private profile, OneSignal push client, Leaflet live map, and support center.
- Production/store/final checks now gate the reconciled release-critical client features and reject the legacy payment UI renderer override.
- SMS transport remains disabled by default; no real SMS is part of automated release evidence.
- Real payment, real push, signed-device, store-account, support-inbox, and signing evidence remain external gates and must not be marked PASS from source inspection alone.

# ZOVRO release evidence checklist

Verified checkpoint: 2026-09-11, 18:06 UTC. Owner: ZOVRO release maintainer (automated checks performed by Codex).
Release PR: [#1](https://github.com/balsoofi57-alt/ZOVRO/pull/1), Draft. Source and production branches remain separate; no store launch is claimed.

## Evidence rules

- Missing evidence is BLOCKED, not PASS. Repository QA, configured credentials, HTTP 200 responses, or unsigned builds alone do not prove commercial launch readiness.
- Record exact source/deployed SHAs, timestamps, build IDs, environment, expected/actual results, and links. Never commit secrets or customer data.
- Keep PostgreSQL in mirror mode until representative non-empty count/hash parity, restart persistence, backup/restore, and rollback checks pass.
- Do not merge diverged branches blindly. Reconcile reviewed changes and preserve production hardening.

## Verified source and build evidence

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Full QA | PASS | [Run #341](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34631253817) completed successfully for `store-release-prep` head `e981d3bfeb3b89bfa7ab02208a5942fcadab8edc`. |
| Store listing metadata | PASS in source | `store/listing.en-US.json` contains the en-US Apple/Google listing copy, public URLs, screenshot story, and reviewer notes. `npm run store:check` validates identifiers, HTTPS URLs, support identity, character limits, safety language, and Play feature-graphic dimensions. Final signed-build screenshots are still required. |
| Android compilation | PASS, unsigned | Android build run #5 succeeded for source `6009cc6d4896887e54b83adb3e0af8e487d61ffd`. Artifacts `zovro-android-debug-apk` and `zovro-android-release-unsigned-aab` were present at the last check. This does not prove signing, Play acceptance, or device behavior. |
| iOS verification | PASS, simulator only | iOS Release Verification run #39 succeeded for source `6009cc6d4896887e54b83adb3e0af8e487d61ffd`. Artifact `zovro-ios-simulator-unsigned` is not a signed archive or TestFlight build. |
| Production profile encryption readiness | PASS in production | Production branch `zovro-final-deploy` is at `c95e6dc1640b9c649b889bbcce41fe57088adc57` with profile-encryption readiness hardening deployed. |

## Live production observations

Source: Render service/deploy tools and read-only endpoint/log checks performed on 2026-09-11.

- Primary service: `zovro-api-final`; branch `zovro-final-deploy`.
- Live URL: https://zovro-api-final.onrender.com
- Latest verified deployed source: `c95e6dc1640b9c649b889bbcce41fe57088adc57`.
- Latest observed startup preflight: `dbMirrorMode=mirror`, `databaseUrlPresent=true`, `pgModuleAvailable=true`, `stripePublishablePresent=true`, `stripeSecretPresent=true`, `stripeWebhookPresent=true`, `oneSignalAppIdPresent=true`, `oneSignalRestKeyPresent=true`, `productionSecretPresent=true`, `allowedOriginsPresent=true`, `profileEncryptionConfigured=true`, `postgresRuntimeReady=true`, `mirrorOperational=true`, `blockers=[]`, and `externalLaunchReady=true`.
- PostgreSQL remains intentionally in mirror mode. A connected mirror does not prove durable recovery or authorize cutover.
- Public [Privacy](https://zovro-web.onrender.com/privacy.html), [Terms](https://zovro-web.onrender.com/terms.html), and [Support](https://zovro-web.onrender.com/support.html) pages returned HTTP 200 during the latest verification. Inbox monitoring and legal approval are separate gates.

## Live Stripe observations

Source: connected Zovro Stripe account, US live mode, checked 2026-09-11.

- `charges_enabled=true`, `payouts_enabled=true`, and `details_submitted=true`.
- `card_payments=active` and `transfers=active`.
- The live webhook endpoint is enabled at https://zovro-api-final.onrender.com/api/payments/webhook using API version `2026-08-26.dahlia`, with events `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `transfer.reversed`.
- Render has the webhook signing secret configured.
- No real signed Stripe POST delivery was observed in the reviewed Render logs; only unauthenticated GET/HEAD probes returned the expected 401. The payment lifecycle gate therefore remains open.
- `requirements.currently_due` still contains `company.tax_id` with `verification_failed_tax_id_match`. Stripe reports that the document EIN does not match the EIN recorded on the account.
- Current reported deadline: 2026-10-09. No identity data, EIN, documents, payment, refund, or payout was modified by this verification.

## OneSignal observations

- Production OneSignal App ID and REST API key are configured.
- The connected ZOVRO OneSignal app exists and has nine prepared push templates.
- Real APNs and FCM delivery on signed physical devices has not been verified. Configuration presence is not delivery evidence.

## Remaining launch gates

| ID | Gate | Status | Exact next evidence |
| --- | --- | --- | --- |
| TAX-01 | Company verification | BLOCKED | Authorized owner provides IRS-matching legal name/EIN evidence or corrects the account EIN; Stripe clears `company.tax_id` before 2026-10-09. |
| PAY-01 | Payment/webhook lifecycle | BLOCKED | Record authorized success, decline, refund/cancel, replay-protection, and provider-transfer tests with Stripe event/delivery IDs and successful signature verification. |
| PUSH-01 | Real mobile delivery | BLOCKED | Configure APNs/FCM, register signed iOS/Android devices, and record request/acceptance/status delivery plus notification-tap routing. |
| AND-01 | Android distribution | BLOCKED | Produce a release-signed AAB, record its source SHA and SHA-256, obtain Play test-track acceptance, and pass physical-device tests. |
| IOS-01 | iOS distribution | BLOCKED | Produce a signed archive/IPA, complete TestFlight processing, and pass physical-device GPS, Face ID, payment, and push tests. |
| DB-01 | Durable storage | BLOCKED | Create representative non-empty mirror traffic; prove strict count/hash parity, restart persistence, isolated restore, and rollback. Only then consider durable cutover. |
| SUPPORT-01 | Support operations | BLOCKED | Record monitored `support@zovro.net` send, receive, and reply evidence. |
| STORE-01 | Store submission | PARTIAL | en-US listing metadata and public URLs are prepared. Remaining: signed-build screenshots/graphics, authorized Apple/Google records, completed privacy/data-safety forms, content rating, and legal review. |
| LIVE-01 | Integrated launch | BLOCKED | Identify final deployed backend SHA and signed mobile builds, then pass customer/provider/request/SOS/payment/push/privacy/consent/support/deletion lifecycle tests. |

## Next execution order

1. Resolve the Stripe EIN mismatch and complete a controlled live payment/webhook proof.
2. Sign Android/iOS builds and complete physical-device push, GPS, SOS, biometric, and payment tests.
3. Capture truthful screenshots from those signed builds and upload the prepared store listing metadata.
4. Generate representative non-empty mirror traffic and complete durability/recovery evidence without changing mirror mode prematurely.
5. Reconcile final reviewed source with production, perform integrated acceptance, and only then move PR #1 out of Draft.

Production secrets and signing identities cannot be reconstructed from source. Missing external account or device evidence remains explicit.

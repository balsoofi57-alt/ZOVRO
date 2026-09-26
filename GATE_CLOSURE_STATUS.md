# ZOVRO Gate Closure Status

Checkpoint: 2026-09-26

## Authoritative current status — 2026-09-26

- Production stability recheck after OneSignal correction: Render service is live; startup preflight reports `oneSignalCredentialsVerified=true`, `durableOperational=true`, `blockers=[]`, and `externalLaunchReady=true`; PostgreSQL restore verified 34 records and `/api/health` returned HTTP 200. Latest Render build also reported 0 npm vulnerabilities.
- Latest mobile workflows confirm source/build readiness but no store signing: Android produced debug APK + unsigned release AAB while signed AAB steps were skipped; iOS produced the unsigned simulator app while signed archive/IPA/TestFlight steps were skipped. Remaining work for this gate is external signing credential provisioning, not source-code repair.
- Release verification after the OneSignal mobile App ID correction is fully green on commit `9f88d8c77f90a63090e8cbed34b9eb46b9f4c90a`: Full QA run `36254277076`, Android Release Verification run `36254277047`, Android build run `36254277027`, and iOS Release Verification run `36254277032` all completed successfully.
- Latest mobile artifacts are verified but unsigned: Android release candidate artifact `10910069161`, debug APK `10910380268`, unsigned AAB `10909074853`, and iOS simulator artifact `10909274485` were produced successfully on 2026-09-26. Signed Android AAB and signed iOS IPA steps were skipped because signing credentials are not provisioned.
- OneSignal mobile App ID correction is fully verified: Full QA `36254277076`, Android Release Verification `36254277047`, Android Build `36254277027`, and iOS Release Verification `36254277032` all completed successfully for commit `9f88d8c77f90a63090e8cbed34b9eb46b9f4c90a`.
- Android Release Verification passed on workflow run `36254277047` for commit `9f88d8c77f90a63090e8cbed34b9eb46b9f4c90a` after the OneSignal mobile App ID correction. The Kotlin/R8/D8 messages observed in logs were non-fatal warnings, not release blockers.
- Mobile OneSignal App ID correction: `push-client.js`, `.env.mobile.example`, `scripts/prepare-mobile.js`, and the native push readiness guard now use the correct App ID `2d595bd4-61a1-40f2-9e8d-02900ab6f367`. ZOVRO Full QA run `#792` / workflow run `36254277076` passed on commit `9f88d8c77f90a63090e8cbed34b9eb46b9f4c90a`.
- OneSignal backend credential gate: CLOSED on 2026-09-26. The correct OneSignal App ID is `2d595bd4-61a1-40f2-9e8d-02900ab6f367`; after updating Render to this App ID, the safe non-deliverable credential probe returned HTTP 400 as expected, with `oneSignalCredentialsVerified=true`, `blockers=[]`, and `externalLaunchReady=true`.
- Security hardening refresh (2026-09-26): production readiness now blocks if `ZOVRO_SECRET`, `ZOVRO_ALLOWED_ORIGINS`, or `ONESIGNAL_APP_ID` are missing; temporary OneSignal diagnostic fields were removed from production logs after diagnosis.

This section is the current source of truth. Older sections below are retained as historical evidence where explicitly labeled.

- Production backend: live on Render.
- Database mode: `durable`; PostgreSQL runtime ready and durable operation confirmed.
- Stripe platform payment gate: CLOSED.
- Forgot Password / recovery gate: CLOSED.
- Support / Privacy / Terms technical gate: CLOSED.
- Store metadata / privacy-data-safety technical preparation: CLOSED.
- Mobile signing workflow code: CLOSED.
- Legal-review preparation: CLOSED; final human approval remains external.
- Current production backend readiness: READY; no startup preflight blockers remain.
- OneSignal subscriptions: 0 total / 0 active; no physical-device push evidence yet.
- iOS/Android signing credentials: not provisioned in GitHub Actions; signed IPA/AAB generation and store upload remain external.
- Remote Desktop Commander is not connected, so local Xcode/Gradle signing cannot be executed from this chat yet.

## Latest continuation — provider history and handoff privacy

- Resumed release candidate `store-release-prep` at `f3a4e8750a8376042afafe78acbb7a365fe5fcb7`.
- Reproduced an end-to-end failure: public profile sanitization removed the new `stats` object, breaking professional history and reliability display.
- Fixed the public serializer to retain only explicitly named aggregate statistics, nullable new-provider ratings/completion rates, and known professional-level labels. Nested audit details, emergency reasons, contact data, and malformed values remain excluded.
- Extended integration checks to cover nearby-provider statistics, contact-field redaction, former-provider request-list/chat/tracking denial, replacement discovery redaction, and private handoff reasons after acceptance.
- Local `npm run qa:all` passed after the fix (Node 24.19.0). GitHub's Node 22 QA and mobile build results must be checked against the new commit; the older run numbers below are historical evidence only.
- Independently checked Render: `zovro-api-final` remains live at `c95e6dc1640b9c649b889bbcce41fe57088adc57`. At 2026-09-12 00:19 UTC, `/api/health` returned `ok=true`, and `/api/ready` returned `ready=true`, `mirrorMode=mirror`, `postgresOperational=true`.
- These source changes are on the release candidate, not yet deployed to production. PR #1 stays Draft; no store upload, live transaction, or database-mode change was performed in this continuation.
- Stripe tax verification, real signed payment webhook delivery, signed-device push, mobile signing/store access, support/legal verification, screenshots and database durability evidence remain open. Their external account state was not reverified in this continuation.

## Earlier repository / QA evidence (2026-09-11)

- Release PR #1 remains Draft and mergeable pending external launch gates.
- Current verified release-candidate head: `6009cc6d4896887e54b83adb3e0af8e487d61ffd`.
- ZOVRO Full QA run #337 completed successfully for that head.
- Android build run #5 completed successfully for the same head.
- iOS Release Verification run #39 completed successfully for the same head.

## Android packaging — SIGNING WORKFLOW CODE CLOSED / CREDENTIAL PROVISIONING OPEN

- `zovro-android-debug-apk` artifact exists and is unexpired.
- `zovro-android-release-unsigned-aab` artifact exists and is unexpired.
- The unsigned release AAB build is verified. The release workflow now checks that the Android application ID is `com.zovro.app` before signing.
- GitHub Actions currently has no Android keystore, keystore password, key alias, or key password secrets; signed AAB generation therefore remains skipped.
- Source-side signing workflow preparation is closed. Remaining Android work is external credential provisioning, signed AAB generation, physical-device acceptance, and Play Console upload.

## iOS packaging — SIGNING WORKFLOW CODE CLOSED / CREDENTIAL PROVISIONING OPEN

- `zovro-ios-simulator-unsigned` artifact exists and is unexpired.
- The unsigned simulator build is verified. The signing workflow now validates Apple team identity, `com.zovro.app`, and requires `aps-environment=production` in the provisioning profile before creating an App Store archive.
- GitHub Actions currently has no distribution certificate, provisioning profile, Apple team ID, or App Store Connect API credentials; signed archive/export/upload steps therefore remain skipped.
- Source-side signing workflow preparation is closed. Remaining iOS work is external credential provisioning, signed IPA generation, physical-device acceptance, and TestFlight/App Store Connect upload.

## PostgreSQL — HISTORICAL MIRROR STATUS (SUPERSEDED)

- Render service remains intentionally in `ZOVRO_DB_MIRROR_MODE=mirror`.
- Latest observed production startup preflight reports `databaseUrlPresent=true`, `pgModuleAvailable=true`, `postgresRuntimeReady=true`, `mirrorOperational=true`, `blockers=[]`, and `externalLaunchReady=true` for the current mirror-mode configuration.
- Do not switch to `durable` until representative non-empty production traffic exists, strict count/hash parity passes, restart persistence is proven, and backup/restore/rollback evidence is captured.
- Do not weaken PostgreSQL TLS.

## Production deployment — HISTORICAL MIRROR-MODE EVIDENCE (SUPERSEDED)

- Render service: `zovro-api-final`.
- Production branch: `zovro-final-deploy`.
- Current production commit recorded in release evidence: `c95e6dc1640b9c649b889bbcce41fe57088adc57`.
- Public production backend is live at `https://zovro-api-final.onrender.com`.
- External launch gates remain intentionally blocked until payment, push, signing, real-device, support, legal/store and durability evidence are complete.

## Stripe live — PLATFORM PAYMENT GATE CLOSED

Verified current state:
- `charges_enabled=true`
- `payouts_enabled=true`
- `card_payments=active`
- `transfers=active`
- `details_submitted=true`
- Production webhook endpoint is enabled at `https://zovro-api-final.onrender.com/api/payments/webhook`.
- Webhook signing secret is configured in Render.
- Subscribed events include `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, and `transfer.reversed`.

Still open:
- Stripe Account Status currently shows no active tasks; Payments and Payouts are active.
- Stripe Tax details now shows **Verified** for the live account; the prior EIN / `company.tax_id` mismatch is no longer an open gate.
- Production destination `ZOVRO Production Webhook` is Active and subscribes to `charge.refunded`, `payment_intent.payment_failed`, `payment_intent.succeeded`, and `transfer.reversed`.
- A live `charge.refunded` event shows **Delivered / Recovered** with **HTTP 200**, proving Stripe-to-ZOVRO signed webhook delivery is accepted by the production endpoint.
- Historical webhook failures are now explained: Render startup logs from the failure window show `stripeWebhookPresent=false` and blocker `stripe_webhook`. The signing secret was not configured at that time. Current production has the webhook secret configured and accepts deliveries with HTTP 200.
- A live `payment_intent.succeeded` delivery is visible in Stripe Event deliveries with **HTTP 200**, proving the production success-payment webhook reaches ZOVRO successfully.
- The failed-payment path is additionally regression-tested in CI: a correctly signed `payment_intent.payment_failed` event returns HTTP 200, records the failure code/message, and duplicate delivery is acknowledged without a second state mutation. Full QA passed before merge.
- Production now logs webhook signature rejection safely as `stripe.webhook_signature_rejected` with only a coarse reason; secrets and payloads are never logged. The hardened commit is live on Render.
- `payment_intent.payment_failed` is covered by signed-webhook regression testing: HTTP 200, failure-state persistence, and duplicate suppression all pass in full QA.
- A gated production summary found 0 active providers and therefore 0 linked Connect accounts. There is no live provider account to validate yet; this is not a Stripe platform configuration failure. The diagnostic flag was disabled immediately after the check.
- Stripe platform payment readiness is closed. Provider Connect onboarding/payout verification becomes a first-provider activation check when the first real provider registers; ZOVRO already blocks in-app payment until that provider has a linked Connect account with payouts enabled.

## OneSignal / push — CODE READY / CREDENTIAL + DEVICE GATE OPEN

- OneSignal app: `Zovro llc App`.
- OneSignal App ID is configured for the production backend.
- OneSignal REST API key is configured for the production backend.
- The connected OneSignal account currently shows no sent push notifications in message history.
- Real APNs/FCM delivery on signed physical devices has not yet been verified.
- Production credential verification now passes with the correct OneSignal App ID `2d595bd4-61a1-40f2-9e8d-02900ab6f367`; startup preflight reports `oneSignalCredentialsVerified=true`, `blockers=[]`, and `externalLaunchReady=true`.
- OneSignal currently reports 0 total subscriptions and 0 active subscriptions, so no physical device is registered yet.
- Repository signing-secret presence check shows all Android signing secrets and all iOS distribution/provisioning/App Store Connect secrets are absent.
- iOS native preparation now explicitly adds the production APNs entitlement (`aps-environment=production`) and wires it into code signing; Full QA passed.
- Remaining gate: complete APNs/FCM platform credentials, provide mobile signing credentials, install signed builds on physical devices, register subscriptions, then verify receipt/tap routing.

## Privacy / Terms / Support — TECHNICAL GATE CLOSED / LEGAL REVIEW STILL OPEN

- Public source pages exist for Privacy Policy, Terms of Service, and Support on the `main` branch used by the live `zovro-web` Render static site.
- Support and Privacy both use the canonical address `support@zovro.work`.
- Gmail evidence confirms bidirectional support operation: owner messages were sent to `support@zovro.work`; automated policy replies, alert-connection tests, and recurring overdue-review alerts were received from `support@zovro.work` in the company Gmail inbox.
- Render reports `zovro-web` live with auto-deploy from `main`; the current deployed branch contains the corrected Support, Privacy, and Terms pages.
- Terms clearly states that SOS/roadside features do not replace 911 and discloses beta/payment behavior.
- Technical support/inbox monitoring is closed. Independent legal review of Terms/Privacy remains a separate launch gate.

## Store metadata / privacy declarations — TECHNICAL PREPARATION CLOSED

- Apple and Google Play listing metadata exists in `store/listing.en-US.json` and is validated by the store-readiness check.
- The App Privacy / Google Play Data Safety worksheet has been refreshed to match current production integrations: Stripe live payments, durable PostgreSQL, OneSignal push integration, support@zovro.work, location, messaging, account deletion, and no advertising/cross-app tracking SDK in the current source.
- Store-readiness now fails if the privacy/data-safety worksheet is missing, the legacy `support@zovro.net` address reappears, or required push/signing/privacy/legal release-gate notes disappear.
- Latest Android and iOS release-verification workflows both pass their unsigned build stages. Signed Android AAB and signed iOS archive steps are skipped because signing secrets are absent.
- Technical store metadata and privacy/data-safety preparation is closed.
- Final screenshots and the last App Privacy / Google Play Data Safety form reconciliation are now tracked under the signed-build/store-submission gate, because those steps require the final signed release candidate rather than more source-side work.

## Password recovery / Forgot Password — CLOSED

- Closed on 2026-09-26.
- Production recovery status reports available.
- Production readiness reports ready with no password-recovery blocker.
- Secure email fallback is enabled when Twilio Verify is unavailable.
- Recovery worker is protected by a private internal token and its endpoint is hidden from unauthenticated callers.
- Password reset codes are short-lived, rate-limited, and pending email delivery data is sealed before storage.
- Successful recovery revokes all existing sessions for the account.
- ZOVRO Full QA passed for the recovery changes.
- Support-mail service passed 49/49 tests with 0 failures.
- A production smoke test confirmed recovery availability, API readiness, hidden internal recovery endpoint, and rejection of invalid input.
- The scheduled support-mail cycle executed the password-recovery email worker successfully in production.
- This gate is no longer listed as an open launch blocker.

## Remaining launch gates

1. Complete APNs + FCM production credentials and verify real push delivery on signed physical devices.
2. Sign the existing Android release AAB and produce a signed iOS archive; verify physical-device GPS, SOS, push, biometric and payment lifecycle behavior.
3. Upload signed builds through Play Console/TestFlight/App Store Connect and complete store-console metadata.
4. Complete signed-build/store-submission evidence: capture final screenshots and reconcile the prepared App Privacy / Google Play Data Safety forms against the signed production build.
5. Obtain final human legal approval using `LEGAL_REVIEW_PACKET.md`; then proceed to store submission only after the external signing/push/store gates are also closed.

## Current completion position

The executable repository/backend work is substantially complete. Current unresolved work is limited to external credential/device/store/legal approval steps: APNs/FCM credentials, physical-device push evidence, iOS/Android signing credentials and signed builds, store-console upload and final screenshots/declaration reconciliation, plus final human legal approval.


## Legal review preparation — TECHNICAL PREPARATION CLOSED

- Final review packet added as `LEGAL_REVIEW_PACKET.md`.
- Packet consolidates Terms, Privacy, Support, App Privacy / Data Safety, store listing, marketplace role, licensing, payments, location, SMS, biometrics, children/age, support contact, and store declaration review points.
- Source-side legal-review preparation is complete.
- Final human legal approval remains external and cannot be represented as complete until an authorized human reviewer approves the launch documents.


## Release PR #1 — RETIRED

- PR #1 (`Prepare ZOVRO store submission and final release gates`) is closed and was not merged.
- It is historical release-preparation evidence only and is no longer an active launch gate.
- Current release truth is tracked in `zovro-final-deploy` plus this gate-closure file.

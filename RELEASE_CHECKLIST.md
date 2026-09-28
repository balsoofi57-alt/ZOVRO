# ZOVRO 1.0 Launch Checklist

## Verified in source/build — 2026-09-22
- Production-connected web experience
- Customer/provider registration and login
- Nearby provider search and urgent dispatch
- Requests, messaging and job lifecycle
- Service verification code required before work begins
- Cancellations, ratings and provider reputation
- Account/session security and account deletion
- Durable production database runtime/readiness checks
- Privacy, Terms and Support pages
- Full QA passed on main
- Android release verification passed on main
- iOS simulator release verification passed on main
- Current web build deployed live on Render

## Newly verified account/runtime evidence — 2026-09-22
- Render production runtime reports dbMirrorMode=durable, durableOperational=true, postgresRuntimeReady=true, blockers=[] and externalLaunchReady=true.
- Stripe live account requirements and future_requirements are clear; charges_enabled=true and payouts_enabled=true.
- Stripe card_payments and transfers capabilities are active, and a default USD bank account is connected for payouts.
- Stripe production webhook endpoint is enabled at the ZOVRO production API and subscribes to payment_intent.succeeded, payment_intent.payment_failed, charge.refunded and transfer.reversed.
- A real live $1.00 PaymentIntent succeeded, and a real $1.00 refund for that PaymentIntent also succeeded.
- Stripe production delivery/signature evidence is verified: payment_intent.succeeded and charge.refunded recovered successfully with HTTP 200, while an unsigned POST was rejected with HTTP 400.
- The previous Stripe company.tax_id / EIN verification blocker is no longer present in current account requirements.
- OneSignal backend credentials are verified in production (`oneSignalCredentialsVerified=true` with successful credential probes), and Android FCM platform configuration is closed. Message history/device subscriptions still require signed physical-device delivery/open evidence; iOS APNs remains open.

- Public store-review legal pages verified live on 2026-09-28: https://zovro.work/privacy.html includes current third-party SDK and deletion language, and https://zovro.work/support.html#delete-account exposes direct account-deletion instructions.
- Support inbox delivery verified on 2026-09-28: messages sent to support@zovro.work reached the company inbox, automated policy replies were received, and overdue-review alerts were delivered successfully.

## External launch gates still requiring real-world/account evidence
- Stripe durable webhook idempotency/receipt storage is verified and deployed: append-only receipts persist in PostgreSQL, concurrent deliveries are serialized, duplicate replays are rejected safely across restart scenarios, and signed delivery/signature verification are verified. Payout capability/readiness is enabled; no completed provider payout has yet been observed.
- OneSignal physical-device delivery/tap evidence remains open; Android FCM configuration is already closed, while iOS APNs configuration remains open.
- Twilio SMS: A2P/sender approval plus physical-number opt-in, reply, and STOP evidence before enabling live SMS.
- Apple Developer/App Store Connect: distribution signing, archive/TestFlight, store metadata and submission.
- Google Play Console: Android upload-key readiness is verified (public certificate fingerprints and signed-AAB SHA-256 recorded; CI supports signed AAB creation). Remaining: authenticated Play upload/internal-track acceptance, console declarations, and submission.
- Final legal review appropriate to launch jurisdictions.

## Final locked-design release verification — 2026-09-27
- FINAL_UI_DESIGN_LOCK.md is committed on main; approved visual direction is locked while preserving existing application behavior.
- Full QA passed on the locked-design build (GitHub Actions run 36292990105).
- Android release verification passed on the locked-design build (run 36292990073); artifact: zovro-android-release-candidate. The workflow currently produces a debug APK and an **unsigned** release AAB.
- iOS release verification passed on the locked-design build (run 36292990064); artifact: zovro-ios-release-candidate. The workflow currently produces an **unsigned simulator** app archive.
- GitHub Pages deployment completed successfully after the design lock, and https://zovro.work is publicly reachable.
- Automated Google Play Console inspection could not enter the authenticated console because no persistent Play Console browser profile/credentials were available. No store-submission state was changed.

### Remaining store-release blocker
The source/build gates are green, but the generated Android and iOS artifacts are not store-signable submissions. Production launch still requires the authorized store signing identity / upload key and authenticated Google Play / App Store Connect access. Do not mark the mobile app as publicly launched until those signed artifacts are accepted by the stores.

## Google Play Console progress — 2026-09-27
Verified and saved in Play Console for com.zovro.app:
- Developer/account/organization/contact verification complete.
- Privacy policy declaration complete: https://zovro.work/privacy.html
- Ads declaration complete: app declared as not containing ads.
- Government apps declaration complete: not a government app.
- Health apps declaration complete: app does not have health features.
- Advertising ID declaration complete: app declared as not using Advertising ID.
- Financial features declaration complete: app does not provide the listed financial products; ordinary service marketplace payments are processed separately through Stripe.
- Default store listing text saved as draft: app name, short description, and full description complete.
- Dedicated Google Play reviewer customer account created and login verified; Play Console sign-in-details entry remains pending because automated insertion of the reviewer password is intentionally blocked as a sensitive credential action.
- Content rating questionnaire inspected but not submitted; IARC Terms acceptance remains owner-controlled.
- Target audience questionnaire inspected but not saved; age-target selection remains an owner/product policy decision.
- Data Safety questionnaire inspected; evidence-backed draft completion is in progress. Verified draft answers include collection=Yes, encryption in transit=Yes, username/password account creation, no external account login, and public deletion-request support at https://zovro.work/support.html#delete-account. Selected data types are being limited to those directly supported by source/privacy evidence; do not certify/submit until handling purposes are fully verified.
- Store category is already set to Travel & Local; no category change is required.
- Latest QA after lawful-use/account-deletion legal updates is green; Android and iOS release verification remain green.
- Internal testing release exists as draft but has no signed AAB uploaded yet.

## Release rule
Do not describe ZOVRO as fully launched or all external gates as closed until the external evidence above is verified. Do not enable live SMS merely to satisfy a test.

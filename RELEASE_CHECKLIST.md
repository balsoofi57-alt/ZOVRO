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
- Store submission source handoff is now consolidated on `main`: en-US listing metadata, reviewer notes, internal tester handoff, asset checklist, App Privacy/Data Safety worksheet, and final human legal-review packet are present and aligned with `com.zovro.app`, `support@zovro.work`, and Google Play category `Travel & Local`.
- Mobile store release workflows are now consolidated on `main`: guarded Google Play internal-draft upload, Android signed-bundle verification, iOS signing/TestFlight validation/upload, and `mobile-release-workflow-check` are present. Full QA #846 passed on PR #129 with `mobile-release-workflow-check: PASS`, Store Readiness PASS, E2E PASS, and Stripe durability tests PASS. PR #129 was merged as `4e1343b74a0c4f989dd80b7f70c579195e7adfc9`.
- Support inbox delivery verified on 2026-09-28: messages sent to support@zovro.work reached the company inbox, automated policy replies were received, and overdue-review alerts were delivered successfully.
- Live production recheck on 2026-09-28: `/api/health` returned `ok=true`, `/api/ready` returned `ready=true`, database=`postgres-durable`, and `/api/launch-readiness` returned `launchReady=true` with `blockers=[]`.
- Support-mail cron remains operational on a 10-minute schedule; recent runs completed successfully and password-recovery email tasks were 0 at the latest checks.
- Latest external-status recheck on 2026-09-28: no new Twilio Trust Hub/A2P reply has arrived yet; the currently connected OneSignal session still shows 0 notifications/subscriptions and is not sufficient to prove physical-device delivery. Render support-mail last successful run remained current at 17:00 UTC.

## External launch gates still requiring real-world/account evidence
- Stripe durable webhook idempotency/receipt storage is verified and deployed: append-only receipts persist in PostgreSQL, concurrent deliveries are serialized, duplicate replays are rejected safely across restart scenarios, and signed delivery/signature verification are verified. Payout capability/readiness is enabled; no completed provider payout has yet been observed.
- OneSignal physical-device delivery/tap evidence remains open; Android FCM configuration is already closed, while iOS APNs configuration remains open.
- Twilio source-side SMS safety is closed and live: exact inbound/status callback routes, Twilio signature validation, STOP/START/HELP handling, delivery-state persistence, duplicate-send prevention, and fail-closed activation are implemented. Main/source parity for Twilio status-callback hardening was closed on 2026-09-28 via PR #130 (`9e4477780dd42b797743470e81af3391f46d0c8f`); Full QA #850 passed including `sms:check`, CORS/security, Store Readiness, and E2E. On 2026-09-28, correction requests were sent in-thread to Twilio Consumer Trust and A2P Compliance to change ZOVRO from Sole Proprietor to the appropriate Standard/Low-Volume Standard LLC flow and to align the business email with `support@zovro.work` / `zovro.work`. Remaining external work is Twilio response/profile correction/approval, sender configuration, and real opt-in/reply/STOP/delivery evidence.
- Apple/iOS workflow readiness is closed in source: Xcode 26+ guard, exact Team/App ID validation, production APNs entitlement check, signed archive/IPA export, TestFlight validation/upload path, and temporary-secret cleanup are implemented. Remaining external work is Apple Developer/App Store Connect authentication plus the actual certificate/profile/API credentials, signed IPA/TestFlight processing, APNs and physical-device acceptance.
- Google Play Console: Android upload-key readiness is verified (public certificate fingerprints and signed-AAB SHA-256 recorded; CI supports signed AAB creation). Remaining: authenticated Play upload/internal-track acceptance, console declarations, and submission.
- Final legal review appropriate to launch jurisdictions.

## Final locked-design release verification — 2026-09-27
- FINAL_UI_DESIGN_LOCK.md is committed on main; approved visual direction is locked while preserving existing application behavior.
- Full QA passed on the locked-design build (GitHub Actions run 36292990105).
- Android release verification passed on the locked-design build (run 36292990073). A dedicated upload key and signed ZOVRO 1.0.0 AAB are now prepared and verified separately; signed AAB SHA-256 is `33cafb468b038a120c4c937e9e3a5a4d1af8901acbae8114a82894256456c71d`. Play Console acceptance remains external.
- iOS release verification passed on the locked-design build (run 36292990064); artifact: zovro-ios-release-candidate. The workflow currently produces an **unsigned simulator** app archive.
- GitHub Pages deployment completed successfully after the design lock, and https://zovro.work is publicly reachable.
- Automated Google Play Console inspection could not enter the authenticated console because no persistent Play Console browser profile/credentials were available. No store-submission state was changed.

### Remaining store-release blocker
The source/build gates are green. Android now has a verified dedicated upload key and signed AAB ready for Play acceptance. iOS still lacks the Apple-issued signing credentials needed for a signed IPA. Production launch still requires authenticated Google Play/App Store Connect access, Play internal-track acceptance, iOS signing/TestFlight, and signed-device acceptance. Do not mark the mobile app as publicly launched until store/device evidence is complete.

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

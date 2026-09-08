# ZOVRO final verified build status — 2026-09-07

## Verified release candidate

- Verified source commit: `d236217614c585b0a4ffb6dfe39643368858e443`
- Full QA workflow: PASS
- Render production deployment: LIVE on `zovro-api-final`
- Render deploy: `dep-dafej4m7bikc738aj31g`
- Production server startup: verified
- Render root health probe: HTTP 200
- Android release verification: PASS
- Android artifact: `zovro-android-release-candidate`
- Android artifact SHA-256: `7ba1bca9a5eeac02bcfde2d5fa4ac008fab4026a05f73895a6c363043fcf5793`
- iOS release verification: PASS
- iOS artifact: `zovro-ios-release-candidate`
- iOS artifact SHA-256: `08a59ba5dd0f266cb1ac2c826dd4171d368989697f2f30b3f55628b30cf0060a`

## QA coverage passed

- Final application architecture check
- Production configuration check
- Stripe payment safety check
- Security smoke test and rate limiting
- Store-readiness/legal checks
- Mobile release preflight
- End-to-end customer/provider service lifecycle
- Current-source Android Capacitor build
- Current-source iOS Capacitor simulator release build

## Implemented but awaiting production credentials/configuration

### Stripe Connect

The marketplace payment architecture and backend routes are implemented using separate charges and transfers. Real payments remain disabled until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are stored securely in Render and the Stripe webhook endpoint is registered. No live test charges should be created during setup.

Webhook URL:
`https://zovro-api-final.onrender.com/api/payments/webhook`

### OneSignal

The OneSignal app and EN/ES notification templates exist. Native push still requires production APNs/FCM platform credentials plus secure backend REST API credentials before real-device delivery can be declared complete.

### PostgreSQL

Migration schema and verification tooling are implemented. The current Render Postgres free database is temporary and expires 2026-10-07. The public API remains on SQLite until a permanent production database plan is selected, migration/restore verification passes, and a controlled cutover is approved.

### Stores

Android currently builds an unsigned release AAB and debug APK. Google Play production release requires the production signing key and Play Console submission.

iOS currently builds an unsigned simulator release. TestFlight/App Store release requires Apple signing certificates/profiles and App Store Connect submission.

## Release rule

Do not describe ZOVRO as fully production-launched until Stripe live credentials/webhook, durable PostgreSQL, native OneSignal credentials, signed Android/iOS store builds, and real-device QA are complete.

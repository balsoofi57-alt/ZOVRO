# ZOVRO Production Release Configuration

Version: 1.0.0
App ID / Bundle ID: com.zovro.app
Canonical production API: https://zovro-api-final.onrender.com

This document defines the final configuration gates without storing secrets.

## Backend / Render
Required production settings:
- Build Command: `cd backend && npm install`
- `NODE_ENV=production`
- `ZOVRO_APP_VERSION=1.0.0`
- `ZOVRO_ALLOWED_ORIGINS` must include only approved production origins, including the mobile Capacitor origin where required.
- `ZOVRO_SECRET` must be a unique production secret of at least 32 characters.
- `ZOVRO_OPS_TOKEN` must be a unique operations token of at least 24 characters.
- `DATABASE_URL` must point to `zovro-production-db` before PostgreSQL mirror validation begins.
- Keep `ZOVRO_DB_MIRROR_MODE=mirror` until PostgreSQL writes, reads, persistence, and rollback behavior pass verification.

Health gates:
- `GET https://zovro-api-final.onrender.com/api/health` returns HTTP 200.
- `GET https://zovro-api-final.onrender.com/api/ready` returns HTTP 200.
- Readiness confirms `databaseUrlPresent=true`, `pgModuleAvailable=true`, `postgresRuntimeReady=true`, and `mirrorOperational=true` before any durable cutover.
- After cutover, health/readiness report the expected durable PostgreSQL engine and `durableOperational=true`.

Do not use `https://zovro-api.onrender.com` in the mobile release or store submission; it is not the canonical ZOVRO 1.0 production API.

## Database
Current release state:
- PostgreSQL service: `zovro-production-db`.
- SQLite remains the safe source/fallback.
- Production remains in `ZOVRO_DB_MIRROR_MODE=mirror`.
- Do not claim durable PostgreSQL is active until the checks below pass.

Safe production cutover:
1. Confirm the PostgreSQL service is available and has backup/restore capability.
2. Set the Render Build Command to `cd backend && npm install`.
3. Set `DATABASE_URL` through Render's secret environment configuration.
4. Deploy with `ZOVRO_DB_MIRROR_MODE=mirror`; do not switch directly to durable mode.
5. Apply the validated PostgreSQL schema and run the prepared migration tooling.
6. Verify readiness reports PostgreSQL runtime and mirror operation as healthy.
7. Compare row counts and manually spot-check critical users, requests, messages, ratings, notifications, sessions, locations, verification, and audit records.
8. Verify new production writes reach both the safe source and PostgreSQL.
9. Restart/redeploy and confirm records persist.
10. Test backup and restore, and keep the prior release available for rollback.
11. Only after every mirror check passes, switch to durable PostgreSQL and rerun the full end-to-end suite.

## Payments
Do not enable paid production jobs until all of these exist:
- Live payment account approved for commercial use.
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` stored only in approved secret stores.
- Stripe webhook configured as `https://zovro-api-final.onrender.com/api/payments/webhook`.
- Server-side amount validation.
- Payment intent/order lifecycle tied to a ZOVRO request.
- Refund/cancellation handling.
- Webhook signature verification and duplicate-event idempotency.
- Transaction audit records.
- Provider connected-account and payout readiness verified.
- User-facing pricing, cancellation, refund, and dispute language.

Never put payment secret keys in GitHub, the web bundle, Android assets, or iOS assets.

## Push notifications
Production push requires:
- OneSignal production app configuration and `ONESIGNAL_REST_API_KEY` in the server secret store.
- APNs credentials for iOS.
- FCM credentials/configuration for Android.
- External/user identity mapping between ZOVRO user IDs and push subscriptions.
- Notification permission flows in the native apps.
- Real-device delivery tests for: new request, provider accepted, and job-status updated.

## Maps / routing
Before enabling production routing/ETA beyond the current local calculations:
- Use a production maps/routing provider account.
- Restrict API keys by platform/domain/bundle ID where supported.
- Store server-only secrets outside client bundles.
- Update privacy/data-safety declarations if the provider receives device/location data.

## Android release
Current CI already builds the Android release candidate. Final public release requires:
- Google Play Console app ownership/access.
- Play App Signing / upload key.
- Signed release AAB.
- Final versionCode/versionName.
- Store listing assets.
- Data Safety form.
- Content rating and target audience declarations.
- Internal/closed test before production rollout.

## iOS release
Current CI already builds an unsigned iOS simulator release candidate. Final public release requires:
- Apple Developer Program access.
- App Store Connect app record for `com.zovro.app`.
- Distribution signing certificate/profile or App Store Connect API-based signing flow.
- Signed device archive / IPA.
- App Privacy answers.
- Final screenshots and metadata.
- TestFlight validation before App Store submission.

## Support / legal
Before commercial launch:
- Publish a monitored public support email/contact method.
- Publish and verify public Privacy, Terms, and Support URLs.
- Confirm privacy policy and terms match actual production integrations.
- Complete legal review for launch jurisdictions and provider/payment model.
- Confirm roadside/SOS language clearly states ZOVRO is not 911 or emergency services.

## Secret handling policy
Production secrets belong only in approved secret stores such as Render environment variables, GitHub Actions Secrets for build-time signing where appropriate, Apple/Google console credential stores, or the payment/push provider dashboards. They must not be committed to source control.

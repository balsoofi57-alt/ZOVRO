# ZOVRO Production Release Configuration

Version: 1.0.0
App ID / Bundle ID: com.zovro.app

This document defines the final configuration gates without storing secrets.

## Backend / Render
Required production settings:
- NODE_ENV=production
- ZOVRO_APP_VERSION=1.0.0
- ZOVRO_ALLOWED_ORIGINS must include only approved production origins, including the mobile Capacitor origin where required.
- ZOVRO_SECRET must be a unique production secret of at least 32 characters.
- ZOVRO_OPS_TOKEN must be a unique operations token of at least 24 characters.
- DATABASE_URL must point to the durable production PostgreSQL database after migration is validated.

Health gates:
- GET /api/health returns HTTP 200
- GET /api/ready returns HTTP 200
- health/readiness report the expected production database engine after cutover

## Database
Before production cutover:
1. Create or upgrade to durable PostgreSQL with backup/restore capability.
2. Apply the validated PostgreSQL schema.
3. Migrate SQLite data using the migration tooling prepared on zovro-postgres-migration.
4. Compare row counts and critical records.
5. Run end-to-end account, request, dispatch, messaging, lifecycle, cancellation, rating, and deletion checks.
6. Keep the prior release available for rollback until validation is complete.

## Payments
Do not enable paid production jobs until all of these exist:
- Live payment account approved for commercial use
- Production API keys stored only in the hosting secret store
- Server-side amount validation
- Payment intent/order lifecycle tied to a ZOVRO request
- Refund/cancellation handling
- Webhook signature verification
- Transaction audit records
- User-facing pricing, cancellation, refund, and dispute language

Never put payment secret keys in GitHub, the web bundle, Android assets, or iOS assets.

## Push notifications
Production push requires:
- OneSignal production app configuration
- APNs credentials for iOS
- FCM credentials/configuration for Android
- External/user identity mapping between ZOVRO user IDs and push subscriptions
- Notification permission flows in the native apps
- Delivery tests for: new request, provider accepted, and job-status updated

## Maps / routing
Before enabling production routing/ETA beyond the current local calculations:
- Use a production maps/routing provider account
- Restrict API keys by platform/domain/bundle ID where supported
- Store server-only secrets outside client bundles
- Update privacy/data-safety declarations if the provider receives device/location data

## Android release
Current CI already builds the Android release candidate. Final public release requires:
- Google Play Console app ownership/access
- Play App Signing / upload key
- Signed release AAB
- Final versionCode/versionName
- Store listing assets
- Data Safety form
- Content rating and target audience declarations
- Internal/closed test before production rollout

## iOS release
Current CI already builds an unsigned iOS simulator release candidate. Final public release requires:
- Apple Developer Program access
- App Store Connect app record for com.zovro.app
- Distribution signing certificate/profile or App Store Connect API-based signing flow
- Signed device archive / IPA
- App Privacy answers
- Final screenshots and metadata
- TestFlight validation before App Store submission

## Support / legal
Before commercial launch:
- Publish a monitored public support email/contact method
- Confirm privacy policy and terms match actual production integrations
- Complete legal review for launch jurisdictions and provider/payment model
- Confirm roadside/SOS language clearly states ZOVRO is not 911 or emergency services

## Secret handling policy
Production secrets belong only in approved secret stores such as Render environment variables, GitHub Actions Secrets for build-time signing where appropriate, Apple/Google console credential stores, or the payment/push provider dashboards. They must not be committed to source control.
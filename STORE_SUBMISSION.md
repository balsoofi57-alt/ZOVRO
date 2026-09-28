# ZOVRO Store Submission Pack

Version: 1.0.0
Status checkpoint: September 27, 2026
App ID / Bundle ID: com.zovro.app
App name: ZOVRO
Public support email: support@zovro.work

## Short description
Fast access to nearby local service providers for roadside help, mobile auto service, home trades, moving, and urgent requests.

## Full description
ZOVRO connects customers with nearby service providers for everyday and urgent local-service needs. Customers can create service requests, find nearby providers, message providers, follow job status, and leave ratings after completed work. Providers can manage availability, receive nearby requests, accept jobs, update job progress, communicate with customers, and build a service reputation.

Primary service areas include roadside assistance, mobile auto service, plumbing, electrical, HVAC, appliance repair, roofing, painting, flooring, lawn care, snow removal, cleanup, moving, and other local services.

ZOVRO includes account security, provider verification workflows, job lifecycle tracking, messaging, notifications, ratings, account deletion, and safety guidance. Emergency-style ZOVRO requests do not replace police, fire, ambulance, or 911.

## Suggested store categories
- Google Play: Travel & Local
- Apple App Store: Lifestyle (primary), Utilities (secondary)

## Keywords
local services, roadside assistance, handyman, mechanic, plumbing, electrical, HVAC, moving, home repair, service provider

## Review notes
- Canonical production API base: https://zovro-api-final.onrender.com
- Health endpoint: https://zovro-api-final.onrender.com/api/health
- Readiness endpoint: https://zovro-api-final.onrender.com/api/ready
- Approved public support email: support@zovro.work. Bidirectional delivery, automated policy replies, and monitoring alerts have been verified.
- Privacy, Terms, and Support pages are included in the production web package and the live website branch uses the current support@zovro.work contact.
- Account deletion is supported in-app and must be rechecked in the signed release build.
- SOS/urgent service requests are marketplace requests and are not a replacement for emergency services.

## Submission preparation documents
- APP_PRIVACY_DATA_SAFETY.md — Apple App Privacy / Google Data Safety worksheet
- RELEASE_CONFIGURATION.md — final production configuration and secret-handling gates
- FINAL_QA_MATRIX.md — final web/backend/Android/iOS/payment/database QA checklist
- STORE_ASSET_CHECKLIST.md — screenshot, icon, listing-asset and reviewer-claim checklist

## Assets / credentials still required at submission time
- Final store screenshots and promotional graphics
- Apple Developer signing credentials and App Store Connect access
- Google Play Console signing/upload credentials
- Final store-console privacy/data-safety questionnaires based on the signed production build
- Final legal review for launch jurisdictions

## Release workflow safeguards
- Android signing/upload requires exact `com.zovro.app`, verifies signed AABs, uploads only to the internal track as a draft, validates the Google Play edit before commit, and refuses to disturb an existing review.
- iOS signing requires an exact `APPLE_TEAM_ID.com.zovro.app` provisioning identity, production APNs entitlement, and Xcode 26 or later before App Store archive/export.
- Production signing materials are not stored in the repository.

## Current build status
- Android release candidate: verified signed AAB is prepared for `com.zovro.app` version `1.0.0`, versionCode `10301`; remaining Android store work is Google Play acceptance/internal testing and signed-device acceptance.
- iOS release candidate: CI simulator build completed successfully; App Store/TestFlight archive requires Apple signing.
- Production PostgreSQL durable operation, Stripe platform readiness, password recovery, and support-mail operations are technically closed. OneSignal server credentials and Android FCM platform configuration are closed. Remaining external gates are iOS APNs, real-device push evidence, mobile signing credentials and signed builds, store upload/screenshots/declaration reconciliation, and final human legal approval.

Do not commit production secrets or signing credentials to this repository.

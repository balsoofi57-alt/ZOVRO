# ZOVRO Store Submission Pack

Version: 1.0.0
App ID / Bundle ID: com.zovro.app
App name: ZOVRO
Public support email: support@zovro.net

## Short description
Fast access to nearby local service providers for roadside help, mobile auto service, home trades, moving, and urgent requests.

## Full description
ZOVRO connects customers with nearby service providers for everyday and urgent local-service needs. Customers can create service requests, find nearby providers, message providers, follow job status, and leave ratings after completed work. Providers can manage availability, receive nearby requests, accept jobs, update job progress, communicate with customers, and build a service reputation.

Primary service areas include roadside assistance, mobile auto service, plumbing, electrical, HVAC, appliance repair, roofing, painting, flooring, lawn care, snow removal, cleanup, moving, and other local services.

ZOVRO includes account security, provider verification workflows, job lifecycle tracking, messaging, notifications, ratings, account deletion, and safety guidance. Emergency-style ZOVRO requests do not replace police, fire, ambulance, or 911.

## Suggested store category
Primary: Lifestyle / Local Services
Secondary: Utilities

## Keywords
local services, roadside assistance, handyman, mechanic, plumbing, electrical, HVAC, moving, home repair, service provider

## Review notes
- Canonical production API base: https://zovro-api-final.onrender.com
- Health endpoint: https://zovro-api-final.onrender.com/api/health
- Readiness endpoint: https://zovro-api-final.onrender.com/api/ready
- Approved public support email: support@zovro.net. Inbox delivery/monitoring still requires external verification before launch.
- Privacy, Terms, and Support pages are included in the production web package, but their final public URLs must be verified before submission.
- Account deletion is supported in-app and must be rechecked in the signed release build.
- SOS/urgent service requests are marketplace requests and are not a replacement for emergency services.

## Submission preparation documents
- APP_PRIVACY_DATA_SAFETY.md — Apple App Privacy / Google Data Safety worksheet
- RELEASE_CONFIGURATION.md — final production configuration and secret-handling gates
- FINAL_QA_MATRIX.md — final web/backend/Android/iOS/payment/database QA checklist
- STORE_ASSET_CHECKLIST.md — screenshot, icon, listing-asset and reviewer-claim checklist

## Assets / credentials still required at submission time
- Verification that support@zovro.net receives and is monitored for support inquiries
- Final public Privacy, Terms, and Support URLs
- Final store screenshots and promotional graphics
- Apple Developer signing credentials and App Store Connect access
- Google Play Console signing/upload credentials
- Final privacy declarations/data-safety questionnaires based on the production configuration
- Final legal review for launch jurisdictions

## Current build status
- Android release candidate: CI build completed successfully; unsigned release AAB requires Play upload signing.
- iOS release candidate: CI simulator build completed successfully; App Store/TestFlight archive requires Apple signing.
- Production PostgreSQL, live payments, real-device push delivery, signing, and store submission remain release gates.

Do not commit production secrets or signing credentials to this repository.

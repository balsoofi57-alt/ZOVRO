# ZOVRO App Privacy & Data Safety Preparation

Version: 1.0.0
Bundle/App ID: com.zovro.app

This file is a submission-prep worksheet for Apple App Privacy and Google Play Data Safety. It reflects the current ZOVRO source and verified production integrations as of September 26, 2026. Recheck it after the final signed mobile build and after any future analytics, crash reporting, advertising, attribution, or additional third-party SDK is added.

## Data currently handled by ZOVRO source

### Contact/account information
- Name
- Phone number
- Email address (optional in current registration flow)
- Account role (customer/provider)
- Provider service category
- Provider license/verification information when supplied

Purpose: account creation, authentication, provider/customer operation, marketplace matching, support, fraud/abuse prevention, and verification workflows.

### Location
- Approximate or precise device location only when the user invokes a location-dependent feature
- Provider location updates for nearby matching and job coordination

Purpose: nearby-provider discovery, urgent dispatch, ETA/distance calculation, service coordination, and live job/location features.

### User content and marketplace activity
- Service request description and optional address/landmark
- Customer/provider messages
- Job status and request history
- Ratings and reputation data
- Notifications and account/session records

Purpose: perform requested marketplace services, maintain job lifecycle and communication, safety/audit history, and user support.

### Diagnostics/security records
- Operational request metrics
- Audit events
- Session identifiers
- Abuse-prevention/rate-limit information

Purpose: application security, reliability, fraud/abuse prevention, and operational troubleshooting.

## Current verified privacy posture
- The current source contains no advertising SDK, cross-app attribution SDK, or feature intended to sell personal information.
- Location is requested only when a location-dependent feature is used.
- Account deletion is available in-app.
- Production payments use Stripe; payment-card details are handled by Stripe rather than being stored as raw card data by ZOVRO.
- Push uses the OneSignal SDK and external user identity binding. The current OneSignal production credential is not yet verified and no physical-device subscription exists yet, so final device-ID/push declarations must be rechecked after the first signed-device registration.
- ZOVRO uses durable PostgreSQL in production.
- Support operates through support@zovro.work and in-app support workflows.
- Production secrets must never be committed to the repository.

## Apple App Privacy submission preparation
Likely declarations, subject to final production configuration:
- Contact Info: collected and linked to user identity
- Precise Location / Coarse Location: collected when location features are used and linked to user identity/job activity
- User Content: messages and service request content, linked to user identity
- Identifiers: account/session identifiers, linked to user identity
- Other Usage/Marketplace Activity: requests, job lifecycle, ratings, and provider availability
- Diagnostics: only declare diagnostic/crash/performance data if the final production build actually sends it to Apple or a third-party service

Tracking: do not declare tracking unless a final production SDK or integration tracks users across apps/websites owned by other companies.

## Google Play Data Safety preparation
Likely data types, subject to final production configuration:
- Personal info: name, email, phone
- Location: approximate and/or precise, only for location-dependent functionality
- Messages: in-app customer/provider messages
- App activity: service requests, job lifecycle, ratings, provider availability
- App info and performance: only if production telemetry/crash tooling collects it
- Device or other IDs: only if push/analytics SDKs collect device identifiers in the final build

For each declared type, verify whether the final integration transmits data off-device, whether it is required or optional, whether it is encrypted in transit, and whether users can request deletion.

## Final submission checks
1. Stripe/payment integration has been technically verified; keep the declaration aligned with the actual signed mobile payment flow.
2. Re-run after OneSignal/APNs/FCM device push is final and a real device subscription exists.
3. Re-run after final signed iOS and Android builds are produced.
4. Re-run after any analytics, crash reporting, ads, or attribution SDK is added.
5. Ensure store declarations match the live privacy policy exactly.
6. Ensure account deletion remains available in the submitted build.
7. Capture final App Privacy / Data Safety answers from the signed release candidate, not from simulator-only or unsigned artifacts.

Do not copy this worksheet blindly into store forms without validating the final production SDK/data flow.

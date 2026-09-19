# ZOVRO App Privacy & Data Safety Preparation

Version: 1.0.0
Bundle/App ID: com.zovro.app

This file is a submission-prep worksheet for Apple App Privacy and Google Play Data Safety. It reflects the current ZOVRO source and must be rechecked after production payments, maps/routing, push, analytics, crash reporting, advertising, or other third-party SDKs are enabled.

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

## Current privacy posture
- The current source contains no feature that sells personal information; confirm the final legal disclosure before submission.
- Location is requested only when a location feature is used.
- Account deletion is available in-app.
- Current source does not show advertising or cross-app tracking.
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
1. Re-run this review after Stripe/payment integration is final.
2. Re-run after production maps/routing is final.
3. Re-run after OneSignal/APNs/FCM device push is final.
4. Re-run after any analytics, crash reporting, ads, or attribution SDK is added.
5. Ensure store declarations match the live privacy policy exactly.
6. Ensure account deletion remains available in the submitted build.

Do not copy this worksheet blindly into store forms without validating the final production SDK/data flow.

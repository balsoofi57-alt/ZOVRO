# ZOVRO Store Declarations Handoff

Checkpoint: 2026-09-27
App: ZOVRO 1.0.0
Bundle / package: `com.zovro.app`
Operator: ZOVRO LLC
Support: `support@zovro.work`

This file consolidates the current repository-backed facts that must be reconciled in Google Play Data safety, Apple App Privacy, content-rating, and review-note forms. It is not a substitute for final human legal approval.

## Verified product facts

- ZOVRO is a marketplace connecting customers with independent local service providers.
- Core flows include account creation/authentication, service requests, nearby matching, provider acceptance, messaging, job status, ratings, account deletion, password recovery, support, payments, push notifications, and location-dependent features.
- ZOVRO urgent/SOS marketplace requests do not replace 911, police, fire, ambulance, or emergency dispatch.
- Stripe handles payment-card processing; ZOVRO application code does not store raw card data.
- Current source has no advertising SDK or cross-app attribution/tracking SDK.
- OneSignal is used for push. Server credentials and Android FCM configuration are verified; signed-device delivery remains an external acceptance gate.
- Location is requested only for location-dependent functionality.
- Account deletion is available in-app.
- Production uses durable PostgreSQL.
- Support operates through `support@zovro.work` and in-app support workflows.

## Data categories to reconcile in store consoles

### Contact information
Current source handles:
- Name
- Phone number
- Email address where supplied
- Account role
- Provider category and verification/license information where supplied

Primary uses:
- Account/authentication
- Marketplace operation and matching
- Support
- Abuse/fraud prevention
- Provider verification

### Location
Current source can handle:
- Precise device location
- Approximate/coarse location as applicable
- Provider location updates
- Request address/landmark information

Primary uses:
- Nearby matching
- Urgent request dispatch
- ETA/distance
- Service coordination
- Live job/location features

### User content and activity
Current source handles:
- Service-request description
- Customer/provider messages
- Request/job history
- Job status
- Ratings/reputation
- Provider availability
- Notification/account/session records

### Security / operational records
Current source handles:
- Session identifiers
- Audit/security events
- Rate-limit/abuse-prevention records
- Operational request metrics

Do not declare crash/analytics/advertising data unless the final signed build actually sends those data to a production third party.

## Google Play Data safety reconciliation

Before saving answers in Play Console, verify against the accepted signed AAB:

- Personal info: name, email, phone
- Location: precise and/or approximate for location-dependent functionality
- Messages: in-app customer/provider messages
- App activity: requests, job lifecycle, ratings, provider availability
- Device or other identifiers: only where OneSignal/push behavior in the signed build causes collection/transmission
- App info/performance: only if a production telemetry/crash integration is present in the signed build

For every declared type, confirm:
1. collected vs shared/transmitted,
2. required vs optional,
3. purpose(s),
4. encryption in transit,
5. deletion handling.

Do not claim data is not collected merely because ZOVRO does not store it locally if it is transmitted to a processor/SDK.

## Apple App Privacy reconciliation

Likely categories to review against the signed IPA:
- Contact Info
- Precise Location / Coarse Location
- User Content
- Identifiers
- Other marketplace/app activity
- Diagnostics only if actually transmitted by the final build

Tracking:
- Current repository evidence does not show an advertising or cross-app tracking SDK.
- Do not mark tracking unless a final production integration tracks users across other companies' apps/websites.

## Payments

- Stripe is the payment processor.
- Raw payment-card details are handled by Stripe, not stored directly by ZOVRO application code.
- Store privacy answers must still reflect any user/account/payment metadata transmitted to Stripe by the submitted build.

## Push notifications

- OneSignal server credentials: verified.
- Android FCM platform configuration: verified.
- Real signed-device delivery: pending acceptance evidence.
- iOS APNs: pending Apple signing/capability evidence.

Recheck device identifier / push-token declarations after signed-device registration.

## Account deletion

Must remain available in the submitted build and public support process.
Reviewer notes should make the deletion path discoverable.

## Review notes

Use the existing private test accounts supplied through the relevant store console, not repository files.

Reviewers should be able to exercise:
- customer account flow,
- provider account flow,
- service request creation,
- provider acceptance,
- messaging,
- status updates,
- password recovery,
- account deletion,
- SOS marketplace-assistance flow.

Reviewer disclosure:
ZOVRO SOS/urgent requests are marketplace service requests and do not replace 911 or emergency services.

## Content-rating / policy facts

- No advertising or gambling feature is present in current source.
- No emergency-service representation should be made.
- Marketplace services may include regulated trades; providers are responsible for legally required licenses/permits for the service/location.
- Final content-rating answers must reflect actual in-app user-generated content, messaging, and marketplace interactions.

## Final human approval required

Do not mark final legal/store-declaration review CLOSED until an authorized human reviewer confirms:
- Terms of Service
- Privacy Policy
- marketplace / independent-provider language
- licensing/permit language
- payment/refund/cancellation language
- SMS disclosures before live SMS activation
- biometric/Face ID wording
- age/children treatment
- Apple App Privacy answers
- Google Play Data safety answers

## Submission rule

Console declarations must be based on the final signed build actually submitted, not simulator-only or unsigned artifacts.

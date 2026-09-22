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

## External launch gates still requiring real-world/account evidence
- Stripe: signed production webhook delivery, signature verification, real payment/refund/idempotency evidence, and payout readiness
- OneSignal/APNs/FCM: physical-device notification delivery and tap/open evidence
- Twilio SMS: A2P/sender approval plus physical-number opt-in, reply, and STOP evidence before enabling live SMS
- Apple Developer/App Store Connect: distribution signing, archive/TestFlight, store metadata and submission
- Google Play Console: production signing/internal testing, organization/phone verification, store metadata and submission
- Final support inbox verification and store-facing support/legal declarations
- Final legal review appropriate to launch jurisdictions

## Release rule
Do not describe ZOVRO as fully launched or all external gates as closed until the external evidence above is verified. Do not enable live SMS merely to satisfy a test.

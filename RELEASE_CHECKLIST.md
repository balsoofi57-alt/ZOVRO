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
- The previous Stripe company.tax_id / EIN verification blocker is no longer present in current account requirements.
- OneSignal app connection is confirmed, but message history currently contains 0 notifications; signed-device push delivery/open evidence is therefore still pending.

## External launch gates still requiring real-world/account evidence
- Stripe: confirm signed production webhook POST delivery/signature-verification evidence for the live payment/refund events and preserve idempotency evidence. Payout capability/readiness is enabled; no completed payout has yet been observed.
- OneSignal/APNs/FCM: physical-device notification delivery and tap/open evidence.
- Twilio SMS: A2P/sender approval plus physical-number opt-in, reply, and STOP evidence before enabling live SMS.
- Apple Developer/App Store Connect: distribution signing, archive/TestFlight, store metadata and submission.
- Google Play Console: production signing/internal testing, organization/phone verification, store metadata and submission.
- Final support inbox verification and store-facing support/legal declarations.
- Final legal review appropriate to launch jurisdictions.

## Release rule
Do not describe ZOVRO as fully launched or all external gates as closed until the external evidence above is verified. Do not enable live SMS merely to satisfy a test.

# ZOVRO 1.0 Launch Checklist

Verified checkpoint: 2026-09-27

## Completed in source/build/connected production
- Production-connected web experience
- Customer/provider registration and login
- Nearby provider search and urgent dispatch
- Requests, messaging and job lifecycle
- Cancellations, ratings and provider reputation
- Account/session security and account deletion
- Production API health/readiness and deployment checks
- Privacy, Terms and Support pages
- Mobile packaging preparation and release checks
- Public support contact selected and embedded in source: `support@zovro.work`
- Durable production PostgreSQL runtime with verified startup restore
- Isolated PostgreSQL backup/restore integration evidence in support-mail CI
- Live Stripe account charge/payout readiness, signed webhook delivery, live payment and refund evidence
- Stripe webhook signature verification, durable event receipt/idempotency and retry safety
- Launch marketplace fee fixed at 0% in Render and as the server default
- OneSignal backend credentials verified
- Android FCM platform configuration verified
- Android build + Android Release Verification successful on current verified runtime source
- iOS Release Verification successful on current verified runtime source
- `support@zovro.work` send/receive/policy-reply/monitoring evidence
- Store metadata technical preparation
- App Privacy / Google Play Data Safety worksheet technical preparation
- Official `zovro.work` Privacy, Terms and Support URLs verified
- Mobile signing/upload workflow code for Android and iOS
- Xcode 26+ App Store CI guard and exact iOS provisioning identity checks
- Google Play edit validation before commit and exact Android application ID checks
- Twilio/SMS source-side safety: exact signed inbound/status routes, STOP/START/HELP handling, delivery-status persistence, and fail-closed activation
- Legal review packet preparation

## External launch gates still open
- Apple Developer/App Store Connect authentication and APNs production configuration
- iOS distribution signing, signed IPA, TestFlight processing and App Store submission
- Android keystore/Play upload credentials, signed AAB, internal test-track acceptance and Play submission
- Signed physical-device GPS/SOS/Face ID/payment/push tests
- Real OneSignal device subscription/delivery/tap evidence; iOS additionally requires APNs
- Twilio external activation only: sender/A2P/number or Messaging Service readiness, credentials, and real opt-in/reply/STOP/delivery evidence before enabling live SMS
- Final signed-build screenshots and store-console privacy/data-safety/content-rating declarations
- Final human legal review appropriate to launch jurisdictions
- Provider-level production backup/restore exercise if desired for operational evidence; do not perform destructively against live production

# ZOVRO 1.0 Launch Checklist

## Completed in source/build
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
- Live Stripe account charge/payout readiness with successful live payment and linked refund evidence
- Android/iOS source and unsigned release build verification

## External launch gates
- Verify isolated database backup/restore and rollback procedure
- Capture successful signed live Stripe webhook POST delivery and processing evidence
- Complete OneSignal APNs/FCM setup and signed physical-device push delivery/tap evidence
- Complete Twilio sender/A2P readiness and physical-number opt-in/reply/STOP evidence before enabling live SMS
- Verify final GPS/SOS behavior on signed physical-device builds
- Verify `support@zovro.work` mailbox delivery and monitoring
- Apple Developer/App Store Connect distribution signing, TestFlight and submission
- Google Play Console production signing, test-track upload and submission
- Final store privacy/data-safety declarations and public legal URL verification
- Final legal review appropriate to launch jurisdictions

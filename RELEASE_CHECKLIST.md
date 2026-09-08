# ZOVRO 1.0 Launch Checklist

## Verified complete in source/build
- Production-connected web experience
- Customer/provider registration and login
- Nearby provider search and urgent dispatch
- Requests, messaging and job lifecycle
- Cancellations, ratings and provider reputation
- Account/session security and account deletion
- Production API health/readiness and launch-readiness checks
- Privacy, Terms and Support pages
- Full QA workflow on `zovro-final-deploy`: **SUCCESS**
- Android release-candidate workflow: **SUCCESS**
  - Debug APK generated
  - Release AAB generated (unsigned)
- iOS release-candidate workflow: **SUCCESS**
  - Simulator Release build generated (unsigned)
- Release artifacts documented in `PRODUCTION_RELEASE_STATUS.md`
- Store metadata prepared in `STORE_SUBMISSION.md`

## External launch gates still required
- Attach production `DATABASE_URL` and verify Postgres mirror operation
- Move database mode to durable only after mirror verification
- Add production Stripe publishable key, secret key and webhook secret
- Add OneSignal REST API key for real push notifications
- Publish final monitored public support email/contact details
- Apple Developer/App Store Connect signing, TestFlight and submission
- Google Play Console signing and submission
- Final legal review appropriate to launch jurisdictions

## Security rule
Never commit production passwords, certificates, private keys, Stripe secret keys, database passwords or OneSignal REST keys to the repository.

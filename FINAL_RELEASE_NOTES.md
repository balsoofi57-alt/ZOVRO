# ZOVRO 1.0.0 Final Release

The current ZOVRO 1.0.0 release candidate includes customer and provider accounts, nearby-provider matching, SOS/urgent marketplace requests, job acceptance, lifecycle status updates, in-app messaging, cancellation flows, ratings/reputation, provider availability/location, account deletion, password recovery, support workflows, security checks, durable PostgreSQL, production readiness endpoints, mobile packaging preparation, and live Stripe integration.

## Verified production state — September 26, 2026

- Durable PostgreSQL is operational and restores verified production data at startup.
- Stripe platform payment readiness is closed: Payments and Payouts are active, tax/EIN is verified, production webhook delivery is accepted, successful payment delivery is evidenced, failed-payment handling is regression-tested, refund delivery is evidenced, and duplicate webhook processing is guarded.
- Forgot Password is closed with secure email fallback, rate limiting, short-lived codes, sealed pending delivery data, and session revocation after reset.
- Support uses support@zovro.work; bidirectional mailbox delivery, automated policy replies, and overdue-review alerts are evidenced.
- Public Support, Privacy, and Terms source is current on the website branch.
- Full QA passes for the current code paths described above.

## Remaining external release gates

- OneSignal backend credential verification is closed and production readiness is clear. Remaining push work is APNs/FCM platform configuration plus signed physical-device registration and delivery evidence.
- OneSignal currently has 0 subscriptions; APNs/FCM and real push delivery require signed physical-device registration.
- iOS distribution certificate/profile, Apple team/App Store Connect credentials, and Android signing secrets are not present in GitHub Actions.
- Signed iOS/Android builds, physical-device acceptance, TestFlight/Play upload, store screenshots, and final store declarations remain open.
- Final human legal review remains required before public commercial launch.

No release note should claim physical-device push delivery, signed store distribution, or store submission until those external gates are actually completed.

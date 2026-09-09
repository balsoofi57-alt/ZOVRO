# ZOVRO

ZOVRO is a location-aware on-demand services marketplace connecting customers with nearby service providers for roadside help, mobile mechanic work, plumbing, electrical, HVAC, appliance repair, moving, lawn and snow services, pest control, and related local jobs.

## Current release status

The active release-preparation branch is `store-release-prep`. Automated Full QA covers product behavior, production readiness, payments safety, OneSignal server push delivery, mobile push registration/tap routing, CORS/security, SOS, biometrics, Smart Match, request privacy, log privacy, and legal consent.

Production launch still requires owner-controlled external credentials and evidence including Stripe activation/webhook, OneSignal REST/APNs/FCM credentials with real device subscriptions, signed iOS/Android builds, PostgreSQL durability verification, support/legal finalization, and store-console submission.

## Push notifications

Server push uses OneSignal aliases keyed to each ZOVRO user ID. Native mobile builds initialize the OneSignal Capacitor plugin, log in with the authenticated ZOVRO user ID as `external_id`, request notification permission once, track push subscription state, and route request-related notification taps to the Jobs view. Production delivery requires `ONESIGNAL_REST_API_KEY` on the backend plus APNs/FCM platform credentials and at least one real subscribed device.

## Safety

Never commit production passwords, private keys, database credentials, Stripe secret keys, OneSignal REST keys, APNs keys, FCM service credentials, or signing certificates to the repository.

# ZOVRO Push Release Status

Checkpoint: 2026-09-09

## Repository readiness

- OneSignal server delivery is implemented in `backend/push.js` and targets ZOVRO users by `external_id`.
- Push delivery is idempotent using the ZOVRO notification ID.
- Mobile registration, permission request, subscription status, user login/logout binding, and notification tap routing are implemented in `push-client.js`.
- Android notification permission is injected during native project preparation.
- Capacitor app ID is `com.zovro.app` and the OneSignal Capacitor plugin is pinned in dependencies.
- `/api/launch-readiness` reports OneSignal App ID presence, REST key presence, and server-side push configuration without exposing secrets.
- `push:check`, `mobile-push:check`, and `native-push:check` are included in `qa:all`.
- ZOVRO Full QA #161 succeeded on source commit `5224dbf06e12c55d112e35a6304c2a51e8cf3115`.

## External readiness

- OneSignal app: `Zovro llc App` (`7992b022-6c11-4a66-bad4-8cbd114266d0`).
- Current Active Subscriptions: 0.
- Render production service still runs `zovro-final-deploy` at commit `2eb66a874359abb28d632ad9d2d2f14885626c1c`; the new push hardening is intentionally not deployed yet.
- Render still requires `ONESIGNAL_REST_API_KEY`.
- APNs credentials/capability and a signed iOS build are required for iOS delivery.
- FCM credentials and a signed Android build are required for Android delivery.
- At least one real-device OneSignal subscription is required before end-to-end push delivery can be marked PASS.

## PASS criteria for PUSH-01

1. Securely configure the OneSignal server credential in Render without committing it.
2. Complete APNs and FCM channel configuration.
3. Install signed ZOVRO builds on real iOS and Android devices and grant notifications.
4. Confirm OneSignal shows active subscriptions bound to the correct ZOVRO external user IDs.
5. Verify delivery and tap routing for: new nearby request, provider accepted, and job status update.
6. Verify customer/provider account isolation and that duplicate notification IDs do not create duplicate sends.
7. Record device OS/build IDs, OneSignal message IDs, source SHA, and timestamps as redacted release evidence.

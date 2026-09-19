# ZOVRO Push Release Status

Checkpoint: 2026-09-11, 18:10 UTC

## Repository readiness

- OneSignal server delivery is implemented in `backend/push.js` and targets ZOVRO users by `external_id`.
- Push delivery is idempotent using the ZOVRO notification ID.
- Mobile initialization, login/logout identity binding, notification permission, subscription status, and notification-tap routing are implemented in `push-client.js`.
- A transient permission-request failure is no longer marked complete; the signed app can retry instead of silently suppressing future initialization attempts.
- Android notification permission is injected during native project preparation.
- Capacitor app ID is `com.zovro.app`; iOS sets `handleApplicationNotifications=false` so OneSignal can handle notification callbacks.
- `@onesignal/capacitor-plugin` is pinned to `1.1.9`; the raw Capacitor bridge calls match that version's native API shape.
- `/api/launch-readiness` reports OneSignal App ID presence, REST key presence, and server-side push configuration without exposing secrets.
- `push:check`, `mobile-push:check`, and `native-push:check` are included in `qa:all`.
- [ZOVRO Full QA #346](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34631805937) succeeded on source commit `0843f0b0d33551ba8a3f161fd37531084089c902`.

## Connected OneSignal observations

- MCP service health: OK.
- OneSignal app: `Zovro llc App` (`7992b022-6c11-4a66-bad4-8cbd114266d0`).
- Nine push templates exist for new requests, provider acceptance, and job status events.
- Message history at this checkpoint: `0` notifications. No delivery claim can be made yet.
- Production backend readiness reports both the OneSignal App ID and REST API key configured.
- APNs platform credentials/capabilities and a signed iOS build remain required for iOS delivery.
- FCM platform credentials and a signed Android build remain required for Android delivery.
- At least one real-device subscription is required before end-to-end delivery can be marked PASS.

## PASS criteria for PUSH-01

1. Complete APNs and FCM channel configuration in the same OneSignal app.
2. Install signed ZOVRO builds on physical iOS and Android devices and grant notification permission.
3. Confirm OneSignal shows active subscriptions bound to the correct ZOVRO external user IDs.
4. Send and record new nearby request, provider accepted, and job status update notifications.
5. Verify foreground/background/terminated delivery and notification-tap routing to the correct request.
6. Verify customer/provider isolation and that duplicate notification IDs do not create duplicate sends.
7. Record device OS/build IDs, OneSignal message IDs, source SHA, timestamps, delivery status, and redacted screenshots as release evidence.

Configuration presence, templates, simulator builds, and repository QA do not by themselves close PUSH-01.

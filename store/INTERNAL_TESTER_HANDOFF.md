# ZOVRO Internal Tester Handoff

Version: 1.0.0  
Package / Bundle ID: `com.zovro.app`

Use only synthetic test accounts. Do not use real customer/provider personal data.

## Internal release note

Initial ZOVRO 1.0.0 internal test build for validating customer and provider flows, nearby service requests, messaging, job tracking, account recovery and deletion, payments, location-dependent features, and notification readiness.

## Customer test flow

1. Install the signed build from Google Play Internal testing or TestFlight.
2. Sign in with the designated synthetic customer account.
3. Confirm service discovery loads.
4. Allow location only when prompted by a location-dependent action.
5. Create a normal request.
6. Create an urgent/SOS marketplace request and verify the app does not imply replacement of 911.
7. Exchange in-app messages with the provider.
8. Verify request/job status updates.
9. Exercise password recovery.
10. Verify account deletion entry point and confirmation flow.
11. Verify support opens and shows `support@zovro.work`.

## Provider test flow

1. Sign in with the designated synthetic provider account.
2. Confirm service categories / multi-skill selection.
3. Toggle availability.
4. Receive an eligible nearby request.
5. Accept the request.
6. Exchange messages with the customer.
7. Update job status through the expected lifecycle.
8. Verify unrelated customer private data is not visible.

## Device / platform checks

### Android
- Install from Play Internal testing, not a local debug APK.
- Verify GPS permission behavior.
- Verify app resumes securely after backgrounding.
- Register OneSignal subscription and verify push delivery/tap routing when available.
- Confirm no debug-only UI or behavior appears.

### iOS
- Install from TestFlight.
- Verify Face ID / password AutoFill behavior.
- Verify GPS permission behavior.
- Register OneSignal/APNs subscription and verify push delivery/tap routing.
- Confirm foreground/background/terminated notification handling where supported.

## Payment acceptance

Use only approved test transactions. Confirm:
- payment UI loads,
- duplicate submission does not double-charge,
- failed payment path is clear and retry-safe,
- launch platform fee remains configured as intended.

## Evidence to record

For each test:
- platform,
- device model,
- OS version,
- app version/build,
- timestamp,
- expected result,
- actual result,
- PASS / FAIL / BLOCKED,
- screenshot or log reference.

## Do not expose in screenshots

- real names,
- real phone numbers,
- real email addresses,
- real street addresses,
- payment details,
- API keys,
- device tokens,
- account IDs,
- production secrets.

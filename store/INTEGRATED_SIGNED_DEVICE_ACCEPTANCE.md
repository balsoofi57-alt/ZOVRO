# ZOVRO Integrated Signed-Device Acceptance

Checkpoint: 2026-09-27
App: ZOVRO 1.0.0
Package / Bundle ID: `com.zovro.app`

This is the final acceptance plan after signed Android/iOS builds are available. It contains no secrets, credentials, production customer data, or private test accounts.

## Preconditions

- Android signed AAB accepted by Google Play Internal testing.
- iOS signed IPA processed by TestFlight.
- Test devices use synthetic/test accounts only.
- Production API remains `https://zovro-api-final.onrender.com`.
- Do not use real customer/provider data for acceptance screenshots or evidence.

## Customer device acceptance

### Authentication
- Create/sign in with a test customer account.
- Confirm password AutoFill works where supported.
- Confirm session remains valid after normal app restart.
- Confirm Forgot Password flow works using the configured recovery channel.
- Confirm logout clears authenticated state.
- Confirm account deletion is accessible and requires appropriate confirmation.

### Location / GPS
- Deny location permission and verify clear non-destructive error handling.
- Allow location permission and verify current location can be acquired.
- Verify stale/invalid coordinate rejection.
- Confirm location-dependent service discovery behaves correctly.
- Confirm location is not requested before a location-dependent action.

### Service request
- Create a normal service request.
- Create an urgent/SOS marketplace request.
- Confirm SOS copy does not imply 911/emergency-dispatch replacement.
- Verify duplicate/retry protection does not create duplicate active urgent requests.
- Confirm no-provider state is clearly displayed.

### Messaging / tracking
- Exchange customer/provider in-app messages.
- Verify customer does not receive another customer's private content.
- Verify status transitions update correctly.
- Verify accepted provider visibility and revoked/replaced provider access rules.

### Payment flow
- Verify configured payment UI loads.
- Verify platform fee remains at the launch configuration.
- Verify duplicate submit/retry does not double-charge.
- Verify failure path is clear and retry-safe.
- Verify refund-related status display only if using an approved test transaction.

### Push notifications
- Register the signed device with OneSignal.
- Confirm external-user identity binding.
- Verify a test notification arrives:
  - foreground,
  - background,
  - terminated state where supported.
- Verify notification tap opens the intended app destination.
- Verify opt-out / disabled-notification state is handled clearly.
- Record device platform, OS version, app build/version, OneSignal subscription state, timestamp, expected vs actual.

### Support
- Open in-app support.
- Verify support email is `support@zovro.work`.
- Verify automated support does not promise refunds, emergency response, payment outcomes, or legal determinations.
- Verify escalation/human-review messaging on uncertain requests.

## Provider device acceptance

- Sign in with a synthetic provider account.
- Set availability on/off.
- Confirm multi-skill/provider service selection.
- Receive an eligible nearby request.
- Accept a request.
- Confirm unavailable/ineligible provider cannot accept.
- Confirm location sharing is scoped to the active job.
- Update job status through expected lifecycle.
- Message the customer.
- Verify provider cannot see unrelated customer private data.

## Biometric / device security

### iOS
- Verify Face ID unlock only after the user has an authenticated session.
- Cancel Face ID and verify secure fallback behavior.
- Restart app and verify no plaintext password is exposed or stored by ZOVRO.
- Confirm iOS production provisioning includes `aps-environment=production`.

### Android
- Verify password manager / credential autofill where supported.
- Verify app resumes securely after backgrounding.
- Verify no debug-only behavior appears in the Play-installed build.

## Account deletion / privacy

- Verify deletion entry point is visible in-app.
- Verify confirmation language is clear.
- Confirm deleted session can no longer access authenticated endpoints.
- Verify support process for deletion matches public policy.
- Verify privacy, terms, and support URLs open successfully.

## Store screenshot acceptance

Capture screenshots only after the signed build passes the checks above.

Use synthetic accounts and do not expose:
- real names,
- real phone numbers,
- real email addresses,
- real addresses,
- payment data,
- API keys,
- device tokens,
- account IDs.

Required screenshot story:
1. Home / service discovery.
2. Smart Match / describe need.
3. Nearby providers.
4. Request details / provider acceptance.
5. Job tracking.
6. Private messaging.
7. Ratings/provider history.
8. Privacy/support/password recovery/account deletion.

## Evidence format

For each test record:
- Platform
- Device model
- OS version
- Build/version
- Source SHA
- Test account type
- Timestamp
- Expected result
- Actual result
- PASS / BLOCKED / FAIL
- Screenshot/video/log reference if applicable

## Closure rule

Do not mark the integrated mobile launch gate CLOSED until:
- Android signed build is accepted by Play Internal testing,
- iOS signed build is processed by TestFlight,
- both platforms pass signed-device acceptance,
- real push delivery and tap routing are proven,
- store declarations are reconciled against those signed builds,
- final human legal approval is recorded.

# ZOVRO smart sign-in rollout

Status: implementation specification; NOT deployed. Preserve all existing users, credentials, sessions, roles, and requests.

## Existing behavior confirmed
- `biometric-client.js` supports native biometric unlocking of a saved secure session, not independent identity verification.
- `phone-verification-client.js` verifies the phone of an already authenticated user; it is NOT a passwordless login endpoint.

## Required implementation
1. Retain existing password login and recovery without resetting credentials.
2. Add Apple Sign In (iOS) and Google Sign In with server-side verification of provider identity tokens (issuer, audience, signature, expiry, nonce). Never trust client-provided email or user ID alone.
3. Link an external identity to an existing account only after a successful existing-account authentication or explicit verified linking challenge. Never auto-merge based on email or phone alone. Use unique `(provider, subject)` mapping and audit log.
4. Introduce passwordless phone login only after SMS provider deliverability is verified. Use short-lived single-use OTP challenges, hashed server-side codes, strict rate limits, attempt limits, anti-enumeration responses, replay prevention, and transactional consumption.
5. Biometric unlock must be opt-in, use OS-native auth and secure storage, validate the saved session against `/me`, and fall back gracefully when expired or unavailable. Biometrics are not a replacement for backend authentication.
6. Show available options in a single compact screen: Face ID (only if configured), Apple (iOS), Google, Phone, and password fallback. Keep approved dark royal-blue and gold visual language.
7. Persist sessions only in secure OS storage on mobile; rotate/revoke tokens appropriately. Do not store passwords in localStorage.
8. Test old-account login, provider/customer roles, linked identities, cancellation, lost phone, expired sessions, OTP abuse, logout, and account recovery before release.
9. Feature flag new providers and OTP login. Roll out to internal TestFlight testers first; verify server configuration, provider credentials, and SMS readiness before enabling publicly.

## Release gates
- Existing-account regression suite passes.
- Apple/Google provider credentials and callbacks configured.
- SMS delivery verified; otherwise keep phone OTP sign-in disabled.
- No forced migration, deletion, automatic merging, or production deployment without validation.

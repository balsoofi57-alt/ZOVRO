# ZOVRO provider ID and live-face release checklist

Purpose: Only service providers and shop owners who are at least 18, whose government document is valid, and whose live selfie matches their ID may accept new ZOVRO jobs.

## Required third-party setup (production)

1. Activate Stripe Identity in the **existing ZOVRO Stripe live account**: https://dashboard.stripe.com/identity/application. Being able to accept payments does **not** prove Identity is activated.
2. Confirm live document checks, matching selfie and live document capture are available for the intended countries. Check Stripe's supported jurisdictions and local biometric-consent rules. Provide a compliant manual review/appeal option for unsupported cases before public rollout.
3. Create **one live restricted API key** in Stripe Dashboard (not in GitHub). Give it only `Identity Verification Results: Read` and `Recent Detailed Verification Results: Read` for retrieving the DOB, as described in https://docs.stripe.com/identity/access-verification-results. The last permission normally permits DOB retrieval only for recent verification results (48-hour access window); configure production IP restrictions separately if longer access is strictly necessary. Do not grant file/image permissions.
4. Configure the following *only in the backend Render environment*, never in the client, CI logs, or repository:
   - `STRIPE_SECRET_KEY`: existing ZOVRO live Stripe secret used to **create** the verification session.
   - `ZOVRO_STRIPE_IDENTITY_RESULTS_KEY`: separate **rk_live_** key used **only** to read verified DOB, name and session status.
   - `ZOVRO_PROFILE_ENCRYPTION_KEY`: >=32-byte secret for encrypted legal name and keyed comparison.
   - `ZOVRO_IDENTITY_RETURN_URL`: verified HTTPS return URL of the ZOVRO app, e.g. `https://zovro-web.onrender.com/?identity_verification=return#profile`.
5. Test the full live hosted flow with a consenting adult test provider before deploying the strict gate: valid passport or ID, live camera selfie, correct age and legal name, processing state, return to profile, genuine verified result, and the ability to receive and accept a nearby request. **Do not** ask real users to submit documents until this passes.
6. Exercise negative cases with synthetic fixtures without uploading real IDs: age 17, session missing face match, non-live document capture, expired/reused link, name mismatch, unavailable Stripe, and user cancel. Make sure all remain ineligible.
7. Check that support has a secure appeal/retry flow and appropriate ID retention/redaction policy. Do not store or log raw document images, selfie images, ID numbers, DOB, restricted-key strings, or unredacted Stripe responses in ZOVRO.
8. Verify that newly returned Stripe session options explicitly retain **both** `require_live_capture=true` and `require_matching_selfie=true`. If either is missing, refuse onboarding (the server now enforces this on session creation).
9. Verify revoked/redacted verification sessions cannot remain approved when the provider rechecks their status. Stripe redaction can be asynchronous. Provide operational handling (such as a verified Stripe event/webhook or admin revocation path) for immediate revocation without relying solely on a provider-initiated status refresh. Test using synthetic results rather than real identity data.
10. Confirm all existing providers can reverify without losing ongoing jobs, and communicate the mandatory identity transition before enabling strict acceptance rules; otherwise the new policy can immediately block the entire supply side.

## Staged rollout switch (default OFF)

The new live-face work gate is intentionally controlled by the server-side environment variable `ZOVRO_ENFORCE_LIVE_FACE_ID`. **Absent or any value other than `true` leaves the existing government-photo-ID and 18+ eligibility requirements in place**, without suddenly blocking all previously approved providers. The flag must not appear in a public web bundle or client configuration.

- With the flag OFF: existing official ID and minimum-age checks stay mandatory. The **existing government photo-ID onboarding remains available** through the Stripe document/selfie-match session and legacy results read, without requiring live document capture. The provider UI offers the government-ID flow and explains that additional live capture is being prepared; do not claim the stricter live-face workflow is active.
- With the flag ON: only providers with `identityVerification.faceVerifiedLive === true` in addition to official-ID and age confirmation can discover or accept new requests. Existing jobs remain unaffected by the eligibility gate.
- Always test BOTH modes on all relevant API services and app versions. Validate that no existing approved provider is denied availability, discovery, or job acceptance when the flag is OFF; validate a synthetic no-selfie provider is refused when ON.
- Keep the flag OFF until Stripe Identity live access, live restricted key (DOB within 48h), legal/security requirements, real-device camera capture and matched-face E2E, support appeal/retry handling, and provider re-verification rollout communications are all verified.
- The rollback path must be tested with a synthetic newly registered provider, as well as an already approved provider. Both must be able to initiate the pre-existing government-ID + age verification without the live-face restricted results key when the flag is OFF.
- Flip the flag only in a coordinated release after enough existing providers are reverified; independently deployed APIs must agree on the setting. Keep a documented, authorized rollback procedure to revert the flag to OFF promptly if demand fulfillment drops. This rollback must **not** disable official ID or age restrictions.
- **Do not switch the flag automatically or immediately on code merge.** Backend flags control acceptance. iOS TestFlight builds and Android signed release require separate distribution steps.

## Deployment safety

**Do not merge the web registration PR and production API PR separately.** The API must be ready before showing customers a live onboarding route. Both strict gates affect **all existing providers** without `identityVerification.faceVerifiedLive === true`. Previous providers must complete re-verification before new dispatch or job acceptance; existing assignments should remain unaffected.

Validate CI/full QA and static mobile-bundle QA, confirm all services in Render are healthy, then publish a native iOS TestFlight and signed Android build separately. Do not claim these builds were shipped just because website code passed tests.

## Private records

ZOVRO persists only encrypted legal-name material, a one-way keyed name comparison, a provider/session reference, age eligibility, face/ID verification status, and timestamps. Stripe hosts the actual photo ID and live face capture. The provider controls consent. Unverified and pending accounts can sign in to complete checks but cannot appear in marketplace discovery or accept new jobs.

**Known external dependency:** Until the restricted-results key and Stripe Identity live access are validated, the UI must show verification unavailable rather than charging for sessions it cannot approve. No real personal biometric documents should be sent in support chat.

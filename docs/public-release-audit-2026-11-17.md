# ZOVRO — Public release audit (2026-11-17)

App: `com.zovro.app`. This is a read-only evidence checkpoint, **not** permission to release publicly. Do not overwrite existing app builds, production data, signing identities, or payment settings.

## Verified
- **Apple:** signed App Store IPA was archived, exported and uploaded using `altool` without errors, in [iOS run 44003526768](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44003526768) on commit `33770cafe3d3e6b01ec8aefefa2e8b67ece9b1ce`. This verifies transport upload, *not* Apple processing, TestFlight install or public review.
- **Apple agreement/API:** read-only account/app preflight succeeded for `com.zovro.app` in [run 44003233784](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44003233784).
- **Android compilation:** debug APK and **unsigned** release AAB compiled in [run 44002712470](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44002712470). Store signing/upload did not occur: `SIGNING_AVAILABLE=false`, `SIGNED_BUNDLE_OUTCOME=skipped`, `PLAY_DRAFT_OUTCOME=skipped`.
- **Render:** `zovro-web` and `zovro-api-main` were live at commit `33770cafe...` on `main`. Canonical `zovro-api-final` was separately live at commit `f7fd21c...` from `zovro-final-deploy` (production branch differs from `main`). Render logs showed `/api/health` HTTP 200 at 2026-11-17 12:13 UTC and the recovery-email task endpoint returning 200. One older client request timeout was recorded on Nov 15, not evidence of persistent failure.
- **Source QA:** [Full QA run 43990535864](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/43990535864) succeeded on commit `a5e6fc50...`. Do not equate passing earlier source CI with acceptance of the signed public build.

## Still open: authoritative gates
1. **App Store:** verify exact uploaded build processing and availability in App Store Connect, signed iPhone installation, end-to-end user/customer/provider/payment/GPS/push/account deletion paths, current privacy declaration and exact-build screenshots. Public App Review has **not** been verified or requested by this audit.
2. **Google Play:** recover original approved upload keystore and protected CI credentials, or first confirm Play App Signing and request an official upload-key reset if the original private key is lost; never invent or replace signing credentials silently. Produce verified signed AAB, upload to **internal testing**, confirm Play acceptance, and test a Play-installed build on a real phone. See [upload key recovery](../docs/android-upload-key-recovery.md).
3. **Native Face ID and identity:** draft PRs #199/#201 require signed physical iPhone authentication/fallback verification. Strict live ID+selfie gate in #196/#197 is staged and requires Stripe Identity access, live camera E2E and an existing-provider transition plan; do not enable a feature flag that unintentionally disables previously approved providers.
4. **Real-device notifications and SMS:** demonstrate APNs/OneSignal and Android FCM subscriptions, push arrival and tap routing in foreground/background. Confirm Twilio A2P approval and real opt-in, reply, HELP and STOP evidence before enabling SMS.
5. **Store declarations/legal:** complete final screenshots, reviewer access, content rating, audience selection, Apple App Privacy and Play Data Safety aligned with actual signed binary; obtain explicit authorized legal sign-off for provider licensing, marketplace safety, biometrics, privacy, fees, cancellations and refunds.
6. **Production API parity:** confirm compatibility between the `main` client and `zovro-final-deploy` canonical API. Only perform a production rollout after verification, non-destructive migration review and rollback readiness.

**Disposition: NO-GO for public rollout pending verified external gates.** Keep public store release disabled and preserve live production data. Closing a check in code or exporting an artifact is not equivalent to store acceptance or real-device evidence.

Links: [latest signed iOS upload](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44003526768) · [Android store readiness](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44002712470) · [external launch actions](../EXTERNAL_LAUNCH_ACTIONS.md).

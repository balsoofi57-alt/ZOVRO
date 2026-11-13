# ZOVRO Android side-by-side QA build — 13 November 2026

This is an **internal engineering QA APK**, not a Google Play or TestFlight release. It is generated from stable source commit `5704091ebc5ea97593f5bd5b48edb86636916470` on isolated branch `qa/android-side-by-side-20261113`, without pushing to `main` or updating the Play Console.

## Device identity and purpose

- Installed package: **`com.zovro.app.qa`**, not `com.zovro.app`. The separate identifier prevents Android from replacing the Play-distributed app.
- Home-screen app name: **ZOVRO QA**. A fixed top banner identifies a test build and warns that the underlying service is live.
- Signed with a temporary Android **debug certificate** for trusted device testing only. Do not submit to Google Play production/internal-testing tracks.
- Packaged API points at the **live ZOVRO backend**. Testers must use designated test accounts; avoid real payments, production customer records, or submitting actual customer/provider jobs. Coordinate QA scope before using functions that change backend data.
- The current installed `com.zovro.app` should be left untouched. Do not uninstall or clear its data to install QA.
- To remove only the test app after reviewing it, uninstall *ZOVRO QA* (not ZOVRO).

## Validation gates

1. Isolated GitHub Actions build succeeds, including Gradle `assembleDebug`.
2. Android build tools `aapt dump badging` report package `com.zovro.app.qa` and label `ZOVRO QA`.
3. Android `apksigner verify` succeeds and the APK's SHA-256 is recorded.
4. The tested file is uploaded to a private owner-only destination, not made publicly accessible without a separate request.
5. On-device QA must still validate startup, GPS permissions, login/logout, password recovery fallback, location sharing and basic request-navigation UI. Do not claim these tests passed merely from build success.

## Release blockers remain separate

- Apple TestFlight: Apple App Store Connect agreement **`FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED`** must be resolved by the Account Holder. A signed iPhone IPA exists, but was not accepted by Apple.
- Google Play standard release: The existing upload key and Google Play API authorization are not present/verified. This QA build does **not** replace those credentials or constitute a store release.
- Face ID branch PR #183 is a draft with unresolved conflicts, so it is not included in this stable-source QA APK.

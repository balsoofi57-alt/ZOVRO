# ZOVRO — Easy internal updates

This repository has a one-screen release launcher for the existing iOS and Android build workflows. It does **not** change public production deployments.

## Start an update

1. Have the intended code reviewed and merged into the branch you want to build. Use **main** for the normal release flow.
2. Open **GitHub → Actions → ZOVRO Easy Internal Updates → Run workflow**.
3. Select **ios**, **android**, or **both**.
4. Leave **upload_to_internal** unchecked to prepare build artifacts only. Check it to request a TestFlight upload (iOS) and/or a **draft** internal Google Play release (Android).
5. Watch the **ZOVRO iOS Release Verification** and/or **Build ZOVRO Android** workflows linked in the launcher's Summary. The launcher queues the jobs; it does **not** assert the stores accepted the uploads. The two child jobs use their own release/build numbers.

**Safety:** Existing public releases, stored user data, Apple distribution credentials, and Android upload keys are not deleted or overwritten. Public App Store/Google Play release is not performed.

## Fast preflight and clear blockers

When **upload_to_internal** is checked:

- iOS checks the required App Store Connect API credentials, queries the authorized ZOVRO app by bundle identifier, and fails **before** the expensive Xcode build if Apple reports missing or expired agreements, an invalid API key, or inaccessible com.zovro.app.
- Android checks for its upload keystore, passwords, alias, and Google Play service-account JSON **before** Gradle builds. It validates the keystore locally; Google Play still determines whether the upload certificate matches the app.
- No secret values are printed or committed. API keys and signing files stay in GitHub Actions secrets.

If Apple reports APPLE_AGREEMENT_REQUIRED, the ZOVRO LLC **Account Holder** must review the updated terms at https://developer.apple.com/account and accept them personally. Apple may update agreements again; this preflight cannot override its rules. After an agreement is accepted, rerun the launcher. Apple may still require additional store processing or TestFlight compliance actions.

If Android reports ANDROID_SIGNING_MISSING, configure the existing ZOVRO_ANDROID signing secrets and ZOVRO_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON securely in GitHub Actions. Do not replace the registered upload key blindly; compare with Google Play Console's Play App Signing records. An uploaded internal draft may still require explicit action before testers can access it.

## Required GitHub Actions secrets

iOS: ZOVRO_IOS_CERTIFICATE_P12_BASE64, ZOVRO_IOS_CERTIFICATE_PASSWORD, ZOVRO_IOS_PROVISIONING_PROFILE_BASE64, ZOVRO_APPLE_TEAM_ID, ZOVRO_APP_STORE_CONNECT_API_KEY_ID, ZOVRO_APP_STORE_CONNECT_ISSUER_ID, ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64.

Android: ZOVRO_ANDROID_KEYSTORE_BASE64, ZOVRO_ANDROID_KEYSTORE_PASSWORD, ZOVRO_ANDROID_KEY_ALIAS, ZOVRO_ANDROID_KEY_PASSWORD, ZOVRO_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.

## Deployment boundaries

- TestFlight is for beta distribution. Upload and acceptance are distinct stages. Physical-iPhone biometrics and push/payment/location must be tested before considering the release validated.
- Android's existing upload workflow commits the bundle to an **internal draft**, not a public production release.
- GitHub's Run workflow option appears after this launcher is merged into the **default branch**. This feature branch/PR is not itself a deployed launcher.
- Existing child release workflows keep their own opt-in flags defaulting to **false** and all public releases remain manual.

## Local validation

Run npm run updates:check to test release dispatch, Apple JWT generation and error handling, bundle identifier checks, and safety guards. npm run qa:all includes the same tests.

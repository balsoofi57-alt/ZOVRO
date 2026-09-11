# ZOVRO Mobile Packaging

ZOVRO is prepared for a Capacitor iOS/Android shell using application ID `com.zovro.app` and web directory `www`.

Release path: production web bundle → Capacitor sync → physical-device testing → signing → TestFlight / Play internal testing → store submission.

## Android CI

Workflow: `.github/workflows/android-build.yml`

The workflow always builds a debug APK. It has two safe release paths:

- Without complete signing secrets, it builds and uploads `zovro-android-release-unsigned-aab`.
- With all signing secrets present, it decodes the upload keystore only into the temporary GitHub runner, validates the alias, signs the release bundle, verifies the JAR signature, records SHA-256, and uploads `zovro-android-release-signed-aab`.

Required GitHub Actions secrets:

- `ZOVRO_ANDROID_KEYSTORE_BASE64`
- `ZOVRO_ANDROID_KEYSTORE_PASSWORD`
- `ZOVRO_ANDROID_KEY_ALIAS`
- `ZOVRO_ANDROID_KEY_PASSWORD`

The keystore must be stored as base64 text in the GitHub secret. Never commit the keystore, passwords, decoded file, or signing properties.

Latest verified unsigned-path evidence:

- Source: `174054ba54f6577f3bd041a0bf16dd8d1d06153e`
- [Android run #10](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34633140101): SUCCESS
- Debug artifact archive digest: `sha256:d601e6282d1e9ad7cee830a3627638f0f306072e801baa50186edc9ea4ef62e4`
- Unsigned AAB artifact archive digest: `sha256:d910a5dabade85da43256b2e3358f81d2ddc954e5ffcaabd7e757333368e4197`

These are GitHub artifact-archive digests, not the contained APK/AAB file digests. Android signing remains BLOCKED until the four secrets are installed and the signed branch executes successfully.

## iOS CI

Workflow: `.github/workflows/ios-release.yml`

The workflow always builds and uploads `zovro-ios-simulator-unsigned`. It has an additional protected App Store path:

- Without all Apple signing secrets, it records that signing is unavailable and safely skips the device archive, IPA export, and signed-artifact upload.
- With all secrets present, it decodes the certificate and provisioning profile only into the temporary macOS runner, creates an ephemeral keychain, verifies the Apple Distribution identity, validates the provisioning-profile Team ID and `com.zovro.app` authorization, creates a signed generic-iOS archive, verifies the code signature, exports an App Store Connect IPA, records SHA-256, uploads `zovro-ios-app-store-signed`, and removes temporary signing material.
- Signed archives use marketing version `1.0.0` and a unique build number derived from the GitHub workflow run and attempt.

Required GitHub Actions signing secrets:

- `ZOVRO_IOS_CERTIFICATE_P12_BASE64`
- `ZOVRO_IOS_CERTIFICATE_PASSWORD`
- `ZOVRO_IOS_PROVISIONING_PROFILE_BASE64`
- `ZOVRO_APPLE_TEAM_ID`

The certificate must include its private key and be exported as password-protected PKCS#12 (`.p12`) before base64 encoding. The provisioning profile must be an App Store profile for the explicit App ID matching `com.zovro.app` and the same Apple Team ID.

### Controlled TestFlight upload

TestFlight upload is disabled on normal pushes. It runs only from **Actions → ZOVRO iOS Release Verification → Run workflow** when the operator explicitly enables `upload_testflight` and all signing plus App Store Connect API secrets are present.

Required GitHub Actions upload secrets:

- `ZOVRO_APP_STORE_CONNECT_API_KEY_ID`
- `ZOVRO_APP_STORE_CONNECT_ISSUER_ID`
- `ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64`

The private `.p8` key is decoded only into the temporary runner, used by `xcrun altool` to validate and upload the IPA, and removed by an exit trap. A successful upload sends the build for App Store Connect/TestFlight processing; it does not submit the app for App Review or publish it publicly.

Never commit certificates, private keys, provisioning profiles, passwords, decoded files, App Store Connect API credentials, or recovery codes.

Latest verified unsigned and no-upload path evidence:

- Source: `5a9e4ad149e3c8f7fed4dcad5a2cb2b64d96452e`
- [iOS run #47](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34636398262): SUCCESS
- [Full QA run #355](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34636407687): SUCCESS
- Unsigned simulator artifact archive digest: `sha256:f0b80e5d127abcde22be734609b0812e4465ebb6fa97cf33bdd392eddda34f4b`
- Signed archive, IPA export, and signed-artifact steps: SKIPPED because the protected Apple signing secrets are not installed
- TestFlight upload step: SKIPPED because this was a normal push, not an explicitly authorized manual upload
- Always-run temporary signing-material cleanup step: SUCCESS

This is a GitHub artifact-archive digest, not the contained app-bundle digest. iOS signing and TestFlight processing remain BLOCKED until the seven protected secrets are installed, the manual signed/upload path executes successfully, the build finishes App Store Connect processing, and physical-device testing passes.

Apple Developer organization access and an App Store Connect app record are still required. Apple signing credentials must remain limited to authorized organization members and protected secret storage.

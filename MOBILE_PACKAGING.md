# ZOVRO Mobile Packaging

ZOVRO is prepared for a Capacitor iOS/Android shell using application ID `com.zovro.app` and web directory `www`.

Release path: production web bundle → Capacitor sync → physical-device testing → signing → TestFlight / Play internal testing → store submission.

## Automated release safety guard

Command: `npm run mobile-release-workflows:check`

The guard runs inside `qa:all` and fails CI if either mobile workflow loses its manual-upload condition, signing requirement, read-only repository permission, internal/draft restriction, no-review protection, signature verification, unique build numbering, or temporary-secret cleanup. It also rejects committed `.jks`, `.keystore`, `.p8`, `.p12`, and `.mobileprovision` files outside generated/excluded build directories.

Latest guard evidence:

- Source: `eafe37382598ed48da100e8e43ceff64f3d75e01`
- [Full QA run #362](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34638332920): SUCCESS
- Log result: `mobile-release-workflow-check: PASS`
- [Android run #13](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34638328571): SUCCESS
- [iOS run #49](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34638328605): SUCCESS

## Android CI

Workflow: `.github/workflows/android-build.yml`

The workflow always builds a debug APK. It has two safe release paths:

- Without complete signing secrets, it builds and uploads `zovro-android-release-unsigned-aab`.
- With all signing secrets present, it decodes the upload keystore only into the temporary GitHub runner, validates the alias, signs the release bundle, verifies the JAR signature, records SHA-256, and uploads `zovro-android-release-signed-aab`.
- Every generated Android build uses version name `1.0.0` and a unique `versionCode` derived from the GitHub workflow run and attempt.

Required GitHub Actions signing secrets:

- `ZOVRO_ANDROID_KEYSTORE_BASE64`
- `ZOVRO_ANDROID_KEYSTORE_PASSWORD`
- `ZOVRO_ANDROID_KEY_ALIAS`
- `ZOVRO_ANDROID_KEY_PASSWORD`

The keystore must be stored as base64 text in the protected GitHub secret. Never commit the keystore, passwords, decoded file, or signing properties.

### Controlled Google Play internal upload

Google Play upload is disabled on normal pushes. It runs only from **Actions → Build ZOVRO Android → Run workflow** when the operator explicitly enables `upload_google_play`, all signing secrets are present, and this additional protected secret exists:

- `ZOVRO_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

The service account must be linked to the ZOVRO app in Play Console with only the permissions needed to upload releases. The workflow obtains a short-lived Android Publisher access token, creates an edit, uploads the signed AAB, assigns it to the `internal` track with status `draft`, and commits it with `changesNotSentForReview=true` and `ERROR_IF_IN_REVIEW`. It therefore does not send changes for review or publish the app publicly.

Never commit the service-account JSON or expose it in documentation, artifacts, logs, screenshots, or release notes.

Latest verified unsigned and no-upload path evidence:

- Source: `a31fdb1becc484c3e0a544ae8f1297241fabdfc6`
- [Android run #11](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34637319949): SUCCESS
- [Full QA run #357](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34637325386): SUCCESS
- Debug artifact archive digest: `sha256:31f2cae7b069a113df536149d68e8aeafe38952c89642c190562d062db3d7e8d`
- Unsigned AAB artifact archive digest: `sha256:dc1853728175f1236cd143257e65779c55fe9eeb74f1eb46adfd3de906832537`
- Unique Android release-version assignment step: SUCCESS
- Signed AAB and Google Play upload steps: SKIPPED because signing credentials are absent and this was a normal push

These are GitHub artifact-archive digests, not the contained APK/AAB file digests. Android signing and Play internal upload remain BLOCKED until the five protected secrets are installed, the manually authorized signed/upload path passes, the draft is reviewed in Play Console, and physical-device testing succeeds.

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

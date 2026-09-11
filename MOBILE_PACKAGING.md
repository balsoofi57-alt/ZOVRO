# ZOVRO Mobile Packaging

ZOVRO is prepared for a Capacitor iOS/Android shell using application ID `com.zovro.app` and web directory `www`.

Release path: production web bundle → Capacitor sync → physical-device testing → signing → TestFlight / Play internal testing → store submission.

## Android CI

Workflow: `.github/workflows/android-build.yml`

The workflow always builds a debug APK. It now has two safe release paths:

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

The current workflow verifies an unsigned iOS Simulator release. A signed App Store archive still requires:

- Apple Developer organization access
- Distribution certificate and private key
- App Store provisioning profile for `com.zovro.app`
- Apple Team ID
- App Store Connect app record
- Temporary-runner certificate/profile import
- Signed archive export, TestFlight processing, and physical-device validation

Do not add certificates, private keys, provisioning profiles, passwords, or App Store Connect API credentials to the repository.

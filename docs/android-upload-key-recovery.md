# ZOVRO Android upload-key recovery

Last checked: 2026-11-12. App package: `com.zovro.app`.

## Verified state
- GitHub Android build [run 43264206163](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/43264206163) passed and generated an unsigned release AAB plus a debug APK.
- The `Build signed release AAB` and `Upload signed AAB to Google Play internal draft` steps were skipped.
- The repository contains only **public** evidence of an earlier upload certificate in `store/android/UPLOAD_KEY_PROOF.md`; this cannot sign a new build.
- Never assume Play App Signing enrollment, upload key reset authorization, or Google Play API access from the existence of this certificate.

## Secure recovery checklist
1. Confirm the current Google Play Console app package is `com.zovro.app`; check whether **Play App Signing** is enabled and compare the upload certificate SHA-256 with `store/android/UPLOAD_KEY_PROOF.md`.
2. Search for a secure backup of the existing upload `.jks` or `.keystore`, alias and both passwords. Do **not** put these in the public repository or issue text.
3. If the original private upload key is recoverable, configure the existing GitHub Actions encrypted secrets: `ZOVRO_ANDROID_KEYSTORE_BASE64`, `ZOVRO_ANDROID_KEYSTORE_PASSWORD`, `ZOVRO_ANDROID_KEY_ALIAS`, `ZOVRO_ANDROID_KEY_PASSWORD`.
4. If the private upload key is lost **and Play App Signing is enabled**, follow the official [Google Play upload-key reset instructions](https://support.google.com/googleplay/android-developer/answer/9842756). Generate a secure, separately backed-up replacement keystore and public PEM certificate; file the reset request in the authorized Play Console account. Do **not** use the new key for upload until Google accepts it. This is an upload-key reset, **not** an upgrade or replacement of the app signing key.
5. After Google acknowledges the usable upload certificate, store the new keystore and passwords only in encrypted CI secrets; verify `ZOVRO_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` and the service account's intended permissions.
6. Run `Build ZOVRO Android` with `upload_google_play=true` and verify *all* of: signed AAB, `jarsigner` validation, and Google Play **internal draft** upload. Keep production rollout off.
7. Have designated internal testers install the Play internal version and check signing compatibility, app startup, location permissions, sign-in, notifications and payment test flows.

## Restrictions
- Do not invent, replace, or commit the old signing key or its passwords.
- Do not submit an unsigned AAB as a signed production release.
- Do not change the package ID, app signing key, or public rollout settings while recovering upload access.

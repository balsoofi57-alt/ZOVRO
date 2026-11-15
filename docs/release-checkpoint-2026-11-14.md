# ZOVRO release checkpoint — 2026-11-14

This is a **read-only verification log**, not an approval to publish. Preserve every existing build, certificate, account, service, and customer record. Do not merge this documentation branch as a release trigger without reviewing the changed workflow paths.

## iOS / TestFlight
- GitHub Actions [iOS release verification run 43631285117](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/43631285117), head commit `df1ab136e97609ebe5b78f4bded21bb25692424e`: `build-ios` completed successfully.
- Signed IPA archive/export and `Upload signed IPA to TestFlight` both completed successfully. Apple upload log: `UPLOAD SUCCEEDED with no errors`; delivery UUID `bd1efbab-d222-478d-964c-2b54040be193`.
- GitHub retained signed IPA artifact `zovro-ios-app-store-signed` (run artifact 14128889033) and diagnostic logs (artifact 14129940084).
- **An upload success does not by itself prove current App Store Connect processing, tester eligibility, or installation.** Verify the specific build in App Store Connect and test it on an enrolled physical iPhone.
- Native Face ID session-protection fix remains a separate draft: [PR #201](https://github.com/balsoofi57-alt/ZOVRO/pull/201). Full QA run 43542923273 and unsigned native preview run 43542923289 passed on the branch head `8f162f43b31008d3504d3cc87ca10bbb52cab58f`, but the new native plugin has **not** been verified on a signed physical-device build. Keep it out of public rollout until device validation.

## Android / Google Play
- Latest [Build ZOVRO Android run #197](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/43631273769) succeeded at compiling from the same main-branch commit.
- It produced a debug APK (artifact 14128516478) and **unsigned** release AAB (artifact 14128452347).
- `Build signed release AAB`, signed-bundle verification and `Upload signed AAB to Google Play internal draft` were **skipped**, not passed. The signing preflight said: `Play upload signing secrets are incomplete; producing an unsigned release candidate.` It showed empty keystore base64 and keystore password for that run. It did not establish whether the alias/password or Play service account are available.
- A read-only Play Console visit confirmed the app named ZOVRO with package ID `com.zovro.app`, but **did not locate** its Play App Signing enrollment status, upload certificate fingerprint, or reset-upload-key action. Do not assume a reset is permitted or needed until the current certificate and original key backups have been checked.
- Keep `com.zovro.app` and the existing app-signing identity unchanged. **Never generate an arbitrary new upload key for an existing app without first verifying Google Play App Signing and its approved upload-key reset workflow.**
- Recovery instructions: [docs/android-upload-key-recovery.md](./android-upload-key-recovery.md) and [official Google Play guidance](https://support.google.com/googleplay/android-developer/answer/9842756). All private keystores/passwords belong only in trusted encrypted secrets/storage, never in this repository.
- When signing is restored and validated, run the existing Android workflow explicitly for **Google Play internal draft only**; verify a signed AAB, `jarsigner`, the Play track update and installation on real hardware. No production release.

## Live API and website
- Web: https://zovro-web.onrender.com
- API health: https://zovro-api-final.onrender.com/api/health returned `ok: true`.
- API readiness: https://zovro-api-final.onrender.com/api/ready returned `ready: true`, `database: postgres-durable`, and `postgresOperational: true` during this check.
- A healthy endpoint does not confirm all signed-in user flows. Verify service-request creation, provider acceptance, request privacy, notifications, chat, fixed-location address handling and payments with designated test accounts.

## Next release gates
1. Confirm TestFlight build processing and physically test the currently uploaded build before changing Face ID.
2. Locate and securely restore the original Android upload keystore **or** confirm Play App Signing and perform an authorized upload-key reset if the original upload key truly cannot be recovered.
3. Verify the Play **internal draft** upload before considering public Android availability.
4. Retain all earlier binaries and production data. Do not turn on untested strict provider live-face verification or push any public store rollout from these checks.

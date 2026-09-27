# ZOVRO Google Play Internal Testing Handoff

Checkpoint: 2026-09-27

This document defines the exact artifact and acceptance evidence for the first ZOVRO internal-test upload. It contains no private key, password, service-account credential, or customer data.

## App identity
- App name: ZOVRO
- Package: `com.zovro.app`
- Version name: `1.0.0`
- Track: Internal testing
- Release name: `ZOVRO 1.0.0 Internal Test`

## Signed bundle evidence
- Signed AAB SHA-256: `33cafb468b038a120c4c937e9e3a5a4d1af8901acbae8114a82894256456c71d`
- Upload certificate SHA-1: `52:44:E2:1C:35:F3:89:C7:60:24:C6:8C:C8:91:7F:D2:FF:07:E7:66`
- Upload certificate SHA-256: `C4:56:C9:62:FF:4D:73:47:46:C4:CB:27:59:37:66:C3:53:4B:3A:E8:19:2D:60:44:00:50:F2:DA:09:FF:11:5F`
- `jarsigner` verification: PASS

## Source equivalence
The signed AAB source is `981ba1966a17479c47aa875254daa511faa57660`.
All changes after that source through the current release branch are release documentation/signing-helper evidence only; no application, backend, UI, asset, package, or runtime source changed. The signed AAB therefore remains functionally aligned with the current app code.

## Play Console acceptance checklist
1. Open the existing draft internal release for `com.zovro.app`.
2. Upload the signed AAB matching the SHA-256 above.
3. Confirm Play accepts the package and signature.
4. Confirm Play assigns a version code and shows version name `1.0.0`.
5. Resolve any Play-generated blocking errors before continuing.
6. Preview the release.
7. Keep the release on Internal testing only.
8. Do not promote to production and do not submit public rollout until signed-device acceptance and remaining external gates are complete.

## Evidence required to close AND-01
- Screenshot or console evidence that the signed AAB was accepted.
- Play-displayed version code.
- Internal testing release reaches a publishable/rollable state with no blocking errors.
- At least one authorized tester can install the build.
- Physical-device checks for GPS, SOS, authentication/biometric flow, push, payment flow, and account deletion.

## Safety
Never upload:
- the Android upload keystore,
- keystore passwords,
- GitHub secret values,
- service-account JSON,
- customer/provider production data.

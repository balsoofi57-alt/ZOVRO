# ZOVRO iOS biometric dependency — export compliance technical review

Date: 2026-11-13
Scope: Draft PR #199 only; not a shipping approval or legal determination.

## Change reviewed

- New pinned native dependency: `@aparajita/capacitor-biometric-auth 9.1.2` (Capacitor 7-compatible).
- Existing native and networking dependencies were not deliberately removed or upgraded in the source manifest.
- The new plugin provides iOS device authentication via Apple's LocalAuthentication framework (Face ID / device unlock), exposed to the app as the `BiometricAuthNative` plugin. It is used solely to unlock a previously established ZOVRO session on the device.
- No custom encryption algorithm, proprietary key exchange, or server-issued identity assertion was added by this pull request.
- Existing `capacitor-secure-storage-plugin` continues to handle stored tokens; the changes prevent restoring them into an authenticated runtime session before local verification when biometric unlock is enabled.
- The iOS Info.plist change adds only `NSFaceIDUsageDescription`; it retains the existing `ITSAppUsesNonExemptEncryption=false` declaration.

## References checked

- Apple's export compliance documentation: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- Apple's `ITSAppUsesNonExemptEncryption` reference: https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption
- Apple App Store Connect export review: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/
- Biometric plugin upstream: https://github.com/aparajita/capacitor-biometric-auth
- Version metadata: https://registry.npmjs.org/@aparajita%2Fcapacitor-biometric-auth/9.1.2

## Technical conclusion and release gate

The new biometric functionality appears to rely on operating-system local authentication rather than a new, non-exempt cryptographic implementation. For this narrow dependency change, the existing `ITSAppUsesNonExemptEncryption=false` declaration is provisionally retained, and the package manifest allowlist in `scripts/ios-export-compliance-check.js` is updated to document the technical review. The guard still fails on any future unreviewed native dependency changes.

This review **does not certify export compliance**. Before uploading a signed build, verify the exact resolved native dependency tree and Apple's current export compliance questionnaire; update the plist or provide documentation if the facts differ. Device testing and any required legal/compliance sign-off remain mandatory. Do not merge the draft PR or release to public users solely because the static QA gate passes.

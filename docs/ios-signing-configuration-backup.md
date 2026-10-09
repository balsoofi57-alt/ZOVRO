# ZOVRO iOS Signing Configuration & Export Guide
Document Version: 1.0.0
Last Updated: October 2026

This document provides a reference blueprint for the manual signing and export configurations used in the ZOVRO iOS release pipeline.

---

## 1. Required GitHub Actions Secrets

The CI/CD workflow (`.github/workflows/ios-release.yml`) expects the following secrets configured in the repository settings:

| Secret Name | Description | Format / Content |
|---|---|---|
| `ZOVRO_APPLE_TEAM_ID` | Apple Developer Team ID | 10-character alphanumeric ID |
| `ZOVRO_IOS_CERTIFICATE_P12_BASE64` | Apple Distribution Certificate + Private Key | Base64-encoded PKCS#12 (.p12) archive |
| `ZOVRO_IOS_CERTIFICATE_PASSWORD` | Password protecting the .p12 archive | String |
| `ZOVRO_IOS_PROVISIONING_PROFILE_BASE64` | App Store Distribution Provisioning Profile | Base64-encoded `.mobileprovision` file |
| `ZOVRO_APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID | 10-character alphanumeric Key ID |
| `ZOVRO_APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API Issuer ID | UUID format (e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |
| `ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64`| App Store Connect API Private Key | Base64-encoded `.p8` file |

---

## 2. Target Build Settings Specification

Signing settings are strictly scoped to the primary **App application target** under the **Release** build configuration:

- **Target:** `App`
- **Product Type:** `com.apple.product-type.application`
- **Configuration:** `Release`
- **PRODUCT_BUNDLE_IDENTIFIER:** `com.zovro.app`
- **DEVELOPMENT_TEAM:** `$ZOVRO_APPLE_TEAM_ID`
- **CODE_SIGN_STYLE:** `Manual`
- **CODE_SIGN_IDENTITY:** `Apple Distribution` (matched by SHA-1 digest from the imported keychain)
- **PROVISIONING_PROFILE_SPECIFIER:** Profile UUID extracted from `.mobileprovision`

*Note: Frameworks and third-party dependencies must NOT inherit these manual profile specifiers.*

---

## 3. ExportOptions.plist Template

When exporting the signed `.xcarchive` to a distribution `.ipa`, the following plist specification is enforced:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>export</string>
    <key>manageAppVersionAndBuildNumber</key>
    <false/>
    <key>method</key>
    <string>app-store-connect</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.zovro.app</key>
        <string>${PROFILE_UUID}</string>
    </dict>
    <key>signingCertificate</key>
    <string>${SIGNING_IDENTITY_SHA1}</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>teamID</key>
    <string>${APPLE_TEAM_ID}</string>
</dict>
</plist>
```

---

## 4. Local Certificate Preparation Commands

To generate the required Base64 strings safely from local files:

```bash
# Encode .p12 certificate
base64 -i distribution.p12 | tr -d '\n' > p12_base64.txt

# Encode provisioning profile
base64 -i ZOVRO_AppStore.mobileprovision | tr -d '\n' > profile_base64.txt

# Encode App Store Connect AuthKey
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' > authkey_base64.txt
```

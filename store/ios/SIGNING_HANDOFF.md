# ZOVRO iOS signing handoff

This helper prepares the existing GitHub iOS release workflow after Apple issues the distribution certificate and App Store Connect provisioning profile.

## Required inputs

1. Apple Distribution certificate downloaded from Apple Developer as a `.cer` file.
2. The private key that generated the CSR used for that certificate.
3. An App Store Connect provisioning profile for `com.zovro.app`.
4. A password chosen for the generated PKCS#12 file.

Run on macOS:

```bash
bash scripts/prepare-ios-signing-secrets.sh \
  AppleDistribution.cer \
  ZOVRO-iOS-Distribution-private-key.pem \
  ZOVRO-AppStore.mobileprovision \
  'your-strong-p12-password'
```

The helper validates the exact application identifier, requires production APNs entitlement, creates the `.p12`, and prints the base64 values expected by the existing iOS GitHub Actions workflow.

Do not commit the private key, generated `.p12`, provisioning profile, API private key, or any passwords.

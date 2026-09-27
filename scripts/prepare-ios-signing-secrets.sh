#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <distribution.cer> <private-key.pem> <profile.mobileprovision> <p12-password>"
  exit 2
fi

CER_PATH="$1"
KEY_PATH="$2"
PROFILE_PATH="$3"
P12_PASSWORD="$4"

for f in "$CER_PATH" "$KEY_PATH" "$PROFILE_PATH"; do
  [[ -f "$f" ]] || { echo "Missing file: $f" >&2; exit 1; }
done

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

CERT_PEM="$WORK_DIR/distribution-cert.pem"
P12_PATH="$WORK_DIR/ZOVRO-Distribution.p12"
PROFILE_PLIST="$WORK_DIR/profile.plist"

openssl x509 -inform DER -in "$CER_PATH" -out "$CERT_PEM"
openssl x509 -in "$CERT_PEM" -noout -subject -issuer -fingerprint -sha256

openssl pkcs12 -export   -inkey "$KEY_PATH"   -in "$CERT_PEM"   -out "$P12_PATH"   -passout pass:"$P12_PASSWORD"   -name "ZOVRO Apple Distribution"

security cms -D -i "$PROFILE_PATH" > "$PROFILE_PLIST"
TEAM_ID=$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$PROFILE_PLIST")
APP_ID=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$PROFILE_PLIST")
APS_ENV=$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:aps-environment' "$PROFILE_PLIST" 2>/dev/null || true)

EXPECTED_APP_ID="$TEAM_ID.com.zovro.app"
[[ "$APP_ID" == "$EXPECTED_APP_ID" ]] || {
  echo "Provisioning profile application identifier mismatch: expected $EXPECTED_APP_ID, found $APP_ID" >&2
  exit 1
}
[[ "$APS_ENV" == "production" ]] || {
  echo "Provisioning profile must authorize production APNs." >&2
  exit 1
}

echo
echo "GitHub Actions secret values:"
echo "ZOVRO_APPLE_TEAM_ID=$TEAM_ID"
echo -n "ZOVRO_IOS_CERTIFICATE_P12_BASE64="
base64 < "$P12_PATH" | tr -d '\n'
echo
echo "ZOVRO_IOS_CERTIFICATE_PASSWORD=<the password you supplied>"
echo -n "ZOVRO_IOS_PROVISIONING_PROFILE_BASE64="
base64 < "$PROFILE_PATH" | tr -d '\n'
echo
echo
echo "Verified bundle identifier: com.zovro.app"
echo "Verified APNs entitlement: production"

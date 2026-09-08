# ZOVRO 1.0 — Verified Production Release Status

Date: 2026-09-08
Branch: `zovro-final-deploy`

## Verified complete

- Full GitHub QA workflow succeeded on the final production branch.
- Render production backend is live at `https://zovro-api-final.onrender.com`.
- Production launch-readiness endpoint is wired into the backend bootstrap.
- Android release candidate build succeeded from the final production branch.
- iOS release candidate build succeeded from the final production branch.

## Verified release artifacts

### Android
- Workflow run: `34221402949`
- Artifact ID: `10054063227`
- Artifact: `zovro-android-release-candidate`
- Artifact SHA-256: `a0ce3beef0521fb1792975175060cc5e8f2f375cc35648111f453e786e786d94`
- Contains:
  - `apk/debug/app-debug.apk`
  - `bundle/release/app-release.aab`
- Note: the AAB is currently unsigned and must be signed through the Google Play release process before public distribution.

### iOS
- Workflow run: `34221430346`
- Artifact ID: `10054157116`
- Artifact: `zovro-ios-release-candidate`
- Artifact SHA-256: `6fdedfe8a1d4f7425320e7fff1aaeda93ef3ed48fa60dfe14886c74b14dbf135`
- Contains:
  - `ZOVRO-iOS-Simulator-Release.zip`
- Note: this is an unsigned simulator release verification build. App Store/TestFlight distribution still requires Apple Developer signing and an archive/export for App Store Connect.

## Production launch blockers requiring owner-controlled credentials

The backend preflight currently reports these external blockers:

- `DATABASE_URL`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ONESIGNAL_REST_API_KEY`

Already present/configured:

- OneSignal App ID
- Production application secret
- Allowed origins
- PostgreSQL runtime package (`pg`)

## Final owner-controlled launch actions

1. Attach the production Postgres connection URL to the Render service.
2. Add Stripe production publishable, secret and webhook credentials directly in Render.
3. Add the OneSignal REST API key directly in Render.
4. Re-deploy and confirm launch readiness becomes true.
5. Move database mode from `mirror` to `durable` only after the production Postgres mirror proves operational.
6. Complete Google Play signing/submission.
7. Complete Apple Developer signing, TestFlight and App Store submission.
8. Publish a monitored public support contact before commercial launch.

Do not place production secrets in this repository or in chat logs.

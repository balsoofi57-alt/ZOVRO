# ZOVRO 1.0 — Store Submission Metadata

## Core app identity

- App name: ZOVRO
- Bundle / package ID: `com.zovro.app`
- Version: `1.0.0`
- Primary language: English
- Additional supported language: Spanish
- Category: Local services / marketplace

## Short description

ZOVRO connects customers with nearby service providers for home, auto, roadside and urgent local services.

## Full description

ZOVRO is an on-demand local services marketplace that helps customers find nearby providers for roadside assistance, mobile auto repair, HVAC, plumbing, electrical, appliance repair, roofing, painting, flooring, lawn care, snow removal, cleanup, moving and other local service needs.

Customers can describe what they need, use Smart Match to identify the likely service, find suitable nearby providers, send requests, message providers, track job progress and manage their service history. Urgent requests can be routed quickly to available providers, while non-urgent work can support scheduled service and quote-based workflows.

Provider verification labels such as Identity Verified, Licensed and Insured are intended to appear only when the corresponding status has actually been verified.

ZOVRO does not replace police, fire, ambulance or other emergency services. Users in immediate danger should call 911.

## Suggested keywords

local services, roadside assistance, mobile mechanic, plumber, electrician, HVAC, home repair, service provider, urgent help

## Privacy and safety URLs

- Privacy Policy: publish the existing `privacy.html` page at the production public site and use its final public HTTPS URL.
- Terms of Service: publish the existing `terms.html` page at the production public site and use its final public HTTPS URL.
- Support: publish the existing `support.html` page at the production public site and add a monitored public support contact before submission.

## Google Play release state

- Android debug APK: built successfully from final production branch.
- Android release AAB: built successfully from final production branch.
- Signing: not yet completed.
- Required next external step: Google Play Console signing / upload using the owner-controlled developer account.

## Apple release state

- iOS simulator Release build: built successfully from final production branch.
- Signing: not yet completed.
- Required next external step: Apple Developer signing, App Store archive/export, TestFlight upload and App Store Connect submission using the owner-controlled developer account.

## Store review notes

ZOVRO is a two-sided marketplace connecting customers and independent service providers. Users may request local services, communicate about jobs and manage service progress. Some service categories may require licenses, permits or insurance depending on the jurisdiction. ZOVRO's verification indicators should not be interpreted as replacing government licensing requirements.

Payments and real-time push notification functionality must not be presented as production-active until the corresponding production credentials are configured and verified.

## Required owner-provided fields before submission

- Public support email or support contact
- Apple Developer / App Store Connect account and signing credentials
- Google Play Console account and signing setup
- Final privacy-policy public URL
- Final terms public URL
- Final support public URL
- Production Stripe credentials
- Production OneSignal REST API key
- Render production `DATABASE_URL`
- Any jurisdiction-specific legal text requested by counsel or store review

Do not commit passwords, certificates, private keys, Stripe secret keys, database passwords or OneSignal REST keys to GitHub.

# ZOVRO

ZOVRO is an on-demand local-services marketplace for customers and service providers, with priority support for roadside assistance, mobile auto service, home trades, moving, and urgent requests.

## Production services

- Web app: https://zovro-web.onrender.com
- API: https://zovro-api.onrender.com
- API health: `/api/health`
- API readiness: `/api/ready`

## Current production capabilities

- Customer and provider account registration/login
- Authenticated sessions and password security
- Customer service requests and urgent/SOS dispatch
- Provider availability and GPS location updates
- Nearby-provider search and ETA estimates
- First-provider acceptance and job assignment
- Job lifecycle: Accepted → On the way → Arrived → In progress → Completed
- Cancellation rules and audit events
- Customer/provider messaging
- Notifications
- Provider ratings, reputation and verification workflow
- Account deletion
- Production security headers, rate limiting and operational metrics
- Responsive web client connected to the live API

## Release state

Version: **1.0.0 / FINAL**

The final production-connected package passes the local release, store-readiness, production, security, operations, account-security, UI-security, dispatch, lifecycle, cancellation, reputation, deployment, final, Render-blueprint, and end-to-end smoke checks.

## External launch gates

Before treating the platform as a full public commercial launch, complete persistent production database storage, final Apple/Google signing and store submission, production payments, true push-notification credentials, production maps/routing, and final legal/support contact review.

Do not commit production secrets to this repository.

# ZOVRO 1.0 Production Deployment

ZOVRO 1.0 runs with a public web client and a Node.js API.

## Required production environment

- `NODE_ENV=production`
- `ZOVRO_SECRET=<random secret, at least 32 characters>`
- `ZOVRO_OPS_TOKEN=<random operations token, at least 24 characters>`
- `ZOVRO_ALLOWED_ORIGINS=<comma-separated allowed origins>`
- `ZOVRO_APP_VERSION=1.0.0`

## Readiness

- `/api/health`
- `/api/ready`

## Data persistence

The current API stores production data in SQLite. Before public commercial launch, the database must be stored on persistent infrastructure and backed up regularly. Do not horizontally scale a SQLite deployment across multiple instances.

## Mobile packaging

The repository contains the Capacitor packaging configuration used by the verified release artifact. Final iOS and Android signing requires the owner's Apple and Google developer credentials and therefore remains an external release step.

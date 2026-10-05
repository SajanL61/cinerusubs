# Clothing Store

A separate, same-origin React/Vite SSR and Express/MongoDB clothing-commerce application. Prices are stored as integer cents (LKR 3,500.00 is `350000`). The seeded catalogue is explicitly development-only.

## Status

This is a working development baseline, **not approved for public production launch**. See [docs/PROGRESS.md](docs/PROGRESS.md) and [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md). Missing owner identity, policy approval, persistent image credentials, delivery configuration, verified backups, email transport, and payment sandbox verification are intentional launch blockers.

## Windows / VS Code setup

1. Install Node.js 22 LTS or newer, Git, and MongoDB locally. MongoDB transactions require a replica set; Atlas is the simplest supported choice. Create a database user restricted to `clothing_store` with `readWrite` on that database only.
2. Open `C:\Fashion_Store` in VS Code. Copy `.env.example` to `.env` and replace both secrets with independent random values of at least 32 characters. Set the Atlas `MONGODB_URI` (include retry writes) and keep the database name `clothing_store`.
3. In PowerShell use `npm.cmd` if script execution blocks `npm.ps1`:

```powershell
npm.cmd ci
npm.cmd run seed
$env:OWNER_NAME='Owner Name'
$env:OWNER_EMAIL='owner@example.com'
$env:OWNER_PASSWORD='a unique password of 12+ characters'
npm.cmd run create-owner
Remove-Item Env:OWNER_PASSWORD
npm.cmd run dev
```

Open `http://localhost:4001`; admin is at `/admin`. Vite runs as middleware in the same process, so port 5173 is not exposed by the normal development command.

## Commands

| Task | Command |
|---|---|
| Development | `npm run dev` |
| Ephemeral browser demo (no MongoDB install) | `npm run dev:demo` |
| Production build | `npm run build` |
| Production web | `npm start` |
| Expiry/notification worker | `npm run worker` / `npm run worker:prod` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit/integration tests | `npm test` |
| Browser tests | `npm run test:e2e` |
| Demo admin browser smoke | `node tests/admin-browser-smoke.mjs "<temporary-demo-password>"` |
| Admin responsive layout smoke | `node tests/admin-layout-smoke.mjs "<temporary-demo-password>"` |
| Content/UI browser smoke | `node tests/content-browser-smoke.mjs "<temporary-demo-password>"` |
| Idempotent demo seed | `npm run seed` |
| One-time owner setup | `npm run create-owner` |

Demo seeding refuses to run with `NODE_ENV=production` and uses upserts that do not overwrite existing catalogue records.

## Architecture and operations

- Express serves `/api`, static assets and server-rendered public HTML from one origin on port 4001. Admin is client-interactive but rendered with a no-index shell.
- The browser never talks to MongoDB. Public API projections omit cost, private notes, tracking hashes and customer records.
- Checkout recalculates current variant prices and stock in a MongoDB transaction. Conditional updates prevent overselling; a unique idempotency key prevents duplicate orders.
- `onHand` includes reserved sellable units. `available = onHand - reserved`. Dispatch decrements both; pre-dispatch cancellation decrements only reserved. Every movement has an operation key so repeated actions are harmless.
- Run exactly one or more persistent worker services. Expiry candidates are durable order records and stock operations are transaction/idempotency guarded. Do not use a sleeping/free web service for live orders.
- Product image URLs are supported, but authenticated Cloudinary/object-storage upload is not implemented yet. This is a launch blocker, not a fake local upload.
- The eight footer information pages are edited at `/admin/content`. Starter copy is deliberately conservative: replace the brand story and obtain suitable legal/privacy review before publishing a real store.

## Render deployment

`render.yaml` defines a paid always-on web service and worker. Connect the repository, set all `sync: false` values, use an Atlas production cluster that supports transactions, then run owner creation once through a secure shell. No infrastructure is provisioned automatically. The web health check is `/health`; nested storefront URLs are handled by the SSR catch-all.

## Backups and restore

Use Atlas scheduled snapshots/PITR available on the selected paid plan. Before launch, restore the newest snapshot into a separate non-production cluster, point a temporary `.env` at it, run `npm test`, verify order/inventory counts and manually validate a tracked order. Record the restore date, duration and reviewer. Never test restoration over production.

For a manual encrypted export where appropriate to the plan:

```powershell
mongodump --uri "$env:MONGODB_URI" --db clothing_store --archive=clothing-store.archive --gzip
mongorestore --uri "$env:RESTORE_MONGODB_URI" --archive=clothing-store.archive --gzip --nsInclude="clothing_store.*"
```

Keep archives encrypted with restricted access and a documented retention schedule.

## Monitoring

Capture process errors and structured logs in the hosting provider. Alert on worker exits, repeated `Reservation expiry failed`, HTTP 5xx/checkout error rates, pending notification age and payment exception records. Logs intentionally exclude request bodies, passwords, cookies and tracking credentials.

## Recovery

There is no default password. If the only owner loses access, stop public admin access, verify the owner out-of-band, create a replacement owner using the one-time CLI, sign in and deactivate the inaccessible account. Audit the recovery and rotate session secrets if compromise is suspected (this invalidates sessions).

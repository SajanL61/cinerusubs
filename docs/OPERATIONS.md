# CineruSubs operations

## Database isolation

Use a dedicated MongoDB database named exactly `cinerusubs`. The application validates `MONGODB_DB=cinerusubs` and passes that database name explicitly to Mongoose. Do not point the migrated application at the former commerce database.

## First deployment

1. Copy `.env.example` into the deployment secret store and replace every placeholder.
2. Provision private `cinerusubs-media` and `cinerusubs-assets` Cloudflare R2 buckets and their CORS policy before enabling uploads.
3. Run `npm run seed` once to create the editorial starter catalog. Seed subtitle records are drafts until their real files are uploaded.
4. Set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and a unique 16+ character `SUPER_ADMIN_PASSWORD`, then run `npm run create-super-admin`.
5. Remove `SUPER_ADMIN_PASSWORD` from the environment immediately after provisioning.
6. Run `npm run build`, start the service, and verify `/api/health` before directing traffic.

## Security invariants

- The branded `/download/[mediaId]` page never receives an R2 key. It requests a short-lived token from `/api/download/[mediaVersionId]`; the application gateway or Worker validates that token before serving bytes.
- Both the title and media version must have distributable rights and an active media version.
- Session cookies contain only an opaque random token; its HMAC hash is stored in MongoDB.
- Every state-changing authenticated API requires a same-origin request and CSRF token.
- Administrative mutations require permissions at the API/data boundary and create audit entries.
- R2 credentials, MongoDB credentials, session secrets, and provider tokens are server-only.

## Cloudflare configuration

- Create private R2 buckets named `cinerusubs-media` and `cinerusubs-assets`. Scope the application API token to object read/write for only these buckets. Media, subtitles, and HLS objects belong in the media bucket; posters, backdrops, avatars, and other presentation assets belong in the assets bucket.
- Permit browser `PUT` requests only from exact production and authorized preview origins. Allow `GET`, `HEAD`, and `PUT`; expose `ETag`; and do not use `*` origins with credentials. Multipart completion depends on each part ETag.
- Map `assets.cinerusubs.com` only to intentionally public artwork. Do not expose `cinerusubs-media` through an R2 public-development URL.
- The deployable Worker is in `cloudflare/download-worker`. Copy `wrangler.toml.example` to `wrangler.toml`, set `DOWNLOAD_SIGNING_SECRET` with `wrangler secret put`, and deploy. Enable `DOWNLOAD_WORKER_ENABLED=true` only after an invalid token returns `403` and a real range request returns `206` with `Accept-Ranges: bytes`.
- The application checks title/version rights, active/deletion state, object scope, and rate limits before issuing a 90-second encrypted and signed token. The built-in gateway repeats live checks. The Worker verifies signature, expiry, and bucket/key scope; the short lifetime limits the window after a rights change.
- Proxy `www.cinerusubs.com` through Cloudflare, enforce HTTPS, enable managed WAF rules, and add rate-limit rules for `/api/auth/*`, `/api/search/*`, `/api/subtitles/*/download`, `/download/*`, `/api/contact`, and `/api/takedown`.
- Configure Turnstile keys before enabling challenges on public abuse-prone forms. The secret must remain server-only.

## MongoDB and indexes

Use an Atlas user with `readWrite` access only to `cinerusubs`; never grant this application a cluster-wide role or any role on `SmartReact`. The application checks both the configured name and the live server-reported database name, fails closed unless it is exactly `cinerusubs`, and explicitly rejects `SmartReact`. See [SmartReact protection](SMARTREACT_PROTECTION.md) for the Atlas role and proof procedure.

The seed process calls `ensureCineruIndexes`; production Mongoose automatic index creation is intentionally disabled. Important compound indexes cover publication/trending discovery, genre/language/year filters, season and episode uniqueness, subtitle lookup, active media versions and mirrors, comments, ratings, viewing progress, downloads, searches, sessions, and rate-limit expiry.

Enable scheduled Atlas backups/PITR. Test restores into a separate non-production cluster and verify counts, representative titles, accounts, media metadata, and audit records before documenting the restore as successful.

## Deployment verification

Run these checks against the exact commit being deployed:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

After deployment, verify `/api/health`, account registration/login/logout, admin permission boundaries, one small asset upload, one multipart media upload, a real subtitle download, direct and mirror download flows, a `Range: bytes=0-1023` response, and denial after changing rights to `subtitle_only`. Confirm CSP/HSTS headers, no-store headers, robots directives, sitemap output, service-worker installation, and mobile navigation.

The repository can verify code, demo mode, and local browser behavior without production secrets. Atlas role isolation, bucket existence/CORS, custom-domain routing, and real byte delivery must be verified in the production accounts; do not report these external checks as passed until their commands and timestamps are recorded.

## Administrator recovery

There is no default administrator password. If all super-admin access is lost, verify the operator out-of-band, provision a replacement with `npm run create-super-admin`, remove the password environment variable, review the audit log, and rotate `SESSION_SECRET` if compromise is suspected. Rotating that secret invalidates existing authentication tokens.

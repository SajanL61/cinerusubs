# CineruSubs operations

## Database isolation

Use a dedicated MongoDB database named exactly `cinerusubs`. The application validates `MONGODB_DB=cinerusubs` and passes that database name explicitly to Mongoose. Do not point the migrated application at the former commerce database.

## First deployment

1. Copy `.env.example` into the deployment secret store and replace every placeholder.
2. Provision the private Cloudflare R2 bucket and CORS policy before enabling uploads.
3. Run `npm run seed` once to create the editorial starter catalog. Seed subtitle records are drafts until their real files are uploaded.
4. Set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and a unique 16+ character `SUPER_ADMIN_PASSWORD`, then run `npm run create-super-admin`.
5. Remove `SUPER_ADMIN_PASSWORD` from the environment immediately after provisioning.
6. Run `npm run build`, start the service, and verify `/api/health` before directing traffic.

## Security invariants

- Full media is served only through the checked `/download/[mediaId]` route.
- Both the title and media version must have distributable rights and an active media version.
- Session cookies contain only an opaque random token; its HMAC hash is stored in MongoDB.
- Every state-changing authenticated API requires a same-origin request and CSRF token.
- Administrative mutations require permissions at the API/data boundary and create audit entries.
- R2 credentials, MongoDB credentials, session secrets, and provider tokens are server-only.

## Cloudflare configuration

- Create a private R2 bucket named `cinerusubs` and an API token limited to object read/write for that bucket.
- Permit browser `PUT` requests only from the production site origin. Allow the content types used by poster, backdrop, avatar, subtitle, and authorized-media uploads; expose the `ETag` response header for multipart completion, and do not use `*` origins with credentials.
- Map `assets.cinerusubs.com` only to artwork intentionally made public. Keep subtitle and media objects private.
- Map `dl.cinerusubs.com` to a Worker only if the Worker validates the application HMAC/token, expiry, object scope, rights state, and rate limit before returning an object. The built-in application routes already issue short-lived R2 signatures.
- Proxy `www.cinerusubs.com` through Cloudflare, enforce HTTPS, enable managed WAF rules, and add rate-limit rules for `/api/auth/*`, `/api/search/*`, `/api/subtitles/*/download`, `/download/*`, `/api/contact`, and `/api/takedown`.
- Configure Turnstile keys before enabling challenges on public abuse-prone forms. The secret must remain server-only.

## MongoDB and indexes

Use an Atlas user with `readWrite` access only to `cinerusubs`. The seed process calls `ensureCineruIndexes`; production Mongoose automatic index creation is intentionally disabled. Important compound indexes cover publication/trending discovery, genre/language/year filters, season and episode uniqueness, subtitle lookup, active media versions, comments, ratings, viewing progress, downloads, searches, sessions, and rate-limit expiry.

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

After deployment, verify `/api/health`, account registration/login/logout, admin permission boundaries, one small direct R2 upload, a real subtitle download, an authorized media request, and denial of the same request after changing rights to `subtitle_only`. Confirm CSP/HSTS headers, robots directives, sitemap output, service-worker installation, and mobile navigation.

## Administrator recovery

There is no default administrator password. If all super-admin access is lost, verify the operator out-of-band, provision a replacement with `npm run create-super-admin`, remove the password environment variable, review the audit log, and rotate `SESSION_SECRET` if compromise is suspected. Rotating that secret invalidates existing authentication tokens.

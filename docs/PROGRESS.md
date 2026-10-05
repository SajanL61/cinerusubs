# Development progress

## Implemented

- Same-origin Vite React SSR + Express foundation; product HTML has real title, description, canonical and social metadata.
- MongoDB models/indexes for catalogue, SKU inventory, orders, reservations, users/sessions, payments, returns, coupons, settings/content, enquiries, jobs, notifications and audits.
- Published-product search, category/size/colour/availability/sale filters, sorting and URL pagination.
- Responsive editorial storefront, variant selection, persistent cart/wishlist, guest checkout, private tracking credential and WhatsApp continuation.
- Server-repriced idempotent checkout with atomic all-or-nothing reservations and integer money.
- Owner CLI, Argon2id passwords, opaque HttpOnly sessions, CSRF, login throttling and server permissions.
- Data-backed admin command centre with Colombo-day order counts, verified-receipt trends, outstanding COD, fulfilment/return queues, threshold-aware stock health, top sellers and recent orders.
- Full SKU operations table with search/status/sort/pagination, on-hand/reserved/available/damaged balances, receiving, physical counts, damage recording, price/cost/threshold controls, active-reservation reconciliation, movement audit drawer and protected CSV export.
- Financial transaction ledger separating placed value, paid order value, verified receipts and outstanding COD, plus permission-guarded bank-transfer verification and COD collection with references and audit events.
- Guarded order confirm/pack/dispatch/deliver/cancel actions and responsive desktop/mobile admin navigation.
- Durable restart-safe reservation expiry worker; exact inventory movement audit and optimistic stock editing.
- Editable setting/content data models, draft policy behavior, sitemap, robots and no-index/no-store for private areas.
- Eight complete starter information pages, a working rate-limited enquiry form, safe structured-text rendering, a responsive full footer and a permission-guarded admin content editor with draft/publish state, preview and audit events.

## Tested locally

See the final delivery report for commands executed in this workspace. Unit coverage includes required inventory arithmetic and sale windows. The development replica-set browser smoke journeys verify login, dashboard, 60-SKU inventory, receiving, pricing, movement history, guest checkout, reservation visibility, COD receipt recording, transaction reporting, all eight information pages, enquiry submission, content publishing, responsive overflow and mobile admin navigation.

## Externally blocked / owner configuration

- Real store name/logo/contact/WhatsApp/social identity and reviewed homepage content.
- Atlas production database user/network controls and verified restore.
- Persistent authenticated image provider and upload UI.
- Real delivery zones/fees/estimates and owner-reviewed bank instructions.
- SMTP/provider credentials and delivery-domain verification.
- Optional PayHere credentials, server callback implementation and sandbox sign-off.

## Remaining before the complete brief is accepted

- Full product editor/image upload/reorder/duplicate/archive UI, category/collection editor and previewed CSV inventory import (filtered CSV export is implemented).
- Coupon, delivery-zone, team/permission and settings admin editors.
- Manual orders and invoice/packing documents.
- Full returns/exchanges/refund service and UI, including damaged-goods movements.
- Reports/CSV hardening, sales trends and best-seller aggregation from eligible orders.
- Durable email retry sender and visible live-connection fallback state.
- Comprehensive Mongo transaction/API integration tests and Playwright desktop/mobile/keyboard/200% journeys.
- PayHere integration (must remain disabled until credentials and sandbox tests exist).

Do not label the application production-ready until these remaining items and the launch checklist are complete.

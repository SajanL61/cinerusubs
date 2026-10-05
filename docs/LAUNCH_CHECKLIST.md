# Launch checklist

- [ ] Replace the development brand and all sample products; owner approves every public page.
- [ ] Configure and validate international digits-only WhatsApp number.
- [ ] Configure service zones, fees, COD rules, estimates, returns and reservation policy.
- [ ] Configure persistent authenticated image storage and verify images after redeployment.
- [ ] Use independent high-entropy session/tracking secrets and HTTPS-only production cookies.
- [ ] Restrict Atlas user/network access; confirm transactions and indexes on the target cluster.
- [ ] Run build, typecheck, lint, unit/API tests and all Playwright journeys in release CI.
- [ ] Complete two-customer final-unit and multi-line rollback concurrency tests.
- [ ] Complete authorization, CSRF, rate-limit, upload, formula-injection and dependency audit tests.
- [ ] Verify paid/confirmed/packing orders are not expired; test restart recovery.
- [ ] Restore the latest backup into non-production and document results.
- [ ] Configure monitoring/alerts and verify the always-on web and worker service.
- [ ] Configure/test SMTP; ensure failures remain queued and do not lose orders.
- [ ] Keep PayHere disabled unless callback/replay/out-of-order tests pass in sandbox.
- [ ] Test desktop/mobile, keyboard-only, screen reader basics and 200% zoom.
- [ ] Owner completes a real end-to-end low-value test order and reconciles stock/payment/report output.

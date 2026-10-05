# Admin operating guide

Create the first owner only with the CLI documented in the README. Never share accounts.

- **Products:** demo products are visibly named. Publishing makes a product discoverable; drafts do not appear publicly.
- **Inventory:** search and filter SKUs, review on-hand/reserved/available/damaged balances, receive stock, apply a verified physical count, record damage, edit permitted prices and thresholds, and open the audit drawer for movements plus active reservation reconciliation. Every adjustment requires a reason and version check. If a physical count would undercut reservations, resolve the affected orders first.
- **Orders:** confirm does not deduct stock a second time. Dispatch reduces both on-hand and reserved exactly once. Cancel before dispatch releases the reservation without increasing on-hand.
- **Transactions:** placed order value, paid order value, verified receipts, and outstanding COD are deliberately separate. They must not be interpreted as the same metric.
- **Bank transfers and COD:** in Transactions, use **Verify transfer** or **Record COD** only after independently confirming receipt. A reference is mandatory, the action creates an audited payment record, and financial permissions are enforced on the server. An uploaded proof or customer claim alone is not receipt.
- **Returns:** do not add stock when a request is opened. Inspect received goods and restock only the quantity approved sellable (the full workflow remains a launch-blocking item).
- **Website content:** use **Website content** in the admin navigation to edit the eight footer pages, preview the safe plain-text formatting, save a draft, or publish changes. `##` creates a heading, `###` creates a smaller heading, `-` creates list items, and `>` creates an important note. Publishing is immediate. Starter policy text is not legal advice; obtain appropriate Sri Lankan legal/privacy review and replace all owner-review notes before launch.

If an action reports an edit conflict, refresh and review the newest stock/order state rather than repeating blindly.

For the ephemeral demo, the launch command prints a temporary owner password. With the demo still running, the Windows browser smoke journey can be repeated with:

```powershell
node tests/admin-browser-smoke.mjs "<temporary-demo-password>"
node tests/admin-layout-smoke.mjs "<temporary-demo-password>"
node tests/content-browser-smoke.mjs "<temporary-demo-password>"
```

The admin smoke creates development-only inventory, pricing, order, reservation, and payment records in the in-memory database. The layout smoke checks every implemented admin route at desktop, compact and mobile widths, including multi-variant containment. The content smoke verifies all eight pages, the enquiry form, responsive layout, and the draft/publish editor; it restores its temporary copy change before finishing.

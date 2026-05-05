# tasks/integrations/INTEGRATION‑ACCOUNTING.md – QuickBooks & Xero Sync

This file covers bidirectional general‑ledger synchronization between Apex and the two dominant cloud accounting platforms: QuickBooks Online and Xero. Both integrations implement a common `AccountingPort` interface so that the Finance domain never imports provider‑specific types. OAuth 2.0 tokens are encrypted at rest, and all sync operations are idempotent. These tasks are part of Phase 7 and require provider sandbox credentials provisioned by a human operator.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑QB‑001: QuickBooks Online Full Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No QuickBooks integration exists. The finance module uses mock data only. The QBO v3 REST API uses OAuth 2.0 with PKCE, 60‑minute access tokens, 100‑day rolling refresh tokens, and 500 requests per minute per realmId.
**Size:** Large

**Description:** Implement a full bidirectional sync between Apex and QuickBooks Online (QBO) covering vendors, bills, invoices, and customer payments, using the QBO v3 REST API with OAuth 2.0 PKCE and a conflict‑resolution strategy.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑AP‑008`, `finance/FINANCE‑MULTI‑ENTITY.md → API‑AR‑008`
**Blocks:** `integrations/INTEGRATION‑ACCOUNTING.md → INT‑XERO‑001`
**Related Files:** `integrations/quickbooks/oauth.ts`, `vendor‑sync.ts`, `bill‑sync.ts`, `invoice‑sync.ts`, `payment‑sync.ts`, `lib/integrations/quickbooks‑sync/index.ts`

**Definition of Done**
- [ ] QuickBooks OAuth 2.0 PKCE flow completes and stores tokens securely (encrypted at rest)
- [ ] `pushVendorToQB(vendorId)` creates or updates a vendor in QBO; idempotent on re‑run
- [ ] `pushBillToQB(billId)` creates a bill in QBO Accounts Payable with correct line items
- [ ] `pushInvoiceToQB(invoiceId)` creates an invoice in QBO Accounts Receivable
- [ ] `pullPaymentsFromQB()` syncs customer payments from QBO and applies them to AR invoices
- [ ] Bidirectional sync uses last‑write‑wins with configurable override to “Apex‑wins” or “QBO‑wins”
- [ ] Sync status dashboard shows last sync time, pending item count, and error list
- [ ] Rate limit handling respects QBO’s 500 req/min limit with exponential backoff
- [ ] All QBO credentials stored via environment variables; none hardcoded
- [ ] Unit tests pass for all sync functions using QBO sandbox environment
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- QuickBooks Desktop (separate SDK and auth model)
- QuickBooks Payroll and Time integrations
- Real‑time event streaming (QBO does not support webhooks for all entity types)
- Multi‑company QBO accounts (single company per Apex org in this phase)

**Rules to Follow**
- Use `intuit‑oauth` v4+ (Node.js OAuth 2.0 client maintained by Intuit); do not hand‑roll OAuth
- Pin QBO API version header to `v3`
- Token refresh: proactively refresh when `expires_in` < 60 s; never let a call fail due to expired token
- Conflict resolution default: last‑write‑wins; record `lastModifiedBy: "apex" | "qbo"` on each synced entity
- Map QBO `Customer` → Apex `Contact`; QBO `Vendor` → Apex `Vendor`; QBO `Bill` → Apex `Bill`; QBO `Invoice` → Apex `Invoice`

**Verification**
```bash
pnpm vitest run -- integrations/quickbooks/oauth.test.ts
pnpm vitest run -- integrations/quickbooks/vendor‑sync.test.ts
pnpm vitest run -- integrations/quickbooks/bill‑sync.test.ts
pnpm vitest run -- integrations/quickbooks/invoice‑sync.test.ts
pnpm vitest run -- integrations/quickbooks/payment‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: QuickBooks is an external system within the Finance bounded context. `QuickBooksAdapter` is an anti‑corruption layer translating QBO domain concepts into Apex domain objects without polluting the core domain.
- TDD: Write failing tests for each sync function against QBO sandbox before implementation. Use recorded fixtures (cassettes) to keep tests deterministic and fast.
- BDD: “Given a bill is approved in Apex, When the sync job runs, Then the bill appears in QBO AP with matching amount and vendor.”
- Deep Module: `QBSyncService` is a deep module – complex internal orchestration (token refresh, conflict detection, retry) behind a narrow public interface: `sync(entityType, direction)`.

---

### Subtasks
- [ ] INT‑QB‑001.0.25 (AGENT): Read the entire task, all related files, and the QBO v3 API reference. *No action – pause.*
- [ ] INT‑QB‑001.0.5 (AGENT): Research QBO v3 API rate limits, OAuth 2.0 PKCE flow with `intuit‑oauth` v4, and conflict‑resolution patterns. *Document findings briefly.*
- [ ] INT‑QB‑001.1 (AGENT): Implement QBO OAuth 2.0 PKCE flow and encrypted token store.
  **File(s):** `integrations/quickbooks/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑QB‑001.2 (AGENT): Implement vendor sync (`pushVendorToQB`, `pullVendorsFromQB`) with upsert and conflict resolution.
  **File(s):** `integrations/quickbooks/vendor‑sync.ts`
  **Verification:** `pnpm vitest run -- vendor‑sync.test.ts`
- [ ] INT‑QB‑001.3 (AGENT): Implement bill sync (`pushBillToQB`) with line‑item mapping and idempotency.
  **File(s):** `integrations/quickbooks/bill‑sync.ts`
  **Verification:** `pnpm vitest run -- bill‑sync.test.ts`
- [ ] INT‑QB‑001.4 (AGENT): Implement invoice sync (`pushInvoiceToQB`) with AR line‑item mapping.
  **File(s):** `integrations/quickbooks/invoice‑sync.ts`
  **Verification:** `pnpm vitest run -- invoice‑sync.test.ts`
- [ ] INT‑QB‑001.5 (AGENT): Implement payment pull (`pullPaymentsFromQB`) with automatic AR application.
  **File(s):** `integrations/quickbooks/payment‑sync.ts`
  **Verification:** `pnpm vitest run -- payment‑sync.test.ts`
- [ ] INT‑QB‑001.6 (AGENT): Build sync status dashboard component showing last sync time, pending counts, and errors.
  **File(s):** `integrations/quickbooks/sync‑dashboard.ts`, `artifacts/apex‑os/src/components/integrations/QBSyncDashboard.tsx`
  **Verification:** Component renders in Storybook/dev server with mock sync state.
- [ ] INT‑QB‑001.7 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑QB‑001.N (HUMAN): Final review – verify OAuth flow end‑to‑end in QBO sandbox, spot‑check a bill push, and approve. **Verification:** Approved.

---

## [ ] INT‑XERO‑001: Xero Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Xero integration exists. The `QuickBooksAdapter` patterns from INT‑QB‑001 are available as a reference template. The Xero Accounting API v2.0 uses OAuth 2.0 with tenant‑specific access, per‑org rate limits of 60 req/min, and the `xero‑node` v8+ SDK.
**Size:** Large

**Description:** Implement bidirectional sync between Apex and Xero covering contacts (vendors + customers), bills, invoices, payments, and chart‑of‑accounts mapping, using the Xero Accounting API v2.0 with OAuth 2.0 and multi‑tenant support.

**Depends on:** `integrations/INTEGRATION‑ACCOUNTING.md → INT‑QB‑001`, `finance/FINANCE‑BILLS‑APPROVALS.md → API‑AP‑008`, `finance/FINANCE‑MULTI‑ENTITY.md → API‑AR‑008`
**Blocks:** [N/A]
**Related Files:** `integrations/xero/oauth.ts`, `tenant‑manager.ts`, `contact‑sync.ts`, `bill‑sync.ts`, `invoice‑sync.ts`, `payment‑sync.ts`, `accounts‑mapping.ts`, `lib/integrations/xero‑sync/index.ts`

**Definition of Done**
- [ ] Xero OAuth 2.0 flow completes; tenant selection UI allows choosing the correct Xero organisation
- [ ] Vendor/customer sync maps Apex `Vendor` → Xero `Contact` (type Supplier) and Apex `Contact` → Xero `Contact` (type Customer)
- [ ] `pushBillToXero(billId)` creates an `ACCPAY` invoice in Xero; `pushInvoiceToXero(invoiceId)` creates an `ACCREC` invoice
- [ ] `pullPaymentsFromXero()` fetches payments and applies them to Apex AR records
- [ ] Xero chart‑of‑accounts mapping allows admin to link Apex account codes to Xero account codes
- [ ] API calls respect Xero’s 60 req/min per Xero org limit with per‑tenant rate limiting
- [ ] Multi‑tenant: each Apex organisation maps to exactly one Xero `tenantId`; stored encrypted
- [ ] All sync functions are idempotent using `ExternalLinkId` or `InvoiceNumber` deduplication
- [ ] Unit tests pass for all sync functions using Xero demo company
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Xero Payroll API
- Xero Projects API
- Xero Inventory tracking
- Xero Practice Manager

**Rules to Follow**
- Use `xero‑node` v8+ SDK; do not use the deprecated `xero‑accounting` package
- Xero API version: always send `Xero‑API‑Version: 2.0` header
- Tenant management: always retrieve and validate `tenantId` before making entity‑level API calls
- Chart‑of‑accounts mapping: stored in DB table `xero_account_mappings(apexCode, xeroAccountCode, tenantId)`

**Verification**
```bash
pnpm vitest run -- integrations/xero/oauth.test.ts
pnpm vitest run -- integrations/xero/tenant‑manager.test.ts
pnpm vitest run -- integrations/xero/contact‑sync.test.ts
pnpm vitest run -- integrations/xero/bill‑sync.test.ts
pnpm vitest run -- integrations/xero/invoice‑sync.test.ts
pnpm vitest run -- integrations/xero/payment‑sync.test.ts
pnpm vitest run -- integrations/xero/accounts‑mapping.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Xero is a secondary external system in the Finance bounded context. `XeroAdapter` implements `AccountingPort`; both `QuickBooksAdapter` and `XeroAdapter` conform to the same port, keeping the domain model free of provider‑specific types.
- TDD: Record Xero API responses as fixtures using `nock` or VCR‑style cassettes. Write tests against fixtures before implementing real calls.
- BDD: “Given a Xero organisation is connected and an invoice exists in Apex, When the agent calls `pushInvoiceToXero`, Then an `ACCREC` invoice appears in the Xero demo company with matching line items and due date.”
- Deep Module: `XeroSyncService` encapsulates the complexity of tenant resolution, rate limiting, and conflict detection behind a simple `sync(direction)` API.

---

### Subtasks
- [ ] INT‑XERO‑001.0.25 (AGENT): Read the entire task, INT‑QB‑001 patterns, and the Xero Accounting API v2.0 reference. *No action – pause.*
- [ ] INT‑XERO‑001.0.5 (AGENT): Research `xero‑node` v8+ SDK changes, Xero tenant management patterns, and chart‑of‑accounts mapping best practices. *Document findings briefly.*
- [ ] INT‑XERO‑001.1 (AGENT): Implement Xero OAuth 2.0 flow with encrypted token and tenant storage.
  **File(s):** `integrations/xero/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑XERO‑001.2 (AGENT): Implement tenant manager with per‑user tenant resolution and caching.
  **File(s):** `integrations/xero/tenant‑manager.ts`
  **Verification:** `pnpm vitest run -- tenant‑manager.test.ts`
- [ ] INT‑XERO‑001.3 (AGENT): Implement contact sync (vendor → Supplier, customer → Customer).
  **File(s):** `integrations/xero/contact‑sync.ts`
  **Verification:** `pnpm vitest run -- contact‑sync.test.ts`
- [ ] INT‑XERO‑001.4 (AGENT): Implement bill sync (`ACCPAY`) and invoice sync (`ACCREC`).
  **File(s):** `integrations/xero/bill‑sync.ts`, `integrations/xero/invoice‑sync.ts`
  **Verification:** `pnpm vitest run -- bill‑sync.test.ts invoice‑sync.test.ts`
- [ ] INT‑XERO‑001.5 (AGENT): Implement payment sync and AR application.
  **File(s):** `integrations/xero/payment‑sync.ts`
  **Verification:** `pnpm vitest run -- payment‑sync.test.ts`
- [ ] INT‑XERO‑001.6 (AGENT): Implement chart‑of‑accounts mapping with admin settings UI.
  **File(s):** `integrations/xero/accounts‑mapping.ts`, `artifacts/apex‑os/src/pages/settings/XeroAccountMapping.tsx`
  **Verification:** `pnpm vitest run -- accounts‑mapping.test.ts`
- [ ] INT‑XERO‑001.7 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑XERO‑001.N (HUMAN): Final review – verify OAuth flow and a bill push in Xero demo company, approve. **Verification:** Approved.

---
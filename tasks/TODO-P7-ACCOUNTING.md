# TODO-P7-ACCOUNTING.md – Phase 7 Accounting Software Integrations

This document contains accounting software integration tasks for QuickBooks Online and Xero. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Accounting Integration Task Index

- [ ] INT‑QB‑001 – QuickBooks Online Full Integration
- [ ] INT‑XERO‑001 – Xero Integration

---

## [ ] INT‑QB‑001: QuickBooks Online Full Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No QuickBooks integration exists. The finance module uses mock data only. As of May 2026, the QuickBooks Online API v3 uses OAuth 2.0 with PKCE, 60‑minute access tokens, 100‑day rolling refresh tokens, and 500 requests per minute per realmId. Every writable entity uses `SyncToken` for optimistic concurrency control. The recommended Node.js library is `intuit-oauth` (v4+).
**Size:** Large

**Description:** Implement a full bidirectional sync between Apex and QuickBooks Online (QBO) covering vendors, bills, invoices, and customer payments, using the QBO v3 REST API with OAuth 2.0 PKCE and a conflict‑resolution strategy.

**Depends on:** INT‑QB‑001 (stub) – initial OAuth scaffolding, API‑AP‑008 (Accounts Payable API), API‑AR‑008 (Accounts Receivable API)
**Blocks:** INT‑XERO‑001 (patterns and adapters established here are reused by Xero)
**Related Files:** `integrations/quickbooks/oauth.ts`, `integrations/quickbooks/vendor-sync.ts`, `integrations/quickbooks/bill-sync.ts`, `integrations/quickbooks/invoice-sync.ts`, `integrations/quickbooks/payment-sync.ts`, `integrations/quickbooks/sync-dashboard.ts`, `lib/integrations/quickbooks-sync/index.ts`

**Imports / Exports**
- Imports: `AccountingPort` interface (internal), `OAuthTokenStore` (shared auth library), `intuit-oauth` npm package (v4+)
- Exports: `QuickBooksAdapter`, `QBSyncService`, `QBSyncDashboardWidget`

**Definition of Done**
- [ ] QuickBooks OAuth 2.0 PKCE flow completes and stores tokens securely (encrypted at rest)
- [ ] `pushVendorToQB(vendorId)` creates or updates a vendor in QBO; idempotent on re‑run
- [ ] `pushBillToQB(billId)` creates a bill in QBO Accounts Payable with correct line items
- [ ] `pushInvoiceToQB(invoiceId)` creates an invoice in QBO Accounts Receivable
- [ ] `pullPaymentsFromQB()` syncs customer payments from QBO and applies them to AR invoices
- [ ] Bidirectional sync uses last‑write‑wins with configurable override to "Apex‑wins" or "QBO‑wins"
- [ ] Sync status dashboard shows last sync time, pending item count, and error list
- [ ] Rate limit handling respects QBO's 500 req/min limit with exponential backoff
- [ ] All QBO credentials stored via environment variables; none hardcoded
- [ ] Unit tests pass for all sync functions using QBO sandbox environment
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- QuickBooks Desktop (separate SDK and auth model)
- QuickBooks Payroll and Time integrations
- Real‑time event streaming (QBO does not support webhooks for all entity types)
- Multi‑company QBO accounts (single company per Apex org in this phase)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, OAuth tokens, `QUICKBOOKS_CLIENT_SECRET`, refresh tokens
- Never call `pnpm --filter @workspace/db run push` without explicit user approval
- Never hardcode `clientId` or `clientSecret` in source files

**Output Artifacts**
- Code changes in: `integrations/quickbooks/`, `lib/integrations/quickbooks-sync/`
- Tests added/updated in: `integrations/quickbooks/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] – no new DB tables required in this task (sync state stored in existing integration_logs table)

**Rollback**
- Granularity: file‑level – delete `integrations/quickbooks/` directory; no DB schema changes to undo
- Halt condition: if QBO sandbox returns persistent 401 errors after token refresh, stop and ask user to verify QBO app credentials before continuing

**Rules to Follow**
- Use `intuit-oauth` v4+ (Node.js OAuth 2.0 client maintained by Intuit); do not hand‑roll OAuth
- Pin QBO API version header to `v3`
- All QBO API calls must include the `Authorization: Bearer <access_token>` and `Accept: application/json` headers
- Token refresh: proactively refresh when `expires_in` < 60 s; never let a call fail due to expired token
- Conflict resolution default: last‑write‑wins; record `lastModifiedBy: "apex" | "qbo"` on each synced entity
- Map QBO `Customer` → Apex `Contact`; QBO `Vendor` → Apex `Vendor`; QBO `Bill` → Apex `Bill`; QBO `Invoice` → Apex `Invoice`
- Use Pino structured logging; redact token values with `[REDACTED]` in all log statements

**Verification**
```bash
# Test OAuth flow
pnpm vitest run -- integrations/quickbooks/oauth.test.ts

# Test vendor sync
pnpm vitest run -- integrations/quickbooks/vendor-sync.test.ts

# Test bill sync
pnpm vitest run -- integrations/quickbooks/bill-sync.test.ts

# Test invoice sync
pnpm vitest run -- integrations/quickbooks/invoice-sync.test.ts

# Test payment sync
pnpm vitest run -- integrations/quickbooks/payment-sync.test.ts

# Full typecheck
pnpm run typecheck

# Manual smoke test (QBO sandbox)
curl -X POST http://localhost:8081/integrations/quickbooks/test-oauth
curl -X POST http://localhost:8081/integrations/quickbooks/test-sync
```

**Advanced Code Patterns**
- Adapter pattern: `QuickBooksAdapter` implements `AccountingPort` so the business layer never imports QBO‑specific code
- Token store abstraction: store encrypted tokens in DB via `OAuthTokenStore`; never in process memory across restarts
- Incremental sync: record `lastSyncedAt` per entity type; query QBO with `?minorversion=latest&startPosition=1` and date filters
- Idempotency: use QBO's `Id` field as the external key; upsert using internal `externalId` mapping table

**Anti‑Patterns**
- Do not store OAuth tokens in `localStorage`, environment files, or unencrypted DB columns
- Do not ignore QBO rate‑limit 429 responses; implement exponential backoff with jitter
- Do not skip data validation before pushing to QBO (missing required fields cause silent partial failures)
- Do not call QBO APIs synchronously in the request/response cycle; always process sync in background jobs
- Do not duplicate the `AccountingPort` interface – use the single shared definition in `lib/integrations/`

**DDD / TDD / BDD / Deep Module notes**
- DDD: QuickBooks is an external system within the Finance bounded context. `QuickBooksAdapter` is an anti‑corruption layer translating QBO domain concepts (Vendor, Bill, Invoice) into Apex domain objects without polluting the core domain.
- TDD: Write failing tests for each sync function against QBO sandbox before implementation. Use recorded fixtures (cassettes) to keep tests deterministic and fast.
- BDD: Scenario – "Given a bill is approved in Apex, When the sync job runs, Then the bill appears in QBO AP with matching amount and vendor."
- Deep Module: `QBSyncService` is a deep module – complex internal orchestration (token refresh, conflict detection, retry) behind a narrow public interface: `sync(entityType, direction)`.

---

### Subtasks

- [ ] INT‑QB‑001.0.25 (AGENT): Read the entire task, all related files, and the QBO v3 API reference.
  *No action – pause until fully understood.*

- [ ] INT‑QB‑001.0.5 (AGENT): Research QBO v3 API rate limits, OAuth 2.0 PKCE flow with `intuit-oauth` v4, and conflict‑resolution patterns for bidirectional sync (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑QB‑001.0.75 (AGENT): Reason about token storage strategy, conflict resolution edge cases (simultaneous edits), and whether QBO webhooks are available for the required entity types.
  *If uncertain about conflict resolution policy, ask the user before executing.*

- [ ] INT‑QB‑001.1 (AGENT): Implement QBO OAuth 2.0 PKCE flow and encrypted token store.
  **File(s):** `integrations/quickbooks/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/quickbooks/oauth.test.ts`

- [ ] INT‑QB‑001.2 (AGENT): Implement vendor sync (`pushVendorToQB`, `pullVendorsFromQB`) with upsert and conflict resolution.
  **File(s):** `integrations/quickbooks/vendor-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/quickbooks/vendor-sync.test.ts`

- [ ] INT‑QB‑001.3 (AGENT): Implement bill sync (`pushBillToQB`) with line‑item mapping and idempotency.
  **File(s):** `integrations/quickbooks/bill-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/quickbooks/bill-sync.test.ts`

- [ ] INT‑QB‑001.4 (AGENT): Implement invoice sync (`pushInvoiceToQB`) with AR line‑item mapping.
  **File(s):** `integrations/quickbooks/invoice-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/quickbooks/invoice-sync.test.ts`

- [ ] INT‑QB‑001.5 (AGENT): Implement payment pull (`pullPaymentsFromQB`) with automatic AR application.
  **File(s):** `integrations/quickbooks/payment-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/quickbooks/payment-sync.test.ts`

- [ ] INT‑QB‑001.6 (AGENT): Build sync status dashboard component showing last sync time, pending counts, and errors.
  **File(s):** `integrations/quickbooks/sync-dashboard.ts`, `artifacts/apex-os/src/components/integrations/QBSyncDashboard.tsx`
  **Verification:** Component renders in Storybook/dev server with mock sync state.

- [ ] INT‑QB‑001.7 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑QB‑001.N (HUMAN): Final review – verify OAuth flow end‑to‑end in QBO sandbox, spot‑check a bill push, and approve.
  **Verification:** Approved.

---

## [ ] INT‑XERO‑001: Xero Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Xero integration exists. `QuickBooksAdapter` patterns from INT‑QB‑001 are available as a reference template. As of May 2026, the Xero Accounting API v2.0 uses OAuth 2.0 with tenant‑specific access, per‑org rate limits of 60 req/min, and the `xero‑node` v8+ SDK.
**Size:** Large

**Description:** Implement bidirectional sync between Apex and Xero covering contacts (vendors + customers), bills, invoices, payments, and chart‑of‑accounts mapping, using the Xero Accounting API v2.0 with OAuth 2.0 and multi‑tenant support.

**Depends on:** INT‑QB‑001 – adapter pattern and OAuth utilities to reuse; API‑AP‑008 – AP API; API‑AR‑008 – AR API
**Blocks:** INT‑DOCS‑001 – Outlook Add‑In (listed as downstream in original dependency graph)
**Related Files:** `integrations/xero/oauth.ts`, `integrations/xero/tenant-manager.ts`, `integrations/xero/contact-sync.ts`, `integrations/xero/bill-sync.ts`, `integrations/xero/invoice-sync.ts`, `integrations/xero/payment-sync.ts`, `integrations/xero/accounts-mapping.ts`, `lib/integrations/xero-sync/index.ts`

**Imports / Exports**
- Imports: `AccountingPort` interface, `OAuthTokenStore`, `xero-node` npm SDK (v8+)
- Exports: `XeroAdapter`, `XeroSyncService`, `XeroTenantManager`

**Definition of Done**
- [ ] Xero OAuth 2.0 flow completes; tenant selection UI allows choosing the correct Xero organisation
- [ ] Vendor/customer sync maps Apex `Vendor` → Xero `Contact` (type Supplier) and Apex `Contact` → Xero `Contact` (type Customer)
- [ ] `pushBillToXero(billId)` creates an `ACCPAY` invoice in Xero; `pushInvoiceToXero(invoiceId)` creates an `ACCREC` invoice
- [ ] `pullPaymentsFromXero()` fetches payments and applies them to Apex AR records
- [ ] Xero chart‑of‑accounts mapping allows admin to link Apex account codes to Xero account codes
- [ ] API calls respect Xero's 60 req/min per Xero org limit with per‑tenant rate limiting
- [ ] Multi‑tenant: each Apex organisation maps to exactly one Xero `tenantId`; stored encrypted
- [ ] All sync functions are idempotent using `ExternalLinkId` or `InvoiceNumber` deduplication
- [ ] Unit tests pass for all sync functions using Xero demo company
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- Xero Payroll API (separate product/API)
- Xero Projects API
- Xero Inventory tracking
- Xero Practice Manager (XPM)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `XERO_CLIENT_SECRET`, refresh tokens, `tenantId` values
- Never call database push without explicit user approval
- Never hardcode Xero app credentials

**Output Artifacts**
- Code changes in: `integrations/xero/`, `lib/integrations/xero-sync/`
- Tests added/updated in: `integrations/xero/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level – delete `integrations/xero/` directory; no DB schema changes introduced
- Halt condition: if Xero returns persistent 403 (tenant permission) errors, stop and ask user to verify Xero app scopes before continuing

**Rules to Follow**
- Use `xero-node` v8+ SDK; do not use the deprecated `xero-accounting` package
- Xero API version: always send `Xero-API-Version: 2.0` header; use `xero-node`'s built‑in client which handles this
- Tenant management: always retrieve and validate `tenantId` before making entity‑level API calls
- Rate limiting: implement a per‑tenant token bucket (60 req/min); use `retry‑after` header when throttled
- Conflict resolution: same last‑write‑wins strategy as INT‑QB‑001; record `lastModifiedBy: "apex" | "xero"`
- Chart‑of‑accounts mapping: stored in DB table `xero_account_mappings(apexCode, xeroAccountCode, tenantId)`
- Use Pino structured logging; redact all token and tenantId values with `[REDACTED]`

**Verification**
```bash
# Test Xero OAuth
pnpm vitest run -- integrations/xero/oauth.test.ts

# Test tenant manager
pnpm vitest run -- integrations/xero/tenant-manager.test.ts

# Test contact sync
pnpm vitest run -- integrations/xero/contact-sync.test.ts

# Test bill sync
pnpm vitest run -- integrations/xero/bill-sync.test.ts

# Test invoice sync
pnpm vitest run -- integrations/xero/invoice-sync.test.ts

# Test payment sync
pnpm vitest run -- integrations/xero/payment-sync.test.ts

# Test accounts mapping
pnpm vitest run -- integrations/xero/accounts-mapping.test.ts

# Full typecheck
pnpm run typecheck

# Manual smoke test (Xero demo company)
curl -X POST http://localhost:8081/integrations/xero/test-oauth
curl -X POST http://localhost:8081/integrations/xero/test-sync
```

**Advanced Code Patterns**
- Adapter pattern: `XeroAdapter` implements `AccountingPort` – identical interface as `QuickBooksAdapter`; swap providers without touching business logic
- Tenant manager: `XeroTenantManager` resolves `tenantId` from the authenticated session and caches per‑user with TTL
- Xero pagination: use `page` parameter with page size 100; loop until response `Items` length < 100
- `ExternalLinkId`: use Xero's `ExternalLinkId` (max 255 chars) to embed the Apex entity UUID, enabling idempotent upserts without a separate mapping table

**Anti‑Patterns**
- Do not ignore Xero tenant selection – calling entity APIs without a valid `tenantId` returns a 403 and corrupts audit logs
- Do not skip chart‑of‑accounts validation before pushing bills/invoices (missing account codes cause silent Xero draft errors)
- Do not use Xero `ACCPAY` for AR invoices or `ACCREC` for AP bills – these are reversed and will corrupt the Xero ledger
- Do not store `tenantId` unencrypted in environment variables shared across tenants

**DDD / TDD / BDD / Deep Module notes**
- DDD: Xero is a secondary external system in the Finance bounded context. `XeroAdapter` is a second anti‑corruption layer; both `QuickBooksAdapter` and `XeroAdapter` conform to the same `AccountingPort`, keeping the domain model free of provider‑specific types.
- TDD: Record Xero API responses as fixtures using `nock` or VCR‑style cassettes. Write tests against fixtures before implementing the real calls.
- BDD: Scenario – "Given a Xero organisation is connected and an invoice exists in Apex, When the agent calls `pushInvoiceToXero`, Then an `ACCREC` invoice appears in the Xero demo company with matching line items and due date."
- Deep Module: `XeroSyncService` encapsulates the complexity of tenant resolution, rate limiting, and conflict detection behind a simple `sync(direction)` API.

---

### Subtasks

- [ ] INT‑XERO‑001.0.25 (AGENT): Read the entire task, INT‑QB‑001 patterns, and the Xero Accounting API v2.0 reference.
  *No action – pause until fully understood.*

- [ ] INT‑XERO‑001.0.5 (AGENT): Research `xero-node` v8+ SDK changes, Xero tenant management patterns, and chart‑of‑accounts mapping best practices (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑XERO‑001.0.75 (AGENT): Reason about multi‑tenant token storage, Xero's 60 req/min limit impact on bulk sync, and whether `ExternalLinkId` is sufficient for idempotency.
  *If uncertain, ask the user before executing.*

- [ ] INT‑XERO‑001.1 (AGENT): Implement Xero OAuth 2.0 flow with encrypted token and tenant storage.
  **File(s):** `integrations/xero/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/xero/oauth.test.ts`

- [ ] INT‑XERO‑001.2 (AGENT): Implement tenant manager with per‑user tenant resolution and caching.
  **File(s):** `integrations/xero/tenant-manager.ts`
  **Verification:** `pnpm vitest run -- integrations/xero/tenant-manager.test.ts`

- [ ] INT‑XERO‑001.3 (AGENT): Implement contact sync (vendor → Supplier, customer → Customer).
  **File(s):** `integrations/xero/contact-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/xero/contact-sync.test.ts`

- [ ] INT‑XERO‑001.4 (AGENT): Implement bill sync (`ACCPAY`) and invoice sync (`ACCREC`).
  **File(s):** `integrations/xero/bill-sync.ts`, `integrations/xero/invoice-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/xero/bill-sync.test.ts integrations/xero/invoice-sync.test.ts`

- [ ] INT‑XERO‑001.5 (AGENT): Implement payment sync and AR application.
  **File(s):** `integrations/xero/payment-sync.ts`
  **Verification:** `pnpm vitest run -- integrations/xero/payment-sync.test.ts`

- [ ] INT‑XERO‑001.6 (AGENT): Implement chart‑of‑accounts mapping with admin settings UI.
  **File(s):** `integrations/xero/accounts-mapping.ts`, `artifacts/apex-os/src/pages/settings/XeroAccountMapping.tsx`
  **Verification:** `pnpm vitest run -- integrations/xero/accounts-mapping.test.ts`

- [ ] INT‑XERO‑001.7 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑XERO‑001.N (HUMAN): Final review – verify OAuth flow and a bill push in Xero demo company, approve.
  **Verification:** Approved.

---

*End of Phase 7 Accounting Software Integrations.*
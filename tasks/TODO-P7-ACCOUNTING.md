# TODO-P7-ACCOUNTING.md – Phase 7 Accounting Software Integrations

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This document contains accounting software integration tasks for QuickBooks Online and Xero. All tasks follow the established patterns with explicit dependencies and verification commands.

---

## Phase 7 Accounting Integration Task Index

- [ ] INT‑QB‑001 – QuickBooks Online Full Integration  
- [ ] INT‑XERO‑001 – Xero Integration  

---

## Accounting Software Integrations

### [ ] INT‑QB‑001: QuickBooks Online Full Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑QB‑001 (stub), API‑AP‑008, API‑AR‑008.  
**Definition of Done:**
- QuickBooks OAuth 2.0 flow for firm authorization.
- `pushVendorToQB(vendorId)` – creates/updates vendor in QBO.
- `pushBillToQB(billId)` – creates bill in QBO Accounts Payable.
- `pushInvoiceToQB(invoiceId)` – creates invoice in QBO Accounts Receivable.
- `pullPaymentsFromQB()` – syncs customer payments from QBO.
- Bidirectional sync with conflict resolution (last‑write‑wins configurable).
- Sync status dashboard showing last sync time, pending items, errors.

**Out of Scope:**
- QuickBooks Desktop integration
- QuickBooks Payroll integration
- QuickBooks Time tracking integration

**Rules to Follow:**
- Use QuickBooks Online API v3 with proper error handling
- Implement OAuth 2.0 flow with token refresh
- Handle QuickBooks API rate limits (500 calls per minute)
- Implement proper data mapping between systems

**Advanced Code Patterns:**
- OAuth 2.0 token management with refresh
- Entity mapping and transformation
- Conflict resolution algorithms
- Sync state management
- Error recovery and retry logic

**Anti-Patterns:**
- Don't store OAuth tokens insecurely
- Don't ignore QuickBooks API rate limits
- Don't skip data validation before sync
- Don't process sync without proper error handling

**Related Files:**
- `integrations/quickbooks/oauth.ts` – OAuth 2.0 flow
- `integrations/quickbooks/vendor-sync.ts` – Vendor synchronization
- `integrations/quickbooks/bill-sync.ts` – Bill synchronization
- `integrations/quickbooks/invoice-sync.ts` – Invoice synchronization
- `integrations/quickbooks/payment-sync.ts` – Payment synchronization
- `integrations/quickbooks/sync-dashboard.ts` – Sync status UI
- `lib/integrations/quickbooks-sync/` – Sync service layer

**Depends on:**
- INT‑QB‑001 (stub): Initial QuickBooks integration patterns
- API‑AP‑008: Accounts Payable API
- API‑AR‑008: Accounts Receivable API

**Imports from/exports to:**
- Imports: Accounting interface, OAuth utilities
- Exports: QuickBooks adapter, sync services, dashboard

**Blocks:**
- INT‑XERO‑001: Xero Integration

**Verification:**
```bash
# Test QuickBooks OAuth
pnpm vitest run -- integrations/quickbooks/oauth.test.ts

# Test vendor sync
pnpm vitest run -- integrations/quickbooks/vendor-sync.test.ts

# Test bill sync
pnpm vitest run -- integrations/quickbooks/bill-sync.test.ts

# Test invoice sync
pnpm vitest run -- integrations/quickbooks/invoice-sync.test.ts

# Test payment sync
pnpm vitest run -- integrations/quickbooks/payment-sync.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/quickbooks/test-oauth
curl -X POST http://localhost:8081/integrations/quickbooks/test-sync
```

### [ ] INT‑XERO‑001: Xero Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑QB‑001 (patterns established).  
**Definition of Done:**
- Xero OAuth 2.0 flow.
- Vendor, bill, invoice, and payment sync (similar to QBO).
- Xero‑specific chart of accounts mapping.
- Contact sync (vendors ↔ Xero contacts, customers ↔ Xero contacts).

**Out of Scope:**
- Xero Payroll integration
- Xero Projects integration
- Xero Inventory integration

**Rules to Follow:**
- Use Xero Accounting API with proper error handling
- Implement OAuth 2.0 flow with token refresh
- Handle Xero API rate limits (60 calls per minute)
- Implement proper tenant management

**Advanced Code Patterns:**
- Xero tenant management
- Chart of accounts mapping
- Contact synchronization
- Invoice/bill transformation
- Payment reconciliation

**Anti-Patterns:**
- Don't ignore Xero tenant selection
- Don't skip chart of accounts validation
- Don't process payments without proper reconciliation
- Don't store Xero credentials insecurely

**Related Files:**
- `integrations/xero/oauth.ts` – OAuth 2.0 flow
- `integrations/xero/tenant-manager.ts` – Tenant management
- `integrations/xero/contact-sync.ts` – Contact synchronization
- `integrations/xero/bill-sync.ts` – Bill synchronization
- `integrations/xero/invoice-sync.ts` – Invoice synchronization
- `integrations/xero/payment-sync.ts` – Payment synchronization
- `integrations/xero/accounts-mapping.ts` – Chart of accounts mapping
- `lib/integrations/xero-sync/` – Sync service layer

**Depends on:**
- INT‑QB‑001: QuickBooks integration patterns

**Imports from/exports to:**
- Imports: Accounting interface, OAuth utilities
- Exports: Xero adapter, sync services, tenant manager

**Blocks:**
- INT‑DOCS‑001: Outlook Add-In

**Verification:**
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

# Manual verification
curl -X POST http://localhost:8081/integrations/xero/test-oauth
curl -X POST http://localhost:8081/integrations/xero/test-sync
```

---

*End of Phase 7 Accounting Software Integrations. Next: TODO-P7-DOCS.md – Document Productivity Integrations.*

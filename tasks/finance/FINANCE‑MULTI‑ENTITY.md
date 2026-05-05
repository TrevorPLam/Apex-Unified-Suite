# tasks/finance/FINANCE‑MULTI‑ENTITY.md – Finance: Multi‑Entity, Credit Memos & Advanced Features

This file covers advanced Finance features spanning multiple entity support, credit memos, payment runs, 1099 tracking, reconciliation, AP inbox, collections, and the frontend integration for these capabilities. All tasks extend the core AR/AP functionality.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Customers

### [ ] DB‑AR‑001: Define Customers Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No customers table. AR invoicing, payments, and collections are blocked.
**Size:** Small

**Description:** Define the `customers` table for the AR bounded context — stores business‑to‑business customer records with billing/shipping JSONB addresses, credit management, and payment terms.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `DB‑FIN‑002`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑008`, `DB‑FIN‑014`, `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑006`
**Related Files:** `lib/db/src/schema/ar/customers.ts`, `lib/db/src/__tests__/customers.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `company_name` (text NOT NULL), `contact_name` (text nullable), `email` (text nullable), `phone` (text nullable), `billing_address` (jsonb default `{}`), `shipping_address` (jsonb default `{}`), `payment_terms_days` (integer NOT NULL default `30`), `credit_limit_cents` (integer nullable), `tax_id` (text nullable), `is_active` (boolean NOT NULL default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, company_name)`, `(organization_id, email)`
- [ ] Zod schemas and types exported; addresses validated as structured JSONB objects
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- customers.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Customer` aggregate root in the AR bounded context. Credit management in `CustomerService`.
- TDD: Assert JSONB address defaults, optional credit limit.
- BDD: Supports “Add customer” and “Set credit limit” scenarios.

---

### Subtasks
- [ ] DB‑AR‑001.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑AR‑001.0.5 (AGENT): Research JSONB address validation pattern.
- [ ] DB‑AR‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/customers.test.ts` **Verification:** RED.
- [ ] DB‑AR‑001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑AR‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database – Credit Memos & Advanced Tables

### [ ] DB‑FIN‑008: Define Credit Memos Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No credit memos table. Credit issuance and AR balance adjustment are blocked.
**Size:** Small

**Description:** Define the `credit_memos` table for issuing and tracking customer credits. Supports applied vs unapplied credits and optional linkage to specific invoices.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑AR‑001`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑017`
**Related Files:** `lib/db/src/schema/finance/credit_memos.ts`, `lib/db/src/__tests__/credit‑memos.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices, nullable), `amount_cents` (integer NOT NULL), `reason` (text nullable), `status` (pgEnum: `draft|issued|applied|void`), `applied_amount_cents` (integer NOT NULL default `0`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, customer_id)`, `(invoice_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- credit‑memos.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑008.0.25 (AGENT): Read DB‑AR‑001 and DB‑FIN‑001 schemas. No action – pause.
- [ ] DB‑FIN‑008.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/credit‑memos.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑008.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑008.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑010: Define Payment Runs Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment runs table. Batch AP disbursements (Bill.com feature) are blocked.
**Size:** Small

**Description:** Define the `payment_runs` table and its `payment_run_bills` junction table for batch payment processing — enabling bulk disbursement of multiple vendor bills in a single bank transfer.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`, `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑005`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑018`
**Related Files:** `lib/db/src/schema/finance/payment_runs.ts`, `lib/db/src/__tests__/payment‑runs.test.ts`

**Definition of Done**
- [ ] `paymentRuns` columns: `id` (uuid PK), `organization_id` (FK), `status` (pgEnum: `draft|processing|completed|cancelled`), `total_amount_cents` (integer), `initiated_by` (FK → users), `payment_date` (date), `bank_account_id` (FK → bank_accounts), `summary_json` (jsonb), `created_at`, `updated_at`
- [ ] `paymentRunBills` columns: `id` (uuid PK), `payment_run_id` (FK), `bill_id` (FK), `amount_cents` (integer NOT NULL), `created_at`
- [ ] Composite unique on `(payment_run_id, bill_id)` in junction table
- [ ] Indexes: `(organization_id, status)` on payment_runs; `(payment_run_id)`, `(bill_id)` on junction
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- payment‑runs.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑010.0.25 (AGENT): Read DB‑AP‑002, DB‑FIN‑005, DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑FIN‑010.1 (AGENT): Write failing schema test for both tables. **File:** `lib/db/src/__tests__/payment‑runs.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑010.2 (AGENT): Implement both tables, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑010.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑011: Define 1099 Tracking Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking table. US tax reporting for 1099‑eligible vendors is blocked.
**Size:** Small

**Description:** Define the `form_1099_tracking` table for tracking annual 1099 payment totals per vendor, enabling year‑end US tax filing preparation.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑001`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑019`
**Related Files:** `lib/db/src/schema/finance/1099_tracking.ts`, `lib/db/src/__tests__/1099‑tracking.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `year` (integer NOT NULL), `total_payments_cents` (integer NOT NULL default `0`), `filing_status` (pgEnum: `not_started|ready_to_file|filed`), `last_filed_date` (date nullable), `created_at`, `updated_at`
- [ ] Composite unique on `(vendor_id, year)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- 1099‑tracking.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑011.0.25 (AGENT): Read DB‑AP‑001 schema. No action – pause.
- [ ] DB‑FIN‑011.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/1099‑tracking.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑011.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑011.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑012: Define Reconciliation Entries Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No reconciliation table. Bank statement matching and audit trail are blocked.
**Size:** Small

**Description:** Define the append‑only `reconciliation_entries` table for matching bank transactions to recorded payments.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑005`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑020`
**Related Files:** `lib/db/src/schema/finance/reconciliation_entries.ts`, `lib/db/src/__tests__/reconciliation‑entries.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `bank_account_id` (FK), `transaction_id` (uuid), `transaction_type` (pgEnum: `bill_payment|customer_payment`), `external_reference` (text), `match_status` (pgEnum: `matched|unmatched|flagged`), `matched_at` (timestamp nullable), `created_at` (NO `updated_at` — append‑only)
- [ ] Indexes: `(bank_account_id, match_status)`, `(transaction_id)`
- [ ] No `deleted_at` column
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- reconciliation‑entries.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑012.0.25 (AGENT): Read DB‑FIN‑005. No action – pause.
- [ ] DB‑FIN‑012.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/reconciliation‑entries.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑012.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑012.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑013: Define AP Inbox Captured Invoices Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP inbox table. Vendor invoice capture (email/OCR workflow) is blocked.
**Size:** Small

**Description:** Define the `ap_inbox` staging table for captured vendor invoices before they become approved bills.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑021`
**Related Files:** `lib/db/src/schema/finance/ap_inbox.ts`, `lib/db/src/__tests__/ap‑inbox.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `source` (pgEnum: `email|upload|manual`), `raw_file_path` (text nullable), `extracted_data_json` (jsonb nullable), `confidence_score` (numeric nullable), `mapped_bill_id` (FK → bills, nullable), `status` (pgEnum: `pending_review|processed|error`), `created_at`, `updated_at`
- [ ] Index on `(organization_id, status)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- ap‑inbox.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑013.0.25 (AGENT): Read DB‑AP‑002. No action – pause.
- [ ] DB‑FIN‑013.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/ap‑inbox.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑013.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑013.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑014: Define Collections Activity Log Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collections activity table. AR collections workbench history is blocked.
**Size:** Small

**Description:** Define the append‑only `collections_activity` table for recording AR collections interactions.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑AR‑001`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑022`
**Related Files:** `lib/db/src/schema/finance/collections_activity.ts`, `lib/db/src/__tests__/collections‑activity.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices), `contact_method` (pgEnum: `email|phone|in_person`), `notes` (text nullable), `promise_to_pay_date` (date nullable), `outcome` (pgEnum: `contacted|left_message|no_answer|payment_received|disputed`), `created_by` (FK → users), `created_at` (NO `updated_at`, NO `deleted_at` — append‑only)
- [ ] Indexes: `(customer_id)`, `(invoice_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- collections‑activity.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑014.0.25 (AGENT): Read DB‑AR‑001, DB‑FIN‑001, DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑FIN‑014.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/collections‑activity.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑014.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑014.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Credit Memos

### [ ] API‑FIN‑017: Credit Memo & Invoice Credit API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No credit memo support exists.
**Size:** Large

**Description:** Implement full credit memo lifecycle management — creation, application to invoices (reducing their balance), voiding, and status tracking — with atomic credit application and domain event emission.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑008`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — standalone Finance depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/credit‑memo‑service.ts`, `lib/db/src/repositories/finance/credit‑memos.ts`, `artifacts/api‑server/src/routes/finance/credit‑memos.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/credit‑memos`, `POST`, `GET /{memoId}`, `POST /{memoId}/apply`, `PATCH /{memoId}`, `POST /{memoId}/void` endpoints
- [ ] Status machine: `draft → issued → partially_applied → applied → void`
- [ ] Credit application is atomic within a transaction; validates applied amount ≤ remaining balance
- [ ] Emits `CreditMemoCreated` and `CreditMemoApplied` domain events
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/credit‑memos.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Credit memos are financial instruments that must maintain accounting invariants.
- TDD: Write integration tests first (red). Application test must verify atomic balance updates.
- BDD: “When an admin applies a $500 credit memo to a $1,200 invoice, the invoice balance is reduced to $700.”
- Deep Module: `CreditMemoService.applyCredit(memoId, invoiceId, amount, actorId)` hides balance validation, transactional dual‑update, and event emission.

---

### Subtasks
- [ ] API‑FIN‑017.0.25 (AGENT): Read API‑FIN‑017, DB‑FIN‑008 schema, `InvoiceService`. *No action – pause.*
- [ ] API‑FIN‑017.1 (AGENT): Add credit memo endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑017.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/credit‑memos.test.ts` **Verification:** All red.
- [ ] API‑FIN‑017.3 (AGENT): Implement `CreditMemoRepository` and `CreditMemoService` with transactional apply. **File(s):** `lib/db/src/repositories/finance/credit‑memos.ts`, `artifacts/api‑server/src/services/finance/credit‑memo‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑017.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/credit‑memos.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑017.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Payment Runs

### [ ] API‑FIN‑018: Payment Run (Batch Payment) API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Bills must be paid individually; no batch payment processing exists.
**Size:** Large

**Description:** Implement batch payment run management — create a payment run from approved bills, execute it (creating individual payment records), or cancel a draft run — with status tracking and domain event emission.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑010`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — Finance depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/payment‑run‑service.ts`, `artifacts/api‑server/src/routes/finance/payment‑runs.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/payment‑runs`, `POST`, `GET /{runId}`, `POST /{runId}/execute`, `POST /{runId}/cancel` endpoints
- [ ] Status machine: `draft → processing → completed | cancelled`
- [ ] Execution is a single DB transaction: creates payments, debits bank, marks bills paid
- [ ] Emits `PaymentRunCreated` and `PaymentRunCompleted` events
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/payment‑runs.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: A payment run orchestrates multiple payment operations and enforces accounting invariants.
- TDD: Write integration tests first. Multi‑bill execution test must verify all bills are paid.
- BDD: “As an AP manager, I can select 15 approved vendor bills, create a payment run, and execute it.”
- Deep Module: `PaymentRunService.execute(runId, orgId)` hides bill fetching, payment creation loop, and bank debit.

---

### Subtasks
- [ ] API‑FIN‑018.0.25 (AGENT): Read API‑FIN‑018, DB‑FIN‑010 schema, `InvoiceService`, `PaymentService`. *No action – pause.*
- [ ] API‑FIN‑018.1 (AGENT): Add payment run endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑018.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/payment‑runs.test.ts` **Verification:** All red.
- [ ] API‑FIN‑018.3 (AGENT): Implement `PaymentRunService` with atomic execution. **File(s):** `artifacts/api‑server/src/services/finance/payment‑run‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑018.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/payment‑runs.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑018.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – 1099, Reconciliation, AP Inbox, Collections

### [ ] API‑FIN‑019: 1099 Preparation API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking exists.
**Size:** Medium

**Description:** Implement 1099 tax preparation tracking — accumulating YTD payment totals for eligible vendors, managing filing status, and providing a stub export endpoint.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑011`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑008`, AP vendor API, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — compliance feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/form1099‑service.ts`, `artifacts/api‑server/src/routes/finance/1099.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/1099‑tracking`, `POST /refresh`, `GET /{vendorId}/{year}`, `PATCH /{vendorId}/{year}`, `POST /export` endpoints
- [ ] Refresh is idempotent; YTD totals computed via SQL aggregation
- [ ] Only vendors with YTD payments ≥ $600 included
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/1099.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑019.0.25 (AGENT): Read API‑FIN‑019, DB‑FIN‑011 schema. *No action – pause.*
- [ ] API‑FIN‑019.1 (AGENT): Add 1099 endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑019.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/1099.test.ts` **Verification:** All red.
- [ ] API‑FIN‑019.3 (AGENT): Implement `Form1099Service` with upsert refresh. **File(s):** `artifacts/api‑server/src/services/finance/form1099‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑019.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/1099.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑019.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑FIN‑020: Reconciliation API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No bank reconciliation infrastructure exists.
**Size:** Large

**Description:** Implement bank reconciliation endpoints for listing entries, manual matching, flagging, and viewing the unmatched queue.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑012`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑008`, `infrastructure/AUTH.md → AUTH‑008`, `ERROR‑002`
**Blocks:** [N/A] — Finance depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/reconciliation‑service.ts`, `artifacts/api‑server/src/routes/finance/reconciliation.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/reconciliation`, `POST /match`, `PATCH /{entryId}/flag`, `GET /unmatched` endpoints
- [ ] Match validates both bank transaction and payment belong to the same organisation
- [ ] Already‑matched entry cannot be re‑matched (409)
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/reconciliation.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑020.0.25 (AGENT): Read API‑FIN‑020, DB‑FIN‑012 schema. *No action – pause.*
- [ ] API‑FIN‑020.1 (AGENT): Add reconciliation endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑020.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/reconciliation.test.ts` **Verification:** All red.
- [ ] API‑FIN‑020.3 (AGENT): Implement `ReconciliationService` with match, flag, and unmatched queue. **File(s):** `artifacts/api‑server/src/services/finance/reconciliation‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑020.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/reconciliation.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑020.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑FIN‑021: AP Inbox API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP invoice capture inbox exists.
**Size:** Large

**Description:** Implement an AP invoice capture inbox — manual upload (with OCR stub), listing, detail view, processing a captured invoice into a draft bill, and rejecting invalid captures.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑013`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `infrastructure/AUTH.md → AUTH‑008`, `ERROR‑002`
**Blocks:** [N/A] — Finance depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/ap‑inbox‑service.ts`, `artifacts/api‑server/src/routes/finance/ap‑inbox.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/ap‑inbox`, `GET /{captureId}`, `POST /{captureId}/process`, `POST /{captureId}/reject`, `POST /upload` endpoints
- [ ] File upload: MIME type validation (PDF, JPEG, PNG), max 10MB
- [ ] Process is transactional: creates bill from extracted data, marks capture as processed
- [ ] Already‑processed capture returns 400
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/ap‑inbox.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑021.0.25 (AGENT): Read API‑FIN‑021, DB‑FIN‑013 schema, `InvoiceService.create()`. *No action – pause.*
- [ ] API‑FIN‑021.1 (AGENT): Add AP inbox endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑021.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/ap‑inbox.test.ts` **Verification:** All red.
- [ ] API‑FIN‑021.3 (AGENT): Implement `APInboxService` with capture lifecycle and transactional process. **File(s):** `artifacts/api‑server/src/services/finance/ap‑inbox‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑021.4 (AGENT): Create routes with multer file upload and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/ap‑inbox.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑021.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑FIN‑022: Collections Activity API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR collections activity tracking exists.
**Size:** Medium

**Description:** Implement an append‑only AR collections activity log — enabling clerks to record collection attempts with outcome and promise‑to‑pay dates, and retrieve per‑customer collection summaries.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑014`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `infrastructure/AUTH.md → AUTH‑008`, `ERROR‑002`
**Blocks:** [N/A] — standalone feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/finance/collections‑service.ts`, `artifacts/api‑server/src/routes/finance/collections.ts`

**Definition of Done**
- [ ] `GET /api/v1/finance/collections‑activity`, `POST`, `GET /summary/{customerId}` endpoints
- [ ] Append‑only: no PATCH or DELETE endpoints
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/collections.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑022.0.25 (AGENT): Read API‑FIN‑022, DB‑FIN‑014 schema. *No action – pause.*
- [ ] API‑FIN‑022.1 (AGENT): Add collections endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑022.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/finance/collections.test.ts` **Verification:** All red.
- [ ] API‑FIN‑022.3 (AGENT): Implement `CollectionsService` with append‑only logging and SQL summary. **File(s):** `artifacts/api‑server/src/services/finance/collections‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑FIN‑022.4 (AGENT): Create routes (GET + POST only) and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/finance/collections.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑022.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## AR Context Invoice View

### [ ] DB‑AR‑002: AR Context Invoice View
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR‑specific invoice query layer. The `invoices` table is shared; this task creates AR‑context query helpers.
**Size:** Small

**Description:** Create AR‑context query utilities and TypeScript types that present the shared `invoices` table through a customer‑focused lens, without creating a duplicate table.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑AR‑001`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/views/ar/invoices.ts`

**Definition of Done**
- [ ] `lib/db/src/views/ar/invoices.ts` exports typed query helpers for AR‑focused invoice access
- [ ] `getArInvoicesByCustomer(db, orgId, customerId)` returns invoices with customer company name joined
- [ ] `getArInvoicesByStatus(db, orgId, status)` returns all invoices for a status filtered by org
- [ ] `ArInvoice` type includes joined customer fields
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- All query helpers must include `organization_id` in WHERE clauses
- No duplicate table — reuse `invoices` schema

**Verification**
```bash
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: AR context views the shared `invoices` table through a customer‑focused lens.
- Deep Module: Query helpers hide join complexity behind a simple function interface.

---

### Subtasks
- [ ] DB‑AR‑002.0.25 (AGENT): Read DB‑FIN‑001 and DB‑AR‑001 schemas. *No action – pause.*
- [ ] DB‑AR‑002.1 (AGENT): Implement AR invoice query helpers and types. **File(s):** `lib/db/src/views/ar/invoices.ts` **Verification:** `pnpm run typecheck` clean.
- [ ] DB‑AR‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend Integration – Collections, 1099, Payment Portal

### [ ] FRONT‑FIN‑007: Collections Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collections workbench UI exists.
**Size:** Medium

**Description:** AR collections workbench: AR aging bar chart, prioritised collection queue grouped by customer, contact logging with outcome, promise‑to‑pay tracking, and escalation indicators.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑022`, `API‑FIN‑020`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑FIN‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/finance/CollectionsDashboard.tsx`

**Definition of Done**
- [ ] AR aging bar chart with bucket click filter
- [ ] Collection queue with expandable customer rows
- [ ] Contact log form; promise‑to‑pay follow‑up tracking
- [ ] Escalation indicators for invoices > 90 days with no contact
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- CollectionsDashboard.test.tsx
```

---

### Subtasks
- [ ] FRONT‑FIN‑007.0.25 (AGENT): Read the entire task and all related info. *No action – pause.*
- [ ] FRONT‑FIN‑007.1 (AGENT): Build AR aging bar chart and queue with contact log form. **File(s):** `artifacts/apex‑os/src/components/finance/CollectionsDashboard.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑FIN‑007.2 (AGENT): Add escalation indicators and promise‑to‑pay tracking. **File(s):** `artifacts/apex‑os/src/components/finance/CollectionsDashboard.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- CollectionsDashboard.test.tsx` → GREEN.
- [ ] FRONT‑FIN‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑FIN‑008: 1099 Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking UI exists.
**Size:** Small

**Description:** 1099 tracking interface: list of 1099‑eligible vendors with YTD payment totals, filter by year and filing status, vendor detail with monthly payment breakdown, and filing status update.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑019`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑FIN‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/finance/Dashboard1099.tsx`

**Definition of Done**
- [ ] Vendor list with EIN masking, YTD amount, filing status badges
- [ ] Year and status filter controls; vendor detail panel
- [ ] "Refresh Totals" and "Mark Filed" actions
- [ ] CSV export button
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- Dashboard1099.test.tsx
```

---

### Subtasks
- [ ] FRONT‑FIN‑008.0.25 (AGENT): Read the entire task and all related info. *No action – pause.*
- [ ] FRONT‑FIN‑008.1 (AGENT): Build vendor list with EIN masking, filters, and filing status badges. **File(s):** `artifacts/apex‑os/src/components/finance/Dashboard1099.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑FIN‑008.2 (AGENT): Wire "Refresh Totals", "Mark Filed", and CSV export. **File(s):** `artifacts/apex‑os/src/components/finance/Dashboard1099.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- Dashboard1099.test.tsx` → GREEN.
- [ ] FRONT‑FIN‑008.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑FIN‑006: Customer Payment Portal
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No customer payment portal UI exists.
**Size:** Medium

**Description:** Branded customer‑facing payment portal: magic‑link login, dashboard of open invoices, payment page with ACH/card method selection, payment history with receipts, auto‑pay enrollment toggle.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑023`, `API‑AR‑008`, `infrastructure/AUTH.md → FRONT‑AUTH‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/portal/PaymentPortal.tsx`

**Definition of Done**
- [ ] Route `/portal/pay` behind `PortalProtectedRoute`
- [ ] Dashboard: open invoices with "Pay Now"; payment page with method selection and idempotency key
- [ ] Payment history with receipts; auto‑pay enroll toggle
- [ ] Portal branding applied from config
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- PaymentPortal.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The payment portal serves the client‑side of the Finance bounded context.
- TDD: MSW returns open invoices; simulate payment submit → assert `POST /client‑payments` called.
- BDD: “As a client, I can log in to the payment portal, see my outstanding invoices, and make a payment.”

---

### Subtasks
- [ ] FRONT‑FIN‑006.0.25 (AGENT): Read the entire task and all related info. *No action – pause.*
- [ ] FRONT‑FIN‑006.1 (AGENT): Create `PaymentPortal` page; register route; apply portal branding. **File(s):** `artifacts/apex‑os/src/pages/portal/PaymentPortal.tsx`, `App.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑FIN‑006.2 (AGENT): Build open invoices dashboard and payment page with idempotency key. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑FIN‑006.3 (AGENT): Add payment history, auto‑pay toggle; write component tests. **File(s):** `artifacts/apex‑os/src/pages/portal/__tests__/PaymentPortal.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑FIN‑006.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
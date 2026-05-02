# TODO-P2-FINANCE.md – Phase 2: Financial Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Financial bounded context for Phase 2: Accounts Receivable, Accounts Payable, and shared Financial infrastructure. All tables include `organization_id` per the accepted multi‑tenancy ADR (ARCH‑001) and support Bill.com‑style financial workflows.

---

## Financial Context (Shared Infrastructure)

### [ ] DB‑FIN‑001: Define Invoices Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/invoices.ts` exports `invoices` table:  
- `id` (uuid PK), `organization_id` (FK), `customer_id` (FK)  
- `invoice_number` (text UNIQUE per organization), `amount_cents` (int), `currency` (text default 'USD'), `exchange_rate` (numeric nullable)  
- `tax_amount_cents` (int default 0), `tax_type` (text nullable)  
- `status` (enum: draft/sent/paid/overdue/void), `due_date` (date), `invoice_date` (date)  
- `line_items` (JSONB array), `memo` (text), `attachments` (text[] for document URLs)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, status)`, `(organization_id, customer_id, status)`, `(organization_id, due_date)`, `(invoice_number)`.

**DDD:** Invoice aggregate with multi‑currency and tax support (Bill.com feature).  
**TDD:** Validate status enum, unique invoice number per organization, JSONB line items.

### Subtasks:
- [ ] DB‑FIN‑001.1: Write schema test. (AGENT) – `lib/db/src/__tests__/invoices.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑001.2: Implement table with currency and tax columns. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑AR‑001 (customers).

---

### [ ] DB‑FIN‑002: Define Customer Payments Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/customer_payments.ts` exports `customerPayments` table:  
- `id` (uuid PK), `organization_id` (FK), `customer_id` (FK), `invoice_id` (FK invoices, nullable)  
- `amount_cents` (int), `currency` (text default 'USD'), `payment_method` (enum: card/ach/wire/check)  
- `status` (enum: pending/succeeded/failed/refunded), `processed_at` (timestamp nullable)  
- `failure_reason` (text nullable), `stripe_payment_intent_id` (text nullable)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, customer_id)`, `(invoice_id)`, `(stripe_payment_intent_id)`.

**DDD:** Customer payment processing with Stripe integration and audit trail.  
**TDD:** Validate status enum, FK constraints, payment method enum.

### Subtasks:
- [ ] DB‑FIN‑002.1: Write schema test. (AGENT) – `lib/db/src/__tests__/customer-payments.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑002.2: Implement table with payment processing fields. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑AR‑001, DB‑FIN‑001.

---

### [ ] DB‑FIN‑003: Define Payment Allocations Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/payment_allocations.ts` exports `paymentAllocations` table:  
- `id` (uuid PK), `organization_id` (FK), `payment_id` (FK customer_payments)  
- `invoice_id` (FK invoices), `amount_cents` (int)  
- `allocated_at` (timestamp), `created_at`  
- Index on `(payment_id)`, `(invoice_id)`, `(organization_id, allocated_at)`.

**DDD:** Junction table for allocating payments to multiple invoices (Bill.com feature).  
**TDD:** Validate that allocation amounts don't exceed payment amount (service layer).

### Subtasks:
- [ ] DB‑FIN‑003.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑FIN‑003.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑FIN‑001, DB‑FIN‑002.

---

### [ ] DB‑FIN‑004: Define Expense Categories Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/expense_categories.ts` exports `expenseCategories` table:  
- `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text)  
- `parent_category_id` (FK nullable, for hierarchical categories)  
- `is_active` (boolean), `deleted_at` (soft delete), timestamps  
- Unique on `(organization_id, name)`.

**DDD:** Expense categorization system for AP and expense reporting.  
**TDD:** Validate unique constraint, hierarchical FK.

### Subtasks:
- [ ] DB‑FIN‑004.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑FIN‑004.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑FIN‑005: Define Bank Accounts Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/bank_accounts.ts` exports `bankAccounts` table:  
- `id` (uuid PK), `organization_id` (FK), `account_name`, `account_type` (enum: checking/savings/credit_card)  
- `account_number_last_four` (text), `routing_number` (text nullable), `balance_cents` (int)  
- `currency` (text default 'USD'), `is_default` (boolean), `plaid_account_id` (text nullable)  
- `status` (active/inactive), `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, account_type)`, `(plaid_account_id)`.

### Subtasks:
- [ ] DB‑FIN‑005.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑FIN‑005.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑FIN‑006: Define Payment Methods Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/payment_methods.ts` exports `paymentMethods` table:  
- `id` (uuid PK), `organization_id` (FK), `entity_type` (vendor/customer), `entity_id` (FK to vendors or customers)  
- `method_type` (enum: ach/check/wire/card), `account_number_last_four` (text)  
- `routing_number` (text nullable), `card_brand` (text nullable), `expiry_date` (date nullable)  
- `is_default` (boolean), `billing_address` (JSONB), `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, entity_type, entity_id)`, `(entity_id, method_type)`.

### Subtasks:
- [ ] DB‑FIN‑006.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑FIN‑006.2: Implement table with JSONB billing address. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑FIN‑007: Define Idempotency Records Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/idempotency_records.ts` exports `idempotencyRecords` table:  
- `id` (uuid PK), `organization_id` (FK), `key` (text NOT NULL), `created_at`, `expires_at` (timestamp)  
- UNIQUE on `(organization_id, key)`.

**Purpose:** Centralized idempotency tracking per FRAMEWORK.md recommendation. Services check this table before processing operations with idempotency keys.

### Subtasks:
- [ ] DB‑FIN‑007.1: Write schema test with unique constraint. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑FIN‑007.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑FIN‑008: Define Credit Memos Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/credit_memos.ts` exports `creditMemos` table:  
- `id` (uuid PK), `organization_id` (FK), `customer_id` (FK to customers)  
- `invoice_id` (FK to invoices, nullable – can be unapplied)  
- `amount_cents` (int NOT NULL), `reason` (text), `status` (enum: draft/issued/applied/void)  
- `applied_amount_cents` (int default 0)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, customer_id)`, `(invoice_id)`.

**DDD:** Credit memos reduce open invoice balances; supports Bill.com‑style credit workflows.  
**TDD:** Validate status enum, FK constraints, and that applied amount never exceeds total amount (enforced in service layer).

### Subtasks:
- [ ] DB‑FIN‑008.1: Write schema test. (AGENT) – `lib/db/src/__tests__/credit-memos.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑008.2: Implement table with Zod schemas. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑AR‑001 (customers), DB‑FIN‑001 (invoices – FK can be initially nullable).

---

### [ ] DB‑FIN‑009: Add Multi‑Currency & Tax Columns (Modification Migration)
**Status:** ⏳ Not Started  
**Definition of Done:** A migration adds currency, exchange rate, and tax columns to the following tables if not already present:  
- `DB‑FIN‑001` (invoices): `currency` (default USD), `exchange_rate` (nullable), `tax_amount_cents` (default 0), `tax_type` (nullable). (Already included in the updated definition above; this migration ensures existing tables receive the columns.)  
- `DB‑AP‑002` (bills): same columns added.  
- `DB‑AR‑002` (AR invoices): same columns added.  
**Related Files:** Migration files in `lib/db/migrations/`.

**DDD:** Enables international payment and tax scenarios (Bill.com multi‑currency feature).  
**TDD:** Migration test proves columns exist and default correctly.

### Subtasks:
- [ ] DB‑FIN‑009.1: Create migration adding currency/tax columns to bills and AR invoices tables. (AGENT)  
  **verification:** `drizzle-kit generate` produces migration SQL.
- [ ] DB‑FIN‑009.2: Test migration on fresh database; verify default values. (AGENT)  
  **verification:** Migration applies without errors.
- **Depends on:** DB‑AP‑002, DB‑AR‑002.

---

### [ ] DB‑FIN‑010: Define Payment Runs Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/payment_runs.ts` exports `paymentRuns` table:  
- `id` (uuid PK), `organization_id` (FK), `status` (enum: draft/processing/completed/cancelled)  
- `total_amount_cents` (int), `initiated_by` (FK users)  
- `payment_date` (date), `bank_account_id` (FK bank_accounts)  
- `summary_json` (JSONB) – breakdown of included bills and amounts  
- `created_at`, `updated_at`

**Related junction:** `payment_run_bills` table (`payment_run_id` FK, `bill_id` FK, `amount_cents` int). Unique on `(payment_run_id, bill_id)`.

**DDD:** Batch payment processing (Bill.com feature).  
**TDD:** Validate status enum, FK constraints, junction table uniqueness.

### Subtasks:
- [ ] DB‑FIN‑010.1: Write schema test for both tables. (AGENT) – `lib/db/src/__tests__/payment-runs.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑010.2: Implement payment_runs and payment_run_bills tables. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AP‑002 (bills), DB‑FIN‑005 (bank accounts).

---

### [ ] DB‑FIN‑011: Define 1099 Tracking Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/1099_tracking.ts` exports `form1099Tracking` table:  
- `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK vendors)  
- `year` (int), `total_payments_cents` (int default 0)  
- `filing_status` (enum: not_started/ready_to_file/filed)  
- `last_filed_date` (date nullable)  
- `created_at`, `updated_at`  
- Unique on `(vendor_id, year)`.

**DDD:** Tracks 1099‑eligible vendor payments for US tax preparation (Bill.com feature).  
**TDD:** Validate unique constraint per vendor per year.

### Subtasks:
- [ ] DB‑FIN‑011.1: Write schema test. (AGENT) – `lib/db/src/__tests__/1099-tracking.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑011.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AP‑001 (vendors).

---

### [ ] DB‑FIN‑012: Define Reconciliation Entries Table (Append‑Only)
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/reconciliation_entries.ts` exports `reconciliationEntries` table:  
- `id` (uuid PK), `organization_id` (FK), `bank_account_id` (FK)  
- `transaction_id` (uuid) – could reference bill_payment or customer_payment  
- `transaction_type` (enum: bill_payment/customer_payment)  
- `external_reference` (text) – bank transaction ID  
- `match_status` (enum: matched/unmatched/flagged)  
- `matched_at` (timestamp nullable)  
- `created_at` (no updates, append‑only)  
- Index on `(bank_account_id, match_status)`, `(transaction_id)`.

**DDD:** Reconciliation workflow support (Bill.com feature).  
**TDD:** Validate append‑only, enum values.

### Subtasks:
- [ ] DB‑FIN‑012.1: Write schema test. (AGENT) – `lib/db/src/__tests__/reconciliation-entries.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑012.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑FIN‑005.

---

### [ ] DB‑FIN‑013: Define AP Inbox Captured Invoices Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/ap_inbox.ts` exports `apInbox` table:  
- `id` (uuid PK), `organization_id` (FK)  
- `source` (enum: email/upload/manual)  
- `raw_file_path` (text) – path to stored PDF/image  
- `extracted_data_json` (JSONB) – OCR‑extracted fields with confidence scores  
- `confidence_score` (numeric nullable) – overall extraction confidence  
- `mapped_bill_id` (FK bills nullable) – the bill created from this capture  
- `status` (enum: pending_review/processed/error)  
- `created_at`, `updated_at`.

**DDD:** Staging area for captured vendor invoices before they become bills (Bill.com inbox feature).  
**TDD:** Validate status enum, JSONB structure for extracted data.

### Subtasks:
- [ ] DB‑FIN‑013.1: Write schema test. (AGENT) – `lib/db/src/__tests__/ap-inbox.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑013.2: Implement table with JSONB extraction data. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AP‑002 (bills – FK can be initially nullable).

---

### [ ] DB‑FIN‑014: Define Collections Activity Log Table (Append‑Only)
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/finance/collections_activity.ts` exports `collectionsActivity` table:  
- `id` (uuid PK), `organization_id` (FK), `customer_id` (FK customers), `invoice_id` (FK AR invoices)  
- `contact_method` (enum: email/phone/in_person), `notes` (text), `promise_to_pay_date` (date nullable)  
- `outcome` (enum: contacted/left_message/no_answer/payment_received/disputed)  
- `created_by` (FK users), `created_at`  
- No updates, no soft delete (append‑only).  
- Index on `(customer_id)`, `(invoice_id)`.

**DDD:** Collections workbench activity tracking (Bill.com feature).  
**TDD:** Validate append‑only, enum values.

### Subtasks:
- [ ] DB‑FIN‑014.1: Write schema test. (AGENT) – `lib/db/src/__tests__/collections-activity.test.ts`  
  **verification:** Red → green.
- [ ] DB‑FIN‑014.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AR‑001, DB‑AR‑002.

---

## Accounts Payable Context

### [ ] DB‑AP‑001: Define Vendors Table (Extended)
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/ap/vendors.ts` exports `vendors` table:  
- `id` (uuid PK), `organization_id` (FK), `company_name`, `contact_name`, `email`, `phone`  
- `tax_id` (EIN/TIN), `payment_terms_days` (int default 30), `default_payment_method_id` (FK nullable)  
- `early_payment_discount_rate` (numeric nullable) – e.g., 0.02 for 2%  
- `early_payment_discount_days` (int nullable) – e.g., 10 for "2/10 Net 30"  
- `remittance_email` (text nullable) – where to send payment notifications  
- `address` (JSONB), `is_1099_eligible` (boolean)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, company_name)`, `(organization_id, email)`.

**DDD:** Vendor aggregate extended with payment preferences and early payment discount fields (Bill.com feature).  
**TDD:** Validate discount fields, JSONB address.

### Subtasks:
- [ ] DB‑AP‑001.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑AP‑001.2: Implement table with extended columns. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑AP‑002: Define Bills Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/ap/bills.ts` exports `bills` table:  
- `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK)  
- `bill_number` (text), `amount_cents` (int), `currency` (text default 'USD'), `exchange_rate` (numeric nullable)  
- `tax_amount_cents` (int default 0), `tax_type` (text nullable)  
- `due_date` (date), `bill_date` (date)  
- `status` (enum: draft/pending_approval/approved/paid/overdue)  
- `approval_workflow_id` (FK nullable), `purchase_order_id` (FK nullable)  
- `line_items` (JSONB array), `memo` (text), `attachments` (text[] for document URLs)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, status)`, `(organization_id, vendor_id, status)`, `(organization_id, due_date)`, `(bill_number)`.

### Subtasks:
- [ ] DB‑AP‑002.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑AP‑002.2: Implement table with currency and tax columns. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AP‑001, DB‑AP‑003 (FK nullable initially).

---

### [ ] DB‑AP‑003: Define Approval Workflows Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/ap/approval_workflows.ts` exports `approvalWorkflows` table:  
- `id` (uuid PK), `organization_id` (FK)  
- `name` (text), `threshold_amount_cents` (int) – bills above this amount require this workflow  
- `steps` (JSONB array of approver assignments)  
- `is_active` (boolean), `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, is_active)`, `(organization_id, threshold_amount_cents)`.

### Subtasks:
- [ ] DB‑AP‑003.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑AP‑003.2: Implement table with JSONB steps. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑AP‑004: Define Purchase Orders Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/ap/purchase_orders.ts` exports `purchaseOrders` table:  
- `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK)  
- `po_number` (text), `amount_cents` (int), `status` (enum: draft/sent/acknowledged/partially_received/received/closed)  
- `line_items` (JSONB array), `expected_delivery_date` (date), `received_at` (timestamp nullable)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, status)`, `(organization_id, vendor_id, status)`.

### Subtasks:
- [ ] DB‑AP‑004.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑AP‑004.2: Implement table. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑AP‑001.

---

## Accounts Receivable Context

### [ ] DB‑AR‑001: Define Customers Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/ar/customers.ts` exports `customers` table:  
- `id` (uuid PK), `organization_id` (FK), `company_name`, `contact_name`, `email`, `phone`  
- `billing_address` (JSONB), `shipping_address` (JSONB)  
- `payment_terms_days` (int default 30), `credit_limit_cents` (int nullable)  
- `tax_id` (text nullable), `is_active` (boolean)  
- `deleted_at` (soft delete), timestamps  
- Index on `(organization_id, company_name)`, `(organization_id, email)`.

**DDD:** Customer aggregate with billing/shipping addresses and credit management.  
**TDD:** Validate JSONB addresses, credit limit constraints.

### Subtasks:
- [ ] DB‑AR‑001.1: Write schema test. (AGENT) – `lib/db/src/__tests__/customers.test.ts`  
  **verification:** Red → green.
- [ ] DB‑AR‑001.2: Implement table with JSONB addresses. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑AR‑002: Define AR Invoices Table (Alias to Financial Invoices)
**Status:** ⏳ Not Started  
**Definition of Done:** AR invoices are the same table as financial invoices (`DB‑FIN‑001`) but accessed through the AR bounded context. No separate table needed.  
**Related Files:** `lib/db/src/schema/finance/invoices.ts` (shared table)

**DDD:** AR context views financial invoices through customer‑focused lens.  
**TDD:** N/A – uses existing financial invoices table.

### Subtasks:
- [ ] DB‑AR‑002.1: Create AR context view/queries for invoices. (AGENT) – `lib/db/src/views/ar/invoices.ts`  
  **verification:** AR queries return customer‑focused invoice data.
- **Depends on:** DB‑FIN‑001.

---

## Phase 2 Financial Dependencies

### Critical Path
```
DB-ORG-001 → (All Financial Tables)
DB-FIN-001 → DB-FIN-002/003/008 (Invoice → Payments → Allocations)
DB-AP-001 → DB-AP-002 → DB-FIN-010 (Vendors → Bills → Payment Runs)
DB-AR-001 → DB-FIN-001 (Customers → Invoices)
```

### Parallel Execution
- **DB-FIN-004** (Categories), **DB-FIN-005** (Bank Accounts), **DB-FIN-006** (Payment Methods) can run in parallel after **DB-ORG-001**
- **DB-AP-001** (Vendors) and **DB-AR-001** (Customers) can run in parallel after **DB-ORG-001**
- **DB-FIN-007** (Idempotency) can run in parallel after **DB-ORG-001**
- **DB-AP-003** (Workflows) and **DB-AP-004** (POs) can run in parallel after **DB-AP-001**

### Cross-Context Dependencies
- All financial tables depend on **DB-ORG-001** for `organization_id` foreign keys
- **DB-FIN-001** (Invoices) serves both AR and shared financial contexts
- **DB-FIN-010** (Payment Runs) depends on both AP bills and bank accounts
- **DB-FIN-014** (Collections) depends on AR customers and invoices
- **DB-FIN-009** migration ensures currency/tax consistency across contexts

### Business Logic Considerations
- Multi-currency support with exchange rates for international operations
- Early payment discounts with "2/10 Net 30" style terms
- Approval workflows for bills above configurable thresholds
- Idempotency tracking prevents duplicate payment processing
- Append-only logs for audit trails (collections, reconciliation)
- OCR integration for AP invoice capture and processing

---

## File Index

### Financial Files
- `TODO-P2-FINANCE.md` - This file (Financial context)
- `TODO-P2-INFRASTRUCTURE.md` - Test Infrastructure, DB Logger, Organizations
- `TODO-P2-IDENTITY.md` - Identity & Access context
- `TODO-P2-APPOINTMENTS.md` - Scheduling & Appointments context
- `TODO-P2-TRACKER.md` - Phase 2 execution tracking and dependencies

### Related Phase Files
- `TODO-P3-FINANCE-API.md` - Financial APIs and workflows
- `TODO-P3-PAYMENT-PROCESSING.md` - Stripe integration and payment flows
- `TODO-P3-AP-AUTOMATION.md` - Bill.com style AP automation

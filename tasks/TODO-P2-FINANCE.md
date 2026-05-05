# TODO-P2-FINANCE.md – Phase 2: Financial Context

This file covers the complete Financial bounded context: Accounts Receivable (AR), Accounts Payable (AP), and shared financial infrastructure. All tables include `organization_id` per ARCH-001 and support Bill.com-style workflows with multi-currency, tax, and approval-workflow capabilities.

---

## Shared Financial Infrastructure

## [ ] DB-FIN-001: Define Invoices Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No invoices table exists. AR and finance features are fully blocked.
**Size:** Small

**Description:** Define the `invoices` table — the primary AR document. Supports multi-currency, line items as JSONB, tax columns, soft delete, and multiple indexed query patterns for status-based dashboards and customer-scoped views.

**Depends on:** DB-ORG-001 (organization FK), DB-AR-001 (customer FK)
**Blocks:** DB-FIN-002 (customer payments), DB-FIN-003 (payment allocations), DB-FIN-008 (credit memos), DB-FIN-009 (multi-currency migration), DB-AR-002, DB-FIN-014 (collections)
**Related Files:** `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/invoices.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `numeric`, `date`, `timestamp`, `jsonb`, `pgEnum`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `invoices` (table), `invoiceStatusEnum`, `insertInvoiceSchema`, `selectInvoiceSchema`, `InsertInvoice`, `Invoice`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/invoices.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `currency` (text NOT NULL default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer NOT NULL default `0`), `tax_type` (text nullable), `status` (pgEnum: `draft|sent|paid|overdue|void`), `due_date` (date NOT NULL), `invoice_date` (date NOT NULL), `line_items` (jsonb NOT NULL default `[]`), `memo` (text nullable), `attachments` (text[] default `{}`), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, customer_id, status)`, `(organization_id, due_date)`, unique `(organization_id, invoice_number)`
- [ ] Zod schemas and types exported; `line_items` validated as array of line-item objects
- [ ] `lib/db/src/__tests__/invoices.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Recurring invoice automation
- Advanced tax engine integration (Avalara, TaxJar)
- Discount line-item support (Phase 3+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/invoices.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`

**Rollback**
- Granularity: file-level — delete `invoices.ts`; no DB change until HUMAN runs `push`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- All monetary amounts stored in cents (integer) — never floating point
- `invoice_number` must be unique per organization, not globally
- Status transitions must be validated at the service layer: `draft → sent → paid|overdue|void`
- `currency` defaults to `USD` but must support ISO 4217 3-letter codes
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- invoices.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Composite unique `(organization_id, invoice_number)` instead of global unique — supports same invoice number across different tenants
- `line_items` JSONB with a Zod refinement schema for array validation (each item: `{ description, quantity, unit_price_cents, total_cents }`)
- `amount_cents` should be derived from sum of line items — validate at service layer, not DB level

**Anti-Patterns**
- Floating-point amounts — currency rounding errors; always use integer cents
- Global unique on `invoice_number` — prevents same invoice number pattern across tenants
- Missing `(organization_id, due_date)` index — overdue-invoice dashboard queries require this

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Invoice` is the core aggregate of the AR bounded context. Business logic for payment allocation, status transitions, and tax calculation belongs in `InvoiceService`.
- TDD: Assert status enum, composite unique index, JSONB `line_items` default, and soft-delete column.
- BDD: Enables "Send invoice to customer" and "Mark invoice as paid" scenarios.
- Deep Module: Shallow storage — payment allocation and tax calculation logic live in service layer.

---

### Subtasks

- [ ] DB-FIN-001.0.25 (AGENT): Read DB-ORG-001 and DB-AR-001 schemas; understand the invoice-customer FK relationship.
  *No action — pause until understood.*

- [ ] DB-FIN-001.0.5 (AGENT): Research Drizzle JSONB array column, `text[]` (PostgreSQL array), and composite unique index syntax (May 2026).

- [ ] DB-FIN-001.0.75 (AGENT): Reason about `line_items` Zod validation schema structure; define the line-item object shape.

- [ ] DB-FIN-001.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/invoices.test.ts`
  **Verification:** RED.

- [ ] DB-FIN-001.2 (AGENT): Implement `invoices` table, enums, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-FIN-001.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-FIN-002: Define Customer Payments Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No customer payments table. Payment recording and Stripe reconciliation are blocked.
**Size:** Small

**Description:** Define the `customer_payments` table for recording payments received from customers, with Stripe integration fields, payment method tracking, and status lifecycle management.

**Depends on:** DB-AR-001 (customers FK), DB-FIN-001 (invoices FK, nullable)
**Blocks:** DB-FIN-003 (payment allocations)
**Related Files:** `lib/db/src/schema/finance/customer_payments.ts`, `lib/db/src/__tests__/customer-payments.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `customerPayments` (table), `paymentMethodEnum`, `paymentStatusEnum`, `insertCustomerPaymentSchema`, `selectCustomerPaymentSchema`, `InsertCustomerPayment`, `CustomerPayment`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/customer_payments.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices, nullable), `amount_cents` (integer NOT NULL), `currency` (text default `USD`), `payment_method` (pgEnum: `card|ach|wire|check`), `status` (pgEnum: `pending|succeeded|failed|refunded`), `processed_at` (timestamp nullable), `failure_reason` (text nullable), `stripe_payment_intent_id` (text nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, customer_id)`, `(invoice_id)`, unique `(stripe_payment_intent_id)` where not null
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/customer-payments.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Subscription/recurring billing
- Advanced chargeback/dispute management
- PCI-DSS card storage

**Safety Boundaries**
- Never store raw card numbers, CVVs, or full bank account numbers — use Stripe/payment processor tokenization
- Never modify generated code paths
- Never commit secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/customer_payments.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/customer-payments.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `customer_payments.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Amounts in cents (integer) — no floats
- Refund amounts must never exceed original payment amount (service layer validation)
- `stripe_payment_intent_id` is unique per payment — use as idempotency key
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- customer-payments.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Partial index `WHERE stripe_payment_intent_id IS NOT NULL` for the Stripe ID unique constraint
- `invoice_id` nullable allows recording payments not yet allocated to a specific invoice

**Anti-Patterns**
- Storing raw payment method details — PCI-DSS violation
- Synchronous external API calls inside DB operations

**DDD / TDD / BDD / Deep Module notes**
- DDD: `CustomerPayment` is a financial transaction aggregate. Complex payment processing logic lives in `PaymentService`.
- TDD: Assert status enum, FK constraints, payment method enum.
- BDD: Supports "Record customer payment" and "Process Stripe payment" scenarios.
- Deep Module: Shallow storage; complex payment processing lives in service layer.

---

### Subtasks

- [ ] DB-FIN-002.0.25 (AGENT): Read DB-AR-001 and DB-FIN-001 schemas for FK context.
- [ ] DB-FIN-002.0.5 (AGENT): [N/A] — same Drizzle patterns as prior tasks.
- [ ] DB-FIN-002.0.75 (AGENT): Confirm `stripe_payment_intent_id` partial unique index syntax in Drizzle.
- [ ] DB-FIN-002.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/customer-payments.test.ts`
  **Verification:** RED.
- [ ] DB-FIN-002.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`.
  **Verification:** GREEN; `pnpm run typecheck` clean.
- [ ] DB-FIN-002.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-003: Define Payment Allocations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment allocations table. Multi-invoice payment splitting is blocked.
**Size:** Small

**Description:** Define the `payment_allocations` junction table for allocating a single customer payment across multiple invoices — a core Bill.com feature. Allocation amounts are stored in cents with per-organization scoping.

**Depends on:** DB-FIN-001 (invoices), DB-FIN-002 (customer payments)
**Blocks:** [N/A] — enables Phase 3 payment allocation service
**Related Files:** `lib/db/src/schema/finance/payment_allocations.ts`, `lib/db/src/__tests__/payment-allocations.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `integer`, `timestamp`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `paymentAllocations` (table), `insertPaymentAllocationSchema`, `selectPaymentAllocationSchema`, `InsertPaymentAllocation`, `PaymentAllocation`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/payment_allocations.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `payment_id` (FK → customer_payments), `invoice_id` (FK → invoices), `amount_cents` (integer NOT NULL), `allocated_at` (timestamp NOT NULL, `defaultNow()`), `created_at`
- [ ] Indexes: `(payment_id)`, `(invoice_id)`, `(organization_id, allocated_at)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/payment-allocations.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Allocation reversal/undo flows
- Partial-allocation dispute workflows

**Safety Boundaries**
- Never modify generated code paths; never commit secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/payment_allocations.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/payment-allocations.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `payment_allocations.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Total allocations per payment must not exceed payment `amount_cents` (service layer validation)
- All queries must include `organization_id`
- Allocation amounts must be positive (> 0)

**Verification**
```bash
pnpm --filter @workspace/db test -- payment-allocations.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Service layer should validate: `SUM(amount_cents) WHERE payment_id = X` ≤ payment amount before inserting allocation

**Anti-Patterns**
- Negative allocation amounts
- No check that total allocations exceed payment amount (over-allocation)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Junction table for allocating payments to invoices. Allocation logic lives in `AllocationService`.
- TDD: Assert FK constraints and index existence.
- BDD: Supports "Apply payment to multiple invoices" scenario.
- Deep Module: Simple junction table; allocation rules in service layer.

---

### Subtasks
- [ ] DB-FIN-003.0.25 (AGENT): Read DB-FIN-001 and DB-FIN-002 schemas. No action — pause.
- [ ] DB-FIN-003.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-003.0.75 (AGENT): Confirm that `allocated_at` and `created_at` serve different purposes (allocated_at is business event time; created_at is record-creation time).
- [ ] DB-FIN-003.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/payment-allocations.test.ts` **Verification:** RED.
- [ ] DB-FIN-003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-003.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-004: Define Expense Categories Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No expense categories. AP expense classification and reporting are blocked.
**Size:** Small

**Description:** Define the `expense_categories` table with hierarchical parent-category support, per-tenant scoping, and soft delete. Used to classify vendor bills and expenses for reporting.

**Depends on:** DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 AP expense classification
**Related Files:** `lib/db/src/schema/finance/expense_categories.ts`, `lib/db/src/__tests__/expense-categories.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `boolean`, `timestamp`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `expenseCategories` (table), `insertExpenseCategorySchema`, `selectExpenseCategorySchema`, `InsertExpenseCategory`, `ExpenseCategory`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/expense_categories.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `parent_category_id` (uuid nullable, self-referential FK → `expense_categories.id`), `is_active` (boolean NOT NULL default `true`), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, name)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/expense-categories.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Category-based budgeting
- Category permissions
- More than 2 levels of hierarchy (validate in service layer)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/expense_categories.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/expense-categories.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `expense_categories.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Validate no circular references in hierarchy at service layer (parent cannot be a descendant)
- Category names must be unique per organization
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- expense-categories.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Self-referential FK with `onDelete: 'set null'` prevents cascade orphan chains
- `is_active` flag allows disabling categories without deleting them (preserves historical records)

**Anti-Patterns**
- Unlimited recursion depth in hierarchy — restrict to max 3 levels in service layer
- Circular parent references — validate before insert

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ExpenseCategory` is a value object for AP classification. Hierarchy logic in service layer.
- TDD: Assert composite unique, self-referential FK.
- BDD: Supports "Categorize vendor bill" scenario.
- Deep Module: Shallow hierarchical storage; category validation in service layer.

---

### Subtasks
- [ ] DB-FIN-004.0.25 (AGENT): Read DB-ORG-001 schema. No action — pause.
- [ ] DB-FIN-004.0.5 (AGENT): Research Drizzle self-referential FK syntax (May 2026).
- [ ] DB-FIN-004.0.75 (AGENT): Confirm self-referential FK with `onDelete: 'set null'` is the right cascade behavior.
- [ ] DB-FIN-004.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-004.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-004.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-005: Define Bank Accounts Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bank accounts table. Payment run disbursement and reconciliation are blocked.
**Size:** Small

**Description:** Define the `bank_accounts` table for storing organization bank accounts with Plaid integration readiness, balance tracking, and account-type classification.

**Depends on:** DB-ORG-001
**Blocks:** DB-FIN-010 (payment runs), DB-FIN-012 (reconciliation)
**Related Files:** `lib/db/src/schema/finance/bank_accounts.ts`, `lib/db/src/__tests__/bank-accounts.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `bankAccounts` (table), `accountTypeEnum`, `insertBankAccountSchema`, `selectBankAccountSchema`, `InsertBankAccount`, `BankAccount`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/bank_accounts.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `account_name` (text NOT NULL), `account_type` (pgEnum: `checking|savings|credit_card`), `account_number_last_four` (text NOT NULL), `routing_number` (text nullable), `balance_cents` (integer NOT NULL default `0`), `currency` (text NOT NULL default `USD`), `is_default` (boolean default `false`), `plaid_account_id` (text nullable), `status` (pgEnum: `active|inactive`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, account_type)`, unique `(plaid_account_id)` where not null
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/bank-accounts.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Full account number storage (PCI/regulatory risk)
- Real-time balance sync with Plaid
- Multi-currency balance conversion

**Safety Boundaries**
- Never store full account numbers or routing numbers in plain text — store only last four digits; routing number is lower-risk but should be treated carefully
- Never modify generated code paths; never commit secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/bank_accounts.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/bank-accounts.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `bank_accounts.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Balance in cents (integer) — no floats
- Only one `is_default = true` account per organization (validate at service layer)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- bank-accounts.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Partial index `WHERE plaid_account_id IS NOT NULL` for Plaid ID uniqueness
- `is_default` enforcement: service layer sets all others to `false` before setting the new default

**Anti-Patterns**
- Storing full account numbers — regulatory and security risk
- Multiple default accounts per org (application-level enforcement required)

**DDD / TDD / BDD / Deep Module notes**
- DDD: `BankAccount` aggregate for AP disbursement. Balance sync and Plaid logic in service layer.
- TDD: Assert account type enum, Plaid ID partial unique.
- BDD: Supports "Select bank account for payment run" scenario.
- Deep Module: Shallow storage; Plaid sync in external service adapter.

---

### Subtasks
- [ ] DB-FIN-005.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-FIN-005.0.5 (AGENT): Confirm partial unique index syntax in Drizzle.
- [ ] DB-FIN-005.0.75 (AGENT): Reason about whether routing numbers should be nullable or required; confirm they are lower-sensitivity than account numbers.
- [ ] DB-FIN-005.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-005.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-005.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-006: Define Payment Methods Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment methods table. Vendor/customer payment preferences cannot be stored.
**Size:** Small

**Description:** Define the `payment_methods` table storing payment preferences for vendors and customers, with JSONB billing addresses and support for ACH, wire, check, and card payment types.

**Depends on:** DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 payment processing
**Related Files:** `lib/db/src/schema/finance/payment_methods.ts`, `lib/db/src/__tests__/payment-methods.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `date`, `boolean`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `paymentMethods` (table), `paymentMethodTypeEnum`, `entityTypeEnum`, `insertPaymentMethodSchema`, `selectPaymentMethodSchema`, `InsertPaymentMethod`, `PaymentMethod`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/payment_methods.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (pgEnum: `vendor|customer`), `entity_id` (uuid NOT NULL), `method_type` (pgEnum: `ach|check|wire|card`), `account_number_last_four` (text nullable), `routing_number` (text nullable), `card_brand` (text nullable), `expiry_date` (date nullable), `is_default` (boolean default `false`), `billing_address` (jsonb default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, entity_type, entity_id)`, `(entity_id, method_type)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/payment-methods.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Full card number storage (PCI-DSS scope)
- Real tokenization logic (Stripe handles this)

**Safety Boundaries**
- Never store full card numbers — only `last_four` and `card_brand`
- Never modify generated code paths; never commit secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/payment_methods.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/payment-methods.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `payment_methods.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- `entity_id` references either a vendor or customer depending on `entity_type` — polymorphic FK (no DB-level FK possible; validate at service layer)
- Only one `is_default = true` per `(entity_id, entity_type)` (service layer validation)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- payment-methods.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Polymorphic `entity_id` with `entity_type` discriminator — no DB FK constraint (cannot FK to two tables); enforce referential integrity at service layer
- `billing_address` JSONB schema: `{ street, city, state, postal_code, country }`

**Anti-Patterns**
- DB-level FK on `entity_id` — impossible for polymorphic references; use service-layer validation
- Storing full card details — PCI-DSS violation

**DDD / TDD / BDD / Deep Module notes**
- DDD: `PaymentMethod` value object for vendor/customer payment preferences. Validation in service layer.
- TDD: Assert enums, JSONB default, polymorphic entity index.
- BDD: Supports "Set default payment method" scenario.
- Deep Module: Shallow storage; payment method validation in service layer.

---

### Subtasks
- [ ] DB-FIN-006.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-FIN-006.0.5 (AGENT): Research JSONB billing address validation in Zod (object with known keys).
- [ ] DB-FIN-006.0.75 (AGENT): Confirm polymorphic FK design decision — no DB-level FK, service-layer only.
- [ ] DB-FIN-006.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-006.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-006.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-007: Define Idempotency Records Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No idempotency tracking exists. Duplicate payment processing cannot be prevented.
**Size:** Small

**Description:** Define the `idempotency_records` table for centralized idempotency key tracking across financial operations. Services check this table before processing to prevent duplicate transactions.

**Depends on:** DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 payment processing idempotency
**Related Files:** `lib/db/src/schema/finance/idempotency_records.ts`, `lib/db/src/__tests__/idempotency-records.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `idempotencyRecords` (table), `insertIdempotencyRecordSchema`, `selectIdempotencyRecordSchema`, `InsertIdempotencyRecord`, `IdempotencyRecord`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/idempotency_records.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `key` (text NOT NULL), `response_body` (jsonb nullable — cached response for replay), `expires_at` (timestamp NOT NULL), `created_at`
- [ ] Composite unique constraint on `(organization_id, key)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/idempotency-records.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Global (cross-tenant) idempotency key uniqueness
- Idempotency key TTL enforcement via DB triggers (use application-layer cleanup)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/idempotency_records.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/idempotency-records.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `idempotency_records.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Keys are unique per organization, not globally
- Expired records must be cleaned up periodically (cron job or at request time)
- Store optional `response_body` to allow replaying cached responses for idempotent retries

**Verification**
```bash
pnpm --filter @workspace/db test -- idempotency-records.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Check-then-insert pattern in service: `SELECT id FROM idempotency_records WHERE organization_id = ? AND key = ? AND expires_at > NOW()`; if found, return cached response; if not found, proceed and insert
- Use UUID v4 as client-provided idempotency key format

**Anti-Patterns**
- Global unique on `key` — prevents same key pattern across tenants
- Not caching response — forces client to poll for result on retry

**DDD / TDD / BDD / Deep Module notes**
- DDD: Infrastructure concern for preventing duplicate financial operations. Logic in `IdempotencyService`.
- TDD: Assert composite unique constraint.
- BDD: Supports "Retry payment without double-charging" scenario.
- Deep Module: Simple lookup table; idempotency logic in service layer.

---

### Subtasks
- [ ] DB-FIN-007.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-FIN-007.0.5 (AGENT): [N/A] — same Drizzle patterns.
- [ ] DB-FIN-007.0.75 (AGENT): Confirm `response_body` JSONB nullable is sufficient for caching full API responses.
- [ ] DB-FIN-007.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-007.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-007.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-008: Define Credit Memos Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No credit memos table. Credit issuance and AR balance adjustment are blocked.
**Size:** Small

**Description:** Define the `credit_memos` table for issuing and tracking customer credits. Supports applied vs unapplied credits and optional linkage to specific invoices.

**Depends on:** DB-AR-001 (customers FK), DB-FIN-001 (invoices FK, nullable)
**Blocks:** [N/A] — enables Phase 3 credit management
**Related Files:** `lib/db/src/schema/finance/credit_memos.ts`, `lib/db/src/__tests__/credit-memos.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `creditMemos` (table), `creditMemoStatusEnum`, `insertCreditMemoSchema`, `selectCreditMemoSchema`, `InsertCreditMemo`, `CreditMemo`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/credit_memos.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices, nullable), `amount_cents` (integer NOT NULL), `reason` (text nullable), `status` (pgEnum: `draft|issued|applied|void`), `applied_amount_cents` (integer NOT NULL default `0`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, customer_id)`, `(invoice_id)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/credit-memos.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automated credit application (Phase 3+ service)
- Credit memo approval workflows

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/credit_memos.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/credit-memos.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `credit_memos.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- `applied_amount_cents` must never exceed `amount_cents` (service layer validation)
- All queries must include `organization_id`
- Status transitions: `draft → issued → applied|void`

**Verification**
```bash
pnpm --filter @workspace/db test -- credit-memos.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Track `applied_amount_cents` separately from `amount_cents` to support partial credit application
- `invoice_id` nullable allows unapplied (floating) credits

**Anti-Patterns**
- Applying more credit than the memo amount — validate before update
- No status enum — invalid status values enter the DB silently

**DDD / TDD / BDD / Deep Module notes**
- DDD: `CreditMemo` reduces open invoice balances; application logic in `CreditService`.
- TDD: Assert status enum, FK constraints.
- BDD: Supports "Issue credit memo to customer" scenario.
- Deep Module: Shallow storage; credit application logic in service layer.

---

### Subtasks
- [ ] DB-FIN-008.0.25 (AGENT): Read DB-AR-001 and DB-FIN-001 schemas. No action — pause.
- [ ] DB-FIN-008.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-008.0.75 (AGENT): Confirm nullable `invoice_id` allows unapplied credits without orphan issues.
- [ ] DB-FIN-008.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-008.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-008.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-009: Multi-Currency & Tax Migration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Currency and tax columns are included in DB-FIN-001 (invoices) from initial definition. This task ensures consistency across bills (DB-AP-002) and any other tables that need the same columns.
**Size:** Small

**Description:** Verify and enforce that `currency`, `exchange_rate`, `tax_amount_cents`, and `tax_type` columns are consistently present across invoices, bills, and AR invoices. Create a schema-consistency checklist rather than a migration (since `drizzle-kit push` handles schema state).

**Depends on:** DB-AP-002 (bills), DB-FIN-001 (invoices)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/schema/ap/bills.ts`

**Imports / Exports** — [N/A] — verification task

**Definition of Done**
- [ ] `invoices.ts`, `bills.ts` all have: `currency` (text default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer default `0`), `tax_type` (text nullable)
- [ ] Schema is consistent — no table has these columns defined differently from the standard
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Exchange rate auto-lookup services
- Tax engine integration

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/invoices.ts` (if adjustments needed), `lib/db/src/schema/ap/bills.ts`
- Tests added/updated in: [N/A] — covered by individual table tests
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert individual schema files
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow** — Column names and types must be identical across all financial document tables.

**Verification**
```bash
pnpm run typecheck
# Grep for consistency
grep -r "exchange_rate" lib/db/src/schema/
```

**Advanced Code Patterns** — Consider a shared `multiCurrencyColumns` Drizzle column group for DRY column definitions.

**Anti-Patterns** — Inconsistent column naming across tables (`currency_code` vs `currency`).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Enables international payment workflows across AP and AR contexts.
- TDD: Covered by individual table tests in DB-FIN-001 and DB-AP-002.
- BDD: Supports "Process invoice in EUR" scenario.
- Deep Module: [N/A] — schema consistency task.

---

### Subtasks
- [ ] DB-FIN-009.0.25 (AGENT): Read DB-FIN-001 and DB-AP-002 schemas. No action — pause.
- [ ] DB-FIN-009.0.5 (AGENT): [N/A] — schema consistency check.
- [ ] DB-FIN-009.0.75 (AGENT): Compare currency/tax columns across tables; note any discrepancies.
- [ ] DB-FIN-009.1 (AGENT): Patch any inconsistent tables; run typecheck. **Verification:** `pnpm run typecheck` clean.
- [ ] DB-FIN-009.2 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-010: Define Payment Runs Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment runs table. Batch AP disbursements (Bill.com feature) are blocked.
**Size:** Small

**Description:** Define the `payment_runs` table and its `payment_run_bills` junction table for batch payment processing — enabling bulk disbursement of multiple vendor bills in a single bank transfer.

**Depends on:** DB-AP-002 (bills FK), DB-FIN-005 (bank_accounts FK), DB-IDENTITY-001 (initiated_by FK)
**Blocks:** [N/A] — enables Phase 3 AP automation
**Related Files:** `lib/db/src/schema/finance/payment_runs.ts`, `lib/db/src/__tests__/payment-runs.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `date`, `timestamp`, `pgEnum`, `jsonb`, `uniqueIndex`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `paymentRuns` (table), `paymentRunBills` (table), `paymentRunStatusEnum`, `insertPaymentRunSchema`, `selectPaymentRunSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/finance/payment_runs.ts` exports both `paymentRuns` and `paymentRunBills` tables
- [ ] `paymentRuns` columns: `id` (uuid PK), `organization_id` (FK), `status` (pgEnum: `draft|processing|completed|cancelled`), `total_amount_cents` (integer), `initiated_by` (FK → users), `payment_date` (date), `bank_account_id` (FK → bank_accounts), `summary_json` (jsonb), `created_at`, `updated_at`
- [ ] `paymentRunBills` columns: `id` (uuid PK), `payment_run_id` (FK → payment_runs), `bill_id` (FK → bills), `amount_cents` (integer NOT NULL), `created_at`
- [ ] Composite unique on `(payment_run_id, bill_id)` in junction table
- [ ] Indexes: `(organization_id, status)` on payment_runs; `(payment_run_id)`, `(bill_id)` on junction
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/payment-runs.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- ACH file generation
- Bank API integration

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/payment_runs.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/payment-runs.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `payment_runs.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Status transitions: `draft → processing → completed|cancelled`
- `total_amount_cents` must equal sum of all `paymentRunBills.amount_cents` (service layer validation)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- payment-runs.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `summary_json` JSONB stores a snapshot of included bills and amounts for audit purposes even after bills are modified.

**Anti-Patterns** — No composite unique on `(payment_run_id, bill_id)` — allows same bill to appear multiple times in a run.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `PaymentRun` aggregate for batch AP disbursement. Processing logic in `PaymentRunService`.
- TDD: Assert both tables, junction unique constraint.
- BDD: Supports "Process batch vendor payments" scenario.
- Deep Module: Two related tables; complex batch logic in service layer.

---

### Subtasks
- [ ] DB-FIN-010.0.25 (AGENT): Read DB-AP-002, DB-FIN-005, DB-IDENTITY-001. No action — pause.
- [ ] DB-FIN-010.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-010.0.75 (AGENT): Confirm exporting two tables from one file is the right structure.
- [ ] DB-FIN-010.1 (AGENT): Write failing schema test for both tables. **Verification:** RED.
- [ ] DB-FIN-010.2 (AGENT): Implement both tables, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-010.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-011: Define 1099 Tracking Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking table. US tax reporting for 1099-eligible vendors is blocked.
**Size:** Small

**Description:** Define the `form_1099_tracking` table for tracking annual 1099 payment totals per vendor, enabling year-end US tax filing preparation.

**Depends on:** DB-AP-001 (vendors FK)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/1099_tracking.ts`, `lib/db/src/__tests__/1099-tracking.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `integer`, `date`, `timestamp`, `pgEnum`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `form1099Tracking` (table), `filingStatusEnum`, `insertForm1099Schema`, `selectForm1099Schema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/finance/1099_tracking.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `year` (integer NOT NULL), `total_payments_cents` (integer NOT NULL default `0`), `filing_status` (pgEnum: `not_started|ready_to_file|filed`), `last_filed_date` (date nullable), `created_at`, `updated_at`
- [ ] Composite unique on `(vendor_id, year)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/1099-tracking.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Actual IRS electronic filing integration
- State-level tax tracking

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/1099_tracking.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/1099-tracking.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — Granularity: file-level. Halt condition: typecheck failure.

**Rules to Follow** — One record per vendor per year; `year` is a 4-digit integer (validate at service layer).

**Verification**
```bash
pnpm --filter @workspace/db test -- 1099-tracking.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `total_payments_cents` updated incrementally as bills are paid — avoids expensive aggregation at report time.

**Anti-Patterns** — Non-unique `(vendor_id, year)` — allows duplicate annual records.

**DDD / TDD / BDD / Deep Module notes**
- DDD: 1099 tracking is a US-specific compliance aggregate in the AP context.
- TDD: Assert composite unique constraint on `(vendor_id, year)`.
- BDD: Supports "Generate 1099 report for vendor" scenario.
- Deep Module: Shallow storage; filing logic in `TaxReportingService`.

---

### Subtasks
- [ ] DB-FIN-011.0.25 (AGENT): Read DB-AP-001 schema. No action — pause.
- [ ] DB-FIN-011.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-011.0.75 (AGENT): Confirm `year` as integer is appropriate (vs date type).
- [ ] DB-FIN-011.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-011.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-011.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-012: Define Reconciliation Entries Table (Append-Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No reconciliation table. Bank statement matching and audit trail are blocked.
**Size:** Small

**Description:** Define the append-only `reconciliation_entries` table for matching bank transactions to recorded payments. No updates or deletes — records are immutable for audit purposes.

**Depends on:** DB-FIN-005 (bank_accounts FK)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/reconciliation_entries.ts`, `lib/db/src/__tests__/reconciliation-entries.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `reconciliationEntries` (table), `matchStatusEnum`, `transactionTypeEnum`, `insertReconciliationEntrySchema`, `selectReconciliationEntrySchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/finance/reconciliation_entries.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `bank_account_id` (FK → bank_accounts), `transaction_id` (uuid), `transaction_type` (pgEnum: `bill_payment|customer_payment`), `external_reference` (text), `match_status` (pgEnum: `matched|unmatched|flagged`), `matched_at` (timestamp nullable), `created_at` (NO `updated_at` — append-only)
- [ ] Indexes: `(bank_account_id, match_status)`, `(transaction_id)`
- [ ] No `deleted_at` column — append-only
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/reconciliation-entries.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automatic bank feed import
- Machine-learning-based transaction matching

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/reconciliation_entries.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/reconciliation-entries.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — Granularity: file-level — delete `reconciliation_entries.ts`. Halt condition: typecheck failure.

**Rules to Follow**
- No UPDATE operations on this table — append-only; match status changes create new records
- No `deleted_at` — audit integrity requires all records remain visible
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- reconciliation-entries.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Append-only pattern ensures a complete audit trail of all reconciliation actions.

**Anti-Patterns** — Adding `updated_at` or `deleted_at` — defeats append-only audit integrity.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only reconciliation log in the Finance bounded context.
- TDD: Assert no `updated_at` column; assert both status and type enums.
- BDD: Supports "Reconcile bank statement" scenario.
- Deep Module: Pure storage; matching logic in `ReconciliationService`.

---

### Subtasks
- [ ] DB-FIN-012.0.25 (AGENT): Read DB-FIN-005. No action — pause.
- [ ] DB-FIN-012.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-012.0.75 (AGENT): Confirm append-only design — no `updated_at`, no `deleted_at`.
- [ ] DB-FIN-012.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-012.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-012.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-013: Define AP Inbox Captured Invoices Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP inbox table. Vendor invoice capture (email/OCR workflow) is blocked.
**Size:** Small

**Description:** Define the `ap_inbox` staging table for captured vendor invoices before they become approved bills. Supports email capture, file upload, and manual entry with OCR-extracted JSONB data and confidence scoring.

**Depends on:** DB-AP-002 (bills FK, nullable)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/ap_inbox.ts`, `lib/db/src/__tests__/ap-inbox.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `numeric`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `apInbox` (table), `apSourceEnum`, `apInboxStatusEnum`, `insertApInboxSchema`, `selectApInboxSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/finance/ap_inbox.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `source` (pgEnum: `email|upload|manual`), `raw_file_path` (text nullable), `extracted_data_json` (jsonb nullable), `confidence_score` (numeric nullable), `mapped_bill_id` (FK → bills, nullable), `status` (pgEnum: `pending_review|processed|error`), `created_at`, `updated_at`
- [ ] Index on `(organization_id, status)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/ap-inbox.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- OCR service integration (Phase 3+ AI feature)
- Email ingestion pipeline

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/ap_inbox.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/ap-inbox.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `raw_file_path` stores the path to the stored file, not file content
- `extracted_data_json` schema: `{ vendor_name, amount, due_date, line_items, raw_text }` with confidence per field
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- ap-inbox.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `extracted_data_json` includes field-level confidence scores enabling human-review UI to highlight low-confidence fields.

**Anti-Patterns** — Storing raw file content in DB — use file storage (S3/Cloudflare R2) and store path only.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Staging area for captured vendor invoices before promotion to bills. OCR logic in external AI service.
- TDD: Assert status enum, source enum, JSONB nullable.
- BDD: Supports "Review captured invoice from email" scenario.
- Deep Module: Shallow staging table; OCR and extraction logic in AI services.

---

### Subtasks
- [ ] DB-FIN-013.0.25 (AGENT): Read DB-AP-002. No action — pause.
- [ ] DB-FIN-013.0.5 (AGENT): Research JSONB schema for OCR confidence data structure.
- [ ] DB-FIN-013.0.75 (AGENT): Confirm `raw_file_path` vs `raw_file_url` — file storage strategy.
- [ ] DB-FIN-013.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-013.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-013.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-FIN-014: Define Collections Activity Log Table (Append-Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collections activity table. AR collections workbench history is blocked.
**Size:** Small

**Description:** Define the append-only `collections_activity` table for recording AR collections interactions — calls, emails, and promises to pay. Immutable audit trail for collection team activity.

**Depends on:** DB-AR-001 (customers FK), DB-FIN-001 (invoices FK), DB-IDENTITY-001 (created_by FK)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/collections_activity.ts`, `lib/db/src/__tests__/collections-activity.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `date`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `collectionsActivity` (table), `contactMethodEnum`, `outcomeEnum`, `insertCollectionsActivitySchema`, `selectCollectionsActivitySchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/finance/collections_activity.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices), `contact_method` (pgEnum: `email|phone|in_person`), `notes` (text nullable), `promise_to_pay_date` (date nullable), `outcome` (pgEnum: `contacted|left_message|no_answer|payment_received|disputed`), `created_by` (FK → users), `created_at` (NO `updated_at`, NO `deleted_at` — append-only)
- [ ] Indexes: `(customer_id)`, `(invoice_id)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/collections-activity.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automated collections escalation
- Legal action tracking

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/collections_activity.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/collections-activity.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Append-only: no UPDATE, no DELETE, no `updated_at`, no `deleted_at`
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- collections-activity.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Append-only log maintains complete activity history for compliance and dispute resolution.

**Anti-Patterns** — Adding update/delete capability defeats the audit-trail purpose.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only collections log in the AR bounded context.
- TDD: Assert enums, no `updated_at`, no `deleted_at`.
- BDD: Supports "Log collection call with customer" scenario.
- Deep Module: Pure storage; collections workflow logic in `CollectionsService`.

---

### Subtasks
- [ ] DB-FIN-014.0.25 (AGENT): Read DB-AR-001, DB-FIN-001, DB-IDENTITY-001. No action — pause.
- [ ] DB-FIN-014.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-FIN-014.0.75 (AGENT): Confirm append-only design (no update/delete).
- [ ] DB-FIN-014.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-FIN-014.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-FIN-014.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## Accounts Payable Context

## [ ] DB-AP-001: Define Vendors Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No vendors table. AP vendor management, bills, and payment runs are blocked.
**Size:** Small

**Description:** Define the `vendors` table with extended payment preferences (early payment discounts, remittance email) and JSONB address — the foundation of all AP workflows.

**Depends on:** DB-ORG-001
**Blocks:** DB-AP-002 (bills), DB-AP-004 (POs), DB-FIN-011 (1099 tracking), DB-FIN-006 (payment methods — vendor FK)
**Related Files:** `lib/db/src/schema/ap/vendors.ts`, `lib/db/src/__tests__/vendors.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `numeric`, `boolean`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `vendors` (table), `insertVendorSchema`, `selectVendorSchema`, `InsertVendor`, `Vendor`

**Definition of Done**
- [ ] `lib/db/src/schema/ap/vendors.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `company_name` (text NOT NULL), `contact_name` (text nullable), `email` (text nullable), `phone` (text nullable), `tax_id` (text nullable), `payment_terms_days` (integer NOT NULL default `30`), `default_payment_method_id` (uuid nullable), `early_payment_discount_rate` (numeric nullable), `early_payment_discount_days` (integer nullable), `remittance_email` (text nullable), `address` (jsonb default `{}`), `is_1099_eligible` (boolean NOT NULL default `false`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, company_name)`, `(organization_id, email)`
- [ ] Zod schemas and types exported; address validated as structured object
- [ ] `lib/db/src/__tests__/vendors.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Vendor performance metrics
- Automated vendor onboarding portal

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/ap/vendors.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/vendors.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `early_payment_discount_rate` in decimal (e.g., `0.02` for 2%) — validate 0 ≤ rate ≤ 1 at service layer
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- vendors.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Early payment discount modeled as "2/10 Net 30": `early_payment_discount_rate = 0.02`, `early_payment_discount_days = 10`, `payment_terms_days = 30`.

**Anti-Patterns** — Storing `tax_id` without encryption consideration — for US EIN/TIN, assess whether field-level encryption is needed in your compliance environment.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Vendor` aggregate root in the AP bounded context. Payment terms and discount logic in `VendorService`.
- TDD: Assert JSONB address default, nullable discount fields.
- BDD: Supports "Add new vendor" and "Set early payment discount" scenarios.
- Deep Module: Shallow storage; payment preference logic in service layer.

---

### Subtasks
- [ ] DB-AP-001.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-AP-001.0.5 (AGENT): Research JSONB address validation in Zod and `numeric` type in Drizzle for discount rates.
- [ ] DB-AP-001.0.75 (AGENT): Confirm `tax_id` sensitivity and whether field-level encryption is in scope for Phase 2.
- [ ] DB-AP-001.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-AP-001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-AP-001.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-AP-002: Define Bills Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bills table. AP bill management, approval workflows, and payment runs are blocked.
**Size:** Small

**Description:** Define the `bills` table — the core AP document — with approval workflow support, multi-currency, JSONB line items, and purchase order linkage.

**Depends on:** DB-AP-001 (vendors FK), DB-AP-003 (approval_workflows FK, nullable initially)
**Blocks:** DB-FIN-009, DB-FIN-010, DB-FIN-013, DB-AP-004
**Related Files:** `lib/db/src/schema/ap/bills.ts`, `lib/db/src/__tests__/bills.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `numeric`, `date`, `timestamp`, `jsonb`, `pgEnum`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `bills` (table), `billStatusEnum`, `insertBillSchema`, `selectBillSchema`, `InsertBill`, `Bill`

**Definition of Done**
- [ ] `lib/db/src/schema/ap/bills.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `bill_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `currency` (text default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer default `0`), `tax_type` (text nullable), `due_date` (date NOT NULL), `bill_date` (date NOT NULL), `status` (pgEnum: `draft|pending_approval|approved|paid|overdue`), `approval_workflow_id` (FK → approval_workflows, nullable), `purchase_order_id` (FK → purchase_orders, nullable), `line_items` (jsonb default `[]`), `memo` (text nullable), `attachments` (text[] default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, vendor_id, status)`, `(organization_id, due_date)`, unique `(organization_id, bill_number)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/bills.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Complex multi-step approval hierarchies
- Automated bill processing/OCR (Phase 3+ AI)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/ap/bills.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/bills.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Status transitions: `draft → pending_approval → approved → paid|overdue` (service layer state machine)
- Amounts in cents; bill_number unique per organization
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- bills.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Mirror the `invoices` table structure to maintain consistency between AP and AR document schemas.

**Anti-Patterns** — Bypassing approval workflows for high-value bills — enforce in service layer.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Bill` aggregate in the AP bounded context. Approval workflow logic in `BillService`.
- TDD: Assert status enum, composite unique index, JSONB line items default.
- BDD: Supports "Create and approve vendor bill" scenario.
- Deep Module: Shallow storage; approval routing in service layer.

---

### Subtasks
- [ ] DB-AP-002.0.25 (AGENT): Read DB-AP-001 and DB-FIN-001 schemas (bills mirror invoices). No action — pause.
- [ ] DB-AP-002.0.5 (AGENT): [N/A] — same patterns as DB-FIN-001.
- [ ] DB-AP-002.0.75 (AGENT): Confirm nullable FKs for approval_workflow_id and purchase_order_id (circular dep avoidance).
- [ ] DB-AP-002.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-AP-002.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-AP-002.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-AP-003: Define Approval Workflows Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No approval workflows table. Multi-step bill approval is blocked.
**Size:** Small

**Description:** Define the `approval_workflows` table for configuring multi-step approval chains triggered by bill amount thresholds. Steps stored as JSONB array of approver assignments.

**Depends on:** DB-ORG-001
**Blocks:** DB-AP-002 (bills reference this via nullable FK)
**Related Files:** `lib/db/src/schema/ap/approval_workflows.ts`, `lib/db/src/__tests__/approval-workflows.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `approvalWorkflows` (table), `insertApprovalWorkflowSchema`, `selectApprovalWorkflowSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/ap/approval_workflows.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `threshold_amount_cents` (integer NOT NULL), `steps` (jsonb NOT NULL default `[]`), `is_active` (boolean default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, is_active)`, `(organization_id, threshold_amount_cents)`
- [ ] Zod schemas and types exported; `steps` validated as array of `{ approver_user_id, order, required }` objects
- [ ] `lib/db/src/__tests__/approval-workflows.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Dynamic escalation rules
- External approval systems (DocuSign, etc.)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/ap/approval_workflows.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/approval-workflows.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `threshold_amount_cents` selects the workflow: bills ≥ threshold require this workflow
- Steps must be ordered and non-empty for an active workflow (service layer validation)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- approval-workflows.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `steps` JSONB schema: `[{ approver_user_id: UUID, order: number, required: boolean }]`; Zod refinement validates no duplicate orders.

**Anti-Patterns** — Empty `steps` array for active workflows — enforce non-empty at service layer.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ApprovalWorkflow` configuration entity in the AP context. Routing logic in `ApprovalService`.
- TDD: Assert JSONB steps default, threshold index.
- BDD: Supports "Route high-value bill for approval" scenario.
- Deep Module: Configuration table; routing logic in service layer.

---

### Subtasks
- [ ] DB-AP-003.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-AP-003.0.5 (AGENT): Research Zod JSONB array validation with object item schema.
- [ ] DB-AP-003.0.75 (AGENT): Define `steps` JSONB object schema.
- [ ] DB-AP-003.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-AP-003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-AP-003.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-AP-004: Define Purchase Orders Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No purchase orders table. PO-based procurement tracking is blocked.
**Size:** Small

**Description:** Define the `purchase_orders` table for tracking vendor purchase orders through their full lifecycle from draft to receipt. Enables three-way matching (PO + bill + receipt) in Phase 3.

**Depends on:** DB-AP-001 (vendors FK)
**Blocks:** DB-AP-002 (bills reference PO FK, nullable)
**Related Files:** `lib/db/src/schema/ap/purchase_orders.ts`, `lib/db/src/__tests__/purchase-orders.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `date`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `purchaseOrders` (table), `poStatusEnum`, `insertPurchaseOrderSchema`, `selectPurchaseOrderSchema`, `InsertPurchaseOrder`, `PurchaseOrder`

**Definition of Done**
- [ ] `lib/db/src/schema/ap/purchase_orders.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `po_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `status` (pgEnum: `draft|sent|acknowledged|partially_received|received|closed`), `line_items` (jsonb default `[]`), `expected_delivery_date` (date nullable), `received_at` (timestamp nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, vendor_id, status)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/purchase-orders.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Three-way matching automation (Phase 3+)
- Partial delivery tracking beyond `partially_received` status

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/ap/purchase_orders.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/purchase-orders.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Status machine: `draft → sent → acknowledged → partially_received|received → closed`
- Amounts in cents; all queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- purchase-orders.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `line_items` JSONB mirrors invoice line items for consistent UI rendering.

**Anti-Patterns** — Skipping status transitions (e.g., `draft → received`) — enforce state machine at service layer.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `PurchaseOrder` aggregate in the AP context. Receipt matching logic in `ProcurementService`.
- TDD: Assert status enum, JSONB line items.
- BDD: Supports "Issue purchase order to vendor" scenario.
- Deep Module: Shallow storage; three-way matching in service layer.

---

### Subtasks
- [ ] DB-AP-004.0.25 (AGENT): Read DB-AP-001. No action — pause.
- [ ] DB-AP-004.0.5 (AGENT): [N/A] — same patterns.
- [ ] DB-AP-004.0.75 (AGENT): Confirm status enum covers all needed PO states.
- [ ] DB-AP-004.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-AP-004.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-AP-004.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## Accounts Receivable Context

## [ ] DB-AR-001: Define Customers Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No customers table. AR invoicing, payments, and collections are blocked.
**Size:** Small

**Description:** Define the `customers` table for the AR bounded context — stores business-to-business customer records with billing/shipping JSONB addresses, credit management, and payment terms.

**Depends on:** DB-ORG-001
**Blocks:** DB-FIN-001 (invoices), DB-FIN-002 (customer payments), DB-FIN-008 (credit memos), DB-FIN-014 (collections), DB-FIN-006 (payment methods — customer FK)
**Related Files:** `lib/db/src/schema/ar/customers.ts`, `lib/db/src/__tests__/customers.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `customers` (table), `insertCustomerSchema`, `selectCustomerSchema`, `InsertCustomer`, `Customer`

**Definition of Done**
- [ ] `lib/db/src/schema/ar/customers.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `company_name` (text NOT NULL), `contact_name` (text nullable), `email` (text nullable), `phone` (text nullable), `billing_address` (jsonb default `{}`), `shipping_address` (jsonb default `{}`), `payment_terms_days` (integer NOT NULL default `30`), `credit_limit_cents` (integer nullable), `tax_id` (text nullable), `is_active` (boolean NOT NULL default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, company_name)`, `(organization_id, email)`
- [ ] Zod schemas and types exported; addresses validated as structured JSONB objects
- [ ] `lib/db/src/__tests__/customers.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- B2C (individual consumer) customer management
- Customer portal authentication

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/ar/customers.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/customers.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `credit_limit_cents` nullable — absence means unlimited credit; enforce at service layer
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- customers.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — JSONB billing/shipping addresses with Zod schema: `{ street, city, state, postal_code, country }`.

**Anti-Patterns** — Missing credit limit enforcement at service layer — allows unlimited credit implicitly.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Customer` aggregate root in the AR bounded context. Credit management in `CustomerService`.
- TDD: Assert JSONB address defaults, optional credit limit.
- BDD: Supports "Add customer" and "Set credit limit" scenarios.
- Deep Module: Shallow storage; credit management in service layer.

---

### Subtasks
- [ ] DB-AR-001.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-AR-001.0.5 (AGENT): Research JSONB address validation pattern (same as DB-AP-001 and DB-FIN-006).
- [ ] DB-AR-001.0.75 (AGENT): Confirm `credit_limit_cents` null semantics (null = unlimited vs. 0 = no credit).
- [ ] DB-AR-001.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-AR-001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-AR-001.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-AR-002: AR Context Invoice View
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR-specific invoice query layer. The `invoices` table (DB-FIN-001) is shared; this task creates AR-context query helpers.
**Size:** Small

**Description:** Create AR-context query utilities and TypeScript types that present the shared `invoices` table through a customer-focused lens, without creating a duplicate table. This is a context-mapping helper, not a new DB table.

**Depends on:** DB-FIN-001 (invoices table), DB-AR-001 (customers)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/views/ar/invoices.ts`

**Imports / Exports**
- Imports: `invoices`, `customers` from schema; Drizzle query builder
- Exports: `getArInvoicesByCustomer()`, `getArInvoicesByStatus()`, `ArInvoice` type (invoice with customer fields joined)

**Definition of Done**
- [ ] `lib/db/src/views/ar/invoices.ts` exports typed query helpers for AR-focused invoice access
- [ ] `getArInvoicesByCustomer(db, orgId, customerId)` returns invoices with customer company name joined
- [ ] `getArInvoicesByStatus(db, orgId, status)` returns all invoices for a status filtered by org
- [ ] `ArInvoice` type includes joined customer fields
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- A separate `ar_invoices` database table (AR uses the shared `invoices` table)
- PostgreSQL views (use TypeScript query helpers for now)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/views/ar/invoices.ts`
- Tests added/updated in: [?]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level — delete `lib/db/src/views/ar/invoices.ts`. No DB state change.

**Rules to Follow**
- All query helpers must include `organization_id` in WHERE clauses
- No duplicate table — reuse `invoices` schema from DB-FIN-001

**Verification**
```bash
pnpm run typecheck
```

**Advanced Code Patterns** — Context mapping via TypeScript query helpers avoids DB view management complexity while preserving bounded-context clarity.

**Anti-Patterns** — Creating a separate `ar_invoices` table — data duplication; breaks single source of truth.

**DDD / TDD / BDD / Deep Module notes**
- DDD: AR context views the shared `invoices` table through a customer-focused lens — bounded-context mapping pattern.
- TDD: [?] — query helper tests would require test database; add to integration test suite.
- BDD: Supports "View all invoices for a customer" scenario.
- Deep Module: Query helpers hide join complexity behind a simple function interface.

---

### Subtasks
- [ ] DB-AR-002.0.25 (AGENT): Read DB-FIN-001 and DB-AR-001 schemas. No action — pause.
- [ ] DB-AR-002.0.5 (AGENT): Confirm Drizzle `.select().from().leftJoin()` syntax for joined queries.
- [ ] DB-AR-002.0.75 (AGENT): Define the `ArInvoice` joined type structure.
- [ ] DB-AR-002.1 (AGENT): Implement AR invoice query helpers and types.
  **File(s):** `lib/db/src/views/ar/invoices.ts`
  **Verification:** `pnpm run typecheck` clean.
- [ ] DB-AR-002.2 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## Phase 2 Finance: Critical Path & Dependencies

### Execution Order
```
DB-ORG-001
  ├─> DB-AR-001 (customers) ─────────────────────────> DB-FIN-001 (invoices)
  ├─> DB-AP-001 (vendors) ─> DB-AP-002/003/004          └─> DB-FIN-002/003/008/014
  ├─> DB-FIN-004/005/006/007 (parallel infrastructure)
  └─> DB-FIN-010 (payment runs — needs AP-002 + FIN-005)
```

### Parallel Execution Groups
- **DB-FIN-004, 005, 006, 007** — can all run in parallel after DB-ORG-001
- **DB-AP-001** and **DB-AR-001** — can run in parallel after DB-ORG-001
- **DB-AP-003** and **DB-AP-004** — can run in parallel after DB-AP-001

---

## File Index

### Financial Files
- `TODO-P2-FINANCE.md` — This file
- `TODO-P2-INFRASTRUCTURE.md` — Test Infrastructure, DB Logger, BaseRepository
- `TODO-P2-IDENTITY.md` — Identity & Access context
- `TODO-P2-APPOINTMENTS.md` — Scheduling & Appointments context
- `TODO-P2-ORGANIZATIONS.md` — Organizations multi-tenancy anchor

### Related Phase Files
- `TODO-P3-FINANCE-CORE.md` — Financial APIs and business logic
- `TODO-P3-FINANCE-DEPTH.md` — AP/AR advanced workflows

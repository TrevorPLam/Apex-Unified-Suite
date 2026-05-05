# tasks/finance/FINANCE‑INVOICES‑PAYMENTS.md – Finance: Invoices & Payments

This file contains tasks for the Accounts Receivable (AR) core: invoices, customer payments, payment allocations, credit memos, multi‑currency support, and the associated API layers, services, repositories, integration tests, and frontend integration. These features handle money owed *to* the organisation.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schemas

### [ ] DB‑FIN‑001: Define Invoices Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No invoices table exists. AR and finance features are fully blocked.
**Size:** Small

**Description:** Define the `invoices` table — the primary AR document. Supports multi‑currency, line items as JSONB, tax columns, soft delete, and multiple indexed query patterns for status‑based dashboards and customer‑scoped views.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑AR‑001` (customer FK)
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑002`, `DB‑FIN‑003`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑008`, `DB‑FIN‑009`, `DB‑FIN‑014`
**Related Files:** `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/__tests__/invoices.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/finance/invoices.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `currency` (text NOT NULL default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer NOT NULL default `0`), `tax_type` (text nullable), `status` (pgEnum: `draft|sent|paid|overdue|void`), `due_date` (date NOT NULL), `invoice_date` (date NOT NULL), `line_items` (jsonb NOT NULL default `[]`), `memo` (text nullable), `attachments` (text[] default `{}`), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, customer_id, status)`, `(organization_id, due_date)`, unique `(organization_id, invoice_number)`
- [ ] Zod schemas and types exported; `line_items` validated as array of line‑item objects
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Recurring invoice automation
- Advanced tax engine integration
- Discount line‑item support (Phase 3+)

**Rules to Follow**
- All monetary amounts stored in cents (integer) — never floating point
- `invoice_number` must be unique per organization, not globally
- Status transitions must be validated at the service layer: `draft → sent → paid|overdue|void`
- `currency` defaults to `USD` but must support ISO 4217 3‑letter codes

**Verification**
```bash
pnpm --filter @workspace/db test -- invoices.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Invoice` is the core aggregate of the AR bounded context. Business logic for payment allocation, status transitions, and tax calculation belongs in `InvoiceService`.
- TDD: Assert status enum, composite unique index, JSONB `line_items` default, and soft‑delete column.

---

### Subtasks
- [ ] DB‑FIN‑001.0.25 (AGENT): Read DB‑ORG‑001 and DB‑AR‑001 schemas; understand the invoice‑customer FK relationship. *No action – pause.*
- [ ] DB‑FIN‑001.0.5 (AGENT): Research Drizzle JSONB array column, `text[]` (PostgreSQL array), and composite unique index syntax. *Document findings briefly.*
- [ ] DB‑FIN‑001.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/invoices.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑001.2 (AGENT): Implement `invoices` table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑002: Define Customer Payments Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No customer payments table. Payment recording and Stripe reconciliation are blocked.
**Size:** Small

**Description:** Define the `customer_payments` table for recording payments received from customers, with Stripe integration fields, payment method tracking, and status lifecycle management.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑AR‑001` (customers FK), `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001` (invoices FK, nullable)
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑003`
**Related Files:** `lib/db/src/schema/finance/customer_payments.ts`, `lib/db/src/__tests__/customer‑payments.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `customer_id` (FK → customers), `invoice_id` (FK → invoices, nullable), `amount_cents` (integer NOT NULL), `currency` (text default `USD`), `payment_method` (pgEnum: `card|ach|wire|check`), `status` (pgEnum: `pending|succeeded|failed|refunded`), `processed_at` (timestamp nullable), `failure_reason` (text nullable), `stripe_payment_intent_id` (text nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, customer_id)`, `(invoice_id)`, unique `(stripe_payment_intent_id)` where not null
- [ ] Zod schemas and types exported
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- customer‑payments.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑002.0.25 (AGENT): Read DB‑AR‑001 and DB‑FIN‑001 schemas. *No action – pause.*
- [ ] DB‑FIN‑002.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/customer‑payments.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑002.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑003: Define Payment Allocations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment allocations table. Multi‑invoice payment splitting is blocked.
**Size:** Small

**Description:** Define the `payment_allocations` junction table for allocating a single customer payment across multiple invoices — a core Bill.com feature. Allocation amounts are stored in cents with per‑organization scoping.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `DB‑FIN‑002`
**Blocks:** [N/A] — enables Phase 3 payment allocation service
**Related Files:** `lib/db/src/schema/finance/payment_allocations.ts`, `lib/db/src/__tests__/payment‑allocations.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `payment_id` (FK → customer_payments), `invoice_id` (FK → invoices), `amount_cents` (integer NOT NULL), `allocated_at` (timestamp NOT NULL, `defaultNow()`), `created_at`
- [ ] Indexes: `(payment_id)`, `(invoice_id)`, `(organization_id, allocated_at)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Total allocations per payment must not exceed payment `amount_cents` (service layer validation)
- Allocation amounts must be positive (> 0)

**Verification**
```bash
pnpm --filter @workspace/db test -- payment‑allocations.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑003.0.25 (AGENT): Read DB‑FIN‑001 and DB‑FIN‑002 schemas. *No action – pause.*
- [ ] DB‑FIN‑003.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/payment‑allocations.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑FIN‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Invoices (AR)

### [ ] API‑FIN‑001: Invoices (AR) – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AR invoice endpoints defined in `openapi.yaml`.
**Size:** Small

**Description:** Add all Accounts Receivable invoice CRUD endpoints, status state machine enum, multi‑currency fields, and line‑item schemas to the OpenAPI spec.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑002`, `API‑FIN‑003`, `API‑FIN‑004`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/finance/invoices`, `POST`, `GET /{invoiceId}`, `PATCH /{invoiceId}`, `POST /{invoiceId}/send`, `POST /{invoiceId}/void` all defined
- [ ] `InvoiceStatusEnum`: `draft`, `sent`, `paid`, `overdue`, `void`
- [ ] Multi‑currency fields: `currency`, `exchange_rate`, `subtotal_cents`, `tax_amount_cents`, `total_cents`
- [ ] `InvoiceLineItemSchema` as reusable `$ref` component
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑001.0.25 (AGENT): Read DB‑FIN‑001 invoice schema. *No action – pause.*
- [ ] API‑FIN‑001.1 (AGENT): Add `Invoice`, `InvoiceLineItem` schemas and all AR invoice endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** YAML valid.
- [ ] API‑FIN‑001.2 (AGENT): Run codegen and verify. **Verification:** `pnpm codegen` exits 0; `pnpm typecheck`.
- [ ] API‑FIN‑001.3 (HUMAN): Review spec and sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑002: Invoices (AR) – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No finance invoice integration tests exist.
**Size:** Medium

**Description:** Write a comprehensive AR invoice integration test suite covering CRUD, status transitions, multi‑currency, and idempotency — all must fail (red) before implementation.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑001`, `DB‑FIN‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`
**Related Files:** `artifacts/api‑server/__tests__/api/finance/invoices.test.ts`

**Definition of Done**
- [ ] Tests: list (paginated, filtered by status and date range), create with line items (201), get by ID, PATCH (draft only), send (draft → sent), void (sent → void), 404, 401
- [ ] Multi‑currency test: create with `currency: 'EUR'` and `exchange_rate: 1.08`
- [ ] Invalid status transition test: PATCH on sent invoice → 400
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/invoices.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑002.0.25 (AGENT): Read API‑FIN‑002, generated invoice schemas, and DB‑FIN‑001 seeding strategy. *No action – pause.*
- [ ] API‑FIN‑002.1 (AGENT): Write all AR invoice integration tests. **File(s):** `artifacts/api‑server/__tests__/api/finance/invoices.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑FIN‑002.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑FIN‑003: Invoices (AR) – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `InvoiceRepository` or `InvoiceService` exists.
**Size:** Large

**Description:** Implement `InvoiceRepository` (line‑item queries, status‑filtered lists) and `InvoiceService` (status machine, total calculation, send/void operations, event emission) using neverthrow Results.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `API‑FIN‑011`
**Related Files:** `lib/db/src/repositories/finance/invoices.ts`, `artifacts/api‑server/src/services/finance/invoice‑service.ts`

**Definition of Done**
- [ ] `InvoiceRepository`: `findById`, `findByOrg` (paginated, status/date/customer filtered), `create` (with line items in transaction), `update`, `updateStatus`, `findByCustomer`
- [ ] `InvoiceService`: `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `sendInvoice`, `voidInvoice`. All return `Result<T, DomainError>`.
- [ ] `createInvoice` calculates and validates total from line items + tax
- [ ] `updateInvoice` rejects edits on non‑draft invoices → `err(CannotModifySentInvoice)`
- [ ] Status machine: `draft → sent` (via `sendInvoice`); `sent → void` (via `voidInvoice`); `sent/overdue → paid` (set by PaymentService)
- [ ] `InvoiceCreated`, `InvoiceSent`, `InvoiceVoided` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/finance/__tests__/invoice‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoices are the central aggregate in the Finance AR subdomain. Status machine and total calculation are core domain invariants.
- Deep Module: `InvoiceService.createInvoice(dto, orgId)` hides total calculation, transactional line‑item creation, and event emission.

---

### Subtasks
- [ ] API‑FIN‑003.0.25 (AGENT): Read DB‑FIN‑001 schema, line item structure, and finance domain error types. *No action – pause.*
- [ ] API‑FIN‑003.1 (AGENT): Implement `InvoiceRepository` (with line‑item joins). **File(s):** `lib/db/src/repositories/finance/invoices.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑003.2 (AGENT): Implement `InvoiceService` with status machine, total calculation, and events. **File(s):** `artifacts/api‑server/src/services/finance/invoice‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑003.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/finance/__tests__/invoice‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑003.4 (HUMAN): Review status machine, total validation, and cents arithmetic. Sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑004: Invoices (AR) – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR invoice routes wired.
**Size:** Small

**Description:** Create AR invoice route handlers (CRUD + send + void), mount the router, and run integration tests to green.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑003`, `API‑FIN‑002`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑011`, `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑017`
**Related Files:** `artifacts/api‑server/src/routes/finance/invoices.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST send, POST void handlers
- [ ] `CannotModifySentInvoice` → 400; `InvoiceNotFound` → 404
- [ ] `pnpm test -- invoices.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/invoices.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑004.0.25 (AGENT): Read `routes/crm/leads.ts` and `routes/crm/deals.ts` as route patterns. *No action – pause.*
- [ ] API‑FIN‑004.1 (AGENT): Implement invoices router with all routes including sub‑resource actions. **File(s):** `artifacts/api‑server/src/routes/finance/invoices.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑004.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑004.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Payments

### [ ] API‑FIN‑009: Payments – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add append‑only payment recording endpoints (no PATCH/DELETE), idempotency header documentation, and multi‑currency payment schema to the OpenAPI spec.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑002`, `API‑FIN‑001`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑010`, `API‑FIN‑011`, `API‑FIN‑012`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/finance/payments`, `POST` (with `Idempotency‑Key` header documented), `GET /{paymentId}` defined
- [ ] No PATCH or DELETE endpoints
- [ ] `PaymentMethodEnum`: `bank_transfer`, `credit_card`, `check`, `cash`, `virtual_card`, `other`
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑009.0.25 (AGENT): Read DB‑FIN‑002 payments schema. *No action – pause.*
- [ ] API‑FIN‑009.1 (AGENT): Add `Payment` schema and all payment endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑009.2 (HUMAN): Review and sign off. Confirm no PATCH/DELETE. **Verification:** Approved.

---

### [ ] API‑FIN‑010: Payments – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment integration tests.
**Size:** Medium

**Description:** Write payment integration tests covering idempotency, FK validation, append‑only enforcement, and multi‑currency (TDD red phase).

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑009`, `API‑FIN‑002` (green invoices needed to seed test invoices)
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑012`
**Related Files:** `artifacts/api‑server/__tests__/api/finance/payments.test.ts`

**Definition of Done**
- [ ] Tests: create payment for AR invoice (201), same `Idempotency‑Key` → 200 (returns existing), list, get, PATCH → 405, DELETE → 405, missing key → 400, invalid invoice_id → 400, auth
- [ ] `InvoicePaid` event test: verify invoice status changes to `paid` after full payment
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/payments.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑010.0.25 (AGENT): Read API‑FIN‑010, generated payment schemas, and idempotency key patterns. *No action – pause.*
- [ ] API‑FIN‑010.1 (AGENT): Write all payment integration tests. **File(s):** `artifacts/api‑server/__tests__/api/finance/payments.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑FIN‑010.2 (HUMAN): Review idempotency test and confirm red phase. **Verification:** Approved.

---

### [ ] API‑FIN‑011: Payments – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `PaymentRepository` or `PaymentService` exists.
**Size:** Large

**Description:** Implement `PaymentRepository` (append‑only) and `PaymentService` (idempotency via `Idempotency‑Key`, FK validation, invoice/bill balance update, event emission) using neverthrow Results.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑002`, `DB‑FIN‑003` (idempotency support), `InvoiceService`, `BillService`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑012`, `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑018`
**Related Files:** `lib/db/src/repositories/finance/payments.ts`, `artifacts/api‑server/src/services/finance/payment‑service.ts`

**Definition of Done**
- [ ] `PaymentRepository`: `findById`, `findByOrg` (paginated, filtered), `create` (transactional). No update or delete methods.
- [ ] `PaymentService`: `listPayments`, `getPayment`, `recordPayment`. Returns `Result<T, DomainError>`.
- [ ] Idempotency: checks `idempotency_keys` table by `(key, organization_id)`; returns existing payment if found; creates payment + idempotency record atomically if not.
- [ ] FK validation: exactly one of `invoice_id` or `bill_id` must be provided.
- [ ] After payment creation: updates invoice/bill `paid_amount_cents`; if fully paid, marks invoice/bill `paid`.
- [ ] Emits `PaymentRecorded` and (if fully paid) `InvoicePaid` or `BillPaid` domain events.
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/finance/__tests__/payment‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payments are financial fact records — append‑only. Idempotency is a core financial domain constraint to prevent double‑entry.
- Deep Module: `PaymentService.recordPayment(dto, idempotencyKey, orgId)` hides idempotency check, FK validation, balance update, status transition, and event emission.

---

### Subtasks
- [ ] API‑FIN‑011.0.25 (AGENT): Read DB‑FIN‑002, DB‑FIN‑003, `InvoiceRepository`, `BillRepository`. *No action – pause.*
- [ ] API‑FIN‑011.1 (AGENT): Implement `PaymentRepository` (append‑only). **File(s):** `lib/db/src/repositories/finance/payments.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑011.2 (AGENT): Implement `PaymentService` with idempotency, FK validation, balance update, and events. **File(s):** `artifacts/api‑server/src/services/finance/payment‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑011.3 (AGENT): Write and run unit tests including idempotency race condition test. **File(s):** `artifacts/api‑server/src/services/finance/__tests__/payment‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑011.4 (HUMAN): Review idempotency implementation and balance update atomicity. Sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑012: Payments – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No payment routes wired.
**Size:** Small

**Description:** Create payment route handlers (GET list, POST record, GET by ID — no PATCH/DELETE), extract `Idempotency‑Key` header, mount the router, and run integration tests to green.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑011`, `API‑FIN‑010`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A] — terminal Finance core feature
**Related Files:** `artifacts/api‑server/src/routes/finance/payments.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST (extracts `Idempotency‑Key` from `req.headers`), GET by ID routes only
- [ ] Missing `Idempotency‑Key` → 400; PATCH and DELETE → 405
- [ ] `pnpm test -- payments.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/payments.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑012.0.25 (AGENT): Read `routes/crm/activities.ts` as append‑only route pattern. *No action – pause.*
- [ ] API‑FIN‑012.1 (AGENT): Implement payments router (GET list, POST, GET by ID, 405 catch‑all). **File(s):** `artifacts/api‑server/src/routes/finance/payments.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑012.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑012.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Multi‑Currency & Tax

### [ ] DB‑FIN‑009: Multi‑Currency & Tax Migration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Currency and tax columns are included in DB‑FIN‑001 (invoices) from initial definition. This task ensures consistency across bills and any other tables that need the same columns.
**Size:** Small

**Description:** Verify and enforce that `currency`, `exchange_rate`, `tax_amount_cents`, and `tax_type` columns are consistently present across invoices, bills, and AR invoices.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002` (bills), `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/invoices.ts`, `lib/db/src/schema/ap/bills.ts`

**Definition of Done**
- [ ] `invoices.ts`, `bills.ts` all have: `currency` (text default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer default `0`), `tax_type` (text nullable)
- [ ] Schema is consistent — no table has these columns defined differently from the standard
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Exchange rate auto‑lookup services
- Tax engine integration

**Verification**
```bash
pnpm run typecheck
grep -r "exchange_rate" lib/db/src/schema/
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Enables international payment workflows across AP and AR contexts.

---

### Subtasks
- [ ] DB‑FIN‑009.0.25 (AGENT): Read DB‑FIN‑001 and DB‑AP‑002 schemas. *No action – pause.*
- [ ] DB‑FIN‑009.1 (AGENT): Patch any inconsistent tables; run typecheck. **Verification:** `pnpm run typecheck` clean.
- [ ] DB‑FIN‑009.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend Integration

### [ ] FRONT‑FIN‑001: Invoices & Payments – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `Finance.tsx` uses mock data for invoices and payments. No `useInvoiceList` or `usePaymentList` hooks exist.
**Size:** Small

**Description:** Create `useInvoiceList` and `usePaymentList` hooks backed by `API‑FIN‑004` / `API‑FIN‑008`. Replace all mock data in invoice list and payment views. Display multi‑currency amounts and tax breakdowns.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`, `API‑FIN‑008` (payments), `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑INT‑FIN`
**Related Files:** `artifacts/apex‑os/src/pages/Finance.tsx`, `artifacts/apex‑os/src/hooks/finance/useInvoiceList.ts`, `usePaymentList.ts`

**Definition of Done**
- [ ] `useInvoiceList` and `usePaymentList` hooks created with filter params
- [ ] Invoice list shows: number, client, amount (formatted with `Intl.NumberFormat`), currency symbol, tax breakdown, status badge, due date
- [ ] Payment list shows: invoice number, amount, payment date, method, status
- [ ] All `mockData` imports removed from `Finance.tsx`
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass with MSW

**Rules to Follow**
- ALL currency amounts must use `Intl.NumberFormat` with the currency code from the invoice — never hardcode currency symbols.
- Tax amounts must be displayed as a breakdown line — not folded into the total.

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- finance‑list.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoice and Payment are separate aggregate roots in the Finance bounded context.
- TDD: MSW returns 3 invoices with different currencies; assert each is formatted correctly.
- BDD: “As a firm user, I can see all invoices with correct amounts in the invoice currency.”

---

### Subtasks
- [ ] FRONT‑FIN‑001.0.25 (AGENT): Read `Finance.tsx` in full and list every `mockData` reference. *No action – pause.*
- [ ] FRONT‑FIN‑001.1 (AGENT): Create `useInvoiceList` and `usePaymentList` hooks. **File(s):** `artifacts/apex‑os/src/hooks/finance/useInvoiceList.ts`, `usePaymentList.ts` **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑FIN‑001.2 (AGENT): Replace mock data; display multi‑currency amounts and tax breakdowns. **File(s):** `artifacts/apex‑os/src/pages/Finance.tsx` **Verification:** No mockData; `pnpm typecheck`.
- [ ] FRONT‑FIN‑001.3 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/pages/__tests__/finance‑list.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑FIN‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑FIN: Finance Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Invoice approve/reject buttons, payment form, and budget update form all render but have no mutation wiring.
**Size:** Medium

**Description:** Wire all Finance create/update mutations with idempotency key handling: invoice approve/reject, payment creation with client‑side UUID idempotency key reused on retry, card freeze/unfreeze, budget update. All mutations show sonner toast feedback.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑FIN‑001`, `finance/FINANCE‑SPEND‑BUDGETS.md → FRONT‑FIN‑002`, `infrastructure/AUTH.md → FRONT‑INFRA‑003`, `FRONT‑INFRA‑004`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Finance.tsx`, `artifacts/apex‑os/src/hooks/finance/`

**Definition of Done**
- [ ] Invoice approve button → `useUpdateInvoice({ status: 'approved' })`; rejection shows a reason input dialog first
- [ ] Payment form → `useCreatePayment` with idempotency key: generated as `crypto.randomUUID()` on form open; same key reused on retry
- [ ] All mutation `isPending` states disable the relevant button
- [ ] All mutations show sonner success/error toasts
- [ ] Integration tests with MSW cover all paths including idempotency key reuse

**Rules to Follow**
- CRITICAL: Idempotency key must be generated ONCE per payment form session and REUSED on retry — never generate a new key on retry.
- Rejection reason for invoice rejection is REQUIRED — do not call the mutation without a reason string.

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- finance‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Finance mutations enforce domain rules (invoice approval workflow, payment immutability) via the API.
- TDD: Simulate payment form submit twice with the same idempotency key → assert only one `POST /payments` is sent.
- BDD: “As a firm user, I can approve an invoice and submit a payment, knowing that accidental double‑submission won’t create duplicate records.”

---

### Subtasks
- [ ] FRONT‑INT‑FIN.0.25 (AGENT): List all Finance mutation surfaces; verify idempotency key storage pattern. *No action – pause.*
- [ ] FRONT‑INT‑FIN.1 (AGENT): Implement `useUpdateInvoice`; wire approve/reject with reason dialog. **File(s):** `artifacts/apex‑os/src/hooks/finance/useUpdateInvoice.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑FIN.2 (AGENT): Implement `useCreatePayment` with idempotency key; wire payment form. **File(s):** `artifacts/apex‑os/src/hooks/finance/useCreatePayment.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑FIN.3 (AGENT): Write integration tests covering all mutation paths including idempotency key reuse. **File(s):** `artifacts/apex‑os/src/pages/__tests__/finance‑interactive.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑INT‑FIN.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
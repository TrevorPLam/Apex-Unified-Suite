# TODO-P3-FINANCE-CORE.md – Phase 3: Finance Core API

## Tasks in this file
- API-FIN-001: Invoices (AR) – Expand OpenAPI Spec
- API-FIN-002: Invoices (AR) – Integration Tests (TDD Red)
- API-FIN-003: Invoices (AR) – Service & Repository
- API-FIN-004: Invoices (AR) – Routes & Green Tests
- API-FIN-005: Bills (AP) – Expand OpenAPI Spec
- API-FIN-006: Bills (AP) – Integration Tests (Red)
- API-FIN-007: Bills (AP) – Service & Repository
- API-FIN-008: Bills (AP) – Routes & Green Tests
- API-FIN-009: Payments – Expand OpenAPI Spec
- API-FIN-010: Payments – Integration Tests (Red)
- API-FIN-011: Payments – Service & Repository
- API-FIN-012: Payments – Routes & Green Tests
- API-FIN-013: Virtual Cards – Expand OpenAPI Spec
- API-FIN-014: Virtual Cards – Integration Tests (Red)
- API-FIN-015: Virtual Cards – Service & Repository
- API-FIN-016: Virtual Cards – Routes & Green Tests

---

## [ ] API-FIN-001: Invoices (AR) – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AR invoice endpoints defined in `openapi.yaml`. No generated Zod schemas or React Query hooks for invoices.
**Size:** Small

**Description:** Add all Accounts Receivable invoice CRUD endpoints, status state machine enum, multi-currency fields, and line-item schemas to the OpenAPI spec.

**Depends on:** API-SPEC-001 (spec baseline), DB-FIN-001 (invoices schema).
**Blocks:** API-FIN-002, API-FIN-003, API-FIN-004.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`

**Imports / Exports**
- Imports: [N/A] — spec file only
- Exports: `InvoiceSchema`, `CreateInvoiceSchema`, `UpdateInvoiceSchema`, `InvoiceStatusEnum`, `InvoiceLineItemSchema` (via codegen); `useListInvoices`, `useGetInvoice`, `useCreateInvoice`, `useUpdateInvoice`, `useSendInvoice` hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/finance/invoices` with `page`, `limit`, `status`, `customerId`, `dateFrom`, `dateTo`, `currency` query params.
- [ ] `POST /api/v1/finance/invoices` with `CreateInvoiceRequestBody` schema including `line_items[]`.
- [ ] `GET /api/v1/finance/invoices/{invoiceId}` defined.
- [ ] `PATCH /api/v1/finance/invoices/{invoiceId}` defined (draft-only updates).
- [ ] `POST /api/v1/finance/invoices/{invoiceId}/send` — transitions from `draft` to `sent`.
- [ ] `POST /api/v1/finance/invoices/{invoiceId}/void` — transitions to `void`.
- [ ] `InvoiceStatusEnum`: `draft`, `sent`, `paid`, `overdue`, `void`.
- [ ] Multi-currency fields: `currency` (ISO 4217, e.g., "USD"), `exchange_rate`, `subtotal_cents`, `tax_amount_cents`, `total_cents`.
- [ ] `InvoiceLineItemSchema`: `description`, `quantity`, `unit_price_cents`, `tax_rate`, `line_total_cents`.
- [ ] Codegen runs successfully.

**Out of Scope**
- Credit memo application (API-FIN-017)
- Payment recording against an invoice (API-FIN-009)
- Invoice PDF generation

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: `pnpm codegen` fails — fix YAML before proceeding.

**Rules to Follow**
- All monetary amounts in cents (integer) — no floats.
- `currency` field: ISO 4217 3-letter code, pattern `^[A-Z]{3}$`.
- `InvoiceLineItemSchema` as reusable `$ref` component — used for both AR invoices and AP bills.
- Document status transitions in spec descriptions.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `InvoiceLineItemSchema` as shared `$ref: '#/components/schemas/InvoiceLineItem'` — reused in bill spec.
- `x-status-transitions` extension to document the state machine inline.

**Anti-Patterns**
- Using floats for `amount` (precision loss in financial calculations — always use cents as integer).
- Missing `currency` field (makes multi-currency impossible to add later).
- Combining AR invoices and AP bills in one spec schema (separate schemas for clarity).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoices are the central aggregate in the AR subdomain. Status machine defines the lifecycle.
- TDD: Spec enables API-FIN-002 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec defines the narrow public interface for the Finance bounded context.

---

### Subtasks
- [ ] API-FIN-001.0.25 (AGENT): Read DB-FIN-001 invoice schema and understand AR vs AP distinction.
  *No action — pause until fully understood.*

- [ ] API-FIN-001.0.5 (AGENT): Research OpenAPI 3.1 patterns for financial API spec (line items, currency, state machine documentation) as of May 2026.
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-001.0.75 (AGENT): Confirm required vs optional invoice fields and which currencies to support with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-001.1 (AGENT): Add `Invoice`, `InvoiceLineItem` schemas and all AR invoice endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** YAML is valid

- [ ] API-FIN-001.2 (AGENT): Run codegen and verify generated output.
  **File(s):** `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`
  **Verification:** `pnpm codegen` exits 0 ; `pnpm typecheck`

- [ ] API-FIN-001.3 (HUMAN): Review spec and sign off.
  **Verification:** Approved; all endpoints, schemas, and status machine documented.

---

## [ ] API-FIN-002: Invoices (AR) – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No finance invoice integration tests exist.
**Size:** Medium

**Description:** Write a comprehensive AR invoice integration test suite covering CRUD, status transitions, multi-currency, and idempotency — all must fail (red) before implementation.

**Depends on:** API-FIN-001 (spec + generated schemas), DB-FIN-001 (schema + test DB seeding).
**Blocks:** API-FIN-004 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/finance/invoices.test.ts`

**Imports / Exports**
- Imports: generated `InvoiceSchema`, `CreateInvoiceSchema`, test auth helper, test DB client
- Exports: test suite in `invoices.test.ts`

**Definition of Done**
- [ ] Tests: list (paginated, filtered by status and date range), create with line items (201), get by ID, PATCH (draft only — attempt PATCH on `sent` invoice → 400), send (draft → sent), void (sent → void), 404 on unknown ID, 401 without auth.
- [ ] Multi-currency test: create invoice with `currency: 'EUR'` and `exchange_rate: 1.08`.
- [ ] Invalid status transition test: attempt send on already-sent invoice → 400 or 409.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment recording tests (API-FIN-010)
- Credit memo tests (API-FIN-017)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/invoices.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `invoices.test.ts` if test infrastructure broken.
- Halt condition: test file fails to compile — fix generated schema imports.

**Rules to Follow**
- Line item test: create invoice with 2 line items; verify `total_cents` equals sum of line totals.
- Status transition test: PATCH on a `sent` invoice → expect 400 `CannotModifySentInvoice`.
- Never use floats in test assertions for monetary amounts.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/invoices.test.ts
# Expected: all fail (red phase)
pnpm typecheck
```

**Advanced Code Patterns**
- Line item total assertion: `expect(res.body.total_cents).toBe(lineItem1.line_total_cents + lineItem2.line_total_cents + taxAmountCents)`.
- Multi-currency: `expect(res.body.currency).toBe('EUR'); expect(res.body.exchange_rate).toBeCloseTo(1.08)`.

**Anti-Patterns**
- Using float arithmetic in test assertions for money (use integer cents exclusively).
- Skipping status transition tests (core domain invariant).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoice status machine tests validate the AR aggregate lifecycle.
- TDD: Red phase — all must fail before routes exist.
- BDD: "When a sent invoice is PATCHed, the API returns 400 CannotModifySentInvoice."
- Deep Module: Black-box tests exercise API surface.

---

### Subtasks
- [ ] API-FIN-002.0.25 (AGENT): Read API-FIN-002, generated invoice schemas, and DB-FIN-001 seeding strategy.
  *No action — pause until fully understood.*

- [ ] API-FIN-002.0.5 (AGENT): Review test infrastructure for finance tests (auth token factory, DB seeding helpers).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-002.0.75 (AGENT): Confirm test seeding strategy for line items and multi-currency data with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-002.1 (AGENT): Write all AR invoice integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/finance/invoices.test.ts`
  **Verification:** `pnpm test -- invoices.test.ts` — all fail (red) ; `pnpm typecheck`

- [ ] API-FIN-002.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved; all failing.

---

## [ ] API-FIN-003: Invoices (AR) – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `InvoiceRepository` or `InvoiceService` exists.
**Size:** Large

**Description:** Implement `InvoiceRepository` (line-item queries, status-filtered lists) and `InvoiceService` (status machine, total calculation, send/void operations, event emission) using neverthrow Results.

**Depends on:** DB-FIN-001 (invoices + invoice_line_items schema), EVENT-001, ERROR-002.
**Blocks:** API-FIN-004 (routes), API-FIN-011 (PaymentService applies payments to invoices).
**Related Files:** `lib/db/src/repositories/finance/invoices.ts`, `artifacts/api-server/src/services/finance/invoice-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `invoices` and `invoice_line_items` tables, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `InvoiceRepository`, `InvoiceService`

**Definition of Done**
- [ ] `InvoiceRepository`: `findById`, `findByOrg` (paginated, status/date/customer filtered), `create` (with line items), `update`, `updateStatus`, `findByCustomer`.
- [ ] `InvoiceService`: `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `sendInvoice`, `voidInvoice`. All return `Result<T, DomainError>`.
- [ ] `createInvoice` calculates and validates `total_cents = SUM(line_item.quantity * unit_price_cents) + tax_amount_cents`.
- [ ] `updateInvoice` rejects updates on `sent`, `paid`, or `void` invoices → `err(CannotModifySentInvoice)`.
- [ ] Status machine: `draft → sent` (via `sendInvoice`); `sent → void` (via `voidInvoice`); `sent/overdue → paid` (set by PaymentService).
- [ ] `InvoiceCreated`, `InvoiceSent`, `InvoiceVoided` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment application (API-FIN-011)
- Credit memo application (API-FIN-017)
- Overdue detection (background job, future task)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow editing of a non-draft invoice

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/finance/invoices.ts`, `artifacts/api-server/src/services/finance/invoice-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/finance/__tests__/invoice-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: edit of non-draft invoice accepted → halt and add status guard.

**Rules to Follow**
- All monetary calculations in cents (integer arithmetic only — no floats).
- Status machine: `INVOICE_TRANSITIONS = { draft: ['sent'], sent: ['void', 'paid', 'overdue'], overdue: ['paid', 'void'], paid: [], void: [] }`.
- `createInvoice` must insert invoice and all line items in a single DB transaction.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/finance/__tests__/invoice-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Transactional create: `db.transaction(async (tx) => { const invoice = await tx.insert(invoices)...; await tx.insert(invoiceLineItems).values(lineItems.map(li => ({ ...li, invoice_id: invoice.id }))); return invoice; })`.
- Total validation: `const calculatedTotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0) + taxAmountCents; if (calculatedTotal !== dto.totalCents) return err(new InvalidInvoiceTotal(...))`.
- Status guard: `if (!['draft'].includes(invoice.status)) return err(new CannotModifySentInvoice(invoice.id))`.

**Anti-Patterns**
- Float arithmetic for monetary totals (pennies lost to rounding).
- Non-transactional create (invoice without line items if line item INSERT fails).
- Missing status guard (allows editing sent/paid invoices).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoices are the central aggregate in the Finance AR subdomain. The status machine and total calculation are core domain invariants.
- TDD: Unit tests for status machine, total calculation, and edit guard with mocked repository.
- BDD: "When an invoice total doesn't match the sum of its line items plus tax, the service returns InvalidInvoiceTotal."
- Deep Module: `InvoiceService.createInvoice(dto, orgId)` hides total calculation, transactional line-item creation, and event emission.

---

### Subtasks
- [ ] API-FIN-003.0.25 (AGENT): Read DB-FIN-001 schema, line item structure, and finance domain error types.
  *No action — pause until fully understood.*

- [ ] API-FIN-003.0.5 (AGENT): Research Drizzle transactional insert for parent+children, cents-only arithmetic patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-003.0.75 (AGENT): Confirm total validation strategy (service validates vs DB check constraint) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-003.1 (AGENT): Implement `InvoiceRepository` (with line-item joins).
  **File(s):** `lib/db/src/repositories/finance/invoices.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-003.2 (AGENT): Implement `InvoiceService` with status machine, total calculation, and event emission.
  **File(s):** `artifacts/api-server/src/services/finance/invoice-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-003.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/finance/__tests__/invoice-service.test.ts`
  **Verification:** `pnpm test -- invoice-service.test.ts` green ; `pnpm typecheck`

- [ ] API-FIN-003.4 (HUMAN): Review status machine, total validation, and cents arithmetic. Sign off.
  **Verification:** Approved; no floats; status guard confirmed; all tests green.

---

## [ ] API-FIN-004: Invoices (AR) – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR invoice routes wired.
**Size:** Small

**Description:** Create AR invoice route handlers (CRUD + send + void), mount the router, and run integration tests to green.

**Depends on:** API-FIN-003 (InvoiceService), API-FIN-002 (tests), AUTH-008.
**Blocks:** API-FIN-011 (PaymentService reduces invoice balance), API-FIN-017 (credit memo application).
**Related Files:** `artifacts/api-server/src/routes/finance/invoices.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `InvoiceService`, `CreateInvoiceSchema`, `UpdateInvoiceSchema`, `authMiddleware`
- Exports: `invoicesRouter` at `/api/v1/finance/invoices`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST send, POST void handlers.
- [ ] `CannotModifySentInvoice` → 400; `InvoiceNotFound` → 404.
- [ ] `pnpm test -- invoices.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment recording routes (API-FIN-012)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/finance/invoices.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- `organizationId` always from `req.user.organizationId`.
- `CannotModifySentInvoice` → 400 with `{ error: 'CannotModifySentInvoice', invoiceId }`.
- Sub-resource action routes: `POST /invoices/:id/send` and `POST /invoices/:id/void`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/invoices.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Sub-resource routes: `router.post('/:invoiceId/send', authMiddleware, async (req, res) => { ... invoiceService.sendInvoice(id, orgId) ... })`.

**Anti-Patterns**
- Using PUT instead of POST for state transitions (send, void are actions, not resource updates).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are thin anti-corruption layer — no domain logic.
- TDD: Green phase for AR invoices.
- BDD: All API-FIN-002 scenarios pass.
- Deep Module: Routes delegate to `InvoiceService`.

---

### Subtasks
- [ ] API-FIN-004.0.25 (AGENT): Read `routes/crm/leads.ts` and `routes/crm/deals.ts` as route patterns.
  *No action — pause until fully understood.*

- [ ] API-FIN-004.1 (AGENT): Implement invoices router with all routes including sub-resource actions.
  **File(s):** `artifacts/api-server/src/routes/finance/invoices.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-004.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- invoices.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-FIN-004.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures.

---

## [ ] API-FIN-005: Bills (AP) – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AP bill endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all Accounts Payable bill CRUD endpoints, status enum (with AP-specific statuses), approval workflow action, and vendor FK to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-FIN-002 (bills schema), API-FIN-001 (reuse `InvoiceLineItemSchema`).
**Blocks:** API-FIN-006, API-FIN-007, API-FIN-008.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `BillSchema`, `CreateBillSchema`, `UpdateBillSchema`, `BillStatusEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/finance/bills`, `POST`, `GET /{billId}`, `PATCH /{billId}`, `DELETE /{billId}` (soft delete) defined.
- [ ] `POST /api/v1/finance/bills/{billId}/approve` — transitions from `pending_review` to `approved`.
- [ ] `POST /api/v1/finance/bills/{billId}/reject` — transitions to `rejected` with `reason`.
- [ ] `BillStatusEnum`: `draft`, `pending_review`, `approved`, `paid`, `rejected`, `void`.
- [ ] `vendor_id` as required FK field in `CreateBillRequestBody`.
- [ ] Reuses `$ref: '#/components/schemas/InvoiceLineItem'` for line items.
- [ ] Codegen runs successfully.

**Out of Scope**
- Payment run endpoints (API-FIN-018)
- AP inbox (API-FIN-021)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- Bills are AP-specific: must include `vendor_id` (vs AR invoices which use `customer_id`).
- AP bill status machine differs from AR invoice: includes `pending_review` and `approved` states.
- Reuse `InvoiceLineItemSchema` `$ref` — do not duplicate.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- Bill vs Invoice distinction: document in spec description that Bills are AP (money owed to vendors), Invoices are AR (money owed by customers).
- Approval action: `POST /bills/{id}/approve` with optional `{ notes: string }` body.

**Anti-Patterns**
- Duplicating `InvoiceLineItemSchema` for bills (use `$ref` instead).
- Missing `vendor_id` requirement (AP bills always belong to a vendor).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bills are the central aggregate in the AP subdomain. Approval workflow is a domain state machine.
- TDD: Spec enables API-FIN-006 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec defines the narrow AP interface.

---

### Subtasks
- [ ] API-FIN-005.0.25 (AGENT): Read DB-FIN-002 bills schema and AP vs AR domain distinctions.
  *No action — pause until fully understood.*

- [ ] API-FIN-005.1 (AGENT): Add `Bill` schema and all AP bill endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-005.2 (HUMAN): Review and sign off.
  **Verification:** Approved.

---

## [ ] API-FIN-006: Bills (AP) – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AP bill integration tests.
**Size:** Medium

**Description:** Write AP bill integration tests covering CRUD, approval workflow, rejection, and auth (TDD red phase).

**Depends on:** API-FIN-005 (spec + generated schemas).
**Blocks:** API-FIN-008 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/finance/bills.test.ts`

**Imports / Exports**
- Imports: generated `BillSchema`, `CreateBillSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: create bill (201), list (paginated), get by ID, update (draft only), approve (status → `approved`), reject (with reason), attempt PATCH on approved bill → 400, soft delete, auth (401).
- [ ] Approval test: approve a `pending_review` bill; verify status changes.
- [ ] Invalid transition test: approve an already-`paid` bill → 400.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment recording tests (API-FIN-010)
- Payment run tests (API-FIN-018)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/bills.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `bills.test.ts` if infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Approval workflow tests must verify correct approver ID is recorded.
- Rejection test must verify `rejection_reason` field is stored.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/bills.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Approval test: `const res = await request(app).post(`/finance/bills/${billId}/approve`).set('Authorization', bearer).expect(200); expect(res.body.status).toBe('approved'); expect(res.body.approved_by).toBe(userId)`.

**Anti-Patterns**
- Not testing the approval workflow (critical AP domain flow).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bill approval is a domain state transition with an approver actor recorded.
- TDD: Red phase.
- BDD: "When an authorized approver approves a pending bill, the status changes to 'approved' and the approver's ID is recorded."
- Deep Module: Black-box tests.

---

### Subtasks
- [ ] API-FIN-006.0.25 (AGENT): Read API-FIN-006 and generated bill schemas.
  *No action — pause until fully understood.*

- [ ] API-FIN-006.1 (AGENT): Write all AP bill integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/finance/bills.test.ts`
  **Verification:** `pnpm test -- bills.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-FIN-006.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved.

---

## [ ] API-FIN-007: Bills (AP) – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `BillRepository` or `BillService` exists.
**Size:** Large

**Description:** Implement `BillRepository` (vendor-filtered queries) and `BillService` (approval workflow, status machine, vendor FK validation, event emission) using neverthrow Results.

**Depends on:** DB-FIN-002 (bills + bill_line_items schema), vendor repository, EVENT-001, ERROR-002.
**Blocks:** API-FIN-008 (routes), API-FIN-018 (payment run uses approved bills).
**Related Files:** `lib/db/src/repositories/finance/bills.ts`, `artifacts/api-server/src/services/finance/bill-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `bills` and `bill_line_items` tables, vendor repository, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `BillRepository`, `BillService`

**Definition of Done**
- [ ] `BillRepository`: `findById`, `findByOrg` (paginated, status/vendor filtered), `create` (transactional with line items), `update`, `updateStatus`, `findApprovedAndUnpaid`.
- [ ] `BillService`: `listBills`, `getBill`, `createBill`, `updateBill`, `approveBill`, `rejectBill`. All return `Result<T, DomainError>`.
- [ ] `createBill` validates `vendor_id` exists and belongs to same org.
- [ ] `updateBill` rejects updates on `approved`, `paid`, or `rejected` bills.
- [ ] Status machine: `draft → pending_review → approved → paid`; `pending_review → rejected`; `draft/pending_review → void`.
- [ ] `BillCreated`, `BillApproved`, `BillRejected` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment recording (API-FIN-011)
- Payment run execution (API-FIN-018)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow editing of non-draft bills

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/finance/bills.ts`, `artifacts/api-server/src/services/finance/bill-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/finance/__tests__/bill-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: edit of non-draft bill accepted → halt and add status guard.

**Rules to Follow**
- Same transactional create pattern as `InvoiceService` (bill + line items in one transaction).
- `approveBill` records `approved_by` (from actor parameter) and `approved_at` timestamp.
- `rejectBill` records `rejected_by`, `rejected_at`, and `rejection_reason`.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/finance/__tests__/bill-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Vendor validation: `const vendor = await vendorRepo.findById(dto.vendorId, orgId); if (!vendor) return err(new VendorNotFound(dto.vendorId))`.
- `findApprovedAndUnpaid` for payment runs: `WHERE status = 'approved' AND paid_at IS NULL AND organization_id = $orgId`.

**Anti-Patterns**
- Missing vendor FK validation (orphaned bills with invalid vendor references).
- Allowing editing of approved bills (data integrity issue in AP workflow).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bill approval workflow is an AP domain state machine with recorded actor (approver) for audit trail.
- TDD: Unit tests for all state transitions with mocked repository and vendor repo.
- BDD: "When a bill is approved, the approver's ID and timestamp are recorded, and a BillApproved event is emitted."
- Deep Module: `BillService` hides vendor validation, transactional create, approval recording, and event emission.

---

### Subtasks
- [ ] API-FIN-007.0.25 (AGENT): Read DB-FIN-002 schema, vendor repository API, and `InvoiceService` as pattern.
  *No action — pause until fully understood.*

- [ ] API-FIN-007.1 (AGENT): Implement `BillRepository` (with transactional create for line items).
  **File(s):** `lib/db/src/repositories/finance/bills.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-007.2 (AGENT): Implement `BillService` with approval workflow and status machine.
  **File(s):** `artifacts/api-server/src/services/finance/bill-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-007.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/finance/__tests__/bill-service.test.ts`
  **Verification:** `pnpm test -- bill-service.test.ts` green ; `pnpm typecheck`

- [ ] API-FIN-007.4 (HUMAN): Review approval workflow and status guard. Sign off.
  **Verification:** Approved; approver ID recorded; status guard confirmed; all tests green.

---

## [ ] API-FIN-008: Bills (AP) – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP bill routes wired.
**Size:** Small

**Description:** Create AP bill route handlers (CRUD + approve + reject), mount the router, and run integration tests to green.

**Depends on:** API-FIN-007 (BillService), API-FIN-006 (tests), AUTH-008.
**Blocks:** API-FIN-018 (payment run operates on approved bills).
**Related Files:** `artifacts/api-server/src/routes/finance/bills.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `BillService`, `CreateBillSchema`, `UpdateBillSchema`, `authMiddleware`
- Exports: `billsRouter` at `/api/v1/finance/bills`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST approve, POST reject, DELETE (soft) handlers.
- [ ] `CannotModifyApprovedBill` → 400; `VendorNotFound` → 400; `BillNotFound` → 404.
- [ ] `pnpm test -- bills.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment recording routes (API-FIN-012)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/finance/bills.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- `actorId` for approval/rejection extracted from `req.user.userId`.
- `organizationId` from `req.user.organizationId`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/bills.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Approve route: `router.post('/:billId/approve', authMiddleware, async (req, res) => { const result = await billService.approveBill(req.params.billId, req.user.userId, req.user.organizationId); ... })`.

**Anti-Patterns**
- Missing `actorId` when calling `approveBill` (approver not recorded).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer. Approval actor from JWT.
- TDD: Green phase for AP bills.
- BDD: All API-FIN-006 scenarios pass.
- Deep Module: Routes delegate to `BillService`.

---

### Subtasks
- [ ] API-FIN-008.0.25 (AGENT): Read `routes/finance/invoices.ts` as pattern.
  *No action — pause until fully understood.*

- [ ] API-FIN-008.1 (AGENT): Implement bills router and mount.
  **File(s):** `artifacts/api-server/src/routes/finance/bills.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-008.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- bills.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-FIN-008.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures; approval actor recorded.

---

## [ ] API-FIN-009: Payments – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add append-only payment recording endpoints (no PATCH/DELETE), idempotency header documentation, and multi-currency payment schema to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-FIN-003 (payments schema), API-FIN-001 (invoice FK reference).
**Blocks:** API-FIN-010, API-FIN-011, API-FIN-012.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `PaymentSchema`, `CreatePaymentSchema`, `PaymentMethodEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/finance/payments` with `page`, `limit`, `invoiceId`, `billId`, `method`, `dateFrom`, `dateTo` query params.
- [ ] `POST /api/v1/finance/payments` with `CreatePaymentRequestBody` schema and `Idempotency-Key` header documented.
- [ ] `GET /api/v1/finance/payments/{paymentId}` defined.
- [ ] No PATCH or DELETE endpoints defined (append-only).
- [ ] `PaymentMethodEnum`: `bank_transfer`, `credit_card`, `check`, `cash`, `virtual_card`, `other`.
- [ ] `amount_cents` as integer, `currency` as ISO 4217.
- [ ] Codegen runs successfully.

**Out of Scope**
- Payment run endpoints (API-FIN-018)
- Payment reconciliation (API-FIN-020)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- Document `Idempotency-Key` as a required request header in the `POST /payments` operation.
- No PATCH or DELETE operations — document append-only constraint prominently in spec description.
- Both `invoice_id` (AR) and `bill_id` (AP) optional FK fields — exactly one must be provided (documented in description).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `Idempotency-Key` header: `parameters: [{ name: Idempotency-Key, in: header, required: true, schema: { type: string, format: uuid } }]`.
- Payment FK constraint: documented as "exactly one of invoice_id or bill_id must be provided" in description (service enforces).

**Anti-Patterns**
- Defining PATCH or DELETE for payments (payments are financial records, must be immutable).
- Missing `Idempotency-Key` documentation (critical for preventing duplicate payment records).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payments are financial fact records — immutable once created. Idempotency prevents double-counting.
- TDD: Spec enables API-FIN-010 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Narrow interface — append-only payment recording.

---

### Subtasks
- [ ] API-FIN-009.0.25 (AGENT): Read DB-FIN-003 payments schema and understand invoice/bill FK structure.
  *No action — pause until fully understood.*

- [ ] API-FIN-009.1 (AGENT): Add `Payment` schema and all payment endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-009.2 (HUMAN): Review and sign off. Confirm no PATCH/DELETE and idempotency key documented.
  **Verification:** Approved.

---

## [ ] API-FIN-010: Payments – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment integration tests.
**Size:** Medium

**Description:** Write payment integration tests covering idempotency, FK validation (invoice/bill must exist), append-only enforcement, and multi-currency (TDD red phase).

**Depends on:** API-FIN-009 (spec + generated schemas), API-FIN-002 (AR invoices green — needed to seed test invoices).
**Blocks:** API-FIN-012 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/finance/payments.test.ts`

**Imports / Exports**
- Imports: generated `PaymentSchema`, `CreatePaymentSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: create payment for AR invoice (201), create with same `Idempotency-Key` → 200 (returns existing payment), list filtered by invoiceId, get by ID, attempt PATCH → 405, attempt DELETE → 405, missing `Idempotency-Key` → 400, invalid `invoice_id` → 400, auth (401).
- [ ] `InvoicePaid` event test: verify invoice status changes to `paid` after full payment recorded.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment run tests (API-FIN-018)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/payments.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `payments.test.ts` if infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Idempotency test: first POST returns 201; second POST with same `Idempotency-Key` returns 200 with same payment object.
- Invoice-paid test: record payment equal to invoice total; check invoice status is now `paid`.
- Append-only: PATCH and DELETE return 405.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/payments.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Idempotency test: `await request(app).post('/finance/payments').set('Idempotency-Key', 'uuid-1').send(payload).expect(201); const res2 = await request(app).post('/finance/payments').set('Idempotency-Key', 'uuid-1').send(payload).expect(200); expect(res2.body.id).toBe(firstPaymentId)`.

**Anti-Patterns**
- Not testing idempotency (critical for financial correctness).
- Not testing invoice status change to `paid` after full payment.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Idempotency is a financial domain invariant — the same payment must not be recorded twice.
- TDD: Red phase.
- BDD: "When the same payment is submitted twice with the same Idempotency-Key, the second request returns the existing payment without creating a duplicate."
- Deep Module: Black-box tests.

---

### Subtasks
- [ ] API-FIN-010.0.25 (AGENT): Read API-FIN-010, generated payment schemas, and idempotency key patterns.
  *No action — pause until fully understood.*

- [ ] API-FIN-010.1 (AGENT): Write all payment integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/finance/payments.test.ts`
  **Verification:** `pnpm test -- payments.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-FIN-010.2 (HUMAN): Review idempotency test and confirm red phase.
  **Verification:** Approved.

---

## [ ] API-FIN-011: Payments – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `PaymentRepository` or `PaymentService` exists.
**Size:** Large

**Description:** Implement `PaymentRepository` (append-only — no update/delete) and `PaymentService` (idempotency via `Idempotency-Key`, FK validation, invoice/bill balance update, event emission) using neverthrow Results.

**Depends on:** DB-FIN-003 (payments schema), DB-FIN-004 (idempotency_keys table), `InvoiceService`, `BillService`, EVENT-001, ERROR-002.
**Blocks:** API-FIN-012 (routes), API-FIN-018 (payment run creates payments).
**Related Files:** `lib/db/src/repositories/finance/payments.ts`, `artifacts/api-server/src/services/finance/payment-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `payments` and `idempotency_keys` tables, `InvoiceRepository`, `BillRepository`, `DomainEventBus`, `neverthrow`
- Exports: `PaymentRepository`, `PaymentService`

**Definition of Done**
- [ ] `PaymentRepository`: `findById`, `findByOrg` (paginated, filtered), `create` (transactional). No update or delete methods.
- [ ] `PaymentService`: `listPayments`, `getPayment`, `recordPayment`. Returns `Result<T, DomainError>`.
- [ ] Idempotency: `recordPayment` checks `idempotency_keys` table by `(key, organization_id)`; returns existing payment if found; creates new payment + idempotency record atomically if not.
- [ ] FK validation: either `invoice_id` or `bill_id` must be provided (not both, not neither).
- [ ] After payment creation: updates invoice/bill `paid_amount_cents`; if fully paid, marks invoice/bill `paid`.
- [ ] Emits `PaymentRecorded` and (if fully paid) `InvoicePaid` or `BillPaid` domain events.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Payment reversal (financial audit trail — no delete)
- Payment plan/installments

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow payment amount to exceed outstanding invoice/bill balance

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/finance/payments.ts`, `artifacts/api-server/src/services/finance/payment-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/finance/__tests__/payment-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: idempotency check not working (duplicate payments created) → halt and fix.

**Rules to Follow**
- Idempotency transaction: `SELECT FROM idempotency_keys WHERE key = $key AND org_id = $orgId FOR UPDATE` — if found, return existing; if not, INSERT payment + INSERT idempotency_key, all in transaction.
- Exactly one of `invoice_id` or `bill_id` must be provided — `BothOrNeitherFK` domain error if violated.
- Payment amount must not exceed outstanding balance: `if (payment.amount_cents > outstanding) return err(new OverpaymentNotAllowed(...))`.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/finance/__tests__/payment-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Idempotency with SELECT FOR UPDATE: `db.transaction(async (tx) => { const existing = await tx.select().from(idempotencyKeys).where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.organizationId, orgId))).for('update'); if (existing.length > 0) return ok(existingPayment); ... })`.
- Balance update: `UPDATE invoices SET paid_amount_cents = paid_amount_cents + $paymentAmount, status = CASE WHEN paid_amount_cents + $paymentAmount >= total_cents THEN 'paid' ELSE status END WHERE id = $invoiceId`.

**Anti-Patterns**
- Non-transactional idempotency check (race condition creating duplicate payments).
- Missing balance guard (overpayment corrupts financial records).
- Exposing update/delete on `PaymentRepository` (payments are immutable financial facts).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payments are financial fact records — append-only. Idempotency is a core financial domain constraint to prevent double-entry.
- TDD: Unit tests for idempotency (including concurrent calls), FK validation, and balance update.
- BDD: "When a payment is recorded that fully covers an invoice's remaining balance, the invoice status transitions to 'paid' automatically."
- Deep Module: `PaymentService.recordPayment(dto, idempotencyKey, orgId)` hides idempotency check, FK validation, balance update, status transition, and event emission.

---

### Subtasks
- [ ] API-FIN-011.0.25 (AGENT): Read DB-FIN-003, DB-FIN-004, `InvoiceRepository`, `BillRepository`, and idempotency patterns.
  *No action — pause until fully understood.*

- [ ] API-FIN-011.0.5 (AGENT): Research SELECT FOR UPDATE in Drizzle for idempotency locking and transactional balance update patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-011.0.75 (AGENT): Confirm overpayment policy (reject vs allow partial credit) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-011.1 (AGENT): Implement `PaymentRepository` (append-only).
  **File(s):** `lib/db/src/repositories/finance/payments.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-011.2 (AGENT): Implement `PaymentService` with idempotency, FK validation, balance update, and events.
  **File(s):** `artifacts/api-server/src/services/finance/payment-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-011.3 (AGENT): Write and run unit tests including idempotency race condition test.
  **File(s):** `artifacts/api-server/src/services/finance/__tests__/payment-service.test.ts`
  **Verification:** `pnpm test -- payment-service.test.ts` green ; `pnpm typecheck`

- [ ] API-FIN-011.4 (HUMAN): Review idempotency implementation and balance update atomicity. Sign off.
  **Verification:** Approved; SELECT FOR UPDATE confirmed; no duplicate payments possible; all tests green.

---

## [ ] API-FIN-012: Payments – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No payment routes wired.
**Size:** Small

**Description:** Create payment route handlers (GET list, POST record, GET by ID — no PATCH/DELETE), extract `Idempotency-Key` header, mount the router, and run integration tests to green.

**Depends on:** API-FIN-011 (PaymentService), API-FIN-010 (tests), AUTH-008.
**Blocks:** [N/A] — payments are a terminal Finance feature (no downstream dependencies in core).
**Related Files:** `artifacts/api-server/src/routes/finance/payments.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `PaymentService`, `CreatePaymentSchema`, `authMiddleware`
- Exports: `paymentsRouter` at `/api/v1/finance/payments`

**Definition of Done**
- [ ] GET list, POST (extracts `Idempotency-Key` from `req.headers`), GET by ID routes only.
- [ ] Missing `Idempotency-Key` → 400 `MissingIdempotencyKey`.
- [ ] PATCH and DELETE return 405.
- [ ] `pnpm test -- payments.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/finance/payments.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: PATCH or DELETE accidentally registered → halt and remove.

**Rules to Follow**
- `Idempotency-Key`: `const idempotencyKey = req.headers['idempotency-key']; if (!idempotencyKey) return res.status(400).json({ error: 'MissingIdempotencyKey' })`.
- 405 catch-all after POST: `router.all('/', methodNotAllowed)` and `router.all('/:id', methodNotAllowed)`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/payments.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Header extraction: `const idempotencyKey = req.headers['idempotency-key'] as string | undefined`.

**Anti-Patterns**
- Missing `Idempotency-Key` validation (allows duplicate payment records).
- Accidentally registering PATCH/DELETE routes (breaks append-only invariant).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only route config enforces financial immutability at HTTP layer.
- TDD: Green phase for payments.
- BDD: All API-FIN-010 scenarios pass.
- Deep Module: Routes delegate to `PaymentService`.

---

### Subtasks
- [ ] API-FIN-012.0.25 (AGENT): Read `routes/crm/activities.ts` as append-only route pattern reference.
  *No action — pause until fully understood.*

- [ ] API-FIN-012.1 (AGENT): Implement payments router (GET list, POST, GET by ID, 405 catch-all).
  **File(s):** `artifacts/api-server/src/routes/finance/payments.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-012.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- payments.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-FIN-012.3 (HUMAN): Final sign-off. Verify no PATCH/DELETE routes and idempotency key enforced.
  **Verification:** Approved; 0 failures; append-only confirmed.

---

## [ ] API-FIN-013: Virtual Cards – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No virtual card endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add virtual card issuance, freeze/unfreeze, limit update, and soft-delete endpoints to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-FIN-005 (virtual_cards schema).
**Blocks:** API-FIN-014, API-FIN-015, API-FIN-016.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `VirtualCardSchema`, `CreateVirtualCardSchema`, `VirtualCardStatusEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/finance/virtual-cards` with `page`, `limit`, `status`, `assignedTo` query params.
- [ ] `POST /api/v1/finance/virtual-cards` — issue a new card with `assignedTo`, `spend_limit_cents`, `spend_limit_interval`.
- [ ] `GET /api/v1/finance/virtual-cards/{cardId}` defined.
- [ ] `PATCH /api/v1/finance/virtual-cards/{cardId}` — update `spend_limit_cents`, `spend_limit_interval`.
- [ ] `POST /api/v1/finance/virtual-cards/{cardId}/freeze` — transitions `active → frozen`.
- [ ] `POST /api/v1/finance/virtual-cards/{cardId}/unfreeze` — transitions `frozen → active`.
- [ ] `DELETE /api/v1/finance/virtual-cards/{cardId}` — soft delete (transitions to `cancelled`).
- [ ] `VirtualCardStatusEnum`: `active`, `frozen`, `cancelled`.
- [ ] `spend_limit_interval` enum: `daily`, `weekly`, `monthly`, `transaction`.
- [ ] Codegen runs successfully.

**Out of Scope**
- Real card network integration (Stripe Issuing, Marqeta — stub only)
- Transaction history for virtual cards (future task)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- `spend_limit_cents` as integer (cents).
- Card number and CVV must NEVER appear in API responses (spec explicitly excludes these fields).
- `cancelled` cards cannot be unfrozen.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- Security: mark `card_number` and `cvv` as `writeOnly: true` or omit from response schemas entirely.
- `spend_limit_interval` enum as reusable spec component.

**Anti-Patterns**
- Including raw card number or CVV in response schemas (PCI compliance violation).
- Missing `spend_limit_interval` (makes spend limit enforcement ambiguous).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Virtual cards are financial instruments. Card issuance, freeze, and cancellation are domain state transitions.
- TDD: Spec enables API-FIN-014 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Narrow spec interface hides card network integration complexity.

---

### Subtasks
- [ ] API-FIN-013.0.25 (AGENT): Read DB-FIN-005 virtual_cards schema and PCI data handling requirements.
  *No action — pause until fully understood.*

- [ ] API-FIN-013.1 (AGENT): Add `VirtualCard` schema and all card endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-013.2 (HUMAN): Review — confirm card_number/CVV NOT in response schemas. Sign off.
  **Verification:** Approved; no PCI-sensitive fields in responses.

---

## [ ] API-FIN-014: Virtual Cards – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No virtual card integration tests.
**Size:** Medium

**Description:** Write virtual card integration tests covering issuance, freeze/unfreeze, limit update, cancellation, and security (no card numbers in responses) — TDD red phase.

**Depends on:** API-FIN-013 (spec + generated schemas).
**Blocks:** API-FIN-016 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/finance/virtual-cards.test.ts`

**Imports / Exports**
- Imports: generated `VirtualCardSchema`, `CreateVirtualCardSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: issue card (201), list (filtered by status), get by ID, update spend limit, freeze (status → `frozen`), unfreeze (status → `active`), cancel (soft delete → `cancelled`), attempt unfreeze of `cancelled` card → 400, auth (401).
- [ ] Security test: verify response body does NOT contain `card_number` or `cvv` fields.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Card transaction tests (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/virtual-cards.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `virtual-cards.test.ts` if infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Security test: `expect(res.body).not.toHaveProperty('card_number'); expect(res.body).not.toHaveProperty('cvv')`.
- Freeze/unfreeze state machine test: freeze active → 200; attempt freeze already-frozen → 400.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/virtual-cards.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Security assertion: `const sensitiveFields = ['card_number', 'cvv', 'full_card_number']; sensitiveFields.forEach(field => expect(res.body).not.toHaveProperty(field))`.

**Anti-Patterns**
- Not testing card number/CVV absence (PCI data leakage risk not tested).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Card freeze/unfreeze are domain state transitions. Card number is a sensitive field excluded from domain read models.
- TDD: Red phase.
- BDD: "When a virtual card is issued, the response never contains the raw card number or CVV."
- Deep Module: Black-box tests.

---

### Subtasks
- [ ] API-FIN-014.0.25 (AGENT): Read API-FIN-014 and generated card schemas.
  *No action — pause until fully understood.*

- [ ] API-FIN-014.1 (AGENT): Write all virtual card integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/finance/virtual-cards.test.ts`
  **Verification:** `pnpm test -- virtual-cards.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-FIN-014.2 (HUMAN): Review test coverage (especially security test). Confirm red phase.
  **Verification:** Approved.

---

## [ ] API-FIN-015: Virtual Cards – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `VirtualCardRepository` or `VirtualCardService` exists.
**Size:** Large

**Description:** Implement `VirtualCardRepository` (org-scoped queries) and `VirtualCardService` (freeze/unfreeze state machine, spend limit validation, cancellation, card network stub) using neverthrow Results.

**Depends on:** DB-FIN-005 (virtual_cards schema), EVENT-001, ERROR-002.
**Blocks:** API-FIN-016 (routes use VirtualCardService).
**Related Files:** `lib/db/src/repositories/finance/virtual-cards.ts`, `artifacts/api-server/src/services/finance/virtual-card-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `virtualCards` table, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `VirtualCardRepository`, `VirtualCardService`

**Definition of Done**
- [ ] `VirtualCardRepository`: `findById`, `findByOrg` (paginated, status-filtered), `create`, `update`, `cancel` (sets `cancelled_at`).
- [ ] `VirtualCardService`: `listCards`, `getCard`, `issueCard`, `updateCardLimits`, `freezeCard`, `unfreezeCard`, `cancelCard`. All return `Result<T, DomainError>`.
- [ ] `freezeCard` only works on `active` cards; `unfreezeCard` only on `frozen`; `cancelCard` on `active` or `frozen`.
- [ ] `cancelCard` is irreversible (cannot unfreeze a cancelled card).
- [ ] `issueCard` calls a card network stub (returns a fake `last4` and masked card reference).
- [ ] Card number and CVV NEVER stored in DB or returned from service.
- [ ] `CardIssued`, `CardFrozen`, `CardCancelled` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Real card network integration (Stripe Issuing, Marqeta)
- Card transaction tracking
- Spend limit enforcement at transaction time

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never store or return raw card numbers or CVVs

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/finance/virtual-cards.ts`, `artifacts/api-server/src/services/finance/virtual-card-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/finance/__tests__/virtual-card-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: any card number or CVV found in service output or logs → halt and sanitise immediately.

**Rules to Follow**
- Card network stub: `const stub = { last4: '4242', networkCardId: `CARD_${crypto.randomUUID()}` }`.
- State machine: `CARD_TRANSITIONS = { active: ['frozen', 'cancelled'], frozen: ['active', 'cancelled'], cancelled: [] }`.
- Cancelled card is final — no transitions allowed from `cancelled`.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/finance/__tests__/virtual-card-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Stub card network: `async function issueCardWithNetwork(dto): Promise<{ last4: string, networkCardId: string }> { return { last4: '4242', networkCardId: crypto.randomUUID() }; }`.
- State machine guard: `if (!CARD_TRANSITIONS[card.status].includes(targetStatus)) return err(new InvalidCardStateTransition(card.status, targetStatus))`.

**Anti-Patterns**
- Storing raw card number in DB or returning from any method (PCI compliance violation).
- Missing cancellation irreversibility (allowing unfreeze after cancellation).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Virtual cards are financial instruments with a strict lifecycle. Cancellation is a terminal state — irreversible by design.
- TDD: Unit tests for all state transitions, including attempted unfreeze of cancelled card.
- BDD: "When a virtual card is cancelled, all subsequent freeze/unfreeze attempts return a 400 CardAlreadyCancelled error."
- Deep Module: `VirtualCardService` hides card network stub, state machine, and event emission.

---

### Subtasks
- [ ] API-FIN-015.0.25 (AGENT): Read DB-FIN-005 schema, card network stub requirements, and PCI data rules.
  *No action — pause until fully understood.*

- [ ] API-FIN-015.1 (AGENT): Implement `VirtualCardRepository`.
  **File(s):** `lib/db/src/repositories/finance/virtual-cards.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-015.2 (AGENT): Implement `VirtualCardService` with state machine, stub, and events.
  **File(s):** `artifacts/api-server/src/services/finance/virtual-card-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-015.3 (AGENT): Write and run unit tests. Verify no card numbers in any output.
  **File(s):** `artifacts/api-server/src/services/finance/__tests__/virtual-card-service.test.ts`
  **Verification:** `pnpm test -- virtual-card-service.test.ts` green ; `pnpm typecheck`

- [ ] API-FIN-015.4 (HUMAN): Security review — confirm no card numbers/CVVs in code, logs, or tests. Sign off.
  **Verification:** Approved; PCI compliance confirmed; all tests green.

---

## [ ] API-FIN-016: Virtual Cards – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No virtual card routes wired.
**Size:** Small

**Description:** Create virtual card route handlers (CRUD + freeze/unfreeze + cancel), mount the router, and run integration tests to green.

**Depends on:** API-FIN-015 (VirtualCardService), API-FIN-014 (tests), AUTH-008.
**Blocks:** [N/A] — terminal Finance core feature.
**Related Files:** `artifacts/api-server/src/routes/finance/virtual-cards.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `VirtualCardService`, `CreateVirtualCardSchema`, `UpdateVirtualCardSchema`, `authMiddleware`
- Exports: `virtualCardsRouter` at `/api/v1/finance/virtual-cards`

**Definition of Done**
- [ ] GET list, POST issue, GET by ID, PATCH limits, POST freeze, POST unfreeze, DELETE cancel handlers.
- [ ] `InvalidCardStateTransition` → 400; `VirtualCardNotFound` → 404.
- [ ] `pnpm test -- virtual-cards.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never return `card_number` or `cvv` in route responses

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/finance/virtual-cards.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: card number found in response → halt and sanitize immediately.

**Rules to Follow**
- Sub-resource action routes: `POST /:cardId/freeze`, `POST /:cardId/unfreeze`.
- `organizationId` from `req.user.organizationId` only.
- `InvalidCardStateTransition` → 400 with descriptive message including current and attempted status.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/virtual-cards.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Same sub-resource route pattern as `routes/finance/invoices.ts` (send, void actions).

**Anti-Patterns**
- Returning card_number or CVV in any route response (critical PCI violation).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer. State machine in service.
- TDD: Green phase for virtual cards.
- BDD: All API-FIN-014 scenarios pass.
- Deep Module: Routes delegate to `VirtualCardService`.

---

### Subtasks
- [ ] API-FIN-016.0.25 (AGENT): Read `routes/finance/invoices.ts` as pattern (sub-resource actions).
  *No action — pause until fully understood.*

- [ ] API-FIN-016.1 (AGENT): Implement virtual cards router and mount.
  **File(s):** `artifacts/api-server/src/routes/finance/virtual-cards.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-FIN-016.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- virtual-cards.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-FIN-016.3 (HUMAN): Security review and sign-off. Confirm no card data in responses.
  **Verification:** Approved; 0 failures; no PCI data in responses.

---

# TODO-P3-FINANCE-CORE.md – Phase 3: Finance Core CRUD

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Finance context Core CRUD operations – Invoices, Payments, Virtual Cards, and Budgets. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Finance – Core CRUD

### [ ] API‑FIN‑001: Invoices – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑001, DOMAIN‑003 (feature file).  
**Definition of Done:** OpenAPI spec adds `finance` tag and invoice paths with `/api/v1/` prefix:  
- `GET /api/v1/finance/invoices` – list with pagination, filter by `type` (AP/AR), `status`, `vendor_id`, `customer_id`, `currency`. Response envelope standard.  
- `POST /api/v1/finance/invoices` – create invoice with new fields: `currency` (default USD), `exchange_rate` (nullable), `tax_amount_cents` (default 0), `tax_type` (nullable). Validates type‑dependent FK (`vendor_id` for AP, `customer_id` for AR). Returns 201 with `Location` header.  
- `GET /api/v1/finance/invoices/{invoiceId}` – get by ID, includes currency and tax fields.  
- `PATCH /api/v1/finance/invoices/{invoiceId}` – update fields; currency change restricted to draft stage.  
- `DELETE /api/v1/finance/invoices/{invoiceId}` – soft delete, 204.  
Schemas: `Invoice`, `InvoiceCreate`, `InvoiceUpdate`. Examples required.  
**DDD:** Invoice type determines party FK and lifecycle. Multi‑currency and tax are now first‑class.  
**TDD (Spec):** After codegen, integration tests (API‑FIN‑002) will be written. This is a specification task, not implementation.  
**BDD:** Enables "Create multi‑currency invoice" and "Invoice with tax" scenarios.  
**Deep Module:** The spec is the public interface; InvoiceService underneath will be a deep module.

### Subtasks:
- [ ] API‑FIN‑001.1: Add invoice paths and schemas with `currency`, `exchange_rate`, `tax_amount_cents`, `tax_type` fields to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; generated types include new fields.
- [ ] API‑FIN‑001.2: Define examples for multi‑currency and taxed invoices. (AGENT)  
  **verification:** Swagger UI renders examples.
- [ ] API‑FIN‑001.3: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.
- **Blocks:** API‑FIN‑002.

---

### [ ] API‑FIN‑002: Invoices – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api‑server/__tests__/api/finance/invoices.test.ts` contains failing tests for:  
- Create AP invoice with vendor → 201, verify currency and tax fields stored.  
- Create AR invoice with customer → 201.  
- Create invoice with wrong FK for type → 400 `InvoiceTypeViolation`.  
- Create invoice with invalid currency → 400 validation error.  
- Status transitions: draft → sent → paid/overdue.  
- Update invoice (draft only) → 200.  
- Attempt to update sent invoice → 400.  
- Soft delete → 204.  
- Unauthorized → 401.  
**Related Files:** `.../invoices.test.ts`

### Subtasks:
- [ ] API‑FIN‑002.1: Write test cases including multi‑currency and tax assertions. (AGENT)  
  **verification:** Tests fail (red) with 404 errors: `pnpm test -- invoices.test.ts --reporter=verbose`.
- [ ] API‑FIN‑002.2: Add test for invoice status transitions and validation. (AGENT)  
  **verification:** Status transition tests fail with validation errors.
- [ ] API‑FIN‑002.3: Add test for unauthorized access and permission validation. (AGENT)  
  **verification:** Authorization tests fail with 401/403 errors.

---

### [ ] API‑FIN‑003: Invoices – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository, ERROR‑002, EVENT‑001.  
**Definition of Done:**  
- `InvoiceRepository` extends `BaseRepository` with soft delete.  
- `InvoiceService` with methods: `create`, `get`, `list`, `update`, `softDelete`. Enforces:  
  - Type‑dependent FK validation (vendor for AP, customer for AR).  
  - Status machine: draft → sent → paid/overdue.  
  - Currency change only allowed in draft status.  
  - Tax fields validated against valid tax types.  
- Emits `InvoiceCreated`, `InvoicePaid` events.  
- All methods return `Result<T, DomainError>`.  
**Deep Module:** Encapsulates invoice lifecycle, type validation, currency and tax handling.  

**Missing Event Emission Test:** Add test case to verify `InvoiceCreated` and `InvoicePaid` events are emitted with correct payload structure.  
**Finance Anti-Patterns:**  
- Missing currency validation allowing invalid exchange rates  
- Incorrect tax calculations leading to financial discrepancies  
- Allowing invoice updates after sent status (violates accounting rules)  
- Missing audit trail for invoice modifications  

**DoD Boundary Overlap:** Some validation logic overlaps with routes layer - clarify separation between service validation and route validation.  
**DoD Missing Negative Cases:** Add tests for invalid currency codes, negative amounts, tax type validation, and unauthorized status transitions.

### Subtasks:
- [ ] API‑FIN‑003.1: Implement `InvoiceRepository` extending `BaseRepository` with soft delete. (AGENT) – `lib/db/src/repositories/finance/invoices.ts`  
  **verification:** Unit tests for repository pass: `pnpm test -- invoices.repository.test.ts`.
- [ ] API‑FIN‑003.2: Implement `InvoiceService` with type validation, status machine, currency/tax support. (AGENT) – `artifacts/api-server/src/services/finance/invoice‑service.ts`  
  **verification:** Unit tests with mocked repo pass: `pnpm test -- invoice-service.test.ts`.
- [ ] API‑FIN‑003.3: Write unit tests for service (type validation, status transitions, currency change guard, event emission). (AGENT)  
  **verification:** All unit tests green with ≥90% coverage: `pnpm test -- coverage -- invoice-service.test.ts`.
- [ ] API‑FIN‑003.4: Add event emission tests for `InvoiceCreated` and `InvoicePaid` events. (AGENT)  
  **verification:** Event emission tests pass with correct payload validation.
- [ ] API‑FIN‑003.5: Depth refactor check: method count ≤ 5, no `throw`, all returns Either. (AGENT)  
  **verification:** `grep -c "export.*method\|export.*function" invoice-service.ts | grep -E "^[1-5]$" && grep -q "throw\|Throw" invoice-service.ts || echo "No throws found" && pnpm typecheck`.

---

### [ ] API‑FIN‑004: Invoices – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑003, AUTH‑008, ERROR‑001.  
**Subtasks:** route creation, integration tests turn green.

---

### [ ] API‑FIN‑005: Payments – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑002.  
**Definition of Done:** Payment endpoints:  
- `POST /api/v1/finance/invoices/{invoiceId}/payments` – create payment. Body includes `amount`, `currency` (defaults to invoice currency), `exchange_rate` (nullable), `method`. Include `Idempotency‑Key` header (UUID, optional). Response: 201 with payment object. If key provided and duplicate, return existing payment with 200.  
- `GET /api/v1/finance/invoices/{invoiceId}/payments` – list payments with pagination.  
- Append‑only – no PATCH or DELETE.  
Schemas: `Payment`, `PaymentCreate`. Examples.  
**DDD:** Payment reduces invoice balance; idempotency prevents duplicates. Multi‑currency support.

### Subtasks:
- [ ] API‑FIN‑005.1: Add payment paths with idempotency header and currency fields to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑005.2: Run codegen and typecheck. (HUMAN/AGENT)  
  **verification:** No errors.
- **Blocks:** API‑FIN‑006.

---

### [ ] API‑FIN‑006: Payments – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑005, TEST‑INFRA‑001.  
**Tests include:**  
- Create payment → 201, invoice balance reduced.  
- Payment amount exceeds remaining balance → 422 `PaymentExceedsBalance`.  
- Pay for non‑existent invoice → 404.  
- Duplicate idempotency key returns same payment → 200, only one DB row.  
- Payment records are not updatable (PATCH/DELETE → 404).  
- Multi‑currency payment (different from invoice currency) → 201, exchange rate recorded.

---

### [ ] API‑FIN‑007: Payments – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, EVENT‑001.  
**Definition of Done:** `PaymentRepository` (append‑only, supports `findByIdempotencyKey`). `PaymentService` validates balance, handles currency conversion if different from invoice, emits `PaymentRecorded` (and `InvoicePaid` if fully paid), handles idempotency (check key, catch DB unique violation). Result<T, DomainError> returns.  
**Deep Module:** Encapsulates payment validation, currency handling, idempotency, and event publishing.  

**Finance Anti-Patterns:**  
- Missing idempotency handling causing duplicate payments  
- Incorrect balance calculations leading to overpayment  
- Missing currency conversion logic for multi-currency payments  
- Allowing payment modification (violates accounting principles)  
- Incomplete audit trail for payment transactions

### Subtasks:
- [ ] API‑FIN‑007.1: Implement repository with idempotency key lookup. (AGENT) – `lib/db/src/repositories/finance/payments.ts`  
  **verification:** Repository unit tests pass: `pnpm test -- payments.repository.test.ts`.
- [ ] API‑FIN‑007.2: Implement service with balance check, currency handling, event emission, and idempotency. (AGENT) – `artifacts/api-server/src/services/finance/payment-service.ts`  
  **verification:** Service unit tests pass: `pnpm test -- payment-service.test.ts`.
- [ ] API‑FIN‑007.3: Write test for duplicate idempotency key handling. (AGENT)  
  **verification:** Idempotency tests pass with correct duplicate detection.
- [ ] API‑FIN‑007.4: Write tests for currency conversion and balance validation. (AGENT)  
  **verification:** Currency and balance tests pass with accurate calculations.
- [ ] API‑FIN‑007.5: Depth refactor check - verify service encapsulates payment logic correctly. (AGENT)  
  **verification:** Service has ≤5 methods and proper error handling: `grep -c "export.*method\|export.*function" payment-service.ts | grep -E "^[1-5]$" && pnpm typecheck`.

---

### [ ] API‑FIN‑008: Payments – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑007, AUTH‑008.  
**Subtasks:** routes, integration tests green.

---

### [ ] API‑FIN‑009: Virtual Cards – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑003.  
**Definition of Done:** CRUD endpoints: `GET /api/v1/finance/cards`, `POST /api/v1/finance/cards/issue`, `GET /{cardId}`, `PATCH` to freeze/update limit, `DELETE` (soft). Freeze/unfreeze logic. Examples.

### Subtasks:
- [ ] API‑FIN‑009.1: Add card paths to OpenAPI. (AGENT)  
- [ ] API‑FIN‑009.2: Run codegen and typecheck. (HUMAN/AGENT)

---

### [ ] API‑FIN‑010: Virtual Cards – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑009, TEST‑INFRA‑001.  
**Tests include:** issue card → 201, freeze → 200, unfreeze → 200, attempt to use frozen card → 400, soft delete, unauthorized.

---

### [ ] API‑FIN‑011: Virtual Cards – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `VirtualCardRepository` and `VirtualCardService` with freeze/unfreeze state machine, limit enforcement. Result<T, DomainError> returns.  
**Deep Module:** Encapsulates card lifecycle and spending controls.

---

### [ ] API‑FIN‑012: Virtual Cards – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑011.  
**Subtasks:** routes, tests green.

---

### [ ] API‑FIN‑013: Budgets – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑004.  
**Definition of Done:** CRUD for budgets: `GET /api/v1/finance/budgets` (filter by project), `POST`, `GET /{id}`, `PATCH`, `DELETE` (soft). Examples.

### Subtasks:
- [ ] API‑FIN‑013.1: Add budget paths to OpenAPI. (AGENT)  
- [ ] API‑FIN‑013.2: Run codegen and typecheck.

---

### [ ] API‑FIN‑014: Budgets – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑013, TEST‑INFRA‑001.  
**Tests include:** create budget → 201, update allocated amount → 200, attempt to set spent_amount directly → 400 (spent is derived), budget exceeded alert → warning event emitted.

---

### [ ] API‑FIN‑015: Budgets – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, EVENT‑001.  
**Definition of Done:** `BudgetRepository` and `BudgetService` with: `spent_amount` derived from payments/invoices, not writable; emits `BudgetThresholdReached` when 80% consumed; emits `BudgetExceeded` when spend exceeds allocation. Result<T, DomainError> returns.  
**Deep Module:** Encapsulates budget tracking, threshold detection, and event publishing.  

**Finance Anti-Patterns:**  
- Allowing direct modification of derived `spent_amount` field  
- Missing real-time budget threshold notifications  
- Incorrect budget calculations excluding certain transaction types  
- Missing budget variance analysis and reporting  
- Incomplete budget audit trail for compliance

---

### [ ] API‑FIN‑016: Budgets – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑015.  
**Subtasks:** routes, tests green.

---

## Common Finance Core Sections

**Rules to Follow:**  
- All financial operations must be atomic and consistent  
- Multi-currency support must be handled with proper exchange rate validation  
- Payment records are append-only (no modifications allowed)  
- Budget calculations must be derived, not directly modifiable  
- All finance services must emit appropriate domain events  

**Advanced Code Patterns:**  
- Result<T, DomainError> pattern for all service methods  
- Transactional data consistency across multiple entities  
- Event-driven architecture for financial notifications  
- Idempotency handling for payment operations  
- Derived field calculations with proper validation  

**Finance Anti-Patterns:**  
- Direct modification of financial records after they're finalized  
- Missing currency conversion logic in multi-currency scenarios  
- Allowing negative balances without proper validation  
- Non-atomic financial transactions leading to data inconsistency  
- Missing audit trails for financial operations  

**Out of Scope:**  
- Advanced financial reporting and analytics  
- Tax calculation engine integration  
- Automated payment processing workflows  
- Financial forecasting and planning tools  
- Regulatory compliance reporting (SOX, GAAP, etc.)

---

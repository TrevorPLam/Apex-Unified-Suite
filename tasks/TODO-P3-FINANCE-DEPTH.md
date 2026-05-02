# TODO-P3-FINANCE-DEPTH.md – Phase 3: Finance Depth Features

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Finance context depth features – advanced functionality from the Bill.com research. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Finance – Depth (Bill.com research)

### [ ] API‑FIN‑017: Credit Memo & Invoice Credit API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑008, API‑FIN‑004 (invoices green).  
**Definition of Done:** Credit memo management:  
- `GET /api/v1/finance/credit‑memos` – list with pagination, filter by `customer_id`, `status`.  
- `POST /api/v1/finance/credit‑memos` – create credit memo. Body: `{ customer_id, amount_cents, reason, invoice_id? }`.  
- `GET /api/v1/finance/credit‑memos/{memoId}` – get detail.  
- `POST /api/v1/finance/credit‑memos/{memoId}/apply` – apply credit to one or more invoices. Validates that applied amount does not exceed memo total.  
- `PATCH /api/v1/finance/credit‑memos/{memoId}` – update memo details (draft only).  
- `POST /api/v1/finance/credit‑memos/{memoId}/void` – void unused credit.  
Status transitions: draft → issued → applied/void.  
Emits `CreditMemoCreated`, `CreditMemoApplied` events.  
**Integration tests:** create memo, apply to invoice (invoice balance reduced), apply exceeding memo amount → 400, void memo, list by customer.  
**DDD:** Credit memos reduce open invoice balances (Bill.com feature).  
**Deep Module:** Encapsulates credit lifecycle, application logic, and balance tracking.

### Subtasks:
- [ ] API‑FIN‑017.1: Add credit memo paths and schemas to OpenAPI. (AGENT)  
  **verification:** Spec validates; codegen passes.
- [ ] API‑FIN‑017.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑017.3: Implement `CreditMemoService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑017.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑018: Payment Run (Batch Payment) API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑010, API‑AP‑008 (bills), API‑FIN‑004 (invoices).  
**Definition of Done:** Batch payment processing:  
- `GET /api/v1/finance/payment‑runs` – list payment runs with status filter.  
- `POST /api/v1/finance/payment‑runs` – create a new payment run. Body: `{ bill_ids[], payment_date, bank_account_id }`. Validates all bills are approved and not already paid.  
- `GET /api/v1/finance/payment‑runs/{runId}` – detail with included bills and totals.  
- `POST /api/v1/finance/payment‑runs/{runId}/execute` – execute the batch payment; creates individual bill payment records, decrements bank account balance, updates bill statuses to `paid`.  
- `POST /api/v1/finance/payment‑runs/{runId}/cancel` – cancel a draft payment run.  
Status transitions: draft → processing → completed/cancelled.  
Emits `PaymentRunCreated`, `PaymentRunCompleted` events.  
**Integration tests:** create run with multiple bills, execute, verify all bills paid and payments recorded; attempt to execute with zero bills → 400; cancel a draft run.  
**DDD:** Bill.com batch payment processing for efficiency.  
**Deep Module:** Encapsulates multi‑bill payment orchestration and transactional execution.

### Subtasks:
- [ ] API‑FIN‑018.1: Add payment run paths to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑018.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑018.3: Implement `PaymentRunService` with batch processing logic. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑018.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑019: 1099 Preparation API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑011, API‑AP‑004 (vendors).  
**Definition of Done:** 1099 tracking and preparation:  
- `GET /api/v1/finance/1099‑tracking` – list all vendors with 1099 tracking status, filter by `year`, `filing_status`.  
- `POST /api/v1/finance/1099‑tracking/refresh` – recalculate year‑to‑date payment totals for all 1099‑eligible vendors for a given year.  
- `GET /api/v1/finance/1099‑tracking/{vendorId}/{year}` – detail view with payment breakdown.  
- `PATCH /api/v1/finance/1099‑tracking/{vendorId}/{year}` – update filing status.  
- `POST /api/v1/finance/1099‑tracking/export` – generate CSV/PDF export for tax filing (stubbed for now).  
**Integration tests:** refresh totals, verify amounts correct, update filing status, export.  
**DDD:** US tax compliance feature (Bill.com 1099 tracking).  
**Deep Module:** Encapsulates payment accumulation and filing workflow.

### Subtasks:
- [ ] API‑FIN‑019.1: Add 1099 endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑019.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑019.3: Implement `Form1099Service` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑019.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑020: Reconciliation API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑012, API‑FIN‑008 (payments), API‑AP‑008 (bills).  
**Definition of Done:** Bank reconciliation endpoints:  
- `GET /api/v1/finance/reconciliation` – list reconciliation entries, filter by `bank_account_id`, `match_status`, `date` range.  
- `POST /api/v1/finance/reconciliation/match` – manually match a bank transaction to a bill payment or customer payment. Body: `{ bank_account_id, transaction_type, transaction_id, external_reference }`.  
- `PATCH /api/v1/finance/reconciliation/{entryId}/flag` – flag an unmatched entry for review.  
- `GET /api/v1/finance/reconciliation/unmatched` – list all unmatched bank transactions.  
**Integration tests:** match a transaction, flag an entry, list unmatched.  
**DDD:** Reconciliation workflow for financial accuracy (Bill.com feature).  
**Deep Module:** Encapsulates matching logic and status management.

### Subtasks:
- [ ] API‑FIN‑020.1: Add reconciliation endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑020.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑020.3: Implement `ReconciliationService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑020.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑021: AP Inbox API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑013, API‑AP‑008 (bills).  
**Definition of Done:** AP invoice capture inbox:  
- `GET /api/v1/finance/ap‑inbox` – list captured invoices, filter by `status` (pending_review/processed/error), `source` (email/upload/manual). Paginated.  
- `GET /api/v1/finance/ap‑inbox/{captureId}` – detail with extracted data and confidence scores.  
- `POST /api/v1/finance/ap‑inbox/{captureId}/process` – convert captured invoice into a draft bill. Accepts overrides for extracted fields. Pre‑fills bill with extracted data.  
- `POST /api/v1/finance/ap‑inbox/{captureId}/reject` – mark as error with reason.  
- `POST /api/v1/finance/ap‑inbox/upload` – manually upload an invoice file for processing (OCR stub).  
**Integration tests:** list inbox items, process one into a bill, verify bill created with extracted data, reject an item.  
**DDD:** Bill.com‑style AP inbox for invoice capture before bill creation.  
**Deep Module:** Encapsulates capture lifecycle, OCR integration point, and bill creation logic.

### Subtasks:
- [ ] API‑FIN‑021.1: Add AP inbox endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑021.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑021.3: Implement `APInboxService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑021.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑022: Collections Activity API
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑014, API‑AR‑008 (AR invoices).  
**Definition of Done:** AR collections activity tracking:  
- `GET /api/v1/finance/collections‑activity` – list activity entries, filter by `customer_id`, `invoice_id`, `outcome`, `date` range. Paginated.  
- `POST /api/v1/finance/collections‑activity` – log a collection attempt. Body: `{ customer_id, invoice_id, contact_method, notes, outcome, promise_to_pay_date? }`.  
- `GET /api/v1/finance/collections‑activity/summary/{customerId}` – summary of all activity for a customer (last contact, promise status, total overdue).  
Append‑only – no updates, no deletes.  
**Integration tests:** log a call, log an email, retrieve summary, filter by outcome.  
**DDD:** Collections workbench for AR management (Bill.com feature).  
**Deep Module:** Encapsulates activity logging and summary aggregation.

### Subtasks:
- [ ] API‑FIN‑022.1: Add collections activity endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑022.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑022.3: Implement `CollectionsActivityService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑022.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑023: Customer Payment Portal Configuration API
**Status:** ⏳ Not Started  
**Depends on:** DB‑AR‑006, API‑AR‑004 (customers).  
**Definition of Done:** Per‑customer payment portal settings:  
- `GET /api/v1/finance/customers/{customerId}/payment‑portal‑config` – get current configuration.  
- `PUT /api/v1/finance/customers/{customerId}/payment‑portal‑config` – upsert configuration. Body: `{ allowed_payment_methods_json, auto_pay_enabled, portal_branding_json?, custom_message? }`.  
- `PATCH /api/v1/finance/customers/{customerId}/payment‑portal‑config` – partial update.  
**Integration tests:** set config, retrieve, update allowed methods, enable auto‑pay.  
**DDD:** Bill.com per‑customer payment portal branding and settings.

### Subtasks:
- [ ] API‑FIN‑023.1: Add payment portal config endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑FIN‑023.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑FIN‑023.3: Implement service and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑FIN‑023.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑FIN‑050: Finance Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑003, API‑FIN‑007, API‑FIN‑015, API‑FIN‑017, API‑FIN‑018, DB‑SETTINGS‑002.  
**Definition of Done:** Verify the following finance events are emitted and recorded in audit logs:  
- `InvoiceCreated`, `InvoicePaid`  
- `PaymentRecorded`  
- `BudgetThresholdReached`, `BudgetExceeded`  
- `CreditMemoCreated`, `CreditMemoApplied`  
- `PaymentRunCreated`, `PaymentRunCompleted`  
Integration test performs each action via API and asserts corresponding audit log entry.

### Subtasks:
- [ ] API‑FIN‑050.1: Verify all service methods emit the correct events (unit tests). (AGENT)  
  **verification:** Unit tests for event emission pass.
- [ ] API‑FIN‑050.2: Write integration tests: pay invoice → `InvoicePaid`; payment run executed → `PaymentRunCompleted`; credit memo applied → `CreditMemoApplied`. (AGENT)  
  **verification:** Green.
- [ ] API‑FIN‑050.3: All integration tests green. (AGENT)

---

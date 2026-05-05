# TODO-P3-FINANCE-DEPTH.md – Phase 3: Finance Depth Features

## Tasks in this file
- API-FIN-017: Credit Memo & Invoice Credit API
- API-FIN-018: Payment Run (Batch Payment) API
- API-FIN-019: 1099 Preparation API
- API-FIN-020: Reconciliation API
- API-FIN-021: AP Inbox API
- API-FIN-022: Collections Activity API

---

## [ ] API-FIN-017: Credit Memo & Invoice Credit API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No credit memo support exists; overpayments or refunds cannot be tracked within the Finance context.
**Size:** Large

**Description:** Implement full credit memo lifecycle management — creation, application to invoices (reducing their balance), voiding, and status tracking — with atomic credit application and domain event emission.

**Depends on:** DB-FIN-008 (credit_memos, credit_memo_applications tables), API-FIN-004 (invoices green), EVENT-001 (domain event bus), ERROR-002 (domain errors).
**Blocks:** [N/A] — standalone Finance depth feature.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/credit-memo-service.ts`, `lib/db/src/repositories/finance/credit-memos.ts`, `artifacts/api-server/src/routes/finance/credit-memos.ts`

**Imports / Exports**
- Imports: `InvoiceRepository` (for balance validation), `db` pool, `DomainEventBus` (EVENT-001), `DomainError` (ERROR-002)
- Exports: `CreditMemoService`, `CreditMemoRepository`, `/api/v1/finance/credit-memos` router

**Definition of Done**
- [ ] `GET /api/v1/finance/credit-memos` — paginated list, filterable by `customer_id` and `status`.
- [ ] `POST /api/v1/finance/credit-memos` — creates credit memo with `customer_id`, `amount_cents`, `reason`, optional `invoice_id`.
- [ ] `GET /api/v1/finance/credit-memos/{memoId}` — detail view with application history.
- [ ] `POST /api/v1/finance/credit-memos/{memoId}/apply` — atomically applies credit to one or more invoices; validates applied amount ≤ remaining memo balance.
- [ ] `PATCH /api/v1/finance/credit-memos/{memoId}` — update details (draft status only).
- [ ] `POST /api/v1/finance/credit-memos/{memoId}/void` — voids unused credit; transitions to `void` status.
- [ ] Status machine: `draft → issued → partially_applied → applied → void`.
- [ ] Emits `CreditMemoCreated` and `CreditMemoApplied` domain events.
- [ ] Integration tests: create, apply to invoice (verify balance reduced), apply exceeding amount → 422, void, list by customer.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Credit memo refund payments (only invoice credit application)
- Multi-currency credit memos (credit memos use same currency as customer's account)
- Credit memo expiry/expiration dates
- Bulk credit memo application

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow credit application to reduce an invoice balance below zero

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/credit-memo-service.ts`, `lib/db/src/repositories/finance/credit-memos.ts`, `artifacts/api-server/src/routes/finance/credit-memos.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/credit-memos.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-008)

**Rollback**
- Granularity: file-level — remove service, repository, route files; revert route mount.
- Halt condition: credit application that reduces invoice balance below zero without 422 — halt and add balance guard.

**Rules to Follow**
- Credit application is a DB transaction: debit memo remaining balance + credit invoice balance, atomically.
- Applied amount must not exceed remaining `(amount_cents - applied_cents)`; return 422 `CreditExceedsAvailable` if violated.
- A voided memo cannot be applied; return 400 `MemoAlreadyVoided`.
- An applied memo (fully used) cannot be voided; return 400 `MemoFullyApplied`.
- `CreditMemoService` methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/credit-memos.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Transactional apply: `db.transaction(async (tx) => { await tx.update(creditMemos).set({ appliedCents: sql`applied_cents + ${amount}` }); await tx.update(invoices).set({ balanceCents: sql`balance_cents - ${amount}` }); })`.
- Status machine guard: `if (!VALID_MEMO_TRANSITIONS[memo.status].includes(targetStatus)) return err(new InvalidStatusTransition(...))`.
- Application record: insert into `credit_memo_applications` with `memo_id`, `invoice_id`, `amount_cents`, `applied_at`, `applied_by`.

**Anti-Patterns**
- Non-atomic credit application (balance discrepancies if partial failure).
- Missing balance guard allowing invoice balance to go negative.
- Allowing application to a voided memo.
- Updating invoice and memo balances in separate transactions.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Credit memos are financial instruments within the Finance bounded context. Their application to invoices is a domain operation that must maintain the accounting invariant (invoice balance ≥ 0).
- TDD: Write integration tests first (red). Application test must verify both memo balance and invoice balance change atomically.
- BDD: "When an admin applies a $500 credit memo to a $1,200 invoice, the invoice balance is reduced to $700 and the memo shows $500 applied."
- Deep Module: `CreditMemoService.applyCredit(memoId, invoiceId, amount, actorId)` hides balance validation, transactional dual-update, history recording, and event emission.

---

### Subtasks
- [ ] API-FIN-017.0.25 (AGENT): Read API-FIN-017, DB-FIN-008 schema, `InvoiceService`, and credit memo accounting principles.
  *No action — pause until fully understood.*

- [ ] API-FIN-017.0.5 (AGENT): Research credit memo accounting standards, transactional balance update patterns in Drizzle, and status machine implementation (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-017.0.75 (AGENT): Confirm status machine transitions and whether partial application should be a separate status (`partially_applied`) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-017.1 (AGENT): Add credit memo endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-017.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/credit-memos.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-017.3 (AGENT): Implement `CreditMemoRepository` and `CreditMemoService` with transactional apply and status machine.
  **File(s):** `lib/db/src/repositories/finance/credit-memos.ts`, `artifacts/api-server/src/services/finance/credit-memo-service.ts`
  **Verification:** `pnpm test -- credit-memo-service.test.ts` unit tests pass

- [ ] API-FIN-017.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/credit-memos.ts`
  **Verification:** `pnpm test -- credit-memos.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-017.5 (HUMAN): Final review and sign-off. Verify no negative invoice balances possible.
  **Verification:** Approved; accounting invariants confirmed; all tests green.

---

## [ ] API-FIN-018: Payment Run (Batch Payment) API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Bills must be paid individually; no batch payment processing exists for AP workflows.
**Size:** Large

**Description:** Implement batch payment run management — create a payment run from approved bills, execute it (creating individual payment records, debiting bank account, marking bills paid), or cancel a draft run — with status tracking and domain event emission.

**Depends on:** DB-FIN-010 (payment_runs, payment_run_items tables), API-FIN-004 (invoices/bills green), EVENT-001 (domain event bus), ERROR-002 (domain errors).
**Blocks:** [N/A] — Finance depth feature (Bill.com-style AP batch processing).
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/payment-run-service.ts`, `artifacts/api-server/src/routes/finance/payment-runs.ts`

**Imports / Exports**
- Imports: `InvoiceRepository` (bill validation), `PaymentRepository` (individual payment creation), bank account repository, `DomainEventBus` (EVENT-001)
- Exports: `PaymentRunService`, `/api/v1/finance/payment-runs` router

**Definition of Done**
- [ ] `GET /api/v1/finance/payment-runs` — list runs with `status` filter, paginated.
- [ ] `POST /api/v1/finance/payment-runs` — create draft run with `bill_ids[]`, `payment_date`, `bank_account_id`. Validates all bills are approved and unpaid.
- [ ] `GET /api/v1/finance/payment-runs/{runId}` — detail with included bills, totals by currency, and execution status.
- [ ] `POST /api/v1/finance/payment-runs/{runId}/execute` — atomically: creates individual payment records, decrements bank account balance, marks all bills as `paid`. Status → `completed`.
- [ ] `POST /api/v1/finance/payment-runs/{runId}/cancel` — cancels a `draft` run (cannot cancel `completed`).
- [ ] Status machine: `draft → processing → completed | cancelled`.
- [ ] Emits `PaymentRunCreated` and `PaymentRunCompleted` domain events.
- [ ] Integration tests: create run with 2 bills, execute (verify both paid and payments created), cancel draft, attempt execute on empty run → 400, attempt cancel on completed run → 400.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Electronic payment initiation (ACH, wire) — stub only, no real payment rails
- Multi-currency payment runs in a single batch (single-currency per run)
- Partial payment runs (all bills in run must be fully paid)
- Scheduled/recurring payment runs

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow execute on a run that contains unapproved bills

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/payment-run-service.ts`, `artifacts/api-server/src/routes/finance/payment-runs.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/payment-runs.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-010)

**Rollback**
- Granularity: file-level — remove service and route; revert route mount.
- Halt condition: execute transaction that marks some bills paid before bank account debit completes — must be all-in-one transaction; halt if not.

**Rules to Follow**
- All bill validation (approved status, unpaid status) must happen BEFORE creating the run, not at execution time.
- Execution must be a single DB transaction encompassing all payment records + bank debit + bill status updates.
- Empty `bill_ids` array → 400 `EmptyPaymentRun`.
- `PaymentRunService` methods return `Result<T, DomainError>` — no `throw`.
- Emit `PaymentRunCompleted` only after transaction commits.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/payment-runs.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Pre-execution validation: `findAllBillsApprovedAndUnpaid(billIds, orgId)` — fail fast before transaction.
- Atomic execution transaction: `db.transaction(async (tx) => { for bill in bills: createPayment(tx); updateBillStatus(tx); debitBankAccount(tx); updateRunStatus(tx, 'completed'); })`.
- Event taxonomy: `PaymentRunCompleted` is an orchestration event; each bill payment also emits `PaymentRecorded` (individual events).

**Anti-Patterns**
- Non-atomic execution leaving some bills paid and bank balance inconsistent.
- Missing bill approval check at run creation (deferred to execution creates race conditions).
- Allowing execution of a completed run (idempotency — return 200 with existing data, or 400).
- Emitting `PaymentRunCompleted` before transaction commits.

**DDD / TDD / BDD / Deep Module notes**
- DDD: A payment run is a domain entity that orchestrates multiple payment operations. It transitions through a state machine and enforces accounting invariants (all bills must be approved, bank balance must cover total).
- TDD: Write integration tests first. Multi-bill execution test must verify all bills are paid AND payments exist AND bank account balance is reduced — all in one test assertion.
- BDD: "As an AP manager, I can select 15 approved vendor bills, create a payment run, and execute it — all 15 bills are marked paid and a batch payment record is created."
- Deep Module: `PaymentRunService.execute(runId, orgId)` hides bill fetching, payment creation loop, bank debit, status update, and event emission behind one atomic method.

---

### Subtasks
- [ ] API-FIN-018.0.25 (AGENT): Read API-FIN-018, DB-FIN-010 schema, `InvoiceService`, `PaymentService`, and bank account repository.
  *No action — pause until fully understood.*

- [ ] API-FIN-018.0.5 (AGENT): Research transactional batch processing patterns in Drizzle and payment run state machine implementations (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-018.0.75 (AGENT): Confirm whether bank account balance validation occurs at run creation or execution with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-018.1 (AGENT): Add payment run endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-018.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/payment-runs.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-018.3 (AGENT): Implement `PaymentRunService` with atomic execution and domain event emission.
  **File(s):** `artifacts/api-server/src/services/finance/payment-run-service.ts`
  **Verification:** `pnpm test -- payment-run-service.test.ts` unit tests pass

- [ ] API-FIN-018.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/payment-runs.ts`
  **Verification:** `pnpm test -- payment-runs.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-018.5 (HUMAN): Final review and sign-off. Verify atomic execution and accounting integrity.
  **Verification:** Approved; transaction atomicity confirmed; all tests green.

---

## [ ] API-FIN-019: 1099 Preparation API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking exists; year-to-date payment totals are not accumulated for vendor reporting.
**Size:** Medium

**Description:** Implement 1099 tax preparation tracking — accumulating YTD payment totals for eligible vendors, managing filing status, and providing a stub export endpoint — to support US tax compliance workflows.

**Depends on:** DB-FIN-011 (vendor_1099_tracking table), API-FIN-008 (payments green), AP vendor API (vendors with `track_1099` flag), ERROR-002 (domain errors).
**Blocks:** [N/A] — compliance feature, does not block other tasks.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/form1099-service.ts`, `artifacts/api-server/src/routes/finance/1099.ts`

**Imports / Exports**
- Imports: `PaymentRepository` (for YTD totals), vendor repository, `db` pool, `DomainError` (ERROR-002)
- Exports: `Form1099Service`, `/api/v1/finance/1099-tracking` router

**Definition of Done**
- [ ] `GET /api/v1/finance/1099-tracking` — list eligible vendors with YTD totals, filterable by `year` and `filing_status`, paginated.
- [ ] `POST /api/v1/finance/1099-tracking/refresh` — recalculates YTD payment totals for all 1099-eligible vendors for a given `year`. Upserts tracking records.
- [ ] `GET /api/v1/finance/1099-tracking/{vendorId}/{year}` — detail view with payment breakdown by month.
- [ ] `PATCH /api/v1/finance/1099-tracking/{vendorId}/{year}` — update `filing_status` (`pending`, `filed`, `corrected`).
- [ ] `POST /api/v1/finance/1099-tracking/export` — stub endpoint returning `{ message: "Export not yet implemented" }` with 501. (Real export in future phase.)
- [ ] Integration tests: refresh totals (verify amounts), update filing status, detail view with breakdown, list with filters.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Actual 1099-NEC/1099-MISC form generation (PDF/electronic filing)
- IRS filing integration
- State-level tax compliance
- Non-US tax preparation (US only)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never expose vendor TIN (Tax Identification Number) in API responses without redaction

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/form1099-service.ts`, `artifacts/api-server/src/routes/finance/1099.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/1099.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-011)

**Rollback**
- Granularity: file-level — remove `form1099-service.ts` and `routes/finance/1099.ts`; revert route mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- 1099 threshold: only include vendors with YTD payments ≥ $600 in tracking results (US IRS threshold as of 2026).
- `refresh` endpoint must be idempotent: `UPSERT ... ON CONFLICT (vendor_id, year) DO UPDATE SET ytd_amount = EXCLUDED.ytd_amount`.
- Vendor `track_1099` flag must be `true` for a vendor to appear in tracking.
- `Form1099Service` methods return `Result<T, DomainError>` — no `throw`.
- Tax year is a required parameter for `refresh`; default is current calendar year.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/1099.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- YTD aggregation query: `SELECT vendor_id, SUM(amount_cents) as ytd_cents FROM bill_payments WHERE EXTRACT(YEAR FROM paid_at) = $year AND organization_id = $orgId GROUP BY vendor_id`.
- Upsert: `INSERT INTO vendor_1099_tracking ... ON CONFLICT (vendor_id, year, organization_id) DO UPDATE SET ytd_amount_cents = EXCLUDED.ytd_amount_cents, refreshed_at = now()`.
- Monthly breakdown: `SELECT DATE_TRUNC('month', paid_at) as month, SUM(amount_cents) as amount FROM bill_payments WHERE vendor_id = $vendorId AND EXTRACT(YEAR FROM paid_at) = $year GROUP BY month ORDER BY month`.

**Anti-Patterns**
- Including vendors below the $600 IRS reporting threshold in tracking results.
- Non-idempotent refresh that duplicates records on repeated calls.
- Exposing unredacted vendor TINs in API responses.
- Hardcoding the tax year threshold amount (use configurable constant, as IRS may adjust).

**DDD / TDD / BDD / Deep Module notes**
- DDD: 1099 tracking is a compliance subdomain within Finance. The `Form1099Service` is a specialised read/reporting service, not a transactional aggregate.
- TDD: Write integration tests with seeded payment data for a specific year. Verify refresh accumulates correct totals and respects $600 threshold.
- BDD: "As an accountant, I can refresh 1099 totals for 2025, see all vendors with payments over $600, update their filing status to 'filed', and export the list."
- Deep Module: `Form1099Service.refresh(year, orgId)` hides aggregation query, upsert logic, threshold filtering, and tracking record management.

---

### Subtasks
- [ ] API-FIN-019.0.25 (AGENT): Read API-FIN-019, DB-FIN-011 schema, payment data model, and US 1099 reporting rules (IRS $600 threshold).
  *No action — pause until fully understood.*

- [ ] API-FIN-019.0.5 (AGENT): Research 1099 tracking patterns, idempotent upsert in Drizzle, and monthly breakdown query optimisation (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-019.0.75 (AGENT): Confirm IRS threshold amount and `filing_status` enum values with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-019.1 (AGENT): Add 1099 endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-019.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/1099.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-019.3 (AGENT): Implement `Form1099Service` with YTD aggregation, upsert refresh, and filing status management.
  **File(s):** `artifacts/api-server/src/services/finance/form1099-service.ts`
  **Verification:** `pnpm test -- form1099-service.test.ts` unit tests pass

- [ ] API-FIN-019.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/1099.ts`
  **Verification:** `pnpm test -- 1099.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-019.5 (HUMAN): Final review and sign-off. Verify threshold logic and TIN redaction.
  **Verification:** Approved; $600 threshold confirmed; all tests green.

---

## [ ] API-FIN-020: Reconciliation API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No bank reconciliation infrastructure exists; imported bank transactions cannot be matched to recorded payments.
**Size:** Large

**Description:** Implement bank reconciliation endpoints for listing reconciliation entries, manually matching bank transactions to payment records, flagging unmatched entries for review, and viewing the unmatched queue.

**Depends on:** DB-FIN-012 (bank_reconciliation_entries table), API-FIN-008 (payments green), AUTH-008 (auth middleware), ERROR-002 (domain errors).
**Blocks:** [N/A] — Finance depth feature for financial accuracy.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/reconciliation-service.ts`, `artifacts/api-server/src/routes/finance/reconciliation.ts`

**Imports / Exports**
- Imports: `PaymentRepository`, bank account repository, `db` pool, `req.user` (AUTH-008)
- Exports: `ReconciliationService`, `/api/v1/finance/reconciliation` router

**Definition of Done**
- [ ] `GET /api/v1/finance/reconciliation` — list entries, filterable by `bank_account_id`, `match_status` (`unmatched`, `matched`, `flagged`), date range. Paginated.
- [ ] `POST /api/v1/finance/reconciliation/match` — manually match a bank transaction to a payment record. Body: `{ bank_account_id, transaction_type, transaction_id, external_reference }`.
- [ ] `PATCH /api/v1/finance/reconciliation/{entryId}/flag` — flag an unmatched entry for human review.
- [ ] `GET /api/v1/finance/reconciliation/unmatched` — list all unmatched entries sorted by amount descending.
- [ ] Integration tests: match a transaction (verify status changes to `matched`), flag an entry, list unmatched, duplicate match → 409 `AlreadyReconciled`.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Automatic/AI-powered matching (manual only at this phase)
- Bank feed import (entries are pre-existing in the reconciliation table)
- Multi-currency reconciliation (same currency only)
- Reconciliation period locking

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow matching a bank transaction to a payment from a different organisation

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/reconciliation-service.ts`, `artifacts/api-server/src/routes/finance/reconciliation.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/reconciliation.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-012)

**Rollback**
- Granularity: file-level — remove service and route; revert route mount.
- Halt condition: match operation that does not validate org-scoping — halt and add validation.

**Rules to Follow**
- `match` operation must validate that both the bank transaction and the payment record belong to the same `organization_id`.
- An already-matched entry cannot be re-matched; return 409 `AlreadyReconciled`.
- Flagging does not change `match_status` permanently — `match_status` remains `unmatched`; a separate `flagged` boolean is set.
- `ReconciliationService` methods return `Result<T, DomainError>` — no `throw`.
- Audit each match/flag action with `actor_id` and `action_at` timestamp.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/reconciliation.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Idempotency guard: `SELECT match_status FROM bank_reconciliation_entries WHERE id = $entryId` before matching; return early if already matched.
- Org-scoped match validation: join bank transaction to its bank account to verify `organization_id` matches the payment's `organization_id`.
- Unmatched queue: `SELECT * FROM bank_reconciliation_entries WHERE match_status = 'unmatched' AND organization_id = $orgId ORDER BY ABS(amount_cents) DESC LIMIT 50`.

**Anti-Patterns**
- Missing org-scoping on match validation (cross-tenant data access).
- Allowing re-matching of an already-matched entry (data integrity violation).
- Treating `flagged` as a separate status instead of a boolean flag (allows flagged AND unmatched simultaneously).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Reconciliation is a Finance compliance process, not a domain aggregate. `ReconciliationService` is a coordination service — it does not own business rules but enforces matching constraints.
- TDD: Write integration tests first with seeded reconciliation entries. Test match, flag, and duplicate match rejection.
- BDD: "As an accountant, I can match a $1,500 bank deposit to the corresponding invoice payment, and the reconciliation entry shows as matched in the audit trail."
- Deep Module: `ReconciliationService.matchEntry(entryId, paymentId, actorId, orgId)` hides duplicate check, org validation, status update, and audit logging.

---

### Subtasks
- [ ] API-FIN-020.0.25 (AGENT): Read API-FIN-020, DB-FIN-012 schema, and `PaymentRepository` API.
  *No action — pause until fully understood.*

- [ ] API-FIN-020.0.5 (AGENT): Research bank reconciliation data models and duplicate match detection patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-020.0.75 (AGENT): Confirm `flagged` implementation (boolean vs separate status) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-020.1 (AGENT): Add reconciliation endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-020.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/reconciliation.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-020.3 (AGENT): Implement `ReconciliationService` with match, flag, and unmatched queue logic.
  **File(s):** `artifacts/api-server/src/services/finance/reconciliation-service.ts`
  **Verification:** `pnpm test -- reconciliation-service.test.ts` unit tests pass

- [ ] API-FIN-020.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/reconciliation.ts`
  **Verification:** `pnpm test -- reconciliation.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-020.5 (HUMAN): Final review and sign-off. Verify org-scoping on all queries.
  **Verification:** Approved; org-scoping confirmed; all tests green.

---

## [ ] API-FIN-021: AP Inbox API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP invoice capture inbox exists; vendor invoices must be created manually as bills without any OCR or capture workflow.
**Size:** Large

**Description:** Implement an AP invoice capture inbox — manual upload (with OCR stub), inbox listing, detail view with extracted data, processing a captured invoice into a draft bill, and rejecting invalid captures.

**Depends on:** DB-FIN-013 (ap_inbox_captures table), API-FIN-004 (bills green — captured invoices become bills), AUTH-008, ERROR-002 (domain errors).
**Blocks:** [N/A] — Finance depth feature (Bill.com-style AP inbox).
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/ap-inbox-service.ts`, `artifacts/api-server/src/routes/finance/ap-inbox.ts`

**Imports / Exports**
- Imports: `InvoiceService` (bill creation), `multer` (file upload), `db` pool, `req.user` (AUTH-008)
- Exports: `APInboxService`, `/api/v1/finance/ap-inbox` router

**Definition of Done**
- [ ] `GET /api/v1/finance/ap-inbox` — list captures, filterable by `status` (`pending_review`, `processed`, `error`, `rejected`) and `source` (`email`, `upload`, `manual`). Paginated.
- [ ] `GET /api/v1/finance/ap-inbox/{captureId}` — detail with extracted data and per-field confidence scores.
- [ ] `POST /api/v1/finance/ap-inbox/{captureId}/process` — converts capture into a draft bill using `InvoiceService.create()`; accepts field overrides. Marks capture as `processed`.
- [ ] `POST /api/v1/finance/ap-inbox/{captureId}/reject` — marks capture as `rejected` with a `reason` string.
- [ ] `POST /api/v1/finance/ap-inbox/upload` — accepts file upload (PDF, JPEG, PNG up to 10MB); stores file reference; creates capture with `source: 'upload'` and stubbed extracted data.
- [ ] Integration tests: upload invoice, list inbox, process into bill (verify bill created), reject, attempt process on already-processed → 400.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Real OCR processing (stub only — extracted data is placeholder at this phase)
- Email-based capture (endpoint exists but email routing integration is future phase)
- Automated processing rules
- Capture file storage (file reference stored, actual storage is future phase)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- File uploads: accept only PDF, JPEG, PNG; reject other MIME types with 415; max 10MB (enforced at multer)

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/ap-inbox-service.ts`, `artifacts/api-server/src/routes/finance/ap-inbox.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/ap-inbox.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-013)

**Rollback**
- Granularity: file-level — remove `ap-inbox-service.ts` and `routes/finance/ap-inbox.ts`; revert route mount.
- Halt condition: `pnpm typecheck` failure or file upload without MIME type validation — halt and add validation.

**Rules to Follow**
- File MIME type validation: only `application/pdf`, `image/jpeg`, `image/png` accepted at multer config.
- A `processed` or `rejected` capture cannot be processed again; return 400 `CaptureAlreadyHandled`.
- `process` endpoint must be transactional: bill creation + capture status update, atomically.
- OCR stub returns fixed placeholder data with 0% confidence scores to signal "needs review."
- `APInboxService` methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/ap-inbox.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Multer config: `{ storage: memoryStorage(), limits: { fileSize: 10_485_760 }, fileFilter: (req, file, cb) => { if (!ALLOWED_MIMES.includes(file.mimetype)) cb(new Error('InvalidMimeType')); else cb(null, true); } }`.
- OCR stub: `{ vendor_name: null, amount: null, date: null, invoice_number: null, confidence: { vendor_name: 0, amount: 0, date: 0, invoice_number: 0 } }`.
- Transactional process: `db.transaction(async (tx) => { await invoiceService.createBill(tx, overrides); await tx.update(apInboxCaptures).set({ status: 'processed' }).where(eq(id, captureId)); })`.

**Anti-Patterns**
- Missing MIME type validation (arbitrary file upload attack surface).
- Non-transactional process (bill created but capture not marked processed on failure).
- Allowing re-processing of an already-processed capture (duplicate bills).
- Storing uploaded files permanently in server memory (use temp storage or buffer reference only).

**DDD / TDD / BDD / Deep Module notes**
- DDD: The AP Inbox is a capture/intake subdomain within Finance. Captured invoices are pre-entities that become Bills upon successful processing.
- TDD: Write integration tests with mock file uploads. Test process → verify bill created AND capture status updated in same transaction.
- BDD: "As an AP clerk, I can upload a vendor PDF invoice, review the extracted data, correct the vendor name, and process it into a draft bill in one workflow."
- Deep Module: `APInboxService.processCapture(captureId, overrides, actorId)` hides capture retrieval, override merging, bill creation, status update, and transaction management.

---

### Subtasks
- [ ] API-FIN-021.0.25 (AGENT): Read API-FIN-021, DB-FIN-013 schema, `InvoiceService.create()` API, and multer documentation.
  *No action — pause until fully understood.*

- [ ] API-FIN-021.0.5 (AGENT): Research multer memory storage configuration, MIME type validation best practices, and transactional bill creation patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-021.0.75 (AGENT): Confirm OCR stub data structure and field override mechanism with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-021.1 (AGENT): Add AP inbox endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-021.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/ap-inbox.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-021.3 (AGENT): Implement `APInboxService` with capture lifecycle, OCR stub, and transactional process.
  **File(s):** `artifacts/api-server/src/services/finance/ap-inbox-service.ts`
  **Verification:** `pnpm test -- ap-inbox-service.test.ts` unit tests pass

- [ ] API-FIN-021.4 (AGENT): Create routes with multer file upload and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/ap-inbox.ts`
  **Verification:** `pnpm test -- ap-inbox.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-021.5 (HUMAN): Final review and sign-off. Verify file upload security and transactional process.
  **Verification:** Approved; MIME validation confirmed; transaction integrity verified; all tests green.

---

## [ ] API-FIN-022: Collections Activity API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AR collections activity tracking exists; accounts receivable teams have no tool to log collection attempts or track promise-to-pay commitments.
**Size:** Medium

**Description:** Implement an append-only AR collections activity log — enabling clerks to record collection attempts (calls, emails) with outcome and promise-to-pay dates, and retrieve per-customer collection summaries.

**Depends on:** DB-FIN-014 (collections_activity table), AR invoice API (API-FIN-004 green), AUTH-008, ERROR-002 (domain errors).
**Blocks:** [N/A] — standalone Finance depth feature (Bill.com collections workbench style).
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/finance/collections-service.ts`, `artifacts/api-server/src/routes/finance/collections.ts`

**Imports / Exports**
- Imports: customer/invoice repositories (for validation), `db` pool, `req.user` (AUTH-008)
- Exports: `CollectionsService`, `/api/v1/finance/collections-activity` router

**Definition of Done**
- [ ] `GET /api/v1/finance/collections-activity` — list activity entries, filterable by `customer_id`, `invoice_id`, `outcome`, date range. Paginated.
- [ ] `POST /api/v1/finance/collections-activity` — log an attempt with `customer_id`, `invoice_id`, `contact_method` (`call`|`email`|`letter`), `notes`, `outcome`, `promise_to_pay_date?`.
- [ ] `GET /api/v1/finance/collections-activity/summary/{customerId}` — summary: last contact date, promise-to-pay status, total overdue amount, activity count.
- [ ] Append-only: no update or delete endpoints for activity entries.
- [ ] Integration tests: log call, log email, retrieve summary (verify counts and dates), filter by outcome, unauthorized → 401.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Automated collection reminders or escalation rules
- Legal collections workflow (attorney letters, etc.)
- Collection agency integration
- Multi-currency overdue amounts (report in account's primary currency)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow deletion or modification of logged activity entries

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/collections-service.ts`, `artifacts/api-server/src/routes/finance/collections.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/finance/collections.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-FIN-014)

**Rollback**
- Granularity: file-level — remove `collections-service.ts` and `routes/finance/collections.ts`; revert route mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Activity log is append-only — no PATCH or DELETE routes exposed.
- Validate `customer_id` and `invoice_id` (if provided) belong to the same `organization_id`.
- `outcome` enum: `no_answer`, `left_voicemail`, `promise_to_pay`, `paid`, `disputed`, `other`.
- `CollectionsService` methods return `Result<T, DomainError>` — no `throw`.
- Summary calculation: use aggregate SQL query, not in-memory calculation.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/finance/collections.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Summary query: `SELECT COUNT(*) as activity_count, MAX(created_at) as last_contact, SUM(CASE WHEN outcome = 'promise_to_pay' AND promise_to_pay_date > now() THEN 1 ELSE 0 END) as active_promises FROM collections_activity WHERE customer_id = $customerId AND organization_id = $orgId`.
- Append-only enforcement: route configuration only exposes GET and POST; no PUT/PATCH/DELETE routes registered.

**Anti-Patterns**
- In-memory summary calculation loading all activity rows (use SQL aggregation).
- Missing org-scoping on customer/invoice validation.
- Exposing PATCH/DELETE endpoints that break the append-only audit trail guarantee.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Collections activity is an audit log value object for the AR subdomain. Append-only ensures the historical record cannot be tampered with.
- TDD: Write integration tests first. Summary test must verify correct aggregate calculation from seeded data.
- BDD: "As an AR clerk, I can log a phone call with a customer, note they promised to pay by Friday, and later pull a summary showing their last contact and outstanding promises."
- Deep Module: `CollectionsService.getSummary(customerId, orgId)` hides the SQL aggregation, overdue calculation, and promise status behind one read-only method.

---

### Subtasks
- [ ] API-FIN-022.0.25 (AGENT): Read API-FIN-022, DB-FIN-014 schema, and AR invoice data model.
  *No action — pause until fully understood.*

- [ ] API-FIN-022.0.5 (AGENT): Research collections activity log patterns and SQL aggregate query optimisation (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-FIN-022.0.75 (AGENT): Confirm `outcome` enum values and summary fields with user.
  *If uncertain, ask the user before executing.*

- [ ] API-FIN-022.1 (AGENT): Add collections activity endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-FIN-022.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/finance/collections.test.ts`
  **Verification:** All fail (red)

- [ ] API-FIN-022.3 (AGENT): Implement `CollectionsService` with append-only activity logging and SQL summary query.
  **File(s):** `artifacts/api-server/src/services/finance/collections-service.ts`
  **Verification:** `pnpm test -- collections-service.test.ts` unit tests pass

- [ ] API-FIN-022.4 (AGENT): Create routes (GET + POST only) and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/finance/collections.ts`
  **Verification:** `pnpm test -- collections.test.ts` all green ; `pnpm typecheck`

- [ ] API-FIN-022.5 (HUMAN): Final review and sign-off. Verify append-only enforcement and SQL summary accuracy.
  **Verification:** Approved; no PATCH/DELETE routes present; summary query verified; all tests green.

---

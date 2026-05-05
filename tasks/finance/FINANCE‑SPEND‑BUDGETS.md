# tasks/finance/FINANCE‑SPEND‑BUDGETS.md – Finance: Spend Management & Budgets

This file covers spend and budget management within the Finance bounded context: expense categories, bank accounts, payment methods, idempotency records, virtual cards (spend cards), budgets, and the associated API layers and frontend integration. These features control organisational spending, payment infrastructure, and budget tracking.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schemas

### [ ] DB‑FIN‑004: Define Expense Categories Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No expense categories. AP expense classification and reporting are blocked.
**Size:** Small

**Description:** Define the `expense_categories` table with hierarchical parent‑category support, per‑tenant scoping, and soft delete. Used to classify vendor bills and expenses for reporting.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 AP expense classification
**Related Files:** `lib/db/src/schema/finance/expense_categories.ts`, `lib/db/src/__tests__/expense‑categories.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `parent_category_id` (uuid nullable, self‑referential FK), `is_active` (boolean NOT NULL default `true`), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, name)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Category‑based budgeting
- Category permissions
- More than 2 levels of hierarchy

**Rules to Follow**
- Validate no circular references in hierarchy at service layer
- Category names must be unique per organization

**Verification**
```bash
pnpm --filter @workspace/db test -- expense‑categories.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ExpenseCategory` is a value object for AP classification. Hierarchy logic in service layer.
- TDD: Assert composite unique, self‑referential FK.
- BDD: Supports “Categorize vendor bill” scenario.

---

### Subtasks
- [ ] DB‑FIN‑004.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑FIN‑004.0.5 (AGENT): Research Drizzle self‑referential FK syntax.
- [ ] DB‑FIN‑004.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/expense‑categories.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑004.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑005: Define Bank Accounts Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bank accounts table. Payment run disbursement and reconciliation are blocked.
**Size:** Small

**Description:** Define the `bank_accounts` table for storing organization bank accounts with Plaid integration readiness, balance tracking, and account‑type classification.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑010`, `DB‑FIN‑012`
**Related Files:** `lib/db/src/schema/finance/bank_accounts.ts`, `lib/db/src/__tests__/bank‑accounts.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `account_name` (text NOT NULL), `account_type` (pgEnum: `checking|savings|credit_card`), `account_number_last_four` (text NOT NULL), `routing_number` (text nullable), `balance_cents` (integer NOT NULL default `0`), `currency` (text NOT NULL default `USD`), `is_default` (boolean default `false`), `plaid_account_id` (text nullable), `status` (pgEnum: `active|inactive`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, account_type)`, unique `(plaid_account_id)` where not null
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Balance in cents (integer) — no floats
- Only one `is_default = true` account per organization (service layer validation)

**Verification**
```bash
pnpm --filter @workspace/db test -- bank‑accounts.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑005.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑FIN‑005.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/bank‑accounts.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑005.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑006: Define Payment Methods Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment methods table. Vendor/customer payment preferences cannot be stored.
**Size:** Small

**Description:** Define the `payment_methods` table storing payment preferences for vendors and customers, with JSONB billing addresses and support for ACH, wire, check, and card payment types.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 payment processing
**Related Files:** `lib/db/src/schema/finance/payment_methods.ts`, `lib/db/src/__tests__/payment‑methods.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (pgEnum: `vendor|customer`), `entity_id` (uuid NOT NULL), `method_type` (pgEnum: `ach|check|wire|card`), `account_number_last_four` (text nullable), `routing_number` (text nullable), `card_brand` (text nullable), `expiry_date` (date nullable), `is_default` (boolean default `false`), `billing_address` (jsonb default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, entity_type, entity_id)`, `(entity_id, method_type)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- payment‑methods.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑006.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑FIN‑006.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/payment‑methods.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑006.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑FIN‑007: Define Idempotency Records Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No idempotency tracking exists. Duplicate payment processing cannot be prevented.
**Size:** Small

**Description:** Define the `idempotency_records` table for centralised idempotency key tracking across financial operations.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 payment processing idempotency
**Related Files:** `lib/db/src/schema/finance/idempotency_records.ts`, `lib/db/src/__tests__/idempotency‑records.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `key` (text NOT NULL), `response_body` (jsonb nullable), `expires_at` (timestamp NOT NULL), `created_at`
- [ ] Composite unique constraint on `(organization_id, key)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- idempotency‑records.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑FIN‑007.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑FIN‑007.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/idempotency‑records.test.ts` **Verification:** RED.
- [ ] DB‑FIN‑007.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FIN‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Virtual Cards

### [ ] API‑FIN‑013: Virtual Cards – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No virtual card endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add virtual card issuance, freeze/unfreeze, limit update, and soft‑delete endpoints to the OpenAPI spec.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑005` (virtual_cards schema)
**Blocks:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑014`, `API‑FIN‑015`, `API‑FIN‑016`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/finance/virtual‑cards`, `POST`, `GET /{cardId}`, `PATCH /{cardId}`, `POST /{cardId}/freeze`, `POST /{cardId}/unfreeze`, `DELETE /{cardId}` (soft delete)
- [ ] `VirtualCardStatusEnum`: `active`, `frozen`, `cancelled`
- [ ] `spend_limit_interval` enum: `daily`, `weekly`, `monthly`, `transaction`
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Virtual cards are financial instruments. Card issuance, freeze, and cancellation are domain state transitions.

---

### Subtasks
- [ ] API‑FIN‑013.0.25 (AGENT): Read DB‑FIN‑005 virtual_cards schema. *No action – pause.*
- [ ] API‑FIN‑013.1 (AGENT): Add `VirtualCard` schema and all card endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑013.2 (HUMAN): Review — confirm card_number/CVV NOT in response schemas. Sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑014: Virtual Cards – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No virtual card integration tests.
**Size:** Medium

**Description:** Write virtual card integration tests covering issuance, freeze/unfreeze, limit update, cancellation, and security (no card numbers in responses) — TDD red phase.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑013`
**Blocks:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑016`
**Related Files:** `artifacts/api‑server/__tests__/api/finance/virtual‑cards.test.ts`

**Definition of Done**
- [ ] Tests: issue card (201), list, get by ID, update spend limit, freeze, unfreeze, cancel, attempt unfreeze of cancelled → 400, auth (401)
- [ ] Security test: response body does NOT contain `card_number` or `cvv`
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/virtual‑cards.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑014.0.25 (AGENT): Read API‑FIN‑014 and generated card schemas. *No action – pause.*
- [ ] API‑FIN‑014.1 (AGENT): Write all virtual card integration tests. **File(s):** `artifacts/api‑server/__tests__/api/finance/virtual‑cards.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑FIN‑014.2 (HUMAN): Review test coverage (especially security test). Confirm red phase. **Verification:** Approved.

---

### [ ] API‑FIN‑015: Virtual Cards – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `VirtualCardRepository` or `VirtualCardService` exists.
**Size:** Large

**Description:** Implement `VirtualCardRepository` and `VirtualCardService` (freeze/unfreeze state machine, spend limit validation, cancellation, card network stub) using neverthrow Results.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑005`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑016`
**Related Files:** `lib/db/src/repositories/finance/virtual‑cards.ts`, `artifacts/api‑server/src/services/finance/virtual‑card‑service.ts`

**Definition of Done**
- [ ] `VirtualCardRepository`: `findById`, `findByOrg`, `create`, `update`, `cancel`
- [ ] `VirtualCardService`: `listCards`, `getCard`, `issueCard`, `updateCardLimits`, `freezeCard`, `unfreezeCard`, `cancelCard`. All return `Result<T, DomainError>`.
- [ ] `freezeCard` only on `active`; `unfreezeCard` only on `frozen`; `cancelCard` on `active` or `frozen`, irreversible
- [ ] `issueCard` calls a card network stub (returns fake `last4`)
- [ ] Card number and CVV NEVER stored in DB or returned from service
- [ ] `CardIssued`, `CardFrozen`, `CardCancelled` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/finance/__tests__/virtual‑card‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Virtual cards are financial instruments with a strict lifecycle.
- Deep Module: `VirtualCardService` hides card network stub, state machine, and event emission.

---

### Subtasks
- [ ] API‑FIN‑015.0.25 (AGENT): Read DB‑FIN‑005 schema and PCI data rules. *No action – pause.*
- [ ] API‑FIN‑015.1 (AGENT): Implement `VirtualCardRepository`. **File(s):** `lib/db/src/repositories/finance/virtual‑cards.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑015.2 (AGENT): Implement `VirtualCardService` with state machine, stub, and events. **File(s):** `artifacts/api‑server/src/services/finance/virtual‑card‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑015.3 (AGENT): Write and run unit tests. Verify no card numbers in any output. **File(s):** `artifacts/api‑server/src/services/finance/__tests__/virtual‑card‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑015.4 (HUMAN): Security review — confirm no card numbers/CVVs in code, logs, or tests. Sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑016: Virtual Cards – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No virtual card routes wired.
**Size:** Small

**Description:** Create virtual card route handlers (CRUD + freeze/unfreeze + cancel), mount the router, and run integration tests to green.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑015`, `API‑FIN‑014`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A] — terminal Finance core feature
**Related Files:** `artifacts/api‑server/src/routes/finance/virtual‑cards.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST issue, GET by ID, PATCH limits, POST freeze, POST unfreeze, DELETE cancel handlers
- [ ] `InvalidCardStateTransition` → 400; `VirtualCardNotFound` → 404
- [ ] `pnpm test -- virtual‑cards.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/virtual‑cards.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑016.0.25 (AGENT): Read `routes/finance/invoices.ts` as pattern. *No action – pause.*
- [ ] API‑FIN‑016.1 (AGENT): Implement virtual cards router and mount. **File(s):** `artifacts/api‑server/src/routes/finance/virtual‑cards.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑016.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑016.3 (HUMAN): Security review and sign‑off. **Verification:** Approved.

---

## Frontend Integration

### [ ] FRONT‑FIN‑002: Budgets & Spend Cards – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Budget list and virtual card views in Finance use mock data. No `useBudgetList` or `useCardList` hooks exist.
**Size:** Small

**Description:** Create `useBudgetList` and `useCardList` hooks backed by `API‑FIN‑016`. Replace mock data in budget list and card views; wire card freeze/unfreeze actions.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → API‑FIN‑016`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑FIN‑001`
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → FRONT‑INT‑FIN`
**Related Files:** `artifacts/apex‑os/src/pages/Finance.tsx`, `artifacts/apex‑os/src/hooks/finance/useBudgetList.ts`, `useCardList.ts`

**Definition of Done**
- [ ] `useBudgetList` and `useCardList` hooks created
- [ ] Budget list: name, budgeted amount, actual spend, progress bar (colour‑coded: green < 80%, amber 80‑99%, red ≥ 100%)
- [ ] Card list: last 4 digits, cardholder, spending limit, current balance, status badge (active/frozen)
- [ ] Freeze/unfreeze toggle calls `useFreezeCard` mutation; card status badge updates optimistically
- [ ] All mock data removed from budget/card views
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- finance‑budgets.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Budgets and Cards are separate aggregate roots in the Finance bounded context.
- TDD: MSW returns a budget at 95% — assert amber bar; simulate card freeze → assert status badge changes.
- BDD: “As a firm user, I can see budget utilisation at a glance and freeze a card instantly.”

---

### Subtasks
- [ ] FRONT‑FIN‑002.0.25 (AGENT): Read the entire task and all related info. *No action – pause.*
- [ ] FRONT‑FIN‑002.1 (AGENT): Create `useBudgetList` and `useCardList` hooks. **File(s):** `artifacts/apex‑os/src/hooks/finance/useBudgetList.ts`, `useCardList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑FIN‑002.2 (AGENT): Replace mock data; display budget progress bars and card status; wire freeze/unfreeze. **File(s):** `artifacts/apex‑os/src/pages/Finance.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- finance‑budgets.test.tsx` → GREEN.
- [ ] FRONT‑FIN‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
# tasks/finance/FINANCE‑BILLS‑APPROVALS.md – Finance: Bills & Approvals

This file contains tasks for the Accounts Payable (AP) core: vendors, bills, approval workflows, and purchase orders. These features handle money owed *by* the organisation and the approval processes that govern them.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Vendors

### [ ] DB‑AP‑001: Define Vendors Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No vendors table. AP vendor management, bills, and payment runs are blocked.
**Size:** Small

**Description:** Define the `vendors` table with extended payment preferences (early payment discounts, remittance email) and JSONB address — the foundation of all AP workflows.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`, `DB‑AP‑004`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑011`, `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑006`
**Related Files:** `lib/db/src/schema/ap/vendors.ts`, `lib/db/src/__tests__/vendors.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/ap/vendors.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `company_name` (text NOT NULL), `contact_name` (text nullable), `email` (text nullable), `phone` (text nullable), `tax_id` (text nullable), `payment_terms_days` (integer NOT NULL default `30`), `default_payment_method_id` (uuid nullable), `early_payment_discount_rate` (numeric nullable), `early_payment_discount_days` (integer nullable), `remittance_email` (text nullable), `address` (jsonb default `{}`), `is_1099_eligible` (boolean NOT NULL default `false`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, company_name)`, `(organization_id, email)`
- [ ] Zod schemas and types exported; address validated as structured object
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- vendors.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Vendor` aggregate root in the AP bounded context. Payment terms and discount logic in `VendorService`.
- TDD: Assert JSONB address default, nullable discount fields.
- BDD: Supports “Add new vendor” and “Set early payment discount” scenarios.

---

### Subtasks
- [ ] DB‑AP‑001.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑AP‑001.0.5 (AGENT): Research JSONB address validation in Zod and `numeric` type in Drizzle.
- [ ] DB‑AP‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/vendors.test.ts` **Verification:** RED.
- [ ] DB‑AP‑001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑AP‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database – Bills

### [ ] DB‑AP‑002: Define Bills Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bills table. AP bill management, approval workflows, and payment runs are blocked.
**Size:** Small

**Description:** Define the `bills` table — the core AP document — with approval workflow support, multi‑currency, JSONB line items, and purchase order linkage.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑001`, `DB‑AP‑003` (approval_workflows FK, nullable initially)
**Blocks:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑009`, `finance/FINANCE‑MULTI‑ENTITY.md → DB‑FIN‑010`, `DB‑FIN‑013`, `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑004`
**Related Files:** `lib/db/src/schema/ap/bills.ts`, `lib/db/src/__tests__/bills.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `bill_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `currency` (text default `USD`), `exchange_rate` (numeric nullable), `tax_amount_cents` (integer default `0`), `tax_type` (text nullable), `due_date` (date NOT NULL), `bill_date` (date NOT NULL), `status` (pgEnum: `draft|pending_approval|approved|paid|overdue`), `approval_workflow_id` (FK → approval_workflows, nullable), `purchase_order_id` (FK → purchase_orders, nullable), `line_items` (jsonb default `[]`), `memo` (text nullable), `attachments` (text[] default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, vendor_id, status)`, `(organization_id, due_date)`, unique `(organization_id, bill_number)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- bills.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Bill` aggregate in the AP bounded context. Approval workflow logic in `BillService`.
- TDD: Assert status enum, composite unique index, JSONB line items default.

---

### Subtasks
- [ ] DB‑AP‑002.0.25 (AGENT): Read DB‑AP‑001 and DB‑FIN‑001 schemas (bills mirror invoices). No action – pause.
- [ ] DB‑AP‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/bills.test.ts` **Verification:** RED.
- [ ] DB‑AP‑002.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑AP‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database – Approval Workflows

### [ ] DB‑AP‑003: Define Approval Workflows Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No approval workflows table. Multi‑step bill approval is blocked.
**Size:** Small

**Description:** Define the `approval_workflows` table for configuring multi‑step approval chains triggered by bill amount thresholds. Steps stored as JSONB array of approver assignments.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002` (bills reference this via nullable FK)
**Related Files:** `lib/db/src/schema/ap/approval_workflows.ts`, `lib/db/src/__tests__/approval‑workflows.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `threshold_amount_cents` (integer NOT NULL), `steps` (jsonb NOT NULL default `[]`), `is_active` (boolean default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, is_active)`, `(organization_id, threshold_amount_cents)`
- [ ] Zod schemas and types exported; `steps` validated as array of `{ approver_user_id, order, required }` objects
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- approval‑workflows.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ApprovalWorkflow` configuration entity in the AP context. Routing logic in `ApprovalService`.
- TDD: Assert JSONB steps default, threshold index.
- BDD: Supports “Route high‑value bill for approval” scenario.

---

### Subtasks
- [ ] DB‑AP‑003.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑AP‑003.0.5 (AGENT): Research Zod JSONB array validation with object item schema.
- [ ] DB‑AP‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/approval‑workflows.test.ts` **Verification:** RED.
- [ ] DB‑AP‑003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑AP‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database – Purchase Orders

### [ ] DB‑AP‑004: Define Purchase Orders Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No purchase orders table. PO‑based procurement tracking is blocked.
**Size:** Small

**Description:** Define the `purchase_orders` table for tracking vendor purchase orders through their full lifecycle from draft to receipt. Enables three‑way matching (PO + bill + receipt) in Phase 3.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑001`
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002` (bills reference PO FK, nullable)
**Related Files:** `lib/db/src/schema/ap/purchase_orders.ts`, `lib/db/src/__tests__/purchase‑orders.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `vendor_id` (FK → vendors), `po_number` (text NOT NULL), `amount_cents` (integer NOT NULL), `status` (pgEnum: `draft|sent|acknowledged|partially_received|received|closed`), `line_items` (jsonb default `[]`), `expected_delivery_date` (date nullable), `received_at` (timestamp nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(organization_id, vendor_id, status)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- purchase‑orders.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `PurchaseOrder` aggregate in the AP context. Receipt matching logic in `ProcurementService`.
- TDD: Assert status enum, JSONB line items.
- BDD: Supports “Issue purchase order to vendor” scenario.

---

### Subtasks
- [ ] DB‑AP‑004.0.25 (AGENT): Read DB‑AP‑001. No action – pause.
- [ ] DB‑AP‑004.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/purchase‑orders.test.ts` **Verification:** RED.
- [ ] DB‑AP‑004.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑AP‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑AP‑009: Three‑Way Matching Engine
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Bills can be approved without matching against a purchase order and receipt.
**Size:** Medium

**Description:** Validate vendor bills against purchase orders and received items with tolerance rules, exception handling, and auto-approval when values remain within policy.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`, `DB‑AP‑004`, `API‑FIN‑006`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/ap/three‑way‑matching‑service.ts`, `docs/finance/three‑way‑matching.md`

**Definition of Done**
- [ ] Matching compares bill lines to PO lines and receipt state
- [ ] Tolerance thresholds are configurable and exceptions are explicit
- [ ] Auto-approval path is logged and auditable

### Subtasks
- [ ] API‑AP‑009.1 (AGENT): Define the matching inputs, tolerance policy, and exception outputs.
- [ ] API‑AP‑009.2 (AGENT): Implement the matching service and approval hooks.
- [ ] API‑AP‑009.3 (AGENT): Add tests for exact match, within tolerance, and mismatch scenarios.

---

## API – Bills (AP)

### [ ] API‑FIN‑005: Bills (AP) – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AP bill endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all Accounts Payable bill CRUD endpoints, status enum (with AP‑specific statuses), approval workflow action, and vendor FK to the OpenAPI spec.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑001` (reuse `InvoiceLineItemSchema`)
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑FIN‑006`, `API‑FIN‑007`, `API‑FIN‑008`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/finance/bills`, `POST`, `GET /{billId}`, `PATCH /{billId}`, `DELETE /{billId}` (soft delete), `POST /{billId}/approve`, `POST /{billId}/reject` all defined
- [ ] `BillStatusEnum`: `draft`, `pending_review`, `approved`, `paid`, `rejected`, `void`
- [ ] `vendor_id` as required FK field in `CreateBillRequestBody`
- [ ] Reuses `$ref: '#/components/schemas/InvoiceLineItem'` for line items
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bills are the central aggregate in the AP subdomain. Approval workflow is a domain state machine.

---

### Subtasks
- [ ] API‑FIN‑005.0.25 (AGENT): Read DB‑AP‑002 bills schema and AP vs AR domain distinctions. *No action – pause.*
- [ ] API‑FIN‑005.1 (AGENT): Add `Bill` schema and all AP bill endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑FIN‑005.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑006: Bills (AP) – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No AP bill integration tests.
**Size:** Medium

**Description:** Write AP bill integration tests covering CRUD, approval workflow, rejection, and auth (TDD red phase).

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑FIN‑005`
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑FIN‑008`
**Related Files:** `artifacts/api‑server/__tests__/api/finance/bills.test.ts`

**Definition of Done**
- [ ] Tests: create bill (201), list (paginated), get by ID, update (draft only), approve (status → `approved`), reject (with reason), attempt PATCH on approved bill → 400, soft delete, auth (401)
- [ ] Invalid transition test: approve an already‑`paid` bill → 400
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/bills.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑006.0.25 (AGENT): Read API‑FIN‑006 and generated bill schemas. *No action – pause.*
- [ ] API‑FIN‑006.1 (AGENT): Write all AP bill integration tests. **File(s):** `artifacts/api‑server/__tests__/api/finance/bills.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑FIN‑006.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑FIN‑007: Bills (AP) – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `BillRepository` or `BillService` exists.
**Size:** Large

**Description:** Implement `BillRepository` (vendor‑filtered queries) and `BillService` (approval workflow, status machine, vendor FK validation, event emission) using neverthrow Results.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`, vendor repository, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑FIN‑008`, `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑018`
**Related Files:** `lib/db/src/repositories/finance/bills.ts`, `artifacts/api‑server/src/services/finance/bill‑service.ts`

**Definition of Done**
- [ ] `BillRepository`: `findById`, `findByOrg` (paginated, status/vendor filtered), `create` (transactional with line items), `update`, `updateStatus`, `findApprovedAndUnpaid`
- [ ] `BillService`: `listBills`, `getBill`, `createBill`, `updateBill`, `approveBill`, `rejectBill`. All return `Result<T, DomainError>`.
- [ ] `createBill` validates `vendor_id` exists and belongs to same org
- [ ] `updateBill` rejects edits on non‑draft bills
- [ ] Status machine: `draft → pending_review → approved → paid`; `pending_review → rejected`; `draft/pending_review → void`
- [ ] `BillCreated`, `BillApproved`, `BillRejected` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/finance/__tests__/bill‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bill approval workflow is an AP domain state machine with recorded actor for audit trail.
- Deep Module: `BillService` hides vendor validation, transactional create, approval recording, and event emission.

---

### Subtasks
- [ ] API‑FIN‑007.0.25 (AGENT): Read DB‑AP‑002, vendor repository API, and `InvoiceService` as pattern. *No action – pause.*
- [ ] API‑FIN‑007.1 (AGENT): Implement `BillRepository` (with transactional create for line items). **File(s):** `lib/db/src/repositories/finance/bills.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑007.2 (AGENT): Implement `BillService` with approval workflow and status machine. **File(s):** `artifacts/api‑server/src/services/finance/bill‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑007.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/finance/__tests__/bill‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑007.4 (HUMAN): Review approval workflow and status guard. Sign off. **Verification:** Approved.

---

### [ ] API‑FIN‑008: Bills (AP) – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP bill routes wired.
**Size:** Small

**Description:** Create AP bill route handlers (CRUD + approve + reject), mount the router, and run integration tests to green.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑FIN‑007`, `API‑FIN‑006`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑018`
**Related Files:** `artifacts/api‑server/src/routes/finance/bills.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST approve, POST reject, DELETE (soft) handlers
- [ ] `CannotModifyApprovedBill` → 400; `VendorNotFound` → 400
- [ ] `pnpm test -- bills.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/finance/bills.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FIN‑008.0.25 (AGENT): Read `routes/finance/invoices.ts` as pattern. *No action – pause.*
- [ ] API‑FIN‑008.1 (AGENT): Implement bills router and mount. **File(s):** `artifacts/api‑server/src/routes/finance/bills.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑FIN‑008.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑FIN‑008.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---
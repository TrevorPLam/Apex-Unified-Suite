# tasks/crm/CRM‑LEADS.md – CRM Leads Context

This file contains all tasks related to CRM Lead management: database schema, API endpoints (CRUD, conversion, duplicate detection, field validation), service layer, repository, integration tests, and frontend integration (Kanban board, interactive mutations, lead conversion UI, follow‑up tasks). Leads represent potential customers progressing through a sales pipeline.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schema

### [ ] DB‑CRM‑001: Define Leads Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No leads table. CRM core is entirely blocked.
**Size:** Small

**Description:** Define the `leads` table – the primary pipeline entity. Supports stage tracking, soft delete, and assignment.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `crm/CRM‑DEALS.md → DB‑CRM‑004`, `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑005`, `DB‑CRM‑006`, `DB‑CRM‑007`, `DB‑CRM‑009`, `crm/CRM‑LEADS.md → API‑CRM‑001`
**Related Files:** `lib/db/src/schema/crm/leads.ts`, `lib/db/src/__tests__/crm‑leads.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/crm/leads.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `email` (text nullable), `first_name` (text NOT NULL), `last_name` (text NOT NULL), `phone` (text nullable), `company_name` (text nullable), `stage` (pgEnum: `new|contacted|qualified|proposal|won|lost`), `assigned_to` (uuid nullable FK → users), `deal_size_cents` (integer nullable), `probability` (integer nullable), `converted_at` (timestamp nullable), `converted_to_type` (text nullable – `contact|deal`), `converted_to_id` (uuid nullable), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, stage)`, `(assigned_to, stage)`, `(organization_id, email)`
- [ ] Zod schemas exported; insert schema rejects invalid stage
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Lead scoring (future)
- Lead‑to‑contact conversion (handled by `crm/CRM‑LEADS.md → API‑CRM‑022` / LeadService)

**Rules to Follow**
- All queries must include `organization_id`
- `stage` transitions validated at service layer: `new → contacted → qualified → proposal → won|lost`; no backward moves
- `converted_at` marks when a lead becomes a contact or deal

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑leads.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Lead is an aggregate root in CRM. Stage is a domain value object.
- TDD: Assert stage enum, composite indexes, soft delete column.

---

### Subtasks
- [ ] DB‑CRM‑001.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. *No action – pause.*
- [ ] DB‑CRM‑001.0.5 (AGENT): Research Drizzle pgEnum and composite index syntax.
- [ ] DB‑CRM‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑leads.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm run typecheck` clean.
- [ ] DB‑CRM‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – OpenAPI Spec & Tests

### [ ] API‑CRM‑001: Leads – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `lib/api‑spec/openapi.yaml` has placeholder or no lead endpoints defined. No Zod schemas or React Query hooks exist for leads.
**Size:** Small

**Description:** Add all lead CRUD endpoints, request/response schemas, and enums to the OpenAPI spec — which drives codegen for Zod validation and React Query hooks.

**Depends on:** `crm/CRM‑LEADS.md → DB‑CRM‑001`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑002`, `API‑CRM‑003`, `API‑CRM‑004`, `API‑CRM‑005`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/crm/leads` endpoint defined with query params: `page`, `limit`, `stage`, `assignedTo`, `search`, `includeDeleted`
- [ ] `POST /api/v1/crm/leads` with `CreateLeadRequestBody` schema
- [ ] `GET /api/v1/crm/leads/{leadId}` defined
- [ ] `PATCH /api/v1/crm/leads/{leadId}` with `UpdateLeadRequestBody` schema
- [ ] `DELETE /api/v1/crm/leads/{leadId}` (soft delete, returns 204)
- [ ] `LeadStageEnum` defined: `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`
- [ ] `pnpm --filter @workspace/api‑spec run codegen` completes without errors

**Out of Scope**
- Lead conversion endpoint (`API‑CRM‑022`)
- Duplicate detection endpoints (`API‑CRM‑023`)
- Bulk operations

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The OpenAPI spec is the contract for the CRM bounded context.
- TDD: Spec change is the first step; tests (API‑CRM‑002) come next.

---

### Subtasks
- [ ] API‑CRM‑001.0.25 (AGENT): Read the current `openapi.yaml`, existing lead schema (if any), and DB‑CRM‑001 schema. *No action – pause.*
- [ ] API‑CRM‑001.0.5 (AGENT): Research OpenAPI 3.1 best practices for CRM entity spec authoring. *Document findings briefly.*
- [ ] API‑CRM‑001.1 (AGENT): Add `Lead` schema and all lead endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** YAML valid.
- [ ] API‑CRM‑001.2 (AGENT): Run codegen and verify generated output. **Verification:** `pnpm codegen` exits 0; `pnpm typecheck`.
- [ ] API‑CRM‑001.3 (HUMAN): Review spec additions and sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑002: Leads – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No integration tests for leads exist.
**Size:** Medium

**Description:** Write a comprehensive integration test suite for all lead endpoints using the generated Zod schemas for request/response validation — all tests must fail (red) before implementation.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑001`, `DB‑CRM‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑005`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts`

**Definition of Done**
- [ ] Tests for `GET /crm/leads`: returns 200 with paginated envelope, filtered by `stage`, `search`, and `assignedTo`
- [ ] Tests for `POST /crm/leads`: 201 on valid data; 400 on missing required fields; 400 on invalid stage
- [ ] Tests for `GET /crm/leads/{id}`: 200 on existing; 404 on unknown ID; 401 without auth
- [ ] Tests for `PATCH /crm/leads/{id}`: 200 on valid update; 400 on invalid stage transition; 404 on unknown ID
- [ ] Tests for `DELETE /crm/leads/{id}`: 204; soft delete
- [ ] All tests currently fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/leads.test.ts
# Expected: all fail
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Integration tests validate the API contract.
- TDD: Red phase — all tests MUST fail before any route/service code is written.
- BDD: Scenarios translate to test cases. Each `it()` corresponds to a Gherkin scenario.

---

### Subtasks
- [ ] API‑CRM‑002.0.25 (AGENT): Read API‑CRM‑002, generated lead schemas, and test infrastructure. *No action – pause.*
- [ ] API‑CRM‑002.0.5 (AGENT): Review test utilities (auth token factory, DB seeding helpers). *Document findings briefly.*
- [ ] API‑CRM‑002.1 (AGENT): Write all lead integration tests — CRUD, auth, validation, soft delete. **File(s):** `artifacts/api‑server/__tests__/api/crm/leads.test.ts` **Verification:** All fail (red); `pnpm typecheck`.
- [ ] API‑CRM‑002.2 (HUMAN): Review test coverage completeness and confirm red phase. **Verification:** Approved.

---

## Service, Repository & Routes

### [ ] API‑CRM‑003: Leads – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `LeadRepository` or `LeadService` implementation exists.
**Size:** Large

**Description:** Implement the `LeadRepository` (all DB queries) and `LeadService` (business logic, stage machine validation, event emission) following the Deep Module pattern.

**Depends on:** `crm/CRM‑LEADS.md → DB‑CRM‑001`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑004`, `API‑CRM‑005`
**Related Files:** `lib/db/src/repositories/crm/leads.ts`, `artifacts/api‑server/src/services/crm/lead‑service.ts`

**Definition of Done**
- [ ] `LeadRepository`: `findById`, `findByOrg`, `create`, `update`, `softDelete`, `findByEmail`, `findIncludingDeleted`
- [ ] `LeadService`: `listLeads`, `getLead`, `createLead`, `updateLead`, `deleteLead`. All return `Result<T, DomainError>`.
- [ ] Stage machine enforced in `updateLead`: valid transitions only. Invalid transition returns `err(InvalidStageTransition)`.
- [ ] Soft delete: `deleteLead` sets `deleted_at = now()`.
- [ ] `LeadCreated` and `LeadUpdated` domain events emitted after writes.
- [ ] Unit tests for service (mocked repository) pass.
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/lead‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `LeadService` is the application service orchestrating the Lead aggregate. Stage transitions are domain rules.
- TDD: Unit tests for `LeadService` with mocked `LeadRepository`. Red → Green → Refactor.
- Deep Module: `LeadService` hides repository, stage machine, event emission, and soft‑delete behind 5 clean methods.

---

### Subtasks
- [ ] API‑CRM‑003.0.25 (AGENT): Read DB‑CRM‑001, EVENT‑001, ERROR‑002. *No action – pause.*
- [ ] API‑CRM‑003.0.5 (AGENT): Research neverthrow Result patterns, Drizzle ORM query builders, and soft‑delete patterns. *Document findings briefly.*
- [ ] API‑CRM‑003.1 (AGENT): Implement `LeadRepository` with all query methods. **File(s):** `lib/db/src/repositories/crm/leads.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑003.2 (AGENT): Implement `LeadService` with stage machine, neverthrow Results, and event emission. **File(s):** `artifacts/api‑server/src/services/crm/lead‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑003.3 (AGENT): Write unit tests for `LeadService` (mocked repository). **File(s):** `artifacts/api‑server/src/services/crm/__tests__/lead‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑003.4 (HUMAN): Review stage machine, Result types, and event emission. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑004: Leads – Routes & Validation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No lead routes defined.
**Size:** Small

**Description:** Create Express route handlers for all lead endpoints, wiring auth middleware, Zod request validation (using generated schemas), and `LeadService` method calls — with proper HTTP status codes and error mapping.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑003`, `infrastructure/AUTH.md → AUTH‑008`, `API‑CRM‑001`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑005`
**Related Files:** `artifacts/api‑server/src/routes/crm/leads.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 5 CRUD route handlers implemented; `LeadNotFound` → 404; `InvalidStageTransition` → 400
- [ ] All routes protected by `authMiddleware`
- [ ] Router mounted in `routes/index.ts`
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm typecheck
# Integration tests should now start passing after API‑CRM‑005
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are thin adapters translating HTTP to domain service calls.

---

### Subtasks
- [ ] API‑CRM‑004.0.25 (AGENT): Read `routes/index.ts`, `authMiddleware`, and generated lead schemas. *No action – pause.*
- [ ] API‑CRM‑004.1 (AGENT): Implement `leads.ts` router with all 5 CRUD route handlers. **File(s):** `artifacts/api‑server/src/routes/crm/leads.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑004.2 (AGENT): Mount leadsRouter in `routes/index.ts`. **File(s):** `artifacts/api‑server/src/routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑004.3 (HUMAN): Review routes for auth enforcement and error mapping. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑005: Leads – Run Integration Tests to Green
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Integration tests written (API‑CRM‑002) but failing (red). Routes wired (API‑CRM‑004) but tests not yet verified green.
**Size:** Medium

**Description:** Run the lead integration tests and fix any remaining failures — correcting implementation bugs, response format mismatches, or missing edge‑case handling — until all tests pass.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑002`, `API‑CRM‑003`, `API‑CRM‑004`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑022`, `API‑CRM‑023`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑027`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts`, all lead implementation files

**Definition of Done**
- [ ] `pnpm test -- leads.test.ts` passes with 0 failures
- [ ] No skipped tests
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Never modify test assertions to make failing tests pass — fix the implementation.

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/leads.test.ts
# Expected: 0 failures, 0 skipped
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – this is the TDD green phase.

---

### Subtasks
- [ ] API‑CRM‑005.0.25 (AGENT): Run the integration tests and collect all failure messages. *No action until test output is fully read.*
- [ ] API‑CRM‑005.1 (AGENT): Fix schema/response format mismatches. **File(s):** As needed **Verification:** Re‑run failing tests.
- [ ] API‑CRM‑005.2 (AGENT): Fix auth, status code, and DB seeding issues. **Verification:** All tests green; `pnpm typecheck`.
- [ ] API‑CRM‑005.3 (HUMAN): Final sign‑off on green tests. **Verification:** Approved.

---

## Lead Conversion

### [ ] API‑CRM‑022: Lead Conversion API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Leads have conversion columns but no endpoint. Conversion logic does not exist.
**Size:** Large

**Description:** Implement `POST /crm/leads/{leadId}/convert` — a transactional endpoint that marks a lead as converted, creates or links a target entity, logs an activity, emits the `LeadConverted` domain event, and prevents duplicate conversions idempotently.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑005`, `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑007`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `crm/CRM‑LEADS.md → API‑CRM‑003`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑027`
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/crm/lead‑service.ts`, `artifacts/api‑server/src/routes/crm/leads.ts`

**Definition of Done**
- [ ] `POST /crm/leads/{leadId}/convert` accepts `{ targetType: 'contact'|'company'|'deal', targetId?, createPayload? }`
- [ ] Transactionally marks lead converted, creates target entity if requested, inserts `LeadConverted` activity
- [ ] Idempotent: returns 200 with existing conversion data if already converted
- [ ] Emits `LeadConverted` domain event
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/leads.test.ts -t "convert"
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Lead conversion is a domain operation that crosses aggregate boundaries.
- TDD: Write integration tests first (red). All must fail before `convertLead` is implemented.

---

### Subtasks
- [ ] API‑CRM‑022.0.25 (AGENT): Read API‑CRM‑022, API‑CRM‑003, DB‑CRM‑007, and EVENT‑001. *No action – pause.*
- [ ] API‑CRM‑022.0.5 (AGENT): Research Drizzle ORM transaction API and idempotency patterns. *Document findings briefly.*
- [ ] API‑CRM‑022.1 (AGENT): Add `POST /crm/leads/{leadId}/convert` to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑022.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/crm/leads.test.ts` **Verification:** All failing.
- [ ] API‑CRM‑022.3 (AGENT): Implement `LeadService.convertLead()` with transaction, entity factory, activity creation, and event emission. **File(s):** `artifacts/api‑server/src/services/crm/lead‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑022.4 (AGENT): Create route handler and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/crm/leads.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑022.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Duplicate Detection & Merge

### [ ] API‑CRM‑023: Duplicate Detection & Merge API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No duplicate detection exists; duplicate leads/contacts accumulate silently.
**Size:** Large

**Description:** Implement `GET /crm/leads/duplicates` (email/phone‑based duplicate pair detection) and `POST /crm/leads/merge` (survivorship‑rules merge with reference updates and secondary soft‑delete).

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑005`, `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑008`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — enhancement feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/crm/lead‑service.ts`

**Definition of Done**
- [ ] `GET /crm/leads/duplicates` returns pairs with confidence: `email|phone|both`
- [ ] `POST /crm/leads/merge` accepts `{ primaryId, secondaryId, survivorshipRules? }`. Atomically applies survivorship, reassigns references, soft‑deletes secondary, records merge in history.
- [ ] Integration tests: detect duplicates, merge, custom survivorship, 404 on already‑deleted
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Merge must be a single DB transaction: reference updates + soft‑delete + history record, all or nothing
- Never merge a primary into itself (`primaryId === secondaryId` → 400 `SelfMergeNotAllowed`)
- Secondary must be active (not already soft‑deleted) before merge can proceed

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/leads.test.ts -t "duplicate|merge"
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Duplicate detection is a read‑only query across the Lead aggregate. Merge is a destructive domain operation.
- TDD: Write tests first (red). Seed specific duplicate data in test DB.

---

### Subtasks
- [ ] API‑CRM‑023.0.25 (AGENT): Read API‑CRM‑023, DB‑CRM‑008 schema, and all CRM entity tables with FK references to leads. *No action – pause.*
- [ ] API‑CRM‑023.0.5 (AGENT): Research duplicate detection SQL patterns and reference cascade strategies for merge operations. *Document findings briefly.*
- [ ] API‑CRM‑023.1 (AGENT): Add duplicate detection and merge endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑023.2 (AGENT): Write integration tests (red). **File(s):** `artifacts/api‑server/__tests__/api/crm/leads.test.ts` **Verification:** All red.
- [ ] API‑CRM‑023.3 (AGENT): Implement `findDuplicates()` and `mergeLeads()` in `LeadService`. **File(s):** `artifacts/api‑server/src/services/crm/lead‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑023.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/crm/leads.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑023.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend Integration – Kanban, UI, Mutations

### [ ] FRONT‑CRM‑001: CRM Lead Pipeline – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex‑os/src/pages/CRM.tsx` imports leads from `src/data/mockData.ts`. No `useLeadList` hook exists.
**Size:** Small

**Description:** Create a `useLeadList` hook backed by `API‑CRM‑005` and replace all mock lead data in the CRM Kanban view. Drag‑and‑drop calls `useUpdateLead` with optimistic updates and rollback on failure.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑005`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `crm/CRM‑LEADS.md → FRONT‑INT‑CRM`
**Related Files:** `artifacts/apex‑os/src/pages/CRM.tsx`, `artifacts/apex‑os/src/hooks/crm/useLeadList.ts`

**Definition of Done**
- [ ] `useLeadList(filters?)` hook; `useUpdateLead()` mutation with optimistic stage change and rollback
- [ ] CRM Kanban columns built dynamically from pipeline stage config returned by the API
- [ ] All `mockData` imports removed from `CRM.tsx`
- [ ] `pnpm typecheck` passes
- [ ] Component tests: leads render in correct columns; drag‑and‑drop calls mutation; rollback occurs on failure

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- crm‑kanban.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Frontend Lead entity view; stage changes respect domain rules via API mutations — no client‑side business logic.
- TDD: Write MSW handler returning leads in two stages; test Kanban renders correctly; simulate drag → assert mutation called.
- BDD: “As a firm user, I can drag a lead card to a new stage and see it move immediately; if the save fails, it returns to its original stage.”
- Deep Module: `useLeadList` hides API call, pagination, and filter logic.

---

### Subtasks
- [ ] FRONT‑CRM‑001.0.25 (AGENT): Read `CRM.tsx` in full and list every `mockData` reference. *No action – pause.*
- [ ] FRONT‑CRM‑001.1 (AGENT): Create `useLeadList` hook with stage filter and pagination. **File(s):** `artifacts/apex‑os/src/hooks/crm/useLeadList.ts` **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑CRM‑001.2 (AGENT): Replace mock leads in Kanban with API data; build columns from pipeline config. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** No mockData references; `pnpm typecheck`.
- [ ] FRONT‑CRM‑001.3 (AGENT): Wire drag‑and‑drop to `useUpdateLead` mutation with optimistic update and rollback. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx`, `artifacts/apex‑os/src/hooks/crm/useUpdateLead.ts` **Verification:** `pnpm --filter @workspace/apex‑os test -- crm‑kanban.test.tsx` → GREEN.
- [ ] FRONT‑CRM‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑CRM: CRM Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No create/update/delete mutations are wired in the CRM page. All forms are non‑functional.
**Size:** Medium

**Description:** Wire all CRM create/update/delete mutations: lead creation form → `useCreateLead`; activity logging → `useCreateActivity`; contact and deal CRUD. All mutations show sonner toast feedback.

**Depends on:** `crm/CRM‑LEADS.md → FRONT‑CRM‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → FRONT‑CRM‑002`, `crm/CRM‑DEALS.md → FRONT‑CRM‑003`, `crm/CRM‑LEADS.md → API‑CRM‑005`, `infrastructure/AUTH.md → FRONT‑INFRA‑003`, `FRONT‑INFRA‑004`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/CRM.tsx`, `artifacts/apex‑os/src/hooks/crm/`

**Definition of Done**
- [ ] Create lead form calls `useCreateLead`; on success, invalidates `['leads']` and shows success toast
- [ ] `useUpdateLead` (from drag‑and‑drop) and `useDeleteLead` wired; delete uses `useUndoableMutation`
- [ ] All mutation loading states disable the relevant submit button
- [ ] All mutation errors show user‑friendly sonner toasts
- [ ] Integration tests with MSW cover all create/update/delete paths

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- crm‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mutations enforce CRM domain rules through the API; the frontend delegates validation to the backend.
- TDD: Integration test with MSW — submit create lead form → assert `POST /api/v1/leads` called.

---

### Subtasks
- [ ] FRONT‑INT‑CRM.0.25 (AGENT): List all CRM forms and buttons that require mutation wiring. *No action – pause.*
- [ ] FRONT‑INT‑CRM.1 (AGENT): Implement `useCreateLead`, `useDeleteLead` mutation hooks; wire to lead form and delete button. **File(s):** `artifacts/apex‑os/src/hooks/crm/useCreateLead.ts`, `useDeleteLead.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑CRM.2 (AGENT): Wire all remaining CRM mutations (contacts, deals, activities) with toast feedback. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- crm‑interactive.test.tsx` → GREEN.
- [ ] FRONT‑INT‑CRM.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑CRM‑004: Lead Conversion UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No lead conversion UI exists. `API‑CRM‑022` lead conversion endpoint is not wired into the frontend.
**Size:** Small

**Description:** Add a “Convert to Contact” / “Convert to Deal” button on the lead detail panel that opens a wizard modal: select target type, optionally create a new entity, confirm conversion.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑022`, `FRONT‑CRM‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/LeadConversionWizard.tsx`

**Definition of Done**
- [ ] “Convert” button on lead detail slide‑out or lead card context menu
- [ ] Wizard modal: Step 1 – select target type; Step 2 – confirm or create new entity; Step 3 – success screen with link to created entity
- [ ] `useConvertLead` mutation fires `POST /api/v1/leads/:id/convert`
- [ ] `DuplicateConversionError` shown as inline error
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- LeadConversionWizard.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Lead conversion is a domain event; the API enforces business rules; the UI is a thin wizard.
- TDD: MSW mock returns success → assert lead marked converted.
- BDD: “As a firm user, I can convert a qualified lead to a contact and optionally create a linked deal in one workflow.”

---

### Subtasks
- [ ] FRONT‑CRM‑004.1 (AGENT): Create `LeadConversionWizard` component with 3‑step state machine and conversion mutation. **File(s):** `artifacts/apex‑os/src/components/crm/LeadConversionWizard.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑004.2 (AGENT): Wire “Convert” button in lead detail; handle `DuplicateConversionError`. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑004.3 (AGENT): Write component test with MSW (success and duplicate error paths). **File(s):** `artifacts/apex‑os/src/components/crm/__tests__/LeadConversionWizard.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑CRM‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑CRM‑005: Duplicate Detection & Merge UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No duplicate detection or merge UI exists.
**Size:** Medium

**Description:** Show a collapsible “Possible Duplicates” panel on lead/contact/company list pages, with a side‑by‑side merge preview and field survivorship selection. Execute merge via `useMergeRecords` mutation.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑023`, `FRONT‑CRM‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → FRONT‑CRM‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/DuplicatePanel.tsx`, `MergePreview.tsx`

**Definition of Done**
- [ ] `DuplicatePanel` appears when `GET /api/v1/{entity}/{id}/duplicates` returns candidates
- [ ] `MergePreview` shows side‑by‑side field comparison with radio buttons for field survivorship
- [ ] “Execute Merge” button fires `POST /api/v1/{entity}/merge`; on success, secondary record disappears
- [ ] Confirmation dialog warns: “This action cannot be undone.”
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- MergePreview.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Duplicate detection and merge are cross‑entity operations; the API enforces referential integrity.
- TDD: MSW returns two duplicate leads → assert panel shows candidates; simulate merge → assert secondary removed.

---

### Subtasks
- [ ] FRONT‑CRM‑005.1 (AGENT): Implement `DuplicatePanel` with duplicate candidate list. **File(s):** `artifacts/apex‑os/src/components/crm/DuplicatePanel.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑005.2 (AGENT): Implement `MergePreview` with field survivorship selection. **File(s):** `artifacts/apex‑os/src/components/crm/MergePreview.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑005.3 (AGENT): Write component test with MSW. **File(s):** `artifacts/apex‑os/src/components/crm/__tests__/MergePreview.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑CRM‑005.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑CRM‑006: Follow‑Up Task Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM follow‑up task UI exists.
**Size:** Medium

**Description:** Implement a “Tasks” tab on lead/contact/deal detail pages showing CRM follow‑up tasks with due dates, assignees, priority levels, and completion checkboxes. Include task creation form with entity pre‑linking.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑024`, `FRONT‑CRM‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → FRONT‑CRM‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/TaskList.tsx`, `TaskForm.tsx`, `artifacts/apex‑os/src/hooks/crm/useCRMTaskList.ts`

**Definition of Done**
- [ ] “Tasks” tab on lead/contact/deal detail pages with task count badge
- [ ] Task list displays: title, due date (with overdue highlighting), assignee avatar, priority badge, completion checkbox
- [ ] Create task form pre‑links to current entity
- [ ] Inline editing and completion toggles
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- TaskList.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: CRM Tasks are domain entities within the CRM bounded context, linked to core CRM entities.
- TDD: MSW returns tasks with different due dates → assert overdue highlighting; simulate task completion → assert API called.
- BDD: “As a firm user, I can view and manage follow‑up tasks for a lead and create new tasks automatically linked to the lead.”

---

### Subtasks
- [ ] FRONT‑CRM‑006.0.25 (AGENT): Read existing task management patterns and verify `API‑CRM‑024` schema. *No action – pause.*
- [ ] FRONT‑CRM‑006.1 (AGENT): Create `useCRMTaskList`, `useCreateCRMTask`, `useUpdateCRMTask` hooks. **File(s):** `artifacts/apex‑os/src/hooks/crm/useCRMTaskList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑006.2 (AGENT): Implement `TaskList` component with sorting, filtering, and completion toggles. **File(s):** `artifacts/apex‑os/src/components/crm/TaskList.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑006.3 (AGENT): Implement `TaskForm` component with entity pre‑linking. **File(s):** `artifacts/apex‑os/src/components/crm/TaskForm.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑006.4 (AGENT): Integrate Tasks tab into lead/contact/deal detail pages. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** Tasks tab appears and functions.
- [ ] FRONT‑CRM‑006.5 (AGENT): Write component tests with MSW. **File(s):** `artifacts/apex‑os/src/components/crm/__tests__/TaskList.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑CRM‑006.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Cross‑Cutting Lead Tasks

### [ ] API‑CRM‑025: Ownership & Assignment Management API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Ownership fields exist in CRM schemas but no dedicated endpoints to reassign ownership or query “my records.”
**Size:** Medium

**Description:** Implement `PATCH /crm/{entityType}/{id}/assign` for ownership/team/visibility reassignment with event emission and history logging, plus `GET /crm/my‑records` for the authenticated user’s assigned entities across all CRM types.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑005`, `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`, `API‑CRM‑013`, `crm/CRM‑DEALS.md → API‑CRM‑017`, `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑009`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** [N/A] — enhancement
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/crm/assignment‑service.ts`, `artifacts/api‑server/src/routes/crm/assignments.ts`

**Definition of Done**
- [ ] `PATCH /crm/{entityType}/{id}/assign` accepts `{ assigned_to?, team_id?, visibility? }`
- [ ] Validates assignee is a valid user in the same organisation
- [ ] Records assignment change in `assignment_history` table
- [ ] Emits `AssignmentChanged` domain event
- [ ] `GET /crm/my‑records` returns paginated entities assigned to the authenticated user
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/assignments.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Ownership is a cross‑cutting concern within the CRM bounded context.
- TDD: Write integration tests before implementation.
- BDD: “When a manager reassigns a lead to another rep, the previous owner is recorded in history and an AssignmentChanged event is emitted.”

---

### Subtasks
- [ ] API‑CRM‑025.0.25 (AGENT): Read API‑CRM‑025, DB‑CRM‑009 schema, EVENT‑001, and all CRM entity repositories. *No action – pause.*
- [ ] API‑CRM‑025.1 (AGENT): Add assignment and my‑records endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑025.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/crm/assignments.test.ts` **Verification:** All red.
- [ ] API‑CRM‑025.3 (AGENT): Implement `AssignmentService` with entity resolution, user validation, history write, and event emission. **File(s):** `artifacts/api‑server/src/services/crm/assignment‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑025.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/crm/assignments.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑025.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
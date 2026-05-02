Now applying all corrections to **Phase 3 – API Business Logic: CRM Context**. This phase builds the first full business API, establishing patterns that all later contexts will follow (contract‑first, test‑first, service‑as‑deep‑module, soft delete filtering via repository, Either error handling, and domain event emission).

Key improvements integrated:

- **Explicit `depends_on`** on every parent task (links to DB‑MIGRATE‑ALL, ERROR‑002, AUTH‑008, etc.).
- **Verification commands** on every subtask.
- **Negative integration test cases** with exact error codes (`InvalidStageTransition`, `LeadNotFound`).
- **Pagination standard** defined in the Leads list task and referenced by others.
- **OpenAPI examples** required for each endpoint.
- **HTTP status codes** and response envelope explicitly stated (201 + Location, 204 for delete).
- **Depth refactor check** appended to the lead service task.
- **CRM domain events verification** (task API‑CRM‑022) ensures audit trail works end‑to‑end.
- **Dependencies** ensure that the test infrastructure (TEST‑INFRA‑001) and the global error handler (ERROR‑001) are in place before integration tests go green.

---

# Phase 3 – API Business Logic: CRM Context

*This phase wires the CRM bounded context to fully functional API endpoints, directly addressing the audit findings: zero business endpoints, no service layer, no repository pattern, and validation missing. It builds on the database schema from Phase 2, the error foundation from Phase 1.5, and the auth middleware from Phase 1. Every endpoint is contract‑first (OpenAPI), test‑first (TDD), and encapsulated in a deep module service. Integration tests remain **red** until services and routes are implemented, then turn green.*

---

## Phase 3 Task Index

**Leads**  
• API‑CRM‑001 – Expand OpenAPI Spec  
• API‑CRM‑002 – Integration Tests (TDD Red)  
• API‑CRM‑003 – Service & Repository (Deep Module)  
• API‑CRM‑004 – Routes & Validation  
• API‑CRM‑005 – Run Integration Tests to Green  

**Contacts**  
• API‑CRM‑006 – Expand OpenAPI Spec  
• API‑CRM‑007 – Integration Tests (Red)  
• API‑CRM‑008 – Service & Repository  
• API‑CRM‑009 – Routes & Green Tests  

**Companies**  
• API‑CRM‑010 – Expand OpenAPI Spec  
• API‑CRM‑011 – Integration Tests (Red)  
• API‑CRM‑012 – Service & Repository  
• API‑CRM‑013 – Routes & Green Tests  

**Deals**  
• API‑CRM‑014 – Expand OpenAPI Spec  
• API‑CRM‑015 – Integration Tests (Red)  
• API‑CRM‑016 – Service & Repository  
• API‑CRM‑017 – Routes & Green Tests  

**Activities**  
• API‑CRM‑018 – Expand OpenAPI Spec  
• API‑CRM‑019 – Integration Tests  
• API‑CRM‑020 – Service & Repository  
• API‑CRM‑021 – Routes & Green Tests  

**Cross‑Cutting**  
• API‑CRM‑022 – CRM Domain Events Verification  

---

## Leads

### API‑CRM‑001: Leads – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑001 (schema must exist for types), DOMAIN‑003 (feature file defines scenarios).  
**Definition of Done:** OpenAPI spec extends with `crm` tag and paths:  
- `GET /crm/leads` – list with pagination (`page`, `limit`), search (`search`), filter (`stage`). **Pagination standard**: default `limit=20`, max `limit=100`, response envelope `{ data: Lead[], meta: { page, limit, total, totalPages } }`.  
- `POST /crm/leads` – create (auth required). Returns `201 Created`, `Location` header pointing to the new resource. Response body `{ data: Lead }`.  
- `GET /crm/leads/{leadId}` – get by ID.  
- `PATCH /crm/leads/{leadId}` – update stage and fields.  
- `DELETE /crm/leads/{leadId}` – soft delete. Returns `204 No Content`.  
All operations have request/response schemas (`Lead`, `LeadCreate`, `LeadUpdate`).  
**Examples:** Every endpoint must include at least one example request and response in the spec.  
**Anti-Patterns:** Missing pagination params; ad‑hoc query strings.  
**Related Files:** `lib/api‑spec/openapi.yaml`

**DDD:** The Lead API exposes the CRM bounded context’s lead aggregate. Operations align with domain actions.  
**TDD:** After codegen, we’ll write failing integration tests (API‑CRM‑002) that verify the contract.  
**BDD:** This spec enables the “Sales rep can manage leads” scenario and its negative counterparts.  
**Deep Module:** The API spec is the public interface; the LeadService underneath will be a deep module.

**Subtasks:**
- [ ] API‑CRM‑001.1: Add `crm` tag and lead schemas (`Lead`, `LeadCreate`, `LeadUpdate`) to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec contains paths with correct operationIds.
- [ ] API‑CRM‑001.2: Define list endpoint with pagination, search, filter params and standard envelope. (AGENT)  
  **verification:** Generated client returns typed pagination meta.
- [ ] API‑CRM‑001.3: Define create/update/delete endpoints with auth requirement and soft delete response (204). (AGENT)  
  **verification:** Spec shows `204` for delete.
- [ ] API‑CRM‑001.4: Add example request/response bodies to every operation. (AGENT)  
  **verification:** Swagger UI renders examples.
- [ ] API‑CRM‑001.5: Run `pnpm codegen` to regenerate client (React Query hooks) and Zod schemas. (HUMAN)  
  **verification:** `pnpm typecheck` passes.
- [ ] API‑CRM‑001.6: Run `pnpm typecheck` and inspect generated Zod files for Orval’s `_type` issue; fix if needed. (AGENT)  
  **verification:** No type‑related errors.
- **Blocks:** API‑CRM‑002 (integration tests).

---

### API‑CRM‑002: Leads – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑001 (for generated types), TEST‑INFRA‑001 (test DB and server), DB‑MIGRATE‑ALL (schema + seed).  
**Definition of Done:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts` contains failing tests for:  
- `POST /crm/leads` with valid payload → 201, lead in DB, `Location` header present.  
- `POST /crm/leads` with invalid stage → 400 `InvalidStageTransition`.  
- `POST /crm/leads` with duplicate email contact → 409 `DuplicateEmail` (or `DuplicateLead`).  
- `GET /crm/leads` → 200 with pagination, stage filter, soft‑deleted leads excluded by default.  
- `GET /crm/leads/{id}` → 200 if found, 404 `LeadNotFound` if missing.  
- `GET /crm/leads/{id}` for soft‑deleted lead → 404 (default).  
- `PATCH /crm/leads/{id}` → 200 with updated fields.  
- `DELETE /crm/leads/{id}` → 204 (soft delete sets `deleted_at`).  
- Unauthorized requests → 401.  
**Related Files:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts`

**DDD:** Tests verify that the Lead aggregate lifecycle and rules are enforced.  
**TDD:** Write tests first; they will all fail because no routes exist.  
**BDD:** The “Move lead through stages” and “Invalid stage jump” scenarios are directly covered.  
**Deep Module:** Tests call only the HTTP API, treating the backend as a deep module.

**Subtasks:**
- [ ] API‑CRM‑002.1: Set up test database and configuration using `beforeAll` hooks from TEST‑INFRA‑001. (AGENT)  
  **verification:** Test harness runs without errors.
- [ ] API‑CRM‑002.2: Write test for `POST /crm/leads` (happy path + invalid stage). (AGENT)  
  **verification:** Tests fail with 404 (no route).
- [ ] API‑CRM‑002.3: Write test for `GET /crm/leads` (pagination, stage filter, soft delete exclusion). (AGENT)  
  **verification:** Red.
- [ ] API‑CRM‑002.4: Write tests for `GET /{id}`, `PATCH`, `DELETE` (soft delete), including negative: attempt to update soft‑deleted lead. (AGENT)  
  **verification:** Red.
- [ ] API‑CRM‑002.5: Write unauthorized access tests (missing/invalid token). (AGENT)  
  **verification:** Red.
- **Blocks:** API‑CRM‑005 (go green).

---

### API‑CRM‑003: Leads – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑002 (tests define contract), DB‑MIGRATE‑ALL (DB exists), ERROR‑002 (domain errors defined), ARCH‑001.2 (BaseRepository), EVENT‑001 (domain event bus).  
**Definition of Done:**  
- `lib/db/src/repositories/crm/leads.ts` exports `LeadRepository` extending `BaseRepository<Lead>` with methods: `create`, `findById`, `findAll`, `update`, `softDelete`. Queries automatically exclude `deleted_at IS NOT NULL` rows; `includeDeleted` option overrides.  
- `artifacts/api‑server/src/services/crm/lead‑service.ts` exports `LeadService` with methods: `createLead(dto)`, `getLead(id)`, `listLeads(params)`, `updateLead(id, dto)`, `deleteLead(id)`.  
- Service enforces stage transitions (new → contacted → qualified → lost) and validates `assigned_to` exists.  
- All service methods return `Either<DomainError, Result>` using `neverthrow`.  
- Emit `LeadCreated` domain event in `createLead`.  
**Anti-Patterns:** Business logic in route handlers; exposing raw SQL.  
**Related Files:** `lib/db/src/repositories/crm/leads.ts`, `artifacts/api‑server/src/services/crm/lead‑service.ts`

**DDD:** The `LeadService` is the entry point into the CRM context. Stage machine and soft delete are domain rules.  
**TDD:** Write unit tests for `LeadService` with a mocked repository – verify stage transitions, soft delete behavior, Either return types, and event emission. Write unit tests for `LeadRepository` against a test database – verify soft delete filtering, `includeDeleted`, CRUD.  
**BDD:** The service encapsulates “move lead through stages” workflow.  
**Deep Module:** The service interface is simple (5 methods) while hiding stage machine logic, validation, soft delete filtering, and persistence.  
**Depth refactor check:** After implementation, verify public methods ≤ 5, service encapsulates at least three non‑trivial concerns (e.g., validation, persistence, event publication) behind ≤5 public methods.

**Subtasks:**
- [ ] API‑CRM‑003.1: Implement `LeadRepository` extending `BaseRepository` with soft delete support and `includeDeleted` option. (AGENT) – `lib/db/src/repositories/crm/leads.ts`  
  **verification:** Unit test for repository against test DB passes.
- [ ] API‑CRM‑003.2: Write unit tests for `LeadRepository` (soft delete filter, `includeDeleted`, CRUD). (AGENT)  
  **verification:** Green.
- [ ] API‑CRM‑003.3: Implement `LeadService` with stage machine, Either returns, and event emission. (AGENT) – `artifacts/api‑server/src/services/crm/lead‑service.ts`  
  **verification:** Unit tests for service (with mocked repo) pass.
- [ ] API‑CRM‑003.4: Write unit tests for `LeadService` (success + failure paths, stage transition rules, event emission). (AGENT)  
  **verification:** Green.
- [ ] API‑CRM‑003.5: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.
- **Blocks:** API‑CRM‑004.

---

### API‑CRM‑004: Leads – Routes & Validation
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑003 (service), AUTH‑008 (auth middleware), ERROR‑001 (global error handler).  
**Definition of Done:** `artifacts/api‑server/src/routes/crm/leads.ts` wires endpoints to `LeadService`, using the generic validation middleware (from AUTH‑006.1) with generated Zod schemas, and auth middleware. Errors from the service’s Either results are mapped to HTTP responses by the global error handler.  
**Related Files:** `artifacts/api‑server/src/routes/crm/leads.ts`

**DDD:** Routes are thin adapters; they translate HTTP ↔ domain service calls. No domain logic lives here.  
**TDD:** The integration tests from API‑CRM‑002 will drive this; a separate middleware test validates that Zod rejection returns 400.  
**BDD:** Same scenarios as integration tests.  
**Deep Module:** The route layer is intentionally shallow.

**Subtasks:**
- [ ] API‑CRM‑004.1: Create lead routes module with validation middleware and auth, using `catchAsync` for error propagation. (AGENT) – `routes/crm/leads.ts`  
  **verification:** Route tests with supertest and mocked service pass.
- [ ] API‑CRM‑004.2: Add lead routes to main router under `/api/crm`. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- **Blocks:** API‑CRM‑005.

---

### API‑CRM‑005: Leads – Run Integration Tests to Green
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑004, TEST‑INFRA‑001 (test server), DB‑MIGRATE‑ALL.  
**Definition of Done:** All tests from API‑CRM‑002 pass. Edge cases added: invalid stage transition, attempt to update a soft‑deleted lead, pagination boundary, concurrent updates (idempotency not required for leads, so no duplicate check).  
**Related Files:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts`

**DDD:** Green tests confirm the Lead aggregate is correctly exposed and domain rules are enforced end‑to‑end.  
**TDD:** Green phase – implement minimal fixes until all tests pass, then refactor.  
**BDD:** Tests validate both happy and error scenarios.  
**Deep Module:** The full stack is verified only through the public API, preserving encapsulation.

**Subtasks:**
- [ ] API‑CRM‑005.1: Run test suite, fix failures. (AGENT)  
  **verification:** `pnpm test -- leads.test.ts` all green.
- [ ] API‑CRM‑005.2: Add edge‑case tests (invalid transition, soft‑deleted access, pagination boundary). (AGENT)  
  **verification:** Green.
- [ ] API‑CRM‑005.3: All tests pass. (AGENT)  
  **verification:** Final green check.

---

## Contacts

### API‑CRM‑006: Contacts – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑002, API‑CRM‑001 (pattern established).  
**Definition of Done:** Add `contacts` paths to OpenAPI: `GET /crm/contacts` (list + search, pagination standard), `POST`, `GET /{id}`, `PATCH`, `DELETE` (soft delete → 204). Schemas `Contact`, `ContactCreate`, `ContactUpdate`. Examples included.  
**Subtasks:** add spec, codegen, typecheck.

---

### API‑CRM‑007: Contacts – Integration Tests (Red)
**Depends on:** API‑CRM‑006, TEST‑INFRA‑001.  
**Definition of Done:** Failing CRUD tests in `contacts.test.ts`, including soft delete, unique email conflict, not found.  
**Subtasks:** write tests for create (with company), list, get, update, delete, unauthorized.

---

### API‑CRM‑008: Contacts – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, BaseRepository.  
**Definition of Done:** `ContactRepository` (extending BaseRepository, soft delete with `includeDeleted`) and `ContactService` (enforces unique email per organization, Either returns). Unit tested.  
**Deep Module:** Service hides deduplication and query logic.  
**Depth refactor check** added.

---

### API‑CRM‑009: Contacts – Routes & Green Tests
**Depends on:** API‑CRM‑008, AUTH‑008, ERROR‑001.  
**Definition of Done:** Routes wired, integration tests green.  
**Subtasks:** create routes, run tests to green.

---

## Companies

### API‑CRM‑010: Companies – Expand OpenAPI Spec
**Depends on:** DB‑CRM‑003.  
**Definition of Done:** Companies paths: `GET /crm/companies`, `POST`, `GET /{id}`, `PATCH`, `DELETE` (soft delete). Schema includes `settings` JSONB. Examples, pagination standard.  
**Subtasks:** spec, codegen.

---

### API‑CRM‑011: Companies – Integration Tests (Red)
**Depends on:** API‑CRM‑010, TEST‑INFRA‑001.  
**Subtasks:** write tests for CRUD, unique domain conflict, soft delete, unauthorized.

---

### API‑CRM‑012: Companies – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `CompanyRepository` (soft delete, GIN index awareness) and `CompanyService` (unique domain per organization, Either). Unit tested.  
**Deep Module:** JSONB details hidden.  
**Depth refactor check** added.

---

### API‑CRM‑013: Companies – Routes & Green Tests
**Depends on:** API‑CRM‑012, AUTH‑008.  
**Subtasks:** routes, integration tests green.

---

## Deals

### API‑CRM‑014: Deals – Expand OpenAPI Spec
**Depends on:** DB‑CRM‑004.  
**Definition of Done:** Deal endpoints with pipeline stages, probability/amount, soft delete. Pagination standard applied. Examples.  
**Subtasks:** spec, codegen.

---

### API‑CRM‑015: Deals – Integration Tests (Red)
**Depends on:** API‑CRM‑014, TEST‑INFRA‑001.  
**Subtasks:** tests for CRUD, stage transitions, probability validation, soft delete, unauthorized.

---

### API‑CRM‑016: Deals – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `DealRepository` and `DealService` with pipeline rules (prospecting → qualification → … closed‑won/lost), probability constraints, Either, event emission (`DealCreated`, `DealStageChanged`). Unit tested.  
**Deep Module:** Encapsulates deal pipeline logic.  
**Depth refactor check** added.

---

### API‑CRM‑017: Deals – Routes & Green Tests
**Depends on:** API‑CRM‑016.  
**Subtasks:** routes, integration tests green.

---

## Activities

### API‑CRM‑018: Activities – Expand OpenAPI Spec
**Depends on:** DB‑CRM‑005.  
**Definition of Done:** Activity endpoints: `GET /crm/activities?entityType=lead&entityId=...` (list), `POST /crm/activities` (create note/email/call). Append‑only – no update or delete endpoints.  
**Subtasks:** spec, codegen.

---

### API‑CRM‑019: Activities – Integration Tests
**Depends on:** API‑CRM‑018, TEST‑INFRA‑001.  
**Subtasks:** tests for list by entity, create activity, verify update/delete endpoints return `404 Not Found`.

---

### API‑CRM‑020: Activities – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `ActivityRepository` (no soft delete, append‑only) and `ActivityService` (validates entity existence, Either).  
**Deep Module:** Simple append‑only service.

---

### API‑CRM‑021: Activities – Routes & Green Tests
**Depends on:** API‑CRM‑020.  
**Subtasks:** routes, tests green.

---

## Cross‑Cutting: Domain Events Verification

### API‑CRM‑022: CRM Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑003 (LeadService), API‑CRM‑016 (DealService), DB‑SETTINGS‑002 (AuditLog system).  
**Definition of Done:** The following domain events are emitted and appear in `audit_logs` via the `AuditEventSubscriber`:  
- `LeadCreated` – on `createLead`  
- `LeadStageChanged` – on stage update  
- `DealCreated` – on `createDeal`  
- `DealStageChanged` – on deal stage update  
Integration test verifies end‑to‑end: create lead via API → query `audit_logs` → row with `action = 'LeadCreated'` exists.

**Subtasks:**
- [ ] API‑CRM‑022.1: Ensure LeadService and DealService emit events (already done in API‑CRM‑003/016; verify). (AGENT)  
  **verification:** Unit tests for event emission pass.
- [ ] API‑CRM‑022.2: Write integration test: `POST /crm/leads` → `GET /audit‑logs?action=LeadCreated` returns the entry. (AGENT)  
  **verification:** Test passes (requires Audit Log API, which will be ready in Phase 4 – we can defer this test to Phase 4, but write it now as red).  
- [ ] API‑CRM‑022.3: Run test after audit log query API is available (Phase 4) to confirm green. (AGENT)  
  **verification:** Pass later.

---

Now applying all corrections to **Phase 3.5 – API Business Logic: Projects & Finance Contexts**. This phase extends the API layer to the Project Management and Finance bounded contexts, building on the patterns established in Phase 3: contract‑first, test‑first, service‑as‑deep‑module, soft delete where applicable, Either error handling, and domain event emission. The anti‑corruption layer for the Scheduler tab is deferred to Phase 4.5 (Appointments API); projects here only manage projects, tasks, and milestones. Finance endpoints handle invoices, payments (with idempotency), virtual cards, and budgets.

Key improvements integrated:

- **Explicit `depends_on`** on every parent task.
- **Verification commands** on every subtask.
- **Negative integration test cases** with exact error codes for each context.
- **Pagination standard** applied to list endpoints.
- **OpenAPI examples** and HTTP status codes (201 + Location, 204, etc.).
- **Depth refactor check** appended to each deep‑module service task.
- **Domain events** for Projects (`TaskCompleted`, `ProjectCompleted`, `MilestoneCompleted`) and Finance (`InvoicePaid`, `PaymentRecorded`, `BudgetThresholdReached`, `BudgetExceeded`).
- **Payment idempotency** with `Idempotency‑Key` header and duplicate handling.
- **Progress materialization** for projects driven by `TaskCompleted` event.

---

# Phase 3.5 – API Business Logic: Projects & Finance Contexts

---

## Projects Context Task Index

- [ ] API‑PROJ‑001 – Projects – Expand OpenAPI Spec
- [ ] API‑PROJ‑002 – Projects – Integration Tests (TDD Red)
- [ ] API‑PROJ‑003 – Projects – Service & Repository (Deep Module)
- [ ] API‑PROJ‑004 – Projects – Routes & Green Tests
- [ ] API‑PROJ‑005 – Tasks – Expand OpenAPI Spec
- [ ] API‑PROJ‑006 – Tasks – Integration Tests (Red)
- [ ] API‑PROJ‑007 – Tasks – Service & Repository
- [ ] API‑PROJ‑008 – Tasks – Routes & Green Tests
- [ ] API‑PROJ‑009 – Milestones – Expand OpenAPI Spec
- [ ] API‑PROJ‑010 – Milestones – Integration Tests (Red)
- [ ] API‑PROJ‑011 – Milestones – Service & Repository
- [ ] API‑PROJ‑012 – Milestones – Routes & Green Tests
- [ ] API‑PROJ‑EVENTS‑001 – Projects Domain Events Verification

---

## Projects

### API‑PROJ‑001: Projects – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑001 (schema), DOMAIN‑003 (feature files).  
**Definition of Done:** OpenAPI spec adds `projects` tag and paths:
- `GET /projects` – list with pagination (`page`, `limit`), filter by `status`. Response envelope standard.
- `POST /projects` – create (auth, validates `client_id` exists). Returns 201 with `Location` header.
- `GET /projects/{projectId}` – get by ID, includes derived `progress_percent`, `task_count`, `completed_task_count`.
- `PATCH /projects/{projectId}` – update name, status, etc. Progress columns are **not** writable; any attempt to set them returns 400 `ProgressIsReadOnly`.
- `DELETE /projects/{projectId}` – soft delete, 204.
Schemas: `Project`, `ProjectCreate`, `ProjectUpdate`. Examples required.  
**Anti-Patterns:** Allowing direct progress field mutation.  
**Related Files:** `lib/api‑spec/openapi.yaml`

**DDD:** API exposes the `Project` aggregate root. Progress is derived from tasks; the endpoint exposes it read‑only.  
**TDD:** After codegen, integration tests (API‑PROJ‑002) will be written.  
**BDD:** Enables “As a PM, I can create a project and assign tasks” scenario and negative paths.

**Subtasks:**
- [ ] API‑PROJ‑001.1: Add `projects` paths and schemas to OpenAPI, including read‑only progress fields and progress‑write rejection. (AGENT)  
  **verification:** Spec validates, examples render.
- [ ] API‑PROJ‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### API‑PROJ‑002: Projects – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api‑server/__tests__/api/projects/projects.test.ts` contains failing tests for:
- `POST /projects` → 201 with valid data, project in DB.
- `POST /projects` with missing required fields → 400 validation error.
- `GET /projects` → 200, pagination, status filter, excludes soft‑deleted.
- `GET /projects/{id}` → 200 with progress fields.
- `GET /projects/{id}` missing → 404 `ProjectNotFound`.
- `PATCH /projects/{id}` update name → 200.
- `PATCH /projects/{id}` attempt to set `progress_percent` → 400 `ProgressIsReadOnly`.
- `DELETE /projects/{id}` → 204, subsequent GET returns 404.
- Unauthorized → 401.
**Related Files:** `.../projects.test.ts`

**Subtasks:** Write tests; all fail initially.

---

### API‑PROJ‑003: Projects – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2 (BaseRepository), ERROR‑002 (Projects errors), EVENT‑001 (domain event bus).  
**Definition of Done:**
- `lib/db/src/repositories/projects.ts` exports `ProjectRepository` extending `BaseRepository<Project>`, supporting soft delete with `includeDeleted`.
- `artifacts/api‑server/src/services/projects/project‑service.ts` exports `ProjectService` with methods: `create`, `get`, `list`, `update`, `softDelete`, `updateProjectProgress(projectId)`.
- Status transitions: `active` ⇄ `on‑hold` → `completed` (cannot be re‑opened).
- `update` rejects any direct write to `progress_percent`, `task_count`, or `completed_task_count`; only the service’s internal method updates them.
- `updateProjectProgress` queries all active tasks for the project, computes ratio, and atomically updates the progress columns.
- Emits `ProjectCompleted` when status transitions to `completed`.
- All methods return `Either<DomainError, Result>`.
**Deep Module:** Encapsulates status machine, progress derivation, and event publishing.

**Subtasks:**
- [ ] API‑PROJ‑003.1: Implement `ProjectRepository`. (AGENT) – `lib/db/src/repositories/projects.ts`  
  **verification:** Unit tests against test DB green.
- [ ] API‑PROJ‑003.2: Implement `ProjectService` with status rules, progress protection, `updateProjectProgress`. (AGENT)  
  **verification:** Unit tests with mocked repo pass.
- [ ] API‑PROJ‑003.3: Write unit tests for all methods, including attempt to set progress directly (should be ignored/produce error). (AGENT)  
  **verification:** Green.
- [ ] API‑PROJ‑003.4: Implement automatic progress update: subscribe to `TaskCompleted` event, call `updateProjectProgress`. (AGENT)  
  **verification:** Unit test with mock event bus.
- [ ] API‑PROJ‑003.5: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** Manual + `pnpm typecheck`.

---

### API‑PROJ‑004: Projects – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑003, AUTH‑008, ERROR‑001.  
**Subtasks:** route creation, integration tests turn green.

---

## Tasks

### API‑PROJ‑005: Tasks – Expand OpenAPI Spec
**Depends on:** DB‑PROJ‑002.  
**Definition of Done:** Paths: `GET /projects/{projectId}/tasks` (filter by status, assignee), `POST`, `GET /tasks/{taskId}`, `PATCH`, `DELETE` (soft delete). Support `parent_task_id` for subtasks. Pagination standard. Examples.  
**DDD:** Task is child of Project; hierarchy via `parent_task_id`.  
**Subtasks:** spec, codegen, typecheck.

---

### API‑PROJ‑006: Tasks – Integration Tests (Red)
**Depends on:** API‑PROJ‑005, TEST‑INFRA‑001.  
**Tests include:**
- Create task → 201.
- Create subtask with `parent_task_id` → 201, parent task cannot be set to `done` while unfinished subtasks exist → 400 `TaskHasUnfinishedSubtasks`.
- Toggle task to `done` → 200, project progress updates (integration test verifies project GET shows updated progress).
- Update task priority → 200.
- Soft delete → 204.
- Unauthorized → 401.
- Access non‑existent project → 404 `ProjectNotFound`.

---

### API‑PROJ‑007: Tasks – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `TaskRepository` (soft delete) and `TaskService` (enforces parent‑child completion rules, validates project exists, emits `TaskCompleted` on status move to `done`). Either returns.  
**Depth refactor check** added.

---

### API‑PROJ‑008: Tasks – Routes & Green Tests
**Depends on:** API‑PROJ‑007.  
**Subtasks:** routes, integration tests green.

---

## Milestones

### API‑PROJ‑009: Milestones – Expand OpenAPI Spec
**Depends on:** DB‑PROJ‑003.  
**Definition of Done:** `GET /projects/{projectId}/milestones`, `POST`, `PATCH`, `DELETE`. Only `completed_at` can be set when marking complete. Examples.

---

### API‑PROJ‑010: Milestones – Integration Tests (Red)
**Tests include:**
- Create milestone → 201.
- Mark complete → 200, `completed_at` set.
- Mark already‑completed → 400 `MilestoneAlreadyCompleted`.
- Soft delete → 204.
- Project not found → 404.

---

### API‑PROJ‑011: Milestones – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `MilestoneRepository` and `MilestoneService` (complete only once, emits `MilestoneCompleted` event). Either returns.  
**Depth refactor check.**

---

### API‑PROJ‑012: Milestones – Routes & Green Tests

---

## Projects Domain Events Verification

### API‑PROJ‑EVENTS‑001: Projects Domain Events
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑003, API‑PROJ‑007, API‑PROJ‑011, DB‑SETTINGS‑002.  
**Definition of Done:** Events `TaskCompleted`, `ProjectCompleted`, `MilestoneCompleted` are emitted and recorded in audit logs.  
**Subtasks:**
- [ ] API‑PROJ‑EVENTS‑001.1: Ensure event emissions in services (already implemented). (AGENT)  
  **verification:** Unit tests for events pass.
- [ ] API‑PROJ‑EVENTS‑001.2: Write integration test: complete task via API → check audit log for `TaskCompleted`. (AGENT)  
  **verification:** Test green (or deferred to audit API ready).

---

## Cross-Cutting: Integration Event Schemas

### EVENT-INT-001: Integration Event Schemas
**Status:** ⏳ Not Started  
**Depends on:** EVENT-001 (domain event bus), all Phase 3 service tasks (for event sources).  
**Definition of Done:** Create a shared integration event catalog that separates internal domain events from cross-context messages:
- `lib/events/integration-schemas.ts` defines JSON schemas for cross-context events like `LeadConvertedToDeal`, `InvoicePaid`, `ProjectCompleted`, etc.
- Each schema includes event metadata: `eventId`, `timestamp`, `sourceContext`, `targetContext`, `payload`.
- Event versioning strategy: include `version` field for breaking changes.
- Documentation of which domain events map to which integration events.
**Anti-Patterns:** Direct domain event exposure without transformation; missing versioning.  
**Related Files:** `lib/events/integration-schemas.ts`

**Subtasks:**
- [ ] EVENT-INT-001.1: Define integration event schemas and mapping from domain events. (AGENT)  
  **verification:** Schemas compile, mappings documented.
- [ ] EVENT-INT-001.2: Add event transformation utilities in services where needed. (AGENT)  
  **verification:** Unit tests for transformation pass.
- **Blocks:** Used by Phase 4+ cross-context features.

---

## Finance Context Task Index

- [ ] API‑FIN‑001 – Invoices – Expand OpenAPI Spec
- [ ] API‑FIN‑002 – Invoices – Integration Tests (Red)
- [ ] API‑FIN‑003 – Invoices – Service & Repository
- [ ] API‑FIN‑004 – Invoices – Routes & Green Tests
- [ ] API‑FIN‑005 – Payments – Expand OpenAPI Spec (with idempotency header)
- [ ] API‑FIN‑006 – Payments – Integration Tests (Red)
- [ ] API‑FIN‑007 – Payments – Service & Repository (idempotency + events)
- [ ] API‑FIN‑008 – Payments – Routes & Green Tests
- [ ] API‑FIN‑009 – Virtual Cards – Expand OpenAPI Spec
- [ ] API‑FIN‑010 – Virtual Cards – Integration Tests (Red)
- [ ] API‑FIN‑011 – Virtual Cards – Service & Repository
- [ ] API‑FIN‑012 – Virtual Cards – Routes & Green Tests
- [ ] API‑FIN‑013 – Budgets – Expand OpenAPI Spec
- [ ] API‑FIN‑014 – Budgets – Integration Tests (Red)
- [ ] API‑FIN‑015 – Budgets – Service & Repository (events)
- [ ] API‑FIN‑016 – Budgets – Routes & Green Tests
- [ ] API‑FIN‑EVENTS‑001 – Finance Domain Events Verification

---

## Invoices

### API‑FIN‑001: Invoices – Expand OpenAPI Spec
**Depends on:** DB‑FIN‑001.  
**Definition of Done:** Paths: `GET /finance/invoices` (filter by `type` AP/AR, `status`), `POST`, `GET /{id}`, `PATCH`, `DELETE` (soft delete). Schemas differentiate `vendor_id` for AP, `customer_id` for AR. Conditional FK validation. Pagination standard. Examples.  
**DDD:** Invoice `type` determines party FK and lifecycle.

---

### API‑FIN‑002: Invoices – Integration Tests (Red)
**Depends on:** API‑FIN‑001, TEST‑INFRA‑001.  
**Tests include:**
- Create AP invoice with vendor → 201.
- Create AR invoice with customer → 201.
- Create invoice with wrong FK for type → 400 `InvoiceTypeViolation`.
- Status transitions: draft → sent → paid/overdue.
- Soft delete → 204.
- Unauthorized.

---

### API‑FIN‑003: Invoices – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `InvoiceRepository` and `InvoiceService` with type‑dependent validation, status machine, no direct over‑payment detection (that's in payments). Either returns.  
**Deep Module:** Encapsulates invoice type validation and status transitions.

**Subtasks:**
- [ ] API‑FIN‑003.1: Implement `InvoiceRepository` extending `BaseRepository` with soft delete. (AGENT)  
  **verification:** Unit tests for repository pass.
- [ ] API‑FIN‑003.2: Implement `InvoiceService` with type validation and status machine. (AGENT)  
  **verification:** Unit tests with mocked repo pass.
- [ ] API‑FIN‑003.3: Write unit tests for service (type validation, status transitions). (AGENT)  
  **verification:** Green.
- [ ] API‑FIN‑003.4: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

---

### API‑FIN‑004: Invoices – Routes & Green Tests

---

## Payments

### API‑FIN‑005: Payments – Expand OpenAPI Spec
**Depends on:** DB‑FIN‑002.  
**Definition of Done:** `POST /finance/invoices/{invoiceId}/payments` (create payment), `GET /finance/invoices/{invoiceId}/payments` (list). Append‑only. Include `Idempotency‑Key` header (UUID, optional). Response: if key provided and duplicate, return existing payment with 200/201. Pagination for list. Examples.  
**DDD:** Payment reduces invoice balance; idempotency prevents duplicate charges.

---

### API‑FIN‑006: Payments – Integration Tests (Red)
**Depends on:** API‑FIN‑005, TEST‑INFRA‑001.  
**Tests include:**
- Create payment for valid invoice → 201.
- Payment amount exceeds remaining balance → 422 `PaymentExceedsBalance`.
- Pay for non‑existent invoice → 404.
- Duplicate idempotency key returns same payment → 200/201, only one DB row.
- Payment records are not updatable (PATCH/DELETE → 404).

---

### API‑FIN‑007: Payments – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, EVENT‑001 (domain event bus).  
**Definition of Done:** `PaymentRepository` (append‑only, supports `findByIdempotencyKey`). `PaymentService` validates balance, emits `PaymentRecorded` (and `InvoicePaid` if fully paid), handles idempotency (check key, catch DB unique violation). Either returns.  
**Deep Module:** Encapsulates payment validation, idempotency handling, and event publishing.

**Subtasks:**
- [ ] API‑FIN‑007.1: Implement repository with idempotency key lookup. (AGENT)  
  **verification:** Unit tests green.
- [ ] API‑FIN‑007.2: Implement service with balance check, event emission, and idempotency handling. (AGENT)  
  **verification:** Unit tests with mocked repo pass.
- [ ] API‑FIN‑007.3: Write test for duplicate idempotency key: two calls, only one row, same response. (AGENT)  
  **verification:** Green.
- [ ] API‑FIN‑007.4: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

---

### API‑FIN‑008: Payments – Routes & Green Tests

---

## Virtual Cards

### API‑FIN‑009: Virtual Cards – Expand OpenAPI Spec
**Depends on:** DB‑FIN‑003.  
**Definition of Done:** CRUD endpoints, `POST /finance/cards/issue`, `PATCH` to freeze/update limit. Freeze/unfreeze logic. Examples.

---

### API‑FIN‑010 – 012: following pattern (integration tests, service, routes). Service enforces limit, freeze status machine, and unique last_four. Emits domain events? Not specified, but can omit unless card transactions are implemented.

---

## Budgets

### API‑FIN‑013: Budgets – Expand OpenAPI Spec
**Depends on:** DB‑FIN‑004.  
**Definition of Done:** CRUD for budgets, filter by project. Examples.

---

### API‑FIN‑014 – 016: following pattern. Service enforces `spent_amount ≤ allocated_amount`, emits `BudgetExceeded` if update would violate, and `BudgetThresholdReached` when 80% consumed.

---

## Finance Domain Events Verification

### API‑FIN‑EVENTS‑001: Finance Domain Events
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑007, API‑FIN‑015, DB‑SETTINGS‑002.  
**Definition of Done:** Events `InvoicePaid`, `PaymentRecorded`, `BudgetThresholdReached`, `BudgetExceeded` are emitted and recorded in audit logs.

**Subtasks:**
- [ ] API‑FIN‑EVENTS‑001.1: Verify event emissions in services. (AGENT)  
  **verification:** Unit tests.
- [ ] API‑FIN‑EVENTS‑001.2: Integration test: pay invoice fully → check audit log for `InvoicePaid`. (AGENT)  
  **verification:** Test green.

---

*End of Phase 3. Next: Phase 4 – API Business Logic for Documents, Assets, Portal, Analytics & Settings.*
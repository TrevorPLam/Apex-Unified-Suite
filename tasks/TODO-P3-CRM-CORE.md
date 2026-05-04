# TODO-P3-CRM-CORE.md – Phase 3: CRM Core CRUD

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete CRM context Core CRUD operations – Leads, Contacts, Companies, Deals, and Activities. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## CRM – Core CRUD

### API‑CRM‑001: Leads – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑001 (schema must exist for types), DOMAIN‑003 (feature file defines scenarios).  
**Definition of Done:** OpenAPI spec extends with `crm` tag and paths:  
- `GET /crm/leads` – list with pagination (`page`, `limit`), search (`search`), filter (`stage`). **Pagination standard**: default `limit=20`, max `limit=100`, response envelope `{ data: Lead[], meta: { page, limit, total, totalPages } }`.  
- `POST /crm/leads` – create (auth required). Returns `201 Created`, `Location` header pointing to the new resource. Response body `{ data: Lead }`.  
- `GET /crm/leads/{leadId}` – get by ID.  
- `PATCH /crm/leads/{leadId}` – update stage and fields.  
- `DELETE /crm/leads/{leadId}` – soft delete. Returns `204 No Content`.  
- **Modification:** Lead schema includes `converted_at`, `converted_to_type`, `converted_to_id` (nullable) to reflect conversion state.  
All operations have request/response schemas (`Lead`, `LeadCreate`, `LeadUpdate`).  
**Examples:** Every endpoint must include at least one example request and response in the spec.  
**Anti-Patterns:** Missing pagination params; ad‑hoc query strings.  
**Related Files:** `lib/api‑spec/openapi.yaml`

**DDD:** The Lead API exposes the CRM bounded context's lead aggregate. Operations align with domain actions.  
**TDD (Spec):** After codegen, we'll write failing integration tests (API‑CRM‑002) that verify the contract. This is a specification task, not implementation.  
**BDD:** This spec enables the "Sales rep can manage leads" scenario and its negative counterparts.  
**Deep Module:** The API spec is the public interface; the LeadService underneath will be a deep module.

### Subtasks:
- [ ] API‑CRM‑001.1: Add `crm` tag and lead schemas (`Lead`, `LeadCreate`, `LeadUpdate`) including conversion columns to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec contains paths with correct operationIds.
- [ ] API‑CRM‑001.2: Define list endpoint with pagination, search, filter params and standard envelope. (AGENT)  
  **verification:** Generated client returns typed pagination meta.
- [ ] API‑CRM‑001.3: Define create/update/delete endpoints with auth requirement and soft delete response (204). (AGENT)  
  **verification:** Spec shows `204` for delete.
- [ ] API‑CRM‑001.4: Add example request/response bodies to every operation. (AGENT)  
  **verification:** Swagger UI renders examples.
- [ ] API‑CRM‑001.5: Run `pnpm codegen` to regenerate client (React Query hooks) and Zod schemas. (HUMAN)  
  **verification:** `pnpm typecheck` passes.
- [ ] API‑CRM‑001.6: Run `pnpm typecheck` and inspect generated Zod files for Orval's `_type` issue; fix if needed. (AGENT)  
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
- **New:** `PATCH` on a converted lead (converted_at not null) should return 400 `InvalidStageTransition` or a specific `LeadAlreadyConverted` error.  
**Related Files:** `artifacts/api‑server/__tests__/api/crm/leads.test.ts`

**DDD:** Tests verify that the Lead aggregate lifecycle and rules are enforced.  
**TDD:** Write tests first; they will all fail because no routes exist. **Order Note:** Integration tests (API‑CRM‑002) should be written before service implementation (API‑CRM‑003) to follow TDD red-green-refactor.  
**BDD:** The "Move lead through stages" and "Invalid stage jump" scenarios are directly covered.  
**Deep Module:** Tests call only the HTTP API, treating the backend as a deep module.  

**Missing Event Emission Test:** Add test to verify `LeadCreated` event is emitted on successful lead creation and contains correct payload data.

### Subtasks:
- [ ] API‑CRM‑002.1: Set up test database and configuration using `beforeAll` hooks from TEST‑INFRA‑001. (AGENT)  
  **verification:** Test harness runs without errors.
- [ ] API‑CRM‑002.2: Write test for `POST /crm/leads` (happy path + invalid stage). (AGENT)  
  **verification:** Tests fail with 404 (no route).
- [ ] API‑CRM‑002.3: Write test for `GET /crm/leads` (pagination, stage filter, soft delete exclusion). (AGENT)  
  **verification:** Red.
- [ ] API‑CRM‑002.4: Write tests for `GET /{id}`, `PATCH`, `DELETE` (soft delete), including negative: attempt to update soft‑deleted lead, attempt to update converted lead. (AGENT)  
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
- `artifacts/api-server/src/services/crm/lead-service.ts` exports `LeadService` with methods: `createLead(dto)`, `getLead(id)`, `listLeads(params)`, `updateLead(id, dto)`, `deleteLead(id)`.  
- Service enforces stage transitions (new → contacted → qualified → lost) and validates `assigned_to` exists.  
- **Conversion support:** The service must allow a lead to be marked as "converted" – it sets `converted_at` timestamp and related ID fields. Once converted, no further stage changes are allowed (except perhaps a "reopen" operation). The service returns `LeadConversionFailed` if an attempt is made to modify a converted lead.  
- All service methods return `Result<T, DomainError>` using `neverthrow`.  
- Emit `LeadCreated` domain event in `createLead`.  
**Anti-Patterns:** Business logic in route handlers; exposing raw SQL.  
**Related Files:** `lib/db/src/repositories/crm/leads.ts`, `artifacts/api-server/src/services/crm/lead-service.ts`

**DDD:** The `LeadService` is the entry point into the CRM context. Stage machine and soft delete are domain rules. **Inconsistent Deep Module Labeling:** This is actually a deep module service, not shallow - it encapsulates complex business logic.  
**TDD:** Write unit tests for `LeadService` with a mocked repository – verify stage transitions, soft delete behavior, Result<T, DomainError> return types, and event emission. Write unit tests for `LeadRepository` against a test database – verify soft delete filtering, `includeDeleted`, CRUD. **Missing Event Emission Test:** Add test case to verify domain event emission with correct payload structure.  
**BDD:** The service encapsulates "move lead through stages" workflow.  
**Deep Module:** The service interface is simple (5 methods) while hiding stage machine logic, validation, soft delete filtering, and persistence. **Event Taxonomy Distinction:** Distinguish between domain events (`LeadCreated`, `LeadStageChanged`) and system events.  

**DoD Boundary Overlap:** Some validation logic overlaps with API‑CRM‑004 routes layer - clarify separation of concerns.  
**DoD Missing Negative Cases:** Add tests for invalid stage transitions, duplicate email handling, and conversion lock scenarios.  
**Subtask Verification:** Replace descriptive verification with executable test commands.  
**Depth refactor check:** After implementation, verify public methods ≤ 5, service encapsulates at least three non‑trivial concerns (e.g., validation, persistence, event publication) behind ≤5 public methods.

### Subtasks:
- [ ] API‑CRM‑003.1: Implement `LeadRepository` extending `BaseRepository` with soft delete support and `includeDeleted` option. (AGENT) – `lib/db/src/repositories/crm/leads.ts`  
  **verification:** Unit test for repository against test DB passes.
- [ ] API‑CRM‑003.2: Write unit tests for `LeadRepository` (soft delete filter, `includeDeleted`, CRUD). (AGENT)  
  **verification:** Green.
- [ ] API‑CRM‑003.3: Implement `LeadService` with stage machine, conversion guard (can't change stage after conversion), Result<T, DomainError> returns, and event emission. (AGENT) – `artifacts/api-server/src/services/crm/lead-service.ts`  
  **verification:** Unit tests for service (with mocked repo) pass.
- [ ] API‑CRM‑003.4: Write unit tests for `LeadService` (success + failure paths, stage transition rules, event emission, conversion lock). (AGENT)  
  **verification:** Green.
- [ ] API‑CRM‑003.5: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** `grep -c "export.*function\|export.*class\|export.*async" artifacts/api-server/src/services/crm/lead-service.ts | grep -E "^[1-5]$" && grep -q "throw\|Throw" artifacts/api-server/src/services/crm/lead-service.ts || echo "No throws found" && pnpm typecheck`.
- **Blocks:** API‑CRM‑004.

---

### API‑CRM‑004: Leads – Routes & Validation
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑003 (service), AUTH‑008 (auth middleware), ERROR‑001 (global error handler).  
**Definition of Done:** `artifacts/api-server/src/routes/crm/leads.ts` wires endpoints to `LeadService`, using the generic validation middleware (from AUTH‑006.1) with generated Zod schemas, and auth middleware. Errors from the service's Either results are mapped to HTTP responses by the global error handler.  
**Related Files:** `artifacts/api-server/src/routes/crm/leads.ts`

**DDD:** Routes are thin adapters; they translate HTTP ↔ domain service calls. No domain logic lives here.  
**TDD:** The integration tests from API‑CRM‑002 will drive this; a separate middleware test validates that Zod rejection returns 400.  
**BDD:** Same scenarios as integration tests.  
**Deep Module:** The route layer is intentionally shallow.

### Subtasks:
- [ ] API‑CRM‑004.1: Create lead routes module with validation middleware and auth, using `catchAsync` for error propagation. (AGENT) – `routes/crm/leads.ts`  
  **verification:** Route tests with supertest and mocked service pass.
- [ ] API‑CRM‑004.2: Add lead routes to main router under `/api/crm`. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- **Blocks:** API‑CRM‑005.

---

### API‑CRM‑005: Leads – Run Integration Tests to Green
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑004, TEST‑INFRA‑001 (test server), DB‑MIGRATE‑ALL.  
**Definition of Done:** All tests from API‑CRM‑002 pass. Edge cases added: invalid stage transition, attempt to update a soft‑deleted lead, pagination boundary, attempt to update converted lead (should fail with appropriate error).  
**Related Files:** `artifacts/api-server/__tests__/api/crm/leads.test.ts`

**DDD:** Green tests confirm the Lead aggregate is correctly exposed and domain rules are enforced end‑to‑end.  
**TDD:** Green phase – implement minimal fixes until all tests pass, then refactor.  
**BDD:** Tests validate both happy and error scenarios.  
**Deep Module:** The full stack is verified only through the public API, preserving encapsulation.

### Subtasks:
- [ ] API‑CRM‑005.1: Run test suite, fix failures. (AGENT)  
  **verification:** `pnpm test -- leads.test.ts --reporter=verbose` all green.  
- [ ] API‑CRM‑005.2: Add edge‑case tests (invalid transition, soft‑deleted access, pagination boundary, converted lead update). (AGENT)  
  **verification:** `pnpm test -- leads.test.ts --grep="edge case"` all green.  
- [ ] API‑CRM‑005.3: All tests pass. (AGENT)  
  **verification:** `pnpm test -- leads.test.ts` final green check with coverage report.

---

### API‑CRM‑006: Contacts – Expand OpenAPI Spec (with Assignment/Visibility)
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑002, API‑CRM‑001 (pattern established).  
**Definition of Done:** Add `contacts` paths to OpenAPI: `GET /crm/contacts` (list + search, pagination standard, filter by `assigned_to`, `team_id`, `visibility`), `POST`, `GET /{id}`, `PATCH` (including `assigned_to`, `visibility`), `DELETE` (soft delete → 204). Schemas `Contact`, `ContactCreate`, `ContactUpdate` must include `assigned_to`, `team_id`, `visibility`. Examples included.

**DDD:** Contacts now support ownership and visibility fields per CRM‑DOM‑003.  
**TDD:** After codegen, integration tests will use these fields.

### Subtasks:
- [ ] API‑CRM‑006.1: Add contacts paths with ownership/visibility schemas. (AGENT)  
  **verification:** Codegen produces correct types.
- [ ] API‑CRM‑006.2: Run codegen and typecheck. (HUMAN/AGENT)  
  **verification:** No errors.
- **Blocks:** API‑CRM‑007.

---

### API‑CRM‑007: Contacts – Integration Tests (Red)
**Depends on:** API‑CRM‑006, TEST‑INFRA‑001.  
**Subtasks:** write tests for create (with company), list (filter by assigned owner), get, update (ownership change), delete, unauthorized.

---

### API‑CRM‑008: Contacts – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, BaseRepository.  
**Definition of Done:** `ContactRepository` (extending BaseRepository, soft delete with `includeDeleted`) and `ContactService` (enforces unique email per organization, either). Service also handles assignment and visibility changes, emitting events.  
**DDD Inconsistency:** Aggregate/Event descriptions should clearly distinguish Contact aggregate boundaries and event types.  
**Deep Module:** Service hides deduplication and query logic.  
**Depth refactor check:** After implementation, verify service methods ≤ 5, encapsulates multiple concerns behind simple interface.  

**Out of Scope:** Contact ownership transfer workflows, bulk contact operations, contact synchronization with external systems.

### Subtasks:
- [ ] API‑CRM‑008.1: Implement repository with soft delete support. (AGENT) – `lib/db/src/repositories/crm/contacts.ts`  
  **verification:** Unit tests for repository pass: `pnpm test -- contacts.repository.test.ts`.
- [ ] API‑CRM‑008.2: Implement service with ownership handling and event emission. (AGENT) – `artifacts/api-server/src/services/crm/contact-service.ts`  
  **verification:** Unit tests for service pass: `pnpm test -- contact-service.test.ts`.
- [ ] API‑CRM‑008.3: Write unit tests covering all service methods and edge cases. (AGENT) – `artifacts/api-server/src/services/crm/__tests__/contact-service.test.ts`  
  **verification:** Test coverage ≥ 90%: `pnpm test -- coverage -- contact-service.test.ts`.
- [ ] API‑CRM‑008.4: Depth refactor check - verify method count and encapsulation. (AGENT)  
  **verification:** Service has ≤5 methods and encapsulates multiple concerns: `grep -c "export.*method\|export.*function" contact-service.ts | grep -E "^[1-5]$` && pnpm typecheck`.

---

### API‑CRM‑009: Contacts – Routes & Green Tests
**Depends on:** API‑CRM‑008, AUTH‑008, ERROR‑001.  
**Definition of Done:** Routes wired, integration tests green.  
**Subtasks:** create routes, run tests to green.

---

### API‑CRM‑010: Companies – Expand OpenAPI Spec (with Assignment/Visibility)
**Depends on:** DB‑CRM‑003.  
**Definition of Done:** Companies paths: `GET /crm/companies`, `POST`, `GET /{id}`, `PATCH` (including `assigned_to`, `visibility`), `DELETE` (soft delete). Schema includes `settings` JSONB and new fields. Examples, pagination standard.  
**Subtasks:** spec, codegen.

---

### API‑CRM‑011: Companies – Integration Tests (Red)
**Depends on:** API‑CRM‑010, TEST‑INFRA‑001.  
**Subtasks:** write tests for CRUD, unique domain conflict, soft delete, unauthorized, ownership/visibility changes.

---

### API‑CRM‑012: Companies – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `CompanyRepository` (soft delete, GIN index awareness) and `CompanyService` (unique domain per organization, either). Service also manages ownership.  
**DDD Inconsistency:** Aggregate/Event descriptions should clearly specify Company aggregate boundaries and relationship to other entities.  
**Deep Module:** JSONB details hidden.  
**Depth refactor check:** After implementation, verify service encapsulates company settings management and domain validation behind simple interface.  

**Out of Scope:** Company hierarchy management, bulk company operations, CRM data synchronization.

### Subtasks:
- [ ] API‑CRM‑012.1: Implement repository with soft delete support. (AGENT) – `lib/db/src/repositories/crm/companies.ts`  
  **verification:** Unit tests for repository pass: `pnpm test -- companies.repository.test.ts`.
- [ ] API‑CRM‑012.2: Implement service with ownership handling and event emission. (AGENT) – `artifacts/api-server/src/services/crm/company-service.ts`  
  **verification:** Unit tests for service pass: `pnpm test -- company-service.test.ts`.
- [ ] API‑CRM‑012.3: Write unit tests covering all service methods and edge cases. (AGENT) – `artifacts/api-server/src/services/crm/__tests__/company-service.test.ts`  
  **verification:** Test coverage ≥ 90%: `pnpm test -- coverage -- company-service.test.ts`.
- [ ] API‑CRM‑012.4: Depth refactor check - verify method count and encapsulation. (AGENT)  
  **verification:** Service has ≤5 methods and encapsulates multiple concerns: `grep -c "export.*method\|export.*function" company-service.ts | grep -E "^[1-5]$` && pnpm typecheck`.

---

### API‑CRM‑013: Companies – Routes & Green Tests
**Depends on:** API‑CRM‑012, AUTH‑008.  
**Definition of Done:** Routes wired, integration tests green.  
**Subtasks:** create routes, run tests to green.

---

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
**Definition of Done:** `DealRepository` and `DealService` with pipeline rules (prospecting → qualification → … closed‑won/lost), probability constraints, either, event emission (`DealCreated`, `DealStageChanged`). Unit tested.  
**DDD Inconsistency:** Aggregate/Event descriptions should clearly define Deal aggregate lifecycle and event taxonomy.  
**Deep Module:** Encapsulates deal pipeline logic.  
**Depth refactor check:** After implementation, verify pipeline logic is encapsulated behind simple service interface.  

**Out of Scope:** Deal forecasting, advanced pipeline analytics, deal splitting/merging.

---

### API‑CRM‑017: Deals – Routes & Green Tests
**Depends on:** API‑CRM‑016.  
**Subtasks:** routes, integration tests green.

---

### API‑CRM‑018: Activities – Expand OpenAPI Spec (Added Activity Types)
**Depends on:** DB‑CRM‑005.  
**Definition of Done:** Activity endpoints: `GET /crm/activities?entityType=lead&entityId=...` (list, filter by the expanded list of types), `POST /crm/activities` (create note/email/call/stage_change/assignment_change etc.). Append‑only – no update or delete endpoints.  
**Subtasks:** spec, codegen.

---

### API‑CRM‑019: Activities – Integration Tests
**Depends on:** API‑CRM‑018, TEST‑INFRA‑001.  
**Subtasks:** tests for list by entity, create activity with new types, verify update/delete endpoints return `404 Not Found`.

---

### API‑CRM‑020: Activities – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `ActivityRepository` (no soft delete, append‑only) and `ActivityService` (validates entity existence, either).  
**DDD Inconsistency:** Aggregate/Event descriptions should clarify Activity as a value object or entity within other aggregates.  
**Deep Module:** Simple append‑only service.  
**Depth refactor check:** After implementation, verify service maintains simplicity while handling multiple activity types.  

**Out of Scope:** Activity editing/deletion, activity analytics, bulk activity operations.

---

### API‑CRM‑021: Activities – Routes & Green Tests
**Depends on:** API‑CRM‑020.  
**Subtasks:** routes, tests green.

---

### API‑CRM‑036: Site & Event Tracking – Client‑Side Snippet & Backend
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑* (contact identification)  
**Why added:** ActiveCampaign's JavaScript snippet tracks page visits and events, feeding into scoring and automations. This is a prerequisite for meaningful scoring/automation.  
**Definition of Done:**
- A lightweight JS snippet that can be embedded on external websites, which sends anonymous page views with a `tracking_id`.  
- Backend endpoints: `POST /api/v1/tracking/pageview` and `POST /api/v1/tracking/event` with a cookie‑based `tracking_id`.  
- When the contact is later identified (via form or email click), the tracking data is linked to the contact record.  
- Integration with scoring engine (API‑CRM‑034).  
**BDD:** "When a contact visits the pricing page, their site tracking record is updated and can be used to trigger an automation."  
**TDD:** Integration test verifying tracking data collection and contact linking.  
**Deep Module:** Encapsulates tracking data collection, anonymous identity management, and contact association.

**Advanced Code Patterns:**
- Lightweight JavaScript snippet with async loading
- Cookie-based anonymous tracking ID with localStorage fallback
- Event queue for batch sending to reduce API calls
- Contact identification bridge linking tracking to CRM

**Anti-Patterns:**
- Heavy tracking script impacting page performance
- No consent management for tracking
- Missing data retention controls
- Synchronous tracking calls blocking page load

**JavaScript Snippet Example:**
```javascript
// Minimal tracking snippet
(function() {
  var t = window.apex = window.apex || [];
  t.methods = ['page', 'event'];
  t.factory = function(e) { return function() { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
  for (var i = 0; i < t.methods.length; i++) {
    var e = t.methods[i];
    t[e] = t.factory(e);
  }
  t.load = function(apiKey) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.apex.com/t.js?id=' + apiKey;
    document.head.appendChild(script);
  };
})();
apex.load('YOUR_API_KEY');
apex.page('Pricing Page', { path: window.location.pathname });
```

**Subtasks:**
- [ ] API‑CRM‑036.1: Design lightweight tracking snippet with async loading. (AGENT) – `lib/tracking/snippet.js`
  **verification:** Snippet loads asynchronously; <5KB minified; no render blocking.
- [ ] API‑CRM‑036.2: Implement `POST /api/v1/tracking/pageview` endpoint. (AGENT) – `artifacts/api-server/src/routes/crm/tracking.ts`
  **verification:** Endpoint accepts pageview data; returns 204; cookie set with tracking_id.
- [ ] API‑CRM‑036.3: Implement `POST /api/v1/tracking/event` endpoint. (AGENT)
  **verification:** Custom events accepted with name and properties.
- [ ] API‑CRM‑036.4: Add cookie-based tracking ID generation and management. (AGENT)
  **verification:** Tracking ID persists across sessions; localStorage fallback works.
- [ ] API‑CRM‑036.5: Create tracking data storage schema. (AGENT) – `lib/db/src/migrations/tracking_events.sql`
  **verification:** Table stores pageviews and events with tracking_id; retention policy configured.
- [ ] API‑CRM‑036.6: Implement contact identification bridge. (AGENT) – `artifacts/api-server/src/services/crm/tracking-link-service.ts`
  **verification:** When contact identified, tracking data linked via tracking_id.
- [ ] API‑CRM‑036.7: Add event queue in snippet for batch sending. (AGENT)
  **verification:** Events queued and sent in batches; reduces API calls.
- [ ] API‑CRM‑036.8: Integrate tracking data with scoring engine. (AGENT)
  **verification:** Page visits and events contribute to contact score.
- [ ] API‑CRM‑036.9: Write integration tests for tracking workflow. (AGENT) – `artifacts/api-server/__tests__/api/crm/tracking.test.ts`
  **verification:** Tests cover pageview, event, and contact linking scenarios.

---

## Common CRM Core Sections

**Rules to Follow:**  
- All API endpoints must use generated Zod schemas for validation  
- Service methods must return Result<T, DomainError> using neverthrow  
- Domain events must be emitted for all state changes  
- Soft delete patterns must be consistent across entities  
- Tenant scoping must be enforced in all repository queries  

**Advanced Code Patterns:**  
- Repository pattern with BaseRepository inheritance  
- Service layer as deep modules with Result types  
- Domain event emission with structured payloads  
- Consistent error handling with domain-specific errors  

**Anti-Patterns:**  
- Business logic in route handlers  
- Direct database queries without repository abstraction  
- Throwing exceptions instead of using Result types  
- Missing tenant scoping in multi-tenant queries  
- Inconsistent error handling across services  

**Out of Scope:**  
- Advanced CRM analytics and reporting  
- Workflow automation beyond basic state changes  
- Real-time collaboration features  
- Mobile-specific optimizations

---

# TODO-P4-ASSETS.md – Phase 4 Assets Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Assets Context with CRUD operations, checkout/check-in functionality, and maintenance logging. All assets tasks follow the established CRUD/soft‑delete pattern. Check‑out/check‑in are append‑only log entries; service enforces that an asset must be available before checkout. Maintenance log is append‑only. Deep modules encapsulate status transitions and availability rules.

---

## Assets Context

*All assets tasks follow the established CRUD/soft‑delete pattern. Check‑out/check‑in are append‑only log entries; service enforces that an asset must be available before checkout. Maintenance log is append‑only. Deep modules encapsulate status transitions and availability rules.*

### [ ] API‑ASSETS‑001: Assets – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ASSETS‑001, DOMAIN‑003.  
**Definition of Done:** OpenAPI spec adds `assets` tag and paths with `/api/v1/` prefix:
- `GET /api/v1/assets` – list with pagination, filter by `status`, `category`, `location`. Response envelope standard.
- `POST /api/v1/assets` – create asset (auth required). Returns 201 with `Location` header.
- `GET /api/v1/assets/{assetId}` – get by ID, includes checkout and maintenance history summary.
- `PATCH /api/v1/assets/{assetId}` – update name, category, location, status.
- `DELETE /api/v1/assets/{assetId}` – soft delete, 204.
Schemas: `Asset`, `AssetCreate`, `AssetUpdate`. Examples required.

**Rules to Follow:**
- All endpoints must use `/api/v1/` prefix
- Response envelopes follow standard format
- Examples must be included for all endpoints
- Asset operations require authentication
- Soft delete for asset removal

**Advanced Code Patterns:**
- OpenAPI components for reusable schemas
- Proper HTTP status codes
- Pagination envelope pattern
- Location headers for creation

**Anti-Patterns:**
- Missing pagination limits
- Inconsistent error response formats
- Hardcoded values in schemas
- Missing authentication requirements

**Out of Scope:** Asset templates, bulk operations, advanced reporting.

**DDD:** API exposes the Asset aggregate; status transitions constrained by service.  
**TDD:** Write integration tests (API‑ASSETS‑002) before implementation. Tests must fail initially (red phase).  
**BDD:** Enables "As a manager, I can track and manage company assets" scenarios.  
**Deep Module:** The spec is the public interface; AssetService underneath is a deep module.

### Subtasks:
- [ ] API‑ASSETS‑001.1: Add assets paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; generated types correct.
- [ ] API‑ASSETS‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.
- [ ] API‑ASSETS‑001.3: Verify examples render correctly in Swagger UI. (AGENT)  
  **verification:** All examples display properly.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Spec validation required before codegen
- Type checking after code generation

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- OpenAPI specification design
- Component schema reuse
- Example generation

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Missing spec validation
- Skipping type checking

---

### [ ] API‑ASSETS‑002: Assets – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api‑server/__tests__/api/assets/assets.test.ts` contains failing tests for:
- `POST /assets` with valid payload → 201, asset in DB.
- `POST /assets` with duplicate serial number → 409 conflict.
- `GET /assets` → 200 with pagination, status filter, excludes soft‑deleted.
- `GET /assets/{id}` → 200 with checkout and maintenance summary.
- `GET /assets/{id}` missing → 404 `AssetNotFound`.
- `PATCH /assets/{id}` update location → 200.
- `DELETE /assets/{id}` → 204, subsequent GET returns 404.
- Unauthorized → 401.
**Related Files:** `.../assets.test.ts`

### Subtasks:
- [ ] API‑ASSETS‑002.1: Write all integration test cases. (AGENT) – `artifacts/api-server/__tests__/api/assets/assets.test.ts`  
  **verification:** Tests compile and run, all red (no routes exist).
- [ ] API‑ASSETS‑002.2: Verify test coverage includes negative cases. (AGENT)  
  **verification:** All error scenarios tested.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Negative test cases required
- Error scenarios must be tested

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Integration test design
- Error scenario testing
- Test coverage verification

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Missing negative test cases
- Incomplete error scenario testing

---

### [ ] API‑ASSETS‑003: Assets – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2 (BaseRepository), ERROR‑002.  
**Definition of Done:**
- `lib/db/src/repositories/assets.ts` exports `AssetRepository` extending `BaseRepository<Asset>`, supporting soft delete with `includeDeleted`.
- `artifacts/api‑server/src/services/assets/asset‑service.ts` exports `AssetService` with methods: `create`, `get`, `list`, `update`, `softDelete`.
- Service enforces unique serial number per organization, optimistic locking for concurrent updates, and status transition validation (e.g., cannot check out an asset already in maintenance without releasing it first).
- All methods return `Result<T, DomainError>`.
- Emits `AssetCreated`, `AssetUpdated` events.
**Deep Module:** Encapsulates status machine, availability rules, and event publishing.  
**Depth refactor check** required after implementation.

### Subtasks:
- [ ] API‑ASSETS‑003.1: Implement `AssetRepository` extending `BaseRepository` with soft delete. (AGENT) – `lib/db/src/repositories/assets.ts`  
  **verification:** Unit tests against test DB pass.
- [ ] API‑ASSETS‑003.2: Implement `AssetService` with status validation, optimistic locking, and event emission. (AGENT) – `artifacts/api-server/src/services/assets/asset-service.ts`  
  **verification:** Unit tests with mocked repo pass.
- [ ] API‑ASSETS‑003.3: Write unit tests for service (success + failure paths, status rules, duplicate serial). (AGENT)  
  **verification:** All tests green.
- [ ] API‑ASSETS‑003.4: Depth refactor check: method count ≤ 5, no `throw`, all returns Either. (AGENT)  
  **verification:** `grep` check + `pnpm typecheck`.
- **Blocks:** API‑ASSETS‑004.

---

### [ ] API‑ASSETS‑004: Assets – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑003, AUTH‑008, ERROR‑001.  
**Definition of Done:** Routes wired with auth and validation middleware. Integration tests from API‑ASSETS‑002 turn green.

### Subtasks:
- [ ] API‑ASSETS‑004.1: Create asset routes with validation and auth. (AGENT) – `routes/assets.ts`  
  **verification:** Route tests with mocked service pass.
- [ ] API‑ASSETS‑004.2: Add routes to main router. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- [ ] API‑ASSETS‑004.3: Run integration tests to green. (AGENT)  
  **verification:** All tests from API‑ASSETS‑002 pass.

---

### [ ] API‑ASSETS‑005: Check‑Out/In – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ASSETS‑002, API‑ASSETS‑004.  
**Definition of Done:** Checkout/checkin endpoints:
- `POST /api/v1/assets/{assetId}/checkout` – checkout asset to user. Body: `{ user_id }`. Validates asset is available. Returns 201.
- `POST /api/v1/assets/{assetId}/checkin` – checkin asset. Returns 200.
- `GET /api/v1/assets/{assetId}/checkout‑history` – paginated log of all checkout events.
**DDD:** Checkout events are append‑only; service enforces availability.

**Rules to Follow:**
- Asset availability must be validated before checkout
- Checkout events are append-only (no updates)
- Checkin requires valid checkout record
- History pagination required
- Event emission for state changes

**Advanced Code Patterns:**
- Append-only event logging
- Availability validation logic
- State transition enforcement
- Event-driven architecture

**Anti-Patterns:**
- Missing availability validation
- Allowing checkout of unavailable assets
- Missing event emission
- Direct state manipulation

**TDD:** Write integration tests before implementation. Tests must verify availability rules and event emission.  
**BDD:** Enables "As a user, I can check out available assets" scenarios.

### Subtasks:
- [ ] API‑ASSETS‑005.1: Add checkout/checkin paths to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑ASSETS‑005.2: Run codegen and typecheck. (HUMAN/AGENT)  
  **verification:** No errors.
- **Blocks:** API‑ASSETS‑006.

---

### [ ] API‑ASSETS‑006: Check‑Out/In – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑005, TEST‑INFRA‑001.  
**Tests include:**
- Checkout available asset → 201, asset status updated.
- Checkout already checked‑out asset → 400 `AssetNotAvailable`.
- Checkout asset in maintenance → 400 `AssetNotAvailable`.
- Checkin checked‑out asset → 200, asset status returned to available.
- Checkin already available asset → 400.
- Unauthorized → 401.
- View checkout history → 200.

---

### [ ] API‑ASSETS‑007: Check‑Out/In – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `CheckoutRepository` (append‑only) and `CheckoutService` (enforces availability rules, updates asset status, emits `AssetCheckedOut` / `AssetCheckedIn` events). Result<T, DomainError> returns.  
**Deep Module:** Encapsulates checkout lifecycle and status synchronisation.

**Rules to Follow:**
- Asset availability must be validated before checkout
- Checkout events are append-only (no updates)
- Asset status updated atomically with checkout
- Event emission after successful operations
- All methods return Result<T, DomainError>

**Advanced Code Patterns:**
- Append-only event logging
- Atomic state transitions
- Event-driven architecture
- Deep module encapsulation

**Anti-Patterns:**
- Missing availability validation
- Non-atomic state updates
- Missing event emission
- Exception-based error handling

**DDD:** Service encapsulates checkout aggregate behavior with proper domain events.  
**TDD:** Write failing tests for all checkout scenarios including availability validation and event emission.  
**BDD:** Enables "When I check out an asset, its status updates and events are emitted" scenarios.

### Subtasks:
- [ ] API‑ASSETS‑007.1: Implement repository and service. (AGENT) – `lib/db/src/repositories/checkouts.ts`, `services/assets/checkout-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑ASSETS‑007.2: Write unit tests. (AGENT) – `artifacts/api-server/__tests__/services/assets/checkout.test.ts`  
  **verification:** All tests green.
- [ ] API‑ASSETS‑007.3: Depth refactor check. (AGENT)  
  **verification:** Method count ≤ 5, service encapsulates checkout logic, no `throw`.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Service encapsulates checkout complexity
- Event emission verified in tests

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Service layer encapsulation
- Event-driven architecture
- Atomic state management

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Shallow service without encapsulation
- Missing event emission tests

---

### [ ] API‑ASSETS‑008: Check‑Out/In – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑007.  
**Subtasks:** routes, integration tests green.

---

### [ ] API‑ASSETS‑009: Maintenance Log – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ASSETS‑003.  
**Definition of Done:** Maintenance log endpoints:
- `GET /api/v1/assets/{assetId}/maintenance‑log` – paginated list of maintenance entries.
- `POST /api/v1/assets/{assetId}/maintenance‑log` – log a maintenance event. Body: `{ description, scheduled_date }`. Returns 201.
- `PATCH /api/v1/assets/{assetId}/maintenance‑log/{logId}/complete` – mark maintenance as completed. Sets `completed_date`.
**DDD:** Append‑only log; marking complete updates a single entry.

### Subtasks:
- [ ] API‑ASSETS‑009.1: Add maintenance log paths to OpenAPI. (AGENT)  
- [ ] API‑ASSETS‑009.2: Run codegen and typecheck.

---

### [ ] API‑ASSETS‑010: Maintenance Log – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑009, TEST‑INFRA‑001.  
**Tests include:** create maintenance entry, list log, mark complete, attempt to update completed entry → 400.

---

### [ ] API‑ASSETS‑011: Maintenance Log – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `MaintenanceRepository` (append‑only) and `MaintenanceService` (validates asset exists, allows completion only once). Emits `MaintenanceScheduled`, `MaintenanceCompleted`. Either returns.

---

### [ ] API‑ASSETS‑012: Maintenance Log – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑011.  
**Subtasks:** routes, tests green.

---

## Progress Tracking

### Overall Status
**Assets Context:** [ ] 0/12 parent tasks complete

### Context Breakdown
- **Asset CRUD:** [ ] 0/4 complete (spec, tests, service, routes)
- **Checkout/In:** [ ] 0/4 complete (spec, tests, service, routes)
- **Maintenance Log:** [ ] 0/4 complete (spec, tests, service, routes)

### Dependencies
- **DB-MIGRATE-ALL** enables all asset database operations
- **AUTH-008** enables authentication for asset operations
- **ERROR-002** enables proper error handling
- **ARCH-001.2** provides BaseRepository pattern

### Next Actions
- [ ] Start API-ASSETS-001.1: Add assets paths to OpenAPI
- [ ] Start API-ASSETS-002.1: Write integration tests (red)
- [ ] Start API-ASSETS-003.1: Implement AssetRepository

### Verification Commands
```bash
# Asset CRUD verification
pnpm test -- assets
pnpm typecheck

# Checkout/In verification
pnpm test -- assets-checkout
pnpm typecheck

# Maintenance Log verification
pnpm test -- assets-maintenance
pnpm typecheck
```

---

## File Index

### Asset CRUD
- `lib/api-spec/openapi.yaml` - Asset OpenAPI paths and schemas
- `artifacts/api-server/src/services/assets/asset-service.ts` - Asset service
- `lib/db/src/repositories/assets.ts` - Asset repository
- `routes/assets.ts` - Asset routes
- `artifacts/api-server/__tests__/api/assets/assets.test.ts` - Integration tests

### Checkout/In
- `artifacts/api-server/src/services/assets/checkout-service.ts` - Checkout service
- `lib/db/src/repositories/checkouts.ts` - Checkout repository
- `routes/assets.ts` - Checkout routes (added to asset routes)
- `artifacts/api-server/__tests__/api/assets/checkout.test.ts` - Checkout tests

### Maintenance Log
- `artifacts/api-server/src/services/assets/maintenance-service.ts` - Maintenance service
- `lib/db/src/repositories/maintenance.ts` - Maintenance repository
- `routes/assets.ts` - Maintenance routes (added to asset routes)
- `artifacts/api-server/__tests__/api/assets/maintenance.test.ts` - Maintenance tests

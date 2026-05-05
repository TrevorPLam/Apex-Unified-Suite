# TODO-P4-ASSETS.md – Phase 4 Assets Context



This file covers the Assets context: CRUD, check-out/check-in (append-only log), and maintenance log. Services enforce status transitions and availability rules. Deep modules encapsulate status machines and event emission.

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
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Write comprehensive integration tests for all asset CRUD endpoints following TDD red phase methodology, ensuring tests fail before implementation and cover all success and error scenarios including pagination, filtering, and security boundaries.

**Depends on:** API‑ASSETS‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Blocks:** API‑ASSETS‑003 (service implementation).  
**Related Files:** `artifacts/api-server/__tests__/api/assets/assets.test.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `describe`, `test`, `expect` from Jest, `request` from supertest, asset test fixtures
- Exports: [N/A] – test suite only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/assets/assets.test.ts` contains comprehensive failing tests for all CRUD operations
- [ ] Tests cover success scenarios: create asset (201), list assets (200 with pagination), get asset by ID (200), update asset (200), soft delete (204)
- [ ] Tests cover error scenarios: duplicate serial number (409), not found (404), unauthorized (401), validation errors (400)
- [ ] Tests verify pagination envelope with cursor-based pattern and server-side limit enforcement
- [ ] Tests verify filtering by status, category, and location parameters
- [ ] Tests verify soft delete behavior (excluded from listings, 404 on direct access)
- [ ] All tests compile and run, currently failing (red phase) because routes don't exist yet
- [ ] Test coverage report shows >90% line coverage for the eventual implementation

**Out of Scope**
- Performance/load testing (handled by separate performance test suite)
- UI/e2e testing (handled by frontend test suite)
- Bulk operations testing (Phase 6+ feature)
- Asset templates and advanced reporting (Phase 6+ feature)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, test database fixtures with real data
- Never run tests against production database – always use test database
- Never mock the HTTP layer in integration tests – use full request/response cycle

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/assets/assets.test.ts`
- Test fixtures: `artifacts/api-server/__tests__/fixtures/assets.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – entire test file can be reverted if test design is flawed
- Halt condition: if tests inadvertently pass due to existing routes or malformed test data – redesign test cases to ensure proper red phase

### Subtasks:
- [ ] API‑ASSETS‑002.1: Write all integration test cases. (AGENT) – `artifacts/api-server/__tests__/api/assets/assets.test.ts`  
  **verification:** Tests compile and run, all red (no routes exist).
- [ ] API‑ASSETS‑002.2: Verify test coverage includes negative cases. (AGENT)  
  **verification:** All error scenarios tested.

**Rules to Follow**
- All subtasks must have specific file paths and verification commands
- Tests must fail before implementation (TDD red phase) – verify by running tests before API routes exist
- Negative test cases required for every error path and validation rule
- Error scenarios must be tested with exact HTTP status codes and response formats
- Use cursor-based pagination pattern consistent with 2026 enterprise API standards
- Test data must be realistic but isolated (use test fixtures, not production data)
- All tests must be independent – avoid shared state between test cases

**Verification**
```bash
# Run tests (should fail - red phase)
pnpm --filter @workspace/api-server test -- assets.test.ts

# Verify test coverage
pnpm --filter @workspace/api-server test:coverage -- assets.test.ts

# Ensure tests compile
pnpm --filter @workspace/api-server typecheck
```

**Advanced Code Patterns**
- TDD red-green-refactor cycle with explicit test-first approach
- Integration test design using supertest with full HTTP request/response cycle
- Test fixture pattern for realistic asset data generation
- Cursor pagination testing with opaque token validation
- Error scenario testing with structured response validation
- Test data isolation using database transactions per test

**Anti-Patterns**
- Missing file paths in subtasks – all test files must be explicitly specified
- Writing implementation before tests – violates TDD methodology
- Missing negative test cases – every error path must have corresponding test
- Incomplete error scenario testing – must test exact status codes and response formats
- Shared test state between test cases – causes flaky tests and debugging difficulties
- Testing against mock HTTP layer – integration tests should use full request cycle

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify Asset aggregate behavior through API contract, ensuring business rules are enforced at the boundary
- TDD: Red-Green-Refactor cycle – write failing tests first, implement minimal code to pass, then refactor for quality
- BDD: Test scenarios map to user stories: "As a manager, I can create, view, update, and delete company assets with proper validation"
- Deep Module: Tests treat the API as the public interface of the Asset deep module, verifying encapsulation and proper abstraction

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
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Design and specify checkout/check-in endpoints for asset management following append-only event logging patterns, with proper availability validation, state transitions, and audit trail capabilities consistent with 2026 enterprise asset management best practices.

**Depends on:** DB‑ASSETS‑002, API‑ASSETS‑004.  
**Blocks:** API‑ASSETS‑006 (integration tests).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/assets/asset-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Asset checkout/check-in API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds checkout/check-in paths with `/api/v1/` prefix
- [ ] `POST /api/v1/assets/{assetId}/checkout` endpoint validates asset availability, creates checkout record, returns 201 with Location header
- [ ] `POST /api/v1/assets/{assetId}/checkin` endpoint validates active checkout, closes checkout record, returns 200
- [ ] `GET /api/v1/assets/{assetId}/checkout-history` endpoint returns paginated checkout log with cursor-based pagination
- [ ] Schemas defined: `CheckoutRequest`, `CheckoutResponse`, `CheckoutHistoryEntry`, `CheckoutHistoryResponse`
- [ ] All endpoints include proper error responses (409 for unavailable, 404 for not found, 400 for invalid requests)
- [ ] Examples included for all request/response patterns
- [ ] Spec validates successfully and generates clean TypeScript types

**Out of Scope**
- Bulk checkout/check-in operations (Phase 6+ feature)
- Asset reservation systems (Phase 6+ feature)
- Checkout approval workflows (Phase 6+ feature)
- Asset scheduling and calendar integration (Phase 6+ feature)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow checkout of assets already in maintenance status
- Never allow direct manipulation of checkout history (append-only only)
- Never expose internal user IDs in API responses – use user references only

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design before proceeding

**Rules to Follow:**
- Asset availability must be validated before checkout
- Checkout events are append-only (no updates)
- Checkin requires valid checkout record
- History pagination required
- Event emission for state changes
- All endpoints must use cursor-based pagination for history logs
- User authentication required for all checkout operations

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

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Checkout/check-in operations are domain events that modify Asset aggregate state; API enforces business rules at the boundary
- TDD: Integration tests (API-ASSETS-006) will be written before implementation to verify availability rules and event emission
- BDD: Enables "As a user, I can check out available assets and return them" scenarios with proper audit trail
- Deep Module: Checkout service encapsulates the complexity of availability validation, state transitions, and event publishing

### Subtasks:
- [ ] API‑ASSETS‑005.1: Add checkout/checkin paths to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑ASSETS‑005.2: Run codegen and typecheck. (HUMAN/AGENT)  
  **verification:** No errors.
- **Blocks:** API‑ASSETS‑006.

---

### [ ] API‑ASSETS‑006: Check‑Out/In – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Write comprehensive TDD red-phase integration tests for checkout/check-in endpoints, covering all success scenarios, error conditions, availability validation, and audit trail functionality following 2026 testing best practices.

**Depends on:** API‑ASSETS‑005, TEST‑INFRA‑001.  
**Blocks:** API‑ASSETS‑007 (service implementation).  
**Related Files:** `artifacts/api-server/__tests__/api/assets/checkout.test.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `describe`, `test`, `expect` from Jest, `request` from supertest, checkout test fixtures
- Exports: [N/A] – test suite only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/assets/checkout.test.ts` contains comprehensive failing tests for all checkout operations
- [ ] Tests cover success scenarios: checkout available asset (201), checkin asset (200), view checkout history (200 with pagination)
- [ ] Tests cover error scenarios: checkout unavailable asset (409), checkout asset in maintenance (409), checkin already available asset (400), unauthorized (401)
- [ ] Tests verify asset status transitions: available → checked_out → available
- [ ] Tests verify checkout history pagination with cursor-based pattern
- [ ] Tests verify append-only nature of checkout events (no updates allowed)
- [ ] All tests compile and run, currently failing (red phase) because routes don't exist yet
- [ ] Test coverage shows >90% for checkout functionality

**Out of Scope**
- Performance testing for high-volume checkout operations
- UI/e2e testing for checkout workflows
- Bulk checkout operations testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, test data with real user information
- Never mock the availability validation logic – test full request/response cycle
- Never allow tests to create actual state changes in production database

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/assets/checkout.test.ts`
- Test fixtures: `artifacts/api-server/__tests__/fixtures/checkout.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – entire test file can be reverted if test design is flawed
- Halt condition: if tests inadvertently pass due to existing routes – redesign test cases to ensure proper red phase

**Rules to Follow**
- All tests must fail before implementation (TDD red phase)
- Test all availability validation scenarios
- Test append-only behavior of checkout events
- Test pagination for checkout history
- Test authentication and authorization
- Test asset status transitions

**Verification**
```bash
# Run tests (should fail - red phase)
pnpm --filter @workspace/api-server test -- checkout.test.ts

# Verify test coverage
pnpm --filter @workspace/api-server test:coverage -- checkout.test.ts

# Ensure tests compile
pnpm --filter @workspace/api-server typecheck
```

**Advanced Code Patterns**
- TDD red-green-refactor cycle
- Integration test design with full HTTP cycle
- Test fixture pattern for checkout scenarios
- Cursor pagination testing
- State transition testing
- Event emission verification

**Anti-Patterns**
- Missing availability validation tests
- Testing against mock HTTP layer
- Shared test state between cases
- Missing error scenario coverage
- Incomplete state transition testing

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify checkout aggregate behavior and Asset aggregate state transitions
- TDD: Red-Green-Refactor cycle ensures tests drive implementation
- BDD: "As a user, I can check out available assets and return them with proper audit trail"
- Deep Module: Tests verify checkout service encapsulation of availability logic and event publishing

**Test Scenarios Include:**
- Checkout available asset → 201, asset status updated to checked_out
- Checkout already checked-out asset → 409 `AssetNotAvailable`
- Checkout asset in maintenance → 409 `AssetNotAvailable`
- Checkin checked-out asset → 200, asset status returned to available
- Checkin already available asset → 400 `AssetAlreadyAvailable`
- Unauthorized checkout attempt → 401
- View checkout history → 200 with cursor pagination
- Checkout history excludes soft-deleted assets

---

### [ ] API‑ASSETS‑007: Check‑Out/In – Service & Repository
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Implement deep module service and repository for checkout/check-in operations with append-only event logging, atomic state transitions, and proper domain event emission following enterprise asset management patterns.

**Depends on:** DB‑MIGRATE‑ALL.  
**Blocks:** API‑ASSETS‑008 (routes implementation).  
**Related Files:** `lib/db/src/repositories/checkouts.ts`, `artifacts/api-server/src/services/assets/checkout-service.ts`, `lib/db/src/repositories/assets.ts`

**Imports / Exports**
- Imports: `Result`, `ok`, `err` from neverthrow, domain events, asset repository
- Exports: `CheckoutRepository`, `CheckoutService` with checkout/check-in methods

**Definition of Done**
- [ ] `lib/db/src/repositories/checkouts.ts` exports `CheckoutRepository` extending append-only pattern for checkout events
- [ ] `artifacts/api-server/src/services/assets/checkout-service.ts` exports `CheckoutService` with methods: `checkout`, `checkin`, `getCheckoutHistory`
- [ ] Service enforces asset availability validation before checkout operations
- [ ] Asset status updates happen atomically with checkout events in database transactions
- [ ] Service emits `AssetCheckedOut` and `AssetCheckedIn` domain events after successful operations
- [ ] All methods return `Result<T, DomainError>` pattern with proper error handling
- [ ] Service encapsulates checkout lifecycle complexity and status synchronization
- [ ] Unit tests cover all success and failure scenarios including edge cases
- [ ] Depth refactor check passes: method count ≤ 5, no exceptions thrown, proper encapsulation

**Out of Scope**
- Bulk checkout operations
- Asset reservation systems
- Checkout approval workflows
- Asset scheduling integration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow checkout of assets in maintenance status without proper validation
- Never allow direct manipulation of checkout events – append-only only
- Never update asset status without corresponding checkout event

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/checkouts.ts`, `artifacts/api-server/src/services/assets/checkout-service.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/services/assets/checkout.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – repository and service files can be reverted
- Halt condition: if atomic state transitions fail or cause data inconsistency – review transaction boundaries

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

**Verification**
```bash
# Run unit tests
pnpm --filter @workspace/api-server test -- checkout.test.ts

# Verify service encapsulation
grep -c "class CheckoutService" artifacts/api-server/src/services/assets/checkout-service.ts
grep -c "throw" artifacts/api-server/src/services/assets/checkout-service.ts # should be 0

# Type checking
pnpm run typecheck

# Depth refactor check
grep -c "async.*(" artifacts/api-server/src/services/assets/checkout-service.ts # should be ≤ 5
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Service encapsulates checkout aggregate behavior with proper domain events and Asset aggregate coordination
- TDD: Unit tests written before implementation cover all checkout scenarios including availability validation and event emission
- BDD: Enables "When I check out an asset, its status updates and events are emitted" scenarios with proper business rule enforcement
- Deep Module: Checkout service hides complexity of availability validation, atomic state transitions, and event publishing behind a simple interface

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
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Implement Express routes for checkout/check-in endpoints with proper authentication, validation, and error handling to make integration tests from API-ASSETS-006 pass (green phase).

**Depends on:** API‑ASSETS‑007.  
**Blocks:** [N/A] – completes checkout/check-in feature.  
**Related Files:** `artifacts/api-server/src/routes/assets.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `Router` from Express, checkout service, validation schemas, auth middleware
- Exports: Checkout routes router for mounting in main router

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/assets.ts` includes checkout/check-in route handlers
- [ ] `POST /api/v1/assets/{assetId}/checkout` route with authentication and validation
- [ ] `POST /api/v1/assets/{assetId}/checkin` route with authentication and validation
- [ ] `GET /api/v1/assets/{assetId}/checkout-history` route with pagination
- [ ] All routes use CheckoutService and return proper HTTP status codes
- [ ] Error handling maps domain errors to HTTP responses correctly
- [ ] Routes mounted in main router at `/api/v1/assets`
- [ ] All integration tests from API-ASSETS-006 pass (green phase)
- [ ] Route tests with mocked service pass

**Out of Scope**
- Bulk checkout operations
- Asset reservation endpoints
- Checkout approval workflows

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow checkout operations without proper authentication
- Never bypass availability validation in routes

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/assets.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A] – integration tests already exist in API-ASSETS-006
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – route changes can be reverted
- Halt condition: if integration tests fail due to route implementation errors – review route logic

**Rules to Follow**
- All routes must use authentication middleware
- Proper error mapping from domain errors to HTTP responses
- Use generated validation schemas from OpenAPI
- Follow REST conventions for HTTP methods and status codes

**Verification**
```bash
# Run integration tests (should now pass - green phase)
pnpm --filter @workspace/api-server test -- checkout.test.ts

# Run route tests with mocked service
pnpm --filter @workspace/api-server test -- routes.test.ts

# Type checking
pnpm run typecheck
```

**Advanced Code Patterns**
- Express route composition with middleware
- Error mapping from domain to HTTP
- Service layer integration
- Route testing with mocks

**Anti-Patterns**
- Missing authentication middleware
- Direct database access in routes
- Improper HTTP status codes
- Missing error handling

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes expose checkout operations through HTTP interface, maintaining domain boundaries
- TDD: Integration tests now pass (green) proving route implementation is correct
- BDD: HTTP endpoints enable "As a user, I can check out assets via REST API" scenarios
- Deep Module: Routes are thin wrappers around CheckoutService, maintaining proper abstraction

### Subtasks:
- [ ] API‑ASSETS‑008.1: Create checkout routes with validation and auth. (AGENT) – `artifacts/api-server/src/routes/assets.ts`  
  **verification:** Route tests with mocked service pass.
- [ ] API‑ASSETS‑008.2: Add routes to main router. (AGENT) – `artifacts/api-server/src/routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- [ ] API‑ASSETS‑008.3: Run integration tests to green. (AGENT)  
  **verification:** All tests from API‑ASSETS‑006 pass.

---

### [ ] API‑ASSETS‑009: Maintenance Log – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Design and specify maintenance log endpoints following append-only logging patterns with proper scheduling, completion tracking, and audit trail capabilities consistent with enterprise asset maintenance management.

**Depends on:** DB‑ASSETS‑003.  
**Blocks:** API‑ASSETS‑010 (integration tests).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/assets/maintenance-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Asset maintenance log API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds maintenance log paths with `/api/v1/` prefix
- [ ] `GET /api/v1/assets/{assetId}/maintenance-log` endpoint returns paginated maintenance entries with cursor-based pagination
- [ ] `POST /api/v1/assets/{assetId}/maintenance-log` endpoint creates maintenance entries, returns 201 with Location header
- [ ] `PATCH /api/v1/assets/{assetId}/maintenance-log/{logId}/complete` endpoint marks maintenance as completed, sets completed_date, returns 200
- [ ] Schemas defined: `MaintenanceEntry`, `MaintenanceCreate`, `MaintenanceResponse`, `MaintenanceHistoryResponse`
- [ ] All endpoints include proper error responses (404 for not found, 400 for invalid requests, 409 for completing already completed maintenance)
- [ ] Examples included for all request/response patterns
- [ ] Spec validates successfully and generates clean TypeScript types

**Out of Scope**
- Bulk maintenance operations
- Maintenance scheduling workflows
- Maintenance approval processes
- Predictive maintenance features

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow completion of maintenance entries that are already completed
- Never allow updates to maintenance entries except for completion status

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Maintenance entries are append-only (no updates except completion)
- Completion can only happen once per maintenance entry
- History pagination required with cursor-based pattern
- Asset validation required for all operations
- Proper date handling for scheduled_date and completed_date

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- Append-only event logging design
- State transition enforcement (scheduled → completed)
- Cursor pagination for audit trails
- Date handling with proper validation

**Anti-Patterns**
- Allowing updates to maintenance entries
- Missing completion validation
- Inconsistent date handling
- Missing pagination for history

**DDD / TDD / BDD / Deep Module notes**
- DDD: Maintenance log is a separate aggregate with append-only behavior; completion is a state transition
- TDD: Integration tests (API-ASSETS-010) will verify append-only behavior and completion validation
- BDD: Enables "As a maintenance technician, I can log maintenance activities and mark them complete" scenarios
- Deep Module: Maintenance service will encapsulate the complexity of append-only logging and completion state transitions

**DDD:** Maintenance log is a separate aggregate with append-only behavior; completion is a state transition.  
**TDD:** Integration tests (API-ASSETS-010) will verify append-only behavior and completion validation.  
**BDD:** Enables "As a maintenance technician, I can log maintenance activities and mark them complete" scenarios.

### Subtasks:
- [ ] API‑ASSETS‑009.1: Add maintenance log paths to OpenAPI. (AGENT)  
- [ ] API‑ASSETS‑009.2: Run codegen and typecheck.

---

### [ ] API‑ASSETS‑010: Maintenance Log – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Write comprehensive TDD red-phase integration tests for maintenance log endpoints, covering all success scenarios, error conditions, append-only behavior, and completion validation following enterprise testing best practices.

**Depends on:** API‑ASSETS‑009, TEST‑INFRA‑001.  
**Blocks:** API‑ASSETS‑011 (service implementation).  
**Related Files:** `artifacts/api-server/__tests__/api/assets/maintenance.test.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `describe`, `test`, `expect` from Jest, `request` from supertest, maintenance test fixtures
- Exports: [N/A] – test suite only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/assets/maintenance.test.ts` contains comprehensive failing tests for all maintenance operations
- [ ] Tests cover success scenarios: create maintenance entry (201), list maintenance history (200 with pagination), mark complete (200)
- [ ] Tests cover error scenarios: complete already completed maintenance (409), invalid maintenance entry (404), unauthorized (401)
- [ ] Tests verify append-only behavior (no updates allowed except completion)
- [ ] Tests verify maintenance history pagination with cursor-based pattern
- [ ] Tests verify completion can only happen once per maintenance entry
- [ ] All tests compile and run, currently failing (red phase) because routes don't exist yet
- [ ] Test coverage shows >90% for maintenance functionality

**Out of Scope**
- Performance testing for high-volume maintenance operations
- UI/e2e testing for maintenance workflows
- Bulk maintenance operations testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, test data with real maintenance information
- Never mock the append-only validation logic – test full request/response cycle
- Never allow tests to create actual state changes in production database

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/assets/maintenance.test.ts`
- Test fixtures: `artifacts/api-server/__tests__/fixtures/maintenance.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – entire test file can be reverted if test design is flawed
- Halt condition: if tests inadvertently pass due to existing routes – redesign test cases to ensure proper red phase

**Rules to Follow**
- All tests must fail before implementation (TDD red phase)
- Test all append-only behavior scenarios
- Test completion validation (can only complete once)
- Test pagination for maintenance history
- Test authentication and authorization
- Test date handling for scheduled_date and completed_date

**Verification**
```bash
# Run tests (should fail - red phase)
pnpm --filter @workspace/api-server test -- maintenance.test.ts

# Verify test coverage
pnpm --filter @workspace/api-server test:coverage -- maintenance.test.ts

# Ensure tests compile
pnpm --filter @workspace/api-server typecheck
```

**Advanced Code Patterns**
- TDD red-green-refactor cycle
- Integration test design with full HTTP cycle
- Test fixture pattern for maintenance scenarios
- Cursor pagination testing
- State transition testing
- Append-only behavior verification

**Anti-Patterns**
- Missing append-only validation tests
- Testing against mock HTTP layer
- Shared test state between cases
- Missing completion validation tests
- Inconsistent date handling in tests

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify maintenance aggregate behavior and append-only logging patterns
- TDD: Red-Green-Refactor cycle ensures tests drive implementation
- BDD: "As a maintenance technician, I can log maintenance activities and mark them complete with proper audit trail"
- Deep Module: Tests verify maintenance service encapsulation of append-only logic and completion state transitions

**Test Scenarios Include:**
- Create maintenance entry → 201, entry in maintenance log
- List maintenance history → 200 with cursor pagination
- Mark maintenance complete → 200, completed_date set
- Complete already completed maintenance → 409 `MaintenanceAlreadyCompleted`
- Update completed maintenance entry → 400 `MaintenanceEntryReadOnly`
- Unauthorized maintenance attempt → 401
- Invalid maintenance entry ID → 404 `MaintenanceEntryNotFound`

---

### [ ] API‑ASSETS‑011: Maintenance Log – Service & Repository
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Implement deep module service and repository for maintenance log operations with append-only event logging, completion validation, and proper domain event emission following enterprise maintenance management patterns.

**Depends on:** DB‑MIGRATE‑ALL.  
**Blocks:** API‑ASSETS‑012 (routes implementation).  
**Related Files:** `lib/db/src/repositories/maintenance.ts`, `artifacts/api-server/src/services/assets/maintenance-service.ts`, `lib/db/src/repositories/assets.ts`

**Imports / Exports**
- Imports: `Result`, `ok`, `err` from neverthrow, domain events, asset repository
- Exports: `MaintenanceRepository`, `MaintenanceService` with maintenance log methods

**Definition of Done**
- [ ] `lib/db/src/repositories/maintenance.ts` exports `MaintenanceRepository` extending append-only pattern for maintenance entries
- [ ] `artifacts/api-server/src/services/assets/maintenance-service.ts` exports `MaintenanceService` with methods: `createEntry`, `completeEntry`, `getMaintenanceHistory`
- [ ] Service validates asset existence before creating maintenance entries
- [ ] Service enforces completion can only happen once per maintenance entry
- [ ] Service emits `MaintenanceScheduled` and `MaintenanceCompleted` domain events after successful operations
- [ ] All methods return `Result<T, DomainError>` pattern with proper error handling
- [ ] Service encapsulates maintenance log complexity and completion state transitions
- [ ] Unit tests cover all success and failure scenarios including edge cases
- [ ] Depth refactor check passes: method count ≤ 5, no exceptions thrown, proper encapsulation

**Out of Scope**
- Bulk maintenance operations
- Maintenance scheduling workflows
- Maintenance approval processes
- Predictive maintenance features

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow completion of maintenance entries that are already completed
- Never allow updates to maintenance entries except for completion status
- Never create maintenance entries for non-existent assets

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/maintenance.ts`, `artifacts/api-server/src/services/assets/maintenance-service.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/services/assets/maintenance.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – repository and service files can be reverted
- Halt condition: if append-only behavior fails or causes data inconsistency – review implementation

**Rules to Follow**
- Maintenance entries are append-only (no updates except completion)
- Completion can only happen once per maintenance entry
- Asset validation required for all operations
- Event emission after successful operations
- All methods return Result<T, DomainError>

**Verification**
```bash
# Run unit tests
pnpm --filter @workspace/api-server test -- maintenance.test.ts

# Verify service encapsulation
grep -c "class MaintenanceService" artifacts/api-server/src/services/assets/maintenance-service.ts
grep -c "throw" artifacts/api-server/src/services/assets/maintenance-service.ts # should be 0

# Type checking
pnpm run typecheck

# Depth refactor check
grep -c "async.*(" artifacts/api-server/src/services/assets/maintenance-service.ts # should be ≤ 5
```

**Advanced Code Patterns**
- Append-only event logging
- State transition enforcement (scheduled → completed)
- Deep module encapsulation
- Event-driven architecture
- Result pattern error handling

**Anti-Patterns**
- Missing append-only validation
- Non-atomic state updates
- Missing event emission
- Exception-based error handling
- Allowing updates to completed entries

**DDD / TDD / BDD / Deep Module notes**
- DDD: Service encapsulates maintenance aggregate behavior with proper domain events and Asset aggregate coordination
- TDD: Unit tests written before implementation cover all maintenance scenarios including append-only behavior and completion validation
- BDD: Enables "When I log maintenance activities, they are stored permanently and can be marked complete exactly once" scenarios
- Deep Module: Maintenance service hides complexity of append-only logging, completion validation, and event publishing behind a simple interface

**DDD:** Maintenance log is a separate aggregate with append-only behavior; service coordinates with Asset aggregate.  
**TDD:** Write failing tests for all maintenance scenarios including append-only behavior and completion validation.  
**BDD:** Enables "When I log maintenance activities, they are stored permanently and can be marked complete exactly once" scenarios.

---

### [ ] API‑ASSETS‑012: Maintenance Log – Routes & Green Tests
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Implement Express routes for maintenance log endpoints with proper authentication, validation, and error handling to make integration tests from API-ASSETS-010 pass (green phase).

**Depends on:** API‑ASSETS‑011.  
**Blocks:** [N/A] – completes maintenance log feature.  
**Related Files:** `artifacts/api-server/src/routes/assets.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `Router` from Express, maintenance service, validation schemas, auth middleware
- Exports: Maintenance log routes router for mounting in main router

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/assets.ts` includes maintenance log route handlers
- [ ] `GET /api/v1/assets/{assetId}/maintenance-log` route with pagination
- [ ] `POST /api/v1/assets/{assetId}/maintenance-log` route with authentication and validation
- [ ] `PATCH /api/v1/assets/{assetId}/maintenance-log/{logId}/complete` route with authentication and validation
- [ ] All routes use MaintenanceService and return proper HTTP status codes
- [ ] Error handling maps domain errors to HTTP responses correctly
- [ ] Routes mounted in main router at `/api/v1/assets`
- [ ] All integration tests from API-ASSETS-010 pass (green phase)
- [ ] Route tests with mocked service pass

**Out of Scope**
- Bulk maintenance operations
- Maintenance scheduling endpoints
- Maintenance approval workflows

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow maintenance operations without proper authentication
- Never bypass append-only validation in routes

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/assets.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A] – integration tests already exist in API-ASSETS-010
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – route changes can be reverted
- Halt condition: if integration tests fail due to route implementation errors – review route logic

**Rules to Follow**
- All routes must use authentication middleware
- Proper error mapping from domain errors to HTTP responses
- Use generated validation schemas from OpenAPI
- Follow REST conventions for HTTP methods and status codes

**Verification**
```bash
# Run integration tests (should now pass - green phase)
pnpm --filter @workspace/api-server test -- maintenance.test.ts

# Run route tests with mocked service
pnpm --filter @workspace/api-server test -- routes.test.ts

# Type checking
pnpm run typecheck
```

**Advanced Code Patterns**
- Express route composition with middleware
- Error mapping from domain to HTTP
- Service layer integration
- Route testing with mocks

**Anti-Patterns**
- Missing authentication middleware
- Direct database access in routes
- Improper HTTP status codes
- Missing error handling

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes expose maintenance operations through HTTP interface, maintaining domain boundaries
- TDD: Integration tests now pass (green) proving route implementation is correct
- BDD: HTTP endpoints enable "As a maintenance technician, I can log maintenance activities via REST API" scenarios
- Deep Module: Routes are thin wrappers around MaintenanceService, maintaining proper abstraction

### Subtasks:
- [ ] API‑ASSETS‑012.1: Create maintenance log routes with validation and auth. (AGENT) – `artifacts/api-server/src/routes/assets.ts`  
  **verification:** Route tests with mocked service pass.
- [ ] API‑ASSETS‑012.2: Add routes to main router. (AGENT) – `artifacts/api-server/src/routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- [ ] API‑ASSETS‑012.3: Run integration tests to green. (AGENT)  
  **verification:** All tests from API‑ASSETS‑010 pass.

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

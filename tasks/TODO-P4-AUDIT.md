# TODO-P4-AUDIT.md – Phase 4 Cross‑Cutting Audit & Monitoring



This file covers the Audit Log Query API and management capabilities. Audit logs are append-only records of all domain events across contexts. All endpoints require admin authentication.

---

## Cross‑Cutting Audit & Monitoring

*This section provides the audit log query API and management capabilities. Audit logs are append‑only records of all domain events across contexts.*

### [ ] API‑AUDIT‑001: Audit Log Query – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No audit log query endpoints exist in the OpenAPI spec. `lib/api-spec/openapi.yaml` has no `audit` tag. Admins cannot query or export audit logs via API.  
**Size:** Small  

**Description:** Extend the OpenAPI spec with the audit log query and export API, enabling codegen to produce typed hooks and Zod validators for audit log retrieval.  

**Depends on:** DB‑SETTINGS‑002 (audit logs table)  
**Blocks:** API‑AUDIT‑002 (integration tests require spec), codegen must run before frontend audit views  
**Related Files:** `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: [N/A — YAML spec file]
- Exports: `audit` tag and paths in `lib/api-spec/openapi.yaml`; generated types via `pnpm codegen`

**Definition of Done**
- [ ] OpenAPI spec adds `audit` tag with all paths using `/audit/` prefix
- [ ] `GET /audit/logs` — list with pagination, filter by context, action, date range, user
- [ ] `GET /audit/logs/{logId}` — get specific audit log entry
- [ ] `GET /audit/summary` — audit statistics (counts by action, by context)
- [ ] `POST /audit/export` — export logs to CSV (async job, returns job ID)
- [ ] All endpoints annotated with admin authentication requirement
- [ ] Schemas: `AuditLog`, `AuditSummary`, `ExportJobResponse` in `components/schemas`
- [ ] `pnpm --filter @workspace/api-spec run codegen` succeeds with no errors
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Audit log write operations (append-only, written by domain events)
- Real-time log streaming or webhooks
- Log retention policy management

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Do not hand-edit generated files — always run `codegen` after spec changes

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert audit tag/paths from `openapi.yaml`; re-run codegen
- Halt condition: if `codegen` fails or produces type errors, stop and fix spec

**Rules to Follow**
- All audit endpoints require admin authentication annotation
- Pagination must use consistent `limit`/`offset` params matching other spec endpoints
- Date range filter must use ISO 8601 format

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

**Advanced Code Patterns**
- Reuse `PaginationParams` and `DateRange` parameter components from existing spec
- Use `AsyncJobResponse` schema for the export endpoint to avoid request timeout

**Anti-Patterns**
- Missing admin auth annotation — security gap
- Inline schemas instead of `$ref` — breaks codegen deduplication
- Synchronous export for large datasets — causes request timeout

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit logs are an immutable record of domain events; this spec exposes read-only access
- TDD: Spec must be complete before API‑AUDIT‑002 tests can be written meaningfully
- BDD: "As an admin, I can view audit logs filtered by date range and export them to CSV"
- Deep Module: The spec hides complex query and export logic behind simple REST endpoints

---

### Subtasks

- [ ] API‑AUDIT‑001.0.25 (AGENT): Read this task, `lib/api-spec/openapi.yaml` (existing structure), and `DB‑SETTINGS‑002` schema definition in full.  
  *No action — pause until fully understood.*

- [ ] API‑AUDIT‑001.0.5 (AGENT): Research OpenAPI 3.0 patterns for append-only log APIs and async export jobs (May 2026). Confirm admin auth annotation pattern used elsewhere in the spec.  
  *Document findings briefly or note "no changes."*

- [ ] API‑AUDIT‑001.0.75 (AGENT): Reason about whether `POST /audit/export` should be synchronous or async. Default to async (return job ID) to avoid request timeouts on large datasets.  
  *If uncertain, use async with job ID pattern.*

- [ ] API‑AUDIT‑001.1 (AGENT): Add audit tag and all paths to OpenAPI spec with admin auth annotation.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Spec validates; admin auth requirements clearly marked.

- [ ] API‑AUDIT‑001.2 (AGENT): Run `pnpm --filter @workspace/api-spec run codegen` and `pnpm run typecheck`.  
  **File(s):** [N/A — generated files]  
  **Verification:** No type errors; generated types available.

- [ ] API‑AUDIT‑001.3 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑AUDIT‑002: Audit Log Query – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No audit integration tests exist. `artifacts/api-server/src/__tests__/api/audit/` does not exist. All audit endpoint tests are blocked until API‑AUDIT‑001 spec is complete.  
**Size:** Small  

**Description:** Write failing integration tests for all audit log endpoints (TDD red phase), establishing the test contract before any implementation begins.  

**Depends on:** API‑AUDIT‑001, TEST‑INFRA‑001 (test harness)  
**Blocks:** API‑AUDIT‑003 (service must satisfy these tests)
**Related Files:** `artifacts/api-server/src/__tests__/api/audit/audit.test.ts`  

**Imports / Exports**
- Imports: `supertest` (request); `createTestServer()`, `generateTestToken()` from `test-server.ts`, `auth-helpers.ts`
- Exports: [N/A — test file, no exports]

**Definition of Done**
- [ ] `artifacts/api-server/src/__tests__/api/audit/audit.test.ts` exists with failing tests for:
- [ ] `GET /audit/logs` → 200 with paginated results (admin token)
- [ ] `GET /audit/logs` filtered by context, action, date range → 200 with filtered results
- [ ] `GET /audit/logs/{logId}` → 200 with log entry
- [ ] `GET /audit/logs/{logId}` not found → 404 `AuditLogNotFound`
- [ ] `GET /audit/summary` → 200 with counts by action and context
- [ ] `POST /audit/export` → 200 with async job ID
- [ ] Unauthorized access (non-admin) → 403 `InsufficientPermissions`
- [ ] Test suite compiles and runs with all tests red (no routes exist)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Testing audit log write operations
- Performance or load testing
- End-to-end UI testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Tests must always use `TEST_DATABASE_URL`, never the production database

**Output Artifacts**
- Code changes in: [N/A — test file only]
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/audit/audit.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/__tests__/api/audit/`; no DB state changes
- Halt condition: if test file fails to compile, stop and fix TypeScript errors before proceeding

**Rules to Follow**
- All tests must use `generateTestToken(userId, orgId, role: 'admin')` for auth
- Tests must verify both success and error paths for every endpoint
- Tests must be independent — each test calls `teardownTestDatabase()` via `afterEach`

**Verification**
```bash
pnpm --filter @workspace/api-server test -- audit.test.ts
# Expected: all tests fail with 404 (no routes exist)
pnpm run typecheck
```

**Advanced Code Patterns**
- Use `beforeAll` to seed audit log entries for query tests
- Use `afterEach` to truncate relevant tables for isolation

**Anti-Patterns**
- Writing implementation before tests — violates TDD red phase
- Tests depending on specific log IDs — use query filters instead
- Missing negative test cases (unauthorized, not found)

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: This IS the red phase; tests must fail before implementation begins
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑AUDIT‑002.0.25 (AGENT): Read this task, API‑AUDIT‑001 spec, and `TEST‑INFRA‑001` test harness documentation in full.  
  *No action — pause until fully understood.*

- [ ] API‑AUDIT‑002.0.5 (AGENT): Research Vitest + Supertest integration test patterns for Express 5 (May 2026). Confirm `request(app)` pattern works without live port.  
  *Document findings briefly or note "no changes."*

- [ ] API‑AUDIT‑002.0.75 (AGENT): Reason about test data seeding strategy for audit logs. Default: seed via direct DB insert in `beforeAll`, not via API calls.  
  *If uncertain, use direct DB insert.*

- [ ] API‑AUDIT‑002.1 (AGENT): Write all integration tests for audit log endpoints. Tests must all fail (red phase).  
  **File(s):** `artifacts/api-server/src/__tests__/api/audit/audit.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- audit.test.ts` compiles and runs; all tests red.

- [ ] API‑AUDIT‑002.2 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑AUDIT‑003: Audit Log Query – Service & Repository
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No `AuditRepository` or `AuditService` exists. `lib/db/src/repositories/audit.ts` and `artifacts/api-server/src/services/audit/` do not exist. Audit log querying is blocked.  
**Size:** Medium  

**Description:** Implement `AuditRepository` (append-only, no soft delete) and `AuditService` with filtering, pagination, and CSV export, backed by optimised DB indexes.  

**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2 (BaseRepository)  
**Blocks:** API‑AUDIT‑004 (routes require service)
**Related Files:** `lib/db/src/repositories/audit.ts`, `artifacts/api-server/src/services/audit/audit-service.ts`  

**Imports / Exports**
- Imports: `BaseRepository` from `@workspace/db`; `drizzle-orm` (eq, and, gte, lte, inArray); `AuditLog` schema type
- Exports: `AuditRepository` (class), `AuditService` (class), `AuditFilter` (type), `AuditSummary` (type)

**Definition of Done**
- [ ] `lib/db/src/repositories/audit.ts` exports `AuditRepository` extending `BaseRepository<AuditLog>` — no soft delete, append-only
- [ ] `AuditRepository` has `findAll(filter, pagination)` with indexes on `(organization_id, created_at)`, `(action)`, `(context)`
- [ ] `artifacts/api-server/src/services/audit/audit-service.ts` exports `AuditService` with methods: `queryLogs(filter, pagination)`, `getLogById(id)`, `getSummary(filter)`, `exportToCsv(filter)`
- [ ] `exportToCsv` enqueues an async job and returns a job ID (does not block)
- [ ] All service methods return `Result<T, DomainError>`
- [ ] Unit tests for repository and service with mocked DB
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Audit log write operations (handled by domain event handlers)
- Real-time log streaming
- Log archival or purging

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `AuditRepository` must NEVER expose a method that modifies or deletes audit logs

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/audit.ts`, `artifacts/api-server/src/services/audit/audit-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/audit/audit-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `lib/db/src/repositories/audit.ts` and `artifacts/api-server/src/services/audit/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails or unit tests exceed 5% failure rate, stop and fix before proceeding

**Rules to Follow**
- `AuditRepository` is append-only — never expose `update()` or `delete()` methods
- Queries must use DB indexes on `(organization_id, created_at)`, `(action)`, `(context)` for performance
- Avoid N+1 queries — use single-query aggregation for summary endpoint

**Verification**
```bash
pnpm --filter @workspace/api-server test -- audit-service
pnpm run typecheck
```

**Advanced Code Patterns**
- Repository pattern with query optimization — single SQL query for pagination + total count using `COUNT(*) OVER()`
- Service layer with Result pattern for error handling
- Async job pattern for CSV export — enqueue job and return ID immediately

**Anti-Patterns**
- Exposing delete/update methods on `AuditRepository` — audit logs are immutable
- N+1 queries for summary calculation — use GROUP BY aggregation
- Synchronous CSV generation for large datasets — causes request timeout

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit logs are an immutable event record; the repository enforces append-only semantics
- TDD: Write unit tests for filter combinations before implementing queries
- BDD: [N/A]
- Deep Module: `AuditService` hides complex filtering, pagination, and export scheduling behind four simple methods

---

### Subtasks

- [ ] API‑AUDIT‑003.0.25 (AGENT): Read this task, `DB‑SETTINGS‑002` schema, `ARCH‑001.2-IMPL` BaseRepository spec, and `audit.test.ts` (integration tests) in full.  
  *No action — pause until fully understood.*

- [ ] API‑AUDIT‑003.0.5 (AGENT): Research Drizzle ORM aggregation patterns (COUNT(*) OVER, GROUP BY) for PostgreSQL (May 2026). Confirm single-query pagination approach.  
  *Document findings briefly or note "no changes."*

- [ ] API‑AUDIT‑003.0.75 (AGENT): Reason about whether CSV export should use a job queue or a synchronous stream. Default: async job with ID return to avoid timeout. Note what job processor is available.  
  *If uncertain, ask the user before executing.*

- [ ] API‑AUDIT‑003.1 (AGENT): Implement `AuditRepository` extending `BaseRepository` (append-only, no delete).  
  **File(s):** `lib/db/src/repositories/audit.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] API‑AUDIT‑003.2 (AGENT): Implement `AuditService` with query, summary, and export methods.  
  **File(s):** `artifacts/api-server/src/services/audit/audit-service.ts`  
  **Verification:** Unit tests with mocked repository pass.

- [ ] API‑AUDIT‑003.3 (AGENT): Write unit tests for all service methods (success + error paths).  
  **File(s):** `artifacts/api-server/src/__tests__/services/audit/audit-service.test.ts`  
  **Verification:** All tests green.

- [ ] API‑AUDIT‑003.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑AUDIT‑004: Audit Log Query – Routes & Green Tests
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No audit routes exist. `artifacts/api-server/src/routes/audit/` does not exist. Integration tests from API‑AUDIT‑002 are all failing (red).  
**Size:** Small  

**Description:** Wire audit log query routes with admin auth middleware and Zod validation, turning the API‑AUDIT‑002 integration tests from red to green.  

**Depends on:** API‑AUDIT‑003 (service), AUTH‑008 (admin auth middleware)  
**Blocks:** [N/A — final phase of audit implementation]
**Related Files:** `artifacts/api-server/src/routes/audit/audit.ts`, `artifacts/api-server/src/routes/index.ts`  

**Imports / Exports**
- Imports: `express` (Router); `AuditService`; `adminAuthMiddleware` from `AUTH‑008`; generated Zod schemas
- Exports: `auditRouter` (Express Router)

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/audit/audit.ts` exports `auditRouter` with all 4 endpoints wired
- [ ] All routes protected by `adminAuthMiddleware`
- [ ] Request validation uses generated Zod schemas from `lib/api-zod/src/generated/`
- [ ] Routes delegate to `AuditService` methods
- [ ] `auditRouter` mounted at `/audit` in `routes/index.ts`
- [ ] All integration tests from API‑AUDIT‑002 pass (green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Audit log write routes (append-only via domain events)
- WebSocket streaming of audit logs

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/audit/audit.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A — existing tests from API‑AUDIT‑002 must turn green]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/routes/audit/`; revert `routes/index.ts` mount
- Halt condition: if integration tests do not turn green after route wiring, stop and debug service integration

**Rules to Follow**
- All audit routes must be protected by `adminAuthMiddleware` — no public access
- Use generated Zod schemas for request validation; do not write custom schemas
- Error responses must use the standard error envelope format

**Verification**
```bash
pnpm --filter @workspace/api-server test -- audit.test.ts
# Expected: all tests green
pnpm run typecheck
```

**Advanced Code Patterns**
- Route handler delegates entirely to `AuditService` — no business logic in routes
- Use `asyncHandler` wrapper to avoid try/catch in every route handler

**Anti-Patterns**
- Business logic in route handlers — belongs in `AuditService`
- Missing admin auth middleware — exposes sensitive audit data
- Custom Zod schemas instead of generated ones — breaks type contract

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are the API layer of the Audit bounded context; they delegate to the domain service
- TDD: This is the green phase; routes must make API‑AUDIT‑002 tests pass
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑AUDIT‑004.0.25 (AGENT): Read this task, `audit.test.ts` (integration tests), `AuditService` implementation, and `routes/index.ts` structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑AUDIT‑004.0.5 (AGENT): Research Express 5 router patterns and Zod validation middleware integration (May 2026). Confirm `asyncHandler` pattern if used elsewhere in the codebase.  
  *Document findings briefly or note "no changes."*

- [ ] API‑AUDIT‑004.0.75 (AGENT): Reason about route error handling. Default: use `asyncHandler` wrapper + centralized error middleware. Do not add try/catch in every route.  
  *If uncertain, check existing route implementations for the pattern.*

- [ ] API‑AUDIT‑004.1 (AGENT): Create audit routes wired to `AuditService` with admin auth and Zod validation.  
  **File(s):** `artifacts/api-server/src/routes/audit/audit.ts`  
  **Verification:** Route file compiles; `pnpm run typecheck` clean.

- [ ] API‑AUDIT‑004.2 (AGENT): Mount `auditRouter` in main router.  
  **File(s):** `artifacts/api-server/src/routes/index.ts`  
  **Verification:** `pnpm run typecheck` clean.

- [ ] API‑AUDIT‑004.3 (AGENT): Run integration tests from API‑AUDIT‑002 to green.  
  **File(s):** [N/A — run existing tests]  
  **Verification:** `pnpm --filter @workspace/api-server test -- audit.test.ts` → all green.

- [ ] API‑AUDIT‑004.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

---

## Execution Order

```
API‑AUDIT‑001 (OpenAPI spec + codegen)
  └─> API‑AUDIT‑002 (integration tests, TDD red)
        └─> API‑AUDIT‑003 (service & repository)
              └─> API‑AUDIT‑004 (routes + green tests)
```

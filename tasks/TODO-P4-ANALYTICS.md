# TODO-P4-ANALYTICS.md – Phase 4 Analytics Context

This file covers the Analytics and Reporting backend. All endpoints require admin authentication. The service encapsulates complex aggregation logic, query caching, and multi-domain metric calculation behind a simple interface.

---

### [ ] API‑ANALYTICS‑001: Analytics – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No analytics endpoints exist in the OpenAPI spec. `lib/api-spec/openapi.yaml` has no `analytics` tag. Admins cannot create, run, or retrieve analytics reports via API.  
**Size:** Small  

**Description:** Extend the OpenAPI spec with analytics report management, on-demand report execution, and metrics endpoints, enabling codegen to produce typed hooks and Zod validators.  

**Depends on:** DB‑ANALYTICS‑001, DOMAIN‑003 (analytics feature file)  
**Blocks:** API‑ANALYTICS‑002 (integration tests require spec)  
**Related Files:** `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: [N/A — YAML spec file]
- Exports: `analytics` tag and paths in `lib/api-spec/openapi.yaml`; generated types via codegen

**Definition of Done**
- [ ] OpenAPI spec adds `analytics` tag with all paths
- [ ] `GET /analytics/reports` — list with pagination, filter by type/status
- [ ] `POST /analytics/reports` — create saved report with `query_config`
- [ ] `GET /analytics/reports/{reportId}` — report metadata and latest run data
- [ ] `POST /analytics/reports/{reportId}/run` — execute report on-demand (async job)
- [ ] `GET /analytics/reports/{reportId}/data` — paginated report results
- [ ] `GET /analytics/metrics/leads` — lead funnel metrics by stage and time range
- [ ] `GET /analytics/metrics/projects` — project progress metrics
- [ ] `GET /analytics/metrics/finance` — financial summaries (revenue, expenses)
- [ ] `GET /analytics/metrics/portal` — portal usage statistics
- [ ] All endpoints annotated with admin authentication requirement
- [ ] Schemas: `AnalyticsReport`, `AnalyticsQuery`, `MetricsResponse` in `components/schemas`
- [ ] `pnpm --filter @workspace/api-spec run codegen` succeeds with no errors
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time streaming analytics
- Scheduled report execution (P5+)
- User-level analytics (admin-only scope)

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
- Granularity: function-level — revert analytics tag/paths from `openapi.yaml`; re-run codegen
- Halt condition: if `codegen` fails or produces type errors, stop and fix spec

**Rules to Follow**
- All endpoints require admin authentication annotation
- All query endpoints must document date range filtering and pagination parameters
- Async report execution must return a job ID (not block the request)

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

**Advanced Code Patterns**
- Reuse `PaginationParams` and `DateRange` parameter components from existing spec
- Use `AsyncJobResponse` schema for the async report run endpoint

**Anti-Patterns**
- Missing admin auth annotation — security gap
- Inline schemas instead of `$ref` — breaks codegen deduplication
- Synchronous report execution endpoint — causes timeout on large datasets

**DDD / TDD / BDD / Deep Module notes**
- DDD: Analytics is a read-only projection of domain events; the spec exposes a clean query interface
- TDD: Spec must be complete before API‑ANALYTICS‑002 tests can be written
- BDD: "As an admin, I can create a leads funnel report and execute it on-demand"
- Deep Module: The spec hides complex aggregation, caching, and async execution behind simple REST endpoints

---

### Subtasks

- [ ] API‑ANALYTICS‑001.0.25 (AGENT): Read this task, `lib/api-spec/openapi.yaml` (existing structure), and `DB‑ANALYTICS‑001` schema in full.  
  *No action — pause until fully understood.*

- [ ] API‑ANALYTICS‑001.0.5 (AGENT): Research OpenAPI 3.0 patterns for analytics/reporting APIs with async job execution (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑ANALYTICS‑001.0.75 (AGENT): Reason about `AnalyticsQuery` schema shape. Default: JSON object with `filters`, `groupBy`, `dateRange`, `metrics` fields.  
  *If uncertain, use that shape.*

- [ ] API‑ANALYTICS‑001.1 (AGENT): Add analytics tag and all paths/schemas to OpenAPI with admin auth annotations.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Spec validates; admin auth requirements clearly marked.

- [ ] API‑ANALYTICS‑001.2 (AGENT): Run `pnpm --filter @workspace/api-spec run codegen` and `pnpm run typecheck`.  
  **File(s):** [N/A — generated files]  
  **Verification:** No type errors; generated types available.

- [ ] API‑ANALYTICS‑001.3 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑ANALYTICS‑002: Analytics – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No analytics integration tests exist. `artifacts/api-server/src/__tests__/api/analytics/` does not exist. All analytics endpoint tests are blocked until API‑ANALYTICS‑001 spec is complete.  
**Size:** Small  

**Description:** Write failing integration tests for all analytics endpoints (TDD red phase), including report CRUD, async execution, paginated results, and per-domain metric endpoints.  

**Depends on:** API‑ANALYTICS‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL  
**Blocks:** API‑ANALYTICS‑003 (service must satisfy these tests)
**Related Files:** `artifacts/api-server/src/__tests__/api/analytics/analytics.test.ts`  

**Imports / Exports**
- Imports: `supertest`; `createTestServer()`, `generateTestToken()` from test utilities
- Exports: [N/A — test file]

**Definition of Done**
- [ ] `artifacts/api-server/src/__tests__/api/analytics/analytics.test.ts` exists with failing tests for:
- [ ] `POST /analytics/reports` → 201, report saved with `query_config`
- [ ] `GET /analytics/reports` → 200, paginated results with filter support
- [ ] `POST /analytics/reports/{id}/run` → 200, async job ID returned
- [ ] `GET /analytics/reports/{id}/data` → 200, paginated results
- [ ] `GET /analytics/metrics/leads` → 200, funnel data by stage
- [ ] `GET /analytics/metrics/projects` → 200, progress summaries
- [ ] `GET /analytics/metrics/finance` → 200, financial summaries
- [ ] `GET /analytics/metrics/portal` → 200, portal usage statistics
- [ ] Unauthorized access (non-admin) → 403 `InsufficientPermissions`
- [ ] Invalid date range → 400 `InvalidDateRange`
- [ ] Report not found → 404 `ReportNotFound`
- [ ] Test suite compiles and runs with all tests red
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Testing report scheduling
- Performance or load testing
- End-to-end UI testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Tests must always use `TEST_DATABASE_URL`

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/analytics/analytics.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/__tests__/api/analytics/`; no DB state changes
- Halt condition: if test file fails to compile, stop and fix TypeScript errors

**Rules to Follow**
- Admin token required for all analytics endpoint tests
- Seed domain data (leads, projects, finance records) for metric endpoint tests
- Tests must be independent via `afterEach` teardown

**Verification**
```bash
pnpm --filter @workspace/api-server test -- analytics.test.ts
# Expected: all tests red
pnpm run typecheck
```

**Advanced Code Patterns**
- Seed multi-domain data (CRM, projects, finance) for metrics tests in `beforeAll`
- Verify async job ID returned — not the result itself

**Anti-Patterns**
- Writing implementation before tests — violates TDD red phase
- Missing cross-domain metric test coverage

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: This IS the red phase; all tests must fail before implementation begins
- BDD: "As an admin, I can run a leads funnel report and see data grouped by stage"
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑ANALYTICS‑002.0.25 (AGENT): Read this task, API‑ANALYTICS‑001 spec, and `TEST‑INFRA‑001` test harness documentation in full.  
  *No action — pause until fully understood.*

- [ ] API‑ANALYTICS‑002.0.5 (AGENT): Research Vitest + Supertest patterns for analytics APIs with async job returns (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑ANALYTICS‑002.0.75 (AGENT): Reason about test data strategy for multi-domain metric endpoints. Default: seed minimal records per domain in `beforeAll`.  
  *If uncertain, use direct DB seed approach.*

- [ ] API‑ANALYTICS‑002.1 (AGENT): Write all integration tests for analytics endpoints. Tests must all fail (red phase).  
  **File(s):** `artifacts/api-server/src/__tests__/api/analytics/analytics.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- analytics.test.ts` compiles and runs; all tests red.

- [ ] API‑ANALYTICS‑002.2 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑ANALYTICS‑003: Analytics – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No `AnalyticsRepository` or `AnalyticsService` exists. `lib/db/src/repositories/analytics.ts` and `artifacts/api-server/src/services/analytics/` do not exist. All analytics integration tests are failing.  
**Size:** Large  

**Description:** Implement `AnalyticsRepository` and a deep `AnalyticsService` encapsulating complex multi-domain aggregation, 15-minute result caching, and async report execution behind a simple seven-method interface.  

**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, ARCH‑001.2 (BaseRepository)  
**Blocks:** API‑ANALYTICS‑004 (routes require service)
**Related Files:** `lib/db/src/repositories/analytics.ts`, `artifacts/api-server/src/services/analytics/analytics-service.ts`  

**Imports / Exports**
- Imports: `BaseRepository` from `@workspace/db`; `drizzle-orm` (eq, and, gte, lte, sql); `AnalyticsReport` schema type
- Exports: `AnalyticsRepository` (class), `AnalyticsService` (class), `AnalyticsQuery` (type), `MetricsResponse` (type)

**Definition of Done**
- [ ] `lib/db/src/repositories/analytics.ts` exports `AnalyticsRepository` extending `BaseRepository<AnalyticsReport>` with soft delete
- [ ] `artifacts/api-server/src/services/analytics/analytics-service.ts` exports `AnalyticsService` with exactly these methods:
  - [ ] `createReport(dto)` — validates `query_config`, stores report
  - [ ] `executeReport(reportId, parameters)` — runs query against DB, caches results for 15 min
  - [ ] `getReportData(reportId, pagination)` — returns cached or fresh results
  - [ ] `getLeadsFunnel(dateRange)` — aggregates lead data by stage (org-scoped)
  - [ ] `getProjectsProgress(dateRange)` — calculates project completion metrics (org-scoped)
  - [ ] `getFinanceSummary(dateRange)` — summarises invoices and payments (org-scoped)
  - [ ] `getPortalUsage(dateRange)` — tracks portal activity (org-scoped)
- [ ] All queries are organisation-scoped
- [ ] Result cache uses per-organisation TTL (15 minutes); invalidated on report re-run
- [ ] All service methods return `Result<T, DomainError>`
- [ ] Unit tests cover all 7 methods: success paths, invalid config, org isolation, cache hit vs. miss
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time aggregation or streaming
- Scheduled report runs
- Cross-organisation data aggregation

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- All queries must be scoped by `organizationId` — never aggregate global data

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/analytics.ts`, `artifacts/api-server/src/services/analytics/analytics-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/analytics/analytics-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `lib/db/src/repositories/analytics.ts` and `artifacts/api-server/src/services/analytics/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails or org-isolation tests fail, stop and fix before proceeding

**Rules to Follow**
- Method count must be ≤ 7 (deep module principle)
- All aggregation queries must include `WHERE organization_id = $orgId`
- Cache is per-organisation, keyed by `(orgId, reportId, params)` with 15-minute TTL
- All methods return `Result<T, DomainError>` — no `throw`
- Use GROUP BY aggregation instead of N+1 queries for metric endpoints

**Verification**
```bash
pnpm --filter @workspace/api-server test -- analytics-service
pnpm run typecheck
```

**Advanced Code Patterns**
- Single-query aggregation with `GROUP BY` + `COUNT(*)` for funnel and metrics endpoints
- `Map<string, { data, expiresAt }>` in-process cache keyed by `(orgId, reportId, paramsHash)`
- `db.transaction()` for multi-step report creation + initial metadata write

**Anti-Patterns**
- Global data aggregation without org scoping — data leakage across organisations
- N+1 queries for metric calculations — use GROUP BY aggregation
- Missing cache invalidation on re-run — stale data returned
- Exception throwing in service layer — use Result pattern

**DDD / TDD / BDD / Deep Module notes**
- DDD: Analytics is a read-model projection; the service reads from multiple bounded contexts but never writes to them
- TDD: Write unit tests for org isolation and cache hit/miss before implementing queries
- BDD: "When an admin runs a finance summary for Q1, only their organisation’s data appears"
- Deep Module: 7 public methods hide complex SQL aggregation, multi-domain data joining, caching, and async job coordination

---

### Subtasks

- [ ] API‑ANALYTICS‑003.0.25 (AGENT): Read this task, `DB‑ANALYTICS‑001` schema, `ARCH‑001.2-IMPL` BaseRepository, and `analytics.test.ts` in full.  
  *No action — pause until fully understood.*

- [ ] API‑ANALYTICS‑003.0.5 (AGENT): Research Drizzle ORM multi-table GROUP BY aggregation patterns and in-process caching strategies for ESM Node.js (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑ANALYTICS‑003.0.75 (AGENT): Reason about cache key strategy for metric endpoints. Default: `(orgId, metricType, dateRangeHash)` — simple and avoids key collisions.  
  *If uncertain, use that approach.*

- [ ] API‑ANALYTICS‑003.1 (AGENT): Implement `AnalyticsRepository` with soft delete.  
  **File(s):** `lib/db/src/repositories/analytics.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] API‑ANALYTICS‑003.2 (AGENT): Implement `AnalyticsService` with all 7 methods, org scoping, and caching.  
  **File(s):** `artifacts/api-server/src/services/analytics/analytics-service.ts`  
  **Verification:** Unit tests with mocked repository and cache pass.

- [ ] API‑ANALYTICS‑003.3 (AGENT): Write unit tests for all 7 service methods (success + error + org isolation + cache hit/miss).  
  **File(s):** `artifacts/api-server/src/__tests__/services/analytics/analytics-service.test.ts`  
  **Verification:** All tests green.

- [ ] API‑ANALYTICS‑003.4 (AGENT): Verify method count ≤ 7 and no `throw` in service layer.  
  **File(s):** [N/A — inspection]  
  **Verification:** `pnpm run typecheck` clean; manual inspection confirms constraints.

- [ ] API‑ANALYTICS‑003.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑ANALYTICS‑004: Analytics – Routes & Green Tests
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No analytics routes exist. `artifacts/api-server/src/routes/analytics/` does not exist. Integration tests from API‑ANALYTICS‑002 are all failing (red).  
**Size:** Small  

**Description:** Wire analytics routes with admin auth middleware and Zod validation, turning the API‑ANALYTICS‑002 integration tests from red to green.  

**Depends on:** API‑ANALYTICS‑003 (service), AUTH‑008 (admin auth middleware), ERROR‑001  
**Blocks:** [N/A — final phase of analytics implementation]
**Related Files:** `artifacts/api-server/src/routes/analytics/analytics.ts`, `artifacts/api-server/src/routes/index.ts`  

**Imports / Exports**
- Imports: `express` (Router); `AnalyticsService`; `adminAuthMiddleware`; generated Zod schemas
- Exports: `analyticsRouter` (Express Router)

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/analytics/analytics.ts` exports `analyticsRouter` with all 10 endpoints wired
- [ ] All routes protected by `adminAuthMiddleware`
- [ ] Request validation uses generated Zod schemas from `lib/api-zod/src/generated/`
- [ ] Routes delegate to `AnalyticsService` methods
- [ ] `analyticsRouter` mounted at `/analytics` in `routes/index.ts`
- [ ] All integration tests from API‑ANALYTICS‑002 pass (green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Report scheduling routes (P5+)
- WebSocket streaming of analytics data

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/analytics/analytics.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A — existing tests from API‑ANALYTICS‑002 must turn green]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/routes/analytics/`; revert `routes/index.ts` mount
- Halt condition: if integration tests do not turn green after route wiring, stop and debug service integration

**Rules to Follow**
- All analytics routes must be protected by `adminAuthMiddleware`
- Use generated Zod schemas for validation; do not write custom schemas
- Use `asyncHandler` wrapper to avoid try/catch in every route handler

**Verification**
```bash
pnpm --filter @workspace/api-server test -- analytics.test.ts
# Expected: all tests green
pnpm run typecheck
```

**Advanced Code Patterns**
- Route handlers delegate entirely to `AnalyticsService` — zero business logic in routes
- `asyncHandler` wrapper for all routes

**Anti-Patterns**
- Business logic in route handlers — belongs in `AnalyticsService`
- Missing admin auth middleware — exposes sensitive analytical data

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are the thin API layer of the Analytics bounded context
- TDD: This is the green phase; routes must make API‑ANALYTICS‑002 tests pass
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑ANALYTICS‑004.0.25 (AGENT): Read this task, `analytics.test.ts`, `AnalyticsService` implementation, and `routes/index.ts` structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑ANALYTICS‑004.0.5 (AGENT): Confirm `asyncHandler` wrapper pattern is consistent with other analytics routes (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑ANALYTICS‑004.0.75 (AGENT): Reason about the number of route files needed. Default: single `analytics.ts` file for all 10 endpoints to reduce navigation overhead.  
  *If uncertain, prefer a single file.*

- [ ] API‑ANALYTICS‑004.1 (AGENT): Create analytics routes wired to `AnalyticsService` with admin auth.  
  **File(s):** `artifacts/api-server/src/routes/analytics/analytics.ts`  
  **Verification:** Route file compiles; `pnpm run typecheck` clean.

- [ ] API‑ANALYTICS‑004.2 (AGENT): Mount `analyticsRouter` in main router.  
  **File(s):** `artifacts/api-server/src/routes/index.ts`  
  **Verification:** `pnpm run typecheck` clean.

- [ ] API‑ANALYTICS‑004.3 (AGENT): Run integration tests from API‑ANALYTICS‑002 to green.  
  **File(s):** [N/A — run existing tests]  
  **Verification:** `pnpm --filter @workspace/api-server test -- analytics.test.ts` → all green.

- [ ] API‑ANALYTICS‑004.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
API‑ANALYTICS‑001 (OpenAPI spec + codegen)
  └─> API‑ANALYTICS‑002 (integration tests, TDD red)
        └─> API‑ANALYTICS‑003 (service & repository)
              └─> API‑ANALYTICS‑004 (routes + green tests)
```

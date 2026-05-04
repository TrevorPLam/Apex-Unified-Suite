# TODO-P4-ANALYTICS.md – Phase 4 Analytics Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Analytics and Reporting backend. All endpoints require admin authentication (firm JWT with admin role). The service encapsulates complex aggregation logic behind a simple interface.

---

## Analytics Context

*This section builds the Analytics and Reporting backend. All endpoints require admin authentication (firm JWT with admin role). The service encapsulates complex aggregation logic behind a simple interface.*

### [ ] API‑ANALYTICS‑001: Analytics – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ANALYTICS‑001, DOMAIN‑003 (analytics feature file).  
**Definition of Done:** OpenAPI spec adds `analytics` tag and paths with comprehensive schemas:  
- `GET /analytics/reports` – list saved reports with pagination, filter by type, status  
- `POST /analytics/reports` – create new saved report (name, description, query_config)  
- `GET /analytics/reports/{reportId}` – get report metadata and latest run data  
- `POST /analytics/reports/{reportId}/run` – execute report on‑demand (async)  
- `GET /analytics/reports/{reportId}/data` – get report results with pagination  
- `GET /analytics/dashboards/{dashboardId}` – get dashboard configuration and data  
- `GET /analytics/metrics/leads` – lead funnel metrics (by stage, time range)  
- `GET /analytics/metrics/projects` – project progress metrics  
- `GET /analytics/metrics/finance` – financial summaries (revenue, expenses)  
- `GET /analytics/metrics/portal` – portal usage statistics  

All endpoints require admin authentication (firm JWT with admin role).  
Schemas: `AnalyticsReport`, `AnalyticsQuery`, `DashboardConfig`, `MetricsResponse`.  
Examples included for each endpoint.  
**Performance:** All query endpoints support date range filtering and pagination with default limits.

**Subtasks:**
- [ ] API‑ANALYTICS‑001.1: Add analytics tag and all paths to OpenAPI with admin auth annotation. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; admin auth requirements clearly marked.
- [ ] API‑ANALYTICS‑001.2: Define comprehensive schemas for reports, queries, and metrics. (AGENT)  
  **verification:** Generated types compile without errors.
- [ ] API‑ANALYTICS‑001.3: Add example request/response bodies for all endpoints. (AGENT)  
  **verification:** Swagger UI renders examples correctly.
- [ ] API‑ANALYTICS‑001.4: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors; generated hooks available.

---

### [ ] API‑ANALYTICS‑002: Analytics – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api-server/__tests__/api/analytics/analytics.test.ts` contains failing tests for:  
- `POST /analytics/reports` → 201, report saved with query_config  
- `GET /analytics/reports` → 200, pagination, filter by type  
- `POST /analytics/reports/{id}/run` → 200, async job queued  
- `GET /analytics/reports/{id}/data` → 200, paginated results  
- `GET /analytics/metrics/leads` → 200, funnel data by stage  
- `GET /analytics/metrics/projects` → 200, progress summaries  
- `GET /analytics/metrics/finance` → 200, financial summaries  
- `GET /analytics/metrics/portal` → 200, portal usage statistics  
- Unauthorized access (non‑admin) → 403 `InsufficientPermissions`  
- Invalid date range → 400 `InvalidDateRange`  
- Report not found → 404 `ReportNotFound`

**Subtasks:**
- [ ] API‑ANALYTICS‑002.1: Write integration tests for all analytics endpoints. (AGENT)  
  **verification:** Test suite compiles and runs, all red (no routes exist).

---

### [ ] API‑ANALYTICS‑003: Analytics – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002 (Analytics errors), ARCH‑001.2 (BaseRepository).  
**Definition of Done:**  
- `lib/db/src/repositories/analytics.ts` exports `AnalyticsRepository` extending `BaseRepository<AnalyticsReport>` with soft delete support.  
- `artifacts/api-server/src/services/analytics/analytics-service.ts` exports `AnalyticsService` with methods:  
  - `createReport(dto)` – validates query_config, stores report  
  - `executeReport(reportId, parameters)` – runs query against database, caches results  
  - `getReportData(reportId, pagination)` – returns cached or fresh results  
  - `getLeadsFunnel(dateRange)` – aggregates lead data by stage  
  - `getProjectsProgress(dateRange)` – calculates project completion metrics  
  - `getFinanceSummary(dateRange)` – summarizes invoices and payments  
  - `getPortalUsage(dateRange)` – tracks portal activity  
- All queries use organization‑scoped data aggregation  
- Methods return `Either<DomainError, Result>`  
- **Caching:** Report results cached for 15 minutes to improve performance  
**Deep Module:** Service encapsulates complex aggregation logic, query optimization, and caching strategy behind simple interface

**Rules to Follow:**
- All aggregation queries must be organization-scoped
- Cache invalidation on data changes
- Query optimization for large datasets
- Result pagination for performance
- Admin authorization required

**Advanced Code Patterns:**
- Complex SQL aggregation patterns
- Multi-level caching strategy
- Query result optimization
- Organization data isolation

**Anti-Patterns:**
- Global data aggregation (no scoping)
- Missing pagination on large datasets
- Inefficient queries (N+1 problems)
- Missing cache invalidation

**Subtasks:**
- [ ] API‑ANALYTICS‑003.1: Implement `AnalyticsRepository` with soft delete. (AGENT) – `lib/db/src/repositories/analytics.ts`  
  **verification:** Unit tests for repository pass.
- [ ] API‑ANALYTICS‑003.2: Implement `AnalyticsService` with aggregation logic and caching. (AGENT) – `services/analytics/analytics-service.ts`  
  **verification:** Unit tests with mocked DB pass.
- [ ] API‑ANALYTICS‑003.3: Write unit tests for all service methods (success + error paths). (AGENT)  
  **verification:** All tests green.
- [ ] API‑ANALYTICS‑003.4: Depth refactor check: method count ≤ 8, service encapsulates aggregation complexity, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

**Rules to Follow:**
- Method count limited to 8 for maintainability
- Service must encapsulate multiple aggregation concerns
- All methods return Result<T, DomainError>
- No exception throwing in service layer
- Organization scoping enforced in all queries

**Advanced Code Patterns:**
- Deep module encapsulation
- Result pattern for error handling
- Caching strategy implementation
- Complex aggregation queries

**Anti-Patterns:**
- Shallow service with single aggregation type
- Exception-based error handling
- Missing organization scoping
- Direct database access without abstraction

---

### [ ] API‑ANALYTICS‑004: Analytics – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑003, AUTH‑008, ERROR‑001.  
**Definition of Done:** Routes wired with admin auth middleware, validation using generated Zod schemas. Integration tests from API‑ANALYTICS‑002 turn green.

**Subtasks:**
- [ ] API‑ANALYTICS‑004.1: Create analytics routes with admin auth and validation. (AGENT) – `routes/analytics/analytics.ts`  
  **verification:** Route tests with mocked service pass.
- [ ] API‑ANALYTICS‑004.2: Add analytics router to main app. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` clean.
- [ ] API‑ANALYTICS‑004.3: Run integration tests to green. (AGENT)  
  **verification:** All tests from API‑ANALYTICS‑002 pass.

---

## Progress Tracking

### Overall Status
**Analytics Context:** [ ] 0/4 parent tasks complete

### Context Breakdown
- **Analytics API:** [ ] 0/1 complete (OpenAPI spec)
- **Analytics Tests:** [ ] 0/1 complete (integration tests)
- **Analytics Service:** [ ] 0/1 complete (service & repository)
- **Analytics Routes:** [ ] 0/1 complete (routes & green tests)

### Dependencies
- **DB-ANALYTICS-001** enables analytics database operations
- **DOMAIN-003** provides analytics feature specifications
- **ERROR-002** enables proper error handling
- **AUTH-008** enables admin authentication
- **ARCH-001.2** provides BaseRepository pattern

### Next Actions
- [ ] Start API-ANALYTICS-001.1: Add analytics paths to OpenAPI
- [ ] Start API-ANALYTICS-002.1: Write integration tests (red)
- [ ] Start API-ANALYTICS-003.1: Implement AnalyticsRepository

### Verification Commands
```bash
# Analytics verification
pnpm test -- analytics
pnpm typecheck

# Service verification
pnpm test -- analytics-service
pnpm typecheck

# Routes verification
pnpm test -- analytics-routes
pnpm typecheck
```

---

## File Index

### Analytics Backend
- `lib/api-spec/openapi.yaml` - Analytics OpenAPI paths and schemas
- `artifacts/api-server/src/services/analytics/analytics-service.ts` - Analytics aggregation service
- `lib/db/src/repositories/analytics.ts` - Analytics repository
- `routes/analytics/analytics.ts` - Analytics routes
- `artifacts/api-server/__tests__/api/analytics/analytics.test.ts` - Integration tests

### Analytics Components
- `artifacts/api-server/src/services/analytics/` - Analytics service modules:
  - `report-service.ts` - Report management
  - `metrics-service.ts` - Metrics calculation
  - `cache-service.ts` - Result caching

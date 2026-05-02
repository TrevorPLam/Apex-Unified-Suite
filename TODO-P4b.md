This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

# Phase 4b – API Business Logic: Analytics & Settings

*This phase completes the API surface for Analytics and System Settings bounded contexts, building on the established patterns from previous phases: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission. These contexts provide critical reporting and configuration capabilities for the entire platform.*

---

## Phase 4b Task Index

**Analytics Context**  
• API‑ANALYTICS‑001 – Analytics – Expand OpenAPI Spec  
• API‑ANALYTICS‑002 – Analytics – Integration Tests (TDD Red)  
• API‑ANALYTICS‑003 – Analytics – Service & Repository (Deep Module)  
• API‑ANALYTICS‑004 – Analytics – Routes & Green Tests  

**System Configuration Context**  
• API‑SETTINGS‑001 – System Settings – Expand OpenAPI Spec  
• API‑SETTINGS‑002 – System Settings – Integration Tests (TDD Red)  
• API‑SETTINGS‑003 – System Settings – Service & Repository (Deep Module)  
• API‑SETTINGS‑004 – System Settings – Routes & Green Tests  

**Cross‑Cutting Audit & Monitoring**  
• API‑AUDIT‑001 – Audit Log Query – Expand OpenAPI Spec  
• API‑AUDIT‑002 – Audit Log Query – Integration Tests (TDD Red)  
• API‑AUDIT‑003 – Audit Log Query – Service & Repository  
• API‑AUDIT‑004 – Audit Log Query – Routes & Green Tests  

---

## Analytics Context

### API‑ANALYTICS‑001: Analytics – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ANALYTICS‑001, DOMAIN‑003 (analytics feature file).  
**Definition of Done:** OpenAPI spec adds `analytics` tag and paths with comprehensive schemas:  
- `GET /analytics/reports` – list saved reports with pagination, filter by type, status  
- `POST /analytics/reports` – create new saved report (name, description, query_config)  
- `GET /analytics/reports/{reportId}` – get report metadata and latest run data  
- `POST /analytics/reports/{reportId}/run` – execute report on-demand (async)  
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

### API‑ANALYTICS‑002: Analytics – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api-server/__tests__/api/analytics/analytics.test.ts` contains failing tests for:  
- `POST /analytics/reports` → 201, report saved with query_config  
- `GET /analytics/reports` → 200, pagination, filter by type  
- `POST /analytics/reports/{id}/run` → 200, async job queued  
- `GET /analytics/reports/{id}/data` → 200, paginated results  
- `GET /analytics/metrics/leads` → 200, funnel data by stage  
- `GET /analytics/metrics/projects` → 200, progress summaries  
- Unauthorized access (non-admin) → 403 `InsufficientPermissions`  
- Invalid date range → 400 `InvalidDateRange`  
- Report not found → 404 `ReportNotFound`

**Subtasks:**
- [ ] API‑ANALYTICS‑002.1: Write integration tests for all analytics endpoints. (AGENT)  
  **verification:** Test suite compiles and runs, all red (no routes exist).

---

### API‑ANALYTICS‑003: Analytics – Service & Repository (Deep Module)
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
- All queries use organization-scoped data aggregation  
- Methods return `Either<DomainError, Result>`  
- **Caching:** Report results cached for 15 minutes to improve performance  
- **Deep Module:** Service hides complex SQL aggregation logic behind simple interface

**Subtasks:**
- [ ] API‑ANALYTICS‑003.1: Implement `AnalyticsRepository` with soft delete. (AGENT) – `lib/db/src/repositories/analytics.ts`  
  **verification:** Unit tests for repository pass.
- [ ] API‑ANALYTICS‑003.2: Implement `AnalyticsService` with aggregation logic and caching. (AGENT) – `analytics-service.ts`  
  **verification:** Unit tests with mocked DB pass.
- [ ] API‑ANALYTICS‑003.3: Write unit tests for all service methods (success + error paths). (AGENT)  
  **verification:** All tests green.
- [ ] API‑ANALYTICS‑003.4: Depth refactor check: method count ≤ 8, service encapsulates aggregation complexity, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

---

### API‑ANALYTICS‑004: Analytics – Routes & Green Tests
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

## System Configuration Context

### API‑SETTINGS‑001: System Settings – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑SETTINGS‑001, DB‑SETTINGS‑002.  
**Definition of Done:** OpenAPI spec adds `settings` tag and paths:  
- `GET /settings` – list all key-value settings (admin only)  
- `GET /settings/public` – list public settings (no auth required)  
- `PUT /settings/{key}` – update setting value (admin only)  
- `POST /settings/bulk-update` – update multiple settings atomically (admin only)  
- `GET /settings/audit` – get audit log of setting changes (admin only)  

Schemas: `SystemSetting`, `SettingUpdate`, `BulkUpdateRequest`, `SettingAuditEntry`.  
**Caching:** Public settings endpoint includes cache headers (15 minutes).  
**Audit:** All changes logged with user context and timestamp.

**Subtasks:**
- [ ] API‑SETTINGS‑001.1: Add settings paths and schemas to OpenAPI with auth annotations. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; admin vs public access clearly marked.
- [ ] API‑SETTINGS‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### API‑SETTINGS‑002: System Settings – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑001, TEST‑INFRA‑001.  
**Definition of Done:** `artifacts/api-server/__tests__/api/settings/settings.test.ts` contains failing tests for:  
- `GET /settings/public` → 200, cache headers present  
- `PUT /settings/{key}` (admin) → 200, audit log entry created  
- `POST /settings/bulk-update` → 200, all settings updated atomically  
- Unauthorized setting update → 403 `InsufficientPermissions`  
- Invalid setting key → 400 `ConfigurationError`  
- Setting not found → 404 `ConfigurationError`

**Subtasks:**
- [ ] API‑SETTINGS‑002.1: Write integration tests for all settings endpoints. (AGENT)  
  **verification:** Tests compile and run, all red.

---

### API‑SETTINGS‑003: System Settings – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, ARCH‑001.2.  
**Definition of Done:**  
- `lib/db/src/repositories/settings.ts` exports `SettingsRepository` extending `BaseRepository<SystemSetting>`.  
- `artifacts/api-server/src/services/settings/settings-service.ts` exports `SettingsService` with methods:  
  - `getPublicSettings()` – returns non-sensitive settings with caching  
  - `updateSetting(key, value, userId)` – validates setting exists, updates, emits `SettingChanged` event  
  - `bulkUpdate(updates, userId)` – atomic transaction, emits events for each change  
  - `getSettingAudit(key?, dateRange?)` – paginated audit log  
- **Validation:** Setting keys validated against allowed keys schema  
- **Caching:** Public settings cached in memory for 15 minutes  
- **Events:** Emits `SettingChanged` for audit trail  
- **Deep Module:** Service hides validation, caching, and audit complexity

**Subtasks:**
- [ ] API‑SETTINGS‑003.1: Implement `SettingsRepository` with audit support. (AGENT) – `lib/db/src/repositories/settings.ts`  
  **verification:** Unit tests pass.
- [ ] API‑SETTINGS‑003.2: Implement `SettingsService` with validation, caching, and events. (AGENT) – `settings-service.ts`  
  **verification:** Unit tests with mocked cache and event bus pass.
- [ ] API‑SETTINGS‑003.3: Write unit tests for all service methods. (AGENT)  
  **verification:** All tests green.
- [ ] API‑SETTINGS‑003.4: Depth refactor check: method count ≤ 6, service encapsulates validation/caching/audit. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

---

### API‑SETTINGS‑004: System Settings – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑003, AUTH‑008.  
**Subtasks:** routes with admin auth, integration tests green.

---

## Cross-Cutting Audit & Monitoring

### API‑AUDIT‑001: Audit Log Query – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑SETTINGS‑002 (audit logs table).  
**Definition of Done:** OpenAPI spec adds `audit` tag and paths:  
- `GET /audit/logs` – list audit logs with pagination, filter by context, action, date range, user  
- `GET /audit/logs/{logId}` – get specific audit log entry  
- `GET /audit/summary` – get audit statistics (counts by action, by context)  
- `POST /audit/export` – export audit logs to CSV (async job)  

All endpoints require admin authentication.  
Performance optimized with database indexes and pagination limits.

**Subtasks:**
- [ ] API‑AUDIT‑001.1: Add audit paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates with admin auth requirements.
- [ ] API‑AUDIT‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### API‑AUDIT‑002: Audit Log Query – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑AUDIT‑001, TEST‑INFRA‑001.  
**Definition of Done:** Failing tests for audit log retrieval, filtering, pagination, and export functionality.

**Subtasks:**
- [ ] API‑AUDIT‑002.1: Write integration tests for audit endpoints. (AGENT)  
  **verification:** Tests compile and run, all red.

---

### API‑AUDIT‑003: Audit Log Query – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2.  
**Definition of Done:**  
- `AuditRepository` extending `BaseRepository<AuditLog>` (no soft delete, append-only)  
- `AuditService` with methods for querying, filtering, and exporting audit logs  
- Optimized queries using database indexes on `(organization_id, created_at)`, `(action)`, `(context)`

**Subtasks:**
- [ ] API‑AUDIT‑003.1: Implement repository and service for audit logs. (AGENT)  
  **verification:** Unit tests pass.

---

### API‑AUDIT‑004: Audit Log Query – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑AUDIT‑003, AUTH‑008.  
**Subtasks:** routes with admin auth, integration tests green.

---

*End of Phase 4b. Next: Phase 5 – Frontend Integration & Testing Infrastructure*

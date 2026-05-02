# TODO-P3-SERVICES.md – Phase 3: Cross‑Cutting Infrastructure APIs

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the Cross‑Cutting Infrastructure APIs that serve all other contexts – In‑App Notifications, Cross‑Module Search, and CSV Import/Export. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Cross‑Cutting Infrastructure APIs

### [ ] API‑NOTIF‑001: In‑App Notification Endpoints
**Status:** ⏳ Not Started  
**Depends on:** DB‑NOTIF‑001, AUTH‑008 (auth middleware).  
**Blocks:** FRONT‑NOTIF‑001.  
**Definition of Done:** In‑app notification delivery and management:  
- `GET /api/v1/notifications` – list notifications for the authenticated user, filter by `is_read`, `type`, paginated. Ordered by `created_at` descending.  
- `GET /api/v1/notifications/unread‑count` – returns count of unread notifications.  
- `PATCH /api/v1/notifications/{notificationId}/read` – mark a single notification as read.  
- `POST /api/v1/notifications/mark‑all‑read` – mark all notifications as read for the current user.  
- `GET /api/v1/notifications/preferences` – get user notification preferences.  
- `PUT /api/v1/notifications/preferences` – update preferences (e.g., which types to receive, quiet hours).  
**Integration tests:** list notifications, mark read, mark all read, get unread count, update preferences.  
**DDD:** Infrastructure service consumed by all bounded contexts.  
**TDD:** Write tests before implementation; all start red.  
**Deep Module:** Encapsulates delivery, read‑state management, and preference filtering.

### Subtasks:
- [ ] API‑NOTIF‑001.1: Add notification paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; codegen passes.
- [ ] API‑NOTIF‑001.2: Write integration tests for all notification endpoints. (AGENT) – `artifacts/api‑server/__tests__/api/notifications.test.ts`  
  **verification:** Tests fail (red).
- [ ] API‑NOTIF‑001.3: Implement `NotificationService` and `NotificationRepository`. (AGENT) – `artifacts/api-server/src/services/notifications/notification‑service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑NOTIF‑001.4: Create notification routes with auth middleware. (AGENT) – `routes/notifications.ts`  
  **verification:** Route tests pass.
- [ ] API‑NOTIF‑001.5: Run integration tests to green. (AGENT)  
  **verification:** All notification tests pass.

---

### [ ] API‑SEARCH‑001: Cross‑Module Search Endpoint
**Status:** ⏳ Not Started  
**Depends on:** DB‑SEARCH‑001, AUTH‑008, all CRUD APIs (for populating search index).  
**Blocks:** FRONT‑SEARCH‑001.  
**Definition of Done:** Unified search endpoint:  
- `GET /api/v1/search?q={query}&modules={lead,contact,company,deal,project,task,document,invoice}&page=1&limit=20` – searches across configured entity types, returns results grouped by module with relevance ranking.  
- Search index populated on entity create/update/delete via domain event subscribers.  
- Organisation‑scoped: only returns results for the user's organisation.  
- Supports full‑text search using PostgreSQL `tsvector` (or external engine if configured).  
**Integration tests:** search for a known term, verify results across modules, verify organisation isolation, empty query returns empty, pagination.  
**DDD:** Infrastructure service that reads from a materialised search index.  
**TDD:** Write tests before implementation.  
**Deep Module:** Encapsulates query construction, relevance ranking, and cross‑module result aggregation.

### Subtasks:
- [ ] API‑SEARCH‑001.1: Add search endpoint to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑SEARCH‑001.2: Write integration tests with known seed data. (AGENT) – `artifacts/api‑server/__tests__/api/search.test.ts`  
  **verification:** Red.
- [ ] API‑SEARCH‑001.3: Implement `SearchService` with PostgreSQL full‑text search (or adapter for chosen engine). (AGENT) – `artifacts/api-server/src/services/search/search‑service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑SEARCH‑001.4: Implement event subscribers that update `search_index` on entity create/update/delete. (AGENT)  
  **verification:** Unit tests with mock event bus.
- [ ] API‑SEARCH‑001.5: Create search route and run integration tests to green. (AGENT)

---

### [ ] API‑IMPORT‑001: CSV Import/Export Service Endpoints
**Status:** ⏳ Not Started  
**Depends on:** AUTH‑008, any domain CRUD APIs that support import/export.  
**Blocks:** FRONT‑IMPORT‑001.  
**Definition of Done:** Generic import/export pipeline:  
- `POST /api/v1/import/{entityType}` – accept CSV file upload, validate headers against target schema, return preview with mapped columns and error rows (dry‑run mode by default).  
- `POST /api/v1/import/{entityType}/execute?importId={importId}` – execute a previously previewed import.  
- `GET /api/v1/import/{entityType}/history` – paginated list of past imports with status, row counts, error links.  
- `GET /api/v1/export/{entityType}?columns=name,email&format=csv` – export data from any list resource with selected columns and optional filtering.  
- Import supports: leads, contacts, companies, tasks, time entries, vendors, customers. Each entity type has a configurable column mapping.  
**Integration tests:** upload CSV (preview), execute import, verify entities created, export entities, verify CSV content. Import with errors → error report generated.  
**DDD:** Infrastructure service for bulk data operations across contexts.  
**TDD:** Write tests before implementation.  
**Deep Module:** Encapsulates file parsing, validation, column mapping, and transactional import.

### Subtasks:
- [ ] API‑IMPORT‑001.1: Add import/export paths and schemas to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑IMPORT‑001.2: Write integration tests for import (preview, execute, error handling) and export. (AGENT)  
  **verification:** Red.
- [ ] API‑IMPORT‑001.3: Implement `ImportService` with CSV parsing, validation, column mapping, and transactional execution. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑IMPORT‑001.4: Implement `ExportService` with dynamic column selection and CSV generation. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑IMPORT‑001.5: Create import/export routes and run integration tests to green. (AGENT)

---

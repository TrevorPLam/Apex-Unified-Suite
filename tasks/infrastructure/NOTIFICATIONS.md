# tasks/infrastructure/NOTIFICATIONS.md – Notifications, Search & Import/Export Infrastructure

This file contains the cross‑cutting API tasks for in‑app notifications, cross‑module search, and CSV import/export services. These are infrastructure APIs that serve all bounded contexts and must be built on top of the database schemas defined in `DATABASE.md`.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Backlog Additions – 2026‑05‑05

| Task ID | Description | Depends On |
|---------|-------------|------------|
| FRONT‑NOTIF‑001 | Notification bell with unread badge, dropdown list, and mark-all-read | `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001` |

### Subtasks
- [ ] FRONT‑NOTIF‑001.1 (AGENT): Design the bell component, unread state, and navigation behavior.

---

## [ ] API‑NOTIF‑001: In‑App Notification Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No notification infrastructure exists; users have no way to receive in‑app alerts for domain events (lead assigned, invoice paid, task due, etc.).
**Size:** Large

**Description:** Build the full notification pipeline: OpenAPI spec, `NotificationService` (deep module), repository, and routes with auth middleware — delivering per‑user, filterable, paginated in‑app notifications with read‑state management and per‑type preference controls.

**Depends on:** `infrastructure/DATABASE.md → DB‑NOTIF‑001`, `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** Frontend notification bell component (Phase 5)
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/notifications/notification‑service.ts`, `lib/db/src/repositories/notifications.ts`, `artifacts/api‑server/src/routes/notifications.ts`

**Definition of Done**
- [ ] OpenAPI spec includes all notification paths under `/api/v1/notifications` with `Notification`, `NotificationPreferences` schemas and examples
- [ ] `GET /api/v1/notifications` — paginated, filterable by `is_read` and `type`, ordered by `created_at` desc
- [ ] `GET /api/v1/notifications/unread‑count` — returns `{ count: number }`
- [ ] `PATCH /api/v1/notifications/{notificationId}/read` — marks single notification read (idempotent)
- [ ] `POST /api/v1/notifications/mark‑all‑read` — marks all user notifications read atomically
- [ ] `GET /api/v1/notifications/preferences` — returns user’s notification type preferences
- [ ] `PUT /api/v1/notifications/preferences` — updates preferences (which types, quiet hours)
- [ ] `NotificationService` returns `Result<T, DomainError>` using `neverthrow`; no `throw`
- [ ] `NotificationRepository` enforces user‑scoping on all queries
- [ ] All integration tests pass (list, mark‑read, mark‑all‑read, unread‑count, preferences)
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Push notifications (browser push, mobile push) — future phase
- Email/SMS notification delivery — future phase
- Real‑time delivery via WebSocket/SSE (polling model only at this phase)
- Notification batching or digest emails

**Rules to Follow**
- All repository queries MUST include `WHERE user_id = $userId` to prevent data leakage
- `mark‑all‑read` must be a single atomic UPDATE, not per‑row operations
- Pagination default: `limit=20`, max `limit=100`, response envelope `{ data, meta: { page, limit, total, totalPages } }`

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/notifications.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Notifications are an infrastructure cross‑cutting concern, produced by domain events and consumed by the UI layer.
- TDD: Write integration tests before implementation. All must fail (404) initially. Green phase after service and routes are implemented.
- BDD: “When a lead is assigned to me, a notification appears in my notification bell within one page refresh.”
- Deep Module: `NotificationService` hides read‑state management, preference filtering, pagination, and user‑scoping behind 5 public methods.

---

### Subtasks
- [ ] API‑NOTIF‑001.0.25 (AGENT): Read API‑NOTIF‑001, DB‑NOTIF‑001 schema, EVENT‑001 event types. Note which domain events should produce notifications. *No action – pause.*
- [ ] API‑NOTIF‑001.0.5 (AGENT): Research notification API design patterns, quiet‑hours preference implementation, and atomic mark‑all‑read approaches. *Document findings briefly.*
- [ ] API‑NOTIF‑001.1 (AGENT): Add notification paths and schemas to OpenAPI spec with examples.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm --filter @workspace/api‑spec run codegen` ; `pnpm typecheck`
- [ ] API‑NOTIF‑001.2 (AGENT): Write integration tests for all endpoints (list, unread‑count, mark‑read, mark‑all‑read, preferences GET/PUT).
  **File(s):** `artifacts/api‑server/__tests__/api/notifications.test.ts`
  **Verification:** `pnpm test -- notifications.test.ts` all fail with 404 (red phase)
- [ ] API‑NOTIF‑001.3 (AGENT): Implement `NotificationRepository` with user‑scoped queries.
  **File(s):** `lib/db/src/repositories/notifications.ts`
  **Verification:** `pnpm test -- notifications.repository.test.ts` CRUD tests pass
- [ ] API‑NOTIF‑001.4 (AGENT): Implement `NotificationService` with all 5 methods returning `Result<T, DomainError>`.
  **File(s):** `artifacts/api‑server/src/services/notifications/notification‑service.ts`
  **Verification:** `pnpm test -- notification‑service.test.ts` unit tests pass
- [ ] API‑NOTIF‑001.5 (AGENT): Create notification routes with auth middleware and Zod validation; mount under `/api/v1/notifications`.
  **File(s):** `artifacts/api‑server/src/routes/notifications.ts`, `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm test -- notifications.test.ts` all green
- [ ] API‑NOTIF‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] API‑SEARCH‑001: Cross‑Module Search Endpoint
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No unified search exists; users must navigate to each module separately to find records. Search index table does not yet exist.
**Size:** Large

**Description:** Implement a single `GET /api/v1/search` endpoint that queries a materialised `search_index` table (populated by domain event subscribers) and returns organisation‑scoped, relevance‑ranked results grouped by entity type across all modules.

**Depends on:** `infrastructure/DATABASE.md → DB‑SEARCH‑001`, `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, all domain CRUD APIs
**Blocks:** Frontend global search UI component (Phase 5)
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/search/search‑service.ts`, `artifacts/api‑server/src/services/search/index‑subscribers.ts`, `artifacts/api‑server/src/routes/search.ts`

**Definition of Done**
- [ ] OpenAPI spec includes `GET /api/v1/search?q={query}&modules={csv}&page=1&limit=20` with `SearchResult` schema and examples
- [ ] Search is organisation‑scoped: `WHERE organization_id = $orgId` in all queries
- [ ] Full‑text search using PostgreSQL `tsvector` + `tsquery` with `ts_rank` for relevance ranking
- [ ] Results grouped by module in response: `{ data: { leads: [], contacts: [], ... }, meta: { ... } }`
- [ ] `modules` filter param accepts comma‑separated values; default: all modules
- [ ] Event subscribers update the `search_index` on entity `create`, `update`, `delete` domain events
- [ ] Integration tests: search for known seed term, verify results across modules, org isolation, empty query → 400, pagination
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Fuzzy/phonetic matching
- Search result personalisation or ML ranking
- Real‑time search index (event‑driven near‑real‑time is acceptable)
- Cross‑organisation federated search

**Rules to Follow**
- `organization_id` predicate is non‑negotiable on every search query
- Empty or whitespace‑only `q` returns 400 `InvalidSearchQuery`
- Index subscriber failures must be logged and silently swallowed
- `modules` param defaults to all modules; unknown module names are ignored
- Minimum query length: 2 characters

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/search.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `SearchService` is infrastructure — it reads from a materialised view (the search_index) without owning domain logic.
- TDD: Write integration tests with known seed data before implementing the service.
- BDD: “As a user, I can type ‘Acme’ in the global search box and see matching leads, contacts, and companies in one list.”
- Deep Module: `SearchService.search({ query, modules, orgId, page, limit })` hides full‑text SQL, module filtering, and ranking.

---

### Subtasks
- [ ] API‑SEARCH‑001.0.25 (AGENT): Read API‑SEARCH‑001, DB‑SEARCH‑001 schema, EVENT‑001 event types. Identify all entity types to be indexed. *No action – pause.*
- [ ] API‑SEARCH‑001.0.5 (AGENT): Research PostgreSQL `tsvector`/`tsquery` performance, GIN index configuration, and `ts_rank` vs `ts_rank_cd`. *Document findings briefly.*
- [ ] API‑SEARCH‑001.1 (AGENT): Add search endpoint to OpenAPI spec with `SearchResult` schema and examples.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑SEARCH‑001.2 (AGENT): Write integration tests with known seed data for all scenarios (module filter, org isolation, pagination, empty query).
  **File(s):** `artifacts/api‑server/__tests__/api/search.test.ts`
  **Verification:** `pnpm test -- search.test.ts` all fail with 404 (red phase)
- [ ] API‑SEARCH‑001.3 (AGENT): Implement `SearchService` with PostgreSQL full‑text search and `ts_rank` ordering.
  **File(s):** `artifacts/api‑server/src/services/search/search‑service.ts`
  **Verification:** `pnpm test -- search‑service.test.ts` unit tests pass
- [ ] API‑SEARCH‑001.4 (AGENT): Implement domain event subscribers that update `search_index` on entity create/update/delete.
  **File(s):** `artifacts/api‑server/src/services/search/index‑subscribers.ts`
  **Verification:** `pnpm test -- index‑subscribers.test.ts` with mock event bus
- [ ] API‑SEARCH‑001.5 (AGENT): Create search route and run integration tests to green.
  **File(s):** `artifacts/api‑server/src/routes/search.ts`, `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm test -- search.test.ts` all green ; `pnpm typecheck`
- [ ] API‑SEARCH‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] API‑IMPORT‑001: CSV Import/Export Service Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No import/export capability exists; users must manually enter data one record at a time. No file upload infrastructure in the API.
**Size:** Large

**Description:** Implement a two‑phase CSV import pipeline (preview dry‑run + execute) and a dynamic‑column CSV export endpoint for all supported entity types (leads, contacts, companies, tasks, vendors, customers), with import history tracking and per‑entity‑type column mapping configuration.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`, domain CRUD APIs (API‑CRM‑005, API‑PROJ‑008, etc.), `infrastructure/DATABASE.md → DB‑IMPORT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** Frontend CSV import UI wizard (Phase 5)
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/import‑export/import‑service.ts`, `artifacts/api‑server/src/services/import‑export/export‑service.ts`, `artifacts/api‑server/src/routes/import‑export.ts`

**Definition of Done**
- [ ] `POST /api/v1/import/{entityType}` — accepts multipart CSV upload, validates headers against target schema, returns preview with column mapping and up to 5 error rows (dry‑run, no DB writes)
- [ ] `POST /api/v1/import/{entityType}/execute?importId={importId}` — executes a previously previewed import transactionally; returns `{ created, failed, errors }`
- [ ] `GET /api/v1/import/{entityType}/history` — paginated list of past imports with status, row counts, error download link
- [ ] `GET /api/v1/export/{entityType}?columns=name,email&format=csv` — exports data with selected columns; streams response to avoid memory overflow
- [ ] Supported `entityType` values: `leads`, `contacts`, `companies`, `tasks`, `vendors`, `customers`
- [ ] Column mapping is configurable per entity type; unmappable columns reported in preview, not silently discarded
- [ ] Import execution is atomic per‑row (failed rows recorded, successful rows committed); not all‑or‑nothing
- [ ] Integration tests: preview CSV (happy + header mismatch), execute (verify entities created), export verify CSV, import with row errors → error report
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Excel (.xlsx) import — CSV only at this phase
- Scheduled/recurring imports
- Import via URL
- Real‑time progress streaming during import

**Rules to Follow**
- Preview (dry‑run) must NEVER write to the database — validate‑only mode enforced by a flag
- Import execution must use database transactions; a mid‑import crash must not leave partial data without error records
- Export streaming: use Node.js `Readable` stream with `csv‑stringify` to avoid loading all rows into memory
- File upload size limit: 10MB enforced at `multer` config level

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/import‑export.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ImportService` and `ExportService` are infrastructure utilities — they delegate to domain services for validation and creation; they do not own domain rules.
- TDD: Write integration tests (preview, execute, export, error handling) before implementing services. All must fail (404) initially.
- BDD: “As an admin, I can upload a CSV of 500 contacts, preview the mapping, review 3 error rows, then execute the import and see 497 contacts created.”
- Deep Module: `ImportService.preview(file, entityType, orgId)` and `ImportService.execute(importId, orgId)` hide CSV parsing, column mapping, Zod validation, transaction management, and error collection.

---

### Subtasks
- [ ] API‑IMPORT‑001.0.25 (AGENT): Read API‑IMPORT‑001, all domain service APIs it delegates to, and DB‑IMPORT‑001 schema. *No action – pause.*
- [ ] API‑IMPORT‑001.0.5 (AGENT): Research `csv‑parse` v5+ async API, `csv‑stringify` streaming, `multer` memory storage vs disk storage, and two‑phase import patterns. *Document findings briefly.*
- [ ] API‑IMPORT‑001.1 (AGENT): Add import/export paths and schemas to OpenAPI spec.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑IMPORT‑001.2 (AGENT): Write integration tests for preview, execute, export, and error‑row reporting.
  **File(s):** `artifacts/api‑server/__tests__/api/import‑export.test.ts`
  **Verification:** `pnpm test -- import‑export.test.ts` all fail (red phase)
- [ ] API‑IMPORT‑001.3 (AGENT): Implement `ImportService` — CSV parse, column mapping, preview (no DB write), execute (transactional), error collection.
  **File(s):** `artifacts/api‑server/src/services/import‑export/import‑service.ts`
  **Verification:** `pnpm test -- import‑service.test.ts` unit tests pass
- [ ] API‑IMPORT‑001.4 (AGENT): Implement `ExportService` — streaming CSV generation with dynamic column selection.
  **File(s):** `artifacts/api‑server/src/services/import‑export/export‑service.ts`
  **Verification:** `pnpm test -- export‑service.test.ts` unit tests pass
- [ ] API‑IMPORT‑001.5 (AGENT): Create import/export routes (with `multer` file upload) and run integration tests to green.
  **File(s):** `artifacts/api‑server/src/routes/import‑export.ts`, `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm test -- import‑export.test.ts` all green ; `pnpm typecheck`
- [ ] API‑IMPORT‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
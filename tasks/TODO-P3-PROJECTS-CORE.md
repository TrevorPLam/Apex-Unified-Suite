# TODO-P3-PROJECTS-CORE.md – Phase 3: Projects Core CRUD

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Projects context Core CRUD operations – Projects, Tasks, and Milestones. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Projects – Core CRUD

### [ ] API‑PROJ‑001: Projects – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑001 (schema), DOMAIN‑003 (feature files), ARCH‑005 (API versioning).  
**Definition of Done:** OpenAPI spec adds `projects` tag and paths with `/api/v1/` prefix:
- `GET /api/v1/projects` – list with pagination (`page`, `limit`), filter by `status`. Response envelope standard.
- `POST /api/v1/projects` – create (auth, validates `client_id` exists). Returns 201 with `Location` header.
- `GET /api/v1/projects/{projectId}` – get by ID, includes derived `progress_percent`, `task_count`, `completed_task_count`, **and new budget fields** (`estimated_hours`, `budget_hours`, `budget_amount_cents`).
- `PATCH /api/v1/projects/{projectId}` – update name, status, **budget fields (estimated_hours, budget_hours, budget_amount_cents)**. Progress columns are **not** writable; any attempt to set them returns 400 `ProgressIsReadOnly`.
- `DELETE /api/v1/projects/{projectId}` – soft delete, 204.
Schemas: `Project`, `ProjectCreate`, `ProjectUpdate`. Examples required.  
**Anti-Patterns:** Allowing direct progress field mutation.  
**Related Files:** `lib/api‑spec/openapi.yaml`

**DDD:** API exposes the `Project` aggregate root. Progress is derived from tasks; the endpoint exposes it read‑only. Budget fields are writable by authorised users (PROJ‑DOM‑005).  
**TDD:** After codegen, integration tests (API‑PROJ‑002) will be written.  
**BDD:** Enables "As a PM, I can create a project and set a budget" scenarios.

### Subtasks:
- [ ] API‑PROJ‑001.1: Add `projects` paths and schemas to OpenAPI, including read‑only progress fields, budget columns, and progress‑write rejection. (AGENT)  
  **verification:** Spec validates, examples render.
- [ ] API‑PROJ‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### [ ] API‑PROJ‑002: Projects – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL.  
**Definition of Done:** `artifacts/api‑server/__tests__/api/projects/projects.test.ts` contains failing tests for:
- `POST /projects` → 201 with valid data, project in DB.
- `POST /projects` with missing required fields → 400 validation error.
- `GET /projects` → 200, pagination, status filter, excludes soft‑deleted.
- `GET /projects/{id}` → 200 with progress and budget fields.
- `GET /projects/{id}` missing → 404 `ProjectNotFound`.
- `PATCH /projects/{id}` update name → 200.
- `PATCH /projects/{id}` update budget fields → 200.
- `PATCH /projects/{id}` attempt to set `progress_percent` → 400 `ProgressIsReadOnly`.
- `DELETE /projects/{id}` → 204, subsequent GET returns 404.
- Unauthorized → 401.
**Related Files:** `.../projects.test.ts`

**Subtasks:** Write tests; all fail initially.

---

### [ ] API‑PROJ‑003: Projects – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2 (BaseRepository), ERROR‑002 (Projects errors), EVENT‑001 (domain event bus).  
**Definition of Done:**
- `lib/db/src/repositories/projects.ts` exports `ProjectRepository` extending `BaseRepository<Project>`, supporting soft delete with `includeDeleted`.
- `artifacts/api-server/src/services/projects/project‑service.ts` exports `ProjectService` with methods: `create`, `get`, `list`, `update`, `softDelete`, `updateProjectProgress(projectId)`.
- Status transitions: `active` ⇄ `on‑hold` → `completed` (cannot be re‑opened).
- `update` rejects any direct write to `progress_percent`, `task_count`, or `completed_task_count`; only the service's internal method updates them. Budget fields (`estimated_hours`, `budget_hours`, `budget_amount_cents`) are writable by authorised users.
- `updateProjectProgress` queries all active tasks for the project, computes ratio, and atomically updates the progress columns.
- Emits `ProjectCompleted` when status transitions to `completed`.
- All methods return `Result<T, DomainError>`.
**Deep Module:** Encapsulates status machine, progress derivation, budget management, and event publishing.

### Subtasks:
- [ ] API‑PROJ‑003.1: Implement `ProjectRepository`. (AGENT) – `lib/db/src/repositories/projects.ts`  
  **verification:** Unit tests against test DB green.
- [ ] API‑PROJ‑003.2: Implement `ProjectService` with status rules, progress protection, budget field handling, `updateProjectProgress`. (AGENT)  
  **verification:** Unit tests with mocked repo pass.
- [ ] API‑PROJ‑003.3: Write unit tests for all methods, including attempt to set progress directly (should be ignored/produce error), budget updates, and status transitions. (AGENT)  
  **verification:** Green.
- [ ] API‑PROJ‑003.4: Implement automatic progress update: subscribe to `TaskCompleted` event, call `updateProjectProgress`. (AGENT)  
  **verification:** Unit test with mock event bus.
- [ ] API‑PROJ‑003.5: Depth refactor check: method count ≤ 5, service encapsulates at least three non‑trivial concerns, no `throw`. (AGENT)  
  **verification:** Manual + `pnpm typecheck`.

---

### [ ] API‑PROJ‑004: Projects – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑003, AUTH‑008, ERROR‑001.  
**Subtasks:** route creation, integration tests turn green.

---

### [ ] API‑PROJ‑005: Tasks – Expand OpenAPI Spec
**Depends on:** DB‑PROJ‑002.  
**Definition of Done:** Paths: `GET /projects/{projectId}/tasks` (filter by status, assignee, **lane_id**), `POST`, `GET /tasks/{taskId}`, `PATCH` (including **lane_id** and **position** for board ordering), `DELETE` (soft delete). Support `parent_task_id` for subtasks. Pagination standard. Examples.  
**DDD:** Task is child of Project; hierarchy via `parent_task_id`. Board positioning via `lane_id` and `position` (PROJ‑DOM‑002).  
**Subtasks:** spec, codegen, typecheck.

---

### [ ] API‑PROJ‑006: Tasks – Integration Tests (Red)
**Depends on:** API‑PROJ‑005, TEST‑INFRA‑001.  
**Tests include:**
- Create task → 201.
- Create subtask with `parent_task_id` → 201, parent task cannot be set to `done` while unfinished subtasks exist → 400 `TaskHasUnfinishedSubtasks`.
- Toggle task to `done` → 200, project progress updates (integration test verifies project GET shows updated progress).
- Update task priority → 200.
- **Move task to a different lane** → 200, position updated.
- **Reorder tasks within a lane** → 200, positions adjusted.
- Soft delete → 204.
- Unauthorized → 401.
- Access non‑existent project → 404 `ProjectNotFound`.

---

### [ ] API‑PROJ‑007: Tasks – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL, BaseRepository.  
**Definition of Done:** `TaskRepository` (soft delete) and `TaskService` (enforces parent‑child completion rules, validates project exists, **handles lane assignment and position reordering**, emits `TaskCompleted` on status move to `done`). Result<T, DomainError> returns.  
**Depth refactor check** added.

---

### [ ] API‑PROJ‑008: Tasks – Routes & Green Tests
**Depends on:** API‑PROJ‑007.  
**Subtasks:** routes, integration tests green.

---

### [ ] API‑PROJ‑009: Milestones – Expand OpenAPI Spec
**Depends on:** DB‑PROJ‑003.  
**Definition of Done:** `GET /projects/{projectId}/milestones`, `POST`, `PATCH`, `DELETE`. Only `completed_at` can be set when marking complete. Examples.

---

### [ ] API‑PROJ‑010: Milestones – Integration Tests (Red)
**Tests include:**
- Create milestone → 201.
- Mark complete → 200, `completed_at` set.
- Mark already‑completed → 400 `MilestoneAlreadyCompleted`.
- Soft delete → 204.
- Project not found → 404.

---

### [ ] API‑PROJ‑011: Milestones – Service & Repository
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `MilestoneRepository` and `MilestoneService` (complete only once, emits `MilestoneCompleted` event). Result<T, DomainError> returns.  
**Depth refactor check.**

---

### [ ] API‑PROJ‑012: Milestones – Routes & Green Tests
**Depends on:** API‑PROJ‑011.  
**Subtasks:** routes, tests green.

---

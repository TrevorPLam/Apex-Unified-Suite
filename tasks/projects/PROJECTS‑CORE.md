# tasks/projects/PROJECTS‑CORE.md – Projects: Core Management

This file covers the core Project Management bounded context: projects, tasks, milestones, and the associated API layers, services, repositories, integration tests, and frontend integration. Projects represent work streams that contain tasks and milestones; tasks support subtask nesting and board positioning.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schemas

### [ ] DB‑PROJ‑001: Define Projects Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No projects table. The entire PM context is blocked.
**Size:** Small

**Description:** Define the `projects` table – the root aggregate for the Projects bounded context. Supports lifecycle status tracking, owner assignment, template linkage, and soft delete.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑002`, `DB‑PROJ‑003`, `projects/PROJECTS‑TEMPLATES.md → DB‑PROJ‑004`, `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑005`, `projects/PROJECTS‑CORE.md → DB‑PROJ‑006`, `DB‑PROJ‑007`, `API‑PROJ‑001`
**Related Files:** `lib/db/src/schema/projects/projects.ts`, `lib/db/src/__tests__/projects‑projects.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/projects/projects.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `status` (pgEnum: `planning|active|on_hold|completed|cancelled`), `owner_id` (uuid FK → users), `start_date` (date nullable), `due_date` (date nullable), `estimated_hours` (integer nullable), `budget_cents` (integer nullable), `template_id` (uuid nullable), `template_version` (integer nullable), `progress_percent` (integer NOT NULL default `0` – computed, read‑only), `is_template` (boolean NOT NULL default `false`), `parent_project_id` (uuid nullable FK self‑reference), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(owner_id)`, `(due_date)`
- [ ] Zod schemas and types exported; `progress_percent` omitted from insert/update schemas (computed field)
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `progress_percent` is a derived field computed from completed tasks / total tasks – never directly inserted or updated

**Verification**
```bash
pnpm --filter @workspace/db test -- projects‑projects.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Project is the aggregate root of the Projects bounded context. Status machine lifecycles are domain invariants.
- TDD: Assert status enum, computed progress default, self‑referencing FK.
- BDD: Enables “Create a project and track its status” scenarios.

---

### Subtasks
- [ ] DB‑PROJ‑001.0.25 (AGENT): Read DB‑ORG‑001 and DB‑IDENTITY‑001 schemas. No action – pause.
- [ ] DB‑PROJ‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/projects‑projects.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PROJ‑002: Define Tasks Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No tasks table. Task management is entirely blocked.
**Size:** Small

**Description:** Define the `tasks` table – child entity of projects. Supports subtask nesting (max 1 level deep), board positioning via `lane_id` and `position`, scoped statuses, and soft delete.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `projects/PROJECTS‑TEMPLATES.md → DB‑PROJ‑004`, `projects/PROJECTS‑CORE.md → DB‑PROJ‑006`, `API‑PROJ‑005`
**Related Files:** `lib/db/src/schema/projects/tasks.ts`, `lib/db/src/__tests__/projects‑tasks.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `project_id` (FK → projects), `title` (text NOT NULL), `description` (text nullable), `status` (pgEnum: `todo|in_progress|in_review|done|cancelled`), `priority` (pgEnum: `critical|high|medium|low`), `assignee_id` (uuid nullable FK → users), `due_date` (date nullable), `estimated_hours` (integer nullable), `parent_task_id` (uuid nullable FK self‑reference – max 1 level deep), `lane_id` (uuid FK → lanes, added later), `position` (integer nullable), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(project_id, status)`, `(assignee_id, status)`, `(parent_task_id)`, `(lane_id, position)`
- [ ] Zod schemas exported; `status`, `priority` validated as enum
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- projects‑tasks.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Task is a child entity of Project. Status and priority are value objects. Subtask nesting is a domain constraint.

---

### Subtasks
- [ ] DB‑PROJ‑002.0.25 (AGENT): Read DB‑PROJ‑001. No action – pause.
- [ ] DB‑PROJ‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/projects‑tasks.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑002.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PROJ‑003: Define Milestones Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No milestones table. Project checkpoint tracking is blocked.
**Size:** Small

**Description:** Define the `milestones` table – key project checkpoints with due dates and completion tracking (one‑way completion – cannot be reopened).

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑009`
**Related Files:** `lib/db/src/schema/projects/milestones.ts`, `lib/db/src/__tests__/projects‑milestones.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `project_id` (FK → projects), `title` (text NOT NULL), `description` (text nullable), `due_date` (date NOT NULL), `completed_at` (timestamp nullable – set on completion, read‑only), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(project_id, due_date)`, `(project_id, completed_at)`
- [ ] Zod schemas; `completed_at` omitted from insert/update
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- projects‑milestones.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PROJ‑003.0.25 (AGENT): Read DB‑PROJ‑001. No action – pause.
- [ ] DB‑PROJ‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/projects‑milestones.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Projects

### [ ] API‑PROJ‑001: Projects – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project endpoints defined in `openapi.yaml`.
**Size:** Small

**Description:** Add all project CRUD endpoints, status state machine enum, computed `progress_percent`, owner/member fields, and project schemas to the OpenAPI spec.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`, `infrastructure/RBAC.md → RBAC‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑002`, `API‑PROJ‑003`, `API‑PROJ‑004`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/projects`, `POST`, `GET /{projectId}`, `PATCH /{projectId}`, `DELETE /{projectId}` defined
- [ ] `POST /{projectId}/complete`, `POST /{projectId}/hold`, `POST /{projectId}/reactivate` actions
- [ ] `ProjectStatusEnum`: `planning`, `active`, `on_hold`, `completed`, `cancelled`
- [ ] `progress_percent` (0‑100 integer) as `readOnly: true`
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑001.0.25 (AGENT): Read DB‑PROJ‑001 schema. *No action – pause.*
- [ ] API‑PROJ‑001.1 (AGENT): Add `Project` schema and all project endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑PROJ‑001.2 (HUMAN): Review spec and sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑002: Projects – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project integration tests.
**Size:** Medium

**Description:** Write a comprehensive project integration test suite covering CRUD, status transitions, computed `progress_percent`, and auth – all must fail (red) before implementation.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑001`, `DB‑PROJ‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑004`
**Related Files:** `artifacts/api‑server/__tests__/api/projects/projects.test.ts`

**Definition of Done**
- [ ] Tests: list (paginated, filtered by status), create (201), get by ID, PATCH (active only), complete, hold, reactivate, soft delete, 404, 401
- [ ] `progress_percent` test: create project with 2 tasks → expect computed 50%
- [ ] Invalid transition test: attempt complete on already‑completed → 400
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/projects.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑002.0.25 (AGENT): Read API‑PROJ‑002, generated project schemas. *No action – pause.*
- [ ] API‑PROJ‑002.1 (AGENT): Write all project integration tests. **File(s):** `artifacts/api‑server/__tests__/api/projects/projects.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑PROJ‑002.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑PROJ‑003: Projects – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ProjectRepository` or `ProjectService` exists.
**Size:** Large

**Description:** Implement `ProjectRepository` (org‑scoped queries, status filtering) and `ProjectService` (status machine, computed `progress_percent`, event emission) using neverthrow Results.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`, `DB‑PROJ‑002`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑004`, `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑013`, `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑017`
**Related Files:** `lib/db/src/repositories/projects/projects.ts`, `artifacts/api‑server/src/services/projects/project‑service.ts`

**Definition of Done**
- [ ] `ProjectRepository`: `findById`, `findByOrg`, `create`, `update`, `updateStatus`, `softDelete`
- [ ] `ProjectService`: `listProjects`, `getProject`, `createProject`, `updateProject`, `completeProject`, `holdProject`, `reactivateProject`, `deleteProject`. All return `Result<T, DomainError>`.
- [ ] `getProject` includes computed `progress_percent` via SQL aggregate from tasks
- [ ] `updateProject` rejects edits on `completed` or `cancelled` projects
- [ ] Status machine: `planning → active`; `active ⇄ on_hold`; `active/on_hold → completed`; `planning/active/on_hold → cancelled`. No re‑opening.
- [ ] `ProjectCreated`, `ProjectCompleted`, `ProjectCancelled` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/project‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ProjectService` is the aggregate root service. `progress_percent` is a derived property computed from the `Task` aggregate.
- Deep Module: `ProjectService.getProject(id, orgId)` hides status guard, join‑based progress calculation, and auth scope check.

---

### Subtasks
- [ ] API‑PROJ‑003.0.25 (AGENT): Read DB‑PROJ‑001 and DB‑PROJ‑002 schemas. *No action – pause.*
- [ ] API‑PROJ‑003.1 (AGENT): Implement `ProjectRepository` (with progress‑percent join query). **File(s):** `lib/db/src/repositories/projects/projects.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑003.2 (AGENT): Implement `ProjectService` with status machine and events. **File(s):** `artifacts/api‑server/src/services/projects/project‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑003.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/projects/__tests__/project‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑003.4 (HUMAN): Review status machine, progress query, and re‑open prevention. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑004: Projects – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No project routes wired.
**Size:** Small

**Description:** Create project route handlers (CRUD + state transition actions), mount the router, and run integration tests to green.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑003`, `API‑PROJ‑002`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑008`, `API‑PROJ‑012`
**Related Files:** `artifacts/api‑server/src/routes/projects/projects.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, DELETE (soft), POST complete, POST hold, POST reactivate handlers
- [ ] `CannotModifyCompletedProject` → 400; `ProjectNotFound` → 404
- [ ] `pnpm test -- projects.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/projects.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑004.0.25 (AGENT): Read `routes/finance/invoices.ts` as pattern. *No action – pause.*
- [ ] API‑PROJ‑004.1 (AGENT): Implement projects router with all routes and state actions. **File(s):** `artifacts/api‑server/src/routes/projects/projects.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑004.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑004.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Tasks

### [ ] API‑PROJ‑005: Tasks – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No task endpoints defined in `openapi.yaml`.
**Size:** Small

**Description:** Add all project task CRUD endpoints, subtask support (`parent_task_id`), board position fields (`lane_id`, `position`), priority enum, and status machine to the OpenAPI spec.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑002`, `API‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑006`, `API‑PROJ‑007`, `API‑PROJ‑008`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/tasks`, `POST`, `GET /{taskId}`, `PATCH /{taskId}`, `DELETE /{taskId}`, `POST /{taskId}/complete` endpoints
- [ ] `TaskStatusEnum`: `todo`, `in_progress`, `in_review`, `done`, `cancelled`
- [ ] `TaskPriorityEnum`: `critical`, `high`, `medium`, `low`
- [ ] `parent_task_id` as optional FK (max 1 level deep documented)
- [ ] `lane_id` and `position` fields for board views
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑005.0.25 (AGENT): Read DB‑PROJ‑002 schema. *No action – pause.*
- [ ] API‑PROJ‑005.1 (AGENT): Add `Task` schema and all task endpoints to `openapi.yaml`. **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑PROJ‑005.2 (HUMAN): Review. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑006: Tasks – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No task integration tests.
**Size:** Medium

**Description:** Write project task integration tests covering CRUD, subtask nesting, board positioning, completion blocking, and status transitions – all must fail (red).

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑005`, `API‑PROJ‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑008`
**Related Files:** `artifacts/api‑server/__tests__/api/projects/tasks.test.ts`

**Definition of Done**
- [ ] Tests: create task, list, get, PATCH, complete, soft delete, 404, 401
- [ ] Subtask test: create subtask; verify nesting
- [ ] Nesting depth test: attempt sub‑subtask → 400
- [ ] Completion blocking: complete parent with open subtask → 400
- [ ] Board test: create tasks with different `lane_id` and `position`; list by lane
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/tasks.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑006.0.25 (AGENT): Read API‑PROJ‑006 and generated task schemas. *No action – pause.*
- [ ] API‑PROJ‑006.1 (AGENT): Write all task integration tests. **File(s):** `artifacts/api‑server/__tests__/api/projects/tasks.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑PROJ‑006.2 (HUMAN): Review test coverage. Confirm red phase. **Verification:** Approved.

---

### [ ] API‑PROJ‑007: Tasks – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `TaskRepository` or `TaskService` exists.
**Size:** Large

**Description:** Implement `TaskRepository` (project‑scoped, subtask‑aware, board‑ordered queries) and `TaskService` (subtask depth validation, completion blocking, board positioning, event emission) using neverthrow Results.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑002`, `ProjectRepository`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑008`, `API‑PROJ‑003`
**Related Files:** `lib/db/src/repositories/projects/tasks.ts`, `artifacts/api‑server/src/services/projects/task‑service.ts`

**Definition of Done**
- [ ] `TaskRepository`: `findById`, `findByProject` (paginated, filtered, ordered), `create`, `update`, `updateStatus`, `softDelete`, `findSubtasks`
- [ ] `TaskService`: `listTasks`, `getTask`, `createTask`, `updateTask`, `completeTask`, `deleteTask`. All return `Result<T, DomainError>`.
- [ ] `createTask` validates subtask depth: max 1 level
- [ ] `completeTask` checks all subtasks are done/cancelled first
- [ ] `position` for new tasks: `MAX(position) + 1000` within the same lane and project
- [ ] `TaskCreated`, `TaskCompleted` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/task‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tasks are a child aggregate of Projects. Subtask depth and completion blocking are core domain invariants.
- Deep Module: `TaskService.completeTask(id, orgId)` hides subtask completion check, status update, progress recalc trigger, and event emission.

---

### Subtasks
- [ ] API‑PROJ‑007.0.25 (AGENT): Read DB‑PROJ‑002 schema. *No action – pause.*
- [ ] API‑PROJ‑007.1 (AGENT): Implement `TaskRepository`. **File(s):** `lib/db/src/repositories/projects/tasks.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑007.2 (AGENT): Implement `TaskService` with depth validation, completion blocking, and events. **File(s):** `artifacts/api‑server/src/services/projects/task‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑007.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/projects/__tests__/task‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑007.4 (HUMAN): Review depth validation, completion blocking, and position strategy. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑008: Tasks – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No task routes wired.
**Size:** Small

**Description:** Create project task route handlers (CRUD + complete action), mount the router under the projects router, and run integration tests to green.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑007`, `API‑PROJ‑006`, `API‑PROJ‑004`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/projects/tasks.ts`, `artifacts/api‑server/src/routes/projects/projects.ts`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST complete, DELETE (soft) handlers; `mergeParams: true` for `projectId`
- [ ] `CannotCompleteWithOpenSubtasks` → 400; `MaxSubtaskDepthExceeded` → 400; `TaskNotFound` → 404
- [ ] `pnpm test -- tasks.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/tasks.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑008.0.25 (AGENT): Read Express `mergeParams` routing pattern. *No action – pause.*
- [ ] API‑PROJ‑008.1 (AGENT): Implement tasks router with `mergeParams` and mount. **File(s):** `artifacts/api‑server/src/routes/projects/tasks.ts`, `projects.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑008.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑008.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Milestones

### [ ] API‑PROJ‑009: Milestones – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No milestone endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add project milestone CRUD endpoints, completion action (one‑way), and due‑date fields to the OpenAPI spec.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑003`, `API‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑010`, `API‑PROJ‑011`, `API‑PROJ‑012`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/milestones`, `POST`, `GET /{milestoneId}`, `PATCH`, `DELETE`, `POST /{milestoneId}/complete` endpoints
- [ ] `MilestoneSchema`: `title`, `description`, `due_date`, `completed_at` (readOnly), `project_id`
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑009.0.25 (AGENT): Read DB‑PROJ‑003 schema. *No action – pause.*
- [ ] API‑PROJ‑009.1 (AGENT): Add `Milestone` schema and all milestone endpoints to `openapi.yaml`. **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑PROJ‑009.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑010: Milestones – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No milestone integration tests.
**Size:** Medium

**Description:** Write project milestone integration tests covering CRUD, one‑way completion, irreversibility, and auth – all must fail (red).

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑009`, `API‑PROJ‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑012`
**Related Files:** `artifacts/api‑server/__tests__/api/projects/milestones.test.ts`

**Definition of Done**
- [ ] Tests: create milestone (201), list, get, PATCH (incomplete only), complete, attempt PATCH on completed → 400, attempt complete already‑completed → 400, soft delete, 404, 401
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/milestones.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑010.0.25 (AGENT): Read API‑PROJ‑010 and generated milestone schemas. *No action – pause.*
- [ ] API‑PROJ‑010.1 (AGENT): Write all milestone integration tests. **File(s):** `artifacts/api‑server/__tests__/api/projects/milestones.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑PROJ‑010.2 (HUMAN): Review test coverage. Confirm red phase. **Verification:** Approved.

---

### [ ] API‑PROJ‑011: Milestones – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `MilestoneRepository` or `MilestoneService` exists.
**Size:** Large

**Description:** Implement `MilestoneRepository` (project‑scoped) and `MilestoneService` (one‑way completion with timestamp, guard against editing completed milestones) using neverthrow Results.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑003`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → API‑PROJ‑012`
**Related Files:** `lib/db/src/repositories/projects/milestones.ts`, `artifacts/api‑server/src/services/projects/milestone‑service.ts`

**Definition of Done**
- [ ] `MilestoneRepository`: `findById`, `findByProject`, `create`, `update`, `setCompleted` (atomic), `softDelete`
- [ ] `MilestoneService`: `listMilestones`, `getMilestone`, `createMilestone`, `updateMilestone`, `completeMilestone`, `deleteMilestone`. All return `Result<T, DomainError>`.
- [ ] `completeMilestone` rejects if already completed
- [ ] `updateMilestone` and `deleteMilestone` reject if milestone is completed
- [ ] `MilestoneCompleted` domain event emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/milestone‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestone completion is a one‑way domain event. The service enforces this invariant.
- Deep Module: `MilestoneService.completeMilestone(id, orgId)` hides completion guard, atomic update, and event emission.

---

### Subtasks
- [ ] API‑PROJ‑011.0.25 (AGENT): Read DB‑PROJ‑003 schema. *No action – pause.*
- [ ] API‑PROJ‑011.1 (AGENT): Implement `MilestoneRepository` (with atomic `setCompleted`). **File(s):** `lib/db/src/repositories/projects/milestones.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑011.2 (AGENT): Implement `MilestoneService` with completion guard and events. **File(s):** `artifacts/api‑server/src/services/projects/milestone‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑011.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/projects/__tests__/milestone‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑011.4 (HUMAN): Review completion atomicity and guard logic. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑012: Milestones – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No milestone routes wired.
**Size:** Small

**Description:** Create milestone route handlers (CRUD + complete action), mount the router under the projects router, and run integration tests to green.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑011`, `API‑PROJ‑010`, `API‑PROJ‑004`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/projects/milestones.ts`, `artifacts/api‑server/src/routes/projects/projects.ts`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST complete, DELETE (soft) handlers; `mergeParams: true`
- [ ] `MilestoneAlreadyCompleted` → 400; `CannotModifyCompletedMilestone` → 400
- [ ] `pnpm test -- milestones.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/milestones.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑012.0.25 (AGENT): Read `routes/projects/tasks.ts` as pattern. *No action – pause.*
- [ ] API‑PROJ‑012.1 (AGENT): Implement milestones router with `mergeParams` and mount. **File(s):** `artifacts/api‑server/src/routes/projects/milestones.ts`, `projects.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑012.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PROJ‑012.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Frontend Integration – Projects, Tasks & Milestones

### [ ] FRONT‑PROJ‑001: Projects & Tasks – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `Projects.tsx` imports projects and tasks from `src/data/mockData.ts`. No `useProjectList` or `useTaskList` hooks exist.
**Size:** Small

**Description:** Create `useProjectList` and `useTaskList` hooks backed by `API‑PROJ‑004` / `API‑PROJ‑008`. Replace all mock project and task data in the Projects list view and task table. Display real project status, budget, and task counts.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑004`, `API‑PROJ‑008`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `projects/PROJECTS‑CORE.md → FRONT‑INT‑PROJ`
**Related Files:** `artifacts/apex‑os/src/pages/Projects.tsx`, `artifacts/apex‑os/src/hooks/projects/useProjectList.ts`, `useTaskList.ts`

**Definition of Done**
- [ ] `useProjectList` and `useTaskList` hooks created with filter params
- [ ] Project list view displays real status, budget, task count, and assigned_to
- [ ] Task table displays status, assignee, due date, lane/position
- [ ] All `mockData` imports removed
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- projects‑list.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Project` is the aggregate root; `Task` is an entity within the Projects bounded context.
- TDD: MSW returns 3 projects; assert list renders; MSW returns tasks for project 1; assert task table shows correct rows.
- BDD: “As a firm user, I can see all my projects and the tasks within each project.”

---

### Subtasks
- [ ] FRONT‑PROJ‑001.0.25 (AGENT): Read `Projects.tsx` in full. *No action – pause.*
- [ ] FRONT‑PROJ‑001.1 (AGENT): Create `useProjectList` and `useTaskList` hooks. **File(s):** `artifacts/apex‑os/src/hooks/projects/useProjectList.ts`, `useTaskList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑001.2 (AGENT): Replace mock data; wire status, budget, and task count display. **File(s):** `artifacts/apex‑os/src/pages/Projects.tsx` **Verification:** No mockData; `pnpm typecheck`.
- [ ] FRONT‑PROJ‑001.3 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/pages/__tests__/projects‑list.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PROJ‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PROJ‑002: Milestones & Calendar – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Milestone list and calendar in Projects use mock data. No `useMilestoneList` hook exists.
**Size:** Small

**Description:** Create `useMilestoneList` hook backed by `API‑PROJ‑012`. Replace mock milestone data in list and calendar views; populate calendar with real milestone dates and project deadlines.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑012`, `FRONT‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → FRONT‑INT‑PROJ`
**Related Files:** `artifacts/apex‑os/src/pages/Projects.tsx`, `artifacts/apex‑os/src/hooks/projects/useMilestoneList.ts`

**Definition of Done**
- [ ] `useMilestoneList` hook created
- [ ] Calendar view populated with real milestone dates; milestone cards show name, due date, status
- [ ] All mock milestone references removed from Projects
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- projects‑milestones.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestones are entities within the Project aggregate.
- TDD: MSW returns milestones with past and future dates; assert calendar renders correctly.
- BDD: “As a firm user, I can see all project milestones on a calendar view.”

---

### Subtasks
- [ ] FRONT‑PROJ‑002.1 (AGENT): Create `useMilestoneList` hook. **File(s):** `artifacts/apex‑os/src/hooks/projects/useMilestoneList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑002.2 (AGENT): Replace mock milestones in list and calendar; add overdue indicator. **File(s):** `artifacts/apex‑os/src/pages/Projects.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- projects‑milestones.test.tsx` → GREEN.
- [ ] FRONT‑PROJ‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑PROJ: Projects Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** All project mutation surfaces (task checkbox, status dropdown, milestone completion, log‑hours form) render correctly but have no mutation wiring.
**Size:** Medium

**Description:** Wire all Projects create/update/delete mutations: task checkbox toggle (`useUpdateTask`), project status dropdown (`useUpdateProject`), milestone completion (`useUpdateMilestone`), time entry creation (`useCreateTimeEntry`). All mutations show sonner toast feedback.

**Depends on:** `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`, `FRONT‑PROJ‑002`, `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑005`, `FRONT‑PROJ‑008`, `infrastructure/AUTH.md → FRONT‑INFRA‑003`, `FRONT‑INFRA‑004`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Projects.tsx`, `artifacts/apex‑os/src/hooks/projects/`

**Definition of Done**
- [ ] Task checkbox → `useUpdateTask` with optimistic toggle; completed tasks show strikethrough
- [ ] Project status dropdown → `useUpdateProject`; status badge updates immediately
- [ ] Milestone “Mark Complete” button → `useUpdateMilestone` mutation
- [ ] Task delete → `useUndoableMutation` with undo toast
- [ ] All mutation loading states disable the relevant control
- [ ] Integration tests with MSW cover all mutation paths

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- projects‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mutations enforce Projects domain rules via API; client delegates validation to the backend.
- TDD: Integration test — click task checkbox → assert `PATCH /tasks/:id` called.
- BDD: “As a firm user, I can check off a task and see it marked complete immediately.”

---

### Subtasks
- [ ] FRONT‑INT‑PROJ.0.25 (AGENT): List all mutation surfaces in Projects. *No action – pause.*
- [ ] FRONT‑INT‑PROJ.1 (AGENT): Implement `useUpdateTask` and `useDeleteTask`; wire task checkbox. **File(s):** `artifacts/apex‑os/src/hooks/projects/useUpdateTask.ts`, `useDeleteTask.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PROJ.2 (AGENT): Implement `useUpdateProject`; wire project status dropdown. **File(s):** `useUpdateProject.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PROJ.3 (AGENT): Implement `useUpdateMilestone`; wire milestone completion button. **File(s):** `useUpdateMilestone.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PROJ.4 (AGENT): Add sonner toast feedback; write integration tests. **File(s):** `artifacts/apex‑os/src/pages/__tests__/projects‑interactive.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑INT‑PROJ.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
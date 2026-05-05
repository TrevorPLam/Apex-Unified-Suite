# TODO-P3-PROJECTS-CORE.md – Phase 3: Projects Core API

## Tasks in this file
- API-PROJ-001: Projects – Expand OpenAPI Spec
- API-PROJ-002: Projects – Integration Tests (TDD Red)
- API-PROJ-003: Projects – Service & Repository
- API-PROJ-004: Projects – Routes & Green Tests
- API-PROJ-005: Tasks – Expand OpenAPI Spec
- API-PROJ-006: Tasks – Integration Tests (Red)
- API-PROJ-007: Tasks – Service & Repository
- API-PROJ-008: Tasks – Routes & Green Tests
- API-PROJ-009: Milestones – Expand OpenAPI Spec
- API-PROJ-010: Milestones – Integration Tests (Red)
- API-PROJ-011: Milestones – Service & Repository
- API-PROJ-012: Milestones – Routes & Green Tests

---

## [ ] API-PROJ-001: Projects – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project endpoints defined in `openapi.yaml`. No generated Zod schemas or React Query hooks for projects.
**Size:** Small

**Description:** Add all project CRUD endpoints, status state machine enum, computed `progress_percent`, owner/member fields, and project schemas to the OpenAPI spec.

**Depends on:** API-SPEC-001 (spec baseline), DB-PROJ-001 (projects schema), RBAC-001.
**Blocks:** API-PROJ-002, API-PROJ-003, API-PROJ-004.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`

**Imports / Exports**
- Imports: [N/A] — spec file only
- Exports: `ProjectSchema`, `CreateProjectSchema`, `UpdateProjectSchema`, `ProjectStatusEnum` (via codegen); `useListProjects`, `useGetProject`, `useCreateProject`, `useUpdateProject` hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/projects` with `page`, `limit`, `status`, `ownerId`, `q` (search) query params.
- [ ] `POST /api/v1/projects` with `CreateProjectRequestBody` schema.
- [ ] `GET /api/v1/projects/{projectId}` with full detail including `progress_percent`.
- [ ] `PATCH /api/v1/projects/{projectId}` — limited to non-terminal projects (active, on-hold).
- [ ] `DELETE /api/v1/projects/{projectId}` — soft delete.
- [ ] `POST /api/v1/projects/{projectId}/complete` — transitions `active → completed` or `on-hold → completed`.
- [ ] `POST /api/v1/projects/{projectId}/hold` — transitions `active → on-hold`.
- [ ] `POST /api/v1/projects/{projectId}/reactivate` — transitions `on-hold → active`.
- [ ] `ProjectStatusEnum`: `planning`, `active`, `on_hold`, `completed`, `cancelled`.
- [ ] `progress_percent` (0-100 integer) as `readOnly: true` in response schema.
- [ ] `owner_id`, `start_date`, `due_date`, `description` fields defined.
- [ ] Codegen runs successfully.

**Out of Scope**
- Project members endpoint (separate task in PROJECTS-DEPTH)
- Board and lane management (API-PROJ-014)
- Project templates (API-PROJ-016)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: `pnpm codegen` fails — fix YAML before proceeding.

**Rules to Follow**
- `progress_percent` is `readOnly: true` — computed from tasks, never set directly.
- Status machine transitions documented in spec descriptions.
- `completed` and `cancelled` projects cannot be re-opened (documented constraint).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `progress_percent` as `readOnly: true` with description "Computed from completed tasks / total tasks. Not settable directly."
- State machine: `x-status-transitions: { planning: [active, cancelled], active: [on_hold, completed, cancelled], on_hold: [active, completed, cancelled], completed: [], cancelled: [] }`.

**Anti-Patterns**
- Making `progress_percent` writeable (clients must not set it directly — it is computed).
- Missing `completed` and `cancelled` as terminal states in enum.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Projects are the root aggregate for the Projects bounded context. Status machine controls lifecycle.
- TDD: Spec enables API-PROJ-002 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec defines the narrow Project API surface.

---

### Subtasks
- [ ] API-PROJ-001.0.25 (AGENT): Read DB-PROJ-001 schema and understand Projects subdomain structure.
  *No action — pause until fully understood.*

- [ ] API-PROJ-001.0.5 (AGENT): Research OpenAPI 3.1 `readOnly` field patterns and state machine documentation conventions (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-001.1 (AGENT): Add `Project` schema and all project endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** YAML is valid

- [ ] API-PROJ-001.2 (AGENT): Run codegen and verify generated output.
  **File(s):** `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`
  **Verification:** `pnpm codegen` exits 0 ; `pnpm typecheck`

- [ ] API-PROJ-001.3 (HUMAN): Review spec and sign off.
  **Verification:** Approved; `progress_percent` is readOnly; status machine documented.

---

## [ ] API-PROJ-002: Projects – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project integration tests.
**Size:** Medium

**Description:** Write a comprehensive project integration test suite covering CRUD, status transitions, computed `progress_percent`, and auth — all must fail (red) before implementation.

**Depends on:** API-PROJ-001 (spec + generated schemas), DB-PROJ-001 (schema + test DB seeding).
**Blocks:** API-PROJ-004 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/projects/projects.test.ts`

**Imports / Exports**
- Imports: generated `ProjectSchema`, `CreateProjectSchema`, test auth helper, test DB client
- Exports: test suite

**Definition of Done**
- [ ] Tests: list (paginated, filtered by status), create (201), get by ID, PATCH (active project only), complete (active → completed), hold (active → on-hold), reactivate (on-hold → active), soft delete, 404 on unknown ID, 401 without auth.
- [ ] `progress_percent` test: create project with 2 tasks (1 complete, 1 incomplete) — expect `progress_percent: 50`.
- [ ] Invalid transition test: attempt complete on already-completed project → 400.
- [ ] Invalid transition test: attempt PATCH on completed project → 400.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Task tests (API-PROJ-006)
- Milestone tests (API-PROJ-010)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/projects.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete test file if infrastructure broken.
- Halt condition: test file fails to compile — fix generated schema imports.

**Rules to Follow**
- `progress_percent` test requires seeding tasks; document test setup clearly.
- Status transition tests cover all valid AND invalid transitions.
- Never attempt to PATCH `progress_percent` (must be rejected with 400 if spec enforces readOnly).

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/projects.test.ts
# Expected: all fail (red phase)
pnpm typecheck
```

**Advanced Code Patterns**
- Progress assertion: seed 2 tasks (1 done, 1 not done) for a project; `expect(project.progress_percent).toBe(50)`.
- Completed project PATCH test: `await request(app).patch(`/projects/${completedProjectId}`).expect(400)`.

**Anti-Patterns**
- Skipping `progress_percent` tests (computed field is a core domain invariant).
- Only testing happy paths (state machine tests must include invalid transitions).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Project status machine and computed progress are core aggregate invariants.
- TDD: Red phase — all must fail before routes exist.
- BDD: "When a project has 1 of 2 tasks completed, its progress_percent is 50."
- Deep Module: Black-box tests exercise API surface.

---

### Subtasks
- [ ] API-PROJ-002.0.25 (AGENT): Read API-PROJ-002, generated project schemas, and DB-PROJ-001 seeding strategy.
  *No action — pause until fully understood.*

- [ ] API-PROJ-002.1 (AGENT): Write all project integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/projects/projects.test.ts`
  **Verification:** `pnpm test -- projects.test.ts` — all fail (red) ; `pnpm typecheck`

- [ ] API-PROJ-002.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved; all failing; `progress_percent` test included.

---

## [ ] API-PROJ-003: Projects – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ProjectRepository` or `ProjectService` exists.
**Size:** Large

**Description:** Implement `ProjectRepository` (org-scoped queries, status filtering) and `ProjectService` (status machine, computed `progress_percent`, event emission) using neverthrow Results.

**Depends on:** DB-PROJ-001 (projects schema), DB-PROJ-002 (tasks schema — needed for progress calc), EVENT-001, ERROR-002.
**Blocks:** API-PROJ-004 (routes), API-PROJ-013 (MyWeek uses projects), API-PROJ-017 (template instantiation creates projects).
**Related Files:** `lib/db/src/repositories/projects/projects.ts`, `artifacts/api-server/src/services/projects/project-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `projects` table, `tasks` table (for progress calc), `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `ProjectRepository`, `ProjectService`

**Definition of Done**
- [ ] `ProjectRepository`: `findById`, `findByOrg` (paginated, status/owner filtered), `create`, `update`, `updateStatus`, `softDelete`.
- [ ] `ProjectService`: `listProjects`, `getProject`, `createProject`, `updateProject`, `completeProject`, `holdProject`, `reactivateProject`, `deleteProject`. All return `Result<T, DomainError>`.
- [ ] `getProject` (and list) includes `progress_percent` computed as `ROUND(100.0 * COUNT(tasks.id) FILTER (WHERE tasks.status = 'done') / NULLIF(COUNT(tasks.id), 0))`.
- [ ] `updateProject` rejects updates on `completed` or `cancelled` projects → `err(CannotModifyCompletedProject)`.
- [ ] Status machine: `planning → active`; `active ⇄ on_hold`; `active/on_hold → completed`; `planning/active/on_hold → cancelled`. No re-opening of `completed` or `cancelled`.
- [ ] `ProjectCreated`, `ProjectCompleted`, `ProjectCancelled` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Project members management (API-PROJ-013)
- Board lane management (API-PROJ-014)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow re-opening of completed/cancelled projects

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/projects/projects.ts`, `artifacts/api-server/src/services/projects/project-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/projects/__tests__/project-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: completed/cancelled project PATCH accepted → halt and add status guard.

**Rules to Follow**
- `progress_percent` must return 0 when project has no tasks (not null/undefined).
- Status machine: `PROJECT_TRANSITIONS = { planning: ['active', 'cancelled'], active: ['on_hold', 'completed', 'cancelled'], on_hold: ['active', 'completed', 'cancelled'], completed: [], cancelled: [] }`.
- `completeProject` fails if any incomplete subtasks exist on critical milestone (checked via milestone service — future task; for now, check no blocking tasks).
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/projects/__tests__/project-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Progress query with Drizzle: `db.select({ id: projects.id, progressPercent: sql<number>`ROUND(100.0 * COUNT(${tasks.id}) FILTER (WHERE ${tasks.status} = 'done') / NULLIF(COUNT(${tasks.id}), 0))` }).from(projects).leftJoin(tasks, eq(tasks.projectId, projects.id)).groupBy(projects.id)`.
- Zero-task guard: `COALESCE(ROUND(...), 0)` ensures `progress_percent` is 0, not NULL, for projects with no tasks.

**Anti-Patterns**
- Computing `progress_percent` in application code with N+1 queries (use SQL aggregate query instead).
- Returning null for `progress_percent` on projects with no tasks (breaks numeric contract).
- Allowing status change to any state (bypass state machine guard).

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ProjectService` is the aggregate root service. `progress_percent` is a derived property computed from the `Task` aggregate. Status machine enforces lifecycle.
- TDD: Unit tests for status machine, progress calculation (0 tasks, partial, full), and edit guard.
- BDD: "When a completed project receives a PATCH request, the service returns CannotModifyCompletedProject."
- Deep Module: `ProjectService.getProject(id, orgId)` hides status guard, join-based progress calculation, and auth scope check.

---

### Subtasks
- [ ] API-PROJ-003.0.25 (AGENT): Read DB-PROJ-001 (projects) and DB-PROJ-002 (tasks) schemas to understand join for progress calc.
  *No action — pause until fully understood.*

- [ ] API-PROJ-003.0.5 (AGENT): Research Drizzle SQL aggregate with FILTER clause and COALESCE for zero-task progress (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-003.0.75 (AGENT): Confirm whether `completeProject` should block if open tasks remain.
  *If uncertain, ask the user before executing.*

- [ ] API-PROJ-003.1 (AGENT): Implement `ProjectRepository` (with progress-percent join query).
  **File(s):** `lib/db/src/repositories/projects/projects.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-003.2 (AGENT): Implement `ProjectService` with status machine and event emission.
  **File(s):** `artifacts/api-server/src/services/projects/project-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-003.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/projects/__tests__/project-service.test.ts`
  **Verification:** `pnpm test -- project-service.test.ts` green ; `pnpm typecheck`

- [ ] API-PROJ-003.4 (HUMAN): Review status machine, progress query (SQL aggregate with FILTER), and re-open prevention. Sign off.
  **Verification:** Approved; no N+1; status guard confirmed; all tests green.

---

## [ ] API-PROJ-004: Projects – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No project routes wired.
**Size:** Small

**Description:** Create project route handlers (CRUD + state transition actions), mount the router, and run integration tests to green.

**Depends on:** API-PROJ-003 (ProjectService), API-PROJ-002 (tests), AUTH-008.
**Blocks:** API-PROJ-008 (tasks router references projectId), API-PROJ-012 (milestones router references projectId).
**Related Files:** `artifacts/api-server/src/routes/projects/projects.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `ProjectService`, `CreateProjectSchema`, `UpdateProjectSchema`, `authMiddleware`
- Exports: `projectsRouter` at `/api/v1/projects`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, DELETE (soft), POST complete, POST hold, POST reactivate handlers.
- [ ] `CannotModifyCompletedProject` → 400; `ProjectNotFound` → 404.
- [ ] `pnpm test -- projects.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Task routes (API-PROJ-008)
- Milestone routes (API-PROJ-012)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/projects/projects.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- State transition actions as POST sub-resources: `/projects/:id/complete`, `/projects/:id/hold`, `/projects/:id/reactivate`.
- `organizationId` from `req.user.organizationId` only.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/projects.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Same sub-resource pattern as `routes/finance/invoices.ts`.

**Anti-Patterns**
- Using PATCH to change project status (status transitions are actions, not property updates).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer delegates to `ProjectService`.
- TDD: Green phase for projects.
- BDD: All API-PROJ-002 scenarios pass.
- Deep Module: Routes delegate to `ProjectService`.

---

### Subtasks
- [ ] API-PROJ-004.0.25 (AGENT): Read `routes/finance/invoices.ts` as sub-resource action pattern.
  *No action — pause until fully understood.*

- [ ] API-PROJ-004.1 (AGENT): Implement projects router with all routes and state actions.
  **File(s):** `artifacts/api-server/src/routes/projects/projects.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-004.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- projects.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-004.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures.

---

## [ ] API-PROJ-005: Tasks – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No task endpoints defined in `openapi.yaml`.
**Size:** Small

**Description:** Add all project task CRUD endpoints, subtask support (`parent_task_id`), board position fields (`lane_id`, `position`), priority enum, and status machine to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-PROJ-002 (tasks schema), API-PROJ-001 (project FK reference).
**Blocks:** API-PROJ-006, API-PROJ-007, API-PROJ-008.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `TaskSchema`, `CreateTaskSchema`, `UpdateTaskSchema`, `TaskStatusEnum`, `TaskPriorityEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/tasks` with `page`, `limit`, `status`, `assigneeId`, `laneId`, `parentTaskId` query params.
- [ ] `POST /api/v1/projects/{projectId}/tasks` with `CreateTaskRequestBody`.
- [ ] `GET /api/v1/projects/{projectId}/tasks/{taskId}` defined.
- [ ] `PATCH /api/v1/projects/{projectId}/tasks/{taskId}` defined.
- [ ] `DELETE /api/v1/projects/{projectId}/tasks/{taskId}` — soft delete.
- [ ] `POST /api/v1/projects/{projectId}/tasks/{taskId}/complete` — transitions to `done`.
- [ ] `TaskStatusEnum`: `todo`, `in_progress`, `in_review`, `done`, `cancelled`.
- [ ] `TaskPriorityEnum`: `critical`, `high`, `medium`, `low`.
- [ ] `parent_task_id` as optional FK (nullable, for subtask nesting — max 1 level deep documented).
- [ ] `lane_id` and `position` (integer for ordering) fields for board views.
- [ ] `due_date`, `assignee_id`, `estimated_hours` fields defined.
- [ ] Codegen runs successfully.

**Out of Scope**
- Board lane management (API-PROJ-014)
- Bulk task reorder (API-PROJ-014)
- My Week task bucketing (API-PROJ-013)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- Tasks are nested under `/projects/{projectId}/tasks` (not top-level `/tasks`).
- `parent_task_id` constraint: document that subtasks cannot themselves have subtasks (max 1 level nesting).
- `position` is an integer for ordering (lower = higher priority in list). Document that bulk reorder is handled by API-PROJ-014.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- Subtask depth constraint: documented in spec description (not enforced at spec level, enforced in service).
- `position`: `type: integer, minimum: 0` — document that gaps are allowed for efficient reordering.

**Anti-Patterns**
- Defining tasks as top-level `/tasks` (breaks project scoping — tasks without a project are invalid).
- Missing `lane_id` and `position` fields (makes board view impossible to implement correctly).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tasks are a child aggregate of Projects. `position` and `lane_id` support board-oriented views.
- TDD: Spec enables API-PROJ-006 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec defines the narrow Task API surface scoped to a project.

---

### Subtasks
- [ ] API-PROJ-005.0.25 (AGENT): Read DB-PROJ-002 tasks schema and understand `parent_task_id` and board fields.
  *No action — pause until fully understood.*

- [ ] API-PROJ-005.1 (AGENT): Add `Task` schema and all task endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-005.2 (HUMAN): Review — confirm `parent_task_id`, `lane_id`, `position`, status machine, and nesting constraint documented. Sign off.
  **Verification:** Approved.

---

## [ ] API-PROJ-006: Tasks – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No task integration tests.
**Size:** Medium

**Description:** Write project task integration tests covering CRUD, subtask nesting, board positioning, completion blocking (parent cannot complete if subtasks unfinished), and status transitions — all must fail (red).

**Depends on:** API-PROJ-005 (spec + generated schemas), API-PROJ-002 (project seeding needed for test setup).
**Blocks:** API-PROJ-008 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/projects/tasks.test.ts`

**Imports / Exports**
- Imports: generated `TaskSchema`, `CreateTaskSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: create task (201), list (filtered by status, laneId, parentTaskId), get by ID, PATCH, complete (todo → done), soft delete, 404 on unknown task, 404 on unknown project, 401 without auth.
- [ ] Subtask test: create task; create subtask with `parent_task_id` set; verify subtask is nested under parent.
- [ ] Nesting depth test: attempt to create sub-subtask (grandchild) → 400 `MaxSubtaskDepthExceeded`.
- [ ] Completion blocking test: create parent task with incomplete subtask; attempt complete parent → 400 `CannotCompleteWithOpenSubtasks`.
- [ ] Board test: create 3 tasks with different `lane_id` and `position` values; list by `laneId` — verify order.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Bulk reorder tests (API-PROJ-014)
- My Week tests (API-PROJ-013)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/tasks.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete test file if infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Completion blocking test is critical — must be included (core domain invariant).
- Depth limit test: attempts to create a task with a `parent_task_id` that is itself a subtask.
- Board ordering: list by `laneId` should return tasks ordered by `position ASC`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/tasks.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Completion blocking test: `const parent = await createTask(); const subtask = await createTask({ parentTaskId: parent.id }); await request(app).post(`/projects/${projectId}/tasks/${parent.id}/complete`).expect(400)`.
- Board ordering: `const res = await request(app).get(`/projects/${projectId}/tasks?laneId=${laneId}`).expect(200); expect(res.body.data[0].position).toBeLessThan(res.body.data[1].position)`.

**Anti-Patterns**
- Not testing completion blocking (critical domain invariant — parent task must not complete if subtasks are open).
- Not testing nesting depth limit (could lead to infinite recursion in tree queries).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Task subtask nesting and completion blocking are core domain constraints in the Projects aggregate.
- TDD: Red phase — all must fail.
- BDD: "When a task has an open subtask, completing the parent task returns 400 CannotCompleteWithOpenSubtasks."
- Deep Module: Black-box tests.

---

### Subtasks
- [ ] API-PROJ-006.0.25 (AGENT): Read API-PROJ-006 and generated task schemas. Understand subtask test seeding.
  *No action — pause until fully understood.*

- [ ] API-PROJ-006.1 (AGENT): Write all task integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/projects/tasks.test.ts`
  **Verification:** `pnpm test -- tasks.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-PROJ-006.2 (HUMAN): Review test coverage (especially completion blocking and depth limit). Confirm red phase.
  **Verification:** Approved; all failing.

---

## [ ] API-PROJ-007: Tasks – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `TaskRepository` or `TaskService` exists.
**Size:** Large

**Description:** Implement `TaskRepository` (project-scoped, subtask-aware, board-ordered queries) and `TaskService` (subtask depth validation, completion blocking, board positioning, event emission) using neverthrow Results.

**Depends on:** DB-PROJ-002 (tasks schema), `ProjectRepository` (for completion trigger — project progress update), EVENT-001, ERROR-002.
**Blocks:** API-PROJ-008 (routes), API-PROJ-003 (task completion triggers project `progress_percent` update).
**Related Files:** `lib/db/src/repositories/projects/tasks.ts`, `artifacts/api-server/src/services/projects/task-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `tasks` table, `ProjectRepository`, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `TaskRepository`, `TaskService`

**Definition of Done**
- [ ] `TaskRepository`: `findById`, `findByProject` (paginated, status/lane/assignee/parent filtered, `ORDER BY position ASC`), `create`, `update`, `updateStatus`, `softDelete`, `findSubtasks` (by `parent_task_id`).
- [ ] `TaskService`: `listTasks`, `getTask`, `createTask`, `updateTask`, `completeTask`, `deleteTask`. All return `Result<T, DomainError>`.
- [ ] `createTask` validates subtask depth: if `parent_task_id` is set, verify parent task has no `parent_task_id` itself → `err(MaxSubtaskDepthExceeded)` if violation.
- [ ] `completeTask` checks all subtasks are `done` or `cancelled` first → `err(CannotCompleteWithOpenSubtasks)` if any open.
- [ ] After `completeTask`, emits `TaskCompleted` event; project `progress_percent` is automatically recomputed via SQL aggregate on next `getProject` call (no cache invalidation needed).
- [ ] `position` for new tasks: set to `MAX(position) + 1000` within the same `lane_id` and project (sparse positioning for cheap reordering).
- [ ] `TaskCreated`, `TaskCompleted` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Bulk position reorder (API-PROJ-014)
- My Week bucketing (API-PROJ-013)
- Task dependency graph (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow tasks from different projects to be linked as subtasks

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/projects/tasks.ts`, `artifacts/api-server/src/services/projects/task-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/projects/__tests__/task-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: subtask depth not validated → halt and add depth check.

**Rules to Follow**
- Subtask max depth = 1 (tasks can have subtasks; subtasks cannot have further subtasks).
- `position` gap strategy: `MAX(position) + 1000` within lane — never densely packed (allows cheap insertions without reordering all rows).
- All methods return `Result<T, DomainError>` — no `throw`.
- Cross-project subtask check: if `parent_task_id` is set, verify parent task `project_id` matches current task `project_id`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/projects/__tests__/task-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Depth check: `if (dto.parentTaskId) { const parent = await taskRepo.findById(dto.parentTaskId, orgId); if (!parent) return err(new TaskNotFound(dto.parentTaskId)); if (parent.parentTaskId) return err(new MaxSubtaskDepthExceeded()); if (parent.projectId !== dto.projectId) return err(new CrossProjectSubtaskNotAllowed()); }`.
- Completion block check: `const openSubtasks = await taskRepo.findSubtasks(task.id, { status: ['todo', 'in_progress', 'in_review'] }); if (openSubtasks.length > 0) return err(new CannotCompleteWithOpenSubtasks(task.id, openSubtasks.map(s => s.id)))`.
- Sparse positioning: `const maxPos = await taskRepo.maxPositionInLane(dto.laneId, dto.projectId); const position = (maxPos ?? 0) + 1000`.

**Anti-Patterns**
- Densely packing positions (1, 2, 3, ...) — requires full reorder on every insert/move.
- Not validating cross-project subtask links (orphaned tasks with invalid project references).
- Using N+1 queries for completion blocking check (use single `WHERE status NOT IN ('done', 'cancelled')` query).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tasks are a child aggregate of Projects. Subtask depth and completion blocking are core domain invariants enforced by `TaskService`.
- TDD: Unit tests for depth validation, completion blocking, positioning, and cross-project subtask rejection.
- BDD: "When a subtask is created for a task that is already a subtask, the service returns MaxSubtaskDepthExceeded."
- Deep Module: `TaskService.completeTask(id, orgId)` hides subtask completion check, status update, progress recalc trigger, and event emission.

---

### Subtasks
- [ ] API-PROJ-007.0.25 (AGENT): Read DB-PROJ-002 tasks schema, `parent_task_id` constraint, and `position` field.
  *No action — pause until fully understood.*

- [ ] API-PROJ-007.0.5 (AGENT): Research Drizzle query for MAX(position) within a lane and subtask depth check (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-007.0.75 (AGENT): Confirm whether completion of a cancelled task should update project progress.
  *If uncertain, ask the user before executing.*

- [ ] API-PROJ-007.1 (AGENT): Implement `TaskRepository` (subtask-aware, board-ordered, position gap strategy).
  **File(s):** `lib/db/src/repositories/projects/tasks.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-007.2 (AGENT): Implement `TaskService` with depth validation, completion blocking, and events.
  **File(s):** `artifacts/api-server/src/services/projects/task-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-007.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/projects/__tests__/task-service.test.ts`
  **Verification:** `pnpm test -- task-service.test.ts` green ; `pnpm typecheck`

- [ ] API-PROJ-007.4 (HUMAN): Review depth validation, completion blocking, and position strategy. Sign off.
  **Verification:** Approved; all invariants enforced; all tests green.

---

## [ ] API-PROJ-008: Tasks – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No task routes wired.
**Size:** Small

**Description:** Create project task route handlers (CRUD + complete action), mount the router under the projects router, and run integration tests to green.

**Depends on:** API-PROJ-007 (TaskService), API-PROJ-006 (tests), API-PROJ-004 (projects router must exist before task sub-router), AUTH-008.
**Blocks:** [N/A] — tasks complete the core task API.
**Related Files:** `artifacts/api-server/src/routes/projects/tasks.ts`, `artifacts/api-server/src/routes/projects/projects.ts`

**Imports / Exports**
- Imports: `TaskService`, `CreateTaskSchema`, `UpdateTaskSchema`, `authMiddleware`
- Exports: task routes mounted at `/api/v1/projects/:projectId/tasks`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST complete, DELETE (soft) handlers.
- [ ] `CannotCompleteWithOpenSubtasks` → 400; `MaxSubtaskDepthExceeded` → 400; `TaskNotFound` → 404.
- [ ] `pnpm test -- tasks.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Bulk reorder route (API-PROJ-014)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/projects/tasks.ts`, `artifacts/api-server/src/routes/projects/projects.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Mount tasks router with `mergeParams: true` to access `projectId` from parent router.
- `projectId` from `req.params.projectId` (injected by Express param merging).
- `organizationId` from `req.user.organizationId` only.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/tasks.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Merge params: `const tasksRouter = Router({ mergeParams: true }); projectsRouter.use('/:projectId/tasks', tasksRouter)`.

**Anti-Patterns**
- Missing `mergeParams: true` (causes `req.params.projectId` to be undefined in task routes).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer. All business logic in `TaskService`.
- TDD: Green phase for tasks.
- BDD: All API-PROJ-006 scenarios pass.
- Deep Module: Routes delegate to `TaskService`.

---

### Subtasks
- [ ] API-PROJ-008.0.25 (AGENT): Read Express `mergeParams` routing pattern and `routes/projects/projects.ts`.
  *No action — pause until fully understood.*

- [ ] API-PROJ-008.1 (AGENT): Implement tasks router with `mergeParams` and mount under projects router.
  **File(s):** `artifacts/api-server/src/routes/projects/tasks.ts`, `artifacts/api-server/src/routes/projects/projects.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-008.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- tasks.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-008.3 (HUMAN): Final sign-off. Verify `mergeParams` and completion blocking routes.
  **Verification:** Approved; 0 failures.

---

## [ ] API-PROJ-009: Milestones – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No milestone endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add project milestone CRUD endpoints, completion action (one-way), and due-date fields to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-PROJ-003 (milestones schema), API-PROJ-001 (project FK reference).
**Blocks:** API-PROJ-010, API-PROJ-011, API-PROJ-012.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `MilestoneSchema`, `CreateMilestoneSchema`, `UpdateMilestoneSchema` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/milestones` with `page`, `limit`, `completed` (boolean) query params.
- [ ] `POST /api/v1/projects/{projectId}/milestones` with `CreateMilestoneRequestBody`.
- [ ] `GET /api/v1/projects/{projectId}/milestones/{milestoneId}` defined.
- [ ] `PATCH /api/v1/projects/{projectId}/milestones/{milestoneId}` — only for incomplete milestones.
- [ ] `DELETE /api/v1/projects/{projectId}/milestones/{milestoneId}` — only for incomplete milestones (soft delete).
- [ ] `POST /api/v1/projects/{projectId}/milestones/{milestoneId}/complete` — one-way completion; sets `completed_at`.
- [ ] `MilestoneSchema`: `title`, `description`, `due_date`, `completed_at` (readOnly), `project_id`.
- [ ] Codegen runs successfully.

**Out of Scope**
- Milestone-to-task linking (future)
- Critical path (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- `completed_at` is `readOnly: true` — set by server when `/complete` action is called.
- Milestone completion is irreversible — document in spec.
- PATCH and DELETE on completed milestones must be rejected (documented in spec, enforced in service).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `completed_at`: `type: string, format: date-time, readOnly: true, nullable: true` — null for incomplete milestones.
- Completion irreversibility: documented as "Once complete, a milestone cannot be re-opened."

**Anti-Patterns**
- Making `completed_at` writeable (clients must not set completion timestamps directly).
- Missing spec description for completion irreversibility.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestones mark key project lifecycle events. Completion is a one-way domain transition.
- TDD: Spec enables API-PROJ-010 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Narrow spec interface for milestones.

---

### Subtasks
- [ ] API-PROJ-009.0.25 (AGENT): Read DB-PROJ-003 milestones schema and understand completion irreversibility.
  *No action — pause until fully understood.*

- [ ] API-PROJ-009.1 (AGENT): Add `Milestone` schema and all milestone endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-009.2 (HUMAN): Review — confirm `completed_at` is readOnly and irreversibility documented. Sign off.
  **Verification:** Approved.

---

## [ ] API-PROJ-010: Milestones – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No milestone integration tests.
**Size:** Medium

**Description:** Write project milestone integration tests covering CRUD, one-way completion, irreversibility, and auth — all must fail (red).

**Depends on:** API-PROJ-009 (spec + generated schemas), API-PROJ-002 (project seeding).
**Blocks:** API-PROJ-012 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/projects/milestones.test.ts`

**Imports / Exports**
- Imports: generated `MilestoneSchema`, `CreateMilestoneSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: create milestone (201), list (filtered by `completed` boolean), get by ID, PATCH (incomplete only), complete milestone (sets `completed_at`), attempt PATCH on completed milestone → 400, attempt complete already-completed → 400, soft delete (incomplete only), attempt delete completed → 400, 404, 401.
- [ ] `completed_at` test: verify `completed_at` is null initially; after `/complete` call, `completed_at` is a valid ISO timestamp.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Milestone-to-task blocking (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/milestones.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete test file if infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Irreversibility test: attempt `/complete` on an already-completed milestone → 400 `MilestoneAlreadyCompleted`.
- `completed_at` set-by-server test: verify client cannot set `completed_at` via PATCH.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/milestones.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Completed_at test: `expect(milestone.completed_at).toBeNull(); const updated = await completeMilestone(milestone.id); expect(updated.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)`.

**Anti-Patterns**
- Not testing irreversibility (critical — re-completing a milestone is an invalid domain operation).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestone completion is a one-way domain event. Re-completion must be rejected.
- TDD: Red phase.
- BDD: "When a milestone is already completed, attempting to complete it again returns 400 MilestoneAlreadyCompleted."
- Deep Module: Black-box tests.

---

### Subtasks
- [ ] API-PROJ-010.0.25 (AGENT): Read API-PROJ-010 and generated milestone schemas.
  *No action — pause until fully understood.*

- [ ] API-PROJ-010.1 (AGENT): Write all milestone integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/projects/milestones.test.ts`
  **Verification:** `pnpm test -- milestones.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-PROJ-010.2 (HUMAN): Review test coverage. Confirm red phase and irreversibility test included.
  **Verification:** Approved.

---

## [ ] API-PROJ-011: Milestones – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `MilestoneRepository` or `MilestoneService` exists.
**Size:** Large

**Description:** Implement `MilestoneRepository` (project-scoped) and `MilestoneService` (one-way completion with timestamp, guard against editing completed milestones) using neverthrow Results.

**Depends on:** DB-PROJ-003 (milestones schema), EVENT-001, ERROR-002.
**Blocks:** API-PROJ-012 (routes).
**Related Files:** `lib/db/src/repositories/projects/milestones.ts`, `artifacts/api-server/src/services/projects/milestone-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `milestones` table, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `MilestoneRepository`, `MilestoneService`

**Definition of Done**
- [ ] `MilestoneRepository`: `findById`, `findByProject` (paginated, `completed` boolean filter), `create`, `update`, `setCompleted` (sets `completed_at = NOW()`), `softDelete`.
- [ ] `MilestoneService`: `listMilestones`, `getMilestone`, `createMilestone`, `updateMilestone`, `completeMilestone`, `deleteMilestone`. All return `Result<T, DomainError>`.
- [ ] `completeMilestone` rejects if already completed → `err(MilestoneAlreadyCompleted)`.
- [ ] `updateMilestone` and `deleteMilestone` reject if milestone is completed → `err(CannotModifyCompletedMilestone)`.
- [ ] `MilestoneCompleted` domain event emitted with `{ milestoneId, projectId, completedAt, orgId }`.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Milestone blocking task completion (future)
- Critical path calculation (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow re-completion or editing of completed milestones

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/projects/milestones.ts`, `artifacts/api-server/src/services/projects/milestone-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/projects/__tests__/milestone-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: re-completion of milestone accepted → halt and add idempotency guard.

**Rules to Follow**
- `completeMilestone` is NOT idempotent — second call must return `err(MilestoneAlreadyCompleted)` (milestone completion is a domain event, not a toggle).
- `setCompleted` in repository uses `UPDATE milestones SET completed_at = NOW() WHERE id = $id AND completed_at IS NULL RETURNING *` — atomically ensures no race condition.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/projects/__tests__/milestone-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Atomic completion with `WHERE completed_at IS NULL`: ensures a concurrent `/complete` call does not double-record.
- `MilestoneCompleted` event: `{ type: 'MilestoneCompleted', payload: { milestoneId, projectId, completedAt: new Date(), orgId } }`.

**Anti-Patterns**
- Making `completeMilestone` idempotent (silently returning success on second call) — milestone completion is a domain event and must be recorded once only.
- Separate SELECT + UPDATE (race condition — use single UPDATE with WHERE clause).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestone completion is a one-way domain event. The service enforces this invariant.
- TDD: Unit tests for completion guard, edit guard, and delete guard.
- BDD: "When completeMilestone is called on an already-completed milestone, it returns MilestoneAlreadyCompleted."
- Deep Module: `MilestoneService.completeMilestone(id, orgId)` hides completion guard, atomic update, and event emission.

---

### Subtasks
- [ ] API-PROJ-011.0.25 (AGENT): Read DB-PROJ-003 schema and understand `completed_at` column and atomic update pattern.
  *No action — pause until fully understood.*

- [ ] API-PROJ-011.0.5 (AGENT): Research Drizzle UPDATE with WHERE clause returning (for atomic completion check) as of May 2026.
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-011.1 (AGENT): Implement `MilestoneRepository` (with atomic `setCompleted`).
  **File(s):** `lib/db/src/repositories/projects/milestones.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-011.2 (AGENT): Implement `MilestoneService` with completion guard and events.
  **File(s):** `artifacts/api-server/src/services/projects/milestone-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-011.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/projects/__tests__/milestone-service.test.ts`
  **Verification:** `pnpm test -- milestone-service.test.ts` green ; `pnpm typecheck`

- [ ] API-PROJ-011.4 (HUMAN): Review completion atomicity and guard logic. Sign off.
  **Verification:** Approved; atomic completion confirmed; all tests green.

---

## [ ] API-PROJ-012: Milestones – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No milestone routes wired.
**Size:** Small

**Description:** Create milestone route handlers (CRUD + complete action), mount the router under the projects router, and run integration tests to green.

**Depends on:** API-PROJ-011 (MilestoneService), API-PROJ-010 (tests), API-PROJ-004 (projects router exists), AUTH-008.
**Blocks:** [N/A] — terminal task in PROJECTS-CORE.
**Related Files:** `artifacts/api-server/src/routes/projects/milestones.ts`, `artifacts/api-server/src/routes/projects/projects.ts`

**Imports / Exports**
- Imports: `MilestoneService`, `CreateMilestoneSchema`, `UpdateMilestoneSchema`, `authMiddleware`
- Exports: milestone routes mounted at `/api/v1/projects/:projectId/milestones`

**Definition of Done**
- [ ] GET list, POST, GET by ID, PATCH, POST complete, DELETE (soft) handlers.
- [ ] `MilestoneAlreadyCompleted` → 400; `CannotModifyCompletedMilestone` → 400; `MilestoneNotFound` → 404.
- [ ] `pnpm test -- milestones.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/projects/milestones.ts`, `artifacts/api-server/src/routes/projects/projects.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Mount with `mergeParams: true` (same as tasks router) to access `projectId` from parent.
- `organizationId` from `req.user.organizationId` only.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/projects/milestones.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Same `mergeParams: true` pattern as tasks router.

**Anti-Patterns**
- Missing `mergeParams: true` (causes `req.params.projectId` to be undefined).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer. All domain logic in `MilestoneService`.
- TDD: Green phase for milestones.
- BDD: All API-PROJ-010 scenarios pass.
- Deep Module: Routes delegate to `MilestoneService`.

---

### Subtasks
- [ ] API-PROJ-012.0.25 (AGENT): Read `routes/projects/tasks.ts` as `mergeParams` pattern.
  *No action — pause until fully understood.*

- [ ] API-PROJ-012.1 (AGENT): Implement milestones router with `mergeParams` and mount under projects router.
  **File(s):** `artifacts/api-server/src/routes/projects/milestones.ts`, `artifacts/api-server/src/routes/projects/projects.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-012.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- milestones.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-012.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures; completion irreversibility confirmed.

---

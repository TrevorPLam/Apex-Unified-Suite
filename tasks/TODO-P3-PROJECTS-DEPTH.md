# TODO-P3-PROJECTS-DEPTH.md – Phase 3: Projects Depth API

## Tasks in this file
- API-PROJ-013: My Week Planning API
- API-PROJ-014: Board & Queue API (Lane Management + Bulk Reorder)
- API-PROJ-015: Composite Project Workspace Endpoints
- API-PROJ-016: Project Templates – CRUD & Versioning
- API-PROJ-017: Project Creation from Template

---

## [ ] API-PROJ-013: My Week Planning API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No "My Week" planning endpoints exist. Users have no personal task bucketing API.
**Size:** Large

**Description:** Implement a personal weekly planning API allowing users to assign tasks to focus buckets (`Focus`, `This Week`, `Later`), with carry-over of incomplete tasks to the next week and a `MyWeekUpdated` event.

**Depends on:** API-PROJ-008 (tasks must exist), DB-PROJ-004 (my_week_items schema), AUTH-008, EVENT-001, ERROR-002.
**Blocks:** [N/A] — standalone depth feature.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/my-week.ts`, `artifacts/api-server/src/services/projects/my-week-service.ts`, `artifacts/api-server/src/routes/projects/my-week.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `myWeekItems` table, `TaskRepository`, `DomainEventBus`, `neverthrow`
- Exports: `MyWeekRepository`, `MyWeekService`, `myWeekRouter`; generated `MyWeekItemSchema`, `MyWeekBucketEnum` hooks (via codegen)

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/projects/my-week` — returns all tasks bucketed for current user in current ISO week.
- [ ] `PUT /api/v1/projects/my-week/{taskId}` — assign a task to a bucket (`focus`, `this_week`, `later`) for the current week; creates or updates the `my_week_items` record.
- [ ] `DELETE /api/v1/projects/my-week/{taskId}` — remove a task from My Week (current week only).
- [ ] `MyWeekBucketEnum`: `focus`, `this_week`, `later`.
- [ ] Carry-over: a scheduled job (or on-read lazy trigger) moves `focus` and `this_week` incomplete items to next week's `focus` bucket on week boundary. Document the strategy (lazy carry-over on first GET of new week).
- [ ] `MyWeekUpdated` domain event emitted with `{ userId, weekNumber, year, changes: TaskId[] }`.
- [ ] `my_week_items` table: `(user_id, task_id, week_number, year, bucket)` with unique constraint on `(user_id, task_id, week_number, year)`.
- [ ] Integration tests: get My Week (empty, then with tasks), assign to bucket (PUT), remove from bucket, carry-over (simulate new week, verify previous items appear in new week), 401.
- [ ] Unit tests for `MyWeekService`: bucket assignment, carry-over logic, `MyWeekUpdated` event.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Team-level "sprint" planning (separate feature)
- Calendar integration
- Push notifications for My Week carry-over

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/my-week.ts`, `artifacts/api-server/src/services/projects/my-week-service.ts`, `artifacts/api-server/src/routes/projects/my-week.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/my-week.test.ts`, `artifacts/api-server/src/services/projects/__tests__/my-week-service.test.ts`
- Documentation: [N/A]
- Migration files: DB-PROJ-004 (my_week_items table migration)

**Rollback**
- Granularity: file-level — remove route, service, repository; revert spec.
- Halt condition: carry-over duplicating tasks across weeks → halt and fix unique constraint.

**Rules to Follow**
- ISO week numbering: use `date-fns` `getISOWeek` and `getISOWeekYear` to determine `week_number` and `year` for current week.
- Lazy carry-over: on `GET /my-week`, check if previous week has incomplete `focus` or `this_week` items for the user; if so, insert them into current week before returning.
- `PUT` is upsert semantics — if same `(user_id, task_id, week_number, year)` exists, update `bucket`; else insert.
- All methods return `Result<T, DomainError>` — no `throw`.
- Task must belong to the same `organization_id` as the requesting user (validate via task lookup).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm test -- artifacts/api-server/__tests__/api/projects/my-week.test.ts
pnpm test -- artifacts/api-server/src/services/projects/__tests__/my-week-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- ISO week: `import { getISOWeek, getISOWeekYear } from 'date-fns'; const weekNumber = getISOWeek(new Date()); const year = getISOWeekYear(new Date())`.
- Upsert: `db.insert(myWeekItems).values({ userId, taskId, weekNumber, year, bucket }).onConflictDoUpdate({ target: [myWeekItems.userId, myWeekItems.taskId, myWeekItems.weekNumber, myWeekItems.year], set: { bucket } })`.
- Lazy carry-over: `const prevWeekItems = await myWeekRepo.findIncomplete(userId, prevWeek, prevYear, ['focus', 'this_week']); if (prevWeekItems.length > 0) { await myWeekRepo.bulkUpsert(prevWeekItems.map(i => ({ ...i, weekNumber: currentWeek, year: currentYear, bucket: 'focus' }))); }`.

**Anti-Patterns**
- Using calendar week (Sunday-start) instead of ISO week (Monday-start) — inconsistent with standard week planning tools.
- Carry-over via scheduled job without lazy fallback (tasks missed if scheduler fails).
- Task validation missing (allows My Week to reference tasks from other organizations).

**DDD / TDD / BDD / Deep Module notes**
- DDD: My Week is a personal planning projection over the Tasks aggregate. It uses `week_number/year` as the planning period identifier.
- TDD: Unit tests for carry-over logic, bucket upsert, and event emission.
- BDD: "When a user views My Week at the start of a new week, incomplete Focus and This Week tasks from the previous week automatically appear in the current week's Focus bucket."
- Deep Module: `MyWeekService.getMyWeek(userId, orgId)` hides lazy carry-over, ISO week calculation, task scoping, and event emission.

---

### Subtasks
- [ ] API-PROJ-013.0.25 (AGENT): Read DB-PROJ-004 schema, `date-fns` ISO week API, and lazy carry-over pattern.
  *No action — pause until fully understood.*

- [ ] API-PROJ-013.0.5 (AGENT): Research `date-fns` ISO week functions and Drizzle upsert `onConflictDoUpdate` (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-013.0.75 (AGENT): Confirm carry-over strategy — lazy (on first GET of new week) vs scheduled job — with user.
  *If uncertain, ask the user before executing.*

- [ ] API-PROJ-013.1 (AGENT): Add My Week spec endpoints and `MyWeekBucketEnum` to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-013.2 (AGENT): Implement `MyWeekRepository` with upsert and `findIncomplete` for carry-over.
  **File(s):** `lib/db/src/repositories/projects/my-week.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-013.3 (AGENT): Implement `MyWeekService` with lazy carry-over, ISO week calculation, and event.
  **File(s):** `artifacts/api-server/src/services/projects/my-week-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-013.4 (AGENT): Write integration and unit tests; run codegen first.
  **File(s):** `artifacts/api-server/__tests__/api/projects/my-week.test.ts`, `artifacts/api-server/src/services/projects/__tests__/my-week-service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`

- [ ] API-PROJ-013.5 (AGENT): Implement route and mount.
  **File(s):** `artifacts/api-server/src/routes/projects/my-week.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- my-week.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-013.6 (HUMAN): Review carry-over logic, ISO week calculation, and event. Sign off.
  **Verification:** Approved; carry-over confirmed; ISO week correct; 0 test failures.

---

## [ ] API-PROJ-014: Board & Queue API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No board lane management or bulk task reorder endpoints. `lane_id` and `position` exist on tasks but no lane CRUD or reorder API.
**Size:** Large

**Description:** Implement board lane CRUD (create, list, rename, delete, reorder lanes), bulk task reorder within a lane (efficient positional update), and queue ownership endpoints.

**Depends on:** API-PROJ-008 (tasks with `lane_id` and `position`), DB-PROJ-005 (lanes schema), AUTH-008, EVENT-001, ERROR-002.
**Blocks:** [N/A] — standalone depth feature; downstream UI depends on this.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/lanes.ts`, `artifacts/api-server/src/services/projects/board-service.ts`, `artifacts/api-server/src/routes/projects/board.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `lanes` and `tasks` tables, `DomainEventBus`, `neverthrow`
- Exports: `LaneRepository`, `BoardService`, `boardRouter`; generated `LaneSchema`, `ReorderTasksSchema`, `ReorderLanesSchema` hooks (via codegen)

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/projects/{projectId}/board` — returns all lanes with their tasks (ordered by `position`).
- [ ] `POST /api/v1/projects/{projectId}/board/lanes` — create a new lane with `title` and initial `position`.
- [ ] `PATCH /api/v1/projects/{projectId}/board/lanes/{laneId}` — rename or update lane color.
- [ ] `DELETE /api/v1/projects/{projectId}/board/lanes/{laneId}` — soft delete lane; tasks in lane move to a default lane (not orphaned).
- [ ] `POST /api/v1/projects/{projectId}/board/lanes/reorder` — reorder all lanes; body: `{ orderedLaneIds: string[] }`.
- [ ] `POST /api/v1/projects/{projectId}/board/lanes/{laneId}/tasks/reorder` — bulk reorder tasks within a lane; body: `{ orderedTaskIds: string[] }`.
- [ ] Reorder uses gap strategy: assigns positions 1000, 2000, 3000, ... from the submitted ordered list.
- [ ] `LaneSchema`: `id`, `project_id`, `title`, `color`, `position`, `is_default` (boolean).
- [ ] Queue ownership: `PATCH /api/v1/projects/{projectId}/board/lanes/{laneId}/owner` — assign a user as the queue owner for a lane.
- [ ] Integration tests and unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- WIP limits (future)
- Swimlanes (future)
- Cross-project boards (future)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never delete the default lane without migrating tasks first

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/lanes.ts`, `artifacts/api-server/src/services/projects/board-service.ts`, `artifacts/api-server/src/routes/projects/board.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/board.test.ts`, `artifacts/api-server/src/services/projects/__tests__/board-service.test.ts`
- Documentation: [N/A]
- Migration files: DB-PROJ-005 (lanes table migration)

**Rollback**
- Granularity: file-level — remove routes, service, repository; revert spec.
- Halt condition: default lane deleted with tasks orphaned → halt; add default lane guard.

**Rules to Follow**
- Default lane: each project has exactly one `is_default = true` lane that cannot be deleted; tasks in deleted lanes move to the default lane.
- Bulk reorder transaction: update all task positions in a single transaction using `orderedTaskIds.map((id, index) => ({ id, position: (index + 1) * 1000 }))`.
- Lane positions also use gap strategy: `orderedLaneIds.map((id, index) => ({ id, position: (index + 1) * 1000 }))`.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm test -- artifacts/api-server/__tests__/api/projects/board.test.ts
pnpm test -- artifacts/api-server/src/services/projects/__tests__/board-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Bulk reorder in transaction: `db.transaction(async (tx) => { await Promise.all(orderedTaskIds.map((id, idx) => tx.update(tasks).set({ position: (idx + 1) * 1000 }).where(and(eq(tasks.id, id), eq(tasks.laneId, laneId), eq(tasks.projectId, projectId))))); })`.
- Default lane guard for delete: `if (lane.isDefault) return err(new CannotDeleteDefaultLane(lane.id)); const defaultLane = await laneRepo.findDefault(projectId); await taskRepo.moveLane(laneId, defaultLane.id);`.
- GET board: join lanes + tasks + assignees in one query, group by lane.

**Anti-Patterns**
- Updating task positions one by one with N separate UPDATE queries (use a transaction with all updates).
- Deleting a lane without migrating its tasks (orphans tasks with NULL lane_id).
- Dense positions (1, 2, 3) in initial lane creation (makes future reorder expensive).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Board lanes are a view-optimisation of the Task aggregate. The `position` field on tasks enables ordered board views.
- TDD: Unit tests for reorder algorithm, default lane guard, and task migration on lane delete.
- BDD: "When a lane is deleted, all its tasks are automatically moved to the project's default lane."
- Deep Module: `BoardService.reorderTasksInLane(laneId, orderedTaskIds, projectId, orgId)` hides gap calculation, transactional bulk update, and position validation.

---

### Subtasks
- [ ] API-PROJ-014.0.25 (AGENT): Read DB-PROJ-005 lanes schema, `tasks.lane_id`, `tasks.position`, and existing gap-position strategy from API-PROJ-007.
  *No action — pause until fully understood.*

- [ ] API-PROJ-014.0.5 (AGENT): Research Drizzle bulk UPDATE in transaction and efficient board GET with joins (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-014.0.75 (AGENT): Confirm default lane behavior and queue ownership semantics with user.
  *If uncertain, ask the user before executing.*

- [ ] API-PROJ-014.1 (AGENT): Add board/lane spec endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-014.2 (AGENT): Implement `LaneRepository` with `findDefault` and `moveLane`.
  **File(s):** `lib/db/src/repositories/projects/lanes.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-014.3 (AGENT): Implement `BoardService` with reorder, default lane guard, and queue ownership.
  **File(s):** `artifacts/api-server/src/services/projects/board-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-014.4 (AGENT): Write integration and unit tests.
  **File(s):** `artifacts/api-server/__tests__/api/projects/board.test.ts`, `artifacts/api-server/src/services/projects/__tests__/board-service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`

- [ ] API-PROJ-014.5 (AGENT): Implement board route and mount.
  **File(s):** `artifacts/api-server/src/routes/projects/board.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- board.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-014.6 (HUMAN): Review default lane guard, bulk reorder transaction, and queue ownership. Sign off.
  **Verification:** Approved; default lane cannot be deleted; reorder is transactional; 0 test failures.

---

## [ ] API-PROJ-015: Composite Project Workspace Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** All project sub-resources (tasks, milestones, board) require separate API calls. No composite "workspace" endpoint for efficient single-request page load.
**Size:** Medium

**Description:** Add composite read endpoints that return a project along with its tasks, milestones, and board in a single response — optimising for the frontend project workspace page load.

**Depends on:** API-PROJ-004 (projects routes), API-PROJ-008 (tasks routes), API-PROJ-012 (milestones routes), API-PROJ-014 (board routes).
**Blocks:** [N/A] — read-only aggregation layer.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/routes/projects/workspace.ts`, `artifacts/api-server/src/services/projects/workspace-service.ts`

**Imports / Exports**
- Imports: `ProjectService`, `TaskService`, `MilestoneService`, `BoardService`
- Exports: `WorkspaceService`, `workspaceRouter`; generated `ProjectWorkspaceSchema` hook (via codegen)

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/projects/{projectId}/workspace` — returns a single response with `{ project, board, milestones, recentActivity }`.
- [ ] `GET /api/v1/projects/{projectId}/workspace/summary` — lightweight summary: `{ project, openTaskCount, completedTaskCount, overdueMilestoneCount, progress_percent }`.
- [ ] `ProjectWorkspaceSchema` as a composite schema in spec.
- [ ] `WorkspaceService.getWorkspace(projectId, orgId)` calls `ProjectService.getProject`, `BoardService.getBoard`, `MilestoneService.listMilestones` in parallel with `Promise.all`.
- [ ] Response time target: < 200ms (documented, not enforced — note in spec).
- [ ] Integration tests: GET workspace (all sub-views populated), GET summary, 404 on unknown project, 401.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Mutations via workspace endpoint (write through individual sub-resource endpoints)
- Real-time workspace updates (WebSocket — future task)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/routes/projects/workspace.ts`, `artifacts/api-server/src/services/projects/workspace-service.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/workspace.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove workspace route and service.
- Halt condition: workspace endpoint takes > 500ms consistently in tests → profile and add query optimisations.

**Rules to Follow**
- `WorkspaceService` is a pure aggregation layer — no business logic, no state mutation.
- All sub-service calls in `Promise.all` — never sequential (minimise latency).
- `summary` endpoint calculates counts via SQL aggregate queries, not application-level counting.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm test -- artifacts/api-server/__tests__/api/projects/workspace.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Parallel service calls: `const [project, board, milestones] = await Promise.all([ projectService.getProject(projectId, orgId), boardService.getBoard(projectId, orgId), milestoneService.listMilestones(projectId, orgId, { limit: 50 }) ])`.
- Result unwrapping: use `neverthrow` `combine` or manual `isErr` checks on each result before assembling response.

**Anti-Patterns**
- Sequential service calls (creates latency proportional to number of sub-services).
- Duplicating business logic in `WorkspaceService` (it should only aggregate, not enforce domain rules).

**DDD / TDD / BDD / Deep Module notes**
- DDD: `WorkspaceService` is an Application Service (not a Domain Service) — it orchestrates multiple domain services without containing domain logic.
- TDD: Integration tests verify the composite response shape.
- BDD: "When the project workspace is loaded, the response includes the project, all board lanes with tasks, and upcoming milestones in a single request."
- Deep Module: `WorkspaceService.getWorkspace(projectId, orgId)` hides parallel fetching, Result aggregation, and response shaping.

---

### Subtasks
- [ ] API-PROJ-015.0.25 (AGENT): Read all existing project sub-service interfaces before designing the aggregation.
  *No action — pause until fully understood.*

- [ ] API-PROJ-015.1 (AGENT): Add `ProjectWorkspace` and `ProjectWorkspaceSummary` schemas + endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-015.2 (AGENT): Implement `WorkspaceService` with `Promise.all` parallel aggregation.
  **File(s):** `artifacts/api-server/src/services/projects/workspace-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-015.3 (AGENT): Write integration tests (workspace shape, summary counts, 404, 401).
  **File(s):** `artifacts/api-server/__tests__/api/projects/workspace.test.ts`
  **Verification:** `pnpm test -- workspace.test.ts` green ; `pnpm typecheck`

- [ ] API-PROJ-015.4 (AGENT): Implement workspace route and mount.
  **File(s):** `artifacts/api-server/src/routes/projects/workspace.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- workspace.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-015.5 (HUMAN): Review parallel aggregation, response shape, and summary counts. Sign off.
  **Verification:** Approved; 0 failures; no sequential calls.

---

## [ ] API-PROJ-016: Project Templates – CRUD & Versioning
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project template endpoints exist. Users cannot create or manage reusable project structures.
**Size:** Large

**Description:** Implement project template CRUD with versioning and soft delete. Templates define a reusable project structure (default lanes, default tasks, milestone schema) without creating live projects.

**Depends on:** DB-PROJ-006 (project_templates + template_versions schema), AUTH-008, EVENT-001, ERROR-002.
**Blocks:** API-PROJ-017 (template instantiation reads templates).
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/templates.ts`, `artifacts/api-server/src/services/projects/template-service.ts`, `artifacts/api-server/src/routes/projects/templates.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `projectTemplates`, `templateVersions` tables, `DomainEventBus`, `neverthrow`
- Exports: `TemplateRepository`, `TemplateService`, `templatesRouter`; generated `ProjectTemplateSchema`, `CreateProjectTemplateSchema` hooks (via codegen)

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/project-templates`, `POST`, `GET /{templateId}`, `PATCH /{templateId}`, `DELETE /{templateId}` (soft).
- [ ] `POST /api/v1/project-templates/{templateId}/versions` — create a new version snapshot of the template definition.
- [ ] `GET /api/v1/project-templates/{templateId}/versions` — list all versions (paginated).
- [ ] `ProjectTemplateSchema`: `title`, `description`, `default_lanes: LaneDefinition[]`, `default_tasks: TaskDefinition[]`, `default_milestones: MilestoneDefinition[]`, `is_public` (org-level sharing), `version` (integer, auto-incremented on definition change).
- [ ] `TemplateRepository`: `findById`, `findByOrg` (with `is_public` filter), `create`, `update`, `softDelete`, `createVersion`, `listVersions`.
- [ ] `TemplateService`: `listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate` (auto-increments `version`), `deleteTemplate`, `createVersion`, `listVersions`. All return `Result<T, DomainError>`.
- [ ] `updateTemplate` auto-increments `version` and creates a version snapshot.
- [ ] Integration tests and unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Template marketplace (cross-org sharing — future)
- Template import/export
- Project instantiation from template (API-PROJ-017)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `lib/db/src/repositories/projects/templates.ts`, `artifacts/api-server/src/services/projects/template-service.ts`, `artifacts/api-server/src/routes/projects/templates.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/templates.test.ts`, `artifacts/api-server/src/services/projects/__tests__/template-service.test.ts`
- Documentation: [N/A]
- Migration files: DB-PROJ-006 (project_templates, template_versions tables)

**Rollback**
- Granularity: file-level — remove routes, service, repository; revert spec.
- Halt condition: version counter not incrementing on update → halt and fix `updateTemplate`.

**Rules to Follow**
- `version` is an integer auto-incremented by the service on each `updateTemplate` call — never set by the client.
- `createVersion` stores a JSON snapshot of the full template definition at the current `version`.
- Soft delete: `deleted_at` column; `findByOrg` always filters `WHERE deleted_at IS NULL`.
- `is_public` allows any user in the same organization to instantiate the template (read-only access to public templates for non-owners).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm test -- artifacts/api-server/__tests__/api/projects/templates.test.ts
pnpm test -- artifacts/api-server/src/services/projects/__tests__/template-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Auto-version on update: `db.transaction(async (tx) => { const updated = await tx.update(projectTemplates).set({ ...dto, version: sql`${projectTemplates.version} + 1` }).where(...).returning(); await tx.insert(templateVersions).values({ templateId: updated.id, version: updated.version, definition: JSON.stringify(dto) }); return updated; })`.
- Version snapshot: `definition` column is JSONB — stores `{ lanes, tasks, milestones }` at the time of the version creation.

**Anti-Patterns**
- Storing template versions in a separate file or outside the DB (loses history on schema change).
- Allowing client to set the `version` field directly.
- Missing soft delete filter (exposes deleted templates to list queries).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Templates are an independent aggregate — they define a project structure without being a project. Versioning enables safe template evolution.
- TDD: Unit tests for auto-version increment, version snapshot creation, and soft delete filter.
- BDD: "When a template is updated, a version snapshot is automatically created and the version number is incremented."
- Deep Module: `TemplateService.updateTemplate(id, dto, orgId)` hides version increment, snapshot creation, and soft delete check.

---

### Subtasks
- [ ] API-PROJ-016.0.25 (AGENT): Read DB-PROJ-006 schema (project_templates, template_versions) and versioning strategy.
  *No action — pause until fully understood.*

- [ ] API-PROJ-016.0.5 (AGENT): Research Drizzle `sql` template literal for atomic version increment and JSONB column storage (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-016.1 (AGENT): Add template spec endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-016.2 (AGENT): Implement `TemplateRepository` with version snapshot creation.
  **File(s):** `lib/db/src/repositories/projects/templates.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-016.3 (AGENT): Implement `TemplateService` with auto-version and soft delete.
  **File(s):** `artifacts/api-server/src/services/projects/template-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-016.4 (AGENT): Write integration and unit tests.
  **File(s):** `artifacts/api-server/__tests__/api/projects/templates.test.ts`, `artifacts/api-server/src/services/projects/__tests__/template-service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`

- [ ] API-PROJ-016.5 (AGENT): Implement templates route and mount.
  **File(s):** `artifacts/api-server/src/routes/projects/templates.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- templates.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-016.6 (HUMAN): Review versioning strategy, soft delete filter, and `is_public` access control. Sign off.
  **Verification:** Approved; version auto-increments; soft delete filters; 0 test failures.

---

## [ ] API-PROJ-017: Project Creation from Template
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No template instantiation endpoint. Templates exist (API-PROJ-016) but cannot be used to create projects.
**Size:** Large

**Description:** Implement template instantiation — creating a live project (with lanes, tasks, milestones) from a template definition — including a dry-run preview mode and the `ProjectCreatedFromTemplate` domain event.

**Depends on:** API-PROJ-016 (templates must exist), API-PROJ-003 (ProjectService creates the project), API-PROJ-007 (TaskService creates tasks), API-PROJ-011 (MilestoneService creates milestones), API-PROJ-014 (BoardService creates lanes), DB-PROJ-001..DB-PROJ-006.
**Blocks:** [N/A] — terminal task in PROJECTS-DEPTH.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/projects/template-instantiation-service.ts`, `artifacts/api-server/src/routes/projects/templates.ts`

**Imports / Exports**
- Imports: `TemplateService`, `ProjectService`, `TaskService`, `MilestoneService`, `BoardService`, `DomainEventBus`, `neverthrow`
- Exports: `TemplateInstantiationService`; instantiation route added to `templatesRouter`

**Definition of Done**
- [ ] OpenAPI spec: `POST /api/v1/project-templates/{templateId}/instantiate` with `CreateProjectFromTemplateRequestBody`: `{ name, ownerId, startDate, dryRun?: boolean }`.
- [ ] `dryRun: true` — returns a preview `{ wouldCreate: { project, lanes, tasks, milestones } }` without writing to the database.
- [ ] `dryRun: false` (default) — creates the project and all child resources atomically in a single transaction.
- [ ] Instantiation: creates project, lanes (from `default_lanes`), tasks (from `default_tasks`, mapped to created lane IDs), milestones (from `default_milestones`).
- [ ] Date offset: if template task has `due_date_offset_days` (e.g., +7), calculate `dueDate = startDate + offset_days`.
- [ ] `ProjectCreatedFromTemplate` event emitted: `{ projectId, templateId, templateVersion, orgId }`.
- [ ] Access control: user must have access to the template (own it or `is_public = true`) and have permission to create projects.
- [ ] Integration tests and unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Template variable substitution (e.g., `{{client_name}}` in task titles — future)
- Async template instantiation for large templates
- Template versioning during instantiation (always uses latest version unless `version` param specified — document this)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow instantiation of a template from another organization (unless `is_public = true`)

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/projects/template-instantiation-service.ts`, `artifacts/api-server/src/routes/projects/templates.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/projects/template-instantiation.test.ts`, `artifacts/api-server/src/services/projects/__tests__/template-instantiation-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove instantiation route and service.
- Halt condition: partial project created on transaction failure (some lanes but no tasks) → halt; ensure entire instantiation is wrapped in a single transaction.

**Rules to Follow**
- Entire instantiation (project + lanes + tasks + milestones) in a single DB transaction. If any step fails, roll back everything.
- `dryRun` mode: compute the full instantiation preview in application code without any DB writes.
- Date offset calculation: `const dueDate = startDate ? addDays(new Date(startDate), task.dueDateOffsetDays ?? 0) : undefined`.
- `templateId` and `templateVersion` recorded on the project for audit trail.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm test -- artifacts/api-server/__tests__/api/projects/template-instantiation.test.ts
pnpm test -- artifacts/api-server/src/services/projects/__tests__/template-instantiation-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Transactional instantiation: `db.transaction(async (tx) => { const project = await projectRepo.create(tx, projectDto); const laneIdMap = new Map(); for (const laneDef of template.defaultLanes) { const lane = await laneRepo.create(tx, { ...laneDef, projectId: project.id }); laneIdMap.set(laneDef.tempId, lane.id); } await Promise.all(template.defaultTasks.map(taskDef => taskRepo.create(tx, { ...taskDef, projectId: project.id, laneId: laneIdMap.get(taskDef.tempLaneId), dueDate: startDate ? addDays(startDate, taskDef.dueDateOffsetDays ?? 0) : null }))); await Promise.all(template.defaultMilestones.map(msDef => milestoneRepo.create(tx, { ...msDef, projectId: project.id, dueDate: startDate ? addDays(startDate, msDef.dueDateOffsetDays ?? 0) : null }))); return project; })`.
- Dry-run: `if (dryRun) return ok({ wouldCreate: { project: projectDto, lanes: laneCreates, tasks: taskCreates, milestones: milestoneCreates } })` — no DB calls.
- Lane ID mapping: template tasks reference `tempLaneId` (a template-internal identifier); real lane IDs are assigned during instantiation and mapped via `laneIdMap`.

**Anti-Patterns**
- Non-transactional instantiation (partial project created on error — cannot be easily cleaned up).
- Dry-run that hits the database (defeats the purpose of a preview).
- Missing `laneIdMap` (tasks assigned to template lane IDs rather than real DB lane IDs).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Template instantiation is a domain operation that transforms a Template aggregate into a new Project aggregate with all child entities. `ProjectCreatedFromTemplate` is a domain event.
- TDD: Unit tests for date offset calculation, dry-run preview (no DB calls), lane ID mapping, and transactional rollback.
- BDD: "When a project is created from a template with dryRun: true, no data is written to the database, and the preview shows all lanes, tasks, and milestones that would be created."
- Deep Module: `TemplateInstantiationService.instantiate(templateId, dto, orgId)` hides transaction, lane ID mapping, date offset calculation, and event emission.

---

### Subtasks
- [ ] API-PROJ-017.0.25 (AGENT): Read all service interfaces (`ProjectService`, `TaskService`, `MilestoneService`, `BoardService`, `TemplateService`) and understand instantiation dependencies.
  *No action — pause until fully understood.*

- [ ] API-PROJ-017.0.5 (AGENT): Research `date-fns` `addDays`, Drizzle transactional multi-entity create, and `tempId` → real ID mapping pattern (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-PROJ-017.0.75 (AGENT): Confirm how `dryRun` preview mode should handle lane ID mapping (template IDs vs real IDs) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-PROJ-017.1 (AGENT): Add instantiation spec endpoint to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-PROJ-017.2 (AGENT): Implement `TemplateInstantiationService` (dry-run + transactional instantiation).
  **File(s):** `artifacts/api-server/src/services/projects/template-instantiation-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-PROJ-017.3 (AGENT): Write integration and unit tests (including dry-run and partial failure rollback).
  **File(s):** `artifacts/api-server/__tests__/api/projects/template-instantiation.test.ts`, `artifacts/api-server/src/services/projects/__tests__/template-instantiation-service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`

- [ ] API-PROJ-017.4 (AGENT): Add instantiation route to templates router.
  **File(s):** `artifacts/api-server/src/routes/projects/templates.ts`
  **Verification:** `pnpm test -- template-instantiation.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-PROJ-017.5 (HUMAN): Review transactional instantiation, dry-run, and date offset. Sign off.
  **Verification:** Approved; transaction confirmed; dry-run writes nothing; lane ID mapping correct; date offsets applied; `ProjectCreatedFromTemplate` event emitted; 0 test failures.

---

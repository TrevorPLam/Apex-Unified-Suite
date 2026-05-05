# tasks/projects/PROJECTS‑TEMPLATES.md – Projects: Templates & Workspace

This file covers project template management (CRUD with versioning, template instantiation), the composite project workspace endpoint, and the frontend components for the full project workspace, template editor, and instantiation wizard. These features build on the core Projects context and enable reusable project structures.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Templates

*(Schema definitions for `project_templates` and `template_versions` are defined in the original Phase 2 schema tasks and are referenced here by their API tasks. No new schema tasks are introduced in this file.)*

---

## API – Templates

### [ ] API‑PROJ‑016: Project Templates – CRUD & Versioning
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No project template endpoints exist. Users cannot create or manage reusable project structures.
**Size:** Large

**Description:** Implement project template CRUD with versioning and soft delete. Templates define a reusable project structure (default lanes, default tasks, milestone schema) without creating live projects.

**Depends on:** `projects/PROJECTS‑TEMPLATES.md → DB‑PROJ‑006` (project_templates + template_versions), `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑017`
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/db/src/repositories/projects/templates.ts`, `artifacts/api‑server/src/services/projects/template‑service.ts`, `artifacts/api‑server/src/routes/projects/templates.ts`

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/project‑templates`, `POST`, `GET /{templateId}`, `PATCH /{templateId}`, `DELETE /{templateId}` (soft)
- [ ] `POST /api/v1/project‑templates/{templateId}/versions` — create a new version snapshot
- [ ] `GET /api/v1/project‑templates/{templateId}/versions` — list all versions (paginated)
- [ ] `ProjectTemplateSchema`: `title`, `description`, `default_lanes: LaneDefinition[]`, `default_tasks: TaskDefinition[]`, `default_milestones: MilestoneDefinition[]`, `is_public`, `version` (integer, auto‑incremented)
- [ ] `TemplateRepository`: `findById`, `findByOrg` (with `is_public` filter), `create`, `update`, `softDelete`, `createVersion`, `listVersions`
- [ ] `TemplateService`: `listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate` (auto‑increments `version` and creates snapshot), `deleteTemplate`, `createVersion`, `listVersions`. All return `Result<T, DomainError>`.
- [ ] Integration tests and unit tests pass
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Template marketplace (cross‑org sharing — future)
- Template import/export
- Project instantiation from template (`API‑PROJ‑017`)

**Rules to Follow**
- `version` is an integer auto‑incremented by the service on each `updateTemplate` call — never set by the client
- `createVersion` stores a JSON snapshot of the full template definition at the current `version`
- Soft delete: `deleted_at` column; `findByOrg` always filters `WHERE deleted_at IS NULL`
- `is_public` allows any user in the same organization to instantiate the template

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/projects/templates.test.ts
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/template‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Templates are an independent aggregate — they define a project structure without being a project. Versioning enables safe template evolution.
- TDD: Unit tests for auto‑version increment, version snapshot creation, and soft delete filter.
- BDD: “When a template is updated, a version snapshot is automatically created and the version number is incremented.”
- Deep Module: `TemplateService.updateTemplate(id, dto, orgId)` hides version increment, snapshot creation, and soft delete check.

---

### Subtasks
- [ ] API‑PROJ‑016.0.25 (AGENT): Read DB‑PROJ‑006 schema and versioning strategy. *No action – pause.*
- [ ] API‑PROJ‑016.0.5 (AGENT): Research Drizzle `sql` template literal for atomic version increment and JSONB column storage. *Document findings briefly.*
- [ ] API‑PROJ‑016.1 (AGENT): Add template spec endpoints to `openapi.yaml`.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑PROJ‑016.2 (AGENT): Implement `TemplateRepository` with version snapshot creation.
  **File(s):** `lib/db/src/repositories/projects/templates.ts`
  **Verification:** `pnpm typecheck`
- [ ] API‑PROJ‑016.3 (AGENT): Implement `TemplateService` with auto‑version and soft delete.
  **File(s):** `artifacts/api‑server/src/services/projects/template‑service.ts`
  **Verification:** `pnpm typecheck`
- [ ] API‑PROJ‑016.4 (AGENT): Write integration and unit tests.
  **File(s):** `artifacts/api‑server/__tests__/api/projects/templates.test.ts`, `artifacts/api‑server/src/services/projects/__tests__/template‑service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`
- [ ] API‑PROJ‑016.5 (AGENT): Implement templates route and mount.
  **File(s):** `artifacts/api‑server/src/routes/projects/templates.ts`, `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm test -- templates.test.ts` 0 failures ; `pnpm typecheck`
- [ ] API‑PROJ‑016.6 (HUMAN): Review versioning strategy, soft delete filter, and `is_public` access control. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑017: Project Creation from Template
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No template instantiation endpoint. Templates exist but cannot be used to create projects.
**Size:** Large

**Description:** Implement template instantiation — creating a live project (with lanes, tasks, milestones) from a template definition — including a dry‑run preview mode and the `ProjectCreatedFromTemplate` domain event.

**Depends on:** `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑016`, `projects/PROJECTS‑CORE.md → API‑PROJ‑003`, `API‑PROJ‑007`, `API‑PROJ‑011`, `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑014`, `projects/PROJECTS‑CORE.md → DB‑PROJ‑001` through `DB‑PROJ‑007`
**Blocks:** [N/A] — terminal task in PROJECTS‑TEMPLATES
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/projects/template‑instantiation‑service.ts`, `artifacts/api‑server/src/routes/projects/templates.ts`

**Definition of Done**
- [ ] OpenAPI spec: `POST /api/v1/project‑templates/{templateId}/instantiate` with `CreateProjectFromTemplateRequestBody`: `{ name, ownerId, startDate, dryRun?: boolean }`
- [ ] `dryRun: true` — returns a preview `{ wouldCreate: { project, lanes, tasks, milestones } }` without writing to the database
- [ ] `dryRun: false` — creates the project and all child resources atomically in a single transaction
- [ ] Instantiation: creates project, lanes (from `default_lanes`), tasks (from `default_tasks`, mapped to created lane IDs), milestones (from `default_milestones`)
- [ ] Date offset: if template task has `due_date_offset_days`, calculate `dueDate = startDate + offset_days`
- [ ] `ProjectCreatedFromTemplate` event emitted
- [ ] Access control: user must have access to the template (own it or `is_public = true`) and have permission to create projects
- [ ] Integration tests and unit tests pass
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Template variable substitution (e.g., `{{client_name}}` in task titles — future)
- Async template instantiation for large templates
- Template versioning during instantiation (always uses latest version unless `version` param specified)

**Rules to Follow**
- Entire instantiation (project + lanes + tasks + milestones) in a single DB transaction
- `dryRun` mode: compute the full instantiation preview in application code without any DB writes
- Date offset calculation: `const dueDate = startDate ? addDays(new Date(startDate), task.dueDateOffsetDays ?? 0) : undefined`
- `templateId` and `templateVersion` recorded on the project for audit trail
- All methods return `Result<T, DomainError>` — no `throw`

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/projects/template‑instantiation.test.ts
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/template‑instantiation‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Template instantiation is a domain operation that transforms a Template aggregate into a new Project aggregate with all child entities.
- TDD: Unit tests for date offset calculation, dry‑run preview (no DB calls), lane ID mapping, and transactional rollback.
- BDD: “When a project is created from a template with dryRun: true, no data is written to the database, and the preview shows all lanes, tasks, and milestones that would be created.”
- Deep Module: `TemplateInstantiationService.instantiate(templateId, dto, orgId)` hides transaction, lane ID mapping, date offset calculation, and event emission.

---

### Subtasks
- [ ] API‑PROJ‑017.0.25 (AGENT): Read all service interfaces (`ProjectService`, `TaskService`, `MilestoneService`, `BoardService`, `TemplateService`). *No action – pause.*
- [ ] API‑PROJ‑017.0.5 (AGENT): Research `date‑fns` `addDays`, Drizzle transactional multi‑entity create, and `tempId` → real ID mapping pattern. *Document findings briefly.*
- [ ] API‑PROJ‑017.1 (AGENT): Add instantiation spec endpoint to `openapi.yaml`.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑PROJ‑017.2 (AGENT): Implement `TemplateInstantiationService` (dry‑run + transactional instantiation).
  **File(s):** `artifacts/api‑server/src/services/projects/template‑instantiation‑service.ts`
  **Verification:** `pnpm typecheck`
- [ ] API‑PROJ‑017.3 (AGENT): Write integration and unit tests (including dry‑run and partial failure rollback).
  **File(s):** `artifacts/api‑server/__tests__/api/projects/template‑instantiation.test.ts`, `artifacts/api‑server/src/services/projects/__tests__/template‑instantiation‑service.test.ts`
  **Verification:** `pnpm test` green ; `pnpm typecheck`
- [ ] API‑PROJ‑017.4 (AGENT): Add instantiation route to templates router.
  **File(s):** `artifacts/api‑server/src/routes/projects/templates.ts`
  **Verification:** `pnpm test -- template‑instantiation.test.ts` 0 failures ; `pnpm typecheck`
- [ ] API‑PROJ‑017.5 (HUMAN): Review transactional instantiation, dry‑run, and date offset. Sign off. **Verification:** Approved.

---

## API – Composite Workspace

### [ ] API‑PROJ‑015: Composite Project Workspace Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** All project sub‑resources (tasks, milestones, board) require separate API calls. No composite "workspace" endpoint for efficient single‑request page load.
**Size:** Medium

**Description:** Add composite read endpoints that return a project along with its tasks, milestones, and board in a single response — optimising for the frontend project workspace page load.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑004`, `API‑PROJ‑008`, `API‑PROJ‑012`, `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑014`
**Blocks:** [N/A] — read‑only aggregation layer
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/routes/projects/workspace.ts`, `artifacts/api‑server/src/services/projects/workspace‑service.ts`

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/projects/{projectId}/workspace` — returns `{ project, board, milestones, recentActivity }`
- [ ] `GET /api/v1/projects/{projectId}/workspace/summary` — lightweight summary with counts and progress
- [ ] `WorkspaceService.getWorkspace(projectId, orgId)` calls `ProjectService.getProject`, `BoardService.getBoard`, `MilestoneService.listMilestones` in parallel with `Promise.all`
- [ ] Response time target: < 200 ms (documented, not enforced)
- [ ] Integration tests: GET workspace (all sub‑views populated), GET summary, 404 on unknown project, 401
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Mutations via workspace endpoint
- Real‑time workspace updates (WebSocket — future task)

**Rules to Follow**
- `WorkspaceService` is a pure aggregation layer — no business logic, no state mutation
- All sub‑service calls in `Promise.all` — never sequential (minimise latency)
- `summary` endpoint calculates counts via SQL aggregate queries, not application‑level counting

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/projects/workspace.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `WorkspaceService` is an Application Service — it orchestrates multiple domain services without containing domain logic.
- TDD: Integration tests verify the composite response shape.
- BDD: “When the project workspace is loaded, the response includes the project, all board lanes with tasks, and upcoming milestones in a single request.”
- Deep Module: `WorkspaceService.getWorkspace(projectId, orgId)` hides parallel fetching, Result aggregation, and response shaping.

---

### Subtasks
- [ ] API‑PROJ‑015.0.25 (AGENT): Read all existing project sub‑service interfaces. *No action – pause.*
- [ ] API‑PROJ‑015.1 (AGENT): Add workspace schemas and endpoints to `openapi.yaml`.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑PROJ‑015.2 (AGENT): Implement `WorkspaceService` with `Promise.all` parallel aggregation.
  **File(s):** `artifacts/api‑server/src/services/projects/workspace‑service.ts`
  **Verification:** `pnpm typecheck`
- [ ] API‑PROJ‑015.3 (AGENT): Write integration tests (workspace shape, summary counts, 404, 401).
  **File(s):** `artifacts/api‑server/__tests__/api/projects/workspace.test.ts`
  **Verification:** `pnpm test -- workspace.test.ts` green ; `pnpm typecheck`
- [ ] API‑PROJ‑015.4 (AGENT): Implement workspace route and mount.
  **File(s):** `artifacts/api‑server/src/routes/projects/workspace.ts`, `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm test -- workspace.test.ts` 0 failures ; `pnpm typecheck`
- [ ] API‑PROJ‑015.5 (HUMAN): Review parallel aggregation, response shape, and summary counts. Sign off. **Verification:** Approved.

---

## Frontend – Project Workspace & Template UI

### [ ] FRONT‑PROJ‑006: Full Project Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No `/projects/:id` route exists. There is no project workspace page.
**Size:** Medium

**Description:** Create a `ProjectWorkspace` page at `/projects/:id` with four sub‑views accessed via tab bar: Tasks (list + board), Timeline (Gantt/calendar of milestones and deadlines), Time & Budget (time entry list, budget vs actual chart), and Details (project metadata, members, template info). Tab state preserved in URL query param.

**Depends on:** `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑015`, `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`, `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑005`, `infrastructure/AUTH.md → FRONT‑AUTH‑002`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑008`
**Related Files:** `artifacts/apex‑os/src/pages/ProjectWorkspace.tsx`

**Definition of Done**
- [ ] Route `/projects/:id` registered in `App.tsx` wrapped in `ProtectedRoute`
- [ ] Tab bar: Tasks | Timeline | Time & Budget | Details; active tab in URL `?tab=tasks`
- [ ] Tasks tab: list view (table) and board view toggle; filters by status, assignee
- [ ] Timeline tab: calendar/Gantt showing milestones and deadlines
- [ ] Time & Budget tab: placeholder wired in FRONT‑PROJ‑008
- [ ] Details tab: project name, status, client, template used, members list (read‑only in Phase 5)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- ProjectWorkspace.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ProjectWorkspace` is the primary aggregation view for the Project aggregate root.
- TDD: MSW returns project detail; assert workspace renders; simulate tab click → assert URL query param changes.
- BDD: “As a project manager, I can open a project workspace and switch between tasks, timeline, budget, and details views.”

---

### Subtasks
- [ ] FRONT‑PROJ‑006.1 (AGENT): Create `ProjectWorkspace` page with tab bar and URL‑based tab state.
  **File(s):** `artifacts/apex‑os/src/pages/ProjectWorkspace.tsx`, `App.tsx`
  **Verification:** `pnpm typecheck` passes; route navigable.
- [ ] FRONT‑PROJ‑006.2 (AGENT): Implement Tasks, Details, and Timeline tab content.
  **File(s):** `artifacts/apex‑os/src/pages/ProjectWorkspace.tsx`
  **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑PROJ‑006.3 (AGENT): Write tab navigation and data loading tests.
  **File(s):** `artifacts/apex‑os/src/pages/__tests__/ProjectWorkspace.test.tsx`
  **Verification:** GREEN.
- [ ] FRONT‑PROJ‑006.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PROJ‑007: PM Templates UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No template management UI exists. `API‑PROJ‑016` and `API‑PROJ‑017` are not wired.
**Size:** Medium

**Description:** Build template list, template detail/blueprint editor, version history browser, and "Create Project from Template" instantiation wizard with preview of what will be created.

**Depends on:** `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑016`, `API‑PROJ‑017`, `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/projects/TemplateEditor.tsx`

**Definition of Done**
- [ ] Template list: name, version, active status, created date; "New Template" button
- [ ] Template detail: visual task blueprint editor (task hierarchy, default assignees, milestone placement); save/publish actions
- [ ] Version history: list of past versions with date and author; "Restore" action
- [ ] "Create Project from Template" instantiation wizard: Step 1 – override name/due date; Step 2 – preview tasks/milestones; Step 3 – confirm → navigate to new project
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Template sharing across organisations (Phase 8+)
- AI‑generated template suggestions (Phase 10)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- TemplateEditor.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Templates are a planning concept in the Projects bounded context; instantiation is a factory operation producing a new Project aggregate.
- TDD: MSW returns template list; assert list renders; simulate instantiation wizard → assert `POST /api/v1/projects/from‑template` called.
- BDD: “As a project manager, I can create a new project from a reusable template and preview the tasks it will generate.”
- Deep Module: `InstantiationWizard` hides the multi‑step preview‑and‑confirm flow.

---

### Subtasks
- [ ] FRONT‑PROJ‑007.1 (AGENT): Build template list and detail/blueprint editor.
  **File(s):** `artifacts/apex‑os/src/components/projects/TemplateEditor.tsx`
  **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑PROJ‑007.2 (AGENT): Build version history browser.
  **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑PROJ‑007.3 (AGENT): Implement instantiation wizard with preview.
  **Verification:** `pnpm --filter @workspace/apex‑os test -- TemplateEditor.test.tsx` → GREEN.
- [ ] FRONT‑PROJ‑007.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
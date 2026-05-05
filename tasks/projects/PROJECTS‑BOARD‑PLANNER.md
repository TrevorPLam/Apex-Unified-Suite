# tasks/projects/PROJECTS‑BOARD‑PLANNER.md – Projects: Board, Planner & Time Management

This file covers Kanban board lanes and task reordering, the “My Week” personal planning view, time entry and budget tracking, advanced filters and bulk operations, and the recurring work scheduler tab. These features extend the core Projects context with planning and visual management capabilities.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Backlog Additions – 2026‑05‑05

| Task ID | Description | Depends On |
|---------|-------------|------------|
| API‑PROJ‑021 | Recurring work plans API – CRUD and manual trigger generation | `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑004` |
| FRONT‑PROJ‑010 | Gantt timeline view with dependency arrows and drag adjustment | `projects/PROJECTS‑CORE.md → API‑PROJ‑022`, `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑014` |

### Subtasks
- [ ] API‑PROJ‑021.1 (AGENT): Define recurring plan endpoints and manual generation action.
- [ ] FRONT‑PROJ‑010.1 (AGENT): Design Gantt interactions, dependency arrows, and critical-path highlighting.

---

## Database – Board Lanes, Recurring Plans, Time & Budget

### [ ] DB‑PROJ‑004: Define Recurring Work Plans Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No recurring work plans table. Scheduled task generation is blocked.
**Size:** Small

**Description:** Define the `recurring_work_plans` table – stores configuration for automatically generating recurring tasks from project templates on a schedule defined by iCal RRULE, with activation control and next‑run tracking.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`, `DB‑PROJ‑002`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑021`, `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑PROJ‑003`
**Related Files:** `lib/db/src/schema/projects/recurring_plans.ts`, `lib/db/src/__tests__/recurring‑plans.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `project_id` (FK → projects), `template_id` (uuid nullable), `recurrence_rule` (text NOT NULL – iCal RRULE), `is_active` (boolean NOT NULL default `true`), `last_generated_at` (timestamp nullable), `next_scheduled_at` (timestamp nullable), `generated_task_count` (integer NOT NULL default `0`), `created_at`, `updated_at`
- [ ] Indexes: `(project_id)`, `(organization_id, is_active)`, `(next_scheduled_at)`
- [ ] Zod schemas and types exported; `recurrence_rule` validated as non‑empty string
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- recurring‑plans.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PROJ‑004.0.25 (AGENT): Read DB‑PROJ‑001 and DB‑PROJ‑002. No action – pause.
- [ ] DB‑PROJ‑004.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/recurring‑plans.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑004.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PROJ‑005: Define Board Lanes Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No lanes table. Kanban board functionality is blocked.
**Size:** Small

**Description:** Define the `lanes` table – columns within a project board. Each project has exactly one default lane; tasks reference lanes via `tasks.lane_id`.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑002` (lane_id FK addition), `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑014`
**Related Files:** `lib/db/src/schema/projects/lanes.ts`, `lib/db/src/__tests__/lanes.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `project_id` (FK → projects), `name` (text NOT NULL), `color` (text nullable), `position` (integer NOT NULL), `is_default` (boolean NOT NULL default `false`), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(project_id, position)`, unique constraint on `(project_id, is_default)` where `is_default = true`
- [ ] Zod schemas; position validated as non‑negative integer
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- lanes.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PROJ‑005.0.25 (AGENT): Read DB‑PROJ‑001. No action – pause.
- [ ] DB‑PROJ‑005.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/lanes.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑005.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PROJ‑006: Define Time Entries Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No time entries table. Time tracking against tasks is blocked.
**Size:** Small

**Description:** Define the `time_entries` table – logs hours worked on a task by a user, with billable flag and approval status.

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑002`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑018`
**Related Files:** `lib/db/src/schema/projects/time_entries.ts`, `lib/db/src/__tests__/time‑entries.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `task_id` (FK → tasks), `user_id` (FK → users), `description` (text nullable), `hours` (numeric NOT NULL), `billable` (boolean NOT NULL default `true`), `date` (date NOT NULL), `status` (pgEnum: `pending|approved|rejected`), `approved_by` (uuid nullable FK → users), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(task_id, date)`, `(user_id, date)`, `(organization_id, status)`
- [ ] Zod schemas; `hours` validated as positive number
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- time‑entries.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PROJ‑006.0.25 (AGENT): Read DB‑PROJ‑002 and DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑PROJ‑006.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/time‑entries.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑006.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PROJ‑007: Define Budget Tracking Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No budget actuals table. Project budget vs. actual tracking is blocked.
**Size:** Small

**Description:** Define the `budget_actuals` table – tracks actual spend against a project budget, broken down by category (labor, materials, etc.).

**Depends on:** `projects/PROJECTS‑CORE.md → DB‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑019`
**Related Files:** `lib/db/src/schema/projects/budget_actuals.ts`, `lib/db/src/__tests__/budget‑actuals.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `project_id` (FK → projects), `category` (text NOT NULL – e.g., `labor`, `materials`, `software`, `other`), `description` (text nullable), `amount_cents` (integer NOT NULL), `date` (date NOT NULL), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(project_id, category)`, `(project_id, date)`
- [ ] Zod schemas; `amount_cents` validated as integer; `category` defaults to `other`
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- budget‑actuals.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PROJ‑007.0.25 (AGENT): Read DB‑PROJ‑001. No action – pause.
- [ ] DB‑PROJ‑007.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/budget‑actuals.test.ts` **Verification:** RED.
- [ ] DB‑PROJ‑007.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PROJ‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – My Week, Board & Queue, Time & Budget

### [ ] API‑PROJ‑013: My Week Planning API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No “My Week” planning endpoints exist. Users have no personal task bucketing API.
**Size:** Large

**Description:** Implement a personal weekly planning API allowing users to assign tasks to focus buckets (`Focus`, `This Week`, `Later`), with automatic carry‑over of incomplete tasks to the next week and a `MyWeekUpdated` event.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑008`, `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑004`, `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — standalone depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/db/src/repositories/projects/my‑week.ts`, `artifacts/api‑server/src/services/projects/my‑week‑service.ts`, `artifacts/api‑server/src/routes/projects/my‑week.ts`

**Definition of Done**
- [ ] `GET /api/v1/projects/my‑week` — returns all tasks bucketed for current user in current ISO week
- [ ] `PUT /api/v1/projects/my‑week/{taskId}` — assign a task to a bucket for the current week (upsert semantics)
- [ ] `DELETE /api/v1/projects/my‑week/{taskId}` — remove a task from My Week (current week only)
- [ ] `MyWeekBucketEnum`: `focus`, `this_week`, `later`
- [ ] Lazy carry‑over: on first `GET` of a new week, incomplete `focus` and `this_week` items from previous week are automatically moved to the new week
- [ ] `MyWeekUpdated` domain event emitted
- [ ] Integration tests pass
- [ ] Unit tests for `MyWeekService`: bucket assignment, carry‑over logic
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Team‑level “sprint” planning (separate feature)
- Calendar integration

**Rules to Follow**
- Use ISO week numbering via `date‑fns` `getISOWeek` and `getISOWeekYear`
- `PUT` is upsert on `(user_id, task_id, week_number, year)`
- Task must belong to the same `organization_id` as the requesting user

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/projects/my‑week.test.ts
pnpm test -- artifacts/api‑server/src/services/projects/__tests__/my‑week‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: My Week is a personal planning projection over the Tasks aggregate. It uses `week_number/year` as the planning period identifier.
- TDD: Unit tests for carry‑over logic, bucket upsert, and event emission.
- BDD: “When a user views My Week at the start of a new week, incomplete Focus and This Week tasks from the previous week automatically appear in the current week’s Focus bucket.”
- Deep Module: `MyWeekService.getMyWeek(userId, orgId)` hides lazy carry‑over, ISO week calculation, and event emission.

---

### Subtasks
- [ ] API‑PROJ‑013.0.25 (AGENT): Read DB‑PROJ‑004 schema and `date‑fns` ISO week API. *No action – pause.*
- [ ] API‑PROJ‑013.1 (AGENT): Add My Week spec endpoints and `MyWeekBucketEnum` to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑PROJ‑013.2 (AGENT): Implement `MyWeekRepository` with upsert. **File(s):** `lib/db/src/repositories/projects/my‑week.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑013.3 (AGENT): Implement `MyWeekService` with lazy carry‑over and event. **File(s):** `artifacts/api‑server/src/services/projects/my‑week‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑013.4 (AGENT): Write integration and unit tests. **Verification:** All green.
- [ ] API‑PROJ‑013.5 (AGENT): Implement route and mount. **File(s):** `artifacts/api‑server/src/routes/projects/my‑week.ts`, `routes/index.ts` **Verification:** `pnpm test -- my‑week.test.ts` 0 failures.
- [ ] API‑PROJ‑013.6 (HUMAN): Review carry‑over logic and ISO week calculation. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑014: Board & Queue API (Lane Management + Bulk Reorder)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No board lane management or bulk task reorder endpoints.
**Size:** Large

**Description:** Implement board lane CRUD (create, list, rename, delete, reorder lanes), bulk task reorder within a lane (efficient positional update), and queue ownership endpoints.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑008`, `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑005`, `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** [N/A] — standalone depth feature
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/db/src/repositories/projects/lanes.ts`, `artifacts/api‑server/src/services/projects/board‑service.ts`, `artifacts/api‑server/src/routes/projects/board.ts`

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/board` — returns all lanes with their tasks (ordered by `position`)
- [ ] `POST /{projectId}/board/lanes`, `PATCH /lanes/{laneId}`, `DELETE /lanes/{laneId}` (soft delete; tasks move to default lane)
- [ ] `POST /{projectId}/board/lanes/reorder` — reorder all lanes
- [ ] `POST /{projectId}/board/lanes/{laneId}/tasks/reorder` — bulk reorder tasks within a lane
- [ ] Reorder uses gap strategy: positions 1000, 2000, 3000, …
- [ ] Queue ownership: `PATCH /lanes/{laneId}/owner` — assign a user as queue owner
- [ ] Integration and unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm test -- artifacts/api‑server/__tests__/api/projects/board.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Board lanes are a view‑optimisation of the Task aggregate.
- TDD: Unit tests for reorder algorithm, default lane guard, and task migration on lane delete.
- BDD: “When a lane is deleted, all its tasks are automatically moved to the project’s default lane.”
- Deep Module: `BoardService.reorderTasksInLane(laneId, orderedTaskIds, projectId, orgId)` hides gap calculation and transactional bulk update.

---

### Subtasks
- [ ] API‑PROJ‑014.0.25 (AGENT): Read DB‑PROJ‑005 lanes schema and existing gap‑position strategy. *No action – pause.*
- [ ] API‑PROJ‑014.1 (AGENT): Add board/lane spec endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑PROJ‑014.2 (AGENT): Implement `LaneRepository` with `findDefault` and `moveLane`. **File(s):** `lib/db/src/repositories/projects/lanes.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑014.3 (AGENT): Implement `BoardService` with reorder, default lane guard, and queue ownership. **File(s):** `artifacts/api‑server/src/services/projects/board‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PROJ‑014.4 (AGENT): Write integration and unit tests. **Verification:** All green.
- [ ] API‑PROJ‑014.5 (AGENT): Implement board route and mount. **File(s):** `artifacts/api‑server/src/routes/projects/board.ts`, `routes/index.ts` **Verification:** `pnpm test -- board.test.ts` 0 failures.
- [ ] API‑PROJ‑014.6 (HUMAN): Review default lane guard and bulk reorder transaction. Sign off. **Verification:** Approved.

---

### [ ] API‑PROJ‑018: Time Entries API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No time entries API exists; time tracking against tasks is not possible.
**Size:** Medium

**Description:** Implement CRUD for time entries linked to project tasks with billable flag, approval workflow, and date‑based querying.

**Depends on:** `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑006`, `projects/PROJECTS‑CORE.md → API‑PROJ‑008`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑008`
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/db/src/repositories/projects/time‑entries.ts`, `artifacts/api‑server/src/services/projects/time‑entry‑service.ts`, `artifacts/api‑server/src/routes/projects/time‑entries.ts`

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/time‑entries`, `POST`, `PATCH /{entryId}`, `DELETE /{entryId}`
- [ ] `POST /{entryId}/approve` and `POST /{entryId}/reject` for manager approval
- [ ] Hours must be positive (> 0) and ≤ 24 per entry
- [ ] Integration tests: log hours, approve, reject, filter by task and date range
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/time‑entries.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑018.0.25 (AGENT): Read DB‑PROJ‑006 schema. *No action – pause.*
- [ ] API‑PROJ‑018.1 (AGENT): Add time entry endpoints to spec; implement repository, service, routes; tests. **Verification:** All green; `pnpm typecheck`.

---

### [ ] API‑PROJ‑019: Budget vs Actual API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No budget tracking API exists.
**Size:** Medium

**Description:** Implement CRUD for budget actuals linked to projects, with category breakdowns and variance reporting.

**Depends on:** `projects/PROJECTS‑BOARD‑PLANNER.md → DB‑PROJ‑007`
**Blocks:** `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑008`
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/db/src/repositories/projects/budget‑actuals.ts`, `artifacts/api‑server/src/services/projects/budget‑service.ts`, `artifacts/api‑server/src/routes/projects/budget.ts`

**Definition of Done**
- [ ] `GET /api/v1/projects/{projectId}/budget‑actuals`, `POST`, `DELETE /{entryId}`
- [ ] `GET /{projectId}/budget‑variance` — returns budget vs actual by category and overall
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/projects/budget.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑PROJ‑019.0.25 (AGENT): Read DB‑PROJ‑007. *No action – pause.*
- [ ] API‑PROJ‑019.1 (AGENT): Add budget spec endpoints; implement repository, service, routes; tests. **Verification:** All green; `pnpm typecheck`.

---

## Frontend – My Week, Board, Time/Budget, Filters

### [ ] FRONT‑PROJ‑004: My Week UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No My Week view exists. `API‑PROJ‑013` planning API is not wired.
**Size:** Medium

**Description:** Build a personal work planning view with three buckets (Focus / This Week / Later), drag‑and‑drop reordering, mini‑calendar week navigation, carry‑over button, and inline personal notes.

**Depends on:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑013`, `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/projects/MyWeek.tsx`, `artifacts/apex‑os/src/hooks/projects/useMyWeekPlan.ts`

**Definition of Done**
- [ ] Three‑column layout: Focus, This Week, Later — populated from `useMyWeekPlan`
- [ ] Drag‑and‑drop between buckets with optimistic update
- [ ] Mini‑calendar shows current week; Previous/Next buttons navigate weeks
- [ ] Carry‑over button moves incomplete items from previous week
- [ ] Inline personal note creation per bucket
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- MyWeek.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: My Week plan is a personal planning aggregate per user per week.
- TDD: MSW returns items in two buckets; assert correct columns; simulate drag → assert mutation called.
- BDD: “As a firm user, I can plan my work for the current week by organizing tasks across Focus, This Week, and Later buckets.”

---

### Subtasks
- [ ] FRONT‑PROJ‑004.1 (AGENT): Implement `MyWeek` component with three‑bucket layout and week navigation. **File(s):** `artifacts/apex‑os/src/components/projects/MyWeek.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑004.2 (AGENT): Wire `useMyWeekPlan` hook for fetch, move, reorder, and carry‑over. **File(s):** `artifacts/apex‑os/src/hooks/projects/useMyWeekPlan.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑004.3 (AGENT): Add inline personal note creation per bucket; write component tests. **File(s):** `artifacts/apex‑os/src/components/projects/__tests__/MyWeek.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PROJ‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PROJ‑005: Board Tab (Full Kanban)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Kanban board view exists in Projects. `API‑PROJ‑014` board & queue API is not wired.
**Size:** Medium

**Description:** Build a full Kanban board inside the Board tab: lanes as columns with task cards, drag‑and‑drop between and within lanes, queue lane “Claim” action for self‑assignment, list/timeline toggle, and lane CRUD.

**Depends on:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑014`, `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`
**Blocks:** `projects/PROJECTS‑CORE.md → FRONT‑INT‑PROJ`
**Related Files:** `artifacts/apex‑os/src/components/projects/BoardView.tsx`, `artifacts/apex‑os/src/hooks/projects/useBoardLanes.ts`

**Definition of Done**
- [ ] Lanes rendered as columns with task cards; drag‑and‑drop between and within lanes with optimistic update
- [ ] “Add Lane” button; lane context menu: rename, delete with reassignment
- [ ] List/Timeline toggle button
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- BoardView.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Board lanes are a view‑layer concept within the Project aggregate.
- TDD: MSW returns 3 lanes with tasks; assert cards render; simulate drag → assert move mutation called.
- BDD: “As a project manager, I can manage tasks on a Kanban board with drag‑and‑drop lane transitions.”

---

### Subtasks
- [ ] FRONT‑PROJ‑005.1 (AGENT): Build `BoardView` with dnd‑kit; render lanes and task cards. **File(s):** `artifacts/apex‑os/src/components/projects/BoardView.tsx`, `useBoardLanes.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑005.2 (AGENT): Wire drag‑and‑drop to `useMoveTask` with optimistic update and rollback. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑005.3 (AGENT): Implement lane CRUD (add, rename, delete with reassignment). **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑005.4 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/projects/__tests__/BoardView.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PROJ‑005.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PROJ‑008: Time Entry & Budget UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** The Time & Budget tab in `ProjectWorkspace` is a placeholder.
**Size:** Small

**Description:** Implement the Time & Budget tab content: time entry list, log‑hours modal form, manager approval button, and budget vs actual Recharts bar chart with variance indicators.

**Depends on:** `projects/PROJECTS‑BOARD‑PLANNER.md → API‑PROJ‑018`, `API‑PROJ‑019`, `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑006`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/projects/TimeBudgetView.tsx`

**Definition of Done**
- [ ] Time entry list: date, hours, task name, description, billable flag, approved badge
- [ ] “Log Hours” modal: project/task selector, date picker, hours input, billable checkbox
- [ ] Manager “Approve” button per entry
- [ ] Budget vs actual `BarChart` with two bars per metric and variance badge
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- TimeBudgetView.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Time entries are a cross‑cutting concern between Projects and Finance.
- TDD: MSW returns time entries; assert list renders; simulate log hours → assert mutation called.
- BDD: “As a project manager, I can track time against tasks and compare actual spend to the project budget.”

---

### Subtasks
- [ ] FRONT‑PROJ‑008.1 (AGENT): Implement time entry list and log‑hours modal. **File(s):** `artifacts/apex‑os/src/components/projects/TimeBudgetView.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑008.2 (AGENT): Build budget vs actual bar chart and variance indicators. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑008.3 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/projects/__tests__/TimeBudgetView.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PROJ‑008.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PROJ‑009: Advanced Filters & Bulk Operations
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No saved views, advanced filter builder, or bulk selection exists in Projects.
**Size:** Medium

**Description:** Add saved views, a multi‑condition AND/OR filter builder on task/project fields, and bulk operations (select multiple tasks → bulk change status, assignee, or move to lane) with a floating action bar.

**Depends on:** `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑001`, `projects/PROJECTS‑BOARD‑PLANNER.md → FRONT‑PROJ‑005`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/projects/SavedViewSelector.tsx`, `FilterBuilder.tsx`, `BulkActionBar.tsx`

**Definition of Done**
- [ ] `SavedViewSelector`: “Save View” saves current filter state; dropdown to apply/delete saved views
- [ ] `FilterBuilder`: multi‑condition AND/OR filter on `status`, `assignee`, `due_date`, `priority`, `label`
- [ ] `BulkActionBar`: appears when ≥1 task selected; actions: change status, reassign, move to lane
- [ ] Bulk selection checkboxes on task cards and rows; “Select All” in current filter
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- filters‑bulk.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Saved views and filter state are user‑preference concepts.
- TDD: Select 3 tasks → assert bulk action bar; simulate “Change Status” → assert single `PATCH /tasks/bulk` called.
- BDD: “As a project manager, I can apply advanced filters to the task list and save them as named views.”

---

### Subtasks
- [ ] FRONT‑PROJ‑009.1 (AGENT): Implement `SavedViewSelector` with save/apply/delete. **File(s):** `artifacts/apex‑os/src/components/projects/SavedViewSelector.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑009.2 (AGENT): Build `FilterBuilder` with AND/OR multi‑condition logic. **File(s):** `artifacts/apex‑os/src/components/projects/FilterBuilder.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PROJ‑009.3 (AGENT): Add bulk selection checkboxes and `BulkActionBar`. **File(s):** `artifacts/apex‑os/src/components/projects/BulkActionBar.tsx`, `Projects.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- filters‑bulk.test.tsx` → GREEN.
- [ ] FRONT‑PROJ‑009.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
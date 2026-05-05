# TODO-P5-PROJECTS.md – Phase 5: Projects Frontend Integration

Replaces all mock data in the Projects page with real API-backed React Query hooks and wires all project management interactions: task CRUD, Kanban board, scheduler, My Week planner, Gantt timeline, PM templates, time entry, budget visualisation, advanced filters, and bulk operations.

---

## [ ] FRONT‑PROJ‑001: Projects & Tasks – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Projects.tsx` imports projects and tasks from `src/data/mockData.ts`. No `useProjectList` or `useTaskList` hooks exist.
**Size:** Small

**Description:** Create `useProjectList` and `useTaskList` hooks backed by `API-PROJ-004` / `API-PROJ-008`. Replace all mock project and task data in the Projects list view and task table. Display real project status, budget, and task counts.

**Depends on:** API‑PROJ‑004 (projects API green), API‑PROJ‑008 (tasks API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑PROJ
**Related Files:** `artifacts/apex-os/src/pages/Projects.tsx`, `artifacts/apex-os/src/hooks/projects/useProjectList.ts`, `artifacts/apex-os/src/hooks/projects/useTaskList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/projects`, `GET /api/v1/tasks`
- Exports: `useProjectList(filters?)`, `useTaskList(projectId?, filters?)`

**Definition of Done**
- [ ] `useProjectList` and `useTaskList` hooks created with filter params
- [ ] Project list view displays real project status, budget, task count, and `assigned_to`
- [ ] Task table displays status, assignee, due date, lane/position
- [ ] All `mockData` imports removed from `Projects.tsx`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass: projects and tasks render from MSW mock data

**Out of Scope**
- Board/Kanban view (FRONT‑PROJ‑005)
- Timeline/Gantt view (FRONT‑PROJ‑006)
- Template instantiation (FRONT‑PROJ‑007)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/projects/useProjectList.ts`, `artifacts/apex-os/src/hooks/projects/useTaskList.ts`, `artifacts/apex-os/src/pages/Projects.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/projects-list.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Projects.tsx` mock imports
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Task list must be scoped to `projectId` when viewing a specific project — never fetch all tasks globally without a project filter
- Budget amounts formatted with `Intl.NumberFormat` using project's currency setting
- Use `keepPreviousData` on pagination so the list does not flash empty on page change

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- projects-list.test.tsx
```

**Advanced Code Patterns**
- `useTaskList` accepts `projectId?: string` — when undefined, returns tasks across all projects (used for My Week); when provided, scopes to that project
- Use `select` option in `useQuery` to sort tasks by `lane` and `position` without a second array pass in the component

**Anti-Patterns**
- Fetching all tasks for all projects in a single call — does not scale; always scope by project
- Hardcoded task status labels — always render from API enum values

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Project` is the aggregate root; `Task` is an entity within the Projects bounded context. Tasks have no meaning outside a project.
- TDD: MSW returns 3 projects; assert list renders them; MSW returns tasks for project 1; assert task table shows correct rows.
- BDD: "As a firm user, I can see all my projects and the tasks within each project."
- Deep Module: `useProjectList` hides pagination and filter serialisation; callers just call `useProjectList({ status: 'active' })`.

---

### Subtasks

- [ ] FRONT‑PROJ‑001.0.25 (AGENT): Read `Projects.tsx` in full and list every `mockData` reference and the data shape consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑PROJ‑001.1 (AGENT): Create `useProjectList` and `useTaskList` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useProjectList.ts`, `artifacts/apex-os/src/hooks/projects/useTaskList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑001.2 (AGENT): Replace mock data in project list and task table; wire status, budget, and task count display.
  **File(s):** `artifacts/apex-os/src/pages/Projects.tsx`
  **Verification:** No `mockData` references remain; `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑001.3 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/projects-list.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- projects-list.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑002: Milestones & Calendar – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Milestone list and calendar in Projects use mock data. No `useMilestoneList` hook exists.
**Size:** Small

**Description:** Create `useMilestoneList` hook backed by `API-PROJ-012`. Replace mock milestone data in list and calendar views; populate calendar with real milestone dates and project deadlines.

**Depends on:** API‑PROJ‑012 (milestones API green), FRONT‑PROJ‑001
**Blocks:** FRONT‑INT‑PROJ
**Related Files:** `artifacts/apex-os/src/pages/Projects.tsx`, `artifacts/apex-os/src/hooks/projects/useMilestoneList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/milestones`
- Exports: `useMilestoneList(projectId?, dateRange?)`

**Definition of Done**
- [ ] `useMilestoneList` hook created
- [ ] Calendar view populated with real milestone dates; milestone cards show name, due date, status
- [ ] All mock milestone references removed from Projects
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Milestone creation form (FRONT‑INT‑PROJ)
- Gantt timeline view (FRONT‑PROJ‑006)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/projects/useMilestoneList.ts`, `artifacts/apex-os/src/pages/Projects.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/projects-milestones.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook; revert mock imports
- Halt condition: if calendar renders blank after hook integration, revert and verify API date format

**Rules to Follow**
- Milestone dates from the API are ISO 8601 strings — parse with `date-fns parseISO` before passing to calendar component
- Overdue milestones (due date < today and status !== 'complete') must show a red indicator

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- projects-milestones.test.tsx
```

**Advanced Code Patterns**
- Accept `dateRange` param in `useMilestoneList` to support calendar month navigation without re-fetching the entire year

**Anti-Patterns**
- Passing raw ISO strings to the calendar component — always parse dates before use

**DDD / TDD / BDD / Deep Module notes**
- DDD: Milestones are entities within the Project aggregate; they mark significant checkpoints in project execution.
- TDD: MSW returns milestones with past and future dates; assert calendar renders them in correct date cells; assert overdue indicator shown.
- BDD: "As a firm user, I can see all project milestones on a calendar view."
- Deep Module: `useMilestoneList` hides date range filtering and status computation.

---

### Subtasks

- [ ] FRONT‑PROJ‑002.1 (AGENT): Create `useMilestoneList` hook.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useMilestoneList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑002.2 (AGENT): Replace mock milestones in list and calendar; add overdue indicator.
  **File(s):** `artifacts/apex-os/src/pages/Projects.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- projects-milestones.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑002.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑003: Scheduler Tab (Recurring Work Planner)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** The Scheduler tab in Projects is either empty or shows mock data. No recurring work plan hooks exist.
**Size:** Medium

**Description:** Build the PM-owned recurring work planner inside the Scheduler tab: list active/inactive recurring work plans, create/edit plans (select template, set RRULE frequency), trigger manual "Generate Now", and view generation log. Handle `RecurringWorkDuplicate` error gracefully.

**Depends on:** API‑PROJ‑021 (recurring work plan API), API‑PROJ‑022 (recurring work generation endpoint), FRONT‑PROJ‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/projects/SchedulerTab.tsx`, `artifacts/apex-os/src/hooks/projects/useRecurringPlanList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `toast` from `sonner`; `rrule` library for RRULE parsing/display
- Exports: `SchedulerTab` component, `useRecurringPlanList()`, `useRecurringPlanMutations()`

**Definition of Done**
- [ ] `SchedulerTab` renders list of recurring plans with status badge, next-run date, and template name
- [ ] Create/edit form: template selector, frequency picker (daily/weekly/monthly/custom RRULE), enable/disable toggle
- [ ] "Generate Now" button fires `POST /api/v1/recurring-plans/:id/generate`; shows spinner; shows success/duplicate toast
- [ ] Generation log: list of past generations with date, tasks created count, status
- [ ] Empty state shown when no plans exist
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Appointment scheduling (separate domain — see TODO-P5-APPOINTMENTS.md)
- Recurring billing plans (Finance domain)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/SchedulerTab.tsx`, `artifacts/apex-os/src/hooks/projects/useRecurringPlanList.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/SchedulerTab.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `SchedulerTab`; Scheduler tab shows empty placeholder
- Halt condition: if "Generate Now" causes duplicate tasks, stop and add `RecurringWorkDuplicate` error handling before proceeding

**Rules to Follow**
- RRULE frequency display must show human-readable text ("Every Monday") not raw RRULE strings
- Manual generation must be disabled if the plan is inactive — button greyed out with tooltip

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- SchedulerTab.test.tsx
```

**Advanced Code Patterns**
- Parse RRULE strings with the `rrule` npm package to display human-readable next-run dates
- Optimistically mark generation log entry as "Pending" immediately after "Generate Now" click

**Anti-Patterns**
- Confusing this with appointment scheduling — the Scheduler tab is a PM recurring work tool only
- Allowing "Generate Now" on inactive plans — always validate plan status before enabling the button

**DDD / TDD / BDD / Deep Module notes**
- DDD: Recurring work plans are a planning concept within the Projects bounded context; generated tasks become Project Task entities.
- TDD: MSW returns 2 recurring plans; assert list renders; simulate "Generate Now" → MSW returns 200 → assert success toast and log entry.
- BDD: "As a project manager, I can schedule recurring work plans that automatically generate tasks on a set frequency."
- Deep Module: `SchedulerTab` hides all RRULE parsing, generation polling, and log management.

---

### Subtasks

- [ ] FRONT‑PROJ‑003.1 (AGENT): Create `useRecurringPlanList` and `useRecurringPlanMutations` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useRecurringPlanList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑003.2 (AGENT): Build recurring plan list, create/edit form, and generation log UI.
  **File(s):** `artifacts/apex-os/src/components/projects/SchedulerTab.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑003.3 (AGENT): Wire "Generate Now" button; handle `RecurringWorkDuplicate` error.
  **File(s):** `artifacts/apex-os/src/components/projects/SchedulerTab.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- SchedulerTab.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑004: My Week UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No My Week view exists. `API-PROJ-013` planning API is not wired.
**Size:** Medium

**Description:** Build a personal work planning view with three buckets (Focus / This Week / Later), drag-and-drop reordering, mini-calendar week navigation, carry-over button for incomplete items, and inline personal notes (not linked to any task).

**Depends on:** API‑PROJ‑013 (My Week planning API), FRONT‑PROJ‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/projects/MyWeek.tsx`, `artifacts/apex-os/src/hooks/projects/useMyWeekPlan.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; dnd-kit for drag-and-drop; `date-fns` for week navigation
- Exports: `MyWeek` component, `useMyWeekPlan(weekISO)`

**Definition of Done**
- [ ] Three-column layout: Focus, This Week, Later — populated from `useMyWeekPlan`
- [ ] Drag-and-drop moves items between buckets and reorders within a bucket; calls `useMoveWeekItem` mutation with optimistic update
- [ ] Mini-calendar shows current week; Previous/Next buttons navigate weeks
- [ ] Carry-over button: `useCarryOverWeekItems` mutation moves all incomplete items from previous week to current
- [ ] Inline personal note creation: text input per bucket; notes not linked to tasks
- [ ] Loading skeleton per bucket; empty state per bucket
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Shared team week view (Phase 6+)
- Time tracking from My Week (FRONT‑PROJ‑008)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/MyWeek.tsx`, `artifacts/apex-os/src/hooks/projects/useMyWeekPlan.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/MyWeek.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `MyWeek`; My Week tab shows placeholder
- Halt condition: if carry-over creates duplicate items, revert and fix idempotency on the mutation

**Rules to Follow**
- Week key is the ISO week string (e.g., `2025-W22`) — use `date-fns` `getISOWeek` / `getISOWeekYear`
- Optimistic drag-and-drop: update local order immediately; roll back in `onError`

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- MyWeek.test.tsx
```

**Advanced Code Patterns**
- `useSensors` from dnd-kit with keyboard sensor for accessibility
- Persist bucket order using an `order` numeric field per item — never rely on array index for server order

**Anti-Patterns**
- Using array index as the server-side sort order — breaks when items are deleted or reordered

**DDD / TDD / BDD / Deep Module notes**
- DDD: My Week plan is a personal planning aggregate per user per week — scoped to the authenticated user, not visible to others.
- TDD: MSW returns items in two buckets; assert correct columns render; simulate drag → assert mutation called with correct bucket.
- BDD: "As a firm user, I can plan my work for the current week by organizing tasks across Focus, This Week, and Later buckets."
- Deep Module: `useMyWeekPlan` hides week key computation, pagination, and carry-over logic.

---

### Subtasks

- [ ] FRONT‑PROJ‑004.1 (AGENT): Implement `MyWeek` component with three-bucket layout and week navigation.
  **File(s):** `artifacts/apex-os/src/components/projects/MyWeek.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑004.2 (AGENT): Wire `useMyWeekPlan` hook for fetch, move, reorder, and carry-over.
  **File(s):** `artifacts/apex-os/src/components/projects/MyWeek.tsx`, `artifacts/apex-os/src/hooks/projects/useMyWeekPlan.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑004.3 (AGENT): Add inline personal note creation per bucket.
  **File(s):** `artifacts/apex-os/src/components/projects/MyWeek.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- MyWeek.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑004.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑005: Board Tab (Full Kanban)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Kanban board view exists in Projects. `API-PROJ-014` board & queue API is not wired.
**Size:** Medium

**Description:** Build a full Kanban board inside the Board tab: lanes as columns with task cards, drag-and-drop between and within lanes, queue lane "Claim" action for self-assignment, list/timeline toggle, and lane CRUD (add, rename, delete with reassignment confirmation).

**Depends on:** API‑PROJ‑014 (board & queue API green), FRONT‑PROJ‑001
**Blocks:** FRONT‑INT‑PROJ
**Related Files:** `artifacts/apex-os/src/components/projects/BoardView.tsx`, `artifacts/apex-os/src/hooks/projects/useBoardLanes.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `@dnd-kit/core`, `@dnd-kit/sortable`
- Exports: `BoardView` component, `useBoardLanes(projectId)`, `useMoveTask()`

**Definition of Done**
- [ ] Lanes rendered as columns with lane name, task count badge, task cards
- [ ] Drag-and-drop between lanes and within lanes; calls `useMoveTask` with optimistic update and rollback
- [ ] Queue lane shows "Claim" button on each card (assigns to current user via `useClaimTask` mutation)
- [ ] "Add Lane" button creates a new lane via `useCreateLane` mutation
- [ ] Lane context menu: rename, change type, delete (delete shows confirmation with reassignment target dropdown)
- [ ] List/Timeline toggle button (timeline view is placeholder in Phase 5; full Gantt in FRONT‑PROJ‑006)
- [ ] Loading skeletons for lanes and cards
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Full Gantt timeline (FRONT‑PROJ‑006)
- WIP limits on lanes (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/BoardView.tsx`, `artifacts/apex-os/src/hooks/projects/useBoardLanes.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/BoardView.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — revert to list view only; remove `BoardView` import
- Halt condition: if drag-and-drop leaves tasks in orphaned state (no lane), stop and fix rollback before proceeding

**Rules to Follow**
- Lane order and task position within lane must be persisted server-side — never rely solely on local state
- Lane deletion: always confirm and require a reassignment target if the lane has tasks

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- BoardView.test.tsx
```

**Advanced Code Patterns**
- Use `DndContext` with `SortableContext` per lane; `useDroppable` on each column to accept cross-lane drops
- `collision detection` strategy: `closestCorners` for intra-lane, `rectIntersection` for cross-lane

**Anti-Patterns**
- Sorting tasks client-side only without persisting order — reordering lost on page refresh
- Not implementing rollback on drag failure — cards jump to new position even when API rejects

**DDD / TDD / BDD / Deep Module notes**
- DDD: Board lanes are a view-layer concept within the Project aggregate; tasks have a `laneId` and `position` field managed by the board API.
- TDD: MSW returns 3 lanes with tasks; assert cards render in correct columns; simulate drag → assert `PATCH /tasks/:id/move` called.
- BDD: "As a project manager, I can manage tasks on a Kanban board with drag-and-drop lane transitions."
- Deep Module: `useBoardLanes` hides lane fetch and task grouping; `useMoveTask` hides optimistic update and rollback.

---

### Subtasks

- [ ] FRONT‑PROJ‑005.1 (AGENT): Build `BoardView` with dnd-kit; render lanes and task cards from `useBoardLanes`.
  **File(s):** `artifacts/apex-os/src/components/projects/BoardView.tsx`, `artifacts/apex-os/src/hooks/projects/useBoardLanes.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑005.2 (AGENT): Wire drag-and-drop to `useMoveTask` with optimistic update and rollback.
  **File(s):** `artifacts/apex-os/src/components/projects/BoardView.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑005.3 (AGENT): Implement lane CRUD (add, rename, delete with reassignment).
  **File(s):** `artifacts/apex-os/src/components/projects/BoardView.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑005.4 (AGENT): Write component tests (render, drag, lane CRUD).
  **File(s):** `artifacts/apex-os/src/components/projects/__tests__/BoardView.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- BoardView.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑005.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑006: Full Project Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No `/projects/:id` route exists. There is no project workspace page.
**Size:** Medium

**Description:** Create a `ProjectWorkspace` page at `/projects/:id` with four sub-views accessed via tab bar: Tasks (list + board), Timeline (Gantt/calendar of milestones and deadlines), Time & Budget (time entry list, budget vs actual chart), and Details (project metadata, members, template info). Tab state preserved in URL query param.

**Depends on:** API‑PROJ‑015 (workspace endpoints), FRONT‑PROJ‑001, FRONT‑PROJ‑005, FRONT‑AUTH‑002
**Blocks:** FRONT‑PROJ‑008
**Related Files:** `artifacts/apex-os/src/pages/ProjectWorkspace.tsx`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; Wouter `useParams`, `useLocation`; `BoardView` (FRONT‑PROJ‑005)
- Exports: `ProjectWorkspace` default export; register route in `App.tsx`

**Definition of Done**
- [ ] Route `/projects/:id` registered in `App.tsx` wrapped in `ProtectedRoute`
- [ ] Tab bar: Tasks | Timeline | Time & Budget | Details; active tab in URL `?tab=tasks`
- [ ] Tasks tab: list view (table) and board view toggle; filters by status, assignee
- [ ] Timeline tab: calendar/Gantt showing milestones and deadlines (Recharts timeline or CSS Gantt)
- [ ] Time & Budget tab: placeholder wired in FRONT‑PROJ‑008
- [ ] Details tab: project name, status, client, template used, members list (read-only in Phase 5)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time collaboration cursors (Phase 8+)
- Inline task editing directly in Gantt cells (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/ProjectWorkspace.tsx`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/ProjectWorkspace.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: remove the route from `App.tsx`; delete `ProjectWorkspace.tsx`
- Halt condition: if adding the new route breaks existing routing, revert `App.tsx` change

**Rules to Follow**
- Tab state must be in URL query param (`?tab=`) so browser back button works correctly
- `useParams` must validate that `id` is a valid UUID before making API calls; show 404 if invalid

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ProjectWorkspace.test.tsx
```

**Advanced Code Patterns**
- Lazy-load each tab panel with `React.lazy` / `Suspense` so the Tasks tab loads instantly and Timeline only loads when selected
- Pass `projectId` down via a `ProjectContext` provider so nested components don't need prop drilling

**Anti-Patterns**
- Fetching all four tab data sets on page load — fetch only the active tab's data

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ProjectWorkspace` is the primary aggregation view for the Project aggregate root.
- TDD: MSW returns project detail; assert workspace renders with correct project name; simulate tab click → assert URL query param changes.
- BDD: "As a project manager, I can open a project workspace and switch between tasks, timeline, budget, and details views."
- Deep Module: `ProjectWorkspace` is the shell; each tab panel is a self-contained deep module.

---

### Subtasks

- [ ] FRONT‑PROJ‑006.1 (AGENT): Create `ProjectWorkspace` page with tab bar and URL-based tab state.
  **File(s):** `artifacts/apex-os/src/pages/ProjectWorkspace.tsx`, `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; route navigable.

- [ ] FRONT‑PROJ‑006.2 (AGENT): Implement Tasks, Details, and Timeline tab content.
  **File(s):** `artifacts/apex-os/src/pages/ProjectWorkspace.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑006.3 (AGENT): Write tab navigation and data loading tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/ProjectWorkspace.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ProjectWorkspace.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑006.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑007: PM Templates UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No template management UI exists. `API-PROJ-016` (templates) and `API-PROJ-017` (instantiation) are not wired.
**Size:** Medium

**Description:** Build template list, template detail/blueprint editor, version history browser, and "Create Project from Template" instantiation wizard with preview of what will be created.

**Depends on:** API‑PROJ‑016 (templates API), API‑PROJ‑017 (instantiation API), FRONT‑PROJ‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/projects/TemplateEditor.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Dialog from shadcn/ui
- Exports: `TemplateEditor` component, `TemplateList` component, `InstantiationWizard` component

**Definition of Done**
- [ ] Template list: name, version, active status, created date; "New Template" button
- [ ] Template detail: visual task blueprint editor (task hierarchy, default assignees, milestone placement); save/publish actions
- [ ] Version history: list of past versions with date and author; "Restore" action
- [ ] "Create Project from Template" instantiation wizard: Step 1 — override name/due date; Step 2 — preview tasks/milestones to be created; Step 3 — confirm → navigate to new project
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Template sharing across organisations (Phase 8+)
- AI-generated template suggestions (Phase 10)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/TemplateEditor.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/TemplateEditor.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `TemplateEditor` and related components
- Halt condition: if instantiation creates corrupted project data, stop and verify the API-side blueprint expansion

**Rules to Follow**
- Template publishing is irreversible for a given version — new edits create a new version, not in-place updates
- Instantiation wizard Step 2 preview must be read-only — no edits to individual tasks at this step

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- TemplateEditor.test.tsx
```

**Advanced Code Patterns**
- Task blueprint editor: use a tree data structure with `@dnd-kit/sortable` for reordering task hierarchy
- Instantiation preview: MSW mock returns a "dry run" response showing tasks to be created — assert count and structure

**Anti-Patterns**
- Allowing template editing without versioning — always create a new version on save
- Skipping the instantiation preview step — users need to confirm what will be created before execution

**DDD / TDD / BDD / Deep Module notes**
- DDD: Templates are a planning concept in the Projects bounded context; instantiation is a factory operation producing a new Project aggregate.
- TDD: MSW returns template list; assert list renders; simulate instantiation wizard → assert `POST /api/v1/projects/from-template` called.
- BDD: "As a project manager, I can create a new project from a reusable template and preview the tasks it will generate."
- Deep Module: `InstantiationWizard` hides the multi-step preview-and-confirm flow; callers just render `<InstantiationWizard templateId={id} />`.

---

### Subtasks

- [ ] FRONT‑PROJ‑007.1 (AGENT): Build template list and detail/blueprint editor.
  **File(s):** `artifacts/apex-os/src/components/projects/TemplateEditor.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑007.2 (AGENT): Build version history browser.
  **File(s):** `artifacts/apex-os/src/components/projects/TemplateEditor.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑007.3 (AGENT): Implement instantiation wizard with preview.
  **File(s):** `artifacts/apex-os/src/components/projects/TemplateEditor.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- TemplateEditor.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑007.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑008: Time Entry & Budget UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** The Time & Budget tab in `ProjectWorkspace` is a placeholder. `API-PROJ-018` (time entries) and `API-PROJ-019` (budget vs actual) are not wired.
**Size:** Small

**Description:** Implement the Time & Budget tab content: time entry list, log-hours modal form, manager approval button, and budget vs actual Recharts bar chart with variance indicators.

**Depends on:** API‑PROJ‑018 (time entries API), API‑PROJ‑019 (budget vs actual API), FRONT‑PROJ‑006
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/projects/TimeBudgetView.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `BarChart` from `recharts`; Dialog from shadcn/ui
- Exports: `TimeBudgetView` component

**Definition of Done**
- [ ] Time entry list: date, hours, task name, description, billable flag, approved badge
- [ ] "Log Hours" modal: project/task selector, date picker, hours input, billable checkbox; submits via `useCreateTimeEntry`
- [ ] Manager "Approve" button per entry calls `useApproveTimeEntry` mutation
- [ ] Budget vs actual `BarChart`: two bars per metric (estimated vs actual hours; budget amount vs spent); variance badge (on track / over / under)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automatic time tracking (screen timer, integrations)
- Billable invoice export from time entries (Finance domain)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/TimeBudgetView.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/TimeBudgetView.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — `TimeBudgetView` is isolated inside the workspace tab
- Halt condition: if time entry approval changes billing state in Finance unexpectedly, stop and verify cross-domain effects

**Rules to Follow**
- Hours input must reject negative values and values over 24 at the form validation level (Zod schema)
- Variance calculation: `(actual - budget) / budget * 100` — server-computed preferred; client can compute as fallback

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- TimeBudgetView.test.tsx
```

**Advanced Code Patterns**
- Use `ResponsiveContainer` from Recharts to make the bar chart fill its parent on any screen size
- Custom Recharts tooltip formatter for budget amounts using `Intl.NumberFormat`

**Anti-Patterns**
- Fetching time entries without project scoping — returns all time entries globally
- Computing budget variance client-side with floating-point arithmetic — use server-provided variance

**DDD / TDD / BDD / Deep Module notes**
- DDD: Time entries are a cross-cutting concern between Projects and Finance; in Phase 5 they live in the Projects context; Finance integration deferred.
- TDD: MSW returns time entries for project; assert list renders; simulate log hours form submit → assert mutation called.
- BDD: "As a project manager, I can track time against tasks and compare actual spend to the project budget."
- Deep Module: `TimeBudgetView` hides all time entry CRUD and chart data aggregation.

---

### Subtasks

- [ ] FRONT‑PROJ‑008.1 (AGENT): Implement time entry list and log-hours modal.
  **File(s):** `artifacts/apex-os/src/components/projects/TimeBudgetView.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑008.2 (AGENT): Build budget vs actual bar chart and variance indicators using Recharts.
  **File(s):** `artifacts/apex-os/src/components/projects/TimeBudgetView.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑008.3 (AGENT): Write component tests (list, modal submit, chart render).
  **File(s):** `artifacts/apex-os/src/components/projects/__tests__/TimeBudgetView.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- TimeBudgetView.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑008.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PROJ‑009: Advanced Filters & Bulk Operations
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No saved views, advanced filter builder, or bulk selection exists in Projects.
**Size:** Medium

**Description:** Add saved views (name, save, apply, update, delete), a multi-condition AND/OR filter builder on task/project fields, and bulk operations (select multiple tasks → bulk change status, assignee, or move to lane) with a floating action bar.

**Depends on:** FRONT‑PROJ‑001, FRONT‑PROJ‑005
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/projects/SavedViewSelector.tsx`, `artifacts/apex-os/src/components/projects/FilterBuilder.tsx`, `artifacts/apex-os/src/components/projects/BulkActionBar.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Popover, Select from shadcn/ui
- Exports: `SavedViewSelector`, `FilterBuilder`, `BulkActionBar` components

**Definition of Done**
- [ ] `SavedViewSelector`: "Save View" button saves current filter state; dropdown lists saved views; Apply/Delete actions
- [ ] `FilterBuilder`: multi-condition filter (AND/OR) on `status`, `assignee`, `due_date`, `priority`, `label` fields
- [ ] `BulkActionBar`: appears when ≥1 task selected; actions: change status, reassign, move to lane; applies via bulk mutation API
- [ ] Bulk selection: checkboxes on task cards (Board) and rows (List); "Select All" in current filter
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Saved views shared across team members (Phase 6+)
- Bulk archive/delete (requires additional confirmation flow)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/projects/SavedViewSelector.tsx`, `artifacts/apex-os/src/components/projects/FilterBuilder.tsx`, `artifacts/apex-os/src/components/projects/BulkActionBar.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/projects/__tests__/filters-bulk.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — all three components are additive; remove them without affecting core project views
- Halt condition: if bulk status change corrupts task state, stop and verify the bulk mutation API payload format

**Rules to Follow**
- Saved view filter state is serialized as a JSON blob to `localStorage` and synced to `GET /api/v1/saved-views` — never persist only to localStorage
- Bulk mutation must send a single `PATCH /api/v1/tasks/bulk` request — not N individual PATCH requests

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- filters-bulk.test.tsx
```

**Advanced Code Patterns**
- Filter condition schema: `{ field: string, operator: 'eq'|'neq'|'gte'|'lte'|'contains', value: string }[]` with a `logic: 'AND'|'OR'` root
- `BulkActionBar` uses a `Set<string>` of selected task IDs managed in the parent via `useState` — passed down as a controlled prop

**Anti-Patterns**
- Sending N individual PATCH requests for bulk operations — causes N round-trips and possible partial failure
- Storing saved views only in localStorage — lost on incognito/new device

**DDD / TDD / BDD / Deep Module notes**
- DDD: Saved views and filter state are user-preference concepts; they don't belong to the Project aggregate.
- TDD: Assert that selecting 3 tasks shows bulk action bar; simulate "Change Status" → assert single `PATCH /tasks/bulk` called.
- BDD: "As a project manager, I can apply advanced filters to the task list and save them as named views."
- Deep Module: `FilterBuilder` hides condition composition logic; `BulkActionBar` hides the bulk mutation and selection state.

---

### Subtasks

- [ ] FRONT‑PROJ‑009.1 (AGENT): Implement `SavedViewSelector` with save/apply/delete.
  **File(s):** `artifacts/apex-os/src/components/projects/SavedViewSelector.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑009.2 (AGENT): Build `FilterBuilder` with AND/OR multi-condition logic.
  **File(s):** `artifacts/apex-os/src/components/projects/FilterBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PROJ‑009.3 (AGENT): Add bulk selection checkboxes and `BulkActionBar`; wire bulk mutation.
  **File(s):** `artifacts/apex-os/src/components/projects/BulkActionBar.tsx`, `artifacts/apex-os/src/pages/Projects.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- filters-bulk.test.tsx` → GREEN.

- [ ] FRONT‑PROJ‑009.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑PROJ: Projects Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** All project mutation surfaces (task checkbox, status dropdown, milestone completion, log-hours form) render correctly but have no mutation wiring.
**Size:** Medium

**Description:** Wire all Projects create/update/delete mutations: task checkbox toggle (`useUpdateTask`), project status dropdown (`useUpdateProject`), milestone completion (`useUpdateMilestone`), time entry creation (`useCreateTimeEntry`). All mutations show sonner toast feedback.

**Depends on:** FRONT‑PROJ‑001, FRONT‑PROJ‑002, FRONT‑PROJ‑005, FRONT‑PROJ‑008, FRONT‑INFRA‑003, FRONT‑INFRA‑004
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Projects.tsx`, `artifacts/apex-os/src/hooks/projects/`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `toast` from `sonner`; `useUndoableMutation` from `FRONT‑INFRA‑004`
- Exports: `useUpdateTask()`, `useUpdateProject()`, `useUpdateMilestone()`, `useCreateTimeEntry()`, `useDeleteTask()`

**Definition of Done**
- [ ] Task checkbox → `useUpdateTask` with optimistic toggle; completed tasks show strikethrough
- [ ] Project status dropdown → `useUpdateProject`; status badge updates immediately
- [ ] Milestone "Mark Complete" button → `useUpdateMilestone` mutation
- [ ] Log-hours form (from FRONT‑PROJ‑008) → `useCreateTimeEntry`; invalidates budget view
- [ ] Task delete → `useUndoableMutation` (FRONT‑INFRA‑004) with undo toast
- [ ] All mutation loading states disable the relevant control
- [ ] Integration tests with MSW cover all mutation paths

**Out of Scope**
- Bulk mutations (FRONT‑PROJ‑009)
- Project deletion (requires additional confirmation; Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/projects/useUpdateTask.ts`, `artifacts/apex-os/src/hooks/projects/useUpdateProject.ts`, `artifacts/apex-os/src/hooks/projects/useUpdateMilestone.ts`, `artifacts/apex-os/src/hooks/projects/useDeleteTask.ts`, `artifacts/apex-os/src/pages/Projects.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/projects-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — comment out mutation wiring; controls revert to display-only
- Halt condition: if task toggle causes cascade failures (e.g., milestone auto-completion), stop and verify cross-entity effects

**Rules to Follow**
- Never call `mutate()` more than once per user interaction — always disable controls during `isPending`
- Invalidate only the affected query keys (`['tasks', projectId]`, `['projects']`) — not all queries

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- projects-interactive.test.tsx
```

**Advanced Code Patterns**
- Optimistic task toggle: `onMutate` sets `completed: true` in cache; `onError` reverts; `onSettled` invalidates
- Invalidate both `['tasks']` and `['projects']` after task completion — project completion % badge must update

**Anti-Patterns**
- Invalidating all queries after every mutation — causes unnecessary refetches across all domains
- Not implementing optimistic update for task checkbox — 300ms+ delay makes the UI feel unresponsive

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mutations enforce Projects domain rules via API; client delegates validation to the backend.
- TDD: Integration test — click task checkbox → assert `PATCH /tasks/:id` called with `{ completed: true }` → assert task shows strikethrough.
- BDD: "As a firm user, I can check off a task and see it marked complete immediately."
- Deep Module: Each mutation hook hides optimistic update, cache invalidation, and toast logic.

---

### Subtasks

- [ ] FRONT‑INT‑PROJ.0.25 (AGENT): List all mutation surfaces in Projects; map each to its API endpoint.
  *No action — pause until fully understood.*

- [ ] FRONT‑INT‑PROJ.1 (AGENT): Implement `useUpdateTask` and `useDeleteTask`; wire task checkbox and delete action.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useUpdateTask.ts`, `artifacts/apex-os/src/hooks/projects/useDeleteTask.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PROJ.2 (AGENT): Implement `useUpdateProject`; wire project status dropdown.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useUpdateProject.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PROJ.3 (AGENT): Implement `useUpdateMilestone`; wire milestone completion button.
  **File(s):** `artifacts/apex-os/src/hooks/projects/useUpdateMilestone.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PROJ.4 (AGENT): Add sonner toast feedback for all mutations; write integration tests.
  **File(s):** `artifacts/apex-os/src/pages/Projects.tsx`, `artifacts/apex-os/src/pages/__tests__/projects-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- projects-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑PROJ.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Projects Data Integration

### [ ] FRONT‑PROJ‑001: Projects & Tasks – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑004 (projects green), API‑PROJ‑008 (tasks green).  
**Definition of Done:** Project list and task views use `useProjectList` and `useTaskList` hooks. Task status displayed from API. All mock data imports removed.

**DDD:** Projects bounded context with Project aggregate root and Task entity. Project is the aggregate root - tasks exist only within projects. Avoid treating individual tasks as separate aggregates.

**TDD:** Write unit tests for `useProjectList` and `useTaskList` hooks to ensure data fetching and state management work as expected.

**Deep Module:** Projects module encapsulates project lifecycle, task management, and planning features. Clean separation between data fetching (hooks), state management, and UI components. Projects aggregate root maintains consistency across all operations.

**Anti-Patterns:** Avoid using a single, monolithic state management solution. Instead, use a combination of hooks and local state to manage project and task data.

**Subtasks:**
- [ ] FRONT‑PROJ‑001.1: Create hooks and replace mock projects data. (AGENT)  
- [ ] FRONT‑PROJ‑001.2: Replace mock tasks data; display lane and position where applicable. (AGENT)  
- [ ] FRONT‑PROJ‑001.3: Wire project status and budget field display. (AGENT)

---

### [ ] FRONT‑PROJ‑002: Milestones & Calendar – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑012 (milestones green).  
**Definition of Done:** Milestone list and calendar view use `useMilestoneList` hook. Calendar populated with real milestone dates and project deadlines.

**Subtasks:**
- [ ] FRONT‑PROJ‑002.1: Create `useMilestoneList` hook. (AGENT)  
- [ ] FRONT‑PROJ‑002.2: Replace mock milestones in list and calendar views. (AGENT)

---

### [ ] FRONT‑PROJ‑003: Scheduler Tab (Recurring Work Planning UI)
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑021 (recurring work plan API), API‑PROJ‑022 (recurring work generation endpoint).  
**Definition of Done:** The Scheduler tab in Projects now implements a PM‑owned recurring work planner:  
- List recurring work plans with status (active/inactive), next run date, template name.  
- Create/edit recurring plan: select template, set frequency (RRULE or simple picker), enable/disable.  
- Manual "Generate Now" button triggers task creation from the plan.  
- Generation log: list of past generations with date, tasks created, status.  
- Empty state when no plans exist.  
- Error handling for duplicate generation (`RecurringWorkDuplicate`).  

**DDD:** Projects bounded context with Project aggregate root and Task entity. Project is the aggregate root - tasks exist only within projects. Avoid treating individual tasks as separate aggregates.PM Scheduler feature, not an appointment read‑out.  
**Related Files:** `artifacts/apex‑os/src/components/projects/SchedulerTab.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑003.1: Create `useRecurringPlanList`, `useRecurringPlanMutations` hooks. (AGENT)  
- [ ] FRONT‑PROJ‑003.2: Build recurring plan list, create/edit form, and generation log UI. (AGENT)  
- [ ] FRONT‑PROJ‑003.3: Wire "Generate Now" button with loading state and duplicate error toast. (AGENT)  
- [ ] FRONT‑PROJ‑003.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑PROJ‑004: My Week UI
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑013 (My Week planning API).  
**Definition of Done:** Personal work planning view:  
- Three columns: Focus, This Week, Later.  
- Drag‑and‑drop tasks between buckets with order persistence.  
- Mini‑calendar shows the current week; navigation to past/future weeks.  
- Carry‑over button: moves incomplete items from previous week to current.  
- Personal notes: free‑text items in any bucket not linked to a task.  
- Loading skeleton and empty states for each bucket.  

**Related Files:** `artifacts/apex‑os/src/components/projects/MyWeek.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑004.1: Implement `MyWeek` component with three‑bucket layout and drag‑and‑drop. (AGENT)  
- [ ] FRONT‑PROJ‑004.2: Wire to `useMyWeekPlan` hook for fetch, move, reorder, and carry‑over. (AGENT)  
- [ ] FRONT‑PROJ‑004.3: Add personal note creation/editing inline. (AGENT)  
- [ ] FRONT‑PROJ‑004.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑PROJ‑005: Board Tab UI
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑014 (board & queue API).  
**Definition of Done:** Full Kanban board:  
- Lanes rendered as columns with lane name and task count.  
- Tasks as cards within lanes; drag‑and‑drop between lanes and within lane.  
- Queue lane with "claim task" action for self‑assignment.  
- List/Timeline toggle button to switch views.  
- "Add Lane" button to create new lane.  
- Lane context menu: edit name, change type, delete (with reassignment confirmation).  
- Loading skeletons for lanes and cards.  

**Related Files:** `artifacts/apex‑os/src/components/projects/BoardView.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑005.1: Build Kanban board with `dnd‑kit` or similar library. (AGENT)  
- [ ] FRONT‑PROJ‑005.2: Wire drag‑and‑drop to move task mutation. (AGENT)  
- [ ] FRONT‑PROJ‑005.3: Implement lane CRUD actions (add, edit, delete). (AGENT)  
- [ ] FRONT‑PROJ‑005.4: Add list and timeline view toggles. (AGENT)  
- [ ] FRONT‑PROJ‑005.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑PROJ‑006: Full Project Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑015 (workspace endpoints).  
**Definition of Done:** Route‑backed page (`/projects/:id`) with four sub‑views:  
- **Tasks:** list and board view, filters by status/assignee.  
- **Timeline:** Gantt‑style or calendar view of milestones and deadlines.  
- **Time & Budget:** budget vs actual chart, time entry list, burn‑down chart.  
- **Details:** project metadata, members list, template used.  
- Navigation between tabs via URL or tab bar; state preserved on tab switch.  

**Related Files:** `artifacts/apex‑os/src/pages/ProjectWorkspace.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑006.1: Create `ProjectWorkspace` page with tabbed routing. (AGENT)  
- [ ] FRONT‑PROJ‑006.2: Implement each sub‑view as a separate component. (AGENT)  
- [ ] FRONT‑PROJ‑006.3: Wire all views to corresponding workspace endpoints. (AGENT)  
- [ ] FRONT‑PROJ‑006.4: Component test for tab navigation and data loading. (AGENT)

---

### [ ] FRONT‑PROJ‑007: PM Templates UI
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑016 (templates API), API‑PROJ‑017 (instantiation API).  
**Definition of Done:**  
- Template list with name, version, active status.  
- Template detail/edit view with visual task blueprint editor (task hierarchy, default assignees, milestone placement).  
- Version history browser.  
- "Create Project from Template" button opens instantiation modal: overrides for project name, due date; preview of what will be created; execute.  

**Related Files:** `artifacts/apex‑os/src/components/projects/TemplateEditor.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑007.1: Build template list and detail views. (AGENT)  
- [ ] FRONT‑PROJ‑007.2: Create visual blueprint editor (task tree with drag‑and‑drop). (AGENT)  
- [ ] FRONT‑PROJ‑007.3: Implement instantiation wizard with preview. (AGENT)  
- [ ] FRONT‑PROJ‑007.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑PROJ‑008: Time Entry & Budget UI
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑018 (time entries API), API‑PROJ‑019 (budget vs actual API).  
**Definition of Done:** Within project workspace "Time & Budget" tab:  
- Time entry list with date, hours, description, billable flag.  
- Log hours form (modal) with project/task selector, date picker, hours input.  
- Approval button for managers to mark entries as approved.  
- Budget vs actual chart (bar or line) showing estimated hours, logged hours, budget amount.  
- Variance indicators (on track / over budget / under budget).  

**Related Files:** `artifacts/apex‑os/src/components/projects/TimeBudgetView.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑008.1: Implement time entry list and log‑hours form. (AGENT)  
- [ ] FRONT‑PROJ‑008.2: Build budget vs actual visualisation using Recharts. (AGENT)  
- [ ] FRONT‑PROJ‑008.3: Wire hooks and mutations. (AGENT)  
- [ ] FRONT‑PROJ‑008.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑PROJ‑009: Advanced PM Filters & Bulk Operations
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑PROJ‑001, FRONT‑PROJ‑005.  
**Definition of Done:**  
- Saved views: ability to save current filter state (status, assignee, date range) as a named view; list saved views in a dropdown; apply, update, delete saved views.  
- Advanced filter builder: multi‑condition filters (AND/OR) on task/project fields.  
- Bulk operations: select multiple tasks → bulk change status, assignee, or move to lane.  
- Bulk selection: checkboxes on task cards/rows; action bar appears with options.  

**Related Files:** `artifacts/apex‑os/src/components/projects/SavedViewSelector.tsx`, `FilterBuilder.tsx`, `BulkActionBar.tsx`

**Subtasks:**
- [ ] FRONT‑PROJ‑009.1: Implement saved view management UI. (AGENT)  
- [ ] FRONT‑PROJ‑009.2: Build advanced filter builder component. (AGENT)  
- [ ] FRONT‑PROJ‑009.3: Add bulk selection and action bar. (AGENT)  
- [ ] FRONT‑PROJ‑009.4: Component tests. (AGENT)

---

### [ ] FRONT‑INT‑PROJ: Projects Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑PROJ‑001 through FRONT‑PROJ‑009.  
**Definition of Done:**  
- Task toggle (checkbox → `useUpdateTask` mutation, optimistic update).  
- Project status change (dropdown → `useUpdateProject` mutation).  
- Milestone completion (action button → `useUpdateMilestone` mutation).  
- Time entry log (form → `useCreateTimeEntry` mutation, invalidates budget view).  
- All mutations show toast feedback on success/failure.

**DDD:** Projects bounded context with aggregate root patterns. Interactive features maintain aggregate consistency - mutations go through proper domain services rather than direct database access.

**TDD:** Unit tests for each mutation hook with optimistic update behavior. Integration tests verify complete user interaction flows from UI click to API response to UI update.

**Deep Module:** Interactive features module encapsulates all user action handling, providing clean separation between UI components and business logic. Centralized mutation handling with consistent error patterns.

**Anti-Patterns:** 
- Don't bypass optimistic updates for better UX
- Don't ignore loading states during mutations
- Don't skip error handling and user feedback
- Don't create tight coupling between UI components and API structure

**Subtasks:**
- [ ] FRONT‑INT‑PROJ.1: Wire `useUpdateTask` to task checkboxes and status dropdowns. (AGENT)  
- [ ] FRONT‑INT‑PROJ.2: Wire `useUpdateProject` to project status changes. (AGENT)  
- [ ] FRONT‑INT‑PROJ.3: Wire `useCreateTimeEntry` to log‑hours form. (AGENT)  
- [ ] FRONT‑INT‑PROJ.4: Add toast notifications for all mutation outcomes. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Projects components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Projects pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard project metrics depend on Projects API integration
- **TODO-P5-FINANCE.md**: Project budget data depends on Finance integration

### Related Master Tracker Tasks
- **API‑PROJ‑004**: Projects API must be green before FRONT‑PROJ‑001
- **API‑PROJ‑008**: Tasks API must be green before FRONT‑PROJ‑001
- **API‑PROJ‑012**: Milestones API must be green before FRONT‑PROJ‑002

---

## Verification Commands

### Projects Integration Verification
```bash
# Core Projects verification
npm test -- useProjectList.test.ts
npm test -- useTaskList.test.ts
npm test -- useMilestoneList.test.ts

# Planning features verification
npm test -- scheduler-tab.test.tsx
npm test -- my-week.test.tsx
npm test -- board-view.test.tsx

# Workspace verification
npm test -- project-workspace.test.tsx
npm test -- template-editor.test.tsx
npm test -- time-budget-view.test.tsx

# Interactive features verification
npm test -- projects-interactive.test.tsx

# Manual verification
# Navigate to Projects page, verify all data loads from API
# Test task creation, editing, and status changes
# Test planning features (Scheduler, My Week, Board)
# Test project workspace with all tabs
```

---

## Completion Criteria

### Projects Frontend Integration Complete When:
1. All Projects data (projects, tasks, milestones) loads from APIs
2. Planning features (Scheduler, My Week, Board) are fully functional
3. Project workspace provides comprehensive project management views
4. Time tracking and budget management work with real data
5. Advanced features (templates, filters, bulk operations) are functional
6. All mock data imports are removed from Projects components
7. Component tests pass with MSW mocks
8. Manual testing confirms complete Projects functionality
9. Interactive features work with optimistic updates and proper error handling

**Estimated Timeline:** 10-12 days with parallel execution

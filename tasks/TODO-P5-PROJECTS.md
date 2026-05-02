# TODO-P5-PROJECTS.md – Projects Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Projects Data Integration including core project management, planning features, and advanced project workflows.

---

## Projects Data Integration

### [ ] FRONT‑PROJ‑001: Projects & Tasks – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑004 (projects green), API‑PROJ‑008 (tasks green).  
**Definition of Done:** Project list and task views use `useProjectList` and `useTaskList` hooks. Task status displayed from API. All mock data imports removed.

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

**DDD:** This is the PM Scheduler feature, not an appointment read‑out.  
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

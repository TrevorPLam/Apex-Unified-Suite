# TODO-P3-PROJECTS-DEPTH.md – Phase 3: Projects Depth Features

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the Projects context depth features – advanced functionality from the Projects Delta. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Projects – Depth (Delta)

### [ ] API‑PROJ‑013: My Week Planning API
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑006, API‑PROJ‑008 (tasks green).  
**Definition of Done:** Personal work planning endpoints:
- `GET /projects/my‑week?weekStart={date}` – returns tasks grouped by planning bucket (Focus, This Week, Later) with ordering, including carry‑over from previous week and personal notes.
- `POST /projects/my‑week/plan` – add a task to a planning bucket for a specific week.
- `PATCH /projects/my‑week/{planId}` – move an item to a different bucket, update order_index, or update note.
- `DELETE /projects/my‑week/{planId}` – remove an item from the plan (does not delete the task).
- `POST /projects/my‑week/carry‑over` – auto‑carry incomplete items to the next week.
All operations scoped to the authenticated user. Emits `MyWeekUpdated` event.  
**Integration tests:** plan a task for this week, move to Focus, verify ordering, carry over to next week, remove from plan (task still exists).  
**DDD:** Per‑user planning state, separate from canonical task status (PROJ‑DOM‑003).  
**Deep Module:** Encapsulates personal planning logic, carry‑over rules, and ordering.

**Rules to Follow:**
- All operations scoped to authenticated user
- Personal planning separate from task status
- Carry-over logic respects task completion
- Ordering preserved within buckets
- Event emission for planning changes

**Advanced Code Patterns:**
- User-scoped data isolation
- Planning bucket state machine
- Event-driven carry-over automation
- Ordering preservation algorithms

**Anti-Patterns:**
- Mixing planning state with task status
- Global planning data (not user-scoped)
- Manual carry-over without automation
- Missing event emission

**TDD:** Write failing integration tests before implementation. Tests must verify all planning operations, carry-over logic, and event emission.  
**BDD:** Enables "As a user, I can plan my week and carry over incomplete tasks" scenarios.

### Subtasks:
- [ ] API‑PROJ‑013.1: Add My Week endpoints to OpenAPI spec. (AGENT)  
  **verification:** Spec validates; codegen passes.
- [ ] API‑PROJ‑013.2: Write integration tests (red). (AGENT) – `artifacts/api-server/__tests__/api/projects/my-week.test.ts`  
  **verification:** Tests fail (no implementation).
- [ ] API‑PROJ‑013.3: Implement `MyWeekService` and repository. (AGENT) – `services/projects/my-week-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑013.4: Create routes, run tests to green. (AGENT) – `routes/projects/my-week.ts`  
  **verification:** All tests pass.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Service encapsulates planning logic complexity
- Event emission verified in tests

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Service layer encapsulation
- Event-driven architecture
- User-scoped data access

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Shallow service without encapsulation
- Missing event emission tests

---

### [ ] API‑PROJ‑014: Board & Queue API
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑005, API‑PROJ‑008.  
**Definition of Done:** Board management and retrieval:
- `GET /projects/{projectId}/board` – returns all lanes with their tasks ordered by position, lane summaries (count, status).
- `POST /projects/{projectId}/board/lanes` – create a new lane.
- `PATCH /projects/{projectId}/board/lanes/{laneId}` – update lane name, type, order.
- `DELETE /projects/{projectId}/board/lanes/{laneId}` – soft delete lane (tasks remain, moved to default lane).
- `PATCH /projects/{projectId}/board/tasks/{taskId}/move` – move task between lanes and/or update position. Supports bulk reorder.
- Queue lane type: tasks in queue have ownership rules (first‑to‑claim or assigned).
**Integration tests:** create lanes, move task between lanes, reorder within lane, delete lane (tasks reassigned).  
**DDD:** Board lanes and queue behaviour are core PM workflow (PROJ‑DOM‑002).  
**Deep Module:** Service hides lane management and complex reordering logic.

**Rules to Follow:**
- Lane operations must preserve task integrity
- Position updates must be atomic
- Queue lanes enforce ownership rules
- Soft delete for lanes (tasks preserved)
- Bulk reorder operations transactional

**Advanced Code Patterns:**
- Board state management
- Atomic position updates
- Queue ownership enforcement
- Transactional bulk operations

**Anti-Patterns:**
- Non-atomic position updates
- Hard deletion of lanes with tasks
- Missing queue ownership validation
- Inconsistent board state

**TDD:** Write failing integration tests before implementation. Tests must cover lane creation, task movement, bulk reordering, and queue behavior.

### Subtasks:
- [ ] API‑PROJ‑014.1: Add board endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑014.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑014.3: Implement `BoardService` and lane repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑014.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑015: Composite Project Workspace Endpoints
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑004, API‑PROJ‑008, API‑PROJ‑012, API‑PROJ‑018.  
**Definition of Done:** Aggregate endpoints for the full project workspace:
- `GET /projects/{projectId}/workspace/tasks` – tasks grouped by status or lane, with assignee details.
- `GET /projects/{projectId}/workspace/timeline` – milestones, deadlines, and activity feed.
- `GET /projects/{projectId}/workspace/time‑budget` – time entries, estimate vs actual, burn chart data.
- `GET /projects/{projectId}/workspace/details` – project metadata, members, templates used.
**Integration tests:** verify each sub‑view returns correct aggregated data.  
**DDD:** Optimised payloads for the four workspace tabs (Tasks, Timeline, Time & Budget, Details).

### Subtasks:
- [ ] API‑PROJ‑015.1: Add workspace endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑015.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑015.3: Implement `ProjectWorkspaceService`. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑015.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑016: Project Templates Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑007.  
**Definition of Done:** CRUD for reusable project templates:
- `GET /projects/templates` – list active templates with pagination.
- `POST /projects/templates` – create template with blueprint (task structure, milestones, default assignees).
- `GET /projects/templates/{templateId}` – get template detail.
- `GET /projects/templates/{templateId}/versions` – list version history.
- `POST /projects/templates/{templateId}/versions` – create a new version (increment version number).
- `PATCH /projects/templates/{templateId}` – update template metadata.
- `DELETE /projects/templates/{templateId}` – soft delete.
**Integration tests:** create template, add version, list versions, soft delete.  
**DDD:** Reusable project blueprints (PROJ‑DOM‑004).

### Subtasks:
- [ ] API‑PROJ‑016.1: Add template endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑016.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑016.3: Implement `ProjectTemplateService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑016.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑017: Project Creation from Template API
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑016, API‑PROJ‑004.  
**Definition of Done:**
- `POST /projects/templates/{templateId}/instantiate` – creates a new project with all tasks, milestones, and lane configuration defined in the template blueprint. Accepts overrides for project name, due date, and assignees.
- `POST /projects/templates/{templateId}/preview` – dry‑run that returns what would be created without persisting.
Returns 201 with the new project ID. Emits `ProjectCreatedFromTemplate` event.  
**Integration tests:** instantiate project, verify all tasks and milestones created; preview returns correct structure.  
**DDD:** Template application logic.

### Subtasks:
- [ ] API‑PROJ‑017.1: Add instantiate/preview endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑017.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑017.3: Implement `instantiateProject` and `previewProject` in ProjectTemplateService. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑017.4: Create route, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑018: Time Entry API
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑008, API‑PROJ‑004.  
**Definition of Done:** Time tracking endpoints:
- `GET /projects/{projectId}/time‑entries` – list entries with pagination, filter by `task_id`, `user_id`, `date` range, `billable`.
- `POST /projects/{projectId}/time‑entries` – log hours against a task or project. Body: `{ taskId?, hours, description, date, billable }`.
- `PATCH /projects/{projectId}/time‑entries/{entryId}` – update hours, description, or billable flag.
- `DELETE /projects/{projectId}/time‑entries/{entryId}` – hard delete (time entries are financial records; deletion is restricted to admins or recent entries).
- `POST /projects/{projectId}/time‑entries/{entryId}/approve` – mark as approved.
Returns `Result<T, DomainError>`.  
**Integration tests:** create entry, list by task, approve, delete.  
**DDD:** Captures actual time spent (PROJ‑DOM‑005).

### Subtasks:
- [ ] API‑PROJ‑018.1: Add time entry endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑018.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑018.3: Implement `TimeEntryService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑018.4: Create route, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑019: Budget vs Actual Endpoint
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑004, API‑PROJ‑018.  
**Definition of Done:**
- `GET /projects/{projectId}/budget‑vs‑actual` – returns comparison data:
  - `estimated_hours` vs total logged hours
  - `budget_hours` vs total logged hours (billable vs non‑billable breakdown)
  - `budget_amount_cents` vs billable hours × hourly rate (or direct comparison if amounts are tracked)
  - Burn‑down or burn‑up chart data (hours remaining over time)
  - Variance percentages and status (on track / over budget / under budget)
**Integration tests:** verify calculations with known time entries.  
**DDD:** Financial oversight for project managers.

### Subtasks:
- [ ] API‑PROJ‑019.1: Add budget‑vs‑actual endpoint to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑019.2: Write integration tests with seeded time entries. (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑019.3: Implement calculation logic in `ProjectBudgetService`. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑019.4: Create route, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑020: Project Timeline & Progress Report API
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑004, API‑PROJ‑008, API‑PROJ‑012, EVENT‑001.  
**Definition of Done:**
- `GET /projects/{projectId}/timeline` – chronological feed of project events (task completions, milestone achievements, status changes, time entries, comments).
- `GET /projects/{projectId}/progress‑report` – summary report including:
  - Overall progress percentage
  - Tasks completed vs total
  - Milestone status (completed/upcoming/overdue)
  - Recent activity (last 7 days)
  - Budget status summary
  - Upcoming deadlines
**Integration tests:** verify feed includes all event types, report calculations correct.  
**DDD:** Client‑ready and internal progress reporting.

### Subtasks:
- [ ] API‑PROJ‑020.1: Add timeline and report endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑020.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑020.3: Implement `ProjectTimelineService` and `ProgressReportService`. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑020.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑021: Recurring Work Plan Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑PROJ‑009.  
**Definition of Done:** CRUD for recurring work plans (PM Scheduler):
- `GET /projects/recurring‑plans` – list all recurring plans with status, next run date.
- `POST /projects/{projectId}/recurring‑plans` – create a recurring work plan. Body: `{ template_id, frequency_rule (iCal RRULE), is_active }`.
- `GET /projects/{projectId}/recurring‑plans/{planId}` – plan detail with generation history.
- `PATCH /projects/{projectId}/recurring‑plans/{planId}` – update frequency, active status, or linked template.
- `DELETE /projects/{projectId}/recurring‑plans/{planId}` – deactivate (soft delete).
- `GET /projects/{projectId}/recurring‑plans/{planId}/generation‑log` – paginated list of all generations (when, what tasks were created, status).
**Integration tests:** create plan, update frequency, list, deactivate.  
**DDD:** This is the PM Scheduler feature – recurring work owned by the Projects context, not Appointments (PROJ‑DOM‑006).

### Subtasks:
- [ ] API‑PROJ‑021.1: Add recurring plan endpoints to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑021.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑021.3: Implement `RecurringWorkPlanService` and repository. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑021.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑PROJ‑022: Recurring Work Generation Endpoint
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑021, API‑PROJ‑017.  
**Definition of Done:**
- `POST /projects/{projectId}/recurring‑plans/{planId}/generate` – manually triggers generation of the next set of tasks from the recurring plan.
- Automatic generation via scheduled job: when `next_run_date` ≤ today, generate tasks from the linked template blueprint, update `last_run_date` and `next_run_date` based on RRULE, and append generated task IDs to `generated_task_list_json`.
- Duplicate prevention: checks that the same template hasn't already generated tasks for the current period.
- Emits `RecurringWorkGenerated` domain event with list of created task IDs.
- Generation log entry created.
**Integration tests:** manual generation creates expected tasks; duplicate call on same period returns `RecurringWorkDuplicate` error; verify `next_run_date` advances correctly for weekly/monthly rules.  
**DDD:** Core PM Scheduler behaviour (PROJ‑DOM‑006).

### Subtasks:
- [ ] API‑PROJ‑022.1: Add generate endpoint to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑PROJ‑022.2: Write integration tests (red). (AGENT)  
  **verification:** Red.
- [ ] API‑PROJ‑022.3: Implement generation logic in `RecurringWorkPlanService`. (AGENT)  
  **verification:** Unit tests pass.
- [ ] API‑PROJ‑022.4: Create route, run tests to green. (AGENT)
- [ ] API‑PROJ‑022.5: Implement scheduled job for automatic generation (cron or background worker). (AGENT)  
  **verification:** Scheduled job runs and generates tasks correctly.

---

### [ ] API‑PROJ‑050: Projects Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑003, API‑PROJ‑007, API‑PROJ‑011, API‑PROJ‑013, API‑PROJ‑017, API‑PROJ‑021, DB‑SETTINGS‑002.  
**Definition of Done:** The following domain events are emitted and appear in `audit_logs` via the `AuditEventSubscriber`:
- `TaskCompleted` – on task status move to `done`
- `ProjectCompleted` – on project status transition to `completed`
- `MilestoneCompleted` – on milestone marked complete
- `MyWeekUpdated` – on planning changes
- `ProjectCreatedFromTemplate` – on template instantiation
- `RecurringWorkGenerated` – on recurring plan generation
- `TimeEntryApproved` – on time entry approval
Integration test verifies end‑to‑end: perform each action via API → query `audit_logs` → row with correct event name exists.

### Subtasks:
- [ ] API‑PROJ‑050.1: Verify all service methods emit the correct events (already implemented; verify). (AGENT)  
  **verification:** Unit tests for event emission pass.
- [ ] API‑PROJ‑050.2: Write integration test: complete task → check audit log for `TaskCompleted`. (AGENT)  
  **verification:** Green.
- [ ] API‑PROJ‑050.3: Write integration tests for remaining events. (AGENT)  
  **verification:** Green.
- [ ] API‑PROJ‑050.4: All integration tests green. (AGENT)

---

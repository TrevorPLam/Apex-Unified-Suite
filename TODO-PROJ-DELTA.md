# Project Management Delta Backlog

Purpose: capture the Project Management work required to deliver the intended PM product that is not already represented in `TODO-P0.md` through `TODO-P10.md` or other root-level TODO delta files.

Method used for de-duplication:

- Audited current PM implementation in `artifacts/apex-os/src/pages/Projects.tsx` and `artifacts/apex-os/src/data/mockData.ts`.
- Audited PM-related planning in `TODO-P0.md`, `TODO-P1.md`, `TODO-P2.md`, `TODO-P3.md`, `TODO-P4.md`, `TODO-P4b.md`, `TODO-P5.md`, `TODO-P6.md`, `TODO-P7.md`, `TODO-P8.md`, `TODO-P9.md`, and `TODO-P10.md`.
- Audited adjacent backlog patterns in `TODO-CRM-DELTA.md` to align naming, structure, and phase extension style.
- Audited architectural context in `AGENTS.md`, `ANALYSIS.md`, `FRAMEWORK.md`, and `docs/adr/005-api-versioning.md`.
- Cross-checked against the original PM intent in `attached_assets/Pasted-Build-ApexOS-a-unified-business-management-SaaS-with-a-_1777660655466.txt` and 2025-2026 Karbon public product material previously reviewed during PM assessment.

Already planned elsewhere and intentionally excluded from this file:

- Domain glossary, bounded context mapping, Projects feature-file work, error taxonomy, API versioning, and shared testing/tooling infrastructure.
- Core PM schema for projects, tasks, and milestones.
- Core PM CRUD APIs and first-pass service/repository work for projects, tasks, milestones, progress materialization, and domain events.
- Scheduler anti-corruption layer as currently defined: a read-only projection from the Appointments context into Projects.
- First-pass frontend data replacement for projects/tasks/milestones and first-pass mutation wiring.
- Dashboard aggregation work that already includes basic project metrics.
- Generic audit log, portal access, and analytics/reporting platform infrastructure.

Current confidence findings:

- The current Projects UI is still a mock shell. Only `My Week` and `Projects` render, and both are backed by static mock data.
- The current TODO files cover PM CRUD delivery, PM progress calculation, PM events, and first-pass frontend integration, but they do not cover the product-depth workflow experience promised by the PM brief.
- The largest uncovered areas are: personal work planning (`My Week`), a real Board/Queue experience, a full project workspace, PM templates, time-and-budget operations, PM-specific automation, and PM-specific administration/reporting.
- The largest design fork still unresolved is the meaning of `Scheduler`: the current roadmap redefines it as a read-only Appointments projection, while the original PM brief describes it as recurring work planning.

Planning rule for this delta file:

- Each task below is a missing feature-level task.
- Each task assumes the normal implementation stack for that feature: contract updates, schema/migration updates if needed, service/repository work, UI wiring, and tests.
- Phase names intentionally extend the existing roadmap without renumbering current files.
- If the product decision is to keep `Scheduler` as appointment read-only, the recurring-work tasks below should be replaced by a de-scope/rename task instead of implementation work.

## Phase 0.6 - PM Product Re-Baselining

- [ ] PROJ-SPEC-001: Re-baseline the PM product specification and feature file coverage.
  Reason: current PM feature coverage only describes create/status/progress behavior, while the intended product includes `My Week`, `Board`, full project drill-down, `Templates`, `Time & Budget`, and a `Scheduler` decision that is no longer aligned with the original brief.
  Outcome: updated PM acceptance criteria and feature scenarios covering personal planning, board workflow, project workspace depth, templates, and the final `Scheduler` product decision.

## Phase 2.6 - PM Domain Expansion

- [ ] PROJ-DOM-001: Add project ownership, participants, and visibility modeling.
  Reason: current PM schema covers project/task basics, but there is no model for project owner, project manager, member roster, or sharing scope needed for real team-based project delivery.
  Outcome: tenant-scoped project ownership and membership rules with queryable visibility metadata for projects and derived work views.

- [ ] PROJ-DOM-002: Add board ordering, queue, and workflow positioning metadata to work items.
  Reason: a real Board tab requires stable lane order, card position, and queue semantics, and none of that exists in the current schema or API backlog.
  Outcome: ordered work items with queue support, reordering metadata, and persistence for board/list/timeline views.

- [ ] PROJ-DOM-003: Add a user-scoped `My Week` planning model.
  Reason: `Focus`, `This Week`, and `Later` are personal planning buckets, not shared task status fields, and the current backlog has no persistence model for them.
  Outcome: per-user work-planning assignments, ordering, carry-forward behavior, and planning state separated cleanly from canonical task status.

- [ ] PROJ-DOM-004: Add work templates and template versioning.
  Reason: the product brief includes a real Templates tab and template builder, but there is no PM template aggregate in the roadmap.
  Outcome: reusable PM templates with task blueprints, version history, template metadata, and project-instantiation rules.

- [ ] PROJ-DOM-005: Add PM time estimates and time entry modeling.
  Reason: the intended project detail includes a `Time & Budget` tab, but no PM hours, estimates, or actuals model exists today.
  Outcome: estimated hours, actual time entries, rollups, burn tracking, and budget-consumption metadata linked to projects and tasks.

- [ ] PROJ-DOM-006: Add recurring work schedule modeling if `Scheduler` remains work-centric.
  Reason: the original PM brief describes recurring work planning with frequency and template selection, and no PM backlog item models this.
  Outcome: recurring work plans, next-run metadata, template linkage, generation history, and safeguards against duplicate generation.

## Phase 3.6 - PM Workflow APIs

- [ ] PROJ-API-001: Implement `My Week` planning APIs and service logic.
  Reason: first-pass PM CRUD does not expose personal planning behavior.
  Outcome: endpoints and services for planning work into `Focus`, `This Week`, and `Later`, including reorder, move, and carry-forward behavior.

- [ ] PROJ-API-002: Implement Board and Queue APIs.
  Reason: the current roadmap never schedules the real Board tab beyond generic project/task data hookup.
  Outcome: board payloads, lane movement, queue handling, ordered updates, and alternate list/timeline representations backed by real APIs.

- [ ] PROJ-API-003: Implement composite project workspace endpoints.
  Reason: CRUD endpoints for projects, tasks, and milestones are not enough to power a real drill-down workspace.
  Outcome: aggregate endpoints for `Tasks`, `Timeline`, `Time & Budget`, and `Details` with shaped payloads optimized for the project workspace.

- [ ] PROJ-API-004: Implement PM template management and template-application APIs.
  Reason: there is no contract today for creating, editing, versioning, previewing, or applying PM templates.
  Outcome: template CRUD, version retrieval, project creation from template, and dry-run previews of generated work.

- [ ] PROJ-API-005: Implement PM time-and-budget APIs.
  Reason: the planned finance budget APIs do not close the PM-side `Time & Budget` product experience.
  Outcome: estimate, actual, burn, and variance endpoints for project and task-level time/budget views.

- [ ] PROJ-API-006: Implement PM timeline and progress-report APIs.
  Reason: current PM events and audit logs are necessary but not sufficient to power a user-facing project activity timeline or client/shareable progress reporting.
  Outcome: timeline feeds, grouped progress summaries, milestone status reporting, and report-ready PM status endpoints.

- [ ] PROJ-API-007: Implement recurring work generation APIs and jobs if `Scheduler` remains work-centric.
  Reason: recurring work generation is not covered anywhere in the PM roadmap today.
  Outcome: recurring-plan execution, next-occurrence generation, generation logs, and protection against duplicate work creation.

## Phase 4.6 - PM Cross-Context Completion

- [ ] PROJ-X-001: Add PM-owned document and e-sign trigger flows.
  Reason: the platform plans generic document workflows, but the PM product still lacks project-native triggers such as generating SOW/checklist packets or signature packages from project state.
  Outcome: PM-to-Documents/E-Sign bridge flows with project context, linked artifacts, and PM-side status visibility.

- [ ] PROJ-X-002: Extend the portal with PM-specific client views.
  Reason: current portal planning includes accessible projects, but not the client-facing PM experience implied by the broader product vision.
  Outcome: client-visible tasks, milestones, status snapshots, and progress/report views driven by explicit PM permission rules.

- [ ] PROJ-X-003: Add PM-specific reporting services.
  Reason: generic analytics infrastructure exists, but the PM product still lacks dedicated workload, overdue work, template usage, and delivery-health reporting.
  Outcome: PM reporting endpoints and service calculations for operational PM dashboards and downstream analytics consumption.

## Phase 5.6 - PM UX Completion

- [ ] PROJ-UX-001: Build the real `My Week` experience.
  Reason: the current `My Week` screen is a mock distribution of three sample tasks and does not persist user planning.
  Outcome: drag-and-drop planning buckets, mini-calendar integration, saved ordering, and resilient loading/empty/error states.

- [ ] PROJ-UX-002: Build the real Board tab with Queue lane and alternate views.
  Reason: the current Board tab is a placeholder, and the current TODOs do not explicitly finish it.
  Outcome: Kanban board, queue lane, list/timeline toggle, lane summaries, reorder support, and mutation feedback.

- [ ] PROJ-UX-003: Replace the current slide-out with a route-backed full project workspace.
  Reason: the brief specifies a full-page drill-down, but the current implementation is a shallow side panel.
  Outcome: route-backed project workspace for `Tasks`, `Timeline`, `Time & Budget`, and `Details`, including navigation and state restoration.

- [ ] PROJ-UX-004: Build the PM Templates tab and visual template builder.
  Reason: the current Templates tab is entirely unimplemented, and no existing TODO completes that product surface.
  Outcome: template list, create/edit flows, visual task/rule builder, version browsing, and template-application UI.

- [ ] PROJ-UX-005: Build the `Time & Budget` UX.
  Reason: the project detail contract promises `Time & Budget`, but the current product and TODOs do not deliver the PM-side workspace.
  Outcome: estimate vs actual views, burn summaries, variance indicators, and linked task/project time operations.

- [ ] PROJ-UX-006: Add saved views, advanced filters, and bulk operations for PM worklists.
  Reason: current PM surfaces do not include the filtering, saved-view, or bulk-action depth expected of a real PM product.
  Outcome: saved PM views, advanced filters, bulk status/assignment operations, and reusable worklist presets.

## Phase 7.6 - PM Calendar And Planning Integrations

- [ ] PROJ-INT-001: Add work-planning calendar sync if `My Week` remains calendar-aware.
  Reason: current integration planning is appointment-centric, but the PM product vision includes planning work against a calendar.
  Outcome: sync or overlay capabilities for work blocks/planned work against connected calendars without collapsing PM ownership into the Appointments context.

## Phase 8.6 - PM Administration And Operations

- [ ] PROJ-ADMIN-001: Add PM settings for board lanes, work types, queue behavior, and template governance.
  Reason: the current roadmap assumes static PM workflow configuration.
  Outcome: admin-managed PM workflow settings, lane definitions, template governance rules, and default work-planning behavior.

- [ ] PROJ-ADMIN-002: Add PM ownership and visibility policies beyond coarse RBAC.
  Reason: platform RBAC exists, but PM still lacks domain-specific visibility and team-sharing rules.
  Outcome: project-level and work-item-level access policies, team visibility rules, and enforcement aligned with the PM model.

- [ ] PROJ-ADMIN-003: Add workload and capacity planning operations for PM work.
  Reason: current enterprise scheduling work is appointment-focused and does not close PM workload planning.
  Outcome: PM-specific capacity views, workload balancing, assignment pressure indicators, and operational planning surfaces.

## Phase 9.6 - PM Automation

- [ ] PROJ-AUTO-001: Implement PM milestone, due-date, and inactivity automations.
  Reason: the general automation roadmap is not enough to ship a usable PM operating model.
  Outcome: PM-triggered reminders, escalations, follow-up work creation, and notification rules tied to project state.

- [ ] PROJ-AUTO-002: Add prebuilt PM automation recipes and simulation mode.
  Reason: a generic automation builder still leaves the PM product without out-of-the-box workflows.
  Outcome: ready-made PM automations, dry-run previews, execution traces, and safer publication flows.

- [ ] PROJ-AUTO-003: Add recurring work generation automation if `Scheduler` remains work-centric.
  Reason: the PM brief expects recurring work operations, but no PM-specific automation currently covers them.
  Outcome: scheduled work generation, failure handling, duplicate suppression, and visibility into generated recurring work.

## Exit Criteria For PM Product Completion

The PM product should not be considered delivered until all of the following are true:

- `My Week`, `Board`, `Projects`, `Templates`, and the final `Scheduler` interpretation are all backed by real APIs and usable from the UI.
- Project work planning is persistent and user-specific where needed, not derived from mock task distribution.
- The Board tab supports real lane movement, ordering, queue behavior, and alternate list/timeline views.
- Projects open into a usable full-page workspace with `Tasks`, `Timeline`, `Time & Budget`, and `Details` backed by real data.
- PM templates exist end to end, including definition, versioning, application, and UI.
- Time, estimate, burn, and progress-report behavior exist end to end, not just project percent complete.
- PM-specific automation, reporting, and administrative controls are good enough to support the Karbon-inspired operating model described by the original PM brief.
- PM-specific tests exist for the missing workflows above, not just CRUD and progress materialization.

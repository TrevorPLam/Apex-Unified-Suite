# tasks/automation/AUTOMATION‑WORKFLOWS.md – Automation Workflows

This file covers all automated workflow tasks that span multiple bounded contexts: reminder sequences, follow‑up automation, cancellation rebooking, a visual workflow builder, CRM stage‑based automations, nurture sequences, renewal/re‑engagement automations, pre‑built CRM and PM recipes, recurring work generation, finance payment run scheduling, recurring invoice generation, collections escalation, and document lifecycle automations (retention enforcement, archiving, share link cleanup). These tasks are part of Phase 9 and build on the domain event bus and background job infrastructure.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Core Automation Workflows

### [ ] AUTO‑001: Automated Reminder Sequences
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No automated reminder system exists. Appointment reminders are manually sent (if at all). As of May 2026, platforms like Calendly and Acuity offer configurable reminder sequences per event type, multi‑channel delivery, and per‑event‑type templates.
**Size:** Large

**Description:** Implement an automated reminder engine that sends reminders for upcoming appointments based on per‑event‑type configurations. Reminders can be sent via email, SMS, or in‑app notification at configurable intervals (e.g., 24 hours, 1 hour before). Supports customisable templates per event type, client opt‑out preferences per channel, and escalation logic for unconfirmed appointments.

**Depends on:** `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`, `infrastructure/SECURITY.md → WS‑INFRA‑001`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑002`
**Related Files:** `artifacts/api‑server/src/services/automation/reminder‑service.ts`, `artifacts/api‑server/src/jobs/reminder‑scheduler.ts`, `artifacts/apex‑os/src/components/automation/ReminderConfig.tsx`

**Definition of Done**
- [ ] Reminder configuration per event type: admin defines reminder sequences with `offsetMinutes`, `channels` (email, sms, push), `templateId`
- [ ] Multiple reminders per event type (e.g., 24 hours before via email, 1 hour before via SMS)
- [ ] Active/inactive toggle per reminder
- [ ] On appointment creation or rescheduling, all future reminders are scheduled as BullMQ delayed jobs with idempotent job IDs
- [ ] On appointment cancellation, all pending reminders are removed from the queue
- [ ] Multi‑channel delivery: email via `EmailServicePort`, SMS via configurable adapter, in‑app via WebSocket (`emitToUser`)
- [ ] Per‑event‑type templates stored in event type configuration; template variables include `{clientName}`, `{appointmentTime}`, `{appointmentType}`, `{providerName}`, `{location}`, `{videoLink}`
- [ ] Client opt‑out per channel via token‑authenticated preference links; opt‑out is immediate
- [ ] Escalation: if an appointment remains `pending` after configurable time, escalate reminder to provider/admin
- [ ] Reminder delivery tracking: each sent reminder logged with `{ appointmentId, channel, sentAt, status, errorMessage }`
- [ ] Unit tests for reminder scheduling, cancellation, and delivery; component tests for `ReminderConfig`
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- All reminder times must be calculated in the appointment’s timezone, not server timezone
- `offsetMinutes` is relative to appointment `startTime` (negative = before)
- BullMQ delayed jobs must use `delay: computedDelayMs` with the computed delay from current time to reminder time
- Reminder jobs must check at execution time that the appointment still exists and is in a state where reminders are appropriate
- SMS delivery must include opt‑out instructions per TCPA requirements
- Rate limit: no more than 1 SMS per client per day across all appointments

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- reminder‑service
pnpm --filter @workspace/apex‑os test -- ReminderConfig.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Reminders are application‑level automation within the Appointments bounded context. They are scheduled commands triggered by domain events.
- TDD: Write tests for reminder scheduling on appointment creation, reminder cancellation on appointment deletion, and opt‑out enforcement.
- BDD: “As a service provider, my clients automatically receive a reminder email 24 hours before their appointment and an SMS 1 hour before, using templates I configured per service type.”
- Deep Module: `ReminderService.schedule(appointmentId)` hides delayed job scheduling, opt‑out checking, and template resolution.

---

### Subtasks
- [ ] AUTO‑001.0.25 (AGENT): Read the existing appointment schema, BullMQ infrastructure, and email service interface. *No action – pause.*
- [ ] AUTO‑001.0.5 (AGENT): Research Calendly/Acuity reminder configuration patterns, TCPA SMS compliance, and BullMQ delayed job best practices. *Document findings briefly.*
- [ ] AUTO‑001.1 (AGENT): Define `reminder_config` on event types (JSONB) and `reminder_delivery_log` schema.
  **File(s):** `lib/db/src/schema/appointments/reminders.ts`
  **Verification:** `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] AUTO‑001.2 (AGENT): Implement `ReminderService` with scheduling, cancellation, and opt‑out enforcement.
  **File(s):** `artifacts/api‑server/src/services/automation/reminder‑service.ts`
  **Verification:** Unit tests pass.
- [ ] AUTO‑001.3 (AGENT): Implement `ReminderScheduler` background job.
  **File(s):** `artifacts/api‑server/src/jobs/reminder‑scheduler.ts`
  **Verification:** Jobs created on appointment creation; removed on cancellation.
- [ ] AUTO‑001.4 (AGENT): Implement multi‑channel delivery.
  **Verification:** Email reminders sent; SMS and push stubbed.
- [ ] AUTO‑001.5 (AGENT): Build `ReminderConfig` UI component.
  **File(s):** `artifacts/apex‑os/src/components/automation/ReminderConfig.tsx`
  **Verification:** Component tests pass.
- [ ] AUTO‑001.6 (AGENT): Run `pnpm run typecheck` and fix any type errors.
- [ ] AUTO‑001.N (HUMAN): Final review – verify reminders sent at correct times. **Verification:** Approved.

---

### [ ] AUTO‑002: Follow‑up Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No automated post‑appointment follow‑up exists.
**Size:** Medium

**Description:** Implement post‑appointment follow‑up automation: send a thank‑you email with a feedback survey link, prompt the client to book their next appointment, and notify the provider if the client hasn’t re‑booked within a configurable window. All follow‑ups are per‑event‑type configurable.

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑003`
**Related Files:** `artifacts/api‑server/src/services/automation/followup‑service.ts`, `artifacts/apex‑os/src/components/automation/FollowupConfig.tsx`

**Definition of Done**
- [ ] Per‑event‑type configuration: thank‑you email (offset after appointment end), feedback survey link, re‑booking prompt after configurable delay
- [ ] On `AppointmentCompleted` domain event, schedule follow‑up jobs
- [ ] Feedback collection: responses stored and linked to the appointment
- [ ] Re‑booking tracking: tracks whether the client books another appointment within the window
- [ ] Delivery tracking: all follow‑up emails logged
- [ ] Unit tests for follow‑up scheduling; component tests for `FollowupConfig`
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- followup‑service
pnpm --filter @workspace/apex‑os test -- FollowupConfig.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Follow‑ups are application‑level automation in the Appointments context.
- TDD: Write tests for follow‑up scheduling on `AppointmentCompleted` and re‑booking prompt logic.
- BDD: “After each appointment my client receives a thank‑you email with a feedback survey, and if they haven’t re‑booked in 30 days, they get a gentle reminder.”

---

### Subtasks
- [ ] AUTO‑002.0.25 (AGENT): Read AUTO‑001 reminder service and existing appointment event system. *No action – pause.*
- [ ] AUTO‑002.1 (AGENT): Implement `FollowupService`. **File:** `followup‑service.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑002.2 (AGENT): Build `FollowupConfig` UI. **Verification:** Component tests pass.
- [ ] AUTO‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑003: Cancellation Rebooking
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** When an appointment is cancelled, the slot is released but no automated rebooking or waitlist management occurs.
**Size:** Medium

**Description:** Implement automated waitlist filling: when an appointment is cancelled, the system checks the waitlist for matching entries, books the first eligible client, notifies the newly booked client, and emits a `WaitlistBookingCreated` event. Also supports cancellation pattern analysis and proactive waitlist offers.

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑002`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`, `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑014`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑004`
**Related Files:** `artifacts/api‑server/src/services/automation/rebooking‑service.ts`

**Definition of Done**
- [ ] On `AppointmentCancelled` event, queries waitlist for matching entries (FIFO or priority score)
- [ ] Books the first eligible client via `BookingService`; updates waitlist entry status to `booked`
- [ ] Notifies newly booked client via email; emits `WaitlistBookingCreated` event
- [ ] Duplicate prevention: `INSERT … ON CONFLICT DO NOTHING`
- [ ] Cancellation pattern analysis: periodic job that analyses cancellation rates and flags high‑risk appointments
- [ ] Proactive waitlist offers for high‑risk slots
- [ ] Unit tests for automatic filling, conflict resolution, and pattern analysis
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- rebooking‑service
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Rebooking is a domain service coordinating between `Appointment` and `WaitlistEntry` aggregates.
- TDD: Write tests for cancellation → automatic booking, duplicate prevention, and pattern analysis.
- BDD: “When a client cancels their appointment, the first person on my waitlist is automatically booked and notified.”

---

### Subtasks
- [ ] AUTO‑003.0.25 (AGENT): Read waitlist service and booking service APIs. *No action – pause.*
- [ ] AUTO‑003.1 (AGENT): Implement `RebookingService`. **File:** `rebooking‑service.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑003.2 (AGENT): Implement cancellation pattern analysis. **Verification:** Patterns detected.
- [ ] AUTO‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑004: Workflow Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No general‑purpose automation workflow builder exists. Automations are individually implemented services.
**Size:** Large

**Description:** Build a visual workflow builder for creating custom automations: define triggers (appointment created, cancelled, payment received), add conditions (if appointment type is X, if payment amount > Y), and define actions (send email, SMS, webhook, create task, update CRM). Workflows are event‑driven, can be tested with dry‑run mode, and are published as active automations.

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑003`, `crm/CRM‑LEADS.md → API‑CRM‑005`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/workflow‑engine.ts`, `artifacts/apex‑os/src/components/automation/WorkflowBuilder.tsx`

**Definition of Done**
- [ ] Trigger library: predefined triggers for all domain events (`AppointmentCreated`, `PaymentReceived`, `LeadStageChanged`, etc.)
- [ ] Action library: Send Email, Send SMS, Create Task, Update CRM Field, Send Webhook, Add to Nurture Sequence, Assign to Team
- [ ] Condition builder: visual AND/OR logic on event data fields
- [ ] Workflow canvas: drag‑and‑drop editor connecting triggers → conditions → actions
- [ ] Dry‑run mode: simulate with sample data; shows what actions would execute
- [ ] Execution logging: each workflow execution logged with trigger, conditions, actions, and results
- [ ] Workflow templates: pre‑built templates for common scenarios
- [ ] Unit tests for engine execution, condition evaluation, template instantiation; component tests for builder
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- workflow‑engine
pnpm --filter @workspace/apex‑os test -- WorkflowBuilder.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Workflow builder is an application‑level automation engine orchestrating across bounded contexts via domain events.
- TDD: Write tests for each action type and condition evaluation.
- BDD: “As a power user, I can build a custom automation that sends a welcome email when a new lead is created.”

---

### Subtasks
- [ ] AUTO‑004.0.25 (AGENT): Read EVENT‑001 and existing domain event types. *No action – pause.*
- [ ] AUTO‑004.1 (AGENT): Implement `WorkflowEngine` with trigger matching, condition evaluator, and action dispatcher.
  **File(s):** `artifacts/api‑server/src/services/automation/workflow‑engine.ts`
  **Verification:** Unit tests pass.
- [ ] AUTO‑004.2 (AGENT): Build visual `WorkflowBuilder` component with drag‑and‑drop canvas.
  **File(s):** `artifacts/apex‑os/src/components/automation/WorkflowBuilder.tsx`
  **Verification:** Component tests pass.
- [ ] AUTO‑004.3 (HUMAN): Final review – create and execute a simple workflow. **Verification:** Approved.

---

## CRM Automation

### [ ] AUTO‑CRM‑001: Stage‑Based Follow‑Up Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** CRM pipeline stages are manually advanced with no automated follow‑up task creation.
**Size:** Large

**Description:** Implement a rules engine that triggers automated follow‑up actions based on CRM pipeline stage changes: when a lead enters a stage, automatically create a follow‑up task, send an email template, and/or update CRM fields. Inactivity detection triggers re‑engagement tasks. All rules are configurable per pipeline stage.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑005`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑024`, `crm/CRM‑EMAIL‑TRACKING.md → API‑CRM‑030`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑002`
**Related Files:** `artifacts/api‑server/src/services/automation/crm/stage‑automation‑service.ts`, `artifacts/apex‑os/src/components/automation/crm/StageRuleConfig.tsx`

**Definition of Done**
- [ ] Rule engine: admin defines per‑stage rules with conditions and actions (Create Task, Send Email, Update Field, Enroll in Nurture, Assign Owner, Add Tag)
- [ ] Rules fire on `LeadStageChanged` and `DealStageChanged` domain events; multiple actions per rule
- [ ] Inactivity detection: daily job scans for leads/contacts/deals with no activity for configurable days; triggers re‑engagement actions
- [ ] Execution logging: every automation action logged
- [ ] Rule management UI: create, edit, enable/disable, reorder rules; preview mode
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- stage‑automation‑service
pnpm --filter @workspace/apex‑os test -- StageRuleConfig.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑CRM‑001.0.25 (AGENT): Read CRM stage data models and event types. *No action – pause.*
- [ ] AUTO‑CRM‑001.1 (AGENT): Implement `StageAutomationService` and `InactivityDetectionService`.
  **File(s):** `stage‑automation‑service.ts`
  **Verification:** Unit tests pass.
- [ ] AUTO‑CRM‑001.2 (AGENT): Build `StageRuleConfig` UI. **Verification:** Component tests pass.
- [ ] AUTO‑CRM‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑CRM‑002: Nurture Sequences
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No nurture sequence capability exists.
**Size:** Large

**Description:** Implement a nurture sequence engine: create multi‑step sequences, enroll contacts manually or via automation, track step completion, and handle pause/exit triggers (e.g., contact replied, unsubscribed, or converted).

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑001`, `crm/CRM‑EMAIL‑TRACKING.md → API‑CRM‑030`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑004`
**Related Files:** `artifacts/api‑server/src/services/automation/crm/nurture‑sequence‑service.ts`, `artifacts/apex‑os/src/components/automation/crm/SequenceBuilder.tsx`

**Definition of Done**
- [ ] Sequence CRUD: each sequence has steps (`offsetDays`, `actionType`, `templateId`, `taskConfig`)
- [ ] Enrollment: manual or automated; duplicate enrollment prevention
- [ ] Execution: daily job processes active enrollments; advances to next step or completes
- [ ] Pause/exit triggers: reply, conversion, unsubscribe; engagement tracking (opens, clicks)
- [ ] Sequence analytics: enrollment count, completion rate, drop‑off
- [ ] UI: visual sequence timeline builder
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- nurture‑sequence‑service
pnpm --filter @workspace/apex‑os test -- SequenceBuilder.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑CRM‑002.0.25 (AGENT): Read AUTO‑CRM‑001 and CRM email templates. *No action – pause.*
- [ ] AUTO‑CRM‑002.1 (AGENT): Implement `NurtureSequenceService`. **File:** `nurture‑sequence‑service.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑CRM‑002.2 (AGENT): Build `SequenceBuilder` UI. **Verification:** Component tests pass.
- [ ] AUTO‑CRM‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑CRM‑003: Renewal & Re‑Engagement Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No automated renewal or re‑engagement tracking exists.
**Size:** Medium

**Description:** Automate contract/deal renewal reminders, renewal chase sequences, lapse detection, and dormancy detection (inactivity triggers re‑engagement sequence).

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑001`, `crm/CRM‑DEALS.md → API‑CRM‑033`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑004`
**Related Files:** `artifacts/api‑server/src/services/automation/crm/renewal‑automation‑service.ts`

**Definition of Done**
- [ ] Renewal reminders X days before deal `closeDate` or contract `endDate`
- [ ] Renewal chase sequence: escalating urgency if not actioned
- [ ] Lapse detection: daily job marks deals past end date as `lapsed`; triggers win‑back sequence
- [ ] Dormancy detection: daily job identifies contacts with no activity for X days; enrolls in re‑engagement
- [ ] All actions logged as CRM activities
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- renewal‑automation‑service
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑CRM‑003.0.25 (AGENT): Read CRM deal and contact data models. *No action – pause.*
- [ ] AUTO‑CRM‑003.1 (AGENT): Implement `RenewalAutomationService`. **File:** `renewal‑automation‑service.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑CRM‑003.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑CRM‑004: Pre‑Built CRM Recipes & Simulation Mode
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No pre‑built automation recipes or simulation/testing mode exists.
**Size:** Medium

**Description:** Build a library of pre‑built CRM automation recipes (e.g., “New Lead Welcome”, “Deal Won Follow‑up”, “Cold Lead Re‑engagement”) that can be installed with one click and customised. Implement a simulation/dry‑run mode with execution preview timeline.

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑CRM‑001`, `AUTO‑CRM‑002`, `AUTO‑CRM‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/crm/recipe‑library‑service.ts`, `artifacts/apex‑os/src/components/automation/crm/RecipeLibrary.tsx`

**Definition of Done**
- [ ] Library of at least 6 pre‑built recipes covering common CRM workflows
- [ ] One‑click installation creates all underlying rules/sequences/workflows automatically
- [ ] Customisation: after installation, parameters are editable
- [ ] Simulation mode: select a recipe, apply to existing records in dry‑run; shows what actions would trigger
- [ ] Execution preview timeline: visual timeline of actions over time
- [ ] Publish/pause/unpublish lifecycle per recipe
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- recipe‑library‑service
pnpm --filter @workspace/apex‑os test -- RecipeLibrary.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑CRM‑004.0.25 (AGENT): Read all CRM automation services. *No action – pause.*
- [ ] AUTO‑CRM‑004.1 (AGENT): Implement `RecipeLibraryService` and `SimulationService`.
  **File:** `recipe‑library‑service.ts`
  **Verification:** Unit tests pass.
- [ ] AUTO‑CRM‑004.2 (AGENT): Build `RecipeLibrary` UI. **Verification:** Component tests pass.
- [ ] AUTO‑CRM‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Projects Automation

### [ ] AUTO‑PROJ‑001: PM Milestone, Due‑Date & Inactivity Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No automated PM notifications exist. Milestone overdue detection and task inactivity alerts are manual.
**Size:** Large

**Description:** Implement project management automation: milestone due‑date reminders, overdue escalation, stalled project detection, and inactive task reminders. All notifications delivered via in‑app and email, logged as project activity.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑012`, `API‑PROJ‑008`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001`
**Blocks:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑PROJ‑002`
**Related Files:** `artifacts/api‑server/src/services/automation/projects/deadline‑automation‑service.ts`

**Definition of Done**
- [ ] Milestone due‑date reminders: N days before due, notify owner via email and in‑app
- [ ] Overdue escalation: daily job; Day 1 notify assignee, Day 2‑3 notify PM, Day 4+ escalate to department head
- [ ] Stalled project detection: daily job identifies projects with no activity for configurable period; flags as stalled
- [ ] Inactive task reminder: tasks untouched for X days trigger reminder to assignee
- [ ] All notifications logged as project activity with source “automation”
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- deadline‑automation‑service
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑PROJ‑001.0.25 (AGENT): Read Projects milestone and task schemas. *No action – pause.*
- [ ] AUTO‑PROJ‑001.1 (AGENT): Implement `DeadlineAutomationService` and `StalledProjectDetectionService`.
  **File:** `deadline‑automation‑service.ts`
  **Verification:** Unit tests pass.
- [ ] AUTO‑PROJ‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑PROJ‑002: Pre‑Built PM Automation Recipes & Simulation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No pre‑built PM automation recipes exist.
**Size:** Medium

**Description:** Build a library of pre‑built PM automation recipes (e.g., “New Project Setup”, “Sprint Review Reminder”, “Overdue Task Escalation”) with one‑click installation, customisation, and simulation mode. Publish/pause/unpublish lifecycle.

**Depends on:** `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑PROJ‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/projects/recipe‑library‑service.ts`, `artifacts/apex‑os/src/components/automation/projects/RecipeLibrary.tsx`

**Definition of Done**
- [ ] Library of at least 5 pre‑built PM recipes
- [ ] One‑click installation, customisation, simulation, publish/pause/unpublish
- [ ] Execution preview timeline per recipe
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- pm‑recipe‑library‑service
pnpm --filter @workspace/apex‑os test -- PMRecipeLibrary.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑PROJ‑002.0.25 (AGENT): Read AUTO‑PROJ‑001 and CRM‑004 patterns. *No action – pause.*
- [ ] AUTO‑PROJ‑002.1 (AGENT): Implement PM recipe library and simulation. **Verification:** Unit tests pass.
- [ ] AUTO‑PROJ‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑PROJ‑003: Recurring Work Generation Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Recurring work plans exist but generation must be triggered manually.
**Size:** Medium

**Description:** Implement a scheduled background job that automatically processes all active recurring work plans daily, generates tasks from their linked blueprint templates, and prevents duplicate generation.

**Depends on:** `projects/PROJECTS‑CORE.md → API‑PROJ‑022`, `AUTO‑PROJ‑001`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/projects/recurring‑work‑scheduler.ts`

**Definition of Done**
- [ ] Daily job checks all active plans where `next_run_date ≤ today`
- [ ] Generates tasks from blueprint; updates `last_run_date` and `next_run_date`
- [ ] Duplicate prevention: checks that tasks for the current period haven’t already been created
- [ ] Logs generation; notifies plan owner; retry with 3 attempts on failure
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- recurring‑work‑scheduler
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑PROJ‑003.0.25 (AGENT): Read recurring work plan schema and generation API. *No action – pause.*
- [ ] AUTO‑PROJ‑003.1 (AGENT): Implement `RecurringWorkScheduler`. **File:** `recurring‑work‑scheduler.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑PROJ‑003.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Finance Automation

### [ ] AUTO‑FIN‑001: Automated Payment Run Scheduling
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Payment runs are created manually.
**Size:** Large

**Description:** Implement scheduled payment run creation: configure a schedule, automatically create draft payment runs containing approved unpaid bills, notify the finance team for review, and execute after approval.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑018`, `finance/FINANCE‑BILLS‑APPROVALS.md → API‑AP‑008`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/finance/payment‑run‑scheduler.ts`

**Definition of Done**
- [ ] Schedule configuration: `{ name, frequency, bankAccountId, billSelectionRules, autoExecute }`
- [ ] On schedule trigger: creates a draft payment run with all matching bills
- [ ] Notification: email to finance team with summary and review link
- [ ] If `autoExecute: true` and all bills valid, automatically execute the payment run
- [ ] Schedule management: pause/resume, view history
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- payment‑run‑scheduler
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑FIN‑001.0.25 (AGENT): Read payment run API and bill status model. *No action – pause.*
- [ ] AUTO‑FIN‑001.1 (AGENT): Implement `PaymentRunScheduler`. **File:** `payment‑run‑scheduler.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑FIN‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑FIN‑002: Recurring Invoice Generation Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Recurring invoices are generated manually from templates.
**Size:** Medium

**Description:** Implement a scheduled background job that processes active recurring invoice templates daily, generates AR invoices, updates the template’s schedule, and prevents duplicate generation. Supports auto‑send.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑AR‑010`, `API‑AR‑008`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/finance/recurring‑invoice‑generator.ts`

**Definition of Done**
- [ ] Daily job checks all active templates where `next_invoice_date ≤ today`
- [ ] Generates invoice from template; creates as `draft` (or `sent` if `auto_send`)
- [ ] Updates `next_invoice_date` based on template frequency; duplicate prevention
- [ ] Error handling: logs failures and notifies finance team; continues with other templates
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- recurring‑invoice‑generator
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑FIN‑002.0.25 (AGENT): Read recurring invoice template and invoice schemas. *No action – pause.*
- [ ] AUTO‑FIN‑002.1 (AGENT): Implement `RecurringInvoiceGenerator`. **File:** `recurring‑invoice‑generator.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑FIN‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑FIN‑003: Collections Escalation Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Collections is entirely manual.
**Size:** Medium

**Description:** Implement rule‑based collections escalation: configure escalation rules based on days overdue and reminder history. Multiple escalation levels with specific actions. Escalation can be paused per customer.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑FIN‑022`, `API‑AR‑008`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/finance/collections‑escalation‑service.ts`

**Definition of Done**
- [ ] Escalation rule configuration: per level `{ daysOverdue, reminderCount, actions: [{ type: 'assignCollector' | 'notifyManager' | … }] }`
- [ ] Daily job evaluates all overdue invoices; applies rules; advances escalation level
- [ ] Escalation actions: assign collector, create follow‑up task, send notification
- [ ] Pause escalation per customer; escalation history logged
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- collections‑escalation‑service
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑FIN‑003.0.25 (AGENT): Read collections activity API and invoice schema. *No action – pause.*
- [ ] AUTO‑FIN‑003.1 (AGENT): Implement `CollectionsEscalationService`. **File:** `collections‑escalation‑service.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑FIN‑003.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Document Automation

### [ ] AUTO‑DOCS‑001: Document Retention Enforcement Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Retention policies exist but enforcement is manual.
**Size:** Medium

**Description:** Implement a scheduled job that enforces document retention policies daily: identifies expired files, soft‑deletes them, respects compliance holds, enforces policy inheritance, sends summary notification after enforcement, and supports a grace period before permanent deletion.

**Depends on:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑005`, `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑014`, `DOC‑STORAGE‑001`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/documents/retention‑enforcer.ts`

**Definition of Done**
- [ ] Daily job identifies files where `uploadDate + delete_after_days ≤ today` under active policies
- [ ] Soft‑deletes documents; moves to trash in R2; skips files under compliance hold
- [ ] Walks folder tree with policy inheritance
- [ ] Grace period: soft‑deleted files recoverable for N days; permanent deletion after grace period
- [ ] Summary notification to owners/admins after enforcement
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- retention‑enforcer
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑DOCS‑001.0.25 (AGENT): Read retention policy service and storage adapter. *No action – pause.*
- [ ] AUTO‑DOCS‑001.1 (AGENT): Implement `RetentionEnforcer`. **File:** `retention‑enforcer.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑DOCS‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑DOCS‑002: Automated Document Archiving
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Archiving is manual.
**Size:** Medium

**Description:** Implement automated archival of idle documents and completed project/deal documents based on configurable rules, with pre‑archive notification and archival logging.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑008`, `API‑DOCS‑004`, `automation/AUTOMATION‑WORKFLOWS.md → AUTO‑PROJ‑001`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/documents/archive‑engine.ts`

**Definition of Done**
- [ ] Idle‑time archival: daily job moves documents with no activity for configurable days to archive folder
- [ ] Event‑driven archival: on `ProjectCompleted`/`DealClosed`, archives all linked documents
- [ ] Pre‑archive notification: N days before archival, notify owner
- [ ] Archive folder: documents viewable but excluded from default search
- [ ] Archival log; unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- archive‑engine
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑DOCS‑002.0.25 (AGENT): Read document and project schemas. *No action – pause.*
- [ ] AUTO‑DOCS‑002.1 (AGENT): Implement `ArchiveEngine`. **File:** `archive‑engine.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑DOCS‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTO‑DOCS‑003: Share Link Expiry Cleanup
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Share links expire but cleanup is not automated.
**Size:** Small

**Description:** Implement a background job that identifies expired share links, deactivates them, cleans up access logs after a grace period, sends summary notification to the link creator, and optionally auto‑extends links configured for it.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑013`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/automation/documents/link‑cleanup‑job.ts`

**Definition of Done**
- [ ] Daily job identifies expired share links and deactivates them (sets status to `expired`)
- [ ] Cleans up access logs older than configurable grace period (default 30 days after expiry)
- [ ] Sends summary email to link creators
- [ ] Auto‑extension: optional extension by N days up to a max extension count
- [ ] Expiry log tracks all actions
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- link‑cleanup‑job
pnpm run typecheck
```

---

### Subtasks
- [ ] AUTO‑DOCS‑003.0.25 (AGENT): Read share link service and schema. *No action – pause.*
- [ ] AUTO‑DOCS‑003.1 (AGENT): Implement `LinkCleanupJob`. **File:** `link‑cleanup‑job.ts` **Verification:** Unit tests pass.
- [ ] AUTO‑DOCS‑003.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
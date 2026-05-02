# TODO-P9-AUTOMATION.md – Phase 9: Automation Workflows

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This updated Phase 9 includes the original Automation Workflows, CRM automation tasks merged from the CRM Delta, Projects automation tasks from the Projects Delta, Finance automation tasks from the Bill.com research, and Document automation tasks from the ShareFile research.

---

## Phase 9 Automation Task Index

**Core Automation Workflows**
- [ ] AUTO‑001 – Automated Reminder Sequences (extended for per‑event‑type)
- [ ] AUTO‑002 – Follow‑up Automation
- [ ] AUTO‑003 – Cancellation Rebooking
- [ ] AUTO‑004 – Workflow Builder

**CRM Automation (from CRM Delta)**
- [ ] AUTO‑CRM‑001 – Stage‑Based Follow‑Up Automation
- [ ] AUTO‑CRM‑002 – Nurture Sequences
- [ ] AUTO‑CRM‑003 – Renewal & Re‑Engagement Automation
- [ ] AUTO‑CRM‑004 – Pre‑Built CRM Recipes & Simulation Mode

**Projects Automation (from Projects Delta)**
- [ ] AUTO‑PROJ‑001 – PM Milestone, Due‑Date & Inactivity Automation
- [ ] AUTO‑PROJ‑002 – Pre‑Built PM Automation Recipes & Simulation
- [ ] AUTO‑PROJ‑003 – Recurring Work Generation Automation

**Finance Automation (Bill.com depth)**
- [ ] AUTO‑FIN‑001 – Automated Payment Run Scheduling
- [ ] AUTO‑FIN‑002 – Recurring Invoice Generation Automation
- [ ] AUTO‑FIN‑003 – Collections Escalation Automation

**Document Automation (ShareFile depth)**
- [ ] AUTO‑DOCS‑001 – Document Retention Enforcement Automation
- [ ] AUTO‑DOCS‑002 – Automated Document Archiving
- [ ] AUTO‑DOCS‑003 – Share Link Expiry Cleanup

---

## Automation Workflows

### [ ] AUTO‑001: Automated Reminder Sequences (Extended for Per‑Event‑Type)
**Status:** ⏳ Not Started  
**Depends on:** MOBILE‑003, EMAIL‑SERVICE‑001.  
**Definition of Done:**
- Automated reminder sequences for appointments.
- Customisable reminder timing and content **per event type** (e.g., a 15‑min consultation gets a reminder 1 hour before; a 60‑min workshop gets reminders 24 hours and 1 hour before).
- Multi‑channel reminders (email, SMS, push notifications) **selectable per event type**.
- Reminder escalation and follow‑up workflows.
- Client preference management for reminders (opt‑out per channel).
- Per‑event‑type reminder templates stored in the event type configuration.

**DDD:** Reminder engine within the Appointments bounded context; per‑event‑type configuration (Calendly requirement).  
**TDD:** Unit test verifying that different event types trigger different reminder sequences based on configuration.  
**BDD:** "As a service provider, my clients get reminders tailored to the type of appointment they booked."

**Subtasks:**
- [ ] AUTO‑001.1: Implement reminder sequence engine with per‑event‑type configuration support. (AGENT) – `automation/reminders/ReminderEngine.ts`  
  **verification:** Reminder sequences respect per‑event‑type timing and channel settings.
- [ ] AUTO‑001.2: Add customisable reminder templates per event type. (AGENT) – `automation/reminders/Templates.ts`  
  **verification:** Templates can be customised per event type; variable substitution works.
- [ ] AUTO‑001.3: Implement multi‑channel reminders (email, SMS, push) with per‑event‑type channel selection. (AGENT) – `automation/reminders/MultiChannel.ts`  
  **verification:** Reminders work across all channels; channel selection per event type is respected.
- [ ] AUTO‑001.4: Add reminder escalation logic. (AGENT) – `automation/reminders/Escalation.ts`  
  **verification:** Escalation works appropriately when no response received.
- [ ] AUTO‑001.5: Build client preference management for reminder opt‑out per channel. (AGENT)  
  **verification:** Clients can opt out of SMS reminders but keep email; preferences respected.
- **Depends on:** MOBILE‑003.
- **Blocks:** AUTO‑002.

### [ ] AUTO‑002: Follow‑up Automation
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑001, EMAIL‑SERVICE‑001.  
**Definition of Done:**
- Automated post‑appointment follow‑up workflows.
- Feedback collection and survey automation.
- Next appointment scheduling suggestions.
- Client relationship management automation.
- Follow‑up analytics and optimisation.

**Subtasks:**
- [ ] AUTO‑002.1: Implement follow‑up workflow engine. (AGENT) – `automation/followup/FollowupEngine.ts`  
  **verification:** Follow‑up workflows execute correctly.
- [ ] AUTO‑002.2: Add feedback collection automation. (AGENT) – `automation/followup/FeedbackCollection.ts`  
  **verification:** Feedback is collected automatically.
- [ ] AUTO‑002.3: Implement next appointment suggestions. (AGENT) – `automation/followup/NextAppointment.ts`  
  **verification:** Suggestions are relevant and helpful.
- [ ] AUTO‑002.4: Add follow‑up analytics. (AGENT) – `automation/followup/Analytics.ts`  
  **verification:** Analytics provide actionable insights.
- **Depends on:** AUTO‑001.
- **Blocks:** AUTO‑003.

### [ ] AUTO‑003: Cancellation Rebooking
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑002, API‑APPT‑010.  
**Definition of Done:**
- Automated rebooking workflows for cancelled appointments.
- Waitlist management and automatic booking.
- Cancellation pattern analysis and prevention.
- Provider availability optimisation for rebooking.
- Client communication during rebooking process.

**Subtasks:**
- [ ] AUTO‑003.1: Implement rebooking workflow engine. (AGENT) – `automation/rebooking/RebookingEngine.ts`  
  **verification:** Rebooking workflows work smoothly.
- [ ] AUTO‑003.2: Add waitlist management system. (AGENT) – `automation/rebooking/WaitlistManager.ts`  
  **verification:** Waitlist operates efficiently.
- [ ] AUTO‑003.3: Implement cancellation pattern analysis. (AGENT) – `automation/rebooking/PatternAnalysis.ts`  
  **verification:** Patterns are analysed accurately.
- [ ] AUTO‑003.4: Add rebooking communication system. (AGENT) – `automation/rebooking/Communication.ts`  
  **verification:** Communication is timely and helpful.
- **Depends on:** AUTO‑002.
- **Blocks:** AUTO‑004.

### [ ] AUTO‑004: Workflow Builder
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑003, FRONT‑APPT‑006.  
**Definition of Done:**
- Visual workflow builder for custom automation.
- Pre‑built workflow templates for common scenarios.
- Workflow testing and debugging tools.
- Workflow performance monitoring and optimisation.
- Integration with external automation services.

**Subtasks:**
- [ ] AUTO‑004.1: Implement visual workflow builder. (AGENT) – `src/components/automation/WorkflowBuilder.tsx`  
  **verification:** Workflow builder is intuitive and powerful.
- [ ] AUTO‑004.2: Add pre‑built workflow templates. (AGENT) – `src/components/automation/WorkflowTemplates.tsx`  
  **verification:** Templates cover common use cases.
- [ ] AUTO‑004.3: Implement workflow testing tools. (AGENT) – `src/components/automation/WorkflowTester.tsx`  
  **verification:** Testing tools are comprehensive.
- [ ] AUTO‑004.4: Add workflow performance monitoring. (AGENT) – `src/components/automation/WorkflowMonitor.tsx`  
  **verification:** Performance is monitored effectively.
- **Depends on:** AUTO‑003.
- **Blocks:** UX‑001.

---

## CRM Automation (from CRM Delta)

### [ ] AUTO‑CRM‑001: Stage‑Based Follow‑Up Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads API), API‑CRM‑024 (CRM follow‑up tasks API).  
**Definition of Done:** Rules engine that automates CRM follow‑up actions based on pipeline stage changes and inactivity:
- When a lead enters a specific stage (e.g., "contacted"), automatically create a follow‑up task with a due date (e.g., 3 days later) and assign it to the owner.
- When a deal stage changes to "negotiation", create a reminder for the assigned rep to send a proposal.
- When a contact has no activity for a configurable number of days, create an alert task or send a re‑engagement email template.
- Configurable rules per pipeline stage: define what actions trigger, what tasks are created, and which email templates are sent.
- Rule management interface: create, edit, enable/disable, and reorder rules.
- Activity logging for all automated actions.

**DDD:** CRM automation within the CRM bounded context; stage machine triggers automated follow‑up (ActiveCampaign‑inspired).  
**TDD:** Unit test verifying that moving a lead to "contacted" stage triggers task creation with correct due date and assignee.  
**BDD:** "As a sales rep, follow‑up tasks are automatically created when I move a lead to a new stage."

**Subtasks:**
- [ ] AUTO‑CRM‑001.1: Implement stage‑based automation rules engine. (AGENT) – `automation/crm/stage‑automation‑engine.ts`  
  **verification:** Engine evaluates rules on stage change and creates appropriate tasks.
- [ ] AUTO‑CRM‑001.2: Build rule configuration interface (create, edit, enable/disable, reorder). (AGENT) – `src/components/automation/crm/StageRuleConfig.tsx`  
  **verification:** Rules can be created and managed; changes take effect immediately.
- [ ] AUTO‑CRM‑001.3: Integrate with CRM follow‑up task service for automatic task creation. (AGENT)  
  **verification:** Tasks appear in CRM task list with correct entity linking.
- [ ] AUTO‑CRM‑001.4: Wire inactivity detection (cron job or event‑driven) for stale records. (AGENT)  
  **verification:** Contacts with no activity for X days trigger re‑engagement tasks.
- [ ] AUTO‑CRM‑001.5: Write integration tests for stage‑change and inactivity automations. (AGENT)  
  **verification:** Tests pass; all automated actions logged in activity timeline.
- **Depends on:** API‑CRM‑005, API‑CRM‑024.

### [ ] AUTO‑CRM‑002: Nurture Sequences
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑CRM‑001, API‑CRM‑030 (CRM email templates), EMAIL‑SERVICE‑001.  
**Definition of Done:** Multi‑step outbound follow‑up sequences for leads and contacts:
- Create a nurture sequence: define steps (e.g., day 0: intro email; day 3: follow‑up email; day 7: call task; day 14: final email).
- Enroll contacts manually or via automation rule (e.g., when a lead enters "qualified" stage).
- Sequence execution: each step triggers at the configured interval; emails sent automatically; tasks created for manual steps (calls, meetings).
- Pause/exit: contacts can be paused (e.g., they replied) or exited (e.g., they unsubscribed or converted).
- Activity logging for each sequence step (email opened, link clicked, task completed).
- Sequence performance analytics: enrollment rate, completion rate, step‑by‑step drop‑off.

**DDD:** ActiveCampaign‑style nurture sequences within CRM bounded context.  
**TDD:** Integration test enrolling a contact and verifying that step emails are queued at correct intervals.  
**BDD:** "As a marketer, I can create a nurture sequence that automatically sends a series of emails to new leads."

**Subtasks:**
- [ ] AUTO‑CRM‑002.1: Implement sequence engine with step scheduling and execution. (AGENT) – `automation/crm/nurture‑engine.ts`  
  **verification:** Sequences execute steps at configured intervals; emails sent, tasks created.
- [ ] AUTO‑CRM‑002.2: Build sequence builder UI (step editor, interval configuration, template selection). (AGENT) – `src/components/automation/crm/SequenceBuilder.tsx`  
  **verification:** Sequences can be created with multiple steps; preview shows timeline.
- [ ] AUTO‑CRM‑002.3: Implement enrollment (manual and rule‑based) with pause/exit management. (AGENT)  
  **verification:** Contacts enrolled; pause halts execution; exit removes permanently.
- [ ] AUTO‑CRM‑002.4: Add activity logging for each sequence step with email tracking (opens, clicks). (AGENT)  
  **verification:** Each step logged; email engagement tracked and visible in CRM.
- [ ] AUTO‑CRM‑002.5: Build sequence performance analytics dashboard. (AGENT) – `src/components/automation/crm/SequenceAnalytics.tsx`  
  **verification:** Analytics show enrollment, completion, and drop‑off rates.
- **Depends on:** AUTO‑CRM‑001, API‑CRM‑030, EMAIL‑SERVICE‑001.

### [ ] AUTO‑CRM‑003: Renewal & Re‑Engagement Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑033 (renewal lifecycle API), AUTO‑CRM‑001.  
**Definition of Done:** Automated renewal and re‑engagement workflows:
- Renewal reminders: X days before a contract/renewal date, automatically create a task for the account owner and send a reminder email to the client.
- Renewal chase sequences: if renewal is not actioned by the due date, escalate with increasingly urgent reminders every N days.
- Lapse detection: when a renewal deadline passes without action, mark as lapsed and trigger a win‑back sequence.
- Re‑engagement automation for dormant accounts: if a contact has had no activity or open deals for a configurable period, automatically enroll them in a re‑engagement sequence (e.g., "we miss you" email, special offer).
- All actions logged as CRM activities on the contact and company records.

**DDD:** CRM lifecycle automation for renewals and dormant accounts (ActiveCampaign‑inspired).  
**TDD:** Integration test verifying that a renewal approaching its date triggers a task and email.  
**BDD:** "As an account manager, I am automatically reminded about upcoming renewals and dormant accounts are re‑engaged without manual effort."

**Subtasks:**
- [ ] AUTO‑CRM‑003.1: Implement renewal reminder and chase sequence engine. (AGENT) – `automation/crm/renewal‑engine.ts`  
  **verification:** Reminders trigger at configured intervals; chase sequence escalates.
- [ ] AUTO‑CRM‑003.2: Implement lapse detection and win‑back automation. (AGENT)  
  **verification:** Lapsed renewals trigger win‑back sequence; dormant accounts detected.
- [ ] AUTO‑CRM‑003.3: Build renewal automation configuration (reminder windows, escalation rules, templates). (AGENT)  
  **verification:** Configuration changes take effect for future renewals.
- [ ] AUTO‑CRM‑003.4: Wire all automated actions to CRM activity log. (AGENT)  
  **verification:** Automated reminders, chases, and win‑backs appear in contact/company activity timelines.
- **Depends on:** API‑CRM‑033, AUTO‑CRM‑001.

### [ ] AUTO‑CRM‑004: Pre‑Built CRM Recipes & Simulation Mode
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑CRM‑001, AUTO‑CRM‑002, AUTO‑CRM‑003.  
**Definition of Done:** Ready‑made automation library and testing capability:
- Library of pre‑built CRM automation recipes (e.g., "New Lead Welcome": when lead created → send intro email day 0, follow‑up task day 3; "Deal Won Follow‑up": when deal marked won → send thank‑you email, create onboarding task; "Cold Lead Re‑engagement": when lead inactive 30 days → send re‑engagement email).
- Recipes are installable with one click; parameters customisable (e.g., change email template, adjust timing).
- Simulation mode: before activating an automation, run a dry‑run that shows what actions would be triggered for existing records without actually executing them.
- Execution preview: shows a timeline of what will happen and when, given current data.
- Publish/pause/unpublish lifecycle for each automation rule.

**DDD:** CRM automation packaged as reusable recipes (ActiveCampaign recipe marketplace concept).  
**TDD:** Unit test for simulation mode verifying that dry‑run produces correct predicted actions without side effects.  
**BDD:** "As a sales manager, I can install a pre‑built automation recipe and preview its effects before turning it on."

**Subtasks:**
- [ ] AUTO‑CRM‑004.1: Build recipe library with at least 5 pre‑built recipes covering common CRM workflows. (AGENT) – `automation/crm/recipes/`  
  **verification:** Recipes installable with one click; parameters customisable.
- [ ] AUTO‑CRM‑004.2: Implement simulation/dry‑run mode for all automation types. (AGENT)  
  **verification:** Dry‑run shows predicted actions without executing them; simulation respects current data.
- [ ] AUTO‑CRM‑004.3: Build execution preview timeline UI. (AGENT) – `src/components/automation/crm/ExecutionPreview.tsx`  
  **verification:** Timeline shows what actions will occur and when, based on selected automation.
- [ ] AUTO‑CRM‑004.4: Add publish/pause/unpublish lifecycle management for automations. (AGENT)  
  **verification:** Pausing stops execution; unpublishing archives; reactivation works.
- **Depends on:** AUTO‑CRM‑001, AUTO‑CRM‑002, AUTO‑CRM‑003.

---

## Projects Automation (from Projects Delta)

### [ ] AUTO‑PROJ‑001: PM Milestone, Due‑Date & Inactivity Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑012 (milestones API), API‑PROJ‑008 (tasks API).  
**Definition of Done:** Project management automations triggered by deadlines and inactivity:
- Milestone due‑date reminders: N days before a milestone is due, automatically notify the project owner and create a task.
- Overdue escalation: when a milestone or task passes its due date without completion, escalate with increasingly urgent notifications daily.
- Stalled project detection: if a project has had no task completions, status changes, or time entries for a configurable period, flag it as "stalled" and notify the project manager.
- Inactive task reminder: tasks assigned but untouched for X days trigger a reminder to the assignee.
- All automated notifications delivered via in‑app notification and email; logged as project activity.

**DDD:** PM automation within the Projects bounded context; deadline‑driven and inactivity‑based triggers.  
**TDD:** Integration test verifying that an overdue milestone triggers escalation notifications.  
**BDD:** "As a project manager, I am automatically alerted when milestones are overdue or projects are stalled."

**Subtasks:**
- [ ] AUTO‑PROJ‑001.1: Implement milestone and due‑date automation engine. (AGENT) – `automation/projects/deadline‑engine.ts`  
  **verification:** Approaching and overdue milestones trigger notifications at configured intervals.
- [ ] AUTO‑PROJ‑001.2: Implement stalled project and inactive task detection. (AGENT)  
  **verification:** Projects with no activity for X days flagged; inactive tasks trigger reminders.
- [ ] AUTO‑PROJ‑001.3: Build automation configuration interface (thresholds, notification channels, escalation rules). (AGENT)  
  **verification:** Configuration changes applied; thresholds respected.
- [ ] AUTO‑PROJ‑001.4: Wire notifications through in‑app and email; log all actions as project activity. (AGENT)  
  **verification:** Notifications delivered; activity log entries created.
- **Depends on:** API‑PROJ‑012, API‑PROJ‑008.

### [ ] AUTO‑PROJ‑002: Pre‑Built PM Automation Recipes & Simulation
**Status:** ⏳ Not Started  
**Depends on:** AUTO‑PROJ‑001.  
**Definition of Done:** Ready‑made PM automation recipes:
- Library of pre‑built recipes (e.g., "New Project Setup": when project created → assign template tasks, notify team; "Sprint Review Reminder": every 2 weeks → create review task, send agenda email; "Overdue Task Escalation": when task overdue 3 days → notify manager, create follow‑up).
- One‑click installation with customisable parameters.
- Simulation/dry‑run mode: preview actions before activation without side effects.
- Execution preview timeline for each automation.
- Publish/pause/unpublish lifecycle.

**DDD:** PM automation recipes for common project management patterns.  
**TDD:** Unit test for simulation mode verifying accurate preview without execution.  
**BDD:** "As a PM, I can enable a pre‑built automation recipe and see what it will do before it runs."

**Subtasks:**
- [ ] AUTO‑PROJ‑002.1: Build PM recipe library with at least 5 pre‑built recipes. (AGENT) – `automation/projects/recipes/`  
  **verification:** Recipes installable; parameters customisable.
- [ ] AUTO‑PROJ‑002.2: Implement simulation mode and execution preview for PM automations. (AGENT)  
  **verification:** Dry‑run shows accurate predictions; execution preview timeline correct.
- [ ] AUTO‑PROJ‑002.3: Add publish/pause/unpublish lifecycle. (AGENT)  
  **verification:** Lifecycle management works correctly.
- **Depends on:** AUTO‑PROJ‑001.

### [ ] AUTO‑PROJ‑003: Recurring Work Generation Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑PROJ‑022 (recurring work generation endpoint).  
**Definition of Done:** Scheduled background job for recurring work generation:
- A cron‑based scheduler runs daily (or configurable frequency) and checks all active recurring work plans.
- For each plan where `next_run_date` ≤ today, automatically generates the next set of tasks from the linked template blueprint.
- Updates `last_run_date` and advances `next_run_date` based on the RRULE.
- Prevents duplicate generation: checks that tasks for the current period haven't already been created (by checking `generated_task_list_json`).
- Logs each generation in the generation log with timestamp, tasks created, and status.
- Sends notification to the plan owner when work is generated.
- Retry logic: if generation fails, retry up to 3 times with exponential backoff; log final failure and notify admin.

**DDD:** PM Scheduler automation – this is the recurring work generation engine for the Projects‑owned Scheduler feature.  
**TDD:** Integration test: create a recurring plan, manually set `next_run_date` to today, run the scheduler job, verify tasks created and `next_run_date` advanced.  
**BDD:** "As a PM, tasks are automatically created every week from my recurring work plan."

**Subtasks:**
- [ ] AUTO‑PROJ‑003.1: Implement scheduled job runner (node‑cron or similar) that processes recurring work plans. (AGENT) – `automation/projects/recurring‑work‑scheduler.ts`  
  **verification:** Scheduler runs on configured interval; processes all due plans.
- [ ] AUTO‑PROJ‑003.2: Implement generation logic with duplicate prevention and error handling. (AGENT)  
  **verification:** Tasks generated correctly; duplicates prevented; failures retried and logged.
- [ ] AUTO‑PROJ‑003.3: Add notification delivery for generated work (in‑app + email). (AGENT)  
  **verification:** Plan owner notified when work is generated.
- [ ] AUTO‑PROJ‑003.4: Write integration test for full automated generation cycle. (AGENT)  
  **verification:** End‑to‑end test passes.
- **Depends on:** API‑PROJ‑022.

---

## Finance Automation (Bill.com depth)

### [ ] AUTO‑FIN‑001: Automated Payment Run Scheduling
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑018 (payment run API), API‑AP‑008 (bills).  
**Definition of Done:** Scheduled payment runs for recurring payment processing:
- Configure a payment run schedule: select frequency (e.g., every Friday, 1st and 15th of month), preferred bank account, default payment date offset.
- When the schedule triggers, the system automatically creates a draft payment run containing all approved, unpaid bills due within the configured window.
- Notification sent to finance team: "Your weekly payment run is ready for review" with a link to the draft run and a summary of included bills and total amount.
- Finance team reviews the draft, adjusts if needed, and executes.
- Schedule can be paused (e.g., during holiday periods) and resumed.
- Payment run schedule history: view past auto‑generated runs with status (reviewed/executed/skipped).

**DDD:** Bill.com automated payment scheduling within the Finance bounded context.  
**TDD:** Integration test: configure a schedule, simulate trigger, verify draft payment run created with correct bills.  
**BDD:** "As a finance manager, a draft payment run is automatically prepared every Friday for my review."

**Subtasks:**
- [ ] AUTO‑FIN‑001.1: Implement payment run scheduler with configurable frequency and rules. (AGENT) – `automation/finance/payment‑run‑scheduler.ts`  
  **verification:** Schedule creates draft payment runs on configured frequency with correct bills.
- [ ] AUTO‑FIN‑001.2: Build schedule configuration interface (frequency, bank account, bill selection rules). (AGENT) – `src/components/automation/finance/PaymentRunSchedule.tsx`  
  **verification:** Schedules can be created, edited, paused, and resumed.
- [ ] AUTO‑FIN‑001.3: Implement notification delivery with payment run summary. (AGENT)  
  **verification:** Finance team receives notification with summary and link to draft run.
- [ ] AUTO‑FIN‑001.4: Add schedule history and execution log. (AGENT)  
  **verification:** Past auto‑generated runs visible with status.
- **Depends on:** API‑FIN‑018, API‑AP‑008.

### [ ] AUTO‑FIN‑002: Recurring Invoice Generation Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑010 (recurring templates API), API‑AR‑008 (AR invoices).  
**Definition of Done:** Automated recurring invoice generation:
- Background job checks all active recurring invoice templates daily.
- For templates where `next_invoice_date` ≤ today, automatically generates an AR invoice from the template.
- Invoice is created in "draft" status for review (or "sent" if auto‑send is enabled on the template).
- Updates `next_invoice_date` based on the template frequency (RRULE or simple interval).
- Logs each generation with timestamp, invoice ID, customer, and amount.
- Error handling: if generation fails (e.g., customer inactive), log error and notify finance team; do not block other templates.
- Duplicate prevention: checks that an invoice for the same template and period hasn't already been created.

**DDD:** Bill.com recurring billing automation within Finance.  
**TDD:** Integration test: create a monthly template, set `next_invoice_date` to today, run generation job, verify invoice created and date advanced.  
**BDD:** "As a finance manager, recurring invoices are automatically generated on schedule without manual effort."

**Subtasks:**
- [ ] AUTO‑FIN‑002.1: Implement recurring invoice generation job with duplicate prevention. (AGENT) – `automation/finance/recurring‑invoice‑generator.ts`  
  **verification:** Job generates invoices for all due templates; duplicates prevented.
- [ ] AUTO‑FIN‑002.2: Implement auto‑send option: if enabled on template, generated invoice is automatically sent to customer. (AGENT)  
  **verification:** Auto‑send triggers email delivery after generation.
- [ ] AUTO‑FIN‑002.3: Add generation log and error notification. (AGENT)  
  **verification:** Each generation logged; failures notified to finance team.
- [ ] AUTO‑FIN‑002.4: Write integration test for full automated generation cycle. (AGENT)  
  **verification:** End‑to‑end test passes.
- **Depends on:** API‑AR‑010, API‑AR‑008.

### [ ] AUTO‑FIN‑003: Collections Escalation Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑022 (collections activity API), API‑AR‑008 (AR invoices).  
**Definition of Done:** Rule‑based collections escalation:
- Configure escalation rules based on days overdue and reminder history (e.g., after 30 days overdue and 3 reminders sent without payment, escalate to "collections" status).
- When escalation triggers: move invoice to a "collections" queue, assign a collector, create a task for phone follow‑up, and notify the assigned collector.
- Multiple escalation levels: level 1 (automated reminders), level 2 (collector assignment), level 3 (manager review), level 4 (external collections handoff).
- Escalation can be paused per customer (e.g., payment plan agreed).
- Escalation history logged on the invoice and customer records.

**DDD:** Bill.com collections workflow automation within Finance.  
**TDD:** Integration test: simulate an overdue invoice with 3 reminders, verify escalation triggers and collector assigned.  
**BDD:** "As a collections manager, overdue invoices automatically escalate through defined levels until resolved."

**Subtasks:**
- [ ] AUTO‑FIN‑003.1: Implement collections escalation engine with configurable levels and rules. (AGENT) – `automation/finance/collections‑escalation‑engine.ts`  
  **verification:** Engine evaluates rules and escalates invoices correctly through defined levels.
- [ ] AUTO‑FIN‑003.2: Build escalation rule configuration interface. (AGENT) – `src/components/automation/finance/EscalationRules.tsx`  
  **verification:** Rules can be configured per level with days overdue and reminder count thresholds.
- [ ] AUTO‑FIN‑003.3: Implement collector assignment and task creation on escalation. (AGENT)  
  **verification:** Escalated invoices assigned to collectors; follow‑up tasks created.
- [ ] AUTO‑FIN‑003.4: Add escalation pause, history, and notification delivery. (AGENT)  
  **verification:** Pausing halts escalation; history logged; notifications sent.
- **Depends on:** API‑FIN‑022, API‑AR‑008.

---

## Document Automation (ShareFile depth)

### [ ] AUTO‑DOCS‑001: Document Retention Enforcement Automation
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑014 (retention policy API).  
**Definition of Done:** Scheduled job that enforces document retention policies:
- Runs daily and checks all active retention policies.
- For each policy, identifies files whose retention period has expired (upload date + delete_after_days ≤ today).
- Deletes the identified files from storage (soft delete in database, hard delete from R2 or move to trash).
- Logs all enforcement actions: which files were deleted, which policy triggered, timestamp.
- Respects compliance holds: files under legal hold are skipped with a log entry.
- Respects policy inheritance: child folders without explicit policies inherit from parent; enforcement walks the folder tree.
- Notification to folder owners or admins when files are deleted (summary email).
- Configurable grace period: files deleted but recoverable for N days before permanent deletion.

**DDD:** Document lifecycle automation within the Documents bounded context (ShareFile retention enforcement).  
**TDD:** Integration test: create a policy with delete_after_days = 1, upload a file, advance time, run enforcement, verify file deleted and logged.  
**BDD:** "As a compliance officer, files are automatically deleted when their retention period expires."

**Subtasks:**
- [ ] AUTO‑DOCS‑001.1: Implement retention enforcement job with folder tree walking and policy inheritance. (AGENT) – `automation/documents/retention‑enforcer.ts`  
  **verification:** Enforcement correctly identifies expired files across inherited policies.
- [ ] AUTO‑DOCS‑001.2: Add compliance hold detection – files under hold are skipped. (AGENT)  
  **verification:** Held files are not deleted; skipped with log entry.
- [ ] AUTO‑DOCS‑001.3: Implement grace period and permanent deletion logic. (AGENT)  
  **verification:** Deleted files recoverable during grace period; permanently deleted after.
- [ ] AUTO‑DOCS‑001.4: Add enforcement logging and notification delivery. (AGENT)  
  **verification:** Log records all deletions; summary email sent to owners/admins.
- [ ] AUTO‑DOCS‑001.5: Write integration test for full enforcement cycle. (AGENT)  
  **verification:** End‑to‑end test passes.
- **Depends on:** API‑DOCS‑014.

### [ ] AUTO‑DOCS‑002: Automated Document Archiving
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑008 (folders API), API‑DOCS‑004 (documents API).  
**Definition of Done:** Automated archival of idle documents and completed project/deal documents:
- Configure archive rules per folder or project: move documents to archive after N days of inactivity (no views, edits, or shares).
- Project‑linked archiving: when a project is marked as completed (or deal marked as closed‑won/lost), all associated documents are automatically moved to an archive folder.
- Archive folder is a designated system folder (or configurable per organisation).
- Documents in archive remain accessible but are excluded from default searches and views (filter toggle to include archived).
- Pre‑archive notification: X days before archival, notify document owner that the document will be archived unless action is taken.
- Archival log tracks all moves with timestamps.

**DDD:** Document lifecycle management within the Documents bounded context (ShareFile archival feature).  
**TDD:** Integration test: mark a project as completed, verify its documents are moved to archive.  
**BDD:** "As a project manager, project documents are automatically archived when the project is completed."

**Subtasks:**
- [ ] AUTO‑DOCS‑002.1: Implement archive rule engine (idle‑time and event‑driven archival). (AGENT) – `automation/documents/archive‑engine.ts`  
  **verification:** Idle documents archived after configured period; project completion triggers archival.
- [ ] AUTO‑DOCS‑002.2: Build archive rule configuration interface. (AGENT) – `src/components/automation/documents/ArchiveRules.tsx`  
  **verification:** Rules configurable per folder/project with idle time and event triggers.
- [ ] AUTO‑DOCS‑002.3: Implement pre‑archive notification and archival log. (AGENT)  
  **verification:** Notifications sent before archival; log tracks all moves.
- [ ] AUTO‑DOCS‑002.4: Add archive toggle in document search/filter views. (AGENT)  
  **verification:** Archived documents hidden by default; toggle shows them.
- **Depends on:** API‑DOCS‑008, API‑DOCS‑004.

### [ ] AUTO‑DOCS‑003: Share Link Expiry Cleanup
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (secure share link API).  
**Definition of Done:** Background process that manages share link lifecycle:
- Runs daily and identifies all share links that have passed their `expires_at` date.
- Deactivates expired links: sets status to "expired", revokes access.
- Cleans up associated access logs after a configurable grace period (e.g., 30 days after expiry) for data retention compliance.
- Sends notification to the link creator when a link expires (summary of links expired that day).
- Optionally auto‑extends links: if configured, links that reach their expiry can be automatically extended by N days (max extensions configurable).
- Expiry log tracks all expired and cleaned links.

**DDD:** Share link lifecycle management within Documents (ShareFile).  
**TDD:** Integration test: create a link with 1‑day expiry, advance time, run cleanup, verify link deactivated and creator notified.  
**BDD:** "As a document owner, expired share links are automatically deactivated and I am notified."

**Subtasks:**
- [ ] AUTO‑DOCS‑003.1: Implement link expiry cleanup job with deactivation and access log cleanup. (AGENT) – `automation/documents/link‑cleanup‑job.ts`  
  **verification:** Expired links deactivated; access logs cleaned after grace period.
- [ ] AUTO‑DOCS‑003.2: Add expiry notification to link creators. (AGENT)  
  **verification:** Daily summary email sent to creators with expired links.
- [ ] AUTO‑DOCS‑003.3: Implement optional auto‑extension logic. (AGENT)  
  **verification:** Links configured for auto‑extension are extended within max limit.
- [ ] AUTO‑DOCS‑003.4: Build expiry log viewer. (AGENT)  
  **verification:** All expiry and cleanup actions logged and viewable.
- **Depends on:** API‑DOCS‑013.

---

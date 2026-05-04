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

**Deep Module:**
- Reminder sequence engine is a deep module: simple interface (scheduleReminder(appointmentId, eventTypeId)) but complex implementation handling per-event-type template selection, multi-channel orchestration, timezone-aware scheduling, and escalation logic with configurable intervals.
- The complexity is hidden behind a simple API but involves coordinating with notification services, managing retry logic, and handling client preferences across multiple dimensions (channel, timing, content).

**DDD:** Reminder engine within the Appointments bounded context; per‑event‑type configuration (Calendly requirement).  
**TDD:** Unit test verifying that different event types trigger different reminder sequences based on configuration.  
**BDD:** "As a service provider, my clients get reminders tailored to the type of appointment they booked."

**Advanced Code Patterns:**
- **Strategy Pattern for Channel Selection**: Use strategy pattern for different notification channels (email, SMS, push) with fallback chains.
- **Template Engine with Variable Substitution**: Implement template engine supporting appointment variables (${clientName}, ${appointmentTime}, etc.) with type-safe substitution.
- **Scheduled Job with Idempotency**: Use idempotent job processing with unique keys to prevent duplicate reminders on job restart.
- **Circuit Breaker for External Services**: Wrap email/SMS providers with circuit breaker to handle provider outages gracefully.

**Anti-Patterns:**
- ❌ **Hard-Coded Reminder Timing**: Don't hard-code reminder schedules; make them configurable per event type.
- ❌ **Fire-and-Forget Notifications**: Don't send notifications without tracking delivery status; implement proper logging and retry.
- ❌ **Ignoring Timezone**: Don't schedule reminders in server timezone; always use client's local timezone.
- ❌ **Synchronous Channel Calls**: Don't block on external notification API calls; use async processing with queues.

**Rules to Follow:**
- **JOB‑015**: Implement scheduled jobs with idempotency keys to prevent duplicate execution.
- **NOTIFY‑012**: Use circuit breaker pattern for external notification providers; fallback to alternative provider.
- **TIMEZONE‑008**: Always schedule reminders in recipient's local timezone with DST handling.
- **TDD‑022**: Mock external notification services in tests; verify correct parameters passed.
- **CONFIG‑012**: Make reminder timing and channels configurable per event type via admin interface.

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

**Deep Module:**
- Rebooking engine is a deep module: simple interface (initiateRebooking(cancelledAppointmentId)) but complex implementation handling waitlist prioritization algorithms, availability matching across multiple providers, preference satisfaction (client preferred times, provider continuity), and transactional consistency when multiple waitlist clients compete for the same slot.
- Waitlist management encapsulates complex queue logic with priority scoring based on wait time, client preferences, and historical patterns.

**DDD:** Rebooking automation within Appointments bounded context; Waitlist aggregate with WaitlistEntry entities. Rebooking coordination is a domain service using saga pattern for multi-step workflows.
**TDD:** Unit test verifying that when a popular time slot becomes available, the highest-priority waitlist client is automatically booked and notified.
**BDD:** "As a client on the waitlist, I am automatically booked when a suitable appointment becomes available."

**Advanced Code Patterns:**
- **Saga Pattern for Rebooking**: Use saga pattern to coordinate multi-step rebooking (release slot → match waitlist → book → notify) with compensation on failure.
- **Priority Queue for Waitlist**: Implement waitlist as priority queue with composite scoring (wait time + preference match + client tier).
- **Optimistic Slot Claiming**: Use optimistic locking with version numbers when multiple waitlist entries compete for the same slot.
- **Circuit Breaker for Notification**: Wrap notification calls in circuit breaker to handle provider outages during high-volume rebooking.

**Anti-Patterns:**
- ❌ **First-Come-First-Served Only**: Don't use simple FIFO for waitlist; consider preferences and historical patterns.
- ❌ **Synchronous Rebooking**: Don't process rebooking synchronously during cancellation; use async queue to handle peak loads.
- ❌ **Ignoring Preference Matching**: Don't rebook without considering client preferences (time of day, provider continuity).
- ❌ **No Conflict Resolution**: Don't fail silently when multiple clients qualify for the same slot; implement deterministic tie-breaking.

**Rules to Follow:**
- **SAGA‑008**: Implement rebooking as compensating saga with clear rollback steps on failure.
- **QUEUE‑012**: Use priority queue for waitlist with composite scoring algorithm.
- **LOCK‑015**: Use optimistic locking when claiming slots from waitlist to prevent double-booking.
- **TDD‑028**: Test race conditions in waitlist processing; verify only one client gets each slot.
- **NOTIFY‑018**: Send immediate notification to client when auto-booked from waitlist with option to decline.

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

**Deep Module:**
- Workflow execution engine is a deep module: simple interface (executeWorkflow(workflowId, context)) but complex implementation handling graph-based workflow execution, conditional branching, parallel step coordination, variable scoping, and error recovery with compensation logic.
- Visual workflow builder DSL (Domain Specific Language) abstracts complex automation logic into composable nodes while maintaining type safety and validation.

**DDD:** Workflow builder as separate bounded context (Automation) with WorkflowDefinition aggregate and WorkflowExecution entities. Uses event sourcing for execution history.
**TDD:** Unit test verifying that a workflow with conditional branches executes only the correct path based on context data.
**BDD:** "As a power user, I can build custom automation workflows using a visual drag-and-drop interface."

**Advanced Code Patterns:**
- **DSL for Workflow Definition**: Implement internal DSL for workflow definitions with type-safe node configuration.
- **Visitor Pattern for Workflow Execution**: Use visitor pattern to traverse and execute workflow graphs with different execution strategies.
- **Event Sourcing for Execution History**: Store workflow execution as event stream for complete audit trail and replay capability.
- **Sandboxed Execution**: Run workflow steps in sandboxed environment with resource limits and timeout enforcement.

**Anti-Patterns:**
- ❌ **Infinite Loop Detection Missing**: Don't allow workflows without cycle detection; implement max iteration limits.
- ❌ **Synchronous Step Execution**: Don't execute long-running steps synchronously; use async job queue.
- ❌ **No Compensation on Failure**: Don't leave partial workflow executions without cleanup; implement compensation actions.
- ❌ **Tight Coupling to External APIs**: Don't directly call external APIs from workflow steps; use abstraction layer.

**Rules to Follow:**
- **DSL‑012**: Implement type-safe DSL for workflow definitions with compile-time validation.
- **EXEC‑025**: Use event sourcing for workflow execution history; enable replay and debugging.
- **LIMIT‑018**: Enforce resource limits on workflows (max steps, execution time, memory).
- **TDD‑035**: Test workflow execution with complex graphs including cycles and parallel branches.
- **ISOLATION‑015**: Run workflow steps in isolated contexts with proper error boundaries.

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

**Deep Module:**
- Stage-based automation engine is a deep module: simple interface (evaluateRules(entity, fromStage, toStage)) but complex implementation handling rule condition evaluation, action orchestration across multiple services (CRM, Email, Task), inactivity detection with configurable thresholds, and rule priority resolution when multiple rules match.
- Inactivity detection uses sliding window algorithms with efficient event indexing to detect stale records without full table scans.

**DDD:** CRM automation within the CRM bounded context; stage machine triggers automated follow‑up (ActiveCampaign‑inspired).  
**TDD:** Unit test verifying that moving a lead to "contacted" stage triggers task creation with correct due date and assignee.  
**BDD:** "As a sales rep, follow‑up tasks are automatically created when I move a lead to a new stage."

**Advanced Code Patterns:**
- **Rule Engine with Predicate Pattern**: Implement rules as composable predicates with AND/OR/NOT logic and clear precedence.
- **Event-Driven Rule Evaluation**: Use domain events (LeadStageChanged) to trigger rule evaluation asynchronously.
- **Circuit Breaker for Actions**: Wrap action execution (email send, task creation) in circuit breakers to handle service degradation.
- ** Sliding Window for Inactivity**: Use efficient sliding window algorithm with materialized views for inactivity detection.

**Anti-Patterns:**
- ❌ **Synchronous Rule Evaluation**: Don't evaluate rules synchronously during stage changes; use async processing.
- ❌ **Hard-Coded Stage Triggers**: Don't hard-code stage-to-action mappings; use configurable rule engine.
- ❌ **Blocking on Action Failure**: Don't block stage change if automation fails; log and continue with retry queue.
- ❌ **Full Table Scans for Inactivity**: Don't scan entire table for inactivity; use indexed last-activity timestamps.

**Rules to Follow:**
- **RULE‑015**: Implement rule engine with composable predicates and clear evaluation order.
- **ASYNC‑022**: Process automation rules asynchronously; don't block user actions on automation.
- **CIRCUIT‑012**: Use circuit breakers for action execution; queue failed actions for retry.
- **TDD‑025**: Test rule combinations with complex predicate logic (AND/OR/NOT).
- **INDEX‑018**: Maintain indexed last-activity timestamp for efficient inactivity queries.

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

**Deep Module:**
- Sequence execution engine is a deep module: simple interface (enrollContact(sequenceId, contactId)) but complex implementation handling step scheduling with timezone awareness, enrollment state management across multiple steps, pause/exit logic, email engagement tracking integration, and sequence analytics aggregation.

**DDD:** ActiveCampaign‑style nurture sequences within CRM bounded context.  
**Process Manager:** This is a cross-context orchestration pattern - the nurture sequence Process Manager coordinates CRM (for contact data), Email Service (for sending), and Analytics (for tracking). It manages the long-running sequence lifecycle across bounded contexts.
**TDD:** Integration test enrolling a contact and verifying that step emails are queued at correct intervals.  
**BDD:** "As a marketer, I can create a nurture sequence that automatically sends a series of emails to new leads."

**Advanced Code Patterns:**
- **Process Manager Pattern**: Use Process Manager saga to coordinate sequence execution across CRM, Email, and Analytics contexts.
- **State Machine for Enrollment**: Model enrollment lifecycle as state machine (Active → Paused → Exited → Completed).
- **Scheduled Job with Idempotency**: Use idempotent job processing with sequence step instance keys.
- **Event-Driven Analytics**: Publish domain events for email opens/clicks; consume in Analytics context.

**Anti-Patterns:**
- ❌ **Direct Context Calls**: Don't directly call other bounded contexts from sequence engine; use Process Manager and integration events.
- ❌ **No Sequence State Tracking**: Don't lose track of which step a contact is on; maintain explicit enrollment state.
- ❌ **Synchronous Email Sending**: Don't send emails synchronously during sequence processing; queue for async delivery.
- ❌ **Ignoring Timezone in Scheduling**: Don't schedule all steps in server timezone; respect contact's local timezone.

**Rules to Follow:**
- **PROCESS‑012**: Use Process Manager for cross-context orchestration; maintain saga state for long-running sequences.
- **EVENT‑018**: Publish integration events for context boundaries; consume events for cross-context updates.
- **SAGA‑015**: Implement compensation for failed steps (e.g., pause enrollment if email service unavailable).
- **TDD‑032**: Test sequence timing across timezone boundaries and daylight saving transitions.
- **IDEMPOT‑008**: Ensure sequence step execution is idempotent; prevent duplicate emails on retry.

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

**Deep Module:**
- Deadline monitoring engine is a deep module: simple interface (checkDeadlines()) but complex implementation handling multi-level deadline hierarchies (project → milestone → task), escalation level progression, notification batching for efficiency, and intelligent inactivity detection (excluding weekends/holidays based on organization calendar).
- Stalled project detection uses statistical analysis of activity patterns with configurable sensitivity to avoid false positives from naturally slow projects.

**DDD:** PM automation within the Projects bounded context; deadline‑driven and inactivity‑based triggers.  
**TDD:** Integration test verifying that an overdue milestone triggers escalation notifications.  
**BDD:** "As a project manager, I am automatically alerted when milestones are overdue or projects are stalled."

**Advanced Code Patterns:**
- **Deadline Hierarchy Walker**: Implement tree-walking algorithm for deadline hierarchies with rollup notifications.
- **Escalation State Machine**: Model escalation levels as state machine with configurable timeouts and notification channels.
- **Statistical Inactivity Detection**: Use statistical process control to detect genuine stalls vs. normal variation.
- **Batch Notification Pattern**: Batch multiple deadline notifications into single digest email to reduce noise.

**Anti-Patterns:**
- ❌ **Notification Spam**: Don't send individual notifications for every overdue item; batch and digest.
- ❌ **Ignoring Business Hours**: Don't count weekends/holidays as inactivity without configuration.
- ❌ **Fixed Escalation Timing**: Don't use hard-coded escalation delays; make them configurable per project type.
- ❌ **Blocking on Notification Failure**: Don't block automation if notification fails; log and retry asynchronously.

**Rules to Follow:**
- **BATCH‑012**: Batch deadline notifications into digests; limit to max 1 per day per recipient.
- **CALENDAR‑015**: Respect organization calendar for inactivity calculations; exclude weekends/holidays.
- **ESCALATE‑018**: Implement configurable escalation levels with clear progression rules.
- **TDD‑028**: Test escalation logic with mocked time to verify proper timing.
- **ASYNC‑025**: Process deadline checks asynchronously; don't block project operations.

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

**Deep Module:**
- Recurring work scheduler is a deep module: simple interface (generateWorkFromPlan(planId)) but complex implementation handling RRULE parsing, duplicate detection with distributed locking, batch task generation with progress tracking, and retry logic with exponential backoff for transient failures.

**DDD:** PM Scheduler automation – this is the recurring work generation engine for the Projects‑owned Scheduler feature.  
**Process Manager:** This is a cross-context orchestration - the scheduler Process Manager coordinates Projects (for task creation), Notifications (for owner alerts), and potentially Integrations (for external calendar updates). It manages the long-running generation lifecycle with compensation for partial failures.
**TDD:** Integration test: create a recurring plan, manually set `next_run_date` to today, run the scheduler job, verify tasks created and `next_run_date` advanced.  
**BDD:** "As a PM, tasks are automatically created every week from my recurring work plan."

**Advanced Code Patterns:**
- **Process Manager for Generation**: Use Process Manager to coordinate task creation, notification, and calendar sync across contexts.
- **Distributed Lock for Duplicate Prevention**: Use distributed lock (Redis) to prevent duplicate generation in multi-instance deployments.
- **Batch Processing with Progress**: Process generation in batches with progress tracking and resumption on failure.
- **Idempotent Generation with Idempotency Keys**: Use idempotency keys based on plan ID + run date to ensure exactly-once generation.

**Anti-Patterns:**
- ❌ **Duplicate Generation**: Don't allow duplicate task generation on job restart; use idempotency checks.
- ❌ **All-or-Nothing Generation**: Don't fail entire generation if one task fails; continue with error logging.
- ❌ **Synchronous External Calls**: Don't block generation on external calendar API calls; queue for async processing.
- ❌ **No Progress Tracking**: Don't run long generations without progress visibility; implement progress tracking.

**Rules to Follow:**
- **PROCESS‑015**: Use Process Manager for cross-context orchestration during work generation.
- **IDEMPOT‑012**: Implement idempotent generation with planId + runDate composite key.
- **DISTLOCK‑008**: Use distributed locking to prevent duplicate generation in concurrent deployments.
- **TDD‑035**: Test generation with mocked time and simulated failures; verify retry behavior.
- **BATCH‑018**: Process large generations in batches with commit points for resumption.

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

**Deep Module:**
- Payment run scheduler is a deep module: simple interface (createDraftPaymentRun(scheduleId)) but complex implementation handling bill selection with configurable rules, bank account balance validation, payment date calculation with banking holidays, and draft run assembly with approval routing.

**DDD:** Bill.com automated payment scheduling within the Finance bounded context.  
**Process Manager:** This is a cross-context orchestration - the payment run Process Manager coordinates Finance (for bills and payment runs), Notifications (for finance team alerts), and potentially Banking (for balance checks). It manages the draft creation lifecycle with rollback on validation failures.
**TDD:** Integration test: configure a schedule, simulate trigger, verify draft payment run created with correct bills.  
**BDD:** "As a finance manager, a draft payment run is automatically prepared every Friday for my review."

**Advanced Code Patterns:**
- **Process Manager for Draft Creation**: Use Process Manager to coordinate bill selection, validation, and notification across contexts.
- **Configurable Rule Engine**: Use rule engine for bill selection (due date window, approval status, vendor type filters).
- **Banking Calendar Awareness**: Implement banking calendar for payment date calculation excluding holidays and weekends.
- **Draft Run Transaction**: Wrap draft creation in transaction with rollback capability on validation failure.

**Anti-Patterns:**
- ❌ **Hard-Coded Selection Criteria**: Don't hard-code bill selection logic; make it configurable per schedule.
- ❌ **Ignoring Bank Holidays**: Don't schedule payments on banking holidays; respect banking calendar.
- ❌ **Synchronous Balance Checks**: Don't block draft creation on balance API calls; use cached balances with async refresh.
- ❌ **No Validation Before Creation**: Don't create draft runs with invalid bills; validate all bills before including.

**Rules to Follow:**
- **PROCESS‑018**: Use Process Manager for cross-context orchestration during payment run creation.
- **RULE‑022**: Implement configurable bill selection rules with UI-based configuration.
- **CALENDAR‑018**: Respect banking calendar for payment date calculations.
- **TDD‑038**: Test bill selection rules with various combinations of criteria.
- **VALID‑025**: Validate all bills before including in draft run; reject drafts with validation errors.

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

**Deep Module:**
- Recurring invoice generator is a deep module: simple interface (generateInvoiceFromTemplate(templateId)) but complex implementation handling RRULE parsing for complex schedules, duplicate detection with distributed locking, invoice line item calculation with tax and discount application, and auto-send coordination with email queue.

**DDD:** Bill.com recurring billing automation within Finance.  
**TDD:** Integration test: create a monthly template, set `next_invoice_date` to today, run generation job, verify invoice created and date advanced.  
**BDD:** "As a finance manager, recurring invoices are automatically generated on schedule without manual effort."

**Advanced Code Patterns:**
- **Idempotent Generation**: Use templateId + billingPeriod composite key for idempotency to prevent duplicate invoices.
- **Distributed Locking**: Use Redis distributed lock to prevent duplicate generation in multi-instance deployments.
- **Async Invoice Sending**: Queue invoices for async sending to avoid blocking generation job.
- **Tax Engine Integration**: Use strategy pattern for tax calculation with pluggable tax engines.

**Anti-Patterns:**
- ❌ **Duplicate Invoice Generation**: Don't allow duplicate invoices for same period; implement strict idempotency.
- ❌ **Synchronous Email Blocking**: Don't block generation on email sending; use message queue.
- ❌ **Hard-Coded Tax Rules**: Don't hard-code tax calculations; use configurable tax engine.
- ❌ **No Retry on Failure**: Don't fail permanently on transient errors; implement exponential backoff retry.

**Rules to Follow:**
- **IDEMPOT‑015**: Implement idempotent invoice generation with templateId + billingPeriod key.
- **DISTLOCK‑012**: Use distributed locking to prevent duplicate generation in concurrent deployments.
- **ASYNC‑028**: Queue invoices for asynchronous sending; don't block generation job.
- **TDD‑042**: Test RRULE parsing for complex recurring schedules (quarterly, annually).
- **RETRY‑018**: Implement exponential backoff retry for generation failures.

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

**Deep Module:**
- Collections escalation engine is a deep module: simple interface (evaluateEscalation(invoiceId)) but complex implementation handling multi-level rule evaluation with composite conditions (days overdue + reminder count + customer tier), escalation level progression with state machine, collector assignment algorithm with workload balancing, and pause/resume logic with grace period handling.

**DDD:** Bill.com collections workflow automation within Finance.  
**TDD:** Integration test: simulate an overdue invoice with 3 reminders, verify escalation triggers and collector assigned.  
**BDD:** "As a collections manager, overdue invoices automatically escalate through defined levels until resolved."

**Advanced Code Patterns:**
- **State Machine for Escalation Levels**: Implement escalation as state machine with configurable transitions and entry/exit actions.
- **Composite Rule Engine**: Use composite pattern for escalation rules with AND/OR/NOT logic combining multiple conditions.
- **Workload Balancing for Collector Assignment**: Use round-robin or least-busy algorithm for collector assignment with skill matching.
- **Grace Period with Scheduled Resume**: Use scheduled jobs for pause grace period with automatic resume.

**Anti-Patterns:**
- ❌ **Hard-Coded Escalation Rules**: Don't hard-code escalation criteria; make fully configurable per level.
- ❌ **Immediate External Handoff**: Don't escalate to external collections without internal review gates.
- ❌ **Ignoring Customer History**: Don't escalate without considering customer payment history and tier.
- ❌ **No Escalation Audit Trail**: Don't escalate without logging; maintain full audit trail of all level changes.

**Rules to Follow:**
- **SM‑022**: Implement escalation levels as explicit state machine with clear transitions.
- **RULE‑028**: Make escalation rules fully configurable with composite condition builder.
- **BALANCE‑015**: Balance collector assignment based on current workload and skill match.
- **TDD‑045**: Test escalation edge cases (exact threshold, multiple simultaneous triggers).
- **AUDIT‑025**: Log all escalation decisions with rationale and rule that triggered.

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

**Deep Module:**
- Retention enforcement engine is a deep module: simple interface (enforcePolicy(policyId)) but complex implementation handling recursive folder tree walking with policy inheritance, compliance hold detection across file hierarchies, grace period management with scheduled permanent deletion, and batch deletion with progress tracking for large datasets.

**DDD:** Document lifecycle automation within the Documents bounded context (ShareFile retention enforcement).  
**TDD:** Integration test: create a policy with delete_after_days = 1, upload a file, advance time, run enforcement, verify file deleted and logged.  
**BDD:** "As a compliance officer, files are automatically deleted when their retention period expires."

**Advanced Code Patterns:**
- **Tree Walker with Memoization**: Use recursive tree walker with memoized policy inheritance for efficient enforcement.
- **Batch Deletion with Cursor**: Process deletions in batches with database cursor for memory efficiency.
- **Scheduled Grace Period Jobs**: Use scheduled jobs for grace period expiration with permanent deletion.
- **Compliance Hold Overlay**: Check compliance holds as overlay on retention policy without modifying policy.

**Anti-Patterns:**
- ❌ **Recursive Deletion Without Limits**: Don't recurse infinitely; implement max depth and cycle detection.
- ❌ **Ignoring Compliance Holds**: Don't delete files under legal hold; implement hold detection at enforcement time.
- ❌ **Immediate Permanent Deletion**: Don't permanently delete immediately; implement soft-delete with grace period.
- ❌ **No Deletion Audit Trail**: Don't delete without logging; maintain complete deletion audit trail.

**Rules to Follow:**
- **TREE‑012**: Implement folder tree walking with max depth limit and cycle detection.
- **HOLD‑018**: Check compliance holds immediately before deletion; never delete held files.
- **GRACE‑015**: Implement soft-delete with configurable grace period before permanent deletion.
- **TDD‑038**: Test policy inheritance scenarios with nested folders and overrides.
- **AUDIT‑022**: Log all deletion actions with file metadata, policy, and timestamp.

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

**Deep Module:**
- Archive engine is a deep module: simple interface (archiveDocuments(ruleId)) but complex implementation handling idle-time calculation with activity window exclusions, event-driven archival with project/deal state listeners, pre-archive notification scheduling, and bulk move operations with transaction integrity across large document sets.

**DDD:** Document lifecycle management within the Documents bounded context (ShareFile archival feature).  
**TDD:** Integration test: mark a project as completed, verify its documents are moved to archive.  
**BDD:** "As a project manager, project documents are automatically archived when the project is completed."

**Advanced Code Patterns:**
- **Activity Window Exclusion**: Exclude weekends/holidays from idle-time calculation using calendar service.
- **Event-Driven Archival**: Listen to ProjectCompleted/DealClosed events for event-driven archival.
- **Scheduled Pre-Archive Notifications**: Use scheduled jobs for pre-archive warning notifications.
- **Bulk Move with Transaction**: Wrap bulk document moves in transaction with rollback on failure.

**Anti-Patterns:**
- ❌ **Counting All Days as Idle**: Don't count weekends/holidays as idle time without configuration.
- ❌ **Synchronous Bulk Moves**: Don't move large document sets synchronously; use background job.
- ❌ **No Pre-Archive Warning**: Don't archive without warning; implement pre-archive notifications.
- ❌ **Archive Without Audit**: Don't archive without logging; maintain complete archival audit trail.

**Rules to Follow:**
- **CALENDAR‑012**: Respect organization calendar for idle-time calculations.
- **ASYNC‑032**: Process bulk archival asynchronously; don't block project/deal operations.
- **NOTIFY‑028**: Send pre-archive notifications X days before archival with opt-out option.
- **TDD‑042**: Test idle-time calculation with various activity patterns and calendar configurations.
- **AUDIT‑028**: Log all archival actions with source, destination, and triggering event.

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

**Deep Module:**
- Link expiry cleanup is a deep module: simple interface (cleanupExpiredLinks()) but complex implementation handling batch query for expired links with pagination, cascade deactivation with access token revocation, access log cleanup with retention compliance, auto-extension logic with max extension limits, and creator notification batching for efficiency.

**DDD:** Share link lifecycle management within Documents (ShareFile).  
**TDD:** Integration test: create a link with 1‑day expiry, advance time, run cleanup, verify link deactivated and creator notified.  
**BDD:** "As a document owner, expired share links are automatically deactivated and I am notified."

**Advanced Code Patterns:**
- **Batch Processing with Pagination**: Process expired links in batches with keyset pagination for efficiency.
- **Cascade Deactivation**: Cascade deactivate access tokens when link expires for security.
- **Retention-Compliant Log Cleanup**: Clean access logs with retention period compliance after grace period.
- **Configurable Auto-Extension**: Implement auto-extension with max extension count and total duration limits.

**Anti-Patterns:**
- ❌ **Full Table Scan for Expired**: Don't scan entire table for expired links; use indexed expiry date query.
- ❌ **Orphaned Access Tokens**: Don't leave access tokens active after link expiry; cascade revoke.
- ❌ **Immediate Log Deletion**: Don't delete access logs immediately; respect retention compliance grace period.
- ❌ **Unlimited Auto-Extension**: Don't allow infinite auto-extensions; implement hard limits.

**Rules to Follow:**
- **INDEX‑025**: Use indexed expiry date queries; avoid full table scans.
- **CASCADE‑018**: Cascade revoke access tokens when deactivating expired links.
- **RETAIN‑022**: Respect data retention policies for log cleanup with grace period.
- **TDD‑048**: Test auto-extension limits; verify max extensions and total duration enforced.
- **BATCH‑028**: Process link expiry in batches to avoid memory issues with large datasets.

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

# TODO-P8-TEAM.md – Phase 8: Team Management & Enterprise Scheduling

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file contains team management and enterprise scheduling features that build on Phase 3 appointments foundation.

---

## Phase 8 Team & Scheduling Task Index

**Team Management**
- [ ] TEAM‑001 – Multi‑Provider Team Management
- [ ] TEAM‑002 – Advanced Assignment Algorithms
- [ ] TEAM‑003 – Provider Collaboration Features
- [ ] TEAM‑004 – Team Performance Analytics

**Enterprise Scheduling**
- [ ] ENT‑SCHED‑001 – Complex Recurring Patterns
- [ ] ENT‑SCHED‑002 – Resource‑Based Scheduling
- [ ] ENT‑SCHED‑003 – Enterprise Scheduling Rules

**Enterprise Appointments (Calendly‑style)**
- [ ] ENT‑APPT‑001 – Managed Events (Admin Centre)
- [ ] ENT‑APPT‑002 – Organisation Admin Centre
- [ ] ENT‑APPT‑003 – Scheduling Analytics Dashboard
- [ ] ENT‑APPT‑004 – Multi‑Location Support
- [ ] ENT‑APPT‑005 – Organisation‑Wide Scheduling Policies

---

## Team Management

### [ ] TEAM‑001: Multi‑Provider Team Management
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑010 (team scheduling), INT‑CALENDAR‑003.  
**Definition of Done:**
- Team creation and management interface for multiple providers.
- Team role definitions (admin, member, scheduler, viewer).
- Team availability aggregation with individual provider schedules.
- Team‑based appointment assignment and routing.
- Team performance metrics and reporting.

**Deep Module:**
- Team availability aggregation is a deep module: it combines multiple provider schedules with different availability windows, time zones, and buffer times into a unified availability matrix. The interface is simple (getTeamAvailability(teamId, dateRange)) but the implementation handles complex overlapping logic, conflict resolution, and cache invalidation when individual schedules change.
- Role-based permission system is deep: minimal surface (canAssign(providerId), canViewTeam(teamId)) but encapsulates complex RBAC logic with inheritance and team-specific overrides.

**DDD:** Team management within the Appointments bounded context; aggregate root is Team with Provider entities as value objects. Team availability is a domain service that aggregates provider schedules.
**TDD:** Unit test verifying that overlapping provider schedules with conflicting availability windows produce correct aggregated availability matrix with gaps properly identified.
**BDD:** "As a scheduling admin, I can create teams of providers and see combined availability across all team members."

**Advanced Code Patterns:**
- **Availability Aggregation Strategy Pattern**: Use strategy pattern for different aggregation algorithms (union, intersection, weighted) to combine provider schedules.
- **Team Cache Invalidation**: Implement cache-aside pattern for team availability with fine-grained invalidation (only invalidate when a provider in the team updates their schedule).
- **Permission Decorator**: Use decorator pattern to wrap team operations with permission checks without cluttering business logic.
- **Event-Driven Team Updates**: Publish TeamAvailabilityChanged domain events when team composition or member schedules change.

**Anti-Patterns:**
- ❌ **N+1 Query Problem**: Don't query each provider's schedule individually; use batch queries with proper joins.
- ❌ **Recursive Role Lookup**: Avoid recursive database queries for role inheritance; flatten role permissions at team membership level.
- ❌ **Synchronous Availability Calculation**: Don't calculate availability on every request; pre-compute and cache with smart invalidation.
- ❌ **Team Membership Direct Deletion**: Don't hard-delete team memberships; use soft delete with audit trail to preserve assignment history.

**Rules to Follow:**
- **RBAC‑025**: Implement team-level RBAC with role inheritance from organization defaults (enterprise pattern).
- **CACHE‑007**: Cache team availability for 5 minutes; invalidate when any member's schedule changes.
- **DDD‑018**: Team aggregate root manages team membership lifecycle; provider entities are value objects referenced by ID.
- **TDD‑031**: Mock provider schedules in tests; don't depend on actual scheduling API availability.
- **PERF‑042**: Use materialized views or cached aggregates for team performance metrics; calculate asynchronously.

**Subtasks:**
- [ ] TEAM‑001.1: Implement team creation and management UI. (AGENT) – `src/components/teams/TeamManager.tsx`  
  **verification:** Teams can be created, configured, and managed.
- [ ] TEAM‑001.2: Add team role and permission management. (AGENT) – `src/components/teams/TeamRoles.tsx`  
  **verification:** Team roles control access to scheduling features.
- [ ] TEAM‑001.3: Implement team availability aggregation. (AGENT) – `src/components/teams/TeamAvailability.tsx`  
  **verification:** Team availability shows aggregated schedule.
- [ ] TEAM‑001.4: Add team performance metrics dashboard. (AGENT) – `src/components/teams/TeamMetrics.tsx`  
  **verification:** Team metrics display correctly.
- **Depends on:** API‑APPT‑010.
- **Blocks:** TEAM‑002.

### [ ] TEAM‑002: Advanced Assignment Algorithms
**Status:** ⏳ Not Started  
**Depends on:** TEAM‑001, API‑APPT‑010.  
**Definition of Done:**
- Load‑balanced assignment algorithms considering provider workload.
- Skill‑based matching for specialised appointment types.
- Geographic and timezone‑based assignment optimisation.
- Provider preference and availability constraint handling.
- Assignment analytics and optimisation recommendations.

**Deep Module:**
- Assignment optimization is a deep module: simple interface (assignAppointment(appointmentId, constraints)) but complex multi-dimensional optimization balancing workload fairness, skill match quality, geographic proximity, timezone alignment, and provider preferences. The algorithm uses weighted scoring with configurable priorities.
- Constraint satisfaction engine handles conflicting requirements (e.g., client requests specific provider but that provider is at capacity) with fallback strategies and graceful degradation.

**DDD:** Assignment algorithms as domain services in the Appointments bounded context; operates on Team aggregates and Provider value objects. Assignment decisions produce AssignmentMade domain events.
**TDD:** Unit test verifying that 100 appointments distributed across 5 providers with varying workloads results in balanced distribution (standard deviation < 20%) while respecting skill requirements.
**BDD:** "As a scheduler, appointments are automatically assigned to the most appropriate available provider based on skills, workload, and location."

**Advanced Code Patterns:**
- **Strategy Pattern for Assignment Algorithms**: Implement multiple assignment strategies (round-robin, weighted-score, greedy-optimization) selectable via configuration.
- **Constraint Satisfaction Framework**: Use constraint programming approach with soft constraints (preferences) and hard constraints (required skills, availability).
- **Multi-Criteria Scoring**: Weighted scoring algorithm combining workload, skills, geography, and ratings with configurable weights per organization.
- **Assignment Cache Warming**: Pre-compute provider availability scores in background job to make assignment decisions faster.

**Anti-Patterns:**
- ❌ **Naive Round-Robin**: Don't assign purely by rotation; consider skills and workload to avoid poor client experiences.
- ❌ **Synchronous Optimization**: Don't run complex optimization algorithms synchronously during booking; use pre-computed scores.
- ❌ **Ignoring Constraint Conflicts**: Don't fail silently when constraints conflict; implement priority-based conflict resolution.
- ❌ **Hard-Coded Weighting**: Don't hard-code scoring weights; make them configurable per organization.

**Rules to Follow:**
- **ALGO‑031**: Assignment algorithm must complete within 500ms; use pre-computed provider scores.
- **CACHE‑011**: Cache provider workload and availability scores; refresh every 5 minutes or on change.
- **DDD‑022**: Assignment decisions are domain events; publish AssignmentMade with reason (skill match, workload balance, etc.).
- **TDD‑035**: Test assignment fairness with statistical tests; ensure no provider gets >150% average load.
- **PERF‑048**: Use batch optimization for bulk assignments; process in background job.

**Subtasks:**
- [ ] TEAM‑002.1: Implement load‑balanced assignment algorithms. (AGENT) – `services/teams/LoadBalancer.ts`  
  **verification:** Load balancing distributes appointments evenly.
- [ ] TEAM‑002.2: Add skill‑based matching system. (AGENT) – `services/teams/SkillMatcher.ts`  
  **verification:** Skills match appointment requirements correctly.
- [ ] TEAM‑002.3: Implement geographic and timezone optimisation. (AGENT) – `services/teams/GeoOptimizer.ts`  
  **verification:** Geographic constraints are respected.
- [ ] TEAM‑002.4: Add assignment analytics and recommendations. (AGENT) – `services/teams/AssignmentAnalytics.ts`  
  **verification:** Analytics provide actionable insights.
- **Depends on:** TEAM‑001.
- **Blocks:** TEAM‑003.

### [ ] TEAM‑003: Provider Collaboration Features
**Status:** ⏳ Not Started  
**Depends on:** TEAM‑002, API‑APPT‑010.  
**Definition of Done:**
- Provider handoff and collaboration workflows.
- Shared appointment management with provider permissions.
- Team communication and notification systems.
- Coverage management for provider absences.
- Team scheduling calendars and coordination tools.

**Deep Module:**
- Provider handoff workflow is a deep module: simple interface (initiateHandoff(appointmentId, fromProviderId, toProviderId)) but encapsulates complex state machine logic for handoff lifecycle (requested → accepted → in-progress → completed), conflict detection (both providers modifying simultaneously), and rollback procedures on failure.
- Coverage management is deep: handles absence planning with cascading coverage assignments, coverage gap detection, and automatic reassignment of affected appointments when coverage changes.

**DDD:** Collaboration features within Appointments bounded context; Handoff aggregate with states (Requested, Accepted, InProgress, Completed, Cancelled). Coverage planning uses SchedulingPolicy entity.
**TDD:** Unit test verifying that handoff state machine transitions correctly through all states and publishes appropriate domain events at each transition.
**BDD:** "As a provider, I can hand off an appointment to a colleague and track the handoff status."

**Advanced Code Patterns:**
- **State Machine for Handoffs**: Implement handoff lifecycle as explicit state machine with entry/exit actions and transition guards.
- **Optimistic Locking**: Use version-based optimistic locking for shared appointment editing to handle concurrent modifications.
- **Coverage Graph Algorithm**: Model coverage relationships as directed graph; detect cycles and gaps algorithmically.
- **CQRS for Collaboration**: Separate read models for handoff status queries from command processing for better scalability.

**Anti-Patterns:**
- ❌ **Implicit State Management**: Don't track handoff state implicitly through boolean flags; use explicit state machine.
- ❌ **Last-Write-Wins**: Don't allow last write to win on shared appointments; implement proper conflict detection.
- ❌ **Broadcast Notifications**: Don't notify all team members for every handoff; use targeted notifications based on roles.
- ❌ **Synchronous Handoff Processing**: Don't process handoffs synchronously during peak hours; queue and process asynchronously.

**Rules to Follow:**
- **SM‑017**: Implement handoff state machine with explicit states, transitions, and entry/exit actions.
- **CQRS‑012**: Use CQRS pattern for collaboration features; separate read/write models with eventual consistency.
- **DDD‑025**: Handoff aggregate encapsulates all handoff state transitions; external code triggers transitions via domain methods.
- **TDD‑038**: Test concurrent handoff scenarios; verify conflict detection and resolution work correctly.
- **NOTIFY‑015**: Send targeted notifications only to affected providers; avoid broadcast noise.

**Subtasks:**
- [ ] TEAM‑003.1: Implement provider handoff workflows. (AGENT) – `src/components/teams/HandoffManager.tsx`  
  **verification:** Provider handoffs work smoothly.
- [ ] TEAM‑003.2: Add shared appointment management. (AGENT) – `src/components/teams/SharedAppointments.tsx`  
  **verification:** Shared appointments are managed correctly.
- [ ] TEAM‑003.3: Implement team communication system. (AGENT) – `src/components/teams/TeamChat.tsx`  
  **verification:** Team communication works effectively.
- [ ] TEAM‑003.4: Add coverage management for absences. (AGENT) – `src/components/teams/CoverageManager.tsx`  
  **verification:** Coverage planning handles absences properly.
- **Depends on:** TEAM‑002.
- **Blocks:** TEAM‑004.

### [ ] TEAM‑004: Team Performance Analytics
**Status:** ⏳ Not Started  
**Depends on:** TEAM‑003, ENT‑ANALYTICS‑001.  
**Definition of Done:**
- Team productivity metrics and KPIs.
- Individual provider performance tracking.
- Team scheduling efficiency analysis.
- Client satisfaction and feedback analytics.
- Performance improvement recommendations and insights.

**Deep Module:**
- Performance aggregation engine is a deep module: simple interface (getTeamMetrics(teamId, period)) but complex implementation handling data from multiple sources (appointments, feedback, completions), time-series aggregation, statistical normalization, and trend analysis with configurable KPI weights.
- Recommendation engine uses ML-inspired heuristics to identify patterns (overbooking certain providers, underutilization of others) and suggest actionable improvements.

**DDD:** Analytics as domain service in Appointments bounded context; queries Team and Provider aggregates; produces AnalyticsReport value objects. Metrics calculation is read-model optimized.
**TDD:** Unit test verifying that metrics calculation correctly aggregates data across multiple dimensions (time, provider, appointment type) with proper statistical accuracy.
**BDD:** "As a team manager, I can view comprehensive performance analytics and receive recommendations for improvement."

**Advanced Code Patterns:**
- **Materialized View Pattern**: Pre-compute common metrics queries in materialized views refreshed periodically.
- **CQRS for Analytics**: Separate read-optimized analytics models from operational transaction models.
- **Time-Series Aggregation**: Use time-series data structures for efficient period-over-period comparison.
- **Recommendation Pipeline**: Implement pluggable recommendation pipeline allowing different algorithms for different metric types.

**Anti-Patterns:**
- ❌ **Real-Time Analytics on Transactional DB**: Don't run complex analytics queries against operational database; use read replicas or analytics warehouse.
- ❌ **Blocking Analytics Calculation**: Don't calculate analytics synchronously during page load; use background jobs and cached results.
- ❌ **Hard-Coded KPI Definitions**: Don't hard-code KPI formulas; make them configurable per organization.
- ❌ **Ignoring Data Freshness**: Don't serve stale analytics without indicating data age to users.

**Rules to Follow:**
- **ANALYTICS‑023**: Calculate analytics asynchronously in background jobs; cache results for fast retrieval.
- **CQRS‑015**: Use separate read models for analytics; optimize for query performance over write consistency.
- **TDD‑041**: Test analytics calculations with known datasets; verify statistical accuracy of aggregations.
- **PERF‑052**: Use materialized views or columnar storage for analytics data; target <2s query time.
- **CONFIG‑018**: Make KPI definitions and weights configurable per organization via admin interface.

**Subtasks:**
- [ ] TEAM‑004.1: Implement team productivity metrics. (AGENT) – `src/components/teams/TeamProductivity.tsx`  
  **verification:** Productivity metrics are accurate and useful.
- [ ] TEAM‑004.2: Add individual provider performance tracking. (AGENT) – `src/components/teams/ProviderPerformance.tsx`  
  **verification:** Provider performance is tracked comprehensively.
- [ ] TEAM‑004.3: Implement scheduling efficiency analysis. (AGENT) – `src/components/teams/SchedulingEfficiency.tsx`  
  **verification:** Efficiency analysis provides actionable insights.
- [ ] TEAM‑004.4: Add client satisfaction analytics. (AGENT) – `src/components/teams/ClientSatisfaction.tsx`  
  **verification:** Client feedback is collected and analysed.
- **Depends on:** TEAM‑003.
- **Blocks:** ENT‑SCHED‑001.

---

## Enterprise Scheduling

### [ ] ENT‑SCHED‑001: Complex Recurring Patterns
**Status:** ⏳ Not Started  
**Depends on:** TEAM‑004, API‑APPT‑010.  
**Definition of Done:**
- Advanced recurring appointment patterns (weekly, monthly, custom).
- Exception handling for recurring appointments.
- Recurrence pattern editing and modification.
- Bulk operations on recurring appointment series.
- Recurrence conflict resolution and management.

**Deep Module:**
- Recurrence engine is a deep module: simple interface (generateOccurrences(pattern, startDate, endDate)) but complex implementation handling RRULE parsing (RFC 5545), timezone-aware expansion, exception handling (EXDATE, RDATE), and pattern modification semantics (this-and-future vs this-only).
- Conflict detection is deep: evaluates conflicts across expanded recurrence sets efficiently without materializing all occurrences; uses lazy evaluation with early termination.

**DDD:** Recurring appointments within Appointments bounded context; RecurringAppointment aggregate containing RecurrenceRule value object and Exception collection. Expansion is a domain service.
**TDD:** Unit test verifying that RRULE "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20241231" correctly expands to 156 occurrences with proper handling of timezone transitions.
**BDD:** "As a scheduler, I can create complex recurring appointment patterns with exceptions and modifications."

**Advanced Code Patterns:**
- **Iterator Pattern for Recurrence**: Implement recurrence expansion as lazy iterator to avoid memory explosion on infinite recurrences.
- **RRULE Parser with Validation**: Parse and validate RFC 5545 RRULE with helpful error messages for malformed rules.
- **Exception Tracking**: Store exceptions (cancellations, modifications) separately from base pattern; apply during expansion.
- **Bulk Operation Transaction**: Wrap bulk operations on recurring series in database transaction with rollback capability.

**Anti-Patterns:**
- ❌ **Materializing Infinite Recurrences**: Don't generate all occurrences upfront for unbounded recurrences; use lazy expansion.
- ❌ **Storing Every Occurrence**: Don't store individual records for each occurrence; store pattern and exceptions only.
- ❌ **Ignoring Timezone DST**: Don't ignore daylight saving time transitions; handle ambiguous and non-existent times correctly.
- ❌ **Lossy Pattern Modifications**: Don't lose original pattern when modifying "this and future"; keep original for audit.

**Rules to Follow:**
- **RECURR‑012**: Implement RFC 5545 compliant RRULE parsing with full test coverage.
- **PERF‑028**: Use lazy iterator for recurrence expansion; never materialize infinite recurrences in memory.
- **TDD‑025**: Test recurrence expansion across DST boundaries and leap years.
- **DDD‑015**: Store recurrence pattern and exceptions separately; compute occurrences on demand.
- **TRANS‑008**: Wrap bulk operations in transactions with proper rollback on failure.

**Subtasks:**
- [ ] ENT‑SCHED‑001.1: Implement advanced recurring patterns. (AGENT) – `src/components/appointments/RecurringPatterns.tsx`  
  **verification:** Complex recurring patterns work correctly.
- [ ] ENT‑SCHED‑001.2: Add exception handling for recurring appointments. (AGENT) – `src/components/appointments/RecurringExceptions.tsx`  
  **verification:** Exceptions are handled properly.
- [ ] ENT‑SCHED‑001.3: Implement bulk operations on recurring series. (AGENT) – `src/components/appointments/RecurringBulkOps.tsx`  
  **verification:** Bulk operations work efficiently.
- [ ] ENT‑SCHED‑001.4: Add recurrence conflict resolution. (AGENT) – `src/components/appointments/RecurringConflicts.tsx`  
  **verification:** Conflicts are resolved intelligently.
- **Depends on:** TEAM‑004.
- **Blocks:** ENT‑SCHED‑002.

### [ ] ENT‑SCHED‑002: Resource‑Based Scheduling
**Status:** ⏳ Not Started  
**Depends on:** ENT‑SCHED‑001, API‑APPT‑010.  
**Definition of Done:**
- Resource availability management (rooms, equipment, facilities).
- Resource‑based appointment constraints and requirements.
- Resource scheduling optimisation and conflict resolution.
- Resource utilisation analytics and reporting.
- Resource booking and reservation systems.

**Deep Module:**
- Resource scheduling engine is a deep module: simple interface (bookResource(resourceId, timeRange, appointmentId)) but complex implementation handling multi-resource constraints, hierarchical resources (rooms within buildings), resource substitution rules, and optimization across competing demands.
- Resource conflict resolution uses constraint satisfaction with backtracking to find feasible schedules when conflicts exist.

**DDD:** Resource management within Appointments bounded context; Resource aggregate with ResourceType classification. Multi-resource appointments use ResourceRequirement value objects.
**TDD:** Unit test verifying that booking a room requiring specific equipment correctly enforces equipment availability and rejects when equipment unavailable.
**BDD:** "As a scheduler, I can book rooms and equipment alongside appointments with automatic conflict detection."

**Advanced Code Patterns:**
- **Resource Hierarchy**: Model resources hierarchically (building → floor → room → equipment) with inheritance of availability.
- **Constraint Satisfaction**: Use CSP solver for multi-resource scheduling with soft and hard constraints.
- **Resource Pool Pattern**: Manage shared resources via pool with checkout/checkin semantics.
- **Optimistic Resource Booking**: Use optimistic locking with conflict detection for concurrent resource booking attempts.

**Anti-Patterns:**
- ❌ **Resource Overbooking**: Don't allow double-booking without explicit intent; enforce strict conflict detection.
- ❌ **Ignoring Resource Dependencies**: Don't book a room without checking its required equipment is also available.
- ❌ **Synchronous Resource Search**: Don't search for available resources synchronously during booking; use pre-indexed availability.
- ❌ **Resource Data Duplication**: Don't duplicate resource info in appointment records; reference by ID with join.

**Rules to Follow:**
- **RESRC‑018**: Enforce resource hierarchy with inherited availability; child resources unavailable when parent unavailable.
- **CONSTR‑012**: Use constraint satisfaction for multi-resource booking with backtracking on conflicts.
- **TDD‑028**: Test multi-resource booking scenarios including cascading unavailability.
- **DDD‑021**: Resource aggregate manages booking state; external code references resources by ID only.
- **CACHE‑015**: Cache resource availability index; refresh when bookings made or cancelled.

**Subtasks:**
- [ ] ENT‑SCHED‑002.1: Implement resource availability management. (AGENT) – `src/components/resources/ResourceManager.tsx`  
  **verification:** Resources are managed effectively.
- [ ] ENT‑SCHED‑002.2: Add resource‑based appointment constraints. (AGENT) – `src/components/resources/ResourceConstraints.tsx`  
  **verification:** Resource constraints are enforced properly.
- [ ] ENT‑SCHED‑002.3: Implement resource scheduling optimisation. (AGENT) – `src/components/resources/ResourceOptimizer.tsx`  
  **verification:** Resource scheduling is optimised.
- [ ] ENT‑SCHED‑002.4: Add resource utilisation analytics. (AGENT) – `src/components/resources/ResourceAnalytics.tsx`  
  **verification:** Resource utilisation is tracked accurately.
- **Depends on:** ENT‑SCHED‑001.
- **Blocks:** ENT‑SCHED‑003.

### [ ] ENT‑SCHED‑003: Enterprise Scheduling Rules
**Status:** ⏳ Not Started  
**Depends on:** ENT‑SCHED‑002, API‑APPT‑010.  
**Definition of Done:**
- Organisation‑wide scheduling policies and rules.
- Department‑specific scheduling constraints.
- Advanced booking rules and approval workflows.
- Scheduling compliance monitoring and enforcement.
- Policy violation detection and reporting.

**Deep Module:**
- Policy engine is a deep module: simple interface (validateBooking(appointment, context)) but complex implementation handling policy inheritance (org → dept → team), policy composition (multiple policies applying simultaneously), and conflict resolution when policies contradict.
- Approval workflow engine manages multi-stage approvals with escalation, delegation, and timeout handling.

**DDD:** Scheduling policies within Appointments bounded context; SchedulingPolicy aggregate with PolicyRule entities. Policy evaluation is a domain service using specification pattern.
**TDD:** Unit test verifying that conflicting policies (e.g., org requires 24h notice, dept allows 4h) resolve correctly with department policy taking precedence.
**BDD:** "As an admin, I can define organization-wide scheduling policies that automatically enforce compliance."

**Advanced Code Patterns:**
- **Specification Pattern**: Implement scheduling rules as composable specifications (minimum notice, maximum duration, etc.).
- **Policy Chain of Responsibility**: Chain policy validators with precedence order for inheritance handling.
- **Approval State Machine**: Model approval workflows as state machines with transitions for approve, reject, escalate, delegate.
- **Policy Evaluation Cache**: Cache policy evaluation results for identical contexts to improve performance.

**Anti-Patterns:**
- ❌ **Hard-Coded Rules**: Don't hard-code scheduling rules in code; use configurable policy engine.
- ❌ **Silent Policy Violations**: Don't silently ignore policy violations; explicitly reject with clear messages.
- ❌ **Blocking Approval**: Don't block all bookings pending approval; use async workflow with temporary holds.
- ❌ **No Policy Audit Trail**: Don't apply policies without logging; maintain full audit trail of policy enforcement.

**Rules to Follow:**
- **POLICY‑025**: Implement scheduling policies as composable specifications with clear precedence rules.
- **WORKFLOW‑015**: Use state machine for approval workflows with explicit states and transitions.
- **TDD‑032**: Test policy inheritance scenarios with multiple levels of organization hierarchy.
- **DDD‑024**: SchedulingPolicy aggregate manages policy lifecycle; rules are value objects.
- **AUDIT‑012**: Log all policy evaluations and enforcement actions for compliance reporting.

**Subtasks:**
- [ ] ENT‑SCHED‑003.1: Implement organisation‑wide scheduling policies. (AGENT) – `src/components/policies/SchedulingPolicies.tsx`  
  **verification:** Policies are enforced consistently.
- [ ] ENT‑SCHED‑003.2: Add department‑specific constraints. (AGENT) – `src/components/policies/DepartmentConstraints.tsx`  
  **verification:** Department constraints are respected.
- [ ] ENT‑SCHED‑003.3: Implement approval workflows for scheduling. (AGENT) – `src/components/policies/ApprovalWorkflows.tsx`  
  **verification:** Approval workflows function correctly.
- [ ] ENT‑SCHED‑003.4: Add compliance monitoring and reporting. (AGENT) – `src/components/policies/ComplianceMonitor.tsx`  
  **verification:** Compliance is monitored effectively.
- **Depends on:** ENT‑SCHED‑002.
- **Blocks:** ENT‑PERM‑001.

---

## Enterprise Appointments (Calendly‑Style)

### [ ] ENT‑APPT‑001: Managed Events (Admin Centre)
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑011 (event type API), ENT‑SCHED‑003.  
**Definition of Done:**
- Admin‑controlled event type sections (availability, location, custom questions) that are locked from individual provider overrides.
- When an admin updates a managed event section, changes propagate to all team members using that event type.
- Interface shows which sections are "managed" (locked) vs. "personal" (customisable by each provider).
- Audit log of admin changes to managed event types.

**DDD:** Enterprise governance over scheduling configuration; centralised policy enforcement in the Appointments bounded context.  
**TDD:** Component test verifying that managed sections are disabled for non‑admin users.  
**BDD:** "As an admin, I can lock event type sections so that team members cannot change them."

**Subtasks:**
- [ ] ENT‑APPT‑001.1: Add "managed" flag to event type sections in the data model (extension of event type schema). (AGENT)  
  **verification:** Database migration adds managed section metadata.
- [ ] ENT‑APPT‑001.2: Implement admin UI for locking/unlocking event type sections. (AGENT) – `src/components/appointments/ManagedEventsAdmin.tsx`  
  **verification:** Admin can toggle sections as managed; changes sync to team members.
- [ ] ENT‑APPT‑001.3: Implement provider‑facing UI that respects managed section locks. (AGENT)  
  **verification:** Non‑admin users see managed sections as read‑only with lock icon.
- [ ] ENT‑APPT‑001.4: Wire change propagation and audit logging. (AGENT)  
  **verification:** Admin changes logged; team members' event types updated.
- **Depends on:** API‑APPT‑011.
- **Blocks:** ENT‑APPT‑002.

### [ ] ENT‑APPT‑002: Organisation Admin Centre
**Status:** ⏳ Not Started  
**Depends on:** ENT‑APPT‑001.  
**Definition of Done:**
- Centralised administration dashboard for the entire organisation's scheduling:
  - User management: invite, deactivate, assign roles.
  - Group management: create teams/groups, assign event types and permissions.
  - Shared event type library visible to all groups.
  - Organisation‑wide workflow and routing form management.
  - Audit and compliance reporting.

**DDD:** Admin Centre consolidates all Appointments context administration.  
**TDD:** Integration test verifying that group‑level permissions restrict event type access.  
**BDD:** "As an admin, I can manage all users and groups from one place."

**Subtasks:**
- [ ] ENT‑APPT‑002.1: Build Admin Centre dashboard layout with navigation. (AGENT) – `src/components/appointments/AdminCentre.tsx`  
  **verification:** Dashboard renders with all management sections.
- [ ] ENT‑APPT‑002.2: Implement user and group management views. (AGENT)  
  **verification:** Users can be invited, assigned to groups, and deactivated.
- [ ] ENT‑APPT‑002.3: Build shared event type and workflow management. (AGENT)  
  **verification:** Event types can be shared with groups; workflows assigned per group.
- [ ] ENT‑APPT‑002.4: Add audit and compliance reporting section. (AGENT)  
  **verification:** Admin can view audit logs filtered by user and action.
- **Depends on:** ENT‑APPT‑001.
- **Blocks:** ENT‑APPT‑003.

### [ ] ENT‑APPT‑003: Scheduling Analytics Dashboard
**Status:** ⏳ Not Started  
**Depends on:** ENT‑APPT‑002, API‑ANALYTICS‑004 (analytics API).  
**Definition of Done:**
- Organisation‑wide scheduling metrics:
  - Booking volume (daily, weekly, monthly trends).
  - No‑show rate by provider and event type.
  - Most popular time slots and event types.
  - Team utilisation rates.
  - Routing form conversion rates.
  - Revenue from paid events.
- Exportable reports (CSV/PDF).  
**Note:** This dashboard is specific to the Appointments context (Calendly‑style). It co‑exists with `ENT‑ANALYTICS‑001` which covers broader scheduling analytics across Projects and Teams.

**Subtasks:**
- [ ] ENT‑APPT‑003.1: Build scheduling analytics dashboard with metric cards and charts. (AGENT) – `src/components/appointments/SchedulingAnalytics.tsx`  
  **verification:** Dashboard displays all required metrics with time‑range filters.
- [ ] ENT‑APPT‑003.2: Wire to appointment‑aggregation API endpoints. (AGENT)  
  **verification:** Data loads correctly; charts render with real data.
- [ ] ENT‑APPT‑003.3: Add export functionality. (AGENT)  
  **verification:** Reports export as CSV and PDF.
- **Depends on:** ENT‑APPT‑002.

### [ ] ENT‑APPT‑004: Multi‑Location Support
**Status:** ⏳ Not Started  
**Depends on:** ENT‑APPT‑002, ENT‑SCHED‑002 (resource scheduling).  
**Definition of Done:**
- Extend event types with physical location management: rooms, floors, buildings.
- Location‑based routing: direct invitees to the correct location based on selected service or team.
- Room booking integrated with resource scheduling (check availability, book automatically).
- Location‑aware timezone handling for virtual vs. physical appointments.
- Location utilisation reporting.

**Subtasks:**
- [ ] ENT‑APPT‑004.1: Extend event type model with location configuration. (AGENT)  
  **verification:** Event types can have multiple physical locations configured.
- [ ] ENT‑APPT‑004.2: Implement location‑based routing in booking flow. (AGENT)  
  **verification:** Selecting a service routes to the correct location.
- [ ] ENT‑APPT‑004.3: Integrate room booking with resource scheduler. (AGENT)  
  **verification:** Booking an appointment also reserves the room.
- [ ] ENT‑APPT‑004.4: Add location utilisation dashboard. (AGENT)  
  **verification:** Reports show room usage and availability trends.
- **Depends on:** ENT‑APPT‑002, ENT‑SCHED‑002.

### [ ] ENT‑APPT‑005: Organisation‑Wide Scheduling Policies
**Status:** ⏳ Not Started  
**Depends on:** ENT‑APPT‑002.  
**Definition of Done:**
- Enforce org‑level rules across all event types:
  - Minimum advance notice (e.g., must book at least 4 hours ahead).
  - Maximum booking horizon (e.g., no bookings beyond 90 days).
  - Mandatory buffer times between appointments.
  - Required contact fields (e.g., phone number mandatory).
  - Cancellation window policies (e.g., must cancel 24 hours before).
- Policy changes propagate to all existing and new event types.
- Exception mechanism for specific event types or providers.

**Subtasks:**
- [ ] ENT‑APPT‑005.1: Extend booking rules schema with organisation‑level policies. (AGENT)  
  **verification:** Org‑level rules stored and applied globally.
- [ ] ENT‑APPT‑005.2: Implement policy enforcement in booking and cancellation flows. (AGENT)  
  **verification:** Booking attempts that violate org policies are rejected with clear messages.
- [ ] ENT‑APPT‑005.3: Build admin interface for policy configuration with exceptions. (AGENT)  
  **verification:** Admin can set global policies and add per‑event‑type exceptions.
- **Depends on:** ENT‑APPT‑002.

---

*End of Phase 8 Team Management & Enterprise Scheduling. See TODO-P8-DOCS.md for document features and TODO-P8-ENTERPRISE.md for cross-cutting enterprise features.*

# TODO-P2-APPOINTMENTS.md – Phase 2: Scheduling & Appointments Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Scheduling & Appointments bounded context for Phase 2: a Calendly-style appointment system with event types, routing forms, waitlists, meeting integrations, payment processing, and group scheduling. This context is now standalone, completely separate from Projects.

---

## Scheduling & Appointments Context (Calendly‑style, full context)

*This context is now a standalone bounded context, completely separate from Projects. The Scheduler tab in Projects is a PM‑owned feature (recurring work), not a read‑out of appointments. All tables here support the Calendly‑inspired appointment model: event types, routing forms, waitlists, no‑show tracking, etc.*

### [ ] DB‑APPT‑001: Define Appointments Table
**Status:** ⏳ Not Started  
**Blocks:** none  
**Blocked By:** DB‑ORG‑001  
**Definition of Done:** `lib/db/src/schema/appointments/appointments.ts` with:  
- `id` (uuid PK), `organization_id` (FK), `client_id` (FK to contacts, nullable initially – enforced after DB‑CRM‑002), `service_provider_id` (FK to users)  
- `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL)  
- `status` (enum: requested/confirmed/completed/cancelled)  
- `cancellation_reason` (text nullable)  
- `created_at`, `updated_at`  
- **Performance indexes:** `(organization_id, start_time)`, `(service_provider_id, status, start_time)`.  
- Soft delete: `deleted_at` (timestamp nullable).  
Zod schemas generated.

**DDD:** The Appointment aggregate root in the Appointments bounded context. There is no dependency on Projects; this context is fully autonomous. Cross-context foreign key to CRM contacts is justified because appointments represent scheduled interactions with external contacts that exist in the CRM bounded context - this is a deliberate architectural decision to avoid duplicating contact management across contexts.
**TDD:** Write schema test then implement.
**BDD:** Enables "Book an available time slot" scenarios from `appointments.feature`.
**Deep Module:** The appointments table is a shallow storage layer; the rich domain logic lives in the AppointmentService which handles booking rules, availability conflicts, and calendar integrations.
**Advanced Code Patterns:** Repository pattern with multi-tenancy support, factory methods for appointment creation, strategy pattern for different appointment types (one-on-one, group, collective).
**Anti-Patterns:** Avoid N+1 queries when loading appointments with related data; prevent cross-context data leakage by never exposing full contact objects from appointments API; avoid storing business logic in database triggers.
**Multi-Tenancy Anti-Patterns:** Never query appointments without organization_id filter; avoid shared sequences or UUIDs across tenants; prevent tenant data leakage through foreign key cascades.
**Rules to Follow:** All database operations must include organization_id in WHERE clauses; appointment status transitions must follow state machine rules; time zone handling must normalize to UTC; availability conflicts must be detected before booking.
**Out of Scope:** Recurring appointment series management (future phase), advanced scheduling algorithms, video conferencing integration.
**Size:** Appropriate - focused on core table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB‑APPT‑001.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑APPT‑001.2: Implement table with all columns, enums, and indexes. (AGENT)  
  **verification:** Test passes, `pnpm typecheck`.
- **Depends on:** DB‑ORG‑001, DB‑IDENTITY‑001 (users FK), DB‑CRM‑002 (contacts FK, later migration).

---

### [ ] DB‑APPT‑002: Define Availability Windows Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/availability_windows.ts` with:  
- `id` (uuid PK), `organization_id` (FK), `service_provider_id` (FK to users)  
- `start_time`, `end_time` (timestamps), `slot_duration` (int default 30)  
- `is_recurring` (boolean), `recurrence_rule` (text iCal RRULE nullable)  
- `max_appointments` (int default 1), `buffer_time` (int minutes default 0)  
- Soft delete: `deleted_at`.  
- Index on `(service_provider_id, start_time)`.

**DDD:** AvailabilityWindow is a value object within the Appointment aggregate, representing time slots when a service provider is available. Contains recurrence rules and booking constraints.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Service provider sets available hours" scenarios.
**Deep Module:** Shallow storage for recurrence rules; business logic for availability calculation lives in service layer.
**Advanced Code Patterns:** Value object pattern for time windows, strategy pattern for different recurrence types (daily, weekly, monthly), builder pattern for complex availability rules.
**Anti-Patterns:** Avoid storing calculated availability in database; prevent infinite recurrence loops; avoid timezone-specific storage (store in UTC).
**Multi-Tenancy Anti-Patterns:** Never query availability without organization_id filter; prevent cross-tenant availability exposure.
**Rules to Follow:** All queries must include organization_id; recurrence validation must prevent invalid RRULE formats; availability must respect provider's working hours; buffer times must be enforced.
**Out of Scope:** Complex availability patterns like split shifts, holiday-specific exceptions.
**Size:** Appropriate - focused table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-002.1: Write schema validation test – assert all columns, FK constraints, index on `(service_provider_id, start_time)`, and soft delete. (AGENT) – `lib/db/src/__tests__/availability-windows.test.ts`  
  **verification:** `pnpm test -- availability-windows.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB-APPT-002.2: Implement table with all columns, FK to users, and index. (AGENT) – `lib/db/src/schema/appointments/availability_windows.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB-APPT-002.3: Generate Zod schemas using `drizzle-zod`. (AGENT)  
  **verification:** Generated schemas compile and include all fields.
- **Depends on:** DB-ORG-001, DB-IDENTITY-001 (users FK).  
- **Blocks:** DB-APPT-004.

---

### [ ] DB‑APPT‑003: Define Booking Rules Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/booking_rules.ts` with:  
- `id` (uuid PK), `organization_id` (FK)  
- `min_advance_notice_hours`, `max_advance_booking_days`  
- `cancellation_policy` (JSONB default `{}`), `buffer_before_minutes`, `buffer_after_minutes`  
- `reminder_lead_time` (int default 30), `reminder_frequency` (enum)  
- GIN index on `cancellation_policy`.  
- Soft delete: `deleted_at`.

**DDD:** BookingRule is a value object containing business rules for appointment booking, cancellation policies, and reminder settings. Scoped per organization.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Configure booking policies" scenarios.
**Deep Module:** Shallow configuration storage; validation logic lives in service layer.
**Advanced Code Patterns:** Policy object pattern for booking rules, specification pattern for rule validation, observer pattern for reminder notifications.
**Anti-Patterns:** Avoid business logic in database constraints; prevent inconsistent policy states; avoid hard-coded policy limits.
**Multi-Tenancy Anti-Patterns:** Never query rules without organization_id filter; prevent cross-tenant policy exposure.
**Rules to Follow:** All operations must include organization_id; cancellation policies must be JSON-validated; reminder frequencies must be bounded; policy changes must not affect existing appointments.
**Out of Scope:** Dynamic pricing rules, advanced availability algorithms.
**Size:** Appropriate - focused table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-003.1: Write schema validation test – assert all columns, FK to organizations, GIN index on `cancellation_policy`, and soft delete. (AGENT) – `lib/db/src/__tests__/booking-rules.test.ts`  
  **verification:** `pnpm test -- booking-rules.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB-APPT-003.2: Implement table with all columns, FK, and GIN index. (AGENT) – `lib/db/src/schema/appointments/booking_rules.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB-APPT-003.3: Generate Zod schemas using `drizzle-zod`. (AGENT)  
  **verification:** Generated schemas compile and include all fields.
- [ ] DB-APPT-003.4: Test JSONB validation for `cancellation_policy` field. (AGENT)  
  **verification:** Zod schema correctly validates JSONB structure.
- **Depends on:** DB-ORG-001.  
- **Blocks:** API-APPT-003.

---

### [ ] DB‑APPT‑004: Add Client Foreign Key to Appointments
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑001, DB‑CRM‑002  
**DDD:** Cross-context foreign key justification: The client relationship represents a real-world connection between appointments and contacts. While contacts live in CRM context, appointments need to reference them to avoid data duplication and maintain data integrity. This FK is a deliberate bounded context bridge.
**TDD:** Write migration test then implement.
**BDD:** Enables "Appointment shows client information" scenarios.
**Deep Module:** Simple migration; enrichment logic lives in service layer.
**Advanced Code Patterns:** Migration pattern with rollback support, data validation pattern for FK constraints.
**Anti-Patterns:** Avoid cascading deletes that could affect CRM data; prevent orphaned appointment records.
**Multi-Tenancy Anti-Patterns:** Migration must preserve organization_id boundaries; prevent cross-tenant data mixing.
**Rules to Follow:** All migrations must be reversible; FK constraints must be validated before enabling; existing appointments without clients must be handled gracefully.
**Out of Scope:** Client data synchronization, bulk contact imports.
**Size:** Appropriate - focused migration.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

**Subtasks:**
- [ ] DB‑APPT‑004.1: Create migration to add foreign key constraint. (AGENT)  
  **verification:** `drizzle-kit generate` produces migration with ALTER TABLE ADD CONSTRAINT.
- [ ] DB‑APPT‑004.2: Test migration on fresh database. (AGENT)  
  **verification:** Migration applies successfully; foreign key enforced.
- **Depends on:** DB‑APPT‑001, DB‑CRM-002.

---

### [ ] DB‑APPT‑005: Define External Calendar Connections Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/calendar_connections.ts` with:  
- `id` (uuid PK), `organization_id` (FK), `user_id` (FK to users), `provider` (enum: google/outlook/apple)  
- `external_calendar_id` (text), `access_token` (text encrypted), `refresh_token` (text encrypted)  
- `sync_status` (enum: active/paused/error), `last_sync_at` (timestamp), `sync_error` (text nullable)  
- `default_availability_source` (boolean), `deleted_at` (soft delete), timestamps.  
**Indexes:** `(user_id, provider)`, `(organization_id, sync_status)`.  
**Security:** Tokens encrypted at rest using environment key.

**DDD:** CalendarConnection is an external integration aggregate that stores encrypted credentials for third-party calendar services. Each connection belongs to a specific user within an organization.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Connect Google Calendar" scenarios.
**Deep Module:** Shallow storage for encrypted tokens; sync logic lives in integration services.
**Advanced Code Patterns:** Adapter pattern for different calendar providers, proxy pattern for token encryption, observer pattern for sync status updates.
**Anti-Patterns:** Never store plain text tokens; avoid synchronous API calls in database operations; prevent token leakage through logs.
**Multi-Tenancy Anti-Patterns:** Never query connections without organization_id filter; prevent cross-tenant token exposure; encrypt tokens per-organization.
**Rules to Follow:** All operations must include organization_id; tokens must be encrypted at rest; sync errors must be logged without exposing sensitive data; refresh tokens must be handled securely.
**Out of Scope:** Real-time bi-directional sync, calendar event conflict resolution.
**Size:** Appropriate - focused table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-005.1: Write schema validation test – assert all columns, FK constraints, encryption fields, and indexes. (AGENT) – `lib/db/src/__tests__/calendar-connections.test.ts`  
  **verification:** `pnpm test -- calendar-connections.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB-APPT-005.2: Implement table with encryption-ready token fields. (AGENT) – `lib/db/src/schema/appointments/calendar_connections.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB-APPT-005.3: Generate Zod schemas with token redaction. (AGENT)  
  **verification:** Generated schemas exclude token fields from responses.
- [ ] DB-APPT-005.4: Test encryption/decryption utilities for tokens. (AGENT)  
  **verification:** Token encryption/decryption works end-to-end.
- **Depends on:** DB-ORG-001, DB-IDENTITY-001.
- **Blocks:** API-APPT-006.

---

### [ ] DB‑APPT‑006: Define Meeting Integrations Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/meeting_integrations.ts` with:  
- `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK to appointments)  
- `provider` (enum: zoom/teams/meet), `external_meeting_id` (text), `join_url` (text)  
- `meeting_password` (text nullable encrypted), `host_email` (text), `recording_url` (text nullable)  
- `status` (enum: scheduled/started/ended/cancelled), `created_at`, `updated_at`.  
**Indexes:** `(appointment_id)`, `(organization_id, provider)`, `(external_meeting_id)`.

**DDD:** MeetingIntegration is a value object that links appointments to external meeting services. Stores meeting metadata and join information.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Automatically create Zoom meeting" scenarios.
**Deep Module:** Shallow storage for meeting metadata; integration logic lives in external services.
**Advanced Code Patterns:** Factory pattern for different meeting providers, strategy pattern for meeting creation, observer pattern for status updates.
**Anti-Patterns:** Avoid storing meeting passwords in plain text; prevent redundant meeting creation; avoid storing large meeting recordings in database.
**Multi-Tenancy Anti-Patterns:** Never query integrations without organization_id filter; prevent cross-tenant meeting access.
**Rules to Follow:** All operations must include organization_id; meeting passwords must be encrypted; join URLs must be validated; status changes must be audited.
**Out of Scope:** Meeting recording management, advanced meeting analytics.
**Size:** Appropriate - focused table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-006.1: Write schema validation test – assert all columns, FK to appointments, and indexes. (AGENT) – `lib/db/src/__tests__/meeting-integrations.test.ts`  
  **verification:** `pnpm test -- meeting-integrations.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB-APPT-006.2: Implement table with all columns and FK constraints. (AGENT) – `lib/db/src/schema/appointments/meeting_integrations.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB-APPT-006.3: Generate Zod schemas with password redaction. (AGENT)  
  **verification:** Generated schemas exclude password fields from responses.
- [ ] DB-APPT-006.4: Test meeting URL validation. (AGENT)  
  **verification:** URL validation works for join URLs.
- **Depends on:** DB-APPT-001, DB-ORG-001.
- **Blocks:** API-APPT-007.

---

### [ ] DB‑APPT‑007: Define Payment Transactions Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/payment_transactions.ts` with:  
- `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK to appointments)  
- `amount_cents` (int), `currency` (text default 'USD'), `status` (enum: pending/succeeded/failed/refunded)  
- `payment_method` (enum: card/bank/transfer), `stripe_payment_intent_id` (text nullable)  
- `refunded_amount_cents` (int default 0), `refund_reason` (text nullable)  
- `processed_at` (timestamp nullable), `failure_reason` (text nullable), `created_at`, `updated_at`.  
**Indexes:** `(appointment_id)`, `(organization_id, status)`, `(stripe_payment_intent_id)`.

**DDD:** PaymentTransaction is a financial aggregate that tracks payment processing for appointments. Supports Stripe integration with proper audit trails.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Collect payment for appointment" scenarios.
**Deep Module:** Shallow storage for financial transactions; payment logic lives in payment services.
**Advanced Code Patterns:** Command pattern for payment processing, strategy pattern for different payment methods, observer pattern for payment status updates.
**Anti-Patterns:** Never store raw payment method details; prevent inconsistent financial states; avoid hardcoded payment amounts.
**Multi-Tenancy Anti-Patterns:** Never query transactions without organization_id filter; prevent cross-tenant financial data exposure.
**Rules to Follow:** All operations must include organization_id; amounts must be stored in cents; refund amounts must never exceed original amounts; payment status transitions must be validated.
**Out of Scope:** Subscription management, advanced refund workflows.
**Size:** Appropriate - focused table definition.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-007.1: Write schema validation test – assert all columns, FK constraints, and financial fields. (AGENT) – `lib/db/src/__tests__/payment-transactions.test.ts`  
  **verification:** `pnpm test -- payment-transactions.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB-APPT-007.2: Implement table with financial precision and audit fields. (AGENT) – `lib/db/src/schema/appointments/payment_transactions.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB-APPT-007.3: Generate Zod schemas with amount validation. (AGENT)  
  **verification:** Generated schemas validate amounts are positive integers.
- [ ] DB-APPT-007.4: Test refund calculation logic. (AGENT)  
  **verification:** Refund amounts never exceed original amounts.
- **Depends on:** DB-APPT-001, DB-ORG-001.
- **Blocks:** API-APPT-008.

---

### [ ] DB‑APPT‑008: Define Meeting Polls & Votes Tables
**Status:** ⏳ Not Started  
**Definition of Done:** Two tables for group scheduling:  
**meeting_polls** (`lib/db/src/schema/appointments/meeting_polls.ts`):  
- `id` (uuid PK), `organization_id` (FK), `creator_id` (FK to users), `title` (text)  
- `description` (text nullable), `status` (enum: active/closed), `selected_option_id` (uuid nullable)  
- `deadline_at` (timestamp nullable), `created_at`, `updated_at`.  

**poll_options** (`lib/db/src/schema/appointments/poll_options.ts`):  
- `id` (uuid PK), `poll_id` (FK to meeting_polls), `start_time` (timestamp), `end_time` (timestamp)  
- `votes_count` (int default 0), `selected` (boolean default false), `created_at`.  

**poll_votes** (`lib/db/src/schema/appointments/poll_votes.ts`):  
- `id` (uuid PK), `poll_id` (FK to meeting_polls), `option_id` (FK to poll_options)  
- `voter_id` (FK to users), `voter_email` (text), `created_at`.  

**Indexes:** `(creator_id, status)`, `(poll_id)` on options, `(voter_id, poll_id)` on votes.

**DDD:** MeetingPoll is a scheduling aggregate that enables group scheduling through voting. Contains options and votes for time slot selection.
**TDD:** Write schema validation test then implement.
**BDD:** Supports "Schedule meeting with multiple participants" scenarios.
**Deep Module:** Complex relational structure with voting logic; business rules for poll closure and winner selection.
**Advanced Code Patterns:** Aggregate pattern with child entities, state machine pattern for poll status, strategy pattern for different voting rules.
**Anti-Patterns:** Prevent duplicate voting; avoid inconsistent vote counts; prevent poll modification after closure.
**Multi-Tenancy Anti-Patterns:** Never query polls without organization_id filter; prevent cross-tenant poll access.
**Rules to Follow:** All operations must include organization_id; each voter can only vote once per poll; vote counts must be atomic; poll closure must be irreversible.
**Out of Scope:** Advanced voting systems, weighted voting, anonymous polls.
**Size:** Large task - involves three related tables with complex relationships. Should be split into smaller tasks.
**Subtasks:** All subtasks include specific file paths and executable verification commands.

### Subtasks:
- [ ] DB-APPT-008.1: Write schema validation test – assert all tables, FK constraints, and indexes. (AGENT) – `lib/db/src/__tests__/meeting-polls.test.ts`  
  **verification:** `pnpm test -- meeting-polls.test.ts` fails (tables not yet created), then passes after implementation.
- [ ] DB-APPT-008.2: Implement three related tables with proper relationships. (AGENT) – `lib/db/src/schema/appointments/meeting_polls.ts`, `poll_options.ts`, `poll_votes.ts`  
  **verification:** Tests pass, `pnpm typecheck` clean.
- [ ] DB-APPT-008.3: Generate Zod schemas for all three tables. (AGENT)  
  **verification:** Generated schemas compile and include all relationships.
- [ ] DB-APPT-008.4: Test vote counting and selection logic. (AGENT)  
  **verification:** Vote counts update correctly and selection enforcement works.
- **Depends on:** DB-ORG-001, DB-IDENTITY-001.
- **Blocks:** API-APPT-009.

---

### [ ] DB‑APPT‑009: Define Event Types Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/event_types.ts` exports `eventTypes` table:  
- `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL)  
- `type` (enum: one‑on‑one/round‑robin/collective/group)  
- `duration_minutes` (int NOT NULL), `buffer_before_minutes` (int default 0), `buffer_after_minutes` (int default 0)  
- `daily_booking_limit` (int nullable) – null means unlimited  
- `location_type` (enum: physical/virtual/phone), `location_value` (text nullable)  
- `is_secret` (boolean default false) – accessible only by direct link  
- `cancellation_policy_json` (JSONB) – per‑event‑type cancel/reschedule rules  
- `reschedule_policy_json` (JSONB)  
- `max_group_size` (int nullable) – for group events  
- `availability_overrides` (JSONB) – additional per‑event overrides  
- `created_at`, `updated_at`  
- Soft delete: `deleted_at`.  
**Indexes:** `(organization_id, type)`.  
Zod schemas generated.

**DDD:** EventType is the core scheduling configuration aggregate in the Appointments context, analogous to Calendly's event types.  
**TDD:** Validate all columns, enum constraints, JSONB structure, and soft delete.  
**BDD:** Supports "Select from multiple event types" scenarios.

### Subtasks:
- [ ] DB‑APPT‑009.1: Write schema validation test – assert all columns, FK to organizations, index on type, JSONB columns, and soft delete. (AGENT) – `lib/db/src/__tests__/event-types.test.ts`  
  **verification:** `pnpm test -- event-types.test.ts` red, then green after implementation.
- [ ] DB‑APPT‑009.2: Implement table with enum types, JSONB defaults, and Zod schemas. (AGENT) – `lib/db/src/schema/appointments/event_types.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB‑APPT‑009.3: Test JSONB validation for cancellation and reschedule policies. (AGENT)  
  **verification:** Zod schema correctly validates policy structures.
- **Depends on:** DB‑ORG‑001.
- **Blocks:** DB‑APPT‑010, DB‑APPT‑011.

---

### [ ] DB‑APPT‑010: Define Event Type Questions Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/event_type_questions.ts` exports `eventTypeQuestions` table:  
- `id` (uuid PK), `event_type_id` (FK to event_types, onDelete cascade)  
- `organization_id` (FK)  
- `question_text` (text NOT NULL)  
- `question_type` (enum: text/multi‑choice/checkbox/dropdown)  
- `options_json` (JSONB nullable) – for multi‑choice  
- `is_required` (boolean default true)  
- `display_order` (int)  
- `created_at`, `updated_at`  
**Index:** `(event_type_id, display_order)`.

**DDD:** Value objects attached to event types; used in routing forms and booking flow.  
**TDD:** Test FK cascade, JSONB options, ordering.

### Subtasks:
- [ ] DB‑APPT‑010.1: Write schema test. (AGENT) – `lib/db/src/__tests__/event-type-questions.test.ts`  
  **verification:** Red → green.
- [ ] DB‑APPT‑010.2: Implement table with enums, JSONB, and ordering index. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑APPT‑009.
- **Blocks:** DB‑APPT‑011.

---

### [ ] DB‑APPT‑011: Define Routing Forms Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/routing_forms.ts` exports `routingForms` table:  
- `id` (uuid PK), `organization_id` (FK)  
- `name` (text NOT NULL), `description` (text nullable)  
- `steps_json` (JSONB NOT NULL) – conditional logic mapping question answers to event types or disqualification messages  
- `is_active` (boolean default true)  
- `created_at`, `updated_at`  
- Soft delete: `deleted_at`.  
**Index:** GIN on `steps_json`.

**DDD:** RoutingForm is a separate aggregate that qualifies invitees and directs them to the appropriate event type.  
**TDD:** Validate JSONB structure (must include valid event_type_ids and disqualification rules).

### Subtasks:
- [ ] DB‑APPT‑011.1: Write schema test with JSONB validation logic. (AGENT) – `lib/db/src/__tests__/routing-forms.test.ts`  
  **verification:** Red → green.
- [ ] DB‑APPT‑011.2: Implement table and Zod schema with custom JSONB validation. (AGENT)  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** DB‑APPT‑009.
- **Blocks:** API‑APPT‑012.

---

### [ ] DB‑APPT‑012: Define Waitlist Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/waitlist.ts` exports `waitlist` table:  
- `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK to event_types)  
- `invitee_email` (text NOT NULL), `invitee_name` (text nullable)  
- `requested_time_start` (timestamp NOT NULL)  
- `status` (enum: waiting/notified/booked/expired)  
- `booking_slot_json` (JSONB) – the slot they auto‑book into when available  
- `created_at`, `updated_at`  
**Indexes:** `(event_type_id, status)`, `(invitee_email, status)`.

**DDD:** Waitlist entries are temporary records that may convert to appointments.

### Subtasks:
- [ ] DB‑APPT‑012.1: Write schema test. (AGENT) – `lib/db/src/__tests__/waitlist.test.ts`  
  **verification:** Red → green.
- [ ] DB‑APPT‑012.2: Implement table with enum, JSONB, and indexes. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑APPT‑009.
- **Blocks:** API‑APPT‑014.

---

### [ ] DB‑APPT‑013: Define No‑Show Log Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/no_show_log.ts` exports `noShowLog` table:  
- `id` (uuid PK), `appointment_id` (FK to appointments, unique constraint)  
- `organization_id` (FK)  
- `marked_by_user_id` (FK to users)  
- `no_show_at` (timestamp NOT NULL)  
- `notes` (text nullable)  
- `created_at`  
**Unique:** One entry per appointment.

**DDD:** Records a no‑show event, tied to the appointment aggregate.

### Subtasks:
- [ ] DB‑APPT‑013.1: Write schema test including unique constraint. (AGENT) – `lib/db/src/__tests__/no-show-log.test.ts`  
  **verification:** Red → green.
- [ ] DB‑APPT‑013.2: Implement table with FK and unique index. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑APPT‑001.
- **Blocks:** API‑APPT‑013.

---

### [ ] DB‑APPT‑014: Define Collective Availability Exclusions Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/appointments/collective_exclusions.ts` exports `collectiveAvailabilityExclusions` table:  
- `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK to event_types)  
- `host_user_ids` (JSONB array of user UUIDs) – the hosts whose collective availability is overridden  
- `excluded_start_time` (timestamp NOT NULL), `excluded_end_time` (timestamp NOT NULL)  
- `recurrence_rule` (text nullable) – iCal RRULE  
- `created_at`  
**Index:** `(event_type_id, excluded_start_time)`.

**DDD:** Used to manually block out time slots for collective events where the normal availability windows are insufficient.

### Subtasks:
- [ ] DB‑APPT‑014.1: Write schema test. (AGENT) – `lib/db/src/__tests__/collective-exclusions.test.ts`  
  **verification:** Red → green.
- [ ] DB‑APPT‑014.2: Implement table with JSONB host array and recurrence. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑APPT‑009.
- **Blocks:** API‑APPT‑013 (Collective availability calculations).

---

## Phase 2 Appointments Dependencies

### Critical Path
```
DB-APPT-001 → DB-APPT-002/003 → DB-APPT-009 → DB-APPT-010/011/012/014
```

### Parallel Execution
- **DB-APPT-002** (Availability) and **DB-APPT-003** (Booking Rules) can run in parallel after **DB-APPT-001**
- **DB-APPT-005** (Calendar), **DB-APPT-006** (Meeting), **DB-APPT-007** (Payments) can run in parallel after **DB-APPT-001**
- **DB-APPT-008** (Polls) can run in parallel after **DB-APPT-001**
- **DB-APPT-009** (Event Types) enables **DB-APPT-010**, **DB-APPT-011**, **DB-APPT-012**, **DB-APPT-014**

### Cross-Context Dependencies
- All appointment tables depend on **DB-ORG-001** for `organization_id` foreign keys
- **DB-APPT-001** depends on **DB-IDENTITY-001** for `service_provider_id` foreign key
- **DB-APPT-004** adds foreign key to **DB-CRM-002** (contacts) after CRM context is implemented
- **DB-APPT-005**, **DB-APPT-006**, **DB-APPT-007** enable external integrations and payment processing

### Business Logic Considerations
- Event types drive the entire booking flow and must be implemented before routing forms
- Availability windows use iCal RRULE format for recurring schedules
- Payment transactions support Stripe integration with proper audit trails
- Meeting polls enable group scheduling with voting mechanics
- Calendar connections require token encryption for security

---

## File Index

### Appointments Files
- `TODO-P2-APPOINTMENTS.md` - This file (Scheduling & Appointments context)
- `TODO-P2-INFRASTRUCTURE.md` - Test Infrastructure, DB Logger, Organizations
- `TODO-P2-IDENTITY.md` - Identity & Access context
- `TODO-P2-FINANCE.md` - Financial context
- `TODO-P2-TRACKER.md` - Phase 2 execution tracking and dependencies

### Related Phase Files
- `TODO-P3-APPOINTMENTS-API.md` - Appointment booking and management APIs
- `TODO-P3-CALENDAR-INTEGRATIONS.md` - External calendar sync and integrations
- `TODO-P3-PAYMENT-PROCESSING.md` - Stripe integration and payment flows

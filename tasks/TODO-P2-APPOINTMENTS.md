# TODO-P2-APPOINTMENTS.md – Phase 2: Scheduling & Appointments Context

This file covers the complete Scheduling & Appointments bounded context for Phase 2: a Calendly-style appointment system with event types, routing forms, waitlists, meeting integrations, payment processing, and group scheduling. This context is standalone and completely separate from the Projects Scheduler (which is a PM-owned feature for recurring work).

---

## [ ] DB-APPT-001: Define Appointments Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No appointments table. The entire scheduling context is blocked.
**Size:** Small

**Description:** Define the `appointments` table — the core aggregate of the Appointments bounded context. Supports Calendly-style booking with client, service provider, status lifecycle, soft delete, and performance indexes.

**Depends on:** DB-ORG-001 (organization FK), DB-IDENTITY-001 (service_provider_id FK)
**Blocks:** DB-APPT-002 (availability), DB-APPT-003 (booking rules), DB-APPT-004 (client FK migration), DB-APPT-005 (calendar connections), DB-APPT-006 (meeting integrations), DB-APPT-007 (payment transactions), DB-APPT-008 (meeting polls), DB-APPT-013 (no-show log)
**Related Files:** `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/appointments.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `appointments` (table), `appointmentStatusEnum`, `insertAppointmentSchema`, `selectAppointmentSchema`, `InsertAppointment`, `Appointment`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/appointments.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `client_id` (uuid nullable — FK to contacts added in DB-APPT-004), `service_provider_id` (FK to users), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `status` (pgEnum: `requested|confirmed|completed|cancelled`), `cancellation_reason` (text nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, start_time)`, `(service_provider_id, status, start_time)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/appointments.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Recurring appointment series management (Phase 3+)
- Advanced scheduling algorithms
- Video conferencing integration (DB-APPT-006)
- Client FK constraint (added in DB-APPT-004 after DB-CRM-002 is available)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/appointments.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`

**Rollback**
- Granularity: file-level — delete `appointments.ts`; no DB change until HUMAN runs `push`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- All queries must include `organization_id` in WHERE clauses
- Status transitions: `requested → confirmed → completed|cancelled` (service-layer state machine)
- `start_time` and `end_time` stored in UTC — no timezone-specific storage
- Availability conflict detection must occur before booking (service layer)

**Verification**
```bash
pnpm --filter @workspace/db test -- appointments.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Composite index `(service_provider_id, status, start_time)` supports dashboard queries for provider availability views
- `client_id` starts nullable; DB-APPT-004 adds FK constraint after CRM context is ready

**Anti-Patterns**
- Cascading deletes affecting CRM data via `client_id` FK — use `onDelete: 'set null'` when adding the FK
- Storing business logic in database triggers
- Querying appointments without `organization_id` filter

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Appointment` is the aggregate root of the Appointments bounded context. Cross-context FK to CRM contacts is a deliberate bounded-context bridge — appointments represent scheduled interactions with external contacts.
- TDD: Assert status enum, composite indexes, soft delete column presence.
- BDD: Enables "Book an available time slot" scenarios.
- Deep Module: Shallow storage; booking rules, availability conflicts, and calendar integrations live in `AppointmentService`.

---

### Subtasks

- [ ] DB-APPT-001.0.25 (AGENT): Read DB-ORG-001 and DB-IDENTITY-001 schemas for FK context. No action — pause.

- [ ] DB-APPT-001.0.5 (AGENT): Research Drizzle composite index syntax and `pgEnum` definition patterns (May 2026).

- [ ] DB-APPT-001.0.75 (AGENT): Reason about `client_id` nullable design — confirm it should start null with FK added in DB-APPT-004.

- [ ] DB-APPT-001.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/appointments.test.ts`
  **Verification:** RED.

- [ ] DB-APPT-001.2 (AGENT): Implement `appointments` table, enum, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-APPT-001.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-APPT-002: Define Availability Windows Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No availability windows table. Service provider scheduling and slot calculation are blocked.
**Size:** Small

**Description:** Define the `availability_windows` table for storing when service providers are available for appointments. Supports recurring windows via iCal RRULE, configurable slot duration, buffer times, and max concurrent appointments.

**Depends on:** DB-ORG-001, DB-IDENTITY-001 (users FK), DB-APPT-001
**Blocks:** DB-APPT-004 (client FK migration depends on APPT-001 existing)
**Related Files:** `lib/db/src/schema/appointments/availability_windows.ts`, `lib/db/src/__tests__/availability-windows.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `integer`, `boolean`, `text`, `timestamp`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `availabilityWindows` (table), `insertAvailabilityWindowSchema`, `selectAvailabilityWindowSchema`, `InsertAvailabilityWindow`, `AvailabilityWindow`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/availability_windows.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `service_provider_id` (FK to users), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `slot_duration` (integer NOT NULL default `30`), `is_recurring` (boolean NOT NULL default `false`), `recurrence_rule` (text nullable — iCal RRULE format), `max_appointments` (integer NOT NULL default `1`), `buffer_time` (integer NOT NULL default `0` — minutes), `deleted_at`, `created_at`, `updated_at`
- [ ] Index on `(service_provider_id, start_time)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/availability-windows.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Complex split-shift availability patterns
- Holiday-specific availability exceptions
- Real-time availability calculation (service layer concern)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/availability_windows.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/availability-windows.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `availability_windows.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Store times in UTC — no timezone-specific timestamps
- `recurrence_rule` must be a valid iCal RRULE string (validate format at service layer)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- availability-windows.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- iCal RRULE stored as text; parsing and expansion to individual slots happens in service layer (e.g., `rrule` npm package)
- `buffer_time` reduces bookable minutes per window without modifying `start_time`/`end_time`

**Anti-Patterns**
- Storing calculated availability slots in DB — derived data; compute in service layer
- Timezone-specific timestamp storage — always UTC

**DDD / TDD / BDD / Deep Module notes**
- DDD: `AvailabilityWindow` is a value object within the Appointment aggregate. Complex availability calculation lives in `AvailabilityService`.
- TDD: Assert FK constraint, RRULE text nullable, slot duration default.
- BDD: Supports "Service provider sets available hours" scenario.
- Deep Module: Shallow storage for recurrence rules; expansion logic in service layer.

---

### Subtasks

- [ ] DB-APPT-002.0.25 (AGENT): Read DB-APPT-001 and DB-IDENTITY-001. No action — pause.
- [ ] DB-APPT-002.0.5 (AGENT): Research iCal RRULE format; confirm `text` column is appropriate (vs a structured type).
- [ ] DB-APPT-002.0.75 (AGENT): Confirm `buffer_time` semantics — minutes before or around each slot.
- [ ] DB-APPT-002.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/availability-windows.test.ts` **Verification:** RED.
- [ ] DB-APPT-002.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-002.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-003: Define Booking Rules Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No booking rules table. Booking policy configuration and cancellation rules are blocked.
**Size:** Small

**Description:** Define the `booking_rules` table for configuring per-organization appointment booking policies, cancellation/reschedule rules, buffer times, and reminder settings. JSONB cancellation policy supports complex rule structures.

**Depends on:** DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 booking policy enforcement
**Related Files:** `lib/db/src/schema/appointments/booking_rules.ts`, `lib/db/src/__tests__/booking-rules.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `integer`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `bookingRules` (table), `reminderFrequencyEnum`, `insertBookingRulesSchema`, `selectBookingRulesSchema`, `InsertBookingRules`, `BookingRules`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/booking_rules.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `min_advance_notice_hours` (integer NOT NULL default `24`), `max_advance_booking_days` (integer NOT NULL default `60`), `cancellation_policy` (jsonb NOT NULL default `{}`), `buffer_before_minutes` (integer NOT NULL default `0`), `buffer_after_minutes` (integer NOT NULL default `0`), `reminder_lead_time` (integer NOT NULL default `30`), `reminder_frequency` (pgEnum: `once|daily|hourly`), `deleted_at`, `created_at`, `updated_at`
- [ ] GIN index on `cancellation_policy`
- [ ] Zod schemas and types exported; `cancellation_policy` validated as JSONB object with known keys
- [ ] `lib/db/src/__tests__/booking-rules.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Dynamic pricing rules
- Advanced availability algorithms
- Per-event-type overrides (handled via DB-APPT-009 `cancellation_policy_json`)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/booking_rules.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/booking-rules.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `booking_rules.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Policy changes must not affect existing appointments (service layer enforcement)
- `cancellation_policy` JSONB schema: `{ allow_cancellation: boolean, minimum_notice_hours: number, refund_policy: string }`
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- booking-rules.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- GIN index on `cancellation_policy` supports `@>` containment queries for policy filtering
- Per-organization rules with per-event-type overrides in DB-APPT-009

**Anti-Patterns**
- Hard-coded policy limits in DB constraints — use service layer validation
- Storing business logic in database triggers

**DDD / TDD / BDD / Deep Module notes**
- DDD: `BookingRules` is a policy value object scoped per organization. Validation in `BookingPolicyService`.
- TDD: Assert GIN index, JSONB default, reminder frequency enum.
- BDD: Supports "Configure booking policies" scenario.
- Deep Module: Shallow configuration storage; validation logic in service layer.

---

### Subtasks

- [ ] DB-APPT-003.0.25 (AGENT): Read DB-ORG-001. No action — pause.
- [ ] DB-APPT-003.0.5 (AGENT): Research GIN index syntax in Drizzle for JSONB columns.
- [ ] DB-APPT-003.0.75 (AGENT): Define `cancellation_policy` JSONB object schema for Zod validation.
- [ ] DB-APPT-003.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-003.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-003.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-004: Add Client Foreign Key to Appointments
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `appointments.client_id` is nullable with no FK constraint. This task adds the FK constraint after DB-CRM-002 (contacts) is available.
**Size:** Small

**Description:** Update the `appointments` table to add a proper FK constraint from `client_id` to the `contacts` table. This is a cross-context link — deliberate bounded-context bridge between Appointments and CRM.

**Depends on:** DB-APPT-001 (appointments), DB-CRM-002 (contacts)
**Blocks:** [N/A] — enables referential integrity between Appointments and CRM contexts
**Related Files:** `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/__tests__/appointments.test.ts`

**Imports / Exports**
- Imports: existing `appointments` table — only FK reference addition
- Exports: updated `appointments` table definition

**Definition of Done**
- [ ] `client_id` in `appointments` table now has FK constraint referencing `contacts.id` with `onDelete: 'set null'`
- [ ] Existing test suite still passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- CRM contact data synchronization
- Bulk contact import into appointments

**Safety Boundaries**
- Use `onDelete: 'set null'` — never cascade-delete appointments when CRM contacts are removed
- Never modify generated code paths; never commit secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/appointments.ts`
- Tests added/updated in: `lib/db/src/__tests__/appointments.test.ts` (add FK assertion)
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`

**Rollback**
- Granularity: file-level — revert FK addition in `appointments.ts`
- Halt condition: `pnpm run typecheck` failure or test failures

**Rules to Follow**
- `onDelete: 'set null'` — removes CRM reference without deleting appointment history
- Cross-context FK is a deliberate architectural decision; document in code comment

**Verification**
```bash
pnpm --filter @workspace/db test -- appointments.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Cross-context FK with `set null` cascade preserves appointment history after CRM contact deletion

**Anti-Patterns**
- `onDelete: 'cascade'` on the CRM FK — would silently delete appointment history when contacts are removed

**DDD / TDD / BDD / Deep Module notes**
- DDD: Cross-context FK from Appointments to CRM is a deliberate bounded-context bridge.
- TDD: Assert FK constraint and `onDelete: 'set null'` behavior.
- BDD: Supports "Appointment shows client information" scenario.
- Deep Module: Simple FK addition; cross-context data enrichment in service layer.

---

### Subtasks

- [ ] DB-APPT-004.0.25 (AGENT): Read current `appointments.ts` and `contacts` schema from DB-CRM-002. No action — pause.
- [ ] DB-APPT-004.0.5 (AGENT): [N/A] — simple FK addition.
- [ ] DB-APPT-004.0.75 (AGENT): Confirm `onDelete: 'set null'` is correct cascade behavior for the cross-context link.
- [ ] DB-APPT-004.1 (AGENT): Add FK constraint to `appointments.ts`; add assertion to existing test. **Verification:** `pnpm run typecheck` clean; tests pass.
- [ ] DB-APPT-004.2 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-005: Define External Calendar Connections Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No calendar connections table. Google/Outlook/Apple calendar sync is blocked.
**Size:** Small

**Description:** Define the `calendar_connections` table for storing encrypted OAuth credentials for third-party calendar integrations (Google, Outlook, Apple). Tokens stored as encrypted text. Sync status tracking with error capture.

**Depends on:** DB-ORG-001, DB-IDENTITY-001 (users FK)
**Blocks:** [N/A] — enables Phase 3 calendar sync
**Related Files:** `lib/db/src/schema/appointments/calendar_connections.ts`, `lib/db/src/__tests__/calendar-connections.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `boolean`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `calendarConnections` (table), `calendarProviderEnum`, `syncStatusEnum`, `insertCalendarConnectionSchema`, `selectCalendarConnectionSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/calendar_connections.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `user_id` (FK to users), `provider` (pgEnum: `google|outlook|apple`), `external_calendar_id` (text NOT NULL), `access_token` (text NOT NULL — encrypted at application layer), `refresh_token` (text NOT NULL — encrypted at application layer), `sync_status` (pgEnum: `active|paused|error`), `last_sync_at` (timestamp nullable), `sync_error` (text nullable), `default_availability_source` (boolean NOT NULL default `false`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(user_id, provider)`, `(organization_id, sync_status)`
- [ ] Zod select schema MUST exclude `access_token` and `refresh_token` (redacted in API responses)
- [ ] `lib/db/src/__tests__/calendar-connections.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Real-time bi-directional sync implementation
- Calendar event conflict resolution
- Token encryption implementation (encryption utilities live in `api-server`)

**Safety Boundaries**
- Tokens are encrypted at the application layer BEFORE storage — never store plaintext OAuth tokens
- Never expose `access_token` or `refresh_token` in API responses (exclude from select schema)
- Never commit token values in logs or test fixtures

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/calendar_connections.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/calendar-connections.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `calendar_connections.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Tokens must be encrypted before storage; the DB stores ciphertext only
- Sync errors must be logged without exposing raw token values
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- calendar-connections.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Separate `insertCalendarConnectionSchema` (includes token fields) from `selectCalendarConnectionSchema` (omits token fields)
- `default_availability_source` controls which calendar's events block scheduling

**Anti-Patterns**
- Storing plaintext OAuth tokens — security violation
- Exposing token fields in API response schemas

**DDD / TDD / BDD / Deep Module notes**
- DDD: `CalendarConnection` is an external integration aggregate. OAuth refresh logic lives in `CalendarIntegrationService`.
- TDD: Assert token field presence in schema; assert token fields absent from select schema.
- BDD: Supports "Connect Google Calendar" scenario.
- Deep Module: Shallow storage for encrypted tokens; sync and refresh logic in external service adapter.

---

### Subtasks

- [ ] DB-APPT-005.0.25 (AGENT): Read DB-ORG-001 and DB-IDENTITY-001. No action — pause.
- [ ] DB-APPT-005.0.5 (AGENT): Research Drizzle `omit` pattern for excluding fields from select schema.
- [ ] DB-APPT-005.0.75 (AGENT): Confirm token fields are `text` (ciphertext can be long); confirm application-layer encryption approach.
- [ ] DB-APPT-005.1 (AGENT): Write failing schema test including token redaction assertion. **Verification:** RED.
- [ ] DB-APPT-005.2 (AGENT): Implement table, enums, Zod schemas (with token exclusion), types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-005.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-006: Define Meeting Integrations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No meeting integrations table. Auto-creation of Zoom/Teams/Meet links is blocked.
**Size:** Small

**Description:** Define the `meeting_integrations` table for linking appointments to external meeting services (Zoom, Teams, Meet). Stores meeting metadata, join URLs, and status lifecycle.

**Depends on:** DB-APPT-001 (appointments FK), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 video conferencing integration
**Related Files:** `lib/db/src/schema/appointments/meeting_integrations.ts`, `lib/db/src/__tests__/meeting-integrations.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `meetingIntegrations` (table), `meetingProviderEnum`, `meetingStatusEnum`, `insertMeetingIntegrationSchema`, `selectMeetingIntegrationSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/meeting_integrations.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK to appointments), `provider` (pgEnum: `zoom|teams|meet`), `external_meeting_id` (text NOT NULL), `join_url` (text NOT NULL), `meeting_password` (text nullable — encrypted at application layer), `host_email` (text NOT NULL), `recording_url` (text nullable), `status` (pgEnum: `scheduled|started|ended|cancelled`), `created_at`, `updated_at`
- [ ] Indexes: `(appointment_id)`, `(organization_id, provider)`, `(external_meeting_id)`
- [ ] Zod select schema excludes `meeting_password` from API responses
- [ ] `lib/db/src/__tests__/meeting-integrations.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Meeting recording management
- Advanced meeting analytics
- Meeting creation API integration (Phase 3)

**Safety Boundaries**
- `meeting_password` encrypted at application layer before storage; never plaintext
- Never expose `meeting_password` in API responses

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/meeting_integrations.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/meeting-integrations.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level. Halt: typecheck failure.

**Rules to Follow**
- `join_url` must be validated as a URL (Zod URL validation)
- Status transitions: `scheduled → started → ended|cancelled`
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- meeting-integrations.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Separate insert schema (includes password) from select schema (excludes password) — same pattern as DB-APPT-005.

**Anti-Patterns** — Storing `recording_url` content in DB — store URL only; recordings live in external storage.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `MeetingIntegration` is a value object linking appointments to external conferencing services. Integration logic in `VideoConferencingService`.
- TDD: Assert provider enum, password exclusion from select schema, join URL presence.
- BDD: Supports "Automatically create Zoom meeting" scenario.
- Deep Module: Shallow storage for meeting metadata; meeting creation API calls in service layer.

---

### Subtasks

- [ ] DB-APPT-006.0.25 (AGENT): Read DB-APPT-001. No action — pause.
- [ ] DB-APPT-006.0.5 (AGENT): [N/A] — same token-exclusion pattern as DB-APPT-005.
- [ ] DB-APPT-006.0.75 (AGENT): Confirm `meeting_password` nullable — some providers don't use passwords.
- [ ] DB-APPT-006.1 (AGENT): Write failing schema test with password exclusion assertion. **Verification:** RED.
- [ ] DB-APPT-006.2 (AGENT): Implement table, enums, Zod schemas; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-006.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-007: Define Appointment Payment Transactions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No appointment payment table. Booking fee collection and Stripe reconciliation are blocked.
**Size:** Small

**Description:** Define the `appointment_payment_transactions` table for tracking payments associated with individual appointments. Supports Stripe integration, refunds, and per-appointment financial audit trail.

**Depends on:** DB-APPT-001 (appointments FK), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 appointment payment processing
**Related Files:** `lib/db/src/schema/appointments/appointment_payment_transactions.ts`, `lib/db/src/__tests__/appointment-payments.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `timestamp`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `appointmentPaymentTransactions` (table), `apptPaymentStatusEnum`, `apptPaymentMethodEnum`, `insertApptPaymentSchema`, `selectApptPaymentSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/appointment_payment_transactions.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK to appointments), `amount_cents` (integer NOT NULL), `currency` (text NOT NULL default `USD`), `status` (pgEnum: `pending|succeeded|failed|refunded`), `payment_method` (pgEnum: `card|bank|transfer`), `stripe_payment_intent_id` (text nullable), `refunded_amount_cents` (integer NOT NULL default `0`), `refund_reason` (text nullable), `processed_at` (timestamp nullable), `failure_reason` (text nullable), `created_at`, `updated_at`
- [ ] Indexes: `(appointment_id)`, `(organization_id, status)`, `(stripe_payment_intent_id)`
- [ ] Zod schemas and types exported; `refunded_amount_cents` validated ≤ `amount_cents` at service layer
- [ ] `lib/db/src/__tests__/appointment-payments.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Subscription management
- Advanced refund workflows
- PCI-DSS card storage

**Safety Boundaries**
- Never store raw card details — Stripe tokenization only
- Never commit secrets or Stripe API keys

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/appointment_payment_transactions.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/appointment-payments.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Amounts in cents (integer) — no floats
- `refunded_amount_cents` must never exceed `amount_cents` (service layer)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- appointment-payments.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `stripe_payment_intent_id` as idempotency key for Stripe retries.

**Anti-Patterns** — Floating-point amounts; missing refund amount constraint.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `AppointmentPaymentTransaction` is a financial aggregate per-appointment. Stripe integration in `PaymentService`.
- TDD: Assert status enum, payment method enum, amount defaults.
- BDD: Supports "Collect payment for appointment" scenario.
- Deep Module: Shallow storage; payment processing in service layer.

---

### Subtasks

- [ ] DB-APPT-007.0.25 (AGENT): Read DB-APPT-001 and DB-FIN-002 (for consistent payment column patterns). No action — pause.
- [ ] DB-APPT-007.0.5 (AGENT): [N/A] — same payment patterns as DB-FIN-002.
- [ ] DB-APPT-007.0.75 (AGENT): Confirm `appointment_payment_transactions` vs reusing `customer_payments` table; confirm separate table is correct.
- [ ] DB-APPT-007.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-007.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-007.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-008: Define Meeting Polls, Options & Votes Tables
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No meeting poll tables. Group scheduling with participant voting is blocked.
**Size:** Medium

**Description:** Define three related tables for group scheduling polls: `meeting_polls` (poll configuration), `poll_options` (proposed time slots), and `poll_votes` (participant votes). Enables Calendly-style "Find a time" group scheduling.

**Depends on:** DB-ORG-001, DB-IDENTITY-001 (creator_id, voter_id FKs)
**Blocks:** [N/A] — enables Phase 3 group scheduling
**Related Files:** `lib/db/src/schema/appointments/meeting_polls.ts`, `lib/db/src/schema/appointments/poll_options.ts`, `lib/db/src/schema/appointments/poll_votes.ts`, `lib/db/src/__tests__/meeting-polls.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `pgEnum`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `meetingPolls`, `pollOptions`, `pollVotes` (tables), enums, Zod schemas, types

**Definition of Done**
- [ ] `meeting_polls` columns: `id` (uuid PK), `organization_id` (FK), `creator_id` (FK to users), `title` (text NOT NULL), `description` (text nullable), `status` (pgEnum: `active|closed`), `selected_option_id` (uuid nullable), `deadline_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] `poll_options` columns: `id` (uuid PK), `poll_id` (FK to meeting_polls, `onDelete: cascade`), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `votes_count` (integer NOT NULL default `0`), `selected` (boolean NOT NULL default `false`), `created_at`
- [ ] `poll_votes` columns: `id` (uuid PK), `poll_id` (FK to meeting_polls), `option_id` (FK to poll_options), `voter_id` (FK to users), `voter_email` (text NOT NULL), `created_at` (NO `updated_at` — append-only)
- [ ] Unique constraint on `(voter_id, poll_id)` in `poll_votes` (one vote per user per poll)
- [ ] Indexes: `(creator_id, status)` on polls; `(poll_id)` on options; `(voter_id, poll_id)` on votes
- [ ] All three tables compiled and exported; Zod schemas generated
- [ ] `lib/db/src/__tests__/meeting-polls.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Anonymous polls (voter is always identified)
- Weighted voting
- Poll modification after closure

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/meeting_polls.ts`, `poll_options.ts`, `poll_votes.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/meeting-polls.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level — delete all three schema files. Halt: typecheck failure.

**Rules to Follow**
- One vote per user per poll — unique constraint on `(voter_id, poll_id)` in `poll_votes`
- `poll_votes` is append-only — no `updated_at`, no `deleted_at`
- Poll closure must be irreversible (service layer state machine)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- meeting-polls.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `votes_count` on `poll_options` is a denormalized counter — increment atomically using `db.update(...).set({ votes_count: sql`votes_count + 1` })`
- `onDelete: cascade` on `poll_options.poll_id` — when poll is deleted, all options are removed
- Unique constraint prevents duplicate voting without application-layer check

**Anti-Patterns**
- No unique constraint on `(voter_id, poll_id)` — allows duplicate votes
- Mutable `poll_votes` records — breaks audit integrity

**DDD / TDD / BDD / Deep Module notes**
- DDD: `MeetingPoll` is a scheduling aggregate with child entities `PollOption` and `PollVote`. Winner selection logic in `PollService`.
- TDD: Assert three tables, unique vote constraint, cascade delete on options.
- BDD: Supports "Schedule meeting with multiple participants" scenario.
- Deep Module: Complex relational structure; poll closure and winner selection in service layer.

---

### Subtasks

- [ ] DB-APPT-008.0.25 (AGENT): Read DB-IDENTITY-001 for user FK context. No action — pause.
- [ ] DB-APPT-008.0.5 (AGENT): Research Drizzle `sql` template literal for atomic counter increment.
- [ ] DB-APPT-008.0.75 (AGENT): Confirm three separate files vs single file for the three tables.
- [ ] DB-APPT-008.1 (AGENT): Write failing schema test for all three tables. **Verification:** RED.
- [ ] DB-APPT-008.2 (AGENT): Implement `meeting_polls.ts`. **Verification:** Partial GREEN.
- [ ] DB-APPT-008.3 (AGENT): Implement `poll_options.ts`. **Verification:** Partial GREEN.
- [ ] DB-APPT-008.4 (AGENT): Implement `poll_votes.ts`; update `index.ts`. **Verification:** Full GREEN; typecheck clean.
- [ ] DB-APPT-008.5 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-009: Define Event Types Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No event types table. The entire Calendly-style booking flow is blocked.
**Size:** Small

**Description:** Define the `event_types` table — the core scheduling configuration aggregate. Models Calendly event types with booking limits, group size, secret links, JSONB cancellation/reschedule policies, and availability overrides.

**Depends on:** DB-ORG-001
**Blocks:** DB-APPT-010 (event type questions), DB-APPT-011 (routing forms), DB-APPT-012 (waitlist), DB-APPT-014 (collective exclusions)
**Related Files:** `lib/db/src/schema/appointments/event_types.ts`, `lib/db/src/__tests__/event-types.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `integer`, `boolean`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `eventTypes` (table), `eventTypeKindEnum`, `locationTypeEnum`, `insertEventTypeSchema`, `selectEventTypeSchema`, `InsertEventType`, `EventType`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/event_types.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `type` (pgEnum: `one_on_one|round_robin|collective|group`), `duration_minutes` (integer NOT NULL), `buffer_before_minutes` (integer NOT NULL default `0`), `buffer_after_minutes` (integer NOT NULL default `0`), `daily_booking_limit` (integer nullable — null = unlimited), `location_type` (pgEnum: `physical|virtual|phone`), `location_value` (text nullable), `is_secret` (boolean NOT NULL default `false`), `cancellation_policy_json` (jsonb NOT NULL default `{}`), `reschedule_policy_json` (jsonb NOT NULL default `{}`), `max_group_size` (integer nullable — for group events), `availability_overrides` (jsonb NOT NULL default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Index on `(organization_id, type)`
- [ ] Zod schemas and types exported; JSONB policy objects validated with known-key schemas
- [ ] `lib/db/src/__tests__/event-types.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Advanced scheduling algorithms
- Per-event-type Stripe product/price configuration (Phase 3)

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/event_types.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/event-types.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `is_secret` events are accessible only by direct link — enforce in route middleware
- `max_group_size` null means one-on-one or unlimited (depending on type)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- event-types.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- JSONB policy fields include per-event-type overrides for the organization-level rules set in DB-APPT-003
- `type` enum drives booking logic: `round_robin` assigns provider; `collective` requires all providers; `group` has `max_group_size`

**Anti-Patterns**
- Missing `(organization_id, type)` index — event type listing queries require this
- Exposing secret events in public listing endpoints — enforce in route middleware

**DDD / TDD / BDD / Deep Module notes**
- DDD: `EventType` is the core scheduling configuration aggregate — analogous to Calendly's event types.
- TDD: Assert all enums, JSONB defaults, soft delete.
- BDD: Supports "Select from multiple event types" and "Book 30-minute one-on-one" scenarios.
- Deep Module: Configuration aggregate; booking flow logic in `BookingService`.

---

### Subtasks

- [ ] DB-APPT-009.0.25 (AGENT): Read DB-ORG-001 and DB-APPT-003 (booking rules — for policy field overlap). No action — pause.
- [ ] DB-APPT-009.0.5 (AGENT): Define JSONB schemas for `cancellation_policy_json` and `reschedule_policy_json`.
- [ ] DB-APPT-009.0.75 (AGENT): Confirm `round_robin` type semantics — provider assignment at booking time, not stored in event type.
- [ ] DB-APPT-009.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-009.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-009.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-010: Define Event Type Questions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No event type questions table. Custom intake forms for booking flows are blocked.
**Size:** Small

**Description:** Define the `event_type_questions` table for storing custom intake questions attached to event types. Supports multiple question types with JSONB options for multi-choice questions and display ordering.

**Depends on:** DB-APPT-009 (event_types FK), DB-ORG-001
**Blocks:** DB-APPT-011 (routing forms use questions)
**Related Files:** `lib/db/src/schema/appointments/event_type_questions.ts`, `lib/db/src/__tests__/event-type-questions.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `boolean`, `integer`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `eventTypeQuestions` (table), `questionTypeEnum`, `insertEventTypeQuestionSchema`, `selectEventTypeQuestionSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/event_type_questions.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `event_type_id` (FK to event_types, `onDelete: cascade`), `organization_id` (FK), `question_text` (text NOT NULL), `question_type` (pgEnum: `text|multi_choice|checkbox|dropdown`), `options_json` (jsonb nullable — array of choice strings for multi-choice), `is_required` (boolean NOT NULL default `true`), `display_order` (integer NOT NULL), `created_at`, `updated_at`
- [ ] Composite index on `(event_type_id, display_order)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/event-type-questions.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Conditional question logic (handled in DB-APPT-011 routing forms)
- File upload question types

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/event_type_questions.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/event-type-questions.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `onDelete: cascade` on `event_type_id` — questions are deleted when their event type is deleted
- `display_order` must be unique per `event_type_id` (validate at service layer)
- `options_json` required when `question_type` is `multi_choice` or `dropdown` (validate at service layer)

**Verification**
```bash
pnpm --filter @workspace/db test -- event-type-questions.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — `options_json` JSONB schema: `string[]` — array of option labels.

**Anti-Patterns** — No display order — questions render in insertion order (non-deterministic).

**DDD / TDD / BDD / Deep Module notes**
- DDD: `EventTypeQuestion` is a value object attached to `EventType`. Form rendering logic in `BookingFormService`.
- TDD: Assert cascade delete, display order index, question type enum.
- BDD: Supports "Invitee answers custom questions during booking" scenario.
- Deep Module: Shallow storage; form rendering and validation in service layer.

---

### Subtasks

- [ ] DB-APPT-010.0.25 (AGENT): Read DB-APPT-009. No action — pause.
- [ ] DB-APPT-010.0.5 (AGENT): Confirm `options_json` as `string[]` JSONB is sufficient for multi-choice options.
- [ ] DB-APPT-010.0.75 (AGENT): Confirm cascade delete behavior from event type to questions.
- [ ] DB-APPT-010.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-010.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-010.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-011: Define Routing Forms Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No routing forms table. Invitee qualification and conditional event type routing are blocked.
**Size:** Small

**Description:** Define the `routing_forms` table for configuring Calendly-style invitee routing — pre-qualification forms that route respondents to appropriate event types or show disqualification messages based on their answers.

**Depends on:** DB-APPT-009 (event_types referenced in steps_json), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 routing form API
**Related Files:** `lib/db/src/schema/appointments/routing_forms.ts`, `lib/db/src/__tests__/routing-forms.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `boolean`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `routingForms` (table), `insertRoutingFormSchema`, `selectRoutingFormSchema`, `InsertRoutingForm`, `RoutingForm`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/routing_forms.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `steps_json` (jsonb NOT NULL default `[]` — conditional logic), `is_active` (boolean NOT NULL default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] GIN index on `steps_json`
- [ ] Zod schemas and types exported; `steps_json` validated as array of step objects with known structure
- [ ] `lib/db/src/__tests__/routing-forms.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Advanced branching trees beyond simple conditional routing
- External CRM integration for routing decisions

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/routing_forms.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/routing-forms.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `steps_json` schema: `[{ question_id: UUID, answer_conditions: [{ value, action: 'route_to_event' | 'disqualify', event_type_id?: UUID, message?: string }] }]`
- All referenced `event_type_id` values must exist at evaluation time (service layer validation)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- routing-forms.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- GIN index on `steps_json` enables containment queries to find forms routing to a specific event type
- Zod refinement validates that `steps_json` contains valid `action` values and that `event_type_id` is present when action is `route_to_event`

**Anti-Patterns** — Missing GIN index — `steps_json @>` queries become full table scans.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `RoutingForm` is a separate aggregate for invitee pre-qualification. Routing evaluation in `RoutingService`.
- TDD: Assert GIN index, `steps_json` default, `is_active` default.
- BDD: Supports "Qualify invitee before booking" scenario.
- Deep Module: Shallow storage for conditional logic; routing evaluation in service layer.

---

### Subtasks

- [ ] DB-APPT-011.0.25 (AGENT): Read DB-APPT-009 and DB-APPT-010. No action — pause.
- [ ] DB-APPT-011.0.5 (AGENT): Research GIN index syntax in Drizzle for JSONB.
- [ ] DB-APPT-011.0.75 (AGENT): Define `steps_json` Zod array item schema.
- [ ] DB-APPT-011.1 (AGENT): Write failing schema test with JSONB validation. **Verification:** RED.
- [ ] DB-APPT-011.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-011.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-012: Define Waitlist Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No waitlist table. Overbooking handling and automatic slot assignment are blocked.
**Size:** Small

**Description:** Define the `waitlist` table for queueing invitees when an event type's booking capacity is full. When a slot opens, waitlisted invitees are notified and auto-booked according to `booking_slot_json`.

**Depends on:** DB-APPT-009 (event_types FK), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 waitlist management
**Related Files:** `lib/db/src/schema/appointments/waitlist.ts`, `lib/db/src/__tests__/waitlist.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `jsonb`, `pgEnum`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `waitlist` (table), `waitlistStatusEnum`, `insertWaitlistSchema`, `selectWaitlistSchema`, `InsertWaitlist`, `Waitlist`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/waitlist.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK to event_types), `invitee_email` (text NOT NULL), `invitee_name` (text nullable), `requested_time_start` (timestamp NOT NULL), `status` (pgEnum: `waiting|notified|booked|expired`), `booking_slot_json` (jsonb NOT NULL default `{}` — slot to auto-book into when available), `created_at`, `updated_at`
- [ ] Indexes: `(event_type_id, status)`, `(invitee_email, status)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/waitlist.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Priority-based waitlist ordering
- Waitlist fee collection

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/waitlist.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/waitlist.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Status transitions: `waiting → notified → booked|expired`
- `booking_slot_json` schema: `{ start_time, end_time, service_provider_id }` — filled when slot becomes available
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- waitlist.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Composite `(event_type_id, status)` index supports efficient "find waiting invitees for event type" queries when a slot opens.

**Anti-Patterns** — No status index — slot-opening notification queries become full table scans.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Waitlist` entries are temporary records that may convert to appointments. Notification and auto-booking logic in `WaitlistService`.
- TDD: Assert status enum, both composite indexes.
- BDD: Supports "Join waitlist when event is full" scenario.
- Deep Module: Shallow storage; notification and slot-assignment logic in service layer.

---

### Subtasks

- [ ] DB-APPT-012.0.25 (AGENT): Read DB-APPT-009. No action — pause.
- [ ] DB-APPT-012.0.5 (AGENT): Define `booking_slot_json` Zod object schema.
- [ ] DB-APPT-012.0.75 (AGENT): Confirm `requested_time_start` — is this the desired slot start or just any time preference?
- [ ] DB-APPT-012.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-012.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-012.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-013: Define No-Show Log Table (Append-Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No no-show log table. No-show tracking and collection policy enforcement are blocked.
**Size:** Small

**Description:** Define the append-only `no_show_log` table for recording no-show events per appointment. Unique constraint per appointment ensures a single no-show record per booking. Immutable audit trail.

**Depends on:** DB-APPT-001 (appointments FK), DB-IDENTITY-001 (marked_by FK), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 collections and no-show policy enforcement
**Related Files:** `lib/db/src/schema/appointments/no_show_log.ts`, `lib/db/src/__tests__/no-show-log.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `uniqueIndex`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `noShowLog` (table), `insertNoShowLogSchema`, `selectNoShowLogSchema`, `InsertNoShowLog`, `NoShowLog`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/no_show_log.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `appointment_id` (FK to appointments), `organization_id` (FK), `marked_by_user_id` (FK to users), `no_show_at` (timestamp NOT NULL), `notes` (text nullable), `created_at` (NO `updated_at`, NO `deleted_at` — append-only)
- [ ] Unique constraint on `appointment_id` — one no-show record per appointment
- [ ] Indexes: `(organization_id)`, unique `(appointment_id)`
- [ ] Zod schemas and types exported
- [ ] `lib/db/src/__tests__/no-show-log.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automated no-show penalties
- No-show dispute resolution

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/no_show_log.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/no-show-log.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- Append-only: no UPDATE, no DELETE, no `updated_at`, no `deleted_at`
- One no-show record per appointment (unique constraint)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- no-show-log.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — Unique constraint on `appointment_id` prevents duplicate no-show records without application-layer check.

**Anti-Patterns** — No unique constraint on `appointment_id` — allows multiple no-show records per appointment.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only no-show log in the Appointments bounded context.
- TDD: Assert unique constraint on `appointment_id`; assert no `updated_at` column.
- BDD: Supports "Mark appointment as no-show" scenario.
- Deep Module: Simple append-only log; policy enforcement in `NoShowService`.

---

### Subtasks

- [ ] DB-APPT-013.0.25 (AGENT): Read DB-APPT-001 and DB-IDENTITY-001. No action — pause.
- [ ] DB-APPT-013.0.5 (AGENT): [N/A] — same append-only pattern as DB-FIN-012 and DB-FIN-014.
- [ ] DB-APPT-013.0.75 (AGENT): Confirm unique constraint on `appointment_id` — at most one no-show per appointment.
- [ ] DB-APPT-013.1 (AGENT): Write failing schema test including unique constraint and no `updated_at` assertion. **Verification:** RED.
- [ ] DB-APPT-013.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-013.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## [ ] DB-APPT-014: Define Collective Availability Exclusions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collective exclusions table. Manual time blocking for collective event types is blocked.
**Size:** Small

**Description:** Define the `collective_availability_exclusions` table for manually blocking time slots for collective event types (where all hosts must be available). Supports iCal RRULE recurrence and JSONB host user ID arrays.

**Depends on:** DB-APPT-009 (event_types FK), DB-ORG-001
**Blocks:** [N/A] — enables Phase 3 collective availability calculation
**Related Files:** `lib/db/src/schema/appointments/collective_exclusions.ts`, `lib/db/src/__tests__/collective-exclusions.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `jsonb`, `index` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `collectiveAvailabilityExclusions` (table), `insertCollectiveExclusionSchema`, `selectCollectiveExclusionSchema`, related types

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/collective_exclusions.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK to event_types), `host_user_ids` (jsonb NOT NULL default `[]` — array of user UUIDs), `excluded_start_time` (timestamp NOT NULL), `excluded_end_time` (timestamp NOT NULL), `recurrence_rule` (text nullable — iCal RRULE), `created_at`
- [ ] Index on `(event_type_id, excluded_start_time)`
- [ ] Zod schemas and types exported; `host_user_ids` validated as `z.array(z.string().uuid())`
- [ ] `lib/db/src/__tests__/collective-exclusions.test.ts` passes
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automated exclusion generation from calendar events
- Exclusion modification UI

**Safety Boundaries** — Same as all other schema tasks.

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments/collective_exclusions.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/collective-exclusions.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback** — File-level. Halt: typecheck failure.

**Rules to Follow**
- `host_user_ids` JSONB array validated as UUID strings (Zod `z.array(z.string().uuid())`)
- `excluded_start_time` must be before `excluded_end_time` (service layer validation)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- collective-exclusions.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — JSONB `host_user_ids` array allows excluding specific hosts without a separate junction table.

**Anti-Patterns** — No index on `(event_type_id, excluded_start_time)` — availability calculation queries become full scans.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `CollectiveAvailabilityExclusion` blocks collective event slots. Exclusion evaluation in `CollectiveSchedulingService`.
- TDD: Assert JSONB array default, composite index.
- BDD: Supports "Block collective time slot for all hosts" scenario.
- Deep Module: Shallow storage; collective availability intersection logic in service layer.

---

### Subtasks

- [ ] DB-APPT-014.0.25 (AGENT): Read DB-APPT-009. No action — pause.
- [ ] DB-APPT-014.0.5 (AGENT): Confirm `host_user_ids` as JSONB array vs separate junction table — JSONB is correct for this use case.
- [ ] DB-APPT-014.0.75 (AGENT): Confirm iCal RRULE `text` column is same pattern as DB-APPT-002.
- [ ] DB-APPT-014.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB-APPT-014.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB-APPT-014.3 (HUMAN): Final review and sign-off. **Verification:** Approved.

---

## Phase 2 Appointments: Critical Path & Dependencies

### Execution Order
```
DB-ORG-001 + DB-IDENTITY-001
  ├─> DB-APPT-001 (appointments) ──────────────────────────────────> DB-APPT-013 (no-show)
  │     ├─> DB-APPT-002 (availability)
  │     ├─> DB-APPT-005 (calendar connections)
  │     ├─> DB-APPT-006 (meeting integrations)
  │     └─> DB-APPT-007 (payment transactions)
  ├─> DB-APPT-003 (booking rules) — parallel with APPT-001
  ├─> DB-APPT-008 (meeting polls) — parallel with APPT-001
  └─> DB-APPT-009 (event types)
        ├─> DB-APPT-010 (event type questions)
        ├─> DB-APPT-011 (routing forms)
        ├─> DB-APPT-012 (waitlist)
        └─> DB-APPT-014 (collective exclusions)

After DB-CRM-002 available:
  DB-APPT-004 (client FK migration)
```

### Parallel Execution Groups
- **DB-APPT-002, 003, 005, 006, 007, 008** — can all run in parallel after DB-APPT-001
- **DB-APPT-010, 011, 012, 014** — can all run in parallel after DB-APPT-009
- **DB-APPT-009** can start in parallel with DB-APPT-001 (depends only on DB-ORG-001)

---

## File Index

### Appointments Files
- `TODO-P2-APPOINTMENTS.md` — This file
- `TODO-P2-INFRASTRUCTURE.md` — Test Infrastructure, DB Logger, BaseRepository
- `TODO-P2-IDENTITY.md` — Identity & Access context
- `TODO-P2-FINANCE.md` — Financial context (AR, AP, shared)
- `TODO-P2-ORGANIZATIONS.md` — Organizations multi-tenancy anchor

### Related Phase Files
- `TODO-P3-APPOINTMENTS-API.md` — Booking and management APIs (planned)
- `TODO-P3-CALENDAR-INTEGRATIONS.md` — External calendar sync (planned)
- `TODO-P3-PAYMENT-PROCESSING.md` — Stripe integration (planned)

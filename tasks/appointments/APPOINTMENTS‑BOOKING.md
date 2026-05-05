# tasks/appointments/APPOINTMENTS‑BOOKING.md – Appointments: Core Booking & Management

This file covers the core Appointment booking lifecycle within the standalone Appointments bounded context (Calendly‑style): database schemas for appointments, availability windows, booking rules, calendar connections, meeting integrations, payment transactions, meeting polls, waitlists, and no‑show logs. Includes the API layer for managing appointments, the public/portal client booking flow, availability dashboards, and frontend integration.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Core Appointments

### [ ] DB‑APPT‑001: Define Appointments Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No appointments table. The entire scheduling context is blocked.
**Size:** Small

**Description:** Define the `appointments` table — the core aggregate of the Appointments bounded context. Supports Calendly‑style booking with client, service provider, status lifecycle, soft delete, and performance indexes.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑002`, `DB‑APPT‑003`, `DB‑APPT‑004`, `DB‑APPT‑005`, `DB‑APPT‑006`, `DB‑APPT‑007`, `DB‑APPT‑008`, `DB‑APPT‑013`
**Related Files:** `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/__tests__/appointments.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `client_id` (uuid nullable — FK to contacts added in DB‑APPT‑004), `service_provider_id` (FK to users), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `status` (pgEnum: `requested|confirmed|completed|cancelled`), `cancellation_reason` (text nullable), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, start_time)`, `(service_provider_id, status, start_time)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Recurring appointment series management (Phase 3+)
- Advanced scheduling algorithms

**Rules to Follow**
- All queries must include `organization_id`
- Status transitions: `requested → confirmed → completed|cancelled` (service‑layer state machine)
- `start_time` and `end_time` stored in UTC

**Verification**
```bash
pnpm --filter @workspace/db test -- appointments.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Appointment` is the aggregate root of the Appointments bounded context.
- TDD: Assert status enum, composite indexes, soft delete column presence.
- BDD: Enables “Book an available time slot” scenarios.

---

### Subtasks
- [ ] DB‑APPT‑001.0.25 (AGENT): Read DB‑ORG‑001 and DB‑IDENTITY‑001 schemas for FK context. No action — pause.
- [ ] DB‑APPT‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/appointments.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑APPT‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑002: Define Availability Windows Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No availability windows table. Service provider scheduling and slot calculation are blocked.
**Size:** Small

**Description:** Define the `availability_windows` table for storing when service providers are available for appointments. Supports recurring windows via iCal RRULE, configurable slot duration, buffer times, and max concurrent appointments.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑001`
**Blocks:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑004`
**Related Files:** `lib/db/src/schema/appointments/availability_windows.ts`, `lib/db/src/__tests__/availability‑windows.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `service_provider_id` (FK → users), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `slot_duration` (integer NOT NULL default `30`), `is_recurring` (boolean NOT NULL default `false`), `recurrence_rule` (text nullable — iCal RRULE), `max_appointments` (integer NOT NULL default `1`), `buffer_time` (integer NOT NULL default `0`), `deleted_at`, `created_at`, `updated_at`
- [ ] Index on `(service_provider_id, start_time)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- availability‑windows.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑002.0.25 (AGENT): Read DB‑APPT‑001 and DB‑IDENTITY‑001. No action — pause.
- [ ] DB‑APPT‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/availability‑windows.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑002.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑003: Define Booking Rules Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No booking rules table. Booking policy configuration and cancellation rules are blocked.
**Size:** Small

**Description:** Define the `booking_rules` table for configuring per‑organization appointment booking policies, cancellation/reschedule rules, buffer times, and reminder settings.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 booking policy enforcement
**Related Files:** `lib/db/src/schema/appointments/booking_rules.ts`, `lib/db/src/__tests__/booking‑rules.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `min_advance_notice_hours` (integer NOT NULL default `24`), `max_advance_booking_days` (integer NOT NULL default `60`), `cancellation_policy` (jsonb NOT NULL default `{}`), `buffer_before_minutes` (integer NOT NULL default `0`), `buffer_after_minutes` (integer NOT NULL default `0`), `reminder_lead_time` (integer NOT NULL default `30`), `reminder_frequency` (pgEnum: `once|daily|hourly`), `deleted_at`, `created_at`, `updated_at`
- [ ] GIN index on `cancellation_policy`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- booking‑rules.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑003.0.25 (AGENT): Read DB‑ORG‑001. No action — pause.
- [ ] DB‑APPT‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/booking‑rules.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑003.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑004: Add Client Foreign Key to Appointments
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `appointments.client_id` is nullable with no FK constraint. This task adds the FK constraint after contacts are available.
**Size:** Small

**Description:** Update the `appointments` table to add a proper FK constraint from `client_id` to the `contacts` table. This is a deliberate bounded‑context bridge between Appointments and CRM.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/appointments/appointments.ts`, `lib/db/src/__tests__/appointments.test.ts`

**Definition of Done**
- [ ] `client_id` in `appointments` table now has FK constraint referencing `contacts.id` with `onDelete: 'set null'`
- [ ] Existing test suite still passes
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Use `onDelete: 'set null'` — never cascade‑delete appointments when CRM contacts are removed.

**Verification**
```bash
pnpm --filter @workspace/db test -- appointments.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑004.0.25 (AGENT): Read current `appointments.ts` and `contacts` schema. No action — pause.
- [ ] DB‑APPT‑004.1 (AGENT): Add FK constraint; add assertion to existing test. **Verification:** `pnpm typecheck` clean; tests pass.
- [ ] DB‑APPT‑004.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑005: Define External Calendar Connections Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No calendar connections table. Google/Outlook/Apple calendar sync is blocked.
**Size:** Small

**Description:** Define the `calendar_connections` table for storing encrypted OAuth credentials for third‑party calendar integrations (Google, Outlook, Apple).

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** [N/A] — enables Phase 3 calendar sync
**Related Files:** `lib/db/src/schema/appointments/calendar_connections.ts`, `lib/db/src/__tests__/calendar‑connections.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `user_id` (FK → users), `provider` (pgEnum: `google|outlook|apple`), `external_calendar_id` (text NOT NULL), `access_token` (text NOT NULL — encrypted at application layer), `refresh_token` (text NOT NULL — encrypted), `sync_status` (pgEnum: `active|paused|error`), `last_sync_at` (timestamp nullable), `sync_error` (text nullable), `default_availability_source` (boolean NOT NULL default `false`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(user_id, provider)`, `(organization_id, sync_status)`
- [ ] Zod select schema MUST exclude `access_token` and `refresh_token`
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- calendar‑connections.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑005.0.25 (AGENT): Read DB‑ORG‑001 and DB‑IDENTITY‑001. No action — pause.
- [ ] DB‑APPT‑005.1 (AGENT): Write failing schema test including token redaction assertion. **File:** `lib/db/src/__tests__/calendar‑connections.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑005.2 (AGENT): Implement table, enums, Zod schemas (with token exclusion), types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑006: Define Meeting Integrations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No meeting integrations table. Auto‑creation of Zoom/Teams/Meet links is blocked.
**Size:** Small

**Description:** Define the `meeting_integrations` table for linking appointments to external meeting services (Zoom, Teams, Meet).

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/appointments/meeting_integrations.ts`, `lib/db/src/__tests__/meeting‑integrations.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK → appointments), `provider` (pgEnum: `zoom|teams|meet`), `external_meeting_id` (text NOT NULL), `join_url` (text NOT NULL), `meeting_password` (text nullable — encrypted at application layer), `host_email` (text NOT NULL), `recording_url` (text nullable), `status` (pgEnum: `scheduled|started|ended|cancelled`), `created_at`, `updated_at`
- [ ] Indexes: `(appointment_id)`, `(organization_id, provider)`, `(external_meeting_id)`
- [ ] Zod select schema excludes `meeting_password`
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- meeting‑integrations.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑006.0.25 (AGENT): Read DB‑APPT‑001. No action — pause.
- [ ] DB‑APPT‑006.1 (AGENT): Write failing schema test with password exclusion. **File:** `lib/db/src/__tests__/meeting‑integrations.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑006.2 (AGENT): Implement table, enums, Zod schemas; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑007: Define Appointment Payment Transactions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No appointment payment table. Booking fee collection and Stripe reconciliation are blocked.
**Size:** Small

**Description:** Define the `appointment_payment_transactions` table for tracking payments associated with individual appointments.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 appointment payment processing
**Related Files:** `lib/db/src/schema/appointments/appointment_payment_transactions.ts`, `lib/db/src/__tests__/appointment‑payments.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `appointment_id` (FK), `amount_cents` (integer NOT NULL), `currency` (text NOT NULL default `USD`), `status` (pgEnum: `pending|succeeded|failed|refunded`), `payment_method` (pgEnum: `card|bank|transfer`), `stripe_payment_intent_id` (text nullable), `refunded_amount_cents` (integer NOT NULL default `0`), `refund_reason` (text nullable), `processed_at` (timestamp nullable), `failure_reason` (text nullable), `created_at`, `updated_at`
- [ ] Indexes: `(appointment_id)`, `(organization_id, status)`, `(stripe_payment_intent_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- appointment‑payments.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑007.0.25 (AGENT): Read DB‑APPT‑001 and payment patterns. No action — pause.
- [ ] DB‑APPT‑007.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/appointment‑payments.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑007.2 (AGENT): Implement table, enums, Zod schemas; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑008: Define Meeting Polls, Options & Votes Tables
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No meeting poll tables. Group scheduling with participant voting is blocked.
**Size:** Medium

**Description:** Define three related tables for group scheduling polls: `meeting_polls` (poll configuration), `poll_options` (proposed time slots), and `poll_votes` (participant votes). Enables Calendly‑style “Find a time” group scheduling.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/appointments/meeting_polls.ts`, `poll_options.ts`, `poll_votes.ts`, `lib/db/src/__tests__/meeting‑polls.test.ts`

**Definition of Done**
- [ ] `meeting_polls` columns: `id` (uuid PK), `organization_id` (FK), `creator_id` (FK → users), `title` (text NOT NULL), `description` (text nullable), `status` (pgEnum: `active|closed`), `selected_option_id` (uuid nullable), `deadline_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] `poll_options` columns: `id` (uuid PK), `poll_id` (FK, `onDelete: cascade`), `start_time` (timestamp NOT NULL), `end_time` (timestamp NOT NULL), `votes_count` (integer NOT NULL default `0`), `selected` (boolean NOT NULL default `false`), `created_at`
- [ ] `poll_votes` columns: `id` (uuid PK), `poll_id` (FK), `option_id` (FK), `voter_id` (FK → users), `voter_email` (text NOT NULL), `created_at` (NO `updated_at`)
- [ ] Unique constraint on `(voter_id, poll_id)` in `poll_votes`
- [ ] Indexes: `(creator_id, status)` on polls; `(poll_id)` on options; `(voter_id, poll_id)` on votes
- [ ] All three tables compiled and exported; Zod schemas generated
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- meeting‑polls.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑008.0.25 (AGENT): Read DB‑IDENTITY‑001 for user FK context. No action — pause.
- [ ] DB‑APPT‑008.1 (AGENT): Write failing schema test for all three tables. **File:** `lib/db/src/__tests__/meeting‑polls.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑008.2 (AGENT): Implement `meeting_polls.ts`. **Verification:** Partial GREEN.
- [ ] DB‑APPT‑008.3 (AGENT): Implement `poll_options.ts`. **Verification:** Partial GREEN.
- [ ] DB‑APPT‑008.4 (AGENT): Implement `poll_votes.ts`; update `index.ts`. **Verification:** Full GREEN; typecheck clean.
- [ ] DB‑APPT‑008.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑012: Define Waitlist Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No waitlist table. Overbooking handling and automatic slot assignment are blocked.
**Size:** Small

**Description:** Define the `waitlist` table for queueing invitees when an event type’s booking capacity is full.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑009`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/appointments/waitlist.ts`, `lib/db/src/__tests__/waitlist.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK → event_types), `invitee_email` (text NOT NULL), `invitee_name` (text nullable), `requested_time_start` (timestamp NOT NULL), `status` (pgEnum: `waiting|notified|booked|expired`), `booking_slot_json` (jsonb NOT NULL default `{}`), `created_at`, `updated_at`
- [ ] Indexes: `(event_type_id, status)`, `(invitee_email, status)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- waitlist.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑012.0.25 (AGENT): Read DB‑APPT‑009. No action — pause.
- [ ] DB‑APPT‑012.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/waitlist.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑012.2 (AGENT): Implement table, enum, Zod schemas; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑012.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑013: Define No‑Show Log Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No no‑show log table. No‑show tracking and collection policy enforcement are blocked.
**Size:** Small

**Description:** Define the append‑only `no_show_log` table for recording no‑show events per appointment. Unique constraint per appointment ensures a single no‑show record per booking.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 collections and no‑show policy enforcement
**Related Files:** `lib/db/src/schema/appointments/no_show_log.ts`, `lib/db/src/__tests__/no‑show‑log.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `appointment_id` (FK → appointments), `organization_id` (FK), `marked_by_user_id` (FK → users), `no_show_at` (timestamp NOT NULL), `notes` (text nullable), `created_at` (NO `updated_at`, NO `deleted_at` — append‑only)
- [ ] Unique constraint on `appointment_id` — one no‑show record per appointment
- [ ] Indexes: `(organization_id)`, unique `(appointment_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- no‑show‑log.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑013.0.25 (AGENT): Read DB‑APPT‑001 and DB‑IDENTITY‑001. No action — pause.
- [ ] DB‑APPT‑013.1 (AGENT): Write failing schema test including unique constraint and no `updated_at` assertion. **File:** `lib/db/src/__tests__/no‑show‑log.test.ts` **Verification:** RED.
- [ ] DB‑APPT‑013.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑013.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Firm‑Side Appointment Management

### [ ] FRONT‑APPT‑001: Dedicated Appointments Page (Firm‑Side)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No standalone Appointments page exists. Appointment data is not loaded from any API.
**Size:** Medium

**Description:** Top‑level firm‑side Appointments page: month/week/day calendar view, appointment list with filters (provider, status, date range), quick actions (confirm, cancel with reason), and a detail slide‑out with client info, appointment history, and notes.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑004`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Appointments.tsx`, `artifacts/apex‑os/src/hooks/appointments/useAppointmentList.ts`, `useConfirmAppointment.ts`, `useCancelAppointment.ts`

**Definition of Done**
- [ ] Appointments page added to Wouter router at `/appointments` behind `ProtectedRoute`
- [ ] Calendar view: month (grid), week (time‑slots), day; appointments shown as colour‑coded blocks by status
- [ ] List view tab: table with provider, client, date/time, duration, status, actions; sortable, paginated
- [ ] Filter bar: provider (multi‑select), status (multi‑select), date range picker
- [ ] Confirm and Cancel actions with optimistic update and sonner toast
- [ ] Detail slide‑out with full appointment info
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- appointments.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Appointment is an aggregate in the Scheduling bounded context. Confirm and Cancel are domain commands — not CRUD updates.
- TDD: MSW returns 3 appointments; assert all 3 render; simulate “Confirm” → assert `PATCH /appointments/:id/confirm` called.
- BDD: “As a firm user, I can see all upcoming appointments on a calendar, confirm or cancel them, and view full appointment details.”

---

### Subtasks
- [ ] FRONT‑APPT‑001.0.25 (AGENT): Check Wouter router and mock data. *No action – pause.*
- [ ] FRONT‑APPT‑001.1 (AGENT): Create `useAppointmentList`, `useConfirmAppointment`, `useCancelAppointment` hooks. **File(s):** `artifacts/apex‑os/src/hooks/appointments/useAppointmentList.ts`, etc. **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑APPT‑001.2 (AGENT): Build `Appointments.tsx` — calendar, list, filter bar, detail slide‑out. **File(s):** `artifacts/apex‑os/src/pages/Appointments.tsx` **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑APPT‑001.3 (AGENT): Add `/appointments` route behind `ProtectedRoute`. **File(s):** `artifacts/apex‑os/src/App.tsx` **Verification:** `pnpm typecheck` passes.
- [ ] FRONT‑APPT‑001.4 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/pages/__tests__/appointments.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑001.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Client Booking Flow

### [ ] FRONT‑APPT‑002: Client Booking Flow (Public + Portal)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No public booking page or client‑facing booking flow exists.
**Size:** Medium

**Description:** Multi‑step client booking experience accessible both publicly (no auth) and within the client portal (authenticated, pre‑filled info). Steps: select event type → pick a time slot → fill invitee form → confirmation screen. Portal variant pre‑fills name, email, phone.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑004`, `infrastructure/AUTH.md → FRONT‑AUTH‑003`, `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑011`
**Blocks:** `appointments/APPOINTMENTS‑BOOKING.md → FRONT‑APPT‑005`
**Related Files:** `artifacts/apex‑os/src/pages/Booking.tsx`, `SlotPicker.tsx`, `useAvailableSlots.ts`, `useRequestAppointment.ts`

**Definition of Done**
- [ ] Public booking page at `/book/:eventTypeSlug` (no auth required)
- [ ] Step 1 – Event type selector; Step 2 – Date picker + SlotPicker; Step 3 – Invitee form with custom questions; Step 4 – Confirmation screen with calendar links
- [ ] Portal variant: pre‑fills info and applies portal branding
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- Booking.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Booking is a multi‑step process ending in creating an Appointment aggregate.
- TDD: MSW returns available slots; simulate slot selection → assert form appears; submit → assert `POST /appointments` called.
- BDD: “As a client, I can visit a public booking page, pick a time, and receive a confirmation with calendar invite options.”

---

### Subtasks
- [ ] FRONT‑APPT‑002.1 (AGENT): Create `useAvailableSlots` and `useRequestAppointment` hooks. **File(s):** `artifacts/apex‑os/src/hooks/appointments/useAvailableSlots.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑002.2 (AGENT): Build multi‑step booking page. **File(s):** `artifacts/apex‑os/src/pages/Booking.tsx`, `SlotPicker.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑002.3 (AGENT): Apply portal branding variant and `.ics` calendar link. **File(s):** `artifacts/apex‑os/src/pages/Booking.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑002.4 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/Booking.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑002.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑APPT‑006: My Availability Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No per‑user availability management UI exists.
**Size:** Medium

**Description:** Per‑user availability dashboard: weekly calendar showing defined availability windows, date‑specific overrides, external calendar connection status, and utilisation metrics.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑015`, `API‑APPT‑016`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/AvailabilityDashboard.tsx`

**Definition of Done**
- [ ] Weekly grid with coloured time bands; click‑to‑edit windows
- [ ] Add/edit availability window modal; date‑specific overwrite
- [ ] External calendar connection status; OAuth popup for Google/Outlook
- [ ] Metrics strip: upcoming appointments, utilisation %
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- AvailabilityDashboard.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Availability Rules are value objects scoped to a User aggregate.
- TDD: MSW returns availability windows; assert grid shows coloured bands.
- BDD: “As a firm user, I can set my weekly availability hours, add day‑specific overrides, and see how booked my schedule is.”

---

### Subtasks
- [ ] FRONT‑APPT‑006.1 (AGENT): Create `useAvailabilityRules` and `useCalendarConnections` hooks. **File(s):** `artifacts/apex‑os/src/hooks/appointments/useAvailabilityRules.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑006.2 (AGENT): Build weekly availability grid and add/edit window modal. **File(s):** `artifacts/apex‑os/src/components/appointments/AvailabilityDashboard.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑006.3 (AGENT): Add date‑specific overrides, external calendar status, metrics strip. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑006.4 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/AvailabilityDashboard.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑006.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑APPT‑005: Booking Page Builder & Embed
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No public booking page customisation or embed code generator exists.
**Size:** Medium

**Description:** Customisable public booking page editor: logo, colour scheme, welcome message, event type visibility selector, live preview panel, and embed code generator.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑011`, `appointments/APPOINTMENTS‑BOOKING.md → FRONT‑APPT‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/BookingPageBuilder.tsx`

**Definition of Done**
- [ ] Branding editor: logo, colour picker, welcome message; event type visibility toggles
- [ ] Live preview panel (iframe); embed code tab with copy buttons
- [ ] Auto‑save with 3‑second debounce
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- BookingPageBuilder.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Booking Page Settings is a tenant configuration value object.
- TDD: Simulate colour change → assert debounced `PATCH` called; simulate copy button → assert clipboard API called.
- BDD: “As a firm admin, I can customise my public booking page and get an embed code to put on my website.”

---

### Subtasks
- [ ] FRONT‑APPT‑005.1 (AGENT): Build branding editor and event type visibility selector. **File(s):** `artifacts/apex‑os/src/components/appointments/BookingPageBuilder.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑005.2 (AGENT): Add live preview panel and auto‑save debounce. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑005.3 (AGENT): Build embed code tab; write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/BookingPageBuilder.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑005.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
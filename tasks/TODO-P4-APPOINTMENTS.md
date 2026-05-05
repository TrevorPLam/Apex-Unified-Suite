# TODO-P4-APPOINTMENTS.md – Phase 4 Appointments Calendly‑Style Depth



This file covers the Appointments context with Calendly-style depth: event types, routing forms, no-show tracking, waitlists, and granular availability rules. Portal identity is separate from firm identity.

---

*These tasks extend the Appointments context beyond basic booking to include Calendly-inspired depth: event types, routing forms, no-show tracking, waitlists, and granular availability rules.*

### [ ] API‑APPT‑011: Event Type Configuration API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No `EventType` endpoints exist. `event_types` table has no Drizzle schema. Custom questions, group size, buffer configuration, and soft-delete are all unimplemented.  
**Size:** Large  

**Description:** Implement full CRUD for event types supporting one-on-one, round-robin, collective, and group formats with custom questions, availability overrides, and soft delete.  

**Depends on:** DB‑APPT‑009, DB‑APPT‑010, AUTH‑008  
**Blocks:** API‑APPT‑012 (routing forms reference event types), API‑APPT‑015 (availability per event type), API‑APPT‑020 (ownership type extension)  
**Related Files:** `artifacts/api-server/src/services/appointments/event-type-service.ts`, `lib/db/src/repositories/event-types.ts`, `artifacts/api-server/src/routes/appointments/event-types.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, and, isNull); `event_types` schema; event bus
- Exports: `EventTypeService` (class), `EventTypeRepository` (class), `EventTypeCreated` (event), `EventTypeUpdated` (event)

**Definition of Done**
- [ ] `GET /appointments/event-types` — list with pagination; filter by `type`, `is_active`
- [ ] `POST /appointments/event-types` — create; body includes `name`, `type`, `duration_minutes`, `buffer_before/after_minutes`, `daily_booking_limit`, `location_type`, `location_value`, `is_secret`, `cancellation_policy_json`, `reschedule_policy_json`, `max_group_size`, `questions`, `availability_overrides`
- [ ] `GET /appointments/event-types/{eventTypeId}` — detail with questions and availability rules
- [ ] `PATCH /appointments/event-types/{eventTypeId}` — update configuration
- [ ] `DELETE /appointments/event-types/{eventTypeId}` — soft delete; existing bookings remain valid
- [ ] `POST /appointments/event-types/{eventTypeId}/toggle-secret` — toggles `is_secret` flag
- [ ] `EventTypeCreated` and `EventTypeUpdated` domain events emitted
- [ ] Integration tests: create one-on-one type, create group type with max size, update buffers, list by type, soft delete, verify secret toggle
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time availability slot calculation
- Calendar integrations (Google Calendar, Outlook)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Soft delete only — never hard-delete event types with existing bookings

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/appointments/event-type-service.ts`, `lib/db/src/repositories/event-types.ts`, `artifacts/api-server/src/routes/appointments/event-types.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/event-types.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service, repository, route files; no DB state changes
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- All queries scoped to `organization_id` — never return cross-org event types
- `questions` JSON structure must be validated with Zod before persistence
- Emit events AFTER transaction commits, never inside

**Verification**
```bash
pnpm --filter @workspace/api-server test -- event-types.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `EventTypeService` method count ≤ 7; encapsulates full event type lifecycle
- `questions` array stored as JSONB; validated with Zod array schema at request boundary
- Soft delete: `UPDATE event_types SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2`

**Anti-Patterns**
- Hard deleting event types with existing bookings — data integrity violation
- Inline business logic in routes — move to `EventTypeService`
- Unscoped queries missing `organization_id` filter — cross-org data leak

**DDD / TDD / BDD / Deep Module notes**
- DDD: `EventType` is the core scheduling configuration aggregate in the Appointments bounded context
- TDD: Write tests for soft-delete and group max_size validation before implementing
- BDD: "As a firm admin, I create a Group event type with a max of 10 attendees so multiple clients can book the same slot"
- Deep Module: `EventTypeService` hides event type lifecycle, question validation, buffer logic, and soft-delete behind ≤7 public methods

---

### Subtasks

- [ ] API‑APPT‑011.0.25 (AGENT): Read this task, `DB‑APPT‑009/010` schemas, `AUTH‑008` middleware, and `lib/api-spec/openapi.yaml` structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑011.0.5 (AGENT): Research Calendly event type configuration patterns (May 2026). Confirm JSONB schema for `questions` and `cancellation_policy_json`.  
  *Document findings briefly or note "no changes."*

- [ ] API‑APPT‑011.0.75 (AGENT): Reason about soft-delete semantics: should `GET /event-types` list include soft-deleted items by default? Default: exclude (filter `deleted_at IS NULL`); add `?include_deleted=true` for admin.  
  *If uncertain, use default.*

- [ ] API‑APPT‑011.1 (AGENT): Add event type paths and schemas to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** `pnpm --filter @workspace/api-spec run codegen` passes; generated types available.

- [ ] API‑APPT‑011.2 (AGENT): Write integration tests (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/event-types.test.ts`  
  **Verification:** Tests compile and fail (no implementation).

- [ ] API‑APPT‑011.3 (AGENT): Implement `EventTypeRepository` and `EventTypeService`.  
  **File(s):** `lib/db/src/repositories/event-types.ts`, `artifacts/api-server/src/services/appointments/event-type-service.ts`  
  **Verification:** Unit tests pass.

- [ ] API‑APPT‑011.4 (AGENT): Create routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/appointments/event-types.ts`  
  **Verification:** All event type integration tests green.

- [ ] API‑APPT‑011.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑APPT‑012: Routing Forms API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No routing form endpoints exist. `routing_forms` table has no Drizzle schema. Conditional invitee qualification logic is unimplemented.  
**Size:** Medium  

**Description:** Implement routing form management with create/read/update/delete and a test endpoint that evaluates conditional steps and returns the matching event type or a disqualification message.  

**Depends on:** DB‑APPT‑011, API‑APPT‑011 (event types must exist for routing targets)  
**Blocks:** [N/A]  
**Related Files:** `artifacts/api-server/src/services/appointments/routing-form-service.ts`, `lib/db/src/repositories/routing-forms.ts`, `artifacts/api-server/src/routes/appointments/routing-forms.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, isNull); `routing_forms` schema; `EventTypeRepository`
- Exports: `RoutingFormService` (class), `RoutingFormRepository` (class)

**Definition of Done**
- [ ] `GET /appointments/routing-forms` — list routing forms for the organisation
- [ ] `POST /appointments/routing-forms` — create; body: `{ name, description?, steps_json }` where each step is `{ question_id, answers: [{ value, target_event_type_id | disqualification_message }] }`
- [ ] `GET /appointments/routing-forms/{formId}` — detail with steps
- [ ] `PATCH /appointments/routing-forms/{formId}` — update steps, name, active status
- [ ] `DELETE /appointments/routing-forms/{formId}` — soft delete
- [ ] `POST /appointments/routing-forms/{formId}/test` — evaluate sample answers; returns matching event type ID or disqualification message
- [ ] Integration tests: create form, test routing logic with valid and invalid answers, update steps, soft delete
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Public-facing routing form embed widget
- Multi-page form with back-navigation

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/appointments/routing-form-service.ts`, `lib/db/src/repositories/routing-forms.ts`, `artifacts/api-server/src/routes/appointments/routing-forms.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/routing-forms.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service, repository, route files; no DB state changes
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- `steps_json` must be Zod-validated at request boundary before persistence
- The `/test` endpoint is read-only — it must never persist anything
- All forms scoped to `organization_id`

**Verification**
```bash
pnpm --filter @workspace/api-server test -- routing-forms.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Conditional routing engine: iterate steps in order, evaluate answer match, return first matching `target_event_type_id`
- `steps_json` as JSONB with Zod schema: `z.array(z.object({ question_id: z.string(), answers: z.array(...) }))`

**Anti-Patterns**
- Routing logic in route handler — belongs in `RoutingFormService`
- Mutating state in the `/test` endpoint — must be side-effect free

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routing forms qualify invitees and direct them to the correct event type — application service layer, not a domain aggregate
- TDD: Write test for the routing engine (match vs. no-match vs. disqualification) before implementing
- BDD: "As a firm, I create a routing form that asks budget questions and directs enterprise leads to the 60-min event type"
- Deep Module: `RoutingFormService.evaluate(formId, answers)` hides step traversal, answer matching, and disqualification logic

---

### Subtasks

- [ ] API‑APPT‑012.0.25 (AGENT): Read this task, `DB‑APPT‑011` schema, `API‑APPT‑011` event type service, and existing OpenAPI structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑012.0.5 (AGENT): Research conditional routing form patterns for scheduling tools (May 2026). Confirm JSONB schema for `steps_json`.  
  *Document findings briefly or note "no changes."*

- [ ] API‑APPT‑012.0.75 (AGENT): Reason about `/test` endpoint semantics. Default: stateless evaluation — no bookings created, no audit log entry.  
  *If uncertain, use that approach.*

- [ ] API‑APPT‑012.1 (AGENT): Add routing form paths and schemas to OpenAPI; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; generated types available.

- [ ] API‑APPT‑012.2 (AGENT): Write integration tests (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/routing-forms.test.ts`  
  **Verification:** Tests compile and fail (no implementation).

- [ ] API‑APPT‑012.3 (AGENT): Implement `RoutingFormRepository` and `RoutingFormService`.  
  **File(s):** `lib/db/src/repositories/routing-forms.ts`, `artifacts/api-server/src/services/appointments/routing-form-service.ts`  
  **Verification:** Unit tests pass; routing engine returns correct event type.

- [ ] API‑APPT‑012.4 (AGENT): Create routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/appointments/routing-forms.ts`  
  **Verification:** All routing form integration tests green.

- [ ] API‑APPT‑012.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑APPT‑013: No-Show Management API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No no-show tracking endpoints. `no_show_log` table has no Drizzle schema. Appointments have no `no_show` status and client restriction logic is absent.  
**Size:** Small  

**Description:** Implement no-show marking, per-client history lookup, client restriction after repeated no-shows, and a `NoShowRecorded` domain event.  

**Depends on:** DB‑APPT‑013, API‑APPT‑001 (appointments CRUD)  
**Blocks:** [N/A]  
**Related Files:** `artifacts/api-server/src/services/appointments/no-show-service.ts`, `lib/db/src/repositories/no-show.ts`, `artifacts/api-server/src/routes/appointments/no-show.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, and); `no_show_log` schema; `appointments` schema; event bus
- Exports: `NoShowService` (class), `NoShowRepository` (class), `NoShowRecorded` (event)

**Definition of Done**
- [ ] `POST /appointments/{appointmentId}/mark-no-show` — mark as no-show; body: `{ notes? }`; creates `no_show_log` entry; updates appointment status to `no_show`; requires firm auth
- [ ] `GET /appointments/{appointmentId}/no-show` — get no-show status for appointment
- [ ] `GET /clients/{clientId}/no-show-history` — list no-show history for a client
- [ ] `POST /appointments/{appointmentId}/restrict-client` — restrict client from future bookings (admin only)
- [ ] Attempt to book while restricted → 403 `ClientRestricted`
- [ ] `NoShowRecorded` domain event emitted on mark-no-show
- [ ] Integration tests: mark no-show, verify history, restrict client, attempt booking → 403
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automatic no-show marking after appointment time passes
- Email notifications on no-show

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `restrict-client` endpoint must be admin-only — verify role in auth middleware

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/appointments/no-show-service.ts`, `lib/db/src/repositories/no-show.ts`, `artifacts/api-server/src/routes/appointments/no-show.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/no-show.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service, repository, route files; no DB state changes
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- `mark-no-show` must be idempotent — repeated calls on same appointment return 200 without duplicate log entry
- `restrict-client` must check admin role before applying
- All queries scoped to `organization_id`

**Verification**
```bash
pnpm --filter @workspace/api-server test -- no-show.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Idempotent no-show: `INSERT INTO no_show_log ... ON CONFLICT (appointment_id) DO NOTHING`
- Client restriction check in booking validation: `SELECT is_restricted FROM clients WHERE id = $clientId AND organization_id = $orgId`

**Anti-Patterns**
- Non-idempotent no-show marking creating duplicate log entries
- Client restriction enforced in service only — must also be enforced in `BookingService` booking check

**DDD / TDD / BDD / Deep Module notes**
- DDD: No-show tracking is an application service concern; no-show records are value objects, not aggregates
- TDD: Write test for restricted client booking rejection before implementing restriction logic
- BDD: "When a client is a no-show, the firm marks them and the client cannot book future appointments"
- Deep Module: `NoShowService` hides log creation, status update, restriction enforcement, and event emission

---

### Subtasks

- [ ] API‑APPT‑013.0.25 (AGENT): Read this task, `DB‑APPT‑013` schema, `API‑APPT‑001` booking service, and `AUTH‑008` middleware in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑013.0.5 (AGENT): Confirm idempotency strategy for `mark-no-show` (ON CONFLICT vs. pre-check query).  
  *Document findings briefly.*

- [ ] API‑APPT‑013.0.75 (AGENT): Reason about restriction enforcement location. Default: enforce in `BookingService.create()` with a `checkClientRestriction()` call before allowing booking.  
  *If uncertain, use that approach.*

- [ ] API‑APPT‑013.1 (AGENT): Add no-show paths to OpenAPI; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; generated types available.

- [ ] API‑APPT‑013.2 (AGENT): Write integration tests (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/no-show.test.ts`  
  **Verification:** Tests compile and fail (no implementation).

- [ ] API‑APPT‑013.3 (AGENT): Implement `NoShowRepository` and `NoShowService`.  
  **File(s):** `lib/db/src/repositories/no-show.ts`, `artifacts/api-server/src/services/appointments/no-show-service.ts`  
  **Verification:** Unit tests pass.

- [ ] API‑APPT‑013.4 (AGENT): Create routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/appointments/no-show.ts`  
  **Verification:** All no-show integration tests green.

- [ ] API‑APPT‑013.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑APPT‑014: Waitlist Management API
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟠 High  
**Current State:** No waitlist endpoints. `waitlist_entries` table has no Drizzle schema. Automatic slot-filling logic when an appointment is cancelled is unimplemented.  
**Size:** Medium  

**Description:** Implement waitlist join/leave/list endpoints and automatic slot-filling: when an appointment is cancelled and the slot opens, the service books the first eligible waitlist entry and emits `WaitlistBookingCreated`.  

**Depends on:** DB‑APPT‑012, API‑APPT‑011 (event type required for waitlist entry)  
**Blocks:** [N/A]  
**Related Files:** `artifacts/api-server/src/services/appointments/waitlist-service.ts`, `lib/db/src/repositories/waitlist.ts`, `artifacts/api-server/src/routes/appointments/waitlist.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, and, isNull, asc); `waitlist_entries` schema; `BookingService`; event bus; `EmailService`
- Exports: `WaitlistService` (class), `WaitlistRepository` (class), `WaitlistBookingCreated` (event)

**Definition of Done**
- [ ] `POST /appointments/event-types/{eventTypeId}/waitlist/join` — join waitlist; body: `{ invitee_email, invitee_name?, requested_time_start }`
- [ ] `GET /appointments/waitlist` — list waitlist entries; filter by `event_type_id`, `status`
- [ ] `GET /appointments/waitlist/{entryId}` — detail
- [ ] `DELETE /appointments/waitlist/{entryId}` — remove entry (invitee cancels)
- [ ] Automatic booking logic: when appointment is cancelled, check waitlist for matching entries, book first eligible, emit `WaitlistBookingCreated`, notify invitee via email
- [ ] Duplicate join prevention: second join for same email+time slot → 409 `AlreadyOnWaitlist`
- [ ] Integration tests: join waitlist, cancel appointment and verify waitlist booking, remove entry, verify duplicate prevention
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Priority queue / VIP waitlist ordering
- Real-time waitlist position notifications (WebSocket)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Automatic booking must run inside a transaction — if booking fails, waitlist entry remains unchanged

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/appointments/waitlist-service.ts`, `lib/db/src/repositories/waitlist.ts`, `artifacts/api-server/src/routes/appointments/waitlist.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/waitlist.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service, repository, route files; no DB state changes
- Halt condition: if automatic booking transaction fails in tests, stop and debug atomicity

**Rules to Follow**
- Automatic slot-fill must be transactional — use Drizzle transaction wrapping both `createBooking` and `updateWaitlistStatus`
- Duplicate join: use `INSERT ... ON CONFLICT DO NOTHING RETURNING id` and return 409 if no row returned
- Notification email sent only after transaction commits

**Verification**
```bash
pnpm --filter @workspace/api-server test -- waitlist.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Transactional slot-fill: `db.transaction(async tx => { await bookingRepo.create(tx, ...); await waitlistRepo.updateStatus(tx, entryId, 'booked'); })`
- Duplicate prevention: `INSERT INTO waitlist_entries (...) ON CONFLICT (event_type_id, invitee_email, requested_time_start) DO NOTHING RETURNING id`

**Anti-Patterns**
- Non-transactional slot-fill that can create bookings without updating waitlist entry
- Sending notification emails inside the transaction — send after commit

**DDD / TDD / BDD / Deep Module notes**
- DDD: Waitlist is an aggregate in Appointments; automatic booking is a domain service that coordinates `WaitlistEntry` and `Appointment` aggregates
- TDD: Write the slot-fill test (cancel → automatic booking) before implementing the cancellation hook
- BDD: "When an appointment is cancelled, the first person on the waitlist is automatically booked and notified"
- Deep Module: `WaitlistService` hides FIFO selection, transactional booking, notification dispatch, and event emission

---

### Subtasks

- [ ] API‑APPT‑014.0.25 (AGENT): Read this task, `DB‑APPT‑012` schema, `API‑APPT‑011` event type service, and `BookingService` cancellation hook in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑014.0.5 (AGENT): Research FIFO waitlist + automatic booking patterns (May 2026). Confirm transaction isolation level needed.  
  *Document findings briefly.*

- [ ] API‑APPT‑014.0.75 (AGENT): Reason about where to hook into cancellation. Default: `BookingService.cancel()` calls `waitlistService.fillSlot(appointmentId)` after marking appointment cancelled.  
  *If uncertain, use that approach.*

- [ ] API‑APPT‑014.1 (AGENT): Add waitlist paths to OpenAPI; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; generated types available.

- [ ] API‑APPT‑014.2 (AGENT): Write integration tests (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/waitlist.test.ts`  
  **Verification:** Tests compile and fail (no implementation).

- [ ] API‑APPT‑014.3 (AGENT): Implement `WaitlistRepository` and `WaitlistService` with automatic booking.  
  **File(s):** `lib/db/src/repositories/waitlist.ts`, `artifacts/api-server/src/services/appointments/waitlist-service.ts`  
  **Verification:** Unit tests pass; slot-fill transaction verified.

- [ ] API‑APPT‑014.4 (AGENT): Create routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/appointments/waitlist.ts`  
  **Verification:** All waitlist integration tests green.

- [ ] API‑APPT‑014.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑APPT‑015: Time Zone & Availability Rules API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No availability override or per-event-type booking rule endpoints. No time zone conversion for availability slots. `availability_overrides` table has no Drizzle schema.  
**Size:** Medium  

**Description:** Implement per-event-type availability overrides (date-specific and recurring), booking rule configuration (min notice, max advance, daily limit, slot increments), and time zone-aware slot querying.  

**Depends on:** DB‑APPT‑009, API‑APPT‑011 (event types must exist)  
**Blocks:** [N/A]  
**Related Files:** `artifacts/api-server/src/services/appointments/availability-service.ts`, `lib/db/src/repositories/availability-overrides.ts`, `artifacts/api-server/src/routes/appointments/availability.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, and); `availability_overrides` schema; `Intl.DateTimeFormat` or `luxon`
- Exports: `AvailabilityService` (class), `AvailabilityOverrideRepository` (class)

**Definition of Done**
- [ ] `GET /appointments/event-types/{eventTypeId}/availability-overrides` — list overrides
- [ ] `POST /appointments/event-types/{eventTypeId}/availability-overrides` — create; body: `{ date?, day_of_week?, start_time?, end_time?, is_blocked }`
- [ ] `DELETE /appointments/event-types/{eventTypeId}/availability-overrides/{overrideId}` — remove override
- [ ] `GET /appointments/event-types/{eventTypeId}/booking-rules` — get rules: `min_scheduling_notice_hours`, `max_booking_advance_days`, `start_time_increments_minutes`, `daily_booking_limit`
- [ ] `PUT /appointments/event-types/{eventTypeId}/booking-rules` — update rules
- [ ] `GET /appointments/availability?timezone=America/New_York&event_type_id=...` — returns slots in invitee's local timezone; applies booking rules and overrides
- [ ] Integration tests: set date override, list, delete; update per-event booking rules; query availability in two different timezones
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Calendar sync (Google/Outlook busy/free query)
- Recurring availability schedule (handled by base event type config)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Timezone must be validated against IANA tz database before use

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/appointments/availability-service.ts`, `lib/db/src/repositories/availability-overrides.ts`, `artifacts/api-server/src/routes/appointments/availability.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/availability.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service, repository, route files; no DB state changes
- Halt condition: if timezone conversion produces incorrect UTC offset in tests, stop and fix

**Rules to Follow**
- All times stored as UTC in DB; convert to requested timezone at query time only
- IANA timezone validation: use `Intl.supportedValuesOf('timeZone').includes(tz)` before accepting
- `is_blocked = true` overrides completely block the slot; `is_blocked = false` opens a custom window

**Verification**
```bash
pnpm --filter @workspace/api-server test -- availability.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Timezone-aware slot generation: generate UTC slots → apply `Intl.DateTimeFormat` offset → return in requested tz
- Override merge: date-specific overrides take precedence over `day_of_week` overrides

**Anti-Patterns**
- Storing times in local timezone in DB — always UTC
- Accepting unvalidated IANA timezone strings — use `Intl.supportedValuesOf` check

**DDD / TDD / BDD / Deep Module notes**
- DDD: Availability rules are configuration of the `EventType` aggregate; overrides are a child collection
- TDD: Write timezone conversion test for `America/New_York` vs `Asia/Tokyo` before implementing slot generation
- BDD: "As an invitee in Tokyo, I see appointment slots in my local timezone, not the firm's timezone"
- Deep Module: `AvailabilityService.getSlots(eventTypeId, timezone, date)` hides override lookup, booking rule application, and timezone conversion

---

### Subtasks

- [ ] API‑APPT‑015.0.25 (AGENT): Read this task, `DB‑APPT‑009` schema, `API‑APPT‑011` event type config, and existing timezone handling patterns in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑015.0.5 (AGENT): Research IANA timezone validation with `Intl.supportedValuesOf` (Node.js 18+ May 2026). Confirm no external tz library is needed.  
  *Document findings briefly.*

- [ ] API‑APPT‑015.0.75 (AGENT): Reason about override precedence: date-specific vs. day_of_week vs. base schedule. Confirm merge order.  
  *If uncertain, use: date-specific > day_of_week > base event type schedule.*

- [ ] API‑APPT‑015.1 (AGENT): Add availability override and booking rule paths to OpenAPI; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; generated types available.

- [ ] API‑APPT‑015.2 (AGENT): Write integration tests (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/availability.test.ts`  
  **Verification:** Tests compile and fail (no implementation).

- [ ] API‑APPT‑015.3 (AGENT): Implement `AvailabilityOverrideRepository` and `AvailabilityService`.  
  **File(s):** `lib/db/src/repositories/availability-overrides.ts`, `artifacts/api-server/src/services/appointments/availability-service.ts`  
  **Verification:** Unit tests pass; timezone conversion verified.

- [ ] API‑APPT‑015.4 (AGENT): Create routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/appointments/availability.ts`  
  **Verification:** All availability integration tests green.

- [ ] API‑APPT‑015.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑APPT‑020: Shared vs. Team Event Type Configuration
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** `event_types` table lacks `ownership_type` field. All event types are implicitly personal. No visibility filtering based on ownership and no admin lock for team event types.  
**Size:** Small  

**Description:** Add `ownership_type` enum (`personal` | `shared` | `team`) to event types, implement visibility filtering in list/detail endpoints, and enforce admin-only controls for `team` event types.  

**Depends on:** API‑APPT‑011 (event type endpoints must exist)  
**Blocks:** [N/A]  
**Related Files:** `lib/db/src/schema/appointments.ts`, `artifacts/api-server/src/services/appointments/event-type-service.ts`, `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: `pgEnum` from drizzle-orm/pg-core; existing `eventTypes` table schema; `EventTypeService`
- Exports: `ownershipTypeEnum` (Drizzle enum), updated `eventTypes` table schema

**Definition of Done**
- [ ] `ownership_type` column added to `event_types` Drizzle schema (default: `'personal'`); migration generated
- [ ] `POST /appointments/event-types` accepts `ownership_type` field; Zod schema updated
- [ ] `GET /appointments/event-types` filters: `personal` → only requester's event types; `shared` → all org members see them; `team` → visible to all but admin-managed
- [ ] `PATCH /appointments/event-types/{eventTypeId}` on `team` type → requires admin role
- [ ] Integration test: member creates `shared` event type → all org members see it in list
- [ ] Integration test: non-admin patches `team` event type → 403 `AdminRequired`
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Enterprise-tier team event type controls (handled in ENT‑APPT‑001)
- UI panel changes

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- DB schema change requires `pnpm --filter @workspace/db run push` — requires user approval

**Output Artifacts**
- Code changes in: `lib/db/src/schema/appointments.ts`, `artifacts/api-server/src/services/appointments/event-type-service.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/appointments/event-types.test.ts` (add ownership scenarios)
- Documentation: [N/A]
- Migration files: `lib/db/drizzle/` (generated by `pnpm --filter @workspace/db run push`)

**Rollback**
- Granularity: migration-level — revert Drizzle schema; regenerate; requires DB push to revert column (user approval)
- Halt condition: if DB push fails, stop and verify migration SQL before retrying

**Rules to Follow**
- `ownership_type` must use a Drizzle `pgEnum` — not a plain `varchar` with CHECK constraint
- Default `'personal'` must be set at the DB column level, not only in application code
- Admin check must use the same role-checking middleware as other admin-only endpoints

**Verification**
```bash
# After user approves DB push:
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server test -- event-types.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `pgEnum('ownership_type', ['personal', 'shared', 'team'])` at schema level
- Visibility filter in `EventTypeRepository.list()`: `WHERE organization_id = $orgId AND (ownership_type = 'shared' OR ownership_type = 'team' OR (ownership_type = 'personal' AND created_by = $userId))`

**Anti-Patterns**
- Checking ownership_type in route handler — belongs in `EventTypeService.list()` with user context
- `varchar` column with application-level enum — use `pgEnum` for DB-level constraint

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ownership_type` is an attribute of the `EventType` aggregate that controls visibility invariants
- TDD: Write visibility filter test before implementing the column; test all three ownership types
- BDD: "As a team member, I create a Shared event type that every colleague can see without admin approval"
- Deep Module: `EventTypeService.list(userId, orgId)` applies visibility filter internally — callers don't know the filter logic

---

### Subtasks

- [ ] API‑APPT‑020.0.25 (AGENT): Read this task, `API‑APPT‑011` event type schema, and existing Drizzle enum patterns in the codebase in full.  
  *No action — pause until fully understood.*

- [ ] API‑APPT‑020.0.5 (AGENT): Confirm `pgEnum` syntax in Drizzle v0.31 (May 2026). Verify that adding an enum column requires a migration.  
  *Document findings briefly.*

- [ ] API‑APPT‑020.0.75 (AGENT): Reason about visibility filter SQL. Default: `WHERE org_id = $orgId AND (ownership_type IN ('shared', 'team') OR (ownership_type = 'personal' AND created_by = $userId))`.  
  *If uncertain, use that query.*

- [ ] API‑APPT‑020.1 (AGENT): Update Drizzle schema with `ownership_type` enum column.  
  **File(s):** `lib/db/src/schema/appointments.ts`  
  **Verification:** `pnpm run typecheck` clean; migration SQL generated.

- [ ] API‑APPT‑020.2 (HUMAN): Approve and run DB push.  
  **File(s):** [N/A — DB operation]  
  **Verification:** `pnpm --filter @workspace/db run push` succeeds.

- [ ] API‑APPT‑020.3 (AGENT): Update OpenAPI spec and run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; `ownership_type` enum in generated types.

- [ ] API‑APPT‑020.4 (AGENT): Update `EventTypeService` with visibility filtering and admin enforcement.  
  **File(s):** `artifacts/api-server/src/services/appointments/event-type-service.ts`  
  **Verification:** Unit tests pass for all three ownership types.

- [ ] API‑APPT‑020.5 (AGENT): Add ownership integration tests to existing test file.  
  **File(s):** `artifacts/api-server/src/__tests__/api/appointments/event-types.test.ts`  
  **Verification:** All ownership scenario tests green.

- [ ] API‑APPT‑020.6 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
API‑APPT‑011 (event type CRUD)
  ├─> API‑APPT‑012 (routing forms)
  ├─> API‑APPT‑015 (availability rules)
  └─> API‑APPT‑020 (ownership type extension)
API‑APPT‑013 (no-show management) [parallel, depends on API‑APPT‑001]
API‑APPT‑014 (waitlist) [depends on API‑APPT‑011]
```  
**Definition of Done:** Full CRUD for event types:  
- `GET /api/v1/appointments/event‑types` – list event types with pagination, filter by `type` (one‑on‑one/round‑robin/collective/group), `is_active`.  
- `POST /api/v1/appointments/event‑types` – create event type. Body includes: `name`, `type`, `duration_minutes`, `buffer_before/after_minutes`, `daily_booking_limit`, `location_type`, `location_value`, `is_secret`, `cancellation_policy_json`, `reschedule_policy_json`, `max_group_size` (for group events), `questions` (array of custom questions), `availability_overrides`.  
- `GET /api/v1/appointments/event‑types/{eventTypeId}` – detail with questions and availability rules.  
- `PATCH /api/v1/appointments/event‑types/{eventTypeId}` – update configuration.  
- `DELETE /api/v1/appointments/event‑types/{eventTypeId}` – soft delete (existing bookings for this type remain valid).  
- `POST /api/v1/appointments/event‑types/{eventTypeId}/toggle‑secret` – toggle the `is_secret` flag.  
All operations scoped to the organisation. Emits `EventTypeCreated`, `EventTypeUpdated` events.  
**Integration tests:** create one‑on‑one type, create group type with max size, update buffers, list by type, soft delete, verify secret toggle.  
**DDD:** EventType is the core scheduling configuration aggregate in the Appointments context (Calendly model).  
**Deep Module:** Encapsulates event type lifecycle, question management, and availability override logic.

### Subtasks:
- [ ] API‑APPT‑011.1: Add event type paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; codegen passes.
- [ ] API‑APPT‑011.2: Write integration tests (red). (AGENT) – `artifacts/api-server/__tests__/api/appointments/event-types.test.ts`  
  **verification:** Tests fail (no implementation).
- [ ] API‑APPT‑011.3: Implement `EventTypeService` and `EventTypeRepository`. (AGENT) – `services/appointments/event-type-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑APPT‑011.4: Create routes and run integration tests to green. (AGENT) – `routes/appointments/event-types.ts`  
  **verification:** All event type tests pass.
- [ ] API‑APPT‑011.5: Depth refactor check: method count ≤ 5, service encapsulates event type lifecycle, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Service encapsulates event type complexity
- Event emission verified in tests

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Service layer encapsulation
- Event-driven architecture
- Configuration management

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Shallow service without encapsulation
- Missing event emission tests

---

### [ ] API‑APPT‑012: Routing Forms API
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑011, API‑APPT‑011 (event types must exist).  
**Definition of Done:** Routing form management:  
- `GET /api/v1/appointments/routing‑forms` – list routing forms for the organisation.  
- `POST /api/v1/appointments/routing‑forms` – create routing form. Body: `{ name, description?, steps_json }`. `steps_json` defines conditional logic: each step is `{ question_id, answers: [{ value, target_event_type_id | disqualification_message }] }`.  
- `GET /api/v1/appointments/routing‑forms/{formId}` – detail with steps.  
- `PATCH /api/v1/appointments/routing‑forms/{formId}` – update steps, name, active status.  
- `DELETE /api/v1/appointments/routing‑forms/{formId}` – soft delete.  
- `POST /api/v1/appointments/routing‑forms/{formId}/test` – test the routing form with sample answers; returns the resulting event type or disqualification message.  
**Integration tests:** create form, test routing logic, update steps, soft delete.  
**DDD:** Routing forms qualify invitees and direct them to the correct event type (Calendly feature).  
**Deep Module:** Encapsulates conditional matching logic and routing engine.

### Subtasks:
- [ ] API‑APPT‑012.1: Add routing form paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates.
- [ ] API‑APPT‑012.2: Write integration tests (red). (AGENT) – `artifacts/api-server/__tests__/api/appointments/routing-forms.test.ts`  
  **verification:** Tests fail (no implementation).
- [ ] API‑APPT‑012.3: Implement `RoutingFormService` and repository. (AGENT) – `services/appointments/routing-form-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑APPT‑012.4: Create routes, run tests to green. (AGENT) – `routes/appointments/routing-forms.ts`  
  **verification:** All tests pass.
- [ ] API‑APPT‑012.5: Depth refactor check: method count ≤ 5, service encapsulates routing logic, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Service encapsulates conditional routing logic
- Event emission verified in tests

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Conditional routing engine
- Service layer encapsulation
- Event-driven architecture

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Shallow service without encapsulation
- Missing event emission tests

---

### [ ] API‑APPT‑013: No‑Show Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑013, API‑APPT‑001 (appointments CRUD).  
**Definition of Done:** No‑show tracking endpoints:  
- `POST /api/v1/appointments/{appointmentId}/mark‑no‑show` – mark an appointment as a no‑show. Body: `{ notes? }`. Requires firm auth. Creates entry in `no_show_log` table. Updates appointment status to `no_show`.  
- `GET /api/v1/appointments/{appointmentId}/no‑show` – get no‑show status for an appointment.  
- `GET /api/v1/clients/{clientId}/no‑show‑history` – get no‑show history for a client (for repeat no‑show detection).  
- `POST /api/v1/appointments/{appointmentId}/restrict‑client` – optionally restrict a client from future bookings after repeated no‑shows (admin only).  
Emits `NoShowRecorded` domain event.  
**Integration tests:** mark no‑show, verify history appears, restrict client, attempt to book while restricted → 403.  
**DDD:** Calendly no‑show tracking for reducing wasted slots.

### Subtasks:
- [ ] API‑APPT‑013.1: Add no‑show paths to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates.
- [ ] API‑APPT‑013.2: Write integration tests (red). (AGENT) – `artifacts/api-server/__tests__/api/appointments/no-show.test.ts`  
  **verification:** Tests fail (no implementation).
- [ ] API‑APPT‑013.3: Implement `NoShowService` and repository. (AGENT) – `services/appointments/no-show-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑APPT‑013.4: Create routes, run tests to green. (AGENT) – `routes/appointments/no-show.ts`  
  **verification:** All tests pass.
- [ ] API‑APPT‑013.5: Depth refactor check: method count ≤ 5, service encapsulates no‑show logic, no `throw`. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

**Definition of Done Traceability:**
- No-show tracking endpoints implemented
- Integration tests verify no‑show workflow
- Event emission for `NoShowRecorded` verified
- Client restriction functionality tested
- All subtasks have specific file paths

**Rules to Follow:**
- All subtasks must have specific file paths
- Tests must fail before implementation (TDD red phase)
- Service encapsulates no‑show tracking logic
- Event emission verified in tests

**Advanced Code Patterns:**
- TDD red-green-refactor cycle
- Service layer encapsulation
- Event-driven architecture
- Client restriction logic

**Anti-Patterns:**
- Missing file paths in subtasks
- Writing implementation before tests
- Shallow service without encapsulation
- Missing event emission tests

---

### [ ] API‑APPT‑014: Waitlist Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑012, API‑APPT‑011.  
**Definition of Done:** Waitlist endpoints:  
- `POST /api/v1/appointments/event‑types/{eventTypeId}/waitlist/join` – join waitlist for a specific time slot. Body: `{ invitee_email, invitee_name?, requested_time_start }`.  
- `GET /api/v1/appointments/waitlist` – list waitlist entries for the organisation, filter by `event_type_id`, `status`.  
- `GET /api/v1/appointments/waitlist/{entryId}` – detail.  
- `DELETE /api/v1/appointments/waitlist/{entryId}` – remove entry (invitee cancels).  
- **Automatic booking (service logic):** When an appointment is cancelled and the slot opens, the service checks the waitlist for matching entries, books the first eligible one, and emits `WaitlistBookingCreated`. Notifications sent to the invitee.  
**Integration tests:** join waitlist, cancel an appointment and verify waitlist booking, remove entry, verify duplicate join behaviour.  
**DDD:** Calendly waitlist for fully‑booked slots.

### Subtasks:
- [ ] API‑APPT‑014.1: Add waitlist paths to OpenAPI. (AGENT)  
- [ ] API‑APPT‑014.2: Write integration tests (red). (AGENT)  
- [ ] API‑APPT‑014.3: Implement `WaitlistService` with automatic booking logic. (AGENT)  
- [ ] API‑APPT‑014.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑APPT‑015: Time Zone & Availability Rules API
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑009, API‑APPT‑011.  
**Definition of Done:** Granular availability management per event type:  
- `GET /api/v1/appointments/event‑types/{eventTypeId}/availability‑overrides` – list date‑specific or recurring overrides.  
- `POST /api/v1/appointments/event‑types/{eventTypeId}/availability‑overrides` – create override. Body: `{ date? (specific date), day_of_week?, start_time?, end_time?, is_blocked (bool) }`.  
- `DELETE /api/v1/appointments/event‑types/{eventTypeId}/availability‑overrides/{overrideId}` – remove override.  
- `GET /api/v1/appointments/event‑types/{eventTypeId}/booking‑rules` – get per‑event‑type rules: `min_scheduling_notice_hours`, `max_booking_advance_days`, `start_time_increments_minutes`, `daily_booking_limit`.  
- `PUT /api/v1/appointments/event‑types/{eventTypeId}/booking‑rules` – update per‑event‑type rules.  
- **Time zone support:** `GET /api/v1/appointments/availability?timezone=America/New_York` – returns slots in the invitee's local time zone.  
**Integration tests:** set date override, list, delete; update per‑event booking rules; query availability in different time zones.  
**DDD:** Calendly per‑event scheduling rules and time zone intelligence.

### Subtasks:
- [ ] API‑APPT‑015.1: Add availability override and booking rule paths to OpenAPI. (AGENT)  
- [ ] API‑APPT‑015.2: Write integration tests (red). (AGENT)  
- [ ] API‑APPT‑015.3: Implement availability override and time zone logic. (AGENT)  
- [ ] API‑APPT‑015.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑APPT‑020: Shared vs. Team Event Type Configuration
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑011  
**Why updated:** Calendly distinguishes between Shared event types (quick setup, no admin lock) and Team event types (admin managed). Our event type config doesn't capture this.  
**Definition of Done:**
- Add field `ownership_type` (enum: personal/shared/team) to the event types table.  
- `POST /api/v1/appointments/event‑types` accepts the new field.  
- When `ownership_type=shared`, the event type is visible to all members of the organisation but not locked by admin.  
- When `ownership_type=team`, the admin‑managed sections apply (as defined in ENT‑APPT‑001).  
- UI updates to show different configuration panels based on ownership type.  
**BDD:** "A team member can create a Shared event type that everyone can see, without needing admin approval."  
**TDD:** Integration test verifying ownership type behavior and visibility rules.  
**Deep Module:** Encapsulates event type ownership logic and permission management.  

**Advanced Code Patterns:**  
- Enum-based ownership type validation  
- Permission-based visibility filtering  
- Admin lock enforcement for team event types  
- Shared event type discovery across organization  

**Anti-Patterns:**  
- Missing ownership validation allowing unauthorized access  
- Inconsistent visibility rules across ownership types  
- Hard-coded ownership logic without flexibility  
- Missing admin controls for team event types  

**Database Schema Update:**  
```sql
ALTER TABLE event_types 
ADD COLUMN ownership_type VARCHAR(20) NOT NULL DEFAULT 'personal' 
CHECK (ownership_type IN ('personal', 'shared', 'team'));

-- Update existing event types to default to 'personal'
UPDATE event_types SET ownership_type = 'personal' WHERE ownership_type IS NULL;

-- Index for filtering by ownership type
CREATE INDEX idx_event_types_ownership ON event_types(organization_id, ownership_type, deleted_at);
```

**API Updates:**  
- Extend event type creation/update payload with `ownership_type` field
- Add visibility filtering in list endpoints based on user permissions
- Implement admin-only operations for team event types
- Add shared event type discovery for organization members

---

## Progress Tracking

### Overall Status
**Appointments Context:** [ ] 0/5 parent tasks complete

### Context Breakdown
- **Event Types:** [ ] 0/1 complete (configuration CRUD)
- **Routing Forms:** [ ] 0/1 complete (form management)
- **No‑Show Tracking:** [ ] 0/1 complete (no‑show management)
- **Waitlist Management:** [ ] 0/1 complete (automatic booking)
- **Availability Rules:** [ ] 0/1 complete (time zone + overrides)

### Dependencies
- **DB-APPT-009/010/011/012/013** enable respective database operations
- **API-APPT-001** provides basic appointment CRUD
- **AUTH-008** enables authentication for appointment operations
- **EMAIL-SERVICE-001** enables waitlist notifications

### Next Actions
- [ ] Start API-APPT-011.1: Add event type paths to OpenAPI
- [ ] Start API-APPT-012.1: Add routing form paths to OpenAPI
- [ ] Start API-APPT-013.1: Add no-show paths to OpenAPI

### Verification Commands
```bash
# Event Types verification
pnpm test -- event-types
pnpm typecheck

# Routing Forms verification
pnpm test -- routing-forms
pnpm typecheck

# No-Show verification
pnpm test -- no-show
pnpm typecheck

# Waitlist verification
pnpm test -- waitlist
pnpm typecheck

# Availability Rules verification
pnpm test -- availability-rules
pnpm typecheck
```

---

## File Index

### Event Types
- `lib/api-spec/openapi.yaml` - Event type OpenAPI paths and schemas
- `artifacts/api-server/src/services/appointments/event-type-service.ts` - Event type service
- `lib/db/src/repositories/event-types.ts` - Event type repository
- `routes/appointments/event-types.ts` - Event type routes
- `artifacts/api-server/__tests__/api/appointments/event-types.test.ts` - Integration tests

### Routing Forms
- `artifacts/api-server/src/services/appointments/routing-form-service.ts` - Routing form service
- `lib/db/src/repositories/routing-forms.ts` - Routing form repository
- `routes/appointments/routing-forms.ts` - Routing form routes
- `artifacts/api-server/__tests__/api/appointments/routing-forms.test.ts` - Integration tests

### No-Show Management
- `artifacts/api-server/src/services/appointments/no-show-service.ts` - No-show service
- `lib/db/src/repositories/no-show.ts` - No-show repository
- `routes/appointments/no-show.ts` - No-show routes
- `artifacts/api-server/__tests__/api/appointments/no-show.test.ts` - Integration tests

### Waitlist Management
- `artifacts/api-server/src/services/appointments/waitlist-service.ts` - Waitlist service
- `lib/db/src/repositories/waitlist.ts` - Waitlist repository
- `routes/appointments/waitlist.ts` - Waitlist routes
- `artifacts/api-server/__tests__/api/appointments/waitlist.test.ts` - Integration tests

### Availability Rules
- `artifacts/api-server/src/services/appointments/availability-service.ts` - Availability service
- `lib/db/src/repositories/availability-overrides.ts` - Availability repository
- `routes/appointments/availability.ts` - Availability routes
- `artifacts/api-server/__tests__/api/appointments/availability.test.ts` - Integration tests

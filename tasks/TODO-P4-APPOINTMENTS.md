# TODO-P4-APPOINTMENTS.md – Phase 4 Appointments Calendly‑Style Depth

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Appointments Context with Calendly‑style depth features. These new API tasks extend the Appointments context beyond basic booking to include event types, routing forms, no‑show tracking, waitlists, and granular availability rules. The old `API‑APPT‑005` (ProjectSchedulerService anti‑corruption layer) has been removed because the Scheduler is now a PM‑owned feature.

---

## Appointments – Calendly‑Style Depth

*These new API tasks extend the Appointments context beyond basic booking to include event types, routing forms, no‑show tracking, waitlists, and granular availability rules. The old `API‑APPT‑005` (ProjectSchedulerService – an anti‑corruption layer that gave Projects a read‑only appointment view) has been removed because the Scheduler is now a PM‑owned feature. These five tasks add the Calendly‑inspired depth directly to the Appointments context.*

### [ ] API‑APPT‑011: Event Type Configuration API
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑009, DB‑APPT‑010, AUTH‑008.  
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
  **verification:** Tests fail.
- [ ] API‑APPT‑011.3: Implement `EventTypeService` and `EventTypeRepository`. (AGENT) – `services/appointments/event-type-service.ts`  
  **verification:** Unit tests pass.
- [ ] API‑APPT‑011.4: Create routes and run integration tests to green. (AGENT)  
  **verification:** All event type tests pass.

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
- [ ] API‑APPT‑012.1: Add routing form paths and schemas to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑APPT‑012.2: Write integration tests (red). (AGENT)  
- [ ] API‑APPT‑012.3: Implement `RoutingFormService` and repository. (AGENT)  
- [ ] API‑APPT‑012.4: Create routes, run tests to green. (AGENT)

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
- [ ] API‑APPT‑013.1: Add no‑show paths to OpenAPI. (AGENT)  
- [ ] API‑APPT‑013.2: Write integration tests (red). (AGENT)  
- [ ] API‑APPT‑013.3: Implement `NoShowService` and repository. (AGENT)  
- [ ] API‑APPT‑013.4: Create routes, run tests to green. (AGENT)

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

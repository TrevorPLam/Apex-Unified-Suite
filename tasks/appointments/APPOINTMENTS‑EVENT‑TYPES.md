# tasks/appointments/APPOINTMENTS‑EVENT‑TYPES.md – Appointments: Event Types & Configuration

This file covers Calendly‑style configuration within the Appointments bounded context: event types, custom questions, routing forms, waitlist management, no‑show management, time zone & availability rules, and shared/team event types. These configuration aggregates define how appointments are booked and managed.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Event Types & Related Tables

### [ ] DB‑APPT‑009: Define Event Types Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No event types table. The entire Calendly‑style booking flow is blocked.
**Size:** Small

**Description:** Define the `event_types` table — the core scheduling configuration aggregate. Models Calendly event types with booking limits, group size, secret links, JSONB cancellation/reschedule policies, and availability overrides.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑010`, `DB‑APPT‑011`, `DB‑APPT‑012`, `DB‑APPT‑014`, all event type API tasks
**Related Files:** `lib/db/src/schema/appointments/event_types.ts`, `lib/db/src/__tests__/event‑types.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/appointments/event_types.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `type` (pgEnum: `one_on_one|round_robin|collective|group`), `duration_minutes` (integer NOT NULL), `buffer_before_minutes` (integer NOT NULL default `0`), `buffer_after_minutes` (integer NOT NULL default `0`), `daily_booking_limit` (integer nullable), `location_type` (pgEnum: `physical|virtual|phone`), `location_value` (text nullable), `is_secret` (boolean NOT NULL default `false`), `cancellation_policy_json` (jsonb NOT NULL default `{}`), `reschedule_policy_json` (jsonb NOT NULL default `{}`), `max_group_size` (integer nullable), `availability_overrides` (jsonb NOT NULL default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Index on `(organization_id, type)`
- [ ] Zod schemas and types exported; JSONB policy objects validated with known‑key schemas
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Advanced scheduling algorithms
- Per‑event‑type Stripe product/price configuration (Phase 3)

**Rules to Follow**
- `is_secret` events are accessible only by direct link — enforce in route middleware
- `max_group_size` null means one‑on‑one or unlimited (depending on type)

**Verification**
```bash
pnpm --filter @workspace/db test -- event‑types.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `EventType` is the core scheduling configuration aggregate — analogous to Calendly’s event types.
- TDD: Assert all enums, JSONB defaults, soft delete.
- BDD: Supports “Select from multiple event types” and “Book 30‑minute one‑on‑one” scenarios.

---

### Subtasks
- [ ] DB‑APPT‑009.0.25 (AGENT): Read DB‑ORG‑001 and DB‑APPT‑003 (booking rules). No action — pause.
- [ ] DB‑APPT‑009.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB‑APPT‑009.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑009.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑010: Define Event Type Questions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No event type questions table. Custom intake forms for booking flows are blocked.
**Size:** Small

**Description:** Define the `event_type_questions` table for storing custom intake questions attached to event types. Supports multiple question types with JSONB options for multi‑choice questions and display ordering.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑009`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑011`
**Related Files:** `lib/db/src/schema/appointments/event_type_questions.ts`, `lib/db/src/__tests__/event‑type‑questions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `event_type_id` (FK → event_types, `onDelete: cascade`), `organization_id` (FK), `question_text` (text NOT NULL), `question_type` (pgEnum: `text|multi_choice|checkbox|dropdown`), `options_json` (jsonb nullable), `is_required` (boolean NOT NULL default `true`), `display_order` (integer NOT NULL), `created_at`, `updated_at`
- [ ] Composite index on `(event_type_id, display_order)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- event‑type‑questions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑010.0.25 (AGENT): Read DB‑APPT‑009. No action — pause.
- [ ] DB‑APPT‑010.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB‑APPT‑010.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑010.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑011: Define Routing Forms Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No routing forms table. Invitee qualification and conditional event type routing are blocked.
**Size:** Small

**Description:** Define the `routing_forms` table for configuring Calendly‑style invitee routing — pre‑qualification forms that route respondents to appropriate event types or show disqualification messages based on their answers.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑009`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 routing form API
**Related Files:** `lib/db/src/schema/appointments/routing_forms.ts`, `lib/db/src/__tests__/routing‑forms.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `steps_json` (jsonb NOT NULL default `[]` — conditional logic), `is_active` (boolean NOT NULL default `true`), `deleted_at`, `created_at`, `updated_at`
- [ ] GIN index on `steps_json`
- [ ] Zod schemas and types exported; `steps_json` validated as array of step objects with known structure
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- routing‑forms.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑011.0.25 (AGENT): Read DB‑APPT‑009 and DB‑APPT‑010. No action — pause.
- [ ] DB‑APPT‑011.1 (AGENT): Write failing schema test with JSONB validation. **Verification:** RED.
- [ ] DB‑APPT‑011.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑011.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑APPT‑014: Define Collective Availability Exclusions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collective exclusions table. Manual time blocking for collective event types is blocked.
**Size:** Small

**Description:** Define the `collective_availability_exclusions` table for manually blocking time slots for collective event types (where all hosts must be available). Supports iCal RRULE recurrence and JSONB host user ID arrays.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑009`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** [N/A] — enables Phase 3 collective availability calculation
**Related Files:** `lib/db/src/schema/appointments/collective_exclusions.ts`, `lib/db/src/__tests__/collective‑exclusions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `event_type_id` (FK → event_types), `host_user_ids` (jsonb NOT NULL default `[]` — array of user UUIDs), `excluded_start_time` (timestamp NOT NULL), `excluded_end_time` (timestamp NOT NULL), `recurrence_rule` (text nullable — iCal RRULE), `created_at`
- [ ] Index on `(event_type_id, excluded_start_time)`
- [ ] Zod schemas and types exported; `host_user_ids` validated as `z.array(z.string().uuid())`
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- collective‑exclusions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑APPT‑014.0.25 (AGENT): Read DB‑APPT‑009. No action — pause.
- [ ] DB‑APPT‑014.1 (AGENT): Write failing schema test. **Verification:** RED.
- [ ] DB‑APPT‑014.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; typecheck clean.
- [ ] DB‑APPT‑014.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Event Types, Routing Forms, No‑Show, Waitlist

### [ ] FRONT‑APPT‑003: Event Type Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No event type management UI exists. `API‑APPT‑011` is not wired.
**Size:** Medium

**Description:** Full event type CRUD: list view with type badge and active toggle, create/edit form (meeting type, duration, buffer times, location, custom questions builder), per‑event availability override, and active/secret toggles.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑011`, `appointments/APPOINTMENTS‑BOOKING.md → FRONT‑APPT‑001`
**Blocks:** `appointments/APPOINTMENTS‑BOOKING.md → FRONT‑APPT‑002`, `FRONT‑APPT‑005`
**Related Files:** `artifacts/apex‑os/src/components/appointments/EventTypeEditor.tsx`

**Definition of Done**
- [ ] Event type list: name, duration badge, type, active toggle, edit/delete actions
- [ ] Create/edit form: name, slug, description, duration slider, buffer before/after, location type, colour picker
- [ ] Custom questions builder: `useFieldArray` — add text, select, checkbox, or textarea questions; drag‑to‑reorder
- [ ] Active and secret toggles
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- EventTypeEditor.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Event Type is a configuration aggregate in the Scheduling bounded context.
- TDD: MSW returns event types list; simulate active toggle → assert `PATCH` called.
- BDD: “As a firm admin, I can create and configure event types with custom questions and availability rules.”

---

### Subtasks
- [ ] FRONT‑APPT‑003.1 (AGENT): Build event type list and `useEventTypeList` hook. **File(s):** `artifacts/apex‑os/src/components/appointments/EventTypeEditor.tsx`, `useEventTypeList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑003.2 (AGENT): Implement create/edit form with duration slider, buffer inputs, location, colour picker. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑003.3 (AGENT): Add custom questions builder with drag‑to‑reorder; write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/EventTypeEditor.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑APPT‑004: Routing Form Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No routing form builder exists. `API‑APPT‑012` is not wired.
**Size:** Medium

**Description:** Visual routing form builder: create question‑answer logic flows that direct invitees to different event types or show a disqualification message. Includes preview mode and test mode.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑012`, `FRONT‑APPT‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/RoutingFormBuilder.tsx`

**Definition of Done**
- [ ] Routing form list: name, question count, active status, edit/delete
- [ ] Form builder: add questions (text, select, radio); each answer maps to a target event type or disqualify outcome
- [ ] Preview mode and test mode
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- RoutingFormBuilder.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routing Form is a decision‑tree configuration aggregate.
- TDD: Simulate add question with 2 answers → assert both answers need destinations.
- BDD: “As a firm admin, I can create a routing form that directs prospects to the right booking type based on their answers.”

---

### Subtasks
- [ ] FRONT‑APPT‑004.1 (AGENT): Build routing form list and create‑form layout with question builder. **File(s):** `artifacts/apex‑os/src/components/appointments/RoutingFormBuilder.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑004.2 (AGENT): Implement answer‑to‑destination mapping UI and save validation. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑004.3 (AGENT): Add preview and test modes; write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/RoutingFormBuilder.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑APPT‑013 (Phase 4): No‑Show Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No no‑show management UI exists. `API‑APPT‑013` is not wired.
**Size:** Medium

**Description:** UI to mark appointments as no‑show, view no‑show history per client, and restrict repeat offenders from future bookings.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑013`, `appointments/APPOINTMENTS‑BOOKING.md → FRONT‑APPT‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/NoShowManager.tsx`

**Definition of Done**
- [ ] “Mark No‑Show” button on appointment detail; records with optional notes
- [ ] Client no‑show history panel on client profile
- [ ] “Restrict Client” button (admin only); booking check returns 403 if restricted
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- NoShowManager.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: No‑show tracking is an application service; no‑show records are value objects.
- TDD: Simulate mark no‑show → assert mutation called; simulate restrict → assert booking prevented.
- BDD: “When a client is a no‑show, the firm marks them and the client cannot book future appointments.”

---

### Subtasks
- [ ] FRONT‑APPT‑013.1 (AGENT): Implement `NoShowManager` component and hooks. **File(s):** `artifacts/apex‑os/src/components/appointments/NoShowManager.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑013.2 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/NoShowManager.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑013.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑APPT‑014 (Phase 4): Waitlist Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No waitlist management UI exists. `API‑APPT‑014` is not wired.
**Size:** Medium

**Description:** UI to allow invitees to join a waitlist for a fully booked event type, and for firm users to view/manage waitlist entries. Automatically fills slot when an appointment is cancelled.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑014`, `FRONT‑APPT‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/WaitlistManager.tsx`

**Definition of Done**
- [ ] “Join Waitlist” button shown when no slots are available on public booking page
- [ ] Firm‑side waitlist view: list of entries per event type with status
- [ ] Remove entry action; automatic booking notification when slot opens
- [ ] Duplicate join prevention: 409 if already on waitlist for same slot
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- WaitlistManager.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Waitlist is an aggregate in Appointments; automatic booking is a domain service.
- TDD: Simulate join waitlist → assert entry created; simulate cancellation → assert waitlist booking appears.
- BDD: “When an appointment is cancelled, the first person on the waitlist is automatically booked and notified.”

---

### Subtasks
- [ ] FRONT‑APPT‑014.1 (AGENT): Implement `WaitlistManager` component and related hooks. **File(s):** `artifacts/apex‑os/src/components/appointments/WaitlistManager.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑APPT‑014.2 (AGENT): Write component tests. **File(s):** `artifacts/apex‑os/src/components/appointments/__tests__/WaitlistManager.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑APPT‑014.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Event Type Ownership (Phase 4 Extension)

### [ ] API‑APPT‑020: Shared vs. Team Event Type Configuration
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** `event_types` table lacks `ownership_type` field. All event types are implicitly personal. No visibility filtering based on ownership and no admin lock for team event types.
**Size:** Small

**Description:** Add `ownership_type` enum (`personal` | `shared` | `team`) to event types, implement visibility filtering in list/detail endpoints, and enforce admin‑only controls for `team` event types.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → API‑APPT‑011`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/appointments.ts`, `artifacts/api‑server/src/services/appointments/event‑type‑service.ts`, `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `ownership_type` column added to `event_types` Drizzle schema (default: `'personal'`); migration generated
- [ ] `POST /appointments/event‑types` accepts `ownership_type` field; Zod schema updated
- [ ] `GET /appointments/event‑types` filters by ownership visibility
- [ ] `PATCH` on `team` type → requires admin role
- [ ] Integration tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `ownership_type` must use a Drizzle `pgEnum` — not a plain `varchar`
- Default `'personal'` must be set at the DB column level
- Admin check must use the same role‑checking middleware as other admin‑only endpoints

**Verification**
```bash
# After user approves DB push:
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api‑server test -- event‑types.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ownership_type` is an attribute of the `EventType` aggregate that controls visibility invariants.
- TDD: Write visibility filter test before implementing the column; test all three ownership types.
- BDD: “As a team member, I create a Shared event type that every colleague can see without admin approval.”

---

### Subtasks
- [ ] API‑APPT‑020.0.25 (AGENT): Read this task, API‑APPT‑011 event type schema, and existing Drizzle enum patterns. *No action — pause.*
- [ ] API‑APPT‑020.1 (AGENT): Update Drizzle schema with `ownership_type` enum column. **File(s):** `lib/db/src/schema/appointments.ts` **Verification:** `pnpm typecheck` clean.
- [ ] API‑APPT‑020.2 (HUMAN): Approve and run DB push. **Verification:** `pnpm --filter @workspace/db run push` succeeds.
- [ ] API‑APPT‑020.3 (AGENT): Update OpenAPI spec and run codegen. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** Codegen passes.
- [ ] API‑APPT‑020.4 (AGENT): Update `EventTypeService` with visibility filtering and admin enforcement. **File(s):** `artifacts/api‑server/src/services/appointments/event‑type‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑APPT‑020.5 (AGENT): Add ownership integration tests. **File(s):** `artifacts/api‑server/__tests__/api/appointments/event‑types.test.ts` **Verification:** All green.
- [ ] API‑APPT‑020.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
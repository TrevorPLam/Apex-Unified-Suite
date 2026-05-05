# TODO-P5-APPOINTMENTS.md – Phase 5: Appointments Frontend Integration

Builds the Calendly-style scheduling module for Apex OS: a firm-side appointments management page (calendar views, confirm/cancel actions), a public and portal-embedded client booking flow, event type configuration, routing form builder, customisable public booking pages with embed codes, and a per-user availability dashboard with external calendar sync status. This module is entirely distinct from the PM Scheduler in Projects.

---

## [ ] FRONT‑APPT‑001: Dedicated Appointments Page (Firm‑Side)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No standalone Appointments page exists. Appointment data is not loaded from any API.
**Size:** Medium

**Description:** Top-level firm-side Appointments page: month/week/day calendar view, appointment list with filters (provider, status, date range), quick actions (confirm, cancel with reason), and a detail slide-out with client info, appointment history, and notes.

**Depends on:** API‑APPT‑004 (appointments API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Appointments.tsx`, `artifacts/apex-os/src/hooks/appointments/useAppointmentList.ts`, `artifacts/apex-os/src/hooks/appointments/useConfirmAppointment.ts`, `artifacts/apex-os/src/hooks/appointments/useCancelAppointment.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Recharts or a lightweight calendar component; shadcn/ui Sheet for slide-out; `toast` from `sonner`
- Exports: `useAppointmentList(filters?)`, `useConfirmAppointment()`, `useCancelAppointment()`

**Definition of Done**
- [ ] Appointments page added to Wouter router at `/appointments` behind `ProtectedRoute`
- [ ] Calendar view: month (grid), week (time-slots), day; appointments shown as colour-coded blocks by status (`pending`/`confirmed`/`cancelled`/`completed`)
- [ ] List view tab: table with provider, client, date/time, duration, status, actions; sortable, paginated
- [ ] Filter bar: provider (multi-select), status (multi-select), date range picker; all filter params sent to API
- [ ] Confirm action: inline button in list → `useConfirmAppointment` mutation → status badge updates optimistically → sonner toast
- [ ] Cancel action: opens modal with reason text input (required) → `useCancelAppointment` mutation → optimistic update
- [ ] Detail slide-out: client info, appointment type, location, notes, history of status changes, reschedule link
- [ ] Loading skeleton (FRONT‑INFRA‑002) and error boundary (FRONT‑INFRA‑001) applied
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests: list renders; confirm/cancel mutations fire; filter params sent to API

**Out of Scope**
- Real-time calendar collaboration (Phase 7+)
- Automated reminder sending UI (Phase 6+)
- Payment capture for appointments (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/Appointments.tsx`, `artifacts/apex-os/src/hooks/appointments/useAppointmentList.ts`, `artifacts/apex-os/src/hooks/appointments/useConfirmAppointment.ts`, `artifacts/apex-os/src/hooks/appointments/useCancelAppointment.ts`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/appointments.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: page-level — remove `/appointments` route; nav link hidden
- Halt condition: if calendar renders appointments in wrong timezone, stop and verify UTC ↔ local conversion via `date-fns-tz`

**Rules to Follow**
- All date/time values from the API are UTC ISO-8601; always convert to local display using `date-fns-tz`
- Cancellation reason is required — block the cancel mutation until reason is non-empty

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- appointments.test.tsx
```

**Advanced Code Patterns**
- Calendar view: use `@fullcalendar/react` (if available) or build a lightweight grid; if building custom, avoid heavy DOM manipulation — render entirely in React
- `useAppointmentList` with `keepPreviousData: true` and `staleTime: 30_000`

**Anti-Patterns**
- Storing appointment time as a local `Date` object in state — always store UTC string from API; convert only at render time
- Mixing calendar view state (selected date, view mode) into the React Query cache — keep view state in local `useState`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Appointment is an aggregate in the Scheduling bounded context. Confirm and Cancel are domain commands — not CRUD updates.
- TDD: MSW returns 3 appointments; assert all 3 render in list; simulate "Confirm" → assert `PATCH /appointments/:id/confirm` called; simulate "Cancel" without reason → assert mutation blocked.
- BDD: "As a firm user, I can see all upcoming appointments on a calendar, confirm or cancel them, and view full appointment details."
- Deep Module: `useAppointmentList`, `useConfirmAppointment`, `useCancelAppointment` hide all API and cache concerns; `Appointments.tsx` is a thin view layer.

---

### Subtasks

- [ ] FRONT‑APPT‑001.0.25 (AGENT): Check Wouter router in `App.tsx` and `src/data/mockData.ts` for any appointment mock data to understand what needs replacing.
  *No action — pause until fully understood.*

- [ ] FRONT‑APPT‑001.1 (AGENT): Create `useAppointmentList`, `useConfirmAppointment`, `useCancelAppointment` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/appointments/useAppointmentList.ts`, `artifacts/apex-os/src/hooks/appointments/useConfirmAppointment.ts`, `artifacts/apex-os/src/hooks/appointments/useCancelAppointment.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑001.2 (AGENT): Build `Appointments.tsx` — calendar view, list view, filter bar, and detail slide-out.
  **File(s):** `artifacts/apex-os/src/pages/Appointments.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑001.3 (AGENT): Add `/appointments` route behind `ProtectedRoute` in `App.tsx`.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑001.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/appointments.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- appointments.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑001.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑APPT‑002: Client Booking Flow (Public + Portal)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No public booking page or client-facing booking flow exists.
**Size:** Medium

**Description:** Multi-step client booking experience accessible both publicly (no auth) and within the client portal (authenticated, pre-filled info). Steps: select event type → pick a time slot → fill invitee form → confirmation screen. Portal variant pre-fills name, email, phone from the client profile.

**Depends on:** API‑APPT‑004 (appointments API green), FRONT‑AUTH‑003 (portal auth context), API‑APPT‑011 (event types — for slot availability)
**Blocks:** FRONT‑APPT‑005 (booking page builder embeds this flow)
**Related Files:** `artifacts/apex-os/src/pages/Booking.tsx`, `artifacts/apex-os/src/components/appointments/SlotPicker.tsx`, `artifacts/apex-os/src/hooks/appointments/useAvailableSlots.ts`, `artifacts/apex-os/src/hooks/appointments/useRequestAppointment.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `usePortalAuth` from `PortalAuthContext`; shadcn/ui Calendar, RadioGroup
- Exports: `Booking` page component; `SlotPicker` component; `useAvailableSlots(eventTypeId, date)`, `useRequestAppointment()`

**Definition of Done**
- [ ] Public booking page at `/book/:eventTypeSlug` (no auth required); Wouter public route
- [ ] Step 1 — Event type selector: list of active public event types with duration and description
- [ ] Step 2 — Date picker + `SlotPicker`: select a date → fetch available slots for that date via `useAvailableSlots`; display time slots in 30-minute intervals (or per event type config); no slots → "No availability on this date" message
- [ ] Step 3 — Invitee form: name, email, phone, plus custom questions defined on the event type; Zod validation
- [ ] Step 4 — Confirmation screen: appointment summary (event type, date, time, location, host); "Add to Calendar" links (Google, `.ics` download)
- [ ] Portal variant: pre-fills name and email from `usePortalAuth`; portal branding applied (CSS variables on container, NOT `:root`)
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests: slot picker renders available slots; form validation blocks submit; confirmation screen renders after successful booking

**Out of Scope**
- Payment collection at booking (Phase 7+)
- Group bookings / round-robin routing (Phase 7+)
- Rescheduling UI (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/Booking.tsx`, `artifacts/apex-os/src/components/appointments/SlotPicker.tsx`, `artifacts/apex-os/src/hooks/appointments/useAvailableSlots.ts`, `artifacts/apex-os/src/hooks/appointments/useRequestAppointment.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/appointments/__tests__/Booking.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: page-level — remove `/book/:eventTypeSlug` route; public booking page replaced with "Coming Soon"
- Halt condition: if slot picker shows slots already booked by other clients (race condition), stop and confirm the API uses pessimistic locking on slot reservation

**Rules to Follow**
- Available slots must be fetched fresh when the date changes — never cache slot availability longer than `staleTime: 0` (slots can be booked by others at any time)
- Portal branding CSS variables must be scoped to the booking container element — never applied to `:root`
- Invitee form fields that are required by event type config must be validated client-side before submit

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- Booking.test.tsx
```

**Advanced Code Patterns**
- Multi-step wizard: use `useState` with a step enum (`'event-type' | 'slot' | 'form' | 'confirmation'`) — no external library needed
- `.ics` file generation for "Add to Calendar": build the iCalendar string client-side using template literal; trigger download via `URL.createObjectURL`

**Anti-Patterns**
- Caching slot availability — slots are ephemeral; always `staleTime: 0` for slot queries
- Applying portal branding to `:root` — scopes bleed into the rest of the app; always scope to the booking container

**DDD / TDD / BDD / Deep Module notes**
- DDD: Booking is a multi-step process that ends in creating an Appointment aggregate via `useRequestAppointment`. Slot availability is a transient projection — not an aggregate.
- TDD: MSW returns available slots for selected date; assert slots render; select slot → assert form appears; submit form → assert `POST /appointments` called; assert confirmation screen renders.
- BDD: "As a client, I can visit a public booking page, pick a time that works for me, and receive a confirmation with calendar invite options."
- Deep Module: `SlotPicker` hides slot fetching, date navigation, and time slot rendering; `useRequestAppointment` hides booking mutation and confirmation.

---

### Subtasks

- [ ] FRONT‑APPT‑002.1 (AGENT): Create `useAvailableSlots` and `useRequestAppointment` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/appointments/useAvailableSlots.ts`, `artifacts/apex-os/src/hooks/appointments/useRequestAppointment.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑002.2 (AGENT): Build multi-step booking page: event type selector, `SlotPicker`, invitee form, confirmation screen.
  **File(s):** `artifacts/apex-os/src/pages/Booking.tsx`, `artifacts/apex-os/src/components/appointments/SlotPicker.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑002.3 (AGENT): Apply portal branding variant and `.ics` calendar link.
  **File(s):** `artifacts/apex-os/src/pages/Booking.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑002.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/components/appointments/__tests__/Booking.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- Booking.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑002.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑APPT‑003: Event Type Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No event type management UI exists. `API-APPT-011` is not wired.
**Size:** Medium

**Description:** Full event type CRUD: list view with type badge and active toggle, create/edit form (meeting type, duration, buffer times, location, custom questions builder), per-event availability override, and active/secret toggles.

**Depends on:** API‑APPT‑011 (event type API green), FRONT‑APPT‑001
**Blocks:** FRONT‑APPT‑002, FRONT‑APPT‑005
**Related Files:** `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `useForm`, `useFieldArray` from `react-hook-form`; shadcn/ui Dialog, Switch, Slider
- Exports: `EventTypeEditor` component; `useEventTypeList()`, `useCreateEventType()`, `useUpdateEventType()`, `useDeleteEventType()`

**Definition of Done**
- [ ] Event type list: name, duration badge, type (one-on-one/group/collective/round-robin), active toggle, edit/delete actions
- [ ] Create/edit form: name, slug (auto-derived, editable), description, duration (slider: 15–480 min in 15-min steps), buffer before/after (0–120 min), location type (in-person/video/phone/custom), meeting link field (if video), colour picker
- [ ] Custom questions builder: `useFieldArray` — add text, select, checkbox, or textarea questions; mark required; drag-to-reorder
- [ ] Active toggle: `PATCH /event-types/:id` with `{ active: bool }` — disabled types hidden from public booking
- [ ] Secret toggle: secret event types only accessible via direct link (not on public booking page)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Group booking capacity settings (Phase 7+)
- Payment per event type (Phase 7+)
- Round-robin assignment algorithm UI (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`, `artifacts/apex-os/src/hooks/appointments/useEventTypeList.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/appointments/__tests__/EventTypeEditor.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `EventTypeEditor`; event types tab shows placeholder
- Halt condition: if slug generation creates collisions (duplicate slugs), stop and verify the API enforces uniqueness

**Rules to Follow**
- Slug must be auto-derived from name using `slugify` — no spaces or special characters; allow manual override
- Duration must be a multiple of 15 minutes — validate before submit
- Deleting an event type that has future appointments must show a warning ("X upcoming appointments will be cancelled")

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- EventTypeEditor.test.tsx
```

**Advanced Code Patterns**
- Custom questions builder: `useFieldArray` from React Hook Form — add/remove/reorder without unmounting controlled inputs
- Drag-to-reorder questions: use `@dnd-kit/sortable` on the `useFieldArray` array

**Anti-Patterns**
- Allowing free-text slug input without sanitisation — always run through `slugify` before sending to the API
- Deleting an event type silently — always confirm and warn about downstream impact

**DDD / TDD / BDD / Deep Module notes**
- DDD: Event Type is a configuration aggregate in the Scheduling bounded context; it defines the shape of bookable Appointments.
- TDD: MSW returns event types list; simulate active toggle → assert `PATCH` called; simulate add question → assert field appears in form; submit form → assert `POST /event-types` called.
- BDD: "As a firm admin, I can create and configure event types with custom questions and availability rules."
- Deep Module: `EventTypeEditor` hides all CRUD mutations, question array management, and slug generation.

---

### Subtasks

- [ ] FRONT‑APPT‑003.1 (AGENT): Build event type list and `useEventTypeList` hook.
  **File(s):** `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`, `artifacts/apex-os/src/hooks/appointments/useEventTypeList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑003.2 (AGENT): Implement create/edit form with duration slider, buffer inputs, location, and colour picker.
  **File(s):** `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑003.3 (AGENT): Add custom questions builder with drag-to-reorder and required toggle; write component tests.
  **File(s):** `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`, `artifacts/apex-os/src/components/appointments/__tests__/EventTypeEditor.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- EventTypeEditor.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑APPT‑004: Routing Form Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No routing form builder exists. `API-APPT-012` is not wired.
**Size:** Medium

**Description:** Visual routing form builder: create question-answer logic flows that direct invitees to different event types or show a disqualification message. Includes preview mode and test mode.

**Depends on:** API‑APPT‑012 (routing forms API green), FRONT‑APPT‑003
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `useFieldArray`, `useForm` from `react-hook-form`; shadcn/ui Select, RadioGroup
- Exports: `RoutingFormBuilder` component; `useRoutingFormList()`, `useCreateRoutingForm()`, `useUpdateRoutingForm()`

**Definition of Done**
- [ ] Routing form list: name, question count, active status, edit/delete
- [ ] Form builder: add questions (text, select, radio); each answer maps to: a target event type OR a "disqualify" outcome with custom message
- [ ] Questions have branching: answer A → event type X; answer B → event type Y; answer C → "We can't help with this"
- [ ] Preview mode: walk through the form as an invitee; shows target event type or disqualification at the end
- [ ] Test mode: submit sample answers; shows resolved routing destination with explanation of which rule matched
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Nested conditional branching (more than 1 level deep — Phase 8+)
- Analytics on routing outcomes (Phase 10+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/appointments/__tests__/RoutingFormBuilder.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `RoutingFormBuilder`; routing forms tab shows placeholder
- Halt condition: if routing logic creates circular references (question A routes to question A), stop and add cycle detection before save

**Rules to Follow**
- Every answer in a routing form must have a destination — either an event type or a disqualification message — disallow saving with unmapped answers
- Disqualification messages must be non-empty

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- RoutingFormBuilder.test.tsx
```

**Advanced Code Patterns**
- Routing logic stored as `{ question_id, answer_value, target: { type: 'event_type' | 'disqualify', event_type_id?, message? } }[]`
- Preview mode uses local state traversal — no API calls during preview

**Anti-Patterns**
- Allowing unmapped answers (no destination) — always validate all answers have a destination before saving
- Allowing circular routing — validate no question routes back to itself or a prior step

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routing Form is a decision-tree configuration aggregate; it produces a routing outcome (target event type or disqualification) for a given set of answers.
- TDD: Simulate add question with 2 answers → assert both answers need destinations; map both → assert save enabled; simulate preview → assert correct event type shown for answer A.
- BDD: "As a firm admin, I can create a routing form that directs prospects to the right booking type based on their answers."
- Deep Module: `RoutingFormBuilder` hides routing logic construction, cycle detection, preview traversal, and CRUD mutations.

---

### Subtasks

- [ ] FRONT‑APPT‑004.1 (AGENT): Build routing form list and create-form layout with question builder.
  **File(s):** `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑004.2 (AGENT): Implement answer-to-destination mapping UI and save validation.
  **File(s):** `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑004.3 (AGENT): Add preview and test modes; write component tests.
  **File(s):** `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`, `artifacts/apex-os/src/components/appointments/__tests__/RoutingFormBuilder.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- RoutingFormBuilder.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑004.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑APPT‑005: Booking Page Builder & Embed
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No public booking page customisation or embed code generator exists.
**Size:** Medium

**Description:** Customisable public booking page editor: logo, colour scheme, welcome message, event type visibility selector, live preview panel, and embed code generator (iframe and JavaScript snippet) for embedding the booking flow in external websites.

**Depends on:** API‑APPT‑011 (event types), FRONT‑APPT‑002 (booking flow to preview)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; shadcn/ui Input, Switch, Popover (colour picker)
- Exports: `BookingPageBuilder` component; `useBookingPageSettings()`, `useUpdateBookingPageSettings()`

**Definition of Done**
- [ ] Branding editor: logo upload (via existing `FileUpload` component), primary colour picker, welcome heading, welcome message (textarea, max 500 characters)
- [ ] Event type visibility: multi-select toggle for active event types to show/hide on public page
- [ ] Live preview panel: renders an embedded preview of the public booking page (iframe to `/book/preview?org=:orgId`) updating in real time as settings change
- [ ] Embed code tab: iframe snippet and JavaScript inline snippet; copy buttons with checkmark animation
- [ ] Save settings: `useUpdateBookingPageSettings` mutation with 3-second debounce auto-save on change
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Custom domain for booking page (Phase 8+)
- White-label removal of Apex branding (Phase 9+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/appointments/__tests__/BookingPageBuilder.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `BookingPageBuilder`; booking page settings tab shows placeholder
- Halt condition: if auto-save fires too rapidly and creates race conditions, stop and implement request debouncing via `setTimeout` with cleanup

**Rules to Follow**
- Colour picker must only accept valid hex colours — validate before saving
- Embed code must use HTTPS URLs only — never generate HTTP embed snippets

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- BookingPageBuilder.test.tsx
```

**Advanced Code Patterns**
- Live preview: use `postMessage` to send branding changes into the preview iframe without a full refresh
- Auto-save debounce: `useEffect` with `setTimeout(saveFn, 3000)` + cleanup `clearTimeout` on re-render

**Anti-Patterns**
- Applying preview branding to the main app theme — always scope to the preview iframe only

**DDD / TDD / BDD / Deep Module notes**
- DDD: Booking Page Settings is a tenant configuration value object — not an aggregate; it describes how the public booking experience looks.
- TDD: Simulate colour change → assert debounced `PATCH` called after 3 seconds; simulate event type toggle → assert visibility updated; simulate copy button → assert clipboard API called.
- BDD: "As a firm admin, I can customise my public booking page and get an embed code to put on my website."
- Deep Module: `BookingPageBuilder` hides settings persistence, debounce, preview synchronisation, and embed code generation.

---

### Subtasks

- [ ] FRONT‑APPT‑005.1 (AGENT): Build branding editor and event type visibility selector.
  **File(s):** `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑005.2 (AGENT): Add live preview panel and auto-save debounce.
  **File(s):** `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑005.3 (AGENT): Build embed code tab (iframe + JS snippet, copy buttons); write component tests.
  **File(s):** `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`, `artifacts/apex-os/src/components/appointments/__tests__/BookingPageBuilder.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- BookingPageBuilder.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑005.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑APPT‑006: My Availability Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No per-user availability management UI exists. `API-APPT-015` is not wired.
**Size:** Medium

**Description:** Per-user availability dashboard: weekly calendar showing defined availability windows, date-specific overrides (block/change hours for a day), external calendar connection status (Google, Outlook), upcoming appointment count, and utilisation metrics.

**Depends on:** API‑APPT‑015 (availability rules API green), API‑APPT‑016 (calendar connections)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/appointments/AvailabilityDashboard.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `useForm` from `react-hook-form`; Recharts BarChart for utilisation
- Exports: `AvailabilityDashboard` component; `useAvailabilityRules()`, `useUpdateAvailabilityRules()`, `useCalendarConnections()`

**Definition of Done**
- [ ] Weekly grid: 7 columns (Mon–Sun), each showing defined availability windows as coloured time bands; click-to-edit window
- [ ] Add/edit availability window modal: day(s) of week, start time, end time; recurring (weekly default); save via `useUpdateAvailabilityRules`
- [ ] Date-specific override: calendar date picker → mark as blocked (no availability) or set custom hours for that date
- [ ] External calendar connections: Google Calendar status (connected/disconnected, last sync time), Outlook status; "Connect" button opens OAuth flow in new window; "Disconnect" button with confirmation
- [ ] Metrics strip: upcoming appointments (next 7 days), booked vs. available hours this week (utilisation %), avg booking lead time
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Team-level availability aggregation (Phase 8+)
- Automatic slot suggestion based on optimal utilisation (Phase 10+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/appointments/AvailabilityDashboard.tsx`, `artifacts/apex-os/src/hooks/appointments/useAvailabilityRules.ts`, `artifacts/apex-os/src/hooks/appointments/useCalendarConnections.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/appointments/__tests__/AvailabilityDashboard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `AvailabilityDashboard`; availability tab shows placeholder
- Halt condition: if external calendar OAuth flow opens successfully but the callback does not update `useCalendarConnections` cache, stop and add a `focus` event listener on `window` to trigger a refetch when the OAuth popup closes

**Rules to Follow**
- Availability times must be stored and displayed in the user's local timezone — convert from UTC on load, convert to UTC before save
- Overlapping availability windows within the same day are invalid — validate before submit; the API will reject them

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- AvailabilityDashboard.test.tsx
```

**Advanced Code Patterns**
- OAuth popup: `window.open(oauthUrl, '_blank', 'width=600,height=700')` + `window.addEventListener('focus', refetchConnections)` to detect when user returns after authorising
- Utilisation %: `(booked_minutes / available_minutes) * 100` — compute client-side from hook data

**Anti-Patterns**
- Storing availability times in local time in the database — always UTC; convert only at the display layer
- Polling the calendar connection status every second after OAuth — use `window focus` event instead

**DDD / TDD / BDD / Deep Module notes**
- DDD: Availability Rules are value objects scoped to a User aggregate in the Scheduling bounded context. They do not directly create Appointments — they constrain which slots are offered.
- TDD: MSW returns availability windows; assert weekly grid shows coloured bands; simulate edit window → assert modal opens; simulate connect Google Calendar → assert `useCalendarConnections` refetched after window focus.
- BDD: "As a firm user, I can set my weekly availability hours, add day-specific overrides, and see how booked my schedule is."
- Deep Module: `AvailabilityDashboard` hides availability rule CRUD, timezone conversion, OAuth popup management, and utilisation computation.

---

### Subtasks

- [ ] FRONT‑APPT‑006.1 (AGENT): Create `useAvailabilityRules` and `useCalendarConnections` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/appointments/useAvailabilityRules.ts`, `artifacts/apex-os/src/hooks/appointments/useCalendarConnections.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑006.2 (AGENT): Build weekly availability grid and add/edit window modal.
  **File(s):** `artifacts/apex-os/src/components/appointments/AvailabilityDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑006.3 (AGENT): Add date-specific overrides, external calendar connection status, and metrics strip.
  **File(s):** `artifacts/apex-os/src/components/appointments/AvailabilityDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑APPT‑006.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/components/appointments/__tests__/AvailabilityDashboard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- AvailabilityDashboard.test.tsx` → GREEN.

- [ ] FRONT‑APPT‑006.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

# TODO-P5-APPOINTMENTS.md – Appointments Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Appointments UI Integration including firm-side management, client booking flow, and advanced appointment features.

---

## Appointments UI Integration

### [ ] FRONT‑APPT‑001: Dedicated Appointments Page (Firm)
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑004 (appointments API).  
**Definition of Done:** Standalone top‑level Appointments page for firm users:  
- Calendar view (month/week/day) showing all appointments.  
- Appointment list with filters (provider, status, date range).  
- Quick actions: confirm, cancel (with reason), view detail.  
- Click appointment → detail slide‑out with client info, status, history.  
- Empty/loading/error states.  

**DDD:** Appointments bounded context frontend; completely independent of Projects.  
**Related Files:** `artifacts/apex-os/src/pages/Appointments.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑001.1: Build Appointments page with calendar view (use a calendar library). (AGENT)  
  **verification:** Calendar renders with appointments on correct dates/times.
- [ ] FRONT‑APPT‑001.2: Implement appointment list with filters and pagination. (AGENT)  
  **verification:** Filter by provider, status, date range; results update.
- [ ] FRONT‑APPT‑001.3: Build appointment detail slide‑out with actions. (AGENT)  
  **verification:** Confirm/cancel buttons work; cancellation reason modal appears.
- [ ] FRONT‑APPT‑001.4: Wire to `useAppointmentList`, `useConfirmAppointment`, `useCancelAppointment` hooks. (AGENT)  
- [ ] FRONT‑APPT‑001.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑APPT‑002: Client Booking Flow (Public + Portal)
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑AUTH‑003 (portal auth), API‑APPT‑004.  
**Definition of Done:** Client‑facing booking experience:  
- Public booking page (no auth): select event type, view available slots, fill invitee form, book.  
- Portal booking (authenticated): same flow with pre‑filled client info.  
- Confirmation screen after booking with appointment details.  
- Email confirmation sent (via API).  

**Related Files:** `artifacts/apex-os/src/pages/Booking.tsx`, `artifacts/apex-os/src/components/appointments/SlotPicker.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑002.1: Build event type selector and slot picker components. (AGENT)  
  **verification:** Select event type → available slots loaded; click slot → invitee form.
- [ ] FRONT‑APPT‑002.2: Implement invitee form with custom questions per event type. (AGENT)  
  **verification:** Form fields match event type configuration; validation works.
- [ ] FRONT‑APPT‑002.3: Build booking confirmation screen. (AGENT)  
  **verification:** After booking, shows confirmation with appointment details.
- [ ] FRONT‑APPT‑002.4: Wire to `useAvailableSlots`, `useRequestAppointment` hooks. (AGENT)  
- [ ] FRONT‑APPT‑002.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑APPT‑003: Event Type Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑011 (event type API).  
**Definition of Done:** Visual interface for managing event types:  
- List event types with type badge, duration, active status.  
- Create/edit form: type selector, duration slider, buffer time inputs, location configuration, custom questions builder (add/remove/reorder questions), payment settings, booking limits.  
- Toggle active/inactive; toggle secret.  
- Per‑event‑type availability overrides calendar.  

**Related Files:** `artifacts/apex-os/src/components/appointments/EventTypeEditor.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑003.1: Build event type list view. (AGENT)  
- [ ] FRONT‑APPT‑003.2: Implement create/edit form with all configuration options. (AGENT)  
- [ ] FRONT‑APPT‑003.3: Add custom questions builder (drag‑and‑drop reorder, add/remove). (AGENT)  
- [ ] FRONT‑APPT‑003.4: Wire to event type CRUD hooks. (AGENT)  
- [ ] FRONT‑APPT‑003.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑APPT‑004: Routing Form Builder
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑012 (routing forms API).  
**Definition of Done:** Drag‑and‑drop routing form builder:  
- Create form: name, description.  
- Add questions (from event type question pool or custom).  
- For each answer, define target event type or disqualification message.  
- Preview mode: walk through the form as an invitee would.  
- Test mode: submit sample answers, see resulting event type.  

**Related Files:** `artifacts/apex-os/src/components/appointments/RoutingFormBuilder.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑004.1: Build form builder layout with question pool and logic editor. (AGENT)  
- [ ] FRONT‑APPT‑004.2: Implement conditional logic mapping UI (answer → target/disqualify). (AGENT)  
- [ ] FRONT‑APPT‑004.3: Add preview and test modes. (AGENT)  
- [ ] FRONT‑APPT‑004.4: Wire to routing form CRUD hooks. (AGENT)  
- [ ] FRONT‑APPT‑004.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑APPT‑005: Booking Page Builder & Embed
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑011 (event types), FRONT‑APPT‑002 (booking flow).  
**Definition of Done:** Customisable public booking page:  
- Branding editor: logo upload, colour picker, welcome message.  
- Event type selection: choose which event types appear on public page.  
- Preview of public booking page.  
- Embed code generator: copy‑paste iframe or JavaScript snippet for external websites.  

**Related Files:** `artifacts/apex-os/src/components/appointments/BookingPageBuilder.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑005.1: Build branding editor with live preview. (AGENT)  
- [ ] FRONT‑APPT‑005.2: Implement event type visibility selector for public page. (AGENT)  
- [ ] FRONT‑APPT‑005.3: Create embed code generator with copy button. (AGENT)  
- [ ] FRONT‑APPT‑005.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑APPT‑006: My Availability Dashboard
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑015 (availability rules API), DB‑APPT‑005 (calendar connections).  
**Definition of Done:** Per‑user availability management:  
- Weekly calendar showing availability windows.  
- Date‑specific overrides (block a day, change hours).  
- Connected calendar status (Google, Outlook) with last sync time.  
- Upcoming appointments count and utilisation percentage.  

**Related Files:** `artifacts/apex-os/src/components/appointments/AvailabilityDashboard.tsx`

**Subtasks:**
- [ ] FRONT‑APPT‑006.1: Build weekly calendar with availability windows. (AGENT)  
- [ ] FRONT‑APPT‑006.2: Add date‑specific overrides and calendar connection status. (AGENT)  
- [ ] FRONT‑APPT‑006.3: Display upcoming appointments and utilisation metrics. (AGENT)  
- [ ] FRONT‑APPT‑006.4: Wire to availability management hooks. (AGENT)  
- [ ] FRONT‑APPT‑006.5: Component test with MSW. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Appointments components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Appointments pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard appointment metrics depend on Appointments API integration
- **TODO-P5-PORTAL.md**: Portal booking flow depends on Portal authentication

### Related Master Tracker Tasks
- **API‑APPT‑004**: Appointments API must be green before FRONT‑APPT‑001
- **API‑APPT‑011**: Event types API must be green before FRONT‑APPT‑003
- **API‑APPT‑012**: Routing forms API must be green before FRONT‑APPT‑004

---

## Verification Commands

### Appointments Integration Verification
```bash
# Core Appointments verification
npm test -- appointments.test.tsx
npm test -- useAppointmentList.test.ts

# Booking flow verification
npm test -- booking.test.tsx
npm test -- slot-picker.test.tsx

# Management features verification
npm test -- event-type-editor.test.tsx
npm test -- routing-form-builder.test.tsx
npm test -- booking-page-builder.test.tsx
npm test -- availability-dashboard.test.tsx

# Manual verification
# Navigate to Appointments page, verify all data loads from API
# Test calendar views and appointment management
# Test client booking flow (public and portal)
# Test event type and routing form management
```

---

## Completion Criteria

### Appointments Frontend Integration Complete When:
1. All Appointments data (appointments, event types, availability) loads from APIs
2. Calendar views provide comprehensive appointment management
3. Client booking flow works seamlessly (public and portal)
4. Event type management enables full customization
5. Advanced features (routing forms, booking pages, availability) are functional
6. All mock data imports are removed from Appointments components
7. Component tests pass with MSW mocks
8. Manual testing confirms complete Appointments functionality

**Estimated Timeline:** 8-10 days with parallel execution

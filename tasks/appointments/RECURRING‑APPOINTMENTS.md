# tasks/appointments/RECURRING‑APPOINTMENTS.md – Recurring Appointment Series

This file restores the recurring appointment capability that was previously marked out of scope. It covers recurring series persistence, instance generation, and UI configuration.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Recurring Series

### [ ] DB‑APPT‑015: Recurring Appointment Series Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Appointment data model has no recurring-series persistence.

**Description:** Add the recurring appointment series table with RRULE, generation window, and override support.

**Depends on:** `appointments/APPOINTMENTS‑EVENT‑TYPES.md → DB‑APPT‑009`
**Blocks:** `API‑APPT‑021`, `API‑APPT‑022`
**Related Files:** `lib/db/src/schema/appointments/recurring_series.ts`

### [ ] API‑APPT‑021: Recurring Series CRUD
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No recurring-series API exists.

**Description:** Implement CRUD for recurring series with RRULE validation, future-instance cancellation choices, and per-instance overrides.

**Depends on:** `appointments/RECURRING‑APPOINTMENTS.md → DB‑APPT‑015`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** `API‑APPT‑022`, `FRONT‑APPT‑015`

### [ ] API‑APPT‑022: Instance Generation Engine
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No engine generates future appointment instances.

**Description:** Generate appointment instances into a rolling future window with idempotency guarantees and support for override dates.

**Depends on:** `appointments/RECURRING‑APPOINTMENTS.md → API‑APPT‑021`
**Blocks:** `FRONT‑APPT‑015`
**Related Files:** `artifacts/api‑server/src/jobs/appointments/recurring‑generator.ts`

### [ ] FRONT‑APPT‑015: Recurring Appointment UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Users cannot configure recurring series.

**Description:** Add an RRULE builder, preview of upcoming instances, and per-instance override management to the appointment setup flow.

**Depends on:** `appointments/RECURRING‑APPOINTMENTS.md → API‑APPT‑021`, `API‑APPT‑022`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/appointments/RecurringSeriesBuilder.tsx`

## Subtasks
- [ ] DB‑APPT‑015.1 (AGENT): Define recurring-series columns and indices.
- [ ] API‑APPT‑021.1 (AGENT): Add RRULE validation and API contracts.
- [ ] API‑APPT‑022.1 (AGENT): Define rolling-window generation and deduplication rules.
- [ ] FRONT‑APPT‑015.1 (AGENT): Design the RRULE builder and instance preview.
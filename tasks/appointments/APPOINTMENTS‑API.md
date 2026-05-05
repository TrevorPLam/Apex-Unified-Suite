# tasks/appointments/APPOINTMENTS‑API.md – Restored Appointments API Backlog

This file restores the appointments API-layer tasks that were lost during the refactor. It is the owning backlog for all missing appointment endpoints and their sequencing.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## API Sequence

| Task ID | Scope | Depends On |
|---------|-------|------------|
| API‑APPT‑001 | Appointments core OpenAPI spec | DB‑APPT‑001 |
| API‑APPT‑002 | Appointments core integration tests (red) | API‑APPT‑001 |
| API‑APPT‑003 | Appointment service and repository | DB‑APPT‑001, EVENT‑001 |
| API‑APPT‑004 | Appointments routes and green tests | API‑APPT‑002, API‑APPT‑003 |
| API‑APPT‑005 | Availability windows CRUD | DB‑APPT‑002 |
| API‑APPT‑006 | Calendar connections API | DB‑APPT‑005 |
| API‑APPT‑007 | Meeting integrations API | DB‑APPT‑006 |
| API‑APPT‑008 | Appointment payments API | DB‑APPT‑007 |
| API‑APPT‑009 | Event types CRUD and round-robin distribution | DB‑APPT‑009 |
| API‑APPT‑010 | Routing forms CRUD | DB‑APPT‑011 |
| API‑APPT‑011 | Waitlist API | DB‑APPT‑012 |
| API‑APPT‑012 | No-show log API | DB‑APPT‑013 |
| API‑APPT‑013 | Availability rules API | DB‑APPT‑002 |
| API‑APPT‑014 | Meeting polls API | DB‑APPT‑008 |
| API‑APPT‑015 | Booking rules CRUD | DB‑APPT‑003 |
| API‑APPT‑016 | Collective exclusions CRUD | DB‑APPT‑014 |

**Verification**
- [ ] Each API task completes its own red/green test cycle before the next dependent task starts
- [ ] End-to-end booking flows use generated clients instead of mock-only data

## Subtasks
- [ ] API‑APPT‑001.1 (AGENT): Restore the missing endpoint inventory in `openapi.yaml`.
- [ ] API‑APPT‑002.1 (AGENT): Write core appointment integration tests in the red phase.
- [ ] API‑APPT‑003.1 (AGENT): Implement the service and repository baseline.
- [ ] API‑APPT‑004.1 (AGENT): Wire routes and bring the core suite to green.
- [ ] API‑APPT‑005.1 (AGENT): Add availability windows endpoints and tests.
- [ ] API‑APPT‑006.1 (AGENT): Add calendar connection lifecycle endpoints.
- [ ] API‑APPT‑007.1 (AGENT): Add video meeting provisioning APIs.
- [ ] API‑APPT‑008.1 (AGENT): Add payment status/refund endpoints for appointments.
- [ ] API‑APPT‑009.1 (AGENT): Restore event-type CRUD plus round-robin routing modes.
- [ ] API‑APPT‑010.1 (AGENT): Restore routing forms CRUD.
- [ ] API‑APPT‑011.1 (AGENT): Restore waitlist participation endpoints.
- [ ] API‑APPT‑012.1 (AGENT): Restore no-show tracking endpoints.
- [ ] API‑APPT‑013.1 (AGENT): Restore per-user availability rules.
- [ ] API‑APPT‑014.1 (AGENT): Restore meeting poll endpoints.
- [ ] API‑APPT‑015.1 (AGENT): Restore booking rules CRUD.
- [ ] API‑APPT‑016.1 (AGENT): Restore collective exclusions CRUD.
# tasks/crm/CRM‑ACTIVITIES‑TASKS.md – CRM Activities, Tasks & History

This file covers CRM activity logging, follow‑up task management, lead conversion audit records, and assignment history tracking. Activities are immutable audit records of CRM events; CRM tasks are actionable follow‑ups linked to leads, contacts, or deals. All tasks include database schema definitions, API contracts, services, integration tests, and automatic ingestion of activities from domain events.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schemas

### [ ] DB‑CRM‑005: Define CRM Activities Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No activity logging table exists. CRM event history cannot be recorded.
**Size:** Small

**Description:** Define the `activities` table – an append‑only log of all CRM events (notes, emails, calls, stage changes, assignment changes, conversions, etc.). Each row links to a CRM entity via `entity_type` + `entity_id`.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑018`, `API‑CRM‑027`
**Related Files:** `lib/db/src/schema/crm/activities.ts`, `lib/db/src/__tests__/crm‑activities.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (pgEnum: `lead|contact|company|deal`), `entity_id` (uuid NOT NULL), `activity_type` (pgEnum: `note|email|call|stage_change|assignment_change|lead_converted|meeting|task_completed`), `body` (text nullable), `performed_by` (uuid nullable FK → users), `metadata` (jsonb default `{}`), `created_at` (NO `updated_at` — append‑only)
- [ ] Indexes: `(entity_type, entity_id, created_at)`, `(organization_id, created_at)`, `(performed_by, created_at)`
- [ ] Zod schemas exported; `entity_type` and `activity_type` validated as enums
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Append‑only: no `updated_at`, no `deleted_at`. Activities are immutable once created.
- `performed_by` can be null for system‑triggered activities.

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑activities.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Activities are immutable value objects recording CRM event history. They belong to the CRM bounded context.

---

### Subtasks
- [ ] DB‑CRM‑005.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. *No action – pause.*
- [ ] DB‑CRM‑005.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑activities.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑005.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑CRM‑006: Define CRM Tasks Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM‑specific task table exists. CRM follow‑up tasks cannot be tracked independently from project tasks.
**Size:** Small

**Description:** Define the `crm_tasks` table – follow‑up tasks linked to leads, contacts, or deals, with due dates, assignees, and status tracking. This is separate from project tasks.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑024`
**Related Files:** `lib/db/src/schema/crm/crm_tasks.ts`, `lib/db/src/__tests__/crm‑tasks.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (pgEnum: `lead|contact|deal`), `entity_id` (uuid NOT NULL), `title` (text NOT NULL), `description` (text nullable), `due_date` (date nullable), `status` (pgEnum: `open|in_progress|completed`), `assigned_to` (uuid FK → users), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(entity_type, entity_id)`, `(assigned_to, status)`
- [ ] Zod schemas exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑tasks.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑CRM‑006.0.25 (AGENT): Read DB‑ORG‑001. *No action – pause.*
- [ ] DB‑CRM‑006.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑tasks.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑006.2 (AGENT): Implement table, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑CRM‑007: Define Lead Conversions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No audit table for lead conversions exists.
**Size:** Small

**Description:** Define the `lead_conversions` table – tracks lead‑to‑contact or lead‑to‑deal conversions for audit purposes. One conversion per lead.

**Depends on:** `crm/CRM‑LEADS.md → DB‑CRM‑001` (leads FK), `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002` (contacts FK), `crm/CRM‑DEALS.md → DB‑CRM‑004` (deals FK)
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑022`
**Related Files:** `lib/db/src/schema/crm/lead_conversions.ts`, `lib/db/src/__tests__/crm‑conversions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `lead_id` (FK → leads), `target_type` (text NOT NULL — `contact|deal`), `target_id` (uuid NOT NULL), `converted_by` (uuid FK → users), `converted_at` (timestamp NOT NULL)
- [ ] Unique constraint on `lead_id` — one conversion per lead
- [ ] Zod schemas exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑conversions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑CRM‑007.0.25 (AGENT): Read DB‑CRM‑001, DB‑CRM‑002, DB‑CRM‑004. *No action – pause.*
- [ ] DB‑CRM‑007.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑conversions.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑007.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑CRM‑009: Define Assignment History Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No history of CRM entity ownership changes exists.
**Size:** Small

**Description:** Define the `assignment_history` table – an append‑only log of ownership/assignment changes across all CRM entities.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001` (users FK)
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑025`
**Related Files:** `lib/db/src/schema/crm/assignment_history.ts`, `lib/db/src/__tests__/crm‑assignment‑history.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (pgEnum: `lead|contact|company|deal`), `entity_id` (uuid NOT NULL), `previous_assigned_to` (uuid nullable FK → users), `new_assigned_to` (uuid FK → users), `changed_by` (uuid FK → users), `changed_at` (timestamp NOT NULL)
- [ ] Index: `(entity_type, entity_id, changed_at)`
- [ ] Append‑only: no `updated_at`, no `deleted_at`
- [ ] Zod schemas exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑assignment‑history.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑CRM‑009.0.25 (AGENT): Read DB‑ORG‑001, DB‑IDENTITY‑001. *No action – pause.*
- [ ] DB‑CRM‑009.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑assignment‑history.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑009.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑009.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Activities (Append‑Only Log)

### [ ] API‑CRM‑018: Activities – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No activity endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add append‑only activity endpoints and a comprehensive activity type enum to the OpenAPI spec. No PATCH or DELETE endpoints — activities are immutable.

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑005`
**Blocks:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑019`, `API‑CRM‑020`, `API‑CRM‑021`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/crm/activities` with `entityType`, `entityId`, `type`, `page`, `limit` query params
- [ ] `POST /api/v1/crm/activities` with `CreateActivityRequestBody`
- [ ] `GET /api/v1/crm/activities/{activityId}` defined
- [ ] `ActivityTypeEnum`: `note`, `email`, `call`, `stage_change`, `assignment_change`, `lead_converted`, `meeting`, `task_completed`
- [ ] No PATCH or DELETE endpoints defined
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Activities are append‑only value objects representing CRM event history. The spec documents this immutability.

---

### Subtasks
- [ ] API‑CRM‑018.0.25 (AGENT): Read DB‑CRM‑005 schema and activity type requirements. *No action – pause.*
- [ ] API‑CRM‑018.1 (AGENT): Add `Activity` schema and endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑018.2 (HUMAN): Review and sign off. Confirm no PATCH/DELETE endpoints. **Verification:** Approved.

---

### [ ] API‑CRM‑019: Activities – Integration Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No activity integration tests.
**Size:** Medium

**Description:** Write activity integration tests covering creation, retrieval by entity, type filtering, and append‑only enforcement (TDD red phase).

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑018`
**Blocks:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑021`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/activities.test.ts`

**Definition of Done**
- [ ] Tests: create note activity (201), list by entity (lead), filter by `type`, get by ID, attempt DELETE → 405 (method not allowed), auth (401)
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/activities.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑019.0.25 (AGENT): Read API‑CRM‑019 and generated activity schemas. *No action – pause.*
- [ ] API‑CRM‑019.1 (AGENT): Write all activity integration tests. **File(s):** `artifacts/api‑server/__tests__/api/crm/activities.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑CRM‑019.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑CRM‑020: Activities – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ActivityRepository` or `ActivityService` exists.
**Size:** Large

**Description:** Implement `ActivityRepository` (entity‑scoped queries) and `ActivityService` (entity validation, append‑only enforcement, event emission) using neverthrow Results.

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑005`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`, CRM entity repositories (for existence validation)
**Blocks:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑021`, `API‑CRM‑027`
**Related Files:** `lib/db/src/repositories/crm/activities.ts`, `artifacts/api‑server/src/services/crm/activity‑service.ts`

**Definition of Done**
- [ ] `ActivityRepository`: `findById`, `findByEntity`, `create`. No update or delete methods.
- [ ] `ActivityService`: `listActivities`, `getActivity`, `createActivity`. All return `Result<T, DomainError>`.
- [ ] `createActivity` validates that the referenced entity exists and belongs to the same organisation
- [ ] `ActivityCreated` domain event emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/activity‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Activities are append‑only event records. The service enforces this at the domain level.

---

### Subtasks
- [ ] API‑CRM‑020.0.25 (AGENT): Read DB‑CRM‑005 schema, entity repository APIs, and EVENT‑001. *No action – pause.*
- [ ] API‑CRM‑020.1 (AGENT): Implement `ActivityRepository` (read + create only). **File(s):** `lib/db/src/repositories/crm/activities.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑020.2 (AGENT): Implement `ActivityService` with entity validation and append‑only enforcement. **File(s):** `artifacts/api‑server/src/services/crm/activity‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑020.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/crm/__tests__/activity‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑020.4 (HUMAN): Review append‑only enforcement and entity validation. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑021: Activities – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No activity routes wired.
**Size:** Small

**Description:** Create activity route handlers (GET list, POST create, GET by ID — no PATCH/DELETE), mount the router, and run integration tests to green.

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑020`, `API‑CRM‑019`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑027`
**Related Files:** `artifacts/api‑server/src/routes/crm/activities.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] GET list, POST create, GET by ID routes only; 405 on PATCH/DELETE
- [ ] `pnpm test -- activities.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/activities.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑021.0.25 (AGENT): Read `routes/crm/leads.ts` as pattern; note which methods NOT to register. *No action – pause.*
- [ ] API‑CRM‑021.1 (AGENT): Implement activities router (GET list, POST, GET by ID, 405 catch‑all). **File(s):** `artifacts/api‑server/src/routes/crm/activities.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑021.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑021.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Follow‑Up Tasks API

### [ ] API‑CRM‑024: Follow‑Up Tasks API for CRM
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM‑scoped tasks API exists. Only project tasks exist, which have a different lifecycle and data model.
**Size:** Medium

**Description:** Implement CRUD for CRM‑scoped follow‑up tasks linked to leads, contacts, or deals — with entity association, status state machine, soft delete, and clear separation from Project tasks.

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → DB‑CRM‑006`, `crm/CRM‑LEADS.md → API‑CRM‑005`, `infrastructure/AUTH.md → AUTH‑008`, `ERROR‑002`
**Blocks:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑027`
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/crm/crm‑task‑service.ts`, `lib/db/src/repositories/crm/crm‑tasks.ts`, `artifacts/api‑server/src/routes/crm/tasks.ts`

**Definition of Done**
- [ ] `GET /api/v1/crm/tasks?entityType=lead&entityId={id}` — list tasks for a specific entity, filterable by `status`, paginated
- [ ] `POST /api/v1/crm/tasks` — create task linked to an entity
- [ ] `PATCH /api/v1/crm/tasks/{taskId}` — update fields; status transitions: `open → in_progress → completed`
- [ ] `DELETE /api/v1/crm/tasks/{taskId}` — soft delete
- [ ] Validates that referenced entity exists before creating task
- [ ] Integration tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/tasks.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: CRM tasks are value objects associated with CRM aggregates (Lead, Contact, Deal). They are not first‑class aggregates.
- TDD: Write integration tests before implementation. All must fail initially.
- BDD: “As a sales rep, I can create a follow‑up task on a lead with a due date, and it appears in my task list filtered by lead.”

---

### Subtasks
- [ ] API‑CRM‑024.0.25 (AGENT): Read API‑CRM‑024, DB‑CRM‑006, and entity validation requirements. *No action – pause.*
- [ ] API‑CRM‑024.1 (AGENT): Add CRM task endpoints to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑024.2 (AGENT): Write integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/crm/tasks.test.ts` **Verification:** All fail.
- [ ] API‑CRM‑024.3 (AGENT): Implement `CRMTaskRepository` and `CRMTaskService`. **File(s):** `lib/db/src/repositories/crm/crm‑tasks.ts`, `artifacts/api‑server/src/services/crm/crm‑task‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑024.4 (AGENT): Create routes and run integration tests to green. **File(s):** `artifacts/api‑server/src/routes/crm/tasks.ts`, `routes/index.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑024.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Automatic Activity Ingestion

### [ ] API‑CRM‑027: Automatic Activity Ingestion Expansion
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Activities can be manually created via API but are not automatically ingested when CRM domain events occur.
**Size:** Medium

**Description:** Extend `LeadService`, `DealService`, `ContactService`, and `CompanyService` to automatically create activity records (via `ActivityService`) in response to stage changes, assignment changes, lead conversions, and other significant domain actions — with no new API endpoints.

**Depends on:** `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑021`, `crm/CRM‑LEADS.md → API‑CRM‑005`, `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`, `API‑CRM‑013`, `crm/CRM‑DEALS.md → API‑CRM‑017`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** [N/A] — internal enhancement
**Related Files:** `artifacts/api‑server/src/services/crm/lead‑service.ts`, `deal‑service.ts`, `contact‑service.ts`, `activity‑service.ts`

**Definition of Done**
- [ ] `LeadService.updateLead()` creates `stage_change` activity when `stage` field changes
- [ ] `LeadService.convertLead()` creates `lead_converted` activity
- [ ] `DealService.updateDeal()` creates `stage_change` activity when `stage` changes
- [ ] Assignment changes (via `AssignmentService`) create `assignment_change` activity
- [ ] Unit tests verify activities are created when actions occur (mock `ActivityService`)
- [ ] Integration tests: perform an action via API, assert activity appears in entity’s activity list
- [ ] Activity creation failure must not fail the parent operation (fire‑and‑forget, logged as warning)
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Activity creation must be fire‑and‑forget: catch errors, log at `warn` level, do not propagate to caller.
- Activities are created AFTER the primary domain operation commits successfully.

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/lead‑service.test.ts -t "creates activity"
pnpm test -- artifacts/api‑server/__tests__/api/crm/leads.test.ts -t "activity"
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Automatic activity ingestion implements the “audit trail” aggregate pattern.
- TDD: Add unit tests to existing service tests — mock `ActivityService` and verify it’s called with correct payload on stage change.
- BDD: “When a lead moves from ‘new’ to ‘contacted’, a ‘Stage Changed’ activity automatically appears in the lead’s activity timeline.”

---

### Subtasks
- [ ] API‑CRM‑027.0.25 (AGENT): Read API‑CRM‑027, `ActivityService` API, and all services to be modified. *No action – pause.*
- [ ] API‑CRM‑027.1 (AGENT): Add activity creation call to `LeadService.updateLead()` for stage changes. **File(s):** `artifacts/api‑server/src/services/crm/lead‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑027.2 (AGENT): Add activity creation to `DealService.updateDeal()` and `AssignmentService.reassign()`. **File(s):** `deal‑service.ts`, `assignment‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CRM‑027.3 (AGENT): Integration test — perform lead stage change via API, verify activity appears. **File(s):** `artifacts/api‑server/__tests__/api/crm/leads.test.ts` **Verification:** Integration test passes; `pnpm typecheck`.
- [ ] API‑CRM‑027.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
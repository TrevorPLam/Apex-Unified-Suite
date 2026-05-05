# TODO-P3-CRM-DEPTH.md – Phase 3: CRM Depth Features

## Tasks in this file
- API-CRM-022: Lead Conversion API
- API-CRM-023: Duplicate Detection & Merge API
- API-CRM-024: Follow-Up Tasks API for CRM
- API-CRM-025: Ownership & Assignment Management API
- API-CRM-026: Composite 360° Workspace Endpoints
- API-CRM-027: Automatic Activity Ingestion Expansion
- API-CRM-028: Email Mailbox Connection API

---

## [ ] API-CRM-022: Lead Conversion API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Leads have `converted_at` / `converted_to_type` / `converted_to_id` columns in schema but no endpoint to trigger conversion. Conversion logic does not exist.
**Size:** Large

**Description:** Implement `POST /crm/leads/{leadId}/convert` — a transactional endpoint that marks a lead as converted, creates or links a target entity (contact, company, or deal), logs a `LeadConverted` activity, emits the `LeadConverted` domain event, and prevents duplicate conversions idempotently.

**Depends on:** API-CRM-005 (leads integration tests green), DB-CRM-007 (lead_conversions table), EVENT-001 (domain event bus), API-CRM-003 (LeadService), ERROR-002 (domain errors).
**Blocks:** API-CRM-026 (360° workspace uses conversion data), API-CRM-027 (activity ingestion for conversion events).
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/src/routes/crm/leads.ts`, `artifacts/api-server/__tests__/api/crm/leads.test.ts`

**Imports / Exports**
- Imports: `LeadRepository` (lib/db), `ContactService`, `CompanyService`, `DealService` (for entity creation), `ActivityService` (for activity logging), `DomainEventBus` (EVENT-001), `DomainError` (ERROR-002)
- Exports: `LeadService.convertLead(leadId, dto, userId)` method; `POST /crm/leads/{leadId}/convert` route

**Definition of Done**
- [ ] `POST /crm/leads/{leadId}/convert` accepts `{ targetType: 'contact'|'company'|'deal', targetId?: string, createPayload?: object }`.
- [ ] Transactionally: marks lead `converted_at = now()`, sets `converted_to_type` and `converted_to_id`, creates target entity if `createPayload` provided, inserts `LeadConverted` activity.
- [ ] Idempotent: if lead is already converted, returns 200 with existing conversion data (not 400).
- [ ] Emits `LeadConverted` domain event with `leadId`, `targetType`, `targetId`, `convertedBy`, `convertedAt`.
- [ ] Integration tests: successful conversion to contact, to deal (new entity), duplicate conversion returns same data, invalid `targetType` → 400, lead not found → 404, unauthorized → 401.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Bulk lead conversion
- Conversion reversal / unconverting a lead
- Automatic field mapping from lead to target entity (manual mapping only)
- Email notification on conversion

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow conversion to proceed without a valid `targetType` — unknown types return 400

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/src/routes/crm/leads.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/leads.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-007)

**Rollback**
- Granularity: function-level (revert `convertLead` method from LeadService; revert route handler)
- Halt condition: conversion that partially writes target entity without marking lead as converted — add DB transaction guard and halt if transaction fails.

**Rules to Follow**
- Entire conversion (lead update + entity creation + activity creation) must be a single DB transaction.
- Idempotency: check `converted_at IS NOT NULL` before processing; return existing data with 200 if already converted.
- Emit domain event only after successful transaction commit, not before.
- `convertLead` must return `Result<ConversionResult, DomainError>` — no `throw`.
- Validate `targetId` existence if provided (foreign key check before transaction).

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/leads.test.ts -t "convert"
pnpm typecheck
```

**Advanced Code Patterns**
- Transactional saga: wrap all writes in `db.transaction(async (tx) => { ... })` using Drizzle transactions.
- Idempotency guard: `if (lead.convertedAt !== null) return ok({ ...existingConversionData })`.
- Entity factory pattern: `targetType` dispatches to the correct service (`ContactService.create`, `DealService.create`).
- Domain event after commit: emit `LeadConverted` only in the `then()` clause after the transaction resolves.

**Anti-Patterns**
- Non-transactional conversion leaving orphaned target entities if lead update fails.
- Throwing on duplicate conversion instead of returning idempotent result.
- Emitting domain event before transaction commits (event fires but DB rolls back).
- Missing `targetType` validation — accepting arbitrary strings.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Lead conversion is a domain operation that crosses aggregate boundaries (Lead → Contact/Company/Deal). The `LeadService` orchestrates but delegates entity creation to other services.
- TDD: Write integration tests first (red). All must fail before `convertLead` is implemented.
- BDD: "When a sales rep converts a qualified lead to a contact, the lead is marked converted, a contact is created with the lead's data, and a 'Lead Converted' activity appears in the timeline."
- Deep Module: `LeadService.convertLead()` hides transaction management, entity factory dispatch, activity creation, and event emission behind one method call.

---

### Subtasks
- [ ] API-CRM-022.0.25 (AGENT): Read API-CRM-022, API-CRM-003 (LeadService), DB-CRM-007, and EVENT-001. Understand conversion data model.
  *No action — pause until fully understood.*

- [ ] API-CRM-022.0.5 (AGENT): Research Drizzle ORM transaction API and idempotency patterns for conversion endpoints (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-022.0.75 (AGENT): Confirm conversion field mapping strategy (which lead fields copy to contact/deal?) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-022.1 (AGENT): Add `POST /crm/leads/{leadId}/convert` to OpenAPI spec with request/response schemas.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-022.2 (AGENT): Write integration tests (red phase) — success, duplicate, invalid type, not found, unauthorized.
  **File(s):** `artifacts/api-server/__tests__/api/crm/leads.test.ts`
  **Verification:** `pnpm test -- leads.test.ts -t "convert"` all fail (red)

- [ ] API-CRM-022.3 (AGENT): Implement `LeadService.convertLead()` with transaction, entity factory, activity creation, and event emission.
  **File(s):** `artifacts/api-server/src/services/crm/lead-service.ts`
  **Verification:** `pnpm test -- lead-service.test.ts -t "convertLead"` unit tests pass

- [ ] API-CRM-022.4 (AGENT): Create route handler and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/leads.ts`
  **Verification:** `pnpm test -- leads.test.ts -t "convert"` all green ; `pnpm typecheck`

- [ ] API-CRM-022.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved; transaction integrity verified; idempotency confirmed; all tests green.

---

## [ ] API-CRM-023: Duplicate Detection & Merge API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No duplicate detection exists; duplicate leads/contacts accumulate silently when imported or created manually.
**Size:** Large

**Description:** Implement `GET /crm/leads/duplicates` (email/phone-based duplicate pair detection) and `POST /crm/leads/merge` (survivorship-rules merge with reference updates and secondary soft-delete), replicated for contacts and companies.

**Depends on:** API-CRM-005 (leads green), DB-CRM-008 (duplicate_detection + merge_history tables), ERROR-002 (domain errors).
**Blocks:** [N/A] — enhancement feature, does not block other tasks.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/__tests__/api/crm/leads.test.ts`

**Imports / Exports**
- Imports: `LeadRepository`, `ContactRepository`, `CompanyRepository`, `db` pool, `DomainError` (ERROR-002)
- Exports: `LeadService.findDuplicates()`, `LeadService.mergeLeads()` methods; duplicate/merge routes

**Definition of Done**
- [ ] `GET /crm/leads/duplicates` returns pairs `{ primary: Lead, duplicate: Lead, confidence: 'email'|'phone'|'both' }` sorted by match confidence.
- [ ] `POST /crm/leads/merge` accepts `{ primaryId, secondaryId, survivorshipRules?: Record<string, 'primary'|'secondary'> }`. Atomically: applies survivorship rules, reassigns all secondary references to primary, soft-deletes secondary, records merge in history.
- [ ] Same endpoints replicated for `contacts` and `companies`.
- [ ] Integration tests: detect duplicates from seeded data, merge leads (verify secondary soft-deleted, references updated), merge with custom survivorship, merge already-deleted secondary → 404.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Fuzzy/phonetic duplicate matching (only exact email/phone match at this phase)
- Automatic duplicate merging without human review
- Cross-entity type merging (e.g., merging a lead into a contact — that is conversion, not merge)
- Bulk merge operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never hard-delete the secondary record — only soft-delete to preserve audit trail

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/src/routes/crm/leads.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/leads.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-008)

**Rollback**
- Granularity: function-level (revert `findDuplicates`, `mergeLeads` from service; revert routes)
- Halt condition: merge that soft-deletes secondary before reference reassignment completes — must be transactional; halt if transaction not present.

**Rules to Follow**
- Merge must be a single DB transaction: reference updates + soft-delete + history record, all or nothing.
- Never merge a primary into itself (`primaryId === secondaryId` → 400 `SelfMergeNotAllowed`).
- Survivorship rules default: primary wins for all fields unless explicit override provided.
- Secondary must be active (not already soft-deleted) before merge can proceed.
- Record merge in `merge_history` with actor, timestamp, and applied rules.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/leads.test.ts -t "duplicate|merge"
pnpm typecheck
```

**Advanced Code Patterns**
- Duplicate detection SQL: `SELECT a.id, b.id FROM leads a JOIN leads b ON a.email = b.email AND a.id < b.id WHERE a.organization_id = $orgId AND a.deleted_at IS NULL`.
- Survivorship merge: iterate over `survivorshipRules`, pick field value from primary or secondary, build UPDATE payload for primary.
- Reference reassignment: find all FK columns pointing to `secondary.id` across related tables and UPDATE to `primary.id` in the same transaction.
- Atomic transaction: Drizzle `db.transaction(async (tx) => { ... mergePayload...; await tx.update(leads).set({deleted_at: now()}).where(eq(leads.id, secondaryId)); })`.

**Anti-Patterns**
- Non-transactional merge that soft-deletes secondary before all references are reassigned.
- Hard-deleting the secondary record (loses audit trail).
- Self-merge producing circular references.
- Missing reference reassignment for related tables (orphaned activities, tasks, deals).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Duplicate detection is a read-only query across the Lead aggregate. Merge is a destructive operation that modifies aggregate state — it is a domain operation, not just a CRUD action.
- TDD: Write tests first (red). Seed specific duplicate data in test DB to drive detection tests.
- BDD: "When a user merges two leads with the same email, the duplicate is soft-deleted, all associated activities appear on the surviving lead, and a merge history entry is created."
- Deep Module: `mergeLeads(primaryId, secondaryId, rules, orgId)` hides reference table scanning, survivorship application, transaction management, and history logging.

---

### Subtasks
- [ ] API-CRM-023.0.25 (AGENT): Read API-CRM-023, DB-CRM-008 schema, and all CRM entity tables that have FK references to leads/contacts/companies.
  *No action — pause until fully understood.*

- [ ] API-CRM-023.0.5 (AGENT): Research duplicate detection SQL patterns and reference cascade strategies for merge operations (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-023.0.75 (AGENT): Enumerate all tables that have FK references to `leads.id`, `contacts.id`, `companies.id` to plan reference reassignment scope.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-023.1 (AGENT): Add duplicate detection and merge endpoints to OpenAPI spec for leads, contacts, companies.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-023.2 (AGENT): Write integration tests (red) — detect duplicates, successful merge, self-merge rejection, already-deleted secondary.
  **File(s):** `artifacts/api-server/__tests__/api/crm/leads.test.ts`
  **Verification:** All fail (red phase)

- [ ] API-CRM-023.3 (AGENT): Implement `findDuplicates()` and `mergeLeads()` in `LeadService` (plus equivalents for Contact/CompanyService).
  **File(s):** `artifacts/api-server/src/services/crm/lead-service.ts`
  **Verification:** `pnpm test -- lead-service.test.ts -t "duplicate|merge"` unit tests pass

- [ ] API-CRM-023.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/leads.ts`
  **Verification:** `pnpm test -- leads.test.ts -t "duplicate|merge"` all green ; `pnpm typecheck`

- [ ] API-CRM-023.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved; transaction integrity verified; reference reassignment confirmed for all tables.

---

## [ ] API-CRM-024: Follow-Up Tasks API for CRM
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM-scoped tasks exist; the only tasks are Project tasks which have a different lifecycle and data model.
**Size:** Medium

**Description:** Implement CRUD for CRM-scoped follow-up tasks linked to leads, contacts, or deals — with entity association, status state machine, soft delete, and clear separation from Project tasks.

**Depends on:** DB-CRM-006 (crm_tasks table), API-CRM-005 (leads green), AUTH-008 (auth middleware), ERROR-002 (domain errors).
**Blocks:** API-CRM-026 (360° workspace shows CRM tasks), API-CRM-027 (activity ingestion includes task completion).
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/crm-task-service.ts`, `lib/db/src/repositories/crm/crm-tasks.ts`, `artifacts/api-server/src/routes/crm/tasks.ts`

**Imports / Exports**
- Imports: `db` pool (lib/db), `req.user` (AUTH-008), `DomainError` (ERROR-002), `ActivityService` (for completion activity)
- Exports: `CRMTaskService`, `CRMTaskRepository`, `/crm/tasks` router

**Definition of Done**
- [ ] `GET /crm/tasks?entityType=lead&entityId={id}` — list tasks for a specific entity, filterable by `status`, paginated.
- [ ] `POST /crm/tasks` — create task linked to an entity (`entity_type` + `entity_id`), with `title`, `due_date`, `assigned_to`, `priority`.
- [ ] `PATCH /crm/tasks/{taskId}` — update fields; status transitions: `open → in_progress → completed`.
- [ ] `DELETE /crm/tasks/{taskId}` — soft delete (sets `deleted_at`).
- [ ] Validates that referenced entity (`entityType` + `entityId`) exists before creating task.
- [ ] Integration tests: create for lead, list by entity, mark complete, attempt invalid status transition → 400, soft delete, unauthorized → 401.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Project tasks (completely separate model and service)
- Recurring CRM tasks
- Task dependencies (no parent/subtask hierarchy for CRM tasks)
- Bulk task operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never mix CRM task IDs with Project task IDs in API responses

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/crm-task-service.ts`, `lib/db/src/repositories/crm/crm-tasks.ts`, `artifacts/api-server/src/routes/crm/tasks.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/tasks.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-006)

**Rollback**
- Granularity: file-level
- Remove `crm-task-service.ts`, `crm-tasks.ts` (repo), `routes/crm/tasks.ts`; revert route mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Status machine enforced in service: `open → in_progress → completed` only; no backward transitions.
- Entity existence validated before task creation (check `entityType` in allowed list + `entityId` in DB).
- Soft delete only — never hard delete CRM tasks.
- `CRMTaskService` methods return `Result<T, DomainError>` — no `throw`.
- CRM task routes must be mounted under `/crm/tasks`, not under `/projects/`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/tasks.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Entity resolver: `resolveEntity(entityType, entityId, orgId)` dispatches to the correct repository to validate existence.
- Status machine: `VALID_CRM_TASK_TRANSITIONS = { open: ['in_progress'], in_progress: ['completed'] }`.
- Soft delete filter: default query excludes `deleted_at IS NOT NULL`; `includeDeleted` param overrides.

**Anti-Patterns**
- Reusing Project task infrastructure for CRM tasks (different lifecycle, different schema).
- Missing entity existence validation before task creation (orphaned tasks).
- Allowing backward status transitions (completed → open) without explicit business justification.
- Hard deleting tasks (loses activity history).

**DDD / TDD / BDD / Deep Module notes**
- DDD: CRM tasks are value objects associated with CRM aggregates (Lead, Contact, Deal). They are not first-class aggregates themselves — they derive meaning from their parent entity.
- TDD: Write integration tests before implementation. All must fail (404) initially.
- BDD: "As a sales rep, I can create a follow-up task on a lead with a due date, and it appears in my task list filtered by lead."
- Deep Module: `CRMTaskService` hides entity validation, status machine, soft delete filtering, and pagination behind 4 simple methods.

---

### Subtasks
- [ ] API-CRM-024.0.25 (AGENT): Read API-CRM-024, DB-CRM-006, and entity validation requirements for leads, contacts, deals.
  *No action — pause until fully understood.*

- [ ] API-CRM-024.0.5 (AGENT): Research CRM task management patterns and status machine implementations (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-024.0.75 (AGENT): Confirm valid `entityType` values and status transition rules with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-024.1 (AGENT): Add CRM task endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-024.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/crm/tasks.test.ts`
  **Verification:** All fail with 404 (red)

- [ ] API-CRM-024.3 (AGENT): Implement `CRMTaskRepository` and `CRMTaskService`.
  **File(s):** `lib/db/src/repositories/crm/crm-tasks.ts`, `artifacts/api-server/src/services/crm/crm-task-service.ts`
  **Verification:** `pnpm test -- crm-task-service.test.ts` unit tests pass

- [ ] API-CRM-024.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/tasks.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- crm/tasks.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-024.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved; CRM vs Project task separation confirmed; all tests green.

---

## [ ] API-CRM-025: Ownership & Assignment Management API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Ownership fields (`assigned_to`, `team_id`, `visibility`) exist in CRM schemas but there are no dedicated endpoints to reassign ownership or query "my records."
**Size:** Medium

**Description:** Implement `PATCH /crm/{entityType}/{id}/assign` for ownership/team/visibility reassignment with event emission and history logging, plus `GET /crm/my-records` for the authenticated user's assigned entities across all CRM types.

**Depends on:** DB-CRM-009 (assignment_history table), API-CRM-009 (contacts green), API-CRM-013 (companies green), API-CRM-017 (deals green), EVENT-001 (domain events).
**Blocks:** [N/A] — enhancement; used by 360° workspace and activity ingestion.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/assignment-service.ts`, `artifacts/api-server/src/routes/crm/assignments.ts`

**Imports / Exports**
- Imports: `LeadRepository`, `ContactRepository`, `CompanyRepository`, `DealRepository`, `DomainEventBus` (EVENT-001), `req.user` (AUTH-008)
- Exports: `AssignmentService`, `/crm/assign` and `/crm/my-records` routes

**Definition of Done**
- [ ] `PATCH /crm/{entityType}/{id}/assign` accepts `{ assigned_to?: string, team_id?: string, visibility?: 'public'|'team'|'private' }`.
- [ ] Validates that `assigned_to` (if provided) is a valid user in the same organisation.
- [ ] Records assignment change in `assignment_history` table.
- [ ] Emits `AssignmentChanged` domain event with previous and new owner details.
- [ ] `GET /crm/my-records?entityType={csv}&page=1&limit=20` returns entities assigned to `req.user.userId` across specified types.
- [ ] Integration tests: reassign lead, verify history entry, my-records returns correct data, invalid user → 400, unauthorized → 401.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Bulk reassignment (handled by API-CROSS-001)
- Territory-based automatic assignment rules
- Round-robin assignment algorithms
- Team membership management (belongs to Settings/Identity)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never allow assignment to a user from a different organisation

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/assignment-service.ts`, `artifacts/api-server/src/routes/crm/assignments.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/assignments.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-009)

**Rollback**
- Granularity: file-level
- Remove `assignment-service.ts` and `routes/crm/assignments.ts`; revert route mount.
- Halt condition: cross-organisation assignment found in testing — halt immediately and add validation.

**Rules to Follow**
- Validate `assigned_to` is a user in the same `organization_id` before any write.
- `AssignmentChanged` event emitted only after successful DB write.
- `visibility` enum values: `public`, `team`, `private` — reject unknown values with 400.
- `my-records` must be paginated; max `limit=100`.
- `AssignmentService` methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/assignments.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Generic entity resolver: `resolveEntity(entityType, id, orgId)` returns the record or `EntityNotFound`.
- History INSERT on every assignment change with `previous_assigned_to`, `new_assigned_to`, `changed_by`, `changed_at`.
- `my-records` query: `UNION ALL` across entity tables filtered by `assigned_to = $userId AND organization_id = $orgId`.

**Anti-Patterns**
- Missing organisation validation on `assigned_to` (cross-org data access).
- Emitting `AssignmentChanged` before DB commit (event fires but state isn't saved).
- `my-records` with unbounded result set (always paginate).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Ownership is a cross-cutting concern within the CRM bounded context; assignment changes are tracked as domain events for auditability.
- TDD: Write integration tests before implementation; all must fail initially.
- BDD: "When a manager reassigns a lead to another rep, the previous owner is recorded in history and an AssignmentChanged event is emitted."
- Deep Module: `AssignmentService.reassign(entityType, entityId, payload, actorId)` hides entity resolution, user validation, history write, and event emission.

---

### Subtasks
- [ ] API-CRM-025.0.25 (AGENT): Read API-CRM-025, DB-CRM-009 schema, EVENT-001, and all CRM entity repositories.
  *No action — pause until fully understood.*

- [ ] API-CRM-025.0.5 (AGENT): Research generic entity resolution patterns and `UNION ALL` query performance for cross-type queries (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-025.0.75 (AGENT): Confirm `entityType` values supported by `my-records` endpoint with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-025.1 (AGENT): Add assignment and my-records endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-025.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/crm/assignments.test.ts`
  **Verification:** All fail (red)

- [ ] API-CRM-025.3 (AGENT): Implement `AssignmentService` with entity resolution, user validation, history write, and event emission.
  **File(s):** `artifacts/api-server/src/services/crm/assignment-service.ts`
  **Verification:** `pnpm test -- assignment-service.test.ts` unit tests pass

- [ ] API-CRM-025.4 (AGENT): Create routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/assignments.ts`
  **Verification:** `pnpm test -- assignments.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-025.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved; cross-org validation confirmed; all tests green.

---

## [ ] API-CRM-026: Composite 360° Workspace Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No composite endpoints exist; the frontend must make 5-7 separate API calls to assemble a contact/company/deal workspace view.
**Size:** Large

**Description:** Implement three aggregate read endpoints that assemble a complete 360° view of a contact, company, or deal — including related entities, activities, tasks, documents, and metrics — in a single request with organisation-scoped permission checks.

**Depends on:** All CRM CRUD APIs (API-CRM-009 contacts, API-CRM-013 companies, API-CRM-017 deals, API-CRM-021 activities, API-CRM-024 tasks), AUTH-008, RBAC-001.
**Blocks:** [N/A] — enables frontend 360° view pages.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/workspace-service.ts`, `artifacts/api-server/src/routes/crm/workspace.ts`

**Imports / Exports**
- Imports: All CRM repositories (Lead, Contact, Company, Deal, Activity, CRMTask), `req.user` (AUTH-008)
- Exports: `WorkspaceService`, `/crm/contacts/{id}/workspace`, `/crm/companies/{id}/workspace`, `/crm/deals/{id}/workspace` routes

**Definition of Done**
- [ ] `GET /crm/contacts/{id}/workspace` — returns contact + related deals, activities (last 10), CRM tasks (open), documents (last 5), engagements.
- [ ] `GET /crm/companies/{id}/workspace` — returns company + contacts list, deals, revenue summary (total won), activities.
- [ ] `GET /crm/deals/{id}/workspace` — returns deal + contacts, activities, CRM tasks, documents, proposal links.
- [ ] All workspace endpoints return 404 if entity not found or belongs to a different organisation.
- [ ] Integration tests: verify nested data is correct and complete, unauthorised access blocked, entity not found → 404.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Real-time data (static snapshot at request time)
- Partial field selection (full workspace data returned)
- Cross-context data (Projects workspace, Finance workspace — separate endpoints)
- Cursor-based pagination for nested collections (fixed limits: activities last 10, docs last 5)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never return data from a different organisation in nested collections

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/workspace-service.ts`, `artifacts/api-server/src/routes/crm/workspace.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/workspace.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove `workspace-service.ts` and `routes/crm/workspace.ts`; revert route mount.
- Halt condition: any nested collection leaking cross-organisation data — halt immediately.

**Rules to Follow**
- All nested queries must include `AND organization_id = $orgId` predicate.
- Use `Promise.all([...])` to parallelise repository queries for better latency.
- Nested collection limits: activities → 10, tasks → open only, documents → 5.
- `WorkspaceService` must not embed business logic — it aggregates read-model data only.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/workspace.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Parallel fetch: `const [contact, deals, activities, tasks] = await Promise.all([contactRepo.findById(...), dealRepo.findByContactId(...), ...])`.
- Org-scoped guard: validate root entity's `organization_id` matches `req.user.organizationId` before fetching related data.
- Revenue summary: `SELECT SUM(amount_cents) FROM deals WHERE company_id = $id AND stage = 'closed_won' AND organization_id = $orgId`.

**Anti-Patterns**
- N+1 queries (one per related entity instead of one per collection).
- Missing `organization_id` predicate in nested queries (cross-tenant data leak).
- Sequential fetches instead of parallel (unnecessary latency).
- Embedding business logic (deal stage rules) in workspace service (read model only).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Workspace endpoints are read models / query projections, not domain commands. They do not mutate state and do not enforce business rules.
- TDD: Write integration tests with seeded data before implementation. Verify each nested collection is populated correctly.
- BDD: "When I open a contact workspace, I see their related deals, recent activities, and open tasks in a single view without multiple page loads."
- Deep Module: `WorkspaceService.getContactWorkspace(contactId, orgId)` hides 5 parallel DB queries and result assembly behind one method call.

---

### Subtasks
- [ ] API-CRM-026.0.25 (AGENT): Read API-CRM-026 and all CRM repository APIs it depends on. Map out the data structure for each workspace type.
  *No action — pause until fully understood.*

- [ ] API-CRM-026.0.5 (AGENT): Research parallel query patterns in Drizzle ORM and query optimisation for composite read endpoints (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-026.0.75 (AGENT): Confirm nested collection limits and which fields to include per workspace type with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-026.1 (AGENT): Add workspace endpoints to OpenAPI spec with composite response schemas.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-026.2 (AGENT): Write integration tests with seeded relational data (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/crm/workspace.test.ts`
  **Verification:** All fail (red)

- [ ] API-CRM-026.3 (AGENT): Implement `WorkspaceService` with parallel repository queries for all three workspace types.
  **File(s):** `artifacts/api-server/src/services/crm/workspace-service.ts`
  **Verification:** `pnpm test -- workspace-service.test.ts` unit tests pass with mocked repos

- [ ] API-CRM-026.4 (AGENT): Create workspace routes and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/workspace.ts`
  **Verification:** `pnpm test -- workspace.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-026.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved; org-scoping on all nested queries confirmed; all tests green.

---

## [ ] API-CRM-027: Automatic Activity Ingestion Expansion
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Activities can be manually created via API but are not automatically ingested when CRM domain events occur (stage changes, assignments, conversions, etc.).
**Size:** Medium

**Description:** Extend LeadService, DealService, ContactService, and CompanyService to automatically create activity records (via `ActivityService`) in response to stage changes, assignment changes, lead conversions, and other significant domain actions — with no new API endpoints.

**Depends on:** API-CRM-021 (ActivityService green), API-CRM-005 (leads), API-CRM-009 (contacts), API-CRM-013 (companies), API-CRM-017 (deals), EVENT-001 (domain events).
**Blocks:** [N/A] — internal enhancement; surfaces data for 360° workspace and audit trail.
**Related Files:** `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/src/services/crm/deal-service.ts`, `artifacts/api-server/src/services/crm/contact-service.ts`, `artifacts/api-server/src/services/crm/activity-service.ts`

**Imports / Exports**
- Imports: `ActivityService` (injected into each domain service), domain event types (EVENT-001)
- Exports: No new exports — changes are internal to existing services

**Definition of Done**
- [ ] `LeadService.updateLead()` creates `stage_change` activity when `stage` field changes.
- [ ] `LeadService.convertLead()` creates `lead_converted` activity (already planned in API-CRM-022).
- [ ] `DealService.updateDeal()` creates `stage_change` activity when `stage` field changes.
- [ ] Assignment changes (via `AssignmentService`) create `assignment_change` activity.
- [ ] Unit tests verify activities are created when actions occur (mock `ActivityService`).
- [ ] Integration tests: perform an action via API, assert activity appears in entity's activity list.
- [ ] Activity creation failure must not fail the parent operation (fire-and-forget, logged as warning).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Email/SMS activity ingestion (API-CRM-028 handles mailbox)
- Document event activities (Documents context)
- Bulk action activities
- Activity de-duplication

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/lead-service.ts`, `artifacts/api-server/src/services/crm/deal-service.ts`, `artifacts/api-server/src/services/crm/assignment-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/lead-service.test.ts`, `deal-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert the activity creation calls from each service method.
- Halt condition: activity creation causing domain operation to fail (must be fire-and-forget; add try-catch if missing).

**Rules to Follow**
- Activity creation must be fire-and-forget: catch errors, log at `warn` level, do not propagate to caller.
- Activities are created AFTER the primary domain operation commits successfully.
- Use `ActivityService.createActivity()` — do not write directly to the activity repository.
- Activity type values must use the enum defined in DB-CRM-005 schema (e.g., `'stage_change'`, `'assignment_change'`).

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/lead-service.test.ts -t "creates activity"
pnpm test -- artifacts/api-server/__tests__/api/crm/leads.test.ts -t "activity"
pnpm typecheck
```

**Advanced Code Patterns**
- Fire-and-forget activity: `this.activityService.createActivity(payload).catch(err => this.logger.warn('Activity creation failed', err))`.
- Activity payload builder: `buildStageChangeActivity(entityType, entityId, previousStage, newStage, actorId)`.
- Dependency injection: inject `ActivityService` into domain services via constructor, not imported at module level.

**Anti-Patterns**
- Awaiting activity creation inside domain operation (couples activity failure to domain failure).
- Creating activities before domain operation commits (orphaned activities if rollback occurs).
- Directly inserting into `activities` table from domain services (bypasses ActivityService validation).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Automatic activity ingestion implements the "audit trail" aggregate pattern. Activities are value objects that record domain event history.
- TDD: Add unit tests to existing service tests — mock `ActivityService` and verify it's called with correct payload on stage change.
- BDD: "When a lead moves from 'new' to 'contacted', a 'Stage Changed' activity automatically appears in the lead's activity timeline."
- Deep Module: No new public interface — changes are internal to existing deep module services.

---

### Subtasks
- [ ] API-CRM-027.0.25 (AGENT): Read API-CRM-027, ActivityService API, and all services to be modified. Map which service methods trigger which activities.
  *No action — pause until fully understood.*

- [ ] API-CRM-027.0.5 (AGENT): Confirm activity type enum values and payload fields for each activity type (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-027.0.75 (AGENT): Confirm fire-and-forget vs transactional activity creation with user. (Recommendation: fire-and-forget.)
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-027.1 (AGENT): Add activity creation call to `LeadService.updateLead()` for stage changes.
  **File(s):** `artifacts/api-server/src/services/crm/lead-service.ts`
  **Verification:** `pnpm test -- lead-service.test.ts -t "creates stage_change activity"` passes

- [ ] API-CRM-027.2 (AGENT): Add activity creation to `DealService.updateDeal()` for stage changes and `AssignmentService.reassign()` for assignment changes.
  **File(s):** `artifacts/api-server/src/services/crm/deal-service.ts`, `assignment-service.ts`
  **Verification:** `pnpm test -- deal-service.test.ts -t "activity"` ; `pnpm test -- assignment-service.test.ts -t "activity"`

- [ ] API-CRM-027.3 (AGENT): Integration test — perform lead stage change via API, verify activity appears in `GET /crm/activities?entityType=lead&entityId=...`.
  **File(s):** `artifacts/api-server/__tests__/api/crm/leads.test.ts`
  **Verification:** Integration test passes ; `pnpm typecheck`

- [ ] API-CRM-027.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved; activity creation is fire-and-forget confirmed; all tests green.

---

## [ ] API-CRM-028: Email Mailbox Connection API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No mailbox connection infrastructure exists; users cannot link their Google or Outlook accounts for email ingestion into CRM.
**Size:** Large

**Description:** Implement OAuth 2.0 mailbox connection management endpoints for Google and Outlook — connection creation (initiating OAuth flow), status retrieval, and deletion — with secure token storage (encrypted at rest) and connection health monitoring.

**Depends on:** DB-CRM-010 (mailbox_connections table with encrypted token columns), AUTH-008 (auth middleware), ERROR-002 (domain errors). External: Google OAuth 2.0 API, Microsoft Graph OAuth 2.0 API.
**Blocks:** Future email ingestion and email activity logging tasks.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/mailbox-service.ts`, `artifacts/api-server/src/routes/crm/mailbox.ts`

**Imports / Exports**
- Imports: OAuth client libraries (`googleapis`, `@microsoft/microsoft-graph-client`), `db` pool, `req.user` (AUTH-008), encryption utility
- Exports: `MailboxService`, `/crm/mailbox-connections` router

**Definition of Done**
- [ ] `POST /crm/mailbox-connections` — initiates OAuth flow; returns authorization URL for the user to visit.
- [ ] `GET /crm/mailbox-connections/callback?code={code}&state={state}` — handles OAuth callback, stores encrypted tokens, returns 201 with connection object.
- [ ] `GET /crm/mailbox-connections` — lists the user's connections with status (`active`, `expired`, `error`).
- [ ] `DELETE /crm/mailbox-connections/{connectionId}` — revokes OAuth token and deletes connection record.
- [ ] Refresh tokens stored encrypted at rest (AES-256 via app-level encryption, not relying solely on DB encryption).
- [ ] CSRF protection via `state` parameter in OAuth flow (random UUID, stored in session/cache, verified on callback).
- [ ] Integration tests: mock OAuth provider, connection creation, list, delete, expired token detection.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Email fetching/ingestion (this task is connection management only)
- IMAP/SMTP direct connection (OAuth 2.0 only at this phase)
- Mobile OAuth flows
- Multi-mailbox per-user beyond 2 connections (Google + Outlook)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, OAuth client secrets, refresh tokens
- Never store OAuth tokens unencrypted in DB or logs
- Never expose refresh tokens in API responses

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/mailbox-service.ts`, `artifacts/api-server/src/routes/crm/mailbox.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/mailbox.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-010)

**Rollback**
- Granularity: file-level — remove `mailbox-service.ts` and `routes/crm/mailbox.ts`; revert route mount.
- Halt condition: refresh tokens found unencrypted in any log or DB column — halt immediately, rotate credentials.

**Rules to Follow**
- OAuth `state` parameter must be a cryptographically random UUID stored server-side and verified on callback — do not trust client-provided state.
- Refresh tokens must be AES-256 encrypted before DB storage; decryption key sourced from env var `TOKEN_ENCRYPTION_KEY`.
- Expired connections must be detected on status fetch (attempt token refresh; mark `error` if refresh fails).
- `MailboxService` methods return `Result<T, DomainError>` — no `throw`.
- User can have at most one active connection per provider (Google, Outlook).

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/mailbox.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- OAuth PKCE flow for added security (use `code_verifier` + `code_challenge` in addition to `state`).
- Token encryption: `crypto.createCipheriv('aes-256-gcm', key, iv)` — store `iv` alongside ciphertext.
- Connection health check: on `GET /connections`, attempt a lightweight API call (e.g., `GET /me`) to verify token validity; refresh if expired.
- `state` CSRF token stored in Redis or in-memory cache with 10-minute TTL.

**Anti-Patterns**
- Trusting client-provided `state` without server-side validation (CSRF vulnerability).
- Storing refresh tokens in plain text (critical security defect).
- Exposing refresh tokens in API responses (even in encrypted form).
- Missing token refresh logic causing connections to silently expire.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mailbox connections are infrastructure for the CRM bounded context. They are not CRM entities themselves; they are integration adapters providing data to CRM services.
- TDD: Write integration tests with mocked OAuth providers before implementation. Verify state CSRF protection, encrypted storage, and token refresh.
- BDD: "As a sales rep, I can connect my Gmail account to CRM and have incoming emails automatically logged as activities on the relevant contact."
- Deep Module: `MailboxService.initiateConnection(provider, userId)` hides OAuth URL construction, state generation, CSRF token storage, and provider-specific configuration.

---

### Subtasks
- [ ] API-CRM-028.0.25 (AGENT): Read API-CRM-028, DB-CRM-010 schema, and OAuth 2.0 documentation for Google and Microsoft Graph.
  *No action — pause until fully understood.*

- [ ] API-CRM-028.0.5 (AGENT): Research OAuth PKCE flow implementation in Node.js, token encryption best practices, and CSRF state management (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-028.0.75 (AGENT): Confirm encryption key management approach and state storage mechanism (Redis vs in-memory) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-028.1 (AGENT): Add mailbox connection endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-028.2 (AGENT): Write integration tests with mocked OAuth providers (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/crm/mailbox.test.ts`
  **Verification:** All fail (red)

- [ ] API-CRM-028.3 (AGENT): Implement encryption utility and `MailboxService` with OAuth flow, token storage, and health check.
  **File(s):** `artifacts/api-server/src/services/crm/mailbox-service.ts`, `artifacts/api-server/src/lib/encryption.ts`
  **Verification:** `pnpm test -- mailbox-service.test.ts` unit tests pass; no plain-text tokens in logs

- [ ] API-CRM-028.4 (AGENT): Create routes (initiate, callback, list, delete) and run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/crm/mailbox.ts`
  **Verification:** `pnpm test -- mailbox.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-028.5 (HUMAN): Security review and sign-off. Verify token encryption and CSRF protection.
  **Verification:** Approved; no refresh tokens in responses or logs; CSRF state verified; all tests green.

---

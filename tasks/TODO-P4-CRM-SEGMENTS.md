# TODO-P4-CRM-SEGMENTS.md – CRM Segmentation Engine

This file covers the dynamic CRM segmentation engine (ActiveCampaign-style). Segments are evaluated against CRM contact/lead/deal data using AND/OR/NOT rule trees. Segment membership drives automation triggers in later phases.

---

### [ ] CRM‑SEG‑001: Dynamic Segment Builder – API & UI
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No segment builder exists. `lib/api-spec/openapi.yaml` has no `segments` tag. `lib/db/src/schema/` has no `segments` table. CRM contacts/leads can only be filtered by fixed fields; no dynamic rule-based grouping is possible.  
**Size:** Large  

**Description:** Build the full segment builder: DB schema (JSONB rule tree), CRUD API, real-time or cached evaluation against CRM contacts/leads/companies, and a visual drag-and-drop rule builder UI in the CRM page.  

**Depends on:** API‑CRM‑005 (leads API), API‑CRM‑009 (contacts API), API‑CRM‑013 (companies API)  
**Blocks:** CRM‑SEG‑002 (automation triggers require segment events)  
**Related Files:** `lib/db/src/schema/crm-segments.ts`, `lib/db/src/repositories/crm-segments.ts`, `artifacts/api-server/src/services/crm/segment-service.ts`, `artifacts/api-server/src/routes/crm/segments.ts`, `lib/api-spec/openapi.yaml`, `artifacts/apex-os/src/components/crm/SegmentBuilder.tsx`  

**Imports / Exports**
- Imports: Drizzle `pgTable`, `jsonb`, `uuid`, `text`, `timestamp`; `BaseRepository`; React `useState`, `useCallback`; shadcn/ui `Card`, `Button`, `Select`
- Exports: `segmentsTable` (schema), `SegmentRepository` (class), `SegmentService` (class), `segmentsRouter` (Express Router), `SegmentBuilder` (React component)

**Definition of Done**
- [ ] DB: `lib/db/src/schema/crm-segments.ts` defines `segments` table with `rules: jsonb` column, `organization_id`, soft delete
- [ ] DB: `pnpm --filter @workspace/db run push` succeeds (with user approval)
- [ ] OpenAPI: `segments` tag with `POST /crm/segments`, `GET /crm/segments`, `GET /crm/segments/{id}`, `GET /crm/segments/{id}/members`, `PATCH /crm/segments/{id}`, `DELETE /crm/segments/{id}`
- [ ] Segment definition supports AND/OR/NOT logic with conditions on standard fields, tags, scores, pipeline stage, activity recency
- [ ] `SegmentService` evaluates membership on-the-fly (or returns cached `segment_evaluations` if < 10 min old)
- [ ] Integration test: segment with multi-condition AND rule returns correct contacts
- [ ] UI: `SegmentBuilder` component allows adding/removing conditions with field/operator/value selectors
- [ ] UI: segments can be used as filters in CRM list views
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- ML-based predictive segments (Phase 10)
- Cross-context segments (non-CRM data, e.g. finance)
- Real-time WebSocket segment evaluation push

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `DELETE /crm/segments/{id}` must be soft delete only — never hard delete
- `pnpm --filter @workspace/db run push` requires explicit user approval

**Output Artifacts**
- Code changes in: `lib/db/src/schema/crm-segments.ts`, `lib/db/src/repositories/crm-segments.ts`, `artifacts/api-server/src/services/crm/segment-service.ts`, `artifacts/api-server/src/routes/crm/segments.ts`, `lib/api-spec/openapi.yaml`, `artifacts/apex-os/src/components/crm/SegmentBuilder.tsx`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/crm/segments.test.ts`
- Documentation: [N/A]
- Migration files: `lib/db/src/migrations/` (via `drizzle-kit`)

**Rollback**
- Granularity: migration-level — revert migration file; drop `segments` table manually if pushed
- Halt condition: if `pnpm --filter @workspace/db run push` fails or `pnpm run typecheck` fails, stop and fix before proceeding

**Rules to Follow**
- Segment evaluation must always be org-scoped (`WHERE organization_id = $orgId`)
- JSONB rule tree must be validated by Zod at the API boundary before storing
- Evaluation result must always return paginated member IDs, not full contact objects
- `SegmentBuilder` UI is a pure controlled component — no data fetching inside it

**Verification**
```bash
pnpm --filter @workspace/db run push   # requires user approval
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server test -- segments.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- PostgreSQL JSONB `@>` containment operator for tag-based conditions
- Segment evaluation as a domain service method — takes `rules` JSON + `orgId`, returns `Set<contactId>`
- `segment_evaluations` cache table: `(segment_id, evaluated_at, member_count)` — skip re-evaluation if < 10 min old

**Anti-Patterns**
- Storing member IDs in the `segments` row — stale data; evaluate dynamically
- Evaluating segments without org scoping — data leakage
- Deeply nested JSONB writes without Zod validation — malformed rule trees stored

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Segment` is an aggregate in the CRM bounded context; `SegmentEvaluationService` is a domain service that applies rule trees to contact collections
- TDD: Write integration test verifying multi-condition AND rule returns correct contacts before implementing evaluation logic
- BDD: "As a marketer, I can create a segment of contacts who opened an email in the last 30 days and have a lead score > 70"
- Deep Module: `SegmentService.evaluate(segmentId, orgId)` hides JSONB parsing, condition dispatch, caching, and pagination behind one method

---

### Subtasks

- [ ] CRM‑SEG‑001.0.25 (AGENT): Read this task, existing CRM schema files, `lib/api-spec/openapi.yaml` structure, and `SegmentBuilder` UI sketches in full.  
  *No action — pause until fully understood.*

- [ ] CRM‑SEG‑001.0.5 (AGENT): Research PostgreSQL JSONB query operators for rule-tree evaluation (May 2026). Confirm whether `@>` containment or `->>`/`#>>` path extraction is more appropriate for condition dispatch.  
  *Document findings briefly or note "no changes."*

- [ ] CRM‑SEG‑001.0.75 (AGENT): Reason about whether to evaluate segments synchronously or via a background worker. Default: synchronous for < 10,000 contacts per org; add `segment_evaluations` cache to skip re-evaluation within 10 minutes.  
  *If uncertain, ask the user before executing.*

- [ ] CRM‑SEG‑001.1 (AGENT): Define `segments` and `segment_evaluations` Drizzle schema.  
  **File(s):** `lib/db/src/schema/crm-segments.ts`  
  **Verification:** Schema compiles; `pnpm run typecheck` clean.

- [ ] CRM‑SEG‑001.2 (HUMAN): Approve and run `pnpm --filter @workspace/db run push`.  
  **Verification:** Migration applied; tables visible in DB.

- [ ] CRM‑SEG‑001.3 (AGENT): Add segment endpoints to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen succeeds; generated types available.

- [ ] CRM‑SEG‑001.4 (AGENT): Write integration tests for segment CRUD and evaluation (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/crm/segments.test.ts`  
  **Verification:** Tests compile and fail (no routes).

- [ ] CRM‑SEG‑001.5 (AGENT): Implement `SegmentRepository` and `SegmentService` with evaluation.  
  **File(s):** `lib/db/src/repositories/crm-segments.ts`, `artifacts/api-server/src/services/crm/segment-service.ts`  
  **Verification:** Unit tests with mocked DB pass.

- [ ] CRM‑SEG‑001.6 (AGENT): Create segments routes; mount in CRM router.  
  **File(s):** `artifacts/api-server/src/routes/crm/segments.ts`  
  **Verification:** Integration tests turn green.

- [ ] CRM‑SEG‑001.7 (AGENT): Build `SegmentBuilder` React component with rule editor UI.  
  **File(s):** `artifacts/apex-os/src/components/crm/SegmentBuilder.tsx`  
  **Verification:** Component renders; `pnpm run typecheck` clean.

- [ ] CRM‑SEG‑001.8 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

### [ ] CRM‑SEG‑002: Segment-based Automation Triggers
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No segment-based automation triggers exist. `ContactEnteredSegment` and `ContactExitedSegment` domain events are not defined. The automation rules engine (AUTO‑CRM‑001) has no way to consume segment membership changes as triggers.  
**Size:** Medium  

**Description:** Emit `ContactEnteredSegment` and `ContactExitedSegment` domain events whenever segment evaluation detects membership changes, and wire the automation rules engine to consume these events as workflow triggers.  

**Depends on:** CRM‑SEG‑001, AUTO‑CRM‑001 (automation rules engine)  
**Blocks:** [N/A — enables automation; automation engine is the consumer]
**Related Files:** `artifacts/api-server/src/services/crm/segment-service.ts`, `artifacts/api-server/src/events/crm/`, `artifacts/api-server/src/services/automation/automation-service.ts`  

**Imports / Exports**
- Imports: `SegmentService` from `crm/segment-service`; event bus interface; automation rule types from AUTO‑CRM‑001
- Exports: `ContactEnteredSegment` (event type), `ContactExitedSegment` (event type), `SegmentTriggerHandler` (class)

**Definition of Done**
- [ ] `ContactEnteredSegment` and `ContactExitedSegment` domain events defined with payload: `{ segmentId, contactId, organizationId, timestamp }`
- [ ] `SegmentService.evaluate()` compares new vs. previous member set; emits `ContactEnteredSegment` for new members, `ContactExitedSegment` for removed members
- [ ] Automation rules engine (AUTO‑CRM‑001) consumes these events via `SegmentTriggerHandler`
- [ ] Integration test: contact with score increased above 80 enters 'Hot Leads' segment → automation triggered → follow-up task created
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time WebSocket push for segment membership changes
- Email notifications on segment entry/exit (separate feature)
- Cross-context automation (non-CRM triggers)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Events must never contain PII beyond the minimum required (contactId, segmentId, orgId)

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/events/crm/segment-events.ts`, `artifacts/api-server/src/services/crm/segment-service.ts` (updated), `artifacts/api-server/src/services/automation/automation-service.ts` (updated)
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/crm/segment-triggers.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove `segment-events.ts`; revert `segment-service.ts` and `automation-service.ts` changes; no DB state changes
- Halt condition: if `pnpm run typecheck` fails or integration test fails, stop and fix before proceeding

**Rules to Follow**
- Events must be emitted AFTER the evaluation transaction commits — never inside the transaction
- `SegmentTriggerHandler` must be idempotent — duplicate events must not trigger duplicate workflows
- All event payloads must include `organizationId` for org scoping downstream

**Verification**
```bash
pnpm --filter @workspace/api-server test -- segment-triggers.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Set diff pattern: `new Set([...newMembers].filter(id => !prevMembers.has(id)))` for entry events; inverse for exit events
- Transactional outbox pattern: persist event intent to DB before emitting — ensures events are not lost on crash
- Idempotency key: `(segmentId, contactId, evaluatedAt)` — deduplicates re-emitted events

**Anti-Patterns**
- Emitting events inside the DB transaction — event may fire but transaction rolls back
- Missing idempotency check in `SegmentTriggerHandler` — duplicate automation workflows created
- Emitting events without `organizationId` — breaks org scoping in downstream handlers

**DDD / TDD / BDD / Deep Module notes**
- DDD: `ContactEnteredSegment` and `ContactExitedSegment` are domain events in the CRM bounded context; the automation engine is a subscriber in a different context
- TDD: Write integration test for the full flow (score change → segment entry → automation trigger) before implementing `SegmentTriggerHandler`
- BDD: "When a contact's score exceeds 80 and they enter the 'Hot Leads' segment, a follow-up task is automatically created and a sales rep assigned"
- Deep Module: `SegmentTriggerHandler` hides event deduplication, idempotency checking, and automation dispatch behind a single `handle(event)` method

---

### Subtasks

- [ ] CRM‑SEG‑002.0.25 (AGENT): Read this task, `CRM‑SEG‑001` (segment evaluation), `AUTO‑CRM‑001` (automation engine), and existing event bus implementation in full.  
  *No action — pause until fully understood.*

- [ ] CRM‑SEG‑002.0.5 (AGENT): Research event-driven segment trigger patterns and idempotency strategies for automation pipelines (May 2026). Confirm transactional outbox pattern is feasible with current DB setup.  
  *Document findings briefly or note "no changes."*

- [ ] CRM‑SEG‑002.0.75 (AGENT): Reason about idempotency key strategy. Default: `(segmentId, contactId, evaluation_window_start)` — prevents duplicate triggers within the same evaluation cycle.  
  *If uncertain, ask the user before executing.*

- [ ] CRM‑SEG‑002.1 (AGENT): Define `ContactEnteredSegment` and `ContactExitedSegment` event types.  
  **File(s):** `artifacts/api-server/src/events/crm/segment-events.ts`  
  **Verification:** Types compile; `pnpm run typecheck` clean.

- [ ] CRM‑SEG‑002.2 (AGENT): Update `SegmentService.evaluate()` to emit events for membership changes.  
  **File(s):** `artifacts/api-server/src/services/crm/segment-service.ts`  
  **Verification:** Unit test: mock previous member set; verify events emitted for diff.

- [ ] CRM‑SEG‑002.3 (AGENT): Implement `SegmentTriggerHandler` in automation service.  
  **File(s):** `artifacts/api-server/src/services/automation/automation-service.ts`  
  **Verification:** Integration test: score increase → segment entry → task created → all green.

- [ ] CRM‑SEG‑002.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
CRM‑SEG‑001 (segment builder: DB + API + UI)
  └─> CRM‑SEG‑002 (automation triggers: events + handler)
```

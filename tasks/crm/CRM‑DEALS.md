# tasks/crm/CRM‑DEALS.md – CRM Deals Context

This file contains all tasks related to CRM Deal management: database schema, API endpoints (CRUD, pipeline stage transitions, probability constraints), service layer, repository, integration tests, and frontend integration (pipeline view, interactive mutations). Deals represent potential revenue opportunities progressing through a sales pipeline.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schema

### [ ] DB‑CRM‑004: Define Deals Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No deals table. Deal pipeline tracking is blocked.
**Size:** Small

**Description:** Define the `deals` table – linked to a contact or company, with amount, probability, stage, and close date.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002` (contacts FK), `DB‑CRM‑003` (companies FK)
**Blocks:** Deal pipeline API, analytics, `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Related Files:** `lib/db/src/schema/crm/deals.ts`, `lib/db/src/__tests__/crm‑deals.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `contact_id` (uuid nullable FK → contacts), `company_id` (uuid nullable FK → companies), `amount_cents` (integer nullable), `probability` (integer 0‑100), `stage` (pgEnum: `prospecting|qualification|proposal|negotiation|closed_won|closed_lost`), `close_date` (date nullable), `assigned_to` (uuid nullable FK → users), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, stage)`, `(assigned_to, stage)`, `(contact_id)`, `(company_id)`
- [ ] Zod schemas exported; `probability` validated 0‑100; `amount_cents` non‑negative
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- All monetary amounts in cents (integer)
- `stage` transitions validated at service layer; no backward moves beyond defined pipeline

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑deals.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deal is an aggregate root in CRM. Stage and probability are domain value objects.

---

### Subtasks
- [ ] DB‑CRM‑004.0.25 (AGENT): Read DB‑ORG‑001, DB‑CRM‑002, DB‑CRM‑003. *No action – pause.*
- [ ] DB‑CRM‑004.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑deals.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑004.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – OpenAPI Spec & Tests

### [ ] API‑CRM‑014: Deals – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No deal endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add deal CRUD endpoints, pipeline stage enum, probability constraints, and close date fields to the OpenAPI spec.

**Depends on:** `crm/CRM‑DEALS.md → DB‑CRM‑004`, `crm/CRM‑LEADS.md → API‑CRM‑001` (pattern reference)
**Blocks:** `crm/CRM‑DEALS.md → API‑CRM‑015`, `API‑CRM‑016`, `API‑CRM‑017`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/crm/deals`, `POST`, `GET /{dealId}`, `PATCH /{dealId}`, `DELETE /{dealId}` all defined
- [ ] `DealStageEnum`: `prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`, `closed_lost`
- [ ] `probability` field: integer 0‑100, `amount_cents` as integer
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑014.0.25 (AGENT): Read DB‑CRM‑004 deals schema. *No action – pause.*
- [ ] API‑CRM‑014.1 (AGENT): Add `Deal` schema and all deal endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑014.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑015: Deals – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No deal integration tests.
**Size:** Medium

**Description:** Write deal integration tests covering pipeline stage transitions, probability constraints, close date, and auth (TDD red phase).

**Depends on:** `crm/CRM‑DEALS.md → API‑CRM‑014`
**Blocks:** `crm/CRM‑DEALS.md → API‑CRM‑017`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/deals.test.ts`

**Definition of Done**
- [ ] Tests: list (filtered by stage), create (201), invalid stage transition → 400, probability out of range → 400, get, update, soft delete, auth
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/deals.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑015.0.25 (AGENT): Read API‑CRM‑015 and generated deal schemas. *No action – pause.*
- [ ] API‑CRM‑015.1 (AGENT): Write all deal integration tests. **File(s):** `artifacts/api‑server/__tests__/api/crm/deals.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑CRM‑015.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

## Service, Repository & Routes

### [ ] API‑CRM‑016: Deals – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `DealRepository` or `DealService` exists.
**Size:** Large

**Description:** Implement `DealRepository` and `DealService` with pipeline stage machine, probability validation (0‑100), close date handling, and event emission using neverthrow Results.

**Depends on:** `crm/CRM‑DEALS.md → DB‑CRM‑004`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `crm/CRM‑DEALS.md → API‑CRM‑017`
**Related Files:** `lib/db/src/repositories/crm/deals.ts`, `artifacts/api‑server/src/services/crm/deal‑service.ts`

**Definition of Done**
- [ ] `DealRepository`: `findById`, `findByOrg` (paginated + stage‑filtered), `create`, `update`, `softDelete`
- [ ] `DealService`: `listDeals`, `getDeal`, `createDeal`, `updateDeal`, `deleteDeal`. All return `Result<T, DomainError>`.
- [ ] Pipeline stage machine: `prospecting → qualification → proposal → negotiation → closed_won/closed_lost`. No backward transitions.
- [ ] Probability validated: 0‑100 inclusive; defaults to stage‑appropriate value on creation
- [ ] `DealCreated`, `DealUpdated` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/deal‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deal pipeline stage machine is the central domain behaviour of the CRM deals aggregate.
- Deep Module: `DealService` hides stage machine, auto‑probability, and event emission.

---

### Subtasks
- [ ] API‑CRM‑016.0.25 (AGENT): Read DB‑CRM‑004, `LeadService` stage machine pattern. *No action – pause.*
- [ ] API‑CRM‑016.1 (AGENT): Implement `DealRepository`. **File(s):** `lib/db/src/repositories/crm/deals.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑016.2 (AGENT): Implement `DealService` with stage machine and auto‑probability. **File(s):** `artifacts/api‑server/src/services/crm/deal‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑016.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/crm/__tests__/deal‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑016.4 (HUMAN): Review stage machine and auto‑probability. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑017: Deals – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No deal routes wired.
**Size:** Small

**Description:** Create deal route handlers, mount the router, and run integration tests to green.

**Depends on:** `crm/CRM‑DEALS.md → API‑CRM‑016`, `API‑CRM‑015`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑025`, `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Related Files:** `artifacts/api‑server/src/routes/crm/deals.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 5 CRUD handlers; `InvalidStageTransition` → 400; `DealNotFound` → 404
- [ ] `pnpm test -- deals.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/deals.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑017.0.25 (AGENT): Read `routes/crm/contacts.ts` or `leads.ts` as pattern. *No action – pause.*
- [ ] API‑CRM‑017.1 (AGENT): Implement deals router and mount. **File(s):** `artifacts/api‑server/src/routes/crm/deals.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑017.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑017.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Frontend Integration

### [ ] FRONT‑CRM‑003: CRM Deals & Activities – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Deal pipeline and activity timeline use mock data. No `useDealList` or `useActivityList` hooks exist.
**Size:** Small

**Description:** Create `useDealList` and `useActivityList` hooks; replace mock data in the deals pipeline and activity timeline views. Deal stage changes call `useUpdateDeal` mutation with optimistic updates.

**Depends on:** `crm/CRM‑DEALS.md → API‑CRM‑017`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑021`, `crm/CRM‑LEADS.md → FRONT‑CRM‑001`
**Blocks:** `crm/CRM‑LEADS.md → FRONT‑INT‑CRM`
**Related Files:** `artifacts/apex‑os/src/pages/CRM.tsx`, `artifacts/apex‑os/src/hooks/crm/useDealList.ts`, `useActivityList.ts`

**Definition of Done**
- [ ] `useDealList` and `useActivityList` hooks created
- [ ] Deal pipeline view shows deals grouped by stage; stage‑change dropdown calls `useUpdateDeal` mutation with optimistic update
- [ ] Activity timeline shows chronological activity list with type icons and timestamps
- [ ] All mock data imports removed
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Activity creation form (`FRONT‑INT‑CRM`)
- Deal‑to‑project conversion (Phase 6+)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- crm‑deals.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deals are aggregate roots; Activities are domain events logged against any CRM entity.
- TDD: MSW returns deals in two stages; assert pipeline renders them correctly; simulate stage dropdown change → assert mutation called.
- BDD: “As a firm user, I can see deals in their pipeline stage and move them to a new stage.”

---

### Subtasks
- [ ] FRONT‑CRM‑003.1 (AGENT): Create `useDealList`, `useActivityList`, and `useUpdateDeal` hooks. **File(s):** `artifacts/apex‑os/src/hooks/crm/useDealList.ts`, `useActivityList.ts`, `useUpdateDeal.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑003.2 (AGENT): Replace mock data; wire deal stage dropdown and activity timeline. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- crm‑deals.test.tsx` → GREEN.
- [ ] FRONT‑CRM‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Deal Workspace (Phase 5)

### [ ] FRONT‑CRM‑014: Deal Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Deal workspace exists. `API‑CRM‑026` endpoints are not wired.
**Size:** Medium

**Description:** Implement deal workspace with pipeline stage, linked contacts, next steps, documents, proposal/engagement actions, and forecast metadata. Stage progression bar with current stage highlighted.

**Depends on:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`, `crm/CRM‑DEALS.md → FRONT‑CRM‑003`, `crm/CRM‑LEADS.md → FRONT‑CRM‑010`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/DealWorkspace.tsx`, `artifacts/apex‑os/src/hooks/crm/useDealWorkspace.ts`

**Definition of Done**
- [ ] Full‑page workspace with tabbed navigation and stage progression bar
- [ ] Overview, Contacts, Activities, Documents, Engagements tabs
- [ ] Stage progression bar showing current stage with transition options
- [ ] Quick actions: create proposal, schedule meeting, add task, upload document
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- DealWorkspace.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deal Workspace provides a comprehensive view of the Deal aggregate.
- TDD: MSW returns deal data → assert all tabs render; test stage transitions → assert proper validation.
- BDD: “As a firm user, I can view a comprehensive 360° view of a deal including stage progression, contacts, activities, and documents.”

---

### Subtasks
- [ ] FRONT‑CRM‑014.0.25 (AGENT): Research deal workspace patterns and pipeline management best practices. *No action – pause.*
- [ ] FRONT‑CRM‑014.1 (AGENT): Create `useDealWorkspace` hook with stage management and tabbed data loading. **File(s):** `artifacts/apex‑os/src/hooks/crm/useDealWorkspace.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑014.2 (AGENT): Implement `DealWorkspace` component with stage progression bar. **File(s):** `artifacts/apex‑os/src/components/crm/DealWorkspace.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑014.3 (AGENT): Implement individual tabs: Overview, Contacts, Activities, Documents, Engagements. **File(s):** `artifacts/apex‑os/src/components/crm/DealWorkspace.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑014.4 (AGENT): Add stage progression management and quick actions. **File(s):** `artifacts/apex‑os/src/components/crm/DealWorkspace.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑014.5 (AGENT): Write component tests with MSW. **File(s):** `artifacts/apex‑os/src/components/crm/__tests__/DealWorkspace.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑CRM‑014.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
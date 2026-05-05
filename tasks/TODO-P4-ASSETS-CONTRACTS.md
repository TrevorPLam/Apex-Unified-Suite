# TODO-P4-ASSETS-CONTRACTS.md – Phase 4: Asset Contracts & Licenses

This file covers the contracts and licenses management module for assets: tracking renewal dates, costs, linked documents, vendor relationships, and contract expiration alerts.

---

### [ ] ASSETS‑CON‑001: Contracts & Licenses Table & API
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No `contracts` or `contract_history` tables exist. No contract CRUD API exists. Asset detail views have no contract linkage. Contract lifecycle management is entirely absent.  
**Size:** Large  

**Description:** Build the full contract lifecycle module: DB schema with status state machine (`draft → active → expired → renewed`), CRUD + renewal API, asset linking, contract expiration alert integration, and audit history.  

**Depends on:** DB‑ASSETS‑001 (assets table); ASSETS‑ALERT‑001 (contract expiration alerts, optional integration)  
**Blocks:** [N/A — standalone contract module]
**Related Files:** `lib/db/src/schema/contracts.ts`, `lib/db/src/repositories/assets/contracts.ts`, `artifacts/api-server/src/services/assets/contract-service.ts`, `artifacts/api-server/src/routes/assets/contracts.ts`, `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: Drizzle `pgTable`, `uuid`, `text`, `date`, `integer`, `jsonb`, `pgEnum`, `timestamp`; `BaseRepository`; `AlertService` (optional, for expiration alert creation)
- Exports: `contractsTable`, `contractHistoryTable` (schema); `ContractRepository` (class); `ContractService` (class); `contractsRouter` (Express Router); `ContractStatus` (enum)

**Definition of Done**
- [ ] DB: `lib/db/src/schema/contracts.ts` defines `contracts` table with `renewal_terms: jsonb`, `status` enum (`draft`, `active`, `expired`, `terminated`, `renewed`), `asset_id` (nullable), `vendor_id` (nullable), `document_id` (nullable), and `contract_history` audit table
- [ ] DB: `pnpm --filter @workspace/db run push` succeeds (with user approval)
- [ ] Indexes: `(organization_id, status)`, `(asset_id)`, `(vendor_id)`, `(end_date, status)`
- [ ] OpenAPI: `contracts` tag with `GET /contracts`, `POST /contracts`, `GET /contracts/{id}`, `PATCH /contracts/{id}`, `DELETE /contracts/{id}`, `POST /contracts/{id}/renew`, `POST /contracts/{id}/link-asset`, `POST /contracts/{id}/unlink-asset`, `GET /assets/{assetId}/contracts`
- [ ] `ContractService` enforces status machine transitions; invalid transitions return `InvalidStatusTransition` error
- [ ] `POST /contracts/{id}/renew` creates new contract record, sets old to `renewed`, logs both in `contract_history`
- [ ] Asset detail view can list linked contracts (via `GET /assets/{assetId}/contracts`)
- [ ] Expiring contracts (< 30 days to `end_date`) automatically generate an `asset_alerts` entry of type `contract_expiration` (if `ASSETS‑ALERT‑001` is complete)
- [ ] All service methods return `Result<T, DomainError>`
- [ ] Integration tests cover CRUD, status transitions, renewal, and asset linking
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Document storage for contracts (linked via `document_id`; storage is STORAGE‑001's scope)
- Vendor management CRUD (vendor referenced by ID only)
- Multi-asset contract linking (one contract → one asset for Phase 4)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `DELETE /contracts/{id}` must set `status = 'terminated'` with `termination_reason` — never hard delete
- `pnpm --filter @workspace/db run push` requires explicit user approval

**Output Artifacts**
- Code changes in: `lib/db/src/schema/contracts.ts`, `lib/db/src/repositories/assets/contracts.ts`, `artifacts/api-server/src/services/assets/contract-service.ts`, `artifacts/api-server/src/routes/assets/contracts.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/assets/contracts.test.ts`
- Documentation: [N/A]
- Migration files: `lib/db/src/migrations/` (via `drizzle-kit`)

**Rollback**
- Granularity: migration-level — revert migration file; drop `contracts`, `contract_history` tables manually if pushed
- Halt condition: if `pnpm --filter @workspace/db run push` fails or status machine tests fail, stop and fix before proceeding

**Rules to Follow**
- Status machine transitions must be validated in `ContractService` before any DB write
- All contract queries must include `WHERE organization_id = $orgId`
- `renewal_terms` JSONB must be validated by Zod schema at the API boundary
- `contract_history` must record every status change with `(action, action_by, action_details, created_at)`

**Verification**
```bash
pnpm --filter @workspace/db run push   # requires user approval
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server test -- contracts.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Status machine as a `const` object: `ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]>`
- `db.transaction()` for renewal: deactivate old → create new → log history — all atomic
- JSONB `renewal_terms` validated with Zod `z.object({ auto_renew: z.boolean(), notice_period_days: z.number(), ... })`

**Anti-Patterns**
- Missing status transition validation — allows invalid state transitions (e.g. `expired → draft`)
- No audit trail in `contract_history` — impossible to reconstruct contract lifecycle
- Hard-coded renewal logic — must use `renewal_terms` JSONB for flexibility
- Hard delete on termination — destroys audit trail

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Contract` is an aggregate in the Asset bounded context; `ContractStatus` is a value object enforcing the state machine
- TDD: Write integration test for invalid status transition (e.g. `terminated → active`) before implementing the service
- BDD: "From an asset's page, I can see the maintenance contract that covers it and open the linked contract document"
- Deep Module: `ContractService` hides status machine validation, renewal workflow, history logging, and alert generation behind six methods

---

### Subtasks

- [ ] ASSETS‑CON‑001.0.25 (AGENT): Read this task, `DB‑ASSETS‑001` asset schema, `ASSETS‑ALERT‑001`, and `lib/api-spec/openapi.yaml` structure in full.  
  *No action — pause until fully understood.*

- [ ] ASSETS‑CON‑001.0.5 (AGENT): Research Drizzle ORM `pgEnum` usage and `db.transaction()` patterns for multi-step renewal workflows (May 2026). Confirm JSONB Zod validation approach.  
  *Document findings briefly or note "no changes."*

- [ ] ASSETS‑CON‑001.0.75 (AGENT): Reason about the status machine transition map. Default: `{ draft: ['active'], active: ['expired', 'terminated', 'renewed'], expired: ['renewed', 'terminated'], renewed: [], terminated: [] }`.  
  *If uncertain, use that map.*

- [ ] ASSETS‑CON‑001.1 (AGENT): Define `contracts` and `contract_history` Drizzle schema with indexes.  
  **File(s):** `lib/db/src/schema/contracts.ts`  
  **Verification:** Schema compiles; `pnpm run typecheck` clean.

- [ ] ASSETS‑CON‑001.2 (HUMAN): Approve and run `pnpm --filter @workspace/db run push`.  
  **Verification:** Migration applied; tables visible in DB.

- [ ] ASSETS‑CON‑001.3 (AGENT): Add contract endpoints to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen succeeds; generated types available.

- [ ] ASSETS‑CON‑001.4 (AGENT): Implement `ContractRepository` with status filtering and audit history.  
  **File(s):** `lib/db/src/repositories/assets/contracts.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] ASSETS‑CON‑001.5 (AGENT): Implement `ContractService` with status machine, renewal workflow, and alert integration.  
  **File(s):** `artifacts/api-server/src/services/assets/contract-service.ts`  
  **Verification:** Unit tests for all status transitions (valid + invalid) pass.

- [ ] ASSETS‑CON‑001.6 (AGENT): Create contract routes with Zod validation; mount in assets router.  
  **File(s):** `artifacts/api-server/src/routes/assets/contracts.ts`  
  **Verification:** Routes compile; `pnpm run typecheck` clean.

- [ ] ASSETS‑CON‑001.7 (AGENT): Write integration tests for full contract workflow (CRUD, linking, renewal, expiration alert).  
  **File(s):** `artifacts/api-server/src/__tests__/api/assets/contracts.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- contracts.test.ts` → all green.

- [ ] ASSETS‑CON‑001.8 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

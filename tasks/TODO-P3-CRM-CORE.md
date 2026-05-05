# TODO-P3-CRM-CORE.md – Phase 3: CRM Core API

## Tasks in this file
- API-CRM-001: Leads – Expand OpenAPI Spec
- API-CRM-002: Leads – Integration Tests (TDD Red)
- API-CRM-003: Leads – Service & Repository (Deep Module)
- API-CRM-004: Leads – Routes & Validation
- API-CRM-005: Leads – Run Integration Tests to Green
- API-CRM-006: Contacts – Expand OpenAPI Spec
- API-CRM-007: Contacts – Integration Tests (Red)
- API-CRM-008: Contacts – Service & Repository
- API-CRM-009: Contacts – Routes & Green Tests
- API-CRM-010: Companies – Expand OpenAPI Spec
- API-CRM-011: Companies – Integration Tests (Red)
- API-CRM-012: Companies – Service & Repository
- API-CRM-013: Companies – Routes & Green Tests
- API-CRM-014: Deals – Expand OpenAPI Spec
- API-CRM-015: Deals – Integration Tests (Red)
- API-CRM-016: Deals – Service & Repository
- API-CRM-017: Deals – Routes & Green Tests
- API-CRM-018: Activities – Expand OpenAPI Spec
- API-CRM-019: Activities – Integration Tests
- API-CRM-020: Activities – Service & Repository
- API-CRM-021: Activities – Routes & Green Tests
- API-CRM-036: Site & Event Tracking API

---

## [ ] API-CRM-001: Leads – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `lib/api-spec/openapi.yaml` has placeholder or no lead endpoints defined. No Zod schemas or React Query hooks exist for leads.
**Size:** Small

**Description:** Add all lead CRUD endpoints, request/response schemas, and enums to the OpenAPI spec — which drives codegen for Zod validation and React Query hooks.

**Depends on:** API-SPEC-001 (OpenAPI spec baseline), DB-CRM-001 (leads schema defined).
**Blocks:** API-CRM-002, API-CRM-003, API-CRM-004, API-CRM-005.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`

**Imports / Exports**
- Imports: [N/A] — spec file only
- Exports: `LeadSchema`, `CreateLeadSchema`, `UpdateLeadSchema`, `LeadListSchema`, `LeadStageEnum` (Zod, via codegen); `useListLeads`, `useGetLead`, `useCreateLead`, `useUpdateLead`, `useDeleteLead` hooks (React Query, via codegen)

**Definition of Done**
- [ ] `GET /api/v1/crm/leads` endpoint defined with query params: `page`, `limit`, `stage`, `assignedTo`, `search`, `includeDeleted`.
- [ ] `POST /api/v1/crm/leads` endpoint defined with `CreateLeadRequestBody` schema.
- [ ] `GET /api/v1/crm/leads/{leadId}` defined.
- [ ] `PATCH /api/v1/crm/leads/{leadId}` defined with `UpdateLeadRequestBody` schema.
- [ ] `DELETE /api/v1/crm/leads/{leadId}` defined (soft delete, returns 204).
- [ ] `LeadStageEnum` defined: `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`.
- [ ] `pnpm --filter @workspace/api-spec run codegen` completes without errors.
- [ ] Generated files updated in `lib/api-zod/src/generated/` and `lib/api-client-react/src/generated/`.

**Out of Scope**
- Lead conversion endpoint (API-CRM-022)
- Duplicate detection endpoints (API-CRM-023)
- Bulk operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/` (these are outputs of codegen)
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `lib/api-spec/openapi.yaml` to previous commit.
- Halt condition: `pnpm codegen` fails with schema validation error — fix spec before proceeding.

**Rules to Follow**
- API-first: spec changes must precede any service or route implementation.
- All fields must include `description` and `example` in the OpenAPI schema.
- Pagination envelope standard: `{ data: Lead[], meta: { page, limit, total, totalPages } }`.
- Stage transitions documented in the spec description for `PATCH /leads/{leadId}`.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- Use `$ref` for reusable `Lead` schema across endpoints (avoid duplication).
- Separate `CreateLeadRequestBody` from `UpdateLeadRequestBody` schemas (different required fields).
- `LeadStageEnum` defined as a standalone `#/components/schemas/LeadStage` for reuse in filtering params.

**Anti-Patterns**
- Modifying generated files directly (breaks on next codegen run).
- Missing `example` values in schema properties (Orval codegen may produce weaker types).
- Using `any` type in spec (defeats type safety).

**DDD / TDD / BDD / Deep Module notes**
- DDD: The OpenAPI spec is the contract for the CRM bounded context. Lead stage enum defines the domain vocabulary.
- TDD: Spec change is the first step; tests (API-CRM-002) come next and depend on generated schemas.
- BDD: [N/A] — spec authoring, not a user-facing behaviour.
- Deep Module: The spec defines the narrow interface (endpoints/schemas) that hides the deep implementation (service, repository, DB).

---

### Subtasks
- [ ] API-CRM-001.0.25 (AGENT): Read the current `openapi.yaml`, existing lead schema (if any), and DB-CRM-001 schema.
  *No action — pause until fully understood.*

- [ ] API-CRM-001.0.5 (AGENT): Research OpenAPI 3.1 best practices for CRM entity spec authoring (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-001.0.75 (AGENT): Confirm required vs optional fields for `CreateLeadRequestBody` with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-001.1 (AGENT): Add `Lead` schema and all lead endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** YAML is valid (no parse errors)

- [ ] API-CRM-001.2 (AGENT): Run codegen and verify generated output.
  **File(s):** `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`
  **Verification:** `pnpm --filter @workspace/api-spec run codegen` exits 0 ; `pnpm typecheck`

- [ ] API-CRM-001.3 (HUMAN): Review spec additions and sign off.
  **Verification:** Approved; all endpoints and schemas correct.

---

## [ ] API-CRM-002: Leads – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No integration tests for leads exist. Test file may not exist yet.
**Size:** Medium

**Description:** Write a comprehensive integration test suite for all lead endpoints using the generated Zod schemas for request/response validation — all tests must fail (red) before implementation.

**Depends on:** API-CRM-001 (spec + generated schemas), DB-CRM-001 (schema + test DB seeding).
**Blocks:** API-CRM-005 (green phase requires red tests first).
**Related Files:** `artifacts/api-server/__tests__/api/crm/leads.test.ts`, `lib/api-zod/src/generated/`

**Imports / Exports**
- Imports: test DB client, generated `CreateLeadSchema`, `UpdateLeadSchema`, `LeadSchema` (lib/api-zod), auth test helper (JWT token factory)
- Exports: test suite in `leads.test.ts`

**Definition of Done**
- [ ] Tests for `GET /crm/leads`: returns 200 with paginated envelope, filtered by `stage`, `search`, and `assignedTo`.
- [ ] Tests for `POST /crm/leads`: 201 on valid data; 400 on missing required fields; 400 on invalid stage.
- [ ] Tests for `GET /crm/leads/{id}`: 200 on existing; 404 on unknown ID; 401 without auth.
- [ ] Tests for `PATCH /crm/leads/{id}`: 200 on valid update; 400 on invalid stage transition; 404 on unknown ID.
- [ ] Tests for `DELETE /crm/leads/{id}`: 204; subsequent GET returns 404 (or 200 with `deleted_at` if `includeDeleted=true`).
- [ ] All tests currently fail (endpoints return 404 — routes not yet implemented).
- [ ] `pnpm typecheck` passes on the test file.

**Out of Scope**
- Performance tests
- Conversion endpoint tests (API-CRM-022)
- Duplicate detection tests (API-CRM-023)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/leads.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `leads.test.ts` if tests cannot be written without spec errors.
- Halt condition: test file fails to compile (TypeScript error) — fix generated schema import before proceeding.

**Rules to Follow**
- Use generated `LeadSchema.parse(response.body)` to validate response shape — not manual property checks.
- Each test must have `beforeEach` cleanup to reset seeded data.
- Auth test helper must produce a valid JWT with `organizationId` and `userId` claims.
- Test IDs must be deterministic (use seeded UUIDs, not random generation).

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/leads.test.ts
# Expected: all tests FAIL (red phase)
pnpm typecheck
```

**Advanced Code Patterns**
- Supertest + vitest integration: `const app = createTestApp(); const res = await request(app).get('/api/v1/crm/leads').set('Authorization', `Bearer ${token}`)`.
- Schema validation assertion: `expect(() => LeadSchema.parse(res.body.data[0])).not.toThrow()`.
- Seeded test data: `beforeAll` inserts 3 leads in different stages; `afterAll` cleans up.

**Anti-Patterns**
- Testing implementation details (internal service method calls) instead of API contract.
- Using `any` type in test assertions (defeats validation purpose).
- Shared mutable state between tests (always clean up in `afterEach`).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Integration tests validate the API contract (the bounded context's external interface), not internal domain logic.
- TDD: Red phase — all tests MUST fail before any route/service code is written. Do not "fix" them.
- BDD: Scenarios translate to test cases. Each `it()` corresponds to a Gherkin "Given / When / Then."
- Deep Module: Tests exercise only the public endpoint surface; service and repository internals are opaque.

---

### Subtasks
- [ ] API-CRM-002.0.25 (AGENT): Read API-CRM-002, the generated lead schemas from API-CRM-001, and the test infrastructure setup.
  *No action — pause until fully understood.*

- [ ] API-CRM-002.0.5 (AGENT): Review test utilities (auth token factory, DB seeding helpers) available in the test suite (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-002.0.75 (AGENT): Confirm test database seeding strategy (transaction rollback vs truncate-and-reseed) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-002.1 (AGENT): Write all lead integration tests — CRUD, auth, validation, soft delete.
  **File(s):** `artifacts/api-server/__tests__/api/crm/leads.test.ts`
  **Verification:** `pnpm test -- leads.test.ts` — all fail (red) ; `pnpm typecheck`

- [ ] API-CRM-002.2 (HUMAN): Review test coverage completeness and confirm red phase.
  **Verification:** Approved; all tests failing; coverage scope confirmed.

---

## [ ] API-CRM-003: Leads – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `LeadRepository` or `LeadService` implementation exists. DB schema exists (DB-CRM-001) but no query logic.
**Size:** Large

**Description:** Implement the `LeadRepository` (all DB queries) and `LeadService` (business logic, stage machine validation, event emission) following the Deep Module pattern — wide, rich implementation behind a narrow, stable interface.

**Depends on:** DB-CRM-001 (leads schema), DB-CRM-002 (lead_activities schema), EVENT-001 (domain event bus), ERROR-002 (DomainError types).
**Blocks:** API-CRM-004 (routes use LeadService), API-CRM-005 (green tests call routes using LeadService).
**Related Files:** `lib/db/src/repositories/crm/leads.ts`, `artifacts/api-server/src/services/crm/lead-service.ts`

**Imports / Exports**
- Imports: `db` pool (lib/db), Drizzle `leads` table schema, `DomainEventBus` (EVENT-001), `DomainError` (ERROR-002), `neverthrow` (`ok`, `err`, `Result`)
- Exports: `LeadRepository` class, `LeadService` class

**Definition of Done**
- [ ] `LeadRepository` implements: `findById`, `findByOrg` (paginated + filtered), `create`, `update`, `softDelete`, `findByEmail`, `findIncludingDeleted`.
- [ ] `LeadService` implements: `listLeads`, `getLead`, `createLead`, `updateLead`, `deleteLead`. All return `Result<T, DomainError>`.
- [ ] Stage machine enforced in `updateLead`: valid transitions `new → contacted → qualified → proposal → won/lost`. Invalid transition returns `err(InvalidStageTransition)`.
- [ ] Soft delete: `deleteLead` sets `deleted_at = now()` and returns `ok(void)`.
- [ ] `LeadCreated` and `LeadUpdated` domain events emitted after writes.
- [ ] Unit tests for service (mocked repository) cover: list, get, create, valid stage transition, invalid stage transition, delete.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Lead conversion logic (API-CRM-022)
- Duplicate detection (API-CRM-023)
- Bulk operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never hard-delete leads — always soft-delete

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/crm/leads.ts`, `artifacts/api-server/src/services/crm/lead-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/lead-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove `repositories/crm/leads.ts` and `services/crm/lead-service.ts`.
- Halt condition: `pnpm typecheck` failure in service or repository stops all changes.

**Rules to Follow**
- Stage machine: `VALID_TRANSITIONS: Record<LeadStage, LeadStage[]> = { new: ['contacted'], contacted: ['qualified', 'lost'], qualified: ['proposal', 'lost'], proposal: ['won', 'lost'], won: [], lost: [] }`.
- All service methods return `Result<T, DomainError>` — no `throw`.
- Repository queries always include `AND organization_id = $orgId` predicate.
- Soft-deleted leads excluded by default from all list/findById queries unless `includeDeleted: true` is passed.
- Pagination default: `limit=20`, max `limit=100`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/lead-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- `neverthrow` Result: `return ok(lead)` on success, `return err(new LeadNotFound(leadId))` on not-found.
- Stage machine guard: `if (!VALID_TRANSITIONS[current.stage].includes(dto.stage)) return err(new InvalidStageTransition(current.stage, dto.stage))`.
- Paginated query: `db.select().from(leads).where(and(eq(leads.organizationId, orgId), isNull(leads.deletedAt))).limit(limit).offset((page-1)*limit)`.
- Count query for pagination: `db.select({ count: sql<number>`count(*)` }).from(leads).where(...)`.

**Anti-Patterns**
- Throwing errors instead of returning `Result` (breaks the neverthrow contract).
- Missing `organizationId` predicate (cross-tenant data leak).
- Hard-deleting leads (loses data for reporting and audit).
- Service embedding SQL — all SQL lives in the repository.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `LeadService` is the application service orchestrating the Lead aggregate. Stage transitions are domain rules, not validation rules.
- TDD: Unit tests for `LeadService` with mocked `LeadRepository`. Red → Green → Refactor.
- BDD: "When a lead moves from 'contacted' to 'lost', the stage_change activity is logged and the LeadUpdated event is emitted."
- Deep Module: `LeadService` hides repository, stage machine, event emission, and soft-delete behind 5 clean methods.

---

### Subtasks
- [ ] API-CRM-003.0.25 (AGENT): Read DB-CRM-001 schema, EVENT-001 event bus API, ERROR-002 DomainError types, and neverthrow documentation.
  *No action — pause until fully understood.*

- [ ] API-CRM-003.0.5 (AGENT): Research neverthrow Result patterns, Drizzle ORM query builders, and soft-delete query patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-003.0.75 (AGENT): Confirm all valid stage transitions with user. Is `won → lost` a valid re-open? (Likely no.)
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-003.1 (AGENT): Implement `LeadRepository` with all query methods.
  **File(s):** `lib/db/src/repositories/crm/leads.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-003.2 (AGENT): Implement `LeadService` with stage machine, neverthrow Results, and event emission.
  **File(s):** `artifacts/api-server/src/services/crm/lead-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-003.3 (AGENT): Write unit tests for `LeadService` (mocked repository).
  **File(s):** `artifacts/api-server/src/services/crm/__tests__/lead-service.test.ts`
  **Verification:** `pnpm test -- lead-service.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-003.4 (HUMAN): Review stage machine, Result types, and event emission. Sign off.
  **Verification:** Approved; no throws; stage machine validated; all tests green.

---

## [ ] API-CRM-004: Leads – Routes & Validation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No lead routes defined. `artifacts/api-server/src/routes/index.ts` does not mount a CRM lead router.
**Size:** Small

**Description:** Create Express route handlers for all lead endpoints, wiring auth middleware, Zod request validation (using generated schemas), and `LeadService` method calls — with proper HTTP status codes and error mapping.

**Depends on:** API-CRM-003 (LeadService ready), AUTH-008 (auth middleware), API-CRM-001 (generated schemas).
**Blocks:** API-CRM-005 (integration tests turn green only after routes are wired).
**Related Files:** `artifacts/api-server/src/routes/crm/leads.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `LeadService`, `CreateLeadSchema`, `UpdateLeadSchema` (lib/api-zod), `authMiddleware` (AUTH-008), Express `Router`
- Exports: `leadsRouter` mounted at `/api/v1/crm/leads` in `routes/index.ts`

**Definition of Done**
- [ ] `GET /api/v1/crm/leads` — list with pagination, validated query params.
- [ ] `POST /api/v1/crm/leads` — create; body validated with `CreateLeadSchema`; returns 201.
- [ ] `GET /api/v1/crm/leads/:leadId` — get by ID; maps `LeadNotFound` → 404.
- [ ] `PATCH /api/v1/crm/leads/:leadId` — update; maps `InvalidStageTransition` → 400.
- [ ] `DELETE /api/v1/crm/leads/:leadId` — soft delete; returns 204.
- [ ] All routes protected by `authMiddleware`.
- [ ] DomainError mapped to HTTP status via `mapDomainError(err, res)` utility.
- [ ] Router mounted in `routes/index.ts`.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Rate limiting (handled at middleware layer)
- Response caching

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/crm/leads.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove `routes/crm/leads.ts`; revert `routes/index.ts` mount.
- Halt condition: `pnpm typecheck` failure in route file stops all changes.

**Rules to Follow**
- Never call `throw` in route handlers — service returns `Result`, map it to HTTP response.
- `organizationId` always extracted from `req.user.organizationId` (from auth middleware), never from request body.
- Zod parse errors return 400 with `{ errors: ZodError.flatten() }` format.
- `LeadNotFound` → 404; `InvalidStageTransition` → 400; unknown error → 500.

**Verification**
```bash
pnpm typecheck
# Run integration tests (they should now start passing after API-CRM-005)
```

**Advanced Code Patterns**
- Result unwrap pattern: `const result = await leadService.getLead(id, orgId); if (result.isErr()) return mapDomainError(result.error, res); return res.json(result.value)`.
- Zod parse with error response: `const parsed = CreateLeadSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })`.

**Anti-Patterns**
- Extracting `organizationId` from request body (security flaw — must come from JWT).
- Using `try/catch` instead of Result pattern (breaks neverthrow contract).
- Returning 500 for domain validation errors (should be 400 or 422).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are the anti-corruption layer between HTTP protocol and the domain. They translate HTTP requests to domain service calls and map results back to HTTP.
- TDD: Routes do not have their own tests — they are exercised through the integration tests from API-CRM-002.
- BDD: [N/A] — route wiring, not user-facing behaviour.
- Deep Module: Route handlers are thin — all logic lives in `LeadService`.

---

### Subtasks
- [ ] API-CRM-004.0.25 (AGENT): Read `routes/index.ts`, `authMiddleware`, `mapDomainError` utility, and generated lead schemas.
  *No action — pause until fully understood.*

- [ ] API-CRM-004.0.5 (AGENT): Review Express 5 router patterns and error mapping conventions in the codebase (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-004.0.75 (AGENT): Confirm route prefix (`/api/v1/crm/leads`) and error-to-HTTP status mapping with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-004.1 (AGENT): Implement `leads.ts` router with all 5 CRUD route handlers.
  **File(s):** `artifacts/api-server/src/routes/crm/leads.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-004.2 (AGENT): Mount leadsRouter in `routes/index.ts`.
  **File(s):** `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck` ; server starts without errors

- [ ] API-CRM-004.3 (HUMAN): Review routes for auth enforcement and error mapping. Sign off.
  **Verification:** Approved; all routes auth-protected; error mapping correct.

---

## [ ] API-CRM-005: Leads – Run Integration Tests to Green
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Integration tests written (API-CRM-002) but failing (red). Routes wired (API-CRM-004) but tests not yet verified green.
**Size:** Medium

**Description:** Run the lead integration tests and fix any remaining failures — correcting implementation bugs, response format mismatches, or missing edge-case handling — until all tests pass.

**Depends on:** API-CRM-002 (tests written), API-CRM-003 (service+repo), API-CRM-004 (routes wired).
**Blocks:** API-CRM-022 (conversion), API-CRM-023 (duplicate detection), API-CRM-027 (activity ingestion).
**Related Files:** `artifacts/api-server/__tests__/api/crm/leads.test.ts`, all lead implementation files.

**Imports / Exports**
- Imports: [N/A] — debugging and fixing phase
- Exports: [N/A]

**Definition of Done**
- [ ] `pnpm test -- leads.test.ts` passes with 0 failures.
- [ ] No skipped tests.
- [ ] `pnpm typecheck` passes.
- [ ] Response shapes match the OpenAPI spec exactly.

**Out of Scope**
- Adding new tests (scope belongs to API-CRM-002)
- Changing test assertions to match wrong implementation (fix implementation, not tests)
- Conversion or duplicate endpoints

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A] or minimal fixes in implementation files
- Tests added/updated in: [N/A] (tests are not changed; implementation is fixed)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert specific method fixes if they break other tests.
- Halt condition: fixing one test breaks another — investigate shared state or DB cleanup issue.

**Rules to Follow**
- Never modify test assertions to make failing tests pass — fix the implementation.
- If a test reveals a spec defect, update the spec (API-CRM-001) and re-run codegen first.
- Each fix must be verified with `pnpm typecheck` before running tests.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/leads.test.ts
# Expected: 0 failures, 0 skipped
pnpm typecheck
```

**Advanced Code Patterns**
- Debug failing tests: add `console.log(res.body)` temporarily to see actual response vs expected.
- Pagination meta check: ensure `meta.total` reflects the correct count after seeding.

**Anti-Patterns**
- Modifying test assertions to match incorrect implementation.
- Skipping failing tests instead of fixing the root cause.
- Adding `any` casts to silence TypeScript errors instead of fixing types.

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — this is the TDD green phase.
- TDD: Green phase — make all failing tests pass without modifying test assertions.
- BDD: [N/A] — implementation verification, not user-facing behaviour.
- Deep Module: [N/A] — debugging and fixing, not design.

---

### Subtasks
- [ ] API-CRM-005.0.25 (AGENT): Run the integration tests and collect all failure messages.
  *No action until test output is fully read.*

- [ ] API-CRM-005.0.5 (AGENT): Analyse failures — categorise as: schema mismatch, missing field, wrong status code, auth error, DB seeding issue.
  *Document failure categories before fixing.*

- [ ] API-CRM-005.0.75 (AGENT): Plan fixes for each failure category. Confirm approach for any ambiguous cases with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-005.1 (AGENT): Fix schema/response format mismatches.
  **File(s):** As needed (`lead-service.ts`, `leads.ts` route, `openapi.yaml`)
  **Verification:** Re-run failing tests after each fix

- [ ] API-CRM-005.2 (AGENT): Fix auth, status code, and DB seeding issues.
  **File(s):** As needed
  **Verification:** `pnpm test -- leads.test.ts` — 0 failures ; `pnpm typecheck`

- [ ] API-CRM-005.3 (HUMAN): Final sign-off on green tests.
  **Verification:** Approved; 0 failures; `pnpm typecheck` clean.

---

## [ ] API-CRM-006: Contacts – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No contact endpoints defined in `openapi.yaml`.
**Size:** Small

**Description:** Add all contact CRUD endpoints, request/response schemas, and enums to the OpenAPI spec.

**Depends on:** API-SPEC-001 (spec baseline), DB-CRM-003 (contacts schema), API-CRM-001 (leads spec as pattern reference).
**Blocks:** API-CRM-007, API-CRM-008, API-CRM-009.
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-zod/src/generated/`, `lib/api-client-react/src/generated/`

**Imports / Exports**
- Imports: [N/A] — spec file only
- Exports: `ContactSchema`, `CreateContactSchema`, `UpdateContactSchema` (via codegen); `useListContacts`, `useGetContact`, `useCreateContact`, `useUpdateContact`, `useDeleteContact` hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/crm/contacts` with `page`, `limit`, `companyId`, `assignedTo`, `search`, `visibility` query params.
- [ ] `POST /api/v1/crm/contacts` with `CreateContactRequestBody` schema.
- [ ] `GET /api/v1/crm/contacts/{contactId}` defined.
- [ ] `PATCH /api/v1/crm/contacts/{contactId}` with `UpdateContactRequestBody`.
- [ ] `DELETE /api/v1/crm/contacts/{contactId}` (soft delete, 204).
- [ ] `email` field marked as unique-per-organisation in schema description.
- [ ] `visibility` enum: `public`, `team`, `private`.
- [ ] Codegen runs successfully.

**Out of Scope**
- Contact activity endpoints (API-CRM-018)
- Contact workspace endpoints (API-CRM-026)
- Contact merging (API-CRM-023)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: `pnpm codegen` fails — fix spec before proceeding.

**Rules to Follow**
- Use `$ref` to reuse the `Contact` schema across GET list and GET detail responses.
- Unique email constraint documented in field description (enforcement is in service layer).
- All fields have `description` and `example`.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- Reuse `$ref: '#/components/schemas/VisibilityEnum'` (also used for deals/companies).
- Separate `company_id` as an optional FK reference in `CreateContactRequestBody`.

**Anti-Patterns**
- Duplicating `Contact` schema definition for list vs. detail responses.
- Missing `visibility` enum definition (required for frontend filtering).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contacts are a core aggregate in the CRM bounded context. Email uniqueness per organisation is a domain invariant.
- TDD: Spec defines the contract; tests (API-CRM-007) use generated schemas to validate.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec is the narrow interface; service + repo is the deep implementation.

---

### Subtasks
- [ ] API-CRM-006.0.25 (AGENT): Read DB-CRM-003 contacts schema and `ContactSchema` if partially defined.
  *No action — pause until fully understood.*

- [ ] API-CRM-006.0.5 (AGENT): Review API-CRM-001 as spec pattern. Identify reusable enums (visibility, etc.).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-006.0.75 (AGENT): Confirm required fields for `CreateContactRequestBody` with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-006.1 (AGENT): Add `Contact` schema and all contact endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-006.2 (HUMAN): Review spec and sign off.
  **Verification:** Approved.

---

## [ ] API-CRM-007: Contacts – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No contact integration tests exist.
**Size:** Medium

**Description:** Write contact integration tests (TDD red phase) covering CRUD, email uniqueness enforcement, visibility filtering, and auth — all must fail before implementation.

**Depends on:** API-CRM-006 (spec + generated schemas).
**Blocks:** API-CRM-009 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/crm/contacts.test.ts`

**Imports / Exports**
- Imports: generated `ContactSchema`, `CreateContactSchema`, test auth helper, test DB client
- Exports: test suite in `contacts.test.ts`

**Definition of Done**
- [ ] Tests cover: list (paginated), create (201), create duplicate email (409), get by ID, update, soft delete, auth (401 without token).
- [ ] Visibility filter test: contacts with `visibility: 'private'` not visible to other users.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Activity timeline tests (API-CRM-019)
- Workspace composite tests (API-CRM-026)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/contacts.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `contacts.test.ts` if test infrastructure is broken.
- Halt condition: test file fails to compile — fix imports before writing tests.

**Rules to Follow**
- Test email uniqueness: create contact with email, attempt to create another in same org with same email → 409 `DuplicateEmail`.
- Visibility test: create private contact as User A; authenticate as User B; verify it does not appear in list.
- All tests currently fail (red). Do not implement routes to make them pass.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/contacts.test.ts
# Expected: all fail (red)
pnpm typecheck
```

**Advanced Code Patterns**
- Two-user test: create JWT tokens for `userA` and `userB` with same `organizationId`; test visibility isolation.

**Anti-Patterns**
- Testing visibility by checking DB directly (test the API behaviour, not DB state).
- Using hardcoded email that conflicts with other tests (use unique generated emails per test run).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email uniqueness is a domain invariant. Tests validate it via API, not via DB constraint alone.
- TDD: Red phase only. Tests will pass when API-CRM-009 completes.
- BDD: "When a user creates a contact with an email already used in the same organisation, they receive a 409 Conflict error."
- Deep Module: Tests are black-box; internals of `ContactService` are not tested here.

---

### Subtasks
- [ ] API-CRM-007.0.25 (AGENT): Read API-CRM-007 and the generated contact schemas from API-CRM-006.
  *No action — pause until fully understood.*

- [ ] API-CRM-007.0.5 (AGENT): Review visibility filtering requirements and test user factory patterns.
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-007.0.75 (AGENT): Confirm visibility isolation test approach with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-007.1 (AGENT): Write all contact integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/crm/contacts.test.ts`
  **Verification:** `pnpm test -- contacts.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-CRM-007.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved; all tests failing.

---

## [ ] API-CRM-008: Contacts – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ContactRepository` or `ContactService` exists.
**Size:** Large

**Description:** Implement `ContactRepository` (DB queries with org-scoping and visibility filtering) and `ContactService` (email uniqueness enforcement, visibility rules, event emission) using neverthrow Results.

**Depends on:** DB-CRM-003 (contacts schema), EVENT-001 (domain events), ERROR-002 (DomainError).
**Blocks:** API-CRM-009 (routes use ContactService).
**Related Files:** `lib/db/src/repositories/crm/contacts.ts`, `artifacts/api-server/src/services/crm/contact-service.ts`

**Imports / Exports**
- Imports: `db` pool, Drizzle `contacts` table, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `ContactRepository`, `ContactService`

**Definition of Done**
- [ ] `ContactRepository`: `findById`, `findByOrg` (paginated, visibility-filtered), `create`, `update`, `softDelete`, `findByEmail`.
- [ ] `ContactService`: `listContacts`, `getContact`, `createContact`, `updateContact`, `deleteContact`. All return `Result<T, DomainError>`.
- [ ] Email uniqueness: `createContact` checks for existing non-deleted contact with same email in same org; returns `err(DuplicateEmail)` if found.
- [ ] Visibility filtering: `listContacts` for a user returns `public` + `team` contacts + own `private` contacts.
- [ ] Emits `ContactCreated`, `ContactUpdated` domain events.
- [ ] Unit tests for `ContactService` (mocked repository) pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Contact activity timeline (API-CRM-019)
- Contact workspace (API-CRM-026)
- Bulk contact operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never hard-delete contacts

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/crm/contacts.ts`, `artifacts/api-server/src/services/crm/contact-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/contact-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service files.
- Halt condition: email uniqueness check not enforced → halt and fix before adding routes.

**Rules to Follow**
- `createContact` must check email uniqueness before inserting — use `findByEmail(email, orgId)`.
- Visibility SQL: `WHERE (visibility = 'public' OR visibility = 'team' OR (visibility = 'private' AND assigned_to = $userId))`.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/contact-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Email uniqueness check: `const existing = await repo.findByEmail(email, orgId); if (existing.isOk() && existing.value) return err(new DuplicateEmail(email))`.
- Visibility query: Drizzle `or(eq(contacts.visibility, 'public'), eq(contacts.visibility, 'team'), and(eq(contacts.visibility, 'private'), eq(contacts.assignedTo, userId)))`.

**Anti-Patterns**
- Relying only on DB unique constraint for email (returns cryptic 23505 error, not a domain error).
- Missing visibility filter in `findByOrg` (exposes private contacts to other users).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email uniqueness is a domain invariant. Visibility is a domain rule about data access control within the CRM aggregate.
- TDD: Unit tests with mocked repository cover email uniqueness and visibility filtering.
- BDD: "When a contact is created with an email already in use, the service returns a DuplicateEmail domain error."
- Deep Module: `ContactService` hides email uniqueness check, visibility query construction, and event emission.

---

### Subtasks
- [ ] API-CRM-008.0.25 (AGENT): Read DB-CRM-003, `LeadRepository` as pattern reference, and visibility rules.
  *No action — pause until fully understood.*

- [ ] API-CRM-008.0.5 (AGENT): Research Drizzle ORM visibility query patterns and email uniqueness check strategies (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-008.0.75 (AGENT): Confirm visibility filtering rules for `team` visibility (is it per-team or per-org?) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-008.1 (AGENT): Implement `ContactRepository`.
  **File(s):** `lib/db/src/repositories/crm/contacts.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-008.2 (AGENT): Implement `ContactService` with email uniqueness, visibility, and event emission.
  **File(s):** `artifacts/api-server/src/services/crm/contact-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-008.3 (AGENT): Write and run unit tests for `ContactService`.
  **File(s):** `artifacts/api-server/src/services/crm/__tests__/contact-service.test.ts`
  **Verification:** `pnpm test -- contact-service.test.ts` green ; `pnpm typecheck`

- [ ] API-CRM-008.4 (HUMAN): Review email uniqueness and visibility enforcement. Sign off.
  **Verification:** Approved; all tests green.

---

## [ ] API-CRM-009: Contacts – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No contact routes wired. Integration tests written (red).
**Size:** Small

**Description:** Create contact route handlers, mount the router, and run integration tests to green.

**Depends on:** API-CRM-008 (ContactService), API-CRM-007 (integration tests), AUTH-008.
**Blocks:** API-CRM-025 (assignment API uses contacts), API-CRM-026 (workspace composite).
**Related Files:** `artifacts/api-server/src/routes/crm/contacts.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `ContactService`, `CreateContactSchema`, `UpdateContactSchema`, `authMiddleware`
- Exports: `contactsRouter` mounted at `/api/v1/crm/contacts`

**Definition of Done**
- [ ] All 5 CRUD route handlers implemented.
- [ ] Auth middleware applied.
- [ ] `DuplicateEmail` DomainError → 409 response.
- [ ] `pnpm test -- contacts.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Activity timeline routes (API-CRM-019)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/crm/contacts.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove `routes/crm/contacts.ts`; revert `routes/index.ts` mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Same error mapping pattern as leads: `mapDomainError(err, res)` utility.
- `DuplicateEmail` → 409; `ContactNotFound` → 404.
- `organizationId` always from `req.user.organizationId`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/contacts.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Same Result unwrap pattern as `leads.ts` route.

**Anti-Patterns**
- Returning 500 for `DuplicateEmail` (should be 409).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are thin anti-corruption layer — no domain logic.
- TDD: Green phase for contacts. Fix implementation, not tests.
- BDD: All Gherkin scenarios from API-CRM-007 tests must now pass.
- Deep Module: Route handlers delegate entirely to `ContactService`.

---

### Subtasks
- [ ] API-CRM-009.0.25 (AGENT): Read `routes/crm/leads.ts` as the route pattern reference.
  *No action — pause until fully understood.*

- [ ] API-CRM-009.0.5 (AGENT): Confirm `DuplicateEmail` HTTP status mapping (409 vs 422) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-009.1 (AGENT): Implement contacts router and mount in `routes/index.ts`.
  **File(s):** `artifacts/api-server/src/routes/crm/contacts.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-009.2 (AGENT): Run integration tests to green. Fix any implementation issues.
  **File(s):** As needed
  **Verification:** `pnpm test -- contacts.test.ts` — 0 failures ; `pnpm typecheck`

- [ ] API-CRM-009.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures; `pnpm typecheck` clean.

---

## [ ] API-CRM-010: Companies – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No company endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all company CRUD endpoints and schemas to the OpenAPI spec, including the `settings` JSONB field and domain uniqueness constraint.

**Depends on:** API-SPEC-001, DB-CRM-004 (companies schema).
**Blocks:** API-CRM-011, API-CRM-012, API-CRM-013.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `CompanySchema`, `CreateCompanySchema`, `UpdateCompanySchema` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/crm/companies`, `POST`, `GET /{companyId}`, `PATCH /{companyId}`, `DELETE /{companyId}` all defined.
- [ ] `settings` field documented as JSONB/object type.
- [ ] `domain` field marked as unique-per-organisation in description.
- [ ] Codegen runs successfully.

**Out of Scope**
- Company workspace composite endpoint (API-CRM-026)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix YAML syntax before proceeding.

**Rules to Follow**
- `settings` typed as `type: object, additionalProperties: true` in OpenAPI.
- Reuse `VisibilityEnum` component from contacts spec.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `settings` as flexible JSONB: `schema: { type: object, additionalProperties: true, description: "Custom company settings as key-value pairs" }`.

**Anti-Patterns**
- Over-defining the `settings` JSONB structure (it's intentionally flexible).

**DDD / TDD / BDD / Deep Module notes**
- DDD: `domain` uniqueness per org is a company aggregate invariant — documented in spec, enforced in service.
- TDD: Spec enables API-CRM-011 test writing.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec is the narrow interface.

---

### Subtasks
- [ ] API-CRM-010.0.25 (AGENT): Read DB-CRM-004 companies schema and existing spec patterns.
  *No action — pause until fully understood.*

- [ ] API-CRM-010.1 (AGENT): Add `Company` schema and all company endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-010.2 (HUMAN): Review and sign off.
  **Verification:** Approved.

---

## [ ] API-CRM-011: Companies – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No company integration tests.
**Size:** Medium

**Description:** Write company integration tests covering CRUD, domain uniqueness, `settings` JSONB, and auth (TDD red phase).

**Depends on:** API-CRM-010 (spec + generated schemas).
**Blocks:** API-CRM-013 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/crm/companies.test.ts`

**Imports / Exports**
- Imports: generated `CompanySchema`, `CreateCompanySchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests cover: list, create, create duplicate domain → 409, get by ID, update `settings`, soft delete, auth enforcement.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Company workspace composite (API-CRM-026)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/companies.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `companies.test.ts` if test infrastructure broken.
- Halt condition: test file fails to compile — fix imports first.

**Rules to Follow**
- `settings` update test: PATCH `{ settings: { tier: 'enterprise', customField: 'value' } }` and verify stored correctly.
- Domain uniqueness: attempt to create two companies with same `domain` in same org → 409.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/companies.test.ts
# Expected: all fail
pnpm typecheck
```

**Advanced Code Patterns**
- JSONB settings test: use `expect(res.body.settings.tier).toBe('enterprise')` after PATCH.

**Anti-Patterns**
- Testing DB schema directly for JSONB storage (test via API only).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain (website URL) uniqueness is a company aggregate invariant.
- TDD: Red phase.
- BDD: "When a user tries to register two companies with the same domain, they receive a 409 Conflict."
- Deep Module: Black-box tests exercise API surface only.

---

### Subtasks
- [ ] API-CRM-011.0.25 (AGENT): Read API-CRM-011 and generated company schemas.
  *No action — pause until fully understood.*

- [ ] API-CRM-011.1 (AGENT): Write all company integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/crm/companies.test.ts`
  **Verification:** `pnpm test -- companies.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-CRM-011.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved.

---

## [ ] API-CRM-012: Companies – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `CompanyRepository` or `CompanyService` exists.
**Size:** Large

**Description:** Implement `CompanyRepository` and `CompanyService` with domain uniqueness enforcement, JSONB `settings` merge, soft delete, and event emission using neverthrow Results.

**Depends on:** DB-CRM-004 (companies schema), EVENT-001, ERROR-002.
**Blocks:** API-CRM-013 (routes use CompanyService).
**Related Files:** `lib/db/src/repositories/crm/companies.ts`, `artifacts/api-server/src/services/crm/company-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `companies` table, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `CompanyRepository`, `CompanyService`

**Definition of Done**
- [ ] `CompanyRepository`: `findById`, `findByOrg`, `create`, `update`, `softDelete`, `findByDomain`.
- [ ] `CompanyService`: `listCompanies`, `getCompany`, `createCompany`, `updateCompany`, `deleteCompany`. All return `Result<T, DomainError>`.
- [ ] Domain uniqueness enforced in `createCompany` (check `findByDomain` before insert).
- [ ] `settings` JSONB merge: `updateCompany` merges incoming settings with existing (not replace).
- [ ] `CompanyCreated`, `CompanyUpdated` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Company workspace (API-CRM-026)
- Company merge (API-CRM-023)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never hard-delete companies

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/crm/companies.ts`, `artifacts/api-server/src/services/crm/company-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/company-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: domain uniqueness not enforced → halt and add check.

**Rules to Follow**
- JSONB settings merge: `UPDATE companies SET settings = settings || $newSettings WHERE id = $id` (PostgreSQL JSONB merge operator).
- Domain uniqueness: `findByDomain(domain, orgId)` before insert; return `err(new DuplicateDomain(domain))` if found.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/company-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- JSONB merge in Drizzle: `sql`settings = settings || ${JSON.stringify(settingsUpdate)}::jsonb``.
- Domain uniqueness: same pattern as email uniqueness in `ContactService`.

**Anti-Patterns**
- Replacing `settings` entirely on PATCH (should be deep merge).
- Missing domain uniqueness check (allows duplicate companies per org).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Company `settings` is a JSONB aggregate that merges rather than replaces, preserving existing configuration.
- TDD: Unit tests validate merge semantics and domain uniqueness.
- BDD: "When settings are updated, existing settings keys not included in the PATCH are preserved."
- Deep Module: `CompanyService` hides domain check, JSONB merge, and event emission.

---

### Subtasks
- [ ] API-CRM-012.0.25 (AGENT): Read DB-CRM-004 schema, JSONB merge operator docs, and `ContactRepository` as pattern.
  *No action — pause until fully understood.*

- [ ] API-CRM-012.1 (AGENT): Implement `CompanyRepository`.
  **File(s):** `lib/db/src/repositories/crm/companies.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-012.2 (AGENT): Implement `CompanyService` with domain check, JSONB merge, event emission.
  **File(s):** `artifacts/api-server/src/services/crm/company-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-012.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/crm/__tests__/company-service.test.ts`
  **Verification:** `pnpm test -- company-service.test.ts` green ; `pnpm typecheck`

- [ ] API-CRM-012.4 (HUMAN): Review JSONB merge and domain uniqueness. Sign off.
  **Verification:** Approved; all tests green.

---

## [ ] API-CRM-013: Companies – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No company routes wired.
**Size:** Small

**Description:** Create company route handlers, mount the router, and run integration tests to green.

**Depends on:** API-CRM-012 (CompanyService), API-CRM-011 (tests), AUTH-008.
**Blocks:** API-CRM-025 (assignment), API-CRM-026 (workspace).
**Related Files:** `artifacts/api-server/src/routes/crm/companies.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `CompanyService`, `CreateCompanySchema`, `UpdateCompanySchema`, `authMiddleware`
- Exports: `companiesRouter` at `/api/v1/crm/companies`

**Definition of Done**
- [ ] All 5 CRUD handlers; `DuplicateDomain` → 409.
- [ ] `pnpm test -- companies.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/crm/companies.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- Same patterns as contacts and leads routes.
- `DuplicateDomain` → 409.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/companies.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Reuse `mapDomainError` utility from leads/contacts routes.

**Anti-Patterns**
- Duplicating error mapping logic instead of reusing the utility.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer.
- TDD: Green phase for companies.
- BDD: All API-CRM-011 scenarios pass.
- Deep Module: Routes delegate to `CompanyService`.

---

### Subtasks
- [ ] API-CRM-013.0.25 (AGENT): Read `routes/crm/contacts.ts` as pattern reference.
  *No action — pause until fully understood.*

- [ ] API-CRM-013.1 (AGENT): Implement companies router and mount.
  **File(s):** `artifacts/api-server/src/routes/crm/companies.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-013.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- companies.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-CRM-013.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures.

---

## [ ] API-CRM-014: Deals – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No deal endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add deal CRUD endpoints, pipeline stage enum, probability constraints, and close date fields to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-CRM-005 (deals schema).
**Blocks:** API-CRM-015, API-CRM-016, API-CRM-017.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `DealSchema`, `CreateDealSchema`, `UpdateDealSchema`, `DealStageEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/crm/deals`, `POST`, `GET /{dealId}`, `PATCH /{dealId}`, `DELETE /{dealId}` all defined.
- [ ] `DealStageEnum`: `prospecting`, `qualification`, `proposal`, `negotiation`, `closed_won`, `closed_lost`.
- [ ] `probability` field: integer 0–100, with description "Probability of winning this deal as a percentage."
- [ ] `amount_cents` as integer field (money in cents).
- [ ] `close_date` as date field (ISO 8601).
- [ ] Codegen runs successfully.

**Out of Scope**
- Deal workspace composite (API-CRM-026)
- Deal activity timeline (API-CRM-018)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- `probability` constrained: `minimum: 0, maximum: 100`.
- `amount_cents` avoids float precision issues.
- `DealStageEnum` defined as reusable component.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `probability` linked to stage: document in field description that `closed_won` implies 100, `closed_lost` implies 0.

**Anti-Patterns**
- Using `amount` as a float (use `amount_cents` as integer).
- Missing `probability` constraints (allows invalid values like 150).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Probability is a domain attribute on the Deal aggregate. Stage → probability mapping is a business rule documented in spec description.
- TDD: Spec enables API-CRM-015 test writing.
- BDD: [N/A].
- Deep Module: Spec is the narrow interface.

---

### Subtasks
- [ ] API-CRM-014.0.25 (AGENT): Read DB-CRM-005 deals schema.
  *No action — pause until fully understood.*

- [ ] API-CRM-014.1 (AGENT): Add `Deal` schema and all deal endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-014.2 (HUMAN): Review and sign off.
  **Verification:** Approved.

---

## [ ] API-CRM-015: Deals – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No deal integration tests.
**Size:** Medium

**Description:** Write deal integration tests covering pipeline stage transitions, probability constraints, close date, and auth (TDD red phase).

**Depends on:** API-CRM-014 (spec + generated schemas).
**Blocks:** API-CRM-017 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/crm/deals.test.ts`

**Imports / Exports**
- Imports: generated `DealSchema`, `CreateDealSchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: list (filtered by stage), create (201), invalid stage transition → 400, probability out of range → 400, get, update (including stage change), soft delete, auth.
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Deal workspace composite (API-CRM-026)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/deals.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `deals.test.ts` if test infrastructure broken.
- Halt condition: test file fails to compile — fix imports.

**Rules to Follow**
- Stage transition test: `PATCH { stage: 'closed_won' }` on a `negotiation` deal should succeed; on a `prospecting` deal should fail with 400.
- Probability test: `PATCH { probability: 150 }` should return 400.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/deals.test.ts
# Expected: all fail
pnpm typecheck
```

**Advanced Code Patterns**
- Stage transition test: seed a deal in `negotiation` stage; attempt `PATCH { stage: 'prospecting' }` (backward) → expect 400.

**Anti-Patterns**
- Not testing invalid stage transitions (key domain invariant for deals).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Stage transitions and probability constraints are deal domain invariants.
- TDD: Red phase.
- BDD: "When a deal in 'negotiation' is updated to 'prospecting', the API returns a 400 with an InvalidStageTransition error."
- Deep Module: Tests are black-box.

---

### Subtasks
- [ ] API-CRM-015.0.25 (AGENT): Read API-CRM-015 and generated deal schemas.
  *No action — pause until fully understood.*

- [ ] API-CRM-015.1 (AGENT): Write all deal integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/crm/deals.test.ts`
  **Verification:** `pnpm test -- deals.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-CRM-015.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved.

---

## [ ] API-CRM-016: Deals – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `DealRepository` or `DealService` exists.
**Size:** Large

**Description:** Implement `DealRepository` and `DealService` with pipeline stage machine, probability validation (0–100), close date handling, and event emission using neverthrow Results.

**Depends on:** DB-CRM-005 (deals schema), EVENT-001, ERROR-002.
**Blocks:** API-CRM-017 (routes use DealService).
**Related Files:** `lib/db/src/repositories/crm/deals.ts`, `artifacts/api-server/src/services/crm/deal-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `deals` table, `DomainEventBus`, `DomainError`, `neverthrow`
- Exports: `DealRepository`, `DealService`

**Definition of Done**
- [ ] `DealRepository`: `findById`, `findByOrg` (paginated + stage-filtered), `create`, `update`, `softDelete`.
- [ ] `DealService`: `listDeals`, `getDeal`, `createDeal`, `updateDeal`, `deleteDeal`. All return `Result<T, DomainError>`.
- [ ] Pipeline stage machine: `prospecting → qualification → proposal → negotiation → closed_won/closed_lost`. No backward transitions.
- [ ] Probability validated: 0–100 inclusive; `createDeal` defaults to stage-appropriate probability.
- [ ] `DealCreated`, `DealUpdated` domain events emitted.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Deal revenue reporting (API-FIN related)
- Deal workspace (API-CRM-026)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never hard-delete deals

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/crm/deals.ts`, `artifacts/api-server/src/services/crm/deal-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/deal-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: stage machine not enforcing transitions → halt and add guard.

**Rules to Follow**
- Stage machine: `DEAL_TRANSITIONS = { prospecting: ['qualification'], qualification: ['proposal', 'closed_lost'], proposal: ['negotiation', 'closed_lost'], negotiation: ['closed_won', 'closed_lost'], closed_won: [], closed_lost: [] }`.
- Default probability by stage: `{ prospecting: 10, qualification: 25, proposal: 50, negotiation: 75, closed_won: 100, closed_lost: 0 }`.
- `updateDeal` with stage change auto-updates probability to stage default unless explicit probability provided.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/deal-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Auto-probability on stage change: `if (dto.stage && !dto.probability) dto.probability = DEFAULT_PROBABILITIES[dto.stage]`.
- Same stage machine guard pattern as `LeadService`.

**Anti-Patterns**
- Allowing backward stage transitions (key domain invariant for deals pipeline).
- Probability validation only in route (must be in service, not just Zod schema).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deal pipeline stage machine is the central domain behaviour of the CRM deals aggregate.
- TDD: Unit tests for stage machine with mocked repo; all transitions tested.
- BDD: "When a deal moves from 'negotiation' to 'closed_won', the probability auto-updates to 100%."
- Deep Module: `DealService` hides stage machine, auto-probability, and event emission.

---

### Subtasks
- [ ] API-CRM-016.0.25 (AGENT): Read DB-CRM-005, `LeadService` stage machine pattern, and deal pipeline business rules.
  *No action — pause until fully understood.*

- [ ] API-CRM-016.1 (AGENT): Implement `DealRepository`.
  **File(s):** `lib/db/src/repositories/crm/deals.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-016.2 (AGENT): Implement `DealService` with stage machine and auto-probability.
  **File(s):** `artifacts/api-server/src/services/crm/deal-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-016.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/crm/__tests__/deal-service.test.ts`
  **Verification:** `pnpm test -- deal-service.test.ts` green ; `pnpm typecheck`

- [ ] API-CRM-016.4 (HUMAN): Review stage machine and auto-probability. Sign off.
  **Verification:** Approved; all tests green.

---

## [ ] API-CRM-017: Deals – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No deal routes wired.
**Size:** Small

**Description:** Create deal route handlers, mount the router, and run integration tests to green.

**Depends on:** API-CRM-016 (DealService), API-CRM-015 (tests), AUTH-008.
**Blocks:** API-CRM-025 (assignment), API-CRM-026 (workspace), API-CRM-027 (activity ingestion on stage change).
**Related Files:** `artifacts/api-server/src/routes/crm/deals.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `DealService`, `CreateDealSchema`, `UpdateDealSchema`, `authMiddleware`
- Exports: `dealsRouter` at `/api/v1/crm/deals`

**Definition of Done**
- [ ] All 5 CRUD handlers; `InvalidStageTransition` → 400.
- [ ] `pnpm test -- deals.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/crm/deals.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: `pnpm typecheck` failure stops all changes.

**Rules to Follow**
- `InvalidStageTransition` → 400 with descriptive message.
- `organizationId` from `req.user.organizationId` only.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/deals.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Same `mapDomainError` utility pattern as other CRM routes.

**Anti-Patterns**
- Returning 500 for `InvalidStageTransition` (should be 400).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Thin route layer. Stage machine in service.
- TDD: Green phase for deals.
- BDD: All API-CRM-015 scenarios pass.
- Deep Module: Routes delegate entirely to `DealService`.

---

### Subtasks
- [ ] API-CRM-017.0.25 (AGENT): Read `routes/crm/contacts.ts` or `leads.ts` as pattern.
  *No action — pause until fully understood.*

- [ ] API-CRM-017.1 (AGENT): Implement deals router and mount.
  **File(s):** `artifacts/api-server/src/routes/crm/deals.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-017.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- deals.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-CRM-017.3 (HUMAN): Final sign-off.
  **Verification:** Approved; 0 failures.

---

## [ ] API-CRM-018: Activities – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No activity endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add append-only activity endpoints and a comprehensive activity type enum to the OpenAPI spec.

**Depends on:** API-SPEC-001, DB-CRM-002 (activities schema).
**Blocks:** API-CRM-019, API-CRM-020, API-CRM-021.
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A]
- Exports: `ActivitySchema`, `CreateActivitySchema`, `ActivityTypeEnum` (via codegen); React Query hooks (via codegen)

**Definition of Done**
- [ ] `GET /api/v1/crm/activities` with `entityType`, `entityId`, `type`, `page`, `limit` query params.
- [ ] `POST /api/v1/crm/activities` with `CreateActivityRequestBody` (append-only; no PATCH/DELETE).
- [ ] `GET /api/v1/crm/activities/{activityId}` defined.
- [ ] `ActivityTypeEnum`: `note`, `email`, `call`, `stage_change`, `assignment_change`, `lead_converted`, `meeting`, `task_completed`.
- [ ] No PATCH or DELETE endpoints defined (append-only constraint documented in spec).
- [ ] Codegen runs successfully.

**Out of Scope**
- Email ingestion from mailboxes (API-CRM-028)
- Bulk activity import

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml`.
- Halt condition: codegen fails — fix spec.

**Rules to Follow**
- Document append-only constraint prominently in spec description.
- `entity_type` enum: `lead`, `contact`, `company`, `deal`.
- `body` field for notes/email content (nullable text).

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
```

**Advanced Code Patterns**
- `ActivityTypeEnum` as reusable spec component — used by both activities and CRM task completion events.

**Anti-Patterns**
- Defining PATCH/DELETE activity endpoints (breaks append-only audit trail guarantee).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Activities are append-only value objects representing CRM event history.
- TDD: Spec enables API-CRM-019 tests.
- BDD: [N/A] — spec authoring.
- Deep Module: Spec documents the narrow interface — no mutation endpoints for activities.

---

### Subtasks
- [ ] API-CRM-018.0.25 (AGENT): Read DB-CRM-002 activities schema and activity type requirements.
  *No action — pause until fully understood.*

- [ ] API-CRM-018.1 (AGENT): Add `Activity` schema and endpoints to `openapi.yaml`.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-018.2 (HUMAN): Review and sign off. Confirm no PATCH/DELETE endpoints.
  **Verification:** Approved.

---

## [ ] API-CRM-019: Activities – Integration Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No activity integration tests.
**Size:** Medium

**Description:** Write activity integration tests covering creation, retrieval by entity, type filtering, and append-only enforcement (TDD red phase).

**Depends on:** API-CRM-018 (spec + generated schemas).
**Blocks:** API-CRM-021 (green phase).
**Related Files:** `artifacts/api-server/__tests__/api/crm/activities.test.ts`

**Imports / Exports**
- Imports: generated `ActivitySchema`, `CreateActivitySchema`, test auth helper
- Exports: test suite

**Definition of Done**
- [ ] Tests: create note activity (201), list by entity (lead), filter by `type`, get by ID, attempt DELETE → 405 (method not allowed), auth (401).
- [ ] Append-only test: verify no PATCH or DELETE routes exist (or return 405).
- [ ] All tests currently fail (red).
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Automatic activity creation tests (API-CRM-027)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/__tests__/api/crm/activities.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `activities.test.ts` if infrastructure broken.
- Halt condition: test file fails to compile — fix imports first.

**Rules to Follow**
- Append-only test: send DELETE request; expect 405 `Method Not Allowed`.
- Entity filter test: create activities for lead A and lead B; list for lead A; verify only lead A's activities returned.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/activities.test.ts
# Expected: all fail
pnpm typecheck
```

**Advanced Code Patterns**
- 405 test: `const res = await request(app).delete(`/api/v1/crm/activities/${activityId}`).set('Authorization', bearer); expect(res.status).toBe(405)`.

**Anti-Patterns**
- Not testing append-only enforcement (key invariant for activities).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only constraint is a domain invariant for activity audit trail.
- TDD: Red phase.
- BDD: "When a user attempts to delete an activity, they receive a 405 Method Not Allowed response."
- Deep Module: Tests are black-box.

---

### Subtasks
- [ ] API-CRM-019.0.25 (AGENT): Read API-CRM-019 and generated activity schemas.
  *No action — pause until fully understood.*

- [ ] API-CRM-019.1 (AGENT): Write all activity integration tests.
  **File(s):** `artifacts/api-server/__tests__/api/crm/activities.test.ts`
  **Verification:** `pnpm test -- activities.test.ts` all fail (red) ; `pnpm typecheck`

- [ ] API-CRM-019.2 (HUMAN): Review test coverage and confirm red phase.
  **Verification:** Approved.

---

## [ ] API-CRM-020: Activities – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ActivityRepository` or `ActivityService` exists.
**Size:** Large

**Description:** Implement `ActivityRepository` (entity-scoped queries) and `ActivityService` (entity validation, append-only enforcement, event emission) using neverthrow Results.

**Depends on:** DB-CRM-002 (activities schema), EVENT-001, ERROR-002.
**Blocks:** API-CRM-021 (routes use ActivityService), API-CRM-027 (automatic activity ingestion uses ActivityService).
**Related Files:** `lib/db/src/repositories/crm/activities.ts`, `artifacts/api-server/src/services/crm/activity-service.ts`

**Imports / Exports**
- Imports: `db`, Drizzle `activities` table, `DomainEventBus`, entity repositories (for existence validation), `neverthrow`
- Exports: `ActivityRepository`, `ActivityService`

**Definition of Done**
- [ ] `ActivityRepository`: `findById`, `findByEntity` (paginated, type-filtered), `create`.
- [ ] `ActivityService`: `listActivities`, `getActivity`, `createActivity`. All return `Result<T, DomainError>`.
- [ ] `createActivity` validates entity exists and belongs to same org before inserting.
- [ ] No update or delete methods exposed from service (append-only).
- [ ] `ActivityCreated` domain event emitted on create.
- [ ] Unit tests pass.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Automatic activity creation from domain events (API-CRM-027 extends this)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never expose update or delete methods (append-only)

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/crm/activities.ts`, `artifacts/api-server/src/services/crm/activity-service.ts`
- Tests added/updated in: `artifacts/api-server/src/services/crm/__tests__/activity-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove repository and service.
- Halt condition: update or delete method found in service interface → halt and remove.

**Rules to Follow**
- Repository has no `update` or `delete` method — enforces append-only at data layer.
- Entity validation: `resolveEntity(entityType, entityId, orgId)` checks existence.
- All methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/src/services/crm/__tests__/activity-service.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Entity resolver: `switch (entityType) { case 'lead': return leadRepo.findById(entityId, orgId); case 'contact': return contactRepo.findById(entityId, orgId); ... }`.
- Append-only repository: only `create` and read methods — no `update` or `delete`.

**Anti-Patterns**
- Exposing `update` or `delete` on `ActivityService` (breaks audit trail guarantee).
- Skipping entity existence validation (orphaned activities).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Activities are append-only event records. The service enforces this at the domain level, not just the HTTP level.
- TDD: Unit tests with mocked entity repos verify entity validation and append-only behavior.
- BDD: "When ActivityService.createActivity is called with an invalid entity ID, it returns an EntityNotFound domain error."
- Deep Module: `ActivityService` hides entity resolution, org-scoping, and event emission behind 3 clean methods.

---

### Subtasks
- [ ] API-CRM-020.0.25 (AGENT): Read DB-CRM-002 schema, entity repository APIs, and EVENT-001.
  *No action — pause until fully understood.*

- [ ] API-CRM-020.1 (AGENT): Implement `ActivityRepository` (read + create only).
  **File(s):** `lib/db/src/repositories/crm/activities.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-020.2 (AGENT): Implement `ActivityService` with entity validation and append-only enforcement.
  **File(s):** `artifacts/api-server/src/services/crm/activity-service.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-020.3 (AGENT): Write and run unit tests.
  **File(s):** `artifacts/api-server/src/services/crm/__tests__/activity-service.test.ts`
  **Verification:** `pnpm test -- activity-service.test.ts` green ; `pnpm typecheck`

- [ ] API-CRM-020.4 (HUMAN): Review append-only enforcement and entity validation. Sign off.
  **Verification:** Approved; no update/delete methods; all tests green.

---

## [ ] API-CRM-021: Activities – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No activity routes wired.
**Size:** Small

**Description:** Create activity route handlers (GET list, POST create, GET by ID — no PATCH/DELETE), mount the router, and run integration tests to green.

**Depends on:** API-CRM-020 (ActivityService), API-CRM-019 (tests), AUTH-008.
**Blocks:** API-CRM-026 (workspace uses activities), API-CRM-027 (automatic ingestion uses ActivityService).
**Related Files:** `artifacts/api-server/src/routes/crm/activities.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `ActivityService`, `CreateActivitySchema`, `authMiddleware`
- Exports: `activitiesRouter` at `/api/v1/crm/activities`

**Definition of Done**
- [ ] GET list, POST create, GET by ID routes only (no PATCH/DELETE registered).
- [ ] Attempting PATCH or DELETE returns 405.
- [ ] `pnpm test -- activities.test.ts` — 0 failures.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- [N/A]

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/crm/activities.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — remove route; revert mount.
- Halt condition: PATCH or DELETE route accidentally registered → halt and remove.

**Rules to Follow**
- Only register GET (list), POST, GET (by ID). No mutation routes.
- 405 enforcement: Express will return 404 by default for unregistered methods; use `router.all('/:id', methodNotAllowed)` to explicitly return 405.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/crm/activities.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- 405 handler: `router.all('/:id', (req, res) => res.status(405).json({ error: 'Method Not Allowed' }))` — registered after GET and POST to catch all other methods.

**Anti-Patterns**
- Accidentally registering a PATCH or DELETE handler (breaks append-only guarantee).
- Not returning 405 for unsupported methods (returns 404 instead, which is misleading).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Append-only route configuration enforces the domain invariant at the HTTP layer.
- TDD: Green phase for activities.
- BDD: All API-CRM-019 scenarios pass.
- Deep Module: Routes delegate entirely to `ActivityService`.

---

### Subtasks
- [ ] API-CRM-021.0.25 (AGENT): Read `routes/crm/leads.ts` as pattern; note which methods NOT to register.
  *No action — pause until fully understood.*

- [ ] API-CRM-021.1 (AGENT): Implement activities router (GET list, POST, GET by ID, 405 catch-all).
  **File(s):** `artifacts/api-server/src/routes/crm/activities.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck`

- [ ] API-CRM-021.2 (AGENT): Run integration tests to green.
  **File(s):** As needed
  **Verification:** `pnpm test -- activities.test.ts` 0 failures ; `pnpm typecheck`

- [ ] API-CRM-021.3 (HUMAN): Final sign-off. Verify no PATCH/DELETE routes present.
  **Verification:** Approved; 0 failures; append-only confirmed.

---

## [ ] API-CRM-036: Site & Event Tracking API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No site tracking infrastructure exists. No pageview or custom event capture endpoints available.
**Size:** Large

**Description:** Implement a lightweight server-side tracking API — `POST /tracking/pageview` and `POST /tracking/event` — that accepts anonymous or identified events from a JavaScript snippet, associates events with known contacts via an identity bridge, and stores them as CRM activities.

**Depends on:** DB-CRM-011 (site_tracking_events table, tracking_identities table), API-CRM-020 (ActivityService), EVENT-001 (domain event bus), ERROR-002 (domain errors).
**Blocks:** [N/A] — enables future marketing attribution features.
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/crm/tracking-service.ts`, `artifacts/api-server/src/routes/tracking.ts`

**Imports / Exports**
- Imports: `ActivityService` (for contact-associated events), `db` pool, cookie parser middleware
- Exports: `TrackingService`, `/tracking` router (public endpoints, no auth required)

**Definition of Done**
- [ ] `POST /tracking/pageview` — accepts `{ url, referrer, title, trackingId?, contactId? }`. Creates `site_tracking_event` record. If `contactId` provided, creates CRM activity of type `page_view`.
- [ ] `POST /tracking/event` — accepts `{ eventName, properties, trackingId?, contactId? }`. Creates event record. If `contactId` provided, creates CRM activity.
- [ ] Tracking ID: if no `trackingId` provided, generate UUID and return in response as `trackingId`.
- [ ] Identity bridge: `POST /tracking/identify` — links anonymous `trackingId` to a known `contactId`. Backfills existing anonymous events.
- [ ] No authentication required on tracking endpoints (public, unauthenticated by design).
- [ ] CORS configured to allow cross-origin requests on `/tracking/*` routes.
- [ ] Rate limiting applied (max 100 requests per IP per minute) to prevent abuse.
- [ ] Integration tests: pageview with and without contactId, identify (verify backfill), custom event, rate limit exceeded → 429.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- JavaScript tracking snippet generation (backend API only)
- Real-time analytics dashboard (Analytics context handles reporting)
- Session recording or heatmaps
- GDPR consent management (future task)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Tracking endpoints are public — never trust or expose sensitive data in tracking responses
- Never allow tracking events to leak data across organisations

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/crm/tracking-service.ts`, `artifacts/api-server/src/routes/tracking.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/tracking.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-CRM-011)

**Rollback**
- Granularity: file-level — remove `tracking-service.ts` and `routes/tracking.ts`; revert route mount.
- Halt condition: tracking endpoint leaking organisation data across tenants — halt immediately.

**Rules to Follow**
- Public endpoints: no `authMiddleware` on `/tracking/*` routes.
- Rate limiting: use `express-rate-limit` middleware on tracking routes; max 100 req/min per IP.
- CORS: explicitly configure cross-origin on `/tracking/*` only; other routes unchanged.
- `organizationId` on tracking events resolved from the embedded tracking script's site configuration (tracked via `site_id` param), not from auth token.
- `TrackingService` methods return `Result<T, DomainError>` — no `throw`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/tracking.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Tracking ID generation: `const trackingId = req.body.trackingId ?? crypto.randomUUID()`.
- Identity bridge backfill: `UPDATE site_tracking_events SET contact_id = $contactId WHERE tracking_id = $trackingId AND contact_id IS NULL`.
- Cookie-based tracking ID persistence: set `tid` cookie in response with 1-year expiry for browser clients.
- Rate limiting: `rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false })`.

**Anti-Patterns**
- Requiring auth on tracking endpoints (blocks analytics from unauthenticated visitors).
- Missing rate limiting (opens DDoS attack surface on public endpoints).
- No CORS configuration (tracking snippet cannot call API from browser).
- Leaking `organizationId` in tracking responses (exposes tenant data).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Site tracking is an infrastructure integration adapter for the CRM bounded context. Events are captured anonymously and enriched with CRM identity via the identity bridge.
- TDD: Write integration tests with mocked DB. Test pageview, identify, event creation, and rate limiting.
- BDD: "When a visitor lands on a pricing page and is later identified as a known contact, their pageview is retroactively linked to their CRM contact record."
- Deep Module: `TrackingService.recordPageview(payload)` hides tracking ID assignment, site resolution, activity creation (for identified visitors), and event storage.

---

### Subtasks
- [ ] API-CRM-036.0.25 (AGENT): Read API-CRM-036, DB-CRM-011 schema, ActivityService API, and rate-limiting library options.
  *No action — pause until fully understood.*

- [ ] API-CRM-036.0.5 (AGENT): Research `express-rate-limit` v7 configuration, CORS middleware setup for specific routes, and identity bridge patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] API-CRM-036.0.75 (AGENT): Confirm organisation resolution strategy (how does a tracking event know which org it belongs to? via `site_id`?) with user.
  *If uncertain, ask the user before executing.*

- [ ] API-CRM-036.1 (AGENT): Add tracking endpoints to OpenAPI spec.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CRM-036.2 (AGENT): Write integration tests (red phase).
  **File(s):** `artifacts/api-server/__tests__/api/tracking.test.ts`
  **Verification:** All fail (red)

- [ ] API-CRM-036.3 (AGENT): Implement `TrackingService` with tracking ID assignment, identity bridge, and activity creation.
  **File(s):** `artifacts/api-server/src/services/crm/tracking-service.ts`
  **Verification:** `pnpm test -- tracking-service.test.ts` unit tests pass

- [ ] API-CRM-036.4 (AGENT): Create routes with rate limiting and CORS; run integration tests to green.
  **File(s):** `artifacts/api-server/src/routes/tracking.ts`
  **Verification:** `pnpm test -- tracking.test.ts` all green ; `pnpm typecheck`

- [ ] API-CRM-036.5 (HUMAN): Security review and sign-off. Verify rate limiting, CORS, and no org data leakage.
  **Verification:** Approved; rate limiting confirmed; no sensitive data in responses; all tests green.

---

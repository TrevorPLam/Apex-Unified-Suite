# TODO-P3-INFRASTRUCTURE.md – Phase 3: Cross-Cutting Infrastructure

## Tasks in this file
- RBAC-001: Role-Based Access Control Middleware
- EVENT-001: Domain Event Bus Infrastructure
- API-SPEC-001: OpenAPI Spec Modularisation
- API-CROSS-001: Cross-Module Bulk Operations Infrastructure

---

## [ ] RBAC-001: Role-Based Access Control Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No RBAC middleware exists; authenticated routes are unprotected beyond JWT validation from AUTH-008.
**Size:** Large

**Description:** Implement a role-based access control middleware factory that enforces per-resource, per-action permissions on all protected API routes, backed by the `user_roles` and `roles` database tables with a 5-minute in-memory LRU cache.

**Depends on:** AUTH-008 (JWT middleware setting `req.user`), DB-IDENTITY-005 (`users`, `roles`, `user_roles` tables), ERROR-002 (domain errors).
**Blocks:** API-CRM-004, API-CRM-009, API-CRM-013, API-CRM-017, API-CRM-021, all Finance and Projects route tasks (API-FIN-004, API-PROJ-004, etc.).
**Related Files:** `artifacts/api-server/src/middlewares/rbac.ts`, `artifacts/api-server/src/lib/permissions/permissions.ts`

**Imports / Exports**
- Imports: `req.user` JWT payload (AUTH-008), `roles` + `user_roles` DB tables (DB-IDENTITY-005), `DomainError` type (ERROR-002), `db` pool (lib/db)
- Exports: `requirePermission(context: string, resource: string, action: string): RequestHandler`, `PERMISSIONS` constants map

**Definition of Done**
- [ ] `artifacts/api-server/src/middlewares/rbac.ts` exports `requirePermission(context, resource, action)` factory returning an Express `RequestHandler`.
- [ ] Middleware reads `req.user.userId` and `req.user.organizationId` from JWT payload set by AUTH-008.
- [ ] Queries `user_roles JOIN roles` for the user's effective permissions scoped to their organisation.
- [ ] Permission format: `{context}:{resource}:{action}` (e.g., `crm:leads:create`). Admin wildcard: `*:*:*`.
- [ ] Returns `403 InsufficientPermissions` when user lacks the required permission.
- [ ] Permissions cached per `(userId, organizationId)` with 5-minute TTL using `lru-cache`.
- [ ] Unit tests cover: admin bypass, permission match, permission deny, cache hit, cache expiry, missing `req.user`.
- [ ] Integration test verifies 403 on a mocked Express route.
- [ ] `pnpm typecheck` passes with no errors.

**Out of Scope**
- Dynamic permission CRUD via Settings API (future phase)
- Attribute-Based Access Control (ABAC) or row-level security
- Cross-organisation permission leakage auditing
- Frontend permission UI

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never drop or truncate: `roles`, `user_roles` tables

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/middlewares/rbac.ts`, `artifacts/api-server/src/lib/permissions/permissions.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/middlewares/rbac.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] (schema owned by DB-IDENTITY-005)

**Rollback**
- Granularity: file-level
- Delete `rbac.ts` and `permissions.ts`; revert any `requirePermission` imports in route files.
- Halt condition: `pnpm typecheck` failure or any existing test regression stops all changes.

**Rules to Follow**
- No `throw` — use `neverthrow` Result types or pass errors via `next(err)`.
- LRU cache size cap: 1000 entries maximum to bound memory use.
- Log permission denials at `warn` level via Pino; never expose role names in HTTP error body.
- All permission strings must live in `permissions.ts` as typed constants; no inline literals.
- Follow Express 5 async middleware signature: `async (req, res, next) => void`.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/middlewares/rbac.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Middleware factory: `requirePermission('crm', 'leads', 'create')` returns a `RequestHandler` — narrow interface hiding complex logic.
- `lru-cache` v10+ API for typed TTL caching: `new LRUCache<string, Set<string>>({ max: 1000, ttl: 300_000 })`.
- Wildcard matching: `*:*:*` grants all; `crm:*:*` grants all CRM; `crm:leads:*` grants all lead actions.
- `PERMISSIONS.CRM.LEADS.CREATE = 'crm:leads:create'` enum-style constants prevent typos.

**Anti-Patterns**
- DB query on every request without caching (performance killer at scale).
- Hardcoding role names inline in route guards instead of using permission constants.
- Silently allowing on DB lookup failure (must 500, not false-allow).
- Exposing role or permission details in 403 error response bodies (information leakage).

**DDD / TDD / BDD / Deep Module notes**
- DDD: RBAC enforces bounded-context access rules at the infrastructure layer, preserving domain integrity without polluting domain services.
- TDD: Write all unit tests before implementing the middleware (red phase). Do not write implementation until tests exist.
- BDD: "Given a user with `user` role, when they `POST /crm/leads`, then the API returns 403 InsufficientPermissions."
- Deep Module: `requirePermission` exposes a 3-argument factory (narrow interface) hiding DB lookup, wildcard matching, LRU caching, and error formatting.

---

### Subtasks
- [ ] RBAC-001.0.25 (AGENT): Read RBAC-001, AUTH-008, DB-IDENTITY-005, ERROR-002, and all related files listed above.
  *No action — pause until fully understood.*

- [ ] RBAC-001.0.5 (AGENT): Research `lru-cache` v10 API, Express 5 middleware typing, and RBAC permission string conventions as of May 2026.
  *Document findings briefly or note "no changes."*

- [ ] RBAC-001.0.75 (AGENT): Confirm the 3-part permission string format and wildcard matching strategy. If roles schema is unclear, ask user before proceeding.
  *If uncertain, ask the user before executing.*

- [ ] RBAC-001.1 (AGENT): Define `PERMISSIONS` constants map and role-to-permissions matrix (`admin`, `manager`, `user`).
  **File(s):** `artifacts/api-server/src/lib/permissions/permissions.ts`
  **Verification:** `pnpm typecheck`

- [ ] RBAC-001.2 (AGENT): Implement `requirePermission` factory with DB lookup and 403 response; no caching yet.
  **File(s):** `artifacts/api-server/src/middlewares/rbac.ts`
  **Verification:** `pnpm test -- rbac.test.ts -t "denies without permission"`

- [ ] RBAC-001.3 (AGENT): Add LRU cache (TTL 5 min, max 1000 entries) for `(userId, orgId)` permission sets.
  **File(s):** `artifacts/api-server/src/middlewares/rbac.ts`
  **Verification:** `pnpm test -- rbac.test.ts -t "cache hit"` ; `pnpm test -- rbac.test.ts -t "cache expiry"`

- [ ] RBAC-001.4 (AGENT): Write unit tests — admin bypass, match, deny, cache hit/miss, wildcard, missing `req.user`.
  **File(s):** `artifacts/api-server/__tests__/middlewares/rbac.test.ts`
  **Verification:** `pnpm test -- rbac.test.ts` all green

- [ ] RBAC-001.5 (AGENT): Integration test — mocked Express route returns 403 when permission absent, 200 when present.
  **File(s):** `artifacts/api-server/__tests__/middlewares/rbac.test.ts`
  **Verification:** `pnpm test -- rbac.test.ts` all green; `pnpm typecheck` clean

- [ ] RBAC-001.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved; `pnpm typecheck` clean; all tests green.

---

## [ ] EVENT-001: Domain Event Bus Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No domain event bus exists; no mechanism for decoupled communication between bounded contexts.
**Size:** Large

**Description:** Build a type-safe, in-process domain event bus that supports fire-and-forget async event publishing with error-isolated handlers and an in-memory event store for test replay, underpinning all domain event emission across every bounded context.

**Depends on:** None (infrastructure foundation — must be built before any domain task that emits events).
**Blocks:** API-CRM-003 (LeadCreated), API-FIN-003 (InvoiceCreated), API-PROJ-003 (ProjectCompleted), and all other domain event emission subtasks.
**Related Files:** `artifacts/api-server/src/events/domain-event-bus.ts`, `artifacts/api-server/src/events/event-types.ts`

**Imports / Exports**
- Imports: `zod` (schema validation), `pino` logger (Pino instance from app bootstrap)
- Exports: `DomainEventBus` class (singleton), `publish(event)`, `subscribe(eventType, handler)`, `DomainEvent` base type, all domain event Zod schemas from `event-types.ts`

**Definition of Done**
- [ ] `artifacts/api-server/src/events/event-types.ts` exports Zod schemas for all initial domain events: `LeadCreated`, `LeadStageChanged`, `InvoiceCreated`, `InvoicePaid`, `ProjectCompleted`, `TaskCompleted`, `UserRegistered` (integration event).
- [ ] `artifacts/api-server/src/events/domain-event-bus.ts` exports `DomainEventBus` class with `publish(event)` and `subscribe(type, handler)` methods.
- [ ] `publish` is async and fire-and-forget; handler errors are caught, logged at `error` level, and do not propagate to the caller.
- [ ] Each handler runs in isolation — one handler failure does not prevent others from running.
- [ ] In-memory event store records all published events; `getEvents(type?)` and `clearEvents()` support test replay/assertion.
- [ ] Performance monitoring: event processing time logged at `debug` level.
- [ ] Unit tests cover: publish+subscribe, error isolation, event store replay, handler deregistration, typed schema validation rejection.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Durable/persistent event storage (database-backed event store) — future phase
- Message broker integration (Kafka, RabbitMQ, Redis Streams)
- Cross-service event distribution (microservice communication)
- Dead-letter queues or retry logic for handler failures

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never write event payloads containing raw PII to logs

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/events/domain-event-bus.ts`, `artifacts/api-server/src/events/event-types.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/events/domain-event-bus.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level
- Delete `domain-event-bus.ts` and `event-types.ts`; revert all `publish()`/`subscribe()` call sites.
- Halt condition: `pnpm typecheck` failure or any unit test regression stops all changes.

**Rules to Follow**
- All handler errors must be caught and logged; never let them escape `publish()`.
- Event schemas must be validated with Zod at publish time; invalid events throw synchronously before reaching handlers.
- The event bus singleton must be initialised once at app startup and injected via constructor/DI — not via module-level global import side effects.
- Distinguish domain events (internal aggregate state changes) from integration events (cross-context notifications) in the type system.
- Use `correlationId` and `causationId` metadata fields on all events for distributed tracing readiness.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/events/domain-event-bus.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- Typed `EventMap` discriminated union for compile-time handler type safety.
- Zod `z.discriminatedUnion('type', [...])` for the combined event schema.
- `Promise.allSettled` for parallel handler execution with isolated error capture.
- In-memory `EventStore` class with `push` / `getEvents(type?)` / `clearEvents()` for test assertions without mocking.
- `correlationId` propagated via `AsyncLocalStorage` context (Node.js 18+).

**Anti-Patterns**
- Synchronous event processing that blocks the request/response cycle.
- No event validation — allows malformed events to corrupt handler state.
- Global module-level side effects for handler registration (breaks test isolation).
- One handler failure silently stopping all other handlers.
- Using EventEmitter directly without Zod validation and typing (lose type safety).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain events communicate state changes within and between bounded contexts without tight coupling. Distinguish `LeadCreated` (domain event, internal to CRM) from `UserRegistered` (integration event, crosses context boundaries).
- TDD: Write bus unit tests first. Test that a published event reaches its subscriber. Test that handler errors are isolated. Test event store replay.
- BDD: "When a lead is created, the `LeadCreated` event is emitted and the notification handler receives it without blocking the HTTP response."
- Deep Module: `DomainEventBus` exposes 2 methods (`publish`, `subscribe`) hiding async dispatch, error isolation, schema validation, event storage, and performance monitoring.

---

### Subtasks
- [ ] EVENT-001.0.25 (AGENT): Read EVENT-001 and all downstream tasks that depend on it. Understand which events are needed at this phase.
  *No action — pause until fully understood.*

- [ ] EVENT-001.0.5 (AGENT): Research in-process event bus patterns for Node.js 22+ (as of May 2026), `AsyncLocalStorage` for correlation ID propagation, and `Promise.allSettled` handler isolation patterns.
  *Document findings briefly or note "no changes."*

- [ ] EVENT-001.0.75 (AGENT): Reason about the singleton lifecycle (startup injection vs module import), and whether the in-memory event store should be a separate class. Confirm with user if uncertain.
  *If uncertain, ask the user before executing.*

- [ ] EVENT-001.1 (AGENT): Define Zod event schemas for all Phase 3 domain events with `type`, `aggregateId`, `aggregateType`, `data`, and `metadata` fields.
  **File(s):** `artifacts/api-server/src/events/event-types.ts`
  **Verification:** `pnpm typecheck`

- [ ] EVENT-001.2 (AGENT): Implement `DomainEventBus` with `publish` (async fire-and-forget) and `subscribe`.
  **File(s):** `artifacts/api-server/src/events/domain-event-bus.ts`
  **Verification:** `pnpm test -- domain-event-bus.test.ts -t "publishes to subscriber"`

- [ ] EVENT-001.3 (AGENT): Add handler error isolation using `Promise.allSettled`; log failures at `error` level.
  **File(s):** `artifacts/api-server/src/events/domain-event-bus.ts`
  **Verification:** `pnpm test -- domain-event-bus.test.ts -t "handler error does not propagate"`

- [ ] EVENT-001.4 (AGENT): Implement in-memory `EventStore` with `push`, `getEvents(type?)`, `clearEvents()` for test support.
  **File(s):** `artifacts/api-server/src/events/domain-event-bus.ts`
  **Verification:** `pnpm test -- domain-event-bus.test.ts -t "event store replay"`

- [ ] EVENT-001.5 (AGENT): Add Zod schema validation at publish time; invalid events rejected synchronously before dispatch.
  **File(s):** `artifacts/api-server/src/events/domain-event-bus.ts`
  **Verification:** `pnpm test -- domain-event-bus.test.ts -t "rejects invalid event schema"`

- [ ] EVENT-001.6 (AGENT): Write comprehensive unit tests covering all above cases; target ≥90% coverage.
  **File(s):** `artifacts/api-server/__tests__/events/domain-event-bus.test.ts`
  **Verification:** `pnpm test -- domain-event-bus.test.ts --coverage` ≥90%

- [ ] EVENT-001.7 (HUMAN): Final review and sign-off.
  **Verification:** Approved; `pnpm typecheck` clean; all tests green.

---

## [ ] API-SPEC-001: OpenAPI Spec Modularisation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Single monolithic `openapi.yaml`; will exceed 500 lines once Phase 3 API paths are added.
**Size:** Medium

**Description:** When the main OpenAPI spec grows beyond ~500 lines, split it into per-context files under `lib/api-spec/contexts/` using `$ref` pointers, preserving a single coherent spec and unbroken Orval codegen.

**Depends on:** None — triggered by spec size growth. Preferably done before adding Phase 3 paths so codegen workflow is established.
**Blocks:** All Phase 4+ API expansion tasks (prevents spec becoming unmanageable).
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-spec/contexts/` (new directory), `lib/api-spec/orval.config.ts`

**Imports / Exports**
- Imports: [N/A] (YAML spec, no TypeScript imports)
- Exports: `lib/api-spec/openapi.yaml` (remains the single entry point for Orval), context YAML files via `$ref`

**Definition of Done**
- [ ] `lib/api-spec/contexts/` directory created with `crm.yaml`, `auth.yaml`, `finance.yaml`, `projects.yaml`.
- [ ] Main `openapi.yaml` uses `$ref` pointers to context files for all paths and component schemas.
- [ ] `pnpm --filter @workspace/api-spec run codegen` produces identical output before and after modularisation.
- [ ] `pnpm typecheck` passes with no regressions.
- [ ] Orval config updated if needed to handle modular resolution.
- [ ] No circular `$ref` references (validated by `spectral` or similar linter).

**Out of Scope**
- Per-endpoint-level files (only per-context)
- GraphQL schema modularisation
- Breaking the single entry-point contract (Orval must still consume one file)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/` (these are codegen outputs)
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `lib/api-spec/contexts/*.yaml`, `lib/api-spec/orval.config.ts`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level
- Revert `openapi.yaml` to monolithic version; delete `contexts/` directory.
- Halt condition: `pnpm codegen` output differs from pre-modularisation baseline OR `pnpm typecheck` fails.

**Rules to Follow**
- Each context YAML must be self-contained (no cross-context `$ref` at the component level; use inline schemas or a `common.yaml`).
- No circular references — validate with `spectral lint` before committing.
- Codegen output must be bit-for-bit identical after modularisation (verify with git diff on generated files).
- Orval 8+ handles bundled `$ref` resolution natively; do not downgrade.

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm typecheck
git diff lib/api-client-react/src/generated/  # must be empty
```

**Advanced Code Patterns**
- OpenAPI 3.1 `$ref` path encoding: `/crm/leads` → `~1crm~1leads` in `$ref` fragments.
- `common.yaml` component schemas (PaginationMeta, ErrorResponse, etc.) shared across contexts via `$ref`.
- Orval 8 `inputPath` supports a single bundled YAML — use `swagger-parser` bundle step if needed.

**Anti-Patterns**
- Duplicating shared schemas (PaginationMeta, ErrorResponse) in multiple context files — use `common.yaml`.
- Circular `$ref` chains that break Orval resolution.
- Context files that import from each other — only the main spec imports from contexts.
- Losing examples after modularisation (verify all examples survive `codegen`).

**DDD / TDD / BDD / Deep Module notes**
- DDD: Each bounded context owns its API specification; `crm.yaml` belongs to the CRM context. The main `openapi.yaml` is the published interface contract.
- TDD: Verify `pnpm codegen` output is unchanged before and after. Use git diff on generated files as the test.
- BDD: [N/A] — infrastructure concern.
- Deep Module: [N/A] — specification organisation, not a code module.

---

### Subtasks
- [ ] API-SPEC-001.0.25 (AGENT): Read the current `openapi.yaml` and Orval config. Note current line count and which sections belong to which context.
  *No action — pause until fully understood.*

- [ ] API-SPEC-001.0.5 (AGENT): Research Orval 8+ `$ref` resolution behaviour and `swagger-parser` bundling (as of May 2026). Check if bundling step is needed.
  *Document findings briefly or note "no changes."*

- [ ] API-SPEC-001.0.75 (AGENT): Confirm trigger condition with user (500 lines? or do it immediately?). Proceed only when spec is at or approaching the threshold.
  *If uncertain, ask the user before executing.*

- [ ] API-SPEC-001.1 (AGENT): Create `lib/api-spec/contexts/` and extract CRM paths/schemas into `crm.yaml`.
  **File(s):** `lib/api-spec/contexts/crm.yaml`, `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm --filter @workspace/api-spec run codegen` ; `git diff lib/api-client-react/src/generated/` empty

- [ ] API-SPEC-001.2 (AGENT): Extract Auth paths/schemas into `contexts/auth.yaml`.
  **File(s):** `lib/api-spec/contexts/auth.yaml`, `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-SPEC-001.3 (AGENT): Extract Finance and Projects paths/schemas into their context files.
  **File(s):** `lib/api-spec/contexts/finance.yaml`, `lib/api-spec/contexts/projects.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-SPEC-001.4 (AGENT): Update `orval.config.ts` if Orval requires changes for modular resolution.
  **File(s):** `lib/api-spec/orval.config.ts`
  **Verification:** `pnpm codegen` produces identical output

- [ ] API-SPEC-001.5 (HUMAN): Run codegen, verify output, and sign off.
  **Verification:** `pnpm typecheck` passes; `git diff lib/api-client-react/src/generated/` is empty; Approved.

---

## [ ] API-CROSS-001: Cross-Module Bulk Operations Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No bulk operation endpoint exists; each module handles operations individually, requiring multiple API calls for batch actions.
**Size:** Large

**Description:** Implement a generic `POST /api/v1/bulk` endpoint that accepts a batch of sub-operations (method + path + body), executes them in parallel with concurrency limits, returns per-operation success/failure results, and logs the entire batch as a single audit entry.

**Depends on:** AUTH-008 (auth middleware), ERROR-001 (global error handler), RBAC-001 (permission checks per sub-operation).
**Blocks:** No hard blockers — enables bulk UX patterns for Finance (batch approve bills), CRM (bulk assign leads), Projects (bulk move tasks). Referenced by Phase 4+ frontend tasks.
**Related Files:** `artifacts/api-server/src/routes/bulk.ts`, `artifacts/api-server/src/services/infrastructure/bulk-operation-service.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: Express `app` or internal router (for sub-request dispatch), `req.user` (AUTH-008), audit logger, rate-limiter middleware
- Exports: `BulkOperationService`, `/api/v1/bulk` route registered in `routes/index.ts`

**Definition of Done**
- [ ] `POST /api/v1/bulk` accepts `{ operations: [{ method, path, body? }][] }` with max 100 operations per request.
- [ ] Each operation is dispatched as an internal sub-request with the same auth context (same JWT).
- [ ] Operations execute in parallel using `Promise.allSettled` with configurable concurrency (default 10).
- [ ] All operations must belong to the same organisation (validated before execution).
- [ ] Returns `{ summary: { total, succeeded, failed }, results: [{ index, status, data | error }][] }`.
- [ ] Rate limited: max 5 bulk requests per organisation per minute (returns 429 when exceeded).
- [ ] Each bulk request logged as a single audit entry with operation count and outcome summary.
- [ ] Integration tests cover: mixed success/failure, org validation, rate limiting, empty operations array → 400.
- [ ] `pnpm typecheck` passes.

**Out of Scope**
- Transactional bulk operations (all-or-nothing rollback across operations)
- Streaming progress updates (WebSocket/SSE) for long-running bulk jobs
- Scheduled/deferred bulk execution
- Operations spanning multiple organisations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never modify: `pnpm-workspace.yaml`, root `tsconfig.json`, `tsconfig.base.json`, `.replit`
- Never commit: `.env*`, credentials, secrets
- Never bypass per-operation RBAC checks (each sub-operation must be authorised independently)

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/infrastructure/bulk-operation-service.ts`, `artifacts/api-server/src/routes/bulk.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/__tests__/api/infrastructure/bulk-operations.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level
- Remove `bulk.ts` route and `bulk-operation-service.ts`; remove route mount from `routes/index.ts`.
- Halt condition: any per-operation RBAC bypass found in testing stops all changes immediately.

**Rules to Follow**
- Each sub-operation must run through the same RBAC and validation middleware as a direct request.
- Operations from different organisations must be rejected before any execution begins.
- Rate limit is per organisation, not per user, to prevent abuse via multiple accounts.
- Never expose internal server errors from sub-operations in the bulk response body unredacted.
- Max 100 operations per request — return 400 `BulkOperationLimitExceeded` if exceeded.

**Verification**
```bash
pnpm test -- artifacts/api-server/__tests__/api/infrastructure/bulk-operations.test.ts
pnpm typecheck
```

**Advanced Code Patterns**
- `Promise.allSettled` with chunked concurrency (p-limit or manual batching) to prevent event-loop saturation.
- Internal sub-request dispatch via Express `app.handle()` with synthetic IncomingMessage objects — avoids HTTP round-trips.
- Organisation validation before first operation: fail-fast on cross-org attempts.
- Structured audit log entry: `{ bulkId, userId, orgId, operationCount, succeeded, failed, durationMs }`.

**Anti-Patterns**
- Sequential operation execution (O(n) latency instead of O(1) with parallelism).
- No partial failure handling — an all-or-nothing approach breaks the atomicity guarantee users expect.
- Missing rate limiting allowing a single organisation to saturate the server.
- Re-using the same RBAC cache entry for all sub-operations without per-operation auth re-validation.
- Returning internal stack traces in operation error results.

**DDD / TDD / BDD / Deep Module notes**
- DDD: `BulkOperationService` is infrastructure — it orchestrates across bounded contexts without owning domain logic. It must not embed business rules; those remain in individual services.
- TDD: Write integration tests first (red): batch of 2 succeeds, batch with one invalid op returns mixed results, cross-org batch rejected entirely.
- BDD: "As a Finance manager, I can approve 20 bills at once via a single POST /api/v1/bulk request and see per-bill results."
- Deep Module: `BulkOperationService.execute(ops, context)` hides parallel dispatch, concurrency limits, result aggregation, rate check, and audit logging behind one method call.

---

### Subtasks
- [ ] API-CROSS-001.0.25 (AGENT): Read API-CROSS-001, AUTH-008, RBAC-001, ERROR-001 and all related files.
  *No action — pause until fully understood.*

- [ ] API-CROSS-001.0.5 (AGENT): Research internal sub-request dispatch patterns in Express 5 (as of May 2026), p-limit concurrency control, and bulk API design best practices.
  *Document findings briefly or note "no changes."*

- [ ] API-CROSS-001.0.75 (AGENT): Determine sub-request dispatch strategy (synthetic IncomingMessage vs HTTP loopback). Confirm with user if internal dispatch is acceptable.
  *If uncertain, ask the user before executing.*

- [ ] API-CROSS-001.1 (AGENT): Add `POST /api/v1/bulk` schema to OpenAPI spec with request/response schemas.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`

- [ ] API-CROSS-001.2 (AGENT): Implement `BulkOperationService.execute()` with parallel dispatch, concurrency limits, and `Promise.allSettled` result collection.
  **File(s):** `artifacts/api-server/src/services/infrastructure/bulk-operation-service.ts`
  **Verification:** `pnpm test -- bulk-operation-service.test.ts` unit tests pass

- [ ] API-CROSS-001.3 (AGENT): Add organisation validation — reject cross-org batches before executing any operation.
  **File(s):** `artifacts/api-server/src/services/infrastructure/bulk-operation-service.ts`
  **Verification:** `pnpm test -- bulk-operations.test.ts -t "rejects cross-org batch"`

- [ ] API-CROSS-001.4 (AGENT): Implement rate limiting (5 bulk requests/org/min) using an in-memory sliding-window counter.
  **File(s):** `artifacts/api-server/src/middlewares/bulk-rate-limit.ts`
  **Verification:** `pnpm test -- bulk-operations.test.ts -t "rate limit"` returns 429

- [ ] API-CROSS-001.5 (AGENT): Add structured audit logging for each bulk request.
  **File(s):** `artifacts/api-server/src/services/infrastructure/bulk-operation-service.ts`
  **Verification:** Log entry appears with correct fields in test output

- [ ] API-CROSS-001.6 (AGENT): Create route, mount under `/api/v1/bulk` in `routes/index.ts`, wire to service.
  **File(s):** `artifacts/api-server/src/routes/bulk.ts`, `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm test -- bulk-operations.test.ts` all green; `pnpm typecheck`

- [ ] API-CROSS-001.7 (HUMAN): Final review and sign-off.
  **Verification:** Approved; `pnpm typecheck` clean; all tests green.

---

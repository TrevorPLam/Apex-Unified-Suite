# TODO-P2-INFRASTRUCTURE.md – Phase 2: Infrastructure & Multi-Tenancy Foundation

This file covers the foundational Phase 2 infrastructure tasks that must complete before any business-domain schema or integration work begins: test infrastructure setup, development database logging, the BaseRepository pattern, and the Organizations table (multi-tenancy anchor). These four tasks form the critical path for all Phase 2 and Phase 3 work.

---

## [ ] TEST-INFRA-001: Test Infrastructure Setup
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No test infrastructure exists. `lib/db/src/__tests__/` does not exist. Vitest is present as a dev dependency but no integration test setup, test database utilities, or server harness have been configured.
**Size:** Medium

**Description:** Establish the complete integration-test infrastructure — a separate test database, Vitest config, a reusable test-server harness, database seed/teardown utilities, and JWT helpers — so every subsequent Phase 2+ task can write TDD-style integration tests from day one.

**Depends on:** DEP-001 (vitest installed), DB-ORG-001 (organizations table as seeding foundation)
**Blocks:** All integration tests across Phase 2, Phase 3, and beyond
**Related Files:** `artifacts/api-server/vitest.config.ts`, `artifacts/api-server/src/__tests__/utils/test-server.ts`, `artifacts/api-server/src/__tests__/utils/test-db.ts`, `artifacts/api-server/src/__tests__/utils/auth-helpers.ts`, `artifacts/api-server/src/__tests__/api/example.integration.test.ts`

**Imports / Exports**
- Imports: `express`, `@workspace/db` (pool, db), `vitest` (describe, it, expect, beforeAll, afterAll), JWT signing utilities from auth services
- Exports: `createTestServer()`, `seedTestDatabase()`, `teardownTestDatabase()`, `generateTestToken()`, `TEST_ORG_ID` constant

**Definition of Done**
- [ ] `TEST_DATABASE_URL` environment variable is documented and used; tests never touch the production database
- [ ] `artifacts/api-server/vitest.config.ts` configured with `globalSetup` for DB migration and `setupFiles` for per-test teardown
- [ ] `src/__tests__/utils/test-db.ts` exports `seedTestDatabase()` and `teardownTestDatabase()` with table truncation
- [ ] `src/__tests__/utils/test-server.ts` exports `createTestServer()` returning a fully wired Express app + supertest agent
- [ ] `src/__tests__/utils/auth-helpers.ts` exports `generateTestToken(userId, orgId, role)` producing valid JWTs for test requests
- [ ] `src/__tests__/api/example.integration.test.ts` passes against the `/healthz` endpoint demonstrating the full pattern
- [ ] Multiple tests run in isolation — data from one test does not affect another
- [ ] `pnpm --filter @workspace/api-server test` passes with zero failures

**Out of Scope**
- End-to-end (Playwright/Cypress) test setup — this is unit/integration only
- CI/CD pipeline configuration
- Test data factories beyond minimal seed helpers
- Performance benchmarking infrastructure

**Safety Boundaries**
- Never connect tests to the production `DATABASE_URL` — always use `TEST_DATABASE_URL`
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `DATABASE_URL`, `TEST_DATABASE_URL`, credentials, secrets
- Never run `drizzle-kit push` on the test database without schema verification

**Output Artifacts**
- Code changes in: `artifacts/api-server/vitest.config.ts`, `artifacts/api-server/src/__tests__/utils/`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/example.integration.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete the `__tests__/utils/` directory and revert `vitest.config.ts`; no persistent state change
- Halt condition: if `pnpm --filter @workspace/api-server test` cannot resolve the test database connection, stop and verify `TEST_DATABASE_URL` before proceeding

**Rules to Follow**
- Tests must be fully isolated — `teardownTestDatabase()` must truncate all tables in a deterministic order respecting FK constraints
- JWTs generated in tests must use the same algorithm (HS256/RS256) as the production auth service to catch signing mismatches early
- Test server must not start a real HTTP listener — use supertest's `request(app)` pattern to avoid port conflicts
- `TEST_DATABASE_URL` must point to a dedicated test schema or database, never the app database

**Verification**
```bash
# Run example integration test
pnpm --filter @workspace/api-server test -- example.integration.test.ts

# Run full test suite
pnpm --filter @workspace/api-server test

# Typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Vitest `globalSetup` for one-time schema migrations; `setupFiles` for per-test table truncation — keeps tests fast (truncate vs drop/recreate)
- Supertest `request(app)` pattern — no live port, no teardown race conditions
- `generateTestToken()` must accept a `role` parameter to test RBAC scenarios without mocking the entire auth middleware
- Use `vi.mock()` sparingly — prefer real DB calls against the test database for integration tests to catch actual query bugs

**Anti-Patterns**
- Using the production database for tests — data corruption and flaky CI
- No cleanup between tests — order-dependent test failures
- Mocking the database layer in integration tests — masks real query bugs
- Starting a live HTTP server on a real port — port conflicts in parallel CI

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — pure infrastructure.
- TDD: This task IS the TDD enabler. All subsequent red-green cycles depend on this infrastructure being in place.
- BDD: Provides the runtime for all executable BDD scenarios defined in `.feature` files.
- Deep Module: The `createTestServer()` and `seedTestDatabase()` utilities are the deep-module interface — callers get simple functions; all Express wiring, DB connection, and migration complexity is hidden inside.

---

### Subtasks

- [ ] TEST-INFRA-001.0.25 (AGENT): Read this task and `artifacts/api-server/src/app.ts` to understand the Express application structure.
  *No action — pause until fully understood.*

- [ ] TEST-INFRA-001.0.5 (AGENT): Research Vitest `globalSetup` vs `setupFiles` patterns for integration tests with databases (May 2026). Confirm supertest compatibility with Express 5.
  *Document findings briefly.*

- [ ] TEST-INFRA-001.0.75 (AGENT): Reason about test isolation strategy (truncate vs transactions) and whether Vitest's `--pool=forks` or `--pool=threads` is safer for DB tests.
  *If uncertain, default to `forks` for DB isolation.*

- [ ] TEST-INFRA-001.1 (AGENT): Configure Vitest for integration testing with DB setup and teardown hooks.
  **File(s):** `artifacts/api-server/vitest.config.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- --list` shows test discovery working.

- [ ] TEST-INFRA-001.2 (AGENT): Create test database utilities (connect, seed, teardown with FK-safe truncation).
  **File(s):** `artifacts/api-server/src/__tests__/utils/test-db.ts`
  **Verification:** Import compiles; `pnpm run typecheck` clean.

- [ ] TEST-INFRA-001.3 (AGENT): Implement test server harness returning a supertest-ready Express app.
  **File(s):** `artifacts/api-server/src/__tests__/utils/test-server.ts`
  **Verification:** Import compiles; `pnpm run typecheck` clean.

- [ ] TEST-INFRA-001.4 (AGENT): Create JWT test-token generator.
  **File(s):** `artifacts/api-server/src/__tests__/utils/auth-helpers.ts`
  **Verification:** Import compiles; generated tokens pass `jwt.verify()`.

- [ ] TEST-INFRA-001.5 (AGENT): Write example integration test hitting `/healthz`.
  **File(s):** `artifacts/api-server/src/__tests__/api/example.integration.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- example.integration.test.ts` → GREEN.

- [ ] TEST-INFRA-001.6 (AGENT): Add global cleanup hooks; verify multiple tests do not bleed state.
  **Verification:** Run suite twice in succession; results are identical.

- [ ] TEST-INFRA-001.7 (HUMAN): Review test infrastructure, confirm `TEST_DATABASE_URL` is set in dev environment, and run full suite.
  **Verification:** `pnpm --filter @workspace/api-server test` → all green.

- [ ] TEST-INFRA-001.8 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-LOGGER-001: Add Drizzle Slow-Query Logger
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `lib/db/src/index.ts` creates the Drizzle instance with no logging. Slow queries in development go undetected.
**Size:** Small

**Description:** Attach a development-only slow-query logger to the Drizzle instance that logs any query exceeding a configurable threshold, enabling proactive performance debugging before queries reach production.

**Depends on:** DB-ORG-001 (database connection established with at least one table to query)
**Blocks:** [N/A] — development utility only
**Related Files:** `lib/db/src/index.ts`

**Imports / Exports**
- Imports: `drizzle` from `drizzle-orm/node-postgres`; `Pool` from `pg`; Pino logger (if shared logger is available, otherwise `console`)
- Exports: No new exports — modifies existing `db` and `pool` exports in `lib/db/src/index.ts`

**Definition of Done**
- [ ] `lib/db/src/index.ts` includes a `logger` object passed to `drizzle()` that is active only when `NODE_ENV !== 'production'`
- [ ] Logger records queries slower than `SLOW_QUERY_THRESHOLD_MS` (env var, default `500`)
- [ ] Log output includes: query SQL, parameters (sanitised — no PII), and execution time in ms
- [ ] Log format is structured JSON compatible with Pino
- [ ] Production builds (`NODE_ENV=production`) produce zero logging overhead from this logger
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Production query monitoring or APM integration
- Distributed tracing (OpenTelemetry)
- Query plan analysis (`EXPLAIN ANALYZE`)
- Alerting or metrics emission

**Safety Boundaries**
- Never log raw query parameters that may contain PII or secrets — sanitise or mask them
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/index.ts`
- Tests added/updated in: [N/A] — logger is validated by running a query in dev and observing output
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — remove the logger object from the `drizzle()` call; the existing `db` export is unchanged
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Logger must be a no-op in production — guard with `process.env.NODE_ENV !== 'production'`
- Use Pino structured logging format: `{ level: 'warn', msg: 'slow query', sql, durationMs, threshold }`
- `SLOW_QUERY_THRESHOLD_MS` env var must have a safe default (500) and be validated as a positive integer
- Never log full parameter values — log parameter count or masked placeholders only

**Verification**
```bash
# Typecheck
pnpm run typecheck

# Manual verification: run a query in dev and inspect logs
NODE_ENV=development SLOW_QUERY_THRESHOLD_MS=1 pnpm --filter @workspace/api-server run dev
# Then hit any endpoint and confirm slow-query log appears in console
```

**Advanced Code Patterns**
- Drizzle's `logger` option accepts a `{ logQuery(query, params) }` object — wrap this with a `Date.now()` diff to measure duration
- Use conditional export: `const logger = process.env.NODE_ENV !== 'production' ? slowQueryLogger : undefined` to guarantee zero overhead in prod builds

**Anti-Patterns**
- Logging in production — performance overhead and potential PII exposure
- Logging raw SQL parameters — may contain passwords, tokens, or personal data
- Hard-coded threshold — always read from env var with a safe default

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure utility.
- TDD: [N/A] — no unit tests needed; validated by manual observation in dev.
- BDD: [N/A] — developer tooling, not user-facing behaviour.
- Deep Module: The logger is a thin wrapper that hides timing complexity behind Drizzle's `logger` interface.

---

### Subtasks

- [ ] DB-LOGGER-001.0.25 (AGENT): Read `lib/db/src/index.ts` in full and understand the current Drizzle initialisation.
  *No action — pause until fully understood.*

- [ ] DB-LOGGER-001.0.5 (AGENT): Research Drizzle ORM `logger` option API and confirm its signature for v0.x and v1.0 RC (May 2026).
  *Note: Drizzle v1.0 RC is available; the `logger` API is `{ logQuery(query, params) }`.*

- [ ] DB-LOGGER-001.0.75 (AGENT): Reason about parameter sanitisation — confirm no raw PII will be logged.
  *If uncertain about sanitisation approach, default to logging only parameter count.*

- [ ] DB-LOGGER-001.1 (AGENT): Add slow-query logger to Drizzle instance with threshold from env var.
  **File(s):** `lib/db/src/index.ts`
  **Verification:** `pnpm run typecheck` clean; manual dev run shows slow-query log.

- [ ] DB-LOGGER-001.2 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] ARCH-001.2-IMPL: BaseRepository Implementation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No repository layer exists. All Phase 3+ domain repositories (CRM, Finance, Projects, Documents) are blocked until a type-safe, tenant-scoped base is available.
**Size:** Large

**Description:** Implement the generic `BaseRepository<T>` abstract class that provides type-safe CRUD operations, automatic `organization_id` tenant scoping, soft-delete support, optimistic locking, and transaction management — the infrastructure foundation for every domain repository in the system.

**Depends on:** DB-ORG-001 (organizations table foundation for FK references)
**Blocks:** All Phase 3+ repository implementations (CRM, Finance, Projects, Documents, Appointments)
**Related Files:** `lib/db/src/repository/base-repository.ts`, `lib/db/src/repository/index.ts`, `lib/db/src/__tests__/base-repository.test.ts`

**Imports / Exports**
- Imports: `drizzle-orm` (eq, and, isNull, sql, inArray); `drizzle-orm/pg-core` (PgTableWithColumns, TableConfig); `@workspace/db` (db, pool); transaction types from `drizzle-orm`
- Exports: `BaseRepository<T>` (abstract class), `RepositoryError`, `TenantMismatchError`, `SoftDeleteMixin`, transaction helper types

**Definition of Done**
- [ ] `lib/db/src/repository/base-repository.ts` exports `abstract class BaseRepository<T extends PgTableWithColumns<TableConfig>>`
- [ ] Constructor accepts `db: DrizzleDB`, `table: T`, `organizationId: string`
- [ ] `findById(id: string)` — returns `T['$inferSelect'] | null`, always filters by `organization_id`
- [ ] `findAll(filters?)` — returns `T['$inferSelect'][]`, always filters by `organization_id` and excludes soft-deleted rows
- [ ] `create(data: NewModel<T>)` — inserts and returns the created row
- [ ] `update(id: string, data: Partial<UpdateModel<T>>)` — updates with optimistic locking check on `version` column; throws `OptimisticLockError` on mismatch
- [ ] `delete(id: string, hard = false)` — soft-delete sets `deleted_at`; hard-delete removes the row
- [ ] `withTransaction<R>(operation)` — wraps operations in a Drizzle transaction with proper rollback
- [ ] `applyTenantScoping(query)` — protected helper that appends `WHERE organization_id = ?`
- [ ] `applySoftDelete(query)` — protected helper that appends `WHERE deleted_at IS NULL`
- [ ] Unit tests in `lib/db/src/__tests__/base-repository.test.ts` cover all methods; coverage >95%
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Business logic — BaseRepository is purely a data-access infrastructure class
- Pagination helpers (add in Phase 3 if needed)
- Audit logging decorators (Phase 4+)
- Caching layer

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- BaseRepository must NEVER expose a method that bypasses `organization_id` scoping — no `findByIdGlobal()` or similar

**Output Artifacts**
- Code changes in: `lib/db/src/repository/base-repository.ts`, `lib/db/src/repository/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/base-repository.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `lib/db/src/repository/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails or `base-repository.test.ts` has >5% failure rate, stop and fix before proceeding

**Rules to Follow**
- Every `findById`, `findAll`, `update`, `delete` call MUST include `organization_id` in the WHERE clause — no exceptions
- Optimistic locking requires a `version` column (integer) on tables that support concurrent edits; throw a typed `OptimisticLockError` on mismatch
- Soft delete sets `deleted_at = NOW()` and `findAll` always filters `WHERE deleted_at IS NULL`
- `withTransaction` must guarantee rollback on any thrown error
- Never put business logic inside BaseRepository — it is a pure data-access layer

**Verification**
```bash
# Run BaseRepository unit tests
pnpm --filter @workspace/db test -- base-repository.test.ts

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- TypeScript generics `T extends PgTableWithColumns<TableConfig>` provide full type inference for column names and value types
- `applyTenantScoping` as a protected method enables sub-classes to call `super.applyTenantScoping(query)` without duplicating logic
- Use Drizzle's `db.transaction(async (tx) => { ... })` for `withTransaction` — Drizzle manages commit/rollback automatically
- Consider a `createRepository<T>(table, db, orgId)` factory function for ergonomic instantiation in service constructors

**Anti-Patterns**
- Repository methods that bypass `organization_id` — data leaks between tenants
- Business logic inside repository methods — violates Single Responsibility; put it in service layer
- Catching and silencing errors inside `withTransaction` — transactions must surface errors to callers
- Hard-coding table names as strings — use Drizzle table references for type safety

**DDD / TDD / BDD / Deep Module notes**
- DDD: Repository pattern encapsulates data-access complexity while preserving the domain model's integrity. `BaseRepository` is an infrastructure concern; domain repositories (e.g., `LeadRepository`) extend it and add domain-specific query methods.
- TDD: Write tests for tenant scoping (verify `organization_id` always in WHERE), soft-delete exclusion, optimistic lock conflict, and transaction rollback before implementing.
- BDD: [N/A] — infrastructure pattern, not user-facing behaviour.
- Deep Module: `BaseRepository` is the canonical deep module — a simple public interface (`findById`, `create`, `update`, `delete`) hiding complex query building, tenant enforcement, and transaction management.

---

### Subtasks

- [ ] ARCH-001.2-IMPL.0.25 (AGENT): Read DB-ORG-001 schema, the ARCH-001 ADR, and `lib/db/src/index.ts` in full.
  *No action — pause until the multi-tenancy contract and Drizzle API are fully understood.*

- [ ] ARCH-001.2-IMPL.0.5 (AGENT): Research Drizzle ORM generic table type constraints, `db.transaction()` API, and optimistic locking patterns (May 2026).
  *Document any Drizzle v1.0 RC API changes that affect the implementation.*

- [ ] ARCH-001.2-IMPL.0.75 (AGENT): Reason about the TypeScript generic constraints needed to enforce column type safety and whether `version` should be optional or required in the base class.
  *If uncertain, make `version` optional — only enable optimistic locking when the table has the column.*

- [ ] ARCH-001.2-IMPL.1 (AGENT): Define `BaseRepository` interface, generics, and abstract class skeleton.
  **File(s):** `lib/db/src/repository/base-repository.ts`
  **Verification:** Interface compiles; `pnpm run typecheck` clean with no implementations yet.

- [ ] ARCH-001.2-IMPL.2 (AGENT): Implement tenant scoping (`applyTenantScoping`) and soft-delete filter (`applySoftDelete`).
  **Verification:** Unit tests for scoping pass.

- [ ] ARCH-001.2-IMPL.3 (AGENT): Implement `findById`, `findAll`, `create`, `update`, `delete`.
  **Verification:** CRUD unit tests pass.

- [ ] ARCH-001.2-IMPL.4 (AGENT): Implement optimistic locking in `update` with `OptimisticLockError`.
  **Verification:** Concurrent-update test throws `OptimisticLockError`.

- [ ] ARCH-001.2-IMPL.5 (AGENT): Implement `withTransaction` with automatic rollback on error.
  **Verification:** Transaction rollback test passes.

- [ ] ARCH-001.2-IMPL.6 (AGENT): Write comprehensive unit tests; verify coverage >95%.
  **File(s):** `lib/db/src/__tests__/base-repository.test.ts`
  **Verification:** `pnpm --filter @workspace/db test -- base-repository.test.ts` → all green; coverage report shows >95%.

- [ ] ARCH-001.2-IMPL.7 (AGENT): Export from `lib/db/src/repository/index.ts` and re-export from main `lib/db/src/index.ts`.
  **Verification:** `pnpm run typecheck` clean.

- [ ] ARCH-001.2-IMPL.8 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-ORG-001: Define Organizations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** See `TODO-P2-ORGANIZATIONS.md` for the full task definition. Referenced here because it is on the critical path for all other infrastructure tasks.
**Size:** Small

**Description:** See `TODO-P2-ORGANIZATIONS.md` — DB-ORG-001 is the multi-tenancy anchor. Included in this file for critical-path visibility only.

**Depends on:** ARCH-001 (ADR accepted)
**Blocks:** TEST-INFRA-001, ARCH-001.2-IMPL, DB-IDENTITY-001, all Phase 2 domain tables
**Related Files:** `lib/db/src/schema/organizations.ts` — see `TODO-P2-ORGANIZATIONS.md` for full details

**Imports / Exports** — See `TODO-P2-ORGANIZATIONS.md`.

**Definition of Done** — See `TODO-P2-ORGANIZATIONS.md`.

**Out of Scope** — See `TODO-P2-ORGANIZATIONS.md`.

**Safety Boundaries** — See `TODO-P2-ORGANIZATIONS.md`.

**Output Artifacts** — See `TODO-P2-ORGANIZATIONS.md`.

**Rollback** — See `TODO-P2-ORGANIZATIONS.md`.

**Rules to Follow** — See `TODO-P2-ORGANIZATIONS.md`.

**Verification**
```bash
pnpm --filter @workspace/db test -- organizations.test.ts
pnpm run typecheck
```

**Advanced Code Patterns** — See `TODO-P2-ORGANIZATIONS.md`.

**Anti-Patterns** — See `TODO-P2-ORGANIZATIONS.md`.

**DDD / TDD / BDD / Deep Module notes** — See `TODO-P2-ORGANIZATIONS.md`.

---

### Subtasks — See `TODO-P2-ORGANIZATIONS.md` for full subtask list.

---

## Phase 2 Infrastructure: Critical Path & Dependencies

### Execution Order
```
DB-ORG-001 (organizations table)
  └─> TEST-INFRA-001 (test harness — can start after schema exists)
  └─> DB-LOGGER-001 (dev logging — can run in parallel with TEST-INFRA-001)
  └─> ARCH-001.2-IMPL (BaseRepository — requires DB-ORG-001)
```

### Parallel Execution
- **TEST-INFRA-001** and **DB-LOGGER-001** can run in parallel after **DB-ORG-001**
- **ARCH-001.2-IMPL** requires **DB-ORG-001** but can overlap with TEST-INFRA-001

---

## File Index

### Phase 2 Context Files
- `TODO-P2-INFRASTRUCTURE.md` — This file (infrastructure foundation)
- `TODO-P2-ORGANIZATIONS.md` — DB-ORG-001 full specification
- `TODO-P2-IDENTITY.md` — Identity & Access context (Users, Roles, Permissions, Refresh Tokens)
- `TODO-P2-APPOINTMENTS.md` — Scheduling & Appointments context
- `TODO-P2-FINANCE.md` — Financial context

### Related Phase Files
- `TODO-P0-ARCHITECTURE.md` — ARCH-001 ADR
- `TODO-P1-AUTH-SERVICES.md` — Auth services that will use these tables

# tasks/infrastructure/DATABASE.md – Database, Multi‑Tenancy & Infrastructure Foundation

This file covers the database schema foundations, multi‑tenancy anchor (Organizations), the BaseRepository pattern, test infrastructure, development logging, and cross‑cutting infrastructure tasks like OpenAPI modularisation and bulk operations. These tasks must complete before any domain schema or API work begins.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] DB‑ORG‑001: Define Organizations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `lib/db/src/schema/` is empty — no tables have been defined. Multi‑tenancy cannot be enforced anywhere until this table exists.
**Size:** Small

**Description:** Create the Drizzle `organizations` table — the root of all multi‑tenancy in the system. Every other bounded‑context table will carry an `organization_id` FK referencing this table.

**Depends on:** `foundation/ARCHITECTURE.md → ARCH‑001`
**Blocks:** `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `DB‑IDENTITY‑002`, `DB‑IDENTITY‑003`, `DB‑IDENTITY‑006`, all domain DB‑* tasks, `infrastructure/DATABASE.md → TEST‑INFRA‑001`, `ARCH‑001.2‑IMPL`
**Related Files:** `lib/db/src/schema/organizations.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/organizations.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/organizations.ts` exists and compiles
- [ ] Columns: `id` (uuid PK, defaultRandom()), `name` (text NOT NULL), `slug` (text UNIQUE NOT NULL), `plan_type` (pgEnum: `free|pro|enterprise`, NOT NULL), `settings` (jsonb NOT NULL default `{}`), `created_at`, `updated_at`
- [ ] GIN index on `settings` JSONB column
- [ ] `insertOrganizationSchema` rejects invalid `plan_type` and validates slug format (`/^[a-z0-9-]+$/`)
- [ ] `selectOrganizationSchema` generated via `createSelectSchema`
- [ ] TypeScript types `InsertOrganization` and `Organization` exported
- [ ] `lib/db/src/schema/index.ts` re‑exports all from `organizations.ts`
- [ ] `lib/db/src/__tests__/organizations.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Organization hierarchy (parent/child org relationships)
- Organization billing lifecycle or Stripe customer ID management
- User invitation or onboarding flows
- `deleted_at` soft‑delete (add later if needed)
- PostgreSQL RLS policies (`pgPolicy`) — application‑level `organization_id` scoping is used for now; RLS is a future hardening step

**Rules to Follow**
- Use `uuid('id').primaryKey().defaultRandom()` — no serial/auto‑increment IDs
- `plan_type` must use `pgEnum` so Postgres enforces the constraint at the DB layer
- `settings` JSONB must default to `{}` (not `null`)
- `slug` Zod schema must enforce `/^[a-z0-9-]+$/` regex
- Export `planTypeEnum` alongside the table

**Verification**
```bash
# TDD red first, green after implementation
pnpm --filter @workspace/db test -- organizations.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Organization` is the aggregate root of the multi‑tenancy bounded context.
- TDD: Write the failing test first — assert all columns, unique `slug`, GIN index, Zod rejection.
- BDD: [N/A] — infrastructure/storage entity.
- Deep Module: Shallow table with minimal logic.

---

### Subtasks
- [ ] DB‑ORG‑001.0.25 (AGENT): Read this task, the ARCH‑001 ADR, and `lib/db/src/schema/index.ts` in full. *No action — pause.*
- [ ] DB‑ORG‑001.0.5 (AGENT): Research Drizzle ORM `pgEnum`, `jsonb`, GIN index syntax; confirm `drizzle‑zod` vs `drizzle‑orm/zod` status. *Note: project uses `drizzle‑zod@^0.8.3`.*
- [ ] DB‑ORG‑001.0.75 (AGENT): Reason about slug regex, GIN index syntax, and `planTypeEnum` export to avoid circular imports. *If uncertain, consult drizzle.team docs.*
- [ ] DB‑ORG‑001.1 (AGENT): Write the failing schema validation test. **File(s):** `lib/db/src/__tests__/organizations.test.ts` **Verification:** RED.
- [ ] DB‑ORG‑001.2 (AGENT): Implement `organizations` table, Zod schemas, and TypeScript types; re‑export from `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑ORG‑001.3 (HUMAN): Review schema, approve, and run `pnpm --filter @workspace/db run push` against the dev database. **Verification:** `push` completes without errors.
- [ ] DB‑ORG‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ARCH‑001.2‑IMPL: BaseRepository Implementation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No repository layer exists. All Phase 3+ domain repositories are blocked until a type‑safe, tenant‑scoped base is available.
**Size:** Large

**Description:** Implement the generic `BaseRepository<T>` abstract class that provides type‑safe CRUD operations, automatic `organization_id` tenant scoping, soft‑delete support, optimistic locking, and transaction management — the infrastructure foundation for every domain repository in the system.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** All Phase 3+ repository implementations (CRM, Finance, Projects, Documents, Appointments)
**Related Files:** `lib/db/src/repository/base‑repository.ts`, `lib/db/src/repository/index.ts`, `lib/db/src/__tests__/base‑repository.test.ts`

**Definition of Done**
- [ ] Constructor accepts `db: DrizzleDB`, `table: T`, `organizationId: string`
- [ ] `findById`, `findAll`, `create`, `update` (with optimistic locking), `delete` (soft/hard)
- [ ] `withTransaction<R>(operation)` wraps operations in a Drizzle transaction
- [ ] `applyTenantScoping` and `applySoftDelete` protected helpers
- [ ] Unit tests cover all methods; coverage >95%
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Business logic — BaseRepository is purely a data‑access infrastructure class
- Pagination helpers (add in Phase 3 if needed)
- Audit logging decorators (Phase 4+)
- Caching layer

**Rules to Follow**
- Every find/update/delete call MUST include `organization_id` in the WHERE clause
- Optimistic locking requires a `version` column (integer) on tables that support concurrent edits
- Soft delete sets `deleted_at = NOW()`; `findAll` always filters `WHERE deleted_at IS NULL`
- `withTransaction` must guarantee rollback on any thrown error

**Verification**
```bash
pnpm --filter @workspace/db test -- base‑repository.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Repository pattern encapsulates data‑access complexity. `BaseRepository` is an infrastructure concern; domain repositories extend it.
- TDD: Write tests for tenant scoping, soft‑delete exclusion, optimistic lock conflict, and transaction rollback before implementing.
- Deep Module: `BaseRepository` is the canonical deep module.

---

### Subtasks
- [ ] ARCH‑001.2‑IMPL.0.25 (AGENT): Read DB‑ORG‑001 schema, the ARCH‑001 ADR, and `lib/db/src/index.ts` in full. *No action — pause.*
- [ ] ARCH‑001.2‑IMPL.0.5 (AGENT): Research Drizzle ORM generic table type constraints, `db.transaction()` API, and optimistic locking patterns. *Document any Drizzle v1.0 RC API changes.*
- [ ] ARCH‑001.2‑IMPL.1 (AGENT): Define `BaseRepository` interface, generics, and abstract class skeleton. **File(s):** `lib/db/src/repository/base‑repository.ts` **Verification:** `pnpm typecheck` clean.
- [ ] ARCH‑001.2‑IMPL.2 (AGENT): Implement tenant scoping and soft‑delete filter. **Verification:** Unit tests for scoping pass.
- [ ] ARCH‑001.2‑IMPL.3 (AGENT): Implement `findById`, `findAll`, `create`, `update`, `delete`. **Verification:** CRUD unit tests pass.
- [ ] ARCH‑001.2‑IMPL.4 (AGENT): Implement optimistic locking in `update` with `OptimisticLockError`. **Verification:** Concurrent‑update test passes.
- [ ] ARCH‑001.2‑IMPL.5 (AGENT): Implement `withTransaction` with automatic rollback. **Verification:** Transaction rollback test passes.
- [ ] ARCH‑001.2‑IMPL.6 (AGENT): Write comprehensive unit tests; verify coverage >95%. **File(s):** `lib/db/src/__tests__/base‑repository.test.ts` **Verification:** All green.
- [ ] ARCH‑001.2‑IMPL.7 (AGENT): Export from `lib/db/src/repository/index.ts` and re‑export from main `lib/db/src/index.ts`. **Verification:** `pnpm typecheck` clean.
- [ ] ARCH‑001.2‑IMPL.8 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] TEST‑INFRA‑001: Test Infrastructure Setup
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No test infrastructure exists. `lib/db/src/__tests__/` does not exist. Vitest is present but no integration test setup, test database utilities, or server harness have been configured.
**Size:** Medium

**Description:** Establish the complete integration‑test infrastructure — a separate test database, Vitest config, a reusable test‑server harness, database seed/teardown utilities, and JWT helpers — so every subsequent Phase 2+ task can write TDD‑style integration tests from day one.

**Depends on:** `foundation/TOOLING.md → DEP‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** All integration tests across Phase 2, Phase 3, and beyond
**Related Files:** `artifacts/api‑server/vitest.config.ts`, `artifacts/api‑server/src/__tests__/utils/test‑server.ts`, `test‑db.ts`, `auth‑helpers.ts`, `artifacts/api‑server/src/__tests__/api/example.integration.test.ts`

**Definition of Done**
- [ ] `TEST_DATABASE_URL` environment variable documented; tests never touch production database
- [ ] `artifacts/api‑server/vitest.config.ts` configured with global setup/teardown
- [ ] Test‑server harness returns a fully wired Express app + supertest agent
- [ ] `seedTestDatabase()` and `teardownTestDatabase()` utilities with FK‑safe truncation
- [ ] `generateTestToken(userId, orgId, role)` producing valid JWTs
- [ ] Example integration test passes against `/healthz`
- [ ] Multiple tests run in isolation; no cross‑test data contamination
- [ ] `pnpm --filter @workspace/api‑server test` passes

**Rules to Follow**
- Tests must be fully isolated — `teardownTestDatabase()` must truncate all tables in FK‑safe order
- JWTs generated in tests must use the same algorithm as production
- Test server must not start a real HTTP listener — use supertest's `request(app)` pattern

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- example.integration.test.ts
pnpm --filter @workspace/api‑server test
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — pure infrastructure.
- TDD: This task IS the TDD enabler. All subsequent red‑green cycles depend on this infrastructure.
- BDD: Provides the runtime for all executable BDD scenarios defined in `.feature` files.
- Deep Module: `createTestServer()` and `seedTestDatabase()` utilities are the deep‑module interface.

---

### Subtasks
- [ ] TEST‑INFRA‑001.0.25 (AGENT): Read this task and `artifacts/api‑server/src/app.ts` to understand Express structure. *No action — pause.*
- [ ] TEST‑INFRA‑001.0.5 (AGENT): Research Vitest `globalSetup` vs `setupFiles` patterns for integration tests with databases. Confirm supertest compatibility with Express 5. *Document findings briefly.*
- [ ] TEST‑INFRA‑001.1 (AGENT): Configure Vitest for integration testing with DB setup and teardown hooks. **File(s):** `artifacts/api‑server/vitest.config.ts` **Verification:** Test discovery working.
- [ ] TEST‑INFRA‑001.2 (AGENT): Create test database utilities (connect, seed, teardown with FK‑safe truncation). **File(s):** `artifacts/api‑server/src/__tests__/utils/test‑db.ts` **Verification:** `pnpm typecheck` clean.
- [ ] TEST‑INFRA‑001.3 (AGENT): Implement test server harness returning a supertest‑ready Express app. **File(s):** `artifacts/api‑server/src/__tests__/utils/test‑server.ts` **Verification:** `pnpm typecheck` clean.
- [ ] TEST‑INFRA‑001.4 (AGENT): Create JWT test‑token generator. **File(s):** `artifacts/api‑server/src/__tests__/utils/auth‑helpers.ts` **Verification:** Generated tokens pass `jwt.verify()`.
- [ ] TEST‑INFRA‑001.5 (AGENT): Write example integration test hitting `/healthz`. **File(s):** `artifacts/api‑server/src/__tests__/api/example.integration.test.ts` **Verification:** GREEN.
- [ ] TEST‑INFRA‑001.6 (AGENT): Add global cleanup hooks; verify multiple tests do not bleed state. **Verification:** Run suite twice in succession; results are identical.
- [ ] TEST‑INFRA‑001.7 (HUMAN): Review test infrastructure, confirm `TEST_DATABASE_URL` is set in dev environment, and run full suite. **Verification:** `pnpm --filter @workspace/api‑server test` → all green.
- [ ] TEST‑INFRA‑001.8 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑LOGGER‑001: Add Drizzle Slow‑Query Logger
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `lib/db/src/index.ts` creates the Drizzle instance with no logging. Slow queries in development go undetected.
**Size:** Small

**Description:** Attach a development‑only slow‑query logger to the Drizzle instance that logs any query exceeding a configurable threshold, enabling proactive performance debugging.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001` (database connection established)
**Blocks:** [N/A] — development utility only
**Related Files:** `lib/db/src/index.ts`

**Definition of Done**
- [ ] Logger active only when `NODE_ENV !== 'production'`
- [ ] Records queries slower than `SLOW_QUERY_THRESHOLD_MS` (env var, default `500`)
- [ ] Log output includes: query SQL, parameters (sanitised), and execution time in ms
- [ ] Log format is structured JSON compatible with Pino
- [ ] Production builds produce zero logging overhead
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Logger must be a no‑op in production
- Never log raw query parameters that may contain PII — sanitise or mask them
- `SLOW_QUERY_THRESHOLD_MS` env var must have a safe default and be validated as a positive integer

**Verification**
```bash
pnpm run typecheck
# Manual: run a query in dev and inspect logs
NODE_ENV=development SLOW_QUERY_THRESHOLD_MS=1 pnpm --filter @workspace/api‑server run dev
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure utility.
- TDD: [N/A] — validated by manual observation in dev.
- Deep Module: The logger is a thin wrapper that hides timing complexity behind Drizzle’s `logger` interface.

---

### Subtasks
- [ ] DB‑LOGGER‑001.0.25 (AGENT): Read `lib/db/src/index.ts` in full and understand the current Drizzle initialisation. *No action — pause.*
- [ ] DB‑LOGGER‑001.0.5 (AGENT): Research Drizzle ORM `logger` option API. *Note: Drizzle v1.0 RC `logger` API is `{ logQuery(query, params) }`.*
- [ ] DB‑LOGGER‑001.1 (AGENT): Add slow‑query logger to Drizzle instance with threshold from env var. **File(s):** `lib/db/src/index.ts` **Verification:** `pnpm typecheck` clean; manual dev run shows slow‑query log.
- [ ] DB‑LOGGER‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑SEARCH‑001: Define Search Index Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No search index table exists. `API‑SEARCH‑001` is blocked.
**Size:** Small

**Description:** Define the `search_index` table with a PostgreSQL `tsvector` column for full‑text search, a GIN index, and support for organisation‑scoped, entity‑specific content indexing.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/NOTIFICATIONS.md → API‑SEARCH‑001`
**Related Files:** `lib/db/src/schema/search/search_index.ts`, `lib/db/src/__tests__/search‑index.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (text NOT NULL), `entity_id` (uuid NOT NULL), `content` (tsvector NOT NULL), `metadata` (jsonb default `{}`), `updated_at`
- [ ] GIN index on `content`
- [ ] Indexes: `(organization_id, entity_type, entity_id)`, `(organization_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `content` must be a generated `tsvector` column or populated via a trigger on write (up to implementer)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- search‑index.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `search_index` is a materialised read model for cross‑module search; it does not belong to any single bounded context.
- TDD: Assert GIN index and `tsvector` column.

---

### Subtasks
- [ ] DB‑SEARCH‑001.0.25 (AGENT): Read DB‑ORG‑001 and research PostgreSQL `tsvector` with Drizzle. *No action — pause.*
- [ ] DB‑SEARCH‑001.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/search‑index.test.ts` **Verification:** RED.
- [ ] DB‑SEARCH‑001.2 (AGENT): Implement table, indexes, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑SEARCH‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑NOTIF‑001: Define Notifications & Notification Preferences Tables
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No notification tables exist. `API‑NOTIF‑001` is blocked.
**Size:** Small

**Description:** Define `notifications` and `notification_preferences` tables to support in‑app notifications with per‑user, per‑type preference controls.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001`
**Related Files:** `lib/db/src/schema/notifications/notifications.ts`, `lib/db/src/schema/notifications/preferences.ts`, `lib/db/src/__tests__/notifications.test.ts`

**Definition of Done**
- [ ] `notifications` columns: `id` (uuid PK), `organization_id` (FK), `user_id` (FK), `type` (text NOT NULL), `title` (text NOT NULL), `body` (text), `is_read` (boolean default false), `read_at` (timestamp), `metadata` (jsonb default `{}`), `created_at`
- [ ] Indexes: `(user_id, is_read, created_at)`, `(organization_id, created_at)`
- [ ] `notification_preferences` columns: `id` (uuid PK), `user_id` (FK), `organization_id` (FK), `type` (text NOT NULL), `enabled` (boolean default true), `quiet_hours_start` (time), `quiet_hours_end` (time), unique on `(user_id, type)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `type` values must be validated against a known set (enum in service layer)
- All queries must include `organization_id`

**Verification**
```bash
pnpm --filter @workspace/db test -- notifications.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Notifications are an infrastructure cross‑cutting concern.

---

### Subtasks
- [ ] DB‑NOTIF‑001.0.25 (AGENT): Read DB‑ORG‑001 and DB‑IDENTITY‑001 schemas. *No action — pause.*
- [ ] DB‑NOTIF‑001.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/notifications.test.ts` **Verification:** RED.
- [ ] DB‑NOTIF‑001.2 (AGENT): Implement tables, indexes, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑NOTIF‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑IMPORT‑001: Define Import History Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No import history table exists. `API‑IMPORT‑001` references it but cannot proceed.
**Size:** Small

**Description:** Define the `import_history` table for tracking CSV import jobs, statuses, row counts, and error storage.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/NOTIFICATIONS.md → API‑IMPORT‑001`
**Related Files:** `lib/db/src/schema/imports/import_history.ts`, `lib/db/src/__tests__/import‑history.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `entity_type` (text NOT NULL), `status` (pgEnum: `preview|processing|completed|failed`), `total_rows` (integer), `success_rows` (integer), `error_rows` (integer), `error_details` (jsonb default `[]`), `created_by` (FK users), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, entity_type, created_at)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- import‑history.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑IMPORT‑001.0.25 (AGENT): Read DB‑ORG‑001. *No action — pause.*
- [ ] DB‑IMPORT‑001.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/import‑history.test.ts` **Verification:** RED.
- [ ] DB‑IMPORT‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IMPORT‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑TEAMS‑001: Define Teams Table (or Resolve CRM `team_id` References)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** CRM schemas contain unresolved `team_id` and `visibility` references. No dedicated `teams` table exists. This task creates the table or documents the decision to remove the references.
**Size:** Small

**Description:** Define the `teams` table to support team‑scoped visibility in CRM and other contexts. If teams are not required, update CRM schemas to drop `team_id` and `visibility` columns in a controlled migration.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** CRM schema tasks (`crm/CRM‑CONTACTS‑COMPANIES.md`, etc.)
**Related Files:** `lib/db/src/schema/teams/teams.ts`, `lib/db/src/__tests__/teams.test.ts`

**Definition of Done**
- [ ] Decision documented: either `teams` table created or CRM schemas cleaned up
- [ ] If creating: columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description`, `created_at`, `updated_at`, and a `team_members` junction table `(team_id, user_id)`
- [ ] If removing: all `team_id` and `visibility` references replaced with a simpler model (e.g., org‑wide or private only)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- teams.test.ts  # if created
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑TEAMS‑001.0.25 (AGENT): Inspect all CRM schemas with `team_id` or `visibility` columns; compile a list. *No action — pause.*
- [ ] DB‑TEAMS‑001.0.75 (AGENT): Reason about the best approach (create teams or remove references). Present recommendation to HUMAN.
- [ ] DB‑TEAMS‑001.1 (HUMAN): Approve the decision. **Verification:** Decision documented.
- [ ] DB‑TEAMS‑001.2 (AGENT): Implement the approved decision (schema changes, tests, migration). **Verification:** All tests pass; `pnpm typecheck` clean.
- [ ] DB‑TEAMS‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] INFRA‑BOOTSTRAP‑001: Application Composition Root
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No application composition root exists. Services, repositories, and middleware are not wired together. Phase 3 services cannot be instantiated.
**Size:** Medium

**Description:** Implement the application composition root that instantiates all singletons (database, event bus, repositories, services), registers middleware, mounts routers, and starts the Express server in dependency order.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/RBAC.md → RBAC‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** All Phase 3+ API tasks (services must be injectable)
**Related Files:** `artifacts/api‑server/src/app.ts`, `artifacts/api‑server/src/bootstrap.ts`

**Definition of Done**
- [ ] `bootstrap.ts` (or within `app.ts`) wires:
  - Database connection pool
  - Event bus instantiation and subscriber registration
  - BaseRepository and domain repository instantiation
  - All service instantiations with constructor injection
  - Middleware registration (auth, RBAC, rate limiting)
  - Router mounting
- [ ] Server starts and serves requests successfully
- [ ] Unit test verifies that all dependencies resolve without circular imports
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Use explicit constructor injection — no hidden side effects or global mutable state
- Start background jobs (schedulers, workers) after HTTP server is listening
- Handle graceful shutdown (`SIGTERM`, `SIGINT`) to close connections and drain queues

**Verification**
```bash
pnpm --filter @workspace/api‑server run dev
curl http://localhost:8081/healthz
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The composition root is the single place where infrastructure and domain are wired together.

---

### Subtasks
- [ ] INFRA‑BOOTSTRAP‑001.0.25 (AGENT): Read all existing service, middleware, and repository implementations to understand dependencies. *No action — pause.*
- [ ] INFRA‑BOOTSTRAP‑001.1 (AGENT): Implement the composition root (or update `app.ts`) with all wiring. **File(s):** `artifacts/api‑server/src/app.ts` **Verification:** Server starts; all routes accessible.
- [ ] INFRA‑BOOTSTRAP‑001.2 (AGENT): Add graceful shutdown handling. **File(s):** `artifacts/api‑server/src/index.ts` **Verification:** `SIGTERM` triggers clean shutdown.
- [ ] INFRA‑BOOTSTRAP‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] API‑SPEC‑001: OpenAPI Spec Modularisation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Single monolithic `openapi.yaml`; will exceed 500 lines once Phase 3 API paths are added.
**Size:** Medium

**Description:** Split the main OpenAPI spec into per‑context files under `lib/api‑spec/contexts/` using `$ref` pointers, preserving a single coherent spec and unbroken Orval codegen.

**Depends on:** [N/A]
**Blocks:** All Phase 4+ API expansion tasks
**Related Files:** `lib/api‑spec/openapi.yaml`, `lib/api‑spec/contexts/`, `lib/api‑spec/orval.config.ts`

**Definition of Done**
- [ ] `lib/api‑spec/contexts/` directory created with `crm.yaml`, `auth.yaml`, `finance.yaml`, `projects.yaml` (and others as they exist)
- [ ] Main `openapi.yaml` uses `$ref` pointers to context files
- [ ] Codegen output is bit‑for‑bit identical before and after modularisation
- [ ] No circular `$ref` references
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
git diff lib/api‑client‑react/src/generated/  # must be empty
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Each bounded context owns its API specification; `crm.yaml` belongs to the CRM context.

---

### Subtasks
- [ ] API‑SPEC‑001.0.25 (AGENT): Read the current `openapi.yaml` and Orval config. *No action — pause.*
- [ ] API‑SPEC‑001.0.5 (AGENT): Research Orval 8+ `$ref` resolution behaviour. *Document findings briefly.*
- [ ] API‑SPEC‑001.1 (AGENT): Create `contexts/` directory and extract CRM paths/schemas. **File(s):** `lib/api‑spec/contexts/crm.yaml`, `lib/api‑spec/openapi.yaml` **Verification:** Codegen output unchanged.
- [ ] API‑SPEC‑001.2 (AGENT): Extract Auth paths/schemas. **Verification:** Codegen output unchanged.
- [ ] API‑SPEC‑001.3 (AGENT): Extract Finance and Projects paths/schemas. **Verification:** Codegen output unchanged.
- [ ] API‑SPEC‑001.4 (AGENT): Update `orval.config.ts` if needed. **Verification:** `pnpm codegen` produces identical output.
- [ ] API‑SPEC‑001.5 (HUMAN): Run codegen, verify output, and sign off. **Verification:** Approved.

---

## [ ] API‑CROSS‑001: Cross‑Module Bulk Operations Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No bulk operation endpoint exists; each module handles operations individually.
**Size:** Large

**Description:** Implement a generic `POST /api/v1/bulk` endpoint that accepts a batch of sub‑operations (method + path + body), executes them in parallel with concurrency limits, returns per‑operation results, and logs the batch as a single audit entry.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`, `ERROR‑001`, `infrastructure/RBAC.md → RBAC‑001`
**Blocks:** Phase 4+ frontend bulk UX patterns
**Related Files:** `artifacts/api‑server/src/routes/bulk.ts`, `artifacts/api‑server/src/services/infrastructure/bulk‑operation‑service.ts`, `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `POST /api/v1/bulk` accepts `{ operations: [{ method, path, body? }][] }` with max 100 operations per request
- [ ] Operations execute in parallel using `Promise.allSettled` with configurable concurrency (default 10)
- [ ] All operations must belong to the same organisation (validated before execution)
- [ ] Returns `{ summary: { total, succeeded, failed }, results: [{ index, status, data | error }][] }`
- [ ] Rate limited: max 5 bulk requests per organisation per minute (returns 429 when exceeded)
- [ ] Operations logged as a single audit entry
- [ ] Integration tests cover: mixed success/failure, org validation, rate limiting, empty operations array → 400
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Each sub‑operation must run through the same RBAC and validation middleware as a direct request
- Operations from different organisations must be rejected before any execution begins
- Never expose internal server errors from sub‑operations in the bulk response body unredacted
- Max 100 operations per request — return 400 if exceeded

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/infrastructure/bulk‑operations.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `BulkOperationService` is infrastructure — it orchestrates across bounded contexts without owning domain logic.
- TDD: Write integration tests first (red): batch of 2 succeeds, cross‑org batch rejected.
- BDD: “As a Finance manager, I can approve 20 bills at once via a single bulk request and see per‑bill results.”
- Deep Module: `BulkOperationService.execute(ops, context)` hides parallel dispatch, concurrency limits, result aggregation, rate check, and audit logging.

---

### Subtasks
- [ ] API‑CROSS‑001.0.25 (AGENT): Read AUTH‑008, RBAC‑001, ERROR‑001 and all related files. *No action — pause.*
- [ ] API‑CROSS‑001.0.5 (AGENT): Research internal sub‑request dispatch patterns in Express 5, p‑limit concurrency control, and bulk API design best practices. *Document findings briefly.*
- [ ] API‑CROSS‑001.1 (AGENT): Add `POST /api/v1/bulk` schema to OpenAPI spec. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑CROSS‑001.2 (AGENT): Implement `BulkOperationService.execute()` with parallel dispatch, concurrency limits, and `Promise.allSettled` result collection. **File(s):** `artifacts/api‑server/src/services/infrastructure/bulk‑operation‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑CROSS‑001.3 (AGENT): Add organisation validation — reject cross‑org batches. **Verification:** Integration test: cross‑org batch rejected.
- [ ] API‑CROSS‑001.4 (AGENT): Implement rate limiting (5 bulk requests/org/min). **File(s):** `artifacts/api‑server/src/middlewares/bulk‑rate‑limit.ts` **Verification:** Returns 429 when exceeded.
- [ ] API‑CROSS‑001.5 (AGENT): Add structured audit logging for each bulk request. **Verification:** Log entry appears with correct fields.
- [ ] API‑CROSS‑001.6 (AGENT): Create route, mount under `/api/v1/bulk`, wire to service. **File(s):** `artifacts/api‑server/src/routes/bulk.ts`, `routes/index.ts` **Verification:** Integration tests green; `pnpm typecheck`.
- [ ] API‑CROSS‑001.7 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
# TODO-P2-INFRASTRUCTURE.md – Phase 2: Infrastructure & Multi-Tenancy Foundation

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the foundational infrastructure for Phase 2: Test Infrastructure, Database Logging, and Organizations (multi-tenancy anchor). These must be completed before any other Phase 2 work.

---

### Test Infrastructure (Moved from Phase 1)

## [ ] TEST‑INFRA‑001: Test Infrastructure Setup
**Status:** ⏳ Not Started  
**Current state:** No test infrastructure exists – integration tests cannot be written or executed.  
**Definition of Done:**  
- Test database setup with separate database for testing (`TEST_DATABASE_URL`)  
- Test server harness in `artifacts/api-server/__tests__/utils/test-server.ts`  
- Database seeding utilities for test data  
- Global test hooks in `vitest.config.ts` for database setup/teardown  
- Test utilities for authentication token generation  
- Example integration test structure demonstrating the pattern  

**Anti-Patterns:** Using production database for tests; leaking test data; no cleanup between tests.  
**Related Files:** `vitest.config.ts`, `__tests__/utils/test-server.ts`, `__tests__/utils/test-db.ts`

**DDD:** N/A – testing infrastructure.  
**TDD:** This infrastructure enables all subsequent TDD work.  
**BDD:** Provides the foundation for executable BDD scenarios.  
**Deep Module:** N/A – infrastructure utilities.

### Subtasks:
- [ ] TEST‑INFRA‑001.1: Configure Vitest for integration testing with database setup. (AGENT) – `vitest.config.ts`  
  **verification:** `pnpm vitest --version` works; test configuration loads.
- [ ] TEST‑INFRA‑001.2: Create test database utilities (setup, teardown, migration). (AGENT) – `__tests__/utils/test-db.ts`  
  **verification:** Test database can be created and migrated.
- [ ] TEST‑INFRA‑001.3: Implement test server harness with Express app and database connection. (AGENT) – `__tests__/utils/test-server.ts`  
  **verification:** Test server starts and stops cleanly.
- [ ] TEST‑INFRA‑001.4: Create authentication test utilities (token generation, headers). (AGENT) – `__tests__/utils/auth-helpers.ts`  
  **verification:** Can generate valid JWT tokens for testing.
- [ ] TEST‑INFRA‑001.5: Write example integration test demonstrating the full pattern (setup → request → cleanup). (AGENT) – `__tests__/api/example.integration.test.ts`  
  **verification:** Example test runs and passes against health endpoint.
- [ ] TEST‑INFRA‑001.6: Add global test hooks for database cleanup between tests. (AGENT)  
  **verification:** Multiple tests run without data interference.
- **Depends on:** DEP-001 (vitest), DB‑ORG‑001 (organizations table as foundation).  
- **Blocks:** All integration test writing in Phase 3 and beyond.

---

## [ ] DB‑LOGGER‑001: Add Drizzle Slow-Query Logger in Development  
**Status:** ⏳ Not Started  
**Current state:** No slow-query logging exists – performance issues in development go unnoticed.  
**Definition of Done:** `lib/db/src/index.ts` includes slow-query logging for development environment:  
- Configure Drizzle logger with `onQuery` event handler  
- Log queries taking longer than 500ms in development (`NODE_ENV !== 'production'`)  
- Include query SQL, parameters, and execution time in log output  
- Use structured logging format compatible with Pino  
- Add configuration option `SLOW_QUERY_THRESHOLD_MS` (default 500)  
**Related Files:** `lib/db/src/index.ts`  
**Subtasks:**  
- [ ] DB‑LOGGER‑001.1: Add slow-query logger configuration to Drizzle instance. (AGENT) – `lib/db/src/index.ts`  
  **verification:** Slow queries appear in development logs with execution time.  
- [ ] DB‑LOGGER‑001.2: Add environment variable for threshold configuration. (AGENT)  
  **verification:** `SLOW_QUERY_THRESHOLD_MS` variable controls logging sensitivity.  
- **Depends on:** DB‑ORG‑001 (database connection established).  
- **Blocks:** Performance monitoring in development.

---

## Organizations Context (Multi‑Tenancy Anchor)

### [ ] DB‑ORG‑001: Define Organizations Table
**Status:** ⏳ Not Started  
**Required by:** ARCH‑001. Must be implemented before all other Phase 2 schema tasks.  
**Definition of Done:** `lib/db/src/schema/organizations.ts` exports Drizzle `organizations` table:  
- `id` (uuid PK), `name` (text NOT NULL), `slug` (text UNIQUE), `plan_type` (enum: free/pro/enterprise)  
- `settings` (JSONB default `{}`), `created_at`, `updated_at`  
- GIN index on `settings`  
Zod insert/select schemas generated via `drizzle‑zod`.  
**Related Files:** `lib/db/src/schema/organizations.ts`

**DDD:** Organization is the root of multi‑tenancy. All business tables reference this via `organization_id`.  
**TDD:** Test SQL generation (columns, unique constraints, GIN index). Test Zod schema rejects invalid plan_type.  
**BDD:** N/A – infrastructure entity.  
**Deep Module:** Shallow table; the multi‑tenancy logic lives in BaseRepository.

### Subtasks:
- [ ] DB‑ORG‑001.1: Write schema validation test – assert all columns, unique `slug`, and GIN index on `settings`. (AGENT) – `lib/db/src/__tests__/organizations.test.ts`  
  **verification:** `pnpm test -- organizations.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB‑ORG‑001.2: Implement table and Zod schemas using `drizzle‑zod`. (AGENT) – `lib/db/src/schema/organizations.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** ARCH‑001 (ADR accepted).
- **Blocks:** DB‑IDENTITY‑001, all other Phase 2 schema tasks.

---

## Phase 2 Infrastructure Dependencies

### Critical Path
```
TEST-INFRA-001 → (enables all integration testing)
DB-LOGGER-001 → (performance monitoring)
DB-ORG-001 → (foundation for all other contexts)
```

### Parallel Execution
- **TEST-INFRA-001** and **DB-LOGGER-001** can run in parallel
- **DB-ORG-001** must complete before any other Phase 2 context work

### Cross-Context Dependencies
- All other Phase 2 contexts depend on **DB-ORG-001** for `organization_id` foreign keys
- **TEST-INFRA-001** enables integration testing for all subsequent contexts
- **DB-LOGGER-001** provides performance monitoring for all database operations

---

## File Index

### Infrastructure Files
- `TODO-P2-INFRASTRUCTURE.md` - This file (Test Infrastructure, DB Logger, Organizations)
- `TODO-P2-IDENTITY.md` - Identity & Access context (Users, Roles, Permissions)
- `TODO-P2-APPOINTMENTS.md` - Scheduling & Appointments context (Calendly-style)
- `TODO-P2-FINANCE.md` - Financial context (Invoicing, Payments, Expenses)
- `TODO-P2-TRACKER.md` - Phase 2 execution tracking and dependencies

### Related Phase Files
- `TODO-MASTER-TRACKER.md` - Phase 0 & 1 consolidated tracking
- `TODO-P0-*.md` - Phase 0 foundation and architecture tasks
- `TODO-P1-*.md` - Phase 1 authentication system tasks

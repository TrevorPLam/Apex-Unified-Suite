# TODO-P2-IDENTITY.md – Phase 2: Identity & Access Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the complete Identity & Access bounded context for Phase 2: Users, Roles, Permissions, User-Role assignments, Refresh Tokens with family tracking, and migration/seed data. All tables include `organization_id` per the accepted multi‑tenancy ADR (ARCH‑001).

---

## Identity & Access Context (Moved from Phase 1)

### [ ] DB‑IDENTITY‑001: Define Users Table
**Status:** ⏳ Not Started  
**Current state:** No users table exists; must link to an organization.  
**Definition of Done:** `lib/db/src/schema/users.ts` exports Drizzle `users` table with columns:  
- `id` (uuid PK), `organization_id` (UUID NOT NULL, FK → organizations.id), `email` (text UNIQUE), `password_hash` (text NOT NULL), `full_name` (text NOT NULL), `status` (enum: active/inactive/suspended), `created_at`, `updated_at`  
- Index on `(organization_id, email)` for tenant‑scoped login lookups.  
Zod insert/select schemas generated via `drizzle‑zod`.  
**Anti-Patterns:** Storing plain text passwords; exposing password hash in API responses.  
**Related Files:** `lib/db/src/schema/users.ts`, `lib/db/src/schema/index.ts`

**DDD:** The `User` aggregate belongs to the Identity & Access bounded context. The `organization_id` enforces multi‑tenant isolation.  
**TDD:** Write a test that the schema generates correct SQL (columns, FK, unique constraint, index). Then implement. Test that Zod insert schema rejects invalid email and missing required fields.  
**BDD:** Users appear in registration/login scenarios from `auth.feature`.  
**Deep Module:** The table is shallow; the repository and service layers encapsulate complex queries.

### Subtasks:
- [ ] DB‑IDENTITY‑001.1: Write schema validation test (TDD red). (AGENT) – `lib/db/src/__tests__/users.test.ts`  
  **verification:** `pnpm test -- users.test.ts` red.
- [ ] DB‑IDENTITY‑001.2: Implement table with `organization_id`, FK, and indexes. (AGENT) – `lib/db/src/schema/users.ts`  
  **verification:** Test passes; `pnpm typecheck` clean.
- **Depends on:** DB‑ORG‑001.  
- **Blocks:** DB‑IDENTITY‑004 (user‑role), DB‑MIGRATE‑ALL (seed).

---

### [ ] DB‑IDENTITY‑002: Define Roles Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/roles.ts` exports `roles` table:  
- `id` (uuid PK), `organization_id` (FK → organizations.id, NOT NULL for per‑tenant roles), `name` (text NOT NULL), `description` (text)  
- Unique constraint on `(organization_id, name)`.  
Zod schemas generated.  
**Related Files:** `lib/db/src/schema/roles.ts`

**DDD:** Role is a value object in the Identity domain; can be tenant‑specific or global.  
**TDD:** Test SQL generation and Zod schema.  
**BDD:** Roles appear in permission‑related scenarios.  
**Deep Module:** Shallow DB representation.

### Subtasks:
- [ ] DB‑IDENTITY‑002.1: Write schema test. (AGENT) – `lib/db/src/__tests__/roles.test.ts`  
  **verification:** Red, then green.
- [ ] DB‑IDENTITY‑002.2: Implement table with organization scoping. (AGENT) – `lib/db/src/schema/roles.ts`  
  **verification:** Test passes, `pnpm typecheck`.
- **Depends on:** DB‑ORG‑001.

---

### [ ] DB‑IDENTITY‑003: Define Permissions Table
**Status:** ⏳ Not Started  
**Definition of Done:** `lib/db/src/schema/permissions.ts` with `id`, `name` (text UNIQUE), `description`. Global‑only, no `organization_id` (permissions are system‑wide).  
**Related Files:** `lib/db/src/schema/permissions.ts`

**DDD:** Permission is a fine‑grained policy element; not tenant‑specific.  
**TDD:** Same as above.  
**BDD:** Permissions are checked in "I can…" scenarios.  
**Deep Module:** Shallow.

### Subtasks:
- [ ] DB‑IDENTITY‑003.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑IDENTITY‑003.2: Implement table. (AGENT)  
  **verification:** Test passes.

---

### [ ] DB‑IDENTITY‑004: Define User‑Role Junction Table
**Status:** ⏳ Not Started  
**Definition of Done:** `user_roles` table with foreign keys to `users.id` and `roles.id`, plus unique constraint on `(user_id, role_id)`. Uses the `organization_id` from the user for extra safety (or rely on user's organization).  
**Related Files:** `lib/db/src/schema/user_roles.ts`

**DDD:** Many‑to‑many association between Users and Roles.  
**TDD:** Test that FK constraints are generated and duplicate pairs are rejected.  
**BDD:** Indirect.  
**Deep Module:** Shallow.

### Subtasks:
- [ ] DB‑IDENTITY‑004.1: Write schema test. (AGENT)  
  **verification:** Red → green.
- [ ] DB‑IDENTITY‑004.2: Implement table with FKs and unique constraint. (AGENT)  
  **verification:** Test passes.
- **Depends on:** DB‑IDENTITY‑001, DB‑IDENTITY‑002.

---

### [ ] DB‑IDENTITY‑005: Generate Migrations and Seed Data for Identity
**Status:** ⏳ Not Started  
**Current state:** No migration scripts exist. Identity tables will be created.  
**Definition of Done:**  
- Drizzle Kit migration generated (via `drizzle‑kit generate`) for the four identity tables.  
- `lib/db/src/seed/identity.ts` inserts an admin user (hashed password), at least one role ("admin", "user"), and the admin‑role assignment, all tied to the organization created in the organizations seed.  
**Related Files:** `lib/db/drizzle.config.ts`, `lib/db/src/seed/identity.ts`

**DDD:** Seed data populates the Identity context with initial aggregates.  
**TDD:** Integration tests (AUTH‑002) will verify the admin login.  
**BDD:** "Admin can log in after fresh install."  
**Deep Module:** N/A.

### Subtasks:
- [ ] DB‑IDENTITY‑005.1: Add migration script for identity tables (or part of combined migration). (AGENT)  
  **verification:** `drizzle‑kit generate` produces migration file.
- [ ] DB‑IDENTITY‑005.2: Write seed script that inserts admin user, roles, and assignments. (AGENT) – `lib/db/src/seed/identity.ts`  
  **verification:** Seed runs without error; manual query confirms data.
- [ ] DB‑IDENTITY‑005.3: Run migration and seed (can be done locally or as part of DB‑MIGRATE‑ALL). (HUMAN)  
  **verification:** Admin login test passes against seeded DB.
- **Depends on:** DB‑ORG‑001, DB‑IDENTITY‑001 through 004.

---

### [ ] DB‑IDENTITY‑006: Define Refresh Tokens Table with Family Tracking
**Status:** ⏳ Not Started  
**Current state:** No refresh tokens table exists – token rotation and family tracking cannot be implemented.  
**Definition of Done:** `lib/db/src/schema/refresh-tokens.ts` exports `refreshTokens` table with:
- `id` (uuid PK)
- `user_id` (uuid FK → users.id, NOT NULL)
- `organization_id` (uuid FK → organizations.id, NOT NULL) 
- `family_id` (uuid NOT NULL) - Groups refresh tokens for rotation detection
- `token_hash` (text NOT NULL, unique) - SHA-256 hash of the refresh token
- `expires_at` (timestamp NOT NULL)
- `revoked_at` (timestamp nullable) - For explicit revocation
- `created_at`, `updated_at`
- **Performance indexes**: `(user_id, family_id)`, `(family_id, expires_at)`, `(token_hash)`
- **Security constraint**: Unique on `(user_id, family_id)` for active tokens per family

**Family Tracking Logic:**
- Each login generates a new `family_id` (UUID)
- All rotated tokens in the same session share the same `family_id`
- When `invalidateAllUserTokens` is called, all tokens with the same `user_id` are revoked
- Token rotation invalidates old token and creates new one with same `family_id`
- Detect token reuse attacks by checking if same `family_id` appears multiple times

**Related Files:** `lib/db/src/schema/refresh-tokens.ts`

**DDD:** RefreshToken is a value object in the Identity domain with family tracking for security.  
**TDD:** Test token rotation, family grouping, and revocation logic.  
**BDD:** Enables "refresh token rotation" and "detect token reuse" security scenarios.  
**Deep Module:** Shallow DB representation with security constraints.

### Subtasks:
- [ ] DB‑IDENTITY‑006.1: Write schema test for refresh tokens with family tracking. (AGENT) – `lib/db/src/__tests__/refresh-tokens.test.ts`  
  **verification:** Red → green.
- [ ] DB‑IDENTITY‑006.2: Implement table with family_id column and security constraints. (AGENT) – `lib/db/src/schema/refresh-tokens.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑006.3: Add performance indexes for token lookup and family queries. (AGENT)  
  **verification:** Index test shows expected indexes.
- **Depends on:** DB‑IDENTITY‑001 (users table), DB‑ORG‑001 (organizations table).

---

## Phase 2 Identity Dependencies

### Critical Path
```
DB-IDENTITY-001 → DB-IDENTITY-002/003/004 → DB-IDENTITY-005 → DB-IDENTITY-006
```

### Parallel Execution
- **DB-IDENTITY-002** (Roles) and **DB-IDENTITY-003** (Permissions) can run in parallel after **DB-IDENTITY-001**
- **DB-IDENTITY-004** (User-Role) requires both **DB-IDENTITY-001** and **DB-IDENTITY-002**
- **DB-IDENTITY-006** (Refresh Tokens) can run in parallel with other identity tables after **DB-IDENTITY-001**

### Cross-Context Dependencies
- All identity tables depend on **DB-ORG-001** for `organization_id` foreign keys
- **DB-IDENTITY-005** enables Phase 1 authentication tests (AUTH-007) to pass
- **DB-IDENTITY-006** enables secure refresh token rotation in authentication services

### Security Considerations
- Password hashing must use Argon2id (from Phase 1 AUTH-003)
- Refresh token family tracking prevents token reuse attacks
- All identity operations must be tenant-scoped via `organization_id`
- Seed data must use properly hashed passwords, never plain text

---

## File Index

### Identity Files
- `TODO-P2-IDENTITY.md` - This file (Identity & Access context)
- `TODO-P2-INFRASTRUCTURE.md` - Test Infrastructure, DB Logger, Organizations
- `TODO-P2-APPOINTMENTS.md` - Scheduling & Appointments context
- `TODO-P2-FINANCE.md` - Financial context
- `TODO-P2-TRACKER.md` - Phase 2 execution tracking and dependencies

### Related Phase Files
- `TODO-P1-AUTH-SERVICES.md` - Authentication services that use these tables
- `TODO-P1-AUTH-API.md` - Authentication API endpoints
- `TODO-P1-AUTH-MIDDLEWARE.md` - Auth middleware for token validation

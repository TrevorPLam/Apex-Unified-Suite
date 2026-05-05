# TODO-P2-IDENTITY.md – Phase 2: Identity & Access Context

This file covers the complete Identity & Access bounded context: Users, Roles, Permissions, User-Role assignments, Refresh Tokens with family tracking, and migration/seed data. All tables include `organization_id` per the multi-tenancy ADR (ARCH-001).

---

## [ ] DB-IDENTITY-001: Define Users Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `lib/db/src/schema/` is empty. No users table exists; auth services and all user-scoped features are blocked.
**Size:** Small

**Description:** Define the Drizzle `users` table — the core identity record linking a human actor to an organization. Includes all columns needed for password-based authentication (email, hashed password, status) with a tenant-scoped unique index on `(organization_id, email)`.

**Depends on:** DB-ORG-001 (organizations FK)
**Blocks:** DB-IDENTITY-004 (user-role junction), DB-IDENTITY-005 (seed), DB-IDENTITY-006 (refresh tokens), DB-APPT-001 (service_provider FK), AUTH-003 (password hashing uses this schema)
**Related Files:** `lib/db/src/schema/users.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/users.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `pgEnum`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `users` (table), `userStatusEnum`, `insertUserSchema` (Zod), `selectUserSchema` (Zod), `InsertUser` (type), `User` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/users.ts` exists and compiles
- [ ] Columns: `id` (uuid PK, `defaultRandom()`), `organization_id` (uuid NOT NULL, FK → `organizations.id`), `email` (text NOT NULL), `password_hash` (text NOT NULL), `full_name` (text NOT NULL), `status` (pgEnum: `active|inactive|suspended`, NOT NULL, default `active`), `created_at`, `updated_at`
- [ ] Composite unique index on `(organization_id, email)` — email unique per tenant, not globally
- [ ] `insertUserSchema` omits `id`, `created_at`, `updated_at`; validates email format; omits `password_hash` from select schema export
- [ ] TypeScript types exported; `User` type NEVER includes `password_hash` in API-facing contexts (use `selectUserSchema.omit({ passwordHash: true })`)
- [ ] `lib/db/src/schema/index.ts` re-exports all from `users.ts`
- [ ] `lib/db/src/__tests__/users.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Social/OAuth login (future phase)
- Advanced profile management (avatar, phone, timezone)
- Email verification flow
- Password reset tokens (separate table if needed)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never expose `password_hash` in any API response schema — omit it at the Zod layer

**Output Artifacts**
- Code changes in: `lib/db/src/schema/users.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/users.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`

**Rollback**
- Granularity: file-level — delete `users.ts`, revert `index.ts`; no DB state changes until HUMAN runs `push`
- Halt condition: `pnpm run typecheck` failure — stop and fix before proceeding

**Rules to Follow**
- Email uniqueness is per-organization (`organization_id, email` composite unique), not globally unique
- `password_hash` must NEVER appear in `selectUserSchema` or any API response — use `omit({ passwordHash: true })` in Zod
- Always use Argon2id for hashing (from Phase 1 AUTH-003) — this table stores the result, not the algorithm
- `status` must use `pgEnum` for DB-level constraint enforcement
- All queries on this table must include `organization_id` in WHERE clauses

**Verification**
```bash
pnpm --filter @workspace/db test -- users.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Composite unique index `(organization_id, email)` supports fast login lookups and prevents cross-tenant email collision detection
- Export a `publicUserSchema = selectUserSchema.omit({ passwordHash: true })` for use in API response serialization
- `userStatusEnum` should be exported so the auth middleware can reference valid status values

**Anti-Patterns**
- Global unique constraint on `email` alone — prevents same email across multiple orgs (multi-tenant violation)
- Storing plain-text passwords — security catastrophe; always store Argon2id hash
- Exposing `password_hash` in select schemas or API responses
- Missing `organization_id` index — without it, login lookups require full-table scans

**DDD / TDD / BDD / Deep Module notes**
- DDD: `User` aggregate belongs to the Identity & Access bounded context. `organization_id` enforces multi-tenant isolation at the data layer.
- TDD: Write failing test asserting columns, FK, composite unique index, and Zod rejection of missing fields. Implement until green.
- BDD: `User` records appear in registration and login scenarios from `auth.feature`.
- Deep Module: Shallow table — repository and service layers encapsulate complex queries and authentication logic.

---

### Subtasks

- [ ] DB-IDENTITY-001.0.25 (AGENT): Read DB-ORG-001 schema, this task, and AUTH-003 (Argon2id hashing) for context.
  *No action — pause until fully understood.*

- [ ] DB-IDENTITY-001.0.5 (AGENT): Research Drizzle ORM composite unique index syntax and `drizzle-zod` `.omit()` pattern for excluding sensitive columns (May 2026).
  *Document findings briefly.*

- [ ] DB-IDENTITY-001.0.75 (AGENT): Reason about how to safely export a password-free `User` type without introducing a second manually-maintained type definition.
  *Prefer Zod `.omit()` over manual TypeScript `Omit<>` to keep schemas as the single source of truth.*

- [ ] DB-IDENTITY-001.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/users.test.ts`
  **Verification:** `pnpm --filter @workspace/db test -- users.test.ts` → RED.

- [ ] DB-IDENTITY-001.2 (AGENT): Implement `users` table, enum, Zod schemas, and types; update `index.ts`.
  **File(s):** `lib/db/src/schema/users.ts`, `lib/db/src/schema/index.ts`
  **Verification:** `pnpm --filter @workspace/db test -- users.test.ts` → GREEN; `pnpm run typecheck` clean.

- [ ] DB-IDENTITY-001.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-IDENTITY-002: Define Roles Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No roles table exists. RBAC cannot be implemented.
**Size:** Small

**Description:** Define the Drizzle `roles` table for per-tenant role definitions. Roles are tenant-scoped (each organization defines its own named roles) with a composite unique constraint on `(organization_id, name)`.

**Depends on:** DB-ORG-001 (organizations FK)
**Blocks:** DB-IDENTITY-004 (user-role junction)
**Related Files:** `lib/db/src/schema/roles.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/roles.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `roles` (table), `insertRoleSchema` (Zod), `selectRoleSchema` (Zod), `InsertRole` (type), `Role` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/roles.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (uuid NOT NULL, FK → `organizations.id`), `name` (text NOT NULL), `description` (text nullable), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, name)` — role names unique per tenant
- [ ] Zod insert/select schemas generated and exported
- [ ] `index.ts` re-exports all from `roles.ts`
- [ ] `lib/db/src/__tests__/roles.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Hierarchical/nested roles (parent/child role inheritance)
- System-wide global roles (permissions are global; roles are tenant-scoped)
- Dynamic role creation UI

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/roles.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/roles.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `roles.ts`, revert `index.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- All queries must include `organization_id` in WHERE clauses
- Role names must be unique per organization (`organization_id, name` composite unique)
- Do not hardcode role names (e.g., `admin`, `user`) in application code — always query from the roles table

**Verification**
```bash
pnpm --filter @workspace/db test -- roles.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Seed well-known role names (`admin`, `member`, `viewer`) via `DB-IDENTITY-005` rather than hardcoding in application logic
- The composite unique index serves as the lookup key for role assignment validation

**Anti-Patterns**
- Hardcoding role names as string literals in application code — use enum or DB lookup
- Global role uniqueness (missing `organization_id` in unique constraint) — allows cross-tenant role name collisions

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Role` is a value object in the Identity bounded context. Per-tenant scoping ensures each organization controls its own role definitions.
- TDD: Assert composite unique constraint on `(organization_id, name)` and SQL column generation.
- BDD: Roles appear in permission-assignment scenarios.
- Deep Module: Shallow DB representation — role assignment and RBAC enforcement logic live in the service layer.

---

### Subtasks

- [ ] DB-IDENTITY-002.0.25 (AGENT): Read DB-ORG-001 and DB-IDENTITY-001 schemas for FK reference context.
  *No action — pause until understood.*

- [ ] DB-IDENTITY-002.0.5 (AGENT): Confirm composite unique index syntax in Drizzle (same pattern as DB-IDENTITY-001).
  *No new research needed if DB-IDENTITY-001 is done.*

- [ ] DB-IDENTITY-002.0.75 (AGENT): Reason about whether to seed default roles in this task or DB-IDENTITY-005.
  *Default: seed in DB-IDENTITY-005 only.*

- [ ] DB-IDENTITY-002.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/roles.test.ts`
  **Verification:** RED.

- [ ] DB-IDENTITY-002.2 (AGENT): Implement `roles` table, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/roles.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-IDENTITY-002.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-IDENTITY-003: Define Permissions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No permissions table exists. Fine-grained authorization cannot be implemented.
**Size:** Small

**Description:** Define the Drizzle `permissions` table for system-wide permission codes. Unlike roles, permissions are global (no `organization_id`) — they represent capabilities like `crm:read` or `finance:write` that are assigned to roles, not tenants.

**Depends on:** [N/A] — no FK dependencies; can run in parallel with DB-IDENTITY-002
**Blocks:** DB-IDENTITY-004 (role-permission junction, if added), DB-IDENTITY-005 (seed)
**Related Files:** `lib/db/src/schema/permissions.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/permissions.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `permissions` (table), `insertPermissionSchema` (Zod), `selectPermissionSchema` (Zod), `InsertPermission` (type), `Permission` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/permissions.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `name` (text UNIQUE NOT NULL), `description` (text nullable), `created_at`
- [ ] Global unique constraint on `name` — permissions are system-wide
- [ ] Zod schemas and types exported
- [ ] `index.ts` re-exports all from `permissions.ts`
- [ ] `lib/db/src/__tests__/permissions.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Per-tenant permission definitions (permissions are global by design)
- Resource-based permissions (e.g., row-level object permissions)
- Dynamic permission creation via UI

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/permissions.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/permissions.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `permissions.ts`, revert `index.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Permission `name` must follow a colon-namespaced convention: `<module>:<action>` (e.g., `crm:read`, `finance:write`)
- No `organization_id` column — permissions are system-wide constants, not tenant-configurable
- Permission names are immutable once seeded — changing them breaks role assignments

**Verification**
```bash
pnpm --filter @workspace/db test -- permissions.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Use a `PERMISSION_CODES` constant object in the service layer (e.g., `{ CRM_READ: 'crm:read' }`) referencing permission names — avoids magic strings in auth checks
- Seed all permission codes in `DB-IDENTITY-005`

**Anti-Patterns**
- Per-tenant permission definitions — defeats the purpose of global permission codes
- Mutable permission names — breaks all role assignments that reference the old name
- Missing global unique constraint — duplicate permission names cause silent authorization bugs

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Permission` is a fine-grained policy element in the Identity bounded context. Global scope ensures consistent authorization semantics across all tenants.
- TDD: Assert global unique constraint and SQL column generation.
- BDD: Permissions are checked in "I can perform action X" authorization scenarios.
- Deep Module: Shallow storage — permission-checking logic lives in the authorization service/middleware.

---

### Subtasks

- [ ] DB-IDENTITY-003.0.25 (AGENT): Read this task and DB-IDENTITY-005 to understand the seeding relationship.
  *No action — pause until understood.*

- [ ] DB-IDENTITY-003.0.5 (AGENT): [N/A] — no new research needed; same Drizzle patterns as prior tasks.

- [ ] DB-IDENTITY-003.0.75 (AGENT): Define the initial permission code list to seed (e.g., `crm:read`, `crm:write`, `finance:read`, `finance:write`, `admin:all`). Confirm with user if uncertain.
  *Document the list as a comment in `permissions.ts`.*

- [ ] DB-IDENTITY-003.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/permissions.test.ts`
  **Verification:** RED.

- [ ] DB-IDENTITY-003.2 (AGENT): Implement `permissions` table, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/permissions.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-IDENTITY-003.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-IDENTITY-004: Define User-Role Junction Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No user-role junction exists. Users cannot be assigned roles; RBAC is non-functional.
**Size:** Small

**Description:** Define the `user_roles` junction table that associates users with roles within an organization. Includes a composite unique constraint on `(user_id, role_id)` to prevent duplicate assignments, and references `organization_id` for an extra safety layer.

**Depends on:** DB-IDENTITY-001 (users FK), DB-IDENTITY-002 (roles FK)
**Blocks:** DB-IDENTITY-005 (seed data assigns admin role to admin user)
**Related Files:** `lib/db/src/schema/user_roles.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/user-roles.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `timestamp`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `userRoles` (table), `insertUserRoleSchema` (Zod), `selectUserRoleSchema` (Zod), `InsertUserRole` (type), `UserRole` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/user_roles.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `user_id` (uuid NOT NULL, FK → `users.id`), `role_id` (uuid NOT NULL, FK → `roles.id`), `organization_id` (uuid NOT NULL, FK → `organizations.id`), `assigned_at` (timestamp NOT NULL, `defaultNow()`), `assigned_by` (uuid nullable, FK → `users.id`)
- [ ] Composite unique constraint on `(user_id, role_id)` — prevents duplicate assignments
- [ ] Zod schemas and types exported
- [ ] `index.ts` re-exports all from `user_roles.ts`
- [ ] `lib/db/src/__tests__/user-roles.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Time-limited/expiring role assignments
- Role assignment approval workflows
- Role assignment history/audit trail (Phase 4+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/db/src/schema/user_roles.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/user-roles.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `user_roles.ts`, revert `index.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- All queries must include `organization_id` in WHERE clauses (derived from the user's organization)
- Unique constraint on `(user_id, role_id)` prevents duplicate role assignments
- `assigned_by` tracks who made the assignment for audit purposes — nullable for seeded assignments
- FK constraints must cascade appropriately: deleting a user should cascade-delete their role assignments

**Verification**
```bash
pnpm --filter @workspace/db test -- user-roles.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `onDelete: 'cascade'` on the `user_id` FK so deleting a user removes their role assignments automatically
- Include `organization_id` redundantly as a direct column (not just via FK) to enable direct organization-scoped queries without table joins

**Anti-Patterns**
- Missing unique constraint on `(user_id, role_id)` — allows duplicate role assignments
- No cascade delete on user FK — orphaned assignments remain after user deletion

**DDD / TDD / BDD / Deep Module notes**
- DDD: Many-to-many association between Users and Roles within tenant boundaries. The junction table is an infrastructure concern; assignment validation belongs in the service layer.
- TDD: Assert FK constraints and composite unique constraint via schema test.
- BDD: Indirect — supports role-assignment scenarios.
- Deep Module: Simple junction table; assignment validation logic lives in service layer.

---

### Subtasks

- [ ] DB-IDENTITY-004.0.25 (AGENT): Read DB-IDENTITY-001 (users) and DB-IDENTITY-002 (roles) schemas for FK reference.
  *No action — pause until understood.*

- [ ] DB-IDENTITY-004.0.5 (AGENT): Confirm Drizzle FK `references()` with `onDelete: 'cascade'` syntax.
  *No new research needed if prior tasks are done.*

- [ ] DB-IDENTITY-004.0.75 (AGENT): Reason about whether `assigned_by` self-referential FK creates a bootstrap problem for seeding.
  *Default: make `assigned_by` nullable; seed records can have NULL.*

- [ ] DB-IDENTITY-004.1 (AGENT): Write failing schema test.
  **File(s):** `lib/db/src/__tests__/user-roles.test.ts`
  **Verification:** RED.

- [ ] DB-IDENTITY-004.2 (AGENT): Implement `user_roles` table, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/user_roles.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-IDENTITY-004.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-IDENTITY-005: Generate Migrations and Seed Data for Identity
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No seed scripts exist. The development database has no admin user, no roles, and no permissions. AUTH integration tests cannot pass against a real database.
**Size:** Medium

**Description:** Create the seed script that populates the Identity context with the minimum viable data set: one organization, an admin user (Argon2id-hashed password), system permission codes, seeded roles, and the admin-role assignment — enabling a fresh install to be immediately usable for development and testing.

**Depends on:** DB-ORG-001, DB-IDENTITY-001, DB-IDENTITY-002, DB-IDENTITY-003, DB-IDENTITY-004
**Blocks:** AUTH-007 (integration tests against seeded DB), all Phase 1 auth E2E tests, any manual developer testing
**Related Files:** `lib/db/src/seed/identity.ts`, `lib/db/src/seed/index.ts`, `lib/db/drizzle.config.ts`

**Imports / Exports**
- Imports: `@workspace/db` (db, schema), `argon2` (from Phase 1 auth services), `crypto` (randomUUID)
- Exports: `seedIdentity()` async function

**Definition of Done**
- [ ] `lib/db/src/seed/identity.ts` exports `seedIdentity()` function
- [ ] Seed inserts: one organization (`name: 'Apex Demo', slug: 'apex-demo', plan_type: 'pro'`)
- [ ] Seed inserts: admin user (`email: 'admin@example.com'`, password hashed with Argon2id, `status: 'active'`)
- [ ] Seed inserts: system permission codes (`crm:read`, `crm:write`, `finance:read`, `finance:write`, `admin:all`, and equivalents for all 10 modules)
- [ ] Seed inserts: `admin` and `member` roles for the demo organization
- [ ] Seed inserts: admin-user → admin-role assignment
- [ ] Seed is idempotent (safe to run multiple times — uses `ON CONFLICT DO NOTHING` or checks existence first)
- [ ] `lib/db/src/seed/index.ts` orchestrates all context seeds in dependency order
- [ ] HUMAN can run `pnpm --filter @workspace/db run seed` successfully
- [ ] Admin login test (`AUTH-007`) passes against seeded DB

**Out of Scope**
- Generating synthetic bulk seed data for load testing
- Per-environment seed configurations (use `.env` files for that)
- Seed rollback/teardown (use test database teardown for that)

**Safety Boundaries**
- Never commit seeded passwords in plain text — always hash with Argon2id before inserting
- Never commit `.env*`, credentials, or the seeded password itself to source control
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- The `admin@example.com` password must come from an env var (`SEED_ADMIN_PASSWORD`), not a hardcoded literal

**Output Artifacts**
- Code changes in: `lib/db/src/seed/identity.ts`, `lib/db/src/seed/index.ts`
- Tests added/updated in: [N/A] — validated by AUTH-007 integration test
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`

**Rollback**
- Granularity: database-level — truncate identity tables in reverse FK order (`user_roles`, `users`, `roles`, `permissions`, `organizations`) to revert seed data
- Halt condition: if `seedIdentity()` throws a FK violation, stop and verify tables were created via `push` before seeding

**Rules to Follow**
- Seed must be idempotent — wrap inserts with `ON CONFLICT DO NOTHING` or check-then-insert
- Admin password must be read from `process.env.SEED_ADMIN_PASSWORD` with a sensible local default (document this in README; never hardcode in source)
- Password hash must use Argon2id (consistent with Phase 1 auth services)
- All seeded records must have proper `organization_id` references
- Run seeds in FK-safe order: organizations → permissions → users → roles → user_roles

**Verification**
```bash
# After push, run seed
pnpm --filter @workspace/db run seed

# Verify admin login works
pnpm --filter @workspace/api-server test -- auth.integration.test.ts
```

**Advanced Code Patterns**
- Use `db.insert(table).values(data).onConflictDoNothing()` for idempotent inserts
- Wrap entire seed in a single transaction so partial failures leave the DB clean
- Use `crypto.randomUUID()` for seeded IDs to ensure reproducibility across environments

**Anti-Patterns**
- Plain-text passwords in seed scripts — catastrophic security failure
- Non-idempotent seeds — running twice creates duplicate data
- Hardcoded UUIDs as seed PKs without reproducibility rationale — makes seed data brittle

**DDD / TDD / BDD / Deep Module notes**
- DDD: Seed data populates the Identity bounded context with initial aggregates. Migration generates the Postgres schema for all identity tables.
- TDD: AUTH-007 integration test acts as the validation gate for this seed script.
- BDD: "Admin can log in after fresh install" — this seed enables that scenario.
- Deep Module: [N/A] — infrastructure task.

---

### Subtasks

- [ ] DB-IDENTITY-005.0.25 (AGENT): Read DB-IDENTITY-001 through 004 schemas and AUTH-003 (Argon2id) to understand seeding dependencies.
  *No action — pause until fully understood.*

- [ ] DB-IDENTITY-005.0.5 (AGENT): Research Drizzle `onConflictDoNothing()` API and transaction wrapping for seed scripts (May 2026).
  *Confirm the API signature for the current drizzle-orm version in use.*

- [ ] DB-IDENTITY-005.0.75 (AGENT): Reason about the permission code list — confirm module names and action verbs with the 10-module architecture.
  *Default list: `crm:read/write`, `finance:read/write`, `projects:read/write`, `documents:read/write`, `assets:read/write`, `portal:read/write`, `analytics:read`, `settings:read/write`, `admin:all`.*

- [ ] DB-IDENTITY-005.1 (AGENT): Implement `seedIdentity()` with idempotent inserts inside a transaction.
  **File(s):** `lib/db/src/seed/identity.ts`
  **Verification:** `pnpm run typecheck` clean; function runs without errors against test DB.

- [ ] DB-IDENTITY-005.2 (AGENT): Create seed orchestrator; add `seed` script to `lib/db/package.json`.
  **File(s):** `lib/db/src/seed/index.ts`, `lib/db/package.json`
  **Verification:** `pnpm --filter @workspace/db run seed` succeeds with no errors.

- [ ] DB-IDENTITY-005.3 (HUMAN): Run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/db run seed` against the dev database and confirm admin login works.
  **Verification:** Admin login via `/auth/login` returns a valid JWT.

- [ ] DB-IDENTITY-005.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DB-IDENTITY-006: Define Refresh Tokens Table with Family Tracking
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No refresh tokens table exists. Secure token rotation with reuse detection cannot be implemented.
**Size:** Small

**Description:** Define the `refresh_tokens` table with family tracking — the data backbone for secure JWT refresh-token rotation. Each login creates a new `family_id`; rotated tokens share the same family; reuse of a revoked token invalidates the entire family, preventing token-theft attacks.

**Depends on:** DB-IDENTITY-001 (users FK), DB-ORG-001 (organizations FK)
**Blocks:** AUTH-004 (token rotation service), AUTH-005 (refresh endpoint)
**Related Files:** `lib/db/src/schema/refresh-tokens.ts`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/refresh-tokens.test.ts`

**Imports / Exports**
- Imports: `pgTable`, `uuid`, `text`, `timestamp`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
- Exports: `refreshTokens` (table), `insertRefreshTokenSchema` (Zod), `selectRefreshTokenSchema` (Zod), `InsertRefreshToken` (type), `RefreshToken` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/refresh-tokens.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `user_id` (uuid NOT NULL, FK → `users.id` with `onDelete: 'cascade'`), `organization_id` (uuid NOT NULL, FK → `organizations.id`), `family_id` (uuid NOT NULL), `token_hash` (text NOT NULL UNIQUE — SHA-256 of the raw token), `expires_at` (timestamp NOT NULL), `revoked_at` (timestamp nullable), `created_at` (timestamp NOT NULL, `defaultNow()`)
- [ ] Performance indexes: `(user_id, family_id)`, `(family_id, expires_at)`, unique on `token_hash`
- [ ] `token_hash` is globally unique — SHA-256 hash of the raw refresh token string
- [ ] Zod schemas and types exported
- [ ] `index.ts` re-exports all from `refresh-tokens.ts`
- [ ] `lib/db/src/__tests__/refresh-tokens.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Token encryption (hash is sufficient for lookup; the raw token is sent to the client, never stored)
- Cross-device token synchronization
- Token analytics or usage reporting

**Safety Boundaries**
- Never store raw refresh token strings — store only SHA-256 hash
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never log raw token values

**Output Artifacts**
- Code changes in: `lib/db/src/schema/refresh-tokens.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/refresh-tokens.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `refresh-tokens.ts`, revert `index.ts`
- Halt condition: `pnpm run typecheck` failure

**Rules to Follow**
- Store only the SHA-256 hash of the token (`crypto.createHash('sha256').update(rawToken).digest('hex')`) — never the raw token
- `family_id` groups all tokens from a single login session; reuse of a revoked token must trigger revocation of the entire family
- `expires_at` must be set by the application (not the DB) using the configured TTL from env vars
- `onDelete: 'cascade'` on `user_id` — deleting a user purges all their tokens
- Periodically clean up expired tokens (cron job or application startup) to prevent table bloat

**Verification**
```bash
pnpm --filter @workspace/db test -- refresh-tokens.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Family tracking: when a token is rotated, create a new record with the same `family_id`. If a token with `revoked_at IS NOT NULL` is presented, revoke ALL tokens in that `family_id` immediately (token reuse = breach detected)
- Index on `(user_id, family_id)` enables fast "revoke all tokens for user" operations with a single indexed query
- Index on `(family_id, expires_at)` enables fast family-level reuse detection queries

**Anti-Patterns**
- Storing raw refresh tokens in the database — tokens are secrets; if the DB is breached, all sessions are compromised
- Missing `family_id` — cannot detect token reuse attacks without family grouping
- No expiry cleanup — table grows unbounded; expired tokens accumulate indefinitely
- Allowing token rotation without checking `revoked_at` — defeats the entire reuse-detection mechanism

**DDD / TDD / BDD / Deep Module notes**
- DDD: `RefreshToken` is a value object in the Identity bounded context with family tracking for security. The family-based reuse-detection logic belongs in `RefreshTokenService`, not in this table.
- TDD: Test that token rotation, family grouping, and revocation constraints are correctly defined at the schema level.
- BDD: Enables "detect token reuse attack" and "secure session after token rotation" security scenarios.
- Deep Module: The table is shallow storage; the complex reuse-detection and rotation logic belongs in `RefreshTokenService` (Phase 1 auth services).

---

### Subtasks

- [ ] DB-IDENTITY-006.0.25 (AGENT): Read DB-IDENTITY-001 (users FK) and AUTH-004/005 tasks to understand the token rotation flow this table must support.
  *No action — pause until fully understood.*

- [ ] DB-IDENTITY-006.0.5 (AGENT): Research SHA-256 token hashing pattern in Node.js (`crypto.createHash`) and confirm the `(family_id, expires_at)` index is sufficient for reuse-detection queries (May 2026).
  *No library dependency needed — use Node.js built-in `crypto`.*

- [ ] DB-IDENTITY-006.0.75 (AGENT): Reason about whether `token_hash` unique constraint should be at DB level (yes) or service level only (no — DB constraint is the safety net).
  *Decision: DB-level unique constraint on `token_hash` is mandatory.*

- [ ] DB-IDENTITY-006.1 (AGENT): Write failing schema test including all indexes and unique constraints.
  **File(s):** `lib/db/src/__tests__/refresh-tokens.test.ts`
  **Verification:** RED.

- [ ] DB-IDENTITY-006.2 (AGENT): Implement `refresh_tokens` table, indexes, Zod schemas, types; update `index.ts`.
  **File(s):** `lib/db/src/schema/refresh-tokens.ts`, `lib/db/src/schema/index.ts`
  **Verification:** GREEN; `pnpm run typecheck` clean.

- [ ] DB-IDENTITY-006.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Phase 2 Identity: Critical Path & Dependencies

### Execution Order
```
DB-ORG-001
  └─> DB-IDENTITY-001 (users)
        └─> DB-IDENTITY-002 (roles) ─────┐
        └─> DB-IDENTITY-003 (permissions) ┤ (parallel)
        └─> DB-IDENTITY-006 (refresh tokens)
              └─> DB-IDENTITY-004 (user-role junction — needs 001+002)
                    └─> DB-IDENTITY-005 (migrations + seed)
```

### Parallel Execution
- **DB-IDENTITY-002** (Roles) and **DB-IDENTITY-003** (Permissions) can run in parallel after **DB-IDENTITY-001**
- **DB-IDENTITY-006** (Refresh Tokens) can run in parallel with 002/003 after **DB-IDENTITY-001**

---

## File Index

### Identity Files
- `TODO-P2-IDENTITY.md` — This file
- `TODO-P2-INFRASTRUCTURE.md` — Test Infrastructure, DB Logger, BaseRepository
- `TODO-P2-ORGANIZATIONS.md` — Organizations multi-tenancy anchor
- `TODO-P2-APPOINTMENTS.md` — Scheduling & Appointments context
- `TODO-P2-FINANCE.md` — Financial context

### Related Phase Files
- `TODO-P1-AUTH-SERVICES.md` — Auth services that use these tables
- `TODO-P1-AUTH-API.md` — Auth API endpoints
- `TODO-P1-AUTH-MIDDLEWARE.md` — Auth middleware for token validation

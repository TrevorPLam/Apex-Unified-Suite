# TODO-P2-ORGANIZATIONS.md – Phase 2: Organizations Multi-Tenancy

This context covers the Organizations bounded context, which serves as the multi-tenancy anchor for the entire system. Every business table in every other context references this via `organization_id`.

---

## [ ] DB-ORG-001: Define Organizations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `lib/db/src/schema/` is empty — no tables have been defined. `index.ts` exports nothing. Multi-tenancy cannot be enforced anywhere until this table exists.
**Size:** Small

**Description:** Create the Drizzle `organizations` table — the root of all multi-tenancy in the system. Every other bounded-context table will carry an `organization_id` FK referencing this table.

**Depends on:** ARCH-001 (multi-tenancy ADR accepted)
**Blocks:** DB-IDENTITY-001, DB-IDENTITY-002, DB-IDENTITY-003, DB-IDENTITY-006, DB-FIN-001 through DB-FIN-014, DB-AP-001 through DB-AP-004, DB-AR-001, DB-APPT-001 through DB-APPT-014, TEST-INFRA-001, ARCH-001.2-IMPL
**Related Files:** `lib/db/src/schema/organizations.ts`, `lib/db/src/schema/index.ts`

**Imports / Exports**
- Imports: `pgTable`, `text`, `uuid`, `timestamp`, `pgEnum`, `jsonb`, `index`, `uniqueIndex` from `drizzle-orm/pg-core`; `createInsertSchema`, `createSelectSchema` from `drizzle-zod` (project uses v0.8.3; Drizzle v1.0 moves these to `drizzle-orm/zod`)
- Exports: `organizations` (table), `planTypeEnum`, `insertOrganizationSchema` (Zod), `selectOrganizationSchema` (Zod), `InsertOrganization` (type), `Organization` (type)

**Definition of Done**
- [ ] `lib/db/src/schema/organizations.ts` exists and compiles cleanly
- [ ] Columns: `id` (uuid PK, `defaultRandom()`), `name` (text NOT NULL), `slug` (text UNIQUE NOT NULL), `plan_type` (pgEnum: `free|pro|enterprise`, NOT NULL), `settings` (jsonb NOT NULL default `{}`), `created_at` (timestamp NOT NULL, `defaultNow()`), `updated_at` (timestamp NOT NULL, `defaultNow()`)
- [ ] GIN index on `settings` JSONB column
- [ ] `insertOrganizationSchema` rejects invalid `plan_type` and validates slug format (`/^[a-z0-9-]+$/`)
- [ ] `selectOrganizationSchema` generated via `createSelectSchema`
- [ ] TypeScript types `InsertOrganization` and `Organization` exported
- [ ] `lib/db/src/schema/index.ts` re-exports all from `organizations.ts`
- [ ] `lib/db/src/__tests__/organizations.test.ts` passes (TDD red → green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Organization hierarchy (parent/child org relationships)
- Organization billing lifecycle or Stripe customer ID management
- User invitation or onboarding flows
- `deleted_at` soft-delete (add later if needed)
- PostgreSQL RLS policies (`pgPolicy`) — application-level `organization_id` scoping is used for now; RLS is a future hardening step

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `DATABASE_URL`, credentials, secrets
- Never run `pnpm --filter @workspace/db run push` without explicit HUMAN approval
- Never modify `pnpm-workspace.yaml`, root `tsconfig.json`, or `tsconfig.base.json`

**Output Artifacts**
- Code changes in: `lib/db/src/schema/organizations.ts`, `lib/db/src/schema/index.ts`
- Tests added/updated in: `lib/db/src/__tests__/organizations.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — project uses `drizzle-kit push`, not `drizzle-kit generate`

**Rollback**
- Granularity: file-level — delete `organizations.ts`, revert `index.ts` to empty; no DB state is modified until HUMAN runs `push`
- Halt condition: `pnpm run typecheck` failure after implementation — stop and fix types before proceeding

**Rules to Follow**
- Use `uuid('id').primaryKey().defaultRandom()` — no serial/auto-increment IDs
- `plan_type` must use `pgEnum` so Postgres enforces the constraint at the DB layer
- `settings` JSONB must default to `{}` (not `null`) to avoid null-check overhead
- `slug` Zod schema must enforce `/^[a-z0-9-]+$/` regex for URL-safe identifiers
- `updated_at` must be updated by application code on every write (no DB triggers)
- Export `planTypeEnum` alongside the table so other schemas can reference it without circular imports

**Verification**
```bash
# TDD red first, green after implementation
pnpm --filter @workspace/db test -- organizations.test.ts

# Full workspace typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- `pgEnum` for `plan_type` enforces valid values at the Postgres level, not just application code
- GIN index on `settings` JSONB enables fast `@>` (contains) and `?` (key-exists) queries for per-org feature-flag lookups
- Future: `pgPolicy` via `drizzle-orm/pg-core` can add PostgreSQL RLS as a hardening layer; see Drizzle RLS docs for the `.withRLS()` pattern (as of Drizzle v1.0 RC, May 2026)

**Anti-Patterns**
- Serial/integer PKs — enables enumeration attacks; always use UUID
- Raw `text` column for `plan_type` — invalid plan values silently enter the DB
- `settings` defaulting to `null` — forces null checks in every consumer
- Missing GIN index on `settings` — causes full-table scans on JSONB queries
- Hardcoding `organization_id` values anywhere in application code

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Organization` is the aggregate root of the multi-tenancy bounded context. All other bounded contexts receive `organization_id` from auth context but do not reach into Organization internals.
- TDD: Write the failing test first — assert all columns, unique `slug`, GIN index on `settings`, Zod rejection of invalid `plan_type`. Implement until green.
- BDD: [N/A] — infrastructure/storage entity, not a user-facing behavior.
- Deep Module: Shallow table with minimal logic. Multi-tenancy enforcement (scoping all queries to `organization_id`) belongs in `BaseRepository` (ARCH-001.2-IMPL), not in this table definition.

---

### Subtasks

- [ ] DB-ORG-001.0.25 (AGENT): Read this task, the ARCH-001 ADR, and `lib/db/src/schema/index.ts` in full.
  *No action — pause until the multi-tenancy contract is fully understood.*

- [ ] DB-ORG-001.0.5 (AGENT): Research Drizzle ORM `pgEnum`, `jsonb`, GIN index syntax; confirm `drizzle-zod` vs `drizzle-orm/zod` status for the project's current version (May 2026).
  *Note: `drizzle-zod` is deprecated in Drizzle v1.0 RC in favour of `drizzle-orm/zod`. Project currently uses `drizzle-zod@^0.8.3` — use existing package; document migration path.*

- [ ] DB-ORG-001.0.75 (AGENT): Reason about slug regex, GIN index syntax in Drizzle, and `planTypeEnum` export to avoid circular imports.
  *If any syntax is uncertain, consult drizzle.team docs before writing code.*

- [ ] DB-ORG-001.1 (AGENT): Write the failing schema validation test.
  **File(s):** `lib/db/src/__tests__/organizations.test.ts`
  **Verification:** `pnpm --filter @workspace/db test -- organizations.test.ts` → RED

- [ ] DB-ORG-001.2 (AGENT): Implement `organizations` table, Zod schemas, and TypeScript types; re-export from `index.ts`.
  **File(s):** `lib/db/src/schema/organizations.ts`, `lib/db/src/schema/index.ts`
  **Verification:** `pnpm --filter @workspace/db test -- organizations.test.ts` → GREEN; `pnpm run typecheck` clean

- [ ] DB-ORG-001.3 (HUMAN): Review schema, approve, and run `pnpm --filter @workspace/db run push` against the dev database.
  **Verification:** `push` completes without errors; `organizations` table visible in DB inspector.

- [ ] DB-ORG-001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## File Index

### Phase 2 Context Files
- `TODO-P2-ORGANIZATIONS.md` — This file (Organizations multi-tenancy anchor)
- `TODO-P2-INFRASTRUCTURE.md` — Test infrastructure, DB logger, BaseRepository
- `TODO-P2-IDENTITY.md` — Identity & Access context (Users, Roles, Permissions, Refresh Tokens)
- `TODO-P2-APPOINTMENTS.md` — Scheduling & Appointments context (Calendly-style)
- `TODO-P2-FINANCE.md` — Financial context (Invoicing, Payments, AP, AR)

### Related Phase Files
- `TODO-P0-ARCHITECTURE.md` — ARCH-001 ADR (multi-tenancy design decision)
- `TODO-P1-AUTH-SERVICES.md` — Auth services that depend on the organizations table

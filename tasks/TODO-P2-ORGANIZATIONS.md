# TODO-P2-ORGANIZATIONS.md – Phase 2: Organizations Multi-Tenancy

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the Organizations context which serves as the multi-tenancy anchor for the entire system.

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

**DDD:** Organization is the root of multi‑tenancy. All business tables reference this via `organization_id`. **Tenant scoping note:** All queries must be scoped to the current tenant's organization to prevent data cross-contamination.  
**TDD:** Test SQL generation (columns, unique constraints, GIN index). Test Zod schema rejects invalid plan_type. Test tenant scoping prevents cross-tenant data access.  
**BDD:** N/A – infrastructure entity.  
**Deep Module:** Shallow table; the multi‑tenancy logic lives in BaseRepository.  

**Rules to Follow:**  
- Always include `organization_id` in WHERE clauses for multi-tenant tables  
- Never allow queries to access data from other organizations  
- Validate organization membership in service layer  

**Advanced Code Patterns:**  
- Use Row Level Security (RLS) for additional tenant isolation  
- Implement organization-aware caching strategies  

**Anti-Patterns:**  
- Missing organization scoping in queries  
- Allowing cross-tenant data access  
- Hard-coding organization IDs instead of using context  

**Out of Scope:**  
- Organization hierarchy (parent/child relationships)  
- Organization billing management  
- User invitation system  

### Subtasks:
- [ ] DB‑ORG‑001.1: Write schema validation test – assert all columns, unique `slug`, and GIN index on `settings`. (AGENT) – `lib/db/src/__tests__/organizations.test.ts`  
  **verification:** `pnpm test -- organizations.test.ts` fails (table not yet created), then passes after implementation.
- [ ] DB‑ORG‑001.2: Implement table and Zod schemas using `drizzle‑zod`. (AGENT) – `lib/db/src/schema/organizations.ts`  
  **verification:** Test passes, `pnpm typecheck` clean.
- **Depends on:** ARCH‑001 (ADR accepted).
- **Blocks:** DB‑IDENTITY‑001, all other Phase 2 schema tasks.

---

## File Index

### Infrastructure Files
- `TODO-P2-INFRASTRUCTURE.md` - Test Infrastructure, DB Logger
- `TODO-P2-ORGANIZATIONS.md` - Organizations multi-tenancy anchor
- `TODO-P2-IDENTITY.md` - Identity & Access context (Users, Roles, Permissions)
- `TODO-P2-APPOINTMENTS.md` - Scheduling & Appointments context (Calendly-style)
- `TODO-P2-FINANCE.md` - Financial context (Invoicing, Payments, Expenses)

### Related Phase Files
- `TODO-MASTER-TRACKER.md` - Phase 0 & 1 consolidated tracking
- `TODO-P0-*.md` - Phase 0 foundation and architecture tasks
- `TODO-P1-*.md` - Phase 1 authentication system tasks

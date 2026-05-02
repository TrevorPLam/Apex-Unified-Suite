# TODO-P3-INFRASTRUCTURE.md – Phase 3: Cross‑Cutting Infrastructure

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the Cross‑Cutting Infrastructure that enables all other API contexts – RBAC middleware and OpenAPI spec modularisation. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## Cross‑Cutting Infrastructure

### RBAC‑001: Role‑Based Access Control Middleware
**Status:** ⏳ Not Started  
**Depends on:** AUTH‑008 (auth middleware), DB‑IDENTITY‑005 (users, roles, user_roles tables).  
**Blocks:** All CRM route implementations (API‑CRM‑004, API‑CRM‑009, API‑CRM‑013, API‑CRM‑017, API‑CRM‑021).  
**Definition of Done:** `artifacts/api-server/src/middlewares/rbac.ts` exports RBAC middleware that enforces role-based permissions on protected routes.  
- Middleware reads JWT token from `req.user` (set by AUTH‑008)  
- Queries user's roles for the current organization from `user_roles` and `roles` tables  
- Supports permission checking by resource and action (e.g., `crm:leads:create`, `crm:leads:read`, `crm:leads:update`)  
- Returns 403 `InsufficientPermissions` when user lacks required permission  
- Includes caching of user permissions for performance (5-minute cache)  
- Configurable permission matrix for different user roles (admin, manager, user)  

**Permission Matrix Examples:**
- **Admin**: All permissions (`*:*`)
- **Manager**: `crm:*:read`, `crm:*:create`, `crm:*:update` (no delete)
- **User**: `crm:*:read` (read-only access)

**Related Files:** `artifacts/api-server/src/middlewares/rbac.ts`

**DDD:** RBAC enforces bounded context access rules at the infrastructure layer, preserving domain integrity.  
**TDD:** Write unit tests for permission checking logic and caching behavior.  
**BDD:** Enables "Only users with appropriate roles can access CRM features" scenarios.  
**Deep Module:** Middleware hides complex permission logic behind simple interface.

### Subtasks:
- [ ] RBAC‑001.1: Define permission matrix and role constants. (AGENT) – `src/lib/permissions/permissions.ts`  
  **verification:** Permission matrix compiles; role constants defined.
- [ ] RBAC‑001.2: Implement RBAC middleware with user role lookup and permission checking. (AGENT) – `middlewares/rbac.ts`  
  **verification:** Middleware unit tests pass.
- [ ] RBAC‑001.3: Add permission caching with TTL (5 minutes). (AGENT)  
  **verification:** Cache tests pass; performance measured.
- [ ] RBAC‑001.4: Write unit tests for permission matrix, role lookup, and caching. (AGENT)  
  **verification:** All tests green.
- [ ] RBAC‑001.5: Integration test with CRM routes (mocked). (AGENT)  
  **verification:** Middleware correctly blocks unauthorized requests.

---

### API‑SPEC‑001: OpenAPI Spec Modularisation
**Status:** ⏳ Not Started  
**Depends on:** None (infrastructure task).  
**Blocks:** All subsequent API expansion tasks (when spec exceeds ~500 lines).  
**Definition of Done:** When the OpenAPI spec exceeds ~500 lines, split into per‑context files under `lib/api-spec/contexts/` and use `$ref` to maintain a single coherent API specification.

**Modularisation Structure:**
- Main spec: `lib/api-spec/openapi.yaml` (contains common types, servers, and `$ref` imports)
- Context specs: `lib/api-spec/contexts/{context}.yaml` (e.g., `crm.yaml`, `auth.yaml`, `projects.yaml`)
- Each context spec contains its own paths, components, and tags
- Main spec imports all context specs using `$ref` pointers

**Implementation Pattern:**
```yaml
# In main openapi.yaml
paths:
  /crm/leads:
    $ref: './contexts/crm.yaml#/paths/~1crm~1leads'
  /auth/register:
    $ref: './contexts/auth.yaml#/paths/~1auth~1register'

components:
  schemas:
    Lead:
      $ref: './contexts/crm.yaml#/components/schemas/Lead'
    User:
      $ref: './contexts/auth.yaml#/components/schemas/User'
```

**Anti-Patterns:** Duplicating schemas across files; circular references; breaking existing client generation.  
**Related Files:** `lib/api-spec/openapi.yaml`, `lib/api-spec/contexts/`

**DDD:** Each bounded context maintains its own API specification while preserving a unified contract.  
**TDD:** Verify that `pnpm codegen` continues to work after modularisation.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** N/A – specification organization.

### Subtasks:
- [ ] API‑SPEC‑001.1: Monitor OpenAPI spec size. When it exceeds 500 lines, create `lib/api-spec/contexts/` directory. (AGENT)  
  **verification:** Directory created when needed.
- [ ] API‑SPEC‑001.2: Extract CRM paths and schemas into `contexts/crm.yaml`. (AGENT)  
  **verification:** Main spec uses `$ref` to CRM context; `pnpm codegen` still works.
- [ ] API‑SPEC‑001.3: Extract Auth paths and schemas into `contexts/auth.yaml`. (AGENT)  
  **verification:** Auth endpoints still generate correctly.
- [ ] API‑SPEC‑001.4: Update Orval configuration to handle modular specs. (AGENT) – `lib/api-spec/orval.config.ts`  
  **verification:** Code generation produces same output as before.
- [ ] API‑SPEC‑001.5: Run `pnpm codegen` and verify all generated clients work. (HUMAN)  
  **verification:** `pnpm typecheck` passes; generated hooks unchanged.
- **Blocks:** Future API expansion tasks (Phase 4+).

---

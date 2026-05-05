# tasks/infrastructure/RBAC.md – Role‑Based Access Control

This file contains the RBAC middleware and permission infrastructure that enforces resource‑level access control on all protected API routes. It builds on the authentication middleware and the Identity database schema.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] RBAC‑001: Role‑Based Access Control Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No RBAC middleware exists; authenticated routes are unprotected beyond JWT validation from AUTH‑008.
**Size:** Large

**Description:** Implement a role‑based access control middleware factory that enforces per‑resource, per‑action permissions on all protected API routes, backed by the `user_roles` and `roles` database tables with a 5‑minute in‑memory LRU cache.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`, `DB‑IDENTITY‑005`, `ERROR‑002`
**Blocks:** All Phase 3+ route tasks (CRM, Finance, Projects, Documents, etc.)
**Related Files:** `artifacts/api‑server/src/middlewares/rbac.ts`, `artifacts/api‑server/src/lib/permissions/permissions.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/rbac.ts` exports `requirePermission(context, resource, action)` factory returning an Express `RequestHandler`
- [ ] Middleware reads `req.user.userId` and `req.user.organizationId` from JWT payload set by AUTH‑008
- [ ] Queries `user_roles JOIN roles` for the user’s effective permissions scoped to their organisation
- [ ] Permission format: `{context}:{resource}:{action}` (e.g., `crm:leads:create`). Admin wildcard: `*:*:*`
- [ ] Returns `403 InsufficientPermissions` when user lacks the required permission
- [ ] Permissions cached per `(userId, organizationId)` with 5‑minute TTL using `lru‑cache`
- [ ] Unit tests cover: admin bypass, permission match, permission deny, cache hit, cache expiry, missing `req.user`
- [ ] Integration test verifies 403 on a mocked Express route
- [ ] `pnpm typecheck` passes with no errors

**Out of Scope**
- Dynamic permission CRUD via Settings API (future phase)
- Attribute‑Based Access Control (ABAC) or row‑level security
- Cross‑organisation permission leakage auditing
- Frontend permission UI

**Rules to Follow**
- No `throw` — pass errors via `next(err)`
- LRU cache size cap: 1000 entries maximum to bound memory use
- Log permission denials at `warn` level via Pino; never expose role names in HTTP error body
- All permission strings must live in `permissions.ts` as typed constants; no inline literals
- Follow Express 5 async middleware signature: `async (req, res, next) => void`

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/middlewares/rbac.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: RBAC enforces bounded‑context access rules at the infrastructure layer, preserving domain integrity without polluting domain services.
- TDD: Write all unit tests before implementing the middleware.
- BDD: “Given a user with `user` role, when they `POST /crm/leads`, then the API returns 403 InsufficientPermissions.”
- Deep Module: `requirePermission` exposes a 3‑argument factory hiding DB lookup, wildcard matching, LRU caching, and error formatting.

---

### Subtasks
- [ ] RBAC‑001.0.25 (AGENT): Read RBAC‑001, AUTH‑008, DB‑IDENTITY‑005, ERROR‑002. *No action — pause.*
- [ ] RBAC‑001.0.5 (AGENT): Research `lru‑cache` v10 API, Express 5 middleware typing, and RBAC permission string conventions. *Document findings briefly.*
- [ ] RBAC‑001.1 (AGENT): Define `PERMISSIONS` constants map and role‑to‑permissions matrix (`admin`, `manager`, `user`).
  **File(s):** `artifacts/api‑server/src/lib/permissions/permissions.ts`
  **Verification:** `pnpm typecheck`
- [ ] RBAC‑001.2 (AGENT): Implement `requirePermission` factory with DB lookup and 403 response; no caching yet.
  **File(s):** `artifacts/api‑server/src/middlewares/rbac.ts`
  **Verification:** `pnpm test -- rbac.test.ts -t "denies without permission"`
- [ ] RBAC‑001.3 (AGENT): Add LRU cache (TTL 5 min, max 1000 entries) for `(userId, orgId)` permission sets.
  **File(s):** `artifacts/api‑server/src/middlewares/rbac.ts`
  **Verification:** `pnpm test -- rbac.test.ts -t "cache hit"` and `"cache expiry"`
- [ ] RBAC‑001.4 (AGENT): Write unit tests — admin bypass, match, deny, cache hit/miss, wildcard, missing `req.user`.
  **File(s):** `artifacts/api‑server/__tests__/middlewares/rbac.test.ts`
  **Verification:** `pnpm test -- rbac.test.ts` all green
- [ ] RBAC‑001.5 (AGENT): Integration test — mocked Express route returns 403 when permission absent, 200 when present.
  **Verification:** All green; `pnpm typecheck` clean.
- [ ] RBAC‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
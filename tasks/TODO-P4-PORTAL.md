# TODO-P4-PORTAL.md – Phase 4 Client Portal Context



This file covers the Client Portal context: magic-link authentication, separate JWT handling, client management, permission enforcement, messaging, and session cleanup. Portal identity is fully separate from firm identity.

---

### [ ] PORTAL‑AUTH‑001: Portal Authentication (Magic Link + JWT)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No portal authentication exists. `portal_magic_links` table has no data. No `portalAuthMiddleware` or portal JWT handling. Portal routes are completely inaccessible.  
**Size:** Medium  

**Description:** Implement magic-link request and verification endpoints, portal-scoped JWT (separate `PORTAL_JWT_SECRET`), per-email rate limiting (3/15 min), and `portalAuthMiddleware` for all client-side portal routes.  

**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash`), EMAIL‑SERVICE‑001  
**Blocks:** API‑PORTAL‑001 (client-side routes require `portalAuthMiddleware`)  
**Related Files:** `artifacts/api-server/src/services/portal/portal-auth-service.ts`, `artifacts/api-server/src/middlewares/portal-auth.ts`, `artifacts/api-server/src/middlewares/portal-rate-limit.ts`, `artifacts/api-server/src/routes/portal/auth.ts`  

**Imports / Exports**
- Imports: `crypto` (randomBytes, createHash); `EmailService`; `jsonwebtoken`; `express-rate-limit` or custom rate limiter
- Exports: `PortalAuthService` (class), `portalAuthMiddleware` (middleware function), `portalRateLimitMiddleware` (middleware)

**Definition of Done**
- [ ] `POST /portal/auth/request-link` — accepts email, generates token, stores `magic_link_hash` with 15-min expiry, sends email; rate-limited to 3 requests per 15 min per email
- [ ] `POST /portal/auth/verify-link` — accepts raw token, hashes, compares, validates expiry, returns portal JWT `{ accessToken, client }`
- [ ] `POST /portal/auth/logout` — marks session `is_active = false`
- [ ] `portalAuthMiddleware`: reads `Authorization: Bearer <portal-jwt>`, verifies with `PORTAL_JWT_SECRET`, checks `is_active`, sets `req.portalClient`
- [ ] Integration tests: valid link → 200 + JWT; invalid token → 401 `InvalidMagicLink`; expired → 401 `PortalSessionExpired`; rate limit exceeded → 429 `TooManyRequests`
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- OAuth2 / social login for portal
- Multi-factor authentication
- Portal password-based auth

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, `PORTAL_JWT_SECRET`
- Magic link tokens must NEVER be stored in plaintext — store only `sha256(token)` hash
- Portal JWT must use a SEPARATE secret from the firm JWT

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/portal/portal-auth-service.ts`, `artifacts/api-server/src/middlewares/portal-auth.ts`, `artifacts/api-server/src/middlewares/portal-rate-limit.ts`, `artifacts/api-server/src/routes/portal/auth.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/portal/auth.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete portal auth files; no DB state changes
- Halt condition: if rate limit tests fail or token comparison uses non-constant-time comparison, stop and fix

**Rules to Follow**
- Use `crypto.timingSafeEqual()` for hash comparison — prevents timing attacks
- Magic link token must be `crypto.randomBytes(32).toString('hex')` — 96 bits of entropy minimum
- Rate limit key must be `sha256(email)` — never store raw email in rate limit store

**Verification**
```bash
pnpm --filter @workspace/api-server test -- auth.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(computedHash))` for constant-time comparison
- Per-email rate limit with sliding window: `Map<emailHash, { count, windowStart }>`
- Portal JWT payload: `{ sub: clientId, orgId, iat, exp }` with 24-hour expiry

**Anti-Patterns**
- Storing raw magic link token in DB — hash it first
- Using `==` for hash comparison — timing attack vulnerability
- Sharing JWT secret with firm auth — portal sessions must be independently revocable

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal identity is a separate bounded context from firm identity; it has its own JWT secret and session lifecycle
- TDD: Write tests for rate limiting and timing-safe comparison before implementing
- BDD: "As a portal client, I request a magic link, click it in my email, and am logged into the portal without a password"
- Deep Module: `PortalAuthService` hides token generation, hashing, email dispatch, JWT creation, and session management behind three methods

---

### Subtasks

- [ ] PORTAL‑AUTH‑001.0.25 (AGENT): Read this task, `DB‑PORTAL‑002` schema, `EMAIL‑SERVICE‑001` interface, and existing auth middleware patterns in full.  
  *No action — pause until fully understood.*

- [ ] PORTAL‑AUTH‑001.0.5 (AGENT): Research magic-link security best practices (May 2026): token entropy, hash storage, timing-safe comparison, rate limiting strategies.  
  *Document findings briefly or note "no changes."*

- [ ] PORTAL‑AUTH‑001.0.75 (AGENT): Reason about rate limit storage. Default: in-process `Map` with sliding window (sufficient for single-instance); note Redis requirement for multi-instance deployment.  
  *If uncertain, use in-process Map.*

- [ ] PORTAL‑AUTH‑001.1 (AGENT): Add portal auth endpoints to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen passes; generated types available.

- [ ] PORTAL‑AUTH‑001.2 (AGENT): Write integration tests for auth flow (TDD red).  
  **File(s):** `artifacts/api-server/src/__tests__/api/portal/auth.test.ts`  
  **Verification:** Tests compile and fail (no routes).

- [ ] PORTAL‑AUTH‑001.3 (AGENT): Implement `PortalAuthService` with hashing, email sending, and JWT creation.  
  **File(s):** `artifacts/api-server/src/services/portal/portal-auth-service.ts`  
  **Verification:** Unit tests pass; timing-safe comparison verified.

- [ ] PORTAL‑AUTH‑001.4 (AGENT): Implement per-email rate limiting middleware.  
  **File(s):** `artifacts/api-server/src/middlewares/portal-rate-limit.ts`  
  **Verification:** 4th request within 15 min → 429; after 15 min, limit resets.

- [ ] PORTAL‑AUTH‑001.5 (AGENT): Implement `portalAuthMiddleware`.  
  **File(s):** `artifacts/api-server/src/middlewares/portal-auth.ts`  
  **Verification:** Middleware unit test: valid JWT → `req.portalClient` set; invalid JWT → 401.

- [ ] PORTAL‑AUTH‑001.6 (AGENT): Create portal auth routes; run integration tests to green.  
  **File(s):** `artifacts/api-server/src/routes/portal/auth.ts`  
  **Verification:** All auth integration tests green.

- [ ] PORTAL‑AUTH‑001.7 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑PORTAL‑001: Portal – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No portal management or client-side endpoints exist in the OpenAPI spec. Firm and client portal routes are completely unspecced.  
**Size:** Small  

**Description:** Extend the OpenAPI spec with all firm-side and client-side portal paths (dual auth requirements), enabling codegen to produce typed hooks and Zod validators.  

**Depends on:** PORTAL‑AUTH‑001 (portal auth middleware defined), DB‑PORTAL‑001  
**Blocks:** API‑PORTAL‑002 (integration tests require spec)
**Related Files:** `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: [N/A — YAML spec file]
- Exports: `portal` tag and all paths in `lib/api-spec/openapi.yaml`

**Definition of Done**
- [ ] **Firm-side** endpoints (firm JWT auth): `GET /portal/clients`, `POST /portal/clients`, `PATCH /portal/clients/{clientId}`, `POST /portal/clients/{clientId}/permissions`, `GET /portal/clients/{clientId}/messages`, `POST /portal/clients/{clientId}/messages`
- [ ] **Client-side** endpoints (portal JWT auth): `GET /portal/me`, `GET /portal/me/projects`, `GET /portal/me/invoices`, `GET /portal/me/documents`, `GET /portal/me/messages`, `POST /portal/me/messages`
- [ ] Both auth types clearly annotated in spec with different security schemes
- [ ] Schemas: `PortalClient`, `PortalPermission`, `PortalMessage`, `PortalBranding` in `components/schemas`
- [ ] `pnpm --filter @workspace/api-spec run codegen` succeeds with no errors
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Portal admin dashboard metrics
- Portal file upload endpoints

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert portal paths from `openapi.yaml`; re-run codegen
- Halt condition: if `codegen` fails, stop and fix spec

**Rules to Follow**
- Two distinct security schemes must be documented: `firmJWT` (firm JWT) and `portalJWT` (portal JWT)
- Client-side endpoints must be annotated with `portalJWT` only — never `firmJWT`

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

**Advanced Code Patterns**
- Define `portalJWT` as a second `securityScheme` in `components/securitySchemes`
- Reuse `PaginationParams` and `MessageBody` components from existing spec

**Anti-Patterns**
- Single security scheme for both firm and portal auth — they must be independently annotated
- Inline schemas instead of `$ref` components

**DDD / TDD / BDD / Deep Module notes**
- DDD: Firm-side routes manage the portal; client-side routes ARE the portal
- TDD: Spec must be complete before API‑PORTAL‑002 tests can be written
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑PORTAL‑001.0.25 (AGENT): Read this task, `PORTAL‑AUTH‑001`, `DB‑PORTAL‑001` schema, and `lib/api-spec/openapi.yaml` structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑PORTAL‑001.0.5 (AGENT): Research OpenAPI 3.0 dual security scheme patterns (May 2026). Confirm how to annotate firm vs. portal JWT on the same spec.  
  *Document findings briefly or note "no changes."*

- [ ] API‑PORTAL‑001.0.75 (AGENT): Reason about whether firm-side and client-side routes should be under the same `portal` tag or separate tags. Default: single `portal` tag with role annotations.  
  *If uncertain, use single tag.*

- [ ] API‑PORTAL‑001.1 (AGENT): Add firm-side and client-side portal paths with dual security schemes to OpenAPI.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Spec validates; both auth types clearly marked.

- [ ] API‑PORTAL‑001.2 (AGENT): Run codegen and typecheck.  
  **File(s):** [N/A — generated files]  
  **Verification:** No type errors.

- [ ] API‑PORTAL‑001.3 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑PORTAL‑002: Portal – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No portal integration tests exist. `artifacts/api-server/src/__tests__/api/portal/` does not exist. All portal endpoint tests are blocked until API‑PORTAL‑001 spec is complete.  
**Size:** Small  

**Description:** Write failing integration tests for all firm-side and client-side portal endpoints, including permission enforcement and messaging (TDD red phase).  

**Depends on:** API‑PORTAL‑001, TEST‑INFRA‑001  
**Blocks:** API‑PORTAL‑003 (service must satisfy these tests)
**Related Files:** `artifacts/api-server/src/__tests__/api/portal/portal.test.ts`  

**Imports / Exports**
- Imports: `supertest`; `createTestServer()`, `generateTestToken()`, `generatePortalToken()` from test utilities
- Exports: [N/A — test file]

**Definition of Done**
- [ ] Firm-side tests: enable portal → 201; update branding → 200; grant permission → 201; firm sends message → 201
- [ ] Client-side tests: client fetches projects with `can_view` permission → 200 with data; client without permission → 403 or empty list; client sends message → 201
- [ ] Unauthorized (no portal JWT) → 401; expired portal JWT → 401
- [ ] Test suite compiles and runs with all tests red
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- End-to-end UI portal testing
- Performance testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/portal/portal.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete test file; no DB state changes
- Halt condition: if test file fails to compile, stop and fix TypeScript errors

**Rules to Follow**
- Use `generatePortalToken(clientId, orgId)` for client-side test requests
- Test both `can_view = true` and `can_view = false` permission scenarios
- Tests must be independent via `afterEach` teardown

**Verification**
```bash
pnpm --filter @workspace/api-server test -- portal.test.ts
# Expected: all tests red
pnpm run typecheck
```

**Advanced Code Patterns**
- Seed portal client, permissions, and sample resources in `beforeAll`
- Test permission enforcement with both positive and negative cases

**Anti-Patterns**
- Writing implementation before tests — violates TDD red phase
- Missing permission enforcement test coverage — security gap

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: This IS the red phase; all tests must fail before implementation begins
- BDD: "As a portal client, I can only see projects my firm has explicitly shared with me"
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑PORTAL‑002.0.25 (AGENT): Read this task, `API‑PORTAL‑001` spec, `PORTAL‑AUTH‑001`, and `TEST‑INFRA‑001` test harness in full.  
  *No action — pause until fully understood.*

- [ ] API‑PORTAL‑002.0.5 (AGENT): Research strategies for testing dual-auth APIs (firm JWT vs portal JWT) in Vitest + Supertest (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑PORTAL‑002.0.75 (AGENT): Reason about helper `generatePortalToken()`. Default: same structure as `generateTestToken()` but signs with `PORTAL_JWT_SECRET`.  
  *If uncertain, implement it that way.*

- [ ] API‑PORTAL‑002.1 (AGENT): Write all integration tests for portal endpoints (TDD red phase).  
  **File(s):** `artifacts/api-server/src/__tests__/api/portal/portal.test.ts`  
  **Verification:** Tests compile and fail (no routes).

- [ ] API‑PORTAL‑002.2 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑PORTAL‑003: Portal – Service & Repository (with permission enforcement)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No `PortalService` or `PortalRepository` exists. Permission enforcement for client-side data access is absent. `PortalClientEnabled` and `PortalMessageReceived` events are not defined.  
**Size:** Medium  

**Description:** Implement `PortalRepository` and `PortalService` with methods for enabling portal, managing permissions, and enforcing `portal_content_permissions` on all client-side queries. Emits `PortalClientEnabled` and `PortalMessageReceived` events.  

**Depends on:** DB‑MIGRATE‑ALL, PORTAL‑AUTH‑001, EMAIL‑SERVICE‑001  
**Blocks:** API‑PORTAL‑004 (routes require service)
**Related Files:** `lib/db/src/repositories/portal.ts`, `artifacts/api-server/src/services/portal/portal-service.ts`  

**Imports / Exports**
- Imports: `BaseRepository`; `drizzle-orm` (eq, and); `portal_clients`, `portal_content_permissions` schema types; event bus
- Exports: `PortalRepository` (class), `PortalService` (class), `PortalClientEnabled` (event), `PortalMessageReceived` (event)

**Definition of Done**
- [ ] `lib/db/src/repositories/portal.ts` exports `PortalRepository` with methods: `enablePortal`, `updateBranding`, `grantPermission`, `revokePermission`, `getPermissions`, `listMessages`, `sendMessage`
- [ ] `artifacts/api-server/src/services/portal/portal-service.ts` exports `PortalService` with corresponding methods
- [ ] Permission enforcement: all client-side queries (`getProjects`, `getInvoices`, `getDocuments`) filter by `portal_content_permissions`; no permission → returns `PortalAccessDenied` (403) or empty list depending on context
- [ ] `PortalClientEnabled` event emitted on `enablePortal`
- [ ] `PortalMessageReceived` event emitted on `sendMessage` (both firm and client side)
- [ ] All methods return `Result<T, DomainError>`
- [ ] Unit tests cover permission enforcement with and without `can_view` permission
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Portal file upload
- Real-time messaging (WebSocket)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Client-side queries MUST check `portal_content_permissions` — never return data without permission check

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/portal.ts`, `artifacts/api-server/src/services/portal/portal-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/portal/portal-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete service and repository files; no DB state changes
- Halt condition: if permission enforcement tests fail, stop and fix before proceeding

**Rules to Follow**
- Permission check is non-negotiable — every client-side query must include permission filter
- Use `Result<T, PortalAccessDenied>` for permission failures — not exceptions
- Emit events AFTER transaction commits, never inside

**Verification**
```bash
pnpm --filter @workspace/api-server test -- portal-service
pnpm run typecheck
```

**Advanced Code Patterns**
- Permission filter as a reusable Drizzle condition: `eq(portalPermissions.resourceType, 'project')` `AND` `eq(portalPermissions.clientId, clientId)`
- Result pattern for access denied: `Result.err(new PortalAccessDenied(resourceType, clientId))`

**Anti-Patterns**
- Client-side queries without permission check — data leakage
- Throwing exceptions for access denied — use Result pattern
- Hard-coding resource type strings — use enum/const

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal client permissions are an aggregate in the Portal bounded context; `PortalService` enforces the permission invariant
- TDD: Write unit tests for `can_view = false` scenario before implementing permission filter
- BDD: "A portal client can only see projects the firm has explicitly shared with them"
- Deep Module: `PortalService` hides permission lookup, data filtering, event emission, and branding management

---

### Subtasks

- [ ] API‑PORTAL‑003.0.25 (AGENT): Read this task, `DB‑PORTAL‑001/002` schemas, `portal.test.ts` integration tests, and `PORTAL‑AUTH‑001` middleware in full.  
  *No action — pause until fully understood.*

- [ ] API‑PORTAL‑003.0.5 (AGENT): Research Drizzle ORM JOIN patterns for permission checking (May 2026). Confirm whether to JOIN `portal_content_permissions` inline or use a separate `checkPermission()` helper.  
  *Document findings briefly or note "no changes."*

- [ ] API‑PORTAL‑003.0.75 (AGENT): Reason about permission enforcement: return 403 or empty list for missing permissions? Default: 403 for explicit resource requests; empty list for collection queries.  
  *If uncertain, use that convention.*

- [ ] API‑PORTAL‑003.1 (AGENT): Implement `PortalRepository`.  
  **File(s):** `lib/db/src/repositories/portal.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] API‑PORTAL‑003.2 (AGENT): Implement `PortalService` with permission enforcement and events.  
  **File(s):** `artifacts/api-server/src/services/portal/portal-service.ts`  
  **Verification:** Unit tests with mocked repo pass; permission enforcement verified.

- [ ] API‑PORTAL‑003.3 (AGENT): Write unit tests for all service methods (with and without permissions).  
  **File(s):** `artifacts/api-server/src/__tests__/services/portal/portal-service.test.ts`  
  **Verification:** All tests green.

- [ ] API‑PORTAL‑003.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑PORTAL‑004: Portal – Routes & Green Tests
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No portal routes exist. Integration tests from API‑PORTAL‑002 are all failing (red). `artifacts/api-server/src/routes/portal/` does not exist.  
**Size:** Small  

**Description:** Wire firm-side and client-side portal routes with appropriate auth middleware and Zod validation, turning the API‑PORTAL‑002 integration tests from red to green.  

**Depends on:** API‑PORTAL‑003 (service), PORTAL‑AUTH‑001 (`portalAuthMiddleware`, `firmAuthMiddleware`)  
**Blocks:** PORTAL‑EVENTS‑001, PORTAL‑CLEANUP‑001
**Related Files:** `artifacts/api-server/src/routes/portal/clients.ts`, `artifacts/api-server/src/routes/portal/me.ts`, `artifacts/api-server/src/routes/index.ts`  

**Imports / Exports**
- Imports: `express` (Router); `PortalService`; `firmAuthMiddleware`, `portalAuthMiddleware`; generated Zod schemas
- Exports: `portalClientsRouter` (Express Router), `portalMeRouter` (Express Router)

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/portal/clients.ts` exports `portalClientsRouter` with all 6 firm-side endpoints, protected by `firmAuthMiddleware`
- [ ] `artifacts/api-server/src/routes/portal/me.ts` exports `portalMeRouter` with all 6 client-side endpoints, protected by `portalAuthMiddleware`
- [ ] Both routers mounted in `routes/index.ts` under `/portal`
- [ ] Request validation uses generated Zod schemas
- [ ] All integration tests from API‑PORTAL‑002 pass (green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Portal file upload routes
- WebSocket real-time messaging

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Client-side routes must NEVER use `firmAuthMiddleware` — only `portalAuthMiddleware`

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/portal/clients.ts`, `artifacts/api-server/src/routes/portal/me.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A — existing tests must turn green]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/routes/portal/`; revert `routes/index.ts` mount
- Halt condition: if integration tests do not turn green, stop and debug service integration

**Rules to Follow**
- Strict middleware separation: firm-side routes use `firmAuthMiddleware`, client-side use `portalAuthMiddleware`
- Use generated Zod schemas only; do not write custom validation
- Use `asyncHandler` for all routes

**Verification**
```bash
pnpm --filter @workspace/api-server test -- portal.test.ts
# Expected: all tests green
pnpm run typecheck
```

**Advanced Code Patterns**
- Two separate route files (`clients.ts`, `me.ts`) to make auth middleware assignment explicit and auditable

**Anti-Patterns**
- Mixing firm and portal auth middleware in the same route file — confusion and security risk
- Business logic in route handlers — belongs in `PortalService`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are the thin API layer of the Portal bounded context
- TDD: This is the green phase; routes must make API‑PORTAL‑002 tests pass
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑PORTAL‑004.0.25 (AGENT): Read this task, `portal.test.ts`, `PortalService` implementation, and `routes/index.ts` in full.  
  *No action — pause until fully understood.*

- [ ] API‑PORTAL‑004.0.5 (AGENT): Confirm `asyncHandler` pattern and middleware mounting approach used in other route files (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑PORTAL‑004.0.75 (AGENT): Verify that `portalAuthMiddleware` sets `req.portalClient` correctly before delegating to `PortalService`.  
  *If uncertain, trace through the middleware chain.*

- [ ] API‑PORTAL‑004.1 (AGENT): Create firm-side portal routes.  
  **File(s):** `artifacts/api-server/src/routes/portal/clients.ts`  
  **Verification:** Compiles; `pnpm run typecheck` clean.

- [ ] API‑PORTAL‑004.2 (AGENT): Create client-side portal routes.  
  **File(s):** `artifacts/api-server/src/routes/portal/me.ts`  
  **Verification:** Compiles; `pnpm run typecheck` clean.

- [ ] API‑PORTAL‑004.3 (AGENT): Mount both routers in main router.  
  **File(s):** `artifacts/api-server/src/routes/index.ts`  
  **Verification:** `pnpm run typecheck` clean.

- [ ] API‑PORTAL‑004.4 (AGENT): Run integration tests to green.  
  **File(s):** [N/A — run existing tests]  
  **Verification:** `pnpm --filter @workspace/api-server test -- portal.test.ts` → all green.

- [ ] API‑PORTAL‑004.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] PORTAL‑EVENTS‑001: Portal Domain Events Verification
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** `PortalClientEnabled` and `PortalMessageReceived` events are defined but not verified in audit logs. Audit log integration is unconfirmed.  
**Size:** Small  

**Description:** Verify that `PortalClientEnabled` and `PortalMessageReceived` domain events are emitted by `PortalService` and recorded in the audit log (`DB‑SETTINGS‑002`), via integration tests.  

**Depends on:** API‑PORTAL‑003 (events emitted), DB‑SETTINGS‑002 (audit logs table)  
**Blocks:** [N/A — verification task]
**Related Files:** `artifacts/api-server/src/__tests__/api/portal/portal-events.test.ts`  

**Imports / Exports**
- Imports: `supertest`; test utilities; `AuditRepository`
- Exports: [N/A — test file]

**Definition of Done**
- [ ] Integration test: enable portal → `PortalClientEnabled` event appears in `audit_logs` table
- [ ] Integration test: firm sends message → `PortalMessageReceived` event appears in `audit_logs` table
- [ ] Integration test: client sends message → `PortalMessageReceived` event appears in `audit_logs` table
- [ ] All 3 tests pass (green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Event streaming or webhooks
- Non-portal domain events

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/portal/portal-events.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete test file; no DB state changes
- Halt condition: if events are not appearing in audit_logs, stop and debug event emission in `PortalService`

**Rules to Follow**
- Query `audit_logs` table directly via `AuditRepository` to verify event presence
- Tests must be independent via `afterEach` teardown

**Verification**
```bash
pnpm --filter @workspace/api-server test -- portal-events.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Use direct DB query to `audit_logs` to verify event: `SELECT * FROM audit_logs WHERE action = 'PortalClientEnabled' AND context_id = $portalClientId`

**Anti-Patterns**
- Verifying events via mock calls only — must verify they appear in the real audit log

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain events are the audit record of state changes in the Portal bounded context
- TDD: [N/A — verification test; routes and service already green]
- BDD: "When a firm enables portal access, the event is recorded in the audit log for compliance"
- Deep Module: [N/A]

---

### Subtasks

- [ ] PORTAL‑EVENTS‑001.0.25 (AGENT): Read this task, `API‑PORTAL‑003` event definitions, `DB‑SETTINGS‑002` audit schema, and `AuditRepository` in full.  
  *No action — pause until fully understood.*

- [ ] PORTAL‑EVENTS‑001.0.5 (AGENT): Confirm audit log table name and column structure in `DB‑SETTINGS‑002`.  
  *Document findings briefly.*

- [ ] PORTAL‑EVENTS‑001.0.75 (AGENT): Reason about query needed to verify events in audit_logs. Default: `WHERE action IN ('PortalClientEnabled', 'PortalMessageReceived') AND organization_id = $orgId`.  
  *If uncertain, use that query.*

- [ ] PORTAL‑EVENTS‑001.1 (AGENT): Write integration tests verifying all 3 portal events appear in audit logs.  
  **File(s):** `artifacts/api-server/src/__tests__/api/portal/portal-events.test.ts`  
  **Verification:** All 3 tests green.

- [ ] PORTAL‑EVENTS‑001.2 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] PORTAL‑CLEANUP‑001: Portal Session Cleanup
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Expired `magic_link_hash` rows accumulate in `portal_magic_links` indefinitely. No background cleanup job exists. Long-term data hygiene and storage efficiency are at risk.  
**Size:** Small  

**Description:** Implement a `node-cron` scheduled job (every 6 hours) that purges expired `magic_link_hash` rows from `portal_magic_links` where `expires_at < NOW() - PORTAL_CLEANUP_HOURS`, with per-run logging and idempotent cleanup.  

**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash` with expiry field)  
**Blocks:** Long-term portal data hygiene
**Related Files:** `artifacts/api-server/src/services/portal/session-cleanup.ts`, `artifacts/api-server/src/jobs/portal-cleanup.ts`  

**Imports / Exports**
- Imports: `node-cron`; `PortalRepository`; Pino logger; `PORTAL_CLEANUP_HOURS` env var
- Exports: `startPortalCleanupJob()` (function), `PortalSessionCleanupService` (class)

**Definition of Done**
- [ ] `artifacts/api-server/src/services/portal/session-cleanup.ts` exports `PortalSessionCleanupService` with `cleanup()` method: deletes rows where `expires_at < NOW() - interval '? hours'`
- [ ] `artifacts/api-server/src/jobs/portal-cleanup.ts` exports `startPortalCleanupJob()` using `node-cron` (runs every 6 hours)
- [ ] Configurable via `PORTAL_CLEANUP_HOURS` env var (default: 24)
- [ ] Each run logs `{ cleaned_count, run_at }` via Pino logger
- [ ] Cleanup continues even if individual row deletions fail (error-tolerant)
- [ ] Unit tests for cleanup logic with expired and non-expired link fixtures
- [ ] Integration test with real DB: insert expired links → run cleanup → verify rows deleted; non-expired rows remain
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Cleaning up portal session JWTs (stateless; expire naturally)
- Alerting on cleanup failures

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Cleanup must ONLY delete rows where `expires_at < NOW() - cleanup_window` — never delete active links

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/portal/session-cleanup.ts`, `artifacts/api-server/src/jobs/portal-cleanup.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/portal/session-cleanup.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete cleanup service and job files; no DB state changes
- Halt condition: if cleanup accidentally deletes non-expired links in tests, stop and fix the WHERE clause

**Rules to Follow**
- WHERE clause must use parameterized query: `expires_at < NOW() - $1::interval` — never string interpolation
- Job must use `node-cron` with async handler inside error boundary (log errors, do not crash the process)
- Log cleanup count using structured Pino logging: `logger.info({ cleaned_count, run_at }, 'portal session cleanup complete')`

**Verification**
```bash
pnpm --filter @workspace/api-server test -- session-cleanup.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `cron.schedule('0 */6 * * *', async () => { try { const n = await svc.cleanup(); logger.info({ cleaned_count: n }); } catch (e) { logger.error(e); } })`
- Parameterized cleanup: `DELETE FROM portal_magic_links WHERE expires_at < NOW() - $1::interval RETURNING id` — returns count of deleted rows

**Anti-Patterns**
- String-interpolated cleanup window — SQL injection risk
- Crashing the cron job on error — should log and continue
- No logging of cleaned count — impossible to monitor cleanup health

**DDD / TDD / BDD / Deep Module notes**
- DDD: Session cleanup is a maintenance task at the application service layer; it has no domain logic
- TDD: Write unit test for the WHERE clause logic before implementing the service
- BDD: "Expired magic links are purged every 6 hours, keeping the database clean and secure"
- Deep Module: `PortalSessionCleanupService.cleanup()` hides parameterized query, row count return, and error handling behind one method

---

### Subtasks

- [ ] PORTAL‑CLEANUP‑001.0.25 (AGENT): Read this task, `DB‑PORTAL‑002` schema (`portal_magic_links` table structure), and existing cron job patterns in the codebase in full.  
  *No action — pause until fully understood.*

- [ ] PORTAL‑CLEANUP‑001.0.5 (AGENT): Research `node-cron` v3 ESM-compatible API (May 2026). Confirm cron expression for every-6-hours schedule.  
  *Document findings briefly or note "no changes."*

- [ ] PORTAL‑CLEANUP‑001.0.75 (AGENT): Reason about `PORTAL_CLEANUP_HOURS` default. Default: 24 hours (cleanup links expired > 24 hours ago). Confirm `node-cron` is already a dependency.  
  *If not installed, note it as a dependency to add (with user approval).*

- [ ] PORTAL‑CLEANUP‑001.1 (AGENT): Implement `PortalSessionCleanupService.cleanup()` with parameterized DELETE query.  
  **File(s):** `artifacts/api-server/src/services/portal/session-cleanup.ts`  
  **Verification:** Unit tests with mocked DB pass; non-expired rows untouched.

- [ ] PORTAL‑CLEANUP‑001.2 (AGENT): Implement `startPortalCleanupJob()` with `node-cron` schedule and error boundary.  
  **File(s):** `artifacts/api-server/src/jobs/portal-cleanup.ts`  
  **Verification:** Job compiles; `pnpm run typecheck` clean.

- [ ] PORTAL‑CLEANUP‑001.3 (AGENT): Write unit and integration tests for cleanup service.  
  **File(s):** `artifacts/api-server/src/__tests__/services/portal/session-cleanup.test.ts`  
  **Verification:** All tests green; integration test confirms expired rows deleted, non-expired rows remain.

- [ ] PORTAL‑CLEANUP‑001.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
PORTAL‑AUTH‑001 (magic link + JWT + middleware)
  └─> API‑PORTAL‑001 (OpenAPI spec + codegen)
        └─> API‑PORTAL‑002 (integration tests, TDD red)
              └─> API‑PORTAL‑003 (service & repository)
                    └─> API‑PORTAL‑004 (routes + green tests)
                          ├─> PORTAL‑EVENTS‑001 (domain event verification)
                          └─> PORTAL‑CLEANUP‑001 (session cleanup job)
```

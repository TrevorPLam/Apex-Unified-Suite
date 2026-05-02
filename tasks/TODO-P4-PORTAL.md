# TODO-P4-PORTAL.md – Phase 4 Client Portal Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Client Portal Context with magic‑link authentication, separate JWT handling, client management, permission enforcement, messaging, and session cleanup. Portal identity is separate from firm identity, with its own JWT secret and session lifecycle.

---

## Client Portal Context

### [ ] PORTAL‑AUTH‑001: Portal Authentication (Magic Link + JWT)
**Status:** ⏳ Not Started  
**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash`), EMAIL‑SERVICE‑001.  
**Blocks:** API‑PORTAL‑001 (client‑side routes).  
**Definition of Done:**  
- `POST /api/v1/portal/auth/request‑link` – accepts email, generates random token, stores `magic_link_hash` with expiry, sends email via `EmailServicePort`. Returns success (no token). **Per‑email rate limiting: 3 requests per 15 minutes per email address.**  
- `POST /api/v1/portal/auth/verify‑link` – accepts raw token, hashes it, compares with stored hash, validates expiry, generates portal JWT (separate secret `PORTAL_JWT_SECRET`), marks session active. Returns `{ accessToken, client }`.  
- `POST /api/v1/portal/auth/logout` – invalidates session.  
- `portalAuthMiddleware` implemented: reads `Authorization: Bearer <portal‑jwt>`, verifies with portal secret, checks `is_active` and expiry, sets `req.portalClient`.  
- Integration tests: request link, verify link with valid token → 200 + JWT; verify with invalid token → 401 `InvalidMagicLink`; expired token → 401 `PortalSessionExpired`; **rate limit exceeded → 429 `TooManyRequests`**.  
**DDD:** Portal identity is separate from firm identity, with its own JWT secret and session lifecycle.

### Subtasks:
- [ ] PORTAL‑AUTH‑001.1: Add portal auth endpoints to OpenAPI spec. (AGENT)  
  **verification:** Codegen passes.
- [ ] PORTAL‑AUTH‑001.2: Write integration tests (Red). (AGENT)  
  **verification:** Tests fail.
- [ ] PORTAL‑AUTH‑001.3: Implement `PortalAuthService` with hashing and email sending. (AGENT)  
  **verification:** Unit tests.
- [ ] PORTAL‑AUTH‑001.4: Implement per‑email rate limiting on magic link requests. (AGENT) – `middlewares/portal‑rate‑limit.ts`  
  **verification:** Unit test shows 4th request within 15 minutes returns 429; requests after 15 minutes reset limit.
- [ ] PORTAL‑AUTH‑001.5: Implement `portalAuthMiddleware`. (AGENT) – `middlewares/portal‑auth.ts`  
  **verification:** Middleware unit test.
- [ ] PORTAL‑AUTH‑001.6: Run integration tests to green. (AGENT)  
  **verification:** Full flow passes including rate limit test.

---

### [ ] API‑PORTAL‑001: Portal – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** PORTAL‑AUTH‑001, DB‑PORTAL‑001.  
**Definition of Done:** Two sets of routes with `/api/v1/` prefix:

**Firm‑side** (auth: firm JWT):  
- `GET /api/v1/portal/clients` – list portal clients  
- `POST /api/v1/portal/clients` – enable portal for a company  
- `PATCH /api/v1/portal/clients/{clientId}` – update branding config  
- `POST /api/v1/portal/clients/{clientId}/permissions` – grant resource access  
- `GET /api/v1/portal/clients/{clientId}/messages` – firm reads messages  
- `POST /api/v1/portal/clients/{clientId}/messages` – firm sends message  

**Client‑side** (auth: portal JWT, via `portalAuthMiddleware`):  
- `GET /api/v1/portal/me` – profile  
- `GET /api/v1/portal/me/projects` – accessible projects  
- `GET /api/v1/portal/me/invoices` – accessible invoices  
- `GET /api/v1/portal/me/documents` – accessible documents  
- `GET /api/v1/portal/me/messages` – messages  
- `POST /api/v1/portal/me/messages` – client sends message  

All schemas, pagination, examples.

### Subtasks:
- [ ] API‑PORTAL‑001.1: Add firm‑side and client‑side portal paths to OpenAPI. (AGENT)  
  **verification:** Codegen passes; all endpoints typed.
- [ ] API‑PORTAL‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No errors.

---

### [ ] API‑PORTAL‑002: Portal – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑PORTAL‑001, TEST‑INFRA‑001.  
**Tests include:** firm enables portal → 201; client requests link and logs in; client fetches projects (only those with `can_view` permission); client without permission receives 403 or empty list; firm can grant permissions; firm sends message → 201; client replies → 201.

---

### [ ] API‑PORTAL‑003: Portal – Service & Repository (with permission enforcement)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, PORTAL‑AUTH‑001, EMAIL‑SERVICE‑001.  
**Definition of Done:**  
- `PortalService`: methods for enabling portal, updating branding, managing permissions.  
- **Permission enforcement**: all client‑side data queries (projects, invoices, documents, messages) must filter by `portal_content_permissions`. If no permission, return `PortalAccessDenied` (403) or empty list.  
- Emits `PortalClientEnabled`, `PortalMessageReceived` events.  
- Either returns.  
**Depth refactor check.**

### Subtasks:
- [ ] API‑PORTAL‑003.1: Implement `PortalService` with permission enforcement. (AGENT)  
  **verification:** Unit tests with mocked repo pass, permission checks verified.
- [ ] API‑PORTAL‑003.2: Write unit tests for all methods (with and without permissions). (AGENT)  
  **verification:** Green.

---

### [ ] API‑PORTAL‑004: Portal – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑PORTAL‑003.  
**Subtasks:** wires firm and client routes with appropriate auth middleware; integration tests go green.

---

### [ ] PORTAL‑EVENTS‑001: Portal Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** API‑PORTAL‑003, DB‑SETTINGS‑002.  
**Definition of Done:** Events `PortalClientEnabled`, `PortalMessageReceived` are emitted and recorded in audit logs.  
**Subtasks:** verify events appear in audit logs via integration tests.

---

### [ ] PORTAL‑CLEANUP‑001: Portal Session Cleanup
**Status:** ⏳ Not Started  
**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash` with expiry).  
**Blocks:** Long‑term portal data hygiene.  
**Definition of Done:**  
- Background job or scheduled task to purge expired `magic_link_hash` rows from `portal_magic_links` table.  
- Configurable cleanup window (default: delete links expired > 24 hours).  
- Safe cleanup: only deletes rows where `expires_at` < NOW() - cleanup_window.  
- Logging: records count of cleaned rows per run for monitoring.  
- Error handling: continues cleanup even if individual deletions fail.  
- Environment variable: `PORTAL_CLEANUP_HOURS` (default: 24).  
- Unit tests for cleanup logic with expired and non‑expired links.  
- Integration test with real database cleanup.

**Implementation Decision:** Use scheduled job with node-cron (runs every 6 hours).

### Subtasks:
- [ ] PORTAL‑CLEANUP‑001.1: Create cleanup service using node-cron scheduler. (AGENT) – `services/portal/session-cleanup.ts`  
  **verification:** Service logic unit tests pass.
- [ ] PORTAL‑CLEANUP‑001.2: Implement scheduled job with node-cron (runs every 6 hours). (AGENT)  
  **verification:** Cleanup runs successfully via cron schedule.
- [ ] PORTAL‑CLEANUP‑001.3: Add cleanup configuration and logging. (AGENT)  
  **verification:** Configurable cleanup window works.
- [ ] PORTAL‑CLEANUP‑001.4: Write unit and integration tests. (AGENT)  
  **verification:** All tests pass.
- [ ] PORTAL‑CLEANUP‑001.5: Document cleanup process and add to deployment checklist. (AGENT)  
  **verification:** Documentation complete.

---

## Progress Tracking

### Overall Status
**Client Portal Context:** [ ] 0/6 parent tasks complete

### Context Breakdown
- **Portal Authentication:** [ ] 0/1 complete (magic link + JWT)
- **Portal Management:** [ ] 0/4 complete (API spec, tests, service, routes)
- **Portal Events:** [ ] 0/1 complete (domain events verification)
- **Portal Maintenance:** [ ] 0/1 complete (session cleanup)

### Dependencies
- **EMAIL-SERVICE-001** enables magic link email sending
- **DB-PORTAL-001/002** enable portal client and session storage
- **PORTAL-AUTH-001** enables all portal functionality
- **DB-SETTINGS-002** enables audit logging for portal events

### Next Actions
- [ ] Start PORTAL-AUTH-001.1: Add portal auth endpoints to OpenAPI
- [ ] Start API-PORTAL-001.1: Add portal management paths to OpenAPI
- [ ] Start PORTAL-CLEANUP-001.1: Create session cleanup service

### Verification Commands
```bash
# Portal Authentication verification
pnpm test -- portal-auth
pnpm typecheck

# Portal API verification
pnpm test -- portal
pnpm typecheck

# Portal Cleanup verification
pnpm test -- portal-cleanup
pnpm typecheck
```

---

## File Index

### Portal Authentication
- `artifacts/api-server/src/services/portal/portal-auth-service.ts` - Magic link auth service
- `artifacts/api-server/src/middlewares/portal-rate-limit.ts` - Rate limiting middleware
- `artifacts/api-server/src/middlewares/portal-auth.ts` - Portal JWT middleware
- `routes/portal/auth.ts` - Portal auth routes
- `artifacts/api-server/__tests__/api/portal/auth.test.ts` - Auth integration tests

### Portal Management
- `artifacts/api-server/src/services/portal/portal-service.ts` - Portal management service
- `lib/db/src/repositories/portal.ts` - Portal repository
- `routes/portal/clients.ts` - Firm-side portal routes
- `routes/portal/me.ts` - Client-side portal routes
- `artifacts/api-server/__tests__/api/portal/portal.test.ts` - Portal integration tests

### Portal Maintenance
- `artifacts/api-server/src/services/portal/session-cleanup.ts` - Session cleanup service
- `artifacts/api-server/__tests__/services/portal/session-cleanup.test.ts` - Cleanup tests

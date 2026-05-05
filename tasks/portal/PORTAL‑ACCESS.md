# tasks/portal/PORTAL‑ACCESS.md – Client Portal: Access & Communication

This file covers the Client Portal bounded context: database schemas for portal clients, content permissions, magic links, messages, and branding; the firm‑side portal management interface; the client‑side portal experience (magic‑link authentication, resource viewing, messaging); and all interactive mutation wiring. Portal identity is fully separate from firm identity.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Backlog Additions – 2026‑05‑05

| Task ID | Description | Depends On |
|---------|-------------|------------|
| DB‑PORTAL‑006 | Portal client tasks junction table | `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001` |
| API‑PORTAL‑005 | Client task endpoints for portal users | `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑006` |
| FRONT‑PORTAL‑002 | Client task view with status badges and actions | `portal/PORTAL‑ACCESS.md → API‑PORTAL‑005` |

### Subtasks
- [ ] DB‑PORTAL‑006.1 (AGENT): Define task linkage, notes, assignment, and status tracking columns.
- [ ] API‑PORTAL‑005.1 (AGENT): Add client task endpoints and authorization checks.
- [ ] FRONT‑PORTAL‑002.1 (AGENT): Build the client-facing task list and action controls.

---

## Database Schemas

### [ ] DB‑PORTAL‑001: Define Portal Clients Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No portal clients table. Client portal access is blocked.
**Size:** Small

**Description:** Define the `portal_clients` table – links a CRM contact to a portal account, with enabled/disabled status and last‑login tracking. This is the anchor entity for portal access.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002`
**Blocks:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑002`, `DB‑PORTAL‑003`, `DB‑PORTAL‑004`, `API‑PORTAL‑001`
**Related Files:** `lib/db/src/schema/portal/portal_clients.ts`, `lib/db/src/__tests__/portal‑clients.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `contact_id` (uuid NOT NULL FK → contacts), `is_enabled` (boolean NOT NULL default `true`), `last_login_at` (timestamp nullable), `login_count` (integer NOT NULL default `0`), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, contact_id)` – one portal account per contact per org
- [ ] Index on `(organization_id, is_enabled)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- portal‑clients.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal Client is a configuration aggregate in the Portal bounded context. It links a CRM contact to portal access.
- TDD: Assert unique constraint, default values.
- BDD: Enables “Enable portal access for a client contact” scenarios.

---

### Subtasks
- [ ] DB‑PORTAL‑001.0.25 (AGENT): Read DB‑ORG‑001 and DB‑CRM‑002. No action – pause.
- [ ] DB‑PORTAL‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/portal‑clients.test.ts` **Verification:** RED.
- [ ] DB‑PORTAL‑001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PORTAL‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PORTAL‑002: Define Portal Content Permissions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No permissions table. Clients would have unrestricted access.
**Size:** Small

**Description:** Define the `portal_content_permissions` table – grants a portal client access to specific resource types (projects, invoices, documents, appointments, payments).

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑003`
**Related Files:** `lib/db/src/schema/portal/portal_permissions.ts`, `lib/db/src/__tests__/portal‑permissions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `portal_client_id` (FK → portal_clients), `resource_type` (pgEnum: `project|invoice|document|appointment|payment`), `can_view` (boolean NOT NULL default `true`), `can_create` (boolean NOT NULL default `false`), `granted_at` (timestamp `defaultNow()`), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(portal_client_id, resource_type)`
- [ ] Zod schemas; resource type validated as enum
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- portal‑permissions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PORTAL‑002.0.25 (AGENT): Read DB‑PORTAL‑001. No action – pause.
- [ ] DB‑PORTAL‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/portal‑permissions.test.ts` **Verification:** RED.
- [ ] DB‑PORTAL‑002.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PORTAL‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PORTAL‑003: Define Portal Magic Links Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No magic link table. Passwordless portal authentication is blocked.
**Size:** Small

**Description:** Define the `portal_magic_links` table – stores a SHA‑256 hash of the one‑time token sent to the client’s email, with an expiry timestamp.

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → PORTAL‑AUTH‑001`
**Related Files:** `lib/db/src/schema/portal/portal_magic_links.ts`, `lib/db/src/__tests__/portal‑magic‑links.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `portal_client_id` (FK → portal_clients), `token_hash` (text NOT NULL UNIQUE – SHA‑256), `expires_at` (timestamp NOT NULL), `is_used` (boolean NOT NULL default `false`), `created_at`
- [ ] Indexes: `(token_hash)`, `(portal_client_id, is_used, expires_at)`
- [ ] Zod schemas; `token_hash` omitted from select schema (security)
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- portal‑magic‑links.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PORTAL‑003.0.25 (AGENT): Read DB‑PORTAL‑001. No action – pause.
- [ ] DB‑PORTAL‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/portal‑magic‑links.test.ts` **Verification:** RED.
- [ ] DB‑PORTAL‑003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PORTAL‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PORTAL‑004: Define Portal Messages Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No messages table. Firm‑client communication is blocked.
**Size:** Small

**Description:** Define the `portal_messages` table – a thread‑based messaging system between firm users and portal clients.

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑003`, `API‑PORTAL‑001`
**Related Files:** `lib/db/src/schema/portal/portal_messages.ts`, `lib/db/src/__tests__/portal‑messages.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `portal_client_id` (FK → portal_clients), `sender_type` (pgEnum: `firm|client`), `sender_id` (uuid NOT NULL), `body` (text NOT NULL), `parent_message_id` (uuid nullable FK self‑reference), `is_read` (boolean NOT NULL default `false`), `created_at`
- [ ] Indexes: `(portal_client_id, created_at)`, `(organization_id, is_read)`
- [ ] Zod schemas; `sender_type` validated as enum
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- portal‑messages.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PORTAL‑004.0.25 (AGENT): Read DB‑PORTAL‑001. No action – pause.
- [ ] DB‑PORTAL‑004.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/portal‑messages.test.ts` **Verification:** RED.
- [ ] DB‑PORTAL‑004.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PORTAL‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑PORTAL‑005: Define Portal Branding Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No branding table. Client portal shows default styling.
**Size:** Small

**Description:** Define the `portal_branding` table – stores per‑organisation customisation for the client‑facing portal (logo URL, primary colour, welcome text).

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑001`
**Related Files:** `lib/db/src/schema/portal/portal_branding.ts`, `lib/db/src/__tests__/portal‑branding.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK UNIQUE), `logo_url` (text nullable), `primary_color` (text nullable default `'#005BB5'`), `secondary_color` (text nullable), `welcome_heading` (text nullable), `welcome_message` (text nullable), `created_at`, `updated_at`
- [ ] Zod schemas; `primary_color` validated as hex colour
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- portal‑branding.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑PORTAL‑005.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑PORTAL‑005.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/portal‑branding.test.ts` **Verification:** RED.
- [ ] DB‑PORTAL‑005.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑PORTAL‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Portal Authentication

### [ ] PORTAL‑AUTH‑001: Portal Authentication (Magic Link + JWT)
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No portal authentication exists. Portal routes are completely inaccessible.
**Size:** Medium

**Description:** Implement magic‑link request and verification endpoints, portal‑scoped JWT (separate `PORTAL_JWT_SECRET`), per‑email rate limiting (3/15 min), and `portalAuthMiddleware` for all client‑side portal routes.

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑003`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑001`
**Related Files:** `artifacts/api‑server/src/services/portal/portal‑auth‑service.ts`, `artifacts/api‑server/src/middlewares/portal‑auth.ts`, `artifacts/api‑server/src/middlewares/portal‑rate‑limit.ts`, `artifacts/api‑server/src/routes/portal/auth.ts`

**Definition of Done**
- [ ] `POST /portal/auth/request‑link` – accepts email, generates token, stores hash with 15‑min expiry, sends email; rate‑limited (3/15 min per email)
- [ ] `POST /portal/auth/verify‑link` – accepts raw token, hashes, compares, validates expiry, returns portal JWT `{ accessToken, client }`
- [ ] `POST /portal/auth/logout` – marks session inactive
- [ ] `portalAuthMiddleware`: reads `Authorization: Bearer <portal‑jwt>`, verifies with `PORTAL_JWT_SECRET`, checks `is_active`, sets `req.portalClient`
- [ ] Integration tests: valid link → 200 + JWT; invalid token → 401; expired → 401; rate limit → 429
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- OAuth2 / social login for portal
- Multi‑factor authentication
- Portal password‑based auth

**Rules to Follow**
- Use `crypto.timingSafeEqual()` for hash comparison
- Magic link token must be `crypto.randomBytes(32).toString('hex')`
- Rate limit key must be `sha256(email)` – never store raw email

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal‑auth.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal identity is a separate bounded context from firm identity; it has its own JWT secret and session lifecycle.
- TDD: Write tests for rate limiting and timing‑safe comparison before implementing.
- BDD: “As a portal client, I request a magic link, click it in my email, and am logged into the portal without a password.”
- Deep Module: `PortalAuthService` hides token generation, hashing, email dispatch, JWT creation, and session management behind three methods.

---

### Subtasks
- [ ] PORTAL‑AUTH‑001.0.25 (AGENT): Read DB‑PORTAL‑003, EMAIL‑SERVICE‑001, and existing auth middleware patterns. *No action – pause.*
- [ ] PORTAL‑AUTH‑001.0.5 (AGENT): Research magic‑link security best practices (token entropy, hash storage, timing‑safe comparison, rate limiting). *Document findings briefly.*
- [ ] PORTAL‑AUTH‑001.1 (AGENT): Add portal auth endpoints to OpenAPI spec; run codegen. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] PORTAL‑AUTH‑001.2 (AGENT): Write integration tests for auth flow (TDD red). **File:** `artifacts/api‑server/__tests__/api/portal/auth.test.ts` **Verification:** All red.
- [ ] PORTAL‑AUTH‑001.3 (AGENT): Implement `PortalAuthService` with hashing, email sending, and JWT creation. **File:** `artifacts/api‑server/src/services/portal/portal‑auth‑service.ts` **Verification:** Unit tests pass.
- [ ] PORTAL‑AUTH‑001.4 (AGENT): Implement per‑email rate limiting middleware. **File:** `artifacts/api‑server/src/middlewares/portal‑rate‑limit.ts` **Verification:** 4th request within 15 min → 429.
- [ ] PORTAL‑AUTH‑001.5 (AGENT): Implement `portalAuthMiddleware`. **File:** `artifacts/api‑server/src/middlewares/portal‑auth.ts` **Verification:** Valid JWT → `req.portalClient` set.
- [ ] PORTAL‑AUTH‑001.6 (AGENT): Create portal auth routes; run integration tests to green. **File:** `artifacts/api‑server/src/routes/portal/auth.ts` **Verification:** All green.
- [ ] PORTAL‑AUTH‑001.7 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Portal – API (Firm‑Side & Client‑Side)

### [ ] API‑PORTAL‑001: Portal – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No portal management or client‑side endpoints exist in the OpenAPI spec.
**Size:** Small

**Description:** Extend the OpenAPI spec with all firm‑side and client‑side portal paths (dual auth requirements), enabling codegen to produce typed hooks and Zod validators.

**Depends on:** `portal/PORTAL‑ACCESS.md → PORTAL‑AUTH‑001`, `DB‑PORTAL‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑002`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] **Firm‑side** (firm JWT auth): `GET /portal/clients`, `POST /portal/clients`, `PATCH /{clientId}`, `POST /{clientId}/permissions`, `GET /{clientId}/messages`, `POST /{clientId}/messages`
- [ ] **Client‑side** (portal JWT auth): `GET /portal/me`, `GET /me/projects`, `GET /me/invoices`, `GET /me/documents`, `GET /me/messages`, `POST /me/messages`
- [ ] Both auth types clearly annotated with different security schemes
- [ ] Schemas: `PortalClient`, `PortalPermission`, `PortalMessage`, `PortalBranding`
- [ ] `pnpm codegen` succeeds; `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Firm‑side routes manage the portal; client‑side routes ARE the portal.

---

### Subtasks
- [ ] API‑PORTAL‑001.0.25 (AGENT): Read PORTAL‑AUTH‑001, DB‑PORTAL‑001, and `openapi.yaml` structure. *No action – pause.*
- [ ] API‑PORTAL‑001.1 (AGENT): Add firm‑side and client‑side portal paths with dual security schemes to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** Spec validates.
- [ ] API‑PORTAL‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑PORTAL‑002: Portal – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No portal integration tests exist.
**Size:** Small

**Description:** Write failing integration tests for all firm‑side and client‑side portal endpoints, including permission enforcement and messaging.

**Depends on:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑003`
**Related Files:** `artifacts/api‑server/__tests__/api/portal/portal.test.ts`

**Definition of Done**
- [ ] Firm‑side tests: enable portal → 201; update branding → 200; grant permission → 201; firm sends message → 201
- [ ] Client‑side tests: client fetches projects/invoices/documents with `can_view` → 200; missing permission → 403 or empty list; client sends message → 201
- [ ] Unauthorized → 401; expired portal JWT → 401
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal.test.ts
# Expected: all red
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑PORTAL‑002.0.25 (AGENT): Read API‑PORTAL‑001 spec, PORTAL‑AUTH‑001, TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑PORTAL‑002.1 (AGENT): Write all integration tests (red phase). **File:** `artifacts/api‑server/__tests__/api/portal/portal.test.ts` **Verification:** All red.
- [ ] API‑PORTAL‑002.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑PORTAL‑003: Portal – Service & Repository (with permission enforcement)
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No `PortalService` or `PortalRepository` exists. Permission enforcement is absent.
**Size:** Medium

**Description:** Implement `PortalRepository` and `PortalService` with methods for enabling portal, managing permissions, and enforcing `portal_content_permissions` on all client‑side queries. Emits `PortalClientEnabled` and `PortalMessageReceived` events.

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001`, `DB‑PORTAL‑002`, `PORTAL‑AUTH‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑004`
**Related Files:** `lib/db/src/repositories/portal.ts`, `artifacts/api‑server/src/services/portal/portal‑service.ts`

**Definition of Done**
- [ ] `PortalRepository`: `enablePortal`, `updateBranding`, `grantPermission`, `revokePermission`, `getPermissions`, `listMessages`, `sendMessage`
- [ ] `PortalService` with corresponding methods; all return `Result<T, DomainError>`
- [ ] Permission enforcement: all client‑side queries filter by `portal_content_permissions`; no permission → `PortalAccessDenied` (403) or empty list
- [ ] `PortalClientEnabled` event on enable; `PortalMessageReceived` on message send
- [ ] Unit tests cover permission enforcement
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal‑service
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal client permissions are an aggregate in the Portal bounded context.
- TDD: Write unit tests for `can_view = false` scenario.
- BDD: “A portal client can only see projects the firm has explicitly shared with them.”

---

### Subtasks
- [ ] API‑PORTAL‑003.0.25 (AGENT): Read DB‑PORTAL‑001/002, portal.test.ts, PORTAL‑AUTH‑001. *No action – pause.*
- [ ] API‑PORTAL‑003.1 (AGENT): Implement `PortalRepository`. **File:** `lib/db/src/repositories/portal.ts` **Verification:** Unit tests pass.
- [ ] API‑PORTAL‑003.2 (AGENT): Implement `PortalService` with permission enforcement and events. **File:** `artifacts/api‑server/src/services/portal/portal‑service.ts` **Verification:** Unit tests with mocked repo pass.
- [ ] API‑PORTAL‑003.3 (AGENT): Write unit tests for all service methods. **File:** `artifacts/api‑server/src/__tests__/services/portal/portal‑service.test.ts` **Verification:** All green.
- [ ] API‑PORTAL‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑PORTAL‑004: Portal – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No portal routes exist. Integration tests are red.
**Size:** Small

**Description:** Wire firm‑side and client‑side portal routes with appropriate auth middleware and Zod validation, turning the API‑PORTAL‑002 integration tests green.

**Depends on:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑003`, `PORTAL‑AUTH‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → PORTAL‑EVENTS‑001`, `PORTAL‑CLEANUP‑001`
**Related Files:** `artifacts/api‑server/src/routes/portal/clients.ts`, `artifacts/api‑server/src/routes/portal/me.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] Firm‑side routes (`clients.ts`) protected by `firmAuthMiddleware`
- [ ] Client‑side routes (`me.ts`) protected by `portalAuthMiddleware`
- [ ] Both routers mounted under `/portal`
- [ ] All integration tests from API‑PORTAL‑002 pass (green)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal.test.ts
# Expected: all green
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑PORTAL‑004.0.25 (AGENT): Read portal.test.ts, PortalService, routes/index.ts. *No action – pause.*
- [ ] API‑PORTAL‑004.1 (AGENT): Create firm‑side portal routes. **File:** `routes/portal/clients.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PORTAL‑004.2 (AGENT): Create client‑side portal routes. **File:** `routes/portal/me.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PORTAL‑004.3 (AGENT): Mount both routers. **File:** `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑PORTAL‑004.4 (AGENT): Run integration tests to green. **Verification:** All green; `pnpm typecheck`.
- [ ] API‑PORTAL‑004.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Portal Management & Client Access

### [ ] FRONT‑PORTAL‑001a: Firm‑Side Portal Management – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `Portal.tsx` uses mock data for client list, portal settings, and messages.
**Size:** Medium

**Description:** Replace all mock data in the firm‑side Portal Management page with React Query hooks backed by `API‑PORTAL‑004`. Enable/disable portal per client, manage permissions, configure branding, and view/send messages in the firm‑side messaging inbox.

**Depends on:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑004`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `portal/PORTAL‑ACCESS.md → FRONT‑INT‑PORTAL`
**Related Files:** `artifacts/apex‑os/src/pages/Portal.tsx`, `artifacts/apex‑os/src/hooks/portal/useClientPortalList.ts`, `usePortalSettings.ts`, `useFirmMessages.ts`

**Definition of Done**
- [ ] Client list view with portal status toggle, last login, message count badge
- [ ] Client detail panel with Permissions, Branding, Activity Log, and Messages tabs
- [ ] Permission toggles per resource type (view_projects, view_invoices, etc.)
- [ ] Activity log tab: last 50 portal actions
- [ ] Messages tab: conversation list with unread badge; reply input
- [ ] All `mockData` imports removed
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass with MSW

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- portal‑management.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal access is a configuration value object on the Client aggregate.
- TDD: MSW returns client list; simulate toggle disabled → assert confirmation → assert `PATCH /portal/clients/:id` called.
- BDD: “As a firm user, I can manage which clients have portal access, control their permissions, and view their portal messages.”

---

### Subtasks
- [ ] FRONT‑PORTAL‑001a.0.25 (AGENT): Read `Portal.tsx` in full. *No action – pause.*
- [ ] FRONT‑PORTAL‑001a.1 (AGENT): Create all firm‑side portal hooks. **File:** `useClientPortalList.ts`, `usePortalSettings.ts`, `useFirmMessages.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001a.2 (AGENT): Build client list, status toggle, permissions tab, activity log tab. **File:** `Portal.tsx` **Verification:** No mockData; `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001a.3 (AGENT): Build firm‑side messages tab. **File:** `Portal.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001a.4 (AGENT): Write component tests. **File:** `artifacts/apex‑os/src/pages/__tests__/portal‑management.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PORTAL‑001a.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑PORTAL‑001b: Client‑Side Portal Access
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No client‑side portal pages exist.
**Size:** Medium

**Description:** Client‑facing portal experience under `PortalAuthContext`: a dashboard showing recent invoices, active projects, pending document requests, and upcoming appointments. Individual resource views scoped to only the client’s permitted resources.

**Depends on:** `infrastructure/AUTH.md → FRONT‑AUTH‑003`, `portal/PORTAL‑ACCESS.md → API‑PORTAL‑004`, `FRONT‑PORTAL‑001a`
**Blocks:** `portal/PORTAL‑ACCESS.md → FRONT‑INT‑PORTAL`
**Related Files:** `artifacts/apex‑os/src/pages/portal/ClientDashboard.tsx`, `PortalInvoices.tsx`, `PortalProjects.tsx`, `PortalDocuments.tsx`, `PortalMessages.tsx`

**Definition of Done**
- [ ] Portal layout: minimal header with firm branding; logout button
- [ ] Client dashboard: metric cards, recent invoices, recent messages
- [ ] Portal invoices page: list with status badges, “Pay Now” button
- [ ] Portal projects page: read‑only project list
- [ ] Portal documents page: scoped document list with download
- [ ] Portal messages page: conversation list; thread view; reply input
- [ ] All pages behind `PortalAuthGuard`
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- portal‑client.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The client portal is a separate bounded context from the firm app.
- TDD: MSW returns portal‑scoped invoices; assert only those render; simulate unauthenticated → assert redirect.
- BDD: “As a client, I can log into my portal with a magic link, view my invoices, and pay outstanding balances.”

---

### Subtasks
- [ ] FRONT‑PORTAL‑001b.1 (AGENT): Create portal API client instance using portal JWT. **File:** `lib/portalApiClient.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001b.2 (AGENT): Create portal hooks. **File:** `usePortalInvoiceList.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001b.3 (AGENT): Build portal layout, guard, and `ClientDashboard`. **File:** `ClientDashboard.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001b.4 (AGENT): Build `PortalInvoices`, `PortalProjects`, `PortalDocuments`, `PortalMessages`. **File:** respective page files **Verification:** `pnpm typecheck`.
- [ ] FRONT‑PORTAL‑001b.5 (AGENT): Write component tests. **File:** `artifacts/apex‑os/src/pages/__tests__/portal‑client.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑PORTAL‑001b.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑PORTAL: Portal Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No portal mutations are wired.
**Size:** Medium

**Description:** Wire all portal mutations for both firm and client sides: firm sends message / client replies, permission grant/revoke, branding config update, and client payment. All mutations show sonner toast feedback.

**Depends on:** `portal/PORTAL‑ACCESS.md → FRONT‑PORTAL‑001a`, `FRONT‑PORTAL‑001b`, `infrastructure/AUTH.md → FRONT‑AUTH‑003`, `FRONT‑INFRA‑003`
**Blocks:** [N/A]
**Related Files:** `Portal.tsx`, `PortalMessages.tsx`, `artifacts/apex‑os/src/hooks/portal/`

**Definition of Done**
- [ ] Firm and client messaging mutations with optimistic thread update
- [ ] Permission grant/revoke mutations with optimistic toggle update
- [ ] Branding config update mutation; client payment mutation
- [ ] All mutations disable button during `isPending`; sonner toasts
- [ ] Integration tests with MSW cover all 5 mutation flows

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- portal‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal messaging is a Communication aggregate shared between two bounded contexts.
- TDD: Simulate firm message send → assert `POST /portal/messages` called; simulate pay → assert confirmation dialog.
- BDD: “As a firm user, I can message clients through the portal. As a client, I can reply and pay invoices directly in the portal.”

---

### Subtasks
- [ ] FRONT‑INT‑PORTAL.1 (AGENT): Implement `useSendFirmMessage` and `useSendClientMessage` mutations. **File:** `useSendFirmMessage.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PORTAL.2 (AGENT): Wire permission grant/revoke mutations. **File:** `useGrantPermission.ts`, `Portal.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PORTAL.3 (AGENT): Implement `useUpdatePortalBranding` and `usePortalPayment` mutations. **File:** `useUpdatePortalBranding.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑PORTAL.4 (AGENT): Write integration tests. **File:** `portal‑interactive.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑INT‑PORTAL.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Portal Maintenance

### [ ] PORTAL‑EVENTS‑001: Portal Domain Events Verification
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Portal events are defined but not verified in audit logs.
**Size:** Small

**Description:** Verify that `PortalClientEnabled` and `PortalMessageReceived` domain events are emitted by `PortalService` and recorded in the audit log, via integration tests.

**Depends on:** `portal/PORTAL‑ACCESS.md → API‑PORTAL‑003`, `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/__tests__/api/portal/portal‑events.test.ts`

**Definition of Done**
- [ ] Integration test: enable portal → `PortalClientEnabled` event appears in `audit_logs`
- [ ] Integration test: firm sends message → `PortalMessageReceived` event appears
- [ ] Integration test: client sends message → `PortalMessageReceived` event appears
- [ ] All 3 tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal‑events.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] PORTAL‑EVENTS‑001.1 (AGENT): Write integration tests verifying audit log entries. **File:** `portal‑events.test.ts` **Verification:** All green.
- [ ] PORTAL‑EVENTS‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] PORTAL‑CLEANUP‑001: Portal Session Cleanup
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Expired magic link hashes accumulate indefinitely.
**Size:** Small

**Description:** Implement a `node‑cron` scheduled job (every 6 hours) that purges expired `magic_link_hash` rows from `portal_magic_links` where `expires_at < NOW() - PORTAL_CLEANUP_HOURS`, with per‑run logging and idempotent cleanup.

**Depends on:** `portal/PORTAL‑ACCESS.md → DB‑PORTAL‑003`
**Blocks:** Long‑term portal data hygiene
**Related Files:** `artifacts/api‑server/src/services/portal/session‑cleanup.ts`, `artifacts/api‑server/src/jobs/portal‑cleanup.ts`

**Definition of Done**
- [ ] `PortalSessionCleanupService` with `cleanup()` method: deletes expired rows
- [ ] `startPortalCleanupJob()` using `node‑cron` (every 6 hours)
- [ ] Configurable via `PORTAL_CLEANUP_HOURS` env var (default: 24)
- [ ] Each run logs cleaned count via Pino
- [ ] Unit tests confirm expired rows deleted; non‑expired rows remain
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- portal‑cleanup.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Session cleanup is a maintenance task at the application service layer.
- TDD: Write unit test for the WHERE clause logic before implementing the service.
- BDD: “Expired magic links are purged every 6 hours, keeping the database clean and secure.”

---

### Subtasks
- [ ] PORTAL‑CLEANUP‑001.1 (AGENT): Implement `PortalSessionCleanupService`. **File:** `session‑cleanup.ts` **Verification:** Unit tests pass.
- [ ] PORTAL‑CLEANUP‑001.2 (AGENT): Implement `startPortalCleanupJob()` with `node‑cron`. **File:** `portal‑cleanup.ts` **Verification:** `pnpm typecheck`.
- [ ] PORTAL‑CLEANUP‑001.3 (AGENT): Write unit and integration tests. **File:** `portal‑cleanup.test.ts` **Verification:** GREEN.
- [ ] PORTAL‑CLEANUP‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
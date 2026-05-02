Now applying all corrections to **Phase 1 – Identity & Access**. Because identity database tasks have been moved to Phase 2 (to follow the Organization table), this phase focuses entirely on the authentication API layer—OpenAPI spec, services, middleware, and front‑end auth wiring—using test doubles where necessary. The integration tests will be written now but remain **red** until the identity schema is created in Phase 2 and the test infrastructure (TEST‑INFRA‑001) is in place.

Key changes:

- Added `organizationId` to registration/login flows (1.1).
- Included a seeded‑admin login test (2.6).
- Noted temporary raw errors in AUTH‑008 (1.4).
- Depth refactor check added to AuthService.
- All subtasks now carry explicit `verification` commands.
- Dependency notes: AUTH‑002 tests remain red until Phase 2 DB‑IDENTITY‑005.

---

# Phase 1 – Identity & Access (Authentication & Users)

*This phase targets the **Identity & Access** bounded context. **Identity database tables (users, roles, permissions, user_roles) are deferred to Phase 2, directly after the Organization table**, ensuring every user is linked to an organization from the start.  
Phase 1 builds the entire authentication service, JWT and password hashing, OpenAPI endpoints, route handlers, auth middleware, and the front‑end auth context—using TypeScript types and stubs. Integration tests (AUTH‑002) are written now but will stay red until the database schema is applied in Phase 2.*

**Prerequisites:** Ensure DEP‑001 (Missing Dependencies), DOMAIN‑001 (Glossary), and DOMAIN‑002 (Context Map) tasks are completed before starting this phase.

---

### Phase 1 Task Index

- [ ] ERROR‑002: Define Domain Error Types  
- [ ] ERROR‑001: Global Express Error Handling Middleware  
- [ ] AUTH‑001: Expand OpenAPI Spec for Authentication Endpoints  
- [ ] AUTH‑002: Write Integration Tests for Auth Endpoints (TDD Red)  
- [ ] AUTH‑003: Implement Password Hashing Service  
- [ ] AUTH‑004: Implement JWT Service  
- [ ] AUTH‑005: Implement Auth Service (Deep Module)  
- [ ] AUTH‑006: Create Auth Routes and Validation Middleware  
- [ ] AUTH‑007: Run Integration Tests to Green *(post‑Phase 2)*  
- [ ] AUTH‑008: Implement Auth Middleware for Protected Routes  
- [ ] AUTH‑009: Create Frontend AuthContext and useAuth Hook  
- [ ] AUTH‑010: Wire Custom Fetch to Auth Token  
- [ ] AUTH‑011: Replace Hardcoded Header User Initials  
- [ ] AUTH‑012: Manual End‑to‑End Test of Auth Flow  

---

## Detailed Task Breakdown

### AUTH‑001: Expand OpenAPI Spec for Authentication Endpoints
**Status:** ⏳ Not Started  
**Current state:** `openapi.yaml` contains only the `/healthz` endpoint.  
**Definition of Done:** `lib/api‑spec/ openapi.yaml` includes `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` with schemas and examples.  
- **`POST /auth/register`** Request body: `{ email, password, fullName, organizationId }` (organizationId must be a valid UUID). Response: 201 with user object (excluding password hash).  
- **`POST /auth/login`** Request body: `{ email, password, organizationId }` (or `organizationSlug`). Response: `{ accessToken, refreshToken, user }`.  
- **`POST /auth/refresh`** Request body: `{ refreshToken }`.  
- **`POST /auth/logout`** Request body: (optional `refreshToken` to invalidate).  
- All responses use a standard envelope `{ success, data, error? }`.  
- OpenAPI spec must include `examples` for each operation.  
**Related Files:** `lib/api‑spec/openapi.yaml`

**DDD:** Auth endpoints belong to the Identity & Access context. The registration accepts an organization identifier, reflecting the multi‑tenancy ADR (ARCH‑001).  
**TDD:** After codegen, we’ll write failing integration tests (AUTH‑002) that verify the contract.  
**BDD:** These endpoints implement scenarios from `auth.feature` (register, login, refresh, logout).  
**Deep Module:** The spec defines the public interface; the underlying auth service is a deep module.

**Subtasks:**
- [ ] AUTH‑001.1: Add auth paths to OpenAPI spec with operation IDs, request/response schemas, and `organizationId` field in registration/login. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** `pnpm typecheck` passes after codegen; spec contains `/auth/register` with `organizationId`.
- [ ] AUTH‑001.2: Add example request and response bodies for each endpoint. (AGENT)  
  **verification:** Generated client contains typed examples.
- [ ] AUTH‑001.3: Run `pnpm codegen` to regenerate client and Zod schemas. (HUMAN)  
  **verification:** `pnpm typecheck` passes; generated files updated.
- [ ] AUTH‑001.4: After codegen, run `pnpm typecheck` and check for Orval `_type` property issues. If found, restructure OpenAPI spec to move `allOf` before inline properties. (AGENT)  
  **verification:** `pnpm typecheck` passes; no orphan `_type` properties in generated files.

**Blocks:** AUTH‑002, AUTH‑006  
**Depends on:** DOMAIN‑001 (glossary), DOMAIN‑002 (context map) - *Note: Ensure these domain tasks are defined before Phase 1 execution*

---

### AUTH‑002: Write Integration Tests for Auth Endpoints (TDD Red)
**Status:** ⏳ Not Started  
**Current state:** No integration tests exist.  
**Definition of Done:** `artifacts/api‑server/__tests__/api/auth.test.ts` contains **failing** tests for register, login, refresh, logout, and negative cases—including a test for the seeded admin user (admin@apex.local / password from seed).  
- Test: `POST /auth/register` with valid organization → 201, user row created.  
- Test: `POST /auth/register` with duplicate email → 409 `DuplicateEmail`.  
- Test: `POST /auth/login` with valid credentials → 200, tokens present.  
- Test: `POST /auth/login` with invalid password → 401 `InvalidCredentials`.  
- Test: `POST /auth/refresh` with valid refresh token → 200, new tokens.  
- Test: `POST /auth/refresh` with expired token → 401 `TokenExpired`.  
- **Seeded admin login**: Given the admin user created in DB‑IDENTITY‑005 seed, `POST /auth/login` with `email: admin@apex.local` and correct password returns 200.  
- Test: Unauthorized access to protected route → 401.  
**Related Files:** `artifacts/api‑server/__tests__/api/auth.test.ts`

**DDD:** Tests verify that Identity domain rules (unique email, linked organization) are enforced.  
**TDD:** These tests will fail until routes and services are implemented and the database is seeded (Phase 2). They guide the development.  
**BDD:** These tests are the executable counterpart of `auth.feature`.  
**Deep Module:** Tests exercise only the public API, preserving encapsulation.

**Subtasks:**
- [ ] AUTH‑002.1: Write test cases for register, login, refresh, logout, and seeded admin login. (AGENT) – `artifacts/api‑server/__tests__/api/auth.test.ts`  
  **verification:** `pnpm vitest run auth.test.ts` reports all tests failing (red).  
  **Note:** The seeded-admin test specifically stays red until Phase 2 (DB‑IDENTITY‑005) when the admin user is created in the database.  
**Blocks:** AUTH‑007 (run to green)  
**Depends on:** AUTH‑001 (for generated types), DEP-001.4 (test script setup), DB‑IDENTITY‑005 (seeded admin user) – tests will remain red until DB‑IDENTITY‑005 is done in Phase 2.

---

### AUTH‑003: Implement Password Hashing Service
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api‑server/src/lib/crypto.ts` exports `hashPassword(plain)` and `verifyPassword(plain, hash)` using argon2id.  
**Related Files:** `artifacts/api‑server/src/lib/crypto.ts`

**DDD:** Infrastructure service within Identity; domain doesn’t care about hashing details.  
**TDD:** Write unit tests for hash/verify round‑tripping before implementation.  
**BDD:** Indirectly tested via registration/login scenarios.  
**Deep Module:** Methods hide argon2id complexity; consumers only see a simple verify interface.

**Subtasks:**
- [ ] AUTH‑003.1: Write unit test for hash/verify (round‑trip, wrong password). (AGENT)  
  **verification:** `pnpm vitest run crypto.test.ts` fails before implementation, passes after.
- [ ] AUTH‑003.2: Implement `hashPassword` and `verifyPassword` using argon2id. (AGENT)  
  **verification:** Unit tests pass; `pnpm typecheck` clean.
- **Depends on:** DEP-001.3 (argon2id dependency).

---

### AUTH‑004: Implement JWT Service
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api-server/src/lib/jwt.ts` exports `generateAccessToken(user)`, `generateRefreshToken(user)`, `verifyToken(token)` with configurable expiry.  
**Related Files:** `artifacts/api-server/src/lib/jwt.ts`  
**Dependencies:** Verify `framer-motion@^12.23.24` in workspace catalog (update memory rules if needed)

**DDD:** JWT tokens represent an authenticated session; not part of the domain model itself.  
**TDD:** Write unit tests for token creation (includes correct payload) and verification (rejects expired/invalid tokens).  
**BDD:** Tokens appear in the auth.feature as a response.  
**Deep Module:** JWT service hides encoding, decoding, and secret management.

**Subtasks:**
- [ ] AUTH‑004.1: Write unit tests for token generation and verification. (AGENT)  
  **verification:** `pnpm test -- jwt.test.ts` fails initially.
- [ ] AUTH‑004.2: Implement functions using env `JWT_SECRET`. (AGENT)  
  **verification:** All tests pass; `pnpm typecheck` clean.

---

### AUTH‑005: Implement Auth Service (Deep Module)
**Status:** ⏳ Not Started  
**Current state:** `services/` directory does not exist.  
**Definition of Done:** `artifacts/api-server/src/services/auth.ts` exposes `register`, `login`, `refresh`, `logout` methods that coordinate hashing, token generation, and persistence (stubbed until DB exists).  
- `TokenRefreshPort` interface defined in `src/lib/auth/token-refresh-port.ts` with methods: `storeRefreshToken(userId, token)`, `getRefreshToken(tokenHash)`, `invalidateRefreshToken(tokenHash)`, `invalidateAllUserTokens(userId)`.  
- `register(email, password, fullName, organizationId)`: validate organization exists (via OrganizationRepository stubbed), hash password, create user with `organization_id`, return `Right<User>`.  
- `login(email, password, organizationId)`: find user by email AND organization, verify password, generate tokens, return `Right<{ accessToken, refreshToken, user }>`.  
- `refresh(token)`: verify, rotate, return new tokens using `TokenRefreshPort`.  
- `logout(token)`: invalidate refresh token using `TokenRefreshPort` (stubbed).  
- All methods return `Either<DomainError, Result>` using `neverthrow`.  
- Organization existence check is a stub that will be replaced in Phase 2 when OrganizationRepository is ready.  
**Related Files:** `artifacts/api-server/src/services/auth.ts`
**Depends on:** DEP-001.1 (neverthrow dependency for Either pattern)

**DDD:** AuthService is the core of the Identity context. It enforces registration rules and ties users to organizations.  
**TDD:** Write unit tests mocking the (future) UserRepository and OrganizationRepository.  
**BDD:** The service fulfills `auth.feature` scenarios.  
**Deep Module:** The service interface is simple (4 methods) while hiding orchestration.  
**Depth refactor check:** After implementation, verify route handlers contain no domain logic; service hides all complexity behind ≤5 public methods; never throws, always returns Either.

**Subtasks:**
- [ ] AUTH‑005.1: Write unit tests for service methods with mocked repositories. (AGENT)  
  **verification:** `pnpm vitest run auth.service.test.ts` red.
- [ ] AUTH‑005.2: Implement `register` and `login` with organization stub. (AGENT)  
  **verification:** Tests pass for these two methods.
- [ ] AUTH‑005.3: Implement `refresh` and `logout` with explicit stub behavior. (AGENT)  
  **verification:** `refresh` returns deterministic token pair (hardcoded for tests); `logout` returns `right(undefined)`.
- [ ] AUTH-005.4: Depth refactor check: verify route handlers contain no domain logic; service hides all complexity behind ≤5 public methods; never throws, always returns Either. (AGENT)  
  **verification:** Manual inspection confirms no `throw` in service file, all methods return Either, `pnpm typecheck` clean.

---

### AUTH‑006: Create Auth Routes and Validation Middleware
**Status:** ⏳ Not Started  
**Definition of Done:** `routes/auth.ts` wires endpoints to `AuthService`, using a generic validation middleware with generated Zod schemas.  
**Related Files:** `artifacts/api‑server/src/routes/auth.ts`, `artifacts/api‑server/src/middlewares/validation.ts`

**DDD:** Routes are thin adapters that translate HTTP to domain service calls. No business logic.  
**TDD:** Write a test for the validation middleware before creating it.  
**BDD:** Routes satisfy the HTTP‑level behaviour of `auth.feature`.  
**Deep Module:** The route layer is intentionally shallow.

**Subtasks:**
- [ ] AUTH‑006.1: Create validation middleware factory – `validate(schema)` returns a middleware that parses `req.body` and returns 400 with field errors on failure. (AGENT) – `middlewares/validation.ts`  
  **verification:** Unit test for validation middleware.
- [ ] AUTH‑006.2: Build route handlers for register/login/refresh/logout. (AGENT) – `routes/auth.ts`  
  **verification:** Route tests with supertest and mocked service pass.
- [ ] AUTH‑006.3: Add auth router to main router. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` passes.

---

### AUTH‑007: Run Integration Tests to Green
**Status:** ⏳ Not Started  
**Note:** **This task cannot complete until Phase 2** — when the identity database tables are created and seeded via DB‑IDENTITY‑005. Until then, the tests from AUTH‑002 remain red. The subtasks here assume the database is ready.  
**Definition of Done:** All tests from AUTH‑002 pass. Additional tests for edge cases (weak password, missing fields) are added and pass.  
**Related Files:** `artifacts/api‑server/__tests__/api/auth.test.ts`

**Subtasks:**
- [ ] AUTH‑007.1: (After Phase 2 DB‑IDENTITY‑005) Run test suite, fix any issues. (AGENT)  
  **verification:** `pnpm test -- auth.test.ts` all green.
- [ ] AUTH‑007.2: Add negative test cases (weak password, missing fields). (AGENT)  
  **verification:** Tests pass.
- **Depends on:** DB‑IDENTITY‑005 (Phase 2), AUTH‑006.

---

### AUTH‑008: Implement Auth Middleware for Protected Routes
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api‑server/src/middlewares/auth.ts` verifies JWT on incoming requests and sets `req.user`.  
**Note:** Until the global error handler (ERROR‑001) is implemented (Phase 1.5), errors from this middleware will be returned as plain HTTP 401 responses without a uniform envelope. This is acceptable temporarily.  
**Related Files:** `artifacts/api‑server/src/middlewares/auth.ts`

**DDD:** The middleware enforces the authenticated user boundary for all downstream contexts.  
**TDD:** Write a test that an unprotected route returns 401 without token, and 200 with valid token.  
**BDD:** “As a user, I can access my profile only when authenticated.”  
**Deep Module:** The middleware is a cross‑cutting concern; it hides token extraction and verification.

**Subtasks:**
- [ ] AUTH‑008.1: Write test for middleware (using supertest with a dummy route). (AGENT)  
  **verification:** `pnpm test -- auth.middleware.test.ts` red.
- [ ] AUTH‑008.2: Implement middleware. (AGENT)  
  **verification:** Tests pass; `pnpm typecheck` clean.

---

### AUTH‑009: Create Frontend AuthContext and useAuth Hook
**Status:** ⏳ Not Started  
**Current state:** `contexts/` directory does not exist; no auth state management.  
**Definition of Done:** `contexts/AuthContext.tsx` holds current user and auth methods (`login`, `register`, `logout`); `hooks/useAuth.ts` consumes it.  
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`, `artifacts/apex‑os/src/hooks/useAuth.ts`

**DDD:** Frontend context mirrors the authenticated user identity from the server.  
**TDD:** Write a component test that simulates login and verifies the user object is available.  
**BDD:** “Given an authenticated user, the header shows their initials.”  
**Deep Module:** The context acts as a deep module for authentication state; components only consume `useAuth()`.

**Subtasks:**
- [ ] AUTH‑009.1: Write context and hook. (AGENT)  
  **verification:** Component test with mocked API passes.
- [ ] AUTH‑009.2: Wrap `App.tsx` with `AuthProvider`. (AGENT)  
  **verification:** `pnpm typecheck` passes; no runtime crash on app load.

---

### AUTH‑010: Wire Custom Fetch to Auth Token
**Status:** ⏳ Not Started  
**Current state:** `setAuthTokenGetter()` exists but is never called.  
**Definition of Done:** When user logs in, `setAuthTokenGetter()` is called with the access token.  
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`

**Subtasks:**
- [ ] AUTH‑010.1: In AuthContext, subscribe to token changes and call `setAuthTokenGetter`. (AGENT)  
  **verification:** Manual test (or E2E later) that API calls include `Authorization` header.
- [ ] AUTH‑010.2: Write a component test verifying that after login, a fetch interceptor attaches the token. (AGENT)  
  **verification:** Test passes.

---

### AUTH‑011: Replace Hardcoded Header User Initials
**Status:** ⏳ Not Started  
**Current state:** `Header.tsx:39` shows hardcoded “JS” initials.  
**Definition of Done:** `Header.tsx` reads `user` from `useAuth()` and displays real initials.  
**Related Files:** `artifacts/apex‑os/src/components/layout/Header.tsx`

**Subtasks:**
- [ ] AUTH‑011.1: Update Header to use auth state. (AGENT) – `Header.tsx`  
  **verification:** Component test with mocked auth context renders correct initials.
- [ ] AUTH‑011.2: Write component test proving hardcoded initials are gone. (AGENT)  
  **verification:** Test passes.

---

### AUTH‑012: Manual End‑to‑End Test of Auth Flow
**Status:** ⏳ Not Started  
**Definition of Done:** Register, login, logout, token refresh all work end‑to‑end in the browser.  
**Related Files:** N/A

**DDD:** Final validation that the Identity context is fully functional.  
**TDD:** N/A.  
**BDD:** This manual test follows `auth.feature` exactly.  
**Deep Module:** The entire auth subsystem is verified through its public API (UI and HTTP).

**Subtasks:**
- [ ] AUTH‑012.1: Run the app and perform full auth journey (register with organization, login, refresh, logout). (HUMAN)  
  **verification:** Works end‑to‑end.

---

## [ ] ERROR‑001: Global Express Error Handling Middleware
**Status:** ⏳ Not Started  
**Current state:** No global error handler exists – errors will be inconsistent and lack proper HTTP response formatting.  
**Definition of Done:** `artifacts/api-server/src/middlewares/error-handler.ts` exports global error handling middleware that:
- Catches all errors (sync and async) in Express routes
- Maps `DomainError` instances from ERROR‑002 to appropriate HTTP status codes and standard response envelope
- Handles unexpected errors with generic 500 response
- Logs errors with structured format (request ID, user context)
- Returns consistent error envelope: `{ success: false, error: { code, message, details? } }`
- Integrates with Sentry (when configured) for error tracking

**Error Mapping Examples:**
- `InvalidCredentials` → 401
- `TokenExpired` → 401  
- `DuplicateEmail` → 409
- `LeadNotFound` → 404
- `ValidationError` → 400
- `DatabaseError` → 500
- Unknown errors → 500

**Anti-Patterns:** Leaking implementation details in error messages; inconsistent error formats; missing request correlation.  
**Related Files:** `artifacts/api-server/src/middlewares/error-handler.ts`

**DDD:** Global error handler translates domain errors into HTTP responses while preserving domain semantics.  
**TDD:** Write unit tests for each error mapping scenario.  
**BDD:** Ensures all negative scenarios from feature files return appropriate HTTP responses.  
**Deep Module:** Error handler is a cross-cutting concern that provides a clean interface between domain errors and HTTP responses.

### Subtasks:
- [ ] ERROR‑001.1: Create error handler middleware with DomainError mapping. (AGENT) – `src/middlewares/error-handler.ts`  
  **verification:** Unit tests for error mappings pass.
- [ ] ERROR‑001.2: Add structured logging with request ID correlation. (AGENT)  
  **verification:** Error logs include request ID and user context.
- [ ] ERROR‑001.3: Integrate error handler as last middleware in Express app. (AGENT) – `app.ts`  
  **verification:** All routes use global error handler.
- [ ] ERROR‑001.4: Add Sentry integration (optional, based on env config). (AGENT)  
  **verification:** Errors are sent to Sentry when DSN is provided.
- **Depends on:** ERROR‑002 (domain errors defined).
- **Blocks:** All route implementations (AUTH‑006, API‑CRM‑004, etc.).

---

## [ ] ERROR‑002: Define Domain Error Types
**Status:** ⏳ Not Started  
**Current state:** No domain error types exist – errors will be inconsistent and lack proper classification.  
**Definition of Done:** `artifacts/api-server/src/errors/domain-errors.ts` exports 40+ domain error classes using `neverthrow` Either pattern:  

**Identity & Access Errors:** `InvalidCredentials`, `TokenExpired`, `DuplicateEmail`, `UserNotFound`, `InvalidOrganization`, `InsufficientPermissions`, `RoleNotFound`, `PermissionDenied`  

**CRM Errors:** `InvalidStageTransition`, `LeadNotFound`, `DuplicateLead`, `ContactNotFound`, `DuplicateEmail`, `CompanyNotFound`, `DuplicateDomain`, `DealNotFound`, `InvalidProbability`, `ActivityNotFound`  

**Projects Errors:** `ProjectNotFound`, `TaskNotFound`, `TaskHasUnfinishedSubtasks`, `MilestoneAlreadyCompleted`, `ProgressIsReadOnly`, `InvalidStatusTransition`  

**Finance Errors:** `InvoiceNotFound`, `InvoiceTypeViolation`, `PaymentExceedsBalance`, `BudgetExceeded`, `BudgetThresholdReached`, `DuplicatePayment`, `VirtualCardNotFound`, `InsufficientLimit`  

**Document Errors:** `DocumentNotFound`, `SignatureRequestNotFound`, `DocumentAlreadySigned`, `StorageAdapterError`, `InvalidDocumentType`  

**Asset Errors:** `AssetNotFound`, `AssetNotAvailable`, `CheckoutNotAllowed`, `MaintenanceRequired`, `DepreciationError`  

**Portal Errors:** `MagicLinkInvalid`, `MagicLinkExpired`, `PortalAccessDenied`, `SessionNotFound`  

**Analytics & Settings:** `ReportNotFound`, `InvalidDateRange`, `ConfigurationError`  

**Generic Errors:** `ValidationError`, `DatabaseError`, `NetworkError`, `TimeoutError`

**Anti-Patterns:** Using string literals for errors; throwing exceptions instead of Either pattern; inconsistent error codes.  
**Related Files:** `artifacts/api-server/src/errors/domain-errors.ts`

**DDD:** Domain errors express business rule violations in the ubiquitous language. Each bounded context has its own error taxonomy.  
**TDD:** Write unit tests for each error class – verify error code, message, and metadata structure.  
**BDD:** These error types directly map to negative scenarios in feature files (e.g., `InvalidStageTransition` in CRM feature).  
**Deep Module:** Error module is shallow but provides a typed interface for all domain failures.

### Subtasks:
- [ ] ERROR‑002.1: Define base DomainError class with code, message, and metadata structure using neverthrow Either. (AGENT) – `src/errors/domain-errors.ts`  
  **verification:** Base class compiles; Either type works correctly.
- [ ] ERROR‑002.2: Implement all Identity & Access error classes (8 errors). (AGENT)  
  **verification:** Unit tests for each error class pass.
- [ ] ERROR‑002.3: Implement all CRM error classes (9 errors). **Note:** Cross-reference error codes with integration test expectations - ensure all negative scenarios in feature files map to specific error codes. (AGENT)  
  **verification:** Unit tests pass; error codes match feature file expectations and integration test assertions.
- [ ] ERROR‑002.4: Implement Projects, Finance, Documents, Assets, Portal, Analytics error classes (25+ errors). (AGENT)  
  **verification:** All 40+ error classes implemented and tested.
- [ ] ERROR‑002.5: Create error factory functions for consistent error creation patterns. (AGENT)  
  **verification:** Factory functions return properly typed Either<Error, never>.
- **Depends on:** DEP-001 (neverthrow).  
- **Blocks:** All service implementations in Phase 3 and beyond.

---

## [ ] EVENT‑001: Domain Event Bus (In-Process)
**Status:** ⏳ Not Started  
**Current state:** No event system exists – domain events cannot be published or subscribed to for audit trails.  
**Definition of Done:** `artifacts/api-server/src/lib/events/event-bus.ts` exports lightweight in-process domain event system:
- `EventBus` class with `publish(event)` and `subscribe(eventType, handler)` methods
- `DomainEvent` base class with `id`, `type`, `timestamp`, `aggregateId`, `data` properties
- Event handlers run synchronously in-process (async subscribers can be added later)
- Built-in audit subscriber that writes to `audit_logs` table (when DB is ready)
- Type-safe event publishing using TypeScript generics

**Event Examples:**
- `LeadCreated`, `LeadStageChanged`
- `TaskCompleted`, `ProjectCompleted`
- `PaymentRecorded`, `InvoicePaid`
- `AppointmentRequested`, `AppointmentConfirmed`

**Anti-Patterns:** Using external message queues for MVP; tight coupling between publishers and subscribers; event handlers that throw exceptions.  
**Related Files:** `artifacts/api-server/src/lib/events/event-bus.ts`

**DDD:** Domain events capture significant state changes that other contexts may react to. The event bus implements the publish-subscribe pattern while keeping the system simple for MVP.  
**TDD:** Write unit tests for event publishing, subscription, and the audit subscriber.  
**BDD:** Enables cross-context scenarios like "When a lead is created, an audit entry is automatically logged".  
**Deep Module:** EventBus provides a simple interface while encapsulating handler management and error resilience.

### Subtasks:
- [ ] EVENT‑001.1: Define `DomainEvent` base class and `EventBus` implementation. (AGENT) – `src/lib/events/event-bus.ts`  
  **verification:** Unit tests for publish/subscribe pass.
- [ ] EVENT‑001.2: Create built-in audit subscriber (stubbed until DB ready). (AGENT)  
  **verification:** Audit subscriber logs events to console (placeholder for DB).
- [ ] EVENT‑001.3: Add event bus instance to app context for dependency injection. (AGENT) – `src/app.ts`  
  **verification:** Services can inject event bus via constructor.
- [ ] EVENT‑001.4: Write integration test showing event flow from service to audit subscriber. (AGENT)  
  **verification:** End-to-end event flow works.
- **Depends on:** ERROR‑002 (domain errors defined).
- **Blocks:** All service implementations that emit events (Phase 3+).

---

*End of Phase 1. Next: Phase 2 – Core Business Contexts: Database Schema*
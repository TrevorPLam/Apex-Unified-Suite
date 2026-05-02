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
- [ ] AUTH‑001.4: After codegen, run `pnpm typecheck` and inspect generated Zod files for Orval’s `_type` issue; fix if needed. (AGENT)  
  **verification:** No type‑related errors.

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
**Blocks:** AUTH‑007 (run to green)  
**Depends on:** AUTH‑001 (for generated types), DEP-001.4 (test script setup), DB‑IDENTITY‑005 (seeded admin user) – tests will remain red until DB‑IDENTITY‑005 is done in Phase 2.

---

### AUTH‑003: Implement Password Hashing Service
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api‑server/src/lib/crypto.ts` exports `hashPassword(plain)` and `verifyPassword(plain, hash)` using bcrypt.  
**Related Files:** `artifacts/api‑server/src/lib/crypto.ts`

**DDD:** Infrastructure service within Identity; domain doesn’t care about hashing details.  
**TDD:** Write unit tests for hash/verify round‑tripping before implementation.  
**BDD:** Indirectly tested via registration/login scenarios.  
**Deep Module:** Methods hide bcrypt complexity; consumers only see a simple verify interface.

**Subtasks:**
- [ ] AUTH‑003.1: Write unit test for hash/verify (round‑trip, wrong password). (AGENT)  
  **verification:** `pnpm vitest run crypto.test.ts` fails before implementation, passes after.
- [ ] AUTH‑003.2: Implement `hashPassword` and `verifyPassword`. (AGENT)  
  **verification:** Unit tests pass; `pnpm typecheck` clean.
- **Depends on:** DEP-001.3 (bcrypt dependency).

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
**Definition of Done:** `artifacts/api‑server/src/services/auth.ts` exposes `register`, `login`, `refresh`, `logout` methods that coordinate hashing, token generation, and persistence (stubbed until DB exists).  
- `register(email, password, fullName, organizationId)`: validate organization exists (via OrganizationRepository stubbed), hash password, create user with `organization_id`, return `Right<User>`.  
- `login(email, password, organizationId)`: find user by email AND organization, verify password, generate tokens, return `Right<{ accessToken, refreshToken, user }>`.  
- `refresh(token)`: verify, rotate, return new tokens.  
- `logout(token)`: invalidate refresh token (stubbed).  
- All methods return `Either<DomainError, Result>` using `neverthrow`.  
- Organization existence check is a stub that will be replaced in Phase 2 when OrganizationRepository is ready.  
**Related Files:** `artifacts/api‑server/src/services/auth.ts`
**Depends on:** DEP-001.1 (neverthrow dependency for Either pattern)

**DDD:** AuthService is the core of the Identity context. It enforces registration rules and ties users to organizations.  
**TDD:** Write unit tests mocking the (future) UserRepository and OrganizationRepository.  
**BDD:** The service fulfills `auth.feature` scenarios.  
**Deep Module:** The service interface is simple (4 methods) while hiding orchestration.  
**Depth refactor check:** After implementation, verify public methods ≤ 5, internal logic ≥150 lines (total), all errors returned as Either.

**Subtasks:**
- [ ] AUTH‑005.1: Write unit tests for service methods with mocked repositories. (AGENT)  
  **verification:** `pnpm vitest run auth.service.test.ts` red.
- [ ] AUTH‑005.2: Implement `register` and `login` with organization stub. (AGENT)  
  **verification:** Tests pass for these two methods.
- [ ] AUTH‑005.3: Implement `refresh` and `logout`. (AGENT)  
  **verification:** Full test suite green.
- [ ] AUTH‑005.4: Depth refactor check: ensure method count ≤ 5, logic ≥150 lines, no thrown errors. (AGENT)  
  **verification:** Count lines with `wc -l`, confirm no `throw` in service file, `pnpm typecheck` clean.

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

Now synthesizing all corrections for **Phase 1.5 – Cross‑Cutting API Concerns**. This phase inserts three new infrastructure tasks (TEST‑INFRA‑001, EMAIL‑SERVICE‑001, ARCH‑GUARD‑001) and expands domain error types for all bounded contexts.

Key changes applied:

- **TEST‑INFRA‑001**: Inserted at the beginning, even though its full verification depends on Phase 2 schemas. It prepares all test utilities, ready to be used once the database exists.
- **EMAIL‑SERVICE‑001**: Inserted next, defining the email interface and console implementation that portal magic links and appointment reminders will use.
- **ARCH‑GUARD‑001**: Inserted at the end to run automated architecture checks.
- **ERROR‑002** now includes error sets for Projects, Finance, Documents, Appointments, and Portal (already present in the original but reinforced).
- Every subtask ends with a concrete verification command.
- Explicit `depends_on` / `blocks` annotations added to all parent tasks.

---

# Phase 1.5 – Cross‑Cutting API Concerns

*This mini‑phase addresses gaps that affect every bounded context and were completely missing from the codebase:*

- **No test infrastructure** – integration tests cannot run without a dedicated test database and server harness.
- **No email abstraction** – magic links and reminders lack a send mechanism.
- **No global error handling middleware** – errors would crash or return inconsistent responses.
- **No domain error types** – business rule violations have no structured representation.
- **No architectural guardrails** – there is nothing to prevent accidental cross‑context coupling or missing soft‑deletes.

The tasks below establish the shared foundation that all subsequent phases (2–5) will use.

---

## [ ] TEST‑INFRA‑001: Set Up Test Environment  
**Status:** ⏳ Not Started  
**Current state:** No test database or test server harness exists. Integration tests from Phase 3 onward will require a repeatable testing environment.  
**Definition of Done:**  
- A separate test database is configured via `DATABASE_TEST_URL` (PostgreSQL, isolated from development/production).  
- A helper script `lib/db/src/test-utils/setupTestDB.ts` drops, recreates the schema, and seeds minimal data (using Drizzle Kit migrate + seed).  
- A test server utility `artifacts/api‑server/src/test-utils/test‑server.ts` starts the Express app on a random port and returns a `supertest` agent.  
- `beforeAll`/`afterAll` hooks for all integration test suites are provided in a shared `test-utils` package.  
**Out of Scope:** Seeding full production‑like data; only the minimal records required for each test suite.  
**Blocks:** All integration test tasks from Phase 3 onward (API‑CRM‑002, etc.)  
**Blocked By:** DEP-001.4 (test script setup), Phase 2 schema tasks (must wait for schema to exist), but the **utilities can be written now and validated once DB‑MIGRATE‑ALL completes.**  
**Related Files:** `lib/db/src/test-utils/`, `artifacts/api‑server/src/test-utils/`

**DDD:** Test infrastructure is not a domain concern, but it must respect bounded contexts—the seed data must create valid aggregates within the Identity, CRM, and other contexts.  
**TDD:** The setup script itself will be tested by running it and verifying that the smoke test (DB‑MIGRATE‑ALL.5) passes against the test database.  
**BDD:** N/A – infrastructure.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TEST‑INFRA‑001.1: Create `lib/db/src/test-utils/setupTestDB.ts` that reads `DATABASE_TEST_URL`, runs `drizzle‑kit migrate`, and optionally runs a lightweight seed. (AGENT)  
  **verification:** Running the script from the command line with a test database URL creates all tables (verify via smoke test or direct query).  
  **Note:** For Replit deployment, ensure DATABASE_TEST_URL environment variable is configured.
- [ ] TEST‑INFRA‑001.2: Create `artifacts/api‑server/src/test-utils/test‑server.ts` that starts the Express app on a dynamic port and returns a `supertest` instance. (AGENT)  
  **verification:** A simple test that calls `GET /api/healthz` against the test server returns 200.
- [ ] TEST‑INFRA‑001.3: Provide a shared `test-utils/index.ts` that re‑exports `setupTestDB`, `testServer`, and `beforeAll`/`afterAll` boilerplate. (AGENT)  
  **verification:** Imported by an integration test suite successfully.
- [ ] TEST‑INFRA‑001.4: (After Phase 2 DB‑MIGRATE‑ALL) Validate that the test environment works end‑to‑end: start test server, run a simple DB query, tear down. (HUMAN)  
  **verification:** Manual confirmation.
- **Depends on:** Phase 2 DB‑MIGRATE‑ALL (for schema existence).  
- **Blocks:** All Phase 3+ integration test tasks.

---

## [ ] EMAIL‑SERVICE‑001: Define Email Service Abstraction (Console Implementation)  
**Status:** ⏳ Not Started  
**Current state:** No email sending mechanism exists. Magic link emails and appointment reminders will need to be dispatched.  
**Definition of Done:**  
- `artifacts/api‑server/src/lib/email/email‑port.ts` exports an `EmailServicePort` interface with a single method: `send(to: string, subject: string, body: string): Promise<void>`.  
- `artifacts/api‑server/src/lib/email/console‑email‑service.ts` implements `EmailServicePort` by logging the email to the console (with a `[EMAIL]` prefix).  
- The `ConsoleEmailService` is the default implementation until a real provider (SendGrid, SES) is added later.  
- Magic‑link sending (PORTAL‑AUTH‑001.4) and appointment reminders will inject this service.  
**Out of Scope:** Real email delivery, HTML templates, attachment support.  
**Blocks:** PORTAL‑AUTH‑001, future notification features.  
**Blocked By:** None.  
**Related Files:** `artifacts/api‑server/src/lib/email/`

**DDD:** Email is an infrastructure service; the domain defines `EmailServicePort` as an interface that the application layer depends on.  
**TDD:** Write a unit test that verifies `ConsoleEmailService.send` logs the correct message without throwing.  
**BDD:** N/A – infrastructure.  
**Deep Module:** The interface hides the delivery mechanism; consumers only see `send(to, subject, body)`.

### Subtasks:
- [ ] EMAIL‑SERVICE‑001.1: Write the `EmailServicePort` interface. (AGENT) – `email‑port.ts`  
  **verification:** `pnpm typecheck` passes.
- [ ] EMAIL‑SERVICE‑001.2: Implement `ConsoleEmailService`. (AGENT) – `console‑email‑service.ts`  
  **verification:** Unit test confirms the method logs a line containing `[EMAIL]` and the recipient.
- [ ] EMAIL‑SERVICE‑001.3: Write unit test for `ConsoleEmailService`. (AGENT)  
  **verification:** `pnpm test -- email` passes.

---

## [ ] ERROR‑001: Implement Global Error Handling Middleware  
**Status:** ⏳ Not Started  
**Current state:** No error handling middleware exists. The `middlewares/` directory is empty. Express error handling is not centralized.  
**Blocks:** All API endpoint tasks  
**Blocked By:** none  
**Definition of Done:**  
- `artifacts/api‑server/src/middlewares/error‑handler.ts` exports an Express error‑handling middleware `errorHandler`.  
- All unhandled errors return a standardized JSON response: `{ success: false, message: string, statusCode: number, errors?: Array<{ field: string, message: string }> }`.  
- Async route errors are caught via a `catchAsync` wrapper utility.  
- The middleware is registered in `app.ts` after all routes.  
- Domain errors (from ERROR‑002) are mapped to their appropriate HTTP statuses; validation errors → 400; unknown errors → 500 (no stack traces in production).  
**Out of Scope:** Logging integration (Pino logging is already in place and will continue to work alongside the handler).  
**Related Files:** `artifacts/api‑server/src/middlewares/error‑handler.ts`, `artifacts/api‑server/src/app.ts`  
**Rules to Follow:**  
- Domain errors must use their `statusCode` property.  
- Validation errors must return 400 with field‑level details.  
- Stack traces must not be leaked in production (`NODE_ENV=production`).

**DDD:** Error handling is a cross‑cutting layer that preserves the ubiquitous language by converting `DomainError` codes into structured HTTP responses.  
**TDD:** Write tests for all error scenarios before implementation.  
**BDD:** Each negative BDD scenario will map to a specific error response (e.g., `InvalidStageTransition` → 400).  
**Deep Module:** The error handler is shallow; it maps known error types to HTTP codes.

### Subtasks:
- [ ] ERROR‑001.1: Implement `catchAsync` wrapper utility. (AGENT) – `artifacts/api‑server/src/lib/catch‑async.ts`  
  **verification:** Unit test confirms it forwards errors to `next`.
- [ ] ERROR‑001.2: Write tests for `errorHandler` middleware: domain error (404), validation error (400), unknown error (500). (AGENT)  
  **verification:** `pnpm vitest run error-handler.test.ts` red.
- [ ] ERROR‑001.3: Implement `errorHandler` middleware. (AGENT) – `error‑handler.ts`  
  **verification:** Tests pass.
- [ ] ERROR‑001.4: Register `errorHandler` in `app.ts` after all route middleware. (AGENT)  
  **verification:** `pnpm typecheck` clean; manual smoke test with a deliberate error.

---

## [ ] ERROR‑002: Define Domain Error Types for Each Bounded Context  
**Status:** ⏳ Not Started  
**Current state:** No domain error classes exist. Services that encounter business rule violations would need to throw generic errors, losing error semantics.  
**Blocks:** All service implementation tasks  
**Blocked By:** DEP-001.1 (neverthrow dependency for Either pattern)  
**Definition of Done:**  
- `lib/domain‑errors/src/base‑error.ts` exports an abstract `DomainError` class extending `Error` with `code: string`, `statusCode: number`, and `message: string`.  
- Per‑context error files exist for **Identity, CRM, Projects, Finance, Documents, Appointments, Portal**.  
- Service function signatures return `Either<DomainError, SuccessType>` (using `neverthrow`).  
- At least one service (auth) is refactored to use Either pattern as proof of concept.  
**Out of Scope:** Exhaustive error catalog for all contexts – each context will add errors as needed during its phase.  
**Related Files:** `lib/domain‑errors/src/`, `artifacts/api‑server/src/services/auth.ts`  
**Rules to Follow:**  
- All domain errors must extend the base `DomainError`.  
- Error codes use uppercase snake_case (e.g., `INVALID_STAGE_TRANSITION`).  
- Error messages use ubiquitous language from the glossary.  
- The Either pattern must be used consistently – no throwing domain errors.

**DDD:** Domain errors ARE part of the ubiquitous language. `LeadNotFound`, `InvalidStageTransition`, `DuplicateEmail` are domain concepts, not technical exceptions. The Either pattern makes error states explicit in function signatures.  
**TDD:**  
- Write unit tests for the base `DomainError` class (constructs correctly, inherits from Error).  
- Write tests for a sample domain error (e.g., `DuplicateEmail`) covering `code`, `statusCode`, `message`.  
- Write a service test that verifies the auth `register` function returns `Either`.  
**BDD:** Each negative BDD scenario maps directly to a domain error class (e.g., “When I try to move a lead directly to qualified” → `InvalidStageTransition`).  
**Deep Module:** The Either type makes the service interface explicitly deep – callers pattern‑match on `Left`/`Right`, eliminating hidden control flow.

### Subtasks:
- [ ] ERROR‑002.1: Create `lib/domain‑errors/` package with `package.json`, `tsconfig.json`. (AGENT)  
  **verification:** `pnpm typecheck` sees the new package.
- [ ] ERROR‑002.2: Implement abstract `DomainError` base class. (AGENT) – `base‑error.ts`  
  **verification:** Unit test for base class passes.
- [ ] ERROR‑002.3: Implement Identity context errors (`DuplicateEmail`, `InvalidCredentials`, `TokenExpired`, `Unauthorized`). (AGENT) – `identity.errors.ts`  
  **verification:** Unit tests for each error.
- [ ] ERROR‑002.4: Add `neverthrow` as a dependency. (AGENT)  
  **verification:** `pnpm install` succeeds; verify `neverthrow` exists in workspace catalog or add to catalog if missing.
- [ ] ERROR‑002.5: Refactor `AuthService.register` and `login` to return `Either<DomainError, Result>`. (AGENT) – `auth.ts`  
  **verification:** Unit tests for service now check `isLeft()` / `isRight()`.
- [ ] ERROR‑002.6: Implement CRM context errors (`LeadNotFound`, `InvalidStageTransition`, `DuplicateLead`, `ContactNotFound`). (AGENT) – `crm.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.7: Implement Projects context errors (`ProjectAlreadyCompleted`, `TaskHasUnfinishedSubtasks`, `MilestoneAlreadyCompleted`, `InvalidProjectStatusTransition`, `ProgressIsReadOnly`). (AGENT) – `projects.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.8: Implement Finance context errors (`InvoiceAlreadyPaid`, `PaymentExceedsBalance`, `InvoiceTypeViolation`, `CardFrozen`, `CardExpired`, `BudgetExceeded`, `BudgetThresholdReached`, `DuplicatePayment`). (AGENT) – `finance.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.9: Implement Documents context errors (`FolderNotFound`, `DuplicateDocumentVersion`, `StorageBackendUnavailable`). (AGENT) – `documents.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.10: Implement Appointments context errors (`TimeSlotNotAvailable`, `BookingRuleViolation`, `InvalidAppointmentStatusTransition`, `AppointmentNotFound`). (AGENT) – `appointments.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.11: Implement Portal context errors (`PortalAccessDenied`, `PortalNotEnabled`, `PortalSessionExpired`, `InvalidMagicLink`, `PortalClientNotFound`). (AGENT) – `portal.errors.ts`  
  **verification:** Unit tests.
- [ ] ERROR‑002.12: Run all domain error tests and ensure `pnpm typecheck` passes. (AGENT)  
  **verification:** `pnpm test -- domain‑errors` green, no type errors.

---

## [ ] ARCH‑GUARD‑001: Architectural Guardrails Scripts  
**Status:** ⏳ Not Started  
**Current state:** No automated checks enforce DDD boundaries, soft‑delete conventions, or Either usage.  
**Definition of Done:**  
- `scripts/check-domain-errors.sh`: Greps for `throw` inside service files (fails if any found, since services must return Either).  
- `scripts/check-soft-delete.sh`: Verifies that every business table in `lib/db/src/schema/` has a `deleted_at` column (except append‑only logs).  
- `scripts/check-jsonb-index.sh`: Verifies that all JSONB columns have a GIN index.  
- Optionally, `dependency‑cruiser` rules to prevent imports from one bounded context’s schema into another’s service.  
- All checks are runnable via a single `pnpm run guardrails` command.  
**Out of Scope:** Full static analysis tooling; ESLint rules will be expanded later.  
**Blocks:** None (validates existing code).  
**Blocked By:** None (can be written at any time, but should run after all Phase 4 implementation).  
**Related Files:** `scripts/check-*.sh`, `.dependency‑cruiser.js`

**DDD:** These guardrails enforce the architectural invariants: no cross‑context schema leakage, all service errors are explicit, and soft‑delete/CDM patterns are consistently applied.  
**TDD:** Each script is tested by intentionally violating the rule and verifying the script exits with a non‑zero code.  
**BDD:** N/A – tooling.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH‑GUARD‑001.1: Implement `scripts/check-domain-errors.sh`. (AGENT)  
  **verification:** Create a temporary service that throws an error; script fails.
- [ ] ARCH‑GUARD‑001.2: Implement `scripts/check-soft-delete.sh`. (AGENT)  
  **verification:** Temporarily remove `deleted_at` from a table; script fails.
- [ ] ARCH‑GUARD‑001.3: Implement `scripts/check-jsonb-index.sh`. (AGENT)  
  **verification:** Temporarily drop a JSONB index; script fails.
- [ ] ARCH‑GUARD‑001.4: Optionally, add basic `dependency‑cruiser` config. (AGENT)  
  **verification:** `pnpm run guardrails` includes check.
- [ ] ARCH‑GUARD‑001.5: Wire `pnpm run guardrails` in root `package.json`. (AGENT)  
  **verification:** `pnpm run guardrails` executes all checks.

---

*End of Phase 1. Next: Phase 2 – Core Business Contexts: Database Schema (including re‑ordered Identity tables after Organization table, multi‑tenancy columns on every table, booking rules, and signature requests tables).*
# TODO-P1-AUTH-API.md – Phase 1: Authentication API Layer

This document contains the API layer tasks including OpenAPI specification, integration testing, route implementation, and test execution. These tasks depend on error handling and service foundation.

---

## [ ] AUTH-001: Expand OpenAPI Spec for Authentication Endpoints
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
**TDD:** After codegen, we'll write failing integration tests (AUTH‑002) that verify the contract.  
**BDD:** These endpoints implement scenarios from `auth.feature` (register, login, refresh, logout).  
**Deep Module:** The spec defines the public interface; the underlying auth service is a deep module.

### Subtasks:
- [ ] AUTH-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-001.1: Add auth paths to OpenAPI spec with operation IDs, request/response schemas, and `organizationId` field in registration/login. (AGENT) – `lib/api-spec/openapi.yaml`  
  **verification:** `pnpm typecheck` passes after codegen; spec contains `/auth/register` with `organizationId`.
- [ ] AUTH-001.2: Add example request and response bodies for each endpoint. (AGENT)  
  **verification:** Generated client contains typed examples.
- [ ] AUTH-001.3: Run `pnpm codegen` to regenerate client and Zod schemas. (HUMAN)  
  **verification:** `pnpm typecheck` passes; generated files updated.
- [ ] AUTH-001.4: After codegen, run `pnpm typecheck` and check for Orval `_type` property issues. If found, restructure OpenAPI spec to move `allOf` before inline properties. (AGENT)  
  **verification:** `pnpm typecheck` passes; no orphan `_type` properties in generated files.

**Blocks:** AUTH‑002, AUTH‑006  
**Depends on:** DOMAIN‑001 (glossary), DOMAIN‑002 (context map) - *Note: Ensure these domain tasks are defined before Phase 1 execution*

---

## [ ] AUTH-002: Write Integration Tests for Auth Endpoints (TDD Red)
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

### Subtasks:
- [ ] AUTH-002.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-002.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-002.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-002.1: Write test cases for register, login, refresh, logout, and seeded admin login. (AGENT) – `artifacts/api-server/__tests__/api/auth.test.ts`  
  **verification:** `pnpm vitest run auth.test.ts` reports all tests failing (red).  
  **Note:** The seeded-admin test specifically stays red until Phase 2 (DB‑IDENTITY‑005) when the admin user is created in the database.  
**Blocks:** AUTH‑007 (run to green)  
**Depends on:** AUTH‑001 (for generated types), DEP-001.4 (test script setup), DB‑IDENTITY‑005 (seeded admin user) – tests will remain red until DB‑IDENTITY‑005 is done in Phase 2.

---

## [ ] AUTH-006: Create Auth Routes and Validation Middleware
**Status:** ⏳ Not Started  
**Definition of Done:** `routes/auth.ts` wires endpoints to `AuthService`, using a generic validation middleware with generated Zod schemas.  
**Related Files:** `artifacts/api‑server/src/routes/auth.ts`, `artifacts/api‑server/src/middlewares/validation.ts`

**DDD:** Routes are thin adapters that translate HTTP to domain service calls. No business logic.  
**TDD:** Write a test for the validation middleware before creating it.  
**BDD:** Routes satisfy the HTTP‑level behaviour of `auth.feature`.  
**Deep Module:** The route layer is intentionally shallow.

### Subtasks:
- [ ] AUTH-006.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-006.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-006.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-006.1: Create validation middleware factory – `validate(schema)` returns a middleware that parses `req.body` and returns 400 with field errors on failure. (AGENT) – `middlewares/validation.ts`  
  **verification:** Unit test for validation middleware.
- [ ] AUTH-006.2: Build route handlers for register/login/refresh/logout. (AGENT) – `routes/auth.ts`  
  **verification:** Route tests with supertest and mocked service pass.
- [ ] AUTH-006.3: Add auth router to main router. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` passes.

---

## [ ] AUTH-007: Run Integration Tests to Green
**Status:** ⏳ Not Started  
**Note:** **This task cannot complete until Phase 2** — when the identity database tables are created and seeded via DB‑IDENTITY‑005. Until then, the tests from AUTH‑002 remain red. The subtasks here assume the database is ready.  
**Definition of Done:** All tests from AUTH‑002 pass. Additional tests for edge cases (weak password, missing fields) are added and pass.  
**Related Files:** `artifacts/api-server/__tests__/api/auth.test.ts`

### Subtasks:
- [ ] AUTH-007.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-007.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-007.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-007.1: (After Phase 2 DB‑IDENTITY‑005) Run test suite, fix any issues. (AGENT)  
  **verification:** `pnpm test -- auth.test.ts` all green.
- [ ] AUTH-007.2: Add negative test cases (weak password, missing fields). (AGENT)  
  **verification:** Tests pass.
- **Depends on:** DB‑IDENTITY‑005 (Phase 2), AUTH‑006.

---

## Auth API Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-001 provides OpenAPI specification for generated types
- AUTH-002 provides test coverage for all auth endpoints
- AUTH-006 provides HTTP interface to auth services
- AUTH-007 validates end-to-end functionality (Phase 2)

**Dependencies:**
- ERROR-002 (domain errors for responses)
- AUTH-SERVICES (business logic)
- ERROR-001 (global error handling)

**Next Wave:** AUTH-MIDDLEWARE (depends on ERROR-001) and AUTH-FRONTEND (depends on AUTH-API)

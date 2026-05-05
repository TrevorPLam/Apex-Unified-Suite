# TODO-P1-AUTH-API.md – Phase 1: Authentication API Layer

This document contains the API layer tasks including OpenAPI specification, integration testing, route implementation, and test execution. These tasks depend on the error handling and service foundation.

---

## [ ] AUTH-001: Expand OpenAPI Spec for Authentication Endpoints
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** `lib/api-spec/openapi.yaml` contains only the `/healthz` GET endpoint. No auth endpoints, no auth schemas, no auth components are defined.
**Size:** Medium

**Description:** Add `/auth/register`, `/auth/login`, `/auth/refresh`, and `/auth/logout` paths to the OpenAPI spec with full request/response schemas and examples, establishing the type-safe API contract for the entire auth system.

**Depends on:** DOMAIN-001 (glossary), DOMAIN-002 (context map) — ensure domain tasks are defined before Phase 1 execution
**Blocks:** AUTH-002 (integration test types depend on generated schemas), AUTH-006 (route validation uses generated Zod schemas)
**Related Files:** `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: [N/A] — YAML spec file, no code imports
- Exports: OpenAPI path definitions consumed by Orval codegen to produce React Query hooks (`lib/api-client-react`) and Zod schemas (`lib/api-zod`)

**Definition of Done**
- [ ] `lib/api-spec/openapi.yaml` includes all 4 auth paths: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] `POST /auth/register`: body `{ email, password, fullName, organizationId (UUID) }`, response 201 with user object (password hash excluded)
- [ ] `POST /auth/login`: body `{ email, password, organizationId }`, response 200 `{ accessToken, refreshToken, user }`
- [ ] `POST /auth/refresh`: body `{ refreshToken }`, response 200 `{ accessToken, refreshToken }`
- [ ] `POST /auth/logout`: body `{ refreshToken? }`, response 204
- [ ] All responses use the standard envelope `{ success: boolean, data?: T, error?: { code, message } }`
- [ ] Each operation has a unique `operationId` and a non-empty `summary`
- [ ] At least one `example` per operation (request and response)
- [ ] After codegen: `pnpm typecheck` passes with no `_type` orphan properties in generated files
- [ ] Generated files in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` are updated

**Out of Scope**
- OAuth2 / OIDC flows (future phase)
- Password reset, email verification, or MFA endpoints
- Any frontend or backend code changes (spec only)
- Modifying generated files directly

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never run `pnpm codegen` without AGENT alerting HUMAN first (AGENTS.md: codegen is a human-run step)

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated artifacts (run by HUMAN): `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Tests added/updated in: [N/A] — types verified via typecheck after codegen
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `openapi.yaml` to previous state; re-run codegen to restore generated files
- Halt condition: if `pnpm typecheck` produces `_type` orphan property errors after codegen, restructure OpenAPI `allOf` before proceeding

**Rules to Follow**
- `organizationId` must be typed as `format: uuid` in all request schemas — multi-tenancy ADR (ARCH-001)
- Password field must be `format: password` and must NEVER appear in any response schema
- All responses must use the standard envelope schema — no bare response objects
- `operationId` values must be camelCase and globally unique (Orval uses them as hook names)
- When using `allOf` with inline properties, place `allOf` before inline properties to avoid Orval `_type` generation bug

**Verification**
```bash
# Run by HUMAN after AGENT completes spec:
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
# Check generated files contain no _type properties
```

**Advanced Code Patterns**
- OpenAPI 3.1 `$ref` components for reusable schemas (`UserResponse`, `AuthTokensResponse`, `ErrorEnvelope`) to avoid duplication and ensure consistent types across all future endpoints
- Orval `allOf` ordering: place `allOf: [{ $ref: ... }]` before any inline `properties` to prevent the `_type` orphan generation bug
- Response envelope pattern: a single `ApiResponse<T>` wrapper schema avoids inconsistent response shapes across routes

**Anti-Patterns**
- Defining password fields in response schemas (security risk — even if empty/null, the field should not exist)
- Using inline schemas instead of `$ref` components (creates duplicate, divergent types in generated code)
- Missing `operationId` (Orval generates unpredictable hook names)
- Overly broad schemas (e.g., `additionalProperties: true`) that undermine type safety

**DDD / TDD / BDD / Deep Module notes**
- DDD: Auth endpoints belong to the Identity & Access bounded context. The `organizationId` on register and login reflects multi-tenant architecture (ARCH-001).
- TDD: After codegen, write failing integration tests (AUTH-002) that exercise the contract defined here.
- BDD: These endpoints implement scenarios from `auth.feature` (register, login, refresh, logout).
- Deep Module: The spec defines the public interface only. The underlying auth service is a deep module hidden behind the route layer.

---

### Subtasks

- [ ] AUTH-001.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-001.0.5 (AGENT): Research OpenAPI 3.1 best practices for auth endpoint schemas, Orval codegen known issues (allOf ordering), and standard API envelope patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-001.0.75 (AGENT): Reason about the task — particularly the Orval `_type` issue, multi-tenant `organizationId` requirement, and the decision between HS256 and RS256 in the spec security scheme.
  *If uncertain about security scheme definition, ask the user before executing.*

- [ ] AUTH-001.1 (AGENT): Add auth paths to `openapi.yaml` with operation IDs, request/response schemas, `organizationId` field, and standard envelope.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** YAML is valid (no parse errors); spec contains all 4 auth paths with `organizationId` on register/login

- [ ] AUTH-001.2 (AGENT): Add example request and response bodies for each endpoint.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** Each operation has at least one `example` in spec

- [ ] AUTH-001.3 (HUMAN): Run `pnpm --filter @workspace/api-spec run codegen` to regenerate client and Zod schemas.
  **File(s):** `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
  **Verification:** `pnpm typecheck` passes; generated files updated

- [ ] AUTH-001.4 (AGENT): After codegen, run `pnpm typecheck` and check for Orval `_type` property issues. If found, restructure `allOf` ordering in spec and re-run codegen.
  **File(s):** `lib/api-spec/openapi.yaml`
  **Verification:** `pnpm typecheck` passes; no `_type` orphan properties in generated files

- [ ] AUTH-001.N (HUMAN): Final review and sign-off on spec completeness.
  **Verification:** Approved.

---

## [ ] AUTH-002: Write Integration Tests for Auth Endpoints (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `__tests__/` directory exists under `artifacts/api-server/`. No integration tests exist anywhere in the project.
**Size:** Medium

**Description:** Write comprehensive integration tests for all 4 auth endpoints that are intentionally failing (red) — establishing the TDD contract that AUTH-006 and AUTH-007 must satisfy.

**Depends on:** AUTH-001 (generated types for request/response shapes), DEP-001.4 (test script and vitest setup), DB-IDENTITY-005 (seeded admin user — tests remain red until Phase 2)
**Blocks:** AUTH-007 (run to green)
**Related Files:** `artifacts/api-server/__tests__/api/auth.test.ts`

**Imports / Exports**
- Imports: `supertest`, `app` from `src/app.ts`, generated Zod schemas from `@workspace/api-zod`
- Exports: [N/A] — test file only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/auth.test.ts` exists
- [ ] Test: `POST /auth/register` with valid organization → 201, user object returned (no password hash)
- [ ] Test: `POST /auth/register` with duplicate email → 409 `DuplicateEmail`
- [ ] Test: `POST /auth/login` with valid credentials → 200, `{ accessToken, refreshToken, user }` present
- [ ] Test: `POST /auth/login` with invalid password → 401 `InvalidCredentials`
- [ ] Test: `POST /auth/refresh` with valid refresh token → 200, new token pair returned
- [ ] Test: `POST /auth/refresh` with expired/invalid token → 401 `TokenExpired`
- [ ] Test: Seeded admin login — `POST /auth/login` with `email: admin@apex.local` returns 200 (stays red until DB-IDENTITY-005 in Phase 2)
- [ ] Test: Unauthorized access to a protected route → 401
- [ ] `pnpm vitest run auth.test.ts` reports all tests **failing** (red) before routes are implemented — this is the expected state
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Making tests pass (that is AUTH-007's job)
- E2E browser testing
- Performance/load testing
- Tests for non-auth endpoints

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, real passwords, or real tokens in test fixtures

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/auth.test.ts` (new file)
- Code changes in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `__tests__/api/auth.test.ts`
- Halt condition: if tests cannot be made to run (even in red state) due to missing test infrastructure, block on DEP-001.4 first

**Rules to Follow**
- Tests must use supertest to make HTTP requests — no direct service calls
- Test fixtures (test emails, passwords) must be clearly fake and not reusable outside tests
- The seeded admin test must be marked with a comment: `// NOTE: Stays red until DB-IDENTITY-005 (Phase 2) seeds the admin user`
- Response shape assertions must validate against the standard envelope `{ success, data, error? }` — not ad-hoc field checks
- Tests must exercise error responses (409, 401) not just happy paths

**Verification**
```bash
pnpm --filter @workspace/api-server vitest run __tests__/api/auth.test.ts
# Expected: all tests FAILING (red) — this is correct at this stage
pnpm --filter @workspace/api-server run typecheck
```

**Advanced Code Patterns**
- Supertest with a shared app instance — import `app` from `src/app.ts` to avoid port binding
- Test data factories (simple inline functions) for generating valid register/login payloads — keeps tests DRY
- Response envelope validation helper: `expectEnvelope(res, 200)` asserts `success: true` and `data` present

**Anti-Patterns**
- Calling service methods directly instead of making HTTP requests (bypasses middleware, route validation)
- Hardcoding real emails or passwords that could be reused in production
- Skipping negative test cases (tests must verify 401, 409, etc. — not just 200)
- Writing tests that pass immediately (red phase means they should all fail until routes are implemented)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify that Identity domain rules (unique email per org, organization binding) are enforced at the HTTP boundary.
- TDD: These tests are intentionally red. They drive the implementation of AUTH-006 and AUTH-007.
- BDD: These tests are the executable counterpart of `auth.feature` scenarios.
- Deep Module: Tests exercise only the public HTTP API, preserving encapsulation of routes and services.

---

### Subtasks

- [ ] AUTH-002.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-002.0.5 (AGENT): Research supertest best practices with Express 5, vitest setup for integration tests, and TDD red-phase patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-002.0.75 (AGENT): Reason about the task — confirm DEP-001.4 (test infrastructure) is available; confirm `app.ts` can be imported without starting a server.
  *If test infrastructure is absent, block on DEP-001.4 before executing.*

- [ ] AUTH-002.1 (AGENT): Write all test cases for register, login, refresh, logout, seeded admin login, and unauthorized access.
  **File(s):** `artifacts/api-server/__tests__/api/auth.test.ts`
  **Verification:** `pnpm vitest run auth.test.ts` reports all tests failing (red); `pnpm typecheck` passes

- [ ] AUTH-002.N (HUMAN): Final review of test coverage and scenarios.
  **Verification:** Approved.

---

## [ ] AUTH-006: Create Auth Routes and Validation Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `artifacts/api-server/src/routes/` contains only `health.ts` and `index.ts`. No auth routes exist. `middlewares/` directory is empty (`.gitkeep` only). No Zod validation middleware exists.
**Size:** Medium

**Description:** Implement a generic Zod-based validation middleware factory and the four auth route handlers that delegate to `AuthService`, wiring the HTTP layer to the domain service.

**Depends on:** ERROR-001 (global error handler for consistent 4xx/5xx responses), AUTH-005 (AuthService provides business logic), AUTH-001 (generated Zod schemas for request validation)
**Blocks:** AUTH-007 (integration tests turn green when routes exist)
**Related Files:** `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/middlewares/validation.ts`, `artifacts/api-server/src/routes/index.ts`

**Imports / Exports**
- Imports: `AuthService` from `services/auth.ts`; generated Zod schemas from `@workspace/api-zod`; `Request`, `Response`, `Router` from `express`
- Exports: `authRouter` (Express Router); `validate` middleware factory from `middlewares/validation.ts`

**Definition of Done**
- [ ] `artifacts/api-server/src/middlewares/validation.ts` exports `validate(schema: ZodSchema)` middleware factory
- [ ] `validate` parses `req.body` against provided schema; returns 400 with field-level errors on failure
- [ ] `artifacts/api-server/src/routes/auth.ts` implements handlers for `POST /auth/register`, `/login`, `/refresh`, `/logout`
- [ ] All route handlers call `AuthService` methods and translate `Result<T, DomainError>` to HTTP responses via `next(err)` for errors
- [ ] Route handlers contain zero business logic — all logic lives in `AuthService`
- [ ] `authRouter` is mounted in `routes/index.ts` under `/auth`
- [ ] Unit tests for validation middleware pass (valid body → next(), invalid body → 400)
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Auth middleware for protecting routes (belongs in AUTH-008)
- Rate limiting or brute-force protection
- Refresh token rotation storage (stubbed in AuthService until Phase 2)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never place business logic (password hashing, token generation) in route handlers

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/middlewares/validation.ts` (new file)
- Code changes in: `artifacts/api-server/src/routes/auth.ts` (new file)
- Code changes in: `artifacts/api-server/src/routes/index.ts` (mount authRouter)
- Tests added/updated in: `artifacts/api-server/__tests__/middlewares/validation.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `routes/auth.ts`, `middlewares/validation.ts`; revert `routes/index.ts` mount
- Halt condition: if `pnpm typecheck` fails after mounting, revert `routes/index.ts` first

**Rules to Follow**
- Route handlers must never contain domain logic — they are thin adapters between HTTP and `AuthService`
- `validate` middleware must return Zod field-level error details in the 400 response body (`{ success: false, error: { code: 'GEN_VALIDATION_ERROR', details: ZodIssue[] } }`)
- All `AuthService` errors must be forwarded via `next(err)` — never handled inline in routes
- Routes must use generated Zod schemas from `@workspace/api-zod` for validation — not hand-written schemas

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- validation.test.ts
# After AUTH-007 DB setup: pnpm --filter @workspace/api-server test -- auth.test.ts
```

**Advanced Code Patterns**
- `validate(schema)` factory pattern: returns a `RequestHandler` that calls `schema.safeParse(req.body)` and either calls `next()` or returns a 400 response — avoids repetitive validation in every route
- Express 5 async route handlers: no need for try/catch; thrown errors (including from `next(err)`) are forwarded to the error handler automatically

**Anti-Patterns**
- Putting domain logic (password hashing, token generation, business rules) in route handlers
- Catching `AuthService` errors in routes and formatting responses inline (bypasses global error handler)
- Writing validation schemas by hand when generated schemas are available from codegen
- Mounting routes without registering the error handler first (ERROR-001 must be in place)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are thin adapters that translate HTTP to domain service calls. No business logic.
- TDD: Write unit test for `validate` middleware before implementation (valid/invalid body). Route tests use mocked AuthService.
- BDD: Routes satisfy the HTTP-level behavior of `auth.feature` scenarios.
- Deep Module: The route layer is intentionally shallow — it delegates entirely to the deep `AuthService`.

---

### Subtasks

- [ ] AUTH-006.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-006.0.5 (AGENT): Research Express 5 routing patterns, Zod safeParse middleware patterns, and the generated schema shape from Orval (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-006.0.75 (AGENT): Reason about the task — confirm generated Zod schemas are available from AUTH-001 codegen and that ERROR-001 is in place before proceeding.
  *If ERROR-001 or codegen output is absent, block before executing.*

- [ ] AUTH-006.1 (AGENT): Create `validate(schema)` middleware factory that parses `req.body` and returns 400 with Zod field errors on failure.
  **File(s):** `artifacts/api-server/src/middlewares/validation.ts`
  **Verification:** Unit tests for validation middleware pass (valid body → next(), invalid body → 400 with field details)

- [ ] AUTH-006.2 (AGENT): Build route handlers for register, login, refresh, logout delegating to AuthService.
  **File(s):** `artifacts/api-server/src/routes/auth.ts`
  **Verification:** Route tests with supertest and mocked AuthService pass; no business logic in handlers

- [ ] AUTH-006.3 (AGENT): Mount `authRouter` in main router.
  **File(s):** `artifacts/api-server/src/routes/index.ts`
  **Verification:** `pnpm typecheck` passes; `/api/auth/*` routes are accessible

- [ ] AUTH-006.N (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] AUTH-007: Run Integration Tests to Green
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** AUTH-002 tests are written but all failing (red). Cannot fully complete until Phase 2 when DB-IDENTITY-005 seeds the admin user and identity tables.
**Size:** Medium

**Description:** After the database is ready (Phase 2), run the AUTH-002 integration test suite to green — fixing any failures and adding edge-case tests for weak passwords and missing fields.

**Depends on:** AUTH-006 (routes implemented), DB-IDENTITY-005 (Phase 2 — identity tables created and admin user seeded)
**Blocks:** AUTH-012 (E2E test) is the final validation gate
**Related Files:** `artifacts/api-server/__tests__/api/auth.test.ts`

**Imports / Exports**
- Imports: [N/A] — existing test file
- Exports: [N/A]

**Definition of Done**
- [ ] All AUTH-002 tests pass (green)
- [ ] Additional edge-case tests pass: weak password (< 8 chars) → 400, missing required fields → 400
- [ ] Seeded admin login test (`admin@apex.local`) passes (requires DB-IDENTITY-005)
- [ ] `pnpm test -- auth.test.ts` reports zero failures
- [ ] `pnpm typecheck` passes

**Out of Scope**
- E2E browser testing (AUTH-012)
- Performance testing
- Tests for non-auth endpoints

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, real passwords or tokens in test data

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/auth.test.ts`
- Code changes in: `artifacts/api-server/src/` (fixes as needed)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert individual fix commits if a fix breaks other tests
- Halt condition: if more than 3 consecutive fix attempts fail on the same test, escalate to HUMAN before continuing

**Rules to Follow**
- Fix failures by correcting implementation — never relax test assertions to make tests pass artificially
- All new edge-case tests must follow the same supertest/envelope pattern as existing tests
- The seeded admin test must use `admin@apex.local` — this is the canonical seed credential

**Verification**
```bash
pnpm --filter @workspace/api-server test -- auth.test.ts
# Expected: all tests PASSING (green)
pnpm --filter @workspace/api-server run typecheck
```

**Advanced Code Patterns**
- [N/A]

**Anti-Patterns**
- Weakening test assertions (changing `expect(status).toBe(401)` to `expect(status).toBeLessThan(500)`) to force a pass
- Skipping the seeded admin test instead of waiting for DB-IDENTITY-005

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: This is the "green" phase of the TDD cycle initiated by AUTH-002.
- BDD: Full auth.feature scenario suite is validated by this task.
- Deep Module: [N/A]

---

### Subtasks

- [ ] AUTH-007.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-007.0.5 (AGENT): Research any breaking changes in vitest or supertest since AUTH-002 was written (as of May 2026). Confirm DB-IDENTITY-005 is complete.
  *Document findings briefly or note "no changes."*

- [ ] AUTH-007.0.75 (AGENT): Reason about each failing test and identify the root cause before making any fixes.
  *If a test failure points to an architectural issue rather than an implementation bug, ask the user.*

- [ ] AUTH-007.1 (AGENT): After Phase 2 DB-IDENTITY-005 is complete, run test suite and fix any implementation issues.
  **File(s):** `artifacts/api-server/src/` (fixes as needed)
  **Verification:** `pnpm test -- auth.test.ts` all green

- [ ] AUTH-007.2 (AGENT): Add edge-case tests for weak password and missing required fields.
  **File(s):** `artifacts/api-server/__tests__/api/auth.test.ts`
  **Verification:** New tests pass; all existing tests still green

- [ ] AUTH-007.N (HUMAN): Final review — confirm all tests green and no assertion weakening.
  **Verification:** Approved.

---

## Auth API Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-001 provides OpenAPI specification and generated types
- AUTH-002 provides failing test coverage defining the contract
- AUTH-006 provides the HTTP interface to auth services
- AUTH-007 validates end-to-end functionality (completes in Phase 2)

**Dependencies:**
- ERROR-001 (global error handler)
- ERROR-002 (domain errors)
- AUTH-SERVICES wave (AUTH-003, AUTH-004, AUTH-005)

**Next Wave:** AUTH-MIDDLEWARE (depends on ERROR-001) and AUTH-FRONTEND (depends on AUTH-API)

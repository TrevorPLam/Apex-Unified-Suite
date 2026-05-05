# tasks/infrastructure/AUTH.md – Authentication, Authorization & Identity

This file contains all tasks related to the Identity & Access bounded context: core authentication services, error handling, middleware, API routes, frontend auth UI, and the identity database schema. These tasks establish the security foundation for the entire application.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Core Authentication Services

### [ ] AUTH‑003: Implement Password Hashing Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `lib/crypto.ts` exists. No password hashing infrastructure is in place. The `argon2` package is not yet installed in `artifacts/api‑server`.
**Size:** Small

**Description:** Create a cryptographic utility module that exposes `hashPassword` and `verifyPassword` using argon2id — the current OWASP‑recommended password hashing algorithm (as of May 2026).

**Depends on:** `foundation/TOOLING.md → DEP‑001.3`
**Blocks:** `infrastructure/AUTH.md → AUTH‑005`
**Related Files:** `artifacts/api‑server/src/lib/crypto.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/lib/crypto.ts` exists and compiles
- [ ] `hashPassword` returns an argon2id hash string
- [ ] `verifyPassword` returns `true` for correct plain/hash pair, `false` for incorrect — never throws
- [ ] Hash parameters use argon2id with OWASP‑recommended defaults: memoryCost ≥ 19456 (19 MiB), timeCost ≥ 2, parallelism 1
- [ ] Unit tests cover: hash/verify round‑trip (correct password), incorrect password returns false, empty string handling
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Password strength validation (belongs in route validation middleware or service layer)
- Password reset or change workflows
- Pepper/HMAC wrapping (may be added in a future hardening pass)
- Any database interaction

**Rules to Follow**
- Must use argon2id variant (not argon2i or argon2d)
- Hash comparison must be timing‑attack resistant — use the argon2 library’s built‑in `verify()` which is constant‑time
- Plain‑text passwords must NEVER be logged, stored in variables beyond the immediate call, or serialized
- Hash parameters (memoryCost, timeCost, parallelism) must be sourced from environment config or named constants — never hardcoded magic numbers
- Function must never throw; internal errors should be caught and rethrown as `DomainError` (`DatabaseError`) if needed by callers

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- crypto.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Infrastructure service within the Identity context. The domain service (AuthService) calls `hashPassword`/`verifyPassword` without knowing implementation details.
- TDD: Write unit tests for hash/verify round‑trip before implementation. Tests must include: correct password returns true, wrong password returns false, hash output differs on each call (salt uniqueness).
- BDD: Indirectly validated through registration and login BDD scenarios in `auth.feature`.
- Deep Module: The `crypto.ts` module hides all argon2id complexity. Callers only see a simple two‑function interface.

---

### Subtasks
- [ ] AUTH‑003.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑003.0.5 (AGENT): Research argon2id parameter recommendations (OWASP May 2026), timing attack prevention, and argon2 npm package API. *Document findings briefly.*
- [ ] AUTH‑003.0.75 (AGENT): Reason about the task — confirm DEP‑001.3 is available and that argon2 package is installed before writing code. *If argon2 is absent, flag to user before executing.*
- [ ] AUTH‑003.1 (AGENT): Write unit tests for hash/verify round‑trip, incorrect password, and salt uniqueness.
  **File(s):** `artifacts/api‑server/__tests__/lib/crypto.test.ts`
  **Verification:** `pnpm vitest run crypto.test.ts` fails (red) before implementation
- [ ] AUTH‑003.2 (AGENT): Implement `hashPassword` and `verifyPassword` using argon2id with OWASP‑compliant parameters.
  **File(s):** `artifacts/api‑server/src/lib/crypto.ts`
  **Verification:** All unit tests pass (green); `pnpm typecheck` clean
- [ ] AUTH‑003.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTH‑004: Implement JWT Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `lib/jwt.ts` exists. The `jsonwebtoken` package is not installed in `artifacts/api‑server`. The `setAuthTokenGetter` function in `lib/api‑client‑react/src/custom‑fetch.ts` is ready but not yet called.
**Size:** Small

**Description:** Create a JWT utility module that generates short‑lived access tokens and longer‑lived refresh tokens, and verifies tokens — enforcing algorithm, expiry, and issuer claims.

**Depends on:** `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `infrastructure/AUTH.md → AUTH‑005`, `AUTH‑008`
**Related Files:** `artifacts/api‑server/src/lib/jwt.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/lib/jwt.ts` exists and compiles
- [ ] `generateAccessToken` produces a signed JWT with `sub`, `email`, `organizationId`, `iat`, `exp` claims
- [ ] `generateRefreshToken` produces a signed JWT with `sub`, `iat`, `exp` — longer expiry than access token
- [ ] `verifyToken` returns `Result<UserPayload, DomainError>` — returns `err(TokenExpired)` for expired tokens, `err(InvalidCredentials)` for malformed/invalid tokens; never throws
- [ ] Algorithm is explicitly specified (HS256 with strong secret, or RS256 with key pair) — `none` algorithm is never accepted
- [ ] Access token expiry ≤ 15 minutes (configurable via `JWT_ACCESS_EXPIRY` env var)
- [ ] Refresh token expiry ≤ 7 days (configurable via `JWT_REFRESH_EXPIRY` env var)
- [ ] Unit tests cover: valid token generation and verification, expired token returns `TokenExpired` error, tampered token returns error, `none` algorithm is rejected
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Refresh token storage or rotation (belongs in AUTH‑005 via `TokenRefreshPort`)
- Token blacklisting/denylist (belongs in a future token revocation task)
- Key pair generation scripts (document as a setup step, not automated here)
- Frontend token storage strategy

**Rules to Follow**
- Explicitly specify the allowed algorithm(s) when calling `jwt.verify()` — never allow the library to infer algorithm from the token header (OWASP: “none algorithm” attack prevention)
- `JWT_SECRET` must be at least 64 characters of cryptographically random data (OWASP JWT Cheat Sheet)
- Access tokens must expire in ≤ 15 minutes (OWASP recommendation for short‑lived tokens)
- `verifyToken` must never throw — always return `Result<UserPayload, DomainError>` (neverthrow)
- Token payload must include `organizationId` to support multi‑tenant routing in middleware
- Startup must fail fast (process exit) if `JWT_SECRET` env var is missing or too short

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- jwt.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: JWT tokens represent an authenticated session boundary. The token service is an infrastructure concern; it does not belong in the domain model.
- TDD: Write unit tests for token generation (correct payload claims), verification (accepts valid, rejects expired/tampered/none‑alg), before implementation.
- BDD: Tokens appear in `auth.feature` as the response payload of successful login and as the credential for protected routes.
- Deep Module: The JWT service hides encoding, signing, verification, and error mapping. Consumers only call three functions.

---

### Subtasks
- [ ] AUTH‑004.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑004.0.5 (AGENT): Research OWASP JWT best practices (none‑algorithm attack, weak secret attack, token sidejacking), jsonwebtoken package API, and RS256 vs HS256 tradeoffs (as of May 2026). *Document findings briefly.*
- [ ] AUTH‑004.0.75 (AGENT): Reason about the task — particularly secret strength requirements, algorithm allowlist, and the fail‑fast startup guard pattern. *If uncertain about RS256 vs HS256 choice for this project, ask the user before executing.*
- [ ] AUTH‑004.1 (AGENT): Write unit tests for token generation, valid verification, expired token error, tampered token error, and none‑algorithm rejection.
  **File(s):** `artifacts/api‑server/__tests__/lib/jwt.test.ts`
  **Verification:** `pnpm test -- jwt.test.ts` fails (red) before implementation
- [ ] AUTH‑004.2 (AGENT): Implement `generateAccessToken`, `generateRefreshToken`, `verifyToken` with explicit algorithm, fail‑fast secret guard, and neverthrow return types.
  **File(s):** `artifacts/api‑server/src/lib/jwt.ts`
  **Verification:** All unit tests pass; `pnpm typecheck` clean
- [ ] AUTH‑004.N (HUMAN): Final review and sign‑off — confirm algorithm choice and secret length requirements. **Verification:** Approved.

---

### [ ] AUTH‑005: Implement Auth Service (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `services/` directory exists under `artifacts/api‑server/src/`. No auth business logic exists. All four auth operations (register, login, refresh, logout) are unimplemented.
**Size:** Large

**Description:** Implement the core `AuthService` deep module that orchestrates password hashing, JWT generation, and persistence (stubbed via port interfaces) for register, login, refresh, and logout operations — all returning `Either<DomainError, Result>` via neverthrow.

**Depends on:** `infrastructure/AUTH.md → AUTH‑003`, `AUTH‑004`, `ERROR‑002`, `foundation/TOOLING.md → DEP‑001.1`
**Blocks:** `infrastructure/AUTH.md → AUTH‑006`
**Related Files:** `artifacts/api‑server/src/services/auth.ts`, `artifacts/api‑server/src/lib/auth/token‑refresh‑port.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/lib/auth/token‑refresh‑port.ts` defines `TokenRefreshPort` interface with `storeRefreshToken`, `getRefreshToken`, `invalidateRefreshToken`, `invalidateAllUserTokens`
- [ ] `artifacts/api‑server/src/services/auth.ts` implements `register`, `login`, `refresh`, `logout`
- [ ] `register(email, password, fullName, organizationId)`: validates organization exists (via `OrganizationRepository` stub), hashes password, creates user, returns `Right<User>` or appropriate domain error
- [ ] `login(email, password, organizationId)`: finds user by email AND organizationId, verifies password, generates tokens, returns `Right<{ accessToken, refreshToken, user }>` or `InvalidCredentials`
- [ ] `refresh(token)`: verifies token, rotates via `TokenRefreshPort`, returns new token pair or `TokenExpired`
- [ ] `logout(token)`: invalidates refresh token via `TokenRefreshPort`, returns `Right<void>`
- [ ] All methods return `Result<T, DomainError>` — no method ever throws
- [ ] Unit tests use mocked repositories and pass for all happy paths and key error paths
- [ ] `pnpm typecheck` passes
- [ ] Depth refactor check passed: route handlers contain zero domain logic; service exposes ≤ 5 public methods; no `throw` statements in service file

**Out of Scope**
- Real database persistence (stubbed via port interfaces until Phase 2)
- Password reset or email verification flows
- Multi‑factor authentication
- Session management beyond JWT

**Rules to Follow**
- All auth operations must never throw — always return `Result<T, DomainError>` (neverthrow Either pattern)
- Login must look up user by BOTH email AND `organizationId` to enforce multi‑tenant isolation (ARCH‑001)
- `login` must return the same generic error (`InvalidCredentials`) whether the user is not found OR the password is wrong — prevents user enumeration (OWASP Auth Cheat Sheet)
- All service methods must be auditable: log the operation (not the sensitive data) at `info` level via Pino
- Organization existence check is a stub that returns `Right<void>` unconditionally until Phase 2 — this is intentional and must be documented with a `TODO(Phase 2)` comment
- Service exposes ≤ 5 public methods (register, login, refresh, logout, and optionally one helper)

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- auth.service.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `AuthService` is the core application service of the Identity & Access bounded context.
- TDD: Write unit tests mocking `TokenRefreshPort`, `OrganizationRepository`, `UserRepository` (stubbed) before implementation.
- BDD: The service fulfills all scenarios in `auth.feature` — register, login (valid/invalid), refresh, logout.
- Deep Module: The service interface is intentionally simple (≤ 5 public methods) while hiding orchestration of hashing, JWT, repository, and error mapping.

---

### Subtasks
- [ ] AUTH‑005.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑005.0.5 (AGENT): Research hexagonal architecture port patterns, neverthrow composition, multi‑tenant auth patterns, and OWASP user enumeration prevention. *Document findings briefly.*
- [ ] AUTH‑005.0.75 (AGENT): Reason about the task — particularly the stub strategy for `OrganizationRepository`, the `TokenRefreshPort` interface, and the intentional same‑error‑for‑user‑not‑found‑and‑wrong‑password pattern. *If uncertain about interface shapes, ask the user before executing.*
- [ ] AUTH‑005.1 (AGENT): Write unit tests for all 4 service methods with mocked repositories.
  **File(s):** `artifacts/api‑server/__tests__/services/auth.service.test.ts`
  **Verification:** `pnpm vitest run auth.service.test.ts` fails (red) before implementation
- [ ] AUTH‑005.2 (AGENT): Define `TokenRefreshPort` interface and implement `register` and `login` with organization stub.
  **File(s):** `artifacts/api‑server/src/lib/auth/token‑refresh‑port.ts`, `artifacts/api‑server/src/services/auth.ts`
  **Verification:** Tests for `register` and `login` pass; `pnpm typecheck` clean
- [ ] AUTH‑005.3 (AGENT): Implement `refresh` and `logout` with stub `TokenRefreshPort` behavior.
  **File(s):** `artifacts/api‑server/src/services/auth.ts`
  **Verification:** `refresh` returns a deterministic token pair in tests; `logout` returns `ok(undefined)`
- [ ] AUTH‑005.4 (AGENT): Depth refactor check — verify route handlers contain no domain logic; service hides all complexity behind ≤ 5 public methods; no `throw` statement in service file.
  **File(s):** `artifacts/api‑server/src/services/auth.ts`
  **Verification:** Manual inspection confirms no `throw` in service; all methods return `Result`; `pnpm typecheck` clean
- [ ] AUTH‑005.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Error Handling Foundation

### [ ] ERROR‑002: Define Domain Error Types
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `errors/` directory exists under `artifacts/api‑server/src/`. No domain error types are defined. All errors are currently untyped and inconsistent.
**Size:** Large

**Description:** Define and export a typed, exhaustive domain error catalog (40+ classes) covering all bounded contexts, using the `neverthrow` Either pattern as the project‑wide error contract.

**Depends on:** `foundation/TOOLING.md → DEP‑001`
**Blocks:** `infrastructure/AUTH.md → AUTH‑003`, `AUTH‑004`, `AUTH‑005`, `AUTH‑006`, `AUTH‑008`, and all Phase 3+ service implementations
**Related Files:** `artifacts/api‑server/src/errors/domain‑errors.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/errors/domain‑errors.ts` exists and compiles without errors
- [ ] `DomainError` base class exposes `code: string`, `message: string`, and optional `metadata?: Record<string, unknown>`
- [ ] All 8 Identity & Access error classes implemented: `InvalidCredentials`, `TokenExpired`, `DuplicateEmail`, `UserNotFound`, `InvalidOrganization`, `InsufficientPermissions`, `RoleNotFound`, `PermissionDenied`
- [ ] All 9 CRM error classes implemented: `InvalidStageTransition`, `LeadNotFound`, `DuplicateLead`, `ContactNotFound`, `CompanyNotFound`, `DuplicateDomain`, `DealNotFound`, `InvalidProbability`, `ActivityNotFound`
- [ ] All Projects error classes implemented: `ProjectNotFound`, `TaskNotFound`, `TaskHasUnfinishedSubtasks`, `MilestoneAlreadyCompleted`, `ProgressIsReadOnly`, `InvalidStatusTransition`
- [ ] All Finance error classes implemented: `InvoiceNotFound`, `InvoiceTypeViolation`, `PaymentExceedsBalance`, `BudgetExceeded`, `BudgetThresholdReached`, `DuplicatePayment`, `VirtualCardNotFound`, `InsufficientLimit`
- [ ] All Document error classes implemented: `DocumentNotFound`, `SignatureRequestNotFound`, `DocumentAlreadySigned`, `StorageAdapterError`, `InvalidDocumentType`
- [ ] All Asset error classes implemented: `AssetNotFound`, `AssetNotAvailable`, `CheckoutNotAllowed`, `MaintenanceRequired`, `DepreciationError`
- [ ] All Portal error classes implemented: `MagicLinkInvalid`, `MagicLinkExpired`, `PortalAccessDenied`, `SessionNotFound`
- [ ] Analytics & Settings errors: `ReportNotFound`, `InvalidDateRange`, `ConfigurationError`
- [ ] Generic errors: `ValidationError`, `DatabaseError`, `NetworkError`, `TimeoutError`
- [ ] Extended catalog (ERROR‑002.6) includes Appointments, advanced Finance/Documents/CRM/Projects errors
- [ ] Error factory functions exist and return properly typed `Err<DomainError, never>`
- [ ] Unit tests exist for every error class verifying code, message, and metadata shape
- [ ] `pnpm typecheck` passes

**Out of Scope**
- HTTP status code mapping (belongs in ERROR‑001)
- Sentry/monitoring integration (belongs in ERROR‑001)
- Any database migrations or schema changes
- Auth token storage or validation logic

**Rules to Follow**
- All domain errors must extend the base `DomainError` class
- Error `code` values must be unique across all bounded contexts; use context prefix convention: `AUTH_`, `CRM_`, `PROJ_`, `FIN_`, `DOC_`, `ASSET_`, `PORTAL_`, `ANALYTICS_`, `GEN_`
- Error messages must be user‑friendly and actionable; never expose internal implementation details or DB error text
- Auth‑related error messages must be deliberately generic to prevent user enumeration: e.g., `InvalidCredentials` message must read “Invalid email or password” — not “User not found” vs “Wrong password”
- All errors must return `Err<DomainError, never>` via neverthrow — never throw exceptions
- Error metadata must include debugging context but must NEVER include credentials, tokens, or PII

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- domain‑errors.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain errors express business rule violations in ubiquitous language. Each bounded context owns its error namespace.
- TDD: Write unit tests for each error class before marking the task complete.
- BDD: Error types map directly to negative BDD scenarios.
- Deep Module: The error module is shallow in interface but provides a deep, typed contract for all domain failures across the entire backend.

---

### Subtasks
- [ ] ERROR‑002.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] ERROR‑002.0.5 (AGENT): Research latest best practices for domain error modeling with neverthrow, OWASP error handling (as of May 2026). *Document findings briefly.*
- [ ] ERROR‑002.0.75 (AGENT): Reason about the task — particularly error code uniqueness constraints, prefix conventions, and the extended catalog scope. *If uncertain about any error’s bounded context ownership, ask the user before executing.*
- [ ] ERROR‑002.1 (AGENT): Define base `DomainError` class with `code`, `message`, and optional `metadata`; set up `Err<DomainError, never>` return type using neverthrow.
  **File(s):** `artifacts/api‑server/src/errors/domain‑errors.ts`
  **Verification:** Base class compiles; `Err<DomainError, never>` type resolves correctly via `pnpm typecheck`
- [ ] ERROR‑002.2 (AGENT): Implement all 8 Identity & Access error classes with deliberately generic auth messages.
  **Verification:** Unit tests for each Identity error pass; error codes use `AUTH_` prefix; `InvalidCredentials.message` is generic
- [ ] ERROR‑002.3 (AGENT): Implement all 9 CRM error classes. Cross‑reference codes with any feature file negative scenarios.
  **Verification:** Unit tests pass; codes use `CRM_` prefix; codes match feature file expectations
- [ ] ERROR‑002.4 (AGENT): Implement Projects, Finance, Documents, Assets, Portal, Analytics & Settings, and Generic error classes (25+ errors).
  **Verification:** All 40+ error classes implemented and tested; `pnpm typecheck` passes
- [ ] ERROR‑002.5 (AGENT): Create error factory functions for consistent call‑site usage.
  **Verification:** Factory functions return `Err<DomainError, never>`; consumers never need to call `new DomainError()` directly
- [ ] ERROR‑002.6 (AGENT): Extend catalog with error types for expanded BDD feature files.
  **Verification:** Unit tests exist for all new error classes; entire catalog compiles; cross‑reference shows every negative BDD scenario has a matching error; `pnpm typecheck` passes
- [ ] ERROR‑002.N (HUMAN): Final review and sign‑off on error catalog completeness and naming conventions. **Verification:** Approved.

---

### [ ] ERROR‑001: Global Express Error Handling Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No global error handler exists in `artifacts/api‑server/src/`. `app.ts` mounts the main router but has no error‑handling middleware. Unhandled errors propagate as Express default 500 responses with no structured envelope.
**Size:** Medium

**Description:** Implement an Express 5 error‑handling middleware that maps all `DomainError` instances to appropriate HTTP status codes and a standard response envelope, and registers it as the final middleware in `app.ts`.

**Depends on:** `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `infrastructure/AUTH.md → AUTH‑006`, `AUTH‑008`, all future route implementations
**Related Files:** `artifacts/api‑server/src/middlewares/error‑handler.ts`, `artifacts/api‑server/src/app.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/error‑handler.ts` exists and compiles
- [ ] Middleware catches all errors (sync and async) propagated via `next(err)` from Express routes
- [ ] `DomainError` instances map to correct HTTP status codes per mapping table
- [ ] All responses follow the envelope: `{ success: false, error: { code, message, details? } }`
- [ ] Unknown/unexpected errors return `500` with a generic message — no stack trace in response body
- [ ] All errors are logged at `error` level with Pino, including `requestId` (from `req.id`) and `userId` when available on `req.user`
- [ ] `errorHandler` is registered as the **last** middleware in `app.ts`
- [ ] Sentry integration fires when `SENTRY_DSN` env var is set; is a no‑op otherwise
- [ ] Unit tests cover each HTTP status mapping scenario
- [ ] `pnpm typecheck` passes

**Error Mapping (DomainError code → HTTP status)**
- `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED` → 401
- `AUTH_INSUFFICIENT_PERMISSIONS`, `AUTH_PERMISSION_DENIED` → 403
- `AUTH_USER_NOT_FOUND`, `CRM_LEAD_NOT_FOUND`, etc. → 404
- `AUTH_DUPLICATE_EMAIL`, `CRM_DUPLICATE_LEAD` → 409
- `GEN_VALIDATION_ERROR` → 400
- `GEN_DATABASE_ERROR`, etc. → 500
- Unknown (non‑DomainError) → 500

**Out of Scope**
- Defining error classes (belongs in ERROR‑002)
- Route‑level try/catch or per‑route error handling
- CSRF protection or rate limiting
- Frontend error display

**Rules to Follow**
- Error handler must be declared with exactly 4 parameters `(err, req, res, next)` — Express 5 requires this signature to identify it as an error‑handling middleware
- Sensitive information must never appear in response bodies
- All errors must be logged at `error` level with structured Pino format including `requestId` for distributed tracing
- Error response envelope must be consistent across ALL routes — no ad‑hoc error shapes in route handlers
- `errorHandler` must be the last `app.use()` call in `app.ts`

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- error‑handler.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The error handler is an infrastructure adapter — it translates domain language (`DomainError` codes) into HTTP protocol with zero business logic.
- TDD: Write tests for each `DomainError` → HTTP status mapping before implementing.
- BDD: Ensures all negative scenarios in feature files return the specified HTTP responses.
- Deep Module: Single exported function (`errorHandler`) hides all mapping complexity. Route handlers only call `next(err)`.

---

### Subtasks
- [ ] ERROR‑001.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] ERROR‑001.0.5 (AGENT): Research Express 5 error handling changes vs Express 4, Pino structured logging with correlation IDs, and Sentry Node.js SDK integration (as of May 2026). *Document findings briefly.*
- [ ] ERROR‑001.0.75 (AGENT): Reason about the task — particularly the Express 5 4‑parameter signature requirement and the DomainError code prefix convention from ERROR‑002. *If uncertain, ask the user before executing.*
- [ ] ERROR‑001.1 (AGENT): Create error handler middleware with DomainError → HTTP status mapping and standard response envelope.
  **File(s):** `artifacts/api‑server/src/middlewares/error‑handler.ts`
  **Verification:** Unit tests for all DomainError code → HTTP status mappings pass; no sensitive data in response body
- [ ] ERROR‑001.2 (AGENT): Add structured Pino logging with `requestId` and user context correlation.
  **File(s):** `artifacts/api‑server/src/middlewares/error‑handler.ts`
  **Verification:** Error logs include `requestId` and optional `userId`; verified via test log output inspection
- [ ] ERROR‑001.3 (AGENT): Register `errorHandler` as the last middleware in Express app.
  **File(s):** `artifacts/api‑server/src/app.ts`
  **Verification:** All routes propagate errors through global handler; existing health‑check test still passes; `pnpm typecheck` clean
- [ ] ERROR‑001.4 (AGENT): Add optional Sentry integration guarded by `SENTRY_DSN` env var.
  **File(s):** `artifacts/api‑server/src/middlewares/error‑handler.ts`
  **Verification:** No crash when `SENTRY_DSN` is absent; errors captured when DSN is set
- [ ] ERROR‑001.N (HUMAN): Final review and sign‑off — confirm error envelope format and HTTP status mappings. **Verification:** Approved.

---

## Authentication Middleware

### [ ] AUTH‑008: Implement Auth Middleware for Protected Routes
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `middlewares/auth.ts` exists. The `middlewares/` directory is empty (`.gitkeep` only). All routes are currently unprotected.
**Size:** Small

**Description:** Implement an Express middleware that extracts and verifies the JWT Bearer token from the `Authorization` header, populates `req.user` with the verified payload, and returns a standardized 401 response for unauthenticated requests.

**Depends on:** `infrastructure/AUTH.md → AUTH‑004`, `ERROR‑001`, `ERROR‑002`
**Blocks:** All protected route implementations in Phase 2 and beyond; `AUTH‑007`
**Related Files:** `artifacts/api‑server/src/middlewares/auth.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/auth.ts` exists and compiles
- [ ] `requireAuth` extracts the Bearer token from the `Authorization: Bearer <token>` header
- [ ] Missing or malformed `Authorization` header → 401 response via `next(err)` with `InvalidCredentials` domain error
- [ ] Valid token → `req.user` populated with `{ sub, email, organizationId }` and `next()` called
- [ ] Expired token → 401 with `TokenExpired` domain error forwarded via `next(err)`
- [ ] Tampered/invalid token → 401 with `InvalidCredentials` domain error forwarded via `next(err)`
- [ ] `req.user` type is declared via TypeScript module augmentation (`Express.Request`)
- [ ] Unit tests cover: valid token → next(), missing header → 401, expired token → 401 TokenExpired, invalid token → 401
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Role‑based access control (RBAC) — belongs in a future authorization middleware
- API key authentication
- OAuth2 / OIDC token validation
- Refresh token handling (belongs in the `/auth/refresh` route)

**Rules to Follow**
- The middleware must NEVER attempt to extract tokens from query strings, cookies, or request body — Bearer header only
- Token extraction must handle edge cases: missing header, header without “Bearer ” prefix, empty token string after prefix
- `req.user` must be typed via TypeScript module augmentation, not `(req as any).user`
- Errors must be forwarded via `next(err)` — never via `res.json()` inline
- The middleware must not cache or store tokens — it is stateless
- `organizationId` from the token payload must be available on `req.user` for downstream multi‑tenant authorization

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- auth.middleware.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The middleware enforces the authenticated user boundary for all downstream bounded contexts.
- TDD: Write tests first: valid token → 200 (with a dummy protected route), missing header → 401, expired token → 401 `TokenExpired`.
- BDD: “As a user, I can access my profile only when authenticated.”
- Deep Module: Downstream route handlers only see `req.user` — they never interact with JWT directly.

---

### Subtasks
- [ ] AUTH‑008.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑008.0.5 (AGENT): Research Express 5 middleware patterns, TypeScript module augmentation for `req.user`, OWASP token extraction best practices (as of May 2026). *Document findings briefly.*
- [ ] AUTH‑008.0.75 (AGENT): Reason about the task — confirm AUTH‑004 (`verifyToken`) is available and that the `UserPayload` type shape is finalized before writing the module augmentation. *If `UserPayload` type is not yet defined, define it in `lib/jwt.ts` first.*
- [ ] AUTH‑008.1 (AGENT): Write unit/integration tests for middleware using supertest with a dummy protected route.
  **File(s):** `artifacts/api‑server/__tests__/middlewares/auth.middleware.test.ts`
  **Verification:** `pnpm test -- auth.middleware.test.ts` fails (red) before implementation
- [ ] AUTH‑008.2 (AGENT): Implement `requireAuth` middleware with Bearer extraction, `verifyToken` call, `req.user` population, and TypeScript module augmentation.
  **File(s):** `artifacts/api‑server/src/middlewares/auth.ts`
  **Verification:** All middleware tests pass (green); `pnpm typecheck` clean
- [ ] AUTH‑008.N (HUMAN): Final review and sign‑off — confirm no token logging and that `req.user` is fully typed. **Verification:** Approved.

---

### [ ] AUTH‑008‑ADMIN: Admin Authentication Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No admin‑specific middleware exists. Admin endpoints are planned for Phase 4 settings and audit tasks, but there is no mechanism to restrict routes to admin users only.
**Size:** Small

**Description:** Implement an `adminAuthMiddleware` that wraps `requirePermission('admin', '*', '*')` or performs a direct role check against the user’s organization role. This middleware is applied to all admin‑only routes (settings, audit logs, user management).

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`, `infrastructure/RBAC.md → RBAC‑001`
**Blocks:** All admin‑only endpoints in `infrastructure/SETTINGS‑AUDIT.md`, `infrastructure/DATABASE.md`, and domain admin features
**Related Files:** `artifacts/api‑server/src/middlewares/admin-auth.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/admin-auth.ts` exports `adminAuthMiddleware`
- [ ] Middleware checks that `req.user.role` includes `admin` (or the equivalent permission)
- [ ] Returns `403 InsufficientPermissions` if the user is not an admin
- [ ] Works with the existing `requireAuth` middleware (must be applied after)
- [ ] Unit tests cover: admin user → next(), non‑admin user → 403, unauthenticated user → 401
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Must be applied after `requireAuth` to ensure `req.user` is populated
- Admin role name must be configurable or fetched from the database; no hardcoded `'admin'` string if the role system supports custom naming

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- admin-auth.middleware.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Enforces the admin role boundary at the infrastructure layer.
- TDD: Write tests for each role scenario before implementation.
- BDD: “As an admin, I can access settings; as a regular user, I am denied.”
- Deep Module: Thin wrapper around the existing RBAC permission check.

---

### Subtasks
- [ ] AUTH‑008‑ADMIN.1 (AGENT): Implement `adminAuthMiddleware` with role check. **File(s):** `artifacts/api‑server/src/middlewares/admin-auth.ts` **Verification:** Unit tests pass.
- [ ] AUTH‑008‑ADMIN.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTH‑009‑API‑KEY: API Key Authentication Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No API key authentication exists. External integrations and the BI analytics API planned in Phase 8 require a non‑JWT authentication mechanism.
**Size:** Small

**Description:** Implement an API key authentication middleware that validates the `X‑API‑Key` header against hashed API keys stored in the database. The middleware populates `req.user` with the identity associated with the API key.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001` (organizations table), `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑001` (API‑key management), `infrastructure/EVENT‑BUS.md → EVENT‑SUBSCRIBE‑*` (external integrations)
**Related Files:** `artifacts/api‑server/src/middlewares/api-key-auth.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/api-key-auth.ts` exports `apiKeyAuthMiddleware`
- [ ] Extracts the `X‑API‑Key` header; returns 401 if missing or malformed
- [ ] Validates the key against hashed keys stored in `api_keys` table
- [ ] Populates `req.user` with the associated organization and permissions scope
- [ ] Supports scoped API keys (read‑only, specific contexts)
- [ ] Unit tests cover: valid key → next(), invalid key → 401, missing header → 401
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- API keys must be stored hashed (SHA‑256) in the database; never store plaintext
- Middleware must track last‑used timestamp per key for audit purposes
- Rate limiting specific to API keys should be applied separately (see `SEC‑001`)

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- api-key-auth.middleware.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Infrastructure adapter for non‑user authentication. API keys belong to the Identity bounded context.
- TDD: Write tests for key validation, scoping, and error cases.
- BDD: “As an external system, I can authenticate using an API key to access the analytics export.”
- Deep Module: Hides key hashing, lookup, and scope enforcement behind the standard middleware interface.

---

### Subtasks
- [ ] AUTH‑009‑API‑KEY.1 (AGENT): Implement `apiKeyAuthMiddleware`. **File(s):** `artifacts/api‑server/src/middlewares/api-key-auth.ts` **Verification:** Unit tests pass.
- [ ] AUTH‑009‑API‑KEY.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTH‑REQUEST‑ID: Request ID Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `req.id` is referenced by the logging and error handling infrastructure but is never set. No middleware generates or propagates a request ID.
**Size:** Small

**Description:** Implement a middleware that sets `req.id` from the `X‑Request‑ID` header (if present) or generates a new UUID, and attaches it to every request. This enables distributed tracing across log entries.

**Depends on:** [N/A]
**Blocks:** `infrastructure/AUTH.md → ERROR‑001` (logging relies on `req.id`)
**Related Files:** `artifacts/api‑server/src/middlewares/request-id.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/request-id.ts` exports `requestIdMiddleware`
- [ ] Reads `X‑Request‑ID` header; if absent, generates a UUID via `crypto.randomUUID()`
- [ ] Sets `req.id` for downstream handlers and logging
- [ ] Registered early in the Express middleware stack (before logging and auth)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- request-id.test.ts
# Manual: make a request and verify `requestId` appears in log output
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – pure infrastructure.
- TDD: Test that `req.id` is set on every request.
- BDD: [N/A]
- Deep Module: [N/A] – thin middleware.

---

### Subtasks
- [ ] AUTH‑REQUEST‑ID.1 (AGENT): Implement `requestIdMiddleware`. **File(s):** `artifacts/api‑server/src/middlewares/request-id.ts` **Verification:** `req.id` populated; `pnpm typecheck` clean.
- [ ] AUTH‑REQUEST‑ID.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Auth API Layer

### [ ] AUTH‑001: Expand OpenAPI Spec for Authentication Endpoints
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** `lib/api‑spec/openapi.yaml` contains only the `/healthz` GET endpoint. No auth endpoints, no auth schemas, no auth components are defined.
**Size:** Medium

**Description:** Add `/auth/register`, `/auth/login`, `/auth/refresh`, and `/auth/logout` paths to the OpenAPI spec with full request/response schemas and examples, establishing the type‑safe API contract for the entire auth system.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑001`, `DOMAIN‑002`
**Blocks:** `infrastructure/AUTH.md → AUTH‑002`, `AUTH‑006`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `lib/api‑spec/openapi.yaml` includes all 4 auth paths with `organizationId` on register/login
- [ ] All responses use the standard envelope `{ success: boolean, data?: T, error?: { code, message } }`
- [ ] Each operation has a unique `operationId` and a non‑empty `summary`
- [ ] At least one `example` per operation (request and response)
- [ ] After codegen: `pnpm typecheck` passes with no `_type` orphan properties in generated files
- [ ] Generated files in `lib/api‑client‑react/src/generated/` and `lib/api‑zod/src/generated/` are updated

**Out of Scope**
- OAuth2 / OIDC flows
- Password reset, email verification, or MFA endpoints
- Any frontend or backend code changes (spec only)

**Rules to Follow**
- Password field must be `format: password` and must NEVER appear in any response schema
- When using `allOf` with inline properties, place `allOf` before inline properties to avoid Orval `_type` generation bug

**Verification**
```bash
# Run by HUMAN after AGENT completes spec:
pnpm --filter @workspace/api‑spec run codegen
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Auth endpoints belong to the Identity & Access bounded context.
- TDD: After codegen, write failing integration tests (AUTH‑002) that exercise the contract defined here.
- BDD: These endpoints implement scenarios from `auth.feature`.
- Deep Module: The spec defines the public interface only.

---

### Subtasks
- [ ] AUTH‑001.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑001.0.5 (AGENT): Research OpenAPI 3.1 best practices for auth endpoint schemas, Orval codegen known issues (allOf ordering), and standard API envelope patterns. *Document findings briefly.*
- [ ] AUTH‑001.0.75 (AGENT): Reason about the task — particularly the Orval `_type` issue, multi‑tenant `organizationId` requirement, and the security scheme definition. *If uncertain, ask the user before executing.*
- [ ] AUTH‑001.1 (AGENT): Add auth paths to `openapi.yaml` with operation IDs, request/response schemas, `organizationId` field, and standard envelope.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** YAML is valid; spec contains all 4 auth paths with `organizationId` on register/login
- [ ] AUTH‑001.2 (AGENT): Add example request and response bodies for each endpoint.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** Each operation has at least one `example` in spec
- [ ] AUTH‑001.3 (HUMAN): Run `pnpm --filter @workspace/api‑spec run codegen` to regenerate client and Zod schemas.
  **File(s):** `lib/api‑client‑react/src/generated/`, `lib/api‑zod/src/generated/`
  **Verification:** `pnpm typecheck` passes; generated files updated
- [ ] AUTH‑001.4 (AGENT): After codegen, run `pnpm typecheck` and check for Orval `_type` property issues. If found, restructure `allOf` ordering in spec and re‑run codegen.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm typecheck` passes; no `_type` orphan properties in generated files
- [ ] AUTH‑001.N (HUMAN): Final review and sign‑off on spec completeness. **Verification:** Approved.

---

### [ ] AUTH‑002: Write Integration Tests for Auth Endpoints (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `__tests__/` directory exists under `artifacts/api‑server/`. No integration tests exist anywhere in the project.
**Size:** Medium

**Description:** Write comprehensive integration tests for all 4 auth endpoints that are intentionally failing (red) — establishing the TDD contract that AUTH‑006 and AUTH‑007 must satisfy.

**Depends on:** `infrastructure/AUTH.md → AUTH‑001`, `foundation/TOOLING.md → DEP‑001.4`, `infrastructure/DATABASE.md → DB‑IDENTITY‑005`
**Blocks:** `infrastructure/AUTH.md → AUTH‑007`
**Related Files:** `artifacts/api‑server/__tests__/api/auth.test.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/__tests__/api/auth.test.ts` exists
- [ ] Test: `POST /auth/register` with valid organization → 201
- [ ] Test: `POST /auth/register` with duplicate email → 409 `DuplicateEmail`
- [ ] Test: `POST /auth/login` with valid credentials → 200
- [ ] Test: `POST /auth/login` with invalid password → 401 `InvalidCredentials`
- [ ] Test: `POST /auth/refresh` with valid refresh token → 200
- [ ] Test: `POST /auth/refresh` with expired/invalid token → 401 `TokenExpired`
- [ ] Test: Seeded admin login — stays red until DB‑IDENTITY‑005 in Phase 2
- [ ] Test: Unauthorized access to a protected route → 401
- [ ] `pnpm vitest run auth.test.ts` reports all tests **failing** (red) — this is the expected state
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Making tests pass (that is AUTH‑007’s job)
- E2E browser testing
- Performance/load testing

**Rules to Follow**
- Tests must use supertest to make HTTP requests — no direct service calls
- Test fixtures (test emails, passwords) must be clearly fake and not reusable outside tests
- The seeded admin test must be marked with a comment: `// NOTE: Stays red until DB‑IDENTITY‑005 (Phase 2) seeds the admin user`
- Response shape assertions must validate against the standard envelope — not ad‑hoc field checks
- Tests must exercise error responses (409, 401) not just happy paths

**Verification**
```bash
pnpm --filter @workspace/api‑server vitest run __tests__/api/auth.test.ts
# Expected: all tests FAILING (red) — this is correct at this stage
pnpm --filter @workspace/api‑server run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify Identity domain rules at the HTTP boundary.
- TDD: Intentionally red. Drive implementation of AUTH‑006 and AUTH‑007.
- BDD: Executable counterpart of `auth.feature` scenarios.
- Deep Module: Tests exercise only the public HTTP API.

---

### Subtasks
- [ ] AUTH‑002.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑002.0.5 (AGENT): Research supertest best practices with Express 5, vitest setup for integration tests, and TDD red‑phase patterns. *Document findings briefly.*
- [ ] AUTH‑002.0.75 (AGENT): Reason about the task — confirm DEP‑001.4 (test infrastructure) is available; confirm `app.ts` can be imported without starting a server. *If test infrastructure is absent, block on DEP‑001.4 before executing.*
- [ ] AUTH‑002.1 (AGENT): Write all test cases for register, login, refresh, logout, seeded admin login, and unauthorized access.
  **File(s):** `artifacts/api‑server/__tests__/api/auth.test.ts`
  **Verification:** `pnpm vitest run auth.test.ts` reports all tests failing (red); `pnpm typecheck` passes
- [ ] AUTH‑002.N (HUMAN): Final review of test coverage and scenarios. **Verification:** Approved.

---

### [ ] AUTH‑006: Create Auth Routes and Validation Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `artifacts/api‑server/src/routes/` contains only `health.ts` and `index.ts`. No auth routes exist. `middlewares/` directory is empty. No Zod validation middleware exists.
**Size:** Medium

**Description:** Implement a generic Zod‑based validation middleware factory and the four auth route handlers that delegate to `AuthService`, wiring the HTTP layer to the domain service.

**Depends on:** `infrastructure/AUTH.md → ERROR‑001`, `AUTH‑005`, `AUTH‑001`
**Blocks:** `infrastructure/AUTH.md → AUTH‑007`
**Related Files:** `artifacts/api‑server/src/routes/auth.ts`, `artifacts/api‑server/src/middlewares/validation.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/middlewares/validation.ts` exports `validate(schema: ZodSchema)` middleware factory
- [ ] `validate` parses `req.body` against provided schema; returns 400 with field‑level errors on failure
- [ ] `artifacts/api‑server/src/routes/auth.ts` implements handlers for all 4 auth endpoints
- [ ] All route handlers call `AuthService` methods and translate `Result<T, DomainError>` to HTTP responses via `next(err)` for errors
- [ ] Route handlers contain zero business logic — all logic lives in `AuthService`
- [ ] `authRouter` is mounted in `routes/index.ts` under `/auth`
- [ ] Unit tests for validation middleware pass (valid body → next(), invalid body → 400)
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Auth middleware for protecting routes (belongs in AUTH‑008)
- Rate limiting or brute‑force protection
- Refresh token rotation storage (stubbed in AuthService until Phase 2)

**Rules to Follow**
- Route handlers must never contain domain logic — they are thin adapters between HTTP and `AuthService`
- `validate` middleware must return Zod field‑level error details in the 400 response body
- All `AuthService` errors must be forwarded via `next(err)` — never handled inline in routes
- Routes must use generated Zod schemas from `@workspace/api‑zod` for validation — not hand‑written schemas

**Verification**
```bash
pnpm --filter @workspace/api‑server run typecheck
pnpm --filter @workspace/api‑server test -- validation.test.ts
# After AUTH‑007 DB setup: pnpm --filter @workspace/api‑server test -- auth.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are thin adapters that translate HTTP to domain service calls.
- TDD: Write unit test for `validate` middleware before implementation. Route tests use mocked AuthService.
- BDD: Routes satisfy the HTTP‑level behavior of `auth.feature` scenarios.
- Deep Module: The route layer is intentionally shallow.

---

### Subtasks
- [ ] AUTH‑006.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑006.0.5 (AGENT): Research Express 5 routing patterns, Zod safeParse middleware patterns, and the generated schema shape from Orval. *Document findings briefly.*
- [ ] AUTH‑006.0.75 (AGENT): Reason about the task — confirm generated Zod schemas are available from AUTH‑001 codegen and that ERROR‑001 is in place before proceeding. *If ERROR‑001 or codegen output is absent, block before executing.*
- [ ] AUTH‑006.1 (AGENT): Create `validate(schema)` middleware factory.
  **File(s):** `artifacts/api‑server/src/middlewares/validation.ts`
  **Verification:** Unit tests pass (valid body → next(), invalid body → 400 with field details)
- [ ] AUTH‑006.2 (AGENT): Build route handlers for register, login, refresh, logout delegating to AuthService.
  **File(s):** `artifacts/api‑server/src/routes/auth.ts`
  **Verification:** Route tests with supertest and mocked AuthService pass; no business logic in handlers
- [ ] AUTH‑006.3 (AGENT): Mount `authRouter` in main router.
  **File(s):** `artifacts/api‑server/src/routes/index.ts`
  **Verification:** `pnpm typecheck` passes; `/api/auth/*` routes are accessible
- [ ] AUTH‑006.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] AUTH‑007: Run Integration Tests to Green
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** AUTH‑002 tests are written but all failing (red). Cannot fully complete until Phase 2 when DB‑IDENTITY‑005 seeds the admin user and identity tables.
**Size:** Medium

**Description:** After the database is ready (Phase 2), run the AUTH‑002 integration test suite to green — fixing any failures and adding edge‑case tests for weak passwords and missing fields.

**Depends on:** `infrastructure/AUTH.md → AUTH‑006`, `infrastructure/DATABASE.md → DB‑IDENTITY‑005`
**Blocks:** `infrastructure/AUTH.md → AUTH‑012`
**Related Files:** `artifacts/api‑server/__tests__/api/auth.test.ts`

**Definition of Done**
- [ ] All AUTH‑002 tests pass (green)
- [ ] Additional edge‑case tests pass: weak password (< 8 chars) → 400, missing required fields → 400
- [ ] Seeded admin login test (`admin@apex.local`) passes
- [ ] `pnpm test -- auth.test.ts` reports zero failures
- [ ] `pnpm typecheck` passes

**Out of Scope**
- E2E browser testing (AUTH‑012)
- Performance testing

**Rules to Follow**
- Fix failures by correcting implementation — never relax test assertions to make tests pass artificially
- All new edge‑case tests must follow the same supertest/envelope pattern as existing tests

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- auth.test.ts
# Expected: all tests PASSING (green)
pnpm --filter @workspace/api‑server run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: Green phase of the TDD cycle initiated by AUTH‑002.
- BDD: Full `auth.feature` scenario suite validated.
- Deep Module: [N/A]

---

### Subtasks
- [ ] AUTH‑007.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑007.0.5 (AGENT): Research any breaking changes in vitest or supertest since AUTH‑002 was written. Confirm DB‑IDENTITY‑005 is complete. *Document findings briefly.*
- [ ] AUTH‑007.0.75 (AGENT): Reason about each failing test and identify the root cause before making any fixes. *If a test failure points to an architectural issue rather than an implementation bug, ask the user.*
- [ ] AUTH‑007.1 (AGENT): After Phase 2 DB‑IDENTITY‑005 is complete, run test suite and fix any implementation issues.
  **File(s):** `artifacts/api‑server/src/` (fixes as needed)
  **Verification:** `pnpm test -- auth.test.ts` all green
- [ ] AUTH‑007.2 (AGENT): Add edge‑case tests for weak password and missing required fields.
  **File(s):** `artifacts/api‑server/__tests__/api/auth.test.ts`
  **Verification:** New tests pass; all existing tests still green
- [ ] AUTH‑007.N (HUMAN): Final review — confirm all tests green and no assertion weakening. **Verification:** Approved.

---

## Frontend Authentication

### [ ] AUTH‑009: Create Frontend AuthContext and useAuth Hook
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `contexts/` directory exists under `artifacts/apex‑os/src/`. No auth state management exists. The app renders with no user session concept.
**Size:** Medium

**Description:** Create an `AuthContext` that manages current user state and exposes `login`, `register`, `logout` actions, and a `useAuth` hook for consuming the context — providing the auth state foundation for all frontend components.

**Depends on:** `infrastructure/AUTH.md → AUTH‑001` (codegen), `AUTH‑006`/`AUTH‑007` (working backend)
**Blocks:** `infrastructure/AUTH.md → AUTH‑010`, `AUTH‑011`, `AUTH‑012`
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`, `artifacts/apex‑os/src/hooks/useAuth.ts`

**Definition of Done**
- [ ] `AuthContext` wraps `App.tsx` and provides `{ user, login, register, logout, isLoading, isAuthenticated }`
- [ ] `login` calls generated React Query mutation, stores tokens in JS closure (not localStorage), updates user state
- [ ] `logout` clears user state and tokens
- [ ] `useAuth()` called outside `AuthProvider` throws a helpful error message
- [ ] Component test: simulate login → user populated; logout → user null
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Token persistence across browser restarts
- Automatic token refresh on expiry
- Role‑based UI gating
- Social/OAuth login

**Rules to Follow**
- Token storage must use JS closure (module‑level `let` variable) per OWASP recommendation; never use React state or localStorage for access tokens
- `useAuth()` must throw a descriptive error when called outside `AuthProvider`
- `isAuthenticated` must be derived from `user !== null`, not a separate boolean
- Access tokens must NEVER be returned from `useAuth()` — components must never have direct access to raw tokens

**Verification**
```bash
pnpm --filter @workspace/apex‑os run typecheck
pnpm --filter @workspace/apex‑os test -- AuthContext.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Frontend `AuthContext` mirrors the authenticated user identity from the Identity & Access bounded context.
- TDD: Write component tests that simulate login and logout with mocked mutations.
- BDD: Enables “Given an authenticated user, the header shows their initials.”
- Deep Module: `AuthContext` acts as a deep module — components never interact with token storage or API calls directly.

---

### Subtasks
- [ ] AUTH‑009.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑009.0.5 (AGENT): Research React 19 context patterns, OWASP token storage recommendations for SPAs, TanStack React Query v5 useMutation patterns, and JS closure token storage. *Document findings briefly.*
- [ ] AUTH‑009.0.75 (AGENT): Reason about the token storage strategy (closure vs sessionStorage) and the decision to never expose raw tokens from `useAuth()`. *If undecided, ask the user before executing.*
- [ ] AUTH‑009.1 (AGENT): Create `AuthContext.tsx` and `useAuth.ts` with user state, login/register/logout methods, and the helpful outside‑provider error.
  **File(s):** `artifacts/apex‑os/src/contexts/AuthContext.tsx`, `artifacts/apex‑os/src/hooks/useAuth.ts`
  **Verification:** Component test with mocked API passes; `pnpm typecheck` clean
- [ ] AUTH‑009.2 (AGENT): Wrap `App.tsx` with `AuthProvider`.
  **File(s):** `artifacts/apex‑os/src/App.tsx`
  **Verification:** `pnpm typecheck` passes; no runtime crash on app load
- [ ] AUTH‑009.N (HUMAN): Final review and sign‑off — confirm token storage strategy and that tokens are not exposed through `useAuth()`. **Verification:** Approved.

---

### [ ] AUTH‑010: Wire Custom Fetch to Auth Token
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `setAuthTokenGetter()` exists in `lib/api‑client‑react/src/custom‑fetch.ts` but is never called. All API calls from the frontend are currently unauthenticated.
**Size:** Small

**Description:** Call `setAuthTokenGetter()` from within `AuthContext` so that every API request made through the generated React Query hooks automatically includes the `Authorization: Bearer <token>` header after login.

**Depends on:** `infrastructure/AUTH.md → AUTH‑009`
**Blocks:** `infrastructure/AUTH.md → AUTH‑012`
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`

**Definition of Done**
- [ ] After a successful `login()`, `setAuthTokenGetter(() => accessToken)` is called
- [ ] After `logout()`, `setAuthTokenGetter(null)` is called to remove the token getter
- [ ] A component test verifies that after login, a mock API fetch call includes the `Authorization: Bearer` header
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- `setAuthTokenGetter` must be called synchronously within the `login` success callback — not in a `useEffect`
- `setAuthTokenGetter(null)` must be called on `logout`
- The token getter function must return the current token from the closure — not from React state

**Verification**
```bash
pnpm --filter @workspace/apex‑os run typecheck
pnpm --filter @workspace/apex‑os test -- AuthContext.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure wiring.
- TDD: Add a test case to the existing `AuthContext.test.tsx` that verifies the fetch interceptor attaches the token after login.
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] AUTH‑010.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑010.0.5 (AGENT): Review `custom‑fetch.ts` implementation and `setAuthTokenGetter` API to understand the exact calling convention. *Document findings briefly.*
- [ ] AUTH‑010.0.75 (AGENT): Confirm the closure‑based getter pattern is implemented in AUTH‑009 before wiring here. *If token is stored in React state instead of a closure, fix AUTH‑009 first.*
- [ ] AUTH‑010.1 (AGENT): Subscribe to token changes in AuthContext and call `setAuthTokenGetter` on login and `setAuthTokenGetter(null)` on logout.
  **File(s):** `artifacts/apex‑os/src/contexts/AuthContext.tsx`
  **Verification:** Component test verifies that after login, a mocked fetch call includes `Authorization: Bearer` header
- [ ] AUTH‑010.N (HUMAN): Final review — manual check in browser Network tab after login. **Verification:** Approved.

---

### [ ] AUTH‑011: Replace Hardcoded Header User Initials
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `Header.tsx` line 40 shows hardcoded `JS` initials. This does not reflect the actual authenticated user.
**Size:** Small

**Description:** Update `Header.tsx` to derive user initials dynamically from the `user` object returned by `useAuth()` — replacing the hardcoded “JS” with real user data.

**Depends on:** `infrastructure/AUTH.md → AUTH‑009`
**Blocks:** `infrastructure/AUTH.md → AUTH‑012`
**Related Files:** `artifacts/apex‑os/src/components/layout/Header.tsx`

**Definition of Done**
- [ ] `Header.tsx` imports and calls `useAuth()`
- [ ] User initials are derived from `user.fullName` with a fallback to `“?”` when `user` is null
- [ ] No hardcoded `“JS”` string remains
- [ ] Component test with mocked auth context renders correct initials and fallback
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Initials derivation must handle edge cases: null user, single‑word name, names with more than two words
- Do not expose `user.email` or other PII in the rendered HTML without deliberate decision

**Verification**
```bash
pnpm --filter @workspace/apex‑os run typecheck
pnpm --filter @workspace/apex‑os test -- Header.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – UI integration task.
- TDD: Write a component test first: mount `Header` with mocked `useAuth` returning `{ user: { fullName: 'Sarah Jenkins' } }` → assert “SJ” is rendered.
- BDD: “Given an authenticated user named Sarah Jenkins, the header shows ‘SJ’ initials.”

---

### Subtasks
- [ ] AUTH‑011.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑011.0.5 (AGENT): Review `Header.tsx` to confirm the exact location of the hardcoded “JS” and understand the surrounding component structure. *Document findings briefly.*
- [ ] AUTH‑011.0.75 (AGENT): Reason about initials edge cases.
- [ ] AUTH‑011.1 (AGENT): Update `Header.tsx` to use `useAuth()` and derive initials dynamically; add/use a `getInitials` utility.
  **File(s):** `artifacts/apex‑os/src/components/layout/Header.tsx`, `artifacts/apex‑os/src/lib/utils.ts`
  **Verification:** Component test with mocked auth context renders correct initials; hardcoded “JS” is gone
- [ ] AUTH‑011.2 (AGENT): Write component tests covering correct initials, fallback “?”, and null user.
  **File(s):** `artifacts/apex‑os/src/__tests__/components/layout/Header.test.tsx`
  **Verification:** All tests pass
- [ ] AUTH‑011.N (HUMAN): Final review — visually confirm initials in the running app. **Verification:** Approved.

---

### [ ] AUTH‑012: Manual End‑to‑End Test of Auth Flow
**Status:** ⏳ Not Started
**Actor:** HUMAN
**Priority:** 🟠 High
**Current State:** All auth components are separately implemented and tested but no full end‑to‑end validation in the browser has been performed.
**Size:** [N/A]

**Description:** Manually validate the complete authentication journey in the running application — register, login, token refresh, and logout — confirming that frontend and backend work end‑to‑end.

**Depends on:** `infrastructure/AUTH.md → AUTH‑009`, `AUTH‑010`, `AUTH‑011`, `AUTH‑007`
**Blocks:** Phase 1 completion gate

**Definition of Done**
- [ ] Register a new user with a valid organization ID → success, redirected/logged in
- [ ] Login with registered credentials → 200, tokens present, header shows correct initials
- [ ] Access a protected API endpoint → 200
- [ ] Wait for access token to expire → token is refreshed automatically
- [ ] Logout → user state cleared, subsequent API calls return 401
- [ ] All steps follow the `auth.feature` BDD scenarios exactly

**Rules to Follow**
- Use only test/development credentials — never real user data
- Test against the local development environment only
- If a bug is found, document it as a new task rather than fixing inline

**Verification**
```bash
pnpm --filter @workspace/apex‑os run dev
pnpm --filter @workspace/api‑server run dev
# Manual: follow auth.feature scenarios in browser
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Final validation that the Identity context is fully functional end‑to‑end.
- BDD: Follows `auth.feature` scenarios exactly.

---

### Subtasks
- [ ] AUTH‑012.0.25 (AGENT): Read the entire task and all related info. *No action – pause until fully understood.*
- [ ] AUTH‑012.0.5 (AGENT): Review `auth.feature` to prepare the exact test scenarios the HUMAN will follow. *Summarize the test script for the HUMAN.*
- [ ] AUTH‑012.0.75 (AGENT): Confirm all prerequisite tasks are marked complete before scheduling the manual test. *If any prerequisite is incomplete, block AUTH‑012.*
- [ ] AUTH‑012.1 (HUMAN): Run the app and perform the full auth journey. **Verification:** All steps in `auth.feature` pass end‑to‑end in the browser.
- [ ] AUTH‑012.N (HUMAN): Final review and sign‑off — Phase 1 auth complete. **Verification:** Approved.

---

## Identity Database Schema

### [ ] DB‑IDENTITY‑001: Define Users Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `lib/db/src/schema/` is empty. No users table exists; auth services and all user‑scoped features are blocked.
**Size:** Small

**Description:** Define the Drizzle `users` table — the core identity record linking a human actor to an organization. Includes all columns needed for password‑based authentication with a tenant‑scoped unique index on `(organization_id, email)`.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/AUTH.md → DB‑IDENTITY‑004`, `DB‑IDENTITY‑005`, `DB‑IDENTITY‑006`, `AUTH‑003`
**Related Files:** `lib/db/src/schema/users.ts`, `lib/db/src/__tests__/users.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/users.ts` exists with columns: `id` (uuid PK), `organization_id` (FK), `email` (text NOT NULL), `password_hash` (text NOT NULL), `full_name` (text NOT NULL), `status` (pgEnum: `active|inactive|suspended`), `created_at`, `updated_at`
- [ ] Composite unique index on `(organization_id, email)`
- [ ] `insertUserSchema` omits `id`, `created_at`, `updated_at`; validates email format; `password_hash` omitted from `selectUserSchema` export
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Email uniqueness is per‑organization (`organization_id, email` composite unique), not globally unique
- `password_hash` must NEVER appear in `selectUserSchema` or any API response

**Verification**
```bash
pnpm --filter @workspace/db test -- users.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `User` aggregate belongs to the Identity & Access bounded context. `organization_id` enforces multi‑tenant isolation at the data layer.
- TDD: Write failing test asserting columns, FK, composite unique index, and Zod rejection of missing fields.

---

### Subtasks
- [ ] DB‑IDENTITY‑001.0.25 (AGENT): Read DB‑ORG‑001 schema, this task, and AUTH‑003 for context. *No action – pause.*
- [ ] DB‑IDENTITY‑001.0.5 (AGENT): Research Drizzle ORM composite unique index syntax and `drizzle‑zod` `.omit()` pattern. *Document findings briefly.*
- [ ] DB‑IDENTITY‑001.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/users.test.ts` **Verification:** RED.
- [ ] DB‑IDENTITY‑001.2 (AGENT): Implement `users` table, enum, Zod schemas, and types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑IDENTITY‑002: Define Roles Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No roles table exists. RBAC cannot be implemented.
**Size:** Small

**Description:** Define the Drizzle `roles` table for per‑tenant role definitions. Roles are tenant‑scoped with a composite unique constraint on `(organization_id, name)`.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/AUTH.md → DB‑IDENTITY‑004`
**Related Files:** `lib/db/src/schema/roles.ts`, `lib/db/src/__tests__/roles.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `description` (text nullable), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, name)`
- [ ] Zod insert/select schemas generated and exported
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Role names must be unique per organization
- Do not hardcode role names in application code — always query from the roles table

**Verification**
```bash
pnpm --filter @workspace/db test -- roles.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Role` is a value object in the Identity bounded context.

---

### Subtasks
- [ ] DB‑IDENTITY‑002.0.25 (AGENT): Read DB‑ORG‑001 and DB‑IDENTITY‑001 schemas for FK reference. *No action – pause.*
- [ ] DB‑IDENTITY‑002.0.5 (AGENT): Confirm composite unique index syntax in Drizzle. *No new research needed.*
- [ ] DB‑IDENTITY‑002.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/roles.test.ts` **Verification:** RED.
- [ ] DB‑IDENTITY‑002.2 (AGENT): Implement `roles` table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑IDENTITY‑003: Define Permissions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No permissions table exists. Fine‑grained authorization cannot be implemented.
**Size:** Small

**Description:** Define the Drizzle `permissions` table for system‑wide permission codes. Permissions are global (no `organization_id`) — they represent capabilities assigned to roles.

**Depends on:** [N/A] — no FK dependencies
**Blocks:** `infrastructure/AUTH.md → DB‑IDENTITY‑005`
**Related Files:** `lib/db/src/schema/permissions.ts`, `lib/db/src/__tests__/permissions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `name` (text UNIQUE NOT NULL), `description` (text nullable), `created_at`
- [ ] Global unique constraint on `name`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Permission `name` must follow a colon‑namespaced convention: `<module>:<action>` (e.g., `crm:read`)
- No `organization_id` column — permissions are system‑wide constants
- Permission names are immutable once seeded

**Verification**
```bash
pnpm --filter @workspace/db test -- permissions.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `Permission` is a fine‑grained policy element in the Identity bounded context.

---

### Subtasks
- [ ] DB‑IDENTITY‑003.0.25 (AGENT): Read this task and DB‑IDENTITY‑005 to understand the seeding relationship. *No action – pause.*
- [ ] DB‑IDENTITY‑003.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/permissions.test.ts` **Verification:** RED.
- [ ] DB‑IDENTITY‑003.2 (AGENT): Implement `permissions` table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑IDENTITY‑004: Define User‑Role Junction Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No user‑role junction exists. Users cannot be assigned roles; RBAC is non‑functional.
**Size:** Small

**Description:** Define the `user_roles` junction table that associates users with roles within an organization. Includes a composite unique constraint on `(user_id, role_id)` to prevent duplicate assignments.

**Depends on:** `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `DB‑IDENTITY‑002`
**Blocks:** `infrastructure/AUTH.md → DB‑IDENTITY‑005`
**Related Files:** `lib/db/src/schema/user_roles.ts`, `lib/db/src/__tests__/user‑roles.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `user_id` (FK → users), `role_id` (FK → roles), `organization_id` (FK), `assigned_at` (timestamp), `assigned_by` (nullable FK → users)
- [ ] Composite unique constraint on `(user_id, role_id)`
- [ ] Zod schemas and types exported
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- All queries must include `organization_id`
- `onDelete: 'cascade'` on `user_id` FK

**Verification**
```bash
pnpm --filter @workspace/db test -- user‑roles.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Many‑to‑many association between Users and Roles.

---

### Subtasks
- [ ] DB‑IDENTITY‑004.0.25 (AGENT): Read DB‑IDENTITY‑001 and DB‑IDENTITY‑002 schemas. *No action – pause.*
- [ ] DB‑IDENTITY‑004.1 (AGENT): Write failing schema test. **File(s):** `lib/db/src/__tests__/user‑roles.test.ts` **Verification:** RED.
- [ ] DB‑IDENTITY‑004.2 (AGENT): Implement `user_roles` table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑IDENTITY‑005: Generate Migrations and Seed Data for Identity
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No seed scripts exist. The development database has no admin user, no roles, and no permissions. AUTH integration tests cannot pass against a real database.
**Size:** Medium

**Description:** Create the seed script that populates the Identity context with the minimum viable data set: one organization, an admin user (Argon2id‑hashed password), system permission codes, seeded roles, and the admin‑role assignment.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `DB‑IDENTITY‑002`, `DB‑IDENTITY‑003`, `DB‑IDENTITY‑004`
**Blocks:** `infrastructure/AUTH.md → AUTH‑007`, all Phase 1 auth E2E tests
**Related Files:** `lib/db/src/seed/identity.ts`, `lib/db/src/seed/index.ts`

**Definition of Done**
- [ ] Seed is idempotent (safe to run multiple times — uses `ON CONFLICT DO NOTHING`)
- [ ] Admin password read from `process.env.SEED_ADMIN_PASSWORD`
- [ ] HUMAN can run `pnpm --filter @workspace/db run seed` successfully
- [ ] Admin login test (`AUTH‑007`) passes against seeded DB

**Rules to Follow**
- Seed must be run inside a transaction
- Password hash must use Argon2id
- Run seeds in FK‑safe order: organizations → permissions → users → roles → user_roles

**Verification**
```bash
pnpm --filter @workspace/db run seed
pnpm --filter @workspace/api‑server test -- auth.integration.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Seed data populates the Identity bounded context with initial aggregates.
- BDD: “Admin can log in after fresh install” — this seed enables that scenario.

---

### Subtasks
- [ ] DB‑IDENTITY‑005.0.25 (AGENT): Read DB‑IDENTITY‑001 through 004 schemas and AUTH‑003 (Argon2id) to understand seeding dependencies. *No action – pause.*
- [ ] DB‑IDENTITY‑005.0.5 (AGENT): Research Drizzle `onConflictDoNothing()` API and transaction wrapping for seed scripts. *Confirm API signature.*
- [ ] DB‑IDENTITY‑005.1 (AGENT): Implement `seedIdentity()` with idempotent inserts inside a transaction.
  **File(s):** `lib/db/src/seed/identity.ts`
  **Verification:** `pnpm run typecheck` clean; function runs without errors against test DB.
- [ ] DB‑IDENTITY‑005.2 (AGENT): Create seed orchestrator; add `seed` script to `lib/db/package.json`.
  **File(s):** `lib/db/src/seed/index.ts`, `lib/db/package.json`
  **Verification:** `pnpm --filter @workspace/db run seed` succeeds with no errors.
- [ ] DB‑IDENTITY‑005.3 (HUMAN): Run `push` then `seed` against dev database; confirm admin login works. **Verification:** Admin login via `/auth/login` returns a valid JWT.
- [ ] DB‑IDENTITY‑005.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑IDENTITY‑006: Define Refresh Tokens Table with Family Tracking
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No refresh tokens table exists. Secure token rotation with reuse detection cannot be implemented.
**Size:** Small

**Description:** Define the `refresh_tokens` table with family tracking — the data backbone for secure JWT refresh‑token rotation.

**Depends on:** `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/AUTH.md → AUTH‑004`, `AUTH‑005`
**Related Files:** `lib/db/src/schema/refresh‑tokens.ts`, `lib/db/src/__tests__/refresh‑tokens.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `user_id` (FK), `organization_id` (FK), `family_id` (uuid NOT NULL), `token_hash` (text UNIQUE NOT NULL — SHA‑256 of raw token), `expires_at`, `revoked_at` (nullable), `created_at`
- [ ] Indexes: `(user_id, family_id)`, `(family_id, expires_at)`, unique on `token_hash`
- [ ] Zod schemas exported; unit tests pass
- [ ] `pnpm typecheck` passes

**Rules to Follow**
- Store only SHA‑256 hash of the token — never the raw token
- `family_id` groups all tokens from a single login session; reuse of a revoked token must trigger revocation of the entire family

**Verification**
```bash
pnpm --filter @workspace/db test -- refresh‑tokens.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: `RefreshToken` is a value object in the Identity bounded context with family tracking for security.

---

### Subtasks
- [ ] DB‑IDENTITY‑006.0.25 (AGENT): Read DB‑IDENTITY‑001 and AUTH‑004/005 tasks for token rotation context. *No action – pause.*
- [ ] DB‑IDENTITY‑006.1 (AGENT): Write failing schema test including all indexes and unique constraints. **File(s):** `lib/db/src/__tests__/refresh‑tokens.test.ts` **Verification:** RED.
- [ ] DB‑IDENTITY‑006.2 (AGENT): Implement `refresh_tokens` table, indexes, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑IDENTITY‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
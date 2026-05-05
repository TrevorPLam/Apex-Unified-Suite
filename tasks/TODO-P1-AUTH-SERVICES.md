# TODO-P1-AUTH-SERVICES.md – Phase 1: Core Authentication Services

This document contains the core authentication service implementations that provide the business logic for user authentication. These services depend on the error handling foundation.

---

## [ ] AUTH-003: Implement Password Hashing Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `lib/crypto.ts` exists. No password hashing infrastructure is in place. The `argon2` package is not yet installed in `artifacts/api-server`.
**Size:** Small

**Description:** Create a cryptographic utility module that exposes `hashPassword` and `verifyPassword` using argon2id — the current OWASP-recommended password hashing algorithm (as of May 2026).

**Depends on:** DEP-001.3 (argon2 package installed in `artifacts/api-server`)
**Blocks:** AUTH-005 (Auth Service needs hashing)
**Related Files:** `artifacts/api-server/src/lib/crypto.ts`

**Imports / Exports**
- Imports: `argon2` npm package
- Exports: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/crypto.ts` exists and compiles
- [ ] `hashPassword` returns an argon2id hash string
- [ ] `verifyPassword` returns `true` for correct plain/hash pair, `false` for incorrect — never throws
- [ ] Hash parameters use argon2id with OWASP-recommended defaults: memoryCost ≥ 19456 (19 MiB), timeCost ≥ 2, parallelism 1
- [ ] Unit tests cover: hash/verify round-trip (correct password), incorrect password returns false, empty string handling
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Password strength validation (belongs in route validation middleware or service layer)
- Password reset or change workflows
- Pepper/HMAC wrapping (may be added in a future hardening pass)
- Any database interaction

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, actual password hashes
- Never log plain-text passwords at any log level

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/crypto.ts` (new file)
- Tests added/updated in: `artifacts/api-server/__tests__/lib/crypto.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `crypto.ts` and its test file
- Halt condition: if any test reveals hash output is deterministic (no salt), halt and fix before proceeding

**Rules to Follow**
- Must use argon2id variant (not argon2i or argon2d) — OWASP Password Storage Cheat Sheet (May 2026)
- Hash comparison must be timing-attack resistant — use the argon2 library's built-in `verify()` which is constant-time
- Plain-text passwords must NEVER be logged, stored in variables beyond the immediate call, or serialized
- Hash parameters (memoryCost, timeCost, parallelism) must be sourced from environment config or named constants — never hardcoded magic numbers
- Function must never throw; internal errors should be caught and rethrown as `DomainError` (`DatabaseError`) if needed by callers

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- crypto.test.ts
```

**Advanced Code Patterns**
- Argon2id is the OWASP/NIST recommended algorithm (2026): resistant to both side-channel and GPU attacks
- Use the `argon2` npm package's `hash()` and `verify()` — it handles salt generation internally, making salts transparent to callers
- Export a frozen config constant (`ARGON2_OPTIONS`) so parameters can be audited and upgraded in one place
- Consider a `rehashIfNeeded(plain, hash)` utility for future algorithm upgrade paths (checks if stored hash uses current parameters; rehashes on next login if not)

**Anti-Patterns**
- Storing plain-text passwords (catastrophic)
- Using MD5, SHA1, SHA256, or bcrypt with low work factors for password hashing
- Using argon2i or argon2d instead of argon2id
- Insufficient memory cost (below OWASP minimum of 19 MiB)
- Predictable or hardcoded salts (the argon2 library handles salt generation automatically — do not pass a custom salt)
- Rolling a custom timing-safe comparison instead of using the library's `verify()`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Infrastructure service within the Identity context. The domain service (AuthService) calls `hashPassword`/`verifyPassword` without knowing implementation details.
- TDD: Write unit tests for hash/verify round-trip before implementation. Tests must include: correct password returns true, wrong password returns false, hash output differs on each call (salt uniqueness).
- BDD: Indirectly validated through registration and login BDD scenarios in `auth.feature`.
- Deep Module: The `crypto.ts` module hides all argon2id complexity. Callers only see a simple two-function interface.

---

### Subtasks

- [ ] AUTH-003.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-003.0.5 (AGENT): Research argon2id parameter recommendations (OWASP May 2026), timing attack prevention, and argon2 npm package API.
  *Document findings briefly or note "no changes."*

- [ ] AUTH-003.0.75 (AGENT): Reason about the task — confirm DEP-001.3 is available and that argon2 package is installed before writing code.
  *If argon2 is absent, flag to user before executing.*

- [ ] AUTH-003.1 (AGENT): Write unit tests for hash/verify round-trip, incorrect password, and salt uniqueness.
  **File(s):** `artifacts/api-server/__tests__/lib/crypto.test.ts`
  **Verification:** `pnpm vitest run crypto.test.ts` fails (red) before implementation

- [ ] AUTH-003.2 (AGENT): Implement `hashPassword` and `verifyPassword` using argon2id with OWASP-compliant parameters.
  **File(s):** `artifacts/api-server/src/lib/crypto.ts`
  **Verification:** All unit tests pass (green); `pnpm typecheck` clean

- [ ] AUTH-003.N (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] AUTH-004: Implement JWT Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `lib/jwt.ts` exists. The `jsonwebtoken` package is not installed in `artifacts/api-server`. The `setAuthTokenGetter` function in `lib/api-client-react/src/custom-fetch.ts` is ready but not yet called.
**Size:** Small

**Description:** Create a JWT utility module that generates short-lived access tokens and longer-lived refresh tokens, and verifies tokens — enforcing algorithm, expiry, and issuer claims.

**Depends on:** ERROR-002 (for `TokenExpired` and auth error types used in verification failures)
**Blocks:** AUTH-005 (Auth Service composes JWT service), AUTH-008 (middleware verifies tokens)
**Related Files:** `artifacts/api-server/src/lib/jwt.ts`

**Imports / Exports**
- Imports: `jsonwebtoken` npm package; `DomainError` / `TokenExpired` from `errors/domain-errors.ts`; env config for `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- Exports: `generateAccessToken(user: UserPayload): string`, `generateRefreshToken(user: UserPayload): string`, `verifyToken(token: string): Result<UserPayload, DomainError>`

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/jwt.ts` exists and compiles
- [ ] `generateAccessToken` produces a signed JWT with `sub`, `email`, `organizationId`, `iat`, `exp` claims
- [ ] `generateRefreshToken` produces a signed JWT with `sub`, `iat`, `exp` — longer expiry than access token
- [ ] `verifyToken` returns `Result<UserPayload, DomainError>` — returns `err(TokenExpired)` for expired tokens, `err(InvalidCredentials)` for malformed/invalid tokens; never throws
- [ ] Algorithm is explicitly specified (HS256 with strong secret, or RS256 with key pair) — `none` algorithm is never accepted
- [ ] Access token expiry ≤ 15 minutes (configurable via `JWT_ACCESS_EXPIRY` env var)
- [ ] Refresh token expiry ≤ 7 days (configurable via `JWT_REFRESH_EXPIRY` env var)
- [ ] Unit tests cover: valid token generation and verification, expired token returns `TokenExpired` error, tampered token returns error, `none` algorithm is rejected
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Refresh token storage or rotation (belongs in AUTH-005 via `TokenRefreshPort`)
- Token blacklisting/denylist (belongs in a future token revocation task)
- Key pair generation scripts (document as a setup step, not automated here)
- Frontend token storage strategy

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, JWT secrets, private keys
- Never hardcode `JWT_SECRET` — always read from `process.env.JWT_SECRET`; throw a startup error if absent
- Never accept tokens signed with the `none` algorithm

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/jwt.ts` (new file)
- Tests added/updated in: `artifacts/api-server/__tests__/lib/jwt.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `jwt.ts` and its test file
- Halt condition: if any test shows the `none` algorithm is accepted, halt immediately and fix

**Rules to Follow**
- Explicitly specify the allowed algorithm(s) when calling `jwt.verify()` — never allow the library to infer algorithm from the token header (OWASP: "none algorithm" attack prevention)
- `JWT_SECRET` must be at least 64 characters of cryptographically random data (OWASP JWT Cheat Sheet)
- Access tokens must expire in ≤ 15 minutes (OWASP recommendation for short-lived tokens)
- `verifyToken` must never throw — always return `Result<UserPayload, DomainError>` (neverthrow)
- Token payload must include `organizationId` to support multi-tenant routing in middleware
- Startup must fail fast (process exit) if `JWT_SECRET` env var is missing or too short

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- jwt.test.ts
```

**Advanced Code Patterns**
- Explicit algorithm allowlist in `jwt.verify({ algorithms: ['HS256'] })` to prevent the `none` algorithm attack (OWASP JWT Cheat Sheet)
- Fail-fast secret validation at module load time using a startup guard: `if (!secret || secret.length < 64) throw new Error('JWT_SECRET too weak')`
- `UserPayload` type with `sub: string`, `email: string`, `organizationId: string` ensures consistent, typed claims across the system
- Separate `generateAccessToken` / `generateRefreshToken` functions (different expiry, different claim sets) rather than a single overloaded function

**Anti-Patterns**
- Not specifying the `algorithms` option in `jwt.verify()` — allows the `none` algorithm attack
- Using HS256 with a weak or hardcoded secret (should be ≥ 64 random bytes)
- Long-lived access tokens (> 15 minutes) — increases breach window
- Storing sensitive data (password hashes, full user objects) in JWT payload
- Silently swallowing `JsonWebTokenError` without returning a typed error

**DDD / TDD / BDD / Deep Module notes**
- DDD: JWT tokens represent an authenticated session boundary. The token service is an infrastructure concern; it does not belong in the domain model.
- TDD: Write unit tests for token generation (correct payload claims), verification (accepts valid, rejects expired/tampered/none-alg), before implementation.
- BDD: Tokens appear in `auth.feature` as the response payload of successful login and as the credential for protected routes.
- Deep Module: The JWT service hides encoding, signing, verification, and error mapping. Consumers only call three functions.

---

### Subtasks

- [ ] AUTH-004.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-004.0.5 (AGENT): Research OWASP JWT best practices (none-algorithm attack, weak secret attack, token sidejacking), jsonwebtoken package API, and RS256 vs HS256 tradeoffs (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-004.0.75 (AGENT): Reason about the task — particularly secret strength requirements, algorithm allowlist, and the fail-fast startup guard pattern.
  *If uncertain about RS256 vs HS256 choice for this project, ask the user before executing.*

- [ ] AUTH-004.1 (AGENT): Write unit tests for token generation, valid verification, expired token error, tampered token error, and none-algorithm rejection.
  **File(s):** `artifacts/api-server/__tests__/lib/jwt.test.ts`
  **Verification:** `pnpm test -- jwt.test.ts` fails (red) before implementation

- [ ] AUTH-004.2 (AGENT): Implement `generateAccessToken`, `generateRefreshToken`, `verifyToken` with explicit algorithm, fail-fast secret guard, and neverthrow return types.
  **File(s):** `artifacts/api-server/src/lib/jwt.ts`
  **Verification:** All unit tests pass; `pnpm typecheck` clean

- [ ] AUTH-004.N (HUMAN): Final review and sign-off — confirm algorithm choice and secret length requirements.
  **Verification:** Approved.

---

## [ ] AUTH-005: Implement Auth Service (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `services/` directory exists under `artifacts/api-server/src/`. No auth business logic exists. All four auth operations (register, login, refresh, logout) are unimplemented.
**Size:** Large

**Description:** Implement the core `AuthService` deep module that orchestrates password hashing, JWT generation, and persistence (stubbed via port interfaces) for register, login, refresh, and logout operations — all returning `Either<DomainError, Result>` via neverthrow.

**Depends on:** AUTH-003 (password hashing), AUTH-004 (JWT service), ERROR-002 (domain error types), DEP-001.1 (neverthrow installed)
**Blocks:** AUTH-006 (auth routes wire to AuthService)
**Related Files:** `artifacts/api-server/src/services/auth.ts`, `artifacts/api-server/src/lib/auth/token-refresh-port.ts`

**Imports / Exports**
- Imports: `hashPassword`, `verifyPassword` from `lib/crypto.ts`; `generateAccessToken`, `generateRefreshToken`, `verifyToken` from `lib/jwt.ts`; domain errors from `errors/domain-errors.ts`; `Result`, `err`, `ok` from `neverthrow`
- Exports: `AuthService` class (or object); `TokenRefreshPort` interface; `IOrganizationRepository` stub interface

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/auth/token-refresh-port.ts` defines `TokenRefreshPort` interface with `storeRefreshToken`, `getRefreshToken`, `invalidateRefreshToken`, `invalidateAllUserTokens`
- [ ] `artifacts/api-server/src/services/auth.ts` implements `register`, `login`, `refresh`, `logout`
- [ ] `register(email, password, fullName, organizationId)`: validates organization exists (via `OrganizationRepository` stub), hashes password, creates user, returns `Right<User>` or appropriate domain error
- [ ] `login(email, password, organizationId)`: finds user by email AND organizationId, verifies password, generates tokens, returns `Right<{ accessToken, refreshToken, user }>` or `InvalidCredentials`
- [ ] `refresh(token)`: verifies token, rotates via `TokenRefreshPort`, returns new token pair or `TokenExpired`
- [ ] `logout(token)`: invalidates refresh token via `TokenRefreshPort`, returns `Right<void>`
- [ ] All methods return `Result<T, DomainError>` — no method ever throws
- [ ] Unit tests use mocked repositories and pass for all happy paths and key error paths
- [ ] `pnpm typecheck` passes
- [ ] Depth refactor check passed: route handlers contain zero domain logic; service exposes ≤ 5 public methods; no `throw` statements in service file

**Out of Scope**
- Real database persistence (stubbed via port interfaces until Phase 2)
- Password reset or email verification flows
- Multi-factor authentication
- Session management beyond JWT

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never log passwords or tokens at any log level
- Never allow service methods to throw — all errors must be returned via neverthrow

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/auth.ts` (new file)
- Code changes in: `artifacts/api-server/src/lib/auth/token-refresh-port.ts` (new file)
- Tests added/updated in: `artifacts/api-server/__tests__/services/auth.service.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `services/auth.ts`, `lib/auth/token-refresh-port.ts`, and their test files
- Halt condition: if any method is found to throw instead of returning `err(...)`, halt and fix before proceeding

**Rules to Follow**
- All auth operations must never throw — always return `Result<T, DomainError>` (neverthrow Either pattern)
- Login must look up user by BOTH email AND `organizationId` to enforce multi-tenant isolation (ARCH-001)
- `login` must return the same generic error (`InvalidCredentials`) whether the user is not found OR the password is wrong — prevents user enumeration (OWASP Auth Cheat Sheet)
- All service methods must be auditable: log the operation (not the sensitive data) at `info` level via Pino
- Organization existence check is a stub that returns `Right<void>` unconditionally until Phase 2 — this is intentional and must be documented with a `TODO(Phase 2)` comment
- Service exposes ≤ 5 public methods (register, login, refresh, logout, and optionally one helper)

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- auth.service.test.ts
```

**Advanced Code Patterns**
- Hexagonal architecture port (`TokenRefreshPort`) decouples the service from the database implementation — Phase 2 provides a real adapter; Phase 1 uses an in-memory stub
- `OrganizationRepository` stub pattern: a simple object with a `findById` method that returns a hardcoded `Right<Organization>` — replaced in Phase 2
- Returning the same `InvalidCredentials` error for both "user not found" and "wrong password" cases is a deliberate security pattern (OWASP: prevents user enumeration via response differentiation)
- Depth refactor check (AUTH-005.4): after implementation, verify no `throw` in the service file, all methods return `Result`, and route handlers contain zero domain logic

**Anti-Patterns**
- Business logic in route handlers (stage transitions, validation rules, password hashing calls)
- Direct database access from service (must go through repository port interface)
- Synchronous password operations (blocking the event loop)
- Returning different errors for "user not found" vs "wrong password" (enables user enumeration)
- Missing audit trails for auth events (all login/logout/register attempts must be logged)
- Throwing exceptions from service methods instead of returning `err(...)`

**DDD / TDD / BDD / Deep Module notes**
- DDD: `AuthService` is the core application service of the Identity & Access bounded context. It enforces registration rules (unique email per org), ties users to organizations (multi-tenancy), and orchestrates infrastructure services (hashing, JWT).
- TDD: Write unit tests mocking `TokenRefreshPort`, `OrganizationRepository`, `UserRepository` (stubbed) before implementation. Cover happy paths and key error paths for all 4 methods.
- BDD: The service fulfills all scenarios in `auth.feature` — register, login (valid/invalid), refresh, logout.
- Deep Module: The service interface is intentionally simple (≤ 5 public methods) while hiding the orchestration of hashing, JWT, repository, and error mapping. Route handlers should call one method and receive a typed result.

---

### Subtasks

- [ ] AUTH-005.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-005.0.5 (AGENT): Research hexagonal architecture port patterns, neverthrow composition, multi-tenant auth patterns, and OWASP user enumeration prevention (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-005.0.75 (AGENT): Reason about the task — particularly the stub strategy for `OrganizationRepository`, the `TokenRefreshPort` interface, and the intentional same-error-for-user-not-found-and-wrong-password pattern.
  *If uncertain about interface shapes, ask the user before executing.*

- [ ] AUTH-005.1 (AGENT): Write unit tests for all 4 service methods with mocked repositories.
  **File(s):** `artifacts/api-server/__tests__/services/auth.service.test.ts`
  **Verification:** `pnpm vitest run auth.service.test.ts` fails (red) before implementation

- [ ] AUTH-005.2 (AGENT): Define `TokenRefreshPort` interface and implement `register` and `login` with organization stub.
  **File(s):** `artifacts/api-server/src/lib/auth/token-refresh-port.ts`, `artifacts/api-server/src/services/auth.ts`
  **Verification:** Tests for `register` and `login` pass; `pnpm typecheck` clean

- [ ] AUTH-005.3 (AGENT): Implement `refresh` and `logout` with stub `TokenRefreshPort` behavior.
  **File(s):** `artifacts/api-server/src/services/auth.ts`
  **Verification:** `refresh` returns a deterministic token pair in tests; `logout` returns `ok(undefined)`

- [ ] AUTH-005.4 (AGENT): Depth refactor check — verify route handlers contain no domain logic; service hides all complexity behind ≤ 5 public methods; no `throw` statement in service file.
  **File(s):** `artifacts/api-server/src/services/auth.ts`
  **Verification:** Manual inspection confirms no `throw` in service; all methods return `Result`; `pnpm typecheck` clean

- [ ] AUTH-005.N (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Auth Services Wave Completion Criteria

**Wave Status:** [ ] Complete (0/3 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-003 provides password hashing for AUTH-005
- AUTH-004 provides JWT token operations for AUTH-005 and AUTH-008
- AUTH-005 provides core auth business logic for AUTH-006 routes

**Dependencies:**
- ERROR-002 (domain errors defined)
- DEP-001 (argon2, neverthrow dependencies installed)

**Next Wave:** AUTH-API (depends on AUTH-SERVICES)

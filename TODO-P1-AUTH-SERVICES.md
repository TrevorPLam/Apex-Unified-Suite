# TODO-P1-AUTH-SERVICES.md – Phase 1: Core Authentication Services

This document contains the core authentication service implementations that provide the business logic for user authentication. These services depend on error handling foundation.

---

## [ ] AUTH-003: Implement Password Hashing Service
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api-server/src/lib/crypto.ts` exports `hashPassword(plain)` and `verifyPassword(plain, hash)` using argon2id.  
**Related Files:** `artifacts/api-server/src/lib/crypto.ts`

**DDD:** Infrastructure service within Identity; domain doesn't care about hashing details.  
**TDD:** Write unit tests for hash/verify round‑tripping before implementation.  
**BDD:** Indirectly tested via registration/login scenarios.  
**Deep Module:** Methods hide argon2id complexity; consumers only see a simple verify interface.

### Subtasks:
- [ ] AUTH-003.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-003.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-003.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-003.1: Write unit test for hash/verify (round‑trip, wrong password). (AGENT)  
  **verification:** `pnpm vitest run crypto.test.ts` fails before implementation, passes after.
- [ ] AUTH-003.2: Implement `hashPassword` and `verifyPassword` using argon2id. (AGENT)  
  **verification:** Unit tests pass; `pnpm typecheck` clean.
- **Depends on:** DEP-001.3 (argon2id dependency).

---

## [ ] AUTH-004: Implement JWT Service
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api-server/src/lib/jwt.ts` exports `generateAccessToken(user)`, `generateRefreshToken(user)`, `verifyToken(token)` with configurable expiry.  
**Related Files:** `artifacts/api-server/src/lib/jwt.ts`  
**Dependencies:** Verify `framer-motion@^12.23.24` in workspace catalog (update memory rules if needed)

**DDD:** JWT tokens represent an authenticated session; not part of the domain model itself.  
**TDD:** Write unit tests for token creation (includes correct payload) and verification (rejects expired/invalid tokens).  
**BDD:** Tokens appear in the auth.feature as a response.  
**Deep Module:** JWT service hides encoding, decoding, and secret management.

### Subtasks:
- [ ] AUTH-004.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-004.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-004.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-004.1: Write unit tests for token generation and verification. (AGENT)  
  **verification:** `pnpm test -- jwt.test.ts` fails initially.
- [ ] AUTH-004.2: Implement functions using env `JWT_SECRET`. (AGENT)  
  **verification:** All tests pass; `pnpm typecheck` clean.

---

## [ ] AUTH-005: Implement Auth Service (Deep Module)
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

### Subtasks:
- [ ] AUTH-005.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-005.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-005.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-005.1: Write unit tests for service methods with mocked repositories. (AGENT)  
  **verification:** `pnpm vitest run auth.service.test.ts` red.
- [ ] AUTH-005.2: Implement `register` and `login` with organization stub. (AGENT)  
  **verification:** Tests pass for these two methods.
- [ ] AUTH-005.3: Implement `refresh` and `logout` with explicit stub behavior. (AGENT)  
  **verification:** `refresh` returns deterministic token pair (hardcoded for tests); `logout` returns `right(undefined)`.
- [ ] AUTH-005.4: Depth refactor check: verify route handlers contain no domain logic; service hides all complexity behind ≤5 public methods; never throws, always returns Either. (AGENT)  
  **verification:** Manual inspection confirms no `throw` in service file, all methods return Either, `pnpm typecheck` clean.

---

## Auth Services Wave Completion Criteria

**Wave Status:** [ ] Complete (0/3 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-003 provides password hashing for AUTH-005
- AUTH-004 provides JWT tokens for AUTH-005
- AUTH-005 provides core business logic for AUTH-006 routes

**Dependencies:**
- ERROR-002 (domain errors for service responses)
- DEP-001 (argon2id, neverthrow dependencies)

**Next Wave:** AUTH-API (depends on AUTH-SERVICES)

# TODO-P1-AUTH-MIDDLEWARE.md – Phase 1: Authentication Middleware

This document contains the cross-cutting authentication middleware that protects routes and enforces user authentication boundaries.

---

## [ ] AUTH-008: Implement Auth Middleware for Protected Routes
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `middlewares/auth.ts` exists. The `middlewares/` directory is empty (`.gitkeep` only). All routes are currently unprotected. The JWT service (AUTH-004) provides `verifyToken` but it is not consumed anywhere yet.
**Size:** Small

**Description:** Implement an Express middleware that extracts and verifies the JWT Bearer token from the `Authorization` header, populates `req.user` with the verified payload, and returns a standardized 401 response for unauthenticated requests.

**Depends on:** AUTH-004 (JWT service for `verifyToken`), ERROR-001 (global error handler for consistent 401 responses), ERROR-002 (domain error types: `TokenExpired`, `InvalidCredentials`)
**Blocks:** All protected route implementations in Phase 2 and beyond; AUTH-007 (the unauthorized-access test requires this middleware to be in place)
**Related Files:** `artifacts/api-server/src/middlewares/auth.ts`

**Imports / Exports**
- Imports: `verifyToken` from `lib/jwt.ts`; `TokenExpired`, `InvalidCredentials` from `errors/domain-errors.ts`; `Request`, `Response`, `NextFunction`, `RequestHandler` from `express`
- Exports: `requireAuth` middleware (`RequestHandler`); augmented `Express.Request` interface with `user: UserPayload`

**Definition of Done**
- [ ] `artifacts/api-server/src/middlewares/auth.ts` exists and compiles
- [ ] `requireAuth` extracts the Bearer token from the `Authorization: Bearer <token>` header
- [ ] Missing or malformed `Authorization` header → 401 response via `next(err)` with `InvalidCredentials` domain error
- [ ] Valid token → `req.user` populated with `{ sub, email, organizationId }` and `next()` called
- [ ] Expired token → 401 with `TokenExpired` domain error forwarded via `next(err)`
- [ ] Tampered/invalid token → 401 with `InvalidCredentials` domain error forwarded via `next(err)`
- [ ] `req.user` type is declared via TypeScript module augmentation (`Express.Request`)
- [ ] Unit tests cover: valid token → next(), missing header → 401, expired token → 401 TokenExpired, invalid token → 401
- [ ] Temporary note: until ERROR-001 is in place, errors are returned as plain 401 responses — acceptable temporarily
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Role-based access control (RBAC) — belongs in a future authorization middleware
- API key authentication
- OAuth2 / OIDC token validation
- Refresh token handling (belongs in the `/auth/refresh` route)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, or actual tokens
- Never log the raw JWT token value — log only the `sub` (userId) and `organizationId` from the decoded payload

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/middlewares/auth.ts` (new file)
- Tests added/updated in: `artifacts/api-server/__tests__/middlewares/auth.middleware.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `middlewares/auth.ts` and its test file
- Halt condition: if tests show the middleware accepts requests with no `Authorization` header (passes when it should block), halt and fix before any further route protection

**Rules to Follow**
- The middleware must NEVER attempt to extract tokens from query strings, cookies, or request body — Bearer header only (REST/API best practice)
- Token extraction must handle edge cases: missing header, header without "Bearer " prefix, empty token string after prefix
- `req.user` must be typed via TypeScript module augmentation, not `(req as any).user`
- Errors must be forwarded via `next(err)` — never via `res.json()` inline (to preserve the global error handler chain)
- The middleware must not cache or store tokens — it is stateless
- `organizationId` from the token payload must be available on `req.user` for downstream multi-tenant authorization

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- auth.middleware.test.ts
```

**Advanced Code Patterns**
- TypeScript module augmentation for `req.user`: declare `namespace Express { interface Request { user?: UserPayload } }` in a `.d.ts` file or directly in the middleware file to achieve full type safety without `any` casts
- Guard function pattern: `extractBearerToken(req): string | null` as a pure utility extracted from the middleware logic — keeps the middleware function clean and the extractor independently testable
- OWASP token sidejacking mitigation: the `organizationId` claim in the JWT payload enables downstream middleware to enforce tenant isolation without an additional DB lookup

**Anti-Patterns**
- Accepting tokens from query strings or request bodies (violates REST security standards; susceptible to token leakage in server logs)
- Using `(req as any).user` instead of TypeScript module augmentation (undermines type safety across all protected routes)
- Returning error responses inline (`res.status(401).json(...)`) instead of calling `next(err)` (bypasses global error handler)
- Caching decoded tokens in memory between requests (stateless middleware must not have shared mutable state)
- Logging the raw JWT string (tokens in logs are a security risk if logs are compromised)

**DDD / TDD / BDD / Deep Module notes**
- DDD: The middleware enforces the authenticated user boundary for all downstream bounded contexts. It is infrastructure — not domain logic.
- TDD: Write tests first: valid token → 200 (with a dummy protected route), missing header → 401, expired token → 401 `TokenExpired`. Tests use supertest with a dummy route protected by `requireAuth`.
- BDD: "As a user, I can access my profile only when authenticated." — middleware enforces this for all protected routes.
- Deep Module: The middleware is a cross-cutting concern that hides token extraction and verification. Downstream route handlers only see `req.user` — they never interact with JWT directly.

---

### Subtasks

- [ ] AUTH-008.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-008.0.5 (AGENT): Research Express 5 middleware patterns, TypeScript module augmentation for `req.user`, OWASP token extraction best practices, and token sidejacking mitigation (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-008.0.75 (AGENT): Reason about the task — confirm AUTH-004 (`verifyToken`) is available and that the `UserPayload` type shape is finalized before writing the module augmentation.
  *If `UserPayload` type is not yet defined, define it in `lib/jwt.ts` first.*

- [ ] AUTH-008.1 (AGENT): Write unit/integration tests for middleware using supertest with a dummy protected route.
  **File(s):** `artifacts/api-server/__tests__/middlewares/auth.middleware.test.ts`
  **Verification:** `pnpm test -- auth.middleware.test.ts` fails (red) before implementation

- [ ] AUTH-008.2 (AGENT): Implement `requireAuth` middleware with Bearer extraction, `verifyToken` call, `req.user` population, and TypeScript module augmentation.
  **File(s):** `artifacts/api-server/src/middlewares/auth.ts`
  **Verification:** All middleware tests pass (green); `pnpm typecheck` clean

- [ ] AUTH-008.N (HUMAN): Final review and sign-off — confirm no token logging and that `req.user` is fully typed.
  **Verification:** Approved.

---

## Auth Middleware Wave Completion Criteria

**Wave Status:** [ ] Complete (0/1 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-008 provides `requireAuth` for protecting all API endpoints in Phase 2 and beyond

**Dependencies:**
- AUTH-004 (JWT service provides `verifyToken`)
- ERROR-001 (global error handler for consistent 401 responses)
- ERROR-002 (domain error types: `TokenExpired`, `InvalidCredentials`)

**Next Wave:** AUTH-FRONTEND (can run in parallel with AUTH-MIDDLEWARE)

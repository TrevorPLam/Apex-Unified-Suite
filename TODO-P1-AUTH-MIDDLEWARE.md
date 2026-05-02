# TODO-P1-AUTH-MIDDLEWARE.md – Phase 1: Authentication Middleware

This document contains the cross-cutting authentication middleware that protects routes and enforces user authentication boundaries.

---

## [ ] AUTH-008: Implement Auth Middleware for Protected Routes
**Status:** ⏳ Not Started  
**Definition of Done:** `artifacts/api-server/src/middlewares/auth.ts` verifies JWT on incoming requests and sets `req.user`.  
**Note:** Until the global error handler (ERROR‑001) is implemented (Phase 1.5), errors from this middleware will be returned as plain HTTP 401 responses without a uniform envelope. This is acceptable temporarily.  
**Related Files:** `artifacts/api-server/src/middlewares/auth.ts`

**DDD:** The middleware enforces the authenticated user boundary for all downstream contexts.  
**TDD:** Write a test that an unprotected route returns 401 without token, and 200 with valid token.  
**BDD:** "As a user, I can access my profile only when authenticated."  
**Deep Module:** The middleware is a cross‑cutting concern; it hides token extraction and verification.

### Subtasks:
- [ ] AUTH-008.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-008.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-008.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-008.1: Write test for middleware (using supertest with a dummy route). (AGENT)  
  **verification:** `pnpm test -- auth.middleware.test.ts` red.
- [ ] AUTH-008.2: Implement middleware. (AGENT)  
  **verification:** Tests pass; `pnpm typecheck` clean.

---

## Auth Middleware Wave Completion Criteria

**Wave Status:** [ ] Complete (0/1 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-008 provides route protection for all authenticated endpoints
- Enables protected API endpoints in future phases

**Dependencies:**
- ERROR-001 (global error handling for consistent responses)
- AUTH-004 (JWT service for token verification)

**Next Wave:** AUTH-FRONTEND (can run in parallel)

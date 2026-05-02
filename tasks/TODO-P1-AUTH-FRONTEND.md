# TODO-P1-AUTH-FRONTEND.md – Phase 1: Frontend Authentication

This document contains frontend authentication tasks including auth context, token management, UI integration, and end-to-end testing. These tasks depend on backend API completion.

---

## [ ] AUTH-009: Create Frontend AuthContext and useAuth Hook
**Status:** ⏳ Not Started  
**Current state:** `contexts/` directory does not exist; no auth state management.  
**Definition of Done:** `contexts/AuthContext.tsx` holds current user and auth methods (`login`, `register`, `logout`); `hooks/useAuth.ts` consumes it.  
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`, `artifacts/apex‑os/src/hooks/useAuth.ts`

**DDD:** Frontend context mirrors the authenticated user identity from the server.  
**TDD:** Write a component test that simulates login and verifies the user object is available.  
**BDD:** "Given an authenticated user, the header shows their initials."  
**Deep Module:** The context acts as a deep module for authentication state; components only consume `useAuth()`.

### Subtasks:
- [ ] AUTH-009.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-009.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-009.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-009.1: Write context and hook. (AGENT)  
  **verification:** Component test with mocked API passes.
- [ ] AUTH-009.2: Wrap `App.tsx` with `AuthProvider`. (AGENT)  
  **verification:** `pnpm typecheck` passes; no runtime crash on app load.

---

## [ ] AUTH-010: Wire Custom Fetch to Auth Token
**Status:** ⏳ Not Started  
**Current state:** `setAuthTokenGetter()` exists but is never called.  
**Definition of Done:** When user logs in, `setAuthTokenGetter()` is called with the access token.  
**Related Files:** `artifacts/apex‑os/src/contexts/AuthContext.tsx`

### Subtasks:
- [ ] AUTH-010.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-010.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-010.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-010.1: In AuthContext, subscribe to token changes and call `setAuthTokenGetter`. (AGENT)  
  **verification:** Manual test (or E2E later) that API calls include `Authorization` header.
- [ ] AUTH-010.2: Write a component test verifying that after login, a fetch interceptor attaches the token. (AGENT)  
  **verification:** Test passes.

---

## [ ] AUTH-011: Replace Hardcoded Header User Initials
**Status:** ⏳ Not Started  
**Current state:** `Header.tsx:39` shows hardcoded "JS" initials.  
**Definition of Done:** `Header.tsx` reads `user` from `useAuth()` and displays real initials.  
**Related Files:** `artifacts/apex‑os/src/components/layout/Header.tsx`

### Subtasks:
- [ ] AUTH-011.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-011.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-011.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-011.1: Update Header to use auth state. (AGENT) – `Header.tsx`  
  **verification:** Component test with mocked auth context renders correct initials.
- [ ] AUTH-011.2: Write component test proving hardcoded initials are gone. (AGENT)  
  **verification:** Test passes.

---

## [ ] AUTH-012: Manual End‑to‑End Test of Auth Flow
**Status:** ⏳ Not Started  
**Definition of Done:** Register, login, logout, token refresh all work end‑to‑end in the browser.  
**Related Files:** N/A

**DDD:** Final validation that the Identity context is fully functional.  
**TDD:** N/A.  
**BDD:** This manual test follows `auth.feature` exactly.  
**Deep Module:** The entire auth subsystem is verified through its public API (UI and HTTP).

### Subtasks:
- [ ] AUTH-012.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] AUTH-012.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] AUTH-012.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] AUTH-012.1: Run the app and perform full auth journey (register with organization, login, refresh, logout). (HUMAN)  
  **verification:** Works end‑to‑end.

---

## Auth Frontend Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-009 provides authentication state management
- AUTH-010 ensures API calls include authentication tokens
- AUTH-011 integrates auth state with UI components
- AUTH-012 validates complete authentication flow

**Dependencies:**
- AUTH-API (backend endpoints must be functional)
- Generated React Query hooks from AUTH-001

**Next Wave:** Phase 1 Complete - move to Phase 2 (Database Schema)

# TODO-P1-AUTH-FRONTEND.md – Phase 1: Frontend Authentication

This document contains frontend authentication tasks including auth context, token management, UI integration, and end-to-end testing. These tasks depend on backend API completion.

---

## [ ] AUTH-009: Create Frontend AuthContext and useAuth Hook
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `contexts/` directory exists under `artifacts/apex-os/src/`. No auth state management exists. The app renders with no user session concept. The `hooks/` directory exists but contains only `use-mobile.tsx` and `use-toast.ts` — no auth-related hooks.
**Size:** Medium

**Description:** Create an `AuthContext` that manages current user state and exposes `login`, `register`, `logout` actions, and a `useAuth` hook for consuming the context — providing the auth state foundation for all frontend components.

**Depends on:** AUTH-001 (generated React Query hooks and types from codegen), AUTH-006/AUTH-007 (working backend auth endpoints)
**Blocks:** AUTH-010 (token wiring), AUTH-011 (header initials), AUTH-012 (E2E test)
**Related Files:** `artifacts/apex-os/src/contexts/AuthContext.tsx`, `artifacts/apex-os/src/hooks/useAuth.ts`, `artifacts/apex-os/src/App.tsx`

**Imports / Exports**
- Imports: Generated React Query mutation hooks from `@workspace/api-client-react`; `React`, `createContext`, `useContext`, `useState`, `useCallback` from `react`; `setAuthTokenGetter` from `@workspace/api-client-react` (custom-fetch)
- Exports: `AuthProvider` (React context provider component); `useAuth()` hook returning `{ user, login, register, logout, isLoading, isAuthenticated }`

**Definition of Done**
- [ ] `artifacts/apex-os/src/contexts/AuthContext.tsx` exists and compiles
- [ ] `artifacts/apex-os/src/hooks/useAuth.ts` exports `useAuth()` consuming `AuthContext`
- [ ] `AuthProvider` wraps `App.tsx` and is present in the component tree
- [ ] `useAuth()` provides: `user: User | null`, `login(credentials): Promise<void>`, `register(data): Promise<void>`, `logout(): void`, `isLoading: boolean`, `isAuthenticated: boolean`
- [ ] `login` calls the generated React Query mutation, stores received tokens, and updates `user` state
- [ ] `logout` clears user state and tokens
- [ ] `useAuth()` called outside `AuthProvider` throws a helpful error message
- [ ] Component test: simulate login → `user` object is available; simulate logout → `user` is null
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Token persistence across browser restarts (localStorage/sessionStorage strategy — separate task or Phase 2 decision)
- Automatic token refresh on expiry (future task)
- Role-based UI gating
- Social/OAuth login

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, actual tokens
- Never store tokens in Redux global store or module-level variables outside the auth context closure

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/contexts/AuthContext.tsx` (new file)
- Code changes in: `artifacts/apex-os/src/hooks/useAuth.ts` (new file)
- Code changes in: `artifacts/apex-os/src/App.tsx` (wrap with `AuthProvider`)
- Tests added/updated in: `artifacts/apex-os/src/__tests__/contexts/AuthContext.test.tsx` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `contexts/AuthContext.tsx`, `hooks/useAuth.ts`; revert `App.tsx` `AuthProvider` wrap
- Halt condition: if `pnpm typecheck` fails after wrapping `App.tsx`, revert `App.tsx` change first

**Rules to Follow**
- Token storage strategy (sessionStorage vs memory closure) must be documented with a rationale — OWASP recommends sessionStorage or JS closure over localStorage for access tokens (tokens in localStorage survive XSS attacks across tabs)
- `useAuth()` must throw a descriptive error (not just `undefined`) when called outside `AuthProvider` — prevents silent failures in deeply nested components
- `isAuthenticated` must be derived from `user !== null` — not from a separate boolean state (avoids state divergence)
- The context must use `useCallback` for stable function references (prevents unnecessary re-renders in consuming components)
- Access tokens must NEVER be returned from `useAuth()` — components must never have direct access to raw tokens; tokens are managed internally by the context

**Verification**
```bash
pnpm --filter @workspace/apex-os run typecheck
pnpm --filter @workspace/apex-os test -- AuthContext.test.tsx
pnpm --filter @workspace/apex-os run dev
# Manual: app loads without crash; auth state is undefined initially
```

**Advanced Code Patterns**
- JS closure token storage: store the access token in a `let` variable within the module scope of `AuthContext.tsx` (not in React state) so it is accessible to `setAuthTokenGetter` without being exposed to component consumers — see OWASP JWT Cheat Sheet token storage section
- `useCallback` for `login`, `register`, `logout` methods to maintain stable references across renders
- Optimistic `isLoading` state during auth mutations for responsive UX
- TanStack React Query `useMutation` for login/register/logout — leverages existing React Query setup; no custom fetch logic needed in the context

**Anti-Patterns**
- Storing access tokens in React state (`useState`) — causes unnecessary re-renders and exposes tokens to React DevTools
- Storing access tokens in `localStorage` — survives page closes and is accessible via XSS across all tabs (OWASP recommendation against this for short-lived tokens)
- Returning raw tokens from `useAuth()` — components must never hold tokens; they must go through the auth context
- Not throwing when `useAuth()` is called outside `AuthProvider` — leads to confusing undefined errors deep in the component tree
- Duplicating auth state in multiple contexts or stores

**DDD / TDD / BDD / Deep Module notes**
- DDD: The frontend `AuthContext` mirrors the authenticated user identity from the Identity & Access bounded context. It does not contain business logic — only state and API call orchestration.
- TDD: Write component tests that simulate login and verify `user` object is populated; simulate logout and verify `user` is null. Tests use mocked generated mutation hooks.
- BDD: "Given an authenticated user, the header shows their initials." This context enables that scenario.
- Deep Module: `AuthContext` acts as a deep module — components only consume `useAuth()` and never interact with token storage, API calls, or context internals.

---

### Subtasks

- [ ] AUTH-009.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-009.0.5 (AGENT): Research React 19 context patterns, OWASP token storage recommendations for SPAs, TanStack React Query v5 useMutation patterns, and JS closure token storage (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-009.0.75 (AGENT): Reason about the task — particularly the token storage strategy (closure vs sessionStorage) and the decision to never expose raw tokens from `useAuth()`.
  *If the token storage strategy is undecided, ask the user before executing.*

- [ ] AUTH-009.1 (AGENT): Create `AuthContext.tsx` and `useAuth.ts` with user state, login/register/logout methods, and the helpful outside-provider error.
  **File(s):** `artifacts/apex-os/src/contexts/AuthContext.tsx`, `artifacts/apex-os/src/hooks/useAuth.ts`
  **Verification:** Component test with mocked API passes; `pnpm typecheck` clean

- [ ] AUTH-009.2 (AGENT): Wrap `App.tsx` with `AuthProvider`.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm typecheck` passes; no runtime crash on app load (`pnpm dev`)

- [ ] AUTH-009.N (HUMAN): Final review and sign-off — confirm token storage strategy and that tokens are not exposed through `useAuth()`.
  **Verification:** Approved.

---

## [ ] AUTH-010: Wire Custom Fetch to Auth Token
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `setAuthTokenGetter()` exists in `lib/api-client-react/src/custom-fetch.ts` and is ready to inject Bearer tokens, but it is never called. All API calls from the frontend are currently unauthenticated.
**Size:** Small

**Description:** Call `setAuthTokenGetter()` from within `AuthContext` so that every API request made through the generated React Query hooks automatically includes the `Authorization: Bearer <token>` header after login.

**Depends on:** AUTH-009 (AuthContext provides the token source)
**Blocks:** AUTH-012 (E2E test — API calls need auth headers to succeed against protected routes)
**Related Files:** `artifacts/apex-os/src/contexts/AuthContext.tsx`, `lib/api-client-react/src/custom-fetch.ts`

**Imports / Exports**
- Imports: `setAuthTokenGetter` from `@workspace/api-client-react` (re-exported from `custom-fetch.ts`)
- Exports: [N/A] — internal wiring within `AuthContext.tsx`

**Definition of Done**
- [ ] After a successful `login()`, `setAuthTokenGetter(() => accessToken)` is called within `AuthContext`
- [ ] After `logout()`, `setAuthTokenGetter(null)` is called to remove the token getter
- [ ] A component test verifies that after login, a mock API fetch call includes the `Authorization: Bearer <token>` header
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Token refresh on 401 response (future task — interceptor/retry logic)
- Token persistence across browser restarts
- Any backend changes

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, actual tokens
- Never store the raw access token in React state or expose it via `useAuth()`

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/contexts/AuthContext.tsx`
- Tests added/updated in: `artifacts/apex-os/src/__tests__/contexts/AuthContext.test.tsx` (new test case)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — remove the `setAuthTokenGetter` calls from `AuthContext.tsx`
- Halt condition: if removing the wiring breaks other auth tests, investigate before reverting

**Rules to Follow**
- `setAuthTokenGetter` must be called synchronously within the `login` success callback — not in a `useEffect`
- `setAuthTokenGetter(null)` must be called on `logout` to prevent stale token injection after session ends
- The token getter function passed to `setAuthTokenGetter` must return the current token from the closure — not from React state (avoids stale closure issues)

**Verification**
```bash
pnpm --filter @workspace/apex-os run typecheck
pnpm --filter @workspace/apex-os test -- AuthContext.test.tsx
# Manual: After login, check Network tab — API requests include Authorization: Bearer header
```

**Advanced Code Patterns**
- JS closure getter: `setAuthTokenGetter(() => currentToken)` where `currentToken` is a module-level `let` variable updated on login/logout — this is the OWASP-recommended pattern for secure token injection in SPAs
- Calling `setAuthTokenGetter(null)` on logout ensures no stale tokens are injected into subsequent unauthenticated requests

**Anti-Patterns**
- Calling `setAuthTokenGetter` in a `useEffect` with `[token]` dependency — can cause a frame where requests fire before the getter is updated (race condition)
- Using React state as the token source in the getter — risks stale closure returning an old token if state updates haven't propagated
- Not calling `setAuthTokenGetter(null)` on logout — leaves the getter returning the old token for subsequent requests

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — this is infrastructure wiring
- TDD: Add a test case to the existing `AuthContext.test.tsx` that verifies the fetch interceptor attaches the token after login.
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] AUTH-010.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-010.0.5 (AGENT): Review `custom-fetch.ts` implementation and `setAuthTokenGetter` API to understand the exact calling convention (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-010.0.75 (AGENT): Reason about the token storage strategy — confirm the closure-based getter pattern is implemented in AUTH-009 before wiring here.
  *If token is stored in React state instead of a closure, fix AUTH-009 first.*

- [ ] AUTH-010.1 (AGENT): Subscribe to token changes in AuthContext and call `setAuthTokenGetter` on login and `setAuthTokenGetter(null)` on logout.
  **File(s):** `artifacts/apex-os/src/contexts/AuthContext.tsx`
  **Verification:** Component test verifies that after login, a mocked fetch call includes `Authorization: Bearer` header

- [ ] AUTH-010.2 (AGENT): Write a component test verifying the fetch interceptor attaches the token after login.
  **File(s):** `artifacts/apex-os/src/__tests__/contexts/AuthContext.test.tsx`
  **Verification:** Test passes

- [ ] AUTH-010.N (HUMAN): Final review — manual check in browser Network tab after login.
  **Verification:** Approved.

---

## [ ] AUTH-011: Replace Hardcoded Header User Initials
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `artifacts/apex-os/src/components/layout/Header.tsx` line 40 shows hardcoded `JS` initials in a button element. This does not reflect the actual authenticated user.
**Size:** Small

**Description:** Update `Header.tsx` to derive user initials dynamically from the `user` object returned by `useAuth()` — replacing the hardcoded "JS" with real user data.

**Depends on:** AUTH-009 (useAuth hook provides user object)
**Blocks:** AUTH-012 (E2E test visually validates the initials)
**Related Files:** `artifacts/apex-os/src/components/layout/Header.tsx`

**Imports / Exports**
- Imports: `useAuth` from `hooks/useAuth.ts`
- Exports: [N/A] — modification to existing component

**Definition of Done**
- [ ] `Header.tsx` imports and calls `useAuth()`
- [ ] User initials are derived from `user.fullName` (e.g., `"Sarah Jenkins"` → `"SJ"`) with a fallback to `"?"` when `user` is null
- [ ] No hardcoded `"JS"` string remains in `Header.tsx`
- [ ] Component test with mocked auth context renders correct initials for a known user
- [ ] Component test verifies fallback `"?"` renders when `user` is null (unauthenticated state)
- [ ] `pnpm typecheck` passes

**Out of Scope**
- User avatar image support
- Dropdown/menu on avatar click (future task)
- Displaying full name or email in the header

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never render PII (email, full name) directly in the header without a user consent/privacy review

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/layout/Header.tsx`
- Tests added/updated in: `artifacts/apex-os/src/__tests__/components/layout/Header.test.tsx` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert the initials derivation logic to the hardcoded `"JS"` string
- Halt condition: if `pnpm typecheck` fails, revert `Header.tsx` change immediately

**Rules to Follow**
- Initials derivation must handle edge cases: null user, single-word name (use first two characters), names with more than two words (use first and last word initials)
- Must provide a graceful fallback when `user` is null — show `"?"` or a generic avatar indicator, never crash
- Do not expose `user.email` or other PII in the rendered HTML without deliberate decision

**Verification**
```bash
pnpm --filter @workspace/apex-os run typecheck
pnpm --filter @workspace/apex-os test -- Header.test.tsx
pnpm --filter @workspace/apex-os run dev
# Manual: login with a real account and verify initials match
```

**Advanced Code Patterns**
- Pure initials derivation utility: `getInitials(fullName: string): string` — extract into `lib/utils.ts` if not already present, enables independent testing
- Graceful null handling with optional chaining: `user?.fullName ? getInitials(user.fullName) : '?'`

**Anti-Patterns**
- Hardcoded fallback to `"JS"` or any specific user's initials
- Rendering email or full name in the avatar (privacy concern — should be a deliberate UX decision)
- Not handling the null/unauthenticated state (causes a crash when `user` is null on initial load)
- Placing the initials derivation logic inline in JSX (hard to test; extract to a utility)

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — this is a UI integration task
- TDD: Write a component test first: mount `Header` with mocked `useAuth` returning `{ user: { fullName: 'Sarah Jenkins' } }` → assert "SJ" is rendered.
- BDD: "Given an authenticated user named Sarah Jenkins, the header shows 'SJ' initials."
- Deep Module: [N/A]

---

### Subtasks

- [ ] AUTH-011.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-011.0.5 (AGENT): Review `Header.tsx` lines 30-50 to confirm the exact location of the hardcoded "JS" and understand the surrounding component structure (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AUTH-011.0.75 (AGENT): Reason about initials edge cases — single-word names, null user, names with 3+ words. Plan the `getInitials` utility before coding.
  *No ambiguity expected; proceed.*

- [ ] AUTH-011.1 (AGENT): Update `Header.tsx` to use `useAuth()` and derive initials dynamically; add/use a `getInitials` utility.
  **File(s):** `artifacts/apex-os/src/components/layout/Header.tsx`, `artifacts/apex-os/src/lib/utils.ts`
  **Verification:** Component test with mocked auth context renders correct initials; hardcoded "JS" is gone

- [ ] AUTH-011.2 (AGENT): Write component tests covering correct initials, fallback "?", and null user.
  **File(s):** `artifacts/apex-os/src/__tests__/components/layout/Header.test.tsx`
  **Verification:** All tests pass

- [ ] AUTH-011.N (HUMAN): Final review — visually confirm initials in the running app.
  **Verification:** Approved.

---

## [ ] AUTH-012: Manual End-to-End Test of Auth Flow
**Status:** ⏳ Not Started
**Actor:** HUMAN
**Priority:** 🟠 High
**Current State:** All auth components are separately implemented and tested but no full end-to-end validation in the browser has been performed.
**Size:** [N/A]

**Description:** Manually validate the complete authentication journey in the running application — register, login, token refresh, and logout — confirming that frontend and backend work end-to-end.

**Depends on:** AUTH-009 (AuthContext), AUTH-010 (token wiring), AUTH-011 (header initials), AUTH-007 (integration tests green)
**Blocks:** Phase 1 completion gate
**Related Files:** N/A

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A]

**Definition of Done**
- [ ] Register a new user with a valid organization ID → success, redirected/logged in
- [ ] Login with registered credentials → 200, tokens present, header shows correct initials
- [ ] Access a protected API endpoint → 200 (auth header is included automatically)
- [ ] Wait for access token to expire → token is refreshed automatically (or refresh is triggered manually)
- [ ] Logout → user state cleared, subsequent API calls return 401
- [ ] All steps follow the `auth.feature` BDD scenarios exactly

**Out of Scope**
- Automated browser testing (Playwright/Cypress — future phase)
- Load or performance testing
- Any code changes during this task (if issues found, create new tasks)

**Safety Boundaries**
- Never test with production credentials or real user data
- Never commit test accounts or passwords

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: [N/A] — manual test only; no code changes
- Halt condition: if any step in the auth flow fails, create a new bug task and do not mark AUTH-012 complete

**Rules to Follow**
- Use only test/development credentials — never real user data
- Test against the local development environment only
- If a bug is found, document it as a new task rather than fixing inline during this test

**Verification**
```bash
pnpm --filter @workspace/apex-os run dev
pnpm --filter @workspace/api-server run dev
# Manual: follow auth.feature scenarios in browser
```

**Advanced Code Patterns**
- [N/A]

**Anti-Patterns**
- [N/A]

**DDD / TDD / BDD / Deep Module notes**
- DDD: Final validation that the Identity context is fully functional end-to-end.
- TDD: [N/A]
- BDD: This manual test follows `auth.feature` scenarios exactly — register, login, refresh, logout.
- Deep Module: The entire auth subsystem is validated through its public interface (UI and HTTP).

---

### Subtasks

- [ ] AUTH-012.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] AUTH-012.0.5 (AGENT): Review `auth.feature` to prepare the exact test scenarios the HUMAN will follow.
  *Summarize the test script for the HUMAN.*

- [ ] AUTH-012.0.75 (AGENT): Confirm all prerequisite tasks (AUTH-007, AUTH-009, AUTH-010, AUTH-011) are marked complete before scheduling the manual test.
  *If any prerequisite is incomplete, block AUTH-012.*

- [ ] AUTH-012.1 (HUMAN): Run the app and perform the full auth journey (register with organization, login, observe correct header initials, verify auth header on API call, token refresh, logout).
  **File(s):** N/A
  **Verification:** All steps in `auth.feature` pass end-to-end in the browser.

- [ ] AUTH-012.N (HUMAN): Final review and sign-off — Phase 1 auth complete.
  **Verification:** Approved.

---

## Auth Frontend Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- AUTH-009 provides authentication state management for all frontend components
- AUTH-010 ensures all generated API hooks include authentication tokens automatically
- AUTH-011 integrates auth state with the UI header
- AUTH-012 validates the complete auth flow end-to-end

**Dependencies:**
- AUTH-API wave complete (working backend auth endpoints)
- Generated React Query hooks from AUTH-001 codegen

**Next Wave:** Phase 1 Complete — move to Phase 2 (Database Schema & Identity Tables)

# TODO-P5-AUTH.md – Phase 5: Frontend Authentication

Covers the firm-side login/register pages, route guards, and the separate client portal authentication (magic-link flow). All tasks depend on the Phase 1 auth services (`AUTH-009` AuthContext, `AUTH-005` service types) being complete.

---

## [ ] FRONT‑AUTH‑001: Build Login / Register Pages (Firm)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `login.tsx` or `register.tsx` pages exist. The app has no authentication entry point — all routes are currently accessible without authentication.
**Size:** Small

**Description:** Create `pages/login.tsx` and `pages/register.tsx` using React Hook Form + Zod validation. Forms call `AuthContext.login()` / `AuthContext.register()`, map API domain errors to field-level messages, and redirect to `/dashboard` on success.

**Depends on:** AUTH‑009 (AuthContext with `login()`, `register()`, `isAuthenticated`), AUTH‑005 (service type definitions)
**Blocks:** FRONT‑AUTH‑002 (protected routes need a login destination)
**Related Files:** `artifacts/apex-os/src/pages/login.tsx`, `artifacts/apex-os/src/pages/register.tsx`, `artifacts/apex-os/src/App.tsx`

**Imports / Exports**
- Imports: `useAuth` from AuthContext; `useForm` from `react-hook-form`; `zodResolver` from `@hookform/resolvers/zod`; Zod schemas; `useLocation` from `wouter`
- Exports: `Login` default export; `Register` default export

**Definition of Done**
- [ ] `pages/login.tsx` renders email + password fields; calls `AuthContext.login()`; shows field-level error on `InvalidCredentials`; redirects to `/dashboard` on success
- [ ] `pages/register.tsx` renders full-name, email, password, organization name fields; calls `AuthContext.register()`; maps `DuplicateEmail` error to email field
- [ ] Both forms show a loading spinner on submission and disable the submit button during the request
- [ ] Routes `/login` and `/register` are added to `App.tsx` outside the `ProtectedRoute` wrapper
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass: form submission calls correct context method; error message appears on failure; redirect fires on success

**Out of Scope**
- "Forgot password" / reset flow (Phase 5+ feature)
- Multi-factor authentication UI
- Social OAuth login buttons

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/login.tsx`, `artifacts/apex-os/src/pages/register.tsx`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/login.test.tsx`, `artifacts/apex-os/src/pages/__tests__/register.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `login.tsx`, `register.tsx`; remove routes from `App.tsx`
- Halt condition: if `pnpm run typecheck` fails after route changes, stop and fix types before proceeding

**Rules to Follow**
- Use Zod schemas defined alongside the component for form validation (email format, password min-length 8, name required)
- Never store raw passwords in component state — React Hook Form handles form state; submit directly to `AuthContext.login()`
- Error messages must be user-friendly strings, not raw API error codes
- The organization field in `register.tsx` creates the org at registration time — do not allow blank org name

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- login.test.tsx
pnpm --filter @workspace/apex-os test -- register.test.tsx
```

**Advanced Code Patterns**
- Use `zodResolver` with `useForm` for declarative schema-driven validation
- Map API `DuplicateEmail` → `form.setError('email', { message: 'An account with this email already exists.' })`
- Redirect pattern with Wouter: `const [, navigate] = useLocation(); navigate('/dashboard')`

**Anti-Patterns**
- Custom validation logic instead of Zod — duplicates schema already defined in `lib/api-zod`
- Showing raw API error objects to users — always map to human-readable strings
- Not disabling the submit button during submission — allows double-submit race conditions

**DDD / TDD / BDD / Deep Module notes**
- DDD: Login/register are application-layer concerns; the AuthContext is the domain boundary — these pages delegate auth logic to it and handle only presentation.
- TDD: Write tests first for both success and failure paths before implementing form logic.
- BDD: "As a firm user, I can log in with email and password and be redirected to my dashboard."
- Deep Module: `AuthContext` is the deep module — login page calls `login(email, pass)` and receives either a redirect or an error; all JWT/token complexity is hidden inside AuthContext.

---

### Subtasks

- [ ] FRONT‑AUTH‑001.0.25 (AGENT): Read `AUTH-009` AuthContext implementation and `AUTH-005` service types to understand `login()`, `register()`, and error types.
  *No action — pause until fully understood.*

- [ ] FRONT‑AUTH‑001.0.5 (AGENT): Research React Hook Form v8 + Zod v3 field-error mapping pattern (May 2026). Confirm Wouter redirect API.
  *Document findings briefly.*

- [ ] FRONT‑AUTH‑001.1 (AGENT): Create `Login` page with email, password fields; wire to `AuthContext.login()`; add route to `App.tsx`.
  **File(s):** `artifacts/apex-os/src/pages/login.tsx`, `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; page renders at `/login`.

- [ ] FRONT‑AUTH‑001.2 (AGENT): Create `Register` page with full-name, email, password, org-name fields; map `DuplicateEmail` error; add route.
  **File(s):** `artifacts/apex-os/src/pages/register.tsx`, `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; page renders at `/register`.

- [ ] FRONT‑AUTH‑001.3 (AGENT): Write component tests for both pages using MSW.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/login.test.tsx`, `artifacts/apex-os/src/pages/__tests__/register.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- login.test.tsx register.test.tsx` → GREEN.

- [ ] FRONT‑AUTH‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑AUTH‑002: Implement Protected Routes & Route Guards (Firm)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** All firm pages (`/dashboard`, `/crm`, etc.) are accessible without authentication. `App.tsx` has no guards. The `isAuthenticated` flag from AuthContext is unused in routing.
**Size:** Small

**Description:** Create a `ProtectedRoute` component that checks `useAuth().isAuthenticated`; if false, redirects to `/login` preserving the attempted URL. Wrap all firm business pages with `ProtectedRoute` in `App.tsx`.

**Depends on:** FRONT‑AUTH‑001 (login page exists as redirect target), AUTH‑009 (AuthContext)
**Blocks:** All Phase 5 domain pages (Dashboard, CRM, Projects, Finance, Documents, Assets, Appointments, Settings, Analytics must be behind auth)
**Related Files:** `artifacts/apex-os/src/components/protected-route.tsx`, `artifacts/apex-os/src/App.tsx`

**Imports / Exports**
- Imports: `useAuth` from AuthContext; `Redirect`, `useLocation` from `wouter`
- Exports: `ProtectedRoute` component

**Definition of Done**
- [ ] `ProtectedRoute` component: if `isAuthenticated` is false, redirects to `/login?redirect={currentPath}`; if true, renders `children`
- [ ] All firm routes in `App.tsx` (Dashboard, CRM, Projects, Finance, Documents, Assets, Appointments, Analytics, Settings) wrapped with `ProtectedRoute`
- [ ] Portal routes (`/portal/*`) are NOT wrapped with the firm `ProtectedRoute` — they use `PortalProtectedRoute` from FRONT‑AUTH‑003
- [ ] Unit test: unauthenticated → redirect to `/login`; authenticated → renders children
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Role-based route access (RBAC) — Phase 5 uses simple authenticated/not-authenticated; RBAC is Phase 6+
- Portal route guarding (covered by FRONT‑AUTH‑003)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/protected-route.tsx`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/__tests__/protected-route.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `protected-route.tsx`; revert `App.tsx` wrapping
- Halt condition: if any firm route becomes inaccessible when authenticated, stop and verify AuthContext `isAuthenticated` flag

**Rules to Follow**
- `ProtectedRoute` must NOT fetch user data — it reads only from `AuthContext` which handles loading state
- Preserve the `?redirect=` query parameter so after login the user lands on the originally requested page
- The redirect query param must be URL-encoded: `encodeURIComponent(currentPath)`

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- protected-route.test.tsx
# Manual: navigate to /dashboard while logged out → confirm redirect to /login
```

**Advanced Code Patterns**
- Wouter's `<Redirect>` component for declarative redirects inside JSX
- Use `useAuth().isLoading` to avoid premature redirects during token refresh — show a spinner until auth state resolves

**Anti-Patterns**
- Checking `localStorage` for a token directly in `ProtectedRoute` — bypasses AuthContext and leads to state desync
- Wrapping the `<Switch>` itself instead of individual routes — breaks portal/public routes

**DDD / TDD / BDD / Deep Module notes**
- DDD: Route guarding is an application-layer concern, not domain logic. The guard delegates the auth decision to AuthContext.
- TDD: Unit test: mock `useAuth()` returning `{ isAuthenticated: false }` → assert `<Redirect to="/login" />` renders.
- BDD: "As an unauthenticated user, attempting to access /dashboard redirects me to /login."
- Deep Module: [N/A] — `ProtectedRoute` is a thin, narrow component with minimal logic.

---

### Subtasks

- [ ] FRONT‑AUTH‑002.0.25 (AGENT): Review `App.tsx` routing structure and note all firm vs portal routes.
  *No action — pause until fully understood.*

- [ ] FRONT‑AUTH‑002.1 (AGENT): Implement `ProtectedRoute` component with redirect and `?redirect=` param preservation.
  **File(s):** `artifacts/apex-os/src/components/protected-route.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑AUTH‑002.2 (AGENT): Wrap all firm routes in `App.tsx` with `ProtectedRoute`; leave portal/public routes unwrapped.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; manually confirm `/dashboard` redirects when logged out.

- [ ] FRONT‑AUTH‑002.3 (AGENT): Write unit tests for both auth states.
  **File(s):** `artifacts/apex-os/src/components/__tests__/protected-route.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- protected-route.test.tsx` → GREEN.

- [ ] FRONT‑AUTH‑002.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑AUTH‑003: Portal Authentication UI (Magic Link Flow)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No portal authentication exists. The portal page (`/portal`) is accessible without auth. No `PortalAuthContext`, portal login page, or portal verify page exist.
**Size:** Medium

**Description:** Implement a completely separate portal authentication system (isolated from firm auth): a `PortalAuthContext` with its own JWT storage, a `/portal/login` page that requests a magic link, a `/portal/verify` page that exchanges the token, and a `PortalProtectedRoute` guard for client-side portal pages.

**Depends on:** PORTAL‑AUTH‑001 (API endpoints: `POST /portal/auth/request-link`, `POST /portal/auth/verify`), EMAIL‑SERVICE‑001 (magic link email delivery)
**Blocks:** FRONT‑PORTAL‑001b (client-side portal data access)
**Related Files:** `artifacts/apex-os/src/contexts/PortalAuthContext.tsx`, `artifacts/apex-os/src/hooks/usePortalAuth.ts`, `artifacts/apex-os/src/pages/portal/login.tsx`, `artifacts/apex-os/src/pages/portal/verify.tsx`, `artifacts/apex-os/src/components/portal-protected-route.tsx`

**Imports / Exports**
- Imports: React `createContext`, `useContext`, `useState`; `useLocation` from `wouter`
- Exports: `PortalAuthContext`, `usePortalAuth()` hook, `PortalProtectedRoute` component

**Definition of Done**
- [ ] `PortalAuthContext` stores portal JWT in `localStorage` under a key distinct from firm auth (e.g., `apex_portal_token`); exposes `{ isAuthenticated, token, login(token), logout() }`
- [ ] `/portal/login` page: email input → `POST /portal/auth/request-link` → shows "Check your email" success message
- [ ] `/portal/verify?token=...` page: on mount, reads `?token` query param → `POST /portal/auth/verify` → stores portal JWT → redirects to `/portal/dashboard`
- [ ] `PortalProtectedRoute` guards `/portal/dashboard` and child routes; redirects unauthenticated users to `/portal/login`
- [ ] Firm auth state and portal auth state are entirely independent (different context, different localStorage key)
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass for portal login, verify, and route guard

**Out of Scope**
- Firm-side portal management UI (FRONT‑PORTAL‑001a)
- Portal auth via email/password (magic link only)
- Portal JWT refresh (magic links provide a new token each session)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Portal JWT must NEVER be stored in the same localStorage key as firm JWT — tenant isolation is critical

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/contexts/PortalAuthContext.tsx`, `artifacts/apex-os/src/hooks/usePortalAuth.ts`, `artifacts/apex-os/src/pages/portal/login.tsx`, `artifacts/apex-os/src/pages/portal/verify.tsx`, `artifacts/apex-os/src/components/portal-protected-route.tsx`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: `artifacts/apex-os/src/contexts/__tests__/PortalAuthContext.test.tsx`, `artifacts/apex-os/src/pages/portal/__tests__/login.test.tsx`, `artifacts/apex-os/src/pages/portal/__tests__/verify.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete context, hooks, pages, and component files; remove routes from `App.tsx`
- Halt condition: if portal login redirects to firm routes or vice versa, stop and verify context isolation

**Rules to Follow**
- Portal JWT storage key must be namespaced: `apex_portal_token` (not `token` or `auth_token`)
- The verify page must auto-submit on mount — do not require the user to click a button
- If the token is missing or invalid, `/portal/verify` must redirect to `/portal/login` with an error query param
- `usePortalAuth` must NOT import from `useAuth` (firm auth) — zero coupling between the two contexts

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- PortalAuthContext.test.tsx
pnpm --filter @workspace/apex-os test -- portal-login.test.tsx
pnpm --filter @workspace/apex-os test -- portal-verify.test.tsx
```

**Advanced Code Patterns**
- Use a single `PortalAuthProvider` at the app level that wraps portal routes only — avoids loading portal auth state for firm users
- The verify page's `useEffect` on mount calls the verify API; use a `status` state machine (`idle | verifying | success | error`) for clean loading/error UI
- Store the portal token with an expiry timestamp so `isAuthenticated` can check expiry client-side without an API call

**Anti-Patterns**
- Sharing AuthContext between firm and portal — single context would mix JWT types and org scopes
- Using `sessionStorage` for portal token — closes on tab close and breaks multi-tab workflows
- Exposing the raw portal JWT in component state instead of only in the context — risk of accidental logging

**DDD / TDD / BDD / Deep Module notes**
- DDD: The portal is a separate bounded context with its own auth sub-domain; its context provider is the anti-corruption layer between portal routes and the firm auth system.
- TDD: Test `PortalAuthContext`: call `login(token)` → assert `isAuthenticated` is true and `localStorage` updated; call `logout()` → assert cleared.
- BDD: "As a client, I can request a magic link to my email and, after clicking it, be authenticated into my portal without a password."
- Deep Module: `PortalAuthContext` is the deep module — callers get `isAuthenticated` and `login(token)`; all token parsing, expiry checking, and storage logic is hidden inside.

---

### Subtasks

- [ ] FRONT‑AUTH‑003.0.25 (AGENT): Read `PORTAL-AUTH-001` API spec for magic link endpoints and response shapes.
  *No action — pause until fully understood.*

- [ ] FRONT‑AUTH‑003.0.5 (AGENT): Confirm portal JWT payload shape (claims: `clientId`, `orgId`, `exp`) and storage isolation strategy.
  *Document findings briefly.*

- [ ] FRONT‑AUTH‑003.1 (AGENT): Implement `PortalAuthContext` and `usePortalAuth` hook with localStorage persistence.
  **File(s):** `artifacts/apex-os/src/contexts/PortalAuthContext.tsx`, `artifacts/apex-os/src/hooks/usePortalAuth.ts`
  **Verification:** `pnpm run typecheck` passes; unit test: `login(token)` → `isAuthenticated=true`.

- [ ] FRONT‑AUTH‑003.2 (AGENT): Create `/portal/login` page with email input and success message.
  **File(s):** `artifacts/apex-os/src/pages/portal/login.tsx`
  **Verification:** `pnpm run typecheck` passes; MSW mock intercepts `POST /portal/auth/request-link`.

- [ ] FRONT‑AUTH‑003.3 (AGENT): Create `/portal/verify` page that auto-submits token on mount and redirects on success.
  **File(s):** `artifacts/apex-os/src/pages/portal/verify.tsx`
  **Verification:** Renders "Verifying…" state; on success redirects to `/portal/dashboard`.

- [ ] FRONT‑AUTH‑003.4 (AGENT): Implement `PortalProtectedRoute` and add portal routes to `App.tsx`.
  **File(s):** `artifacts/apex-os/src/components/portal-protected-route.tsx`, `artifacts/apex-os/src/App.tsx`
  **Verification:** Unauthenticated portal user → redirects to `/portal/login`.

- [ ] FRONT‑AUTH‑003.5 (AGENT): Write component tests for context, login page, verify page, and route guard.
  **File(s):** `artifacts/apex-os/src/contexts/__tests__/PortalAuthContext.test.tsx`, `artifacts/apex-os/src/pages/portal/__tests__/login.test.tsx`, `artifacts/apex-os/src/pages/portal/__tests__/verify.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- PortalAuthContext.test.tsx portal-login.test.tsx portal-verify.test.tsx` → GREEN.

- [ ] FRONT‑AUTH‑003.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
